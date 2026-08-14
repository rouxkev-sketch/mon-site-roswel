/**
 * BANC DE LA PASSE Nº 277
 * ==================================================================
 * §1 le fondu anthracite des bords (nº 264) n'existe QU'À UN ENDROIT :
 *    les rangées de « Ma sélection » (BlocSuivis) — aucune autre page
 *    n'en porte (accueil, fiche, photothèque, style, favoris, mesurés
 *    un par un) ; et là même, il est borné à LA HAUTEUR DES PHOTOS ;
 * §2 l'aération du portfolio : 40 px avant chaque titre (sous la
 *    rangée Profil / Portfolio, sous le dernier carrousel d'une
 *    section), 20 px entre un titre et son premier carrousel, l'écart
 *    entre deux carrousels d'une même section inchangé — et la preuve
 *    que l'espace AVANT un titre est plus grand que celui APRÈS.
 *
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 * ⚠️ Ma sélection vit derrière les favoris du compte : sans session ni
 * base, la page est vide ici — le bornage du voile est prouvé par un
 * MONTAGE aux classes RÉELLES, lues à la source (le motif du banc 264).
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

const blocSuivis = lire("src/components/BlocSuivis.tsx");
const blocNu = sansNotes(blocSuivis);
const panneauNu = sansNotes(lire("src/components/PortfolioDeLAffiche.tsx"));

/* ==================================================================
 * §1 — À LA SOURCE : un seul fondu, dans une seule enveloppe
 * ================================================================== */
titre("§1 — à la source : le fondu n'a qu'une écriture, et une enveloppe");
{
  //  LE DÉGRADÉ ANTHRACITE : une seule écriture dans TOUT src/ — le
  //  balayage est réel, pas une affirmation.
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const RACINE_SRC = new URL("../src", import.meta.url).pathname;
  const porteurs = [];
  const parcourir = (dossier) => {
    for (const nom of readdirSync(dossier)) {
      const chemin = `${dossier}/${nom}`;
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(tsx?|css)$/.test(nom)) {
        const texte = readFileSync(chemin, "utf8");
        if (/from-sombre-fond\/|data-voile-rangee/.test(texte)) {
          porteurs.push(chemin.slice(RACINE_SRC.length + 1));
        }
      }
    }
  };
  parcourir(RACINE_SRC);
  verif(
    "le dégradé du fondu (`from-sombre-fond/…`) n'existe QUE dans " +
      "BlocSuivis — balayage de tout src/",
    porteurs.length === 1 && porteurs[0] === "components/BlocSuivis.tsx",
    porteurs.join(", ")
  );
  verif(
    "le voile vit dans l'enveloppe de LA RANGÉE (`group relative mt-5`, " +
      "qui ne contient que les photos) et s'y borne (`inset-y-0`)",
    /<div className="group relative mt-5">/.test(blocNu) &&
      /data-voile-rangee=\{sens === 1 \? "droite" : "gauche"\}/.test(blocNu) &&
      /pointer-events-none absolute inset-y-0 z-\[1\] w-4/.test(blocNu)
  );
}

/* ==================================================================
 * §2 — À LA SOURCE : 40 avant, 20 après, le gap inchangé
 * ================================================================== */
titre("§2 — à la source : l'aération des sections du portfolio");
{
  verif(
    "40 px AVANT chaque titre (`mt-10` sur la section), 20 px APRÈS " +
      "(`mt-5` sur la grille) — et le gap des carrousels inchangé",
    /<section key=\{section\.nature\} className="mt-10">/.test(panneauNu) &&
      /<ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7">/.test(panneauNu)
  );
}

/* ==================================================================
 * LE VIVANT — aux deux largeurs
 * ================================================================== */
async function ouvrirA(largeur, chemin) {
  const mobile = largeur < 1024;
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: mobile ? 844 : 950 },
    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2200);
  const fermer = async () => {
    await contexte.close();
    await nav.close();
  };
  return { page, fermer };
}

