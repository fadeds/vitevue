import { createRouter, createWebHashHistory } from "vue-router"
import { getCookie } from "@/utils/index.js"
import App from "@/App.vue"

const modules = import.meta.glob("@/views/**/**.vue")
const components = []
Object.keys(modules).forEach((key) => {
  let component = null
  const nameMatch = key.match(/^\/src\/views\/(.+)\.vue/)
  // 组件内组件模板筛选
  if (key.indexOf("components") !== -1) return
  if (!nameMatch) return
  // 如果页面以Index命名，则使用父文件夹作为name
  const indexMatch = nameMatch[1].match(/(.*)\/Index$/i)
  let name = indexMatch ? indexMatch[1] : nameMatch[1]
  ;[name] = name.split("/").splice(-1)
  component = modules[key]
  components.push({
    path: "/" + name,
    name: name,
    meta: {
      module: name,
    },
    component,
  })
})

let deletePage = ["systemService",'test']
let otherComponents = components.filter((item) => {
  return deletePage.indexOf(item.name) === -1
})
// 一级页面
let exRoute = ["login", "home"]
let exRoutes = otherComponents.filter((item) => {
  return exRoute.indexOf(item.name) !== -1
})
// 二级页面
let homeRoute = otherComponents.filter((item) => {
  return exRoute.indexOf(item.name) === -1
})
otherComponents.forEach((item) => {
  if (item.name === "home") {
    item.children = homeRoute
    item.redirect = "/login"
  }
})
let routes = [
  { path: "/", redirect: "/home", component: App },
  // ...otherComponents.filter((item) => exRoute.indexOf(item.name) !== -1),
  ...exRoutes,
  ...otherComponents.filter((item) => {
    return item.name === "home"
  }),
]
let router = createRouter({
  history: createWebHashHistory(),
  routes,
})
// 路由拦截
router.beforeEach((to, form) => {
  
  if (
    (!getCookie("userName") || !getCookie("dataSourceCode"))&&
    to.name !== "login"
  ) {
    return { name: "login" }
  }
  return true
})

export default router
