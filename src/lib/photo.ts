/**
 * PRÉPARATION DES PHOTOS AVANT ENVOI (côté navigateur)
 * ----------------------------------------------------
 * Les photos de téléphone pèsent souvent plusieurs Mo : on les
 * réduit ici (1 200 px maximum, format JPEG) AVANT de les envoyer,
 * pour que le site reste rapide — exigence du cahier des charges.
 */
export async function compresserPhoto(
  fichier: File,
  coteMax = 1200,
  qualite = 0.85
): Promise<Blob> {
  try {
    const image = await createImageBitmap(fichier);
    const echelle = Math.min(1, coteMax / Math.max(image.width, image.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * echelle);
    canvas.height = Math.round(image.height * echelle);
    const contexte = canvas.getContext("2d");
    if (!contexte) return fichier;
    contexte.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resoudre) =>
      canvas.toBlob(resoudre, "image/jpeg", qualite)
    );
    return blob ?? fichier;
  } catch {
    // Format non lisible par le navigateur : on envoie l'original
    return fichier;
  }
}
