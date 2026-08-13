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
      celui de « Ma sélection », dont la moitié gauche est le badge
      ovale qui glisse (SelecteurCapsule). Trois écarts, et rien
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
      data-clair-barre=""
      className={`flex items-stretch overflow-visible transition-colors ${
        porteBadge ? "rounded-full" : "rounded-2xl"
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
