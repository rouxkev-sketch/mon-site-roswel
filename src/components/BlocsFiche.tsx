import { libelleTypeFiche } from "@/config/tatouage";
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
 * · ARTISTE → UN SEUL MOT : « Artiste » (nº 228-§2). Ni lieu, ni
 *   rôle à cet endroit — ils sont DESCENDUS dans le bloc des lieux,
 *   devant chaque adresse (« En salon · RÉSIDENT : Rue des Verriers ·
 *   Lyon, France »), là où ils désignent quelque chose de précis. Sous
 *   le nom, ils répétaient une information que la fiche donne mieux
 *   plus bas.
 * · SALON / STUDIO → « Salon » ou « Studio », quel que soit le nombre
 *   d'adresses : elles se lisent dans le bloc qui leur est réservé.
 */
export function sousLeNom(tatoueur: Tatoueur): string {
  if (tatoueur.type_fiche === "artiste") {
    //  ⚠️ `sousTitreArtiste` n'est plus appelée ICI, et c'est le §2 :
    //  elle reste écrite dans lib/modes-exercice (l'espace tatoueur
    //  s'en sert pour son aperçu de profil), mais la FICHE PUBLIQUE
    //  ne montre plus que le mot.
    return libelleTypeFiche("artiste", tatoueur.etablissement);
  }
  return libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement);
}
