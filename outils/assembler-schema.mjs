//  ██ nº 766 bis — FAIRE UN FICHIER SQL DU CSV LU DANS L'ANCIEN PROJET ██
//  ==================================================================
//  On ne le lance pas directement : `sh outils/assembler-schema` s'en
//  charge. Le QUOI et le POURQUOI sont écrits là-bas.
//
//  ⚠️ IL NE TOUCHE À AUCUNE BASE. Il lit un fichier CSV sur le disque
//  et écrit un fichier .sql à côté. Rien d'autre. Aucun réseau, aucune
//  clé, aucune donnée.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RACINE = process.cwd();
const SORTIE = path.join(RACINE, "supabase", "yokofolio-schema-reel.sql");

/* ==================================================================
   LIRE DU CSV, POUR DE VRAI
   ==================================================================
   Les instructions SQL contiennent des retours à la ligne, des
   virgules et des guillemets — c'est-à-dire exactement les trois
   choses qu'un découpage naïf sur la virgule casse. On lit donc le
   CSV caractère par caractère, comme la norme le demande : entre
   guillemets, tout est du texte ; deux guillemets d'affilée valent un
   guillemet.
   ================================================================== */
function lireCsv(texte) {
  const lignes = [];
  let champs = [];
  let courant = "";
  let dansGuillemets = false;
  //  Un fichier venu d'un Mac ou de Windows peut porter des \r : on
  //  les enlève d'abord, sinon ils se glissent en fin de champ.
  const t = texte.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < t.length; i += 1) {
    const c = t[i];
    if (dansGuillemets) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          courant += '"';
          i += 1;
        } else {
          dansGuillemets = false;
        }
      } else {
        courant += c;
      }
      continue;
    }
    if (c === '"') dansGuillemets = true;
    else if (c === ",") {
      champs.push(courant);
      courant = "";
    } else if (c === "\n") {
      champs.push(courant);
      lignes.push(champs);
      champs = [];
      courant = "";
    } else courant += c;
  }
  if (courant !== "" || champs.length > 0) {
    champs.push(courant);
    lignes.push(champs);
  }
  return lignes;
}

/* ==================================================================
   L'ASSEMBLAGE
   ================================================================== */

const ENTETE = `-- ============================================================
--  LE SCHÉMA RÉEL DE YOKOFOLIO
--  Fabriqué par \`sh outils/assembler-schema\` à partir de ce que
--  l'ANCIEN projet a répondu — pas à partir du dépôt.
-- ============================================================
--  ⚠️ NE PAS LE MODIFIER À LA MAIN. Il se refabrique en une commande,
--  et c'est la base qui fait foi, jamais ce fichier.
--
--  À coller D'UN BLOC dans l'éditeur SQL du NOUVEAU projet, quand il
--  est encore VIDE. Si une ligne échoue, TOUT est annulé — envoie
--  l'erreur telle quelle.
--
--  ⚠️ AUCUNE DONNÉE, AUCUN COMPTE, AUCUNE PHOTO ici : rien que la
--  FORME des tables. Le reste voyage à part (docs/DEMENAGEMENT-766.md).
-- ============================================================

`;

async function principal() {
  const fichier = process.argv[2];
  if (!fichier) {
    console.log("  ✖  Il manque le fichier CSV.");
    console.log();
    console.log("       sh outils/assembler-schema ~/Downloads/resultat.csv");
    console.log();
    console.log("     (Le CSV vient du bouton « Download CSV » sous le");
    console.log("     résultat de supabase/766-lire-le-schema-reel.sql,");
    console.log("     lancé dans l'ANCIEN projet.)");
    process.exit(1);
  }

  let brut;
  try {
    brut = await readFile(fichier, "utf8");
  } catch {
    console.log(`  ✖  Fichier introuvable ou illisible : ${fichier}`);
    process.exit(1);
  }

  const lignes = lireCsv(brut);
  if (lignes.length === 0) {
    console.log("  ✖  Le fichier est vide.");
    process.exit(1);
  }

  //  La première ligne est l'en-tête. On y cherche les deux colonnes
  //  par leur NOM : si Supabase les rend dans l'autre sens un jour,
  //  ça marche quand même.
  const entete = lignes[0].map((c) => c.trim().toLowerCase());
  const colOrdre = entete.indexOf("ordre");
  const colSql = entete.indexOf("sql");
  if (colOrdre === -1 || colSql === -1) {
    console.log("  ✖  Ce CSV n'a pas les colonnes attendues « ordre » et « sql ».");
    console.log(`     Colonnes trouvées : ${entete.join(", ") || "(aucune)"}`);
    console.log("     C'est sans doute le résultat d'une AUTRE requête.");
    process.exit(1);
  }

  const morceaux = [];
  for (const ligne of lignes.slice(1)) {
    if (ligne.length <= colSql) continue;
    const n = Number(ligne[colOrdre]);
    const sql = ligne[colSql];
    if (!Number.isFinite(n) || !sql.trim()) continue;
    morceaux.push({ n, sql: sql.trim() });
  }

  if (morceaux.length === 0) {
    console.log("  ✖  Aucune instruction lue. Le CSV est-il bien celui du");
    console.log("     lecteur de schéma ?");
    process.exit(1);
  }

  //  ON REMET DANS L'ORDRE DE LA BASE, pas dans l'ordre du fichier :
  //  un tableur ou un export peut avoir trié autrement, et cet
  //  ordre-là n'est pas décoratif — c'est lui qui fait que les
  //  fonctions arrivent avant les tables, les tables avant les clés
  //  étrangères, et les vues dans le bon emboîtement.
  morceaux.sort((a, b) => a.n - b.n);

  //  Chaque instruction se termine par un point-virgule. Les vues
  //  arrivent sans (pg_get_viewdef en met un lui-même) : on ne veut
  //  ni doublon ni oubli.
  const corps = morceaux
    .map(({ sql }) => (sql.endsWith(";") ? sql : `${sql};`))
    .join("\n\n");

  await writeFile(SORTIE, ENTETE + corps + "\n", "utf8");

  console.log();
  console.log("  ██ SCHÉMA RÉEL ASSEMBLÉ ██");
  console.log(`     ${morceaux.length} instruction(s)`);
  console.log(`     écrit dans : supabase/yokofolio-schema-reel.sql`);
  console.log();
  console.log("  La suite : colle CE fichier dans le NOUVEAU projet (vide),");
  console.log("  puis compare les deux projets avec");
  console.log("  supabase/766-empreinte-schema.sql.");
  console.log();
}

principal().catch((erreur) => {
  console.log(`  ✖  ${String(erreur?.message ?? erreur).slice(0, 160)}`);
  process.exit(1);
});
