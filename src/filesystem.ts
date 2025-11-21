#!/usr/bin/env node
import {server} from 'src/filesystem/tool'
import {startServer} from 'src/server/common/stdio'

startServer(server)
