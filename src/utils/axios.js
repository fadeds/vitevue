import axios from "axios"
import route from "../route/index"
import { clearAllCookie } from "@/utils/index.js";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_CONFIG // config.js 里面控制
axios.defaults.withCredentials = false
axios.defaults.timeout = 20 * 3600 * 1000

axios.interceptors.request.use((config) => {
  if (config.url.indexOf("export") !== -1) {
    config.responseType = "blob"
  }
  return config
})

let successCodeList = ["00101", "00104", "00107", "00110", "00113", "00005",'00301']
axios.interceptors.response.use(
  (response) => {
    let { config, data, status } = response
    // 文件下载
    if (config.url.indexOf("export") !== -1) {
      return response
    }
    if (data.code && data.code == "00003") {
      let ErrorData = data.desc || "登录过期请重新登录！"
      ElMessage.error(data.desc || "登录过期请重新登录！")
      clearAllCookie()
      route.push("login")
      return Promise.reject(ErrorData)
    }
    if (!data.code || successCodeList.indexOf(data.code) === -1) {
      let ErrorData = data.desc || "请联系管理员！"
      ElMessage.error(data.desc || "请联系管理员！")
      return Promise.reject(ErrorData)
    }
    if (config.url.indexOf("download") !== -1) {
      return response
    } else {
      return data
    }
  },
  (error) => {
    let messages = null
    switch (error.response.status) {
      case 400:
        messages = "请求错误"
        break
      // case 401:
      //   messages = "未授权，请登录"
      //   Cookies.remove("token") //删除token
      //   setTimeout(() => {
      //     location.href = Cookies.get("login") //跳转至登录页
      //   }, 2000)
      //   break
      case 403:
        messages = "拒绝访问"
        break
      case 404:
        messages = `请求地址出错: ${error.response.config.url}`
        break
      case 408:
        messages = "请求超时"
        break
      case 500:
        messages = "服务器内部错误"
        break
      case 501:
        messages = "服务未实现"
        break
      case 502:
        messages = "网关错误"
        break
      case 503:
        messages = "服务不可用"
        break
      case 504:
        messages = "网关超时"
        break
      case 505:
        messages = "HTTP版本不受支持"
        break
      default:
    }
    messages =
      error.response.data.desc ||
      error.response.data.message ||
      messages ||
      "系统错误，请稍后再试"
    ElMessage.error({
      message: messages,
      type: "error",
      duration: 5 * 1000,
    })
    return Promise.reject(error)
  }
)

export default axios
