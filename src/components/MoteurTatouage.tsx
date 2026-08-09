"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CATEGORIES_EXPLORER,
  entreesExplorer,
  GROUPES_FILTRES,
  lireValeurExplorer,
  RAYONS_TATOUAGE,
  RAYON_TATOUAGE_DEFAUT,
  libelleStyle,
  TEXTES_TATOUAGE,
  valeurExplorer,
} from "@/config/tatouage";
import { ligneMoteur } from "@/lib/adresse";
import { ChampLocalisation } from "@/components/ChampLocalisation";
import { Interrupteur } from "@/components/Interrupteur";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { PageRechercheMobile } from "@/components/PageRechercheMobile";
import {
  IconeDeuxColonnes,
  IconeLoupe,
  IconeReglages,
  IconeUneColonne,
} from "@/components/Icones";
import { noterLaCarteDuHaut } from "@/lib/carte-du-haut";
import {
  basculerDisposition,
  lireDisposition,
  lireDispositionServeur,
  souscrireDisposition,
} from "@/lib/disposition-grille";
import {
  fermerRecherche,
  lireRecherche,
  lireRechercheServeur,
  ouvrirRecherche,
  poserBrouillon,
  poserVueRecherche,
  souscrireRecherche,
} from "@/lib/recherche-mobile";
import type { LieuTrouve } from "@/lib/geocodage";

/**
 * LE MOTEUR DE RECHERCHE DE YOKOFOLIO
 * ====================================
 * IL VIT DANS LA BARRE FIXE, sur web comme sur smartphone. Il y reste
 * sous la main pendant qu'on parcourt les cartes — c'est sa place, et
 * il n'en bouge pas.
 *
 * AUCUN BOUTON « Rechercher » : chaque changement lance la recherche.
 * Un bouton n'ajouterait qu'un clic entre la personne et les images.
 *
 * COMPOSANT PILOTÉ : il ne garde AUCUN critère. Ils viennent d'en haut,
 * et chaque changement remonte — la grille et la ligne de résultats
 * suivent donc toujours ce que montre le moteur.
 *
 * LE RAYON VIT AVEC LA LOCALITÉ — un rayon autour de rien n'a pas de
 * sens : sur le web il s'affiche DANS le panneau du champ ville, dans
 * la fenêtre mobile il est posé SOUS la localité. Il n'a d'objet
 * qu'autour d'un POINT (une ville, une adresse) : sans lieu, ou sur
 * une RÉGION ou un PAYS, il RESTE À SA PLACE mais devient INACTIF —
 * grisé, hors d'usage, comme n'importe quel champ désactivé du site.
 * Aucune phrase ne vient le remplacer : un réglage éteint se voit,
 * il n'a pas besoin qu'on l'explique, et la fenêtre ne saute plus
 * d'une hauteur à l'autre selon le lieu choisi.
 * SON PREMIER PALIER EST DIX KILOMÈTRES, sur web comme sur
 * smartphone. Le palier « 0 km » (la ville seule) a existé un temps :
 * il est retiré — une recherche de tatoueur ne s'arrête pas au
 * panneau d'entrée d'une commune.
 *
 * LES FILTRES SONT DES INTERRUPTEURS TOUS ALLUMÉS : on ÉTEINT ce
 * qu'on ne veut pas voir, on ne coche pas ce qu'on veut. Tout allumé
 * = aucun filtrage. Les critères ne portent donc que les slugs
 * ÉTEINTS (`exclure`) — la règle exacte vit dans src/lib/tatoueurs.ts
 * (passeLesFiltres). TROIS groupes désormais : Technique, Composition
 * et ARTISTE / SALON (voir GROUPES_FILTRES) — le type de fiche est un
 * critère de recherche comme un autre, pas un cas particulier.
 *
 * DEUX FORMATS — PAR APPAREIL, PLUS JAMAIS PAR LARGEUR
 * -----------------------------------------------------
 * APPAREILS À SOURIS (`mobile:hidden`, quelle que soit la largeur de
 * la fenêtre) : l'encadré style + ville, ÉPURÉ, et à sa DROITE un
 * BOUTON ROND à l'icône de réglages qui déplie les trois groupes
 * d'interrupteurs dans un panneau.
 *
 * VRAIS MOBILES (tactile, attribut data-appareil="mobile") :
 * l'encadré replié des grands sites — UNE SEULE ligne pleine largeur,
 * la LOUPE à gauche, puis le RÉSUMÉ DE LA RECHERCHE dans la
 * typographie exacte de la ligne de résultats : le style en blanc et
 * en gras, la localité en gris derrière lui. Rien cherché encore ? La
 * pilule invite, simplement : « Rechercher ».
 * Au toucher, une PAGE DE RECHERCHE PLEIN ÉCRAN (voir
 * PageRechercheMobile) coupée en DEUX VUES par une bascule en haut :
 * « Recherche » (style, localité, rayon) et « Filtres » (Technique,
 * Composition, Artiste / Salon).
 *
 * ⚠️ CE FUT UNE FENÊTRE SUPERPOSÉE, ET C'EST FINI. Dix passes ont
 * essayé de la faire tenir pendant que le clavier d'iOS arrive :
 * glissement de l'arrière-plan, saccades, bande blanche, menu mal
 * placé. La cause était structurelle — un élément flottant qu'il faut
 * repositionner à la main quand le navigateur déplace le viewport. Une
 * PAGE n'a rien à repositionner : le navigateur fait défiler le
 * document lui-même, sur iOS comme sur Android. Tout le code de
 * placement (paliers, recollage, suivi du viewport visuel,
 * compensation du corps) a été SUPPRIMÉ avec elle.
 */

