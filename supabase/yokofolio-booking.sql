-- ============================================================
-- YOKOFOLIO — L'ÉTAT DES CARNETS (BOOKING) (passe nº 270, §2)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. Réexécutable sans danger.
--
--  CE QUE ÇA CHANGE
--  ----------------
--  Deux colonnes sur `tatoueurs` :
--   · `booking`      — l'état déclaré des carnets, trois valeurs et
--     elles seules : 'ouvert', 'delai', 'ferme' ;
--   · `booking_mois` — le nombre de mois d'attente (1 à 12), qui n'a
--     de sens qu'avec l'état 'delai'.
--
--  D'OÙ VIENNENT CES VALEURS : du champ Booking du formulaire (bloc
--  « Mon profil », en tête des liens). Le formulaire les EXIGE à
--  l'enregistrement ; la base, elle, accepte NULL — les fiches déjà
--  en ligne n'ont rien déclaré, et le site n'invente pas l'état des
--  carnets de quelqu'un : leur fiche publique reste muette à cette
--  place jusqu'à leur prochain enregistrement.
--
--  ⚠️ AUCUNE VERSION DU SITE N'EN DÉPEND : tant que cette migration
--  n'est pas passée, l'enregistrement retire les colonnes inconnues
--  et le reste part normalement (liste `optionnelles` du formulaire) ;
--  la lecture des fiches, elle, relit sans la colonne que l'erreur
--  nomme (lib/tatoueurs, lireEnRetirantLInconnu).
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans.

alter table public.tatoueurs
  add column if not exists booking text;

alter table public.tatoueurs
  add column if not exists booking_mois integer;

comment on column public.tatoueurs.booking is
  'État déclaré des carnets : ouvert, delai ou ferme. NULL = rien déclaré, la fiche publique n''affiche rien.';

comment on column public.tatoueurs.booking_mois is
  'Mois d''attente (1 à 12), seulement quand booking = delai. NULL sinon.';

--  LES GARDE-FOUS — rejouables : on retire la contrainte si elle
--  existe déjà, puis on la repose. Une valeur hors liste ou un mois
--  hors 1-12 ne peuvent pas entrer en base, quel que soit le client.
alter table public.tatoueurs
  drop constraint if exists tatoueurs_booking_valide;
alter table public.tatoueurs
  add constraint tatoueurs_booking_valide
  check (booking is null or booking in ('ouvert', 'delai', 'ferme'));

alter table public.tatoueurs
  drop constraint if exists tatoueurs_booking_mois_valide;
alter table public.tatoueurs
  add constraint tatoueurs_booking_mois_valide
  check (booking_mois is null or booking_mois between 1 and 12);

-- LE RELEVÉ, à lire dans le panneau de résultats : les deux colonnes
-- existent.
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'tatoueurs'
   and column_name in ('booking', 'booking_mois')
 order by column_name;
