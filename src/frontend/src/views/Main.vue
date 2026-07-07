<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider bordered width="260" style="display: flex; flex-direction: column">
      <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center">
        <span style="font-weight: bold; font-size: 18px">{{ $t('appName') }}</span>
        <n-space>
          <n-button text size="small" @click="showAddCat = true">
            <template #icon><n-icon><AddOutline /></n-icon></template>
          </n-button>
          <n-button text size="small" @click="refreshAll">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
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
        <article-list :subscription-id="selectedSubscription" :category-id="selectedCategory" :search="searchQuery" :is-read="selectedIsRead" :is-star="selectedIsStar" />
      </n-layout-content>
    </n-layout>
  </n-layout>

  <!-- Add Category Modal -->
  <n-modal v-model:show="showAddCat" :title="t('addCategory')" preset="card" style="width: 400px">
    <n-space vertical>
      <n-input v-model:value="newCatTitle" :placeholder="t('title')" />
      <n-input v-model:value="newCatDesc" :placeholder="t('description')" type="textarea" />
      <n-button type="primary" :loading="addingCat" @click="addCategory">{{ t('add') }}</n-button>
    </n-space>
  </n-modal>

  <!-- Edit Category Modal -->
  <n-modal v-model:show="showEditCat" :title="t('editCategory')" preset="card" style="width: 400px">
    <n-space vertical>
      <n-input v-model:value="editCatTitle" :placeholder="t('title')" />
      <n-input v-model:value="editCatDesc" :placeholder="t('description')" type="textarea" />
      <n-space>
        <n-button type="primary" @click="saveEditCategory">{{ t('save') }}</n-button>
        <n-button type="error" @click="deleteCategory">{{ t('delete') }}</n-button>
      </n-space>
    </n-space>
  </n-modal>

  <!-- Add Subscription Modal -->
  <n-modal v-model:show="showAddSub" :title="$t('addSubscription')" preset="card" style="width: 500px">
    <n-space vertical>
      <n-input v-model:value="newSubUrl" placeholder="RSS URL" />
      <n-button :loading="previewLoading" @click="preview">{{ $t('preview') }}</n-button>
      <template v-if="previewResult">
        <n-input v-model:value="newSubTitle" :placeholder="previewResult.title || 'Title'" />
        <n-input v-model:value="newSubDesc" placeholder="Description" type="textarea" />
        <n-select v-model:value="newSubCategory" :options="categoryOptions" placeholder="Category" clearable />
        <n-button type="primary" :loading="adding" @click="addSubscription">{{ $t('addSubscription') }}</n-button>
      </template>
    </n-space>
  </n-modal>

  <!-- Edit Subscription Modal -->
  <n-modal v-model:show="showEditSub" :title="t('editSubscription')" preset="card" style="width: 500px">
    <n-space vertical>
      <n-input v-model:value="editSubTitle" :placeholder="t('title')" />
      <n-input v-model:value="editSubDesc" :placeholder="t('description')" type="textarea" />
      <n-select v-model:value="editSubCategory" :options="categoryOptions" placeholder="Category" clearable />
      <n-space>
        <n-button type="primary" @click="saveEditSubscription">{{ t('save') }}</n-button>
        <n-button type="error" @click="deleteSubscription">{{ t('delete') }}</n-button>
      </n-space>
    </n-space>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { RefreshOutline, SearchOutline, SettingsOutline, AddOutline } from "@vicons/ionicons5";
import { useI18n } from "vue-i18n";
import { useSubscriptionStore, useCategoryStore, useArticleStore } from "@/stores";
import { api } from "@rosser/shared";
import ArticleList from "@/components/ArticleList.vue";

const router = useRouter();
const { t } = useI18n();
const subStore = useSubscriptionStore();
const catStore = useCategoryStore();
const artStore = useArticleStore();

const selectedKey = ref("all");
const selectedSubscription = ref<string | undefined>(undefined);
const selectedCategory = ref<string | undefined>(undefined);
const selectedIsRead = ref<boolean | undefined>(undefined);
const selectedIsStar = ref<boolean | undefined>(undefined);
const searchQuery = ref("");

