<template>
  <a-card hoverable class="card" @click="visible = true">
    <template #cover>
      <img :src="`${backendURL}/api/basic/file/download/${thumb_id}`"
           v-if="thumb_id && !no_thumb"
           @error="no_thumb = true"
           alt="预览图" class="thumb-img"/>
      <div class="card-title">{{ title }}</div>
    </template>
  </a-card>
  <a-modal v-model:visible="visible" width="80%" :title="title" style="top: 50px"
           body-style="padding: 0; overflow-y: scroll; max-height: calc(100vh - 200px)">
    <div v-html="truthSummary" class="content"></div>
  </a-modal>
</template>

<script lang="ts">
import {EditOutlined, EllipsisOutlined, SettingOutlined} from '@ant-design/icons-vue';
import {defineComponent, ref} from 'vue';
import {mapGetters} from "vuex";
import api from "@/utils/api";
import DOMPurify from "dompurify"

export default defineComponent({
  components: {
    SettingOutlined,
    EditOutlined,
    EllipsisOutlined,
  },
  props: {
    title: {type: String, default: '无标题'},
    summary: {type: String, default: '无摘要'},
    thumb_id: {type: Number, default: null},
  },
  computed: {
    ...mapGetters(['backendURL']),
    truthSummary() {
      let summary = DOMPurify.sanitize(this.summary)
      summary = summary.replaceAll('$file@', api.url('api/basic/file/download/'))
      return summary
    }
  },
  setup(props) {
    const no_thumb = ref(false)
    const visible = ref(false)
    return {
      no_thumb,
      visible
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