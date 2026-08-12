"use client";

import type { PointerEvent, ReactNode } from "react";

/**
 * LE BADGE DE LA CHARTE — UN SEUL, POUR TOUT LE SITE
 * ==================================================
 * (passe nº 174-§2)
 *
 * POURQUOI CE FICHIER EXISTE. Le panneau des filtres avait ses badges,
 * dessinés au fil de sept passes ; les pilules de rayon (« 100 km »),
 * elles, étaient restées à la version de la nº 139 — fond ROSE PLEIN
 * pour l'actif, aucun point, aucun des espacements de la charte. Deux
 * dessins pour une même chose, et rien qui les empêchait de diverger
 * un peu plus à chaque passe.
 *
 * DÉSORMAIS IL N'Y EN A QU'UN. Les filtres et le rayon appellent le
 * MÊME composant : ce qu'on corrige ici se voit partout, et une
 * divergence redevient impossible.
 *
 * CE QUE DIT UN BADGE, ET COMMENT (rien n'est inventé ici : ce sont
 * exactement les règles du panneau des filtres) :
 *  · un POINT à gauche — ROSE quand le badge est actif, GRIS quand il
 *    ne l'est pas. Il ne disparaît jamais : la géométrie ne bouge pas
 *    d'un pixel au clic (nº 157-§4) ;
 *  · AUCUN FOND ROSE TANT QUE LE BADGE EST POSÉ SUR UNE PAGE
 *    (nº 144-§7). ⚠️ SUR UNE PLAQUE DE VERRE, LA RÈGLE A ÉTÉ REVUE PAR
 *    LE PROPRIÉTAIRE (nº 238-§6) : le badge sélectionné y est du VERRE
 *    TEINTÉ ROSE (40 %), éteint du verre blanc (20 %) — le rose reste
 *    réservé à la sélection, ce que la charte demande. C'est le seul
 *    endroit où un badge porte du rose, et c'est un remplissage
 *    translucide, jamais un aplat ;
 *  · AUCUN contour ;
 *  · un badge AU REPOS SE VOIT : son fond est un cran plus clair que
 *    ce qui le porte (nº 155) ;
 *  · la capsule fait 38 px de haut, la ZONE TACTILE 44 (l'ourlet
 *    invisible `before:`, nº 155-§2A).
 */

/**
 * Les deux robes, selon ce qui porte le badge.
 * `surPanneau` : posé sur le panneau web éclairci (nº 144-§3), tout
 * grimpe d'un cran pour garder le même contraste.
 *
 * ⚠️ EXPORTÉE DEPUIS LA Nº 197 : le sélecteur « Profil / Portfolio » de
 * l'affiche prend la FORME du sélecteur du formulaire (deux rectangles)
 * mais les COULEURS du badge de filtre. Il appelle donc cette
 * fonction-ci — les quatre couleurs (fond et texte, actif et inactif)
 * restent écrites À UN SEUL ENDROIT, celui-ci. Aucune valeur n'est
 * recopiée nulle part.
 */
export function robeDuBadge(actif: boolean, surPanneau = false): string {
  //  ⚠️ `surPanneau` VEUT DIRE « POSÉ SUR UNE PLAQUE DE VERRE »
  //  (nº 238-§6). Les deux seuls appelants qui le passent — le panneau
  //  des filtres du web et le pied « Rayon » du menu de localité —
  //  sont depuis la nº 236 des surfaces de verre. Un aplat opaque y
  //  faisait une boîte posée sur la plaque : le badge devient donc du
  //  VERRE lui aussi, blanc translucide éteint, ROSE translucide
  //  sélectionné (le rose reste réservé à la sélection, charte).
  //  Le REMPLISSAGE vient de `data-verre-capsule` / `data-verre-action`
  //  (voir BadgeCharte) : ici, il ne reste que la couleur du texte.
  //  ⚠️ AUCUN FILTRE PROPRE sur ces capsules — c'est le flou de la
  //  plaque qu'on voit à travers ; un second flou aplatirait tout
  //  (piège payé à la nº 233-§4).
  if (surPanneau) return actif ? "text-white" : "text-sombre-texte";
  //  Hors verre (la page mobile des filtres, le sélecteur de l'affiche
  //  nº 197) : les aplats d'origine, inchangés.
  return actif
    ? "bg-sombre-eleve-clair text-sombre-texte"
    : "bg-sombre-eleve/70 text-sombre-texte-doux hover:bg-sombre-eleve";
}

export function BadgeCharte({
  actif,
  surPanneau = false,
  onClick,
  onPointerDown,
  children,
}: {
  actif: boolean;
  surPanneau?: boolean;
  onClick?: () => void;
  /** Le rayon s'en sert : `preventDefault` garde le focus au champ,
      donc le panneau ouvert — on ajuste plusieurs fois de suite. */
  onPointerDown?: (evenement: PointerEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      onPointerDown={onPointerDown}
      //  LE REMPLISSAGE DE VERRE (nº 238-§6) — les deux mêmes
      //  marqueurs que les capsules de la fenêtre d'adresse (nº 233),
      //  donc les mêmes valeurs, écrites à un seul endroit :
      //  blanc à 20 % éteint, rose à 40 % sélectionné, et AUCUN filtre
      //  d'arrière-plan propre.
      {...(surPanneau
        ? actif
          ? { "data-verre-action": "" }
          : { "data-verre-capsule": "" }
        : {})}
      //  ⚠️ LA LARGEUR NE BOUGE JAMAIS (nº 153-§1) : l'espace du POINT
      //  est réservé EN PERMANENCE, actif ou non — la mise en page est
      //  juste dès l'ouverture, rien ne bouge au clic.
      className={`relative inline-flex items-center justify-center
                 rounded-full pl-[22px] pr-4 min-h-[38px] text-[13.5px]
                 font-semibold transition-colors
                 before:absolute before:-inset-y-[3px] before:inset-x-0
                 before:content-[''] ${robeDuBadge(actif, surPanneau)}`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-[10px] top-1/2 h-1.5 w-1.5
                   -translate-y-1/2 rounded-full ${
                     actif ? "bg-primaire" : "bg-sombre-texte-doux"
                   }`}
      />
      {children}
    </button>
  );
}

/**
 * UN GROUPE DE BADGES — le titre, puis les capsules en drapeau.
 * ⚠️ C'EST LUI QUI TIENT LES ESPACEMENTS, et c'est pour cela qu'il est
 * partagé : l'écart entre le titre et la première rangée (10 px) est le
 * même pour ARTISTE et pour le rayon, par construction — plus par
 * recopie.
 * ⚠️ PAS DE `<fieldset>` NI DE `<legend>` (nº 169-§1) : leur rendu natif
 * réserve une boîte fantôme de la hauteur de la légende sur WebKit. Un
 * groupe est une boîte ordinaire ; `role="group"` et `aria-labelledby`
 * disent au lecteur d'écran ce que disaient fieldset et legend.
 */
export function GroupeBadges({
  titre,
  idTitre,
  children,
}: {
  titre: ReactNode;
  idTitre: string;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={idTitre} data-groupe-filtres="">
      <p
        id={idTitre}
        className="text-[12px] font-semibold uppercase tracking-wide text-sombre-texte-doux"
      >
        {titre}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
