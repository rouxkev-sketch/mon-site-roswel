"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { IconePlus } from "@/components/Icones";
//  L'appareil photo au trait fin marqué d'un plus (nº 111) — l'image
//  officielle du propriétaire, dans son composant à elle.
import { IconeAjouterPhoto } from "@/components/IconeAjouterPhoto";
import { CHAMP } from "@/components/champs-formulaire";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";

/**
 * ██ §1 (nº 685) — LE RECADREUR ARRIVE QUAND ON RECADRE ██
 * ------------------------------------------------------------------
 * CE QUE MESURE LA nº 685 : les quatre pages connectées tirent ~1 600 ko
 * de programme, dont un morceau de 195 ko qui porte ensemble le
 * recadreur, la fenêtre des notifications, le moteur de recherche et le
 * menu du compte — et ce morceau est chargé sur TOUTE page. Or on ne
 * recadre une photo qu'en en déposant une : le recadreur voyageait donc
 * avec des écrans qui ne le montreront jamais.
 * `next/dynamic` le sort du morceau commun ; il n'est demandé qu'au
 * moment où `recadrage` devient vrai, c'est-à-dire au dépôt du fichier.
 * ⚠️ CE QUE ÇA COÛTE, ET JE LE DIS : au TOUT PREMIER recadrage d'un
 * document, le morceau doit arriver — un délai bref avant que la
 * fenêtre ne s'ouvre. Les suivants sont immédiats (le navigateur l'a).
 * ⚠️ `ssr: false` PARCE QUE CE COMPOSANT NE SE REND QUE DANS UN
 * NAVIGATEUR : il lit un `File`, mesure un canevas et pose un portail.
 * Le rendre côté serveur n'aurait aucun sens, et l'y forcer coûterait
 * du HTML pour rien.
 */
const RecadreurPhoto = dynamic(
  () => import("@/components/RecadreurPhoto").then((m) => m.RecadreurPhoto),
  { ssr: false }
);


/**
 * ██ §1 (nº 657) — DIRE QUI L'ON EST : LA PHOTO ET LE NOM ██
 * ==================================================================
 * POURQUOI CE FICHIER EXISTE. La fenêtre « Modifier » du particulier
 * (nº 657) demande EXACTEMENT ce que la création de portfolio demande
 * en tête de son bloc « Profil » : une photo ronde et un nom. La
 * consigne du propriétaire est sans ambiguïté — « LES MÊMES que ceux
 * de la création de portfolio, pas une imitation, le même code
 * réutilisé ». Ces deux morceaux SORTENT donc de `FormulaireFiche`
 * pour vivre ici, et les deux écrans les posent.
 *
 * ⚠️ AUCUNE VALEUR N'A CHANGÉ AU DÉMÉNAGEMENT : le cercle de 104 px,
 * ses pointillés quand il est vide, son bord rouge en faute, le rond
 * « + » de 40 px et son libellé « Choisir la photo » / « Remplacer »,
 * l'appareil photo au rang 28, le refus des formats autres que JPG et
 * PNG — tout est repris au caractère de la nº 112 (et de la nº 119
 * pour le motif du rond « + »). Le champ du nom garde la classe
 * partagée `CHAMP` (nº 266) et son garde-fou de remplissage
 * automatique (lib/champs-sans-remplissage).
 *
 * CE QUI EST DEDANS, ET CE QUI RESTE DEHORS. Ce fichier tient TOUT le
 * chemin de la photo — le sélecteur de fichier caché, le contrôle du
 * format, l'image d'origine gardée pour « Remplacer », et le
 * RECADREUR (`RecadreurPhoto`, déjà partagé). Il ne décide de RIEN :
 * l'appelant reçoit le cadrage validé (un fichier prêt à envoyer et
 * son aperçu) et en fait ce qu'il veut — l'un l'envoie avec une fiche
 * entière, l'autre avec la session seule.
 *
 * ⚠️ IL N'ENVOIE RIEN ET NE LIT AUCUNE BASE : pas un appel réseau ici.
 */

/** LE CADRAGE VALIDÉ — le fichier prêt à envoyer, et l'aperçu local
    à afficher tout de suite. */
export type PhotoCadree = { fichier: File; apercu: string };

