-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 52 : LE DÉMARCHAGE DES TATOUEURS
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 51.
--
--  LE BESOIN. Personne ne remplit un formulaire pour un site inconnu
--  et vide. On prépare donc des portfolios à partir de ce qui est
--  public, on les met en ligne, et on écrit au tatoueur : « c'est
--  prêt, tu le récupères ou tu le fais retirer ». Ce fichier pose ce
--  qu'il faut pour suivre ces envois — RIEN de plus.
--
--  DEUX TABLES, ET LEUR RAISON D'ÊTRE :
--
--   1. `demarchages` — UN ENVOI. C'est le message qu'on a écrit à
--      quelqu'un : son JETON (le lien de rattachement), la DATE
--      D'ENVOI, et ce qu'il est devenu. Un salon à trois fiches ne
--      reçoit qu'UN message : il n'y a donc qu'UNE ligne ici.
--
--   2. `demarchage_fiches` — QUELLES FICHES ce message emporte. C'est
--      le regroupement demandé : on coche plusieurs fiches d'un même
--      tatoueur, elles partent ensemble et se rattachent ensemble.
--      Le tatoueur ne peut pas en accepter une et refuser l'autre.
--
--  LE JETON. 32 octets tirés au sort par `crypto.randomBytes` côté
--  serveur, écrits en base64url (43 caractères) — voir
--  src/lib/demarchage.ts. Il n'a AUCUN rapport avec l'identifiant de
--  la fiche : on ne peut pas deviner le lien du voisin en essayant le
--  suivant. C'est la seule serrure de la page de rattachement, et
--  c'est assumé (le lien arrive dans la messagerie du tatoueur).
--
--  PAS D'EXPIRATION. Le lien vaut tant que l'administrateur ne retire
--  pas la fiche. Un lien qui périme oblige à en renvoyer un, donc à
--  réécrire ; on préfère qu'il tienne.
--
--  LE STATUT AVANCE TOUT SEUL. L'administrateur ne coche rien :
--   · pas de ligne ici        → À ENVOYER
--   · `envoye_le`             → ENVOYÉ
--   · `rattache_le`           → COMPTE CRÉÉ
--   · `retire_le`             → SUPPRIMÉ
--  La colonne `statut` porte le même mot, écrite par le serveur à
--  chaque transition : elle sert à lire l'état EN SQL sans refaire le
--  raisonnement. L'affichage, lui, se fie aux DATES — deux façons de
--  dire la même chose, dont la plus sûre gagne.
--
--  CE QUI DISPARAÎT DU TABLEAU, ET QUAND : une semaine après le
--  rattachement, trente jours après une suppression. Aucune tâche
--  planifiée : la lecture écarte simplement ce qui est trop vieux
--  (voir l'API). Les lignes restent en base — on veut pouvoir
--  répondre à « qui a-t-on démarché ? » dans six mois.
--
--  SANS RISQUE : deux tables NEUVES, aucune colonne existante touchée,
--  aucune ligne modifiée. Rejouable autant de fois qu'on veut.
-- =====================================================================

-- ---------------------------------------------------------------------
--  1. LES ENVOIS
-- ---------------------------------------------------------------------
create table if not exists public.demarchages (
  id uuid primary key default gen_random_uuid(),

  --  LE LIEN DE RATTACHEMENT. Unique, long, tiré au sort. C'est LUI
  --  qui autorise à rattacher les fiches ET à les supprimer : il ne
  --  doit donc jamais être devinable ni séquentiel.
  jeton text not null unique,

  --  LE MOT DE L'ÉTAT, tenu à jour par le serveur. Les dates
  --  ci-dessous restent la vérité ; celle-ci est là pour qu'une
  --  requête SQL puisse filtrer sans dérouler la logique.
  statut text not null default 'envoye',

  --  LES TROIS DATES QUI FONT AVANCER LE STATUT.
  envoye_le    timestamptz not null default now(),
  rattache_le  timestamptz,
  retire_le    timestamptz,

  --  À QUI les fiches ont été rattachées. Null tant que personne n'a
  --  créé son compte.
  rattache_a uuid references auth.users (id) on delete set null,

  cree_le timestamptz not null default now()
);

comment on table public.demarchages is
  'UN ENVOI DE DÉMARCHAGE : le jeton du lien de rattachement, la date d''envoi, et ce que l''envoi est devenu. Une seule ligne par message écrit, même quand il emporte plusieurs fiches.';
comment on column public.demarchages.jeton is
  'Le lien de rattachement : 32 octets aléatoires en base64url, sans aucun rapport avec l''identifiant des fiches. Seule serrure de la page /rejoindre — jamais séquentiel, jamais devinable.';
comment on column public.demarchages.statut is
  'envoye | compte_cree | supprime. Écrit par le serveur à chaque transition ; les dates (envoye_le, rattache_le, retire_le) restent la source de vérité.';

--  LE GARDE-FOU DU VOCABULAIRE : trois mots, pas un de plus. Un statut
--  mal orthographié par un futur appelant serait refusé ici plutôt que
--  de traverser l'application en silence.
do $migration$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'demarchages_statut_connu'
  ) then
    alter table public.demarchages
      add constraint demarchages_statut_connu
      check (statut in ('envoye', 'compte_cree', 'supprime'));
  end if;
