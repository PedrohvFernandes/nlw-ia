# NLW-IA 2023 - Rocketseat <img  align='center' width='100px' src='https://yt3.ggpht.com/ytc/AKedOLQkXnYChXAHOeBQLzwhk1_BHYgUXs6ITQOakoeNoQ=s176-c-k-c0x00ffffff-no-rj'/>

<p align='center'>
  <img src='https://storage.googleapis.com/star-lab/nlw-ia/OG.jpg'/>
</p>

## Sobre:

### Precisa de uma aplicação para te sugerir algo sobre um video seu, seja um titulo, descrição... então te apresento um projeto que tem por tras duas melhores IA ja inventadas da OPENAI, o chatgpt e a whisper-1, as duas trabalhando lado a lado conseguem gerar informações do seu video de acordo com sua necessidade

## Conm funciona em termos tecnicos
#### Como é gerado alguma descrição ou algo para o video? O usuario coloca o video que ele quer que seja gerado um texto final com base no audio daquele video, ao clicar no botão de UPLOAD, ele é convertido para audio no propio front, apos isso vai executar de fato o upload, vai esperar a execução do upload do audio, e para isso é usado o pipeline e por conta do pipeline nao vai passar para uma proxima tarefa enquanto ele nao concluir de escrever o audio para a maquina local e mandar o path do arquivo na maquina local para o Banco de dados junto com o nome usando o prisma, depois a função de transcription vai ser executada em create-transcription, ja com o id do video que acabou de subir e gerar o arquivo para o maquina local e o path do arquivo para banco de dados, com isso é feito a conversao de audio para text usando alem do audio do video os prompts de transcrição para ajudar a IA entender melhor o audio do video com palavras mais difíceis, dps vai para o ultimo passo que é o EXECUTAR, a onde esse texto é usado no chatgpt com o prompt selecionado sem ser o de transcrição que nesse prompt vai conter o template que nada mais é, é o que voce quer que gere com base na transcriçao, vai ser usado tambem a temperatura que é a onde voce decide se ela a IA vai ser mais criativa ou mais esperta sem erros e o id do video no generate-ai-completion: video->audio->text(whisper-1)->Prompt+Text:chatgpt podendo gerar uma descrição para o video que seria considerado o texto final, tudo vai depender do prompt usado, modelo(Ia que vai gerar o texto final) e a temperatura.

#### Lembrando que no INPUT você pode alterar o prompt, mas nao se deve apagar a palavra'''{transcription}''' pois é ela que sera substituida pela transcrição do video, considere ela como uma variavel, para ligar com prompt + transcription do audio do video. Com o prompt(Template ou sua personalização ou duvida em relaçao a transcrição) + a transcrição do video a IA ira gerar o texto final

## 🌐 Demonstração do app na web:

### Web:
<div>
  <img width='800'src='https://github.com/PedrohvFernandes/nlw-ia/blob/main/NLWIATRANSCRIPTIONWEB/public/Web/Sreen1.png'/>
  <img width='800'src='https://github.com/PedrohvFernandes/nlw-ia/blob/main/NLWIATRANSCRIPTIONWEB/public/Web/Screen2.png'/>
</div>



### Mobile: Em preparamento

## ✨Tecnologias:

### Principais Stacks:

- React
- shadcn/ui
- ffmpeg
- WebAssembly
- radix-ui
- ai(vercel) para front-end e back-end
- clsx
- openai
- TypeScript
- Node
- Vite
- fastify
- Sqlite
- Axios

### Secundarias Stacks:

- TailwindCSS
- Prisma(ORM)
- lucide-react
- zod

## 🛠️ Features:

- Upload de video + transcrição desse video para mp3 e de mp3 para texto
- Prompts ja personalizados para gerar um texto final
- Resultado final, ou seja o texto final: Prompt(Template do que perguntar para ia em relação ao transcription do video) + transcription do video(Texto gerado pelo modelo whisper-1) = Texto final(Texto gerado pelo chatgpt 3) para o usuario ter uma ideia ou usar aquilo mesmo como resultado final

## 🛠️ Futuras Features e Atualizações:

- Cadastro e login de usuarios
- Theme Light

## 👨‍💻 Autor:

- Linkedin: https://www.linkedin.com/in/pedro-henrique-vieira-fernandes
- Git: https://github.com/PedrohvFernandes
- Instagram: pedro17fernandes
- portfolio: https://pedrohvfernandes-web-page-portfolio.vercel.app

