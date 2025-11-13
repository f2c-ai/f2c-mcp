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
  let html = await file.text()
  const json = JSON.stringify({mcpWsUrl: config.mcpWsUrl, codeWsUrl: config.codeWsUrl, httpUrl: config.httpUrl})
  const inject = `<script type="application/json" id="server-config">${json}</script>`
  html = html.includes('</head>') ? html.replace('</head>', `${inject}\n</head>`) : `${inject}\n${html}`
  return new Response(html, {
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
