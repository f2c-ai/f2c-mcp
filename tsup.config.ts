import dotenv from 'dotenv'
import {defineConfig} from 'tsup'
import pkg from './package.json'
// 加载.env文件
const envConfig: any = {}
export default defineConfig(({watch}) => {
  const isDev = !!watch
  if (isDev) dotenv.config({processEnv: envConfig})
  return {
    entry: ['src/stdio.ts', 'src/cli.ts', 'src/streamableHttp.ts'],
    format: ['esm', 'cjs'],
    splitting: false,
    sourcemap: isDev,
    minify: !isDev,
    clean: true,
    dts: true,
    shims: true,
    env: {
      FIGMA_API_KEY: envConfig.FIGMA_API_KEY || '',
      FIGMA_VERSION: pkg.version,
    },
  }
})
