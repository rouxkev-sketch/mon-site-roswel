# Les lieux déjà en base — relire, puis réécrire en anglais (passe nº 810)

**Tout ce qui suit se colle À LA MAIN dans l'éditeur SQL de Supabase,
par Kevin. Rien n'est exécuté par une passe.** Chaque bloc est
autonome ; les blocs 1 et 2 ne modifient rien.

## Ce qui est stocké, et où

Un lieu est rangé À PLAT, une colonne par information, dans **trois
tables** (plus une quatrième, à part) :

| Table | Rôle | Colonnes du lieu |
|---|---|---|
| `tatoueurs` | le lieu de la fiche elle-même (celui de l'adresse publique) | `adresse` (numéro et rue), `code_postal`, `ville_nom`, `ville_slug`, `region`, `pays`, `code_pays`, `lieu_id`, `latitude`, `longitude` — et `ville_code_insee`, historique, plus lu |
| `studios` | les adresses d'une enseigne (une par studio) | `intitule`, `adresse`, `code_postal`, `ville`, `region`, `pays`, `code_pays`, `lieu_id`, `latitude`, `longitude` |
| `modes_exercice` | les lieux d'un artiste (salon, guest, privé, disponible) | les mêmes que `studios`, plus `rayon_km` et les dates |
| `conventions` | une convention (posée par l'administration) | `ville`, `region`, `code_pays`, `latitude`, `longitude` — pas de colonne `pays` : le nom se déduit du code, en anglais |

Le format est celui du géocodeur au moment de l'enregistrement :
`ville_nom` / `ville` = le nom de la ville tel qu'OpenStreetMap le
donne (« Paris », « Lyon 1er », « Austin »), `region` = le nom COMPLET
de l'État ou de la région (« Texas », « Île-de-France », « Californie »
ou « California » selon la date), `pays` = le nom du pays (« France »,
« États-Unis » ou « United States » selon la date), `code_pays` = le
code ISO (« US », « FR »), `lieu_id` = l'identifiant chez le
fournisseur (« photon:relation:7444 »).

**Ce qui est français, et ce qui ne l'est pas.** Une adresse française
est en français parce qu'elle EST française : « 44 Rue Trousseau,
Paris » ne se traduit pas, et personne ne le demande. Ce qui est en
français PAR ERREUR D'ÉPOQUE, ce sont les noms que le géocodeur rendait
en français avant la nº 805 et qu'il rend en anglais depuis :

- le **pays** : « États-Unis », « Allemagne », « Royaume-Uni » ;
- la **région**, quand le français a son propre mot : « Californie »,
  « Floride », « Bavière », « Catalogne », « Québec » ;
- la **ville**, rarement, quand le français a un exonyme : « Londres »,
  « Munich » (identique), « Barcelone », « Lisbonne », « Bruxelles ».

## Ce que ça change, et ce qui ne bouge pas

| Colonne | Qui la lit | Réécrire ? |
|---|---|---|
| `pays` | l'affichage seulement (fiches, cartes, champ, filet des suggestions) — la recherche par pays compare le **code** (`p_code_pays`) | **Oui**, sans risque : depuis la nº 805 l'affichage reconnaît déjà les formes françaises et anglaises (`lib/adresse`, `RACCOURCIS_PAYS`) et écrit « USA », « Germany » ; la base dira enfin la même chose que l'écran |
| `region` | l'affichage (le code de l'État : « TX », « CA » — les deux langues sont reconnues) **et la recherche par région**, qui compare le NOM normalisé (`yf_normaliser(region) = yf_normaliser(p_region)`) | **Oui, et c'est le point qui compte** : le champ propose désormais « California » (anglais), une fiche écrite « Californie » ne répond plus à cette recherche. Réécrite dans le mot du géocodeur, elle répond de nouveau |
| `ville_nom` / `ville` | l'affichage, la recherche par ville (`yf_commune`), et **`ville_slug` = l'adresse publique** `/tatouage/<style>/<ville>` | **Non.** Une ville se dit par son nom ; les rares exonymes français (« Londres ») concernent des fiches européennes d'avant la nº 805, et changer le nom changerait la limace, donc une adresse indexée, sans redirection possible. À traiter fiche par fiche, à la main, si Kevin le veut un jour |
| `adresse`, `code_postal`, `lieu_id`, `latitude`, `longitude`, `slug` | tout | **Jamais** |
| `tatoueurs.villes` (JSON, l'ancien mode itinérant) | plus aucun écran | **Non** (héritage) |

Deux voies pour réécrire, au choix — **les deux se relancent sans
dégât**, et l'une peut compléter l'autre :

- **A · Le SQL ci-dessous** (blocs 3 et 4) : des tables de correspondance
  écrites ici, pays par code ISO et régions par exonyme français connu.
  Sans réseau, immédiat, mais il ne connaît que ce qui est écrit dans ce
  document ; le bloc 5 montre ce qu'il laisse.
- **B · Le script `outils/relire-les-lieux-en-anglais.mjs`** : pour
  chaque ligne qui a un point, il redemande au géocodeur ce qu'il y a à
  ce point, EN ANGLAIS, et réécrit `region` et `pays` dans ses mots
  exacts — donc précisément ceux que le champ de saisie propose
  aujourd'hui. Essai à blanc par défaut, `--reel` pour agir, une requête
  par seconde, jamais la ville ni la rue. Il refuse d'écrire quand le
  point n'est pas dans le pays que la ligne dit. C'est la voie la plus
  juste pour les régions hors des tables du bloc 4.

      node outils/relire-les-lieux-en-anglais.mjs           (essai à blanc)
      node outils/relire-les-lieux-en-anglais.mjs --reel    (le vrai passage)

**Quand le site suit-il ?** Les fiches et les pages de ville sont
cuites (ISR, cinq minutes) : compter deux chargements après l'échéance.
Le filet des suggestions (`/api/lieux` quand le géocodeur ne répond
pas) relit la base à chaque fois — lui suit tout de suite.

---

## 1 · Ce que la base porte : les pays (lecture seule)

```sql
select t.table_name, t.code_pays, t.pays, count(*) as lignes
  from (
    select 'tatoueurs'      as table_name, code_pays, pays from public.tatoueurs
    union all
    select 'studios',                      code_pays, pays from public.studios
    union all
    select 'modes_exercice',               code_pays, pays from public.modes_exercice
  ) t
 group by 1, 2, 3
 order by 1, 2, 3;
```

Une ligne par forme rencontrée : « US · États-Unis · 12 », « US ·
United States · 3 », « FR · France · 40 »… Deux formes pour un même code
= exactement ce que le bloc 3 unifie.

## 2 · Ce que la base porte : les régions (lecture seule)

```sql
select t.table_name, t.code_pays, t.region, count(*) as lignes
  from (
    select 'tatoueurs'      as table_name, code_pays, region from public.tatoueurs
    union all
    select 'studios',                      code_pays, region from public.studios
    union all
    select 'modes_exercice',               code_pays, region from public.modes_exercice
    union all
    select 'conventions',                  code_pays, region from public.conventions
  ) t
 where t.region is not null
 group by 1, 2, 3
 order by 1, 2, 3;
```

À lire à l'œil : « Californie » et « California » sous le même code
sont deux graphies d'une même région, et seule la seconde répond à la
recherche d'aujourd'hui.

---

## 3 · Le pays, en anglais, d'après son code

Le nom vient du **code ISO** (la donnée sûre), jamais de l'ancien nom.
La table ci-dessous couvre les codes qu'une base de tatoueurs peut
porter ; un code absent de la table n'est PAS touché (le bloc 5 le
montre). Ajouter une ligne `('XX', 'Name')` suffit. Le bloc est enfermé
dans une transaction : tout passe, ou rien.

