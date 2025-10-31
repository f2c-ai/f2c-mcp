import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerCodeConvertPrompts } from "./prompt"
import { registerCodeConvertTool } from "./tool"

export const registerCodeConvert = (mcpServer: McpServer) => {
  registerCodeConvertPrompts(mcpServer)
  registerCodeConvertTool(mcpServer)
}
