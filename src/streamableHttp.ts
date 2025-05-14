import {server} from 'src/server/figma'
import {startServer} from 'src/transports/without-session-steamable-http'
startServer(server, 3000)
