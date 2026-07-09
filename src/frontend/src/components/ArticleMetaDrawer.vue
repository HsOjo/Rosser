<template>
  <n-drawer
    v-model:show="show"
    :to="drawerTarget"
    placement="right"
    width="100%"
    :block-scroll="false"
    :close-on-esc="true"
    :style="{ '--n-border-radius': '0' }"
  >
    <n-drawer-content :title="t('metaInspector')" :closable="true">
      <n-data-table
        v-if="metaTreeData.length"
        :columns="metaColumns"
        :data="metaTreeData"
        :row-props="metaRowProps"
        default-expand-all
        size="small"
        :bordered="false"
        :single-line="false"
        :scroll-x="320"
      />
      <n-empty v-else :description="t('noData')" />
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  drawerTarget?: HTMLElement | null;
}>();

const show = ref(false);
const meta = ref<any>(null);

const metaColumns = computed(() => [
  {
    title: t("metaKey"),
    key: "key",
    width: 160,
    ellipsis: { tooltip: true },
  },
  {
    title: t("metaType"),
    key: "type",
    width: 100,
  },
  {
    title: t("metaValue"),
    key: "value",
    minWidth: 160,
    ellipsis: { tooltip: true },
  },
]);

interface MetaTreeRow {
  key: string;
  keyPath: string;
  label: string;
  type: string;
  value: string;
  depth: number;
  children?: MetaTreeRow[];
}

function buildMetaTree(obj: any, parentKey = "", depth = 0): MetaTreeRow[] {
  if (obj === null) {
    return [
      {
        key: parentKey || "null",
        keyPath: parentKey || "null",
        label: parentKey ? parentKey.split(".").pop() || "" : "null",
        type: "null",
        value: "null",
        depth,
      },
    ];
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return [
        {
          key: parentKey,
          keyPath: parentKey,
          label: parentKey ? parentKey.split(".").pop() || "" : "",
          type: "array",
          value: "[]",
          depth,
        },
      ];
    }
    return obj.flatMap((item, idx) => {
      const itemKey = parentKey ? `${parentKey}.${idx}` : String(idx);
      const children = buildMetaTree(item, itemKey, depth + 1);
      if (children.length === 1 && children[0].key === itemKey) {
        return children;
      }
      return [
        {
          key: itemKey,
          keyPath: itemKey,
          label: String(idx),
          type: "array",
          value: "",
          depth,
          children,
        },
      ];
    });
  }
  if (typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return [
        {
          key: parentKey,
          keyPath: parentKey,
          label: parentKey ? parentKey.split(".").pop() || "" : "",
          type: "object",
          value: "{}",
          depth,
        },
      ];
    }
    return keys.flatMap((k) => {
      const childKey = parentKey ? `${parentKey}.${k}` : k;
      const children = buildMetaTree(obj[k], childKey, depth + 1);
      if (children.length === 1 && children[0].key === childKey) {
        return children;
      }
      return [
        {
          key: childKey,
          keyPath: childKey,
          label: k,
          type: "object",
          value: "",
          depth,
          children,
        },
      ];
    });
  }
  return [
    {
      key: parentKey,
      keyPath: parentKey,
      label: parentKey ? parentKey.split(".").pop() || "" : String(obj),
      type: typeof obj,
      value: String(obj),
      depth,
    },
  ];
}

const metaTreeData = computed(() => {
  if (!meta.value || typeof meta.value !== "object") return [];
  return buildMetaTree(meta.value);
});

function metaRowProps(row: MetaTreeRow) {
  return {
    style: {
      paddingLeft: `${row.depth * 12}px`,
    },
  };
}

function open(metaValue: any) {
  meta.value = metaValue;
  show.value = true;
}

function close() {
  show.value = false;
}

defineExpose({ open, close });
</script>
