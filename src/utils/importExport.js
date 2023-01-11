/*
爱奇艺会员签到脚本
更新时间: 2022.2.7
脚本兼容: QuantumultX, Surge4, Loon, JsBox, Node.js
电报频道: @NobyDa
问题反馈: @NobyDa_bot
获取Cookie说明：
Safari浏览器打开 https://m.iqiyi.com/user.html 使用密码登录, 如通知成功获取cookie则可使用该脚本.
获取Cookie后, 请将Cookie脚本禁用并移除主机名，以免产生不必要的MITM.
脚本将在每天上午9:00执行, 您可以修改执行时间。
如果使用Node.js, 需自行安装'request'模块. 例: npm install request -g
Node.js环境变量相关：
Cookie：IQIYI_COOKIE
Debug调试：IQIYI_DEBUG
Bark通知推送Key：BARK_PUSH
Bark服务端(默认官方)：BARK_SERVER
JsBox, Node.js用户获取Cookie说明：
方法一手机：开启抓包, 网页登录 https://m.iqiyi.com/user.html 返回抓包APP搜索URL关键字 apis/user/info.action 复制请求头中的Cookie字段填入以下脚本变量或环境变量中即可
方法二PC：网页登录 https://www.iqiyi.com 按F12控制台执行 console.log(document.cookie) 复制打印的Cookie填入以下脚本变量或环境变量中即可
*/

var cookies = process.env.iQIYI_COOKIE
// cookie处理
if (process.env.iQIYI_COOKIE) {
  if (process.env.iQIYI_COOKIE.indexOf("&") > -1) {
    console.log(`您的cookie选择的是用&隔开\n`)
    cookies = process.env.iQIYI_COOKIE.split("&")
  } else if (process.env.iQIYI_COOKIE.indexOf("\n") > -1) {
    console.log(`您的cookie选择的是用换行隔开\n`)
    cookies = process.env.iQIYI_COOKIE.split("\n")
  } else {
    cookies = [process.env.iQIYI_COOKIE]
  }
}
var barkKey = "" //Bark APP 通知推送Key

var barkServer = "" //Bark APP 通知服务端地址(默认官方)

/*********************
 QuantumultX 远程脚本配置:
 **********************
 [task_local]
 # 爱奇艺会员签到
 0 9 * * * https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js
 [rewrite_local]
 # 获取Cookie
 ^https:\/\/passport\.iqiyi\.com\/apis\/user\/info\.action url script-request-header https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js
 [mitm]
 hostname= passport.iqiyi.com
 **********************
 Surge 4.2.0+ 脚本配置:
 **********************
 [Script]
 爱奇艺签到 = type=cron,cronexp=0 9 * * *,timeout=120,script-path=https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js
 爱奇艺获取Cookie = type=http-request,pattern=^https:\/\/passport\.iqiyi\.com\/apis\/user\/info\.action,script-path=https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js
 [MITM]
 hostname= passport.iqiyi.com
 ************************
 Loon 2.1.0+ 脚本配置:
 ************************
 [Script]
 # 爱奇艺签到
 cron "0 9 * * *" script-path=https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js
 # 获取Cookie
 http-request ^https:\/\/passport\.iqiyi\.com\/apis\/user\/info\.action script-path=https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js
 [Mitm]
 hostname= passport.iqiyi.com
 */

var LogDetails = false // 响应日志

var pushMsg = []

let notifyMsg = ''

var $nobyda = nobyda()
const $ = new Env("爱奇艺签到")
const notify = $.isNode() ? require("./sendNotify") : ""

let requestArr = [];

