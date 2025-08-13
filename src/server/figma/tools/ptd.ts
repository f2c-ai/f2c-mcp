import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import componentToolList from "./ptd/componentToolList";
import { createLogger } from "@/utils/logger";
import { z } from "zod";
import channelToolList from "./ptd/channelTool";
import createNodeToolList from "./ptd/createTool";
import { sendCommandToFigma, start } from "./ptd/index";
import getNodeInfoToolList from "./ptd/nodeTool";
import prompt from "./ptd/promtp";
const logger = createLogger("ptdTool");

export function registerPTDServer(server: McpServer) {
  channelToolList(server);
  createNodeToolList(server);
  getNodeInfoToolList(server);
  componentToolList(server);
  prompt(server);
  // Move Node Tool
  server.tool(
    "move_node",
    "Move a node to a new position in Figma",
    {
      nodeId: z.string().describe("The ID of the node to move"),
      x: z.number().describe("New X position"),
      y: z.number().describe("New Y position"),
    },
    async ({ nodeId, x, y }) => {
      try {
        const result = await sendCommandToFigma("move_node", { nodeId, x, y });
        const typedResult = result as { name: string };
        return {
          content: [
            {
              type: "text",
              text: `Moved node "${typedResult.name}" to position (${x}, ${y})`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error moving node: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Clone Node Tool
  server.tool(
    "clone_node",
    "Clone an existing node in Figma",
    {
      nodeId: z.string().describe("The ID of the node to clone"),
      x: z.number().optional().describe("New X position for the clone"),
      y: z.number().optional().describe("New Y position for the clone"),
    },
    async ({ nodeId, x, y }) => {
      try {
        const result = await sendCommandToFigma("clone_node", { nodeId, x, y });
        const typedResult = result as { name: string; id: string };
        return {
          content: [
            {
              type: "text",
              text: `Cloned node "${typedResult.name}" with new ID: ${
                typedResult.id
              }${
                x !== undefined && y !== undefined
                  ? ` at position (${x}, ${y})`
                  : ""
              }`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error cloning node: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Resize Node Tool
  server.tool(
    "resize_node",
    "Resize a node in Figma",
    {
      nodeId: z.string().describe("The ID of the node to resize"),
      width: z.number().positive().describe("New width"),
      height: z.number().positive().describe("New height"),
    },
    async ({ nodeId, width, height }) => {
      try {
        const result = await sendCommandToFigma("resize_node", {
          nodeId,
          width,
          height,
        });
        const typedResult = result as { name: string };
        return {
          content: [
            {
              type: "text",
              text: `Resized node "${typedResult.name}" to width ${width} and height ${height}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error resizing node: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Delete Multiple Nodes Tool
  server.tool(
    "delete_multiple_nodes",
    "Delete multiple nodes from Figma at once",
    {
      nodeIds: z.array(z.string()).describe("Array of node IDs to delete"),
    },
    async ({ nodeIds }) => {
      try {
        const result = await sendCommandToFigma("delete_multiple_nodes", {
          nodeIds,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting multiple nodes: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Export Node as Image Tool
  server.tool(
    "export_node_as_image",
    "Export a node as an image from Figma",
    {
      nodeId: z.string().describe("The ID of the node to export"),
      format: z
        .enum(["PNG", "JPG", "SVG", "PDF"])
        .optional()
        .describe("Export format"),
      scale: z.number().positive().optional().describe("Export scale"),
    },
    async ({ nodeId, format, scale }) => {
      try {
        const result = await sendCommandToFigma("export_node_as_image", {
          nodeId,
          format: format || "PNG",
          scale: scale || 1,
        });
        const typedResult = result as { imageData: string; mimeType: string };

        return {
          content: [
            {
              type: "image",
              data: typedResult.imageData,
              mimeType: typedResult.mimeType || "image/png",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error exporting node as image: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // // Get Styles Tool
  // server.tool(
  //   "get_styles",
  //   "Get all styles from the current Figma document",
  //   {},
  //   async () => {
  //     try {
  //       const result = await sendCommandToFigma("get_styles");
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
  //             text: `Error getting styles: ${
  //               error instanceof Error ? error.message : String(error)
  //             }`,
  //           },
  //         ],
  //       };
  //     }
  //   }
  // );

  // Get Annotations Tool
  server.tool(
    "get_annotations",
    "Get all annotations in the current document or specific node",
    {
      nodeId: z
        .string()
        .optional()
        .describe("Optional node ID to get annotations for specific node"),
      includeCategories: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to include category information"),
    },
    async ({ nodeId, includeCategories }) => {
      try {
        const result = await sendCommandToFigma("get_annotations", {
          nodeId,
          includeCategories,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting annotations: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Text Node Scanning Tool
  server.tool(
    "scan_text_nodes",
    "Scan all text nodes in the selected Figma node",
    {
      nodeId: z.string().describe("ID of the node to scan"),
    },
    async ({ nodeId }) => {
      try {
        // Initial response to indicate we're starting the process
        const initialStatus = {
          type: "text" as const,
          text: "Starting text node scanning. This may take a moment for large designs...",
        };

        // Use the plugin's scan_text_nodes function with chunking flag
        const result = await sendCommandToFigma("scan_text_nodes", {
          nodeId,
          useChunking: true, // Enable chunking on the plugin side
          chunkSize: 10, // Process 10 nodes at a time
        });

        // If the result indicates chunking was used, format the response accordingly
        if (result && typeof result === "object" && "chunks" in result) {
          const typedResult = result as {
            success: boolean;
            totalNodes: number;
            processedNodes: number;
            chunks: number;
            textNodes: Array<any>;
          };

          const summaryText = `
        Scan completed:
        - Found ${typedResult.totalNodes} text nodes
        - Processed in ${typedResult.chunks} chunks
        `;

          return {
            content: [
              initialStatus,
              {
                type: "text" as const,
                text: summaryText,
              },
              {
                type: "text" as const,
                text: JSON.stringify(typedResult.textNodes, null, 2),
              },
            ],
          };
        }

        // If chunking wasn't used or wasn't reported in the result format, return the result as is
        return {
          content: [
            initialStatus,
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error scanning text nodes: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Node Type Scanning Tool
  server.tool(
    "scan_nodes_by_types",
    "Scan for child nodes with specific types in the selected Figma node",
    {
      nodeId: z.string().describe("ID of the node to scan"),
      types: z
        .array(z.string())
        .describe(
          "Array of node types to find in the child nodes (e.g. ['COMPONENT', 'FRAME'])"
        ),
    },
    async ({ nodeId, types }) => {
      try {
        // Initial response to indicate we're starting the process
        const initialStatus = {
          type: "text" as const,
          text: `Starting node type scanning for types: ${types.join(", ")}...`,
        };

        // Use the plugin's scan_nodes_by_types function
        const result = await sendCommandToFigma("scan_nodes_by_types", {
          nodeId,
          types,
        });

        // Format the response
        if (result && typeof result === "object" && "matchingNodes" in result) {
          const typedResult = result as {
            success: boolean;
            count: number;
            matchingNodes: Array<{
              id: string;
              name: string;
              type: string;
              bbox: {
                x: number;
                y: number;
                width: number;
                height: number;
              };
            }>;
            searchedTypes: Array<string>;
          };

          const summaryText = `Scan completed: Found ${
            typedResult.count
          } nodes matching types: ${typedResult.searchedTypes.join(", ")}`;

          return {
            content: [
              initialStatus,
              {
                type: "text" as const,
                text: summaryText,
              },
              {
                type: "text" as const,
                text: JSON.stringify(typedResult.matchingNodes, null, 2),
              },
            ],
          };
        }

        // If the result is in an unexpected format, return it as is
        return {
          content: [
            initialStatus,
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error scanning nodes by types: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Read My Design Tool
  server.tool(
    "read_my_design",
    "Get detailed information about the current selection in Figma, including all node details",
    {},
    async () => {
      try {
        const result = await sendCommandToFigma("read_my_design", {});
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting node info: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // A tool to get Figma Prototyping Reactions from multiple nodes
  server.tool(
    "get_reactions",
    "Get Figma Prototyping Reactions from multiple nodes. CRITICAL: The output MUST be processed using the 'reaction_to_connector_strategy' prompt IMMEDIATELY to generate parameters for connector lines via the 'create_connections' tool.",
    {
      nodeIds: z
        .array(z.string())
        .describe("Array of node IDs to get reactions from"),
    },
    async ({ nodeIds }) => {
      try {
        const result = await sendCommandToFigma("get_reactions", { nodeIds });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
            {
              type: "text",
              text: "IMPORTANT: You MUST now use the reaction data above and follow the `reaction_to_connector_strategy` prompt to prepare the parameters for the `create_connections` tool call. This is a required next step.",
            },
          ],
          followUp: {
            type: "prompt",
            prompt: "reaction_to_connector_strategy",
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting reactions: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Create Connectors Tool
  server.tool(
    "set_default_connector",
    "Set a copied connector node as the default connector",
    {
      connectorId: z
        .string()
        .optional()
        .describe("The ID of the connector node to set as default"),
    },
    async ({ connectorId }) => {
      try {
        const result = await sendCommandToFigma("set_default_connector", {
          connectorId,
        });

        return {
          content: [
            {
              type: "text",
              text: `Default connector set: ${JSON.stringify(result)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting default connector: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "delete_node",
    "Delete a node from Figma",
    {
      nodeId: z.string().describe("The ID of the node to delete"),
    },
    async ({ nodeId }) => {
      try {
        await sendCommandToFigma("delete_node", { nodeId });
        return {
          content: [
            {
              type: "text",
              text: `Deleted node with ID: ${nodeId}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting node: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  server.tool(
    "create_connections",
    "Create connections between nodes using the default connector style",
    {
      connections: z
        .array(
          z.object({
            startNodeId: z.string().describe("ID of the starting node"),
            endNodeId: z.string().describe("ID of the ending node"),
            text: z
              .string()
              .optional()
              .describe("Optional text to display on the connector"),
          })
        )
        .describe("Array of node connections to create"),
    },
    async ({ connections }) => {
      try {
        if (!connections || connections.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No connections provided",
              },
            ],
          };
        }

        const result = await sendCommandToFigma("create_connections", {
          connections,
        });

        return {
          content: [
            {
              type: "text",
              text: `Created ${
                connections.length
              } connections: ${JSON.stringify(result)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating connections: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Team Library Components Tool
  // server.tool(
  //   "get_team_library_components",
  //   "Get team library components information by team ID",
  //   {
  //     teamId: z.string().describe("The Figma team ID to get components from"),
  //     personalToken: z
  //       .string()
  //       .optional()
  //       .describe(
  //         "Optional personal token, will use environment token if not provided"
  //       ),
  //   },
  //   async ({ teamId, personalToken }) => {
  //     try {
  //       // Get personal token - use provided one or get from environment
  //       let token = personalToken;
  //       if (!token) {
  //         token = process.env.personalToken;
  //         if (!token) {
  //           return {
  //             content: [
  //               {
  //                 type: "text",
  //                 text: JSON.stringify({
  //                   success: false,
  //                   error:
  //                     "Personal token not found. Please provide personalToken parameter or set FIGMA_API_KEY environment variable.",
  //                 }),
  //               },
  //             ],
  //           };
  //         }
  //       }

  //       // Make API call to get team components
  //       const response = await fetch(
  //         `https://api.figma.com/v1/teams/${teamId}/components`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "X-Figma-Token": token,
  //           },
  //         }
  //       );

  //       if (!response.ok) {
  //         const errorText = await response.text();
  //         return {
  //           content: [
  //             {
  //               type: "text",
  //               text: JSON.stringify({
  //                 success: false,
  //                 error: `API request failed: ${response.status} ${response.statusText}`,
  //                 details: errorText,
  //               }),
  //             },
  //           ],
  //         };
  //       }

  //       const teamComponents = await response.json();
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               teamId,
  //               components: teamComponents,
  //             }),
  //           },
  //         ],
  //       };
  //     } catch (error) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: `Error getting team components: ${
  //                 error instanceof Error ? error.message : String(error)
  //               }`,
  //             }),
  //           },
  //         ],
  //       };
  //     }
  //   }
  // );
}
// Run the server
start().catch((error) => {
  logger.error(
    `Error starting FigmaMCP server: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
});
