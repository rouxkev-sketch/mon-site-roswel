/**
 * BANC DE LA PASSE Nº 283 — L'ALGORITHME DE L'ACCUEIL
 * ==================================================================
 * §1 LE PLAFOND DE VINGT PHOTOS PAR FICHE A DISPARU (règle 2). Il ne
 *    coupait plus une galerie depuis la nº 279 : il faisait disparaître
 *    des cartes entières. Ce qu'on demande à la base ne décide plus de
 *    ce qui existe ;
 * §2 LA LIMITE EST DANS LE CARROUSEL (règle 3) — PREUVE Nº 3 : la fiche
 *    de 25 photos dont les flashs sont déposés en dernier, celle du
 *    diagnostic de la nº 281. Elle servait 1 carrousel ; elle en sert 2 ;
 * §3 LE DÉPARTAGE À NOTE ÉGALE (règle 5) — PREUVE Nº 4 : trois photos
 *    contre onze, sans aucun cœur. Le plus fourni passe devant, et le
 *    premier cœur rend la main à la note de la règle 4 ;
 * §4 CE QU'ON NE CASSE PAS : les deux carrousels par artiste et par page
 *    (règle 6), la page « colonnes × 6 » (règle 7), la meilleure note
 *    d'abord (règle 8), et le préfixe stable dont dépendent « Voir
 *    plus » et la restauration de position.
 *
 * ⚠️ LE REJEU EST CELUI DU VRAI CODE, pas d'une paraphrase : les
 * fichiers `src/lib/carrousels.ts`, `photos-tatoueur.ts` et
 * `classement-carrousels.ts` sont chargés TELS QUELS (Node retire les
 * annotations de type). Si le code change, ce banc change avec lui —
 * c'est tout l'intérêt.
 * ⚠️ UNE SEULE LARGEUR (1440 px, livraison rapide).
 * ⚠️ LA BASE DU PROPRIÉTAIRE EST HORS DE PORTÉE DE CE CONTENEUR : la
 * migration nº 69 n'est PAS exécutée ici (elle ne l'est jamais). Sa
 * clause de coupe est prouvée à part, sur un PostgreSQL local — voir la
 * section §1, et le compte rendu.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BASE,
  bilan,
  chromium,
  lire,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const tatoueursNu = sansNotes(lire("src/lib/tatoueurs.ts"));
const configNu = sansNotes(lire("src/config/tatouage.ts"));
const accueilNu = sansNotes(lire("src/app/(tatouage)/page.tsx"));
const carrouselsNu = sansNotes(lire("src/lib/carrousels.ts"));
const classementNu = sansNotes(lire("src/lib/classement-carrousels.ts"));
const migration = lire("supabase/yokofolio-carrousels-jamais-coupes.sql");

/* ==================================================================
 * LE REJEU — le vrai code, chargé tel quel
 * ================================================================== */
/*  Les trois fichiers vivent avec les alias `@/…` de Next ; on les
    recopie côte à côte, alias réécrits, dans un dossier temporaire.
    Seul `libelleStyle` (un libellé d'affichage, sans effet sur le
    groupement) est remplacé par un bouchon. */
const atelier = mkdtempSync(join(tmpdir(), "verif-p283-"));
const reecrire = (texte) =>
  texte
    .replace(/from "@\/config\/tatouage"/g, 'from "./config-tatouage.ts"')
    .replace(/from "@\/lib\/([a-z-]+)"/g, 'from "./$1.ts"');
for (const nom of ["photos-tatoueur", "classement-carrousels", "carrousels"]) {
  writeFileSync(`${atelier}/${nom}.ts`, reecrire(lire(`src/lib/${nom}.ts`)));
}
writeFileSync(
  `${atelier}/config-tatouage.ts`,
  "export function libelleStyle(s: string): string { return s; }\n"
);
const { carrouselsDeLaFiche } = await import(`${atelier}/carrousels.ts`);
const { classerCarrousels, PHOTOS_PAR_CARROUSEL_ABSENT } = await import(
  `${atelier}/classement-carrousels.ts`
).then((m) => m);
const { PHOTOS_PAR_CARROUSEL } = await import(`${atelier}/photos-tatoueur.ts`);
void PHOTOS_PAR_CARROUSEL_ABSENT;

