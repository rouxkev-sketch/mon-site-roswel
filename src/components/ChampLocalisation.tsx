"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { stylePanneau, usePlacementMenu } from "@/components/placement-menu";
import { armerLaRemontee } from "@/lib/remontee-champ";
import { IconeCroix } from "@/components/Icones";
//  §4 (nº 303) — la robe du champ de style, déclarée par le menu
//  lui-même : aucune valeur graphique n'est recopiée ici.
import { ROBE_CHAMP_SOMBRE } from "@/components/MenuDeroulant";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import {
  chercherLieux,
  PAUSE_FRAPPE_MS,
  SAISIE_MINIMUM,
  type LieuTrouve,
} from "@/lib/geocodage";
import { ligneFiche, ligneMoteur } from "@/lib/adresse";
//  §1 (nº 660) — la trace permanente : ce défilement se signe.

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

/**
 * ██ §1 (nº 508) — LE PANNEAU DU RAYON NE SURVIVAIT PAS AU CHANGEMENT
 * DE PAGE, ET C'EST TOUTE LA CAUSE ██
 * ==================================================================
 * LE SYMPTÔME (relevé du propriétaire, web) : on choisit une ville
 * dans le champ de localité, les pilules de rayon s'affichent
 * dessous — puis LA LISTE SE REFERME TOUTE SEULE avant qu'on ait pu
 * cliquer un palier.
 *
 * CE QUI SE PASSE, ÉTAPE PAR ÉTAPE.
 *  1. `choisir()` pose déjà tout ce qu'il faut : la liste reste
 *     ouverte (`garderOuvertApresChoix`), le champ garde le focus, le
 *     pied du panneau se remplit du rayon (le lieu vient d'arriver).
 *     À cet instant, ce que voit le propriétaire est JUSTE.
 *  2. `surChoix(lieu)` remonte au moteur, qui lance la recherche.
 *  3. La recherche écrit l'adresse : « / » prend une requête.
 *  4. ET LÀ, L'ARCHITECTURE nº 357 ENTRE EN JEU. L'accueil NU (« / »,
 *     prérendu) et son JUMEAU dynamique (« /recherche », servi
 *     par réécriture du proxy dès que l'adresse porte une requête)
 *     sont DEUX PAGES, donc deux segments de route. La barre — et donc
 *     le moteur, et donc CE CHAMP — est montée PAR LA PAGE
 *     (IndexTatoueurs rend EnTeteTatouage), jamais par la mise en page
 *     commune. Le routeur remplace le segment : tout l'arbre est
 *     DÉMONTÉ et remonté à neuf.
 *  5. Le champ neuf repart avec `listeOuverte = false`, et son panneau
 *     — posé dans <body> par un portail — s'en va avec lui.
 *
 * POURQUOI `garderOuvertApresChoix` NE SUFFISAIT PAS : il maintient un
 * état LOCAL dans un composant qui ne survit pas à la navigation. Il
 * n'était pas en cause, il n'était simplement plus là.
 * ⚠️ ET POURQUOI LE DÉFAUT NE SE VOIT QU'UNE FOIS : le second choix de
 * ville part de « /recherche » et y reste — même segment,
 * aucun démontage, le panneau tenait déjà.
 *
 * LE REMÈDE, ET IL TIENT EN UNE PHRASE : le champ note qu'il DEVAIT
 * rester ouvert, et le champ qui le remplace reprend le FOCUS. Rien
 * d'autre — c'est `auToucher()`, le chemin d'ouverture ordinaire, qui
 * rouvre alors le panneau, avec son placement, son voile et son pied.
 * Aucun état d'ouverture n'est reconstruit à la main.
 *
 * ⚠️ POURQUOI UNE NOTE DE MODULE ET NON UN ÉTAT REACT : justement
 * parce qu'aucun état React ne traverse un démontage. Elle est
 * DATÉE et CLÉE PAR CHAMP — l'identifiant du moteur est une constante
 * (« moteur-tatouage »), donc stable d'une page à l'autre, quand celui
 * du moteur hôte caché ne l'est pas et ne peut pas la consommer.
 * ⚠️ ELLE EST EFFACÉE PAR TOUTE FERMETURE VOULUE — la croix, le départ
 * du champ, le pointeur dehors : un geste de fermeture doit fermer,
 * même s'il tombe pendant la transition de page.
 */
const REPRISE_MS = 4000;
let repriseAttendue: { cle: string; pose: number } | null = null;

function noterLaReprise(cle: string) {
  repriseAttendue = { cle, pose: Date.now() };
}

function oublierLaReprise() {
  repriseAttendue = null;
}

/** La note est-elle pour ce champ, et encore fraîche ? Elle n'est PAS
    consommée à la lecture : deux lectures rendent la même réponse (le
    double rendu du mode strict ne peut donc pas la manger). */
function repriseDue(cle: string): boolean {
  if (!repriseAttendue) return false;
  if (Date.now() - repriseAttendue.pose > REPRISE_MS) {
    repriseAttendue = null;
    return false;
  }
  return repriseAttendue.cle === cle;
}

