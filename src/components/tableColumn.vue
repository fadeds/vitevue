<script setup >
import tableCellCustom from "./tableCellCustom.vue"
let props = defineProps({
  col: {
    type: Object,
    default: {},
  },
})
watch(props, (a) => {
  col.value = a.col
}
)

let keyWord=ref('')
let keyWordObj=ref({})
const emit = defineEmits(["childrenBlur",'headerFilterFn','childrenFocus'])
const col = ref(props.col)
function blur(row) {
  emit("childrenBlur", row)
}
function focus(row) {
  emit("childrenFocus", row)
}

function headerFilterFn(column){
  emit("headerFilterFn", {column,keyWordObj:keyWordObj.value})
}
// 过滤无用的属性
function filterBind(item) {
  let arr = ["children", "editType", 'inputCahnge','formatter']
  let obj = {}
  for (const key in item) {
    if (Object.hasOwnProperty.call(item, key)) {
      let element = item[key]                 
      if (arr.indexOf(key) === -1) {
        obj[key] = element
      }
    }
  }
  return obj
}
</script>
<template>
  <template v-if="props.col?.children">
    <el-table-column header-align="center" align="center" v-bind="filterBind(props.col)" show-overflow-tooltip
      :key="props.col.prop">
      <TableColumn @children-blur="blur" @childrenFocus="focus" v-for="(item,index) in props.col.children" :col="item" :key="index" />
    </el-table-column>
  </template>
  <el-table-column v-else header-align="center" align="center" v-bind="filterBind(props.col)" show-overflow-tooltip
    :key="props.col.prop">
    <template #header="{column}">
      {{ column.label }} 
      <el-popover v-if='props.col.filterHeader' placement="top" @hide="headerFilterFn(column)"  trigger="click">
        <template #reference>
          <el-icon :size="12">
            <Filter />
          </el-icon>
        </template>
        <el-input v-model="keyWordObj[column.property]" placeholder="请输入"></el-input>
      </el-popover>
    </template>
    <template #default="scope">
      <tableCellCustom :scope="scope" :columnObj="props.col" @children-blur="blur" @childrenFocus="focus">
        <template #table_expand="scopeItem">
          <slot name="table_expand" :scope="scopeItem.scope" />
        </template>
      </tableCellCustom>
    </template>
  </el-table-column>
</template>

<style lang="scss" scoped>

</style>
