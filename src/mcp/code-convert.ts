import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {z} from 'zod'
import {createLogger, LogLevel} from '@/utils/logger'

export const mcpServer = new McpServer({
  name: 'f2c-mcp',
  version: '2.0.0',
})

mcpServer.tool(
  'html_to_component',
  'Convert HTML/TailwindCSS snippet into a React component',
  {
    source: z.string().describe('HTML + TailwindCSS code to convert'),
    componentName: z.string().optional().describe('Name of the generated React component'),
    framework: z.enum(['react', 'vue']).default('react').describe('Target framework: react or vue'),
    style: z
      .enum(['css', 'tailwind'])
      .default('css')
      .describe('Styling mode: convert Tailwind to CSS (scoped/module) or keep Tailwind'),
  },
  async ({source, componentName, framework, style}) => {
    const name = componentName || 'ConvertedComponent'
    const fw = framework || 'react'
    const sm = style || 'css'

    const reactPrompt = `You are a precise code converter.
Convert the following HTML + TailwindCSS snippet into a clean React functional component (TSX).

Requirements:
- Output valid TSX only, no explanations.
- Preserve Tailwind classes under 'className'.
- Rename attributes: 'class'→'className', 'for'→'htmlFor', 'tabindex'→'tabIndex'.
- Map HTML DOM events to React camelCase: 'onclick'→'onClick', 'oninput'→'onInput', 'onchange'→'onChange', 'onsubmit'→'onSubmit', 'onfocus'→'onFocus', 'onblur'→'onBlur'.
- Convert inline 'style="..."' to a React style object: 'style={{...}}'.
- Keep semantics and structure; do not add business logic.

Component name: ${name}

Source:
${source}`

    const reactPromptCss = `You are a precise code converter.
Convert the following HTML + TailwindCSS snippet into a clean React functional component (TSX) using semantic CSS (no Tailwind).

Requirements:
- Output valid TSX only, no explanations.
- Replace Tailwind utility classes with semantic class names and reference a CSS Module: import styles from './${name}.module.css'.
- Apply classes via 'className={styles.className}'.
- Rename attributes: 'class'→'className', 'for'→'htmlFor', 'tabindex'→'tabIndex'.
- Map HTML DOM events to React camelCase: 'onclick'→'onClick', 'oninput'→'onInput', 'onchange'→'onChange', 'onsubmit'→'onSubmit', 'onfocus'→'onFocus', 'onblur'→'onBlur'.
- Convert inline 'style="..."' to a React style object only when dynamic; prefer moving static styles into the CSS Module.
- Keep semantics and structure; do not add business logic.

Component name: ${name}

Source:
${source}`

    const vuePrompt = `You are a precise code converter.
Convert the following HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC).

Requirements:
- Output only the .vue code in a single block, no explanations.
 - Use <template>, <script setup lang="ts">, and <style scoped> (leave script empty if no logic).
 - Do not use Tailwind utility classes. Replace them with semantic class names and equivalent CSS rules inside <style scoped>.
- Map HTML DOM events to Vue listeners using '@event': 'onclick'→'@click', 'oninput'→'@input', 'onchange'→'@change', 'onsubmit'→'@submit', 'onfocus'→'@focus', 'onblur'→'@blur'.
 - Prefer moving static inline styles into <style scoped>; keep dynamic expressions with ':style="{...}"'.
- Keep semantics and structure; do not add business logic.
- Component name hint: ${name} (filename may be ${name}.vue).

Source:
${source}`

    const vuePromptTailwind = `You are a precise code converter.
Convert the following HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC).

Requirements:
- Output only the .vue code in a single block, no explanations.
- Use <template> and <script setup lang="ts"> (leave script empty if no logic).
- Keep Tailwind classes under 'class' (do not rename to className).
- Map HTML DOM events to Vue listeners using '@event': 'onclick'→'@click', 'oninput'→'@input', 'onchange'→'@change', 'onsubmit'→'@submit', 'onfocus'→'@focus', 'onblur'→'@blur'.
- Convert inline 'style="..."' to Vue bound style object ':style="{...}"'.
- Keep semantics and structure; do not add business logic.
- Component name hint: ${name} (filename may be ${name}.vue).

Source:
${source}`

    const prompt =
      fw === 'vue'
        ? sm === 'css'
          ? vuePrompt
          : vuePromptTailwind
        : sm === 'css'
        ? reactPromptCss
        : reactPrompt
    return {
      content: [{type: 'text', text: prompt}],
    }
  },
)
