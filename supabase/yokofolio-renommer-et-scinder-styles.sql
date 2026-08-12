-- =====================================================================
--  MIGRATION Nº 66 — RENOMMER ET SCINDER DES STYLES, SANS RIEN PERDRE
--  ---------------------------------------------------------------------
--  À LANCER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE FOIS.
--  Elle se relance sans risque : chaque écriture est conditionnée à
--  l'état de départ (aucune ne s'applique deux fois).
--
--  CE QU'ELLE FAIT (passe nº 230-§2) :
--   1. « Neo-Réaalisme » — une FAUTE DE FRAPPE, présente en base ET
--      dans l'adresse publique (`/tatouage/neo-reaalisme/…`) — devient
--      « Néo-réalisme », slug `neo-realisme` ;
--   2. « Biomécanique / Organique » est SCINDÉ : `biomecanique` garde
--      son slug et s'appelle désormais « Biomécanique », `organique`
--      est un style neuf ;
--   3. « Cyber-tribal / Cyberpunk » est SCINDÉ de la même façon :
--      `cyber-tribal` reste, `cyberpunk` est neuf.
--
--  ⚠️ LES DEUX AUTRES CHANGEMENTS DE LA PASSE — « Anime / Manga » →
--  « Anime & Manga » et « Japonais (Irezumi) » → « Japonais · Irezumi »
--  — NE SONT PAS ICI, ET C'EST NORMAL : ces deux styles vivent dans le
--  CODE (src/config/tatouage.ts), pas en base. Leur libellé y a déjà
--  changé. La base ne connaît que les slugs, qui ne bougent pas.
--
--  ⚠️ AUCUNE FICHE NE PERD UN STYLE. Une fiche qui portait un style
--  scindé reçoit LES DEUX : l'ancien slug est conservé, le nouveau est
--  AJOUTÉ à côté. Le nombre total d'associations ne peut donc
--  qu'augmenter — les requêtes de comptage des étapes 1) et 5) le
--  prouvent, avant et après.
--
--  ⚠️ CE QUE LA MIGRATION NE FAIT PAS, ET POURQUOI. Les PHOTOS
--  (`photos_tatoueur.style`) gardent leur tag d'origine : une photo
--  déposée en « biomecanique » reste en « biomecanique ». La machine
--  ne peut pas deviner laquelle des deux moitiés d'un style scindé
--  décrit une image donnée — seul l'artiste le sait, et il la
--  reclasse quand il veut. Comme la recherche lit le style DANS LES
--  PHOTOS (migration nº 58), « Organique » et « Cyberpunk » ne
--  ramèneront des résultats qu'une fois des photos taguées ainsi :
--  c'est voulu, et c'est honnête — mieux vaut un style vide qu'un
--  style qui ment sur ce qu'il montre.
-- =====================================================================

-- ------------------------------------------------------------
-- 1) COMPTER AVANT — à garder sous les yeux
-- ------------------------------------------------------------
--  Le total des associations (une ligne = une fiche × un style) et le
--  détail des cinq slugs concernés.
select 'AVANT' as moment,
       (select sum(coalesce(array_length(styles, 1), 0))
          from public.tatoueurs) as associations_totales,
       (select count(*) from public.tatoueurs
         where styles @> array['biomecanique']) as fiches_biomecanique,
       (select count(*) from public.tatoueurs
         where styles @> array['organique']) as fiches_organique,
       (select count(*) from public.tatoueurs
         where styles @> array['cyber-tribal']) as fiches_cyber_tribal,
       (select count(*) from public.tatoueurs
         where styles @> array['cyberpunk']) as fiches_cyberpunk,
       (select count(*) from public.tatoueurs
         where styles @> array['neo-reaalisme']) as fiches_neo_reaalisme;

