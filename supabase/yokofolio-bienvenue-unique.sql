-- ============================================================
--  YOKOFOLIO — UNE SEULE BIENVENUE PAR COMPTE
--  (passe nº 695 — FACULTATIF, et sans ordre imposé)
-- ============================================================
--  À COLLER dans l'éditeur SQL de Supabase, puis « Run ».
--  Se relance sans risque : la seconde fois ne trouve plus rien.
--
--  TU N'ES PAS OBLIGÉ DE LE LANCER
--  --------------------------------
--  Le site fait ce ménage TOUT SEUL, compte par compte, la première
--  fois que chacun rouvre sa boîte de nouvelles (voir
--  `poserLaBienvenue`, src/lib/notifications.ts). Ton propre compte
--  sera donc propre dès ta prochaine visite, sans rien coller ici.
--  CE FICHIER SERT À UNE SEULE CHOSE : nettoyer d'un coup les comptes
--  qui ne se reconnecteront peut-être jamais, et qui garderaient
--  sinon leurs doublons indéfiniment. C'est du confort, pas une
--  réparation nécessaire.
--
--  D'OÙ VENAIENT CES DOUBLONS
--  ---------------------------
--  La route des nouvelles lisait les 50 DERNIÈRES, puis posait le
--  message de bienvenue si elle ne l'y voyait pas. Or la bienvenue est
--  LA PLUS ANCIENNE nouvelle d'un compte : passé cinquante, elle sort
--  de cette fenêtre. La garde ne la voyait plus — et en reposait une à
--  CHAQUE ouverture de la boîte. Les comptes les plus actifs (le tien
--  au premier chef) en ont donc accumulé beaucoup.
--  La passe nº 695 a corrigé la garde : elle cherche désormais la
--  bienvenue DIRECTEMENT, pas dans une fenêtre.
--
--  CE QUE CE FICHIER EFFACE, ET RIEN D'AUTRE
--  ------------------------------------------
--  Les notifications de genre « bienvenue » EN TROP. Pour chaque
--  compte, la PLUS ANCIENNE est gardée — c'est la vraie, celle du jour
--  où le compte est né. Aucune autre nouvelle n'est touchée : ni une
--  validation, ni un refus, ni une suppression programmée.
-- ============================================================

-- ------------------------------------------------------------
-- 1) CE QU'ON VA EFFACER — AFFICHÉ AVANT, POUR RELECTURE
-- ------------------------------------------------------------
--  Une ligne par compte concerné : combien de bienvenues il porte,
--  et combien vont partir. Si ce bloc ne rend rien, il n'y a rien à
--  faire — tu peux t'arrêter là.
select
  user_id                       as compte,
  count(*)                      as bienvenues_en_base,
  count(*) - 1                  as a_effacer,
  min(creee_le)                 as la_gardee
from public.notifications_compte
where genre = 'bienvenue'
group by user_id
having count(*) > 1
order by count(*) desc;

-- ------------------------------------------------------------
-- 2) LE MÉNAGE
-- ------------------------------------------------------------
--  On garde, par compte, la ligne dont `creee_le` est la plus
--  ancienne ; à égalité parfaite, `id` départage — il en reste donc
--  toujours EXACTEMENT une, jamais zéro.
with a_garder as (
  select distinct on (user_id) id
    from public.notifications_compte
   where genre = 'bienvenue'
   order by user_id, creee_le asc, id asc
)
delete from public.notifications_compte
 where genre = 'bienvenue'
   and id not in (select id from a_garder);

-- ------------------------------------------------------------
-- 3) VÉRIFICATION — doit rendre ZÉRO ligne
-- ------------------------------------------------------------
select user_id, count(*)
  from public.notifications_compte
 where genre = 'bienvenue'
 group by user_id
having count(*) > 1;
