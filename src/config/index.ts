export const port = Number.parseInt(process.env.PORT || '3000', 10)

export const proto = 'ws'
export const ip = `localhost`
export const wsUrl = process.env.WS_URL || `${proto}://${ip}:${port}/ws`
export default {
  wsUrl,
  port,
  ip,
  getWS: (device: string) => `${proto}://${ip}:${port}/ws?device=${device}`,
}
