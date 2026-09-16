-- =========================================================
-- TRIZEN - DATABASE SCHEMA
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- PROFILES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null
    check (role in ('ADMIN', 'TEAM_MEMBER')),
  created_at timestamptz not null default now()
);

-- =========================================================
-- EVENTS
-- =========================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_date date not null,
  location text,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'ACTIVE', 'COMPLETED')),
  created_by uuid not null
    references public.profiles(id)
    on delete cascade,
  created_at timestamptz not null default now()
);

-- =========================================================
-- EVENT MEMBERS
-- =========================================================

create table if not exists public.event_members (
  event_id uuid not null
    references public.events(id)
    on delete cascade,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  assigned_at timestamptz not null default now(),

  primary key (event_id, user_id)
);

-- =========================================================
-- PHOTOS
-- =========================================================

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.events(id)
    on delete cascade,

  uploaded_by uuid not null
    references public.profiles(id)
    on delete cascade,

  storage_path text not null,
  file_name text not null,
  file_size bigint,
  created_at timestamptz not null default now()
);

-- =========================================================
-- GALLERIES
-- =========================================================

create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.events(id)
    on delete cascade,

  customer_name text not null,

  public_token text not null unique,

  pin text,

  pin_hash text not null,

  published boolean not null default false,

  created_at timestamptz not null default now()
);

-- =========================================================
-- GALLERY PHOTOS
-- =========================================================

create table if not exists public.gallery_photos (
  gallery_id uuid not null
    references public.galleries(id)
    on delete cascade,

  photo_id uuid not null
    references public.photos(id)
    on delete cascade,

  added_at timestamptz not null default now(),

  primary key (gallery_id, photo_id)
);

-- =========================================================
-- STORAGE BUCKET
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'event-photos',
  'event-photos',
  false
)
on conflict (id) do nothing;

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
  );
$$;

create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'TEAM_MEMBER'
  );
$$;

-- =========================================================
-- NEW USER -> PROFILE
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    role
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      'TRIZEN User'
    ),
    'TEAM_MEMBER'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.photos enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_photos enable row level security;

-- =========================================================
-- PROFILES POLICIES
-- =========================================================

drop policy if exists "profiles_admin_select"
on public.profiles;

create policy "profiles_admin_select"
on public.profiles
for select
to authenticated
using (
  public.is_admin()
);

drop policy if exists "profiles_self_select"
on public.profiles;

create policy "profiles_self_select"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
);

-- =========================================================
-- EVENTS POLICIES
-- =========================================================

drop policy if exists "events_admin_all"
on public.events;

create policy "events_admin_all"
on public.events
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

drop policy if exists "events_team_member_select_assigned"
on public.events;

create policy "events_team_member_select_assigned"
on public.events
for select
to authenticated
using (
  public.is_team_member()
  and exists (
    select 1
    from public.event_members em
    where em.event_id = events.id
      and em.user_id = auth.uid()
  )
);

-- =========================================================
-- EVENT MEMBERS POLICIES
-- =========================================================

drop policy if exists "event_members_admin_all"
on public.event_members;

create policy "event_members_admin_all"
on public.event_members
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

drop policy if exists "event_members_team_member_select_own"
on public.event_members;

create policy "event_members_team_member_select_own"
on public.event_members
for select
to authenticated
using (
  user_id = auth.uid()
);

-- =========================================================
-- PHOTOS POLICIES
-- =========================================================

drop policy if exists "photos_admin_all"
on public.photos;

create policy "photos_admin_all"
on public.photos
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

drop policy if exists "photos_team_member_select_assigned"
on public.photos;

create policy "photos_team_member_select_assigned"
on public.photos
for select
to authenticated
using (
  public.is_team_member()
  and exists (
    select 1
    from public.event_members em
    where em.event_id = photos.event_id
      and em.user_id = auth.uid()
  )
);

drop policy if exists "photos_team_member_insert_assigned"
on public.photos;

create policy "photos_team_member_insert_assigned"
on public.photos
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.is_team_member()
  and exists (
    select 1
    from public.event_members em
    where em.event_id = photos.event_id
      and em.user_id = auth.uid()
  )
);

-- =========================================================
-- GALLERIES POLICIES
-- =========================================================

drop policy if exists "galleries_admin_all"
on public.galleries;

create policy "galleries_admin_all"
on public.galleries
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- Customers do NOT get direct SELECT access.
-- PIN verification is handled server-side.

-- =========================================================
-- GALLERY PHOTOS POLICIES
-- =========================================================

drop policy if exists "gallery_photos_admin_all"
on public.gallery_photos;

create policy "gallery_photos_admin_all"
on public.gallery_photos
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- =========================================================
-- STORAGE POLICIES
-- =========================================================

drop policy if exists "event_photos_admin_all"
on storage.objects;

create policy "event_photos_admin_all"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'event-photos'
  and public.is_admin()
)
with check (
  bucket_id = 'event-photos'
  and public.is_admin()
);

drop policy if exists "event_photos_team_member_insert"
on storage.objects;

create policy "event_photos_team_member_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-photos'
  and public.is_team_member()
);

drop policy if exists "event_photos_team_member_select"
on storage.objects;

create policy "event_photos_team_member_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'event-photos'
  and public.is_team_member()
);

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_events_created_by
on public.events(created_by);

create index if not exists idx_events_event_date
on public.events(event_date);

create index if not exists idx_event_members_user_id
on public.event_members(user_id);

create index if not exists idx_event_members_event_id
on public.event_members(event_id);

create index if not exists idx_photos_event_id
on public.photos(event_id);

create index if not exists idx_photos_uploaded_by
on public.photos(uploaded_by);

create index if not exists idx_galleries_event_id
on public.galleries(event_id);

create index if not exists idx_galleries_public_token
on public.galleries(public_token);

create index if not exists idx_galleries_published
on public.galleries(published);

create index if not exists idx_gallery_photos_gallery_id
on public.gallery_photos(gallery_id);

create index if not exists idx_gallery_photos_photo_id
on public.gallery_photos(photo_id);