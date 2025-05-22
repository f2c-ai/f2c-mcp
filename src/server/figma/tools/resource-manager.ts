import fs from 'fs'
import path from 'path'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {z} from 'zod'

export const registerResourceManagerServer = (server: McpServer) => {
  // Register HTML resource management tool
  server.tool(
    'manage_html_resources',
    'Extract and manage remote resource URLs from HTML code snippets, categorize them into CSS and HTML resources, and save as JSON in the project root directory',
    {
      htmlContent: z.string().describe('HTML content'),
      cliPwd: z.string().describe('Current console working directory'),
      projectRootPath: z.string().describe('Project root directory'),
    },
    async (o): Promise<CallToolResult> => {
      try {
        // Extract remote resource URLs from HTML
        const htmlUrls = extractUrlsFromHtml(o.htmlContent)
        // Extract remote resource URLs from CSS
        const cssUrls = extractUrlsFromCss(o.htmlContent)

        // Organize results
        const result = {
          html: htmlUrls,
          css: cssUrls,
          timestamp: new Date().toISOString(),
        }

        // Determine save path
        const savePath = path.resolve(o.projectRootPath, 'extracted_resources.json')

        // Save to file
        fs.writeFileSync(savePath, JSON.stringify(result, null, 2), 'utf8')

        return {
          content: [
            {type: 'text', text: `Resource extraction completed, found ${htmlUrls.length} HTML resources and ${cssUrls.length} CSS resources`},
            {type: 'text', text: `Results saved to: ${savePath}`},
          ],
        }
      } catch (error: any) {
        return {
          content: [{type: 'text', text: `Error extracting resources: ${error.message}`}],
        }
      }
    },
  )
}

/**
 * Extract URLs from HTML content
 * @param htmlContent HTML content
 * @returns Array of extracted URLs
 */
function extractUrlsFromHtml(htmlContent: string): string[] {
  const urls: string[] = []
  
  // Extract src attribute from <img> tags
  const imgRegex = /<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi
  let match
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    if (isRemoteUrl(match[1])) {
      urls.push(match[1])
    }
  }
  
  // Extract<script> tag from <script> tags
  const scriptRegex = /<script[^>]+src=['"]([^'"]+)['"][^>]*>/gi
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (isRemoteUrl(match[1])) {
      urls.push(match[1])
    }
  }
  
  // Extract href attribute from <link> tags
  const linkRegex = /<link[^>]+href=['"]([^'"]+)['"][^>]*>/gi
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    // Only add CSS and icon links, exclude other types of links
    const linkElement = match[0]
    if (
      (linkElement.includes('stylesheet') || 
       linkElement.includes('icon')) && 
      isRemoteUrl(match[1])
    ) {
      urls.push(match[1])
    }
  }
  
  // Extract href attribute from <a> tags
  const aRegex = /<a[^>]+href=['"]([^'"]+)['"][^>]*>/gi
  while ((match = aRegex.exec(htmlContent)) !== null) {
    if (isRemoteUrl(match[1])) {
      urls.push(match[1])
    }
  }
  
  // Extract src attribute from <video> and <source> tags
  const videoRegex = /<(video|source)[^>]+src=['"]([^'"]+)['"][^>]*>/gi
  while ((match = videoRegex.exec(htmlContent)) !== null) {
    if (isRemoteUrl(match[2])) {
      urls.push(match[2])
    }
  }
  
  // Extract src attribute from <audio> tags
  const audioRegex = /<audio[^>]+src=['"]([^'"]+)['"][^>]*>/gi
  while ((match = audioRegex.exec(htmlContent)) !== null) {
    if (isRemoteUrl(match[1])) {
      urls.push(match[1])
    }
  }
  
  // Extract url() from inline styles
  const inlineStyleRegex = /style=['"][^'"]*url\(['"]?([^'"\)]+)['"]?\)[^'"]*['"][^>]*>/gi
  while ((match = inlineStyleRegex.exec(htmlContent)) !== null) {
    if (isRemoteUrl(match[1])) {
      urls.push(match[1])
    }
  }
  
  return [...new Set(urls)] // Remove duplicates
}

/**
 * Extract URLs from CSS content
 * @param htmlContent Contains CSS
 * @returns Array of extracted URLs
 */
function extractUrlsFromCss(htmlContent: string): string[] {
  const urls: string[] = []
  
  // Extract content from <style> tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let styleMatch
  while ((styleMatch = styleRegex.exec(htmlContent)) !== null) {
    const cssContent = styleMatch[1]
    extractUrlsFromCssContent(cssContent, urls)
  }
  
  // Extract content from external CSS files (this requires an additional HTTP request, here only links are extracted)
  const linkCssRegex = /<link[^>]+rel=['"]stylesheet['"][^>]+href=['"]([^'"]+)['"][^>]*>/gi
  let linkMatch
  while ((linkMatch = linkCssRegex.exec(htmlContent)) !== null) {
    if (isRemoteUrl(linkMatch[1])) {
      urls.push(linkMatch[1])
    }
  }
  
  return [...new Set(urls)] // Remove duplicates
}

/**
 * Extract URLs from CSS content
 * @param cssContent CSS content
 * @param urls Array to store URLs
 */
function extractUrlsFromCssContent(cssContent: string, urls: string[]): void {
  // Extract url() from CSS
  const urlRegex = /url\(['"]?([^'"\)]+)['"]?\)/gi
  let match
  while ((match = urlRegex.exec(cssContent)) !== null) {
    if (isRemoteUrl(match[1])) {
      urls.push(match[1])
    }
  }
  
  // Extract @import
  const importRegex = /@import\s+['"]([^'"]+)['"];/gi
  while ((match = importRegex.exec(cssContent)) !== null) {
    if (isRemoteUrl(match[1])) {
      urls.push(match[1])
    }
  }
}

/**
 * Check if URL is a remote URL
 * @param url URL to check
 * @returns Whether it is a remote URL
 */
function isRemoteUrl(url: string): boolean {
  // Check if it is an absolute URL (starts with http:// or https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true
  }
  
  // Check if it is a protocol relative URL (starts with //)
  if (url.startsWith('//')) {
    return true
  }
  
  return false
}