"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EncadreDeuxChamps } from "@/components/EncadreBarre";
import { IconeReglages } from "@/components/Icones";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { SelecteurCapsule } from "@/components/SelecteurCapsule";
import { BoutonPhototheque } from "@/components/BoutonPhototheque";
import { CATEGORIES_EXPLORER } from "@/config/tatouage";
import {
  libelleExplorer,
  libelleStyleChoisi,
} from "@/components/MoteurTatouage";
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
 * LE BLOC DE « MA SÉLECTION » — UN BADGE, UN MENU (refonte nº 255,
 * l'encadré retiré nº 256)
 * ==================================================================
 * `(Favoris) Suivis   Toutes les réalisations ▾`
 *
 * §1 — POURQUOI LES DEUX MENUS SONT PARTIS (nº 255). Le bloc en
 * portait deux, « Mes favoris » et « Mes suivis », dans l'encadré à
 * deux champs du moteur. C'était une erreur de FORME : dans le moteur,
 * les deux champs se COMBINENT (un style ET une ville) ; ici les deux
 * menus s'EXCLUENT — choisir dans l'un éteignait l'autre. La forme
 * mentait sur le fonctionnement. Sa moitié gauche est devenue un
 * BADGE, sa moitié droite UN SEUL MENU. Une seule ligne, sur web comme
 * au doigt : les deux titres cliquables de la nº 253 sont partis avec
 * les menus (§5), le badge les remplace.
 *
 * §1 (nº 256) — L'ENCADRÉ RESTE, ET C'EST LUI QUI CHANGE DE ROBE. Le
 * défaut de la nº 255 : la pilule (`sombre-haut`, #414149) était
 * EXACTEMENT le gris du fond de l'encadré (`data-clair-barre`, la
 * valeur gravée nº 175) — le badge, plus sombre que ce qui l'entoure,
 * inversait la hiérarchie de la charte (page → bloc → badge, chaque
 * niveau S'ÉCLAIRCIT) et le sélecteur ne se lisait pas. Trois
 * corrections, aucun contour nulle part :
 *  · l'encadré devient une CAPSULE (`porteBadge` — rayon à la moitié
 *    de sa hauteur, sur web comme au doigt) pour épouser la forme du
 *    badge qu'il contient ; le champ n'a plus de forme propre ;
 *  · la pilule monte D'UN CRAN FRANC au-dessus du fond :
 *    `haut-clair`, le barreau au-dessus de `haut` (`robeCapsule`, le
 *    paramètre de l'écriture unique — la fiche garde le sien) ;
 *  · le badge ne touche plus rien : ses 4 px d'air en haut et en bas
 *    (44 dans 52), le même air à gauche, et 12 px à sa droite avant
 *    le fin trait — l'air est CÉDÉ PAR LE CHAMP, le badge garde ses
 *    mots et sa glissade de la nº 255 au pixel (le `box-content` de
 *    l'encadré, voir EncadreBarre).
 * §6 — AU DOIGT, LE CHAMP NE DIT QUE LA CATÉGORIE (« Réalisations »,
 * « Flashs »), chevron gardé : le style complet vit dans le titre de
 * la page, juste dessous.
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
}: {
  entreesFavoris: EntreeFiltre[];
  entreesSuivis: EntreeFiltre[];
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
      //  §4 (nº 258) — LA ROBE NE SE PASSE PLUS ICI : dans l'encadré,
      //  la pilule est habillée par la règle `[data-clair-barre]
      //  [data-capsule-glissante]` de globals.css — un cran au-dessus
      //  du fond DE SON ENCADRÉ, au repos comme au survol et au focus
      //  (l'écart était absolu depuis la nº 256, et le survol
      //  l'annulait : le fond montait à la couleur de la pilule). La
      //  fiche, hors encadré, garde son défaut (`bg-sombre-haut`).
      robeCapsule=""
      //  §1 (nº 258) — LA HAUTEUR DES MOTS SUIT L'ENCADRÉ : 46 − 2 × 4
      //  d'air (le même air qu'à la nº 256) = 38. La fiche garde ses
      //  44 (son défaut) : c'est le paramètre de l'écriture unique.
      hauteurMot="min-h-[38px]"
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
      /*  §1 (nº 256) — LE CHAMP N'A PLUS DE FORME PROPRE : c'est
          l'encadré-capsule qui donne la boîte, le fond et le focus
          (`data-clair-barre` sur lui, la règle de globals.css). */
      <MenuDeroulant
        valeur={valeur}
        surChangement={(suivante) => poserSelection(choix.menu, suivante)}
        options={entrees}
        ariaLabel="Filtrer"
        placeholder={libelleDuFiltre(entrees, choix, etroit)}
        libelleValeur={libelleDuFiltre(entrees, choix, etroit)}
        titreFeuille="Filtrer"
        /*  §3 (nº 262) — SUR SMARTPHONE, LE CHAMP NE DIT PLUS LE
            STYLE : le mot « Filtrer », en blanc et en gras — la graisse
            et la taille du titre « Recherche » de la page du moteur
            (PageRechercheMobile, text-[20px] font-bold text-white) —,
            et à sa gauche L'ICÔNE DE FILTRE DU MOTEUR (IconeReglages,
            la même écriture que son bouton rond du web — jamais un
            second dessin), en gris. La flèche part avec le libellé
            (MenuDeroulant). L'état n'est pas perdu : le titre de la
            page, juste dessous, dit déjà « Mes suivis · Anime &
            Manga ». Sur web et iPad, rien ne change : libellé et
            chevron. */
        champMobile={
          <>
            <IconeReglages taille={20} classe="shrink-0 text-sombre-texte-doux" />
            {/*  §1 (nº 264) — LA TAILLE DU MOT DU CHAMP, PAS D'UN
                 TITRE : les 20 px de la nº 262 (empruntés au titre de
                 la page du moteur) étaient disproportionnés dans un
                 champ. RELEVÉ sur le champ de recherche de l'accueil,
                 vivant : 16 px — c'est `text-base`, le jeton même que
                 ce champ passe en `taillePolice` : ils ne peuvent pas
                 diverger. Blanc et gras, inchangés. */}
            <span className="text-base font-bold text-white">Filtrer</span>
          </>
        }
        /*  §3 (nº 262) — la MÊME icône à gauche du titre de la
            feuille, à la couleur du titre : le gris dans la barre dit
            « ceci ouvre », ici elle dit « tu y es ». Une seule
            écriture, deux couleurs. */
        iconeTitreFeuille={<IconeReglages taille={20} classe="shrink-0" />}
        //  §5 (nº 258) — LA FLÈCHE PREND L'AIR DES MOTS DU BADGE
        //  (20 px, le `px-5` de l'écriture des fiches — aucune valeur
        //  neuve) : à 14 px du bord elle touchait presque la courbe de
        //  la capsule. Le plancher demandé est 12 px.
        positionFleche="right 1.25rem center"
        hauteur="min-h-[46px]"
        taillePolice="text-base"
        sansBordure
        sombre
        repliable
        feuilleMobile
        //  §2 (nº 290) — le trait rose sous « Cultures du monde », sur
        //  les DEUX menus de cette page (les suivis et les favoris :
        //  ils passent tous deux par ici). EN WEB SEULEMENT, et c'est
        //  automatique : `feuilleMobile` ci-dessus fait qu'au doigt
        //  cette page ouvre sa feuille glissante, qui ne pose jamais
        //  le trait — le drapeau ne vaut que pour le panneau
        //  classique, donc pour le web.
        familleSoulignee
      />
    );
  };

  return (
    /*  §1 — UNE SEULE LIGNE, AUX DEUX LARGEURS : l'encadré prend toute
        la place disponible, et l'icône de mise en page se pose à sa
        droite (§4). Le centrage, la largeur et le repli restent ceux
        de la barre (EnTeteTatouage), avec ses réglages de juillet. */
    /*  §2 (nº 259) — LE RABATTEMENT N'EST PLUS ÉCRIT ICI. Ce bloc
        portait son propre pliage (les jetons de la rangée du moteur,
        branchés sur `replie`) tandis que l'enveloppe de la barre, elle,
        restait dépliée : il restait donc les 12 px de son air
        (`max-lg:pt-3`), et la barre de « Ma sélection » descendait
        d'autant plus bas que celle du moteur. C'est désormais
        L'ENVELOPPE DE LA BARRE qui se replie, pour les deux rangées —
        une seule mécanique, une seule réserve, et rien à tenir
        d'accord. */
    <div className="w-full">
          {/*  §1 (nº 256) — L'ENCADRÉ UNIQUE, devenu capsule : le badge
               puis le champ, dans LE MÊME `EncadreDeuxChamps` que le
               moteur, avec son drapeau `porteBadge` (la capsule, l'air
               du badge — voir EncadreBarre). L'écart avec l'icône
               (`gap-2.5`) est celui de la rangée du moteur. */}
          {/*  §1/§2 (nº 258) — L'ENCADRÉ PASSE À LA HAUTEUR DES CERCLES
               (46 px, relevée sur les ronds du moteur — jamais choisie).
               Sur le web, LA BARRE NE CHANGE PAS : la rangée garde la
               zone de 52 px d'hier (`min-h-[52px]`) et y centre
               l'encadré. Au doigt, l'espace libéré est RETIRÉ de la
               barre (`mobile:min-h-0`) : la réserve suit
               (64 + 12 + 46 = 122, voir EnTeteTatouage). */}
          <div className="flex items-center gap-2.5 min-h-[52px] mobile:min-h-0">
            <div className="flex-1 min-w-0">
              <EncadreDeuxChamps gauche={badge} droite={filtre()} porteBadge />
            </div>
            {/*  §4 (nº 256) — L'EMPLACEMENT DE L'ICÔNE EST RÉSERVÉ EN
                 PERMANENCE. La nº 255 la MONTAIT sur « Favoris » et la
                 DÉMONTAIT sur « Suivis » : la largeur du groupe
                 changeait, le centrage recalculait, et tout le bloc
                 glissait à chaque bascule — les mots bougeaient sous le
                 doigt. Elle reste donc TOUJOURS montée ; sur « Suivis »
                 elle est `invisible` (la visibilité, jamais un
                 démontage ni une opacité) : son emplacement demeure,
                 rien ne se referme, rien ne se réajuste — le champ
                 garde sa largeur et « Favoris » son pixel. Invisible,
                 elle ne reçoit ni clic ni focus : c'est la propriété
                 même de `visibility: hidden`. */}
            <div
              data-mise-en-page-selection=""
              className={`hidden lg:flex ${surLesFavoris ? "" : "invisible"}`}
            >
              <BoutonPhototheque contexte="Ma sélection" />
            </div>
          </div>
      {/*  §3 (nº 258) — LA LIGNE ÉTROITE A DISPARU, entièrement. Une
           barre qui se replie ne laisse rien derrière elle : il ne
           reste que le logo et les trois icônes — le titre juste en
           dessous dit déjà où l'on est, et la loupe reste ce qu'elle
           est (elle ouvre la recherche, elle ne redéploie rien). Le
           retour se fait en remontant la page, ce que la mécanique de
           la barre fait déjà (les seuils de juillet). La rangée se
           rabat par L'ENVELOPPE DE LA BARRE (nº 259-§2) — les jetons
           mêmes de la rangée du moteur (300 ms, ease-out), aucune
           seconde écriture. La réserve repasse de trois hauteurs à deux
           (122 / 64, comme le moteur — voir EnTeteTatouage). */}
    </div>
  );
}

