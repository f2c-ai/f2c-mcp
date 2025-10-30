#!/usr/bin/env node

import {server} from 'src/server'
import {startServer} from 'src/transports/stdio'

startServer(server)
