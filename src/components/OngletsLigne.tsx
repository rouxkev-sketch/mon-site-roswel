"use client";

/**
 * LES ONGLETS SOULIGNÉS — le sélecteur de la passe nº 112
 * ========================================================
 * Il REMPLACE le sélecteur à glissière (piste arrondie, fond rose
 * plein qui glissait d'un segment à l'autre) aux deux endroits où il
 * vivait : le choix Artiste · Studio · Salon du bloc 1, et le choix
 * Noir et gris · Couleur des galeries. La piste pleine était un objet
 * de plus à lire ; ici, il n'y a plus que LES MOTS.
 *
 * LA GRAMMAIRE :
 *  · les mots posés côte à côte, SANS piste ni fond — l'actif en
 *    BLANC, les autres en GRIS ;
 *  · dessous, une LIGNE FINE ET GRISE court sur TOUTE la largeur :
 *    c'est elle qui ancre les mots, sans elle ils flotteraient ;
 *  · sur le segment du mot actif, la ligne S'ÉPAISSIT et passe au
 *    ROSE — et elle GLISSE d'un segment à l'autre au changement, avec
 *    la même courbe que les feuilles d'iOS.
 *
 * RIEN N'EST CHOISI TANT QU'ON N'A PAS CHOISI : sans valeur active,
 * la ligne reste grise de bout en bout — aucun segment rose ne
 * préjuge d'une réponse (règle posée à la passe nº 104, conservée).
 *
 * L'ARIA NE CHANGE PAS d'un iota par rapport à la glissière :
 * `radiogroup` + `radio`/`aria-checked` — les mêmes lecteurs d'écran,
 * et les mêmes tests, y retrouvent exactement la même chose.
 */
import { TRAIT_SEPARATION_FOND } from "@/config/tatouage";

export function OngletsLigne({
  options,
  cleActive,
  surChoix,
  ariaLabel,
  fige = false,
  classeOnglet = "px-1 min-h-[46px]",
  avecLigneGrise = true,
  classeLigne = "",
}: {
  /** §1 (nº 460) — le label devient un NŒUD : le va-et-vient de « Ma
      sélection » y pose « Favoris 10 ⌄ » (mot + nombre + chevron).
      Tous les appelants à chaînes restent valides tels quels. */
  options: Array<{ cle: string; label: React.ReactNode }>;
  /** La clé de l'onglet actif — `null` tant que rien n'est choisi. */
  cleActive: string | null;
  surChoix: (cle: string) => void;
  ariaLabel: string;
  /** Choix verrouillé (bloc 1 confirmé) : lisible, plus cliquable. */
  fige?: boolean;
  /**
   * §2 (nº 382) — LA BOÎTE D'UN ONGLET, RÉGLABLE PAR L'APPELANT.
   * ------------------------------------------------------------------
   * Rembourrage horizontal et hauteur minimale, rien d'autre : la
   * typographie, les couleurs et la transition restent celles du
   * composant — un seul dessin, deux réglages, comme les deux tailles
   * de chevron de `GalerieQuiDefile`.
   * ⚠️ LE DÉFAUT REPRODUIT EXACTEMENT L'ÉCRITURE D'AVANT (`px-1
   * min-h-[46px]`) : les quatre appelants existants (authentification,
   * bascule à deux choix, lieux, démarchage, portfolio de l'espace)
   * ne passent rien et ne changent donc pas d'un pixel.
   * POURQUOI LA FICHE EN A BESOIN : sa rangée n'est pas une pleine
   * largeur, c'est une ligne où « Suivre » occupe la droite. Ses
   * onglets doivent garder LA CIBLE TACTILE du badge qu'ils
   * remplacent — 44 px de haut, 20 px de rembourrage de chaque côté.
   */
  classeOnglet?: string;
  /**
   * §3 (nº 382) — LE FILET GRIS SOUS LES DEUX ONGLETS.
   * ------------------------------------------------------------------
   * Vrai partout, sauf là où la ligne existe DÉJÀ : sur la fiche, la
   * rangée porte son propre trait de séparation depuis la nº 381, sur
   * toute sa largeur, marges comprises. En laisser un second sous les
   * seuls onglets ferait deux gris empilés, épais de deux pixels sous
   * les onglets et d'un seul ailleurs.
   */
  avecLigneGrise?: boolean;
  /**
   * §1 (nº 461) — LE DÉBORD DE LA LIGNE GRISE, réglé par l'appelant.
   * ------------------------------------------------------------------
   * « Ma sélection » au doigt veut sa ligne BORD À BORD de l'écran :
   * elle passe ici un débord négatif (`mobile:-inset-x-4 …`) posé SUR
   * LA LIGNE elle-même — jamais sur un conteneur (piège 378). Le trait
   * rose de l'onglet actif, les mots et la hauteur ne bougent pas ;
   * sans argument, tous les autres appelants (Réalisation | Flash de
   * la nº 447 compris) gardent leur ligne au pixel.
   */
  classeLigne?: string;
}) {
  const index = options.findIndex((option) => option.cle === cleActive);

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={fige ? "opacity-60" : ""}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((option) => {
          const actif = option.cle === cleActive;
          return (
            <button
              key={option.cle}
              type="button"
              role="radio"
              aria-checked={actif}
              disabled={fige && !actif}
              onClick={() => surChoix(option.cle)}
              className={`flex items-center justify-center ${classeOnglet}
                         text-[15px] font-semibold transition-colors ${
                           actif
                             ? "text-white"
                             : fige
                               ? "text-sombre-texte-doux cursor-not-allowed"
                               : "text-sombre-texte-doux hover:text-sombre-texte"
                         }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {/* LA LIGNE — grise et fine partout, épaisse et rose sous
          l'actif. Les deux épaisseurs partagent le même bord bas :
          le rose recouvre le gris, jamais l'inverse.
          §4 (nº 315) — LE GRIS EST CELUI DE LA CHARTE, PARTAGÉ. Il
          était écrit `bg-sombre-bordure` (à plein) pendant que les
          séparations d'une fiche s'écrivaient `border-sombre-bordure/60`
          (dilué) : DEUX écritures pour un même objet, donc deux gris à
          l'écran. Les deux lisent désormais la même variable — il ne
          peut plus y en avoir qu'un (voir TRAIT_SEPARATION). */}
      <div className="relative h-[3px]" aria-hidden="true">
        {avecLigneGrise && (
          <span
            //  §5 (nº 462) — la ligne se NOMME : la mesure de la
            //  sonde-retour la retrouve pour dire qui la coupe.
            data-ligne-grise=""
            className={`absolute inset-x-0 bottom-0 h-px ${TRAIT_SEPARATION_FOND} ${classeLigne}`}
          />
        )}
        {index >= 0 && (
          <span
            className="absolute bottom-0 left-0 h-[3px] rounded-full bg-primaire
                       transition-transform duration-300
                       ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              width: `${100 / options.length}%`,
              transform: `translateX(${index * 100}%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
