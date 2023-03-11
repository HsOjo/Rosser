<template>
  <a-card hoverable class="card">
    <template #cover>
      <img :src="thumb_img" v-if="thumb_img" @error="no_thumb = true" alt="预览图"/>
      <div class="card-title">{{ title }}</div>
    </template>
  </a-card>
</template>

<script lang="ts">
import {EditOutlined, EllipsisOutlined, SettingOutlined} from '@ant-design/icons-vue';
import {defineComponent, ref} from 'vue';
import axios from "@/plugins/axios";


export default defineComponent({
  components: {
    SettingOutlined,
    EditOutlined,
    EllipsisOutlined,
  },
  props: {
    title: {type: String, default: '无标题'},
    summary: {type: String, default: '无摘要'},
    thumb_img: {type: String, default: null},
  },
  setup(props) {
    axios().get(props.thumb_img).then(
        resp => {
          console.log(resp)
        }
    )
    const no_thumb = ref(false)
    return {no_thumb}
  }
});
</script>

<style scoped>
.card {
  width: 250px;
  padding: 0;
}

.card-title {
  font-weight: bold;
  padding: 16px;
  bottom: 0;
  z-index: 1;
  background: rgba(255, 255, 255, 0.5);
}
</style>