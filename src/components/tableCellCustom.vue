<template>
  <!-- more -->
  <!-- <div class="item__txt" v-if="!columnObj.showContent"> -->
  <div
    class="cell"
    v-if="
      (!columnObj.showContent &&
        columnObj.editType !== 'input' &&
        columnObj.type !== 'expand') ||
      scope.row.statTime === '合计'
    "
  >
    {{
      columnObj.formatter
        ? columnObj.formatter(scope, columnObj.prop) || "-"
        : scope.row[columnObj.prop] || "-"
    }}
  </div>
  <!-- 取值范围 -->
  <div class="range_content" v-if="columnObj.showContent === 'range'">
    <p v-if="scope.row[columnObj.prop]">
      <el-checkbox
        v-model="scope.row[columnObj.prop].selType"
        disabled
        :label="showTableCell(scope.row[columnObj.prop].value) + ''"
        :true-label="1"
        :false-label="2"
      />
    </p>
    <p v-if="scope.row[columnObj.prop]">
      <el-checkbox
        v-model="scope.row[columnObj.prop].selType"
        :label="`${showTableCell(
          scope.row[columnObj.prop].minNum
        )} 至 ${showTableCell(scope.row[columnObj.prop].maxNum)} `"
        disabled
        :true-label="2"
        :false-label="1"
      />
    </p>
    {{ scope.row[columnObj.prop] ? "" : "-" }}
  </div>
  <!-- 修改输入框 -->
  <el-input
    v-if="
      columnObj.editType === 'input' &&
      scope.row.statTime !== '合计' &&
      (scope.row.notEditor
        ? scope.row.notEditor.split(',').indexOf(columnObj.prop) === -1
        : true)
    "
    class="item__input"
    v-model="scope.row[columnObj.prop]"
    @input="
      (value) => {
        if (columnObj.inputCahnge) {
          scope.row[columnObj.prop] = columnObj.inputCahnge(value);
        }
        // inputCahnge(scope.row, columnObj)
      }
    "
    @focus="focus({ row: scope.row, prop: columnObj.prop })"
    @blur="blur({ row: scope.row, prop: columnObj.prop })"
  >
    <template
      #suffix
      v-if="
        percenKeyWords.filter((item) => columnObj.label.indexOf(item) !== -1)
          .length
      "
    >
      %
    </template>
  </el-input>

  <!-- 展开行 -->
  <slot name="table_expand" :scope="scope" v-if="columnObj.type === 'expand'" />
</template>
<script setup>
// import {floatIntFour} from '@/utils/index.js'
const emit = defineEmits(["childrenBlur", "childrenFocus"]);
function blur(row) {
  emit("childrenBlur", row);
}
function focus(row) {
  emit("childrenFocus", row);
}
let percenKeyWords = ref(["比", "率"]);
let props = defineProps({
  columnObj: {
    type: Object,
    default: {},
  },
  scope: {
    type: Object,
    default: {},
  },
});

function inputCahnge(row, obj) {
  if (obj.inputCahnge) {
    row[obj.prop] = obj.inputCahnge(row[obj.prop]);
  }
}

function showTableCell(value, prop) {
  if (value == 0) {
    return value;
  }
  let a = value || "-";
  return a.toString();
}
</script>
<style lang="scss" scoped>
.cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
}
.item__txt {
  display: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item__input {
  // display: none;
  :deep(.el-input__wrapper) {
    width: 100%;
    .el-input__inner {
      padding-right: 5px;
      text-align: right;
    }
  }
}
.range_content {
  p {
    margin: 0 !important;
    :deep(.el-checkbox) {
      cursor: default;
      height: 23px;
      .el-checkbox__inner,
      .el-checkbox__label {
        cursor: default;
        &::after {
          cursor: default;
        }
      }
    }
  }
}
</style>
