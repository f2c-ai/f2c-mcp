// Replace console.log with proper JSON-RPC notification format
// Unified JSON-RPC message sending method
export function sendRpcMessage(
  type: 'notification' | 'error',
  options: {
    method?: string
    id?: string | number | null
    code?: number
    message: string
    params?: any
  },
) {
  const base = {
    jsonrpc: '2.0',
    ...(type === 'notification'
      ? {
          method: options.method || 'log',
          params: options.params || {message: options.message},
        }
      : {
          id: options.id || null,
          error: {
            code: options.code || -32000,
            message: options.message,
          },
        }),
  }
  console.log(JSON.stringify(base))
}
