-- ============================================================
--  nº 728 — DIAGNOSTIC : l'image cassée des favoris récents
-- ============================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE (production).
--  LECTURE SEULE : aucune écriture, aucun droit modifié — ce
--  fichier ne fait que REGARDER. Rejouable à volonté.
--
--  CE QUE L'ATELIER A ÉTABLI (banc de la passe, favori inséré puis
--  observé) : le pipeline des favoris est SAIN — un favori dont la
--  ligne photo porte une adresse s'affiche. Deux signatures de panne
--  ont été reproduites, et chacune laisse une trace DIFFÉRENTE dans
--  l'adresse de l'image cassée :
--
--   SIGNATURE A — l'adresse de l'image commence par `/_next/image?…`
--     → la donnée est BONNE ; c'est l'OPTIMISEUR d'images qui échoue
--       à aller chercher la source chez Supabase. Cohérent avec
--       « anciens favoris OK » : leurs tailles déjà fabriquées sont
--       servies par le cache, une photo jamais affichée en grand est
--       une premières demande qui doit refaire le voyage.
--   SIGNATURE B — l'image n'a PAS d'adresse (src vide)
--     → la ligne de `photos_tatoueur` n'a ni `url` ni `miniature`.
--   SIGNATURE C — l'adresse est l'URL Supabase directe (…supabase.co…)
--     → le FICHIER manque dans le stockage (404), la ligne est bonne.
--
--  LE GESTE QUI TRANCHE, AVANT MÊME CE SQL (une minute) :
--   1. /mes-favoris, clic droit sur l'image cassée
--      → « Copier l'adresse de l'image ».
--   2. La coller dans un nouvel onglet, noter ce qui s'affiche
--      (une erreur avec un code ? un message de Vercel ? rien ?).
--   3. Si l'adresse est un `/_next/image?url=…` : copier ce qu'il y a
--      APRÈS `url=` (l'adresse source, encodée), la décoder
--      grossièrement (%3A → :, %2F → /) et l'ouvrir AUSSI :
--      si la source s'ouvre mais le `/_next/image` échoue, c'est
--      l'optimiseur (signature A confirmée) ; si la source échoue
--      aussi, c'est le stockage (signature C).

-- ------------------------------------------------------------
--  1) LES DIX DERNIERS FAVORIS, AVEC LEUR LIGNE PHOTO
-- ------------------------------------------------------------
--  ATTENDU si tout va bien : chaque ligne montre `url_presente = t`,
--  une longueur raisonnable (~110 caractères) et un préfixe
--  `https://…supabase.co/storage/v1/object/public/…`.
--  CE QUI TRAHIRAIT LA SIGNATURE B : `url_presente = f`, ou un
--  préfixe qui ne commence pas par https (adresse relative, vide…).
select
  f.cree_le                                   as favori_ajoute_le,
  p.id                                        as photo_id,
  (p.url is not null and p.url <> '')         as url_presente,
  length(p.url)                               as url_longueur,
  left(p.url, 60)                             as url_debut,
  (p.miniature is not null and p.miniature <> '') as miniature_presente,
  left(p.miniature, 60)                       as miniature_debut
  from public.favoris_photos f
  left join public.photos_tatoueur p on p.id = f.photo_id
 order by f.cree_le desc
 limit 10;

-- ------------------------------------------------------------
--  2) LA COMPARAISON ANCIEN / NOUVEAU
-- ------------------------------------------------------------
--  La même lecture, sur les dix PREMIERS favoris (les anciens, ceux
--  qui s'affichent). Si les deux tableaux montrent des adresses de
--  même forme, la donnée est innocentée : la panne est côté
--  optimiseur ou stockage (signatures A ou C), pas côté base.
select
  f.cree_le                                   as favori_ajoute_le,
  p.id                                        as photo_id,
  (p.url is not null and p.url <> '')         as url_presente,
  length(p.url)                               as url_longueur,
  left(p.url, 60)                             as url_debut
  from public.favoris_photos f
  left join public.photos_tatoueur p on p.id = f.photo_id
 order by f.cree_le asc
 limit 10;

-- ------------------------------------------------------------
--  3) Y A-T-IL DES LIGNES PHOTO SANS ADRESSE, QUELQUE PART ?
-- ------------------------------------------------------------
--  ATTENDU : 0. Un nombre au-dessus de zéro nommerait la signature B
--  et donnerait la liste exacte des photos à reprendre.
select count(*) as photos_sans_adresse
  from public.photos_tatoueur
 where url is null or url = '';

--  Et lesquelles, le cas échéant (vide si le compte ci-dessus est 0) :
select id, tatoueur_id, style, cree_le
  from public.photos_tatoueur
 where url is null or url = ''
 order by cree_le desc
 limit 20;

-- ------------------------------------------------------------
--  CE QUE JE FERAI DE TA RÉPONSE (passe suivante)
-- ------------------------------------------------------------
--   · Signature A (optimiseur) : le remède est côté hébergeur/config
--     d'images, pas côté base — on le traitera avec l'adresse exacte
--     et le message d'erreur que tu auras relevés au geste 1-3.
--   · Signature B (donnée) : je livre un rattrapage sur le modèle des
--     outils précédents (essai à blanc par défaut) pour re-remplir
--     les adresses depuis le stockage.
--   · Signature C (fichier absent) : on regardera ce que la reprise
--     ou une suppression a fait au fichier, avec son chemin exact.
