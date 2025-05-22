import fs from 'fs'
import path from 'path'

export interface DownloadOptions {
  localPath: string
  fileName: string
}

export class Downloader {
  imgFormat = 'png'
  setImgFormat(format: string) {
    this.imgFormat = format
  }
  /**
   * 下载远程图片到本地
   * @param url 远程图片URL
   * @param options 下载选项
   * @returns 返回本地相对路径
   */
  async downloadImage(url: string, options: DownloadOptions): Promise<string> {
    try {
      // 确保目标目录存在
      if (!fs.existsSync(options.localPath)) {
        fs.mkdirSync(options.localPath, {recursive: true})
      }
      const localfileName = `${options.fileName}.${this.imgFormat}`
      // 构建本地文件路径
      const localFilePath = path.join(options.localPath, localfileName)

      // 下载图片
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`)
      }

      // 将响应内容转换为Buffer并写入文件
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(localFilePath, new Uint8Array(buffer))

      // 返回相对路径
      return path.join(path.basename(options.localPath), localfileName).replace(/\\/g, '/')
    } catch (error) {
      console.error('图片下载错误:', error)
      throw error
    }
  }

  /**
   * 从HTML/JSX内容中提取并下载图片
   * @param content 包含图片URL的内容
   * @param localPath 本地存储路径
   * @returns 替换后的内容
   */
  async processContent(content: string, localPath: string): Promise<string> {
    localPath = path.join(localPath, 'images')
    try {
      // 匹配Figma图片URL的正则表达式
      const imgRegex = /https:\/\/figma-alpha-api\.s3\.us-west-2\.amazonaws\.com\/images\/[a-f0-9-]+/g
      const matches = content.match(imgRegex)

      if (!matches) {
        return content
      }

      let processedContent = content
      for (const remoteUrl of matches) {
        const fileName = path.basename(remoteUrl)
        const localUrl = await this.downloadImage(remoteUrl, {
          localPath,
          fileName,
        })

        // 替换内容中的远程URL为本地路径
        processedContent = processedContent.replace(remoteUrl, localUrl)
      }

      return processedContent
    } catch (error) {
      console.error('内容处理错误:', error)
      throw error
    }
  }
}

export default new Downloader()
