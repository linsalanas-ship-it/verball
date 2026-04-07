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

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (next.get(key) === value) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const hasActive = activeCategory || activeLanguage

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Categories */}
      {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
        ([key, cat]) => (
          <button
            key={key}
            onClick={() => setParam('categoria', key)}
            className={`text-2xs px-2 py-1 transition-colors duration-100 whitespace-nowrap rounded-sm ${
              activeCategory === key
                ? 'text-bg'
                : 'text-muted hover:text-ink'
            }`}
            style={
              activeCategory === key
                ? { backgroundColor: cat.color }
                : undefined
            }
          >
            {cat.label}
          </button>
        )
      )}

      <span className="text-faint text-2xs px-1">|</span>

      {/* Languages */}
      {(Object.entries(LANGUAGES) as [Language, (typeof LANGUAGES)[Language]][]).map(
        ([key, lang]) => (
          <button
            key={key}
            onClick={() => setParam('idioma', key)}
            className={`text-2xs font-semibold px-2 py-1 transition-colors duration-100 rounded-sm ${
              activeLanguage === key ? 'text-bg' : 'text-muted hover:text-ink'
            }`}
            style={
              activeLanguage === key
                ? { backgroundColor: lang.color }
                : { color: lang.color }
            }
          >
            {lang.label}
          </button>
        )
      )}

      {/* Clear */}
      {hasActive && (
        <>
          <span className="text-faint text-2xs px-1">|</span>
          <button
            onClick={() => router.push(pathname, { scroll: false })}
            className="text-2xs text-faint hover:text-muted transition-colors"
          >
            Limpar
          </button>
        </>
      )}
    </div>
  )
}
