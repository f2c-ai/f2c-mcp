export class AppConfig {
  public port: number
  public ip: string
  public httpProto: string

  constructor(init: {protocol?: string; host?: string; port?: string | number}) {
    const httpProto = (init?.protocol || 'http').toLowerCase()
    const host = init?.host || 'localhost'
    const portStr = typeof init?.port === 'number' ? String(init.port) : init?.port || '3000'
    const port = Number.parseInt(portStr, 10)
    this.httpProto = httpProto
    this.port = port
    this.ip = host
  }

  private get wsProto(): 'ws' | 'wss' {
    return this.httpProto === 'https' ? 'wss' : 'ws'
  }

  private portSuffix(proto: 'http' | 'https' | 'ws' | 'wss'): string {
    const p = this.port
    if ((proto === 'http' || proto === 'ws') && p === 80) return ''
    if ((proto === 'https' || proto === 'wss') && p === 443) return ''
    return `:${p}`
  }

  get httpUrl(): string {
    const proto = this.httpProto as 'http' | 'https'
    return `${proto}://${this.ip}${this.portSuffix(proto)}`
  }

  get codeWsUrl(): string {
    const proto = this.wsProto
    return `${proto}://${this.ip}${this.portSuffix(proto)}/code`
  }

  get mcpWsUrl(): string {
    const proto = this.wsProto
    return `${proto}://${this.ip}${this.portSuffix(proto)}/mcp`
  }

  getCodeWS(uid: string): string {
    return `${this.codeWsUrl}/${uid}`
  }
}

export default new AppConfig({
  protocol: 'http',
  host: 'localhost',
  port: 3000,
})

export const ws_web_timeout_ms =
  typeof process !== 'undefined' && process.env.WS_WEB_TIMEOUT_MS
    ? Number.parseInt(process.env.WS_WEB_TIMEOUT_MS, 10)
    : 0