end
$migration$;

--  La lecture par jeton est LE chemin de la page de rattachement :
--  elle doit être immédiate. (La contrainte `unique` pose déjà son
--  index — cette ligne ne fait que le dire.)
create index if not exists idx_demarchages_statut
  on public.demarchages (statut, envoye_le desc);

-- ---------------------------------------------------------------------
--  2. LES FICHES DE CHAQUE ENVOI — le regroupement
-- ---------------------------------------------------------------------
create table if not exists public.demarchage_fiches (
  demarchage_id uuid not null
    references public.demarchages (id) on delete cascade,
  tatoueur_id uuid not null
    references public.tatoueurs (id) on delete cascade,
  primary key (demarchage_id, tatoueur_id)
);

comment on table public.demarchage_fiches is
  'Quelles fiches un envoi de démarchage emporte. Une fiche ne peut appartenir qu''à UN envoi (contrainte plus bas) : une ligne déjà cochée et validée ne peut plus l''être.';

--  ⚠️ UNE FICHE N'APPARTIENT QU'À UN SEUL ENVOI, et la base le tient.
--  Sans cette contrainte, deux clics de suite sur « Valider » créeraient
--  deux jetons pour la même fiche : deux liens vivants, deux façons de
--  la supprimer, et aucun moyen de savoir lequel a servi.
create unique index if not exists idx_demarchage_fiches_unique
  on public.demarchage_fiches (tatoueur_id);

create index if not exists idx_demarchage_fiches_envoi
  on public.demarchage_fiches (demarchage_id);

-- ---------------------------------------------------------------------
--  3. LES DROITS — personne, sauf le serveur
-- ---------------------------------------------------------------------
--  RIEN NE SE LIT NI NE S'ÉCRIT DEPUIS LE NAVIGATEUR. Ces deux tables
--  portent les jetons : un `select` public suffirait à tous les lire,
--  donc à s'approprier ou supprimer n'importe quelle fiche démarchée.
--  On active la sécurité par ligne SANS écrire la moindre politique :
--  aucune politique = aucun accès. Seule la clé de service (les routes
--  /api, côté serveur) passe outre.
alter table public.demarchages enable row level security;
alter table public.demarchage_fiches enable row level security;

revoke all on public.demarchages from anon, authenticated;
revoke all on public.demarchage_fiches from anon, authenticated;

-- ---------------------------------------------------------------------
--  CE QU'IL Y A EN BASE APRÈS COUP — n'écrit rien.
-- ---------------------------------------------------------------------
select mesure, valeur
from (values
  (1, 'Table demarchages présente', (
    select case when exists (
      select 1 from information_schema.tables
       where table_schema = 'public' and table_name = 'demarchages')
      then 'oui' else 'NON' end)),
  (2, 'Table demarchage_fiches présente', (
    select case when exists (
      select 1 from information_schema.tables
       where table_schema = 'public' and table_name = 'demarchage_fiches')
      then 'oui' else 'NON' end)),
  (3, 'Une fiche ne peut être démarchée deux fois', (
    select case when exists (
      select 1 from pg_indexes
       where schemaname = 'public'
         and indexname = 'idx_demarchage_fiches_unique')
      then 'oui' else 'NON' end)),
  (4, 'Sécurité par ligne active (aucun accès public)', (
    select case when bool_and(rowsecurity) then 'oui' else 'NON' end
      from pg_tables
     where schemaname = 'public'
       and tablename in ('demarchages', 'demarchage_fiches'))),
  (5, 'Envois enregistrés', (
    select count(*)::text from public.demarchages)),
  (6, 'Fiches démarchées', (
    select count(*)::text from public.demarchage_fiches))
) as etat(ordre, mesure, valeur)
order by ordre;
