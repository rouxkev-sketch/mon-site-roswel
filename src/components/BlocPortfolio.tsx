"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
  entreesExplorer,
  libelleStyle,
  //  §2-b (nº 475) — le jeton de trait du site, écriture unique.
  TRAIT_SEPARATION_FOND,
} from "@/config/tatouage";
import { GrilleGalerie } from "@/components/GrilleGalerie";
import {
  IconeChevronBas,
  IconeCocheListe,
  IconeCroix,
  IconePlus,
} from "@/components/Icones";
import { IconeAjouterPhoto } from "@/components/IconeAjouterPhoto";
import { estStyleMonochrome } from "@/config/tatouage";

/*  §1 (nº 685) — LE RECADREUR, CHARGÉ AU DÉPÔT D'UNE PHOTO. La note
    complète est dans `ChampsIdentite`, l'autre porteur : ce morceau de
    programme voyageait sur toute page alors qu'il ne sert qu'ici et
    là-bas, et seulement quand on dépose un fichier. */
const RecadreurPhoto = dynamic(
  () => import("@/components/RecadreurPhoto").then((m) => m.RecadreurPhoto),
  { ssr: false }
);
import { texteErreur } from "@/lib/erreurs-formulaire";
import { OngletsLigne } from "@/components/OngletsLigne";
//  §4 (nº 474) — au doigt, la fenêtre des styles devient une PAGE
//  plein écran : le gabarit partagé de la nº 465, l'étape d'historique
//  du C-4 (nº 330/332-§1) et le verrou de défilement compté (nº 469).
import { PagePleinEcranMobile } from "@/components/PagePleinEcranMobile";
import { useAppareilMobile } from "@/lib/appareil";
import { useEtapeQuiSeReferme } from "@/lib/etape-refermable";
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";
import {
  NATURES_PHOTO,
  PLAFOND_GALERIE,
  RENDUS_PHOTO,
  RENDU_TOUT_NOIR,
  libelleNature,
  libelleRendu,
  renduDOuverture,
} from "@/lib/photos-tatoueur";

/**
 * LES FORMATS QU'ON ACCEPTE À L'ENTRÉE — et pourquoi le HEIC en fait
 * partie depuis la passe nº 127.
 * =====================================================================
 * Un iPhone photographie en HEIC. Tant que l'entrée de fichiers
 * n'acceptait QUE du JPEG et du PNG, Safari devait CONVERTIR chaque
 * photo choisie avant de la rendre à la page — vingt conversions de
 * douze mégapixels avant que la moindre chose n'apparaisse, pendant
 * lesquelles rien ne répond. C'est le temps mort que décrivait le
 * propriétaire : « je valide dans la galerie, et rien ne se passe ».
 *
 * En acceptant le HEIC, Safari rend les fichiers TELS QUELS : plus rien
 * à convertir. iOS sait afficher et redessiner ces images nativement,
 * et ce qui SORT du recadreur reste du JPEG dans tous les cas (le
 * canevas ré-encode) : rien ne change en aval.
 *
 * Sur un navigateur qui ne sait pas lire le HEIC, l'image ne se décode
 * pas — la fenêtre le DIT et passe à la suivante (voir
 * `photoIllisible`), au lieu de rester sur un cadre noir.
 */
const FORMATS_PHOTO = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);
/** La même liste, pour l'attribut `accept` de l'entrée de fichiers. */
const ACCEPT_PHOTO =
  ".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif";

/**
 * LE BLOC « YOKO PORTFOLIO » — badges, rendus, natures, galeries
 * ==============================================================
 * ⚠️ REPENSÉ À LA PASSE Nº 109 (abandon des zones du corps), PUIS
 * ÉTENDU À LA Nº 110 (le flash devient une nature de photo). Ce qui
 * classe une photo tient en trois tags : LE STYLE, LE RENDU, LA
 * NATURE. Trois gestes, zéro formulaire.
 *
 * ⚠️ QUATRE GALERIES PAR STYLE depuis la nº 110 — deux rendus × deux
 * natures. Un flash n'est pas un style : c'est un dessin déjà prêt,
 * et il appartient toujours à un style (un flash de réalisme reste du
 * réalisme). Le classer ailleurs aurait cassé le rangement.
 *
 * LA STRUCTURE, EN QUATRE ÉTAGES
 * -------------------------------
 *  1. LA SÉLECTION EN FENÊTRE (passe nº 116). ⚠️ LES 38 BADGES
 *     AFFICHÉS D'UN BLOC ONT DISPARU : ils chargeaient l'interface.
 *     Au départ, UN BOUTON — un rond « + » et « Ajouter un style »,
 *     rien d'autre. Le clic ouvre une FENÊTRE par-dessus le
 *     formulaire : LA liste des 38 styles de A à Z, un par ligne,
 *     défilante, sans champ de saisie ni menu. « Traditionnel
 *     ethnique » y porte une flèche BIEN VISIBLE : un clic déploie
 *     ses onze styles dessous, décalés à droite. Choisir un style
 *     FERME la fenêtre et pose son BADGE sous le bouton ; les styles
 *     déjà choisis restent dans la liste, cochés et inertes — pas de
 *     doublon possible. Le badge ouvre SA section, dessous ; la CROIX
 *     de retrait vit dans l'ANGLE SUPÉRIEUR DROIT de cette section
 *     (plus dans le badge) : « taper SUPPRIMER » quand des photos
 *     seraient perdues, retrait immédiat sinon.
 *  2. LA NATURE — les onglets soulignés « Réalisation » / « Flash »,
 *     même grammaire que le bloc 1.
 *  3. LE RENDU — deux rectangles côte à côte, « Noir et gris » à
 *     gauche et « Couleur » à droite, chacun avec SON nombre de
 *     photos. C'est LE SEUL endroit du bloc où un nombre s'affiche.
 *  ⚠️ CES DEUX NIVEAUX ONT ÉTÉ INVERSÉS À LA PASSE Nº 117 (point 9) :
 *  le rendu passait devant la nature, alors qu'on range d'abord par
 *  « travail fait / dessin à prendre » et seulement ensuite par
 *  couleur. LES DEUX ARRIVENT PRÉSÉLECTIONNÉS sur leur première
 *  position, et le PREMIER BADGE est ouvert d'office (point 6) : à la
 *  réouverture d'un portfolio, la galerie est à l'écran sans un clic.
 *  4. LA GALERIE : jusqu'à vingt photos, en vignettes 4:5. On y voit
 *     tout, on AJOUTE par la tuile « + » en queue de grille, on OUVRE
 *     une photo d'un tap (recadrer à nouveau, ou supprimer — voir
 *     RecadreurPhoto), on RÉORDONNE par glisser-déposer.
 *
 * ⚠️ LE GLISSER-DÉPOSER EST CELUI DE LA PASSE « PHOTOS ET HORAIRES »,
 * repris TEL QUEL (GrilleGalerie) : appui long de 350 ms au doigt,
 * prise à la souris avec ombre portée, cohabitation réglée avec le
 * défilement et le pincement. Seules deux extensions inertes : la
 * tuile d'ajout en queue (hors mécanique), et le tap qui rend la CLÉ
 * de la photo touchée.
 *
 * PLUS DE MOSAÏQUE PERMANENTE sous chaque style : les photos ne se
 * voient que dans leur galerie, une fois ouverte. Le formulaire reste
 * court, qu'il y ait trois photos ou deux cents.
 *
 * L'AJOUT : tuile « + » → sélecteur de fichier du système → la
 * FENÊTRE DE RECADRAGE D'AVANT LE CATALOGUE (restaurée à l'identique)
 * s'ouvre par-dessus le formulaire → Valider → la photo rejoint la
 * galerie, en dernière position.
 *
 * LE PLAFOND : VINGT photos par couple style + rendu. Il ne se
 * signale qu'à L'APPROCHE (dès seize) — pas avant : un compteur
 * permanent ferait de la limite le sujet du bloc.
 */

/** Une photo en cours de saisie — telle que le formulaire la tient. */
export type PhotoEnSaisie = {
  cle: string;
  id?: string | null;
  style: string;
  /** `black_and_grey` ou `color` — toujours porté : une photo se
      dépose DANS la galerie d'un rendu. */
  rendu: string;
  /** `tatouage` ou `flash` — même règle : la galerie ouverte décide
      (passe nº 110). */
  nature: string;
  apercu: string;
  miniature: string | null;
  fichier?: File | null;
  fichierMiniature?: File | null;
  ordre: number;
};

/** Une clé locale neuve — jamais deux fois la même dans une session. */
let compteurPhoto = 0;
function clePhoto(): string {
  compteurPhoto += 1;
  return `photo-${Date.now()}-${compteurPhoto}`;
}

