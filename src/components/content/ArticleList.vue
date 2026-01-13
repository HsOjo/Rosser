<template>
  <transition
    enter-active-class="animate__animated animate__fadeIn" appear
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div class="list-item" :class="{'list-item-unread': isUnread}" @click="open">
      <div class="list-thumb" v-if="thumb_id && !no_thumb">
        <img
          :src="`${backendURL}/api/basic/file/download/${thumb_id}`"
          @error="no_thumb = true"
          :alt="$t('article.previewImage')"
        />
      </div>
      <div class="list-thumb list-thumb-placeholder" v-else>
        <file-text-outlined />
      </div>
      <div class="list-content">
        <div class="list-title" :class="{'read-title': state['is_read'], 'hide-title': state['is_hide']}">
          <a-tag v-for="tag in articleTags" :key="tag.id" :color="tag.color" size="small" class="list-tag">
            {{ tag.name }}
          </a-tag>
          {{ title }}
        </div>
        <div class="list-meta">
          <span class="meta-subscription" v-if="subscription_title">{{ subscription_title }}</span>
          <span class="meta-separator" v-if="subscription_title && textSummary">·</span>
          <span class="meta-summary">{{ textSummary }}</span>
        </div>
      </div>
      <div class="list-info">
        <div class="list-time">{{ relativeTime }}</div>
        <div class="list-icons">
          <star-filled v-if="state['is_star']" class="icon-star" />
        </div>
      </div>
    </div>
  </transition>
  <a-modal v-model:visible="visible" width="80%" :title="viewTitle" style="top: 50px"
           :body-style="{'padding': '0', 'overflow-y': 'scroll', 'max-height': 'calc(100vh - 200px)'}">
    <template v-if="visible">
      <iframe v-if="raw_mode" :src="link" class="raw-content"></iframe>
      <DynamicContent v-else :content="truthSummary" class="content selectable"></DynamicContent>
    </template>
    <a-skeleton active :paragraph="{rows: 10}" v-else></a-skeleton>
    <template #footer>
      <div style="justify-content: space-between; display: flex">
        <div>
          <a-switch
            v-model:checked="raw_mode"
            :checked-children="$t('article.rawMode')"
            :un-checked-children="$t('article.articleMode')">
          </a-switch>
        </div>
        <div>
          <a-button v-if="state['is_hide']" @click="unhide(id)">
            {{ $t('article.unhide') }}
          </a-button>
          <a-button v-else @click="hide(id)">
            {{ $t('article.hide') }}
          </a-button>
          <a-button v-if="state['is_star']" @click="unstar(id)">
            {{ $t('article.unstar') }}
          </a-button>
          <a-button v-else @click="star(id)">
            {{ $t('article.star') }}
          </a-button>
          <a-button v-if="state['is_read']" @click="unread(id)">
            {{ $t('article.unread') }}
          </a-button>
          <a-button v-else @click="read(id)">
            {{ $t('article.read') }}
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<script lang="ts">
import {FileTextOutlined, StarFilled} from '@ant-design/icons-vue';
import {compile, defineComponent, h, ref} from 'vue';
import {mapGetters} from "vuex";
import api from "@/utils/api";
import DOMPurify from "dompurify"
import lodash from "lodash";
import {getArticleTags} from "@/utils/tags";
import {formatRelativeTime} from "@/utils/time";
import hljs from 'highlight.js'

const html2plaintext = require('html2plaintext')

