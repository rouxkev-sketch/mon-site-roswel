"use client";

import { useState } from "react";
import { COULEURS } from "@/config/roswel";

/**
 * LES CHAMPS DES PAGES D'ADMINISTRATION
 * ======================================
 * Mêmes dimensions, mêmes contours, mêmes couleurs que les champs du
 * site public. Les pages d'administration ne sont pas un sous-produit :
 * ce sont celles que je regarde tous les jours.
 *
 * TOUT VIENT DE LA CHARTE (src/config/roswel.ts) : aucune valeur
 * inventée ici. Le contour au repos est `bordure-champ`, celui au
 * survol `bordure`, et au focus le rose de la marque avec son halo —
 * exactement comme ChampVille et MenuDeroulant sur le site public.
 */

/** La hauteur, les arrondis et les contours communs à tous les champs. */
const BASE =
  "w-full min-h-[48px] rounded-2xl border bg-fond px-4 text-base outline-none " +
  "transition-colors";

const CONTOURS =
  "border-bordure-champ hover:border-bordure focus:border-primaire " +
  "focus:ring-2 focus:ring-primaire/25";

/** Un champ de saisie ordinaire (texte, e-mail…). */
export const CLASSE_CHAMP_ADMIN = `${BASE} ${CONTOURS} placeholder:text-encre-douce`;

/**
 * Un champ COMPACT, pour les cellules d'un tableau : mêmes contours et
 * mêmes couleurs, hauteur réduite. Une ligne de tableau ne peut pas
 * faire 48 px de haut sans devenir illisible sur trente lignes.
 */
export const CLASSE_CHAMP_COMPACT =
  "w-full min-h-[38px] rounded-xl border bg-fond px-3 text-sm outline-none " +
  `transition-colors ${CONTOURS}`;

/** L'étiquette au-dessus d'un champ. */
export const CLASSE_ETIQUETTE =
  "block text-sm font-medium mb-1.5";

/* ------------------------------------------------------------------
 * LA FLÈCHE DES MENUS
 * ------------------------------------------------------------------
 * Dessinée dans le code, comme celle de MenuDeroulant : grise au
 * repos, ROSE quand le champ a le focus. C'est ce détail qui manquait
 * le plus — la flèche du navigateur n'a ni la bonne couleur, ni la
 * bonne taille, ni la bonne position, et elle change d'un navigateur
 * à l'autre.
 * ------------------------------------------------------------------ */

const flecheImage = (couleur: string) =>
  `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='8'><path d='M1 1l6 6 6-6' stroke='${couleur}' stroke-width='2' fill='none' stroke-linecap='round'/></svg>`
  )}")`;

const FLECHE_GRISE = flecheImage(COULEURS.flecheMenus);
const FLECHE_ROSE = flecheImage(COULEURS.primaire);

/**
 * UN MENU DÉROULANT AUX COULEURS DU SITE
 * ---------------------------------------
 * C'est un `<select>` ordinaire — donc le menu natif du système,
 * parfaitement utilisable au clavier et sur mobile — mais habillé
 * comme le reste : la flèche du navigateur est retirée
 * (`appearance-none`) et remplacée par celle de la charte.
 *
 * (Le menu « maison » du site public, MenuDeroulant, dessine aussi sa
 * liste ; ce n'est pas nécessaire ici, où les listes sont courtes et
 * où l'on travaille au clavier.)
 */
export function MenuAdmin({
  id,
  valeur,
  surChoix,
  children,
  disabled = false,
  ariaLabel,
}: {
  id: string;
  valeur: string;
  surChoix: (valeur: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <select
      id={id}
      value={valeur}
      onChange={(e) => surChoix(e.target.value)}
      onFocus={() => setOuvert(true)}
      onBlur={() => setOuvert(false)}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        appearance: "none",
        backgroundImage: ouvert ? FLECHE_ROSE : FLECHE_GRISE,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 1rem center",
        // La place de la flèche, pour que le texte ne passe pas dessous.
        paddingRight: "2.75rem",
      }}
      className={`${CLASSE_CHAMP_ADMIN} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------
 * LES BADGES DE SÉLECTION
 * ------------------------------------------------------------------ */

/**
 * Un badge cliquable, allumé ou éteint. Mêmes pilules que les filtres
 * du site public : capsule, contour discret, rose plein une fois
 * choisi.
 */
export function BadgeChoix({
  actif,
  surClic,
  children,
  titre,
}: {
  actif: boolean;
  surClic: () => void;
  children: React.ReactNode;
  titre?: string;
}) {
  return (
    <button
      type="button"
      onClick={surClic}
      aria-pressed={actif}
      title={titre}
      className={`text-sm font-semibold rounded-full px-4 min-h-[40px] flex items-center border transition-colors ${
        actif
          ? "bg-primaire text-white border-primaire"
          : "border-bordure-champ hover:border-bordure hover:bg-fond-doux"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------
 * LES BOUTONS
 * ------------------------------------------------------------------ */

/** Le bouton d'action principal (rose plein), hauteur des champs. */
export const CLASSE_BOUTON_PRINCIPAL =
  "bg-primaire hover:bg-primaire-fonce active:bg-primaire-fonce text-white " +
  "font-semibold rounded-full px-6 min-h-[48px] transition-colors " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

/** Le bouton secondaire (contour), même hauteur que les champs. */
export const CLASSE_BOUTON_SECONDAIRE =
  "border border-bordure-champ hover:border-bordure hover:bg-fond-doux " +
  "font-semibold text-sm rounded-full px-5 min-h-[48px] transition-colors " +
  "disabled:opacity-60 disabled:cursor-not-allowed";
