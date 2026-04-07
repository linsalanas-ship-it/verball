import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReferenceForm from '@/components/ReferenceForm'
import type { Reference } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function EditarPage({ params }: Props) {
  const supabase = createClient()

  const [{ data, error }, { data: imagesData }] = await Promise.all([
    supabase.from('references').select('*').eq('id', params.id).single(),
    supabase
      .from('reference_images')
      .select('image_url')
      .eq('reference_id', params.id)
      .order('position'),
  ])

  if (error || !data) notFound()

  const initialImages = imagesData?.map((r) => r.image_url) ?? []

  // Fallback: if no reference_images yet, use image_url from reference
  const images =
    initialImages.length > 0
      ? initialImages
      : (data as Reference).image_url
      ? [(data as Reference).image_url!]
      : []

  return (
    <main className="max-w-[1400px] mx-auto px-5 py-8">
      <h1 className="text-sm font-semibold mb-8">
        Editar — <span className="font-normal text-muted">{(data as Reference).brand_name}</span>
      </h1>
      <ReferenceForm initial={data as Reference} initialImages={images} />
    </main>
  )
}
