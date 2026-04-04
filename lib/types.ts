export type Category =
  | 'manifesto'
  | 'tom-de-voz'
  | 'tagline'
  | 'redacao'
  | 'email'
  | 'naming'
  | 'ooh'

export type Language = 'pt' | 'en' | 'es'

export type Status = 'published' | 'draft' | 'archived'

export interface Reference {
  id: string
  slug: string
  title: string | null
  content: string
  brand_name: string
  brand_logo_url: string | null
  image_url: string | null
  category: Category
  language: Language
  industry: string | null
  year: number | null
  agency: string | null
  source_url: string | null
  tags: string[]
  status: Status
  created_at: string
  updated_at: string
}

export type ReferenceInsert = Omit<Reference, 'id' | 'created_at' | 'updated_at'>
export type ReferenceUpdate = Partial<ReferenceInsert>
