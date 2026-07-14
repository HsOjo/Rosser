<template>
  <div ref="contentRef" class="space-y-4">
    <component
      :is="rendererFor(item.type)"
      v-for="(item, idx) in resolvedContent"
      :key="idx"
      v-bind="propsFor(item, idx)"
      @update:headings="onHeadings(idx, $event)"
      @preview="onPreview(idx, $event)"
    />

    <ImagePreviewOverlay
      v-model="showPreview"
      :images="previewImages"
      :initial-index="previewIndex"
      @update:index="previewIndex = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { resolveFilePlaceholders } from "@rosser/shared";
import type { components } from "@rosser/shared/api";
import { useConnectionStore } from "@/stores/connection";
import HtmlRender from "./render/HtmlRender.vue";
import PlainTextRender from "./render/PlainTextRender.vue";
import UnsupportedRender from "./render/UnsupportedRender.vue";
import ImagePreviewOverlay from "./render/ImagePreviewOverlay.vue";
import type { HeadingItem } from "./render/HtmlRender.vue";

export interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

const props = defineProps<{
  content?: components["schemas"]["ArticleContentItem"][] | null;
  summary?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:headings", headings: OutlineItem[]): void;
}>();

const conn = useConnectionStore();
const contentRef = ref<HTMLDivElement | null>(null);
const resolvedContent = ref<{ type: string; value: string }[]>([]);
const headingMap = ref<Map<number, OutlineItem[]>>(new Map());
const showPreview = ref(false);
const previewImages = ref<string[]>([]);
const previewIndex = ref(0);

const isPreviewOpen = computed(() => showPreview.value);

function rendererFor(type: string) {
  if (type === "text/html") return HtmlRender;
  if (type === "text/plain") return PlainTextRender;
  return UnsupportedRender;
}

function propsFor(item: { type: string; value: string }, idx: number) {
  if (item.type === "text/html") {
    return { html: item.value, blockIndex: idx };
  }
  if (item.type === "text/plain") {
    return { text: item.value };
  }
  return { type: item.type };
}

async function resolveContent() {
  headingMap.value.clear();
  const items: { type: string; value: string }[] = [];
  const rawContent = props.content;

  if (Array.isArray(rawContent) && rawContent.length > 0) {
    for (const item of rawContent) {
      if (item.value) {
        items.push({
          type: item.type || "text/plain",
          value: await resolveFilePlaceholders(
            item.value,
            conn.baseURL,
            conn.token,
          ),
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      type: "text/html",
      value: await resolveFilePlaceholders(
        props.summary || "",
        conn.baseURL,
        conn.token,
      ),
    });
  }

  resolvedContent.value = items;
}

function onHeadings(idx: number, headings: HeadingItem[]) {
  headingMap.value.set(idx, headings as OutlineItem[]);
  const merged: OutlineItem[] = [];
  const keys = Array.from(headingMap.value.keys()).sort((a, b) => a - b);
  for (const key of keys) {
    const list = headingMap.value.get(key);
    if (list) merged.push(...list);
  }
  emit("update:headings", merged);
}

function onPreview(
  _idx: number,
  payload: { images: string[]; index: number },
) {
  previewImages.value = payload.images;
  previewIndex.value = payload.index;
  showPreview.value = true;
}

function closePreview() {
  showPreview.value = false;
}

watch(
  () => [props.content, props.summary],
  () => resolveContent(),
  { immediate: true, deep: true },
);

defineExpose({
  isPreviewOpen,
  closePreview,
});
</script>