```sql
begin;

create temp table pays_en (code text primary key, nom text not null);
insert into pays_en values
  ('US', 'United States'), ('CA', 'Canada'), ('MX', 'Mexico'),
  ('FR', 'France'), ('BE', 'Belgium'), ('CH', 'Switzerland'), ('LU', 'Luxembourg'),
  ('MC', 'Monaco'), ('DE', 'Germany'), ('AT', 'Austria'), ('NL', 'Netherlands'),
  ('GB', 'United Kingdom'), ('IE', 'Ireland'), ('ES', 'Spain'), ('PT', 'Portugal'),
  ('IT', 'Italy'), ('GR', 'Greece'), ('DK', 'Denmark'), ('SE', 'Sweden'),
  ('NO', 'Norway'), ('FI', 'Finland'), ('IS', 'Iceland'), ('PL', 'Poland'),
  ('CZ', 'Czechia'), ('SK', 'Slovakia'), ('HU', 'Hungary'), ('RO', 'Romania'),
  ('BG', 'Bulgaria'), ('HR', 'Croatia'), ('SI', 'Slovenia'), ('RS', 'Serbia'),
  ('UA', 'Ukraine'), ('RU', 'Russia'), ('TR', 'Turkey'), ('IL', 'Israel'),
  ('AE', 'United Arab Emirates'), ('MA', 'Morocco'), ('DZ', 'Algeria'),
  ('TN', 'Tunisia'), ('EG', 'Egypt'), ('ZA', 'South Africa'), ('SN', 'Senegal'),
  ('CI', 'Ivory Coast'), ('CM', 'Cameroon'), ('MG', 'Madagascar'), ('MU', 'Mauritius'),
  ('RE', 'Réunion'), ('GP', 'Guadeloupe'), ('MQ', 'Martinique'), ('GF', 'French Guiana'),
  ('PF', 'French Polynesia'), ('NC', 'New Caledonia'),
  ('JP', 'Japan'), ('KR', 'South Korea'), ('CN', 'China'), ('TW', 'Taiwan'),
  ('HK', 'Hong Kong'), ('SG', 'Singapore'), ('TH', 'Thailand'), ('VN', 'Vietnam'),
  ('ID', 'Indonesia'), ('MY', 'Malaysia'), ('PH', 'Philippines'), ('IN', 'India'),
  ('AU', 'Australia'), ('NZ', 'New Zealand'),
  ('BR', 'Brazil'), ('AR', 'Argentina'), ('CL', 'Chile'), ('CO', 'Colombia'),
  ('PE', 'Peru'), ('UY', 'Uruguay'), ('CR', 'Costa Rica'), ('PR', 'Puerto Rico'),
  ('DO', 'Dominican Republic'), ('CU', 'Cuba');

update public.tatoueurs t
   set pays = p.nom
  from pays_en p
 where upper(t.code_pays) = p.code
   and t.pays is distinct from p.nom;

update public.studios s
   set pays = p.nom
  from pays_en p
 where upper(s.code_pays) = p.code
   and s.pays is distinct from p.nom;

update public.modes_exercice m
   set pays = p.nom
  from pays_en p
 where upper(m.code_pays) = p.code
   and m.pays is distinct from p.nom;

-- Le compte-rendu : ce qui porte encore un pays hors de la table.
select 'tatoueurs' as table_name, code_pays, pays, count(*)
  from public.tatoueurs t
 where not exists (select 1 from pays_en p where p.code = upper(t.code_pays) and p.nom = t.pays)
 group by 1, 2, 3
union all
select 'studios', code_pays, pays, count(*)
  from public.studios s
 where not exists (select 1 from pays_en p where p.code = upper(s.code_pays) and p.nom = s.pays)
 group by 1, 2, 3
union all
select 'modes_exercice', code_pays, pays, count(*)
  from public.modes_exercice m
 where not exists (select 1 from pays_en p where p.code = upper(m.code_pays) and p.nom = m.pays)
 group by 1, 2, 3
 order by 1, 2, 3;

commit;
```

