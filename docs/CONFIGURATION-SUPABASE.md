# Configurer Supabase — guide pas à pas (étape 2)

Supabase est le service qui héberge la **base de données** de Roswel
(artisans, communes, conversations…) et gère les **comptes** (connexion
Google, Facebook, Apple, email). Données hébergées en Europe.

Il y a 2 choses à faire maintenant (≈ 5 minutes), et 1 partie
optionnelle à faire plus tard.

---

## 1. Créer les tables (obligatoire, 2 minutes)

Les « tables » sont les tiroirs de la base : un pour les artisans,
un pour les communes, un pour les messages, etc.

1. Ouvrir [supabase.com/dashboard](https://supabase.com/dashboard) et
   choisir le projet Roswel.
2. Dans le menu de gauche, cliquer sur **SQL Editor**.
3. Cliquer sur **New query** (nouvelle requête).
4. Ouvrir le fichier `supabase/schema.sql` du projet, **tout copier**,
   et coller dans la grande zone de texte.
5. Cliquer sur **Run** (en bas à droite).
6. Le message **« Success. No rows returned »** confirme que tout est créé.

> Pas d'inquiétude : ce script peut être exécuté plusieurs fois sans
> danger, il ne supprime jamais rien.

### Vérifier que tout marche

Sur ton ordinateur, dans le dossier du projet :

```bash
npm install   # met à jour les outils (Supabase vient d'être ajouté)
npm run dev
```

Puis ouvrir **http://localhost:3000/api/verif-supabase** dans le
navigateur : chaque table doit afficher ✅. Si une ligne affiche ❌,
le message dit quoi faire.

---

## 2. Déclarer les adresses de retour (obligatoire, 1 minute)

Après une connexion (Google, email…), Supabase doit savoir vers quelle
adresse renvoyer le visiteur.

1. Dans Supabase : **Authentication** → **URL Configuration**.
2. **Site URL** : `http://localhost:3000`
3. **Redirect URLs** → **Add URL** : `http://localhost:3000/auth/callback**`

> Quand le site sera en ligne (sur Vercel), on ajoutera ici les mêmes
> adresses avec le vrai nom de domaine.

### ⚠️ LES DEUX ÉTOILES À LA FIN NE SONT PAS UNE COQUILLE (passe nº 827)

Le site ne demande jamais `…/auth/callback` tout court : il demande
`…/auth/callback?next=<où revenir>`. **Une entrée sans joker ne couvre
pas une adresse à paramètres.** Quand l'adresse demandée n'est pas dans
la liste, Supabase ne le signale pas : il **retombe en silence sur la
Site URL** — c'est-à-dire l'accueil.

C'est très exactement le défaut qui a coûté la passe nº 827 : le lien
« Choose a new password » menait à l'accueil. Les trois **liens
d'e-mail** ne dépendent plus de cette liste depuis (ils passent par
notre propre route, voir `src/app/auth/callback/route.ts` §2), **mais la
connexion Google, elle, en dépend toujours**. Il faut donc l'entrée avec
les deux étoiles.

---

## 3. Les moyens de connexion

### Email + mot de passe : déjà actif ✅

Rien à faire : Supabase l'active par défaut (**Authentication** →
**Sign In / Providers** pour le voir). C'est suffisant pour développer
et tester toutes les prochaines étapes.

### Google, Facebook, Apple : à activer plus tard (optionnel)

Chaque bouton « Se connecter avec… » demande de créer un compte
développeur chez le fournisseur et d'y déclarer Roswel. **Ça peut
attendre** : le site fonctionnera d'abord avec l'email, et on activera
ces boutons quand tu voudras (idéalement avant le lancement public).

Pour chacun, le principe est le même :

1. Créer une « application » chez le fournisseur (liens ci-dessous).
2. Y déclarer l'adresse de retour de TON projet Supabase :
   ```
   https://lxdhwekalbbodiijnbme.supabase.co/auth/v1/callback
   ```
3. Récupérer les 2 codes fournis (Client ID + Secret).
4. Les coller dans Supabase : **Authentication** → **Sign In / Providers**
   → choisir le fournisseur → **Enable** → coller les codes → **Save**.

| Fournisseur | Où créer l'application | À savoir |
|---|---|---|
| Google | [console.cloud.google.com](https://console.cloud.google.com) → « APIs & Services » → « Credentials » → « OAuth client ID » (type : Web application) | Gratuit. Le plus utilisé, à faire en premier. |
| Facebook | [developers.facebook.com](https://developers.facebook.com) → « My Apps » → « Create App » → produit « Facebook Login » | Gratuit. |
| Apple | [developer.apple.com](https://developer.apple.com) → compte « Apple Developer Program » | Payant (99 $/an) et plus technique — à garder pour la fin. |

---

## Où sont les clés du projet ?

Dans Supabase : **Project Settings** (roue dentée) → **API Keys**.

- **Clé « publishable »** (`sb_publishable_…`) : déjà installée dans le
  fichier `.env.local` du projet. Elle est faite pour être vue par le
  navigateur — pas un secret.
- **Clé « secret »** (`sb_secret_…`) : servira à l'étape 3 (import des
  communes) et à l'interface admin. À coller dans `.env.local` à la
  ligne `SUPABASE_SECRET_KEY=` le moment venu.
  ⚠️ **Jamais sur GitHub, jamais dans le code.**
