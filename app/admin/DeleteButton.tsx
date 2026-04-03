'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  id: string
  brandName: string
}

export default function DeleteButton({ id, brandName }: Props) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Deletar referência de "${brandName}"?`)) return

    const supabase = createClient()
    await supabase.from('references').delete().eq('id', id)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="text-2xs text-muted hover:text-red-600 uppercase tracking-wider transition-colors"
    >
      Deletar
    </button>
  )
}
