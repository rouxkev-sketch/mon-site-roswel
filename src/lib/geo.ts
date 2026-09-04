/**
 * DISTANCE ENTRE DEUX POINTS GPS (en kilomètres)
 * ----------------------------------------------
 * Formule de Haversine — la même que la fonction `distance_km` posée
 * en base.
 * ⚠️ CE QU'ELLE SERT AUJOURD'HUI (nº 765) : le CLASSEMENT PAR
 * DISTANCE du catalogue des tatoueurs (`lib/artists`, trois appels).
 * Elle listait autrefois les communes couvertes par un artisan, dans
 * l'accordéon « Zone » de sa fiche — cet écran est parti à la nº 760,
 * et la table `communes` avec la nº 764.
 */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const rayonTerre = 6371;
  const radians = (degres: number) => (degres * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * rayonTerre * Math.asin(Math.sqrt(a));
}

/**
 * ██ nº 806 — LES MILES À L'ÉCRAN, LES KILOMÈTRES EN BASE ██
 * ------------------------------------------------------------
 * Le site parle en miles (paliers `RAYONS_TATOUAGE`, adresse
 * `?rayon=25`, affichage « 25 mi ») ; la base, elle, ne connaît que
 * le kilomètre : `yf_distance_km`, `p_rayon_km`, `modes_exercice.
 * rayon_km` (contrainte nº 40). AUCUN SQL n'a changé : la conversion
 * se fait ICI, à la frontière, aux deux seuls endroits où un rayon
 * quitte le site pour la base (`rechercheEnBase`) ou rejoint la
 * formule de Haversine du chemin de secours (`filtrer`). Le mile
 * international : 1 609,344 m exactement.
 */
export const KM_PAR_MILE = 1.609344;

export function milesEnKm(miles: number): number {
  return miles * KM_PAR_MILE;
}
