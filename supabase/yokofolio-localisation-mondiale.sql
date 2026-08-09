-- ============================================================
-- YOKOFOLIO — LA LOCALISATION DEVIENT MONDIALE (19e migration)
-- ============================================================
--  OÙ L'EXÉCUTER : Supabase → SQL Editor → New query → coller TOUT
--  ce fichier → Run. À passer APRÈS yokofolio-hors-ligne.sql (18e).
--  Réexécutable sans danger.
--
--  CE QUE ÇA CHANGE
--  ----------------
--  La localisation ne repose plus sur une base de communes
--  FRANÇAISES : chaque fiche porte désormais SA localisation
--  complète, telle qu'elle a été choisie dans la liste mondiale
--  (OpenStreetMap via Photon — voir src/lib/geocodage). Quatre
--  colonnes s'ajoutent :
--
--    region     — État, province, Land, région… quand le pays en a
--    pays       — le pays en toutes lettres (« France », « Canada »)
--    code_pays  — son code ISO à deux lettres (« FR », « CA »)
--    lieu_id    — l'identifiant du lieu chez le fournisseur
--                 (« photon:relation:7444 ») : il permet de le
--                 RETROUVER plus tard (vérification, mise à jour,
--                 changement de fournisseur)
--
--  Les colonnes qui existaient déjà NE BOUGENT PAS et gardent leur
--  rôle : `adresse` (numéro et rue), `code_postal`, `ville_nom`,
--  `ville_slug`, `latitude`, `longitude`. C'est le COUPLE
--  latitude/longitude qui porte maintenant TOUTE la recherche par
--  rayon (calcul de distance), à la place de la table `communes`.
--
--  `ville_code_insee` : la colonne est CONSERVÉE (les fiches
--  françaises existantes y gardent leur code, c'est une donnée
--  historique valable) mais elle n'est PLUS NI LUE NI ÉCRITE par le
--  site. Sa contrainte « not null » est levée : une fiche à Berlin
--  ou à Montréal n'a évidemment pas de code INSEE.
--
--  ⚠️ CE QUE ÇA NE TOUCHE PAS : rien du projet artisans, ni la table
--  `communes` (laissée en place — voir la note en fin de fichier).

-- ------------------------------------------------------------
-- 1) LES QUATRE NOUVELLES COLONNES
-- ------------------------------------------------------------
alter table public.tatoueurs
  add column if not exists region text,
  add column if not exists pays text,
  add column if not exists code_pays text,
  add column if not exists lieu_id text;

comment on column public.tatoueurs.region is
  'État, province, Land ou région du lieu, quand le pays en a un (États-Unis, Canada, Allemagne, Brésil…). Null ailleurs. Renseigné automatiquement au choix du lieu.';
comment on column public.tatoueurs.pays is
  'Le pays en toutes lettres, dans la langue du site (« France », « États-Unis »).';
comment on column public.tatoueurs.code_pays is
  'Code pays ISO 3166-1 alpha-2, en majuscules (FR, US, CA…).';
comment on column public.tatoueurs.lieu_id is
  'Identifiant du lieu chez le fournisseur de géocodage (« photon:relation:7444 ») : sert à le retrouver plus tard.';

-- Le code postal peut manquer (ville seule, pays sans code postal) :
-- il ne doit jamais bloquer un enregistrement.
alter table public.tatoueurs alter column code_postal drop not null;

-- ------------------------------------------------------------
-- 2) LE CODE INSEE N'EST PLUS OBLIGATOIRE
--    (une fiche hors de France n'en a pas — et le site ne l'écrit
--     plus du tout)
-- ------------------------------------------------------------
do $$
begin
  alter table public.tatoueurs alter column ville_code_insee drop not null;
exception when undefined_column then
  null; -- colonne déjà retirée : rien à faire
end $$;

comment on column public.tatoueurs.ville_code_insee is
  'HISTORIQUE — code INSEE des fiches françaises créées avant la localisation mondiale. Le site ne le lit ni ne l''écrit plus : la localisation vit dans ville_nom / region / pays / latitude / longitude.';

-- ------------------------------------------------------------
-- 3) REPRISE DES FICHES EXISTANTES
--    Toutes les fiches déjà en base sont françaises : on complète ce
--    qui peut l'être SANS RIEN INVENTER.
-- ------------------------------------------------------------