cookies.forEach((cookie) => {
  requestArr
    .push(async () => {
      cookie = cookie || $nobyda.read("CookieQY")
      LogDetails =
        $nobyda.read("iQIYI_LogDetails") === "true" ? true : LogDetails
      if (
        typeof process !== "undefined" &&
        typeof process.env !== "undefined"
      ) {
        cookie = cookie || process.env.IQIYI_COOKIE
        LogDetails = LogDetails || process.env.IQIYI_DEBUG
        barkKey = barkKey || process.env.BARK_PUSH
        barkServer = barkServer || process.env.BARK_SERVER
      }
      if ($nobyda.isRequest) {
        GetCookie()
      } else if (cookie) {
        if (
          cookie.includes("P00001") &&
          cookie.includes("P00003") &&
          cookie.includes("__dfp")
        ) {
          let P00001 = cookie.match(/P00001=(.*?);/)[1]
          let P00003 = cookie.match(/P00003=(.*?);/)[1]
          let dfp = cookie.match(/__dfp=(.*?)@/)[1]
          await Checkin(P00001, P00003, dfp)
          await WebCheckin(P00001, P00003, dfp)
          for (let i = 0; i < 3; i++) {
            const run = await Lottery(i, P00001, P00003, dfp)
            if (run) {
              await new Promise((r) => setTimeout(r, 1000))
            } else {
              break
            }
          }
          await login(P00001, P00003, dfp)
          const tasks = await getTaskList(P00001, P00003, dfp)
          for (let i = 0; i < tasks.length; i++) {``
            if (![1, 4].includes(tasks[i].status)) {
              //0：待领取 1：已完成 2：未开始 4：进行中
              await joinTask(tasks[i], P00001, P00003, dfp)
              await notifyTask(tasks[i], P00001, P00003, dfp)
              await new Promise((r) => setTimeout(r, 1000))
              await getTaskRewards(tasks[i], P00001, P00003, dfp)
              console.log(`--------------------`)
            }
          }
          const expires = $nobyda.expire
            ? $nobyda.expire.replace(/\u5230\u671f/, "")
            : "获取失败 ⚠️"
          if (!$nobyda.isNode)
            $nobyda.notify("爱奇艺", "到期时间: " + expires, pushMsg.join("\n"))
          if (barkKey)
            await BarkNotify(
              $nobyda,
              barkKey,
              "爱奇艺",
              `到期时间: ${expires}\n${pushMsg.join("\n")}`,
              barkServer
            )
          await $nobyda.time()
        } else {
          console.log(`Cookie缺少关键值，需重新获取`)
        }
      } else {
        $nobyda.notify("爱奇艺会员", "", "签到终止, 未获取Cookie")
      }
    })
})

Promise.all(requestArr)
  .then((res) => {
    notify.sendNotify("爱奇艺-查询成功", notifyMsg)
    console.log(res)
  })
  .finally(() => {
    $nobyda.done()
  })

function login(P00001, P00003) {
  return new Promise((resolve) => {
    var URL = {
      url: "https://serv.vip.iqiyi.com/vipgrowth/query.action?P00001=" + P00001,
    }
    $nobyda.get(URL, function (error, response, data) {
      const obj = JSON.parse(data)
      const Details = LogDetails ? (data ? `response:\n${data}` : "") : ""
      if (!error && obj.code === "A00000") {
        console.log(obj.data)
        const level = obj.data.level // VIP等级
        const growthvalue = obj.data.growthvalue // 当前 VIP 成长值
        const distance = obj.data.distance // 升级需要成长值
        let deadline = obj.data.deadline // VIP 到期时间
        const today_growth_value = obj.data.todayGrowthValue
        if (deadline === undefined) {
          deadline = "非 VIP 用户"
        }
        let message =
          "\n用户: " +
          P00003 +
          "\nVIP 等级: " +
          level +
          "\n当前成长值: " +
          growthvalue +
          "\n升级需成长值: " +
          distance +
          "\n今日成长值: " +
          today_growth_value +
          "\nVIP 到期时间: " +
          deadline;

          notifyMsg += message;
        $nobyda.expire = message;
        // notify.sendNotify("爱奇艺-查询成功", message)
        //P00003 = data.match(/img7.iqiyipic.com\/passport\/.+?passport_(.*?)_/)[1]   //通过头像链接获取userid P00003
        console.log(`爱奇艺-查询成功: ${$nobyda.expire} ${Details}`)
      } else {
        notify.sendNotify(
          "爱奇艺-查询失败",
          `${error || ": 无到期数据 ⚠️"} ${Details}`
        )

        console.log(`爱奇艺-查询失败${error || ": 无到期数据 ⚠️"} ${Details}`)
      }
      resolve()
    })
  })
}

