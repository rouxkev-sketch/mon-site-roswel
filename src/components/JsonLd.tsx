/**
 * DONNÉES STRUCTURÉES SCHEMA.ORG
 * ------------------------------
 * Petit encart invisible que les moteurs de recherche lisent pour
 * mieux comprendre la page (fiche d'artisan, liste de résultats…).
 */
export function JsonLd({ donnees }: { donnees: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
    />
  );
}