Les lignes que le compte-rendu rend encore sont celles SANS code (une
fiche d'avant la localisation mondiale) ou d'un code absent de la
table : ajouter le code, ou passer par le script (voie B), qui pose le
code manquant d'après le point.

## 4 · Les régions : l'exonyme français → le nom anglais

Cette table réunit **ce que le site sait déjà lire** (les variantes
françaises de `lib/adresse.ts`, États-Unis, Canada, Australie, Brésil,
Inde, Mexique) et les régions d'Europe qu'une base de tatoueurs
français porte le plus souvent. La cible est le nom **tel
qu'OpenStreetMap l'écrit en anglais** — c'est lui que le champ propose,
lui que la recherche compare. Une région française garde son nom quand
l'anglais l'écrit pareil (« Île-de-France », « Grand Est ») ; quatre
changent (« Bretagne » → « Brittany », « Corse » → « Corsica »,
« Normandie » → « Normandy », « Occitanie » → « Occitania »).

La comparaison ignore la casse et les accents (`public.yf_normaliser`,
la fonction de la recherche) : « ile de france » et « Île-de-France »
sont la même clé. Transaction, tout ou rien.

```sql
begin;

create temp table regions_en (code_pays text, francais text, anglais text);
insert into regions_en values
  -- États-Unis (les variantes que lib/adresse reconnaît)
  ('US', 'Californie', 'California'), ('US', 'District de Columbia', 'District of Columbia'),
  ('US', 'Washington DC', 'District of Columbia'), ('US', 'Floride', 'Florida'),
  ('US', 'Géorgie', 'Georgia'), ('US', 'Hawaï', 'Hawaii'), ('US', 'Louisiane', 'Louisiana'),
  ('US', 'Nouveau-Mexique', 'New Mexico'), ('US', 'État de New York', 'New York'),
  ('US', 'Caroline du Nord', 'North Carolina'), ('US', 'Dakota du Nord', 'North Dakota'),
  ('US', 'Orégon', 'Oregon'), ('US', 'Pennsylvanie', 'Pennsylvania'),
  ('US', 'Caroline du Sud', 'South Carolina'), ('US', 'Dakota du Sud', 'South Dakota'),
  ('US', 'Virginie', 'Virginia'), ('US', 'État de Washington', 'Washington'),
  ('US', 'Virginie-Occidentale', 'West Virginia'), ('US', 'Virginie occidentale', 'West Virginia'),
  -- Canada
  ('CA', 'Colombie-Britannique', 'British Columbia'), ('CA', 'Nouveau-Brunswick', 'New Brunswick'),
  ('CA', 'Terre-Neuve-et-Labrador', 'Newfoundland and Labrador'), ('CA', 'Nouvelle-Écosse', 'Nova Scotia'),
  ('CA', 'Territoires du Nord-Ouest', 'Northwest Territories'),
  ('CA', 'Île-du-Prince-Édouard', 'Prince Edward Island'), ('CA', 'Québec', 'Quebec'),
  -- Australie
  ('AU', 'Territoire de la capitale australienne', 'Australian Capital Territory'),
  ('AU', 'Nouvelle-Galles du Sud', 'New South Wales'), ('AU', 'Territoire du Nord', 'Northern Territory'),
  ('AU', 'Australie-Méridionale', 'South Australia'), ('AU', 'Tasmanie', 'Tasmania'),
  ('AU', 'Australie-Occidentale', 'Western Australia'),
  -- Brésil, Inde, Mexique (les exonymes seulement)
  ('BR', 'Amazonie', 'Amazonas'), ('BR', 'Pernambouc', 'Pernambuco'),
  ('IN', 'Îles Andaman-et-Nicobar', 'Andaman and Nicobar Islands'),
  ('IN', 'Jammu-et-Cachemire', 'Jammu and Kashmir'), ('IN', 'Pondichéry', 'Puducherry'),
  ('IN', 'Pendjab', 'Punjab'), ('IN', 'Bengale-Occidental', 'West Bengal'),
  ('MX', 'Basse-Californie', 'Baja California'), ('MX', 'Basse-Californie du Sud', 'Baja California Sur'),
  -- France
  ('FR', 'Bretagne', 'Brittany'), ('FR', 'Corse', 'Corsica'),
  ('FR', 'Normandie', 'Normandy'), ('FR', 'Occitanie', 'Occitania'),
  -- Royaume-Uni, Irlande
  ('GB', 'Angleterre', 'England'), ('GB', 'Écosse', 'Scotland'),
  ('GB', 'Pays de Galles', 'Wales'), ('GB', 'Irlande du Nord', 'Northern Ireland'),
  -- Belgique, Pays-Bas, Suisse, Luxembourg
  ('BE', 'Flandre', 'Flanders'), ('BE', 'Wallonie', 'Wallonia'),
  ('BE', 'Région de Bruxelles-Capitale', 'Brussels-Capital'),
  ('NL', 'Hollande-Septentrionale', 'North Holland'), ('NL', 'Hollande-Méridionale', 'South Holland'),
  ('NL', 'Brabant-Septentrional', 'North Brabant'), ('NL', 'Frise', 'Friesland'),
  ('NL', 'Gueldre', 'Gelderland'), ('NL', 'Zélande', 'Zeeland'), ('NL', 'Limbourg', 'Limburg'),
  ('NL', 'Groningue', 'Groningen'),
  ('CH', 'Genève', 'Geneva'), ('CH', 'Berne', 'Bern'), ('CH', 'Tessin', 'Ticino'),
  ('CH', 'Bâle-Ville', 'Basel-City'), ('CH', 'Bâle-Campagne', 'Basel-Landschaft'),
  ('CH', 'Grisons', 'Grisons'), ('CH', 'Argovie', 'Aargau'), ('CH', 'Thurgovie', 'Thurgau'),
  ('CH', 'Soleure', 'Solothurn'), ('CH', 'Fribourg', 'Fribourg'), ('CH', 'Zurich', 'Zurich'),
  -- Allemagne, Autriche
  ('DE', 'Bavière', 'Bavaria'), ('DE', 'Bade-Wurtemberg', 'Baden-Württemberg'),
  ('DE', 'Rhénanie-du-Nord-Westphalie', 'North Rhine-Westphalia'), ('DE', 'Basse-Saxe', 'Lower Saxony'),
  ('DE', 'Saxe', 'Saxony'), ('DE', 'Saxe-Anhalt', 'Saxony-Anhalt'), ('DE', 'Thuringe', 'Thuringia'),
  ('DE', 'Brandebourg', 'Brandenburg'), ('DE', 'Hambourg', 'Hamburg'), ('DE', 'Brême', 'Bremen'),
  ('DE', 'Rhénanie-Palatinat', 'Rhineland-Palatinate'), ('DE', 'Sarre', 'Saarland'),
  ('DE', 'Mecklembourg-Poméranie-Occidentale', 'Mecklenburg-Vorpommern'),
  ('AT', 'Vienne', 'Vienna'), ('AT', 'Styrie', 'Styria'), ('AT', 'Carinthie', 'Carinthia'),
  ('AT', 'Salzbourg', 'Salzburg'), ('AT', 'Haute-Autriche', 'Upper Austria'),
  ('AT', 'Basse-Autriche', 'Lower Austria'), ('AT', 'Tyrol', 'Tyrol'),
  -- Espagne, Portugal, Italie
  ('ES', 'Catalogne', 'Catalonia'), ('ES', 'Andalousie', 'Andalusia'),
  ('ES', 'Communauté valencienne', 'Valencian Community'), ('ES', 'Pays basque', 'Basque Country'),
  ('ES', 'Îles Baléares', 'Balearic Islands'), ('ES', 'Îles Canaries', 'Canary Islands'),
  ('ES', 'Galice', 'Galicia'), ('ES', 'Castille-et-León', 'Castile and León'),
  ('ES', 'Castille-La Manche', 'Castilla-La Mancha'), ('ES', 'Communauté de Madrid', 'Community of Madrid'),
  ('ES', 'Région de Murcie', 'Region of Murcia'), ('ES', 'Estrémadure', 'Extremadura'),
  ('ES', 'Cantabrie', 'Cantabria'), ('ES', 'Asturies', 'Asturias'), ('ES', 'Aragon', 'Aragon'),
  ('PT', 'Lisbonne', 'Lisbon'), ('PT', 'Açores', 'Azores'), ('PT', 'Madère', 'Madeira'),
  ('IT', 'Lombardie', 'Lombardy'), ('IT', 'Toscane', 'Tuscany'), ('IT', 'Piémont', 'Piedmont'),
  ('IT', 'Sicile', 'Sicily'), ('IT', 'Sardaigne', 'Sardinia'), ('IT', 'Latium', 'Lazio'),
  ('IT', 'Vénétie', 'Veneto'), ('IT', 'Ligurie', 'Liguria'), ('IT', 'Campanie', 'Campania'),
  ('IT', 'Pouilles', 'Apulia'), ('IT', 'Émilie-Romagne', 'Emilia-Romagna'), ('IT', 'Ombrie', 'Umbria'),
  ('IT', 'Marches', 'Marche'), ('IT', 'Calabre', 'Calabria'), ('IT', 'Abruzzes', 'Abruzzo'),
  ('IT', 'Basilicate', 'Basilicata'), ('IT', 'Vallée d''Aoste', 'Aosta Valley'),
  ('IT', 'Frioul-Vénétie Julienne', 'Friuli-Venezia Giulia');

update public.tatoueurs t
   set region = r.anglais
  from regions_en r
 where upper(t.code_pays) = r.code_pays
   and public.yf_normaliser(t.region) = public.yf_normaliser(r.francais)
   and t.region is distinct from r.anglais;

update public.studios s
   set region = r.anglais
  from regions_en r
 where upper(s.code_pays) = r.code_pays
   and public.yf_normaliser(s.region) = public.yf_normaliser(r.francais)
   and s.region is distinct from r.anglais;

update public.modes_exercice m
   set region = r.anglais
  from regions_en r
 where upper(m.code_pays) = r.code_pays
   and public.yf_normaliser(m.region) = public.yf_normaliser(r.francais)
   and m.region is distinct from r.anglais;

update public.conventions c
   set region = r.anglais
  from regions_en r
 where upper(c.code_pays) = r.code_pays
   and public.yf_normaliser(c.region) = public.yf_normaliser(r.francais)
   and c.region is distinct from r.anglais;

-- Le compte-rendu : les régions qui portent ENCORE un exonyme de la table
-- (attendu : aucune ligne).
select 'tatoueurs' as table_name, t.code_pays, t.region, count(*)
  from public.tatoueurs t
  join regions_en r on r.code_pays = upper(t.code_pays)
                   and public.yf_normaliser(t.region) = public.yf_normaliser(r.francais)
 group by 1, 2, 3
union all
select 'studios', s.code_pays, s.region, count(*)
  from public.studios s
  join regions_en r on r.code_pays = upper(s.code_pays)
                   and public.yf_normaliser(s.region) = public.yf_normaliser(r.francais)
 group by 1, 2, 3
union all
select 'modes_exercice', m.code_pays, m.region, count(*)
  from public.modes_exercice m
  join regions_en r on r.code_pays = upper(m.code_pays)
                   and public.yf_normaliser(m.region) = public.yf_normaliser(r.francais)
 group by 1, 2, 3;

commit;
```

⚠️ Une région dont le français EST l'anglais (« Texas », « Île-de-France »,
« Auvergne-Rhône-Alpes ») ne figure pas dans la table, et n'a pas à y
figurer : elle est déjà juste.