function Checkin(P00001, P00003, dfp) {
  const timestamp = new Date().getTime()
  const stringRandom = (length) => {
    var rdm62,
      ret = ""
    while (length--) {
      rdm62 = 0 | (Math.random() * 62)
      ret += String.fromCharCode(
        rdm62 + (rdm62 < 10 ? 48 : rdm62 < 36 ? 55 : 61)
      )
    }
    return ret
  }
  return new Promise((resolve) => {
    const sign_date = {
      agentType: "1",
      agentversion: "1.0",
      appKey: "basic_pcw",
      authCookie: P00001,
      qyid: md5(stringRandom(16).toString()),
      task_code: "natural_month_sign",
      timestamp: timestamp,
      typeCode: "point",
      userId: P00003,
    }
    const post_date = {
      natural_month_sign: {
        agentType: "1",
        agentversion: "1",
        authCookie: P00001,
        qyid: md5(stringRandom(16).toString()),
        taskCode: "iQIYI_mofhr",
        verticalCode: "iQIYI",
      },
    }
    const sign = k("UKobMjDMsDoScuWOfp6F", sign_date, {
      split: "|",
      sort: !0,
      splitSecretKey: !0,
    })
    var URL = {
      url:
        "https://community.iqiyi.com/openApi/task/execute?" +
        w(sign_date) +
        "&sign=" +
        sign,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post_date),
    }
    $nobyda.post(URL, function (error, response, data) {
      let CheckinMsg,
        rewards = []
      const Details = LogDetails ? `msg:\n${data || error}` : ""
      try {
        if (error) throw new Error(`接口请求出错 ‼️`)
        const obj = JSON.parse(data)
        if (obj.code === "A00000") {
          if (obj.data.code === "A0000") {
            for (let i = 0; i < obj.data.data.rewards.length; i++) {
              if (obj.data.data.rewards[i].rewardType === 1) {
                rewards.push(`成长值+${obj.data.data.rewards[i].rewardCount}`)
              } else if (obj.data.data.rewards[i].rewardType === 2) {
                rewards.push(`VIP天+${obj.data.data.rewards[i].rewardCount}`)
              } else if (obj.data.data.rewards[i].rewardType === 3) {
                rewards.push(`积分+${obj.data.data.rewards[i].rewardCount}`)
              }
            }
            var continued = obj.data.data.signDays
            CheckinMsg = `应用签到: ${rewards.join(", ")}${
              rewards.length < 3 ? `, 累计签到${continued}天` : ``
            } 🎉`
          } else {
            CheckinMsg = `应用签到: ${obj.data.msg} ⚠️`
          }
        } else {
          CheckinMsg = `应用签到: Cookie无效 ⚠️`
        }
      } catch (e) {
        CheckinMsg = `应用签到: ${e.message || e}`
      }
      pushMsg.push(CheckinMsg)
      console.log(`爱奇艺-${CheckinMsg} ${Details}`)
      resolve()
    })
  })
}

function WebCheckin(P00001, P00003, dfp) {
  return new Promise((resolve) => {
    const web_sign_date = {
      agenttype: "1",
      agentversion: "0",
      appKey: "basic_pca",
      appver: "0",
      authCookie: P00001,
      channelCode: "sign_pcw",
      dfp: dfp,
      scoreType: "1",
      srcplatform: "1",
      typeCode: "point",
      userId: P00003,
      // user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
      verticalCode: "iQIYI",
    }

    const sign = k("DO58SzN6ip9nbJ4QkM8H", web_sign_date, {
      split: "|",
      sort: !0,
      splitSecretKey: !0,
    })
    var URL = {
      url:
        "https://community.iqiyi.com/openApi/score/add?" +
        w(web_sign_date) +
        "&sign=" +
        sign,
    }
    $nobyda.get(URL, function (error, response, data) {
      let WebCheckinMsg = ""
      const Details = LogDetails ? `msg:\n${data || error}` : ""
      try {
        if (error) throw new Error(`接口请求出错 ‼️`)
        const obj = JSON.parse(data)
        if (obj.code === "A00000") {
          if (obj.data[0].code === "A0000") {
            var quantity = obj.data[0].score
            var continued = obj.data[0].continuousValue
            WebCheckinMsg = `网页签到: 积分+${quantity}, 累计签到${continued}天 🎉`
          } else {
            WebCheckinMsg = `网页签到: ${obj.data[0].message} ⚠️`
          }
        } else {
          WebCheckinMsg = `网页签到: ${obj.message || "未知错误"} ⚠️`
        }
      } catch (e) {
        WebCheckinMsg = `网页签到: ${e.message || e}`
      }
      pushMsg.push(WebCheckinMsg)
      console.log(`爱奇艺-${WebCheckinMsg} ${Details}`)
      resolve()
    })
  })
}

