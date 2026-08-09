-- =====================================================================
--  YOKOFOLIO — MIGRATION Nº 40 : LE RAYON DU MODE « À DOMICILE »
-- =====================================================================
--  À exécuter dans l'éditeur SQL de Supabase, APRÈS la nº 39
--  (yokofolio-liaisons-immediates.sql).
--
--  CE QU'ELLE AJOUTE : UNE COLONNE, `modes_exercice.rayon_km`.
--  Un artiste qui se déplace annonçait une ville, jamais jusqu'où il
--  allait — « à domicile à Lyon » ne dit pas s'il vient à Vienne. Le
--  formulaire propose désormais 10, 25, 50, 100 ou 200 km, et la
--  valeur se range ici.
--
--  ⚠️ ELLE NE VAUT QUE POUR « À DOMICILE ». Partout ailleurs elle est
--  null, et le formulaire l'écrit ainsi (voir `ecrireModes`) : un
--  rayon autour d'un salon n'aurait pas de sens — le salon a une
--  adresse, on y vient.
--
--  ⚠️ ET SEULEMENT AUTOUR D'UNE VILLE. Le sélecteur ne s'affiche pas
--  si le lieu choisi est une région ou un pays : « 50 km autour de la
--  France » ne veut rien dire. C'est la règle du champ de localité du
--  moteur de recherche, appliquée au formulaire.
--
--  SANS RISQUE : une colonne facultative, aucune ligne modifiée.
--  Rejouable autant de fois qu'on veut.
-- =====================================================================

alter table public.modes_exercice
  add column if not exists rayon_km integer;

comment on column public.modes_exercice.rayon_km is
  'Jusqu''où l''artiste se déplace, en km, pour le mode « domicile » uniquement (10, 25, 50, 100, 200). Null partout ailleurs, et null tant qu''aucun rayon n''est choisi.';

--  LES VALEURS ADMISES — les cinq du formulaire, ou rien.
do $migration$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'modes_exercice_rayon_connu'
  ) then
    alter table public.modes_exercice
      add constraint modes_exercice_rayon_connu
      check (rayon_km is null or rayon_km in (10, 25, 50, 100, 200));
  end if;
end
$migration$;

--  ÉTAT DES LIEUX — n'écrit rien.
select
  count(*) filter (where genre = 'domicile')                    as modes_a_domicile,
  count(*) filter (where genre = 'domicile' and rayon_km is not null) as avec_un_rayon
from public.modes_exercice;
