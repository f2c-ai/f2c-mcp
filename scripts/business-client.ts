import {createSocketClient} from '../src/utils/socket-client.js'

/**
 * 业务处理客户端示例
 * 这个客户端专门处理 HTML 内容生成业务
 */
class BusinessProcessorClient {
  private ws: WebSocket | null = null
  private clientId: string | null = null
  private url: string

  constructor(url: string) {
    this.url = url
  }

  private setupMessageHandlers() {
    if (!this.ws) return

    this.ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data)

        // 处理连接建立
        if (message.type === 'connection_established') {
          this.clientId = message.clientId
          console.log(`✅ 业务处理客户端已获得ID: ${this.clientId}`)
          this.registerAsProcessor()
          return
        }

        // 处理广播的业务请求
        if (message.broadcast && message.type === 'business_request') {
          console.log(`📡 [业务处理器] 收到MCP客户端请求: ${message.originalType} [${message.sender}]`)
          console.log(`📄 请求内容: ${JSON.stringify(message.data)}`)
          this.handleBusinessRequest(message)
        }
      } catch (error) {
        console.error('💥 消息处理错误:', error)
      }
    }
  }

  async start() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('🔌 业务处理客户端已连接到消息中继服务器')
          this.setupMessageHandlers()
          resolve()
        }

        this.ws.onerror = () => {
          reject(new Error('WebSocket connection failed'))
        }

        this.ws.onclose = () => {
          console.log('🔌 业务处理客户端连接已关闭')
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private registerAsProcessor() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const message = {
      type: 'register_client',
      clientType: 'business_processor',
      processorType: 'html_generator',
      capabilities: ['get_html_content'],
      timestamp: Date.now(),
    }

    this.ws.send(JSON.stringify(message))
    console.log('📢 已注册为 HTML 生成处理器')
  }

  private async handleBusinessRequest(request: any) {
    // 检查是否是我们能处理的请求类型
    if (request.originalType !== 'get_html_content') {
      console.log(`⏭️ 跳过不支持的请求类型: ${request.originalType}`)
      return
    }

    console.log(`🔨 处理 HTML 生成请求: ${request.data?.componentName || 'Unknown'}`)

    try {
      // 处理业务逻辑
      const result = await this.handleHtmlRequest(request)

      // 广播响应结果
      const response = {
        type: 'business_response',
        originalRequestId: request.originalRequestId,
        originalType: request.originalType,
        success: true,
        data: result.data,
        processorId: this.clientId,
        timestamp: Date.now(),
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(response))
        console.log(`✅ [业务处理器] 已广播处理结果: ${request.originalRequestId}`)

        // 安全地显示响应内容预览
        const contentPreview = JSON.stringify(result.data)
          .replace(/\n/g, '\\n') // 转义换行符
          .replace(/\r/g, '\\r') // 转义回车符
          .substring(0, 100)
        console.log(`📄 响应内容预览: ${contentPreview}...`)
      }
    } catch (error) {
      console.error('❌ 业务处理失败:', error)

      // 广播错误响应
      const errorResponse = {
        type: 'business_response',
        originalRequestId: request.originalRequestId,
        originalType: request.originalType,
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
        processorId: this.clientId,
        timestamp: Date.now(),
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(errorResponse))
      }
    }
  }

  // 处理 HTML 生成请求
  private async handleHtmlRequest(request: any) {
    const {componentName, framework, style} = request.data

    console.log(`🔨 处理 HTML 生成请求: ${componentName} (${framework}/${style})`)

    // 生成 HTML 内容
    const htmlContent = this.generateHtml(componentName, framework, style)

    // 发送响应回原始请求者
    const response = {
      type: request.type,
      requestId: request.requestId,
      success: true,
      data: {content: htmlContent},
      timestamp: Date.now(),
      target: request.sender, // 回复给原始发送者
    }

    return response
  }

  private generateHtml(componentName: string, framework: string, style: string): string {
    // 实际的业务逻辑
    if (style === 'tailwind') {
      return `
<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold text-blue-600">${componentName}</h1>
  <p class="text-gray-600 mt-2">Generated for ${framework} with Tailwind</p>
  <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
    Click me
  </button>
</div>`
    } else {
      return `
<div class="container">
  <h1 class="title">${componentName}</h1>
  <p class="description">Generated for ${framework} with CSS</p>
  <button class="btn">Click me</button>
</div>

<style>
.container { max-width: 800px; margin: 0 auto; padding: 24px; }
.title { font-size: 24px; font-weight: bold; color: #2563eb; }
.description { color: #6b7280; margin-top: 8px; }
.btn { background: #2563eb; color: white; padding: 8px 16px; border: none; border-radius: 4px; margin-top: 16px; cursor: pointer; }
.btn:hover { background: #1d4ed8; }
</style>`
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    console.log('🔌 业务处理客户端已断开连接')
  }
}

// 使用示例
export async function startBusinessProcessor() {
  const processor = new BusinessProcessorClient(process.env.HONO_WS_URL || 'ws://localhost:3001/ws')

  await processor.start()

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭业务处理客户端...')
    processor.disconnect()
    process.exit(0)
  })

  return processor
}

// 如果直接运行此文件
if (import.meta.main) {
  startBusinessProcessor()
}
