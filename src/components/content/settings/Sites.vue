<template>
  <a-table :columns="columns" :data-source="siteCompositions" row-key="id" size="small" expand-row-by-click
           :row-selection="{}">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'title'">
        <img :src="`${backendURL}/api/basic/file/download/${record.favicon_id}`"
             v-if="record.favicon_id" class="menu-icon" alt="icon"/>
        {{ record.title && record.title.length ? record.title : $t('settings.sites.noTitle') }}
      </template>
      <template v-else-if="column.key === 'action'">
        <a-button type="primary" size="small" @click="clickSync(record.id)">
          <template #icon>
            <sync-outlined/>
          </template>
        </a-button>
      </template>
      <template v-else-if="column.key === 'subscriptions_num'">
        {{ record.subscriptions.length }}
      </template>
    </template>
    <template #expandedRowRender="{ record }">
      <a-descriptions :title="record.title" size="small">
        <a-descriptions-item :label="$t('common.url')" :span="3">
          <a :href="record.url" target="_blank">{{ record.url }}</a>
        </a-descriptions-item>
        <a-descriptions-item :label="$t('common.createTime')" :span="3">{{ record.create_time }}</a-descriptions-item>
        <a-descriptions-item :label="$t('common.updateTime')" :span="3">{{ record.update_time }}</a-descriptions-item>
      </a-descriptions>
    </template>
  </a-table>
</template>

<script>
import {DownOutlined, SmileOutlined, SyncOutlined} from "@ant-design/icons-vue";
import {useCompositions} from "@/utils/data";
import {mapGetters, useStore} from "vuex";
import api from "@/utils/api";
import {useI18n} from "vue-i18n";

export default {
  components: {SmileOutlined, DownOutlined, SyncOutlined},
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

    function clickSync(id) {
      api.site.fetch(id)
    }

    return {
      store,
      ...useCompositions(store),
      clickSync,
      colors,
      columns,
    }
  },
}
</script>

<style scoped>
.menu-icon {
  width: 1rem;
  height: 1rem;
}

</style>
