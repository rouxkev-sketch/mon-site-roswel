# Tester le site en mode PRODUCTION, depuis l'iPhone

_(passe nº 189-§3 — à suivre dans l'ordre, une commande à la fois)_

## Pourquoi

En mode développement (`npm run dev`), Next garde **une connexion réseau
ouverte en permanence** avec le navigateur : c'est elle qui recharge la page
toute seule quand un fichier change. Or un navigateur refuse de mettre en
réserve une page qui tient une connexion ouverte — et sans cette réserve, le
geste de retour depuis le bord de l'écran n'a **aucune image à montrer** : écran
noir, puis la page se reconstruit entièrement.

Le mode production n'a pas cette connexion. Ce test dit donc, en quelques
minutes, si le défaut vient de là ou non.

---

## Avant de commencer : vérifier `.env.local`

Ouvrir le fichier `.env.local` (à la racine du projet) et vérifier **une seule
ligne** :

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- Si elle vaut `http://localhost:3000`, **la laisser telle quelle** : cela
  suffit pour ce test.
- Si elle vaut l'adresse du site en ligne (`https://…`), la remplacer par
  `http://localhost:3000` **le temps du test**, puis la remettre après.

Les trois lignes `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SECRET_KEY` ne changent
pas : ce sont celles de la vraie base, et c'est bien elle que l'on veut voir.

---

## Les commandes, une par une

Ouvrir l'application **Terminal** sur le Mac.

### 1. Se placer dans le dossier du projet

```
cd ~/Desktop/mon-site-roswel
```

_(Si le dossier est ailleurs, remplacer le chemin. Astuce : taper `cd `, un
espace, puis faire glisser le dossier depuis le Finder dans la fenêtre du
Terminal — le chemin s'écrit tout seul.)_

### 2. Fabriquer la version compilée

```
npm run build
```

Cela prend une à trois minutes. La commande doit se terminer sans message
`Error`. Elle affiche une liste de pages : c'est normal.

⚠️ À refaire **à chaque fois** qu'un nouveau zip est installé : le mode
production ne lit pas les fichiers source, il lit ce qui vient d'être compilé.

### 3. Lancer le site en mode production

```
npm start
```

Le Terminal affiche quelque chose comme
`▲ Next.js 16.2.10 - Local: http://localhost:3000`, puis **reste occupé** :
c'est normal, le site tourne. Ne pas fermer cette fenêtre.

### 4. Trouver l'adresse du Mac sur le réseau

Ouvrir une **seconde** fenêtre de Terminal (menu Terminal → Shell → Nouvelle
fenêtre), puis taper :

```
ipconfig getifaddr en0
```

Elle répond une adresse du genre `192.168.1.12`.
_(Si elle ne répond rien, essayer `ipconfig getifaddr en1` : le Mac est alors
branché en Ethernet plutôt qu'en Wi-Fi.)_

### 5. Ouvrir le site sur l'iPhone

- l'iPhone doit être sur **le même Wi-Fi** que le Mac ;
- dans Safari, taper l'adresse trouvée à l'étape 4, suivie de `:3000` :

```
http://192.168.1.12:3000
```

_(en remplaçant `192.168.1.12` par l'adresse affichée chez toi)_

---

## Ce qu'il faut vérifier

1. faire une recherche (par exemple « aquarelle ») ;
2. ouvrir une fiche ;
3. **revenir en arrière en glissant le doigt depuis le bord gauche de
   l'écran**, lentement.

Deux réponses possibles, et une seule chose à me dire :

- **la page précédente apparaît sous le doigt pendant le glissement** — la
  réserve fonctionne en production, la cause était bien la connexion du mode
  développement ;
- **l'écran est noir, puis la page se reconstruit** — la cause est ailleurs, et
  je la cherche autrement.

Regarder aussi, au passage : les cartes de la recherche sont-elles les bonnes au
retour (les 3 d'« aquarelle », pas les 20 de l'accueil), et la page revient-elle
à l'endroit quitté ?

---

## Pour arrêter

Dans la fenêtre de Terminal où le site tourne : appuyer sur **Ctrl + C**.
Pour revenir au mode de travail habituel : `npm run dev`.

---

## Si quelque chose bloque

- **`command not found: npm`** → Node.js n'est pas installé sur ce Mac.
- **`EADDRINUSE` / port 3000 occupé** → un `npm run dev` tourne encore dans une
  autre fenêtre : l'arrêter avec Ctrl + C, puis reprendre à l'étape 3.
- **L'iPhone n'affiche rien** → le pare-feu du Mac bloque la connexion :
  Réglages Système → Réseau → Pare-feu ; ou vérifier que les deux appareils sont
  sur le même Wi-Fi (pas un réseau « invité »).
- **La page s'affiche mais sans les fiches** → `.env.local` n'a pas été relu :
  arrêter (Ctrl + C), refaire l'étape 2 puis l'étape 3.
