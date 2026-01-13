<template>
  <a-table :columns="columns" :data-source="categoryCompositions" row-key="id" size="small" expand-row-by-click
           :row-selection="{}">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'action'">
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
</template>

<script>
import {DeleteOutlined, DownOutlined, SmileOutlined} from "@ant-design/icons-vue";
import {useCompositions} from "@/utils/data";
import {useStore} from "vuex";
import api from "@/utils/api";
import {useI18n} from "vue-i18n";

export default {
  components: {SmileOutlined, DownOutlined, DeleteOutlined},
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
        width: '3rem',
      },
    ];

    function handleDelete(...ids) {
      api.category.delete(ids).then(
        () => store.commit('refreshState')
      )
    }

    return {
      store,
      ...useCompositions(store),
      colors,
      columns,
      handleDelete,
    }
  },
}
</script>

<style scoped>

</style>
