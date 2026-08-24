"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ETATS_ROND_BARRE,
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
//  §1 (nº 531) — le cœur de la marque en tête de « Mon compte » au
//  doigt : l'écriture unique de cette image, jamais son chemin.
//  §1 (nº 549) — le rond de tête de la page du doigt : la photo de
//  profil du portfolio affiché. Écriture unique du rond photo (nº 492).
import { PhotoRonde } from "@/components/BlocLieux";
import { EntreeLangue, FenetreLangue } from "@/components/SelecteurLangue";
import { FenetreNotifications } from "@/components/FenetreNotifications";
import { MenuDeVerre } from "@/components/SurfaceDeVerre";
//  §4 (nº 465) — au doigt, « Mon compte » est une PAGE plein écran (le
//  gabarit de la page de recherche), plus une fenêtre centrée.
import { PagePleinEcranMobile } from "@/components/PagePleinEcranMobile";
//  §1 (nº 469) — le verrou de défilement compté (surfaces empilées).
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";
//  §3 (nº 469) — le trait de chargement, commandé à la main quand la
//  PREMIÈRE ouverture de « Mon compte » attend sa lecture (nº 142).
import {
  demarrerLeSigneManuel,
  finirLeSigneManuel,
} from "@/components/SigneDeChargement";
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
import type { Notification } from "@/lib/notifications";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { travailEnCours } from "@/lib/travail-en-cours";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
import { useAppareilMobile } from "@/lib/appareil";
//  §4 (nº 330) — la consigne « pas de photo en haut » des liens
//  internes, posée par l'écriture unique.
import { avecConsigneDeLienInterne } from "@/components/ContenuFiche";
//  §3 (nº 330) — l'étape d'historique, écriture unique des quatre
//  surfaces qui couvrent l'écran.
import {
  laNavigationRemplaceLEtape,
  laSurfaceVaNaviguer,
  useEtapeQuiSeReferme,
} from "@/lib/etape-refermable";

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
  /** Les nouvelles du compte, et leur fenêtre. */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOuvertes, setNotificationsOuvertes] = useState(false);
  /** La fenêtre des langues (nº 238-§5) : montée par le MENU, pas par
      sa ligne — elle survit donc à la fermeture du menu. */
  const [langueOuverte, setLangueOuverte] = useState(false);
  /** L'avertissement « tu as une saisie en cours » — voir plus bas. */
  const [avertirAvantCreation, setAvertirAvantCreation] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  /*  §7-a (nº 532) — LE CONTENEUR DU DÉROULANT DE PORTFOLIO : ce qui
      est DEDANS n'est pas « à côté ». Voir la garde de fermeture. */
  const conteneurSelecteur = useRef<HTMLDivElement>(null);
  //  §2 (nº 293), §3 (nº 294) — LA FENÊTRE DU COMPTE assombrit tout
  //  l'écran, et son déclencheur reste clair. Web uniquement : le
  //  crochet s'écarte de lui-même au doigt.
  useVoileDeLaPage(ouvert, zone);
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
   * choisissent un portfolio) sont dans le conteneur, et passent.
   * ⚠️ AU DOIGT SEULEMENT : le web n'a pas cette fermeture aujourd'hui,
   * il ne l'a pas davantage demain.
   */
  useEffect(() => {
    if (!auDoigt || !selecteurOuvert) return;
    const avaler = (evenement: MouseEvent) => {
      const cible = evenement.target;
      if (cible instanceof Node && conteneurSelecteur.current?.contains(cible)) {
        return;
      }
      evenement.preventDefault();
      evenement.stopPropagation();
      setSelecteurOuvert(false);
    };
    window.addEventListener("click", avaler, true);
    return () => window.removeEventListener("click", avaler, true);
  }, [auDoigt, selecteurOuvert]);
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
  /*  §3-b (nº 472) — Y A-T-IL DE QUOI CHOISIR ? Un seul portfolio :
      pas de menu déroulant (il n'ouvrirait qu'une liste d'un nom) et
      pas de fond clair (il n'annonce plus un choix). Les deux
      reviennent ensemble au DEUXIÈME portfolio. */
  const plusieursFiches = fiches.length > 1;
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

  /** LES FICHES ET LES NOUVELLES — une lecture, les deux ensemble.
      ⚠️ ELLE N'EST JAMAIS LANCÉE AU MONTAGE, et ce n'est pas un
      oubli : une lecture authentifiée sur CHAQUE page, pour un menu
      que la plupart des visites n'ouvrent jamais, coûte une requête à
      chaque affichage — et fait rejouer la session du client Supabase
      hors de tout geste (mesuré : la liste des favoris s'en trouvait
      perdue). On lit quand on ouvre, et seulement là. */
  const lireLeCompte = useCallback(async () => {
    try {
      const supabase = creerClientSupabaseNavigateur();
      const liste = await chargerFichesDuCompte(supabase, idUtilisateur);
      setFiches(liste);
      // On recale le choix : la fiche mémorisée peut avoir disparu.
      setIdFiche((courant) => ficheActive(liste, courant)?.id ?? null);
    } catch {
      //  ⚠️ ON NE VIDE PAS LA LISTE (passe nº 142). Une lecture qui
      //  échoue — réseau coupé le temps d'un geste — faisait
      //  disparaître le bloc du portfolio d'un menu déjà ouvert. On
      //  garde ce qu'on montrait : seule une lecture RÉUSSIE change
      //  ce qui est à l'écran.
    }
    try {
      const reponse = await fetch("/api/tatoueur/notifications");
      const donnees = (await reponse.json().catch(() => null)) as {
        notifications?: Notification[];
      } | null;
      setNotifications(donnees?.notifications ?? []);
    } catch {
      // Pas de nouvelles : le menu vit très bien sans.
    }
  }, [idUtilisateur]);

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
      return;
    }
    void (async () => {
      /*  §3 (nº 469) — LE TRAIT ROSE PENDANT L'ATTENTE, AU DOIGT.
          La PREMIÈRE ouverture attend sa lecture (nº 142) : pendant ce
          temps, rien ne bouge à l'écran — exactement le défaut que le
          signe central ferme pour les navigations (nº 441). Il est
          COMMANDÉ ici à la main : même composant, même seuil de
          200 ms — une ouverture rapide ne montre rien. Les ouvertures
          suivantes sont immédiates (dejaLu) : aucun appel. */
      const auDoigt =
        document.documentElement.dataset.appareil === "mobile";
      if (auDoigt) demarrerLeSigneManuel("mon-compte");
      await lireLeCompte();
      dejaLu.current = true;
      setOuvert(true);
      if (auDoigt) finirLeSigneManuel("mon-compte");
    })();
  }, [ouvert, lireLeCompte]);

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
    setOuvert(false);
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
      if (notificationsOuvertes || langueOuverte) return;
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
  }, [ouvert, notificationsOuvertes, langueOuverte]);

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
  useEffect(() => {
    if (!ouvert) return;
    if (document.documentElement.dataset.appareil !== "mobile") return;
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
    creerClientSupabaseNavigateur()
      .auth.signOut()
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
   * ne se monte QUE sur son appareil (la fenêtre est `mobile:hidden`,
   * la page `hidden mobile:flex`). Elle passe donc son jeu, et c'est
   * tout — rien à interroger, rien qui puisse se tromper.
   * ⚠️ CE QUI RESTE COMMUN, ET QUI DOIT LE RESTER : la géométrie d'une
   * entrée (hauteur de 46 px, retrait de 12 px, rayon, état enfoncé),
   * le dessin des tuiles, les fonds, les arrondis, l'ordre et
   * l'inventaire des entrées. Seuls des NOMBRES diffèrent.
   *
   * §2 (nº 532) — LA GÉOMÉTRIE D'UN CÔTÉ, LA COULEUR DE L'AUTRE.
   * « Ajouter un portfolio » est ROSE et reste une entrée en tout
   * point identique aux autres : on sépare ce qui ne doit jamais
   * varier de la seule chose qui varie — la couleur. Deux chaînes
   * écrites en entier auraient fini par diverger.
   */
  const reglageDeLigne = (
    largeurBoite: string,
    taille: number,
    ecriture: string
  ) => {
    const geometrie =
      "flex w-full items-center gap-3 rounded-xl px-3 min-h-[46px] text-left " +
      `${ecriture} font-semibold ` +
      "hover:bg-white/5 active:bg-white/10 transition-colors";
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
      entreeAction: `${geometrie} text-primaire`,
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
    <div className="relative" ref={conteneurSelecteur}>
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
            {fiche ? fiche.nom : "Aucun portfolio"}
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

  /** LES DEUX ENTRÉES DU PORTFOLIO CHOISI — « Mon portfolio » d'abord
      (acquis nº 472-§3a), puis « Modification ». */
  const entreesDuPortfolio = (reglage: ReglageLigne) => (
    <nav aria-label="Le portfolio choisi" className="flex flex-col gap-0.5">
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
        onClick={() => setOuvert(false)}
        className={reglage.entree}
      >
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          <IconeUtilisateur taille={reglage.taille} />
        </span>
        Mon portfolio
      </Link>

      {/* Le formulaire, en haut de page. L'ÉVÉNEMENT prévient le
          formulaire s'il est DÉJÀ affiché (naviguer vers la même
          adresse ne déclenche rien) : il remonte alors la page et
          rouvre l'annonce de validation lui-même. */}
      <Link
        href={versFiche()}
        replace={liensRemplacent}
        onClick={() => {
          setOuvert(false);
          window.dispatchEvent(new Event("yokofolio-modification-demandee"));
        }}
        className={reglage.entree}
      >
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          <IconeReglages taille={reglage.taille} />
        </span>
        Modification
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
    <nav aria-label="Mon compte" className="flex flex-col gap-0.5">
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
        onClick={() => setOuvert(false)}
        className={reglage.entree}
      >
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          {/* UN BOUCLIER, plus un cadenas (nº 129) : le cadenas dit
              « c'est fermé », le bouclier dit « c'est protégé » —
              c'est bien de cela qu'il s'agit ici. */}
          <IconeBouclierTrait taille={reglage.taille} />
        </span>
        Sécurité
      </Link>

      <button type="button" onClick={deconnecter} className={reglage.entree}>
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          <IconeSortie taille={reglage.taille} />
        </span>
        Déconnexion
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
  const CLASSE_ENCADRE = "rounded-xl bg-sombre-eleve";
  /*  La tuile : sa boîte est son bouton. Le survol et l'appui
      reprennent l'écriture des plaques cliquables (nº 502) — une seule
      couleur de fond, remplacée, jamais empilée. */
  const CLASSE_TUILE =
    `flex flex-col items-center gap-2 px-2 py-4 ${CLASSE_ENCADRE} ` +
    "transition-colors hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair";
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
   * (le `px-4` du contenu) et le haut n'en valait que 4. Au doigt, ce
   * 4 px est juste — l'en-tête de la page pose déjà l'air au-dessus.
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
      "text-[11px] font-bold text-white leading-4 text-center",
    airHaut: "pt-1",
    //  §1 (nº 557) — LES 16 px DE LA PAGE, AU PIXEL PRÈS : c'est la
    //  valeur qui était écrite en dur dans le corps commun. Elle ne
    //  change pas, elle change seulement d'endroit.
    airCote: "px-4",
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
      "text-[10px] font-bold text-white leading-[14px] text-center",
    //  §1 (nº 557) — 16 → 20 px, et les côtés avec (voir la note du
    //  tableau) : les quatre côtés de la fenêtre restent égaux.
    airHaut: "pt-5",
    airCote: "px-5",
  };
  type ReglagesDuCompte = typeof REGLAGES_DOIGT;

  const contenuDuCompte = (reglages: ReglagesDuCompte) => (
    <div className={`flex flex-col gap-3 ${reglages.airCote} ${reglages.airHaut}`}>
      {/* ---------- LA RANGÉE DE TROIS ---------- */}
      {/*  §3 (nº 532) — DEUX TUILES, ET ELLES SE PARTAGENT TOUTE LA
           LARGEUR : « Ajouter » a rejoint l'encadré du portfolio, sa
           place logique (§2). La grille passe de trois colonnes à
           deux ; rien d'autre de la tuile ne change — icône centrée,
           mot dessous, boîte cliquable en entier. */}
      <div className="grid grid-cols-2 gap-3">
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
                aria-label={`${nonLues} non lue${nonLues > 1 ? "s" : ""}`}
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
          onClick={() => setOuvert(false)}
          className={CLASSE_TUILE}
        >
          <span className={CLASSE_TUILE_ICONE}>
            <IconeFanion taille={reglages.tuileIcone} />
          </span>
          <span className={CLASSE_TUILE_MOT}>Sélection</span>
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
      <div className={`flex flex-col px-2 py-3 ${CLASSE_ENCADRE}`}>
        {/*  ██ §2 (nº 532) — « AJOUTER UN PORTFOLIO », EN TÊTE ██
             Il quitte la rangée de tuiles pour la PREMIÈRE LIGNE de
             cet encadré, au-dessus du déroulant. Son geste ne change
             pas d'un caractère : c'est `demanderUneNouvelleFiche`,
             celui-là même que le plan du web appelle — avec sa garde
             « une saisie est en cours ».
             ⚠️ SON ICÔNE ET SON TEXTE SONT ROSES (`primaire`, nº 466)
             — un usage de charte, pas une dérive : c'est LA SEULE
             ACTION de cette page, tout le reste y mène quelque part.
             La ligne reprend LA GÉOMÉTRIE des entrées (même
             hauteur, même retrait, même état enfoncé que ses
             voisines) et n'en change QUE la couleur du texte —
             `entreeAction`, plus haut : une classe de couleur
             par élément, jamais deux empilées. */}
        <button
          type="button"
          onClick={demanderUneNouvelleFiche}
          className={reglages.ligne.entreeAction}
        >
          {/*  §1 (nº 533) — L'ICÔNE EST CELLE DE « MON PORTFOLIO »,
               OUVERTE EN HAUT À DROITE, avec un petit « + » dans
               l'ouverture (voir IconeAjouterPortfolio). Le lecteur
               reconnaît l'objet avant de lire le mot.
               L'ICÔNE N'ÉCRIT AUCUNE COULEUR : elle hérite du rose de
               sa ligne (nº 532). La boîte de largeur fixe, elle, est la
               même que ses voisines — les libellés partent tous du même
               pixel. */}
          <span className={reglages.ligne.boite}>
            <IconeAjouterPortfolio taille={reglages.ligne.taille} />
          </span>
          <span className="flex-1">Ajouter un portfolio</span>
        </button>
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

  return (
    /*  ██ §2 (nº 465) — LE GLYPHE DU COMPTE SE CALE SUR LA MARGE ██
        CE QUI LE RENTRAIT, mesuré : la BOÎTE cliquable de 40 px
        (`hauteur`) affleure la marge de l'interface (le nav de la
        barre est ancré au bord de son `px-4 sm:px-6`), mais le GLYPHE
        de 24 px, centré dedans, s'arrête à (40 − 24) / 2 = 8 px du
        bord de boîte — web comme doigt (les deux boutons ci-dessous
        portent `taille={24}`). LE REMÈDE : `-mr-2` (8 px) sur cette
        racine — la boîte déborde de 8 px dans le rembourrage de la
        barre (16/24 px, elle y tient : aucun défilement horizontal),
        le glyphe tombe sur la marge, la CIBLE reste 40 px. Le nav
        étant ancré à droite, la loupe et le fanion glissent d'autant,
        à écarts (`gap-3`) constants. */
    <div ref={zone} className="-mr-2 relative flex items-center gap-1.5">
      {/* ÉCRAN ÉTROIT : l'icône personnage, ROSE (connecté). */}
      <button
        type="button"
        onClick={basculerLeMenu}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={`Mon espace — ${nom}`}
        title={`Mon espace — ${nom}`}
        style={{ height: hauteur, width: hauteur }}
        //  §2 (nº 547) — LE MÊME MOT, POUR LA MÊME RAISON : c'est ce
        //  bouton-ci dans son autre habillage, il portait le même
        //  manque. Voir la note complète sur le jumeau du web, plus bas.
        //  §1 (nº 548) — LA MÊME BRANCHE, POUR LA MÊME RAISON : c'est ce
        //  bouton-ci dans son autre habillage, et il commande la MÊME
        //  surface. Voir la note complète sur le jumeau du web, plus bas.
        className={`sm:hidden flex shrink-0 items-center justify-center rounded-full
                   text-primaire transition-colors
                   ${ouvert ? "bg-sombre-eleve" : ETATS_ROND_BARRE}
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire`}
      >
        {/*  LA SILHOUETTE SEULE, rang 24 (nº 147-§5 et §6) — ROSE :
             c'est l'état connecté, le rose le dit (charte). */}
        <IconeSilhouette taille={24} />
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
        aria-label={`Mon espace — ${nom}`}
        title={`Mon espace — ${nom}`}
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
        /*  ██ §1 (nº 548) — LE ROND RESTE TANT QUE LA FENÊTRE EST
             OUVERTE ██
             LE DÉFAUT : le rond gris ne venait que du SURVOL. Ouvrir la
             fenêtre déplace le pointeur — le survol tombe, le rond avec
             lui, et le bouton qui commande la fenêtre ouverte n'avait
             plus l'air d'être enfoncé.
             LE REMÈDE EST CELUI DU BOUTON DES FILTRES (nº 507,
             MoteurTatouage), repris mot pour mot : OUVERT, le fond est
             POSÉ ; FERMÉ, ce sont les états de survol et d'appui.
             JAMAIS LES DEUX — un seul fond peint à la fois, c'est la
             règle nº 389, et c'est pourquoi la branche est exclusive.
             LA COULEUR N'EST PAS CHOISIE : `bg-sombre-eleve` EST le
             jeton que `ETATS_ROND_BARRE` peint au survol. Ouvert et
             survolé se ressemblent donc au pixel, comme demandé.
             ⚠️ LE GLYPHE N'A PAS D'ÉTAT DE SURVOL À REPRENDRE : il est
             ROSE en permanence (c'est l'état connecté qui le dit,
             charte) — `ETATS_ROND_BARRE` ne touche que le fond. Il n'y
             a donc rien de plus à poser.
             ⚠️ RIEN D'AUTRE NE CHANGE : ni la taille de l'icône, ni
             celle de la cible (40 px, en ligne plus haut), ni la
             position. */
        className={`hidden sm:flex shrink-0 items-center justify-center rounded-full
                   text-primaire transition-colors
                   ${ouvert ? "bg-sombre-eleve" : ETATS_ROND_BARRE}
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire`}
      >
        <IconeSilhouette taille={24} classe="shrink-0" />
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
            largeur={290}
            //  §6 (nº 537) — cette fenêtre-ci n'est plus en verre : fond
            //  opaque. §1 (nº 542) — et ce fond monte d'un cran, du
            //  fond de page au jeton `carte` : c'est un ESSAI de teinte,
            //  la couleur vit dans MenuDeVerre, pas ici.
            opaque
            alignement="droite"
            role="dialog"
            aria-label="Mon espace"
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
                 le titre centré. Ils appartiennent à l'EN-TÊTE de la
                 page plein écran, pas au contenu — la fenêtre garde
                 donc le sien sans qu'on ait rien à écarter.
                 ⚠️ LES DEUX TUILES TIENNENT, mesuré : la fenêtre fait
                 290 px, moins les 16 px de marge de chaque côté du
                 contenu et les 12 px d'écart — 123 px par tuile, quand
                 « Notifications » à 13 px en demande une bonne
                 quatre-vingtaine. Aucun élargissement n'est nécessaire.
                 ⚠️ LE CALCUL A CHANGÉ À LA nº 557, LA CONCLUSION NON :
                 les côtés valent 20 px, donc 290 − 40 − 12 = 238, soit
                 119 px par tuile (123 avant). La tuile porte son propre
                 air de 8 px de chaque côté : il reste 103 px pour le
                 mot, contre 107 avant — et « Notifications » en demande
                 toujours la même quatre-vingtaine. Quatorze pixels de
                 marge subsistent, et le filet de la nº 532
                 (`[overflow-wrap:anywhere]` sur le mot, la grille qui
                 étire les deux tuiles à la même hauteur) reste sous le
                 tout : même à l'étroit, le mot se replie, il ne déborde
                 jamais. La fenêtre ne s'élargit donc pas.
                 ⚠️ LA RÉSERVE BASSE DE 72 px NE VIENT PAS NON PLUS :
                 elle tient la barre de Safari à distance (nº 533), et
                 une fenêtre posée sous un bouton n'a pas de barre de
                 navigateur sous elle. Le web garde l'air d'un encadré —
                 16 px jusqu'à la nº 556, VINGT depuis la nº 557, comme
                 les trois autres côtés. */}
            <div className="pb-5">
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
              <div className={`flex items-center gap-3 ${REGLAGES_WEB.airCote} ${REGLAGES_WEB.airHaut}`}>
                <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
                  Mon compte
                </h2>
                <button
                  type="button"
                  onClick={() => setOuvert(false)}
                  aria-label="Fermer"
                  className="-mr-[9px] w-9 h-9 shrink-0 flex items-center justify-center
                             rounded-full text-sombre-texte-doux
                             hover:text-sombre-texte hover:bg-sombre-eleve
                             transition-colors"
                >
                  <IconeCroix taille={18} />
                </button>
              </div>
              {contenuDuCompte(REGLAGES_WEB)}
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
          {/*  ██ §1 (nº 530) — L'EN-TÊTE CENTRÉE ██
               `enTeteCentre` déplace l'icône et le titre au centre, la
               croix ne bouge pas (voir EnTetePleinEcran). Les trois
               autres porteurs du gabarit ne passent pas le drapeau et
               gardent leur icône de 22 px à gauche du titre.
               ⚠️ ET LE CONTENU CHANGE DE PLAN, LUI AUSSI : c'est
               `contenuMenuDoigt` qui est posé ici, pas `contenuMenu` —
               celui-ci reste au web, intact.
               ██ §1 (nº 549) — ET CE N'EST PLUS LE CŒUR DE LA MARQUE ██
               La nº 531 avait mis l'icône de marque à la place de la
               silhouette de la nº 530, et la nº 532 l'avait portée à
               64 px. Le propriétaire tranche autrement : ce rond doit
               dire QUEL PORTFOLIO on regarde, pas quel site on visite.
               Il montre donc la PHOTO DE PROFIL du portfolio affiché —
               le détail est écrit sur la propriété `icone`, juste
               dessous.
               CE QUI NE BOUGE PAS D'UN PIXEL : la HAUTEUR de 64 px, le
               centrage, le TITRE centré dessous et la CROIX en haut à
               droite — la nº 530 tient, la nº 534 aussi. */}
          <PagePleinEcranMobile
            titre="Mon compte"
            /*  ██ §1 (nº 549) — LA PHOTO DU PORTFOLIO REMPLACE LE CŒUR ██
                 ==========================================================
                 CE QUE MONTRE LE ROND, DANS L'ORDRE : la PHOTO DE PROFIL
                 du portfolio affiché quand il y en a une ; la SILHOUETTE
                 du compte sinon. Une seule règle, qui couvre les trois
                 cas — pas de portfolio, portfolio sans photo, et le
                 moment où le site ne sait pas encore.
                 IL SUIT LE DÉROULANT SANS RIEN DE PLUS : `fiche` est
                 `ficheActive(fiches, idFiche)`, la fiche que le sélecteur
                 désigne. Choisir un autre portfolio réécrit `idFiche` —
                 le rond se repeint dans le même rendu, comme le nom et
                 la pastille d'état qui le suivent déjà.
                 LA PLACE EST RÉSERVÉE DÈS LE PREMIER RENDU : le rond
                 porte sa taille en classes (64 px), et l'image vit
                 DEDANS en débord caché. Rien ne saute quand elle arrive
                 — c'est la même mécanique que les ronds des fiches.
                 ⚠️ RÈGLES 137/203 — CE QU'ON VOIT AVANT DE SAVOIR : tant
                 que les fiches ne sont pas lues, la liste est vide, donc
                 `fiche` n'existe pas, donc c'est la SILHOUETTE qui
                 s'affiche. C'est l'état NEUTRE du compte, jamais un état
                 faux : on ne peint pas une photo qu'on n'a pas, et l'on
                 n'annonce pas non plus « aucun portfolio ».
                 ⚠️ POURQUOI LE ROND DE REPLI EST ÉCRIT ICI et non pris à
                 `PhotoRonde` : ce composant (nº 492) ne pose AUCUN glyphe
                 pour `personne` — il rend un rond vide. Lui en ajouter un
                 toucherait une écriture partagée par les fiches, pour un
                 besoin de « Mon compte » : la géométrie du rond est donc
                 répétée une fois ici, et rien d'autre.
                 ⚠️ LE WEB N'EST PAS CONCERNÉ : sa fenêtre n'a ni cœur ni
                 titre centré depuis la nº 536 — cet en-tête-ci
                 n'appartient qu'à la page du doigt. */
            icone={
              fiche?.photo_profil ? (
                <PhotoRonde
                  source={fiche.photo_profil}
                  nature="personne"
                  classeTaille="h-16 w-16"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sombre-eleve text-sombre-texte-doux">
                  <IconeSilhouette taille={34} />
                </span>
              )
            }
            ariaLabel="Mon compte"
            enTeteCentre
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
          compteur à jour SUR-LE-CHAMP, sans attendre le serveur. */}
      {notificationsOuvertes && (
        <FenetreNotifications
          notifications={notifications}
          onFermer={() => setNotificationsOuvertes(false)}
          onLue={(id) =>
            setNotifications((liste) =>
              liste.map((n) =>
                n.id === id && !n.lue_le
                  ? { ...n, lue_le: new Date().toISOString() }
                  : n
              )
            )
          }
          onToutLu={() =>
            setNotifications((liste) =>
              liste.map((n) =>
                n.lue_le ? n : { ...n, lue_le: new Date().toISOString() }
              )
            )
          }
        />
      )}

      {/* LA FENÊTRE DES LANGUES — montée ICI, et non dans la ligne qui
          l'ouvre (nº 238-§5) : la ligne vit dans le menu, la fenêtre
          lui survit. Ouvrir ferme « Mon compte » ; fermer rend la
          page, sans rien rouvrir. */}
      {langueOuverte && (
        <FenetreLangue surFermeture={() => setLangueOuverte(false)} />
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
