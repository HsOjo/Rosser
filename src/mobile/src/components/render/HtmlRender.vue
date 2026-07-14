<template></template>

<script lang="ts">
import { defineComponent, h, type VNode, ref, watch } from "vue";
import DOMPurify from "dompurify";

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const ALLOWED_ATTRS = new Set([
  "class",
  "style",
  "id",
  "href",
  "src",
  "alt",
  "title",
  "colspan",
  "rowspan",
  "width",
  "height",
  "align",
  "valign",
  "dir",
  "lang",
  "start",
  "type",
  "value",
  "rel",
  "target",
]);

const TEXT_TAG_CLASSES: Record<string, string> = {
  strong: "font-bold",
  b: "font-bold",
  em: "italic",
  i: "italic",
  u: "underline",
  del: "line-through",
  s: "line-through",
  code: "font-mono text-[0.85em] bg-slate-100 dark:bg-zinc-800/60 px-1 py-0.5 rounded",
};

const HEADING_MAP: Record<string, string> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
};

const BLOCK_MAP: Record<string, string> = {
  p: "p",
  ul: "ul",
  ol: "ol",
  li: "li",
  blockquote: "blockquote",
  hr: "hr",
  table: "table",
};

export interface HeadingItem {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

interface ParseContext {
  blockIndex: number;
  seq: number;
  headings: HeadingItem[];
}

interface ParseResult {
  vnode: VNode;
  headings: HeadingItem[];
  images: string[];
}

function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

function extractAttrs(el: Element): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const attr of Array.from(el.attributes)) {
    if (!ALLOWED_ATTRS.has(attr.name)) continue;
    if (attr.name === "style") {
      attrs.style = attr.value;
    } else if (attr.name === "class") {
      attrs.class = attr.value;
    } else {
      attrs[attr.name] = attr.value;
    }
  }
  return attrs;
}

