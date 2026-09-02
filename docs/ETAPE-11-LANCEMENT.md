# Finitions et lancement — guide (étape 11)

## À faire une fois (2 minutes)

**Exécuter le complément SQL** : Supabase → SQL Editor → coller tout
`supabase/etape11.sql` → Run. (La fonction qui liste les pages
métier/ville existantes, pour le plan du site.)

## 1. La passerelle avis Google

### Créer la clé API (10 minutes, optionnel tant que tu testes)

1. [console.cloud.google.com](https://console.cloud.google.com) →
   créer un projet « Roswel ».
2. Menu **APIs & Services** → **Library** → activer
   « **Places API (New)** ». (Google demande une carte bancaire ;
   le quota gratuit mensuel couvre très largement un lancement.)
3. **Credentials** → **Create credentials** → **API key** → copier la
   clé dans `.env.local`, ligne `GOOGLE_PLACES_API_KEY=` →
   redémarrer `npm run dev`.
4. Recommandé : restreindre la clé à l'API Places (bouton « Edit API
   key » → API restrictions).

### L'utiliser

- **http://localhost:3000/admin/avis-google** : pour chaque artisan,
  cherche sa fiche Google (nom + ville), **associe-la**, puis
  **rafraîchis** la note quand tu veux — le score se recalcule
  automatiquement. Règle Google respectée : seuls la note et le
  nombre d'avis sont récupérés, jamais le détail des avis.
- Sur la **fiche publique** : le lien « Avis Google » ouvre
  directement les avis de la fiche associée, et la mention « fournis
  par Google » s'affiche (attribution obligatoire).
- Dans une **conversation**, après une réponse d'artisan, le
  particulier voit l'invitation « Intervention terminée ? » : toucher
  les étoiles ouvre la fenêtre « écrire un avis » de la fiche Google.

## 2. Le SEO

- **/sitemap.xml** : généré automatiquement — accueil, fiches
  d'artisans validées, et uniquement les pages métier/ville où un
  artisan existe (jamais de page vide). Reconstruit au plus une fois
  par jour.
- **/robots.txt** : les espaces privés (compte, messages, admin…)
  sont exclus des moteurs de recherche.
- **Schema.org** : les fiches artisans et les pages de résultats
  portent des données structurées invisibles pour les moteurs.
- À la mise en ligne : déclarer le sitemap dans Google Search Console.

## 3. Le RGPD

- **Bandeau cookies** : s'affiche à la première visite. Honnête :
  Roswel n'utilise que des cookies essentiels (connexion), pas de
  traçage. Si un jour tu ajoutes un outil de mesure d'audience, il
  faudra le transformer en vrai choix accepter/refuser.
- **Pages légales** : /legal (nº 811 : l’adresse était /mentions-legales ; /cgu et /confidentialite n’existent plus) et /terms (nº 814 : les Terms of Use, avec la section DMCA et la politique de confidentialité dans /legal — ce qu’un juriste doit encore lire : docs/A-VALIDER-AVOCAT.md)
  (liens au pied de l'accueil). ⚠️ Cherche « [À compléter] » dans ces
  pages : nom de l'éditeur, adresse, email de contact, date. Et fais
  relire par un professionnel avant l'ouverture au public.
- La **suppression de compte** (étape 10) et le **cloisonnement des
  emails** (étape 9) complètent le dispositif.

## 4. Check-list avant lancement public

- [ ] Compléter les [À compléter] des pages légales (+ relecture pro)
- [x] Logos définitifs en place (`public/images/roswel-logo.png` et
      `roswel-icone.png` — intouchables, voir README et AGENTS.md) ;
      vérifier qu'ils sont bien envoyés sur GitHub avec le projet
- [ ] Mettre en ligne sur Vercel : brancher le dépôt GitHub, recopier
      les variables de `.env.local` dans les réglages Vercel, et
      mettre `NEXT_PUBLIC_SITE_URL` au vrai domaine
- [ ] Supabase → Authentication : réactiver « Confirm email »,
      ajouter les adresses du domaine réel (Site URL + Redirect URLs)
- [ ] Activer Google / Facebook / Apple (docs/CONFIGURATION-SUPABASE.md)
- [ ] Activer l'anti-robots Turnstile (docs/ETAPE-10-COMPTE.md)
- [ ] Resend : domaine d'envoi vérifié + clé en production
- [ ] Clé Google Places en production + fiches Google associées
- [ ] Supprimer les artisans de démonstration (/admin/artisans-demo)
- [ ] Google Search Console : déclarer le site et le sitemap

> Les pages /admin/* n'existent qu'en développement : elles sont
> automatiquement introuvables sur le site en ligne. Pour administrer
> après le lancement, lance simplement `npm run dev` sur ton
> ordinateur — il travaille sur la vraie base.
