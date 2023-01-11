<template>
  <div class="queryTable">
    <el-header v-if="showHeader">
      <el-form inline :size="props.size">
        <slot name="query_content_left"></slot>
        <slot></slot>
        <slot name="query_content_right"></slot>
        <el-form-item>
          <el-button icon="Search" type="primary" @click="handleSearch"
            >检索</el-button
          >
        </el-form-item>
      </el-form>
      <div class="query_right">
        <slot name="query_right"></slot>
      </div>
    </el-header>
    <div class="middle">
      <slot name="middle"></slot>
      <!-- <el-tree-select v-model="treeSelect" @change="treeSelectChange" :data="columnsList" :props="treeSelectProps" show-checkbox multiple collapse-tags collapse-tags-tooltip
        :render-after-expand="false" /> -->
    </div>
    <el-main>
      <el-table
        :ref="(el) => setTableRef(el, props.tableRef)"
        :size="props.size"
        v-bind="tableConfig"
        v-loading="loading"
        element-loading-text="正在加载中，请稍后..."
        border
        highlight-current-row
        :current-row-key="currentRowKey"
        :row-key="rowKeyFn"
        :data="filterTableData"
        style="width: 100%"
        @current-change="highlightChange"
        @cell-click="cellClick"
        @cell-dblclick="cellDblclick"
        @select-all="selectAll"
        @select="selectionChange"
        @expandChange="expandChange"
        @sort-change="sortChange"
      >
        <el-table-column
          v-if="showSelection"
          :selectable="selectableFn"
          type="selection"
        ></el-table-column>
        <slot name="query_table_left"></slot>
        <template v-for="(col, index) in columnsList" :key="index">
          <TableColumn
            :col="col"
            @children-blur="childrenBlur"
            @childrenFocus="childrenFocus"
            @headerFilterFn="headerFilterFn"
          >
            <template #table_expand="scope">
              <slot name="table_expand" :scope="scope.scope" />
            </template>
          </TableColumn>
        </template>

        <slot name="query_table_right"></slot>
      </el-table>
      <footer>
        <el-pagination
          v-if="props.showPage"
          small
          background
          :current-page="page.currentPage"
          :page-size="page.pageSize"
          :page-sizes="pageSizes"
          layout="prev, pager, next, sizes, total"
          @size-change="sizeChange"
          @current-change="currentChange"
          :total="total"
        />
        <div class="total_tip">
          <slot name="total_tip" />
        </div>
      </footer>
    </el-main>
  </div>
</template>
<script setup>
import { handleError, nextTick } from "@vue/runtime-core";
import { isArray } from "lodash";
import TableColumn from "./tableColumn.vue";
const emit = defineEmits([
  "childrenBlur",
  "highlightChange",
  "selectionChange",
  "sortChange",
  "expandChange",
  "cellClick",
  "cellDblclick",
  "customSelectionChange",
]);