-- 3.a) Le pays : « France » pour toute fiche qui n'en a pas encore.
update public.tatoueurs
set pays = 'France', code_pays = 'FR'
where pays is null;

-- 3.b) La RÉGION, déduite du code INSEE (ses deux premiers chiffres
--      sont le département) : aucune approximation, c'est une
--      correspondance officielle. Les fiches sans code INSEE (il n'y
--      en a pas encore, mais la requête doit rester juste) sont
--      laissées telles quelles.
update public.tatoueurs
set region = case substring(ville_code_insee from 1 for 2)
  when '01' then 'Auvergne-Rhône-Alpes'   when '03' then 'Auvergne-Rhône-Alpes'
  when '07' then 'Auvergne-Rhône-Alpes'   when '15' then 'Auvergne-Rhône-Alpes'
  when '26' then 'Auvergne-Rhône-Alpes'   when '38' then 'Auvergne-Rhône-Alpes'
  when '42' then 'Auvergne-Rhône-Alpes'   when '43' then 'Auvergne-Rhône-Alpes'
  when '63' then 'Auvergne-Rhône-Alpes'   when '69' then 'Auvergne-Rhône-Alpes'
  when '73' then 'Auvergne-Rhône-Alpes'   when '74' then 'Auvergne-Rhône-Alpes'
  when '21' then 'Bourgogne-Franche-Comté' when '25' then 'Bourgogne-Franche-Comté'
  when '39' then 'Bourgogne-Franche-Comté' when '58' then 'Bourgogne-Franche-Comté'
  when '70' then 'Bourgogne-Franche-Comté' when '71' then 'Bourgogne-Franche-Comté'
  when '89' then 'Bourgogne-Franche-Comté' when '90' then 'Bourgogne-Franche-Comté'
  when '22' then 'Bretagne'  when '29' then 'Bretagne'
  when '35' then 'Bretagne'  when '56' then 'Bretagne'
  when '18' then 'Centre-Val de Loire' when '28' then 'Centre-Val de Loire'
  when '36' then 'Centre-Val de Loire' when '37' then 'Centre-Val de Loire'
  when '41' then 'Centre-Val de Loire' when '45' then 'Centre-Val de Loire'
  when '2A' then 'Corse' when '2B' then 'Corse'
  when '08' then 'Grand Est' when '10' then 'Grand Est' when '51' then 'Grand Est'
  when '52' then 'Grand Est' when '54' then 'Grand Est' when '55' then 'Grand Est'
  when '57' then 'Grand Est' when '67' then 'Grand Est' when '68' then 'Grand Est'
  when '88' then 'Grand Est'
  when '02' then 'Hauts-de-France' when '59' then 'Hauts-de-France'
  when '60' then 'Hauts-de-France' when '62' then 'Hauts-de-France'
  when '80' then 'Hauts-de-France'
  when '75' then 'Île-de-France' when '77' then 'Île-de-France'
  when '78' then 'Île-de-France' when '91' then 'Île-de-France'
  when '92' then 'Île-de-France' when '93' then 'Île-de-France'
  when '94' then 'Île-de-France' when '95' then 'Île-de-France'
  when '14' then 'Normandie' when '27' then 'Normandie' when '50' then 'Normandie'
  when '61' then 'Normandie' when '76' then 'Normandie'
  when '16' then 'Nouvelle-Aquitaine' when '17' then 'Nouvelle-Aquitaine'
  when '19' then 'Nouvelle-Aquitaine' when '23' then 'Nouvelle-Aquitaine'
  when '24' then 'Nouvelle-Aquitaine' when '33' then 'Nouvelle-Aquitaine'
  when '40' then 'Nouvelle-Aquitaine' when '47' then 'Nouvelle-Aquitaine'
  when '64' then 'Nouvelle-Aquitaine' when '79' then 'Nouvelle-Aquitaine'
  when '86' then 'Nouvelle-Aquitaine' when '87' then 'Nouvelle-Aquitaine'
  when '09' then 'Occitanie' when '11' then 'Occitanie' when '12' then 'Occitanie'
  when '30' then 'Occitanie' when '31' then 'Occitanie' when '32' then 'Occitanie'
  when '34' then 'Occitanie' when '46' then 'Occitanie' when '48' then 'Occitanie'
  when '65' then 'Occitanie' when '66' then 'Occitanie' when '81' then 'Occitanie'
  when '82' then 'Occitanie'
  when '44' then 'Pays de la Loire' when '49' then 'Pays de la Loire'
  when '53' then 'Pays de la Loire' when '72' then 'Pays de la Loire'
  when '85' then 'Pays de la Loire'
  when '04' then 'Provence-Alpes-Côte d''Azur' when '05' then 'Provence-Alpes-Côte d''Azur'
  when '06' then 'Provence-Alpes-Côte d''Azur' when '13' then 'Provence-Alpes-Côte d''Azur'
  when '83' then 'Provence-Alpes-Côte d''Azur' when '84' then 'Provence-Alpes-Côte d''Azur'
  when '97' then 'Outre-mer' when '98' then 'Outre-mer'
  else null
