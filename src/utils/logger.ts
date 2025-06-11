export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

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

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] [${this.context}] ${message}`, ...args)
    }
  }

  info(message: any, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] [${this.context}] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] [${this.context}] ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] [${this.context}] ${message}`, ...args)
    }
  }
}

// 创建默认日志实例
export const createLogger = (context: string, level: LogLevel = LogLevel.INFO) => new Logger(context, level)
