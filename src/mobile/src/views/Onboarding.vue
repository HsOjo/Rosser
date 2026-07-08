<template>
  <div style="padding: 16px;">
    <var-app-bar :title="$t('appName')" />
    <var-space direction="column" size="large" style="margin-top: 16px;">
      <var-input v-model="url" :placeholder="$t('baseURL')" variant="outlined" />
      <var-input v-model="token" :placeholder="$t('token')" type="password" variant="outlined" />
      <var-button type="primary" block :loading="connecting" @click="handleConnect">{{ $t('connect') }}</var-button>
    </var-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Snackbar } from "@varlet/ui";
import { useConnectionStore } from "@/stores";
import { api } from "@rosser/shared";

const router = useRouter();
const conn = useConnectionStore();

const url = ref("");
const token = ref("");
const connecting = ref(false);

async function handleConnect() {
  if (!url.value.trim() || !token.value.trim()) {
    Snackbar.warning("请填写服务器地址和令牌");
    return;
  }
  connecting.value = true;
  try {
    await conn.connect(url.value.trim(), token.value.trim());
    const { data } = await api.GET("/api/health");
    if (data?.status === "ok") {
      router.push("/");
    } else {
      throw new Error("health check failed");
    }
  } catch (e) {
    conn.disconnect();
    Snackbar.error("连接失败，请检查地址和令牌");
  } finally {
    connecting.value = false;
  }
}
</script>
