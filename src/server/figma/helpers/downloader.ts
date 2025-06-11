import fs from 'fs'
import path from 'path'
import {createLogger} from 'src/utils/logger'

const logger = createLogger('Downloader')

export interface DownloadOptions {
  localPath: string
  fileName: string
}

export interface FileData {
  content: string
  path: string
}

export class Downloader {
  private imgFormat = 'png'

  /**
   * 设置图片格式
   */
  setImgFormat(format: string): void {
    this.imgFormat = format
  }

  /**
   * 确保目录存在
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {recursive: true})
    }
  }

  /**
   * 下载远程图片到本地
   * @param url 远程图片URL
   * @param options 下载选项
   * @returns 返回本地相对路径
   */
  async downloadImage(url: string, options: DownloadOptions): Promise<string> {
    try {
      this.ensureDirectoryExists(options.localPath)

      const localfileName = `${options.fileName}.${this.imgFormat}`
      const localFilePath = path.join(options.localPath, localfileName)

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      fs.writeFileSync(localFilePath, new Uint8Array(buffer))

      return path.join(path.basename(options.localPath), localfileName).replace(/\\/g, '/')
    } catch (error) {
      logger.error('Image download error:', error)
      throw error
    }
  }

  /**
   * 从HTML/JSX内容中提取并下载图片
   * @param content 包含图片URL的内容
   * @param localPath 本地存储路径
   * @returns 修改后的内容
   */
  async processContent(content: string, localPath: string): Promise<string> {
    const imagesPath = path.join(localPath, 'images')

    try {
      // 匹配Figma图片URL的正则表达式
      const imgRegex = /https:\/\/figma-alpha-api\.s3\.us-west-2\.amazonaws\.com\/images\/[a-f0-9-]+/g
      const matches = content.match(imgRegex)

      if (!matches) {
        return content
      }

      // 去重URL
      const uniqueUrls = [...new Set(matches)]
      const downloadTasks = new Map()

      // 并行下载所有图片
      await Promise.all(
        uniqueUrls.map(async remoteUrl => {
          const fileName = path.basename(remoteUrl)
          const localUrl = await this.downloadImage(remoteUrl, {
            localPath: imagesPath,
            fileName,
          })
          downloadTasks.set(remoteUrl, localUrl)
        }),
      )

      // 一次性替换所有URL
      return uniqueUrls.reduce((processedContent, remoteUrl) => {
        const localUrl = downloadTasks.get(remoteUrl)
        const regex = new RegExp(remoteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        return processedContent.replace(regex, localUrl)
      }, content)
    } catch (error) {
      logger.error('Content processing error:', error)
      throw error
    }
  }

  /**
   * 保存内容到文件
   * @param content 文件内容
   * @param basePath 基础路径
   * @param filePath 文件相对路径
   * @returns 完整文件路径
   */
  async saveContentToFile(content: string, basePath: string, filePath: string): Promise<string> {
    try {
      const fullPath = path.join(basePath, filePath)
      const dirPath = path.dirname(fullPath)

      this.ensureDirectoryExists(dirPath)

      // 为HTML文件添加HTML和body标签
      if (filePath.endsWith('.html')) {
        content = this.wrapHtmlContent(content)
      }

      fs.writeFileSync(fullPath, content)
      logger.info(`File saved: ${fullPath}`)
      return fullPath
    } catch (error) {
      logger.error('File save error:', error)
      throw error
    }
  }

  /**
   * 包装HTML内容
   */
  private wrapHtmlContent(content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated HTML</title>
</head>
<body>
${content}
</body>
</html>`
  }

  /**
   * 处理并保存多个文件
   * @param files 文件数组，每个包含内容和路径
   * @param basePath 基础路径
   * @returns 保存的文件路径数组
   */
  async processAndSaveFiles(files: FileData[], basePath: string): Promise<string[]> {
    try {
      return await Promise.all(files.map(file => this.saveContentToFile(file.content, basePath, file.path)))
    } catch (error) {
      logger.error('Batch file processing error:', error)
      throw error
    }
  }

  /**
   * 处理文件内容，提取并下载图片
   * @param files 文件数组
   * @param basePath 基础路径
   * @returns 处理后的文件数组
   */
  private async processFileContents(files: FileData[], basePath: string): Promise<FileData[]> {
    return Promise.all(
      files.map(async file => ({
        ...file,
        content: await this.processContent(file.content, basePath),
      })),
    )
  }

  /**
   * 处理图片并保存所有文件
   * @param files 文件数组，每个包含内容和路径
   * @param basePath 基础路径
   * @param imgFormat 图片格式
   * @returns 保存的文件路径数组
   */
  async downloadAndSaveFiles(files: FileData[], basePath: string, imgFormat?: string): Promise<string[]> {
    try {
      if (imgFormat) {
        this.setImgFormat(imgFormat)
      }

      // 处理每个文件中的图片
      const processedFiles = await this.processFileContents(files, basePath)

      // 保存处理后的文件
      return this.processAndSaveFiles(processedFiles, basePath)
    } catch (error) {
      logger.error('Image processing and file saving error:', error)
      throw error
    }
  }
}

export default new Downloader()
