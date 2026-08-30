"use client";

import { useEffect, useState } from "react";
import {
  ROLES_STUDIO,
  //  nº 751 — LES CINQ STATUTS DU MODE « AUTRE », au catalogue depuis
  //  la nº 749. (Les paliers de rayon, eux, ne sont plus lus par aucun
  //  écran depuis la nº 752 — voir la note du bloc « Autre ».)
  STATUTS_INDEPENDENT,
  type GenreMode,
  type NatureEtablissement,
  type RoleStudio,
  type StatutIndependent,
} from "@/config/tatouage";
import { BasculeDeuxChoix } from "@/components/BasculeDeuxChoix";
import { ChampsPlageDates } from "@/components/CalendrierPlage";
import { ChampLocalisation } from "@/components/ChampLocalisation";
import { DeuxZonesLieu } from "@/components/DeuxZonesLieu";
import { MenuDeroulant, type OptionMenu } from "@/components/MenuDeroulant";
//  nº 750 ter — L'ÉCRAN DE SÉLECTION D'UNE CONVENTION : fenêtre
//  superposée au web, page plein écran au doigt. Il ne porte QUE la
//  liste des conventions du pays et la demande aux administrateurs —
//  le pays et les dates, eux, vivent dans le formulaire.
import { FenetreConventions } from "@/components/FenetreConventions";
//  nº 750 — LE CATALOGUE DES CONVENTIONS : la lecture née à la nº 749,
//  les pays du menu, le nom d'un pays, et la localisation d'une
//  convention — recopiée dans la ligne de mode.
import {
  chargerConventionsAcceptees,
  lieuDeLaConvention,
  nomDuPays,
  paysDesConventions,
  type ConventionAcceptee,
} from "@/lib/conventions";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { IconeChevronBas, IconeCroix } from "@/components/Icones";
import type { LieuTrouve } from "@/lib/geocodage/types";
import type { FicheInscrite } from "@/components/RechercheFicheInscrite";
import { texteErreur } from "@/lib/erreurs-formulaire";
import {
  cleNeuve,
  modeVide,
  datesSuiventLeLieu,
  periodeDeSession,
  //  ⚠️ nº 752 — `lieuRenseigne` N'EST PLUS LU ICI : elle commandait
  //  l'affichage des dates d'un guest, qui attendaient son lieu. Les
  //  dates ouvrent désormais l'encadré (voir `leGuest`) — elles
  //  n'attendent plus rien. La fonction reste dans la bibliothèque,
  //  elle y porte encore la règle « le lieu est-il renseigné ? ».
  type ManqueBloc,
  type ModeEnSaisie,
} from "@/lib/modes-exercice";
//  nº 751 — LA LIGNE COURTE D'UN LIEU (« Austin, TX, USA »), celle de
//  la barre du moteur : une capsule est étroite, et c'est la forme que
//  le propriétaire a demandée.
import { ligneMoteur } from "@/lib/adresse";

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
    rectangles (voir plus bas). Les volets suivent — « Studio
    1/2 », « Studio 2/2 ». */
//  ██ nº 402 — TROIS MODES, ET LES NOMS TOMBENT LE « EN » ██
//  « À domicile » est supprimé du site (le type `GenreMode` ne le
//  connaît même plus — voir GENRES_MODE, config/tatouage) ; « En
//  studio » et « En salon » deviennent « Studio » et « Salon ».
//  ██ nº 414 — QUATRE MODES : LE MODE SANS LIEU ARRIVE ██
//  L'artiste qui CHERCHE un lieu. La mécanique est celle de l'ancien
//  « à domicile » (ville + rayon), le nom et le sens sont neufs — et
//  le slug aussi (`disponible`, voir GENRES_MODE).
//  ██ nº 418 — LE QUATRIÈME MODE EST ABANDONNÉ ██
//  Né à la nº 414, renommé deux fois, il est SUPPRIMÉ du site sur
//  décision du propriétaire. Il ne reste que les trois d'avant.
//  ██ nº 749 — LE CATALOGUE PASSE À CINQ, LE SÉLECTEUR RESTE À TROIS ██
//  `convention` et `independent` existent en base et dans GENRES_MODE
//  (les fondations), mais AUCUN écran ne les montre encore : leurs
//  onglets arrivent avec leurs formulaires (nº 750 et 751). Le Record
//  exhaustif exige leurs libellés dès maintenant — valeurs mortes tant
//  que ORDRE_SELECTEUR ne les liste pas.
//  ██ nº 751 — LES CINQ SONT LÀ, ET LE CINQUIÈME S'APPELLE « AUTRE » ██
//  Le catalogue le nomme `independent` (le slug, en base) et l'intitule
//  « Independent » (GENRES_MODE.titre, pour la fiche publique) ; DANS
//  LE SÉLECTEUR, le propriétaire veut « Autre » — le mot d'un artiste
//  qui n'est ni en studio, ni en salon, ni de passage, ni en
//  convention. Le slug ne bouge pas ; seul l'affichage parle sa langue.
const LIBELLES_MODES: Record<GenreMode, string> = {
  prive: "Studio",
  salon: "Salon",
  guest: "Guest",
  convention: "Convention",
  independent: "Autre",
};

/** L'ORDRE DU SÉLECTEUR — celui que le propriétaire a dicté (nº 403,
    rétabli tel quel par la nº 418) :
        Studio · Salon · Guest
    C'est un ordre d'AFFICHAGE : les slugs ne bougent jamais.
    ⚠️ CE N'EST PAS LE SEUL ENDROIT À TENIR CET ORDRE : le filtre de
    recherche (FILTRE_MODE_ACTIVITE), l'ordre des profils sur une
    fiche (RANG_DU_GENRE) et le catalogue (GENRES_MODE) disent la même
    chose. Les quatre listes doivent bouger ensemble.
    (nº 749 — le catalogue avait pris deux entrées d'avance,
    `convention` et `independent`, SANS écran.)
    ██ nº 750 — CONVENTION ENTRE, EN QUATRIÈME ██
    L'ordre dicté par la conception nº 748-B : Studio · Salon · Guest ·
    Convention · Independent. Le cinquième (Independent) arrive avec
    son écran à la nº 751 ; l'ordre des profils d'une fiche
    (RANG_DU_GENRE) à la nº 753, le filtre du moteur à la nº 757.
    ██ nº 751 — LE CINQUIÈME ENTRE À SON TOUR, SOUS LE MOT « AUTRE » ██
    Le sélecteur est complet : Studio · Salon · Guest · Convention ·
    Autre.
    ██ nº 757 — LES QUATRE LISTES SONT AU COMPLET ██
    Le rendez-vous est tenu : RANG_DU_GENRE a pris les cinq à la
    nº 753, et FILTRE_MODE_ACTIVITE (le filtre « Où il tatoue » du
    moteur) à la nº 757. Aucune liste ne reste en arrière.
    ⚠️ CE DERNIER EST INERTE, ET C'EST VOULU : son groupe a été RETIRÉ
    DE L'ÉCRAN à la nº 444 (décision du propriétaire). On l'aligne pour
    que les listes ne divergent pas, pas pour qu'il filtre quoi que ce
    soit — la note de FILTRE_MODE_ACTIVITE le dit en entier.
    ⚠️ SEUL LE MOT DIFFÈRE, ET C'EST VOULU : ici l'ARTISTE lit
    « Autre » (sa décision, nº 751) ; le VISITEUR, lui, lit
    « Independent » — sur les fiches (nº 755) comme dans le filtre. */
const ORDRE_SELECTEUR: GenreMode[] = [
  "prive",
  "salon",
  "guest",
  "convention",
  "independent",
];

/**
 * ██ nº 750 — LA GRILLE DU SÉLECTEUR SUIT LE NOMBRE DE MODES ██
 * ==================================================================
 * TROIS MODES TENAIENT SUR UNE LIGNE, QUATRE NE TIENNENT PAS — et
 * c'est mesuré, pas supposé : à 320 px, quatre rectangles laissent
 * ~64 px de texte utile, quand « Convention » en demande ~78 (14 px
 * semi-gras, sur le Geist servi). C'EST EXACTEMENT LE CAS QUE LA
 * nº 128 AVAIT DÉJÀ TRANCHÉ, dans ces mots : « le sélecteur passe sur
 * DEUX LIGNES de deux rectangles ». On y revient, sans rien inventer —
 * et la nº 402 (« une seule ligne, partout ») n'est pas contredite :
 * ce qu'elle refusait était une VARIANTE entre le doigt et le web.
 * Deux lignes de deux valent pour les deux appareils, à l'identique.
 * ⚠️ LES CLASSES SONT ÉCRITES EN TOUTES LETTRES, jamais fabriquées :
 * Tailwind lit des chaînes littérales, une classe calculée ne
 * produirait aucune règle. Le cinquième mode (nº 751) ajoutera sa
 * ligne ici.
 * ██ nº 751 — CINQ MODES : TROIS COLONNES, ET LE CALCUL LE DIT ██
 * Repris de la mesure ci-dessus : à 320 px, TROIS rectangles laissent
 * ~90 px de texte utile (les quatre en laissaient ~64) — de quoi tenir
 * « Convention », le plus long des cinq, qui en demande ~78. Deux
 * lignes suffisent donc : Studio · Salon · Guest, puis Convention ·
 * Autre. Cinq en deux colonnes en auraient réclamé TROIS, et laissé le
 * dernier seul sur toute la largeur ; cinq en quatre ou cinq colonnes
 * couperaient les mots. La coupure est éprouvée au banc à 320 px
 * (aucun rectangle ne déborde, aucun mot ne passe à la ligne).
 */
const COLONNES_SELECTEUR: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2",
  5: "grid-cols-3",
};
const GRILLE_SELECTEUR =
  COLONNES_SELECTEUR[ORDRE_SELECTEUR.length] ?? "grid-cols-2";

/** Le mot du bouton d'ajout — « + Ajouter un studio », etc. Le Guest
    n'y figure pas : il garde « + Ajouter une autre date ».
    (nº 749 — les deux nouveautés reçoivent leur mot par exhaustivité
    du Record ; aucun bouton ne les affiche tant que leurs écrans
    n'existent pas, et les nº 750-751 poseront les mots définitifs.)
    ⚠️ nº 751 — L'ENTRÉE `independent` NE SERT PLUS À RIEN, et c'est le
    Record exhaustif qui l'exige encore : le mode « Autre » N'A PAS de
    bouton d'ajout (un seul bloc par artiste — décision du
    propriétaire ; ses zones s'ajoutent DANS le bloc, par le champ de
    ville). Le rendu du bouton la saute explicitement. */
