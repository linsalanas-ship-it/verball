-- Verball — schema
-- Run this in your Supabase SQL editor

create table if not exists public.references (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text,
  content text not null,
  brand_name text not null,
  brand_logo_url text,
  category text not null check (
    category in ('manifesto', 'tom-de-voz', 'tagline', 'redacao', 'email', 'naming', 'ooh')
  ),
  language text not null check (language in ('pt', 'en', 'es')),
  industry text,
  year integer,
  agency text,
  source_url text,
  tags text[] default '{}',
  status text not null default 'published' check (
    status in ('published', 'draft', 'archived')
  ),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index if not exists references_status_idx on public.references (status);
create index if not exists references_category_idx on public.references (category);
create index if not exists references_language_idx on public.references (language);
create index if not exists references_created_at_idx on public.references (created_at desc);

-- Full-text search index on content
create index if not exists references_content_fts on public.references
  using gin (to_tsvector('simple', content));

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_references_updated_at on public.references;
create trigger set_references_updated_at
  before update on public.references
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.references enable row level security;

-- Public can read published references
create policy "Published references are public"
  on public.references for select
  using (status = 'published');

-- Authenticated users (admin) can do everything
create policy "Authenticated users have full access"
  on public.references for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
