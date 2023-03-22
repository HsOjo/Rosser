<template>
  <a-menu @click="itemClick">
    <template :key="menu_item.key" v-for="menu_item in menuItems">
      <a-menu-item-group v-if="menu_item.items">
        <template #title>
          <component :is="menu_item.icon" v-if="menu_item.icon"></component>
          {{ menu_item.title }}
        </template>

        <template :key="sub_item.key" v-for="sub_item in menu_item.items" v-if="menu_item.items">
          <a-menu-item v-if="sub_item.key" :key="sub_item.key">
            <template #icon v-if="sub_item.checkable !== false">
              <template v-if="sub_item.select">
                <check-circle-outlined v-if="sub_item.checked"/>
                <span v-else/>
              </template>
              <template v-else>
                <check-outlined v-if="sub_item.checked"/>
                <span v-else/>
              </template>
            </template>
            <component :is="sub_item.icon" v-if="sub_item.icon"></component>
            {{ sub_item.title }}
          </a-menu-item>
          <a-menu-divider v-else/>
        </template>
      </a-menu-item-group>
      <a-menu-item v-else-if="menu_item.key" :key="menu_item.key">
        <template #icon v-if="menu_item.checkable !== false">
          <template v-if="menu_item.select">
            <check-circle-outlined v-if="menu_item.checked"/>
            <span v-else/>
          </template>
          <template v-else>
            <check-outlined v-if="menu_item.checked"/>
            <span v-else/>
          </template>
        </template>
        <component :is="menu_item.icon" v-if="menu_item.icon"></component>
        {{ menu_item.title }}
      </a-menu-item>
      <a-menu-divider v-else/>
    </template>
  </a-menu>
</template>

<script lang="ts">
import {computed, ref} from "vue";
import {CheckCircleOutlined, CheckOutlined} from "@ant-design/icons-vue";
import lodash from "lodash";

export default {
  name: "CheckMenu",
  components: {CheckOutlined, CheckCircleOutlined},
  props: {
    items: {type: Array<Object>}
  },
  emits: ['click'],
  setup(props, {emit}) {
    const checked_state = ref({})
    const menuItems = computed(() => {
      let result = []
      let group_mapping = {}
      for (let item of lodash.cloneDeep(props.items)) {
        if (item.group) {
          let group = group_mapping[item.group]
          // 选择组模式
          if (group.select && item.select === undefined)
            item.select = group.key
          // 触发组模式
          if (group.trigger && item.checkable === undefined)
            item.checkable = !group.trigger
          group.items.push(item)
        } else {
          if (item.items)
            group_mapping[item.key] = item
          result.push(item)
        }
        if (checked_state.value[item.key] !== undefined)
          item.checked = checked_state.value[item.key]
        if (item.value === undefined)
          item.value = item.key
      }
      return result
    })
    const menuItemsArray = computed(() => {
      let result = []
      menuItems.value.map(item => {
        result.push(item)
        if (item.items)
          item.items.map(sub_item => result.push(sub_item))
      })
      return result
    })
    const menuItemsMapping = computed(() => {
      let result = {}
      menuItemsArray.value.map(item => result[item.key] = item)
      return result
    })

    function itemClick({key}) {
      let menu_item = menuItemsMapping.value[key]

      if (menu_item.select) {
        // 选择模式
        menuItemsArray.value.filter(
            item => item.select === menu_item.select
        ).map(
            item => checked_state.value[item.key] = false
        )

        checked_state.value[menu_item.key] = true
        emit('click', menuItemsMapping.value[key])
      } else {
        if (menu_item.checkable !== false) {
          // 开关模式
          let checked = checked_state.value[menu_item.key]
          if (checked === undefined)
            checked = menu_item.checked

          checked_state.value[menu_item.key] = !checked
          emit('click', menuItemsMapping.value[key])
        } else {
          // 触发模式
          emit('click', menuItemsMapping.value[key])
        }
      }
    }

    return {
      itemClick,
      menuItems,
    }
  }
}
</script>

<style scoped>

</style>