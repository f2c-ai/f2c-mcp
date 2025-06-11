/**
 * 从命令行参数中获取指定参数的值
 * 支持 --param=value 格式
 * @param {string} paramName - 参数名称（不包含前缀 --）
 * @param {string|undefined} defaultValue - 默认值，如果未找到参数则返回此值
 * @returns {string|undefined} 参数值或默认值
 */
export function getArgValue(paramName: string, defaultValue?: string): string | undefined {
  const args = process.argv
  const paramPrefix = `--${paramName}=`

  for (const arg of args) {
    // 检查参数是否以指定前缀开头
    if (arg.startsWith(paramPrefix)) {
      return arg.substring(paramPrefix.length)
    }
  }

  // 如果未找到参数，返回默认值
  return defaultValue
}
