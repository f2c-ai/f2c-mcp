// 解析命令行参数
const figmaApiKeyArg = process.argv.find(arg => arg.startsWith('--figma-api-key='))
const figmaApiKey = figmaApiKeyArg ? figmaApiKeyArg.split('=')[1] : ''

export const DEFAULT_PERSONAL_TOKEN = figmaApiKey || process.env.personalToken || process.env.FIGMA_API_KEY || ''
// console.log('DEFAULT_PERSONAL_TOKEN', DEFAULT_PERSONAL_TOKEN)
export const serverName = 'F2C MCP'
export const serverVersion = process.env.FIGMA_VERSION || '0.0.1'
// console.log('DEFAULT_PERSONAL_TOKEN', DEFAULT_PERSONAL_TOKEN)
