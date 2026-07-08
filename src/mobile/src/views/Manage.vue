<template>
  <div>
    <var-app-bar :title="$t('manage')" title-position="center">
      <template #left>
        <var-button text type="primary" @click="$router.back()">{{ $t('back') }}</var-button>
      </template>
    </var-app-bar>

    <var-tabs v-model:active="activeTab">
      <var-tab>{{ $t('categories') }}</var-tab>
      <var-tab>{{ $t('subscriptions') }}</var-tab>
      <var-tab>{{ $t('tags') }}</var-tab>
    </var-tabs>

    <var-tabs-items v-model:active="activeTab">
      <!-- Categories -->
      <var-tab-item>
        <var-space direction="column" size="large" style="padding: 16px;">
          <var-space>
            <var-input v-model="newCatTitle" :placeholder="$t('title')" variant="outlined" />
            <var-input v-model="newCatDesc" :placeholder="$t('description')" variant="outlined" />
            <var-button type="primary" :loading="addingCat" @click="addCategory">{{ $t('add') }}</var-button>
          </var-space>

          <var-cell
            v-for="cat in catStore.categories"
            :key="cat.id"
            :title="cat.title"
            :description="cat.description"
          >
            <template #extra>
              <var-space>
                <var-button text type="primary" size="mini" @click="openEditCat(cat)">{{ $t('edit') }}</var-button>
                <var-button text type="danger" size="mini" @click="deleteCat(cat.id)">{{ $t('delete') }}</var-button>
              </var-space>
            </template>
          </var-cell>
        </var-space>
      </var-tab-item>

      <!-- Subscriptions -->
      <var-tab-item>
        <var-space direction="column" size="large" style="padding: 16px;">
          <var-space>
            <var-input v-model="newSubUrl" :placeholder="$t('rssURL')" variant="outlined" />
            <var-button :loading="previewLoading" @click="preview">{{ $t('preview') }}</var-button>
          </var-space>

          <template v-if="previewResult">
            <var-input v-model="newSubTitle" :placeholder="previewResult.title || $t('title')" variant="outlined" />
            <var-input v-model="newSubDesc" :placeholder="$t('description')" variant="outlined" />
            <var-select v-model="newSubCategory" :placeholder="$t('category')" clearable variant="outlined">
              <var-option
                v-for="cat in catStore.categories"
                :key="cat.id"
                :label="cat.title"
                :value="cat.id"
              />
            </var-select>
            <var-select v-model="newSubTags" :placeholder="$t('tags')" multiple clearable variant="outlined">
              <var-option v-for="tag in tagStore.tags" :key="tag.id" :label="tag.title" :value="tag.id" />
            </var-select>
            <var-button type="primary" :loading="addingSub" @click="addSubscription">{{ $t('addSubscription') }}</var-button>
          </template>

          <var-divider />

          <var-cell
            v-for="sub in subStore.subscriptions"
            :key="sub.id"
            :title="sub.title"
            :description="sub.url"
          >
            <template #extra>
              <var-space>
                <var-button text type="primary" size="mini" @click="openEditSub(sub)">{{ $t('edit') }}</var-button>
                <var-button text type="danger" size="mini" @click="deleteSub(sub.id)">{{ $t('delete') }}</var-button>
              </var-space>
            </template>
          </var-cell>
        </var-space>
      </var-tab-item>

      <!-- Tags -->
      <var-tab-item>
        <var-space direction="column" size="large" style="padding: 16px;">
          <var-space>
            <var-input v-model="newTagTitle" :placeholder="$t('tagTitle')" variant="outlined" />
            <var-input v-model="newTagColor" :placeholder="$t('tagColor')" variant="outlined" style="width: 80px;" />
            <var-button type="primary" :loading="addingTag" @click="addTag">{{ $t('add') }}</var-button>
          </var-space>

          <var-space wrap :size="[8, 8]">
            <var-chip
              v-for="tag in tagStore.tags"
              :key="tag.id"
              closable
              :color="tag.color"
              @close="removeTag(tag.id)"
              @click="startEditTag(tag)"
            >
              {{ tag.title }}
            </var-chip>
          </var-space>
        </var-space>
      </var-tab-item>
    </var-tabs-items>

    <var-dialog v-model:show="showEditCat" :title="$t('editCategory')">
      <var-space direction="column" size="small">
        <var-input v-model="editCatTitle" :placeholder="$t('title')" variant="outlined" />
        <var-input v-model="editCatDesc" :placeholder="$t('description')" variant="outlined" />
      </var-space>
      <template #actions>
        <var-space>
          <var-button type="primary" @click="saveEditCat">{{ $t('save') }}</var-button>
          <var-button @click="showEditCat = false">{{ $t('close') }}</var-button>
        </var-space>
      </template>
    </var-dialog>

    <var-dialog v-model:show="showEditSub" :title="$t('editSubscription')">
      <var-space direction="column" size="small">
        <var-input v-model="editSubTitle" :placeholder="$t('title')" variant="outlined" />
        <var-input v-model="editSubDesc" :placeholder="$t('description')" variant="outlined" />
        <var-select v-model="editSubCategory" :placeholder="$t('category')" clearable variant="outlined">
          <var-option v-for="cat in catStore.categories" :key="cat.id" :label="cat.title" :value="cat.id" />
        </var-select>
        <var-select v-model="editSubTags" :placeholder="$t('tags')" multiple clearable variant="outlined">
          <var-option v-for="tag in tagStore.tags" :key="tag.id" :label="tag.title" :value="tag.id" />
        </var-select>
      </var-space>
      <template #actions>
        <var-space>
          <var-button type="primary" @click="saveEditSub">{{ $t('save') }}</var-button>
          <var-button :loading="fetchingSub" @click="fetchSubscription">{{ $t('fetchNow') }}</var-button>
          <var-button type="danger" @click="deleteSub(editingSub?.id)">{{ $t('delete') }}</var-button>
          <var-button @click="showEditSub = false">{{ $t('close') }}</var-button>
        </var-space>
      </template>
    </var-dialog>

    <var-dialog v-model:show="showEditTag" :title="$t('editTag')">
      <var-space direction="column" size="small">
        <var-input v-model="editTagTitle" :placeholder="$t('tagTitle')" variant="outlined" />
        <var-input v-model="editTagColor" :placeholder="$t('tagColor')" variant="outlined" />
      </var-space>
      <template #actions>
        <var-space>
          <var-button type="primary" @click="saveEditTag">{{ $t('save') }}</var-button>
          <var-button @click="showEditTag = false">{{ $t('close') }}</var-button>
        </var-space>
      </template>
    </var-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Snackbar } from "@varlet/ui";
