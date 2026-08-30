-- ============================================================
-- nº 748-749 — LES FONDATIONS DES NOUVEAUX MODES DE L'ARTISTE
--              (convention, independent)
-- ============================================================
-- À COLLER EN ENTIER dans l'éditeur SQL de Supabase, une fois.
--
-- CE FICHIER PORTE DEUX CHOSES :
--  · LES BLOCS 1 À 5 — collés le 30-08-2026 (passe nº 748, fichier
--    conception-748.sql). Ils sont GARDÉS ICI POUR MÉMOIRE : c'est ce
--    fichier-ci, versionné dans le dépôt, qui fait foi de l'état de la
--    base pour les sessions futures. Les repasser NE FAIT RIEN (tout
--    est en `if exists` / `if not exists` / `or replace`).
--  · LE BLOC 6 — LA PASSE Nº 749 : les deux vues d'AFFICHAGE
--    (lieux_tatoueur, lieux_annexes_tatoueur) apprennent le rayon du
--    genre 'independent', comme la vue de recherche (zones_tatoueur)
--    l'a appris à la nº 748. C'est LUI la nouveauté à coller.
--
-- COMME TOUJOURS : l'éditeur Supabase exécute tout le fichier en UNE
-- transaction — si une ligne échoue, rien n'est écrit, rien à nettoyer.
-- IDEMPOTENT : rejouable tel quel, sans effet la seconde fois.
--
-- ⚠️ L'ÉTAT RÉEL DES VUES, RELU FICHIER PAR FICHIER (nº 749). La
-- chronologie complète des trois vues géographiques est :
--   nº 42  (yokofolio-tous-les-lieux.sql)      case 'domicile'
--   nº 414 (yokofolio-mode-disponible.sql)     case 'disponible'
--   nº 418 (yokofolio-fin-du-mode-sans-lieu.sql)  rayon 0 franc
--   nº 748 (bloc 4 ci-dessous)                 zones_tatoueur seule :
--                                              case in ('disponible',
--                                              'independent')
-- Le bloc 6 reprend donc les corps de la nº 418 — l'état réel —, au
-- caractère près pour les listes de colonnes : `create or replace
-- view` passe sans drop (pas d'erreur 42P16). SI LE BLOC 6 ÉCHOUAIT
-- QUAND MÊME EN 42P16, c'est que la base ne correspond pas aux
-- fichiers du dépôt : rien n'est cassé (transaction annulée) — me le
-- dire, sans rien tenter d'autre.
--
-- ⚠️ LES DROITS DE LECTURE NE SONT PAS TOUCHÉS, ET C'EST VOULU. L'état
-- en vigueur est celui des nº 699 et 726 : `zones_tatoueur`,
-- `lieux_tatoueur` et `lieux_annexes_tatoueur` sont lisibles par le
-- navigateur (la recherche en dépend — panne nº 726), `points_tatoueur`
-- reste fermée. `create or replace view` CONSERVE les droits existants
-- puisqu'on ne droppe rien ; ce fichier ne contient AUCUN `grant` ni
-- `revoke` — en recopier depuis les nº 42/414 rouvrirait ce que la
-- nº 699 a fermé. La vérification finale contrôle que cet état tient.
--
-- CE QUI N'EST TOUJOURS PAS TOUCHÉ, et c'est vérifié :
--  · rechercher_tatoueurs : générique (m.genre = any(p_modes), la
--    distance lit zones_tatoueur) — aucune retouche ;
--  · modes_exercice_actifs : « tous, sauf fin_le passée » — les
--    conventions terminées expireront TOUTES SEULES, comme les
--    sessions guest ; aucune retouche (et donc aucun risque 42P16) ;
--  · AUCUNE DONNÉE : aucune ligne écrite, modifiée ni supprimée.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) LA CONTRAINTE DE GENRE — deux genres de plus.
--    (nº 748, déjà collé — mémoire.)
-- ------------------------------------------------------------
alter table public.modes_exercice
  drop constraint if exists modes_exercice_genre_connu;
alter table public.modes_exercice
  add constraint modes_exercice_genre_connu
  check (genre in ('salon', 'guest', 'prive', 'disponible',
                   'convention', 'independent'));

