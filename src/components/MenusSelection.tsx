"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EncadreDeuxChamps } from "@/components/EncadreBarre";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { SelecteurCapsule } from "@/components/SelecteurCapsule";
import { BoutonPhototheque } from "@/components/BoutonPhototheque";
import { IconeChevronBas } from "@/components/Icones";
import { CATEGORIES_EXPLORER } from "@/config/tatouage";
import { libelleExplorer } from "@/components/MoteurTatouage";
import {
  lireSelection,
  MENU_FAVORIS,
  MENU_SUIVIS,
  poserSelection,
  valeurDuMenu,
  type ChoixSelection,
  type EntreeFiltre,
  type MenuSelection,
} from "@/lib/filtres-selection";
import { lireRequeteCourante, souscrireAdresse } from "@/lib/adresse-courante";

/**
 * LE BLOC DE « MA SÉLECTION » — UN BADGE, UN MENU (refonte nº 255)
 * ==================================================================
 * `(Favoris) Suivis  │  Toutes les réalisations ▾`
 *
 * §1 — POURQUOI LES DEUX MENUS SONT PARTIS. Le bloc en portait deux,
 * « Mes favoris » et « Mes suivis », dans l'encadré à deux champs du
 * moteur. C'était une erreur de FORME : dans le moteur, les deux
 * champs se COMBINENT (un style ET une ville) ; ici les deux menus
 * s'EXCLUENT — choisir dans l'un éteignait l'autre. La forme mentait
 * sur le fonctionnement.
 * Le bloc garde sa forme, sa hauteur et son centrage — c'est le même
 * `EncadreDeuxChamps`, avec son fin trait intérieur. Sa moitié gauche
 * devient un BADGE, sa moitié droite UN SEUL MENU. Une seule ligne,
 * sur web comme au doigt : les deux titres cliquables de la nº 253
 * s'en vont avec les menus (§5), le badge les remplace.
 *
 * ⚠️ RIEN N'EST DESSINÉ ICI, TOUT EST CONSOMMÉ (la règle de la passe) :
 *  · le badge qui glisse est `SelecteurCapsule` — le sélecteur
 *    « Profil / Portfolio » des fiches, extrait à cette passe ;
 *  · le champ du filtre est `MenuDeroulant` avec les drapeaux du champ
 *    « Explorer » du moteur (`sansBordure`, `sombre`, `repliable`,
 *    hauteur 52) — son chevron, son panneau web et sa feuille du bas ;
 *  · l'icône de mise en page est `BoutonPhototheque`, celle de la
 *    barre de recherche, extraite à cette passe ;
 *  · la rétractation reste CELLE DE LA BARRE (EnTeteTatouage) : ni
 *    hauteur, ni seuil, ni durée n'est écrit ici.
 *
 * §2 — LE BADGE BASCULE LE CONTENU, IL N'OUVRE RIEN. Un appui sur
 * « Suivis » montre les suivis, un appui sur « Favoris » les favoris :
 * aucune fenêtre, aucune feuille — c'est le menu de droite, et lui
 * seul, qui ouvre quelque chose. IL N'Y A JAMAIS D'ÉTAT NEUTRE :
 * « Favoris » est actif à l'arrivée, puisque c'est ce que la page
 * montre depuis la nº 247 (`CHOIX_PAR_DEFAUT`).
 * Le paramètre d'adresse unique de la nº 247 ne change pas — c'est
 * déjà lui qui rend les deux exclusifs, et lui qui rend le même écran
 * au retour d'une fiche.
 */

/** LES DEUX MOTS DU BADGE — l'ordre de la page : ce qu'on a gardé,
    puis ceux qu'on suit. */
