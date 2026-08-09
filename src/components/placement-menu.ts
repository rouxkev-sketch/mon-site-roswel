"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * OÙ ET SUR QUELLE HAUTEUR OUVRIR UN MENU DÉROULANT
 * ==================================================
 * Un menu qui s'ouvre sous un champ n'a AUCUNE raison de savoir
 * combien de place il reste sous lui : il s'affiche, et s'il est trop
 * long il passe sous le bord de l'écran. Sur smartphone, où l'écran
 * est court et le clavier occupe la moitié de la hauteur, c'est la
 * règle plutôt que l'exception.
 *
 * Ce calcul répond à la question à la place du menu :
 *  - OÙ le poser (des coordonnées d'écran, pas une position relative) ;
 *  - combien de place y a-t-il vraiment sous le champ ? au-dessus ?
 *  - faut-il ouvrir vers le haut plutôt que vers le bas ?
 * Le menu se plafonne alors à cette hauteur et DÉFILE SUR LUI-MÊME.
 *
 * TROIS RÈGLES APPRISES À LA DURE
 * --------------------------------
 * 1. LE MENU NE VIT PAS DANS SON CHAMP : il est POSÉ DANS <body>
 *    (createPortal) et positionné en coordonnées d'écran. Tant qu'il
 *    était un enfant du champ, la fenêtre du moteur — qui découpe son
 *    contenu — le coupait net : quatre entrées visibles sur vingt-deux.
 *    Un menu ne doit jamais être plus petit que ce que l'ÉCRAN peut
 *    montrer, quel que soit le cadre d'où il part. Il déborde donc de
 *    la fenêtre, par-dessus, jusqu'au bas de l'écran.
 * 2. LA PLACE EST CELLE DU VIEWPORT VISUEL, jamais celle de la page :
 *    sur smartphone, c'est LUI que le clavier réduit. Ouvert, le menu
 *    s'arrête juste au-dessus des touches ; refermé, il retrouve tout
 *    l'écran — et la mesure est refaite pendant toute l'animation.
 * 3. « PLUS DE PLACE AU-DESSUS » NE VEUT PAS DIRE « DE LA PLACE
 *    UTILE ». Sur smartphone, la fenêtre du moteur remonte en haut de
 *    l'écran dès qu'on écrit — c'est voulu : tout l'espace libre passe
 *    alors SOUS le champ. Mais le calcul, lui, voyait encore de la
 *    hauteur au-dessus (celle occupée par la fenêtre elle-même), la
 *    trouvait plus grande que le peu qui restait sous le champ une
 *    fois le clavier ouvert, et retournait le menu vers le haut — par
 *    dessus la fenêtre, à contresens. D'où `sensImpose`.
 * 4. RIEN N'EST RETENU D'UNE OUVERTURE À L'AUTRE. Le sens (haut ou
 *    bas) était un état React qui SURVIVAIT à la fermeture : rouvrir
 *    le menu le rendait avec la décision de la fois d'avant — prise
 *    clavier ouvert, donc « vers le haut ». Menu fermé, la décision
 *    est neutralisée à la lecture, et la mesure refaite AVANT le
 *    premier affichage de la réouverture (useLayoutEffect).
 *
 * La mesure est refaite au redimensionnement, à chaque défilement (y
 * compris celui des conteneurs internes — le menu doit SUIVRE son
 * champ), quand le clavier bouge, et pendant une demi-seconde après
 * l'ouverture, le temps que l'animation du clavier d'iOS se termine.
 *
 * UN SEUL endroit pour cette logique, partagé par le menu des styles
 * (MenuDeroulant), la liste des villes (ChampVille) et le champ de
 * localisation mondial (ChampLocalisation).
 */

/** Respiration entre le menu et le bord de l'écran. */
const MARGE = 10;

/** Le petit décrochage entre le bas du champ et le haut du menu. */
const ECART = 4;

/** En dessous de cette hauteur, un menu devient inutilisable. */
const HAUTEUR_MINI = 140;

