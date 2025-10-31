#!/usr/bin/env bun

import {startBusinessProcessor} from './business-client.js'

console.log('🚀 启动业务处理客户端...')

try {
  await startBusinessProcessor()
  console.log('✅ 业务处理客户端启动成功')
} catch (error) {
  console.error('❌ 启动失败:', error)
  process.exit(1)
}
