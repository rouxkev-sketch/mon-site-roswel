/**
 * ██ LA MESURE DE LA PHOTO DE TÊTE D'UNE FICHE — L'ÉCRITURE UNIQUE ██
 * ==================================================================
 * (extraite de FicheTatoueur à la nº 776, mot pour mot — voir la
 * raison en bas de note ; l'histoire ci-dessous est celle des passes
 * qui l'ont écrite, conservée avec le code qu'elle explique.)
 *
 * §3 (nº 290) — LA PHOTO ÉPOUSE LA HAUTEUR VISIBLE : ON LA MESURE,
 * ON NE LA DEVINE PLUS.
 * CE QUI ÉTAIT ÉCRIT : `calc((100vh − 119px) × 0,8)`. Ces 119 px
 * étaient une SOMME DEVINÉE — 79 de barre fixe, 20 de marge en haut,
 * 20 en bas. Deux choses la rendent fausse : la barre ne mesure pas
 * 79 px (relevé : 76), et surtout, en APERÇU (« Mon portfolio » du
 * menu Mon compte), la fiche est posée DANS l'espace tatoueur, qui a
 * son propre bandeau au-dessus : la photo commence bien plus bas, la
 * constante réserve bien trop peu — le cadre s'élargissait et
 * débordait par le bas. LA VOIE PRISE : MESURER CE QUI ENTOURE
 * VRAIMENT LA PHOTO — pas une nouvelle constante, aucune. Deux
 * nombres, tous deux lus :
 *   · LE HAUT — la position du haut de la photo dans le document.
 *     Elle contient TOUT ce qui vit au-dessus (barre, bandeau de
 *     l'espace, marge du haut, et la barre passée en DEUX rangées
 *     d'une fenêtre étroite), quel qu'il soit ;
 *   · LE BAS — la marge du bas, DÉJÀ ÉCRITE sur la racine de la
 *     fiche (`[data-racine-fiche]`, `lg:pb-5`) : on la LIT sur
 *     l'élément, on ne la réécrit pas.
 * La hauteur libre est la différence, la largeur en découle (× 0,8,
 * le format 4:5). Le repli `100vh − 119px` de la feuille de style ne
 * sert plus qu'au tout premier rendu, avant cette mesure.
 * ⚠️ AUCUNE BOUCLE POSSIBLE : le haut de la photo ne dépend pas de sa
 * propre taille. On n'observe jamais la photo elle-même — seulement
 * la fenêtre et la barre fixe, dont la hauteur ne dépend pas d'elle.
 *
 * §1 (nº 293) — LA LARGEUR TOMBE SUR UN MULTIPLE DE 4, ET CE NOMBRE
 * EST DÉDUIT, PAS CHOISI À L'ŒIL. Ce qui échappait à l'arrondi :
 * l'ENVELOPPE — `round(down,100%,1px)` (nº 280) est écrit sur le
 * cadre et sur lui seul ; l'enveloppe prenait `libre × 0,8` tel quel
 * (565,594 px au relevé du propriétaire) : le cadre tombait à 565 et
 * il restait 0,594 px de fond à sa droite, sur toute la hauteur. Et
 * la hauteur n'était pas entière non plus (565 × 1,25 = 706,25 — le
 * liseré du haut et du bas, un demi-pixel à densité 2). Le format
 * étant 4/5, la hauteur vaut largeur × 1,25 : une largeur MULTIPLE
 * DE 4 donne une hauteur ENTIÈRE (4k × 1,25 = 5k) — l'enveloppe, le
 * cadre, chaque colonne et les positions d'arrêt du défilement
 * tombent juste ENSEMBLE. Ce que ça coûte : jusqu'à 3 px, rendus à
 * la marge du bas — toujours du bon côté, jamais un débordement.
 * ⚠️ LE DOIGT N'EST PAS CONCERNÉ : la règle qui lit la variable est
 * sous `not-mobile:` (nº 616) — au doigt la photo est bord à bord.
 *
 * ██ §2 (nº 776) — POURQUOI C'EST UNE LIB, DÉSORMAIS ██
 * ------------------------------------------------------------------
 * La silhouette d'attente de la fiche (SqueletteFiche) doit dessiner
 * LA MÊME largeur que la page qui vient — y compris quand la barre
 * passe en deux rangées (fenêtre étroite) ou qu'un bandeau d'espace
 * vit au-dessus : le repli CSS seul ne les connaît pas (mesuré au
 * banc nº 776 : 25 px d'écart à 900 px de fenêtre). La mesure est
 * donc EXTRAITE ICI, au caractère près, et consommée par les deux —
 * la page ET sa silhouette. Deux copies auraient divergé (piège
 * nº 378).
 */

/** Mesure la hauteur libre autour de `zone` (le cadre de la photo de
    tête) et pose sur elle `--photo-hauteur-libre` et
    `--photo-largeur` — la variable que la classe de largeur lit
    (LARGEUR_PHOTO_FICHE, config/tatouage). Rend le nettoyage. */
export function observerLargeurPhotoFiche(zone: HTMLElement): () => void {
  const racine = zone.closest("[data-racine-fiche]");
  let posee = -1;
  const mesurer = () => {
    if (!zone.isConnected) return;
    //  LA POSITION AU REPOS : `rect.top` seul suivrait le
    //  défilement ; la somme avec le défilement courant, non.
    const haut =
      zone.getBoundingClientRect().top +
      (document.scrollingElement?.scrollTop ?? 0);
    const basEcrit = racine
      ? parseFloat(getComputedStyle(racine).paddingBottom) || 0
      : 0;
    const libre = window.innerHeight - haut - basEcrit;
    //  Une fenêtre plus courte que ce qui surmonte la photo : on ne
    //  pose rien, l'ancien calcul reste — jamais de largeur nulle.
    if (!(libre > 0)) return;
    if (Math.abs(libre - posee) < 0.5) return;
    posee = libre;
    zone.style.setProperty("--photo-hauteur-libre", `${libre}px`);
    zone.style.setProperty(
      "--photo-largeur",
      `${Math.floor((libre * 0.8) / 4) * 4}px`
    );
  };
  mesurer();
  //  UNE SECONDE MESURE À LA TRAME SUIVANTE : la première tombe
  //  parfois avant que les polices ne soient posées, et la barre
  //  fixe change alors de hauteur d'un cheveu.
  const trame = requestAnimationFrame(mesurer);
  window.addEventListener("resize", mesurer);
  //  LA BARRE FIXE peut changer de hauteur sans que la fenêtre
  //  bouge : on la regarde, ELLE — jamais la photo, ni aucun de ses
  //  parents (leur hauteur dépend de la sienne : ce serait une
  //  boucle).
  const barre = document.querySelector("header");
  const observateur = new ResizeObserver(mesurer);
  if (barre) observateur.observe(barre);
  return () => {
    cancelAnimationFrame(trame);
    window.removeEventListener("resize", mesurer);
    observateur.disconnect();
  };
}
