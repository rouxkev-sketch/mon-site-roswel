import { METIERS, OFFRES_METIER } from "@/config/roswel";

/**
 * LES ENTRÉES DU MENU DES MÉTIERS (règles multi-métiers)
 * ------------------------------------------------------
 * Une ENTRÉE (« offre ») est ce que l'artisan choisit et ce que le
 * visiteur cherche : soit un métier simple (« Plombier »), soit une
 * double compétence (« Plombier & Chauffagiste »). La liste est
 * FERMÉE et centralisée dans src/config/roswel.ts.
 *
 * En base, une entrée est enregistrée comme la LISTE des métiers qui
 * la composent (table artisan_metiers) : une double compétence pose
 * donc deux lignes. Résultat : une recherche « Plombier » remonte
 * naturellement les « Plombier & Chauffagiste », et « Chauffagiste »
 * aussi — sans rien changer à la base ni au classement.
 */

export type OffreMetier = (typeof OFFRES_METIER)[number];

/** L'entrée correspondant à une adresse web (slug), si elle existe */
export function offreDepuisSlug(slug: string): OffreMetier | null {
  return OFFRES_METIER.find((offre) => offre.slug === slug) ?? null;
}

/** Les métiers « atomiques » couverts par une entrée du menu */
export function metiersDeLOffre(slug: string): string[] {
  return offreDepuisSlug(slug)?.metiers ?? [];
}

/** Vrai si l'entrée est une double compétence (2 métiers ou plus) */
export function estDoubleCompetence(slug: string): boolean {
  return metiersDeLOffre(slug).length > 1;
}

/**
 * L'ENTRÉE RÉELLE d'un artisan à partir des métiers enregistrés en
 * base — c'est elle qu'affichent la carte et la fiche. Un artisan
 * « plombier + chauffagiste » affiche « Plombier & Chauffagiste »
 * (jamais « Plombier · Chauffagiste »).
 */
export function offreDesMetiers(metiers: string[]): OffreMetier | null {
  if (metiers.length === 0) return null;
  const cherches = [...metiers].sort().join("|");
  return (
    OFFRES_METIER.find(
      (offre) => [...offre.metiers].sort().join("|") === cherches
    ) ?? null
  );
}

/**
 * Les métiers d'un artisan UN PAR UN (« Plombier », « Chauffagiste ») —
 * la fiche en fait une pastille chacun. C'est volontairement différent
 * de `libelleMetiersArtisan`, qui donne l'entrée du menu d'un seul
 * tenant (« Plombier & Chauffagiste ») pour les cartes et la recherche.
 */
export function libellesMetiersSepares(metiers: string[]): string[] {
  return metiers.map(
    (slug) => METIERS.find((m) => m.slug === slug)?.label ?? slug
  );
}

/**
 * Le libellé à AFFICHER pour les métiers d'un artisan : l'entrée
 * réelle si elle existe, sinon les libellés joints (cas d'une fiche
 * ancienne dont la combinaison n'est plus au menu).
 */
export function libelleMetiersArtisan(metiers: string[]): string {
  const offre = offreDesMetiers(metiers);
  if (offre) return offre.label;
  return metiers
    .map((slug) => METIERS.find((m) => m.slug === slug)?.label ?? slug)
    .join(" · ");
}
