<template>
  <a-card hoverable class="card">
    <template #cover>
      <img :src="`${backendURL}/api/basic/file/download/${thumb_id}`"
           v-if="thumb_id && !no_thumb"
           @error="no_thumb = true"
           alt="预览图" class="thumb-img"/>
      <div class="card-title">{{ title }}</div>
    </template>
  </a-card>
</template>

<script lang="ts">
import {EditOutlined, EllipsisOutlined, SettingOutlined} from '@ant-design/icons-vue';
import {defineComponent, ref} from 'vue';
import {useStore} from "vuex";


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
  setup(props) {
    const store = useStore()
    const no_thumb = ref(false)
    return {no_thumb, backendURL: store.getters.backendURL}
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
</style>