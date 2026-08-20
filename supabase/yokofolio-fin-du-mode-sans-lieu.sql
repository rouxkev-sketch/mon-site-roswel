-- ============================================================
-- nº 418 — FIN DU QUATRIÈME MODE (le mode SANS LIEU)
-- ============================================================
-- LE MODE EST ABANDONNÉ. Né à la nº 414 sous le slug `disponible`
-- (affiché « Disponible », puis « Freelance », puis « Independent »),
-- il est supprimé du site — formulaire, filtres, fiches, cartes.
-- Il ne reste que STUDIO, SALON, GUEST.
--
-- CETTE MIGRATION REFERME CE QUE CELLE DE LA nº 414 AVAIT OUVERT
-- (yokofolio-mode-disponible.sql), et rien d'autre :
--  1. LA CONTRAINTE `modes_exercice_genre_connu` revient à
--     ('salon','guest','prive') — l'état exact d'après la nº 402 ;
--  2. LES TROIS VUES GÉOGRAPHIQUES (lieux_annexes_tatoueur,
--     lieux_tatoueur, zones_tatoueur) cessent de chercher un rayon sur
--     un genre qui n'existe plus : le `case when genre = 'disponible'`
--     redevient un `0` franc. PLUS AUCUN MODE N'EST UN DISQUE — c'est
--     l'état d'avant la nº 414, dit en clair plutôt que par un `case`
--     qui ne matche jamais.
--  3. LES LIGNES `disponible` ÉVENTUELLES SONT PURGÉES — sans quoi la
--     contrainte du point 1 échouerait, et une ligne d'un genre que le
--     site ne sait plus lire n'a aucun avenir.
--
-- ⚠️ AVANT DE LA COLLER : REGARDE CE QUI SERA SUPPRIMÉ. La requête est
-- juste en dessous, elle ne modifie rien. Si elle rend 0 ligne, le
-- point 3 n'a rien à faire et la migration se réduit à un verrou.
--
-- ⚠️ LA COLONNE `rayon_km` RESTE, comme la nº 402 l'avait laissée :
-- elle est simplement toujours écrite à null. On ne détruit pas une
-- colonne pour un mode qui a déjà été retiré puis rétabli une fois.
--
-- ⚠️ L'ORDRE AVEC LE DÉPLOIEMENT : LE DÉPLOIEMENT D'ABORD, CETTE
-- MIGRATION ENSUITE — l'inverse de la nº 414. Tant que l'ancien site
-- est en ligne, son formulaire peut encore écrire un mode
-- `disponible` ; resserrer la contrainte avant lui ferait échouer cet
-- enregistrement. Une fois la nouvelle version déployée, plus rien ne
-- l'écrit et la migration ne risque rien. Rien n'échoue si elle
-- attend : le site déployé ne lit ni n'écrit ce genre.
--
-- ⚠️ `create or replace view` SUR LES TROIS VUES : mêmes colonnes,
-- mêmes noms, même ordre — pas de 42P16, et les GRANTS (`select … to
-- anon`, vitaux pour les pages prérendues) sont CONSERVÉS puisqu'on ne
-- droppe rien.
--
-- IDEMPOTENTE : rejouable telle quelle, sans effet la seconde fois.
-- ============================================================

-- ------------------------------------------------------------
-- À COLLER D'ABORD — CE QUI EXISTE (ne modifie rien)
-- ------------------------------------------------------------
--   select t.slug, t.nom, m.id, m.intitule, m.ville, m.region,
--          m.pays, m.rayon_km, m.ordre
--     from public.modes_exercice m
--     join public.tatoueurs t on t.id = m.tatoueur_id
--    where m.genre = 'disponible'
--    order by t.slug, m.ordre;
--
--   -- Et le compte, pour le dire d'un coup d'œil :
--   select count(*) from public.modes_exercice where genre = 'disponible';

begin;

