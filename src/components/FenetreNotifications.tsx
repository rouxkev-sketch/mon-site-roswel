"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { DELAI_SUPPRESSION_JOURS, MARQUE_YOKOFOLIO } from "@/config/tatouage";
import {
  IconeCloche,
  IconeCocheListe,
  IconeCorbeille,
  IconeCroix,
  IconeDoubleCoche,
  IconeDrapeau,
  IconeEnveloppe,
  //  §3 (nº 672) — l'étoile de la bienvenue remplace la main qui salue
  //  (nº 668), supprimée avec elle. §4 (nº 674) : elle est ROSE sur un
  //  cercle gris, et non plus dorée sur un cercle presque noir.
  IconeEtoile,
  IconeHorloge,
  IconeHorsLigne,
  type ComposantIcone,
} from "@/components/Icones";
//  §1 (nº 664) — la famille des pastilles d'événement : les deux
//  tailles, les quatre tons et l'épaisseur du trait, écrits une fois.
import {
  PastilleEvenement,
  type TonEvenement,
} from "@/components/PastilleEvenement";
//  §2 (nº 655) — la fenêtre du web rejoint la barre : le menu ancré,
//  sa largeur et l'encadré des fenêtres de la barre, tous trois là où
//  vit `MenuDeVerre`. `createPortal` part avec la plaque écrite à la
//  main : le menu se porte lui-même dans le corps du document.
import {
  LARGEUR_FENETRE_BARRE,
  MenuDeVerre,
} from "@/components/SurfaceDeVerre";
//  §1 (nº 650) — l'alignement des menus ancrés aux boutons ronds de la
//  barre, calculé là où vit la règle de placement.
import { ALIGNEMENT_BOUTON_ROND_BARRE } from "@/components/placement-menu";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
import type { GenreNotification, Notification } from "@/lib/notifications";
//  §4 (nº 465) — au doigt, l'écran devient une PAGE plein écran (le
//  gabarit de la page de recherche), avec son étape d'historique.
import { PagePleinEcranMobile } from "@/components/PagePleinEcranMobile";
import { useAppareilMobile } from "@/lib/appareil";
import { useEtapeQuiSeReferme } from "@/lib/etape-refermable";
//  §1 (nº 469) — le verrou de défilement compté (surfaces empilées).
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";

/**
 * LES NOTIFICATIONS DU COMPTE — la boîte de nouvelles
 * ====================================================
 * Ouverte depuis la PREMIÈRE entrée du menu « Mon espace ».
 *
 * UNE NOTIFICATION, C'EST TROIS CHOSES ET RIEN DE PLUS (passe
 * nº 132) : une ICÔNE, un TITRE, un SOUS-TITRE. Le nom de la fiche,
 * les pastilles de motifs et le détail libre ont disparu de la
 * rangée — une notification ANNONCE, elle n'explique pas. (Les
 * corrections à apporter se liront sur la fiche elle-même, passe à
 * venir.) Seules exceptions, qui ne sont pas du contenu : la DATE
 * relative, en repère discret, et le POINT ROSE des non-lues.
 *
 * LES TEXTES DÉRIVENT DU GENRE, PAS DE LA BASE : les titres écrits en
 * base au fil des mois portent l'ancien vocabulaire — les recalculer
 * du genre fait parler TOUTES les lignes, vieilles et neuves, d'une
 * seule voix. La colonne `titre` ne sert plus que de repli, pour un
 * genre que ce code ne connaîtrait pas encore.
 *
 * LE MESSAGE DE L'ADMINISTRATION (styles acceptés/refusés) reste : il
 * s'affiche SOUS le sous-titre, séparé par un saut de ligne — jamais
 * collé. Il voyage dans `detail`, après la phrase qui nomme le style ;
 * on l'en extrait ici (voir `nomDuStyle` / `messageAdmin`).
 *
 * LA ROBE EST CELLE DE LA CHARTE (nº 132) : plus aucun contour, plus
 * aucune ombre — le panneau n'est qu'un fond éclairci d'un cran sur
 * son voile, comme les fenêtres de la page Sécurité et du formulaire.
 * Les lignes de séparation de la liste courent D'UN BORD À L'AUTRE.
 *
 * LIRE, C'EST MARQUER : ouvrir la fenêtre ne suffit pas — on marque
 * une nouvelle quand on la TOUCHE, et le compteur suit.
 */

