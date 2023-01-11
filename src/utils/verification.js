// 正整数 小数 单独验证
export function floatNumber(rule, value, callback) {
  let reg = /^(([1-9][0-9]*)|(([0]\.\d{1,4}|[1-9][0-9]*\.\d{1,4})))$/
  return reg.test(value)
}

// 正整数 小数
export function floatNumber(rule, value, callback) {
  let reg = /^(([1-9][0-9]*)|(([0]\.\d{1,4}|[1-9][0-9]*\.\d{1,4})))$/
  if (!reg.test(value)) {
    callback(new Error("请输入正确的数字！(正整数或小数并保留两位小数)"))
  } else {
    callback()
  }
}
// 整数 小数 负数
export function floatNumberNegative(rule, value, callback) {
  // /^([\+ \-]?(([1-9]\d*)|(0)))([.]\d{0,2})?$/
  let reg = /^([\+ \-]?(([1-9]\d*)|(0)))([.]\d{0,2})?$/
  if (!reg.test(value)) {
    callback(new Error("请输入正确的数字！(整数或小数并保留两位小数)"))
  } else {
    callback()
  }
}
// 正整数
export function intNumber(rule, value, callback) {
  let reg = /^\+?[1-9][0-9]*$/
  if (!reg.test(value)) {
    callback(new Error("请输入正确的数字！(正整数)"))
  } else {
    callback()
  }
}
// 0-1 两位小数
export function zeroToOneNumber(rule, value, callback) {
  let reg = /^(0\.(0[1-9]|[1-9]{1,2}|[1-9]0)$)|^1$|^0$/
  if (!reg.test(value)) {
    callback(new Error("请输入正确的数字！(0-1，两位小数)"))
  } else {
    callback()
  }
}