/**
 * CE QUE LE CHOIX COURANT S'APPELLE — L'ÉCRITURE UNIQUE (nº 257-§1)
 * ------------------------------------------------------------------
 * Lue ICI par le champ de la barre, et par le SOUS-TITRE de la page
 * (PageFavoris) : les deux disaient la même chose, il ne fallait pas
 * qu'ils le disent deux fois — le menu des suivis ne connaît plus de
 * catégorie, et `libelleExplorer(nature, style)` y rendait « » pour
 * un style pourtant choisi.
 *  · MES FAVORIS → l'écriture du moteur refermé : « Réalisations ·
 *    Abstrait », « Toutes les réalisations » (`libelleExplorer`) ;
 *  · MES SUIVIS  → le style seul (`libelleStyleChoisi`, l'écriture du
 *    site pour « aucun style choisi » — « Tous les styles »).
 * Vide quand rien n'est choisi : c'est à l'appelant de dire s'il veut
 * un état d'ouverture (le champ, §3) ou rien du tout (le sous-titre).
 */
export function libelleDuChoix(choix: ChoixSelection): string {
  if (choix.menu === MENU_SUIVIS) {
    return choix.style ? libelleStyleChoisi(choix.style) : "";
  }
  return libelleExplorer(choix.nature, choix.style);
}

