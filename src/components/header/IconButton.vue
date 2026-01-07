<template>
  <button class="icon-button">
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: "IconButton",
  props: {
    icon: {type: Object}
  },
}
</script>

<style scoped>
.icon-button {
  width: 40px;
  height: 40px;
  padding: 0;
  margin: 0;
  border-radius: 0;
  background: transparent;
  color: var(--header-icon);
}

.icon-button:hover {
  background: var(--header-hover);
}

.icon-button:active {
  opacity: 0.8;
}
</style>