function Lottery(s, P00001, P00003, dfp) {
  return new Promise((resolve) => {
    const URL = {
      url:
        "https://iface2.iqiyi.com/aggregate/3.0/lottery_activity?app_k=0&app_v=0&platform_id=0&dev_os=0&dev_ua=0&net_sts=0&qyid=0&psp_uid=0&psp_cki=" +
        P00001 +
        "&psp_status=0&secure_p=0&secure_v=0&req_sn=0",
    }
    $nobyda.get(URL, async function (error, response, data) {
      const Details = LogDetails ? `msg:\n${data || error}` : ""
      let LotteryMsg
      try {
        if (error) throw new Error("接口请求出错 ‼️")
        const obj = JSON.parse(data)
        $nobyda.last = !!data.match(/(机会|已经)用完/)
        if (obj.awardName && obj.code === 0) {
          LotteryMsg = `应用抽奖: ${
            !$nobyda.last
              ? `${obj.awardName.replace(/《.+》/, "未中奖")} 🎉`
              : `您的抽奖次数已经用完 ⚠️`
          }`
        } else if (data.match(/\"errorReason\"/)) {
          const msg = data.match(/msg=.+?\)/)
            ? data
                .match(/msg=(.+?)\)/)[1]
                .replace(/用户(未登录|不存在)/, "Cookie无效")
            : ""
          LotteryMsg = `应用抽奖: ${msg || `未知错误`} ⚠️`
        } else {
          LotteryMsg = `应用抽奖: ${data}`
        }
      } catch (e) {
        LotteryMsg = `应用抽奖: ${e.message || e}`
      }
      console.log(`爱奇艺-${LotteryMsg} (${s + 1}) ${Details}`)
      pushMsg.push(LotteryMsg)
      if (!$nobyda.last) {
        resolve(1)
      } else {
        resolve()
      }
    })
  })
}

function getTaskList(P00001, P00003, dfp) {
  return new Promise((resolve) => {
    $nobyda.get(
      `https://tc.vip.iqiyi.com/taskCenter/task/queryUserTask?P00001=${P00001}`,
      function (error, response, data) {
        let taskListMsg,
          taskList = []
        const Details = LogDetails ? `msg:\n${data || error}` : ""
        try {
          if (error) throw new Error(`请求失败`)
          const obj = JSON.parse(data)
          if (obj.code === "A00000" && obj.data && obj.data.tasks) {
            Object.keys(obj.data.tasks).map((group) => {
              ;(obj.data.tasks[group] || []).map((item) => {
                taskList.push({
                  name: item.taskTitle,
                  taskCode: item.taskCode,
                  status: item.status,
                })
              })
            })
            taskListMsg = `获取成功!`
          } else {
            taskListMsg = `获取失败!`
          }
        } catch (e) {
          taskListMsg = `${e.message || e} ‼️`
        }
        console.log(`爱奇艺-任务列表: ${taskListMsg} ${Details}`)
        resolve(taskList)
      }
    )
  })
}

function joinTask(task, P00001, P00003, dfp) {
  return new Promise((resolve) => {
    $nobyda.get(
      "https://tc.vip.iqiyi.com/taskCenter/task/joinTask?taskCode=" +
        task.taskCode +
        "&lang=zh_CN&platform=0000000000000000&P00001=" +
        P00001,
      function (error, response, data) {
        let joinTaskMsg,
          Details = LogDetails ? `msg:\n${data || error}` : ""
        try {
          if (error) throw new Error(`请求失败`)
          const obj = JSON.parse(data)
          joinTaskMsg = obj.code || "领取失败"
        } catch (e) {
          joinTaskMsg = `错误 ${e.message || e}`
        }
        console.log(
          `爱奇艺-领取任务: ${task.name} => ${joinTaskMsg} ${Details}`
        )
        resolve()
      }
    )
  })
}

function notifyTask(task, P00001, P00003, dfp) {
  return new Promise((resolve) => {
    $nobyda.get(
      "https://tc.vip.iqiyi.com/taskCenter/task/notify?taskCode=" +
        task.taskCode +
        "&lang=zh_CN&platform=0000000000000000&P00001=" +
        P00001,
      function (error, response, data) {
        let notifyTaskMsg,
          Details = LogDetails ? `msg:\n${data || error}` : ""
        try {
          if (error) throw new Error(`请求失败`)
          const obj = JSON.parse(data)
          notifyTaskMsg = obj.code || "失败"
        } catch (e) {
          notifyTaskMsg = e.message || e
        }
        console.log(
          `爱奇艺-开始任务: ${task.name} => ${notifyTaskMsg} ${Details}`
        )
        resolve()
      }
    )
  })
}