-- ------------------------------------------------------------
-- 2) LA FAUTE DE FRAPPE — « neo-reaalisme » → « neo-realisme »
-- ------------------------------------------------------------
--  a) LE CATALOGUE. Le style vit dans `suggestions_style` (il est né
--     d'une suggestion acceptée, migration nº 52). On corrige son slug
--     ET son libellé.
--     ⚠️ Si un « neo-realisme » accepté existait déjà, l'index
--     d'unicité refuserait la mise à jour : on ne renomme donc que si
--     la place est libre.
update public.suggestions_style
   set slug = 'neo-realisme',
       label = 'Néo-réalisme'
 where slug = 'neo-reaalisme'
   and not exists (
     select 1 from public.suggestions_style autre
      where autre.slug = 'neo-realisme'
   );

--  b) LES FICHES qui portaient l'ancien slug — on REMPLACE, on
--     n'ajoute pas : ce n'est pas une scission, c'est la même chose
--     mieux écrite. `array_replace` ne touche pas aux autres styles.
update public.tatoueurs
   set styles = array_replace(styles, 'neo-reaalisme', 'neo-realisme')
 where styles @> array['neo-reaalisme'];

--  c) LES PHOTOS taguées avec l'ancien slug — même remplacement.
update public.photos_tatoueur
   set style = 'neo-realisme'
 where style = 'neo-reaalisme';

--  d) LES SUGGESTIONS EN ATTENTE, s'il en traîne une avec la faute.
update public.suggestions_style
   set label = 'Néo-réalisme'
 where slug = 'neo-realisme'
   and label <> 'Néo-réalisme';

-- ------------------------------------------------------------
-- 3) LA SCISSION « Biomécanique / Organique »
-- ------------------------------------------------------------
--  Toute fiche qui porte `biomecanique` reçoit AUSSI `organique`.
--  ⚠️ `and not styles @> array['organique']` : relancer la migration
--  n'ajoute pas un doublon.
update public.tatoueurs
   set styles = styles || array['organique']
 where styles @> array['biomecanique']
   and not styles @> array['organique'];

-- ------------------------------------------------------------
-- 4) LA SCISSION « Cyber-tribal / Cyberpunk »
-- ------------------------------------------------------------
update public.tatoueurs
   set styles = styles || array['cyberpunk']
 where styles @> array['cyber-tribal']
   and not styles @> array['cyberpunk'];

-- ------------------------------------------------------------
-- 5) COMPTER APRÈS — la preuve
-- ------------------------------------------------------------
--  `associations_totales` doit avoir AUGMENTÉ d'exactement
--  (fiches_biomecanique + fiches_cyber_tribal) mesurées à l'étape 1),
--  et jamais diminué. `fiches_organique` doit désormais égaler
--  `fiches_biomecanique`, et `fiches_cyberpunk` égaler
--  `fiches_cyber_tribal`. `fiches_neo_reaalisme` doit valoir ZÉRO.
select 'APRÈS' as moment,
       (select sum(coalesce(array_length(styles, 1), 0))
          from public.tatoueurs) as associations_totales,
       (select count(*) from public.tatoueurs
         where styles @> array['biomecanique']) as fiches_biomecanique,
       (select count(*) from public.tatoueurs
         where styles @> array['organique']) as fiches_organique,
       (select count(*) from public.tatoueurs
         where styles @> array['cyber-tribal']) as fiches_cyber_tribal,
       (select count(*) from public.tatoueurs
         where styles @> array['cyberpunk']) as fiches_cyberpunk,
       (select count(*) from public.tatoueurs
         where styles @> array['neo-reaalisme']) as fiches_neo_reaalisme;

--  ET LE CATALOGUE, pour l'œil :
select slug, label, etat
  from public.suggestions_style
 where slug in ('neo-realisme', 'neo-reaalisme')
 order by slug;

-- ------------------------------------------------------------
-- 6) APRÈS LA MIGRATION
-- ------------------------------------------------------------
--  · LE CATALOGUE SE RELIT TOUT SEUL en moins d'une minute (cache de
--    src/lib/styles-ajoutes.ts) — rien à redémarrer ;
--  · l'ancienne adresse `/tatouage/neo-reaalisme/<ville>` REDIRIGE en
--    301 vers `/tatouage/neo-realisme/<ville>` (next.config.ts) : les
--    liens déjà partagés et l'index de Google suivent ;
--  · les deux styles neufs (`organique`, `cyberpunk`) sont dans le
--    CODE, pas en base : ils existent dès le déploiement.