let props = defineProps({
  tableConfig: {
    type: Object,
    default: {},
  },
  columns: {
    type: Array,
    default: [],
  },
  data: {
    type: Array,
    default: [],
  },
  queryFn: {
    type: Function,
  },
  queryEndFN: {
    type: Function,
  },
  selectableFn: {
    type: Function,
  },
  queryData: {
    type: Object,
    default() {
      return {};
    },
  },
  pageSizes: {
    type: Array,
    default: [10, 20, 50, 100, 200, 500],
  },
  queryFlag: {
    type: Boolean,
    default: true,
  },
  highlightCurrentRow: {
    type: Boolean,
    default: false,
  },
  showPage: {
    type: Boolean,
    default: true,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showSelection: {
    type: Boolean,
    default: false,
  },
  filterTableFlag: {
    type: Boolean,
    default: false,
  },
  filterArray: {
    type: Array,
    default: [],
  },
  rowKey: {
    type: String,
    default: "id",
  },
  size: {
    type: String,
    default: "default",
  },
  tableRef: {
    type: String,
    default: "tableRef",
  },
});
function rowKeyFn(row){
  console.log( row[props.rowKey]+''+row.statTime)
  return row[props.rowKey]+''+row.statTime
}
let treeSelectProps = ref({
  label: "label",
  value: "prop",
  children: "children",
});
let treeSelect = ref([]);
function treeSelectChange(val, b) {
  console.log(val);
  console.log(b);
  console.log(treeSelect.value);
}

let tableRefs = ref({});
function setTableRef(el, key) {
  tableRefs.value[key] = el;
}
let changeCellOldValue = ref();
let currentRowKey = ref("");
let columnsList = ref(props.columns);
let tableData = ref(props.data);
let filterTableData = ref([]);
let removeList = ref([]);
const loading = ref(false);
let tableCell = ref(null);
let total = ref(0);
let changeTableData = ref([]);
const page = ref({
  currentPage: 1,
  pageSize: 50,
});

watch(
  () => props.columns,
  (value) => {
    columnsList.value = [];
    nextTick(() => {
      columnsList.value = value;
    });
  },
  {
    deep: true,
    // immediate:true
  }
);
// 表格默认选中
watch(
  () => filterTableData.value,
  (newValue) => {
    nextTick(() => {
      // 默认选中
      if (props.showSelection && newValue.length) {
        newValue.forEach((element) => {
          if (
            element.type === 1 ||
            oldCheckRow.filter(
              (item) => item[props.rowKey] === element[props.rowKey]
            ).length
          ) {
            tableRefs.value[props.tableRef].toggleRowSelection(element, true);
            oldCheckRow.push(element);
          }
        });
      }
      // 默认高亮行
      if (props.highlightCurrentRow) {
        tableRefs.value[props.tableRef].setCurrentRow(newValue[0]);
      }
    });
  }
);

// 表格编辑
function childrenBlur({ row, prop }) {
  let { id, orgId, statTime } = row;
  // 比较新老值
  if (row[prop] === changeCellOldValue.value) {
    // cancelEditable();
    return;
  }
  let index = 0;
  let arr = changeTableData.value.filter((item, indexitem) => {
    if (item.id === id && item.orgId === orgId && item.statTime === statTime) {
      index = indexitem;
    }
    return item.id === id && item.orgId === orgId && item.statTime === statTime;
  });
  if (arr.length) {
    changeTableData.value[index][prop] = row[prop];
  } else {
    let a = {
      id,
      orgId,
      statTime,
    };
    a[prop] = row[prop];
    changeTableData.value.push(a);
  }
  emit("childrenBlur", { row, prop });
  // cancelEditable();
}
function childrenFocus({ row, prop }) {
  changeCellOldValue.value = row[prop];
}
function cancelEditable() {
  if (!tableCell.querySelector(".item__input")) {
    return;
  }
  tableCell.querySelector(".item__input").style.display = "none";
  tableCell.querySelector(".item__txt").style.display = "block";
}
function cellDblclick(row, column, cell, event) {
  emit("cellDblclick", { row, column, cell, event });
  tableCell = cell;
  if (!tableCell.querySelector(".item__input")) {
    return;
  }
  // 储存旧值
  changeCellOldValue.value = row[column.property];
  tableCell.querySelector(".item__txt").style.display = "none";
  tableCell.querySelector(".item__input").style.display = "block";
  tableCell.querySelector(".el-input__inner").focus();
}

function cellClick(row, column, cell, event) {
  emit("cellClick", { row, column, cell, event });
}
function highlightChange(row, oldRow) {
  emit("highlightChange", { row, oldRow });
}
function expandChange(row, expandedRows) {
  emit("expandChange", { row, expandedRows });
}
function sortChange(data) {
  emit("sortChange", data);
}
let oldCheckRow = [],
  checkRow = [],
  unCheckRow = [];
function selectionChange(selection) {
  getRowList(selection);
  emit("selectionChange", selection);
}
function selectAll(selection) {
  getRowList(selection);
  emit("selectionChange", selection);
}
function getRowList(selection) {
  let { rowKey } = props;
  checkRow = selection.map((item) => item[rowKey]);
  unCheckRow = [];
  filterTableData.value.forEach((item) => {
    if (checkRow.indexOf(item[rowKey]) === -1) {
      unCheckRow.push(item[rowKey]);
    }
  });
  // 过滤默认未选中
  oldCheckRow = oldCheckRow.filter(
    (item) => unCheckRow.indexOf(item[rowKey]) === -1
  );
  // 合并去重选中
  let idList = Array.from(
    new Set([...checkRow, ...oldCheckRow.map((item) => item[rowKey])])
  );
  // 获取选中row数据
  oldCheckRow = tableData.value.filter(
    (item) => idList.indexOf(item[rowKey]) !== -1
  );
  // 传递给父级
  emit("customSelectionChange", { row: oldCheckRow, idList });
}
// 检索按钮
function handleSearch(){
  changeTableData.value=[]
  currentChange(1)
}
// 分页查询
function currentChange(val) {
  page.value.currentPage = val;
  // // 前端过滤
  // if (props.filterTableFlag && !props.showPage && tableData.value.length) {
  //   oldCheckRow=[]
  //   filterData();
  //   return;
  // }
  getList();
}
function sizeChange(val) {
  page.value.pageSize = val;
  currentChange(1);
}
// 表头筛选
function headerFilterFn({ column, keyWordObj }) {
  loading.value = true;
  let { property } = column;
  let value = keyWordObj[property];
  if (!value) {
    filterTableData.value = tableData.value;
    loading.value = false;
    return;
  }
  let arr = tableData.value.filter((item) => {
    return (item[property] || "").indexOf(value) !== -1;
  });
  loading.value = false;
  filterTableData.value = arr;
}
// 前端筛选
function filterData() {
  oldCheckRow = [];
  let arr = tableData.value.filter((item) => {
    let arr1 = props.filterArray.filter((item1) => {
      return (item[item1] || "").indexOf(props.queryData.keyWord) !== -1;
    });
    return arr1.length || !props.filterArray.length;
  });
  filterTableData.value = arr;
}
async function getList() {
  if (!props.queryFn) {
    return;
  }
  loading.value = true;
  tableData.value = [];
  try {
    let { rst } = await props.queryFn({
      ...(props.showPage ? page.value : {}),
      ...props.queryData,
    });

    tableData.value = rst?.data || rst || [];
    removeList.value = rst?.removeList || rst || [];
    if (props.showPage) {
      total.value = rst.totalCount || 0;
    }
    props.queryEndFN && props.queryEndFN();
    loading.value = false;
    // 初始化
    filterData();
  } catch (e) {
    filterData();
    loading.value = false;
  }
}
function resetPage() {
  page.value = {
    currentPage: 1,
    pageSize: 20,
  };
  total.value = 0;
}
onMounted(() => {
  props.queryFlag && currentChange(1);
  filterTableData.value = tableData.value;
});

defineExpose({
  tableRefs: tableRefs,
  tableData,
  removeList,
  upList: changeTableData,
  currentChange,
  filterData,
});
</script>
<style scoped lang="scss">
.queryTable {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0px;
  box-sizing: border-box;

  .el-header {
    height: auto;
    display: flex;
    justify-content: space-between;

    .query_right {
      min-width: 188px;
      :deep(.el-form) {
        .el-form-item {
          margin-right: 0;
          & + .el-form-item {
            margin-left: 12px;
          }
        }
      }
    }
  }

  .el-main {
    padding: 0px;
    display: flex;
    flex-direction: column;
  }

  .el-table {
    flex: 1;
  }

  :deep(.el-table__expanded-cell) {
    .item__txt {
      display: none;
    }
  }

  footer {
    display: flex;
    justify-content: space-between;

    .total_tip {
      flex: 1;
      text-align: right;
      line-height: 36px;
      max-height: 36px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .el-pagination {
    padding-top: 10px;
    box-sizing: border-box;
  }
}
</style>
