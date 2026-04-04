import { NextRequest, NextResponse } from 'next/server'

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

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Verball/1.0)',
        Accept: 'text/html',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json({ image_url: null })
    }

    // Only read first 50KB to find meta tags (they're in <head>)
    const reader = res.body?.getReader()
    if (!reader) return NextResponse.json({ image_url: null })

    let html = ''
    let done = false
    while (!done && html.length < 50000) {
      const chunk = await reader.read()
      done = chunk.done
      if (chunk.value) html += new TextDecoder().decode(chunk.value)
      // Stop once we've passed </head>
      if (html.includes('</head>')) break
    }
    reader.cancel()

    const imageUrl = extractMeta(html, 'og:image', 'twitter:image')
    return NextResponse.json({ image_url: imageUrl })
  } catch {
    return NextResponse.json({ image_url: null })
  }
}
