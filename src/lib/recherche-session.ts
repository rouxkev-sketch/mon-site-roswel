/**
 * MÉMOIRE DE LA DERNIÈRE RECHERCHE (le temps de la visite)
 * --------------------------------------------------------
 * Quand quelqu'un lance une recherche, on retient la ville choisie
 * pendant sa visite (et seulement sa visite : tout s'efface à la
 * fermeture du navigateur).
 *
 * Utilité : afficher la ville RECHERCHÉE sur les cartes de
 * résultats et la fiche artisan (« Couvre… », « Intervient
 * sur… »). Sans recherche récente (favoris, lien partagé), ces
 * textes se replient sur la ville de l'artisan.
 */

const CLE = "roswel:derniere-recherche";

export type DerniereRecherche = {
  metier: string;      // slug du métier (ex. "plombier")
  villeNom: string;    // ex. "Villeurbanne"
  villeSlug: string;   // ex. "villeurbanne"
  codeInsee: string;   // identifiant officiel de la commune
};

export function memoriserRecherche(recherche: DerniereRecherche) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(recherche));
  } catch {
    // Stockage indisponible (navigation privée stricte…) : tant pis,
    // le champ ville ne sera simplement pas pré-rempli.
  }
}

export function lireDerniereRecherche(): DerniereRecherche | null {
  try {
    const brut = sessionStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as DerniereRecherche) : null;
  } catch {
    return null;
  }
}
