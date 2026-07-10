<template>
  <div class="onboarding">
    <n-card :title="$t('onboardingTitle')" style="max-width: 480px; margin: auto; margin-top: 10vh">
      <p>{{ $t('onboardingDesc') }}</p>

      <n-space vertical>
        <n-radio-group v-model:value="mode">
          <n-radio-button v-if="tauri" value="builtin">{{ $t('builtIn') }}</n-radio-button>
          <n-radio-button value="remote">{{ $t('remote') }}</n-radio-button>
        </n-radio-group>

        <template v-if="mode === 'remote'">
          <n-input v-model:value="url" :placeholder="$t('baseURL')" />
          <n-input v-model:value="tokenInput" :placeholder="$t('token')" type="password" />
        </template>

        <n-button type="primary" :loading="connecting" @click="handleConnect">
          {{ $t('connect') }}
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import { useConnectionStore, BUILTIN_TOKEN } from "@/stores";
import { detectTauri, getPlatformConfig } from "@/platform";

const router = useRouter();
const message = useMessage();
const conn = useConnectionStore();
const tauri = ref(false);

onMounted(async () => {
  tauri.value = await detectTauri();
  const cfg = await getPlatformConfig();
  if (cfg.baseURL) {
    mode.value = cfg.isBuiltIn ? "builtin" : "remote";
    if (!cfg.isBuiltIn) {
      url.value = cfg.baseURL;
      tokenInput.value = cfg.token;
    }
  } else if (import.meta.env.PROD && tauri.value) {
    // No saved config likely means the previous session was built-in (not persisted).
    mode.value = "builtin";
  }
});

const mode = ref("remote");
const url = ref("http://127.0.0.1:8000");
const tokenInput = ref("dev-token-change-me");
const connecting = ref(false);

async function handleConnect() {
  connecting.value = true;
  try {
    if (mode.value === "builtin") {
      let port = 8000;
      let token = BUILTIN_TOKEN;
      if (import.meta.env.PROD) {
        const cfg = await invoke<{ port: number; token: string }>("start_builtin_backend");
        port = cfg.port;
        token = cfg.token;
      }
      await conn.connect(`http://127.0.0.1:${port}`, token, true);
    } else {
      await conn.connect(url.value, tokenInput.value);
    }
    router.push("/");
  } catch (e: any) {
    console.error(e);
    message.error(e.message || "连接失败，请检查服务器地址和 Token");
  } finally {
    connecting.value = false;
  }
}
</script>
