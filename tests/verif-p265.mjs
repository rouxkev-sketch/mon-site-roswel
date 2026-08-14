/**
 * BANC DE LA PASSE Nº 265
 * ==================================================================
 * §1 renommer un salon ou un studio : le nom ne passe plus par le
 *    brouillon — il s'écrit sur la ligne, donc la recherche de
 *    rattachement (qui lit `tatoueurs.nom`) le trouve immédiatement,
 *    la fiche publique dit la même chose, et rien ne peut le ramener
 *    en arrière ; migration de réparation fournie ;
 * §2 supprimer un mode d'exercice s'enregistre : l'état écrit est
 *    EXACTEMENT celui de l'écran ;
 * §3 un rôle retiré est retiré — même cause que le §2, prouvée sur
 *    l'algorithme extrait du fichier livré.
 *
 * ⚠️ LA BASE EST HORS DE PORTÉE (Supabase n'est pas dans l'allowlist
 * du réseau, et le formulaire exige une session) : les trois
 * scénarios de bout en bout — renommer, recharger, revérifier — sont
 * déclarés NON JOUÉS, sans maquillage. La cause de chaque défaut est
 * donc NOMMÉE ET PROUVÉE PAR LE CODE : les assertions ci-dessous
 * lisent les fichiers livrés, et la logique de suppression est
 * REJOUÉE — l'expression même est extraite de `enregistrer-exercice`
 * puis évaluée sur les trois cas du relevé.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 */
import { bilan, lire, nonJoue, titre, verif } from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const exercice = lire("src/lib/enregistrer-exercice.ts");
const exerciceNu = sansNotes(exercice);
const formulaire = lire("src/components/FormulaireFiche.tsx");
const formulaireNu = sansNotes(formulaire);
const recherche = sansNotes(lire("src/app/api/tatoueur/recherche-fiches/route.ts"));
const adminFiches = sansNotes(
  lire("src/app/api/admin/yokofolio/fiches/route.ts")
);
const modesLib = sansNotes(lire("src/lib/modes-exercice.ts"));
const blocModes = sansNotes(lire("src/components/BlocModesExercice.tsx"));
const migration = lire("supabase/yokofolio-nom-hors-brouillon.sql");

/* ==================================================================
 * §1 — LE NOM : LA CAUSE, PUIS LE REMÈDE
 * ================================================================== */
