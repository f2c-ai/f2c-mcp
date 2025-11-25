import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {z} from 'zod'

const COMMON_REQUIREMENTS = {
  react: {
    base: `- Return only valid TSX code; no explanations.
- Rename attributes: 'class'→'className', 'for'→'htmlFor', 'tabindex'→'tabIndex'.
- Map HTML DOM events to React camelCase: 'onclick'→'onClick', 'oninput'→'onInput', 'onchange'→'onChange', 'onsubmit'→'onSubmit', 'onfocus'→'onFocus', 'onblur'→'onBlur'.
- Keep semantics and structure; do not add business logic.
- Image references: for static assets outside the public directory, use require(), e.g., <img src={require('assets/image.png')} />.`,
    tailwind: `- Preserve Tailwind utility classes under 'className'.
- Convert inline 'style="..."' to a React style object: 'style={{...}}'.`,
    css: `- Replace Tailwind utility classes with semantic class names and reference a CSS Module: import styles from './{{componentName}}.module.css'.
- Apply classes via 'className={styles.className}'.
- Convert inline 'style="..."' to a React style object only when dynamic; prefer moving static styles into the CSS Module.`,
  },
  vue: {
    base: `- Output only the .vue code in a single block; no explanations.
- Keep semantics and structure; do not add business logic.
- Component name hint: {{componentName}} (filename may be {{componentName}}.vue).`,
    tailwind: `- Use <template> and <script setup lang="ts"> (leave script empty if no logic).
- Keep Tailwind classes under 'class' (do not rename to className).
- Map HTML DOM events to Vue listeners using '@event': 'onclick'→'@click', 'oninput'→'@input', 'onchange'→'@change', 'onsubmit'→'@submit', 'onfocus'→'@focus', 'onblur'→'@blur'.
- Convert inline 'style="..."' to Vue bound style object ':style="{...}"'.`,
    css: `- Use <template>, <script setup lang="ts">, and <style scoped> (leave script empty if no logic).
- Do not use Tailwind utility classes. Replace them with semantic class names and equivalent CSS rules inside <style scoped>.
- Map HTML DOM events to Vue listeners using '@event': 'onclick'→'@click', 'oninput'→'@input', 'onchange'→'@change', 'onsubmit'→'@submit', 'onfocus'→'@focus', 'onblur'→'@blur'.
- Prefer moving static inline styles into <style scoped>; keep dynamic expressions with ':style="{...}"'.`,
  },
}

export const registerCodeConvertPrompts = (mcpServer: McpServer) => {
  // React with Tailwind
  mcpServer.prompt(
    'html-to-react-tailwind',
    'Convert HTML + TailwindCSS to React component (preserving Tailwind)',
    {
      componentName: z.string().describe('Name for the React component'),
      source: z.string().describe('HTML + TailwindCSS snippet to convert'),
    },
    async ({componentName, source}) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a precise code converter.
Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX).

Requirements:
${COMMON_REQUIREMENTS.react.base}
${COMMON_REQUIREMENTS.react.tailwind}

Component name: ${componentName}

Source:
${source}`,
          },
        },
      ],
    }),
  )

  // React with CSS Modules
  mcpServer.prompt(
    'html-to-react-css',
    'Convert HTML + TailwindCSS to React component with CSS Modules',
    {
      componentName: z.string().describe('Name for the React component'),
      source: z.string().describe('HTML + TailwindCSS snippet to convert'),
    },
    async ({componentName, source}) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a precise code converter.
Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX) using semantic CSS (no Tailwind).

Requirements:
${COMMON_REQUIREMENTS.react.base}
${COMMON_REQUIREMENTS.react.css.replace(/\{\{componentName\}\}/g, componentName)}

Component name: ${componentName}

Source:
${source}`,
          },
        },
      ],
    }),
  )

  // Vue with Tailwind
  mcpServer.prompt(
    'html-to-vue-tailwind',
    'Convert HTML + TailwindCSS to Vue SFC (preserving Tailwind)',
    {
      componentName: z.string().describe('Name for the Vue component'),
      source: z.string().describe('HTML + TailwindCSS snippet to convert'),
    },
    async ({componentName, source}) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a precise code converter.
Convert the provided HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC) that keeps Tailwind utilities.

