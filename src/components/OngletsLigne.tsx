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
import Link from "next/link";
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
  taillePolice = "text-[15px]",
  largeurInactive,
}: {
  /** §1 (nº 460) — le label devient un NŒUD : le va-et-vient de « Ma
      sélection » y pose « Favoris 10 ⌄ » (mot + nombre + chevron).
      Tous les appelants à chaînes restent valides tels quels. */
  options: Array<{
    cle: string;
    label: React.ReactNode;
    /**
     * §1 (nº 858) — LE NOM ACCESSIBLE D'UN ONGLET, quand son libellé
     * n'est pas un mot. Le va-et-vient de l'accueil (VaEtVientNature)
     * réduit ses onglets INACTIFS à leur seule icône : l'œil voit un
     * dessin, un lecteur d'écran n'entendrait rien. Il pose donc ici la
     * phrase entière. Sans ce nom, rien ne change — les sept autres
     * appelants portent des mots, qui se lisent d'eux-mêmes.
     */
    nom?: string;
    /**
     * ██ §1 (nº 860) — UN ONGLET QUI EST UNE ADRESSE ██
     * Le va-et-vient de l'accueil relie DEUX PAGES (« / » et
     * « /flash ») : ses onglets sont des LIENS, pas des interrupteurs.
     * Quand cette valeur est là, le va-et-vient entier change de
     * nature — voir la note du rendu, plus bas : il devient une
     * navigation, et l'onglet actif se dit « page courante » au lieu
     * de « coché ». Le dessin, lui, ne bouge pas d'un pixel.
     * ⚠️ TOUT OU RIEN : si un onglet porte une adresse, tous doivent en
     * porter une — un demi-va-et-vient n'aurait aucun sens pour
     * personne, et surtout pas pour un lecteur d'écran.
     */
    href?: string;
    /** §2 (nº 860) — CE QU'IL FAUT DÉCLARER AVANT DE PARTIR. Le
        va-et-vient de l'accueil s'en sert pour demander au site de
        rendre la place de la page visée (les deux accueils sont des
        pages jumelles, pas des destinations neuves). N'a de sens
        qu'avec une adresse. */
    surClic?: () => void;
  }>;
  /** La clé de l'onglet actif — `null` tant que rien n'est choisi. */
  cleActive: string | null;
  /** Le choix, quand les onglets sont des interrupteurs. Une navigation
      (onglets à adresse, nº 860) n'en a pas : c'est le lien qui agit. */
  surChoix?: (cle: string) => void;
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
  /**
   * ██ §2 (nº 515) — LA TAILLE DU MOT, RÉGLABLE PAR L'APPELANT ██
   * ------------------------------------------------------------------
   * LE BESOIN : sur « Ma sélection », le propriétaire trouve le
   * va-et-vient « Favoris | Suivis » trop petit AU WEB. Sa taille était
   * écrite EN DUR ici — 15 px pour les huit appelants —, donc
   * l'agrandir les aurait tous emportés : les onglets « Réalisation |
   * Flash » du moteur (nº 447), le va-et-vient d'une fiche, ceux du
   * formulaire, de l'authentification, du démarchage.
   * ⚠️ LE DÉFAUT REPRODUIT EXACTEMENT L'ÉCRITURE D'AVANT — c'est le
   * procédé de `classeOnglet` (nº 382) et de `classeLigne` (nº 461),
   * et pour la même raison : les sept autres appelants ne passent rien
   * et ne changent donc pas d'un pixel, par construction.
   * ⚠️ UNE SEULE CLASSE DE TAILLE SUR LE BOUTON, JAMAIS DEUX
   * SUPERPOSÉES (règle nº 389) : l'appelant REMPLACE la valeur, il ne
   * s'ajoute pas par-dessus. C'est pourquoi « Ma sélection » écrit sa
   * taille de base ET sa variante web dans la même chaîne — deux
   * points de rupture d'une même propriété, pas deux classes qui se
   * disputent l'ordre de la feuille.
   * ⚠️ LE NOMBRE ET LE CHEVRON : le nombre posé par « Ma sélection »
   * (« Favoris 10 ») n'a pas de taille propre — il HÉRITE de celle-ci
   * et suit donc le mot, en gardant sa graisse normale et son gris
   * (nº 462). Le chevron, lui, est une icône dimensionnée en pixels :
   * il ne bouge pas.
   * ⚠️ LA HAUTEUR NE DÉPEND PAS DE CE RÉGLAGE : c'est le `min-h-` de
   * `classeOnglet` qui commande, et il est bien plus grand que la
   * hauteur de ligne du texte à toutes les valeurs employées.
   */
  taillePolice?: string;
  /**
   * ██ §1 (nº 858) — DES ONGLETS DE LARGEURS INÉGALES ██
   * ------------------------------------------------------------------
   * LE BESOIN, ET IL EST MESURÉ : le va-et-vient de l'accueil du doigt
   * (VaEtVientNature) montre l'onglet ACTIF avec sa phrase entière
   * (« Find your tattoo style… ») et l'INACTIF réduit à son icône. En
   * colonnes égales, l'actif n'aurait que 179 px pour un contenu qui en
   * demande 202 (relevé nº 858, corps 15 demi-gras) : la phrase serait
   * coupée. Cette valeur donne aux onglets inactifs UNE LARGEUR FIXE ;
   * l'actif prend tout le reste.
   * ⚠️ LE TRAIT ROSE SUIT LA MÊME ARITHMÉTIQUE, et c'est pour cela
   * qu'il n'y a qu'un réglage et pas deux : sa largeur vaut « tout sauf
   * les inactifs », son décalage « autant de largeurs fixes qu'il y a
   * d'onglets avant lui ». Les deux s'écrivent en `calc`, donc il
   * GLISSE encore — même transformation, même courbe qu'ailleurs.
   * ⚠️ SANS ARGUMENT, RIEN NE CHANGE : les colonnes restent égales et
   * les deux expressions redeviennent celles d'avant, au caractère près
   * (les sept autres appelants ne passent rien).
   */
  largeurInactive?: string;
}) {
  const index = options.findIndex((option) => option.cle === cleActive);
  /*  ██ §1 (nº 860) — DEUX NATURES POUR UN MÊME DESSIN ██
      SANS ADRESSES, c'est ce que ce composant a toujours été : un
      groupe de BOUTONS RADIO — on choisit une valeur, la page ne change
      pas (Favoris | Portfolios, Réalisation | Flash du moteur, les cinq
      autres appelants).
      AVEC ADRESSES, c'est une NAVIGATION : deux pages, et l'onglet actif
      est la page où l'on est. Les rôles suivent la vérité — `nav` et
      `aria-current="page"` au lieu de `radiogroup` et `aria-checked` —
      parce qu'annoncer « coché » pour un lien tromperait, et parce que
      les liens apportent ce qu'un bouton n'a pas : l'ouverture dans un
      onglet, le clic du milieu, et une adresse qu'un moteur peut suivre.
      LE DESSIN EST LE MÊME, ET C'EST LE POINT : mêmes classes, même
      grille, même ligne, même trait rose. Une seule écriture pour les
      deux (piège nº 378). */
  const enLiens = options.some((option) => option.href);
  /*  §1 (nº 858) — LES COLONNES, ET LE TRAIT QUI LES SUIT. Une seule
      source (`largeurInactive`) décide des trois expressions : sans
      elle, ce sont exactement celles d'avant. */
  const colonnes = largeurInactive
    ? options
        .map((option) => (option.cle === cleActive ? "1fr" : largeurInactive))
        .join(" ")
    : `repeat(${options.length}, 1fr)`;
  const largeurDuTrait = largeurInactive
    ? `calc(100% - ${options.length - 1} * ${largeurInactive})`
    : `${100 / options.length}%`;
  const decalageDuTrait = largeurInactive
    ? `calc(${index} * ${largeurInactive})`
    : `${index * 100}%`;

  /*  ██ §1 (nº 870) — LA TYPOGRAPHIE D'UN ONGLET, ÉCRITE UNE FOIS ██
      Elle était posée dans la classe du bouton et nulle part ailleurs.
      Le trait rose en a besoin LUI AUSSI depuis cette passe : c'est une
      COPIE INVISIBLE du libellé actif qui lui donne sa largeur (voir la
      note du trait, plus bas), et une copie qui n'aurait pas le même
      corps ni la même graisse serait d'une autre largeur que le mot.
      Les deux la lisent donc ici (piège nº 378) : le mot et sa mesure ne
      peuvent plus diverger. */
  const ECRITURE_ONGLET = `${taillePolice} font-semibold`;

  const Enveloppe = enLiens ? "nav" : "div";
  return (
    <Enveloppe
      {...(enLiens ? {} : { role: "radiogroup" })}
      aria-label={ariaLabel}
      className={fige ? "opacity-60" : ""}
    >
      <div
        /*  §1 (nº 858) — LA GRILLE S'ANIME quand les colonnes sont
            inégales : l'onglet qui s'ouvre pousse l'autre au lieu de
            sauter, à la courbe du trait rose. Sans `largeurInactive`,
            les colonnes ne changent jamais et cette transition ne
            s'applique à rien. */
        className={`grid${
          largeurInactive
            ? " transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            : ""
        }`}
        style={{ gridTemplateColumns: colonnes }}
      >
        {options.map((option) => {
          const actif = option.cle === cleActive;
          //  L'ÉCRITURE EST COMMUNE AUX DEUX NATURES : elle est calculée
          //  une fois, et portée par le bouton comme par le lien.
          const ecriture = `flex items-center justify-center ${classeOnglet}
                         ${ECRITURE_ONGLET} transition-colors ${
                           actif
                             ? "text-white"
                             : fige
                               ? "text-sombre-texte-doux cursor-not-allowed"
                               : "text-sombre-texte-doux hover:text-sombre-texte"
                         }`;
          return option.href ? (
            <Link
              key={option.cle}
              href={option.href}
              onClick={option.surClic}
              aria-current={actif ? "page" : undefined}
              aria-label={option.nom}
              className={ecriture}
            >
              {option.label}
            </Link>
          ) : (
            <button
              key={option.cle}
              type="button"
              role="radio"
              aria-checked={actif}
              disabled={fige && !actif}
              onClick={() => surChoix?.(option.cle)}
              aria-label={option.nom}
              className={ecriture}
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
            className={`absolute inset-x-0 bottom-0 h-px ${TRAIT_SEPARATION_FOND} ${classeLigne}`}
          />
        )}
        {index >= 0 && (
          /**
           * ██ §1 (nº 870) — LE TRAIT SE RACCOURCIT À LA LARGEUR DU MOT ██
           * ==============================================================
           * CE QUE LE PROPRIÉTAIRE VOIT : sur un va-et-vient à deux
           * onglets, le trait courait sur TOUTE la moitié — 179 px au
           * doigt pour un mot de 50. « Trop étalé pour un seul mot. »
           * CE QU'IL DEVIENT : la largeur du MOT, centré sous lui, plus
           * un DÉBORD de chaque côté.
           * ██ §1 (nº 871) — LE DÉBORD PASSE DE HUIT À VINGT-HUIT ██
           * Les huit pixels de la nº 870 donnaient 65 px sous un mot de
           * 49 : le propriétaire l'a trouvé TROP COURT. Vingt-huit de
           * chaque côté donnent 105 px — la valeur intermédiaire qu'il
           * demande, entre le mot nu et la moitié de la rangée (179 au
           * doigt). Le trait tient encore largement sous son segment
           * (`max-w-full` reste là pour les libellés très longs).
           *
           * COMMENT LA LARGEUR EST OBTENUE, ET POURQUOI SANS MESURE :
           * le trait CONTIENT une copie invisible du libellé actif, dans
           * la typographie des onglets (`ECRITURE_ONGLET`). Sa largeur
           * est donc celle du mot, calculée par le navigateur — au rendu
           * du serveur comme au premier pixel peint, sans `useEffect`,
           * sans mesure, sans le clignotement d'un trait large qui se
           * rétrécirait à l'hydratation. Le rembourrage horizontal ajoute
           * le débord, et `overflow-hidden` referme les trois pixels sur
           * une copie haute de vingt : elle ne se peint pas (`invisible`),
           * elle ne fait que mesurer.
           *
           * LE GLISSEMENT NE BOUGE PAS D'UNE COURBE : c'est la BOÎTE
           * EXTÉRIEURE qui garde la largeur d'un segment, la
           * transformation et sa transition (nº 112, reprise nº 858) ; le
           * trait ne fait que se centrer dedans. Ce qui change de segment
           * change donc encore de place en glissant.
           * ⚠️ SA LARGEUR, ELLE, NE GLISSE PAS : elle est celle du
           * contenu, donc elle prend sa nouvelle valeur d'un coup au
           * changement d'onglet. Animer aussi la largeur demanderait de
           * la mesurer en JavaScript — ce que cette écriture évite
           * précisément.
           * ⚠️ ET IL NE DÉBORDE JAMAIS DE SON SEGMENT (`max-w-full`) :
           * un libellé qui se replie sur deux lignes rendrait une copie
           * plus large que la colonne ; le trait s'arrête à la colonne,
           * comme avant cette passe.
           * ⚠️ LA COPIE NE SE LIT PAS : la rangée entière est
           * `aria-hidden` (elle l'était déjà), et le libellé reste
           * annoncé une seule fois, par son onglet.
           */
          <span
            className="absolute bottom-0 left-0 flex h-[3px] justify-center
                       transition-transform duration-300
                       ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              width: largeurDuTrait,
              transform: `translateX(${decalageDuTrait})`,
            }}
          >
            <span className="h-[3px] max-w-full overflow-hidden rounded-full bg-primaire px-7">
              <span className={`invisible block whitespace-nowrap ${ECRITURE_ONGLET}`}>
                {options[index].label}
              </span>
            </span>
          </span>
        )}
      </div>
    </Enveloppe>
  );
}
