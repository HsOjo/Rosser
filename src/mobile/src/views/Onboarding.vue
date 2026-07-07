<template>
  <div style="padding: 16px">
    <var-app-bar :title="$t('appName')" />
    <var-space direction="column" size="large">
      <var-input v-model="url" :placeholder="$t('baseURL')" variant="outlined" />
      <var-input v-model="token" :placeholder="$t('token')" type="password" variant="outlined" />
      <var-button type="primary" block :loading="connecting" @click="handleConnect">{{ $t('connect') }}</var-button>
    </var-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useConnectionStore } from "@/stores";

const router = useRouter();
const conn = useConnectionStore();

const url = ref("http://127.0.0.1:8000");
const token = ref("dev-token-change-me");
const connecting = ref(false);

async function handleConnect() {
  connecting.value = true;
  try {
    await conn.connect(url.value, token.value);
    router.push("/");
  } catch (e) {
    console.error(e);
  } finally {
    connecting.value = false;
  }
}
</script>
