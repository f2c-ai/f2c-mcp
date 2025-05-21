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

export interface NodeToCodeWithF2CResult {
  files: {
    content: string
    path: string
  }[]
  images: {
    [key: string]: {id: string; name: string; format: 'png' | 'jpg' | 'svg'}
  }
}
