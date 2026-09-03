# Les variables de production — ce qu'il faut faire (passe nº 831)

Ce document accompagne la passe nº 831. Il ne demande **aucune commande
compliquée** : trois gestes dans Vercel, puis une mise en ligne.

---

## 1. Ce qui se passait

Le diagnostic de la nº 830, lancé sur le site en ligne, a répondu :

    "cle": { "presente": false, "longueur": 0 }
    "expediteur": "RESEND_EXPEDITEUR"

Deux choses s'y lisent, et elles ne disent pas la même :

- **la clé d'envoi est vide** au moment où le site tourne — alors
  qu'elle est posée chez Vercel ;
- **l'expéditeur vaut le NOM de la variable** (`RESEND_EXPEDITEUR`) au
  lieu de son contenu. Une valeur ne répète jamais son propre nom toute
  seule : le nom a été collé dans le champ « Value ».

Et il y a une raison pour laquelle personne ne pouvait s'en apercevoir :
`sh d` déploie **depuis le dossier**, pas depuis un dépôt. Tout ce que
le dossier contient monte chez Vercel — `.env.local` compris, celui que
`livre` venait de remplir avec ta clé secrète. Next lit d'abord ce que
l'hébergeur fournit, puis ce fichier. Résultat : une variable oubliée
dans Vercel **marchait quand même**, prise dans le fichier… jusqu'au
jour où sa ligne y est vide. C'est très exactement l'histoire de
`RESEND_API_KEY`.

## 2. Ce qui change dans la livraison

- **`.vercelignore`** : les fichiers `.env*` ne montent plus. Ta clé
  secrète ne quitte plus ton Mac, et **le tableau de bord Vercel devient
  la seule source en ligne**. (Rien ne change sur ta machine : `npm run
  dev` continue de lire `.env.local`.)
- **`sh d` vérifie avant de déployer** que la production porte bien les
  huit variables que le code lit. S'il en manque une, il te dit
  laquelle et **ne déploie pas** — mieux vaut ne rien mettre en ligne
  qu'un site amputé en silence. Il ne lit ni n'affiche jamais une
  valeur : seulement des noms.

## 3. Les trois gestes, dans Vercel

Va dans **Settings → Environment Variables**, cible **Production**.

1. **Corrige `RESEND_EXPEDITEUR`.** Sa valeur doit être l'expéditeur,
   par exemple :

       YokoFolio <noreply@ton-domaine.com>

   Le domaine doit être **vérifié** sur `resend.com/domains`. Tant
   qu'il ne l'est pas, Resend n'accepte d'écrire qu'à ta propre adresse
   et refuse tout le reste — c'est ce que la nº 830 a rendu visible.

2. **Vérifie que ces huit variables existent bien en Production** (le
   nom dans « Key », la valeur dans « Value ») :

       NEXT_PUBLIC_SUPABASE_URL
       NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
       SUPABASE_SECRET_KEY
       NEXT_PUBLIC_SITE_URL
       RESEND_API_KEY
       RESEND_EXPEDITEUR
       CONTACT_EMAIL
       CRON_SECRET

3. **Vérifie que `RESEND_API_URL` n'y est PAS.** Elle ne sert qu'aux
   bancs d'essai : elle détourne les envois. Le code l'ignore en ligne
   depuis la nº 830, mais elle n'a rien à faire là.

Puis mets en ligne comme d'habitude :

    sh livre 831.zip

Si `d` refuse en nommant une variable, ajoute-la dans Vercel et relance
la même commande.

## 4. Vérifier que c'est réglé

Connecté en administrateur, ouvre :

    /api/admin/yokofolio/diagnostic-courriel

Ce qu'il faut y lire :

- `chaine.fichiersEnv` : **tous `present: false`**. Si un `.env.local`
  y apparaît encore, c'est qu'il est monté avec le dossier.
- `chaine.variables` : chaque ligne en `source: "hébergeur"`, aucune
  `alerte`, `manquantes: []`.
- `cle.presente: true`, et `expediteurDEssai: false`.

Pour la preuve par l'envoi, toujours en administrateur :

    POST /api/admin/yokofolio/diagnostic-courriel
    { "destinataire": "ton-adresse@exemple.com" }

La réponse recopie ce que Resend a répondu, mot pour mot.
