export interface GetFileParams {
  fileKey: string
  ids?: string
  version?: string
  depth?: number
  geometry?: 'paths'
  plugin_data?: string
  branch_data?: boolean
  personalToken?: string
}

export interface GetImagesParams {
  fileKey: string
  ids: string
  scale?: number
  format?: 'jpg' | 'png' | 'svg' | 'pdf'
  svg_include_id?: boolean
  svg_simplify_stroke?: boolean
  use_absolute_bounds?: boolean
  version?: string
  personalToken?: string
}

export interface GetKeyParams {
  fileKey: string
  personalToken?: string
}

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
