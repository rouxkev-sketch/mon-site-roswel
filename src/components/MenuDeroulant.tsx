"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COULEURS } from "@/config/roswel";
import {
  OPTION_LISTE,
  PANNEAU_LISTE_FLOTTANT,
} from "@/components/champs-recherche";
import { stylePanneau, usePlacementMenu } from "@/components/placement-menu";

// La petite flèche du menu, dessinée dans le code. Deux versions :
// GRISE au repos, ROSE quand le menu est ouvert (elle change en même
// temps que le contour du champ).
const flecheImage = (couleur: string) =>
  `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='8'><path d='M1 1l6 6 6-6' stroke='${couleur}' stroke-width='2' fill='none' stroke-linecap='round'/></svg>`
  )}")`;
const FLECHE_GRISE = flecheImage(COULEURS.flecheMenus);
const FLECHE_ROSE = flecheImage(COULEURS.primaire);

export type OptionMenu = {
  value: string;
  label: string;
  /** En-tête de section (non cliquable) sous lequel ranger l'option.
      Les options qui partagent le même `groupe` se suivent ; l'en-tête
      s'affiche une seule fois, en gras, avant la première d'entre elles. */
  groupe?: string;
  /** SOUS-SECTION DÉPLIANTE, à l'intérieur d'un groupe (passe nº 113).
      N'a d'effet qu'avec `repliable`. Les options qui la partagent se
      suivent ; une PORTE portant ce nom s'affiche à leur place dans la
      liste, et ne les révèle qu'une fois ouverte.
      ⚠️ CE NOM N'EST PAS UNE OPTION : on ne peut pas le choisir. C'est
      ce qui permet à « Traditionnel ethnique » d'exister dans le menu
      « Explorer » sans être un style cherchable. */
  sousGroupe?: string;
};

/**
 * MENU DÉROULANT « MAISON » (UN SEUL composant partout)
 * -----------------------------------------------------
 * Le même menu déroulant pour toute la recherche et les formulaires
 * (Catégorie d'artisan, Sujet du contact…) : mêmes dimensions,
 * bordures, arrondis, ombre, options (voir `champs-recherche.ts`), et
 * même comportement — à l'ouverture, le contour du champ ET la flèche
 * passent au ROSE ; à la fermeture, retour au gris. Avec `sansBordure`,
 * le champ se pose nu dans un encadré partagé (menu compact des
 * résultats) : `onOuvertureChange` prévient le parent pour qu'il
 * colore l'encadré. Fermeture au clic à l'extérieur ou par Échap.
 *
 * `feuilleMobile` : sur SMARTPHONE (< 768 px), la liste s'ouvre en
 * FEUILLE GLISSANTE depuis le bas (style Airbnb / Uber) — barre de
 * glissement, titre en gras, options à puce ronde (rose si choisie),
 * fermeture au tap sur le fond, au glissement vers le bas ou au tap
 * d'une option. Sur iPad / web (≥ 768 px) : le menu déroulant
 * classique. Le contour rose du champ reste actif (le fond de la
 * feuille est semi-transparent : le champ reste visible).
 *
 * MÊMES SECTIONS PARTOUT (smartphone, tablette, web) : les EN-TÊTES
 * DE SECTION (`groupe` des options) s'affichent dans les DEUX
 * habillages — en ROSE, en gras, non cliquables. Un seul composant,
 * donc aucune divergence possible entre les formats.
 *
 * Le TITRE (`titreFeuille`), lui, n'apparaît QUE sur la feuille
 * smartphone : elle monte du bas et recouvre le champ. Sur les grands
 * formats, le menu s'ouvre juste sous le champ, resté visible — un
 * titre y serait redondant.
 *
 * Le menu déroulant ne SORT JAMAIS de la fenêtre : sa hauteur est
 * plafonnée à la place disponible (mesurée à l'ouverture) et il
 * s'ouvre vers le HAUT si le bas est trop juste. Au-delà, il défile
 * sur lui-même — la page ne défile jamais à sa place.
 */
