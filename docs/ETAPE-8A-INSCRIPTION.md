# L'inscription des artisans — guide (étape 8a)

L'étape 8 est en deux parties : **8a, l'inscription** (ce guide) puis
**8b, l'interface admin** (validation par cases à cocher + saisie
Instagram).

## À faire une fois (2 minutes)

1. **Exécuter le complément SQL** : Supabase → **SQL Editor** →
   **New query** → coller tout `supabase/etape8.sql` → **Run**.
   (Il crée l'espace de stockage des photos et la colonne des
   demandes de modification.)

2. *(Recommandé pour tester sans attendre les emails)* Dans Supabase :
   **Authentication** → **Sign In / Providers** → **Email** →
   désactiver « **Confirm email** » → Save. Tu pourras créer des
   comptes de test instantanément. À réactiver avant le lancement
   public.

## Le parcours à tester (5 minutes)

1. Sur l'accueil, touche « **Vous êtes artisan ? Rejoignez Roswel** »
   (tout en bas) — ou va sur http://localhost:3000/devenir-artisan
2. Crée un compte avec un email (les boutons Google/Facebook/Apple
   s'activeront quand tu configureras ces fournisseurs dans Supabase).
3. Remplis la fiche :
   - **photo obligatoire** (n'importe quelle photo de visage pour
     tester — elle est compressée automatiquement avant l'envoi) ;
   - métiers (plusieurs possibles), **adresse en autocomplétion
     officielle** + rayon ;
   - **Instagram obligatoire** ;
   - bio (compteur de caractères), horaires jour par jour,
     disponibilités ;
   - téléphone optionnel + case « WhatsApp identique » ;
   - **SIREN optionnel** : mets un vrai SIREN **actif** pour voir la
     vérification — le plus simple est d'en copier un sur
     [annuaire-entreprises.data.gouv.fr](https://annuaire-entreprises.data.gouv.fr)
     (cherche un commerce que tu connais, ouvre sa fiche, copie le
     SIREN du siège). Un SIREN bidon ou fermé est refusé avec un
     message clair. Pour diagnostiquer un numéro :
     `http://localhost:3000/api/admin/test-siren?siren=LE_NUMERO`
4. Envoie : bandeau jaune « **Vérification en cours** » — et vérifie
   que la fiche est **introuvable dans la recherche** (invisible tant
   que non validée, comme au cahier des charges).

La validation admin (qui rendra la fiche visible) arrive à l'étape 8b.

## Notes techniques

- **Vérification SIREN** : via l'annuaire public des entreprises de
  l'État (recherche-entreprises.api.gouv.fr, construit sur les données
  Sirene de l'INSEE). Gratuit, sans clé à créer. On vérifie :
  existence, établissement actif, et on récupère le nom légal + la
  date de création (pour l'ancienneté).
- **Photos** : compressées dans le navigateur (max 1 200 px, JPEG)
  puis stockées chez Supabase. Chaque artisan ne peut écrire que dans
  son propre dossier ; la lecture est publique (fiches).
- **Adresse** : jamais montrée aux visiteurs, elle sert au calcul de
  distance. Autocomplétion : adresse.data.gouv.fr (officiel, gratuit).
- Aperçu du formulaire sans compte :
  http://localhost:3000/admin/apercu-inscription
