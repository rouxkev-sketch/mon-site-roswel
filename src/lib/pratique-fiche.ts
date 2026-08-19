import { rendusDuPortfolio } from "@/lib/photos-tatoueur";
import { FILTRES_TATOUAGE } from "@/config/tatouage";

/**
 * §2 (nº 388) — L'ORDRE D'UN GROUPE EST CELUI DE LA CHARTE, JAMAIS
 * CELUI DES CASES COCHÉES.
 * ==================================================================
 * LE DÉFAUT : « Bodysuit » passait devant « Grandes pièces » sur
 * certaines fiches. L'ordre venait du TABLEAU ENREGISTRÉ EN BASE,
 * c'est-à-dire de l'ordre dans lequel le tatoueur avait coché ses
 * cases — il changeait donc d'une fiche à l'autre, alors que le
 * formulaire, lui, affiche toujours l'ordre déclaré dans
 * `FILTRES_TATOUAGE`.
 * LE REMÈDE, À LA SOURCE : chaque groupe est rangé selon la position
 * de ses valeurs DANS LA CHARTE. Le formulaire et la fiche lisent
 * ainsi le même ordre par construction, et il suffit de déplacer une
 * ligne dans `FILTRES_TATOUAGE` pour le changer partout.
 * ⚠️ UNE VALEUR INCONNUE DE LA CHARTE (un vieux slug retiré d'une
 * migration) part en fin de groupe plutôt que de disparaître : on
 * n'efface pas ce qu'un tatoueur a déclaré.
 */
function rangesCommeLaCharte(groupe: string, valeurs: string[]): string[] {
  const declares =
    FILTRES_TATOUAGE.find((famille) => famille.groupe === groupe)?.options ?? [];
  const rang = new Map<string, number>(
    declares.map((option, i) => [String(option.slug), i])
  );
  return valeurs
    .slice()
    .sort(
      (a, b) =>
        (rang.get(a) ?? Number.MAX_SAFE_INTEGER) -
        (rang.get(b) ?? Number.MAX_SAFE_INTEGER)
    );
}

/**
 * §2 (nº 315) — LA SECTION « PRATIQUE » D'UNE FICHE
 * ==================================================================
 * CE QU'IL Y AVAIT : quatre titres en capitales — RENDU, TECHNIQUE,
 * TYPES DE PROJETS, BESOINS PARTICULIERS — chacun au-dessus d'une
 * poignée de mots. Le propriétaire l'a tranché : c'était plus de
 * structure que d'information. Les quatre fusionnent sous UN SEUL
 * titre, « PRATIQUE », et toutes leurs capsules se rangent ensemble :
 *
 *     PRATIQUE
 *     Couleur · Machine · Grandes pièces · Bodysuit · Cover · Cicatrice
 *
 * ⚠️ POURQUOI CETTE RÈGLE VIT DANS UNE FONCTION, ET PAS DANS LE
 * COMPOSANT : parce que L'ORDRE EST LA RÈGLE. Le propriétaire l'a
 * posé comme une exigence — « un ordre fixe, toujours le même :
 * d'abord le rendu, puis la technique, puis les types de projets,
 * puis les besoins particuliers. Sans cet ordre, les capsules
 * changeraient de place d'une fiche à l'autre. » Une règle qu'aucun
 * banc ne peut EXÉCUTER est une règle qui finit par dériver ; celle-ci
 * s'éprouve sur trois cas — une capsule, six, aucune — sans ouvrir un
 * navigateur.
 *
 * ⚠️ LE RENDU N'EST DÉCLARÉ PAR PERSONNE : c'est le seul des quatre
 * que le tatoueur ne coche pas. Il se DÉDUIT des tags des photos
 * déposées (`rendusDuPortfolio`), exactement comme le filtre du moteur
 * le lit. Un portfolio entièrement en noir et gris n'apporte donc
 * qu'une capsule ; une fiche dont aucune photo n'est taguée (avant la
 * migration nº 31) n'en apporte aucune.
 *
 * ⚠️ RIEN DE DÉCLARÉ, RIEN D'AFFICHÉ : la liste vide est un cas
 * NORMAL, et l'appelant ne rend alors AUCUNE section — pas de titre
 * orphelin. C'est pourquoi cette fonction rend un tableau vide plutôt
 * que de se plaindre.
 */
export function capsulesPratiques(fiche: {
  galerie?: Array<{ rendu: string | null }> | null;
  filtres_technique?: string[] | null;
  filtres_composition?: string[] | null;
  filtres_besoins?: string[] | null;
}): string[] {
  return [
    ...rendusDuPortfolio(fiche.galerie),
    ...rangesCommeLaCharte("technique", fiche.filtres_technique ?? []),
    ...rangesCommeLaCharte("composition", fiche.filtres_composition ?? []),
    ...rangesCommeLaCharte("besoins", fiche.filtres_besoins ?? []),
  ];
}
