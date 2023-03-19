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
  color: #CED0D5;
}

.icon-button:hover {
  background: #383A41;
}

.icon-button:active {
  opacity: 0.8;
}
</style>