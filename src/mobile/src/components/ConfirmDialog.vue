<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    @click.self="onCancel"
  >
    <div class="w-full max-w-[320px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
      <div class="flex items-center gap-2 text-brand">
        <slot name="icon" />
        <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-100">
          {{ title }}
        </h4>
      </div>
      <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
        {{ message }}
      </p>
      <div class="flex gap-2 justify-end pt-1">
        <button
          type="button"
          class="px-4 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/50 text-xs font-semibold text-slate-600 dark:text-zinc-300 rounded-xl transition-colors"
          @click="onCancel"
        >
          {{ t(cancelText) }}
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-brand hover:bg-brand-hover text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-brand/10 active:scale-[0.98] transition-all"
          :class="confirmButtonClass"
          @click="onConfirm"
        >
          <component :is="CheckmarkOutline" class="w-3.5 h-3.5" />
          {{ t(confirmText) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckmarkOutline } from "@vicons/ionicons5";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
  }>(),
  {
    confirmText: "confirm",
    cancelText: "cancel",
  }
);

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function onConfirm() {
  emit("confirm");
  emit("update:visible", false);
}

function onCancel() {
  emit("cancel");
  emit("update:visible", false);
}
</script>
