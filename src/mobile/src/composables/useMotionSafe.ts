import { computed, watch, type Ref } from "vue";
import { useReducedMotion } from "@vueuse/motion";
import { uiSettings } from "@/settings/local";

let initialized = false;
let motionEnabledRef: Ref<boolean> | null = null;

/**
 * Whether animations are allowed to run.
 * Returns false when either the user disabled animations in settings
 * or the system prefers reduced motion.
 *
 * The underlying media query and html class are only set up once,
 * so calling this in many list cells is cheap.
 */
export function useMotionSafe() {
  if (!initialized) {
    initialized = true;
    const reducedMotion = useReducedMotion();
    motionEnabledRef = computed(() => {
      if (uiSettings.value.disableAnimations) return false;
      return !reducedMotion.value;
    });

    watch(
      motionEnabledRef,
      (enabled) => {
        if (typeof document === "undefined") return;
        document.documentElement.classList.toggle("disable-animations", !enabled);
      },
      { immediate: true }
    );
  }

  return { motionEnabled: motionEnabledRef! };
}
