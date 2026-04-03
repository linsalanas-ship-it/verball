'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CATEGORIES, LANGUAGES } from '@/lib/constants'
import type { Category, Language } from '@/lib/types'

export default function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const activeCategory = params.get('categoria') as Category | null
  const activeLanguage = params.get('idioma') as Language | null

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (value === null || next.get(key) === value) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="border-b border-border sticky top-11 bg-bg z-30">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex items-center gap-6 py-2.5 overflow-x-auto scrollbar-none">
          {/* Category filters */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
              ([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setParam('categoria', key)}
                  className={`text-2xs uppercase tracking-[0.06em] px-2.5 py-1 rounded-sm border transition-colors duration-100 whitespace-nowrap ${
                    activeCategory === key
                      ? 'border-ink bg-ink text-bg'
                      : 'border-border text-muted hover:border-border-hover hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              )
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-border shrink-0" />

          {/* Language filters */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(Object.entries(LANGUAGES) as [Language, (typeof LANGUAGES)[Language]][]).map(
              ([key, lang]) => (
                <button
                  key={key}
                  onClick={() => setParam('idioma', key)}
                  className={`text-2xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-sm border transition-colors duration-100 ${
                    activeLanguage === key
                      ? 'border-ink bg-ink text-bg'
                      : 'border-border hover:border-border-hover'
                  }`}
                  style={
                    activeLanguage !== key ? { color: lang.color } : undefined
                  }
                >
                  {lang.label}
                </button>
              )
            )}
          </div>

          {/* Clear */}
          {(activeCategory || activeLanguage) && (
            <>
              <div className="w-px h-4 bg-border shrink-0" />
              <button
                onClick={() => router.push(pathname, { scroll: false })}
                className="text-2xs text-muted hover:text-ink uppercase tracking-wider transition-colors shrink-0"
              >
                Limpar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
