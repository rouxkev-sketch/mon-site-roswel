"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import {
  IconeCloche,
  IconeCocheListe,
  IconeCoeur,
  IconeCroix,
  IconeDoubleCoche,
  IconeDrapeau,
  IconeHorloge,
  IconeHorsLigne,
} from "@/components/Icones";
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

/*  LE CATALOGUE D'AFFICHAGE — pour chaque genre : l'icône, sa teinte,
    le titre et le sous-titre. LES COULEURS SUIVENT LA CHARTE :
     · VERT — réservé à « en ligne » et aux ajouts : fiche en ligne,
       style accepté (il rejoint le catalogue), suppression annulée
       (tout redevient vivant) ;
     · ROUGE — le manque à corriger ou l'échéance grave : fiche hors
       ligne, modifications demandées, suppressions programmées ;
     · ROSE — l'attente d'une décision, comme la pastille « En
       validation » du menu : fiche en cours de validation ;
     · NEUTRE (fond élevé-clair, texte doux) — ce qui n'appelle aucun
       geste : l'accusé de réception d'une demande, un style refusé
       (ce n'est ni une erreur ni un manque — rien à corriger). */
const VERT = "bg-[#34D399]/15 text-[#34D399]";
const ROUGE = "bg-erreur/15 text-erreur";
const ROSE = "bg-primaire-voile text-primaire";
const NEUTRE = "bg-sombre-eleve-clair text-sombre-texte-doux";

const CATALOGUE: Record<
  GenreNotification,
  { icone: React.ReactNode; teinte: string; titre: string; sousTitre: string }
> = {
  en_validation: {
    icone: <IconeHorloge taille={18} />,
    teinte: ROSE,
    titre: "Fiche en cours de validation",
    sousTitre: "Ta fiche est en cours de vérification.",
  },
  validee: {
    icone: <IconeCocheListe taille={18} />,
    teinte: VERT,
    titre: "Fiche en ligne",
    sousTitre: "Ta fiche est maintenant visible sur YokoFolio.",
  },
  hors_ligne: {
    icone: <IconeHorsLigne taille={18} />,
    teinte: ROUGE,
    titre: "Fiche hors ligne",
    sousTitre:
      "Ta fiche est hors ligne. Modifie-la pour pouvoir la remettre en ligne.",
  },
  modifications: {
    icone: <IconeDrapeau taille={18} />,
    teinte: ROUGE,
    titre: "Modifications demandées",
    sousTitre: "Modifie ta fiche pour la renvoyer en validation.",
  },
  suppression_fiche: {
    icone: <IconeHorloge taille={18} />,
    teinte: ROUGE,
    titre: "Suppression de portfolio programmée",
    sousTitre: `Ta fiche est masquée. Elle sera définitivement supprimée dans ${DELAI_SUPPRESSION_JOURS} jours.`,
  },
  suppression_compte: {
    icone: <IconeHorloge taille={18} />,
    teinte: ROUGE,
    titre: "Suppression du compte programmée",
    sousTitre: `Ton compte est masqué. Il sera définitivement supprimé dans ${DELAI_SUPPRESSION_JOURS} jours.`,
  },
  annulation: {
    icone: <IconeCocheListe taille={18} />,
    teinte: VERT,
    titre: "Suppression annulée",
    sousTitre: "La suppression est annulée : tout est rétabli.",
  },
  demande_style: {
    icone: <IconeCocheListe taille={18} />,
    teinte: NEUTRE,
    titre: "Demande de style",
    sousTitre: "Ta demande d'ajout de style a bien été reçue.",
  },
  style_ajoute: {
    icone: <IconeCocheListe taille={18} />,
    teinte: VERT,
    titre: "Style accepté",
    //  Le nom du style s'insère à l'affichage (voir `sousTitreDe`).
    sousTitre: 'Le style demandé "Réalisme" a été ajouté à YokoFolio.',
  },
  style_refuse: {
    icone: <IconeCroix taille={18} />,
    teinte: NEUTRE,
    titre: "Style refusé",
    sousTitre: "Ta demande d'ajout de style n'a pas été acceptée.",
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
      LA TEINTE EST « NEUTRE », et c'est un choix de charte, pas un
      goût : les trois couleurs disent quelque chose de précis — VERT
      « c'est en ligne », ROUGE « il manque quelque chose », ROSE « une
      décision est attendue ». Un accueil n'est aucun des trois : il
      n'appelle AUCUN GESTE, ce qui est la définition même du neutre
      dans ce catalogue.
      L'ICÔNE EST LE CŒUR de la famille existante, celui des favoris —
      la seule qui accueille plutôt qu'elle n'annonce. Le propriétaire
      la reverra avec les autres au chantier suivant (consigne nº 663). */
  bienvenue: {
    icone: <IconeCoeur taille={18} />,
    teinte: NEUTRE,
    titre: "Bienvenue sur YokoFolio !",
    sousTitre:
      "Explore les styles et suis les tatoueurs qui t'inspirent — tes " +
      "favoris te suivront partout. Tatoueur ? Ton portfolio t'attend : " +
      "« Ajouter un portfolio ».",
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
  useVoileDeLaPage(Boolean(ancre), ancre);
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
            <span
              aria-hidden="true"
              className="mx-auto flex h-14 w-14 items-center justify-center
                         rounded-full bg-sombre-eleve text-sombre-texte-doux"
            >
              <IconeCloche taille={24} />
            </span>
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
                    {/* L'ICÔNE — dans sa pastille teintée : le niveau
                        au-dessus de la rangée, sans aucun trait. */}
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center
                                 rounded-full ${fiche?.teinte ?? NEUTRE}`}
                    >
                      {fiche?.icone ?? <IconeCloche taille={18} />}
                    </span>
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
                      <span className="mt-1 block text-[13.5px] leading-relaxed text-sombre-texte-doux">
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
              du contenu. La cible ne rétrécit pas (règle nº 483). */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-sombre-bordure/60">
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
