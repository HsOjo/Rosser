<template>
  <a-typography>
    <a-typography-title>R[L]oSSer</a-typography-title>
    <a-typography-paragraph>
      Just a simple RSS Reader by a loser.
    </a-typography-paragraph>
    <a-typography-paragraph>
      Press
      <a-typography-text keyboard>Esc</a-typography-text>
      to exit...
    </a-typography-paragraph>
    <a-typography-paragraph>
      如果喜欢，请到
      <a-typography-link @click="pywebview.api.window_open('https://github.com/HsOjo/Rosser')">
        GitHub
      </a-typography-link>
      给个Star，谢谢。
    </a-typography-paragraph>
  </a-typography>
</template>

<script>
export default {
  name: "About"
}
</script>

<style scoped>

</style>