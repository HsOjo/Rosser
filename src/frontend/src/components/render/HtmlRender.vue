<template></template>

<script lang="ts">
import { defineComponent, h, type VNode } from "vue";
import {
  NImage,
  NImageGroup,
  NButton,
  NText,
  NP,
  NH1,
  NH2,
  NH3,
  NH4,
  NH5,
  NH6,
  NUl,
  NOl,
  NLi,
  NBlockquote,
  NHr,
  NTable,
} from "naive-ui";
import { openExternal } from "@/platform";

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
  "checked",
  "disabled",
  "readonly",
  "selected",
  "multiple",
  "maxlength",
  "placeholder",
  "name",
  "for",
  "rel",
  "target",
]);

const TEXT_TAG_PROPS: Record<string, Record<string, any>> = {
  strong: { strong: true },
  b: { strong: true },
  em: { italic: true },
  i: { italic: true },
  u: { underline: true },
  del: { delete: true },
  s: { delete: true },
  code: { code: true },
};

const HEADING_MAP: Record<string, any> = {
  h1: NH1,
  h2: NH2,
  h3: NH3,
  h4: NH4,
  h5: NH5,
  h6: NH6,
};

const BLOCK_MAP: Record<string, any> = {
  p: NP,
  ul: NUl,
  ol: NOl,
  li: NLi,
  blockquote: NBlockquote,
  hr: NHr,
};

function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

function handleAnchorClick(e: MouseEvent, href: string) {
  if (!href || !isExternalHref(href)) return;
  e.preventDefault();
  void openExternal(href);
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

function renderComponent(
  component: any,
  props: Record<string, any>,
  children: (VNode | string)[] | undefined,
): VNode {
  return children === undefined
    ? h(component, props)
    : h(component, props, { default: () => children });
}

function domNodeToVNode(node: Node): VNode | string | null {
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
        .map(domNodeToVNode)
        .filter((c): c is VNode | string => c !== null);

  if (tagName === "img") {
    return h(
      "span",
      {
        class: "html-render-image",
        style: { display: "block" },
        onClick: (e: MouseEvent) => e.stopPropagation(),
      },
      [
        h(NImage, {
          src: el.getAttribute("src") || "",
          alt: el.getAttribute("alt") || "",
          title: el.getAttribute("title") || undefined,
          showToolbar: true,
        }),
      ],
    );
  }

  if (tagName === "a") {
    const href = el.getAttribute("href") || "";
    return renderComponent(
      NButton,
      {
        text: true,
        size: "small",
        title: attrs.title || undefined,
        onClick: (e: MouseEvent) => handleAnchorClick(e, href),
      },
      children,
    );
  }

  if (tagName in TEXT_TAG_PROPS) {
    return renderComponent(NText, { ...attrs, ...TEXT_TAG_PROPS[tagName] }, children);
  }

  if (tagName in HEADING_MAP) {
    return renderComponent(HEADING_MAP[tagName], attrs, children);
  }

  if (tagName in BLOCK_MAP) {
    return renderComponent(BLOCK_MAP[tagName], attrs, children);
  }

  if (tagName === "table") {
    return renderComponent(NTable, attrs, children);
  }

  return h(tagName, attrs, children as any);
}

function hasImage(nodes: (VNode | string)[]): boolean {
  for (const node of nodes) {
    if (typeof node === "string") continue;
    if (node.type === NImage) return true;
    if (Array.isArray(node.children)) {
      if (hasImage(node.children as (VNode | string)[])) return true;
    }
  }
  return false;
}

function renderHtml(html: string): VNode {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const children = Array.from(doc.body.childNodes)
    .map(domNodeToVNode)
    .filter((c): c is VNode | string => c !== null);

  if (hasImage(children)) {
    return h(NImageGroup, {}, { default: () => children });
  }

  return h("div", { class: "html-render-root" }, children);
}

export default defineComponent({
  props: {
    html: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => renderHtml(props.html);
  },
});
</script>

<style scoped>
.html-render-root {
  display: block;
}
:deep(.html-render-image) {
  display: block;
  text-align: left;
}
:deep(.n-image) {
  max-width: 50% !important;
  display: inline-block;
}
:deep(.n-image img) {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
  display: block;
}
:deep(table) {
  max-width: 100%;
  width: 100%;
  table-layout: fixed;
}
:deep(pre) {
  overflow-x: auto;
  max-width: 100%;
}
:deep(pre),
:deep(code) {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
