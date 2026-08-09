# L'interface admin — guide (étape 8b)

Rien à exécuter côté Supabase : tout était prêt. Les deux écrans
sont sur **http://localhost:3000/admin** (développement uniquement).

## 1. Validation des fiches (/admin/validation)

Le circuit complet à tester avec la fiche créée à l'étape 8a :

1. Ta fiche d'essai apparaît dans « En attente de validation », avec :
   photo, métiers, bio, lien Instagram cliquable, et le **verdict
   SIREN re-vérifié en direct** dans l'annuaire officiel (actif ?
   nom cohérent ? date de création ?).
2. **Les 3 cases** (cochées par défaut) : SIREN · liens cohérents ·
   photo personnelle. Deux issues :
   - **tout coché → « Valider la fiche »** : elle devient visible.
     Cherche-la ensuite dans la recherche pour le vérifier !
   - **une case décochée → « Demander des modifications »** : le
     message type correspondant (rédigé dans `src/config/roswel.ts`,
     section VALIDATION_FICHE) est transmis à l'artisan. Ouvre son
     espace : bandeau rouge avec le motif. Corrige, réenregistre →
     la fiche repart « en attente ».

> L'email de prévenance (« votre fiche nécessite des modifications »)
> sera branché à l'étape 9, avec le service d'emails commun à la
> messagerie. Le message type est déjà visible dans l'espace artisan.

## 2. Saisie Instagram (/admin/instagram)

- Les artisans dont les chiffres sont **absents ou trop vieux**
  (> 30 jours, réglable : FRAICHEUR_INSTAGRAM_JOURS) remontent en
  haut avec une **alerte orange**. Recrée les artisans de démo
  (/admin/artisans-demo) : « Élec'Presqu'île » a volontairement des
  données de 60 jours pour te montrer l'alerte.
- Clique « Ouvrir son Instagram », relève abonnés + publications,
  **Enregistrer** → le **score est recalculé automatiquement** et la
  réponse affiche le nouveau total et la pastille.
- Ta fiche d'essai de l'étape 8a n'a pas encore de chiffres (« score
  Instagram vaut 0 ») : renseigne-les et regarde son score monter.

## Le bug SIREN signalé — corrigé ✅

Le numéro 55210055400013 était refusé car, pour les très grosses
entreprises, l'annuaire renvoie l'établissement cherché ailleurs que
prévu (champ « siège », ou pas du tout listé quand il y a des milliers
d'établissements). La vérification regarde maintenant les trois
endroits. Pour tester n'importe quel numéro en direct :

```
http://localhost:3000/api/admin/test-siren?siren=55210055400013&nom=SNCF
```

(Note : si ce numéro précis ressort « établissement fermé », c'est
que cet établissement SNCF historique est réellement clos dans
Sirene — le message est alors exact. L'outil te montre le verdict
détaillé.)
