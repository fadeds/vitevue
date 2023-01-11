import axios from './axios';

let http = {
    get: function (url, params = {}) {
        let paramsCustom = {}
        for (let key in params) {
          if (Object.hasOwnProperty.call(params, key)) {
            let element = params[key]
            // // 处理数组问题
            if (Array.isArray(element)) {
              paramsCustom[key] = element.join(",")
            }
          }
        }
        return new Promise((resolve, reject) => {
            axios
              .get(url, {
                params: { ...params, ...paramsCustom },
              })
              .then((response) => {
                resolve(response)
              })
              .catch((error) => {
                reject(error)
              })
        })
    },
    post: function (url, params = {}, config = {}) {
        return new Promise((resolve, reject) => {
            axios.post(url, params, config)
                .then((response) => {
                    resolve(response)
                })
                .catch((error) => {
                    reject(error);
                })
        })
    },
    put: function (url, params = {}, config = {}) {
        return new Promise((resolve, reject) => {
            axios.put(url, params, config)
                .then((response) => {
                    resolve(response)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    },
    delete: function (url, params = {}) {
        return new Promise((resolve, reject) => {
            axios.delete(url, {
                params: params
            })
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                })
        })
    }
}
window.__axios = http;
export default http;