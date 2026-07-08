<template>
  <div class="app" style="max-width: 480px; margin: 0 auto;">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useI18n } from "vue-i18n";

const { locale } = useI18n();

watch(locale, (val) => {
  localStorage.setItem("rosser_locale", val);
});
</script>
