"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconeCocheListe,
  IconeCroix,
  type ComposantIcone,
} from "@/components/Icones";
import { PastilleEvenement } from "@/components/PastilleEvenement";

/**
 * ██ nº 837 — LE TOAST DU SITE : UNE CONFIRMATION QUI PASSE ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : les phrases de réactivation (« Deletion
 * canceled… ») s'affichaient en LIGNE NUE sous la barre fixe — un
 * paragraphe posé dans le flux de la page, sans forme, mal intégré.
 * SA DÉCISION : le standard de 2026, un toast. Un petit bloc sombre,
 * la pastille à coche verte de la famille des événements, et le
 * message ; il glisse depuis le bas, reste cinq secondes, s'efface
 * seul. Il ne bloque rien : il se pose PAR-DESSUS le contenu, sans
 * voile, sans bouton, sans rien à refermer.
 *
 * UNE SEULE ÉCRITURE, RÉUTILISABLE (piège nº 378) : ce composant ne
 * connaît aucun événement. Il reçoit un message et un ton, et c'est
 * tout ; l'appelant décide quand il existe et le retire quand le toast
 * lui dit qu'il a fini (`onFini`). Les deux réactivations (portfolio,
 * compte — `ReactivationParCourriel`) sont ses premiers porteurs ;
 * toute confirmation future passe par ici, jamais par une ligne
 * refaite dans un coin.
 *
 * OÙ IL SE POSE, ET C'EST UNE RÈGLE DU PROPRIÉTAIRE :
 *  · au WEB, en bas à GAUCHE — seize pixels du bord gauche, seize du
 *    bas (l'air de référence du site, nº 786) ;
 *  · au DOIGT, en bas au CENTRE — seize pixels de chaque bord, la
 *    boîte prend la largeur de son texte et se centre entre les deux ;
 *    le bas respecte la zone sûre du téléphone (l'encoche du bas).
 * L'appareil se lit par les DEUX VARIANTES QUI S'EXCLUENT (le vrai
 * appareil et son exact complément, la règle de la nº 616), jamais
 * par une largeur d'écran (piège nº 60), et AUCUNE classe de base ne
 * porte la position horizontale : les deux variantes ne peuvent pas
 * s'appliquer au même élément, donc aucun conflit à départager par
 * l'ordre de la feuille (piège nº 389). Aucune classe n'est écrite en
 * toutes lettres dans cette note : Tailwind lit les commentaires
 * (piège nº 472).
 *
 * COMMENT IL ENTRE ET SORT. L'entrée est un GLISSEMENT : il naît douze
 * pixels plus bas et transparent, et rejoint sa place en trois cents
 * millisecondes — c'est la variante de style de départ que le site
 * emploie déjà pour ses voiles (`FenetreEnvoi`), une transition et
 * pas une animation nommée : rien n'est ajouté à `globals.css`. La
 * sortie fait le chemin inverse, puis l'appelant est prévenu et retire
 * le toast du rendu. Un lecteur qui limite les animations le voit
 * apparaître et disparaître d'un coup, sans transition.
 *
 * ⚠️ IL EST PORTÉ À LA RACINE DU DOCUMENT (un portail, comme
 * `FenetreEnvoi`), et ce n'est pas un détail : posé dans le flux de sa
 * page, un bloc fixé peut être capturé par un ancêtre qui transforme
 * ou qui isole ses plans (la mosaïque a le sien, `globals.css`), et se
 * retrouver SOUS la barre ou décalé. À la racine, son rang est absolu :
 * le quatre-vingt-dix du site — au-dessus des fenêtres et des menus,
 * sous la seule fenêtre d'envoi, pour qu'une confirmation reste
 * visible quoi qu'on ait ouvert.
 *
 * ⚠️ LA PASTILLE EST CELLE DE LA FAMILLE (`PastilleEvenement`, taille
 * « liste » : trente-six pixels, le symbole dix-huit) — le vert de
 * « c'est fait » y est mesuré sur ce fond même (le gris des listes) :
 * 4,87:1. Rien n'est redessiné ici ; un toast de problème prend la
 * même pastille en rouge, avec la croix.
 *
 * ⚠️ LE MESSAGE EST DIT AUX LECTEURS D'ÉCRAN : une confirmation est
 * une zone d'annonce polie ; un problème est une alerte. Le texte est
 * du texte ordinaire — il se surligne et se copie comme tel.
 */

/** Combien de temps le toast reste à l'écran, une fois entré. */
export const DUREE_TOAST_MS = 5000;
/** La durée du glissement d'entrée, et de l'effacement de sortie. */
export const DUREE_GLISSEMENT_MS = 300;

/** Les deux tons qu'un toast peut prendre : la confirmation (vert,
    coche), et le problème (rouge, croix). Le sens des couleurs est
    celui, constant, de la famille des pastilles (règle nº 664). */
export type TonToast = "valide" | "probleme";

const SYMBOLE: Record<TonToast, ComposantIcone> = {
  valide: IconeCocheListe,
  probleme: IconeCroix,
};

export function Toast({
  message,
  ton = "valide",
  onFini,
}: {
  message: string;
  ton?: TonToast;
  /** Appelé quand le toast a fini de s'effacer : c'est le moment de le
      retirer du rendu. */
  onFini?: () => void;
}) {
  /*  LA SORTIE EST MÉMORISÉE PAR MESSAGE, pas par un drapeau à
      remettre à zéro : un message neuf n'est jamais « en sortie », il
      n'y a donc rien à réinitialiser dans un effet. */
  const [sortieDe, setSortieDe] = useState<string | null>(null);
  const sortie = sortieDe === message;
  /*  L'appelant peut passer une fonction neuve à chaque rendu ; on lit
      la dernière au moment de l'appel, sans relancer la minuterie. La
      référence se met à jour dans un effet, jamais pendant le rendu
      (la règle des crochets de React). */
  const prevenir = useRef(onFini);
  useEffect(() => {
    prevenir.current = onFini;
  }, [onFini]);

  useEffect(() => {
    const depart = window.setTimeout(() => setSortieDe(message), DUREE_TOAST_MS);
    const fin = window.setTimeout(
      () => prevenir.current?.(),
      DUREE_TOAST_MS + DUREE_GLISSEMENT_MS
    );
    return () => {
      window.clearTimeout(depart);
      window.clearTimeout(fin);
    };
  }, [message, ton]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role={ton === "probleme" ? "alert" : "status"}
      data-toast={ton}
      className={`fixed z-[90] bottom-[max(16px,env(safe-area-inset-bottom))]
                  not-mobile:left-4 mobile:inset-x-4 mobile:mx-auto mobile:w-fit
                  max-w-[420px] flex items-center gap-3 rounded-2xl
                  bg-sombre-eleve px-4 py-3
                  shadow-[0_12px_40px_rgba(0,0,0,0.55)]
                  text-[13.5px] leading-relaxed text-sombre-texte
                  transition-[translate,opacity] duration-300 ease-out
                  motion-reduce:transition-none
                  ${
                    sortie
                      ? "translate-y-3 opacity-0"
                      : "translate-y-0 opacity-100 starting:translate-y-3 starting:opacity-0"
                  }`}
    >
      <PastilleEvenement ton={ton} taille="liste" symbole={SYMBOLE[ton]} />
      <p>{message}</p>
    </div>,
    document.body
  );
}
