import {z} from 'zod'
import {FigmaApiService} from '../services/figmaApi'
import {parseFigmaLink} from '../utils/figmaParser'

const schema = z.object({
  figmaUrl: z.string().url(),
  personalToken: z.string(),
})

export async function figmaToHtml(input: z.infer<typeof schema>) {
  const {figmaUrl, personalToken} = schema.parse(input)
  const {fileKey, nodeId} = parseFigmaLink(figmaUrl)
  return new FigmaApiService(personalToken).getNodeHtml(fileKey, nodeId)
}
