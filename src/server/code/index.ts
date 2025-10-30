import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {z} from 'zod'

export const registerCodeServer = (server: McpServer) => {
  // Get Figma file information
  server.tool(
    'get_code_and_img_url',
    'Provide HTML+Tailwind code and a preview image URL; the server will normalize it into project HTML scaffolding and produce an acceptance checklist based on the preview.',
    {
      code: z.string().describe('HTML + Tailwind CSS code reproducing the design draft'),
      imgUrl: z.string().url().optional().describe('Public URL of the design draft preview image'),
    },
    async (o): Promise<CallToolResult> => {
      try {
        const {code, imgUrl} = o as {code: string; imgUrl?: string}

        const normalizeHtml = (input: string) => {
          const hasHtmlTag = /<html[\s>]/i.test(input)
          const bodyContent = hasHtmlTag ? input : `\n<div id="app">\n${input}\n</div>`
          const doc = `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>Design Draft Preview</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n  </head>\n  <body class="min-h-screen bg-white text-gray-900">\n    ${bodyContent}\n  </body>\n</html>`
          return doc
        }

        const normalizedHtml = normalizeHtml(code ?? '<div class="p-8 text-gray-500">No HTML provided</div>')

        const classSummary = (() => {
          const counts: Record<string, number> = {}
          const classRegex = /class\s*=\s*"([^"]+)"/g
          let match: RegExpExecArray | null
          while ((match = classRegex.exec(code ?? ''))) {
            const classes = match[1].split(/\s+/).filter(Boolean)
            for (const c of classes) {
              counts[c] = (counts[c] || 0) + 1
            }
          }
          const categories = {
            layout: Object.entries(counts).filter(([c]) =>
              /^(flex|grid|container|cols-|rows-|place-|items-|content-|justify-|self-)/.test(c),
            ).length,
            spacing: Object.entries(counts).filter(([c]) => /^(m[trblxy]?|p[trblxy]?|space-[xy]-|gap-)/.test(c)).length,
            typography: Object.entries(counts).filter(([c]) => /^(text-|font-|leading-|tracking-)/.test(c)).length,
            color: Object.entries(counts).filter(([c]) => /^(bg-|text-|border-|from-|via-|to-)/.test(c)).length,
            effect: Object.entries(counts).filter(([c]) => /^(shadow-|ring-|opacity-|mix-blend-|backdrop-)/.test(c))
              .length,
          }
          return {totalClasses: Object.keys(counts).length, categories}
        })()

        const acceptanceChecks: string[] = [
          'Preview image URL is reachable and returns a 2xx/3xx status',
          'Key layout utilities present (flex/grid/spacing) to match design',
          'Typography utilities used for headings/body per design intent',
          'Color tokens (bg-/text-/border-) reflect visual palette from preview',
          'Page scaffold includes Tailwind CDN and responsive viewport meta',
        ]

        // Reachability test for preview image
        let imageReachable = false
        let imageStatus: number | null = null
        if (imgUrl) {
          try {
            const head = await fetch(imgUrl, {method: 'HEAD'})
            imageStatus = head.status
            imageReachable = head.ok || (head.status >= 300 && head.status < 400)
          } catch {
            try {
              const getResp = await fetch(imgUrl, {method: 'GET'})
              imageStatus = getResp.status
              imageReachable = getResp.ok || (getResp.status >= 300 && getResp.status < 400)
            } catch {
              imageReachable = false
              imageStatus = null
            }
          }
        } else {
          imageReachable = false
          imageStatus = null
        }

        const data = {
          input: {
            imgUrl,
            codeLength: code?.length ?? 0,
          },
          project: {
            files: [{path: 'index.html', contents: normalizedHtml}],
            note: 'HTML scaffold uses Tailwind CDN; integrate with your build pipeline if you prefer local Tailwind configuration.',
          },
          acceptance: {
            imageReachable,
            imageStatus,
            classUsageSummary: classSummary,
            checklist: acceptanceChecks,
            warnings: imgUrl
              ? imageReachable
                ? []
                : ['Preview image is not reachable; visual acceptance may be incomplete.']
              : ['No preview image URL provided; visual acceptance may be limited.'],
          },
        }

        return {
          content: [
            {
              type: 'text',
              text: `Converted to project HTML (index.html). Image reachable: ${imageReachable} (status: ${imageStatus ?? 'N/A'}).`,
            },
          ],
          structuredContent: data,
        }
      } catch (error: any) {
        return {
          content: [{type: 'text', text: `Error: ${error.message}`}],
        }
      }
    },
  )
}
