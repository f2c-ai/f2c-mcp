import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {DEFAULT_PERSONAL_TOKEN, serverName, serverVersion} from 'src/server/figma/config'
import {parseFigmaUrl} from 'src/server/figma/helper'
import {z} from 'zod'
import api from './api'

export const server = new McpServer(
  {
    name: serverName,
    version: serverVersion,
  },
  {
    capabilities: {
      logging: {},
    },
  },
)

// Register Figma to HTML conversion tool
server.tool(
  'figma_to_html',
  'Convert Figma design to HTML code using F2C',
  {
    figmaUrl: z.string().describe('Figma design URL containing fileKey and nodeId'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
  },
  async ({figmaUrl, personalToken}): Promise<CallToolResult> => {
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN

    try {
      const {fileKey, nodeId} = parseFigmaUrl(figmaUrl)
      if (!fileKey) {
        console.error('Error: fileKey cannot be empty')
        throw new Error('fileKey cannot be empty')
      }
      const data = await api.nodes2Code({
        personal_token: personalToken,
        nodeIds: nodeId,
        fileKey: fileKey,
        format: 'html',
      })

      return {
        content: [{type: 'text', text: data}],
      }
    } catch (error: any) {
      console.error('Tool execution error:', error)
      return {
        content: [{type: 'text', text: `Error: ${error.message}`}],
      }
    }
  },
)

// Get Figma file information
server.tool(
  'figma_get_file',
  'Get detailed information about a Figma file',
  {
    fileKey: z.string().describe('Unique identifier of the Figma file'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
    version: z.string().optional().describe('Specify the version to return'),
    depth: z.number().optional().describe('Specify the depth of nodes to return'),
    geometry: z.enum(['paths']).optional().describe('Specify whether to include geometry path data'),
    plugin_data: z.string().optional().describe('Specify plugin data to return'),
    branch_data: z.boolean().optional().describe('Specify whether to return branch data'),
  },
  async ({fileKey, personalToken, ...op}): Promise<CallToolResult> => {
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN

    try {
      if (!fileKey) {
        throw new Error('fileKey cannot be empty')
      }

      const data = await api.files(fileKey, personalToken, op)

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
    nodeIds: z.string().describe('Node IDs to get images for, comma separated'),
    format: z.enum(['jpg', 'png', 'svg', 'pdf']).optional().describe('Image format, e.g., png, jpg, svg'),
    scale: z.number().optional().describe('Image scale factor'),
    svg_include_id: z.boolean().optional().describe('Whether SVG includes ID'),
    svg_simplify_stroke: z.boolean().optional().describe('Whether to simplify SVG strokes'),
    use_absolute_bounds: z.boolean().optional().describe('Whether to use absolute bounds'),
    version: z.string().optional().describe('Specify the version to return'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
  },
  async ({fileKey, nodeIds, personalToken, ...op}): Promise<CallToolResult> => {
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN

    try {
      if (!fileKey || !nodeIds) {
        throw new Error('fileKey and nodeIds cannot be empty')
      }

      const data = await api.images(fileKey, personalToken, {...op, ids: nodeIds})

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

// Returns download links for all images present in image fills
server.tool(
  'figma_get_image_fills',
  'Get all image resources in the specified Figma file',
  {
    fileKey: z.string().describe('Unique identifier of the Figma file'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
  },
  async ({fileKey, personalToken}): Promise<CallToolResult> => {
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN

    try {
      if (!fileKey) {
        throw new Error('fileKey cannot be empty')
      }

      const data = await api.imageFills(fileKey, personalToken)

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

// Get Figma file metadata
server.tool(
  'figma_get_file_meta',
  'Get metadata information for a Figma file',
  {
    fileKey: z.string().describe('Unique identifier of the Figma file'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
  },
  async ({fileKey, personalToken}): Promise<CallToolResult> => {
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN

    try {
      if (!fileKey) {
        throw new Error('fileKey cannot be empty')
      }

      const data = await api.meta(fileKey, personalToken)

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
