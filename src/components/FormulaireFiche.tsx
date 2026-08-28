"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
//  §1 (nº 506) — la pile de fenêtres superposées enveloppe les DEUX
//  vues : montée dans l'aperçu seul, elle se démontait elle-même en
//  changeant l'adresse (voir sa note, plus bas).
import { PileFiches } from "@/components/PileFiches";
import {
  BIO_MAXIMUM,
  FILTRES_TATOUAGE,
  aDesHoraires,
  natureDeLaFiche,
  CHOIX_PROFIL,
  libelleStyle,
  MOTIFS_MODERATION,
  type TypeFiche,
} from "@/config/tatouage";
import { longueurVisible } from "@/lib/emojis";
import { BlocAutreAdresse } from "@/components/BlocAutreAdresse";
import { BlocEquipeSalon } from "@/components/BlocEquipeSalon";
import { BlocHorairesStudio } from "@/components/BlocHorairesStudio";
import { BlocPortfolio, type PhotoEnSaisie } from "@/components/BlocPortfolio";
import { BlocModesExercice, modeNeuf } from "@/components/BlocModesExercice";
import { BlocStudios } from "@/components/BlocStudios";
import {
  fuseauDuLieu,
  semaineDepuisBase,
  semaineVersBase,
} from "@/lib/horaires-studio";
import {
  creerLesRattachementsEnAttente,
  demanderLesRattachements,
  enregistrerExercice,
} from "@/lib/enregistrer-exercice";
import {
  blocExerciceComplet,
  cleNeuve,
  lieuDeReference,
  membreDepuisVue,
  modeComplet,
  modeVide,
  tousLesManques,
  raisonBlocIncomplet,
  type MembreEquipe,
  type ModeEnSaisie,
  type ModeExerciceFiche,
  type StudioEnSaisie,
  type StudioFiche,
} from "@/lib/modes-exercice";
import {
  natureConnue,
  RENDU_PAR_DEFAUT,
  stylesDuPortfolio,
} from "@/lib/photos-tatoueur";
import { enregistrerPhotos } from "@/lib/enregistrer-photos";
import { televerserPhotos } from "@/lib/televerser-photos";
import { FenetreEnvoi } from "@/components/FenetreEnvoi";
import { Patience, SqueletteFormulaire } from "@/components/Squelette";
//  §1 (nº 657) — LA PHOTO RONDE ET LE CHAMP DU NOM, PARTAGÉS avec la
//  fenêtre « Modifier » du particulier : le même code, pas une
//  imitation (la consigne du propriétaire).
import {
  ChampNomIdentite,
  ChampPhotoRonde,
} from "@/components/ChampsIdentite";
import { ChampBio } from "@/components/ChampBio";
import { ChampLienVerifie } from "@/components/ChampLienVerifie";
import {
  LIEN_LIBRE_VIDE,
  LienLibre,
  TITRE_LIEN_MAXIMUM,
  erreurDuLienLibre,
  type LienLibreSaisie,
} from "@/components/LienLibre";
import { libelleDuLien, normaliserUrlLibre } from "@/lib/liens-fiche";
import { MenuDeroulant, type OptionMenu } from "@/components/MenuDeroulant";
import { FicheTatoueur } from "@/components/FicheTatoueur";
import {
  IconeCocheListe,
  IconeHorsLigne,
  IconeHorloge,
  IconeInstagram,
} from "@/components/Icones";
//  §1 (nº 664) — la pastille d'événement de la famille : les deux
//  tailles, les quatre tons et l'épaisseur du trait, écrits une fois.
import { PastilleEvenement } from "@/components/PastilleEvenement";
import { Interrupteur } from "@/components/Interrupteur";
import { useAppareilMobile } from "@/lib/appareil";
import type { NatureEtablissement } from "@/config/tatouage";
import { lieuDepuisFiche, type LieuTrouve } from "@/lib/geocodage";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { redirectionDeGarde } from "@/lib/journal-de-bord";
import { marquerTravailEnCours } from "@/lib/travail-en-cours";
import { useUtilisateur } from "@/lib/use-utilisateur";
//  §1 (nº 645) — l'avatar de la barre, rangé dans la session : une
//  seule écriture, deux appelants (ici et le menu du compte).
//  §1 (nº 675) — l'identité affichée (photo + nom), rangée en un seul
//  appel : la règle et son écriture vivent chez `avatar-du-compte`.
import {
  avatarDuCompte,
  nomAffiche,
  rangerLIdentiteAffichee,
} from "@/lib/avatar-du-compte";
import { MANQUE, texteErreur } from "@/lib/erreurs-formulaire";
import { OngletsLigne } from "@/components/OngletsLigne";
import { slugFiche, slugifier } from "@/lib/slug";
import type { Tatoueur } from "@/lib/tatoueurs";
import { mecanismeCoupe } from "@/lib/variantes-essai";
import {
  chargerFichesDuCompte,
  ficheActive,
  memoriserFiche,
} from "@/lib/fiches-compte";
//  §1 (nº 660) — la trace permanente : ce défilement se signe.
import { noterNavigation } from "@/lib/boite-noire";

/**
 * L'ESPACE TATOUEUR — le formulaire de fiche, et son menu
 * ========================================================
 * PREMIÈRE VENUE (aucune fiche) : le formulaire de création, sept
 * sections dans l'ordre où l'on se présente — nom, adresse, bio,
 * styles + photos (4:5, recadrées), pratiques, réseaux.
 *
 * FICHE EXISTANTE : le formulaire PRÉ-REMPLI (« Modifier ma
 * fiche »). AUCUN badge ni bannière d'état sur la page : l'état vit
 * dans le menu « Mon espace » de la barre. À la place, ARRIVER sur la
 * vue « Modification » pendant qu'une version attend la relecture
 * ouvre une FENÊTRE D'ANNONCE soignée (« Ta fiche est en cours de
 * validation… ») — rien quand la fiche est déjà en ligne. Seuls les
 * MOTIFS d'une demande de modifications restent affichés en tête du
 * formulaire : c'est une consigne de travail, pas un état.
 * LA NAVIGATION NE VIT PLUS SUR CETTE PAGE : c'est le menu « Mon
 * espace » de la barre fixe (MenuEspace) qui porte l'état et les
 * entrées Modification / Ma fiche / Déconnexion. La VUE affichée ici
 * suit l'adresse : ?vue=apercu montre « MA FICHE », l'aperçu PUBLIC
 * réel (carrousel, badges, bio mise en forme) SANS partage, sans
 * signalement — et sans aucune mention d'état ; sans paramètre, le
 * formulaire.
 *
 * À L'ENVOI : les photos partent dans Supabase Storage (dossier du
 * compte, règles d'accès dans supabase/yokofolio-fiches-tatoueurs.sql),
 * puis la fiche est enregistrée NON PUBLIÉE, statut « en_attente » —
 * rien n'est en ligne avant la vérification (moins de 24 heures).
 *
 * L'espace est réservé aux comptes connectés ; un compte n'a qu'UNE
 * fiche.
 */

/** Le bucket des photos de fiche (créé par la migration SQL). */
const BUCKET_PHOTOS = "photos-tatoueurs";

/*  §1 (nº 657) — `CIBLE_PROFIL` A DISPARU AVEC LE RECADREUR : elle
    distinguait la photo de profil des slugs de style dans un
    sélecteur de fichier que les deux se partageaient. Ce partage a
    cessé à la nº 118 ; la constante ne désignait plus qu'un seul cas.
    La photo ronde a désormais son composant (ChampsIdentite). */

/** Nettoie et valide un lien de réseau ; null = lien invalide. */
function normaliserLien(
  brut: string,
  forme: RegExp
): string | null | undefined {
  const texte = brut.trim();
  if (!texte) return undefined; // champ vide : pas une erreur en soi
  const avecProtocole = /^https?:\/\//i.test(texte)
    ? texte
    : `https://${texte}`;
  return forme.test(avecProtocole) ? avecProtocole : null;
}

const FORME_INSTAGRAM = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{2,}\/?$/i;

/**
 * §2 (nº 270) — LE CHAMP BOOKING : TROIS ENTRÉES, MOT POUR MOT.
 * L'état des carnets se DÉCLARE, il ne se devine pas — et c'est une
 * information OBLIGATOIRE du formulaire (voir `valider`). Les valeurs
 * ('ouvert' | 'delai' | 'ferme') sont celles de la colonne
 * `tatoueurs.booking` (migration supabase/yokofolio-booking.sql).
 */
const OPTIONS_BOOKING: OptionMenu[] = [
  { value: "ouvert", label: "Booking ouvert" },
  { value: "delai", label: "Booking délai d'attente" },
  { value: "ferme", label: "Booking fermé" },
];

/** Sur « délai d'attente » SEULEMENT, le champ se divise : le second
    encadré propose le nombre de mois, de 1 à 12 — rien d'autre. */
const OPTIONS_BOOKING_MOIS: OptionMenu[] = Array.from(
  { length: 12 },
  (_, rang) => ({ value: String(rang + 1), label: `${rang + 1} mois` })
);
//  ⚠️ LA FORME DU SITE WEB A DÉMÉNAGÉ (passe nº 116) : les deux
//  emplacements « Ajouter un lien » la lisent dans lib/liens-fiche
//  (`FORME_URL_LIBRE` / `normaliserUrlLibre`) — une seule autorité.

/** L'HABILLAGE COMMUN DES CHAMPS (passe nº 112) — PLUS AUCUN CONTOUR.
    Le fond seul dit le champ : un cran plus clair que le bloc, comme
    le bloc est un cran plus clair que la page.
    ⚠️ LE FOCUS N'EST PLUS ROSE (passe nº 116) : cliquer dans un champ
    ÉCLAIRCIT TRÈS LÉGÈREMENT son fond, et le curseur clignote — rien
    d'autre. Le rose est réservé à ce qui compte : badges sélectionnés,
    bouton final, ligne du sélecteur.
    La bordure reste dans la boîte, TRANSPARENTE, pour UNE seule
    raison désormais : l'ERREUR la teinte en rouge — un manque se
    signale toujours. Transparente par défaut, elle ne décale rien
    quand elle s'allume. */
//  §1 (nº 266) — L'ÉCRITURE D'UN CHAMP A DÉMÉNAGÉ dans
//  `champs-formulaire` : le champ du nom d'un lieu (bloc 1) la partage
//  désormais, et un import depuis ce fichier-ci aurait fermé un cercle.
//  Aucune valeur n'a changé.

/**
 * LES BLOCS DU FORMULAIRE — LEUR ORDRE, LEUR NUMÉRO, LEURS DEUX NOMS
 * ===================================================================
 * Un artiste et un studio ne remplissent pas la même fiche, et ne
 * l'appellent pas pareil : « Votre photo » devient « Logo du studio »,
 * « Vos styles & Galerie » devient « Styles du studio & Galerie ». Les
 * deux jeux de noms vivent ICI, côte à côte : impossible d'en changer
 * un et d'oublier l'autre.
 *
 * ⚠️ LE NUMÉRO N'EST PLUS ÉCRIT NULLE PART AILLEURS — il se DÉDUIT de
 * la position dans `ORDRE_BLOCS`. Le nº 8 apparaissait deux fois (les
 * réseaux avaient hérité, par copier-coller, du numéro ET du titre du
 * portfolio) ; un numéro tapé à la main finit toujours par mentir.
 *
 * LE BLOC 1 N'EST PAS DANS LA LISTE : c'est le type de fiche et le
 * lieu de travail, il ouvre la marche et ne change jamais de nom.
 * LES HORAIRES NON PLUS : ils font partie de la déclaration d'une
 * adresse et vivent DANS le bloc 1, sous chaque studio — ils n'ont
 * jamais eu de numéro à eux (voir BlocStudios).
 *
 * ⚠️ TOUT SE TUTOIE CÔTÉ ARTISTE — comme le reste du site. Côté
 * studio, les noms parlent de L'ÉTABLISSEMENT et non de la personne
 * (« Logo du studio », « À propos du studio ») : il n'y a donc
 * personne à tutoyer, et ils restent tels quels.
 */
const ORDRE_BLOCS = [
  //  ⚠️ DEUX FUSIONS À LA PASSE Nº 112 :
  //  · PROFIL réunit le logo, le nom, la bio et les réseaux — quatre
  //    encadrés numérotés pour dire « qui je suis », c'était quatre
  //    étapes pour un seul geste. Les titres d'encadrés sont devenus
  //    les INDICATIONS des champs (voir INDICATIONS_CHAMPS) ;
  //  · ORGANISATION réunit l'équipe et l'autre adresse — les deux
  //    champs portent leur propre question, les titres ne disaient
  //    rien de plus.
  //  ⚠️ SEULE LA PRÉSENTATION FUSIONNE, comme pour les spécificités :
  //  les colonnes en base, la validation et la fiche publique gardent
  //  leurs champs distincts.
  "profil",
  "portfolio",
  "specificites",
  //  LES HORAIRES ne concernent qu'un SALON — un lieu qui reçoit du
  //  public. Un studio privé les SAUTE, et garde le trou dans la
  //  numérotation : le numéro vient de la position, jamais d'un
  //  comptage à l'écran (deux fiches du même site appellent la même
  //  chose par le même nom).
  "horaires",
  "organisation",
] as const;

type CleBloc = (typeof ORDRE_BLOCS)[number];

/**
 * ⚠️ TROIS COLONNES, PLUS DEUX (passe nº 101).
 * `TypeFiche` ne connaît que deux valeurs — « artiste » et « salon » —
 * et un STUDIO PRIVÉ est, en base, une fiche de type « salon ». La
 * colonne « salon » servait donc aux DEUX, et elle disait « studio » :
 * un vrai salon lisait « Nom du studio », « Logo du studio ».
 * Les titres suivent maintenant la NATURE affichée (voir
 * `natureDeLaFiche`) : un salon parle de son salon, un studio privé de
 * son studio, un artiste de lui-même.
 */
const NOMS_BLOCS: Record<
  CleBloc,
  { artiste: string; salon: string; prive: string }
> = {
  //  UN SEUL MOT POUR LES TROIS NATURES : le bloc dit « qui je
  //  suis » — c'est un PROFIL, qu'on soit artiste, studio ou salon.
  //  Les anciens titres (« Ton nom d'artiste », « Logo du salon »…)
  //  vivent désormais DANS les champs (INDICATIONS_CHAMPS).
  profil: { artiste: "Profil", salon: "Profil", prive: "Profil" },
  //  §3 (nº 536) — « Yoko Portfolio » DEVIENT « Portfolio » : la marque
  //  est déjà écrite en haut de l'écran, un titre de bloc n'a pas à la
  //  répéter. C'est le seul endroit du site où ces deux mots étaient
  //  accolés — vérifié.
  portfolio: {
    artiste: "Portfolio",
    salon: "Portfolio",
    prive: "Portfolio",
  },
  specificites: {
    artiste: "Spécificités",
    salon: "Spécificités",
    prive: "Spécificités",
  },
  /** N'EXISTE QUE POUR UN SALON — la colonne « artiste » reste
      remplie pour que le type tienne, elle n'est jamais affichée.
      ⚠️ RENOMMÉ « Horaires » (passe nº 116, point 14) : le bloc ne
      contient que des heures d'ouverture, « d'ouverture » ne disait
      rien de plus. */
  horaires: { artiste: "", salon: "Horaires", prive: "" },
  //  ÉQUIPE + AUTRE ADRESSE, sous un seul mot : ce que le lieu
  //  ORGANISE autour de lui — qui y travaille, où il est aussi.
  organisation: {
    artiste: "Organisation",
    salon: "Organisation",
    prive: "Organisation",
  },
};

/**
 * LES ANCIENS TITRES D'ENCADRÉS, DEVENUS INDICATIONS DE CHAMPS
 * (passe nº 112). Le champ du nom porte « Nom du salon », celui de la
 * bio « À propos du salon » — la même formulation qu'avant, posée LÀ
 * OÙ ON ÉCRIT plutôt qu'au-dessus d'un encadré entier.
 */
const INDICATIONS_CHAMPS: Record<
  "nom" | "bio",
  { artiste: string; salon: string; prive: string }
> = {
  nom: {
    artiste: "Ton nom d'artiste",
    salon: "Nom du salon",
    prive: "Nom du studio",
  },
  bio: {
    artiste: "Ta présentation",
    salon: "À propos du salon",
    prive: "À propos du studio",
  },
};

/** L'indication du champ pour la nature de fiche en cours. */
function indicationChamp(
  cle: "nom" | "bio",
  type: TypeFiche | null,
  etablissement?: string | null
): string {
  return INDICATIONS_CHAMPS[cle][natureDeLaFiche(type, etablissement)];
}

/**
 * LES TROIS INTERTITRES DU BLOC « SPÉCIFICITÉS ».
 * ⚠️ ILS NE VIENNENT PAS DE `FILTRES_TATOUAGE.titre` : « Technique »
 * et « Besoins » sont les mots du MOTEUR DE RECHERCHE, ceux qui
 * coiffent les colonnes d'interrupteurs côté visiteur. Dans le
 * formulaire, on ne coche pas un filtre, on déclare une pratique — et
 * la formulation change avec la personne : un artiste MAÎTRISE des
 * techniques, un lieu en PROPOSE.
 */
function sousTitreSpecificites(groupe: string, type: TypeFiche | null): string {
  if (groupe === "technique") {
    return type === "salon" ? "Techniques proposées" : "Techniques maîtrisées";
  }
  if (groupe === "composition") return "Types de projets";
  return "Besoins particuliers";
}

/** Le numéro affiché devant le titre — la position dans la liste,
    décalée d'un cran par le bloc 1 (type et lieu de travail). */
function numeroBloc(cle: CleBloc): string {
  return String(ORDRE_BLOCS.indexOf(cle) + 2);
}

/** Le titre du bloc pour la NATURE de fiche en cours — artiste, salon
    ou studio privé. `etablissement` est ce qui distingue les deux
    derniers ; sans lui, un studio privé lirait les mots du salon. */
function titreBloc(
  cle: CleBloc,
  type: TypeFiche | null,
  etablissement?: string | null
): string {
  return NOMS_BLOCS[cle][natureDeLaFiche(type, etablissement)];
}

/** Une section du formulaire : un encadré, un titre — PLUS AUCUNE
    consigne (les sous-titres ont disparu, le titre dit tout).
    `id` : l'ancre du défilement automatique vers la première erreur.

    ⚠️ PLUS D'ALERTE SUR L'ENCADRÉ (passe nº 117, point 11). Une
    section entière se cerclait de rouge dès qu'une information y
    manquait : sur douze blocs, cela peignait en rouge une surface
    grande comme l'écran pour désigner UNE case à cocher. La règle est
    désormais sans exception — SEUL CE QUI MANQUE SE SIGNALE : le
    champ, l'intertitre de la famille, le cercle du logo. Jamais le
    bloc. Le défilement automatique amène déjà l'œil au bon endroit
    (voir ORDRE_ERREURS), et les intertitres de « Spécificités »
    rougissent famille par famille.

    ⚠️ LE TRAITEMENT DES PASSES Nº 104-105 — un contenant DISCRET :
    · L'ENCADRÉ EST LÀ SUR TOUS LES ÉCRANS (nº 105) : la version bord
      à bord de la nº 104 rendait le parcours illisible au téléphone —
      sur douze blocs, c'est le cadre qui dit où finit une section.
      Le GAIN DE LARGEUR vient désormais des marges : gouttière de
      page ramenée à 12 px, marges intérieures à 16 px — le contenu y
      gagne 16 px par rapport à l'avant-refonte, cadre conservé ;
    · une carte aux angles larges et au bord adouci (70 % d'opacité)
      — elle délimite sans peser ;
    · LE TITRE monte à 18 px, le numéro rose passe en petit corps :
      c'est le NOM du bloc qu'on lit, le numéro n'est qu'un repère.
    `mention` : la précision secondaire (« (facultatif) ») — posée À
    CÔTÉ du titre mais HORS du <h2>, pour que le nom du bloc reste
    propre à la lecture (et aux tests, qui lisent le h2). */
function Section({
  numero,
  titre,
  mention,
  id,
  children,
}: {
  numero: string;
  titre: string;
  mention?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id}>
      {/* ⚠️ PLUS DE CONTOUR DU TOUT (passes nº 112 puis nº 117) : le
          bloc est un fond un cran plus clair que la page, et c'est
          tout — fond ET bordure disaient la même chose deux fois.
          ⚠️ L'ENCADRÉ EST DE RETOUR SUR SMARTPHONE (passe nº 128). La
          nº 119 l'avait supprimé pour rendre 16 px de largeur,
          remplacé par des filets et de grands vides — le résultat
          était brouillon : on ne voyait plus où un bloc commence ni
          où il finit. Le CHOIX EST ANNULÉ : la carte revient, dans le
          même traitement léger que le web — un fond un cran plus
          clair, des angles ronds, rien d'autre. Elle se contente de
          16 px de remplissage latéral (contre 28 sur le web) : à
          320 px d'écran, le contenu garde 256 px utiles.
          LE FILET ENTRE LES BLOCS (nº 124) DISPARAÎT : l'encadré fait
          ce travail — et avec lui tout le rythme posé à la nº 125
          (48 px de vide, 28 avant le trait, 20 après), qui n'avait de
          sens que sans carte.
          ⚠️ LE TITRE VIT AU-DESSUS DE L'ENCADRÉ, PARTOUT (passe
          nº 128) : ce que la nº 125 avait fait sur le web vaut
          maintenant aussi sur smartphone — même taille de titre des
          deux côtés (18 px, numéro 15), et la MARGE GAUCHE du titre
          s'aligne sur le TEXTE de la carte, pas sur son bord : px-4
          reproduit le retrait intérieur mobile comme sm:px-7 reproduit
          celui du web. */}
      <div className="flex items-baseline gap-2.5 px-4 sm:px-7">
        <h2 className="flex items-baseline gap-2.5 text-[18px] font-semibold tracking-tight text-sombre-texte">
          {/* LE NUMÉRO, ENTRE LES DEUX (passe nº 107). À 13 px il se
              lisait comme une note de bas de page ; à la taille du
              titre — essayée à la passe nº 106 — il pesait autant que
              lui. Cinq sixièmes du titre : parfaitement lisible, et
              clairement second. */}
          <span className="text-[15px] font-bold text-primaire tabular-nums">
            {numero}
          </span>
          {titre}
        </h2>
        {mention && (
          <span className="text-[13px] text-sombre-texte-doux">{mention}</span>
        )}
      </div>
      {/* C'EST CE CONTENEUR QUI EST L'ENCADRÉ (nº 125 sur le web,
          nº 128 partout) : fond, angles et remplissages vivent ici,
          sous le titre — `mt-3` (12 px) l'attache à sa carte, plus
          près d'elle que du bloc précédent (32 px sur téléphone,
          24 sur le web). Les angles suivent le remplissage : 16 px de
          rayon pour 16 px de retrait sur téléphone, 24 pour 28 sur le
          web — un grand rayon sur une petite carte mangerait les
          angles du contenu. */}
      <div className="mt-3 flex flex-col gap-5 bg-sombre-carte rounded-xl px-4 py-6 sm:px-7 sm:py-7">
        {children}
      </div>
    </section>
  );
}

/** UN MODE EN SAISIE, traduit pour L'APERÇU de la fiche — l'aperçu
    doit montrer ce qui est à l'écran, pas ce qui dort en base. */
function apercuDuMode(mode: ModeEnSaisie, rang: number): ModeExerciceFiche {
  const source = mode.salon ?? mode.lieu;
  return {
    id: mode.id ?? `apercu-${rang}`,
    // UN ENCADRÉ SANS GENRE CHOISI n'a rien à montrer : `modeComplet`
    // l'écarte avant d'arriver ici. Le repli ne sert qu'au typage.
    genre: mode.genre || "salon",
    //  L'APERÇU SUIT L'ENREGISTREMENT (voir enregistrer-exercice) :
    //  le rôle vaut pour le salon ET pour le studio privé.
    role:
      mode.genre === "salon" || mode.genre === "prive"
        ? (mode.role ?? null)
        : null,
    salon_id: mode.salon?.id ?? null,
    salon_nom: mode.salon?.nom ?? null,
    salon_slug: mode.salon?.slug ?? null,
    salon_photo: mode.salon?.photo ?? null,
    intitule: mode.salon?.adresse ?? mode.lieu?.intitule ?? null,
    adresse: source?.adresse ?? null,
    code_postal: source?.code_postal ?? null,
    ville: source?.ville ?? null,
    region: source?.region ?? null,
    pays: source?.pays ?? null,
    code_pays: source?.code_pays ?? null,
    latitude: source?.latitude ?? null,
    longitude: source?.longitude ?? null,
    lieu_id: mode.lieu?.identifiant ?? mode.salon?.lieu_id ?? null,
    debut_le: mode.genre === "guest" ? mode.debut_le || null : null,
    fin_le: mode.genre === "guest" ? mode.fin_le || null : null,
    ordre: rang,
  };
}

