// Figma API 查询参数类型定义
// 基于 https://www.figma.com/developers/api

// 获取文件接口参数
export interface GetFileParams {
  // 可选参数：指定要返回的版本
  version?: string
  // 可选参数：指定要返回的节点深度
  depth?: number
  // 可选参数：指定是否包含几何路径数据
  geometry?: 'paths'
  // 可选参数：指定要返回的插件数据
  plugin_data?: string
  // 可选参数：指定要返回的分支
  branch_data?: boolean
}

// 获取文件节点接口参数
export interface GetFileNodesParams {
  // 要获取的节点ID列表，以逗号分隔
  ids: string
  // 可选参数：指定要返回的版本
  version?: string
  // 可选参数：指定要返回的节点深度
  depth?: number
  // 可选参数：指定是否包含几何路径数据
  geometry?: 'paths'
  // 可选参数：指定要返回的插件数据
  plugin_data?: string
}

// 获取图片接口参数
export interface GetImagesParams {
  // 要获取图片的节点ID列表，以逗号分隔
  ids: string
  // 可选参数：指定图片的缩放比例
  scale?: number
  // 可选参数：指定图片的格式
  format?: 'jpg' | 'png' | 'svg' | 'pdf'
  // 可选参数：指定SVG是否包含ID
  svg_include_id?: boolean
  // 可选参数：指定SVG是否简化描边
  svg_simplify_stroke?: boolean
  // 可选参数：指定是否使用绝对边界
  use_absolute_bounds?: boolean
  // 可选参数：指定要返回的版本
  version?: string
}

// 获取图片填充接口参数
export interface GetImageFillsParams {
  // 文件的唯一标识符
  key: string
}

// 获取评论接口参数
export interface GetCommentsParams {
  // 文件的唯一标识符
  key: string
}

// 发布评论接口参数
export interface PostCommentParams {
  // 文件的唯一标识符
  key: string
  // 评论内容
  message: string
  // 可选参数：评论的客户端元数据
  client_meta?: {
    // 节点ID
    node_id?: string
    // 节点偏移量
    node_offset?: {
      x: number
      y: number
    }
  }
  // 可选参数：父评论ID
  comment_id?: string
}

// 删除评论接口参数
export interface DeleteCommentParams {
  // 文件的唯一标识符
  key: string
  // 评论ID
  comment_id: string
}

// 获取用户接口参数
export interface GetUserParams {
  // 用户ID
  id: string
}

// 获取版本历史接口参数
export interface GetVersionsParams {
  // 文件的唯一标识符
  key: string
}

// 获取项目接口参数
export interface GetProjectsParams {
  // 团队ID
  team_id: string
}

// 获取项目文件接口参数
export interface GetProjectFilesParams {
  // 项目ID
  project_id: string
  // 可选参数：分页的起始位置
  cursor?: string
}

// 获取团队项目接口参数
export interface GetTeamProjectsParams {
  // 团队ID
  team_id: string
}

// 获取团队组件接口参数
export interface GetTeamComponentsParams {
  // 团队ID
  team_id: string
  // 可选参数：分页的起始位置
  cursor?: string
  // 可选参数：每页返回的数量
  page_size?: number
}

// 获取文件组件接口参数
export interface GetFileComponentsParams {
  // 文件的唯一标识符
  key: string
}

// 获取组件接口参数
export interface GetComponentParams {
  // 组件的唯一标识符
  key: string
}

// 获取团队组件集接口参数
export interface GetTeamComponentSetsParams {
  // 团队ID
  team_id: string
  // 可选参数：分页的起始位置
  cursor?: string
  // 可选参数：每页返回的数量
  page_size?: number
}

// 获取文件组件集接口参数
export interface GetFileComponentSetsParams {
  // 文件的唯一标识符
  key: string
}

// 获取组件集接口参数
export interface GetComponentSetParams {
  // 组件集的唯一标识符
  key: string
}

// 获取团队样式接口参数
export interface GetTeamStylesParams {
  // 团队ID
  team_id: string
  // 可选参数：分页的起始位置
  cursor?: string
  // 可选参数：每页返回的数量
  page_size?: number
}

// 获取文件样式接口参数
export interface GetFileStylesParams {
  // 文件的唯一标识符
  key: string
}

// 获取样式接口参数
export interface GetStyleParams {
  // 样式的唯一标识符
  key: string
}

// 获取文件分支接口参数
export interface GetFileBranchesParams {
  // 文件的唯一标识符
  key: string
}

// 获取分支接口参数
export interface GetBranchParams {
  // 文件的唯一标识符
  key: string
  // 分支的唯一标识符
  branch_id: string
}

// 获取文件变量接口参数
export interface GetFileVariablesParams {
  // 文件的唯一标识符
  key: string
}

// 获取本地变量接口参数
export interface GetLocalVariablesParams {
  // 文件的唯一标识符
  key: string
  // 节点ID
  node_id: string
}
export interface NodeToCodeWithF2C {
  personal_token: string
  format: 'html'
  nodeIds: string
  fileKey: string
}
