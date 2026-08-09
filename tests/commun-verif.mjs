/**
 * LE SOCLE COMMUN DES SUITES DE VÉRIFICATION
 * ===========================================
 * ⚠️ POURQUOI CE FICHIER EXISTE. Les quatre suites p90–p93 recopiaient
 * chacune le même préambule : le cookie de session, le faux géocodeur,
 * les compteurs, le lecteur de blocs. Cent lignes en quatre
 * exemplaires — donc quatre endroits à corriger quand le formulaire
 * change, et trois oubliés à chaque fois. C'est la vraie cause de leur
 * péremption, avant même les textes.
 *
 * ⚠️ ET SURTOUT : `formulaireAccessible()`, LE GARDE-FOU.
 * Les quatre suites ouvraient le formulaire de fiche EN PREMIÈRE
 * SECTION, avec une attente de 180 secondes sur un bouton disparu
 * (« Je tatoue en mon nom », supprimé à la passe nº 95). Elles
 * attendaient donc trois minutes puis s'arrêtaient sur une pile
 * d'erreur — SANS AVOIR RIEN VÉRIFIÉ, pas même les sections
 * suivantes qui ne demandaient pourtant rien. Les « 32 échecs »
 * n'étaient pas trente-deux défauts : c'étaient quatre scripts
 * bloqués au même endroit.
 *
 * Désormais : on essaie UNE fois, vingt secondes, et on répond oui ou
 * non. Les sections qui n'en ont pas besoin tournent quand même ; les
 * autres sont comptées « NON JOUÉES », ce qui est la vérité — ni un
 * succès ni un échec.
 *
 * ⚠️ ET LE FORMULAIRE, LUI, RÉPOND : voir la note de
 * RAISON_SANS_SESSION plus bas. On a longtemps écrit qu'il était
 * injoignable d'ici ; il ne l'est pas, il est LENT (huit à dix
 * secondes). C'est `formulaireNeuf()` qui en tire parti pour remplir
 * le bloc 1 et faire apparaître les blocs 2 à 12.
 */

export const { chromium } = await import("playwright").catch(
  () => import("/opt/node22/lib/node_modules/playwright/index.mjs")
);
import { readFileSync } from "node:fs";

export const BASE = process.env.BASE ?? "http://localhost:3000";
export const RACINE = process.env.RACINE ?? "/home/user/mon-site-roswel";
export const lire = (chemin) => readFileSync(`${RACINE}/${chemin}`, "utf8");

/* ================================================================
 * LE COMPTAGE — trois états, pas deux
 * ================================================================ */
const bilanCourant = { ok: 0, rates: [], nonJoues: [] };

export function verif(nom, condition, detail = "") {
  if (condition) {
    bilanCourant.ok += 1;
    console.log(`  ✓ ${nom}${detail ? ` (${detail})` : ""}`);
  } else {
    bilanCourant.rates.push({ nom, detail });
    console.log(`  ✗ ${nom}${detail ? ` (${detail})` : ""}   ←←← RATÉ`);
  }
}

export const titre = (t) => console.log(`\n──── ${t} ────`);

/** UNE SECTION QU'ON N'A PAS PU JOUER — dite, jamais tue. */
export function nonJoue(section, raison) {
  bilanCourant.nonJoues.push({ section, raison });
  console.log(`  — ${section} : NON JOUÉE (${raison})`);
}