import { useCategoryStore, useSubscriptionStore, useTagStore } from "@/stores";
import { api } from "@rosser/shared";

const catStore = useCategoryStore();
const subStore = useSubscriptionStore();
const tagStore = useTagStore();

const activeTab = ref(0);

const newCatTitle = ref("");
const newCatDesc = ref("");
const addingCat = ref(false);
const showEditCat = ref(false);
const editingCat = ref<any>(null);
const editCatTitle = ref("");
const editCatDesc = ref("");

const newSubUrl = ref("");
const newSubTitle = ref("");
const newSubDesc = ref("");
const newSubCategory = ref<string | null>(null);
const newSubTags = ref<string[]>([]);
const previewLoading = ref(false);
const previewResult = ref<any>(null);
const addingSub = ref(false);
const showEditSub = ref(false);
const editingSub = ref<any>(null);
const editSubTitle = ref("");
const editSubDesc = ref("");
const editSubCategory = ref<string | null>(null);
const editSubTags = ref<string[]>([]);
const fetchingSub = ref(false);

const newTagTitle = ref("");
const newTagColor = ref(randomColor());
const addingTag = ref(false);
const showEditTag = ref(false);
const editingTag = ref<any>(null);
const editTagTitle = ref("");
const editTagColor = ref("");

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
}

onMounted(() => {
  catStore.fetchAll();
  subStore.fetchAll();
  tagStore.fetchAll();
});

async function addCategory() {
  if (!newCatTitle.value.trim()) return;
  addingCat.value = true;
  try {
    await catStore.create({ title: newCatTitle.value, description: newCatDesc.value });
    newCatTitle.value = "";
    newCatDesc.value = "";
    Snackbar.success("已保存");
  } finally {
    addingCat.value = false;
  }
}

function openEditCat(cat: any) {
  editingCat.value = cat;
  editCatTitle.value = cat.title;
  editCatDesc.value = cat.description || "";
  showEditCat.value = true;
}

