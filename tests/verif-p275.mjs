/**
 * BANC DE LA PASSE Nº 275
 * ==================================================================
 * §1 l'interrupteur « Rendre publique » n'écrit plus `valide` /
 *    `brouillon` — deux mots qu'aucune contrainte de `tatoueurs`
 *    n'admet, et qui faisaient rejeter l'UPDATE ENTIER (relevé de
 *    l'utilisateur : « violates check constraint
 *    tatoueurs_statut_check », fiche « Funambulink Ttt »). Allumage →
 *    `validee` ; extinction → le statut n'est PAS touché ; et une
 *    violation de contrainte est désormais NOMMÉE au lieu d'être
 *    avalée en « Enregistrement impossible » ;
 * §2 le masquage par compte quitte la base : la migration livrée
 *    reprend le corps de la nº 63 AU CARACTÈRE PRÈS, moins le
 *    paramètre `p_comptes_masques` et sa clause — la comparaison est
 *    faite ici, mécaniquement ; l'appelant cesse de l'envoyer ;
 * §3 les en-têtes qui décrivaient un masquage retiré disent la
 *    vérité, et disent POURQUOI il a été retiré.
 *
 * MÉTHODE : les écritures livrées sont REJOUÉES (new Function) sur les
 * cas réels — dont le message d'erreur EXACT du relevé. La comparaison
 * des deux corps SQL est faite par le banc, pas à l'œil.
 * ⚠️ L'ÉCRAN DE DÉMARCHAGE EXIGE UNE SESSION ADMINISTRATEUR et la base
 * est hors de portée de ce conteneur : le parcours vivant de
 * l'interrupteur est NON JOUÉ, et dit comme tel.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 */
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const routeInterrupteur = lire(
  "src/app/api/admin/yokofolio/demarchage/fiche/route.ts"
);
const interrupteurNu = sansNotes(routeInterrupteur);
const tatoueursNu = sansNotes(lire("src/lib/tatoueurs.ts"));
const sitemap = lire("src/app/sitemap.ts");
const migration = lire("supabase/yokofolio-recherche-sans-masquage.sql");
const migration63 = lire("supabase/yokofolio-classement-avant-la-coupe.sql");

/* ==================================================================
 * §1 — L'INTERRUPTEUR
 * ================================================================== */
