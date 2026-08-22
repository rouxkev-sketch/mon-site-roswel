/**
 * LA MÉMOIRE DES GALERIES QUI DÉFILENT — §4 (nº 459)
 * ==================================================================
 * LE DÉFAUT QU'ELLE FERME : profil → Portfolio → on fait DÉFILER une
 * galerie → on ouvre une image (la vue photo, nº 455 : une vraie
 * navigation du routeur) → retour. La page profil est REMONTÉE de
 * zéro : chaque rangée défilante renaît à `scrollLeft = 0` — la
 * mémoire de navigation restitue le défilement de la PAGE, jamais
 * celui des conteneurs internes, et rien d'autre ne s'en souvenait.
 *
 * LE MÉCANISME, et c'est la leçon nº 430 : une MÉMOIRE DE MODULE —
 * elle survit aux démontages et remontages des composants, meurt avec
 * l'onglet, et ne touche ni l'adresse ni l'historique (règle 332-§1 :
 * un défilement interne n'est pas un état d'adresse — le même choix
 * que la position de page, portée par la mémoire de navigation).
 *
 * QUI ÉCRIT, QUI LIT :
 *  · chaque galerie NOTE sa position en partant (au démontage — le
 *    nœud est encore là quand le nettoyage d'effet s'exécute) ;
 *  · au remontage, elle REPOSE la valeur AVANT LA PEINTURE
 *    (useLayoutEffect) : aucun éclair de première case, aucun
 *    défilement animé — une pose PROGRAMMÉE et instantanée, que
 *    personne ne peut prendre pour un geste (le seul écouteur de ces
 *    rangées est l'état de leurs chevrons, qui doit justement suivre).
 *
 * LA CLÉ : `slug|nature|style|rendu` — l'identité d'une galerie, une
 * entrée par galerie de la fiche. ET LA MORT PROPRE : au montage du
 * panneau d'une fiche, `oublierLesAutresGaleries(slug)` purge les
 * entrées des AUTRES fiches — aucune position fantôme ne voyage d'un
 * profil à l'autre, et la mémoire ne grossit jamais au-delà d'une
 * fiche.
 */

const positions = new Map<string, number>();

/** La clé d'une galerie : la fiche, puis l'identité de la série. */
export function cleDeGalerie(
  slug: string,
  nature: string,
  style: string,
  rendu: string
): string {
  return `${slug}|${nature}|${style}|${rendu}`;
}

/** Noter la position d'une galerie (appelé au démontage). */
export function retenirDefilementGalerie(cle: string, gauche: number): void {
  positions.set(cle, gauche);
}

/** La position retenue, s'il y en a une. */
export function defilementGalerieRetenu(cle: string): number | undefined {
  return positions.get(cle);
}

/** §4 (nº 462) — LE PRÉFIXE RÉSERVÉ DE « MA SÉLECTION » : les bandes
    des suivis (BlocSuivis) mémorisent leur défilement sous ce
    préfixe. Il est ÉPARGNÉ par la purge des fiches ci-dessous — sans
    quoi ouvrir le portfolio d'une fiche effacerait la position des
    galeries de la page qu'on vient de quitter, et le retour la
    perdrait. Ces entrées meurent avec l'onglet, comme la page. */
export const PREFIXE_SELECTION = "selection";

/** La purge d'arrivée : seules les galeries de LA fiche montrée
    gardent leur position — les autres FICHES meurent ici. Les entrées
    de « Ma sélection » (préfixe réservé) survivent : elles
    n'appartiennent à aucune fiche. */
export function oublierLesAutresGaleries(slug: string): void {
  const prefixe = `${slug}|`;
  const epargne = `${PREFIXE_SELECTION}|`;
  for (const cle of positions.keys()) {
    if (cle.startsWith(epargne)) continue;
    if (!cle.startsWith(prefixe)) positions.delete(cle);
  }
}
