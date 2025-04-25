#!/usr/bin/env node

import {sendRpcMessage} from './logger'
import {startServer} from './server'

startServer().catch(error => {
  sendRpcMessage('error', {
    message: `Server startup failed: ${error.message}`,
    code: -32000,
  })
  process.exit(1)
})
