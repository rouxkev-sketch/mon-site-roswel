-- ============================================================
-- nº 414 — LE MODE « DISPONIBLE » (l'artiste qui cherche un lieu)
-- ============================================================
-- LE QUATRIÈME MODE D'EXERCICE. C'est le retour de la MÉCANIQUE du
-- mode « à domicile » (ville + rayon de déplacement, supprimés du
-- site à la nº 402) sous un AUTRE slug et un AUTRE sens : l'artiste
-- n'a pas de lieu, il en cherche un.
-- ⚠️ LE SLUG EST 'disponible', PAS 'domicile' : le slug est la valeur
-- écrite dans modes_exercice.genre et il PORTE le sens — réutiliser
-- 'domicile' aurait fait mentir chaque ligne future. La colonne
-- rayon_km, elle, est HÉRITÉE telle quelle (nº 40, conservée par la
-- nº 402, écrite null depuis) : rien à créer.
--
-- CE QUE FAIT CETTE MIGRATION — deux choses :
--  1. ÉLARGIR la contrainte modes_exercice_genre_connu (resserrée à
--     ('salon','guest','prive') par yokofolio-fin-du-mode-domicile.sql)
--     pour accepter 'disponible'. SANS ELLE, enregistrer un mode
--     Disponible échoue : « new row … violates check constraint
--     "modes_exercice_genre_connu" ».
--  2. RÉAPPRENDRE LE DISQUE AUX TROIS VUES GÉOGRAPHIQUES. Les vues
--     lieux_annexes_tatoueur, lieux_tatoueur et zones_tatoueur
--     (nº 42, yokofolio-tous-les-lieux.sql) calculent le rayon par
--     « case when genre = 'domicile' » — une valeur qui n'existe
--     plus. On y met 'disponible' : un artiste disponible à 50 km
--     autour de Lyon répond de nouveau à une recherche faite à
--     Vienne, comme l'« à domicile » d'avant. SEULE L'EXPRESSION
--     change : mêmes colonnes, mêmes noms, même ordre — donc
--     `create or replace view` passe (pas de 42P16) et les GRANTS
--     (select … to anon, vitaux pour les pages prérendues) sont
--     CONSERVÉS, puisqu'on ne droppe rien.
--
-- CE QUI NE CHANGE PAS, ET C'EST VÉRIFIÉ :
--  · rechercher_tatoueurs (corps nº 66) : générique — le filtre
--    « Artiste » compare m.genre = any(p_modes) et la distance lit
--    z.rayon_km, sans jamais nommer un genre. Aucune retouche.
--  · modes_exercice_actifs : liste explicite de colonnes, aucun test
--    de genre. Aucune retouche.
--  · l'index partiel idx_modes_avec_rayon (rayon_km > 0) : sans
--    condition de genre. Aucune retouche.
--  · AUCUNE DONNÉE N'EST TOUCHÉE : aucune fiche ne change de mode,
--    aucune ligne n'est écrite ni supprimée.
--
-- ⚠️ L'ORDRE AVEC LE DÉPLOIEMENT : CETTE MIGRATION D'ABORD, LE
-- DÉPLOIEMENT ENSUITE. Elle ne risque rien sur le site actuel (il
-- n'écrit jamais 'disponible', et le case des vues ne matche aucune
-- ligne tant qu'il n'en existe pas) ; dans l'ordre inverse, le
-- nouveau formulaire échouerait sur la contrainte à chaque
-- enregistrement d'un mode Disponible, jusqu'au passage de la
-- migration. IDEMPOTENTE : rejouable telle quelle.
-- ============================================================

begin;

-- 1) La contrainte accepte le quatrième genre.
alter table public.modes_exercice
  drop constraint if exists modes_exercice_genre_connu;
alter table public.modes_exercice
  add constraint modes_exercice_genre_connu
  check (genre in ('salon', 'guest', 'prive', 'disponible'));

-- 2) Les trois vues géographiques : le rayon vit sur 'disponible'.
--    (Corps repris de yokofolio-tous-les-lieux.sql, nº 42 — seule
--    l'expression du rayon change, les listes de colonnes sont au
--    caractère près celles d'origine.)

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

  --  LES MODES ENCORE ACTIFS — salon, guest en cours, privé,
  --  disponible.
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
    --  ⚠️ LE RAYON NE COMPTE QUE POUR « DISPONIBLE » (nº 414 ;
    --  c'était 'domicile' jusqu'à la nº 402). Sur un mode en salon il
    --  serait absurde : le salon a une adresse, on y vient.
    case when m.genre = 'disponible' then coalesce(m.rayon_km, 0) else 0 end
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
    case when m.genre = 'disponible' then coalesce(m.rayon_km, 0) else 0 end
  from public.modes_exercice_actifs m
  where m.latitude is not null and m.longitude is not null;

create or replace view public.zones_tatoueur as
  select t.id as tatoueur_id, t.latitude, t.longitude, 0 as rayon_km
    from public.tatoueurs t
  union all
  select s.tatoueur_id, s.latitude, s.longitude, 0
    from public.studios s
  union all
  select m.tatoueur_id, m.latitude, m.longitude,
         case when m.genre = 'disponible' then coalesce(m.rayon_km, 0) else 0 end
    from public.modes_exercice_actifs m
   where m.latitude is not null and m.longitude is not null;

comment on view public.lieux_tatoueur is
  'TOUS les endroits où une fiche exerce — son adresse, les studios de l''enseigne, ses modes d''activité en cours — avec de quoi les chercher (ville, région, pays, point) et le rayon de déplacement du mode « Disponible » (nº 414). Une fiche a autant de lignes que de lieux ; la recherche répond « oui » dès qu''UN SEUL convient.';

comment on view public.zones_tatoueur is
  'Le point de chaque lieu d''une fiche, avec le rayon de déplacement quand il y en a un (mode « Disponible », nº 414). Volontairement maigre : c''est la vue que la recherche interroge pour chaque fiche retenue.';

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration ; trois requêtes)
-- ============================================================
-- a) La contrainte connaît les quatre genres — doit rendre la
--    définition avec ('salon','guest','prive','disponible') :
--    select pg_get_constraintdef(oid)
--      from pg_constraint
--     where conname = 'modes_exercice_genre_connu';
--
-- b) Les vues portent bien le nouveau case — doit rendre 3 :
--    select count(*)
--      from pg_views
--     where schemaname = 'public'
--       and viewname in ('lieux_annexes_tatoueur', 'lieux_tatoueur',
--                        'zones_tatoueur')
--       and definition like '%''disponible''%';
--
-- c) Les droits du lecteur anonyme ont survécu — doit rendre 3 :
--    select count(*)
--      from information_schema.role_table_grants
--     where grantee = 'anon'
--       and table_name in ('lieux_annexes_tatoueur', 'lieux_tatoueur',
--                          'zones_tatoueur')
--       and privilege_type = 'SELECT';
