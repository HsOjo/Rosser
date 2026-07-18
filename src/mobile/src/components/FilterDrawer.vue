<template>
  <div
    class="bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 px-4 py-3 space-y-3 text-xs animate-slideDown"
  >
    <!-- Sort options -->
    <div class="space-y-1">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {{ t("orderBy") }}
      </span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          class="p-1.5 rounded-lg border text-[10px] text-left truncate transition-colors"
          :class="
            modelValue === opt.value
              ? 'bg-brand-light dark:bg-brand/10 border-brand text-brand font-bold'
              : 'bg-transparent border-slate-100 dark:border-zinc-800 text-slate-500'
          "
          @click="$emit('update:modelValue', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Page size -->
    <div class="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-2 text-[10px]">
      <span class="font-bold text-slate-400 uppercase">{{ t("pageSize") }}</span>
      <div class="flex gap-1.5">
        <button
          v-for="size in pageSizes"
          :key="size"
          class="p-1 px-2 rounded-lg font-bold border transition-colors"
          :class="
            pageSize === size
              ? 'bg-brand-light border-brand text-brand dark:bg-brand/10'
              : 'bg-transparent border-slate-100 dark:border-zinc-800 text-slate-400'
          "
          @click="$emit('update:pageSize', size)"
        >
          {{ size }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ArticleListQuery } from "@/stores/article";

type SortOrder = NonNullable<ArticleListQuery["order"]>;

const props = defineProps<{
  modelValue: SortOrder;
  pageSize: number;
}>();

defineEmits<{
  (e: "update:modelValue", value: SortOrder): void;
  (e: "update:pageSize", value: number): void;
}>();

const { t } = useI18n();

const pageSizes = [20, 50, 100];

const sortOptions = computed(() => [
  { value: "publish_time desc" as SortOrder, label: t("sortPublishTimeDesc") },
  { value: "publish_time asc" as SortOrder, label: t("sortPublishTimeAsc") },
  { value: "title asc" as SortOrder, label: t("sortTitleAsc") },
  { value: "title desc" as SortOrder, label: t("sortTitleDesc") },
  { value: "read_time desc" as SortOrder, label: t("sortReadTimeDesc") },
  { value: "read_time asc" as SortOrder, label: t("sortReadTimeAsc") },
]);
</script>