/*  ██ §1 (nº 664) — LE CATALOGUE NE PEINT PLUS, IL DÉSIGNE ██
    ==================================================================
    CE QUI A CHANGÉ ICI, ET C'EST TOUTE LA REFONTE. Ce catalogue portait
    QUATRE constantes de couleur écrites à la main (VERT, ROUGE, ROSE,
    NEUTRE) — dont un hexadécimal brut, #34D399, la seule couleur du
    produit à ne pas venir de la charte. Elles sont parties chez
    `PastilleEvenement`, avec les deux tailles et l'épaisseur du trait :
    ce fichier ne dit plus QUELLE COULEUR, il dit QUEL SENS (`ton`), et
    le sens est le même dans les neuf écrans de la famille.

    ET L'ICÔNE EST DÉSORMAIS LE COMPOSANT, pas son rendu. Elle
    s'écrivait `<IconeHorloge taille={18} />` : la taille y était figée,
    donc ce catalogue ne pouvait servir qu'à la liste. En passant
    `IconeHorloge` lui-même, la pastille choisit sa taille — c'est ce
    qui permet aux mêmes symboles d'exister en 36 et en 56.

    UN SYMBOLE PAR ÉVÉNEMENT (point 5 du propriétaire). Deux abus
    relevés à la nº 663 disparaissent :
     · L'HORLOGE DISAIT DEUX CHOSES OPPOSÉES — « on examine ta fiche »
       (une attente ordinaire) et « ton compte sera supprimé dans
       N jours » (une échéance grave). Elle ne garde que la première ;
       les deux suppressions programmées passent à LA CORBEILLE, qui
       dit ce dont il s'agit sans qu'on lise.
     · LA COCHE SERVAIT QUATRE ÉVÉNEMENTS, dont un qui n'est pas un
       succès : « ta demande de style a bien été reçue » n'est pas un
       oui, c'est un accusé de réception. Elle passe à L'ENVELOPPE. La
       coche garde les trois vrais succès (fiche en ligne, style
       accepté, suppression annulée), comme le propriétaire l'écrit.
    ⚠️ LE SYMBOLE « HORS LIGNE » N'EST PAS REDESSINÉ, et c'est un écart
    assumé à la liste du propriétaire (il proposait un œil barré). Le
    dessin actuel est un BOUTON D'ALIMENTATION, il est déjà employé dans
    les CINQ écrans « hors ligne » du site, et il dit « éteint » — là où
    un œil barré dirait « caché », ce qui est plus faible que la vérité :
    la fiche n'est pas masquée, elle est retirée. */

/*  LE CATALOGUE D'AFFICHAGE — pour chaque genre : le symbole, le ton,
    le titre et le sous-titre. Le sens des quatre tons est écrit une
    fois pour toutes dans `PastilleEvenement`. */

const CATALOGUE: Record<
  GenreNotification,
  { symbole: ComposantIcone; ton: TonEvenement; titre: string; sousTitre: string }
