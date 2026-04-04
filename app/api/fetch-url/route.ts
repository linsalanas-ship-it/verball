import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CATEGORIES } from '@/lib/constants'

const client = new Anthropic()

const categoryKeys = Object.keys(CATEGORIES).join(', ')

function extractMeta(html: string, ...properties: string[]): string | null {
  for (const prop of properties) {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*?)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*?)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]?.trim()) return match[1].trim()
    }
  }
  return null
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1]?.trim() ?? null
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: NextRequest) {
  let url: string
  try {
    const body = await request.json()
    url = body.url
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL inválida.' }, { status: 400 })
  }

  // Fetch the page
  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Verball/1.0; +https://verball.app)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8,es;q=0.7',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json(
        { error: `Não foi possível acessar a URL (status ${res.status}).` },
        { status: 400 }
      )
    }

    html = await res.text()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout: a URL demorou demais para responder.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro ao acessar a URL.' }, { status: 400 })
  }

  // Extract metadata
  const ogImage = extractMeta(html, 'og:image', 'twitter:image')
  const ogTitle =
    extractMeta(html, 'og:title', 'twitter:title') ?? extractTitle(html)
  const ogDescription = extractMeta(
    html,
    'og:description',
    'twitter:description',
    'description'
  )

  // Clean text (limit to avoid token overflow)
  const textContent = stripHtml(html).slice(0, 6000)

  // Analyze with Claude
  let claudeResult: Record<string, unknown>
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: `Você é um especialista em branding verbal e redação publicitária.
Analise o conteúdo de uma página web e extraia a melhor referência verbal de branding presente nela.

Retorne APENAS JSON válido neste formato exato:
{
  "found": true,
  "brand_name": "<nome da marca>",
  "title": "<título/contexto da referência, ex: 'Manifesto de lançamento 2023'>",
  "content": "<o texto mais valioso da página — manifesto, tagline, copy, princípios de tom de voz. Copie fielmente, sem resumir nem parafrasear>",
  "category": "<um de: ${categoryKeys}>",
  "language": "<um de: pt, en, es>",
  "industry": "<setor ou null>",
  "tags": ["tag1", "tag2", "tag3"]
}

Se a página não contiver referência verbal relevante de branding, retorne:
{"found": false, "reason": "<motivo breve>"}

Categorias:
- manifesto: texto longo de posicionamento e propósito de marca
- tom-de-voz: princípios ou diretrizes de linguagem e comunicação
- tagline: slogan ou assinatura curta (até ~10 palavras)
- redacao: copy publicitário, headline, body copy de campanha
- email: email marketing ou newsletter
- naming: nome de marca, produto ou sistema de nomenclatura
- ooh: copy para mídia offline, outdoor, TV, rádio`,
      messages: [
        {
          role: 'user',
          content: `URL: ${url}
Título: ${ogTitle ?? '(não encontrado)'}
Descrição: ${ogDescription ?? '(não encontrada)'}

Conteúdo da página:
${textContent}`,
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('Sem texto na resposta.')

    const raw = textBlock.text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()

    claudeResult = JSON.parse(raw)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao analisar o conteúdo da página.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ...claudeResult, og_image: ogImage })
}
