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
  