<template>
  <span />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import { listen } from "@tauri-apps/api/event";
import { checkForUpdate } from "@/utils/updater";
import { detectTauri, openExternal } from "@/platform";

const { t } = useI18n();
const message = useMessage();

onMounted(async () => {
  if (!(await detectTauri())) return;
    await listen("menu:check-update", async () => {
      try {
        const result = await checkForUpdate();
        if (result.haveNew) {
          message.success(t("updateFound", { version: result.latest }));
          await openExternal(result.htmlUrl);
        } else {
          message.success(t("noUpdate"));
        }
      } catch {
        message.error(t("networkError"));
      }
    });
});
</script>
