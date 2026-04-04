'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Props {
  value: string
  onChange: (url: string) => void
  sourceUrl?: string
}

export default function ImageUpload({ value, onChange, sourceUrl }: Props) {
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('reference-images')
      .upload(filename, file, { cacheControl: '31536000', upsert: false })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('reference-images').getPublicUrl(filename)
    onChange(data.publicUrl)
    setUploading(false)

    // Reset input so same file can be re-selected
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

      if (data.image_url) {
        onChange(data.image_url)
      } else {
        setError('Nenhuma og:image encontrada nessa URL.')
      }
    } catch {
      setError('Erro ao extrair imagem.')
    } finally {
      setExtracting(false)
    }
  }

  const btnClass =
    'text-2xs uppercase tracking-wider border border-border px-3 py-2 hover:border-border-hover text-muted hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="space-y-2">
      {value ? (
        <div>
          <div className="relative w-full h-48 border border-border overflow-hidden bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Imagem da referência"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-1.5 flex items-center gap-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-2xs text-muted hover:text-ink uppercase tracking-wider transition-colors"
            >
              {uploading ? 'Enviando...' : 'Trocar imagem'}
            </button>
            <span className="text-faint text-2xs">·</span>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-2xs text-muted hover:text-red-600 uppercase tracking-wider transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={btnClass}
          >
            {uploading ? 'Enviando...' : '↑ Upload manual'}
          </button>

          {sourceUrl && (
            <button
              type="button"
              onClick={handleExtractOg}
              disabled={extracting}
              className={btnClass}
            >
              {extracting ? 'Extraindo...' : '✦ Extrair og:image da URL'}
            </button>
          )}

          <span className="text-2xs text-faint">ou cole uma URL abaixo</span>
        </div>
      )}

      {/* Manual URL input (fallback) */}
      {!value && (
        <input
          type="url"
          placeholder="https://... (URL direta da imagem)"
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value)
          }}
          className="w-full border border-border px-3 py-2 text-sm focus:outline-none focus:border-ink transition-colors bg-bg"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
