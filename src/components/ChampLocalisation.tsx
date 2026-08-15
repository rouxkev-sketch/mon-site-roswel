"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { stylePanneau, usePlacementMenu } from "@/components/placement-menu";
import { armerLaRemontee } from "@/lib/remontee-champ";
import { IconeCroix } from "@/components/Icones";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import {
  chercherLieux,
  PAUSE_FRAPPE_MS,
  SAISIE_MINIMUM,
  type LieuTrouve,
} from "@/lib/geocodage";
import { ligneFiche, ligneMoteur } from "@/lib/adresse";

/**
 * LE CHAMP DE LOCALISATION — un seul champ, le monde entier
 * ==========================================================
 * La mécanique d'Airbnb et de Booking : on tape librement, une liste
 * de lieux RÉELS s'ouvre dessous, et on CHOISIT dedans. Une saisie
 * libre non validée n'est jamais retenue — c'est ce qui garantit des
 * coordonnées exactes, donc une recherche par rayon juste.
 *
 * DEUX LIGNES PAR SUGGESTION, et c'est tout l'enjeu :
 *   « Springfield »            ← l'intitulé, en blanc
 *   « Illinois, États-Unis »   ← le contexte, en gris
 * Deux Springfield ne se confondent plus.
 *
 * QUATRE NIVEAUX, LIBREMENT : adresse complète, ville, région ou État,
 * pays entier — le champ n'impose rien, il propose ce que le géocodeur
 * connaît et la personne prend ce qui lui convient. Le niveau retenu
 * décide ensuite du MODE DE RECHERCHE (voir lib/geocodage).
 *
 * LE CHAMP VIDE EST UN ÉTAT À PART ENTIÈRE : « Partout ». Aucune
 * entrée de liste ne le représente — on y revient par la CROIX
 * d'effacement posée dans le champ (et, sur smartphone, par le bouton
 * « Effacer » de la fenêtre du moteur).
 *
 * ÉCONOMIE DE REQUÊTES : rien sous 3 caractères, une PAUSE DE FRAPPE
 * de 300 ms, la requête précédente annulée, et une mémoire de session
 * (une saisie déjà posée n'est jamais reposée). Tout cela vit dans
 * lib/geocodage — ici, on ne fait que respecter le rythme.
 *
 * LE MENU NE PASSE JAMAIS SOUS LE CLAVIER (usePlacementMenu) : sa
 * hauteur est plafonnée à la place réellement disponible, il défile
 * SUR LUI-MÊME au doigt, et s'ouvre vers le haut quand le bas est
 * trop juste. Le doigt qui défile dans le panneau ne choisit rien :
 * seul le tap complet choisit.
 *
 * ET IL NE VIT PAS DANS LE FLUX DE SON PARENT (fenêtre du moteur).
 * ------------------------------------------------------------------
 * Mis DANS LE FLUX, le panneau POUSSE la hauteur de ce qui le
 * contient. Dans la fenêtre du moteur, cela s'est payé deux fois :
 * la fenêtre s'étirait à l'ouverture de la liste (350 → 448 px
 * mesurés), et sa hauteur devenait alors une FONCTION de
 * `visualViewport.height` — laquelle change à CHAQUE IMAGE pendant les
 * 300 ms où le clavier se lève. Un panneau qui se redimensionne
 * pendant qu'il se déplace, c'est une saccade.
 * Le panneau est donc posé DANS <body> en coordonnées d'écran,
 * exactement comme le menu des styles (MenuDeroulant) — le champ dont
 * le comportement a toujours été juste. Le mode « dans le flux » ne
 * sert plus qu'au FORMULAIRE, où aucune fenêtre n'est en jeu.
 */

/**
 * CE QUE LE CHAMP AFFICHE POUR UN LIEU CHOISI (passe nº 114).
 * ⚠️ PLUS L'INTITULÉ SEUL — il tronquait : saisir « 18 Chemin du Bois
 * de la Noue, 69001 Vézilly, Hauts-de-France, France » n'affichait que
 * la rue, et personne ne savait ce qu'il avait retenu.
 *
 * DEUX ÉCRITURES, ET UNE SEULE DIFFÉRENCE : LA LONGUEUR DU PAYS.
 *  · LE FORMULAIRE écrit ce que le visiteur lira sur la fiche —
 *      « 12 rue de la Paix, Lyon, France ».
 *    Ni code postal, ni arrondissement : ce qu'on vient de choisir doit
 *    se relire tel qu'il sera publié (passe nº 115).
 *  · LE MOTEUR (`pourLeMoteur`) résume une recherche dans une barre
 *    déjà chargée : le pays y est abrégé — « Miami, FL, USA ».
 * Les SUGGESTIONS, elles, portent toujours le code postal : c'est
 * pendant la saisie, et seulement là, qu'on a besoin de trancher entre
 * deux adresses qui se ressemblent.
 */
