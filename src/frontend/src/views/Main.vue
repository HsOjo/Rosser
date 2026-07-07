<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider bordered width="260" style="display: flex; flex-direction: column">
      <div style="padding: 12px; border-bottom: 1px solid #eee">
        <n-space>
          <span style="font-weight: bold; font-size: 18px">{{ $t('appName') }}</span>
          <n-button text size="small" @click="refreshAll">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
          </n-button>
        </n-space>
      </div>

      <n-scrollbar style="flex: 1">
        <n-menu v-model:value="selectedKey" :options="menuOptions" @update:value="onMenuSelect" />
      </n-scrollbar>
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered style="padding: 12px; display: flex; align-items: center; gap: 12px">
        <n-input v-model:value="searchQuery" :placeholder="$t('search')" clearable style="max-width: 300px">
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>

        <n-space>
          <n-button size="small" @click="markAllRead">{{ $t('markAllRead') }}</n-button>
          <n-button size="small" @click="showAddSub = true">{{ $t('addSubscription') }}</n-button>
          <n-button text size="small" @click="$router.push('/settings')">
            <template #icon>
              <n-icon><SettingsOutline /></n-icon>
            </template>
          </n-button>
        </n-space>
      </n-layout-header>

      <n-layout-content style="padding: 16px">
        <article-list :subscription-id="selectedSubscription" :category-id="selectedCategory" :search="searchQuery" />
      </n-layout-content>
    </n-layout>
  </n-layout>

  <!-- Add Subscription Modal -->
  <n-modal v-model:show="showAddSub" :title="$t('addSubscription')" preset="card" style="width: 500px">
    <n-space vertical>
      <n-input v-model:value="newSubUrl" placeholder="RSS URL" />
      <n-button :loading="previewLoading" @click="preview">{{ $t('preview') }}</n-button>
      <template v-if="previewResult">
        <n-input v-model:value="newSubTitle" :placeholder="previewResult.title || 'Title'" />
        <n-input v-model:value="newSubDesc" placeholder="Description" type="textarea" />
        <n-cascader v-model:value="newSubCategory" :options="categoryOptions" placeholder="Category" clearable />
        <n-button type="primary" :loading="adding" @click="addSubscription">{{ $t('addSubscription') }}</n-button>
      </template>
    </n-space>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { RefreshOutline, SearchOutline, SettingsOutline } from "@vicons/ionicons5";
import { useSubscriptionStore, useCategoryStore, useArticleStore } from "@/stores";
import { api } from "@rosser/shared";
import ArticleList from "@/components/ArticleList.vue";

const router = useRouter();
const subStore = useSubscriptionStore();
const catStore = useCategoryStore();
const artStore = useArticleStore();

const selectedKey = ref("all");
const selectedSubscription = ref<string | undefined>(undefined);
const selectedCategory = ref<string | undefined>(undefined);
const searchQuery = ref("");

const showAddSub = ref(false);
const newSubUrl = ref("");
const newSubTitle = ref("");
const newSubDesc = ref("");
const newSubCategory = ref<string | null>(null);
const previewLoading = ref(false);
const previewResult = ref<any>(null);
const adding = ref(false);

const categoryOptions = computed(() =>
  catStore.categories.map((c: any) => ({ label: c.title, value: c.id }))
);

const menuOptions = computed(() => {
  const items: any[] = [
    { key: "all", label: "All Articles" },
    { key: "unread", label: "Unread" },
    { key: "starred", label: "Starred" },
  ];
  for (const cat of catStore.categories) {
    const subs = subStore.subscriptions
      .filter((s: any) => s.category_id === cat.id)
      .map((s: any) => ({ key: `sub-${s.id}`, label: s.title }));
    items.push({ key: `cat-${cat.id}`, label: cat.title, children: subs });
  }
  const uncategorized = subStore.subscriptions
    .filter((s: any) => !s.category_id)
    .map((s: any) => ({ key: `sub-${s.id}`, label: s.title }));
  if (uncategorized.length > 0) {
    items.push({ key: "uncategorized", label: "Uncategorized", children: uncategorized });
  }
  return items;
});

function onMenuSelect(key: string) {
  selectedSubscription.value = undefined;
  selectedCategory.value = undefined;
  if (key.startsWith("sub-")) {
    selectedSubscription.value = key.replace("sub-", "");
  } else if (key.startsWith("cat-")) {
    selectedCategory.value = key.replace("cat-", "");
  }
}

async function refreshAll() {
  await api.POST("/api/subscriptions/fetch-all");
  await artStore.fetchList();
}

async function markAllRead() {
  await api.POST("/api/articles/read-before-days", { params: { query: { days: 0 } } });
  await artStore.fetchList();
}

async function preview() {
  previewLoading.value = true;
  try {
    const { data } = await api.POST("/api/subscriptions/preview", { body: { url: newSubUrl.value } });
    previewResult.value = data;
    if (data?.title) newSubTitle.value = data.title;
    if (data?.description) newSubDesc.value = data.description;
  } finally {
    previewLoading.value = false;
  }
}

async function addSubscription() {
  adding.value = true;
  try {
    await subStore.create({
      url: newSubUrl.value,
      title: newSubTitle.value || previewResult.value?.title || newSubUrl.value,
      description: newSubDesc.value,
      category_id: newSubCategory.value,
    });
    showAddSub.value = false;
    newSubUrl.value = "";
    newSubTitle.value = "";
    newSubDesc.value = "";
    newSubCategory.value = null;
    previewResult.value = null;
  } finally {
    adding.value = false;
  }
}

onMounted(() => {
  subStore.fetchAll();
  catStore.fetchAll();
});
</script>
