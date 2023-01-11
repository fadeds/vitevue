<template>
  <el-button type="primary" @click="show = true">{{
    props.buttonText
  }}</el-button>
  <el-dialog v-model="show" title="导入导出选择" width="400px" @close="close">
    <el-form
      ref="form"
      label-width="80px"
      class="fileExImport"
      :model="formData"
      :rules="rules"
    >
      <el-form-item label="操作" prop="fileType">
        <el-select placeholder="请选择" v-model="formData.fileType">
          <el-option label="导入" value="importUrl"></el-option>
          <el-option label="导出" value="exportUrl"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        label="文件选择"
        v-if="formData.fileType === 'importUrl'"
        prop="fileBole"
      >
        <el-upload
          ref="upload"
          :accept="props.acceptList.join(',')"
          :action="apiConfig + importUrl"
          :limit="1"
          :on-success="onSuccess"
          :on-error="onError"
          :on-change="onChange"
          :before-upload="beforeUpload"
          :auto-upload="false"
          :show-file-list="false"
        >
          <template #trigger>
            <el-input placeholder="请选择文件" v-model="formData.fileBole.name">
            </el-input>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="confirm">确 定</el-button>
      <el-button type="primary" @click="show = false">取 消</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { downloadFn } from "@/api"
import { downloadFile } from "@/utils"
import { onMounted } from "@vue/runtime-core"
import { ElLoading, ElMessage } from "element-plus"

let props = defineProps({
  exportUrl: {
    type: String,
    default: "",
  },
  importUrl: {
    type: String,
    default: "",
  },
  queryData: {
    type: Object,
    defalut() {
      return {}
    },
  },
  buttonText: {
    type: String,
    default: "导入导出",
  },
  acceptList: {
    type: Array,
    default: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
})

let emit = defineEmits(["success"])
let upload = ref()
let form = ref()

let show = ref(false)
let apiConfig = import.meta.env.VITE_API_BASE_CONFIG
let formData = ref({
  fileType: "",
  fileBole: {},
})
let rules = {
  fileType: [{ required: true, message: "请选择操作", trigger: "change" }],
  fileBole: [{ required: true, message: "请选择文件", trigger: "change" }],
}
let loadingInstance = null

async function confirm() {
  try{
    let flag = await form.value.validate().catch((err) => {
      return false
    })
    if (!flag) {
      // ElMessage.error("请输入完整数据！")
      return
    }
  }catch(e){}
  if (formData.value.fileType === "importUrl") {
    if (!formData.value.fileBole.name) {
      ElMessage.warning("请选择文件！")
      return
    }
    loadingInstance = ElLoading.service({
      fullscreen: true,
      text: "正在上传中，请稍后...",
    })
    upload.value?.submit()
  } else {
    dowload()
  }
}
async function dowload() {
  try {
    loadingInstance = ElLoading.service({
      fullscreen: true,
      text: "正在下载中，请稍后...",
    })
    let item = await downloadFn(props.exportUrl, props.queryData)
    // let item = await downloadFn(props.exportUrl)
    downloadFile(item)
    loadingInstance.close()
    show.value = false
  } catch (e) {
    loadingInstance.close()
  }
}
function onSuccess(res, UploadFile) {
  loadingInstance.close()
  let successCodeList = ["00101", "00104", "00107", "00110", "00113", "00005"]
  let { code,rst } = res
  if (!code || successCodeList.indexOf(code) === -1) {
    ElMessage.error(rst || "请联系管理员！")
    show.value = false
    return
  }
  show.value = false
  ElMessage.success("上传成功")
  emit("success")
}
function onError(err, uploadFile) {
  let { rst } = err
  show.value=false
  loadingInstance.close()
  ElMessage.error(rst||"上传失败")
}
function onChange(rawFile, UploadFiles) {
  let { raw } = rawFile
  console.log(rawFile)
  if (props.acceptList.indexOf(raw.type) === -1) {
    ElMessage.warning("请上传xls、xlsx类型文件")
    return false
  }
  if (raw.size > 10 * 1024 * 1024) {
    ElMessage.warning("请上传 10M 以内的文件！")
    return false
  }
  formData.value.fileBole = rawFile
}
function beforeUpload(rawFile) {
  console.log(rawFile)
  if (props.acceptList.indexOf(rawFile.type) === -1) {
    ElMessage.warning("请上传xls、xlsx类型文件")
    loadingInstance.close()
    return false
  }
  if (rawFile.size > 10 * 1024 * 1024) {
    ElMessage.warning("请上传 10M 以内的文件！")
    loadingInstance.close()
    return false
  }
  return true
}
function preview(e) {
  e.stopPropagation()
  let url = window.URL.createObjectURL(formData.value.fileBole.raw)
  window.open(url, "_blank")
}
function fixdata(data) {
  //文件流转BinaryString
  var o = "",
    l = 0,
    w = 10240
  for (; l < data.byteLength / w; ++l)
    o += String.fromCharCode.apply(
      null,
      new Uint8Array(data.slice(l * w, l * w + w))
    )
  o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)))
  return o
}

function close() {
  formData.value = {
    fileType: "",
    fileBole: {},
  }
  form.value.resetFields()
}
onMounted(() => {
  // console.log(props)
})
</script>
<style lang="scss" scoped>
.fileExImport {
  .el-form-item {
    width: 100%;
    .el-form-item__content {
      flex: 1;
      & > * {
        flex: 1;
      }
    }
    :deep(.el-upload) {
      width: 100%;
    }
    margin-bottom: 18px;
    & + .el-form-item {
      margin-left: 0 !important;
    }
  }
}
</style>
