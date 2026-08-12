/**
 * LE BANC DE LA PASSE Nº 225 — UNE SEULE LARGEUR (390 px)
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE,
 * jamais le rendu de WebKit.
 *
 * LES CONTRÔLES DU §6 :
 *   1. nom COURT → le bloc nom + sous-titre est centré sur la photo ;
 *   2. nom LONG → son sommet s'aligne au pixel sur le haut de la
 *      photo, le reste continue dessous, jamais au-dessus ;
 *   3. les marges de la photo : 32 px au-dessus, 32 px au-dessous,
 *      égales ;
 *   4. la fenêtre d'adresse (smartphone) : centrée, son liseré, UNE
 *      seule capsule rose, fermeture par le voile ;
 *   5. le verre : les deux lignes littérales dans globals.css, sans
 *      `@supports`, sans `var()` dans le filtre.
 *
 * Il se lance comme les autres :  node tests/verif-p225.mjs
 * (le site doit tourner sur http://localhost:3000).
 */

import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await contexte.newPage();

/* ==================================================================
 * §4/§5 — LE VERRE, LU À LA SOURCE
 * ================================================================== */
titre("§4 — les deux lignes de verre, littérales");
{
  const css = lire("src/app/globals.css");
  const bloc = css.match(/\[data-verre-fenetre\]\s*\{[^}]+\}/)?.[0] ?? "";
  verif("la règle [data-verre-fenetre] existe", bloc !== "");
  //  ⚠️ VALEURS DE LA Nº 227-§6 (blur 30, saturate 180 — elles
  //  valaient 24/150 à la nº 225) : le contrôle suit la dernière
  //  demande, la MÉCANIQUE des deux lignes littérales est la même.
  verif(
    "la ligne PRÉFIXÉE est écrite littéralement",
    bloc.includes("-webkit-backdrop-filter: blur(30px) saturate(180%);")
  );
  verif(
    "la ligne NON préfixée aussi, après elle",
    bloc.includes("\n  backdrop-filter: blur(30px) saturate(180%);") &&
      bloc.indexOf("-webkit-backdrop-filter") <
        bloc.lastIndexOf("  backdrop-filter:")
  );
  verif("aucun var() dans le filtre", !/backdrop-filter:[^;]*var\(/.test(bloc));
  //  Le piège du @supports : la règle ne doit pas vivre dedans.
  const avant = css.slice(0, css.indexOf("[data-verre-fenetre]"));
  const ouvertures = (avant.match(/@supports[^{]*\{/g) ?? []).length;
  verif(
    "la règle n'est enfermée dans aucun @supports",
    ouvertures === 0 ||
      (avant.match(/\}/g) ?? []).length >= ouvertures * 2
  );
}

/* ==================================================================
 * LA FICHE DE DÉMONSTRATION — l'identité et la fenêtre d'adresse
 * ================================================================== */
titre("§1, §2, §3 — l'identité à 390 px");
let fiche = false;
try {
  await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.waitForSelector("main h1", { timeout: 30000 });
  //  ⚠️ ON LAISSE L'HYDRATATION FINIR avant d'injecter quoi que ce
  //  soit : React ADOPTE le DOM existant et corrige les textes qui ne
  //  correspondent pas — un nom injecté trop tôt est silencieusement
  //  remis, et le banc mesure alors le nom court en croyant mesurer le
  //  long (constaté au premier passage de ce banc).
  await page.waitForTimeout(2500);
  fiche = true;
} catch {
  fiche = false;
}

if (!fiche) {
  nonJoue("§1 à §4", "la fiche de démonstration n'a pas répondu");
} else {
  /** Les boîtes de la photo et du bloc de texte. */
  //  ⚠️ ON MESURE LE CONTENU (du haut du nom au bas du sous-titre),
  //  jamais la boîte : celle-ci porte `min-height` = photo, ses bords
  //  seraient donc toujours alignés — un contrôle qui ne peut pas
  //  échouer ne contrôle rien.
  const mesures = () =>
    page.evaluate(() => {
      const h1 = document.querySelector("main h1");
      const sousTitre = h1?.nextElementSibling;
      const photo = document.querySelector('main span[class*="h-[92px]"]');
      if (!h1 || !sousTitre || !photo) return null;
      const bp = photo.getBoundingClientRect();
      const haut = h1.getBoundingClientRect().top;
      const bas = sousTitre.getBoundingClientRect().bottom;
      return {
        photoHaut: bp.top,
        photoBas: bp.bottom,
        photoCentre: (bp.top + bp.bottom) / 2,
        blocHaut: haut,
        blocBas: bas,
        blocCentre: (haut + bas) / 2,
        texteHaut: haut,
      };
    });

  //  §2a — NOM COURT (celui de la démonstration) : centré sur la photo.
  const court = await mesures();
  verif("la fiche expose photo et bloc de texte", court !== null);
  if (court) {
    verif(
      "nom court : le bloc est centré sur la photo (± 1 px)",
      Math.abs(court.blocCentre - court.photoCentre) <= 1,
      `centres ${Math.round(court.blocCentre)} / ${Math.round(court.photoCentre)}`
    );
    verif(
      "nom court : le texte ne dépasse pas le haut de la photo",
      court.texteHaut >= court.photoHaut - 0.5
    );
  }

  //  §2b — NOM LONG, injecté dans le même DOM : la mécanique CSS
  //  réelle est mesurée, pas simulée.
  await page.evaluate(() => {
    const h1 = document.querySelector("main h1");
    if (h1) {
      h1.textContent =
        "Un nom de studio démesurément long qui occupe deux pleines lignes de titre";
      //  Et un sous-titre qui s'étale : c'est le cumul des deux qui
      //  fait dépasser la hauteur de la photo — le nom seul est borné
      //  à deux lignes (nº 222-§1d), c'est voulu.
      const sousTitre = h1.nextElementSibling;
      if (sousTitre) {
        sousTitre.textContent =
          "EN SALON · RÉSIDENT · UNE ÉTIQUETTE VOLONTAIREMENT TRÈS LONGUE POUR LA MESURE";
      }
    }
  });
  await page.waitForTimeout(120);
  const long = await mesures();
  if (long) {
    verif(
      "nom long : le sommet du bloc s'aligne AU PIXEL sur le haut de la photo",
      Math.abs(long.blocHaut - long.photoHaut) <= 0.5,
      `hauts ${long.blocHaut.toFixed(1)} / ${long.photoHaut.toFixed(1)}`
    );
    verif(
      "nom long : le texte ne dépasse JAMAIS au-dessus",
      long.texteHaut >= long.photoHaut - 0.5
    );
    verif(
      "nom long : la suite continue SOUS le bas de la photo",
      long.blocBas > long.photoBas
    );
  }

  //  §1 — LES MARGES DE LA PHOTO : 32 px au-dessus et au-dessous, égales.
  //  Lues dans les classes : la mesure d'écart entre boîtes dépendrait
  //  du contenu de la rangée du haut, pas de la marge déclarée.
  {
    const contenu = lire("src/components/ContenuFiche.tsx");
    verif(
      "32 px AU-DESSUS de la photo (mt-8 sur le bloc identité)",
      /mt-8 flex items-start gap-5/.test(contenu)
    );
    verif(
      //  ⚠️ La nº 227-§4 a coupé le bloc en DEUX LIGNES (flex-col) :
      //  le mt-8 — la marge basse de la photo — reste, c'est lui
      //  qu'on contrôle.
      "32 px AU-DESSOUS, égaux (mt-8 sur le bloc des liens)",
      /mt-8 flex flex-col items-start/.test(contenu)
    );
  }

  /* ================================================================
   * §3/§4 — LA FENÊTRE D'ADRESSE, sur smartphone
   * ================================================================ */
  titre("§3 — la fenêtre d'adresse (smartphone)");
  //  L'adresse de la démonstration est complète (4 rue des Capucins).
  const lien = page.locator('a[href*="google.com/maps"]').first();
  if ((await lien.count()) === 0) {
    nonJoue("§3", "aucune adresse cliquable sur cette fiche");
  } else {
    //  ⚠️ L'APPAREIL DOIT ÊTRE « mobile » : c'est le script d'avant
    //  peinture qui le pose d'après `pointer: coarse`. On le vérifie
    //  AVANT de cliquer — sinon le clic navigue et le banc accuse la
    //  fenêtre à tort.
    const appareil = await page.evaluate(
      () => document.documentElement.dataset.appareil ?? "(absent)"
    );
    verif("l'émulation est bien un appareil « mobile »", appareil === "mobile", appareil);
    await lien.scrollIntoViewIfNeeded();
    await lien.click();
    const fenetre = page.locator("[data-verre-fenetre]");
    await fenetre.waitFor({ timeout: 5000 }).catch(() => {});
    verif(
      "le clic OUVRE la fenêtre (pas de navigation)",
      (await fenetre.count()) === 1,
      page.url().includes("google") ? `NAVIGUÉ vers ${page.url()}` : ""
    );

    if ((await fenetre.count()) === 1) {
      const geometrie = await page.evaluate(() => {
        const plaque = document.querySelector("[data-verre-fenetre]");
        if (!plaque) return null;
        const boite = plaque.getBoundingClientRect();
        const style = getComputedStyle(plaque);
        const roses = [
          ...plaque.querySelectorAll("a, button"),
        ].filter((n) => {
          const fond = getComputedStyle(n).backgroundColor;
          //  ⚠️ VERRE TEINTÉ depuis la nº 227-§6 : le rose est
          //  TRANSLUCIDE (rgba), plus jamais un aplat opaque.
          return fond.startsWith("rgba(238, 61, 111");
        });
        return {
          centreX: boite.left + boite.width / 2,
          centreY: boite.top + boite.height / 2,
          fenetreX: window.innerWidth / 2,
          fenetreY: window.innerHeight / 2,
          liseré: style.boxShadow !== "none" || style.outlineWidth !== "0px",
          roses: roses.length,
          rosePleineLargeur:
            roses.length === 1
              ? Math.abs(
                  roses[0].getBoundingClientRect().width -
                    (boite.width -
                      parseFloat(style.paddingLeft) -
                      parseFloat(style.paddingRight))
                ) <= 1
              : false,
        };
      });
      verif(
        "la fenêtre est CENTRÉE sur la page",
        geometrie !== null &&
          Math.abs(geometrie.centreX - geometrie.fenetreX) <= 2 &&
          Math.abs(geometrie.centreY - geometrie.fenetreY) <= 2,
        geometrie
          ? `centre ${Math.round(geometrie.centreX)}×${Math.round(geometrie.centreY)}`
          : ""
      );
      verif("elle porte son LISERÉ", Boolean(geometrie?.liseré));
      verif(
        "UNE SEULE capsule rose pleine — « Ouvrir dans Google Maps »",
        geometrie?.roses === 1,
        `${geometrie?.roses ?? 0} trouvée(s)`
      );
      verif(
        "et elle occupe toute la largeur de la fenêtre",
        Boolean(geometrie?.rosePleineLargeur)
      );
      verif(
        "« Copier » est là, sans rose",
        (await fenetre.getByRole("button", { name: /^Copi/ }).count()) === 1
      );
      verif(
        //  ⚠️ Le mot nu du bas est devenu LA CROIX en haut à droite
        //  (nº 229-§5) — même nom accessible, même fermeture.
        "« Fermer » est là (la croix, nº 229-§5)",
        (await fenetre.getByRole("button", { name: "Fermer" }).count()) === 1
      );

      //  LA FERMETURE PAR LE VOILE — un appui À CÔTÉ de la plaque :
      //  dans l'angle, là où seul le voile vit (le centre du voile est
      //  recouvert par la plaque, Playwright y échouerait — et un
      //  doigt réel n'appuie pas à travers une plaque non plus).
      await page
        .locator('button[aria-label="Fermer"]')
        .first()
        .click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(250);
      verif(
        "un appui à côté referme",
        (await page.locator("[data-verre-fenetre]").count()) === 0
      );
    }
  }
}

await navigateur.close();
bilan();
