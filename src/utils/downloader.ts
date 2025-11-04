import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import {createLogger} from 'src/utils/logger'
import compatFetch from './fetch'

export interface NodeToCodeFile {
  content: string
  path: string
}

export interface DownloaderOptions {
  localPath?: string
  imgFormat: 'png' | 'jpg' | 'svg'
}

const logger = createLogger('Downloader')

export class Downloader {
  op!: DownloaderOptions
  assetsPath = ''
  savePath = ''
  public setup(o: DownloaderOptions) {
    this.op = o
    if (this.op.localPath) {
      this.assetsPath = path.join(this.op.localPath, 'assets')
      this.savePath = this.op.localPath
    }
  }
  /**
   * 下载远程图片到本地
   * @param url 远程图片URL
   * @param options 下载选项
   * @returns 返回本地相对路径
   */
  private async downloadImage(url: string, fileName: string): Promise<string> {
    const {imgFormat} = this.op
    const localPath = this.assetsPath
    try {
      // 确保目标目录存在
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, {recursive: true})
      }
      const localfileName = `${fileName}.${imgFormat}`
      // 构建本地文件路径
      const localFilePath = path.join(localPath, localfileName)

      // 下载图片
      const response = await compatFetch(url)
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`)
      }

      // 将响应内容转换为Buffer并写入文件
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(localFilePath, new Uint8Array(buffer))

      // 返回相对路径
      return path.join(path.basename(localPath), localfileName).replace(/\\/g, '/')
    } catch (error) {
      logger.error('图片下载错误:', error)
      throw error
    }
  }

  /**
   * 从HTML/JSX内容中提取并下载图片
   * @param content 包含图片URL的内容
   * @param localPath 本地存储路径
   * @returns 替换后的内容
   */
  private async downLoadImageAndReplaceContent(content: string): Promise<string> {
    try {
      // 匹配Figma图片URL的正则表达式
      const imgRegex = /https:\/\/figma-alpha-api\.s3\.us-west-2\.amazonaws\.com\/images\/[a-f0-9-]+/g
      const matches = content.match(imgRegex)

      if (!matches) {
        return content
      }

      // 去重URL
      const uniqueUrls = [...new Set(matches)]

      // 创建下载任务映射
      const downloadTasks = new Map()

      // 并行下载所有图片
      await Promise.all(
        uniqueUrls.map(async remoteUrl => {
          const fileName = path.basename(remoteUrl)
          const localUrl = await this.downloadImage(remoteUrl, fileName)
          downloadTasks.set(remoteUrl, localUrl)
        }),
      )

      // 一次性替换所有URL
      let processedContent = content
      for (const [remoteUrl, localUrl] of downloadTasks.entries()) {
        // 使用全局替换以处理重复的URL
        const regex = new RegExp(remoteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        processedContent = processedContent.replace(regex, localUrl)
      }

      return processedContent
    } catch (error) {
      logger.error('内容处理错误:', error)
      throw error
    }
  }
  /**
   * 从 base64 数据保存图片到本地
   * @param base64Data base64 图片数据（可以包含 data:image/png;base64, 前缀）
   * @param fileName 文件名（包含扩展名）
   * @returns 返回本地相对路径
   */
  private async saveImageFromBase64(base64Data: string, fileName: string): Promise<string> {
    const localPath = this.assetsPath
    try {
      // 确保目标目录存在
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, {recursive: true})
      }

      // 移除 base64 前缀（如果存在）
      const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '')

      // 构建本地文件路径
      const localFilePath = path.join(localPath, fileName)

      // 将 base64 转换为 Buffer 并写入文件
      const buffer = Buffer.from(base64String, 'base64')
      fs.writeFileSync(localFilePath, buffer)

      logger.debug(`Saved base64 image: ${localFilePath}`)

      // 返回相对路径
      return path.join(path.basename(localPath), fileName).replace(/\\/g, '/')
    } catch (error) {
      logger.error('Base64 图片保存错误:', error)
      throw error
    }
  }

  /**
   * 处理包含 base64 图片的文件列表
   * 将 base64 图片保存到本地，并更新代码中的引用路径
   * @param files 文件列表
   */
  public async downLoadImageFromBase64(files: NodeToCodeFile[]) {
    if (!this.op.localPath) return

    // 过滤出图片文件
    const imageFiles = files.filter(f => f.path.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i))

    // 保存所有图片文件
    for (const imageFile of imageFiles) {
      try {
        const fileName = path.basename(imageFile.path)
        await this.saveImageFromBase64(imageFile.content, fileName)
        logger.debug(`Successfully saved image: ${imageFile.path}`)
      } catch (error) {
        logger.error(`Failed to save image ${imageFile.path}:`, error)
      }
    }

    // 保存代码文件
    const codeFiles = files.filter(f => !f.path.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i))

    for (const file of codeFiles) {
      try {
        const savedPath = await this.saveContentToFile(file.content, file.path)
        logger.debug(`Successfully saved: ${savedPath}`)
      } catch (error) {
        logger.error(`Failed to save file ${file.path}:`, error)
      }
    }
  }

  public async checkLocalAndDownload(files: NodeToCodeFile[]) {
    if (!this.op.localPath) return

    await Promise.all(
      files.map(async f => {
        f.content = await this.downLoadImageAndReplaceContent(f.content)
      }),
    )

    for (const file of files) {
      try {
        const savedPath = await this.saveContentToFile(file.content, file.path)
        logger.debug(`Successfully saved: ${savedPath}`)
      } catch (error) {
        logger.error(`Failed to save file ${file.path}:`, error)
      }
    }
  }
  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      logger.debug(`Creating directory: ${dirPath}`)
      await fsp.mkdir(dirPath, {recursive: true})
    }
  }
  async saveContentToFile(content: string, filePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.savePath, filePath)
      const dirPath = path.dirname(fullPath)
      logger.debug(`Full path: ${fullPath}, directory: ${dirPath}`)

      await this.ensureDirectoryExists(dirPath)

      // 为HTML文件添加HTML和body标签
      if (filePath.endsWith('.html')) {
        logger.debug('Wrapping content with HTML template')
        content = this.wrapHtmlContent(content)
      }

      logger.debug(`Writing ${content.length} bytes to file`)
      await fsp.writeFile(fullPath, content)
      logger.info(`File saved: ${fullPath}`)
      return fullPath
    } catch (error) {
      logger.error('File save error:', filePath, error)
      throw error // 文件保存失败仍然抛出异常，因为这是关键操作
    }
  }
  /**
   * 包装HTML内容
   */
  private wrapHtmlContent(content: string): string {
    logger.debug('Wrapping content with HTML template')
    return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>F2C Generated</title>
  </head>
  <body>
  ${content}
  </body>
  </html>`
  }
}

export default new Downloader()
