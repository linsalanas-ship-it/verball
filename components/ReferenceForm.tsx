'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, LANGUAGES, INDUSTRIES } from '@/lib/constants'
import type { Category, Language, Status, Reference } from '@/lib/types'

interface Props {
  initial?: Reference
}

interface Analysis {
  language: Language
  category: Category
  industry: string | null
  tags: string[]
  confidence: 'high' | 'medium' | 'low'
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function ReferenceForm({ initial }: Props) {
  const router = useRouter()
  const isEditing = !!initial

  const [form, setForm] = useState({
    brand_name: initial?.brand_name ?? '',
    title: initial?.title ?? '',
    content: initial?.content ?? '',
    category: initial?.category ?? ('' as Category),
    language: initial?.language ?? ('' as Language),
    industry: initial?.industry ?? '',
    year: initial?.year?.toString() ?? '',
    agency: initial?.agency ?? '',
    source_url: initial?.source_url ?? '',
    tags: initial?.tags?.join(', ') ?? '',
    status: initial?.status ?? ('published' as Status),
    slug: initial?.slug ?? '',
  })

  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-generate slug from brand + category on create
      if (!isEditing && (key === 'brand_name' || key === 'category')) {
        const brand = key === 'brand_name' ? value : prev.brand_name
        const cat = key === 'category' ? value : prev.category
        if (brand && cat) {
          next.slug = `${slugify(brand)}-${cat}-${Math.random().toString(36).slice(2, 6)}`
        }
      }
      return next
    })
  }

  async function handleAnalyze() {
    if (!form.content.trim()) {
      setAnalyzeError('Cole o texto antes de analisar.')
      return
    }

    setAnalyzing(true)
    setAnalyzeError(null)
    setAnalysis(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: form.content }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro desconhecido.')
      }

      const data: Analysis = await res.json()
      setAnalysis(data)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Falha ao analisar.')
    } finally {
      setAnalyzing(false)
    }
  }

  function applyAnalysis() {
    if (!analysis) return

    setForm((prev) => {
      const next = { ...prev }

      if (analysis.language) next.language = analysis.language
      if (analysis.category) {
        next.category = analysis.category
        // Re-generate slug if brand already filled
        if (!isEditing && prev.brand_name && analysis.category) {
          next.slug = `${slugify(prev.brand_name)}-${analysis.category}-${Math.random().toString(36).slice(2, 6)}`
        }
      }
      if (analysis.industry) next.industry = analysis.industry
      if (analysis.tags?.length) next.tags = analysis.tags.join(', ')

      return next
    })
    setAnalysis(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      brand_name: form.brand_name,
      title: form.title || null,
      content: form.content,
      category: form.category as Category,
      language: form.language as Language,
      industry: form.industry || null,
      year: form.year ? parseInt(form.year) : null,
      agency: form.agency || null,
      source_url: form.source_url || null,
      tags: form.tags
        ? form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      status: form.status as Status,
      slug: form.slug,
    }

    const supabase = createClient()

    if (isEditing) {
      const { error } = await supabase
        .from('references')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', initial.id)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase.from('references').insert(payload)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    router.push('/admin')
    router.refresh()
  }

  const inputClass =
    'w-full border border-border px-3 py-2 text-sm focus:outline-none focus:border-ink transition-colors bg-bg'
  const labelClass = 'block text-2xs text-muted uppercase tracking-widest mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[720px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Brand */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Marca *</label>
          <input
            type="text"
            value={form.brand_name}
            onChange={(e) => set('brand_name', e.target.value)}
            required
            placeholder="ex: Nike"
            className={inputClass}
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Categoria *</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Selecionar</option>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className={labelClass}>Idioma *</label>
          <select
            value={form.language}
            onChange={(e) => set('language', e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Selecionar</option>
            {Object.entries(LANGUAGES).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.label === 'PT' ? 'Português' : lang.label === 'EN' ? 'Inglês' : 'Espanhol'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content + Analyze */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass} style={{ marginBottom: 0 }}>
            Texto da referência *
          </label>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !form.content.trim()}
            className="text-2xs uppercase tracking-wider text-muted hover:text-ink border border-border hover:border-border-hover px-3 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {analyzing ? (
              <>
                <span className="inline-block w-2.5 h-2.5 border border-muted border-t-transparent rounded-full animate-spin" />
                Analisando...
              </>
            ) : (
              '✦ Analisar com IA'
            )}
          </button>
        </div>

        <textarea
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          required
          rows={8}
          placeholder="Cole o texto aqui..."
          className={`${inputClass} resize-y leading-relaxed`}
        />

        {/* Analysis result card */}
        {analysis && (
          <div className="mt-2 border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2.5 flex-1">
                <p className="text-2xs text-muted uppercase tracking-widest">
                  Sugestão da IA
                  <span
                    className={`ml-2 ${
                      analysis.confidence === 'high'
                        ? 'text-green-600'
                        : analysis.confidence === 'medium'
                        ? 'text-amber-600'
                        : 'text-red-500'
                    }`}
                  >
                    confiança {analysis.confidence === 'high' ? 'alta' : analysis.confidence === 'medium' ? 'média' : 'baixa'}
                  </span>
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
                  <span>
                    <span className="text-muted">Categoria:</span>{' '}
                    <strong>{CATEGORIES[analysis.category]?.label ?? analysis.category}</strong>
                  </span>
                  <span>
                    <span className="text-muted">Idioma:</span>{' '}
                    <strong>
                      {analysis.language === 'pt'
                        ? 'Português'
                        : analysis.language === 'en'
                        ? 'Inglês'
                        : 'Espanhol'}
                    </strong>
                  </span>
                  {analysis.industry && (
                    <span>
                      <span className="text-muted">Setor:</span>{' '}
                      <strong>{analysis.industry}</strong>
                    </span>
                  )}
                </div>

                {analysis.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-2xs border border-border px-2 py-0.5 text-muted bg-bg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={applyAnalysis}
                  className="text-2xs uppercase tracking-wider bg-ink text-bg px-3 py-1.5 hover:bg-ink/80 transition-colors"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysis(null)}
                  className="text-2xs uppercase tracking-wider text-muted hover:text-ink transition-colors"
                >
                  Ignorar
                </button>
              </div>
            </div>
          </div>
        )}

        {analyzeError && <p className="mt-1.5 text-xs text-red-600">{analyzeError}</p>}
      </div>

      {/* Title (optional context) */}
      <div>
        <label className={labelClass}>Título / contexto (opcional)</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="ex: Manifesto de lançamento, 2023"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Industry */}
        <div>
          <label className={labelClass}>Setor</label>
          <select
            value={form.industry}
            onChange={(e) => set('industry', e.target.value)}
            className={inputClass}
          >
            <option value="">Selecionar</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className={labelClass}>Ano</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => set('year', e.target.value)}
            placeholder="ex: 2023"
            min={1900}
            max={new Date().getFullYear()}
            className={inputClass}
          />
        </div>

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className={inputClass}
          >
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
      </div>

      {/* Agency */}
      <div>
        <label className={labelClass}>Agência / Autor</label>
        <input
          type="text"
          value={form.agency}
          onChange={(e) => set('agency', e.target.value)}
          placeholder="ex: Wieden+Kennedy"
          className={inputClass}
        />
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>Tags (separadas por vírgula)</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="ex: feminismo, propósito, minimalismo"
          className={inputClass}
        />
      </div>

      {/* Source */}
      <div>
        <label className={labelClass}>URL da fonte</label>
        <input
          type="url"
          value={form.source_url}
          onChange={(e) => set('source_url', e.target.value)}
          placeholder="https://"
          className={inputClass}
        />
      </div>

      {/* Slug */}
      <div>
        <label className={labelClass}>Slug (gerado automaticamente)</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          required
          className={`${inputClass} text-muted`}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-bg text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Publicar referência'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="text-xs text-muted hover:text-ink uppercase tracking-widest transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
