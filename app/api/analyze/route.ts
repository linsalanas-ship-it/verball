import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CATEGORIES, LANGUAGES, INDUSTRIES } from '@/lib/constants'

const client = new Anthropic()

const categoryKeys = Object.keys(CATEGORIES).join(', ')
const languageKeys = Object.keys(LANGUAGES).join(', ')
const industryList = INDUSTRIES.join(', ')

export async function POST(request: NextRequest) {
  const { content } = await request.json()

  if (!content || typeof content !== 'string' || content.trim().length < 10) {
    return NextResponse.json({ error: 'Texto muito curto.' }, { status: 400 })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: `Você é um especialista em branding verbal, redação publicitária e comunicação de marca.
Analise o texto fornecido e retorne um JSON com as seguintes inferências.

Responda APENAS com JSON válido, sem texto antes ou depois. Formato exato:
{
  "language": "<um de: ${languageKeys}>",
  "category": "<um de: ${categoryKeys}>",
  "industry": "<um de: ${industryList}, ou null se não identificado>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "confidence": "<high | medium | low>"
}

Definições de categoria:
- manifesto: texto longo de posicionamento e propósito de marca
- tom-de-voz: princípios, regras ou diretrizes de linguagem
- tagline: slogan ou assinatura curta (geralmente até 10 palavras)
- redacao: copy publicitário, headline, body copy de campanha
- email: texto de email marketing, newsletter, sequência de onboarding
- naming: nome de marca, produto, serviço ou sistema de nomenclatura
- ooh: copy para peças offline, outdoor, mídia impressa, rádio, TV

Para tags: use termos descritivos relevantes ao tom, tema ou técnica do texto (ex: feminismo, minimalismo, propósito, humor, nostalgia, urgência, premium). Máximo 5 tags.`,
      messages: [
        {
          role: 'user',
          content: `Analise este texto:\n\n${content.slice(0, 4000)}`,
        },
      ],
    })

    // Extract text block (skip thinking blocks)
    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Sem resposta de texto do modelo.')
    }

    // Parse JSON — Claude may wrap in ```json blocks
    const raw = textBlock.text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()
    const analysis = JSON.parse(raw)

    return NextResponse.json(analysis)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[analyze]', message)

    // Surface auth errors clearly
    if (message.includes('401') || message.includes('authentication') || message.includes('API key')) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY não configurada ou inválida.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: `Falha ao analisar: ${message}` }, { status: 500 })
  }
}
