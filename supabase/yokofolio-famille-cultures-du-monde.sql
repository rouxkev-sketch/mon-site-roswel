-- =====================================================================
--  MIGRATION Nº 67 — « TRADITIONNEL ETHNIQUE » DEVIENT
--  « CULTURES DU MONDE »
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle se relance sans risque : chaque écriture est conditionnée à
--  l'état de départ, et la contrainte est refaite à l'identique.
--
--  CE QU'ELLE FAIT (passe nº 239-§2). La famille de styles change de
--  nom ET de slug : `traditionnel-ethnique` → `cultures-du-monde`,
--  « Traditionnel ethnique » → « Cultures du monde ». Le LIBELLÉ vit
--  dans le code (src/config/tatouage.ts, FAMILLES_STYLES) ; le SLUG,
--  lui, vit AUSSI en base — à un seul endroit, la colonne `famille` de
--  `suggestions_style`, qui dit où ranger un style né d'une suggestion
--  acceptée. C'est tout ce que la base connaît de la famille.
--
--  ⚠️ AUCUNE FICHE, AUCUNE PHOTO N'EST TOUCHÉE, et c'est vérifiable :
--  une famille n'est pas un style cherchable, son slug n'a JAMAIS pu
--  entrer dans `tatoueurs.styles` ni dans `photos_tatoueur.style` — ce
--  sont les NEUF styles qu'elle range (berbere, celtique, copte,
--  maori, nordique, pa-tutiki, polynesien, sicanje, yoruba) qui y
--  vivent, et aucun d'eux ne change. L'étape 1) et l'étape 4) comptent
--  les associations AVANT et APRÈS : le nombre doit être RIGOUREUSEMENT
--  identique.
--
--  ⚠️ AUCUNE ADRESSE PUBLIQUE À REDIRIGER. Une famille n'est pas
--  cherchable : `lireValeurExplorer` refuse son slug, et la page
--  /tatouage/<style>/<ville> répond 404 pour tout slug absent du
--  catalogue. /tatouage/traditionnel-ethnique/<ville> n'a donc jamais
--  existé — il n'y a rien à faire suivre.
-- =====================================================================

-- ------------------------------------------------------------
-- 1) COMPTER AVANT — à garder sous les yeux
-- ------------------------------------------------------------
select 'AVANT' as moment,
       (select sum(coalesce(array_length(styles, 1), 0))
          from public.tatoueurs) as associations_totales,
       (select count(*) from public.tatoueurs
         where styles && array['berbere','celtique','copte','maori',
                               'nordique','pa-tutiki','polynesien',
                               'sicanje','yoruba']) as fiches_de_la_famille,
       (select count(*) from public.suggestions_style
         where famille = 'traditionnel-ethnique') as styles_ranges_ancien,
       (select count(*) from public.suggestions_style
         where famille = 'cultures-du-monde') as styles_ranges_nouveau;

-- ------------------------------------------------------------
-- 2) LA CONTRAINTE D'ABORD — sinon la mise à jour la violerait
-- ------------------------------------------------------------
--  Elle n'acceptait que l'ancien slug ; elle accepte maintenant le
--  nouveau. Ajouter une famille au site = ajouter son slug ici ET dans
--  FAMILLES_STYLES (src/config/tatouage.ts).
alter table public.suggestions_style
  drop constraint if exists suggestions_style_famille;
alter table public.suggestions_style
  add constraint suggestions_style_famille
  check (famille is null or famille = 'cultures-du-monde');

-- ------------------------------------------------------------
-- 3) LE RENOMMAGE — la seule écriture de données de la migration
-- ------------------------------------------------------------
--  Conditionnée : relancée, elle ne trouve plus rien à faire.
update public.suggestions_style
   set famille = 'cultures-du-monde'
 where famille = 'traditionnel-ethnique';

-- ------------------------------------------------------------
-- 4) COMPTER APRÈS — les deux premières colonnes doivent être
--    IDENTIQUES à celles de l'étape 1)
-- ------------------------------------------------------------
select 'APRÈS' as moment,
       (select sum(coalesce(array_length(styles, 1), 0))
          from public.tatoueurs) as associations_totales,
       (select count(*) from public.tatoueurs
         where styles && array['berbere','celtique','copte','maori',
                               'nordique','pa-tutiki','polynesien',
                               'sicanje','yoruba']) as fiches_de_la_famille,
       (select count(*) from public.suggestions_style
         where famille = 'traditionnel-ethnique') as styles_ranges_ancien,
       (select count(*) from public.suggestions_style
         where famille = 'cultures-du-monde') as styles_ranges_nouveau;

-- ------------------------------------------------------------
-- 5) LE CONTRÔLE FINAL — il ne doit plus rester une seule ligne
--    portant l'ancien slug
-- ------------------------------------------------------------
select case
         when not exists (
           select 1 from public.suggestions_style
            where famille = 'traditionnel-ethnique'
         )
         then 'OK — plus aucune ligne « traditionnel-ethnique »'
         else 'À REVOIR — il reste des lignes à l''ancien slug'
       end as verdict;