end
where region is null
  and ville_code_insee is not null
  and length(ville_code_insee) >= 2;

-- 3.c) LES COORDONNÉES MANQUANTES, reprises de la table `communes`
--      (elle est encore là, et c'est exactement le service qu'elle
--      peut rendre une dernière fois). Une fiche qui a déjà ses
--      coordonnées n'est pas touchée.
do $$
begin
  update public.tatoueurs t
  set latitude = c.latitude, longitude = c.longitude
  from public.communes c
  where c.code_insee = t.ville_code_insee
    and (t.latitude is null or t.longitude is null
         or (t.latitude = 0 and t.longitude = 0));
exception when undefined_table then
  -- La table `communes` n'existe pas (ou plus) : les fiches sans
  -- coordonnées devront être ressaisies par leur tatoueur.
  null;
end $$;

-- 3.d) L'identifiant de lieu : les fiches d'avant la refonte n'en ont
--      pas (elles n'ont jamais été géocodées). On le marque
--      explicitement, plutôt que de laisser un null muet — la
--      prochaine modification de fiche le remplira pour de bon.
update public.tatoueurs
set lieu_id = 'historique:insee-' || ville_code_insee
where lieu_id is null and ville_code_insee is not null;

-- 3.e) LES TREIZE FICHES DE DÉMONSTRATION, alignées sur le code
--      (src/lib/tatoueurs-demo.ts) : région, pays et code pays.
--      Elles n'ont pas d'identifiant de lieu réel — elles ne sont
--      jamais passées par le géocodeur.
update public.tatoueurs set region='Auvergne-Rhône-Alpes', pays='France', code_pays='FR' where slug in ('atelier-corvus','studio-mille-traits','nadege-roux','kosei-tattoo');
update public.tatoueurs set region='Provence-Alpes-Côte d''Azur', pays='France', code_pays='FR' where slug='encre-et-sel';
update public.tatoueurs set region='Île-de-France', pays='France', code_pays='FR' where slug in ('hokusai-mecanique','camille-fauve');
update public.tatoueurs set region='Nouvelle-Aquitaine', pays='France', code_pays='FR' where slug in ('typo-sauvage','studio-cameleon');
update public.tatoueurs set region='Pays de la Loire', pays='France', code_pays='FR' where slug='ligne-claire-studio';
update public.tatoueurs set region='Occitanie', pays='France', code_pays='FR' where slug='ombre-portee';
update public.tatoueurs set region='Hauts-de-France', pays='France', code_pays='FR' where slug='maison-vermillon';
update public.tatoueurs set region='Grand Est', pays='France', code_pays='FR' where slug='trait-nord';

-- ------------------------------------------------------------
-- 4) UN INDEX POUR LA RECHERCHE PAR RAYON
--    Le calcul de distance se fait dans le site, mais l'index sert
--    déjà aux lectures par zone et aux futurs tris géographiques.
-- ------------------------------------------------------------
create index if not exists idx_tatoueurs_position
  on public.tatoueurs (latitude, longitude);

create index if not exists idx_tatoueurs_pays
  on public.tatoueurs (code_pays);

-- ------------------------------------------------------------
-- ET LA TABLE `communes` ?
-- ------------------------------------------------------------
-- Elle n'est PLUS utilisée par le site : ni la saisie, ni la
-- recherche, ni les pages « style + ville » ne la lisent (ces
-- dernières prennent désormais leurs coordonnées dans les fiches
-- elles-mêmes). Elle est CONSERVÉE volontairement :
--   * la reprise ci-dessus (3.c) s'en sert ;
--   * le produit ARTISANS, lui, continue de s'en servir (son champ
--     ville n'a pas changé) — la supprimer casserait ce produit.
-- Rien à faire de plus : elle ne coûte rien et ne gêne personne.
