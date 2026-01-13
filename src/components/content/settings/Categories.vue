<template>
  <a-table :columns="columns" :data-source="categoryCompositions" row-key="id" size="small" expand-row-by-click
           :row-selection="{}">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'action'">
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
      <template v-else-if="column.key === 'subscriptions_num'">
        {{ record.subscriptions.length }}
      </template>
    </template>
    <template #expandedRowRender="{ record }">
      <a-descriptions :title="record.title" size="small">
        <a-descriptions-item :label="$t('common.description')" :span="3">{{ record.description }}</a-descriptions-item>
        <a-descriptions-item :label="$t('common.createTime')" :span="3">{{ record.create_time }}</a-descriptions-item>
      </a-descriptions>
    </template>
  </a-table>
  <a-button type="primary" @click="handleAdd">{{ $t('category.addCategory') }}</a-button>
</template>

<script>
import {DeleteOutlined, DownOutlined, EditOutlined, SmileOutlined} from "@ant-design/icons-vue";
import {useCompositions} from "@/utils/data";
import {useStore} from "vuex";
import api from "@/utils/api";
import {useI18n} from "vue-i18n";

export default {
  components: {SmileOutlined, DownOutlined, DeleteOutlined, EditOutlined},
  setup() {
    const store = useStore()
    const {t} = useI18n()
    const colors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple']
    const columns = [
      {
        title: t('common.title'),
        dataIndex: 'title',
      },
      {
        title: t('settings.categories.subscriptionCount'),
        key: 'subscriptions_num',
        width: '4rem',
      },
      {
        title: t('common.action'),
        key: 'action',
        width: '6rem',
      },
    ];

    function handleDelete(...ids) {
      api.category.delete(ids).then(
        () => store.commit('refreshState')
      )
    }

    function handleEdit(record) {
      store.commit('updateState', {
        category_edit_data: {
          id: record.id,
          title: record.title,
          description: record.description,
        },
        category_modal_visible: true
      })
    }

    function handleAdd() {
      store.commit('updateState', {
        category_edit_data: null,
        category_modal_visible: true
      })
    }

    return {
      store,
      ...useCompositions(store),
      colors,
      columns,
      handleDelete,
      handleEdit,
      handleAdd,
    }
  },
}
</script>

<style scoped>
button {
  margin-left: 4px;
  margin-right: 4px;
}
</style>
