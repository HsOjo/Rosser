import type { MotionVariants, Variant } from "@vueuse/motion";

export interface PresetOptions {
  /** When false, the variant keeps its target values but disables transition. */
  enabled: boolean;
  /** Entrance delay in seconds. */
  delay?: number;
}

type CustomVariant = Variant;

function transition(enabled: boolean, duration = 0, delay = 0, ease?: string | number[]): CustomVariant["transition"] {
  if (!enabled) return { duration: 0 };
  const base: CustomVariant["transition"] = { duration };
  if (delay) base.delay = delay;
  if (ease) base.ease = ease as any;
  return base;
}

export function fadeIn({ enabled, delay = 0 }: PresetOptions): MotionVariants<"enter"> {
  return {
    initial: { opacity: enabled ? 0 : 1 },
    enter: {
      opacity: 1,
      transition: transition(enabled, 0.12, delay),
    },
  };
}

export function slideUp({ enabled, delay = 0 }: PresetOptions): MotionVariants<"enter"> {
  return {
    initial: { opacity: enabled ? 0 : 1, y: enabled ? 8 : 0 },
    enter: {
      opacity: 1,
      y: 0,
      transition: transition(enabled, 0.12, delay, [0.16, 1, 0.3, 1]),
    },
  };
}

export function scaleIn({ enabled }: PresetOptions): MotionVariants<"enter" | "leave"> {
  return {
    initial: { opacity: enabled ? 0 : 1, scale: enabled ? 0.98 : 1 },
    enter: {
      opacity: 1,
      scale: 1,
      transition: transition(enabled, 0.1, 0, "easeOut"),
    },
    leave: {
      opacity: 0,
      scale: 0.98,
      transition: transition(enabled, 0.1),
    },
  };
}

export function drawerSlide({ enabled }: PresetOptions): MotionVariants<"enter" | "leave"> {
  return {
    initial: { x: enabled ? "-100%" : 0 },
    enter: {
      x: 0,
      transition: transition(enabled, 0.12, 0, [0.16, 1, 0.3, 1]),
    },
    leave: {
      x: enabled ? "-100%" : 0,
      transition: transition(enabled, 0.1),
    },
  };
}

export function pageSlide({ enabled }: PresetOptions): MotionVariants<"enter" | "leave"> {
  return {
    initial: { x: enabled ? "100%" : 0, opacity: enabled ? 0 : 1 },
    enter: {
      x: 0,
      opacity: 1,
      transition: transition(enabled, 0.12, 0, [0.16, 1, 0.3, 1]),
    },
    leave: {
      x: enabled ? "-20%" : 0,
      opacity: enabled ? 0 : 1,
      transition: transition(enabled, 0.1),
    },
  };
}

export function shimmer({ enabled }: PresetOptions): MotionVariants<"enter" | "leave"> {
  return {
    initial: { opacity: enabled ? 0.85 : 1 },
    enter: {
      opacity: 1,
      transition: enabled ? { repeat: Infinity, repeatType: "reverse", duration: 1.5 } : { duration: 0 },
    },
    leave: { opacity: 1, transition: { duration: 0 } },
  };
}