/**
 * CE QUE LE CHAMP AFFICHE — L'ÉTAT EN COURS, JAMAIS RIEN (§3)
 * ------------------------------------------------------------------
 * SUR « MES FAVORIS », SUR LE WEB :
 *  · un style choisi   → « Réalisations · Abstrait » ;
 *  · une porte choisie → « Toutes les réalisations » ;
 *  · rien de choisi    → le mot de la PREMIÈRE PORTE présente — c'est
 *    l'état d'ouverture, et il se lit.
 * AU DOIGT (§6, nº 256) : LA CATÉGORIE SEULE — « Réalisations » ou
 * « Flashs », avec le chevron qui dit que le champ s'ouvre. Le style
 * complet vit dans le TITRE de la page, juste dessous : le répéter
 * dans un champ étroit le tronquait.
 * SUR « MES SUIVIS » (nº 257-§1) : le style, ou « Tous les styles » à
 * l'ouverture — il n'y a plus de catégorie à dire, aux deux largeurs.
 * ⚠️ AUCUN MOT N'EST ÉCRIT ICI : `CATEGORIES_EXPLORER` porte les
 * titres et les « Tous les… », `libelleStyleChoisi` porte « Tous les
 * styles », `libelleExplorer` l'écriture refermée.
 */
function libelleDuFiltre(
  entrees: EntreeFiltre[],
  choix: ChoixSelection,
  etroit: boolean
): string {
  //  §1 (nº 257) — LES SUIVIS N'ONT PLUS DE PORTE : le style, ou
  //  l'état d'ouverture.
  //  §1 (nº 260) — … ET AU DOIGT, L'ÉTAT D'OUVERTURE SE DIT « Style » :
  //  « Tous les styles » ne tenait pas dans la largeur du champ. Un
  //  style choisi, lui, s'écrit en entier — c'est SEULEMENT l'état
  //  d'ouverture qui se raccourcit. Sur le web, la place y est : le
  //  mot ne change pas.
  if (choix.menu === MENU_SUIVIS) {
    if (etroit && !choix.style) return "Style";
    return libelleStyleChoisi(choix.style);
  }
  //  §5 (nº 262) — SUR LE WEB, L'ÉTAT D'OUVERTURE DES FAVORIS DIT
  //  « Tous les styles », COMME SUR LES SUIVIS : « Toutes les
  //  réalisations » y était l'écriture d'une porte qu'on n'a pas
  //  choisie. C'est le LIBELLÉ seul : le menu garde ses deux portes
  //  (Réalisations, Flashs), et un choix — porte ou couple — s'écrit
  //  comme avant. L'écriture vient de `libelleStyleChoisi`, la même
  //  que les suivis — aucun mot écrit ici.
  if (!etroit && !choix.nature && !choix.style) return libelleStyleChoisi("");
  //  LA PORTE EN COURS : celle du choix, ou la PREMIÈRE PRÉSENTE quand
  //  rien n'est filtré — c'est ce que dit l'état d'ouverture.
  const nature = choix.nature || (entrees[0]?.value.split(":")[0] ?? "");
  if (!nature) return "";
  const titre = CATEGORIES_EXPLORER.find((c) => c.nature === nature)?.titre;
  //  §6 (nº 256) — au doigt, la catégorie et rien d'autre.
  if (etroit) return titre ?? "";
  return libelleDuChoix({ ...choix, nature });
}
