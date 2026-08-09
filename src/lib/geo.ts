/**
 * DISTANCE ENTRE DEUX POINTS GPS (en kilomètres)
 * ----------------------------------------------
 * Formule de Haversine — la même que la fonction distance_km posée
 * en base (recherche par rayon). Utilisée côté serveur pour lister
 * les communes couvertes par un artisan (fiche, accordéon « Zone »).
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
