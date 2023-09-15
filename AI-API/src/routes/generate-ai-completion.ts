import { FastifyInstance } from 'fastify'
import { z } from 'zod'
// Essa lib ajuda a gente enviar o texto gerado pela IA para o front conforme ela vai gerando, e não esperar ela gerar tudo para enviar tudo de uma vez
import { streamToResponse, OpenAIStream } from 'ai'
import { openai } from '../lib/openai'
import { prisma } from '../lib/prisma'

export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post('/ai/complete', async (request, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      // Trocamos template por prompt, pois a lib  ai da vercel usa prompt na api
      // template: z.string(),
      prompt: z.string(),
      temperature: z.number().min(0).max(1).default(0.5)
    })

    // Este template vem do que o usuario selecionou no prompt na parte de executar para gerar um texto com base na transcrição e no prompt selecionado
    // const { videoId, template, temperature } = bodySchema.parse(request.body)
    const { videoId, prompt, temperature } = bodySchema.parse(request.body)

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

    // Substituímos o {transcription} pelo texto(transcrição) gerado do audio pelo modelo whisper-1 e que foi armazenado no banco de dados apos a ia gerar o texto do audio no momento do upload. E o template vem do prompt selecionado pelo usuario na etapa de executar que é quando pegamos o prompt selecionado e a transcrição ja pronta e a IA gpt-3 gera um texto com base nisso. Ex: O template do prompt de gerar um resumo do video: Gere um resumo sucinto da transição do vídeo informada a seguir: TRANSCRIPTION: Fala dev, sejam bem vindos para mais um video... e assim por diante
    //  No fim Esse {transcription} sera substituido pelo texto da transcrição do audio gerado pela IA, sendo assim ira ficar o prompt usado + o texto gerado pela IA com base na transcrição do audio para que seja usado no chatgpt para que ele gere o texto final
    // const promptMessage = template.replace(
    //   '{transcription}',
    //   video.transcription
    // )

    const promptMessage = prompt.replace(
      '{transcription}',
      video.transcription
    )

    // Aqui a gente envia o texto gerado pelo outro modelo no caso whisper-1 que foi armazenado no nosso banco de dados e junto enviamos o junto com o prompt selecionado do usuario, e por fim enviamos tudo isso para o modelo gpt-3.5-turbo-16k para que ele possa gerar o texto final. Poderia usar o gpt 3.5 normal mas a quantidade de tokens permitidos por ele é muito baixa(4k e as vezes so o video de envio pode dar isso tudo, imagine mais a resposta do chat gpt) e por isso usamos o turbo que tem 16k tokens
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature,
      messages: [{ role: 'user', content: promptMessage }],
      // O stream é para que a gente possa enviar o texto gerado pela IA para o front conforme ela vai gerando, e não esperar ela gerar tudo para enviar tudo de uma vez
      stream: true
    })

    // return response

    const stream = OpenAIStream(response)

    // O replay.raw é a referencia da resposta nativa do node, porque apesar do fastify ser um framework que usa o node por baixo dos panos, ele tem uma resposta nativa dele, ou seja nao usar as funçoes do node diretamente e por isso precisamos usar o reply.raw para que a gente possa acessar a parte interna do node, a resposta interna do node. E como estamos usando algo que vai ser nativo do node e não do fastify, precisamos configurar a questao do headers do cors manualmente pois nao passa pelo fastify
    //  No fim o texto gerado pelo chatgpt que seria o texto final é mostrado em tela de pouco em pouco, que é o resultado da transcrição do audio gerado pela IA + o prompt.
    streamToResponse(stream, reply.raw, {
      // O cors nada mais é que alguns headers
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT DELETE, OPTIONS'
      }
    })
  })
}