async function saveEditCat() {
  if (!editingCat.value) return;
  await catStore.update(editingCat.value.id, {
    title: editCatTitle.value,
    description: editCatDesc.value,
  });
  showEditCat.value = false;
  editingCat.value = null;
  Snackbar.success("已保存");
}

async function deleteCat(id: string) {
  try {
    await catStore.remove(id);
    Snackbar.success("已删除");
  } catch {
    Snackbar.error("删除失败");
  }
}

async function preview() {
  if (!newSubUrl.value.trim()) return;
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
  if (!newSubUrl.value.trim()) return;
  addingSub.value = true;
  try {
    const sub = await subStore.create({
      url: newSubUrl.value,
      title: newSubTitle.value || previewResult.value?.title || newSubUrl.value,
      description: newSubDesc.value,
      category_id: newSubCategory.value,
    });
    if (sub?.id && newSubTags.value.length > 0) {
      for (const tagId of newSubTags.value) {
        await tagStore.tagSubscription(sub.id, [tagId]);
      }
    }
    newSubUrl.value = "";
    newSubTitle.value = "";
    newSubDesc.value = "";
    newSubCategory.value = null;
    newSubTags.value = [];
    previewResult.value = null;
    Snackbar.success("已保存");
    if (sub?.id) {
      await api.POST("/api/subscriptions/fetch", { body: { ids: [sub.id] } });
    }
  } finally {
    addingSub.value = false;
  }
}

function openEditSub(sub: any) {
  editingSub.value = sub;
  editSubTitle.value = sub.title;
  editSubDesc.value = sub.description || "";
  editSubCategory.value = sub.category_id || null;
  editSubTags.value = sub.tags?.map((t: any) => t.id) || [];
  showEditSub.value = true;
}

async function saveEditSub() {
  if (!editingSub.value) return;
  await subStore.update(editingSub.value.id, {
    title: editSubTitle.value,
    description: editSubDesc.value,
    category_id: editSubCategory.value,
  });
  const currentTagIds = editingSub.value.tags?.map((t: any) => t.id) || [];
  const toAdd = editSubTags.value.filter((id) => !currentTagIds.includes(id));
  const toRemove = currentTagIds.filter((id: string) => !editSubTags.value.includes(id));
  for (const tagId of toAdd) {
    await tagStore.tagSubscription(editingSub.value.id, [tagId]);
  }
  for (const tagId of toRemove) {
    await tagStore.untagSubscription(editingSub.value.id, tagId);
  }
  await subStore.fetchAll();
  showEditSub.value = false;
  editingSub.value = null;
  Snackbar.success("已保存");
}

async function fetchSubscription() {
  if (!editingSub.value || fetchingSub.value) return;
  fetchingSub.value = true;
  try {
    await api.POST("/api/subscriptions/fetch", { body: { ids: [editingSub.value.id] } });
    Snackbar.success("抓取完成");
  } catch {
    Snackbar.error("抓取失败");
  } finally {
    fetchingSub.value = false;
  }
}

async function deleteSub(id: string) {
  try {
    await subStore.remove(id);
    showEditSub.value = false;
    Snackbar.success("已删除");
  } catch {
    Snackbar.error("删除失败");
  }
}

async function addTag() {
  if (!newTagTitle.value.trim()) return;
  addingTag.value = true;
  try {
    await tagStore.create({ title: newTagTitle.value.trim(), color: newTagColor.value });
    newTagTitle.value = "";
    newTagColor.value = randomColor();
    Snackbar.success("已保存");
  } finally {
    addingTag.value = false;
  }
}

function startEditTag(tag: any) {
  editingTag.value = tag;
  editTagTitle.value = tag.title;
  editTagColor.value = tag.color;
  showEditTag.value = true;
}

async function saveEditTag() {
  if (!editingTag.value || !editTagTitle.value.trim()) return;
  await tagStore.update(editingTag.value.id, {
    title: editTagTitle.value.trim(),
    color: editTagColor.value,
  });
  showEditTag.value = false;
  editingTag.value = null;
  Snackbar.success("已保存");
}

async function removeTag(id: string) {
  try {
    await tagStore.remove(id);
    Snackbar.success("已删除");
  } catch {
    Snackbar.error("删除失败");
  }
}
</script>
