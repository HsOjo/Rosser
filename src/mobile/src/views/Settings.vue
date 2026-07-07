<template>
  <div style="padding: 16px">
    <var-app-bar title="Settings" title-position="center">
      <template #left>
        <var-button text type="primary" @click="$router.back()">Back</var-button>
      </template>
    </var-app-bar>

    <var-space direction="column" size="large">
      <var-cell title="Server" :description="conn.baseURL" />
      <var-button type="danger" block @click="logout">Disconnect</var-button>
    </var-space>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useConnectionStore } from "@/stores";

const router = useRouter();
const conn = useConnectionStore();

function logout() {
  conn.disconnect();
  router.push("/onboarding");
}
</script>
