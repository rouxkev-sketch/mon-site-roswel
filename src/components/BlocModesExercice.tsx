"use client";

import { useState } from "react";
import {
  RAYONS_DEPLACEMENT,
  ROLES_STUDIO,
  type GenreMode,
  type NatureEtablissement,
  type RoleStudio,
} from "@/config/tatouage";
import { BasculeDeuxChoix } from "@/components/BasculeDeuxChoix";
import { ChampsPlageDates } from "@/components/CalendrierPlage";
import { DeuxZonesLieu, ZoneLieuSeule } from "@/components/DeuxZonesLieu";
import { IconeChevronBas, IconeCroix } from "@/components/Icones";
import type { FicheInscrite } from "@/components/RechercheFicheInscrite";
import { texteErreur } from "@/lib/erreurs-formulaire";
import {
  cleNeuve,
  modeVide,
  type ManqueBloc,
  type ModeEnSaisie,
} from "@/lib/modes-exercice";

/**
 * LES MODES D'ACTIVITÉ — LE SÉLECTEUR HORIZONTAL (passe nº 124)
 * ==============================================================
 * CE BLOC A ÉTÉ REPRIS UNE DEUXIÈME FOIS DEPUIS ZÉRO. La liste
 * verticale des quatre choix, le lien « + Ajouter un mode d'activité »
 * et les encadrés empilés ont DISPARU : on passe d'un mode à l'autre
 * par un SÉLECTEUR D'ONGLETS, et l'on ne voit qu'UN mode à la fois.
 *
 * LA COMPOSITION RETENUE (reprise à la passe nº 125)
 * --------------------------------------------------
 *   · QUATRE RECTANGLES — À domicile · En studio · En salon · Guest
 *     (deux lignes de deux sur téléphone depuis la passe nº 128, les
 *     libellés complets ne tenant pas à quatre sur 320 px) — sur la
 *     présentation exacte des rectangles du bloc des
 *     styles (« Noir et gris / Couleur ») : angles xl, rose pâle et
 *     texte rose quand c'est ouvert, fond un cran plus clair sinon.
 *     Ils se posent directement sous la glissière Artiste / Studio /
 *     Salon, sans titre au-dessus. Les onglets soulignés, le titre
 *     « MODE D'ACTIVITÉ » et le compteur « Studio · 2 » de la nº 124
 *     ont vécu.
 *   · OUVRIR UN ONGLET VIDE CRÉE UN ENCADRÉ VIERGE de ce genre, prêt
 *     à recevoir. Un encadré vierge N'EST PAS UNE DÉCLARATION : la
 *     validation l'ignore et l'enregistrement ne l'écrit jamais (voir
 *     `modeVide` dans lib/modes-exercice) — regarder un onglet ne
 *     coûte rien.
 *
 * PLUSIEURS LIEUX DU MÊME TYPE — LES VOLETS (passe nº 124)
 * --------------------------------------------------------
 *   · UN SEUL LIEU : ses champs s'affichent directement, sous un
 *     simple intertitre qui porte le nom du mode, SANS numéro —
 *     « En studio », « Guest » — et la croix du lieu.
 *   · DEUX LIEUX OU PLUS : chacun devient un VOLET REPLIABLE, titré
 *     « En studio 1/2 », « En studio 2/2 ». LA NUMÉROTATION COMPTE LES
 *     LIEUX DU MÊME TYPE, pas le total du formulaire. À droite, une
 *     flèche : vers le bas replié, vers le haut déplié — ROSE sur le
 *     volet ouvert. SEUL LE DERNIER VOLET CRÉÉ est ouvert ; cliquer
 *     un volet l'ouvre et referme l'autre (accordéon), recliquer le
 *     replie.
 *   · L'ANCIENNE LIGNE GUEST « Session 1 sur 2 » et sa croix ont
 *     DISPARU : le titre du volet porte l'information.
 *   · ON AJOUTE UN LIEU PAR LE BOUTON SOUS LES CHAMPS — « + Ajouter
 *     un studio / un salon / un domicile », et le Guest garde son
 *     « + Ajouter une autre date » — le motif capsule d'« Ajouter une
 *     autre date », inchangé.
 *
 * LA CROIX D'UN LIEU (règle resserrée à la passe nº 125)
 * ------------------------------------------------------
 * Elle N'EXISTE QU'À PARTIR DE DEUX LIEUX du même type, sur
 * l'en-tête du volet OUVERT — un lieu seul n'en a pas : il se
 * corrige champ par champ, il ne se supprime pas d'un geste. Elle
 * dit « Supprimer ce lieu », sa confirmation demande « Supprimer ? »
 * (Annuler / Supprimer), et elle ne s'interpose que si des
 * informations ont été saisies (`modeVide`) ; rien de saisi, on agit
 * directement. Le volet ouvert n'a PLUS de flèche : la croix prend
 * sa case de 36 px, la colonne de droite reste régulière.
 * ⚠️ L'ANCIENNE RÈGLE « Changer / Fermer ce mode d'activité »
 * (nº 117 → nº 121 → nº 122) est SUPPLANTÉE : revenir aux quatre
 * choix n'existe plus, le sélecteur est toujours là.
 *
 * ⚠️ EN BASE, RIEN NE CHANGE. Chaque session guest reste UNE LIGNE de
 * `modes_exercice` ; c'est la SAISIE qui les regroupe. L'expiration
 * automatique, l'affichage public et le retrait de l'équipe du studio
 * continuent de fonctionner session par session.
 */

