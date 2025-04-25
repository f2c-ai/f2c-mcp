import {z} from 'zod'
import {FigmaApiService} from '../services/figmaApi'
import {parseFigmaLink} from '../utils/figmaParser'

const schema = z.object({
  figmaUrl: z.string().url(),
  personalToken: z.string(),
})

export async function figmaToHtml(input: z.infer<typeof schema>) {
  const {figmaUrl, personalToken} = schema.parse(input)

  try {
    const {fileKey, nodeId} = parseFigmaLink(figmaUrl)
    const figmaApi = new FigmaApiService(personalToken)
    const html = await figmaApi.getNodeHtml(fileKey, nodeId)
    return html
  } catch (error) {
    console.error('转换失败:', error)
    throw error
  }
}