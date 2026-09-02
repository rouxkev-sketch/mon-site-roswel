"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconeCroix } from "@/components/Icones";
//  §1 (nº 469) — le verrou de défilement compté (surfaces empilées).
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";

/**
 * LA COQUE DES FENÊTRES MODALES
 * -----------------------------
 * UNE SEULE base pour toutes les fenêtres du site : voile sombre,
 * encadré blanc, arrondis, contour, ombre, largeur, fermeture par la
 * touche Échap et par un clic à l'extérieur. Les fenêtres qui s'en
 * servent (signalement, partage) n'apportent que leur CONTENU : elles ne
 * peuvent donc pas diverger avec le temps.
 *
 * Présentation, à l'identique de ce qu'elle a toujours été :
 * - SOUS 640 px : la fenêtre monte du BAS de l'écran, pleine largeur,
 *   coins arrondis en haut seulement ;
 * - DÈS 640 px : elle est centrée et plafonnée à 730 px ;
 * - DÈS 768 px (le web) : contour plus marqué (#BEBFC9, celui des
 *   champs) et ombre COURTE au lieu d'un halo de 25 px — sur le voile
 *   sombre, un halo brouillait la limite entre le blanc et le fond.
 * Aucune animation d'ouverture ni de fermeture : c'est le rendu
 * d'origine, et il est conservé tel quel.
 *
 * Ce que la coque apporte EN PLUS, pour tout le monde :
 * - le FOCUS entre dans la fenêtre à l'ouverture (sur l'encadré
 *   lui-même : aucun champ n'est pré-sélectionné, aucun curseur ne
 *   clignote) et revient à l'élément qui l'a ouverte à la fermeture ;
 * - la tabulation TOURNE EN ROND à l'intérieur : on ne se retrouve plus
 *   à parcourir la page derrière sans le savoir ;
 * - le DÉFILEMENT DE LA PAGE est bloqué tant que la fenêtre est
 *   ouverte, et rendu exactement comme il était à la fermeture ;
 * - la fenêtre est posée DIRECTEMENT DANS <body> (portail). Sans cela,
 *   elle reste prisonnière du contexte d'empilement de son parent : le
 *   bandeau de la fiche porte un `z-20`, si bien que le voile passait
 *   SOUS le bandeau collant du haut de page (z-50) — le haut de l'écran
 *   restait cliquable et la fenêtre paraissait tronquée. Dans <body>,
 *   son `z-[60]` compte vraiment, et son `position: fixed` se réfère
 *   bien à la fenêtre du navigateur.
 */
/**
 * LES TROIS LARGEURS
 * ------------------
 * Une largeur unique pour toutes les fenêtres ne peut pas convenir :
 * trois options courtes flottaient dans 730 px, quand le formulaire de
 * signalement, lui, les remplit. Chaque fenêtre reçoit donc la largeur
 * de SON contenu. Ce sont des MAXIMUMS : sous cette largeur, la
 * fenêtre s'adapte à l'écran (et sous 640 px elle monte du bas, pleine
 * largeur, comme avant).
 */
export const LARGEURS_MODALE = {
  /** Trois options courtes (« Filtrer les résultats »). */
  courte: "sm:max-w-[400px]",
  /** Cinq boutons empilés (« Partager cette fiche »). */
  moyenne: "sm:max-w-[440px]",
  /** Six motifs + zone de texte (« Signaler cette fiche »). */
  large: "sm:max-w-[520px]",
} as const;

export type LargeurModale = keyof typeof LARGEURS_MODALE;

