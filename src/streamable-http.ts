import {server} from 'src/server'
import {startServer} from '@/transports/streamable-http'

startServer(server, 3000)
