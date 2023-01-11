import dayjs from "dayjs"
import { createApp } from "vue"
// import pinia from "@/store"
import {customMessageBox} from '@/utils'
import App from "./App.vue"
import route from "@/route/index.js"
import * as ElementPlusIconsVue from "@element-plus/icons-vue"
import "./style/index.scss"
import 'babel-polyfill'
import 'dayjs/locale/es' // 按需加载
dayjs.locale("zh-cn")

const app = createApp(App)
app.use(route)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.config.globalProperties.$dayjs = dayjs
app.config.globalProperties.$customMessageBox = customMessageBox
// app.use(pinia)
app.mount("#app")