-- ------------------------------------------------------------
-- 2) LA TABLE DES CONVENTIONS — catalogue et demandes ensemble.
--    (nº 748, déjà collé — mémoire. Le modèle exact de
--    suggestions_style : une ligne acceptée EST une entrée du menu.)
-- ------------------------------------------------------------
create table if not exists public.conventions (
  id uuid primary key default gen_random_uuid(),

  -- CE QUE L'ARTISTE A PROPOSÉ, tel quel — jamais réécrit : les
  -- administrateurs doivent pouvoir relire la demande d'origine.
  propose text not null,

  -- LE NOM RETENU et son slug — posés par l'administration à
  -- l'acceptation (le nom corrigé s'il y a lieu). Le slug sert au
  -- dédoublonnage par pays.
  nom text,
  slug text,

  -- LE PAYS — la clé du menu déroulant (« pays → conventions de ce
  -- pays »). Deux lettres majuscules, obligatoire dès la demande.
  code_pays text not null check (code_pays ~ '^[A-Z]{2}$'),

  -- LA LOCALISATION — posée par l'administration à l'acceptation,
  -- via le champ de localité du site. C'est elle qui est RECOPIÉE
  -- dans chaque ligne de mode à l'enregistrement (le motif existant
  -- de modes_exercice : « recopiée exprès », l'affichage et la
  -- recherche ne dépendent d'aucune jointure).
  ville text,
  region text,
  latitude double precision,
  longitude double precision,

  -- LES DATES DE LA CONVENTION elle-même (facultatives — l'artiste
  -- renseigne les SIENNES sur sa ligne de mode).
  debut_le date,
  fin_le date,

  -- LE CYCLE DE VIE — celui de suggestions_style, au mot près.
  etat text not null default 'en_attente'
    check (etat in ('en_attente', 'acceptee', 'refusee')),

  -- QUI A DEMANDÉ — mêmes règles de détachement que les styles : une
  -- convention acceptée appartient au site, plus à son proposeur.
  propose_par uuid references auth.users(id) on delete set null,
  fiche_id uuid references public.tatoueurs(id) on delete set null,
  fiche_nom text,
  message text,

  cree_le timestamptz not null default now(),
  traite_le timestamptz
);

comment on table public.conventions is
  'Les conventions de tatouage, par pays. Une ligne « acceptee » EST une entrée du menu du mode Convention ; une ligne « en_attente » est une demande à traiter par l''administration (le modèle de suggestions_style).';

-- Le dédoublonnage : une seule convention acceptée par slug et par
-- pays (les demandes en attente, elles, peuvent se répéter — c'est
-- l'administration qui tranche, comme pour les styles).
create unique index if not exists conventions_slug_pays_uniques
  on public.conventions (slug, code_pays)
  where etat = 'acceptee' and slug is not null;

-- ------------------------------------------------------------
-- 3) LES DEUX COLONNES DE modes_exercice.
--    (nº 748, déjà collé — mémoire.)
-- ------------------------------------------------------------
-- Le lien vers le catalogue. `on delete set null` : si la convention
-- quitte le catalogue, le mode subsiste avec sa localisation recopiée
-- — ce qui reste vrai, c'est que l'artiste y sera (même règle que
-- salon_id).
alter table public.modes_exercice
  add column if not exists convention_id uuid
  references public.conventions(id) on delete set null;

-- Le statut du mode independent. Null pour tous les autres genres ;
-- répété sur chaque ligne de zone d'un même artiste (l'enregistrement
-- écrit les lignes ensemble, la lecture prend la première).
alter table public.modes_exercice
  add column if not exists statut text;
alter table public.modes_exercice
  drop constraint if exists modes_exercice_statut_connu;
alter table public.modes_exercice
  add constraint modes_exercice_statut_connu
  check (statut is null or statut in (
    'guest_spots_only',
    'conventions_only',
    'guest_spots_and_conventions',
    'on_break',
    'available_on_request'
  ));

-- ------------------------------------------------------------
-- 4) LA VUE DE LA RECHERCHE — le rayon du genre 'independent'.
--    (nº 748, déjà collé — mémoire. 'disponible' reste dans le `in`
--    pour la même raison qu'il reste dans la contrainte : le retirer
--    ne rapporterait rien et pourrait faire mentir une ligne oubliée.)
-- ------------------------------------------------------------
create or replace view public.zones_tatoueur as
  select t.id as tatoueur_id, t.latitude, t.longitude, 0 as rayon_km
    from public.tatoueurs t
  union all
  select s.tatoueur_id, s.latitude, s.longitude, 0
    from public.studios s
  union all
  select m.tatoueur_id, m.latitude, m.longitude,
         case when m.genre in ('disponible', 'independent')
              then coalesce(m.rayon_km, 0) else 0 end
    from public.modes_exercice_actifs m
   where m.latitude is not null and m.longitude is not null;

