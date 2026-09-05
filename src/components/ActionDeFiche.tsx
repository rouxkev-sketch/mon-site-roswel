"use client";

import type { MouseEvent, ReactNode, Ref } from "react";
import { CORPS_BADGE } from "@/config/tatouage";

/**
 * UN BADGE D'ACTION D'UN PROFIL (nº 869, REFAIT PAR LA nº 870-§4)
 * ==================================================================
 * ⛔ CE QUE LA nº 869 AVAIT FAIT, ET QUE LE PROPRIÉTAIRE ANNULE : une
 * grande icône dans une CIBLE CARRÉE de 48 px, le mot centré DESSOUS,
 * quatre colonnes égales — le patron d'une fiche Google Maps. Les
 * carrés disparaissent.
 *
 * CE QUE C'EST DEVENU : UN BADGE à angles arrondis, l'icône À GAUCHE
 * du mot, sur une seule ligne. La rangée en aligne trois (ContenuFiche) :
 *  · « Follow » / « Following » et « Instagram », de MÊME LARGEUR —
 *    c'est `large`, qui donne à chacun une part égale de ce qui reste
 *    (`flex-1`, une part de la rangée, jamais une largeur écrite) ;
 *  · LE PARTAGE, petit et carré, ICÔNE SEULE, qui complète la largeur.
 * Les trois ont la MÊME HAUTEUR, et c'est cette écriture-ci qui la
 * porte : elle ne peut donc pas diverger d'un badge à l'autre (piège
 * nº 378).
 *
 * DEUX ROBES, ET DEUX SEULEMENT (§5, nº 871) :
 *  · L'APLAT D'ACTION, celle des trois badges — `sombre-carte-clair`
 *    (#20262D, le barreau de la nº 848) SANS CONTOUR, « ce qui agit se
 *    remplit » (nº 852-§6, nº 853-§3), et le texte clair de la charte ;
 *  · LE BLANC (`blanche`) — `sombre-texte` en aplat et le FOND DE PAGE
 *    en texte : la robe de « Suivre » de la nº 528, que le propriétaire
 *    rend à ce bouton tant qu'on ne suit pas. C'est le seul appel à
 *    l'action d'un profil ; « Following », lui, garde l'aplat gris.
 * Les deux partagent tout le reste : `CORPS_BADGE` pour le corps et la
 * graisse (config/tatouage — la couleur, elle, vit dans la robe, sans
 * quoi deux classes se disputeraient la même propriété, piège nº 389),
 * et la descente d'un dixième d'opacité au survol comme à l'appui.
 * ⚠️ CE QU'ELLES NE REPRENNENT PAS, ET POURQUOI : `AIR_BADGE` porte la
 * hauteur d'un badge de TYPE — trente pixels, une étiquette qu'on lit.
 * Ces trois-ci sont les actions principales d'un profil, on les TOUCHE :
 * ils prennent QUARANTE pixels (nº 871-§4 — quarante-quatre à la
 * nº 870, un cran rendu par le propriétaire), et le partage reste carré
 * à la même mesure.
 *
 * DEUX NATURES POUR UN MÊME DESSIN : un LIEN quand il y a une adresse
 * (Instagram — il sort du site, dans un nouvel onglet), un BOUTON sinon
 * (Follow, Share). Le contenu est calculé une fois et porté par l'un
 * comme par l'autre.
 *
 * `muet` : l'icône et le mot se taisent — invisibles, la boîte gardée —
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
  large = false,
  blanche = false,
  muet = false,
  ref,
}: {
  /** Le nom de l'action, posé en `data-action-fiche` : c'est ce que
      les bancs lisent, jamais le mot à l'écran. */
  cle: string;
  /** Le mot, à droite de l'icône. Absent : le badge est l'icône seule
      (le partage) et devient carré. */
  mot?: ReactNode;
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
  /** Il prend une part égale de la rangée (Follow, Instagram). Sans
      cela, le badge garde sa largeur carrée (le partage). */
  large?: boolean;
  /** §5 (nº 871) — LA ROBE BLANCHE de la nº 528, l'appel à l'action :
      « Follow » la porte tant qu'on ne suit pas, et lui seul. */
  blanche?: boolean;
  muet?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  /*  L'écriture est commune aux deux natures : calculée une fois, portée
      par le bouton comme par le lien.
      ⚠️ UNE SEULE CLASSE PAR PROPRIÉTÉ (piège nº 389), et DEUX TERNAIRES
      pour cela : la part de rangée et la largeur carrée s'excluent (le
      `shrink-0` ne vit que du côté qui ne doit pas maigrir), et les deux
      robes ne posent chacune qu'un fond et qu'une couleur de texte —
      jamais deux classes empilées sur la même propriété. */
  const ecriture = `inline-flex min-h-[40px] items-center justify-center gap-2
                    rounded-lg whitespace-nowrap ${CORPS_BADGE}
                    transition-opacity
                    hover:opacity-90 active:opacity-90
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-primaire ${
                      blanche
                        ? "bg-sombre-texte text-sombre-fond"
                        : "bg-sombre-carte-clair text-sombre-texte"
                    } ${large ? "min-w-0 flex-1 px-3.5" : "w-10 shrink-0"}`;
  const contenu = (
    <>
      <span aria-hidden="true" className={`flex${muet ? " invisible" : ""}`}>
        {icone}
      </span>
      {mot !== undefined && (
        <span className={`min-w-0 truncate${muet ? " invisible" : ""}`}>
          {mot}
        </span>
      )}
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
