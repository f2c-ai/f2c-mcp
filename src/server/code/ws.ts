import {Elysia} from 'elysia'
import {createLogger, LogLevel} from 'src/utils/logger'
import {mcpClients} from '@/client/mcp-client'

export type EventType = 'figma-gen-code' | 'figma-selection' | 'mcp-request-code' | 'pong'
export type MessageType = {
  type: EventType
  data: any
  requestId: string
  timestamp: number
}

// 心跳配置（可根据需求调整）
const HEARTBEAT_INTERVAL = 10000 // 10秒发送一次心跳

const logger = createLogger('code-ws', LogLevel.DEBUG)
const users = new Map<string, any>()
const userLastActive = new Map<string, string>()
const getAccessToken = (uid: string) => {
  if (uid.startsWith('mcp')) {
    return uid.replace('mcp_', '')
  } else if (uid.startsWith('figma')) {
    const m = /^figma_(.+?)_device_\d+$/.exec(uid)
    return m ? m[1] : uid
  }
  return uid
}
/**
 * figma客户端链接规范、后面为区分多端链接的标识
 * figma_${accessToken}_device_${Date.now()}
 * mcp客户端链接规范
 * mcp_${accessToken}
 */
export const registerCodeWS = (app: Elysia) => {
  app.ws('/code/:uid', {
    open: ws => {
      const uid = ws.data.params.uid
      const accessToken = getAccessToken(uid)
      // const origin = ws.data.request.headers.get('origin')
      // const from = uid.startsWith('mcp') ? 'mcp' : origin?.includes('figma.com') ? 'figma' : 'web'
      const from = uid.startsWith('mcp') ? 'mcp' : 'figma'
      ws.data.store = {uid, accessToken, from}
      // 当mcp客户端连接时 关闭已有的MCP连接
      if (from === 'mcp' && users.has(uid)) {
        const mcpWs = users.get(uid)
        mcpWs.close()
        return
      }
      users.set(uid, ws)
      logger.info('[客户端连接]', ws.data.store)

      // 1. 定时发送心跳包（ping）
      const heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send({type: 'ping'}) // 发送心跳标识
          // console.log('向客户端发送心跳:', ws.id)
        }
      }, HEARTBEAT_INTERVAL)

      ;(ws as any).heartbeatTimer = heartbeatTimer
      ;(ws as any).lastPongTime = Date.now()
    },

    message: (ws, message: MessageType) => {
      const msg = message
      const uid = ws.data.params.uid
      if (msg.type === 'pong') {
        // 更新最后一次 pong 时间（表示客户端在线）
        ;(ws as any).lastPongTime = Date.now()
        // console.log('收到客户端心跳响应:', ws.id)
        return
      }
      logger.debug('[收到消息]', message)
      if (!uid) {
        return
      }
      const accessToken = getAccessToken(uid)
      //
      if (msg.type === 'figma-selection') {
        userLastActive.set(accessToken, uid)
        logger.info(`${uid}:选择节点`, msg.data)
      } else if (msg.type === 'mcp-request-code') {
        const received = userLastActive.get(accessToken)
        if (!received) {
          return
        }
        const useWS = users.get(received)
        if (useWS) {
          useWS.send(msg)
        }
      } else if (msg.type === 'figma-gen-code') {
        // 当figma客户端生成代码时 发送给mcp客户端
        const mcpWs = users.get(`mcp_${accessToken}`)
        if (mcpWs) {
          mcpWs.send(msg)
        }
      }
    },

    close: ws => {
      const uid = ws.data.params.uid
      const accessToken = getAccessToken(uid)
      console.log('客户端断开连接:', ws.id)
      clearInterval((ws as any).heartbeatTimer)
      clearInterval((ws as any).timeoutTimer)
      if (uid) {
        users.delete(uid)
        userLastActive.delete(accessToken)
        // 当figma客户端退出时 关闭mcp客户端连接
        mcpClients.get(`mcp_${accessToken}`).disconnect()
        console.log(`User ${uid} disconnected`)
      }
    },
  })
}
