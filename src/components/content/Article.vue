<template>
  <transition
    enter-active-class="animate__animated animate__zoomIn" appear
    leave-active-class="animate__animated animate__zoomOut"
  >
    <a-card hoverable class="card">
      <template #cover>
        <img :src="`${backendURL}/api/basic/file/download/${thumb_id}`"
             v-if="thumb_id && !no_thumb"
             @error="no_thumb = true"
             alt="预览图" class="thumb-img"
             @click="open"
        />
        <template v-else-if="!isLongTitle">
          <div style="padding: 12px" @click="open">
            <a-typography-paragraph
              :ellipsis="{ rows: 3 }"
              :content="textSummary">
            </a-typography-paragraph>
          </div>
        </template>
        <div
          class="card-title"
          :class="{
            'read-title': state['is_read'],
            'hide-title': state['is_hide'],
          }"
          @click="open"
        >
          <div class="title-tags" v-if="articleTags.length > 0">
            <a-tag v-for="tag in articleTags" :key="tag.id" :color="tag.color" size="small">
              {{ tag.name }}
            </a-tag>
          </div>
          {{ title }}
        </div>
      </template>
    </a-card>
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
            checked-children="原文模式"
            un-checked-children="文章模式">
          </a-switch>
        </div>
        <div>
          <a-button v-if="state['is_hide']" @click="unhide(id)">
            取消隐藏
          </a-button>
          <a-button v-else @click="hide(id)">
            隐藏
          </a-button>
          <a-button v-if="state['is_star']" @click="unstar(id)">
            取消星标
          </a-button>
          <a-button v-else @click="star(id)">
            星标
          </a-button>
          <a-button v-if="state['is_read']" @click="unread(id)">
            取消已读
          </a-button>
          <a-button v-else @click="read(id)">
            已读
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<script lang="ts">
import {EditOutlined, EllipsisOutlined, SettingOutlined, StarFilled, StarOutlined} from '@ant-design/icons-vue';
import {compile, computed, defineComponent, h, ref} from 'vue';
import {mapGetters} from "vuex";
import api from "@/utils/api";
import DOMPurify from "dompurify"
import lodash from "lodash";
import {getArticleTags} from "@/utils/tags";

import hljs from 'highlight.js'

const html2plaintext = require('html2plaintext')

export default defineComponent({
  inheritAttrs: false,
  components: {
    SettingOutlined,
    EditOutlined,
    EllipsisOutlined,
    StarOutlined,
    StarFilled,
    DynamicContent: {
      props: {
        content: {type: String, default: ''}
      },
      render() {
        return h('div', [compile(this.content).call(this, this)])
      }
    }
  },
  emits: ['patch'],
  props: {
    id: {type: Number, default: null},
    title: {type: String, default: '无标题'},
    summary: {type: String, default: '无摘要'},
    link: {type: String, default: ''},
    thumb_id: {type: Number, default: null},
    state: {type: Object, default: null},
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
    isLongTitle() {
      return this.title.length > 32
    },
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
      return html2plaintext(summary)
    },
    viewTitle() {
      if (this.state['is_star'])
        return `🌟 ${this.title}`
      return this.title
    },
    articleTags() {
      return getArticleTags(this.state || {})
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
.card {
  width: 240px;
  height: fit-content;
  padding: 0;
}

.card-title {
  font-weight: bold;
  padding: 16px;
  bottom: 0;
  z-index: 1;
  background: var(--card-title-bg);
  color: var(--text-primary);
}

.title-tags {
  margin-bottom: 4px;
}

.title-tags :deep(.ant-tag) {
  margin-right: 4px;
  font-size: 10px;
  line-height: 16px;
  padding: 0 4px;
}

.read-title {
  color: var(--text-tertiary);
}

.hide-title {
  color: var(--text-tertiary);
  opacity: 0.7;
}

.thumb-img {
  max-height: 192px;
  object-fit: cover;
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