/** Le reproche d'un format refusé, écrit UNE fois : les deux écrans
    disent le même mot. */
const FORMAT_REFUSE =
  "Only JPG and PNG images are accepted — this file is another format.";

export function ChampPhotoRonde({
  apercu,
  enFaute = false,
  surPhoto,
  surErreur,
  surRecadrage,
}: {
  /** L'aperçu courant : une adresse `blob:` locale ou une image déjà
      stockée. Vide : le cercle en pointillés et son appareil photo. */
  apercu: string;
  /** Le cercle passe en rouge — l'appelant seul sait si la photo
      manque (elle est obligatoire pour une fiche, facultative pour un
      particulier). */
  enFaute?: boolean;
  /** Le cadrage validé. L'appelant range le fichier et l'aperçu, et
      c'est LUI qui libère l'aperçu précédent s'il était local — il est
      le seul à connaître la valeur d'avant. */
  surPhoto: (photo: PhotoCadree) => void;
  /** Le format refusé (message), ou `null` quand un fichier valable
      efface le reproche précédent. */
  surErreur: (message: string | null) => void;
  /**
   * §1 (nº 657) — LE RECADREUR EST-IL OUVERT ? Facultatif, et il ne
   * sert qu'à une chose : une surface qui écoute Échap doit se taire
   * tant que le recadreur est là — sans quoi UNE seule touche fermerait
   * les deux, et le cadrage en cours serait perdu. C'est la garde de la
   * nº 465, transposée. Le formulaire de portfolio n'écoute pas Échap :
   * il ne passe rien, et rien ne change pour lui.
   */
  surRecadrage?: (ouvert: boolean) => void;
}) {
  const entreeFichier = useRef<HTMLInputElement>(null);
  /** L'image D'ORIGINE : « Remplacer » rouvre le recadreur sur elle,
      pour reprendre le cadrage à volonté. */
  const [original, setOriginal] = useState<File | null>(null);
  /** Le recadreur ouvert — monté à l'ouverture, démonté à la
      fermeture : chaque photo repart d'un cadrage neuf. */
  const [recadrage, setRecadrage] = useState<File | null>(null);

  /** Ouvrir ou refermer le recadreur — et le DIRE, s'il y a quelqu'un
      pour l'entendre. Les trois transitions passent par ici. */
  function poserRecadrage(fichier: File | null) {
    setRecadrage(fichier);
    surRecadrage?.(Boolean(fichier));
  }

  /**
   * ██ §1 (nº 662) — « ANNULER » REMET TOUT À ZÉRO ██
   * ------------------------------------------------------------------
   * LE DÉFAUT DU PROPRIÉTAIRE : choisir une photo, arriver au
   * recadreur, cliquer « Annuler », rouvrir — et retomber DIRECTEMENT
   * sur le recadreur, avec l'ancienne photo.
   * LA CAUSE, EN UNE LIGNE : l'image D'ORIGINE survivait à
   * l'annulation. Le bouton lit `apercu` pour choisir sa route — une
   * photo déjà posée mène à « Remplacer », donc à `rouvrirRecadreur`,
   * qui rouvre sur cet original resté en mémoire. Rien n'était cassé :
   * il manquait un oubli.
   * LA RÈGLE, DÉSORMAIS : fermer le recadreur sans valider EFFACE
   * l'original. La fois suivante repart du CHOIX DE LA PHOTO, ce que
   * le propriétaire demande mot pour mot.
   * ⚠️ CE QUE ÇA NE TOUCHE PAS : un cadrage VALIDÉ garde son original
   * (voir `surValidation`, plus bas) — « Remplacer » peut donc encore
   * reprendre le cadrage d'une photo qu'on vient d'accepter, sans la
   * redemander. C'est l'usage pour lequel `rouvrirRecadreur` existe.
   */
  function annulerLeRecadrage() {
    setOriginal(null);
    poserRecadrage(null);
  }

  function ouvrirChoixPhoto() {
    entreeFichier.current?.click();
  }

  function photoChoisie(evenement: React.ChangeEvent<HTMLInputElement>) {
    const fichier = evenement.target.files?.[0];
    evenement.target.value = ""; // le même fichier peut être rechoisi
    if (!fichier) return;
    // SEULS LES JPG ET PNG passent : tout autre format est refusé,
    // avec un reproche clair — jamais d'échec silencieux au recadrage.
    if (!["image/jpeg", "image/png"].includes(fichier.type)) {
      surErreur(FORMAT_REFUSE);
      return;
    }
    surErreur(null);
    setOriginal(fichier);
    poserRecadrage(fichier);
  }

  /** « Remplacer » : le recadreur rouvre sur l'image d'origine. Faute
      d'original (une photo venue du stockage, jamais recadrée ici), on
      redemande un fichier. */
  function rouvrirRecadreur() {
    if (original) poserRecadrage(original);
    else ouvrirChoixPhoto();
  }

  return (
    <>
      {/* LE LOGO — rond. Le CERCLE ne se dessine que VIDE (pointillés :
          « à remplir ») ou EN FAUTE (rouge) : une fois la photo posée,
          elle se suffit — le cercle qui l'entourait ne servait qu'à
          indiquer l'emplacement (passe nº 112).
          ██ §4 (nº 658) — LES POINTILLÉS S'ÉCLAIRCISSENT, ET LE CHIFFRE
          DIT POURQUOI ILS ÉTAIENT INVISIBLES : ils portaient
          `sombre-bordure` (#2C323B) sur un disque `sombre-eleve`
          (#262C34) — SIX points d'écart sur 255, par canal. On ne les
          voyait qu'en les cherchant, exactement comme le propriétaire
          le dit. Ils prennent `sombre-haut-clair` (#4A525D) : l'écart
          passe à TRENTE-SIX, six fois plus. C'est le dernier barreau
          gris de l'échelle de la nº 466 avant les gris de TEXTE — au
          cran suivant (`texte-doux`, #A8A8B0) l'anneau crierait plus
          fort que la photo qu'il attend.
          ⚠️ AUCUNE COULEUR NOUVELLE : un jeton de l'échelle, déjà
          employé ailleurs (le sélecteur ouvert de « Mon compte »).
          ⚠️ LE ROUGE DE LA FAUTE NE BOUGE PAS : il dit autre chose. */}
      <div className="flex items-center gap-6">
        <span
          className={`flex h-[104px] w-[104px] shrink-0 items-center justify-center
                     overflow-hidden rounded-full bg-sombre-eleve ${
                       enFaute
                         ? "border-2 border-erreur"
                         : apercu
                           ? ""
                           : "border-2 border-dashed border-sombre-haut-clair"
                     }`}
        >
          {apercu ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               aperçu local (URL d'objet) ou image déjà stockée. */
            <img
              src={apercu}
              alt="Your profile photo"
              className="h-full w-full object-cover"
            />
          ) : (
            //  L'appareil photo dit « dépose ici » sans un mot
            //  (passe nº 111). Petit : il indique, il ne remplit pas.
            <IconeAjouterPhoto taille={28} />
          )}
        </span>
        <button
          type="button"
          onClick={() => (apercu ? rouvrirRecadreur() : ouvrirChoixPhoto())}
          //  LE MÊME MOTIF QUE « Ajouter un style » (passe nº 119) :
          //  un ROND « + » et le titre à sa droite — l'ancienne
          //  capsule se lisait comme un bouton d'action alors que
          //  c'est un geste d'AJOUT, exactement comme les styles.
          //  Mêmes proportions, mêmes couleurs, même survol.
          className="group flex w-fit items-center gap-3 text-left"
        >
          {/* ⚠️ LE MÊME SIGNAL AU DOIGT QU'À LA SOURIS (passe
              nº 121) — voir BlocPortfolio : `group-active` double
              `group-hover`, qui ne se déclenche pas au toucher. */}
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                       bg-sombre-eleve text-sombre-texte transition-colors
                       group-hover:bg-sombre-eleve-clair
                       group-active:bg-sombre-eleve-clair"
          >
            <IconePlus taille={18} />
          </span>
          <span
            className="text-[14.5px] font-semibold text-sombre-texte
                       transition-colors group-hover:text-sombre-texte
                       group-active:text-sombre-texte"
          >
            {apercu ? "Replace" : "Choose a photo"}
          </span>
        </button>
      </div>

      {/* L'ENTRÉE DE FICHIER, invisible — elle ne sert qu'à la photo
          ronde : les photos du portfolio ont la leur. */}
      <input
        ref={entreeFichier}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={photoChoisie}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/*  ██ §4 (nº 658) — LE RECADREUR EST MONTÉ DANS LE CORPS DU
           DOCUMENT ██
           ==========================================================
           LE DÉFAUT RELEVÉ : au doigt, choisir une photo depuis la
           fenêtre « Modifier » n'ouvrait pas le recadreur rond de la
           création de portfolio. LA CAUSE, ET C'EST UNE LEÇON DÉJÀ
           ÉCRITE DANS CE SITE (nº 238-§4, règle nº 2 de
           `SurfaceDeVerre`) : le recadreur est `position: fixed`, et
           il vivait À L'INTÉRIEUR de la surface qui l'ouvre — au web
           un panneau `fixed` à défilement propre, au doigt une PAGE
           `fixed` dont la hauteur et le haut sont RECALÉS à chaque
           image sur `visualViewport` (nº 477). Un élément `fixed`
           dans un conteneur qui défile et se recale n'est plus fixe
           par rapport à l'écran : iOS le rattache au conteneur. Le
           recadreur se retrouvait posé n'importe où, coupé, ou
           dessous.
           LE PORTAIL RÈGLE LES DEUX D'UN COUP : la fenêtre est montée
           dans le CORPS du document, plus aucun ancêtre applicatif ne
           peut la couper ni lui voler son repère.
           ⚠️ LE FORMULAIRE DE PORTFOLIO NE CHANGE PAS D'UN PIXEL : il
           monte ce champ dans le flux normal d'une page — le recadreur
           y était DÉJÀ au niveau du document, le portail l'y laisse.
           ⚠️ LES ÉVÉNEMENTS REMONTENT TOUJOURS L'ARBRE REACT (c'est la
           règle des portails), donc jusqu'au `<form>` de ce
           formulaire : vérifié avant de poser le portail, les CINQ
           boutons du recadreur portent `type="button"` — aucun ne peut
           envoyer la fiche.
           ⚠️ `RecadreurPhoto` N'EST PAS TOUCHÉ : c'est son montage qui
           déménage, pas son écriture. `BlocPortfolio`, qui le monte
           lui aussi, garde exactement ce qu'il avait. */}
      {recadrage &&
        typeof document !== "undefined" &&
        createPortal(
          <RecadreurPhoto
            key={`${recadrage.name}-${recadrage.lastModified}`}
            fichier={recadrage}
            forme="rond"
            surValidation={(image) => {
              surPhoto({
                fichier: new File([image], `profil-${Date.now()}.jpg`, {
                  type: "image/jpeg",
                }),
                apercu: URL.createObjectURL(image),
              });
              poserRecadrage(null);
            }}
            surFermeture={annulerLeRecadrage}
          />,
          document.body
        )}
    </>
  );
}

