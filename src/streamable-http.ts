import {startServer} from '@/transports/streamable-http'
import {server} from 'src/server/figma'
startServer(server, 3000)
