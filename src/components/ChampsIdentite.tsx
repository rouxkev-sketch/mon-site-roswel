"use client";

import { useRef, useState } from "react";
import { IconePlus } from "@/components/Icones";
//  L'appareil photo au trait fin marqué d'un plus (nº 111) — l'image
//  officielle du propriétaire, dans son composant à elle.
import { IconeAjouterPhoto } from "@/components/IconeAjouterPhoto";
import { RecadreurPhoto } from "@/components/RecadreurPhoto";
import { CHAMP } from "@/components/champs-formulaire";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";

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
  "Seules les images JPG et PNG sont acceptées — ce fichier est d'un autre format.";

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
          indiquer l'emplacement (passe nº 112). */}
      <div className="flex items-center gap-6">
        <span
          className={`flex h-[104px] w-[104px] shrink-0 items-center justify-center
                     overflow-hidden rounded-full bg-sombre-eleve ${
                       enFaute
                         ? "border-2 border-erreur"
                         : apercu
                           ? ""
                           : "border-2 border-dashed border-sombre-bordure"
                     }`}
        >
          {apercu ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               aperçu local (URL d'objet) ou image déjà stockée. */
            <img
              src={apercu}
              alt="Ta photo de profil"
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
            {apercu ? "Remplacer" : "Choisir la photo"}
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

      {/* LE RECADREUR — la forme RONDE, et le cadrage validé rendu à
          l'appelant sous la forme d'un fichier prêt à envoyer. */}
      {recadrage && (
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
          surFermeture={() => poserRecadrage(null)}
        />
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
