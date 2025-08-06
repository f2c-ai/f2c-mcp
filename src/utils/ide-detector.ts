import { Logger } from "./logger"

export function detectIDE(logger: Logger) {
  try {
  const env = process.env

      // 不同ide注入变量没有统一方式，简单判断路径
  // Trae
  if (env?.VSCODE_CWD?.toLowerCase().includes('trae')) return 'Trae'

  // Comate
  if (env?.IDE?.toLocaleLowerCase().includes('comate') || env?.VSCODE_CWD?.toLowerCase().includes('comate')) return 'Comate'

  // Cursor
  if (env?.VSCODE_CWD?.toLowerCase().includes('cursor')) return 'Cursor'

  return 'Other IDE'
  } catch (error) {
     return 'Other IDE'
    
  }

}