-- ------------------------------------------------------------
-- 5) LES RÈGLES D'ACCÈS DE conventions — le décalque des styles.
--    (nº 748, déjà collé — mémoire.)
-- ------------------------------------------------------------
alter table public.conventions enable row level security;

-- LIRE : les acceptées sont publiques (le menu du formulaire et les
-- fiches en ont besoin, connecté ou pas).
drop policy if exists "les conventions acceptees sont publiques"
  on public.conventions;
create policy "les conventions acceptees sont publiques"
  on public.conventions for select
  to anon, authenticated
  using (etat = 'acceptee');

-- LIRE : chacun voit SES demandes (pour afficher « en cours d'examen »).
drop policy if exists "lecture de ses demandes de convention"
  on public.conventions;
create policy "lecture de ses demandes de convention"
  on public.conventions for select
  to authenticated
  using (auth.uid() = propose_par);

-- ÉCRIRE : un compte connecté crée SA demande, en attente, sans
-- pouvoir se l'accepter lui-même — les colonnes de décision doivent
-- être vides à l'insertion.
drop policy if exists "proposer une convention" on public.conventions;
create policy "proposer une convention"
  on public.conventions for insert
  to authenticated
  with check (
    auth.uid() = propose_par
    and etat = 'en_attente'
    and nom is null
    and slug is null
    and traite_le is null
  );

-- ACCEPTER / REFUSER : l'administration passe par la clé de service
-- (le client admin du serveur), qui ignore la RLS — aucune politique
-- d'update pour les comptes ordinaires, et c'est voulu.

-- ------------------------------------------------------------
-- 6) ██ LA PASSE Nº 749 ██ — LES DEUX VUES D'AFFICHAGE apprennent
--    le rayon du genre 'independent'.
-- ------------------------------------------------------------
--  La nº 748 avait réécrit LA SEULE vue de la recherche et remis les
--  deux vues d'affichage à cette passe-ci, « depuis l'état réel de la
--  base ». L'état réel est celui de la nº 418 : rayon `0` franc (le
--  mode sans lieu abandonné, plus aucun mode n'était un disque). Les
--  corps ci-dessous sont ceux de la nº 418, seule l'expression du
--  rayon change — mêmes colonnes, mêmes noms, même ordre : `create or
--  replace view` passe sans drop, et les droits en vigueur (nº 726)
--  sont conservés puisqu'on ne droppe rien.
--  Sur le site d'aujourd'hui, ce bloc est INOFFENSIF : aucune ligne
--  'independent' n'existe encore, le `case` ne matche rien.

create or replace view public.lieux_annexes_tatoueur as
  --  LES ADRESSES DE L'ENSEIGNE (une par studio).
  select
    s.tatoueur_id,
    1               as rang,
    'studio'::text  as provenance,
    null::text      as genre,
    s.adresse,
    s.code_postal,
    s.ville,
    public.yf_slug(s.ville) as ville_slug,
    s.region,
    s.pays,
    s.code_pays,
    s.latitude,
    s.longitude,
    s.lieu_id,
    0               as rayon_km
  from public.studios s

  union all

  --  LES MODES ENCORE ACTIFS — salon, guest en cours, studio privé,
  --  et demain convention et zone independent.
  select
    m.tatoueur_id,
    2,
    'mode',
    m.genre,
    m.adresse,
    m.code_postal,
    m.ville,
    public.yf_slug(m.ville),
    m.region,
    m.pays,
    m.code_pays,
    m.latitude,
    m.longitude,
    m.lieu_id,
    --  ⚠️ LE RAYON NE COMPTE QUE POUR UNE ZONE DE DÉPLACEMENT
    --  (genre 'independent', nº 749 — et 'disponible', son ancêtre
    --  nº 414, gardé par prudence). Sur un salon, un guest ou une
    --  convention il serait absurde : le lieu a une adresse, on y
    --  vient.
    case when m.genre in ('disponible', 'independent')
         then coalesce(m.rayon_km, 0) else 0 end
  from public.modes_exercice_actifs m
  where m.latitude is not null and m.longitude is not null;

