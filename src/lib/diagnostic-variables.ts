import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ██ nº 831 — D'OÙ VIENNENT LES VARIABLES, VU DEPUIS LA PRODUCTION ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : « aucun e-mail ne part », et le
 * diagnostic de la nº 830 a répondu `RESEND_API_KEY` absente au
 * runtime — alors qu'elle est posée chez Vercel depuis des semaines.
 * Deux mondes se contredisaient, et rien ne disait lequel le site
 * lisait vraiment.
 *
 * CE QUE CE MODULE AJOUTE, ET C'EST TOUT CE QUI MANQUAIT : la SOURCE.
 * Pour chaque variable que le code lit, il dit si sa valeur vient de
 * l'hébergeur ou d'un fichier `.env*` monté avec le dossier — et il
 * signale les deux pièges de saisie déjà rencontrés (une valeur vide,
 * une valeur qui répète le nom de la variable).
 *
 * POURQUOI LA QUESTION SE POSE. Next lit les valeurs dans cet ordre,
 * en s'arrêtant à la première trouvée (documentation « Environment
 * Variable Load Order », et mesuré au banc de cette passe) :
 *      1. process.env   ← ce que l'hébergeur pose
 *      2. .env.<mode>.local
 *      3. .env.local
 *      4. .env.<mode>   5. .env
 * L'hébergeur GAGNE donc toujours — un `.env.local` ne peut pas
 * écraser une variable de Vercel. Mais l'inverse est vrai aussi, et
 * c'est là que le site s'est perdu : une variable que l'hébergeur ne
 * fournit pas est prise dans le fichier, et le site marche… jusqu'à
 * ce qu'une ligne y soit vide. Alors plus rien ne part, sans un mot.
 *
 * ⚠️ AUCUNE VALEUR NE SORT D'ICI. On lit des fichiers qui contiennent
 * des secrets ; on n'en rend que des NOMS, des présences et des
 * longueurs. C'est la règle du dépôt, et elle est tenue par
 * construction : aucune valeur n'est jamais placée dans l'objet rendu.
 */

/** Les fichiers que Next lit, dans son ordre de priorité à lui. */
const FICHIERS_ENV = [
  ".env.production.local",
  ".env.local",
  ".env.production",
  ".env",
] as const;

/**
 * Les variables que le code lit vraiment (relevé de la nº 831). La
 * même liste vit dans `outils/verifier-variables-vercel.mjs`, qui la
 * vérifie AVANT la mise en ligne ; ici on regarde APRÈS, depuis le
 * site en marche. Les deux se répondent, et c'est voulu : l'une
 * empêche le départ, l'autre explique l'arrivée.
 */
const ATTENDUES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "RESEND_API_KEY",
  "RESEND_EXPEDITEUR",
  "CONTACT_EMAIL",
  "CRON_SECRET",
] as const;

/** Un nom de variable ordinaire. Ce qui n'y ressemble pas est masqué :
 *  une clé collée par mégarde dans le champ « Key » ne doit pas
 *  ressortir ici sous couvert d'être « un nom ». */
const NOM_ORDINAIRE = /^[A-Z][A-Z0-9_]{0,39}$/;

function nomMontrable(nom: string): string {
  return NOM_ORDINAIRE.test(nom) ? nom : `(nom masqué, ${nom.length} caractères)`;
}

/**
 * Un lecteur de `.env` minimal : `CLE=valeur`, guillemets retirés,
 * commentaires ignorés. Il sert UNIQUEMENT à comparer une valeur à
 * celle du runtime — rien de ce qu'il rend ne quitte ce module.
 */
function lireFichierEnv(chemin: string): Map<string, string> {
  const trouve = new Map<string, string>();
  let brut = "";
  try {
    brut = readFileSync(chemin, "utf8");
  } catch {
    return trouve;
  }
  for (const ligne of brut.split(/\r?\n/)) {
    const propre = ligne.trim();
    if (!propre || propre.startsWith("#")) continue;
    const coupe = propre.indexOf("=");
    if (coupe <= 0) continue;
    const nom = propre.slice(0, coupe).trim().replace(/^export\s+/, "");
    let valeur = propre.slice(coupe + 1).trim();
    if (
      valeur.length >= 2 &&
      ((valeur.startsWith('"') && valeur.endsWith('"')) ||
        (valeur.startsWith("'") && valeur.endsWith("'")))
    ) {
      valeur = valeur.slice(1, -1);
    }
    trouve.set(nom, valeur);
  }
  return trouve;
}

