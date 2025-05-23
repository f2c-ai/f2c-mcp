await Bun.build({
  entrypoints: ['src/stdio.ts', 'src/cli.ts', 'src/streamable-http.ts'],
  outdir: 'build',
  format: 'cjs',
  target: 'node',
  sourcemap: 'linked',
  minify: true,
})
//
export {}