/** Le même pour un studio. */
function apercuDuStudio(studio: StudioEnSaisie, rang: number): StudioFiche {
  return {
    id: studio.id ?? `apercu-studio-${rang}`,
    nom: studio.nom.trim() || null,
    horaires: studio.horaires ? semaineVersBase(studio.horaires) : null,
    fuseau: fuseauDuLieu(studio.lieu?.code_pays, studio.lieu?.longitude),
    intitule: studio.lieu?.intitule ?? null,
    adresse: studio.lieu?.adresse ?? null,
    code_postal: studio.lieu?.code_postal ?? null,
    ville: studio.lieu?.ville ?? null,
    region: studio.lieu?.region ?? null,
    pays: studio.lieu?.pays ?? null,
    code_pays: studio.lieu?.code_pays ?? null,
    latitude: studio.lieu?.latitude ?? 0,
    longitude: studio.lieu?.longitude ?? 0,
    lieu_id: studio.lieu?.identifiant ?? null,
    principal: rang === 0,
    ordre: rang,
  };
}

/** Un lieu de base, remonté dans un champ de localisation. */
function lieuDepuisLigne(ligne: {
  intitule?: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  region?: string | null;
  pays?: string | null;
  code_pays?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lieu_id?: string | null;
}): LieuTrouve | null {
  if (ligne.latitude == null || ligne.longitude == null) return null;
  const intitule = ligne.intitule ?? ligne.adresse ?? ligne.ville ?? "";
  return {
    identifiant: ligne.lieu_id ?? `lieu:${intitule}`,
    intitule,
    contexte: [ligne.ville, ligne.region, ligne.pays].filter(Boolean).join(", "),
    adresse: ligne.adresse ?? null,
    ville: ligne.ville ?? null,
    code_postal: ligne.code_postal ?? null,
    region: ligne.region ?? null,
    pays: ligne.pays ?? null,
    code_pays: ligne.code_pays ?? null,
    latitude: ligne.latitude,
    longitude: ligne.longitude,
    precision: ligne.adresse ? "adresse" : "ville",
  };
}

/**
 * LES MODES D'EXERCICE DÉJÀ ENREGISTRÉS, remontés dans le formulaire.
 * Ils gardent leur IDENTIFIANT : c'est lui qui permet, à
 * l'enregistrement, de MODIFIER la ligne plutôt que de l'effacer —
 * donc de ne pas détruire les rattachements déjà validés par les
 * salons (voir lib/enregistrer-exercice).
 * Table absente (migration nº 26 non passée) : une liste vide, et le
 * formulaire repart de l'adresse principale de la fiche.
 */
async function chargerModes(
  supabase: ReturnType<typeof creerClientSupabaseNavigateur>,
  ficheId: string
): Promise<ModeEnSaisie[]> {
  try {
    const { data, error } = await supabase
      .from("modes_exercice")
      .select("*")
      .eq("tatoueur_id", ficheId)
      .order("ordre");
    if (error || !Array.isArray(data)) return [];
    const lignes = data as unknown as ModeExerciceFiche[];
    // Le nom des salons liés, pour que la pastille de la recherche
    // interne s'affiche déjà remplie à la réouverture.
    const salonIds = [
      ...new Set(lignes.map((l) => l.salon_id).filter(Boolean) as string[]),
    ];
    const salons = new Map<
      string,
      { nom: string; slug: string; photo_profil: string | null }
    >();
    if (salonIds.length > 0) {
      const reponse = await supabase
        .from("tatoueurs")
        .select("id, nom, slug, photo_profil")
        .in("id", salonIds);
      for (const salon of (reponse.data ?? []) as unknown as {
        id: string;
        nom: string;
        slug: string;
        photo_profil: string | null;
      }[]) {
        salons.set(salon.id, salon);
      }
    }
    return lignes.map((ligne) => {
      const salon = ligne.salon_id ? salons.get(ligne.salon_id) : undefined;
      return {
        cle: cleNeuve("mode"),
        id: ligne.id,
        genre: ligne.genre,
        // LE SOUS-CHOIX (migrations nº 33 et nº 44). Une fiche d'AVANT
        // la migration n'en a pas : « En studio » y voulait dire
        // « résident », et c'est ce qu'on rétablit — plutôt que de
        // rouvrir un formulaire incomplet à qui n'a rien demandé.
        // ⚠️ UN STUDIO PRIVÉ D'AVANT LA PASSE Nº 100 n'en a pas non
        // plus : on le relit « fondateur », la position d'ouverture de
        // la bascule. Sans ce repli, la bascule s'afficherait à gauche
        // tout en portant `null`, et le premier enregistrement
        // écrirait une valeur que personne n'aurait choisie.
        role:
          ligne.role ??
          (ligne.genre === "salon"
            ? "resident"
            : ligne.genre === "prive"
              ? "fondateur"
              : null),
        //  ⚠️ LES DEUX COLONNES RÉCENTES SE RELISENT ICI, SINON ELLES
        //  SE PERDENT. Le formulaire réenregistre TOUT ce qu'il a en
        //  mémoire : une valeur non relue repartirait à `null` au
        //  premier « Enregistrer », effaçant en silence un rayon ou
        //  une nature de lieu que personne n'a retouchés.
        //
        //  ET LA MÊME INDULGENCE QUE POUR LE RÔLE, juste au-dessus :
        //  une session guest ENREGISTRÉE AVANT la migration nº 41 n'a
        //  pas de nature de lieu, et « guest » y voulait dire « invité
        //  dans un salon ». On rétablit ce sens plutôt que de rouvrir
        //  un formulaire incomplet — et plutôt que de bloquer « Je
        //  confirme » sur une base où la migration n'est pas passée.
        natureLieu:
          ligne.nature_lieu ?? (ligne.genre === "guest" ? "salon" : null),
        rayonKm: ligne.rayon_km ?? null,
        //  §1 (nº 266) — LE NOM DU LIEU SAISI À LA MAIN, relu pour la
        //  même raison que les deux colonnes ci-dessus : non relu, il
        //  repartirait à `null` au premier enregistrement. Une ligne
        //  d'avant la migration nº 266 n'en a pas — la colonne est
        //  tolérée absente (voir enregistrer-exercice).
        nomLieu:
          (ligne as unknown as { nom_lieu?: string | null }).nom_lieu ?? null,
        salon: salon
          ? {
              id: ligne.salon_id as string,
              nom: salon.nom,
              slug: salon.slug,
              photo: salon.photo_profil,
              adresse: ligne.adresse,
              code_postal: ligne.code_postal,
              ville: ligne.ville,
              region: ligne.region,
              pays: ligne.pays,
              code_pays: ligne.code_pays,
              latitude: ligne.latitude,
              longitude: ligne.longitude,
              lieu_id: ligne.lieu_id,
            }
          : null,
        lieu: salon ? null : lieuDepuisLigne(ligne),
        debut_le: ligne.debut_le ?? "",
        fin_le: ligne.fin_le ?? "",
      };
    });
  } catch {
    return [];
  }
}

/** Les studios déjà enregistrés — même principe, même tolérance. */
async function chargerStudios(
  supabase: ReturnType<typeof creerClientSupabaseNavigateur>,
  ficheId: string
): Promise<StudioEnSaisie[]> {
  try {
    const { data, error } = await supabase
      .from("studios")
      .select("*")
      .eq("tatoueur_id", ficheId)
      .order("ordre");
    if (error || !Array.isArray(data)) return [];
    return (data as unknown as StudioFiche[]).map((ligne) => ({
      cle: cleNeuve("studio"),
      id: ligne.id,
      nom: ligne.nom ?? "",
      horaires: semaineDepuisBase(ligne.horaires),
      lieu: lieuDepuisLigne(ligne),
    }));
  } catch {
    return [];
  }
}

/**
 * LE PORTFOLIO D'UNE FICHE, remonté dans le formulaire.
 * Il vient de sa table (migration nº 31).
 * ⚠️ PLUS DE REPLI `photos_styles` (passe nº 109) : ces photos-là
 * n'avaient jamais eu de rendu, et le nouveau bloc range TOUT par
 * couple style + rendu — elles n'auraient nulle part où s'afficher.
 * La migration nº 48 efface de toute façon les photos de l'ancien
 * système (fiches de test uniquement, décision du propriétaire).
 *
 * ⚠️ PLUS AUCUNE LIGNE N'EST ÉCARTÉE À LA LECTURE (passe nº 151).
 * Une ligne SANS RENDU était jusqu'ici tout simplement ignorée — et
 * comme l'enregistrement supprime « ce qui n'est plus à l'écran », elle
 * était DÉTRUITE au premier envoi suivant, en emportant son style : le
 * formulaire déduit les styles de la fiche de ses photos. Une image
 * déposée pouvait donc disparaître du site sans que personne ne la
 * retire. Elle est désormais MONTRÉE, avec le rendu par défaut (noir et
 * gris) — le même choix que les migrations nº 55 et 57, celui qui se
 * trompe le moins, et que deux gestes corrigent.
 */
async function chargerPortfolio(
  supabase: ReturnType<typeof creerClientSupabaseNavigateur>,
  ficheId: string
): Promise<PhotoEnSaisie[]> {
  try {
    //  ⚠️ LE SELECT EST EXPLICITE (passe nº 109) : la colonne `zone`
    //  a quitté le modèle (migration nº 48) — un `*` la ramènerait
    //  sur une base pas encore migrée. Et une ligne SANS rendu (photo
    //  d'avant, sur une telle base) n'entre plus dans les galeries :
    //  la migration les efface de toute façon.
    const { data, error } = await supabase
      .from("photos_tatoueur")
      .select("id, style, rendu, nature, url, miniature, ordre")
      .eq("tatoueur_id", ficheId)
      .order("ordre");
    if (!error && Array.isArray(data)) {
      return (
        data as unknown as Array<{
          id: string; style: string; rendu: string | null;
          nature: string | null;
          url: string; miniature: string | null; ordre: number;
        }>
      )
        .map((ligne, rang) => ({
          cle: cleNeuve("photo"),
          id: ligne.id,
          style: ligne.style,
          //  Sans rendu (ligne d'avant la nº 48, ou écrite par une
          //  migration) : « noir et gris ». Voir l'avertissement
          //  ci-dessus — l'écarter revenait à l'effacer.
          rendu: ligne.rendu ?? RENDU_PAR_DEFAUT,
          //  ⚠️ TOUTE PHOTO D'AVANT LA Nº 49 EST UN TATOUAGE : c'était
          //  le seul sens possible avant que le flash existe.
          nature: natureConnue(ligne.nature),
          apercu: ligne.url,
          miniature: ligne.miniature,
          ordre: rang,
        }));
    }
  } catch {
    //  Table absente (migration nº 31 non passée) : une galerie
    //  vide, jamais un formulaire en panne.
  }
  return [];
}

/**
 * L'ÉQUIPE PUBLIQUE DU SALON — celle qui s'affichera sur sa page.
 * ELLE VIENT DE LA VUE `equipe_salon`, exactement comme la vraie
 * fiche : c'est la vue, et elle seule, qui décide qui en est —
 * rattachement VALIDÉ, artiste en ligne, fiche non supprimée, session
 * guest non expirée. L'aperçu ne refait pas ce tri, il le reçoit.
 */
async function chargerEquipe(
  supabase: ReturnType<typeof creerClientSupabaseNavigateur>,
  ficheId: string
): Promise<MembreEquipe[]> {
  try {
    const { data, error } = await supabase
      .from("equipe_salon")
      .select("*")
      .eq("salon_id", ficheId);
    if (error || !Array.isArray(data)) return [];
    const lignes = data as unknown as Parameters<typeof membreDepuisVue>[0][];
    /**
     * ██ §6 (nº 492) — L'APERÇU VA CHERCHER LA DÉCLARATION, LUI AUSSI ██
     * ------------------------------------------------------------------
     * CE QUI ÉTAIT VRAI JUSQU'ICI, et que cette passe corrige : l'aperçu
     * ne lisait QUE la vue — donc pas les styles des membres (nº 313),
     * et il n'aurait pas eu leur booking non plus. La ligne du dessus y
     * aurait dit « Résident » là où la fiche publique dit « Résident •
     * Booking ouvert » : deux écrans, deux textes, c'est exactement ce
     * que la nº 473 interdit.
     * On lit donc ici la MÊME chose que `garnirFiches` : une requête sur
     * les fiches des membres, styles et carnet compris.
     * ⚠️ JAMAIS BLOQUANTE : si elle échoue, les membres gardent ce que
     * la vue donne et l'aperçu se comporte comme avant.
     */
    const artistes = [...new Set(lignes.map((ligne) => ligne.artiste_id))];
    const declarations = new Map<
      string,
      { styles: string[] | null; booking: string | null; booking_mois: number | null }
    >();
    if (artistes.length > 0) {
      const fiches = await supabase
        .from("tatoueurs")
        .select("id, styles, booking, booking_mois")
        .in("id", artistes);
      for (const ligne of (fiches.data ?? []) as unknown as {
        id: string;
        styles: string[] | null;
        booking?: string | null;
        booking_mois?: number | null;
      }[]) {
        declarations.set(ligne.id, {
          styles: ligne.styles?.length ? ligne.styles : null,
          booking: ligne.booking ?? null,
          booking_mois: ligne.booking_mois ?? null,
        });
      }
    }
    //  ⚠️ L'APPEL EST EXPLICITE (nº 288-§3) : `membreDepuisVue` prend
    //  un SECOND argument — la déclaration de l'artiste —, et
    //  `.map(membreDepuisVue)` lui aurait passé l'INDICE à sa place.
    return lignes.map((ligne) =>
      membreDepuisVue(ligne, {
        styles: declarations.get(ligne.artiste_id)?.styles ?? null,
        booking: declarations.get(ligne.artiste_id)?.booking ?? null,
        booking_mois: declarations.get(ligne.artiste_id)?.booking_mois ?? null,
      })
    );
  } catch {
    return [];
  }
}