const showAddCat = ref(false);
const newCatTitle = ref("");
const newCatDesc = ref("");
const addingCat = ref(false);

const showEditCat = ref(false);
const editingCat = ref<any>(null);
const editCatTitle = ref("");
const editCatDesc = ref("");

const showAddSub = ref(false);
const newSubUrl = ref("");
const newSubTitle = ref("");
const newSubDesc = ref("");
const newSubCategory = ref<string | null>(null);
const previewLoading = ref(false);
const previewResult = ref<any>(null);
const adding = ref(false);

const showEditSub = ref(false);
const editingSub = ref<any>(null);
const editSubTitle = ref("");
const editSubDesc = ref("");
const editSubCategory = ref<string | null>(null);

const categoryOptions = computed(() =>
  catStore.categories.map((c: any) => ({ label: c.title, value: c.id }))
);

const menuOptions = computed(() => {
  const items: any[] = [
    { key: "all", label: t('all') },
    { key: "unread", label: t('unread') },
    { key: "starred", label: t('starred') },
  ];
  for (const cat of catStore.categories) {
    const subs = subStore.subscriptions
      .filter((s: any) => s.category_id === cat.id)
      .map((s: any) => ({ key: `sub-${s.id}`, label: s.title }));
    items.push({
      key: `cat-${cat.id}`,
      label: cat.title,
      children: subs.length > 0 ? subs : undefined,
      extra: h('span', {
        style: 'margin-left: auto; cursor: pointer; padding: 0 8px;',
        onClick: (e: Event) => { e.stopPropagation(); openEditCategory(cat); }
      }, '...')
    });
  }
  const uncategorized = subStore.subscriptions
    .filter((s: any) => !s.category_id)
    .map((s: any) => ({ key: `sub-${s.id}`, label: s.title }));
  if (uncategorized.length > 0) {
    items.push({ key: "uncategorized", label: t('uncategorized'), children: uncategorized });
  }
  return items;
});

function openEditCategory(cat: any) {
  editingCat.value = cat;
  editCatTitle.value = cat.title;
  editCatDesc.value = cat.description || "";
  showEditCat.value = true;
}

function openEditSubscription(sub: any) {
  editingSub.value = sub;
  editSubTitle.value = sub.title;
  editSubDesc.value = sub.description || "";
  editSubCategory.value = sub.category_id || null;
  showEditSub.value = true;
}

function onMenuSelect(key: string) {
  selectedSubscription.value = undefined;
  selectedCategory.value = undefined;
  selectedIsRead.value = undefined;
  selectedIsStar.value = undefined;
  if (key === "unread") {
    selectedIsRead.value = false;
  } else if (key === "starred") {
    selectedIsStar.value = true;
  } else if (key.startsWith("sub-")) {
    const subId = key.replace("sub-", "");
    selectedSubscription.value = subId;
    const sub = subStore.subscriptions.find((s: any) => s.id === subId);
    if (sub) openEditSubscription(sub);
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

async function addCategory() {
  addingCat.value = true;
  try {
    await catStore.create({ title: newCatTitle.value, description: newCatDesc.value });
    showAddCat.value = false;
    newCatTitle.value = "";
    newCatDesc.value = "";
  } finally {
    addingCat.value = false;
  }
}

async function saveEditCategory() {
  if (!editingCat.value) return;
  await catStore.update(editingCat.value.id, {
    title: editCatTitle.value,
    description: editCatDesc.value,
  });
  showEditCat.value = false;
  editingCat.value = null;
}

async function deleteCategory() {
  if (!editingCat.value) return;
  await catStore.remove(editingCat.value.id);
  showEditCat.value = false;
  editingCat.value = null;
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

async function saveEditSubscription() {
  if (!editingSub.value) return;
  await subStore.update(editingSub.value.id, {
    title: editSubTitle.value,
    description: editSubDesc.value,
    category_id: editSubCategory.value,
  });
  showEditSub.value = false;
  editingSub.value = null;
}

async function deleteSubscription() {
  if (!editingSub.value) return;
  await subStore.remove(editingSub.value.id);
  showEditSub.value = false;
  editingSub.value = null;
}

onMounted(() => {
  subStore.fetchAll();
  catStore.fetchAll();
});
</script>