/**
 * LE CHAMP DU NOM — l'`<input>` de la nº 112, et rien de plus.
 * ⚠️ LE REPROCHE RESTE À L'APPELANT : le formulaire de portfolio en
 * affiche DEUX sous ce champ (le manque, et le motif d'un refus de
 * l'administration) ; la fenêtre du particulier n'en a aucun. Un
 * composant qui déciderait pour eux devrait connaître les deux.
 */
export function ChampNomIdentite({
  id,
  valeur,
  indication,
  enFaute = false,
  surChangement,
}: {
  /** L'identifiant du champ — il sert AUSSI de clé au garde-fou de
      remplissage automatique (lib/champs-sans-remplissage). */
  id: string;
  valeur: string;
  /** Ce qui s'écrit en clair dans le champ vide, et se lit aux
      lecteurs d'écran : « Ton nom d'artiste », « Nom du salon »… */
  indication: string;
  enFaute?: boolean;
  surChangement: (valeur: string) => void;
}) {
  return (
    <input
      id={id}
      type="text"
      {...sansRemplissageAuto(id)}
      value={valeur}
      onChange={(evenement) => surChangement(evenement.target.value)}
      placeholder={indication}
      aria-label={indication}
      aria-invalid={enFaute}
      className={`${CHAMP} ${enFaute ? "border-erreur" : "border-transparent"}`}
    />
  );
}
