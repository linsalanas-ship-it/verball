import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import { CATEGORIES, LANGUAGES } from '@/lib/constants'
import type { Reference } from '@/lib/types'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('references')
    .select('brand_name, content, category')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!data) return {}

  const excerpt = data.content.slice(0, 120)

  return {
    title: `${data.brand_name} — Verball`,
    description: excerpt,
  }
}

export default async function ReferencePage({ params }: Props) {
  const supabase = createClient()
  const { data: ref, error } = await supabase
    .from('references')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (error || !ref) notFound()

  const reference = ref as Reference
  const category = CATEGORIES[reference.category]
  const language = LANGUAGES[reference.language]

  return (
    <>
      <Header />
      <main className="max-w-[720px] mx-auto px-5 py-16">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors mb-12 uppercase tracking-wider"
        >
          <span>←</span>
          <span>Voltar</span>
        </Link>

        {/* Brand + Meta */}
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{reference.brand_name}</h1>
            {reference.title && (
              <p className="text-sm text-muted mt-0.5">{reference.title}</p>
            )}
          </div>
          <span
            className="text-2xs uppercase tracking-[0.08em] font-medium px-2.5 py-1 rounded-sm shrink-0"
            style={{ color: category.color, backgroundColor: category.bg }}
          >
            {category.label}
          </span>
        </div>

        {/* The Reference — hero */}
        <blockquote className="text-[18px] sm:text-[20px] leading-[1.7] text-ink whitespace-pre-line border-l-2 border-ink pl-6 mb-12">
          {reference.content}
        </blockquote>

        {/* Metadata grid */}
        <div className="border-t border-border pt-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-2xs text-muted uppercase tracking-widest mb-1">Idioma</p>
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: language.color }}
            >
              {language.label === 'PT'
                ? 'Português'
                : language.label === 'EN'
                ? 'Inglês'
                : 'Espanhol'}
            </p>
          </div>

          {reference.year && (
            <div>
              <p className="text-2xs text-muted uppercase tracking-widest mb-1">Ano</p>
              <p className="text-xs text-ink">{reference.year}</p>
            </div>
          )}

          {reference.industry && (
            <div>
              <p className="text-2xs text-muted uppercase tracking-widest mb-1">Setor</p>
              <p className="text-xs text-ink">{reference.industry}</p>
            </div>
          )}

          {reference.agency && (
            <div>
              <p className="text-2xs text-muted uppercase tracking-widest mb-1">Agência</p>
              <p className="text-xs text-ink">{reference.agency}</p>
            </div>
          )}

          {reference.tags && reference.tags.length > 0 && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-2xs text-muted uppercase tracking-widest mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {reference.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-2xs border border-border px-2 py-0.5 text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Source */}
        {reference.source_url && (
          <div className="mt-8 pt-6 border-t border-border">
            <a
              href={reference.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-ink transition-colors underline underline-offset-2"
            >
              Ver fonte original
            </a>
          </div>
        )}
      </main>
    </>
  )
}
