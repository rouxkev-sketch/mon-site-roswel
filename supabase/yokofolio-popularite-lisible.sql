-- =====================================================================
--  MIGRATION Nº 64 — LE SCORE ÉTAIT À ZÉRO POUR TOUT LE MONDE
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle ne touche AUCUNE donnée et ne recrée AUCUNE fonction : elle
--  refait la seule vue `popularite_tatoueurs`. Se relance sans risque.
--
--  ⚠️ PASSER LES Nº 62 ET 63 AVANT CELLE-CI.
--
--  LE DÉFAUT (passe nº 220-§1) — ET IL EST DE MON FAIT
--  ----------------------------------------------------
--  Le propriétaire le signale pour la troisième fois : ses deux fiches,
--  qu'il consulte, qu'il suit et qu'il a aimées, ne remontent pas.
--  Les migrations nº 62 et 63 étaient justes ; c'est la VUE qui ne
--  rendait rien.
--
--  J'avais écrit, à la nº 62 :
--
--      create or replace view public.popularite_tatoueurs
--      with (security_invoker = true) as …
--
--  `security_invoker = true` veut dire : « cette vue lit les tables
--  AVEC LES DROITS DE CELUI QUI LA LIT ». Je l'avais choisi par
--  prudence. C'est exactement ce qu'il ne fallait pas faire ici, parce
--  que les deux tables comptées sont FERMÉES À LA LECTURE :
--
--   · `favoris_photos` (nº 53) et `tatoueurs_suivis` (nº 54) ont une
--     politique de lecture « auth.uid() = utilisateur_id » : chacun ne
--     voit QUE SES PROPRES lignes. Un visiteur non connecté n'en voit
--     AUCUNE.
--
--  Résultat : `coeurs` et `abonnes` valaient ZÉRO pour tout le monde,
--  et le score se réduisait au seul nombre de consultations — lui-même
--  dédoublonné à une par visiteur et par jour. Le classement ne
--  pouvait rien trier. Le tri fonctionnait ; il triait des zéros.
--  (`consultations` passait, elle : elle vient de la vue
--  `clics_tatoueurs` de la nº 7, qui n'est PAS en `security_invoker` et
--  lit donc `clics_fiches` avec les droits de son propriétaire.)
--
--  LA CORRECTION
--  --------------
--  La vue redevient ce qu'est une vue PostgreSQL par défaut : elle lit
--  les tables avec les droits de SON PROPRIÉTAIRE. C'est l'usage
--  classique et sûr d'une vue d'agrégat.
--
--  ⚠️ ET ELLE N'OUVRE RIEN. Elle ne rend que des NOMBRES — combien de
--  cœurs, combien d'abonnés — jamais une ligne, jamais un
--  `utilisateur_id`, jamais une date. Un compte ne nomme personne, et
--  personne ne peut remonter d'un compte à qui que ce soit. Les tables
--  elles-mêmes restent fermées exactement comme avant : leurs
--  politiques ne sont pas touchées d'une ligne.
-- =====================================================================

-- ------------------------------------------------------------
--  LA VUE — le score, en un seul endroit (corps identique à la nº 62)
-- ------------------------------------------------------------
--  ⚠️ `create or replace` ET NON `drop` : la fonction
--  `rechercher_tatoueurs` dépend de cette vue depuis la nº 62 — la
--  supprimer exigerait un `cascade` qui emporterait la fonction.
create or replace view public.popularite_tatoueurs as
  select
    t.id,
    t.slug,
    coalesce(c.total, 0)::bigint                as consultations,
    coalesce(f.coeurs, 0)::bigint               as coeurs,
    coalesce(a.abonnes, 0)::bigint              as abonnes,
    --  LA PONDÉRATION, SUR UNE SEULE LIGNE : le coût du geste, du plus
    --  léger au plus engageant (voir l'en-tête de la nº 62).
    (coalesce(c.total, 0)
       + 3 * coalesce(f.coeurs, 0)
       + 8 * coalesce(a.abonnes, 0))::bigint    as score
  from public.tatoueurs t
  left join public.clics_tatoueurs c on c.slug = t.slug
  left join lateral (
    select count(*) as coeurs
      from public.favoris_photos fp
      join public.photos_tatoueur p on p.id = fp.photo_id
     where p.tatoueur_id = t.id
  ) f on true
  left join lateral (
    select count(*) as abonnes
      from public.tatoueurs_suivis s
     where s.tatoueur_id = t.id
  ) a on true;

--  ⚠️ LA LIGNE QUI CORRIGE TOUT : la vue lit avec les droits de son
--  propriétaire, comme n'importe quelle vue d'agrégat. Écrite à part de
--  la définition pour qu'elle se voie, et parce qu'un `create or
--  replace view` ne remet pas les options à zéro.
alter view public.popularite_tatoueurs set (security_invoker = false);

comment on view public.popularite_tatoueurs is
  'Le score de popularité d''un portfolio (yokofolio, nº 62, réparée par la nº 64) : consultations + 3 × cœurs + 8 × abonnés. Elle ne rend que des NOMBRES — jamais une ligne de favoris ni de suivis, jamais un identifiant de compte. Lue par la recherche (rechercher_tatoueurs) ET par le chemin de repli du site.';

grant select on public.popularite_tatoueurs to anon, authenticated;

-- ------------------------------------------------------------
--  VÉRIFICATION IMMÉDIATE — n'écrit rien.
-- ------------------------------------------------------------
--  Avant cette migration, `coeurs` et `abonnes` étaient à zéro partout.
--  Après, ils doivent porter les vrais nombres. Une seule ligne à lire :
select
  count(*)                                   as portfolios,
  sum(consultations)                         as total_consultations,
  sum(coeurs)                                as total_coeurs,
  sum(abonnes)                               as total_abonnes,
  max(score)                                 as meilleur_score
from public.popularite_tatoueurs;