function getTaskRewards(task, P00001, P00003, dfp) {
  return new Promise((resolve) => {
    $nobyda.get(
      "https://tc.vip.iqiyi.com/taskCenter/task/getTaskRewards?taskCode=" +
        task.taskCode +
        "&lang=zh_CN&platform=0000000000000000&P00001=" +
        P00001,
      function (error, response, data) {
        let RewardsMsg
        const Details = LogDetails ? `msg:\n${data || error}` : ""
        try {
          if (error) throw new Error(`接口请求出错 ‼️`)
          const obj = JSON.parse(data)
          if (
            obj.msg === "成功" &&
            obj.code === "A00000" &&
            obj.dataNew[0] !== undefined
          ) {
            RewardsMsg = `任务奖励: ${task.name} => ${
              obj.dataNew[0].name + obj.dataNew[0].value
            } 🎉`
          } else {
            RewardsMsg = `任务奖励: ${task.name} => ${
              (obj.msg !== `成功` && obj.msg) || `未完成`
            } ⚠️`
          }
        } catch (e) {
          RewardsMsg = `任务奖励: ${e.message || e}`
        }
        pushMsg.push(RewardsMsg)
        console.log(`爱奇艺-${RewardsMsg} ${Details}`)
        resolve()
      }
    )
  })
}

function GetCookie() {
  if (!$request.url.includes("/apis/user/info.action")) {
    $nobyda.notify(`写入爱奇艺Cookie失败`, "", "请更新脚本配置(URL正则/MITM)")
    return
  }
  var CKA = $request.headers["Cookie"]
  var iQIYI = CKA && CKA.includes("P00001=") && CKA.includes("P00003=") && CKA
  var RA = $nobyda.read("CookieQY")
  if (CKA && iQIYI) {
    if (RA !== iQIYI) {
      var OldTime = $nobyda.read("CookieQYTime")
      if (!$nobyda.write(iQIYI, "CookieQY")) {
        $nobyda.notify(
          `${RA ? `更新` : `首次写入`}爱奇艺签到Cookie失败‼️`,
          "",
          ""
        )
      } else {
        if (!OldTime || (OldTime && (Date.now() - OldTime) / 1000 >= 21600)) {
          $nobyda.write(JSON.stringify(Date.now()), "CookieQYTime")
          $nobyda.notify(
            `${RA ? `更新` : `首次写入`}爱奇艺签到Cookie成功 🎉`,
            "",
            ""
          )
        } else {
          console.log(
            `\n更新爱奇艺Cookie成功! 🎉\n检测到频繁通知, 已转为输出日志`
          )
        }
      }
    } else {
      console.log("\n爱奇艺-与本机储存Cookie相同, 跳过写入 ⚠️")
    }
  } else {
    $nobyda.notify(`爱奇艺`, "", "写入Cookie失败，关键值缺失 ⚠️")
  }
}

async function BarkNotify(c, k, t, b, p) {
  for (let i = 0; i < 3; i++) {
    console.log(`🔷Bark notify >> Start push (${i + 1})`)
    const s = await new Promise((n) => {
      c.post(
        {
          url: p || "https://api.day.app/push",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: t,
            body: b,
            device_key: k,
            ext_params: { group: t },
          }),
        },
        (e, r, d) => (r && r.status === 200 ? n(1) : n(d || e))
      )
    })
    if (s === 1) {
      console.log("✅Push success!")
      break
    } else {
      console.log(`❌Push failed! >> ${s.message || s}`)
    }
  }
}

