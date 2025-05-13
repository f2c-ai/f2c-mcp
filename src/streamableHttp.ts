import {startServer} from 'src/transports/without-session-steamable-http'
import {server} from'src/server/figma'
console.log(server)
startServer(server,3000)