titre("§1 — la cause nommée : deux vérités pour un même nom");
{
  verif(
    "LA PREUVE 1/3 — la recherche de rattachement lit la COLONNE publique `tatoueurs.nom`",
    /\.from\("tatoueurs"\)/.test(recherche) &&
      /\.ilike\("nom", `%\$\{saisie\}%`\)/.test(recherche) &&
      /\.eq\("publie", true\)/.test(recherche) &&
      //  … et rien du brouillon n'y entre : la recherche ne le lit pas.
      !/brouillon/.test(recherche.replace(/\/\/.*/g, ""))
  );
  verif(
    "LA PREUVE 2/3 — l'espace du propriétaire, lui, affiche la ligne RECOUVERTE du brouillon",
    /const source = \{\s*\.\.\.ligne,\s*\.\.\.\(\(ligne\.brouillon as Record<string, unknown>\) \?\? \{\}\),\s*\}/.test(
      formulaireNu
    ) && /setNom\(String\(source\.nom \?\? ""\)\)/.test(formulaireNu)
  );
  verif(
    "LA PREUVE 3/3 — la validation recopie le brouillon ENTIER dans les colonnes publiques",
    //  C'est ce qui rend un brouillon périmé capable de ramener un
    //  ancien nom : il est recopié tel quel, puis vidé.
    /valeurs = \{\s*\.\.\.\(brouillon \?\? \{\}\),\s*publie: true,/.test(
      adminFiches
    ) && /brouillon: null,/.test(adminFiches)
  );
}

titre("§1 — le remède : l'identité s'écrit sur la ligne, jamais en brouillon");
{
  verif(
    "le nom est RETIRÉ du brouillon et posé à part",
    /const champsIdentite: Record<string, unknown> = \{ nom: ligne\.nom \};\s*delete champs\.nom;/.test(
      formulaireNu
    )
  );
  verif(
    "CAS B (fiche en ligne) : le brouillon ET l'identité sur la ligne, dans le même envoi",
    /maj = \{\s*brouillon: champs,\s*\.\.\.champsIdentite,\s*statut: "en_attente",/.test(
      formulaireNu
    )
  );
  verif(
    "CAS A (fiche pas encore en ligne) : rien ne change — l'identité est réinjectée",
    /maj = \{\s*\.\.\.champs,\s*\.\.\.champsIdentite,\s*statut: "en_attente",/.test(
      formulaireNu
    )
  );
  verif(
    "la fiche part quand même en relecture : le statut ne change pas de règle",
    (formulaireNu.match(/statut: "en_attente"/g) ?? []).length >= 2
  );
  verif(
    "plus AUCUN chemin ne met le nom dans le brouillon",
    //  Le seul `brouillon:` d'écriture est `brouillon: champs` (dont
    //  `nom` vient d'être retiré) et `brouillon: null`.
    !/brouillon: \{[^}]*nom/.test(formulaireNu) &&
      /brouillon: champs,/.test(formulaireNu)
  );
}

titre("§1 — la migration de réparation (à passer par le propriétaire)");
{
  verif(
    "le fichier existe et porte le nom annoncé",
    migration.length > 0 &&
      /YOKOFOLIO — LE NOM SORT DU BROUILLON \(passe nº 265/.test(migration)
  );
  verif(
    "elle APPLIQUE le nom resté dans un brouillon — la modification n'est pas perdue",
    /update public\.tatoueurs\s*set nom = btrim\(brouillon ->> 'nom'\)/.test(
      migration
    ) &&
      /jsonb_typeof\(brouillon -> 'nom'\) = 'string'/.test(migration) &&
      /btrim\(brouillon ->> 'nom'\) <> ''/.test(migration)
  );
  verif(
    "puis elle RETIRE la clé de tous les brouillons — plus aucun retour en arrière",
    /set brouillon = brouillon - 'nom'/.test(migration) &&
      /where brouillon is not null\s*and brouillon \? 'nom'/.test(migration)
  );
  verif(
    "elle ne publie ni ne valide rien (ni `publie`, ni `statut` touchés)",
    !/set publie/.test(migration) && !/set statut/.test(migration)
  );
}

/* ==================================================================
 * §2 et §3 — LA CAUSE COMMUNE, ET L'ALGORITHME REJOUÉ
 * ================================================================== */
titre("§2/§3 — la cause commune : un encadré vidé gardait sa ligne");
{
  verif(
    "LA PREUVE 1/2 — la croix VIDE l'encadré en lui laissant son identifiant",
    /modeVierge\(genre, mode\.cle, mode\.id\)/.test(blocModes) &&
      /function modeVierge\(\s*genre: GenreMode,\s*cle\?: string,\s*id\?: string \| null\s*\)/.test(
        blocModes
      )
  );
  verif(
    "LA PREUVE 2/2 — un encadré vide est SAUTÉ par la boucle d'écriture",
    /if \(!mode\.genre \|\| modeVide\(mode\)\) continue;/.test(exerciceNu) &&
      /export function modeVide\(mode: ModeEnSaisie\): boolean/.test(modesLib)
  );
  verif(
    "LE REMÈDE — ne protège de la suppression que ce qui sera RÉÉCRIT",
    /const gardes = modes\s*\.filter\(\(mode\) => mode\.genre && !modeVide\(mode\)\)\s*\.map\(\(mode\) => mode\.id\)\s*\.filter\(Boolean\) as string\[\];/.test(
      exerciceNu
    )
  );
  verif(
    "la suppression est désormais LUE : une suppression refusée ne passe plus inaperçue",
    /const effacement = await \(gardes\.length > 0/.test(exerciceNu) &&
      /if \(effacement\.error\) throw new Error\(effacement\.error\.message\);/.test(
        exerciceNu
      )
  );
  verif(
    "un studio VIDÉ part aussi (même défaut, même règle)",
    /!studios\.some\(\(studio\) => studio\.id === id && studio\.lieu\)/.test(
      formulaireNu
    ) && /if \(!studio\.lieu\) continue;/.test(exerciceNu)
  );
}

titre("§2/§3 — l'algorithme EXTRAIT du fichier livré, rejoué sur le relevé");
{
  //  ⚠️ ON NE RÉÉCRIT RIEN : l'expression de `gardes` est LUE dans
  //  enregistrer-exercice.ts, et évaluée telle quelle. Si elle change
  //  un jour, ce banc joue la nouvelle.
  const source = exerciceNu
    .match(
      /const gardes = modes[\s\S]*?\.filter\(Boolean\) as string\[\];/
    )?.[0]
    ?.replace(/ as string\[\]/, "");
  const modeVide = (mode) =>
    !mode.salon && !mode.lieu && !mode.debut_le && !mode.fin_le && mode.rayonKm == null;
  const calculerGardes = new Function(
    "modes",
    "modeVide",
    `${source} return gardes;`
  );
  //  LE RELEVÉ, TRANSPOSÉ EN DONNÉES :
  //   · « à domicile » chargé puis VIDÉ par la croix (§2) : il garde
  //     son identifiant, mais plus rien dedans ;
  //   · « salon · artiste résident » chargé puis VIDÉ (§3) ;
  //   · « salon · fondateur » ajouté ensuite, avec un lieu ;
  //   · un onglet ouvert par curiosité, jamais rempli (sans id).
  const ecran = [
    { id: "id-domicile", genre: "domicile", salon: null, lieu: null, rayonKm: null },
    { id: "id-resident", genre: "salon", salon: null, lieu: null, rayonKm: null },
    {
      id: "id-fondateur",
      genre: "salon",
      salon: null,
      lieu: { intitule: "Lyon" },
      rayonKm: null,
    },
    { id: null, genre: "guest", salon: null, lieu: null, rayonKm: null },
  ];
  const gardes = calculerGardes(ecran, modeVide);
  verif(
    "§2 — la ligne du mode VIDÉ n'est plus protégée : elle sera supprimée",
    !gardes.includes("id-domicile"),
    `gardes = [${gardes.join(", ")}]`
  );
  verif(
    "§3 — l'ancien rôle vidé ne survit pas à côté du nouveau",
    !gardes.includes("id-resident") && gardes.includes("id-fondateur"),
    `résident gardé : ${gardes.includes("id-resident")} · fondateur gardé : ${gardes.includes(
      "id-fondateur"
    )}`
  );
  verif(
    "un encadré NEUF laissé vide ne casse rien (aucun identifiant, rien à supprimer)",
    gardes.length === 1 && gardes.every(Boolean)
  );
  //  ET L'ANCIENNE ÉCRITURE, pour montrer le défaut qu'on vient de
  //  fermer : elle gardait TOUT ce qui était à l'écran.
  const ancienne = ecran.map((mode) => mode.id).filter(Boolean);
  verif(
    "témoin — l'ancienne écriture protégeait bien les trois lignes (le défaut du relevé)",
    ancienne.length === 3 &&
      ancienne.includes("id-domicile") &&
      ancienne.includes("id-resident"),
    `avant : [${ancienne.join(", ")}] · après : [${gardes.join(", ")}]`
  );
}

/* ==================================================================
 * §3 — LES SÉLECTEURS VÉRIFIÉS, UN PAR UN
 * ================================================================== */
titre("§3 — les sélecteurs : un choix retiré est retiré");
{
  verif(
    "le RÔLE (fondateur / artiste résident) : la bascule écrase, la ligne réécrit la colonne",
    /surChoix=\{\(role\) => modifier\(mode\.cle, \{ role \}\)\}/.test(blocModes) &&
      /role:\s*mode\.genre === "salon" \|\| mode\.genre === "prive"\s*\? \(mode\.role \?\? null\)\s*: null,/.test(
        exerciceNu
      )
  );
  verif(
    "la NATURE DU LIEU d'un guest (studio / salon) : changer efface le lieu ET le salon retenus",
    /modifier\(mode\.cle, \{ natureLieu, salon: null, lieu: null \}\)/.test(
      blocModes
    ) &&
      /nature_lieu: mode\.genre === "guest" \? \(mode\.natureLieu \?\? null\) : null,/.test(
        exerciceNu
      )
  );
  verif(
    "le SALON rattaché : sans salon choisi, la colonne repasse à null",
    /salon_id: mode\.salon\?\.id \?\? null,/.test(exerciceNu)
  );
  verif(
    "le RAYON d'un mode à domicile : hors « domicile », null",
    /rayon_km: mode\.genre === "domicile" \? \(mode\.rayonKm \?\? null\) : null,/.test(
      exerciceNu
    )
  );
  verif(
    "les DATES d'une session guest : hors « guest », null",
    /debut_le: mode\.genre === "guest" \? mode\.debut_le \|\| null : null,/.test(
      exerciceNu
    ) &&
      /fin_le: mode\.genre === "guest" \? mode\.fin_le \|\| null : null,/.test(
        exerciceNu
      )
  );
  verif(
    "chaque ligne gardée est RÉÉCRITE EN ENTIER (update de toutes les colonnes, pas une fusion)",
    /\.update\(candidate\)\s*\.eq\("id", mode\.id\)/.test(exerciceNu)
  );
}

nonJoue(
  "les trois scénarios de bout en bout (base)",
  "Supabase est hors de portée de cet environnement (hôte absent de " +
    "l'allowlist réseau) et le formulaire exige une session : renommer " +
    "un salon puis le chercher, supprimer « à domicile » puis recharger, " +
    "remplacer un rôle puis revenir — aucun de ces trois parcours ne " +
    "peut être joué ici, ni sur la fiche publique. Les causes sont donc " +
    "NOMMÉES ET PROUVÉES PAR LE CODE (assertions ci-dessus, ligne à " +
    "ligne) et la logique de suppression est REJOUÉE sur les données du " +
    "relevé, à partir de l'expression extraite du fichier livré. La " +
    "vérification sur la base revient au propriétaire, après la " +
    "migration supabase/yokofolio-nom-hors-brouillon.sql"
);

bilan();
