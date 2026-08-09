-- ============================================================
--  ROSWEL — PROSPECTION : le compte Instagram du prospect
-- ============================================================
--  OÙ L'EXÉCUTER :
--   1. Ouvrir https://supabase.com/dashboard et choisir le projet
--   2. Menu de gauche : "SQL Editor"
--   3. Bouton "New query" (nouvelle requête)
--   4. Coller TOUT ce fichier, puis cliquer "Run"
--   5. Le message "Success. No rows returned" = tout est bon
--
--  Réexécutable sans danger.
--
--  À QUOI ÇA SERT
--  --------------
--  Instagram pèse 25 points dans le score de confiance, et ce sont
--  précisément les points qu'un prospect n'a PAS encore (il n'a pas
--  relié son compte). Savoir qu'il en a un, et lequel, sert à deux
--  choses : vérifier d'un coup d'œil qu'il est actif, et lui écrire
--  un message qui parle de SON compte plutôt que d'un compte
--  hypothétique.
--
--  QUI REMPLIT CETTE COLONNE
--  -------------------------
--  La recherche Google (src/lib/google-prospects.ts), quand la fiche
--  Google expose l'adresse — c'est-à-dire quand l'entreprise a
--  déclaré sa page Instagram comme site internet. L'API Places (New)
--  n'a AUCUN champ « réseaux sociaux » : c'est le seul cas où
--  l'information passe, et il ne coûte pas un appel de plus.
--
--  Le reste du temps la colonne reste vide, et c'est normal : la
--  colonne « Instagram » du tableau affiche alors « — ».
-- ============================================================

alter table public.artisans_prospects
  add column if not exists lien_instagram text;

-- Rien à mettre à jour sur les lignes déjà collectées : vide est la
-- bonne valeur tant que Google n'a pas donné l'information.

-- ============================================================
-- FIN — vérification rapide dans le SQL Editor :
-- select count(*) filter (where lien_instagram is not null) as avec,
--        count(*) as total
--   from public.artisans_prospects;
-- ============================================================