export type CritèresTatouage = {
  style: string;
  /** LA NATURE CHERCHÉE — « tatouage », « flash », ou vide (passe
      nº 110). Elle voyage TOUJOURS avec le style : le menu
      « Explorer » ne propose pas l'un sans l'autre. Vide = rien n'a
      été cherché, la mosaïque montre tout. */
  nature: string;
  /** LE LIEU CHOISI dans la liste mondiale (lib/geocodage) — il porte
      les coordonnées ET le niveau (adresse, ville, région, pays) qui
      décide du mode de recherche. Null = aucun lieu = PARTOUT, le
      monde entier. */
  lieu: LieuTrouve | null;
  /** Le rayon autour d'une ville ou d'une adresse. ZÉRO est une vraie
      valeur : la ville seule. Sans objet pour une région, un pays. */
  rayonKm: number;
  /** Les INTERRUPTEURS ÉTEINTS (« ce que je ne veux pas voir ») —
      slugs de FILTRES_TATOUAGE, tous groupes confondus. Vide = tout
      allumé = aucun filtrage. */
  exclure: string[];
};

/** Complète des critères partiels : un seul endroit décide des défauts. */
export function criteresComplets(
  partiels?: Partial<CritèresTatouage>
): CritèresTatouage {
  return {
    style: partiels?.style ?? "",
    nature: partiels?.nature ?? "",
    lieu: partiels?.lieu ?? null,
    rayonKm: partiels?.rayonKm ?? RAYON_TATOUAGE_DEFAUT,
    exclure: partiels?.exclure ?? [],
  };
}

/**
 * CE QUE LE MENU « EXPLORER » AFFICHE UNE FOIS REFERMÉ.
 * « Tous les flashs », « Flashs · Réalisme », « Tatouages · Blackwork ».
 * ⚠️ LA NATURE VIENT EN PREMIER, parce que c'est la question à
 * laquelle on a répondu en premier — la ligne se lit dans l'ordre où
 * elle a été construite.
 */
export function libelleExplorer(nature: string, style: string): string {
  const categorie = CATEGORIES_EXPLORER.find((c) => c.nature === nature);
  if (!categorie) return "";
  if (!style) return categorie.tous;
  const label = libelleStyle(style);
  return `${categorie.titre} · ${label}`;
}

/** Le libellé du style choisi (« Tous les styles » par défaut). */
export function libelleStyleChoisi(style: string): string {
  return style ? libelleStyle(style) : "Tous les styles";
}

/**
 * LE RAYON S'APPLIQUE-T-IL À CE LIEU ?
 * Seulement autour d'un POINT : une ville, une adresse. Une région ou
 * un pays se cherchent en entier — un cercle autour de leur centre
 * n'a aucun sens (25 km autour du centre de la France ne couvrent
 * presque rien : c'était le bug).
 */
export function rayonApplicable(lieu: LieuTrouve | null): boolean {
  return (
    lieu !== null && (lieu.precision === "ville" || lieu.precision === "adresse")
  );
}

/** Le rayon écrit à la suite du lieu — rien quand il ne s'applique
    pas (une région, un pays se cherchent en entier). */
export function suffixeRayon(criteres: CritèresTatouage): string {
  return rayonApplicable(criteres.lieu) ? ` · ${criteres.rayonKm} km` : "";
}

/**
 * LE LIBELLÉ DU LIEU une fois validé : « Partout », « Lyon, France »,
 * « Miami, FL, États-Unis · 25 km ».
 * ⚠️ PLUS L'INTITULÉ BRUT DU GÉOCODEUR (passe nº 114) : c'est le
 * MÊME format que sur les cartes — ville, code de l'État si le pays
 * l'écrit, pays. Ni code postal, ni région ailleurs. Le code postal ne
 * sert qu'à CHOISIR, dans les suggestions ; une fois le lieu retenu,
 * il n'apprend plus rien.
 */
