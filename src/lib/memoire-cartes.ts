"use client";

import { adresseDeRechercheCourante } from "@/lib/adresse-recherche";

/**
 * ██ §2 (nº 372) — OÙ EN ÉTAIT CHAQUE CARTE DE SON DÉFILÉ ██
 * ==================================================================
 * ⚠️ §2 (nº 842) — CE MODULE REVIENT, INCHANGÉ SAUF UNE ADRESSE. Il
 * avait quitté le dépôt à la nº 603 (« les trois modules de lib sans
 * importateur ») parce que la nº 445 avait retiré le défilé des cartes
 * — son unique appelant. Le fil du doigt (nº 841) l'a fait renaître, et
 * le défaut qu'il traitait est revenu mot pour mot : « on fait défiler
 * les photos d'une carte, on ouvre un profil, on revient → la carte est
 * revenue à la photo 1 ». Rien de ce qui suit n'a été réécrit : seule
 * l'adresse d'une fiche a changé de langue entre-temps (nº 836).
 * LE DÉFAUT : au doigt, ouvrir une fiche puis revenir remet TOUTES les
 * cartes sur leur première photo. C'est mécanique — le retour est une
 * navigation de client, la mosaïque est donc DÉMONTÉE puis remontée, et
 * chaque carte repart de zéro. (Sur le web, la fenêtre se pose
 * par-dessus sans rien démonter : les positions y survivaient déjà ;
 * cette mémoire les protège aussi des recompositions.)
 *
 * ██ LE CHEMIN LE PLUS INERTE QUI EXISTE, ET C'EST VOULU ██
 * Le propriétaire a payé trois jours de bug sur le retour. Cette
 * mémoire ne touche donc À RIEN de ce qui a coûté cher :
 *  · AUCUNE écriture dans l'adresse — le défilement n'y écrivait rien,
 *    il n'y écrira rien (règle 332-§1) ;
 *  · AUCUNE entrée d'historique, aucun `pushState`, aucun `replaceState` ;
 *  · AUCUN stockage (ni session, ni local) : rien qui survive au
 *    document, donc rien qui traîne d'un jour sur l'autre ;
 *  · AUCUNE requête réseau ;
 *  · AUCUN effet sur le prérendu : c'est une variable de module, lue et
 *    écrite dans le navigateur seulement — le serveur ne la voit jamais.
 * C'est une simple table en mémoire vive : elle vit tant que le
 * document vit, et meurt avec lui. Un rechargement, un onglet neuf,
 * une réouverture du navigateur repartent donc de zéro, par
 * construction.
 *
 * ██ CE QUE ÇA PÈSE ██
 * Une entrée = une clé de carte (une trentaine de caractères, ~60
 * octets) + un petit nombre + le coût d'entrée d'une table (~50) —
 * disons 120 octets. Pour 500 cartes ouvertes à force de « Voir
 * plus » : environ 60 Ko de mémoire vive, une fois. À titre de
 * comparaison, UNE seule photo de carte en pèse la moitié à elle
 * seule. Le plafond ci-dessous borne quand même la table : au-delà,
 * la plus ANCIENNE entrée part (les cartes du haut de page, celles
 * qu'on ne reverra pas). Ce qu'on perd alors : ces cartes-là
 * rouvriront sur leur première photo.
 *
 * ██ ET ELLE NE TRAÎNE PAS D'UNE RECHERCHE À L'AUTRE ██
 * La table est rattachée à UNE SURFACE — l'adresse canonique de la
 * recherche (lib/adresse-recherche : critères compris, réglages de
 * sonde exclus, paramètres triés). Une nouvelle recherche, un nouveau
 * filtre, un autre onglet de « Ma sélection » : la surface change, la
 * table est vidée.
 * ⚠️ ON NE JUGE JAMAIS DEPUIS UNE FICHE. Sur le web, ouvrir une
 * fenêtre pousse l'adresse `/tatoueur/…` : si l'on comparait à ce
 * moment-là, on viderait la table juste avant d'en avoir besoin. Une
 * adresse de fiche ne dit RIEN de la surface, on l'ignore.
 */

/** Au-delà, la plus ancienne entrée part (voir la note ci-dessus). */
const PLAFOND = 2000;

const positions = new Map<string, number>();
let surfaceCourante: string | null = null;

/** La surface a-t-elle changé ? Si oui, la table repart vide. */
function accorderLaSurface(): void {
  if (typeof window === "undefined") return;
  //  Depuis une fiche, on ne juge rien (voir la note).
  //  §2 (nº 842) — `/artist/` : l'adresse d'une fiche est passée en
  //  anglais à la nº 836, pendant que ce module dormait hors du dépôt.
  if (window.location.pathname.startsWith("/artist/")) return;
  const surface = adresseDeRechercheCourante();
  if (surface === surfaceCourante) return;
  surfaceCourante = surface;
  positions.clear();
}

/**
 * RETENIR la photo qu'une carte affiche. Le rang 0 n'est pas une
 * information : c'est l'état par défaut, on efface plutôt que d'écrire.
 */
export function retenirPhotoDeCarte(cle: string, rang: number): void {
  if (!cle) return;
  accorderLaSurface();
  if (rang <= 0) {
    positions.delete(cle);
    return;
  }
  if (!positions.has(cle) && positions.size >= PLAFOND) {
    //  FIFO : la plus ancienne clé posée s'en va (l'ordre d'insertion
    //  d'une Map est garanti par le langage).
    const plusAncienne = positions.keys().next().value;
    if (plusAncienne !== undefined) positions.delete(plusAncienne);
  }
  positions.set(cle, rang);
}

/** LA PHOTO RETENUE pour cette carte — 0 si l'on n'en sait rien. */
export function photoRetenueDeCarte(cle: string): number {
  if (!cle || typeof window === "undefined") return 0;
  accorderLaSurface();
  return positions.get(cle) ?? 0;
}
