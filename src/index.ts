import {sendRpcMessage} from 'src/helper/logger'
import {startServer} from 'src/transports/stdio'
import {server} from 'src/server/figma'
startServer(server).catch(error => {
  sendRpcMessage('error', {
    message: `Server startup failed: ${error.message}`,
    code: -32000,
  })
  process.exit(1)
})
