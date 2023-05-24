<template>
  <transition
    enter-active-class="animate__animated animate__zoomIn" appear
    leave-active-class="animate__animated animate__zoomOut"
  >
    <a-card hoverable class="card" @click="visible = true">
      <template #cover>
        <img :src="`${backendURL}/api/basic/file/download/${thumb_id}`"
             v-if="thumb_id && !no_thumb"
             @error="no_thumb = true"
             alt="预览图" class="thumb-img"/>
        <div class="card-title">{{ title }}</div>
      </template>
    </a-card>
  </transition>
  <a-modal v-model:visible="visible" width="80%" :title="title" style="top: 50px"
           :body-style="{'padding': '0', 'overflow-y': 'scroll', 'max-height': 'calc(100vh - 200px)'}">
    <DynamicContent :content="truthSummary" class="content selectable"></DynamicContent>
    <template #footer>
      <a-button v-if="state['is_hide']" @click="api.article.unhide(id)">
        取消隐藏
      </a-button>
      <a-button v-else @click="api.article.hide(id)">
        隐藏
      </a-button>
      <a-button v-if="state['is_star']" @click="api.article.unstar(id)">
        取消星标
      </a-button>
      <a-button v-else @click="api.article.star(id)">
        星标
      </a-button>
      <a-button v-if="state['is_read']" @click="api.article.unread(id)">
        取消已读
      </a-button>
      <a-button v-else @click="api.article.read(id)">
        已读
      </a-button>
    </template>
  </a-modal>
</template>

<script lang="ts">
import {EditOutlined, EllipsisOutlined, SettingOutlined} from '@ant-design/icons-vue';
import {compile, defineComponent, h, ref} from 'vue';
import {mapGetters} from "vuex";
import api from "@/utils/api";
import DOMPurify from "dompurify"
import lodash from "lodash";

export default defineComponent({
  components: {
    SettingOutlined,
    EditOutlined,
    EllipsisOutlined,
    DynamicContent: {
      props: {
        content: {type: String, default: ''}
      },
      render() {
        return h('div', [compile(this.content).call(this, this)])
      }
    }
  },
  props: {
    id: {type: Number, default: null},
    title: {type: String, default: '无标题'},
    summary: {type: String, default: '无摘要'},
    thumb_id: {type: Number, default: null},
    state: {type: Object, default: null},
  },
  computed: {
    ...mapGetters(['backendURL']),
    truthSummary() {
      let summary = DOMPurify.sanitize(this.summary)
      summary = summary.replaceAll('$file@', api.url('api/basic/file/download/'))

      let doc = new DOMParser().parseFromString(summary, 'text/html')
      lodash.forEachRight(doc.getElementsByTagName('img'), el => {
        if (el) {
          let img = doc.createElement('a-image')
          img.setAttribute('src', el.getAttribute('src'))
          el.replaceWith(img)
        }
      })

      return doc.body.innerHTML
    }
  },
  setup(props) {
    const no_thumb = ref(false)
    const visible = ref(false)
    return {
      api,
      no_thumb,
      visible,
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
  background: rgba(255, 255, 255, 0.5);
}

.thumb-img {
  max-height: 192px;
  object-fit: cover;
}

.content {
  padding: 32px;
  height: fit-content;
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