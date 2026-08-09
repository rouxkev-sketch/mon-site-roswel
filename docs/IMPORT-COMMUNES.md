# Importer les communes de France — guide (étape 3)

Roswel a besoin de connaître toutes les communes (nom, codes postaux,
coordonnées GPS) pour faire le lien entre une recherche
(« plombier villeurbanne ») et les artisans dont la zone couvre cette
ville. Ces données viennent de l'annuaire officiel de l'État,
[geo.api.gouv.fr](https://geo.api.gouv.fr) — gratuites et publiques.

## Lancer l'import (une seule fois, ≈ 2 minutes)

1. **Renseigner la clé secrète** (elle donne le droit d'écrire dans la
   table des communes) :
   - Dans Supabase : **Project Settings** (roue dentée) → **API Keys**
     → copier la clé **secret** (`sb_secret_…`).
   - Ouvrir le fichier `.env.local` du projet et compléter la ligne :
     ```
     SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxx
     ```
   - ⚠️ Cette clé ne va JAMAIS sur GitHub (le fichier `.env.local`
     n'y est pas envoyé, c'est prévu pour).

2. **Démarrer le site** (ou le redémarrer si `npm run dev` tournait
   déjà, pour qu'il lise la nouvelle clé) :
   ```bash
   npm run dev
   ```

3. Ouvrir **http://localhost:3000/admin/import-communes** dans le
   navigateur et cliquer sur **« Lancer l'import »**. Laisser la page
   ouverte 1 à 2 minutes.

4. Le résultat s'affiche : environ **35 000 communes enregistrées**. ✅

> Cette page-outil n'existe qu'en développement sur ton ordinateur :
> elle n'apparaîtra pas sur le site en ligne.

## Choisir la zone importée (optionnel)

Par défaut, TOUTE la France est importée (recommandé : l'inscription
des artisans est ouverte partout). Pour limiter à une ou plusieurs
régions, ouvrir `src/config/roswel.ts` et modifier :

```ts
regionsImportCommunes: [] as string[],   // vide = toute la France
// exemple : ["84"] = Auvergne-Rhône-Alpes uniquement
```

| Code | Région |
|---|---|
| 84 | Auvergne-Rhône-Alpes |
| 27 | Bourgogne-Franche-Comté |
| 53 | Bretagne |
| 24 | Centre-Val de Loire |
| 94 | Corse |
| 44 | Grand Est |
| 32 | Hauts-de-France |
| 11 | Île-de-France |
| 28 | Normandie |
| 75 | Nouvelle-Aquitaine |
| 76 | Occitanie |
| 52 | Pays de la Loire |
| 93 | Provence-Alpes-Côte d'Azur |
| 01 | Guadeloupe |
| 02 | Martinique |
| 03 | Guyane |
| 04 | La Réunion |
| 06 | Mayotte |

Relancer ensuite l'import : les communes déjà présentes sont mises à
jour, les nouvelles ajoutées, rien n'est dupliqué.

## En cas de problème

- **« La clé secrète Supabase n'est pas renseignée »** → étape 1
  ci-dessus, puis redémarrer `npm run dev`.
- **« L'annuaire geo.api.gouv.fr a répondu 404 »** → un code région
  invalide dans `src/config/roswel.ts` (voir tableau).
- **« Supabase a refusé l'enregistrement »** → vérifier que le script
  `supabase/schema.sql` a bien été exécuté (étape 2) et que la clé
  copiée est bien la **secret** (pas la publishable).
