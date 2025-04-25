export interface FigmaLinkInfo {
  fileKey: string
  nodeId: string
}

export function parseFigmaLink(url: string): FigmaLinkInfo {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    const [, fileKey] = path.match(/file\/([^/]+)/) || []
    const [, nodeId] = path.match(/node-id=([^&]+)/) || []

    if (!fileKey) {
      throw new Error('无效的 Figma 链接：未找到 fileKey')
    }

    return {
      fileKey,
      nodeId: nodeId || '',
    }
  } catch (error) {
    throw new Error('无效的 Figma 链接')
  }
}