## 5 · Ce que le SQL laisse (lecture seule) — et que le script relit

Après les blocs 3 et 4, cette lecture rend les régions qui ne sont ni
dans la table du bloc 4 ni manifestement anglaises — à regarder à
l'œil, ou à confier au script (voie B), qui les relit au point :

```sql
select t.table_name, t.code_pays, t.region, count(*) as lignes
  from (
    select 'tatoueurs'      as table_name, code_pays, region from public.tatoueurs
    union all
    select 'studios',                      code_pays, region from public.studios
    union all
    select 'modes_exercice',               code_pays, region from public.modes_exercice
  ) t
 where t.region is not null
   and t.region ~ '[àâäéèêëîïôöùûüç]'       -- un accent français : un candidat
 group by 1, 2, 3
 order by 1, 2, 3;
```

Un accent n'est pas une preuve (« Île-de-France » en porte un, et c'est
son nom) : c'est un tri pour l'œil, pas une règle.

---

## Ce qui change pour les visiteurs

- Une fiche d'avant la nº 805 répond de nouveau à une recherche par
  État ou par région tapée en anglais (« California », « Bavaria »).
- Les cartes, fiches et suggestions écrivent le même pays qu'avant
  (« USA », « Germany ») — l'affichage traduisait déjà ; c'est la base
  qui rejoint l'écran.
- Aucune adresse publique ne change : ni `slug`, ni `ville_slug`.
- Le tatoueur n'est pas prévenu : son lieu n'a pas bougé, son nom non
  plus ; seule la langue de deux colonnes techniques a changé.
