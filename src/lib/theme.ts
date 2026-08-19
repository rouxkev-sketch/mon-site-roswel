import { COULEURS } from "@/config/roswel";
import { COULEURS_SOMBRE } from "@/config/tatouage";

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
    "--rw-primaire-voile": COULEURS.primaireVoile,
    "--rw-degrade-debut": COULEURS.degradeDebut,
    "--rw-degrade-fin": COULEURS.degradeFin,
    "--rw-fond": COULEURS.fond,
    "--rw-fond-doux": COULEURS.fondDoux,
    "--rw-fond-page": COULEURS.fondPage,
    "--rw-bordure-carte-claire": COULEURS.bordureCarteClaire,
    "--rw-bordure-carte": COULEURS.bordureCarte,
    "--rw-encre": COULEURS.encre,
    "--rw-encre-douce": COULEURS.encreDouce,
    "--rw-bordure": COULEURS.bordure,
    "--rw-bordure-champ": COULEURS.bordureChamp,
    "--rw-pastille-excellence": COULEURS.pastilleExcellence,
    "--rw-pastille-recommande": COULEURS.pastilleRecommande,
    "--rw-succes": COULEURS.succes,
    "--rw-alerte": COULEURS.alerte,
    "--rw-erreur": COULEURS.erreur,

    // Le fond sombre du produit TATOUAGE. Ces variables existent sur
    // toutes les pages, mais ne sont utilisées que par les classes
    // `sombre-*` des pages tatouage : les pages artisans restent
    // blanches, à l'identique.
    "--rw-sombre-fond": COULEURS_SOMBRE.fond,
    "--rw-sombre-carte": COULEURS_SOMBRE.carte,
    "--rw-sombre-eleve": COULEURS_SOMBRE.eleve,
    "--rw-sombre-eleve-clair": COULEURS_SOMBRE.eleveClair,
    "--rw-sombre-bordure": COULEURS_SOMBRE.bordure,
    //  §4 (nº 315) — LE TRAIT DES SÉPARATIONS, une seule valeur pour
    //  tout ce qui sépare deux sections (voir COULEURS_SOMBRE.trait).
    "--rw-sombre-trait": COULEURS_SOMBRE.trait,
    "--rw-sombre-haut": COULEURS_SOMBRE.haut,
    "--rw-sombre-haut-clair": COULEURS_SOMBRE.hautClair,
    "--rw-sombre-texte": COULEURS_SOMBRE.texte,
    "--rw-sombre-texte-doux": COULEURS_SOMBRE.texteDoux,
    //  §5 (nº 388) — le bleu des liens qui sortent du site.
    "--rw-sombre-lien": COULEURS_SOMBRE.lien,
    "--rw-sombre-lien-clair": COULEURS_SOMBRE.lienClair,
  };

  const lignes = Object.entries(variables)
    .map(([nom, valeur]) => `${nom}: ${valeur};`)
    .join(" ");

  return `:root { ${lignes} }`;
}
