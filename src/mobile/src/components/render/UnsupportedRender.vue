<template>
  <div
    class="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[10px] rounded-xl leading-relaxed"
  >
    {{ t("unsupportedType", { type }) }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{ type: string }>();
</script>