function nobyda() {
  const times = 0
  const start = Date.now()
  const isRequest = typeof $request != "undefined"
  const isSurge = typeof $httpClient != "undefined"
  const isQuanX = typeof $task != "undefined"
  const isLoon = typeof $loon != "undefined"
  const isJSBox = typeof $app != "undefined" && typeof $http != "undefined"
  const isNode = typeof require == "function" && !isJSBox
  const node = (() => {
    if (isNode) {
      const request = require("request")
      return {
        request,
      }
    } else {
      return null
    }
  })()
  const notify = (title, subtitle, message) => {
    if (isQuanX) $notify(title, subtitle, message)
    if (isSurge) $notification.post(title, subtitle, message)
    if (isNode) log("\n" + title + "\n" + subtitle + "\n" + message)
    if (isJSBox)
      $push.schedule({
        title: title,
        body: subtitle ? subtitle + "\n" + message : message,
      })
  }
  const write = (value, key) => {
    if (isQuanX) return $prefs.setValueForKey(value, key)
    if (isSurge) return $persistentStore.write(value, key)
  }
  const read = (key) => {
    if (isQuanX) return $prefs.valueForKey(key)
    if (isSurge) return $persistentStore.read(key)
  }
  const adapterStatus = (response) => {
    if (response) {
      if (response.status) {
        response["statusCode"] = response.status
      } else if (response.statusCode) {
        response["status"] = response.statusCode
      }
    }
    return response
  }
  const get = (options, callback) => {
    if (isQuanX) {
      if (typeof options == "string")
        options = {
          url: options,
        }
      options["method"] = "GET"
      $task.fetch(options).then(
        (response) => {
          callback(null, adapterStatus(response), response.body)
        },
        (reason) => callback(reason.error, null, null)
      )
    }
    if (isSurge)
      $httpClient.get(options, (error, response, body) => {
        callback(error, adapterStatus(response), body)
      })
    if (isNode) {
      node.request(options, (error, response, body) => {
        callback(error, adapterStatus(response), body)
      })
    }
    if (isJSBox) {
      if (typeof options == "string")
        options = {
          url: options,
        }
      options["header"] = options["headers"]
      options["handler"] = function (resp) {
        let error = resp.error
        if (error) error = JSON.stringify(resp.error)
        let body = resp.data
        if (typeof body == "object") body = JSON.stringify(resp.data)
        callback(error, adapterStatus(resp.response), body)
      }
      $http.get(options)
    }
  }
  const post = (options, callback) => {
    if (isQuanX) {
      if (typeof options == "string")
        options = {
          url: options,
        }
      options["method"] = "POST"
      $task.fetch(options).then(
        (response) => {
          callback(null, adapterStatus(response), response.body)
        },
        (reason) => callback(reason.error, null, null)
      )
    }
    if (isSurge) {
      options.headers["X-Surge-Skip-Scripting"] = false
      $httpClient.post(options, (error, response, body) => {
        callback(error, adapterStatus(response), body)
      })
    }
    if (isNode) {
      node.request.post(options, (error, response, body) => {
        callback(error, adapterStatus(response), body)
      })
    }
    if (isJSBox) {
      if (typeof options == "string")
        options = {
          url: options,
        }
      options["header"] = options["headers"]
      options["handler"] = function (resp) {
        let error = resp.error
        if (error) error = JSON.stringify(resp.error)
        let body = resp.data
        if (typeof body == "object") body = JSON.stringify(resp.data)
        callback(error, adapterStatus(resp.response), body)
      }
      $http.post(options)
    }
  }

  const log = (message) => console.log(message)
  const time = () => {
    const end = ((Date.now() - start) / 1000).toFixed(2)
    return console.log("\n签到用时: " + end + " 秒")
  }
  const done = (value = {}) => {
    if (isQuanX) return $done(value)
    if (isSurge) isRequest ? $done(value) : $done()
  }
  return {
    isRequest,
    isNode,
    notify,
    write,
    read,
    get,
    post,
    log,
    time,
    times,
    done,
  }
}

function k(e, t) {
  var a = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
    n = a.split,
    c = void 0 === n ? "|" : n,
    r = a.sort,
    s = void 0 === r || r,
    o = a.splitSecretKey,
    i = void 0 !== o && o,
    l = s ? Object.keys(t).sort() : Object.keys(t),
    u =
      l
        .map(function (e) {
          return "".concat(e, "=").concat(t[e])
        })
        .join(c) +
      (i ? c : "") +
      e
  return md5(u)
}

