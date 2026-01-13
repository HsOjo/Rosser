<template>
  <a-table :columns="columns" :data-source="subscriptionCompositions" row-key="id" size="small" expand-row-by-click
           :row-selection="{}">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'title'">
        <img :src="`${backendURL}/api/basic/file/download/${record.site.favicon_id}`"
             v-if="record.site && record.site.favicon_id" class="menu-icon" alt="icon"/>
        {{ record.title }}
      </template>
      <template v-else-if="column.key === 'category'">
        <template v-if="record.category">
          <a-tag :color="colors.at(record.category_id % colors.length)">
            {{ record.category.title }}
          </a-tag>
        </template>
        <template v-else>
          <a-tag color="grey">
            {{ $t('common.uncategorized') }}
          </a-tag>
        </template>
      </template>
      <template v-else-if="column.key === 'action'">
        <a-button type="primary" size="small"
                  @click.stop="handleEdit(record)">
          <template #icon>
            <edit-outlined/>
          </template>
        </a-button>
        <a-button type="primary" danger size="small"
                  @click.stop="handleDelete(record.id)">
          <template #icon>
            <delete-outlined/>
          </template>
        </a-button>
      </template>
    </template>
    <template #expandedRowRender="{ record }">
      <a-descriptions :title="record.title" size="small">
        <a-descriptions-item :label="$t('settings.subscriptions.site')" :span="3">{{ record.site && record.site.title }}</a-descriptions-item>
        <a-descriptions-item :label="$t('common.description')" :span="3">{{ record.description }}</a-descriptions-item>
        <a-descriptions-item :label="$t('common.url')" :span="3">
          <a :href="record.url" target="_blank">{{ record.url }}</a>
        </a-descriptions-item>
        <a-descriptions-item :label="$t('settings.subscriptions.subscriptionTime')" :span="3">{{ record.create_time }}</a-descriptions-item>
      </a-descriptions>
    </template>
  </a-table>
  <a-button @click="importOPML">{{ $t('settings.subscriptions.importOPML') }}</a-button>
  <a-button @click="exportOPML">{{ $t('settings.subscriptions.exportOPML') }}</a-button>
</template>

<script>
import {DeleteOutlined, DownOutlined, EditOutlined, QuestionCircleOutlined, SmileOutlined} from "@ant-design/icons-vue";
import {useCompositions} from "@/utils/data";
import {mapGetters, useStore} from "vuex";
import api from "@/utils/api";
import {useI18n} from "vue-i18n";

export default {
  name: "Subscriptions",
  components: {SmileOutlined, DownOutlined, DeleteOutlined, EditOutlined, QuestionCircleOutlined},
  computed: {
    ...mapGetters(['backendURL'])
  },
  setup() {
    const store = useStore()
    const {t} = useI18n()
    const colors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple']
    const columns = [
      {
        title: t('common.title'),
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: t('settings.subscriptions.category'),
        key: 'category',
      },
      {
        title: t('common.action'),
        key: 'action',
        width: '6rem',
      },
    ];

    function importOPML() {
      let paths = store.getters.electron.ipcRenderer.sendSync('open_dialog', {
        filters: [
          {name: 'OPML Files', extensions: ['opml']},
          {name: 'All Files', extensions: ['*']},
        ]
      })
      api.basic.importOPML(paths.pop())
    }

    function exportOPML() {
      let path = store.getters.electron.ipcRenderer.sendSync('save_dialog', {
        filters: [
          {name: 'OPML Files', extensions: ['opml']},
          {name: 'All Files', extensions: ['*']},
        ]
      })
      api.basic.exportOPML(path)
    }

    function handleDelete(...ids) {
      api.subscription.delete(ids).then(
        () => store.commit('refreshState')
      )
    }

    function handleEdit(record) {
      store.commit('updateState', {
        subscribe_edit_data: {
          id: record.id,
          url: record.url,
          title: record.title,
          description: record.description,
          category_id: record.category_id,
        },
        subscribe_modal_visible: true
      })
    }

    return {
      store,
      ...useCompositions(store),
      colors,
      columns,
      importOPML,
      exportOPML,
      handleDelete,
      handleEdit,
    }
  },
}
</script>

<style scoped>
.menu-icon {
  width: 1rem;
  height: 1rem;
}

button {
  margin-left: 4px;
  margin-right: 4px;
}
</style>
