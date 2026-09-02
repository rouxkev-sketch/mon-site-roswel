"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
//  §2 (nº 646) — `ETATS_ROND_BARRE` a quitté cet import avec le fond
//  des deux boutons du compte. Il reste vivant ailleurs (la loupe, le
//  fanion, le globe, le sélecteur de langue) : rien n'est supprimé du
//  dépôt, ce menu ne l'emploie simplement plus.
import {
  IconeBouclierTrait,
  IconeChevronBas,
  IconeCloche,
  //  §2 (nº 541) — la croix de fermeture de la fenêtre du web : le même
  //  glyphe que celui des écrans « Notifications » et « Langue ».
  IconeCroix,
  IconeFanion,
  IconeAjouterPortfolio,
  IconeReglages,
  IconeSilhouette,
  IconeSortie,
  IconeUtilisateur,
} from "@/components/Icones";
//  §1 (nº 549), DÉPLACÉ À LA nº 640 — le rond de la TÊTE COMMUNE : la
//  photo de profil du portfolio affiché, au doigt comme au web.
//  Écriture unique du rond photo (nº 492).
//  §4 (nº 703) — LE ROND, PRIS À SON PROPRE FICHIER. Le viser dans
//  `BlocLieux` faisait entrer ici la pile de fiches, la fenêtre de
//  fiche et le contenu de fiche — et derrière eux le client de la
//  base, sur chaque page du site. Voir `components/PhotoRonde`.
import { PhotoRonde } from "@/components/PhotoRonde";
//  §1 (nº 645) — l'avatar de la barre : lu dans la session, rangé par
//  l'écriture unique de `lib/avatar-du-compte`.
//  §1 (nº 657) — le nom du compte rejoint la photo : les deux
//  morceaux de l'identité se lisent au même endroit.
//  §1 (nº 675) — la règle de l'identité affichée : ce qu'on montre
//  (photo + nom), la mémoire de la personne, et le rangement des deux
//  morceaux en un seul appel. Tout est écrit là-bas.
import {
  identiteDeLaPersonne,
  nomAffiche,
  rangerLIdentiteAffichee,
} from "@/lib/avatar-du-compte";
import dynamic from "next/dynamic";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { EntreeLangue, FenetreLangue } from "@/components/SelecteurLangue";

/**
 * ██ §1 (nº 685) — LA FENÊTRE DES NOUVELLES ARRIVE QUAND ON L'OUVRE ██
 * ------------------------------------------------------------------
 * Elle voyageait dans le morceau de programme commun — celui de 195 ko
 * que TOUTE page connectée tire —, alors qu'elle ne s'affiche que si
 * l'on touche la cloche. `next/dynamic` l'en sort.
 * ⚠️ LE COMPTEUR NE DÉPEND PAS D'ELLE, et c'est ce qui rend la sortie
 * sans danger : le point rose et le nombre de la cloche se lisent dans
 * le MAGASIN (`lib/magasin-notifications`, nº 672), pas dans cette
 * fenêtre. Ils restent donc justes dès l'arrivée sur la page, exactement
 * comme la nº 664 l'exige — rien n'attend ce morceau-ci.
 * ⚠️ CE QUE ÇA COÛTE : à la PREMIÈRE ouverture d'un document, le
 * morceau doit arriver. Les suivantes sont immédiates.
 * ⚠️ `ssr: false` : cette fenêtre n'existe qu'après un geste, il n'y a
 * jamais de HTML à en tirer côté serveur.
 */
const FenetreNotifications = dynamic(
  () =>
    import("@/components/FenetreNotifications").then(
      (m) => m.FenetreNotifications
    ),
  { ssr: false }
);
/**
 * ██ §3 (nº 703) — LA FENÊTRE « MODIFIER » ARRIVE QUAND ON L'OUVRE ██
 * ------------------------------------------------------------------
 * §1 (nº 657) — la fenêtre « Modifier », quatrième surface de la barre.
 * Elle sort du morceau commun EXACTEMENT comme la fenêtre des nouvelles
 * à la nº 685, et pour une raison mesurée : elle lit et écrit dans la
 * base, donc elle importait le client de la base, donc TOUTES LES PAGES
 * du site le téléchargeaient — mentions légales comprises — pour une
 * fenêtre qui ne s'affiche qu'après un clic sur « Modifier ».
 * ⚠️ RIEN N'ATTEND CE MORCEAU AVANT LE GESTE : la fenêtre est montée
 * derrière `identiteOuverte &&`, elle n'existe pas tant qu'on ne l'a
 * pas ouverte. Le nom affiché, l'avatar et le point rose se lisent
 * ailleurs (le cookie et le magasin) et ne bougent pas d'un instant.
 * ⚠️ CE QUE ÇA COÛTE : à la PREMIÈRE ouverture, le morceau doit
 * arriver. Les suivantes sont immédiates.
 * ⚠️ `ssr: false` : cette fenêtre n'existe qu'après un geste, il n'y a
 * jamais de HTML à en tirer côté serveur.
 */
const FenetreIdentite = dynamic(
  () =>
    import("@/components/FenetreIdentite").then((m) => m.FenetreIdentite),
  { ssr: false }
);
import {
  CLASSE_ENCADRE_FENETRE,
  LARGEUR_FENETRE_BARRE,
  MenuDeVerre,
} from "@/components/SurfaceDeVerre";
//  §1 (nº 650) — l'écart entre les deux familles de déclencheurs de la
//  barre, calculé et expliqué là où vit la règle de placement.
import { ALIGNEMENT_BOUTON_ROND_BARRE } from "@/components/placement-menu";
//  §4 (nº 465) — au doigt, « Mon compte » est une PAGE plein écran (le
//  gabarit de la page de recherche), plus une fenêtre centrée.
import { PagePleinEcranMobile } from "@/components/PagePleinEcranMobile";
//  §1 (nº 469) — le verrou de défilement compté (surfaces empilées).
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";
import { FenetreNonEnregistre } from "@/components/GardeSaisie";
import {
  COULEUR_ETAT,
  LIBELLE_ETAT,
  chargerFichesDuCompte,
  etatDeLaFiche,
  ficheActive,
  memoriserFiche,
  type EtatFiche,
  type FicheDuCompte,
} from "@/lib/fiches-compte";
//  §1 (nº 672) — les nouvelles vivent dans un MAGASIN DE MODULE, plus
//  dans l'état de ce composant : la barre est démontée à chaque
//  changement de route (elle est rendue par les pages, pas par la mise
//  en page), et l'état partait avec elle. Voir le fichier.
import {
  lireLesNouvelles as lireLesNouvellesDuCompte,
  marquerLue,
  marquerToutLu,
  semerLesNouvelles,
  useNotifications,
} from "@/lib/magasin-notifications";
//  §1 (nº 703) — le client de la base arrive À LA DEMANDE : ce
//  composant vit dans le tronc, et son import direct pesait 62 Ko
//  compressés sur toutes les pages (voir client-a-la-demande).
import { clientSupabaseALaDemande } from "@/lib/supabase/client-a-la-demande";
import { travailEnCours } from "@/lib/travail-en-cours";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
import { useAppareilMobile } from "@/lib/appareil";
//  §4 (nº 330) — la consigne « pas de photo en haut » des liens
//  internes, posée par l'écriture unique.
//  §2 (nº 703) — LA MÊME ÉCRITURE, PRISE À LA FEUILLE. Elle vivait
//  dans `ContenuFiche` ; la réclamer là-bas faisait entrer LA FICHE
//  ENTIÈRE dans le menu — donc dans l'en-tête, donc sur toutes les
//  pages — et, derrière elle, le client de la base. Le déménagement
//  et la mesure sont expliqués dans `lib/lien-interne`.
import { avecConsigneDeLienInterne } from "@/lib/lien-interne";
//  §7 (nº 662) — la couleur des liens des fiches, écrite une seule
//  fois depuis la nº 388 : la ligne « Éditer » la prend telle quelle.
import { LIEN_QUI_SORT } from "@/components/lignes-profil";
//  §3 (nº 330) — l'étape d'historique, écriture unique des quatre
//  surfaces qui couvrent l'écran.
import {
  laNavigationRemplaceLEtape,
  laSurfaceVaNaviguer,
  useEtapeQuiSeReferme,
} from "@/lib/etape-refermable";
//  §1 (nº 741) — l'abonnement aux changements d'adresse, l'écriture
//  unique du site (elle enveloppe pushState/replaceState et écoute le
//  retour) : c'est lui qui dit à la fenêtre que l'arrivée a eu lieu.
import { souscrireAdresse } from "@/lib/adresse-courante";

/**
 * LE MENU « MON ESPACE » — le compte du tatoueur, depuis la barre
 * ================================================================
 * Connecté, le bouton de compte n'emmène plus nulle part : il OUVRE ce
 * menu. Un compte pouvant désormais gérer PLUSIEURS FICHES, le menu se
 * lit en deux temps — ce qui appartient au COMPTE, et ce qui
 * appartient à LA FICHE CHOISIE :
 *
 *   1. NOTIFICATIONS — la cloche, et le nombre de non lues posé à
 *      côté du titre en pastille discrète (jamais un gros compteur).
 *
 *   2. AJOUTER UN PORTFOLIO — une entrée du MENU, et la SEULE.
 *      Elle vivait AUSSI en pied du déroulant : deux chemins pour la
 *      même action, dans deux vocabulaires (une entrée grise en haut,
 *      un bouton vert en bas). Créer un portfolio relève du COMPTE,
 *      pas du portfolio qu'on regarde : sa place est ici.
 *
 *   ▓ LE BLOC DU PORTFOLIO — un fond un cran plus clair, d'un bord
 *   ▓ à l'autre de la fenêtre, SANS aucun cadre dessiné :
 *   ▓   3. LE SÉLECTEUR — le portfolio courant, son ÉTAT en deuxième
 *   ▓      ligne (une pastille de 6 px et un mot), et un VRAI menu
 *   ▓      déroulant qui se pose PAR-DESSUS le reste.
 *   ▓      ⚠️ CHAQUE ENTRÉE DE LA LISTE EST COMPOSÉE COMME CELLE-CI :
 *   ▓      le nom, puis la pastille et l'état SOUS le nom. Une liste
 *   ▓      qui ne ressemble pas à son champ oblige à relire.
 *   ▓   4. MODIFICATION
 *   ▓   5. MON PORTFOLIO
 *
 *   6. SÉCURITÉ
 *   7. DÉCONNEXION — SANS changer de page : la session s'efface, et
 *      c'est la page elle-même qui réagit.
 *
 * POURQUOI CE FOND, ET PAS UN CADRE : tout ce qu'il couvre dépend de
 * la fiche choisie en tête ; ce qui est au-dessus et en dessous
 * concerne le compte entier. Une nuance de fond dit cela sans ajouter
 * une boîte dans une boîte — et elle va d'un bord à l'autre, ce qu'un
 * cadre arrondi ne sait pas faire.
 *
 * DEUX HABILLAGES, UN PAR APPAREIL :
 *  - WEB : la fenêtre posée SOUS le bouton de compte, au format exact
 *    du panneau des filtres (même encadré, même ombre) ;
 *  - SMARTPHONE (§4, nº 465) : une PAGE PLEIN ÉCRAN — le gabarit de la
 *    page de recherche du doigt (`PagePleinEcranMobile`), qui remplace
 *    la fenêtre centrée à voile de la nº 238. Elle est posée dans
 *    <body> (le portail du composant partagé) : le flou d'arrière-plan
 *    de la barre fixe ferait sinon d'elle le repère des « fixes ».
 */

/**
 * ██ §1 (nº 647) — L'EMPREINTE DE LA ZONE DU COMPTE, ÉCRITE UNE FOIS ██
 * ==================================================================
 * POURQUOI CETTE CONSTANTE EXISTE, ET C'EST UNE LEÇON PAYÉE DEUX FOIS.
 * La barre garde une RÉSERVE NEUTRE (nº 439, EnTeteTatouage) qui prend
 * la place de cette zone pendant la phase muette d'un connecté : sans
 * elle, l'empreinte du DÉCONNECTÉ (la capsule « Se connecter ») tient
 * la place jusqu'à l'hydratation, et le bloc central de la barre —
 * centré par deux marges automatiques — se recale sous les yeux.
 * LA RÉSERVE DOIT DONC VALOIR CETTE ZONE AU PIXEL. La nº 509 l'avait
 * déjà rattrapée après la nº 465 ; sa note disait « si quelqu'un change
 * le `-mr-2` de MenuEspace, c'est ici qu'il faut le suivre ». La nº 646
 * l'a changé — deux variantes d'appareil au lieu d'un nombre — et ne
 * l'a pas suivi : le décalage est revenu.
 * LE REMÈDE EST LE SEUL QUI FERME LA PORTE : les deux endroits ne
 * peuvent plus se contredire puisqu'ils lisent LA MÊME chaîne. Il n'y a
 * plus rien à « suivre » à la main.
 * ⚠️ CE QU'ELLE CONTIENT : les marges qui font l'EMPREINTE, jamais la
 * boîte. La cible mesure 40 px des deux côtés (`HAUTEUR_ACTIONS`) ; ce
 * sont ces marges qui disent ce qu'elle OCCUPE dans la rangée — 34 px
 * au doigt (40 − 6), 42 px au web (40 − 4 + 6).
 */
export const EMPREINTE_ZONE_COMPTE =
  "mobile:-mr-1.5 not-mobile:-mr-1 not-mobile:ml-1.5";

/**
 * ██ §1-b (nº 668), REMPLACÉ PAR LE §1 DE LA nº 672 ██
 * ==================================================================
 * CE QUI VIVAIT ICI : `const nouvellesSemees = new Set<string>()`, la
 * marque « les nouvelles ont déjà été semées pour ce compte ». Elle
 * avait remplacé un `sessionStorage` (nº 664) qui survivait à un
 * changement de DOCUMENT, et la nº 668 avait énoncé la bonne règle —
 * « une garde ne doit pas survivre à ce qu'elle garde » — en
 * l'appliquant à la mauvaise durée de vie.
 * POURQUOI ELLE S'EN VA. L'état qu'elle protégeait (`notifications`)
 * ne mourait pas avec le document mais À CHAQUE CHANGEMENT DE ROUTE :
 * la barre fixe est rendue par les PAGES, jamais par la mise en page —
 * naviguer de « / » vers « /recherche » la démonte, l'état repart vide,
 * et la marque, elle, restait. Plus de relecture, plus de compteur,
 * plus de point rose : le défaut que le propriétaire relève au point 1
 * de la nº 672.
 * OÙ ELLE EST PASSÉE, ET POURQUOI IL N'Y A PLUS DE MARQUE DU TOUT : les
 * nouvelles vivent dans un MAGASIN DE MODULE (`lib/magasin-
 * notifications`), écrit comme celui de la session (nº 632). La garde
 * n'y est plus une variable À CÔTÉ de l'état — elle EST l'état : « pour
 * quel compte la liste que j'ai a-t-elle été chargée ? ». Deux choses
 * qui n'en font plus qu'une ne peuvent plus se contredire.
 */

/**
 * ██ §2 (nº 713) — LE RATTRAPAGE DU PORTFOLIO DISPARU N'A LIEU QU'UNE
 * ██ FOIS PAR DOCUMENT ██
 * ==================================================================
 * ICI, ET PAS DANS UN `useRef` : la barre est rendue par CHAQUE page
 * (nº 672), donc un verrou de composant meurt à chaque navigation
 * douce et laisse le rattrapage repartir sur toutes les pages. Cette
 * marque-ci vit avec le DOCUMENT — la durée exacte de ce qu'elle
 * garde. La mesure, la raison et ce qu'on y perd sont écrits sur
 * l'effet lui-même (§3 nº 700, §2 nº 713).
 * ⚠️ ELLE NE CONNAÎT PAS LE COMPTE, et n'en a pas besoin : un
 * changement de compte passe par une reconnexion, donc par un
 * document neuf.
 */
let rattrapageFait = false;

