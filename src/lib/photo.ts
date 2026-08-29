/**
 * PRÉPARATION DES PHOTOS AVANT ENVOI (côté navigateur)
 * ----------------------------------------------------
 * Les photos de téléphone pèsent souvent plusieurs Mo : on les
 * réduit ici (1 200 px maximum, format JPEG) AVANT de les envoyer,
 * pour que le site reste rapide — exigence du cahier des charges.
 * La QUALITÉ de cette réduction vit dans `lib/qualite-photo`, avec la
 * mesure qui l'a fixée (§1 nº 723).
 */
import { QUALITE_PHOTO } from "@/lib/qualite-photo";
/**
 * ██ §1 (nº 699) — LE PLAFOND D'ENTRÉE ██
 * Vingt méga-octets : au-delà, aucune photo d'appareil ou de
 * téléphone n'est concernée, et l'on refuse AVANT de décoder. Décoder
 * pour savoir si c'est trop gros, c'est déjà avoir tout chargé en
 * mémoire — sur un téléphone, l'onglet se ferme tout seul.
 */
export const TAILLE_MAX_PHOTO_OCTETS = 20 * 1024 * 1024;

export async function compresserPhoto(
  fichier: File,
  coteMax = 1200,
  /*  §1 (nº 723) — LA QUALITÉ VIENT DE SON ÉCRITURE UNIQUE, où vit
      aussi la mesure qui l'a fixée (lib/qualite-photo). Elle valait
      0,85 en dur ici, et 85 en dur dans l'outil de reprise nº 719 :
      deux copies alignées à la main, donc deux copies qui finissent
      par diverger. */
  qualite = QUALITE_PHOTO
): Promise<Blob> {
  /*  §1 (nº 699) — le plafond, avant toute lecture du contenu. */
  if (fichier.size > TAILLE_MAX_PHOTO_OCTETS) {
    throw new Error(
      `Cette image est trop lourde (${Math.round(fichier.size / 1024 / 1024)} Mo). ` +
        `Le maximum est de ${TAILLE_MAX_PHOTO_OCTETS / 1024 / 1024} Mo.`
    );
  }
  try {
    const image = await createImageBitmap(fichier);
    const echelle = Math.min(1, coteMax / Math.max(image.width, image.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * echelle);
    canvas.height = Math.round(image.height * echelle);
    const contexte = canvas.getContext("2d");
    if (!contexte) throw new Error("toile indisponible");
    contexte.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resoudre) =>
      canvas.toBlob(resoudre, "image/jpeg", qualite)
    );
    if (!blob) throw new Error("encodage impossible");
    return blob;
  } catch {
    /*  ██ §2 (nº 699) — ON REFUSE, ON NE LAISSE PLUS PASSER ██
        CE QUI ÉTAIT ÉCRIT ICI : « Format non lisible par le navigateur :
        on envoie l'original ». L'intention était généreuse — ne pas
        perdre la photo de quelqu'un dont le téléphone produit un
        format exotique. L'effet était l'inverse : un fichier QUE LE
        NAVIGATEUR NE SAIT PAS DÉCODER n'est pas une image, et c'était
        exactement celui-là qui partait tel quel vers le stockage,
        sous un nom en `.jpg`.
        LA RÈGLE JUSTE TIENT EN UNE PHRASE : ce qui ne se décode pas
        comme une image n'est pas envoyé. Le seul cas honnête qu'on
        perd — un format d'image vraiment inconnu du navigateur — se
        règle en enregistrant la photo en JPEG ; le cas malhonnête,
        lui, ne passe plus du tout.
        ⚠️ L'APPELANT SAIT DÉJÀ QUOI EN FAIRE : le formulaire artisan
        entoure cet appel d'un `try/catch` qui remet l'ancienne photo
        et affiche un message. Rien à changer chez lui.
        ⚠️ LE PLAFOND DE TAILLE, LUI, EST LEVÉ AVANT CE `try` : son
        message passe donc tout droit, sans être réécrit ici. */
    throw new Error(
      "Ce fichier n'est pas une image que le navigateur sait lire. " +
        "Enregistre-le en JPG ou en PNG, puis réessaie."
    );
  }
}
