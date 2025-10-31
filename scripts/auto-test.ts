#!/usr/bin/env bun

import {spawn} from 'bun'
import {existsSync} from 'fs'

// 为进程输出添加前缀的辅助函数
function createPrefixedLogger(prefix: string, color = '') {
  return (data: any) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((line: string) => line.trim())
    lines.forEach((line: string) => {
      console.log(`${color}[${prefix}]${color ? '\x1b[0m' : ''} ${line}`)
    })
  }
}

console.log('🚀 启动自动化测试流程')
console.log('='.repeat(50))

const PORT = 3001
const MCP_URL = `http://localhost:${PORT}/mcp`
const SOCKET_URL = `ws://localhost:${PORT}/ws`

let serverProcess: any = null
let businessProcess: any = null

// 清理函数
function cleanup() {
  console.log('\n🧹 清理进程...')
  if (serverProcess) {
    serverProcess.kill()
    console.log('✅ 服务器进程已终止')
  }
  if (businessProcess) {
    businessProcess.kill()
    console.log('✅ 业务处理进程已终止')
  }
}

// 监听退出信号
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url, {method: 'POST'})
      return true
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  return false
}

async function main() {
  try {
    // 1. 启动服务器
    console.log('🔧 启动 MCP + WebSocket 服务器...')
    serverProcess = spawn(['bun', 'run', 'src/http.ts'], {
      env: {...process.env, PORT: PORT.toString()},
      stdio: ['ignore', 'inherit', 'inherit'],
    })

    // 等待服务器启动
    console.log('⏳ 等待服务器启动...')
    const serverReady = await waitForServer(MCP_URL)
    if (!serverReady) {
      throw new Error('服务器启动超时')
    }
    console.log('✅ 服务器已启动')

    // 2. 启动业务处理客户端
    console.log('🔧 启动业务处理客户端...')
    businessProcess = spawn(['bun', 'run', 'scripts/start-business-processor.ts'], {
      env: {...process.env, HONO_WS_URL: SOCKET_URL},
      stdio: ['ignore', 'inherit', 'inherit'],
    })

    // 等待业务处理客户端启动
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('✅ 业务处理客户端已启动')

    // 3. 运行测试
    console.log('🧪 运行集成测试...')
    const testProcess = spawn(['bun', 'test', 'tests/integration-full.test.ts'], {
      env: {
        ...process.env,
        MCP_URL,
        HONO_WS_URL: SOCKET_URL,
      },
      stdio: ['inherit', 'inherit', 'inherit'],
    })

    const testResult = await testProcess.exited

    if (testResult === 0) {
      console.log('\n🎉 所有测试通过！')
    } else {
      console.log('\n❌ 测试失败')
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 自动化测试失败:', error)
    process.exit(1)
  } finally {
    cleanup()
  }
}

main()
