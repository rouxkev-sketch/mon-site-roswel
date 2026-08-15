/**
 * BANC DE LA PASSE Nº 281
 * ==================================================================
 * §1 la SONDE `?sonde-cadre=1` : elle n'existe que si l'adresse la
 *    demande, elle relève les onze valeurs demandées, « suivant » fait
 *    défiler d'une photo et réaffiche, « copier » met tout au
 *    presse-papier. Elle ne corrige RIEN — c'est un instrument ;
 * §2 l'image d'aperçu du partage suit LE CARROUSEL partagé : une route
 *    dédiée reçoit les tags (Next n'en donne aucun à
 *    `opengraph-image`), et les métadonnées de la page l'annoncent ;
 * §3 aucun code — c'est un diagnostic, livré en tableaux dans le
 *    compte rendu.
 *
 * ⚠️ UNE SEULE LARGEUR (390 px, livraison rapide).
 * ⚠️ CHROMIUM N'EST PAS WEBKIT — et le défaut du §1 ne se reproduit
 * PAS ici : c'est précisément pourquoi cette passe livre une sonde au
 * lieu d'une correction.
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

const sonde = lire("src/components/SondeCadre.tsx");
const sondeNu = sansNotes(sonde);
const pageFiche = sansNotes(lire("src/app/(tatouage)/tatoueur/[slug]/page.tsx"));
const route = sansNotes(lire("src/app/(tatouage)/tatoueur/[slug]/partage/route.tsx"));
const composition = lire("src/lib/image-partage-fiche.tsx");
const compositionNu = sansNotes(composition);
const ogNu = sansNotes(
  lire("src/app/(tatouage)/tatoueur/[slug]/opengraph-image.tsx")
);
const photoLib = lire("src/lib/photo-tatoueur.ts");

const FICHE = "/tatoueur/typo-sauvage-bordeaux";

/* ==================================================================
 * §1 — LA SONDE
 * ================================================================== */
