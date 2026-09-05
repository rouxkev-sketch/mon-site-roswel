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

/*  ⛔ §1 (nº 866 → nº 873) — « LA PHOTO REGARDÉE DANS LA CARTE D'UNE
    GALERIE » N'EXISTE PLUS. Le fil de galeries notait le rang de la
    photo regardée pour que la bande du profil se pose « sur la bonne
    photo » au retour. Il n'y a plus de bande au doigt : les pages
    Portfolio et Flash SONT le fil (nº 873-§3), et une bande du web ne
    mène à aucun fil. Le rang n'avait plus ni écrivain ni lecteur — les
    deux fonctions et leur carte sont partis, code compris (nº 735). La
    position en pixels (nº 459, ci-dessus) reste, elle sert encore. */

/** §4 (nº 462) — LE PRÉFIXE RÉSERVÉ DE « MA SÉLECTION » : les bandes
    des suivis (BlocSuivis) mémorisent leur défilement sous ce
    préfixe. Il est ÉPARGNÉ par la purge des fiches ci-dessous — sans
    quoi ouvrir le portfolio d'une fiche effacerait la position des
    galeries de la page qu'on vient de quitter, et le retour la
    perdrait. Ces entrées meurent avec l'onglet, comme la page. */
export const PREFIXE_SELECTION = "selection";

/**
 * ██ §1 (nº 604) — LE CARROUSEL DE L'AFFICHE ENTRE DANS CETTE MÉMOIRE ██
 * ==================================================================
 * LE DÉFAUT QU'IL FERME, et c'est le JUMEAU EXACT de celui de la
 * nº 459 : au doigt, on ouvre une fiche, on fait défiler le carrousel
 * du haut jusqu'à la cinquième photo, on touche la rangée du profil
 * (une vraie navigation, `?entree=lien`), on revient — et le carrousel
 * est retombé sur la photo que porte l'adresse, c'est-à-dire la
 * première. La fiche entière a été remontée à neuf : la clé de
 * `FicheSelonLAdresse` contient `entree`, donc React jette l'ancienne
 * et en fabrique une autre, dont l'indice repart de l'adresse.
 * Ce n'est pas une régression : jusqu'à la nº 453, le profil vivait
 * SOUS la photo, sur la même page — y aller était un défilement, pas
 * une navigation, et rien n'était démonté. Le geste a changé de
 * nature, la mémoire qui allait avec n'a jamais été écrite.
 *
 * ⚠️ ON NE RANGE PAS LA MÊME CHOSE QUE LES GALERIES : celles-ci
 * retiennent un `scrollLeft` en pixels, celui-ci retient un INDICE de
 * photo (0..n−1). D'où le préfixe réservé — deux sémantiques, deux
 * espaces de clés, une seule table et un seul cycle de vie.
 *
 * LA CLÉ EST L'ADRESSE COMPLÈTE DE LA FICHE — le même assemblage que
 * la clé de remontage (slug, style, rendu, catégorie, photo, entrée,
 * studio). C'est ce qui départage, TOUT SEUL et sans détecteur de
 * retour, les deux cas que le propriétaire a tranchés :
 *  · RETOUR (bouton du navigateur, glissement du doigt) — le
 *    navigateur rejoue l'adresse à l'identique, la mémoire répond ;
 *  · NOUVELLE VISITE par un lien — l'adresse diffère (un lien interne
 *    porte `entree=lien`, une carte porte ses tags et sa photo), aucune
 *    entrée ne correspond, et le carrousel repart de l'adresse.
 * ⚠️ LE CAS RÉSIDUEL, DIT POUR QU'ON NE LE DÉCOUVRE PAS PLUS TARD :
 * rouvrir EXACTEMENT la même carte, avec les mêmes tags, après être
 * revenu à la mosaïque, rend une adresse identique — la mémoire
 * s'applique alors qu'il s'agit d'une nouvelle visite. Distinguer ce
 * cas demanderait de savoir si le montage suit un pas en avant ou un
 * retour, c'est-à-dire de toucher la mécanique d'historique : le
 * propriétaire n'a pas demandé ce chantier.
 */
export const PREFIXE_CARROUSEL_FICHE = "carrousel-fiche";

/** La clé du carrousel d'une fiche : son adresse complète, préfixée. */
export function cleDuCarrouselDeFiche(adresse: string): string {
  return `${PREFIXE_CARROUSEL_FICHE}|${adresse}`;
}

/** Noter la photo regardée (appelé à chaque changement d'indice). */
export function retenirPhotoDuCarrousel(cle: string, indice: number): void {
  positions.set(cle, indice);
}

/** La photo retenue, s'il y en a une. */
export function photoDuCarrouselRetenue(cle: string): number | undefined {
  return positions.get(cle);
}

/** La purge d'arrivée : seules les galeries de LA fiche montrée
    gardent leur position — les autres FICHES meurent ici. Les entrées
    de « Ma sélection » (préfixe réservé) survivent : elles
    n'appartiennent à aucune fiche.
    ⚠️ §1 (nº 604) — LES CARROUSELS D'AFFICHE SONT ÉPARGNÉS EUX AUSSI,
    et c'est vital : cette purge tourne au montage du panneau
    Portfolio, c'est-à-dire À L'INSTANT MÊME du geste qu'on veut
    couvrir (on touche la rangée du profil, le Portfolio se monte). Sans
    cette exception, la position serait effacée juste avant qu'on ait
    besoin de la relire. Comme celles de « Ma sélection », ces entrées
    meurent avec l'onglet — un rechargement repart de zéro. */
export function oublierLesAutresGaleries(slug: string): void {
  const prefixe = `${slug}|`;
  const epargnes = [`${PREFIXE_SELECTION}|`, `${PREFIXE_CARROUSEL_FICHE}|`];
  for (const cle of positions.keys()) {
    if (epargnes.some((epargne) => cle.startsWith(epargne))) continue;
    if (!cle.startsWith(prefixe)) positions.delete(cle);
  }
}
