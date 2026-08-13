"use client";

import { useSyncExternalStore } from "react";
import { EncadreDeuxChamps } from "@/components/EncadreBarre";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { IconeChevronBas } from "@/components/Icones";
import { libelleStyle } from "@/config/tatouage";
import {
  lireSelection,
  MENU_FAVORIS,
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
 * `Mes favoris` · `Mes suivis` — DANS UN SEUL BLOC, exactement comme
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
  entreesFavoris,
  entreesSuivis,
  replie = false,
  surDeploiement,
}: {
  entreesFavoris: EntreeFiltre[];
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
      gauche={menu(MENU_FAVORIS, "Mes favoris", entreesFavoris)}
      droite={menu(MENU_SUIVIS, "Mes suivis", entreesSuivis)}
    />
  );

  /**
   * §1 (nº 253) — AU DOIGT, LA RANGÉE PORTE LES DEUX TITRES.
   * ------------------------------------------------------------------
   * La barre RESTE, entière, avec sa rétractation (la nº 251 l'avait
   * retirée du smartphone — c'était une mauvaise lecture, défaite
   * ici) : ce sont les deux MENUS DÉROULANTS qui cèdent la place aux
   * deux TITRES. Chacun porte son chevron et ouvre SA feuille, jamais
   * les deux — c'est le même `MenuDeroulant`, avec les mêmes drapeaux
   * (`sombre`, `repliable`) et sa feuille glissante : le titre EST son
   * champ (`libelleValeur` fixe, `hauteur` et `taillePolice` neutres),
   * de sorte que rien n'est redessiné.
   */
  const titre = (cle: MenuSelection, nom: string, entrees: EntreeFiltre[]) => {
    if (entrees.length === 0) return null;
    return (
      <span data-titre-barre={cle} className="min-w-0">
        <MenuDeroulant
          valeur={valeurDuMenu(choix, cle)}
          surChangement={(suivante) => poserSelection(cle, suivante)}
          options={entrees}
          ariaLabel={nom}
          placeholder={nom}
          libelleValeur={nom}
          titreFeuille={nom}
          hauteur="min-h-0"
          taillePolice=""
          sansBordure
          sombre
          repliable
          feuilleMobile
        />
      </span>
    );
  };

  const blocDesTitres = (
    <div className="flex items-center gap-6">
      {titre(MENU_FAVORIS, "Mes favoris", entreesFavoris)}
      {titre(MENU_SUIVIS, "Mes suivis", entreesSuivis)}
    </div>
  );

  return (
    /*  §1 (nº 251) — L'ENCADRÉ REVIENT DANS LA BARRE DU WEB, tel
        qu'il était à la nº 246 : le `lg:hidden` de la nº 249 est
        défait.
        §1 (nº 253) — ET LA RANGÉE DU SMARTPHONE EST RÉTABLIE : elle
        porte les deux TITRES à la place des deux menus déroulants. Une
        seule rangée, deux contenus selon la largeur — le centrage, la
        largeur et le repli restent ceux de la barre (EnTeteTatouage),
        avec ses réglages de juillet.
        ⚠️ LES DEUX ÉTATS DU REPLI RESTENT ÉCRITS (la ligne étroite
        « Ma sélection » et ses jetons) : la barre garde son bandeau et
        son repli. */
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
        <div className="min-h-0 overflow-hidden">
          {/*  L'ENCADRÉ sur le web, LES DEUX TITRES au doigt : la même
               rangée, le même repli. */}
          <div className="hidden lg:block">{blocDesMenus}</div>
          <div className="lg:hidden">{blocDesTitres}</div>
        </div>
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
          {/*  §2 (nº 246, resserrée nº 250-§2) — LA LIGNE ÉTROITE : le
               mot en 13 px GRIS (la taille et la couleur des libellés
               secondaires, `text-sombre-texte-doux` — aucune valeur
               neuve), et à sa gauche, avec 8 px d'écart (`gap-2`), LA
               FLÈCHE VERS LE BAS (nº 250-§2) : elle dit qu'un appui
               DÉPLOIE — la loupe, elle, disait « chercher », ce que
               cette ligne ne fait pas. `IconeChevronBas`, l'écriture
               unique des icônes de la nº 240, en `currentColor`.
               L'ensemble centré. Aucun contour, aucun halo, aucun
               rose.
               ⚠️ LE MOT EST « MA SÉLECTION » (nº 247-§6) : repliée, la
               rangée dit OÙ l'on est.
               ⚠️ UN CRAN PLUS BASSE (nº 250-§2) : 28 px au lieu de 36
               — le mot et la flèche restent lisibles (13 px / 14 px).
               La courbe et la durée du repli ne bougent pas d'un
               jeton : mêmes enveloppes `pliage`, 300 ms, ease-out. La
               réserve de la barre suit (64 + 12 + 28 = 104, voir
               EnTeteTatouage). */}
          <button
            type="button"
            data-ligne-repliee=""
            onClick={surDeploiement}
            aria-label="Déplier les menus de Ma sélection"
            className="flex w-full items-center justify-center gap-2 rounded-2xl
                       min-h-[28px] text-[13px] text-sombre-texte-doux
                       transition-colors hover:bg-white/5 active:bg-white/10"
          >
            <IconeChevronBas taille={14} />
            Ma sélection
          </button>
        </div>
      </div>
    </div>
  );
}