export function libelleLieu(criteres: CritèresTatouage): string {
  if (!criteres.lieu) return TEXTES_TATOUAGE.partoutLabel;
  return `${ligneMoteur(criteres.lieu)}${suffixeRayon(criteres)}`;
}

export function MoteurTatouage({
  criteres,
  surChangement,
  id = "moteur-tatouage",
}: {
  criteres: CritèresTatouage;
  /** Appelé à CHAQUE changement : c'est ça, la recherche. */
  surChangement: (criteres: CritèresTatouage) => void;
  id?: string;
}) {
  /**
   * L'ÉTAT DE LA PAGE DE RECHERCHE — LU HORS DE REACT, ET C'EST UNE
   * CORRECTION DE FOND.
   * ------------------------------------------------------------------
   * Il vivait dans trois `useState` d'ici même. Ce composant est monté
   * dans la barre du site, donc DANS l'arbre du routeur de Next : dès
   * que cet arbre est reconstruit, il remonte, ses états repartent à
   * zéro — et la page de recherche disparaît de l'écran sans que
   * personne ne l'ait fermée. C'est très exactement ce que voyait le
   * propriétaire sur son iPhone.
   * La cause première (une adresse passée à `pushState`, qui faisait
   * refaire la page à Next) est corrigée dans PageRechercheMobile.
   * Mais un état d'écran ne doit pas dépendre de la survie d'un
   * composant : il vit désormais dans un module
   * (src/lib/recherche-mobile.ts), que rien ne remet à zéro sinon un
   * vrai rechargement de page.
   *
   * · `ouverte`   — la page est-elle à l'écran ;
   * · `vue`       — « recherche » ou « filtres » ;
   * · `brouillon` — LES CHOIX EN COURS, ET RIEN DE PLUS. Chaque geste
   *   relançait la recherche derrière ; désormais ils s'accumulent
   *   sans toucher aux résultats, et « Valider » les remonte d'un
   *   coup. La croix, le retour arrière et Échap les ABANDONNENT.
   *   `null` = page fermée, le moteur lit les vrais critères.
   */
  const {
    ouverte: pageOuverte,
    vue: vuePage,
    brouillon,
  } = useSyncExternalStore(
    souscrireRecherche,
    lireRecherche,
    lireRechercheServeur
  );
  /** Le panneau des interrupteurs (web, sous le bouton rond). */
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  /** Combien de fois « Effacer » a été pressé — sert de clé au champ
      de localité pour le reconstruire à neuf (voir plus bas). */
  const [effacements, setEffacements] = useState(0);
  const zoneFiltres = useRef<HTMLDivElement>(null);
  /** La disposition de la mosaïque (mobile) — mémorisée localement. */
  const disposition = useSyncExternalStore(
    souscrireDisposition,
    lireDisposition,
    lireDispositionServeur
  );

  // Le panneau des filtres du web : Échap et clic ailleurs referment.
  useEffect(() => {
    if (!filtresOuverts) return;
    function auClic(evenement: MouseEvent) {
      if (!zoneFiltres.current?.contains(evenement.target as Node)) {
        setFiltresOuverts(false);
      }
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setFiltresOuverts(false);
    }
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [filtresOuverts]);

  /** Un seul chemin de sortie : impossible d'oublier de prévenir.
      C'est LA recherche — réservé au moteur du web, qui n'a pas de
      bouton et cherche à chaque geste. */
  function annoncer(suivant: Partial<CritèresTatouage>) {
    surChangement({ ...criteres, ...suivant });
  }

  /** CE QUE LA PAGE AFFICHE : son brouillon si elle est ouverte, les
      vrais critères sinon. */
  const enFenetre = brouillon ?? criteres;

  /** POSER UN CHOIX DANS LE BROUILLON — aucune recherche déclenchée. */
  function poserDansLeBrouillon(suivant: Partial<CritèresTatouage>) {
    poserBrouillon({ ...(brouillon ?? criteres), ...suivant });
  }

  /** OUVRIR LA PAGE, toujours sur la vue « Recherche », et sur un
      brouillon qui part de la recherche en cours. */
  function ouvrirLaPage() {
    ouvrirRecherche(criteres);
  }

  /** FERMER SANS RIEN APPLIQUER — la croix, le retour arrière, Échap.
      Appelée par la page UNE FOIS SA GLISSADE DE SORTIE TERMINÉE :
      démonter plus tôt ferait disparaître la page d'un coup. */
  function abandonnerLaPage() {
    fermerRecherche();
  }

  /** « VALIDER » — LE SEUL GESTE QUI LANCE LA RECHERCHE sur mobile. */
  function validerLaPage() {
    const retenus = brouillon;
    fermerRecherche();
    if (retenus) surChangement(retenus);
    // LA LISTE SE RELIT DEPUIS LE HAUT : valider une recherche ramène
    // tout en haut des résultats — sinon la page reste là où on
    // l'avait laissée et masque les premières cartes. `instant` : le
    // défilement doux global transformerait la remontée en animation
    // interrompue par le rendu. (La page de recherche rend déjà les
    // résultats en haut en sortant sur « Valider » ; ceci garantit le
    // haut même après l'arrivée des nouvelles cartes.)
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  /** « EFFACER » N'EFFACE QUE CE QUI EST SOUS LES YEUX — jamais les
      deux vues d'un coup. Sur « Recherche » il remet le style, le lieu
      et le rayon au défaut et laisse les interrupteurs tels quels ; sur
      « Filtres » il rallume tous les interrupteurs et ne touche pas à
      la recherche. C'est la règle la moins surprenante : on efface ce
      qu'on voit, pas ce qu'on ne voit pas. */
  function effacerLaVue() {
    if (vuePage === "filtres") {
      poserDansLeBrouillon({ exclure: [] });
      return;
    }
    setEffacements((n) => n + 1);
    // ⚠️ « EFFACER » NE CHERCHE PAS NON PLUS : il vide la vue, et
    // c'est tout. Les résultats ne bougent pas tant que « Valider »
    // n'a pas été pressé.
    poserBrouillon({ ...criteresComplets(), exclure: enFenetre.exclure });
  }

  /** Bascule un interrupteur : l'éteindre = l'ajouter aux exclusions.
      `valeurs` et `poser` disent SUR QUOI l'on travaille — les vrais
      critères (web, qui cherche à chaque geste) ou le brouillon de la
      fenêtre (mobile, qui attend « Valider »). */
  function basculerInterrupteur(
    slug: string,
    valeurs: CritèresTatouage,
    poser: (suivant: Partial<CritèresTatouage>) => void
  ) {
    poser({
      exclure: valeurs.exclure.includes(slug)
        ? valeurs.exclure.filter((s) => s !== slug)
        : [...valeurs.exclure, slug],
    });
  }

  /** LES TROIS GROUPES D'INTERRUPTEURS — le même bloc sur web et sur
      mobile : Profil, Où il tatoue, Technique, Types de projets,
      Besoins, Rendu — l'ordre de GROUPES_FILTRES, jamais recopié ici.
      Deux colonnes : les libellés sont courts, la liste reste compacte
      sans devenir un mur de lignes. UN FILET SÉPARE LES GROUPES (sauf
      avant le premier) : passé trois groupes, les seuls titres ne
      suffisaient plus à faire lire la liste par blocs. Le filet est
      porté par une enveloppe et non par le <fieldset> — un <legend>
      découpe la bordure de son propre fieldset, le trait aurait été
      troué.
      DEUX JEUX DE VALEURS possibles — voir `basculerInterrupteur` :
      le web pose sur les vrais critères, la fenêtre sur son
      brouillon. */
  const listeInterrupteurs = (
    valeurs: CritèresTatouage,
    poser: (suivant: Partial<CritèresTatouage>) => void
  ) => (
    <div className="flex flex-col">
      {GROUPES_FILTRES.map((groupe, rang) => (
        <div
          key={groupe.groupe}
          className={
            rang > 0 ? "mt-4 pt-4 border-t border-sombre-bordure/50" : ""
          }
        >
          <fieldset>
            <legend className="text-[12px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
              {groupe.titre}
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-0.5">
              {groupe.options.map((option) => (
                <Interrupteur
                  key={option.slug}
                  allume={!valeurs.exclure.includes(option.slug)}
                  surBascule={() =>
                    basculerInterrupteur(option.slug, valeurs, poser)
                  }
                  libelle={option.label}
                />
              ))}
            </div>
          </fieldset>
        </div>
      ))}
    </div>
  );

  /**
   * LES ENTRÉES DU MENU « EXPLORER » (passe nº 110)
   * ================================================
   * Deux catégories, chacune avec sa porte (voir MenuDeroulant
   * `repliable`) : TATOUAGES et FLASHS. Sous chaque porte, « Tous
   * les … » puis les entrées de styles.
   *
   * ⚠️ « Tous les styles » A DISPARU DE LA LISTE : le champ vide dit
   * déjà « rien de cherché » (l'indication « Explorer » se lit en
   * gris, comme le fantôme d'un champ). Ce qui le remplace, ce sont
   * les deux « Tous les … », qui ne veulent PAS dire la même chose —
   * ils cherchent une nature, pas l'absence de critère.
   *
   * TRENTE ENTRÉES DE A À Z (passe nº 113), dont une FAMILLE
   * dépliante : « Traditionnel ethnique » n'est pas un style — c'est
   * une porte, posée à sa lettre, qui révèle les neuf styles qu'elle
   * range. Elle ne porte aucune valeur cherchable ; seuls ses neuf
   * enfants en ont une (voir `entreesExplorer`).
   */
  const options = CATEGORIES_EXPLORER.flatMap((categorie) => [
    {
      value: valeurExplorer(categorie.nature, ""),
      label: categorie.tous,
      groupe: categorie.titre,
    },
    ...entreesExplorer().flatMap((entree) =>
      entree.genre === "style"
        ? [
            {
              value: valeurExplorer(categorie.nature, entree.slug),
              label: entree.label,
              groupe: categorie.titre,
            },
          ]
        : entree.styles.map((style) => ({
            value: valeurExplorer(categorie.nature, style.slug),
            label: style.label,
            groupe: categorie.titre,
            sousGroupe: entree.label,
          }))
    ),
  ]);

  /** Ce que le menu porte aujourd'hui — le couple nature + style,
      encodé. Vide quand rien n'a été cherché. */
  const valeurDuMenu = valeurExplorer(criteres.nature, criteres.style);

  /** Un choix dans le menu pose les DEUX critères d'un coup : ils ne
      se séparent jamais. */
  const choisirDansExplorer = (
    valeur: string,
    poser: (suivant: Partial<CritèresTatouage>) => void
  ) => {
    const { nature, style } = lireValeurExplorer(valeur);
    poser({ nature, style });
  };

  /** CE QUE LA RECHERCHE DEMANDE, EN UNE LIGNE — « Flashs · Réalisme »
      depuis la passe nº 110.
      ⚠️ VIDE QUAND RIEN N'EST CHERCHÉ, et c'est ce qui compte : c'est
      lui qui remplit le champ refermé du menu, et un champ qui
      afficherait « Tous les styles » d'entrée ne serait plus une
      invitation — il annoncerait un choix que personne n'a fait.
      Vide, l'indication « Explorer » reprend sa place. */
  const libelleQuoi = libelleExplorer(criteres.nature, criteres.style);
  const libelleOu = libelleLieu(criteres);

  /** RIEN N'A ENCORE ÉTÉ CHERCHÉ : la barre fixe n'a alors aucun
      résultat à résumer — elle INVITE, elle ne rend pas compte. */
  const rechercheVierge =
    !criteres.style && !criteres.nature && !criteres.lieu;
  /** La localité, quand il y en a une : « Lyon 5 km », « Allemagne ».
      Le rayon suit la ville sans point médian — un seul séparateur
      dans la ligne, celui qui compte, entre le style et le lieu. */
  const resumeLieu = criteres.lieu
    ? `${ligneMoteur(criteres.lieu)}${
        rayonApplicable(criteres.lieu) && criteres.rayonKm > 0
          ? ` ${criteres.rayonKm} km`
          : ""
      }`
    : "";

  /** LA BARRE FIXE NE DIT QUE CE QU'ON A DEMANDÉ.
      Elle affichait « Partout » derrière le style, même quand
      personne n'avait choisi de lieu : une réponse à une question que
      l'on n'avait pas posée. Désormais, quatre cas et rien de plus —
      et le PREMIER MOT est toujours l'information principale, en
      blanc et en gras (la typographie du titre au-dessus des cartes) :
        · rien cherché    → « Rechercher »
        · une nature seule → « Tous les flashs »
        · un lieu seul    → « Lyon 5 km » (c'est LUI le sujet)
        · les deux        → « Flashs · Réalisme » + « · Lyon 5 km ». */
  const resumePrincipal = libelleQuoi || resumeLieu;
  const resumeSecondaire = libelleQuoi && resumeLieu ? ` · ${resumeLieu}` : "";

  // LE RAYON N'EST UTILISABLE QU'AUTOUR D'UN POINT (ville, adresse).
  // Sans lieu, ou sur une RÉGION / un PAYS, il reste EXACTEMENT à sa
  // place mais devient inactif : grisé, non manipulable. Aucune phrase
  // ne le remplace — la fenêtre garde ainsi la même hauteur quel que
  // soit le lieu choisi, et un réglage éteint se lit tout seul.
  const rayonActif = rayonApplicable(criteres.lieu);

  /** LES PILULES DE RAYON — posées dans le PANNEAU du champ de
      localisation (web), sous les suggestions, dès qu'une ville ou une
      adresse est choisie. Un palier par pilule, l'actif en rose, à
      partir de DIX kilomètres. `onPointerDown` + `preventDefault` : le
      champ garde le focus, le panneau reste ouvert — on peut ajuster
      plusieurs fois. */
  const piedRayon = rayonActif ? (
    <div className="border-t border-sombre-bordure px-4 py-3">
      <p className="text-[12.5px] font-medium text-sombre-texte-doux">
        Rayon autour de {criteres.lieu?.intitule}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {RAYONS_TATOUAGE.map((palier) => (
          <button
            key={palier}
            type="button"
            aria-pressed={palier === criteres.rayonKm}
            onPointerDown={(evenement) => {
              evenement.preventDefault();
              annoncer({ rayonKm: palier });
            }}
            className={`rounded-full px-3 min-h-[32px] text-[13px] font-semibold
                       border transition-colors ${
                         palier === criteres.rayonKm
                           ? "border-primaire bg-primaire/15 text-primaire"
                           : "border-sombre-bordure text-sombre-texte hover:border-primaire hover:text-primaire"
                       }`}
          >
            {palier} km
          </button>
        ))}
      </div>
    </div>
  ) : undefined;

  /** Le curseur de rayon de la FENÊTRE mobile — sous la localité,
      TOUJOURS présent, grisé et hors d'usage tant que le lieu choisi
      n'est pas un point (aucun lieu, une région, un pays). La piste
      prend la largeur restante : aucun écran n'est trop étroit.
      SON MINIMUM EST DIX KILOMÈTRES : le curseur démarre au premier
      palier, exactement comme la première pilule du web.
      Il travaille sur le BROUILLON de la fenêtre : bouger le curseur
      ne relance rien tant que « Valider » n'a pas été pressé. */
  const curseurRayon = (
    valeurs: CritèresTatouage,
    poser: (suivant: Partial<CritèresTatouage>) => void
  ) => {
    const actif = rayonApplicable(valeurs.lieu);
    const index = Math.max(0, RAYONS_TATOUAGE.indexOf(valeurs.rayonKm));
    return (
    <div
      className={`flex items-center gap-3 text-[13px] transition-opacity ${
        actif ? "opacity-100" : "opacity-40"
      }`}
    >
        <label
          htmlFor={`${id}-rayon`}
          className="w-[46px] shrink-0 text-sombre-texte-doux"
        >
          Rayon
        </label>
        <input
          id={`${id}-rayon`}
          type="range"
          min={0}
          max={RAYONS_TATOUAGE.length - 1}
          step={1}
          value={index}
          disabled={!actif}
          aria-valuetext={`${valeurs.rayonKm} kilomètres`}
          title={actif ? undefined : "Choisir une ville pour régler le rayon"}
          onChange={(evenement) => {
            poser({
              rayonKm: RAYONS_TATOUAGE[Number(evenement.target.value)],
            });
          }}
          className={`curseur-sombre flex-1 min-w-0 ${
            actif ? "" : "cursor-not-allowed"
          }`}
        />
        <output
          htmlFor={`${id}-rayon`}
          className={`w-[52px] shrink-0 text-right font-semibold tabular-nums ${
            actif ? "text-primaire" : "text-sombre-texte-doux"
          }`}
        >
          {valeurs.rayonKm} km
        </output>
    </div>
    );
  };

  /** L'encadré style + ville du WEB — épuré : le panneau du champ
      ville porte le RAYON en pied et reste ouvert après le choix. */
  function encadreChamps(identifiant: string) {
    return (
      <div
        className="flex items-stretch rounded-2xl border border-sombre-bordure
                   bg-sombre-eleve overflow-visible
                   focus-within:border-primaire focus-within:ring-2 focus-within:ring-primaire/25
                   transition-colors"
      >
        <div className="flex-1 min-w-0 basis-1/2">
          <MenuDeroulant
            valeur={valeurDuMenu}
            surChangement={(valeur) => choisirDansExplorer(valeur, annoncer)}
            options={options}
            //  LE CHAMP REFERMÉ DIT LE COUPLE, pas seulement le style :
            //  « Réalisme » tout seul ne dirait plus si l'on cherche
            //  des tatouages ou des flashs.
            libelleValeur={libelleQuoi}
            ariaLabel="Explorer"
            placeholder="Explorer"
            hauteur="min-h-[52px]"
            taillePolice="text-base"
            sansBordure
            sombre
            repliable
          />
        </div>

        <div aria-hidden="true" className="w-px my-2.5 bg-sombre-bordure shrink-0" />

        <div className="flex-1 min-w-0 basis-1/2">
          <ChampLocalisation
            pourLeMoteur
            id={`${identifiant}-lieu`}
            etiquette={null}
            texteIndicatif={TEXTES_TATOUAGE.ouLabel}
            lieuInitial={criteres.lieu}
            croixEffacement
            viderSiAbandon
            suffixeLieu={suffixeRayon(criteres)}
            surChoix={(choisi) => annoncer({ lieu: choisi })}
            sansBordure
            compact
            piedPanneau={piedRayon}
            garderOuvertApresChoix
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ---------- APPAREILS À SOURIS (toute largeur) ----------
          L'encadré épuré, et à sa droite le BOUTON ROND des filtres
          (diamètre 46 px — un peu moins que les 52 px de l'encadré).
          `mobile:hidden` : la bascule se fait PAR APPAREIL, plus
          jamais par largeur de fenêtre. Retiré tant que la page de
          recherche est ouverte : un seul moteur vivant à la fois. */}
      {!pageOuverte && (
        <div
          ref={zoneFiltres}
          className="relative flex mobile:hidden items-center gap-2.5"
        >
          {/* OUVRIR LE STYLE OU LA LOCALITÉ FERME LE PANNEAU DES
              FILTRES : un seul volet vivant à la fois. En capture,
              pour agir avant même que le menu ne s'ouvre — et
              `onFocusCapture` couvre l'arrivée au clavier. */}
          <div
            className="flex-1 min-w-0"
            onPointerDownCapture={() => setFiltresOuverts(false)}
            onFocusCapture={() => setFiltresOuverts(false)}
          >
            {encadreChamps(id)}
          </div>
          <button
            type="button"
            onClick={() => setFiltresOuverts((etat) => !etat)}
            aria-expanded={filtresOuverts}
            aria-label="Filtres"
            title="Filtres"
            // LE ROSE NE DIT QU'UNE CHOSE : « le panneau est OUVERT ».
            // Fermé, le bouton reprend sa robe par défaut — même avec
            // des filtres éteints, même la souris dessus (aucun survol
            // rose : après un aller-retour dans le panneau, le bouton
            // semblait rester allumé).
            className={`relative shrink-0 w-[46px] h-[46px] rounded-full border
                       flex items-center justify-center transition-colors ${
                         filtresOuverts
                           ? "border-primaire text-primaire bg-primaire/10"
                           : "border-sombre-bordure bg-sombre-eleve text-sombre-texte hover:border-sombre-texte-doux"
                       }`}
          >
            <IconeReglages taille={19} />
          </button>

          {filtresOuverts && (
            <div
              className="absolute top-full right-0 z-30 mt-2
                         w-[min(420px,calc(100vw-32px))] rounded-2xl
                         border border-sombre-bordure bg-sombre-carte p-5
                         shadow-[0_16px_50px_rgba(0,0,0,0.5)]"
            >
              {listeInterrupteurs(criteres, annoncer)}
            </div>
          )}
        </div>
      )}

      {/* ---------- VRAIS MOBILES (tactile) ----------
          UNE SEULE LIGNE, pleine largeur : la loupe à gauche, puis
          « style · localité » — tronqué d'un seul tenant s'il déborde. */}
      {/* LA RANGÉE DE LA BARRE (vrais mobiles) : la pilule de
          recherche, et à sa DROITE le bouton rond de DISPOSITION. */}
      <div className="hidden mobile:flex w-full items-center gap-2.5">
        {/* LA PILULE : la loupe, puis LE RÉSUMÉ DE LA RECHERCHE.
            TANT QUE RIEN N'EST CHERCHÉ, elle n'annonce pas « Partout »
            — un lieu que personne n'a demandé : elle INVITE, d'un mot,
            « Rechercher ».
            UNE FOIS LA RECHERCHE FAITE, elle reprend EXACTEMENT la
            typographie de la ligne de résultats posée au-dessus des
            cartes : le STYLE en blanc et en gras (c'est lui qu'on est
            venu voir), la LOCALITÉ en gris et sans gras derrière lui.
            Les deux se répondent d'un coup d'œil — la barre fixe dit
            la même chose que le titre, en une ligne. */}
        <button
          type="button"
          onClick={ouvrirLaPage}
          aria-haspopup="dialog"
          aria-expanded={pageOuverte}
          aria-label={
            rechercheVierge
              ? "Rechercher un tatoueur"
              : `Rechercher — ${libelleQuoi || "tout"}, ${libelleOu}`
          }
          className="flex flex-1 min-w-0 items-center gap-3 text-left
                     rounded-full border border-sombre-bordure bg-sombre-eleve
                     px-5 min-h-[52px] active:border-primaire transition-colors"
        >
          <IconeLoupe taille={19} classe="shrink-0 text-sombre-texte-doux" />
          <span
            aria-hidden="true"
            className="min-w-0 flex-1 truncate text-[15px] leading-tight"
          >
            {rechercheVierge ? (
              <span className="font-semibold text-sombre-texte">Rechercher</span>
            ) : (
              <>
                <span className="font-semibold text-sombre-texte">
                  {resumePrincipal}
                </span>
                {resumeSecondaire && (
                  <span className="text-sombre-texte-doux">
                    {resumeSecondaire}
                  </span>
                )}
              </>
            )}
          </span>
        </button>

        {/* LE BOUTON DE DISPOSITION — un cercle à la hauteur de
            l'encadré, JAMAIS rose : son apparence ne bouge pas, seule
            l'ICÔNE change et montre la disposition VERS LAQUELLE on
            bascule (en deux colonnes, elle propose la grande image ;
            en une colonne, la mosaïque). Le choix est mémorisé d'une
            visite à l'autre (voir src/lib/disposition-grille.ts). */}
        <button
          type="button"
          onClick={() => {
            // ⚠️ NOTER AVANT DE BASCULER. En une colonne, une carte
            // occupe presque tout l'écran : la même position de
            // défilement ne montre plus du tout le même tatoueur. On
            // retient donc la carte qu'on regarde, et la grille la
            // remet sous les yeux une fois la nouvelle disposition
            // peinte (voir src/lib/carte-du-haut.ts).
            noterLaCarteDuHaut();
            basculerDisposition();
          }}
          aria-label={
            disposition === "deux"
              ? "Afficher une image par ligne"
              : "Afficher deux colonnes"
          }
          className="shrink-0 w-[52px] h-[52px] rounded-full border
                     border-sombre-bordure bg-sombre-eleve text-sombre-texte
                     flex items-center justify-center active:opacity-80
                     transition-opacity"
        >
          {disposition === "deux" ? (
            <IconeUneColonne taille={21} />
          ) : (
            <IconeDeuxColonnes taille={21} />
          )}
        </button>
      </div>

      {pageOuverte && (
        <PageRechercheMobile
          vue={vuePage}
          surVue={poserVueRecherche}
          filtresEteints={enFenetre.exclure.length}
          onValider={validerLaPage}
          onAbandonner={abandonnerLaPage}
          onEffacer={effacerLaVue}
        >
          {vuePage === "recherche" ? (
            <>
              {/* 1. LE STYLE — le menu déroulant seul : son fantôme
                  (« Explorer ») dit déjà tout, aucun titre.
                  IL NE DIT PLUS RIEN À PERSONNE en s'ouvrant : il n'y a
                  plus de fenêtre à lever. Son panneau s'ouvre en
                  coordonnées d'écran, comme sur le web, et la page ne
                  bouge pas dessous. */}
              <div>
                <MenuDeroulant
                  valeur={valeurExplorer(enFenetre.nature, enFenetre.style)}
                  surChangement={(valeur) =>
                    choisirDansExplorer(valeur, poserDansLeBrouillon)
                  }
                  options={options}
                  ariaLabel="Explorer"
                  placeholder="Explorer"
                  hauteur="min-h-[54px]"
                  taillePolice="text-[16px]"
                  sombre
                  repliable
                />
              </div>

              {/* 2. LA LOCALITÉ — dessous, sans titre non plus : son
                  fantôme (« Où ? ») parle pour elle. */}
              <div>
                <ChampLocalisation
                  pourLeMoteur
                  // « EFFACER » REMONTE LE CHAMP À ZÉRO : sa clé change,
                  // le champ est reconstruit sur « aucun lieu ». Sans
                  // ça, il continuerait d'afficher « Lyon » alors que la
                  // recherche est redevenue mondiale.
                  key={`${id}-fenetre-lieu-${effacements}`}
                  id={`${id}-fenetre-lieu`}
                  etiquette={null}
                  texteIndicatif={TEXTES_TATOUAGE.ouLabel}
                  lieuInitial={enFenetre.lieu}
                  croixEffacement
                  viderSiAbandon
                  suffixeLieu={suffixeRayon(enFenetre)}
                  surChoix={(choisi) => poserDansLeBrouillon({ lieu: choisi })}
                  // ⚠️ LA LISTE EST DANS LE FLUX, ET C'EST TOUT L'INTÉRÊT
                  // DE LA REFONTE. Elle était posée dans <body> à des
                  // coordonnées d'écran parce qu'une fenêtre flottante ne
                  // pouvait pas la contenir sans changer de hauteur à
                  // chaque image du clavier. Dans une PAGE, elle est
                  // simplement le frère suivant du champ : le navigateur
                  // la place, l'allonge, et fait défiler le document pour
                  // la montrer. Aucune mesure, aucun repère à convertir.
                  // C'est exactement ce que fait déjà le FORMULAIRE.
                  panneauDansLeFlux
                  // ET LE CHAMP MONTE EN HAUT DE LA PAGE au premier
                  // toucher — par un défilement de DOCUMENT (scrollBy),
                  // le geste le plus ordinaire qui soit. Toute la hauteur
                  // libérée passe alors sous le champ : c'est ce qui
                  // garantit que la liste reste entière au-dessus des
                  // touches. Même mécanique que le formulaire.
                  remonterAuToucher
                />
              </div>

              {/* 3. LE RAYON — dessous, inactif sans point de départ. */}
              {curseurRayon(enFenetre, poserDansLeBrouillon)}
            </>
          ) : (
            /* LA VUE « FILTRES » : tous les groupes d'interrupteurs,
               tous allumés par défaut. Le PROFIL (ce qu'est la fiche)
               et OÙ IL TATOUE (ce que fait l'artiste) sont deux
               groupes distincts depuis la passe B — mélangés, ils
               s'annulaient. */
            listeInterrupteurs(enFenetre, poserDansLeBrouillon)
          )}
        </PageRechercheMobile>
      )}
    </div>
  );
}
