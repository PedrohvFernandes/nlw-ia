import { FastifyInstance } from 'fastify'
// Essa funçao é para ler o arquivo aos poucos, e nao de uma vez só, para evitar que o servidor fique sobrecarregado ou que a memoria ram fique toda ocupada, ou seja chucks de dados, pedacinho por pedacinho lido dentro do meu disco aliviando a memoria ram e o processador
import { createReadStream } from 'node:fs'
import { z } from 'zod'
import { openai } from '../lib/openai'
import { prisma } from '../lib/prisma'

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (request, reply) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid()
    })

    // const videoId = paramsSchema.parse(request.params).videoId
    const { videoId } = paramsSchema.parse(request.params)

    // Prompt de transcrição para ajudar a IA entender melhor o audio do video, ou seja, palavras que o usuario fala e que são difíceis da ia entender.
    const bodySchema = z.object({
      prompt: z.string()
    })

    // O Prompt de transcrição no caso são palavras que o usuario fala e que são dificies da ia entender, com isso isso ira facilitar para que ela entenda com mais faciliade para fazer a transcrição
    const { prompt } = bodySchema.parse(request.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId
      }
    })

    const videoPath = video.path

    // A gente passa o caminho do arquivo que ele vai ler chunk por chunk
    const audioReadStream = createReadStream(videoPath)

    // Agora vamos transcrever usando IA da openAI, para ter o key da openAI, tem que criar uma conta la e pegar a key nesse link: https://platform.openai.com/account/api-keys de um nome para a key ex:NLW IA AULAS e copie ela e cole no .env OPENAI_API_KEY. Lembrando que para usar esse modelo requer dinheiro na conta da openAI, para ver se você tem saldo disponinel de graça ou que voce inseriu basta ir em manage account clicando no icone do seu pefil, depois em usage e la voce vera um dashboard do quanto que voce usou e qual modelo foi utilizado durantes os dias e mes, e mais abaixo ira mostrar o saldo disponivel e a data que ele vai ser expirado.
    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      // Modelo é o modelo IA, nesse caso estamos utilizando modelo para transcrever audios
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      // A temperatura é para ver o quão aleatório vai ser a resposta, quanto mais baixo mais certeiro e menos criativo, quanto mais alto mais criativo, mas pode ter mais erros
      temperature: 0,
      // As palavras chaves para ajudar o modelo de IA a entender melhor o que esta sendo falado
      prompt
    })

    const transcription = response.text

    // Apos transcrever o audio contido no banco de dados, ou melhor dizendo o caminho do audio, vamos salvar a transcrição no banco de dados
    await prisma.video.update({
      where: {
        id: videoId
      },
      data: {
        transcription,
      }
    })

    return { transcription }
  })
}
