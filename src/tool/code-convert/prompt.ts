import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'

const COMMON_REQUIREMENTS = {
  react: {
    base: `- 仅返回有效的 TSX 代码；不要添加任何解释。
- 属性重命名：'class'→'className'，'for'→'htmlFor'，'tabindex'→'tabIndex'。
- 将 HTML DOM 事件映射为 React 驼峰事件：'onclick'→'onClick'，'oninput'→'onInput'，'onchange'→'onChange'，'onsubmit'→'onSubmit'，'onfocus'→'onFocus'，'onblur'→'onBlur'。
- 保持语义与结构；不得添加任何业务逻辑。
- 图片引用：非 public 目录的静态资源用 require() 引用，例如 <img src={require('assets/image.png')} />。`,
    tailwind: `- Tailwind 工具类保留在 'className'。
- 将内联 'style="..."' 转为 React 样式对象：'style={{...}}'。`,
    css: `- 用语义化类名替换 Tailwind 工具类，并通过 CSS Module 引用：import styles from './{{componentName}}.module.css'。
- 通过 'className={styles.className}' 应用类名。
- 仅在动态情况下将内联 'style="..."' 转为 React 样式对象；静态样式优先移入 CSS Module。`,
  },
  vue: {
    base: `- 仅输出单个 .vue 代码块；不要添加任何解释。
- 保持语义与结构；不得添加任何业务逻辑。
- 组件命名提示：{{componentName}}（文件名可能为 {{componentName}}.vue）。`,
    tailwind: `- 使用 <template> 与 <script setup lang="ts">（无逻辑时脚本保持为空）。
- Tailwind 工具类保留在 'class'（不要改为 className）。
- 将 HTML DOM 事件映射为 Vue 监听器（'@event'）：'onclick'→'@click'，'oninput'→'@input'，'onchange'→'@change'，'onsubmit'→'@submit'，'onfocus'→'@focus'，'onblur'→'@blur'。
- 将内联 'style="..."' 转为 Vue 绑定样式对象 ':style="{...}"'。`,
    css: `- 使用 <template>、<script setup lang="ts"> 与 <style scoped>（无逻辑时脚本保持为空）。
- 不使用 Tailwind 工具类。改为语义化类名，并在 <style scoped> 中编写等效 CSS 规则。
- 将 HTML DOM 事件映射为 Vue 监听器（'@event'）：'onclick'→'@click'，'oninput'→'@input'，'onchange'→'@change'，'onsubmit'→'@submit'，'onfocus'→'@focus'，'onblur'→'@blur'。
- 静态内联样式优先移入 <style scoped>；动态表达保留为 ':style="{...}"'。`,
  },
}

export const registerCodeConvertPrompts = (mcpServer: McpServer) => {}

// Helper function to generate prompt text based on framework and style
export function generatePromptText(
  promptName: string,
  componentName: string,
  source: string,
  assets?: string[],
): string {
  const basePrompt =
    '你是一个精确的代码转换器。以还原度为最高优先：保持原始视觉输出与结构不变。将组件名标准化为英文 PascalCase；把非英文名称（如中文）翻译为简洁的英文标识符。'

  const assetListSection = assets && assets.length > 0 ? `\n\n资产:\n${assets.join('\n')}` : ''

  switch (promptName) {
    case 'html-to-react-tailwind':
      return `${basePrompt}
将提供的 HTML + TailwindCSS 代码片段转换为 React 函数组件（TSX）。

要求:
${COMMON_REQUIREMENTS.react.base}
${COMMON_REQUIREMENTS.react.tailwind}

组件名: ${componentName}

源码:
${source}${assetListSection}`

    case 'html-to-react-css':
      return `${basePrompt}
将提供的 HTML + TailwindCSS 代码片段转换为使用语义化 CSS（不使用 Tailwind）的 React 函数组件（TSX）。

要求:
${COMMON_REQUIREMENTS.react.base}
${COMMON_REQUIREMENTS.react.css.replace(/\{\{componentName\}\}/g, componentName)}

组件名: ${componentName}

源码:
${source}${assetListSection}`

    case 'html-to-vue-tailwind':
      return `${basePrompt}
将提供的 HTML + TailwindCSS 代码片段转换为保留 Tailwind 工具类的 Vue 3 单文件组件（SFC）。

要求:
${COMMON_REQUIREMENTS.vue.base.replace(/\{\{componentName\}\}/g, componentName)}
${COMMON_REQUIREMENTS.vue.tailwind}

源码:
${source}${assetListSection}`

    case 'html-to-vue-css':
      return `${basePrompt}
将提供的 HTML + TailwindCSS 代码片段转换为使用语义化 CSS 的 Vue 3 单文件组件（SFC）。

要求:
${COMMON_REQUIREMENTS.vue.base.replace(/\{\{componentName\}\}/g, componentName)}
${COMMON_REQUIREMENTS.vue.css}

源码:
${source}${assetListSection}`

    case 'html-to-html-tailwind':
      return `必须原样返回以下源码，不做任何操作。

规则:
- 仅输出下方源码文本；不得添加或删除任何字符；输出必须与源码逐字符一致。

源码:
${source}`

    default:
      return `${basePrompt}
将提供的 HTML + TailwindCSS 代码片段转换为使用语义化 CSS 的 React 函数组件（TSX）。

组件名: ${componentName}

源码:
${source}${assetListSection}`
  }
}
