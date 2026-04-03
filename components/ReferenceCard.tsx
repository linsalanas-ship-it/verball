import Link from 'next/link'
import { CATEGORIES, LANGUAGES } from '@/lib/constants'
import type { Reference } from '@/lib/types'

interface Props {
  reference: Reference
}

export default function ReferenceCard({ reference }: Props) {
  const category = CATEGORIES[reference.category]
  const language = LANGUAGES[reference.language]

  return (
    <Link
      href={`/ref/${reference.slug}`}
      className="group block border border-border hover:border-border-hover transition-colors duration-150 bg-bg"
    >
      <div className="p-5">
        {/* Top row: brand + category */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
            {reference.brand_name}
          </span>
          <span
            className="text-2xs uppercase tracking-[0.08em] font-medium px-2 py-0.5 rounded-sm shrink-0"
            style={{ color: category.color, backgroundColor: category.bg }}
          >
            {category.label}
          </span>
        </div>

        {/* Content */}
        <p className="text-[15px] leading-relaxed text-ink line-clamp-6 whitespace-pre-line">
          {reference.content}
        </p>

        {/* Meta */}
        <div className="mt-4 flex items-center gap-2 text-2xs text-muted">
          <span
            className="font-semibold uppercase tracking-wider"
            style={{ color: language.color }}
          >
            {language.label}
          </span>

          {reference.year && (
            <>
              <span className="text-faint">·</span>
              <span>{reference.year}</span>
            </>
          )}

          {reference.industry && (
            <>
              <span className="text-faint">·</span>
              <span>{reference.industry}</span>
            </>
          )}

          {reference.agency && (
            <>
              <span className="text-faint">·</span>
              <span className="truncate max-w-[120px]">{reference.agency}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
