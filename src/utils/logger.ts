export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
// Determine if stdio or http mode by checking the run command
function detectTransportMode(): boolean {
  const args = process.argv.join(' ').toLowerCase()
  const script = (process.env.npm_lifecycle_script || '').toLowerCase()
  const envTransport = (process.env.MCP_TRANSPORT || process.env.F2C_TRANSPORT || '').toLowerCase()

  // 1) 优先使用显式环境变量覆盖
  if (envTransport === 'http') return true
  if (envTransport === 'stdio') return false

  // 2) 根据启动脚本与 argv 提示判断（兼容 bun、node、测试场景）
  const httpHints = [
    'src/http.ts',
    'dist/http.js',
    'dist/http.mjs',
    'express.ts',
    'streamable-http.js',
    'streamable-http.ts',
  ]
  const stdioHints = ['src/stdio.ts', 'dist/stdio.js', 'dist/stdio.mjs']

  const hasHttpHint = httpHints.some(h => args.includes(h) || script.includes(h))
  const hasStdioHint = stdioHints.some(h => args.includes(h) || script.includes(h))

  if (hasHttpHint && !hasStdioHint) return true
  if (hasStdioHint && !hasHttpHint) return false

  // 3) 兜底：在 Bun 环境且存在端口配置，认为是 HTTP 服务器模式
  const isPortDefined = !!process.env.PORT
  const isBunRuntime = typeof (globalThis as any).Bun !== 'undefined'
  if (isPortDefined && isBunRuntime) return true

  // 默认回退为 stdio
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