function mergeClasses(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

function renderComponent(
  tag: string,
  props: Record<string, any>,
  children: (VNode | string)[] | undefined,
): VNode {
  return children === undefined ? h(tag, props) : h(tag, props, children);
}

function generateHeadingId(ctx: ParseContext): string {
  return `heading-${ctx.blockIndex}-${ctx.seq++}`;
}

function domNodeToVNode(
  node: Node,
  ctx: ParseContext,
  images: string[],
  emitPreview: (index: number) => void,
): VNode | string | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || null;
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as Element;
  const tagName = el.tagName.toLowerCase();
  const attrs = extractAttrs(el);
  const children = VOID_TAGS.has(tagName)
    ? undefined
    : Array.from(el.childNodes)
        .map((child) => domNodeToVNode(child, ctx, images, emitPreview))
        .filter((c): c is VNode | string => c !== null);

  if (tagName === "img") {
    const src = el.getAttribute("src") || "";
    const index = images.length;
    images.push(src);
    return h("figure", { class: "my-4" }, [
      h("img", {
        src,
        alt: el.getAttribute("alt") || "",
        title: el.getAttribute("title") || undefined,
        class: mergeClasses(
          "rounded-2xl shadow-md max-w-full h-auto max-h-[50dvh] cursor-zoom-in",
          "hover:scale-[1.01] transition-transform duration-200",
        ),
        referrerpolicy: "no-referrer",
        onClick: (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          emitPreview(index);
        },
      }),
    ]);
  }

  if (tagName === "a") {
    const href = el.getAttribute("href") || "";
    attrs.class = mergeClasses(
      attrs.class,
      "text-brand font-semibold underline underline-offset-2",
    );
    if (isExternalHref(href)) {
      attrs.target = "_blank";
      attrs.rel = "noopener noreferrer";
    }
    return renderComponent("a", attrs, children);
  }

  if (tagName in TEXT_TAG_CLASSES) {
    attrs.class = mergeClasses(attrs.class, TEXT_TAG_CLASSES[tagName]);
    return renderComponent("span", attrs, children);
  }

  if (tagName in HEADING_MAP) {
    const baseClasses =
      "font-bold text-slate-800 dark:text-zinc-100 scroll-mt-16";
    const sizeClasses: Record<string, string> = {
      h1: "text-lg mt-5 mb-2.5",
      h2: "text-base mt-5 mb-2.5",
      h3: "text-sm mt-4 mb-2",
      h4: "text-sm mt-3 mb-1.5",
      h5: "text-xs mt-3 mb-1",
      h6: "text-xs mt-3 mb-1",
    };
    if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
      const id = attrs.id || generateHeadingId(ctx);
      attrs.id = id;
      ctx.headings.push({
        id,
        level: tagName === "h1" ? 1 : tagName === "h2" ? 2 : 3,
        text: el.textContent?.trim() || "",
      });
    }
    attrs.class = mergeClasses(attrs.class, baseClasses, sizeClasses[tagName]);
    return renderComponent(HEADING_MAP[tagName], attrs, children);
  }

  if (tagName in BLOCK_MAP) {
    const blockClasses: Record<string, string> = {
      p: "mb-3.5",
      ul: "list-disc pl-5 mb-3.5",
      ol: "list-decimal pl-5 mb-3.5",
      li: "mb-1",
      blockquote:
        "border-l-[3px] border-brand pl-4 ml-0 my-3 text-slate-600 dark:text-zinc-400",
      hr: "border-slate-100 dark:border-zinc-800 my-4",
      table: "max-w-full w-full table-fixed border-collapse",
    };
    attrs.class = mergeClasses(attrs.class, blockClasses[tagName]);
    return renderComponent(BLOCK_MAP[tagName], attrs, children);
  }

  if (tagName === "tr") {
    attrs.class = mergeClasses(
      attrs.class,
      "border-b border-slate-100 dark:border-zinc-800",
    );
    return renderComponent("tr", attrs, children);
  }

  if (tagName === "th" || tagName === "td") {
    attrs.class = mergeClasses(
      attrs.class,
      "px-2 py-1 text-left align-top break-words",
    );
    return renderComponent(tagName, attrs, children);
  }

  if (tagName === "pre") {
    attrs.class = mergeClasses(
      attrs.class,
      "overflow-x-auto max-w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-[11px]",
    );
    return renderComponent("pre", attrs, children);
  }

  if (tagName === "code") {
    attrs.class = mergeClasses(
      attrs.class,
      "font-mono text-[0.85em] bg-slate-100 dark:bg-zinc-800/60 px-1 py-0.5 rounded",
    );
    return renderComponent("code", attrs, children);
  }

  return h(tagName, attrs, children as any);
}

function parseHtml(
  html: string,
  blockIndex: number,
  emitPreview: (index: number) => void,
): ParseResult {
  const sanitized = DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "id"],
  });
  const doc = new DOMParser().parseFromString(sanitized, "text/html");
  const ctx: ParseContext = { blockIndex, seq: 0, headings: [] };
  const images: string[] = [];
  const children = Array.from(doc.body.childNodes)
    .map((node) => domNodeToVNode(node, ctx, images, emitPreview))
    .filter((c): c is VNode | string => c !== null);

  const vnode = h(
    "div",
    {
      class:
        "markdown-body text-xs text-slate-700 dark:text-zinc-300 leading-relaxed break-words",
    },
    children,
  );

  return { vnode, headings: ctx.headings, images };
}

export default defineComponent({
  props: {
    html: {
      type: String,
      required: true,
    },
    blockIndex: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:headings", "preview"],
  setup(props, { emit }) {
    const result = ref<ParseResult | null>(null);

    function parse() {
      result.value = parseHtml(props.html, props.blockIndex, (index) => {
        if (!result.value) return;
        emit("preview", { images: result.value.images.slice(), index });
      });
      emit("update:headings", result.value.headings);
    }

    watch(
      () => [props.html, props.blockIndex],
      parse,
      { immediate: true },
    );

    return () => result.value?.vnode;
  },
});
</script>