> = {
  en_validation: {
    symbole: IconeHorloge,
    ton: "attente",
    titre: "Portfolio en cours de validation",
    sousTitre: "Ton portfolio est en cours de vérification.",
  },
  validee: {
    symbole: IconeCocheListe,
    ton: "valide",
    titre: "Portfolio en ligne",
    sousTitre: "Ton portfolio est maintenant visible sur YokoFolio.",
  },
  hors_ligne: {
    symbole: IconeHorsLigne,
    ton: "probleme",
    titre: "Portfolio hors ligne",
    sousTitre:
      "Ton portfolio est hors ligne. Modifie-le pour pouvoir le remettre en ligne.",
  },
  modifications: {
    symbole: IconeDrapeau,
    ton: "probleme",
    titre: "Modifications demandées",
    sousTitre: "Modifie ton portfolio pour le renvoyer en validation.",
  },
  suppression_fiche: {
    symbole: IconeCorbeille,
    ton: "probleme",
    titre: "Suppression de portfolio programmée",
    sousTitre: `Ton portfolio est masqué. Il sera définitivement supprimé dans ${DELAI_SUPPRESSION_JOURS} jours.`,
  },
  suppression_compte: {
    symbole: IconeCorbeille,
    ton: "probleme",
    titre: "Suppression du compte programmée",
    sousTitre: `Ton compte est masqué. Il sera définitivement supprimé dans ${DELAI_SUPPRESSION_JOURS} jours.`,
  },
  annulation: {
    symbole: IconeCocheListe,
    ton: "valide",
    titre: "Suppression annulée",
    sousTitre: "La suppression est annulée : tout est rétabli.",
  },
  demande_style: {
    symbole: IconeEnveloppe,
    ton: "info",
    titre: "Demande de style",
    sousTitre: "Ta demande d'ajout de style a bien été reçue.",
  },
  style_ajoute: {
    symbole: IconeCocheListe,
    ton: "valide",
    titre: "Style accepté",
    //  Le nom du style s'insère à l'affichage (voir `sousTitreDe`).
    sousTitre: 'Le style demandé "Réalisme" a été ajouté à YokoFolio.',
  },
  style_refuse: {
    symbole: IconeCroix,
    ton: "info",
    titre: "Style refusé",
    sousTitre: "Ta demande d'ajout de style n'a pas été acceptée.",
  },
  /*  ██ §3 (nº 688) — LA DEMANDE DE PORTFOLIO REFUSÉE ██
      LES DEUX PHRASES SONT CELLES DU PROPRIÉTAIRE, au mot près. Le nom
      du portfolio s'insère à l'affichage — il est lu dans `fiche_nom`,
      la colonne qui SURVIT à l'effacement de la fiche (voir
      `sousTitreDe`). Sans lui, la phrase se dit sans nom plutôt que
      d'afficher un trou.
      LA CROIX ET LE TON « INFO », comme « Style refusé » juste
      au-dessus, et pour la même raison : c'est un REFUS, pas une chose
      à réparer. `probleme` (le rouge) est réservé à ce qui appelle un
      geste — corriger, remettre en ligne. Ici il n'y a rien à faire ;
      la seconde phrase le dit même explicitement. */
  demande_refusee: {
    symbole: IconeCroix,
    ton: "info",
    titre: "Demande de portfolio refusée",
    sousTitre:
      "Ta demande n'a pas été retenue. Tu peux créer un nouveau " +
      "portfolio quand tu le souhaites.",
  },
  /*  ██ §1 (nº 663) — LE MESSAGE DE BIENVENUE ██
      LES DEUX TEXTES SONT CEUX DU PROPRIÉTAIRE, au mot près — à la
      graphie de la marque près (« YokoFolio », Y et F majuscules : sa
      règle, nº 104).
      ⚠️ LE TITRE EST ÉCRIT ICI EN TOUTES LETTRES, comme les dix autres
      de ce catalogue, et ce n'est pas un oubli : `TITRE_NOTIFICATION`
      vit dans `lib/notifications`, qui importe le CLIENT
      D'ADMINISTRATION — sa clé de service n'a rien à faire dans le
      programme du navigateur. Ce fichier n'en prend donc que les TYPES,
      effacés à la compilation. C'est la règle de tout ce catalogue
      depuis la nº 132, et la raison est écrite en tête de ce fichier :
      l'affichage DÉRIVE DU GENRE, jamais de ce que la base a écrit.
      LE TON EST « INFO », et c'est un choix de charte, pas un goût :
      les trois autres disent quelque chose de précis — VERT « c'est en
      ligne », ROUGE « il manque quelque chose », ROSE « une décision est
      attendue ». Un accueil n'est aucun des trois : il n'appelle AUCUN
      GESTE, ce qui est la définition même de l'information.
      ██ §2 (nº 668), REMPLACÉ PAR LE §3 DE LA nº 672 ██
      TROIS ESSAIS, ET LE PROPRIÉTAIRE TRANCHE AU TROISIÈME. Le cœur
      générique (nº 663) ne disait rien de particulier ; le FICHIER de
      la marque (nº 667) ne pouvait pas hériter de la couleur de sa
      pastille — une image ne le peut pas — et rendait 2,10:1 sur le
      gris, sous le minimum d'un signe ; la MAIN QUI SALUE (nº 668) était
      un tracé juste de la famille, mais ce n'est pas ce qu'il veut voir.

      ██ §3 (nº 672), CORRIGÉ PAR LE §4 (nº 674) — L'ÉTOILE, EN ROSE ██
      LE SYMBOLE NE CHANGE PAS : `IconeEtoile`, un pentagramme régulier
      tracé au trait de la famille comme les neuf autres (le calcul est
      écrit chez l'icône).
      LES COULEURS, ELLES, CHANGENT. La nº 672 l'avait faite DORÉE sur
      un cercle presque noir ; le propriétaire juge le doré HORS CHARTE
      et tranche : ÉTOILE ROSE (le primaire), CERCLE AU GRIS de la
      famille « info ». C'est ce que porte le ton `marque`, dont le
      jeton `or` — né pour l'étoile — disparaît avec le doré.
      ⚠️ LE TON RESTE `marque`, ET NON `info`, pour une raison de
      mécanique : `info` peint son symbole en BLANC, et le repeindre en
      rose changerait les quatre autres écrans d'information. Le détail
      est écrit chez `PastilleEvenement`.
      ⚠️ CE QUE ÇA VAUT, MESURÉ : le rose sur le gris `haut` rend
      2,67:1 — sous les 3:1 d'un signe, là où le doré rendait 11,63. Le
      propriétaire le sait ; le chiffre et le remède éventuel (un cran
      de gris plus bas, 3,93:1) sont notés chez `PastilleEvenement`.

      ██ §3 (nº 668) — LE TEXTE, VERSION FINALE ██
      Les deux phrases du propriétaire, au mot près, séparées par un
      VRAI saut de ligne. Il tient dans la chaîne (`\n`) et non dans du
      JSX : ce catalogue est fait de chaînes, et une seule d'entre elles
      deviendrait un arbre. C'est `whitespace-pre-line` qui le rend
      visible, la classe que ce fichier emploie déjà pour le message de
      l'administration — aucune classe nouvelle, aucun octet de plus.
      ⚠️ LES COMPTES QUI ONT REÇU L'ANCIENNE VERSION VOIENT LA NOUVELLE,
      SANS AUCUNE MIGRATION, et ce n'est pas de la chance : c'est la
      règle écrite en tête de ce fichier depuis la nº 132 — L'AFFICHAGE
      DÉRIVE DU GENRE, jamais de ce que la base a écrit. La colonne
      `titre` de la ligne déjà posée n'est qu'un repli pour un genre
      inconnu ; le texte lu à l'écran vient d'ICI, et de nulle part
      ailleurs. Changer ces deux lignes suffit — pour tout le monde, et
      tout de suite. */
  bienvenue: {
    symbole: IconeEtoile,
    ton: "marque",
    titre: `Bienvenue sur ${MARQUE_YOKOFOLIO.nom} !`,
    sousTitre:
      "Explore les styles, suis tes portfolios préférés et garde chaque " +
      "photo qui t'inspire.\n" +
      "Tatoueur ? Ajoute ton portfolio et fais découvrir ton travail.",
  },
};

