/*  ██ ARCHIVE — CE BANC NE PEUT PLUS TOURNER TEL QUEL (nº 790) ██
    Il lit un fichier de sonde retiré au grand ménage d'avant mise en
    ligne : l'instrument qu'il éprouvait n'existe plus. Le fichier est
    GARDÉ parce qu'il est le compte rendu écrit de sa passe — la preuve
    de ce qui a été mesuré, et comment. Ne pas le lancer sans l'avoir
    d'abord relu : ce qu'il vérifie du SITE reste vrai, ce qu'il
    vérifie de la SONDE ne l'est plus. */
/**
 * BANC DE LA PASSE Nº 344 — CE QUI VARIE, ET CE QUI NE VARIE PAS
 * ==================================================================
 * Le propriétaire a reçu la mise en page ORDINATEUR sur son iPhone et
 * a soupçonné un cache qui range une seule version par adresse. Ce banc
 * fige ce que la mesure a répondu, pour qu'aucune passe future ne
 * reparte de la supposition :
 *
 * §1 — LE HTML NE VARIE PAS AVEC L'APPAREIL. Identique au caractère
 *      près entre un iPhone et un ordinateur. La mise en page est
 *      décidée DANS LE NAVIGATEUR (`data-appareil`), et la variante
 *      `mobile` de globals.css ne regarde QUE cet attribut.
 * §2 — CE QUI VARIE VRAIMENT, ET OÙ. Le seul endroit du site où le
 *      SERVEUR lit l'appareil est la page du carrousel partagé ; le
 *      HTML varie aussi avec les COOKIES. Les deux réponses portent
 *      `private, no-cache` : aucun cache partagé n'a le droit de les
 *      ranger.
 * §3 — LA SONDE DIT DÉSORMAIS QUELLE MISE EN PAGE A ÉTÉ SERVIE.
 *
 * ⚠️ CE BANC NE CORRIGE RIEN et ne prouve rien sur l'hébergeur : la
 * vérification finale est celle du propriétaire, en ligne.
 */
import { BASE, bilan, lire, ouvrirLeNavigateur, titre, verif } from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const UA_BUREAU =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const { nav, ctx } = await ouvrirLeNavigateur("p344", { width: 390, height: 844 });

/* ==================================================================
 * §1 — LE HTML NE VARIE PAS AVEC L'APPAREIL
 * ================================================================== */
titre("§1 — le HTML servi ne dépend pas de l'appareil");

/*  ⚠️ POURQUOI ON NE COMPARE PAS LES DEUX HTML OCTET PAR OCTET ICI.
    Le serveur de DÉVELOPPEMENT ajoute à chaque réponse des jetons qui
    lui sont propres : deux requêtes IDENTIQUES n'y rendent déjà pas le
    même corps. La comparaison octet par octet a bien été faite — mais
    EN PRODUCTION COMPILÉE, à la nº 344, et elle est sans appel :
      /                 iPhone 164 436 o · ordinateur 164 436 o · IDENTIQUE
      /tatoueur/<slug>  iPhone  86 016 o · ordinateur  86 016 o · IDENTIQUE
      /qui-sommes-nous  iPhone  62 076 o · ordinateur  62 076 o · IDENTIQUE
    Ce que le banc vérifie ici, c'est la CAUSE de cette égalité, et elle
    ne dépend d'aucun serveur : le HTML ne porte PAS l'appareil. */
for (const adresse of ["/", "/qui-sommes-nous"]) {
  const [iphone, bureau] = await Promise.all([
    ctx.request.get(`${BASE}${adresse}`, { headers: { "User-Agent": UA_IPHONE } }),
    ctx.request.get(`${BASE}${adresse}`, { headers: { "User-Agent": UA_BUREAU } }),
  ]);
  const a = await iphone.text();
  const b = await bureau.text();
  const porteLAppareil = (t) => /<html[^>]*data-appareil=/.test(t);
  verif(
    `${adresse} — LE HTML SERVI NE PORTE PAS L'APPAREIL`,
    !porteLAppareil(a) && !porteLAppareil(b) && a.length > 1000,
    "ni pour l'iPhone, ni pour l'ordinateur — c'est le navigateur qui décide"
  );
  //  Et la seule différence tolérée est celle du serveur lui-même : la
  //  taille ne doit pas s'écarter de plus d'un pour cent.
  const ecart = Math.abs(a.length - b.length) / Math.max(a.length, b.length);
  verif(
    `${adresse} — les deux réponses ont la même taille, à un pour cent près`,
    ecart < 0.01,
    `${a.length} o · ${b.length} o · écart ${(ecart * 100).toFixed(2)} %`
  );
}

