-- =====================================================================
--  LECTURE D'UNE FICHE — DIAGNOSTIC, NE MODIFIE RIEN
--  ---------------------------------------------------------------------
--  ⚠️ CE N'EST PAS UNE MIGRATION. Aucun `insert`, aucun `update`,
--  aucun `delete`, aucun `create` : uniquement des `select`. On peut la
--  passer autant de fois qu'on veut, sur la base de production, sans le
--  moindre risque.
--
--  À QUOI ELLE SERT
--  -----------------
--  Savoir ce que contient RÉELLEMENT une fiche, au lieu de le supposer :
--  ses styles déclarés, ses photos cataloguées (avec leur style, leur
--  rendu, leur nature, leur ordre), les images de l'ancien modèle
--  (`photos_styles`), et l'état de modération (`brouillon`).
--
--  COMMENT S'EN SERVIR
--  --------------------
--  1. ouvrir l'éditeur SQL de Supabase ;
--  2. coller LA REQUÊTE Nº 1, remplacer 'lola' par un morceau du nom de
--     la fiche si besoin, puis « Run » ;
--  3. le résultat est UNE SEULE CASE de texte : cliquer dessus, tout
--     copier, et le recoller dans la conversation.
--  Puis faire de même avec la REQUÊTE Nº 2, qui interroge le moteur.
-- =====================================================================


-- ---------------------------------------------------------------------
--  REQUÊTE Nº 1 — CE QUE CONTIENT LA FICHE
-- ---------------------------------------------------------------------
select jsonb_pretty(coalesce(jsonb_agg(detail), '[]'::jsonb)) as fiche_complete
from (
  select jsonb_build_object(
    'nom',                t.nom,
    'slug',               t.slug,
    'publie',             t.publie,
    'statut',             t.statut,
    'supprimee',          (t.supprime_le is not null),
    'type_fiche',         t.type_fiche,

    --  CE QUE LA FICHE DÉCLARE — c'est CE TABLEAU que la recherche
    --  interroge aujourd'hui quand on choisit un style.
    'styles_declares',    to_jsonb(t.styles),

    --  LA MODÉRATION : des modifications en attente ? Lesquelles ?
    --  (Une fiche en ligne écrit ses changements de TEXTE ici, en
    --  attendant la validation — mais ses PHOTOS partent tout de suite.)
    'modifications_en_attente', (t.brouillon is not null),
    'styles_du_brouillon',      t.brouillon -> 'styles',

    --  L'ANCIEN MODÈLE — une image par style, hors catalogue.
    'photos_styles_cles', (
      select coalesce(jsonb_agg(cle order by cle), '[]'::jsonb)
        from jsonb_object_keys(coalesce(t.photos_styles, '{}'::jsonb)) as cle
    ),
    'a_une_photo_principale', (coalesce(t.photo_principale, '') <> ''),

    --  LE CATALOGUE — la table que lisent le carrousel de la fiche, les
    --  cœurs, la photothèque et les filtres Rendu / Réalisation / Flash.
    'photos_cataloguees', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'style',      p.style,
               'rendu',      p.rendu,
               'nature',     p.nature,
               'ordre',      p.ordre,
               'a_miniature',(p.miniature is not null),
               'fin_url',    right(coalesce(p.url, ''), 32)
             ) order by p.ordre), '[]'::jsonb)
        from public.photos_tatoueur p
       where p.tatoueur_id = t.id
    ),

    --  LE CROISEMENT QUI TRANCHE : un style déclaré SANS photo
    --  cataloguée, ou une photo cataloguée dans un style NON déclaré.
    'styles_declares_sans_photo', (
      select coalesce(jsonb_agg(s.style), '[]'::jsonb)
        from unnest(t.styles) as s(style)
       where not exists (
               select 1 from public.photos_tatoueur p
                where p.tatoueur_id = t.id and p.style = s.style
             )
    ),
    'styles_photographies_non_declares', (
      select coalesce(jsonb_agg(distinct p.style), '[]'::jsonb)
        from public.photos_tatoueur p
       where p.tatoueur_id = t.id
         and not (t.styles @> array[p.style])
    )
  ) as detail
  from public.tatoueurs t
  --  ⚠️ REMPLACER 'lola' par un morceau du nom cherché.
  where t.nom ilike '%lola%'
) as lignes;


-- ---------------------------------------------------------------------
--  REQUÊTE Nº 2 — CE QUE LE MOTEUR RÉPOND, LUI
-- ---------------------------------------------------------------------
--  Trois fois la même question, posée comme le site la pose :
--   A. le style seul ;
--   B. le style dans « Réalisations » (ce que fait le menu Explorer) ;
--   C. le style dans « Flashs ».
--  Chaque ligne dit combien de fiches remontent, et si celle qu'on
--  cherche en fait partie.
--  ⚠️ REMPLACER 'aquarelle' par le style cherché et 'lola' par le nom.
select
  question,
  nombre_de_fiches,
  fiche_presente
from (
  select 'A · style seul' as question,
         count(*) as nombre_de_fiches,
         bool_or(r.fiche ->> 'nom' ilike '%lola%') as fiche_presente
    from public.rechercher_tatoueurs(p_style => 'aquarelle', p_limite => 200) r
  union all
  select 'B · style + Réalisations',
         count(*),
         bool_or(r.fiche ->> 'nom' ilike '%lola%')
    from public.rechercher_tatoueurs(
           p_style => 'aquarelle', p_nature => 'tatouage', p_limite => 200) r
  union all
  select 'C · style + Flashs',
         count(*),
         bool_or(r.fiche ->> 'nom' ilike '%lola%')
    from public.rechercher_tatoueurs(
           p_style => 'aquarelle', p_nature => 'flash', p_limite => 200) r
) as reponses
order by question;
