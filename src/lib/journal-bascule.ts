"use client";

/**
 * LE JOURNAL DE LA BASCULE — il enregistre, il ne corrige rien
 * ==================================================================
 * (passe nº 173)
 *
 * LE DÉFAUT À ÉCLAIRER : sur iPhone, au clic sur l'un des deux boutons
 * de bascule, tout le contenu de la page disparaît une fraction de
 * seconde, puis revient. SYSTÉMATIQUE sur téléphone, INEXISTANT sur
 * web. Un défaut qui ne se produit que là désigne un chemin de code
 * différent — et ce chemin, seul l'appareil du propriétaire peut le
 * dire.
 *
 * CE MODULE EST LE CARNET. Les composants y écrivent une ligne quand
 * il se passe quelque chose ; la sonde (SondeBascule) le lit et
 * l'affiche. Il ne vit QUE si l'adresse porte `?sonde-bascule=1` :
 * sans elle, `noter()` sort à la première ligne et ne coûte rien.
 *
 * ⚠️ AUCUN ÉTAT REACT NULLE PART. Le journal est un tableau de module,
 * les abonnés sont des fonctions : un enregistrement ne provoque
 * jamais de rendu, et ne peut donc pas déranger ce qu'il observe.
 */

/** Une ligne : le temps depuis la première, et le texte. */
export type Ligne = { t: number; texte: string };

const LIGNES_GARDEES = 400;

/**
 * ⚠️ LE JOURNAL TRAVERSE LES PAGES (nº 175-§6)
 * =============================================
 * Le nouveau défaut à éclairer se produit ENTRE deux pages : on ouvre
 * une fiche, on revient, et au bout de sept ou huit allers-retours on
 * atterrit en haut au lieu de sa place. Sur smartphone, toucher une
 * carte est une VRAIE navigation de document : la mémoire du module
 * repart de zéro à chaque page. Un journal qui ne survit pas au voyage
 * ne peut donc rien dire de ce voyage-là.
 *
 * Il est donc RECOPIÉ dans la mémoire d'onglet (`sessionStorage`), et
 * relu au chargement de la page suivante — exactement ce que fait déjà
 * la sonde du retour. Le tableau en mémoire reste la source : le
 * stockage n'en est qu'une sauvegarde, écrite groupée (jamais à chaque
 * ligne), et vidée à la fermeture de l'onglet.
 *
 * ⚠️ ET L'ARMEMENT AUSSI : `?sonde-bascule=1` disparaît de l'adresse dès
 * qu'on ouvre une fiche. Il est donc gardé dans la mémoire d'onglet —
 * sans quoi la sonde s'éteindrait au premier lien, c'est-à-dire au
 * moment précis où l'on veut la lire.
 */
const CLE_JOURNAL = "yokofolio:sonde-bascule:journal";
const CLE_ARMEE = "yokofolio:sonde-bascule";

const journal: Ligne[] = [];
const abonnes = new Set<() => void>();
let depart = 0;
let armeeConnue: boolean | null = null;
let relu = false;
let sauvegardeEnAttente = 0;

/** La sonde est-elle demandée ? Lu UNE FOIS, gardé ensuite — dans
    l'adresse, ou dans la mémoire de l'onglet (une page plus loin). */
export function sondeBasculeArmee(): boolean {
  if (armeeConnue !== null) return armeeConnue;
  if (typeof window === "undefined") return false;
  const demandee =
    new URLSearchParams(window.location.search).get("sonde-bascule") === "1";
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

/** Le journal de la page précédente, s'il y en a un. Une seule fois. */
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

/** La sauvegarde, groupée : une écriture pour une rafale de lignes. */
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

/** Écrire une ligne. Sans la sonde, ne fait STRICTEMENT rien. */
export function noter(texte: string): void {
  if (!sondeBasculeArmee()) return;
  relireLaSauvegarde();
  const maintenant = performance.now();
  if (depart === 0) depart = maintenant;
  journal.push({ t: Math.round(maintenant - depart), texte });
  //  Le journal ne s'efface jamais tout seul : il oublie seulement les
  //  plus vieilles lignes quand il devient très long.
  if (journal.length > LIGNES_GARDEES) journal.splice(0, 40);
  sauvegarderBientot();
  for (const rappel of abonnes) rappel();
}

/** LES INSTANCES VIVANTES d'un composant — c'est la ligne qui compte :
    un « démontage » après un clic, et la cause est trouvée. */
const vivants = new Map<string, number>();

export function noterMontage(quoi: string, precision = ""): void {
  if (!sondeBasculeArmee()) return;
  const compte = (vivants.get(quoi) ?? 0) + 1;
  vivants.set(quoi, compte);
  noter(`MONTAGE ${quoi} · instances ${compte}${precision ? ` · ${precision}` : ""}`);
}

export function noterDemontage(quoi: string): void {
  if (!sondeBasculeArmee()) return;
  const compte = Math.max(0, (vivants.get(quoi) ?? 1) - 1);
  vivants.set(quoi, compte);
  noter(`⚠️ DÉMONTAGE ${quoi} · instances ${compte}`);
}

export function lignesDuJournal(): Ligne[] {
  //  COPIER ou ENVOYER peut être touché avant toute écriture : la
  //  sauvegarde de la page précédente doit être là quand même.
  if (sondeBasculeArmee()) relireLaSauvegarde();
  return journal;
}

export function souscrireAuJournal(rappel: () => void): () => void {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}
