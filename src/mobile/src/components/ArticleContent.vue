<template>
  <div ref="contentRef" class="space-y-4" @click="handleClick">
    <div
      v-for="(item, idx) in resolvedContent"
      :key="idx"
      class="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed break-words"
    >
      <div
        v-if="item.type === 'text/html'"
        class="markdown-body"
        v-html="item.value"
      />
      <pre
        v-else-if="item.type === 'text/plain'"
        class="whitespace-pre-wrap break-words font-mono text-[11px] bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-800"
      >{{ item.value }}</pre>
      <div
        v-else
        class="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[10px] rounded-xl"
      >
        {{ t("unsupportedType", { type: item.type }) }}
      </div>
    </div>

    <!-- Image preview overlay -->
    <div
      v-if="previewImage"
      class="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
      @click="previewImage = null"
    >
      <button
        class="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20"
        @click.stop="previewImage = null"
      >
        <component :is="Close" class="w-6 h-6" />
      </button>
      <img
        :src="previewImage"
        alt="preview"
        class="max-w-full max-h-full object-contain rounded-xl"
        referrerpolicy="no-referrer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { Close } from "@vicons/ionicons5";
import { resolveFilePlaceholders } from "@rosser/shared";
import DOMPurify from "dompurify";
import type { components } from "@rosser/shared/api";
import { useConnectionStore } from "@/stores/connection";

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

const { t } = useI18n();
const conn = useConnectionStore();

const contentRef = ref<HTMLDivElement | null>(null);
const resolvedContent = ref<{ type: string; value: string }[]>([]);
const previewImage = ref<string | null>(null);

let headingCounter = 0;

async function resolveContent() {
  headingCounter = 0;
  const items: { type: string; value: string }[] = [];
  const rawContent = props.content;

  if (Array.isArray(rawContent) && rawContent.length > 0) {
    for (const item of rawContent) {
      if (item.value) {
        items.push({
          type: item.type || "text/plain",
          value: await processHtml(item.value),
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      type: "text/html",
      value: await processHtml(props.summary || ""),
    });
  }

  resolvedContent.value = items;

  await nextTick();
  emit("update:headings", extractHeadings());
}

async function processHtml(raw: string) {
  let html = await resolveFilePlaceholders(raw, conn.baseURL, conn.token);
  html = DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "id"],
  });

  const div = document.createElement("div");
  div.innerHTML = html;

  // Assign heading ids and styles
  div.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    headingCounter++;
    heading.setAttribute("id", `heading-anchor-${headingCounter}`);
    heading.classList.add(
      "scroll-mt-16",
      "font-bold",
      "text-slate-800",
      "dark:text-zinc-100",
      "mt-5",
      "mb-2.5"
    );
  });

  // Ensure links open externally
  div.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href.startsWith("http") || href.startsWith("mailto") || href.startsWith("tel")) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
    a.classList.add(
      "text-brand",
      "font-semibold",
      "underline",
      "underline-offset-2"
    );
  });

  // Style images
  div.querySelectorAll("img").forEach((img) => {
    img.classList.add(
      "rounded-2xl",
      "shadow-md",
      "my-4",
      "max-w-full",
      "h-auto",
      "cursor-zoom-in",
      "hover:scale-[1.01]",
      "transition-transform"
    );
    img.setAttribute("referrerpolicy", "no-referrer");
  });

  return div.innerHTML;
}

function extractHeadings(): OutlineItem[] {
  const headings: OutlineItem[] = [];
  if (!contentRef.value) return headings;

  contentRef.value.querySelectorAll("h1, h2, h3").forEach((heading) => {
    const id = heading.getAttribute("id");
    if (!id) return;
    headings.push({
      id,
      text: heading.textContent || "Untitled Heading",
      level: parseInt(heading.tagName.substring(1)),
    });
  });
  return headings;
}

function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === "IMG") {
    const src = target.getAttribute("src");
    if (src) previewImage.value = src;
  }
}

watch(
  () => [props.content, props.summary],
  () => resolveContent(),
  { immediate: true, deep: true }
);
</script>