/**
 * ██ §2 (nº 567, RÉDUIT nº 572) — CE QUE LE MOTEUR PEUT DEMANDER ██
 * ====================================================================
 * UNE SEULE COMMANDE. Elle existe parce que l'ouverture du panneau vit
 * ICI, et que le moteur a un cas où il doit le refermer lui-même : un
 * PAYS ou une RÉGION n'ouvre aucun rayon, il n'y a donc rien à régler
 * et la recherche part seule (§3 nº 568).
 * ⚠️ ELLE N'ANNONCE PAS — c'est délibéré, et c'est ce qui garde les
 * nº 564-566 intacts : refermer suffit, la fermeture fait annoncer le
 * brouillon une fois, et le moteur reste le seul à parler.
 * ⚠️ LA SECONDE COMMANDE EST PARTIE À LA nº 572 (`viderLAffichage`) :
 * elle ne servait qu'au bouton « EFFACER » du pied du rayon, retiré
 * avec ce pied. La FONCTION du même nom reste, plus bas — c'est la
 * croix du champ qui s'en sert.
 */
export type CommandesChampLocalisation = {
  /** Referme le panneau EXACTEMENT comme un clic à l'extérieur (même
      corps, donc même restauration d'une saisie abandonnée), et rend la
      main. La fermeture fait annoncer le brouillon, une fois. */
  fermerLePanneau: () => void;
};

