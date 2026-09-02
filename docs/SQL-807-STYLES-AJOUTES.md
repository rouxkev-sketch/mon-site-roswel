# Les styles nés d'une suggestion — relire, renommer, fusionner (passe nº 807)

**Tout ce qui suit se colle À LA MAIN dans l'éditeur SQL de Supabase,
par Kevin. Rien n'est exécuté par une passe.** Chaque bloc est
autonome ; les deux premiers ne modifient rien.

La table : `public.suggestions_style`. Une ligne dont `etat = 'acceptee'`
EST un style du site (le code la lit pour agrandir le catalogue de
`src/config/tatouage.ts`). Ce qui compte pour l'affichage : `label` (le
nom montré) et `slug` (la limace : elle est écrite dans
`tatoueurs.styles`, dans les clés de `tatoueurs.photos_styles`, sur
chaque `photos_tatoueur.style`, et elle fait l'adresse publique
`/tatouage/<limace>/<ville>`).

**Quand le site suit-il ?** (corrigé à la nº 808, après le relevé de
Kevin.) Un geste sur l'écran d'administration des suggestions
(accepter, refuser, retirer, renommer) est visible **tout de suite** :
la route invalide toutes les pages du site. Une écriture SQL directe,
elle, ne prévient personne : la liste des styles est cuite dans les
pages mises en cache, revalidées toutes les **cinq minutes** (et la
première visite après l'échéance reçoit encore l'ancienne page pendant
que la neuve se prépare — compter deux chargements). Pour forcer sans
attendre : ouvrir l'admin → Suggestions → **Rename** sur n'importe quel
style accepté et enregistrer, même sans changer le nom.

---

## 1 · La liste : ce qu'il y a, et qui s'en sert (lecture seule)

```sql
select s.label,
       s.slug,
       s.famille,
       s.traite_le::date as accepte_le,
       (select count(*) from public.tatoueurs t
         where t.styles @> array[s.slug])            as portfolios,
       (select count(*) from public.photos_tatoueur p
         where p.style = s.slug)                     as photos
  from public.suggestions_style s
 where s.etat = 'acceptee'
 order by s.label;
```

Les colonnes `portfolios` et `photos` disent si une limace est portée :
c'est ce que l'écran d'administration compte aussi avant de décider si
elle peut suivre un nouveau nom.

---

## 2 · Renommer un libellé (la limace ne bouge pas)

Depuis la nº 807, l'écran d'administration le fait (bouton **Rename**
sur la ligne du style). Le SQL équivalent, pour un style à la fois :

```sql
update public.suggestions_style
   set label = 'Neo-realism'          -- le nouveau nom, 2 à 40 caractères
 where etat = 'acceptee'
   and slug  = 'neo-realisme';        -- la limace actuelle, relue au § 1
```

Ne change PAS `slug` par cette voie : une limace portée par des
portfolios ou des photos ne se renomme pas, elle se FUSIONNE (§ 3b).
Quand rien ne la porte, l'écran d'administration la recalcule lui-même
à partir du nouveau nom, avec le contrôle de collision du catalogue.

---

## 3a · Repérer un doublon avec le catalogue du code