export function FenetreModale({
  ouvert,
  surFermeture,
  idTitre,
  largeur = "large",
  children,
}: {
  ouvert: boolean;
  surFermeture: () => void;
  /** L'identifiant du titre (<h2>) : c'est lui qui nomme la fenêtre
      pour les lecteurs d'écran. */
  idTitre: string;
  /** La largeur maximale, choisie selon le contenu (voir LARGEURS_MODALE). */
  largeur?: LargeurModale;
  children: React.ReactNode;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  // L'élément qui avait le focus avant l'ouverture (l'icône partage, le
  // lien « Signaler »…) : on le lui rend en refermant.
  const declencheur = useRef<HTMLElement | null>(null);

  // Échap + tabulation captive
  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        surFermeture();
        return;
      }
      if (e.key !== "Tab" || !cadre.current) return;
      const cibles = [
        ...cadre.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((e) => e.getClientRects().length > 0);
      if (cibles.length === 0) return;
      const premier = cibles[0];
      const dernier = cibles[cibles.length - 1];
      const actif = document.activeElement;
      // Sortie par le bas → on repart du premier ; par le haut →
      // on repart du dernier. Le focus ne quitte jamais la fenêtre.
      if (!e.shiftKey && (actif === dernier || !cadre.current.contains(actif))) {
        e.preventDefault();
        premier.focus();
      } else if (e.shiftKey && (actif === premier || actif === cadre.current)) {
        e.preventDefault();
        dernier.focus();
      }
    };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [ouvert, surFermeture]);

  // Entrée du focus, retour du focus, et blocage du défilement
  useEffect(() => {
    if (!ouvert) return;
    declencheur.current = document.activeElement as HTMLElement | null;
    cadre.current?.focus();

    // La page derrière ne défile plus.
    // §1 (nº 469) — par le VERROU COMPTÉ (lib/verrou-defilement) : une
    // modale peut s'ouvrir PENDANT qu'une surface plein écran tient
    // déjà le corps — le « sauver puis rendre » d'avant capturait le
    // « hidden » du dessous et le laissait à sa fermeture.
    poserLeVerrouDeDefilement();

    return () => {
      retirerLeVerrouDeDefilement();
      declencheur.current?.focus?.();
    };
  }, [ouvert]);

  if (!ouvert || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-encre/40 p-0 sm:p-4"
      onClick={surFermeture}
    >
      <div
        ref={cadre}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        // -1 : l'encadré peut RECEVOIR le focus à l'ouverture sans
        // entrer dans l'ordre de tabulation.
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        // AUCUNE BORDURE : sur le voile assombri, un contour gris ne
        // délimite rien — il ajoute juste un trait. Ce qui détache la
        // fenêtre du fond, c'est le blanc, les arrondis et l'ombre.
        // MARGE INTERNE de 32 px sur les quatre côtés dès 640 px (20 px
        // sur smartphone, où chaque pixel de largeur compte).
        className={`bg-fond w-full ${LARGEURS_MODALE[largeur]} max-h-[90vh] overflow-y-auto defilement-discret rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-xl outline-none min-[768px]:shadow-[0_4px_16px_rgba(16,27,51,0.16)]`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/**
 * L'EN-TÊTE COMMUN AUX TROIS FENÊTRES
 * ====================================
 * Titre à gauche, croix à droite, sur la même ligne. Il existe pour
 * une seule raison : garantir que les trois fenêtres aient le MÊME
 * rythme — même taille de titre, même croix, même espace jusqu'au
 * contenu. Trois copies du même bloc finissent toujours par diverger.
 *
 * La croix est décalée vers le haut et la droite (`-mr-2 -mt-2`) : sa
 * zone de clic de 40 px déborde ainsi dans la marge interne, et c'est
 * l'ICÔNE — pas le bord de sa zone — qui s'aligne avec le titre.
 */
export function EnteteModale({
  idTitre,
  titre,
  surFermeture,
}: {
  idTitre: string;
  titre: string;
  surFermeture: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h2 id={idTitre} className="text-lg font-bold leading-tight">
        {titre}
      </h2>
      <button
        type="button"
        onClick={surFermeture}
        aria-label="Close"
        className="-mr-2 -mt-2 w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-encre-douce hover:bg-fond-doux transition-colors"
      >
        <IconeCroix taille={18} />
      </button>
    </div>
  );
}
