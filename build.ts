import {watch} from 'node:fs'
import {exists, rm} from 'node:fs/promises'

async function cleanDist() {
  const distPath = './dist'

  try {
    if (await exists(distPath)) {
      await rm(distPath, {recursive: true, force: true})
      console.log('🗑️  Cleaned dist directory')
    }
  } catch (error) {
    console.error('Failed to clean dist:', error)
  }
}

const script = process.env.npm_lifecycle_script || ''
const isDev = script.includes('--watch')

export const build = async () => {
  await cleanDist()
  const result = await Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    format: 'esm',
    target: 'node',
    sourcemap: 'linked',
    minify: !isDev,
    env: isDev ? 'inline' : 'disable',
  })
  if (!result.success) {
    console.error('❌ Build failed')
    result.logs.forEach(log => console.error(log))
    return false
  }

  console.log('✅ Build successful!')
  console.log(`📦 Generated ${result.outputs.length} files`)
  return true
}

if (isDev) {
  console.log('🚀 Watching for changes...')
  let debounceTimer: any = null
  let isBuilding = false
  const debounceMs = Number(process.env.WATCH_DEBOUNCE_MS || 200)
  watch('./src', {recursive: true}, async (_eventType, filename) => {
    if (!filename) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (isBuilding) return
      isBuilding = true
      try {
        console.log(`\n📝 File changed: ${filename}`)
        await build()
      } finally {
        isBuilding = false
      }
    }, debounceMs)
  })
}

await build()
