-- ============================================================
-- YOKOFOLIO — LE NOM SORT DU BROUILLON (passe nº 265, §1)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. Réexécutable sans danger (elle ne fait rien la
--  seconde fois : plus aucun brouillon ne porte de nom).
--
--  LE DÉFAUT QU'ELLE RÉPARE
--  ------------------------
--  Renommer une fiche DÉJÀ EN LIGNE écrivait le nouveau nom dans la
--  colonne `brouillon` (une copie complète de la fiche, en attente de
--  relecture) et laissait `tatoueurs.nom` — la colonne que lisent la
--  fiche publique ET la recherche de rattachement — sur l'ANCIEN nom.
--  D'où le relevé du propriétaire : la recherche proposait encore
--  « Tattoo Testyese » quand son espace affichait déjà « Graphink
--  Tatto studios ». Et comme la validation recopie le brouillon tel
--  quel dans les colonnes publiques, un brouillon reposé plus tard
--  (formulaire ouvert avant une validation, enregistré après) pouvait
--  ramener l'ancien nom : la modification était perdue.
--
--  Le code ne met plus JAMAIS le nom dans le brouillon (il s'écrit
--  directement sur la ligne, comme le verrou d'exercice, les modes et
--  les studios). Cette migration met la base au même état :
--
--   1. TOUT NOM RESTÉ DANS UN BROUILLON EST APPLIQUÉ à la fiche —
--      c'est la modification que son propriétaire a validée, et elle
--      n'attendait plus que la relecture. Rien n'est inventé : on ne
--      remonte que ce que la personne a elle-même écrit.
--   2. LA CLÉ `nom` EST RETIRÉE de tous les brouillons, pour qu'aucune
--      validation future ne puisse ramener un nom périmé.
--
--  ⚠️ ELLE NE PUBLIE RIEN, ne valide rien, ne touche ni `publie` ni
--  `statut` : les fiches en attente le restent, avec le reste de leur
--  brouillon intact (bio, styles, photos).
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans.

-- 1) LE NOM DU BROUILLON DEVIENT LE NOM DE LA FICHE.
--    `jsonb_typeof(... ->'nom') = 'string'` : on ignore un brouillon
--    qui porterait autre chose qu'un texte (aucun ne le devrait, mais
--    une migration ne fait pas confiance à ce qu'elle n'a pas écrit).
--    `btrim(...) <> ''` : jamais de nom vide.
update public.tatoueurs
   set nom = btrim(brouillon ->> 'nom')
 where brouillon is not null
   and jsonb_typeof(brouillon -> 'nom') = 'string'
   and btrim(brouillon ->> 'nom') <> ''
   and btrim(brouillon ->> 'nom') is distinct from nom;

-- 2) PLUS AUCUN BROUILLON NE PORTE DE NOM.
--    L'opérateur `-` retire une clé d'un objet jsonb.
update public.tatoueurs
   set brouillon = brouillon - 'nom'
 where brouillon is not null
   and brouillon ? 'nom';

-- 3) LE RELEVÉ, à lire dans le panneau de résultats : plus aucune
--    ligne ne doit apparaître.
select id, nom, brouillon ? 'nom' as brouillon_porte_un_nom
  from public.tatoueurs
 where brouillon is not null
   and brouillon ? 'nom';
