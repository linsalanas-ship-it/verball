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

function parseClaudeJson(text: string): Record<string, unknown> | null {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {}

  // Strip markdown code fences
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  try {
    return JSON.parse(stripped)
  } catch {}

  // Extract first {...} block
  const match = stripped.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }

  return null
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
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
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
  const ogTitle = extractMeta(html, 'og:title', 'twitter:title') ?? extractTitle(html)
  const ogDescription = extractMeta(html, 'og:description', 'twitter:description', 'description')

  // Clean text
  const textContent = stripHtml(html).slice(0, 6000)

  // Detect JS-rendered pages (very little text = SPA shell)
  if (textContent.length < 200) {
    return NextResponse.json(
      {
        error:
          'Esta página carrega conteúdo via JavaScript e não pode ser lida automaticamente. Tente copiar o texto manualmente e usar o botão "Analisar com IA".',
        js_rendered: true,
        og_image: ogImage,
        og_title: ogTitle,
      },
      { status: 422 }
    )
  }

  // Analyze with Claude
  let response
  try {
    response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
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
- identidade-verbal: princípios ou diretrizes de linguagem e tom de voz
- copywriting: copy publicitário, headline, body copy, slogan ou tagline de campanha
- poesia: texto com estrutura poética, lírica, verso ou linguagem literária
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao chamar Claude API: ${msg}` },
      { status: 500 }
    )
  }

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: 'Resposta inesperada do modelo.' }, { status: 500 })
  }

  const parsed = parseClaudeJson(textBlock.text)
  if (!parsed) {
    return NextResponse.json(
      { error: 'Não foi possível interpretar a resposta do modelo.' },
      { status: 500 }
    )
  }

  if (!parsed.found) {
    return NextResponse.json(
      {
        error:
          (parsed.reason as string) ||
          'Nenhuma referência verbal de branding encontrada nessa página.',
      },
      { status: 422 }
    )
  }

  return NextResponse.json({ ...parsed, og_image: ogImage })
}
