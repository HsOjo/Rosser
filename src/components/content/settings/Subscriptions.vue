<template>
  <a-table :columns="columns" :data-source="subscriptionCompositions" row-key="id" size="small" expand-row-by-click
           :row-selection="{}">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'title'">
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
            未分类
          </a-tag>
        </template>
      </template>
      <template v-else-if="column.key === 'action'">
        <a-button type="primary" danger size="small">
          <template #icon>
            <delete-outlined/>
          </template>
        </a-button>
      </template>
    </template>
    <template #expandedRowRender="{ record }">
      <a-descriptions :title="record.title" size="small">
        <a-descriptions-item label="站点" :span="4">{{ record.site && record.site.title }}</a-descriptions-item>
        <a-descriptions-item label="描述内容" :span="4">{{ record.description }}</a-descriptions-item>
        <a-descriptions-item label="URL" :span="4">
          <a :href="record.url" target="_blank">{{ record.url }}</a>
        </a-descriptions-item>
        <a-descriptions-item label="订阅时间" :span="4">{{ record.create_time }}</a-descriptions-item>
      </a-descriptions>
    </template>
  </a-table>
</template>

<script>
import {DeleteOutlined, DownOutlined, SmileOutlined} from "@ant-design/icons-vue";
import {useCompositions} from "@/utils/data";
import {useStore} from "vuex";

export default {
  name: "Subscriptions",
  components: {SmileOutlined, DownOutlined, DeleteOutlined},
  setup() {
    const store = useStore()
    const colors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple']
    const columns = [
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: '分类',
        key: 'category',
      },
      {
        title: '操作',
        key: 'action',
      },
    ];

    return {
      store,
      ...useCompositions(store),
      colors,
      columns,
    }
  },
}
</script>

<style scoped>

</style>