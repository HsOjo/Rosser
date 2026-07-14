<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center overflow-hidden touch-none select-none"
    @click="onBackdropClick"
    @touchstart="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div
      class="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-md bg-white/10 text-white/80 text-xs font-medium backdrop-blur-sm"
    >
      {{ currentIndex + 1 }} / {{ images.length }}
    </div>

    <button
      class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors backdrop-blur-sm"
      aria-label="close"
      @click.stop="close"
    >
      <component :is="Close" class="w-6 h-6" />
    </button>

    <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
      <img
        :key="currentIndex"
        :src="currentSrc"
        class="max-w-full max-h-full object-contain transition-transform duration-200 ease-out will-change-transform"
        :style="imageStyle"
        referrerpolicy="no-referrer"
        @load="onImageLoad"
        @click.stop
        @dblclick="onDoubleTap"
      />
    </div>

    <button
      v-if="images.length > 1"
      class="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-30 transition-colors"
      aria-label="previous"
      :disabled="currentIndex <= 0"
      @click.stop="prev"
    >
      <component :is="ChevronBack" class="w-6 h-6" />
    </button>
    <button
      v-if="images.length > 1"
      class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-30 transition-colors"
      aria-label="next"
      :disabled="currentIndex >= images.length - 1"
      @click.stop="next"
    >
      <component :is="ChevronForward" class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Close, ChevronBack, ChevronForward } from "@vicons/ionicons5";

const props = defineProps<{
  modelValue: boolean;
  images: string[];
  initialIndex?: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:index", value: number): void;
}>();

const currentIndex = ref(0);
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);

const currentSrc = computed(() => props.images[currentIndex.value] || "");

const imageStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  touchAction: "none" as const,
}));

interface PointerPoint {
  x: number;
  y: number;
}

const pointers = new Map<number, PointerPoint>();
let initialDistance = 0;
let initialScale = 1;
let initialTranslateX = 0;
let initialTranslateY = 0;
let startX = 0;
let startY = 0;
let isDragging = false;
let swipeDeltaX = 0;
let lastTapTime = 0;

function reset() {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
  pointers.clear();
  initialDistance = 0;
  initialScale = 1;
  initialTranslateX = 0;
  initialTranslateY = 0;
  startX = 0;
  startY = 0;
  isDragging = false;
  swipeDeltaX = 0;
}

function close() {
  emit("update:modelValue", false);
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    emit("update:index", currentIndex.value);
    reset();
  }
}

function next() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
    emit("update:index", currentIndex.value);
    reset();
  }
}

function onImageLoad() {
  reset();
}

function getDistance(a: PointerPoint, b: PointerPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function onTouchStart(e: TouchEvent) {
  for (const touch of e.changedTouches) {
    pointers.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
  }

  if (pointers.size === 2) {
    const pts = Array.from(pointers.values());
    initialDistance = getDistance(pts[0], pts[1]);
    initialScale = scale.value;
    initialTranslateX = translateX.value;
    initialTranslateY = translateY.value;
  } else if (pointers.size === 1) {
    const touch = e.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    initialTranslateX = translateX.value;
    initialTranslateY = translateY.value;
    isDragging = false;
    swipeDeltaX = 0;
  }
}

function onTouchMove(e: TouchEvent) {
  if (pointers.size === 0) return;

  for (const touch of e.changedTouches) {
    pointers.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
  }

  if (pointers.size === 2) {
    const pts = Array.from(pointers.values());
    const distance = getDistance(pts[0], pts[1]);
    if (initialDistance > 0 && distance > 0) {
      scale.value = Math.max(1, initialScale * (distance / initialDistance));
    }
  } else if (pointers.size === 1) {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      isDragging = true;
    }
    if (scale.value > 1) {
      translateX.value = initialTranslateX + dx;
      translateY.value = initialTranslateY + dy;
    } else {
      swipeDeltaX = dx;
    }
  }
}

function onTouchEnd(e: TouchEvent) {
  // Double-tap detection: a quick second tap with little movement toggles zoom.
  if (pointers.size === 1 && e.changedTouches.length === 1 && !isDragging) {
    const touch = e.changedTouches[0];
    const now = Date.now();
    if (
      now - lastTapTime < 300 &&
      Math.abs(touch.clientX - startX) < 10 &&
      Math.abs(touch.clientY - startY) < 10
    ) {
      lastTapTime = 0;
      removePointer(e);
      onDoubleTap();
      return;
    }
    lastTapTime = now;
  }

  removePointer(e);

  if (pointers.size === 0) {
    if (scale.value <= 1) {
      if (swipeDeltaX > 80 && currentIndex.value > 0) {
        prev();
      } else if (swipeDeltaX < -80 && currentIndex.value < props.images.length - 1) {
        next();
      }
      if (scale.value < 1) scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    } else {
      if (scale.value < 1) scale.value = 1;
    }
    swipeDeltaX = 0;
  }
}

function removePointer(e: TouchEvent) {
  for (const touch of e.changedTouches) {
    pointers.delete(touch.identifier);
  }
}

function onDoubleTap() {
  if (scale.value > 1) {
    reset();
  } else {
    scale.value = 2.5;
    translateX.value = 0;
    translateY.value = 0;
  }
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close();
  }
}

watch(
  () => props.modelValue,
  (show) => {
    if (show) {
      currentIndex.value = Math.max(
        0,
        Math.min(props.initialIndex ?? 0, props.images.length - 1),
      );
      reset();
    }
  },
  { immediate: true },
);

watch(
  () => props.initialIndex,
  (idx) => {
    if (props.modelValue && idx !== undefined) {
      currentIndex.value = Math.max(0, Math.min(idx, props.images.length - 1));
    }
  },
);
</script>
