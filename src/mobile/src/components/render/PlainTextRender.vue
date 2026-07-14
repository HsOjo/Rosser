<template>
  <pre
    class="whitespace-pre-wrap break-words font-mono text-[11px] bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed"
  >{{ text }}</pre>
</template>

<script setup lang="ts">
defineProps<{ text: string }>();
</script>
