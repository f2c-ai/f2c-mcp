export interface NodeToCodeWithF2C {
  personal_token: string
  format: string
  nodeIds: string
  fileKey: string
}
export interface NodeToCodeWithF2COptions {
  personalToken?: string
  format: string
  ids: string
  fileKey: string
}

export interface NodeToCodeAllFiles {
  files: NodeToCodeFiles[]
  images: {
    [key: string]: {id: string; name: string; fileExt: 'png' | 'jpg' | 'svg'; nodeType: string}
  }
}
export interface NodeToCodeFiles {
  content: string
  path: string
}
