-- =====================================================================
--  L'AMORCE SUPABASE — ce que le tableau de bord fournit AVANT nos
--  migrations, et que nos fichiers tiennent pour acquis.
--  (banc d'essai seulement — jamais livré, jamais joué sur la vraie base)
-- =====================================================================

--  LES RÔLES de Supabase.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

--  LE SCHÉMA `auth` — sa table des comptes et `auth.uid()`.
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claim.sub', true), ''
  )::uuid;
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

--  LE SCHÉMA `storage` — les seaux, les objets, et `foldername()`.
create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
language sql immutable
as $$
  select string_to_array(name, '/');
$$;

grant usage on schema storage to anon, authenticated, service_role;

--  L'HÉRITAGE DU PRODUIT « ARTISANS » — `tatoueurs.sql` ajoute une
--  colonne à `favoris`, qui existe déjà chez le propriétaire.
create table if not exists public.particuliers (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.artisans (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.favoris (
  id uuid primary key default gen_random_uuid(),
  particulier_id uuid references public.particuliers(id) on delete cascade,
  artisan_id uuid references public.artisans(id) on delete cascade,
  cree_le timestamptz not null default now()
);