/**
 * LE PLANCHER D'UNE LISTE POSÉE DANS LE FLUX — ET IL CASSE UN CERCLE
 * VICIEUX.
 * ===================================================================
 * Dans le flux (formulaire, page de recherche), la liste de
 * suggestions ALLONGE le document : c'est elle qui donne au navigateur
 * de quoi défiler, donc de quoi amener le champ en haut de l'écran
 * quand le clavier arrive (voir `remonterEnHautDeLEcran`).
 *
 * ⚠️ AVEC UN PLANCHER TROP BAS, PLUS RIEN NE MARCHE — mesuré : le
 * champ était au milieu de la page, il ne restait donc que 94 px sous
 * lui ; la liste s'y pliait, le document ne s'allongeait pas d'un
 * pixel, le défilement natif n'avait rien à défiler, et le champ ne
 * remontait jamais. La liste restait à 94 px POUR TOUJOURS, faute de
 * pouvoir se donner la place dont elle avait besoin.
 *
 * On lui accorde donc une hauteur MINIMALE franche, même quand la
 * place sous le champ ne la justifie pas encore. Elle déborde alors
 * brièvement sous le clavier — puis la page défile, le champ monte,
 * la place apparaît réellement, et la mesure suivante (le suivi tourne
 * à chaque image) la lui donne. Le mouvement converge, il ne
 * s'entretient pas.
 *
 * COMBIEN ? Une PROPORTION de la zone visible, pas un nombre de
 * pixels choisi une fois pour toutes. Il faut qu'elle soit :
 *  · assez GRANDE pour que le document dépasse l'écran avant même que
 *    le champ n'ait bougé — sans quoi rien ne peut défiler ;
 *  · assez PETITE pour que la liste tienne ENTIÈREMENT au-dessus du
 *    clavier une fois le champ remonté en haut.
 * Le champ remonté occupe le premier quart de la zone visible (la
 * ligne de la croix, le champ, son décrochage) ; les 62 % suivants
 * satisfont les deux conditions, et ils s'adaptent seuls aux écrans
 * courts comme aux grands — ce qu'un chiffre en dur ne fait pas.
 * Mesuré à 368 px de zone visible : 228 px, soit quatre entrées
 * pleines, et la liste finit 14 px au-dessus des touches.
 */
const PART_PLANCHER_FLUX = 0.62;

/** Où poser le menu, en COORDONNÉES D'ÉCRAN (position: fixed). */
export type CadreMenu = {
  /** Le bord HAUT du menu quand il s'ouvre vers le bas. */
  haut: number;
  /** Le bord BAS du menu (mesuré depuis le bas de l'écran) quand il
      s'ouvre vers le haut. */
  bas: number;
  gauche: number;
  largeur: number;
};

/**
 * @param ouvert le menu est-il ouvert (rien n'est mesuré s'il est fermé)
 * @param ancre  le CHAMP (ou son bouton) : c'est lui qu'on mesure
 * @param sensImpose « bas » quand l'appelant SAIT que toute la place
 *   utile est sous le champ — c'est le cas de la fenêtre du moteur sur
 *   smartphone, qui remonte exprès en haut de l'écran à la saisie.
 *   Au-dessus du champ il n'y a alors QUE la fenêtre elle-même : de
 *   l'espace au sens du calcul, mais pas au sens de l'œil.
 * @param margeBas l'air laissé SOUS le menu, quand l'appelant veut une
 *   autre respiration que la marge standard. La liste de suggestions de
 *   la fenêtre du moteur s'en sert pour finir EXACTEMENT à la même
 *   distance du bas de l'écran que le haut de la fenêtre l'est du haut.
 *   Ne s'applique QU'AVEC un sens imposé : le calcul libre (menu des
 *   styles, liste des villes) n'est pas touché.
 */