const MOTS_DU_BADGE: ReadonlyArray<{ cle: MenuSelection; label: string }> = [
  { cle: MENU_FAVORIS, label: "Favoris" },
  { cle: MENU_SUIVIS, label: "Suivis" },
];

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
  const surLesFavoris = choix.menu === MENU_FAVORIS;
  const entrees = surLesFavoris ? entreesFavoris : entreesSuivis;

  /**
   * §3 — L'ÉCRAN EST-IL ÉTROIT ? Le libellé du champ s'y RACCOURCIT
   * (« Toutes les réalisations » devient « Réalisations ») plutôt que
   * de rétrécir le badge. La borne est CELLE DE LA BARRE (nº 154-§5,
   * EnTeteTatouage) — la même chaîne, au centième près : on ne pose
   * pas un second point de rupture.
   * Le premier rendu prend le libellé long (celui du serveur), et
   * l'effet le raccourcit après l'hydratation : aucune discordance.
   */
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const borne = window.matchMedia("(max-width: 1023.98px)");
    const lire = () => setEtroit(borne.matches);
    lire();
    borne.addEventListener("change", lire);
    return () => borne.removeEventListener("change", lire);
  }, []);

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

  /*  §2 — LE BADGE. Un appui repose le paramètre sur l'autre menu, sans
      critère : le filtre d'un menu ne vaut pas pour l'autre (leurs
      entrées sont calculées sur des données différentes), et l'écran
      d'arrivée d'un menu est son écran entier. */
  const badge = (
    <SelecteurCapsule
      valeur={choix.menu}
      options={MOTS_DU_BADGE}
      surChoix={(menu) => poserSelection(menu, "")}
      ariaLabel="Favoris ou suivis"
      pleineLargeur
    />
  );

  /**
   * §3 — LE CHAMP DU FILTRE. Il porte le filtre DE CE QUE LE BADGE A
   * CHOISI : sur « Favoris » il filtre les favoris, sur « Suivis » les
   * suivis — les deux listes d'entrées sont calculées depuis les
   * données (nº 247-§3), avec les deux portes du menu « Explorer » et
   * les familles en sous-porte (le drapeau `repliable`, sans lequel
   * aucune porte n'existe).
   *
   * IL N'EST JAMAIS VIDE : à l'ouverture il dit l'état en cours par le
   * mot de la porte (« Toutes les réalisations ») ; filtré, il dit le
   * couple (« Réalisations · Abstrait »). Les deux libellés viennent
   * des entrées elles-mêmes et de `libelleStyle` — aucun mot n'est
   * écrit ici.
   *
   * PAS DE LOUPE DEDANS : sur ce site la loupe veut dire
   * « rechercher », et c'est elle qui ouvre la page de recherche. Ici
   * c'est un filtre — il porte le chevron, comme le champ de localité.
   *
   * OÙ IL S'OUVRE : en PANNEAU sous le champ sur le web, en FEUILLE
   * par le bas au doigt (`feuilleMobile` — le portail, la sœur du
   * voile, le verre des menus et la fermeture au clic dehors qui
   * connaît la feuille, nº 251 et nº 253).
   *
   * ⚠️ SANS AUCUNE ENTRÉE, PAS DE CHAMP : un menu vide ne se déplie
   * pas, et un champ qui n'ouvre rien ment. La moitié reste nue — le
   * badge, lui, reste la commande.
   */
  const filtre = () => {
    if (entrees.length === 0) return <span />;
    const valeur = valeurDuMenu(choix, choix.menu);
    return (
      <MenuDeroulant
        valeur={valeur}
        surChangement={(suivante) => poserSelection(choix.menu, suivante)}
        options={entrees}
        ariaLabel="Filtrer"
        placeholder={libelleDuFiltre(entrees, choix, etroit)}
        libelleValeur={libelleDuFiltre(entrees, choix, etroit)}
        titreFeuille="Filtrer"
        hauteur="min-h-[52px]"
        taillePolice="text-base"
        sansBordure
        sombre
        repliable
        feuilleMobile
      />
    );
  };

  return (
    /*  §1 — UNE SEULE LIGNE, AUX DEUX LARGEURS : l'encadré prend toute
        la place disponible, et l'icône de mise en page se pose à sa
        droite (§4). Le centrage, la largeur et le repli restent ceux
        de la barre (EnTeteTatouage), avec ses réglages de juillet. */
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
          {/*  §4 — L'ICÔNE DE MISE EN PAGE, SUR « FAVORIS » SEULEMENT,
               et sur le web : sur « Suivis » il n'y a pas de cartes à
               mettre en page. L'écart (`gap-2.5`) est celui de la
               rangée du moteur, où la même icône côtoie déjà l'encadré.
               ⚠️ LE BLOC NE SAUTE PAS D'UNE LARGEUR À L'AUTRE : c'est
               l'ENCADRÉ qui prend la place libérée (`flex-1 min-w-0`),
               pas le bloc qui rétrécit. */}
          <div className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <EncadreDeuxChamps gauche={badge} droite={filtre()} />
            </div>
            {surLesFavoris && (
              <div data-mise-en-page-selection="" className="hidden lg:flex">
                <BoutonPhototheque contexte="Ma sélection" />
              </div>
            )}
          </div>
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

/**
 * CE QUE LE CHAMP AFFICHE — L'ÉTAT EN COURS, JAMAIS RIEN (§3)
 * ------------------------------------------------------------------
 *  · un style choisi   → « Réalisations · Abstrait » (le titre de la
 *    porte, puis le style : l'écriture du moteur refermé) ;
 *  · une porte choisie → « Toutes les réalisations » (le mot de
 *    l'entrée elle-même) ;
 *  · rien de choisi    → le mot de la PREMIÈRE PORTE présente — c'est
 *    l'état d'ouverture, et il se lit.
 * SUR ÉCRAN ÉTROIT, le mot long se raccourcit au titre de la porte
 * (« Réalisations ») : le badge ne rétrécit pas pour lui.
 * ⚠️ AUCUN MOT N'EST ÉCRIT ICI : `CATEGORIES_EXPLORER` porte les deux
 * titres et les deux « Tous les… », `libelleStyle` le nom du style.
 */
function libelleDuFiltre(
  entrees: EntreeFiltre[],
  choix: ChoixSelection,
  etroit: boolean
): string {
  //  LA PORTE EN COURS : celle du choix, ou la PREMIÈRE PRÉSENTE quand
  //  rien n'est filtré — c'est ce que dit l'état d'ouverture.
  const nature = choix.nature || (entrees[0]?.value.split(":")[0] ?? "");
  if (!nature) return "";
  //  ⚠️ L'ÉCRITURE DU MOTEUR, PAS UNE SECONDE : `libelleExplorer` est
  //  ce que le champ « Explorer » affiche une fois refermé.
  const complet = libelleExplorer(nature, choix.style);
  //  Un style : le couple, jamais raccourci — il est déjà court.
  if (choix.style) return complet;
  const titre = CATEGORIES_EXPLORER.find((c) => c.nature === nature)?.titre;
  return etroit && titre ? titre : complet;
}
