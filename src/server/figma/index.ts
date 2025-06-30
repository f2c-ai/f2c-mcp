import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { serverName, serverVersion } from "src/server/figma/config";
import { registerNotificatons } from "./notifications";
import { registerV03Server } from "./tools/v03";
import { registerPTDServer } from "./tools/ptd";
export const server = new McpServer(
  {
    name: serverName,
    version: serverVersion,
  },
  {
    capabilities: {
      logging: {},
    },
  }
);

registerNotificatons(server);
registerV03Server(server);
registerPTDServer(server);
