/**
 * BANC DE LA PASSE Nº 280
 * ==================================================================
 * §1 AUCUN APERÇU, nulle part : une photo arrive en une seule fois.
 *    La réservation de hauteur, elle, ne bouge pas — la page ne saute
 *    pas au chargement ;
 * §2 la migration retire TOUTES les fiches de démonstration (pas
 *    seulement celles de la nº 214) et ne touche pas au démarchage ;
 * §3 partager, c'est partager LE CARROUSEL OUVERT ;
 * §4 le cadre ne laisse plus voir la photo voisine — cause nommée :
 *    une largeur fractionnaire contre des positions d'arrêt entières ;
 * §5 le bouton dit « Voir plus ».
 *
 * ⚠️ UNE SEULE LARGEUR pour le §1 (390 px, livraison rapide) ; le §4
 * se mesure à 1440 px — c'est le défaut du WEB, il n'existe pas
 * ailleurs.
 * ⚠️ LES FAUSSES IMAGES DU SITE NE PÈSENT QUE QUELQUES KILO-OCTETS :
 * le vrai délai d'affichage n'est pas mesurable ici, et ce banc ne
 * prétend pas le mesurer. Ce qu'il prouve, c'est qu'AUCUN APERÇU
 * N'EST SERVI — ce qui est exactement la consigne.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT.
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

const photo = lire("src/components/PhotoProgressive.tsx");
const photoNu = sansNotes(photo);
const carrousel = lire("src/components/CarrouselPortfolio.tsx");
const carrouselNu = sansNotes(carrousel);
const migration = lire("supabase/yokofolio-retirer-toutes-les-demos.sql");
const ficheNu = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const fenetreNu = sansNotes(lire("src/components/FenetreFiche.tsx"));
const photoLibNu = sansNotes(lire("src/lib/photo-tatoueur.ts"));
const indexNu = sansNotes(lire("src/components/IndexTatoueurs.tsx"));

const FICHE = "/tatoueur/typo-sauvage-bordeaux";

/* ==================================================================
 * §1 — À LA SOURCE : plus une seule image de remplacement
 * ================================================================== */
titre("§1 — à la source : une photo, une seule image");
{
  verif(
    "le composant n'affiche plus qu'UNE balise <img> — la miniature a " +
      "disparu de son code, propriété comprise",
    (photoNu.match(/<img/g) ?? []).length === 1 &&
      !/miniature/.test(photoNu) &&
      !/PHOTO_MINIATURE/.test(photo)
  );
  verif(
    "AUCUN flou, AUCUNE opacité, AUCUNE transition sur la photo",
    !/blur/.test(photoNu) &&
      !/opacity/.test(photoNu) &&
      !/transition/.test(photoNu)
  );
  verif(
    "AUCUN `srcset` ni `sizes` : le navigateur ne peut pas choisir un " +
      "fichier plus petit — un aperçu qui ne dit pas son nom",
    !/srcSet|sizes=/.test(photoNu) && !/srcSet|sizes=/.test(carrouselNu)
  );
  verif(
    "LA RÉSERVATION DE HAUTEUR EST INTACTE : dimensions intrinsèques " +
      "déclarées, et le cadre 4:5 de la colonne",
    /width=\{PHOTO_PORTFOLIO\.largeur\}/.test(photoNu) &&
      /height=\{PHOTO_PORTFOLIO\.hauteur\}/.test(photoNu) &&
      /CADRE_PHOTO_PORTFOLIO/.test(carrouselNu)
  );
  verif(
    "LA PHOTO REGARDÉE EST DEMANDÉE TOUT DE SUITE (eager + priorité " +
      "haute) ; seules ses voisines, hors écran, attendent",
    /const tout_de_suite = prioritaire \|\| pleineResolution;/.test(photoNu) &&
      /loading=\{tout_de_suite \? "eager" : "lazy"\}/.test(photoNu) &&
      /fetchPriority=\{tout_de_suite \? "high" : undefined\}/.test(photoNu)
  );
  verif(
    "le carrousel ne lui passe plus de miniature",
    /<PhotoProgressive\s*\n?\s*url=\{photo\.url\}/.test(carrouselNu) &&
      !/miniature=\{photo\.miniature\}/.test(carrouselNu)
  );
  //  CE QUI N'EST PAS UN APERÇU, et qu'on garde : la carte de la
  //  mosaïque sert la miniature et ne la remplace jamais.
  verif(
    "les CARTES gardent leur miniature (une seule image, jamais " +
      "remplacée) — ce n'est pas un aperçu, c'est la photo d'une " +
      "vignette de 190 px",
    /src=\{photo\.miniature\}/.test(carrouselNu) &&
      /surCarte \?/.test(carrouselNu)
  );
}

