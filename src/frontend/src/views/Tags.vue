<template>
  <n-space vertical>
    <n-page-header :title="t('tags')" @back="$router.push('/')" />

    <n-card :title="t('addTag')">
      <n-space>
        <n-input v-model:value="newTagTitle" :placeholder="t('tagTitle')" />
        <n-color-picker v-model:value="newTagColor" :modes="['hex']" />
        <n-button type="primary" :loading="adding" @click="addTag">{{ t('add') }}</n-button>
      </n-space>
    </n-card>

    <n-card :title="t('tags')">
      <n-spin :show="tagStore.loading">
        <n-empty v-if="!tagStore.loading && tagStore.tags.length === 0" :description="$t('noData')" />
        <n-list>
          <n-list-item v-for="tag in tagStore.tags" :key="tag.id" style="padding: 10px 16px">
            <n-space align="center">
              <n-tag :color="{ color: tag.color, textColor: '#fff' }">{{ tag.title }}</n-tag>
              <n-button text size="small" @click="startEdit(tag)">{{ t('edit') }}</n-button>
              <n-button text size="small" type="error" @click="removeTag(tag.id)">{{ t('delete') }}</n-button>
            </n-space>
          </n-list-item>
        </n-list>
      </n-spin>
    </n-card>

    <n-modal v-model:show="showEdit" :title="t('editTag')" preset="card" style="width: 400px">
      <n-space vertical>
        <n-input v-model:value="editTitle" :placeholder="t('tagTitle')" />
        <n-color-picker v-model:value="editColor" :modes="['hex']" />
        <n-space>
          <n-button type="primary" :loading="saving" @click="saveEdit">{{ t('save') }}</n-button>
          <n-button @click="showEdit = false">{{ t('close') }}</n-button>
        </n-space>
      </n-space>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useTagStore } from "@/stores";

const router = useRouter();
const { t } = useI18n();
const tagStore = useTagStore();

const newTagTitle = ref("");
const newTagColor = ref("#18a058");
const adding = ref(false);

const showEdit = ref(false);
const editingId = ref<string | null>(null);
const editTitle = ref("");
const editColor = ref("#18a058");
const saving = ref(false);

onMounted(() => {
  tagStore.fetchAll();
});

async function addTag() {
  if (!newTagTitle.value.trim()) return;
  adding.value = true;
  try {
    await tagStore.create({ title: newTagTitle.value, color: newTagColor.value });
    newTagTitle.value = "";
    newTagColor.value = "#18a058";
  } finally {
    adding.value = false;
  }
}

function startEdit(tag: any) {
  editingId.value = tag.id;
  editTitle.value = tag.title;
  editColor.value = tag.color || "#18a058";
  showEdit.value = true;
}

async function saveEdit() {
  if (!editingId.value) return;
  saving.value = true;
  try {
    await tagStore.update(editingId.value, { title: editTitle.value, color: editColor.value });
    showEdit.value = false;
    editingId.value = null;
  } finally {
    saving.value = false;
  }
}

async function removeTag(id: string) {
  await tagStore.remove(id);
}
</script>
