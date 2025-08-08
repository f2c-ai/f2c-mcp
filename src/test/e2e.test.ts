import {describe, expect, it} from 'bun:test'
import f2cApi from '@/server/figma/apis/f2c'
import api from '@/server/figma/apis/figma'
import {createLogger} from '@/utils/logger'
import config from 'src/server/figma/config'

const logger = createLogger('E2ETest')

// 测试常量
const fileKey = 'DkzGbKo09kf2w1ytMPALxd'
const ids = '293-1752'
const personalToken = config.personalToken

describe('Figma API 端到端测试', () => {
  // 设置较长的超时时间，因为实际网络请求可能需要更多时间
  const timeout = 30000

  describe('f2cNodeToCode 端到端测试', () => {
    it('应该能够从真实 Figma API 获取节点代码', async () => {
      // 跳过测试如果没有设置个人令牌
      if (!personalToken) {
        logger.info('跳过测试：未设置 FIGMA_API_KEY 环境变量')
        return
      }

      try {
        // 发起真实的 API 请求
        const result = await f2cApi.nodeToCode({
          fileKey,
          ids,
          format: 'html',
          personalToken,
          imgFormat: 'png',
          scaleSize: 0,
        })

        // 验证返回结果
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')

        // 验证返回的 HTML 包含基本结构
        expect(result).toContain('<')
        expect(result).toContain('>')

        // 记录结果以便手动检查
        // logger.info('API 返回结果预览（前100字符）:', result.substring(0, 100))
      } catch (error) {
        logger.error('API 请求失败:', error)
        throw error
      }
    })
  })

  describe('files 端到端测试', () => {
    it('应该能够从真实 Figma API 获取文件节点数据', async () => {
      // 跳过测试如果没有设置个人令牌
      if (!personalToken) {
        logger.info('跳过测试：未设置 FIGMA_API_KEY 环境变量')
        return
      }

      try {
        // 发起真实的 API 请求
        const result = await api.files({
          fileKey,
          ids,
          personalToken,
        })

        // 验证返回结果
        expect(result).toBeDefined()
        expect(result).toHaveProperty('nodes')

        // 验证返回的节点数据包含请求的节点ID
        const nodeIds = Object.keys(result.nodes || {})
        expect(nodeIds.length).toBeGreaterThan(0)

        // 记录结果以便手动检查
        logger.info('文件节点数据:', nodeIds)
      } catch (error) {
        logger.error('API 请求失败:', error)
        throw error
      }
    })
  })

  describe('meta 端到端测试', () => {
    it('应该能够从真实 Figma API 获取文件元数据', async () => {
      // 跳过测试如果没有设置个人令牌
      if (!personalToken) {
        logger.info('跳过测试：未设置 FIGMA_API_KEY 环境变量')
        return
      }

      try {
        // 发起真实的 API 请求
        const result = await api.meta({
          fileKey,
          personalToken,
        })
        // console.log('result', result)
        // 验证返回结果
        expect(result).toBeDefined()
        expect(result).toHaveProperty('file')
        // expect(result).toHaveProperty('lastModified')

        // 记录结果以便手动检查
        logger.info('文件元数据:', JSON.stringify(result.file))
      } catch (error) {
        logger.error('API 请求失败:', error)
        throw error
      }
    })
  })
})
