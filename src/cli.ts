#!/usr/bin/env node

import {sendRpcMessage} from '@/helper/logger'
import {server} from '@/server/figma'
import {startServer} from 'src/transports/stdio'
startServer(server).catch(error => {
  sendRpcMessage('error', {
    message: `Server startup failed: ${error.message}`,
    code: -32000,
  })
  process.exit(1)
})
