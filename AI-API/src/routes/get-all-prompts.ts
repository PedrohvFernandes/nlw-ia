import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

// Aqui são os prompts com seus templates que serão usados para gerar o texto final, tipo se eu quero que gere uma descrição da quela conversao de video para audio(front-end) e de audio para texto(back-end + openai) eu uso o template de descrição ou de qualquer outra coisa com base do que voce quiser com aquele texto gerado do seu video pelo modelo whisper-1. Ex: titulo para o youtube, descriçao para esse video, etc 
export async function getAllPromptsRoute(app: FastifyInstance) {
  app.get('/prompts', async (request, reply) => {
    const prompts = await prisma.prompt.findMany()

    return prompts
  })
}
