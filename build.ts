const script = process.env.npm_lifecycle_script || ''
const isDev = script.includes('--watch')

export const result = await Bun.build({
  entrypoints: ['src/stdio.ts', 'src/http.ts', 'src/cli.ts'],
  outdir: 'dist',
  format: 'esm',
  target: 'node',
  sourcemap: 'linked',
  minify: !isDev,
  env: isDev ? 'inline' : 'disable',
})