Jusqu'à la nº 806, le garde-fou de l'acceptation ne comparait que les
LIMACES : « Néo-traditionnel » → `neo-traditionnel` était refusé (le
code l'a déjà), mais « Neo-traditional », avec ou sans accents, donnait
`neo-traditional` — une autre limace, un doublon de sens. Depuis la
nº 807, l'acceptation et le renommage comparent AUSSI le nom proposé
aux libellés du catalogue (« Neo-traditional » heurte désormais le
style `neo-traditionnel`) ; ce qui est entré AVANT reste à repérer à
la main. Cette lecture rapproche les styles acceptés des quarante du
code par leurs huit premières lettres :

```sql
with code(slug) as (values
  ('realisme'),('fine-line'),('minimaliste'),('blackwork'),('dotwork'),
  ('geometrique'),('ornemental'),('old-school'),('neo-traditionnel'),
  ('new-school'),('japonais'),('chicano'),('tribal'),('aquarelle'),
  ('illustratif'),('anime-manga'),('abstrait'),('trash-polka'),
  ('biomecanique'),('organique'),('ignorant-style'),('cyber-tribal'),
  ('cyberpunk'),('lettering'),('acid-trad'),('bio-mecha'),('chrome'),
  ('cyber-sigilism'),('gravure'),('one-line'),('suminagashi'),('berbere'),
  ('celtique'),('copte'),('maori'),('nordique'),('pa-tutiki'),
  ('polynesien'),('sicanje'),('yoruba'))
select s.label, s.slug as limace_acceptee, c.slug as limace_du_code
  from public.suggestions_style s
  join code c on c.slug = s.slug
              or left(c.slug, 8) = left(s.slug, 8)
 where s.etat = 'acceptee'
 order by s.label;
```

Une ligne rendue = un doublon PROBABLE, à juger à l'œil (« one-line »
et « one-line-x » se ressemblent, « chrome » et « chromeo » aussi).

---

## 3b · Fusionner un doublon dans le style du code

Exemple : le style accepté `neo-traditional` (doublon) rejoint
`neo-traditionnel` (le code). Remplace les deux limaces en tête, puis
colle le bloc ENTIER — il est enfermé dans une transaction : tout passe,
ou rien.

```sql
begin;

-- Les deux limaces, UNE fois chacune.
create temp table fusion as
  select 'neo-traditional'::text as ancienne, 'neo-traditionnel'::text as nouvelle;

-- 1. Les portfolios : la limace remplacée dans le tableau des styles,
--    sans doublon et sans changer l'ordre (le premier style reste le
--    premier).
update public.tatoueurs t
   set styles = (
     select array_agg(u.x order by u.premier)
       from (select x, min(ord) as premier
               from unnest(array_replace(t.styles, f.ancienne, f.nouvelle))
                    with ordinality as r(x, ord)
              group by x) u
   )
  from fusion f
 where t.styles @> array[f.ancienne];

-- 2. Les photos.
update public.photos_tatoueur p
   set style = f.nouvelle
  from fusion f
 where p.style = f.ancienne;

-- 3. La photo « vitrine » du style sur le portfolio (photos_styles,
--    clé = limace) : elle passe sous la nouvelle clé, sauf si le
--    portfolio en avait déjà une pour le style du code — celle-là
--    est gardée.
update public.tatoueurs t
   set photos_styles =
       (t.photos_styles - f.ancienne)
       || case when t.photos_styles ? f.nouvelle then '{}'::jsonb
               else jsonb_build_object(f.nouvelle, t.photos_styles -> f.ancienne)
          end
  from fusion f
 where t.photos_styles ? f.ancienne;

-- 4. Le doublon quitte la liste (même geste que « Remove the style » :
--    l'index unique ne vaut que sur les acceptées, la limace se libère).
update public.suggestions_style s
   set etat = 'refusee', traite_le = now()
  from fusion f
 where s.etat = 'acceptee' and s.slug = f.ancienne;

-- Le compte-rendu : ce qui porte encore l'ancienne limace doit être à 0.
select (select count(*) from public.tatoueurs t, fusion f where t.styles @> array[f.ancienne]) as portfolios_restants,
       (select count(*) from public.photos_tatoueur p, fusion f where p.style = f.ancienne)  as photos_restantes,
       (select count(*) from public.tatoueurs t, fusion f where t.photos_styles ? f.ancienne) as vitrines_restantes;

commit;
```

Ce qui change pour les visiteurs : les portfolios et les photos du
doublon apparaissent désormais sous le style du code ; l'adresse
`/tatouage/neo-traditional/<ville>` ne répond plus (aucune
redirection — c'est une adresse née d'une erreur, pas une adresse
partagée). Le tatoueur qui avait proposé le doublon n'est pas prévenu :
son style n'a pas disparu, il a rejoint le bon nom.