export type SourceVariable = "hébergeur" | "fichier" | "absente";

export type EtatVariable = {
  nom: string;
  presente: boolean;
  longueur: number;
  source: SourceVariable;
  alerte?: string;
};

/**
 * L'état de la chaîne, vu du serveur qui tourne. Rien de ce qu'elle
 * rend n'est une valeur de variable.
 */
export function diagnosticVariables() {
  const racine = process.cwd();

  /*  LES FICHIERS MONTÉS AVEC LE DOSSIER. En ligne, il ne devrait plus
      y en avoir un seul : `.vercelignore` les retient depuis la nº 831.
      S'il en reste un, c'est le premier fait à connaître — il explique
      qu'une valeur puisse venir d'ailleurs que du tableau de bord. */
  const fichiers = FICHIERS_ENV.map((nom) => {
    const chemin = join(racine, nom);
    if (!existsSync(chemin)) return { nom, present: false, cles: [] as string[] };
    const contenu = lireFichierEnv(chemin);
    return {
      nom,
      present: true,
      cles: [...contenu.keys()].map(nomMontrable).sort(),
    };
  });

  /*  LA VALEUR DU FICHIER LE PLUS PRIORITAIRE, pour chaque nom. Elle ne
      sert qu'à la comparaison ci-dessous et ne sort jamais d'ici. */
  const duFichier = new Map<string, string>();
  for (const nom of FICHIERS_ENV) {
    const chemin = join(racine, nom);
    if (!existsSync(chemin)) continue;
    for (const [cle, valeur] of lireFichierEnv(chemin)) {
      if (!duFichier.has(cle)) duFichier.set(cle, valeur);
    }
  }

  const variables: EtatVariable[] = ATTENDUES.map((nom) => {
    const valeur = process.env[nom] ?? "";
    const presente = valeur.length > 0;
    /*  LA SOURCE, ET SON SEUL POINT AVEUGLE, DIT EN FACE : si le
        fichier porte la même valeur que le runtime, on ne peut pas
        savoir lequel des deux l'a fournie — Next aurait pris celle de
        l'hébergeur. On répond « fichier » dans ce cas, parce que c'est
        l'hypothèse qui doit alerter : un fichier qui n'aurait pas dû
        monter. Le champ `fichiers` au-dessus permet de trancher. */
    const source: SourceVariable = !presente
      ? "absente"
      : duFichier.get(nom) === valeur
        ? "fichier"
        : "hébergeur";
    let alerte: string | undefined;
    if (!presente && duFichier.has(nom)) {
      alerte = "la ligne existe dans un fichier .env mais elle est vide";
    } else if (valeur === nom) {
      alerte =
        "la valeur répète le nom de la variable : le nom a été collé " +
        "dans le champ « Value » au lieu de la valeur";
    }
    return { nom, presente, longueur: valeur.length, source, alerte };
  });

  return {
    environnement: process.env.NODE_ENV ?? "(inconnu)",
    hebergeur: {
      vercel: process.env.VERCEL === "1",
      cible: process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV ?? "(aucune)",
      region: process.env.VERCEL_REGION ?? "(aucune)",
      /*  Tronqués : ils suffisent à reconnaître un déploiement sans
          recopier d'identifiant entier dans un compte rendu. */
      deploiement: (process.env.VERCEL_DEPLOYMENT_ID ?? "").slice(0, 12),
      commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7),
      adresse: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "(aucune)",
    },
    fichiersEnv: fichiers,
    variables,
    manquantes: variables.filter((v) => !v.presente).map((v) => v.nom),
    note:
      "source = d'où vient la valeur que le site lit. « fichier » veut " +
      "dire qu'un .env monté avec le dossier porte la même valeur : en " +
      "ligne, il ne devrait plus y en avoir (voir .vercelignore, nº 831).",
  };
}
