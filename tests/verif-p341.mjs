/**
 * BANC DE LA PASSE Nº 341 — ANNULATION DE LA Nº 340
 * ==================================================================
 * La nº 340 déplaçait la restitution de position dans un effet de MISE
 * EN PAGE. Sur l'iPhone du propriétaire, cela EXPULSAIT DU SITE : un
 * retour depuis une carte, en première page d'un onglet neuf, à
 * l'adresse nue, ne revenait plus sur l'accueil. La passe est annulée
 * ENTIÈREMENT — pas corrigée, pas améliorée.
 *
 * Ce banc ne vérifie donc qu'une chose : l'annulation est complète, et
 * le retour depuis une carte revient bien sur l'accueil.
 *
 * ⚠️ CE QUE CE BANC NE PROUVE PAS : le défaut du propriétaire ne se
 * reproduit pas sur Chromium — essayé sur son chemin exact (onglet
 * neuf, adresse nue, entrée par `location.replace` depuis about:blank).
 * La preuve de l'annulation est donc la SOURCE, identique au caractère
 * près à celle de la nº 337, et c'est ce que la première section
 * mesure.
 *
 * ⚠️ 390 × 844, densité 3, `hasTouch`, identité d'un iPhone.
 */
import {
  BASE,
  bilan,
  lire,
  nonJoue,
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
 * §1 — L'ANNULATION EST COMPLÈTE
 * ================================================================== */
titre("§1 — la nº 340 est annulée, dans la source");

const memoire = sansNotes(lire("src/components/MemoireNavigation.tsx"));
verif(
  "la restitution est redevenue un effet ORDINAIRE",
  /useEffect\(\(\) => \{[\s\S]{0,4000}rendreLaPlace\(url\)/.test(memoire),
  "comme à la nº 337"
);
verif(
  "plus aucun effet de mise en page dans ce fichier",
  !/useEffetAvantPeinture/.test(memoire) && !/useLayoutEffect/.test(memoire)
);
verif(
  "le banc de la nº 340 est parti avec elle",
  (() => {
    try {
      lire("tests/verif-p340.mjs");
      return false;
    } catch {
      return true;
    }
  })(),
  "une annulation entière ne laisse pas son banc derrière elle"
);
verif(
  "et RIEN D'AUTRE n'a bougé : `DefilementEnHaut` garde le sien",
  /const useEffetAvantPeinture =/.test(
    sansNotes(lire("src/components/DefilementEnHaut.tsx"))
  ),
  "il l'avait depuis la nº 143-§5, la nº 340 n'y avait pas touché"
);

/* ==================================================================
 * §2 — LE RETOUR REVIENT BIEN SUR L'ACCUEIL
 * ================================================================== */
titre("§2 — le retour depuis une carte revient sur l'accueil");

const { nav, ctx } = await ouvrirLeNavigateur(
  "p341",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3, userAgent: UA_IPHONE }
);

/**
 * LE CHEMIN DU PROPRIÉTAIRE, AUSSI FIDÈLEMENT QUE POSSIBLE : onglet
 * NEUF, adresse NUE, la mosaïque en PREMIÈRE page.
 * ⚠️ `page.goto` laisserait `about:blank` derrière lui et fausserait la
 * pile (leçon de la nº 332) : on entre par `location.replace`.
 */
async function allerRetour(adresse) {
  const p = await ctx.newPage();
  await p.evaluate((u) => location.replace(u), `${BASE}${adresse}`);
  await p.waitForLoadState("networkidle");
  await p.waitForTimeout(1800);
  const lien = p.locator('main a[href^="/tatoueur/"]').first();
  if ((await lien.count()) === 0) {
    await p.close();
    return null;
  }
  await lien.evaluate((el) => el.click());
  await p.waitForTimeout(2200);
  const surLaFiche = await p.evaluate(() => location.pathname);
  await p.goBack({ waitUntil: "commit" }).catch(() => {});
  await p.waitForTimeout(2500);
  const apres = await p
    .evaluate(() => ({
      ou: location.pathname + location.search,
      cartes: document.querySelectorAll('main a[href^="/tatoueur/"]').length,
      dansLeSite: location.origin === new URL(document.baseURI).origin,
    }))
    .catch(() => ({ ou: "(page perdue)", cartes: 0, dansLeSite: false }));
  await p.close();
  return { surLaFiche, ...apres };
}

for (const adresse of ["/", "/?sonde-retour=1"]) {
  const r = await allerRetour(adresse);
  if (!r) {
    nonJoue(`§2 · ${adresse}`, "aucune carte servie sur l'accueil");
    continue;
  }
  verif(
    `${adresse} — on est bien allé sur une fiche`,
    r.surLaFiche.startsWith("/tatoueur/"),
    r.surLaFiche
  );
  verif(
    `${adresse} — LE RETOUR RAMÈNE SUR L'ACCUEIL, avec ses cartes`,
    r.ou === adresse && r.cartes > 0 && r.dansLeSite,
    `arrivée : ${r.ou} · ${r.cartes} carte(s)`
  );
}

await nav.close();
process.exit(bilan());
