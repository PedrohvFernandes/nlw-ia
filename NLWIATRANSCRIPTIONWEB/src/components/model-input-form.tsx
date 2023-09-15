import { useEffect, useState } from 'react'

import { useCompletion } from 'ai/react'
import { Wand2 } from 'lucide-react'
import { PromptSelect } from './prompt-select'
import { Button } from './ui/button'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { Separator } from './ui/separator'
import { Slider } from './ui/slider'

interface ModelInputFormProps {
  videoId: string | null
  onUpdateInputAI: (input: string) => void
  onUpdateCompletionTextAI: (completion: string) => void
  eventInputChange:
    | React.ChangeEvent<HTMLTextAreaElement>
    | React.ChangeEvent<HTMLInputElement>
    | null
}

export function ModelInputForm({
  videoId,
  onUpdateInputAI,
  onUpdateCompletionTextAI,
  eventInputChange
}: ModelInputFormProps) {
  const [temperature, setTemperature] = useState(0.5)

  // Eu poderia colocar esse componente model-input-form.tsx dentro do app.tsx e diretamente usar o useCompletion, em vez de ter que passar funções do tipo onUpdateInputAI para atualizar o estado do app.tsx com as informaçoes do useCompletion

  // O hook useCompletion é responsável por fazer a chamada para a API da IA de completar o texto final com o chatgpt. O input é o texto que será enviado para a API no caso o template que é contido no prompt e que mais tarde sera preenchido com a transcrição, e o setInput é a função que atualiza o input. Todas as funçoes vinda dessa lib tem como objetivo manipular a entrada e saída de dados da IA, poderia fazer sem o uso dela, mas se quisermos aquele efeito de ficar escrevendo, ter acesso ao loading, enviar o corpo da requisição para a IA tudo certinho, ter o retorno usamos ela mesmo que a api usada seja nossa, mas que dentro da rota(api) possui a IA GPT. Lembrando que é necessario passar uma rota a onde esteja usando uma IA e que no outro lado esteja usando a mesma lib ai
  const {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    completion,
    isLoading
  } = useCompletion({
    api: `${import.meta.env.VITE_API_URL}/ai/complete`,
    body: {
      videoId,
      temperature
    },
    // A gente pode passar headers para a requisição para configurar como que iremos enviar os dados para a API
    headers: {
      'Content-Type': 'application/json'
    }
  })

  useEffect(() => {
    onUpdateInputAI(input)
  }, [input])

  useEffect(() => {
    onUpdateCompletionTextAI(completion)
  }, [completion])

  useEffect(() => {
    if (eventInputChange) {
      handleInputChange(eventInputChange)
    }
  }, [eventInputChange])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Prompt</Label>
        <PromptSelect onPromptSelected={setInput} />
      </div>

      <div className="space-y-2">
        <Label>Modelo</Label>
        <Select disabled defaultValue="gpt3.5">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt3.5">GPT 3.5-turbo 16k</SelectItem>
          </SelectContent>
        </Select>
        <span className="block text-xs text-muted-foreground italic">
          {' '}
          Você poderá customizar essa opção em breve
        </span>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Temperatura</Label>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={[temperature]}
          // Por que o valor value é um array? porque o componente Slider é como se fosse um Range Slider, ou seja, ele pode ter mais de um valor selecionado, mas no nosso caso, é um unico valor, por isso pegamos o da posição 0
          onValueChange={value => setTemperature(value[0])}
        />
        <span className="block text-xs text-muted-foreground italic leading-relaxed">
          {' '}
          Valores mais altos tendem a deixar o resultado mais criativo e com
          possíveis erros
        </span>
      </div>

      <Separator />

      <Button disabled={isLoading} type="submit" className="w-full">
        Executar
        <Wand2 className="w-4 h-4 ml-2" />
      </Button>
    </form>
  )
}
