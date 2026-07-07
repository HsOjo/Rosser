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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useConnectionStore } from "@/stores";
import { isTauri } from "@/platform";

const router = useRouter();
const conn = useConnectionStore();
const tauri = isTauri();

const mode = ref(tauri ? "builtin" : "remote");
const url = ref("http://127.0.0.1:8000");
const tokenInput = ref("dev-token-change-me");
const connecting = ref(false);

async function handleConnect() {
  connecting.value = true;
  try {
    if (mode.value === "builtin") {
      // Built-in backend will be started by Tauri sidecar
      // For now, connect to a default or let Tauri provide it
      // We'll implement the sidecar config later
      await conn.connect("http://127.0.0.1:8000", "dev-token-change-me");
    } else {
      await conn.connect(url.value, tokenInput.value);
    }
    router.push("/");
  } catch (e) {
    console.error(e);
  } finally {
    connecting.value = false;
  }
}
</script>
