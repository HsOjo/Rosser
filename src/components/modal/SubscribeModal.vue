<script setup lang="ts">
import {computed, ref} from "vue";
import {useStore} from "vuex";
import api from "@/utils/api";

const visible = ref(false)
const store = useStore()
const form_state = ref({
  url: '',
  title: '',
  description: '',
  category_title: '',
})
const categoryOptions = computed(
  () => store.getters.state.categories.map(category => ({
    value: category.title,
  })))
const categoryTitleIDMapping = computed(
  () => {
    let result = {}
    for (let category of store.getters.state.categories)
      result[category.title] = category.id
    return result
  })
const filterOption = (input: string, option) => {
  return option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0;
};

function handleOk() {
  let subscriptionAdd = (category_id) => {
    api.subscription.add(
      form_state.value.url,
      form_state.value.title,
      form_state.value.description,
      category_id
    ).then(
      () => {
        store.commit('refreshState')
      }
    )
  }

  let category_id = categoryTitleIDMapping.value[form_state.value.category_title]
  if (!category_id) {
    api.category.add(form_state.value.category_title, null).then(
      resp => {
        subscriptionAdd(resp.data.id)
      }
    )
  } else {
    subscriptionAdd(category_id)
  }

  visible.value = false
}

</script>

<template>
  <a-modal v-model:visible="store.getters.state.subscribe_modal_visible"
           title="订阅内容" @ok="handleOk">
    <a-form
      :model="form_state"
      name="basic"
      autocomplete="off"
    >

      <a-form-item
        label="订阅标题"
        name="title"
        :rules="[{ required: true, message: '请输入订阅标题！' }]"
      >
        <a-input v-model:value="form_state.title"/>
      </a-form-item>

      <a-form-item
        label="订阅URL"
        name="url"
        :rules="[{ required: true, message: '请输入订阅URL！' }]"
      >
        <a-input v-model:value="form_state.url"/>
      </a-form-item>

      <a-form-item
        label="订阅分类"
        name="category_title"
      >
        <a-auto-complete
          v-model:value="form_state.category_title"
          :options="categoryOptions"
          style="width: 200px"
          placeholder="？选择 or 输入"
          :filter-option="filterOption"
        />
      </a-form-item>

      <a-form-item
        label="描述内容"
        name="description"
      >
        <a-textarea v-model:value="form_state.description"/>
      </a-form-item>

    </a-form>
    <template #footer>
      <a-button key="submit" type="primary" @click="handleOk">
        这就订阅！
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>

</style>