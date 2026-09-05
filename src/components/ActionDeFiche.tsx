"use client";

import type { MouseEvent, ReactNode, Ref } from "react";

/**
 * LA CIBLE D'ACTION D'UN PROFIL (nº 869-§3) — le patron Google Maps
 * ==================================================================
 * UNE GRANDE ICÔNE dans une CIBLE CARRÉE À COINS ARRONDIS, et LE MOT
 * CENTRÉ DESSOUS. C'est l'écriture UNIQUE des quatre actions de la
 * rangée d'un profil — « Follow » (BoutonSuivre), « Instagram » et
 * « Website » (ContenuFiche), « Share » (BoutonPartageFiche) : aucune
 * des quatre ne redessine le carré ni le mot (piège nº 378). La
 * RANGÉE elle-même (les colonnes égales) vit chez ContenuFiche, qui
 * est le seul à savoir combien d'actions une fiche possède.
 *
 * LA BOÎTE : la cible fait 48 px de côté — la mesure tactile des
 * boutons de barre —, un rayon de 12 px, l'icône de 24 dedans. LE MOT,
 * 13 px demi-gras dans le gris des sous-titres, 6 px sous le carré.
 * L'élément entier (carré ET mot) est la cible : on touche le mot
 * comme on touche l'icône, et la colonne entière répond au survol.
 *
 * DEUX ROBES, ET DEUX SEULEMENT :
 *  · AU REPOS — le contour fin des badges (le jeton `sombre-haut`,
 *    celui de ROBE_BADGE_CONTOUR) sur le fond du site ; c'est la robe
 *    des quatre actions, identiques entre elles comme sur le patron ;
 *  · REMPLIE (`rempli`) — l'état « fait » de Follow (« Following ») :
 *    le gris des plaques (`sombre-eleve`, nº 504), celui que le badge
 *    remplacé portait dans cet état. Le contour prend alors le jeton
 *    du fond, donc il ne se voit pas : c'est la mesure de la boîte,
 *    pas une décoration (règle nº 321).
 * LE SURVOL ET L'APPUI : le carré passe à `sombre-carte` — un cran
 * VERS LE HAUT pour la robe au repos (le fond du site qui monte, le
 * geste des plaques, nº 492), un cran VERS LE BAS pour la robe remplie
 * (s'enfoncer, c'est dire qu'on va défaire, nº 504) — et le mot passe
 * au blanc. Une seule couleur par propriété et par état, remplacée au
 * survol, jamais empilée (piège nº 389).
 *
 * DEUX NATURES POUR UN MÊME DESSIN : un LIEN quand il y a une adresse
 * (Instagram, Website — ils sortent du site, dans un nouvel onglet,
 * comme les liens qu'ils remplacent), un BOUTON sinon (Follow, Share).
 * Le contenu est calculé une fois et porté par l'un comme par l'autre.
 *
 * `muet` : l'icône et le mot se taisent — invisibles, boîtes gardées —
 * tant que l'appelant ne sait pas quoi dire, le temps que Follow
 * connaisse son état (nº 506). Rien ne saute quand le mot arrive : il
 * apparaît, il ne pousse rien.
 */
export function ActionDeFiche({
  cle,
  mot,
  icone,
  href,
  onClick,
  ariaLabel,
  ariaPressed,
  ariaHaspopup,
  sansCran = false,
  rempli = false,
  muet = false,
  ref,
}: {
  /** Le nom de l'action, posé en `data-action-fiche` : c'est ce que
      les bancs lisent, jamais le mot à l'écran. */
  cle: string;
  mot: ReactNode;
  icone: ReactNode;
  /** Une adresse : l'action est un lien, ouvert dans un nouvel onglet. */
  href?: string;
  onClick?: (evenement: MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  ariaPressed?: boolean;
  ariaHaspopup?: "dialog";
  /** nº 868-§1 — le geste ne navigue pas : le filet du retour
      (RetourGaranti) ne doit pas le lire. Follow le pose. */
  sansCran?: boolean;
  rempli?: boolean;
  muet?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  const ecriture =
    "group flex w-full min-w-0 flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire";
  const contenu = (
    <>
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sombre-texte transition-colors ${
          rempli
            ? "bg-sombre-eleve border-sombre-eleve group-hover:bg-sombre-carte group-hover:border-sombre-carte group-active:bg-sombre-carte group-active:border-sombre-carte"
            : "bg-transparent border-sombre-haut group-hover:bg-sombre-carte group-active:bg-sombre-carte"
        }`}
      >
        <span className={`flex${muet ? " invisible" : ""}`}>{icone}</span>
      </span>
      <span
        className={`max-w-full truncate text-[13px] leading-[18px] font-medium text-sombre-texte-doux transition-colors group-hover:text-sombre-texte group-active:text-sombre-texte${
          muet ? " invisible" : ""
        }`}
      >
        {mot}
      </span>
    </>
  );
  return href ? (
    <a
      data-action-fiche={cle}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={ecriture}
    >
      {contenu}
    </a>
  ) : (
    <button
      ref={ref}
      data-action-fiche={cle}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-haspopup={ariaHaspopup}
      {...(sansCran ? { "data-sans-cran": "" } : {})}
      className={ecriture}
    >
      {contenu}
    </button>
  );
}
