import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, LANGUAGES } from '@/lib/constants'
import type { Reference } from '@/lib/types'
import DeleteButton from './DeleteButton'

export default async function AdminPage() {
  const supabase = createClient()

  const { data: references } = await supabase
    .from('references')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-[1400px] mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-sm font-semibold">
          Referências{' '}
          <span className="text-muted font-normal">({references?.length ?? 0})</span>
        </h1>
        <Link
          href="/admin/nova"
          className="text-xs bg-ink text-bg px-4 py-2 uppercase tracking-widest hover:bg-ink/80 transition-colors"
        >
          + Nova
        </Link>
      </div>

      <div className="border border-border divide-y divide-border">
        {!references || references.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">
            Nenhuma referência ainda.{' '}
            <Link href="/admin/nova" className="underline">
              Adicionar primeira.
            </Link>
          </div>
        ) : (
          (references as Reference[]).map((ref) => {
            const category = CATEGORIES[ref.category]
            const language = LANGUAGES[ref.language]

            return (
              <div
                key={ref.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-surface transition-colors group"
              >
                {/* Status dot */}
                <div className="pt-1 shrink-0">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      ref.status === 'published'
                        ? 'bg-green-500'
                        : ref.status === 'draft'
                        ? 'bg-yellow-400'
                        : 'bg-faint'
                    }`}
                  />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {ref.brand_name}
                    </span>
                    <span
                      className="text-2xs uppercase tracking-wide px-1.5 py-0.5 rounded-sm"
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
                    {ref.year && (
                      <span className="text-2xs text-muted">{ref.year}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                    {ref.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/ref/${ref.slug}`}
                    target="_blank"
                    className="text-2xs text-muted hover:text-ink uppercase tracking-wider transition-colors"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/admin/editar/${ref.id}`}
                    className="text-2xs text-muted hover:text-ink uppercase tracking-wider transition-colors"
                  >
                    Editar
                  </Link>
                  <DeleteButton id={ref.id} brandName={ref.brand_name} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
