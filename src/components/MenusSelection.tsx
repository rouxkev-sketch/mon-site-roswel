"use client";

import { useSyncExternalStore } from "react";
import { EncadreDeuxChamps } from "@/components/EncadreBarre";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { IconeLoupe } from "@/components/Icones";
import { libelleStyle } from "@/config/tatouage";
import {
  lireSelection,
  MENU_JAIME,
  MENU_SUIVIS,
  poserSelection,
  valeurDuMenu,
  type EntreeFiltre,
  type MenuSelection,
} from "@/lib/filtres-selection";
import { lireRequeteCourante, souscrireAdresse } from "@/lib/adresse-courante";

/**
 * LES DEUX MENUS DE « MA SÉLECTION » (nº 245-§1/§3, nº 246, nº 247)
 * ==================================================================
 * `Mes j'aime` · `Mes suivis` — DANS UN SEUL BLOC, exactement comme
 * le champ et la localité n'en forment qu'un dans le moteur : c'est
 * `EncadreDeuxChamps`, l'encadré EXTRAIT du moteur. Il n'existe pas de
 * second encadré, pas de second centrage, pas de second repli — ce
 * bloc est posé dans la RANGÉE de la barre fixe (EnTeteTatouage),
 * celle-là même qui portait le moteur.
 *
 * LES DEUX MENUS SONT DES `MenuDeroulant` — LE menu de la maison,
 * celui du moteur, avec LES MÊMES DRAPEAUX que son champ
 * « Explorer » : `sansBordure`, `sombre`, hauteur 52, et
 * **`repliable`**.
 * ⚠️ `repliable` MANQUAIT, ET C'EST LE DÉFAUT DU §3 (nº 247) : sans
 * lui, `MenuDeroulant` ne dessine AUCUNE porte — ni celle des
 * catégories, ni la sous-porte des familles. « Cultures du monde » ne
 * s'ouvrait donc pas « pas du tout » : elle n'existait pas. La porte
 * fonctionne dans le moteur parce que le moteur passe ce drapeau ;
 * c'est bien la même écriture, il lui manquait son interrupteur.
 *
 * LEUR CONTENU SE CALCULE (voir `entreesDuFiltre`) : les DEUX portes
 * du menu Explorer — Réalisations et Flashs —, puis les styles
 * réellement présents dans les données, dans l'ordre et avec les
 * libellés du moteur, familles comprises. Un menu sans entrée ne
 * s'affiche pas du tout.
 *
 * ⚠️ LES DEUX MENUS SONT EXCLUSIFS (nº 247-§2) : un seul mène la
 * recherche à la fois, et choisir dans l'un remet l'autre à zéro.
 * C'est mécanique — il n'y a qu'UNE valeur, dans UN paramètre
 * d'adresse (`?selection=`), lu par la barre comme par la page.
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
  const choix = lireSelection(requete);

  /*  §2 (nº 246) — LE PASSAGE DÉPLOYÉ → RÉTRACTÉ SUIT LE REPLI
      EXISTANT, courbe et durée : les deux états sont montés, chacun
      dans une enveloppe pliée par LES MÊMES JETONS que la rangée du
      moteur (`grid-template-rows` 1fr ↔ 0fr + opacité, 300 ms,
      `ease-out` — nº 147/150). L'ÉTAT, lui, vient toujours de la
      barre (`replie`) : aucune seconde mécanique, seulement la même
      présentation branchée sur le même interrupteur. L'état caché est
      `inert` : rien n'y reçoit le focus. */
  const pliage =
    "grid grid-cols-[minmax(0,1fr)] transition-[grid-template-rows,opacity] duration-300 ease-out";

  /** UN MENU — les drapeaux du champ « Explorer », et rien d'autre.
      Le champ refermé dit le STYLE choisi (« Maori »), ou le nom du
      menu quand il n'y a pas de choix : c'est `libelleValeur`, le même
      procédé que le moteur (dont le champ refermé dit
      « Flashs · Réalisme »). */
  const menu = (
    cle: MenuSelection,
    nom: string,
    entrees: EntreeFiltre[]
  ) => {
    if (entrees.length === 0) return <span />;
    const valeur = valeurDuMenu(choix, cle);
    return (
      <MenuDeroulant
        valeur={valeur}
        surChangement={(suivante) => poserSelection(cle, suivante)}
        options={entrees}
        ariaLabel={nom}
        placeholder={nom}
        libelleValeur={
          valeur
            ? choix.style
              ? libelleStyle(choix.style)
              : entrees.find((entree) => entree.value === valeur)?.label
            : nom
        }
        hauteur="min-h-[52px]"
        taillePolice="text-base"
        sansBordure
        sombre
        repliable
      />
    );
  };

  const blocDesMenus = (
    <EncadreDeuxChamps
      gauche={menu(MENU_JAIME, "Mes j'aime", entreesJaime)}
      droite={menu(MENU_SUIVIS, "Mes suivis", entreesSuivis)}
    />
  );

  return (
    <div className="w-full">
      <div
        className={`${pliage} ${
          replie
            ? "grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100"
        }`}
        aria-hidden={replie || undefined}
        inert={replie || undefined}
      >
        <div className="min-h-0 overflow-hidden">{blocDesMenus}</div>
      </div>
      <div
        className={`${pliage} ${
          replie
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!replie || undefined}
        inert={!replie || undefined}
      >
        <div className="min-h-0 overflow-hidden">
          {/*  §2 (nº 246) — LA LIGNE ÉTROITE : le mot en 13 px GRIS
               (la taille et la couleur des libellés secondaires,
               `text-sombre-texte-doux` — aucune valeur neuve), la
               loupe à 18 px en `currentColor` (l'écriture unique des
               icônes), collée à sa gauche avec 8 px d'écart (`gap-2`),
               l'ensemble centré. Aucun contour, aucun halo, aucun
               rose.
               ⚠️ LE MOT EST « MA SÉLECTION » (nº 247-§6) : cette
               rangée ne porte pas le bloc de recherche, elle porte les
               deux menus de cette page — repliée, elle doit dire OÙ
               l'on est, pas ce qu'elle n'est pas. */}
          <button
            type="button"
            data-ligne-repliee=""
            onClick={surDeploiement}
            aria-label="Déplier les menus de Ma sélection"
            className="flex w-full items-center justify-center gap-2 rounded-2xl
                       min-h-[36px] text-[13px] text-sombre-texte-doux
                       transition-colors hover:bg-white/5 active:bg-white/10"
          >
            <IconeLoupe taille={18} />
            Ma sélection
          </button>
        </div>
      </div>
    </div>
  );
}
