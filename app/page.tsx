import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import { CATEGORIES, LANGUAGES } from '@/lib/constants'
import type { Category, Language, Reference } from '@/lib/types'

interface SearchParams {
  categoria?: Category
  idioma?: Language
  q?: string
}

// ── Hero ──────────────────────────────────────────────────────────────────

function Hero({ reference }: { reference: Reference }) {
  const category = CATEGORIES[reference.category]
  const language = LANGUAGES[reference.language]
  const excerpt =
    reference.content.length > 280
      ? reference.content.slice(0, 280).trimEnd() + '…'
      : reference.content

  return (
    <Link
      href={`/ref/${reference.slug}`}
      className="group block border-b border-border"
    >
      {reference.image_url ? (
        /* ── With image: two-column ── */
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
          {/* Image */}
          <div
            className="overflow-hidden border-b lg:border-b-0 lg:border-r border-border"
            style={{ height: 'clamp(260px, 48vw, 580px)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reference.image_url}
              alt={reference.brand_name}
              className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-700 ease-out"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col justify-between px-7 py-8 lg:px-10 lg:py-12">
            <div>
              <span
                className="inline-block text-2xs uppercase tracking-widest font-medium px-2 py-1 rounded-sm mb-7"
                style={{ color: category.color, backgroundColor: category.bg }}
              >
                {category.label}
              </span>

              <h2 className="font-serif text-[40px] lg:text-[52px] xl:text-[60px] font-normal leading-[1.05] tracking-tight mb-7">
                {reference.brand_name}
              </h2>

              <p className="text-[15px] leading-[1.65] text-ink/75 line-clamp-5">
                {excerpt}
              </p>
            </div>

            <div className="mt-8">
              <span className="text-xs uppercase tracking-widest group-hover:underline underline-offset-4 decoration-1">
                Ler referência completa →
              </span>
              <div className="mt-4 flex items-center gap-2.5 text-2xs text-muted">
                {reference.year && <span>{reference.year}</span>}
                {reference.year && <span className="text-faint">·</span>}
                <span className="font-semibold" style={{ color: language.color }}>
                  {language.label}
                </span>
                {reference.industry && (
                  <>
                    <span className="text-faint">·</span>
                    <span>{reference.industry}</span>
                  </>
                )}
                {reference.agency && (
                  <>
                    <span className="text-faint">·</span>
                    <span className="truncate">{reference.agency}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── No image: typographic hero ── */
        <div className="max-w-[1400px] mx-auto px-5 py-14 lg:py-20">
          <span
            className="inline-block text-2xs uppercase tracking-widest font-medium px-2 py-1 rounded-sm mb-8"
            style={{ color: category.color, backgroundColor: category.bg }}
          >
            {category.label}
          </span>

          <h2 className="font-serif text-[52px] sm:text-[68px] lg:text-[84px] font-normal leading-[1.0] tracking-tight mb-8 max-w-[860px]">
            {reference.brand_name}
          </h2>

          <p className="text-[17px] lg:text-[19px] leading-[1.65] text-ink/75 max-w-[640px] line-clamp-4">
            {excerpt}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <span className="text-xs uppercase tracking-widest group-hover:underline underline-offset-4 decoration-1">
              Ler referência completa →
            </span>
            <div className="flex items-center gap-2.5 text-2xs text-muted">
              {reference.year && <span>{reference.year}</span>}
              {reference.year && <span className="text-faint">·</span>}
              <span className="font-semibold" style={{ color: language.color }}>
                {language.label}
              </span>
              {reference.industry && (
                <>
                  <span className="text-faint">·</span>
                  <span>{reference.industry}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Link>
  )
}

// ── Archive card ──────────────────────────────────────────────────────────

function ArchiveCard({ reference }: { reference: Reference }) {
  const category = CATEGORIES[reference.category]
  const language = LANGUAGES[reference.language]

  return (
    <Link href={`/ref/${reference.slug}`} className="group block">
      {/* Image / placeholder */}
      <div className="overflow-hidden border border-border mb-3 bg-surface" style={{ aspectRatio: '4/3' }}>
        {reference.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reference.image_url}
            alt={reference.brand_name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
        ) : (
          /* Fallback: category-tinted panel with brand initial */
          <div
            className="w-full h-full flex flex-col justify-between p-4"
            style={{ backgroundColor: category.bg }}
          >
            <span
              className="text-[56px] font-serif font-normal leading-none"
              style={{ color: category.color, opacity: 0.25 }}
            >
              {reference.brand_name.charAt(0)}
            </span>
            <span
              className="text-2xs uppercase tracking-widest font-medium"
              style={{ color: category.color }}
            >
              {category.label}
            </span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className="text-2xs uppercase tracking-[0.06em] font-medium px-1.5 py-0.5 rounded-sm"
            style={{ color: category.color, backgroundColor: category.bg }}
          >
            {category.label}
          </span>
        </div>
        <p className="text-sm font-semibold tracking-tight leading-tight">{reference.brand_name}</p>
        <p className="text-xs text-muted leading-relaxed line-clamp-2">{reference.content}</p>
        <div className="flex items-center gap-2 text-2xs text-faint pt-0.5">
          {reference.year && <span>{reference.year}</span>}
          {reference.year && <span>·</span>}
          <span className="font-semibold" style={{ color: language.color }}>
            {language.label}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Archive section ───────────────────────────────────────────────────────

function ArchiveSection({ references }: { references: Reference[] }) {
  if (references.length === 0) return null

  return (
    <section>
      {/* Section header with inline filters */}
      <div className="max-w-[1400px] mx-auto px-5 py-3 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <span className="text-2xs text-muted uppercase tracking-widest shrink-0">
          Arquivo —{' '}
          {references.length}{' '}
          {references.length === 1 ? 'referência' : 'referências'}
        </span>
        <Suspense fallback={null}>
          <FilterBar />
        </Suspense>
      </div>

      {/* Grid */}
      <div className="max-w-[1400px] mx-auto px-5 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {references.map((ref) => (
            <ArchiveCard key={ref.id} reference={ref} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Filter-only archive (when filters active) ─────────────────────────────

function FilteredSection({ references }: { references: Reference[] }) {
  return (
    <section>
      <div className="max-w-[1400px] mx-auto px-5 py-3 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <span className="text-2xs text-muted uppercase tracking-widest shrink-0">
          {references.length}{' '}
          {references.length === 1 ? 'referência' : 'referências'}
        </span>
        <Suspense fallback={null}>
          <FilterBar />
        </Suspense>
      </div>

      {references.length === 0 ? (
        <div className="max-w-[1400px] mx-auto px-5 py-20 text-center">
          <p className="text-sm text-muted">Nenhuma referência encontrada.</p>
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto px-5 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {references.map((ref) => (
              <ArchiveCard key={ref.id} reference={ref} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ── Data fetching ─────────────────────────────────────────────────────────

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

  const refs = (references ?? []) as Reference[]

  if (hasFilters) {
    return <FilteredSection references={refs} />
  }

  if (refs.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 py-20 text-center">
        <p className="text-sm text-muted">Nenhuma referência publicada ainda.</p>
      </div>
    )
  }

  const [hero, ...rest] = refs

  return (
    <>
      <Hero reference={hero} />
      <ArchiveSection references={rest} />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <Header />
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
