export const port = Number.parseInt(process.env.PORT || '3000', 10)

export const wsProto = 'ws'
export const ip = `localhost`
export const httpProto = 'http'
export const wsUrl = process.env.WS_URL || `${wsProto}://${ip}:${port}/ws`
export const httpUrl = process.env.HTTP_URL || `${httpProto}://${ip}:${port}`
export default {
  httpUrl,
  wsUrl,
  port,
  ip,
  getHTTP: (device: string) => `${httpProto}://${ip}:${port}/mcp?device=${device}`,
  getWS: (device: string) => `${wsProto}://${ip}:${port}/ws?device=${device}`,
}
