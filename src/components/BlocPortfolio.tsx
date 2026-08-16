"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { entreesExplorer, libelleStyle } from "@/config/tatouage";
import { GrilleGalerie } from "@/components/GrilleGalerie";
import {
  IconeChevronBas,
  IconeCocheListe,
  IconeCroix,
  IconePlus,
} from "@/components/Icones";
import { IconeAjouterPhoto } from "@/components/IconeAjouterPhoto";
import { RecadreurPhoto } from "@/components/RecadreurPhoto";
import { texteErreur } from "@/lib/erreurs-formulaire";
import { OngletsLigne } from "@/components/OngletsLigne";
import {
  NATURES_PHOTO,
  PLAFOND_GALERIE,
  RENDUS_PHOTO,
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
  const entreeFichier = useRef<HTMLInputElement>(null);
  /** ⚠️ LA PRÉPARATION DES PHOTOS (passe nº 127) — LE VRAI TEMPS MORT.
      Entre le « Valider » de la galerie du téléphone et l'arrivée des
      fichiers dans la page, c'est le NAVIGATEUR qui travaille : il doit
      sortir chaque photo de la photothèque et la mettre à disposition.
      Ce travail-là bloque le fil principal, et il est PROPORTIONNEL au
      nombre de photos — mesuré sur une page nue, sans une ligne de ce
      site : 1,2 s pour une photo, 5,4 s pour cinq, 29,5 s pour vingt
      (téléphone simulé). Pendant ce temps, rien ne peut être repeint :
      l'écran reste tel qu'il était, et tout appui semble sans effet.
      D'où ce drapeau, et surtout LE MOMENT où on le lève : JUSTE AVANT
      d'ouvrir la galerie, pas au retour. La phrase est donc PEINTE
      pendant que la galerie s'ouvre — elle est déjà à l'écran quand
      celle-ci se referme, et elle y reste, visible, pendant tout le
      gel. Levée après coup, elle n'aurait jamais pu s'afficher. */
  const [preparation, setPreparation] = useState(false);

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
  const renduActif =
    renduOuvert ??
    (styleActif ? ouvertureSur(styleActif, natureActive) : RENDUS_PHOTO[0].slug);

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
    setFenetreStyles(false);
    setFamilleDepliee(null);
    basculerStyle(style);
  }

  /** CHANGER DE NATURE (premier niveau) REPOSE LE RENDU SUR SA
      PREMIÈRE POSITION : « Réalisation · Noir et gris », puis « Flash ·
      Noir et gris ». Une galerie reste toujours ouverte — garder le
      rendu d'avant ferait regarder deux jeux de photos sans le dire. */
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

  /** OUVRIR LA GALERIE DU TÉLÉPHONE — et le dire AVANT de l'ouvrir.
      L'ordre compte : la phrase d'attente doit être peinte pendant que
      la galerie s'affiche, sinon elle n'a plus aucune chance de l'être
      (voir la note de `preparation`). */
  function ouvrirLeSelecteur() {
    setErreurFichier(null);
    setPreparation(true);
    entreeFichier.current?.click();
  }

  function fichierChoisi(evenement: React.ChangeEvent<HTMLInputElement>) {
    setPreparation(false);
    const fichiers = Array.from(evenement.target.files ?? []);
    evenement.target.value = "";
    if (fichiers.length === 0) return;
    demarrerDepot(fichiers);
  }

  /** LE FILET DE SÉCURITÉ de la phrase d'attente : tous les navigateurs
      ne signalent pas qu'on a refermé la galerie sans rien choisir. Le
      retour du focus sur la page le dit aussi bien — passé un court
      délai, pour ne pas prendre le focus de l'ouverture elle-même. */
  useEffect(() => {
    if (!preparation) return;
    const entree = entreeFichier.current;
    const retirer = () => setPreparation(false);
    //  `cancel` : la galerie refermée sans rien choisir. React ne le
    //  déclare pas dans ses types — on l'écoute donc à la main.
    entree?.addEventListener("cancel", retirer);
    let arme = false;
    const minuteur = setTimeout(() => {
      arme = true;
    }, 800);
    const surRetour = () => {
      if (arme) retirer();
    };
    window.addEventListener("focus", surRetour);
    return () => {
      clearTimeout(minuteur);
      entree?.removeEventListener("cancel", retirer);
      window.removeEventListener("focus", surRetour);
    };
  }, [preparation]);

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
  function ligneDeStyle(style: { slug: string; label: string }, retrait: boolean) {
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
                         : "text-sombre-texte hover:bg-sombre-eleve"
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
                     group-hover:bg-sombre-eleve-clair group-hover:text-primaire
                     group-active:bg-sombre-eleve-clair group-active:text-primaire"
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
                     group-hover:text-primaire group-active:text-primaire"
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
                  className={`inline-flex items-center rounded-full
                             px-3.5 min-h-[34px] text-[13.5px] font-semibold
                             transition-colors ${
                               ouvert
                                 ? "bg-primaire text-white"
                                 : "bg-sombre-eleve text-sombre-texte hover:bg-sombre-eleve-clair"
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
              <IconeCroix taille={16} />
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

          {/* ---------- 2) LE RENDU — DEUX RECTANGLES ----------
              « Noir et gris » à gauche, « Couleur » à droite, chacun
              avec SON nombre de photos. C'est LE SEUL endroit du bloc
              où un nombre s'affiche : ici, il est utile — il dit ce
              qu'il y a dans chacune des deux galeries de la nature
              choisie. */}
          {natureActive && (
            <div className="mt-3 grid grid-cols-2 gap-2">
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
                    /*  §2-a (nº 309) — `relative` : c'est ce qui porte le
                        soulignement rose de l'actif, posé DANS le
                        rectangle (voir plus bas). */
                    className={`relative overflow-hidden rounded-lg px-3 py-2.5
                               text-left transition-colors ${
                                 actif
                                   ? "bg-sombre-eleve-clair"
                                   : "bg-sombre-eleve hover:bg-sombre-eleve-clair"
                               }`}
                  >
                    {/*  §2-a (nº 309) — LE TITRE A QUITTÉ LE ROSE POUR
                         LE BLANC : le rose ne vit plus que dans le
                         trait, où il dit « c'est ici » sans se
                         disputer la lecture avec le texte.
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
                      className={`mt-0.5 block text-[12.5px] ${
                        actif ? "text-white" : "text-sombre-texte-doux"
                      }`}
                    >
                      {nombre}/{PLAFOND_GALERIE} photos
                    </span>
                    {/*  §2-a (nº 309) — LE TRAIT ROSE, SUR L'ACTIF ET
                         SUR LUI SEUL. Léger : 2 px.
                         §4 (nº 312) — ANNULATION DE LA nº 311, SUR
                         CONSIGNE : IL REVIENT EN BAS. Elle l'avait fait
                         passer au bord GAUCHE, vertical ; le
                         propriétaire le veut comme à la nº 309 —
                         HORIZONTAL, le long du BORD BAS de l'encadré,
                         d'un bord à l'autre, sous le seul bouton
                         choisi. C'est le procédé des onglets de la
                         ligne au-dessus (`OngletsLigne` : trait rose
                         sous l'onglet choisi) — on ne réinvente pas un
                         marqueur, on reprend celui que la page emploie
                         déjà.
                         ⚠️ LE RESTE DE LA nº 311 EST CONSERVÉ : les
                         quatre états de couleur ne bougent pas (voir
                         le titre et le sous-titre, plus haut). */}
                    {actif && (
                      <span
                        aria-hidden="true"
                        data-soulignement-rendu=""
                        className="absolute inset-x-0 bottom-0 h-[2px] bg-primaire"
                      />
                    )}
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
              {/* ⚠️ L'ATTENTE SE DIT DANS LE FORMULAIRE (passe nº 127),
                  jamais dans la fenêtre de recadrage. Elle couvre le
                  seul moment vraiment long : celui où le navigateur
                  sort les photos de la photothèque. Une ligne, à la
                  place exacte du message d'erreur — en gris, parce
                  qu'elle n'annonce rien de fâcheux. */}
              {preparation && (
                <p
                  role="status"
                  className="mt-2 text-[13px] text-sombre-texte-doux"
                >
                  Préparation des photos…
                </p>
              )}
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
          et pose le badge. Voile, croix et Échap referment. ------- */}
      {fenetreStyles &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ajouter un style"
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
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
              data-verre-fenetre=""
              className="relative flex w-full max-w-[420px]
                         max-h-[min(80dvh,640px)] flex-col overflow-hidden
                         rounded-xl
                         shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            >
              {/*  §1-b (nº 304) — UNE LIGNE DE SÉPARATION SOUS LE
                   TITRE : le filet du site (`border-sombre-bordure`),
                   celui des sections de fiche — aucune valeur neuve.
                   Le `pb-1` passe à `pb-3` pour que le filet ne colle
                   pas au mot. */}
              <div className="flex items-center justify-between border-b border-sombre-bordure pl-5 pr-3 pt-3 pb-3">
                <h2 className="text-[16px] font-bold text-sombre-texte">
                  Ajouter un style
                </h2>
                <button
                  type="button"
                  onClick={fermerFenetreStyles}
                  aria-label="Fermer"
                  className="flex h-9 w-9 items-center justify-center rounded-full
                             text-sombre-texte-doux transition-colors
                             hover:bg-sombre-eleve hover:text-sombre-texte"
                >
                  <IconeCroix taille={16} />
                </button>
              </div>
              <ul
                aria-label="Les styles, de A à Z"
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain
                           defilement-visible pb-2"
              >
                {entreesExplorer().map((entree) => {
                  if (entree.genre === "famille") {
                    const depliee = familleDepliee === entree.slug;
                    return (
                      <li key={entree.slug}>
                        {/* LA PORTE DE LA FAMILLE — sa flèche est
                            GRANDE et pleine couleur : impossible de
                            la manquer, c'est elle qui dit « il y a
                            onze styles là-dessous ». */}
                        <button
                          type="button"
                          aria-expanded={depliee}
                          onClick={() =>
                            setFamilleDepliee(depliee ? null : entree.slug)
                          }
                          className="flex w-full items-center justify-between gap-3
                                     px-5 min-h-[52px] text-left text-[15px]
                                     font-semibold text-sombre-texte
                                     transition-colors hover:bg-sombre-eleve"
                        >
                          {entree.label}
                          {/* ⚠️ BAS QUAND C'EST FERMÉ, HAUT QUAND
                              C'EST OUVERT (passe nº 117, point 10).
                              Elle pointait vers la DROITE fermée — le
                              signe d'un sous-menu qui s'ouvre À CÔTÉ,
                              alors que les onze styles se déplient
                              DESSOUS. Le chevron dit maintenant ce que
                              le clic fait : « ça descend », puis « ça
                              se replie ». */}
                          {/*  §1-c (nº 304) — LE CHEVRON EST ROSE DANS
                               LES DEUX ÉTATS, comme dans le menu du
                               moteur de recherche (MenuDeroulant : « la
                               flèche de la porte est ROSE, pointée en
                               bas comme en haut — c'est elle, et elle
                               seule, qui dit ceci s'ouvre au lieu de se
                               choisir »). Il n'était rose qu'OUVERT :
                               fermé, plus rien ne distinguait la porte
                               d'un style. */}
                          <IconeChevronBas
                            taille={20}
                            classe={`shrink-0 transition-transform text-primaire ${
                              depliee ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {depliee && (
                          <ul aria-label={`Les styles — ${entree.label}`}>
                            {entree.styles.map((style) =>
                              ligneDeStyle(style, true)
                            )}
                          </ul>
                        )}
                      </li>
                    );
                  }
                  return ligneDeStyle(entree, false);
                })}

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
              <div className="relative z-10 shrink-0 bg-sombre-eleve px-4 py-3">
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
                      placeholder={"Un style manque ?"}
                      aria-label="Le style à suggérer"
                      aria-invalid={refusSuggestion ? true : undefined}
                      //  Le bandeau est déjà un cran plus clair : le
                      //  champ monte d'un niveau avec lui, et le focus
                      //  éclaircit encore d'un cran (la charte, sans
                      //  contour ni rose).
                      className={`w-full h-11 rounded-lg bg-sombre-eleve-clair pl-3
                                 text-[15px] text-sombre-texte
                                 placeholder:text-sombre-texte-doux/70
                                 outline-none transition-colors
                                 focus:bg-sombre-bordure ${
                                   suggestion ? "pr-10" : "pr-3"
                                 }`}
                    />
                    {/* LA CROIX D'EFFACEMENT — le motif des champs de
                        recherche du formulaire (voir
                        ChampLocalisation) : dans le champ, à droite,
                        seulement quand il y a quelque chose à
                        effacer. À la souris, l'appui est neutralisé
                        pour que le champ garde le focus. */}
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
                    //  éteinte ; dès deux caractères, elle passe en
                    //  ROSE PLEIN — impossible de la croire bloquée.
                    className="shrink-0 h-11 rounded-full px-5 text-[14px]
                               font-semibold transition-colors
                               bg-primaire text-white hover:opacity-90
                               active:opacity-90
                               disabled:bg-sombre-eleve-clair
                               disabled:text-sombre-texte-doux
                               disabled:opacity-100 disabled:hover:opacity-100"
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
            </div>
          </div>,
          document.body
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
              data-verre-fenetre=""
            className="relative w-full max-w-[380px] rounded-xl p-5
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
              data-verre-fenetre=""
            className="relative w-full max-w-[380px] rounded-xl p-5
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
