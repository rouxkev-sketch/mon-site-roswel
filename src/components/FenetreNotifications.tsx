"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import {
  IconeCloche,
  IconeCocheListe,
  IconeCroix,
  IconeDoubleCoche,
  IconeDrapeau,
  IconeHorloge,
  IconeHorsLigne,
} from "@/components/Icones";
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
  notifications,
  onFermer,
  onLue,
  onToutLu,
}: {
  notifications: Notification[];
  onFermer: () => void;
  /** Marque UNE nouvelle comme lue (le compteur suit). */
  onLue: (id: string) => void;
  onToutLu: () => void;
}) {
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
  const boutonToutLu = restantes > 0 && (
    //  « TOUT MARQUER COMME LU » — la DOUBLE COCHE, seule sur
    //  écran étroit (le texte débordait), accompagnée du texte
    //  dès 640 px. C'est le signe que font toutes les boîtes
    //  de réception : il se découvre en explorant, il n'a pas
    //  besoin de crier.
    <button
      type="button"
      onClick={toutMarquer}
      aria-label="Tout marquer comme lu"
      title="Tout marquer comme lu"
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2
                 text-sombre-texte-doux hover:text-primaire
                 transition-colors"
    >
      <IconeDoubleCoche taille={18} />
      <span className="hidden sm:inline text-[13px] font-medium">
        Tout marquer comme lu
      </span>
    </button>
  );

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
            <p className="mt-4 text-[15px] font-semibold text-sombre-texte">
              Rien de neuf
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-sombre-texte-doux">
              Les nouvelles de tes fiches et de tes demandes
              s&apos;afficheront ici.
            </p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto overscroll-contain divide-y divide-sombre-bordure/50">
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
                    className={`flex w-full items-start gap-3.5 px-4 sm:px-6 py-4 text-left
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
      {/*  LE WEB — la fenêtre de verre, INCHANGÉE (cachée au doigt par
           `mobile:hidden`, §4 nº 465). */}
      {createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mes notifications"
          className="mobile:hidden fixed inset-0 z-[85] flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Fermer les notifications"
            onClick={onFermer}
            className="absolute inset-0 bg-black/25 cursor-default
                       opacity-100 transition-opacity duration-200 starting:opacity-0"
          />

          {/* LE PANNEAU — un fond éclairci d'un cran sur le voile, sans
              contour ni ombre : la grammaire des fenêtres depuis la
              nº 130 (Sécurité, retour de suppression). */}
          <div
            data-verre-fenetre=""
            //  §3 (nº 240) — 45 % : au-dessus des cartes de flashs,
            //  souvent blanches, la plaque à 22 % ne tenait pas. Voile,
            //  flou et liseré inchangés.
            data-verre-dense=""
            className="relative w-full max-w-[520px] max-h-[min(88dvh,720px)]
                       flex flex-col rounded-2xl sm:rounded-3xl
                       overflow-hidden"
          >
            {/* L'EN-TÊTE — la cloche, le titre, la double coche, la
                croix. La ligne qui le sépare de la liste court d'un
                bord à l'autre (charte), l'espace égal des deux côtés. */}
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-sombre-bordure/60">
              {/* LA CLOCHE (nº 132) — elle dit d'un signe ce que la
                  fenêtre contient, avant même le mot. */}
              <IconeCloche
                taille={20}
                classe="shrink-0 text-sombre-texte/80"
              />
              <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
                Notifications
              </h2>
              {boutonToutLu}
              <button
                type="button"
                onClick={onFermer}
                aria-label="Fermer"
                className="-mr-1 w-9 h-9 shrink-0 flex items-center justify-center
                           rounded-full text-sombre-texte-doux
                           hover:text-sombre-texte hover:bg-sombre-eleve
                           transition-colors"
              >
                <IconeCroix taille={18} />
              </button>
            </div>
            {corps}
          </div>
        </div>,
        document.body
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
