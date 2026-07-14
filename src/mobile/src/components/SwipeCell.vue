<template>
  <div
    ref="cellRef"
    class="relative overflow-hidden"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- Background actions -->
    <div
      class="absolute inset-y-0 right-0 flex items-center justify-end px-2 bg-slate-50 dark:bg-zinc-800"
      :style="{ width: `${actionsWidth}px` }"
    >
      <button
        v-for="action in normalizedActions"
        :key="action.key"
        class="flex items-center justify-center h-12 w-12 rounded-xl mx-0.5 text-xs font-bold transition-transform"
        :class="action.class"
        @click="(e) => handleAction(e, action.key)"
      >
        <component :is="action.icon" class="w-5 h-5" />
      </button>
    </div>

    <!-- Foreground content -->
    <div
      class="relative bg-white dark:bg-zinc-900 transition-transform duration-200"
      :style="{ transform: `translateX(${-offset}px)` }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Component } from "vue";

export interface SwipeAction {
  key: string;
  icon: Component;
  class?: string;
}

const props = defineProps<{
  actions: SwipeAction[];
}>();

const emit = defineEmits<{
  (e: "action", key: string): void;
}>();

const cellRef = ref<HTMLDivElement | null>(null);
const offset = ref(0);
const startX = ref(0);
const startY = ref(0);
const isDragging = ref(false);
const isHorizontal = ref(false);

const actionSize = 52; // w-12 + mx-0.5*2 ≈ 52
const actionsWidth = computed(() => props.actions.length * actionSize);

const normalizedActions = computed(() =>
  props.actions.map((a) => ({
    ...a,
    class: a.class || "bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300",
  }))
);

function onTouchStart(e: TouchEvent) {
  const touch = e.touches[0];
  startX.value = touch.clientX;
  startY.value = touch.clientY;
  isDragging.value = true;
  isHorizontal.value = false;
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return;
  const touch = e.touches[0];
  const dx = startX.value - touch.clientX;
  const dy = startY.value - touch.clientY;

  if (!isHorizontal.value) {
    if (Math.abs(dx) < Math.abs(dy)) {
      isDragging.value = false;
      return;
    }
    if (Math.abs(dx) > 6) {
      isHorizontal.value = true;
    }
  }

  if (isHorizontal.value) {
    e.preventDefault();
    offset.value = Math.max(0, Math.min(dx, actionsWidth.value));
  }
}

function onTouchEnd() {
  isDragging.value = false;
  if (!isHorizontal.value) {
    offset.value = 0;
    return;
  }
  // Snap open if swiped more than half, else close
  if (offset.value > actionsWidth.value / 2) {
    offset.value = actionsWidth.value;
  } else {
    offset.value = 0;
  }
  isHorizontal.value = false;
}

function handleAction(e: MouseEvent, key: string) {
  e.stopPropagation();
  offset.value = 0;
  emit("action", key);
}
</script>