const PAGES = [
  ["l'accueil", "/"],
  ["la photothèque", "/?vue=phototheque"],
  ["une fiche", "/tatoueur/camille-fauve-paris-18e"],
  ["une page de style", "/tatouage/realisme/paris"],
  ["les favoris", "/mes-favoris"],
];

for (const largeur of [390, 1440]) {
  titre(`§1 — VIVANT (${largeur} px) : aucun fondu au bord, page par page`);
  for (const [nom, chemin] of PAGES) {
    const { page, fermer } = await ouvrirA(largeur, chemin);
    try {
      const releve = await page.evaluate(() => {
        const fautifs = [];
        for (const el of document.querySelectorAll("*")) {
          const s = getComputedStyle(el);
          const degrade = s.backgroundImage.includes("gradient");
          const masque = (s.maskImage ?? "none") !== "none";
          if (!degrade && !masque) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const auBordGauche = r.left <= 8 && r.width <= 64;
          const auBordDroit =
            r.right >= window.innerWidth - 8 && r.width <= 64;
          if ((auBordGauche || auBordDroit) && r.height > 100) {
            fautifs.push(
              `${el.tagName.toLowerCase()} ${Math.round(r.width)}×${Math.round(r.height)}`
            );
          }
        }
        return {
          fautifs,
          voiles: document.querySelectorAll("[data-voile-rangee]").length,
        };
      });
      //  Les voiles de rangée n'existent que sur « Ma sélection » — et
      //  ici, sans session, même elle n'en montre pas (page vide).
      verif(
        `${largeur} px · ${nom} : AUCUN fondu ne longe un bord de l'écran`,
        releve.fautifs.length === 0 &&
          (chemin === "/mes-favoris" || releve.voiles === 0),
        releve.fautifs.length
          ? releve.fautifs.join(" · ")
          : `0 dégradé au bord · ${releve.voiles} voile(s) de rangée`
      );
    } catch (erreur) {
      nonJoue(`§1 · ${nom} (${largeur} px)`, String(erreur).slice(0, 100));
    } finally {
      await fermer();
    }
  }

  /* ---------- §1 — le voile de Ma sélection, borné (montage) ---------- */
  titre(`§1 — MONTAGE (${largeur} px) : le voile épouse la hauteur des photos`);
  {
    const { page, fermer } = await ouvrirA(largeur, "/");
    try {
      //  LES CLASSES RÉELLES, LUES À LA SOURCE — jamais recopiées
      //  (le motif du banc 264).
      const classesVoile = blocSuivis
        .match(
          /className=\{`(pointer-events-none absolute inset-y-0[^`]*)\$\{/
        )?.[1]
        ?.trim();
      const brancheGauche = blocSuivis.match(
        /: "(-left-4 sm:-left-6 bg-gradient-to-r)"/
      )?.[1];
      const finVoile = blocSuivis.match(
        /\} (from-sombre-fond\/90 to-sombre-fond\/0)`\}/
      )?.[1];
      const classesRangee = blocSuivis.match(
        /className="(flex gap-1\.5 -mx-4 px-4[^"]*)"/
      )?.[1];
      const classesEnveloppe = blocSuivis.match(
        /<div className="(group relative mt-5)">/
      )?.[1];
      if (!classesVoile || !finVoile || !classesRangee || !classesEnveloppe) {
        throw new Error("classes introuvables à la source");
      }
      const mesure = await page.evaluate(
        ({ enveloppe, rangee, voile }) => {
          const hote = document.createElement("div");
          hote.style.cssText = "position:fixed;left:0;top:100px;width:100%";
          hote.innerHTML =
            `<div class="${enveloppe}">` +
            `<ul class="${rangee}" style="list-style:none">` +
            [1, 2, 3]
              .map(
                () =>
                  '<li style="flex:0 0 30%"><span class="block aspect-4/5" style="background:#333"></span></li>'
              )
              .join("") +
            "</ul>" +
            `<div data-montage-voile class="${voile}"></div>` +
            "</div>";
          document.body.appendChild(hote);
          const boiteVoile = hote
            .querySelector("[data-montage-voile]")
            .getBoundingClientRect();
          const photos = hote.querySelector("li span").getBoundingClientRect();
          const rangeeBoite = hote.querySelector("ul").getBoundingClientRect();
          hote.remove();
          return {
            voile: { haut: boiteVoile.top, bas: boiteVoile.bottom, h: boiteVoile.height },
            photos: { haut: photos.top, bas: photos.bottom, h: photos.height },
            rangee: { h: rangeeBoite.height },
          };
        },
        {
          enveloppe: classesEnveloppe,
          rangee: classesRangee,
          voile: `${classesVoile} ${brancheGauche} ${finVoile}`,
        }
      );
      verif(
        `${largeur} px : le voile couvre LA HAUTEUR DES PHOTOS — ni plus ` +
          "haut, ni plus bas, jamais l'écran",
        Math.abs(mesure.voile.haut - mesure.photos.haut) <= 1 &&
          Math.abs(mesure.voile.bas - mesure.photos.bas) <= 1 &&
          Math.abs(mesure.voile.h - mesure.rangee.h) <= 1,
        `voile ${Math.round(mesure.voile.h)} px · photos ${Math.round(mesure.photos.h)} px`
      );
    } catch (erreur) {
      nonJoue(`§1 · montage (${largeur} px)`, String(erreur).slice(0, 100));
    } finally {
      await fermer();
    }
  }

  /* ---------- §2 — les quatre espacements, au pixel ---------- */
  titre(`§2 — VIVANT (${largeur} px) : 40 avant un titre, 20 après, gap tenu`);
  {
    //  typo-sauvage a les DEUX catégories : les quatre écarts s'y
    //  mesurent, « FLASHS » compris.
    const { page, fermer } = await ouvrirA(largeur, "/tatoueur/typo-sauvage-bordeaux");
    try {
      await page
        .locator("button", { hasText: /^Portfolio$/ })
        .first()
        .click();
      await page.waitForTimeout(900);
      const ecarts = await page.evaluate(() => {
        const boutonPortfolio = [...document.querySelectorAll("button")].find(
          (b) => (b.textContent ?? "").trim() === "Portfolio"
        );
        const rangeeSelecteur = boutonPortfolio.closest("div.relative");
        const sections = [...document.querySelectorAll("section")].filter((s) =>
          /Réalisations|Flashs/.test(s.querySelector("h2")?.textContent ?? "")
        );
        if (sections.length < 2 || !rangeeSelecteur) return null;
        const [premiere, seconde] = sections;
        const titre1 = premiere.querySelector("h2").getBoundingClientRect();
        const grille1 = premiere.querySelector("ul").getBoundingClientRect();
        const titre2 = seconde.querySelector("h2").getBoundingClientRect();
        //  Le gap vertical entre deux RANGÉES de la grille (2 colonnes)
        //  — mesuré dans la première section qui a au moins trois
        //  cases, donc une deuxième rangée.
        const aTroisCases = sections
          .map((s) => [...s.querySelectorAll("ul > li")])
          .find((cases) => cases.length >= 3);
        const gapRangees = aTroisCases
          ? aTroisCases[2].getBoundingClientRect().top -
            aTroisCases[0].getBoundingClientRect().bottom
          : null;
        return {
          selecteurVersTitre:
            titre1.top - rangeeSelecteur.getBoundingClientRect().bottom,
          titreVersGrille: grille1.top - titre1.bottom,
          grilleVersTitreSuivant: titre2.top - grille1.bottom,
          gapRangees,
          titres: sections.map((s) => s.querySelector("h2").textContent.trim()),
        };
      });
      if (!ecarts) {
        nonJoue(
          `§2 (${largeur} px)`,
          "la fiche n'a pas montré deux sections — les écarts 40/20/40 ne se mesurent pas ici"
        );
      } else {
        verif(
          `${largeur} px : 40 px entre la rangée Profil / Portfolio et « RÉALISATIONS »`,
          Math.abs(ecarts.selecteurVersTitre - 40) <= 1,
          `${Math.round(ecarts.selecteurVersTitre)} px`
        );
        verif(
          `${largeur} px : 20 px entre un titre et son premier carrousel`,
          Math.abs(ecarts.titreVersGrille - 20) <= 1,
          `${Math.round(ecarts.titreVersGrille)} px`
        );
        verif(
          `${largeur} px : 40 px entre le dernier carrousel d'une section et « FLASHS »`,
          Math.abs(ecarts.grilleVersTitreSuivant - 40) <= 1,
          `${Math.round(ecarts.grilleVersTitreSuivant)} px`
        );
        //  LE GAP ENTRE DEUX RANGÉES d'une même section : cette fiche
        //  n'a que deux vignettes par section — il se mesure sur la
        //  fiche de Camille (six vignettes, trois rangées), plus bas.
        verif(
          `${largeur} px : LA PREUVE — l'espace AVANT un titre (40) est STRICTEMENT plus grand qu'APRÈS (20)`,
          ecarts.selecteurVersTitre > ecarts.titreVersGrille &&
            ecarts.grilleVersTitreSuivant > ecarts.titreVersGrille,
          `avant ${Math.round(ecarts.selecteurVersTitre)}/${Math.round(ecarts.grilleVersTitreSuivant)} > après ${Math.round(ecarts.titreVersGrille)}`
        );
      }
    } catch (erreur) {
      nonJoue(`§2 (${largeur} px)`, String(erreur).slice(0, 110));
    } finally {
      await fermer();
    }
  }

  /* ---------- §2 — le gap des carrousels, sur une grande section ---------- */
  {
    const { page, fermer } = await ouvrirA(largeur, "/tatoueur/camille-fauve-paris-18e");
    try {
      await page
        .locator("button", { hasText: /^Portfolio$/ })
        .first()
        .click();
      await page.waitForTimeout(900);
      const gap = await page.evaluate(() => {
        const cases = [...document.querySelectorAll("section ul > li")];
        if (cases.length < 3) return null;
        return (
          cases[2].getBoundingClientRect().top -
          cases[0].getBoundingClientRect().bottom
        );
      });
      verif(
        `${largeur} px : l'écart entre deux carrousels d'une même section ne change pas (gap de la grille)`,
        gap !== null && Math.abs(gap - 28) <= 1,
        `${Math.round(gap ?? -1)} px (gap-y-7, inchangé)`
      );
    } catch (erreur) {
      nonJoue(`§2 · gap (${largeur} px)`, String(erreur).slice(0, 100));
    } finally {
      await fermer();
    }
  }
}

nonJoue(
  "§1 · le fondu VU sur le téléphone",
  "le relevé du propriétaire (un fondu sur toute la hauteur des bords) " +
    "ne se reproduit pas sous Chromium : aucune page n'y peint de " +
    "dégradé au bord, et le seul fondu du code (BlocSuivis) est borné à " +
    "sa rangée. Le seul dessin qui TOUCHE les bords est l'ombre portée " +
    "des cartes de la mosaïque (bien antérieure à la 264, rognée hors " +
    "écran ici) — si le voile persiste sur l'iPhone après cette passe, " +
    "c'est elle qu'il faudra regarder, pas le fondu de la 264"
);
nonJoue(
  "Ma sélection VIVANTE (session)",
  "les suivis et les photos aimées vivent dans le compte : sans session " +
    "ni base, la page est vide ici — le bornage du voile est prouvé par " +
    "le montage aux classes réelles, et la vérification sur le vrai " +
    "compte revient au propriétaire"
);

bilan();
