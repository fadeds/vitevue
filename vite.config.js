import path from "path"
import { defineConfig } from "vite"
import Vue from "@vitejs/plugin-vue"
// import Icons from "unplugin-icons/vite"
// import IconsResolver from "unplugin-icons/resolver"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import Inspect from "vite-plugin-inspect"
import legacyPlugin from "@vitejs/plugin-legacy"
import viteImagemin from "vite-plugin-imagemin"
// import OptimizationPersist from "vite-plugin-optimize-persist"
// import PkgConfig from "vite-plugin-package-config"

const pathSrc = path.resolve(__dirname, "src")

export default defineConfig({
  // base:'/html/dist/',
  server: {
    host: "0.0.0.0",
    port: "8080",
    proxy: {
      "/api": {
        target: "http://192.168.5.194:9089",
        //  target: "http://192.168.5.97:9089",
        //  target: "http://192.168.5.56:9089",
        // target: "http://2bfsqc.natappfree.cc",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 将 node_modules 中的代码单独打包成一个 JS 文件
          if (id.includes("node_modules")) {
            return "vendor"
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": pathSrc,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/style/element.scss" as *;`,
      },
    },
  },
  plugins: [
    Vue(),
    // 本地开发优化加载
    // 浏览器兼容
    legacyPlugin({
      targets: ["> 1%", "last 65 versions", "ie 9"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
      renderLegacyChunks: true,
      polyfills: [
        "es.symbol",
        "es.array.filter",
        "es.promise",
        "es.promise.finally",
        "es/map",
        "es/set",
        "es.array.for-each",
        "es.object.define-properties",
        "es.object.define-property",
        "es.object.get-own-property-descriptor",
        "es.object.get-own-property-descriptors",
        "es.object.keys",
        "es.object.to-string",
        "web.dom-collections.for-each",
        "esnext.global-this",
        "esnext.string.match-all",
      ],
      modernPolyfills: ["es.string.replace-all"],
    }),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "@vueuse/core",
        /* 自定义 */
        {
          "lodash/isUndefined": [["default", "isUndefined"]],
          /* 自定义模块 */
          api: [["default", "api"]],
          hooks: [["default", "hooks"]],
          store: [["default", "store"]],
        },
      ],
      resolvers: [
        ElementPlusResolver({
          // importStyle: "sass",
        }),

        // Auto import icon components
        // 自动导入图标组件
        // IconsResolver({
        //   prefix: "Icon",
        // }),
      ],

      dts: path.resolve(pathSrc, "auto-imports.d.ts"),
    }),
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 20,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: "removeViewBox",
          },
          {
            name: "removeEmptyAttrs",
            active: false,
          },
        ],
      },
    }),
    Components({
      resolvers: [
        // 自动导入 Element Plus 组件
        ElementPlusResolver({
          importStyle: "sass",
        }),
      ],
      // 遍历子目录
      dts: path.resolve(pathSrc, "components.d.ts"),
    }),
    Inspect(),
  ],
})