/**
 * L'INTERTITRE DU BLOC 1 — le dessin des sous-titres de « Spécificités »
 * ======================================================================
 * ⚠️ UN SEUL DESSIN POUR LES DEUX (passe nº 117, points 1 et 2). Le
 * titre du sélecteur (« MODE D'ACTIVITÉ ») et celui d'un lieu
 * (« STUDIO », « STUDIO 1/2 »…) sont des INTERTITRES : ils annoncent
 * ce qui suit, sans être des titres de bloc. Ils reprennent donc, au
 * caractère près, la forme de « TECHNIQUES MAÎTRISÉES » — capitales
 * espacées, 14 px, demi-gras, gris doux (voir le h3 des familles de
 * filtres dans FormulaireFiche).
 */
const TITRE_INTERTITRE =
  "text-[14px] font-semibold uppercase tracking-[0.1em] text-sombre-texte-doux";

/** LES MOTS DU SÉLECTEUR ET DES VOLETS — LES LIBELLÉS COMPLETS,
    rétablis à la passe nº 128. La nº 124 les avait raccourcis
    (« Studio », « Domicile »…) pour tenir à quatre sur une ligne de
    320 px ; le propriétaire préfère les mots entiers, et ASSUME que
    la place manque : le sélecteur passe sur DEUX LIGNES de deux
    rectangles (voir plus bas). Les volets suivent — « En studio
    1/2 », « En studio 2/2 ». */
const LIBELLES_MODES: Record<GenreMode, string> = {
  prive: "En studio",
  salon: "En salon",
  domicile: "À domicile",
  guest: "Guest",
};

/** L'ORDRE DU SÉLECTEUR (passe nº 128), lu ligne par ligne :
        À domicile · En studio
        En salon   · Guest
    C'est un ordre d'AFFICHAGE : GENRES_MODE, qui sert aussi les
    fiches publiques, ne bouge pas — et les slugs jamais. */
const ORDRE_SELECTEUR: GenreMode[] = ["domicile", "prive", "salon", "guest"];

/** Le mot du bouton d'ajout — « + Ajouter un studio », etc. Le Guest
    n'y figure pas : il garde « + Ajouter une autre date ». */
const MOTS_AJOUT: Record<Exclude<GenreMode, "guest">, string> = {
  prive: "un studio",
  salon: "un salon",
  domicile: "un domicile",
};

/** Les deux modes qui n'ont PAS de studio à chercher : on ne devient
    pas résident de chez soi, et un studio privé n'a pas de page. */
function sansStudioInscrit(genre: GenreMode | ""): boolean {
  //  ⚠️ SEUL « À DOMICILE » N'A PAS DE FICHE À CHERCHER. Le studio
  //  privé, lui, peut parfaitement être inscrit sur YokoFolio : le
  //  priver de la recherche obligeait à retaper une adresse qui
  //  existe déjà. Il suit donc la même structure que « En salon ».
  return genre === "domicile";
}

/** Un mode neuf — sans genre : c'est le sélecteur qui pose la
    question, et un formulaire vierge n'a encore aucun onglet actif. */
export function modeNeuf(): ModeEnSaisie {
  return {
    cle: cleNeuve("mode"),
    genre: "",
    role: null,
    source: "inscrit",
    salon: null,
    lieu: null,
    debut_le: "",
    fin_le: "",
  };
}

/** UN ENCADRÉ VIERGE D'UN GENRE DONNÉ — ce que crée l'ouverture d'un
    onglet, ou l'effacement du dernier lieu d'un genre. Les bascules
    sont posées sur leur première position (le rôle, la nature du
    lieu) : une bascule a deux positions, jamais trois, et « rien de
    choisi » n'en est pas une. `cle` et `id` peuvent être repris d'un
    encadré existant : on remplace son contenu, on ne le détruit pas —
    c'est ce qui préserve les liaisons déjà validées. */
function modeVierge(
  genre: GenreMode,
  cle?: string,
  id?: string | null
): ModeEnSaisie {
  const base = modeNeuf();
  return {
    ...base,
    cle: cle ?? base.cle,
    ...(id !== undefined ? { id } : {}),
    genre,
    //  LE RÔLE concerne les deux lieux qui ont une équipe : le salon
    //  et le studio privé.
    role: genre === "salon" || genre === "prive" ? "fondateur" : null,
    //  LA NATURE DU LIEU ne concerne qu'un guest. « Studio » d'abord
    //  depuis la passe nº 128 (l'ordre de la bascule s'est inversé) —
    //  et une bascule s'ouvre sur sa PREMIÈRE position, jamais sur la
    //  seconde : un guest neuf part donc sur « Studio ».
    natureLieu: genre === "guest" ? "prive" : null,
    rayonKm: null,
    source: sansStudioInscrit(genre) ? "manuel" : "inscrit",
  };
}

/** La fiche inscrite d'un mode, dans la forme qu'attend la recherche. */
function ficheDuMode(mode: ModeEnSaisie): FicheInscrite | null {
  if (!mode.salon) return null;
  return {
    id: mode.salon.id,
    nom: mode.salon.nom,
    slug: mode.salon.slug,
    ville_nom: mode.salon.ville ?? null,
    photo_profil: mode.salon.photo,
  };
}

/** ⚠️ PLUS DE `<input type="date">` ICI (passe nº 116) : les dates
    guest passent par le calendrier dessiné (voir CalendrierPlage) —
    les deux champs tiennent côte à côte à toutes les largeurs, et le
    calendrier du navigateur, daté, a disparu avec ses débordements. */