export function BlocPortfolio({
  photos,
  surChangement,
  enErreur,
  ficheId = null,
}: {
  photos: PhotoEnSaisie[];
  surChangement: (photos: PhotoEnSaisie[]) => void;
  enErreur?: string | null;
  /** La fiche d'où part une suggestion de style, pour le contexte de
      l'administration. Null tant que la fiche n'a jamais été
      enregistrée : la demande part quand même. */
  ficheId?: string | null;
}) {
  /** LES STYLES AJOUTÉS SANS PHOTO ENCORE (passe nº 116) : choisis
      dans la fenêtre, ils ont leur badge — le temps d'y déposer la
      première photo. Un style qui a des photos n'a pas besoin d'y
      figurer : ce sont les photos qui le portent. */
  const [stylesAjoutes, setStylesAjoutes] = useState<string[]>([]);
  /** La fenêtre de sélection des styles, par-dessus le formulaire. */
  const [fenetreStyles, setFenetreStyles] = useState(false);
  /** La famille dépliée DANS la fenêtre (« Cultures du monde »). */
  const [familleDepliee, setFamilleDepliee] = useState<string | null>(null);
  /** Le style dont la section est ouverte — un seul à la fois. */
  const [styleOuvert, setStyleOuvert] = useState<string | null>(null);
  /** Le rendu choisi sur les onglets, dans ce style. */
  const [renduOuvert, setRenduOuvert] = useState<string | null>(null);
  /** La nature dont la galerie est ouverte (tatouage / flash). */
  const [natureOuverte, setNatureOuverte] = useState<string | null>(null);
  /** Le style que la croix vise — la fenêtre « taper SUPPRIMER ». */
  const [aRetirer, setARetirer] = useState<string | null>(null);
  const [saisieSuppression, setSaisieSuppression] = useState("");
  /** La fenêtre de recadrage : une photo neuve (cle absente) ou une
      photo existante rouverte (cle présente). */
  const [recadrage, setRecadrage] = useState<{
    cle?: string;
    fichier: File;
  } | null>(null);
  const [erreurFichier, setErreurFichier] = useState<string | null>(null);
  /** LA SÉRIE EN COURS (passe nº 112) — les fichiers choisis d'un
      coup, recadrés l'un après l'autre : la fenêtre passe à la photo
      suivante à chaque « Valider », sans jamais revenir à la grille.
      `rang` est l'index du fichier actuellement dans la fenêtre. */
  const [serie, setSerie] = useState<{ fichiers: File[]; rang: number } | null>(
    null
  );
  /** VRAI pendant qu'un glisser de FICHIERS survole la grille (web) :
      la zone s'allume pour dire « dépose ici ». */
  const [deposeEnVue, setDeposeEnVue] = useState(false);
  /** §2 (nº 476) — LE CLIC À AVALER : levé à l'appui quand un champ de
      saisie avait encore le focus (le clavier était ouvert), consommé
      par le clic qui suit — voir la liste de la page plein écran. Une
      référence, pas un état : la réponse doit être prête DANS le
      gestionnaire, sans attendre un rendu. */
  const avalerLeProchainClic = useRef(false);
  const entreeFichier = useRef<HTMLInputElement>(null);
  /**
   * ██ §7 (nº 415) — « PRÉPARATION DES PHOTOS… » EST SUPPRIMÉE ██
   * ==================================================================
   * CE QU'ELLE SIGNALAIT (nº 127), et la mesure est conservée ici :
   * entre le « Valider » de la galerie du téléphone et l'arrivée des
   * fichiers dans la page, c'est LE NAVIGATEUR qui travaille — il sort
   * chaque photo de la photothèque. Ce travail bloque le fil principal
   * et il est PROPORTIONNEL au nombre de photos : 1,2 s pour une, 5,4 s
   * pour cinq, 29,5 s pour vingt (mesuré sur une page nue, téléphone
   * simulé). Pendant ce gel, rien ne se repeint et tout appui semble
   * sans effet. La phrase était levée JUSTE AVANT l'ouverture de la
   * galerie — donc peinte à temps pour être visible pendant le gel —
   * puis baissée au retour des fichiers, à l'annulation (`cancel`) ou
   * au retour du focus.
   *
   * LE PROPRIÉTAIRE LA SUPPRIME : « elle ne doit jamais apparaître ».
   * ⚠️ CE QUE CELA COÛTE, DIT SANS DÉTOUR : sur un téléphone et sur un
   * dépôt nombreux, l'artiste n'a plus AUCUN repère pendant le gel —
   * l'écran paraît figé, et rien ne lui dit que ses photos arrivent.
   * Le compromis est assumé par lui ; il est réversible en une passe si
   * le silence se révèle pire que la phrase.
   * ⚠️ TOUT L'ÉTAT PART AVEC ELLE, pas seulement le paragraphe : le
   * drapeau `preparation`, ses deux appels (`ouvrirLeSelecteur`,
   * `fichierChoisi`) et l'effet qui le baissait (écoute de `cancel` et
   * du retour de focus). Un drapeau que personne ne lit est un piège
   * pour la passe suivante.
   */

  /* ---------- « UN STYLE MANQUE ? » (passe nº 122) ----------
     Le bas de la fenêtre des styles. Quatre états, et rien de plus :
     le texte saisi, l'envoi en cours, le refus éventuel, et la fenêtre
     de confirmation.
     ⚠️ §1-d (nº 304) — IL N'Y A PLUS QUE DEUX REFUS POSSIBLES : le
     style existe déjà, ou la même demande est en attente. Le troisième
     — « tu as déjà proposé 3 styles cette semaine » — est SUPPRIMÉ
     avec le quota lui-même (voir l'API `suggestion-style`). Rien ne
     limite plus les demandes. */
  const [suggestion, setSuggestion] = useState("");
  const [envoiSuggestion, setEnvoiSuggestion] = useState(false);
  const [refusSuggestion, setRefusSuggestion] = useState<string | null>(null);
  const [suggestionEnvoyee, setSuggestionEnvoyee] = useState(false);

  async function envoyerLaSuggestion() {
    const propose = suggestion.trim();
    if (propose.length < 2 || envoiSuggestion) return;
    setEnvoiSuggestion(true);
    setRefusSuggestion(null);
    try {
      const reponse = await fetch("/api/tatoueur/suggestion-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propose, ficheId }),
      });
      const donnees = (await reponse.json()) as {
        ok: boolean;
        message?: string;
      };
      if (!donnees.ok) {
        setRefusSuggestion(donnees.message ?? "L'envoi n'a pas abouti.");
        return;
      }
      //  ENVOYÉ : le champ se vide, la fenêtre des styles se referme,
      //  et la confirmation prend sa place. Deux fenêtres empilées
      //  n'auraient rien dit de plus.
      setSuggestion("");
      setFenetreStyles(false);
      setSuggestionEnvoyee(true);
    } catch {
      setRefusSuggestion("L'envoi n'a pas abouti. Réessaie.");
    } finally {
      setEnvoiSuggestion(false);
    }
  }

  const compteStyle = (style: string) =>
    photos.filter((photo) => photo.style === style).length;

  /** LES PHOTOS D'UNE GALERIE — le triplet style + rendu + nature.
      C'est l'unité de rangement de tout ce bloc. */
  const duTriplet = (style: string, rendu: string, nature: string) =>
    photos
      .filter(
        (photo) =>
          photo.style === style &&
          photo.rendu === rendu &&
          photo.nature === nature
      )
      .sort((a, b) => a.ordre - b.ordre);

  /*  §2-b (nº 309) — LE RENDU SUR LEQUEL UN STYLE S'OUVRE : celui qui a
       déjà des photos. La règle et ses trois cas vivent dans
       `lib/photos-tatoueur` (`renduDOuverture`), en fonction pure —
       cette page-ci exige une session que le banc ne peut pas
       fabriquer, la règle doit donc être éprouvable sans elle. */
  const ouvertureSur = (style: string, nature: string) =>
    renduDOuverture(photos, style, nature);

  /** LES BADGES AFFICHÉS — les styles qui ONT des photos, plus ceux
      tout juste ajoutés par la fenêtre. De A à Z, ordre CALCULÉ
      (règle nº 113) : jamais figé dans une liste. */
  const stylesDesBadges = [
    ...new Set([...photos.map((photo) => photo.style), ...stylesAjoutes]),
  ]
    .map((slug) => ({ slug, label: libelleStyle(slug) }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  /** LE PREMIER BADGE EST TOUJOURS OUVERT (passe nº 117, point 6).
      À la RÉOUVERTURE d'un portfolio, les badges arrivaient tous
      éteints : il fallait deviner qu'il fallait en cliquer un pour
      voir quoi que ce soit — la moitié du bloc semblait vide.
      ⚠️ C'EST UNE DÉRIVATION, PAS UN EFFET. « Rien de choisi » vaut
      « le premier », et les deux niveaux valent leur première
      position : on le CALCULE au rendu. Un effet qui aurait posé ces
      trois états aurait fait un rendu de plus à chaque arrivée — et
      surtout, il aurait fallu le défaire pour retirer un style.
      Ici, retirer le style ouvert remet l'état à `null` : le calcul
      rouvre aussitôt le premier badge restant, sans une ligne de
      plus. */
  const styleActif = styleOuvert ?? stylesDesBadges[0]?.slug ?? null;
  const natureActive = natureOuverte ?? NATURES_PHOTO[0].slug;
  /*  §2-b (nº 309) — LA DÉRIVATION SUIT LA MÊME RÈGLE QUE L'OUVERTURE,
       et c'est indispensable : à la RÉOUVERTURE d'un portfolio, le
       premier badge est ouvert PAR CE CALCUL, sans que `basculerStyle`
       ne soit jamais appelé. Poser la règle dans la seule bascule
       l'aurait laissée muette là où elle sert le plus. */
  /**
   * ██ §2 (nº 400) — LE RENDU N'A PAS DE SENS SUR UN STYLE TOUT NOIR ██
   * ==================================================================
   * Un style ENTIÈREMENT NOIR — le blackwork — porte l'étiquette
   * `monochrome` dans le catalogue (config/tatouage). Lui proposer
   * plusieurs rendus n'a aucun sens : il ne reste qu'un encadré,
   * inerte.
   * ██ nº 404 — CET ENCADRÉ UNIQUE DIT DÉSORMAIS « NOIR » ██
   * Le rendu « black » existe (RENDU_TOUT_NOIR) : un style monochrome
   * ne propose plus QUE lui — « Noir et gris » et « Couleur »
   * n'apparaissent pas. C'est aussi la valeur que les dépôts écrivent
   * ici, et celle vers laquelle la migration `yokofolio-rendu-noir.sql`
   * bascule les photos déjà enregistrées en « noir et gris ».
   *
   * ⚠️ MAIS PAS SI DES PHOTOS SONT DÉJÀ RANGÉES SOUS UN AUTRE RENDU,
   * et c'est LE cas que le propriétaire a demandé de traiter à la
   * nº 400 — il revient en force tant que la migration nº 404 n'est
   * pas passée, puisque TOUTES les photos black work sont alors encore
   * en « noir et gris ». Replier l'encadré sans regarder cacherait ces
   * photos-là : elles resteraient en base, invisibles dans le
   * formulaire, impossibles à déplacer ou à supprimer — une PERTE
   * SILENCIEUSE. La règle est donc conditionnée à ce qui existe
   * VRAIMENT :
   *  · aucune photo de ce style rangée ailleurs qu'en « noir » → un
   *    seul encadré, et la valeur enregistrée est « black » ;
   *  · au moins une (noir et gris d'avant la migration, ou couleur) →
   *    LES TROIS ENCADRÉS RESTENT. Le tatoueur voit ses photos, les
   *    déplace ou les retire ; l'encadré unique apparaît de lui-même
   *    quand plus rien ne vit hors de « Noir ».
   * ⚠️ TOUTES NATURES CONFONDUES (réalisation ET flash) : replier d'un
   * côté et pas de l'autre donnerait un formulaire qui change de forme
   * en changeant d'onglet, pour la même question.
   */
  const styleToutNoir = Boolean(styleActif) && estStyleMonochrome(styleActif!);
  const aDesPhotosHorsNoir =
    styleToutNoir &&
    photos.some(
      (photo) => photo.style === styleActif && photo.rendu !== RENDU_TOUT_NOIR
    );
  /** L'encadré unique, inerte : le style est tout noir ET rien n'est
      rangé ailleurs qu'en « noir ». */
  const renduReplie = styleToutNoir && !aDesPhotosHorsNoir;

  /*  §2-b (nº 309) — LA DÉRIVATION SUIT LA MÊME RÈGLE QUE L'OUVERTURE.
       §2 (nº 400) — SAUF SUR UN STYLE REPLIÉ : là, le rendu est IMPOSÉ
       (« black » depuis la nº 404, PAR NOM — voir RENDU_TOUT_NOIR).
       Ce n'est pas un défaut par lequel on passerait au premier rendu,
       c'est la seule valeur possible — `renduOuvert` lui-même ne peut
       plus la contredire, puisque plus aucun bouton ne l'écrit. */
  const renduActif = renduReplie
    ? RENDU_TOUT_NOIR
    : (renduOuvert ??
      (styleActif ? ouvertureSur(styleActif, natureActive) : RENDUS_PHOTO[0].slug));

  /** OUVRIR UN STYLE — et poser les DEUX niveaux sur leur première
      position (passe nº 117, points 6 et 9) : la nature d'abord
      (« Réalisation »), le rendu ensuite (« Noir et gris »). La
      galerie s'affiche donc DANS LA FOULÉE, sans un clic de plus.
      ⚠️ UN BADGE NE SE REFERME PLUS (nº 117, point 6) : il y a
      TOUJOURS un style ouvert — c'est ce qui permet au premier badge
      d'être sélectionné d'office à la réouverture d'un portfolio, et
      ce qui donne aux badges leurs DEUX états, sans troisième. */
  function basculerStyle(style: string) {
    const nature = NATURES_PHOTO[0].slug;
    setNatureOuverte(nature);
    //  §2-b (nº 309) — plus « toujours le premier » : le rendu qui a
    //  déjà des photos (voir `renduDOuverture`).
    setRenduOuvert(ouvertureSur(style, nature));
    setStyleOuvert(style);
  }

  /** CHOISIR UN STYLE DANS LA FENÊTRE : la fenêtre se ferme, le badge
      apparaît — et sa section s'ouvre dans la foulée, prête à recevoir
      les photos (c'est pour cela qu'on vient de le choisir). */
  function ajouterUnStyle(style: string) {
    setStylesAjoutes((courants) =>
      courants.includes(style) ? courants : [...courants, style]
    );
    /*  §2 (nº 561) — IL REFERME PAR LA PORTE COMMUNE, désormais.
        Il recopiait les deux premières lignes de `fermerFenetreStyles`
        et sautait la troisième : choisir un style laissait donc
        derrière lui un refus de suggestion affiché — et, depuis cette
        passe, aurait laissé la saisie. Deux écritures pour une même
        fermeture, c'est une divergence de plus à chaque passe.
        ⚠️ RIEN D'AUTRE NE CHANGE : `fermerFenetreStyles` fait
        EXACTEMENT ce qu'il faisait ici (fenêtre fermée, famille
        repliée), plus les deux nettoyages qu'il oubliait. */
    fermerFenetreStyles();
    basculerStyle(style);
  }

  /** CHANGER DE NATURE (premier niveau) REPOSE LE RENDU SUR SA
      PREMIÈRE POSITION — qui est « Noir » depuis la nº 404 :
      « Réalisation · Noir », puis « Flash · Noir ». Une galerie reste
      toujours ouverte — garder le rendu d'avant ferait regarder deux
      jeux de photos sans le dire. C'est ICI un rang, pas une valeur :
      la règle dictée (nº 117-9) est « la première position », et elle
      suit l'ordre du propriétaire. */
  function choisirNature(nature: string) {
    setRenduOuvert(RENDUS_PHOTO[0].slug);
    setNatureOuverte(nature);
  }

  /* ----------------------------------------------------------------
     L'AJOUT — tuile « + » (ou dépôt de fichiers) → recadrage → galerie.
     ⚠️ PLUSIEURS PHOTOS D'UN COUP (passe nº 112) : le sélecteur
     accepte la sélection multiple, et le web peut aussi DÉPOSER des
     fichiers du Finder directement sur la grille. La fenêtre de
     recadrage enchaîne alors les photos une à une — recadrer,
     valider, la suivante — sans jamais repasser par la grille.
     ---------------------------------------------------------------- */
  /** LE POINT D'ENTRÉE UNIQUE du dépôt — sélecteur de fichiers OU
      glisser-déposer. Il trie, plafonne, puis lance la série. */
  function demarrerDepot(fichiers: File[]) {
    const valides = fichiers.filter((fichier) => FORMATS_PHOTO.has(fichier.type));
    if (valides.length === 0) {
      setErreurFichier(
        "Seules les images JPG et PNG sont acceptées — ces fichiers sont d'un autre format."
      );
      return;
    }
    //  LE PLAFOND SE RESPECTE SANS RIEN PERDRE DE CE QUI TIENT : on
    //  garde les premières photos jusqu'à 20.
    //  ⚠️ ET IL SE TAIT (passe nº 122). Il annonçait « la galerie
    //  plafonne à 20 photos : la dernière n'a pas été retenue » — un
    //  reproche rouge pour une règle que le compteur « 20/20 » dit
    //  déjà, en permanence et sans hausser le ton. La règle continue
    //  de s'appliquer, exactement comme avant ; seule la phrase a
    //  disparu, et aucune ne la remplace.
    //  Le message des FORMATS REFUSÉS, lui, reste : celui-là dit
    //  quelque chose qu'on ne peut deviner nulle part ailleurs.
    const place = PLAFOND_GALERIE - galerieOuverte.length;
    if (place <= 0) return;
    const gardees = valides.slice(0, place);
    setErreurFichier(null);
    setSerie(gardees.length > 1 ? { fichiers: gardees, rang: 0 } : null);
    setRecadrage({ fichier: gardees[0] });
  }

  /** OUVRIR LA GALERIE DU TÉLÉPHONE.
      (§7, nº 415 — la phrase d'attente qui se levait ici est
      supprimée : voir la note en tête du composant.) */
  function ouvrirLeSelecteur() {
    setErreurFichier(null);
    entreeFichier.current?.click();
  }

  function fichierChoisi(evenement: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(evenement.target.files ?? []);
    evenement.target.value = "";
    if (fichiers.length === 0) return;
    demarrerDepot(fichiers);
  }

  /*  §7 (nº 415) — LE FILET DE SÉCURITÉ DE LA PHRASE D'ATTENTE VIVAIT
      ICI : il écoutait `cancel` (la galerie refermée sans rien choisir,
      que tous les navigateurs ne signalent pas) et le retour du focus,
      armé après 800 ms. Il ne servait QU'À BAISSER le drapeau
      `preparation` ; la phrase supprimée, il n'a plus rien à faire — un
      écouteur de fenêtre qui ne pilote rien est un coût et un piège. */

  /** UNE PHOTO QUE CE NAVIGATEUR NE SAIT PAS LIRE. Elle laissait la
      fenêtre sur un cadre noir et un bouton sourd, pour toujours ; elle
      le DIT maintenant, et la série passe à la suivante. */
  function photoIllisible() {
    setErreurFichier(
      "Cette photo n'a pas pu être ouverte — ce navigateur ne reconnaît pas son format."
    );
    if (serie && serie.rang + 1 < serie.fichiers.length) {
      setSerie({ ...serie, rang: serie.rang + 1 });
      setRecadrage({ fichier: serie.fichiers[serie.rang + 1] });
      return;
    }
    setSerie(null);
    setRecadrage(null);
  }

  /** OUVRIR UNE PHOTO EXISTANTE — la fenêtre de recadrage, sur elle.
      Son image vient du fichier de la session quand il existe, sinon
      elle est rechargée depuis son adresse (elle est déjà affichée
      dans la grille : elle sort du cache du navigateur). */
  async function ouvrirPhoto(cle: string) {
    const photo = photos.find((p) => p.cle === cle);
    if (!photo) return;
    setErreurFichier(null);
    if (photo.fichier) {
      setRecadrage({ cle, fichier: photo.fichier });
      return;
    }
    try {
      const reponse = await fetch(photo.apercu);
      const blob = await reponse.blob();
      setRecadrage({
        cle,
        fichier: new File([blob], "photo.jpg", {
          type: blob.type || "image/jpeg",
        }),
      });
    } catch {
      setErreurFichier(
        "Cette photo n'a pas pu être rouverte — vérifie ta connexion et réessaie."
      );
    }
  }

  /** LE CADRAGE VALIDÉ — une photo de plus, ou une photo remplacée. */
  function cadrageValide(pleine: Blob, petite: Blob) {
    if (!recadrage || !styleActif) return;
    const horodatage = Date.now();
    const fichier = new File([pleine], `photo-${horodatage}.jpg`, {
      type: "image/jpeg",
    });
    const fichierMiniature = new File([petite], `mini-${horodatage}.jpg`, {
      type: "image/jpeg",
    });
    const apercu = URL.createObjectURL(pleine);
    const miniature = URL.createObjectURL(petite);

    if (recadrage.cle) {
      //  UNE PHOTO EXISTANTE, RECADRÉE : même ligne, nouvelle image.
      surChangement(
        photos.map((photo) =>
          photo.cle === recadrage.cle
            ? { ...photo, apercu, miniature, fichier, fichierMiniature }
            : photo
        )
      );
    } else {
      //  UNE PHOTO NEUVE — en dernière position de la galerie du
      //  couple, et de la liste entière : l'ordre global est
      //  renuméroté d'un trait.
      const neuve: PhotoEnSaisie = {
        cle: clePhoto(),
        id: null,
        style: styleActif,
        rendu: renduActif,
        nature: natureActive,
        apercu,
        miniature,
        fichier,
        fichierMiniature,
        ordre: photos.length,
      };
      surChangement(
        [...photos]
          .sort((a, b) => a.ordre - b.ordre)
          .concat(neuve)
          .map((photo, ordre) => ({ ...photo, ordre }))
      );
      //  LA SÉRIE CONTINUE : la photo validée est dans la grille, la
      //  fenêtre passe DIRECTEMENT à la suivante — le compteur suit.
      if (serie && serie.rang + 1 < serie.fichiers.length) {
        setSerie({ ...serie, rang: serie.rang + 1 });
        setRecadrage({ fichier: serie.fichiers[serie.rang + 1] });
        return;
      }
    }
    setSerie(null);
    setRecadrage(null);
  }

  /** FERMER LA FENÊTRE EN COURS DE SÉRIE : ce qui a été validé RESTE
      (chaque photo est entrée dans la grille à son « Valider ») — le
      reste de la file est abandonné, sans question. */
  function fermerRecadrage() {
    setSerie(null);
    setRecadrage(null);
  }

  /** SUPPRIMER UNE PHOTO — depuis sa fenêtre de recadrage. */
  function supprimerLaPhoto() {
    if (!recadrage?.cle) return;
    surChangement(
      photos
        .filter((photo) => photo.cle !== recadrage.cle)
        .sort((a, b) => a.ordre - b.ordre)
        .map((photo, ordre) => ({ ...photo, ordre }))
    );
    setRecadrage(null);
  }

  /** LE NOUVEL ORDRE D'UNE GALERIE, au lâcher d'une vignette. La
      sous-suite du TRIPLET prend l'ordre du glisser, tout le reste
      garde exactement sa place — puis `ordre` est renuméroté. */
  function reordonner(
    style: string,
    rendu: string,
    nature: string,
    cles: string[]
  ) {
    const parCle = new Map(photos.map((photo) => [photo.cle, photo]));
    const file = [...cles];
    surChangement(
      [...photos]
        .sort((a, b) => a.ordre - b.ordre)
        .map((photo) =>
          photo.style === style &&
          photo.rendu === rendu &&
          photo.nature === nature
            ? parCle.get(file.shift() ?? photo.cle) ?? photo
            : photo
        )
        .map((photo, ordre) => ({ ...photo, ordre }))
    );
  }

  /** RETIRER UN STYLE — après la confirmation tapée. Il quitte AUSSI
      la liste des styles ajoutés sans photo : son badge disparaît. */
  function retirerLeStyle(style: string) {
    surChangement(
      photos
        .filter((photo) => photo.style !== style)
        .sort((a, b) => a.ordre - b.ordre)
        .map((photo, ordre) => ({ ...photo, ordre }))
    );
    setStylesAjoutes((courants) => courants.filter((slug) => slug !== style));
    //  ⚠️ ON REMET LES TROIS À `null` SANS CONDITION (passe nº 117) :
    //  « rien de choisi » vaut désormais « le premier badge, ses deux
    //  niveaux en première position » (voir `styleActif`). Le style
    //  suivant s'ouvre donc de lui-même, avec sa galerie.
    setStyleOuvert(null);
    setRenduOuvert(null);
    setNatureOuverte(null);
    setARetirer(null);
    setSaisieSuppression("");
  }

  /** LA CROIX DE L'ANGLE DU STYLE OUVERT (passe nº 116, point 8).
      Des photos seraient perdues ? La fenêtre « taper SUPPRIMER »
      s'interpose. Aucune photo ? Le badge part immédiatement — il n'y
      a rien à protéger, une confirmation serait un péage. */
  function croixDuStyle(style: string) {
    if (compteStyle(style) > 0) {
      setSaisieSuppression("");
      setARetirer(style);
      return;
    }
    retirerLeStyle(style);
  }

  function fermerFenetreStyles() {
    setFenetreStyles(false);
    setFamilleDepliee(null);
    //  Le refus d'une suggestion ne survit pas à la fermeture : à la
    //  réouverture, on repart d'un champ propre (nº 122).
    setRefusSuggestion(null);
    /*  ██ §2 (nº 561) — ET LE TEXTE NON PLUS ██
        LA PHRASE CI-DESSUS PROMETTAIT « UN CHAMP PROPRE » ET NE TENAIT
        QUE LA MOITIÉ : le refus partait, la SAISIE restait. On tapait
        un style sans l'envoyer, on refermait — et il était encore là à
        la réouverture, sans qu'on sache s'il avait été envoyé.
        Le champ se vide donc ici, à côté de son refus.
        ⚠️ POURQUOI ICI, ET PAS DANS CHAQUE CHEMIN DE FERMETURE : cette
        fonction EST le chemin, unique. La croix de la fenêtre, celle
        de la page du doigt, le voile qu'on clique à côté, la touche
        Échap, le retour du téléphone (`useEtapeQuiSeReferme`) et
        désormais le CHOIX D'UN STYLE (voir `ajouterUnStyle`) passent
        tous par elle. Un seul endroit à tenir, aucun chemin à oublier
        — et les chemins qu'une passe future ajoutera hériteront de la
        règle sans qu'on y pense.
        ⚠️ L'ENVOI RÉUSSI VIDE TOUJOURS, ET IL LE FAISAIT DÉJÀ :
        `envoyerLaSuggestion` pose `setSuggestion("")` avant de fermer,
        puis ouvre « Demande envoyée ». Rien n'y change ; il vide
        simplement deux fois, ce qui ne coûte rien.
        ⚠️ LA PAGE DU DOIGT AVAIT LE MÊME DÉFAUT, et elle est réparée
        par la même ligne : elle referme par cette fonction (son
        `surFermer`). C'est le seul point de cette passe qui la
        concerne — aucune de ses couleurs ne bouge. */
    setSuggestion("");
  }

  /* Échap referme la fenêtre des styles — comme toutes les fenêtres. */
  useEffect(() => {
    if (!fenetreStyles) return;
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") fermerFenetreStyles();
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
    //  `fermerFenetreStyles` ne lit que des setters stables — rien à
    //  réabonner entre deux rendus.
  }, [fenetreStyles]);

  /*  ██ §4 (nº 474) — AU DOIGT, LA FENÊTRE DES STYLES EST UNE PAGE ██
      Elle adopte le gabarit plein écran de la nº 465 (voir le rendu,
      tout en bas) ; ici vivent ses deux servitudes de page :
      · L'ÉTAPE D'HISTORIQUE (C-4, nº 330 ; règle nº 332-§1) — au
        doigt seulement : le RETOUR du téléphone referme la page et
        rend le formulaire, saisie intacte (rien ne navigue — l'étape
        n'est qu'une entrée d'historique, le formulaire reste monté
        dessous). La croix, un choix de style, l'envoi d'une
        suggestion ou Échap la REPRENNENT (l'écriture unique,
        lib/etape-refermable) : jamais deux entrées pour un même
        écran. Le web ne pose RIEN — sa fenêtre superposée, qui ne
        couvre pas l'écran d'une page, ne change pas.
      · LE VERROU DE DÉFILEMENT COMPTÉ (nº 469) — l'effet séparé, le
        motif exact de MenuEspace : posé à l'ouverture au doigt,
        retiré par le nettoyage. Tous les chemins de fermeture
        passent par la même bascule d'état (croix, retour, choix
        d'un style, suggestion envoyée, Échap, démontage) : le
        nettoyage les couvre tous, et le compteur rend le corps au
        dernier retrait — le défilement REVIENT à la fermeture.
        `?sonde-bascule=1` en journalise la preuve : « verrou
        posé (1) » à l'ouverture, « verrou retiré (0) » après.

      ██ §5 (nº 560) — ET LE WEB LE POSE AUSSI, DÉSORMAIS ██
      LE DÉFAUT : la fenêtre ouverte, la page continuait de défiler
      derrière elle. La nº 474 n'avait armé le verrou qu'au doigt ; la
      garde sur `data-appareil` disparaît.
      AUCUN SECOND MÉCANISME : c'est le MÊME effet, le MÊME module
      compté, le MÊME nettoyage. Rien n'est écrit de neuf — une
      condition est retirée.
      POURQUOI CETTE FENÊTRE-CI ET PAS « MON COMPTE » : la maison a
      déjà sa règle, et elle se lit dans les porteurs. Un MENU ancré
      sous un bouton ne verrouille pas (MenuEspace garde sa garde du
      doigt) ; une FENÊTRE CENTRÉE À VOILE, elle, verrouille aux deux
      largeurs — c'est ce que fait `FenetreModale` depuis la nº 469,
      sans aucune garde d'appareil. « Ajouter un style » est de la
      seconde famille : `fixed inset-0`, voile noir, plaque centrée.
      Elle prend donc la règle de sa famille.
      L'EMPILEMENT TIENT PAR CONSTRUCTION, c'est tout l'objet du
      compteur : cette fenêtre s'ouvre depuis le FORMULAIRE, qui ne
      verrouille rien — le compte monte à 1 puis retombe à 0. Et si
      une surface verrouillait déjà (une modale par-dessus, le menu du
      compte au doigt), le compte monterait à 2 : refermer celle-ci
      n'en retirerait qu'un, l'autre garderait le corps. C'est
      exactement le bug que la nº 469 a fermé, et le remède est celui
      qu'on réemploie.
      ⚠️ LA PAGE NE SAUTE NI À LA POSE NI AU RETRAIT, et ce n'est pas
      une espérance : le verrou pose `overflow: hidden` sur le corps,
      ce qui ne décale la mise en page que si une barre de défilement
      OCCUPE DE LA PLACE. Or le site n'en affiche aucune — `globals.css`
      les retire toutes (`scrollbar-width: none` et
      `::-webkit-scrollbar { display:none; width:0 }` sur
      `*:not(.defilement-visible)`), la règle « jamais d'ascenseur
      affiché ». La barre du document mesure donc zéro pixel : la
      cacher n'en rend aucun.
      ⚠️ ET LA PAGE DU DOIGT NE CHANGE PAS : elle avait ce verrou
      depuis la nº 474 — c'est cet effet-ci, et il continue de le poser
      pour elle. */
  const auDoigt = useAppareilMobile();
  useEtapeQuiSeReferme(auDoigt && fenetreStyles, fermerFenetreStyles);
  useEffect(() => {
    if (!fenetreStyles) return;
    poserLeVerrouDeDefilement();
    return retirerLeVerrouDeDefilement;
  }, [fenetreStyles]);

  /*  ██ §1 (nº 735) — LA PAGE D'AJOUT CACHE LE SITE DERRIÈRE ELLE ██
      ------------------------------------------------------------------
      LE DÉFAUT, VU SUR LE VRAI iPHONE : toucher « Un style manque ? »
      ouvre le clavier — et une bande de PHOTOS DU PORTFOLIO
      apparaissait entre la barre du bas et lui. La nº 734 avait glissé
      une plaque `fixed inset-0` sous la page pour boucher ce trou :
      aucun effet sur l'appareil réel, et c'était couru d'avance. Quand
      le clavier s'ouvre, Safari iOS ne rétrécit pas le viewport de
      MISE EN PAGE : il le fait GLISSER vers le haut, et tout `fixed`
      reste accroché à ce repère qui glisse — la plaque remontait donc
      exactement comme la page, découvrant la bande qu'elle devait
      couvrir. C'est mot pour mot l'erreur du fond de secours de la
      nº 476, démontée par le commentaire nº 477 de PagePleinEcranMobile
      (la surface d'ajout, ELLE, tient parce qu'elle se recale sur
      `visualViewport` à chaque image). Le banc émulé ne fait pas
      glisser le viewport : seul l'iPhone du propriétaire pouvait le
      montrer, et il l'a montré.
      LE REMÈDE NE SUIT AUCUNE GÉOMÉTRIE, c'est ce qui le rend sûr :
      tant que la page d'ajout est ouverte, l'enveloppe du site
      (`[data-fond="sombre"]`) est INVISIBLE — le marqueur se pose ici,
      la règle vit dans globals.css. Quoi que le glissement découvre,
      il ne peut plus montrer que le canevas <html>, peint #0B0F14 EN
      DUR avant la première image (nº 357) : le trou est anthracite PAR
      CONSTRUCTION, quelle que soit la hauteur du clavier ou de la
      barre d'accessoires de Safari. Et `visibility` ne déplace RIEN :
      le document garde sa hauteur et sa position de lecture,
      retrouvées intactes à la fermeture — c'est pourquoi ce n'est PAS
      le `display: none` de la page de recherche
      (`html[data-recherche="ouverte"]`) : elle, VEUT vider le document
      pour qu'il défile pour elle seule ; ici ce serait perdre la
      position du formulaire.
      ⚠️ AU DOIGT SEULEMENT (`auDoigt`, donc `data-appareil` — règle
      nº 60, jamais une largeur) : au web, le même état `fenetreStyles`
      ouvre la FENÊTRE web PAR-DESSUS la page — cacher l'enveloppe
      éteindrait l'écran sous elle. */
  useEffect(() => {
    if (!auDoigt || !fenetreStyles) return;
    document.documentElement.setAttribute("data-ajout-style", "ouvert");
    return () => {
      document.documentElement.removeAttribute("data-ajout-style");
    };
  }, [auDoigt, fenetreStyles]);

  /** « supprimer », tapé dans n'importe quelle casse, confirme. */
  const suppressionConfirmee =
    saisieSuppression.trim().toLowerCase() === "supprimer";

  const galerieOuverte = styleActif
    ? duTriplet(styleActif, renduActif, natureActive)
    : [];
  const galeriePleine = galerieOuverte.length >= PLAFOND_GALERIE;

  /** UNE LIGNE DE LA FENÊTRE DES STYLES. `retrait` : les onze styles
      de la famille dépliée se décalent à droite — ils lui
      appartiennent, et cela doit se voir. Un style DÉJÀ CHOISI reste
      dans la liste, coché et inerte : le faire disparaître ferait
      croire qu'il n'existe pas, le laisser cliquable créerait des
      doublons. */
  /**
   * ██ §2 (nº 559) — LE SURVOL D'UNE LIGNE, DIT PAR L'APPELANT ██
   * ------------------------------------------------------------------
   * IL LE DOIT, SOUS PEINE DE DISPARAÎTRE. Ces lignes sont FABRIQUÉES
   * UNE FOIS et montrées à DEUX endroits (nº 474) : dans la fenêtre du
   * web, et dans la page plein écran du doigt. Or les deux ne reposent
   * plus sur le même fond depuis cette passe — la fenêtre est passée à
   * `eleve`, la page vit toujours sur `fond`. Un survol écrit en dur à
   * `bg-sombre-eleve` valait 1,37 sur la page (juste) et 1,00 dans la
   * fenêtre (invisible).
   * LE DÉFAUT PAR DÉFAUT EST CELUI D'AVANT, AU CARACTÈRE PRÈS : la page
   * du doigt ne passe rien et ne bouge donc pas d'un pixel. Seule la
   * fenêtre demande le cran du dessus (1,21 sur son nouveau fond).
   * ⚠️ DEUX CHAÎNES LITTÉRALES, JAMAIS UNE FABRIQUÉE : Tailwind lit le
   * TEXTE des fichiers — un `hover:${…}` assemblé à l'exécution ne
   * produirait aucune règle.
   */
  function ligneDeStyle(
    style: { slug: string; label: string },
    retrait: boolean,
    survol = "hover:bg-sombre-eleve"
  ) {
    const dejaChoisi = stylesDesBadges.some((s) => s.slug === style.slug);
    return (
      <li key={style.slug}>
        <button
          type="button"
          disabled={dejaChoisi}
          onClick={() => ajouterUnStyle(style.slug)}
          className={`flex w-full items-center justify-between gap-3
                     min-h-[52px] text-left text-[15px] transition-colors
                     ${retrait ? "pl-10 pr-5" : "px-5"} ${
                       dejaChoisi
                         ? "cursor-not-allowed text-sombre-texte-doux"
                         : `text-sombre-texte ${survol}`
                     }`}
        >
          {style.label}
          {dejaChoisi && (
            <span aria-hidden="true" className="shrink-0 text-primaire">
              <IconeCocheListe taille={16} />
            </span>
          )}
        </button>
      </li>
    );
  }

  /*  §4 (nº 474) — LA LISTE, FABRIQUÉE UNE FOIS : la fenêtre du web et
      la page plein écran du doigt (voir le rendu) montrent LES MÊMES
      lignes — l'écriture unique du contenu, comme pour les porteurs de
      la nº 465. Rien du dedans n'a changé : c'est le bloc qui vivait
      dans l'ul de la fenêtre, déplacé tel quel. */
  const lignesDesStyles = (survol = "hover:bg-sombre-eleve") =>
    entreesExplorer().map((entree) => {
    if (entree.genre === "famille") {
      const depliee = familleDepliee === entree.slug;
      return (
        <li key={entree.slug}>
          {/* LA PORTE DE LA FAMILLE — sa flèche est GRANDE et pleine
              couleur : impossible de la manquer, c'est elle qui dit
              « il y a onze styles là-dessous ». */}
          {/*  ██ §1 (nº 560) — LA GRAISSE PART, LES DEUX SIGNES RESTENT ██
               ELLE PORTAIT `font-semibold` quand les styles ordinaires
               de la liste n'ont AUCUNE classe de graisse — ils héritent
               du 400 du corps de page. La porte pesait donc plus lourd
               que ce qu'elle contient, et c'était un TROISIÈME signe
               par-dessus deux qui suffisent : le chevron rose à droite
               (nº 304) et le trait rose sous les mots (nº 559). Elle
               rejoint la graisse des styles ; le chevron et le trait ne
               bougent pas d'un caractère.
               ⚠️ AUCUNE CLASSE NE LA REMPLACE : on retire, on ne
               réécrit pas `font-normal` — la ligne prendrait alors une
               graisse EXPLICITE que ses voisines n'ont pas, et deux
               écritures diraient la même chose.
               ⚠️ AUX DEUX APPAREILS, ET JE LE DIS : ces lignes sont
               fabriquées une fois (nº 474). Ce n'est pas un réglage de
               FOND — les deux que la nº 559 a séparés, le survol et le
               champ, restent séparés — mais une graisse : la porte doit
               peser pareil partout, sans quoi on aurait créé une
               divergence là où l'on vient d'en refermer une. */}
          <button
            type="button"
            aria-expanded={depliee}
            onClick={() => setFamilleDepliee(depliee ? null : entree.slug)}
            className={`flex w-full items-center justify-between gap-3
                       px-5 min-h-[52px] text-left text-[15px]
                       text-sombre-texte
                       transition-colors ${survol}`}
          >
            {/*  ██ §3 (nº 559) — LE TRAIT ROSE SOUS LA PORTE ██
                 ==========================================================
                 « Cultures du monde » occupait la place d'un style et lui
                 ressemblait en tout : rien, au repos, ne disait qu'elle
                 OUVRE au lieu de se choisir. Le chevron rose (nº 304) le
                 dit à droite ; le trait le dit SOUS LES MOTS, comme dans
                 le menu du moteur de recherche.
                 L'ÉCRITURE EST CELLE DE LA nº 525, RECOPIÉE AU CARACTÈRE
                 PRÈS depuis `porteSousSection` (MenuDeroulant) :
                 `underline decoration-primaire decoration-1
                 underline-offset-4` — le rose de la charte lu au jeton,
                 un pixel d'épaisseur, quatre pixels sous la ligne de
                 base. Aucune valeur n'est choisie ici, aucun second
                 trait n'est dessiné.
                 ⚠️ IL TIENT AUX MOTS, ET À EUX SEULS — c'est la leçon du
                 §2 de la nº 290 : le bouton est une rangée
                 (`justify-between`) qui porte AUSSI le chevron. Posé sur
                 lui, le soulignement traverserait toute la ligne. C'est
                 donc un `span` en ligne, large comme le texte, qui le
                 reçoit.
                 ⚠️ ET IL NE PARAÎT QUE SUR UNE PORTE : cette branche-ci
                 ne se rend que pour `genre === "famille"`. Les styles
                 ordinaires passent par `ligneDeStyle`, qui n'a pas une
                 ligne de soulignement. Le catalogue ne compte
                 aujourd'hui qu'une seule famille — « Cultures du
                 monde » —, et si une seconde naissait le trait dirait
                 d'elle la même chose : « ceci s'ouvre ».
                 ⚠️ AUX DEUX APPAREILS : ces lignes sont fabriquées une
                 fois pour la fenêtre du web ET la page du doigt
                 (nº 474). Le trait paraît donc sur les deux, comme
                 demandé — c'est le survol, lui seul, qui diffère. */}
            <span className="underline decoration-primaire decoration-1 underline-offset-4">
              {entree.label}
            </span>
            {/* ⚠️ BAS QUAND C'EST FERMÉ, HAUT QUAND C'EST OUVERT
                (passe nº 117, point 10). Elle pointait vers la DROITE
                fermée — le signe d'un sous-menu qui s'ouvre À CÔTÉ,
                alors que les onze styles se déplient DESSOUS. Le
                chevron dit maintenant ce que le clic fait : « ça
                descend », puis « ça se replie ». */}
            {/*  §1-c (nº 304) — LE CHEVRON EST ROSE DANS LES DEUX
                 ÉTATS, comme dans le menu du moteur de recherche
                 (MenuDeroulant : « la flèche de la porte est ROSE,
                 pointée en bas comme en haut — c'est elle, et elle
                 seule, qui dit ceci s'ouvre au lieu de se
                 choisir »). Il n'était rose qu'OUVERT : fermé, plus
                 rien ne distinguait la porte d'un style. */}
            <IconeChevronBas
              taille={20}
              classe={`shrink-0 transition-transform text-primaire ${
                depliee ? "rotate-180" : ""
              }`}
            />
          </button>
          {depliee && (
            <ul aria-label={`Les styles — ${entree.label}`}>
              {entree.styles.map((style) => ligneDeStyle(style, true, survol))}
            </ul>
          )}
        </li>
      );
    }
    return ligneDeStyle(entree, false, survol);
  });

  /*  §4 (nº 474) — LE BANDEAU « UN STYLE MANQUE ? », FABRIQUÉ UNE FOIS
      lui aussi : seule sa BOÎTE change d'habits — pied de plaque dans
      la fenêtre du web, bord bas de l'écran sur la page du doigt (la
      classe vient de l'appelant). Le dedans — champ, croix
      d'effacement, « Envoyer », refus — est celui des nº 122/124/304,
      au caractère près.
      ██ §2 (nº 559) — SON CHAMP AUSSI VIENT DE L'APPELANT ██
      MÊME RAISON QUE LE SURVOL DES LIGNES : le bandeau se détache de
      ce qu'il surmonte par UN CRAN de fond, et son champ par un cran
      de plus. Les deux fonds ont donc monté dans la fenêtre du web,
      qui est passée à `eleve` — sans quoi le bandeau se serait fondu
      dans la plaque, et le champ dans le bandeau. La page du doigt ne
      passe rien : elle garde ses deux valeurs au caractère près.
      ⚠️ LE FOCUS DU WEB CHANGE DE SENS, ET JE LE DIS : il valait
      `focus:bg-sombre-bordure` (#2C323B) sur un champ à `eleve-clair`
      (#323942) — un jeton PLUS SOMBRE que le repos, donc un champ qui
      s'ASSOMBRIT quand on y écrit, à rebours de la charte et de la
      note posée juste au-dessus de lui (« le focus éclaircit encore
      d'un cran »). Le jeu du web dit `haut` au repos et `haut-clair`
      au focus : le cran remonte dans le bon sens. Le jeu du doigt
      garde l'inversion telle quelle — la corriger là-bas n'est pas
      demandé, et ce serait une passe à elle. */
  function bandeauStyleManquant(
    classeBoite: string,
    classeChamp = "bg-sombre-eleve-clair focus:bg-sombre-bordure",
    /**
     * ██ §4 (nº 560) — LE BOUTON « ENVOYER », DIT PAR L'APPELANT ██
     * ----------------------------------------------------------------
     * DEUX DEMANDES EN UNE, et toutes deux tiennent dans ce réglage.
     *  a) IL ÉTAIT INVISIBLE AU REPOS. Son fond éteint valait
     *     `eleve-clair` — exactement le fond que la nº 559 venait de
     *     donner au bandeau du web : 1,00, un bouton fondu dans sa
     *     barre. C'est une conséquence directe de cette passe-là.
     *  b) IL NE DOIT PLUS ÊTRE ROSE UNE FOIS ACTIF. Le rose disait
     *     « c'est prêt » d'un coup d'œil ; deux gris doivent le dire
     *     aussi bien, et le propriétaire ne veut plus de rose ici.
     * ██ CE QUE LA nº 560 AVAIT ESSAYÉ, ET QUI EST DÉFAIT (nº 561) ██
     * Elle remplaçait le rose par DEUX GRIS placés de part et d'autre
     * de la barre — éteint en dessous, allumé au-dessus. Le calcul
     * tenait (1,48 entre les deux états, et le mot allumé montait à
     * 7,07 contre 3,58 en rose), mais le propriétaire revient dessus :
     * LE ROSE REPREND L'ÉTAT ALLUMÉ. Ce qui reste de la nº 560, c'est
     * la LEÇON — un bouton éteint doit se VOIR : il ne retombe donc
     * pas sur `eleve-clair`, qui était le fond de la barre à l'époque,
     * mais prend le gris clair que la nº 560 avait donné à l'allumé.
     * Les valeurs du web vivent à son point de montage, avec leurs
     * mesures ; ce paramètre-ci ne fait que les transmettre.
     * ⚠️ LE DÉFAUT EST CELUI D'AVANT LA nº 560, AU CARACTÈRE PRÈS —
     * rose allumé, `eleve-clair` éteint : la page du doigt ne passe
     * rien et garde son bouton tel quel. Son bandeau n'a pas bougé
     * depuis la nº 559 : le rose n'y a jamais été invisible.
     */
    classeBouton = "bg-primaire text-white hover:opacity-90 " +
      "active:opacity-90 disabled:bg-sombre-eleve-clair " +
      "disabled:text-sombre-texte-doux"
  ) {
    return (
      <div className={classeBoite}>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              value={suggestion}
              maxLength={40}
              onChange={(evenement) => {
                setSuggestion(evenement.target.value);
                setRefusSuggestion(null);
              }}
              onKeyDown={(evenement) => {
                //  Entrée envoie — le champ est seul, il n'y a
                //  aucune autre action à déclencher. `prevent`
                //  parce que ce champ vit DANS le formulaire de
                //  la fiche : sans lui, Entrée l'enverrait.
                if (evenement.key !== "Enter") return;
                evenement.preventDefault();
                void envoyerLaSuggestion();
              }}
              placeholder={"Un style manque ?"}
              aria-label="Le style à suggérer"
              aria-invalid={refusSuggestion ? true : undefined}
              //  Le bandeau est déjà un cran plus clair : le
              //  champ monte d'un niveau avec lui, et le focus
              //  éclaircit encore d'un cran (la charte, sans
              //  contour ni rose).
              //  ⚠️ « ET LE FOCUS ÉCLAIRCIT » NE VAUT PLUS QUE POUR LA
              //  PAGE DU DOIGT (relevé nº 560) : au web, le champ est
              //  au dernier cran de l'échelle, il n'a plus rien
              //  au-dessus de lui et se dit par son curseur. Les deux
              //  valeurs viennent de l'appelant depuis la nº 559.
              /*  ██ §3 (nº 475) — CE CHAMP FAISAIT ZOOMER TOUT LE SITE ██
                  LA CAUSE, NOMMÉE : sa taille de texte était
                  `text-[15px]`. Sous SEIZE pixels, Safari/iOS ZOOME la
                  page d'autorité quand un champ prend le focus — et il
                  ne dézoome pas tout seul quand le champ s'en va : la
                  demande partait, la confirmation s'affichait, et
                  l'interface restait agrandie, débordant à droite. Le
                  symptôme apparaissait À L'ENVOI parce que c'est là que
                  le clavier se referme et laisse voir la page.
                  LE REMÈDE EST L'ÉCRITURE DÉJÀ EN PLACE, pas une valeur
                  neuve : `text-base` — SEIZE pixels —, exactement ce
                  que porte le champ partagé du formulaire
                  (components/champs-formulaire.ts, l. 32), qui n'a
                  jamais fait zoomer quoi que ce soit. Rien d'autre ne
                  change : ni le fond, ni le focus, ni la hauteur de 44
                  px, ni les deux palettes de champs (piège nº 419). */
              className={`w-full h-11 rounded-lg pl-3
                         text-base text-sombre-texte
                         placeholder:text-sombre-texte-doux/70
                         outline-none transition-colors
                         ${classeChamp} ${suggestion ? "pr-10" : "pr-3"}`}
            />
            {/* LA CROIX D'EFFACEMENT — le motif des champs de
                recherche du formulaire (voir ChampLocalisation) :
                dans le champ, à droite, seulement quand il y a
                quelque chose à effacer. À la souris, l'appui est
                neutralisé pour que le champ garde le focus. */}
            {suggestion && (
              <button
                type="button"
                aria-label="Effacer la suggestion"
                title="Effacer la suggestion"
                onPointerDown={(evenement) => {
                  if (evenement.pointerType === "mouse") {
                    evenement.preventDefault();
                  }
                }}
                onClick={() => {
                  setSuggestion("");
                  setRefusSuggestion(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex
                           h-8 w-8 items-center justify-center rounded-full
                           text-sombre-texte-doux transition-colors
                           hover:bg-sombre-bordure hover:text-sombre-texte
                           active:bg-sombre-bordure"
              >
                <IconeCroix taille={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => void envoyerLaSuggestion()}
            disabled={suggestion.trim().length < 2 || envoiSuggestion}
            //  ⚠️ L'ACTIVATION SE VOIT (passe nº 124) : tant
            //  que rien n'est saisi, la capsule reste grise et
            //  éteinte ; dès deux caractères, elle s'allume —
            //  impossible de la croire bloquée.
            //  §1 (nº 561) — LE ROSE EST DE RETOUR AUX DEUX SURFACES
            //  (la nº 560 l'avait remplacé par deux gris au web, et
            //  cette passe le défait) : « rose plein » redevient vrai
            //  partout. SEUL L'ÉTAT ÉTEINT DIFFÈRE désormais — gris
            //  clair au web, un cran plus bas au doigt —, et c'est
            //  l'appelant qui le dit (voir le §4 posé sur
            //  `classeBouton`).
            /*  §2-a (nº 475) — LE MÊME RAYON QUE LE CHAMP QU'IL SUIT :
                la capsule ronde (`rounded-full`) devient `rounded-lg`,
                HUIT pixels — le rayon EXACT du champ de saisie
                ci-dessus, relevé sur lui et non choisi. (Ce n'est pas
                le `rounded-xl` de 12 px de la nº 449 : celui-là est le
                rayon des champs du FORMULAIRE partagé,
                components/champs-formulaire.ts l. 32 — ce champ-ci, né
                à la nº 122 dans le bandeau, a toujours porté 8.) Le
                bandeau est une écriture unique depuis la nº 474 : la
                fenêtre du web prend donc le même rayon que la page du
                doigt — deux dessins pour un seul bouton seraient une
                divergence de plus à tenir. */
            className={`shrink-0 h-11 rounded-lg px-5 text-[14px]
                       font-semibold transition-colors
                       disabled:opacity-100 disabled:hover:opacity-100
                       ${classeBouton}`}
          >
            {envoiSuggestion ? "Envoi…" : "Envoyer"}
          </button>
        </div>
        {/* LE SEUL TEXTE SOUS LE CHAMP EST UN REFUS — jamais
            une explication (charte). Il dit ce qui bloque : le
            style existe déjà, ou la demande est en cours.
            §1-d (nº 304) — plus aucun refus de volume. */}
        {refusSuggestion && (
          <p role="alert" className="mt-2 text-[13px] text-erreur">
            {refusSuggestion}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- LE BOUTON « AJOUTER UN STYLE » (passe nº 116) ----
          Au départ, LUI SEUL : un rond « + » et son texte. Les quarante
          badges d'un bloc ont quitté l'écran — la liste vit dans la
          fenêtre qu'il ouvre. ---------------------------------- */}
      <button
        type="button"
        onClick={() => {
          setFamilleDepliee(null);
          setFenetreStyles(true);
        }}
        aria-haspopup="dialog"
        className="group flex w-fit items-center gap-3 text-left"
      >
        {/* ⚠️ LE DOIGT A DROIT AU MÊME SIGNAL QUE LA SOURIS (passe
            nº 121) : `group-hover` ne se déclenche jamais au toucher
            (Tailwind v4 le réserve aux pointeurs qui survolent), et
            appuyer ne produisait donc RIEN — ni rond rosé, ni texte
            rose. `group-active` double chaque règle : à l'appui, le
            bouton prend exactement la couleur du survol. */}
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                     bg-sombre-eleve text-sombre-texte transition-colors
                     group-hover:bg-sombre-eleve-clair
                     group-active:bg-sombre-eleve-clair"
        >
          <IconePlus taille={18} />
        </span>
        {/* ⚠️ LE LIBELLÉ DIT LES DEUX GESTES (passe nº 120) : on ne
            choisit pas un style pour le plaisir de le choisir — on
            l'ouvre pour y déposer des photos. « Ajouter un style »
            laissait croire à une simple étiquette. */}
        {/* ⚠️ UN CRAN PLUS PETIT SOUS 360 px (passe nº 128) : la carte
            revenue prend 16 px de chaque côté — à 320 px, le libellé
            complet ne tenait plus sur sa ligne à 14,5 px. */}
        <span
          className="text-[14.5px] max-[359px]:text-[13px] font-semibold
                     text-sombre-texte transition-colors
                     group-hover:text-sombre-texte group-active:text-sombre-texte"
        >
          Ajouter un style &amp; des photos
        </span>
      </button>

      {/* ---------- LES BADGES DES STYLES CHOISIS — sous le bouton.
          ⚠️ SANS CROIX (nº 116, point 8) : le badge OUVRE le style,
          et rien d'autre — la croix de retrait vit dans l'angle de la
          section ouverte. Rose plein quand il est ouvert, rose pâle
          quand il a des photos, neutre quand il attend les siennes. */}
      {/* ⚠️ L'AIR SOUS LE BOUTON (passe nº 120) : `mt-2` s'ajoute au
          gap-4 du contenant — 24 px entre le bouton et la première
          rangée de badges, au lieu de 16. Le bouton n'est pas un badge :
          il ouvre une fenêtre, eux ouvrent une galerie — la distance
          le dit. */}
      {stylesDesBadges.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {stylesDesBadges.map((style) => {
            const nombre = compteStyle(style.slug);
            const rempli = nombre > 0;
            const ouvert = styleActif === style.slug;
            return (
              <li key={style.slug}>
                <button
                  type="button"
                  onClick={() => basculerStyle(style.slug)}
                  aria-expanded={ouvert}
                  aria-label={
                    rempli
                      ? `${style.label} — ${nombre} photo${nombre > 1 ? "s" : ""}`
                      : `${style.label} — ouvrir`
                  }
                  //  ⚠️ DEUX ÉTATS, PAS TROIS (passe nº 117, point 7).
                  //  Il en existait un TROISIÈME — « rose transparent »
                  //  (`bg-primaire/10`), pour un style qui a des photos
                  //  sans être ouvert — et il brouillait tout : à la
                  //  réouverture d'un portfolio, un badge rose pâle à
                  //  typographie rose côtoyait des badges rose pâle à
                  //  typographie blanche, sans qu'aucun ne soit celui
                  //  qu'on regardait. Désormais : SÉLECTIONNÉ = rose
                  //  plein, texte blanc ; NORMAL = fond d'un cran plus
                  //  clair, texte blanc. Rien d'autre, nulle part.
                  /*  ██ §3 (nº 552) — LE REPOS MONTE D'UN CRAN, ET LE
                       SURVOL AVEC LUI ██
                       LE DÉFAUT : la capsule NON sélectionnée était
                       trop sombre. Mesuré sur l'encadré du formulaire
                       (`bg-sombre-carte`, #1A1F26) : `eleve` (#262C34)
                       n'en détache la capsule que de 1,18 — elle se
                       lisait comme du texte posé sur la carte, pas
                       comme un objet cliquable. `eleveClair` (#323942)
                       porte l'écart à 1,42.
                       D'OÙ VIENT CE CRAN, ET IL N'EST PAS INVENTÉ :
                       c'est le fond des CHAMPS de ce formulaire
                       (`ROBE_CHAMP_SOMBRE.repos`, MenuDeroulant) et
                       celui du bouton de `BlocModesExercice` — la
                       capsule éteinte se range au rang des choses avec
                       lesquelles on interagit dans cet écran.
                       LE SURVOL SUIT, SANS QUOI IL DISPARAÎT : il valait
                       `eleveClair`, c'est-à-dire exactement le nouveau
                       repos. Il monte à `haut` (#3E4650) — le MÊME
                       déplacement, à la même paire de jetons, que
                       `BlocModesExercice` a fait à la nº 419. L'écart
                       repos → survol est conservé au centième : 1,21
                       hier, 1,22 aujourd'hui.
                       ⚠️ LA CAPSULE SÉLECTIONNÉE NE CHANGE PAS D'UN
                       CARACTÈRE — `bg-primaire text-white`. La
                       différence entre les deux états ne se joue pas
                       sur un cran de gris mais sur une TEINTE : rose
                       plein contre gris. Elle ne peut pas s'émousser.
                       ⚠️ LE MÊME LIBELLÉ DE CLASSES EXISTE DANS
                       `AdminYokofolio` (l. 1313) : il est écrit là-bas
                       en toutes lettres, pas partagé — il ne bouge
                       pas. */
                  className={`inline-flex items-center rounded-full
                             px-3.5 min-h-[34px] text-[13.5px] font-semibold
                             transition-colors ${
                               ouvert
                                 ? "bg-primaire text-white"
                                 : "bg-sombre-eleve-clair text-sombre-texte hover:bg-sombre-haut"
                             }`}
                >
                  {style.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---------- LA SECTION DU STYLE OUVERT ---------- */}
      {styleActif && (
        //  ⚠️ LES DEUX MARGES DU FILET (passe nº 117, point 8) :
        //  `mt-2` s'ajoute au gap-4 du contenant — 24 px entre le
        //  dernier badge (ou le bouton, quand il n'y a pas encore de
        //  badge) et la ligne ; `pt-2` sous la ligne au lieu de 16, la
        //  croix d'angle et les onglets suivant immédiatement.
        //  ⚠️ ALIGNÉ SUR LE TEXTE SOUS 640 px (passe nº 120) : la même
        //  règle que les filets des modes et de l'organisation — un
        //  seul traitement de filet dans tout le formulaire.
        //  ⚠️ ET L'AIR SOUS LE FILET RÉDUIT UNE SECONDE FOIS (passe
        //  nº 120) : 41 px séparaient encore la ligne de « Réalisation /
        //  Flash » — le remplissage (8) plus la hauteur de la croix
        //  d'angle (36), qui pousse les onglets alors qu'elle vit à
        //  l'autre bout de la ligne. `pt-1` et une croix remontée d'un
        //  cran de plus ramènent l'écart à 33 px, soit −20 %.
        //  ⚠️ UNE TROISIÈME FOIS (passe nº 121) : 33 → 26 px, encore
        //  −20 %. ET CETTE FOIS PAR LA RACINE : ce n'était pas le
        //  remplissage qui écartait les onglets, c'était LA CROIX —
        //  36 px de haut, posée dans le flux, alors qu'elle vit à
        //  l'autre bout de la ligne et n'a rien au-dessous d'elle. Elle
        //  passe en SUPERPOSITION dans l'angle : elle ne pousse plus
        //  rien, et l'écart devient EXACTEMENT le remplissage qu'on
        //  choisit — 25 px, soit 26 mesurés jusqu'aux onglets.
        //  ⚠️ LA LIGNE REJOINT LES DEUX BORDS INTÉRIEURS DE L'ENCADRÉ
        //  (passe nº 128) : les marges négatives annulent le
        //  remplissage de la carte — -mx-4 sous 640 px (l'encadré
        //  mobile de la nº 128), -mx-7 dès `sm` — et le remplissage
        //  remis à l'intérieur garde le CONTENU aligné sur le texte.
        <div
          className="relative mt-2 -mx-4 px-4 border-t border-sombre-bordure
                     pt-[25px] sm:-mx-7 sm:px-7 opacity-100
                     transition-opacity duration-200 starting:opacity-0"
        >
          {/* ⚠️ LE NOM DU STYLE NE SE RÉPÈTE PLUS ICI (passe nº 112) :
              le badge sélectionné, rose et allumé juste au-dessus,
              suffit — l'écrire une seconde ligne plus bas, c'était le
              lire deux fois. */}

          {/* ---------- LA CROIX DE RETRAIT DU STYLE ----------
              ⚠️ DANS L'ANGLE SUPÉRIEUR DROIT DE LA SECTION (passe
              nº 116, point 8) — sous la ligne de séparation, plus
              JAMAIS dans le badge : là-bas, on ne savait pas si l'on
              ouvrait le style ou si on le supprimait. Des photos à
              perdre ? La fenêtre « taper SUPPRIMER » s'interpose ;
              aucune photo ? Le style part immédiatement. */}
          {/* EN SUPERPOSITION DANS L'ANGLE (passe nº 121) : la croix ne
              survole que du vide — les onglets s'alignent à gauche. */}
          {/* `right-4` compense le -mx-4 du conteneur (nº 128) : la
              croix reste alignée sur le texte, pas sur le bord. */}
          <div className="absolute right-4 top-0 sm:right-5">
            <button
              type="button"
              onClick={() => croixDuStyle(styleActif)}
              aria-label={`Retirer le style ${libelleStyle(styleActif)}`}
              title={`Retirer le style ${libelleStyle(styleActif)}`}
              className="flex h-9 w-9 items-center justify-center rounded-full
                         text-sombre-texte-doux opacity-60 transition-opacity
                         hover:opacity-100 focus-visible:opacity-100"
            >
              {/*  ██ §6 (nº 405) — LA CROIX PASSE DE 16 À 20 px ██
                   D'OÙ VIENT CETTE VALEUR : c'est UN RANG DÉJÀ POSÉ
                   DANS CE MÊME BLOC — celui du chevron du menu des
                   styles (`IconeChevronBas taille={20}`, plus bas), et
                   celui de l'icône de lien des lignes de formulaire.
                   16 px la mettait au rang du texte des onglets
                   « Réalisation / Flash » (15 px) qu'elle jouxte :
                   seule dans son angle, elle s'y perdait. 20 px est UN
                   CRAN de l'échelle du site (16 · 18 · 20 · 22), et
                   l'on s'arrête là : 22 est le rang de l'en-tête de
                   recherche (nº 401), trop haut pour un coin de
                   section.
                   ⚠️ RIEN NE BOUGE AUTOUR, et c'est la méthode de la
                   nº 401 : la ZONE TACTILE ne change pas — elle vaut
                   toujours 36 px (`h-9 w-9`), et c'est la BOÎTE, pas le
                   glyphe, qui la donne. Le glyphe grandit À
                   L'INTÉRIEUR d'une boîte fixe : ni la position du
                   bouton (`absolute right-4 top-0`), ni l'alignement
                   des onglets, ni la hauteur de la ligne ne changent
                   d'un pixel. */}
              <IconeCroix taille={20} />
            </button>
          </div>

          {/* ---------- 1) LA NATURE — DES ONGLETS SOULIGNÉS ----------
              ⚠️ LES DEUX NIVEAUX ONT ÉTÉ INVERSÉS (passe nº 117,
              point 9). On choisissait d'abord un RENDU (noir et gris /
              couleur), puis une NATURE (réalisation / flash) — l'ordre
              inverse de la façon dont on range ses photos : on sait
              d'abord si l'on montre un travail fait ou un dessin à
              prendre, la couleur vient après. « Réalisation » et
              « Flash » ouvrent donc la marche, sur les onglets
              soulignés — l'actif en blanc, la ligne fine grise sous les
              deux, épaisse et rose sous l'actif.
              LES DEUX NIVEAUX ARRIVENT POSÉS sur leur premier choix :
              la galerie est à l'écran sans un clic (voir
              `basculerStyle`). */}
          <div className="mt-0">
            <OngletsLigne
              ariaLabel={`Nature — ${libelleStyle(styleActif)}`}
              options={NATURES_PHOTO.map((nature) => ({
                cle: nature.slug,
                label: nature.label,
              }))}
              cleActive={natureActive}
              surChoix={choisirNature}
            />
          </div>

          {/* ---------- 2) LE RENDU — TROIS RECTANGLES ----------
              « Noir », « Noir et gris », « Couleur » (l'ordre du
              propriétaire, nº 404 — celui de RENDUS_PHOTO), chacun
              avec SON nombre de photos. C'est LE SEUL endroit du bloc
              où un nombre s'affiche : ici, il est utile — il dit ce
              qu'il y a dans chacune des galeries de la nature
              choisie. */}
          {/*  ██ §2 (nº 400) — UN STYLE TOUT NOIR N'A QU'UN ENCADRÉ ██
               ==========================================================
               Il occupe TOUTE LA LARGEUR, il est présenté DANS SON ÉTAT
               SÉLECTIONNÉ (`bg-sombre-eleve-clair`, titre blanc — les
               couleurs exactes des rectangles choisis juste en dessous),
               et il est INERTE : c'est un `<div>`, pas un `<button>`. Ce
               seul choix de balise emporte tout ce que le propriétaire
               demande — aucun survol, aucun clic, et AUCUN CURSEUR MAIN
               (la règle de la nº 398 ne vise que les boutons, les liens
               et les rôles cliquables : un `<div>` nu n'en est pas un).
               Il informe, il ne se choisit pas.
               ██ nº 404 — IL DIT « NOIR », ET RIEN D'AUTRE ██
               Le trait vertical (nº 400/401) et la mention « Noir et
               gris inclut le tout noir. » SONT SUPPRIMÉS : « Noir et
               gris » n'inclut plus rien — le rendu « Noir » existe, et
               c'est lui que cet encadré nomme. La pleine largeur reste
               (c'est un état du sélecteur, pas un tiers de grille).
               ⚠️ LE COMPTE RESTE : « n/20 photos » est la seule chose du
               bloc qui dise ce que contient la galerie et où est le
               plafond. Le retirer serait une perte que personne n'a
               demandée. */}
          {natureActive && renduReplie && (
            <div
              data-rendu-choix={RENDU_TOUT_NOIR}
              data-rendu-actif=""
              data-rendu-replie=""
              className="mt-3 w-full rounded-lg bg-sombre-eleve-clair px-3 py-2.5 text-left"
            >
              <span className="block text-[14px] font-semibold text-white">
                {libelleRendu(RENDU_TOUT_NOIR)}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-white mobile:text-[11px]">
                {duTriplet(styleActif!, RENDU_TOUT_NOIR, natureActive).length}
                /{PLAFOND_GALERIE} photos
              </span>
            </div>
          )}

          {/*  ██ nº 404 — TROIS ENCADRÉS SUR UNE SEULE LIGNE ██
               `grid-cols-3` : trois tiers égaux, la ligne tient par
               construction à toutes les largeurs — comme le sélecteur
               de lieux de la nº 402. Ce qui peut déborder d'un tiers
               sur téléphone, c'est le SOUS-TITRE « 20/20 photos »
               (mesuré sur le woff2 Geist que le site sert : 64,9 px à
               12,5 px — il ne tient qu'à partir de ~347 px d'écran, un
               tiers offrant (écran − 64 px de marges − 16 px d'écarts)
               ÷ 3 − 24 px de padding de texte) : il descend à 11 px au
               doigt (57,1 px — ça tient dès ~324 px d'écran), et ne
               bouge pas au web, où un tiers fait ~173 px. Les titres
               restent à 14 px : « Noir et gris » (67,6 px en 600) tient
               dès ~355 px — sur tous les iPhones actuels (375 px et
               plus) tout est sur une ligne. */}
          {natureActive && !renduReplie && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {RENDUS_PHOTO.map((rendu) => {
                const nombre = duTriplet(
                  styleActif,
                  rendu.slug,
                  natureActive
                ).length;
                const actif = renduActif === rendu.slug;
                return (
                  <button
                    key={rendu.slug}
                    type="button"
                    //  ⚠️ ON NE REFERME PLUS (nº 117, point 9) : les
                    //  deux niveaux gardent toujours une position, pour
                    //  que le contenu s'affiche sans clic
                    //  supplémentaire. Cliquer le rectangle actif ne
                    //  fait donc rien — il est déjà ouvert.
                    onClick={() => setRenduOuvert(rendu.slug)}
                    aria-expanded={actif}
                    data-rendu-choix={rendu.slug}
                    data-rendu-actif={actif ? "" : undefined}
                    //  ⚠️ PLUS DE CONTOUR (passe nº 112) : le fond dit
                    //  tout — un cran plus clair au repos, teinté de
                    //  rose quand la galerie est ouverte.
                    /*  §2-a (nº 309) — `relative` portait le soulignement
                        rose de l'actif, posé DANS le rectangle.
                        §5 (nº 405) — LE TRAIT EST PARTI ; les deux
                        classes restent : `overflow-hidden` borne le fond
                        aux coins arrondis, et `relative` ne coûte rien
                        (aucun enfant absolu, aucune peinture). Les
                        retirer serait un remaniement que personne n'a
                        demandé, sur un bouton qui ne doit pas bouger. */
                    className={`relative overflow-hidden rounded-lg px-3 py-2.5
                               text-left transition-colors ${
                                 actif
                                   ? "bg-sombre-eleve-clair"
                                   : "bg-sombre-eleve hover:bg-sombre-eleve-clair"
                               }`}
                  >
                    {/*  §2-a (nº 309) — LE TITRE A QUITTÉ LE ROSE POUR
                         LE BLANC : le rose ne vivait plus que dans le
                         trait, où il disait « c'est ici » sans se
                         disputer la lecture avec le texte. (Le trait
                         est supprimé à la nº 405 : plus aucun rose dans
                         ces encadrés — le fond dit tout.)
                         §3-b (nº 311) — ET IL EST BLANC DANS LES DEUX
                         ÉTATS. La nº 309 avait aussi grisé le titre du
                         rendu non choisi ; le propriétaire le veut
                         blanc. C'est le SOUS-TITRE, lui seul, qui dit
                         lequel des deux on regarde — avec le trait. */}
                    <span className="block text-[14px] font-semibold text-white">
                      {rendu.label}
                    </span>
                    {/* LE COMPTE DIT AUSSI LE PLAFOND (passe nº 112) :
                        « 16/20 photos ». L'en-tête « PORTFOLIO 16/20 »
                        au-dessus de la grille est parti — le compte vit
                        ici, et seulement ici.
                        §2-a (nº 309) — blanc sous le rendu choisi, gris
                        sous l'autre : le sous-titre suit son titre. */}
                    <span
                      className={`mt-0.5 block text-[12.5px] mobile:text-[11px] ${
                        actif ? "text-white" : "text-sombre-texte-doux"
                      }`}
                    >
                      {nombre}/{PLAFOND_GALERIE} photos
                    </span>
                    {/*  ██ §5 (nº 405) — LE TRAIT ROSE EST SUPPRIMÉ ██
                         =================================================
                         Il venait de la nº 309 (§2-a) et avait fait
                         l'aller-retour de la nº 311 à la nº 312 : 2 px
                         de rose le long du bord bas, sous le seul
                         encadré choisi, repris des onglets de la ligne
                         au-dessus. Le propriétaire le retire.
                         CE QUI DIT ENCORE « C'EST CELUI-CI », et qui ne
                         bouge pas : LE FOND (`bg-sombre-eleve-clair`
                         sur l'actif, `bg-sombre-eleve` sur les autres)
                         et LE SOUS-TITRE (blanc sur l'actif, gris doux
                         sur les autres). Deux marques valent mieux
                         qu'une troisième.
                         ⚠️ RIEN NE SE DÉCALE : le trait était en
                         `absolute`, donc HORS DU FLUX — il ne poussait
                         rien. Sa disparition ne rend aucun pixel de
                         hauteur, et les encadrés gardent leur taille.
                         Le `relative` du bouton reste : il porte aussi
                         l'`overflow-hidden` des coins arrondis. */}
                  </button>
                );
              })}
            </div>
          )}

          {/* ---------- 3) LA GALERIE DU TRIPLET OUVERT ----------
              ⚠️ ELLE ACCEPTE LE DÉPÔT DE FICHIERS (web, passe nº 112) :
              glisser des photos depuis le Finder directement sur la
              grille lance la même série de recadrages que le
              sélecteur. AUCUNE CONFUSION POSSIBLE avec le
              réordonnancement des vignettes : le glisser INTERNE est
              fait d'événements de POINTEUR (GrilleGalerie, appui long
              / prise souris) et ne déclenche jamais `dragover` ; un
              fichier venu de L'EXTÉRIEUR arrive par le vrai
              glisser-déposer HTML, dont le `dataTransfer` porte des
              FICHIERS — et c'est la seule chose qu'on accepte ici. */}
          {renduActif && natureActive && (
            <div
              className={`mt-3 transition-colors ${
                deposeEnVue
                  ? "outline-2 outline-dashed outline-primaire bg-primaire/5"
                  : ""
              }`}
              onDragOver={(evenement) => {
                if (!evenement.dataTransfer.types.includes("Files")) return;
                evenement.preventDefault();
                setDeposeEnVue(true);
              }}
              onDragLeave={() => setDeposeEnVue(false)}
              onDrop={(evenement) => {
                setDeposeEnVue(false);
                const fichiers = Array.from(evenement.dataTransfer.files ?? []);
                if (fichiers.length === 0) return;
                evenement.preventDefault();
                demarrerDepot(fichiers);
              }}
            >
              <GrilleGalerie
                tuiles={galerieOuverte.map((photo, rang) => ({
                  cle: photo.cle,
                  src: photo.miniature || photo.apercu,
                  etiquette: `Photo ${rang + 1} · ${libelleRendu(
                    photo.rendu
                  )} · ${libelleNature(photo.nature)}`,
                }))}
                surOrdre={(cles) =>
                  reordonner(styleActif, renduActif, natureActive, cles)
                }
                surOuverture={(cle) => void ouvrirPhoto(cle)}
                colonnes="grid-cols-3 sm:grid-cols-5 md:grid-cols-6"
                queue={
                  galeriePleine ? undefined : (
                    <button
                      type="button"
                      onClick={ouvrirLeSelecteur}
                      aria-label={`Ajouter une photo — ${libelleStyle(styleActif)}, ${libelleRendu(renduActif)}, ${libelleNature(natureActive)}`}
                      //  ANGLES DROITS, et le pointillé reste : il dit
                      //  « ici, il n'y a pas encore de photo » — un
                      //  signal, pas une structure (règle nº 112).
                      //  ⚠️ AU SURVOL, IL PASSE EN BLANC (passe nº 112),
                      //  comme l'icône qu'il entoure : le rose est la
                      //  couleur du choisi, pas celle du survol d'une
                      //  case vide.
                      className="group flex aspect-[4/5] w-full items-center
                                 justify-center border-2 border-dashed
                                 border-sombre-bordure
                                 transition-colors hover:border-sombre-texte"
                    >
                      {/* ⚠️ UNE ICÔNE, PLUS « + Ajouter » (passe nº 111) :
                          dans une mosaïque de photos, une case vide
                          marquée d'un appareil photo se comprend sans
                          légende. GRANDE ICI (34 px) : c'est une tuile
                          entière, pas une puce dans une ligne. */}
                      <IconeAjouterPhoto
                        taille={34}
                        className="group-hover:opacity-90"
                      />
                    </button>
                  )
                }
              />
              {/* §7 (nº 415) — « Préparation des photos… » se rendait
                  ici (nº 127). Elle est SUPPRIMÉE sur demande du
                  propriétaire : plus aucune phrase d'attente sous
                  l'encadré. Le message d'erreur, lui, garde sa place
                  et son écriture — c'est le même endroit. */}
              {erreurFichier && (
                <p role="alert" className="mt-2 text-[13px] text-erreur">
                  {erreurFichier}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ⚠️ UN MANQUE NE S'ÉCRIT PLUS (passe nº 111) : le titre rouge
          de la section le dit déjà. Seuls les messages qui APPRENNENT
          quelque chose passent encore ici (voir lib/erreurs-formulaire). */}
      {texteErreur(enErreur) && (
        <p className="text-[13px] text-erreur">{texteErreur(enErreur)}</p>
      )}

      <input
        ref={entreeFichier}
        type="file"
        //  ⚠️ SÉLECTION MULTIPLE (passe nº 112) : vingt photos ne
        //  valent plus vingt allers-retours vers la galerie du
        //  téléphone — on choisit tout d'un coup, la fenêtre de
        //  recadrage enchaîne.
        multiple
        //  ⚠️ LE HEIC EST ACCEPTÉ (passe nº 127) : sans lui, Safari
        //  convertissait chaque photo d'iPhone avant de la rendre —
        //  voir la note de FORMATS_PHOTO, en tête de fichier.
        accept={ACCEPT_PHOTO}
        onChange={fichierChoisi}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ---------- LA FENÊTRE DE RECADRAGE — celle d'avant le
          catalogue, restaurée. Ouverte sur une photo existante, elle
          propose aussi la suppression. ---------- */}
      {recadrage && (
        <RecadreurPhoto
          //  ⚠️ LA CLÉ NE PORTE PLUS LE RANG DE SÉRIE (passe nº 126).
          //  Elle valait `…-${serie.rang}-${nom}-${date}` : à chaque
          //  photo validée, la fenêtre était DÉMONTÉE puis REMONTÉE, et
          //  avec elle l'effet qui fige la page derrière — vingt photos,
          //  vingt gels et dégels du défilement. Elle reste désormais
          //  montée du début à la fin de la série ; c'est le recadreur
          //  qui repart à neuf quand le fichier change (zoom, cadrage,
          //  image), y compris pour deux fichiers identiques à la
          //  suite : ce sont deux objets `File` distincts.
          //  La clé distingue encore les deux usages — une photo neuve
          //  et une photo déjà en galerie n'ont pas les mêmes boutons.
          key={recadrage.cle ?? "neuve"}
          fichier={recadrage.fichier}
          forme="portrait"
          compteur={
            serie && serie.fichiers.length > 1
              ? { rang: serie.rang + 1, total: serie.fichiers.length }
              : undefined
          }
          surValidation={cadrageValide}
          surImageIllisible={photoIllisible}
          surFermeture={fermerRecadrage}
          surSuppression={recadrage.cle ? supprimerLaPhoto : undefined}
        />
      )}

      {/* ---------- LA FENÊTRE DE SÉLECTION DES STYLES (nº 116) ----
          Par-dessus le formulaire : LA liste des 38 styles de A à Z,
          un par ligne, défilante — sans champ de saisie, sans menu.
          « Cultures du monde » porte sa flèche BIEN VISIBLE : un
          clic déploie ses onze styles dessous, décalés à droite pour
          montrer qu'ils lui appartiennent. Les styles déjà choisis
          restent listés, cochés et inertes. Choisir ferme la fenêtre
          et pose le badge. Voile, croix et Échap referment.
          §4 (nº 474) — LE WEB SEULEMENT, désormais : au doigt, cette
          fenêtre est cachée par sa variante (l'écriture de la fenêtre
          des langues, nº 465) et la PAGE plein écran, plus bas, prend
          le relais — aucune bifurcation d'état, donc aucun éclair du
          mauvais habillage au montage. ------- */}
      {fenetreStyles &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ajouter un style"
            className="mobile:hidden fixed inset-0 z-[80] flex items-center justify-center p-4"
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={fermerFenetreStyles}
              className="absolute inset-0 bg-black/25 cursor-default
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
            />
            {/*  §1-a (nº 304) — LA PLAQUE PASSE EN VERRE. Elle était
                 OPAQUE (`bg-sombre-carte`) quand toutes les autres
                 surfaces superposées du site sont en verre — les deux
                 fenêtres de confirmation de ce fichier même le sont
                 déjà (`data-verre-fenetre`, plus bas).
                 ⚠️ C'EST L'ÉCRITURE DES FENÊTRES (22 %, 40 px), et non
                 celle des MENUS (45 %, 60 px) : celle-là est faite pour
                 les panneaux qui s'ouvrent SANS voile, où la page se
                 voit vraiment à travers. Ici il y a un voile noir à
                 25 %, exactement comme les deux fenêtres voisines — on
                 prend donc la même écriture qu'elles.
                 ⚠️ ET SON FONDU D'OPACITÉ EST RETIRÉ : c'est le piège
                 de la nº 234, mot pour mot — une plaque qui s'anime en
                 opacité devient sa PROPRE racine d'arrière-plan pendant
                 le fondu, et l'iPhone montre du noir. Le fondu reste au
                 VOILE, à qui il appartient. */}
            <div
              /*  ██ §1 (nº 544) — LA PLAQUE REDEVIENT OPAQUE ██
                   La note du §1-a ci-dessus raconte la nº 304, qui
                   l'avait fait passer d'un aplat `carte` AU VERRE pour
                   suivre le reste du site. Le site vient de faire le
                   chemin inverse (nº 542-543) : elle redevient donc un
                   aplat, au MÊME jeton `carte` qu'à l'époque — la
                   boucle se referme sur la valeur d'origine.
                   L'attribut de verre est retiré, `globals.css` n'est
                   pas touché (règle nº 172), le liseré part avec lui.
                   ⚠️ CETTE FENÊTRE EST CELLE DU WEB (`mobile:hidden`,
                   plus haut) : la page plein écran « Ajouter un style »
                   du doigt n'est pas concernée.
                   ⚠️ L'ombre portée est antérieure et reste ; ni la
                   largeur, ni la hauteur maximale, ni le voile ne
                   changent.
                   ██ §2 (nº 559) — ELLE MONTE AU RANG DES ENCADRÉS ██
                   `carte` NE SUFFISAIT PAS, et pour la raison exacte
                   de la nº 553 : cette fenêtre s'ouvre PAR-DESSUS le
                   formulaire, dont les encadrés valent EUX AUSSI
                   `carte` (`FormulaireFiche`). Elle avait donc très
                   exactement la couleur de ce qu'elle recouvre —
                   contraste 1,00 — et son ombre portée était seule à
                   dire où elle commençait.
                   LE JETON EST `eleve` (#262C34), celui des ENCADRÉS
                   du site : 1,18 avec l'encadré du formulaire, 1,37
                   avec la page. C'est le plafond de l'échelle — une
                   surface qui flotte doit paraître plus haute que son
                   support, jamais plus claire que les encadrés.
                   ⚠️ CE QUI EST POSÉ DEDANS MONTE AVEC ELLE, sans
                   quoi il disparaîtrait : les survols des lignes et
                   de la croix, le bandeau du bas et son champ. Chacun
                   porte sa note à son endroit.
                   ⚠️ ET CE QUI PERD, JE LE DIS PLUTÔT QUE DE LE
                   RATTRAPER : le filet sous le titre
                   (`border-sombre-bordure`) passe de 1,28 à 1,09 —
                   il se devine encore, il ne se lit plus. Le monter
                   demanderait un autre jeton de trait, ce qui est une
                   question de charte et non de cette passe.
                   ⚠️ LA PAGE DU DOIGT N'EST PAS CONCERNÉE : elle vit
                   sur le fond de page (`bg-sombre-fond`), où rien ne
                   se confond. */
              className="relative flex w-full max-w-[420px]
                         max-h-[min(80dvh,640px)] flex-col overflow-hidden
                         rounded-xl bg-sombre-eleve
                         shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            >
              {/*  §1-b (nº 304) — UNE LIGNE DE SÉPARATION SOUS LE
                   TITRE : le filet du site (`border-sombre-bordure`),
                   celui des sections de fiche — aucune valeur neuve.
                   Le `pb-1` passe à `pb-3` pour que le filet ne colle
                   pas au mot. */}
              {/*  ██ §2 (nº 560) — LE FILET REDEVIENT LISIBLE ██
                   CE QUE LA nº 559 AVAIT SIGNALÉ SANS LE RATTRAPER : en
                   passant la plaque de `carte` à `eleve`, ce filet est
                   tombé de 1,28 à 1,09 — il ne se lisait plus. LA CIBLE
                   EST DONC CE QU'IL AVAIT : au moins 1,28.
                   LES CANDIDATS, MESURÉS SUR `eleve` : `bordure` 1,09
                   (l'actuel), `trait` 1,14, `eleve-clair` 1,21,
                   `haut` 1,47. Les trois premiers restent SOUS la cible
                   — même `trait`, pourtant le jeton doctrinal des
                   séparations (nº 315), ne rendrait que 1,14 : sur un
                   fond monté de deux crans, un jeton pensé pour `fond`
                   ne suffit plus. `haut` est le premier qui passe.
                   ⚠️ CE FILET N'EST PARTAGÉ AVEC PERSONNE : il est écrit
                   ici, en toutes lettres, pour cette fenêtre seule. La
                   page du doigt a le SIEN, d'une autre écriture
                   (`TRAIT_SEPARATION_FOND` dans son `sousLeTitre`, plus
                   bas) — elle ne bouge pas. Les autres porteurs de
                   `border-sombre-bordure` vivent tous dans d'AUTRES
                   fichiers (champs de contact, mot de passe, fenêtres
                   hors ligne) : aucun n'est emporté.
                   ⚠️ ET LA CHARTE N'EST PAS ÉTENDUE : c'est le filet qui
                   existait déjà, on change sa couleur — aucun contour
                   neuf n'est ajouté nulle part. */}
              <div className="flex items-center justify-between border-b border-sombre-haut pl-5 pr-3 pt-3 pb-3">
                <h2 className="text-[16px] font-bold text-sombre-texte">
                  Ajouter un style
                </h2>
                <button
                  type="button"
                  onClick={fermerFenetreStyles}
                  aria-label="Fermer"
                  //  §2 (nº 559) — le survol de la croix suit la plaque
                  //  passée à `eleve` : à `eleve` il aurait disparu.
                  className="flex h-9 w-9 items-center justify-center rounded-full
                             text-sombre-texte-doux transition-colors
                             hover:bg-sombre-eleve-clair hover:text-sombre-texte"
                >
                  <IconeCroix taille={16} />
                </button>
              </div>
              <ul
                aria-label="Les styles, de A à Z"
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain
                           defilement-visible pb-2"
              >
                {/*  §2 (nº 559) — la fenêtre demande le survol du cran
                     au-dessus : sa plaque est passée à `eleve`, où
                     l'ancien survol ne se verrait plus. */}
                {lignesDesStyles("hover:bg-sombre-eleve-clair")}
              </ul>

              {/* ---------- « UN STYLE MANQUE ? » — LE BANDEAU FIXE
                  (passe nº 124) ----------
                  ⚠️ IL A QUITTÉ LE BOUT DE LA LISTE (nº 122) pour le
                  BAS DE LA FENÊTRE : posé sous l'ul défilante, il
                  reste visible pendant tout le parcours des styles —
                  au bout de la liste, personne ne le voyait.
                  ET IL RESTE DISCRET : une seule ligne (la question
                  d'avant tient dans le fantôme du champ), ~68 px de
                  haut — l'action secondaire ne mange pas la liste,
                  surtout sur un écran étroit. C'EST SON FOND UN CRAN
                  PLUS CLAIR (bg-sombre-eleve) qui le détache de la
                  liste — l'ombre portée de la nº 124 a disparu (passe
                  nº 125) : aucun effet d'ombre, c'est la charte, les
                  niveaux de fond suffisent.
                  DEUX DÉFAUTS CORRIGÉS AU PASSAGE :
                   · « ENVOYER » S'ALLUME dès qu'un texte est saisi —
                     capsule PLEINE ROSE : c'est l'action finale de ce
                     micro-échange (comme « Fermer » de la
                     confirmation), plus un gris qui semblait bloqué ;
                   · LA CROIX D'EFFACEMENT du champ, comme sur les
                     autres champs de recherche du formulaire. */}
              {/*  §2 (nº 559) — le bandeau et son champ montent d'un
                   cran chacun, la plaque étant passée à `eleve` :
                   bandeau 1,21 sur la plaque, champ 1,22 sur le
                   bandeau — les deux écarts d'avant, conservés.
                   ██ §3 (nº 560) — LA BARRE MONTE ENCORE D'UN CRAN ██
                   Les 1,21 de la nº 559 ne suffisaient pas : la barre
                   se confondait avec la fenêtre. Elle passe à `haut` —
                   1,47 sur la plaque, le même écart que celui qui
                   détache la plaque de l'encadré du formulaire. C'est
                   la première valeur de l'échelle qui la fasse
                   VRAIMENT ressortir.
                   ET LE CHAMP SUIT, sans quoi il disparaîtrait dans
                   elle : `haut` était devenu la couleur de la barre
                   (1,00) ; il monte à `haut-clair` et retrouve son
                   écart (1,21).
                   ⚠️ ET SON FOCUS N'A PLUS DE CRAN AU-DESSUS DE LUI :
                   `haut-clair` est le dernier de l'échelle. Plutôt
                   qu'écrire un `focus:` qui repeindrait la couleur
                   déjà posée — une classe qui ne dirait rien de vrai,
                   et que la passe suivante croirait active — la
                   classe de focus est SIMPLEMENT ABSENTE au web : le
                   champ se dit par son curseur, comme partout où l'on
                   écrit. Inventer une couleur pour la remplacer est
                   hors des bornes de cette passe ; je le signale.
                   ⚠️ TROIS RÉGLAGES DITS PAR L'APPELANT, UN SEUL
                   APPEL : la page du doigt n'en passe aucun et garde
                   ses trois valeurs d'avant, au caractère près.

                   ██ §3 (nº 561) — LA BARRE REDESCEND D'UN CRAN ██
                   LE DÉFAUT : à `haut`, elle touchait presque le champ
                   qu'elle porte (`haut-clair`) — 1,21 entre les deux,
                   on ne les distinguait plus. Elle passe à
                   `eleve-clair`.
                   CE QUE ÇA ÉCHANGE, ET C'EST UN ÉCHANGE, PAS UN GAIN
                   PARTOUT :
                    · avec le CHAMP : 1,21 → 1,48. C'était la demande ;
                    · avec la FENÊTRE : 1,47 → 1,21. C'est le chiffre
                      que la nº 560 avait jugé trop faible.
                   POURQUOI ÇA DOIT SE LIRE AUTREMENT QU'À LA nº 560 :
                   là-bas, la barre ET son contenu étaient ternes — le
                   champ à 1,22 d'elle, le bouton fondu dedans (1,00).
                   Rien ne la dessinait. Aujourd'hui son CONTENU saute
                   aux yeux — champ et bouton à 1,48 —, et c'est lui
                   qui dit où commence la barre. Une bande se voit par
                   ce qu'elle porte autant que par sa teinte.
                   ⚠️ IL N'Y AVAIT PAS D'AUTRE SOLUTION DANS L'ÉCHELLE,
                   et je le dis : élargir l'écart barre ↔ champ en
                   montant le CHAMP est impossible — `haut-clair` est
                   le dernier cran. La barre était donc le seul des
                   deux qui pouvait bouger. Descendre de DEUX crans
                   (`trait`) donnerait 1,56 avec le champ mais 1,14
                   avec la fenêtre : la barre y disparaîtrait pour de
                   bon.

                   ██ §1 (nº 561) — LE BOUTON REPREND SON ROSE ██
                   Les deux gris de la nº 560 sont défaits sur consigne :
                    · ALLUMÉ — `primaire`, comme avant la nº 560. Il
                      tranche sur la barre à 3,26, et par la TEINTE
                      autant que par la clarté ;
                    · ÉTEINT — `haut-clair`, le gris clair que la
                      nº 560 donnait à l'allumé : 1,48 sur la barre. Le
                      bouton se voit au repos, ce qui était le défaut
                      de la nº 560-§4a, et il ne peut plus être pris
                      pour l'état prêt : celui-là est rose.
                   ⚠️ LE MOT ÉTEINT PERD, ET JE LE SIGNALE PLUTÔT QUE
                   DE LE RATTRAPER : `texte-doux` sur `haut-clair` rend
                   3,35, contre 4,94 qu'il avait sur `eleve-clair`. Je
                   le garde parce que c'est LUI qui dit « pas encore » —
                   le passer au blanc plein (7,07) donnerait à un
                   bouton désactivé l'air d'un bouton prêt. Un mot,
                   `text-sombre-texte`, suffirait à l'inverser si tu
                   préfères la lisibilité au signal.
                   ⚠️ ET LE MOT ALLUMÉ RESTE BLANC PUR : le blanc rend
                   3,58 sur le rose, et c'est le MAXIMUM disponible —
                   le jeton `texte` du site (#F2F2F4) n'en donnerait
                   que 3,21. Sans toucher au rose, le seul levier qui
                   resterait est la GRAISSE : à 14 px, la norme ne
                   compte un texte comme « grand » qu'à partir du gras
                   plein, et 3,58 passerait alors son seuil. Je ne le
                   fais pas — cela changerait le dessin du bouton, et
                   son écriture est partagée avec la page du doigt. */}
              {bandeauStyleManquant(
                "relative z-10 shrink-0 bg-sombre-eleve-clair px-4 py-3",
                "bg-sombre-haut-clair",
                "bg-primaire text-white " +
                  "hover:opacity-90 active:opacity-90 " +
                  "disabled:bg-sombre-haut-clair " +
                  "disabled:text-sombre-texte-doux"
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ---------- LA MÊME LISTE, EN PAGE PLEIN ÉCRAN (§4, nº 474) —
          Au doigt, « Ajouter un style » n'est plus une fenêtre : une
          PAGE au gabarit de la nº 465 (PagePleinEcranMobile — rien
          d'inventé), qui ne se montre qu'au doigt par sa propre
          écriture, comme la fenêtre ci-dessus ne se montre qu'au web.
          Le rond « + » du bouton d'ouverture donne son icône au
          titre, comme la silhouette pour « Mon compte ». La croix de
          l'en-tête ET le retour du téléphone rendent le formulaire,
          saisie intacte (l'étape d'historique et le verrou de
          défilement vivent avec les crochets, plus haut). Les lignes
          sont LES MÊMES que dans la fenêtre (`lignesDesStyles`) — à
          UNE classe près depuis la nº 559, le survol, que chaque
          surface demande selon son fond ; le
          bandeau « Un style manque ? » se colle au BAS de l'écran
          pendant le défilement — rester en vue durant tout le
          parcours est sa raison d'être (nº 124) — et son rembourrage
          bas s'agrandit de la zone sûre du téléphone. ------- */}
      {fenetreStyles && (
        <PagePleinEcranMobile
          titre="Ajouter un style"
          icone={<IconePlus taille={22} classe="shrink-0 text-white" />}
          ariaLabel="Ajouter un style"
          surFermer={fermerFenetreStyles}
          classeCadre="z-[80]"
          /*  §2-b (nº 475) — LA LIGNE DE SÉPARATION SOUS LE TITRE.
              Elle vit DANS le bloc collant de l'en-tête (le canal
              `sousLeTitre`, ouvert à cette passe) : elle reste donc
              sous le titre pendant tout le défilement de la liste, au
              lieu de s'en aller avec la première ligne.
              · SA COULEUR est le jeton de trait du site, par son
                écriture unique — `TRAIT_SEPARATION_FOND`
                (`bg-sombre-trait`, config/tatouage l. 2030) : aucune
                couleur en dur, aucun contour (la charte les proscrit
                hors erreur) — un filet d'un pixel, pas une bordure.
              · ELLE S'ARRÊTE AUX MARGES DE L'INTERFACE : posée dans
                l'en-tête, qui porte `px-4`, elle commence et finit
                exactement où commencent et finissent le titre et les
                lignes de style — jamais bord à bord.
              · SES DEUX AIRS SONT ÉGAUX, à DOUZE pixels : au-dessus,
                les 12 de `mt-3` (sous la rangée du titre) ; en dessous,
                les 4 du `pb-1` de l'en-tête plus les 8 du `pt-2` de la
                liste — 12 aussi, jusqu'à la première ligne. */
          sousLeTitre={
            <div
              aria-hidden="true"
              className={`mt-3 h-px ${TRAIT_SEPARATION_FOND}`}
            />
          }
        >
          {/*  ██ §2 (nº 476) — LE TAP QUI REFERME LE CLAVIER NE CHOISIT
               PLUS UN STYLE ██
               LA CAUSE, NOMMÉE : rien ne retenait ce tap. Quand le
               champ « Un style manque ? » a le focus, toucher la liste
               fait DEUX choses d'un coup — le navigateur retire le
               focus (le clavier se referme) ET le lever du doigt envoie
               son `click` au bouton qui se trouvait dessous : le style
               était donc ajouté par le geste qui ne voulait que ranger
               le clavier. C'est le mécanisme de la nº 464, à un détail
               près : là-bas une fermeture posée sur l'appui laissait
               filer le clic ; ici c'est le navigateur lui-même qui
               défocalise à l'appui, et le clic file pareil.
               LE REMÈDE — le premier geste ne sert qu'à refermer :
               · à l'APPUI, on regarde qui a le focus. Si c'est un champ
                 de saisie, on le note et on le referme à la main ;
               · au CLIC qui suit, si la note est là, on l'AVALE
                 (`preventDefault` + `stopPropagation`) : le bouton du
                 dessous ne le voit jamais.
               ⚠️ AUCUN `preventDefault` À L'APPUI : il couperait le
               DÉFILEMENT tactile de la liste. Et la note est RECALCULÉE
               à chaque appui — un glissement qui ne produit aucun clic
               ne peut donc pas laisser un avalement en embuscade pour
               plus tard.
               ⚠️ CE QUI NE CHANGE PAS : le tap suivant, clavier déjà
               fermé, choisit le style normalement (plus personne n'a le
               focus, rien n'est avalé) ; la croix, le retour du
               téléphone et Échap referment l'écran comme avant — ce
               garde ne vit que sur la liste. */}
          <ul
            aria-label="Les styles, de A à Z"
            className="grow pt-2 pb-2"
            onPointerDownCapture={() => {
              const auClavier = document.activeElement;
              const enSaisie =
                auClavier instanceof HTMLInputElement ||
                auClavier instanceof HTMLTextAreaElement;
              avalerLeProchainClic.current = enSaisie;
              if (enSaisie) (auClavier as HTMLElement).blur();
            }}
            onClickCapture={(evenement) => {
              if (!avalerLeProchainClic.current) return;
              avalerLeProchainClic.current = false;
              evenement.preventDefault();
              evenement.stopPropagation();
            }}
          >
            {/*  §2 (nº 559) — la page du doigt NE PASSE RIEN : elle
                 garde le survol par défaut, celui d'avant cette passe,
                 au caractère près. Son fond est celui de la page
                 (`bg-sombre-fond`) — rien ne s'y confond. */}
            {lignesDesStyles()}
          </ul>
          {bandeauStyleManquant(
            "sticky bottom-0 z-10 shrink-0 bg-sombre-eleve px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          )}
        </PagePleinEcranMobile>
      )}

      {/* ---------- « DEMANDE ENVOYÉE » (passe nº 122) ----------
          Elle remplace la fenêtre des styles, qui vient de se fermer :
          on ne superpose pas deux fenêtres pour dire une seule chose.
          Un titre, une phrase, un bouton — et le bouton est ici une
          CAPSULE PLEINE : c'est l'action finale de cet échange, il n'y
          a rien d'autre à faire que le refermer. */}
      {suggestionEnvoyee &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Demande envoyée"
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setSuggestionEnvoyee(false)}
              className="absolute inset-0 bg-black/25 cursor-default
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
            />
            <div
            /*  §1 (nº 544) — PLUS DE VERRE : l'attribut est retiré, le
                 jeton `carte` de la nº 466 le remplace (la teinte des
                 nº 542-543). `globals.css` intact (règle nº 172), le
                 liseré part avec l'attribut. L'ombre portée est
                 antérieure et reste ; rien d'autre ne bouge. */
            className="relative w-full max-w-[380px] rounded-xl
                         bg-sombre-carte p-5
                         shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            >
              <h2 className="text-[17px] font-bold text-sombre-texte">
                Demande envoyée
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
                Elle sera examinée sous 24&nbsp;h. Tu seras averti dans tes
                notifications.
              </p>
              <button
                type="button"
                onClick={() => setSuggestionEnvoyee(false)}
                className="mt-5 w-full min-h-[46px] rounded-full bg-primaire
                           text-[15px] font-semibold text-white
                           transition-opacity hover:opacity-90 active:opacity-90"
              >
                Fermer
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ---------- LA FENÊTRE « TAPER SUPPRIMER » ----------
          Retirer un style emporte TOUTES ses photos : la confirmation
          se TAPE, elle ne se clique pas — on ne perd pas un dépôt
          entier sur un réflexe. */}
      {aRetirer &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Retirer le style ${libelleStyle(aRetirer)}`}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          >
            <button
              type="button"
              aria-label="Annuler"
              onClick={() => setARetirer(null)}
              className="absolute inset-0 bg-black/25 cursor-default
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
            />
            <div
            /*  §1 (nº 544) — PLUS DE VERRE : l'attribut est retiré, le
                 jeton `carte` de la nº 466 le remplace (la teinte des
                 nº 542-543). `globals.css` intact (règle nº 172), le
                 liseré part avec l'attribut. L'ombre portée est
                 antérieure et reste ; rien d'autre ne bouge. */
            className="relative w-full max-w-[380px] rounded-xl
                         bg-sombre-carte p-5
                         shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            >
              <h2 className="text-[17px] font-bold text-sombre-texte">
                Retirer «&nbsp;{libelleStyle(aRetirer)}&nbsp;»&nbsp;?
              </h2>
              {/* ⚠️ PLUS DE DÉCOMPTE DES PHOTOS PERDUES (passe nº 110).
                  « Ses 14 photos seront perdues, définitivement » : la
                  phrase faisait peur pour rien — le mot à taper suffit
                  déjà, et personne ne tape SUPPRIMER par accident. */}
              <p className="mt-2 text-[13.5px] leading-relaxed text-sombre-texte-doux">
                Pour confirmer, tape{" "}
                <span className="font-bold text-erreur">SUPPRIMER</span>{" "}
                ci-dessous.
              </p>
              <input
                type="text"
                value={saisieSuppression}
                onChange={(evenement) => setSaisieSuppression(evenement.target.value)}
                placeholder="SUPPRIMER"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-label="Tape SUPPRIMER pour confirmer"
                className="mt-4 w-full min-h-[48px] rounded-lg border border-transparent
                           bg-sombre-eleve-clair px-4 text-base tracking-wide text-sombre-texte
                           placeholder:text-sombre-texte-doux/50 outline-none
                           transition-colors focus:bg-sombre-haut"
              />
              {/* RÈGLE DES BOUTONS (passe nº 112) : l'action porte une
                  capsule à sa mesure, le retrait est un texte nu. */}
              <div className="mt-4 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setARetirer(null)}
                  className="px-2 min-h-[44px] text-[14px] font-semibold
                             text-sombre-texte-doux transition-colors
                             hover:text-sombre-texte"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!suppressionConfirmee}
                  onClick={() => retirerLeStyle(aRetirer)}
                  className="inline-flex items-center rounded-full bg-erreur px-6
                             min-h-[46px] font-semibold text-white transition-opacity
                             hover:opacity-90 disabled:cursor-not-allowed
                             disabled:opacity-40"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