titre("§1 — à la source : la sonde ne s'installe que si on la demande");
{
  verif(
    "elle lit `?sonde-cadre=1` dans l'adresse, et rend `null` sinon",
    /get\("sonde-cadre"\) === "1"/.test(sondeNu) &&
      /if \(!active\) return null;/.test(sondeNu)
  );
  verif(
    "elle relève LES ONZE VALEURS demandées, au millième là où il le " +
      "faut",
    [
      "cadreLargeur: boite.width.toFixed(3)",
      "clientWidth: cadre.clientWidth",
      "scrollWidth: cadre.scrollWidth",
      "scrollLeft: cadre.scrollLeft.toFixed(3)",
      "photos: colonnes.length",
      "paddingGauche: style.paddingLeft",
      "paddingDroit: style.paddingRight",
      "gap: style.columnGap",
      "densite: window.devicePixelRatio",
      "fenetre: window.innerWidth",
    ].every((morceau) => sondeNu.includes(morceau)) &&
      /photoLargeur: \(premiere\?\.width \?\? 0\)\.toFixed\(3\)/.test(sondeNu)
  );
  verif(
    "les DEUX BOUTONS existent : « suivant » (une photo, puis nouveau " +
      "relevé) et « copier » (tout le relevé en un appui)",
    /const suivant = \(\) => \{/.test(sondeNu) &&
      /scrollBy\(\{ left: cadre\.getBoundingClientRect\(\)\.width/.test(sondeNu) &&
      /navigator\.clipboard\.writeText\(texte\)/.test(sondeNu) &&
      //  Les libellés sont sur leur propre ligne dans le JSX.
      />\s*suivant\s*</.test(sondeNu) &&
      /\{copie \? "copié" : "copier"\}/.test(sondeNu)
  );
  verif(
    "elle NE MODIFIE RIEN : aucune classe du site, aucun style posé " +
      "sur la page — tout est en style en ligne, en `fixed`, par-dessus",
    !/className=/.test(sondeNu) &&
      /position: "fixed"/.test(sondeNu) &&
      !/document\.documentElement\.(setAttribute|style|classList)/.test(sondeNu)
  );
  verif(
    "elle est montée sur LA PAGE D'UNE FICHE, et là seulement",
    /<SondeCadre \/>/.test(pageFiche) &&
      !/SondeCadre/.test(sansNotes(lire("src/components/FenetreFiche.tsx")))
  );
}

titre("§1 — VIVANT (390 px) : la sonde relève, avance, et copie");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    verif(
      "390 px : SANS le paramètre, la sonde n'existe pas",
      (await page.locator("[data-sonde-cadre]").count()) === 0
    );

    await page.goto(`${BASE}${FICHE}?sonde-cadre=1`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    const releve = await page.evaluate(
      () => document.querySelector("[data-sonde-cadre]")?.innerText ?? ""
    );
    verif(
      "390 px : AVEC le paramètre, les onze valeurs sont à l'écran",
      [
        "cadre.width",
        "clientWidth",
        "scrollWidth",
        "scrollLeft",
        "photos",
        "photo.width",
        "padding-left",
        "padding-right",
        "gap",
        "devicePixelRatio",
        "fenêtre",
      ].every((mot) => releve.includes(mot)),
      releve.split("\n").slice(0, 4).join(" · ")
    );
    //  « SUIVANT » : le défilement avance d'une photo, et le relevé
    //  suit — c'est ce qui permettra au propriétaire de photographier
    //  la valeur fautive au moment où il voit la bande.
    const avant = await page.evaluate(() =>
      Number(
        document.querySelector('[data-role="cadre"]')?.scrollLeft ?? -1
      )
    );
    await page.locator("[data-sonde-cadre] button").first().click();
    await page.waitForTimeout(1200);
    const apres = await page.evaluate(() => ({
      scroll: Number(
        document.querySelector('[data-role="cadre"]')?.scrollLeft ?? -1
      ),
      texte: document.querySelector("[data-sonde-cadre]")?.innerText ?? "",
    }));
    verif(
      "390 px : « suivant » fait défiler d'UNE photo et réaffiche les " +
        "valeurs",
      apres.scroll > avant && apres.texte.includes("scrollLeft"),
      `scrollLeft ${avant} → ${apres.scroll}`
    );
    //  « COPIER » : le presse-papier contient le relevé entier.
    await page.locator("[data-sonde-cadre] button").nth(1).click();
    await page.waitForTimeout(600);
    const presse = await page.evaluate(() =>
      navigator.clipboard.readText().catch(() => "")
    );
    verif(
      "390 px : « copier » met TOUT le relevé au presse-papier, adresse " +
        "comprise",
      presse.includes("SONDE CADRE") &&
        presse.includes("cadre.width") &&
        presse.includes("devicePixelRatio") &&
        presse.includes("/tatoueur/"),
      presse.split("\n")[0] ?? "(vide)"
    );
  } catch (erreur) {
    nonJoue("§1 · vivant", String(erreur).slice(0, 110));
  } finally {
    await contexte.close();
    await nav.close();
  }
}

nonJoue(
  "§1 · LE DÉFAUT LUI-MÊME",
  "il ne se reproduit pas ici (mesuré à la nº 280 : zéro écart sur " +
    "vingt défilements, et la correction posée alors n'a rien changé " +
    "chez le propriétaire). C'est POUR CELA que cette passe ne corrige " +
    "rien : elle livre l'instrument qui dira, sur SON téléphone, quelle " +
    "valeur ne tombe pas juste"
);

/* ==================================================================
 * §2 — L'IMAGE DE PARTAGE
 * ================================================================== */
titre("§2 — à la source : une composition, deux portes");
{
  verif(
    "la composition est PARTAGÉE (lib/image-partage-fiche) et prend les " +
      "tags du carrousel",
    /export async function imagePartageDeLaFiche/.test(compositionNu) &&
      /export type TagsPartage/.test(composition) &&
      /photoChoisie\(\s*tatoueur,\s*tags\.style \?\? "",\s*tags\.rendu,\s*tags\.nature\s*\)/.test(
        compositionNu
      )
  );
  verif(
    "`opengraph-image` la consomme SANS tags (l'aperçu par défaut n'a " +
      "pas changé), et ne dessine plus rien lui-même",
    /return imagePartageDeLaFiche\(slug\);/.test(ogNu) &&
      !/ImageResponse\(/.test(ogNu)
  );
  verif(
    "la ROUTE `/tatoueur/<slug>/partage` reçoit les tags, les nettoie " +
      "avec les fonctions du site, et rend la même composition",
    /export async function GET/.test(route) &&
      /styleConnu\(adresse\.searchParams\.get\("style"\)/.test(route) &&
      /natureCherchee\(adresse\.searchParams\.get\("nature"\)/.test(route) &&
      /SLUGS_RENDUS\.has\(rendu\) \? rendu : ""/.test(route) &&
      /return imagePartageDeLaFiche\(slug, tags\);/.test(route)
  );
  verif(
    "les MÉTADONNÉES de la page l'annoncent — et seulement quand " +
      "l'adresse désigne un carrousel",
    /tagsPartage\.toString\(\)/.test(pageFiche) &&
      /\/partage` \+/.test(pageFiche) &&
      /openGraph: imageDuCarrousel, twitter: imageDuCarrousel/.test(pageFiche)
  );
}

titre("§2 — REJEU : la photo choisie suit bien le carrousel demandé");
{
  //  ⚠️ ON REJOUE LA FONCTION LIVRÉE (`photoChoisie`), extraite du
  //  fichier — jamais une copie écrite ici. C'est elle qui décide de
  //  la photo de l'image de partage.
  const debut = photoLib.indexOf("export function photoChoisie");
  const fin = photoLib.indexOf("export function legendeDeCarte");
  const source = photoLib
    .slice(debut, fin)
    .replace(/export function photoChoisie\([\s\S]*?\): PhotoTatoueur \| null \{/, "function photoChoisie(tatoueur, style, rendu, nature) {")
    .replace(/: PhotoTatoueur \| null/g, "")
    .replace(/: string/g, "")
    .replace(/\?\?/g, "??");
  const outils = `
    const NATURE_PAR_DEFAUT = "tatouage";
    const natureConnue = (n) => (n === "flash" ? "flash" : "tatouage");
    const galerieOrdonnee = (p) => [...(p ?? [])].sort((a, b) => a.ordre - b.ordre);
  `;
  const photoChoisie = new Function(
    `${outils}${source}; return photoChoisie;`
  )();

  //  UNE FICHE À DEUX CARROUSELS — le cas exact du §2 : des
  //  réalisations en lettering, et des flashs en lettering.
  const fiche = {
    galerie: [
      { id: "r1", style: "lettering", rendu: "black_and_grey", nature: "tatouage", ordre: 0 },
      { id: "r2", style: "lettering", rendu: "black_and_grey", nature: "tatouage", ordre: 1 },
      { id: "f1", style: "lettering", rendu: "black_and_grey", nature: "flash", ordre: 2 },
    ],
  };
  const realisations = photoChoisie(fiche, "lettering", "black_and_grey", "tatouage");
  const flashs = photoChoisie(fiche, "lettering", "black_and_grey", "flash");
  const sansTag = photoChoisie(fiche, "", undefined, undefined);
  verif(
    "deux carrousels de la même fiche donnent DEUX photos différentes",
    realisations?.id === "r1" && flashs?.id === "f1",
    `réalisations → ${realisations?.id} · flashs → ${flashs?.id}`
  );
  verif(
    "sans tag, c'est la première photo de la galerie — la vitrine " +
      "(jamais rien de vide)",
    sansTag?.id === "r1",
    `→ ${sansTag?.id}`
  );
}

titre("§2 — VIVANT : la route répond, aux bonnes dimensions");
{
  const adresses = [
    `${BASE}${FICHE}/partage?style=lettering&nature=tatouage&rendu=black_and_grey`,
    `${BASE}${FICHE}/partage?style=lettering&nature=flash&rendu=black_and_grey`,
    `${BASE}${FICHE}/partage`,
  ];
  try {
    const reponses = [];
    for (const adresse of adresses) {
      const reponse = await fetch(adresse);
      const octets = Buffer.from(await reponse.arrayBuffer());
      reponses.push({
        statut: reponse.status,
        type: reponse.headers.get("content-type"),
        //  Les dimensions se lisent dans l'en-tête PNG (octets 16 à 24).
        largeur: octets.readUInt32BE(16),
        hauteur: octets.readUInt32BE(20),
        taille: octets.byteLength,
      });
    }
    verif(
      "les trois adresses répondent une image PNG de 1200 × 630",
      reponses.every(
        (r) =>
          r.statut === 200 &&
          r.type?.includes("image/png") &&
          r.largeur === 1200 &&
          r.hauteur === 630
      ),
      reponses.map((r) => `${r.statut} ${r.largeur}×${r.hauteur}`).join(" · ")
    );
    verif(
      "une adresse SANS tag répond aussi (jamais d'erreur, jamais de " +
        "vide) — c'est l'aperçu de la fiche",
      reponses[2].statut === 200 && reponses[2].taille > 1000,
      `${reponses[2].taille} octets`
    );
  } catch (erreur) {
    nonJoue("§2 · vivant", String(erreur).slice(0, 110));
  }
}

nonJoue(
  "§2 · DEUX IMAGES DIFFÉRENTES, EN VIVANT",
  "mesuré ici : les trois appels rendent la MÊME image — et c'est une " +
    "règle antérieure, pas un défaut de cette passe. Les fiches " +
    "servies dans ce conteneur sont des fiches de DÉMONSTRATION, et " +
    "l'image de partage refuse de montrer un faux tatoueur (elle rend " +
    "l'image de marque : « Ton prochain tatouage commence par un " +
    "style »). La sélection de photo, elle, est prouvée par le REJEU " +
    "ci-dessus. Sur une VRAIE fiche, la manip du compte rendu montre " +
    "deux images différentes"
);

/* ==================================================================
 * §3 — LE DIAGNOSTIC : les faits vérifiables, ancrés ici
 * ==================================================================
 * ⚠️ AUCUNE CORRECTION DANS CETTE PASSE — c'est la consigne. Ce bloc
 * ne fait que FIXER les faits sur lesquels le tableau du compte rendu
 * s'appuie, pour qu'ils ne se perdent pas d'une passe à l'autre.
 */
titre("§3 — diagnostic : les règles qui décident qu'un carrousel s'affiche");
{
  const tatoueursNu = sansNotes(lire("src/lib/tatoueurs.ts"));
  const classementNu = sansNotes(lire("src/lib/classement-carrousels.ts"));
  const accueilNu = sansNotes(lire("src/app/(tatouage)/page.tsx"));
  const recherche = lire("supabase/yokofolio-recherche-sans-masquage.sql");

  verif(
    "RÈGLE 1 — la fiche doit être EN LIGNE (publiée, non supprimée, " +
      "pas hors ligne, non refusée) : une seule écriture, `estEnLigne`",
    /export function estEnLigne/.test(tatoueursNu) &&
      /fiche\.publie === true &&\s*!fiche\.supprime_le &&\s*fiche\.hors_ligne !== true &&\s*fiche\.statut !== "refusee"/.test(
        tatoueursNu
      )
  );
  verif(
    "RÈGLE 2 — AU PLUS DEUX carrousels d'un même artiste PAR PAGE ; le " +
      "reste attend la page suivante (nº 279-§3)",
    /const PAR_ARTISTE_ET_PAR_PAGE = 2;/.test(classementNu)
  );
  verif(
    "RÈGLE 3 — le RANG vient du classement vieillissant : un carrousel " +
      "ancien descend, et peut tomber au-delà de la page regardée",
    /const VIEILLISSEMENT = 1\.2;/.test(classementNu)
  );
  verif(
    "RÈGLE 4 — LE PLAFOND DE PHOTOS PAR FICHE. La lecture en base ne " +
      "rapporte que `p_photos_max` photos par fiche (l'accueil demande " +
      "PLAFOND_GALERIE = 20), triées par `ordre`",
    /limit greatest\(coalesce\(p_photos_max, 1\), 1\)/.test(recherche) &&
      /export const PLAFOND_GALERIE = 20;/.test(lire("src/lib/photos-tatoueur.ts")) &&
      /photosMax: PLAFOND_GALERIE,/.test(accueilNu)
  );
  //  LA CONSÉQUENCE, PROUVÉE PAR REJEU : depuis la nº 279, ces photos
  //  sont ÉCLATÉES en carrousels — donc un carrousel dont aucune photo
  //  n'entre dans les vingt premières N'EXISTE PAS pour la mosaïque.
  const galerie = [];
  for (let rang = 0; rang < 25; rang += 1) {
    galerie.push({
      id: `p${rang}`,
      style: "japonais",
      rendu: "black_and_grey",
      //  Les vingt premières sont des réalisations ; les flashs ont été
      //  déposés APRÈS — le cas le plus courant.
      nature: rang < 20 ? "tatouage" : "flash",
      url: "",
      miniature: null,
      ordre: rang,
    });
  }
  const cle = (photo) =>
    `${photo.style}·${photo.nature}·${photo.rendu}`;
  const carrouselsComplets = new Set(galerie.map(cle));
  const carrouselsServis = new Set(galerie.slice(0, 20).map(cle));
  verif(
    "CONSÉQUENCE MESURÉE : une fiche de 25 photos dont les flashs sont " +
      "déposés en dernier PERD son carrousel de flashs — la lecture " +
      "s'arrête à la vingtième photo",
    carrouselsComplets.size === 2 && carrouselsServis.size === 1,
    `portfolio réel : ${carrouselsComplets.size} carrousels · servis à la mosaïque : ${carrouselsServis.size}`
  );
  nonJoue(
    "§3 · LES DEUX CAS NOMMÉS (Funambulink, Graphink)",
    "ils vivent dans la base du propriétaire, hors de portée de ce " +
      "conteneur : je ne peux pas compter leurs photos ni lire leur " +
      "rang. Le tableau du compte rendu donne les règles, la cause la " +
      "plus probable pour chacun, et la vérification exacte à faire " +
      "(compter les photos de la fiche, et le rang du carrousel absent)"
  );
}

bilan();