export function BlocModesExercice({
  modes,
  surChangement,
  surMobile,
  enErreur,
  manque,
}: {
  modes: ModeEnSaisie[];
  surChangement: (modes: ModeEnSaisie[]) => void;
  /** Vrai mobile : le champ de localisation remonte et ouvre ses
      suggestions dans le flux (voir ChampLocalisation). */
  surMobile: boolean;
  enErreur?: string | null;
  /** CE QUI MANQUE, quand la personne a essayé de confirmer. Null
      tant qu'elle n'a rien tenté : on n'allume pas des champs rouges
      sur un formulaire qu'on vient d'ouvrir. */
  manque?: ManqueBloc | null;
}) {
  /** L'ONGLET REGARDÉ — au retour sur une fiche existante, celui du
      premier mode déclaré. Null sur un formulaire vierge : aucun
      segment rose ne préjuge d'une réponse (règle nº 104). */
  const [genreActif, setGenreActif] = useState<GenreMode | null>(
    () => (modes.find((mode) => mode.genre)?.genre || null) as GenreMode | null
  );
  /** LE VOLET OUVERT — null vaut « le dernier du genre affiché »
      (c'est le dernier créé), « aucun » vaut « tous repliés » (on a
      recliqué le volet ouvert). Une clé périmée retombe d'elle-même
      sur le dernier : voir `cleDuVoletOuvert`. */
  const [voletOuvert, setVoletOuvert] = useState<string | null>(null);
  /** Le lieu dont la croix a été cliquée — son contenu laisse alors
      place à la ligne de confirmation. */
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  /** LE MANQUE AMÈNE À L'ENDROIT EN CAUSE : si « Je confirme »
      désigne un mode d'un AUTRE onglet (ou d'un volet replié), on
      bascule dessus — un champ rouge que personne ne voit ne désigne
      rien. ⚠️ AJUSTÉ PENDANT LE RENDU, PAS DANS UN EFFET (le motif
      « adjusting state when props change » de React, le même que
      FournisseurStyles) : React relance aussitôt le rendu avec le bon
      onglet, sans peindre l'ancien. La signature mémorisée fait que
      le MÊME manque ne force la vue qu'une fois — la personne reste
      libre d'aller regarder ailleurs ensuite. */
  const [manqueTraite, setManqueTraite] = useState<string | null>(null);
  const signatureManque = manque ? `${manque.cle ?? ""}|${manque.champ}` : null;
  if (signatureManque !== manqueTraite) {
    setManqueTraite(signatureManque);
    if (manque?.cle) {
      const vise = modes.find((mode) => mode.cle === manque.cle);
      if (vise?.genre) {
        setGenreActif(vise.genre);
        setVoletOuvert(vise.cle);
      }
    }
  }

  /** L'ONGLET AFFICHÉ, défendu contre un état périmé : si le genre
      retenu n'a plus d'encadré (le bloc a été vidé de l'extérieur),
      on retombe sur le premier genre encore présent — ou sur rien. */
  const genreAffiche: GenreMode | null =
    genreActif && modes.some((mode) => mode.genre === genreActif)
      ? genreActif
      : ((modes.find((mode) => mode.genre)?.genre || null) as
          | GenreMode
          | null);

  const sessionsAffichees = genreAffiche
    ? modes.filter((mode) => mode.genre === genreAffiche)
    : [];

  function cleDuVoletOuvert(sessions: ModeEnSaisie[]): string | null {
    if (voletOuvert === "aucun") return null;
    if (voletOuvert && sessions.some((s) => s.cle === voletOuvert)) {
      return voletOuvert;
    }
    return sessions[sessions.length - 1]?.cle ?? null;
  }

  function manquant(cle: string, champ: ManqueBloc["champ"]): boolean {
    return Boolean(manque && manque.cle === cle && manque.champ === champ);
  }

  function modifier(cle: string, morceau: Partial<ModeEnSaisie>) {
    surChangement(
      modes.map((mode) => (mode.cle === cle ? { ...mode, ...morceau } : mode))
    );
  }

  /** OUVRIR UN ONGLET. S'il n'a encore aucun encadré, on lui en donne
      un : d'abord en RECYCLANT l'encadré sans genre du formulaire
      vierge (même clé, même identifiant), sinon en en créant un. */
  function choisirOnglet(cle: string) {
    const genre = cle as GenreMode;
    setASupprimer(null);
    setGenreActif(genre);
    setVoletOuvert(null);
    if (modes.some((mode) => mode.genre === genre)) return;
    const libre = modes.find((mode) => !mode.genre);
    if (libre) {
      surChangement(
        modes.map((mode) =>
          mode.cle === libre.cle
            ? modeVierge(genre, libre.cle, libre.id)
            : mode
        )
      );
      return;
    }
    surChangement([...modes, modeVierge(genre)]);
  }

  /** UN LIEU DE PLUS dans l'onglet courant. Il se glisse juste après
      le dernier lieu du même genre : l'ordre écrit en base suit alors
      exactement celui de l'écran. Le volet du nouveau venu s'ouvre —
      c'est le dernier créé — et les autres se replient. */
  function ajouterUnLieu(genre: GenreMode) {
    const suivants = [...modes];
    let derniere = -1;
    for (let rang = 0; rang < suivants.length; rang++) {
      if (suivants[rang].genre === genre) derniere = rang;
    }
    const neuf = modeVierge(genre);
    suivants.splice(derniere + 1, 0, neuf);
    setASupprimer(null);
    setVoletOuvert(neuf.cle);
    surChangement(suivants);
  }

  /**
   * LA CROIX D'UN LIEU — ce qu'elle fait dépend de ce qu'il y a
   * autour, comme à la passe nº 122 :
   *   · SEUL LIEU DE SON GENRE → on EFFACE la saisie. L'encadré
   *     reste, vierge (même clé, même identifiant en base : on
   *     remplace son contenu, on ne le détruit pas), l'onglet perd
   *     son compte, la question reste posée.
   *   · PLUSIEURS LIEUX → on FERME CELUI-LÀ, et lui seul ; le volet
   *     du dernier restant s'ouvre.
   * LA PAGE SE RÉAJUSTE au retrait : en fermant un volet, le document
   * raccourcit ; si l'on était en bas, on ramène la fenêtre en
   * douceur à la position la plus basse encore valable.
   */
  function fermerCeLieu(cle: string) {
    const vise = modes.find((mode) => mode.cle === cle);
    if (!vise || !vise.genre) return;
    const genre = vise.genre as GenreMode;
    const autres = modes.filter(
      (mode) => mode.genre === genre && mode.cle !== cle
    );
    setASupprimer(null);
    if (autres.length === 0) {
      surChangement(
        modes.map((mode) =>
          mode.cle === cle ? modeVierge(genre, mode.cle, mode.id) : mode
        )
      );
      return;
    }
    setVoletOuvert(autres[autres.length - 1].cle);
    surChangement(modes.filter((mode) => mode.cle !== cle));
    window.requestAnimationFrame(() => {
      const basMaximal = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      if (window.scrollY > basMaximal) {
        window.scrollTo({ top: basMaximal, behavior: "smooth" });
      }
    });
  }

  /* ----------------------------------------------------------------
     LES MORCEAUX — écrits une seule fois, posés aussi bien dans un
     lieu seul que dans chaque volet.
     ---------------------------------------------------------------- */

  /** LE RÔLE, sur une bascule.
      ⚠️ IL CONCERNE LES DEUX LIEUX QUI ONT UNE ÉQUIPE : le salon ET le
      studio privé (passe nº 100). Un studio privé se tient souvent à
      deux ou trois ; ne pas lui poser la question revenait à décider
      pour lui.
      ⚠️ CÔTÉ BASE, cela demande la migration nº 44 : la contrainte
      `modes_exercice_role_coherent` INTERDISAIT un rôle hors du genre
      « salon ». Elle l'AUTORISE désormais pour « prive » — sans
      l'exiger, pour que les lignes déjà enregistrées restent valables. */
  function leRole(mode: ModeEnSaisie) {
    if (mode.genre !== "salon" && mode.genre !== "prive") return null;
    //  LE MOT SUIT LE LIEU : « Fondateur du salon » pour un salon,
    //  « Fondateur du studio » pour un studio privé. « Artiste
    //  résident » ne change pas — un résident est un résident.
    const fondateur =
      mode.genre === "prive" ? "Fondateur du studio" : "Fondateur du salon";
    return (
      <div className="opacity-100 transition-opacity duration-200 starting:opacity-0">
        <BasculeDeuxChoix
          etiquette="Ton rôle dans ce lieu"
          choix={[
            { slug: ROLES_STUDIO[0].slug as RoleStudio, label: fondateur },
            { slug: ROLES_STUDIO[1].slug as RoleStudio, label: "Artiste résident" },
          ]}
          valeur={(mode.role ?? ROLES_STUDIO[0].slug) as RoleStudio}
          surChoix={(role) => modifier(mode.cle, { role })}
        />
      </div>
    );
  }

  /** LA LOCALISATION : deux zones, ou une seule. */
  /**
   * LE RAYON DE DÉPLACEMENT — SEULEMENT AUTOUR D'UNE VILLE.
   * ⚠️ MÊME RÈGLE QUE LE MOTEUR DE RECHERCHE : un rayon n'a de sens
   * qu'autour d'un POINT. Autour d'une région ou d'un pays, il ne veut
   * rien dire — « 50 km autour de la France » n'est pas une
   * information. Le sélecteur ne s'affiche donc que si le lieu choisi
   * est une ville (ou une adresse).
   * ⚠️ ET IL EST OBLIGATOIRE (passe nº 124) : tant qu'aucun rayon
   * n'est choisi, « Je confirme mon choix » ne valide pas (voir
   * `rayonRequis` dans lib/modes-exercice), et après la tentative les
   * badges S'ENCADRENT DE ROUGE — la seule exception aux « plus aucun
   * contour » de la charte. Le rouge s'éteint au premier rayon choisi
   * (le geste efface la tentative, comme partout).
   */
  function leRayon(mode: ModeEnSaisie) {
    const precision = mode.lieu?.precision;
    if (precision !== "ville" && precision !== "adresse") return null;
    //  ⚠️ LE TITRE NOMME LA VILLE (passe nº 100) : « Rayon autour de
    //  Lyon », et non plus « Jusqu'où te déplaces-tu ? ». Le rayon
    //  n'a de sens qu'AUTOUR D'UN POINT ; l'écrire fait relire le
    //  point choisi au moment même où l'on en fixe la portée.
    //  LE NOM VIENT DU LIEU RETENU, dans cet ordre : sa ville, sinon
    //  son intitulé (une adresse choisie n'a pas toujours de `ville`).
    const ville = mode.lieu?.ville || mode.lieu?.intitule || "";
    const enFaute = manquant(mode.cle, "rayon");
    return (
      //  ⚠️ LE TITRE RESPIRE (passe nº 117, point 4) : « Rayon autour
      //  de Marseille » était pris en étau entre le champ d'adresse
      //  au-dessus et sa rangée de distances en dessous. 20 px de
      //  chaque côté — l'air d'un intertitre, pas d'une légende.
      <div className="mt-5">
        <p className="mb-3 text-[13px] font-semibold text-sombre-texte">
          {ville ? `Rayon autour de ${ville}` : "Rayon de déplacement"}
        </p>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {RAYONS_DEPLACEMENT.map((rayon) => {
            const actif = mode.rayonKm === rayon;
            return (
              <button
                key={rayon}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => modifier(mode.cle, { rayonKm: rayon })}
                //  ⚠️ PLUS DE CONTOUR (passe nº 112) : fond un cran
                //  plus clair, rose pâle quand le rayon est choisi.
                //  La bordure n'existe que transparente — sauf le
                //  ROUGE DU MANQUE (nº 124), qui encadre les badges
                //  sans faire bouger la rangée d'un pixel.
                className={`inline-flex items-center rounded-full border px-4
                           min-h-[40px] text-[13.5px] font-semibold
                           transition-colors ${
                             actif
                               ? "border-transparent bg-primaire/15 text-primaire"
                               : enFaute
                                 ? "border-erreur bg-sombre-eleve text-sombre-texte-doux hover:text-sombre-texte"
                                 : "border-transparent bg-sombre-eleve text-sombre-texte-doux hover:text-sombre-texte"
                           }`}
              >
                {rayon} km
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function leLieu(mode: ModeEnSaisie) {
    const enFaute = manquant(mode.cle, "lieu");
    if (sansStudioInscrit(mode.genre)) {
      return (
        <ZoneLieuSeule
          prefixe={`mode-${mode.cle}`}
          //  ⚠️ PLUS DE TITRE : la question est passée DANS le champ
          //  (passe nº 100). Un titre et un fantôme qui disent la même
          //  chose à deux centimètres l'un de l'autre, c'est une ligne
          //  de trop dans un formulaire déjà long.
          indication="Où te déplaces-tu ?"
          lieu={mode.lieu}
          surLieu={(lieu) =>
            //  CHANGER DE LIEU REMET LE RAYON À ZÉRO : un rayon de
            //  100 km autour d'une ville n'a aucun sens autour d'une
            //  autre, et le garder ferait passer une valeur qu'on n'a
            //  jamais choisie pour celle-là.
            modifier(mode.cle, { lieu, rayonKm: null })
          }
          surMobile={surMobile}
          enErreur={enFaute}
          souscrit={leRayon(mode)}
        />
      );
    }
    // GUEST : ce n'est pas « mon » studio, c'est celui qui m'accueille.
    const guest = mode.genre === "guest";

    //  LE MOT SUIT LE LIEU, dans les deux cas : le genre du mode pour
    //  « en studio privé », la nature choisie pour un guest.
    const prive = mode.genre === "prive" || (guest && mode.natureLieu === "prive");

    //  ⚠️ LA QUESTION, ÉCRITE EN TOUTES LETTRES ET UNE SEULE FOIS.
    //  Elle remplace les SIX sous-titres d'avant (« Mon salon est sur
    //  le site », « Je ne trouve pas mon salon », et les quatre
    //  variantes du guest). Ces six-là annonçaient chacun leur champ ;
    //  celle-ci pose la vraie question, et les deux champs y répondent.
    //  « Ton studio » et non « Ton studio privé » (passe nº 105) : le
    //  mode s'appelle « Studio », comme la position « Studio » de
    //  la glissière du bloc 1 — la question parle la même langue.
    const question = prive
      ? "Ton studio est-il sur YokoFolio ?"
      : "Ton salon est-il sur YokoFolio ?";

    return (
      <div>
        {guest && (
          //  ⚠️ LA NATURE DU LIEU EST PASSÉE SUR UNE BASCULE, ET RIEN
          //  N'ATTEND PLUS DERRIÈRE ELLE (passe nº 100).
          //  Avant : deux pastilles à cocher, et TANT QU'AUCUNE n'était
          //  cochée, les deux champs et les dates n'existaient pas.
          //  Un écran qui se dévoile par paliers oblige à deviner ce
          //  qu'il reste à faire — et ici, il cachait l'essentiel du
          //  mode derrière une question de vocabulaire.
          //  Maintenant : la bascule ouvre sur « Salon », tout est là
          //  dès la première seconde, et changer d'avis ne fait que
          //  changer le CONTEXTE (le mot des titres, la recherche
          //  ciblée) — jamais apparaître ou disparaître quoi que ce
          //  soit.
          <div className="mb-4">
            {/* ⚠️ « STUDIO » D'ABORD, « SALON » ENSUITE (passe
                nº 128), et « Studio privé » se dit « Studio » — le
                mot de la glissière du bloc 1 et du sélecteur des
                modes : la bascule parle la même langue qu'eux. Les
                libellés sont posés ICI, pas dans
                NATURES_ETABLISSEMENT : la config sert aussi le
                bloc 1 et les fiches publiques, où « Studio privé »
                qualifie le LIEU et garde tout son sens. */}
            <BasculeDeuxChoix
              etiquette="La nature du lieu qui t'accueille"
              choix={[
                { slug: "prive" as NatureEtablissement, label: "Studio" },
                { slug: "salon" as NatureEtablissement, label: "Salon" },
              ]}
              valeur={(mode.natureLieu ?? "salon") as NatureEtablissement}
              surChoix={(natureLieu) =>
                //  BASCULER LÂCHE LE LIEU DÉJÀ DÉSIGNÉ : un salon retenu
                //  n'a rien à faire sous « studio privé ».
                modifier(mode.cle, { natureLieu, salon: null, lieu: null })
              }
            />
          </div>
        )}
        <DeuxZonesLieu
          prefixe={`mode-${mode.cle}`}
          titre={question}
          //  ⚠️ CHAQUE MODE CHERCHE CE QU'IL DÉCLARE (passe nº 121).
          //  Les trois recherches interrogeaient la même liste — TOUS
          //  les lieux — parce que `type_fiche = 'salon'` désigne
          //  aussi bien un salon qu'un studio privé. « Studio »
          //  proposait donc des salons, et « Salon » des studios.
          //  La nature (`etablissement`) tranche : elle vaut « prive »
          //  pour un studio, « salon » pour un salon, et RIEN pour un
          //  guest — celui-là est accueilli par les deux.
          etablissement={
            guest ? undefined : mode.genre === "prive" ? "prive" : "salon"
          }
          messageVide={
            guest
              ? "Aucun studio / salon trouvé"
              : mode.genre === "prive"
                ? "Aucun studio trouvé"
                : "Aucun salon trouvé"
          }
          //  LES DEUX CHAMPS SE PRÉSENTENT SEULS : ce qu'ils attendent
          //  est écrit DEDANS, plus au-dessus.
          indicationInscrit="Recherche"
          indicationManuel="Ajouter l'adresse"
          ficheChoisie={ficheDuMode(mode)}
          surFiche={(fiche) =>
            modifier(
              mode.cle,
              fiche
                ? {
                    // ⚠️ ON RECOPIE AUSSI SON ADRESSE ET SES COORDONNÉES :
                    // sans elles, le mode n'a AUCUN point, la fiche ne
                    // peut pas être placée sur la carte, et « Je
                    // confirme » reste éteint pour toujours. Ces valeurs
                    // sont publiques — elles figurent déjà sur la page
                    // du studio.
                    salon: {
                      id: fiche.id,
                      nom: fiche.nom,
                      slug: fiche.slug,
                      photo: fiche.photo_profil,
                      adresse: fiche.adresse ?? null,
                      code_postal: fiche.code_postal ?? null,
                      ville: fiche.ville_nom,
                      region: fiche.region ?? null,
                      pays: fiche.pays ?? null,
                      code_pays: fiche.code_pays ?? null,
                      latitude: fiche.latitude ?? null,
                      longitude: fiche.longitude ?? null,
                      lieu_id: fiche.lieu_id ?? null,
                    },
                    //  ⚠️ ET ON LÂCHE L'ADRESSE MANUELLE DANS LA MÊME
                    //  ÉCRITURE (passe nº 105) : une seule réponse en
                    //  mémoire. Elle n'est pas perdue pour autant —
                    //  DeuxZonesLieu l'a mise de côté et la restituera
                    //  si l'établissement est retiré. Deux écritures
                    //  séparées se perdaient (React groupe les états :
                    //  la seconde, calculée sur l'état d'avant,
                    //  écrasait la première).
                    lieu: null,
                  }
                : { salon: null }
            )
          }
          lieu={mode.lieu}
          surLieu={(lieu) =>
            //  ⚠️ POSER UN LIEU LÂCHE LE SALON dans la même écriture —
            //  même raison que ci-dessus. C'est aussi le chemin de la
            //  restitution : quand la croix retire l'établissement,
            //  DeuxZonesLieu rend l'adresse mise de côté par ici.
            modifier(mode.cle, { lieu, salon: null })
          }
          surMobile={surMobile}
          enErreur={enFaute}
        />
      </div>
    );
  }

  /** LES DATES, sessions guest seulement.
      ⚠️ REFAITES DE FOND EN COMBLE (passe nº 116, point 6) : le
      calendrier natif du navigateur — daté, et responsable des
      débordements et de l'empilement sur smartphone — est remplacé
      par le calendrier dessiné de CalendrierPlage. Les deux champs
      « Du » et « Au » tiennent CÔTE À CÔTE à toutes les largeurs.
      ⚠️ LES MANQUES (point 2) : après « Je confirme », chaque champ
      de date VIDE s'encadre de rouge — les deux quand les deux
      manquent, sans un mot. Un champ déjà rempli n'est jamais accusé
      (règle nº 111), sauf quand la plage est À L'ENVERS : là, les
      deux bornes fautives s'allument, et la phrase qui l'explique
      reste (elle apprend quelque chose — voir plus bas). */
  function lesDates(mode: ModeEnSaisie) {
    const champManque =
      manque && manque.cle === mode.cle ? manque.champ : null;
    const vise = champManque === "dates" || champManque === "lieu";
    const desordre = Boolean(
      mode.debut_le && mode.fin_le && mode.fin_le < mode.debut_le
    );
    return (
      <ChampsPlageDates
        prefixe={`mode-${mode.cle}`}
        debut={mode.debut_le}
        fin={mode.fin_le}
        surChangement={(debut_le, fin_le) =>
          modifier(mode.cle, { debut_le, fin_le })
        }
        enFauteDebut={vise && (!mode.debut_le || desordre)}
        enFauteFin={vise && (!mode.fin_le || desordre)}
      />
    );
  }

  /** LES CHAMPS D'UN LIEU — le rôle puis la localisation, ou la
      localisation puis les dates pour une session guest. */
  function lesChamps(session: ModeEnSaisie) {
    const guest = session.genre === "guest";
    return (
      <div className="flex flex-col gap-5">
        {!guest && leRole(session)}
        {leLieu(session)}
        {guest && lesDates(session)}
      </div>
    );
  }

  /** LA LIGNE DE CONFIRMATION — elle remplace les champs du lieu que
      la croix vise, quand du travail se perdrait.
      ⚠️ UN SEUL MOT DEPUIS LA PASSE Nº 125 : « Supprimer ? », pour
      les quatre modes — le même vocabulaire que la fenêtre d'une
      photo (nº 122). « Fermer » laissait croire qu'on repliait le
      volet, alors qu'on retire bel et bien le lieu. */
  function laConfirmation(session: ModeEnSaisie) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14.5px] font-semibold text-sombre-texte">
          Supprimer ?
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setASupprimer(null)}
            //  ⚠️ RÈGLE DES BOUTONS (passe nº 104) : annuler est une
            //  action de retrait — TEXTE BRUT, jamais de capsule.
            className="px-2 min-h-[38px] text-[13.5px] font-semibold
                       text-sombre-texte-doux transition-colors
                       hover:text-sombre-texte"
          >
            Annuler
          </button>
          <button
            type="button"
            //  ⚠️ LA CONFIRMATION FAIT CE QUE LA CROIX AURAIT FAIT :
            //  `fermerCeLieu` est le MÊME point de décision — une
            //  confirmation ne peut pas aboutir ailleurs que le geste
            //  qui l'a ouverte.
            onClick={() => fermerCeLieu(session.cle)}
            //  Action négative — texte nu, le rouge porte seul la
            //  gravité (règle nº 104). Le mot répond à la question
            //  posée juste à gauche.
            className="px-2 min-h-[38px] text-[13.5px] font-semibold
                       text-erreur transition-colors hover:opacity-75"
          >
            Supprimer
          </button>
        </div>
      </div>
    );
  }

  /** LA CROIX D'UN LIEU — confirmation seulement si du travail se
      perdrait (`modeVide`) ; rien de saisi, on agit directement.
      ⚠️ ELLE NE VIT PLUS QUE SUR LES VOLETS (passe nº 125) : un lieu
      SEUL de son type n'a plus de croix — elle n'apparaît qu'à
      partir de deux. Et elle dit « Supprimer ce lieu », le mot de sa
      confirmation, pour les quatre modes. */
  function laCroix(session: ModeEnSaisie) {
    const libelle = "Supprimer ce lieu";
    return (
      <button
        type="button"
        onClick={() =>
          modeVide(session)
            ? fermerCeLieu(session.cle)
            : setASupprimer(session.cle)
        }
        aria-label={libelle}
        title={libelle}
        //  `hover:bg-sombre-eleve` : le fond de survol doit se voir
        //  sur l'encadré (bg-sombre-carte) — un fond bg-sombre-carte
        //  s'y fondrait.
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                   text-sombre-texte-doux transition-colors
                   hover:bg-sombre-eleve hover:text-primaire
                   active:bg-sombre-eleve active:text-primaire"
      >
        <IconeCroix taille={15} />
      </button>
    );
  }

  const messageDuManque = manque?.message ?? null;
  const viseParLeManque = sessionsAffichees.some(
    (session) => session.cle === manque?.cle
  );
  const nombre = sessionsAffichees.length;
  const ouverte = cleDuVoletOuvert(sessionsAffichees);

  return (
    <div>
      {/* LE SÉLECTEUR — QUATRE RECTANGLES (passe nº 125).
          ⚠️ FINI LES ONGLETS SOULIGNÉS DE LA Nº 124, fini le titre
          « MODE D'ACTIVITÉ », fini le compteur : les quatre modes
          reprennent EXACTEMENT la présentation des rectangles du bloc
          des styles (« Noir et gris / Couleur ») — mêmes angles
          (rounded-xl), même remplissage vertical (py-2.5), même
          couple de couleurs (rose pâle + texte rose quand c'est
          ouvert, fond un cran plus clair sinon), et ils se posent
          directement sous la glissière Artiste / Studio / Salon.
          SEULE ADAPTATION : le mot est CENTRÉ (une seule ligne par
          rectangle, là où le modèle en a deux alignées à gauche).
          ⚠️ DEUX LIGNES DE DEUX SUR TÉLÉPHONE (passe nº 128) : les
          libellés complets (« À domicile », « En studio ») ne
          tiennent pas à quatre sur 320 px, et c'est assumé —
          À domicile · En studio, puis En salon · Guest. Dès `sm`, la
          place revient : les quatre rectangles reprennent leur ligne.
          UN MANQUE DE CHOIX : les quatre mots rougissent — rien
          d'autre (règle nº 111).
          L'ARIA NE BOUGE PAS : radiogroup + radio/aria-checked, les
          mêmes lecteurs d'écran et les mêmes sondes y retrouvent la
          même chose. */}
      <div
        role="radiogroup"
        aria-label="Le mode d'activité"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {ORDRE_SELECTEUR.map((genre) => {
          const actif = genreAffiche === genre;
          const enFauteGenre = Boolean(
            manque && manque.cle === null && manque.champ === "genre"
          );
          return (
            <button
              key={genre}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => choisirOnglet(genre)}
              className={`rounded-xl px-1 py-2.5 text-center transition-colors ${
                actif
                  ? "bg-primaire/15"
                  : "bg-sombre-eleve hover:bg-primaire/10 active:bg-primaire/10"
              }`}
            >
              {/* Plus de police réduite sous 360 px (nº 124) : à deux
                  rectangles par ligne, « À domicile » a toute sa place
                  même à 320 px. */}
              <span
                className={`block text-[14px] font-semibold ${
                  actif
                    ? "text-primaire"
                    : enFauteGenre
                      ? "text-erreur"
                      : "text-sombre-texte"
                }`}
              >
                {LIBELLES_MODES[genre]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------- LE PANNEAU DE L'ONGLET ---------- */}
      {genreAffiche && (
        <div
          //  La clé fait renaître le panneau à chaque changement
          //  d'onglet : le fondu d'entrée dit « autre contenu ».
          key={genreAffiche}
          //  `mt-3` : le même écart que la galerie sous les
          //  rectangles du bloc des styles (nº 125).
          className="mt-3 opacity-100 transition-opacity duration-200 starting:opacity-0"
        >
          {nombre <= 1 ? (
            /* ---------- UN SEUL LIEU : les champs, directement.
                L'intertitre porte le nom du mode SANS numéro (« seul
                de son type ») — et SANS CROIX (passe nº 125) : elle
                n'apparaît qu'à partir de deux lieux, sur les volets.
                Un lieu unique se corrige champ par champ (la croix du
                champ de localité, le retrait de l'établissement). */
            sessionsAffichees.map((session) => (
              <div key={session.cle}>
                <div className="flex min-h-[36px] items-center">
                  <span className={TITRE_INTERTITRE}>
                    {LIBELLES_MODES[genreAffiche]}
                  </span>
                </div>
                <div className="mt-3">{lesChamps(session)}</div>
              </div>
            ))
          ) : (
            /* ---------- PLUSIEURS LIEUX : L'ACCORDÉON DE VOLETS.
                Un filet fin sépare les volets — aligné sur le texte,
                comme tous les filets internes d'un bloc (règle
                nº 120). Le titre numérote PAR TYPE (« Studio 1/2 »).
                ⚠️ LE VOLET OUVERT N'A PLUS DE FLÈCHE (passe nº 125) :
                son contenu déplié dit déjà qu'il est ouvert — la
                flèche rose n'apportait rien. À sa place, LA CROIX du
                lieu, posée dans la MÊME CASE de 36 px que les
                chevrons des volets repliés : la colonne de droite
                reste régulière. `aria-expanded` porte l'état pour les
                lecteurs d'écran. ---------- */
            <ul className="flex flex-col">
              {sessionsAffichees.map((session, position) => {
                const deplie = ouverte === session.cle;
                return (
                  <li
                    key={session.cle}
                    className={
                      position > 0
                        ? "border-t border-sombre-bordure"
                        : ""
                    }
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-expanded={deplie}
                        onClick={() => {
                          setASupprimer(null);
                          setVoletOuvert(deplie ? "aucun" : session.cle);
                        }}
                        className="group flex min-h-[52px] min-w-0 flex-1 items-center
                                   justify-between gap-3 text-left"
                      >
                        <span
                          className={`text-[14px] font-semibold uppercase
                                     tracking-[0.1em] transition-colors ${
                                       deplie
                                         ? "text-sombre-texte"
                                         : "text-sombre-texte-doux group-hover:text-sombre-texte"
                                     }`}
                        >
                          {LIBELLES_MODES[genreAffiche]} {position + 1}/
                          {nombre}
                        </span>
                        {/* LA FLÈCHE, sur les volets REPLIÉS seulement
                            (nº 125) — dans une case de 36 px : c'est
                            elle qui cale la colonne de droite, croix
                            comprise. */}
                        {!deplie && (
                          <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center"
                          >
                            <IconeChevronBas
                              taille={18}
                              classe="text-sombre-texte-doux transition-colors
                                     group-hover:text-sombre-texte"
                            />
                          </span>
                        )}
                      </button>
                      {deplie && laCroix(session)}
                    </div>
                    {deplie && (
                      <div
                        className="pb-6 pt-1 opacity-100 transition-opacity
                                   duration-200 starting:opacity-0"
                      >
                        {aSupprimer === session.cle
                          ? laConfirmation(session)
                          : lesChamps(session)}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* ---------- UN LIEU DE PLUS — le motif capsule
              d'« Ajouter une autre date », étendu aux trois autres
              modes (passe nº 124). Le Guest garde son libellé. */}
          <button
            type="button"
            onClick={() => ajouterUnLieu(genreAffiche)}
            className="mt-5 w-fit rounded-full bg-sombre-eleve px-4 min-h-[40px]
                       text-[13.5px] font-semibold text-sombre-texte-doux
                       transition-colors hover:bg-primaire/15 hover:text-primaire
                       active:bg-primaire/15 active:text-primaire"
          >
            {genreAffiche === "guest"
              ? "+ Ajouter une autre date"
              : `+ Ajouter ${MOTS_AJOUT[genreAffiche]}`}
          </button>
        </div>
      )}

      {/* CE QUI MANQUE — PLUS AUCUNE PHRASE, OU PRESQUE (passe
          nº 116, point 2). Le lieu manquant encadre ses champs de
          rouge, les dates manquantes encadrent les leurs, le rayon
          manquant encadre ses badges : la couleur dit tout. Ne reste
          écrit que ce qui APPREND quelque chose (règle nº 111) : une
          plage de dates À L'ENVERS — le rouge seul n'explique pas
          pourquoi deux champs remplis sont fautifs — et le sous-choix
          du rôle. */}
      {viseParLeManque &&
        messageDuManque &&
        (manque?.champ === "role" ||
          (manque?.champ === "dates" &&
            sessionsAffichees.some(
              (session) =>
                session.debut_le &&
                session.fin_le &&
                session.fin_le < session.debut_le
            ))) && (
          <p
            role="alert"
            className="mt-3 text-[13px] leading-relaxed text-erreur"
          >
            {messageDuManque}
          </p>
        )}

      {/* RIEN DE CHOISI NULLE PART : les quatre mots des rectangles
          rougissent — ET PAS UN MOT, comme partout depuis la règle
          nº 111 : seule l'infobulle du bouton « Je confirme » porte
          la phrase. */}

      {/* ⚠️ UN MANQUE NE S'ÉCRIT PLUS ICI NON PLUS (passe nº 116) :
          l'envoi du formulaire passe désormais par `MANQUE` (muet) —
          les champs rougissent, et c'est tout. Seule une phrase qui
          apprend quelque chose passerait encore. */}
      {texteErreur(enErreur) && (
        <p className="mt-3 text-[13px] text-erreur">
          {texteErreur(enErreur)}
        </p>
      )}
    </div>
  );
}
