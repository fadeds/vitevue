export const customMessageBox = (message, result, error) => {
  ElMessageBox.confirm(message, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      result&&result()
    })
    .catch(() => {
      error&&error()
    })
}
export function downloadFile(item) {
  let { data, headers } = item
    const type = headers.get("content-type")
    const fileName =
      headers.get("content-disposition").split(";")[1].split("=")[1] || ""
    const blob = new Blob([data], { type })
    const dom = document.createElement("a")
    const url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = decodeURIComponent(fileName)
    dom.style.display = "none"
    document.body.appendChild(dom)
    dom.click()
    dom.parentNode.removeChild(dom)
    window.URL.revokeObjectURL(url)
}

export function positiveInteger(rule, value, callback) {
  let reg = /^\+?[1-9]\d*$/
  if (value&&!reg.test(value)) {
    callback(new Error("请输入正整数！"))
  } else {
    callback()
  }
}

export function floatIntTwo(value) {
  if (!value) return value
  value = value.toString()
  //先把非数字的都替换掉，除了数字和.
  value = value.replace(/[^\d.]/g, "")
  //保证只有出现一个.而没有多个.
  value = value.replace(/\.{2,}/g, ".")
  //必须保证第一个为数字而不是.
  value = value.replace(/^\./g, "")
  //保证.只出现一次，而不能出现两次以上
  value = value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".")
  //只能输入两个小数
  value = value.replace(/^(\-)*(\d+)\.(\d\d).*$/, "$1$2.$3")
  return value
}
export function floatIntFour(value) {
  if (!value) return value
  value = value.toString()
  //先把非数字的都替换掉，除了数字和.
  value = value.replace(/[^\d.]/g, "")
  //保证只有出现一个.而没有多个.
  value = value.replace(/\.{2,}/g, ".")
  //必须保证第一个为数字而不是.
  value = value.replace(/^\./g, "")
  //保证.只出现一次，而不能出现两次以上
  value = value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".")
  //只能输入两个小数
  value = value.replace(/^(\-)*(\d+)\.(\d\d\d\d).*$/, "$1$2.$3")
  return value
}

export function formatThousand(money) {
  money = money|| ''
  let res = money.toString().replace(/\d+/, function (num) {
    // 先提取整数部分
    return num.replace(/(\d)(?=(\d{3})+$)/g, function ($1) {
      return $1 + ","
    })
  })
  return res
}
export function getCookie(cname, doc) {
  var name = cname + "="
  let customDoc = doc || document
  var ca = customDoc.cookie.split(";")
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i].trim()
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length)
  }
  return ""
}

export function setCookie(cname, cvalue, exdays, doc) {
  var d = new Date()
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
  var expires = "expires=" + d.toGMTString()
  document.cookie = cname + "=" + cvalue + "; " + expires
}
export function clearAllCookie() {
  var keys = document.cookie.match(/[^ =;]+(?=\=)/g)
  if (keys) {
    for (var i = keys.length; i--; )
      document.cookie = keys[i] + "=0;expires=" + new Date(0).toUTCString()
  }
}
