-- ============================================================
--  ROSWEL — JOURNAL DES APPELS À L'API GOOGLE PLACES
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  Réexécutable sans danger.
--
--  À QUOI ÇA SERT
--  --------------
--  Google Places est la seule dépense variable du projet : chaque
--  appel est facturé au-delà d'une franchise mensuelle gratuite.
--  Jusqu'ici, AUCUN des trois outils qui appellent Google ne laissait
--  de trace exploitable — seulement des lignes dans le terminal, qui
--  disparaissent à la fermeture. Impossible, donc, de répondre à la
--  seule question qui compte : où en suis-je dans le quota du mois ?
--
--  Cette table répond à cette question. Une ligne par LOT d'appels
--  (pas par appel unitaire) : un outil qui passe 32 recherches et
--  28 lectures d'avis écrit deux lignes, une par type d'appel.
--
--  ⚠️ ATTENTION AU SENS DE CE JOURNAL
--  ----------------------------------
--  Il ne connaît que les appels passés DEPUIS SA MISE EN PLACE.
--  Tout ce qui a été consommé avant reste visible uniquement sur la
--  console Google Cloud, qui fait seule autorité sur la facture :
--  https://console.cloud.google.com/google/maps-apis/metrics
--
--  LES TROIS TYPES D'APPEL (voir TYPES_APPEL_GOOGLE dans
--  src/config/roswel.ts, qui porte les franchises et les tarifs) :
--    recherche       palier Pro         — chercher une fiche, sans la note
--    recherche_avis  palier Enterprise  — chercher une fiche AVEC la note
--    details_avis    palier Enterprise  — lire la note et le nombre d'avis
--
--  Les franchises ne sont JAMAIS mutualisées : chaque type d'appel a
--  la sienne. D'où la colonne `type_appel`, sans laquelle un total
--  global n'apprendrait rien.
-- ============================================================

create table if not exists journal_appels_google (
  id uuid primary key default gen_random_uuid(),

  -- QUAND. Sert à découper par mois calendaire, comme Google.
  appele_le timestamptz not null default now(),

  -- QUI a appelé : 'google-prospects', 'avis-google',
  -- 'cron-avis-google' (clés de OUTILS_GOOGLE dans roswel.ts).
  -- Volontairement du texte libre et non une énumération : ajouter un
  -- outil ne doit pas demander une migration.
  outil text not null,

  -- QUEL TYPE d'appel : c'est lui qui porte la franchise.
  type_appel text not null,

  -- COMBIEN d'appels dans ce lot. Peut valoir 0 : une exécution qui
  -- n'a rien eu à faire est une information, pas un vide.
  nombre_appels integer not null default 0 check (nombre_appels >= 0),

  -- COMMENT ça s'est passé. 'echec' compte quand même dans le quota :
  -- un appel refusé par Google a souvent déjà été facturé.
  resultat text not null default 'ok'
    check (resultat in ('ok', 'partiel', 'echec')),

  -- LE TARIF APPLIQUÉ au moment de l'appel, en euros. Figé ici plutôt
  -- que relu dans roswel.ts : le jour où Google change ses prix, le
  -- passé doit rester lisible avec les prix de l'époque.
  cout_unitaire_euro numeric(10, 5) not null default 0,

  -- Contexte libre (filtre utilisé, message d'erreur…). Jamais de
  -- donnée personnelle.
  detail text
);

-- Le découpage par mois et la lecture du mois courant : deux index
-- qui couvrent toutes les requêtes de /admin/consommation-google.
create index if not exists idx_journal_google_date
  on journal_appels_google (appele_le desc);

create index if not exists idx_journal_google_type
  on journal_appels_google (type_appel, appele_le desc);

-- ------------------------------------------------------------
--  SÉCURITÉ : personne, sauf le serveur
-- ------------------------------------------------------------
--  Ce journal n'a aucune raison d'être lisible depuis un navigateur.
--  On active RLS SANS écrire la moindre règle : le résultat est un
--  refus pour tout le monde. La clé SECRÈTE utilisée côté serveur
--  (SUPABASE_SECRET_KEY) passe outre RLS — c'est elle, et elle seule,
--  qui écrit et lit cette table.
alter table journal_appels_google enable row level security;

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif) — à exécuter après coup
-- ------------------------------------------------------------
--  select type_appel,
--         sum(nombre_appels) as appels,
--         count(*)           as lots
--    from journal_appels_google
--   where appele_le >= date_trunc('month', now())
--   group by type_appel
--   order by appels desc;
