<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useStore} from "vuex";
import api from "@/utils/api";
import {useI18n} from "vue-i18n";

const store = useStore()
const {t} = useI18n()
const form_state = ref({
  title: '',
  description: '',
})

const editData = computed(() => store.getters.state.category_edit_data)
const isEditMode = computed(() => !!editData.value)

watch(editData, (newData) => {
  if (newData) {
    form_state.value = {
      title: newData.title || '',
      description: newData.description || '',
    }
  } else {
    form_state.value = {
      title: '',
      description: '',
    }
  }
})

function handleOk() {
  if (isEditMode.value) {
    api.category.edit(
      editData.value.id,
      form_state.value.title,
      form_state.value.description,
    ).then(
      () => {
        handleClose()
        store.commit('refreshState')
      }
    )
  } else {
    api.category.add(
      form_state.value.title,
      form_state.value.description,
    ).then(
      () => {
        handleClose()
        store.commit('refreshState')
      }
    )
  }
}

function handleClose() {
  store.commit('updateState', {
    category_modal_visible: false,
    category_edit_data: null
  })
}

</script>

<template>
  <a-modal v-model:visible="store.getters.state.category_modal_visible"
           :title="isEditMode ? $t('category.editTitle') : $t('category.modalTitle')"
           @ok="handleOk"
           @cancel="handleClose">
    <a-form
      :model="form_state"
      name="basic"
      autocomplete="off"
    >

      <a-form-item
        :label="$t('category.categoryTitle')"
        name="title"
        :rules="[{ required: true, message: $t('category.categoryTitleRequired') }]"
      >
        <a-input v-model:value="form_state.title"/>
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
        {{ isEditMode ? $t('category.updateNow') : $t('category.createNow') }}
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>

</style>
