import { COULEURS } from "@/config/roswel";

/**
 * Transforme les couleurs du fichier de réglages central en
 * "variables CSS" comprises par le navigateur.
 *
 * Grâce à ça, les couleurs ne sont écrites qu'à UN seul endroit
 * (src/config/roswel.ts) : ce fichier fait juste le pont entre
 * les réglages et l'affichage. Il n'y a rien à modifier ici.
 */
export function variablesCssCouleurs(): string {
  const variables = {
    "--rw-primaire": COULEURS.primaire,
    "--rw-primaire-fonce": COULEURS.primaireFonce,
    "--rw-primaire-clair": COULEURS.primaireClair,
    "--rw-degrade-debut": COULEURS.degradeDebut,
    "--rw-degrade-fin": COULEURS.degradeFin,
    "--rw-fond": COULEURS.fond,
    "--rw-fond-doux": COULEURS.fondDoux,
    "--rw-encre": COULEURS.encre,
    "--rw-encre-douce": COULEURS.encreDouce,
    "--rw-bordure": COULEURS.bordure,
    "--rw-pastille-recommande": COULEURS.pastilleRecommande,
    "--rw-pastille-top": COULEURS.pastilleTop,
    "--rw-succes": COULEURS.succes,
    "--rw-alerte": COULEURS.alerte,
    "--rw-erreur": COULEURS.erreur,
  };

  const lignes = Object.entries(variables)
    .map(([nom, valeur]) => `${nom}: ${valeur};`)
    .join(" ");

  return `:root { ${lignes} }`;
}
