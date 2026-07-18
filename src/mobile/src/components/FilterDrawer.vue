<template>
  <div
    class="bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 px-4 py-3 space-y-3 text-xs animate-slideDown"
  >
    <!-- Sort field -->
    <div class="space-y-1">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {{ t("sortField") }}
      </span>
      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="f in sortFields"
          :key="f.value"
          :disabled="disabled"
          class="p-1.5 rounded-lg border text-[10px] text-center truncate transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :class="
            field === f.value
              ? 'bg-brand-light dark:bg-brand/10 border-brand text-brand font-bold'
              : 'bg-transparent border-slate-100 dark:border-zinc-800 text-slate-500'
          "
          @click="$emit('update:field', f.value)"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Sort direction -->
    <div class="space-y-1">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {{ t("sortDirection") }}
      </span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="d in sortDirections"
          :key="d.value"
          :disabled="disabled"
          class="p-1.5 rounded-lg border text-[10px] text-center truncate transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :class="
            direction === d.value
              ? 'bg-brand-light dark:bg-brand/10 border-brand text-brand font-bold'
              : 'bg-transparent border-slate-100 dark:border-zinc-800 text-slate-500'
          "
          @click="$emit('update:direction', d.value)"
        >
          {{ d.label }}
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

export type SortField = "publish_time" | "title" | "read_time";
export type SortDirection = "asc" | "desc";

const props = defineProps<{
  field: SortField;
  direction: SortDirection;
  pageSize: number;
  disabled?: boolean;
}>();

defineEmits<{
  (e: "update:field", value: SortField): void;
  (e: "update:direction", value: SortDirection): void;
  (e: "update:pageSize", value: number): void;
}>();

const { t } = useI18n();

const pageSizes = [20, 50, 100];

const sortFields = computed(() => [
  { value: "publish_time" as SortField, label: t("sortFieldPublishTime") },
  { value: "title" as SortField, label: t("sortFieldTitle") },
  { value: "read_time" as SortField, label: t("sortFieldReadTime") },
]);

const sortDirections = computed(() => [
  { value: "asc" as SortDirection, label: t("sortDirectionAsc") },
  { value: "desc" as SortDirection, label: t("sortDirectionDesc") },
]);
</script>
