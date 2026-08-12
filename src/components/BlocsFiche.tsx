import { libelleTypeFiche } from "@/config/tatouage";
import { sousTitreArtiste } from "@/lib/modes-exercice";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * CE QUI S'ÉCRIT SOUS LE NOM D'UNE FICHE
 * ==================================================================
 * ⚠️ CE FICHIER A ÉTÉ VIDÉ DE SES TROIS BLOCS (passe nº 222).
 * `LignesModes`, `BlocAdresses` et `BlocEquipe` y vivaient ; la refonte
 * de l'onglet « Profil » les remplace par `BlocAdressesFiche` et
 * `BlocProfilsArtiste` (src/components/BlocLieux.tsx), qui montrent la
 * même chose autrement — une photo, une étiquette grise, une valeur
 * blanche, aucun encadré. Les anciens ont été SUPPRIMÉS, pas laissés
 * de côté : deux façons d'afficher une adresse finissent toujours par
 * diverger, et c'est exactement ce que cette passe corrige.
 *
 * Il ne reste donc que la ligne du sous-titre, partagée par la page de
 * fiche et par la fenêtre superposée — comme tout le reste, via
 * `ContenuFiche`.
 */

/**
 * CE QUI S'ÉCRIT SOUS LE NOM.
 * · ARTISTE → UN SEUL LIEU, UN SEUL RÔLE (nº 222-§1f) : « En salon ·
 *   Résident », « En studio · Fondateur », « À domicile ». La règle
 *   vit dans `sousTitreArtiste` — l'inventaire de tous les profils,
 *   lui, a sa place plus bas dans la fiche.
 * · SALON / STUDIO → « Salon » ou « Studio », quel que soit le nombre
 *   d'adresses : elles se lisent dans le bloc qui leur est réservé.
 */
export function sousLeNom(tatoueur: Tatoueur): string {
  if (tatoueur.type_fiche === "artiste") {
    return sousTitreArtiste(tatoueur.modes);
  }
  return libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement);
}
