import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {z} from 'zod'
import api from '@/server/figma/apis/figma'

export const registerFigmaServer = (server: McpServer) => {
  // Get Figma file information
  server.tool(
    'figma_get_file_data',
    'Get detailed information about a Figma file',
    {
      fileKey: z.string().describe('Unique identifier of the Figma file'),
      ids: z.string().describe('List of node IDs to retrieve, comma separated'),
      personalToken: z
        .string()
        .optional()
        .describe('Your Figma personal access token, The parameters are not required when the tool is called.'),
      version: z.string().optional().describe('Specify the version to return'),
      depth: z.number().optional().describe('Specify the depth of nodes to return'),
      geometry: z.enum(['paths']).optional().describe('Specify whether to include geometry path data'),
      plugin_data: z.string().optional().describe('Specify plugin data to return'),
      branch_data: z.boolean().optional().describe('Specify whether to return branch data'),
    },
    async (o): Promise<CallToolResult> => {
      try {
        const data = await api.files(o)
        return {
          content: [{type: 'text', text: JSON.stringify(data)}],
        }
      } catch (error: any) {
        return {
          content: [{type: 'text', text: `Error: ${error.message}`}],
        }
      }
    },
  )

  // Get Figma node images
  server.tool(
    'figma_get_images',
    'Get images of Figma nodes',
    {
      fileKey: z.string().describe('Unique identifier of the Figma file'),
      ids: z.string().describe('Node IDs to get images for, comma separated'),
      format: z.enum(['jpg', 'png', 'svg', 'pdf']).optional().describe('Image format, e.g., png, jpg, svg'),
      scale: z.number().optional().describe('Image scale factor'),
      svg_include_id: z.boolean().optional().describe('Whether SVG includes ID'),
      svg_simplify_stroke: z.boolean().optional().describe('Whether to simplify SVG strokes'),
      use_absolute_bounds: z.boolean().optional().describe('Whether to use absolute bounds'),
      version: z.string().optional().describe('Specify the version to return'),
      personalToken: z
        .string()
        .optional()
        .describe('Your Figma personal access token, The parameters are not required when the tool is called.'),
    },
    async (o): Promise<CallToolResult> => {
      try {
        const data = await api.images(o)

        return {
          content: [{type: 'text', text: JSON.stringify(data)}],
        }
      } catch (error: any) {
        return {
          content: [{type: 'text', text: `Error: ${error.message}`}],
        }
      }
    },
  )

  // // Returns download links for all images present in image fills
  // server.tool(
  //   'figma_get_image_fills',
  //   'Get all image resources in the specified Figma file',
  //   {
  //     fileKey: z.string().describe('Unique identifier of the Figma file'),
  //     personalToken: z.string().optional().describe('Your Figma personal access token'),
  //   },
  //   async (o): Promise<CallToolResult> => {
  //     try {
  //       const data = await api.imageFills(o)

  //       return {
  //         content: [{type: 'text', text: JSON.stringify(data)}],
  //       }
  //     } catch (error: any) {
  //       return {
  //         content: [{type: 'text', text: `Error: ${error.message}`}],
  //       }
  //     }
  //   },
  // )

  // // Get Figma file metadata
  // server.tool(
  //   'figma_get_file_meta',
  //   'Get metadata information for a Figma file',
  //   {
  //     fileKey: z.string().describe('Unique identifier of the Figma file'),
  //     personalToken: z.string().optional().describe('Your Figma personal access token'),
  //   },
  //   async (o): Promise<CallToolResult> => {
  //     try {
  //       const data = await api.meta(o)
  //       return {
  //         content: [{type: 'text', text: JSON.stringify(data)}],
  //       }
  //     } catch (error: any) {
  //       return {
  //         content: [{type: 'text', text: `Error: ${error.message}`}],
  //       }
  //     }
  //   },
  // )
}
