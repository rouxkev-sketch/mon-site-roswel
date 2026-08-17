/**
 * BANC DE LA PASSE Nº 343 — L'ARMEMENT DURABLE DES SONDES
 * ==================================================================
 * Le défaut poursuivi par le propriétaire ne se produit QU'À L'ADRESSE
 * NUE : une sonde armée par l'adresse le faisait disparaître. Cette
 * passe ne corrige AUCUN défaut — elle pose l'instrument.
 *
 * §1 — UNE SEULE ÉCRITURE D'ARMEMENT, pour les trois sondes.
 * §2 — IL SURVIT À L'OUVERTURE D'UN ONGLET NEUF, et le journal
 *      commence AVANT tout code d'application.
 * §3 — DÉSARMÉES, LES SONDES NE COÛTENT RIEN : aucune écriture, aucun
 *      écouteur, aucune enveloppe sur `history`, aucun attribut.
 *
 * ⚠️ 390 × 844, densité 3, `hasTouch`, identité d'un iPhone.
 */
import {
  BASE,
  bilan,
  lire,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

/* ==================================================================
 * §1 — UNE SEULE ÉCRITURE
 * ================================================================== */
titre("§1 — un seul mécanisme d'armement pour les trois sondes");

const regle = lire("src/lib/sondes-armees.ts");
verif(
  "les trois sondes sont nommées une fois",
  /export const SONDES = \["historique", "retour", "clic"\]/.test(regle)
);
verif(
  "l'armement vit dans la mémoire LOCALE, pas celle de l'onglet",
  /localStorage\.setItem\(CLE_ARMEMENT/.test(regle) &&
    !/sessionStorage/.test(regle),
  "c'est ce qui le fait survivre à un onglet neuf"
);
for (const [fichier, nom] of [
  ["src/components/SondeHistorique.tsx", "historique"],
  ["src/components/SondeRetour.tsx", "retour"],
  ["src/components/SondeClic.tsx", "clic"],
]) {
  const source = sansNotes(lire(fichier));
  verif(
    `la sonde « ${nom} » passe par l'écriture commune`,
    new RegExp(`sondeArmee\\("${nom}"\\)`).test(source) &&
      !/URLSearchParams\([^)]*\)\.has\("sonde-/.test(source),
    "plus aucun armement par l'adresse dans le composant"
  );
}
verif(
  "chaque panneau porte un bouton DÉSARMER",
  /BoutonDesarmer/.test(lire("src/components/SondeHistorique.tsx")) &&
    /BoutonDesarmer/.test(lire("src/components/SondeClic.tsx")) &&
    /desarmerLesSondes\(\)/.test(lire("src/components/SondeRetour.tsx")),
  "sans avoir à taper une adresse"
);

const script = sansNotes(lire("src/lib/script-avant-peinture.ts"));
verif(
  "le script d'avant peinture lit l'armement, et il ne le recopie pas",
  /armementPourLeScript\(\)/.test(script) &&
    /export function armementPourLeScript/.test(regle)
);
verif(
  "…et il démarre le journal de l'historique, fabriqué par son module",
  /amorceDuJournalPourLeScript\(\)/.test(script) &&
    /export function amorceDuJournalPourLeScript/.test(
      lire("src/lib/journal-historique.ts")
    )
);
verif(
  "le journal survit lui aussi au changement d'onglet",
  /localStorage\.getItem\(CLE\)/.test(lire("src/lib/journal-historique.ts")),
  "mémoire locale, plus mémoire d'onglet"
);

/* ==================================================================
 * §2 et §3 — LA MESURE
 * ================================================================== */
const { nav, ctx } = await ouvrirLeNavigateur(
  "p343",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3, userAgent: UA_IPHONE }
);

/** Ce qu'un onglet voit de l'armement, et ce que le site a écrit. */
const ETAT = () => ({
  marque: document.documentElement.dataset.sondes ?? "(aucune)",
  armement: localStorage.getItem("roswel:sondes-armees"),
  journal: JSON.parse(localStorage.getItem("roswel:journal-historique") ?? "[]")
    .length,
  //  ⚠️ ON NE TESTE PAS « `pushState` est-il natif ? » : le routeur de
  //  Next l'enveloppe LUI AUSSI, sur toutes les pages, armées ou non
  //  (mesuré). Le seul témoin de NOTRE enveloppe est la marque que
  //  l'amorce pose sur `window`.
  enveloppe: Boolean(window.__roswelJournalAmorce),
});

titre("§3 — désarmées, les sondes ne coûtent rien");
{
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const etat = await p.evaluate(ETAT);
  verif(
    "aucune marque sur <html>",
    etat.marque === "(aucune)",
    `marque : ${etat.marque}`
  );
  verif("aucune écriture d'armement", etat.armement === null);
  verif("aucun journal écrit", etat.journal === 0);
  verif(
    "`history` n'est PAS enveloppé",
    etat.enveloppe === false,
    "aucun écouteur, aucune enveloppe"
  );
  await p.close();
}

titre("§2 — armé une fois, il survit à un onglet neuf");
{
  //  ON ARME, UNE FOIS, PAR L'ADRESSE.
  const p = await ctx.newPage();
  await p.goto(`${BASE}/?sonde-historique=1`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const arme = await p.evaluate(ETAT);
  verif(
    "l'armement est écrit dans la mémoire locale",
    arme.armement === "historique",
    `armement : ${arme.armement}`
  );
  verif("la marque est posée sur <html>", arme.marque.includes("historique"));
  verif(
    "`history` est enveloppé, et le journal a commencé",
    arme.enveloppe === true && arme.journal > 0,
    `${arme.journal} ligne(s)`
  );
  await p.close();

  //  UN ONGLET NEUF, À L'ADRESSE NUE — c'est tout l'objet de la passe.
  const q = await ctx.newPage();
  await q.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await q.waitForTimeout(1200);
  const neuf = await q.evaluate(ETAT);
  verif(
    "ONGLET NEUF, ADRESSE NUE : la sonde est toujours armée",
    neuf.marque.includes("historique"),
    `marque : ${neuf.marque}`
  );
  verif(
    "…et le journal continue là où il en était",
    neuf.journal > arme.journal,
    `${arme.journal} → ${neuf.journal} ligne(s)`
  );
  //  LA PREMIÈRE LIGNE DE CE DOCUMENT VIENT DU SCRIPT, pas de React.
  const premiere = await q.evaluate(() => {
    const l = JSON.parse(
      localStorage.getItem("roswel:journal-historique") ?? "[]"
    );
    const i = l.map((x) => x.quoi).lastIndexOf("DOCUMENT OUVERT (avant peinture)");
    return i >= 0 ? l[i].qui : "(absente)";
  });
  verif(
    "LE JOURNAL COMMENCE AVANT TOUT CODE D'APPLICATION",
    premiere === "script",
    `origine de la première ligne du document : ${premiere}`
  );

  //  ON DÉSARME, comme le bouton le fait.
  await q.evaluate(() => {
    delete document.documentElement.dataset.sondes;
    localStorage.removeItem("roswel:sondes-armees");
  });
  const r = await ctx.newPage();
  await r.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await r.waitForTimeout(1000);
  const apres = await r.evaluate(ETAT);
  verif(
    "DÉSARMÉ : un onglet neuf ne pose plus rien",
    apres.marque === "(aucune)" && apres.enveloppe === false,
    `marque : ${apres.marque} · enveloppe : ${apres.enveloppe}`
  );
  await q.close();
  await r.close();
}

await nav.close();
process.exit(bilan());
