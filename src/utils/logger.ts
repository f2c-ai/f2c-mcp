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
  if (envTransport === 'stdio' || forceStdio) return false
  if (args.includes('http.ts')) return true
  if (hasMcpUrl) return true
  if (proto === 'http' || proto === 'https') return true
  return false
}
export const isHttp = detectTransportMode()
export class Logger {
  private context: string
  private level: LogLevel
  constructor(context: string, level: LogLevel = LogLevel.INFO) {
    this.context = context
    this.level = level
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
      this.log(`[DEBUG] [${this.context}]`, ...args) // 使用 console.error 而不是 console.log
    }
  }

  info(...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      this.log(`[INFO] [${this.context}]`, ...args)
    }
  }

  warn(...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      this.logWarn(`[WARN] [${this.context}]`, ...args)
    }
  }

  error(...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] [${this.context}]`, ...args)
    }
  }
}

// Create default logger instance
export const createLogger = (context: string, level: LogLevel = LogLevel.INFO) => new Logger(context, level)
