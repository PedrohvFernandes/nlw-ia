import { fastifyMultipart } from '@fastify/multipart'
import { FastifyInstance } from 'fastify'
// path -> modulo nativo(interno) do node que lida com caminhos de arquivos
// Outros modulos/lib internas do node: fs, http, https, crypto, util, stream, etc\
// Você pode ver a lista completa aqui: https://nodejs.org/api/
// A maneira de importar pode ser assim " import path from 'path' " ou assim: o uso do "node:" é opcional, é mais para indicar que essa lib vem do proprio node
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { prisma } from '../lib/prisma'

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_848_576 * 25 //25MB definimos o tamanho do arquivo
    }
  })
  app.post('/videos', async (request, reply) => {
    const data = await request.file()

    if (!data) {
      return reply.status(400).send({ error: 'No file received' })
    }

    // data.filename -> nome do arquivo que esta vindo do front-end
    // Mesmo que o arquivo chegue convertido do front de .mp4 para .mp3, o nome do arquivo ainda tera um nome usando o data.filename. Mas aqui no caso estamos pegando a extensão do arquivo. Aqui basicamente estamos pegando a extensão no nome -> example.mp3 -> .mp3 (Seria mp4, mas o front ja manda para ca convertido para mp3)
    const extension = path.extname(data.filename)

    // Aqui seria .mp4, mas como no front-end o arquivo .mp4 é convertido para .mp3 e enviamos ele para aqui, então aqui é .mp3
    if (extension !== '.mp3') {
      return reply.status(400).send({ error: 'Invalid file type' })
    }

    // Pegamos o nome do arquivo e removemos a extensão, para mudar o nome dele para evitar que o nome do arquivo seja igual ao de outro arquivo que já existe no banco de dados. Ex:
    // Example.mp3 --> Example
    const fileBaseName = path.basename(data.filename, extension)

    // Alteramos o nome colocando um UUID aleatorio no final do nome do arquivo, para evitar que o nome do arquivo seja igual ao de outro arquivo que já existe no banco de dados e a extensão de volta. Ex:
    // Example --> Example-02384df-457rt645g-df345df-g2389.mp3
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`

    // ATENÇÃO: OBVIAMENTE que todo esse processo de salvar arquivo deveria ser feito em um serviço, mas para simplificar o código, vamos fazer aqui mesmo
    // O dirname é o caminho do diretório atual, no caso o caminho do arquivo upload-video.ts, depois eu volto as pastas e vou ate a tmp, e nela eu salvo o video, que no caso é ele convertido para .mp3 ou seja audio
    const uploadDestination = path.resolve(
      __dirname,
      '../../tmp',
      fileUploadName
    )

    // Aqui salvamos o arquivo, ou seja o upload do arquivo. So que usamos as streams do node para salvar ou ler, para que o arquivo seja salvo aos poucos, e não de uma vez só, para evitar que o servidor fique sobrecarregado ou que a memoria ram fique toda ocupada, ou seja chucks de dados, pedacinho por pedacinho salvo dentro do meu disco aliviando a memoria ram e o processador. E o pipeline ele é para que o usuario aguarde todo este processo finalizar, so que o pipeline usa uma api antiga para saber que terminou o processo de pipeline(upload) era usado callbacks, o que ainda é muito usado, so que hoje em dia tem o async/await so que o pipeline nao tem suporte para isso, com isso usamos o promisify para converter o pipeline que usa callback para usar a promise, e com isso podemos usar o async/await

    // A ordem dos parâmetros é importante, primeiro o que vai ser lido(o upload do arquivo, dados do arquivos aos poucos(busboyFileStream)) e depois o que vai ser escrito aos poucos conforme vai chegando, e ai passamos o caminho do arquivo que vai ser salvo(uploadDestination)
    await pump(data.file, fs.createWriteStream(uploadDestination))

    // Mandamos o caminho onde esta o arquivo e nome dele para o banco de dados
    const video = await prisma.video.create({
      data: {
        //poderia usar esse: data.filename -> nome do arquivo que esta vindo do front-end
        name: fileUploadName,
        path: uploadDestination
      }
    })

    return reply.send({ message: 'File uploaded', video })
  })
}
