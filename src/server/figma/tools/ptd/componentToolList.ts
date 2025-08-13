// import { filterDesignComponentSetInfo } from "@/utils/filterDesignComponentInfo";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sendCommandToFigma } from "./index";
import { DEFAULT_PERSONAL_TOKEN } from "../../config";
import { createLogger } from "@/utils/logger";
// import { processComponentsToMarkdown } from "@/utils/ptd/filterComponent";
// const logger = createLogger("ptdTool");
const componentToolList = (server: McpServer) => {
  // Get Component Tool
  server.tool(
    "get_component",
    "Get detailed information about a specific component by its key",
    {
      componentKey: z
        .string()
        .describe("The unique key identifier of the component"),
    },
    async ({ componentKey }) => {
      try {
        // Get personal token - use provided one or get from environment
        const token = DEFAULT_PERSONAL_TOKEN;
        // Make API call to get component details
        const response = await fetch(
          `https://api.figma.com/v1/components/${componentKey}`,
          {
            headers: {
              "X-Figma-Token": token,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: `API request failed: ${response.status} ${response.statusText}`,
                  details: errorText,
                }),
              },
            ],
          };
        }

        const componentData = await response.json();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                componentKey,
                component: componentData,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Error getting component: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              }),
            },
          ],
        };
      }
    }
  );

  // Copy Instance Overrides Tool
  server.tool(
    "get_instance_overrides",
    "Get all override properties from a selected component instance. These overrides can be applied to other instances, which will swap them to match the source component.",
    {
      nodeId: z
        .string()
        .optional()
        .describe(
          "Optional ID of the component instance to get overrides from. If not provided, currently selected instance will be used."
        ),
    },
    async ({ nodeId }) => {
      try {
        const result = await sendCommandToFigma("get_instance_overrides", {
          instanceNodeId: nodeId || null,
        });
        const typedResult = result as any;

        return {
          content: [
            {
              type: "text",
              text: typedResult.success
                ? `Successfully got instance overrides: ${typedResult.message}`
                : `Failed to get instance overrides: ${typedResult.message}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error copying instance overrides: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  // Get Local Components Tool
  // server.tool(
  //   "get_local_components",
  //   "Get all local components from the Figma document",
  //   {},
  //   async () => {
  //     try {
  //       const result = await sendCommandToFigma("get_local_components");
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify(result),
  //           },
  //         ],
  //       };
  //     } catch (error) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: `Error getting local components: ${
  //               error instanceof Error ? error.message : String(error)
  //             }`,
  //           },
  //         ],
  //       };
  //     }
  //   }
  // );
};

export default componentToolList;
