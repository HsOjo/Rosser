<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useStore} from "vuex";
import api from "@/utils/api";
import {useI18n} from "vue-i18n";
import {LoadingOutlined} from "@ant-design/icons-vue";

const store = useStore()
const {t} = useI18n()
const form_state = ref({
  url: '',
  title: '',
  description: '',
  category_title: '',
})
const fetching = ref(false)

const editData = computed(() => store.getters.state.subscribe_edit_data)
const isEditMode = computed(() => !!editData.value)

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
const categoryIDTitleMapping = computed(
  () => {
    let result = {}
    for (let category of store.getters.state.categories)
      result[category.id] = category.title
    return result
  })
const filterOption = (input: string, option) => {
  return option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0;
};

watch(editData, (newData) => {
  if (newData) {
    form_state.value = {
      url: newData.url || '',
      title: newData.title || '',
      description: newData.description || '',
      category_title: categoryIDTitleMapping.value[newData.category_id] || '',
    }
  } else {
    form_state.value = {
      url: '',
      title: '',
      description: '',
      category_title: '',
    }
  }
})

function handleOk() {
  let category_title = form_state.value.category_title
  let category_id = categoryTitleIDMapping.value[category_title]

  const submitAction = (cid) => {
    if (isEditMode.value) {
      api.subscription.edit(
        editData.value.id,
        form_state.value.url,
        form_state.value.title,
        form_state.value.description,
        cid
      ).then(
        () => {
          handleClose()
          store.commit('refreshState')
        }
      )
    } else {
      api.subscription.add(
        form_state.value.url,
        form_state.value.title,
        form_state.value.description,
        cid
      ).then(
        () => {
          handleClose()
          store.commit('refreshState')
        }
      )
    }
  }

  if (category_title && category_title.length && !category_id) {
    api.category.add(category_title, null).then(
      resp => {
        submitAction(resp.data.id)
      }
    )
  } else {
    submitAction(category_id)
  }
}

function handleClose() {
  store.commit('updateState', {
    subscribe_modal_visible: false,
    subscribe_edit_data: null
  })
}

function fetchTitle() {
  if (!form_state.value.url) return
  fetching.value = true
  api.subscription.preview(form_state.value.url).then(
    resp => {
      if (resp.data.title) {
        form_state.value.title = resp.data.title
      }
      if (resp.data.description && !form_state.value.description) {
        form_state.value.description = resp.data.description
      }
    }
  ).finally(() => {
    fetching.value = false
  })
}

</script>

<template>
  <a-modal v-model:visible="store.getters.state.subscribe_modal_visible"
           :title="isEditMode ? $t('subscribe.editTitle') : $t('subscribe.modalTitle')"
           @ok="handleOk"
           @cancel="handleClose">
    <a-form
      :model="form_state"
      name="basic"
      autocomplete="off"
    >

      <a-form-item
        :label="$t('subscribe.subscriptionUrl')"
        name="url"
        :rules="[{ required: true, message: $t('subscribe.subscriptionUrlRequired') }]"
      >
        <a-input-group compact>
          <a-input v-model:value="form_state.url" style="width: calc(100% - 100px)"/>
          <a-button @click="fetchTitle" :loading="fetching" :disabled="!form_state.url">
            {{ $t('subscribe.fetchTitle') }}
          </a-button>
        </a-input-group>
      </a-form-item>

      <a-form-item
        :label="$t('subscribe.subscriptionTitle')"
        name="title"
      >
        <a-input v-model:value="form_state.title" :placeholder="$t('subscribe.titlePlaceholder')"/>
      </a-form-item>

      <a-form-item
        :label="$t('subscribe.subscriptionCategory')"
        name="category_title"
      >
        <a-auto-complete
          v-model:value="form_state.category_title"
          :options="categoryOptions"
          style="width: 200px"
          :placeholder="$t('subscribe.categoryPlaceholder')"
          :filter-option="filterOption"
        />
      </a-form-item>

      <a-form-item
        :label="$t('common.description')"
        name="description"
      >
        <a-textarea v-model:value="form_state.description"/>
      </a-form-item>

    </a-form>
    <template #footer>
      <a-button key="submit" type="primary" @click="handleOk">
        {{ isEditMode ? $t('subscribe.updateNow') : $t('subscribe.subscribeNow') }}
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>

</style>
