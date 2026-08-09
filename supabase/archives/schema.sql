-- ============================================================
--  ROSWEL — SCHÉMA DE LA BASE DE DONNÉES (étape 2)
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  Ce script peut être exécuté plusieurs fois sans danger :
--  il ne détruit jamais rien, il crée seulement ce qui manque.
-- ============================================================


-- ============================================================
-- 1. TABLE artisans — la fiche complète de chaque artisan
-- ============================================================
create table if not exists public.artisans (
  id uuid primary key default gen_random_uuid(),

  -- Compte de connexion de l'artisan (lien vers l'authentification)
  user_id uuid unique references auth.users (id) on delete cascade,

  -- Identité affichée (libre : nom de personne ou de société)
  nom_affiche text not null,
  photo_url text,                -- photo personnelle (visage), obligatoire à la validation
  bio text,                      -- bio courte (longueur limitée côté site)
  horaires jsonb,                -- ex. {"lundi": "8h-18h", "mardi": "8h-18h", ...}

  -- Contacts (tous OPTIONNELS pour l'artisan)
  telephone text,
  whatsapp text,

  -- Entreprise (vérification via l'API Sirene de l'INSEE)
  siret text,
  siret_verifie boolean not null default false,
  date_creation_entreprise date, -- sert à afficher l'ancienneté (jamais dans le score)

  -- Zone d'intervention : adresse + point GPS + rayon
  adresse text,
  latitude double precision,
  longitude double precision,
  rayon_intervention_km integer not null default 25,
  communes_exclues text[] not null default '{}',  -- codes INSEE à exclure (option avancée)

  -- Site internet personnel (FACULTATIF : la fiche Roswel suffit)
  site_internet text,

  -- Instagram (saisi manuellement par l'admin au lancement)
  lien_instagram text,
  abonnes_instagram integer,
  publications_instagram integer,
  date_maj_instagram timestamptz, -- date de dernière mise à jour (alerte à 30 jours)

  -- Avis Google (via l'API Google Places, rafraîchis régulièrement)
  note_google numeric(2, 1),      -- ex. 4.7
  nombre_avis_google integer,
  place_id_google text,           -- identifiant de la fiche Google

  -- Disponibilités
  dispo_urgence boolean not null default false,   -- urgence 24/7
  dispo_nuit boolean not null default false,
  dispo_weekend boolean not null default false,
  dispo_feries boolean not null default false,

  -- Score de confiance (calculé par le site, jamais saisi)
  score_total integer not null default 0,         -- sur 100
  pastille text check (pastille in ('recommande', 'top')),  -- vide si score < seuil

  -- Cycle de validation par l'admin
  statut_validation text not null default 'en_attente'
    check (statut_validation in ('en_attente', 'valide', 'modifications_demandees')),

  cree_le timestamptz not null default now()
);

-- ============================================================
-- 2. TABLE artisan_metiers — les métiers de chaque artisan
--    (un artisan peut en cumuler plusieurs)
-- ============================================================
create table if not exists public.artisan_metiers (
  artisan_id uuid not null references public.artisans (id) on delete cascade,
  metier text not null,  -- slug du métier : voir src/config/roswel.ts (ex. 'plombier')
  primary key (artisan_id, metier)
);

-- ============================================================
-- 3. TABLE communes — toutes les communes de France
--    (remplie à l'étape 3 via geo.api.gouv.fr)
-- ============================================================
create table if not exists public.communes (
  code_insee text primary key,
  nom text not null,
  slug text not null,             -- version pour les adresses web (ex. 'villeurbanne')
  codes_postaux text[] not null default '{}',
  code_departement text,
  code_region text,
  latitude double precision,
  longitude double precision
);

-- ============================================================
-- 4. TABLE particuliers — le profil des clients
--    L'email reste UNIQUEMENT dans le système d'authentification :
--    il n'est jamais copié ici, donc jamais visible d'un artisan.
-- ============================================================
create table if not exists public.particuliers (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text,
  telephone text,   -- sert à pré-remplir le formulaire de message
  cree_le timestamptz not null default now()
);

-- ============================================================
-- 5. TABLE favoris — les artisans enregistrés par un particulier
-- ============================================================
create table if not exists public.favoris (
  particulier_id uuid not null references public.particuliers (id) on delete cascade,
  artisan_id uuid not null references public.artisans (id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (particulier_id, artisan_id)
);

-- ============================================================
-- 6. TABLE conversations — une conversation par demande
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans (id) on delete cascade,
  particulier_id uuid not null references public.particuliers (id) on delete cascade,
  ville text,                     -- ville d'intervention indiquée dans la demande
  urgence boolean not null default false,
  telephone_contact text,         -- téléphone laissé pour CETTE demande (modifiable)
  statut text not null default 'ouverte'
    check (statut in ('ouverte', 'fermee')),
  cree_le timestamptz not null default now()
);

-- ============================================================
-- 7. TABLE messages — les échanges à l'intérieur d'une conversation
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  expediteur text not null check (expediteur in ('particulier', 'artisan')),
  texte text not null,
  photos text[] not null default '{}',  -- adresses des photos jointes (1 à 5)
  envoye_le timestamptz not null default now(),
  lu_le timestamptz                     -- date de lecture (sert à la pastille "non lu"
                                        -- et au calcul de la rapidité de réponse)
);

-- ============================================================
-- FONCTION distance_km — distance à vol d'oiseau entre 2 points GPS
-- (utilisée par la recherche : artisans dont la zone couvre la ville)
-- ============================================================
create or replace function public.distance_km(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql
immutable
as $$
  select 6371 * acos(
    least(1, greatest(-1,
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1))
      + sin(radians(lat1)) * sin(radians(lat2))
    ))
  );
$$;

-- ============================================================
-- INDEX — pour que les recherches restent rapides
-- ============================================================
create index if not exists artisans_statut_idx on public.artisans (statut_validation);
create index if not exists artisan_metiers_metier_idx on public.artisan_metiers (metier);
create index if not exists communes_slug_idx on public.communes (slug);
create index if not exists conversations_artisan_idx on public.conversations (artisan_id);
create index if not exists conversations_particulier_idx on public.conversations (particulier_id);
create index if not exists messages_conversation_idx on public.messages (conversation_id, envoye_le);

-- ============================================================
-- SÉCURITÉ (RLS) — qui a le droit de voir / modifier quoi
-- ------------------------------------------------------------
-- La clé utilisée par le site est publique : c'est donc la base
-- elle-même qui fait respecter les règles ci-dessous, pour
-- chaque ligne de chaque table. L'interface admin (plus tard)
-- utilisera la clé secrète, qui n'est pas soumise à ces règles.
-- ============================================================
alter table public.artisans enable row level security;
alter table public.artisan_metiers enable row level security;
alter table public.communes enable row level security;
alter table public.particuliers enable row level security;
alter table public.favoris enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- ----- artisans ---------------------------------------------
-- Tout le monde peut voir les fiches VALIDÉES (essentiel pour le
-- référencement) ; un artisan voit toujours sa propre fiche.
drop policy if exists "artisans_lecture_publique" on public.artisans;
create policy "artisans_lecture_publique" on public.artisans
  for select using (statut_validation = 'valide' or auth.uid() = user_id);

drop policy if exists "artisans_creation_par_soi" on public.artisans;
create policy "artisans_creation_par_soi" on public.artisans
  for insert with check (auth.uid() = user_id);

drop policy if exists "artisans_modification_par_soi" on public.artisans;
create policy "artisans_modification_par_soi" on public.artisans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Un artisan ne peut modifier QUE ses informations descriptives.
-- Les champs sensibles (score, pastille, statut de validation,
-- données Instagram/Google, vérification SIRET) restent réservés
-- au site et à l'admin.
revoke insert, update on table public.artisans from anon, authenticated;
grant insert (
  user_id, nom_affiche, photo_url, bio, horaires, telephone, whatsapp,
  siret, adresse, latitude, longitude, rayon_intervention_km,
  communes_exclues, lien_instagram, site_internet,
  dispo_urgence, dispo_nuit, dispo_weekend, dispo_feries
) on public.artisans to authenticated;
grant update (
  nom_affiche, photo_url, bio, horaires, telephone, whatsapp,
  siret, adresse, latitude, longitude, rayon_intervention_km,
  communes_exclues, lien_instagram, site_internet,
  dispo_urgence, dispo_nuit, dispo_weekend, dispo_feries
) on public.artisans to authenticated;

-- ----- artisan_metiers --------------------------------------
drop policy if exists "metiers_lecture_publique" on public.artisan_metiers;
create policy "metiers_lecture_publique" on public.artisan_metiers
  for select using (
    exists (
      select 1 from public.artisans a
      where a.id = artisan_id
        and (a.statut_validation = 'valide' or a.user_id = auth.uid())
    )
  );

drop policy if exists "metiers_gestion_par_artisan" on public.artisan_metiers;
create policy "metiers_gestion_par_artisan" on public.artisan_metiers
  for all using (
    exists (
      select 1 from public.artisans a
      where a.id = artisan_id and a.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.artisans a
      where a.id = artisan_id and a.user_id = auth.uid()
    )
  );

-- ----- communes ---------------------------------------------
-- Données publiques (lecture seule ; l'import utilise la clé secrète)
drop policy if exists "communes_lecture_publique" on public.communes;
create policy "communes_lecture_publique" on public.communes
  for select using (true);

-- ----- particuliers -----------------------------------------
-- Chacun gère uniquement son propre profil…
drop policy if exists "particuliers_son_profil" on public.particuliers;
create policy "particuliers_son_profil" on public.particuliers
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- …et un artisan peut voir le prénom/téléphone des particuliers
-- qui lui ont écrit (jamais leur email : il n'est pas dans la table).
drop policy if exists "particuliers_vus_par_artisan_contacte" on public.particuliers;
create policy "particuliers_vus_par_artisan_contacte" on public.particuliers
  for select using (
    exists (
      select 1
      from public.conversations c
      join public.artisans a on a.id = c.artisan_id
      where c.particulier_id = particuliers.id
        and a.user_id = auth.uid()
    )
  );

-- ----- favoris ----------------------------------------------
drop policy if exists "favoris_les_siens" on public.favoris;
create policy "favoris_les_siens" on public.favoris
  for all using (auth.uid() = particulier_id) with check (auth.uid() = particulier_id);

-- ----- conversations ----------------------------------------
-- Visibles uniquement par les deux participants
drop policy if exists "conversations_participants_lecture" on public.conversations;
create policy "conversations_participants_lecture" on public.conversations
  for select using (
    auth.uid() = particulier_id
    or exists (
      select 1 from public.artisans a
      where a.id = artisan_id and a.user_id = auth.uid()
    )
  );

-- Seul un particulier connecté peut ouvrir une conversation,
-- et uniquement vers un artisan validé.
drop policy if exists "conversations_ouverture_par_particulier" on public.conversations;
create policy "conversations_ouverture_par_particulier" on public.conversations
  for insert with check (
    auth.uid() = particulier_id
    and exists (
      select 1 from public.artisans a
      where a.id = artisan_id and a.statut_validation = 'valide'
    )
  );

-- Les participants peuvent changer le statut (ouverte/fermée)…
drop policy if exists "conversations_participants_maj" on public.conversations;
create policy "conversations_participants_maj" on public.conversations
  for update using (
    auth.uid() = particulier_id
    or exists (
      select 1 from public.artisans a
      where a.id = artisan_id and a.user_id = auth.uid()
    )
  );

-- …mais UNIQUEMENT le statut (pas la ville, le téléphone, etc.)
revoke update on table public.conversations from anon, authenticated;
grant update (statut) on public.conversations to authenticated;

-- ----- messages ---------------------------------------------
-- Lisibles uniquement par les participants de la conversation
drop policy if exists "messages_participants_lecture" on public.messages;
create policy "messages_participants_lecture" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          c.particulier_id = auth.uid()
          or exists (
            select 1 from public.artisans a
            where a.id = c.artisan_id and a.user_id = auth.uid()
          )
        )
    )
  );

-- Chacun ne peut écrire que dans ses conversations, et avec
-- sa propre casquette ('particulier' ou 'artisan').
drop policy if exists "messages_envoi_par_participant" on public.messages;
create policy "messages_envoi_par_participant" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          (expediteur = 'particulier' and c.particulier_id = auth.uid())
          or (
            expediteur = 'artisan'
            and exists (
              select 1 from public.artisans a
              where a.id = c.artisan_id and a.user_id = auth.uid()
            )
          )
        )
    )
  );

-- Les participants peuvent marquer un message comme lu…
drop policy if exists "messages_participants_maj" on public.messages;
create policy "messages_participants_maj" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          c.particulier_id = auth.uid()
          or exists (
            select 1 from public.artisans a
            where a.id = c.artisan_id and a.user_id = auth.uid()
          )
        )
    )
  );

-- …mais UNIQUEMENT la date de lecture (jamais le texte ni les photos)
revoke update on table public.messages from anon, authenticated;
grant update (lu_le) on public.messages to authenticated;

-- ============================================================
-- FIN — après exécution, vérifier depuis le site :
-- http://localhost:3000/api/verif-supabase
-- ============================================================