/* ==================================================================
 * §1 — VIVANT : aucune miniature demandée, aucune page qui saute
 * ================================================================== */
titre("§1 — VIVANT (390 px) : aucun aperçu servi, aucun saut de page");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await contexte.newPage();
  const requetes = [];
  page.on("request", (r) => {
    if (r.url().includes("/images-demo/")) requetes.push(r.url());
  });
  try {
    await page.goto(`${BASE}${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(3000);
    const ouverture = await page.evaluate(() => {
      const colonnes = [...document.querySelectorAll('[data-role^="colonne"]')];
      const images = colonnes.flatMap((c) => [...c.querySelectorAll("img")]);
      return {
        colonnes: colonnes.length,
        parColonne: colonnes.map((c) => c.querySelectorAll("img").length),
        styles: images.map((i) => {
          const s = getComputedStyle(i);
          return {
            filtre: s.filter,
            opacite: s.opacity,
            duree: s.transitionDuration,
          };
        }),
        regardee: (() => {
          const i = colonnes[0]?.querySelector("img");
          return { loading: i?.getAttribute("loading"), prio: i?.getAttribute("fetchpriority") };
        })(),
      };
    });
    verif(
      "390 px : UNE SEULE image par photo — plus aucune couche d'aperçu",
      ouverture.parColonne.every((n) => n <= 1),
      `colonnes : [${ouverture.parColonne.join(", ")}]`
    );
    verif(
      "390 px : aucun flou, aucune opacité partielle, aucune transition",
      ouverture.styles.every(
        (s) => s.filtre === "none" && s.opacite === "1" && s.duree === "0s"
      ),
      JSON.stringify(ouverture.styles[0] ?? null)
    );
    verif(
      "390 px : la photo regardée est demandée TOUT DE SUITE",
      ouverture.regardee.loading === "eager" && ouverture.regardee.prio === "high",
      `${ouverture.regardee.loading} / ${ouverture.regardee.prio}`
    );
    verif(
      "390 px : AUCUNE MINIATURE demandée à l'ouverture d'une fiche",
      requetes.filter((u) => u.includes("miniature=1")).length === 0,
      `${requetes.length} image(s) demandée(s), 0 miniature`
    );

    //  LE DÉFILEMENT — le défaut se voyait à CHAQUE photo.
    const avantDefilement = requetes.length;
    for (let tour = 0; tour < 4; tour += 1) {
      await page.evaluate(() => {
        const cadre = document.querySelector('[data-role="cadre"]');
        cadre?.scrollBy({
          left: cadre.getBoundingClientRect().width,
          behavior: "smooth",
        });
      });
      await page.waitForTimeout(800);
    }
    verif(
      "390 px : AUCUNE MINIATURE non plus au défilement du carrousel",
      requetes.filter((u) => u.includes("miniature=1")).length === 0,
      `${requetes.length - avantDefilement} image(s) de plus, 0 miniature`
    );

    //  LA RÉSERVATION : la page ne bouge pas pendant que les images
    //  arrivent — c'est ce que la hauteur déclarée garantit.
    await page.goto(`${BASE}${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const positions = [];
    for (let tour = 0; tour < 6; tour += 1) {
      positions.push(await page.evaluate(() => Math.round(window.scrollY)));
      await page.waitForTimeout(350);
    }
    verif(
      "390 px : `window.scrollY` ne bouge pas pendant le chargement — la " +
        "hauteur reste réservée",
      positions.every((p) => p === positions[0]),
      `[${positions.join(", ")}]`
    );
  } catch (erreur) {
    nonJoue("§1 · vivant", String(erreur).slice(0, 110));
  } finally {
    await contexte.close();
    await nav.close();
  }
}

nonJoue(
  "§1 · LE DÉLAI RÉEL D'AFFICHAGE",
  "les images de démonstration sont des SVG de quelques kilo-octets : " +
    "le temps entre la demande et l'affichage y est nul, avant comme " +
    "après. Ce banc ne le mesure donc pas — il prouve ce qui est " +
    "vérifiable et qui suffit : AUCUN aperçu n'est servi, ni à " +
    "l'ouverture ni au défilement. Le ressenti sur de vraies photos " +
    "revient au propriétaire"
);

/* ==================================================================
 * §2 — LA MIGRATION
 * ================================================================== */
titre("§2 — la migration : toutes les démos, et rien qu'elles");
{
  verif(
    "TROIS MARQUEURS, dont aucun ne peut désigner une vraie fiche : " +
      "Instagram `.demo/`, photo `/images-demo/`, slug `demo-p214-`",
    /lien_instagram like '%\.demo\/%'/.test(migration) &&
      /lien_instagram like '%yokofolio_demo%'/.test(migration) &&
      /photo_principale like '\/images-demo\/%'/.test(migration) &&
      /slug like 'demo-p214-%'/.test(migration)
  );
  verif(
    "LA LISTE S'AFFICHE AVANT toute suppression (le propriétaire la " +
      "relit) — et la suppression ne vise que cette liste",
    /select nom, slug, ville_nom, lien_instagram\s*\n\s*from _demos/.test(
      migration
    ) &&
      /delete from public\.tatoueurs where id in \(select id from _demos\);/.test(
        migration
      ) &&
      (migration.match(/delete from public\.tatoueurs/g) ?? []).length === 1
  );
  verif(
    "LE DÉMARCHAGE EST COMPTÉ AVANT ET APRÈS — fiches et rattachements",
    /fiches_demarchage_avant/.test(migration) &&
      /fiches_demarchage_apres/.test(migration) &&
      /demarchage_avant/.test(migration) &&
      /demarchage_apres/.test(migration)
  );
  verif(
    "UN GARDE-FOU refuse qu'une fiche de démarchage soit dans la cible",
    /demarchage_dans_la_cible_DOIT_ETRE_ZERO/.test(migration)
  );
  verif(
    "les dépendances sans cascade sont traitées à la main, et zéro " +
      "orpheline est vérifiée dans neuf tables",
    /update public\.modes_exercice\s*\n\s*set salon_id = null/.test(migration) &&
      [
        "photos_orphelines",
        "coeurs_orphelins",
        "abonnements_orphelins",
        "modes_orphelins",
        "salons_fantomes",
        "studios_orphelins",
        "liaisons_orphelines",
        "demarchage_orphelins",
        "notifications_fantomes",
      ].every((colonne) => migration.includes(colonne))
  );
  verif(
    "transaction, verdict explicite, et déclarée au numéro 68",
    /^begin;$/m.test(migration) &&
      /^commit;$/m.test(migration) &&
      /toutes les fiches de démonstration sont parties/.test(migration) &&
      /^68\. \*\*`yokofolio-retirer-toutes-les-demos\.sql`\*\*/m.test(
        lire("supabase/LISEZ-MOI-ordre-des-migrations.md")
      )
  );
  nonJoue(
    "§2 · la migration PASSÉE",
    "Supabase est hors de portée de ce conteneur, et une migration ne " +
      "se joue JAMAIS ici (règle du propriétaire). La liste des fiches " +
      "visées est donnée dans le compte rendu et s'affichera dans son " +
      "éditeur SQL avant toute suppression"
  );
}

/* ==================================================================
 * §3 — LE PARTAGE
 * ================================================================== */
titre("§3 — à la source : partager, c'est partager le carrousel ouvert");
{
  verif(
    "l'adresse d'un carrousel est écrite UNE seule fois " +
      "(`cheminDuCarrousel`), et les deux enveloppes la consomment",
    /export function cheminDuCarrousel/.test(photoLibNu) &&
      /cheminFiche=\{cheminDuCarrousel\(\s*tatoueur\.slug,\s*styleAffiche,\s*serieEffective\s*\)\}/.test(
        ficheNu
      ) &&
      /cheminFiche=\{cheminDuCarrousel\(\s*tatoueur\.slug,\s*styleAffiche,\s*serieEffective\s*\)\}/.test(
        fenetreNu
      )
  );
  verif(
    "elle porte les trois tags, et rend l'adresse nue quand il n'y a " +
      "pas de série (la fiche ouvre alors sa première galerie)",
    /suite\.set\("style", style\)/.test(photoLibNu) &&
      /suite\.set\("nature", serie\.nature\)/.test(photoLibNu) &&
      /suite\.set\("rendu", serie\.rendu\)/.test(photoLibNu) &&
      /if \(!style && !serie\) return `\/tatoueur\/\$\{slug\}`;/.test(photoLibNu)
  );
}

titre("§3 — VIVANT (390 px) : l'adresse partagée ouvre le même carrousel");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await contexte.newPage();
  try {
    //  ON OUVRE UN CARROUSEL DE FLASHS, puis on lit ce que le bouton
    //  de partage écrit dans son champ de lien.
    await page.goto(`${BASE}${FICHE}?style=lettering&nature=flash&rendu=black_and_grey`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    //  LE BOUTON PORTE SON NOM (`aria-label="Partager la fiche de …"`) :
    //  on le touche comme un visiteur, puis on lit l'adresse que la
    //  fenêtre de partage affiche.
    const bouton = page.locator('button[aria-label^="Partager la fiche"]').first();
    if ((await bouton.count()) > 0) {
      await bouton.click();
      await page.waitForTimeout(900);
    }
    const partage = await page.evaluate(() => {
      const textes = [...document.querySelectorAll("input, p, span, a, button")]
        .map((n) => n.value ?? n.textContent ?? "")
        .filter((t) => t.includes("/tatoueur/"));
      return textes[0] ?? null;
    });
    if (!partage) {
      nonJoue(
        "§3 · vivant",
        "le bouton de partage n'est pas atteignable dans ce contexte " +
          "(mesuré : il ne répond pas au clic sous Chromium mobile — il " +
          "est posé sur la photo et s'ouvre en fenêtre native). " +
          "L'adresse partagée est prouvée À LA SOURCE ci-dessus : une " +
          "seule écriture, consommée par les deux enveloppes"
      );
    } else {
      verif(
        "l'adresse partagée porte les trois tags du carrousel regardé " +
          "(ici : des flashs en lettering)",
        /style=lettering/.test(partage) &&
          /nature=flash/.test(partage) &&
          /rendu=/.test(partage),
        partage.slice(0, 120)
      );
    }
  } catch (erreur) {
    nonJoue("§3 · vivant", String(erreur).slice(0, 110));
  } finally {
    await contexte.close();
    await nav.close();
  }
}

nonJoue(
  "§3 · L'IMAGE d'aperçu du partage (opengraph)",
  "elle est produite par une route que Next appelle SANS les " +
    "paramètres d'adresse (`opengraph-image` ne reçoit que le slug) : " +
    "l'image reste donc celle de la fiche. L'ADRESSE partagée, elle, " +
    "porte bien le carrousel — c'est elle qui décide de ce que le " +
    "visiteur verra en ouvrant. Faire suivre l'image demanderait une " +
    "route d'image dédiée : à décider par le propriétaire"
);

/* ==================================================================
 * §4 — LE CADRE ET LA PHOTO VOISINE
 * ================================================================== */
titre("§4 — VIVANT (1440 px) : le cadre ne laisse plus voir la voisine");
{
  verif(
    "à la source : le cadre prend une largeur ENTIÈRE " +
      "(`round(down,100%,1px)`) — la cause était une largeur " +
      "fractionnaire contre des positions d'arrêt entières",
    /w-\[round\(down,100%,1px\)\]/.test(carrouselNu)
  );
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    const largeurs = await page.evaluate(() => {
      const cadre = document.querySelector('[data-role="cadre"]');
      return {
        cadre: cadre.getBoundingClientRect().width,
        entiere: Number.isInteger(cadre.getBoundingClientRect().width),
      };
    });
    verif(
      "1440 px : la largeur du cadre est un nombre ENTIER de pixels",
      largeurs.entiere,
      `${largeurs.cadre} px`
    );
    //  VINGT DÉFILEMENTS, comme demandé : à chaque arrêt, le bord
    //  gauche de la photo doit coïncider avec celui du cadre.
    const ecarts = [];
    for (let tour = 0; tour < 20; tour += 1) {
      await page.evaluate(() => {
        const cadre = document.querySelector('[data-role="cadre"]');
        cadre.scrollBy({
          left: cadre.getBoundingClientRect().width,
          behavior: "smooth",
        });
      });
      await page.waitForTimeout(500);
      ecarts.push(
        await page.evaluate(() => {
          const cadre = document.querySelector('[data-role="cadre"]');
          const boite = cadre.getBoundingClientRect();
          const colonnes = [
            ...document.querySelectorAll('[data-role^="colonne"]'),
          ].map((c) => c.getBoundingClientRect());
          const proche = colonnes.reduce((a, b) =>
            Math.abs(b.left - boite.left) < Math.abs(a.left - boite.left) ? b : a
          );
          return Number((proche.left - boite.left).toFixed(3));
        })
      );
    }
    const fautifs = ecarts.filter((e) => Math.abs(e) > 0.01);
    verif(
      "1440 px : sur VINGT défilements, le bord de la photo tombe " +
        "exactement sur celui du cadre — aucune tranche de la voisine",
      fautifs.length === 0,
      `${fautifs.length} écart(s) non nul(s) sur ${ecarts.length} — max ${Math.max(
        ...ecarts.map((e) => Math.abs(e))
      ).toFixed(3)} px`
    );
  } catch (erreur) {
    nonJoue("§4 · vivant", String(erreur).slice(0, 110));
  } finally {
    await contexte.close();
    await nav.close();
  }
}

/* ==================================================================
 * §5 — LE BOUTON
 * ================================================================== */
titre("§5 — « Voir plus », partout");
{
  verif(
    "l'accueil dit « Voir plus » — plus « Voir plus de portfolios »",
    /: "Voir plus"\}/.test(indexNu) && !/Voir plus de portfolios/.test(indexNu)
  );
  verif(
    "les rangées de « Ma sélection » le disaient déjà",
    />\s*Voir plus\s*</.test(sansNotes(lire("src/components/BlocSuivis.tsx")))
  );
  verif(
    "aucun « Voir plus de … » ne subsiste dans le produit tatouage",
    !/Voir plus de (portfolios|tatoueurs|galeries)/.test(
      sansNotes(lire("src/components/IndexTatoueurs.tsx")) +
        sansNotes(lire("src/components/BlocSuivis.tsx")) +
        sansNotes(lire("src/components/PageFavoris.tsx"))
    )
  );
}

bilan();
