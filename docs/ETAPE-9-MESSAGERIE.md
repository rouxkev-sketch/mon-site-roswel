# La messagerie interne — guide (étape 9)

## À faire une fois (2 minutes)

1. **Exécuter le complément SQL** : Supabase → **SQL Editor** →
   coller tout `supabase/etape9.sql` → **Run**. (Stockage privé des
   photos de messages + compteur pour la rapidité de réponse.)

2. **Les emails, deux possibilités :**
   - **Ne rien faire** : les emails sont « simulés » et s'affichent
     dans le terminal où tourne `npm run dev` — parfait pour tester.
   - **Envoyer pour de vrai** : compte gratuit sur
     [resend.com](https://resend.com) (100 emails/jour) → API Keys →
     copier la clé dans `.env.local`, ligne `RESEND_API_KEY=`, puis
     redémarrer `npm run dev`.

## Le circuit complet à tester (10 minutes, savoureux)

Il faut deux comptes : ton **compte artisan** (étape 8a, fiche
validée) et un **compte particulier**. Astuce : utilise une fenêtre
normale pour l'un et une **fenêtre privée** pour l'autre.

1. **Côté particulier** : recherche un artisan (ex. ta fiche validée),
   ouvre sa fiche → bouton **« Message »**. Crée un compte particulier
   (email, ou Google/Apple si configurés). Le formulaire s'ouvre :
   - la **ville est pré-remplie** (tu viens de faire une recherche
     dans cette visite — c'est la règle §9 ; ouvre le même formulaire
     dans un nouvel onglet sans recherche : champ vide) ;
   - remplis le message (compteur 2 500), joins une ou deux photos,
     urgence oui/non → **Envoyer**.
2. Tu arrives dans la **conversation**. Dans le terminal :
   l'**email simulé** destiné à l'artisan (sans aucun contenu du
   message — règle §11).
3. **Côté artisan** (fenêtre privée) : espace artisan →
   **« 📨 Mes demandes »** → pastille rose « non lu » → ouvre et
   **réponds**. Tu vois : prénom, ville, téléphone laissé — jamais
   l'email du particulier.
4. **La rapidité de réponse vient d'être calculée** : ouvre la fiche
   publique de l'artisan → le badge « ⚡ Répond en moins de… »
   est apparu (moyenne mise à jour à chaque réponse, jamais saisie).
5. **Côté particulier** : pastille « non lu » dans /messages, et
   l'email simulé « un artisan vous a répondu » dans le terminal.

## Ce qui est garanti par construction

- **Une conversation par demande**, entièrement sur Roswel.
- Les règles de sécurité de la base ne montrent chaque conversation
  qu'à ses **deux participants**.
- L'artisan ne voit **jamais l'email** du particulier (il n'est même
  pas dans les tables consultées).
- Les **photos de messages sont privées** : liens temporaires (1 h)
  générés uniquement pour les participants.
- Les emails de notification ne contiennent **ni contenu ni email**
  de l'autre partie — juste une invitation à se connecter.
- L'email « modifications demandées » de l'admin (étape 8b) part
  maintenant aussi par ce canal.

## Aperçu sans base

http://localhost:3000/admin/apercu-messagerie (formulaire + bulles).
