import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { openai } from '../lib/openai'
import { prisma } from '../lib/prisma'

export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post('/ai/complete', async (request, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      template: z.string(),
      temperature: z.number().min(0).max(1).default(0.5)
    })

    // O prompt no caso são palavras que o usuario fala e que são dificies da ia entender, com isso isso ira facilitar para que ela entenda com mais faciliade para fazer a transcrição
    const { videoId, template, temperature } = bodySchema.parse(request.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId
      }
    })

    if (!video.transcription) {
      return reply
        .status(400)
        .send({ error: 'Video transcription was not generation yet.' })
    }

    // Substituímos o {transcription} que esta vindo do routes.http para testar, pelo texto gerado do audio pelo modelo whisper-1 e que foi armazenado no banco de dados
    const promptMessage = template.replace(
      '{transcription}',
      video.transcription
    )

    // Aqui a gente envia o texto gerado pelo outro modelo no caso whisper-1 e que foi armazenado no nosso banco de dados e enviamos para o modelo gpt-3.5-turbo-16k para que ele possa gerar o texto final. Poderia usar o gpt 3.5 normal mas a quantidade de tokens permitidos por ele é muito baixa(4k e as vezes so o video de envio pode dar isso tudo, imagine mais a resposta do chat gpt) e por isso usamos o turbo que tem 16k tokens
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature,
      messages: [{ role: 'user', content: promptMessage }]
    })

    return response
  })
}
