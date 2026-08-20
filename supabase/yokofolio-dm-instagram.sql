-- ============================================================
-- nº 408 — « J'ACCEPTE LES DEMANDES PAR DM INSTAGRAM »
-- ============================================================
-- UNE CASE À COCHER DANS LE FORMULAIRE, sous le champ Instagram, et
-- une mention sur la fiche publique : la ligne Instagram devient
-- « Instagram • DM » quand elle est cochée. Il faut donc UNE COLONNE
-- de plus sur `tatoueurs` :
--
--   dm_instagram  boolean  not null  default false
--
-- ⚠️ LE DÉFAUT EST `false`, ET C'EST CE QUI REND LA MIGRATION SANS
-- DANGER : toutes les fiches existantes reçoivent la case DÉCOCHÉE,
-- comme demandé. Aucune ne se met à annoncer les DM sans que son
-- propriétaire l'ait choisi. `not null` évite d'avoir à traiter un
-- troisième état (« on ne sait pas ») qui n'a aucun sens ici.
--
-- ⚠️ L'ORDRE : CETTE MIGRATION D'ABORD, LE DÉPLOIEMENT ENSUITE.
--  · migration passée, ancien site déployé → la colonne existe et
--    personne ne l'écrit ni ne la lit : rien ne change, rien ne casse ;
--  · site nº 408 déployé, migration PAS passée → RIEN NE CASSE NON
--    PLUS, et c'est voulu : `dm_instagram` est inscrite dans la liste
--    `optionnelles` du formulaire (FormulaireFiche). Si la base refuse
--    la colonne, l'envoi la RETIRE et rejoue — la fiche s'enregistre,
--    tout le reste est écrit. La case se coche à l'écran mais son
--    choix n'est pas conservé, et la fiche publique n'affiche jamais
--    « • DM ». Passer la migration suffit à débloquer, sans rien
--    réenregistrer d'autre.
--    AUCUNE VERSION DU SITE N'EXIGE DONC CETTE MIGRATION pour
--    fonctionner ; elle est ce qui rend la case UTILE, pas ce qui
--    rend le site vivant.
--
-- IDEMPOTENTE : `add column if not exists` — rejouable telle quelle,
-- sans effet la seconde fois, et sans jamais réécrire une valeur déjà
-- choisie par un artiste.
-- ============================================================

begin;

alter table public.tatoueurs
  add column if not exists dm_instagram boolean not null default false;

comment on column public.tatoueurs.dm_instagram is
  'L''artiste accepte-t-il les demandes par message privé Instagram ? Déclaré par lui, jamais deviné (passe nº 408). Vrai = la fiche publique affiche « Instagram • DM ». Défaut false : les fiches d''avant la migration sont décochées.';

commit;

-- ============================================================
-- VÉRIFICATION (à coller après la migration ; deux requêtes)
-- ============================================================
-- a) La colonne existe, elle est booléenne, non nulle, défaut false :
--    select column_name, data_type, is_nullable, column_default
--      from information_schema.columns
--     where table_schema = 'public'
--       and table_name = 'tatoueurs'
--       and column_name = 'dm_instagram';
--
-- b) Doit rendre 0 pour `coches` tant que personne n'a coché la case —
--    et `total` = le nombre de fiches :
--    select count(*) as total,
--           count(*) filter (where dm_instagram) as coches
--      from public.tatoueurs;
