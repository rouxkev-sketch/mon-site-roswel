#!/usr/bin/env node
/**
 * ██ nº 831 — LES VARIABLES DU TABLEAU DE BORD, VÉRIFIÉES AVANT LA MISE
 *             EN LIGNE ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : le site en production n'envoyait aucun
 * e-mail, et le diagnostic de la nº 830 a montré pourquoi il ne POUVAIT
 * pas : `RESEND_API_KEY` valait vide AU RUNTIME, alors qu'elle est
 * posée chez Vercel depuis des semaines. Autrement dit : LA PRODUCTION
 * NE TOURNAIT PAS SUR LES VARIABLES DU TABLEAU DE BORD.
 *
 * CE QUE FAIT CE SCRIPT : il compare, AVANT de déployer, les variables
 * que le code lit vraiment avec celles que le projet Vercel possède
 * pour la PRODUCTION. S'il en manque une, le déploiement n'a pas lieu
 * et on lit son nom. Le site ne peut plus partir en ligne amputé d'une
 * variable sans que personne ne le sache.
 *
 * ⚠️ IL NE VOIT JAMAIS UNE VALEUR, ET N'EN AFFICHE JAMAIS UNE. Il lit
 * `vercel env ls production --json` sur son entrée standard. Cette
 * sortie CONTIENT des valeurs (celles des variables non marquées
 * « sensitive ») : ce script n'en extrait QUE le champ `key`, et
 * n'imprime que des noms venant de SA PROPRE liste, ci-dessous. Aucune
 * chaîne reçue n'est ré-imprimée — c'est la règle du dépôt sur les
 * secrets, tenue par construction et non par prudence.
 *
 * EMPLOI (c'est `d` qui s'en charge) :
 *     vercel env ls production --json | node outils/verifier-variables-vercel.mjs
 *
 * SORTIE : 0 = tout est là · 1 = il manque quelque chose · 2 = rien
 * d'exploitable sur l'entrée (CLI trop ancienne, hors ligne, projet non
 * lié). Les trois cas sont distingués parce que `d` n'en tire pas les
 * mêmes conclusions.
 */

/**
 * LES VARIABLES QUE LE CODE LIT VRAIMENT, relevées une par une dans
 * `src/` (nº 831). Celles qui ne sont plus lues n'y sont pas : les deux
 * variables Turnstile, par exemple, ne figurent plus nulle part dans le
 * code et exiger leur présence ferait refuser un déploiement sain.
 */
const INDISPENSABLES = [
  {
    nom: "NEXT_PUBLIC_SUPABASE_URL",
    role: "l'adresse de la base — sans elle, aucune page ne se construit",
  },
  {
    nom: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    role: "la clé publique de la base (lecture des fiches, connexion)",
  },
  {
    nom: "SUPABASE_SECRET_KEY",
    role: "la clé serveur de la base (admin, envois, tâches de nuit)",
  },
  {
    nom: "NEXT_PUBLIC_SITE_URL",
    role: "l'adresse du site — elle compose les liens des e-mails",
  },
  {
    nom: "RESEND_API_KEY",
    role: "la clé d'envoi des e-mails — son absence est le défaut nº 830",
  },
  {
    nom: "RESEND_EXPEDITEUR",
    role:
      "l'expéditeur des e-mails ; sans elle, Resend n'écrit qu'au " +
      "propriétaire du compte et refuse tout le reste",
  },
  {
    nom: "CONTACT_EMAIL",
    role: "la boîte qui reçoit les messages du formulaire de contact",
  },
  {
    nom: "CRON_SECRET",
    role: "le mot de passe de la tâche de nuit (purge des comptes)",
  },
];

/**
 * LES VARIABLES QUI NE DOIVENT PAS ÊTRE LÀ. `RESEND_API_URL` détourne
 * les envois vers une doublure locale : elle ne sert qu'aux bancs
 * d'essai (nº 817). Depuis la nº 830 le code l'ignore en ligne, mais si
 * quelqu'un l'a posée sur l'hébergeur, il faut le dire — c'est le
 * genre de variable qu'on oublie et qu'on accuse ensuite pendant des
 * heures.
 */
const INTERDITES = [
  { nom: "RESEND_API_URL", role: "elle ne sert qu'aux bancs d'essai" },
];

function lireEntree() {
  return new Promise((resoudre) => {
    let recu = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (bout) => {
      recu += bout;
    });
    process.stdin.on("end", () => resoudre(recu));
    process.stdin.on("error", () => resoudre(""));
  });
}

/**
 * LES NOMS, ET RIEN D'AUTRE. On accepte les deux formes que la CLI a
 * connues — `{ envs: [ { key } ] }` et un tableau nu — et l'on ne
 * garde de chaque entrée que son `key`, quand il ressemble à un nom de
 * variable. Tout le reste de l'objet (à commencer par `value`) est
 * laissé sur place.
 */
function nomsPresents(brut) {
  let lu;
  try {
    lu = JSON.parse(brut);
  } catch {
    return null;
  }
  const liste = Array.isArray(lu) ? lu : Array.isArray(lu?.envs) ? lu.envs : null;
  if (!liste) return null;
  const noms = new Set();
  for (const entree of liste) {
    const nom = entree?.key;
    if (typeof nom === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(nom)) {
      noms.add(nom);
    }
  }
  return noms;
}

const brut = (await lireEntree()).trim();
if (!brut) {
  console.log("   (aucune réponse de Vercel — vérification impossible)");
  process.exit(2);
}

const presents = nomsPresents(brut);
if (!presents) {
  console.log("   (réponse de Vercel illisible — vérification impossible)");
  process.exit(2);
}

const manquantes = INDISPENSABLES.filter((v) => !presents.has(v.nom));
const parasites = INTERDITES.filter((v) => presents.has(v.nom));

if (manquantes.length === 0 && parasites.length === 0) {
  console.log(
    `   ${INDISPENSABLES.length} variables attendues, ${INDISPENSABLES.length} présentes en production.`
  );
  process.exit(0);
}

if (manquantes.length > 0) {
  console.log("");
  console.log(
    `   Il manque ${manquantes.length} variable(s) à l'environnement`
  );
  console.log("   PRODUCTION du projet Vercel :");
  console.log("");
  for (const v of manquantes) console.log(`     · ${v.nom}\n         ${v.role}`);
}
if (parasites.length > 0) {
  console.log("");
  console.log("   Ces variables ne devraient PAS être en production :");
  console.log("");
  for (const v of parasites) console.log(`     · ${v.nom}\n         ${v.role}`);
}
process.exit(1);