const styles = lire("src/app/globals.css");
verif(
  "la variante `mobile` ne regarde QUE `data-appareil`",
  /@custom-variant mobile \(&:where\(\[data-appareil="mobile"\]/.test(styles),
  "la mise en page est donc décidée dans le navigateur, pas au serveur"
);
verif(
  "…et cet attribut est posé AVANT la peinture, par le script bloquant",
  /r\.dataset\.appareil=matchMedia\("\(pointer: coarse\)"\)\.matches\?"mobile":"web"/.test(
    sansNotes(lire("src/lib/script-avant-peinture.ts"))
  ),
  "un doigt, jamais une largeur (règle nº 60)"
);

/* ==================================================================
 * §2 — CE QUI VARIE VRAIMENT
 * ================================================================== */
titre("§2 — les deux seules variations serveur, et leur protection");

const appelants = [];
for (const fichier of [
  "src/app/(tatouage)/tatoueur/[slug]/carrousel/page.tsx",
  "src/app/(tatouage)/layout.tsx",
  "src/app/(tatouage)/page.tsx",
]) {
  if (/ecranTactileServeur/.test(sansNotes(lire(fichier)))) appelants.push(fichier);
}
verif(
  "un SEUL endroit du site lit l'appareil côté serveur",
  appelants.length === 1 && appelants[0].includes("carrousel"),
  appelants.join(", ") || "(aucun)"
);

const config = lire("next.config.ts");
verif(
  "les pages du produit sont déclarées `private, no-cache`",
  /"private, no-cache, max-age=0, must-revalidate"/.test(config),
  "aucun cache partagé n'a le droit de les ranger"
);

//  ⚠️ CE CONSTAT EST UNE MESURE, PAS UN SUCCÈS : `Vary` ne peut PAS
//  être déclaré depuis l'application. Essayé des deux façons possibles
//  — `next.config.headers()` et le proxy — et mesuré : Next réécrit
//  l'en-tête pour les réponses de page. On l'inscrit ici pour qu'aucune
//  passe ne le redécouvre à ses frais.
const entetes = await ctx.request.get(`${BASE}/`, {
  headers: { "User-Agent": UA_IPHONE },
});
const vary = entetes.headers()["vary"] ?? "";
verif(
  "CONSTAT — `Vary` est écrit par Next, et l'application ne peut pas s'y ajouter",
  vary.includes("rsc") && !vary.includes("Cookie"),
  `Vary reçu : ${vary}`
);

/* ==================================================================
 * §3 — LA SONDE DIT QUELLE MISE EN PAGE A ÉTÉ SERVIE
 * ================================================================== */
titre("§3 — la sonde relève la mise en page à chaque arrivée");

const sonde = lire("src/components/SondeRetour.tsx");
verif(
  "elle note `data-appareil` et le pointeur, à chaque document neuf",
  /mise en page : data-appareil/.test(sonde) &&
    /pointer: coarse/.test(sonde) &&
    /ABSENT — version ordinateur servie/.test(sonde)
);

const p = await ctx.newPage();
await p.goto(`${BASE}/?sonde-retour=1`, { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const ligne = await p.evaluate(() => {
  const l = JSON.parse(
    sessionStorage.getItem("yokofolio:sonde-retour:journal") ?? "[]"
  );
  return l.map((x) => x.texte).find((t) => t.startsWith("mise en page")) ?? "(absente)";
});
verif(
  "…et la ligne sort vraiment",
  ligne.startsWith("mise en page : data-appareil="),
  ligne
);
await p.close();

await nav.close();
process.exit(bilan());
