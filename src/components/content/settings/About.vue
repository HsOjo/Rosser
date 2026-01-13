<template>
  <a-typography>
    <a-typography-title>R[L]oSSer</a-typography-title>
    <a-typography-paragraph>
      {{ $t('settings.about.description') }}
    </a-typography-paragraph>
    <a-typography-paragraph>
      Press
      <a-typography-text keyboard>Esc</a-typography-text>
      to exit...
    </a-typography-paragraph>
    <a-typography-paragraph>
      {{ starText }}
      <a-typography-link href="https://github.com/HsOjo/Rosser">GitHub</a-typography-link>
      {{ starTextEnd }}
    </a-typography-paragraph>
  </a-typography>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'

const {t, locale} = useI18n()

const starText = computed(() => {
  if (locale.value === 'zh') {
    return '如果喜欢，请到'
  }
  return 'If you like it, please give a star on'
})

const starTextEnd = computed(() => {
  if (locale.value === 'zh') {
    return '给个Star，谢谢。'
  }
  return '. Thanks!'
})
</script>

<style scoped>

</style>