export function MenuEspace({
  idUtilisateur,
  nom,
  hauteur,
}: {
  idUtilisateur: string;
  /** Le nom du compte (info-bulle du déclencheur). */
  nom: string;
  /** La hauteur des boutons de la barre (alignement au pixel). */
  hauteur: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  /*  ⚠️ PLUS DE REPÈRE « NON PUBLIQUE » DANS LE MENU (passe nº 133).
      Il ne disait rien à personne d'autre qu'à l'administrateur, et il
      encombrait deux lignes du sélecteur — celle du portfolio choisi
      ET chacune de la liste. L'information n'est pas perdue : elle vit
      dans /admin, section des fiches d'essai, avec son interrupteur.
      C'est là qu'on la règle ; c'est donc là qu'on la lit. */
  /** TOUTES les fiches du compte, et celle sur laquelle on travaille. */
  const [fiches, setFiches] = useState<FicheDuCompte[]>([]);
  const [idFiche, setIdFiche] = useState<string | null>(null);
  const [selecteurOuvert, setSelecteurOuvert] = useState(false);
  /** Les nouvelles du compte, et leur fenêtre.
      §1 (nº 672) — LA LISTE NE VIT PLUS ICI : elle est lue dans le
      magasin de module, qui survit au démontage de la barre. Cette
      ligne-ci ne fait plus que s'y abonner. */
  const notifications = useNotifications();
  const [notificationsOuvertes, setNotificationsOuvertes] = useState(false);
  /** La fenêtre des langues (nº 238-§5) : montée par le MENU, pas par
      sa ligne — elle survit donc à la fermeture du menu. */
  const [langueOuverte, setLangueOuverte] = useState(false);
  /** §1 (nº 657) — LA FENÊTRE « MODIFIER » du particulier, montée comme
      les deux précédentes : par le MENU, jamais par la ligne qui
      l'ouvre — elle doit survivre à la fermeture de « Mon compte ». */
  const [identiteOuverte, setIdentiteOuverte] = useState(false);
  /** L'avertissement « tu as une saisie en cours » — voir plus bas. */
  const [avertirAvantCreation, setAvertirAvantCreation] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  /**
   * ██ §1 (nº 688) — LE CONTENEUR DU DÉROULANT SE RECONNAÎT PAR UNE
   * MARQUE, PLUS PAR UN `ref` ██
   * ------------------------------------------------------------------
   * CE QUI ÉTAIT ÉCRIT ICI, ET POURQUOI ÇA NE POUVAIT PAS MARCHER : un
   * `useRef` unique — `conteneurSelecteur` — que la garde de fermeture
   * (§7-a nº 532) interrogeait pour savoir si un clic était « dedans ».
   * Or `contenuDuCompte` est monté DEUX FOIS quand le menu est ouvert :
   * la fenêtre du web et la page du doigt sont TOUTES LES DEUX dans
   * l'arbre, l'une masquée par la feuille (`mobile:hidden` /
   * `hidden mobile:flex`). Le même objet `ref` recevait donc les deux
   * conteneurs, et n'en gardait qu'UN — le dernier monté, celui du
   * DOIGT.
   * CE QUE ÇA DONNAIT AU WEB, mesuré au banc : le déroulant s'ouvrait,
   * défilait, et cliquer une entrée NE FAISAIT RIEN. La garde ne
   * reconnaissait pas le conteneur visible (elle tenait celui du doigt),
   * avalait le clic en capture sur `window` — `stopPropagation` — et le
   * bouton de l'entrée ne le voyait jamais. `memoriserFiche` ne
   * s'écrivait pas : la preuve que `choisirFiche` n'avait pas tourné.
   * AU DOIGT tout marchait, et c'est la même cause vue de l'autre côté.
   * ⚠️ LA SUPPRESSION ADMIN N'Y EST POUR RIEN. Le banc a rejoué le cas
   * exact du propriétaire — un portfolio supprimé, encore mémorisé dans
   * le navigateur — et le résultat est identique au cas sain : le
   * défaut est celui du web, pas celui de la suppression.
   * LE REMÈDE : une MARQUE sur le conteneur (`data-selecteur-portfolio`),
   * que la garde retrouve avec `closest`. Elle vaut pour les deux
   * arbres à la fois, sans rien connaître de l'appareil (piège nº 60) —
   * et il n'y a plus de « dernier monté » qui puisse gagner.
   * ⚠️ LE NOM EST ÉCRIT UNE SEULE FOIS, et le sélecteur CSS est
   * assemblé à partir de lui : deux écritures finiraient par diverger,
   * et — piège de la nº 681 — un `[…]` écrit d'un tenant dans un
   * fichier scanné peut faire naître une règle dans la feuille. Assemblé,
   * il n'apparaît nulle part tel quel.
   */
  const NOM_MARQUE_SELECTEUR = "data-selecteur-portfolio";
  const MARQUE_SELECTEUR = { [NOM_MARQUE_SELECTEUR]: "" };
  const DANS_LE_SELECTEUR = `[${NOM_MARQUE_SELECTEUR}]`;
  //  §2 (nº 293), §3 (nº 294) — LA FENÊTRE DU COMPTE assombrit tout
  //  l'écran, et son déclencheur reste clair. Web uniquement : le
  //  crochet s'écarte de lui-même au doigt.
  /**
   * ██ §2 (nº 674) — PLUS DE TROU AUTOUR DE L'AVATAR ██
   * ------------------------------------------------------------------
   * LE DÉFAUT DU PROPRIÉTAIRE : « cliquer l'avatar de la barre dessine
   * un carré plus clair que le fond autour de lui ». Il soupçonnait le
   * focus du navigateur ; ce n'est pas lui — le contour de mise au
   * point est rond (il suit le `rounded-full` du bouton) et rose.
   * LA CAUSE EST LE VOILE DE LA PAGE, et elle se lit dans sa propre
   * note (nº 294) : « le bloc qui contient l'élément ouvert RESTE
   * CLAIR — sinon on ne lit plus ce qu'on écrit », et il l'épargne en
   * PERÇANT un trou aux dimensions de sa boîte. Le bloc passé ici est
   * `zone`, un conteneur en rangée SANS arrondi : le trou est donc un
   * RECTANGLE de pleine lumière au milieu d'un écran assombri. C'est
   * exactement le « carré plus clair » — il n'est pas dessiné, c'est
   * le reste qui est peint autour.
   * LE REMÈDE : ON N'ÉPARGNE PLUS RIEN. La raison d'épargner ne vaut
   * que pour ce qu'on LIT ou ce qu'on ÉCRIT pendant que la surface est
   * ouverte — l'encadré du moteur, où l'on tape une ville. Ici, le
   * bloc n'est qu'un bouton rond : rien à lire, rien à écrire, et la
   * fenêtre est ailleurs. Le voile redevient plein écran, uniforme,
   * comme le prévoit déjà la signature du crochet (« Omis : rien n'est
   * épargné »). Pas une ligne de mécanisme n'est touchée.
   * ⚠️ CE QUE ÇA CHANGE POUR L'ŒIL : l'avatar s'assombrit avec tout le
   * reste au lieu de rester en pleine lumière dans son rectangle. C'est
   * la demande — « le fond reste inchangé au clic ».
   * ⚠️ LE MOTEUR DE RECHERCHE NE BOUGE PAS D'UN PIXEL : il garde son
   * épargne (`MoteurTatouage`, `ChampLocalisation`), et pour la bonne
   * raison — on y saisit.
   */
  useVoileDeLaPage(ouvert);
  /**
   * §3 (nº 330) — LE RETOUR DU TÉLÉPHONE REFERME CE MENU.
   * ------------------------------------------------------------------
   * Troisième des quatre surfaces du C-4 (inventaire nº 327). Au
   * doigt, ce menu occupe l'écran derrière son voile : le bouton
   * retour doit le refermer, pas quitter la page qu'on regardait.
   * ⚠️ AU DOIGT SEULEMENT. Sur le web c'est une fenêtre posée SOUS LE
   * BOUTON, qui ne recouvre rien : elle n'a aucune raison de peser sur
   * l'historique. `useAppareilMobile` lit `data-appareil` — un DOIGT,
   * jamais une largeur (la règle du site depuis la nº 60).
   * ⚠️ ET SI UNE ENTRÉE MÈNE AILLEURS (« Ma sélection », « Mon
   * portfolio »…), l'écriture unique ne reprend pas son étape : elle
   * n'est plus celle du dessus, et reculer annulerait la navigation
   * qu'on vient de demander.
   */
  const auDoigt = useAppareilMobile();
  useEtapeQuiSeReferme(auDoigt && ouvert, () => setOuvert(false));
  /**
   * ██ §7-b (nº 532) — LE RETOUR REFERME LE DÉROULANT, PUIS LA PAGE ██
   * ------------------------------------------------------------------
   * Le déroulant du portfolio est une surface de plus : ouvert, il doit
   * répondre au bouton retour du téléphone AVANT la page qui le porte.
   * C'est L'ÉCRITURE DÉJÀ LÀ, celle des pages plein écran (nº 465,
   * nº 474) : elle pose une étape par surface et les EMPILE PAR RANG —
   * un retour ne referme que celle dont l'étape a sauté. Deux appels du
   * même crochet dans ce composant se rangent donc d'eux-mêmes : le
   * déroulant se ferme au premier appui, « Mon compte » au second.
   * ⚠️ AU DOIGT SEULEMENT, comme le menu lui-même : au web le déroulant
   * vit dans une fenêtre posée sous un bouton, qui ne pèse pas sur
   * l'historique. Rien n'y change.
   * ⚠️ ET LE COMPTE D'ÉTAPES NE DÉRIVE PAS : une ouverture, une entrée ;
   * la fermeture reprend la sienne (nº 332-§1 et §4).
   */
  useEtapeQuiSeReferme(auDoigt && selecteurOuvert, () =>
    setSelecteurOuvert(false)
  );
  /**
   * ██ §7-a (nº 532) — UN APPUI À CÔTÉ FERME, ET RIEN D'AUTRE ██
   * ------------------------------------------------------------------
   * LE DÉROULANT N'AVAIT AUCUNE FERMETURE AU DEHORS : il fallait
   * retoucher son champ. On en ajoute une — et c'est LA LEÇON DE LA
   * nº 464 qui dicte comment.
   * CE QU'ELLE DIT : fermer sur l'APPUI (`pointerdown`) démonte la
   * cible avant le lever du doigt ; le navigateur fabrique alors le
   * `click` du tap, refait son test de position dans un document qui a
   * changé, et ce clic atterrit sur ce qui se trouve dessous — et
   * l'actionne. On ferme donc sur le `click`, le DERNIER événement du
   * tap, et on le CONSOMME.
   * OÙ ON ÉCOUTE, ET POURQUOI C'EST `window` EN CAPTURE : la capture
   * descend de `window` vers la cible. Un écouteur posé sur `window`
   * voit donc le clic AVANT tout le monde — avant la cible, et avant
   * les écouteurs de `document` (celui de l'étape refermable en est
   * un). `stopPropagation` y arrête l'événement pour de bon : rien ne
   * s'actionne, et aucune marque de navigation n'est armée à tort.
   * ⚠️ CE QUI EST DEDANS N'EST PAS « À CÔTÉ » : le champ lui-même (qui
   * se referme par son propre geste) et les entrées de la liste (qui
   * choisissent un portfolio) sont dans le conteneur, et passent — la
   * liste est `absolute` DEDANS, jamais dans un portail.
   * ⚠️ ET « LE CONTENEUR » EN VEUT DIRE DEUX (nº 688) : la phrase
   * ci-dessus était juste, la MÉCANIQUE ne l'était pas. Il y a deux
   * conteneurs dans le document — la fenêtre du web et la page du
   * doigt —, le `ref` unique n'en retenait qu'un, et l'autre voyait
   * ses entrées avalées. C'est une marque, désormais, et `closest` les
   * reconnaît tous les deux. La note du §1 (nº 688) raconte la mesure.
   *
   * ██ §2 (nº 642) — LE WEB L'A MAINTENANT, ET IL NE L'AVAIT JAMAIS EU ██
   * ------------------------------------------------------------------
   * LA CAUSE DU RELEVÉ, NOMMÉE, ET CE N'EST PAS UN ACQUIS DÉFAIT :
   * cette garde s'ouvrait sur `if (!auDoigt …) return;` depuis le jour
   * de son écriture (nº 532-§7a), et la note qui la suivait le disait
   * en toutes lettres — « au doigt seulement ». La nº 531 avait posé la
   * fermeture au clic à côté pour LA PAGE DU DOIGT ; la fenêtre du web
   * n'a jamais rien reçu. D'où les DEUX symptômes ensemble, qui n'en
   * font qu'un : personne n'écoutait, donc le déroulant restait ouvert
   * ET le clic suivait son cours normal jusqu'à ce qu'il touchait —
   * « Déconnexion » comprise.
   * CE QUI CHANGE : la borne d'appareil tombe. Le mécanisme, lui, n'est
   * pas retouché d'une ligne — même écoute en capture sur `window`,
   * même consommation, même exception pour le conteneur.
   * ⚠️ UN CLIC HORS DE LA FENÊTRE : le `mousedown` qui referme « Mon
   * compte » (l'écouteur plus bas) passe AVANT ce clic-ci et n'est pas
   * touché ; le clic, lui, est avalé — la fenêtre se ferme, et rien ne
   * s'actionne derrière. C'est la règle demandée, « ferme, et rien
   * d'autre », appliquée au dehors comme au dedans.
   */
  useEffect(() => {
    if (!selecteurOuvert) return;
    const avaler = (evenement: MouseEvent) => {
      const cible = evenement.target;
      //  §1 (nº 688) — LA MARQUE, PAS UN `ref` : les DEUX conteneurs
      //  (fenêtre du web et page du doigt) la portent, et `closest` les
      //  reconnaît tous les deux. Voir la note du §1, plus haut.
      if (cible instanceof Element && cible.closest(DANS_LE_SELECTEUR)) {
        return;
      }
      evenement.preventDefault();
      evenement.stopPropagation();
      setSelecteurOuvert(false);
    };
    window.addEventListener("click", avaler, true);
    return () => window.removeEventListener("click", avaler, true);
  }, [selecteurOuvert, DANS_LE_SELECTEUR]);
  /**
   * §1 (nº 332) — ET SES LIENS CONSOMMENT CETTE ÉTAPE, ils ne
   * l'empilent pas.
   * ------------------------------------------------------------------
   * C'est la même règle que pour la page de recherche (voir
   * `laNavigationRemplaceLEtape`) : l'étape du menu porte l'adresse de
   * la page qu'on regardait ; une navigation qui la REMPLACE la
   * consomme, et l'on obtient `[page] → [destination]`, sans jumelle
   * entre les deux. Un empilement ordinaire laisserait une entrée
   * invisible portant l'adresse de la page — exactement le défaut du
   * nº 22 du recensement.
   * ⚠️ SUR LE WEB, le menu ne pose aucune étape : la réponse est faux,
   * et les liens empilent normalement. Rien ne change de ce côté.
   * ⚠️ LU AU RENDU, ce qui est juste : l'étape est posée à l'ouverture
   * du menu et n'est plus touchée tant qu'il est ouvert.
   */
  const liensRemplacent = auDoigt && ouvert && laNavigationRemplaceLEtape();
  /** La plaque du menu web — montée dans le corps du document
      (nº 238-§4) : la fermeture au clic dehors doit la connaître.
      ⚠️ L'ANCRE DU MENU EST `zone`, PAS UN DES DEUX BOUTONS : il y en a
      deux (écran étroit / large) et l'un des deux est toujours
      `display: none`, donc sans boîte à mesurer. La zone, elle, a
      toujours celle du bouton visible. */
  const plaqueWeb = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fiche = ficheActive(fiches, idFiche);
  const etat: EtatFiche = etatDeLaFiche(fiche);
  /**
   * ██ §1 (nº 645) — L'AVATAR DE LA BARRE, LU DANS LA SESSION ██
   * ------------------------------------------------------------------
   * `photoDuCompte` vient de `user_metadata`, donc du COOKIE : elle est
   * connue dès le premier rendu, serveur compris — aucune requête,
   * aucun clignotement (la voie B de la nº 644, méthode nº 632).
   * ⚠️ CE N'EST PAS `fiche?.photo_profil` QU'ON AFFICHE, et c'est tout
   * le point : `fiches` est VIDE tant que le menu n'a pas été ouvert
   * (acquis nº 142, jamais rouvert). La session, elle, sait déjà.
   */
  /*  §1 (nº 657) — LE NOM DU COMPTE ARRIVE PAR LE MÊME CHEMIN, et
      c'est `nomAffiche` qui le lit depuis la nº 675 — PAS le `nom` de
      ce crochet, qui se replie sur le début de l'adresse e-mail pour ne
      jamais rendre une chaîne vide à une info-bulle. La tête a besoin
      de savoir si un nom EXISTE : sans nom, elle écrit « Mon compte ».
      (Jusqu'à la nº 674 c'était `nomDuCompte`, qui ne connaît que la
      personne — la tête ignorait donc le nom du portfolio tant que la
      liste des fiches n'était pas lue.) */
  const { utilisateur, photo: photoDuCompte } = useUtilisateur();
  /*  §1 (nº 675) — LE NOM AFFICHÉ, pendant de `photoDuCompte` : celui
      du PORTFOLIO quand il y en a un, celui de la personne sinon. Il
      vit dans la session comme la photo, donc dans le cookie — la barre
      l'a sans une requête. */
  const nomAfficheDuCompte = nomAffiche(utilisateur);
  /*  §1 (nº 675) — L'INFO-BULLE DES DEUX BOUTONS DE LA BARRE SUIT LA
      MÊME RÈGLE. Elle disait le nom de la PERSONNE quoi qu'il arrive ;
      elle dit désormais le nom AFFICHÉ — celui du portfolio tant qu'il
      en existe un. Le `nom` reçu du parent reste le REPLI, et il est
      nécessaire : lui seul se rabat sur le début de l'adresse e-mail,
      pour ne jamais rendre une info-bulle vide (voir useUtilisateur). */
  const nomDeLInfobulle = nomAfficheDuCompte || nom;
  /*  §1 (nº 645) — LE COMPTE A-T-IL ÉTÉ LU AU MOINS UNE FOIS ? Sans ce
      drapeau, l'effet qui range la photo verrait `fiche` à `null` sur
      une page où le menu n'a jamais été ouvert, et EFFACERAIT l'avatar
      d'un professionnel à chaque chargement. Il ne devient vrai que sur
      une lecture RÉUSSIE — la même prudence que la nº 142 sur la liste
      qu'on ne vide pas. */
  const [compteLu, setCompteLu] = useState(false);
  /*  §3-b (nº 472) — Y A-T-IL DE QUOI CHOISIR ? Un seul portfolio :
      pas de menu déroulant (il n'ouvrirait qu'une liste d'un nom) et
      pas de fond clair (il n'annonce plus un choix). Les deux
      reviennent ensemble au DEUXIÈME portfolio. */
  const plusieursFiches = fiches.length > 1;
  /*  §2 (nº 667) — L'ENCADRÉ DU PORTFOLIO N'A QU'UNE LIGNE quand le
      compte n'a pas encore de portfolio : ni déroulant (il en faudrait
      deux), ni les deux entrées qui en dépendent. C'est ce cas-là, et
      lui seul, qui fond la ligne et l'encadré en un seul bouton. */
  const sansPortfolio = fiches.length === 0;
  const nonLues = notifications.filter((n) => !n.lue_le).length;

  /** L'adresse d'une entrée qui travaille sur LA fiche choisie : elle
      emporte son identifiant, pour que le formulaire et l'aperçu
      ouvrent la bonne — même après un rechargement complet. */
  const versFiche = useCallback(
    (suffixe = "") => {
      const base = "/devenir-tatoueur/fiche";
      const params = [fiche ? `fiche=${fiche.id}` : "", suffixe]
        .filter(Boolean)
        .join("&");
      return params ? `${base}?${params}` : base;
    },
    [fiche]
  );

  /**
   * ██ §1 (nº 677) — PARTIR SANS MONTRER L'ARRIÈRE-PLAN ██
   * ==================================================================
   * LE DÉFAUT : depuis « Mon compte », un clic sur une entrée qui
   * navigue montre TROIS écrans — la fenêtre se ferme, la page
   * d'arrière-plan paraît une fraction de seconde, puis la destination
   * arrive. La fermeture est instantanée ; la navigation demande un
   * aller-retour au serveur. Ce n'est pas un défaut de rendu, c'est un
   * ORDRE d'événements.
   *
   * ██ CE QUE LA nº 676 A RATÉ, ET POURQUOI — la leçon, écrite ██
   * ------------------------------------------------------------------
   * Elle avait la bonne idée (ne pas fermer : la navigation démonte la
   * surface, qui disparaît donc à l'arrivée) et TROIS FAUTES, que le
   * propriétaire a payées en production :
   *  1. TROIS ENTRÉES SUR CINQ. « Sécurité » et « Sélection » n'avaient
   *     pas été touchées — elles clignotaient toujours. Une correction
   *     qui ne couvre pas son sujet ne corrige rien, elle rend le
   *     défaut plus déroutant : il frappe une fois sur deux ;
   *  2. AUCUN RETOUR AU CLIC. La fenêtre restait à l'écran, IDENTIQUE,
   *     pendant une seconde. Rien ne disait que le geste avait été
   *     pris. Le clignotement, au moins, prouvait qu'il se passait
   *     quelque chose ; le remède donnait l'impression d'un site MORT.
   *     C'est la faute la plus grave des trois, parce qu'elle en
   *     provoque une autre :
   *  3. LA FENÊTRE RESTAIT CLIQUABLE. Ne voyant rien venir, on tape à
   *     nouveau — sur la même entrée ou sur sa voisine. Une SECONDE
   *     navigation part, et c'est la dernière qui gagne : « Ajouter un
   *     portfolio » servait « Mon portfolio ». Ce n'est pas un état
   *     partagé qui déraille, c'est un second clic qu'on n'avait pas
   *     interdit.
   * LES TROIS SE TIENNENT : sans retour visuel, on reclique ; sans
   * inertie, le reclic gagne. C'est pourquoi cette passe ne peut pas
   * corriger le clignotement SEUL.
   *
   * ██ CE QUE CETTE PASSE POSE, ET DANS CET ORDRE ██
   * ------------------------------------------------------------------
   *  · LE VERROU EST UNE RÉFÉRENCE, PAS UN ÉTAT. Un état de React n'est
   *    lisible qu'au rendu SUIVANT : deux clics à 30 ms d'intervalle
   *    passeraient tous les deux. Une référence change à l'instant même
   *    de l'appel — c'est la seule façon de garantir « un seul clic
   *    pris en compte ». L'état, lui, sert à PEINDRE (la surbrillance
   *    et l'inertie), et il n'a pas besoin d'être synchrone pour cela ;
   *  · L'ENTRÉE CLIQUÉE PASSE EN SURBRILLANCE et Y RESTE. Aucun trait,
   *    aucune barre de chargement — la consigne du propriétaire est
   *    expresse. C'est l'éclaircissement que la ligne porte déjà sous
   *    le doigt, simplement maintenu ;
   *  · TOUTES LES ENTRÉES DEVIENNENT INERTES. La surface reste visible,
   *    mais elle ne prend plus rien : `pointer-events-none` sur le
   *    corps du menu. La croix, elle, reste vivante — c'est la seule
   *    échappatoire, et l'interdire enfermerait quelqu'un dans une
   *    fenêtre qui ne répond pas.
   *
   * ⚠️ DEUX CAS OÙ L'ON FERME TOUT DE SUITE, et il faut les deux :
   *  · ON Y EST DÉJÀ. Naviguer vers l'adresse courante ne déclenche
   *    rien : sans cette branche, la fenêtre resterait ouverte pour
   *    toujours. Il n'y a alors aucun clignotement à craindre, puisque
   *    aucune navigation n'a lieu ;
   *  · LE FILET DE TEMPS. Une navigation peut ne jamais aboutir
   *    (réseau coupé, serveur muet). Au bout de six secondes on ferme
   *    ET on rend la main — mieux vaut la page d'avant qu'une fenêtre
   *    morte. Six, et non trois comme à la nº 676 : une navigation
   *    lente du site en prend une (mesuré nº 669), et un filet qui se
   *    déclenche sur une navigation qui allait aboutir REFABRIQUE le
   *    clignotement qu'on vient de supprimer.
   *
   * ⚠️ L'HISTORIQUE EST DÉJÀ ARMÉ POUR CE CAS, et ce n'est pas de la
   * chance : le nettoyage de `useEtapeQuiSeReferme` porte la règle « LA
   * NAVIGATION GAGNE TOUJOURS : on laisse l'étape en place » (nº 331),
   * et sa marque est posée EN CAPTURE sur tout clic de lien — donc
   * avant que React ne démonte quoi que ce soit. Le compte d'étapes ne
   * bouge pas d'une unité, et le retour reste d'un seul appui.
   * ⚠️ LE VERROU DE DÉFILEMENT NON PLUS : il est retiré par le
   * nettoyage de son effet, qui tourne sur TOUS les chemins de
   * fermeture, démontage compris (nº 469).
   * ⚠️ LES DEUX APPAREILS AVAIENT LE MÊME DÉFAUT : mesuré à l'état de
   * la nº 675, les cinq entrées traversent l'arrière-plan au web comme
   * au doigt. Ils ont d'abord reçu la même correction.
   * ⚠️ ILS N'ONT PLUS LA MÊME DEPUIS LA Nº 680, sur décision du
   * propriétaire : au web la fenêtre se ferme AU CLIC, sans attendre
   * l'arrivée ; au doigt tout ce qui précède reste en vigueur, mot pour
   * mot. La branche est dans `partirVers`, elle lit `data-appareil`
   * (piège nº 60), et le §2 qui la porte dit pourquoi les deux réponses
   * diffèrent sans se contredire.
   */
  const FILET_DE_FERMETURE_MS = 6000;
  /** Le verrou SYNCHRONE : il ferme la porte à l'instant du clic. */
  const departVerrouille = useRef(false);
  /** Ce que l'écran montre : la clé de l'entrée partie, ou rien. */
  const [entreeQuiPart, setEntreeQuiPart] = useState<string | null>(null);
  const filetDeFermeture = useRef(0);
  /** §1 (nº 741) — L'ADRESSE COMPLÈTE au moment du départ : c'est en la
      voyant changer qu'on sait que l'arrivée a eu lieu. */
  const adresseDeDepart = useRef<string | null>(null);
  useEffect(
    () => () => {
      window.clearTimeout(filetDeFermeture.current);
    },
    []
  );
  /*  ⚠️ ON REPART D'UNE ARDOISE PROPRE À CHAQUE OUVERTURE : sans cela,
      une fenêtre rouverte après un filet déclenché resterait inerte,
      verrouillée par le départ précédent. */
  useEffect(() => {
    if (ouvert) return;
    departVerrouille.current = false;
    window.clearTimeout(filetDeFermeture.current);
    const minuteur = setTimeout(() => setEntreeQuiPart(null), 0);
    return () => clearTimeout(minuteur);
  }, [ouvert]);

  /**
   * LE GESTE COMMUN DES CINQ ENTRÉES QUI NAVIGUENT — Mon portfolio,
   * Modification, Sécurité, Sélection, Ajouter un portfolio.
   * Rend `false` quand le clic doit être IGNORÉ (un départ est déjà en
   * cours) : l'appelant s'arrête là.
   */
  const partirVers = useCallback(
    (cle: string, destination: string) => {
      if (departVerrouille.current) return false;
      departVerrouille.current = true;
      const ici = `${window.location.pathname}${window.location.search}`;
      /*  ██ §2 (nº 680) — AU WEB, LA FENÊTRE PART AU CLIC ██
          ------------------------------------------------------------
          LA SEULE BRANCHE D'APPAREIL DE CE MÉCANISME, et c'est une
          DÉCISION DU PROPRIÉTAIRE, pas une déduction : au web, cliquer
          une entrée qui navigue ferme la fenêtre TOUT DE SUITE, sans
          attendre l'arrivée. L'entête du §1 (nº 677) affirme « les deux
          appareils, sans branche » — c'était vrai du DÉFAUT (les cinq
          entrées traversaient l'arrière-plan des deux côtés), ce ne
          l'est plus du REMÈDE, et cette ligne-ci prime désormais.

          POURQUOI LES DEUX RÉPONSES DIFFÈRENT SANS SE CONTREDIRE : au
          doigt, la fenêtre COUVRE L'ÉCRAN — la refermer avant l'arrivée
          découvre la page d'avant, et c'est précisément le clignotement
          que la nº 677 a supprimé ; il faut donc tenir la fenêtre et
          montrer la surbrillance. Au web, elle est POSÉE SOUS LE BOUTON
          et ne recouvre rien : la page reste sous les yeux pendant la
          navigation, il n'y a aucun clignotement à craindre, et une
          fenêtre qui s'attarde n'est plus un repère mais une gêne.

          ⚠️ ET LE VERROU RESTE POSÉ : on ne le relève pas ici. C'est
          l'effet d'ouverture qui le relèvera quand la fenêtre sera
          effectivement fermée. Le relever tout de suite rouvrirait la
          porte pendant l'image qui sépare le clic du rendu — deux clics
          rapides passeraient tous les deux, et l'on retomberait sur la
          faute nº 3 de la nº 676 : la dernière navigation gagne, et
          « Ajouter un portfolio » sert « Mon portfolio ».

          `auDoigt` lit `data-appareil` (piège nº 60) — jamais une
          largeur. */
      if (!auDoigt) {
        setOuvert(false);
        return true;
      }
      if (ici === destination) {
        //  Aucune navigation n'aura lieu : on ferme, et l'on rouvre la
        //  porte pour que la fenêtre reste utilisable si on la rouvre.
        departVerrouille.current = false;
        setOuvert(false);
        return true;
      }
      //  §1 (nº 741) — l'adresse d'où l'on part, retenue AVANT tout :
      //  c'est en la voyant changer que l'effet ci-dessous saura que
      //  l'arrivée a eu lieu, et refermera la fenêtre.
      adresseDeDepart.current = ici;
      setEntreeQuiPart(cle);
      window.clearTimeout(filetDeFermeture.current);
      filetDeFermeture.current = window.setTimeout(() => {
        departVerrouille.current = false;
        setEntreeQuiPart(null);
        setOuvert(false);
      }, FILET_DE_FERMETURE_MS);
      return true;
    },
    [auDoigt]
  );

  /**
   * ██ §1 (nº 741) — LA FENÊTRE SE FERME À L'ARRIVÉE, ET C'EST ÉCRIT ██
   * ==================================================================
   * LE DÉFAUT, DIT PAR LE PROPRIÉTAIRE (téléphone) : le premier onglet
   * touché ouvre sa page normalement ; on rouvre « Mon compte », on
   * touche un autre onglet — l'entrée s'allume, et PLUS RIEN pendant de
   * longues secondes avant que la page ne paraisse.
   *
   * LA CAUSE, NOMMÉE ET PROUVÉE AU BANC (préalable nº 740) : jusqu'ici,
   * AUCUN code ne fermait cette fenêtre à l'arrivée. Ce qui la fermait
   * était un EFFET DE BORD — l'en-tête est monté par CHAQUE PAGE (et
   * non par le layout), si bien que changer de page DÉMONTE ce
   * composant, et son état « ouvert » meurt avec lui. La preuve tient
   * en une marque posée sur l'élément du bouton : après un changement
   * de page l'élément est NEUF (démonté, remonté) ; d'un onglet à
   * l'autre du portfolio — même page, seule la fin de l'adresse change
   * — c'est LE MÊME élément, rien n'a été démonté, et la fenêtre reste.
   * Les trois entrées du portfolio (« Mon portfolio », « Modification »,
   * « Ajouter un portfolio ») partagent la même page : d'où le figement,
   * réservé à leurs enchaînements, jusqu'au filet de six secondes.
   *
   * LE REMÈDE : on ne s'en remet plus à un démontage, on ÉCOUTE
   * L'ADRESSE — complète, la fin comprise (`souscrireAdresse`,
   * l'écriture unique du site : elle enveloppe `pushState` et
   * `replaceState`, et couvre le retour). Dès qu'elle diffère de celle
   * du départ, l'arrivée a eu lieu : la fenêtre se ferme, le verrou se
   * relève, le filet est annulé.
   *
   * ⚠️ LE CLIGNOTEMENT DE LA nº 677 N'EST PAS RÉOUVERT, ET C'EST MESURÉ,
   * pas espéré. Au banc, sur une navigation qui CHANGE de page : le tap
   * à 0 ms, l'adresse à +76 ms, la fermeture d'aujourd'hui (le
   * démontage) à +83 ms — sept millisecondes plus tard. Fermer sur
   * l'adresse, c'est donc fermer au même instant qu'aujourd'hui, à
   * l'imperceptible près ; l'écran montre alors la page cible (son
   * squelette d'abord, son contenu à +1,6 s ici), jamais la page
   * quittée. La règle de la nº 677 — « la fenêtre tient jusqu'à
   * l'arrivée » — est enfin tenue par du code plutôt que par un hasard
   * d'architecture.
   * ⚠️ LE FILET DE SIX SECONDES RESTE, en dernier recours seulement :
   * si une navigation n'aboutit jamais (réseau coupé, page refusée),
   * la fenêtre ne doit pas rester prisonnière. Il n'est plus le chemin
   * normal — il ne l'était que par accident.
   * ⚠️ AU WEB, RIEN NE CHANGE : `partirVers` y ferme la fenêtre à
   * l'instant du clic (§2 nº 680) et ne pose jamais `entreeQuiPart` —
   * cet effet n'y tourne donc pas. L'appareil se lit dans `auDoigt`,
   * jamais dans une largeur (piège nº 60).
   */
  useEffect(() => {
    if (!entreeQuiPart) return;
    const depart = adresseDeDepart.current;
    if (depart === null) return;
    const fermerSiLArriveeAEuLieu = () => {
      if (`${window.location.pathname}${window.location.search}` === depart) {
        return;
      }
      window.clearTimeout(filetDeFermeture.current);
      departVerrouille.current = false;
      adresseDeDepart.current = null;
      setEntreeQuiPart(null);
      setOuvert(false);
    };
    //  L'adresse a pu changer AVANT que cet effet ne tourne : on
    //  regarde une première fois, puis on écoute.
    fermerSiLArriveeAEuLieu();
    return souscrireAdresse(fermerSiLArriveeAEuLieu);
  }, [entreeQuiPart]);

  /** La classe d'une entrée : en surbrillance si c'est elle qui part. */
  const classeEntree = (cle: string, reglage: { entree: string; entreePartie: string }) =>
    entreeQuiPart === cle ? reglage.entreePartie : reglage.entree;

  /**
   * ██ §1 (nº 664) — LES NOUVELLES SE LISENT SEULES, DÉSORMAIS ██
   * ------------------------------------------------------------------
   * POURQUOI CETTE MOITIÉ SE DÉTACHE DE `lireLeCompte`. La note de la
   * nº 142 juste dessous interdit de lire le compte AU MONTAGE, et elle
   * a raison — mais elle vise DEUX choses qui ne coûtent pas la même :
   *  · LES FICHES passent par le CLIENT SUPABASE DU NAVIGATEUR. C'est
   *    lui qui rejoue la session hors de tout geste, et c'est LUI qui a
   *    fait perdre la liste des favoris (le défaut mesuré à la nº 142) ;
   *  · LES NOUVELLES sont un simple `fetch` vers notre propre route.
   *    Aucun client Supabase n'est créé dans le navigateur : le cookie
   *    part avec la requête, le SERVEUR l'ouvre. Le danger de la nº 142
   *    ne la concerne pas.
   * C'est cette distinction qui rend le §1 possible sans rien casser :
   * on peut semer les nouvelles à l'arrivée, on ne peut toujours pas
   * lire les fiches.
   */
  /*  §1 (nº 672) — LE CORPS DE CETTE LECTURE A DÉMÉNAGÉ dans le
      magasin (`lib/magasin-notifications`), avec la garde qui va avec.
      Il n'en reste ici que le lien : l'ouverture du menu RELIT, quoi
      qu'il arrive — c'est le seul moment où l'on demande au serveur ce
      qu'il a de neuf. */
  const lireLesNouvelles = useCallback(
    () => lireLesNouvellesDuCompte(idUtilisateur),
    [idUtilisateur]
  );

  /**
   * ██ §1 (nº 664) — LE COMPTEUR EST JUSTE DÈS L'ARRIVÉE ██
   * ------------------------------------------------------------------
   * CE QUE LE PROPRIÉTAIRE DEMANDE : que la bienvenue soit POSÉE avant
   * qu'on ouvre quoi que ce soit, pour que le compteur de la cloche
   * n'attende pas un geste.
   * CE QUE LE MÉCANISME EST — le plus simple possible, et surtout AUCUN
   * MÉCANISME NEUF : c'est LA MÊME lecture que fait l'ouverture du menu.
   * La route pose la bienvenue si elle manque (nº 663) ; l'appeler ici,
   * c'est poser la ligne dès que la page connectée s'affiche. Rien de
   * nouveau à écrire côté serveur, aucune route de plus, et les comptes
   * déjà créés sont servis par le même chemin.
   * ⚠️ UNE FOIS PAR COMPTE ET PAR DOCUMENT, PAS UNE PAR PAGE : la garde
   * vit dans le magasin, et elle EST la liste (`lib/magasin-
   * notifications`). Vingt navigations douces ne font qu'une requête ;
   * un document neuf en refait une, et c'est nécessaire — le magasin
   * est reparti de zéro avec lui.
   * ⚠️ IL NE TOUCHE PAS AUX FICHES, ni à `compteLu`, ni à l'avatar : la
   * garde de la nº 142 reste entière (voir `lireLesNouvelles`).
   *
   * ██ §1 (nº 672) — ET IL SURVIT DÉSORMAIS AU DÉMONTAGE DE LA BARRE ██
   * ------------------------------------------------------------------
   * CE QUI NE MARCHAIT PAS, ET LE PROPRIÉTAIRE LE VOYAIT DANS LA
   * RECHERCHE : la barre fixe est rendue par les PAGES, jamais par la
   * mise en page — un clic sur une carte de style change de route
   * (« / » → « /recherche »), React démonte cette barre et en monte une
   * neuve. L'état `notifications` repartait vide, l'ancienne marque de
   * module disait « déjà semé », et le point rose s'éteignait pour tout
   * le reste de la visite.
   * CE QUI CHANGE : cet effet ne garde plus rien lui-même. Il DEMANDE le
   * semis ; le magasin répond « je l'ai déjà pour ce compte » ou lit. Un
   * remontage retrouve donc la liste intacte, et le point avec elle.
   * ⚠️ LE MINUTEUR À ZÉRO S'EN VA AVEC L'ÉTAT LOCAL : il n'était là que
   * pour contourner `react-hooks/set-state-in-effect` (le même
   * contournement que les blocs « Autre adresse » et « Équipe »). Il n'y
   * a plus d'état de composant à poser — un magasin externe prévient ses
   * abonnés, ce que React attend de lui.
   */
  useEffect(() => {
    semerLesNouvelles(idUtilisateur);
  }, [idUtilisateur]);

  /** LES FICHES ET LES NOUVELLES — une lecture, les deux ensemble.
      ⚠️ ELLE N'EST JAMAIS LANCÉE AU MONTAGE, et ce n'est pas un
      oubli : une lecture authentifiée sur CHAQUE page, pour un menu
      que la plupart des visites n'ouvrent jamais, coûte une requête à
      chaque affichage — et fait rejouer la session du client Supabase
      hors de tout geste (mesuré : la liste des favoris s'en trouvait
      perdue). On lit quand on ouvre, et seulement là.
      §1 (nº 664) — CETTE NOTE NE VAUT PLUS QUE POUR LES FICHES : les
      nouvelles, elles, sont semées à l'arrivée (voir juste au-dessus).
      La raison de la distinction est écrite dans `lireLesNouvelles`. */
  const lireLeCompte = useCallback(async () => {
    try {
      const supabase = await clientSupabaseALaDemande();
      const liste = await chargerFichesDuCompte(supabase, idUtilisateur);
      setFiches(liste);
      // On recale le choix : la fiche mémorisée peut avoir disparu.
      setIdFiche((courant) => ficheActive(liste, courant)?.id ?? null);
      //  §1 (nº 645) — À PARTIR D'ICI, ET SEULEMENT ICI, le menu sait
      //  ce que le compte contient : l'effet qui range l'avatar peut
      //  parler. Une lecture qui échoue n'arme rien (voir le `catch`).
      setCompteLu(true);
    } catch {
      //  ⚠️ ON NE VIDE PAS LA LISTE (passe nº 142). Une lecture qui
      //  échoue — réseau coupé le temps d'un geste — faisait
      //  disparaître le bloc du portfolio d'un menu déjà ouvert. On
      //  garde ce qu'on montrait : seule une lecture RÉUSSIE change
      //  ce qui est à l'écran.
    }
    /*  ██ §2 (nº 693) — LA PORTE NE SE TIENT PLUS POUR LE COMPTEUR ██
        ------------------------------------------------------------------
        CE QUI FIGEAIT LE SITE, ET C'EST CETTE LIGNE QUI LE FAISAIT.
        L'ouverture de « Mon espace » ATTEND `lireLeCompte` avant de
        montrer quoi que ce soit, et le trait de chargement du site est
        allumé pendant ce temps. `lireLeCompte` attendait ICI la lecture
        des nouvelles. Une réponse qui ne vient pas, et c'est un menu qui
        ne s'ouvre JAMAIS sous un trait qui ne s'éteint jamais — « un
        temps infini à charger », les mots du propriétaire.
        MESURÉ AU BANC, cette lecture rendue muette, avant correction :
        menu ouvert « JAMAIS » (butoir de quinze secondes) pour LES TROIS
        PROFILS — administrateur, professionnel, particulier. Les quatre
        autres lectures muettes, elles, laissaient le menu s'ouvrir en
        moins de deux cents millisecondes.
        CE QUI CHANGE : la lecture PART, on ne l'attend plus. Le menu
        s'ouvre avec ce qu'il a ; le compteur arrive quand il arrive.
        ⚠️ LE COMPTEUR NE PERD RIEN : les nouvelles vivent dans un
        MAGASIN EXTERNE (`useNotifications` → `useSyncExternalStore`).
        La lecture prévient ses abonnés en arrivant, ouverte ou pas —
        c'est exactement ce pour quoi ce magasin a été écrit à la
        nº 672. Rien n'est perdu, seule l'ATTENTE disparaît.
        ⚠️ ET LA nº 664 TIENT TOUJOURS : « le compteur est juste dès
        l'arrivée » est l'affaire de `semerLesNouvelles`, qui part au
        montage de la barre — pas de cette ligne-ci.
        ⚠️ LE DÉLAI DE GARDE (§1) RESTE NÉCESSAIRE : sans lui, la lecture
        traînerait pour toujours en arrière-plan, et le magasin garderait
        sa marque « en cours » — le compteur ne se remplirait jamais de
        la visite. Les deux corrections se tiennent.

        ██ §1 (nº 713) — ET CETTE LECTURE-LÀ N'EST PLUS ICI ██
        ------------------------------------------------------------------
        CE QUI SE PASSAIT, MESURÉ AU BANC (session d'un professionnel,
        page « Ma sélection ») : DEUX appels à la route des nouvelles
        au chargement, à un demi-seconde d'écart — le relevé du
        propriétaire à la sonde de vitesse (568 ms + 485 ms) — puis
        deux ou trois de plus au fil des navigations douces.
        LA CAUSE, ET ELLE TIENT AU LIEU DE CETTE LIGNE : `lireLeCompte`
        est appelée par TROIS chemins, et un seul veut des nouvelles
        fraîches. L'ouverture du menu, oui — c'est le geste qui demande
        « qu'y a-t-il de neuf ». Le RATTRAPAGE DU PORTFOLIO DISPARU
        (§3 nº 700), non : il corrige un avatar, les nouvelles ne le
        regardent pas — et comme il repart au montage de chaque barre,
        il redemandait les nouvelles à chaque page.
        LA LIGNE DÉMÉNAGE DONC CHEZ CELUI QUI LA VEUT : `basculerLeMenu`
        (plus bas), les deux branches d'ouverture. Le semis de la
        nº 664, lui, ne bouge pas — il reste la seule lecture du
        chargement, et il est gardé par le magasin (nº 672). */
  }, [idUtilisateur]);

  /**
   * ██ §1 (nº 645) — LA PHOTO RANGÉE SUIT LA FICHE ACTIVE ██
   * ------------------------------------------------------------------
   * UN SEUL MÉCANISME POUR DEUX MOMENTS, et c'est délibéré : cet effet
   * regarde la fiche active — celle que `ficheActive(fiches, idFiche)`
   * désigne. Elle change à la LECTURE du compte (première ouverture du
   * menu, rattrapage d'un compte d'avant cette passe, portfolio
   * disparu) ET au CHOIX d'un autre portfolio dans le déroulant. Les
   * deux passent ici ; il n'y a pas deux endroits à tenir d'accord.
   * ⚠️ RIEN TANT QUE LE COMPTE N'A PAS ÉTÉ LU (`compteLu`) : voir la
   * note du drapeau. Une fiche à `null` faute de lecture n'est pas un
   * compte sans portfolio.
   * ⚠️ ET RIEN QUAND LA VALEUR NE CHANGE PAS : la garde d'égalité vit
   * dans `rangerLAvatarDuCompte` (leçon nº 111 — ne pas rejouer la
   * session pour écrire ce qui y est déjà).
   *
   * ██ §1 (nº 657), REMPLACÉ PAR LE §1 (nº 675) ██
   * ------------------------------------------------------------------
   * CE QUE LA nº 657 AVAIT POSÉ : cet effet s'arrêtait net sur une
   * liste VIDE, pour ne pas effacer la photo d'un particulier qui n'a
   * pas de portfolio. Sa note reconnaissait ce qu'elle laissait :
   * « quelqu'un qui SUPPRIME son dernier portfolio garde la photo de ce
   * portfolio ». LE PROPRIÉTAIRE REMPLACE CE COMPORTEMENT (nº 675,
   * points 3 et 5) : après la suppression DÉFINITIVE, l'identité de la
   * personne doit revenir TOUTE SEULE.
   *
   * LA RÈGLE ENTIÈRE, TENUE ICI ET EN UN SEUL ENDROIT :
   * L'IDENTITÉ AFFICHÉE SUIT LE PORTFOLIO S'IL EN EXISTE UN, LA
   * PERSONNE SINON. La garde sur la liste vide TOMBE, et c'est ce qui
   * rend le retour possible : sans elle, l'effet ne parlait jamais du
   * second cas.
   * ⚠️ « IL EN EXISTE UN » COMPREND UN PORTFOLIO EN COURS DE
   * SUPPRESSION, et ce n'est pas une tolérance : pendant les trente
   * jours il reste récupérable, modifiable et consultable (point 3 du
   * propriétaire). Rien de particulier n'est écrit pour cela —
   * `chargerFichesDuCompte` liste les fiches SANS filtrer
   * `supprime_le`, donc `fiches` n'est pas vide et la fiche active
   * garde son identité. Le point 4 (annuler la suppression) suit sans
   * qu'une ligne le prévoie : rien ne change parce que rien n'avait
   * changé.
   * ⚠️ CE QUI REVIENT AU BOUT DES TRENTE JOURS : `identiteDeLaPersonne`
   * — sa photo et son nom saisis dans « Éditer ». Faute d'en avoir
   * saisi, le repli est le cercle gris et « Mon compte », comme le
   * propriétaire l'écrit.
   * ⚠️ ET RIEN NE PEUT S'EFFACER PAR ACCIDENT : la lecture qui échoue
   * n'arme pas `compteLu` (voir `lireLeCompte`), donc une liste vide
   * FAUTE DE LECTURE n'est jamais prise pour un compte sans portfolio.
   * C'est la même garde qu'avant, et elle est plus nécessaire que
   * jamais maintenant que la branche « liste vide » agit.
   */
  useEffect(() => {
    if (!compteLu) return;
    const personne = identiteDeLaPersonne(utilisateur);
    /*  §1 (nº 703) — le client arrive à la demande. Ce rattrapage
        n'a AUCUNE urgence (il corrige un avatar) : l'attendre un
        instant de plus ne se voit pas, et il ne bloque rien. */
    void clientSupabaseALaDemande().then((supabase) =>
      rangerLIdentiteAffichee(
        supabase,
        fiche
          ? { photo: fiche.photo_profil, nom: fiche.nom }
          : personne,
        { photo: photoDuCompte, nom: nomAfficheDuCompte }
      )
    );
  }, [
    compteLu,
    fiche,
    utilisateur,
    photoDuCompte,
    nomAfficheDuCompte,
  ]);


  /**
   * OUVRIR — ET N'OUVRIR QU'UNE FOIS LE CONTENU PRÊT (passe nº 142)
   * ================================================================
   * La fenêtre s'affichait EN DEUX TEMPS : ses quatre entrées de base
   * d'abord, puis — la lecture revenue — le sélecteur de portfolios,
   * « Modification » et « Mon portfolio » qui s'insèrent et poussent
   * tout le reste vers le bas. Sur smartphone, où la fenêtre occupe
   * l'écran, le saut se voit en entier.
   *
   * LE REMÈDE N'EST NI UN SQUELETTE NI UNE RÉSERVE DE PLACE : on
   * n'ouvre pas une fenêtre à moitié. La PREMIÈRE ouverture attend sa
   * lecture — le temps d'un aller-retour —, puis la fenêtre paraît
   * COMPLÈTE, d'un seul coup. Les suivantes sont immédiates : ce
   * qu'on sait déjà s'affiche tel quel, pendant qu'une relecture
   * silencieuse le remet à jour derrière.
   */
  const dejaLu = useRef(false);

  /**
   * ██ §3 (nº 700) — L'EN-TÊTE NE GARDE PLUS UN PORTFOLIO DISPARU ██
   * ==================================================================
   * LE CAS, TROUVÉ PAR L'AUDIT nº 691 (R9) : un portfolio est purgé —
   * à l'échéance, ou parce que l'administration a abrégé — et la barre
   * continue d'afficher SA photo et SON nom. La session les porte
   * (nº 675 : ils vivent dans le cookie, c'est ce qui évite le
   * clignotement) ; le rattrapage qui les remet d'aplomb est juste
   * au-dessus, et il n'a le droit de parler qu'une fois le compte lu.
   * OR LE COMPTE N'EST LU QU'À L'OUVERTURE DU MENU. Tant que la
   * personne ne clique pas sur la silhouette, elle voit l'avatar d'un
   * portfolio qui n'existe plus — sur toutes les pages, indéfiniment.
   * ON LIT DONC UNE FOIS, AU CHARGEMENT, ET EN SILENCE.
   *
   * ⚠️ SEULEMENT QUAND IL Y A QUELQUE CHOSE À DÉMENTIR. Si la session
   * ne porte NI photo NI nom de portfolio, il n'y a rien de périmé à
   * corriger : un particulier ne paie pas cette lecture. C'est la
   * condition de la ligne ci-dessous, et elle vaut mieux qu'un
   * « toujours » — la nº 693 a montré ce que coûtent les lectures
   * qu'on ajoute sans y penser.
   * ⚠️ ELLE N'ATTEND RIEN ET NE MONTRE RIEN : pas de `await`, pas de
   * trait de chargement, aucun état d'ouverture touché. C'est
   * exactement la leçon de la nº 693 — une lecture qui échoue ou qui
   * traîne ne doit figer aucun écran. `lireLeCompte` avale déjà ses
   * propres erreurs et ne vide jamais la liste.
   * ⚠️ ET ELLE NE PART QU'UNE FOIS : `dejaLu` est le même verrou que
   * celui de l'ouverture du menu — la première ouverture qui suit
   * n'aura donc plus rien à attendre non plus, et sera immédiate.
   *
   * ██ §2 (nº 713) — « UNE FOIS » VOULAIT DIRE « UNE FOIS PAR BARRE » ██
   * ------------------------------------------------------------------
   * LE DÉFAUT, MESURÉ : `dejaLu` est un `useRef`, il meurt avec le
   * composant — or LA BARRE EST RENDUE PAR CHAQUE PAGE, jamais par la
   * mise en page (c'est le constat de la nº 672). Chaque navigation
   * douce démonte la barre et en monte une neuve : le verrou repartait
   * à faux, et ce rattrapage relisait le compte à CHAQUE PAGE, pour
   * corriger un avatar déjà corrigé.
   * LA GARDE PASSE DONC AU MODULE — la durée de vie de ce qu'elle
   * garde, et c'est la leçon de la nº 672 appliquée à l'endroit :
   * ce rattrapage vaut pour LE DOCUMENT, pas pour une barre. Un
   * chargement neuf le rejoue, comme il faut.
   * ⚠️ POURQUOI C'EST SANS RISQUE, ET C'EST VÉRIFIÉ : la correction
   * qu'il apporte est PERSISTANTE — `rangerLIdentiteAffichee` écrit
   * dans la session (`updateUser`, lib/avatar-du-compte). Une fois le
   * portfolio disparu démenti, la session ne le porte plus : les
   * barres suivantes naissent justes, et la condition ci-dessous
   * (« seulement quand il y a quelque chose à démentir ») devient même
   * fausse. Il n'y a donc rien à rejouer d'une page à l'autre.
   * ⚠️ CE QU'ON PERD, ET C'EST DIT : un portfolio purgé PENDANT la
   * visite, entre deux navigations du même document, n'est plus
   * démenti avant le prochain chargement complet. Le cas est rare
   * (une purge tombe à l'échéance ou par l'administration), et il se
   * répare tout seul au rechargement suivant.
   * ⚠️ `dejaLu` (l'ouverture du menu) RESTE LOCAL, lui, et ce n'est pas
   * une inconséquence : il garde l'état local `fiches`, qui meurt bien
   * avec la barre. Le confondre avec celui-ci rouvrirait le défaut de
   * la nº 559 — une fenêtre qui s'ouvre à moitié vide.
   */
  useEffect(() => {
    if (rattrapageFait) return;
    if (!photoDuCompte && !nomAfficheDuCompte) return;
    rattrapageFait = true;
    dejaLu.current = true;
    /*  ⚠️ ELLE PART APRÈS LA PEINTURE, pas pendant. Lancée droit dans
        le corps de l'effet, cette lecture range de l'état pendant le
        rendu — React le déconseille, et l'atelier le refuse. Le
        report d'un tour de boucle dit d'ailleurs le vrai : cette
        lecture n'a AUCUNE urgence, elle corrige un avatar. Rien ne
        doit l'attendre, surtout pas le premier affichage. */
    const minuteur = setTimeout(() => void lireLeCompte(), 0);
    return () => clearTimeout(minuteur);
  }, [photoDuCompte, nomAfficheDuCompte, lireLeCompte]);

  const basculerLeMenu = useCallback(() => {
    if (ouvert) {
      setOuvert(false);
      return;
    }
    if (dejaLu.current) {
      //  On sait déjà : la fenêtre s'ouvre tout de suite, et se remet
      //  à jour derrière sans jamais se vider.
      setOuvert(true);
      void lireLeCompte();
      //  §1 (nº 713) — LES NOUVELLES SE RELISENT À L'OUVERTURE, ET
      //  SEULEMENT LÀ : c'est le geste qui demande « quoi de neuf ».
      //  Elle n'est pas attendue (leçon nº 693 : rien ne doit figer
      //  l'ouverture) et le magasin prévient ses abonnés en arrivant.
      void lireLesNouvelles();
      return;
    }
    void (async () => {
      /*  §3 (nº 469/559, trait retiré nº 706) — LA PREMIÈRE OUVERTURE
          ATTEND SA LECTURE (nº 142), web et doigt : cette branche-ci
          attend `lireLeCompte` avant `setOuvert`. Le trait rose qui
          disait cette attente (commandé au signe central, nº 441) est
          SUPPRIMÉ avec tous les traits du site — décision du
          propriétaire, nº 706. L'attente elle-même ne change pas :
          courte en temps normal (une lecture), bornée par le délai de
          garde du client (nº 686) si la base se tait. Les ouvertures
          suivantes passent par `dejaLu` juste au-dessus : immédiates,
          mises à jour derrière sans jamais se vider. */
      //  §1 (nº 713) — les nouvelles PARTENT ici aussi, sans être
      //  attendues : la fenêtre s'ouvre sur les fiches, le compteur se
      //  met à jour par le magasin quand la réponse arrive.
      void lireLesNouvelles();
      await lireLeCompte();
      dejaLu.current = true;
      setOuvert(true);
    })();
  }, [ouvert, lireLeCompte, lireLesNouvelles]);

  /** Choisir une fiche : on la retient pour la prochaine fois. */
  function choisirFiche(id: string) {
    setIdFiche(id);
    memoriserFiche(id);
    setSelecteurOuvert(false);
  }

  /** L'adresse d'une création — la même depuis les deux entrées. */
  const ADRESSE_NOUVELLE = "/devenir-tatoueur/fiche?fiche=nouvelle";

  /** ALLER CRÉER UNE FICHE, pour de bon.
      DEUX CAS, ET IL FAUT LES DEUX :
       · on est ailleurs → on navigue, et la CLÉ REACT de l'enveloppe
         (EspaceFiche) change : le formulaire est démonté puis remonté,
         donc vierge ;
       · on est DÉJÀ sur `?fiche=nouvelle` → naviguer vers la même
         adresse ne déclenche rien du tout. On envoie alors
         l'événement que l'enveloppe attend : même remontage, même
         formulaire neuf. Sans ce cas, cliquer deux fois de suite
         « Ajouter un portfolio » laissait la première saisie à l'écran. */
  function allerCreerUneFiche() {
    //  §1 (nº 331) — LA NAVIGATION GAGNE. Cette entrée-là n'est pas un
    //  lien mais un bouton (elle sait reconnaître « on y est déjà ») :
    //  le module ne peut pas l'armer tout seul au clic, elle le dit
    //  donc elle-même, par l'écriture commune.
    laSurfaceVaNaviguer();
    /*  §1 (nº 677) — LA MÊME RÈGLE QUE LES QUATRE LIENS : la fenêtre
        reste jusqu'à l'arrivée, l'entrée s'allume, le menu devient
        inerte. Un second clic est refusé net — c'est lui qui servait
        « Mon portfolio » à la place de « Ajouter un portfolio » après
        la nº 676.
        ⚠️ LE DÉROULANT ET L'AVERTISSEMENT SE FERMENT, EUX, tout de
        suite : ils vivent DANS la fenêtre qu'on garde, et les laisser
        ouverts par-dessus une entrée allumée se verrait. */
    if (!partirVers("ajouter", ADRESSE_NOUVELLE)) return;
    setSelecteurOuvert(false);
    setAvertirAvantCreation(false);
    const ici = `${window.location.pathname}${window.location.search}`;
    if (ici === ADRESSE_NOUVELLE) {
      window.dispatchEvent(new Event("yokofolio-fiche-neuve"));
      return;
    }
    //  §1 (nº 332) — et il CONSOMME l'étape du menu comme les quatre
    //  liens : `replace` quand elle est là, `push` sinon.
    if (laNavigationRemplaceLEtape()) router.replace(ADRESSE_NOUVELLE);
    else router.push(ADRESSE_NOUVELLE);
  }

  /** LE GESTE DU MENU — il commence par regarder si l'on a quelque
      chose à perdre. Un formulaire à moitié rempli qui s'efface sans
      un mot est la façon la plus sûre de faire recommencer quelqu'un
      qui n'a rien demandé. */
  function demanderUneNouvelleFiche() {
    if (travailEnCours()) {
      setOuvert(false);
      setSelecteurOuvert(false);
      setAvertirAvantCreation(true);
      return;
    }
    allerCreerUneFiche();
  }

  // Échap ferme toujours. UN CLIC EXTÉRIEUR ferme aussi — mais SUR LE
  // WEB SEULEMENT : sur smartphone, la fenêtre est CENTRÉE et posée
  // dans <body>, donc « hors de la zone » ; fermer au mousedown
  // emporterait le menu avant que le tap n'atteigne l'entrée
  // choisie. C'est le VOILE qui ferme là-bas, au relâchement.
  // Et, comme pour la fenêtre du moteur, la page ne défile plus
  // derrière tant que la fenêtre mobile est ouverte.
  useEffect(() => {
    if (!ouvert) return;
    const surMobile = document.documentElement.dataset.appareil === "mobile";
    function auClavier(evenement: KeyboardEvent) {
      //  §4 (nº 465) — au doigt, « Langue » ou « Notifications »
      //  peuvent être OUVERTES PAR-DESSUS ce menu resté monté : Échap
      //  appartient alors à la surface du dessus (chacune a son propre
      //  écouteur) — sans cette garde, un seul Échap fermait les deux
      //  d'un coup.
      //  §1 (nº 657) — « Modifier » est la TROISIÈME de ces surfaces,
      //  et elle entre dans la même garde, pour la même raison.
      if (notificationsOuvertes || langueOuverte || identiteOuverte) return;
      if (evenement.key === "Escape") setOuvert(false);
    }
    function auPointeur(evenement: MouseEvent) {
      if (surMobile) return;
      const cible = evenement.target as Node;
      //  ⚠️ LA PLAQUE DU WEB EST DANS LE CORPS DU DOCUMENT (nº 238-§4) :
      //  sans ce test, le premier clic dans le menu le refermait.
      if (plaqueWeb.current?.contains(cible)) return;
      if (!zone.current?.contains(cible)) setOuvert(false);
    }
    document.addEventListener("keydown", auClavier);
    document.addEventListener("mousedown", auPointeur);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("mousedown", auPointeur);
    };
    //  §4 (nº 465) — les deux états du dessus entrent dans les
    //  dépendances : la garde d'Échap ci-dessus les lit.
  }, [ouvert, notificationsOuvertes, langueOuverte, identiteOuverte]);

  /*  ██ §1 (nº 469) — LE VERROU DE DÉFILEMENT, COMPTÉ ET SÉPARÉ ██
      Il vivait DANS l'effet du clavier ci-dessus, en « sauver puis
      rendre » : quand `langueOuverte` changeait, le rejeu de l'effet
      relisait le corps APRÈS le nettoyage de la fenêtre fermée et
      sauvait « hidden » comme valeur d'origine — la fermeture de
      « Mon compte » restituait alors ce « hidden », et le site ne
      défilait plus (le bug de blocage du propriétaire). Le verrou vit
      désormais dans SON effet, sur la seule ouverture, par l'écriture
      COMPTÉE (lib/verrou-defilement) : la dernière surface fermée
      libère le corps, jamais la première — et le nettoyage couvre
      tous les chemins de fermeture, navigation comprise. */
  /*  ██ §1 (nº 642) — ET LE WEB LE POSE AUSSI, DÉSORMAIS ██
      ------------------------------------------------------------------
      LA CAUSE DU RELEVÉ, NOMMÉE : cet effet s'arrêtait net sur
      `dataset.appareil !== "mobile"`. Le verrou n'existait donc QU'AU
      DOIGT ; au web la page défilait derrière la fenêtre, et rien ne
      l'en empêchait — ce n'était pas un verrou défait, c'en était
      l'absence.
      POURQUOI IL EN FAUT UN ICI ALORS QUE LA RÈGLE DE LA MAISON DIT
      QU'UN MENU ANCRÉ NE VERROUILLE PAS (nº 469) : c'est la demande du
      propriétaire, et c'est le même choix qu'à la nº 573 pour le menu
      des styles — la règle vaut par défaut, elle cède quand il tranche.
      ⚠️ AUCUN SAUT, NI À LA POSE NI AU RETRAIT : `globals.css` retire
      toutes les barres de défilement (`scrollbar-width: none` et le
      pseudo-élément WebKit à zéro) ; la barre du document mesure donc
      zéro pixel, et `overflow: hidden` ne reprend aucune largeur. C'est
      le constat mesuré des nº 560 et nº 573, pas une promesse neuve.
      ⚠️ UNE AUTRE SURFACE OUVERTE EN MÊME TEMPS NE SE DÉBLOQUE PAS À
      TORT : le verrou est COMPTÉ (nº 469) — « Notifications » et
      « Langue » posent le leur, le corps ne redéfile qu'au dernier
      retrait. Et fermer puis rouvrir ne laisse rien traîner : le
      nettoyage de cet effet tourne sur tous les chemins de fermeture,
      navigation comprise. */
  useEffect(() => {
    if (!ouvert) return;
    poserLeVerrouDeDefilement();
    return retirerLeVerrouDeDefilement;
  }, [ouvert]);

  /* Échap referme l'avertissement — c'est la fenêtre partagée
     (FenetreNonEnregistre) qui s'en charge elle-même. */

  /** DÉCONNEXION SANS REDIRECTION FORCÉE : la session s'efface, la
      page réagit d'elle-même.
      ⚠️ CE QUE ÇA DONNE DEPUIS LA PASSE Nº 133 : les pages du compte
      (formulaire de portfolio, Sécurité) MÈNENT DROIT à la page de
      connexion — l'écran « Connecte-toi d'abord » qui s'y affichait
      n'existe plus. Les pages publiques, elles, continuent comme si
      de rien n'était : la barre repasse simplement aux boutons de
      visiteur. Rien n'arrache le lecteur à ce qu'il regardait. */
  function deconnecter() {
    setOuvert(false);
    /*  §1 (nº 703) — le client arrive à la demande. La fenêtre s'est
        DÉJÀ refermée à la ligne du dessus : la personne ne voit aucune
        attente, et l'appel part derrière. */
    void clientSupabaseALaDemande()
      .then((supabase) => supabase.auth.signOut())
      .catch(() => {
        // Serveur injoignable : la session locale est déjà effacée.
      });
  }

  /** UNE ENTRÉE DU MENU — icône, libellé, action. LES QUATRE ENTRÉES
      SONT RIGOUREUSEMENT IDENTIQUES : même taille de texte, même
      hauteur, et surtout une icône enfermée dans une BOÎTE DE LARGEUR
      FIXE. Sans cette boîte, chaque dessin d'icône a sa propre largeur
      et les libellés partent d'un pixel différent — c'est ce qui
      faisait « bouger » Modification et Ma fiche par rapport à
      Sécurité et Déconnexion. */
  //  §2 (nº 237) — L'ÉTAT DE LA LIGNE EST UN VOILE TRANSLUCIDE, plus
  //  jamais un aplat : le fond s'éclaircit comme sur les lignes
  //  cliquables des fiches (nº 229), la couleur du texte ne change
  //  jamais, aucun rose. La fenêtre est en verre depuis la nº 236 :
  //  un aplat opaque y faisait une boîte posée sur la plaque.
  //  AU DOIGT : l'état ENFONCÉ (`active:`) — il apparaît sous le doigt
  //  et repart au relâchement, il ne reste jamais (le `hover:` de
  //  Tailwind v4 ne s'applique qu'aux appareils qui survolent).
  //  MÊME GÉOMÉTRIE des deux côtés : la classe est unique, la hauteur
  //  (46 px), le rayon (`rounded-xl`) et le retrait (`px-3`) aussi.
  /**
   * ██ §1-§5 (nº 537) — DEUX JEUX DE RÉGLAGES, UN PAR SURFACE ██
   * ==================================================================
   * La nº 536 a donné à la FENÊTRE DU WEB la disposition de la PAGE DU
   * DOIGT, et ramené les réglages à un seul jeu. Le propriétaire la
   * trouve trop grande pour une fenêtre : les deux surfaces se
   * séparent de nouveau — mais SUR LES SEULES VALEURS, jamais sur le
   * dessin. Un unique arbre (`contenuDuCompte`), deux jeux de nombres.
   * ⚠️ AUCUNE BRANCHE D'APPAREIL N'EST LUE NULLE PART : chaque surface
   * passe son jeu, et c'est tout — rien à interroger, rien qui puisse
   * se tromper.
   * ⚠️ MAIS « NE SE MONTE QUE SUR SON APPAREIL » ÉTAIT FAUX, ET ÇA A
   * COÛTÉ LE DÉROULANT DU WEB (nº 688). Cette note l'affirmait ; la
   * vérité est que LES DEUX SURFACES SONT DANS L'ARBRE dès que le menu
   * est ouvert, et que c'est la FEUILLE qui en cache une
   * (`mobile:hidden`, `hidden mobile:flex`). Pour le DESSIN, la
   * différence est nulle — d'où la note. Pour tout ce qui se compte ou
   * se désigne, elle ne l'est pas : un `useRef` unique posé dans cet
   * arbre reçoit DEUX éléments et n'en garde qu'un. C'est exactement ce
   * qui est arrivé au conteneur du déroulant ; le §1 (nº 688) le
   * raconte et le corrige. Toute écriture ajoutée ici doit tenir compte
   * du DOUBLE MONTAGE.
   * ⚠️ CE QUI RESTE COMMUN, ET QUI DOIT LE RESTER : la géométrie d'une
   * entrée (hauteur de 46 px, retrait de 12 px, rayon, état enfoncé),
   * le dessin des tuiles, les fonds, les arrondis, l'ordre et
   * l'inventaire des entrées. Seuls des NOMBRES diffèrent.
   *
   * ██ §1 (nº 658) — « AJOUTER UN PORTFOLIO » N'A PLUS DE COULEUR À LUI ██
   * ------------------------------------------------------------------
   * L'HISTOIRE EN TROIS TEMPS, ET ELLE SE TERMINE ICI. La nº 532 avait
   * peint la ligne ENTIÈRE en rose (`text-primaire`), parce que c'était
   * la seule ACTION d'une page où tout le reste menait quelque part. La
   * nº 649 a rendu LE MOT à ses voisines et gardé le rose sur le seul
   * DESSIN, d'où `boiteAction`. Le propriétaire retire aussi celui-là
   * (nº 658) : l'icône rejoint ses voisines, en blanc.
   * `boiteAction` DISPARAÎT AVEC LE ROSE, et c'est le point : cette clé
   * n'existait QUE pour porter cette couleur. Sans elle, la ligne monte
   * exactement la même boîte que « Ma fiche » ou « Sécurité » — même
   * largeur, même centrage, même `text-sombre-texte/80`. Il n'y a plus
   * de cas particulier à tenir.
   * ⚠️ LE BLANC EST CELUI DE SES VOISINES, à 80 % comme elles, et pas
   * un blanc plein : une icône seule à 100 % au milieu de cinq à 80 %
   * se lirait comme une erreur, pas comme une décision.
   */
  const reglageDeLigne = (
    largeurBoite: string,
    taille: number,
    ecriture: string
  ) => {
    /*  §1 (nº 677) — LA GÉOMÉTRIE SANS SES ÉTATS, et c'est la règle
        nº 389 appliquée à la lettre : une entrée PARTIE ne doit pas
        porter `hover:` ni `active:` en plus de son fond, sinon le
        survol du web ÉCLAIRCIRAIT MOINS (`/5` sous `/10`) que la
        surbrillance qu'on vient de poser. Deux chaînes qui s'excluent,
        jamais une classe empilée sur une autre. */
    const socle =
      "flex w-full items-center gap-3 rounded-xl px-3 min-h-[46px] text-left " +
      `${ecriture} font-semibold transition-colors`;
    const geometrie = `${socle} hover:bg-white/5 active:bg-white/10`;
    /*  §1 (nº 677) — LA SURBRILLANCE D'ATTENTE : l'état ENFONCÉ de la
        ligne (`bg-white/10`), posé en permanence. Ce n'est pas une
        couleur neuve — c'est celle que le doigt voit déjà sous lui, et
        c'est justement pour cela qu'elle se comprend sans qu'on
        l'explique : le geste n'est pas fini, l'entrée est encore
        enfoncée. */
    const geometriePartie = `${socle} bg-white/10`;
    return {
      /*  LA BOÎTE DE LARGEUR FIXE tient l'alignement : sans elle, chaque
          dessin a sa propre chasse et les libellés partent d'un pixel
          différent. Elle suit donc le glyphe.
          ⚠️ LE DÉROULANT NE BOUGE PAS POUR AUTANT (acquis nº 531) : son
          bord gauche se cale sur le BORD GAUCHE de cette boîte — 8 px
          d'encadré plus les 12 px de la ligne —, une somme où sa
          LARGEUR n'entre pas. */
      boite: `flex ${largeurBoite} shrink-0 justify-center`,
      taille,
      entree: `${geometrie} text-sombre-texte`,
      //  §1 (nº 677) — la même ligne, en attente : voir `geometriePartie`.
      entreePartie: `${geometriePartie} text-sombre-texte`,
      /**
       * ██ §2 (nº 667) — UNE LIGNE SEULE **EST** SON ENCADRÉ ██
       * ----------------------------------------------------------
       * LE DÉFAUT DU PROPRIÉTAIRE : quand l'encadré du portfolio ne
       * contient QUE « Ajouter un portfolio », le survol dessinait une
       * BOÎTE CLAIRE À L'INTÉRIEUR, autour du seul texte — un rectangle
       * flottant dans un rectangle. Il veut ce que « English » a reçu à
       * la nº 662 : c'est TOUT l'encadré qui s'éclaircit.
       * COMMENT, ET SANS DÉPLACER UN PIXEL. La ligne absorbe les deux
       * rembourrages qui l'entouraient : l'encadré posait `px-2 py-3`
       * (8 et 12), la ligne `px-3 min-h-[46px]` (12 et 46). La somme
       * est exacte — 8 + 12 = 20 de côté (`px-5`), 12 + 46 + 12 = 70 de
       * haut (`min-h-[70px]`). L'icône reste donc à 20 px du bord et la
       * hauteur totale à 70, comme avant.
       * ⚠️ ELLE N'ÉCRIT NI FOND NI ARRONDI : l'appelant lui donne
       * `CLASSE_ENCADRE` (le `rounded-xl bg-sombre-eleve` partagé) plus
       * les deux variantes d'éclaircissement. Une seule classe par
       * propriété (règle nº 389) — ce qui interdisait de garder le
       * `hover:bg-white/5` de la géométrie ordinaire, et c'est
       * précisément ce qu'on veut supprimer.
       * ⚠️ DÈS QU'IL Y A PLUSIEURS LIGNES, RIEN NE CHANGE : le
       * comportement par ligne (`entree`, juste au-dessus) reste celui
       * de toujours. La consigne est explicite là-dessus.
       */
      entreeSeule:
        "flex w-full items-center gap-3 px-5 min-h-[70px] text-left " +
        `${ecriture} font-semibold text-sombre-texte transition-colors`,
    };
  };
  type ReglageLigne = ReturnType<typeof reglageDeLigne>;

  /**
   * ██ §1 (nº 530) — LES MORCEAUX, EXTRAITS UNE FOIS POUR DEUX PLANS ██
   * ==================================================================
   * Au doigt, cette page change de PLAN (des encadrés, plus une
   * liste) ; au web elle ne change pas d'un pixel. Deux plans, donc —
   * mais JAMAIS DEUX COMPORTEMENTS : les morceaux qui portent une
   * adresse, un geste ou une garde sont écrits ICI, une seule fois, et
   * les deux plans les POSENT. Aucun lien, aucune consigne de
   * navigation, aucune règle d'enchaînement n'existe en double — c'est
   * la seule façon qu'ils ne divergent jamais.
   * ⚠️ CE QUI RESTE PROPRE À CHAQUE PLAN : les boîtes, et elles seules.
   */

  /**
   * LES NOTIFICATIONS S'OUVRENT — le geste, écrit une fois (§1 nº 530).
   * §5 (nº 238) — UNE SEULE SURFACE FLOTTANTE À LA FOIS : ouvrir les
   * notifications FERME « Mon compte ». Les deux restaient superposées,
   * et la fenêtre du dessous se voyait par transparence à travers celle
   * du dessus. La fermer, elle, rend la page : elle ne rouvre rien.
   * ██ §4 (nº 465) — AU DOIGT, C'EST L'INVERSE, sur consigne : « Mon
   * compte » est devenu une PAGE OPAQUE (rien ne se voit par
   * transparence — la raison du §5 nº 238 ne s'applique plus), et il
   * RESTE OUVERT sous « Notifications » : refermer celles-ci fait
   * RETOMBER sur « Mon compte », pas sur la page d'où il venait. Chaque
   * surface a son étape d'historique (C-4), la garde de rang nº 465
   * (etape-refermable) fait que le retour n'en referme qu'une. Le web
   * ne change pas.
   */
  function ouvrirLesNotifications() {
    setSelecteurOuvert(false);
    if (!auDoigt) setOuvert(false);
    setNotificationsOuvertes(true);
  }

  /**
   * ██ §1 (nº 530) — LES MORCEAUX, EXTRAITS UNE FOIS POUR DEUX PLANS ██
   * ==================================================================
   * Au doigt, cette page change de PLAN (des encadrés, plus une liste) ;
   * au web elle ne change pas d'un pixel. Deux plans, donc — mais
   * JAMAIS DEUX COMPORTEMENTS : ce qui porte une adresse, un geste ou
   * une garde est écrit ICI, une seule fois, et les deux plans le
   * POSENT. Aucun lien, aucune consigne de navigation, aucune règle
   * d'enchaînement n'existe en double — c'est la seule façon qu'ils ne
   * divergent jamais.
   * ⚠️ CE QUI RESTE PROPRE À CHAQUE PLAN : les boîtes, et elles seules.
   */

  /**
   * §5-§6 (nº 532) — LES RÉGLAGES DU SÉLECTEUR.
   *  · LA HAUTEUR : 54 → 64 px. Le champ portait la hauteur d'un champ
   *    de fenêtre ; sur une page, entre deux encadrés, il paraissait
   *    écrasé.
   *  · LE NOM : 14,5 → 16 px. L'ÉTAT : 12 → 13 px. Les deux montent
   *    ensemble et gardent leur rapport (l'état reste le plus petit —
   *    0,83 avant, 0,81 après) : c'est un renseignement sous un nom,
   *    jamais son égal.
   * §4 (nº 536) — ET LE WEB LES PREND AUSSI : il n'a plus de valeurs à
   * lui (54 px / 14,5 px), puisqu'il n'a plus de plan à lui. Un seul
   * sélecteur, un seul réglage — c'est ce qui garantit que la fenêtre
   * et la page ne peuvent plus se désaccorder.
   */
  const reglageDuSelecteur = (
    hauteur: string,
    titre: string,
    sousTitre: string
  ) => ({ hauteur, titre, sousTitre });

  /**
   * LE SÉLECTEUR DE PORTFOLIO — `null` tant qu'il n'y a qu'un seul
   * portfolio (acquis nº 472-§3b : rien à choisir, rien à ouvrir).
   *
   * ██ §5-§6 (nº 532) — TROIS RÉGLAGES, ET PAS UN SECOND SÉLECTEUR ██
   * ------------------------------------------------------------------
   * Le doigt veut un champ plus haut et des mots plus grands ; le web
   * ne change pas. C'est LE MÊME sélecteur — même liste, même état,
   * même écriture — qui reçoit trois valeurs de son appelant. Écrire
   * un second sélecteur pour trois nombres aurait mis en double la
   * liste, ses pastilles, son chevron et sa mécanique d'ouverture.
   * Les valeurs du web sont celles de toujours, passées telles quelles.
   */
  const selecteurDePortfolio = (reglages: {
    /** La hauteur minimale du champ fermé. */
    hauteur: string;
    /** L'écriture du NOM, dans le champ comme dans la liste. */
    titre: string;
    /** L'écriture de l'ÉTAT, sous le nom. Toujours plus petite. */
    sousTitre: string;
  }) =>
    plusieursFiches ? (
    //  §1 (nº 688) — LA MARQUE que la garde de fermeture retrouve.
    <div className="relative" {...MARQUE_SELECTEUR}>
      <button
        type="button"
        onClick={() => setSelecteurOuvert((v) => !v)}
        aria-expanded={selecteurOuvert}
        // IL DOIT SE VOIR QU'ON PEUT L'OUVRIR — mais SANS CONTOUR
        // (charte, nº 132) : c'est un CHAMP, il se dit par son
        // FOND et par son chevron. À l'ouverture le fond
        // s'éclaircit encore — la grammaire du focus des champs,
        // sans un trait.
        // ⚠️ ENCORE UN CRAN (passe nº 146-§3, deuxième signalement) :
        // la fenêtre a été éclaircie à la nº 144 (`carte` → `eleve`)
        // mais le sélecteur, resté à `bordure` (56,56,63) sur le
        // bloc `eleve-clair/70`, ne s'en détachait plus. Il prend
        // `haut` (65,65,73) au repos et `haut-clair` (75,75,84)
        // ouvert : chaque niveau s'éclaircit, jamais de contour.
        //  §2 (nº 289) — LE LISERÉ DE VERRE : l'exception de la
        //  charte, dosée pour se sentir sans se voir (globals.css,
        //  [data-verre-champ]).
        data-verre-champ=""
        className={`flex w-full items-center gap-3 rounded-xl px-3
                   ${reglages.hauteur} text-left transition-colors ${
                     selecteurOuvert
                       ? "bg-sombre-haut-clair"
                       : "bg-sombre-haut hover:bg-sombre-haut-clair"
                   }`}
      >
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-semibold text-sombre-texte leading-tight ${reglages.titre}`}>
            {fiche ? fiche.nom : "No portfolio"}
          </span>
          <span className="mt-1 flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${COULEUR_ETAT[etat]}`}
            />
            <span className={`text-sombre-texte-doux leading-none ${reglages.sousTitre}`}>
              {LIBELLE_ETAT[etat]}
            </span>
          </span>
        </span>
        {/*  ⚠️ LE CHEVRON NE ROSIT PLUS OUVERT (nº 144-§2) : la
             ROTATION dit déjà l'état, et le rose est réservé aux
             accents forts — pas aux fenêtres ouvertes. */}
        <IconeChevronBas
          taille={16}
          classe={`shrink-0 transition-transform text-sombre-texte-doux ${
            selecteurOuvert ? "rotate-180" : ""
          }`}
        />
      </button>

      {selecteurOuvert && (
        //  La liste au MÊME niveau que le champ ouvert (nº 134) :
        //  elle le prolonge, elle ne peut pas être plus sombre.
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1
                     rounded-xl bg-sombre-haut-clair overflow-hidden"
        >
          {/*  §2 (nº 286) — LA BARRE DE DÉFILEMENT SE VOIT DÈS QUE
               LA LISTE DÉBORDE.
               LE DÉFAUT : le propriétaire a CINQ portfolios, la
               liste en montre trois (220 px), et RIEN ne disait
               qu'il y en avait d'autres — la règle globale du site
               masque toutes les barres (`*:not(.defilement-visible)`,
               globals.css). Son cinquième portfolio était
               invisible, et rien ne l'invitait à faire défiler.
               LE REMÈDE EST L'EXCEPTION DÉJÀ ÉCRITE, celle des
               menus déroulants : `defilement-visible`. Elle ne
               dessine RIEN quand le contenu tient (c'est
               `overflow-y: auto` qui décide, pas la classe), et
               sort un curseur fin et arrondi dès qu'il déborde —
               sans piste, sans contour, dans le gris des bordures
               du site. AUCUNE valeur graphique n'est écrite ici :
               on consomme celle de globals.css. */}
          <ul className="max-h-[220px] overflow-y-auto overscroll-contain defilement-visible">
            {fiches.map((entree) => {
              const etatEntree = etatDeLaFiche(entree);
              const choisie = entree.id === fiche?.id;
              return (
                <li key={entree.id}>
                  {/* ⚠️ EXACTEMENT LA MÊME COMPOSITION QUE L'ENTRÉE
                      SÉLECTIONNÉE, au-dessus : le nom sur la
                      première ligne, puis la pastille et l'état
                      SOUS le nom, alignés sur lui.
                      La pastille était posée À GAUCHE du bloc,
                      centrée entre les deux lignes : les noms de
                      la liste se retrouvaient décalés par rapport
                      au nom affiché dans le sélecteur, et l'œil
                      ne reconnaissait plus la même chose. */}
                  <button
                    type="button"
                    onClick={() => choisirFiche(entree.id)}
                    className={`block w-full px-3 py-2.5 text-left
                               transition-colors hover:bg-white/[0.06] ${
                                 choisie ? "bg-white/[0.04]" : ""
                               }`}
                  >
                    <span className={`block truncate font-semibold text-sombre-texte leading-tight ${reglages.titre}`}>
                      {entree.nom}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${COULEUR_ETAT[etatEntree]}`}
                      />
                      <span className={`text-sombre-texte-doux leading-none ${reglages.sousTitre}`}>
                        {LIBELLE_ETAT[etatEntree]}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
    ) : null;

  /**
   * ██ §2 (nº 667) — « AJOUTER UN PORTFOLIO », ÉCRIT UNE SEULE FOIS ██
   * ------------------------------------------------------------------
   * IL SE MONTE DE DEUX FAÇONS, et une seule chose les sépare : la
   * CLASSE de son bouton.
   *  · DANS UN ENCADRÉ PARTAGÉ (un compte qui a déjà un portfolio) :
   *    `entree` — la ligne ordinaire, avec son éclaircissement à elle,
   *    comme « Mon portfolio » ou « Sécurité » ;
   *  · SEUL (un compte qui n'en a pas) : `entreeSeule` + l'encadré et
   *    ses deux variantes d'éclaircissement. Le bouton EST alors
   *    l'encadré, et c'est toute la boîte qui s'éclaircit — la consigne.
   * ⚠️ LE DESSIN, LE GESTE ET LE MOT SONT LES MÊMES DANS LES DEUX CAS :
   * s'ils étaient écrits deux fois, ils finiraient par diverger.
   */
  const boutonAjouterUnPortfolio = (reglage: ReglagesDuCompte, seul: boolean) => (
    <button
      type="button"
      onClick={demanderUneNouvelleFiche}
      //  §3 (nº 649) — le mot rejoint ses voisines : `entree`, la
      //  même écriture que « Ma fiche » ou « Sécurité ».
      /*  §1 (nº 677) — LA SURBRILLANCE D'ATTENTE, dans ses DEUX
          habillages : la ligne ordinaire, et la ligne SEULE qui est son
          propre encadré (nº 667). Chacune prend son état enfoncé à
          elle, posé en permanence et SANS ses variantes — deux chaînes
          qui s'excluent (règle nº 389). */
      /*  §1 (nº 677) — ET IL PORTE SON INERTIE LUI-MÊME. Les deux
          `<nav>` la donnent à leurs enfants ; ce bouton-ci, quand il est
          SEUL, EST son propre encadré (nº 667) et vit donc HORS des
          deux. Sans cette classe, il resterait le seul élément
          cliquable de la fenêtre — mesuré au banc, et corrigé là où le
          défaut est : sur lui. */
      className={`${
        seul
          ? `${reglage.ligne.entreeSeule} ${CLASSE_ENCADRE} ` +
            (entreeQuiPart === "ajouter"
              ? "bg-sombre-eleve-clair"
              : "hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair")
          : classeEntree("ajouter", reglage.ligne)
      }${entreeQuiPart ? " pointer-events-none" : ""}`}
    >
      {/*  §1 (nº 533) — L'ICÔNE EST CELLE DE « MON PORTFOLIO »,
           OUVERTE EN HAUT À DROITE, avec un petit « + » dans
           l'ouverture (voir IconeAjouterPortfolio). Le lecteur
           reconnaît l'objet avant de lire le mot.
           §1 (nº 658) — ELLE N'ÉCRIT TOUJOURS AUCUNE COULEUR, elle
           HÉRITE — et ce qu'elle hérite est désormais le blanc à
           80 % de ses cinq voisines, posé par la même boîte
           qu'elles (`boite`). Le rose de la nº 532/649 s'en va, et
           `boiteAction` avec lui : il n'existait que pour lui. */}
      <span className={`${reglage.ligne.boite} text-sombre-texte/80`}>
        <IconeAjouterPortfolio taille={reglage.ligne.taille} />
      </span>
      <span className="flex-1">Add a portfolio</span>
    </button>
  );

  /** LES DEUX ENTRÉES DU PORTFOLIO CHOISI — « Mon portfolio » d'abord
      (acquis nº 472-§3a), puis « Modification ». */
  const entreesDuPortfolio = (reglage: ReglageLigne) => (
    /*  §1 (nº 677) — CE NAV-CI AUSSI DEVIENT INERTE, et il fallait le
        mesurer pour s'en apercevoir : « Mon portfolio » et
        « Modification » vivent dans le bloc DU PORTFOLIO, pas dans
        celui du compte. Poser l'inertie sur un seul des deux, c'était
        refaire la faute nº 1 de la nº 676 — couvrir une partie du
        sujet. */
    <nav
      aria-label="Selected portfolio"
      className={`flex flex-col gap-0.5${
        entreeQuiPart ? " pointer-events-none" : ""
      }`}
    >
      {/*  ██ §3-a (nº 472) — « MON PORTFOLIO » PASSE EN PREMIER ██
           Les deux entrées sont ÉCHANGÉES, sur consigne : on
           regarde son portfolio avant de le modifier. Rien d'autre
           ne bouge — mêmes liens, mêmes icônes, mêmes adresses,
           mêmes consignes de navigation. */}
      {/* L'aperçu public réel.
          §4 (nº 330) — ET IL PORTE LA CONSIGNE DES LIENS INTERNES.
          « Mon portfolio » mène à un portfolio par un LIEN : la
          photo du haut ne monte pas, exactement comme depuis une
          fiche d'équipe ou le rond de profil de « Ma sélection »
          (point 6 de la règle, lib/navigation-session). La
          consigne vit dans l'adresse et s'écrit par l'écriture
          unique — jamais à la main. */}
      <Link
        href={avecConsigneDeLienInterne(versFiche("vue=apercu"))}
        replace={liensRemplacent}
        //  §1 (nº 677) — la fenêtre reste jusqu'à l'arrivée, l'entrée
        //  s'allume, le menu devient inerte. Voir `partirVers`.
        onClick={(evenement) => {
          if (!partirVers("portfolio", versFiche("vue=apercu"))) {
            evenement.preventDefault();
          }
        }}
        className={classeEntree("portfolio", reglage)}
      >
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          <IconeUtilisateur taille={reglage.taille} />
        </span>
        My portfolio
      </Link>

      {/* Le formulaire, en haut de page. L'ÉVÉNEMENT prévient le
          formulaire s'il est DÉJÀ affiché (naviguer vers la même
          adresse ne déclenche rien) : il remonte alors la page et
          rouvre l'annonce de validation lui-même. */}
      <Link
        href={versFiche()}
        replace={liensRemplacent}
        onClick={(evenement) => {
          //  §1 (nº 677) — même règle que « Mon portfolio ». L'ÉVÉNEMENT
          //  ne part que si le clic est retenu : sinon on préviendrait
          //  deux fois le formulaire pour un seul geste.
          if (!partirVers("modification", versFiche())) {
            evenement.preventDefault();
            return;
          }
          window.dispatchEvent(new Event("yokofolio-modification-demandee"));
        }}
        className={classeEntree("modification", reglage)}
      >
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          <IconeReglages taille={reglage.taille} />
        </span>
        Edit
      </Link>
    </nav>
  );

  /**
   * LES ENTRÉES DU COMPTE — Langue, Sécurité, Déconnexion.
   * §1 (nº 534) — LES TROIS SONT DE NOUVEAU INSÉPARABLES : le drapeau
   * qui permettait d'en sortir « Déconnexion » (nº 533-§4) part avec
   * l'encadré qu'il servait. Les deux plans rendent le même groupe.
   */
  const entreesDuCompte = (reglage: ReglageLigne) => (
    /*  §1 (nº 530) — LE RETRAIT LATÉRAL N'EST PLUS ICI : il
        appartenait au plan du web (`px-2`), et il l'a rejoint —
        une enveloppe, juste en dessous. Au doigt, c'est l'encadré
        qui donne la réserve. La géométrie du web ne bouge pas :
        mêmes 8 px, sur une boîte au lieu du nav. */
    /*  §1 (nº 677) — LE MENU DEVIENT INERTE dès qu'une entrée est
        partie : un seul clic est pris en compte, et c'est ce qui
        empêche le second — celui qui servait la MAUVAISE PAGE après la
        nº 676. La croix, elle, reste vivante : elle est dans l'en-tête
        de la surface, pas dans ce conteneur. */
    <nav
      aria-label="My account"
      className={`flex flex-col gap-0.5${
        entreeQuiPart ? " pointer-events-none" : ""
      }`}
    >
      {/* LA LANGUE — AU-DESSUS DE SÉCURITÉ (passe nº 137). Le globe
          a quitté la barre fixe, où le CŒUR des favoris a pris sa
          place une fois connecté : une barre de smartphone n'a pas
          de quoi porter les deux. Il ouvre EXACTEMENT la même
          fenêtre que le globe de la barre — c'est le même composant.
          ⚠️ LA LIGNE SEULE (nº 238-§5) : la fenêtre est montée PLUS
          BAS, hors du menu. Tant qu'elle vivait ici, refermer « Mon
          compte » l'aurait emportée avec lui — les deux ne pouvaient
          qu'être empilées. Et la ligne porte enfin la classe
          commune : elle gardait un survol en aplat (nº 237-§2). */}
      <EntreeLangue
        classe={reglage.entree}
        //  §3 (nº 533) — la même boîte et la même taille que ses cinq
        //  voisines : sans cela, le globe serait resté seul à 22 px.
        boite={reglage.boite}
        taille={reglage.taille}
        surOuvrir={() => {
          //  §4 (nº 465) — même règle que « Notifications » : au
          //  doigt, « Mon compte » (devenu une page opaque) RESTE
          //  ouvert sous « Langue » — la refermer y fait retomber.
          //  Le web garde son enchaînement d'aujourd'hui.
          if (!auDoigt) setOuvert(false);
          setLangueOuverte(true);
        }}
      />

      <Link
        href="/devenir-tatoueur/securite"
        replace={liensRemplacent}
        //  §1 (nº 677) — L'UNE DES DEUX QUE LA nº 676 AVAIT OUBLIÉES :
        //  elle clignotait encore, et le propriétaire l'a vu.
        onClick={(evenement) => {
          if (!partirVers("securite", "/devenir-tatoueur/securite")) {
            evenement.preventDefault();
          }
        }}
        className={classeEntree("securite", reglage)}
      >
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          {/* UN BOUCLIER, plus un cadenas (nº 129) : le cadenas dit
              « c'est fermé », le bouclier dit « c'est protégé » —
              c'est bien de cela qu'il s'agit ici. */}
          <IconeBouclierTrait taille={reglage.taille} />
        </span>
        Security
      </Link>

      <button type="button" onClick={deconnecter} className={reglage.entree}>
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          <IconeSortie taille={reglage.taille} />
        </span>
        Log out
      </button>
    </nav>
  );

  /**
   * ██ §1 (nº 530) — LE PLAN DU DOIGT : DES ENCADRÉS ██
   * ==================================================================
   * La colonne d'entrées du web devient, au doigt, TROIS ENCADRÉS :
   * une rangée de trois tuiles (Notifications · Sélection · Ajouter),
   * l'encadré du portfolio, l'encadré du compte. Les gestes et les
   * adresses sont ceux du plan du web, aux mêmes objets près : seules
   * les boîtes changent.
   *
   * LE FOND ET LE RAYON VIENNENT DES PLAQUES DE PROFIL (nº 502) :
   * `sombre-eleve` (#262C34) et `rounded-xl`. Je ne consomme PAS la
   * chaîne `ENCADRE_MEMBRE` de plaque.ts, et voici pourquoi : elle
   * décrit une RANGÉE (`flex items-start gap-3.5`) faite pour un
   * avatar suivi d'un texte, avec 12 px sur les quatre côtés. Ici les
   * encadrés sont des COLONNES, et leurs lignes portent DÉJÀ leur
   * propre retrait (12 px) : reprendre les 12 px de la
   * plaque les aurait ajoutés aux leurs — le texte serait parti à
   * 24 px du bord. Ce qui est repris, ce sont les deux valeurs qui
   * font la plaque : sa couleur et son arrondi.
   *
   * LES AIRS, tous sur l'échelle de 4 :
   *  · entre les encadrés, et entre les trois tuiles : 12 px ;
   *  · dans un encadré de liste : 8 px de réserve, plus les 12 px que
   *    chaque ligne porte déjà — le texte tombe à 20 px du bord, et
   *    l'état enfoncé d'une ligne garde 8 px de marge tout autour ;
   *  · dans une tuile : 16 px en haut et en bas, 8 px sur les côtés
   *    (le mot a besoin de la largeur), 8 px entre l'icône et le mot.
   *
   * CE QUI EST CLIQUABLE, ET POURQUOI :
   *  · UNE TUILE L'EST EN ENTIER — elle ne porte qu'un seul geste, sa
   *    boîte EST son bouton (le motif des plaques cliquables) ;
   *  · UN ENCADRÉ DE LISTE NE L'EST PAS — chacune de ses lignes mène
   *    ailleurs. Une boîte cliquable qui contient trois destinations
   *    ne saurait pas où aller.
   *
   * ⚠️ CE QUE DEVIENT LE FOND CLAIR DE LA nº 472, ET JE LE DIS : au
   * doigt, il n'existe plus — non pas retiré, mais SANS OBJET. Il
   * disait « ce bloc dépend du portfolio choisi » en éclaircissant le
   * fond du menu ; désormais TOUS les blocs de cette page ont le même
   * fond d'encadré, la nuance ne peut plus rien distinguer. LA RÈGLE
   * DE LA nº 472 TIENT INTACTE, elle : avec un seul portfolio, pas de
   * déroulant (`selecteurDePortfolio` rend `null`). Et le web garde le
   * fond clair au pixel, puisqu'il garde son plan.
   */
  /*  §1 (nº 655) — LA CLASSE A DÉMÉNAGÉ, PAS CHANGÉ : elle vit
      désormais auprès de `MenuDeVerre` (SurfaceDeVerre), parce que
      « Langue » et « Notifications » la partagent depuis cette passe.
      Le nom local reste, et avec lui les vingt emplois ci-dessous. */
  const CLASSE_ENCADRE = CLASSE_ENCADRE_FENETRE;
  /*  La tuile : sa boîte est son bouton. Le survol et l'appui
      reprennent l'écriture des plaques cliquables (nº 502) — une seule
      couleur de fond, remplacée, jamais empilée. */
  /*  §1 (nº 677) — LA TUILE EN ATTENTE : son propre état enfoncé
      (`bg-sombre-eleve-clair`), posé en permanence, et SANS ses
      variantes — deux chaînes qui s'excluent (règle nº 389), pour que
      le survol du web ne vienne pas repeindre par-dessus. */
  const CLASSE_TUILE =
    `flex flex-col items-center gap-2 px-2 py-4 ${CLASSE_ENCADRE} ` +
    "transition-colors hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair";
  const CLASSE_TUILE_PARTIE =
    `flex flex-col items-center gap-2 px-2 py-4 ${CLASSE_ENCADRE} ` +
    "transition-colors bg-sombre-eleve-clair";
  const CLASSE_TUILE_ICONE = "flex justify-center text-sombre-texte/80";
  /*  ⚠️ `[overflow-wrap:anywhere]` : sur un écran très étroit
      (320 px), « Notifications » est plus long que sa tuile. Sans
      cela il déborderait — ou pousserait la rangée et ouvrirait un
      défilement horizontal. Avec, le mot passe à la ligne, et la
      grille (qui étire ses cases) donne AUX TROIS la hauteur de la
      plus haute : la rangée reste régulière. */
  const CLASSE_TUILE_MOT =
    "text-[13px] font-semibold leading-tight text-center text-sombre-texte " +
    "[overflow-wrap:anywhere]";

  /**
   * ██ LES DEUX JEUX, ET CE QUI LES SÉPARE (§1-§5, nº 537) ██
   * ------------------------------------------------------------------
   * LE DOIGT garde EXACTEMENT ce que les nº 530-536 ont posé : rien
   * de ce qui suit ne le touche. LE WEB se resserre, valeur par
   * valeur — une fenêtre n'est pas une page.
   *
   *                                 doigt        web
   *   §1 libellé d'une ligne        14,5 px      13,5 px
   *   §1 icône d'une ligne          26 px        22 px
   *   §2 nom dans le déroulant      16 px        14,5 px
   *   §2 état dans le déroulant     13 px        13 px  (inchangé)
   *   §3 hauteur du déroulant       64 px        54 px
   *   §4 icône d'une tuile          32 px        28 px
   *   §5 air au-dessus des tuiles   4 px         20 px  (16 → 20, nº 557)
   *   §1 air sur les CÔTÉS          16 px        20 px  (nº 557)
   *
   * ██ §1 (nº 557) — LES CÔTÉS DE LA FENÊTRE DU WEB S'ÉCARTENT ██
   * ------------------------------------------------------------------
   * L'air entre le bord de la fenêtre et ses encadrés était trop
   * mince. Il monte d'UN cran de l'échelle de quatre : 16 → 20 px, à
   * GAUCHE, à DROITE et EN BAS (le `pb-5` de l'enveloppe, chez
   * l'appelant du web).
   * ET LE HAUT SUIT, à 20 px lui aussi. C'est le §5 de la nº 537 qui le
   * commande — « l'air du haut égale celui des côtés » —, et le rompre
   * pour un seul cran donnerait une fenêtre à trois côtés larges et un
   * quatrième étroit : cela se lirait comme un défaut, pas comme une
   * décision. Les quatre côtés restent donc égaux.
   * ⚠️ CONSÉQUENCE ASSUMÉE, ET JE LA DIS : `airHaut` commande DEUX
   * écarts, pas un (voir la note du titre, chez l'appelant du web) —
   * l'air au-dessus du titre ET celui entre le titre et la première
   * rangée. Les deux passent donc de 16 à 20 px ensemble.
   * ⚠️ LE CÔTÉ SORT DU CORPS COMMUN POUR CELA. Il y était écrit en dur
   * (`px-4` sur `contenuDuCompte`), donc PARTAGÉ avec la page du
   * doigt : le monter là aurait élargi les marges du plein écran, que
   * les nº 530-534 ont réglées. Il rejoint donc les deux jeux, comme
   * `airHaut` l'avait fait à la nº 537 — le doigt garde ses 16 px au
   * pixel, le web seul bouge.
   *

   * §4 — LES 28 px DU WEB SONT CEUX DE LA BARRE FIXE, relevés sur ses
   * trois icônes (loupe, fanion, silhouette — `taille={28}`, avec leur
   * repli à 24 au doigt depuis la nº 461). La tuile vit sous cette
   * barre : elle en prend la mesure.
   * §5 — L'AIR DU HAUT ÉGALE CELUI DES CÔTÉS : les côtés valent 16 px
   * (le `px-4` du contenu) et le haut n'en valait que 4. Ces 4 px se
   * justifiaient tant que l'en-tête de la page posait l'air au-dessus
   * du contenu ; DEPUIS LA nº 641 c'est la TÊTE qui vit dans cette
   * barre, et l'air sous elle est redevenu un vrai écart à régler —
   * voir `airHaut` du doigt.
   * §1-§2 — LES VALEURS DU WEB SONT CELLES D'AVANT LA nº 536, reprises
   * telles quelles : 22 px d'icône, 14,5 px de nom, 54 px de champ.
   * Rien n'est inventé ; on rend à la fenêtre ce qu'elle avait.
   * ⚠️ L'ÉTAT DU DÉROULANT NE BOUGE PAS (13 px des deux côtés) : la
   * consigne ne vise que le nom, et l'écart entre les deux se resserre
   * — 0,81 au doigt, 0,90 au web. Il reste le plus petit.
   */
  const REGLAGES_DOIGT = {
    ligne: reglageDeLigne("w-[26px]", 26, "text-[14.5px]"),
    selecteur: reglageDuSelecteur("min-h-[64px]", "text-[16px]", "text-[13px]"),
    tuileIcone: 32,
    /*  §1 (nº 538) — LA PASTILLE DU DOIGT : rond 20 → 16 px, chiffre
        12,5 → 11 px, et le retrait ramené à 2 px. Le rond vaut la
        MOITIÉ de la cloche (32 px) ; l'air intérieur descend de 6 à
        4 px pour que le chiffre garde sa place dans un rond plus
        petit. Voir le §1 posé sur la tuile pour la cause et le calcul. */
    pastille:
      "absolute -right-0.5 -top-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primaire " +
      //  §3 (nº 674) — LA DÉCOUPE : un anneau de la couleur du fond de
      //  l'encadré qui porte la tuile (`bg-sombre-eleve`, l'écriture
      //  unique CLASSE_ENCADRE_FENETRE). Voir la note posée sur le
      //  point rose de la barre pour le POURQUOI d'un `ring` plutôt
      //  que d'une bordure : il ne touche pas la géométrie.
      "ring-2 ring-sombre-eleve " +
      "text-[11px] font-bold text-white leading-4 text-center",
    /*  ██ §5 (nº 641) — L'AIR SOUS LA PHOTO ÉGALE CELUI AU-DESSUS ██
        AU-DESSUS : 24 px, le `pt-[max(24px,env(safe-area-inset-top))]`
        de la barre (nº 149-§5). EN DESSOUS, il n'y avait que 8 px —
        4 px de `pb-1` (le bas de la barre) plus 4 px de ce réglage.
        LES SEIZE QUI MANQUAIENT VIENNENT ICI, ET NULLE PART AILLEURS :
        4 + 20 = 24. Le `pb-1` de la barre est PARTAGÉ par les cinq
        écrans plein écran — l'augmenter aurait écarté « Recherche »,
        « Langue », « Notifications » et « Ajouter un style » du même
        coup (piège nº 378/379). Ce réglage-ci n'appartient qu'à « Mon
        compte ».
        ⚠️ AVEC UNE ENCOCHE, LE HAUT GRANDIT ET PAS LE BAS : le `max()`
        rend la zone sûre du téléphone, qui n'est pas de l'air mais du
        terrain interdit. L'égalité est celle des 24 px nominaux.
        ⚠️ ET LE CONTENU GLISSE SOUS LA BARRE QUAND ON DÉFILE : ces
        20 px sont l'écart AU REPOS, page en haut. */
    airHaut: "pt-5",
    //  §1 (nº 557) — LES 16 px DE LA PAGE, AU PIXEL PRÈS : c'est la
    //  valeur qui était écrite en dur dans le corps commun. Elle ne
    //  change pas, elle change seulement d'endroit.
    airCote: "px-4",
    /*  ██ §4 (nº 641) — LA PHOTO DE LA TÊTE, 64 → 80 px AU DOIGT ██
        Le propriétaire la voit trop petite depuis qu'elle a quitté le
        centre de l'écran (nº 640) pour le bord gauche. Elle grandit
        d'un quart. Le glyphe du repli suit le MÊME RAPPORT — 34 / 64 =
        0,53, donc 42 dans un rond de 80 — pour que le cercle gris du
        particulier reste dessiné comme avant, ni plus maigre ni plus
        gras dans son rond.
        ⚠️ RIEN À RÉSERVER À DROITE ICI (`airTete` vide) : au doigt la
        croix vit DANS la rangée de la barre, elle ne passe au-dessus
        de rien. Au web elle est dans l'angle, et c'est là que la
        réserve se paie — voir le jeu du web. */
    photoTete: "h-20 w-20",
    glypheTete: 42,
    airTete: "",
    /*  ██ §6 (nº 641) — LE NOM ET L'ÉTAT GRANDISSENT, AU DOIGT SEUL ██
        LES DEUX NOMBRES SONT RELEVÉS SUR LE SITE, PAS CHOISIS :
        · le NOM prend 20 px, LE RANG DU TITRE DE PAGE — c'est
          exactement la taille du `<h1>` que « Recherche », « Langue »,
          « Notifications » et « Ajouter un style » posent au MÊME
          endroit de la MÊME barre (`EnTetePleinEcran`, nº 149-§1). La
          tête EST le titre de cette page-ci : elle en prend le corps.
        · l'ÉTAT prend 15,5 px, LE RANG DU SOUS-TITRE AU DOIGT (nº 628,
          `LigneResultats`). Le rapport nom / état passe de 0,81 à
          0,775 : l'état reste la ligne secondaire, il ne rattrape pas
          le nom.
        ⚠️ LE WEB NE BOUGE PAS : 16 et 13 px, les valeurs de la nº 640.
        La consigne ne vise que le doigt, et sa fenêtre est étroite. */
    nomTete: "text-[20px]",
    statutTete: "text-[15.5px]",
  };
  const REGLAGES_WEB = {
    ligne: reglageDeLigne("w-[22px]", 22, "text-[13.5px]"),
    selecteur: reglageDuSelecteur("min-h-[54px]", "text-[14.5px]", "text-[13px]"),
    tuileIcone: 28,
    /*  §1 (nº 538) — LA PASTILLE DU WEB : rond 18 → 14 px, chiffre
        11,5 → 10 px, même retrait de 2 px. Le rond vaut la MOITIÉ de
        la cloche (28 px), comme au doigt — c'est la cloche qui donne
        la mesure, et elle diffère d'un appareil à l'autre depuis la
        nº 537. Voir le §1 posé sur la tuile. */
    pastille:
      "absolute -right-0.5 -top-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-primaire " +
      //  §3 (nº 674) — la même découpe qu'au doigt, même anneau, même
      //  jeton : les deux surfaces posent leur compteur sur le MÊME
      //  encadré (`bg-sombre-eleve`).
      "ring-2 ring-sombre-eleve " +
      "text-[10px] font-bold text-white leading-[14px] text-center",
    //  §1 (nº 557) — 16 → 20 px, et les côtés avec (voir la note du
    //  tableau) : les quatre côtés de la fenêtre restent égaux.
    airHaut: "pt-5",
    airCote: "px-5",
    /*  ██ §2 ET §4 (nº 641) — L'AIR ET LA RÉSERVE DE LA TÊTE, AU WEB ██
        LA PHOTO NE BOUGE PAS ICI : 64 px, la valeur de la nº 640. Seul
        le doigt grandit — c'est là que le propriétaire la trouve trop
        petite.
        `mb-2` — §2 : la rangée doit avoir LE MÊME AIR au-dessus et en
        dessous. Au-dessus, c'est `airHaut`, 20 px. En dessous, la
        colonne pose son `gap-3`, 12 px. Huit pixels manquaient : les
        voici, et ILS NE TOUCHENT QUE LA TÊTE — toucher au `gap-3`
        aurait écarté du même coup les tuiles, les encadrés et les
        lignes (piège nº 378/379).
        `pr-8` — §1 : la croix a quitté la rangée pour l'ANGLE de la
        fenêtre, en surimpression. Son bord gauche retombe à 47 px du
        bord de la fenêtre (11 px de retrait pour sa cible de 36), donc
        à 27 px À L'INTÉRIEUR de la colonne du contenu, qui s'arrête à
        20. Sans réserve, un nom long passerait DESSOUS. Trente-deux
        pixels la couvrent avec cinq de reste, et le nom se tronque
        avant de l'atteindre.
        ⚠️ LA RÉSERVE NE VAUT QUE POUR LA TÊTE : les tuiles, les
        encadrés et les lignes gardent toute la largeur. */
    photoTete: "h-16 w-16",
    glypheTete: 34,
    airTete: "mb-2 pr-8",
    //  §6 (nº 641) — les tailles de la nº 640, inchangées : seul le
    //  doigt grandit (voir la note du jeu du doigt).
    nomTete: "text-[16px]",
    statutTete: "text-[13px]",
  };
  type ReglagesDuCompte = typeof REGLAGES_DOIGT;

  /**
   * ██ §1 (nº 640) — LA TÊTE DE « MON COMPTE », UNE POUR LES DEUX ██
   * ==================================================================
   * CE QUI EXISTAIT, ET QUI PART : le doigt avait un cœur de marque
   * puis une photo de 64 px CENTRÉS, surmontés d'un titre « Mon
   * compte » centré (nº 530-535, puis nº 549) ; le web avait un
   * `<h2>Mon compte</h2>` à gauche, sur sa propre rangée (nº 536-542).
   * DEUX DESSINS POUR UNE MÊME PAGE. Il n'en reste qu'un.
   *
   * CE QU'ELLE DIT, ET RIEN DE PLUS :
   *  · UN PARTICULIER — une seule ligne, « Mon compte » ;
   *  · UN PROFESSIONNEL — son nom, puis son état sous lui.
   * La photo est celle de son portfolio ; à défaut — un particulier, un
   * portfolio sans photo, ou le moment où le site ne sait pas encore —
   * c'est le rond gris à la silhouette. C'est la règle EXACTE de la
   * nº 549, déplacée sans un mot de changé : `fiche` est
   * `ficheActive(fiches, idFiche)`, donc la tête suit le déroulant, et
   * l'état neutre reste la silhouette (règles 137/203 — on ne peint pas
   * une photo qu'on n'a pas).
   *
   * ⚠️ L'ÉCRITURE DE L'ÉTAT EST CELLE DU SÉLECTEUR, REPRISE TELLE
   * QUELLE : le nom demi-gras sur une ligne, puis la pastille de 6 px
   * et le libellé gris sous lui. Les six libellés et les six couleurs
   * viennent de `LIBELLE_ETAT` / `COULEUR_ETAT` (lib/fiches-compte) —
   * la même écriture unique, aucune seconde. Seules les TAILLES sont
   * fixées ici, à la valeur du doigt (16 px / 13 px) : la tête est un
   * titre de page, pas une entrée de liste, et les deux surfaces la
   * partagent désormais.
   *
   * ⚠️ UNE ÉCRITURE, DEUX ANCRAGES (nº 641 — c'était la croix qui
   * différait à la nº 640, c'est désormais le POINT D'ATTACHE). Au WEB
   * la tête ouvre le CONTENU de la fenêtre, et la croix la survole
   * depuis l'angle. AU DOIGT elle vit DANS LA BARRE COLLANTE (nº 465),
   * sur la ligne de la croix — la place qu'elle occupait avant la
   * nº 640, et celle que le propriétaire redemande. La tête elle-même
   * ne se dédouble pas : c'est cette fonction, aux deux endroits.
   * ⚠️ LES DEUX SURFACES NE DIFFÈRENT QUE PAR TROIS RÉGLAGES —
   * `photoTete`, `glypheTete`, `airTete` — tous portés par les jeux du
   * haut, aucun nombre écrit ici.
   */
  /**
   * ██ §2 (nº 672) — LA TÊTE MONTRE ENFIN L'AVATAR DU COMPTE ██
   * ------------------------------------------------------------------
   * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : on enregistre une photo dans
   * « Éditer », la BARRE FIXE la montre, et les deux FENÊTRES « Mon
   * compte » — celle du web comme celle du doigt — gardent le rond gris
   * à la silhouette.
   * LA CAUSE EST À LA LIGNE SUIVANTE, ET ELLE SE LIT : cette tête ne
   * regardait QUE `fiche?.photo_profil`, la photo du PORTFOLIO. Or
   * « Éditer » n'existe que pour un compte SANS portfolio (voir la
   * seconde ligne de cette tête) : sa photo n'a jamais de portfolio où
   * se loger, et la tête n'avait donc rien à afficher. La barre, elle,
   * lisait la session (`photoDuCompte`, nº 645) — d'où les deux surfaces
   * qui se contredisaient.
   * LA RÈGLE APPLIQUÉE EST CELLE QUE LA nº 657 A DÉJÀ ÉCRITE, mot pour
   * mot : « l'avatar appartient au PORTFOLIO quand il y en a un, à la
   * PERSONNE quand il n'y en a pas ». Elle n'était tenue qu'à un seul
   * endroit — l'effet qui range la photo ; elle l'est maintenant aussi
   * là où on la REGARDE.
   * ⚠️ UN PROFESSIONNEL NE VOIT AUCUN CHANGEMENT : sa fiche a une photo,
   * `fiche.photo_profil` gagne, et la tête montre ce qu'elle montrait —
   * la règle de la nº 640 n'est pas touchée d'un pixel.
   * ⚠️ LES QUATRE SURFACES LISENT DÉSORMAIS LA MÊME CHOSE : la barre du
   * doigt, la barre du web, la fenêtre du doigt et la fenêtre du web.
   * `photoDuCompte` vient du COOKIE de session — elle est connue dès le
   * premier rendu, serveur compris, sans une seule requête.
   */
  const photoDeLaTete = fiche?.photo_profil ?? photoDuCompte;
  const enTeteDuCompte = (reglages: ReglagesDuCompte) => (
    <div
      data-tete-compte=""
      className={`flex items-center gap-3 ${reglages.airTete}`}
    >
      {photoDeLaTete ? (
        <PhotoRonde
          source={photoDeLaTete}
          nature="personne"
          classeTaille={reglages.photoTete}
        />
      ) : (
        //  §1 (nº 549) — le rond de repli, repris au caractère :
        //  `PhotoRonde` ne pose aucun glyphe pour `personne`, la
        //  géométrie est donc répétée une fois ici, et rien d'autre.
        //  §4 (nº 641) — le rond et son glyphe suivent la surface, au
        //  même rapport : le cercle gris ne change ni de couleur, ni
        //  de dessin, ni de règle d'apparition.
        <span
          className={`flex ${reglages.photoTete} shrink-0 items-center justify-center rounded-full bg-sombre-eleve text-sombre-texte-doux`}
        >
          <IconeSilhouette taille={reglages.glypheTete} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2
          className={`block truncate font-semibold leading-tight text-sombre-texte ${reglages.nomTete}`}
        >
          {/*  §1 (nº 657) — UN PARTICULIER QUI S'EST NOMMÉ VOIT SON
               NOM. Le repli « Mon compte » reste pour qui n'a rien
               écrit — c'est la fenêtre « Modifier » qui remplit cette
               ligne, et elle n'oblige à rien. Un PROFESSIONNEL, lui,
               garde le nom de sa fiche : la règle de la nº 640 n'est
               pas touchée. */}
          {/*  §1 (nº 675) — LE NOM SUIT LA MÊME RÈGLE QUE LA PHOTO,
               et par le même chemin : la fiche quand elle est chargée,
               le NOM AFFICHÉ de la session sinon. Ce second terme est
               ce qui change à cette passe — il portait le nom de la
               PERSONNE, il porte désormais celui du portfolio tant
               qu'il en existe un. C'est ce qui rend la tête juste AVANT
               même que la liste des fiches ne soit lue (la barre l'est
               déjà depuis la nº 645). */}
          {fiche ? fiche.nom : nomAfficheDuCompte || "My account"}
        </h2>
        {fiche ? (
          <span className="mt-1 flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${COULEUR_ETAT[etat]}`}
            />
            <span
              className={`leading-none text-sombre-texte-doux ${reglages.statutTete}`}
            >
              {LIBELLE_ETAT[etat]}
            </span>
          </span>
        ) : (
          /*  ██ §2 (nº 649) — LA SECONDE LIGNE D'UN PARTICULIER ██
               ==========================================================
               UN PROFESSIONNEL A DEUX LIGNES — son nom, puis son état
               (nº 640) ; un particulier n'en avait qu'une. Il en a deux
               à son tour : « Mon compte », puis « Éditer » (le mot de
               la nº 662 ; « Modifier » jusque-là).
               LA PLACE ET LA TAILLE SONT CELLES DE L'ÉTAT, au caractère :
               même `mt-1`, même `leading-none`, même taille
               (`statutTete` — 15,5 px au doigt, 13 au web). Rien n'est
               choisi ici ; tout est repris. SEULE LA COULEUR S'EN
               SÉPARE DEPUIS LA nº 662 (voir le §7 plus bas) : l'état
               d'un professionnel reste en gris doux, ce geste-ci passe
               au bleu des liens.
               ⚠️ PAS DE PASTILLE, et c'est voulu : le point de couleur
               dit un ÉTAT DE PUBLICATION (les six libellés de la
               nº 640). « Éditer » n'est pas un état, c'est un geste.
               ██ §7 (nº 662) — ET IL PREND LA COULEUR DES LIENS ██
               Le propriétaire la veut EXACTEMENT celle des liens des
               fiches — pas une teinte approchante. C'est donc
               `LIEN_QUI_SORT` (components/lignes-profil), L'ÉCRITURE
               UNIQUE de ces liens depuis la nº 388 : le bleu du jeton
               `lien`, son éclaircissement au survol, et la transition,
               d'un seul tenant. Aucune couleur n'est écrite ici.
               ⚠️ LE GRIS DOUX ET SES DEUX SURVOLS S'EN VONT AVEC : une
               seule classe de couleur par élément (règle nº 389), et
               `LIEN_QUI_SORT` porte déjà la sienne et son survol.
               ⚠️ ELLE NE MENAIT NULLE PART À LA nº 649, et sa note
               annonçait ceci : « le jour où la fenêtre existera, elle
               s'accrochera ici en une ligne ». C'EST CETTE LIGNE-LÀ
               (§1, nº 657) — le bouton n'a pas changé d'un caractère,
               il a reçu sa main. Ce qu'il ne promettait pas, il ne le
               promet toujours pas : ni flèche, ni chevron.
               ⚠️ MÊME ENCHAÎNEMENT QUE « LANGUE » ET « NOTIFICATIONS »
               (nº 465) : au WEB, ouvrir « Éditer » ferme « Mon
               compte » — une seule surface flottante à la fois ; au
               DOIGT, « Mon compte » est une page opaque et RESTE
               ouvert dessous, la refermer y fait retomber. */
          <button
            type="button"
            onClick={() => {
              if (!auDoigt) setOuvert(false);
              setIdentiteOuverte(true);
            }}
            className={`mt-1 block leading-none ${LIEN_QUI_SORT} ${reglages.statutTete}`}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );

  const contenuDuCompte = (
    reglages: ReglagesDuCompte,
    tete?: React.ReactNode
  ) => (
    <div className={`flex flex-col gap-3 ${reglages.airCote} ${reglages.airHaut}`}>
      {/*  §4 (nº 641) — LA TÊTE N'ENTRE ICI QU'AU WEB. Au doigt elle est
           remontée dans la barre collante, et ce paramètre reste vide :
           le contenu commence alors droit sur les tuiles. L'air qui la
           sépare d'elles vaut le `gap-3` de cette colonne PLUS le `mb-2`
           que le jeu du web porte sur la tête — vingt pixels, soit
           exactement l'air du haut (§2). */}
      {tete}
      {/* ---------- LA RANGÉE DE TROIS ---------- */}
      {/*  §3 (nº 532) — DEUX TUILES, ET ELLES SE PARTAGENT TOUTE LA
           LARGEUR : « Ajouter » a rejoint l'encadré du portfolio, sa
           place logique (§2). La grille passe de trois colonnes à
           deux ; rien d'autre de la tuile ne change — icône centrée,
           mot dessous, boîte cliquable en entier. */}
      {/*  §1 (nº 677) — la grille des tuiles devient inerte pour la
           même raison que le menu ci-dessous : un seul clic compte. */}
      <div
        className={`grid grid-cols-2 gap-3${
          entreeQuiPart ? " pointer-events-none" : ""
        }`}
      >
        <button
          type="button"
          onClick={ouvrirLesNotifications}
          className={CLASSE_TUILE}
        >
          {/*  ██ §1 (nº 538) — POURQUOI LA PASTILLE TOMBAIT À CÔTÉ DE LA
               CLOCHE, ET NON DESSUS ██
               ==========================================================
               LA CAUSE EST DOUBLE, ET LES DEUX MOITIÉS S'ADDITIONNENT.
               1) LE RETRAIT ÉTAIT PLUS GRAND QUE LA PASTILLE N'EST
               LARGE. Elle était calée à `right: -12px` de la boîte de
               l'icône — donc son bord DROIT sortait de 12 px. Large de
               18 px au web (20 au doigt), son bord GAUCHE retombait
               donc à 28 + 12 − 18 = 22 px au web, et 32 + 12 − 20 =
               24 px au doigt, mesurés depuis la gauche de la boîte.
               2) LA BOÎTE EST PLUS LARGE QUE LE DESSIN QU'ELLE TIENT.
               Le carré de l'icône fait 28 px au web, 32 au doigt — mais
               la CLOCHE n'en occupe pas toute la largeur : dans le
               repère de 24 unités, le dôme s'arrête à x = 18 (plus la
               moitié d'un trait de 1,8), c'est-à-dire à 22 px du carré
               de 28, et à 25 px du carré de 32.
               LES DEUX BOUTS SE REJOIGNENT : le bord gauche de la
               pastille (22 / 24) tombait EXACTEMENT là où le dessin
               s'arrête (22 / 25). Elle ne mordait rien — elle se posait
               au ras du glyphe, à sa droite. C'est ce que le
               propriétaire voit.
               LE REMÈDE, DANS LE MÊME ORDRE. Le retrait revient à 2 px
               (au lieu de 12) et la pastille rétrécit de moitié :
               14 px au web, 16 au doigt. Son bord gauche retombe alors
               à 16 px (web) et 18 px (doigt) — soit 6 et 7 px À
               L'INTÉRIEUR du dessin. Elle chevauche l'épaule droite du
               dôme, comme demandé.
               LE CHIFFRE SUIT LE ROND, D'UN CRAN DE MOINS : 11,5 → 10 px
               au web, 12,5 → 11 au doigt. Il rétrécit MOINS que le rond
               (le rapport passe de 0,64 à 0,71) pour rester lisible ;
               c'est l'air intérieur, ramené de 6 à 4 px, qui absorbe la
               différence.
               ⚠️ LE ROND EST UN PLANCHER, PAS UN CARCAN : un chiffre
               seul tient dans le cercle parfait ; deux chiffres et
               « 99+ » l'allongent en pastille, vers la gauche — elle ne
               coupe jamais son texte.
               SANS NOTIFICATION, RIEN : ni pastille, ni marque sur la
               cloche.
               ⚠️ IL N'Y A PLUS QU'UNE SEULE PASTILLE DANS TOUT CE
               MENU. Celle que le web portait à droite du mot
               « Notifications » a disparu AVEC SON PLAN à la nº 536,
               quand la fenêtre a repris la disposition du doigt : les
               deux surfaces montent le même arbre, et le compteur n'y
               est écrit qu'ici. */}
          <span className={`relative ${CLASSE_TUILE_ICONE}`}>
            <IconeCloche taille={reglages.tuileIcone} />
            {nonLues > 0 && (
              <span
                aria-label={`${nonLues} unread`}
                className={reglages.pastille}
              >
                {nonLues > 99 ? "99+" : nonLues}
              </span>
            )}
          </span>
          <span className={CLASSE_TUILE_MOT}>Notifications</span>
        </button>

        <Link
          href="/mes-favoris"
          replace={liensRemplacent}
          //  §1 (nº 677) — LA SECONDE OUBLIÉE DE LA nº 676. C'est une
          //  TUILE, pas une ligne : sa surbrillance d'attente est celle
          //  de son propre état enfoncé (`bg-sombre-eleve-clair`), pas
          //  celle des lignes — deux dessins, deux éclaircissements.
          onClick={(evenement) => {
            if (!partirVers("selection", "/mes-favoris")) {
              evenement.preventDefault();
            }
          }}
          className={
            entreeQuiPart === "selection" ? CLASSE_TUILE_PARTIE : CLASSE_TUILE
          }
        >
          <span className={CLASSE_TUILE_ICONE}>
            <IconeFanion taille={reglages.tuileIcone} />
          </span>
          <span className={CLASSE_TUILE_MOT}>Favorites</span>
        </Link>

      </div>

      {/* ---------- L'ENCADRÉ DU PORTFOLIO ----------
           ██ §2 (nº 532) — IL EST TOUJOURS LÀ, ET VOICI POURQUOI ██
           Il disparaissait entier tant qu'aucun portfolio n'avait été
           envoyé (la garde de toujours, celle du plan du web). Il ne le
           peut plus : « Ajouter un portfolio » vient d'y entrer, et
           c'est précisément l'entrée dont un compte NEUF a besoin — la
           faire disparaître avec l'encadré l'aurait rendue introuvable.
           LA GARDE N'EST PAS LEVÉE, ELLE DESCEND D'UN CRAN : elle porte
           désormais sur les DEUX LIGNES qui dépendent d'un portfolio
           (« Mon portfolio », « Modification »), là où elle a toujours
           eu son sens. Le déroulant garde la sienne (deux portfolios au
           moins, nº 472). Un compte neuf voit donc un encadré d'une
           seule ligne : « Ajouter un portfolio ».
           ⚠️ LE PLAN DU WEB NE BOUGE PAS : là-bas « Ajouter » est resté
           une entrée du haut, et l'encadré garde sa garde d'origine. */}
      {/**
         * §3 (nº 531) — PLUS D'AIR EN HAUT ET EN BAS : la réserve
         * verticale passe de 8 à 12 px. L'horizontale ne bouge pas
         * (8 px) — c'est elle qui, ajoutée aux 12 px que chaque ligne
         * porte déjà, pose les icônes à 20 px du bord.
         */}
      {/*  ██ §2 (nº 667) — L'ENCADRÉ D'UNE SEULE LIGNE ██
           Un compte SANS portfolio ne voit qu'« Ajouter un portfolio »
           dans cet encadré : ni déroulant (il faut deux portfolios), ni
           les deux entrées qui en dépendent. Ce cas-là — et lui seul —
           fond la ligne et l'encadré en UN SEUL bouton, pour que le
           survol éclaircisse toute la boîte au lieu d'y dessiner un
           rectangle. Voir `entreeSeule` pour l'arithmétique des marges.
           ⚠️ LE TEST EST CELUI QUI DÉCIDE DÉJÀ DU RESTE : `fiches.length`
           gouverne les deux blocs du dessous. Pas une seconde
           condition à tenir d'accord. */}
      {sansPortfolio ? (
        boutonAjouterUnPortfolio(reglages, true)
      ) : (
        <div className={`flex flex-col px-2 py-3 ${CLASSE_ENCADRE}`}>
        {/*  ██ §2 (nº 532) — « AJOUTER UN PORTFOLIO », EN TÊTE ██
             Il quitte la rangée de tuiles pour la PREMIÈRE LIGNE de
             cet encadré, au-dessus du déroulant. Son geste ne change
             pas d'un caractère : c'est `demanderUneNouvelleFiche`,
             celui-là même que le plan du web appelle — avec sa garde
             « une saisie est en cours ».
             SON ROSE EST PARTI EN DEUX TEMPS : le TEXTE à la nº 649
             (rendu à ses voisines), l'ICÔNE à la nº 658 — le
             propriétaire annule la décision de la nº 650 et veut le
             dessin en blanc, comme le mot. Cette ligne n'a donc plus
             AUCUNE couleur à elle : elle est, au caractère près,
             « Ma fiche » ou « Sécurité » avec un autre glyphe.
             §2 (nº 667) — LE BOUTON EST ÉCRIT UNE SEULE FOIS, plus haut
             (`boutonAjouterUnPortfolio`) : les deux branches montent le
             MÊME, à une classe près. */}
        {boutonAjouterUnPortfolio(reglages, false)}
        {/**
         * ██ §4 (nº 531) — LE DÉROULANT SE CALE SUR LES ICÔNES ██
         * ----------------------------------------------------------
         * CE QUI N'ALLAIT PAS, mesuré : le déroulant prenait TOUTE la
         * largeur du contenu de l'encadré — son bord gauche tombait à
         * 8 px du bord, quand les icônes des deux lignes du dessous
         * tombent à 20 px (les 8 px de l'encadré, plus les 12 px que
         * `classeEntree` porte). Il débordait donc de 12 px à gauche
         * de la colonne d'icônes, et rien ne s'alignait.
         * CE SUR QUOI ON S'ALIGNE, exactement : le BORD GAUCHE DE LA
         * BOÎTE D'ICÔNE d'une ligne — celle que `REGLAGE_LIGNE` décrit,
         * 26 px de large depuis la nº 533 —, c'est-à-dire le bord
         * gauche du glyphe « Mon portfolio ».
         * ⚠️ SA LARGEUR N'ENTRE PAS DANS LE CALCUL, et c'est ce qui
         * rend l'aplomb durable : 8 px d'encadré plus les 12 px de la
         * ligne, quelle que soit la taille du glyphe.
         * COMMENT : 12 px de retrait de chaque côté — le déroulant
         * commence donc à 8 + 12 = 20 px, pile sur les icônes, et il
         * s'arrête à 20 px du bord droit.
         * LES QUATRE AIRS, AVANT PUIS APRÈS :
         *  · à gauche  8 → 20 px  · à droite 8 → 20 px
         *  · au-dessus 8 → 20 px  · en dessous 4 → 12 px
         * ⚠️ LES TROIS PREMIERS AUGMENTENT, ET JE LE DIS PLUTÔT QUE
         * DE CHOISIR EN SILENCE : la consigne demandait de les
         * RÉDUIRE **et** d'aligner le bord gauche sur les icônes. Les
         * deux ne peuvent pas tenir ensemble — aligner sur les icônes,
         * c'est rentrer le déroulant de 12 px, donc ajouter de l'air à
         * sa gauche. J'ai retenu L'ALIGNEMENT, qui est la consigne
         * mesurable, et j'ai rendu les trois airs ÉGAUX comme demandé.
         * ⚠️ LA LISTE QUI S'OUVRE SUIT LE CHAMP : elle est posée sur
         * lui (`absolute left-0 right-0`, dans son propre conteneur),
         * donc elle prend le même retrait sans qu'on le lui dise.
         */}
        {plusieursFiches && (
          <div className="mx-3 mt-2 mb-3">
            {selecteurDePortfolio(reglages.selecteur)}
          </div>
        )}
        {fiches.length > 0 && entreesDuPortfolio(reglages.ligne)}
        </div>
      )}

      {/*  ---------- L'ENCADRÉ DU COMPTE ----------
           §1 (nº 534) — « DÉCONNEXION » Y REVIENT : le §4 de la nº 533,
           qui lui avait donné un encadré à elle, est annulé. Langue,
           Sécurité et Déconnexion tiennent de nouveau dans un seul
           encadré, comme avant. La page compte donc trois encadrés : la
           rangée de deux tuiles, le portfolio, le compte.
           ⚠️ CE QUI RESTE DE LA nº 533, ET QUI DOIT RESTER : la réserve
           basse de 72 px, plus bas — c'est elle qui tient la barre
           translucide de Safari à distance des encadrés gris. Un encadré
           de moins raccourcit la page : le défaut ne peut que s'en
           éloigner. */}
      <div className={`p-2 ${CLASSE_ENCADRE}`}>
        {entreesDuCompte(reglages.ligne)}
      </div>
    </div>
  );

  /**
   * ██ §1 (nº 645) — L'AVATAR DE LA BARRE, 28 px DANS LA CIBLE DE 40 ██
   * ==================================================================
   * IL REMPLACE LE GLYPHE, IL NE S'AJOUTE PAS : la cible de 40 px, sa
   * place, son fond de survol et sa branche « ouvert » (nº 548) sont
   * exactement ceux d'avant. Seul CE QU'ELLE CONTIENT change — une
   * silhouette rose de 24 px devient un rond de 28.
   * L'ANNEAU PASSE DE 8 À 6 px de chaque côté : c'est ce qui reste du
   * fond au survol autour de l'avatar. Il se voit toujours, moins
   * large — et pour un compte SANS photo, le rond gris de repli et
   * l'anneau portent le MÊME jeton (`bg-sombre-eleve`) : survolé,
   * l'ensemble se lit comme un seul disque de 40 px. Aucune couleur
   * nouvelle n'est employée pour autant.
   * LE ROSE S'EN VA AVEC LE GLYPHE, et c'est accepté (consigne nº 645) :
   * la photo dit qu'on est connecté mieux qu'une teinte. `text-primaire`
   * quitte donc les deux boutons — il n'y a plus de trait à peindre.
   * ⚠️ LE REPLI EST CELUI DE LA nº 549, à l'échelle de la barre : cercle
   * gris, silhouette au MÊME RAPPORT (34 / 64 = 0,53, donc 15 dans un
   * rond de 28). Un particulier, un portfolio sans photo et un compte
   * d'avant cette passe montrent tous ce rond-là.
   * ██ §1 (nº 646) — LE DÉBORD DE 2 px EST FERMÉ ██
   * ------------------------------------------------------------------
   * CE QUE LA nº 645 AVAIT LAISSÉ, mesuré à l'écran avant et après : la
   * compensation `-mr-2` (8 px) valait pour un dessin de 24 px dans une
   * boîte de 40. Un avatar de 28 ne laisse que 6 px de vide, un de 32
   * n'en laisse que 4 — le rond dépassait donc le bord droit du contenu
   * (374 px au doigt, 1256 px au web sur les écrans mesurés) de deux
   * pixels.
   * LA COMPENSATION SUIT LE DESSIN, PAR APPAREIL : (40 − 28) / 2 = 6 au
   * doigt, (40 − 32) / 2 = 4 au web. Le bord droit de l'avatar retombe
   * alors PILE sur la marge, comme le glyphe de la nº 465.
   * ⚠️ CE QUE ÇA DÉPLACE, ET JE LE CHIFFRE : la zone déborde moins,
   * donc elle occupe plus de largeur — la loupe et le fanion reculent
   * de 2 px au doigt, de 4 px au web (plus les 6 px d'air du §3). Leur
   * taille, leur cible et leur écart mutuel (`gap-3`) ne changent pas ;
   * c'est un glissement, pas une refonte, et il est arithmétique.
   * ⚠️ L'AIR DU §3 EST UNE MARGE À GAUCHE DE LA ZONE, jamais un `gap`
   * du nav : le `gap-3` est partagé par la loupe, le fanion et le globe
   * (piège nº 378/379) — le toucher les aurait tous écartés.
   */
  /*  §3 (nº 646) — LA TAILLE, UN JEU PAR APPAREIL. Le doigt garde ses
      28 px (la nº 645, au pixel) ; le web passe à 32. La séparation est
      celle des nº 537, nº 557 et nº 589 : deux variantes qui s'excluent,
      AUCUNE classe de base — la règle nº 389. */
  const TAILLE_AVATAR = "mobile:h-7 mobile:w-7 not-mobile:h-8 not-mobile:w-8";
  const dessinDeLAvatar = photoDuCompte ? (
    <PhotoRonde
      source={photoDuCompte}
      nature="personne"
      classeTaille={TAILLE_AVATAR}
    />
  ) : (
    <span
      className={`flex ${TAILLE_AVATAR} shrink-0 items-center justify-center rounded-full bg-sombre-eleve text-sombre-texte-doux`}
    >
      {/*  §3 (nº 646) — LE GLYPHE SUIT SON ROND, au rapport de la
           nº 549 (34 / 64 = 0,53) : 15 dans 28 au doigt, 17 dans 32 au
           web. L'attribut porte la valeur du DOIGT — inchangée depuis
           la nº 645 — et la classe la remplace au web ; une classe bat
           un attribut, et les deux ne peuvent pas se contredire
           puisqu'il n'y en a qu'une par appareil. */}
      <IconeSilhouette
        taille={15}
        classe="not-mobile:h-[17px] not-mobile:w-[17px]"
      />
    </span>
  );

  /**
   * ██ §1 (nº 667) — LE POINT ROSE DES NOUVELLES NON LUES ██
   * ------------------------------------------------------------------
   * CE QU'IL RÉSOUT. Le compteur des non-lues vivait UNIQUEMENT sur la
   * cloche, à l'intérieur de « Mon compte » : il fallait ouvrir le menu
   * pour apprendre qu'on avait quelque chose à lire, et un compte neuf
   * n'avait aucune raison de l'ouvrir. Le point se voit SANS RIEN
   * OUVRIR — c'est le seul signe du site posé hors d'une surface.
   * IL NE COMPTE PAS, ET C'EST VOULU (consigne du propriétaire) : le
   * CHIFFRE reste sur la cloche, là où on peut agir. Ici on dit
   * seulement « il y a quelque chose », et un chiffre de 8 px sur un
   * avatar de 28 serait illisible de toute façon.
   * ⚠️ IL EST JUSTE DÈS L'ARRIVÉE grâce au §1 de la nº 664 : les
   * nouvelles sont semées au montage, une fois par session. Sans cette
   * lecture-là, ce point serait resté éteint jusqu'à la première
   * ouverture du menu — c'est-à-dire inutile.
   * ⚠️ IL S'ÉTEINT TOUT SEUL : `nonLues` se recalcule de `notifications`,
   * que la fenêtre remet à jour quand on lit une nouvelle ou qu'on les
   * marque toutes (voir `onToutLu`, plus bas).
   * ██ §1-a (nº 668) — IL SE MET À CALIFOURCHON SUR LE CONTOUR ██
   * ------------------------------------------------------------------
   * LA nº 667 LE POSAIT DEHORS, collé au bord, et le propriétaire le
   * voit ainsi : « à l'extérieur de l'avatar ». Il le veut À CHEVAL —
   * moitié dedans, moitié dehors.
   * LA CAUSE DU DÉFAUT EST GÉOMÉTRIQUE, et elle mérite un mot parce
   * qu'elle n'est pas intuitive : `-top-0.5 -right-0.5` calait le point
   * sur le COIN de la boîte carrée de l'avatar. Or l'avatar est un
   * DISQUE : son coin haut droit est vide — le cercle passe bien plus
   * bas, à l'intérieur. Un point posé au coin, même sans débord, tombe
   * donc ENTIÈREMENT hors du dessin.
   * LE REMÈDE, ET IL SE CALCULE : le contour du disque coupe la
   * diagonale à 45°, donc à r × (1 − √2/2) ≈ 0,293 r du coin. Pour un
   * avatar de 28 (r = 14) cela fait 4,1 px ; le point mesure 8 px, son
   * centre est donc à 4 px de son propre coin. Les deux nombres
   * coïncident à un dixième près : `top-0 right-0` — le point RANGÉ
   * DANS le coin — pose son centre PILE sur le contour. Moitié sur
   * l'avatar, moitié dehors, exactement la consigne.
   * ⚠️ ET IL NE DÉBORDE PLUS DU TOUT : rangé dans la boîte de l'avatar,
   * qui est elle-même centrée dans la cible de 40 px. La zone du compte
   * n'occupe pas un pixel de plus qu'avant la nº 667.
   * ⚠️ AUCUNE COULEUR NOUVELLE : `bg-primaire`, la couleur de la
   * charte — celle que le propriétaire nomme. Elle est passée du rose
   * au ROUGE #E11144 à la nº 762 ; la pastille a suivi sans qu'on y
   * touche, puisqu'elle lit le jeton.
   *
   * ██ §3 (nº 674) — IL EST DÉCOUPÉ DANS LA PHOTO, PLUS POSÉ DESSUS ██
   * ------------------------------------------------------------------
   * CE QUE LE PROPRIÉTAIRE DEMANDE : « un contour de la couleur du fond
   * du site autour d'elle, SANS changer son diamètre — effet découpe :
   * elle ne touche plus la photo ».
   * COMMENT, ET POURQUOI PAS UNE BORDURE : une `border` mange l'
   * intérieur de la pastille (le rose passerait de 8 à 4 px) ou
   * l'agrandit, selon le modèle de boîte. `ring-2` est un OMBRAGE
   * (`box-shadow`) : il se peint À CÔTÉ du disque sans entrer dans sa
   * géométrie. Le point reste donc à 8 px exactement, à la place
   * calculée au §1-a, et gagne 2 px d'anneau tout autour.
   * ⚠️ CE N'EST PAS UN CONTOUR AU SENS DE LA CHARTE, et c'est
   * l'exception que le propriétaire assume : un anneau de la COULEUR DU
   * FOND n'est pas un trait qu'on voit, c'est un vide. On ne dessine
   * rien — on retire de la photo la couronne où le rose la touchait.
   * ⚠️ LA COULEUR EST CELLE DU FOND DU SITE (`ring-sombre-fond`,
   * #0B0F14), pas celle de la barre : la barre est en VERRE (elle
   * laisse passer ce qui défile dessous) — un anneau à sa couleur
   * n'existe pas, elle n'en a pas de fixe. Le fond du site est ce qui
   * se rapproche le plus d'un vide, et c'est ce qu'il nomme.
   */
  const avatarDeLaBarre =
    nonLues > 0 ? (
      <span className="relative flex shrink-0">
        {dessinDeLAvatar}
        <span
          aria-label={`${nonLues} new unread`}
          className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primaire
                     ring-2 ring-sombre-fond"
        />
      </span>
    ) : (
      dessinDeLAvatar
    );

  return (
    /*  ██ §2 (nº 465) — LE GLYPHE DU COMPTE SE CALE SUR LA MARGE ██
        CE QUI LE RENTRAIT, mesuré : la BOÎTE cliquable de 40 px
        (`hauteur`) affleure la marge de l'interface (le nav de la
        barre est ancré au bord de son `px-4 sm:px-6`), mais le GLYPHE
        de 24 px, centré dedans, s'arrête à (40 − 24) / 2 = 8 px du
        bord de boîte. LE REMÈDE : une marge droite négative de la
        VALEUR DE CE VIDE sur cette racine — la boîte déborde d'autant
        dans le rembourrage de la barre (16/24 px, elle y tient :
        aucun défilement horizontal), le dessin tombe sur la marge, la
        CIBLE reste 40 px. Le nav étant ancré à droite, la loupe et le
        fanion glissent d'autant, à écarts (`gap-3`) constants.
        §1 (nº 646) — ET LA VALEUR SUIT LE DESSIN, QUI A CHANGÉ DEUX
        FOIS : la silhouette de 24 px est devenue l'avatar de la
        nº 645 (28 px), puis celui-ci a grandi au web (32 px, §3). Le
        vide vaut donc 6 px au doigt et 4 au web — d'où les deux
        variantes, et plus un seul `-mr-2`. */
    <div
      ref={zone}
      className={`${EMPREINTE_ZONE_COMPTE} relative flex items-center gap-1.5`}
    >
      {/* ÉCRAN ÉTROIT : l'icône personnage, ROSE (connecté). */}
      <button
        type="button"
        onClick={basculerLeMenu}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={`My account — ${nomDeLInfobulle}`}
        title={`My account — ${nomDeLInfobulle}`}
        style={{ height: hauteur, width: hauteur }}
        //  §2 (nº 547) — LE MÊME MOT, POUR LA MÊME RAISON : c'est ce
        //  bouton-ci dans son autre habillage, il portait le même
        //  manque. Voir la note complète sur le jumeau du web, plus bas.
        //  §1 (nº 548) — LA MÊME BRANCHE, POUR LA MÊME RAISON : c'est ce
        //  bouton-ci dans son autre habillage, et il commande la MÊME
        //  surface. Voir la note complète sur le jumeau du web, plus bas.
        /*  ██ §2 (nº 646) — PLUS DE CERCLE GRIS DERRIÈRE L'AVATAR ██
             Le fond de survol et sa branche « ouvert » (nº 548)
             quittent ce bouton : l'avatar EST déjà un rond, un second
             rond derrière lui n'ajoutait rien. Voir la note complète
             sur le jumeau du web, plus bas. */
        className={`sm:hidden flex shrink-0 items-center justify-center rounded-full
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire`}
      >
        {/*  §1 (nº 645) — L'AVATAR DU COMPTE, à la place de la
             silhouette rose de rang 24 (nº 147-§5 et §6). Il est écrit
             une fois, plus haut, et posé dans les deux habillages. */}
        {avatarDeLaBarre}
      </button>

      {/* ÉCRAN LARGE (nº 147-§4) : LA CAPSULE « Mon espace » A
          DISPARU. Reste l'ICÔNE DU COMPTE seule — la silhouette, ROSE
          parce que connecté (charte).
          ⚠️ LE TRIANGLE QUI DISAIT « ouvert / fermé » EST SUPPRIMÉ
          (nº 155-§5A), à la demande du propriétaire : l'état reste dit
          aux lecteurs d'écran (`aria-expanded`), l'œil, lui, voit la
          fenêtre — l'indicateur ne disait rien de plus. Le nom du
          compte reste en info-bulle. Même gabarit rond que le globe et
          le fanion : la barre s'aligne. */}
      <button
        type="button"
        onClick={basculerLeMenu}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={`My account — ${nomDeLInfobulle}`}
        title={`My account — ${nomDeLInfobulle}`}
        style={{ height: hauteur, width: hauteur }}
        /*  ██ §2 (nº 547) — POURQUOI LE SURVOL PARAISSAIT CARRÉ ██
             LA CAUSE : `shrink-0` MANQUAIT. La largeur de 40 px n'est
             qu'une BASE dans une rangée en flex — sans ce mot, la
             rangée le rétrécit quand elle manque de place, tandis que
             la HAUTEUR, elle, ne bouge pas. Une boîte de 28 sur 40
             portant `rounded-full` ne rend plus un cercle mais un
             rectangle aux bouts arrondis : c'est le fond de survol que
             le propriétaire voit carré.
             LE REMÈDE EST CELUI DU BOUTON DES FILTRES, mot pour mot :
             lui porte `shrink-0 w-[46px] h-[46px] rounded-full`
             (MoteurTatouage) — sa boîte reste carrée, son rond reste
             rond. La loupe, le fanion et le globe le portent aussi ;
             seuls les trois accès au compte l'avaient perdu.
             ⚠️ RIEN D'AUTRE NE CHANGE : ni la taille de l'icône, ni
             celle de la cible (40 px, en ligne juste au-dessus), ni la
             position, ni la couleur du survol. */
        /*  ██ §1 (nº 548), ANNULÉ PAR LE §2 DE LA nº 646 ██
             CE QU'ELLE AVAIT RÉGLÉ, et qui n'a plus d'objet : le rond
             gris ne venait que du SURVOL ; ouvrir la fenêtre déplaçait
             le pointeur, le survol tombait, et le bouton qui commandait
             la fenêtre ouverte n'avait plus l'air d'être enfoncé. Elle
             posait donc le fond tant que la fenêtre était ouverte.
             CE QUI L'ANNULE : il n'y a plus de fond du tout sur ce
             bouton (voir le §2 ci-dessous) — ni au survol, ni ouvert.
             Le défaut qu'elle fermait ne peut plus se produire, faute
             de survol à effacer. La note reste pour dire POURQUOI la
             branche a existé, et pourquoi elle est partie. */
        /*  ██ §2 (nº 646) — LE CERCLE GRIS S'EN VA, LES DEUX ÉTATS AVEC ██
             ==========================================================
             CE QUI PART : `ETATS_ROND_BARRE` (le fond au survol et à
             l'appui) ET la branche « ouvert » de la nº 548. Le
             propriétaire ne veut plus de rond gris derrière l'avatar,
             au doigt comme au web : la photo est DÉJÀ un rond, un
             second dessous ne dit rien de plus.
             ⚠️ L'ACQUIS nº 548 TOMBE AVEC LUI, ET JE LE DIS PLUTÔT QUE
             DE LE TAIRE : « le rond reste tant que la fenêtre est
             ouverte » n'a plus d'objet — il n'y a plus de rond à tenir
             posé. Ce que la nº 548 réparait (le survol qui s'efface
             quand le pointeur part ouvrir la fenêtre) ne peut plus se
             produire, faute de survol à effacer.
             ⚠️ LE CERCLE GRIS DU PARTICULIER, LUI, RESTE — et il ne
             faut pas confondre les deux. Celui qui part était peint par
             LE BOUTON, comme un ÉTAT (survol, appui, fenêtre ouverte) ;
             celui qui reste est peint par L'AVATAR lui-même, comme une
             IDENTITÉ (le repli de la nº 549, quand il n'y a pas de
             photo). Même jeton (`bg-sombre-eleve`), deux rôles, deux
             éléments : l'un sur `<button>`, l'autre sur le `<span>` de
             l'avatar, plus haut.
             ⚠️ `transition-colors` PART AUSSI : plus aucune couleur ne
             change sur ce bouton, une transition sans rien à animer ne
             dit rien (la leçon de la nº 582 sur le chevron). Le contour
             de mise au point (`focus-visible`) ne bouge pas : il n'est
             pas un fond, et le clavier en a besoin. */
        className={`hidden sm:flex shrink-0 items-center justify-center rounded-full
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire`}
      >
        {/*  §1 (nº 645) — le même avatar qu'à l'écran étroit : une
             écriture, deux habillages. */}
        {avatarDeLaBarre}
      </button>

      {/* LE CONTENU DU MENU — écrit UNE FOIS, posé dans les deux
          habillages (web sous le bouton, smartphone au centre). */}
      {ouvert && (
        <>
          {/* WEB : la fenêtre sous le bouton.
              ⚠️ ELLE N'ÉTAIT PAS EN VERRE (nº 238-§4), ET LE
              PROPRIÉTAIRE L'A VU : l'inventaire de la nº 236 annonçait
              « la fenêtre du compte » convertie — seule celle du
              SMARTPHONE l'avait été. Deux écritures pour une même
              fenêtre, et le défaut ne se voyait donc que d'un côté :
              c'est la signature d'un doublon, et la raison pour
              laquelle le banc à une seule largeur n'a rien vu.
              ELLE PASSE PAR `MenuDeVerre` — la plaque est montée dans
              le corps du document, comme le panneau des filtres : la
              barre fixe porte son propre flou, donc une racine
              d'arrière-plan, et un enfant n'y flouterait que
              l'intérieur de la barre. */}
          <MenuDeVerre
            ouvert={ouvert}
            ancre={zone}
            refPanneau={plaqueWeb}
            /*  ██ §3 (nº 641) — LA FENÊTRE S'ÉLARGIT DE 15 % ██
                290 × 1,15 = 333,5 ; la valeur retenue est 334, l'entier
                juste au-dessus. Ce que ça déplace, et rien d'autre :
                les deux tuiles passent de 119 à 141 px de large (334 −
                40 de côtés − 12 d'écart, en deux), le déroulant des
                portfolios et les lignes du bas s'étirent d'autant —
                aucun ne porte de largeur à lui, ils suivent la
                colonne ; la croix reste calée sur le bord DROIT, elle
                ne bouge donc pas d'un pixel par rapport à lui.
                ⚠️ AUCUN DÉBORDEMENT POSSIBLE, et ce n'est pas une
                promesse mais un calcul déjà écrit : `MenuDeVerre` borne
                la largeur à l'écran moins 2 × 16 px, puis ramène la
                fenêtre dans les bords. Alignée à droite, elle s'étend
                vers la GAUCHE : son bord droit reste sous celui du
                bouton qui l'ouvre.
                ⚠️ LES AIRS DE LA nº 557 NE DÉPENDENT PAS DE LA LARGEUR :
                20 px sur les quatre côtés, portés par `airCote` et
                `airHaut` (et le `pb-5` du bas). Ils suivent la fenêtre
                sans qu'on y touche.
                ⚠️ §1 (nº 655) — LE NOMBRE A DÉMÉNAGÉ, PAS CHANGÉ : il
                est écrit auprès de `MenuDeVerre` (SurfaceDeVerre)
                depuis que « Langue » et « Notifications » prennent la
                même largeur, sur consigne. Trois copies d'un même
                nombre auraient fini par diverger. */
            largeur={LARGEUR_FENETRE_BARRE}
            /*  ██ §1 (nº 650) — LE BORD HAUT REJOINT LES AUTRES ██
                LA CAUSE, MESURÉE : le placement est PARTAGÉ et il ne
                fait aucune exception — il pose le haut du panneau au
                bas de l'ancre plus 4 px. Ce sont LES ANCRES qui
                diffèrent : la zone du compte fait 40 px de haut (bas à
                58), les champs du moteur en font 46 (bas à 61), tous
                centrés sur le même axe. Trois pixels d'écart, hérités
                tels quels par les panneaux — 62 contre 65.
                LE DÉCALAGE LES RÉCONCILIE, et sa valeur n'est pas
                choisie : c'est (46 − 40) / 2, écrite une fois dans le
                module de placement.
                ⚠️ LE GLOBE DES LANGUES EST DANS LE MÊME CAS, à la même
                valeur, et il reçoit le même décalage : les deux boutons
                ronds de la barre sont voisins — les aligner sur les
                champs sans les aligner entre eux aurait été pire que le
                défaut. */
            decalageHaut={ALIGNEMENT_BOUTON_ROND_BARRE}
            //  §6 (nº 537) — cette fenêtre-ci n'est plus en verre : fond
            //  opaque. §1 (nº 542) — et ce fond monte d'un cran, du
            //  fond de page au jeton `carte` : c'est un ESSAI de teinte,
            //  la couleur vit dans MenuDeVerre, pas ici.
            opaque
            alignement="droite"
            role="dialog"
            aria-label="My account"
            data-source-composant="MenuEspace · fenêtre web"
            className="mobile:hidden"
          >
            {/*  ██ §4 (nº 536) — LA FENÊTRE DU WEB PREND LA
                 DISPOSITION DU DOIGT ██
                 Le plan en colonne d'entrées du web est SUPPRIMÉ, code
                 compris : la fenêtre monte désormais `contenuDuCompte`,
                 celui-là même que la page du doigt monte. Deux tuiles,
                 l'encadré du portfolio avec « Ajouter » en tête, celui
                 du compte — mêmes fonds, mêmes arrondis, mêmes airs.
                 ⚠️ CE QUI NE VIENT PAS AU WEB : le cœur de la marque et
                 le titre centré. Ils appartenaient à l'EN-TÊTE de la
                 page plein écran, et ils ont quitté le dépôt à la
                 nº 640 ; la tête commune les remplace sur les deux
                 surfaces.
                 ⚠️ LES DEUX TUILES TENAIENT DÉJÀ À L'ÉTROIT, et la
                 nº 641 leur donne de l'air : la fenêtre passe de 290 à
                 334 px (§3), donc 334 − 40 de côtés − 12 d'écart =
                 282, soit 141 px par tuile au lieu de 119. La tuile
                 porte son propre air de 8 px de chaque côté : il reste
                 125 px pour le mot, contre 103 — et « Notifications »
                 à 13 px en demande toujours la même quatre-vingtaine.
                 Le filet de la nº 532 (`[overflow-wrap:anywhere]` sur
                 le mot, la grille qui étire les deux tuiles à la même
                 hauteur) reste sous le tout : même à l'étroit, le mot
                 se replie, il ne déborde jamais.
                 ⚠️ LA RÉSERVE BASSE DE 72 px NE VIENT PAS NON PLUS :
                 elle tient la barre de Safari à distance (nº 533), et
                 une fenêtre posée sous un bouton n'a pas de barre de
                 navigateur sous elle. Le web garde l'air d'un encadré —
                 16 px jusqu'à la nº 556, VINGT depuis la nº 557, comme
                 les trois autres côtés. */}
            {/*  §1 (nº 641) — `relative` : le repère de la croix de
                 l'angle, et rien d'autre. Le `pb-5` de la nº 557 ne
                 bouge pas. */}
            <div className="relative pb-5">
              {/*  ██ §1 (nº 540) — LE TITRE DE LA FENÊTRE, AU WEB SEUL ██
                   ==========================================================
                   LA FENÊTRE N'AVAIT AUCUN EN-TÊTE : ni titre, ni croix —
                   elle commençait droit sur la première rangée de tuiles.
                   Il n'y a donc rien à déplacer ni à réorganiser ; ce bloc
                   s'AJOUTE au-dessus du contenu, et le contenu ne bouge pas
                   d'un pixel.
                   L'ÉCRITURE EST CELLE DES DEUX AUTRES ÉCRANS, relevée sur
                   eux et non inventée : « Notifications » et « Langue »
                   portent le même titre à 17 px, gras, `tracking-tight`,
                   en blanc de charte (FenetreNotifications, SelecteurLangue).
                   ██ §1 (nº 541) — L'ICÔNE DEVANT LE TITRE EST RETIRÉE ██
                   La silhouette que la nº 540 avait posée devant le mot
                   n'est plus là : le TITRE lui-même se cale désormais sur
                   la marge du contenu, à l'endroit exact où l'icône
                   commençait. Le mot ne change ni de corps, ni de graisse,
                   ni de couleur.
                   ██ §2 (nº 541) — LA CROIX, À L'OPPOSÉ ██
                   Elle n'est pas dessinée pour l'occasion : c'est le
                   bouton de fermeture de « Notifications » repris ENTIER
                   (FenetreNotifications) — même glyphe (`IconeCroix`), même
                   corps de 18 px, même cible ronde de 36, même gris doux
                   qui blanchit au survol sur un rond élevé, même
                   transition. « Langue » porte le même bouton, à l'ombre
                   de survol près.
                   L'ALIGNEMENT, MESURÉ ET COMPENSÉ (la leçon des nº 465 et
                   nº 483) : la cible est PLUS LARGE que le dessin, et le
                   dessin se retrouve donc rentré par rapport au bord. Le
                   vide vaut ici (36 − 18) / 2 = NEUF pixels — la formule
                   même de la nº 483, recalculée pour cette paire-ci. Le
                   bouton est donc tiré de neuf pixels vers la droite :
                   le dessin retombe alors PILE sur le bord droit des
                   encadrés, qui s'arrêtent à la marge du contenu.
                   ⚠️ LA CIBLE NE RÉTRÉCIT PAS : ce sont ses trente-six
                   pixels qui se déplacent, pas sa taille — la règle de la
                   nº 483, mot pour mot.
                   ⚠️ LA RANGÉE GRANDIT DE CE QU'IL FAUT : le bouton fait
                   36 px de haut quand le mot seul en faisait une
                   vingtaine. C'est le prix d'une cible confortable, et
                   c'est celui que paient déjà les deux autres écrans.
                   L'AIR SOUS LE TITRE N'EST PAS UN NOMBRE DE PLUS : le
                   contenu garde SON air du haut (le réglage du web, 20 px
                   depuis la nº 557 — 16 jusque-là), qui devient l'écart
                   entre le titre et la première rangée. Le titre, lui,
                   reprend ce même réglage au-dessus de lui — un seul
                   nombre commande les deux, et il vaut l'air des côtés.
                   ⚠️ LA PAGE DU DOIGT N'EST PAS CONCERNÉE : elle a son
                   cœur de marque, son titre centré et SA PROPRE CROIX
                   depuis les nº 530-534, posés par son EN-TÊTE, pas par ce
                   contenu. Ce bloc-ci vit chez l'appelant du web et
                   n'entre jamais dans `contenuDuCompte` — rien n'est
                   partagé, rien n'a eu à être séparé.
                   ⚠️ LE NOM ACCESSIBLE DE LA FENÊTRE RESTE « Mon espace »
                   (l'`aria-label` posé plus haut) : il n'est pas visé par
                   cette passe, et je ne le change pas de mon chef. */}
              {/*  §1 (nº 557) — LA RANGÉE DU TITRE LIT LE MÊME CÔTÉ QUE
                   LE CONTENU, et c'est ce qui garde les deux alignements
                   de la nº 541 : le titre à l'aplomb du bord GAUCHE des
                   encadrés, la croix à l'aplomb de leur bord DROIT. Elle
                   écrivait `px-4` en dur ; les deux valeurs se seraient
                   séparées au premier changement. Un seul réglage, deux
                   rangées, aucun écart possible.
                   ⚠️ LA COMPENSATION DE LA CROIX NE BOUGE PAS : ses
                   −9 px valent (36 − 18) / 2, un écart entre la cible et
                   son dessin — il ne dépend pas de l'air des côtés. Le
                   rembourrage déplace la boîte du bouton ET le bord des
                   encadrés du même nombre : le dessin retombe au même
                   endroit relatif, quel que soit ce nombre. */}
              {/*  ██ §1 (nº 640) — LA RANGÉE DU TITRE A DISPARU ██
                   Le `<h2>Mon compte</h2>` et sa rangée s'en vont : la
                   tête commune les remplace, et la croix la rejoint —
                   une seule rangée au lieu de deux. L'air du haut ne
                   change pas de valeur, il change de porteur : c'est
                   celui de `contenuDuCompte` (`airHaut`, 20 px depuis
                   la nº 557) qui ouvre désormais la fenêtre.
                   ⚠️ CE QUE LA nº 557 DISAIT DE `airHaut` — « il
                   commande DEUX écarts, celui au-dessus du titre ET
                   celui entre le titre et la première rangée » — n'a
                   plus qu'un seul emploi : il n'y a plus de titre entre
                   les deux. C'est un écart de moins, pas une valeur
                   changée.
                   ⚠️ LA CROIX GARDE SES −9 px (nº 541) : ils viennent
                   de l'écart entre sa cible de 36 px et son glyphe de
                   18, jamais du titre. Elle vit dans le même retrait
                   latéral, donc son dessin retombe toujours à l'aplomb
                   du bord droit des encadrés. */}
              {/*  ██ §1 (nº 641) — LA CROIX RETOURNE DANS L'ANGLE ██
                   ==========================================================
                   ELLE NE FAIT PLUS PARTIE DE LA RANGÉE de la tête : la
                   nº 640 l'y avait mise, le propriétaire la veut dans
                   l'ANGLE de la fenêtre, en surimpression. Elle sort donc
                   du flux (`absolute`) et s'accroche aux deux bords du
                   contenu — d'où le `relative` sur la boîte au-dessus.
                   LES DEUX RETRAITS SONT CEUX DU CONTENU, PAS DES
                   NOMBRES NEUFS : `right-5` et `top-5` valent les 20 px
                   de la nº 557, ceux-là mêmes que `airCote` et `airHaut`
                   posent sur la colonne.
                   LA COMPENSATION DE −9 px (nº 541) OPÈRE MAINTENANT DANS
                   LES DEUX SENS, et c'est la MÊME formule, pas une
                   seconde : (36 − 18) / 2 = 9, l'écart entre la cible et
                   son dessin. Horizontalement elle existait déjà ;
                   verticalement elle devient nécessaire parce que la
                   croix n'a plus de rangée pour la caler. Résultat : le
                   dessin retombe PILE à 20 px du haut et à 20 px de la
                   droite — l'aplomb du haut de la photo et celui du bord
                   droit des encadrés.
                   ⚠️ LA CIBLE NE RÉTRÉCIT PAS, ce sont ses 36 px qui se
                   déplacent (la règle de la nº 483, mot pour mot).
                   ⚠️ LE TEXTE NE PASSE PAS DESSOUS : la tête réserve
                   32 px à sa droite (`airTete`, jeu du web) et le nom se
                   tronque avant de l'atteindre. Le calcul est dans la
                   note du réglage.
                   ⚠️ ELLE SUIT LE CONTENU S'IL DÉFILE : la fenêtre a une
                   hauteur maximale, et rien de collant. C'était déjà le
                   cas quand elle vivait dans la rangée du titre
                   (nº 541) — ce point ne change pas. */}
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Close"
                className="absolute right-5 top-5 -mr-[9px] -mt-[9px]
                           w-9 h-9 flex items-center justify-center
                           rounded-full text-sombre-texte-doux
                           hover:text-sombre-texte hover:bg-sombre-eleve
                           transition-colors"
              >
                <IconeCroix taille={18} />
              </button>
              {contenuDuCompte(REGLAGES_WEB, enTeteDuCompte(REGLAGES_WEB))}
            </div>
          </MenuDeVerre>

          {/*  ██ SMARTPHONE — UNE PAGE, PLUS UNE FENÊTRE (§4, nº 465) ██
               La fenêtre centrée de la nº 238 (voile, plaque de verre
               étroite) est REMPLACÉE, sur consigne : « Mon compte »
               adopte le gabarit de la page de recherche du doigt —
               le titre et sa silhouette en haut à gauche, la croix à
               l'opposé (`EnTetePleinEcran`, l'écriture partagée), le
               fond opaque plein écran, le contenu qui défile dessous.
               L'étape d'historique du menu (posée plus haut,
               `useEtapeQuiSeReferme(auDoigt && ouvert)`) ne bouge
               pas : le retour du téléphone referme la page, la croix
               reprend l'étape — un appui, une surface (nº 332-§1/§4).
               LE CONTENU EST LE MÊME OBJET (`contenuMenu`) : pas une
               ligne des entrées n'est réécrite. « Langue » et
               « Notifications » s'ouvrent PAR-DESSUS (z-[85] contre
               z-[70] ici) pendant que cette page reste montée
               dessous : les refermer y fait retomber. */}
          {/*  §1 (nº 530) — LE CONTENU DU DOIGT EST UN PLAN À LUI
               (`contenuMenuDoigt`), celui du web reste au web. La
               nº 640 n'y touche pas ; elle ne change que la tête. */}
          {/*  ██ §4 (nº 641) — LA TÊTE REMONTE DANS LA BARRE ██
               CE QUI PART (nº 640) : le rond de 64 px CENTRÉ (nº 549) et
               le titre « Mon compte » centré dessous (nº 530-534), avec
               le drapeau `enTeteCentre`.
               CE QUE LA nº 640 AVAIT FAIT, ET QUI NE TIENT PAS : elle
               avait posé la tête dans le CONTENU, donc SOUS la barre du
               haut. Le propriétaire la veut DANS la barre, sur la ligne
               de la croix — photo à gauche, nom et état au milieu, croix
               à droite, comme avant la nº 640.
               COMMENT : la page reçoit la tête par `tete`, à la place du
               `titre` que les quatre autres écrans donnent. C'est la
               MÊME fonction qu'au web ; seuls trois réglages diffèrent
               (photo 80 px au lieu de 64, glyphe 42 au lieu de 34,
               aucune réserve à droite).
               ⚠️ LA BARRE RESTE COLLANTE ET LE CONTENU DÉFILE DESSOUS :
               rien n'est touché au gabarit de la nº 465 — ni le
               `sticky top-0`, ni le fond opaque, ni les 24 px sous
               l'encoche, ni le recalage sur `visualViewport` (nº 477).
               La barre est simplement plus haute qu'avec un titre seul,
               comme elle l'était avant la nº 640.
               ⚠️ LA PHOTO SUIT TOUJOURS LA RÈGLE DE LA nº 549 — celle du
               portfolio affiché, sinon le cercle gris à la silhouette —
               et cette règle n'est écrite qu'une fois, dans
               `enTeteDuCompte`. */}
          <PagePleinEcranMobile
            ariaLabel="My account"
            tete={enTeteDuCompte(REGLAGES_DOIGT)}
            surFermer={() => setOuvert(false)}
          >
            {/*  ██ §6 (nº 533) — LA RÉSERVE QUI TIENT LA BARRE DE
                 SAFARI À DISTANCE ██
                 LA CAUSE, NOMMÉE. La barre du bas de Safari est
                 TRANSLUCIDE : elle montre la page à travers elle. Ce
                 qu'elle montrait jusqu'à la nº 531, c'était le fond de
                 la page — donc du bleu nuit, donc « rien ». Depuis la
                 nº 532 elle montre un ENCADRÉ, et c'est le gris des
                 encadrés qu'on lit. AUCUNE COULEUR N'A CHANGÉ (la
                 nº 532 n'a touché ni fond ni `theme-color` — celui-ci
                 vaut le bleu nuit depuis longtemps, dans le gabarit du
                 produit) : c'est CE QUI PASSE SOUS LA BARRE qui a
                 changé, parce que la page a GRANDI d'environ 76 px (le
                 cœur +20, la ligne « Ajouter » +46, le déroulant +10).
                 Arrivé en bout de course, le dernier encadré se range
                 désormais sous la barre.
                 L'INGRÉDIENT EST ANTÉRIEUR, ET JE LE DIS : le gris est
                 celui des encadrés de la nº 530. La nº 532 n'a pas
                 fabriqué la couleur, elle l'a amenée là.
                 LE REMÈDE, INDÉPENDANT DE TOUTE HYPOTHÈSE : garder du
                 FOND DE PAGE sous la barre en toutes circonstances. La
                 réserve basse passe de 24 px à 72 px (l'encoche du
                 bas, quand elle existe, vaut une trentaine de pixels :
                 le plancher de 72 la couvre et la dépasse). La barre de
                 Safari mesure une cinquantaine de pixels : elle ne peut
                 plus atteindre un encadré.
                 ⚠️ LA FORME EST CELLE QUE LE SITE EMPLOIE DÉJÀ —
                 `max(<plancher>, env(safe-area-inset-bottom))`. Un
                 `calc` imbriqué dans le `max` n'était pas produit par
                 la feuille : vérifié, et écarté.
                 ⚠️ ET LE §4 AGGRAVE LE DÉFAUT, d'où le traitement des
                 deux ensemble : « Déconnexion » ajoute un encadré de
                 plus en bas de page, donc encore de la hauteur et un
                 gris de plus près du bord. */}
            <div className="grow pb-[max(4.5rem,env(safe-area-inset-bottom))]">
              {contenuDuCompte(REGLAGES_DOIGT)}
            </div>
          </PagePleinEcranMobile>
        </>
      )}

      {/* LA FENÊTRE DES NOTIFICATIONS — au-dessus du menu, sur les
          deux appareils. Marquer une nouvelle comme lue met le
          compteur à jour SUR-LE-CHAMP, sans attendre le serveur.
          ██ §2 (nº 655) — ELLE REJOINT LA BARRE, AU WEB ██
          Elle était CENTRÉE à l'écran, sous un voile ; elle se pose
          désormais SOUS L'AVATAR, à droite, comme « Mon compte ». D'où
          l'ancre : c'est `zone`, exactement celle que la fenêtre du
          compte reçoit plus haut — jamais un des deux boutons, dont
          l'un est toujours en `display: none` (voir la note du §
          d'ouverture de ce fichier). Le doigt, lui, garde sa page
          plein écran : l'ancre n'y sert à rien. */}
      {notificationsOuvertes && (
        <FenetreNotifications
          ancre={zone}
          notifications={notifications}
          onFermer={() => setNotificationsOuvertes(false)}
          /*  §1 (nº 672) — LES DEUX GESTES SONT PASSÉS AU MAGASIN, au
              caractère près : ils faisaient exactement cela sur l'état
              local. Ce qui change n'est pas ce qu'ils font, c'est OÙ ils
              le font — la liste survit maintenant au démontage de la
              barre, donc le compteur aussi. */
          onLue={marquerLue}
          onToutLu={marquerToutLu}
        />
      )}

      {/* LA FENÊTRE DES LANGUES — montée ICI, et non dans la ligne qui
          l'ouvre (nº 238-§5) : la ligne vit dans le menu, la fenêtre
          lui survit. Ouvrir ferme « Mon compte » ; fermer rend la
          page, sans rien rouvrir. */}
      {/*  ██ §1 (nº 655) — ELLE REJOINT LA BARRE, AU WEB ██
           Même déménagement que « Notifications » juste au-dessus, et
           la MÊME ancre : `zone`. La fenêtre centrée du web laisse la
           place au menu ancré sous l'avatar ; le doigt ne bouge pas.
           ⚠️ LE GLOBE DE LA BARRE (visiteur non connecté) MONTE LA
           MÊME `FenetreLangue`, mais SANS ancre : il n'en a pas besoin
           — il n'ouvre cette écriture-là que sur un vrai téléphone, où
           c'est une page. */}
      {langueOuverte && (
        <FenetreLangue
          ancre={zone}
          surFermeture={() => setLangueOuverte(false)}
        />
      )}

      {/*  ██ §1 (nº 657) — LA FENÊTRE « MODIFIER » DU PARTICULIER ██
           Montée ICI comme les deux précédentes, et pour la même raison
           (nº 238-§5) : la ligne qui l'ouvre vit dans la tête du menu,
           la fenêtre doit lui survivre. Même ancre (`zone`), donc même
           place et même largeur que « Mon compte » — la consigne.
           ⚠️ SON CONTENU SE LIT DANS LA SESSION, pas ici : elle appelle
           `useUtilisateur` elle-même (un magasin de module, aucune
           requête). Ce menu n'a rien à lui passer. */}
      {identiteOuverte && (
        <FenetreIdentite
          ancre={zone}
          surFermeture={() => setIdentiteOuverte(false)}
        />
      )}

      {/* ---------- « MODIFICATIONS NON ENREGISTRÉES » ----------
          ⚠️ LA FENÊTRE PARTAGÉE (passe nº 116) : le même avertissement
          que celui de la garde de navigation globale (GardeSaisie) —
          mêmes textes, même charte (aucun contour, capsule pleine
          largeur pour rester, texte rouge pour quitter). Deux
          fenêtres différentes pour un même danger auraient fini par
          se contredire. */}
      {avertirAvantCreation && (
        <FenetreNonEnregistre
          surRester={() => setAvertirAvantCreation(false)}
          surQuitter={allerCreerUneFiche}
        />
      )}
    </div>
  );
}
