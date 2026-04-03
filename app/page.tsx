import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import ReferenceCard from '@/components/ReferenceCard'
import type { Category, Language, Reference } from '@/lib/types'

interface SearchParams {
  categoria?: Category
  idioma?: Language
  q?: string
}

async function ReferenceGrid({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()

  let query = supabase
    .from('references')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (searchParams.categoria) {
    query = query.eq('category', searchParams.categoria)
  }

  if (searchParams.idioma) {
    query = query.eq('language', searchParams.idioma)
  }

  if (searchParams.q) {
    query = query.ilike('content', `%${searchParams.q}%`)
  }

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

  return (
    <main className="max-w-[1400px] mx-auto px-5 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border">
        {(references as Reference[]).map((ref) => (
          <div key={ref.id} className="bg-bg">
            <ReferenceCard reference={ref} />
          </div>
        ))}
      </div>

      <p className="mt-8 text-2xs text-faint text-center uppercase tracking-widest">
        {references.length} {references.length === 1 ? 'referência' : 'referências'}
      </p>
    </main>
  )
}

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
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
        <ReferenceGrid searchParams={searchParams} />
      </Suspense>
    </>
  )
}
