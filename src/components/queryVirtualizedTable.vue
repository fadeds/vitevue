<template>
  <div class="queryTable">
    <el-form inline size="small">
      <el-form-item>
        <el-input prefix-icon="Search" placeholder="请输入查询内容"> </el-input>
      </el-form-item>
      <el-form-item>
        <el-button icon="Search" size="small" type="primary">检索</el-button>
      </el-form-item>
    </el-form>
    <el-auto-resizer>
      <template #default="{ height, width }">
        <el-table-v2 v-loading="loading" :columns="columnsList" :data="tableData" :height="height" :width="width" fixed>
        </el-table-v2>
      </template>
    </el-auto-resizer>
    <el-pagination small background layout="prev, pager, next" @size-change="sizeChange" @current-change="currentChange"
      :total="1000" />
  </div>
</template>
<script setup>
import { TableV2FixedDir, TableV2SortOrder } from 'element-plus'
// columns[0].fixed = true
// columns[1].fixed = TableV2FixedDir.LEFT
// columns[9].fixed = TableV2FixedDir.RIGHT
// 编辑
function cellRenderer({ rowData, column }) {
  const onChange = (value) => {
    rowData[column.dataKey] = value
  }
  const onEnterEditMode = () => {
    rowData.editing = true
  }

  const onExitEditMode = () => (rowData.editing = false)
  const input = ref()
  const setRef = (el) => {
    input.value = el
    if (el) {
      el.focus?.()
    }
  }
  return rowData.editing
    ? h(ElInput, {
        ref: setRef,
        modelValue: rowData[column.dataKey],
        onInput: onChange,
        onBlur: onExitEditMode,
        onKeydownEnter: onExitEditMode,
      })
    : h("div", {
        class: "table-v2-inline-editing-trigger",
        onClick: onEnterEditMode,
        innerHTML: rowData[column.dataKey],
      })
}
// 选择
function headerCellRenderer(){
  const _data = unref(tableData)
    const onChange = (value) =>
      (data.value = _data.map((row) => {
        row.checked = value
        return row
      }))
    const allSelected = _data.every((row) => row.checked)
    const containsChecked = _data.some((row) => row.checked)
    return h(ElCheckbox,{
        modelValue: rowData.checked,
        intermediate:containsChecked && !allSelected,
        onChange
  })
}
function SelectionCell({rowData, column}){
  const onChange = (value) => (rowData.checked = value)
  return h(ElCheckbox,{
        modelValue: rowData.checked,
        onChange
  })
}
// 传参
const props = defineProps({
  columns: {
    type: Array,
    default: [
      
    ],
  },
  data: {
    type: Array,
    default: [
      {
        ceshi: 123123123,
        asdf: "asdas",
      },
    ],
  },
})

const columnsList = ref(props.columns)
const tableData = ref(props.data)
const loading = ref(false)
const page = ref({
  pageNum: 1,
  pageSize: 20,
})
columnsList.value = [
  {
    key: 'selection',
    width: 50,
  },
  {
    title: "测试",
    dataKey: "asd",
    minWidth: "150px",
    width: 150,
  },
  {
    title: "测试",
    dataKey: "ceshi",
    minWidth: "150px",
    width: 150,
    cellRenderer,
  },
]
// 选择
columnsList.value.unshift({
  key: "selection",
  width: 50,
  cellRenderer: ({ rowData }) => {
    const onChange = (value) => (rowData.checked = value)
    return h(ElCheckbox, {
      modelValue: rowData.checked,
      onChange: onChange,
      indeterminate: false,
    })
  },

  headerCellRenderer: () => {
    const _data = unref(tableData)
    const onChange = (value) =>
      (tableData.value = _data.map((row) => {
        row.checked = value
        return row
      }))
    const allSelected = _data.every((row) => row.checked)
    const containsChecked = _data.some((row) => row.checked)

    return h(ElCheckbox, {
      modelValue: allSelected,
      onChange: onChange,
      indeterminate: containsChecked && !allSelected,
    })
  },
})

function currentChange(val) {}
function sizeChange(val) {}
onMounted(() => {
  console.log(props)
})
</script>
<style scoped lang="scss">
.queryTable {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;

  :deep(.el-table-v2__main) {
    border: var(--el-table-border);
    .el-table-v2__header-cell{
      background: var(--el-fill-color-light);
    }
    
    .el-table-v2__header-cell,
    .el-table-v2__row-cell {
      border-right: var(--el-table-border);
    }

    .table-v2-inline-editing-trigger:hover {
      border-color: var(--el-color-primary);
    }
  }

  .el-pagination {
    padding-top: 10px;
    box-sizing: border-box;
  }
}
</style>
