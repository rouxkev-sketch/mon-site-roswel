import { CHARTE_CLAIRE } from "@/config/charte";
import { COULEURS_SOMBRE } from "@/config/tatouage";

/**
 * Transforme les couleurs des deux chartes en "variables CSS"
 * comprises par le navigateur.
 *
 * Grâce à ça, chaque couleur n'est écrite qu'à UN seul endroit — la
 * couche claire dans `src/config/charte.ts`, la couche sombre dans
 * `src/config/tatouage.ts` : ce fichier fait juste le pont entre les
 * réglages et l'affichage. Il n'y a rien à modifier ici.
 *
 * (nº 761 — la couche claire venait de `src/config/roswel.ts`, le
 * fichier de réglages du produit artisans, supprimé à cette passe.
 * Aucune valeur n'a bougé au déménagement.)
 */
export function variablesCssCouleurs(): string {
  const variables = {
    "--rw-primaire": CHARTE_CLAIRE.primaire,
    "--rw-primaire-fonce": CHARTE_CLAIRE.primaireFonce,
    "--rw-primaire-clair": CHARTE_CLAIRE.primaireClair,
    "--rw-primaire-voile": CHARTE_CLAIRE.primaireVoile,
    "--rw-degrade-debut": CHARTE_CLAIRE.degradeDebut,
    "--rw-degrade-fin": CHARTE_CLAIRE.degradeFin,
    "--rw-fond": CHARTE_CLAIRE.fond,
    "--rw-fond-doux": CHARTE_CLAIRE.fondDoux,
    "--rw-fond-page": CHARTE_CLAIRE.fondPage,
    "--rw-bordure-carte-claire": CHARTE_CLAIRE.bordureCarteClaire,
    "--rw-bordure-carte": CHARTE_CLAIRE.bordureCarte,
    "--rw-encre": CHARTE_CLAIRE.encre,
    "--rw-encre-douce": CHARTE_CLAIRE.encreDouce,
    "--rw-bordure": CHARTE_CLAIRE.bordure,
    "--rw-bordure-champ": CHARTE_CLAIRE.bordureChamp,
    "--rw-pastille-excellence": CHARTE_CLAIRE.pastilleExcellence,
    "--rw-pastille-recommande": CHARTE_CLAIRE.pastilleRecommande,
    "--rw-succes": CHARTE_CLAIRE.succes,
    "--rw-alerte": CHARTE_CLAIRE.alerte,
    "--rw-erreur": CHARTE_CLAIRE.erreur,

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
    //  §2 (nº 664) — les deux couleurs de la famille des pastilles
    //  d'événement : le vert de ce qui est validé (rapatrié du
    //  catalogue des notifications, où il était écrit en dur) et le
    //  rouge du problème, recalculé pour le fond sombre.
    "--rw-sombre-succes": COULEURS_SOMBRE.succes,
    "--rw-sombre-erreur": COULEURS_SOMBRE.erreur,
    //  §5 (nº 388) — le bleu des liens qui sortent du site.
    "--rw-sombre-lien": COULEURS_SOMBRE.lien,
    "--rw-sombre-lien-clair": COULEURS_SOMBRE.lienClair,
    //  §5 (nº 821) — la primaire éclaircie, pour le survol d'un lien
    //  rouge sur le fond sombre (voir COULEURS_SOMBRE.primaireClair).
    "--rw-sombre-primaire-clair": COULEURS_SOMBRE.primaireClair,
  };

  const lignes = Object.entries(variables)
    .map(([nom, valeur]) => `${nom}: ${valeur};`)
    .join(" ");

  return `:root { ${lignes} }`;
}