export function MenuDeroulant({
  valeur,
  surChangement,
  options,
  ariaLabel,
  placeholder,
  hauteur = "min-h-[50px]",
  taillePolice = "text-base",
  sansBordure = false,
  onOuvertureChange,
  feuilleMobile = false,
  titreFeuille,
  compact = false,
  sombre = false,
  repliable = false,
  libelleValeur,
}: {
  valeur: string;
  surChangement: (valeur: string) => void;
  options: OptionMenu[];
  ariaLabel: string;
  placeholder?: string;
  hauteur?: string;
  taillePolice?: string;
  sansBordure?: boolean;
  onOuvertureChange?: (ouvert: boolean) => void;
  feuilleMobile?: boolean;
  /** LES EN-TÊTES DE SECTION DEVIENNENT DES PORTES (passe nº 110).
      Le menu s'ouvre alors sur les seuls titres de groupe ; en toucher
      un déplie SES options et referme l'autre. C'est ce qui permet au
      menu « Explorer » de poser sa vraie première question —
      tatouages ou flashs ? — au lieu d'aligner quarante-six lignes.
      Faux (le cas de tous les autres menus) : rien ne change, les
      en-têtes restent de simples étiquettes non cliquables. */
  repliable?: boolean;
  /** CE QUE LE CHAMP REFERMÉ AFFICHE, quand ce n'est pas le libellé
      de l'option choisie (passe nº 110).
      ⚠️ LE MENU « EXPLORER » EN A BESOIN : ses options s'appellent
      « Réalisme » dans les deux catégories, et un champ refermé sur
      « Réalisme » ne dirait plus si l'on cherche des tatouages ou des
      flashs. Il affiche donc « Flashs · Réalisme ». La LISTE, elle,
      garde ses libellés courts — la catégorie est déjà écrite en
      titre au-dessus, la répéter vingt-deux fois serait du bruit. */
  libelleValeur?: string;
  /** Titre principal EN GRAS, affiché en tête de la liste — dans la
      feuille mobile ET dans le menu déroulant (structure identique sur
      tous les formats). */
  titreFeuille?: string;
  /** Padding resserré (moteur des résultats) : gagne ~16 px de largeur
      utile pour le libellé, sans changer la hauteur ni la flèche. */
  compact?: boolean;
  /** Habillage SOMBRE (index des tatoueurs) : mêmes comportements,
      seules les couleurs changent. Les pages artisans ne passent
      jamais cette option. */
  sombre?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  // Hauteur maximale du menu et sens d'ouverture : le calcul est
  // PARTAGÉ avec la liste des villes (usePlacementMenu), pour que les
  // deux menus du moteur se comportent exactement pareil.
  const { hauteurMax, ouvreVersLeHaut, cadre } = usePlacementMenu(
    ouvert,
    bouton
  );
  /** Le panneau vit DANS <body> : le clic extérieur doit donc
      l'épargner explicitement, sinon choisir une option refermerait
      le menu avant que le clic n'arrive. */
  const panneau = useRef<HTMLDivElement>(null);

  //  ⚠️ EN SOMBRE, LE CHAMP SUIT LA CHARTE (nº 141-2B) : ni contour,
  //  ni halo — OUVERT, LE FOND S'ÉCLAIRCIT D'UN CRAN, c'est tout. Le
  //  liseré rose à l'ouverture (border-primaire + ring) se lisait
  //  comme un encadrement d'alerte. Le mode CLAIR (produit artisans)
  //  garde son habillage historique.
  const habillage = sansBordure
    ? "bg-transparent"
    : sombre
      ? `rounded-2xl transition-colors ${
          ouvert ? "bg-sombre-eleve-clair" : "bg-sombre-eleve"
        }`
      : `rounded-2xl border bg-fond ${
          ouvert ? "border-primaire ring-2 ring-primaire/25" : "border-bordure-champ"
        }`;

  const libelleChoisi =
    libelleValeur || options.find((o) => o.value === valeur)?.label;

  /**
   * ON NE PRÉVIENT LE PARENT QUE SUR UN VRAI CHANGEMENT.
   * ⚠️ La fonction reçue est recréée à chaque rendu du parent. La
   * mettre en dépendance, c'était rejouer l'effet à CHAQUE rendu et
   * REPUBLIER « fermé » alors que rien n'avait bougé. Tant que
   * personne n'écoutait la fermeture, cela ne se voyait pas ; le jour
   * où la fenêtre du moteur s'est mise à redescendre quand le menu se
   * referme, elle repartait vers le bas à chaque rendu — y compris à
   * l'instant précis où l'on touchait la localité pour la faire
   * monter. La fonction se lit donc dans une référence, et l'effet ne
   * dépend plus que de l'état d'ouverture.
   */
  const prevenirOuverture = useRef(onOuvertureChange);
  useEffect(() => {
    prevenirOuverture.current = onOuvertureChange;
  }, [onOuvertureChange]);
  useEffect(() => {
    prevenirOuverture.current?.(ouvert);
  }, [ouvert]);

  // Fermeture au clic extérieur / Échap : SEULEMENT pour le menu
  // déroulant classique (la feuille mobile a son propre fond noir).
  useEffect(() => {
    if (!ouvert) return;
    const surClic = (evenement: PointerEvent) => {
      const cible = evenement.target as Node;
      if (conteneur.current?.contains(cible)) return;
      if (panneau.current?.contains(cible)) return;
      setOuvert(false);
    };
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setOuvert(false);
    };
    document.addEventListener("pointerdown", surClic);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("pointerdown", surClic);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  // Glissement vers le bas pour fermer la feuille.
  const [dragY, setDragY] = useState(0);
  const [enGlissement, setEnGlissement] = useState(false);
  const depart = useRef<number | null>(null);
  function glissementDebut(e: React.PointerEvent) {
    depart.current = e.clientY;
    setEnGlissement(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }
  function glissementBouge(e: React.PointerEvent) {
    if (depart.current == null) return;
    setDragY(Math.max(0, e.clientY - depart.current));
  }
  function glissementFin() {
    if (dragY > 70) fermer();
    depart.current = null;
    setEnGlissement(false);
    setDragY(0);
  }

  function fermer() {
    setOuvert(false);
    bouton.current?.blur();
  }

  function choisir(value: string) {
    surChangement(value);
    fermer();
  }

  const listeClassique = feuilleMobile
    ? `${PANNEAU_LISTE_FLOTTANT} hidden md:flex`
    : PANNEAU_LISTE_FLOTTANT;

  // Les options précédées de leur EN-TÊTE DE SECTION (une seule fois,
  // avant la première option du groupe). Calculé UNE FOIS et utilisé
  // par les deux habillages : la structure est donc rigoureusement la
  // même sur smartphone, tablette et web.
  //  ⚠️ LE SOUS-EN-TÊTE SUIT LA MÊME RÈGLE (passe nº 113), avec une
  //  précaution en plus : un changement de GROUPE recommence aussi la
  //  sous-section. Sans ça, une sous-section terminant un groupe et
  //  une autre du même nom ouvrant le suivant seraient lues comme une
  //  seule suite — et la seconde porte ne s'afficherait jamais. C'est
  //  exactement le cas du menu « Explorer », où « Traditionnel
  //  ethnique » existe sous Réalisations ET sous Flashs.
  const optionsAvecEntetes = options.map((option, index) => {
    const precedente = options[index - 1];
    const nouveauGroupe = option.groupe !== precedente?.groupe;
    return {
      option,
      entete: option.groupe && nouveauGroupe ? option.groupe : null,
      sousEntete:
        option.sousGroupe &&
        (nouveauGroupe || option.sousGroupe !== precedente?.sousGroupe)
          ? option.sousGroupe
          : null,
    };
  });

  /* ----------------------------------------------------------------
     LES CATÉGORIES REPLIABLES (`repliable`)
     ----------------------------------------------------------------
     UN SEUL GROUPE OUVERT À LA FOIS. À l'ouverture du menu, c'est
     celui du choix courant qui est déplié — on retombe donc sur ce
     qu'on avait choisi, sans avoir à le rechercher. Rien de choisi :
     tout est replié, et le menu tient en deux lignes.
     ⚠️ L'ÉTAT SE RECALCULE À CHAQUE OUVERTURE, jamais dans un effet :
     `ouvertureConnue` compare l'état d'ouverture au précédent pendant
     le rendu (le motif que React recommande), ce qui évite un rendu
     perdu et le clignotement qui va avec.
  ---------------------------------------------------------------- */
  const optionDuChoix = options.find((option) => option.value === valeur);
  const groupeDuChoix = optionDuChoix?.groupe ?? null;
  const sousGroupeDuChoix = optionDuChoix?.sousGroupe ?? null;
  const [groupeDeplie, setGroupeDeplie] = useState<string | null>(groupeDuChoix);
  /** LA SOUS-SECTION OUVERTE (passe nº 113) — une seule à la fois, et
      elle repart elle aussi du choix courant à chaque ouverture : on
      retombe sur son style, fût-il rangé dans une famille. */
  const [sousGroupeDeplie, setSousGroupeDeplie] = useState<string | null>(
    sousGroupeDuChoix
  );
  const [ouvertureConnue, setOuvertureConnue] = useState(ouvert);
  if (ouvert !== ouvertureConnue) {
    setOuvertureConnue(ouvert);
    if (ouvert) {
      setGroupeDeplie(groupeDuChoix);
      setSousGroupeDeplie(sousGroupeDuChoix);
    }
  }

  /** Cette option se voit-elle ? Toujours, sauf si son groupe est
      replié — ou sa sous-section, quand elle en a une. Un menu non
      repliable ne replie rien. */
  const optionVisible = (option: OptionMenu) => {
    if (!repliable) return true;
    if (option.groupe && option.groupe !== groupeDeplie) return false;
    return !option.sousGroupe || option.sousGroupe === sousGroupeDeplie;
  };

  /** La PORTE d'une sous-section se voit dès que son groupe est ouvert
      (elle tient la place d'une option dans la liste). */
  const sousEnteteVisible = (option: OptionMenu) =>
    repliable && (!option.groupe || option.groupe === groupeDeplie);

  /** LA LISTE QUI DÉFILE — pour la remonter en haut (5B, nº 139). Une
      seule référence : un seul habillage est monté à la fois. */
  const listeDeroulante = useRef<HTMLUListElement>(null);

  function basculerGroupe(groupe: string) {
    const ouvre = groupeDeplie !== groupe;
    setGroupeDeplie(ouvre ? groupe : null);
    //  Changer de catégorie remet la sous-section sur celle du choix
    //  courant : on ne garde pas ouverte la famille d'une autre
    //  catégorie par simple inertie.
    setSousGroupeDeplie(sousGroupeDuChoix);
    //  ⚠️ OUVRIR UNE CATÉGORIE REMONTE LA LISTE EN HAUT (5B). Le cas
    //  vécu : on défile jusqu'à « Flashs », tout en bas, on l'ouvre —
    //  et sa liste s'est dépliée AU-DESSUS du point où l'on est :
    //  l'écran ne bouge pas, le clic semble mort. La liste repart du
    //  haut, où la catégorie ouverte commence.
    //  (Pas pour une SOUS-section : elle se déplie SOUS sa porte,
    //  déjà sous les yeux — remonter la cacherait.)
    if (ouvre) listeDeroulante.current?.scrollTo({ top: 0, behavior: "instant" });
  }

  function basculerSousGroupe(sousGroupe: string) {
    setSousGroupeDeplie((courant) =>
      courant === sousGroupe ? null : sousGroupe
    );
  }

  /** L'EN-TÊTE D'UNE SECTION — une étiquette, ou une porte quand le
      menu est repliable. Mêmes mots, même rose, même graisse dans les
      deux cas : seule l'interaction change.
      ⚠️ LA TAILLE (13 px) EST SOUS CELLE DES ENTRÉES (16 px) : un
      titre de catégorie annonce, il ne se choisit pas — et rien ne
      doit le confondre avec une option. */
  function enTeteSection(entete: string, marge: string) {
    const classes = `${marge} text-[13px] font-bold uppercase tracking-[0.08em] text-primaire`;
    if (!repliable) {
      return (
        <p role="presentation" className={classes}>
          {entete}
        </p>
      );
    }
    return (
      <button
        type="button"
        aria-expanded={groupeDeplie === entete}
        //  ⚠️ `onClick` SEUL — surtout pas `onPointerDown` en plus.
        //  Les OPTIONS choisissent dès l'appui (pour ne pas voler le
        //  focus) et se referment dans la foulée : jouer deux fois n'y
        //  change rien. Une PORTE, elle, BASCULE : la jouer au
        //  pointerdown PUIS au click la rouvrait et la refermait dans
        //  le même geste — le menu paraissait mort. Mesuré au banc,
        //  corrigé ici.
        onClick={() => basculerGroupe(entete)}
        className={`${classes} flex w-full items-center justify-between gap-2
                   min-h-[44px] text-left transition-opacity hover:opacity-80`}
      >
        {entete}
        {chevron(groupeDeplie === entete)}
      </button>
    );
  }

  /** LE CHEVRON — il pivote, il ne change pas de dessin : c'est le
      même objet qui s'ouvre, pas deux icônes qui se remplacent. */
  function chevron(ouvertVers: boolean) {
    return (
      <span
        aria-hidden="true"
        className={`shrink-0 transition-transform duration-200 ${
          ouvertVers ? "rotate-180" : ""
        }`}
      >
        <svg width="12" height="8" viewBox="0 0 14 8" fill="none">
          <path
            d="M1 1l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  /**
   * LA PORTE D'UNE SOUS-SECTION (passe nº 113)
   * ===========================================
   * Elle ressemble à une OPTION, pas à un titre de catégorie — et
   * c'est voulu : « Traditionnel ethnique » occupe la place d'un style
   * dans la liste alphabétique, entre « Suminagashi » et « Trash
   * Polka ». Même taille, même couleur, même hauteur de touche ; seul
   * le chevron dit qu'elle s'ouvre au lieu de se choisir.
   * ⚠️ `onClick` SEUL, pour la raison écrite plus haut : une porte
   * bascule, la jouer deux fois dans un même geste la referme.
   */
  function porteSousSection(sousEntete: string, classes: string) {
    return (
      <button
        type="button"
        aria-expanded={sousGroupeDeplie === sousEntete}
        onClick={() => basculerSousGroupe(sousEntete)}
        className={`${classes} flex w-full items-center justify-between gap-2 text-left`}
      >
        {sousEntete}
        {chevron(sousGroupeDeplie === sousEntete)}
      </button>
    );
  }

  /**
   * ⚠️ L'ENCADRÉ BLANC AU SURVOL (bug nº 139-5A) — LA CAUSE EXACTE.
   * `OPTION_LISTE` (champs-recherche.ts) porte `hover:bg-fond-doux` :
   * le BLANC CASSÉ du produit artisans, pour ses menus clairs. Sur le
   * panneau SOMBRE, les options y échappaient par accident — la
   * surcouche `hover:bg-sombre-eleve` gagnait à l'ordre de la feuille
   * CSS — mais la PORTE « Traditionnel ethnique » recevait la classe
   * NUE : au survol, un pavé blanc sous la typographie blanche.
   * On ne s'en remet plus à l'ordre de la feuille : en sombre, les
   * classes claires sont RETIRÉES avant d'être remplacées.
   */
  const optionSombre = (base: string) =>
    sombre
      ? `${base
          .replace("hover:bg-fond-doux", "")
          .replace("active:bg-primaire-clair", "")} hover:bg-sombre-eleve active:bg-sombre-eleve`
      : base;

  return (
    <div ref={conteneur} className={sansBordure ? "relative h-full" : "relative"}>
      <button
        ref={bouton}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        onClick={() => (ouvert ? fermer() : setOuvert(true))}
        style={{
          backgroundImage: ouvert ? FLECHE_ROSE : FLECHE_GRISE,
          backgroundRepeat: "no-repeat",
          backgroundPosition: compact ? "right 0.65rem center" : "right 0.9rem center",
        }}
        className={`w-full ${hauteur} ${taillePolice} ${habillage} ${
          compact ? "pl-3 pr-7" : "pl-4 pr-10"
        } text-left outline-none overflow-hidden text-ellipsis whitespace-nowrap ${
          // Sans choix, l'indication (« Explorer ») se lit en gris
          // doux, comme le fantôme d'un champ vide — pas comme une
          // valeur.
          sombre
            ? libelleChoisi
              ? "text-sombre-texte"
              : "text-sombre-texte-doux"
            : libelleChoisi
              ? ""
              : "text-encre"
        }`}
      >
        {libelleChoisi ?? placeholder ?? "Choisir…"}
      </button>

      {/* Menu déroulant CLASSIQUE (toujours sur web/iPad ; sur mobile
          seulement si la feuille glissante n'est pas demandée).
          PAS de titre ici : le champ reste visible juste au-dessus, le
          répéter serait redondant. Le titre n'existe que sur la feuille
          smartphone, qui recouvre le champ. */}
      {ouvert &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          ref={panneau}
          // POSÉ DANS <body>, en coordonnées d'écran : plus aucun cadre
          // ne le découpe. Il déborde donc de la fenêtre du moteur et
          // descend jusqu'au bas de l'écran — vingt-deux styles, pas
          // quatre.
          //  ⚠️ LARGEUR AU CONTENU (nº 144-§5) : le champ n'est plus
          //  qu'un plancher — le panneau s'élargit jusqu'au style le
          //  plus long, et plus aucune entrée ne revient à la ligne.
          style={stylePanneau(cadre, ouvreVersLeHaut, hauteurMax, true)}
          //  ⚠️ EN SOMBRE, LES CLASSES CLAIRES SONT RETIRÉES, pas
          //  recouvertes (même règle que `optionSombre`) — et le
          //  panneau suit la charte : ni contour ni ombre, le fond
          //  carte seul (la robe des fenêtres depuis la nº 130).
          className={
            sombre
              ? `${listeClassique
                  .replace("border border-bordure", "")
                  .replace("bg-fond", "")
                  .replace(/shadow-\[[^\]]*\]/, "")} bg-sombre-carte text-sombre-texte`
              : listeClassique
          }
        >
          <ul
            ref={listeDeroulante}
            role="listbox"
            aria-label={ariaLabel}
            // C'est la LISTE qui défile dans le plafond de hauteur du
            // panneau : le menu ne dépasse jamais le bas (ni le haut)
            // de l'écran, et ne fait jamais défiler la page.
            // Barre de défilement VISIBLE (defilement-visible) : quand la
            // liste dépasse la place disponible, il faut voir tout de
            // suite qu'il reste des choix plus bas. C'est l'exception
            // assumée à la règle « jamais d'ascenseur affiché ».
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain defilement-visible py-1"
          >
            {optionsAvecEntetes.map(({ option, entete, sousEntete }) => (
              <li key={option.value}>
                {/* En-tête de section — étiquette, ou porte repliable */}
                {entete && enTeteSection(entete, "px-4 pt-3 pb-1")}
                {/* Porte de sous-section — à la place d'une option */}
                {sousEntete &&
                  sousEnteteVisible(option) &&
                  porteSousSection(sousEntete, optionSombre(OPTION_LISTE))}
                {optionVisible(option) && (
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === valeur}
                  // À la SOURIS : choisir dès l'appui, sans voler le focus.
                  // AU DOIGT : ne rien faire à l'appui — un appui qui
                  // devient un GESTE DE DÉFILEMENT ne doit pas choisir
                  // l'option (préverrouiller ici empêchait la liste de
                  // défiler au doigt) ; le tap complet passe par onClick.
                  onPointerDown={(evenement) => {
                    if (evenement.pointerType === "mouse") {
                      evenement.preventDefault();
                      choisir(option.value);
                    }
                  }}
                  onClick={() => choisir(option.value)}
                  // AUCUNE mise en évidence du choix courant : le métier
                  // déjà sélectionné s'affiche EXACTEMENT comme les
                  // autres (même couleur, même graisse). Le rose est
                  // réservé au contour du champ et aux en-têtes de
                  // section — il ne doit pas désigner une option.
                  //  ⚠️ LES OPTIONS D'UNE SOUS-SECTION SONT RETRAITÉES
                  //  (passe nº 113) : le décrochage dit qu'elles
                  //  appartiennent à la porte du dessus, sans avoir à
                  //  l'écrire.
                  //  ⚠️ ON REMPLACE `px-4` AU LIEU D'AJOUTER `pl-9` :
                  //  deux classes Tailwind qui visent la même propriété
                  //  ont la même force, et c'est l'ORDRE DE LA FEUILLE
                  //  qui tranche — pas l'ordre d'écriture. Ajoutée,
                  //  `pl-9` perdait contre le `px-4` d'OPTION_LISTE et
                  //  le retrait ne se voyait pas (mesuré au banc).
                  //  ⚠️ `optionSombre` RETIRE les classes claires au
                  //  lieu de les recouvrir : le survol sombre ne doit
                  //  rien à l'ordre de la feuille CSS (voir 5A).
                  className={optionSombre(
                    option.sousGroupe
                      ? OPTION_LISTE.replace("px-4", "pr-4 pl-9")
                      : OPTION_LISTE
                  )}
                >
                  {option.label}
                </button>
                )}
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}

      {/* FEUILLE GLISSANTE — smartphone uniquement (< 768 px) */}
      {ouvert && feuilleMobile && (
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
          {/* Fond noir SEMI-TRANSPARENT : le champ (et son contour rose)
              restent visibles au travers. Tap = fermeture. */}
          <div
            className="absolute inset-0 bg-black/40"
            onPointerDown={fermer}
            aria-hidden
          />
          {/* La feuille */}
          <div
            role="listbox"
            aria-label={ariaLabel}
            className={`relative rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))] ${
              sombre ? "bg-sombre-carte text-sombre-texte" : "bg-fond"
            }`}
            style={{
              transform: `translateY(${dragY}px)`,
              transition: enGlissement ? "none" : "transform .25s ease",
              animation: "rw-feuille-monte .25s ease",
            }}
          >
            {/* Barre de glissement iOS (zone de drag) */}
            <div
              className="pt-3 pb-2 flex justify-center cursor-grab touch-none"
              onPointerDown={glissementDebut}
              onPointerMove={glissementBouge}
              onPointerUp={glissementFin}
              onPointerCancel={glissementFin}
            >
              <span className="w-10 h-1.5 rounded-full bg-bordure" aria-hidden />
            </div>
            <h2 className="px-5 pb-3 text-lg font-bold text-left">
              {titreFeuille ?? "Choisissez une option"}
            </h2>
            <ul
              ref={listeDeroulante}
              className="overflow-y-auto px-2 pb-2 defilement-visible"
            >
              {optionsAvecEntetes.map(({ option, entete, sousEntete }) => {
                const { value, label } = option;
                const choisi = value === valeur;
                return (
                  <li key={value}>
                    {/* En-tête de section — étiquette, ou porte repliable */}
                    {entete && enTeteSection(entete, "px-3 pt-3 pb-1")}
                    {/* Porte de sous-section — à la place d'une option.
                        La puce ronde des options lui est refusée : elle
                        ne se choisit pas. Le retrait `pl-8` la met à
                        l'aplomb des libellés voisins. */}
                    {sousEntete &&
                      sousEnteteVisible(option) &&
                      porteSousSection(
                        sousEntete,
                        `min-h-[52px] pl-8 pr-3 rounded-2xl text-base ${
                          sombre
                            ? "text-sombre-texte hover:bg-sombre-eleve"
                            : "text-encre hover:bg-fond-doux"
                        }`
                      )}
                    {optionVisible(option) && (
                    <button
                      type="button"
                      role="option"
                      aria-selected={choisi}
                      // Même règle que le menu déroulant : l'appui au doigt
                      // laisse le geste décider (défilement possible), le
                      // choix passe par le tap complet (onClick).
                      onPointerDown={(evenement) => {
                        if (evenement.pointerType === "mouse") {
                          evenement.preventDefault();
                          choisir(value);
                        }
                      }}
                      onClick={() => choisir(value)}
                      // Comme dans le menu déroulant : le LIBELLÉ du choix
                      // courant reste de couleur et de graisse normales.
                      // Seule la puce ronde à sa gauche le désigne — sans
                      // elle, la feuille n'indiquerait plus du tout quel
                      // métier est sélectionné.
                      className={`w-full flex items-center gap-3 min-h-[52px] pr-3 rounded-2xl text-left text-base ${
                        //  Retrait des options d'une sous-section
                        //  (passe nº 113) — même règle que sur le web.
                        option.sousGroupe ? "pl-8" : "pl-3"
                      } ${
                        sombre
                          ? "text-sombre-texte hover:bg-sombre-eleve"
                          : "text-encre hover:bg-fond-doux"
                      }`}
                    >
                      {/* Puce ronde ~10 px : grise, ROSE plein si choisie */}
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: choisi
                            ? COULEURS.primaire
                            : COULEURS.bordureCarte,
                        }}
                        aria-hidden
                      />
                      {label}
                    </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
