"use client";

/**
 * L'ENCADRÉ DE LA BARRE — DEUX CHAMPS, UN SEUL BLOC
 * ==================================================================
 * (extrait du moteur à la passe nº 245-§1)
 *
 * POURQUOI IL EXISTE. Le moteur avait cet encadré écrit chez lui ; la
 * page « Ma sélection » en veut EXACTEMENT le même pour ses deux
 * menus. Le recopier, c'était accepter qu'ils divergent à la passe
 * suivante — le défaut qui a coûté trois passes sur le verre et trois
 * surfaces oubliées à la nº 238. Il est donc EXTRAIT, à l'identique :
 * les deux endroits consomment cette écriture-ci, et il n'en existe
 * pas d'autre.
 *
 * CE QU'IL EST, ET RIEN DE PLUS (nº 139, nº 150-§2, nº 174-§1) :
 *  · AUCUN contour, AUCUN halo — le champ se dit par son FOND, et le
 *    focus l'éclaircit d'un cran (`:focus-within`, règle
 *    `[data-clair-barre]` de globals.css, réglable par `?clair=`) ;
 *  · un FIN TRAIT VERTICAL entre les deux moitiés : ce n'est pas un
 *    contour, c'est la ligne qui sépare deux champs d'un même
 *    encadré — la parente de celle des sélecteurs ;
 *  · deux moitiés de largeur égale (`basis-1/2`), chacune libre de
 *    rétrécir (`min-w-0`).
 */
export function EncadreDeuxChamps({
  gauche,
  droite,
  porteBadge = false,
}: {
  gauche: React.ReactNode;
  droite: React.ReactNode;
  /** §1 (nº 256) — L'ENCADRÉ QUI PORTE UN BADGE, pas deux champs :
      celui de « Ma sélection », dont la moitié gauche était le badge
      ovale qui glissait. Trois écarts, et rien
      d'autre :
       · CAPSULE (`rounded-full`, rayon à la moitié de la hauteur) au
         lieu des angles arrondis : l'encadré épouse la forme du badge
         qu'il contient — sur web comme au doigt ;
       · le badge garde SA MOITIÉ DE CONTENU (`basis-1/2` en
         `box-content` : la moitié se mesure sur le badge lui-même,
         l'air s'AJOUTE autour au lieu de le rétrécir — ses mots et sa
         glissade ne changent pas d'un pixel) ;
       · L'AIR : 4 px à gauche (`pl-1` — l'air même que le haut et le
         bas du badge, 44 dans 52) pour que la pilule ne touche pas la
         courbe de la capsule, et 12 px à droite (`pr-3`) avant le fin
         trait. C'est le CHAMP qui cède cet air, jamais le badge.
      Le moteur ne passe pas ce drapeau : son encadré à deux champs ne
      change pas d'un jeton. */
  porteBadge?: boolean;
}) {
  return (
    <div
      data-encadre-barre=""
      /*  §2 (nº 260) — L'ENCADRÉ QUI PORTE UN BADGE NE S'ÉCLAIRCIT PAS.
          La mécanique de focus gravée à la nº 175 (`data-clair-barre`)
          est faite pour un champ dans lequel on ÉCRIT : le fond monte
          d'un cran pour dire « c'est ici que tu tapes ». Or on n'écrit
          nulle part dans ce bloc — le badge change le contenu de la
          page, le champ ouvre un menu. L'éclaircissement annonçait donc
          quelque chose qui n'arrive pas, et fabriquait une TROISIÈME
          teinte : trois couleurs pour deux états. Cet encadré-ci prend
          donc `data-clair-fixe` — le MÊME fond, sans ses états (voir
          globals.css). Le champ du moteur, lui, garde le sien : on y
          tape vraiment, et la nº 175 ne bouge pas d'une ligne. */
      {...(porteBadge ? { "data-clair-fixe": "" } : { "data-clair-barre": "" })}
      /*  §3 (nº 449) — l'encadré du moteur descend de 16 à 12 px
          (`rounded-xl`) : le même rayon que les champs mobiles, un
          cran au-dessus des badges (8 px) — l'ensemble est homogène.
          L'encadré à badge de « Ma sélection » garde sa capsule : il
          épouse le badge ovale qui glisse (nº 256-§1). */
      className={`flex items-stretch overflow-visible transition-colors ${
        porteBadge ? "rounded-full" : "rounded-xl"
      }`}
    >
      <div
        className={
          porteBadge
            ? "shrink-0 grow-0 basis-1/2 box-content pl-1 pr-3 flex items-center"
            : "flex-1 min-w-0 basis-1/2"
        }
      >
        {gauche}
      </div>
      <div aria-hidden="true" className="w-px my-2.5 bg-sombre-bordure shrink-0" />
      <div className="flex-1 min-w-0 basis-1/2">{droite}</div>
    </div>
  );
}
