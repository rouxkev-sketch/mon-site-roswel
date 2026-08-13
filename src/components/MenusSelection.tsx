"use client";

import { useSyncExternalStore } from "react";
import { EncadreDeuxChamps } from "@/components/EncadreBarre";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { IconeLoupe } from "@/components/Icones";
import {
  entreesDuFiltre,
  filtreCourant,
  PARAM_JAIME,
  PARAM_SUIVIS,
  poserFiltre,
  TOUS_LES_STYLES,
  type EntreeFiltre,
} from "@/lib/filtres-selection";
import { lireRequeteCourante, souscrireAdresse } from "@/lib/adresse-courante";

/**
 * LES DEUX MENUS DE « MA SÉLECTION » (passe nº 245-§1 et §3)
 * ==================================================================
 * `Mes j'aime` · `Mes suivis` — DANS UN SEUL BLOC, exactement comme
 * le champ et la localité n'en forment qu'un dans le moteur : c'est
 * `EncadreDeuxChamps`, l'encadré EXTRAIT du moteur à cette passe. Il
 * n'existe pas de second encadré, pas de second centrage, pas de
 * second repli — ce bloc est posé dans la RANGÉE de la barre fixe
 * (EnTeteTatouage), celle-là même qui portait le moteur : le
 * centrage, la largeur et le repli sont les siens, inchangés.
 *
 * LES DEUX MENUS SONT DES `MenuDeroulant` — LE menu déroulant de la
 * maison, celui du moteur : même habillage, même feuille mobile,
 * même panneau de verre (`[data-verre-menu]`, nº 236/238). Aucun
 * troisième habillage n'est fabriqué.
 *
 * LEUR CONTENU SE CALCULE (voir `entreesDuFiltre`) : les styles
 * réellement présents dans les données, dans l'ordre et avec les
 * libellés du menu des styles du moteur, familles comprises. Un menu
 * sans aucune entrée ne s'affiche pas du tout.
 *
 * LE CHOIX VIT DANS L'ADRESSE : `?jaime=…` et `?suivis=…`. La page
 * lit les mêmes paramètres — l'adresse est la source commune des
 * deux composants frères (voir lib/filtres-selection).
 */

export function MenusSelection({
  entreesJaime,
  entreesSuivis,
  replie = false,
  surDeploiement,
}: {
  entreesJaime: EntreeFiltre[];
  entreesSuivis: EntreeFiltre[];
  /** La rangée est-elle repliée ? (§4 — l'état vient de la barre, il
      n'est pas calculé ici : une seule mécanique de repli.) */
  replie?: boolean;
  /** Un appui sur la ligne étroite redéploie la rangée. */
  surDeploiement?: () => void;
}) {
  //  L'ADRESSE, LUE COMME UN MAGASIN : le même que celui de la
  //  mémoire de navigation — il surveille `pushState`, `replaceState`
  //  et `popstate`, donc un retour arrière rejoue le bon filtre.
  const requete = useSyncExternalStore(
    souscrireAdresse,
    lireRequeteCourante,
    () => ""
  );
  const choixJaime = filtreCourant(PARAM_JAIME, requete);
  const choixSuivis = filtreCourant(PARAM_SUIVIS, requete);

  /*  §4 (nº 245) — REPLIÉE, LA BARRE NE DISPARAÎT PAS : il reste une
      ligne étroite, « Recherche » au centre en petit, une loupe à sa
      gauche. Un appui la redéploie ; remonter la page aussi (c'est le
      mécanisme de repli de la barre, inchangé, qui s'en charge). */
  if (replie) {
    return (
      <button
        type="button"
        data-ligne-repliee=""
        onClick={surDeploiement}
        aria-label="Déplier la recherche"
        className="flex w-full items-center justify-center gap-2 rounded-2xl
                   min-h-[36px] text-[13px] font-medium text-sombre-texte-doux
                   transition-colors hover:bg-white/5 active:bg-white/10"
      >
        <IconeLoupe taille={16} />
        Recherche
      </button>
    );
  }

  return (
    <EncadreDeuxChamps
      gauche={
        entreesJaime.length > 0 ? (
          <MenuDeroulant
            valeur={choixJaime}
            surChangement={(valeur) => poserFiltre(PARAM_JAIME, valeur)}
            options={entreesJaime}
            ariaLabel="Mes j'aime"
            placeholder="Mes j'aime"
            libelleValeur={
              choixJaime === TOUS_LES_STYLES
                ? "Mes j'aime"
                : entreesJaime.find((e) => e.value === choixJaime)?.label
            }
            hauteur="min-h-[52px]"
            taillePolice="text-base"
            titreFeuille="Mes j'aime"
            feuilleMobile
            sansBordure
            sombre
          />
        ) : (
          <span />
        )
      }
      droite={
        entreesSuivis.length > 0 ? (
          <MenuDeroulant
            valeur={choixSuivis}
            surChangement={(valeur) => poserFiltre(PARAM_SUIVIS, valeur)}
            options={entreesSuivis}
            ariaLabel="Mes suivis"
            placeholder="Mes suivis"
            libelleValeur={
              choixSuivis === TOUS_LES_STYLES
                ? "Mes suivis"
                : entreesSuivis.find((e) => e.value === choixSuivis)?.label
            }
            hauteur="min-h-[52px]"
            taillePolice="text-base"
            titreFeuille="Mes suivis"
            feuilleMobile
            sansBordure
            sombre
          />
        ) : (
          <span />
        )
      }
    />
  );
}