export default defineComponent({
  inheritAttrs: false,
  components: {
    FileTextOutlined,
    StarFilled,
    DynamicContent: {
      props: {
        content: {type: String, default: ''}
      },
      render() {
        if (!this.content) {
          return h('div')
        }
        // 检查是否包含需要编译的 Vue 组件
        const hasVueComponents = /<a-[a-z-]+/i.test(this.content)
        if (!hasVueComponents) {
          return h('div', {innerHTML: this.content})
        }
        try {
          const compiled = compile(this.content)
          return h('div', [compiled.call(this, this)])
        } catch (e) {
          return h('div', {innerHTML: this.content})
        }
      }
    }
  },
  emits: ['patch'],
  props: {
    id: {type: Number, default: null},
    title: {type: String, default: ''},
    summary: {type: String, default: ''},
    link: {type: String, default: ''},
    thumb_id: {type: Number, default: null},
    state: {type: Object, default: null},
    subscription_title: {type: String, default: ''},
    publish_time: {type: String, default: ''},
  },
  data() {
    return {
      replace_tags: {
        img: {tag: 'a-image', attrs: ['src']},
        dir: {tag: 'div'},
      }
    }
  },
  computed: {
    ...mapGetters(['backendURL']),
    truthSummary() {
      let summary = DOMPurify.sanitize(this.summary)
      summary = summary.replaceAll('$file@', api.url('api/basic/file/download/'))

      let doc = new DOMParser().parseFromString(summary, 'text/html')
      for (let tag in this.replace_tags) {
        let item = this.replace_tags[tag]
        lodash.forEachRight(doc.getElementsByTagName(tag), el => {
          if (el) {
            let new_tag = doc.createElement(item.tag)
            if (item.attrs)
              item.attrs.map(attr => new_tag.setAttribute(attr, el.getAttribute(attr)))
            el.replaceWith(new_tag)
          }
        })
      }

      lodash.forEachRight(doc.querySelectorAll('pre code'), el => {
        hljs.highlightElement(el);
      })

      return doc.body.innerHTML
    },
    textSummary() {
      let summary = DOMPurify.sanitize(this.summary)
      let text = html2plaintext(summary)
      return text.length > 100 ? text.substring(0, 100) + '...' : text
    },
    viewTitle() {
      if (this.state['is_star'])
        return `🌟 ${this.title}`
      return this.title
    },
    articleTags() {
      return getArticleTags(this.state || {})
    },
    relativeTime() {
      if (!this.publish_time) return ''
      return formatRelativeTime(this.publish_time)
    },
    isUnread() {
      return this.state && !this.state['is_read']
    },
  },
  setup(props, {emit}) {
    const no_thumb = ref(false)
    const visible = ref(false)
    const raw_mode = ref(false)

    function patch_decorator(func) {
      return function (...args) {
        return func(...args).then(() => {
          emit('patch')
        })
      }
    }

    const hide = patch_decorator((id) => {
      return api.article.hide(id)
    })

    const unhide = patch_decorator((id) => {
      return api.article.unhide(id)
    })

    const star = patch_decorator((id) => {
      return api.article.star(id)
    })

    const unstar = patch_decorator((id) => {
      return api.article.unstar(id)
    })

    const read = patch_decorator((id) => {
      return api.article.read(id)
    })

    const unread = patch_decorator((id) => {
      return api.article.unread(id)
    })

    function open() {
      visible.value = true
      if (!this.state['is_read'])
        read(this.id)
    }

    return {
      api,
      no_thumb,
      visible,
      hide, unhide,
      star, unstar,
      read, unread,
      raw_mode,
      open,
    }
  }
});
</script>

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.list-item:hover {
  background: var(--bg-card-hover);
}

.list-item-unread {
  border-left: 3px solid #1890ff;
}

.list-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 12px;
}

.list-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  font-size: 20px;
}

.list-content {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
  text-align: left;
}

.list-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.list-tag {
  margin-right: 4px;
  font-size: 10px;
  line-height: 16px;
  padding: 0 4px;
}

.read-title {
  color: var(--text-tertiary);
  font-weight: normal;
}

.hide-title {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.list-meta {
  font-size: 12px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.meta-subscription {
  color: var(--text-secondary);
}

.meta-separator {
  margin: 0 6px;
}

.meta-summary {
  color: var(--text-tertiary);
}

.list-info {
  flex-shrink: 0;
  text-align: right;
  min-width: 80px;
}

.list-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.list-icons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.icon-star {
  color: #faad14;
  font-size: 14px;
}

.raw-content {
  height: calc(100vh - 224px);
  width: 100%;
  margin: 0;
  border: none;
}

.content {
  padding: 32px;
  height: fit-content;
  font-size: var(--article-font-size);
}

.content >>> img {
  max-width: 80%;
  max-height: 50vh;
  object-fit: contain;
}

.content >>> span {
  display: inline-block;
}
</style>
