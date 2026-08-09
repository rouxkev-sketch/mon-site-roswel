# Roswel

Le moteur de recherche d'artisans de confiance, basé sur la preuve sociale
(avis Google + influence Instagram). Site mobile-first, installable comme une
application (PWA).

## Démarrer le site sur son ordinateur

```bash
npm ci         # une seule fois par dossier livré, pour installer les outils
npm run dev    # lance le site en local
```

Puis ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

> **`npm ci` plutôt que `npm install`.** Les deux installent les mêmes
> outils, mais `npm install` a le droit de RENONCER SANS RIEN DIRE à
> certains paquets (ceux marqués « optionnels » — dont le moteur de
> compilation de Next, qui pèse 130 Mo). `npm ci` repart de la liste
> exacte et **échoue bruyamment** si quelque chose ne passe pas.
> C'est toute la différence entre une panne visible et une panne muette.

### Si le site ne démarre pas

Le symptôme classique : `✓ Ready` s'affiche… et le site ne répond pas.
**C'est trompeur : Next écrit `✓ Ready` AVANT de charger son moteur.**
Ce message ne veut donc pas dire que le site est parti — seulement que
le démarrage a commencé.

`npm run dev` contrôle désormais l'installation avant de lancer quoi que
ce soit, et refuse de partir en expliquant ce qui manque. Le contrôle
peut aussi se faire seul :

```bash
npm run verifier-installation
```

Dans presque tous les cas, la réparation est la même :

```bash
rm -rf node_modules && npm ci     # Windows : rmdir /s /q node_modules
```

> Remarque : `package-lock.json` est livré avec le site — il ne faut ni le
> supprimer ni le régénérer. En revanche, **s'il en traîne un dans le
> dossier utilisateur** (au-dessus du dossier du site), il faut le
> supprimer : npm croirait alors que le projet est là-haut et
> installerait les outils au mauvais endroit. `npm run dev` le signale.

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
    page.tsx          ← page d'accueil (recherche métier + ville)
    [metier]/[ville]/ ← pages de résultats (ex. /plombier/villeurbanne)
    artisan/[slug]/   ← fiches artisans (ex. /artisan/julien-moreau)
    manifest.ts       ← carte d'identité de l'application (PWA)
    globals.css       ← styles de base (les couleurs viennent de la config)
    auth/callback/    ← retour après connexion (Google, email…)
    api/verif-supabase/ ← page de contrôle de la base de données
  components/         ← briques réutilisables (logo, etc.)
  lib/                ← petites fonctions techniques
    supabase/         ← connexion à la base de données
  proxy.ts            ← garde la session de connexion à jour
supabase/
  schema.sql          ← script de création des tables (à exécuter chez Supabase)
docs/
  CONFIGURATION-SUPABASE.md ← guide pas à pas Supabase
  IMPORT-COMMUNES.md  ← guide d'import des communes de France
  A-REPRENDRE-refonte-du-formulaire.md ← points VOLONTAIREMENT reportés,
                        à relire au début de la refonte du formulaire
tests/
  LISEZ-MOI-les-suites.md ← ce que chaque suite vérifie, et laquelle rejouer
  archives/           ← suites rangées, jamais supprimées (voir son LISEZ-MOI)
public/
  icons/              ← icônes de l'application (provisoires, en SVG)
  sw.js               ← service worker (rapidité + mode hors ligne)
  offline.html        ← page affichée sans connexion
```

## Base de données (Supabase)

La connexion est réglée dans le fichier `.env.local` (non publié sur
GitHub ; modèle fourni : `.env.local.example`). Pour créer les tables
et activer les connexions Google/Facebook/Apple/email, suivre le guide
`docs/CONFIGURATION-SUPABASE.md`. Vérification rapide une fois fait :
ouvrir `http://localhost:3000/api/verif-supabase`.

## Les logos définitifs (fichiers intouchables)

Les deux fichiers officiels vivent dans `public/images/` :

- `roswel-logo.png` — le logo complet (icône + nom), affiché par le
  menu, les pages légales et les pages admin ;
- `roswel-icone.png` — l'icône seule, utilisée comme favicon, icône
  PWA (écran d'accueil du téléphone) et sur la page « hors ligne ».

Tout le site passe par `src/components/Logo.tsx`, qui pointe vers ces
deux chemins. RÈGLE PERMANENTE (détaillée dans `AGENTS.md`) : ces
fichiers ne doivent jamais être régénérés, remplacés ou modifiés par
un outil — même statut que `.env.local`. Les zips de livraison ne les
contiennent pas : les fichiers déposés localement font foi, et il faut
les inclure lors de l'envoi du projet sur GitHub.

## Technique (pour mémoire)

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- Supabase (base de données + comptes) — branché à l'étape 2
- Hébergement prévu : Vercel
