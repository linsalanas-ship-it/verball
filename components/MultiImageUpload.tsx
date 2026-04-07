'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  values: string[]
  onChange: (urls: string[]) => void
  sourceUrl?: string
}

export default function MultiImageUpload({ values, onChange, sourceUrl }: Props) {
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setUploading(true)
    setError(null)

    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('reference-images')
        .upload(filename, file, { cacheControl: '31536000', upsert: false })

      if (uploadError) {
        setError(uploadError.message)
        continue
      }

      const { data } = supabase.storage.from('reference-images').getPublicUrl(filename)
      newUrls.push(data.publicUrl)
    }

    if (newUrls.length > 0) onChange([...values, ...newUrls])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleExtractOg() {
    if (!sourceUrl) return
    setExtracting(true)
    setError(null)

    try {
      const res = await fetch('/api/og-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl }),
      })
      const data = await res.json()
      if (data.image_url && !values.includes(data.image_url)) {
        onChange([...values, data.image_url])
      } else if (!data.image_url) {
        setError('Nenhuma og:image encontrada nessa URL.')
      }
    } catch {
      setError('Erro ao extrair imagem.')
    } finally {
      setExtracting(false)
    }
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  function moveFirst(index: number) {
    if (index === 0) return
    const next = [...values]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {values.map((url, i) => (
            <div
              key={url + i}
              className="relative group border border-border overflow-hidden bg-surface"
              style={{ aspectRatio: '16/9' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

              {/* Remove */}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/90 hover:bg-white text-ink text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover"
              >
                ✕
              </button>

              {/* Make cover */}
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => moveFirst(i)}
                  className="absolute bottom-1.5 right-1.5 text-2xs uppercase tracking-wider bg-white/90 hover:bg-white text-ink px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Definir como capa"
                >
                  Capa
                </button>
              )}

              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 text-2xs uppercase tracking-wider bg-ink text-bg px-1.5 py-0.5">
                  Capa
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-2xs uppercase tracking-wider border border-dashed border-border px-4 py-2.5 text-muted hover:text-ink hover:border-border-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading
            ? 'Enviando...'
            : values.length === 0
            ? '↑ Adicionar imagens'
            : '↑ Adicionar mais'}
        </button>

        {sourceUrl && (
          <button
            type="button"
            onClick={handleExtractOg}
            disabled={extracting}
            className="text-2xs uppercase tracking-wider border border-border px-4 py-2.5 text-muted hover:text-ink hover:border-border-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {extracting ? 'Extraindo...' : '✦ Extrair og:image da URL'}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      {values.length > 1 && (
        <p className="text-2xs text-faint">
          A primeira imagem é usada como capa. Passe o mouse e clique em "Capa" para alterar a ordem.
        </p>
      )}
    </div>
  )
}
