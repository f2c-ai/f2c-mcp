export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
// Determine if stdio or http mode by checking the run command
function detectTransportMode(): boolean {
  const args = Array.isArray(process.argv) ? process.argv.join(' ').toLowerCase() : ''
  const proto = typeof process !== 'undefined' && process.env.APP_PROTOCOL ? process.env.APP_PROTOCOL.toLowerCase() : ''
  const hasMcpUrl = typeof process !== 'undefined' && !!process.env.MCP_CONFIG_URL
  const envTransport =
    typeof process !== 'undefined' && process.env.transportType ? process.env.transportType.toLowerCase() : ''
  const forceStdio =
    typeof process !== 'undefined' && (process.env.MCP_STDIO === '1' || process.env.F2C_FORCE_STDIO === '1')
  const forceHttp = typeof process !== 'undefined' && process.env.F2C_FORCE_HTTP === '1'
  if (envTransport === 'stdio' || forceStdio) return false
  if (envTransport === 'http' || forceHttp) return true
  if (args.includes('http.ts')) return true
  if (hasMcpUrl) return true
  if (proto === 'http' || proto === 'https') return true
  return false
}
export const isHttp = detectTransportMode()
export class Logger {
  private context: string
  private level: LogLevel
  private useTimestamp: boolean
  constructor(context: string, level: LogLevel = LogLevel.INFO) {
    this.context = context
    this.level = level
    this.useTimestamp = typeof process !== 'undefined' && process.env.F2C_LOG_TIMESTAMP === '1'
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }
  log(...args: any[]): void {
    if (isHttp) {
      console.log(...args)
    } else {
      console.error(...args)
    }
  }
  logWarn(...args: any[]): void {
    if (isHttp) {
      console.warn(...args)
    } else {
      console.error(...args)
    }
  }
  debug(...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      const prefix = this.useTimestamp
        ? `[${new Date().toISOString()}] [DEBUG] [${this.context}]`
        : `[DEBUG] [${this.context}]`
      this.log(prefix, ...args)
    }
  }

  info(...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      const prefix = this.useTimestamp
        ? `[${new Date().toISOString()}] [INFO] [${this.context}]`
        : `[INFO] [${this.context}]`
      this.log(prefix, ...args)
    }
  }

  warn(...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      const prefix = this.useTimestamp
        ? `[${new Date().toISOString()}] [WARN] [${this.context}]`
        : `[WARN] [${this.context}]`
      this.logWarn(prefix, ...args)
    }
  }

  error(...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      const prefix = this.useTimestamp
        ? `[${new Date().toISOString()}] [ERROR] [${this.context}]`
        : `[ERROR] [${this.context}]`
      console.error(prefix, ...args)
    }
  }

  raw(...args: any[]): void {
    if (isHttp) {
      console.log(...args)
    } else {
      console.error(...args)
    }
  }
}

// Create default logger instance
export const createLogger = (context: string, level: LogLevel = LogLevel.INFO) => new Logger(context, level)
