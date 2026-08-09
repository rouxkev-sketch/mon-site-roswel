/**
 * LIENS DE CONTACT DIRECT (téléphone et WhatsApp)
 * -----------------------------------------------
 * Fonctions pures, sans dépendance serveur : utilisées aussi bien
 * par les cartes de résultats (côté navigateur) que par la fiche
 * artisan (côté serveur). Les numéros sont TOUJOURS convertis au
 * format international (+33…) : c'est ce qui fait fonctionner
 * l'appel et WhatsApp sur mobile COMME sur ordinateur.
 */

/** "06 39 98 01 02" ou "+33 6 39…" → chiffres internationaux "33639980102" */
function chiffresInternationaux(numero: string): string {
  const chiffres = numero.replace(/\D/g, "");
  // déjà international saisi "0033…"
  if (chiffres.startsWith("0033")) return chiffres.slice(2);
  // 06… / 07… (10 chiffres français) → indicatif +33 sans le 0
  if (chiffres.startsWith("0")) return `33${chiffres.slice(1)}`;
  // déjà international ("33…", saisi avec +33)
  return chiffres;
}

/** Lien d'appel : "06 39 98 01 02" → "tel:+33639980102" */
export function lienTelephone(numero: string): string {
  return `tel:+${chiffresInternationaux(numero)}`;
}

/** "0639980102" ou "06 39 98 01 02" → lien WhatsApp international */
export function lienWhatsApp(numero: string, texte?: string): string {
  const parametre = texte ? `?text=${encodeURIComponent(texte)}` : "";
  return `https://wa.me/${chiffresInternationaux(numero)}${parametre}`;
}

/**
 * Le lien vers les avis Google de l'artisan.
 * Avec un identifiant de fiche Google (place_id) : ouverture directe
 * de ses avis. Sans (fiches de démonstration) : recherche Google de
 * son nom — le lien reste toujours cliquable, jamais grisé.
 */
export function lienAvisGoogle(artisan: {
  place_id_google: string | null;
  nom_affiche: string;
}): string {
  if (artisan.place_id_google) {
    return `https://search.google.com/local/reviews?placeid=${encodeURIComponent(
      artisan.place_id_google
    )}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${artisan.nom_affiche} avis`
  )}`;
}