// Modified from https://github.com/blueimp/JavaScript-MD5
function md5(string) {
  function RotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits))
  }
  function AddUnsigned(lX, lY) {
    var lX4, lY4, lX8, lY8, lResult
    lX8 = lX & 0x80000000
    lY8 = lY & 0x80000000
    lX4 = lX & 0x40000000
    lY4 = lY & 0x40000000
    lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff)
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8
      }
    } else {
      return lResult ^ lX8 ^ lY8
    }
  }
  function F(x, y, z) {
    return (x & y) | (~x & z)
  }
  function G(x, y, z) {
    return (x & z) | (y & ~z)
  }
  function H(x, y, z) {
    return x ^ y ^ z
  }
  function I(x, y, z) {
    return y ^ (x | ~z)
  }
  function FF(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac))
    return AddUnsigned(RotateLeft(a, s), b)
  }
  function GG(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac))
    return AddUnsigned(RotateLeft(a, s), b)
  }
  function HH(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac))
    return AddUnsigned(RotateLeft(a, s), b)
  }
  function II(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac))
    return AddUnsigned(RotateLeft(a, s), b)
  }
  function ConvertToWordArray(string) {
    var lWordCount
    var lMessageLength = string.length
    var lNumberOfWords_temp1 = lMessageLength + 8
    var lNumberOfWords_temp2 =
      (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16
    var lWordArray = Array(lNumberOfWords - 1)
    var lBytePosition = 0
    var lByteCount = 0
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4
      lBytePosition = (lByteCount % 4) * 8
      lWordArray[lWordCount] =
        lWordArray[lWordCount] |
        (string.charCodeAt(lByteCount) << lBytePosition)
      lByteCount++
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4
    lBytePosition = (lByteCount % 4) * 8
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition)
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29
    return lWordArray
  }
  function WordToHex(lValue) {
    var WordToHexValue = "",
      WordToHexValue_temp = "",
      lByte,
      lCount
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255
      WordToHexValue_temp = "0" + lByte.toString(16)
      WordToHexValue =
        WordToHexValue +
        WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2)
    }
    return WordToHexValue
  }
  function Utf8Encode(string) {
    string = string.replace(/\r\n/g, "\n")
    var utftext = ""
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n)
      if (c < 128) {
        utftext += String.fromCharCode(c)
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192)
        utftext += String.fromCharCode((c & 63) | 128)
      } else {
        utftext += String.fromCharCode((c >> 12) | 224)
        utftext += String.fromCharCode(((c >> 6) & 63) | 128)
        utftext += String.fromCharCode((c & 63) | 128)
      }
    }
    return utftext
  }
  var x = Array()
  var k, AA, BB, CC, DD, a, b, c, d
  var S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22
  var S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20
  var S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23
  var S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21
  string = Utf8Encode(string)
  x = ConvertToWordArray(string)
  a = 0x67452301
  b = 0xefcdab89
  c = 0x98badcfe
  d = 0x10325476
  for (k = 0; k < x.length; k += 16) {
    AA = a
    BB = b
    CC = c
    DD = d
    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478)
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756)
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db)
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee)
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf)
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a)
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613)
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501)
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8)
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af)
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1)
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be)
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122)
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193)
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e)
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821)
    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562)
    d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340)
    c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51)
    b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa)
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d)
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453)
    c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681)
    b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8)
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6)
    d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6)
    c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87)
    b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed)
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905)
    d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8)
    c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9)
    b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a)
    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942)
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681)
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122)
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c)
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44)
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9)
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60)
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70)
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6)
    d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa)
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085)
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05)
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039)
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5)
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8)
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665)
    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244)
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97)
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7)
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039)
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3)
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92)
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d)
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1)
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f)
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0)
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314)
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1)
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82)
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235)
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb)
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391)
    a = AddUnsigned(a, AA)
    b = AddUnsigned(b, BB)
    c = AddUnsigned(c, CC)
    d = AddUnsigned(d, DD)
  }
  var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d)
  return temp.toLowerCase()
}

function w() {
  var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
    t = []
  return (
    Object.keys(e).forEach(function (a) {
      t.push("".concat(a, "=").concat(e[a]))
    }),
    t.join("&")
  )
}