-- 1) Les lignes du mode abandonné.
--    ⚠️ CE QUE CELA EMPORTE : une liaison artiste↔salon pend à son
--    mode (`liaisons_artiste_salon.mode_id`, on delete cascade). Un
--    mode SANS LIEU n'a jamais pu désigner de salon (`salon_id` y est
--    toujours null — il n'avait pas de recherche de portfolio), donc
--    aucune liaison ne s'y accroche en pratique ; la cascade est un
--    filet, pas un mécanisme dont on se sert ici.
delete from public.modes_exercice
 where genre = 'disponible';

-- 2) La contrainte ne connaît plus que les trois modes du site.
alter table public.modes_exercice
  drop constraint if exists modes_exercice_genre_connu;
alter table public.modes_exercice
  add constraint modes_exercice_genre_connu
  check (genre in ('salon', 'guest', 'prive'));

-- 3) Les trois vues géographiques : plus aucun rayon de mode.
--    (Corps repris de yokofolio-tous-les-lieux.sql, nº 42, puis de la
--    nº 414 — seule l'expression du rayon change, les listes de
--    colonnes sont au caractère près celles d'origine.)

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

  --  LES MODES ENCORE ACTIFS — salon, guest en cours, studio privé.
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
    --  ⚠️ PLUS AUCUN MODE N'EST UN DISQUE (nº 418) : le seul genre qui
    --  portait un rayon de déplacement — « à domicile » jusqu'à la
    --  nº 402, puis le mode sans lieu des nº 414-417 — n'existe plus.
    --  Un salon a une adresse, on y vient : son rayon est nul.
    0
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
    0
  from public.modes_exercice_actifs m
  where m.latitude is not null and m.longitude is not null;

create or replace view public.zones_tatoueur as
  select t.id as tatoueur_id, t.latitude, t.longitude, 0 as rayon_km
    from public.tatoueurs t
  union all
  select s.tatoueur_id, s.latitude, s.longitude, 0
    from public.studios s
  union all
  select m.tatoueur_id, m.latitude, m.longitude, 0
    from public.modes_exercice_actifs m
   where m.latitude is not null and m.longitude is not null;

comment on view public.lieux_tatoueur is
  'TOUS les endroits où une fiche exerce — son adresse, les studios de l''enseigne, ses modes d''activité en cours. Une fiche a autant de lignes que de lieux ; la recherche répond « oui » dès qu''UN SEUL convient. (nº 418 — plus aucun mode ne porte de rayon de déplacement.)';

comment on view public.zones_tatoueur is
  'Le point de chaque lieu d''une fiche. Volontairement maigre : c''est la vue que la recherche interroge pour chaque fiche retenue. (nº 418 — le rayon reste dans la vue, toujours nul : la recherche continue de le lire sans qu''on ait à la retoucher.)';

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration ; trois requêtes)
-- ============================================================
-- a) Plus une seule ligne du mode abandonné — doit rendre 0 :
--    select count(*) from public.modes_exercice where genre = 'disponible';
--
-- b) La contrainte ne connaît plus que trois genres — doit rendre la
--    définition avec ('salon','guest','prive') :
--    select pg_get_constraintdef(oid)
--      from pg_constraint
--     where conname = 'modes_exercice_genre_connu';
--
-- c) Plus aucune vue ne cite le genre abandonné — doit rendre 0 :
--    select count(*)
--      from pg_views
--     where schemaname = 'public'
--       and viewname in ('lieux_annexes_tatoueur', 'lieux_tatoueur',
--                        'zones_tatoueur')
--       and definition like '%''disponible''%';
--
-- d) Et les droits du lecteur anonyme ont survécu — doit rendre 3 :
--    select count(*)
--      from information_schema.role_table_grants
--     where grantee = 'anon'
--       and table_name in ('lieux_annexes_tatoueur', 'lieux_tatoueur',
--                          'zones_tatoueur')
--       and privilege_type = 'SELECT';
