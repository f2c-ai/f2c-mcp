// Enhanced Figma URL parser supporting multiple formats
export function parseFigmaUrl(url: string) {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname

    // Support both file/xxx and design/xxx formats
    const [, fileKey] = path.match(/(?:file|design)\/([^/]+)/) || []

    // Support node-id parameter and hash format
    const nodeIdMatch =
      urlObj.searchParams.get('node-id') || url.match(/node-id=([^&]+)/) || url.match(/#([^:]+:[^:]+)/)

    const nodeId = nodeIdMatch ? (Array.isArray(nodeIdMatch) ? nodeIdMatch[1] : nodeIdMatch) : ''

    if (!fileKey) {
      throw new Error('Invalid Figma link: fileKey not found')
    }

    return {
      fileKey,
      nodeId: nodeId || '',
    }
  } catch (error) {
    throw new Error('Invalid Figma link')
  }
}

// Replace console.log with proper JSON-RPC notification format
// Unified JSON-RPC message sending method
export function sendRpcMessage(
  type: 'notification' | 'error',
  options: {
    method?: string
    id?: string | number | null
    code?: number
    message: string
    params?: any
  },
) {
  const base = {
    jsonrpc: '2.0',
    ...(type === 'notification'
      ? {
          method: options.method || 'log',
          params: options.params || {message: options.message},
        }
      : {
          id: options.id || null,
          error: {
            code: options.code || -32000,
            message: options.message,
          },
        }),
  }
  console.log(JSON.stringify(base))
}
