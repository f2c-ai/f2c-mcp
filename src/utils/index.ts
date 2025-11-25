export const getCliParam = (names: string[]): string | undefined => {
  // console.log('process.argv', process.argv)
  const argv = Array.isArray(process.argv) ? process.argv.slice(2) : []
  for (const name of names) {
    for (let i = 0; i < argv.length; i++) {
      const token = argv[i]
      if (typeof token === 'string' && token.startsWith(`--${name}=`)) {
        const v = token.slice(name.length + 3)
        if (v) return v
      }
      if (token === `--${name}` && i + 1 < argv.length) {
        const v = argv[i + 1]
        if (v && !v.startsWith('--')) return v
      }
    }
  }
  return undefined
}
