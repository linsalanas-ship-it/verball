'use client'

import { useState, useEffect, useCallback } from 'react'

interface ImageLightboxProps {
  images: string[]
  altBase?: string
}

export default function ImageLightbox({ images, altBase = '' }: ImageLightboxProps) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const close = useCallback(() => setOpen(false), [])

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, prev, next])

  function openAt(i: number) {
    setIndex(i)
    setOpen(true)
  }

  if (images.length === 0) return null

  return (
    <>
      {/* Gallery grid */}
      {images.length === 1 ? (
        <div
          className="w-full border border-border overflow-hidden cursor-zoom-in"
          style={{ maxHeight: '480px' }}
          onClick={() => openAt(0)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt={altBase}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: images.length >= 3 ? '2fr 1fr' : '1fr 1fr' }}>
          {/* First image — large */}
          <div
            className="border border-border overflow-hidden cursor-zoom-in"
            style={{ gridRow: images.length > 2 ? 'span 2' : 'span 1', maxHeight: '400px' }}
            onClick={() => openAt(0)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={altBase}
              className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
              style={{ height: '100%', minHeight: '200px' }}
            />
          </div>
          {/* Remaining images */}
          {images.slice(1, images.length >= 3 ? 3 : 2).map((url, i) => (
            <div
              key={url + i}
              className="border border-border overflow-hidden cursor-zoom-in"
              style={{ height: '195px' }}
              onClick={() => openAt(i + 1)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          ))}
          {/* Extra images below */}
          {images.length > 3 && (
            <div className="col-span-full grid grid-cols-3 gap-1.5">
              {images.slice(3).map((url, i) => (
                <div
                  key={url + i}
                  className="border border-border overflow-hidden cursor-zoom-in"
                  style={{ height: '160px' }}
                  onClick={() => openAt(i + 3)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index]}
            alt={altBase}
            className="max-w-[90vw] max-h-[90vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl leading-none transition-colors px-2"
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl leading-none transition-colors px-2"
                aria-label="Próxima"
              >
                ›
              </button>
              {/* Counter */}
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-widest">
                {index + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </>
  )
}
