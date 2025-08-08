import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { joinChannel } from "./index";
const channelToolList = (server: McpServer) => {
  // Update the join_channel tool
  server.tool(
    "join_channel",
    "Join a specific channel to communicate with Figma",
    {
      channel: z
        .string()
        .describe("The name of the channel to join")
        .default(""),
    },
    async ({ channel }) => {
      try {
        if (!channel) {
          // If no channel provided, ask the user for input
          return {
            content: [
              {
                type: "text",
                text: "Please provide a channel name to join:",
              },
            ],
            followUp: {
              tool: "join_channel",
              description: "Join the specified channel",
            },
          };
        }

        await joinChannel(channel);
        return {
          content: [
            {
              type: "text",
              text: `Successfully joined channel: ${channel}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error joining channel: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  // Get Personal Token Tool
  // server.tool(
  //   "get_personal_token",
  //   "Get Figma personal access token from environment or server",
  //   {},
  //   async () => {
  //     try {
  //       // First try to get from environment/config
  //       if (process.env.personalToken) {
  //         return {
  //           content: [
  //             {
  //               type: "text",
  //               text: JSON.stringify({
  //                 success: true,
  //                 token: process.env.personalToken,
  //                 source: "environment",
  //               }),
  //             },
  //           ],
  //         };
  //       }

  //       try {
  //         const result = await sendCommandToFigma(
  //           "get_personal_token",
  //           {},
  //           60 * 1000
  //         );
  //         return {
  //           content: [
  //             {
  //               type: "text",
  //               text: JSON.stringify(result),
  //             },
  //           ],
  //         };
  //       } catch (error) {
  //         return {
  //           content: [
  //             {
  //               type: "text",
  //               text: `Error getting personal token: ${
  //                 error instanceof Error ? error.message : String(error)
  //               }`,
  //             },
  //           ],
  //         };
  //       }
  //     } catch (error) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: `Error getting personal token: ${
  //                 error instanceof Error ? error.message : String(error)
  //               }`,
  //               source: "error",
  //             }),
  //           },
  //         ],
  //       };
  //     }
  //   }
  // );
};

export default channelToolList;