create or replace view public.lieux_tatoueur as
  --  L'ADRESSE PORTÉE PAR LA FICHE ELLE-MÊME.
  select
    t.id            as tatoueur_id,
    0               as rang,
    'fiche'::text   as provenance,
    null::text      as genre,
    t.adresse,
    t.code_postal,
    t.ville_nom     as ville,
    t.ville_slug,
    t.region,
    t.pays,
    t.code_pays,
    t.latitude,
    t.longitude,
    t.lieu_id,
    0               as rayon_km
  from public.tatoueurs t

  union all

  select
    s.tatoueur_id, 1, 'studio', null,
    s.adresse, s.code_postal, s.ville, public.yf_slug(s.ville),
    s.region, s.pays, s.code_pays, s.latitude, s.longitude, s.lieu_id, 0
  from public.studios s

  union all

  select
    m.tatoueur_id, 2, 'mode', m.genre,
    m.adresse, m.code_postal, m.ville, public.yf_slug(m.ville),
    m.region, m.pays, m.code_pays, m.latitude, m.longitude, m.lieu_id,
    case when m.genre in ('disponible', 'independent')
         then coalesce(m.rayon_km, 0) else 0 end
  from public.modes_exercice_actifs m
  where m.latitude is not null and m.longitude is not null;

comment on view public.lieux_tatoueur is
  'TOUS les endroits où une fiche exerce — son adresse, les studios de l''enseigne, ses modes d''activité en cours — avec de quoi les chercher (ville, région, pays, point) et le rayon de déplacement d''une zone Independent (nº 749). Une fiche a autant de lignes que de lieux ; la recherche répond « oui » dès qu''UN SEUL convient.';

comment on view public.lieux_annexes_tatoueur is
  'Les lieux d''une fiche AUTRES que son adresse principale : les studios de l''enseigne et ses modes d''activité en cours, avec le rayon de déplacement d''une zone Independent (nº 749). Petite table — c''est ce qui permet à la recherche de la parcourir une seule fois par requête au lieu d''une fois par fiche.';

comment on view public.zones_tatoueur is
  'Le point de chaque lieu d''une fiche, avec le rayon de déplacement quand il y en a un (zone Independent, nº 748-749). Volontairement maigre : c''est la vue que la recherche interroge pour chaque fiche retenue.';

commit;

-- ============================================================
-- VÉRIFICATION — un seul tableau à lire, rien à noter.
-- (S'affiche tout seul après le collage : c'est le dernier résultat.)
-- ============================================================
select mesure, valeur, attendu
from (values
  (1, 'La contrainte connaît les six genres', (
    select case when pg_get_constraintdef(oid) like '%''convention''%'
                 and pg_get_constraintdef(oid) like '%''independent''%'
           then 'oui' else 'NON' end
      from pg_constraint where conname = 'modes_exercice_genre_connu'),
   'oui'),
  (2, 'La table conventions existe', (
    select case when to_regclass('public.conventions') is not null
           then 'oui' else 'NON' end), 'oui'),
  (3, 'Lignes dans conventions (0 tant que rien n''est demandé)', (
    select count(*)::text from public.conventions), '0 ou plus'),
  (4, 'modes_exercice porte statut et convention_id', (
    select count(*)::text from information_schema.columns
     where table_schema = 'public' and table_name = 'modes_exercice'
       and column_name in ('statut', 'convention_id')), '2'),
  (5, 'Les 3 vues géographiques connaissent independent', (
    select count(*)::text from pg_views
     where schemaname = 'public'
       and viewname in ('lieux_annexes_tatoueur', 'lieux_tatoueur',
                        'zones_tatoueur')
       and definition like '%''independent''%'), '3'),
  (6, 'Lecture navigateur des 3 vues (état nº 726, la recherche en vit)', (
    select count(*)::text from information_schema.role_table_grants
     where table_schema = 'public'
       and table_name in ('lieux_annexes_tatoueur', 'lieux_tatoueur',
                          'zones_tatoueur')
       and grantee in ('anon', 'authenticated')
       and privilege_type = 'SELECT'), '6'),
  (7, 'points_tatoueur reste fermée (verrou nº 699)', (
    select count(*)::text from information_schema.role_table_grants
     where table_schema = 'public' and table_name = 'points_tatoueur'
       and grantee in ('anon', 'authenticated')
       and privilege_type = 'SELECT'), '0'),
  (8, 'zones_tatoueur rend toujours des lignes (les fiches existantes)', (
    select count(*)::text from public.zones_tatoueur), '1 ou plus')
) as etat(ordre, mesure, valeur, attendu)
order by ordre;
