<template>
  <div class="p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-2">
    <div class="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
      <component :is="PricetagOutline" class="w-3.5 h-3.5" />
      <span>{{ t("tagManagement") }}</span>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="tag in tagStore.tags"
        :key="tag.id"
        class="py-1 px-2.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all border"
        :class="
          selectedIds.includes(tag.id)
            ? 'text-white scale-105'
            : 'bg-transparent text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
        "
        :style="{
          backgroundColor: selectedIds.includes(tag.id) ? (tag.color || '#9ca3af') : undefined,
          borderColor: selectedIds.includes(tag.id) ? (tag.color || '#9ca3af') : undefined,
        }"
        @click="toggleTag(tag.id)"
      >
        {{ tag.title }}
        <component
          v-if="selectedIds.includes(tag.id)"
          :is="CheckmarkOutline"
          class="w-3 h-3"
        />
      </button>

      <button
        v-if="!showNew"
        class="py-1 px-2.5 rounded-full text-[10px] font-bold border border-dashed border-slate-300 dark:border-zinc-700 text-slate-400 hover:text-brand hover:border-brand transition-colors"
        @click="showNew = true"
      >
        + {{ t("addTag") }}
      </button>

      <div v-else class="flex items-center gap-1">
        <input
          ref="newInput"
          v-model="newTagName"
          type="text"
          class="w-24 py-1 px-2 text-[10px] rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-brand outline-none"
          :placeholder="t('tagTitle')"
          @keydown.enter="createAndSelect"
        />
        <button
          class="p-1 rounded-lg bg-brand text-white hover:bg-brand-hover"
          @click="createAndSelect"
        >
          <component :is="CheckmarkOutline" class="w-3 h-3" />
        </button>
        <button
          class="p-1 rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-300"
          @click="showNew = false"
        >
          <component :is="CloseOutline" class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import {
  PricetagOutline,
  CheckmarkOutline,
  CloseOutline,
} from "@vicons/ionicons5";
import { useTagStore } from "@/stores";
import { colors } from "@/utils/colors";

const props = defineProps<{
  articleId: string;
  tagIds: string[];
}>();

const emit = defineEmits<{
  (e: "change", tagIds: string[]): void;
}>();

const { t } = useI18n();
const tagStore = useTagStore();

const selectedIds = ref<string[]>([...props.tagIds]);
const showNew = ref(false);
const newTagName = ref("");
const newInput = ref<HTMLInputElement | null>(null);

const existingTagCount = computed(() => tagStore.tags.length);

function randomColor() {
  return colors[existingTagCount.value % colors.length];
}

watch(
  () => props.tagIds,
  (val) => {
    selectedIds.value = [...val];
  }
);

watch(showNew, (val) => {
  if (val) nextTick(() => newInput.value?.focus());
});

function toggleTag(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
  } else {
    selectedIds.value.push(id);
  }
  emit("change", selectedIds.value);
}

async function createAndSelect() {
  const name = newTagName.value.trim();
  if (!name) return;
  const tag = await tagStore.create({ title: name, color: randomColor() });
  newTagName.value = "";
  showNew.value = false;
  if (tag) {
    selectedIds.value.push(tag.id);
    emit("change", selectedIds.value);
  }
}
</script>
