"use client";

/**
 * LE JOURNAL DES CARTES — il mesure, il ne corrige rien
 * ==================================================================
 * (passe nº 224-§5)
 *
 * DEUX DÉFAUTS QUE JE NE PEUX PAS REPRODUIRE, et que seul le téléphone
 * du propriétaire voit :
 *  a) « Voir plus de portfolios » déplace la page ;
 *  b) vers quatre-vingt-douze cartes, Chrome iOS tue l'onglet — la
 *     page de mort du moteur de rendu, c'est-à-dire la mémoire.
 *
 * Cette sonde relève, À CHAQUE CLIC sur « Voir plus », les huit
 * mesures qui répondent à ces deux questions :
 *   · `scrollY` AVANT, APRÈS le rendu, et APRÈS UNE SECONDE (le temps
 *     que les images se posent — c'est là que l'ancrage de défilement
 *     du navigateur se voit) ;
 *   · le nombre de CARTES montées ;
 *   · le nombre de NŒUDS du document ;
 *   · le nombre d'IMAGES portant un `src` réel — la mesure qui dit si
 *     le coût mémoire est borné ou s'il croît avec les cartes ;
 *   · le nombre d'OBSERVATEURS vivants ;
 *   · `performance.memory.usedJSHeapSize`, quand le navigateur le
 *     donne (Chrome le donne, Safari non).
 *
 * ⚠️ AUCUN ÉTAT REACT NULLE PART : un tableau de module, des abonnés
 * qui sont des fonctions. Un enregistrement ne provoque aucun rendu —
 * la sonde ne peut donc pas déranger ce qu'elle observe, ce qui serait
 * le plus sûr moyen de faire disparaître le défaut au moment de le
 * mesurer.
 *
 * ⚠️ TEMPORAIRE. Pour la retirer : ce fichier, src/components/
 * SondeCartes.tsx, la ligne `<SondeCartes />` du layout, et les deux
 * appels d'IndexTatoueurs.
 */

export type Ligne = { t: number; texte: string };

const LIGNES_GARDEES = 400;
const CLE_JOURNAL = "yokofolio:sonde-cartes:journal";
const CLE_ARMEE = "yokofolio:sonde-cartes";

const journal: Ligne[] = [];
const abonnes = new Set<() => void>();
let depart = 0;
let armeeConnue: boolean | null = null;
let relu = false;
let sauvegardeEnAttente = 0;

/** La sonde est-elle demandée ? Lue UNE FOIS, gardée ensuite — dans
    l'adresse, ou dans la mémoire de l'onglet (le paramètre disparaît
    dès qu'on ouvre une fiche). */
export function sondeCartesArmee(): boolean {
  if (armeeConnue !== null) return armeeConnue;
  if (typeof window === "undefined") return false;
  const demandee =
    new URLSearchParams(window.location.search).get("sonde-cartes") === "1";
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

export function sauvegarderMaintenant(): void {
  try {
    sessionStorage.setItem(CLE_JOURNAL, JSON.stringify(journal));
  } catch {
    // quota ou navigation privée : le journal reste en mémoire
  }
}

export function noter(texte: string): void {
  if (!sondeCartesArmee()) return;
  relireLaSauvegarde();
  const maintenant = performance.now();
  if (depart === 0) depart = maintenant;
  journal.push({ t: Math.round(maintenant - depart), texte });
  if (journal.length > LIGNES_GARDEES) journal.splice(0, 40);
  sauvegarderBientot();
  for (const rappel of abonnes) rappel();
}

export function lignesDuJournal(): Ligne[] {
  if (sondeCartesArmee()) relireLaSauvegarde();
  return journal;
}

export function souscrireAuJournal(rappel: () => void): () => void {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

/* ==================================================================
 * LES OBSERVATEURS VIVANTS — le compteur qui doit rester BORNÉ
 * ==================================================================
 * « À 100 cartes, le nombre d'observateurs vivants doit être borné,
 * pas proportionnel au nombre de cartes. » Ce compteur est donc la
 * mesure qui juge la nº 224-§4 : chaque `IntersectionObserver` du
 * chemin de la mosaïque s'annonce ici en naissant et en mourant.
 */
let observateurs = 0;

export function observateurNe(): void {
  observateurs += 1;
}

export function observateurMort(): void {
  observateurs = Math.max(0, observateurs - 1);
}

export function observateursVivants(): number {
  return observateurs;
}

/* ==================================================================
 * LE RELEVÉ D'UN « VOIR PLUS »
 * ================================================================== */

/** Ce que le document pèse, à l'instant. Aucune de ces mesures ne
    modifie quoi que ce soit — elles ne font que compter. */
export function mesureDuDocument(): string {
  const cartes = document.querySelectorAll("[data-carte]").length;
  const noeuds = document.getElementsByTagName("*").length;
  //  UNE IMAGE « RÉELLE » : celle qui porte une vraie source, pas le
  //  substitut transparent posé aux cartes très lointaines.
  const images = [...document.querySelectorAll("img")].filter((image) => {
    const source = image.getAttribute("src") ?? "";
    return source !== "" && !source.startsWith("data:image/gif");
  }).length;
  const memoire = (
    performance as unknown as { memory?: { usedJSHeapSize?: number } }
  ).memory?.usedJSHeapSize;
  return (
    `cartes ${cartes} · nœuds ${noeuds} · images avec src ${images} · ` +
    `observateurs ${observateursVivants()}` +
    (memoire ? ` · mémoire ${Math.round(memoire / 1048576)} Mo` : "")
  );
}

/** La position notée à l'ouverture du relevé — comparée deux fois. */
let defilementAvant = 0;

/** AVANT le clic : on note d'où l'on part. */
export function ouvrirReleveCartes(): void {
  if (!sondeCartesArmee()) return;
  defilementAvant = Math.round(window.scrollY);
  noter(`▶ VOIR PLUS · scrollY avant ${defilementAvant} · ${mesureDuDocument()}`);
}

/** APRÈS le rendu des nouvelles cartes, puis une seconde plus tard —
    le temps que les images se posent. */
export function fermerReleveCartes(): void {
  if (!sondeCartesArmee()) return;
  const apres = Math.round(window.scrollY);
  noter(
    `■ RENDU · scrollY après ${apres} · écart ${apres - defilementAvant} · ` +
      mesureDuDocument()
  );
  window.setTimeout(() => {
    const tardif = Math.round(window.scrollY);
    noter(
      `■ +1 s · scrollY ${tardif} · écart ${tardif - defilementAvant} · ` +
        mesureDuDocument()
    );
  }, 1000);
}
