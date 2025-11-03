import {describe, expect, test} from 'bun:test'
import {generatePromptText} from '../src/tool/code-convert/prompt'

const sourceHtml = '<div class="flex items-center p-4">Hello</div>'
const name = 'SimComponent'

describe('generatePromptText', () => {
  test('react tailwind prompt contains base, tailwind, name and source', () => {
    const text = generatePromptText('html-to-react-tailwind', name, sourceHtml)
    expect(text).toContain('You are a precise code converter.')
    expect(text).toContain('Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX).')
    expect(text).toContain('Component name: SimComponent')
    expect(text).toContain('Source:')
    expect(text).toContain(sourceHtml)
    // Tailwind 保留提示
    expect(text).toContain('Preserve Tailwind utility classes')
  })

  test('react css prompt contains base, css guidance, name and source', () => {
    const text = generatePromptText('html-to-react-css', name, sourceHtml)
    expect(text).toContain('You are a precise code converter.')
    expect(text).toContain('using semantic CSS (no Tailwind)')
    expect(text).toContain('Component name: SimComponent')
    expect(text).toContain('Source:')
    expect(text).toContain(sourceHtml)
    // CSS Modules 提示包含组件名替换
    expect(text).toContain(`import styles from './${name}.module.css'`)
  })

  test('vue tailwind prompt contains base, tailwind guidance, name hint and source', () => {
    const text = generatePromptText('html-to-vue-tailwind', name, sourceHtml)
    expect(text).toContain('You are a precise code converter.')
    expect(text).toContain('Vue 3 single-file component (SFC)')
    expect(text).toContain('Source:')
    expect(text).toContain(sourceHtml)
    // 基础要求包含组件名提示
    expect(text).toContain(`filename may be ${name}.vue`)
    // Tailwind 保留提示
    expect(text).toContain('keeps Tailwind utilities')
  })

  test('vue css prompt contains base, css guidance and source', () => {
    const text = generatePromptText('html-to-vue-css', name, sourceHtml)
    expect(text).toContain('You are a precise code converter.')
    expect(text).toContain('Vue 3 single-file component (SFC) with semantic CSS')
    expect(text).toContain('Source:')
    expect(text).toContain(sourceHtml)
    // CSS 提示存在（scoped 样式说明）
    expect(text).toContain('<style scoped>')
  })
})