/** LE NOM DU STYLE, extrait du détail écrit par l'administration
    (« Fine line » rejoint la liste des styles. / n'a pas été retenu.)
    — la première paire de guillemets français de la première ligne. */
function nomDuStyle(detail: string | null): string | null {
  const premiere = (detail ?? "").split("\n\n")[0] ?? "";
  return premiere.match(/«\s*([^»]+?)\s*»/)?.[1] ?? null;
}

/** LE MESSAGE DE L'ADMINISTRATION — tout ce qui suit la phrase
    d'annonce dans `detail` (elles y sont séparées par une ligne
    vide). Null quand l'administration n'a rien ajouté. */
function messageAdmin(detail: string | null): string | null {
  const suites = (detail ?? "").split("\n\n").slice(1).join("\n\n").trim();
  return suites || null;
}

/** Le sous-titre affiché — celui du catalogue, avec le nom du style
    inséré pour un style accepté. */
function sousTitreDe(nouvelle: Notification): string {
  const fiche = CATALOGUE[nouvelle.genre];
  if (!fiche) return nouvelle.detail ?? "";
  if (nouvelle.genre === "style_ajoute") {
    const nom = nomDuStyle(nouvelle.detail);
    return nom
      ? `Le style demandé "${nom}" a été ajouté à YokoFolio.`
      : "Le style demandé a été ajouté à YokoFolio.";
  }
  /*  §3 (nº 688) — LE NOM DU PORTFOLIO REFUSÉ, lu dans `fiche_nom`.
      Il vient de LA LIGNE, pas du catalogue : la fiche est effacée au
      moment où la nouvelle se lit, et `fiche_nom` est justement la
      colonne faite pour lui survivre (le `on delete set null` porte sur
      `fiche_id`, jamais sur elle).
      ⚠️ SANS NOM, LA PHRASE SE DIT QUAND MÊME — celle du catalogue,
      « Ta demande n'a pas été retenue ». On ne montre pas des
      guillemets vides. */
  if (nouvelle.genre === "demande_refusee" && nouvelle.fiche_nom) {
    return (
      `Ta demande pour « ${nouvelle.fiche_nom} » n'a pas été retenue. ` +
      "Tu peux créer un nouveau portfolio quand tu le souhaites."
    );
  }
  return fiche.sousTitre;
}

/** « il y a 3 jours », « à l'instant » — la date dite comme on la
    dit à l'oral, jamais un horodatage brut. */
