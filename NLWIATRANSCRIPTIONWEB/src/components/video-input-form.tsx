import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'

import { Button } from './ui/button'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { Textarea } from './ui/textarea'

import { api } from '@/lib/axios'
import { getFFmpeg } from '@/lib/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { FileVideo, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success'

const statusMessages = {
  converting: 'Convertendo...',
  generating: 'Transcrevendo...',
  uploading: 'Carregando...',
  success: 'Sucesso!'
}

interface VideoInputFormProps {
  onVideoUploaded: (videoId: string) => void
}

export function VideoInputForm({ onVideoUploaded }: VideoInputFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('waiting')

  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget

    if (!files) {
      return
    }

    // O files nos retorna um array de arquivos, mesmo que nesse cenário seja somente um e nao multiplos
    const selectedFile = files[0] // files.item(0)

    setVideoFile(selectedFile)
  }

  async function convertVideoToAudio(videoFile: File) {
    console.log('Convertendo video para audio')

    const ffmpeg = await getFFmpeg()

    // Essa função writeFile é para colocar um arquivo  dentro do contexto do ffmpeg, porque como estamos utilizando webassembly, é como que se o ffmpeg estivesse rodando dentro de um container e nao na minha maquina, tipo num ambiente totalmente isolado, ou seja nao tem acesso aos arquivos da minha aplicação, se eu quero trabalhar com um arquivo com ele eu preciso mostrar o arquivo para ele e ele ira pegar esse arquivo e criar na maquina que ele consegue enxergar, por exemplo "input.mp4" tanto faz o nome que eu quero dar para ele e dps apagar o mesmo, ou seja eu escrevo esse arquivo no disco do ffmpeg. E para passar o arquivo usamos a função fetchFile que pega o arquivo e transformação numa representação binaria que nada mais que uma api nativa do browser que transforma o arquivo em binario
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

    // Voce pode escutar duas mensagem, o log, mas so usa isso caso esteja dando erro
    // ffmpeg.on('log', log => {
    //   console.log(log.message)
    // } )

    // E o progress, o progress retorna o tempo e o progresso(0.1, 0.2, 0.3 ...) multiplicamos ele por 100 para ter o progresso em porcentagem
    ffmpeg.on('progress', progress => {
      console.log(
        'Cover progress: ' + Math.round(progress.progress * 100) + '%'
      )
    })

    // Aqui que fica os comandos do ffmpeg, que vao ser concatenados uns com os outros. Caso tenho duvida do que colocar pode usar alguma IA para gerar o codigo do que voce quer, quanto de bitrate, quanto de qualidade, etc ou pode fazer o inverso pedir a IA para analisar os comandos.
    await ffmpeg.exec([
      '-i',
      'input.mp4', // Nome do arquivo que precisa ser convertido e precisa ser o mesmo em writeFile
      '-map', // O map pega a stram do audio
      '0:a',
      '-b:a', // bitrate de audio
      '20k', //a taxa do bitrate
      '-acodec', // codec de audio
      'libmp3lame', // codec de audio
      'output.mp3' // Nome do arquivo de saida que vai ser salvo dentro do disco do ffmpeg
    ])

    // Agora iremos ler o arquivo de saida que foi salvo dentro do disco do ffmpeg, que é do tipo FileData que é uma tipagem do proprio ffmpeg
    const data = await ffmpeg.readFile('output.mp3')

    // Com isso precisamos converter para file do JS, para que possamos enviar para a api. Primeiro convertemos em blob(é um dado de maneira mais nativa, que é usado muito em streams do node), colocamos o type dele e dps em file que a onde criamos de fato o arquivo usando o blob, colocando o type do arquivo, que no caso é audio/mpeg e o nome do arquivo
    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg'
    })

    console.log('Conversion finished')

    return audioFile
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = promptInputRef.current?.value

    if (!videoFile || !prompt) {
      return
    }

    setStatus('converting')

    // Converter o video em audio. MP4 -> MP3 (Obs: poderia converter la no back-end, so que seria um pouco mais demorado, e sem falar que isso acarretaria o servidor que estivesse com o back-end tendo que processar videos de diversos usuarios, com isso iremos usar a maquina do usuario para converter o video em audio e isso é o famoso webassembly que consegue rodar linguagens de programação e lib que rodam somente em ambiente back-end e uma delas é o ffmpeg que é usado em diversos softwares de edição e agora na web, no navegador sem usar o back-end por conta do webassembly https://ffmpegwasm.netlify.app é recomendado que user navegadores que tenha suporte a webassembly como o chrome ou navegadores que utilizam o motor do chrome, tipo o opera)
    const audioFile = await convertVideoToAudio(videoFile)

    // Enviar o audio para a api e da api vai para a openai

    const data = new FormData()

    // Associa o nome file com o audioFile
    data.append('file', audioFile)

    setStatus('uploading')

    // Envia o arquivo ja convertido em audio para o back-end
    const response = await api.post('/videos', data)

    // Com o video enviado pegamos o id gerado na resposta
    const videoId = response.data.video.id

    setStatus('generating')

    // Agora iremos realizar a transcrição
    await api.post(`/videos/${videoId}/transcription`, {
      prompt
    })

    setStatus('success')

    onVideoUploaded(videoId)
  }

  // Iremos usar o useMemo para ficar monitorando o videoFile, para que nao fique re renderizando o componente toda vez que o videoFile "mudar", somente quando o videoFile mudar de fato para um arquivo e nao para null de novo, se ele continuar nulo nao ira re renderizar toda a pagina. E o resto da função basicamente nos retorna o endereço da img do video
  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null
    }

    return URL.createObjectURL(videoFile)
  }, [videoFile])

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        htmlFor="video"
        className={cn(
          ' relative border flex rounded-md aspect-video border-dashed text-sm flex-col gap-2 items-center text-muted-foreground justify-center hover:bg-primary/5 duration-200',
          status !== 'waiting' ? 'cursor-no-drop' : 'cursor-pointer'
        )}
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            // Inset-0 é o mesmo que top-0 right-0 bottom-0 left-0
            className="pointer-events-none absolute inset-0"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Selecione um video(25MB)
          </>
        )}
      </label>

      <input
        type="file"
        id="video"
        accept="video/mp4"
        className='sr-only'
        disabled={status !== 'waiting'}
        onChange={handleFileSelect}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea
          ref={promptInputRef}
          disabled={status !== 'waiting'}
          id="transcription_prompt"
          className="resize-none h-20 leading-relaxed"
          placeholder="Inclua palavras-chave mencionadas no video separadas por virgula (,)"
        />
      </div>

      <Button 
        data-success={status === 'success'}
        disabled={status !== 'waiting'} 
        type="submit" 
        className="w-full data-[success=true]:bg-emerald-400 data-[success=true]:text-white data-[success=true]:bg-opacity-80"
      >
        {status === 'waiting' ? (
          <>
            Carregar video
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : (
          statusMessages[status]
        )}
      </Button>
    </form>
  )
}
