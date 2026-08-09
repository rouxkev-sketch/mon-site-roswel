# L'espace particulier — guide (étape 10)

Rien à exécuter côté Supabase : tout était prêt depuis l'étape 2.

## Les 3 onglets (§14)

En bas de l'écran, sur /messages, /favoris et /compte :

- **💬 Messages** : les conversations (construites à l'étape 9),
  avec la pastille rose « non lu » quand un artisan répond.
- **❤️ Favoris** : le cœur des fiches artisan fonctionne maintenant
  pour de vrai — connecté, il enregistre/retire l'artisan ; les
  favoris s'affichent ici avec les mêmes cartes que la recherche.
- **👤 Mon compte** : les réglages, adaptés au mode de connexion.

## À tester (5 minutes)

1. **Favoris** : connecté en particulier, ouvre une fiche → touche le
   cœur (il se remplit) → onglet Favoris : l'artisan y est → re-touche
   le cœur → il disparaît. Déconnecté : le cœur propose de se
   connecter.
2. **Mon compte, connexion par email** : prénom + téléphone
   modifiables (le téléphone pré-remplira les prochains messages),
   changement d'email (double confirmation par email — normal) et de
   mot de passe.
3. **Mon compte, connexion Google/Apple** *(quand tu auras activé ces
   fournisseurs)* : le bloc affiche « Connecté avec Google · email »
   en lecture seule — seuls prénom et téléphone restent modifiables.
   Aperçu sans attendre : http://localhost:3000/admin/apercu-compte
4. **Suppression (RGPD)** : crée un compte jetable → « Supprimer mon
   compte » → confirmation « action définitive » → tout est effacé
   (compte, conversations, photos). ⚠️ C'est une vraie suppression.

## Anti-robots invisible (optionnel, avant le lancement public)

L'inscription particulier est protégée par Cloudflare Turnstile
(l'équivalent moderne du reCAPTCHA invisible, gratuit). Sans
configuration, rien ne change ; pour l'activer :

1. Compte gratuit sur [dash.cloudflare.com](https://dash.cloudflare.com)
   → **Turnstile** → **Add site** : nom « Roswel », domaine
   `localhost` (puis ton domaine à la mise en ligne), mode
   **Invisible** → tu obtiens 2 clés.
2. La **clé site** → `.env.local`, ligne
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY=` → redémarrer `npm run dev`.
3. La **clé secrète** → Supabase → **Authentication** → **Attack
   Protection** → **Enable Captcha protection** → fournisseur
   « Turnstile » → coller la clé → Save.

Dès lors, chaque création de compte/connexion est vérifiée sans
aucune action pour l'utilisateur (pas de SMS, pas de cases à cocher).

> Note : une fois la protection activée côté Supabase, elle s'applique
> à TOUTES les connexions par email — y compris celle des artisans.
> Le composant anti-robots est déjà branché sur le formulaire
> particulier ; si tu actives la protection, dis-le-moi et je
> l'ajouterai aussi au formulaire artisan (2 lignes).
