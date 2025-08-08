import { filterDesignComponentSetInfo } from "@/utils/filterDesignComponentInfo";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sendCommandToFigma } from "./index";
import { DEFAULT_PERSONAL_TOKEN } from "../../config";
import { createLogger } from "@/utils/logger";
import { processComponentsToMarkdown } from "@/utils/ptd/filterComponent";
const logger = createLogger("ptdTool");
const componentToolList = (server: McpServer) => {
  // Get File components Set Info
  server.tool(
    "get_file_components_set_or_component",
    "Get a list of published component sets or component within a file library",
    {
      fileKey: z
        .string()
        .describe("The Figma file identifier found in the file URL"),
    },
    async ({ fileKey }) => {
      try {
        const token = DEFAULT_PERSONAL_TOKEN;
        logger.log("token", token);
        if (!token) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error:
                    "Personal token not found. Please provide personalToken parameter or set FIGMA_API_KEY environment variable.",
                }),
              },
            ],
          };
        }

        // Make API call to get file components set
        const response = await fetch(
          `https://api.figma.com/v1/files/${fileKey}/component_sets`,
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

        const fileComponentSets = await response.json();
        if (fileComponentSets.meta.component_sets) {
          // 将文件保存到generated-ui目录下
          const outputPath = "./generated-ui/components.md";
          const res = processComponentsToMarkdown(fileComponentSets, outputPath);
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                fileKey,
                // components: fileComponents,
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
                error: `Error getting file components: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              }),
            },
          ],
        };
      }
    }
  );

  // Get Component Tool
  server.tool(
    "get_component",
    "Get detailed information about a specific component by its key",
    {
      componentKey: z
        .string()
        .describe("The unique key identifier of the component"),
      personalToken: z
        .string()
        .optional()
        .describe(
          "Optional personal token, will use environment token if not provided"
        ),
    },
    async ({ componentKey, personalToken }) => {
      try {
        // Get personal token - use provided one or get from environment
        let token = personalToken;
        if (!token) {
          token = process.env.personalToken;
          if (!token) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error:
                      "Personal token not found. Please provide personalToken parameter or set FIGMA_API_KEY environment variable.",
                  }),
                },
              ],
            };
          }
        }

        // Make API call to get component details
        const response = await fetch(
          `https://api.figma.com/v1/components/${componentKey}`,
          {
            headers: {
              // Authorization: `Bearer ${token}`,
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