export function usePlacementMenu(
  ouvert: boolean,
  ancre: RefObject<HTMLElement | null>,
  sensImpose?: "bas",
  margeBas?: number
) {
  const [hauteurMax, setHauteurMax] = useState<number | null>(null);
  const [ouvreVersLeHaut, setOuvreVersLeHaut] = useState(false);
  const [cadre, setCadre] = useState<CadreMenu | null>(null);

  // `useLayoutEffect` : la mesure est faite AVANT que le navigateur ne
  // peigne — le menu n'apparaît jamais, même une image, du mauvais côté.
  useLayoutEffect(() => {
    if (!ouvert) return;

    function ajuster() {
      const champ = ancre.current;
      if (!champ) return;
      const boite = champ.getBoundingClientRect();

      // ⚠️ DEUX REPÈRES SE MÉLANGEAIENT ICI, ET C'ÉTAIT LE MENU COUPÉ
      // PAR LE HAUT. Le relevé iPhone l'a chiffré : après la remontée
      // de saisie, le champ est à 8..60 pour `getBoundingClientRect`,
      // alors que sa position en MISE EN PAGE est 177 (conteneur +169,
      // panneau −159, champ +167). L'écart, 169, est exactement
      // `visualViewport.offsetTop`.
      //   · `getBoundingClientRect` rend des coordonnées VUES ;
      //   · `top` / `bottom` d'un élément `position: fixed` se comptent
      //     dans le viewport de MISE EN PAGE.
      // On mesurait donc en vu et on posait en mise en page. Tant que
      // le clavier est fermé les deux coïncident (offsetTop = 0) et
      // rien ne se voit — d'où huit passes sans le remarquer. Clavier
      // ouvert, le menu partait 169 px trop haut : son premier tiers
      // passait au-dessus du bord de l'écran, et ces choix-là
      // devenaient inatteignables.
      // ON CALCULE DONC TOUT EN COORDONNÉES VUES, et on ne convertit
      // qu'au moment de produire le style (`+ glissement`).
      const vue = window.visualViewport;
      const glissement = vue ? vue.offsetTop : 0;
      const hauteurVue = vue ? vue.height : window.innerHeight;

      const dessous = hauteurVue - boite.bottom - MARGE;
      const dessus = boite.top - MARGE;
      // On n'ouvre vers le HAUT que si le bas est vraiment trop juste
      // ET que le haut offre davantage de place — SAUF quand
      // l'appelant impose le bas : voir `sensImpose`.
      const versLeHaut =
        sensImpose !== "bas" && dessous < HAUTEUR_MINI && dessus > dessous;
      setOuvreVersLeHaut(versLeHaut);
      // Sens imposé : on prend la place RÉELLE, sans plancher — mieux
      // vaut un menu court qui reste sous le champ qu'un menu de la
      // bonne taille qui déborde de l'écran. Et on compte AU PIXEL,
      // depuis le bord haut réel du panneau (`boite.bottom + ECART`)
      // jusqu'à la marge demandée : c'est ce qui permet à la liste de
      // suggestions de finir exactement là où on le veut.
      setHauteurMax(
        sensImpose === "bas"
          ? Math.max(
              Math.round(hauteurVue * PART_PLANCHER_FLUX),
              hauteurVue - (boite.bottom + ECART) - (margeBas ?? MARGE)
            )
          : Math.max(HAUTEUR_MINI, versLeHaut ? dessus : dessous)
      );
      // ICI, ET ICI SEULEMENT, on repasse en coordonnées de MISE EN
      // PAGE : c'est ce que demandent `top` et `bottom` d'un élément
      // fixe. Clavier fermé, `glissement` vaut 0 et rien ne change —
      // le menu du style, la liste des villes et le web sont donc
      // exactement comme avant.
      const prochain = {
        haut: Math.round(boite.bottom + ECART + glissement),
        // `bas` se compte depuis le bas du viewport de mise en page :
        // c'est ce que demande la propriété CSS `bottom`.
        bas: Math.round(window.innerHeight - boite.top + ECART - glissement),
        gauche: Math.round(boite.left),
        largeur: Math.round(boite.width),
      };
      // On ne repose l'état QUE s'il change : le suivi tourne à chaque
      // image tant que le menu est ouvert, il ne doit pas relancer un
      // rendu pour rien.
      setCadre((avant) =>
        avant &&
        avant.haut === prochain.haut &&
        avant.bas === prochain.bas &&
        avant.gauche === prochain.gauche &&
        avant.largeur === prochain.largeur
          ? avant
          : prochain
      );
    }

    ajuster();

    // LE SUIVI TIENT TANT QUE LE MENU EST OUVERT — et plus seulement
    // une demi-seconde.
    // ⚠️ UNE TRANSITION CSS N'ÉMET AUCUN ÉVÉNEMENT. Ni `resize`, ni
    // `scroll`, ni `ResizeObserver` : rien ne prévient quand la fenêtre
    // du moteur GLISSE vers son troisième palier. Le suivi borné à
    // 600 ms suffisait tant que le menu s'ouvrait pendant la remontée ;
    // il expirait dès que la fenêtre bougeait APRÈS (le palier de
    // saisie arrive une seconde et demie après le toucher). Le menu
    // restait alors calé sur l'ancienne position du champ.
    // La mesure ne repose l'état QUE si elle change (voir `ajuster`) :
    // une image sans mouvement ne coûte donc qu'une lecture.
    let image = 0;
    const suivre = () => {
      ajuster();
      image = requestAnimationFrame(suivre);
    };
    image = requestAnimationFrame(suivre);

    // LE CHAMP CHANGE DE TAILLE OU DE PLACE (la fenêtre du moteur qui
    // remonte, une suggestion de plus) : on remesure aussi.
    const observateur = new ResizeObserver(ajuster);
    if (ancre.current) observateur.observe(ancre.current);
    observateur.observe(document.documentElement);

    window.addEventListener("resize", ajuster);
    // « true » : on écoute aussi le défilement des conteneurs internes
    // (fenêtre du moteur, colonne de fiche…), pas seulement la page —
    // le menu doit rester collé à son champ.
    window.addEventListener("scroll", ajuster, true);
    // Le viewport visuel bouge quand le CLAVIER s'ouvre ou se ferme.
    window.visualViewport?.addEventListener("resize", ajuster);
    window.visualViewport?.addEventListener("scroll", ajuster);
    return () => {
      cancelAnimationFrame(image);
      observateur.disconnect();
      window.removeEventListener("resize", ajuster);
      window.removeEventListener("scroll", ajuster, true);
      window.visualViewport?.removeEventListener("resize", ajuster);
      window.visualViewport?.removeEventListener("scroll", ajuster);
    };
  }, [ouvert, ancre, sensImpose, margeBas]);

  // FERMÉ = AUCUNE DÉCISION. Le sens, la hauteur et le cadre ne sont
  // pas remis à zéro DANS l'effet (poser un état dans le corps d'un
  // effet relance un rendu pour rien, et React le déconseille) : ils
  // sont NEUTRALISÉS À LA LECTURE. Un menu fermé ne peut donc pas
  // rendre la décision de l'ouverture précédente.
  return ouvert
    ? { hauteurMax, ouvreVersLeHaut, cadre }
    : { hauteurMax: null, ouvreVersLeHaut: false, cadre: null };
}

