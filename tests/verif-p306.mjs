/**
 * BANC DE LA PASSE Nº 306 — LIVRAISON RAPIDE
 * ==================================================================
 * UN SEUL POINT : la colonne « Portfolio » d'une fiche passe, EN WEB,
 * de la grille de vignettes aux GALERIES QUI DÉFILENT — la
 * présentation de « Ma sélection », réemployée telle quelle.
 *
 * ⚠️ LA BANDE D'EFFACEMENT EST DÉCODÉE AU PIXEL, comme aux nº 295 et
 * nº 297 : on repeint les cases d'une couleur franche, on fait défiler
 * pour qu'une photo entre dans la bande, et on lit ce qui est PEINT —
 * pleinement opaque juste à droite de l'alignement des titres, et plus
 * rien du tout au bord gauche du cadre.
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 900, densité 2.
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
import { lirePixels } from "./_pixels.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const galerie = sansNotes(lire("src/components/GalerieQuiDefile.tsx"));
const affiche = sansNotes(lire("src/components/PortfolioDeLAffiche.tsx"));
const suivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));

const FICHE = "studio-cameleon-bordeaux";
/** Le fond de la page (`#1A1A1D`). */
const PAGE = "26,26,29";

titre("à la source — un seul dessin de galerie");
{
  verif(
    "LE DESSIN EST EXTRAIT DANS UN COMPOSANT PARTAGÉ " +
      "(`GalerieQuiDefile`), et il ne CHOISIT rien : le contenu lui " +
      "arrive en enfants",
    /export function GalerieQuiDefile\(/.test(galerie) &&
      /children: React\.ReactNode;/.test(galerie) &&
      /\{children\}/.test(galerie)
  );
  verif(
    "LES DEUX APPELANTS LE CONSOMMENT — « Ma sélection » et la colonne " +
      "Portfolio d'une fiche",
    /import \{ GalerieQuiDefile \} from "@\/components\/GalerieQuiDefile";/.test(
      suivis
    ) &&
      /import \{ GalerieQuiDefile \} from "@\/components\/GalerieQuiDefile";/.test(
        affiche
      ) &&
      /<GalerieQuiDefile/.test(suivis) &&
      /<GalerieQuiDefile/.test(affiche)
  );
  verif(
    "ET CE N'EST PAS UNE COPIE : la rangée, ses deux chevrons et ses " +
      "deux fondus ne sont plus écrits nulle part ailleurs",
    !/overflow-x-auto snap-x snap-mandatory/.test(suivis) &&
      !/overflow-x-auto snap-x snap-mandatory/.test(affiche) &&
      !/data-bandeau-defilement/.test(suivis) &&
      !/data-bandeau-defilement/.test(affiche) &&
      /data-bandeau-defilement/.test(galerie)
  );
  verif(
    "LES FLÈCHES DE LA nº 301 SONT GARDÉES : zone de 40 px, dessin " +
      "20 × 40, trait 3, ombre douce — et toujours aucun point",
    /\} w-10 items-center justify-center text-white/.test(galerie) &&
      /width="20"\n\s*height="40"/.test(galerie) &&
      /strokeWidth="3"/.test(galerie) &&
      /\[filter:drop-shadow\(0_1px_3px_rgba\(0,0,0,0\.65\)\)\]/.test(galerie) &&
      !/data-indicateur-pages/.test(galerie)
  );
  verif(
    "RÈGLE 2 — LE TITRE PORTE LE STYLE ET LE RENDU, et ses mots viennent " +
      "de `libelleRendu` : aucun libellé n'est écrit ici",
    /\{serie\.label\} · \{libelleRendu\(serie\.rendu\)\}/.test(affiche)
  );
  verif(
    "RÈGLE 3 — TOUTES LES PHOTOS DU CARROUSEL : aucun plafond, aucun " +
      "« Voir plus »",
    /\{serie\.photos\.map\(\(photo, rang\) =>/.test(affiche) &&
      !/slice\(0,/.test(affiche) &&
      !/Voir plus/.test(affiche)
  );
  verif(
    "RÈGLE 4 — DEUX PLEINES ET 10 % DE LA TROISIÈME : la largeur d'une " +
      "case se calcule, elle n'est pas écrite en dur",
    /basis-\[calc\(\(100%_-_12px\)\/2\.1\)\]/.test(affiche)
  );
  verif(
    "RÈGLE 5 — LA GALERIE DÉBORDE À GAUCHE JUSQU'AU CONTACT DE LA PHOTO " +
      "(`-ml-10`, rendu en `pl-10`), ET CETTE BANDE S'EFFACE — les deux " +
      "lignes du masque sont littérales, la préfixée d'abord",
    /classeRangee="-ml-10 pl-10 scroll-pl-10"/.test(affiche) &&
      /WebkitMaskImage:\s*\n?\s*"linear-gradient\(to right, rgba\(0,0,0,0\) 0px, rgba\(0,0,0,1\) 40px\)"/.test(
        affiche
      ) &&
      /maskImage:\s*\n?\s*"linear-gradient\(to right, rgba\(0,0,0,0\) 0px, rgba\(0,0,0,1\) 40px\)"/.test(
        affiche
      )
  );
  verif(
    "…ET RIEN N'EFFACE À DROITE : les fondus du bord sont éteints pour " +
      "cet emploi (`avecVoiles={false}`)",
    /avecVoiles=\{false\}/.test(affiche)
  );
  verif(
    "RÈGLE 6 — CLIQUER UNE PHOTO L'AFFICHE DANS LE CADRE DE LA FICHE : " +
      "c'est le chemin qui existe déjà (`surSerie`), avec le rang en plus",
    /indice: rang,/.test(affiche) && /setIndicePhoto\(serie\.indice \?\? 0\)/.test(fiche)
  );
  verif(
    "SMARTPHONE : RIEN NE CHANGE — la grille de vignettes reste, et les " +
      "galeries sont réservées au web",
    /grid grid-cols-2 gap-x-4 gap-y-7 lg:hidden/.test(affiche) &&
      /className="mt-5 hidden lg:block"/.test(affiche)
  );
}

titre("vivant — 1440 × 900, densité 2");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/tatoueur/${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
    await page.waitForTimeout(2000);

    /*  LE CADRE PHOTO AVANT — c'est la référence du point 4. */
    const photoAvant = await page.evaluate(() => {
      const r = document.querySelector("[data-photo-fiche]").getBoundingClientRect();
      return { largeur: r.width, hauteur: r.height, gauche: r.left };
    });

    //  ON OUVRE L'ONGLET PORTFOLIO.
    await page.evaluate(() => {
      const bouton = [...document.querySelectorAll("button")].find((n) =>
        /^Portfolio$/i.test((n.textContent || "").trim())
      );
      bouton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForTimeout(1500);

    const m = await page.evaluate(() => {
      const rangee = document.querySelector(
        "[data-galerie-serie] [data-galerie-defilante]"
      );
      if (!rangee) return null;
      const cs = getComputedStyle(rangee);
      const cases = [...rangee.querySelectorAll("[data-case-galerie]")];
      const r = (n) => n.getBoundingClientRect();
      const titre = document.querySelector("[data-titre-galerie]");
      const bordDroitCadre = r(rangee).right - parseFloat(cs.paddingRight);
      const bordGaucheCadre = r(rangee).left;
      const photo = document.querySelector("[data-photo-fiche]");
      return {
        galeries: document.querySelectorAll("[data-galerie-serie]").length,
        cases: cases.length,
        largeurCase: cases[0] ? r(cases[0]).width : 0,
        premiereGauche: cases[0] ? r(cases[0]).left : 0,
        //  Ce qui est VU de la troisième : du bord gauche de la case au
        //  bord droit du cadre — au-delà, le cadre rogne.
        troisiemeVue: cases[2] ? bordDroitCadre - r(cases[2]).left : null,
        //  Et l'écart entre le bord droit de ce qui est vu et le bord
        //  droit du cadre : c'est le cadre lui-même, donc zéro.
        ecartDroite: cases[2]
          ? Math.min(r(cases[2]).right, bordDroitCadre) - bordDroitCadre
          : null,
        alignementTitres: titre ? r(titre).left : null,
        bordGaucheCadre,
        bordDroitPhoto: r(photo).right,
        largeurEffacement: (titre ? r(titre).left : 0) - bordGaucheCadre,
        masque: cs.maskImage || cs.webkitMaskImage,
        haut: r(rangee).top,
        bas: r(rangee).bottom,
      };
    });

    if (!m) {
      nonJoue(
        "les galeries en vivant",
        "cette fiche de démonstration n'a rendu aucune galerie de série"
      );
    } else {
      verif(
        "LES GALERIES SONT LÀ, une par carrousel",
        m.galeries > 0 && m.cases > 0,
        `${m.galeries} galerie(s) · ${m.cases} photo(s) dans la première`
      );
      verif(
        "RÈGLE 4 — LA TROISIÈME N'EST VUE QUE SUR 10 % DE SA LARGEUR",
        Math.abs(m.troisiemeVue - m.largeurCase * 0.1) < 0.5,
        `vue ${m.troisiemeVue?.toFixed(3)} px sur ${m.largeurCase.toFixed(
          3
        )} — soit ${((m.troisiemeVue / m.largeurCase) * 100).toFixed(1)} %`
      );
      verif(
        "…ET SON BORD DROIT EST COLLÉ AU BORD DROIT DU CADRE : écart nul",
        Math.abs(m.ecartDroite) < 0.001,
        `${m.ecartDroite}`
      );
      verif(
        "AU REPOS, LA PREMIÈRE PHOTO EST ALIGNÉE SUR LES TITRES",
        Math.abs(m.premiereGauche - m.alignementTitres) < 0.001,
        `première ${m.premiereGauche} · titres ${m.alignementTitres}`
      );
      verif(
        "RÈGLE 5 — LE CADRE VA JUSQU'AU CONTACT DE LA GRANDE PHOTO, et " +
          "la bande d'effacement est l'écart entre ce bord et les titres",
        Math.abs(m.bordGaucheCadre - m.bordDroitPhoto) < 0.001 &&
          Math.abs(m.largeurEffacement - 40) < 0.001,
        `cadre ${m.bordGaucheCadre} = photo ${m.bordDroitPhoto} · titres ` +
          `${m.alignementTitres} · bande ${m.largeurEffacement} px`
      );

      /* ---- LA PREUVE AU PIXEL ------------------------------------ */
      /*  On repeint toutes les cases en ROUGE FRANC, on fait défiler
          d'une centaine de pixels pour qu'une photo entre dans la bande
          d'effacement, et on décode deux endroits. */
      await page.evaluate(() => {
        document
          .querySelectorAll("[data-galerie-serie] [data-case-galerie] img")
          .forEach((image) => {
            image.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' " +
              "width='1080' height='1350'%3E%3Crect width='1080' " +
              "height='1350' fill='%23FF0000'/%3E%3C/svg%3E";
          });
        const rangee = document.querySelector(
          "[data-galerie-serie] [data-galerie-defilante]"
        );
        //  ⚠️ ON VISE UNE POSITION D'ACCROCHAGE, PAS UN NOMBRE ROND.
        //  L'accrochage est OBLIGATOIRE (`snap-mandatory`) : un
        //  `scrollLeft = 100` est ramené à zéro dans la même trame, et
        //  la preuve se ferait alors sur une galerie AU REPOS — où
        //  aucune photo n'entre dans la bande, donc où elle ne
        //  prouverait rien. On avance donc d'UN PAS : une case et son
        //  écart.
        const premiere = rangee.querySelector("[data-case-galerie]");
        const pas = premiere.getBoundingClientRect().width + 6;
        rangee.scrollTo({ left: pas, behavior: "instant" });
      });
      await page.waitForTimeout(900);

      /*  ON VÉRIFIE QUE LE DÉFILEMENT A BIEN EU LIEU, et qu'une photo
          couvre vraiment les deux endroits qu'on s'apprête à lire :
          sans cela, lire « le fond de la page » ne prouverait que
          l'absence de photo. */
      const scene = await page.evaluate(() => {
        const rangee = document.querySelector(
          "[data-galerie-serie] [data-galerie-defilante]"
        );
        const cases = [...rangee.querySelectorAll("[data-case-galerie]")];
        const cadre = rangee.getBoundingClientRect();
        return {
          position: rangee.scrollLeft,
          //  Les bords des cases, pour savoir ce qui couvre quoi.
          bords: cases.map((n) => {
            const r = n.getBoundingClientRect();
            return [r.left, r.right];
          }),
          cadreGauche: cadre.left,
        };
      });
      const couvert = (x) =>
        scene.bords.some(([g, d]) => x >= g - 0.001 && x <= d + 0.001);
      verif(
        "LA SCÈNE DE LA PREUVE EST BIEN CELLE QU'ON CROIT : la galerie a " +
          "défilé d'un pas, et une photo couvre RÉELLEMENT le bord gauche " +
          "du cadre comme le milieu de la bande",
        scene.position > 1 &&
          couvert(m.bordGaucheCadre) &&
          couvert(m.bordGaucheCadre + 20),
        `position ${scene.position.toFixed(3)} · bords ${scene.bords
          .map(([g, d]) => `${g.toFixed(0)}→${d.toFixed(0)}`)
          .join(" ")}`
      );

      /*  ON DÉCODE TOUTE LA BANDE D'UN COUP, du bord gauche du cadre
          à l'alignement des titres, et quatre pixels au-delà. La
          couleur peinte est un mélange du ROUGE FRANC et du fond de la
          page : on en tire l'opacité réelle de la photo, pixel par
          pixel. `alpha = (rouge − 26) / (255 − 26)`. */
      const milieu = (m.haut + m.bas) / 2;
      const bande = lirePixels(
        await page.screenshot({
          clip: { x: m.bordGaucheCadre, y: milieu, width: 44, height: 1 },
        })
      );
      const echelle = bande.largeur / 44;
      const alphaA = (xCss) => {
        const [r] = bande.pixel(Math.round(xCss * echelle), 0);
        return (r - 26) / (255 - 26);
      };
      const profil = [0, 5, 10, 15, 20, 25, 30, 35, 40, 43].map((x) => ({
        x,
        a: alphaA(x),
      }));

      verif(
        "AU PIXEL — AU BORD GAUCHE DU CADRE, LA PHOTO EST ENTIÈREMENT " +
          "INVISIBLE : moins de 2 % d'opacité, c'est-à-dire le fond de " +
          "la page",
        alphaA(0) < 0.02,
        `${(alphaA(0) * 100).toFixed(1)} %`
      );
      verif(
        "AU PIXEL — À L'ALIGNEMENT DES TITRES, ELLE EST PLEINEMENT " +
          "OPAQUE, et elle le reste au-delà",
        alphaA(40) > 0.99 && alphaA(43) > 0.99,
        `${(alphaA(40) * 100).toFixed(1)} % puis ${(alphaA(43) * 100).toFixed(1)} %`
      );
      verif(
        "AU PIXEL — ET L'EFFACEMENT EST PROGRESSIF SUR TOUTE LA BANDE : " +
          "l'opacité ne décroît jamais, et vaut la moitié à mi-chemin",
        profil.every((point, rang) => rang === 0 || point.a >= profil[rang - 1].a - 0.005) &&
          Math.abs(alphaA(20) - 0.5) < 0.06,
        profil.map((p) => `${p.x}px:${(p.a * 100).toFixed(0)}%`).join(" ")
      );

      /* ---- LE CADRE PHOTO N'A PAS BOUGÉ -------------------------- */
      const photoApres = await page.evaluate(() => {
        const r = document
          .querySelector("[data-photo-fiche]")
          .getBoundingClientRect();
        return { largeur: r.width, hauteur: r.height, gauche: r.left };
      });
      verif(
        "LE CADRE PHOTO DE LA FICHE N'A PAS BOUGÉ D'UN PIXEL entre les " +
          "deux onglets — ni largeur, ni hauteur, ni position",
        Math.abs(photoApres.largeur - photoAvant.largeur) < 0.001 &&
          Math.abs(photoApres.hauteur - photoAvant.hauteur) < 0.001 &&
          Math.abs(photoApres.gauche - photoAvant.gauche) < 0.001,
        `${photoAvant.largeur} × ${photoAvant.hauteur} → ` +
          `${photoApres.largeur} × ${photoApres.hauteur}`
      );

      /* ---- AUCUNE PLAQUE DE VERRE DANS UNE RACINE NEUVE ---------- */
      const verres = await page.evaluate(() => {
        const cibles = [
          ...document.querySelectorAll(
            "[data-verre-fenetre], [data-verre-menu], [data-verre-capsule], [data-barre-fixe]"
          ),
        ];
        const fautifs = [];
        for (const cible of cibles) {
          let parent = cible.parentElement;
          while (parent && parent !== document.documentElement) {
            const cs = getComputedStyle(parent);
            if (
              (cs.maskImage && cs.maskImage !== "none") ||
              (cs.webkitMaskImage && cs.webkitMaskImage !== "none") ||
              (cs.filter && cs.filter !== "none")
            ) {
              fautifs.push(
                `${cible.tagName}.${(cible.className || "").slice(0, 20)} ← ` +
                  `${parent.tagName}`
              );
              break;
            }
            parent = parent.parentElement;
          }
        }
        return { nombre: cibles.length, fautifs };
      });
      verif(
        "AUCUNE PLAQUE DE VERRE N'EST PRISE DANS UNE NOUVELLE RACINE " +
          "D'ARRIÈRE-PLAN : aucun ancêtre à masque ni à filtre",
        verres.fautifs.length === 0,
        `${verres.nombre} surface(s) de verre examinée(s) · ` +
          `${verres.fautifs.length} fautive(s)${
            verres.fautifs.length ? " — " + verres.fautifs.join(", ") : ""
          }`
      );
      verif(
        "…ET RIEN N'ANIME EN OPACITÉ SOUS LE MASQUE (le défaut nº 234 ne " +
          "se rejoue pas) : la rangée ne porte ni transition d'opacité, " +
          "ni transformation",
        !/transition-opacity|starting:opacity|translate|scale-/.test(
          galerie.slice(
            galerie.indexOf("data-galerie-defilante"),
            galerie.indexOf("</ul>")
          )
        ),
        m.masque
      );
    }
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
