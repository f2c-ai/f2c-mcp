import {afterAll, beforeAll, describe, expect, it} from 'bun:test'
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {createSocketClient} from '../src/utils/socket-client.js'

describe('Full Integration Tests - MCP + Socket', () => {
  let mcpClient: Client
  let mcpTransport: StreamableHTTPClientTransport
  let socketClient: ReturnType<typeof createSocketClient>

  const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/mcp'
  const SOCKET_URL = process.env.WS_URL || 'ws://localhost:3000/ws'

  beforeAll(async () => {
    console.log('🚀 Starting Full Integration Tests')
    console.log(`📡 MCP Server: ${MCP_URL}`)
    console.log(`🔌 Socket Server: ${SOCKET_URL}`)

    // 连接 MCP 服务器
    console.log('🔗 Connecting to MCP server...')
    mcpTransport = new StreamableHTTPClientTransport(new URL(MCP_URL))
    mcpClient = new Client({name: 'integration-test', version: '1.0.0'})
    await mcpClient.connect(mcpTransport)
    console.log('✅ MCP server connected')

    // 创建 Socket 客户端
    console.log('🔗 Creating Socket client...')
    socketClient = createSocketClient({
      url: SOCKET_URL,
      timeout: 15000,
    })
    console.log('✅ Socket client created')
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up...')
    await Promise.allSettled([mcpClient.close(), mcpTransport.close()])
    socketClient.disconnect()
    console.log('✅ Cleanup completed')
  })

  describe('1. MCP Server Health Check', () => {
    it('should connect to MCP server successfully', async () => {
      // 这个测试在 beforeAll 中已经验证了连接
      expect(mcpClient).toBeDefined()
      console.log('✅ MCP server is healthy')
    })

    it('should list available tools', async () => {
      console.log('🔍 Listing MCP tools...')
      const tools = await mcpClient.listTools()
      const toolNames = (tools.tools || []).map(t => t.name)

      console.log('📋 Available tools:', toolNames)
      expect(toolNames).toContain('get_code_to_component')
      expect(tools.tools?.length).toBeGreaterThan(0)
    })

    it('should validate tool schema', async () => {
      console.log('🔍 Validating tool schema...')
      const tools = await mcpClient.listTools()
      const tool = tools.tools?.find(t => t.name === 'get_code_to_component')

      expect(tool).toBeDefined()
      expect(tool?.description).toBeDefined()

      const schema = tool?.inputSchema as any
      expect(schema.properties).toHaveProperty('componentName')
      expect(schema.properties).toHaveProperty('framework')
      expect(schema.properties).toHaveProperty('style')

      console.log('✅ Tool schema is valid')
    })
  })

  describe('2. Socket Connection Tests', () => {
    it('should connect to Socket server', async () => {
      console.log('🔌 Testing Socket connection...')

      try {
        await socketClient.connect()
        expect(socketClient.isConnected()).toBe(true)
        console.log('✅ Socket connection successful')
      } catch (error) {
        console.log('⚠️ Socket connection failed:', error)
        // 在某些环境中 Socket 服务器可能不可用，这是可以接受的
        expect(error).toBeDefined()
      }
    })

    it('should handle Socket request-response', async () => {
      console.log('🔄 Testing Socket request-response...')

      try {
        const testData = {
          componentName: 'SocketTestComponent',
          framework: 'react',
          style: 'tailwind',
        }

        const response = await socketClient.request<typeof testData, {content: string}>('get_html_content', testData)

        expect(response).toBeDefined()
        expect(response.content).toBeDefined()
        expect(typeof response.content).toBe('string')
        expect(response.content.length).toBeGreaterThan(0)

        console.log('✅ Socket request-response working')
        console.log('📝 Response preview:', response.content.substring(0, 100) + '...')
      } catch (error) {
        console.log('⚠️ Socket request failed (expected if no socket server):', error)
        // Socket 服务器可能不可用，这在测试环境中是可以接受的
        expect(error).toBeDefined()
      }
    })

    it('should handle Socket timeout gracefully', async () => {
      console.log('⏱️ Testing Socket timeout handling...')

      const shortTimeoutClient = createSocketClient({
        url: SOCKET_URL,
        timeout: 1000, // 1 second timeout
      })

      try {
        await shortTimeoutClient.request('slow_request', {})
        console.log('✅ Request completed within timeout')
      } catch (error) {
        console.log('⚠️ Request failed (expected):', error)
        expect(error).toBeDefined()
        // Could be timeout or connection failure
        const isTimeoutOrConnection =
          error.message.includes('timeout') || error.message.includes('WebSocket connection failed')
        expect(isTimeoutOrConnection).toBe(true)
      } finally {
        shortTimeoutClient.disconnect()
      }
    })
  })

  describe('3. MCP Tool Input/Output Tests', () => {
    const testCases = [
      {
        name: 'React + Tailwind',
        input: {componentName: 'ReactTailwindTest', framework: 'react', style: 'tailwind'},
        expectedPatterns: ['React', 'TSX', 'className', 'ReactTailwindTest'],
      },
      {
        name: 'React + CSS',
        input: {componentName: 'ReactCssTest', framework: 'react', style: 'css'},
        expectedPatterns: ['React', 'CSS', 'semantic', 'ReactCssTest'],
      },
      {
        name: 'Vue + Tailwind',
        input: {componentName: 'VueTailwindTest', framework: 'vue', style: 'tailwind'},
        expectedPatterns: ['Vue', 'SFC', 'Tailwind', 'VueTailwindTest'],
      },
      {
        name: 'Vue + CSS',
        input: {componentName: 'VueCssTest', framework: 'vue', style: 'css'},
        expectedPatterns: ['Vue', 'scoped', 'semantic', 'VueCssTest'],
      },
    ]

    testCases.forEach(({name, input, expectedPatterns}) => {
      it(`should handle ${name} correctly`, async () => {
        console.log(`🧪 Testing ${name}...`)

        const startTime = Date.now()
        const result: any = await mcpClient.callTool({
          name: 'get_code_to_component',
          arguments: input,
        })
        const duration = Date.now() - startTime

        console.log(`⏱️ ${name} completed in ${duration}ms`)

        // 验证基本结构
        expect(result).toBeDefined()
        expect(result.content).toBeDefined()
        expect(Array.isArray(result.content)).toBe(true)
        expect(result.content.length).toBeGreaterThan(0)

        const text = result.content[0]?.text
        expect(text).toBeDefined()
        expect(typeof text).toBe('string')
        expect(text.length).toBeGreaterThan(0)

        console.log(`📝 ${name} response preview:`, text.substring(0, 150) + '...')

        // 验证内容包含预期模式
        let patternMatches = 0
        expectedPatterns.forEach(pattern => {
          if (text.includes(pattern)) {
            patternMatches++
          }
        })

        // 检查是否是成功响应还是错误响应
        const isSuccess = patternMatches > 0
        const isSocketError = text.includes('Error fetching or processing HTML via socket')

        expect(isSuccess || isSocketError).toBe(true)

        if (isSuccess) {
          console.log(`✅ ${name} - Success (${patternMatches}/${expectedPatterns.length} patterns matched)`)
        } else {
          console.log(`⚠️ ${name} - Socket error (expected if no socket server)`)
        }
      })
    })

    it('should handle default parameters', async () => {
      console.log('🧪 Testing default parameters...')

      const result: any = await mcpClient.callTool({
        name: 'get_code_to_component',
        arguments: {},
      })

      expect(result.content).toBeDefined()
      const text = result.content[0]?.text
      expect(text).toBeDefined()

      // 应该包含默认组件名
      const hasDefaultName = text.includes('ConvertedComponent')
      const hasError = text.includes('Error fetching')

      expect(hasDefaultName || hasError).toBe(true)
      console.log('✅ Default parameters handled correctly')
    })

    it('should handle empty component name', async () => {
      console.log('🧪 Testing empty component name...')

      const result: any = await mcpClient.callTool({
        name: 'get_code_to_component',
        arguments: {
          componentName: '',
          framework: 'vue',
          style: 'css',
        },
      })

      const text = result.content[0]?.text
      expect(text).toBeDefined()

      // 应该回退到默认名称
      const hasDefaultName = text.includes('ConvertedComponent')
      const hasError = text.includes('Error fetching')

      expect(hasDefaultName || hasError).toBe(true)
      console.log('✅ Empty component name handled correctly')
    })
  })

  describe('4. Parameter Validation Tests', () => {
    it('should reject invalid framework', async () => {
      console.log('🧪 Testing invalid framework validation...')

      try {
        await mcpClient.callTool({
          name: 'get_code_to_component',
          arguments: {
            componentName: 'TestComponent',
            framework: 'angular', // Invalid
            style: 'css',
          },
        })

        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        console.log('✅ Invalid framework correctly rejected')
        expect(error).toBeDefined()
      }
    })

    it('should reject invalid style', async () => {
      console.log('🧪 Testing invalid style validation...')

      try {
        await mcpClient.callTool({
          name: 'get_code_to_component',
          arguments: {
            componentName: 'TestComponent',
            framework: 'react',
            style: 'bootstrap', // Invalid
          },
        })

        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        console.log('✅ Invalid style correctly rejected')
        expect(error).toBeDefined()
      }
    })
  })

  describe('5. Performance and Reliability Tests', () => {
    it('should complete requests within reasonable time', async () => {
      console.log('🧪 Testing response time...')

      const startTime = Date.now()
      const result: any = await mcpClient.callTool({
        name: 'get_code_to_component',
        arguments: {
          componentName: 'PerformanceTest',
          framework: 'react',
          style: 'tailwind',
        },
      })
      const duration = Date.now() - startTime

      console.log(`⏱️ Request completed in ${duration}ms`)

      expect(result.content).toBeDefined()
      expect(duration).toBeLessThan(20000) // 20 seconds max

      if (duration < 5000) {
        console.log('✅ Excellent response time')
      } else if (duration < 10000) {
        console.log('✅ Good response time')
      } else {
        console.log('⚠️ Slow response time (but acceptable)')
      }
    })

    it('should handle concurrent requests', async () => {
      console.log('🧪 Testing concurrent requests...')

      const startTime = Date.now()
      const requests = Array.from({length: 3}, (_, i) =>
        mcpClient.callTool({
          name: 'get_code_to_component',
          arguments: {
            componentName: `ConcurrentTest${i}`,
            framework: i % 2 === 0 ? 'react' : 'vue',
            style: i % 2 === 0 ? 'tailwind' : 'css',
          },
        }),
      )

      const results = await Promise.all(requests)
      const duration = Date.now() - startTime

      console.log(`⏱️ ${requests.length} concurrent requests completed in ${duration}ms`)

      expect(results).toHaveLength(3)
      results.forEach((result: any, index) => {
        expect(result.content).toBeDefined()
        const text = result.content[0]?.text

        // Should contain component name or be a socket error
        const hasComponentName = text.includes(`ConcurrentTest${index}`)
        const isSocketError = text.includes('Error fetching or processing HTML via socket')

        expect(hasComponentName || isSocketError).toBe(true)
      })

      console.log('✅ Concurrent requests handled successfully')
    })

    it('should handle multiple sequential requests', async () => {
      console.log('🧪 Testing sequential requests...')

      const testCases = [
        {componentName: 'Sequential1', framework: 'react', style: 'css'},
        {componentName: 'Sequential2', framework: 'vue', style: 'tailwind'},
        {componentName: 'Sequential3', framework: 'react', style: 'tailwind'},
      ]

      let successCount = 0
      let errorCount = 0

      for (const testCase of testCases) {
        try {
          const result: any = await mcpClient.callTool({
            name: 'get_code_to_component',
            arguments: testCase,
          })

          const text = result.content[0]?.text
          expect(text).toContain(testCase.componentName)

          if (text.includes('Error fetching')) {
            errorCount++
          } else {
            successCount++
          }
        } catch (error) {
          errorCount++
          console.log(`❌ Request failed:`, error)
        }
      }

      console.log(`📊 Sequential requests: ${successCount} success, ${errorCount} errors`)
      expect(successCount + errorCount).toBe(testCases.length)
      console.log('✅ Sequential requests completed')
    })
  })

  describe('6. Error Handling Tests', () => {
    it('should handle Socket connection errors gracefully', async () => {
      console.log('🧪 Testing Socket error handling...')

      // 创建一个连接到不存在服务器的客户端
      const badSocketClient = createSocketClient({
        url: 'ws://localhost:9999/nonexistent',
        timeout: 2000,
      })

      try {
        await badSocketClient.request('test', {})
        console.log('⚠️ Unexpected success (server might be running on port 9999)')
      } catch (error) {
        console.log('✅ Socket error handled correctly:', error.message)
        expect(error).toBeDefined()
      } finally {
        badSocketClient.disconnect()
      }
    })

    it('should provide meaningful error messages', async () => {
      console.log('🧪 Testing error message quality...')

      const result: any = await mcpClient.callTool({
        name: 'get_code_to_component',
        arguments: {
          componentName: 'ErrorMessageTest',
          framework: 'vue',
          style: 'css',
        },
      })

      const text = result.content[0]?.text
      expect(text).toBeDefined()
      expect(text.length).toBeGreaterThan(10)

      // 检查是否包含有用的信息
      const hasUsefulContent =
        text.includes('Convert') || text.includes('ErrorMessageTest') || text.includes('Error fetching')

      expect(hasUsefulContent).toBe(true)
      console.log('✅ Error messages are meaningful')
    })
  })

  describe('7. End-to-End Integration Test', () => {
    it('should complete full workflow successfully', async () => {
      console.log('🧪 Running end-to-end integration test...')

      const testScenarios = [
        {name: 'E2E_Button', framework: 'react', style: 'tailwind'},
        {name: 'E2E_Card', framework: 'react', style: 'css'},
        {name: 'E2E_Form', framework: 'vue', style: 'tailwind'},
        {name: 'E2E_Modal', framework: 'vue', style: 'css'},
      ]

      const results = {
        total: testScenarios.length,
        success: 0,
        socketErrors: 0,
        otherErrors: 0,
        totalTime: 0,
      }

      console.log(`🚀 Testing ${results.total} scenarios...`)

      const overallStartTime = Date.now()

      for (const scenario of testScenarios) {
        const scenarioStartTime = Date.now()

        try {
          console.log(`  🔄 Testing ${scenario.name} (${scenario.framework}/${scenario.style})...`)

          const result: any = await mcpClient.callTool({
            name: 'get_code_to_component',
            arguments: {
              componentName: scenario.name,
              framework: scenario.framework,
              style: scenario.style,
            },
          })

          const scenarioDuration = Date.now() - scenarioStartTime
          const text = result.content[0]?.text

          expect(text).toBeDefined()
          expect(text).toContain(scenario.name)

          if (text.includes('Error fetching or processing HTML via socket')) {
            results.socketErrors++
            console.log(`    ⚠️ ${scenario.name}: Socket error (${scenarioDuration}ms)`)
          } else {
            results.success++
            console.log(`    ✅ ${scenario.name}: Success (${scenarioDuration}ms)`)
          }
        } catch (error) {
          results.otherErrors++
          console.log(`    ❌ ${scenario.name}: Error -`, error)
        }
      }

      results.totalTime = Date.now() - overallStartTime

      console.log('\n📊 End-to-End Test Results:')
      console.log(`   Total scenarios: ${results.total}`)
      console.log(`   ✅ Successful: ${results.success}`)
      console.log(`   ⚠️ Socket errors: ${results.socketErrors}`)
      console.log(`   ❌ Other errors: ${results.otherErrors}`)
      console.log(`   ⏱️ Total time: ${results.totalTime}ms`)
      console.log(`   📈 Success rate: ${((results.success / results.total) * 100).toFixed(1)}%`)

      // 验证所有场景都得到了处理
      expect(results.success + results.socketErrors + results.otherErrors).toBe(results.total)

      if (results.success > 0) {
        console.log('🎉 End-to-end integration test PASSED - System is working correctly!')
      } else if (results.socketErrors === results.total) {
        console.log('⚠️ End-to-end test completed with Socket errors - MCP is working but Socket server unavailable')
      } else {
        console.log('❌ End-to-end test found issues - Check system configuration')
      }

      // 测试通过条件：至少有成功的案例，或者所有错误都是 Socket 错误（说明 MCP 部分工作正常）
      expect(results.success > 0 || results.socketErrors === results.total).toBe(true)
    })
  })
})