/** Le style d'un panneau POSÉ DANS <body> : coordonnées d'écran,
    largeur du champ, hauteur plafonnée à la place disponible. */
export function stylePanneau(
  cadre: CadreMenu | null,
  ouvreVersLeHaut: boolean,
  hauteurMax: number | null
): React.CSSProperties | undefined {
  if (!cadre) return undefined;
  return {
    position: "fixed",
    left: cadre.gauche,
    width: cadre.largeur,
    ...(ouvreVersLeHaut ? { bottom: cadre.bas } : { top: cadre.haut }),
    maxHeight: hauteurMax ? `${hauteurMax}px` : undefined,
  };
}

/* =====================================================================
 * CE QUI VIVAIT ICI, ET QUI A ÉTÉ SUPPRIMÉ — À LIRE AVANT DE LE
 * REMETTRE
 * =====================================================================
 * Ce fichier a porté, dix passes durant, TOUT le placement de la
 * fenêtre superposée du moteur sur smartphone :
 *
 *   · `useVueVisible`      — le rectangle réellement vu (glissement du
 *                            viewport visuel + hauteur au-dessus du
 *                            clavier), relu à chaque image ;
 *   · `usePlacementFenetre`— les TROIS paliers de la fenêtre (repos,
 *                            haut, saisie) en `translateY` animé, avec
 *                            sa hauteur plafonnée à la zone visible ;
 *   · `useRecollageEcran`  — l'annulation, écrite à la main dans
 *                            l'écouteur du viewport visuel, du
 *                            glissement qu'iOS impose au moment du
 *                            focus ;
 *   · `useFondImmobile`    — le verrou de défilement du corps
 *                            (`position: fixed` + `top` négatif) et sa
 *                            restitution ;
 *   · `MARGE_FENETRE`, `NiveauFenetre`, `PlacementFenetre`, `SUIVI_MS`
 *     (la constante de durée de suivi du clavier).
 *
 * TOUT CELA N'EXISTE PLUS, et rien ne doit revenir. La recherche mobile
 * est une PAGE (voir PageRechercheMobile) : le navigateur fait défiler
 * le document pour dégager le champ du clavier, sur iOS comme sur
 * Android, et il n'y a plus rien à mesurer ni à compenser. Chaque
 * crochet ci-dessus corrigeait un symptôme du même défaut de fond — un
 * élément flottant qu'il fallait replacer à la main — et chacun en
 * produisait un autre : glissement de l'arrière-plan, saccades, bande
 * blanche de 460 px, menu coupé par le haut, page qui descend.
 *
 * ⚠️ LE VERROU DE DÉFILEMENT A ÉTÉ VÉRIFIÉ AVANT D'ÊTRE RETIRÉ :
 * `useFondImmobile` n'était utilisé QUE par la fenêtre du moteur. Les
 * autres fenêtres du site posent chacune le leur, et elles ne sont pas
 * touchées — FenetreModale, MenuEspace, SelecteurLangue,
 * RecadreurPhoto.
 *
 * CE QUI RESTE ICI est le placement des MENUS DÉROULANTS
 * (`usePlacementMenu`, `stylePanneau`), partagé par le menu des styles,
 * la liste des villes, le champ de localisation mondial et le sélecteur
 * de style d'une fiche. Il n'a jamais posé de problème : un menu se
 * pose sous son champ, se plafonne à la place libre, et défile sur
 * lui-même.
 * ===================================================================== */
