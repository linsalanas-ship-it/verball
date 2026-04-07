import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import ReferenceCard from '@/components/ReferenceCard'
import { CATEGORIES, LANGUAGES } from '@/lib/constants'
import type { Category, Language, Reference } from '@/lib/types'

interface SearchParams {
  categoria?: Category
  idioma?: Language
  q?: string
}

// ── Hero (latest reference) ────────────────────────────────────────────────

function HeroReference({ reference }: { reference: Reference }) {
  const category = CATEGORIES[reference.category]
  const language = LANGUAGES[reference.language]

  return (
    <Link
      href={`/ref/${reference.slug}`}
      className="group block border-b border-border hover:bg-surface transition-colors duration-150"
    >
      {/* Hero image */}
      {reference.image_url && (
        <div className="w-full overflow-hidden border-b border-border" style={{ height: 'clamp(240px, 45vw, 520px)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reference.image_url}
            alt={reference.brand_name}
            className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
          />
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-5 py-10 sm:py-14">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <span className="text-xs font-semibold uppercase tracking-[0.1em]">
            {reference.brand_name}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-2xs uppercase tracking-[0.08em] font-medium px-2.5 py-1 rounded-sm"
              style={{ color: category.color, backgroundColor: category.bg }}
            >
              {category.label}
            </span>
            <span
              className="text-2xs font-semibold uppercase tracking-wider"
              style={{ color: language.color }}
            >
              {language.label}
            </span>
          </div>
        </div>

        {/* Text — the hero */}
        <p
          className="text-[22px] sm:text-[28px] leading-[1.55] text-ink whitespace-pre-line"
          style={{ maxWidth: '860px' }}
        >
          {reference.content.length > 320
            ? reference.content.slice(0, 320).trimEnd() + '…'
            : reference.content}
        </p>

        {/* Meta */}
        <div className="mt-8 flex items-center gap-2 text-2xs text-muted">
          {reference.year && <span>{reference.year}</span>}
          {reference.year && reference.industry && <span className="text-faint">·</span>}
          {reference.industry && <span>{reference.industry}</span>}
          {reference.agency && (
            <>
              <span className="text-faint">·</span>
              <span>{reference.agency}</span>
            </>
          )}
          <span className="text-faint ml-auto">Ler referência →</span>
        </div>
      </div>
    </Link>
  )
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionDivider({ count }: { count: number }) {
  return (
    <div className="max-w-[1400px] mx-auto px-5 py-5 border-b border-border flex items-center justify-between">
      <span className="text-2xs text-muted uppercase tracking-widest">Arquivo</span>
      <span className="text-2xs text-faint">{count} {count === 1 ? 'referência' : 'referências'}</span>
    </div>
  )
}

// ── Reference grid ─────────────────────────────────────────────────────────

function ReferenceGrid({ references }: { references: Reference[] }) {
  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border">
        {references.map((ref) => (
          <div key={ref.id} className="bg-bg">
            <ReferenceCard reference={ref} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Data + layout ─────────────────────────────────────────────────────────

async function ReferenceList({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const hasFilters = !!(searchParams.categoria || searchParams.idioma || searchParams.q)

  let query = supabase
    .from('references')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (searchParams.categoria) query = query.eq('category', searchParams.categoria)
  if (searchParams.idioma) query = query.eq('language', searchParams.idioma)
  if (searchParams.q) query = query.ilike('content', `%${searchParams.q}%`)

  const { data: references, error } = await query

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 py-20 text-center text-muted text-sm">
        Erro ao carregar referências.
      </div>
    )
  }

  if (!references || references.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 py-20 text-center">
        <p className="text-sm text-muted">Nenhuma referência encontrada.</p>
      </div>
    )
  }

  const refs = references as Reference[]

  // With filters: plain grid
  if (hasFilters) {
    return (
      <>
        <SectionDivider count={refs.length} />
        <ReferenceGrid references={refs} />
      </>
    )
  }

  // Magazine layout: hero + archive grid
  const [hero, ...rest] = refs

  return (
    <>
      <HeroReference reference={hero} />
      {rest.length > 0 && (
        <>
          <SectionDivider count={rest.length} />
          <ReferenceGrid references={rest} />
        </>
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <Header />
      <Suspense>
        <FilterBar />
      </Suspense>
      <Suspense
        fallback={
          <div className="max-w-[1400px] mx-auto px-5 py-20 text-center text-muted text-sm">
            Carregando...
          </div>
        }
      >
        <ReferenceList searchParams={searchParams} />
      </Suspense>
    </>
  )
}
