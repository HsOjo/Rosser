<template>
  <div
    v-if="hasData"
    class="pl-3 border-l border-slate-700/50 space-y-1"
  >
    <div
      v-for="entry in entries"
      :key="entry.key"
      class="text-[10px]"
    >
      <div class="flex items-start gap-1">
        <span class="text-brand font-bold font-mono shrink-0">{{ entry.key }}:</span>

        <span
          v-if="entry.isLeaf"
          class="truncate select-all cursor-pointer hover:underline"
          :class="valueClass(entry.value)"
          @dblclick="$emit('copy', String(entry.value))"
        >
          {{ formatValue(entry.value) }}
        </span>

        <button
          v-else
          class="flex items-center gap-0.5 text-slate-500 dark:text-zinc-500 hover:text-brand dark:hover:text-brand transition-colors"
          @click="toggle(entry.key)"
        >
          <component
            :is="expanded[entry.key] ? ChevronDownOutline : ChevronForwardOutline"
            class="w-3 h-3 shrink-0"
          />
          <span class="font-mono">{{ entry.summary }}</span>
        </button>
      </div>

      <MetaTree
        v-if="!entry.isLeaf && expanded[entry.key]"
        :data="entry.value"
        class="mt-1"
        @copy="$emit('copy', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ChevronForwardOutline, ChevronDownOutline } from "@vicons/ionicons5";

type TreeValue = unknown;

const props = defineProps<{
  data: TreeValue;
}>();

defineEmits<{
  (e: "copy", value: string): void;
}>();

const expanded = ref<Record<string, boolean>>({});

const hasData = computed(() => {
  return props.data != null && typeof props.data === "object" && Object.keys(props.data).length > 0;
});

const entries = computed(() => {
  if (!hasData.value) return [];
  const source = props.data as Record<string, unknown> | unknown[];
  const keys = Array.isArray(source)
    ? source.map((_, i) => String(i))
    : Object.keys(source);

  return keys.map((key) => {
    const value = Array.isArray(source)
      ? source[Number(key)]
      : (source as Record<string, unknown>)[key];
    const isLeaf = !isExpandable(value);
    return {
      key,
      value,
      isLeaf,
      summary: isLeaf ? "" : getSummary(value),
    };
  });
});

function isExpandable(val: unknown): boolean {
  return val !== null && typeof val === "object" && !isPrimitive(val);
}

function isPrimitive(val: unknown): boolean {
  return (
    val === null ||
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  );
}

function getSummary(val: unknown): string {
  if (Array.isArray(val)) {
    return `[${val.length}]`;
  }
  if (typeof val === "object" && val !== null) {
    return `{${Object.keys(val).length}}`;
  }
  return "";
}

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (typeof val === "string") return val;
  return String(val);
}

function valueClass(val: unknown): string {
  if (val === null) return "text-slate-400 dark:text-zinc-500";
  if (typeof val === "string") return "text-amber-600 dark:text-amber-400";
  if (typeof val === "number") return "text-emerald-600 dark:text-emerald-400";
  if (typeof val === "boolean") return "text-blue-600 dark:text-blue-400";
  return "text-slate-300 dark:text-zinc-400";
}

function toggle(key: string) {
  expanded.value[key] = !expanded.value[key];
}
</script>
