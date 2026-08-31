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

/*  LES DEUX BLOCS QUI NE SE COMPORTENT PAS COMME LES AUTRES.
    Le 8 porte les vues — leur `rang` est le numéro interne de la vue,
    pas une position. Le 99 ne porte pas de SQL du tout : rien que les
    liens « fille|mère » entre vues, qui servent à ranger le 8. */
const BLOC_VUES = 8;
const BLOC_LIENS = 99;

/** RANGER LES VUES : chacune après celles qu'elle lit.
    Tri topologique ordinaire (parcours en profondeur, marque de
    visite). Les liens qui désignent une vue absente sont ignorés :
    ils ne peuvent rien contraindre.
    ⚠️ EN CAS DE BOUCLE — impossible entre vues, mais on ne parie pas —
    on garde l'ordre d'origine plutôt que de rendre n'importe quoi. */
function rangerLesVues(vues, liens) {
  const parNumero = new Map(vues.map((v) => [v.b, v]));
  const socles = new Map();
  for (const [fille, mere] of liens) {
    if (!parNumero.has(fille) || !parNumero.has(mere)) continue;
    if (!socles.has(fille)) socles.set(fille, []);
    socles.get(fille).push(mere);
  }
  const rangees = [];
  const etat = new Map(); //  1 = en cours de visite, 2 = posée
  let boucle = false;
  const poser = (numero) => {
    if (etat.get(numero) === 2) return;
    if (etat.get(numero) === 1) {
      boucle = true;
      return;
    }
    etat.set(numero, 1);
    for (const mere of socles.get(numero) ?? []) poser(mere);
    etat.set(numero, 2);
    rangees.push(parNumero.get(numero));
  };
  for (const v of vues) poser(v.b);
  if (boucle) {
    console.log("  ⚠️  Boucle entre vues : on garde leur ordre d'origine.");
    return vues;
  }
  return rangees;
}

/** LES DEUX FORMES D'EN-TÊTE, ET COMMENT ON S'Y RETROUVE.
    · le gros fichier et chaque bloc rendent `bloc, rang, instruction` ;
    · une version plus ancienne rendait `ordre, instruction`, et la
      toute première `ordre, sql`.
    On cherche donc les colonnes PAR LEUR NOM, dans cet ordre de
    préférence — jamais par leur position. */
function repererLesColonnes(entete) {
  const ou = (...noms) => {
    for (const nom of noms) {
      const i = entete.indexOf(nom);
      if (i !== -1) return i;
    }
    return -1;
  };
  return {
    bloc: ou("bloc"),
    rang: ou("rang"),
    ordre: ou("ordre"),
    texte: ou("instruction", "texte", "sql"),
  };
}

async function principal() {
  //  ⚠️ PLUSIEURS FICHIERS SONT ACCEPTÉS (nº 766 quater). Si le gros
  //  lecteur passe, il n'y en a qu'un ; s'il a fallu faire bloc par
  //  bloc, on les donne tous, dans n'importe quel ordre — le tri se
  //  fait sur le contenu, pas sur l'ordre des arguments.
  const fichiers = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (fichiers.length === 0) {
    console.log("  ✖  Il manque le ou les fichiers CSV.");
    console.log();
    console.log("       sh outils/assembler-schema ~/Downloads/resultat.csv");
    console.log();
    console.log("     Ou, si tu as dû procéder bloc par bloc :");
    console.log();
    console.log("       sh outils/assembler-schema bloc0.csv bloc1.csv …");
    console.log();
    console.log("     (Les CSV viennent du bouton « Download CSV » sous le");
    console.log("     résultat, dans l'ANCIEN projet.)");
    process.exit(1);
  }

  const morceaux = [];
  for (const fichier of fichiers) {
    let brut;
    try {
      brut = await readFile(fichier, "utf8");
    } catch {
      console.log(`  ✖  Fichier introuvable ou illisible : ${fichier}`);
      process.exit(1);
    }

    const lignes = lireCsv(brut);
    if (lignes.length === 0) {
      console.log(`  ✖  Fichier vide : ${fichier}`);
      process.exit(1);
    }

    const entete = lignes[0].map((c) => c.trim().toLowerCase());
    const col = repererLesColonnes(entete);
    const parBlocEtRang = col.bloc !== -1 && col.rang !== -1;
    if (col.texte === -1 || (!parBlocEtRang && col.ordre === -1)) {
      console.log(`  ✖  ${fichier} n'a pas les colonnes attendues.`);
      console.log("     Attendu « bloc, rang, instruction » (ou « ordre,");
      console.log("     instruction »).");
      console.log(`     Colonnes trouvées : ${entete.join(", ") || "(aucune)"}`);
      console.log("     C'est sans doute le résultat d'une AUTRE requête.");
      process.exit(1);
    }

    let lus = 0;
    for (const ligne of lignes.slice(1)) {
      if (ligne.length <= col.texte) continue;
      const texte = ligne[col.texte];
      if (!texte.trim()) continue;
      //  La clé de tri : (bloc, rang) quand on les a, sinon `ordre`
      //  seul — auquel cas on le range dans un bloc unique.
      const a = parBlocEtRang ? Number(ligne[col.bloc]) : 0;
      const b = parBlocEtRang ? Number(ligne[col.rang]) : Number(ligne[col.ordre]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      morceaux.push({ a, b, sql: texte.trim() });
      lus += 1;
    }
    if (fichiers.length > 1) {
      console.log(`     · ${fichier} → ${lus} instruction(s)`);
    }
  }

  if (morceaux.length === 0) {
    console.log("  ✖  Aucune instruction lue. Les CSV sont-ils bien ceux du");
    console.log("     lecteur de schéma ?");
    process.exit(1);
  }

  //  ON REMET DANS L'ORDRE DE LA BASE, pas dans l'ordre des fichiers :
  //  un tableur, un export ou une ligne de commande peut les avoir
  //  donnés autrement, et cet ordre-là n'est pas décoratif — c'est lui
  //  qui fait que les fonctions arrivent avant les tables, et les
  //  tables avant les clés étrangères.
  morceaux.sort((x, y) => x.a - y.a || x.b - y.b);

  //  ── LES VUES, RANGÉES PAR CE QU'ELLES LISENT ──────────────────
  //  Une vue qui en lit une autre doit être créée APRÈS elle. On a
  //  d'abord cru pouvoir les ranger par leur âge (leur numéro interne
  //  croissant) : c'est FAUX, et le banc l'a montré — une vue refaite
  //  reçoit un numéro plus récent que celles qui la lisent déjà.
  //  Le bloc 99 du lecteur sort donc les LIENS en clair, « fille|mère »,
  //  et c'est ici qu'on range. Le calcul est fait dans ce script,
  //  plutôt qu'en SQL, pour que le fichier à coller reste simple.
  const vues = morceaux.filter((m) => m.a === BLOC_VUES);
  const liens = morceaux
    .filter((m) => m.a === BLOC_LIENS)
    .map((m) => m.sql.split("|").map(Number))
    .filter(([f, s]) => Number.isFinite(f) && Number.isFinite(s));
  const rangees = rangerLesVues(vues, liens);
  //  On réécrit le rang des vues, et on jette les lignes du bloc 99 :
  //  ce sont des renseignements, pas du SQL.
  rangees.forEach((vue, i) => {
    vue.b = i;
  });
  const aEcrire = morceaux.filter((m) => m.a !== BLOC_LIENS);
  aEcrire.sort((x, y) => x.a - y.a || x.b - y.b);
  morceaux.length = 0;
  morceaux.push(...aEcrire);

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
