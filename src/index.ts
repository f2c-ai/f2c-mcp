import {sendRpcMessage} from './helper/logger'
import {startServer} from './server/stdio'

startServer().catch(error => {
  sendRpcMessage('error', {
    message: `Server startup failed: ${error.message}`,
    code: -32000,
  })
  process.exit(1)
})
