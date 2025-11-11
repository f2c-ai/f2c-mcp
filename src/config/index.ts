export const port = Number.parseInt(process.env.PORT || '3000', 10)

export const wsProto = 'ws'
export const ip = `localhost`
export const httpProto = 'http'
export const codeWsUrl = process.env.WS_URL || `${wsProto}://${ip}:${port}/code`
export const httpUrl = process.env.HTTP_URL || `${httpProto}://${ip}:${port}`
export default {
  httpUrl,
  codeWsUrl,
  port,
  ip,
  getCodeWS: (uid: string) => `${codeWsUrl}/${uid}`,
}

export const ws_web_timeout_ms = process.env.WS_WEB_TIMEOUT_MS ? Number.parseInt(process.env.WS_WEB_TIMEOUT_MS, 10) : 0