export function ChampLocalisation({
  surChoix,
  lieuInitial = null,
  etiquette = "Location",
  texteIndicatif = "City, or full address…",
  id = "champ-localisation",
  sansBordure = false,
  robeDeMenu = false,
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
  opaque = false,
  surFermeturePanneau,
  commandesDuChamp,
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
  /**
   * §4 (nº 303) — CE CHAMP PREND LA ROBE DU CHAMP DE STYLE.
   * ------------------------------------------------------------------
   * AU DOIGT, sur la page du moteur, les deux champs doivent se
   * ressembler. Ils ne se ressemblaient pas : le style est un
   * `MenuDeroulant` (arrondi 16 px, fond `sombre-eleve`), la localité
   * gardait la robe des champs de FORMULAIRE (arrondi 8 px, fond
   * `sombre-eleve-clair`, contour) — deux écritures nées à deux
   * endroits.
   * ⚠️ AUCUNE VALEUR N'EST RECOPIÉE ICI : la robe vient de
   * `ROBE_CHAMP_SOMBRE`, déclarée par le menu lui-même. Les deux champs
   * ne peuvent donc plus diverger.
   * ⚠️ LE WEB N'EST PAS CONCERNÉ : là-bas, le moteur passe
   * `sansBordure` (les deux champs vivent dans un encadré commun qui
   * porte la forme), et cette branche n'est même pas atteinte.
   */
  robeDeMenu?: boolean;
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
      rayon : « · 25 mi »). Purement visuel. */
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
  /**
   * ██ §2 (nº 552) — LE PANNEAU DU FLUX SANS VERRE, SUR DEMANDE ██
   * ------------------------------------------------------------------
   * LE MÊME DRAPEAU, DU MÊME NOM, QUE `MenuDeroulant` (§2 nº 552),
   * `MenuDeVerre` (nº 537) et `FenetreDeVerre` (nº 543) : l'attribut
   * de verre n'est pas posé, et un aplat le remplace. `globals.css`
   * reste intouché (règle nº 172).
   * IL VISE LES DEUX BRANCHES DEPUIS LA nº 553 — celle « dans le
   * flux » (le doigt) et la FLOTTANTE (le web). La nº 552 n'avait
   * traité que la première, la seconde étant déjà sortie du verre à la
   * nº 543 ; mais la nº 543 l'avait figée à `carte` POUR TOUT LE MONDE,
   * moteur compris, et il fallait bien l'ouvrir pour que le formulaire
   * puisse monter sans emmener le moteur. Les deux branches d'un même
   * champ montrent donc enfin le même gris, et il dépend de qui appelle.
   * ⚠️ LE JETON EST `eleve` (#262C34), CELUI DES ENCADRÉS (nº 553), et
   * plus `carte` : ces panneaux s'ouvrent DANS le formulaire, dont les
   * encadrés SONT à `carte` — le panneau s'y confondait. Mesuré : 1,18
   * avec l'encadré, 1,37 avec la page. Sans le drapeau, `carte`.
   * ⚠️ SUR DEMANDE, ET POUR LA MÊME RAISON QUE PARTOUT : ce panneau
   * est PARTAGÉ — trois champs du formulaire de fiche (les deux
   * adresses de `DeuxZonesLieu`, celle de `BlocStudios`) et LA PAGE DE
   * RECHERCHE au doigt (`MoteurTatouage`). Le moteur n'a rien demandé.
   * Sans réglage, rien ne bouge : il garde son verre au pixel.
   */
  opaque?: boolean;
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
  /**
   * ██ §2 (nº 564) — LE CHAMP DIT QUAND SA RÉPONSE EST ARRÊTÉE ██
   * ------------------------------------------------------------------
   * Appelé UNE fois à chaque fermeture du panneau, quel que soit le
   * chemin — clic dehors, Échap, croix, départ du champ, et même un
   * démontage qui l'emporte alors qu'il était ouvert.
   * ⚠️ ET UNE FOIS DE PLUS, SANS PANNEAU (§1 nº 566) : la CROIX vit
   * dans le champ, pas dans le panneau. Cliquée alors que rien n'est
   * ouvert, elle n'a aucune fermeture à offrir — elle appelle donc
   * ce réglage elle-même. C'est pourquoi il faut le lire comme « le
   * champ a rendu sa réponse, va lire le brouillon » et non comme
   * « une boîte vient de se refermer » : la seconde formule était
   * vraie à la nº 564, elle ne l'est plus depuis la nº 566.
   * POURQUOI : le pied du panneau (le RAYON, posé par le moteur du web)
   * a besoin d'un moment pour dire « c'est fini, cherche ». Il ne peut
   * pas le savoir seul : l'ouverture vit ici, pas chez lui.
   * ⚠️ C'EST LE MÊME PRINCIPE QUE LA nº 364 pour le panneau des
   * filtres — « la fermeture annonce » — et pas un second mécanisme :
   * le brouillon et la comparaison restent chez l'appelant, cette
   * porte-ci ne fait que donner l'heure.
   * ⚠️ LES DEUX SIGNAUX SUPPRIMÉS PLUS BAS (`surEtatListe`, `surSaisie`)
   * étaient d'une autre nature : ils bavardaient à chaque lettre pour
   * personne. Celui-ci ne parle qu'à la fermeture, et quelqu'un écoute.
   */
  surFermeturePanneau?: () => void;
  /** §2 (nº 567, réduit nº 572) — LA PRISE DU MOTEUR SUR CE CHAMP. Il y
      dépose sa commande à chaque rendu ; le moteur la tire quand le lieu
      choisi n'ouvre aucun rayon. Voir le dépôt plus bas pour ce qu'elle
      fait, et ce qu'elle ne fait pas. */
  commandesDuChamp?: React.MutableRefObject<CommandesChampLocalisation | null>;
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

  /**
   * ██ §1 (nº 563) — ON NE DIT PAS DEUX FOIS « PLUS AUCUN LIEU » ██
   * ==================================================================
   * LE DÉFAUT, ÉTABLI PAR LA MESURE DE LA nº 562. En tapant « Lyon »
   * dans le champ de localité du moteur, la sonde relevait à CHAQUE
   * LETTRE une pose de défilement « par liste neuve » suivie de deux
   * rendus de mosaïque : le site relançait une recherche complète et
   * repeignait ses vingt-quatre cartes quatre fois en une seconde.
   *
   * LA CAUSE, NOMMÉE : la ligne `surChoix(null)` de l'`onChange` du
   * champ (« le texte a changé : plus de lieu validé »). Elle remonte
   * au moteur, qui fait `annoncer({ lieu: null })` — et `annoncer`
   * fabrique un OBJET NEUF de critères à chaque appel. Le parent ne
   * peut donc pas voir que rien n'a changé : il relance. Or, dès la
   * DEUXIÈME lettre, le lieu est déjà nul chez lui — on lui répétait
   * une nouvelle qu'il connaissait, et chaque répétition coûtait une
   * recherche et deux peintures.
   *
   * LE REMÈDE, ET C'EST LE PLUS SIMPLE : cette porte-ci se souvient de
   * ce qu'elle a annoncé en dernier, et REFUSE DE RÉPÉTER UN `null`.
   * Tout le reste passe comme avant — un lieu, même identique au
   * précédent, est toujours annoncé (rechoisir une ville doit pouvoir
   * relancer).
   *
   * ██ POURQUOI AUCUN DÉLAI D'ATTENTE, ET C'EST MIEUX QU'UN DÉLAI ██
   * La consigne demandait « d'attendre la fin de la frappe ». Cette
   * attente EXISTE DÉJÀ, et à l'endroit où elle a un sens : la
   * recherche des SUGGESTIONS est temporisée depuis toujours
   * (`PAUSE_FRAPPE_MS`, voir l'effet de recherche plus bas). Ce qui
   * n'était pas gardé, c'est l'ANNONCE DES CRITÈRES — et un délai n'y
   * serait pas le bon outil :
   *  · il ne ferait que RETARDER quatre recherches là où la garde en
   *    supprime trois — la quatrième étant elle-même inutile ;
   *  · il retarderait le seul cas légitime, la première frappe qui
   *    efface une ville déjà choisie, et le site paraîtrait mou là où
   *    il est juste ;
   *  · il ajouterait un minuteur à éteindre au démontage, donc une
   *    mécanique de plus à tenir.
   * ZÉRO MILLISECONDE, DONC. Rien n'est différé : ce qui disparaît,
   * c'est le travail qui n'avait pas lieu d'être.
   *
   * ⚠️ CE QUI RESTE IMMÉDIAT, ET LA GARDE N'Y TOUCHE PAS : les
   * suggestions s'affichent comme avant (elles ne passent pas par
   * `surChoix`), et le CHOIX d'une ville annonce sur-le-champ — donc
   * le pied du rayon reste ouvert (acquis nº 508), puisque c'est le
   * même appel qu'avant.
   * ⚠️ LA MÉMOIRE PART DE `lieuInitial`, comme `lieuCourant` juste
   * au-dessus : c'est exactement ce que le parent tient au montage. La
   * faire partir de `null` avalerait la première frappe utile — celle
   * qui efface une ville arrivée avec la page.
   */
  const dernierAnnonce = useRef<LieuTrouve | null>(lieuInitial ?? null);

  function annoncerAuMoteur(lieu: LieuTrouve | null) {
    if (lieu === null && dernierAnnonce.current === null) return;
    dernierAnnonce.current = lieu;
    surChoix(lieu);
  }

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
  //  §2 (nº 293), §3 (nº 294) — LE MENU DE LA LOCALITÉ ET DU RAYON
  //  assombrit tout l'écran, et le BLOC qui le contient reste clair
  //  (l'encadré style + localité du moteur, pas la seule moitié
  //  droite). Seulement CELUI DU MOTEUR : le champ vit aussi dans le
  //  formulaire de fiche, qui n'a rien demandé.
  //  nº 812 — plus AUCUN assombrissement : le voile est transparent
  //  (VoileDeLaPage). Il reste posé pour recevoir le clic à côté.
  useVoileDeLaPage(pourLeMoteur && listeOuverte, racine);
  /**
   * ██ §1 (nº 564) — LE VOILE SE POSE AU CLIC, PLUS À LA LISTE ██
   * ------------------------------------------------------------------
   * LE DÉFAUT : cliquer dans le champ de localité du moteur
   * n'assombrissait rien. Le voile n'arrivait qu'une seconde plus tard,
   * avec les suggestions — le temps de taper trois lettres, d'attendre
   * la pause de frappe et l'aller-retour réseau.
   *
   * LA CAUSE, NOMMÉE : le voile est bien accroché à `listeOuverte`
   * (juste au-dessus), mais `listeOuverte` ne passait pas à VRAI au
   * toucher. `auToucher()` n'ouvrait que s'il y avait déjà QUELQUE CHOSE
   * à montrer — un pied de rayon, des suggestions, une sélection. Sur un
   * champ vide, aucune des trois : l'ouverture attendait la réponse du
   * serveur, et le voile avec elle.
   *
   * LE CHAMP DE STYLE, LUI, N'A JAMAIS EU CE DÉFAUT — et pour une
   * raison qui ne s'applique pas ici : sa liste est le catalogue des
   * styles, il l'a en mémoire, elle s'ouvre donc AU CLIC. Son voile est
   * accroché de la même façon (`MenuDeroulant`, `avecVoile &&
   * listeVisible`), et il paraît instantané parce que sa liste l'est.
   * LES DEUX SONT DONC ALIGNÉS ICI, pas en changeant leur accroche,
   * mais en donnant à ce champ-ci ce que l'autre avait déjà : une
   * ouverture qui ne dépend pas du réseau.
   *
   * ⚠️ LE PANNEAU RESTE VIDE TANT QU'IL N'A RIEN À DIRE : il n'est
   * rendu que si des suggestions, un message ou un pied existent (voir
   * tout en bas). Ce qui s'ouvre au clic, c'est l'ÉTAT — donc le voile,
   * et la fermeture au clic dehors. Aucune boîte vide n'apparaît.
   *
   * ⚠️ LE DOIGT N'A RIEN À SUIVRE, ET CE N'EST PAS UN CHOIX DE STYLE :
   * `useVoileDeLaPage` REFUSE DE SE POSER sur un appareil tactile (il
   * lit `data-appareil` et rend la main). Il n'y a donc pas de voile en
   * retard au doigt — il n'y a pas de voile du tout. Ouvrir l'état au
   * toucher y changerait autre chose : la REMONTÉE du champ en haut de
   * l'écran est accrochée à `listeOuverte` (voir plus bas) et partirait
   * dès le toucher, avant même que la page se soit allongée. Rien ne le
   * demandait ; on n'y touche pas.
   * ⚠️ LE FORMULAIRE DE FICHE NON PLUS : il ne passe pas `pourLeMoteur`,
   * donc il n'a pas de voile, et rien à gagner à ouvrir un panneau vide.
   */
  const ouvrirDesLeToucher = pourLeMoteur && !panneauDansLeFlux;
  /**
   * §2 (nº 564) — LA FERMETURE, ANNONCÉE UNE FOIS, PAR TOUS LES CHEMINS.
   * L'effet ne fait rien à l'ouverture : c'est son NETTOYAGE qui parle.
   * React l'appelle quand `listeOuverte` retombe à faux — d'où que vienne
   * la fermeture — ET au démontage du champ s'il était encore ouvert.
   * Aucun chemin ne peut donc l'oublier, y compris ceux qu'on n'a pas
   * écrits.
   * ⚠️ LA RÉFÉRENCE VIVE, comme `fermerVive` du panneau des filtres
   * (nº 364) : l'effet ne se repose pas à chaque rendu, il garderait
   * sinon la fonction du rendu où il a été posé.
   */
  const fermetureVive = useRef(surFermeturePanneau);
  useEffect(() => {
    fermetureVive.current = surFermeturePanneau;
  });
  useEffect(() => {
    if (!listeOuverte) return;
    return () => fermetureVive.current?.();
  }, [listeOuverte]);
  /** VRAI pendant qu'un doigt est DANS le panneau : le blur du champ
      ne ferme alors rien (un défilement n'est pas un départ). */
  const interactionPanneau = useRef(false);
  /** De quoi couper une remontée en attente (voir plus bas). */
  const arret = useRef<(() => void) | null>(null);
  // Le démontage ne laisse aucun écouteur de redimensionnement derrière.
  useEffect(() => () => arret.current?.(), []);

  /**
   * §1 (nº 508) — LA REPRISE : ce champ remplace celui qu'un changement
   * de page vient d'emporter, et il en reprend le FOCUS.
   * ------------------------------------------------------------------
   * C'est tout ce qu'il y a à faire : le focus appelle `auToucher()`,
   * qui rouvre le panneau par le chemin ordinaire — même placement,
   * même voile, même pied de rayon. Aucun état d'ouverture n'est
   * reconstruit à la main, donc rien ne peut diverger de l'ouverture
   * normale.
   * ⚠️ `preventScroll` : la recherche vient de demander la liste EN
   * HAUT (nº 330). Un focus qui fait défiler la remettrait ailleurs.
   * ⚠️ ON NE VOLE LE FOCUS À PERSONNE : si quoi que ce soit d'autre
   * l'a déjà pris pendant la transition, on renonce. La note, elle,
   * est effacée dans tous les cas — elle ne vaut que pour ce
   * remplacement-ci.
   */
  useEffect(() => {
    if (!repriseDue(id)) return;
    oublierLaReprise();
    const actif = document.activeElement;
    if (actif && actif !== document.body && actif !== champ.current) return;
    champ.current?.focus({ preventScroll: true });
    //  `id` en dépendance plutôt qu'un tableau vide et une exception de
    //  règle : il ne change jamais en pratique, et s'il changeait, la
    //  note aurait déjà été effacée — l'effet ne peut agir qu'une fois.
  }, [id]);

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
      //  §2 (nº 567) — LE CORPS DE CETTE FERMETURE A ÉTÉ EXTRAIT tel
      //  quel dans `fermerLePanneau` (plus bas), pour que le moteur
      //  puisse refermer EXACTEMENT comme un clic ici — sans quoi il
      //  oublierait la restauration d'une saisie abandonnée. Rien n'a
      //  changé de ce que cette ligne faisait.
      //  ⚠️ SON APPELANT A CHANGÉ À LA nº 572 : le bouton « Valider » du
      //  pied est parti avec le pied ; c'est désormais le choix d'un
      //  PAYS ou d'une RÉGION qui tire la commande (§3 nº 568).
      fermerLePanneau();
    }
    //  §2 (nº 564) — ÉCHAP REFERME, ET IL N'EXISTAIT PAS ICI.
    //  Le panneau des filtres l'a depuis la nº 364, le menu des styles
    //  depuis toujours ; celui de la localité, non — la touche ne
    //  faisait rien du tout. Elle ne fait pas non plus cavalier seul :
    //  elle REND LA MAIN, et c'est le départ du champ — déjà écrit
    //  juste en dessous — qui referme, restaure et annonce. Un chemin
    //  de sortie de plus, aucune règle de plus.
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key !== "Escape") return;
      //  ⚠️ ÉCHAP EST UN DÉPART VOULU : le garde-fou du panneau (400 ms
      //  après un appui DEDANS — une pilule de rayon, par exemple) fait
      //  taire le blur, et l'aurait avalé.
      interactionPanneau.current = false;
      champ.current?.blur();
      //  Et si le focus était ailleurs, on referme quand même : le
      //  panneau ne doit jamais survivre à Échap.
      setListeOuverte(false);
    }
    document.addEventListener("pointerdown", auPointeurDehors);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("pointerdown", auPointeurDehors);
      document.removeEventListener("keydown", auClavier);
    };
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
          "Can't load suggestions right now — try again in a moment."
        );
        setListeOuverte(true);
        return;
      }
      setSuggestions(reponse.lieux);
      setMessage(
        reponse.lieux.length === 0
          ? "No place matches this search."
          : null
      );
      setListeOuverte(true);
    }, PAUSE_FRAPPE_MS);

    return () => clearTimeout(minuteur);
  }, [texte]);

  /**
   * §2 (nº 567, RÉDUIT nº 572) — LA COMMANDE QUE LE MOTEUR PEUT TIRER.
   * ------------------------------------------------------------------
   * LE PROBLÈME : l'ouverture du panneau vit ICI, et le moteur a un cas
   * où il doit le refermer lui-même — un pays ou une région n'ouvre
   * aucun rayon, il n'y a rien à régler (§3 nº 568).
   * LA PRISE : le même mécanisme que `actionValider` juste dessous — le
   * champ DÉPOSE sa fonction dans une référence que le parent tient.
   * Déposée à CHAQUE rendu, elle voit donc toujours l'état frais.
   * ⚠️ ELLE N'ANNONCE PAS : elle referme, et c'est la fermeture qui fait
   * annoncer le brouillon (§2 nº 564). Le moteur reste le seul à parler.
   */
  useEffect(() => {
    if (!commandesDuChamp) return;
    commandesDuChamp.current = {
      fermerLePanneau: () => {
        fermerLePanneau();
        champ.current?.blur(); // le geste est fini, le curseur s'en va
      },
    };
    return () => {
      if (commandesDuChamp) commandesDuChamp.current = null;
    };
  });

  // Déposé à CHAQUE rendu : la fonction voit l'état courant.
  useEffect(() => {
    if (!actionValider) return;
    actionValider.current = () => {
      if (listeOuverte && suggestions.length > 0) {
        choisir(suggestions[0]);
        return;
      }
      if (lieuCourant.current) annoncerAuMoteur(lieuCourant.current);
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
    //  §1 (nº 508) — ET SI LA RECHERCHE QUI SUIT CHANGE DE PAGE, LE
    //  CHAMP QUI ME REMPLACE REPRENDRA LE FOCUS. La note est posée
    //  AVANT `surChoix` : c'est lui qui déclenche la navigation, et
    //  le champ neuf peut être monté avant que cette fonction ne
    //  rende la main.
    if (garderOuvertApresChoix) noterLaReprise(id);
    //  §1 (nº 563) — LE CHOIX PASSE PAR LA MÊME PORTE, et il annonce
    //  TOUJOURS : la garde ne refuse que la RÉPÉTITION D'UN `null`.
    //  Rechoisir la même ville relance donc la recherche comme avant,
    //  et le pied du rayon s'ouvre dans le même geste (acquis nº 508).
    annoncerAuMoteur(lieu);
  }

  /**
   * §2 (nº 567) — LA FERMETURE VOULUE, EN UN SEUL CORPS.
   * ------------------------------------------------------------------
   * C'est mot pour mot ce que faisait le pointeur posé dehors ; il
   * l'appelle désormais, et le bouton « Valider » du pied du rayon
   * aussi. LES DEUX CHEMINS NE PEUVENT DONC PLUS DIVERGER — et c'est
   * tout l'intérêt : la restauration d'une saisie abandonnée
   * (`restaurerSiAbandon`) est facile à oublier quand on écrit une
   * fermeture de plus, et un « Valider » qui l'oublierait chercherait
   * « partout » alors qu'une ville était retenue.
   * ⚠️ IL N'ANNONCE RIEN LUI-MÊME : c'est la bascule de `listeOuverte`
   * qui réveille l'effet de fermeture du moteur (§2 nº 564), lequel
   * annonce le brouillon une fois et une seule.
   */
  function fermerLePanneau() {
    //  §1 (nº 508) — une fermeture VOULUE annule la reprise en attente.
    oublierLaReprise();
    setListeOuverte(false);
    restaurerSiAbandon();
    if (viderSiAbandon && !lieuCourant.current) {
      setTexte("");
      setSelectionActive(false);
    }
  }

  /**
   * §2 (nº 567) — LE CHAMP REDEVIENT VIDE À L'ÉCRAN, ET RIEN DE PLUS.
   * ------------------------------------------------------------------
   * Extrait du corps de la croix, sans un mot de changé. Il vide le
   * texte, la sélection, le lieu retenu, la mise de côté, la liste — et
   * referme. IL N'ANNONCE RIEN : c'est l'appelant qui décide de ce qui
   * part. La croix, juste dessous, annonce « plus aucun lieu » ; le
   * bouton « EFFACER » du pied, lui, annonce bien davantage (le style
   * avec), et le fait lui-même.
   */
  function viderLAffichage() {
    saisieUtilisateur.current = false;
    lieuCourant.current = null;
    memoire.current = null;
    //  §1 (nº 508) — une fermeture VOULUE annule la reprise en attente.
    oublierLaReprise();
    setTexte("");
    setSelectionActive(false);
    setListeOuverte(false);
    setSuggestions([]);
    setMessage(null);
  }

  /** LA CROIX : le lieu est effacé, le champ redevient vide — son
      fantôme (« Où ? ») reprend la parole, et la recherche redevient
      mondiale (« Partout »). */
  function effacerLieu() {
    viderLAffichage();
    champ.current?.blur(); // le clavier se referme, le choix est fait
    annoncerAuMoteur(null);
    /**
     * ██ §1 (nº 566) — LA CROIX ANNONCE ELLE-MÊME QUAND RIEN NE SE FERME ██
     * ----------------------------------------------------------------
     * LE DÉFAUT : la croix effaçait bien la ville — le champ se vidait,
     * le brouillon `{ valeur: null }` partait au moteur — mais LA
     * MOSAÏQUE NE BOUGEAIT PAS. Elle continuait d'afficher « Réalisme à
     * Lyon · 50 km ».
     *
     * LA CAUSE, ET ELLE N'EST NI DANS L'ENVELOPPE NI DANS LA
     * COMPARAISON (toutes deux font leur travail : l'enveloppe est bien
     * posée par ce chemin-ci, et « Lyon → rien » compte bien comme un
     * changement). ELLE EST DANS LE MOMENT DE LA LECTURE. Depuis la
     * nº 565, le brouillon n'est lu QU'À LA FERMETURE DU PANNEAU. Or
     * LA CROIX VIT DANS LE CHAMP, PAS DANS LE PANNEAU : elle s'affiche
     * dès qu'une ville est retenue, panneau ouvert ou fermé. Cliquée
     * sur un panneau DÉJÀ FERMÉ — le cas ordinaire, une recherche en
     * cours sous les yeux — le `setListeOuverte(false)` ci-dessus ne
     * change rien, aucun état ne bascule, aucun nettoyage d'effet ne
     * part, personne ne prévient le moteur. Le brouillon restait
     * déposé, et personne ne venait le lire.
     *
     * LE REMÈDE : quand rien ne se ferme, la croix le dit elle-même.
     * C'est le MÊME signal et le MÊME effet de fermeture — on ne double
     * rien : si le panneau était ouvert, sa fermeture s'en charge, et
     * la garde ci-dessous empêche la seconde annonce.
     * ⚠️ LE SIGNAL VEUT DIRE « LE CHAMP A RENDU SA RÉPONSE, LIS LE
     * BROUILLON » — la fermeture du panneau en est l'occasion la plus
     * fréquente, pas la seule. Voir le réglage `surFermeturePanneau`
     * tout en haut.
     * ⚠️ RIEN NE PART SI RIEN N'ÉCOUTE : le formulaire de fiche et la
     * page de recherche au doigt ne passent pas ce réglage, l'appel est
     * alors sans effet.
     */
    if (!listeOuverte) fermetureVive.current?.();
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
    //  §1 (nº 564) — ET SUR LE MOTEUR DU WEB, ON OUVRE SANS CONDITION :
    //  le voile doit se poser au clic, pas à l'arrivée des suggestions.
    if (
      ouvrirDesLeToucher ||
      piedPanneau ||
      suggestions.length > 0 ||
      selectionActive
    ) {
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
    annoncerAuMoteur(lieu);
  }

  const habillageChamp = sansBordure
    ? //  §2 (nº 258) — 46, la hauteur des cercles : le champ suivait
      //  son propre plancher de 48 et tenait l'encadré au-dessus des
      //  ronds voisins.
      `w-full h-full min-h-[46px] bg-transparent ${
        compact ? "px-3" : "px-4"
      } text-base outline-none overflow-hidden text-ellipsis
       text-sombre-texte placeholder:text-sombre-texte-doux`
    : robeDeMenu
      ? //  §4 (nº 303) — LA ROBE DU CHAMP DE STYLE, telle quelle :
        //  l'arrondi et les deux fonds viennent de `ROBE_CHAMP_SOMBRE`.
        //  Pas de contour — un menu n'en a pas. La hauteur reste celle
        //  du champ de localité (52), qui est aussi celle du champ de
        //  style au doigt (`min-h-[54px]` ⇒ le contenu commande).
        `w-full min-h-[52px] ${ROBE_CHAMP_SOMBRE.rayon} ${ROBE_CHAMP_SOMBRE.repos}
         px-4 text-base text-sombre-texte
         placeholder:text-sombre-texte-doux outline-none transition-colors
         ${ROBE_CHAMP_SOMBRE.actifAuFocus} overflow-hidden text-ellipsis`
      : //  ⚠️ PLUS DE CONTOUR (passe nº 112) : le fond suffit — au
        //  focus il s'éclaircit légèrement (nº 116, plus de trait
        //  rose), l'erreur allume un bord rouge. Cette branche ne sert
        //  QU'AU FORMULAIRE (le moteur passe `sansBordure` sur le web,
        //  `robeDeMenu` au doigt).
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
            aria-label="Suggested places"
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
                  /*  §1 (nº 553) — LE SURVOL SUIT LE FOND DU PANNEAU.
                       Il valait `bg-sombre-eleve`, qui est EXACTEMENT
                       le fond que `opaque` donne au panneau depuis
                       cette passe : les deux se confondraient et la
                       suggestion ne répondrait plus. Il monte donc du
                       même cran (1,21 sur le nouveau fond, contre 1,18
                       sur celui de la nº 552). Chaînes littérales : un
                       `hover:${…}` assemblé à l'exécution ne
                       produirait aucune règle Tailwind. */
                  className={`w-full min-h-[52px] px-4 py-2.5 text-left
                             transition-colors ${
                               opaque
                                 ? "hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair"
                                 : "hover:bg-sombre-eleve active:bg-sombre-eleve"
                             }`}
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
        aria-label={etiquette ?? "Location"}
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
          //  §1 (nº 563) — LA PORTE GARDÉE : elle n'annoncera ce
          //  « plus aucun lieu » qu'UNE fois, à la frappe qui efface
          //  vraiment une ville. Les suivantes ne coûtent plus rien.
          annoncerAuMoteur(null); // le texte a changé : plus de lieu validé
          if (valeur.trim().length < SAISIE_MINIMUM) {
            // Trop court pour chercher : on referme (le pied, quand il
            // existe, garde le panneau ouvert).
            setSuggestions([]);
            setMessage(null);
            //  ██ §1 (nº 565) — ET LE VOILE NE SAUTE PLUS À LA FRAPPE ██
            //  LE DÉFAUT : cliquer ouvrait (acquis nº 564), puis la
            //  PREMIÈRE LETTRE refermait — cette ligne-ci — et le voile
            //  disparaissait ; il ne revenait qu'à la TROISIÈME lettre,
            //  quand les suggestions arrivaient et rouvraient. Un
            //  clignotement à chaque saisie.
            //  LA CAUSE : cette ligne date d'AVANT la nº 564. À l'époque
            //  le panneau ne s'ouvrait que s'il avait quelque chose à
            //  montrer ; deux lettres ne montrant rien, refermer était
            //  juste. La nº 564 a changé la règle d'OUVERTURE sans
            //  changer celle-ci : le clic ouvrait, la frappe refermait.
            //  ⚠️ REFERMER RESTE JUSTE PARTOUT AILLEURS — au doigt et
            //  dans le formulaire de fiche, où rien ne s'ouvre à vide.
            //  C'est le même drapeau qu'à l'ouverture, donc les deux ne
            //  peuvent plus se contredire.
            setListeOuverte(ouvrirDesLeToucher || Boolean(piedPanneau));
          }
        }}
        onFocus={auToucher}
        onClick={auToucher}
        onBlur={() => {
          if (interactionPanneau.current) return;
          //  §1 (nº 508) — quitter le champ est une fermeture VOULUE :
          //  la reprise en attente n'a plus lieu d'être.
          //  ⚠️ ET LE DÉPART FORCÉ PAR UN DÉMONTAGE N'EN EST PAS UN :
          //  retirer du document un champ qui a le focus fait émettre
          //  un `blur` par le navigateur. Ce que la garde du dessus
          //  empêche déjà — choisir une suggestion est un
          //  `pointerdown` DANS le panneau, qui tient
          //  `interactionPanneau` 400 ms, bien plus que le temps de la
          //  navigation. QUI TOUCHERAIT À CE DÉLAI CASSERAIT LA
          //  REPRISE : c'est lui qui distingue « la personne s'en va »
          //  de « la page a changé sous mes pieds ».
          oublierLaReprise();
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
          aria-label="Clear the place — search anywhere"
          title="Clear the place"
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
            //  ⚠️ « EN VERRE » N'EST PLUS VRAI SANS CONDITION (nº 552) :
            //  il l'est tant que l'appelant ne passe pas `opaque`. Le
            //  moteur ne le passe pas et garde donc ce verre ; le
            //  formulaire le passe. Voir juste dessous.
            /*  §2 (nº 552) — `opaque` REMPLACE LE VERRE PAR LE JETON
                 `carte`. Mesuré : le verre des menus composé sur le
                 fond de page uniforme donne rgb(9,15,23), soit un
                 contraste de 1,00 avec la page — le panneau EST la
                 page. `carte` (#1A1F26) le remonte à 1,16. Le drapeau
                 n'est passé que par le formulaire ; la page de
                 recherche au doigt garde son verre. */
            className={`mt-1.5 flex min-h-0 flex-1 flex-col rounded-xl
                       text-sombre-texte overflow-hidden${
                         opaque ? " bg-sombre-eleve" : ""
                       }`}
            {...(opaque ? {} : { "data-verre-menu": "" })}
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
            //  ⚠️ LE FOND DU PANNEAU DES FILTRES, RECOPIÉ (nº 179-§1),
            //  ET CE N'EST TOUJOURS PAS UNE VALEUR À ELLE : cette
            //  fenêtre porte le RAYON une fois une ville choisie, elle
            //  s'ouvre souvent à côté du panneau des filtres, et les
            //  deux ne peuvent pas montrer deux gris différents. Elles
            //  ont donc toujours suivi le même fond — le verre des
            //  menus hier, le jeton `carte` depuis le §1 ci-dessous.
            //  C'est aussi pourquoi ses badges portent la robe « sur
            //  panneau », comme ceux des filtres (voir MoteurTatouage,
            //  `piedRayon`).
            /*  ██ §1 (nº 543) — CE PANNEAU-CI N'EST PLUS EN VERRE ██
                 C'est la « fenêtre du rayon » du propriétaire : celle
                 qui porte les paliers de distance une fois une ville
                 choisie. Elle écrit sa plaque À LA MAIN et ne passe pas
                 par `MenuDeVerre` — l'attribut de verre est donc
                 simplement retiré ici, et le jeton `carte` de la nº 466
                 le remplace (la teinte de « Mon compte », nº 542).
                 `globals.css` n'est pas touché (règle nº 172).
                 ⚠️ SEULE LA BRANCHE DU WEB EST VISÉE. Celle du DOIGT —
                 le panneau « dans le flux », juste au-dessus — garde
                 son verre : les surfaces du doigt ne sont pas dans
                 cette passe.
                 ⚠️ RIEN NE BOUGE D'UN PIXEL : le placement, la hauteur
                 maximale et le portail sont ceux d'avant. Et les badges
                 de rayon n'ont AUCUN fond (la robe « sur panneau ») :
                 ils ne perdent pas un cran d'écart. */
            /*  ██ §1 (nº 553) — `carte` N'EST PLUS DIT POUR TOUT LE
                 MONDE ██
                 CE QUE LA nº 543 AVAIT ÉCRIT, ET LE PIÈGE : elle a posé
                 `bg-sombre-carte` EN DUR sur cette branche. Or elle est
                 partagée — le formulaire au web l'ouvre, le MOTEUR au
                 web aussi. Le formulaire doit monter à `eleve` (ses
                 encadrés sont déjà à `carte`, le panneau s'y noyait) ;
                 le moteur, lui, ne doit pas bouger d'un cran — c'est là
                 que vit la « fenêtre du rayon » qui doit rester au même
                 gris que le panneau des filtres, la raison écrite
                 au-dessus.
                 LE JETON EST DONC DIT PAR L'APPELANT, comme partout
                 ailleurs dans ce fichier : `opaque` → `eleve`, sinon
                 `carte` au caractère près. Le moteur ne passe pas le
                 drapeau : il garde EXACTEMENT sa robe de la nº 543. */
            className={`z-[80] flex flex-col rounded-xl
                       text-sombre-texte overflow-hidden ${
                         opaque ? "bg-sombre-eleve" : "bg-sombre-carte"
                       }`}
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
