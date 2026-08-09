-- ============================================================
-- YOKOFOLIO — LES MESSAGES DE CONTACT (/contact)
-- ============================================================
-- À passer APRÈS yokofolio-signalements.sql (12e et dernière de la
-- chaîne).
--
-- La trace des messages du formulaire /contact de yokofolio : le nom,
-- l'e-mail (pour répondre), le message, l'adresse IP (le garde-fou
-- anti-abus : au plus quelques envois par IP et par jour — voir
-- CONTACT_YOKOFOLIO dans src/config/tatouage.ts). Chaque message est
-- AUSSI transmis par e-mail à l'exploitant (CONTACT_EMAIL).
-- RLS activée sans règle publique : seule l'API du site écrit et lit.
-- Rejouable sans dommage.

create table if not exists public.messages_yokofolio (
  id bigint generated always as identity primary key,
  nom text not null,
  email text not null,
  message text not null,
  ip text,
  traite boolean not null default false,
  cree_le timestamptz not null default now()
);

create index if not exists messages_yokofolio_par_ip
  on public.messages_yokofolio (ip, cree_le desc);

alter table public.messages_yokofolio enable row level security;

comment on table public.messages_yokofolio is
  'Messages du formulaire /contact de yokofolio. Accès uniquement par l''API du site.';
