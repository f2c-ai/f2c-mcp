#!/usr/bin/env node

import {sendRpcMessage} from '@/helper'
import {startServer} from 'src/transports/stdio'
import {server} from'@/server/figma'
startServer(server).catch(error => {
  sendRpcMessage('error', {
    message: `Server startup failed: ${error.message}`,
    code: -32000,
  })
  process.exit(1)
})
