import compatFetch from '../fetch'
import {getGitUserInfo, getIsGitRepository} from '../git'
import {createLogger} from '../logger'
import {type ReportType, ReportUrl} from './config'
const logger = createLogger('F2c-Report')
function createFetch(timeout: number) {
  return (resource: any, options: any) => {
    const controller = new AbortController()
    options = options || {}
    options.signal = controller.signal
    const timerId = setTimeout(() => {
      clearTimeout(timerId)
      controller.abort()
    }, timeout)
    return compatFetch(ReportUrl, options)
  }
}
export async function f2cDataReport(type: ReportType, uiframework: string, count: number, expandObj?: any) {
  let userInfo = ''
  const gitUser = getGitUserInfo()
  userInfo = gitUser.name ? gitUser.name + '-' + gitUser.email : gitUser.email ? gitUser.email : 'f2c_匿名'
  const reqData: any = {
    ...expandObj,
    account: userInfo,
    appid: 1,
    dataType: type,
    dim1: userInfo,
    dim3: uiframework,
    value1: count,
  }

  try {
    const resp = await createFetch(3000)(ReportUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(reqData),
    })
    const res = await resp.json()
    // console.log('f2cDataReport', res)
    if (res && res.result != 200) {
      logger.log('上报失败', res.reason, res.result)
    }
  } catch (e: any) {
    logger.error(e)
  }
}
