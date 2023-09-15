import { FFmpeg } from '@ffmpeg/ffmpeg'

// Temos que colocar o " ?url " por conta do vite, dessa forma carregamos esses arquivos so quando necessario ou seja é um import normal via url e nao direta do arquivo quando esse arquivo for carregado, como se fosse uma tag script, vai carregar esse arquivo de maneira assíncrona
import coreURL from '../ffmpeg/ffmpeg/ffmpeg-core.js?url'
import wasmURL from '../ffmpeg/ffmpeg/ffmpeg-core.wasm?url'
import workerURL from '../ffmpeg/ffmpeg/ffmpeg-worker.js?url'

let ffmpeg: FFmpeg | null

// Como o ffmpeg é um pacote grande, é melhor carregá-lo apenas quando necessário ou  se ela ja estiver carregada, retorna-la, ou seja reaproveitar a instancia, em vez de criar uma nova, no fim nos so criamos uma so instancia do ffmpeg
export const getFFmpeg = async () => {
  // Aqui a gente reaproveita a instancia
  if(ffmpeg) return ffmpeg

  // Aqui a gente cria uma nova instancia caso não exista
  ffmpeg = new FFmpeg()
  // Se o ffmpeg não estiver carregado, força o carregamento
  if(!ffmpeg.loaded) await ffmpeg.load({
    // A gente pode usar os scripts do ffmpeg via cdn https://unpkg.com/@ffmpeg/core@0.12.2/dist/esm ou arquivos:
    coreURL,
    wasmURL,
    workerURL
  })

  return ffmpeg
}	
