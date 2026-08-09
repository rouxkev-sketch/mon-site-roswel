-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 48 : LES ZONES DU CORPS S'EN VONT
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 47
--  (yokofolio-suppression-formulaire-demande.sql).
--
--  ⚠️⚠️ CETTE MIGRATION VIDE LA TABLE DES PHOTOS ET SUPPRIME UNE
--  COLONNE. C'est la consigne, écrite mot pour mot : « Les photos
--  déjà enregistrées avec leurs tags sont EFFACÉES. On repart de
--  zéro : il n'y a que des fiches de test, rien à préserver. »
--  Aucune fiche réelle n'est touchée — il n'en existe pas encore.
--
--  POURQUOI. Le tag « zone du corps » (19 valeurs, un couple unique
--  zone + rendu par style) s'était révélé LOURD À REMPLIR, et son
--  interface de catalogue inutilisable. Il disparaît du produit :
--  du formulaire, des fiches, des textes de remplacement — et donc
--  de la base. LE RENDU, LUI, RESTE : il se lit d'un coup d'œil au
--  dépôt, et il alimente le filtre « Rendu » du moteur de recherche.
--
--  CE QUE ÇA CHANGE À LA TABLE `photos_tatoueur` (nº 31) :
--    · la colonne `zone` disparaît, avec sa contrainte et ses index ;
--    · `rendu` devient OBLIGATOIRE : plus aucune photo « d'avant »
--      à ménager puisqu'on efface tout — désormais chaque photo
--      déposée porte son rendu, la base peut donc l'exiger ;
--    · PLUS AUCUNE RÈGLE D'UNICITÉ : la galerie d'un couple
--      style + rendu accepte plusieurs photos (vingt au plus — un
--      plafond d'interface, pas de base : voir PLAFOND_GALERIE dans
--      src/lib/photos-tatoueur.ts).
--
--  Se relance sans risque : le vidage d'une table vide ne fait rien,
--  et tout le reste est en `if exists` / `if not exists`.
-- =====================================================================

-- ------------------------------------------------------------
-- 1) L'EFFACEMENT — autorisé, fiches de test uniquement
-- ------------------------------------------------------------
--  Le vidage passe AVANT le `set not null` du point 3 : les
--  anciennes lignes sans rendu partent avec le reste, la colonne
--  peut donc devenir obligatoire sans qu'aucune ligne ne proteste.
delete from public.photos_tatoueur;

-- ------------------------------------------------------------
-- 2) LA COLONNE `zone` ET TOUT CE QUI LA PORTAIT
-- ------------------------------------------------------------
--  L'index d'unicité (un couple zone + rendu par style) meurt AVEC
--  la zone : le nouveau modèle accepte plusieurs photos par couple
--  style + rendu, il n'a pas de remplaçant.
drop index if exists public.photos_tatoueur_unicite;
drop index if exists public.photos_tatoueur_zone;
alter table public.photos_tatoueur drop constraint if exists photos_zone_connue;
alter table public.photos_tatoueur drop column if exists zone;

-- ------------------------------------------------------------
-- 3) LE RENDU DEVIENT OBLIGATOIRE
-- ------------------------------------------------------------
alter table public.photos_tatoueur alter column rendu set not null;

--  La contrainte de la nº 31 tolérait null (photos d'avant la
--  refonte) : ce cas n'existe plus, on la resserre.
alter table public.photos_tatoueur drop constraint if exists photos_rendu_connu;
alter table public.photos_tatoueur
  add constraint photos_rendu_connu check (
    rendu in ('black_and_grey', 'color')
  );

--  L'index du filtre « Rendu » était PARTIEL (`where rendu is not
--  null`) pour la même raison : refait plein, tout simplement.
drop index if exists public.photos_tatoueur_rendu;
create index if not exists photos_tatoueur_rendu
  on public.photos_tatoueur (rendu);

-- ------------------------------------------------------------
-- 4) LES COMMENTAIRES RATTRAPENT LE MODÈLE
-- ------------------------------------------------------------
--  (Celui de la colonne `zone` est parti avec elle.)
comment on table public.photos_tatoueur is
  'Le portfolio d''un tatoueur : une ligne par photo, taguée style + rendu. Vingt photos au plus par couple style + rendu — plafond tenu par le formulaire, pas par la base. Les zones du corps ont été abandonnées (migration nº 48).';
comment on column public.photos_tatoueur.rendu is
  'black_and_grey | color — identifiant ANGLAIS figé, OBLIGATOIRE depuis la migration nº 48. Le libellé français vit dans le code.';

-- ------------------------------------------------------------
--  VÉRIFICATION (facultatif)
-- ------------------------------------------------------------
--  -- La table est vide, la zone n'existe plus, le rendu est requis :
--  select count(*) as photos_restantes from public.photos_tatoueur;
--  select column_name, is_nullable
--    from information_schema.columns
--   where table_schema = 'public' and table_name = 'photos_tatoueur'
--   order by ordinal_position;