titre("§1 — l'écriture de l'interrupteur, REJOUÉE dans les deux sens");
{
  //  L'ÉCRITURE LIVRÉE, extraite telle quelle et rejouée.
  const debut = interrupteurNu.indexOf("const valeurs: Record<string, unknown>");
  const fin = interrupteurNu.indexOf("if (ligne.brouillon != null)", debut);
  const source = interrupteurNu
    .slice(debut, fin)
    .replace("const valeurs: Record<string, unknown>", "const valeurs");
  let rejouer = null;
  try {
    rejouer = new Function(
      "corps",
      `${source} return valeurs;`
    );
  } catch {
    rejouer = null;
  }
  const allume = rejouer && rejouer({ publique: true });
  const eteint = rejouer && rejouer({ publique: false });
  verif(
    "ALLUMER écrit les trois ensemble — publie, admin_publique, et " +
      "`validee` (le mot que la contrainte admet)",
    Boolean(allume) &&
      allume.publie === true &&
      allume.admin_publique === true &&
      allume.statut === "validee",
    JSON.stringify(allume)
  );
  verif(
    "ÉTEINDRE ne touche PAS au statut : deux clés seulement, et " +
      "`statut` absent de l'objet (la modération garde son état)",
    Boolean(eteint) &&
      eteint.publie === false &&
      eteint.admin_publique === false &&
      !("statut" in eteint),
    JSON.stringify(eteint)
  );
  verif(
    "les deux mots refusés par la base ont DISPARU de toute la route",
    !interrupteurNu.includes('"valide"') &&
      !interrupteurNu.includes('"brouillon"')
  );
  //  LES QUATRE VALEURS LÉGALES, lues dans les migrations elles-mêmes
  //  (jamais recopiées) : `validee` en est, `valide` et `brouillon`
  //  n'en sont pas.
  const admises = [
    ...lire("supabase/yokofolio-en-ligne-vraie-regle.sql").matchAll(
      /check \(statut in \(([^)]+)\)\)/g
    ),
  ]
    .map((m) => m[1].split(",").map((v) => v.trim().replace(/'/g, "")))
    .pop();
  verif(
    "et `validee` EST une valeur admise par la contrainte en vigueur, " +
      "quand `valide` et `brouillon` n'en sont pas",
    Array.isArray(admises) &&
      admises.includes("validee") &&
      !admises.includes("valide") &&
      !admises.includes("brouillon"),
    `contrainte : ${(admises ?? []).join(" · ")}`
  );
  verif(
    "l'interrupteur reste ÉTEINT par défaut : la colonne naît `false` " +
      "en base (nº 43) et n'est écrite QUE par cette route",
    /add column if not exists admin_publique boolean not null default false/.test(
      lire("supabase/yokofolio-fiche-admin-publique.sql")
    ) &&
      //  aucun autre écrivain de la colonne dans tout le site
      (sansNotes(lire("src/app/api/admin/yokofolio/fiches/route.ts")).includes(
        "admin_publique:"
      ) === false)
  );
}

titre("§1 — le refus de la base est NOMMÉ (le message du relevé, rejoué)");
{
  const debut = routeInterrupteur.indexOf("function contrainteRefusee");
  //  ⚠️ LES ANNOTATIONS DE TYPE NE SURVIVENT PAS À `new Function` (le
  //  piège de la nº 272, déjà payé) : on les retire de la SIGNATURE
  //  avant de rejouer. Le CORPS, lui, n'est pas touché — c'est bien
  //  l'écriture livrée qui est éprouvée.
  const source = routeInterrupteur
    .slice(debut, routeInterrupteur.indexOf("\n}", debut) + 2)
    .replace(
      "function contrainteRefusee(message: string): string | null {",
      "function contrainteRefusee(message) {"
    );
  let nommer = null;
  try {
    nommer = new Function(`${source} return contrainteRefusee;`)();
  } catch {
    nommer = null;
  }
  //  LE MESSAGE EXACT relevé par l'utilisateur sur « Funambulink Ttt ».
  const releve =
    'new row for relation "tatoueurs" violates check constraint "tatoueurs_statut_check"';
  const dit = nommer && nommer(releve);
  verif(
    "le message du relevé est reconnu, et la CONTRAINTE est nommée dans " +
      "la réponse (avec le message d'origine)",
    typeof dit === "string" &&
      dit.includes("tatoueurs_statut_check") &&
      dit.includes("REFUSÉ") &&
      dit.includes(releve),
    dit ? `« ${dit.slice(0, 90)}… »` : "non reconnu"
  );
  verif(
    "les autres refus de la base sont reconnus aussi (clé étrangère, " +
      "non-null, unicité) — et une panne ordinaire ne l'est PAS",
    Boolean(nommer) &&
      nommer('violates foreign key constraint "x_fkey"') !== null &&
      nommer('null value in column "y" violates not-null constraint') !== null &&
      nommer('duplicate key value violates unique constraint "z"') !== null &&
      nommer("TypeError: fetch failed") === null
  );
  verif(
    "et la route s'en sert AUX DEUX écritures (l'interrupteur et la " +
      "restauration), en 409 — jamais un « Enregistrement impossible » muet",
    (interrupteurNu.match(/const refus = contrainteRefusee\(/g) ?? []).length ===
      2 &&
      (interrupteurNu.match(/message: refus \}, \{ status: 409 \}/g) ?? [])
        .length === 2
  );
}

titre("§1 — plus aucune écriture de `valide` / `brouillon` dans un statut");
{
  //  LE DÉPÔT ENTIER, produit YokoFolio : `valide` et `brouillon` sont
  //  le vocabulaire du produit ARTISANS (`statut_validation`, une
  //  autre table) — ils ne doivent apparaître dans AUCUNE écriture de
  //  `statut`. On cherche la forme d'écriture, pas le mot isolé.
  const fichiers = [
    "src/app/api/admin/yokofolio/demarchage/fiche/route.ts",
    "src/app/api/admin/yokofolio/demarchage/route.ts",
    "src/app/api/admin/yokofolio/fiches/route.ts",
    "src/app/api/rattachement/route.ts",
    "src/app/api/tatoueur/supprimer-fiche/route.ts",
    "src/components/FormulaireFiche.tsx",
    "src/lib/fiches-compte.ts",
  ];
  const fautifs = fichiers.filter((chemin) =>
    /statut:\s*["'](valide|brouillon)["']/.test(sansNotes(lire(chemin)))
  );
  verif(
    "aucun fichier de YokoFolio n'écrit `statut: \"valide\"` ni " +
      "`statut: \"brouillon\"`",
    fautifs.length === 0,
    fautifs.length ? fautifs.join(", ") : "sept fichiers passés au crible"
  );
}

/* ==================================================================
 * §2 — LA MIGRATION : identique à la 63, moins le masquage
 * ================================================================== */
titre("§2 — la migration : le corps de la 63 AU CARACTÈRE PRÈS, moins le masquage");
{
  /** Le CREATE FUNCTION seul (le commentaire de fonction est réécrit). */
  const corpsDe = (texte) => {
    const debut = texte.indexOf("create function public.rechercher_tatoueurs");
    const fin = texte.indexOf("comment on function public.rechercher_tatoueurs");
    return texte.slice(debut, fin);
  };
  //  LA 63, PRIVÉE DES MÊMES DEUX BLOCS — calculé ici, pas recopié.
  let attendu = corpsDe(migration63)
    .split("\n")
    .filter((l) => !l.includes("p_comptes_masques text[] default"))
    .join("\n");
  const marque =
    "      --  ============================================================\n" +
    "      --  LES FICHES D'ESSAI D'UN ADMINISTRATEUR";
  const i = attendu.indexOf(marque);
  const finClause = "        or t.admin_publique\n      )\n";
  const j = attendu.indexOf(finClause) + finClause.length;
  attendu = i >= 0 && j > i ? attendu.slice(0, i) + attendu.slice(j) : null;

  const livre = corpsDe(migration);
  verif(
    "le corps livré est EXACTEMENT celui de la nº 63 privé du paramètre " +
      "et de la clause de masquage — rien d'autre n'a bougé",
    attendu !== null && livre === attendu,
    attendu === null
      ? "extraction impossible"
      : `${livre.length} caractères, identiques : ${livre === attendu}`
  );
  verif(
    "le corps EXÉCUTABLE ne connaît plus ni le paramètre ni l'exception",
    !livre.includes("p_comptes_masques") && !livre.includes("admin_publique")
  );
  verif(
    "ce que la 63 apportait est intact : popularité dans LES DEUX " +
      "`order by`, ordre stable, coupe avant le `limit`",
    (livre.match(/coalesce\(pop\.score, 0\) desc/g) ?? []).length === 2 &&
      livre.includes("popularite_tatoueurs") &&
      livre.includes("row_number() over (") &&
      livre.includes("limit greatest(coalesce(p_limite, 24), 0)")
  );
  verif(
    "elle DROP avant de créer (la signature change : un paramètre de " +
      "moins), et se relance sans risque",
    /do \$migration\$[\s\S]*?drop function[\s\S]*?\$migration\$;/.test(
      migration
    ) && /proname = 'rechercher_tatoueurs'/.test(migration)
  );
  verif(
    "son relevé final vérifie le retrait, sans rien écrire",
    /prosrc like '%admin_publique%'/.test(migration) &&
      /pg_get_function_arguments\(oid\) like '%p_comptes_masques%'/.test(
        migration
      ) &&
      !/insert into|update public|delete from/i.test(migration)
  );
  verif(
    "elle est annoncée dans l'ordre des migrations (nº 66), avec sa " +
      "dépendance à la nº 63",
    /66\. \*\*`yokofolio-recherche-sans-masquage\.sql`\*\*/.test(
      lire("supabase/LISEZ-MOI-ordre-des-migrations.md")
    )
  );
}

titre("§2 — l'appelant n'envoie plus le paramètre (et marche dans les deux cas)");
{
  verif(
    "`p_comptes_masques` a disparu de l'appel, et le tableau vide avec " +
      "lui — la fonction ne reçoit plus rien à masquer",
    !tatoueursNu.includes("p_comptes_masques") &&
      !tatoueursNu.includes("proprietairesMasques") &&
      /const enBase = await rechercheEnBase\(filtres, ville\);/.test(
        tatoueursNu
      )
  );
  verif(
    "la fonction d'AVANT la migration lui donne sa valeur par défaut " +
      "(`'{}'`) : le site marche migration passée ou non",
    /p_comptes_masques text\[\] default '\{\}'::text\[\]/.test(migration63)
  );
}

/* ==================================================================
 * §3 — LES EN-TÊTES QUI MENTAIENT
 * ================================================================== */
titre("§3 — les commentaires disent la vérité, et disent pourquoi");
{
  verif(
    "sitemap : l'ancienne promesse (« les fiches d'essai des " +
      "administrateurs sont retirées ») a disparu…",
    !sitemap.includes("fiches d'ESSAI DES ADMINISTRATEURS") &&
      !sitemap.includes(
        "Les fiches des administrateurs en sont retirées"
      )
  );
  verif(
    "… et la note dit POURQUOI la règle est partie : le propriétaire " +
      "est le seul administrateur, le site était introuvable sur Google",
    sitemap.includes("SEUL compte administrateur") &&
      sitemap.includes("nº 178") &&
      sitemap.includes("275") &&
      sitemap.includes("estEnLigne")
  );
  //  LES DEUX AUTRES EN-TÊTES CORRIGÉS, nommés un à un.
  verif(
    "lib/tatoueurs : `user_id` ne prétend plus servir à un masquage",
    !tatoueursNu.includes("le masquage des fiches") &&
      lire("src/lib/tatoueurs.ts").includes(
        "le masquage des fiches\n      d'administrateur a disparu"
      )
  );
  verif(
    "lib/tatoueurs : `admin_publique` ne prétend plus lever un masquage",
    !lire("src/lib/tatoueurs.ts").includes(
      "LEVER le masquage qui frappe les comptes administrateurs"
    ) &&
      lire("src/lib/tatoueurs.ts").includes("IL NE DÉCIDE PLUS DE LA VISIBILITÉ")
  );
  verif(
    "la route de l'interrupteur ne prétend plus lever un masquage non plus",
    !routeInterrupteur.includes(
      "`admin_publique` lève le masquage\n * des comptes administrateurs"
    ) && routeInterrupteur.includes("CE QUE `admin_publique` NE FAIT PLUS")
  );
  //  LE BALAYAGE : plus aucun commentaire du dépôt ne PROMET un
  //  masquage par compte administrateur.
  const suspects = [
    "src/app/sitemap.ts",
    "src/lib/tatoueurs.ts",
    "src/lib/fiches-admin.ts",
    "src/app/api/admin/yokofolio/demarchage/fiche/route.ts",
    "src/app/api/admin/yokofolio/demarchage/route.ts",
    "src/app/api/admin/yokofolio/fiches/route.ts",
  ].filter((chemin) => {
    const texte = lire(chemin);
    //  une PROMESSE de masquage encore au présent, hors récit du passé
    return /(sont|est) (retir|masqu|cach)[^.]{0,60}administrateur/i.test(texte);
  });
  verif(
    "aucun en-tête du dépôt ne promet plus, AU PRÉSENT, un masquage des " +
      "fiches d'administrateur",
    suspects.length === 0,
    suspects.length ? suspects.join(", ") : "six fichiers relus"
  );
}

/* ==================================================================
 * LE VIVANT — ce que ce conteneur peut encore prouver
 * ================================================================== */
titre("VIVANT (1440 px) — le site tient debout après le retrait du paramètre");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    const accueil = await page.evaluate(() => ({
      cartes: document.querySelectorAll('a[href^="/tatoueur/"]').length,
      erreur: /Une erreur|couldn't load/i.test(document.body.innerText),
    }));
    verif(
      "l'accueil rend ses cartes et ne lève aucune erreur (le chemin de " +
        "recherche est intact)",
      accueil.cartes > 0 && !accueil.erreur,
      `${accueil.cartes} carte(s)`
    );
  } catch (erreur) {
    nonJoue("accueil vivant", String(erreur).slice(0, 110));
  } finally {
    await contexte.close();
    await nav.close();
  }
}

nonJoue(
  "l'interrupteur JOUÉ EN VRAI, et la recherche EN BASE",
  "l'écran de démarchage exige une session administrateur (la route " +
    "répond « Connecte-toi pour ouvrir l'admin. », mesuré) et Supabase " +
    "est hors de portée de ce conteneur — l'accueil ci-dessus tourne " +
    "donc sur la DÉMONSTRATION, sans appeler `rechercher_tatoueurs`. " +
    "Les deux corrections sont prouvées par le REJEU des écritures " +
    "livrées (ci-dessus) ; l'allumage sur une vraie fiche et le relevé " +
    "final de la migration reviennent au propriétaire"
);

process.exit(bilan());
