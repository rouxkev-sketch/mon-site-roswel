"use client";

/**
 * LE JOURNAL DU CARROUSEL ET DU PORTFOLIO — il enregistre, il ne
 * corrige rien
 * ==================================================================
 * (passe nº 218-§1)
 *
 * DEUX DÉFAUTS ONT RÉSISTÉ AUX PASSES 210, 214, 216 ET 217 :
 *  a) LE SCINTILLEMENT — quand une photo s'immobilise, quelque chose
 *     se lève ou disparaît brutalement, « comme une ombre qui
 *     s'effacerait ». Sur web, sur iPhone 12 et sur iPhone 8 ;
 *  b) LE PORTFOLIO SE DÉTRAQUE — en enchaînant les sélecteurs : aucune
 *     photo, ou des photos qui n'arrivent qu'après un défilement, ou
 *     plus rien de sélectionnable, ou les flèches disparues. Différent
 *     à chaque fois — c'est la signature d'un ÉTAT QUI S'ACCUMULE, pas
 *     d'une erreur de logique.
 *
 * On ne devine plus : on regarde. Ce module est le carnet ; la sonde
 * (SondeCarrousel) l'affiche, le copie et l'envoie. Il ne vit QUE si
 * l'adresse porte `?sonde-carrousel=1` : sans elle, `noter()` sort à la
 * première ligne et ne coûte rien.
 *
 * ⚠️ AUCUN ÉTAT REACT NULLE PART. Le journal est un tableau de module,
 * les abonnés sont des fonctions : un enregistrement ne provoque jamais
 * de rendu, et ne peut donc pas déranger ce qu'il observe — ce qui
 * serait le plus sûr moyen de faire disparaître le défaut au moment de
 * le mesurer.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : ce fichier, src/components/
 * SondeCarrousel.tsx, la ligne `<SondeCarrousel />` du layout, et les
 * appels `noter…` / `compter…` qui la nomment.
 */

/** Une ligne : le temps depuis la première, et le texte. */
export type Ligne = { t: number; texte: string };

const LIGNES_GARDEES = 500;

/*  LE JOURNAL TRAVERSE LES PAGES — sur smartphone, ouvrir une fiche est
    une VRAIE navigation de document : la mémoire du module repart de
    zéro. Un journal qui ne survit pas au voyage ne peut rien dire du
    voyage. Même procédé que la sonde de la bascule (nº 175-§6). */
const CLE_JOURNAL = "yokofolio:sonde-carrousel:journal";
const CLE_ARMEE = "yokofolio:sonde-carrousel";

const journal: Ligne[] = [];
const abonnes = new Set<() => void>();
let depart = 0;
let armeeConnue: boolean | null = null;
let relu = false;
let sauvegardeEnAttente = 0;

/** La sonde est-elle demandée ? Lu UNE FOIS, gardé ensuite — dans
    l'adresse, ou dans la mémoire de l'onglet (une page plus loin :
    `?sonde-carrousel=1` disparaît dès qu'on ouvre une fiche, c'est-à-dire
    au moment précis où l'on veut lire). */
export function sondeCarrouselArmee(): boolean {
  if (armeeConnue !== null) return armeeConnue;
  if (typeof window === "undefined") return false;
  const demandee =
    new URLSearchParams(window.location.search).get("sonde-carrousel") === "1";
  let gardee = false;
  try {
    if (demandee) sessionStorage.setItem(CLE_ARMEE, "1");
    gardee = sessionStorage.getItem(CLE_ARMEE) === "1";
  } catch {
    // stockage indisponible : la sonde ne vivra que sur cette page
  }
  armeeConnue = demandee || gardee;
  return armeeConnue;
}

function relireLaSauvegarde(): void {
  if (relu) return;
  relu = true;
  try {
    const brut = sessionStorage.getItem(CLE_JOURNAL);
    if (!brut) return;
    const lignes = JSON.parse(brut) as Ligne[];
    if (Array.isArray(lignes)) journal.push(...lignes.slice(-LIGNES_GARDEES));
  } catch {
    // illisible : on repart d'un journal vide, sans rien casser
  }
}

function sauvegarderBientot(): void {
  if (sauvegardeEnAttente) return;
  sauvegardeEnAttente = window.setTimeout(() => {
    sauvegardeEnAttente = 0;
    sauvegarderMaintenant();
  }, 200);
}

/** La sauvegarde, tout de suite — avant de quitter la page. */
export function sauvegarderMaintenant(): void {
  try {
    sessionStorage.setItem(CLE_JOURNAL, JSON.stringify(journal));
  } catch {
    // quota ou navigation privée : le journal reste en mémoire
  }
}