Requirements:
${COMMON_REQUIREMENTS.vue.base.replace(/\{\{componentName\}\}/g, componentName)}
${COMMON_REQUIREMENTS.vue.tailwind}

Source:
${source}`,
          },
        },
      ],
    }),
  )

  // Vue with CSS
  mcpServer.prompt(
    'html-to-vue-css',
    'Convert HTML + TailwindCSS to Vue SFC with scoped CSS',
    {
      componentName: z.string().describe('Name for the Vue component'),
      source: z.string().describe('HTML + TailwindCSS snippet to convert'),
    },
    async ({componentName, source}) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a precise code converter.
Convert the provided HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC) with semantic CSS.

Requirements:
${COMMON_REQUIREMENTS.vue.base.replace(/\{\{componentName\}\}/g, componentName)}
${COMMON_REQUIREMENTS.vue.css}

Source:
${source}`,
          },
        },
      ],
    }),
  )

  // HTML + Tailwind: 原样回显（不做任何代码改变）
  mcpServer.prompt(
    'html-to-html-tailwind',
    'Return HTML snippet as-is without any modification',
    {
      componentName: z.string().optional().describe('Optional component name hint'),
      source: z.string().describe('HTML + TailwindCSS snippet to wrap into HTML document'),
    },
    async ({source}) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a precise passthrough responder.
Output exactly the provided HTML snippet, unchanged.

Rules:
- Do not reformat, wrap, or inject any tags or scripts.
- Do not add explanations, backticks, prefixes, or suffixes.
- Return raw HTML only.

Snippet:
${source}`,
          },
        },
      ],
    }),
  )
}

// Helper function to generate prompt text based on framework and style
export function generatePromptText(
  promptName: string,
  componentName: string,
  source: string,
  assets?: string[],
): string {
  const basePrompt =
    'You are a precise code converter. Standardize the component name to English PascalCase; translate non-English names (e.g., Chinese) into concise English identifiers.'

  switch (promptName) {
    case 'html-to-react-tailwind':
      return `${basePrompt}
Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX).

Requirements:
${COMMON_REQUIREMENTS.react.base}
${COMMON_REQUIREMENTS.react.tailwind}

Component name: ${componentName}

Source:
${source}`

    case 'html-to-react-css':
      return `${basePrompt}
Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX) using semantic CSS (no Tailwind).

Requirements:
${COMMON_REQUIREMENTS.react.base}
${COMMON_REQUIREMENTS.react.css.replace(/\{\{componentName\}\}/g, componentName)}

Component name: ${componentName}

Source:
${source}`

    case 'html-to-vue-tailwind':
      return `${basePrompt}
Convert the provided HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC) that keeps Tailwind utilities.

Requirements:
${COMMON_REQUIREMENTS.vue.base.replace(/\{\{componentName\}\}/g, componentName)}
${COMMON_REQUIREMENTS.vue.tailwind}

Source:
${source}`

    case 'html-to-vue-css':
      return `${basePrompt}
Convert the provided HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC) with semantic CSS.

Requirements:
${COMMON_REQUIREMENTS.vue.base.replace(/\{\{componentName\}\}/g, componentName)}
${COMMON_REQUIREMENTS.vue.css}

Source:
${source}`

    case 'html-to-html-tailwind':
      return `You are a precise passthrough responder.
Output exactly the provided HTML snippet, unchanged.

Rules:
- Do not reformat, wrap, or inject any tags or scripts.
- Do not add explanations, backticks, prefixes, or suffixes.
- Return raw HTML only.

Snippet:
${source}`

    default:
      return `${basePrompt}
Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX) using semantic CSS.

Component name: ${componentName}

Source:
${source}`
  }
}