function texteDuLieu(lieu: LieuTrouve, pourLeMoteur: boolean): string {
  return pourLeMoteur ? ligneMoteur(lieu) : ligneFiche(lieu);
}

export function ChampLocalisation({
  surChoix,
  lieuInitial = null,
  etiquette = "Localisation",
  texteIndicatif = "Ville, ou adresse complète…",
  id = "champ-localisation",
  sansBordure = false,
  compact = false,
  retraitDroite = 0,
  actionValider,
  croixEffacement = false,
  viderSiAbandon = false,
  suffixeLieu,
  piedPanneau,
  garderOuvertApresChoix = false,
  panneauDansLeFlux = false,
  remonterAuToucher = false,
  classeRacine = "",
  enErreur = false,
  pourLeMoteur = false,
}: {
  surChoix: (lieu: LieuTrouve | null) => void;
  /** Le lieu déjà choisi à l'arrivée (formulaire pré-rempli, moteur). */
  lieuInitial?: LieuTrouve | null;
  /** null = pas d'étiquette visible (le champ reste nommé pour les
      lecteurs d'écran). */
  etiquette?: string | null;
  texteIndicatif?: string;
  /** id unique par instance (le moteur est monté deux fois : web et
      fenêtre mobile). */
  id?: string;
  /** true = champ nu, posé dans un encadré partagé (moteur). */
  sansBordure?: boolean;
  /** Padding resserré (moteur). */
  compact?: boolean;
  /** Place réservée à DROITE dans le champ (la loupe du moteur). */
  retraitDroite?: number;
  /** Le champ dépose ici sa façon de valider : une liste ouverte ? on
      retient la première suggestion. Sinon on reconfirme le lieu déjà
      choisi — c'est ce qui relance la recherche. */
  actionValider?: React.MutableRefObject<(() => void) | null>;
  /** LA CROIX D'EFFACEMENT, posée dans le champ dès qu'un lieu est
      choisi : c'est LA porte de sortie vers « Partout ». Un clic vide
      le champ, efface le lieu (`surChoix(null)`) et rend la parole au
      fantôme (« Où ? »). */
  croixEffacement?: boolean;
  /** Partir sans avoir choisi dans la liste VIDE le champ (au lieu d'y
      laisser une saisie non validée). Le moteur s'en sert : le champ y
      doit toujours dire la vérité sur la recherche en cours. Le
      formulaire, lui, garde la saisie — on n'efface pas le travail de
      quelqu'un dans un formulaire. */
  viderSiAbandon?: boolean;
  /** Ajouté À L'AFFICHAGE après le lieu choisi (le moteur y met le
      rayon : « · 50 km »). Purement visuel. */
  suffixeLieu?: string;
  /** Posé en BAS du panneau (le moteur y met le rayon). Le panneau
      s'ouvre dès le toucher quand ce contenu existe. */
  piedPanneau?: React.ReactNode;
  /** Le panneau reste ouvert après le choix — c'est le moment où son
      pied (le rayon) devient utile. */
  garderOuvertApresChoix?: boolean;
  /** LE PANNEAU DANS LE FLUX — smartphone. Au lieu d'être posé dans
      <body> à des coordonnées calculées, il devient le FRÈRE SUIVANT
      du champ, en position normale. Le navigateur le place alors
      LUI-MÊME sous le champ : aucune mesure, aucun repère à convertir,
      donc rien qui puisse dériver quand le clavier bouge la page. */
  panneauDansLeFlux?: boolean;
  /** LE CHAMP REMONTE EN HAUT DE LA PAGE au premier toucher — un
      défilement de DOCUMENT, rien de plus. La PAGE DE RECHERCHE
      (smartphone) et le FORMULAIRE s'en servent tous les deux : toute
      la hauteur libérée passe alors SOUS le champ, pour les
      suggestions. */
  remonterAuToucher?: boolean;
  /** Classes ajoutées à l'enveloppe du champ — sert au parent à en
      faire une colonne qui grandit (`flex-1 min-h-0`). */
  classeRacine?: string;
  /** Le formulaire signale un champ à corriger (contour rouge). */
  enErreur?: boolean;
  /** LE PAYS EST-IL ABRÉGÉ une fois le lieu choisi ?
      VRAI dans le MOTEUR : sa barre est déjà chargée du style, de la
      ville et du rayon — « Miami, FL, USA ». FAUX dans le FORMULAIRE,
      qui écrit l'adresse comme la fiche la publiera (passe nº 115). */
  pourLeMoteur?: boolean;
}) {
  const [texte, setTexte] = useState(
    lieuInitial ? texteDuLieu(lieuInitial, pourLeMoteur) : ""
  );
  const [suggestions, setSuggestions] = useState<LieuTrouve[]>([]);
  const [listeOuverte, setListeOuverte] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /** Vrai UNIQUEMENT après une vraie frappe : ni le montage, ni un
      choix dans la liste ne déclenchent de recherche. */
  const saisieUtilisateur = useRef(false);
  /** Un lieu est choisi : le prochain toucher vide le champ d'un coup,
      prêt pour une nouvelle saisie. */
  const [selectionActive, setSelectionActive] = useState(Boolean(lieuInitial));
  const lieuCourant = useRef<LieuTrouve | null>(lieuInitial);
  /** Mise de côté au vidage : quitter sans choisir RESTAURE l'ancien. */
  const memoire = useRef<{ texte: string; lieu: LieuTrouve | null } | null>(
    null
  );
  /** Numéro de requête : une réponse en retard ne double jamais une
      plus récente. */
  const numeroRequete = useRef(0);

  const champ = useRef<HTMLInputElement>(null);
  const { hauteurMax, ouvreVersLeHaut, cadre } = usePlacementMenu(
    listeOuverte,
    champ,
    // DANS LE FLUX, le sens n'est même plus une question : le panneau
    // est sous le champ par construction. On garde le calcul pour la
    // seule chose qui reste utile — SA HAUTEUR, plafonnée à la place
    // réellement libre au-dessus du clavier.
    panneauDansLeFlux ? "bas" : undefined
  );
  /** Le panneau vit DANS <body> : le toucher extérieur doit donc
      l'épargner explicitement. */
  const panneau = useRef<HTMLDivElement>(null);
  const racine = useRef<HTMLDivElement>(null);
  /** VRAI pendant qu'un doigt est DANS le panneau : le blur du champ
      ne ferme alors rien (un défilement n'est pas un départ). */
  const interactionPanneau = useRef(false);
  /** De quoi couper une remontée en attente (voir plus bas). */
  const arret = useRef<(() => void) | null>(null);
  // Le démontage ne laisse aucun écouteur de redimensionnement derrière.
  useEffect(() => () => arret.current?.(), []);

  // FERMETURE AU TOUCHER EXTÉRIEUR — le pendant tactile du blur.
  // (Sans tableau de dépendances : l'écouteur voit l'état frais.)
  useEffect(() => {
    if (!listeOuverte) return;
    function auPointeurDehors(evenement: PointerEvent) {
      const cible = evenement.target as Node;
      // ⚠️ UN NŒUD DÉJÀ RETIRÉ DU DOCUMENT N'EST PAS « DEHORS ».
      // Choisir une suggestion vide la liste ; React démonte le bouton
      // AVANT que cet écouteur (posé sur `document`, donc plus haut que
      // la racine de React) ne s'exécute. Le bouton pressé est alors
      // détaché : `panneau.contains()` répondait « dehors », le panneau
      // se refermait, et le RAYON du web disparaissait avec lui — alors
      // qu'on venait précisément de le rendre utile. Un élément qui
      // vient de disparaître était forcément chez nous : on l'épargne.
      if (!cible.isConnected) return;
      if (racine.current?.contains(cible)) return;
      if (panneau.current?.contains(cible)) return;
      setListeOuverte(false);
      restaurerSiAbandon();
      if (viderSiAbandon && !lieuCourant.current) {
        setTexte("");
        setSelectionActive(false);
      }
    }
    document.addEventListener("pointerdown", auPointeurDehors);
    return () => document.removeEventListener("pointerdown", auPointeurDehors);
  });

  // ⚠️ DEUX SIGNAUX ONT DISPARU ICI (`surEtatListe`, `surSaisie`).
  // Ils prévenaient la fenêtre superposée du moteur qu'une liste
  // s'ouvrait ou qu'une lettre était tapée, pour qu'elle se dégarnisse
  // et remonte d'un palier. La recherche mobile est une PAGE : elle
  // n'a rien à faire de ces nouvelles, et personne d'autre ne les
  // écoutait.

  /**
   * LA LISTE VIENT DE S'OUVRIR : ON FINIT LA REMONTÉE.
   * ==================================================
   * ⚠️ POURQUOI UN SECOND TEMPS, ALORS QU'ON A DÉJÀ REMONTÉ AU
   * TOUCHER — et pourquoi ce n'est PAS « deux mouvements ».
   *
   * Au toucher, le clavier arrive et le document ne fait encore que la
   * hauteur d'un écran : il n'y a presque rien à défiler, et le
   * navigateur ne peut donc pas amener le champ aussi haut qu'on le
   * voudrait. Il monte ce qu'il peut, et c'est déjà un gain net.
   *
   * QUAND LA LISTE S'OUVRE, LA PAGE S'ALLONGE — elle est dans le flux,
   * juste sous le champ. Il y a alors de quoi défiler, et la même
   * demande native amène le champ exactement en haut : toute la
   * hauteur restante revient à la liste.
   *
   * LES DEUX MOUVEMENTS NE SE VOIENT JAMAIS ENSEMBLE : entre eux il y
   * a trois lettres tapées, la pause de frappe et l'aller-retour
   * réseau — une bonne seconde. Ce n'est pas le défaut « ça bouge deux
   * fois », c'est la page qui suit ce qu'on écrit.
   *
   * ET C'EST CE QUI REND LA CORRECTION INDIFFÉRENTE À L'APPAREIL :
   * iOS garde la fenêtre à sa taille et fait glisser le viewport
   * visuel, Android redimensionne la fenêtre — dans les deux cas la
   * liste allonge le document, et dans les deux cas le navigateur sait
   * l'amener en haut. Aucune branche, aucune mesure.
   */
  useEffect(() => {
    if (!remonterAuToucher || !listeOuverte) return;
    const image = requestAnimationFrame(() => {
      champ.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(image);
  }, [remonterAuToucher, listeOuverte]);

  // LA RECHERCHE — après la PAUSE DE FRAPPE, jamais à chaque lettre.
  useEffect(() => {
    if (!saisieUtilisateur.current) return;
    const saisie = texte.trim();
    if (saisie.length < SAISIE_MINIMUM) return;

    const minuteur = setTimeout(async () => {
      const numero = ++numeroRequete.current;
      setChargement(true);
      const reponse = await chercherLieux(saisie);
      if (numero !== numeroRequete.current) return; // réponse dépassée
      setChargement(false);

      if (!reponse.ok) {
        // Annulée par une frappe : une autre réponse arrive derrière,
        // il n'y a rien à dire.
        if (reponse.panne === "annulee") return;
        //  ⚠️ LA LISTE PRÉCÉDENTE RESTE (nº 230-§1) : même en panne, on
        //  ne vide pas — le message s'affiche AVEC ce qu'on avait.
        setMessage(
          "Impossible de charger les suggestions pour le moment — réessaie dans un instant."
        );
        setListeOuverte(true);
        return;
      }
      setSuggestions(reponse.lieux);
      setMessage(
        reponse.lieux.length === 0
          ? "Aucun lieu ne correspond à cette recherche."
          : null
      );
      setListeOuverte(true);
    }, PAUSE_FRAPPE_MS);

    return () => clearTimeout(minuteur);
  }, [texte]);

  // Déposé à CHAQUE rendu : la fonction voit l'état courant.
  useEffect(() => {
    if (!actionValider) return;
    actionValider.current = () => {
      if (listeOuverte && suggestions.length > 0) {
        choisir(suggestions[0]);
        return;
      }
      if (lieuCourant.current) surChoix(lieuCourant.current);
    };
    return () => {
      if (actionValider) actionValider.current = null;
    };
  });

  function choisir(lieu: LieuTrouve) {
    saisieUtilisateur.current = false; // pas de recherche sur ce changement
    lieuCourant.current = lieu;
    memoire.current = null; // un NOUVEAU lieu remplace l'ancien
    setTexte(texteDuLieu(lieu, pourLeMoteur));
    setSelectionActive(true);
    setListeOuverte(garderOuvertApresChoix);
    setSuggestions([]);
    setMessage(null);
    // LE CHOIX FAIT, LE CLAVIER N'A PLUS RIEN À FAIRE LÀ. Le champ
    // gardait le doigt après un choix : sur téléphone, le clavier
    // restait donc ouvert au-dessus d'une liste refermée, et la
    // fenêtre du moteur — qui ne redescend que lorsque plus rien n'est
    // en saisie — restait collée en haut de l'écran.
    // EXCEPTION, LE WEB : quand le panneau reste ouvert après le choix
    // (`garderOuvertApresChoix`), c'est qu'il porte encore le RAYON.
    // Le lâcher refermerait le panneau sous la souris.
    if (!garderOuvertApresChoix) champ.current?.blur();
    surChoix(lieu);
  }

  /** LA CROIX : le lieu est effacé, le champ redevient vide — son
      fantôme (« Où ? ») reprend la parole, et la recherche redevient
      mondiale (« Partout »). */
  function effacerLieu() {
    saisieUtilisateur.current = false;
    lieuCourant.current = null;
    memoire.current = null;
    setTexte("");
    setSelectionActive(false);
    setListeOuverte(false);
    setSuggestions([]);
    setMessage(null);
    champ.current?.blur(); // le clavier se referme, le choix est fait
    surChoix(null);
  }

  /**
   * LE LIEU DÉJÀ CHOISI RESTE (passe nº 180-§2)
   * ===========================================
   * AVANT : recliquer dans un champ qui portait déjà une ville
   * l'EFFAÇAIT — le texte partait, le lieu était annulé
   * (`surChoix(null)`), et la fenêtre du rayon se refermait. On ne
   * pouvait plus revoir son rayon sans tout ressaisir.
   *
   * DÉSORMAIS, un toucher ne fait qu'OUVRIR : la ville reste écrite,
   * son rayon reste choisi, et la fenêtre du rayon se rouvre telle
   * qu'on l'avait laissée. LA SEULE FAÇON D'EFFACER EST LA CROIX.
   *
   * ET LA PREMIÈRE FRAPPE PREND LE RELAIS : c'est elle qui remplace la
   * sélection par une nouvelle saisie (voir `onChange` du champ), en
   * mettant l'ancienne de côté — restaurée si l'on part sans rien
   * choisir, exactement comme avant.
   */
  function mettreDeCoteLaSelection() {
    if (!selectionActive) return;
    memoire.current = { texte, lieu: lieuCourant.current };
  }

  /**
   * LE CHAMP REMONTE EN HAUT DE L'ÉCRAN — PAR LE DÉFILEMENT NATIF
   * ==============================================================
   * LE DÉFAUT CORRIGÉ : le navigateur amène le champ JUSTE au-dessus
   * de la ligne du clavier. C'est assez pour saisir, mais il ne reste
   * alors que quelques dizaines de pixels à la liste de suggestions,
   * et la faire défiler au doigt est un supplice. Toute la hauteur
   * utile est AU-DESSUS du champ, inutilisée.
   *
   * ⚠️ CETTE VERSION NE CALCULE PLUS RIEN, ET C'EST LE POINT.
   * La précédente lisait `getBoundingClientRect`, y retranchait
   * `visualViewport.offsetTop` et une marge choisie à la main, puis
   * appelait `scrollBy` de l'écart obtenu. C'est très exactement le
   * genre de code qui a coûté onze passes de dérive : une mesure, une
   * conversion de repère, un déplacement appliqué à la main — et des
   * sémantiques opposées entre iOS et Chromium.
   *
   * ON DEMANDE DONC AU NAVIGATEUR, ET RIEN D'AUTRE :
   *   `scrollIntoView({ block: "start" })`
   * Il amène l'élément en haut de son conteneur de défilement — ici le
   * document — et il sait le faire juste, partout. L'air laissé
   * au-dessus n'est pas un chiffre de ce fichier : c'est la propriété
   * CSS `scroll-margin-top`, portée par le champ lui-même
   * (`data-remonte-au-toucher`, voir globals.css). Déclaratif, et
   * différent selon le contexte sans une ligne de JavaScript.
   *
   * LE SEUL RÉGLAGE EST LE MOMENT — voir CALME_CLAVIER_MS.
   * On écoute le redimensionnement du viewport pour SAVOIR QUAND le
   * clavier a fini d'arriver ; on n'en lit AUCUNE valeur, on ne
   * compense rien. Trop tôt, le document n'a pas encore la hauteur
   * nécessaire et le défilement est raboté ; trop tard, on voit deux
   * mouvements. On part donc quand les redimensionnements se taisent —
   * ce qui enchaîne notre glissade avec celle du navigateur, en un
   * seul mouvement à l'œil.
   *
   * iOS ET ANDROID, SANS DISTINCTION : le premier fait glisser le
   * viewport visuel, le second redimensionne la fenêtre — mais les
   * deux émettent `visualViewport.resize`, et les deux font défiler le
   * document de la même façon. Aucun code spécifique à l'un ou à
   * l'autre.
   */
  function remonterEnHautDeLEcran() {
    arreterLaRemontee();
    const cible = champ.current;
    if (!cible) return;
    //  ⚠️ LA MÉCANIQUE A DÉMÉNAGÉ (nº 155-§1) : elle vit dans
    //  lib/remontee-champ, où TOUS les champs du site la partagent
    //  (voir RemonteeChamps). Rien d'autre n'a changé — mêmes
    //  écouteurs, mêmes délais, même défilement natif.
    const desarmer = armerLaRemontee(cible);
    arret.current = () => {
      arret.current = null;
      desarmer();
    };
  }

  /** Coupe une remontée en attente — un second toucher, un départ du
      champ, ou le démontage ne doivent pas laisser d'écouteur derrière. */
  function arreterLaRemontee() {
    arret.current?.();
  }

  /** Un toucher sur le champ : vider, puis ouvrir la liste. (`onFocus`
      ET `onClick` : après un choix, le champ GARDE le focus — un
      second clic ne déclencherait aucun `focus`.) */
  function auToucher() {
    //  ⚠️ ON N'EFFACE PLUS RIEN (nº 180-§2) : on ouvre, c'est tout.
    if (piedPanneau || suggestions.length > 0 || selectionActive) {
      setListeOuverte(true);
    }
    if (remonterAuToucher) remonterEnHautDeLEcran();
  }

  /** Départ sans nouveau choix → l'ancien lieu revient. */
  function restaurerSiAbandon() {
    if (!memoire.current) return;
    const { texte: ancienTexte, lieu } = memoire.current;
    memoire.current = null;
    saisieUtilisateur.current = false;
    lieuCourant.current = lieu;
    setTexte(ancienTexte);
    setSelectionActive(true);
    setSuggestions([]);
    setMessage(null);
    surChoix(lieu);
  }

  const habillageChamp = sansBordure
    ? //  §2 (nº 258) — 46, la hauteur des cercles : le champ suivait
      //  son propre plancher de 48 et tenait l'encadré au-dessus des
      //  ronds voisins.
      `w-full h-full min-h-[46px] bg-transparent ${
        compact ? "px-3" : "px-4"
      } text-base outline-none overflow-hidden text-ellipsis
       text-sombre-texte placeholder:text-sombre-texte-doux`
    : //  ⚠️ PLUS DE CONTOUR (passe nº 112) : le fond suffit — au
      //  focus il s'éclaircit légèrement (nº 116, plus de trait
      //  rose), l'erreur allume un bord rouge. Cette branche ne sert
      //  QU'AU FORMULAIRE (le moteur passe `sansBordure`).
      `w-full min-h-[52px] rounded-lg border bg-sombre-eleve-clair px-4 text-base
       text-sombre-texte placeholder:text-sombre-texte-doux outline-none
       transition-colors focus:bg-sombre-haut
       overflow-hidden text-ellipsis ${
         enErreur ? "border-erreur" : "border-transparent"
       }`;

  /** LA CROIX ne s'affiche que sur un lieu RETENU — et la place
      qu'elle occupe est réservée dans le champ, sinon le texte du lieu
      passerait dessous. */
  const croixVisible = croixEffacement && selectionActive && lieuCourant.current;
  const placeADroite = croixVisible ? Math.max(retraitDroite, 40) : retraitDroite;

  /** LE CONTENU DU PANNEAU — le MÊME dans les deux modes (dans le
      flux ou flottant) : seule l'enveloppe change. */
  const contenuPanneau = (
    <>
          <ul
            role="listbox"
            aria-label="Lieux proposés"
            // C'est la LISTE qui défile dans le plafond de hauteur du
            // panneau : elle ne passe JAMAIS sous le clavier.
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain defilement-visible"
          >
            {/* AUCUNE entrée « pays » en tête de liste : la liste ne
                contient QUE des lieux réels. Revenir à « Partout »,
                c'est vider le champ — par la croix, ou par le bouton
                « Effacer » de la fenêtre du moteur. */}
            {message && (
              <li className="px-4 py-3 text-sm text-sombre-texte-doux">
                {message}
              </li>
            )}

            {suggestions.map((lieu) => (
              <li key={lieu.identifiant}>
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  // À la SOURIS : choisir dès l'appui (le champ garde
                  // le focus). AU DOIGT : rien à l'appui — un appui
                  // qui devient un défilement ne choisit pas ; le tap
                  // complet passe par onClick.
                  onPointerDown={(evenement) => {
                    if (evenement.pointerType === "mouse") {
                      evenement.preventDefault();
                      choisir(lieu);
                    }
                  }}
                  onClick={() => choisir(lieu)}
                  className="w-full min-h-[52px] px-4 py-2.5 text-left
                             hover:bg-sombre-eleve active:bg-sombre-eleve
                             transition-colors"
                >
                  {/* DEUX LIGNES : le lieu, puis ce qui le situe. */}
                  <span className="block font-medium leading-tight truncate">
                    {lieu.intitule}
                  </span>
                  {lieu.contexte && (
                    <span className="block mt-0.5 text-[12.5px] leading-tight text-sombre-texte-doux truncate">
                      {lieu.contexte}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {/* LE PIED (le rayon) — hors de la liste défilante. */}
          {piedPanneau}
    </>
  );

  return (
    <div
      ref={racine}
      className={`${
        panneauDansLeFlux
          ? "relative flex min-h-0 flex-col"
          : sansBordure
            ? "relative h-full"
            : "relative"
      } ${classeRacine}`}
    >
      {etiquette !== null && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-sombre-texte mb-1.5"
        >
          {etiquette}
        </label>
      )}
      <div className={sansBordure ? "relative h-full" : "relative"}>
      <input
        id={id}
        ref={champ}
        type="text"
        inputMode="text"
        // Pas de bulle native par-dessus NOTRE menu — le jeu complet
        // d'attributs vit dans lib/champs-sans-remplissage, avec un
        // `name` que Chrome ne peut pas prendre pour une adresse de
        // son carnet.
        {...sansRemplissageAuto(id)}
        // ⚠️ CE MARQUEUR N'EST PAS DÉCORATIF : c'est lui que vise la
        // règle `scroll-margin-top` de globals.css, celle qui décide de
        // l'air laissé au-dessus du champ quand il remonte. La valeur
        // diffère selon le contexte (page de recherche ou formulaire)
        // sans une ligne de JavaScript.
        data-remonte-au-toucher={remonterAuToucher ? "" : undefined}
        aria-label={etiquette ?? "Localisation"}
        aria-invalid={enErreur || undefined}
        placeholder={texteIndicatif}
        value={
          suffixeLieu && selectionActive && lieuCourant.current
            ? texte + suffixeLieu
            : texte
        }
        onChange={(evenement) => {
          //  ⚠️ LE CHAMP AFFICHE « Lyon · 100 km » quand un lieu est
          //  retenu (nº 180-§2) : la première frappe arrive donc avec ce
          //  suffixe collé. On le retire — sinon il partirait dans la
          //  recherche — et on met l'ancienne sélection de côté, pour
          //  qu'un départ sans nouveau choix la rende.
          const brut = evenement.target.value;
          const valeur =
            selectionActive && suffixeLieu && brut.includes(suffixeLieu)
              ? brut.replace(suffixeLieu, "")
              : brut;
          mettreDeCoteLaSelection();
          saisieUtilisateur.current = true; // vraie frappe : recherche permise
          setSelectionActive(false);
          setTexte(valeur);
          surChoix(null); // le texte a changé : plus de lieu validé
          if (valeur.trim().length < SAISIE_MINIMUM) {
            // Trop court pour chercher : on referme (le pied, quand il
            // existe, garde le panneau ouvert).
            setSuggestions([]);
            setMessage(null);
            setListeOuverte(Boolean(piedPanneau));
          }
        }}
        onFocus={auToucher}
        onClick={auToucher}
        onBlur={() => {
          if (interactionPanneau.current) return;
          setListeOuverte(false);
          //  ⚠️ LA REMONTÉE EST RENDUE AU DÉPART (nº 162-§1). Sans
          //  cela, un départ SANS clavier (clavier matériel, banc)
          //  laissait l'espace de fin de document en place : personne
          //  ne guettait plus rien. Sur un vrai mobile, le clavier qui
          //  se ferme fait le même travail — le premier des deux gagne,
          //  l'autre ne fait rien.
          arreterLaRemontee();
          restaurerSiAbandon();
          if (viderSiAbandon && !lieuCourant.current) {
            setTexte("");
            setSelectionActive(false);
          }
        }}
        style={placeADroite ? { paddingRight: placeADroite } : undefined}
        className={habillageChamp}
      />

      {/* LA CROIX D'EFFACEMENT — le chemin de retour vers « Partout ».
          Elle n'apparaît QUE lorsqu'un lieu est retenu : un champ vide
          n'a rien à effacer. À la souris, l'appui est neutralisé pour
          que le champ garde le focus ; au doigt, seul le tap complet
          agit (même règle que les suggestions). */}
      {/*  §1 (nº 230) — LA ROUE QUI TOURNE, DANS LE CHAMP, CONTRE SON
           BORD DROIT. Elle remplace les « … » du coin bas, qui ne se
           voyaient pas. Elle apparaît dès qu'une demande part et
           disparaît dès que la liste arrive.
           ⚠️ ELLE PREND LA PLACE DE LA CROIX le temps de l'attente
           (jamais les deux au même endroit), et la croix revient
           ensuite : le champ ne change pas de largeur, rien ne
           bouge. */}
      {chargement && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 flex h-8 w-8
                     -translate-y-1/2 items-center justify-center"
        >
          <span
            className="block h-4 w-4 animate-spin rounded-full
                       border-2 border-sombre-texte-doux/30
                       border-t-sombre-texte-doux"
          />
        </span>
      )}

      {croixVisible && !chargement && (
        <button
          type="button"
          aria-label="Effacer le lieu — chercher partout"
          title="Effacer le lieu"
          onPointerDown={(evenement) => {
            if (evenement.pointerType === "mouse") evenement.preventDefault();
          }}
          onClick={effacerLieu}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8
                     items-center justify-center rounded-full
                     text-sombre-texte-doux transition-colors
                     hover:bg-sombre-eleve hover:text-sombre-texte
                     active:bg-sombre-eleve"
        >
          <IconeCroix taille={16} />
        </button>
      )}
      </div>

      {/* LE PANNEAU DE SUGGESTIONS — DEUX MODES, ET C'EST TOUT LE
          SUJET DE CE COMPOSANT.

          · FLOTTANT (par défaut : web, ET la fenêtre du moteur sur
            smartphone) : posé dans <body> à des coordonnées d'écran,
            il SURVOLE la page sans la déformer. Rien de ce qui le
            contient ne change de taille quand il s'ouvre — c'est ce
            qui rend la fenêtre du moteur immobile, exactement comme
            avec le menu des styles. Il ne sort ni par le haut
            (`ouvertureVersLeBas`), ni sous le clavier (sa hauteur est
            plafonnée à la zone visible), et il descend jusqu'à
            `margeBasPanneau` du bas de l'écran.
          · DANS LE FLUX (`panneauDansLeFlux`, FORMULAIRE sur
            smartphone) : le panneau est le FRÈRE SUIVANT du champ, en
            position normale. Là, il n'y a pas de fenêtre : rien
            n'empêche la page de s'allonger sous le champ, et c'est la
            façon la plus simple de garantir qu'il reste dessous. */}
      {listeOuverte &&
        (suggestions.length > 0 || message || piedPanneau) &&
        (panneauDansLeFlux ? (
          <div
            ref={panneau}
            // LE SEUL CALCUL QUI RESTE : une HAUTEUR, jamais une
            // position. Même faux, il ne peut pas faire remonter le
            // panneau au-dessus du champ — au pire il le raccourcit.
            // C'est toute la différence avec les versions d'avant.
            style={{ maxHeight: hauteurMax ? `${hauteurMax}px` : undefined }}
            //  À LA CHARTE (nº 139) : plus de contour — le panneau se
            //  dit par son fond, comme toutes les fenêtres.
            //  ⚠️ EN VERRE LUI AUSSI (nº 238-§4). Il ne l'était pas :
            //  la nº 236 n'avait converti que l'écriture FLOTTANTE des
            //  suggestions, et celle-ci, la version « dans le flux »
            //  (recherche et formulaire sur smartphone), gardait son
            //  aplat. Deux écritures, un seul des deux converti — le
            //  défaut exact qui a laissé passer la fenêtre du compte et
            //  celle des langues. Mesuré au banc à 390 px : fond opaque
            //  rgb(35, 35, 39), filtre `none`.
            className="mt-1.5 flex min-h-0 flex-1 flex-col rounded-xl
                       text-sombre-texte overflow-hidden"
            data-verre-menu=""
            onPointerDown={() => {
              interactionPanneau.current = true;
              window.setTimeout(() => {
                interactionPanneau.current = false;
              }, 400);
            }}
          >
            {contenuPanneau}
          </div>
        ) : (
          createPortal(
          <div
            ref={panneau}
            // POSÉ DANS <body>, en coordonnées d'écran : la fenêtre du
            // moteur ne le découpe plus (web).
            style={stylePanneau(cadre, ouvreVersLeHaut, hauteurMax)}
            //  À LA CHARTE (nº 139) : ni contour ni ombre.
            //  ⚠️ LE FOND DU PANNEAU DES FILTRES, RECOPIÉ (nº 179-§1).
            //  Cette fenêtre est celle qui porte le RAYON une fois une
            //  ville choisie : elle était restée à `carte` (#232327)
            //  quand les fenêtres du web sont montées à `eleve`
            //  (#2C2C31) à la nº 144-§3. Deux fenêtres côte à côte, deux
            //  gris. C'est la valeur du panneau des filtres, telle
            //  quelle — et les badges qu'elle contient prennent en
            //  conséquence la robe « sur panneau », comme dans les
            //  filtres (voir MoteurTatouage, `piedRayon`).
            data-verre-menu=""
            className="z-[80] flex flex-col rounded-xl
                       text-sombre-texte overflow-hidden"
            onPointerDown={() => {
              interactionPanneau.current = true;
              window.setTimeout(() => {
                interactionPanneau.current = false;
              }, 400);
            }}
          >
            {contenuPanneau}
          </div>,
          document.body
          )
        ))}


    </div>
  );
}