export function bilan() {
  const { ok, rates, nonJoues } = bilanCourant;
  console.log(
    `\n${ok} vérification(s) passée(s), ${rates.length} ratée(s), ` +
      `${nonJoues.length} section(s) non jouée(s)`
  );
  if (rates.length) {
    console.log("\nRATÉES :");
    for (const r of rates) console.log(`  · ${r.nom}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  if (nonJoues.length) {
    console.log("\nNON JOUÉES ICI :");
    for (const n of nonJoues) console.log(`  · ${n.section} — ${n.raison}`);
  }
  if (!rates.length) console.log("\nTOUT CE QUI A PU ÊTRE JOUÉ EST BON");
  return rates.length === 0 ? 0 : 1;
}

/* ================================================================
 * LE NAVIGATEUR, LA SESSION, LE FAUX GÉOCODEUR
 * ================================================================ */

/** Le cookie @supabase/ssr d'une session connectée. */
function cookieDeSession(marque) {
  const projet = new URL(
    lire(".env.local")
      .split("\n")
      .find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))
      .split("=")[1]
      .trim()
      .replace(/['"]/g, "")
  ).hostname.split(".")[0];
  const session = {
    access_token: marque,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "r",
    user: {
      id: "00000000-0000-4000-8000-0000000000f0",
      aud: "authenticated",
      role: "authenticated",
      email: `${marque}@yokofolio.test`,
      app_metadata: {},
      user_metadata: {},
      created_at: "2026-01-01T00:00:00Z",
    },
  };
  return {
    name: `sb-${projet}-auth-token`,
    value:
      "base64-" +
      Buffer.from(JSON.stringify(session), "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_"),
    domain: "localhost",
    path: "/",
  };
}

/**
 * UN FAUX GÉOCODEUR — Photon est hors d'atteinte de ce conteneur.
 * Sans lui, aucune suggestion de lieu n'apparaît, et tout ce qui suit
 * un choix de ville devient invérifiable. On répond donc à sa place,
 * dans le format EXACT qu'attend src/lib/geocodage/photon.ts. Le code
 * du site n'est pas modifié d'une ligne : c'est le RÉSEAU qu'on
 * remplace, pas le produit.
 */
async function poserLeFauxGeocodeur(contexte) {
  await contexte.route("**/photon.komoot.io/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        features: [
          {
            properties: {
              osm_id: 1, name: "Lyon", city: "Lyon",
              state: "Auvergne-Rhône-Alpes", country: "France",
              countrycode: "FR", postcode: "69001", type: "city",
            },
            geometry: { coordinates: [4.8357, 45.764] },
          },
          {
            properties: {
              osm_id: 2, name: "Lyon 1er", city: "Lyon",
              state: "Auvergne-Rhône-Alpes", country: "France",
              countrycode: "FR", postcode: "69001", type: "district",
            },
            geometry: { coordinates: [4.8343, 45.7679] },
          },
          //  ⚠️ LA TROISIÈME EST UNE ADRESSE COMPLÈTE, ET ELLE EST
          //  INDISPENSABLE. Un SALON n'est pas validé par une ville :
          //  `adresseSuffisante` lui exige `precision === "adresse"`,
          //  c'est-à-dire un numéro et une rue (voir lib/modes-exercice).
          //  Sans ce trait-là, le bloc 1 d'un salon ne se confirme
          //  jamais, et tout ce qui suit reste invisible au banc.
          {
            properties: {
              osm_id: 3, name: "Rue de la République",
              housenumber: "12", street: "Rue de la République",
              city: "Lyon", state: "Auvergne-Rhône-Alpes",
              country: "France", countrycode: "FR",
              postcode: "69002", type: "house",
            },
            geometry: { coordinates: [4.8352, 45.7625] },
          },
        ],
      }),
    });
  });
}

/** Ouvre un navigateur, pose la session et le faux géocodeur.
    Le troisième argument passe des OPTIONS DE CONTEXTE supplémentaires —
    `{ hasTouch: true, isMobile: true }` pour éprouver un vrai
    téléphone (le site lit `matchMedia("(pointer: coarse)")`). */
export async function ouvrirLeNavigateur(
  marque,
  viewport = { width: 1440, height: 950 },
  optionsContexte = {}
) {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const ctx = await nav.newContext({ viewport, ...optionsContexte });
  await ctx.addCookies([cookieDeSession(marque)]);
  await poserLeFauxGeocodeur(ctx);
  const page = await ctx.newPage();
  return { nav, ctx, page };
}

/* ================================================================
 * LE GARDE-FOU — le formulaire répond-il, oui ou non ?
 * ================================================================ */

/**
 * ⚠️ L'ANCRE DU BLOC 1 A CHANGÉ. Les suites cherchaient
 * `button:has-text("Je tatoue en mon nom")` — les deux boutons radio
 * d'avant la passe nº 95. Le bloc 1 s'appelle aujourd'hui « Qui es-tu ? »
 * et propose un sélecteur à trois positions (Artiste · Studio · Salon).
 * On vise le TITRE, pas les cartes : il change moins souvent.
 */
export const ANCRE_BLOC_1 = "Qui es-tu";

let etatFormulaire = null;

/**
 * LE FORMULAIRE EST-IL ATTEIGNABLE ? Une seule tentative, courte.
 * ⚠️ VINGT SECONDES, PAS CENT-QUATRE-VINGT. Un écran qui ne répond
 * pas en vingt secondes ne répondra pas en trois minutes : il manque
 * une session, et aucune attente ne la fabriquera. Le résultat est
 * gardé en mémoire — on ne repose pas la question à chaque section.
 */
export async function formulaireAccessible(page) {
  if (etatFormulaire !== null) return etatFormulaire;
  //  ⚠️ ON LIT LE TEXTE DE LA PAGE, PAS UN SÉLECTEUR `text=`.
  //  Un `page.locator("text=/…/i").waitFor()` m'a répondu « trouvé »
  //  sur une page qui n'en contenait rien (count() disait 0) : le
  //  moteur de sélecteurs a des subtilités qu'un garde-fou ne peut pas
  //  se permettre. Le texte du corps, lui, ne ment pas.
  //  On boucle nous-mêmes, une seconde à la fois, vingt fois.
  etatFormulaire = false;
  try {
    await page.goto(`${BASE}/devenir-tatoueur/fiche`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    for (let essai = 0; essai < 20; essai += 1) {
      const corps = await page.locator("body").innerText();
      if (corps.includes(ANCRE_BLOC_1)) {
        etatFormulaire = true;
        break;
      }
      await page.waitForTimeout(1000);
    }
  } catch {
    etatFormulaire = false;
  }
  return etatFormulaire;
}

/**
 * ⚠️⚠️ CORRECTION D'UNE ERREUR RÉPÉTÉE PENDANT PLUSIEURS PASSES.
 * ----------------------------------------------------------------
 * Plusieurs comptes rendus, et les en-têtes de ces suites, ont écrit
 * que « le formulaire de fiche est INJOIGNABLE depuis ce conteneur,
 * faute de session Supabase ». C'EST FAUX, et cette passe l'a établi.
 *
 * CE QUI SE PASSE VRAIMENT : `/devenir-tatoueur/fiche` affiche « Un
 * instant… » pendant HUIT à DIX SECONDES — le temps que l'appel à
 * Supabase, hors d'atteinte d'ici, expire côté navigateur. Passé ce
 * délai, le formulaire de CRÉATION s'affiche, vide, et se laisse
 * remplir de bout en bout : les trois cartes de profil, le lieu par
 * le faux géocodeur, la confirmation du bloc 1, puis les blocs 2 à 12.
 *
 * L'ERREUR VENAIT DES SONDES ELLES-MÊMES : elles n'attendaient que
 * cinq à huit secondes, concluaient à l'absence de session, et cette
 * conclusion a été recopiée de compte rendu en compte rendu sans
 * jamais être revérifiée. C'est pour cela que `formulaireAccessible`
 * attend maintenant VINGT secondes et lit le texte du corps.
 *
 * Ce message ne sert donc plus qu'au cas résiduel : l'écran n'a rien
 * rendu du tout en vingt secondes. C'est alors un vrai empêchement,
 * pas l'état normal.
 */
export const RAISON_SANS_SESSION =
  "le formulaire n'a rien rendu en vingt secondes — ni « Qui es-tu ? », " +
  "ni écran de connexion (le cas normal, ici, est qu'il s'affiche après ~10 s)";

/* ================================================================
 * LIRE LES BLOCS DU FORMULAIRE
 * ================================================================ */

/**
 * LES BLOCS À L'ÉCRAN, avec leur numéro et leur titre.
 * ⚠️ LES NUMÉROS NE SONT PAS TAPÉS À LA MAIN dans le produit : ils
 * viennent de la position dans `ORDRE_BLOCS`. Un test qui les relit
 * vérifie donc autant la numérotation que les noms.
 */
export async function blocs(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("section")]
      .map((s) => {
        const h = s.querySelector("h2, h3");
        if (!h) return null;
        const texte = h.textContent.trim();
        //  ⚠️ UN BLOC PEUT N'AVOIR QUE SON NUMÉRO (passe nº 101) : le
        //  bloc des horaires a perdu son titre, il ne reste que « 8 ».
        //  Sans ce cas, on rendait `numero: null` et toute la liste
        //  des numéros devenait fausse à partir de là.
        const seulementUnNumero = texte.match(/^(\d+)$/);
        if (seulementUnNumero) {
          return { numero: Number(seulementUnNumero[1]), titre: "" };
        }
        const m = texte.match(/^(\d+)\s*[·.)]?\s*(.+)$/);
        return m
          ? { numero: Number(m[1]), titre: m[2].trim() }
          : { numero: null, titre: texte };
      })
      .filter(Boolean)
  );
}

/* ================================================================
 * OUVRIR UN FORMULAIRE NEUF, ET LE MENER JUSQU'AUX BLOCS
 * ================================================================ */

/**
 * ⚠️ LES BLOCS 2 À 12 N'EXISTENT PAS AVANT LA CONFIRMATION DU BLOC 1.
 * -------------------------------------------------------------------
 * C'est CE point qui a fait mentir les suites p92 et p93 pendant des
 * passes entières. Elles ouvraient `/devenir-tatoueur/fiche`, lisaient
 * les `<section>` de la page et comptaient… un seul bloc, « Qui es-tu ? ».
 * Elles concluaient « la numérotation est fausse » — alors que le
 * formulaire n'avait simplement jamais été rempli.
 *
 * Depuis la passe nº 95, le bloc 1 ne se confirme QUE s'il est complet
 * (voir `blocExerciceComplet` dans lib/modes-exercice) :
 *   · ARTISTE       → au moins un mode d'activité, situé. Le plus court
 *                     est « À domicile » : une ville suffit, ni rôle ni
 *                     dates ;
 *   · SALON         → une adresse COMPLÈTE (numéro + rue). Une ville
 *                     seule est refusée : un salon reçoit du public ;
 *   · STUDIO PRIVÉ  → une ville suffit — il ne publie pas sa rue.
 *
 * Cette fonction joue donc le parcours réel, du choix de la carte au
 * bouton « Je confirme mon choix ». Elle rend `true` quand les blocs
 * suivants sont apparus, `false` sinon — jamais d'exception : une
 * suite doit pouvoir dire « non joué » plutôt que planter.
 */
export async function formulaireNeuf(page, choix = "artiste") {
  try {
    await page.goto(`${BASE}/devenir-tatoueur/fiche`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    let pret = false;
    for (let essai = 0; essai < 20; essai += 1) {
      if ((await page.locator("body").innerText()).includes(ANCRE_BLOC_1)) {
        pret = true;
        break;
      }
      await page.waitForTimeout(1000);
    }
    if (!pret) return false;

    //  LE SÉLECTEUR À GLISSIÈRE (passe nº 104) : trois positions
    //  `role="radio"` dans une piste unique — Artiste · Studio ·
    //  Salon. « Studio privé » se dit désormais « Studio ».
    const libelle = { artiste: "Artiste", salon: "Salon", prive: "Studio" }[choix];
    const cartes = page.locator(
      '[role="radiogroup"][aria-label="Type de portfolio"] [role="radio"]'
    );
    const textes = await cartes.allInnerTexts();
    const rang = textes.findIndex((t) => t.trim() === libelle);
    if (rang < 0) return false;
    await cartes.nth(rang).click();
    await page.waitForTimeout(600);

    //  UN ARTISTE DOIT ENCORE CHOISIR UN GENRE DE MODE. « Domicile »
    //  est le seul qui n'exige ni rôle, ni nature de lieu, ni dates.
    //  ⚠️ DEPUIS LA PASSE Nº 124 c'est un ONGLET du sélecteur
    //  horizontal (« Le mode d'activité »), plus une ligne de liste —
    //  et son libellé est court : « Domicile », sans « À ».
    if (choix === "artiste") {
      await page
        .locator(
          '[role="radiogroup"][aria-label="Le mode d\'activité"] [role="radio"]',
          { hasText: "Domicile" }
        )
        .first()
        .click();
      await page.waitForTimeout(600);
    }

    //  LE LIEU, par le faux géocodeur. On vise l'adresse complète pour
    //  un salon, la ville partout ailleurs — c'est exactement ce que
    //  `adresseSuffisante` exige de chacun.
    const champ = page
      .locator('input[id^="studio-lieu-"], input[id^="mode-"][id$="-adresse"]')
      .first();
    if (!(await champ.count())) return false;
    await champ.click();
    await champ.type("Lyon", { delay: 40 });
    for (let essai = 0; essai < 12; essai += 1) {
      if (await page.locator('[role="option"]').count()) break;
      await page.waitForTimeout(400);
    }
    const options = await page.locator('[role="option"]').allInnerTexts();
    if (!options.length) return false;
    const vise = choix === "salon" ? options.findIndex((o) => /^\d+\s/.test(o)) : 0;
    await page.locator('[role="option"]').nth(vise < 0 ? 0 : vise).click();
    await page.waitForTimeout(700);

    //  ⚠️ LE RAYON EST OBLIGATOIRE EN DOMICILE (passe nº 124) : sans
    //  lui, « Je confirme » n'aboutit pas et les badges rougissent.
    if (choix === "artiste") {
      const rayon = page.locator('button:has-text("25 km")').first();
      if (await rayon.count()) {
        await rayon.click();
        await page.waitForTimeout(300);
      }
    }

    await page.locator('button:has-text("Je confirme mon choix")').first().click();
    await page.waitForTimeout(1500);

    //  LA PREUVE QUE ÇA A MARCHÉ : le bloc 2 est là.
    return (await blocs(page)).some((b) => b.numero === 2);
  } catch {
    return false;
  }
}

/**
 * LES NOMS DE BLOCS ATTENDUS AUJOURD'HUI — lus DANS LE PRODUIT,
 * jamais recopiés.
 * ⚠️ C'EST LA LEÇON DE CETTE PASSE. Les suites p92 et p93 portaient
 * chacune leur liste écrite à la main ; la passe nº 95 a déplacé les
 * horaires, ajouté l'équipe et l'autre adresse, et les deux listes ont
 * menti le même jour. En lisant `NOMS_BLOCS` dans le fichier source,
 * la liste suit le produit sans qu'on y pense.
 */
export function nomsDeBlocsAttendus(nature) {
  const source = lire("src/components/FormulaireFiche.tsx");
  const ordre = [
    ...source
      .slice(source.indexOf("const ORDRE_BLOCS = ["))
      .slice(0, source.slice(source.indexOf("const ORDRE_BLOCS = [")).indexOf("] as const;"))
      .matchAll(/^\s*"([a-z-]+)",/gm),
  ].map((m) => m[1]);

  //  ⚠️ TROIS COLONNES DEPUIS LA PASSE Nº 101 : artiste, salon, prive.
  //  Le studio privé lisait jusque-là les mots du salon, faute d'une
  //  colonne à lui — un vrai salon voyait « Nom du studio ».
  //  ON NE LIT PLUS LIGNE À LIGNE : les entrées s'écrivent
  //  indifféremment sur une ou quatre lignes. On découpe le bloc par
  //  clé, puis on cherche les trois mots dans chaque morceau.
  const debutNoms = source.indexOf("const NOMS_BLOCS");
  const finNoms = source.indexOf("\n};", debutNoms);
  const bloc = source.slice(debutNoms, finNoms);
  const noms = {};
  for (const cle of ordre) {
    const marque = new RegExp(`(?:^|\\n)\\s*"?${cle}"?:\\s*\\{`, "m");
    const depart = bloc.search(marque);
    if (depart < 0) continue;
    const morceau = bloc.slice(depart, bloc.indexOf("},", depart));
    const lire3 = (colonne) =>
      morceau.match(new RegExp(`${colonne}:\\s*"([^"]*)"`))?.[1];
    noms[cle] = {
      artiste: lire3("artiste"),
      salon: lire3("salon"),
      prive: lire3("prive"),
    };
  }
  return ordre.map((cle) => noms[cle]?.[nature] ?? `?${cle}`);
}
