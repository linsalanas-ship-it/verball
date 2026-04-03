import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReferenceForm from '@/components/ReferenceForm'
import type { Reference } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function EditarPage({ params }: Props) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('references')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  return (
    <main className="max-w-[1400px] mx-auto px-5 py-8">
      <h1 className="text-sm font-semibold mb-8">
        Editar —{' '}
        <span className="font-normal text-muted">{(data as Reference).brand_name}</span>
      </h1>
      <ReferenceForm initial={data as Reference} />
    </main>
  )
}