/**
 * ÉCRIRE UNE LIGNE. Sans la sonde, ne fait STRICTEMENT rien.
 *
 * ⚠️ L'HORODATAGE EST EN MILLISECONDES depuis la première ligne de la
 * page — c'est ce que demande le propriétaire, et c'est la seule
 * échelle où l'on voit qu'une image apparaît « 40 ms après l'arrêt ».
 */
export function noter(texte: string): void {
  if (!sondeCarrouselArmee()) return;
  relireLaSauvegarde();
  const maintenant = performance.now();
  if (depart === 0) depart = maintenant;
  journal.push({ t: Math.round(maintenant - depart), texte });
  if (journal.length > LIGNES_GARDEES) journal.splice(0, 50);
  sauvegarderBientot();
  for (const rappel of abonnes) rappel();
}

/** L'instant de référence du journal, en millisecondes de page. */
export function maintenantJournal(): number {
  if (depart === 0) return 0;
  return Math.round(performance.now() - depart);
}

/* ==================================================================
 * LES COMPTEURS — LA LIGNE LA PLUS IMPORTANTE
 * ==================================================================
 * « chaque montage et démontage du carrousel et du zoom, avec un
 * COMPTEUR d'instances vivantes — c'est la ligne la plus importante ».
 * Le même mécanisme sert aux observateurs d'intersection et aux
 * écouteurs d'événements : ce qui monte doit descendre, et un compteur
 * qui grimpe sans jamais redescendre EST la panne.
 */
const vivants = new Map<string, number>();

/** L'inventaire complet, en une ligne — « carrousel 1 · zoom 1 · … ». */
export function inventaire(): string {
  const entrees = [...vivants.entries()].filter(([, n]) => n !== 0);
  if (entrees.length === 0) return "rien de vivant";
  return entrees.map(([quoi, n]) => `${quoi} ${n}`).join(" · ");
}

export function compteVivant(quoi: string): number {
  return vivants.get(quoi) ?? 0;
}

export function noterMontage(quoi: string, precision = ""): void {
  if (!sondeCarrouselArmee()) return;
  const compte = (vivants.get(quoi) ?? 0) + 1;
  vivants.set(quoi, compte);
  noter(
    `MONTAGE ${quoi} · vivants ${compte}${precision ? ` · ${precision}` : ""}` +
      ` │ ${inventaire()}`
  );
}

export function noterDemontage(quoi: string, precision = ""): void {
  if (!sondeCarrouselArmee()) return;
  const compte = Math.max(0, (vivants.get(quoi) ?? 1) - 1);
  vivants.set(quoi, compte);
  noter(
    `DÉMONTAGE ${quoi} · vivants ${compte}${precision ? ` · ${precision}` : ""}` +
      ` │ ${inventaire()}`
  );
}

/**
 * UNE RESSOURCE POSÉE OU LIBÉRÉE — observateur d'intersection,
 * écouteur d'événement, minuteur. Silencieuse par défaut (elles sont
 * nombreuses) : elle ne dit rien, elle COMPTE. L'inventaire part avec
 * chaque montage, chaque changement de série et chaque arrêt de photo.
 */
export function ressource(quoi: string, delta: 1 | -1): void {
  if (!sondeCarrouselArmee()) return;
  vivants.set(quoi, Math.max(0, (vivants.get(quoi) ?? 0) + delta));
}

export function lignesDuJournal(): Ligne[] {
  if (sondeCarrouselArmee()) relireLaSauvegarde();
  return journal;
}

export function souscrireAuJournal(rappel: () => void): () => void {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

/* ==================================================================
 * L'ARRÊT D'UNE PHOTO — le repère des 300 ms
 * ==================================================================
 * « toute image qui apparaît ou disparaît dans les 300 ms suivant
 * l'arrêt ». La sonde a donc besoin d'un instant de référence, posé
 * par le carrousel quand son défilement s'immobilise, et lu par
 * l'observateur de mutations.
 */
let dernierArret = -1;

export function noterArret(detail: string): void {
  if (!sondeCarrouselArmee()) return;
  dernierArret = performance.now();
  noter(`⏹ ARRÊT · ${detail} │ ${inventaire()}`);
}

/** Combien de millisecondes depuis le dernier arrêt (−1 : aucun). */
export function depuisLArret(): number {
  if (dernierArret < 0) return -1;
  return Math.round(performance.now() - dernierArret);
}
