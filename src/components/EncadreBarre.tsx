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
}: {
  gauche: React.ReactNode;
  droite: React.ReactNode;
}) {
  return (
    <div
      data-encadre-barre=""
      data-clair-barre=""
      className="flex items-stretch rounded-2xl overflow-visible transition-colors"
    >
      <div className="flex-1 min-w-0 basis-1/2">{gauche}</div>
      <div aria-hidden="true" className="w-px my-2.5 bg-sombre-bordure shrink-0" />
      <div className="flex-1 min-w-0 basis-1/2">{droite}</div>
    </div>
  );
}
