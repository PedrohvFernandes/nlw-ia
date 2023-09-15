import { useState } from 'react'
import { Github } from 'lucide-react'

import { ModelInputForm } from './components/model-input-form'
import { Button } from './components/ui/button'
import { Separator } from './components/ui/separator'
import { Textarea } from './components/ui/textarea'
import { VideoInputForm } from './components/video-input-form'

export function App() {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [input, setInput] = useState<string>('')
  const [completion, setCompletion] = useState<string>('')
  const [eventInputChange, setEventInputChange] = useState<React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement> | null>(null)

  function updateInputTextAI(input: string) {
    setInput(input)
  }

  function updateCompletionTextAI(completion: string) {
    setCompletion(completion)
  }

  // Essa função me permite mudar no input da IA, mas isso nao acontece no setInput(event.target.value) ele so esta me dando liberdade para digitar e ao digitar setar esse valor nesse estado eventInputChange, para que esse estado passe realmente para a função que gerencia isso no model-input-form do hook useCompletion que é a funçao handleInputChange que é basicamente setInput(event.target.value) que vai alterar o valor do input que tambem vem do hook useCompletion, mas como estamos usando esse hook devemos usar essa funçao que vem dele caso queira alterar o input que sera enviado para IA. Lembrando que no INPUT da IA nao se deve apagar a palavra'''{transcription}''' pois é ela que sera substituída pela transcrição do video. Com o prompt + a transcrição do video a IA ira gerar o texto final
  function handleInputChange(event: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>) {
    setEventInputChange(event)
    setInput(event.target.value)
  }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-3 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold">Upload.ai</h1>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Desenvolvido com ❤️ no NLW da Rocketseat
          </span>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline">
            <Github className="w-4 h-4 mr-2" size={16} />
            Github
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6 flex gap-6">
        <div className="flex flex-col flex-1 gap-4">
          <div className="grid grid-rows-2 gap-4 flex-1">
            <Textarea
              placeholder="Inclua a prompt para a IA..."
              className="resize-none p-4 leading-relaxed"
              value={input}
              // onChange={event => setInput(event.target.value)} // infelizmente isso nao funciona quando se usar o useCompletion, tem que usar o hook dela e das coisas que vem no hook, como loading, completion, input, setInput, handleInputChange, handleSubmit...
              onChange={handleInputChange}
            />
            <Textarea
              placeholder="Resultado gerado pela IA..."
              className="resize-none p-4 leading-relaxed"
              readOnly
              value={completion}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Lembre-se: você pode utilizar a variável{' '}
            <code className="text-violet-400">{'{transcription}'}</code> no seu
            prompt para adicionar o conteúdo da transcrição do video
            selecionado.
          </p>
        </div>
        <aside className="w-80 space-y-6">
          <VideoInputForm onVideoUploaded={setVideoId} />
          <Separator />
          <ModelInputForm
            videoId={videoId}
            onUpdateInputAI={updateInputTextAI}
            onUpdateCompletionTextAI={updateCompletionTextAI}
            eventInputChange={eventInputChange}
          />
        </aside>
      </main>
    </div>
  )
}
