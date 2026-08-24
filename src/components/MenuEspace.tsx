"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ETATS_ROND_BARRE,
  IconeBouclierTrait,
  IconeChevronBas,
  IconeCloche,
  IconeFanion,
  IconeAjouterPortfolio,
  IconePlus,
  IconeReglages,
  IconeSilhouette,
  IconeSortie,
  IconeUtilisateur,
} from "@/components/Icones";
//  §1 (nº 531) — le cœur de la marque en tête de « Mon compte » au
//  doigt : l'écriture unique de cette image, jamais son chemin.
import { LogoYokofolio } from "@/components/LogoYokofolio";
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
  /*  §2 (nº 532) — LA GÉOMÉTRIE D'UN CÔTÉ, LA COULEUR DE L'AUTRE.
      « Ajouter un portfolio » doit être ROSE au doigt (§2) et rester
      une entrée en tout point identique aux autres. On sépare donc ce
      qui ne doit JAMAIS varier — la boîte, la hauteur, le retrait,
      l'écriture, l'état enfoncé — de la seule chose qui varie : la
      couleur. Deux chaînes écrites en entier auraient fini par
      diverger, et c'est précisément ce que la note du dessus interdit. */
  const GEOMETRIE_ENTREE =
    "flex w-full items-center gap-3 rounded-xl px-3 min-h-[46px] text-left " +
    "text-[14.5px] font-semibold " +
    "hover:bg-white/5 active:bg-white/10 transition-colors";
  const classeEntree = `${GEOMETRIE_ENTREE} text-sombre-texte`;
  /** LA MÊME ENTRÉE, EN ROSE — une seule classe de couleur, remplacée. */
  const classeEntreeAction = `${GEOMETRIE_ENTREE} text-primaire`;
  // LES ICÔNES SORTENT DU GRIS DOUX : à 22 px, sur fond anthracite,
  // elles se devinaient plus qu'elles ne se lisaient. Elles prennent
  // la couleur du texte, à 80 % — présentes, jamais criardes.
  /**
   * ██ §3 (nº 533) — LA TAILLE DES ICÔNES D'UNE LIGNE, RÉGLABLE ██
   * ------------------------------------------------------------------
   * Les entrées des encadrés portaient les 22 px du plan du web — la
   * taille d'une icône dans une fenêtre étroite. Sur une page, entre
   * deux encadrés, elles se devinaient. Elles passent à 26 px AU DOIGT,
   * toutes du même cran : « Ajouter un portfolio », « Mon portfolio »,
   * « Modification », « Langue », « Sécurité », « Déconnexion ».
   * ⚠️ LA BOÎTE SUIT LE GLYPHE, et c'est elle qui tient l'alignement :
   * chaque icône vit dans une boîte de LARGEUR FIXE (la note d'origine
   * en donne la raison — sans elle, chaque dessin a sa propre chasse et
   * les libellés partent d'un pixel différent). La boîte passe donc de
   * 22 à 26 px avec le glyphe : les six libellés restent sur la même
   * verticale.
   * ⚠️ ET LE DÉROULANT NE BOUGE PAS (acquis nº 531) : son bord gauche
   * est calé sur le BORD GAUCHE DE LA BOÎTE — 8 px d'encadré plus les
   * 12 px de la ligne —, une somme où la LARGEUR de la boîte n'entre
   * pas. Elle peut grandir, l'aplomb tient.
   * ⚠️ LE WEB GARDE SES 22 px : il passe l'autre réglage.
   */
  const boiteDIcone = (largeur: string) =>
    `flex ${largeur} shrink-0 justify-center`;
  const REGLAGE_LIGNE_WEB = { boite: boiteDIcone("w-[22px]"), taille: 22 };
  const REGLAGE_LIGNE_DOIGT = { boite: boiteDIcone("w-[26px]"), taille: 26 };
  type ReglageLigne = typeof REGLAGE_LIGNE_WEB;
  const GEOMETRIE_BOITE_ICONE = REGLAGE_LIGNE_WEB.boite;
  const boiteIcone = `${GEOMETRIE_BOITE_ICONE} text-sombre-texte/80`;

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

  /** LES RÉGLAGES DU WEB — les valeurs de toujours, inchangées. */
  const REGLAGES_SELECTEUR_WEB = {
    hauteur: "min-h-[54px]",
    titre: "text-[14.5px]",
    sousTitre: "text-[12px]",
  };
  /**
   * §5-§6 (nº 532) — LES RÉGLAGES DU DOIGT.
   *  · LA HAUTEUR : 54 → 64 px. Le champ portait la hauteur d'un champ
   *    de fenêtre ; sur une page, entre deux encadrés, il paraissait
   *    écrasé.
   *  · LE NOM : 14,5 → 16 px. L'ÉTAT : 12 → 13 px. Les deux montent
   *    ensemble et gardent leur rapport (l'état reste le plus petit —
   *    0,83 avant, 0,81 après) : c'est un renseignement sous un nom,
   *    jamais son égal.
   */
  const REGLAGES_SELECTEUR_DOIGT = {
    hauteur: "min-h-[64px]",
    titre: "text-[16px]",
    sousTitre: "text-[13px]",
  };

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
        className={classeEntree}
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
        className={classeEntree}
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
        classe={classeEntree}
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
        className={classeEntree}
      >
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          {/* UN BOUCLIER, plus un cadenas (nº 129) : le cadenas dit
              « c'est fermé », le bouclier dit « c'est protégé » —
              c'est bien de cela qu'il s'agit ici. */}
          <IconeBouclierTrait taille={reglage.taille} />
        </span>
        Sécurité
      </Link>

      <button type="button" onClick={deconnecter} className={classeEntree}>
        <span className={`${reglage.boite} text-sombre-texte/80`}>
          <IconeSortie taille={reglage.taille} />
        </span>
        Déconnexion
      </button>
    </nav>
  );

  /** LE CONTENU DU MENU — LE PLAN DU WEB, inchangé depuis toujours :
      une seule colonne d'entrées, le bloc du portfolio au milieu. */
  const contenuMenu = (
    <div className="py-2 flex flex-col gap-1">
      {/* ---------- 1. LES NOTIFICATIONS — hors du bloc de la fiche :
          elles concernent le COMPTE. Le nombre de non lues se pose à
          CÔTÉ du titre, en pastille discrète. ---------- */}
      <div className="px-2">
        <button
          type="button"
          onClick={ouvrirLesNotifications}
          className={classeEntree}
        >
          <span className={boiteIcone}>
            <IconeCloche taille={22} />
          </span>
          <span className="flex-1">Notifications</span>
          {nonLues > 0 && (
            <span
              aria-label={`${nonLues} non lue${nonLues > 1 ? "s" : ""}`}
              className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primaire
                         text-[11.5px] font-bold text-white leading-5 text-center"
            >
              {nonLues > 99 ? "99+" : nonLues}
            </span>
          )}
        </button>
        {/*  §1 (nº 530) — LE GESTE DES NOTIFICATIONS A DÉMÉNAGÉ juste
             au-dessus de `contenuMenu` (`ouvrirLesNotifications`) : la
             tuile du doigt appelle LE MÊME. Sa note, qui porte les
             règles nº 238-§5 et nº 465-§4, l'a suivi. */}

        {/* ---------- 2. MA SÉLECTION (passe nº 137, renommée à la
            nº 145-§3) — SOUS Notifications.
            L'entrée du compte ouvert à tous : les photos gardées et
            les tatoueurs suivis. Elle vient AVANT « Ajouter un
            portfolio », parce qu'elle concerne tout le monde quand la
            suivante ne concerne que ceux qui veulent se montrer.
            ⚠️ LE FANION, ET PLUS LE CŒUR : ici l'icône désigne un
            ENDROIT — la pochette où l'on range — quand le cœur des
            photos désigne un GESTE. Le cœur, lui, ne bouge pas des
            cartes ni des fiches. Taille et graisse inchangées. */}
        <Link
          href="/mes-favoris"
          replace={liensRemplacent}
          onClick={() => setOuvert(false)}
          className={classeEntree}
        >
          <span className={boiteIcone}>
            <IconeFanion taille={22} />
          </span>
          <span className="flex-1">Ma sélection</span>
        </Link>

        {/* ---------- 3. AJOUTER UN PORTFOLIO — une entrée du MENU, et
            la SEULE : elle a disparu du pied du déroulant. Créer une fiche relève du
            COMPTE, pas de la fiche qu'on regarde : sa place est ici,
            juste sous « Notifications ».
            AUCUNE COULEUR PARTICULIÈRE : même libellé, même graisse,
            même taille et même gris d'icône que « Notifications ». Le
            vert du pied de liste disait « attention, création » là où
            il ne s'agit que d'une entrée de menu de plus. ---------- */}
        {/* UN BOUTON, PLUS UN LIEN. Un lien vers la même page ne
            faisait que changer les paramètres d'adresse : le
            formulaire déjà à l'écran restait en place, avec les
            données de la fiche précédente. Le bouton, lui, sait
            reconnaître le cas « on y est déjà » — et surtout, il
            demande d'abord si une saisie est en cours. */}
        <button
          type="button"
          onClick={demanderUneNouvelleFiche}
          className={classeEntree}
        >
          <span className={boiteIcone}>
            <IconePlus taille={22} />
          </span>
          <span className="flex-1">Ajouter un portfolio</span>
        </button>
      </div>

      {/* ---------- LE BLOC DE LA FICHE CHOISIE ----------
          PAS D'ENCADRÉ : un simple FOND un cran plus clair que celui
          de la fenêtre, D'UN BORD À L'AUTRE. Un cadre dessiné faisait
          une boîte dans une boîte ; une nuance de fond dit la même
          chose sans rien ajouter au dessin — c'est ce que font les
          menus de compte d'aujourd'hui.
          Tout ce qui est ici dépend de la fiche choisie en tête. */}
      {/*  ⚠️ TOUT CE BLOC DISPARAÎT TANT QU'AUCUN PORTFOLIO N'A ÉTÉ
           ENVOYÉ (passe nº 133). Un compte tout neuf n'a rien à
           sélectionner, rien à modifier et rien à montrer : le
           sélecteur affichait « Aucun portfolio · Brouillon », et
           « Modification » comme « Mon portfolio » menaient au
           formulaire de création — que « + Ajouter un portfolio »
           ouvre déjà, en un seul mot clair.

           COMMENT ON SAIT QU'UN PORTFOLIO A ÉTÉ ENVOYÉ : la ligne
           `tatoueurs` n'est écrite QU'À L'ENVOI (voir `envoyer` dans
           FormulaireFiche — aucun brouillon n'est créé avant). Une
           liste non vide EST donc la preuve de l'envoi ; il n'y a
           rien d'autre à interroger.

           ET DANS L'AUTRE SENS, sans une ligne de plus : un portfolio
           en cours de suppression EST encore dans la liste (c'est ce
           qui permet de le réactiver) ; le jour où les 30 jours
           tombent, la purge efface la ligne, la liste se vide, et le
           menu revient de lui-même à ses quatre entrées. */}
      {fiches.length > 0 && (
      <div
        //  ⚠️ `eleve-clair/70` depuis la nº 144-§3 : posé sur la fenêtre
        //  `eleve`, l'ancien `eleve/70` disparaissait. Le contraste
        //  relatif est LE MÊME qu'avant (≈ 6 points), mesuré.
        /*  ██ §3-b (nº 472) — UN SEUL PORTFOLIO : PLUS DE FOND CLAIR ██
            Ce fond dit « tout ce qui suit dépend du portfolio choisi
            en tête » — il n'a de sens qu'en FACE D'UN CHOIX. Avec un
            seul portfolio il n'y a rien à choisir (le sélecteur est
            retiré juste dessous) : le bloc reste sur le fond sombre du
            menu, comme les autres entrées, et les deux couleurs
            disparaissent. AUCUN CONTOUR ne le remplace — la charte
            l'interdit, et rien n'a besoin d'être délimité.
            La géométrie ne bouge pas : mêmes marges, mêmes
            rembourrages, les entrées restent alignées sur celles du
            dessus. Le fond revient AVEC le sélecteur, dès qu'un
            deuxième portfolio existe. */
        className={`my-1.5 ${
          plusieursFiches ? "bg-sombre-eleve-clair/70 " : ""
        }px-2 py-2.5 flex flex-col gap-1`}
      >
        {/* PAS DE TITRE DE GROUPE. « La fiche choisie » nommait ce que
            le sélecteur montre déjà : le nom du portfolio est écrit en
            toutes lettres juste dessous, en gras. Une étiquette qui
            répète son champ n'aide personne — elle ajoute une ligne. */}
        {/* LE SÉLECTEUR — un VRAI menu déroulant : la liste se pose
            PAR-DESSUS le menu (absolute), elle ne le pousse pas et ne
            le remplace pas. Le reste des entrées demeure visible et à
            sa place pendant qu'elle est ouverte.
            L'ÉTAT DE LA FICHE VIT ICI, en deuxième ligne : une
            pastille de 6 px et un mot. C'était un encadré entier, avec
            un gros rond de couleur et une phrase — l'élément le plus
            voyant d'un menu où il n'est qu'un renseignement. */}
        {/*  ██ §3-b (nº 472) — PAS DE DÉROULANT POUR UN SEUL PORTFOLIO ██
             Il n'y a rien à choisir : le champ n'ouvrait qu'une liste
             d'un seul nom, celui-là même qu'il affichait. Il est donc
             RETIRÉ tant qu'il n'y a qu'un portfolio — pas masqué :
             non rendu. L'état de la fiche (la pastille et son mot) part
             avec lui ; il reste lisible d'un geste, sur le portfolio
             lui-même. Le déroulant revient tel quel dès le DEUXIÈME
             portfolio, avec sa liste, ses pastilles et son fond clair
             — le comportement à deux et plus ne change pas d'une
             ligne. */}
        {selecteurDePortfolio(REGLAGES_SELECTEUR_WEB)}

        {entreesDuPortfolio(REGLAGE_LIGNE_WEB)}
      </div>
      )}

      {/* ---------- LE COMPTE, hors du bloc : sur le fond normal. */}
      <div className="px-2">{entreesDuCompte(REGLAGE_LIGNE_WEB)}</div>
    </div>
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
   * propre retrait (`classeEntree`, 12 px) : reprendre les 12 px de la
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
   * §2 (nº 531) — LA TAILLE DES TROIS ICÔNES DE TUILE.
   * ------------------------------------------------------------------
   * 22 px à la nº 530 — la taille des icônes d'une LIGNE, héritée du
   * plan du web où elles vivent à gauche d'un mot. Dans une tuile
   * l'icône n'accompagne plus le mot : elle le SURMONTE, et c'est elle
   * qu'on vise. Elle passe donc à 32 — la moitié en plus.
   * ⚠️ LES TROIS ENSEMBLE, par une seule écriture : trois tuiles à
   * parts égales ne peuvent pas porter trois tailles.
   * ⚠️ LES MOTS NE BOUGENT PAS (13 px), et les trois tuiles restent de
   * même hauteur : la grille étire ses cases, elles grandissent
   * ensemble de ce que l'icône a gagné.
   */
  const TAILLE_ICONE_TUILE = 32;

  const contenuMenuDoigt = (
    <div className="flex flex-col gap-3 px-4 pt-1">
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
          {/*  ██ §2 (nº 533) — LE COMPTE ENTRE DANS LA CLOCHE ██
               LA PASTILLE POSÉE PAR-DESSUS A DISPARU. À la place, la
               cloche S'OUVRE en haut à droite (`ouverte`, voir
               IconeCloche : son tracé s'interrompt sur 54°, centré sur
               la diagonale) et LE NOMBRE vient se loger dans ce vide,
               en ROSE — un compteur, l'usage même que la charte réserve
               à cette couleur.
               SANS NOTIFICATION, RIEN : la cloche est refermée et
               aucun chiffre n'est rendu. C'est le même dessin qu'avant,
               entier.
               §3 (nº 534) — L'ÉCHANCRURE PASSE DE 54° À 80°, ET LE
               NOMBRE DE 12,5 À 16 px : à 54° le vide était plus petit
               que le chiffre qu'il devait loger. Les deux grandissent
               ensemble, l'ancrage suit le nouveau bord : 54 % de la
               largeur du glyphe au lieu de 58 %, et 16 % de sa hauteur
               au lieu de 18 % — ce dernier cran mesuré, pas choisi : à
               20 %, le bas d'un chiffre de 16 px venait frôler l'angle
               haut droit du CORPS de la cloche.
               ⚠️ OÙ LE NOMBRE SE POSE, ET COMMENT IL GRANDIT. Il est
               ancré PAR SA GAUCHE au bord intérieur de l'ouverture :
               un chiffre seul occupe le vide, et un nombre
               plus long s'allonge VERS LA DROITE — vers l'extérieur du
               dessin, là où il n'y a rien à recouvrir. « 12 » et
               « 99+ » débordent donc du carré de l'icône au lieu de
               mordre sur la cloche, et restent entiers : aucun
               rognage, aucune largeur maximale. La tuile ne coupe rien
               (elle n'a pas de débordement caché) et l'icône est
               centrée dans une tuile deux fois plus large qu'elle : la
               place est là.
               ⚠️ AU-DELÀ DE 99, C'EST « 99+ » — la règle de toujours,
               inchangée.
               ⚠️ LE WEB NE CHANGE PAS : sa ligne « Notifications »
               garde sa pastille ronde à droite du mot (elle a la place,
               elle). C'est le plan du doigt seul qui adopte le compte
               découpé. */}
          <span className={`relative ${CLASSE_TUILE_ICONE}`}>
            <IconeCloche taille={TAILLE_ICONE_TUILE} ouverte={nonLues > 0} />
            {nonLues > 0 && (
              <span
                aria-label={`${nonLues} non lue${nonLues > 1 ? "s" : ""}`}
                className="absolute font-bold leading-none text-[16px] text-primaire"
                style={{ left: "54%", top: "16%", transform: "translateY(-50%)" }}
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
            <IconeFanion taille={TAILLE_ICONE_TUILE} />
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
             `classeEntreeAction`, plus haut : une classe de couleur
             par élément, jamais deux empilées. */}
        <button
          type="button"
          onClick={demanderUneNouvelleFiche}
          className={classeEntreeAction}
        >
          {/*  §1 (nº 533) — L'ICÔNE EST CELLE DE « MON PORTFOLIO »,
               OUVERTE EN HAUT À DROITE, avec un petit « + » dans
               l'ouverture (voir IconeAjouterPortfolio). Le lecteur
               reconnaît l'objet avant de lire le mot.
               L'ICÔNE N'ÉCRIT AUCUNE COULEUR : elle hérite du rose de
               sa ligne (nº 532). La boîte de largeur fixe, elle, est la
               même que ses voisines — les libellés partent tous du même
               pixel. */}
          <span className={REGLAGE_LIGNE_DOIGT.boite}>
            <IconeAjouterPortfolio taille={REGLAGE_LIGNE_DOIGT.taille} />
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
         * BOÎTE D'ICÔNE d'une ligne (`boiteIcone`, 22 px de large),
         * c'est-à-dire le bord gauche du glyphe « Mon portfolio ».
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
            {selecteurDePortfolio(REGLAGES_SELECTEUR_DOIGT)}
          </div>
        )}
        {fiches.length > 0 && entreesDuPortfolio(REGLAGE_LIGNE_DOIGT)}
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
        {entreesDuCompte(REGLAGE_LIGNE_DOIGT)}
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
        className={`sm:hidden flex items-center justify-center rounded-full
                   text-primaire transition-colors ${ETATS_ROND_BARRE}
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
        className={`hidden sm:flex items-center justify-center rounded-full
                   text-primaire transition-colors ${ETATS_ROND_BARRE}
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
            alignement="droite"
            role="dialog"
            aria-label="Mon espace"
            data-source-composant="MenuEspace · fenêtre web"
            className="mobile:hidden"
          >
            {contenuMenu}
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
               ██ §1 (nº 531) — ET C'EST LE CŒUR DE LA MARQUE ██
               La silhouette de la nº 530 laisse la place à
               `yokofolio-icone.png`. TROIS CHOSES À SAVOIR :
                · LE FICHIER N'EST PAS TOUCHÉ, et il n'est même pas
                  nommé ici : on passe par `LogoYokofolio`, l'écriture
                  unique de cette image (son chemin vit dans
                  `MARQUE_YOKOFOLIO` — règle nº 175-§5, aucune source
                  d'image ne dépend d'une mise en page) ;
                · IL N'EST PAS CARRÉ — 297 × 337, relevé à la nº 468 et
                  DÉCLARÉ dans `LogoYokofolio` depuis la nº 507. On ne
                  lui donne donc QUE SA HAUTEUR ; la largeur se
                  calcule du rapport natif, et le composant la déclare
                  au navigateur : rien n'est étiré, rien ne saute au
                  chargement.
                  §1 (nº 532) — ELLE GRANDIT ENCORE : 44 → 64 px de
                  haut, donc 56 px de large (64 × 297 / 337, arrondi).
                  On ne touche toujours QU'À LA HAUTEUR — c'est ce qui
                  garantit le rapport ;
                · LE TITRE reste centré dessous, la CROIX en haut à
                  droite — la nº 530 ne bouge pas d'un pixel. */}
          <PagePleinEcranMobile
            titre="Mon compte"
            icone={<LogoYokofolio variante="icone" hauteur={64} />}
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
              {contenuMenuDoigt}
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
