import staticPlugin from '@elysiajs/static'
import {Elysia} from 'elysia'
import {createLogger} from 'src/utils/logger'
import config from './config'
import {codeLogPrint, registerCodeConfig, registerCodeMCP, registerCodeWS} from './server/code'

const logger = createLogger('http')

const app = new Elysia().use(
  staticPlugin({
    assets: 'public',
    prefix: '/',
  }),
)

// 首页路由
app.get('/', async () => {
  const file = Bun.file('public/index.html')
  return new Response(await file.text(), {
    headers: {'Content-Type': 'text/html'},
  })
})

registerCodeWS(app)
registerCodeMCP(app)
registerCodeConfig(app)

// 启动服务器
app.listen(config.port, async () => {
  codeLogPrint()
})
