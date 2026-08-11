-- ================================================================
--  YOKOFOLIO — LE RELEVÉ DES FICHES (outil, passe nº 177-§1)
-- ================================================================
--  ⚠️ CE N'EST PAS UNE MIGRATION. Il n'écrit RIEN, ne crée RIEN, ne
--  modifie RIEN : il ne fait que LIRE et afficher. On peut le passer
--  autant de fois qu'on veut, à n'importe quel moment.
--
--  À QUOI IL SERT : « ma fiche affiche “pas encore en ligne”, alors
--  que mon administration ne montre aucune fiche en attente ». Il
--  répond à cette question-là, fiche par fiche, en montrant la VALEUR
--  EXACTE des colonnes qui décident — et en NOMMANT celle qui bloque.
--
--  À passer dans l'éditeur SQL de Supabase, et à me recopier tel quel.
-- ================================================================

-- ----------------------------------------------------------------
--  1) CHAQUE FICHE RATTACHÉE À UN COMPTE, ET CE QUI LA BLOQUE
-- ----------------------------------------------------------------
--  ⚠️ Les colonnes sont lues par `to_jsonb(t)->>'…'` et non
--  directement : une colonne absente rend alors « (colonne absente) »
--  au lieu de faire échouer tout le fichier.
select
  t.nom,
  t.slug,
  --  LES TROIS COLONNES QUE `fiche_en_ligne()` TESTE.
  coalesce(to_jsonb(t)->>'publie', '(colonne absente)')      as publie,
  coalesce(to_jsonb(t)->>'statut', '(vide ou absente)')      as statut,
  coalesce(to_jsonb(t)->>'supprime_le', 'null (bien)')       as supprime_le,
  --  ET LES DEUX QUI COMPTENT AUSSI, pour comprendre.
  coalesce(to_jsonb(t)->>'hors_ligne', '(colonne absente)')  as hors_ligne,
  case when to_jsonb(t)->>'brouillon' is null
       then 'aucun' else 'MODIFICATIONS EN ATTENTE' end      as brouillon,
  --  LE VERDICT, EN CLAIR : la PREMIÈRE condition qui bloque.
  case
    when coalesce(to_jsonb(t)->>'publie', 'false') <> 'true'
      then '❌ publie = false → l''admin ne l''a pas publiée'
    when to_jsonb(t)->>'supprime_le' is not null
      then '❌ compte en cours de suppression'
    when coalesce(to_jsonb(t)->>'hors_ligne', 'false') = 'true'
      then '❌ mise hors ligne par l''admin'
    when coalesce(to_jsonb(t)->>'statut', '') = 'refusee'
      then '❌ statut = refusee'
    when coalesce(to_jsonb(t)->>'statut', '') <> 'validee'
      then '⚠️ EN LIGNE, mais statut = ' || coalesce(to_jsonb(t)->>'statut', '(vide)')
           || ' — c''est CE cas que la nº 59 bloquait à tort (corrigé par la nº 60)'
    else '✅ en ligne'
  end as verdict
from public.tatoueurs t
where t.user_id is not null
order by t.nom;

-- ----------------------------------------------------------------
--  2) LE COMPTE, D'UN COUP D'ŒIL
-- ----------------------------------------------------------------
select
  count(*) filter (where user_id is not null)                      as fiches_de_comptes,
  count(*) filter (where user_id is not null and publie = true)    as publiees,
  count(*) filter (where user_id is not null and publie = true
                     and coalesce(to_jsonb(t)->>'statut','') = 'validee') as publiees_et_validee,
  count(*) filter (where user_id is not null and publie = true
                     and coalesce(to_jsonb(t)->>'statut','') <> 'validee') as publiees_statut_autre,
  count(*) filter (where user_id is not null and publie = false)   as non_publiees
from public.tatoueurs t;

-- ----------------------------------------------------------------
--  3) LES VALEURS DE `statut` RÉELLEMENT PRÉSENTES EN BASE
-- ----------------------------------------------------------------
--  La contrainte en autorise quatre : en_attente, validee, refusee,
--  modifications. Voici celles qui existent vraiment, et combien.
select
  coalesce(to_jsonb(t)->>'statut', '(vide)') as statut,
  count(*) filter (where user_id is not null) as fiches_de_comptes,
  count(*) filter (where user_id is null)     as demonstrations
from public.tatoueurs t
group by 1
order by 1;

-- ----------------------------------------------------------------
--  4) CE QUE VOIT UN VISITEUR NON CONNECTÉ, MAINTENANT
-- ----------------------------------------------------------------
--  ⚠️ DANS UNE TRANSACTION, et c'est nécessaire : hors transaction,
--  `set local` est ignoré (avec un avertissement) et le comptage se
--  ferait sous le rôle administrateur — il compterait TOUT, et
--  dirait donc le contraire de la vérité. L'éditeur de Supabase
--  exécute déjà le fichier dans une transaction : ce `begin` y pose
--  seulement un avertissement, sans effet.
begin;
set local role anon;
select
  'VU PAR UN VISITEUR' as controle,
  count(*)                                        as fiches_visibles,
  count(*) filter (where user_id is not null)     as dont_de_comptes
from public.tatoueurs;
reset role;
commit;