export function FormulaireFiche() {
  const { utilisateur, pret } = useUtilisateur();
  /** UN DOIGT, PAS UNE LARGEUR DE FENÊTRE (règle du site depuis P60).
      Le champ d'adresse s'y adapte : sur smartphone il remonte en
      haut de l'écran et ouvre ses suggestions DANS LE FLUX, sous lui. */
  const surMobile = useAppareilMobile();

  const [nom, setNom] = useState("");
  /** LE TYPE DE FICHE — le choix qui structure tout le reste. Null
      tant que rien n'a été choisi : c'est OBLIGATOIRE, on ne devine
      pas à la place de la personne. */
  const [typeFiche, setTypeFiche] = useState<TypeFiche | null>(null);
  /** LA NATURE DU LIEU — le sous-choix de « Salon / Studio privé ».
      Nul tant que le second type n'est pas retenu ; « salon » par
      défaut dès qu'il l'est, parce que c'est le cas courant et qu'un
      choix déjà posé se corrige plus vite qu'un choix à faire. */
  //  LES RATTACHEMENTS CHOISIS AVANT QUE LA FICHE EXISTE (blocs 11 et
  //  12). Même principe que les photos et les modes : on retient
  //  pendant la saisie, on écrit une fois l'identifiant connu.
  const [equipeEnAttente, setEquipeEnAttente] = useState<string[]>([]);
  const [adressesEnAttente, setAdressesEnAttente] = useState<string[]>([]);
  const [etablissement, setEtablissement] =
    useState<NatureEtablissement | null>(null);
  /** LES MODES D'EXERCICE — ARTISTE. Cumulatifs, répétables, et VIDES
      au départ : la section ne montre qu'un bouton « + Ajouter un
      mode d'exercice » tant que rien n'a été déclaré. */
  const [modesExercice, setModesExercice] = useState<ModeEnSaisie[]>([]);
  /** LES STUDIOS — SALON. Le premier est celui de la fiche (il porte
      son nom et son adresse) ; les suivants sont les autres adresses
      de l'enseigne. */
  const [studios, setStudios] = useState<StudioEnSaisie[]>([
    { cle: cleNeuve("studio"), nom: "", source: "manuel", lieu: null },
  ]);
  /** LES IDENTIFIANTS DES STUDIOS TELS QUE CHARGÉS DE LA BASE — la
      mémoire du bug du « studio fantôme » (passe nº 104) : à
      l'enregistrement, tout id présent ici mais absent de l'écran a
      été RETIRÉ par la personne, et doit l'être aussi en base. */
  const idsStudiosCharges = useRef<string[]>([]);
  /** LES IDENTIFIANTS DES PHOTOS TELLES QUE CHARGÉES DE LA BASE — la
      même mémoire que ci-dessus, pour la même raison (passe nº 151) :
      seule une photo CHARGÉE PUIS RETIRÉE à l'écran est supprimée. Une
      ligne que le formulaire n'a pas montrée ne doit jamais être
      effacée par un enregistrement. */
  const idsPhotosChargees = useRef<string[]>([]);
  /** LE BLOC 1 EST-IL CONFIRMÉ ?
      Tant qu'il ne l'est pas, le reste du formulaire n'existe pas à
      l'écran : on ne demande pas une bio à quelqu'un qui n'a pas
      encore dit s'il est artiste ou salon. Une fois confirmé, le
      choix se ferme — et seule l'administration peut le rouvrir
      (migration nº 28, déclencheur `tatoueurs_verrou_exercice`). */
  const [exerciceConfirme, setExerciceConfirme] = useState(false);
  /** LA PHOTO DE PROFIL (ronde) — obligatoire.
      §1 (nº 657) — L'IMAGE D'ORIGINE N'EST PLUS ICI : elle a suivi le
      recadreur et le sélecteur de fichier chez `ChampPhotoRonde`
      (components/ChampsIdentite), qui tient tout le chemin de la
      photo. Ce formulaire ne garde que ce qu'il ENVOIE — le fichier
      cadré — et ce qu'il MONTRE — son aperçu. */
  const [photoProfil, setPhotoProfil] = useState<File | null>(null);
  const [apercuProfil, setApercuProfil] = useState<string>("");
  const [bio, setBio] = useState("");
  /** LE PORTFOLIO — la galerie entière, photos taguées comprises.
      C'est LUI qui décide des styles de la fiche : `stylesChoisis`
      n'est plus une saisie, mais une déduction. */
  const [photosPortfolio, setPhotosPortfolio] = useState<PhotoEnSaisie[]>([]);
  const stylesChoisis = stylesDuPortfolio(
    photosPortfolio.map((photo) => ({
      id: photo.cle,
      style: photo.style,
      rendu: photo.rendu,
      url: photo.apercu,
      miniature: photo.miniature,
      ordre: photo.ordre,
    }))
  );
  /*  §1 (nº 657) — LE RECADREUR N'EST PLUS MONTÉ ICI. Son état vivait
      dans ce formulaire depuis la nº 112, avec une `cible` qui pouvait
      désigner un style — mais les photos du portfolio ont leur propre
      chemin depuis la nº 118 (BlocPortfolio), et cette cible ne valait
      plus que `CIBLE_PROFIL` : elle est partie avec la photo ronde chez
      `ChampPhotoRonde` (components/ChampsIdentite). Rien d'autre ne
      l'employait ; vérifié avant de la déplacer. */
  const [instagram, setInstagram] = useState("");
  /*  §2 (nº 408) — LES DEMANDES PAR DM. Décoché par défaut : une fiche
       neuve n'annonce rien que son auteur n'ait choisi, et la colonne
       est `default false` en base (yokofolio-dm-instagram.sql). */
  const [dmInstagram, setDmInstagram] = useState(false);
  /** §2 (nº 270) — L'ÉTAT DES CARNETS : "" (rien déclaré — un manque
      à la validation), 'ouvert', 'delai' ou 'ferme'. */
  const [booking, setBooking] = useState("");
  /** Le nombre de mois d'attente ("1" à "12"), exigé sur 'delai'
      seulement. Il SURVIT à un aller-retour vers 'ouvert'/'fermé'
      dans le formulaire (on ne re-saisit pas ce qu'on vient de dire),
      mais ne S'ÉCRIT en base qu'avec 'delai' (voir l'envoi). */
  const [bookingMois, setBookingMois] = useState("");
  /** LE LIEN LIBRE (passe nº 116) — l'emplacement « Ajouter un
      lien » : une URL et un TITRE choisi par la personne
      (16 caractères), rien n'est détecté. En base, il s'écrit dans
      les colonnes historiques `site_web` + `titre_site_web`
      (migration nº 51) : les fiches existantes ne cassent pas.
      ⚠️ IL N'EN RESTE QU'UN (§1, nº 270) : le second emplacement a
      cédé sa place au champ Booking. Ses colonnes (`page_de_liens`,
      `titre_page_de_liens`) NE SONT PLUS ÉCRITES DU TOUT — la même
      garantie que `lien_youtube` : aucun enregistrement ne peut plus
      les toucher, donc jamais les effacer. Une fiche qui portait une
      page de liens la garde, affichée sur sa fiche publique comme
      avant. */
  const [lienLibre, setLienLibre] = useState<LienLibreSaisie>({
    ...LIEN_LIBRE_VIDE,
  });
  /** LES PRATIQUES ALLUMÉES, par groupe (technique, composition) —
      des interrupteurs TOUS ÉTEINTS au départ : le tatoueur allume ce
      qu'il pratique (l'inverse de la recherche, où tout est allumé).
      Facultatif : trente secondes, pas plus. */
  const [filtresCoches, setFiltresCoches] = useState<Record<string, string[]>>({
    technique: [],
    composition: [],
    besoins: [],
  });

  /**
   * LE LIEU DE RÉFÉRENCE DE LA FICHE — celui qui la place sur la
   * carte, qui donne sa ville, son adresse de page et son slug.
   * · SALON   → l'adresse du PREMIER studio ;
   * · ARTISTE → celle du PREMIER mode déclaré, qu'elle vienne d'un
   *   salon inscrit ou d'une saisie à la main.
   * Les autres adresses ne sont pas perdues pour autant : chacune
   * devient un point de recherche à part entière (voir
   * `pointsDeLaFiche`). Ce lieu-ci ne décide que de l'identité.
   */
  const lieuPrincipal: LieuTrouve | null = lieuDeReference(
    typeFiche,
    modesExercice,
    studios
  );

  /** LE BLOC 1 EST-IL REMPLI, ET SINON POURQUOI ? La règle vit dans
      lib/modes-exercice, écrite une seule fois pour les trois modes
      et pour le cas salon — le formulaire ne fait que la lire. */
  //  ⚠️ L'ÉTABLISSEMENT ENTRE DANS LA VALIDATION : un salon exige une
  //  adresse complète, un studio privé se contente de sa ville.
  const blocUnComplet = blocExerciceComplet(
    typeFiche,
    modesExercice,
    studios,
    etablissement
  );
  const raisonIncomplet = raisonBlocIncomplet(
    typeFiche,
    modesExercice,
    studios,
    etablissement
  );
  /** CE QUI MANQUE, DÉSIGNÉ — allumé seulement quand la personne a
      ESSAYÉ de confirmer. Le pavé de texte de l'encadré a disparu ;
      c'est le champ lui-même qui le dit désormais (voir
      `premierManque` dans lib/modes-exercice). */
  const [confirmationTentee, setConfirmationTentee] = useState(false);
  //  ⚠️ L'ÉTABLISSEMENT ENTRE DANS LE CALCUL (passe nº 111) : il y
  //  manquait, et la règle d'adresse n'est pas la même pour un salon
  //  (rue et numéro) que pour un studio privé (sa ville suffit).
  /*  §1 (nº 267) — TOUS LES MANQUES, PAS SEULEMENT LE PREMIER. Le
      rouge se branchait sur `premierManque`, qui s'arrête au premier
      trouvé : deux modes en faute ne
      pouvaient pas rougir ensemble. La liste complète part au bloc ;
      LE PREMIER, lui, garde son office — la remontée de page et la
      bascule d'onglet mènent au premier endroit à corriger. Une seule
      règle, deux lectures (voir `tousLesManques`). */
  const manquesDesignes = confirmationTentee
    ? tousLesManques(typeFiche, modesExercice, studios, etablissement)
    : [];
  const manqueDesigne = manquesDesignes[0] ?? null;
  /**
   * §5 (nº 408) — AUCUN LIEU COMMENCÉ : UNE PHRASE, PAS UN CADRE.
   * ------------------------------------------------------------------
   * `aucun-lieu` est le manque qui ne désigne AUCUN champ (voir
   * lib/modes-exercice) : personne ne le reconnaît, donc rien ne
   * rougit — ni un encadré de lieu, ni le sélecteur. Reste à le DIRE,
   * et c'est ici, à côté du bouton.
   * ⚠️ LES DEUX SIGNALEMENTS NE PEUVENT PAS COEXISTER, PAR
   * CONSTRUCTION : ce manque n'est rendu QUE lorsque la liste des
   * lieux déclarés est vide. Dès qu'un lieu est commencé, il disparaît
   * de lui-même et les manques de ce lieu prennent le relais, en
   * rouge, comme depuis la nº 407. Aucune condition n'est à tenir à
   * jour des deux côtés.
   */
  const aucunLieuChoisi = manqueDesigne?.champ === "aucun-lieu";

  /** L'ADRESSE PRÉCISE (rue et numéro) est-elle publiable ? Elle ne
      l'est pas quand la fiche ne tient que par des modes SANS VITRINE :
      le STUDIO PRIVÉ, et « DISPONIBLE » (nº 414) — un artiste qui
      cherche un lieu n'a pas d'adresse où l'on vient, et la ville
      qu'il a saisie peut être la sienne. La promesse de vie privée
      vaut aussi pour la ligne d'adresse de la fiche, pas seulement
      pour ses modes. (C'était la règle d'« à domicile » avant la
      nº 402 ; le mode sans lieu des nº 414-417 aussi, supprimé
      nº 418.)
      ⚠️ UN ENCADRÉ VIERGE NE COMPTE PAS DU TOUT (passe nº 124) :
      ouvrir un onglet par curiosité crée un mode sans rien dedans —
      seuls les modes où quelque chose est saisi (ceux qui partent en
      base) entrent dans la promesse. */
  const adressePubliable =
    typeFiche === "salon" ||
    modesExercice.some(
      (mode) => !modeVide(mode) && mode.genre !== "prive"
    );

  /** Choisir le type efface ce qui appartenait à l'autre : un salon
      n'a pas de mode d'exercice, un artiste n'a pas de studios. */
  function choisirType(suivant: TypeFiche) {
    // Le second type ouvre son sous-choix, déjà positionné sur le cas
    // courant ; le premier l'efface (un artiste n'est pas un lieu).
    setEtablissement(suivant === "salon" ? "salon" : null);
    marquerModifie();
    setTypeFiche(suivant);
    //  ⚠️ LA TENTATIVE DE CONFIRMATION NE TRAVERSE PAS (passe nº 111).
    //  C'EST LE BUG DE CONTAMINATION : on essayait de confirmer depuis
    //  STUDIO sans rien avoir rempli, `confirmationTentee` restait
    //  vrai, on glissait sur ARTISTE pour comprendre — et la section
    //  artiste s'allumait en rouge en réclamant un mode d'activité,
    //  pour une tentative faite ailleurs. Les trois positions de la
    //  glissière sont TROIS QUESTIONS DIFFÉRENTES : ce qu'on reproche
    //  à l'une ne se reproche jamais aux deux autres.
    setConfirmationTentee(false);
    // LE PREMIER ENCADRÉ DE MODE S'OUVRE TOUT DE SUITE, déjà déployé,
    // avec ses quatre choix sous les yeux. On ne demande pas un clic
    // de plus pour commencer à remplir : choisir « Artiste », c'est
    // déjà avoir dit qu'on allait déclarer un mode.
    if (suivant === "artiste" && modesExercice.length === 0) {
      setModesExercice([modeNeuf()]);
    }
    setErreurs((courantes) => {
      const reste = { ...courantes };
      delete reste.type;
      delete reste.mode;
      delete reste.lieu;
      return reste;
    });
  }

  function basculerFiltre(groupe: string, slug: string) {
    marquerModifie();
    setFiltresCoches((courants) => {
      const liste = courants[groupe] ?? [];
      return {
        ...courants,
        [groupe]: liste.includes(slug)
          ? liste.filter((s) => s !== slug)
          : [...liste, slug],
      };
    });
  }

  /** L'ÉQUIPE DU SALON, telle que le public la verra. Lue en même
      temps que les studios ; vide pour un artiste. */
  const [equipePublique, setEquipePublique] = useState<MembreEquipe[]>([]);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  /** LA FENÊTRE D'ENVOI (passe nº 118) — ouverte du clic à l'arrivée :
      le décompte des photos, puis « Enregistrement du portfolio… ». */
  const [avancee, setAvancee] = useState<{
    faites: number;
    total: number;
  } | null>(null);
  /** « verification » (fiche existante ?) puis « formulaire » — en
      CRÉATION (aucune fiche) ou en MODIFICATION (fiche pré-remplie). */
  const [etape, setEtape] = useState<"verification" | "formulaire">(
    "verification"
  );
  /** LA RÉACTIVATION EN COURS (nº 133) — le bouton de l'écran
      « Portfolio désactivé ». Son erreur se dit sur place. */
  const [reactivation, setReactivation] = useState(false);
  const [erreurReactivation, setErreurReactivation] = useState<string | null>(
    null
  );
  /** La fiche déjà rattachée au compte, ENTIÈRE (mode modification). */
  const [ficheChargee, setFicheChargee] = useState<
    | (Record<string, unknown> & {
        id: string;
        slug: string;
        publie?: boolean;
        statut?: string | null;
        hors_ligne?: boolean | null;
        brouillon?: Record<string, unknown> | null;
        validation_a_notifier?: boolean;
        motifs_moderation?: string[] | null;
        note_moderation?: string | null;
        /** L'ÉCHÉANCE DE SUPPRESSION (nº 133) — non nulle, le
            portfolio est DÉSACTIVÉ : ni formulaire, ni aperçu, mais
            l'écran de réactivation. */
        supprime_le?: string | null;
        purge_le?: string | null;
      })
    | null
  >(null);
  /** LA FENÊTRE D'ANNONCE DE VALIDATION — ouverte à chaque ARRIVÉE
      sur la vue « Modification » tant qu'une version attend la
      relecture (création, enregistrement, clic « Modification » du
      menu). Jamais quand la fiche est déjà validée et sans attente. */
  const [annonceValidation, setAnnonceValidation] = useState(false);
  /** La fiche TELLE QUE LA VERRAIT LE PUBLIC après validation : la
      ligne recouverte de son brouillon — c'est elle que « Ma fiche »
      affiche, en rendu réel. */
  const [sourceFiche, setSourceFiche] = useState<Record<
    string,
    unknown
  > | null>(null);
  /** LA VUE SUIT L'ADRESSE (?vue=apercu) : c'est le menu « Mon
      espace » de la barre qui navigue entre « Modification » et « Ma
      fiche » — et un changement de vue REMONTE la page (même adresse,
      la remontée automatique de navigation ne joue pas ici). */
  const parametres = useSearchParams();
  /** §1 (nº 506) — COMBIEN DE FENÊTRES SONT EMPILÉES PAR-DESSUS. La
      pile la remonte ; la vue s'en sert pour rester « aperçu » tant
      qu'une fiche est ouverte au-dessus (voir la note de `vue`). */
  const [profondeurPile, setProfondeurPile] = useState(0);
  const router = useRouter();
  const vueApercuDemandee = parametres.get("vue") === "apercu";
  /** QUELLE FICHE ? Un compte peut en gérer plusieurs : l'adresse
      porte son identifiant (?fiche=…), ou le mot « nouvelle » pour en
      créer une de plus. Sans rien, on reprend la dernière retenue. */
  const ficheDemandee = parametres.get("fiche");
  useEffect(() => {
    noterNavigation(
      `SCROLLTO · FormulaireFiche · vers 0 · page à ${Math.round(window.scrollY)} avant`
    );
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [vueApercuDemandee]);

  /* ---------- « J'AI QUELQUE CHOSE À PERDRE » ----------
     Le menu « Mon espace » demande cela AVANT d'ouvrir une création :
     partir remonte un formulaire neuf, donc efface la saisie en cours.
     On repart de « rien à perdre » à chaque montage (une fiche
     fraîchement chargée n'est pas une fiche modifiée), et l'on baisse
     le drapeau en partant : hors de cette page, il n'y a plus rien à
     protéger. */
  useEffect(() => {
    marquerTravailEnCours(false);
    return () => marquerTravailEnCours(false);
  }, []);

  /** Appelée à CHAQUE geste qui change le contenu de la fiche. */
  function marquerModifie() {
    marquerTravailEnCours(true);
  }

  /*  §4 (nº 314) — LE MESSAGE DE BIENVENUE EST SUPPRIMÉ, CODE
      COMPRIS, sur consigne.
      ------------------------------------------------------------------
      Il s'ouvrait quand quelqu'un annulait la suppression de son compte
      en se reconnectant (`?bienvenue=1`, posé par /auth/callback). Il
      vivait sur CETTE page — et depuis la nº 313-§2, une connexion
      n'y mène plus : on arrive toujours sur « Ma sélection ». Le
      propriétaire a tranché, il ne sert à rien. L'état, l'écouteur
      d'Échap, la fenêtre ET la lecture du paramètre partent ensemble ;
      la réactivation du compte, elle, ne change pas d'un iota — elle
      est automatique à la connexion (/api/tatoueur/reactiver) et n'a
      jamais eu besoin de cette fenêtre pour se faire. */

  /* L'ANNONCE DE VALIDATION : dès que la vue « Modification » est
     affichée alors qu'une version attend la relecture (fiche jamais
     publiée, ou brouillon par-dessus la version en ligne), la fenêtre
     s'ouvre — à l'arrivée sur la page comme au retour depuis « Ma
     fiche ». Fiche validée, sans rien en attente : jamais rien. */
  /* ⚠️ CE QUI DÉCLENCHE LA FENÊTRE A CHANGÉ DE NATURE.
     Elle était décidée par L'ÉTAT DE LA FICHE (« une version attend la
     relecture ») — un état qui reste vrai des jours durant. Elle
     revenait donc à chaque arrivée, à chaque retour, et même toute
     seule au bout d'un moment : le jeton de session se renouvelle
     périodiquement (`onAuthStateChange`), la fiche est relue, et
     l'état — toujours vrai — rouvrait la fenêtre. Ajouter une date
     de lecture en base n'y changeait rien tant que la CONDITION
     restait un état permanent.
     Elle est maintenant décidée par UN GESTE, et un seul : venir
     d'enregistrer. L'enregistrement renvoie ici avec « enregistre=1 »
     dans l'adresse ; on ouvre la fenêtre, et ON EFFACE AUSSITÔT le
     paramètre. Un rechargement, un retour arrière, un autre appareil,
     une relecture automatique : plus rien ne peut la rouvrir, parce
     qu'il n'y a plus d'état à interpréter. */
  const annonceDemandee = parametres.get("enregistre") === "1";
  /** §1 (nº 285) — CET ENVOI PORTAIT-IL DES PHOTOS NEUVES ? C'est la
      seule chose qui décide de ce que la fenêtre dit : avec, une
      relecture est en cours (24 h) ; sans, tout est DÉJÀ en ligne. */
  const [photosEnRelecture, setPhotosEnRelecture] = useState(false);
  const photosDemandees = parametres.get("photos") === "1";
  useEffect(() => {
    if (!annonceDemandee || vueApercuDemandee) return;
    // L'ADRESSE EST NETTOYÉE TOUT DE SUITE, avant même l'affichage :
    // recharger la page ne rouvrira rien.
    const propre = new URL(window.location.href);
    propre.searchParams.delete("enregistre");
    propre.searchParams.delete("photos");
    //  §2 (nº 332) — L'ÉTAT EST RECOPIÉ, plus effacé. Cette ligne
    //  ne veut que NETTOYER L'ADRESSE ; passer `null` jetait au
    //  passage les marques que le site pose dans l'étape (le filet
    //  `retourReconstruit`, l'étape d'une surface refermable), et
    //  le retour ne savait plus où il en était.
    if (!mecanismeCoupe("nettoyages")) {
      window.history.replaceState(window.history.state, "", propre.toString());
    }
    setPhotosEnRelecture(photosDemandees);
    setAnnonceValidation(true);
  }, [annonceDemandee, photosDemandees, vueApercuDemandee]);

  /* LA FERMETURE MARQUE L'ANNONCE COMME VUE, EN BASE.
     Ce n'était pas un caprice de rangement : tant que l'état vivait
     dans le seul navigateur, la fenêtre revenait à chaque
     reconnexion et sur chaque appareil — parce qu'elle était décidée
     par l'ÉTAT de la fiche (« une version attend »), qui reste vrai
     des jours durant. Une annonce, elle, ne se dit qu'une fois. */
  function fermerAnnonce() {
    setAnnonceValidation(false);
    // LA TRACE EN BASE reste écrite — elle ne décide plus de rien
    // (c'est l'adresse qui décide, voir plus haut), mais elle dit
    // quand l'annonce a été lue : c'est utile au diagnostic, et ça ne
    // coûte rien.
    const identifiant = ficheChargee?.id;
    if (!identifiant) return;
    // On note aussi localement : sans ça, revenir de « Ma fiche »
    // rouvrirait la fenêtre avant que la base n'ait répondu.
    ficheChargee.annonce_vue_le = new Date().toISOString();
    void creerClientSupabaseNavigateur()
      .from("tatoueurs")
      .update({ annonce_vue_le: new Date().toISOString() })
      .eq("id", identifiant);
  }

  /* Échap referme l'annonce — comme toutes les fenêtres du site. */
  useEffect(() => {
    if (!annonceValidation) return;
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") fermerAnnonce();
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
    // `fermerAnnonce` est recréée à chaque rendu ; l'ajouter en
    // dépendance ne ferait que réabonner l'écouteur pour rien — ce
    // qu'elle fait ne dépend que de la fiche chargée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonceValidation]);

  /* « MODIFICATION » CLIQUÉ DANS LE MENU alors que le formulaire est
     DÉJÀ affiché : naviguer vers la même adresse ne déclenche rien —
     le menu envoie donc cet événement, et c'est ici qu'on remonte la
     page et qu'on rouvre l'annonce. (Depuis « Ma fiche » ou une autre
     page, l'adresse change : les effets d'arrivée s'en chargent.) */
  useEffect(() => {
    function surDemande() {
      if (vueApercuDemandee) return;
      // ON REMONTE, ET C'EST TOUT. Rouvrir l'annonce ici était l'une
      // des trois portes par lesquelles elle revenait sans cesse.
      noterNavigation(
      `SCROLLTO · FormulaireFiche · vers 0 · page à ${Math.round(window.scrollY)} avant`
    );
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    window.addEventListener("yokofolio-modification-demandee", surDemande);
    return () =>
      window.removeEventListener("yokofolio-modification-demandee", surDemande);
  }, [vueApercuDemandee]);

  /*  §1 (nº 657) — L'ENTRÉE DE FICHIER EST PARTIE AVEC LA PHOTO RONDE
      (`ChampPhotoRonde`, components/ChampsIdentite), et le repère
      « pour qui a-t-elle été ouverte » avec elle. Ce repère était DÉJÀ
      MORT : il n'était qu'écrit, jamais relu — les trois cas qu'il
      annonçait (profil, photo neuve d'un style, recadrage d'une photo
      déposée) ont été séparés à la nº 118, quand le portfolio a pris
      son propre chemin. Rien n'est perdu ; on retire ce qui ne servait
      plus. */

  /* UN COMPTE, PLUSIEURS FICHES : au premier rendu, on charge LA
     FICHE CHOISIE — celle demandée dans l'adresse (?fiche=…), sinon la
     dernière retenue, sinon la première du compte (voir
     lib/fiches-compte). Le formulaire s'ouvre alors PRÉ-REMPLI, en
     mode MODIFICATION (les dernières modifications en attente — le
     brouillon — priment sur la version publiée).
     ?fiche=nouvelle : formulaire VIERGE, pour ajouter une fiche de
     plus — c'est l'entrée « + Ajouter une fiche » du menu.
     Base injoignable : le formulaire s'ouvre vide, comme avant. */
  /**
   * « UN INSTANT… » NE PEUT PLUS DURER TOUJOURS.
   * ⚠️ CET ÉCRAN N'A AUCUNE SORTIE DE SECOURS, et c'est ce qui bloque.
   * Il s'affiche tant que l'étape vaut « verification », et on n'en
   * sort qu'en recevant une réponse : la session, puis la liste des
   * fiches du compte. Or une requête réseau ne rate pas toujours —
   * elle peut simplement NE JAMAIS RÉPONDRE. C'est le cas typique d'un
   * onglet resté ouvert des heures, mis en veille puis réveillé : la
   * connexion sous-jacente est morte, la promesse ne se résout ni ne
   * se rejette, le `try/catch` n'attrape rien, et la page reste sur
   * « Un instant… » avec la seule barre fixe — indéfiniment.
   *
   * On borne donc l'attente. Passé ce délai, on ouvre le formulaire
   * avec ce qu'on a : mieux vaut un formulaire vide, dont on peut
   * sortir, qu'un écran mort.
   */
  useEffect(() => {
    if (etape !== "verification") return;
    const minuteur = window.setTimeout(() => setEtape("formulaire"), 8000);
    return () => window.clearTimeout(minuteur);
  }, [etape]);

  /**
   * ⚠️ LE FORMULAIRE NE SE REMPLIT QU'UNE FOIS (passe nº 111).
   * C'EST LA CAUSE DE LA DISPARITION DES PHOTOS. Cet effet relit la
   * fiche EN BASE et repose TOUS les champs — dont le portfolio. Il
   * dépendait de `utilisateur`, un OBJET que Supabase remplace à
   * chaque renouvellement de jeton et à chaque retour sur l'onglet
   * (voir lib/use-utilisateur). L'effet repartait donc tout seul, au
   * bout d'un moment, et `setPhotosPortfolio(…)` REMPLAÇAIT la liste
   * par celle de la base : tout ce qui avait été déposé sans être
   * encore enregistré disparaissait, sans un mot.
   *
   * Deux verrous, désormais :
   *  · on dépend de l'IDENTIFIANT (une chaîne), jamais de l'objet ;
   *  · on retient CE QUI A DÉJÀ ÉTÉ CHARGÉ. Une fiche remplie ne se
   *    recharge JAMAIS par-dessus la personne qui la remplit. Choisir
   *    une AUTRE fiche change la clé — et là, oui, on recharge.
   */
  const dejaCharge = useRef<string | null>(null);
  const idUtilisateur = utilisateur?.id ?? null;

  useEffect(() => {
    if (!pret) return;
    if (!idUtilisateur) {
      setEtape("formulaire");
      return;
    }
    //  LA CLÉ DE CE QU'ON S'APPRÊTE À CHARGER. Déjà chargé : on ne
    //  touche à rien — et surtout pas à l'écran.
    const aCharger = `${idUtilisateur}|${ficheDemandee ?? ""}`;
    if (dejaCharge.current === aCharger) return;
    //  ON MARQUE AVANT DE PARTIR, pas après : une seconde émission
    //  pendant le chargement ne doit pas en lancer un deuxième.
    dejaCharge.current = aCharger;
    if (ficheDemandee === "nouvelle") {
      // On ne charge RIEN : c'est une création. Et on oublie la fiche
      // retenue, pour que l'enregistrement ne croie pas modifier
      // l'ancienne.
      setEtape("formulaire");
      return;
    }
    let abandonne = false;
    (async () => {
      try {
        const supabase = creerClientSupabaseNavigateur();
        const liste = await chargerFichesDuCompte(supabase, idUtilisateur);
        const choisie = ficheActive(liste, ficheDemandee);
        if (abandonne) return;
        if (!choisie) {
          setEtape("formulaire");
          return;
        }
        memoriserFiche(choisie.id);
        const { data } = await supabase
          .from("tatoueurs")
          .select("*")
          .eq("id", choisie.id)
          .maybeSingle();
        if (abandonne) return;
        if (data) {
          const ligne = data as NonNullable<typeof ficheChargee> &
            Record<string, unknown>;
          const source = {
            ...ligne,
            ...((ligne.brouillon as Record<string, unknown>) ?? {}),
          } as Record<string, unknown>;
          setFicheChargee(ligne);
          setSourceFiche(source);
          setNom(String(source.nom ?? ""));
          // LE TYPE ET LE MODE déjà enregistrés. Une fiche d'avant la
          // refonte n'en a pas : c'est un SALON à une adresse — ce que
          // la migration nº 21 écrit aussi en base.
          const typeLu = String(source.type_fiche ?? "salon");
          // La nature du lieu suit le type : « salon » par défaut,
          // comme en base (voir yokofolio-etablissement-prive.sql).
          setEtablissement(
            typeLu === "salon"
              ? String(source.etablissement ?? "salon") === "prive"
                ? "prive"
                : "salon"
              : null
          );
          setTypeFiche(typeLu === "artiste" ? "artiste" : "salon");
          // LE VERROU VIENT DE LA BASE, jamais du navigateur : une
          // fiche déjà confirmée s'ouvre avec tout son formulaire ;
          // une fiche d'avant la migration nº 28 (ou rouverte par
          // l'administration) repasse par l'avertissement.
          setExerciceConfirme(Boolean(ligne.exercice_verrouille));

          // LES MODES ET LES STUDIOS — lus dans leurs tables (migration
          // nº 26). Une fiche qui n'en a pas encore repart de son
          // adresse principale : rien n'est perdu à l'écran, et le
          // prochain enregistrement l'écrira dans le nouveau modèle.
          const lieuDeLaFiche = lieuDepuisFiche(source);
          /*  ██ §1 (nº 678) — LES QUATRE LECTURES PARTENT ENSEMBLE ██
              ==============================================================
              CE QUI SE PASSAIT, MESURÉ AU BANC (doublure ralentie à 120 ms,
              l'ordre de grandeur d'une base distante) : l'ouverture d'un
              portfolio faisait SIX lectures À LA FILE, chacune attendant la
              précédente — la liste des fiches, la fiche elle-même, les modes
              d'exercice, les studios, l'équipe, le portfolio. Relevé des
              départs : 447 ms, 1575 ms, 3701 ms… Six aller-retours en série,
              c'est six fois la latence : une seconde au banc, DEUX À TROIS
              SECONDES en production. C'est très exactement l'attente que le
              propriétaire juge inacceptable.
              CE QUI CHANGE : LES QUATRE DERNIÈRES NE DÉPENDENT QUE DE
              `ligne.id`, que l'on tient déjà. Rien ne justifiait qu'elles
              s'attendent — c'est l'ordre d'écriture qui les avait mises en
              file, pas une dépendance. Elles partent donc ENSEMBLE :
              quatre aller-retours deviennent UN.
              ⚠️ LES DEUX PREMIÈRES RESTENT EN SÉRIE, et c'est nécessaire :
              la fiche ne peut être lue qu'une fois qu'on sait LAQUELLE
              (`ficheActive` la choisit dans la liste). On ne parallélise
              pas une dépendance réelle — on ne supprime que les fausses.
              ⚠️ L'ÉQUIPE N'EST TOUJOURS LUE QUE POUR UN SALON : la
              condition est simplement passée DANS la promesse, au lieu
              d'entourer un `await`. Un artiste ne fait donc toujours
              aucune requête d'équipe.
              ⚠️ RIEN NE CHANGE À CE QUI EST POSÉ À L'ÉCRAN, ni dans quel
              ordre : les `set…` qui suivent lisent les mêmes valeurs, aux
              mêmes endroits. Seul le MOMENT où elles arrivent change. */
          const [modesLus, studiosLus, equipeLue, portfolioLu] =
            await Promise.all([
              chargerModes(supabase, String(ligne.id)),
              chargerStudios(supabase, String(ligne.id)),
              typeLu === "salon"
                ? chargerEquipe(supabase, String(ligne.id))
                : Promise.resolve([]),
              chargerPortfolio(supabase, String(ligne.id)),
            ]);
          //  ⚠️ ON RETIENT LES IDENTIFIANTS CHARGÉS (bug du « studio
          //  fantôme », passe nº 104) : c'est en les comparant à ceux
          //  encore à l'écran, au moment d'enregistrer, qu'on sait
          //  lesquels la personne a RETIRÉS — et eux seuls seront
          //  supprimés en base. Sans cette mémoire, la croix de
          //  suppression ne retirait la ligne que de l'écran, et le
          //  studio revenait à chaque rechargement.
          idsStudiosCharges.current = studiosLus
            .map((studio) => studio.id)
            .filter((id): id is string => Boolean(id));
          //  §1 (nº 678) — l'équipe est déjà là : elle est partie avec
          //  les trois autres, plus haut.
          setEquipePublique(equipeLue);

          if (typeLu === "artiste") {
            setModesExercice(
              modesLus.length > 0
                ? modesLus
                : lieuDeLaFiche
                  ? [
                      {
                        cle: cleNeuve("mode"),
                        genre: "salon",
                        salon: null,
                        lieu: lieuDeLaFiche,
                        debut_le: "",
                        fin_le: "",
                      },
                    ]
                  : []
            );
          } else {
            setStudios(
              studiosLus.length > 0
                ? studiosLus
                : [{ cle: cleNeuve("studio"), nom: "", lieu: lieuDeLaFiche }]
            );
          }
          setApercuProfil(String(source.photo_profil ?? ""));
          setBio(String(source.bio ?? ""));
          // LE PORTFOLIO — lu dans sa table (migration nº 31). Une
          // fiche qui n'y a rien encore repart de `photos_styles` :
          // rien n'est perdu, et le prochain enregistrement l'écrira
          // dans le nouveau modèle.
          //  §1 (nº 678) — `portfolioLu` est déjà là, lui aussi : il est
          //  parti dans la même vague que les modes, les studios et
          //  l'équipe. La lecture qui vivait ici a disparu, pas son
          //  résultat.

          //  CE QUI ÉTAIT EN BASE À L'OUVERTURE : à l'enregistrement,
          //  tout identifiant présent ici mais absent de l'écran a été
          //  RETIRÉ par la personne — et lui seul part de la base
          //  (même règle que les studios, passe nº 104).
          idsPhotosChargees.current = portfolioLu
            .map((photo) => photo.id)
            .filter(Boolean) as string[];
          setPhotosPortfolio(portfolioLu);
          setInstagram(String(source.lien_instagram ?? ""));
          //  §2 (nº 408) — absent (migration pas passée) se relit
          //  « décoché » : on ne coche jamais une case pour personne.
          setDmInstagram(Boolean(source.dm_instagram));
          //  §2 (nº 270) — L'ÉTAT DES CARNETS, relu tel que déclaré.
          //  On ne garde que les trois valeurs connues (et un mois
          //  entre 1 et 12) : une donnée d'avant les garde-fous ne
          //  doit pas pré-cocher n'importe quoi.
          const bookingLu = String(source.booking ?? "");
          setBooking(
            bookingLu === "ouvert" || bookingLu === "delai" || bookingLu === "ferme"
              ? bookingLu
              : ""
          );
          const moisLu = Number(source.booking_mois ?? 0);
          setBookingMois(
            Number.isInteger(moisLu) && moisLu >= 1 && moisLu <= 12
              ? String(moisLu)
              : ""
          );
          //  LE LIEN LIBRE, relu depuis ses colonnes. Une fiche
          //  d'avant la migration nº 51 n'a pas de titre : on lui rend
          //  celui que la fiche publique affichait déjà (le nom du
          //  service, ou le domaine — `libelleDuLien`), borné aux
          //  16 caractères du champ.
          //  ⚠️ `page_de_liens` N'EST PLUS RELU (§1, nº 270) : son
          //  emplacement a cédé sa place au Booking, et le charger
          //  dans le champ restant l'aurait RÉÉCRIT dans `site_web`
          //  au prochain envoi — le même lien dans deux colonnes,
          //  affiché deux fois. La colonne dort, intacte (garantie
          //  `lien_youtube`), et la fiche publique l'affiche comme
          //  avant.
          const lienDepuisBase = (
            url: unknown,
            titre: unknown
          ): LienLibreSaisie => {
            const adresse = String(url ?? "").trim();
            if (!adresse) return { ...LIEN_LIBRE_VIDE };
            const titreLu = String(titre ?? "").trim();
            return {
              url: adresse,
              titre: (titreLu || libelleDuLien(adresse)).slice(
                0,
                TITRE_LIEN_MAXIMUM
              ),
              etat: "valide",
            };
          };
          setLienLibre(lienDepuisBase(source.site_web, source.titre_site_web));
          setFiltresCoches({
            technique: (source.filtres_technique as string[]) ?? [],
            //  ⚠️ « flash » EST FILTRÉ À LA LECTURE (passe nº 110).
            //  Une fiche enregistrée avant la migration nº 49 peut
            //  encore le porter dans `filtres_composition` : le
            //  garder rallumerait un interrupteur qui n'existe plus,
            //  et le RÉÉCRIRAIT en base au premier enregistrement.
            composition: (
              ((source.filtres_composition as string[]) ?? []) as string[]
            ).filter((slug) => slug !== "flash"),
            besoins: (source.filtres_besoins as string[]) ?? [],
          });
        }
        setEtape("formulaire");
      } catch {
        if (!abandonne) setEtape("formulaire");
      }
    })();
    return () => {
      abandonne = true;
    };
  }, [pret, idUtilisateur, ficheDemandee]);

  /**
   * §1 (nº 657) — CE QUE CE FORMULAIRE GARDE DE LA PHOTO RONDE : les
   * DEUX gestes qui le concernent, et rien du chemin qui y mène.
   * Ouvrir le sélecteur, refuser un format, garder l'image d'origine
   * pour « Remplacer », monter le recadreur : tout cela vit désormais
   * dans `ChampPhotoRonde` (components/ChampsIdentite), partagé avec la
   * fenêtre « Modifier » du particulier. Ici il ne reste que ce qui est
   * PROPRE à une fiche — marquer le travail comme modifié, ranger le
   * fichier à envoyer, et porter le reproche dans la carte d'erreurs
   * du formulaire, à l'endroit où sa validation le lit.
   */
  function photoRondeCadree(photo: { fichier: File; apercu: string }) {
    marquerModifie();
    setPhotoProfil(photo.fichier);
    setApercuProfil((courant) => {
      if (courant.startsWith("blob:")) URL.revokeObjectURL(courant);
      return photo.apercu;
    });
  }

  /** Le reproche du format refusé — posé, ou effacé quand un fichier
      valable arrive. La carte d'erreurs reste celle du formulaire. */
  function erreurPhotoRonde(message: string | null) {
    setErreurs((courantes) => {
      if (message) return { ...courantes, photoProfil: message };
      const reste = { ...courantes };
      delete reste.photoProfil;
      return reste;
    });
  }

  /** LA VALIDATION, règle par règle — chaque reproche dit PRÉCISÉMENT
      ce qui manque, au champ près :
       1 le nom · 2 la localisation, CHOISIE dans la liste (une saisie
         libre non validée n'est jamais retenue) ·
       3 la bio : FACULTATIVE (aucun minimum — seul le plafond de 150,
         tenu par le champ) · 4 au moins un style, et sa photo pour
         CHAQUE style choisi · 5 et 6 au moins UN interrupteur allumé
         par groupe · 7 Instagram OBLIGATOIRE (le site
         restent libres, mais doivent être bien formés s'ils sont
         donnés). */
  function valider(): Record<string, string> {
    const trouvees: Record<string, string> = {};
    //  ⚠️ LES MANQUES SONT MUETS (passe nº 111) : le champ rougit, et
    //  c'est tout — voir lib/erreurs-formulaire. Une forme refusée,
    //  elle, porte une MENTION COURTE, affichée DANS le champ
    //  (« Instagram non valide », passe nº 112 — voir
    //  ChampLienVerifie).
    if (nom.trim().length < 2) {
      trouvees.nom = MANQUE;
    }
    // LE TYPE, PUIS LE MODE : le second n'a de sens qu'une fois le
    // premier choisi — on ne reproche jamais les deux à la fois.
    if (!typeFiche) {
      trouvees.type =
        "Dis-nous d'abord si ce portfolio est celui d'un artiste ou d'un studio.";
    } else if (!blocUnComplet) {
      // LA MÊME RÈGLE QUE « Je confirme » — et le même SILENCE (passe
      // nº 116) : le manque est MUET, ce sont les champs du bloc 1
      // qui s'encadrent de rouge (l'envoi rallume `confirmationTentee`
      // pour cela, voir `envoyer`). Les phrases-consignes ont disparu.
      trouvees[typeFiche === "salon" ? "lieu" : "mode"] = MANQUE;
    }
    // LA PHOTO DE PROFIL est OBLIGATOIRE : c'est le visage de la fiche.
    if (!photoProfil && !apercuProfil) {
      trouvees.photoProfil = MANQUE;
    }
    //  LA BIO NE BLOQUE PLUS LA SAISIE (passe nº 119) : on tape
    //  librement au-delà de 150, le compteur rougit — et c'est ICI
    //  que le dépassement se paie : l'enregistrement est refusé tant
    //  qu'il dure. MUET, comme les manques : le compteur rouge parle.
    //  §4 (nº 267) — MÊME COMPTE QUE LE CHAMP : en caractères
    //  VISIBLES. Sans cela, le champ acceptait dix émojis et la
    //  validation les refusait — deux règles pour un même plafond.
    if (longueurVisible(bio) > BIO_MAXIMUM) {
      trouvees.bio = MANQUE;
    }
    // LE PORTFOLIO — au moins une photo, et CHAQUE PHOTO DÉPOSÉE
    // MAINTENANT taguée. Le test porte sur le FICHIER : une photo qui
    // en a un vient d'être déposée dans cette session, donc par la
    // fenêtre, donc avec ses deux tags — sauf si on l'a délogée d'un
    // emplacement, et là on le lui dit.
    // LES PHOTOS D'AVANT LA REFONTE, elles, ne bloquent RIEN : elles
    // n'ont pas de fichier (leur image est déjà en ligne), elles n'ont
    // jamais eu de tags, et enfermer quelqu'un dehors pour un
    // changement de modèle serait indéfendable — qu'elles viennent de
    // la table des photos ou de l'ancien `photos_styles`. La fenêtre
    // du style l'invite à les replacer.
    //  ⚠️ PLUS DE CONTRÔLE DE TAGS (passe nº 109) : une photo se
    //  dépose DANS la galerie d'un style et d'un rendu — elle ne peut
    //  physiquement plus en manquer.
    if (photosPortfolio.length === 0) {
      trouvees.styles = MANQUE;
    }
    if (filtresCoches.technique.length === 0) {
      trouvees.technique = MANQUE;
    }
    if (filtresCoches.composition.length === 0) {
      trouvees.composition = MANQUE;
    }
    // LES BESOINS RESTENT FACULTATIFS, et c'est voulu : ne pas faire
    // de cover n'est pas une case oubliée, c'est une réponse.
    //  §2 (nº 270) — LE BOOKING EST OBLIGATOIRE, et il se dit en deux
    //  temps : rien de déclaré → l'encadré du menu rougit (MANQUE,
    //  muet — le champ lui-même dit ce qui manque) ; « délai
    //  d'attente » choisi SANS le mois → c'est l'encadré des mois qui
    //  rougit, lui aussi sans un mot. Le rouge suit les règles des
    //  nº 266/269 : il n'apparaît qu'au clic de validation, la
    //  remontée mène au premier manque (ORDRE_ERREURS), et la
    //  relecture à la frappe ne fait QU'ENLEVER des reproches.
    if (!booking) {
      trouvees.booking = MANQUE;
    } else if (booking === "delai" && !bookingMois) {
      trouvees.bookingMois = MANQUE;
    }
    const lienInstagram = normaliserLien(instagram, FORME_INSTAGRAM);
    if (lienInstagram === undefined) {
      trouvees.instagram = MANQUE;
    } else if (lienInstagram === null) {
      //  ⚠️ MENTION COURTE (passe nº 112) : elle s'affiche DANS le
      //  champ, à droite — plus de phrase d'exemple sous le champ.
      trouvees.instagram = "Instagram non valide";
    }
    //  ⚠️ PLUS DE VALIDATION YOUTUBE (passe nº 101). Le champ a
    //  disparu de l'écran : refuser l'enregistrement à cause de lui
    //  aurait enfermé dehors quiconque avait saisi, un jour, une
    //  adresse un peu tordue — un message d'erreur pointant un champ
    //  introuvable est une impasse.
    //  ⚠️ LE LIEN LIBRE (passe nº 116, réduit à UN à la nº 270-§1) :
    //  facultatif, mais un emplacement entamé se finit — URL sans
    //  titre (ou l'inverse) → MANQUE (le champ rougit), URL mal
    //  formée → mention courte. La détection de service a DISPARU :
    //  un Linktree, un site, un portfolio Behance — c'est le titre
    //  choisi qui dit ce que c'est.
    const fauteLien = erreurDuLienLibre(lienLibre);
    if (fauteLien) trouvees.lien1 = fauteLien;
    //  ⚠️ PLUS DE VALIDATION DU FORMULAIRE DE DEMANDE (passe nº 102) :
    //  le champ est retiré du produit, colonne comprise (migration
    //  nº 47). Laisser sa règle en place aurait bloqué l'enregistrement
    //  sur un champ devenu introuvable.
    return trouvees;
  }

  /** L'ORDRE DE LECTURE du formulaire : à la première erreur trouvée,
      la page DÉFILE jusqu'au champ en cause (mis en évidence), qui
      prend le clavier quand c'est une zone de saisie. */
  //  ⚠️ L'ORDRE SUIT LES BLOCS FUSIONNÉS (passe nº 112) : le bloc 1,
  //  puis PROFIL dans son ordre interne — logo, nom, (bio libre),
  //  réseaux — puis le portfolio et les spécificités.
  const ORDRE_ERREURS: Array<[cle: string, ancre: string]> = [
    ["type", "section-exercice"],
    ["mode", "section-exercice"],
    ["lieu", "fiche-lieu"],
    ["villes", "section-exercice"],
    ["photoProfil", "section-profil"],
    ["nom", "fiche-nom"],
    ["bio", "fiche-bio"],
    //  §1-§2 (nº 270) — LE BOOKING OUVRE LES LIENS : la remontée au
    //  premier manque suit l'ordre de l'écran. Les mois partagent la
    //  même rangée — leur manque défile vers le même endroit.
    ["booking", "fiche-booking"],
    ["bookingMois", "fiche-booking-mois"],
    ["instagram", "fiche-instagram"],
    ["lien1", "fiche-lien-1"],
    ["styles", "section-styles"],
    ["photos", "section-styles"],
    ["technique", "section-technique"],
    ["composition", "section-composition"],
  ];
  function defilerVersErreur(fautes: Record<string, string>) {
    const premiere = ORDRE_ERREURS.find(([cle]) => fautes[cle]);
    if (!premiere) return;
    /**
     * ⚠️ DEUX CORRECTIONS ICI (passe nº 111), ET LES DEUX COMPTENT.
     *
     * 1. ON ATTEND QUE L'ÉCRAN SOIT REDESSINÉ. `setErreurs(…)` vient
     *    d'être appelé, mais React ne repeint qu'APRÈS ce gestionnaire :
     *    au moment où l'on visait, les marques rouges n'étaient pas
     *    encore posées, la page n'avait donc pas sa hauteur finale, et
     *    le défilement doux atterrissait à côté. Deux images d'attente
     *    suffisent : la première laisse React écrire, la seconde laisse
     *    le navigateur mesurer.
     *
     * 2. ON NE PREND PLUS LE CLAVIER. `element.focus()` sur un champ de
     *    texte OUVRE LE CLAVIER DU TÉLÉPHONE : la fenêtre visible est
     *    aussitôt réduite de moitié, le navigateur refait sa mise en
     *    page et ANNULE le défilement en cours — d'où « la page ne
     *    remonte pas ». Les deux cas signalés visaient justement un
     *    champ de saisie (le nom, l'Instagram) ; ceux qui visaient une
     *    section, eux, marchaient. Le rouge et le défilement disent où
     *    aller ; on laisse la personne toucher son champ elle-même.
     */
    const poser = () => {
      const element = document.getElementById(premiere[1]);
      if (!element) return;
      noterNavigation(
        `SCROLLINTOVIEW · FormulaireFiche (champ en faute) · ` +
          `page à ${Math.round(window.scrollY)} avant`
      );
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    requestAnimationFrame(() => requestAnimationFrame(poser));
  }

  /**
   * LA MARQUE ROUGE S'EFFACE DÈS QUE LE MANQUE EST COMBLÉ (passe nº 111)
   * ====================================================================
   * ⚠️ AVANT, ELLE ATTENDAIT UNE NOUVELLE VALIDATION. On remplissait
   * son logo : l'encadré restait rouge. Son nom : rouge aussi. Son
   * Instagram : rouge encore. Il fallait re-cliquer « Envoyer » pour
   * que la page consente à reconnaître le travail fait — et comme
   * d'autres champs manquaient toujours, on repartait pour un tour
   * sans jamais voir un seul rouge s'éteindre. Le formulaire donnait
   * l'impression de ne rien enregistrer.
   *
   * DÉSORMAIS, À CHAQUE FRAPPE : on rejoue la validation, et on RETIRE
   * les reproches qui n'ont plus lieu d'être. CHAQUE CHAMP SE CORRIGE
   * DONC SEUL — le nom éteint le nom, l'Instagram éteint l'Instagram,
   * et dans le bloc 6 chaque intertitre s'éteint de son côté ;
   * l'encadré du bloc, lui, ne redevient normal que lorsque ses deux
   * causes ont disparu, puisqu'il les lit toutes les deux.
   *
   * ⚠️ ON N'AJOUTE JAMAIS RIEN ICI, on ne fait qu'enlever : reprocher
   * un champ vide à quelqu'un qui n'a pas fini de le remplir serait
   * insupportable. C'est « Envoyer » qui accuse, et lui seul.
   * ⚠️ ET ON NE TOUCHE QU'AUX CLÉS QUE LA VALIDATION PRODUIT : un motif
   * de relecture ou une panne de serveur (`erreurs.general`) ne se
   * balaient pas parce qu'on a tapé une lettre.
   */
  useEffect(() => {
    setErreurs((courantes) => {
      const cles = Object.keys(courantes);
      if (cles.length === 0) return courantes;
      const encore = valider();
      const gardees = cles.filter(
        (cle) =>
          encore[cle] || !ORDRE_ERREURS.some(([connue]) => connue === cle)
      );
      if (gardees.length === cles.length) return courantes;
      const suivantes: Record<string, string> = {};
      for (const cle of gardees) suivantes[cle] = courantes[cle];
      return suivantes;
    });
    //  `valider` et `ORDRE_ERREURS` sont recréés à chaque rendu : les
    //  mettre en dépendance rejouerait l'effet en boucle. Ce qu'ils
    //  LISENT, en revanche, est listé ici au complet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nom,
    bio,
    typeFiche,
    etablissement,
    blocUnComplet,
    photoProfil,
    apercuProfil,
    photosPortfolio,
    filtresCoches,
    instagram,
    booking,
    bookingMois,
    lienLibre,
  ]);

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    const fautes = valider();
    setErreurs(fautes);
    if (Object.keys(fautes).length > 0) {
      //  LE BLOC 1 INCOMPLET À L'ENVOI (modes retouchés après la
      //  confirmation) : les champs fautifs s'allument comme après
      //  « Je confirme » — même mécanique, mêmes encadrés rouges,
      //  aucune phrase (passe nº 116).
      if (fautes.mode || fautes.lieu) setConfirmationTentee(true);
      defilerVersErreur(fautes);
      return;
    }
    // LE LIEU DE RÉFÉRENCE de la fiche — celui qui la place sur la
    // carte : l'adresse ou la ville pour les trois premiers modes, LA
    // PREMIÈRE VILLE DE LA TOURNÉE pour un itinérant.
    if (!utilisateur || !lieuPrincipal || !typeFiche) return;
    setEnvoiEnCours(true);
    setErreurs((courantes) => {
      const reste = { ...courantes };
      delete reste.general;
      return reste;
    });
    try {
      const supabase = creerClientSupabaseNavigateur();

      /* LE DÉCOMPTE S'OUVRE AU CLIC (passe nº 118) : autant de pas
         que de fichiers à envoyer — les photos neuves du portfolio,
         plus la photo de profil si elle a changé. */
      const triees = [...photosPortfolio].sort((a, b) => a.ordre - b.ordre);
      const nombreAEnvoyer =
        triees.filter((photo) => photo.fichier).length + (photoProfil ? 1 : 0);
      let faites = 0;
      const avancer = () => {
        faites += 1;
        setAvancee({ faites, total: nombreAEnvoyer });
      };
      setAvancee({ faites: 0, total: nombreAEnvoyer });

      // 1 bis) LA PHOTO DE PROFIL, D'ABORD (une seule requête) — elle
      // ne repart vers le stockage que si elle a changé. Une fois en
      // ligne, l'écran garde son adresse DISTANTE : un nouvel essai
      // après un échec plus loin ne la renverra pas.
      let adresseProfil = apercuProfil;
      if (photoProfil) {
        const cheminProfil = `${utilisateur.id}/profil-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKET_PHOTOS)
          .upload(cheminProfil, photoProfil, { upsert: true });
        if (error) {
          throw new Error(
            `Ta photo de profil n'a pas pu être envoyée (${error.message}).`
          );
        }
        adresseProfil = supabase.storage
          .from(BUCKET_PHOTOS)
          .getPublicUrl(cheminProfil).data.publicUrl;
        setApercuProfil(adresseProfil);
        setPhotoProfil(null);
        avancer();
      }

      // 1) LE PORTFOLIO — chaque photo neuve part vers le stockage
      // EN DEUX FICHIERS : la pleine résolution (1080 × 1350) et sa
      // miniature (320 × 400), QUATRE PHOTOS À LA FOIS (passe nº 118,
      // voir lib/televerser-photos). Une photo déjà en ligne garde
      // ses adresses telles quelles. Chaque réussite avance le
      // décompte ET remplace le fichier local par l'adresse distante
      // dans la galerie : après un échec au milieu, le prochain
      // « Envoyer » ne reprend que ce qui manque.
      const distantes = await televerserPhotos({
        supabase,
        bucket: BUCKET_PHOTOS,
        dossier: utilisateur.id,
        photos: triees,
        libelleStyle,
        surPhotoEnvoyee: (envoyee) => {
          setPhotosPortfolio((courantes) =>
            courantes.map((photo) =>
              photo.cle === envoyee.cle
                ? {
                    ...photo,
                    apercu: envoyee.url,
                    miniature: envoyee.miniature,
                    fichier: null,
                    fichierMiniature: null,
                  }
                : photo
            )
          );
          avancer();
        },
      });
      const galerieAEcrire = triees.map((photo, rang) => {
        const distante = distantes.get(photo.cle);
        return {
          id: photo.id,
          style: photo.style,
          rendu: photo.rendu,
          nature: photo.nature,
          url: distante?.url ?? photo.apercu,
          miniature: distante ? distante.miniature : photo.miniature,
          ordre: rang,
        };
      });

      /* TOUT EST EN LIGNE : la fenêtre change de phrase — la base,
         elle, n'est écrite QU'À PARTIR D'ICI (tout ou rien : un envoi
         qui casse avant ce point n'a rien écrit dans la fiche). */
      setAvancee({ faites: nombreAEnvoyer, total: nombreAEnvoyer });

      // LA COMPATIBILITÉ — `photos_styles` et `photo_principale`
      // restent renseignées : les cartes, les aperçus et les fiches
      // qui n'ont pas encore migré s'en servent encore. La PREMIÈRE
      // photo de la galerie devient la photo principale, exactement
      // comme la vignette des cartes.
      const photosParStyle: Record<string, string> = {};
      for (const photo of galerieAEcrire) {
        if (!photosParStyle[photo.style]) {
          photosParStyle[photo.style] = photo.url;
        }
      }

      // 2) LA FICHE — NON PUBLIÉE, en attente de vérification.
      //    Plus aucune lecture de table de communes : le lieu choisi
      //    porte DÉJÀ tout (ville, code postal, région, pays, code
      //    pays, coordonnées, identifiant OpenStreetMap).
      const lienInstagram = normaliserLien(instagram, FORME_INSTAGRAM);
      //  LE LIEN LIBRE (un seul depuis la nº 270-§1) : validé, il part
      //  dans `site_web` — la colonne historique, pour que rien ne
      //  casse. Son titre suit (migration nº 51). La validation a déjà
      //  garanti les formes.
      const lienValide =
        lienLibre.etat !== "vide"
          ? {
              url: normaliserUrlLibre(lienLibre.url) ?? null,
              titre:
                lienLibre.titre.trim().slice(0, TITRE_LIEN_MAXIMUM) || null,
            }
          : null;
      const lienAEcrire =
        lienValide && lienValide.url && lienValide.titre ? lienValide : null;
      const villePrincipale =
        lieuPrincipal.ville ?? lieuPrincipal.intitule;
      const ligne = {
        user_id: utilisateur.id,
        nom: nom.trim(),
        // L'ADRESSE DE LA FICHE — recalculée seulement à la CRÉATION
        // (voir plus bas : `slug` est retiré des modifications).
        slug: "",
        type_fiche: typeFiche,
        // N'a de sens que sur une fiche de lieu ; sur un artiste, la
        // base garde sa valeur par défaut et personne ne la lit.
        etablissement: typeFiche === "salon" ? (etablissement ?? "salon") : "salon",
        // La localisation, découpée automatiquement par le choix.
        ville_nom: villePrincipale,
        ville_slug: slugifier(villePrincipale),
        latitude: lieuPrincipal.latitude,
        longitude: lieuPrincipal.longitude,
        // L'ADRESSE PRÉCISE n'est publiée que lorsqu'il y a une
        // vitrine : un artiste qui n'exerce qu'à domicile garde sa
        // rue pour lui (le code postal, lui, reste : il situe sans
        // désigner une porte).
        adresse: adressePubliable ? lieuPrincipal.adresse : null,
        code_postal: lieuPrincipal.code_postal,
        region: lieuPrincipal.region,
        pays: lieuPrincipal.pays,
        code_pays: lieuPrincipal.code_pays,
        lieu_id: lieuPrincipal.identifiant,
        photo_profil: adresseProfil,
        // FACULTATIVE : vide, la bio part en null (rien à afficher).
        bio: bio.trim() || null,
        styles: stylesChoisis,
        photos_styles: photosParStyle,
        photo_principale: galerieAEcrire[0]?.url ?? "",
        photos: [] as string[],
        // Instagram est OBLIGATOIRE (la validation l'a garanti).
        lien_instagram: lienInstagram ?? "",
        //  §2 (nº 408) — la case DM. Elle n'a de sens qu'avec un
        //  Instagram, et Instagram est obligatoire : pas de garde à
        //  poser ici. Sur une base non migrée, l'envoi la retire et
        //  continue (voir `optionnelles`).
        dm_instagram: dmInstagram,
        //  §2 (nº 270) — L'ÉTAT DES CARNETS, déclaré et obligatoire
        //  (la validation l'a garanti). Le mois n'a de sens qu'avec
        //  « délai d'attente » : sur 'ouvert' et 'ferme' il part en
        //  NULL — un délai d'un autre jour ne doit pas rester écrit.
        booking: booking || null,
        booking_mois:
          booking === "delai" && bookingMois ? Number(bookingMois) : null,
        //  ⚠️ `lien_youtube` N'EST PLUS ÉCRIT — VOLONTAIREMENT, ET
        //  C'EST LA GARANTIE LA PLUS FORTE QU'ON PUISSE DONNER.
        //  YouTube a quitté le produit (passe nº 101). La colonne, elle,
        //  reste en base avec son contenu : ne PAS la mentionner dans
        //  l'envoi signifie qu'aucun enregistrement ne peut plus la
        //  toucher — ni l'écraser, ni la vider. Si on avait écrit
        //  `lien_youtube: null`, la première modification d'une fiche
        //  aurait effacé en silence une adresse que son propriétaire
        //  n'avait pas demandé à retirer.
        //  LE LIEN LIBRE (passe nº 116) — colonne historique + son
        //  titre. ⚠️ `formulaire_demande` A DISPARU DE L'ENVOI : le
        //  champ est retiré du produit et sa colonne est effacée par
        //  la migration nº 47.
        //  ⚠️ `page_de_liens` ET `titre_page_de_liens` NE SONT PLUS
        //  ÉCRITS (§1, nº 270) — VOLONTAIREMENT, comme `lien_youtube`
        //  ci-dessus : le second emplacement a cédé sa place au
        //  Booking, et ne plus MENTIONNER ses colonnes dans l'envoi
        //  est la seule garantie qu'aucun enregistrement ne pourra
        //  les effacer. Une fiche qui portait une page de liens la
        //  garde, et sa fiche publique l'affiche comme avant.
        site_web: lienAEcrire?.url ?? null,
        titre_site_web: lienAEcrire?.titre ?? null,
        filtres_technique: filtresCoches.technique,
        filtres_composition: filtresCoches.composition,
        filtres_besoins: filtresCoches.besoins ?? [],
        publie: false,
        statut: "en_attente",
        // LE VERROU PART AVEC LA FICHE : confirmé à l'écran, il est
        // écrit en base au premier enregistrement. La base fait le
        // reste — elle refusera ensuite tout changement de type.
        exercice_verrouille: exerciceConfirme,
        // NOUVEL ENVOI = NOUVELLE ANNONCE : la fenêtre « Modifications
        // envoyées » a de nouveau le droit de s'afficher, une fois.
        annonce_vue_le: null,
      };
      // LES COLONNES DES MIGRATIONS RÉCENTES (statut, site_web,
      // filtres, type et mode d'exercice, photo de profil) peuvent
      // manquer tant que leur fichier SQL n'est pas passé : on
      // réessaie en retirant CELLE que l'erreur nomme, autant de fois
      // qu'il le faut — `publie: false` suffit à garder la fiche hors
      // ligne.
      const optionnelles = [
        "filtres_technique",
        "filtres_composition",
        "site_web",
        //  Le titre du lien libre (migration nº 51) : sur une base
        //  pas encore migrée, l'envoi le retire et continue.
        //  (`page_de_liens` et son titre ont quitté l'envoi à la
        //  nº 270 — plus rien à tolérer pour eux.)
        "titre_site_web",
        //  §2 (nº 270) — l'état des carnets (yokofolio-booking.sql).
        //  ⚠️ `booking_mois` AVANT `booking` : la recherche du fautif
        //  se fait par inclusion du nom dans le message d'erreur, et
        //  « booking » est contenu dans « booking_mois » — dans
        //  l'autre ordre, une base sans `booking_mois` ferait retirer
        //  `booking` d'abord, pour rien.
        "booking_mois",
        "booking",
        "statut",
        "type_fiche",
        "etablissement",
        "photo_profil",
        "annonce_vue_le",
        "exercice_verrouille",
        "filtres_besoins",
        //  §2 (nº 408) — la case DM (yokofolio-dm-instagram.sql).
        //  Aucun autre nom de colonne ne la contient : sa place dans
        //  la liste est libre (voir la note de `booking_mois`).
        "dm_instagram",
      ];

      if (!ficheChargee) {
        // ---- CRÉATION : l'insertion, comme avant. ----
        // L'ADRESSE DE LA FICHE, calculée UNE SEULE FOIS ICI : nom +
        // ville, numérotée si le couple existe déjà. Elle ne bougera
        // plus jamais — les liens partagés doivent tenir.
        const racine = slugFiche(nom, villePrincipale);
        const { data: voisines } = await supabase
          .from("tatoueurs")
          .select("slug")
          .like("slug", `${racine}%`);
        ligne.slug = slugFiche(
          nom,
          villePrincipale,
          ((voisines ?? []) as Array<{ slug: string }>).map((v) => v.slug)
        );
        let corps: Record<string, unknown> = { ...ligne };
        // On redemande l'IDENTIFIANT créé : un compte pouvant gérer
        // plusieurs fiches, c'est LUI qui dit sur laquelle rouvrir.
        let insertion = await supabase
          .from("tatoueurs")
          .insert(corps)
          .select("id")
          .maybeSingle();
        for (let essai = 0; essai < optionnelles.length && insertion.error; essai++) {
          const message = insertion.error.message.toLowerCase();
          const enCause = optionnelles.find(
            (colonne) => message.includes(colonne) && colonne in corps
          );
          if (!enCause) break;
          corps = { ...corps };
          delete corps[enCause];
          insertion = await supabase
            .from("tatoueurs")
            .insert(corps)
            .select("id")
            .maybeSingle();
        }
        if (insertion.error) throw new Error(insertion.error.message);
        // Direction L'ESPACE, rechargé de frais, SUR LA NOUVELLE FICHE :
        // la fenêtre d'annonce de validation s'y ouvre d'elle-même
        // (fiche en attente) — la fiche publique, elle, ne porte plus
        // aucun état.
        const creee = (insertion.data as { id?: string } | null)?.id ?? null;
        if (creee) {
          memoriserFiche(creee);
          // LES MODES ET LES STUDIOS suivent la fiche : ils vivent
          // dans leurs propres tables et ont besoin de son
          // identifiant. Puis partent les demandes de rattachement
          // vers les salons inscrits que l'artiste a désignés — c'est
          // eux qui confirmeront.
          const ecrits = await enregistrerExercice(
            supabase,
            creee,
            typeFiche,
            modesExercice,
            studios
          );
          await demanderLesRattachements(creee, ecrits.modes);
          //  LES CHOIX DES BLOCS 11 ET 12, faits pendant la création :
          //  ils partent maintenant, d'un coup, puisque la fiche a
          //  enfin un identifiant.
          await creerLesRattachementsEnAttente(
            creee,
            equipeEnAttente,
            adressesEnAttente
          );
          // LE PORTFOLIO suit la fiche : il vit dans sa propre table
          // et a besoin de son identifiant.
          await enregistrerPhotos(supabase, creee, galerieAEcrire);
        }
        // ENREGISTRÉ : il n'y a plus rien à perdre — le menu peut
        // ouvrir une création sans rien demander.
        marquerTravailEnCours(false);
        /*  ██ §1 (nº 645) — L'AVATAR DE LA BARRE SUIT CE QU'ON VIENT
             D'ÉCRIRE ██
             LE MOMENT EST OBLIGATOIRE, ET VOICI POURQUOI : la barre
             lit la photo dans la SESSION, et le menu ne la remet à
             jour qu'à sa prochaine ouverture. Sans cette ligne, une
             photo de profil déposée ici resterait invisible dans la
             barre — ou pire, l'ancienne y resterait affichée.
             ⚠️ ON ATTEND (`await`) : la page se recharge à la ligne
             suivante, et la session doit être écrite AVANT — sinon la
             course est perdue et l'écriture meurt avec le document.
             ⚠️ LE PORTFOLIO QU'ON VIENT D'ENREGISTRER DEVIENT CELUI QUE
             LA BARRE MONTRE. C'est la règle, et elle est simple à
             tenir : « le portfolio actif » n'est mémorisé nulle part
             ailleurs (constat de la nº 644) — cette photo EST le
             témoin. */
        /*  §1 (nº 675) — LE NOM PART AVEC LA PHOTO, désormais. La
             règle du propriétaire dit « DÈS LA CRÉATION, la photo ET LE
             NOM du portfolio prennent le dessus » — sans attendre la
             validation. La photo le faisait déjà (nº 645) ; le nom, non,
             et l'info-bulle de la barre continuait d'annoncer le nom du
             particulier. Un seul appel pour les deux : deux écritures,
             ce serait deux secousses de session pour un seul geste. */
        await rangerLIdentiteAffichee(
          supabase,
          { photo: adresseProfil, nom },
          { photo: avatarDuCompte(utilisateur), nom: nomAffiche(utilisateur) }
        );
        //  §2 (nº 269) — MÊME RÈGLE À LA CRÉATION : `replace`, jamais
        //  `assign` — l'enregistrement ne laisse aucune entrée de
        //  formulaire de plus dans la pile (voir la note du cas
        //  MODIFICATION, plus bas).
        window.location.replace(
          creee
            ? `/devenir-tatoueur/fiche?fiche=${creee}&enregistre=1`
            : "/devenir-tatoueur/fiche?enregistre=1"
        );
        return;
      }

      // ---- MODIFICATION ----
      // Les champs modifiables : la ligne SANS l'identité (le slug ne
      // change pas — les liens déjà partagés restent bons) ni les
      // décisions de l'admin.
      const champs: Record<string, unknown> = { ...ligne };
      delete champs.user_id;
      delete champs.slug;
      delete champs.publie;
      delete champs.statut;
      // ⚠️ LE VERROU NE PASSE PAS PAR LE BROUILLON. C'était le second
      // bug bloquant : sur une fiche EN LIGNE, tout part en brouillon
      // en attendant la relecture — et `exercice_verrouille` partait
      // avec. La colonne restait donc à `false`, la relecture ne la
      // lisait jamais (elle lit la LIGNE, pas le brouillon), et
      // l'encadré « Confirme ce premier bloc » revenait à chaque
      // visite. La fiche devenait impossible à modifier.
      // Une confirmation n'est pas un contenu à modérer — c'est une
      // décision de son propriétaire. Elle s'écrit DIRECTEMENT, comme
      // les modes et les studios, et pour la même raison.
      delete champs.exercice_verrouille;

      /*  §1 (nº 265) — LE NOM NE PASSE PLUS PAR LE BROUILLON, ET VOICI
          POURQUOI. Le relevé : on renomme un salon, le formulaire
          valide, mais la recherche de rattachement montre encore
          l'ancien nom — et le nouveau finit par disparaître.
          LA CAUSE, ligne à ligne : sur une fiche EN LIGNE (cas B),
          TOUT part dans `brouillon` et la colonne `tatoueurs.nom` ne
          bouge pas tant que l'administration n'a pas validé. Or la
          recherche de rattachement lit cette colonne
          (api/tatoueur/recherche-fiches : `.ilike("nom", …)` sur
          `tatoueurs`), pendant que l'espace du propriétaire, lui,
          affiche la ligne RECOUVERTE de son brouillon (le chargement
          plus haut : `{ ...ligne, ...brouillon }`). Deux vérités pour
          un même nom — c'est tout le relevé. Renommer un ARTISTE
          « fonctionnait » pour la seule raison que sa fiche n'était
          pas encore en ligne : cas A, écriture directe.
          LE REMÈDE : le NOM est une IDENTITÉ, pas un contenu à
          relire — comme le verrou d'exercice, comme les modes et les
          studios, il s'écrit DIRECTEMENT sur la ligne. La fiche part
          quand même en relecture (`statut: "en_attente"`), et tout le
          reste — bio, styles, photos — continue d'attendre dans le
          brouillon. Conséquences, toutes voulues :
           · la recherche trouve le nouveau nom IMMÉDIATEMENT, sans
             vider aucun cache ;
           · la fiche publique et la recherche lisent la MÊME colonne :
             elles ne peuvent plus se contredire ;
           · le nom ne peut plus revenir en arrière — il n'est plus
             dans le brouillon, donc plus rien ne peut le ramener.
          ⚠️ DANS QUELLES CONDITIONS LE BROUILLON ÉCRASAIT UNE
          MODIFICATION VALIDÉE (la question posée) : le brouillon porte
          une COPIE COMPLÈTE de la fiche (`{ ...ligne }`), et la
          validation la recopie telle quelle dans les colonnes
          publiques (api/admin/yokofolio/fiches, action « valider » :
          `{ ...brouillon, publie: true, brouillon: null }`). Un
          formulaire ouvert AVANT une validation et enregistré APRÈS
          repose donc un brouillon entier fait de valeurs d'alors : la
          validation suivante réécrit la fiche dans cet état-là, et ce
          qui avait été validé entre-temps disparaît. Le nom, lui, y
          échappe désormais. */
      const champsIdentite: Record<string, unknown> = { nom: ligne.nom };
      delete champs.nom;

      /**
       * ██ §1 (nº 285) — CE QUI PART EN VALIDATION, ET RIEN D'AUTRE ██
       * ==================================================================
       * LES SIX RÈGLES, appliquées ici :
       *  · RÈGLE 1 — la toute PREMIÈRE création passe par la validation
       *    (cas A, plus bas : inchangé) ;
       *  · RÈGLE 2 — une fois validée, TOUTE modification part
       *    automatiquement en ligne. Le brouillon disparaît de ce
       *    chemin : bio, styles, liens, filtres, adresses s'écrivent
       *    DIRECTEMENT, comme le faisaient déjà le nom, le verrou, les
       *    modes et les studios ;
       *  · RÈGLE 3 — EXCEPTION UNIQUE, LES PHOTOS QUI ARRIVENT. Deux
       *    cas, et ce test les couvre tous les deux : de nouvelles
       *    photos dans un carrousel existant, ou un nouveau style ET
       *    ses photos. Dans les deux cas ce sont des lignes SANS `id` —
       *    elles n'ont jamais existé en base ;
       *  · RÈGLE 4 — un style sans photo ne déclenche donc rien : il
       *    n'ajoute aucune ligne de photo. (Et il ne s'affiche nulle
       *    part : `stylesChoisis` se DÉDUIT des photos —
       *    `stylesDuPortfolio` —, un style vide n'entre même pas dans
       *    la fiche. Règle déjà en place, non réécrite.) ;
       *  · RÈGLE 5 — RÉORDONNER NE DÉCLENCHE RIEN : une photo déplacée
       *    garde son `id`, elle est mise à jour, pas insérée. Le nouvel
       *    ordre est en ligne tout de suite ;
       *  · RÈGLE 6 — la fiche RESTE EN LIGNE : `publie` n'est pas
       *    touché (il ne l'était déjà pas), et `statut` NON PLUS
       *    désormais — la fiche entière ne retourne JAMAIS dans la
       *    file. Seules les photos neuves attendent, invisibles au
       *    public (voir `enregistrerPhotos` et lib/tatoueurs).
       */
      const photosQuiArrivent = triees.filter((photo) => !photo.id).length;

      let maj: Record<string, unknown>;
      if (ficheChargee.publie) {
        // CAS B — LA FICHE EST EN LIGNE, ET ELLE Y RESTE (règles 2 et 6).
        //  ⚠️ LE BROUILLON A DISPARU DE CE CHEMIN, et c'est tout le
        //  §1 de la nº 285. Il servait à retenir la fiche entière le
        //  temps d'une relecture — or seules les PHOTOS se relisent
        //  désormais, et elles ne passent pas par là (elles ont leur
        //  propre attente, ligne par ligne). Tout le reste s'écrit
        //  DIRECTEMENT sur la ligne publique : c'est en ligne à la
        //  seconde où l'on enregistre.
        //  ⚠️ ET `brouillon: null` EST ÉCRIT : une fiche qui portait
        //  encore un brouillon d'avant cette passe le voit disparaître
        //  au premier enregistrement — sinon il attendrait pour
        //  toujours une validation qui ne viendra plus.
        maj = {
          ...champs,
          //  L'IDENTITÉ, elle, s'écrivait déjà sur la ligne (nº 265).
          ...champsIdentite,
          brouillon: null,
          motifs_moderation: null,
          note_moderation: null,
          // LE VERROU, LUI, S'ÉCRIT SUR LA LIGNE (voir plus haut).
          exercice_verrouille: exerciceConfirme,
          /*  ⚠️ MODIFIER NE RÉACTIVE PLUS RIEN (passe nº 133).
              La suppression s'annulait toute seule dès qu'on
              enregistrait : un geste destructeur défait par un geste
              anodin, sans que rien ne le dise. On ne peut d'ailleurs
              plus arriver ici avec une suppression en cours — la
              fiche désactivée n'ouvre PAS le formulaire, elle ouvre
              l'écran « Portfolio désactivé » et son bouton (voir tout
              en bas de ce fichier). `supprime_le` et `purge_le` ne
              sont donc plus touchés d'ici : la réactivation a UN seul
              chemin, explicite, /api/tatoueur/supprimer-fiche. */
        };
      } else {
        // CAS A — pas encore validée : la fiche en attente est mise à
        // jour DIRECTEMENT, l'admin verra la dernière version.
        maj = {
          ...champs,
          //  §1 (nº 265) — l'identité, retirée de `champs` plus haut,
          //  revient ici : le cas A écrit tout directement de toute
          //  façon, rien ne change pour lui.
          ...champsIdentite,
          statut: "en_attente",
          motifs_moderation: null,
          note_moderation: null,
          brouillon: null,
          // Idem : la fiche n'est pas encore en ligne, mais la
          // confirmation s'écrit au même endroit dans les deux cas.
          exercice_verrouille: exerciceConfirme,
          //  Voir ci-dessus (nº 133) : modifier ne réactive plus.
        };
      }

      const tolerees = [
        ...optionnelles,
        "brouillon",
        "motifs_moderation",
        "note_moderation",
      ];
      /*  §1 (nº 700) — `select("id")` N'EST PAS DÉCORATIF ICI : c'est
          lui qui fait rendre à la base LES LIGNES RÉELLEMENT TOUCHÉES.
          Sans lui, une modification qui ne trouve aucune ligne rend
          « aucune erreur » — et le formulaire annonçait « envoyé »
          pour une écriture qui n'avait rien écrit (audit nº 691, R8).
          Voir le contrôle après la boucle. */
      let modification = await supabase
        .from("tatoueurs")
        .update(maj)
        .eq("id", ficheChargee.id)
        .select("id");
      for (let essai = 0; essai < tolerees.length && modification.error; essai++) {
        const message = modification.error.message.toLowerCase();
        if (ficheChargee.publie && message.includes("brouillon")) {
          throw new Error(
            "La base n'est pas prête pour les modifications d'un portfolio en ligne (migration supabase/yokofolio-fiche-brouillon.sql)."
          );
        }
        const enCause = tolerees.find(
          (colonne) => message.includes(colonne) && colonne in maj
        );
        if (!enCause) break;
        maj = { ...maj };
        delete maj[enCause];
        modification = await supabase
          .from("tatoueurs")
          .update(maj)
          .eq("id", ficheChargee.id)
          .select("id");
      }
      /**
       * ██ §1 (nº 387) — QUAND LA BASE REFUSE LA BIO, LE DIRE OÙ IL
       * FAUT ██
       * ==================================================================
       * LE DÉFAUT RAPPORTÉ : on modifie sa biographie, on enregistre,
       * et rien ne change — ni au rechargement du formulaire, ni sur la
       * fiche publique.
       *
       * LA CAUSE, TROUVÉE EN BASE ET NON DANS LE CODE : la contrainte
       * `tatoueurs_bio_longueur`. La migration nº 13 l'avait posée en
       * « between 80 and 150 » — un MINIMUM de 80 caractères. La nº 18
       * l'a remplacée par une borne haute seule, mais elle fait dix
       * autres choses : une base où elle n'est pas passée garde le
       * minimum. Or le formulaire n'en connaît AUCUN : il annonce la
       * bio facultative et ne contrôle que le plafond. Une bio courte
       * est donc acceptée à l'écran, envoyée, puis refusée par
       * Postgres — et comme toute la fiche s'écrit en UN SEUL `update`,
       * c'est l'enregistrement ENTIER qui est annulé. D'où le
       * symptôme : rien nulle part.
       * LE VRAI REMÈDE est la migration `yokofolio-bio-sans-minimum.sql`,
       * livrée avec cette passe — trois lignes, sans danger, à passer
       * une fois.
       *
       * CE QUE FAIT CE BLOC, ET C'EST TOUT AUTRE CHOSE : il empêche que
       * l'échec soit MUET. Jusqu'ici le message de Postgres partait
       * dans le bandeau général, en anglais et en bas d'un formulaire
       * très long — on pouvait ne jamais le voir et croire que
       * l'enregistrement avait abouti. Il s'affiche désormais SUR LE
       * CHAMP DE LA BIO, en français, et la page y descend d'elle-même
       * (`ORDRE_ERREURS` porte déjà l'ancre `fiche-bio`).
       */
      if (
        modification.error &&
        modification.error.message
          .toLowerCase()
          .includes("tatoueurs_bio_longueur")
      ) {
        setAvancee(null);
        setErreurs((courantes) => ({
          ...courantes,
          bio:
            "Ta base de données refuse encore les biographies de moins de " +
            "80 caractères. Rien n'a été enregistré. Deux façons de s'en " +
            "sortir : écrire une présentation un peu plus longue, ou " +
            "passer une fois la migration " +
            "supabase/yokofolio-bio-sans-minimum.sql dans Supabase.",
        }));
        defilerVersErreur({ bio: "1" });
        return;
      }
      if (modification.error) throw new Error(modification.error.message);
      /*  ██ §1 (nº 700) — UNE ÉCRITURE QUI NE TOUCHE RIEN N'EST PAS UN
          SUCCÈS ██
          ==============================================================
          LE CAS, TROUVÉ PAR L'AUDIT nº 691 (R8) : le portfolio est
          effacé pendant qu'on l'édite — par l'administration qui abrège
          les sept jours, ou par la purge d'un compte. L'enregistrement
          vise alors une ligne qui n'existe plus. La base ne s'en émeut
          pas : « modifie les lignes dont l'identifiant vaut X » où il
          n'y en a aucune, ce n'est pas une erreur, c'est zéro ligne.
          `modification.error` restait nul, et le formulaire annonçait
          « envoyé » — le pire des retours, parce qu'il fait fermer
          l'onglet en confiance sur un travail perdu.
          ⚠️ CE N'EST PLUS LE CAS COURANT DEPUIS LA nº 696 : la
          suppression de l'administration est différée de sept jours, la
          ligne reste. Restent la purge à l'échéance, la suppression
          définitive immédiate, et la suppression du compte — trois
          chemins bien réels.
          ⚠️ ET LE MESSAGE NOMME LA CAUSE PLUTÔT QUE L'ERREUR : « ce
          portfolio n'existe plus » se comprend sans rien connaître de
          la base ; il dit aussi, implicitement, que réessayer ne sert
          à rien. */
      if (Array.isArray(modification.data) && modification.data.length === 0) {
        throw new Error(
          "Ce portfolio n'existe plus : il a été supprimé pendant que tu le " +
            "modifiais. Rien n'a été enregistré."
        );
      }

      // LES MODES ET LES STUDIOS sont écrits DIRECTEMENT, sans passer
      // par le brouillon : une adresse n'est pas un contenu à
      // modérer, et une session guest qui attendrait une validation
      // serait terminée avant d'être affichée. L'écriture se fait PAR
      // IDENTITÉ, pour ne pas défaire les rattachements déjà validés
      // (voir lib/enregistrer-exercice).
      const ecritsMaj = await enregistrerExercice(
        supabase,
        String(ficheChargee.id),
        typeFiche,
        modesExercice,
        studios,
        //  LES STUDIOS RETIRÉS À L'ÉCRAN — chargés puis supprimés par
        //  la personne : ils partent de la base avec cet envoi (bug
        //  du « studio fantôme », passe nº 104).
        //  §2 (nº 265) — … ET CEUX QUE LA CROIX A VIDÉS SANS LES
        //  RETIRER : quand un studio est le seul de l'écran, la croix
        //  efface son adresse et laisse l'encadré (avec son
        //  identifiant). `ecrireStudios` saute une ligne sans adresse
        //  (`if (!studio.lieu) continue`) — la ligne d'origine restait
        //  donc intacte en base, exactement comme les modes vidés. Un
        //  studio sans adresse n'est plus un studio : sa ligne part.
        idsStudiosCharges.current.filter(
          (id) => !studios.some((studio) => studio.id === id && studio.lieu)
        )
      );
      await demanderLesRattachements(String(ficheChargee.id), ecritsMaj.modes);
      // LE PORTFOLIO S'ÉCRIT DIRECTEMENT, comme les modes et les
      // studios : une photo taguée n'est pas un texte à relire, et
      // une galerie qui attendrait la modération serait invisible
      // pendant des jours.
      await enregistrerPhotos(
        supabase,
        String(ficheChargee.id),
        galerieAEcrire,
        //  LES PHOTOS RETIRÉES À L'ÉCRAN — chargées puis supprimées par
        //  la personne : elles seules partent de la base (passe nº 151).
        idsPhotosChargees.current.filter(
          (id) => !galerieAEcrire.some((photo) => photo.id === id)
        ),
        //  §1 (nº 285) — RÈGLE 3 : sur une fiche DÉJÀ VALIDÉE, les
        //  photos qui arrivent attendent leur relecture, invisibles au
        //  public. Sur une fiche pas encore publiée (cas A), non : elle
        //  passe la validation en entier, ses photos avec (règle 1).
        Boolean(ficheChargee.publie)
      );

      // Même retour que la création : l'espace rechargé, encadré
      // d'état en tête de formulaire — SUR LA MÊME FICHE.
      marquerTravailEnCours(false);
      /*  §1 (nº 645) — LE MÊME RANGEMENT QU'À LA CRÉATION, pour la même
           raison : la photo vient de changer en base, la session doit
           la porter avant que la page ne reparte. Voir la note du cas
           CRÉATION, plus haut. */
      /*  §1 (nº 675) — le nom part avec la photo, ici comme à la
           création : renommer son portfolio doit renommer ce que la
           barre annonce. */
      await rangerLIdentiteAffichee(
        supabase,
        { photo: adresseProfil, nom },
        { photo: avatarDuCompte(utilisateur), nom: nomAffiche(utilisateur) }
      );
      /*  §2 (nº 269) — LA CAUSE DU RETOUR QUI RAMÈNE AU FORMULAIRE.
          `location.assign` POUSSE une entrée d'historique : après un
          enregistrement, la pile contenait DEUX fois le formulaire —
          celui qu'on quittait, et celui rechargé avec `enregistre=1`.
          Le visiteur cliquait ensuite le logo (l'accueil), ouvrait une
          fiche, revenait… et retombait sur la seconde entrée du
          formulaire au lieu de l'accueil.
          `location.replace` REMPLACE l'entrée courante : le formulaire
          n'occupe plus qu'une place, celle qu'il avait déjà — rien
          n'est ajouté à la pile. Le rechargement, lui, est identique
          (même adresse, même encadré d'état, même fiche).
          ⚠️ LA RESTITUTION DE POSITION N'EST PAS TOUCHÉE : elle vit
          dans MemoireNavigation, qui écrit et relit par CLÉ D'ADRESSE
          (lib/navigation-session) — pas par index d'entrée. Remplacer
          au lieu d'ajouter ne lui retire aucune clé ; c'est même une
          entrée parasite de moins entre l'accueil et la fiche. */
      /*  §1 (nº 285) — L'ÉCRAN DE CONFIRMATION SAIT CE QUI VIENT DE SE
          PASSER, et l'adresse le lui dit — comme `enregistre=1` (le
          motif de la nº 191 : un GESTE, jamais un état à interpréter).
          `photos=1` : des photos neuves attendent leur relecture, on
          annonce les 24 h. Sans lui : tout est déjà en ligne, et
          l'annoncer sous 24 h serait un mensonge. */
      window.location.replace(
        `/devenir-tatoueur/fiche?fiche=${ficheChargee.id}&enregistre=1` +
          (ficheChargee.publie && photosQuiArrivent > 0 ? "&photos=1" : "")
      );
      return;
    } catch (erreur) {
      //  L'ÉCHEC REND LA MAIN : la fenêtre d'envoi se referme et le
      //  message dit ce qui s'est passé — les photos déjà parties
      //  sont gardées, le prochain essai n'enverra que le reste.
      //  Sur une RÉUSSITE, elle reste ouverte : la page repart, et la
      //  refermer une demi-seconde avant ferait clignoter le
      //  formulaire.
      setAvancee(null);
      setErreurs((courantes) => ({
        ...courantes,
        general: `L'envoi n'a pas abouti : ${
          erreur instanceof Error ? erreur.message : String(erreur)
        } Réessaie — rien n'a été perdu.`,
      }));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  /** RÉACTIVER LE PORTFOLIO (passe nº 133) — le seul chemin, depuis
      que modifier ne défait plus une suppression. La route est celle
      qui l'avait programmée, jouée à l'envers (`annuler: true`) :
      `supprime_le` et `purge_le` repassent à null, et RIEN D'AUTRE ne
      bouge — le portfolio retrouve exactement l'état qu'il avait
      (en ligne, en attente, à corriger). On RECHARGE ensuite la page
      plutôt que de rapiécer l'état : c'est la lecture de la fiche qui
      décide de ce qui s'affiche, autant la refaire en entier. */
  async function reactiverLePortfolio() {
    if (!ficheChargee || reactivation) return;
    setReactivation(true);
    setErreurReactivation(null);
    try {
      const reponse = await fetch("/api/tatoueur/supprimer-fiche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ficheChargee.id, annuler: true }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "La réactivation n'a pas abouti.");
      }
      window.location.reload();
    } catch (erreur) {
      setErreurReactivation(
        erreur instanceof Error ? erreur.message : "La réactivation n'a pas abouti."
      );
      setReactivation(false);
    }
  }

  /* ---------- PAS CONNECTÉ : DROIT À LA PAGE DE CONNEXION ----------
     ⚠️ L'ÉCRAN « CONNECTE-TOI D'ABORD » A DISPARU (passe nº 133). Une
     page entière pour dire « il faut un compte », avec un bouton qui
     ne menait qu'à un seul endroit : c'était un péage. Se déconnecter
     depuis son espace emmène désormais DIRECTEMENT à la page de
     connexion — l'effet de la redirection est exactement celui du
     bouton qu'on y trouvait. Rien ne s'affiche pendant le trajet :
     un titre montré une demi-seconde puis remplacé est un scintillement,
     pas une information. */
  //  §2 (nº 272) — LA GARDE PASSE PAR LE COUPE-CIRCUIT DU JOURNAL.
  //  Cette redirection est LA MOITIÉ d'un miroir : en face, la page
  //  de compte renvoie « session présente » vers l'espace
  //  (EcranAuthentification). Une session à moitié morte — cookie
  //  encore là, jeton de rafraîchissement déjà révoqué — fait
  //  alterner les deux verdicts de use-utilisateur, et les deux
  //  gardes se renvoyaient la balle : le clignotement du relevé,
  //  jusqu'à l'écran noir. `redirectionDeGarde` laisse passer les
  //  allers normaux, consigne chacun d'eux, et COUPE au-delà de
  //  trois dans la fenêtre — la page s'immobilise au lieu de mourir.
  useEffect(() => {
    if (
      pret &&
      !utilisateur &&
      redirectionDeGarde("espace", "/devenir-tatoueur")
    ) {
      router.replace("/devenir-tatoueur");
    }
  }, [pret, utilisateur, router]);

  if (pret && !utilisateur) {
    return <main className="flex-1" aria-hidden="true" />;
  }

  /* ---------- LA FICHE SE CHARGE (compte connecté) ----------
     PLUS D'« Un instant… » (passe nº 118) : rien pendant les 300
     premières millisecondes — un chargement rapide ne montre AUCUN
     écran d'attente — puis la silhouette du formulaire qui vient. */
  if (etape === "verification") {
    return (
      <main className="flex-1 mx-auto w-full max-w-[640px] px-4 sm:px-6 pt-10 pb-24">
        <Patience>
          <SqueletteFormulaire />
        </Patience>
      </main>
    );
  }

  /* ---------- LE PORTFOLIO EST DÉSACTIVÉ (passe nº 133) ----------
     Sa suppression est programmée : ni « Modification », ni « Mon
     portfolio » ne s'ouvrent — les DEUX vues arrivent ici, puisque ce
     retour précède le calcul de `vue`. Il n'y a rien à modifier sur
     un portfolio qu'on a décidé d'effacer, et rien à prévisualiser
     d'un portfolio que le public ne voit plus.

     UN SEUL GESTE POSSIBLE, ET IL EST EXPLICITE : le bouton. Avant la
     nº 133, enregistrer une modification quelconque annulait la
     suppression en silence ; désormais on le demande, et on le dit.

     LA CHARTE : aucun contour, aucune ombre — la carte n'est qu'un
     fond un cran plus clair (grammaire des blocs depuis la nº 130) ;
     le bouton est l'action finale de l'écran, donc capsule pleine. */
  if (ficheChargee && (ficheChargee.purge_le || ficheChargee.supprime_le)) {
    return (
      <main className="flex-1 mx-auto w-full max-w-[640px] px-4 sm:px-6 pt-8 sm:pt-10 pb-24">
        <div className="rounded-xl bg-sombre-carte px-4 py-8 sm:px-7 sm:py-10 text-center">
          {/*  §1 (nº 664) — LE TON PASSE AU ROUGE, comme les deux autres
               écrans « hors ligne » du site (le bouton de mise hors
               ligne, la page de rattachement) : un portfolio désactivé
               est un retrait, pas une information neutre. Le gris qu'il
               portait était le seul des trois à dire autre chose. */}
          <PastilleEvenement
            ton="probleme"
            symbole={IconeHorsLigne}
            classe="mx-auto"
          />
          <h1 className="mt-5 text-[19px] font-bold tracking-tight text-sombre-texte">
            Portfolio désactivé
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-sombre-texte-doux">
            Ton portfolio est actuellement désactivé.
          </p>
          {erreurReactivation && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-erreur/50 bg-erreur/10
                         px-4 py-3 text-[13px] leading-relaxed text-sombre-texte"
            >
              {erreurReactivation}
            </p>
          )}
          <button
            type="button"
            onClick={reactiverLePortfolio}
            disabled={reactivation}
            className="mt-7 inline-flex w-full items-center justify-center
                       rounded-full min-h-[50px] bg-primaire
                       hover:bg-primaire-fonce active:bg-primaire-fonce
                       text-white font-semibold transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {reactivation ? "Un instant…" : "Réactiver mon portfolio"}
          </button>
        </div>
      </main>
    );
  }

  /* ---------- LE FORMULAIRE ---------- */
  const modification = ficheChargee !== null;

  /** LA RELECTURE A PARLÉ (refus de validation, ou mise hors ligne
      par l'admin — même mécanique) : chaque motif coché est rattaché
      à UN champ du formulaire (config MOTIFS_MODERATION). Le champ
      visé s'encadre de ROUGE et porte l'explication dessous ; les
      motifs sans champ (« autre »…) restent dans l'encadré de tête,
      avec la note libre de la relecture. Tout disparaît au prochain
      enregistrement (la fiche repart en validation). */
  const horsLigne = Boolean(ficheChargee?.hors_ligne);
  const enCorrection =
    modification && ficheChargee.statut === "modifications";
  const motifsParChamp: Record<string, string> = {};
  const motifsGeneraux: string[] = [];
  if (enCorrection) {
    for (const slug of ficheChargee.motifs_moderation ?? []) {
      const motif = MOTIFS_MODERATION.find((m) => m.slug === slug);
      if (motif?.champ) {
        motifsParChamp[motif.champ] = motif.explication;
      } else if (slug !== "autre") {
        motifsGeneraux.push(motif?.label ?? slug);
      }
    }
  }

  /** « MA FICHE » — la fiche RENDUE comme le public la verra une fois
      la version en attente validée : la ligne de la base recouverte du
      brouillon éventuel, coulée dans le type des fiches publiques. */
  const tatoueurApercu: Tatoueur | null =
    modification && sourceFiche
      ? {
          id: String(sourceFiche.id ?? ficheChargee.id),
          nom: String(sourceFiche.nom ?? ""),
          slug: String(sourceFiche.slug ?? ficheChargee.slug),
          type_fiche: String(sourceFiche.type_fiche ?? "salon"),
          // L'APERÇU MONTRE CE QUI EST À L'ÉCRAN, pas ce qui est en
          // base : les modes en cours de saisie sont traduits ici,
          // pour que la personne voie exactement sa future fiche.
          modes: modesExercice
            .filter(modeComplet)
            .map((mode, rang) => apercuDuMode(mode, rang)),
          studios: studios
            .filter((studio) => studio.lieu)
            .map((studio, rang) => apercuDuStudio(studio, rang)),
          // L'ÉQUIPE AUSSI : le salon doit VOIR qui figure sur sa
          // page. Sans elle, il invitait à l'aveugle et n'avait aucun
          // moyen de constater qu'une acceptation avait bien pris.
          equipe: equipePublique,
          photo_profil: (sourceFiche.photo_profil as string | null) ?? null,
          ville_nom: String(sourceFiche.ville_nom ?? ""),
          ville_slug: String(sourceFiche.ville_slug ?? ""),
          latitude: Number(sourceFiche.latitude) || 0,
          longitude: Number(sourceFiche.longitude) || 0,
          styles: (sourceFiche.styles as string[]) ?? [],
          lien_instagram: String(sourceFiche.lien_instagram ?? ""),
          //  §2 (nº 387) — l'aperçu ne montre plus TikTok : la fiche
          //  ne l'affiche plus (ContenuFiche).
          lien_tiktok: null,
          adresse: (sourceFiche.adresse as string | null) ?? null,
          code_postal: (sourceFiche.code_postal as string | null) ?? null,
          region: (sourceFiche.region as string | null) ?? null,
          pays: (sourceFiche.pays as string | null) ?? null,
          code_pays: (sourceFiche.code_pays as string | null) ?? null,
          bio: (sourceFiche.bio as string | null) ?? null,
          site_web: (sourceFiche.site_web as string | null) ?? null,
          titre_site_web:
            (sourceFiche.titre_site_web as string | null) ?? null,
          //  ⚠️ LA PAGE DE LIENS RESTE MONTRÉE ICI (nº 270-§1) : c'est
          //  un chemin de LECTURE — l'aperçu doit dire ce que le
          //  public verra, et la colonne dormante s'affiche toujours.
          //  Seul L'ENVOI ne la mentionne plus.
          page_de_liens:
            (sourceFiche.page_de_liens as string | null) ?? null,
          titre_page_de_liens:
            (sourceFiche.titre_page_de_liens as string | null) ?? null,
          //  §3 (nº 270) — L'ÉTAT DES CARNETS, dans l'aperçu aussi :
          //  déclaré, il ouvre la liste des liens de « Ma fiche »
          //  exactement comme sur la fiche publique.
          booking: (sourceFiche.booking as Tatoueur["booking"]) ?? null,
          booking_mois: (sourceFiche.booking_mois as number | null) ?? null,
          filtres_technique: (sourceFiche.filtres_technique as string[]) ?? [],
          filtres_composition:
            (sourceFiche.filtres_composition as string[]) ?? [],
          photo_principale: String(sourceFiche.photo_principale ?? ""),
          photos_styles:
            (sourceFiche.photos_styles as Record<string, string>) ?? {},
          // LA GALERIE TELLE QU'ELLE EST À L'ÉCRAN — l'aperçu montre
          // ce qu'on vient de déposer, pas ce qui dort en base.
          galerie: [...photosPortfolio]
            .sort((a, b) => a.ordre - b.ordre)
            .map((photo, rang) => ({
              id: photo.id ?? photo.cle,
              style: photo.style,
              rendu: photo.rendu,
              nature: photo.nature,
              url: photo.apercu,
              miniature: photo.miniature,
              ordre: rang,
            })),
          filtres_besoins: filtresCoches.besoins ?? [],
          photos: (sourceFiche.photos as string[]) ?? [],
          publie: Boolean(ficheChargee.publie),
        }
      : null;

  /**
   * ██ §1 (nº 506) — LA VUE RESTE « APERÇU » TANT QU'UNE FENÊTRE EST
   * OUVERTE PAR-DESSUS ██
   * ------------------------------------------------------------------
   * SANS CELA, LE DÉFAUT SE REJOUERAIT SOUS UNE AUTRE FORME : ouvrir la
   * fiche d'un membre d'équipe pousse `/tatoueur/<slug>`, une adresse
   * SANS `?vue=apercu`. La vue rebasculerait donc sur « modification »,
   * et l'on verrait le FORMULAIRE apparaître sous la fenêtre — au lieu
   * de l'aperçu qu'on vient de quitter des yeux.
   * LA PROFONDEUR DE LA PILE TRANCHE : tant qu'une fenêtre est empilée,
   * l'aperçu reste affiché dessous. À la fermeture, la profondeur
   * retombe à zéro ET l'adresse redevient `?vue=apercu` — les deux
   * concordent, il n'y a pas d'instant où elles se contredisent.
   * ⚠️ C'EST LE MOTIF DE LA MOSAÏQUE, PAS UN SECOND : `GrilleTatoueurs`
   * garde exactement de cette façon sa fenêtre de base visible sous les
   * fiches empilées (`surProfondeur`). Rien de neuf n'est inventé.
   */
  const vue: "modification" | "apercu" =
    modification && (vueApercuDemandee || profondeurPile > 0)
      ? "apercu"
      : "modification";

  return (
    /*  ██ §1 (nº 506) — LA PILE DE FENÊTRES ENVELOPPE LES DEUX VUES ██
        ==============================================================
        LA nº 505 l'avait activée DANS `FicheTatoueur`, c'est-à-dire à
        l'intérieur du bloc `{vue === "apercu" && …}`. La pile changeait
        alors l'adresse qui la faisait vivre : le pushState vers
        `/tatoueur/<slug>` faisait retomber `vue` sur « modification »,
        démontant le composant et la pile avec lui. La fenêtre
        n'apparaissait jamais et il ne restait que la page de
        modification — le défaut relevé par le propriétaire.
        ELLE EST DONC MONTÉE ICI, au-dessus des deux vues : aucun
        changement d'adresse ne peut plus la démonter. C'est LA MÊME
        pile, le même mécanisme, le même historique (une entrée par
        ouverture, un cran par fermeture) et le même gel compté
        (nº 469) — rien n'est écrit en double.
        ⚠️ ELLE POSE SON PROPRE VOILE : contrairement à la mosaïque, il
        n'y a pas de fenêtre de base ici, donc `voileDejaPose` reste
        faux (son défaut).
        ⚠️ EN VUE MODIFICATION ELLE NE COÛTE RIEN : le formulaire ne
        porte aucun lien vers un profil, personne ne demande à ouvrir
        quoi que ce soit, et la pile vide ne rend que ses enfants. */
    <PileFiches surProfondeur={setProfondeurPile}>
    <main
      // La vue « Ma fiche » reprend EXACTEMENT le cadre de la page de
      // fiche publique (20 px sous la barre sur le web, 16 px sur
      // smartphone — que la photo annule pour TOUCHER la barre) ; le
      // formulaire garde ses marges d'origine.
      //  ⚠️ DEUX MARGES DE PAGE (passe nº 119) : l'aperçu garde ses
      //  12 px (la géométrie de la fiche publique en dépend) ; le
      //  FORMULAIRE, lui, passe à 16 px — sans encadrés sur
      //  smartphone, c'est la SEULE marge entre le texte et l'écran.
      //  ⚠️ ET PLUS RIEN NE L'ANNULE (passe nº 120) : les filets
      //  internes s'arrêtent désormais où s'arrête le texte.
      /*  ██ §6 (nº 505) — LE GLISSEMENT LATÉRAL DE L'APERÇU AU DOIGT ██
          ==============================================================
          LE RELEVÉ : au doigt, poser le doigt sur le va-et-vient
          « Profil | Portfolio » et glisser de côté déplaçait TOUTE
          l'interface, à partir de là et vers le bas.
          LA CAUSE, ET ELLE TIENT À QUATRE PIXELS : cet aperçu posait
          `px-3` (12 px) là où la fiche PUBLIQUE pose `px-4` (16 px —
          voir `FicheTatoueur`, la branche de droite du même genre de
          ternaire). Or tout ce qui va BORD À BORD au doigt sort de sa
          colonne par une marge négative de SEIZE pixels, calculée sur
          la marge de la vraie page : la photo (`mobile:-mx-4`), et
          surtout les rangées du portfolio (`-mx-4 px-4`), qui vivent
          justement SOUS le va-et-vient. Sur une marge de 12, ces
          16 px débordaient de QUATRE de chaque côté — huit de plus que
          l'écran. Le document devenait plus large que la fenêtre, et
          un glissement le faisait défiler. Rien n'était « capté » par
          un composant : c'était un vrai débordement.
          LE REMÈDE EST L'ÉGALITÉ, PAS UN VERROU : l'aperçu prend la
          MARGE DE LA FICHE PUBLIQUE. Les débords retombent alors
          exactement sur les bords de l'écran, comme sur la vraie page,
          et il n'y a plus rien à faire défiler.
          ⚠️ AUCUN GESTE LÉGITIME N'EST BRIDÉ, et c'est pour ça qu'on ne
          pose pas `overflow-x-hidden` : les galeries horizontales
          gardent leur glissement, le retour par glissement du
          navigateur aussi. On retire la cause, pas le symptôme — la
          leçon de la nº 228-§3, qui interdit ce masque sur le corps.
          ⚠️ C'EST AUSSI LA nº 473 TENUE À LA LETTRE : « l'aperçu montre
          ce que le public voit ». Il le montrait à quatre pixels près.
          ⚠️ LA VUE FORMULAIRE NE BOUGE PAS : sa marge de 16 px (nº 119)
          est dans l'autre branche, intouchée. */
      className={`flex-1 mx-auto w-full max-w-[1760px] ${
        vue === "apercu"
          ? "px-4 sm:px-6 pt-4 lg:pt-5 pb-0"
          : "px-4 sm:px-6 pt-8 sm:pt-10 pb-24"
      }`}
    >
      <div
        className={`mx-auto w-full max-w-[640px] ${
          vue === "apercu" ? "hidden" : ""
        }`}
      >
        {/* ---------- EN TÊTE DU FORMULAIRE ----------
            PLUS AUCUN badge ni bannière d'état ici : l'état vit dans
            le menu « Mon espace », et l'attente de validation est
            annoncée par la FENÊTRE (voir tout en bas). Ne reste que
            L'ENCADRÉ DE CORRECTION quand la relecture a parlé — les
            champs visés, eux, sont signalés en rouge sur place. */}
        {enCorrection && (
          <div className="mb-6 rounded-xl border border-erreur/50 bg-erreur/10 px-5 py-4">
            <p className="text-[14.5px] font-semibold text-sombre-texte">
              {horsLigne
                ? "Ton portfolio a été mis hors ligne."
                : "La relecture demande des corrections."}
            </p>
            <p className="mt-1 text-[14px] text-sombre-texte-doux leading-relaxed">
              Les points à revoir sont signalés en rouge ci-dessous —
              corrige-les, puis réenregistre : ton portfolio repartira
              en validation.
            </p>
            {motifsGeneraux.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-[14px] text-sombre-texte leading-relaxed">
                {motifsGeneraux.map((libelle) => (
                  <li key={libelle}>{libelle}</li>
                ))}
              </ul>
            )}
            {ficheChargee?.note_moderation && (
              <p className="mt-2 text-[14px] text-sombre-texte-doux whitespace-pre-line [overflow-wrap:anywhere]">
                {ficheChargee.note_moderation}
              </p>
            )}
          </div>
        )}

        {/* LE TITRE DU FORMULAIRE — création ou modification.
            ⚠️ LE SOUS-TITRE EST REVENU, MAIS UNE SEULE FOIS ET EN HAUT
            (passe nº 100). Cette phrase vivait DANS le bloc 1, sous le
            titre « Qui es-tu ? » : on la lisait après avoir commencé à
            répondre, alors qu'elle sert à rassurer AVANT — « je ne
            m'engage pas à tout déclarer d'un coup ». Elle est donc
            remontée sous le titre de la page, et retirée du bloc 1 où
            elle faisait désormais doublon.
            ⚠️ ET DEPUIS LA PASSE Nº 125, IL S'AFFICHE EN PERMANENCE —
            création COMME modification : la phrase, reformulée au
            présent (« Tu peux ajouter… »), reste vraie dans les deux
            cas. */}
        <h1 className="text-[clamp(1.6rem,4vw,2.1rem)] font-bold tracking-tight text-sombre-texte">
          {modification ? "Modifier mon portfolio" : "Créer mon portfolio"}
        </h1>
        {/* LE SOUS-TITRE, MIS EN VALEUR (passe nº 104) : il rassure —
            il mérite mieux qu'une ligne grise. Corps monté à 16 px,
            blanc doux, la marque en rose. */}
        <p className="mt-3 text-[16px] leading-relaxed text-sombre-texte">
          Tu peux ajouter d&apos;autres portfolios depuis ton compte{" "}
          <span className="font-semibold text-primaire">YokoFolio</span>.
        </p>
      </div>

      {/* ---------- LA VUE « MA FICHE » : l'aperçu public, rendu réel
          (carrousel, badges, bio mise en forme) — sans partage, sans
          signalement, et SANS mention d'état (l'état vit dans le menu
          « Mon espace » et sur le formulaire). ---------- */}
      {/* LA NOTICE DE CORRECTION (« Ma fiche ») : fiche hors ligne ou
          modification refusée — l'aperçu s'ouvre sur l'explication.
          Seule exception à la photo collée à la barre : ce bandeau
          passe devant, l'information prime. */}
      {vue === "apercu" && enCorrection && (
        <div className="mx-auto w-full max-w-[640px] mb-5 rounded-xl border border-erreur/50 bg-erreur/10 px-5 py-4">
          <p className="text-[14.5px] font-semibold text-sombre-texte">
            {horsLigne
              ? "Ton portfolio a été mis hors ligne."
              : "Ta dernière modification n'a pas été validée."}
          </p>
          <p className="mt-1 text-[14px] text-sombre-texte-doux leading-relaxed">
            Ouvre «&nbsp;Modification&nbsp;» : les points à corriger y
            sont signalés en rouge. Réenregistre, et ton portfolio
            repartira en validation.
          </p>
        </div>
      )}

      {vue === "apercu" &&
        (tatoueurApercu ? (
          // Directement dans le <main> : aucune marge ajoutée — la
          // géométrie (photo contre la barre sur smartphone, hauteur
          // d'écran sur le web) est EXACTEMENT celle de la vraie page.
          //  §4 (nº 330) — LA CONSIGNE D'ARRIVÉE, LUE DANS L'ADRESSE.
          //  « Mon portfolio » la pose (`entree=lien`, MenuEspace) :
          //  on arrive ici par un LIEN, la photo du haut ne monte pas.
          //  ⚠️ ELLE EST LUE PAR `useSearchParams`, ET NON PAR
          //  `window.location.search` : celui-ci est en retard d'un
          //  rendu au premier clic, c'est la leçon payée à la nº 329-§4.
          //  Une adresse sans consigne — un rechargement, un signet —
          //  garde sa photo, exactement comme avant.
          //
          //  §2 (nº 331) — ET AU DOIGT SEULEMENT. La nº 330 avait levé
          //  l'exclusion de l'aperçu sans la borner : la consigne
          //  s'appliquait aussi SUR ORDINATEUR, où le propriétaire ne
          //  l'a jamais demandée — sa grande photo de « Mon portfolio »
          //  avait disparu du web. Sur ordinateur, cette page redevient
          //  EXACTEMENT celle d'avant la nº 330 : la consigne ne lui est
          //  pas transmise, `sansPhoto` reste faux, rien d'autre n'a
          //  bougé. Le retrait ne concerne que le SMARTPHONE, et c'est
          //  ce qu'il voulait dire.
          //  ⚠️ LE SEUIL EST CELUI DU SITE, pas un nouveau :
          //  `data-appareil="mobile"` — un DOIGT, jamais une largeur de
          //  fenêtre (la règle depuis la nº 60), celui-là même que la
          //  variante `mobile:` de la feuille de style emploie.
          //  ⚠️ AUCUN CLIGNOTEMENT À CRAINDRE : cet aperçu n'est monté
          //  qu'une fois la fiche chargée, donc bien après que le
          //  script de tête a écrit `data-appareil` — la réponse est
          //  déjà juste au premier rendu de cette photo.
          <FicheTatoueur
            tatoueur={tatoueurApercu}
            demonstration={false}
            apercu
            entreeInitiale={surMobile ? (parametres.get("entree") ?? "") : ""}
          />
        ) : (
          <p className="mx-auto w-full max-w-[640px] py-6 text-sombre-texte-doux">
            L&apos;aperçu n&apos;a pas pu être chargé — réessaie en
            rouvrant l&apos;espace.
          </p>
        ))}

      {/* ---------- LA VUE « MODIFICATION » (et la création) ---------- */}
      <div
        className={`mx-auto w-full max-w-[640px] ${
          vue === "apercu" ? "hidden" : ""
        }`}
      >
      {/* `onChange` SUR LE FORMULAIRE ENTIER : en React, l'événement
          remonte — un seul écouteur attrape donc TOUS les champs
          natifs (nom, bio, dates, liens, cases, choix de fichier).
          Les gestes qui ne passent pas par un champ (styles, photo
          recadrée, modes, studios) le disent eux-mêmes. C'est ce
          drapeau que le menu consulte avant d'ouvrir une création. */}
      <form
        onSubmit={envoyer}
        onChange={marquerModifie}
        noValidate
        //  L'AIR ENTRE LES BLOCS. Les ENCADRÉS sont revenus sur
        //  smartphone (passe nº 128) : le filet de la nº 124 et les
        //  48 px de la nº 125 sont partis avec les blocs nus. Deux
        //  cartes n'ont plus besoin d'un si grand vide pour se
        //  distinguer — 32 px sur téléphone (un cran au-dessus des
        //  24 px du web : les titres y pèsent autant, mais l'écran
        //  colle tout), 24 px dès `sm` (passe nº 104).
        className="mt-10 sm:mt-8 flex flex-col gap-8 sm:gap-6"
      >
        {/* ---------- 1 · LE TYPE DE FICHE ET LE MODE D'EXERCICE ----
            C'EST LE CHOIX QUI STRUCTURE TOUT LE RESTE, et l'ancien
            encadré « adresse » a été ABSORBÉ ici : le ou les champs de
            localisation vivent DANS cet encadré, sous la sélection, et
            changent avec elle — une adresse, une ville et un rayon, ou
            une liste de villes. */}
        <Section
          numero="1"
          titre="Qui es-tu ?"
          id="section-exercice"
        >
          {/* ⚠️ LA PHRASE « Commence par créer un premier portfolio… »
              A ÉTÉ RETIRÉE D'ICI (passe nº 100) : elle est remontée
              SOUS LE TITRE DE LA PAGE, où elle se lit avant qu'on ait
              commencé. La garder aux deux endroits, c'était dire deux
              fois la même chose à trois centimètres d'intervalle. */}
          {motifsParChamp.adresse && (
            <p className="-mb-1 text-[13px] text-erreur">
              {motifsParChamp.adresse}
            </p>
          )}

          {/* LE PREMIER CHOIX — DES ONGLETS SOULIGNÉS (passe nº 112).
              Les trois mots côte à côte, sans piste ni fond : l'actif
              en blanc, les autres en gris, et sous eux la ligne fine —
              grise sur toute la largeur, épaisse et rose sous le mot
              choisi. Elle glisse d'un segment à l'autre au changement.
              ⚠️ LES RÈGLES DE LA GLISSIÈRE SONT CONSERVÉES : aucun
              segment actif tant qu'on n'a pas choisi, et une fois le
              bloc confirmé le sélecteur SE FIGE — la base refuse de
              toute façon le changement (migration nº 28). */}
          <OngletsLigne
            ariaLabel="Type de portfolio"
            fige={exerciceConfirme}
            options={CHOIX_PROFIL.map((entree) => ({
              cle: entree.slug,
              label: entree.label,
            }))}
            cleActive={
              typeFiche === null
                ? null
                : (CHOIX_PROFIL.find(
                    (entree) =>
                      typeFiche === entree.typeFiche &&
                      (entree.typeFiche === "artiste" ||
                        (etablissement ?? "salon") === entree.etablissement)
                  )?.slug ?? null)
            }
            surChoix={(cle) => {
              if (exerciceConfirme) return;
              const entree = CHOIX_PROFIL.find((choix) => choix.slug === cle);
              if (!entree) return;
              //  UN SEUL GESTE POSE LES DEUX VALEURS : le type de
              //  fiche ET la nature du lieu (un studio privé reste une
              //  fiche de lieu, voir CHOIX_PROFIL).
              const natureSuivante =
                entree.typeFiche === "artiste"
                  ? null
                  : (entree.etablissement as NatureEtablissement);
              //  ⚠️ LE BOGUE DE L'ADRESSE QUI SURVIVAIT — la parade
              //  tient (passe nº 105) : Salon ↔ Studio privé partagent
              //  `typeFiche = "salon"`, seul `etablissement` change, et
              //  les deux n'ont pas la même exigence d'adresse
              //  (`adresseSuffisante`). ON EFFACE DONC LES STUDIOS à
              //  chaque changement de nature ; le champ se reconstruit
              //  à vide grâce à la `key` posée dans BlocStudios.
              if (natureSuivante !== (etablissement ?? null)) {
                setStudios([
                  {
                    cle: cleNeuve("studio"),
                    nom: "",
                    source: "manuel",
                    lieu: null,
                  },
                ]);
              }
              choisirType(entree.typeFiche);
              setEtablissement(natureSuivante);
            }}
          />
          {texteErreur(erreurs.type) && (
            <p className="-mt-1 text-[13px] text-erreur">
              {texteErreur(erreurs.type)}
            </p>
          )}


          {/* CE QUI SUIT DÉPEND DU TYPE, et de lui seul.
              · ARTISTE → ses MODES D'EXERCICE, cumulatifs, ajoutés un
                par un depuis un menu — la section commence vide ;
              · SALON   → ses STUDIOS, une adresse ou plusieurs.
              Les deux vivent dans le même encadré que le choix du
              type : c'est une seule question (« qui es-tu, et où
              travailles-tu ? »), pas deux. */}
          {typeFiche === "artiste" && (
            //  ⚠️ PLUS DE FILET SOUS LA GLISSIÈRE (passe nº 105) :
            //  l'espace suffit à séparer le choix de ce qu'il ouvre.
            //  ⚠️ 12 PX (passe nº 125) : les rectangles des modes se
            //  posent directement sous la glissière, au MÊME écart que
            //  les rectangles du bloc des styles sous leurs onglets
            //  (`mt-3` de « Noir et gris / Couleur »). Le conteneur de
            //  la Section écarte déjà ses enfants de 20 px (gap-5) :
            //  le `-mt-2` retranche les 8 px de trop.
            <div
              className="-mt-2
                         opacity-100 transition-opacity duration-200 starting:opacity-0"
            >
              <BlocModesExercice
                modes={modesExercice}
                surChangement={(suivants) => {
                  marquerModifie();
                  setConfirmationTentee(false);
                  setModesExercice(suivants);
                  setErreurs((courantes) => {
                    const reste = { ...courantes };
                    delete reste.mode;
                    delete reste.lieu;
                    return reste;
                  });
                }}
                surMobile={surMobile}
                enErreur={erreurs.mode ?? erreurs.lieu ?? null}
                manque={manqueDesigne}
                manques={manquesDesignes}
              />
            </div>
          )}

          {/* ⚠️ PLUS DE `pt-4` ICI (passe nº 107) : le contenu de la
              Section porte déjà son propre écart (`gap-5`, 20 px), et
              les seize pixels ajoutés le poussaient à trente-six —
              « Où es-tu ? » flottait loin sous la glissière. Le mode
              ARTISTE garde les siens : sa grille de quatre choix, plus
              dense, a besoin de cet air-là. */}
          {typeFiche === "salon" && (
            <div className="opacity-100 transition-opacity duration-200 starting:opacity-0">
              <BlocStudios
                studios={studios}
                etablissement={etablissement}
                surChangement={(suivants) => {
                  marquerModifie();
                  setConfirmationTentee(false);
                  setStudios(suivants);
                  setErreurs((courantes) => {
                    const reste = { ...courantes };
                    delete reste.lieu;
                    return reste;
                  });
                }}
                surMobile={surMobile}
                //  ⚠️ « JE CONFIRME » ALLUME AUSSI LE CHAMP (passe
                //  nº 111). Un studio ou un salon qui confirmait sans
                //  adresse ne voyait RIEN se passer : la règle savait
                //  ce qui manquait, mais personne ne le montrait. Le
                //  champ rougit maintenant dès la tentative — sans un
                //  mot, comme partout ailleurs (MANQUE).
                enErreur={
                  erreurs.lieu ??
                  (manqueDesigne?.champ === "lieu" ? MANQUE : null)
                }
              />
            </div>
          )}

          {/* ---------- LA CONFIRMATION, EN BAS DU BLOC 1 ----------
              UN ENCADRÉ À PART, et pas une phrase perdue au fil du
              formulaire : ce qu'on demande ici n'est pas une saisie de
              plus, c'est une DÉCISION. Elle mérite son cadre, sa
              couleur d'accent et son bouton — le vocabulaire des
              interfaces qui ne veulent pas d'un « oui » distrait.
              Le bouton ne s'active qu'une fois le bloc rempli : rien
              ne sert de figer un choix incomplet. */}
        </Section>

        {/* ⚠️ LE BOUTON DE CONFIRMATION EST SOUS L'ENCADRÉ, PAS DEDANS,
            et il occupe toute la largeur — exactement comme le bouton
            d'enregistrement de la fiche. Un bouton qui engage la suite
            du formulaire ne se cache pas dans un coin de l'encadré
            qu'il valide.
            L'encadré et sa phrase (« Confirme ce premier bloc pour
            continuer ») ont disparu : le libellé du bouton dit la
            même chose, une fois au lieu de deux.
            ⚠️ IL N'EST TOUJOURS PAS « DÉSACTIVÉ » — c'est le mécanisme
            d'origine, conservé : tant que le bloc est incomplet, il ne
            confirme rien, mais l'appui ALLUME le champ fautif et en
            donne la raison. Un bouton éteint ne peut rien expliquer. */}
        {/*  §5 (nº 408) — LE BOUTON ET SA PHRASE, SUR UNE MÊME RANGÉE.
             Le bouton portait `self-start` parce que la colonne du
             formulaire étire ses enfants ; c'est désormais LA RANGÉE
             qui le porte, et le bouton garde sa taille naturelle à
             l'intérieur. `items-center` cale la phrase sur l'axe du
             bouton — « à droite, sur son alignement ».
             ⚠️ RIEN NE BOUGE QUAND LA PHRASE EST ABSENTE : une rangée
             flex d'un seul enfant occupe exactement la place de cet
             enfant.
             ██ §5 (nº 415) — AU DOIGT, LA PHRASE PASSE AU-DESSUS ██
             À droite du bouton, elle n'avait qu'une poignée de pixels
             sur un téléphone : elle se cassait en trois lignes contre
             le bord. `mobile:flex-col-reverse` la fait passer AU-DESSUS
             sans toucher à l'ordre du HTML — le bouton reste le premier
             élément lu et le premier tabulé, la phrase garde son
             `role="status"`. Sur le web, rien ne change : la rangée
             reste horizontale, la phrase à droite.
             ⚠️ `mobile:` SUIT LE POINTEUR, PAS LA LARGEUR (variante
             maison, globals.css l.34) : une fenêtre de bureau
             rétrécie garde donc la disposition du web, comme partout
             ailleurs sur le site.
             ⚠️ L'AIR AU-DESSUS DU BOUTON N'AUGMENTE QU'AVEC LA PHRASE,
             et c'est la propriété même du `gap` : un écart flex ne
             s'écrit QU'ENTRE DEUX ENFANTS. Au repos (phrase absente),
             la rangée n'a qu'un enfant — 0 px ajouté, l'espacement
             au-dessus du bouton reste exactement celui d'aujourd'hui.
             Quand la phrase paraît, c'est `gap-4` — 16 px, la MÊME
             valeur qui les sépare horizontalement sur le web : aucune
             valeur neuve n'est introduite.
             `mobile:items-start` : la phrase et le bouton s'alignent à
             gauche une fois empilés (`items-center` les aurait
             centrés dans la colonne). */}
        {!exerciceConfirme && typeFiche && (
          <div
            className="flex items-center gap-4 self-start
                       mobile:flex-col-reverse mobile:items-start"
          >
          <button
            type="button"
            title={!blocUnComplet ? (raisonIncomplet ?? undefined) : undefined}
            onClick={() => {
              if (!blocUnComplet) {
                setConfirmationTentee(true);
                return;
              }
              marquerModifie();
              setExerciceConfirme(true);
              setConfirmationTentee(false);
              setErreurs((courantes) => {
                const reste = { ...courantes };
                delete reste.mode;
                delete reste.lieu;
                return reste;
              });
            }}
            //  ⚠️ TAILLE NATURELLE (passe nº 112) : seule l'action
            //  FINALE de la page est pleine largeur. Une capsule à sa
            //  mesure pour tout bouton intermédiaire — et `self-start`,
            //  parce que la colonne du formulaire ÉTIRE ses enfants
            //  par défaut : sans lui, la capsule redevenait pleine
            //  largeur sans qu'aucune classe ne le demande.
            className={`inline-flex shrink-0 items-center justify-center rounded-full
                       px-7 min-h-[48px] text-[15px] font-semibold
                       transition-colors ${
                         blocUnComplet
                           ? "bg-primaire hover:bg-primaire-fonce active:bg-primaire-fonce text-white"
                           : "bg-sombre-eleve text-sombre-texte-doux"
                       }`}
          >
            Je confirme mon choix
          </button>
          {/*  LA PHRASE — le message du manque lui-même, jamais une
               chaîne recopiée : si le mot change dans
               lib/modes-exercice, il change ici sans qu'on y touche.
               `role="status"` la fait lire par les lecteurs d'écran au
               moment où elle paraît, comme les autres messages du
               formulaire. */}
          {aucunLieuChoisi && (
            <p
              role="status"
              data-manque-aucun-lieu=""
              className="text-[14px] font-semibold leading-snug text-erreur"
            >
              {manqueDesigne?.message}
            </p>
          )}
          </div>
        )}

        {/* ⚠️ TOUT CE QUI SUIT N'EXISTE QU'APRÈS LA CONFIRMATION.
            Ce n'est pas un repli progressif à la mode : le bloc 1
            décide des champs que le reste demande, et le laisser
            ouvert reviendrait à faire remplir une fiche qui pourrait
            encore changer de nature sous les doigts. */}
        {exerciceConfirme && (
          <>
        {/* ---------- 2 · PROFIL — logo, nom, bio, réseaux ----------
            ⚠️ QUATRE ENCADRÉS FONDUS EN UN (passe nº 112). « Ton
            nom », « Ta photo », « Ta présentation », « Tes réseaux » :
            quatre numéros pour un seul geste — dire qui l'on est. Les
            titres d'encadrés sont devenus les INDICATIONS des champs
            (INDICATIONS_CHAMPS) : « Nom du salon » se lit désormais LÀ
            OÙ l'on écrit le nom du salon.
            L'ORDRE DE LECTURE : le logo d'abord (c'est le visage de la
            fiche), le nom, la présentation, puis les liens.
            LES OBLIGATIONS NE BOUGENT PAS : nom, photo de profil et
            Instagram obligatoires ; bio, site et Linktree
            libres. */}
        <Section
          numero={numeroBloc("profil")}
          titre={titreBloc("profil", typeFiche, etablissement)}
          id="section-profil"
        >
          {/* LE LOGO — rond, OBLIGATOIRE.
              §1 (nº 657) — L'ÉCRITURE A DÉMÉNAGÉ, PAS CHANGÉ : le
              cercle, son appareil photo, le rond « + » et son libellé,
              le sélecteur de fichier et le recadreur vivent désormais
              dans `ChampPhotoRonde` (components/ChampsIdentite), que
              la fenêtre « Modifier » du particulier monte elle aussi —
              la consigne du propriétaire est « le même code réutilisé ».
              CE QUI RESTE ICI : l'OBLIGATION (le cercle rouge quand la
              photo manque, décidée par la validation de ce formulaire)
              et le reproche sous le cercle. */}
          <ChampPhotoRonde
            apercu={apercuProfil}
            enFaute={Boolean(erreurs.photoProfil)}
            surPhoto={photoRondeCadree}
            surErreur={erreurPhotoRonde}
          />
          {texteErreur(erreurs.photoProfil) && (
            <p className="text-[13px] text-erreur">
              {texteErreur(erreurs.photoProfil)}
            </p>
          )}
          {/* LE NOM — l'ancien titre d'encadré est l'indication du
              champ : « Ton nom d'artiste », « Nom du salon », « Nom du
              studio » selon la fiche.
              §1 (nº 657) — LE CHAMP LUI-MÊME EST PARTAGÉ
              (`ChampNomIdentite`, components/ChampsIdentite) avec la
              fenêtre « Modifier » du particulier : mêmes attributs,
              même classe `CHAMP` (nº 266), même garde-fou de
              remplissage automatique. LES DEUX REPROCHES RESTENT ICI —
              le manque, et le motif d'un refus de l'administration :
              eux n'appartiennent qu'à une fiche. */}
          <div>
            <ChampNomIdentite
              id="fiche-nom"
              valeur={nom}
              surChangement={setNom}
              indication={indicationChamp("nom", typeFiche, etablissement)}
              enFaute={Boolean(erreurs.nom || motifsParChamp.nom)}
            />
            {texteErreur(erreurs.nom) && (
              <p className="mt-1.5 text-[13px] text-erreur">
                {texteErreur(erreurs.nom)}
              </p>
            )}
            {motifsParChamp.nom && (
              <p className="mt-1.5 text-[13px] text-erreur">
                {motifsParChamp.nom}
              </p>
            )}
          </div>

          {/* LA BIO — libre, jamais signalée. Son indication suit la
              fiche (« Ta présentation », « À propos du salon »…), et
              son compteur vit DANS le champ, en bas à droite. */}
          <div>
            <ChampBio
              valeur={bio}
              surChangement={setBio}
              indication={indicationChamp("bio", typeFiche, etablissement)}
              nomAccessible={indicationChamp("bio", typeFiche, etablissement)}
              ancre="fiche-bio"
              enFaute={Boolean(erreurs.bio)}
            />
            {motifsParChamp.bio && (
              <p className="mt-1.5 text-[13px] text-erreur">
                {motifsParChamp.bio}
              </p>
            )}
          </div>

          {/* LES LIENS — quatre lignes, dans CET ordre et lui seul
              (§1, nº 270, TIKTOK RETIRÉ À LA nº 387) : 1. le Booking ·
              2. Instagram · 3. le lien libre. Instagram OBLIGATOIRE : c'est là que
              vit le travail d'un tatoueur ; le Booking aussi (l'état
              des carnets se déclare) ; les deux autres sont libres. */}
          <div className="flex flex-col gap-3">
            {/* §2 (nº 270) — LE CHAMP BOOKING : le menu maison, trois
                entrées mot pour mot. Sur « délai d'attente »
                SEULEMENT, le champ SE DIVISE : un second encadré
                apparaît à sa DROITE — le nombre de mois, 1 à 12.
                Les manques rougissent le bord de l'encadré en cause
                (`enErreur`), muets comme partout : rien déclaré → le
                menu ; « délai » sans mois → l'encadré des mois.
                ⚠️ Un menu ne pousse AUCUN évènement `change` de
                formulaire : `marquerModifie` s'appelle à la main,
                comme pour les filtres. */}
            <div id="fiche-booking" className="flex gap-3">
              <div className="min-w-0 flex-1">
                <MenuDeroulant
                  valeur={booking}
                  surChangement={(valeur) => {
                    marquerModifie();
                    setBooking(valeur);
                  }}
                  options={OPTIONS_BOOKING}
                  ariaLabel="L'état de ton booking"
                  placeholder="Booking"
                  sombre
                  //  §2 (nº 552) — LE PANNEAU OUVERT SANS VERRE : le
                  //  verre des menus compose rgb(9,15,23) sur le fond
                  //  de page, soit 1,00 de contraste — la liste ne se
                  //  détachait de rien. `opaque` lui donne le jeton
                  //  `carte` (#1A1F26), celui des fenêtres du site.
                  //  LE CHAMP NE BOUGE PAS : ses deux fonds restent
                  //  `fondRepos` / `fondActif`, juste dessous.
                  opaque
                  //  §1 (nº 388) — le fond des champs voisins.
                  //  §3 (nº 407) — ET LE CRAN QUI MANQUAIT À L'OUVERTURE :
                  //  sans lui, l'état ouvert valait `bg-sombre-eleve-clair`
                  //  comme le repos, et le menu ne répondait plus au clic.
                  //  `bg-sombre-haut` est le fond que TOUS les champs de ce
                  //  formulaire prennent quand ils deviennent actifs
                  //  (`focus:bg-sombre-haut`) — aucune couleur inventée.
                  fondRepos="bg-sombre-eleve-clair"
                  fondActif="bg-sombre-haut"
                  arrondi="rounded-lg"
                  hauteur="min-h-[48px]"
                  enErreur={Boolean(erreurs.booking)}
                />
              </div>
              {booking === "delai" && (
                <div id="fiche-booking-mois" className="w-32 shrink-0">
                  <MenuDeroulant
                    valeur={bookingMois}
                    surChangement={(valeur) => {
                      marquerModifie();
                      setBookingMois(valeur);
                    }}
                    options={OPTIONS_BOOKING_MOIS}
                    ariaLabel="Le délai d'attente, en mois"
                    placeholder="Mois"
                    sombre
                    //  §2 (nº 552) — le même panneau que son voisin :
                    //  les deux s'ouvrent côte à côte, ils ne peuvent
                    //  pas montrer deux gris différents.
                    opaque
                    fondRepos="bg-sombre-eleve-clair"
                    fondActif="bg-sombre-haut"
                    arrondi="rounded-lg"
                    hauteur="min-h-[48px]"
                    enErreur={Boolean(erreurs.bookingMois)}
                  />
                </div>
              )}
            </div>
            <ChampLienVerifie
              id="fiche-instagram"
              champ="instagram"
              indication="Instagram"
              icone={<IconeInstagram taille={20} monochrome />}
              valeur={instagram}
              surChangement={setInstagram}
              erreur={erreurs.instagram ?? null}
              motif={motifsParChamp.instagram ?? null}
            />
            {/*  ██ §2 (nº 408) — LA CASE « DEMANDES PAR DM » ██
                 ELLE N'EXISTE QU'AVEC UN INSTAGRAM SAISI : proposer
                 d'accepter les DM d'un compte qu'on n'a pas donné
                 n'aurait aucun sens, et la mention de la fiche se
                 pose sur la ligne Instagram — sans lien, pas de ligne.
                 ⚠️ LA CASE N'EST PAS UN DESSIN NEUF : c'est celle du
                 site, reprise au caractère près de `FenetreSignalement`
                 et de `BoutonHorsLigne` — une case NATIVE (`<input
                 type="checkbox">`) de 16 px, teintée du rose de la
                 charte par `accent-(--rw-primaire)`, dans un `<label>`
                 qui rend la phrase entière cliquable. Ses angles
                 légèrement arrondis viennent du système, comme sur les
                 autres cases du site : les redessiner demanderait de
                 remettre à zéro l'apparence native, ce qui coûterait
                 l'état indéterminé, le focus clavier et le rendu de
                 chaque plateforme — pour un arrondi qui est déjà là.
                 ⚠️ ELLE NE DÉCOCHE RIEN TOUTE SEULE : effacer son
                 Instagram masque la case mais garde la valeur, et le
                 champ étant OBLIGATOIRE, on ne peut pas enregistrer
                 une fiche sans lui — la valeur ne peut donc jamais
                 partir en base sans son compte. */}
            {instagram.trim() !== "" && (
              <label
                className="flex items-center gap-2.5 min-h-[36px] text-[14.5px]
                           text-sombre-texte cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={dmInstagram}
                  onChange={(evenement) => {
                    marquerModifie();
                    setDmInstagram(evenement.target.checked);
                  }}
                  className="w-4 h-4 accent-(--rw-primaire)"
                />
                J&apos;accepte les demandes par DM Instagram.
              </label>
            )}
            {/*  §2 (nº 387) — LE CHAMP TIKTOK EST SUPPRIMÉ, sur
                 décision du propriétaire. Instagram reste, intact.
                 ⚠️ LA COLONNE `lien_tiktok` N'EST PAS TOUCHÉE, et
                 elle ne l'est plus JAMAIS : elle a quitté l'envoi,
                 exactement comme `lien_youtube` à la nº 101. Ne pas
                 la mentionner est la garantie la plus forte qu'aucun
                 enregistrement ne peut désormais l'écraser ni la
                 vider — écrire `lien_tiktok: null` aurait effacé en
                 silence, à la première modification, une adresse que
                 personne n'avait demandé à retirer. Les fiches, elles,
                 ne la lisent plus (ContenuFiche, §2 nº 387). */}
            {/* ⚠️ LES CHAMPS « Site web » ET « Linktree » ONT DISPARU
                (passe nº 116) : à leur place, UN EMPLACEMENT LIBRE —
                « Ajouter un lien », URL + TITRE choisi par la
                personne (16 caractères), rien n'est deviné. IL N'EN
                RESTE QU'UN (§1, nº 270) : le second a cédé sa place
                au Booking — voir l'état `lienLibre` pour ce que
                deviennent ses colonnes. Le MOTIF de la relecture,
                lui, garde sa ligne : c'est un texte qui apprend
                quelque chose — y compris celui d'une page de liens
                enregistrée avant la nº 270, que le formulaire ne
                peut plus éditer mais dont l'explication vaut
                toujours. */}
            <div>
              <LienLibre
                id="fiche-lien-1"
                valeur={lienLibre}
                surChangement={(suivant) => {
                  marquerModifie();
                  setLienLibre(suivant);
                }}
                erreur={erreurs.lien1 ?? null}
              />
              {motifsParChamp.site && (
                <p className="mt-1.5 text-[13px] text-erreur">
                  {motifsParChamp.site}
                </p>
              )}
              {motifsParChamp.pageDeLiens && (
                <p className="mt-1.5 text-[13px] text-erreur">
                  {motifsParChamp.pageDeLiens}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ---------- 5 · LE PORTFOLIO ----------
            UN CATALOGUE, plus une liste de 22 cases à remplir. Le
            style ne se coche plus : il se DÉDUIT des photos déposées
            (voir `stylesChoisis`). Une case cochée sans photo ne
            voulait rien dire, et une photo sans style est impossible. */}
        <Section
          numero={numeroBloc("portfolio")}
          titre={titreBloc("portfolio", typeFiche, etablissement)}
          id="section-styles"
        >
          {motifsParChamp.styles && (
            <p className="-mb-1 text-[13px] text-erreur">
              {motifsParChamp.styles}
            </p>
          )}
          <BlocPortfolio
            photos={photosPortfolio}
            surChangement={(suivantes) => {
              marquerModifie();
              setPhotosPortfolio(suivantes);
              setErreurs((courantes) => {
                const reste = { ...courantes };
                delete reste.styles;
                delete reste.photos;
                return reste;
              });
            }}
            enErreur={erreurs.styles ?? erreurs.photos ?? null}
            //  LE CONTEXTE DE LA SUGGESTION DE STYLE (passe nº 122) :
            //  l'administration voit de quel portfolio la demande est
            //  partie. Nul sur une fiche jamais enregistrée — la
            //  demande reste valable, elle arrive simplement sans nom
            //  de fiche.
            ficheId={ficheChargee?.id ?? null}
          />
          {motifsParChamp.photos && (
            <p className="text-[13px] text-erreur">{motifsParChamp.photos}</p>
          )}
        </Section>

        {/* ---------- 6 · SPÉCIFICITÉS — UN SEUL ENCADRÉ, TROIS
            FAMILLES (passe nº 101) ----------
            AVANT : trois encadrés numérotés d'affilée — « Techniques
            maîtrisées », « Types de projets », « Spécificités » —
            remplis des mêmes petits interrupteurs. Trois titres, trois
            cadres et trois numéros pour un seul geste : déclarer ce
            qu'on pratique. L'écran donnait à cette déclaration le
            poids de trois étapes.
            MAINTENANT : un encadré, et à l'intérieur trois INTERTITRES
            qui gardent les familles nettes. On lit une fois « ce que
            je fais », puis on descend.

            ⚠️ SEULE LA PRÉSENTATION FUSIONNE — RIEN D'AUTRE.
            · les trois listes de cases sont celles de FILTRES_TATOUAGE,
              intactes, dans le même ordre ;
            · `filtresCoches` garde ses TROIS clés, et l'enregistrement
              ses trois colonnes (`filtres_technique`,
              `filtres_composition`, `filtres_besoins`) ;
            · le moteur de recherche garde ses TROIS groupes — c'est ce
              qui permet de chercher « handpoke » sans ramener
              « cover » ;
            · la fiche publique garde ses sections distinctes.
            · les ancres `section-technique` et `section-composition`
              restent posées SUR CHAQUE FAMILLE : c'est là que le
              défilement automatique amène quand une famille est vide
              (voir ORDRE_ERREURS). Les déplacer sur l'encadré ferait
              atterrir en haut du bloc, sans dire laquelle est en
              cause. */}
        <Section
          numero={numeroBloc("specificites")}
          titre={titreBloc("specificites", typeFiche, etablissement)}
          id="section-specificites"
        >
          {/* ⚠️ PLUS DE FILET ENTRE LES FAMILLES (passe nº 124) : le
              VIDE et les intertitres en capitales suffisent à les
              tenir séparées — un trait de moins, c'est un niveau de
              moins à lire. L'écart passe à 28 px (`gap-7`) : sans le
              trait, les 45 px d'avant (24 + filet + 20) béaient, et
              20 px collaient une famille à la précédente. 28 px est
              LE RYTHME du bloc — le même que la marge du bloc
              Organisation (point 7 de la même passe). */}
          <div className="flex flex-col gap-7">
            {FILTRES_TATOUAGE.map((groupe) => (
              <div key={groupe.groupe} id={`section-${groupe.groupe}`}>
                {/* 14 px (passe nº 105) : à 13, l'intertitre en
                    capitales espacées tombait sous le seuil du
                    confortable — il se cherchait au lieu de se lire. */}
                <h3
                  className={`mb-3 text-[14px] font-semibold uppercase
                             tracking-[0.1em] ${
                               erreurs[groupe.groupe]
                                 ? "text-erreur"
                                 : "text-sombre-texte-doux"
                             }`}
                >
                  {sousTitreSpecificites(groupe.groupe, typeFiche)}
                </h3>
                {/* AUCUNE LIGNE D'EXPLICATION SOUS LES CASES : le
                    libellé seul suffit, et la grille retrouve un
                    rythme régulier — toutes les lignes ont la même
                    hauteur, l'œil descend sans accroc. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                  {groupe.options.map((option) => (
                    <Interrupteur
                      key={option.slug}
                      allume={(filtresCoches[groupe.groupe] ?? []).includes(
                        option.slug
                      )}
                      surBascule={() =>
                        basculerFiltre(groupe.groupe, option.slug)
                      }
                      libelle={option.label}
                    />
                  ))}
                </div>
                {texteErreur(erreurs[groupe.groupe]) && (
                  <p className="mt-2 text-[13px] text-erreur">
                    {texteErreur(erreurs[groupe.groupe])}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ---------- LES HORAIRES D'OUVERTURE ----------
            ⚠️ AUX SALONS SEULS. Un studio privé reçoit sur rendez-vous :
            lui demander ses heures d'ouverture, c'est lui demander
            quelque chose qui n'existe pas (voir `aDesHoraires`) — il
            SAUTE ce bloc, et garde le trou dans la numérotation. Un
            artiste, lui, n'a pas de lieu à ouvrir. */}
        {typeFiche === "salon" && aDesHoraires(typeFiche, etablissement) && (
          <Section
            numero={numeroBloc("horaires")}
            titre={titreBloc("horaires", typeFiche, etablissement)}
          >
            <BlocHorairesStudio
              prefixe="horaires-salon"
              horaires={studios[0]?.horaires ?? undefined}
              surChangement={(horaires) => {
                marquerModifie();
                setStudios((courants) =>
                  courants.length === 0
                    ? courants
                    : [{ ...courants[0], horaires }, ...courants.slice(1)]
                );
              }}
            />
          </Section>
        )}

        {/* ---------- ORGANISATION — équipe et autre adresse ----------
            ⚠️ DEUX ENCADRÉS FONDUS EN UN (passe nº 112). « Équipe » et
            « Autre adresse » disaient chacun ce que leur champ
            demandait déjà — les deux questions restent, les titres
            partent. Le mot du bloc dit ce qu'ils ont en commun : ce
            que le lieu ORGANISE autour de lui.
            AUX LIEUX SEULS (salon comme studio privé) : un artiste n'a
            ni équipe ni seconde adresse.
            ⚠️ LES MÉCANIQUES NE BOUGENT PAS : le rattachement d'équipe
            part tout de suite quand la fiche existe, les choix
            attendent en mémoire pendant une création. */}
        {typeFiche === "salon" && (
          <Section
            numero={numeroBloc("organisation")}
            titre={titreBloc("organisation", typeFiche, etablissement)}
          >
            {/* ⚠️ LE FILET A DISPARU À LA PASSE Nº 123, ET SA MARGE
                S'EST ASSAGIE À LA Nº 124. La cale d'un pixel qui
                conservait les 41 px d'origine est partie avec elle :
                l'écart entre les deux questions s'aligne sur LE RYTHME
                DU BLOC SPÉCIFICITÉS — 28 px (`gap-7`), le même que
                celui qui sépare ses trois familles depuis la même
                passe. Deux blocs voisins, un seul rythme. */}
            <div className="flex flex-col gap-7">
              <BlocEquipeSalon
                ficheId={ficheChargee?.id ?? null}
                surEnAttente={setEquipeEnAttente}
              />
              <BlocAutreAdresse
                ficheId={ficheChargee?.id ?? null}
                surEnAttente={setAdressesEnAttente}
              />
            </div>
          </Section>
        )}

        {erreurs.general && (
          <p
            role="alert"
            className="rounded-lg border border-erreur/50 bg-erreur/10 px-4 py-3 text-sm text-sombre-texte"
          >
            {erreurs.general}
          </p>
        )}

        <button
          type="submit"
          disabled={envoiEnCours}
          className="inline-flex items-center justify-center rounded-full
                     min-h-[54px] bg-primaire hover:bg-primaire-fonce
                     text-white font-semibold text-[15.5px] transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {envoiEnCours
            ? "Envoi en cours…"
            : modification
              ? "Enregistrer mes modifications"
              : "Envoyer mon portfolio pour vérification"}
        </button>
          </>
        )}
      </form>

      {/* ⚠️ PLUS AUCUN PIED DE COMPTE ICI (passe nº 100).
          Le lien « Supprimer un portfolio ou mon compte » et le filet
          gris qui le surmontait ont été retirés de cet écran, dans
          TOUS ses états — création comme modification. Cette page sert
          à FABRIQUER un portfolio ; poser une sortie de secours vers
          la suppression au bas d'un formulaire qu'on est en train de
          remplir, c'est offrir un geste destructeur à qui cherchait
          simplement la fin de la page.
          ⚠️ L'ACTION N'EST PAS SUPPRIMÉE, ELLE EST AILLEURS : elle vit
          dans /devenir-tatoueur/securite (voir
          BlocSuppressions), où l'on peut retirer UNE fiche ou le compte
          entier. Le composant qui portait ce pied de page a été
          SUPPRIMÉ du dépôt à la nº 601 — il n'était plus rendu nulle
          part depuis cette passe-ci. */}
      </div>

      {/* LA FENÊTRE D'ENVOI (passe nº 118) — le décompte des photos,
          puis « Enregistrement du portfolio… » : l'écran ne se fige
          plus pendant l'enregistrement. */}
      {avancee && (
        <FenetreEnvoi faites={avancee.faites} total={avancee.total} />
      )}

      {/*  §1 (nº 657) — LE RECADREUR N'EST PLUS MONTÉ ICI : il est
           monté par `ChampPhotoRonde` (components/ChampsIdentite), qui
           est le seul à savoir quand une photo attend d'être cadrée.
           Il reste monté à l'ouverture et démonté à la fermeture, comme
           avant — chaque photo repart d'un cadrage neuf. */}

      {/* ---------- LA FENÊTRE D'ANNONCE DE VALIDATION ----------
          Une vraie fenêtre, dans la grammaire des autres (voile
          sombre, panneau carte, apparition en fondu) — l'horloge dans
          sa pastille rose, un texte COURT, un seul bouton. DEUX
          voix : la PREMIÈRE fiche (jamais publiée, jamais mise hors
          ligne) est accueillie chaleureusement ; une MODIFICATION est
          annoncée sobrement. Voile, Échap et « Compris » referment. */}
      {annonceValidation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-annonce-validation"
          className="fixed inset-0 z-[70] flex items-center justify-center p-5"
          onClick={fermerAnnonce}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-black/25
                   opacity-100 transition-opacity duration-200 starting:opacity-0" />
          <div
            onClick={(evenement) => evenement.stopPropagation()}
            /*  §1 (nº 544) — PLUS DE VERRE : l'attribut est retiré, le
                 jeton `carte` de la nº 466 le remplace (la teinte des
                 nº 542-543). `globals.css` intact (règle nº 172), le
                 liseré part avec l'attribut. L'ombre portée est
                 antérieure et reste ; rien d'autre ne bouge. */
            className="relative w-full max-w-[420px] rounded-xl
                       bg-sombre-carte p-6 sm:p-7 text-center
                       shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
          >
            {/*  §1 (nº 285) — TROIS VOIX, ET PAS UNE DE PLUS.
                 L'icône suit ce qui est dit : une HORLOGE quand
                 quelque chose attend, une COCHE quand tout est déjà
                 en ligne — annoncer 24 h d'attente pour une bio
                 corrigée serait faux (règle 2).
                 ██ §1 (nº 664) — ET LA COULEUR SUIT L'ICÔNE, DÉSORMAIS ██
                 LE DÉFAUT ÉTAIT ICI, et l'inventaire de la nº 663 l'a
                 sorti : les DEUX voix étaient peintes en ROSE. Or le
                 rose dit « une décision est attendue » — c'est vrai de
                 l'horloge, c'est FAUX de la coche, qui annonce une
                 fiche DÉJÀ en ligne. Le même écran disait donc « c'est
                 fait » avec la couleur de « ça attend ». Chaque voix
                 prend le ton de ce qu'elle dit. */}
            {!ficheChargee?.publie || horsLigne || photosEnRelecture ? (
              <PastilleEvenement
                ton="attente"
                symbole={IconeHorloge}
                classe="mx-auto"
              />
            ) : (
              <PastilleEvenement
                ton="valide"
                symbole={IconeCocheListe}
                classe="mx-auto"
              />
            )}
            {!ficheChargee?.publie && !horsLigne ? (
              <>
                <h2
                  id="titre-annonce-validation"
                  className="mt-5 text-[19px] font-bold text-sombre-texte leading-snug"
                >
                  Merci&nbsp;!
                </h2>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-sombre-texte-doux">
                  On vérifie ton portfolio&nbsp;: il sera en ligne sous
                  24&nbsp;h.
                </p>
              </>
            ) : photosEnRelecture ? (
              <>
                {/*  LE TITRE DIT CE QUI ATTEND, et rien d'autre : ce
                     ne sont plus « les modifications » — elles sont
                     déjà en ligne (règle 2) —, ce sont LES PHOTOS. Le
                     mot est vrai dans les deux cas de la règle 3, un
                     nouveau style n'existant que par ses photos. */}
                <h2
                  id="titre-annonce-validation"
                  className="mt-5 text-[19px] font-bold text-sombre-texte leading-snug"
                >
                  Nouvelles photos envoyées
                </h2>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-sombre-texte-doux">
                  Relues et en ligne sous 24&nbsp;h.
                </p>
              </>
            ) : (
              <>
                {/*  AUCUNE PHOTO NEUVE : il n'y a RIEN à attendre —
                     règle 2. On ne parle donc ni de relecture ni de
                     24 h : on dit que c'est fait.
                     §1 (nº 286) — ET LE SOUS-TITRE PARLE DU PORTFOLIO.
                     « Elles sont visibles tout de suite » ne disait pas
                     CE QUI est en ligne ; la personne vient d'envoyer
                     son portfolio, c'est de lui qu'elle attend des
                     nouvelles. */}
                <h2
                  id="titre-annonce-validation"
                  className="mt-5 text-[19px] font-bold text-sombre-texte leading-snug"
                >
                  C&apos;est enregistré
                </h2>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-sombre-texte-doux">
                  Ton portfolio est à jour et en ligne.
                </p>
              </>
            )}
            {/* RÈGLE DES BOUTONS (nº 116, 15C) : l'action FINALE d'une
                fenêtre est une capsule pleine, PLEINE LARGEUR — comme
                celle de la page. Les petits boutons centrés étaient
                les derniers éléments datés du formulaire. */}
            <button
              type="button"
              onClick={fermerAnnonce}
              className="mt-6 inline-flex w-full items-center justify-center
                         rounded-full min-h-[50px] bg-primaire
                         hover:bg-primaire-fonce active:bg-primaire-fonce
                         text-white font-semibold transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </main>
    </PileFiches>
  );
}
