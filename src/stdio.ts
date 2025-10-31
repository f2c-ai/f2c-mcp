import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {server} from 'src/tool'

const transport = new StdioServerTransport()
server.connect(transport)
