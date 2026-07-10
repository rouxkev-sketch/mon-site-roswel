# Roswel

Le moteur de recherche d'artisans de confiance, basé sur la preuve sociale
(avis Google + influence Instagram). Site mobile-first, installable comme une
application (PWA).

## Démarrer le site sur son ordinateur

```bash
npm install    # une seule fois, pour installer les outils
npm run dev    # lance le site en local
```

Puis ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

> Remarque : `npm install` crée un fichier `package-lock.json`.
> C'est normal (c'est la liste détaillée des outils installés) ;
> il peut être ajouté sur GitHub sans problème.

## LE fichier à connaître : les réglages centraux

**Tous les réglages du site sont dans un seul fichier :**

```
src/config/roswel.ts
```

On y modifie, sans toucher au reste du code :

- les **couleurs** (rose de la marque, pastilles, fonds, textes…) ;
- la **grille de score Instagram** (50 points) ;
- la **grille de score des avis Google** (50 points) ;
- les **seuils des pastilles** « Recommandé » (40) et « Top artisan » (75) ;
- l'**alerte de fraîcheur** des données Instagram (30 jours) ;
- les **paliers de rapidité de réponse** (15 min / 1 h / 3 h / 24 h) ;
- les **métiers** proposés au lancement ;
- les **rayons d'intervention** (10 / 25 / 50 / 100 km) ;
- le **bandeau de zone** (« Actuellement disponible sur Lyon… ») ;
- les **régions importées** dans la base des communes ;
- les **limites des formulaires** (bio, message 2 500 caractères, 1 à 5 photos).

## Où sont les choses

```
src/
  config/roswel.ts    ← LE fichier de réglages central
  app/                ← les pages du site
    layout.tsx        ← structure commune à toutes les pages
    page.tsx          ← page d'accueil
    manifest.ts       ← carte d'identité de l'application (PWA)
    globals.css       ← styles de base (les couleurs viennent de la config)
  components/         ← briques réutilisables (logo, etc.)
  lib/                ← petites fonctions techniques
public/
  icons/              ← icônes de l'application (provisoires, en SVG)
  sw.js               ← service worker (rapidité + mode hors ligne)
  offline.html        ← page affichée sans connexion
```

## Remplacer le logo provisoire

Le logo actuel est un dessin provisoire (SVG) qui imite la maquette.
Quand le fichier définitif est prêt :

1. déposer l'image dans `public/` (ex. `public/logo.png`) ;
2. adapter `src/components/Logo.tsx` pour afficher cette image ;
3. créer les icônes PNG à partir du logo définitif et les déposer dans
   `public/icons/` : `icon-192.png`, `icon-512.png`,
   `icon-maskable-512.png` (plein cadre) et `apple-touch-icon.png`
   (180 × 180, pour l'écran d'accueil des iPhone) ;
4. mettre à jour la liste des icônes dans `src/app/manifest.ts`
   (un commentaire sur place indique exactement quoi faire).

## Technique (pour mémoire)

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- Supabase (base de données + comptes) — branché à l'étape 2
- Hébergement prévu : Vercel
