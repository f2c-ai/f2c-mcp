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

// 验证项目名称的函数
export function isValidProjectName(name: string): { isValid: boolean; message?: string } { 
  if (!name) { 
    return { isValid: false, message: '项目名称不能为空' }; 
  } 

  if (name.length > 214) { 
    return { isValid: false, message: '项目名称不能超过214个字符' }; 
  } 

  if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) { 
    return { 
      isValid: false, 
      message: '项目名称只能包含小写字母、数字、-、.、~，如果使用 scope 则需要以 @ 开头' 
    }; 
  } 

  if (name.toLowerCase() === 'node_modules' || name.toLowerCase() === 'favicon.ico') { 
    return { isValid: false, message: '不能使用保留名称作为项目名' }; 
  } 

  return { isValid: true }; 
}
