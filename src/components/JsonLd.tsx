/**
 * DONNÉES STRUCTURÉES SCHEMA.ORG
 * ------------------------------
 * Petit encart invisible que les moteurs de recherche lisent pour
 * mieux comprendre la page (fiche d'artisan, liste de résultats…).
 */
/**
 * ██ §1 (nº 699) — POURQUOI CE `replace` N'EST PAS DÉCORATIF ██
 * ==================================================================
 * CE QUE L'AUDIT nº 698 A TROUVÉ (rouge nº 3). Le contenu de cet
 * encart est du JSON… posé DANS UNE BALISE `<script>`. Or le
 * navigateur cherche la fin d'un `<script>` AVANT de regarder ce
 * qu'il y a dedans : il s'arrête au premier `</script>` qu'il
 * rencontre, même au milieu d'une chaîne de caractères.
 * `JSON.stringify` échappe les guillemets et les retours à la ligne,
 * mais PAS le signe `<` — il n'a aucune raison de le faire, il ne
 * sait pas qu'on va écrire son résultat dans du HTML.
 * LE CHEMIN COMPLET, ET IL EST COURT : le nom d'un portfolio entre
 * ici (`name: tatoueur.nom`). Un portfolio nommé
 * `</script><script>…` refermait donc la balise et ouvrait la sienne
 * — du code choisi par un inconnu, exécuté chez tous les visiteurs
 * de la page. La modération le rendait improbable ; elle ne le
 * rendait pas impossible, et rien d'autre ne l'arrêtait (le site n'a
 * pas encore de politique de contenu).
 * LA CORRECTION TIENT EN UN CARACTÈRE ÉCHAPPÉ. `<` est la
 * façon d'écrire `<` que JSON comprend : le contenu reste
 * strictement le même pour un lecteur de JSON (les moteurs de
 * recherche liront le nom à l'identique), et la balise ne peut plus
 * se refermer.
 * ⚠️ ON N'ÉCHAPPE QUE `<`, ET C'EST SUFFISANT : sans lui, aucune
 * balise ne peut naître. Échapper `>` ou `&` en plus n'ajouterait
 * rien et rendrait le JSON moins lisible dans l'outil de développement.
 */
export function JsonLd({ donnees }: { donnees: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(donnees).replace(/</g, "\\u003c"),
      }}
    />
  );
}
