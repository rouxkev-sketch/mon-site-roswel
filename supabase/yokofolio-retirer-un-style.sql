-- ============================================================
--  YOKOFOLIO — RETIRER UN STYLE ACCEPTÉ (outil, PAS une migration)
-- ============================================================
--  ⚠️ CE FICHIER NE PORTE AUCUN NUMÉRO, et c'est voulu : ce n'est pas
--  une migration. Il ne crée rien, ne modifie aucune structure, et
--  n'a pas à être « passé » dans l'ordre. C'est un OUTIL, à ouvrir le
--  jour où l'on en a besoin — comme
--  yokofolio-verification-migrations.sql.
--
--  ⚠️ ET C'EST DÉSORMAIS LE CHEMIN DE SECOURS, plus le chemin normal.
--  Depuis la passe nº 123, /admin → « Suggestions de styles » porte un
--  bouton « Retirer le style » sur chaque ligne acceptée, avec sa
--  confirmation. Ce fichier reste pour les cas où l'écran n'est pas
--  disponible, ou pour retirer plusieurs styles d'un coup.
--
--  CE QUE ÇA FAIT
--  --------------
--  Repasse une ligne « acceptee » à « refusee ». Le style quitte
--  aussitôt le catalogue du site : le code ne lit QUE les lignes
--  acceptées (voir src/lib/styles-ajoutes.ts), et le slug se libère
--  — l'index d'unicité ne vaut que sur les acceptées.
--
--  CE QUE ÇA NE FAIT PAS
--  ---------------------
--  Les portfolios qui avaient coché ce style gardent son slug dans
--  leur colonne `styles`. Il ne s'affiche plus nulle part (aucun
--  libellé ne lui répond), et réaccepter le même nom le fait revenir
--  tel quel, sur les mêmes fiches. C'est voulu : on ne touche pas au
--  travail des tatoueurs pour corriger une erreur d'administration.
--
--  ⚠️ NE JAMAIS FAIRE `delete` : la ligne est l'archive de la demande
--  ET du nom retenu. La passer à « refusee » suffit, et se défait.
-- ============================================================

-- ------------------------------------------------------------
-- 1) REGARDER AVANT D'AGIR — quels styles sont dans la liste ?
-- ------------------------------------------------------------
select slug, label, famille, traite_le
  from public.suggestions_style
 where etat = 'acceptee'
 order by label;

-- ------------------------------------------------------------
-- 2) RETIRER « Neo-Réalisme »
-- ------------------------------------------------------------
--  ⚠️ ON VISE LE SLUG, PAS LE LIBELLÉ. Le libellé porte accents,
--  majuscules et traits d'union — « Neo-Réalisme », « Néo-réalisme »,
--  « Neo-realisme » s'écrivent de trop de façons pour servir de clé.
--  Le slug, lui, est calculé une fois pour toutes par le site
--  (minuscules, sans accent) et sert d'adresse publique : c'est LUI
--  l'identifiant. « Neo-Réalisme » donne « neo-realisme ».
--
--  `and etat = 'acceptee'` : on ne touche qu'une ligne qui est
--  vraiment dans la liste — relancer la requête ne fait rien.
update public.suggestions_style
   set etat = 'refusee',
       traite_le = now()
 where slug = 'neo-realisme'
   and etat = 'acceptee';

-- ------------------------------------------------------------
-- 3) VÉRIFIER
-- ------------------------------------------------------------
--  Zéro ligne rendue = le style a bien quitté la liste.
select slug, label, etat
  from public.suggestions_style
 where slug = 'neo-realisme';

-- ------------------------------------------------------------
-- 4) ET POUR UN AUTRE STYLE ?
-- ------------------------------------------------------------
--  Remplacer le slug dans la requête du 2). Pour le retrouver sans se
--  tromper, la requête du 1) le donne à côté de son libellé.
--
--  POUR LE REMETTRE (on s'est trompé dans l'autre sens) :
--
--    update public.suggestions_style
--       set etat = 'acceptee', traite_le = now()
--     where slug = 'neo-realisme'
--       and etat = 'refusee';
--
--  ⚠️ Cela ne marche que si aucun AUTRE style accepté n'a pris ce
--  slug entre-temps — l'index d'unicité refuserait la seconde.
--
--  LE CATALOGUE SE RELIT TOUT SEUL en moins d'une minute (cache de
--  src/lib/styles-ajoutes.ts). Rien à redémarrer.