/** Une photo de portfolio, telle qu'elle arrive de la base. */
const photo = (n, tags) => ({
  id: `p${n}`,
  style: tags.style,
  rendu: tags.rendu,
  nature: tags.nature,
  url: `/u${n}`,
  miniature: `/m${n}`,
  ordre: n,
  cree_le: tags.creeLe ?? null,
});

/** Une fiche, avec sa galerie dans l'ordre de l'artiste. */
const fiche = (slug, galerie) => ({
  id: `id-${slug}`,
  slug,
  nom: slug,
  styles: [...new Set(galerie.map((p) => p.style))],
  galerie,
});

/* ==================================================================
 * §1 — LE PLAFOND PAR FICHE A DISPARU
 * ================================================================== */
titre("§1 — à la source : ce qu'on demande à la base ne décide plus rien");
{
  verif(
    "la recherche ne demande PLUS `filtres.photosMax` photos par fiche",
    !/p_photos_max: Math\.max\(filtres\.photosMax/.test(tatoueursNu)
  );
  verif(
    "elle demande LARGE, et par un nombre nommé",
    /p_photos_max: PHOTOS_LUES_PAR_FICHE/.test(tatoueursNu) &&
      /export const PHOTOS_LUES_PAR_FICHE = 500;/.test(configNu)
  );
  verif(
    "l'accueil demande DIX photos par carte (règle 3), plus vingt",
    /photosMax: PHOTOS_PAR_CARROUSEL/.test(accueilNu) &&
      !/photosMax: PLAFOND_GALERIE/.test(accueilNu) &&
      PHOTOS_PAR_CARROUSEL === 10,
    `PHOTOS_PAR_CARROUSEL = ${PHOTOS_PAR_CARROUSEL}`
  );
  verif(
    "le plafond d'UNE GALERIE reste vingt — ce sont deux nombres " +
      "différents, et les confondre était le défaut",
    /export const PLAFOND_GALERIE = 20;/.test(sansNotes(lire("src/lib/photos-tatoueur.ts")))
  );
}

titre("§1 — la migration nº 69 : la coupe passe dans le carrousel");
{
  verif(
    "le fichier existe et porte son numéro",
    /MIGRATION Nº 69/.test(migration) &&
      /rechercher_tatoueurs/.test(migration)
  );
  verif(
    "elle numérote les photos DANS CHAQUE carrousel",
    /row_number\(\) over \(/.test(migration) &&
      /rang_dans_le_carrousel/.test(migration)
  );
  verif(
    "les trois replis du groupement sont ceux du site (style vide, " +
      "nature « tatouage », rendu « black_and_grey »)",
    /coalesce\(p3\.style, ''\)/.test(migration) &&
      /then p3\.nature else 'tatouage' end/.test(migration) &&
      /coalesce\(p3\.rendu, 'black_and_grey'\)/.test(migration)
  );
  verif(
    "l'ancienne coupe PAR FICHE n'existe plus que dans un commentaire",
    (migration.match(/^\s*limit greatest\(coalesce\(p_photos_max/gm) ?? [])
      .length === 0 &&
      /--      limit greatest\(coalesce\(p_photos_max, 1\), 1\)/.test(migration)
  );
  verif(
    "elle borne à DIX photos par carrousel",
    /<= least\(greatest\(coalesce\(p_photos_max, 1\), 1\), 10\)/.test(migration)
  );
  verif(
    "elle dit au propriétaire combien de carrousels elle rend visibles",
    /CETTE MIGRATION REND VISIBLES/.test(migration)
  );
}

/* ==================================================================
 * §2 — PREUVE Nº 3 : LA FICHE DE 25 PHOTOS, FLASHS EN DERNIER
 * ================================================================== */
titre("§2 — rejeu : la fiche du diagnostic de la nº 281 (25 photos)");
{
  //  Vingt réalisations en réalisme, puis cinq flashs — c'est le cas
  //  exact du diagnostic : les flashs sont déposés EN DERNIER.
  const galerie = [
    ...Array.from({ length: 20 }, (_, i) =>
      photo(i + 1, { style: "realisme", rendu: "black_and_grey", nature: "tatouage" })
    ),
    ...Array.from({ length: 5 }, (_, i) =>
      photo(21 + i, { style: "realisme", rendu: "black_and_grey", nature: "flash" })
    ),
  ];

  //  AVANT — ce que la base renvoyait : les VINGT PREMIÈRES photos de
  //  la fiche, dans l'ordre de l'artiste (sans style ni nature
  //  cherchés, l'ordre de pertinence de l'ancienne clause se réduisait
  //  à `ordre`). Les cinq flashs n'arrivaient jamais.
  const avant = carrouselsDeLaFiche(fiche("salon", galerie.slice(0, 20)));
  //  APRÈS — la base renvoie tout ce qui est utile (PHOTOS_LUES_PAR_FICHE),
  //  et la coupe se fait dans le carrousel.
  const apres = carrouselsDeLaFiche(fiche("salon", galerie));

  verif(
    "AVANT : la fiche ne servait qu'UN carrousel sur DEUX réels",
    avant.length === 1,
    `${avant.length} carrousel(s) servi(s)`
  );
  verif(
    "APRÈS : elle en sert DEUX — le carrousel de flashs est revenu",
    apres.length === 2,
    `${apres.length} carrousel(s) servi(s)`
  );
  verif(
    "et ce sont bien les deux natures",
    apres.map((c) => c.nature).sort().join(" · ") === "flash · tatouage",
    apres.map((c) => `${c.nature}(${c.photos.length})`).join(" · ")
  );
  verif(
    "RÈGLE 3 — au plus dix photos par carrousel, jamais un carrousel " +
      "supprimé",
    apres.every((c) => c.photos.length <= 10) &&
      apres.find((c) => c.nature === "tatouage").photos.length === 10 &&
      apres.find((c) => c.nature === "flash").photos.length === 5,
    apres.map((c) => `${c.nature} → ${c.photos.length}`).join(" · ")
  );
  verif(
    "RÈGLE 1 — la première photo est celle que l'artiste a mise en " +
      "tête, et l'ordre est le sien",
    apres.every((c) =>
      c.photos.every((p, rang) => rang === 0 || p.ordre > c.photos[rang - 1].ordre)
    ) &&
      apres.find((c) => c.nature === "tatouage").photos[0].ordre === 1 &&
      apres.find((c) => c.nature === "flash").photos[0].ordre === 21
  );
  verif(
    "la galerie servie à la carte est celle du carrousel, coupée à dix",
    apres.every((c) => c.fiche.galerie.length === c.photos.length)
  );
}

titre("§2 — rejeu : RÈGLE 2, un salon à cinq styles est entier");
{
  //  Cinq styles de vingt photos chacun : cent photos, cinq carrousels.
  //  Sous l'ancien plafond, seul le premier style existait.
  const styles = ["realisme", "japonais", "blackwork", "old_school", "tribal"];
  const galerie = styles.flatMap((style, s) =>
    Array.from({ length: 20 }, (_, i) =>
      photo(s * 20 + i + 1, { style, rendu: "black_and_grey", nature: "tatouage" })
    )
  );
  const avant = carrouselsDeLaFiche(fiche("cinq-styles", galerie.slice(0, 20)));
  const apres = carrouselsDeLaFiche(fiche("cinq-styles", galerie));
  verif(
    "AVANT : un seul style sur cinq — celui des vingt premières photos",
    avant.length === 1 && avant[0].style === "realisme",
    `${avant.length} carrousel(s)`
  );
  verif(
    "APRÈS : les CINQ carrousels sont là, aucun n'est supprimé",
    apres.length === 5 &&
      styles.every((style) => apres.some((c) => c.style === style)),
    apres.map((c) => c.style).join(" · ")
  );
  verif(
    "et chacun est borné à dix photos (50 lignes, pas 100)",
    apres.every((c) => c.photos.length === 10) &&
      apres.reduce((somme, c) => somme + c.photos.length, 0) === 50,
    `${apres.reduce((s, c) => s + c.photos.length, 0)} photos rapatriées`
  );
}

/* ==================================================================
 * §3 — PREUVE Nº 4 : LE DÉPARTAGE À NOTE ÉGALE (RÈGLE 5)
 * ================================================================== */
titre("§3 — rejeu : sans aucun cœur, le plus fourni passe devant");
{
  const carrousel = (cle, nbPhotos, popularite = 0, ageJours = 0) => ({
    cle,
    artisteId: `artiste-${cle}`,
    signaux: {
      popularite,
      ageJours,
      distanceKm: null,
      personnalisation: 0,
      photos: nbPhotos,
    },
  });

  //  L'ordre d'ENTRÉE met le petit devant : sans la règle 5, il
  //  gagnerait (c'était le défaut).
  const liste = [carrousel("petit", 3), carrousel("fourni", 11)];
  const classes = classerCarrousels(liste, {
    popularite: true,
    proximite: false,
    varieteDesArtistes: true,
    parPage: 24,
  });
  verif(
    "PREUVE Nº 4 — 3 photos contre 11, aucun cœur : LE PLUS FOURNI " +
      "PASSE DEVANT",
    classes[0].cle === "fourni",
    classes.map((c) => `${c.cle}(${c.signaux.photos})`).join(" → ")
  );

  //  À nombre de photos égal : le plus récent.
  const memeTaille = classerCarrousels(
    [carrousel("vieux", 8, 0, 30), carrousel("recent", 8, 0, 1)],
    { popularite: true, proximite: false, varieteDesArtistes: true, parPage: 24 }
  );
  verif(
    "à nombre de photos égal : le PLUS RÉCENT devant",
    memeTaille[0].cle === "recent",
    memeTaille.map((c) => `${c.cle}(${c.signaux.ageJours} j)`).join(" → ")
  );

  //  DÈS QU'IL Y A DES CŒURS, la note de la règle 4 reprend la main
  //  toute seule : le petit carrousel aimé repasse devant le gros.
  const avecCoeurs = classerCarrousels(
    [carrousel("petit-aime", 3, 3), carrousel("fourni-ignore", 11, 0)],
    { popularite: true, proximite: false, varieteDesArtistes: true, parPage: 24 }
  );
  verif(
    "RÈGLE 4 REPREND LA MAIN dès le premier cœur (3 points) : le petit " +
      "carrousel aimé repasse devant le gros ignoré",
    avecCoeurs[0].cle === "petit-aime",
    avecCoeurs.map((c) => c.cle).join(" → ")
  );
  verif(
    "le départage n'est PAS un terme de la note : il ne s'écrit que " +
      "dans le tri, après la comparaison des scores",
    /b\.score - a\.score \|\|\s*b\.element\.signaux\.photos - a\.element\.signaux\.photos/.test(
      classementNu.replace(/\s+/g, " ").replace(/ \|\| /g, " || ")
    ) ||
      /b\.element\.signaux\.photos - a\.element\.signaux\.photos/.test(classementNu)
  );
  verif(
    "et il ne compte pas dans le score : `scoreDuCarrousel` ignore " +
      "`photos`",
    !/photos/.test(
      classementNu.slice(
        classementNu.indexOf("export function scoreDuCarrousel"),
        classementNu.indexOf("export type OptionsClassement")
      )
    )
  );
}

/* ==================================================================
 * §4 — CE QU'ON NE CASSE PAS
 * ================================================================== */
titre("§4 — rejeu : les règles 6, 7 et 8, et le préfixe stable");
{
  const carrousel = (cle, artisteId, nbPhotos, popularite) => ({
    cle,
    artisteId,
    signaux: {
      popularite,
      ageJours: 0,
      distanceKm: null,
      personnalisation: 0,
      photos: nbPhotos,
    },
  });

  verif(
    "RÈGLE 6 — le plafond « deux par artiste et par page » est intact",
    /const PAR_ARTISTE_ET_PAR_PAGE = 2;/.test(classementNu)
  );

  //  Un salon à CINQ carrousels, dans une page de quatre cartes : deux
  //  en page 1, deux en page 2, un en page 3 — jamais amputé.
  const salon = Array.from({ length: 5 }, (_, i) =>
    carrousel(`salon-${i}`, "salon", 10, 0)
  );
  const autres = Array.from({ length: 8 }, (_, i) =>
    carrousel(`autre-${i}`, `artiste-${i}`, 10, 0)
  );
  const etales = classerCarrousels([...salon, ...autres], {
    popularite: true,
    proximite: false,
    varieteDesArtistes: true,
    parPage: 4,
  });
  const pageDe = (rang) => etales.slice(rang * 4, rang * 4 + 4);
  verif(
    "RÈGLE 6 — un salon à cinq carrousels occupe TROIS pages, et n'en " +
      "perd aucun",
    etales.filter((c) => c.artisteId === "salon").length === 5 &&
      [0, 1, 2].every(
        (rang) =>
          pageDe(rang).filter((c) => c.artisteId === "salon").length <= 2
      ),
    [0, 1, 2]
      .map(
        (rang) =>
          `page ${rang + 1} : ${
            pageDe(rang).filter((c) => c.artisteId === "salon").length
          }`
      )
      .join(" · ")
  );

  verif(
    "RÈGLE 7 — la page vaut `colonnes × 6`, et l'accueil la lit toujours",
    /colonnes \* 6|CARTES_PAR_COLONNE/.test(lire("src/lib/colonnes-mosaique.ts")) &&
      /taillePage: taillePage|taillePage,/.test(accueilNu)
  );

  //  RÈGLE 8 + le préfixe stable : la liste servie pour 4 cartes est le
  //  DÉBUT exact de celle servie pour 8 — c'est ce dont dépendent
  //  « Voir plus » et la restauration de position.
  const melange = [
    carrousel("c1", "a1", 4, 0),
    carrousel("c2", "a2", 9, 10),
    carrousel("c3", "a3", 2, 3),
    carrousel("c4", "a4", 12, 0),
    carrousel("c5", "a5", 7, 40),
    carrousel("c6", "a6", 1, 0),
    carrousel("c7", "a7", 6, 1),
    carrousel("c8", "a8", 3, 0),
  ];
  const options = {
    popularite: true,
    proximite: false,
    varieteDesArtistes: true,
    parPage: 4,
  };
  const tout = classerCarrousels(melange, options);
  const scores = tout.map((c) => (1 + c.signaux.popularite) / Math.pow(2, 1.2));
  verif(
    "RÈGLE 8 — la meilleure note d'abord",
    scores.every((valeur, rang) => rang === 0 || valeur <= scores[rang - 1] + 1e-9),
    tout.map((c) => c.cle).join(" → ")
  );
  const quatre = tout.slice(0, 4);
  const huit = tout.slice(0, 8);
  verif(
    "« VOIR PLUS » NE DÉPLACE RIEN : les quatre premières cartes sont " +
      "identiques quand on en demande huit",
    quatre.every((c, rang) => huit[rang].cle === c.cle),
    quatre.map((c) => c.cle).join(" · ")
  );
  //  Et deux appels d'affilée donnent le même ordre (l'âge est ancré au
  //  jour, jamais à la milliseconde) : c'est le piège des nº 61 et 63.
  const bis = classerCarrousels(melange, options);
  verif(
    "L'ORDRE NE BOUGE PAS D'UN APPEL À L'AUTRE (âge ancré au jour)",
    bis.every((c, rang) => tout[rang].cle === c.cle)
  );
}

/* ==================================================================
 * §5 — VIVANT : l'accueil répond et montre des cartes
 * ================================================================== */
titre("§5 — vivant (1440 px) : l'accueil rend toujours sa mosaïque");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 1440, height: 950 },
    });
    const page = await contexte.newPage();
    const reponse = await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    const etat = await page.evaluate(() => {
      const cartes = [...document.querySelectorAll("[data-carte]")];
      return {
        cartes: cartes.length,
        //  LA CLÉ D'UNE CARTE EST CELLE D'UN CARROUSEL
        //  (`slug·style·nature·rendu`, lib/carrousels) : c'est à cela
        //  qu'on voit, DANS LA PAGE RENDUE, que l'unité est bien le
        //  carrousel et non la fiche.
        clesDeCarrousel: cartes.filter((carte) =>
          (carte.getAttribute("data-carte") ?? "").includes("·")
        ).length,
        //  ⚠️ EN PLUSIEURS COLONNES, LA CARTE NE MONTE PAS SON
        //  CARROUSEL (`carrouselDansLaCarte`, nº 211-§5) : il n'est
        //  monté qu'en pleine largeur. On ne cherche donc pas de
        //  colonnes ici — la règle 3 est prouvée au rejeu du §2.
        exemple: cartes[0]?.getAttribute("data-carte") ?? "",
      };
    });
    verif(
      "la page d'accueil répond 200",
      reponse?.status() === 200,
      `${reponse?.status()}`
    );
    verif(
      "elle affiche des cartes",
      etat.cartes > 0,
      `${etat.cartes} carte(s)`
    );
    verif(
      "et chaque carte est un CARROUSEL, pas une fiche (sa clé porte " +
        "les trois tags)",
      etat.cartes > 0 && etat.clesDeCarrousel === etat.cartes,
      `${etat.clesDeCarrousel}/${etat.cartes} · ex. « ${etat.exemple} »`
    );
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