function ilYA(iso: string): string {
  const secondes = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  );
  if (secondes < 90) return "à l'instant";
  const minutes = Math.round(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.round(heures / 24);
  if (jours < 31) return `il y a ${jours} jour${jours > 1 ? "s" : ""}`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function FenetreNotifications({
  ancre,
  notifications,
  onFermer,
  onLue,
  onToutLu,
}: {
  /**
   * ██ §2 (nº 655) — LE BLOC SOUS LEQUEL LE MENU DU WEB SE POSE ██
   * ------------------------------------------------------------------
   * LA CONSIGNE : « même emplacement, même largeur que Mon compte ».
   * C'est donc la MÊME ancre que « Mon compte » reçoit (`zone`, chez
   * MenuEspace) — jamais un des deux boutons de la barre, dont l'un est
   * toujours en `display: none`, donc sans boîte à mesurer.
   * ⚠️ FACULTATIVE : sans elle, le menu du web n'est pas rendu et seule
   * la page du doigt reste. Aucun porteur n'est dans ce cas aujourd'hui ;
   * la porte est ouverte pour le jour où un autre monterait cet écran.
   */
  ancre?: RefObject<HTMLElement | null>;
  notifications: Notification[];
  onFermer: () => void;
  /** Marque UNE nouvelle comme lue (le compteur suit). */
  onLue: (id: string) => void;
  onToutLu: () => void;
}) {
  /** §2 (nº 655) — le panneau du web : le test « dedans » du clic à
      côté (le menu vit dans le corps du document, nº 238-§4). */
  const panneauWeb = useRef<HTMLDivElement>(null);
  //  §1 (nº 469) — le blocage passe par le VERROU COMPTÉ
  //  (lib/verrou-defilement) : cette fenêtre s'EMPILE sur « Mon
  //  compte » au doigt (nº 465) — le « sauver puis rendre » d'avant
  //  capturait le « hidden » du dessous et le laissait pour toujours.
  useEffect(() => {
    poserLeVerrouDeDefilement();
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") onFermer();
    }
    document.addEventListener("keydown", auClavier);
    return () => {
      retirerLeVerrouDeDefilement();
      document.removeEventListener("keydown", auClavier);
    };
  }, [onFermer]);

  const [enCours, setEnCours] = useState(false);
  const restantes = notifications.filter((n) => !n.lue_le).length;
  /*  ██ §4 (nº 465) — AU DOIGT, C'EST UNE PAGE, PLUS UNE FENÊTRE ██
      L'écran « Notifications » adopte le gabarit de la page de
      recherche du smartphone (`EnTetePleinEcran` — l'écriture
      partagée) : la cloche et le titre en haut à gauche, la croix à
      l'opposé, la double coche « tout marquer » juste à sa gauche. LE
      WEB NE CHANGE PAS : la fenêtre de verre ci-dessous reste son
      habillage, cachée au doigt par `mobile:hidden`.
      ET ELLE POSE SON ÉTAPE (C-4, nº 330) — au doigt seulement : le
      retour du téléphone la referme, la croix ou Échap la reprennent
      (nº 332-§1 : jamais deux entrées pour une navigation). Ouverte
      DEPUIS « Mon compte » resté ouvert dessous, son étape s'empile
      sur la sienne : la fermer — retour ou croix — fait RETOMBER sur
      « Mon compte » (la garde de rang nº 465, etape-refermable). */
  const auDoigt = useAppareilMobile();
  useEtapeQuiSeReferme(auDoigt, onFermer);

  /*  ██ §2 (nº 655) — CE QUE LE VOILE DE LA PLAQUE FAISAIT, RENDU
      AUTREMENT ██
      La fenêtre centrée portait SON voile (un bouton noir à 25 % sur
      tout l'écran) : il assombrissait la page ET refermait au clic. Un
      menu ancré n'en a pas. Les deux services sont rendus par les
      mécanismes que « Mon compte » emploie déjà, jamais par un second :
       · l'ASSOMBRISSEMENT par le VOILE DE LA PAGE (nº 293/294), qui
         épargne le bloc d'où la surface est partie et se perce au lieu
         de s'empiler — il sort de lui-même au doigt ;
       · la FERMETURE AU CLIC À CÔTÉ par un écouteur `mousedown`, la
         même écriture qu'au menu du globe (SelecteurLangue).
      ⚠️ LE TEST PORTE SUR LE PANNEAU, pas sur l'ancre : la plaque est
      dans le corps du document, donc « hors de l'ancre » pour
      n'importe quel test naïf.
      ⚠️ AU DOIGT, JAMAIS D'ÉCOUTEUR : la page couvre tout l'écran, et
      un appui sur son titre passerait pour un clic « à côté ». */
  /*  §2 (nº 674) — PLUS D'ÉPARGNE AUTOUR DE LA ZONE DU COMPTE : le trou
      du voile est un RECTANGLE aux dimensions du bloc, et il produisait
      le « carré plus clair » que le propriétaire relève au clic sur
      l'avatar. Cette surface-ci part de la MÊME zone que « Mon compte »
      (`ancre`), donc du même trou. La raison d'épargner ne vaut que
      pour ce qu'on lit ou écrit pendant qu'une surface est ouverte ; ce
      n'est pas le cas ici. Le raisonnement complet est chez MenuEspace.
      ⚠️ `ancre` RESTE PASSÉE AILLEURS : c'est elle qui place le menu
      sous le bouton. Seul le voile cesse de la lire. */
  useVoileDeLaPage(Boolean(ancre));
  useEffect(() => {
    if (auDoigt || !ancre) return;
    function auPointeur(evenement: MouseEvent) {
      if (panneauWeb.current?.contains(evenement.target as Node)) return;
      onFermer();
    }
    document.addEventListener("mousedown", auPointeur);
    return () => document.removeEventListener("mousedown", auPointeur);
  }, [auDoigt, ancre, onFermer]);

  async function marquer(id: string) {
    onLue(id);
    try {
      await fetch("/api/tatoueur/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Réseau muet : la nouvelle repassera non lue au prochain tour.
    }
  }

  async function toutMarquer() {
    if (enCours) return;
    setEnCours(true);
    onToutLu();
    try {
      await fetch("/api/tatoueur/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tout: true }),
      });
    } catch {
      // Idem : sans réseau, rien n'est perdu, tout revient.
    } finally {
      setEnCours(false);
    }
  }

  if (typeof document === "undefined") return null;

  /*  §4 (nº 465) — LES MORCEAUX PARTAGÉS DES DEUX HABILLAGES : la
      double coche « tout marquer » et le corps (l'état vide ou la
      liste) s'écrivent UNE fois ; la fenêtre du web et la page du
      doigt les posent chacune à sa place. */
  /*  ██ §2 (nº 658) — LA DOUBLE COCHE, SEULE, SUR LES DEUX SURFACES ██
      ------------------------------------------------------------------
      CE QUI PART : le libellé « Tout marquer comme lu » qui
      accompagnait le dessin À PARTIR DE 640 px de FENÊTRE
      (`hidden sm:inline`). Le propriétaire veut « le dispositif de la
      version mobile » des deux côtés — donc le signe seul. Ce que le
      mot disait, l'`aria-label` et l'info-bulle le disent déjà : rien
      n'est perdu pour un lecteur d'écran ni pour la souris.
      ⚠️ ET UNE RÈGLE DE LARGEUR DISPARAÎT AVEC LUI (piège nº 60) : ce
      `sm:` était le dernier de ce fichier. Le bouton ne dépend plus de
      la taille de la fenêtre, seulement de ce qu'il est.
      ⚠️ IL DISPARAÎT AVEC LA DERNIÈRE NON LUE (`restantes > 0`) : rien
      à marquer, rien à montrer. */
  const boutonToutLu = restantes > 0 && (
    //  C'est le signe que font toutes les boîtes de réception : il se
    //  découvre en explorant, il n'a pas besoin de crier.
    <button
      type="button"
      onClick={toutMarquer}
      aria-label="Tout marquer comme lu"
      title="Tout marquer comme lu"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                 text-sombre-texte-doux hover:text-primaire
                 transition-colors"
    >
      <IconeDoubleCoche taille={18} />
    </button>
  );

  /*  ██ §2 (nº 658) — L'ENCADRÉ DU BAS EST SUPPRIMÉ ██
      ------------------------------------------------------------------
      LA nº 655 L'AVAIT POSÉ POUR UNE RAISON DE PLACE, et je l'avais
      dite : à 334 px, la rangée du titre ne pouvait pas tenir le mot
      « Notifications » ET le libellé « Tout marquer comme lu ». Le
      propriétaire tranche autrement, et c'est plus simple : le LIBELLÉ
      s'en va (voir la double coche ci-dessus), pas le geste. Le
      dessin seul fait 36 px — il tient sans effort à côté de la croix,
      comme au doigt.
      CE QUE ÇA REND À LA FENÊTRE : ses 20 px de bas et ses 46 px de
      bouton, soit 66 px de moins quand il reste des non-lues. La
      hauteur suit toujours la quantité de nouvelles (nº 655). */

  /* LA LISTE — ou le vide, dit gentiment. */
  const corps =
    notifications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            {/*  §1 (nº 664) — la pastille de la famille, grande taille :
                 la liste vide n'informe de rien d'autre que d'elle-même,
                 donc le ton « info ». Elle dessinait son cercle à la
                 main, un cran plus bas dans l'échelle (`eleve`). */}
            <PastilleEvenement ton="info" symbole={IconeCloche} classe="mx-auto" />
            {/*  §1 (nº 539) — LE TITRE RESTE SEUL. La phrase qui le
                 suivait est supprimée, sur les deux appareils : c'est la
                 règle de charte des champs et des choix — aucune phrase
                 explicative sous ce qui se comprend seul.
                 L'AIR N'A RIEN À RATTRAPER, et la raison est
                 structurelle : il ne venait pas de la phrase mais du
                 rembourrage SYMÉTRIQUE de cette boîte, 56 px en haut
                 comme en bas. Le groupe rond + titre reste donc centré
                 exactement comme avant, simplement plus court d'une
                 ligne. Rien n'est ajouté, rien n'est retiré. */}
            <p className="mt-4 text-[15px] font-semibold text-sombre-texte">
              Rien de neuf
            </p>
          </div>
        ) : (
          /*  §2 (nº 655) — LA LISTE NE DÉFILE PLUS D'ELLE-MÊME, et
               elle n'a plus à le faire : au web c'est LE PANNEAU qui
               défile (`MenuDeVerre` porte `overflow-y-auto` et se
               plafonne à la place disponible sous l'ancre), au doigt
               c'est la page. Le `flex-1` était, lui, déjà sans effet au
               doigt — la liste y vit dans une boîte, pas dans une
               colonne flexible. Rien ne se met à défiler ou à cesser de
               défiler : le conteneur change, pas le comportement. */
          <ul className="divide-y divide-sombre-bordure/50">
            {notifications.map((nouvelle) => {
              const nonLue = !nouvelle.lue_le;
              const fiche = CATALOGUE[nouvelle.genre];
              const admin =
                nouvelle.genre === "style_ajoute" ||
                nouvelle.genre === "style_refuse"
                  ? messageAdmin(nouvelle.detail)
                  : null;
              return (
                <li key={nouvelle.id}>
                  <button
                    type="button"
                    onClick={() => nonLue && marquer(nouvelle.id)}
                    /*  §2 (nº 655) — LE RETRAIT DE 24 px S'EN VA, ET IL
                         N'AVAIT PLUS D'OBJET : il ne s'appliquait qu'à
                         partir de 640 px de FENÊTRE (`sm:`), c'est-à-dire
                         dans la plaque de 520 px qui n'existe plus. Dans
                         un panneau de 334, il mangeait 48 px de largeur
                         sur les 334. Restent les 16 px de toujours, sur
                         les deux appareils — et une règle de LARGEUR de
                         moins (piège nº 60). */
                    className={`flex w-full items-start gap-3.5 px-4 py-4 text-left
                               transition-colors hover:bg-sombre-eleve/60 ${
                                 nonLue ? "bg-sombre-eleve/40" : ""
                               }`}
                  >
                    {/*  LE SYMBOLE — dans sa pastille teintée : le niveau
                         au-dessus de la rangée, sans aucun trait.
                         §1 (nº 664) — petite taille (36 px). LE REPLI EST
                         LA CLOCHE EN TON « INFO » : un genre que ce
                         catalogue ne connaît pas est une nouvelle qu'on
                         ne sait pas qualifier — surtout pas la peindre en
                         rouge. */}
                    <PastilleEvenement
                      taille="liste"
                      ton={fiche?.ton ?? "info"}
                      symbole={fiche?.symbole ?? IconeCloche}
                      classe="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      {/* LE TITRE — et le point rose d'une non-lue. */}
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 text-[14.5px] font-semibold leading-tight text-sombre-texte">
                          {fiche?.titre ?? nouvelle.titre}
                        </span>
                        {nonLue && (
                          <span
                            aria-label="Non lue"
                            className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primaire"
                          />
                        )}
                      </span>
                      {/* LE SOUS-TITRE — la phrase du catalogue, une
                          seule, jamais reformulée. */}
                      {/*  §3 (nº 667) — `whitespace-pre-line` : le seul
                           sous-titre qui porte un saut de ligne est celui
                           de la bienvenue, et sans cette classe le
                           navigateur l'avalerait comme une espace. Elle
                           ne change RIEN aux dix autres — ils n'ont pas
                           de `\n` —, et c'est la classe que le message de
                           l'administration emploie déjà six lignes plus
                           bas : aucune classe nouvelle. */}
                      <span className="mt-1 block whitespace-pre-line text-[13.5px] leading-relaxed text-sombre-texte-doux">
                        {sousTitreDe(nouvelle)}
                      </span>
                      {/* LE MESSAGE DE L'ADMINISTRATION — séparé du
                          sous-titre par un saut de ligne entier,
                          jamais collé (nº 132). */}
                      {admin && (
                        <span className="mt-2.5 block whitespace-pre-line text-[13.5px] leading-relaxed text-sombre-texte">
                          {admin}
                        </span>
                      )}
                      <span className="mt-2 block text-[12px] text-sombre-texte-doux">
                        {ilYA(nouvelle.creee_le)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        );

  return (
    <>
      {/*  ██ §2 (nº 655) — LE WEB : LA FENÊTRE REJOINT LA BARRE ██
           ==========================================================
           CE QUI EXISTAIT : une plaque de 520 px CENTRÉE à l'écran,
           haute de 88 % de la vue (720 px au plus), écrite à la main
           dans son propre portail, sur un voile noir à 25 %.
           LA CONSIGNE : « même emplacement, même largeur que Mon
           compte » — donc le même `MenuDeVerre`, aux mêmes réglages
           que la fenêtre du compte : `LARGEUR_FENETRE_BARRE` (334 px),
           le décalage `ALIGNEMENT_BOUTON_ROND_BARRE` (3 px, nº 650),
           le fond opaque au jeton `carte`, l'alignement à droite.
           Aucun nombre n'est écrit ici.
           ET LA HAUTEUR S'ADAPTE, SANS QU'ON LA RÈGLE : un menu ancré
           n'a pas de hauteur à lui — il prend celle de son contenu (la
           barre du titre, les nouvelles, l'encadré du bas) et ne se
           plafonne qu'à la place réellement disponible sous l'ancre
           (`usePlacementMenu`, qui mesure le viewport VISUEL). Les
           `max-h-[min(88dvh,720px)]` d'avant n'ont plus d'objet : ils
           réservaient de la place vide quand il n'y avait rien à dire.
           ⚠️ CE QUI PART AVEC LA PLAQUE ÉCRITE À LA MAIN : son portail
           (`MenuDeVerre` porte le sien), son voile-bouton (voir la
           note du voile de la page, plus haut), et les arrondis
           `rounded-2xl sm:rounded-3xl` — le menu porte le sien.
           ⚠️ CE QUI NE CHANGE PAS D'UN CARACTÈRE : le fond `carte` de
           la nº 543, les rangées, leurs teintes par transparence, les
           traits de séparation d'un bord à l'autre, l'état vide.
           ⚠️ ET ELLE RESTE CACHÉE AU DOIGT par `mobile:hidden` (§4
           nº 465) : aucune bifurcation d'état, donc aucun éclair du
           mauvais habillage au montage. */}
      {ancre && (
        <MenuDeVerre
          ouvert
          ancre={ancre}
          refPanneau={panneauWeb}
          largeur={LARGEUR_FENETRE_BARRE}
          decalageHaut={ALIGNEMENT_BOUTON_ROND_BARRE}
          opaque
          alignement="droite"
          role="dialog"
          aria-label="Mes notifications"
          data-source-composant="FenetreNotifications · fenêtre web"
          className="mobile:hidden"
        >
          {/* L'EN-TÊTE — la cloche, le titre, la croix. La ligne qui le
              sépare de la liste court d'un bord à l'autre (charte),
              l'espace égal des deux côtés.
              §2 (nº 655) — DEUX CHANGEMENTS, ET LES DEUX SONT DES
              CONSÉQUENCES DE LA LARGEUR :
               · les côtés passent à 20 px, l'air de « Mon compte »
                 depuis la nº 557 (le `sm:px-6` de 24 px ne valait que
                 dans la plaque de 520) ;
               · LA DOUBLE COCHE RESTE DANS CETTE RANGÉE (nº 658) : le
                 dessin seul y tient — c'est son LIBELLÉ qui ne tenait
                 pas, et il est parti.
              LA CROIX PREND LA COMPENSATION DE « MON COMPTE » : −9 px,
              soit (36 − 18) / 2, l'écart entre sa cible et son dessin.
              Son glyphe retombe alors PILE à 20 px du bord, à l'aplomb
              du contenu. La cible ne rétrécit pas (règle nº 483).
              ██ §4 (nº 672) — ELLE EST COLLANTE, COMME AU DOIGT ██
              LE DÉFAUT DU PROPRIÉTAIRE : « au mobile la barre de titre
              est fixe, les notifications défilent derrière ; au web elle
              remonte avec le défilement ». C'est exact, et la cause est
              d'une ligne : au web, c'est LE PANNEAU ENTIER qui défile —
              `MenuDeVerre` porte `overflow-y-auto` et se plafonne à la
              place disponible sous l'ancre (nº 655). Cette rangée-ci
              était donc dans ce qui défile, sans rien pour la retenir.
              LE REMÈDE EST LE MÉCANISME DU DOIGT, REPRIS TEL QUEL :
              `sticky top-0` plus un fond opaque — exactement ce que
              porte l'en-tête de `PagePleinEcranMobile` depuis la nº 465
              (`sticky top-0 z-10 bg-sombre-fond`). Aucun second
              mécanisme, aucune mesure, aucun calcul de hauteur.
              ⚠️ LE FOND EST CELUI DE CETTE FENÊTRE, PAS CELUI DE LA
              PAGE : le panneau du compte est `opaque`, donc au jeton
              `carte` (nº 542) — un `bg-sombre-fond` y ferait une bande
              plus sombre que la fenêtre qui la porte. C'est le seul
              nombre qui diffère du doigt, et il est dicté par la
              surface.
              ⚠️ RIEN NE BOUGE QUAND LA LISTE EST COURTE : sans
              débordement, `sticky` n'a rien à retenir — la rangée reste
              où elle est, au pixel.
              ⚠️ LE RANG 10 EST LOCAL À CE PANNEAU (le sien est z-[75]) :
              il ne monte au-dessus de rien d'autre que des rangées qui
              passent dessous. */}
          <div
            className="sticky top-0 z-10 flex items-center gap-3 bg-sombre-carte
                       px-5 py-4 border-b border-sombre-bordure/60"
          >
            {/* LA CLOCHE (nº 132) — elle dit d'un signe ce que la
                fenêtre contient, avant même le mot. */}
            <IconeCloche taille={20} classe="shrink-0 text-sombre-texte/80" />
            <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
              Notifications
            </h2>
            {/*  §2 (nº 658) — LES DEUX PETITES COCHES À CÔTÉ DE LA
                 CROIX, le dispositif de la version mobile : même
                 bouton, même place, même écriture — c'est le MÊME
                 objet (`boutonToutLu`), posé de part et d'autre. */}
            {boutonToutLu}
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="-mr-[9px] w-9 h-9 shrink-0 flex items-center justify-center
                         rounded-full text-sombre-texte-doux
                         hover:text-sombre-texte hover:bg-sombre-eleve
                         transition-colors"
            >
              <IconeCroix taille={18} />
            </button>
          </div>
          {corps}
        </MenuDeVerre>
      )}

      {/*  LE DOIGT — la page plein écran (§4, nº 465) : la cloche au
           rang 22 en blanc (l'écriture du titre de la recherche), la
           double coche à gauche de la croix, le corps tel quel — ses
           rangées portent déjà le `px-4` de l'interface. */}
      <PagePleinEcranMobile
        titre="Notifications"
        icone={<IconeCloche taille={22} classe="shrink-0 text-white" />}
        ariaLabel="Mes notifications"
        surFermer={onFermer}
        ariaLabelFermer="Fermer les notifications"
        actions={boutonToutLu}
        classeCadre="z-[85]"
      >
        <div className="grow pb-[max(1rem,env(safe-area-inset-bottom))]">
          {corps}
        </div>
      </PagePleinEcranMobile>
    </>
  );
}
