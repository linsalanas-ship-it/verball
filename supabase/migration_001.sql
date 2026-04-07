-- Verball — Migration 001
-- Run this in the Supabase SQL Editor

-- 1. Update category check constraint
alter table public.references
  drop constraint if exists references_category_check;

alter table public.references
  add constraint references_category_check
  check (category in (
    'manifesto',
    'identidade-verbal',
    'copywriting',
    'poesia',
    'email',
    'naming',
    'ooh'
  ));

-- 2. Migrate existing references with old category values
update public.references set category = 'copywriting'       where category in ('tagline', 'redacao');
update public.references set category = 'identidade-verbal' where category = 'tom-de-voz';

-- 3. Create reference_images table
create table if not exists public.reference_images (
  id           uuid        default gen_random_uuid() primary key,
  reference_id uuid        not null references public.references(id) on delete cascade,
  image_url    text        not null,
  position     integer     not null default 0,
  created_at   timestamptz default now() not null
);

create index if not exists reference_images_ref_pos_idx
  on public.reference_images (reference_id, position);

-- 4. RLS for reference_images
alter table public.reference_images enable row level security;

create policy "Images are public"
  on public.reference_images for select
  using (true);

create policy "Authenticated users manage images"
  on public.reference_images for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- 5. Migrate existing image_url values into reference_images
insert into public.reference_images (reference_id, image_url, position)
select id, image_url, 0
from   public.references
where  image_url is not null
  and  id not in (select reference_id from public.reference_images);
