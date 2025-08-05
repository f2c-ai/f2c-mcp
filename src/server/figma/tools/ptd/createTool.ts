import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sendCommandToFigma } from ".";
import { z } from "zod";
const createNodeToolList = (server: McpServer) => {
  // Create Rectangle Tool
  server.tool(
    "create_rectangle",
    "Create a new rectangle in Figma",
    {
      x: z.number().describe("X position"),
      y: z.number().describe("Y position"),
      width: z.number().describe("Width of the rectangle"),
      height: z.number().describe("Height of the rectangle"),
      name: z.string().optional().describe("Optional name for the rectangle"),
      parentId: z
        .string()
        .optional()
        .describe("Optional parent node ID to append the rectangle to"),
    },
    async ({ x, y, width, height, name, parentId }) => {
      try {
        const result = await sendCommandToFigma("create_rectangle", {
          x,
          y,
          width,
          height,
          name: name || "Rectangle",
          parentId,
        });
        return {
          content: [
            {
              type: "text",
              text: `Created rectangle "${JSON.stringify(result)}"`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating rectangle: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Create Frame Tool
  server.tool(
    "create_frame",
    "Create a new frame in Figma",
    {
      x: z.number().describe("X position"),
      y: z.number().describe("Y position"),
      width: z.number().describe("Width of the frame"),
      height: z.number().describe("Height of the frame"),
      name: z.string().optional().describe("Optional name for the frame"),
      parentId: z
        .string()
        .optional()
        .describe("Optional parent node ID to append the frame to"),
      fillColor: z
        .object({
          r: z.number().min(0).max(1).describe("Red component (0-1)"),
          g: z.number().min(0).max(1).describe("Green component (0-1)"),
          b: z.number().min(0).max(1).describe("Blue component (0-1)"),
          a: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe("Alpha component (0-1)"),
        })
        .optional()
        .describe("Fill color in RGBA format"),
      strokeColor: z
        .object({
          r: z.number().min(0).max(1).describe("Red component (0-1)"),
          g: z.number().min(0).max(1).describe("Green component (0-1)"),
          b: z.number().min(0).max(1).describe("Blue component (0-1)"),
          a: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe("Alpha component (0-1)"),
        })
        .optional()
        .describe("Stroke color in RGBA format"),
      strokeWeight: z.number().positive().optional().describe("Stroke weight"),
      layoutMode: z
        .enum(["NONE", "HORIZONTAL", "VERTICAL"])
        .optional()
        .describe("Auto-layout mode for the frame"),
      layoutWrap: z
        .enum(["NO_WRAP", "WRAP"])
        .optional()
        .describe("Whether the auto-layout frame wraps its children"),
      paddingTop: z
        .number()
        .optional()
        .describe("Top padding for auto-layout frame"),
      paddingRight: z
        .number()
        .optional()
        .describe("Right padding for auto-layout frame"),
      paddingBottom: z
        .number()
        .optional()
        .describe("Bottom padding for auto-layout frame"),
      paddingLeft: z
        .number()
        .optional()
        .describe("Left padding for auto-layout frame"),
      primaryAxisAlignItems: z
        .enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
        .optional()
        .describe(
          "Primary axis alignment for auto-layout frame. Note: When set to SPACE_BETWEEN, itemSpacing will be ignored as children will be evenly spaced."
        ),
      counterAxisAlignItems: z
        .enum(["MIN", "MAX", "CENTER", "BASELINE"])
        .optional()
        .describe("Counter axis alignment for auto-layout frame"),
      layoutSizingHorizontal: z
        .enum(["FIXED", "HUG", "FILL"])
        .optional()
        .describe("Horizontal sizing mode for auto-layout frame"),
      layoutSizingVertical: z
        .enum(["FIXED", "HUG", "FILL"])
        .optional()
        .describe("Vertical sizing mode for auto-layout frame"),
      itemSpacing: z
        .number()
        .optional()
        .describe(
          "Distance between children in auto-layout frame. Note: This value will be ignored if primaryAxisAlignItems is set to SPACE_BETWEEN."
        ),
    },
    async ({
      x,
      y,
      width,
      height,
      name,
      parentId,
      fillColor,
      strokeColor,
      strokeWeight,
      layoutMode,
      layoutWrap,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      primaryAxisAlignItems,
      counterAxisAlignItems,
      layoutSizingHorizontal,
      layoutSizingVertical,
      itemSpacing,
    }) => {
      try {
        const result = await sendCommandToFigma("create_frame", {
          x,
          y,
          width,
          height,
          name: name || "Frame",
          parentId,
          fillColor: fillColor || { r: 1, g: 1, b: 1, a: 1 },
          strokeColor: strokeColor,
          strokeWeight: strokeWeight,
          layoutMode,
          layoutWrap,
          paddingTop,
          paddingRight,
          paddingBottom,
          paddingLeft,
          primaryAxisAlignItems,
          counterAxisAlignItems,
          layoutSizingHorizontal,
          layoutSizingVertical,
          itemSpacing,
        });
        const typedResult = result as { name: string; id: string };
        return {
          content: [
            {
              type: "text",
              text: `Created frame "${typedResult.name}" with ID: ${typedResult.id}. Use the ID as the parentId to appendChild inside this frame.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating frame: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Create Text Tool
  server.tool(
    "create_text",
    "Create a new text element in Figma",
    {
      x: z.number().describe("X position"),
      y: z.number().describe("Y position"),
      text: z.string().describe("Text content"),
      fontSize: z.number().optional().describe("Font size (default: 14)"),
      fontWeight: z
        .number()
        .optional()
        .describe("Font weight (e.g., 400 for Regular, 700 for Bold)"),
      fontColor: z
        .object({
          r: z.number().min(0).max(1).describe("Red component (0-1)"),
          g: z.number().min(0).max(1).describe("Green component (0-1)"),
          b: z.number().min(0).max(1).describe("Blue component (0-1)"),
          a: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe("Alpha component (0-1)"),
        })
        .optional()
        .describe("Font color in RGBA format"),
      name: z
        .string()
        .optional()
        .describe("Semantic layer name for the text node"),
      parentId: z
        .string()
        .optional()
        .describe("Optional parent node ID to append the text to"),
    },
    async ({ x, y, text, fontSize, fontWeight, fontColor, name, parentId }) => {
      try {
        const result = await sendCommandToFigma("create_text", {
          x,
          y,
          text,
          fontSize: fontSize || 14,
          fontWeight: fontWeight || 400,
          fontColor: fontColor || { r: 0, g: 0, b: 0, a: 1 },
          name: name || "Text",
          parentId,
        });
        const typedResult = result as { name: string; id: string };
        return {
          content: [
            {
              type: "text",
              text: `Created text "${typedResult.name}" with ID: ${typedResult.id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating text: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Set Fill Color Tool
  server.tool(
    "set_fill_color",
    "Set the fill color of a node in Figma can be TextNode or FrameNode",
    {
      nodeId: z.string().describe("The ID of the node to modify"),
      r: z.number().min(0).max(1).describe("Red component (0-1)"),
      g: z.number().min(0).max(1).describe("Green component (0-1)"),
      b: z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: z.number().min(0).max(1).optional().describe("Alpha component (0-1)"),
    },
    async ({ nodeId, r, g, b, a }) => {
      try {
        const result = await sendCommandToFigma("set_fill_color", {
          nodeId,
          color: { r, g, b, a: a || 1 },
        });
        const typedResult = result as { name: string };
        return {
          content: [
            {
              type: "text",
              text: `Set fill color of node "${
                typedResult.name
              }" to RGBA(${r}, ${g}, ${b}, ${a || 1})`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting fill color: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Set Stroke Color Tool
  server.tool(
    "set_stroke_color",
    "Set the stroke color of a node in Figma",
    {
      nodeId: z.string().describe("The ID of the node to modify"),
      r: z.number().min(0).max(1).describe("Red component (0-1)"),
      g: z.number().min(0).max(1).describe("Green component (0-1)"),
      b: z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: z.number().min(0).max(1).optional().describe("Alpha component (0-1)"),
      weight: z.number().positive().optional().describe("Stroke weight"),
    },
    async ({ nodeId, r, g, b, a, weight }) => {
      try {
        const result = await sendCommandToFigma("set_stroke_color", {
          nodeId,
          color: { r, g, b, a: a || 1 },
          weight: weight || 1,
        });
        const typedResult = result as { name: string };
        return {
          content: [
            {
              type: "text",
              text: `Set stroke color of node "${
                typedResult.name
              }" to RGBA(${r}, ${g}, ${b}, ${a || 1}) with weight ${
                weight || 1
              }`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting stroke color: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  // Set Text Content Tool
  server.tool(
    "set_text_content",
    "Set the text content of an existing text node in Figma",
    {
      nodeId: z.string().describe("The ID of the text node to modify"),
      text: z.string().describe("New text content"),
    },
    async ({ nodeId, text }) => {
      try {
        const result = await sendCommandToFigma("set_text_content", {
          nodeId,
          text,
        });
        const typedResult = result as { name: string };
        return {
          content: [
            {
              type: "text",
              text: `Updated text content of node "${typedResult.name}" to "${text}"`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting text content: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Set Multiple Annotations Tool
  server.tool(
    "set_multiple_annotations",
    "Set multiple annotations parallelly in a node",
    {
      nodeId: z
        .string()
        .describe("The ID of the node containing the elements to annotate"),
      annotations: z
        .array(
          z.object({
            nodeId: z.string().describe("The ID of the node to annotate"),
            labelMarkdown: z
              .string()
              .describe("The annotation text in markdown format"),
            categoryId: z
              .string()
              .optional()
              .describe("The ID of the annotation category"),
            annotationId: z
              .string()
              .optional()
              .describe(
                "The ID of the annotation to update (if updating existing annotation)"
              ),
            properties: z
              .array(
                z.object({
                  type: z.string(),
                })
              )
              .optional()
              .describe("Additional properties for the annotation"),
          })
        )
        .describe("Array of annotations to apply"),
    },
    async ({ nodeId, annotations }, extra) => {
      try {
        if (!annotations || annotations.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No annotations provided",
              },
            ],
          };
        }

        // Initial response to indicate we're starting the process
        const initialStatus = {
          type: "text" as const,
          text: `Starting annotation process for ${annotations.length} nodes. This will be processed in batches of 5...`,
        };

        // Track overall progress
        let totalProcessed = 0;
        const totalToProcess = annotations.length;

        // Use the plugin's set_multiple_annotations function with chunking
        const result = await sendCommandToFigma("set_multiple_annotations", {
          nodeId,
          annotations,
        });

        // Cast the result to a specific type to work with it safely
        interface AnnotationResult {
          success: boolean;
          nodeId: string;
          annotationsApplied?: number;
          annotationsFailed?: number;
          totalAnnotations?: number;
          completedInChunks?: number;
          results?: Array<{
            success: boolean;
            nodeId: string;
            error?: string;
            annotationId?: string;
          }>;
        }

        const typedResult = result as AnnotationResult;

        // Format the results for display
        const success =
          typedResult.annotationsApplied && typedResult.annotationsApplied > 0;
        const progressText = `
      Annotation process completed:
      - ${
        typedResult.annotationsApplied || 0
      } of ${totalToProcess} successfully applied
      - ${typedResult.annotationsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;

        // Detailed results
        const detailedResults = typedResult.results || [];
        const failedResults = detailedResults.filter((item) => !item.success);

        // Create the detailed part of the response
        let detailedResponse = "";
        if (failedResults.length > 0) {
          detailedResponse = `\n\nNodes that failed:\n${failedResults
            .map((item) => `- ${item.nodeId}: ${item.error || "Unknown error"}`)
            .join("\n")}`;
        }

        return {
          content: [
            initialStatus,
            {
              type: "text" as const,
              text: progressText + detailedResponse,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting multiple annotations: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Create Component Instance Tool
  server.tool(
    "create_component_instance",
    "Create an instance of a component in Figma",
    {
      componentKey: z.string().describe("Key of the component to instantiate"),
      x: z.number().describe("X position"),
      y: z.number().describe("Y position"),
    },
    async ({ componentKey, x, y }) => {
      try {
        const result = await sendCommandToFigma("create_component_instance", {
          componentKey,
          x,
          y,
        });
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating component instance: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  // Set Instance Overrides Tool
  server.tool(
    "set_instance_overrides",
    "Apply previously copied overrides to selected component instances. Target instances will be swapped to the source component and all copied override properties will be applied.",
    {
      sourceInstanceId: z
        .string()
        .describe("ID of the source component instance"),
      targetNodeIds: z
        .array(z.string())
        .describe(
          "Array of target instance IDs. Currently selected instances will be used."
        ),
    },
    async ({ sourceInstanceId, targetNodeIds }) => {
      try {
        const result = await sendCommandToFigma("set_instance_overrides", {
          sourceInstanceId: sourceInstanceId,
          targetNodeIds: targetNodeIds || [],
        });
        const typedResult = result as setInstanceOverridesResult;

        if (typedResult.success) {
          const successCount =
            typedResult.results?.filter((r) => r.success).length || 0;
          return {
            content: [
              {
                type: "text",
                text: `Successfully applied ${
                  typedResult.totalCount || 0
                } overrides to ${successCount} instances.`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Failed to set instance overrides: ${typedResult.message}`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting instance overrides: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Set Corner Radius Tool
  server.tool(
    "set_corner_radius",
    "Set the corner radius of a node in Figma",
    {
      nodeId: z.string().describe("The ID of the node to modify"),
      radius: z.number().min(0).describe("Corner radius value"),
      corners: z
        .array(z.boolean())
        .length(4)
        .optional()
        .describe(
          "Optional array of 4 booleans to specify which corners to round [topLeft, topRight, bottomRight, bottomLeft]"
        ),
    },
    async ({ nodeId, radius, corners }) => {
      try {
        const result = await sendCommandToFigma("set_corner_radius", {
          nodeId,
          radius,
          corners: corners || [true, true, true, true],
        });
        const typedResult = result as { name: string };
        return {
          content: [
            {
              type: "text",
              text: `Set corner radius of node "${typedResult.name}" to ${radius}px`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting corner radius: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  // Set Multiple Text Contents Tool
  server.tool(
    "set_multiple_text_contents",
    "Set multiple text contents parallelly in a node",
    {
      nodeId: z
        .string()
        .describe("The ID of the node containing the text nodes to replace"),
      text: z
        .array(
          z.object({
            nodeId: z.string().describe("The ID of the text node"),
            text: z.string().describe("The replacement text"),
          })
        )
        .describe("Array of text node IDs and their replacement texts"),
    },
    async ({ nodeId, text }, extra) => {
      try {
        if (!text || text.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No text provided",
              },
            ],
          };
        }

        // Initial response to indicate we're starting the process
        const initialStatus = {
          type: "text" as const,
          text: `Starting text replacement for ${text.length} nodes. This will be processed in batches of 5...`,
        };

        // Track overall progress
        let totalProcessed = 0;
        const totalToProcess = text.length;

        // Use the plugin's set_multiple_text_contents function with chunking
        const result = await sendCommandToFigma("set_multiple_text_contents", {
          nodeId,
          text,
        });

        // Cast the result to a specific type to work with it safely
        interface TextReplaceResult {
          success: boolean;
          nodeId: string;
          replacementsApplied?: number;
          replacementsFailed?: number;
          totalReplacements?: number;
          completedInChunks?: number;
          results?: Array<{
            success: boolean;
            nodeId: string;
            error?: string;
            originalText?: string;
            translatedText?: string;
          }>;
        }

        const typedResult = result as TextReplaceResult;

        // Format the results for display
        const success =
          typedResult.replacementsApplied &&
          typedResult.replacementsApplied > 0;
        const progressText = `
      Text replacement completed:
      - ${
        typedResult.replacementsApplied || 0
      } of ${totalToProcess} successfully updated
      - ${typedResult.replacementsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;

        // Detailed results
        const detailedResults = typedResult.results || [];
        const failedResults = detailedResults.filter((item) => !item.success);

        // Create the detailed part of the response
        let detailedResponse = "";
        if (failedResults.length > 0) {
          detailedResponse = `\n\nNodes that failed:\n${failedResults
            .map((item) => `- ${item.nodeId}: ${item.error || "Unknown error"}`)
            .join("\n")}`;
        }

        return {
          content: [
            initialStatus,
            {
              type: "text" as const,
              text: progressText + detailedResponse,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting multiple text contents: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  // Set Layout Mode Tool
  server.tool(
    "set_layout_mode",
    "Set the layout mode and wrap behavior of a frame in Figma",
    {
      nodeId: z.string().describe("The ID of the frame to modify"),
      layoutMode: z
        .enum(["NONE", "HORIZONTAL", "VERTICAL"])
        .describe("Layout mode for the frame"),
      layoutWrap: z
        .enum(["NO_WRAP", "WRAP"])
        .optional()
        .describe("Whether the auto-layout frame wraps its children"),
    },
    async ({ nodeId, layoutMode, layoutWrap }) => {
      try {
        const result = await sendCommandToFigma("set_layout_mode", {
          nodeId,
          layoutMode,
          layoutWrap: layoutWrap || "NO_WRAP",
        });
        const typedResult = result as { name: string };
        return {
          content: [
            {
              type: "text",
              text: `Set layout mode of frame "${
                typedResult.name
              }" to ${layoutMode}${layoutWrap ? ` with ${layoutWrap}` : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting layout mode: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  server.tool(
    "set_annotation",
    "Create or update an annotation",
    {
      nodeId: z.string().describe("The ID of the node to annotate"),
      annotationId: z
        .string()
        .optional()
        .describe(
          "The ID of the annotation to update (if updating existing annotation)"
        ),
      labelMarkdown: z
        .string()
        .describe("The annotation text in markdown format"),
      categoryId: z
        .string()
        .optional()
        .describe("The ID of the annotation category"),
      properties: z
        .array(
          z.object({
            type: z.string(),
          })
        )
        .optional()
        .describe("Additional properties for the annotation"),
    },
    async ({ nodeId, annotationId, labelMarkdown, categoryId, properties }) => {
      try {
        const result = await sendCommandToFigma("set_annotation", {
          nodeId,
          annotationId,
          labelMarkdown,
          categoryId,
          properties,
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
              text: `Error setting annotation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
  // Set Padding Tool
  server.tool(
    "set_padding",
    "Set padding values for an auto-layout frame in Figma",
    {
      nodeId: z.string().describe("The ID of the frame to modify"),
      paddingTop: z.number().optional().describe("Top padding value"),
      paddingRight: z.number().optional().describe("Right padding value"),
      paddingBottom: z.number().optional().describe("Bottom padding value"),
      paddingLeft: z.number().optional().describe("Left padding value"),
    },
    async ({
      nodeId,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
    }) => {
      try {
        const result = await sendCommandToFigma("set_padding", {
          nodeId,
          paddingTop,
          paddingRight,
          paddingBottom,
          paddingLeft,
        });
        const typedResult = result as { name: string };

        // Create a message about which padding values were set
        const paddingMessages = [];
        if (paddingTop !== undefined)
          paddingMessages.push(`top: ${paddingTop}`);
        if (paddingRight !== undefined)
          paddingMessages.push(`right: ${paddingRight}`);
        if (paddingBottom !== undefined)
          paddingMessages.push(`bottom: ${paddingBottom}`);
        if (paddingLeft !== undefined)
          paddingMessages.push(`left: ${paddingLeft}`);

        const paddingText =
          paddingMessages.length > 0
            ? `padding (${paddingMessages.join(", ")})`
            : "padding";

        return {
          content: [
            {
              type: "text",
              text: `Set ${paddingText} for frame "${typedResult.name}"`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting padding: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Set Axis Align Tool
  server.tool(
    "set_axis_align",
    "Set primary and counter axis alignment for an auto-layout frame in Figma",
    {
      nodeId: z.string().describe("The ID of the frame to modify"),
      primaryAxisAlignItems: z
        .enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
        .optional()
        .describe(
          "Primary axis alignment (MIN/MAX = left/right in horizontal, top/bottom in vertical). Note: When set to SPACE_BETWEEN, itemSpacing will be ignored as children will be evenly spaced."
        ),
      counterAxisAlignItems: z
        .enum(["MIN", "MAX", "CENTER", "BASELINE"])
        .optional()
        .describe(
          "Counter axis alignment (MIN/MAX = top/bottom in horizontal, left/right in vertical)"
        ),
    },
    async ({ nodeId, primaryAxisAlignItems, counterAxisAlignItems }) => {
      try {
        const result = await sendCommandToFigma("set_axis_align", {
          nodeId,
          primaryAxisAlignItems,
          counterAxisAlignItems,
        });
        const typedResult = result as { name: string };

        // Create a message about which alignments were set
        const alignMessages = [];
        if (primaryAxisAlignItems !== undefined)
          alignMessages.push(`primary: ${primaryAxisAlignItems}`);
        if (counterAxisAlignItems !== undefined)
          alignMessages.push(`counter: ${counterAxisAlignItems}`);

        const alignText =
          alignMessages.length > 0
            ? `axis alignment (${alignMessages.join(", ")})`
            : "axis alignment";

        return {
          content: [
            {
              type: "text",
              text: `Set ${alignText} for frame "${typedResult.name}"`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting axis alignment: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Set Layout Sizing Tool
  server.tool(
    "set_layout_sizing",
    "Set horizontal and vertical sizing modes for an auto-layout frame in Figma",
    {
      nodeId: z.string().describe("The ID of the frame to modify"),
      layoutSizingHorizontal: z
        .enum(["FIXED", "HUG", "FILL"])
        .optional()
        .describe(
          "Horizontal sizing mode (HUG for frames/text only, FILL for auto-layout children only)"
        ),
      layoutSizingVertical: z
        .enum(["FIXED", "HUG", "FILL"])
        .optional()
        .describe(
          "Vertical sizing mode (HUG for frames/text only, FILL for auto-layout children only)"
        ),
    },
    async ({ nodeId, layoutSizingHorizontal, layoutSizingVertical }) => {
      try {
        const result = await sendCommandToFigma("set_layout_sizing", {
          nodeId,
          layoutSizingHorizontal,
          layoutSizingVertical,
        });
        const typedResult = result as { name: string };

        // Create a message about which sizing modes were set
        const sizingMessages = [];
        if (layoutSizingHorizontal !== undefined)
          sizingMessages.push(`horizontal: ${layoutSizingHorizontal}`);
        if (layoutSizingVertical !== undefined)
          sizingMessages.push(`vertical: ${layoutSizingVertical}`);

        const sizingText =
          sizingMessages.length > 0
            ? `layout sizing (${sizingMessages.join(", ")})`
            : "layout sizing";

        return {
          content: [
            {
              type: "text",
              text: `Set ${sizingText} for frame "${typedResult.name}"`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting layout sizing: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );

  // Set Item Spacing Tool
  server.tool(
    "set_item_spacing",
    "Set distance between children in an auto-layout frame",
    {
      nodeId: z.string().describe("The ID of the frame to modify"),
      itemSpacing: z
        .number()
        .describe(
          "Distance between children. Note: This value will be ignored if primaryAxisAlignItems is set to SPACE_BETWEEN."
        ),
    },
    async ({ nodeId, itemSpacing }) => {
      try {
        const result = await sendCommandToFigma("set_item_spacing", {
          nodeId,
          itemSpacing,
        });
        const typedResult = result as { name: string };

        return {
          content: [
            {
              type: "text",
              text: `Set item spacing to ${itemSpacing} for frame "${typedResult.name}"`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting item spacing: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
};

export default createNodeToolList;
