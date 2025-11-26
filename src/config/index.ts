const PRESET = {protocol: 'http', host: 'localhost', port: 3000}
export const env = (typeof process !== 'undefined' && process.env.APP_ENV) || 'dev'
export class AppConfig {
  public port: number
  public host: string
  public protocol: string

  constructor(init: {protocol: string; host: string; port: string | number}) {
    this.protocol = init.protocol
    this.port = typeof init.port === 'number' ? init.port : Number.parseInt(init.port, 10)
    this.host = init.host
  }

  private get wsProto(): 'ws' | 'wss' {
    return this.protocol === 'https' ? 'wss' : 'ws'
  }

  private portSuffix(proto: 'http' | 'https' | 'ws' | 'wss'): string {
    const p = this.port
    if ((proto === 'http' || proto === 'ws') && p === 80) return ''
    if ((proto === 'https' || proto === 'wss') && p === 443) return ''
    return `:${p}`
  }

  get httpUrl(): string {
    const proto = this.protocol as 'http' | 'https'
    return `${proto}://${this.host}${this.portSuffix(proto)}`
  }

  get codeWsUrl(): string {
    const proto = this.wsProto
    return `${proto}://${this.host}${this.portSuffix(proto)}/code`
  }

  get mcpHttpUrl(): string {
    const proto = this.protocol as 'http' | 'https'
    return `${proto}://${this.host}${this.portSuffix(proto)}/mcp`
  }

  getCodeWS(uid: string): string {
    return `${this.codeWsUrl}/${uid}`
  }
  toJSONString(): string {
    const data = {
      port: this.port,
      host: this.host,
      protocol: this.protocol,
      httpUrl: this.httpUrl,
      codeWsUrl: this.codeWsUrl,
      mcpHttpUrl: this.mcpHttpUrl,
    }
    return JSON.stringify(data)
  }

  static fromEnv(): AppConfig {
    if (Bun) {
      const protocol = Bun.env.MCP_PROTOCOL || PRESET.protocol
      const host = Bun.env.MCP_HOST || PRESET.host
      const port = Bun.env.MCP_PORT || PRESET.port
      return new AppConfig({protocol, host, port})
    } else {
      return new AppConfig(PRESET)
    }
  }
}

export default AppConfig.fromEnv()
