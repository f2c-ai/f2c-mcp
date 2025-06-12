export interface NodeToCodeWithF2C {
  personal_token: string
  format: string
  nodeIds: string
  fileKey: string
}
export interface NodeToCodeWithF2COptions {
  personalToken?: string
  localPath?: string
  format: string
  ids: string
  fileKey: string
  imgFormat: 'png' | 'jpg' | 'svg'
  scaleSize: number
}

export interface NodeToCodeAllFiles {
  files: NodeToCodeFile[]
  images: {
    [key: string]: {id: string; name: string; fileExt: 'png' | 'jpg' | 'svg'; nodeType: string}
  }
}
export interface NodeToCodeFile {
  content: string
  path: string
}