// prettier-ignore
function Env(t,s){return new class{constructor(t,s){this.name=t,this.data=null,this.dataFile="box.dat",this.logs=[],this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,s),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}getScript(t){return new Promise(s=>{$.get({url:t},(t,e,i)=>s(i))})}runScript(t,s){return new Promise(e=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let o=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");o=o?1*o:20,o=s&&s.timeout?s.timeout:o;const[h,a]=i.split("@"),r={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:o},headers:{"X-Key":h,Accept:"*/*"}};$.post(r,(t,s,i)=>e(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),s=this.path.resolve(process.cwd(),this.dataFile),e=this.fs.existsSync(t),i=!e&&this.fs.existsSync(s);if(!e&&!i)return{};{const i=e?t:s;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),s=this.path.resolve(process.cwd(),this.dataFile),e=this.fs.existsSync(t),i=!e&&this.fs.existsSync(s),o=JSON.stringify(this.data);e?this.fs.writeFileSync(t,o):i?this.fs.writeFileSync(s,o):this.fs.writeFileSync(t,o)}}lodash_get(t,s,e){const i=s.replace(/\[(\d+)\]/g,".$1").split(".");let o=t;for(const t of i)if(o=Object(o)[t],void 0===o)return e;return o}lodash_set(t,s,e){return Object(t)!==t?t:(Array.isArray(s)||(s=s.toString().match(/[^.[\]]+/g)||[]),s.slice(0,-1).reduce((t,e,i)=>Object(t[e])===t[e]?t[e]:t[e]=Math.abs(s[i+1])>>0==+s[i+1]?[]:{},t)[s[s.length-1]]=e,t)}getdata(t){let s=this.getval(t);if(/^@/.test(t)){const[,e,i]=/^@(.*?)\.(.*?)$/.exec(t),o=e?this.getval(e):"";if(o)try{const t=JSON.parse(o);s=t?this.lodash_get(t,i,""):s}catch(t){s=""}}return s}setdata(t,s){let e=!1;if(/^@/.test(s)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(s),h=this.getval(i),a=i?"null"===h?null:h||"{}":"{}";try{const s=JSON.parse(a);this.lodash_set(s,o,t),e=this.setval(JSON.stringify(s),i)}catch(s){const h={};this.lodash_set(h,o,t),e=this.setval(JSON.stringify(h),i)}}else e=$.setval(t,s);return e}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,s){return this.isSurge()||this.isLoon()?$persistentStore.write(t,s):this.isQuanX()?$prefs.setValueForKey(t,s):this.isNode()?(this.data=this.loaddata(),this.data[s]=t,this.writedata(),!0):this.data&&this.data[s]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,s=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?$httpClient.get(t,(t,e,i)=>{!t&&e&&(e.body=i,e.statusCode=e.status),s(t,e,i)}):this.isQuanX()?$task.fetch(t).then(t=>{const{statusCode:e,statusCode:i,headers:o,body:h}=t;s(null,{status:e,statusCode:i,headers:o,body:h},h)},t=>s(t)):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,s)=>{try{const e=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(e,null),s.cookieJar=this.ckjar}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:e,statusCode:i,headers:o,body:h}=t;s(null,{status:e,statusCode:i,headers:o,body:h},h)},t=>s(t)))}post(t,s=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),delete t.headers["Content-Length"],this.isSurge()||this.isLoon())$httpClient.post(t,(t,e,i)=>{!t&&e&&(e.body=i,e.statusCode=e.status),s(t,e,i)});else if(this.isQuanX())t.method="POST",$task.fetch(t).then(t=>{const{statusCode:e,statusCode:i,headers:o,body:h}=t;s(null,{status:e,statusCode:i,headers:o,body:h},h)},t=>s(t));else if(this.isNode()){this.initGotEnv(t);const{url:e,...i}=t;this.got.post(e,i).then(t=>{const{statusCode:e,statusCode:i,headers:o,body:h}=t;s(null,{status:e,statusCode:i,headers:o,body:h},h)},t=>s(t))}}time(t){let s={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in s)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?s[e]:("00"+s[e]).substr((""+s[e]).length)));return t}msg(s=t,e="",i="",o){const h=t=>!t||!this.isLoon()&&this.isSurge()?t:"string"==typeof t?this.isLoon()?t:this.isQuanX()?{"open-url":t}:void 0:"object"==typeof t&&(t["open-url"]||t["media-url"])?this.isLoon()?t["open-url"]:this.isQuanX()?t:void 0:void 0;$.isMute||(this.isSurge()||this.isLoon()?$notification.post(s,e,i,h(o)):this.isQuanX()&&$notify(s,e,i,h(o))),this.logs.push("","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="),this.logs.push(s),e&&this.logs.push(e),i&&this.logs.push(i)}log(...t){t.length>0?this.logs=[...this.logs,...t]:console.log(this.logs.join(this.logSeparator))}logErr(t,s){const e=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();e?$.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):$.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(s=>setTimeout(s,t))}done(t={}){const s=(new Date).getTime(),e=(s-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${e} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,s)}