/*  ⚠️ nº 752 — `rayonAutourDe` ET `libelleDeLaZone` ONT DISPARU AVEC LE
    RAYON. La nº 751 demandait un palier après chaque ville du mode
    « Autre » et l'écrivait dans la capsule (« Austin, TX, USA •
    50 km ») ; le propriétaire l'a retiré : une zone est une ville, et
    sa capsule ne porte plus que le lieu (`ligneMoteur`, dans
    `lesCapsulesDeVilles`). `RAYONS_DEPLACEMENT` reste au catalogue —
    plus aucun écran ne le lit.  */

const MOTS_AJOUT: Record<Exclude<GenreMode, "guest">, string> = {
  prive: "un studio",
  salon: "un salon",
  convention: "une convention",
  independent: "une zone",
};

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
  id?: string | null,
  /*  §2 (nº 267) — QUI APPELLE ? Ouvrir un onglet et VIDER un encadré
      donnaient jusqu'ici le même résultat, et c'est ce qui a fait le
      défaut du rôle. Un onglet NEUF s'ouvre sur la première position
      de ses bascules (il n'y a rien derrière lui) ; un encadré VIDÉ,
      lui, ne doit rien réinventer — ni rôle, ni identifiant. */
  vide = false
): ModeEnSaisie {
  const base = modeNeuf();
  return {
    ...base,
    cle: cle ?? base.cle,
    //  §2 (nº 267) — VIDÉ, IL PERD SON IDENTIFIANT : il ne partage
    //  plus la ligne de personne, et celle qu'il portait s'en va de la
    //  base (elle n'est plus dans `gardes` — nº 265).
    ...(id !== undefined && !vide ? { id } : {}),
    genre,
    /*  §2 (nº 267) — VIDER UN ENCADRÉ N'INVENTE PLUS DE RÔLE, ET
        C'ÉTAIT LA CAUSE. `modeVierge` sert à DEUX choses : ouvrir un
        onglet neuf, et VIDER un encadré par la croix (voir
        `fermerCeLieu`). Dans les deux cas il reposait
        `role: "fondateur"` — la première position de la bascule.
        Conséquence, exactement le relevé : on retire le studio choisi
        sous « Fondateur », on choisit « Artiste résident »… mais
        l'encadré vidé était déjà revenu à « fondateur », et il gardait
        SON IDENTIFIANT — les deux rôles n'étaient donc que deux vues
        d'UNE MÊME LIGNE, dont la croix rétablissait la première.
        D'où « le formulaire garde fondateur » ET « supprimer d'un côté
        supprime de l'autre ».
        DÉSORMAIS : un encadré vidé n'a plus de rôle du tout (`null`),
        et il perd son identifiant (voir `fermerCeLieu`) — il ne
        partage plus la ligne de personne. Chaque rôle a sa propre
        existence ; celui qu'on choisit ensuite est le seul enregistré.
        ⚠️ UN ONGLET NEUF garde son rôle d'ouverture : là, aucune ligne
        n'existe encore, et la bascule doit bien s'ouvrir quelque
        part.
        ⚠️ nº 403 — « FONDATEUR » N'EST PLUS LA PREMIÈRE POSITION (le
        récit ci-dessus date de la nº 267, où elle l'était) : la bascule
        s'ouvre sur « Résident », à gauche. La nº 403 avait gardé
        `fondateur` comme valeur de naissance, écrite ici en toutes
        lettres — l'inversion d'affichage ne devait rien changer à
        l'enregistrement.
        ██ nº 405 — LE DÉFAUT REJOINT L'AFFICHAGE : « RÉSIDENT » ██
        Le propriétaire tranche : un lieu NEUF naît désormais
        `resident`, pour un artiste comme pour un studio ou un salon —
        c'est le cas de loin le plus fréquent, et la bascule s'ouvrira
        donc sur le choix déjà sélectionné, à gauche.
        ⚠️ CE DÉFAUT NE VAUT QUE POUR CE QUI N'EXISTE PAS ENCORE. Une
        ligne DÉJÀ ENREGISTRÉE garde son rôle : elle arrive avec sa
        valeur, relue par FormulaireFiche — dont le repli des lignes
        d'avant la nº 100 (`ligne.role ?? …`) n'est PAS touché, sans
        quoi des fiches existantes changeraient de rôle en silence. */
    role:
      vide || (genre !== "salon" && genre !== "prive") ? null : "resident",
    //  LA NATURE DU LIEU ne concerne qu'un guest. « Studio » d'abord
    //  depuis la passe nº 128 (l'ordre de la bascule s'est inversé) —
    //  et une bascule s'ouvre sur sa PREMIÈRE position, jamais sur la
    //  seconde : un guest neuf part donc sur « Studio ».
    natureLieu: genre === "guest" ? "prive" : null,
    rayonKm: null,
    //  nº 418 — PLUS AUCUN MODE « MANUEL » : le seul qui n'avait pas
    //  de fiche à chercher (nº 414-417) est supprimé du site. Les
    //  trois modes restants passent tous par la recherche de
    //  portfolio inscrit.
    source: "inscrit",
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
  manques = [],
  ficheId = null,
}: {
  /** nº 750 — LA FICHE EN COURS, quand elle existe déjà en base. Elle
      ne sert qu'à UNE chose : accompagner une demande de convention du
      nom du portfolio qui la fait, pour que l'administration sache qui
      demande quoi (le motif de « Un style manque ? », nº 122). Absente
      pendant la CRÉATION d'une fiche — la demande part quand même,
      simplement sans ce contexte : la route la garde telle quelle. */
  ficheId?: string | null;
  modes: ModeEnSaisie[];
  surChangement: (modes: ModeEnSaisie[]) => void;
  /** Vrai mobile : le champ de localisation remonte et ouvre ses
      suggestions dans le flux (voir ChampLocalisation). */
  surMobile: boolean;
  enErreur?: string | null;
  /** CE QUI MANQUE, quand la personne a essayé de confirmer. Null
      tant qu'elle n'a rien tenté : on n'allume pas des champs rouges
      sur un formulaire qu'on vient d'ouvrir.
      ⚠️ LE PREMIER SEULEMENT : c'est LUI qui commande la remontée et
      la bascule d'onglet — on mène toujours au premier endroit à
      corriger (nº 266). */
  manque?: ManqueBloc | null;
  /** §1 (nº 267) — ET TOUS LES AUTRES. Un artiste cumule les quatre
      modes : s'il a oublié quelque chose dans les quatre, les quatre
      badges, les quatre titres et tous les champs concernés rougissent
      EN MÊME TEMPS. Le premier reste le point d'arrivée de la page ;
      cette liste-ci ne fait que dire OÙ ÇA MANQUE, partout. */
  manques?: ManqueBloc[];
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

  /* ---------------------------------------------------------------
     ██ nº 750 — LE CATALOGUE DES CONVENTIONS ██
     Lu UNE FOIS, et SEULEMENT quand l'onglet Convention s'ouvre : un
     artiste qui ne déclare que son salon ne paie pas cette lecture.
      · `null`  — pas encore lu : les deux menus se taisent ;
      · `[]`    — lu, et le catalogue est vide (aucune convention
                  acceptée) : l'onglet le dit en une phrase.
     ⚠️ JAMAIS BLOQUANTE (lib/conventions, la règle de
     `styles-ajoutes`) : base injoignable ou migration pas passée, on
     obtient une liste vide — le formulaire le dit, il ne casse pas.
     --------------------------------------------------------------- */
  const [catalogue, setCatalogue] = useState<ConventionAcceptee[] | null>(
    null
  );
  const [catalogueDemande, setCatalogueDemande] = useState(false);
  useEffect(() => {
    if (!catalogueDemande) return;
    let vivant = true;
    void chargerConventionsAcceptees(creerClientSupabaseNavigateur()).then(
      (liste) => {
        if (vivant) setCatalogue(liste);
      }
    );
    return () => {
      vivant = false;
    };
  }, [catalogueDemande]);

  /* ---------------------------------------------------------------
     ██ nº 750 ter — L'ÉCRAN DE SÉLECTION D'UNE CONVENTION ██
     Un seul état, et c'est LA CLÉ DE L'ENCADRÉ QUI L'A DEMANDÉ (null
     quand rien n'est ouvert). Il en faut une : plusieurs encadrés de
     convention coexistent — « + Ajouter une autre date » —, et ce que
     l'écran rapporte doit revenir dans CELUI qui l'a ouvert, jamais
     dans le premier venu.
     ⚠️ LE PAYS ET LES DATES NE SONT PLUS DEDANS (nº 750 ter) : ils
     vivent dans l'encadré, avec les autres modes. L'écran ne porte
     plus que la LISTE et la demande aux administrateurs — dont les
     six états, eux, n'ont pas bougé depuis la nº 750.
     --------------------------------------------------------------- */
  const [fenetreConventions, setFenetreConventions] = useState<string | null>(
    null
  );

  /* ---------------------------------------------------------------
     ██ nº 752 — LE CHAMP DE VILLE SE VIDE APRÈS CHAQUE CAPSULE ██
     `compteurVille` NE COMPTE RIEN : il ne sert qu'à faire RENAÎTRE le
     champ une fois la capsule posée. `ChampLocalisation` lit son texte
     de départ AU MONTAGE (`useState(lieuInitial ? …)`) ; sans clé
     neuve, le nom de la ville qu'on vient de ranger resterait écrit
     dans le champ, et la suivante se taperait par-dessus.
     ⚠️ UN SEUL COMPTEUR POUR LES DEUX USAGES (zones du mode « Autre »,
     villes d'un guest sans lieu) : ils ne sont jamais montés ensemble
     — un onglet à la fois, un volet déplié à la fois.
     (nº 751 — il s'appelait `compteurZone` et cohabitait avec une
     « ville en attente de rayon » ; le rayon est parti à la nº 752, la
     ville se range désormais d'un seul geste.)
     --------------------------------------------------------------- */
  const [compteurVille, setCompteurVille] = useState(0);

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

  /*  nº 750 — LE CATALOGUE NE SE LIT QU'À L'OUVERTURE DE L'ONGLET.
      Ajusté PENDANT LE RENDU, jamais dans un effet : c'est le motif
      React déjà employé plus haut pour la bascule d'onglet du manque —
      React relance aussitôt le rendu, sans peindre un état
      intermédiaire. Le drapeau ne retombe jamais : une fois lu, le
      catalogue reste. */
  if (genreAffiche === "convention" && !catalogueDemande) {
    setCatalogueDemande(true);
  }

  /* ================================================================
   * ██ nº 752 — UN ENCADRÉ GUEST PEUT PORTER PLUSIEURS LIGNES ██
   * ================================================================
   * Le parcours « Non » (« je ne dis pas le lieu ») met PLUSIEURS
   * VILLES dans un seul encadré, aux mêmes dates. Chaque ville est une
   * ligne `modes_exercice` — une ligne = un point, la règle du site —,
   * et ces lignes-là portent la même `groupe` (voir lib/modes-exercice).
   * L'ÉCRAN, LUI, N'EN MONTRE QU'UNE : la première du groupe. Les
   * autres n'ont ni volet, ni titre, ni croix — elles sont les capsules
   * de celle-là. Tout le rendu du panneau (volets numérotés, croix,
   * confirmation) continue donc de travailler sur des MODES, sans rien
   * apprendre : il ne voit que les représentants.
   * ================================================================ */
  const groupeDe = (mode: ModeEnSaisie) => mode.groupe ?? mode.cle;

  /** LES LIGNES DE CET ENCADRÉ-LÀ — lui compris, dans l'ordre. */
  function lignesDuGroupe(mode: ModeEnSaisie): ModeEnSaisie[] {
    const groupe = groupeDe(mode);
    return modes.filter(
      (autre) => autre.genre === mode.genre && groupeDe(autre) === groupe
    );
  }

  const sessionsAffichees = genreAffiche
    ? modes.filter((mode) => {
        if (mode.genre !== genreAffiche) return false;
        //  UN SEUL REPRÉSENTANT PAR GROUPE : le premier rencontré.
        const groupe = groupeDe(mode);
        return (
          modes.find(
            (autre) =>
              autre.genre === genreAffiche && groupeDe(autre) === groupe
          ) === mode
        );
      })
    : [];

  function cleDuVoletOuvert(sessions: ModeEnSaisie[]): string | null {
    if (voletOuvert === "aucun") return null;
    if (voletOuvert && sessions.some((s) => s.cle === voletOuvert)) {
      return voletOuvert;
    }
    return sessions[sessions.length - 1]?.cle ?? null;
  }

  /*  §1 (nº 267) — LE ROUGE LIT LA LISTE COMPLÈTE. Il lisait le
      PREMIER manque : un seul champ, un seul badge, un seul titre
      pouvaient rougir à la fois — d'où le relevé (un « à domicile »
      sans rayon ET un guest sans dates, et rien qui s'allume). La
      liste rend tous les manques ; le premier, lui, garde son rôle :
      la remontée et la bascule d'onglet. Repli sur `manque` seul si
      l'appelant ne donne pas la liste. */
  const tousLesManquesDuBloc: ManqueBloc[] =
    manques.length > 0 ? manques : manque ? [manque] : [];

  /*  ⚠️ nº 752 — LE ROUGE SE LIT SUR TOUT L'ENCADRÉ, pas sur la seule
      ligne qui le représente. Un guest à trois villes a trois lignes ;
      c'est la deuxième qui peut manquer d'un point, et c'est le SEUL
      encadré visible qui doit s'allumer. Les quatre autres genres n'ont
      qu'une ligne par encadré : pour eux, ces deux fonctions répondent
      exactement comme avant.  */
  function clesDeLEncadre(cle: string): string[] {
    const vise = modes.find((mode) => mode.cle === cle);
    if (!vise) return [cle];
    return lignesDuGroupe(vise).map((mode) => mode.cle);
  }

  function manquant(cle: string, champ: ManqueBloc["champ"]): boolean {
    const cles = clesDeLEncadre(cle);
    return tousLesManquesDuBloc.some(
      (unManque) =>
        unManque.cle !== null &&
        cles.includes(unManque.cle) &&
        unManque.champ === champ
    );
  }

  /** CET ENCADRÉ-LÀ manque-t-il de quelque chose ? (le badge, le titre) */
  function modeEnManque(cle: string): boolean {
    const cles = clesDeLEncadre(cle);
    return tousLesManquesDuBloc.some(
      (unManque) => unManque.cle !== null && cles.includes(unManque.cle)
    );
  }

  /** LA MÊME ÉCRITURE, SUR TOUTES LES LIGNES DE L'ENCADRÉ (nº 752).
      Un seul `surChangement` : deux d'affilée se perdent — le second,
      calculé sur l'état d'avant, écrase le premier (la leçon nº 105). */
  function modifierLEncadre(cle: string, morceau: Partial<ModeEnSaisie>) {
    const cles = new Set(clesDeLEncadre(cle));
    surChangement(
      modes.map((mode) =>
        cles.has(mode.cle) ? { ...mode, ...morceau } : mode
      )
    );
  }

  function modifier(cle: string, morceau: Partial<ModeEnSaisie>) {
    surChangement(
      modes.map((mode) =>
        mode.cle === cle
          ? //  §5 (nº 413) — PLUS DE LIEU, PLUS DE DATES. La règle vit
            //  dans `datesSuiventLeLieu` (lib/modes-exercice), qui
            //  compare l'AVANT et l'APRÈS : elle n'efface que sur une
            //  vraie suppression, jamais sur un remplacement.
            //  ⚠️ POSÉE ICI, ET NULLE PART AILLEURS : `modifier` est le
            //  SEUL passage par lequel un encadré change (la recherche
            //  de fiche, l'adresse, le nom, les dates, le rôle — tout
            //  y revient). Une règle posée à l'un des appelants aurait
            //  manqué les autres.
            datesSuiventLeLieu(mode, { ...mode, ...morceau })
          : mode
      )
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
    /*  ⚠️ nº 752 — LA CROIX RETIRE L'ENCADRÉ ENTIER, ses villes
        comprises. Un guest « sans lieu » à trois villes est trois
        lignes ; n'en retirer qu'une laisserait deux orphelines,
        invisibles (l'écran ne montre que le représentant) et pourtant
        enregistrées. Pour les quatre autres genres, un encadré n'a
        qu'une ligne : `duGroupe` vaut alors `[cle]` et rien ne change. */
    const duGroupe = new Set(lignesDuGroupe(vise).map((mode) => mode.cle));
    const autres = modes.filter(
      (mode) => mode.genre === genre && !duGroupe.has(mode.cle)
    );
    setASupprimer(null);
    if (autres.length === 0) {
      //  LE DERNIER ENCADRÉ DU GENRE : on le VIDE au lieu de le
      //  supprimer (l'onglet doit rester ouvert), et ses villes
      //  surnuméraires s'en vont — il n'en reste qu'une, vierge.
      let garde = false;
      surChangement(
        modes.flatMap((mode) => {
          if (!duGroupe.has(mode.cle)) return [mode];
          if (garde) return [];
          garde = true;
          //  §2 (nº 267) — LA CROIX VIDE : ni rôle réinventé, ni
          //  identifiant gardé (voir `modeVierge`).
          return [modeVierge(genre, mode.cle, mode.id, true)];
        })
      );
      return;
    }
    setVoletOuvert(autres[autres.length - 1].cle);
    surChangement(modes.filter((mode) => !duGroupe.has(mode.cle)));
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
    /*  ██ nº 403 — DEUX MOTS, ET RIEN D'AUTRE ██
         LE MOT NE SUIT PLUS LE LIEU : « Fondateur du salon » /
         « Fondateur du studio » se choisissaient selon le genre, et
         « Artiste résident » portait un mot de trop. Le lieu est déjà
         nommé par l'encadré qu'on vient de choisir, deux lignes plus
         haut — le répéter ici n'apprenait rien. Restent « Résident »
         et « Fondateur », dans cet ordre.
         ⚠️ LES DEUX MOTS VIENNENT DU CATALOGUE, DANS SON ORDRE : plus
         un seul libellé écrit ici. Renommer un rôle ou les inverser se
         fait dans ROLES_STUDIO, et nulle part ailleurs. (La paire reste
         écrite en deux lignes parce que `BasculeDeuxChoix` attend un
         couple, pas une liste — deux choix, par construction.)
         ⚠️ LE DÉFAUT EST LU PAR NOM, PLUS PAR POSITION. C'était
         `ROLES_STUDIO[0].slug` : inverser la liste (nº 403) aurait fait
         basculer le repli sans qu'une ligne le dise. Il est donc écrit
         en toutes lettres — et il vaut `resident` depuis la nº 405,
         COMME `modeVierge` : les deux endroits qui décident ce défaut
         disent le même mot, et ils sont les deux seuls.
         ⚠️ CE REPLI-CI NE SERT QU'AUX LIGNES SANS RÔLE. Une ligne
         enregistrée arrive avec le sien et n'y touche pas ; celles
         d'avant la nº 100 reçoivent le leur à la relecture
         (FormulaireFiche), qui n'a pas bougé. Aucune fiche existante
         ne change de rôle. */
    return (
      <div className="opacity-100 transition-opacity duration-200 starting:opacity-0">
        <BasculeDeuxChoix
          etiquette="Ton rôle dans ce lieu"
          choix={[
            { slug: ROLES_STUDIO[0].slug as RoleStudio, label: ROLES_STUDIO[0].choix },
            { slug: ROLES_STUDIO[1].slug as RoleStudio, label: ROLES_STUDIO[1].choix },
          ]}
          valeur={(mode.role ?? "resident") as RoleStudio}
          surChoix={(role) => modifier(mode.cle, { role })}
        />
      </div>
    );
  }

  /** LA LOCALISATION : deux zones, ou une seule. */
  function leLieu(mode: ModeEnSaisie) {
    const enFaute = manquant(mode.cle, "lieu");
    /*  nº 418 — LA BRANCHE « MANUELLE » EST REPARTIE AVEC LE MODE
        SANS LIEU (nº 414-417), comme elle était partie avec « à
        domicile » à la nº 402 : c'était le seul mode sans fiche à
        chercher, le seul à porter un rayon de déplacement. Les trois
        modes restants passent tous par la recherche de portfolio
        inscrit ci-dessous. */
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
    //  §1 (nº 266) — LA QUESTION PARLE DU PORTFOLIO, PAS DU LIEU : on
    //  ne demande pas si le studio « est sur YokoFolio » (il y est
    //  bien, physiquement, dans la vie de la personne) mais s'il y a
    //  son PORTFOLIO — c'est cela qu'on cherche dans le champ juste
    //  en dessous.
    const question = prive
      ? "Le studio a-t-il son portfolio sur YokoFolio ?"
      : "Le salon a-t-il son portfolio sur YokoFolio ?";

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
          //  §3 (nº 272) — plus de clé ICI : l'identité du mode vit
          //  sur SON BLOC entier (voir ZoneLieuSeule et le panneau).
          //  La clé de la nº 269 ne couvrait que ce champ — et pas la
          //  bascule de nature du guest, qui ne change ni le genre ni
          //  la clé : le portfolio trouvé et l'adresse tapée
          //  survivaient au va-et-vient.
          prefixe={`mode-${mode.cle}`}
          titre={question}
          //  ⚠️ CHAQUE MODE CHERCHE CE QU'IL DÉCLARE (passe nº 121).
          //  Les trois recherches interrogeaient la même liste — TOUS
          //  les lieux — parce que `type_fiche = 'salon'` désigne
          //  aussi bien un salon qu'un studio privé. « Studio »
          //  proposait donc des salons, et « Salon » des studios.
          //  La nature (`etablissement`) tranche : elle vaut « prive »
          //  pour un studio, « salon » pour un salon.
          /*  ██ §4 (nº 413) — LE GUEST FILTRE, LUI AUSSI ██
               IL PASSAIT `undefined`, ET C'ÉTAIT DÉLIBÉRÉ : la note de
               la nº 121 disait « RIEN pour un guest — celui-là est
               accueilli par les deux ». C'était vrai AVANT que le guest
               ait sa propre bascule Salon / Studio (`natureLieu`,
               migration nº 41) : on ne savait pas quoi filtrer, on
               montrait tout.
               MAINTENANT IL LE DIT — la bascule est juste au-dessus du
               champ, et c'est ce choix qu'on lui a demandé. Chercher un
               studio et se voir proposer un salon, c'est lui rendre sa
               réponse pour rien. La nature choisie devient donc le
               filtre, comme pour les deux autres genres.
               ⚠️ LE REPLI EST « salon », le même que la bascule
               elle-même (`mode.natureLieu ?? "salon"`, plus haut) : les
               deux ne peuvent pas se contredire. */
          etablissement={
            guest
              ? ((mode.natureLieu ?? "salon") as NatureEtablissement)
              : mode.genre === "prive"
                ? "prive"
                : "salon"
          }
          /*  §4 (nº 413) — ET LE MESSAGE SUIT LE FILTRE : dire « Aucun
               studio / salon trouvé » quand on ne cherche QUE des
               studios laisserait croire qu'on a tout regardé. Chaque
               genre nomme donc ce qu'il n'a pas trouvé. */
          messageVide={
            (guest ? (mode.natureLieu ?? "salon") : mode.genre) === "prive"
              ? "Aucun studio trouvé"
              : "Aucun salon trouvé"
          }
          //  LES DEUX CHAMPS SE PRÉSENTENT SEULS : ce qu'ils attendent
          //  est écrit DEDANS, plus au-dessus.
          //  §1 (nº 266) — … SAUF LA ZONE D'ADRESSE, qui reçoit un
          //  TITRE comme la recherche a le sien, et un libellé
          //  intérieur qui suit la nature du lieu : une ville suffit à
          //  un studio, un salon veut son adresse complète (c'est la
          //  règle d'`adresseSuffisante`, écrite ici en mots).
          indicationInscrit="Recherche"
          /*  §3 (nº 418) — LA QUESTION DE LA ZONE D'ADRESSE. Elle
               demandait « Où se trouve-t-il ? » depuis la nº 266 ; le
               propriétaire lui préfère une phrase qui dit à QUOI SERT
               ce second champ — on n'y saisit une adresse que si le
               lieu n'a pas son portfolio sur YokoFolio.
               ⚠️ ÉCRITE UNE SEULE FOIS, ET C'EST DÉJÀ LE CAS : ce
               `titreAdresse` est passé au MÊME `DeuxZonesLieu` pour
               les trois modes (Studio, Salon, Guest) — la branche
               unique de `leLieu`. Une ligne suffit donc à les servir
               tous les trois. */
          titreAdresse="Pas de portfolio ? Ajoutez ses coordonnées."
          indicationManuel={
            prive ? "Ville ou adresse complète" : "Adresse complète"
          }
          //  §1 (nº 266) — LE NOM DU LIEU QUI N'EST PAS SUR YOKOFOLIO :
          //  il n'apparaît qu'une fois l'adresse choisie, son libellé
          //  vit DEDANS, et il disparaît avec l'adresse dès que le
          //  portfolio du lieu est trouvé par la recherche.
          libelleNomLieu={prive ? "Nom du studio" : "Nom du salon"}
          nomLieu={mode.nomLieu ?? ""}
          surNomLieu={(nomLieu) => modifier(mode.cle, { nomLieu })}
          nomLieuEnErreur={manquant(mode.cle, "nomLieu")}
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
                    //  §1 (nº 266) — LA BASCULE DANS L'AUTRE SENS :
                    //  le portfolio du lieu a été créé entre-temps et
                    //  la personne le trouve par la recherche —
                    //  l'adresse s'efface (ci-dessus) ET le nom saisi
                    //  avec elle. Le lieu porte désormais le nom de sa
                    //  fiche : garder l'ancien en mémoire, invisible,
                    //  le ferait ressortir au premier retrait.
                    nomLieu: null,
                    //  ██ §2 (nº 420) — LES DATES NE SONT PAS ÉCRITES
                    //  ICI, ET C'EST LE POINT ██ C'est le même guest,
                    //  aux mêmes dates, simplement mieux désigné : ce
                    //  qu'il a saisi doit lui rester. L'écriture ne
                    //  touche donc QUE le lieu (`salon`, `lieu`,
                    //  `nomLieu`), et `datesSuiventLeLieu` — qui relit
                    //  cette transition — y voit un REMPLACEMENT, pas
                    //  une disparition : les dates passent intactes.
                    //  Y ajouter `debut_le`/`fin_le` les perdrait.
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
    //  ⚠️ nº 752 — LE MANQUE DE DATES PEUT PORTER LA CLÉ D'UNE AUTRE
    //  LIGNE DE L'ENCADRÉ : un guest à trois villes en a trois, toutes
    //  aux mêmes dates, et `premierManque` désigne la première venue.
    //  Ce sont pourtant LES MÊMES champs à l'écran.
    const clesIci = clesDeLEncadre(mode.cle);
    const champManque =
      manque && manque.cle !== null && clesIci.includes(manque.cle)
        ? manque.champ
        : null;
    //  nº 750 — `convention` REJOINT `lieu` DANS CETTE LISTE, et pour
    //  la même raison : c'est le champ qui PRÉCÈDE les dates dans son
    //  panneau. Quand il manque, les deux dates vides s'allument avec
    //  lui — le comportement du guest, à l'identique.
    const vise =
      champManque === "dates" ||
      champManque === "lieu" ||
      champManque === "convention";
    const desordre = Boolean(
      mode.debut_le && mode.fin_le && mode.fin_le < mode.debut_le
    );
    return (
      <ChampsPlageDates
        prefixe={`mode-${mode.cle}`}
        debut={mode.debut_le}
        fin={mode.fin_le}
        //  ⚠️ nº 752 — LES DATES S'ÉCRIVENT SUR TOUT L'ENCADRÉ, en une
        //  seule fois : un guest à trois villes est trois lignes, et
        //  elles décrivent LE MÊME SÉJOUR. Les écrire ligne par ligne
        //  les ferait diverger — et la relecture, qui regroupe PAR LES
        //  DATES, y verrait alors trois encadrés au lieu d'un.
        //  Les quatre autres genres n'ont qu'une ligne par encadré :
        //  pour eux, c'est exactement `modifier`.
        surChangement={(debut_le, fin_le) =>
          modifierLEncadre(mode.cle, { debut_le, fin_le })
        }
        enFauteDebut={vise && (!mode.debut_le || desordre)}
        enFauteFin={vise && (!mode.fin_le || desordre)}
      />
    );
  }

  /**
   * ██ nº 750 ter — LE MODE CONVENTION, DANS LE FORMULAIRE ██
   * ==================================================================
   * TROIS PASSES POUR TROUVER LA FORME, ET VOICI CELLE QUI RESTE.
   * La nº 750 posait DEUX menus déroulants (pays, convention) et les
   * dates dessous : le second menu se lisait mal. La nº 750 bis a tout
   * déménagé dans un écran d'ajout : trop large — le mode entier
   * quittait le formulaire. LA nº 750 ter GARDE LA STRUCTURE DES
   * AUTRES MODES, celle d'un guest, et n'emprunte à l'écran d'ajout
   * que ce qu'il fait mieux qu'un menu : LA LISTE.
   *
   * L'ORDRE, DANS L'ENCADRÉ :
   *  1. COUNTRY — le menu des pays, POSÉ ICI, visible d'emblée (seuls
   *     les pays qui ont une convention acceptée, règle nº 748-B1) ;
   *  2. LE LIEN « + Ajouter la convention », qui n'apparaît qu'une
   *     fois le pays choisi : il ouvre l'écran de sélection
   *     (`FenetreConventions`) — fenêtre au web, page au doigt. Ce
   *     qu'on y touche referme et revient ici en BADGE À CROIX ;
   *  3. YOUR DATES THERE — les deux dates, DANS LE FORMULAIRE, sous le
   *     badge, exactement comme les dates d'une session guest.
   * Et « + Ajouter une autre date », en bas, ouvre un second encadré :
   * autre pays si besoin, autre convention, autres dates — le modèle
   * multi-lignes des guests, sans un mécanisme de plus.
   *
   * ⚠️ LE FOND N'A PAS BOUGÉ DEPUIS LA nº 750 : un encadré rempli EST
   * une ligne de `modes_exercice` de genre `convention`, avec sa
   * localisation recopiée du catalogue, son `convention_id` et les
   * dates de l'artiste. Enregistrement, relecture, validation,
   * expiration : intouchés.
   */
  function laConvention(mode: ModeEnSaisie) {
    const enFaute = manquant(mode.cle, "convention");
    const liste = catalogue ?? [];
    const paysChoisi = mode.paysConvention ?? "";
    const optionsPays: OptionMenu[] = paysDesConventions(liste).map((code) => ({
      value: code,
      label: nomDuPays(code),
    }));
    const catalogueVide = catalogue !== null && liste.length === 0;
    const periode = periodeDeSession(mode.debut_le, mode.fin_le);

    return (
      <div className="flex flex-col gap-5">
        <MenuDeroulant
          valeur={paysChoisi}
          surChangement={(code) =>
            modifier(mode.cle, {
              paysConvention: code || null,
              //  ⚠️ CHANGER DE PAYS LÂCHE LA CONVENTION RETENUE — elle
              //  n'est pas dans la nouvelle liste — ET SON LIEU avec
              //  elle, dans la MÊME écriture (la leçon de la nº 105 :
              //  deux écritures séparées se perdent, React groupe les
              //  états). LES DATES RESTENT : ce sont celles de
              //  l'artiste, elles ne dépendent d'aucun pays.
              convention: null,
              lieu: null,
            })
          }
          options={optionsPays}
          ariaLabel="Country"
          placeholder="Country"
          sombre
          opaque
          //  La robe des champs du formulaire (`CHAMP`) : ce menu vit
          //  au milieu d'eux.
          fondRepos="bg-sombre-eleve-clair"
          fondActif="bg-sombre-haut"
          arrondi="rounded-xl"
          hauteur="min-h-[52px]"
        />

        {catalogueVide && (
          <p className="text-[13px] leading-relaxed text-sombre-texte-doux">
            No convention has been added to the catalogue yet.
          </p>
        )}

        {paysChoisi &&
          (mode.convention ? (
            /*  LE BADGE À CROIX — la capsule des styles (BlocPortfolio,
                nº 552) : `rounded-full`, fond `eleve-clair`, texte
                blanc. Elle porte ici une croix, parce qu'elle n'ouvre
                rien : elle dit ce qui est choisi, et se retire.
                ⚠️ ELLE ROUGIT quand ce mode-là manque de quelque chose
                (le cadre, jamais le mot — la règle nº 266). */
            <span
              data-badge-convention={mode.cle}
              className={`inline-flex w-fit items-center gap-2 rounded-full border
                         bg-sombre-eleve-clair py-1.5 pl-3.5 pr-1.5
                         text-[13.5px] font-semibold text-sombre-texte ${
                           enFaute ? "border-erreur" : "border-transparent"
                         }`}
            >
              <span className="min-w-0 truncate">{mode.convention.nom}</span>
              <button
                type="button"
                onClick={() => retirerLaConvention(mode.cle)}
                aria-label={`Retirer ${mode.convention.nom}`}
                title="Retirer"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                           text-sombre-texte-doux transition-colors
                           hover:bg-sombre-haut hover:text-sombre-texte
                           active:bg-sombre-haut active:text-sombre-texte"
              >
                <IconeCroix taille={14} />
              </button>
            </span>
          ) : (
            /*  LE LIEN D'OUVERTURE — le motif du bouton « + Ajouter »
                de ce bloc (nº 419-§2) : la paire de fonds des champs,
                texte blanc dans les deux états. Il n'apparaît qu'une
                fois le pays choisi : sans pays, la liste n'aurait
                aucun sujet. */
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setFenetreConventions(mode.cle)}
              data-ouvre-conventions={mode.cle}
              className={`w-fit rounded-full border bg-sombre-eleve-clair px-4 min-h-[40px]
                         text-[13.5px] font-semibold text-sombre-texte
                         transition-colors hover:bg-sombre-haut
                         active:bg-sombre-haut ${
                           enFaute ? "border-erreur" : "border-transparent"
                         }`}
            >
              + Ajouter la convention
            </button>
          ))}

        {/*  LES DATES — DANS LE FORMULAIRE, sous le badge, et seulement
             une fois la convention choisie : sans elle, la question
             « quand y seras-tu ? » n'a pas de sujet. C'est la règle
             des dates d'un guest (nº 419), appliquée au même endroit
             de l'encadré. */}
        {mode.convention && (
          <div>
            <p className="text-[13.5px] font-semibold text-sombre-texte">
              Your dates there
            </p>
            <div className="mt-3">{lesDates(mode)}</div>
            {periode && (
              <p className="mt-2 text-[13px] text-sombre-texte-doux">
                {periode}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  /**
   * ██ nº 751 — LE BLOC « AUTRE » : LE STATUT, PUIS LES ZONES ██
   * ==================================================================
   * L'artiste qui n'est ni en studio, ni en salon, ni de passage, ni en
   * convention : il dit CE QU'IL CHERCHE (le statut) et JUSQU'OÙ IL SE
   * DÉPLACE (ses zones). Deux questions, dans cet ordre.
   *
   * L'ORDRE, DANS LE BLOC :
   *  1. STATUS — le menu des cinq statuts (`STATUTS_INDEPENDENT`,
   *     nº 749). Obligatoire, un seul choix, la robe des champs du
   *     formulaire — celle du menu des pays de la nº 750 ter ;
   *  2. SERVICE AREA — les zones déjà posées en CAPSULES À CROIX, puis
   *     le champ de ville. Choisir une ville pose la capsule et vide le
   *     champ, prêt pour la suivante.
   *
   * ⚠️ UN SEUL BLOC, SANS VOLETS NI BOUTON D'AJOUT — c'est la décision
   * du propriétaire, et le rendu du panneau la tient (voir plus bas).
   * Les zones sont bien N lignes en base ; ici, elles sont N capsules.
   *
   * ██ nº 752 — LE RAYON EST PARTI, ET C'ÉTAIT UNE ERREUR DE LA nº 751 ██
   * Elle demandait un palier (10 · 25 · 50 · 100 · 200 km) après chaque
   * ville, et l'écrivait en base. Le propriétaire l'a retiré aussitôt :
   * une zone est UNE VILLE, pas un disque. Plus de paliers à l'écran,
   * plus de rayon enregistré (voir enregistrer-exercice) — et la
   * capsule ne porte plus que le lieu.
   */
  function leBlocAutre() {
    //  LE ROUGE DU BLOC : n'importe laquelle de ses lignes suffit à
    //  l'allumer — l'écran n'en montre qu'un, il ne peut pas désigner
    //  « la troisième ligne ».
    const statutEnFaute = sessionsAffichees.some((mode) =>
      manquant(mode.cle, "statut")
    );
    const zoneEnFaute = sessionsAffichees.some((mode) =>
      manquant(mode.cle, "zone")
    );
    const optionsStatut: OptionMenu[] = STATUTS_INDEPENDENT.map((statut) => ({
      value: statut.slug,
      label: statut.label,
    }));

    return (
      <div>
        {/*  L'INTERTITRE — celui d'un mode seul de son type (le rendu
             `nombre <= 1` des quatre autres), et il rougit à la même
             règle (nº 266). SANS NUMÉRO ET SANS CROIX : ce bloc est
             unique par construction, il n'y a rien à numéroter, et
             c'est la croix d'une CAPSULE qui retire une zone.
             ⚠️ SON MARQUEUR PORTE LA CLÉ DE LA PREMIÈRE LIGNE : c'est
             elle que le manque désigne, et c'est par elle que la page
             remonte jusqu'ici. */}
        <div className="flex min-h-[36px] items-center">
          <span
            data-titre-volet={sessionsAffichees[0]?.cle}
            data-titre-en-faute={
              sessionsAffichees.some((mode) => modeEnManque(mode.cle))
                ? ""
                : undefined
            }
            className={`${TITRE_INTERTITRE}${
              sessionsAffichees.some((mode) => modeEnManque(mode.cle))
                ? " text-erreur"
                : ""
            }`}
          >
            {LIBELLES_MODES.independent}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-5">
        {/* ---------- 1. LE STATUT ---------- */}
        <div>
          <p className="text-[13.5px] font-semibold text-sombre-texte">
            Status
          </p>
          <div className="mt-3">
            <MenuDeroulant
              valeur={statutIndependent}
              surChangement={choisirLeStatut}
              options={optionsStatut}
              ariaLabel="Status"
              placeholder="Status"
              sombre
              opaque
              //  La robe des champs du formulaire (`CHAMP`) : ce menu
              //  vit au milieu d'eux, comme celui des pays (nº 750 ter).
              fondRepos="bg-sombre-eleve-clair"
              fondActif="bg-sombre-haut"
              arrondi="rounded-xl"
              hauteur="min-h-[52px]"
              enErreur={statutEnFaute}
            />
          </div>
        </div>

        {/* ---------- 2. LES ZONES ---------- */}
        <div>
          <p className="text-[13.5px] font-semibold text-sombre-texte">
            Service area
          </p>

          {lesCapsulesDeVilles({
            villes: zonesPosees,
            marqueur: "zone",
            prefixe: "zone-autre",
            enFaute: zoneEnFaute,
            surAjout: ajouterUneZone,
            surRetrait: retirerLaZone,
          })}
        </div>
        </div>
      </div>
    );
  }

  /**
   * ██ nº 752 — LES VILLES EN CAPSULES, ÉCRITES UNE SEULE FOIS ██
   * ==================================================================
   * DEUX ENDROITS S'EN SERVENT, et le propriétaire les veut identiques :
   *  · les ZONES du mode « Autre » (nº 751, le rayon en moins) ;
   *  · les VILLES d'un guest qui ne dit pas son lieu (le parcours
   *    « Non »).
   * Même geste, même dessin : le champ de ville du site, une capsule à
   * croix par ville choisie, le champ qui se vide pour la suivante.
   * L'écrire deux fois, c'est se condamner à les voir diverger.
   *
   * ⚠️ LA CLÉ DU CHAMP CHANGE À CHAQUE CAPSULE POSÉE : c'est ce qui le
   * vide. `ChampLocalisation` lit son texte de départ AU MONTAGE ; sans
   * clé neuve, le nom de la ville qu'on vient de ranger resterait
   * écrit, et la suivante se taperait par-dessus.
   */
  function lesCapsulesDeVilles({
    villes,
    marqueur,
    prefixe,
    enFaute,
    surAjout,
    surRetrait,
  }: {
    villes: ModeEnSaisie[];
    /** Le nom du marqueur de banc : `data-<marqueur>-ville`. */
    marqueur: string;
    prefixe: string;
    enFaute: boolean;
    surAjout: (lieu: LieuTrouve) => void;
    surRetrait: (cle: string) => void;
  }) {
    return (
      <>
        {villes.length > 0 && (
          /*  LES CAPSULES — le badge à croix des styles (nº 552),
              celui-là même que porte une convention (nº 750 ter) :
              `rounded-full`, fond `eleve-clair`, texte blanc. Elles
              s'enroulent (`flex-wrap`) : trois villes tiennent à
              320 px sans rien pousser hors du cadre. */
          <div className="mt-3 flex flex-wrap gap-2">
            {villes.map((ville) => {
              const libelle = ville.lieu ? ligneMoteur(ville.lieu) : "";
              return (
                <span
                  key={ville.cle}
                  data-ville-capsule={`${marqueur}:${ville.cle}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-full
                             border border-transparent bg-sombre-eleve-clair
                             py-1.5 pl-3.5 pr-1.5 text-[13.5px] font-semibold
                             text-sombre-texte"
                >
                  <span className="min-w-0 truncate">{libelle}</span>
                  <button
                    type="button"
                    onClick={() => surRetrait(ville.cle)}
                    aria-label={`Retirer ${libelle}`}
                    title="Retirer"
                    className="flex h-7 w-7 shrink-0 items-center justify-center
                               rounded-full text-sombre-texte-doux
                               transition-colors hover:bg-sombre-haut
                               hover:text-sombre-texte active:bg-sombre-haut
                               active:text-sombre-texte"
                  >
                    <IconeCroix taille={14} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-3">
          <ChampLocalisation
            key={`${prefixe}-${compteurVille}`}
            id={prefixe}
            etiquette={null}
            texteIndicatif="Ville, ou adresse complète…"
            surChoix={(lieu) => {
              if (!lieu) return;
              surAjout(lieu);
            }}
            panneauDansLeFlux={surMobile}
            opaque
            remonterAuToucher={surMobile}
            croixEffacement
            enErreur={enFaute}
          />
        </div>
      </>
    );
  }

  /** CE QUE L'ÉCRAN DE SÉLECTION RAPPORTE — une convention, pour
      l'encadré qui l'a demandé. Les dates, elles, se saisissent
      ensuite dans le formulaire. */
  function choisirLaConvention(convention: ConventionAcceptee) {
    const cle = fenetreConventions;
    if (!cle) return;
    modifier(cle, {
      convention: { id: convention.id, nom: convention.nom },
      //  LA LOCALISATION, RECOPIÉE DU CATALOGUE : c'est elle qui situe
      //  le mode (`lieuDeLaConvention`, lib/conventions — nº 750).
      lieu: lieuDeLaConvention(convention),
      paysConvention: convention.code_pays,
    });
    setFenetreConventions(null);
  }

  /** LA CROIX DU BADGE — elle retire LA CONVENTION, pas l'encadré :
      le pays reste, le menu est là, on en choisit une autre. Retirer
      l'encadré entier, c'est la croix du volet (`laCroix`), comme pour
      les trois autres modes.
      ⚠️ LES DATES PARTENT AVEC ELLE : elles disaient « j'y serai ces
      jours-là » — sans convention, elles ne disent plus rien, et les
      laisser ferait rouvrir l'encadré sur des dates orphelines. C'est
      la règle de `datesSuiventLeLieu` (nº 413), appliquée ici à la
      main : ce mode-ci n'a pas de « lieu » au sens des trois autres. */
  function retirerLaConvention(cle: string) {
    modifier(cle, {
      convention: null,
      lieu: null,
      debut_le: "",
      fin_le: "",
    });
  }

  /* ================================================================
   * ██ nº 751 — LE MODE « AUTRE » : UN BLOC À L'ÉCRAN, N LIGNES EN BASE
   * ================================================================
   * C'EST LA SEULE PARTICULARITÉ DE CE MODE, et elle vient du schéma
   * (conception nº 748-A3, confirmée par le propriétaire) :
   *  · EN BASE, une ligne `modes_exercice` PAR ZONE, chacune portant
   *    son point, son rayon, ET LE MÊME STATUT recopié ;
   *  · À L'ÉCRAN, UN SEUL BLOC — pas de volets numérotés, pas de
   *    « + Ajouter un autre » : un artiste n'a qu'un statut, et ses
   *    zones sont des capsules dans une même liste.
   * Les trois fonctions ci-dessous font le pont, et TOUTES ÉCRIVENT EN
   * UNE SEULE FOIS (la leçon nº 105 : deux `surChangement` d'affilée se
   * perdent — le second, calculé sur l'état d'avant, écrase le
   * premier). C'est aussi pourquoi elles n'appellent pas `modifier`,
   * qui ne sait toucher qu'UN mode.
   * ================================================================ */

  /** LES ZONES DÉJÀ POSÉES — les modes « Autre » qui portent un point,
      dans l'ordre de l'écran. Un encadré neuf (ouvert, sans ville) n'y
      est pas : il n'a rien à montrer en capsule. */
  const zonesPosees = modes.filter(
    (mode) => mode.genre === "independent" && Boolean(mode.lieu)
  );

  /** LE STATUT DU BLOC — celui de la première ligne « Autre ». Elles
      le portent toutes ; la lecture prend la première, exactement
      comme la fiche publique le fera (nº 753). */
  const statutIndependent: StatutIndependent | "" =
    modes.find((mode) => mode.genre === "independent")?.statut ?? "";

  /** LE MENU DU STATUT — il écrit sur TOUTES les lignes « Autre » à la
      fois : c'est une seule réponse, répétée en base parce que la
      colonne y vit sur la ligne (voir `statut`). */
  function choisirLeStatut(slug: string) {
    surChangement(
      modes.map((mode) =>
        mode.genre === "independent"
          ? { ...mode, statut: (slug || null) as StatutIndependent | null }
          : mode
      )
    );
  }

  /**
   * UNE ZONE DE PLUS — la ville et son rayon, en une écriture.
   * Elle REMPLIT D'ABORD l'encadré « Autre » qui n'a pas encore de
   * ville (celui qu'ouvre l'onglet, ou celui que la croix vient de
   * vider) : sans cela, une ligne fantôme sans point resterait
   * derrière, et `premierManque` la désignerait à raison.
   * Il n'en reste plus ? On ajoute un mode, avec LE STATUT DÉJÀ CHOISI
   * recopié dessus — c'est le schéma « une ligne par zone, le statut
   * répété ». Le rendu se chargera de le tenir à jour ensuite.
   */
  function ajouterUneZone(lieu: LieuTrouve) {
    let pose = false;
    const suivants = modes.map((mode) => {
      if (pose) return mode;
      if (mode.genre !== "independent" || mode.lieu || mode.salon) return mode;
      pose = true;
      return { ...mode, lieu };
    });
    surChangement(
      pose
        ? suivants
        : [
            ...suivants,
            {
              ...modeVierge("independent"),
              lieu,
              statut: statutIndependent || null,
            },
          ]
    );
    setCompteurVille((tour) => tour + 1);
  }

  /**
   * LA CROIX D'UNE CAPSULE — elle retire CETTE zone-là.
   * ⚠️ DEUX CAS, ET C'EST LA RÈGLE DE LA CROIX DU SITE (nº 122) :
   *  · IL EN RESTE D'AUTRES → la ligne s'en va (son identifiant quitte
   *    l'écran, l'enregistrement la supprimera en base) ;
   *  · C'ÉTAIT LA DERNIÈRE → on la VIDE au lieu de la supprimer. Le
   *    bloc doit rester ouvert : le statut y est encore, et le champ
   *    de ville attend la prochaine. Un encadré vidé perd son
   *    identifiant (`modeVierge(..., vide)`) — il ne partage plus la
   *    ligne de personne.
   */
  function retirerLaZone(cle: string) {
    if (zonesPosees.length > 1) {
      surChangement(modes.filter((mode) => mode.cle !== cle));
      return;
    }
    surChangement(
      modes.map((mode) =>
        mode.cle === cle
          ? {
              ...modeVierge("independent", mode.cle, mode.id, true),
              //  LE STATUT SURVIT À LA ZONE : il ne parle pas d'elle,
              //  il parle de l'artiste. Le reperdre obligerait à
              //  répondre deux fois à la même question.
              statut: mode.statut ?? null,
            }
          : mode
      )
    );
  }

  /* ================================================================
   * ██ nº 752 — LA SESSION GUEST, REPRISE DANS L'AUTRE SENS ██
   * ================================================================
   * CE QU'ELLE ÉTAIT : le lieu d'abord (nature, recherche de
   * portfolio, adresse, nom), les dates ensuite — et seulement une
   * fois le lieu renseigné (§1 nº 419).
   * CE QU'ELLE EST : LES DATES D'ABORD, puis une question —
   * « Souhaitez-vous indiquer le lieu de ce guest ? » :
   *  · OUI (la position d'ouverture) → le formulaire d'avant, TEL
   *    QUEL. Rien n'y change : bascule Studio/Salon, recherche de
   *    portfolio, « Pas de portfolio ? Ajoutez ses coordonnées », nom
   *    du lieu. Seules les dates ont quitté la fin de l'encadré ;
   *  · NON → UNE OU PLUSIEURS VILLES, en capsules à croix — le même
   *    geste que les zones du mode « Autre » (`lesCapsulesDeVilles`),
   *    et au moins une est exigée.
   * POURQUOI CE SENS-LÀ : un artiste sait QUAND il part avant de
   * savoir chez qui. Lui demander le lieu d'abord bloquait la saisie
   * de ce qu'il connaît déjà — et interdisait de déclarer un séjour
   * dont le lieu n'est pas encore arrêté.
   * ⚠️ CHAQUE VILLE EST UNE LIGNE, toutes aux mêmes dates : écrire les
   * dates les écrit donc SUR TOUT LE GROUPE, en une seule écriture
   * (la leçon nº 105 — deux `surChangement` d'affilée se perdent).
   * ================================================================ */
  function leGuest(session: ModeEnSaisie) {
    const lignes = lignesDuGroupe(session);
    const villes = lignes.filter((ligne) => Boolean(ligne.lieu));
    const villeEnFaute = manquant(session.cle, "ville");

    return (
      <div className="flex flex-col gap-5">
        {/* ---------- 1. LES DATES, EN PREMIER ---------- */}
        <div>
          <p className="text-[13.5px] font-semibold text-sombre-texte">
            Tes dates
          </p>
          <div className="mt-3">{lesDates(session)}</div>
        </div>

        {/* ---------- 2. LA QUESTION ---------- */}
        <div>
          {/*  LA QUESTION EST ÉCRITE, et pas seulement annoncée aux
               lecteurs d'écran : `BasculeDeuxChoix` ne fait de son
               étiquette qu'un `aria-label` (elle sert d'abord des
               bascules dont les deux mots se suffisent — « Studio /
               Salon »). Ici, les deux mots sont « Oui » et « Non » :
               sans la question au-dessus, ils ne veulent rien dire.
               La robe est celle des intertitres de champ du bloc
               (« Your dates there », nº 750 ter). */}
          <p className="text-[13.5px] font-semibold text-sombre-texte">
            Souhaitez-vous indiquer le lieu de ce guest ?
          </p>
          {/*  LA BASCULE À DEUX POSITIONS du site (nº 100) : elle s'ouvre
               sur « Oui », le parcours historique — c'est celui de tous
               les guests déjà enregistrés, et de loin le plus fréquent.
               ⚠️ BASCULER LÂCHE CE QUE L'AUTRE PARCOURS AVAIT POSÉ, dans
               la MÊME écriture (la leçon nº 105) : passer à « Non » rend
               les champs de lieu sans objet, passer à « Oui » rend les
               villes sans objet. LES DATES, ELLES, RESTENT — elles ne
               dépendent d'aucun des deux (voir `datesSuiventLeLieu`). */}
          <div className="mt-3">
            <BasculeDeuxChoix
              etiquette="Souhaitez-vous indiquer le lieu de ce guest ?"
              choix={[
                { slug: "oui", label: "Oui" },
                { slug: "non", label: "Non" },
              ]}
              valeur={session.sansLieu ? "non" : "oui"}
              surChoix={(reponse) => basculerLeGuest(session, reponse === "non")}
            />
          </div>
        </div>

        {/* ---------- 3. L'UN OU L'AUTRE ---------- */}
        {session.sansLieu ? (
          <div>
            <p className="text-[13.5px] font-semibold text-sombre-texte">
              Dans quelle ville ?
            </p>
            {lesCapsulesDeVilles({
              villes,
              marqueur: "guest",
              prefixe: `ville-guest-${session.cle}`,
              enFaute: villeEnFaute,
              surAjout: (lieu) => ajouterUneVilleDeGuest(session, lieu),
              surRetrait: (cle) => retirerUneVilleDeGuest(session, cle),
            })}
          </div>
        ) : (
          leLieu(session)
        )}
      </div>
    );
  }

  /** LA RÉPONSE À LA QUESTION — elle vaut pour TOUT l'encadré, et elle
      lâche ce que l'autre parcours avait posé. */
  function basculerLeGuest(session: ModeEnSaisie, sansLieu: boolean) {
    const duGroupe = new Set(lignesDuGroupe(session).map((mode) => mode.cle));
    let garde = false;
    surChangement(
      modes.flatMap((mode) => {
        if (!duGroupe.has(mode.cle)) return [mode];
        //  UNE SEULE LIGNE SURVIT au changement de parcours : les
        //  villes surnuméraires n'ont plus d'objet sous « Oui », et
        //  sous « Non » on repart d'un champ vide. Les DATES, elles,
        //  sont recopiées telles quelles.
        if (garde) return [];
        garde = true;
        return [
          {
            ...mode,
            sansLieu,
            //  REVENIR À « OUI » ROUVRE LA BASCULE SUR SA POSITION DE
            //  NAISSANCE — « Studio », celle d'un guest neuf
            //  (`modeVierge`). Reposer « salon » ici aurait fait deux
            //  guests neufs différents selon le chemin pris.
            natureLieu: sansLieu ? null : "prive",
            salon: null,
            lieu: null,
            nomLieu: null,
          },
        ];
      })
    );
  }

  /** UNE VILLE DE PLUS DANS CET ENCADRÉ — la première remplit la ligne
      encore vide (celle qu'ouvre la bascule), les suivantes ajoutent
      une ligne au groupe, avec les mêmes dates. */
  function ajouterUneVilleDeGuest(session: ModeEnSaisie, lieu: LieuTrouve) {
    const lignes = lignesDuGroupe(session);
    const libre = lignes.find((ligne) => !ligne.lieu && !ligne.salon);
    if (libre) {
      surChangement(
        modes.map((mode) => (mode.cle === libre.cle ? { ...mode, lieu } : mode))
      );
      setCompteurVille((tour) => tour + 1);
      return;
    }
    //  ELLE SE GLISSE JUSTE APRÈS LA DERNIÈRE DU GROUPE : l'ordre écrit
    //  en base suit alors celui de l'écran, comme pour `ajouterUnLieu`.
    const derniere = modes.lastIndexOf(lignes[lignes.length - 1]);
    const suivants = [...modes];
    suivants.splice(derniere + 1, 0, {
      ...modeVierge("guest"),
      groupe: groupeDe(session),
      sansLieu: true,
      natureLieu: null,
      lieu,
      debut_le: session.debut_le,
      fin_le: session.fin_le,
    });
    surChangement(suivants);
    setCompteurVille((tour) => tour + 1);
  }

  /** LA CROIX D'UNE CAPSULE — même règle que celle des zones du mode
      « Autre » (nº 751) : la ligne s'en va s'il en reste, sinon elle se
      VIDE pour que l'encadré — et ses dates — restent à l'écran. */
  function retirerUneVilleDeGuest(session: ModeEnSaisie, cle: string) {
    const villes = lignesDuGroupe(session).filter((ligne) => Boolean(ligne.lieu));
    if (villes.length > 1) {
      surChangement(modes.filter((mode) => mode.cle !== cle));
      return;
    }
    surChangement(
      modes.map((mode) =>
        mode.cle === cle
          ? {
              ...modeVierge("guest", mode.cle, mode.id, true),
              groupe: groupeDe(session),
              sansLieu: true,
              natureLieu: null,
              //  LES DATES SURVIENT À LA VILLE : elles disent QUAND, pas
              //  OÙ. Les reperdre obligerait à répondre deux fois.
              debut_le: mode.debut_le,
              fin_le: mode.fin_le,
            }
          : mode
      )
    );
  }

  /** LES CHAMPS D'UN LIEU — le rôle puis la localisation. */
  function lesChamps(session: ModeEnSaisie) {
    //  ██ nº 750 ter — LA CONVENTION A SES PROPRES CHAMPS ██
    //  Elle n'emprunte RIEN aux trois autres genres : ni rôle, ni
    //  recherche de portfolio, ni saisie d'adresse. Un menu de pays,
    //  un badge, des dates — voir `laConvention`.
    if (session.genre === "convention") return laConvention(session);
    //  ██ nº 752 — LA SESSION GUEST A SON PROPRE ORDRE ██
    //  Les dates ouvrent l'encadré, la question suit, et le lieu ne
    //  vient qu'après — quand il vient. Voir `leGuest`.
    if (session.genre === "guest") return leGuest(session);
    return (
      <div className="flex flex-col gap-5">
        {leRole(session)}
        {leLieu(session)}
      </div>
    );
  }

  /** LA LIGNE DE CONFIRMATION — elle remplace les champs du lieu que
      la croix vise, quand du travail se perdrait.
      ⚠️ UN SEUL MOT DEPUIS LA PASSE Nº 125 : « Supprimer ? », pour
      les cinq modes — le même vocabulaire que la fenêtre d'une
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
      confirmation, pour les cinq modes. */
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
                   hover:bg-sombre-eleve hover:text-sombre-texte
                   active:bg-sombre-eleve active:text-sombre-texte"
      >
        <IconeCroix taille={16} />
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
      {/* LE SÉLECTEUR — TROIS RECTANGLES (nº 125 ; quatre le temps
          des nº 414-417, trois de nouveau depuis la nº 418) :
          Studio · Salon · Guest, l'ordre dicté.
          ⚠️ UNE SEULE LIGNE, PARTOUT — Y COMPRIS AU DOIGT. C'est le
          réglage de la nº 402, rétabli : les deux lignes de deux
          n'existaient QUE parce qu'un quatrième mot devait tenir
          (les mots des quatrièmes modes faisaient ~67 à ~70 px à
          14 px semi-gras, quand quatre rectangles n'en laissent que
          ~64 à 320 px). À trois, chaque rectangle fait ~101 px pour un mot
          d'au plus ~44 px (« Studio », mesuré sur le Geist servi) :
          la ligne unique tient au doigt comme au large, sans
          variante.
          Le reste ne bouge pas : mêmes angles (rounded-lg), même
          remplissage (py-2.5), mêmes couleurs, mot centré.
          UN MANQUE DE CHOIX : les trois mots rougissent — rien
          d'autre (règle nº 111).
          L'ARIA NE BOUGE PAS : radiogroup + radio/aria-checked. */}
      <div
        role="radiogroup"
        aria-label="Le mode d'activité"
        //  nº 750 — la grille suit le NOMBRE de modes (voir
        //  COLONNES_SELECTEUR) : trois tenaient sur une ligne, quatre
        //  se rangent en deux lignes de deux.
        className={`grid ${GRILLE_SELECTEUR} gap-2`}
      >
        {ORDRE_SELECTEUR.map((genre) => {
          const actif = genreAffiche === genre;
          const enFauteGenre = Boolean(
            manque && manque.cle === null && manque.champ === "genre"
          );
          /*  §2 (nº 266) — L'ENCADREMENT DU BADGE ROUGIT quand CE
              mode-là est incomplet : c'est le CADRE qui le dit, jamais
              le mot ni le fond — le badge garde sa robe, son rose
              d'actif et sa lisibilité. On voit ainsi d'un coup d'œil
              LEQUEL des cinq modes réclame quelque chose, même
              onglet fermé : le manque désigné porte la clé d'un mode
              (`manque.cle`), et ce mode a son genre.
              ⚠️ RIEN N'EST INVENTÉ : `border-erreur` est l'encadré
              rouge des champs manquants, la seule écriture d'erreur du
              site. Au repos, la bordure est transparente — la boîte ne
              change donc jamais de taille. */
          //  §1 (nº 267) — TOUS les modes de ce genre qui manquent
          //  de quelque chose, plus seulement celui du premier manque.
          const cadreRouge = modes.some(
            (mode) => mode.genre === genre && modeEnManque(mode.cle)
          );
          return (
            <button
              key={genre}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => choisirOnglet(genre)}
              data-badge-mode={genre}
              data-badge-en-faute={cadreRouge ? "" : undefined}
              className={`rounded-lg border px-1 py-2.5 text-center transition-colors ${
                cadreRouge ? "border-erreur" : "border-transparent"
              } ${
                actif
                  ? "bg-sombre-eleve-clair"
                  : "bg-sombre-eleve hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair"
              }`}
            >
              {/* Trois mots courts sur une ligne (nº 402, rétabli
                  nº 418) : chacun a sa place même à 320 px. */}
              <span
                /*  ██ §3 (nº 420) — PLUS AUCUN ROSE SUR DU TEXTE ██
                 LA RÈGLE, posée par le propriétaire pour TOUT le
                 formulaire : le texte reste BLANC en toutes
                 circonstances, et c'est le FOND — lui seul — qui dit la
                 sélection et le survol.
                 LA RÉFÉRENCE EST DÉJÀ DANS LE SITE : les encadrés de
                 rendu du portfolio (Noir / Noir et gris / Couleur,
                 BlocPortfolio). La nº 309 y avait fait quitter le rose
                 au titre, la nº 311 l'a rendu BLANC DANS LES DEUX
                 ÉTATS, la nº 405 a retiré jusqu'au trait rose : « le
                 fond dit tout ». On ne fait ici que généraliser leur
                 traitement — aucun jeton neuf. */
                className={`block text-[14px] font-semibold ${
                  enFauteGenre ? "text-erreur" : "text-sombre-texte"
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
          {/*  nº 750 ter — LES QUATRE MODES PARTAGENT DE NOUVEAU CE
               RENDU. La nº 750 bis avait donné aux conventions un
               rendu à part (des badges au lieu d'un encadré) ; le
               propriétaire le juge trop large. Un encadré de
               convention se lit et se remplit comme un guest — c'est
               `lesChamps` qui sait ce qu'il contient.
               ██ nº 751 — « AUTRE » EST LE SEUL À NE PAS LE PARTAGER ██
               Et ce n'est pas un caprice d'écran : ce mode n'a QU'UN
               bloc par artiste (décision du propriétaire). Ses lignes
               — une par zone — ne sont pas des « lieux » qu'on
               empilerait en volets numérotés « Autre 2/3 » : ce sont
               les capsules d'une même réponse. Le panneau saute donc
               ici la liste ET le bouton d'ajout, et rend le bloc. */}
          {genreAffiche === "independent" ? (
            leBlocAutre()
          ) : nombre <= 1 ? (
            /* ---------- UN SEUL LIEU : les champs, directement.
                L'intertitre porte le nom du mode SANS numéro (« seul
                de son type ») — et SANS CROIX (passe nº 125) : elle
                n'apparaît qu'à partir de deux lieux, sur les volets.
                Un lieu unique se corrige champ par champ (la croix du
                champ de localité, le retrait de l'établissement). */
            sessionsAffichees.map((session) => (
              /*  §3 (nº 272) — LA CLÉ VA SUR LE BLOC ENTIER DU MODE,
                  plus sur tel ou tel champ. La nº 269 n'avait gravé
                  l'identité que sur les deux champs de lieu : tout le
                  reste (le portfolio trouvé, la recherche en cours,
                  l'adresse tapée, le nom du lieu) continuait de se
                  partager par POSITION dans l'arbre — et la bascule de
                  nature d'un guest, qui ne change ni le genre ni la
                  clé, ne remontait rien du tout. L'identité complète —
                  genre, clé, ET nature du lieu — fait de chaque mode
                  une instance à part : aucun état ne peut plus être
                  retenu par une position. Changer la nature d'un guest
                  remonte son bloc, comme la règle de la nº 265 efface
                  son lieu : l'écran et la donnée disent enfin la même
                  chose. Les DONNÉES du mode (rôle, dates, rayon),
                  elles, vivent dans `modes` et se repeignent — rien ne
                  se perd à la remontée. */
              <div key={`${session.genre}-${session.cle}-${session.natureLieu ?? ""}`}>
                <div className="flex min-h-[36px] items-center">
                  {/*  §2 (nº 266) — MÊME RÈGLE POUR LE LIEU UNIQUE :
                       son intertitre rougit quand c'est lui qui
                       manque. Il n'a pas de numéro (il est seul de son
                       type), le reste ne change pas. */}
                  <span
                    data-titre-volet={session.cle}
                    data-titre-en-faute={
                      modeEnManque(session.cle) ? "" : undefined
                    }
                    className={`${TITRE_INTERTITRE}${
                      modeEnManque(session.cle) ? " text-erreur" : ""
                    }`}
                  >
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
                  /*  §3 (nº 272) — LA MÊME CLÉ DE BLOC que le lieu
                      unique (voir plus haut) : l'accordéon n'est pas
                      un second dessin, chaque volet est une instance
                      à part entière. */
                  <li
                    key={`${session.genre}-${session.cle}-${session.natureLieu ?? ""}`}
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
                        {/*  §2 (nº 266) — LE TITRE NUMÉROTÉ ROUGIT
                             quand c'est CE volet-là qui est incomplet :
                             « À domicile 2/2 » en rouge dit lequel des
                             deux réclame quelque chose, même replié.
                             Aucune phrase — la couleur, et rien
                             d'autre. */}
                        <span
                          data-titre-volet={session.cle}
                          data-titre-en-faute={
                            modeEnManque(session.cle) ? "" : undefined
                          }
                          className={`text-[14px] font-semibold uppercase
                                     tracking-[0.1em] transition-colors ${
                                       modeEnManque(session.cle)
                                         ? "text-erreur"
                                         : deplie
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
              modes (passe nº 124). Le Guest garde son libellé.
              ██ nº 751 — SAUF « AUTRE », QUI N'EN A PAS ██
              Un seul bloc par artiste (décision du propriétaire) : ce
              bouton en ouvrirait un second. Ses zones s'ajoutent DANS
              le bloc, par le champ de ville — un geste, pas deux. */}
          {genreAffiche !== "independent" && (
          <button
            type="button"
            //  nº 750 ter — LA CONVENTION AJOUTE UN ENCADRÉ, COMME LES
            //  TROIS AUTRES : la nº 750 bis lui avait fait ouvrir un
            //  écran depuis ce bouton ; l'écran s'ouvre désormais
            //  DEPUIS L'ENCADRÉ, une fois le pays choisi. Ce bouton
            //  retrouve donc son seul et unique rôle.
            onClick={() => ajouterUnLieu(genreAffiche)}
            /*  ██ §2 (nº 419) — LA PALETTE DU FORMULAIRE, ICI AUSSI ██
                 CE QU'IL PORTAIT : `bg-sombre-eleve` au repos,
                 `bg-sombre-eleve-clair` au survol — la paire du MOTEUR
                 (`ROBE_CHAMP_SOMBRE`), pas celle du FORMULAIRE. Il
                 paraissait donc un cran trop gris à côté des champs
                 qu'il prolonge. Il prend la paire des champs : repos
                 `bg-sombre-eleve-clair`, survol `bg-sombre-haut` — les
                 deux mêmes jetons que le bouton refermé d'un lien
                 (LienLibre, nº 409-§2).
                 ⚠️ UNE SEULE ÉCRITURE POUR LES TROIS MODES : ce bouton
                 est rendu une fois, son libellé seul change
                 (`MOTS_AJOUT` / « + Ajouter une autre date »). Le
                 défaut valait donc pour Studio, Salon ET Guest, et la
                 correction aussi — il n'y a rien à répéter. */
            //  §3 (nº 420) — TEXTE BLANC DANS LES DEUX ÉTATS : le
            //  fond dit le survol, le mot ne change plus de couleur
            //  (la règle des encadrés de rendu, généralisée).
            className="mt-5 w-fit rounded-full bg-sombre-eleve-clair px-4 min-h-[40px]
                       text-[13.5px] font-semibold text-sombre-texte
                       transition-colors hover:bg-sombre-haut
                       active:bg-sombre-haut"
          >
            {/*  nº 750 ter — LA CONVENTION PREND LE MOT DU GUEST :
                 ce qu'on ajoute est une PRÉSENCE de plus (une autre
                 convention, d'autres dates), pas un lieu de plus. */}
            {genreAffiche === "guest" || genreAffiche === "convention"
              ? "+ Ajouter une autre date"
              : `+ Ajouter ${MOTS_AJOUT[genreAffiche]}`}
          </button>
          )}
        </div>
      )}

      {/* ---------- L'ÉCRAN DE SÉLECTION D'UNE CONVENTION (nº 750 ter)
          Monté seulement quand un encadré l'a demandé — comme la
          fenêtre des styles. Il porte SES DEUX SURFACES lui-même
          (fenêtre au web, page plein écran au doigt) ; il ne reçoit
          d'ici que le PAYS de cet encadré-là, et n'en rapporte qu'une
          convention. */}
      {fenetreConventions && (
        <FenetreConventions
          catalogue={catalogue}
          codePays={
            modes.find((mode) => mode.cle === fenetreConventions)
              ?.paysConvention ?? ""
          }
          dejaChoisies={
            modes
              .filter((mode) => mode.genre === "convention" && mode.convention)
              .map((mode) => mode.convention?.id ?? "") as string[]
          }
          surChoix={choisirLaConvention}
          surFermer={() => setFenetreConventions(null)}
          ficheId={ficheId}
        />
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
