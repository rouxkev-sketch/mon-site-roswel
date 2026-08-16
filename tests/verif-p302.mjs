/**
 * BANC DE LA PASSE Nº 302 — LIVRAISON RAPIDE
 * ==================================================================
 *  §1 la galerie des portfolios suivis : vingt photos, cinq règles de
 *     composition, et plus de « Voir plus » ;
 *  §2 plus aucun cœur sur ces vignettes ;
 *  §3 un cœur ne met en favori QUE la photo cliquée (annulation) ;
 *  §4 cliquer une photo tombe PILE sur cette photo.
 *
 * ⚠️ LE §1 N'EST PAS LU, IL EST EXÉCUTÉ. Les règles de composition sont
 * du calcul pur : le banc charge `lib/selection-suivis` pour de bon
 * (crochet d'alias `_alias-src.mjs`, Node 22 lit le TypeScript) et
 * regarde ce que la fonction REND sur des portfolios fabriqués. C'est
 * la seule preuve qui vaille pour une règle d'ordre.
 * ⚠️ ET LE §4 EST MESURÉ EN VIVANT, sur les deux largeurs.
 * ⚠️ CE QUE CE BANC NE PEUT PAS FAIRE : ouvrir « Ma sélection » (elle
 * exige une vraie session Supabase, voir la section NON JOUÉE) et
 * compter les lignes de la migration (le réseau de ce conteneur
 * n'atteint pas la base).
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("./_alias-src.mjs", import.meta.url);

import {
  BASE,
  RACINE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const { bandeDeTrois, VIGNETTES_MAX, PHOTOS_POUR_ALTERNER } = await import(
  pathToFileURL(`${RACINE}/src/lib/selection-suivis.ts`).href
);
const { ouvertureGalerie } = await import(
  pathToFileURL(`${RACINE}/src/lib/photo-tatoueur.ts`).href
);

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const blocSuivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
const bouton = sansNotes(lire("src/components/BoutonCoeurPhoto.tsx"));
const favYoko = sansNotes(lire("src/lib/favoris-yokofolio.ts"));
const fenetreF = sansNotes(lire("src/components/FenetreFiche.tsx"));
const pageFav = sansNotes(lire("src/components/PageFavoris.tsx"));
const carte = sansNotes(lire("src/components/CarteTatoueur.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const serveur = sansNotes(lire("src/lib/favoris-serveur.ts"));
const migration = lire("supabase/yokofolio-coeur-une-photo.sql");

//  La fiche de démonstration au carrousel le plus fourni (quatre
//  photos) — relevé sur les douze de l'accueil.
const FICHE = "studio-cameleon-bordeaux";

/** Fabrique un portfolio suivi : `photos` décrit style/rendu/j'aime. */
const portfolio = (photos) => ({
  id: "t1",
  nom: "Essai",
  slug: "essai",
  ville: "Lyon",
  region: null,
  pays: "France",
  codePays: "FR",
  photoProfil: null,
  typeFiche: "artiste",
  etablissement: "salon",
  modes: [],
  nouveautes: 0,
  recentes: photos.map((p, rang) => ({
    id: p.id ?? `${p.style}-${rang}`,
    url: "u",
    miniature: "m",
    style: p.style,
    rendu: p.rendu ?? "noir-et-gris",
    nature: p.nature ?? "tatouage",
    creeLe: "2026-01-01",
    ordre: p.ordre ?? rang,
    jaime: p.jaime ?? 0,
  })),
});
/** N photos d'un style, dans l'ordre de l'artiste. */
const lot = (style, n, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({
    style,
    id: `${style}-${i + 1}`,
    ordre: i,
    ...extra,
  }));
const stylesDe = (bande) => bande.photos.map((p) => p.style);
const idsDe = (bande) => bande.photos.map((p) => p.id);

titre("§1 — les cinq règles, EXÉCUTÉES");
{
  verif(
    "LE PLAFOND EST VINGT (c'était dix), et le seuil d'alternance HUIT",
    VIGNETTES_MAX === 20 && PHOTOS_POUR_ALTERNER === 8,
    `max ${VIGNETTES_MAX} · seuil ${PHOTOS_POUR_ALTERNER}`
  );

  //  RÈGLE 1 — jamais un flash.
  const avecFlashs = bandeDeTrois(
    portfolio([
      ...lot("realisme", 5),
      ...lot("japonais", 6, { nature: "flash" }),
    ])
  );
  verif(
    "RÈGLE 1 — QUE DES RÉALISATIONS : les six flashs sont écartés, il " +
      "reste les cinq réalisations",
    avecFlashs.photos.length === 5 &&
      avecFlashs.photos.every((p) => p.nature !== "flash"),
    stylesDe(avecFlashs).join(" · ")
  );

  //  RÈGLE 2 — un seul style, deux rendus : on alterne.
  const unSeul = bandeDeTrois(
    portfolio([
      ...lot("realisme", 5, { rendu: "couleur" }),
      ...lot("realisme", 5, { rendu: "noir-et-gris" }),
    ])
  );
  verif(
    "RÈGLE 2 — UN SEUL CARROUSEL DIVISÉ EN COULEUR ET NOIR ET GRIS : on " +
      "ALTERNE, une couleur, une noir et gris, et ainsi de suite",
    unSeul.photos.every((p, i) =>
      i % 2 === 0 ? p.rendu === "couleur" : p.rendu === "noir-et-gris"
    ) && unSeul.photos.length === 10,
    unSeul.photos.map((p) => p.rendu[0]).join("")
  );
  const unSeulUnRendu = bandeDeTrois(portfolio(lot("realisme", 12)));
  verif(
    "…ET UN SEUL CARROUSEL NON DIVISÉ : ses photos, dans l'ordre de " +
      "l'artiste, sans rien inventer",
    idsDe(unSeulUnRendu).join(",") ===
      lot("realisme", 12).map((p) => p.id).join(","),
    idsDe(unSeulUnRendu).slice(0, 4).join(" · ")
  );

  //  RÈGLE 3 — deux styles, tour de rôle.
  const deux = bandeDeTrois(
    portfolio([...lot("realisme", 12), ...lot("japonais", 12)])
  );
  verif(
    "RÈGLE 3 — DEUX CARROUSELS : une photo du premier, une du deuxième, " +
      "en boucle, jusqu'à vingt",
    deux.photos.length === 20 &&
      stylesDe(deux).every((s, i) => s === (i % 2 === 0 ? "realisme" : "japonais")),
    stylesDe(deux).slice(0, 6).join(" · ") + " …"
  );
  const trois = bandeDeTrois(
    portfolio([...lot("a", 9), ...lot("b", 9), ...lot("c", 9)])
  );
  verif(
    "…ET LE MÊME PRINCIPE À TROIS : a, b, c, a, b, c…",
    stylesDe(trois).slice(0, 9).join("") === "abcabcabc" &&
      trois.photos.length === 20,
    stylesDe(trois).slice(0, 9).join(" · ")
  );

  //  RÈGLE 4 — en dessous de huit, on n'alterne pas.
  const inegal = bandeDeTrois(
    portfolio([...lot("realisme", 12), ...lot("japonais", 5)])
  );
  verif(
    "RÈGLE 4 — UN STYLE À CINQ PHOTOS N'ENTRE PAS DANS L'ALTERNANCE : " +
      "la galerie ne montre que le style à douze",
    new Set(stylesDe(inegal)).size === 1 &&
      stylesDe(inegal)[0] === "realisme" &&
      inegal.photos.length === 12,
    `${inegal.photos.length} photos · ${[...new Set(stylesDe(inegal))].join(", ")}`
  );
  const huit = bandeDeTrois(
    portfolio([...lot("realisme", 12), ...lot("japonais", 8)])
  );
  verif(
    "…ET HUIT SUFFIT — le seuil est bien « AU MOINS 8 », pas « plus de 8 »",
    new Set(stylesDe(huit)).size === 2,
    stylesDe(huit).slice(0, 4).join(" · ")
  );
  const tousPetits = bandeDeTrois(
    portfolio([...lot("a", 3), ...lot("b", 4)])
  );
  verif(
    "…ET SI PERSONNE N'ATTEINT HUIT, LA GALERIE N'EST PAS VIDE : tous " +
      "les styles reviennent (une règle d'alternance n'est pas une " +
      "règle d'exclusion)",
    tousPetits.photos.length === 7 && new Set(stylesDe(tousPetits)).size === 2,
    `${tousPetits.photos.length} photos · ${stylesDe(tousPetits).slice(0, 4).join(" · ")}`
  );

  //  RÈGLE 5 — les j'aime passent devant, l'alternance tient.
  const aimees = bandeDeTrois(
    portfolio([
      ...lot("realisme", 10).map((p, i) => ({
        ...p,
        //  La 7ᵉ a 9 j'aime, la 3ᵉ en a 4, les autres zéro.
        jaime: i === 6 ? 9 : i === 2 ? 4 : 0,
      })),
      ...lot("japonais", 10).map((p, i) => ({ ...p, jaime: i === 8 ? 7 : 0 })),
    ])
  );
  verif(
    "RÈGLE 5 — DANS CHAQUE STYLE, LES PLUS AIMÉES D'ABORD, par nombre " +
      "DÉCROISSANT : realisme donne sa 7ᵉ (9 j'aime) puis sa 3ᵉ (4)",
    idsDe(aimees)[0] === "realisme-7" && idsDe(aimees)[2] === "realisme-3",
    idsDe(aimees).slice(0, 6).join(" · ")
  );
  verif(
    "…ET L'ALTERNANCE DE LA RÈGLE 3 N'EST PAS CASSÉE POUR AUTANT : un " +
      "style sur deux, du premier au vingtième",
    stylesDe(aimees).every((s, i) =>
      s === (i % 2 === 0 ? "realisme" : "japonais")
    ),
    stylesDe(aimees).slice(0, 6).join(" · ")
  );
  verif(
    "…ET LE JAPONAIS AUSSI DONNE SA PLUS AIMÉE EN PREMIER (sa 9ᵉ, " +
      "7 j'aime) — chaque style est classé chez lui",
    idsDe(aimees)[1] === "japonais-9",
    idsDe(aimees).slice(0, 4).join(" · ")
  );

  //  LE PLAFOND, ET L'ABSENCE DE MESSAGE.
  const beaucoup = bandeDeTrois(
    portfolio([...lot("a", 30), ...lot("b", 30)])
  );
  verif(
    "VINGT AU PLUS, JAMAIS PLUS",
    beaucoup.photos.length === 20,
    `${beaucoup.photos.length}`
  );
  const peu = bandeDeTrois(portfolio(lot("a", 3)));
  verif(
    "…ET MOINS S'IL Y EN A MOINS, sans message",
    peu.photos.length === 3,
    `${peu.photos.length}`
  );
  verif(
    "LA CASE « VOIR PLUS » EST SUPPRIMÉE, CODE COMPRIS : plus de drapeau, " +
      "plus de case, plus de mot",
    !/voirPlus/.test(blocSuivis) &&
      !/Voir plus/.test(blocSuivis) &&
      !/voirPlus/.test(sansNotes(lire("src/lib/selection-suivis.ts")))
  );
}

titre("§2 — plus aucun cœur sur les vignettes de la galerie");
{
  verif(
    "LE CŒUR EST SUPPRIMÉ, CODE COMPRIS : plus de glyphe, plus de " +
      "marqueur, et le composant d'icône n'est même plus importé",
    !/data-coeur-aime/.test(blocSuivis) &&
      !/IconeCoeur/.test(blocSuivis) &&
      !/bande\.cas/.test(blocSuivis)
  );
  verif(
    "…ET LA GALERIE N'A PLUS BESOIN DES FAVORIS DU VISITEUR : le bloc " +
      "ne les reçoit plus du tout",
    /export function BlocSuivis\(\{ suivis \}/.test(blocSuivis) &&
      /<BlocSuivis suivis=\{suivisVisibles\} \/>/.test(pageFav)
  );
}

titre("§3 — un cœur ne met en favori que la photo");
{
  verif(
    "LA PROP `galerie` EST SUPPRIMÉE DU BOUTON, code compris",
    !/galerie\?: string\[\]/.test(bouton) && !/const visees =/.test(bouton)
  );
  verif(
    "…ET AUCUN APPELANT NE LA PASSE PLUS : ni la carte, ni la fiche, ni " +
      "les deux fenêtres",
    [carte, fiche, fenetreF, sansNotes(lire("src/components/FenetreCarrousel.tsx"))]
      .every((source) => !/galerie=\{/.test(source))
  );
  verif(
    "L'ÉCRITURE DE GALERIE EST SUPPRIMÉE DU CLIENT (`ecrireFavorisPhotos`) " +
      "— il ne reste qu'une porte, `ecrireFavori`",
    !/export async function ecrireFavorisPhotos/.test(favYoko) &&
      /export async function ecrireFavori\(/.test(favYoko)
  );
  verif(
    "LE GESTE, ET LE GESTE REPRIS APRÈS CONNEXION, PORTENT SUR LA MÊME " +
      "SEULE PHOTO",
    /definir\("photo", photoId, suivant\);/.test(bouton) &&
      /void ecrireFavori\("photo", photoId, suivant\)/.test(bouton) &&
      /void ecrireFavori\("photo", photoId, true\);/.test(bouton)
  );
  verif(
    "LA MIGRATION EXISTE, ET ELLE NE CONVERTIT QUE LES VRAIS FAVORIS DE " +
      "CARROUSEL : deux lignes ou plus partageant le MÊME `cree_le` dans " +
      "le même carrousel — un favori posé à la main n'est jamais touché",
    /g\.taille > 1/.test(migration) &&
      /g\.rang\s+> 1/.test(migration) &&
      /f\.cree_le/.test(migration)
  );
  verif(
    "…ELLE GARDE LA PREMIÈRE PHOTO DE L'ARTISTE (`ordre`), et elle " +
      "SUPPRIME sans jamais insérer — aucun compte ne gagne un favori",
    /order by coalesce\(p\.ordre, 0\), p\.id/.test(migration) &&
      /delete from public\.favoris_photos/.test(migration) &&
      !/insert into public\.favoris_photos/.test(migration)
  );
  verif(
    "…ET ELLE PORTE SA REQUÊTE DE COMPTAGE, à passer AVANT : elle " +
      "n'efface rien et donne le nombre exact",
    /lignes_supprimees/.test(migration) && /having count\(\*\) > 1/.test(migration)
  );
}

titre("§4 — `ouvertureGalerie` tombe pile sur la photo, EXÉCUTÉE");
{
  const groupes = [
    {
      slug: "realisme",
      label: "Réalisme",
      photos: Array.from({ length: 14 }, (_, i) => ({
        cle: `r${i + 1}`,
        url: "u",
        miniature: "m",
        rendu: "noir-et-gris",
        nature: "tatouage",
        legende: "",
      })),
    },
    {
      slug: "japonais",
      label: "Japonais",
      photos: Array.from({ length: 19 }, (_, i) => ({
        cle: `j${i + 1}`,
        url: "u",
        miniature: "m",
        rendu: "couleur",
        nature: "tatouage",
        legende: "",
      })),
    },
  ];
  const sans = ouvertureGalerie(groupes, "", "", "");
  verif(
    "SANS `photo`, RIEN NE CHANGE : premier style, première photo",
    sans.style === "realisme" && sans.indice === 0,
    `${sans.style} · ${sans.indice}`
  );
  const huitieme = ouvertureGalerie(groupes, "", "", "", "j8");
  verif(
    "AVEC `photo=j8` : LE CARROUSEL JAPONAIS PASSE EN TÊTE, POSITIONNÉ " +
      "SUR LA 8ᵉ — « 8/19 », pas « 1/19 »",
    huitieme.style === "japonais" &&
      huitieme.indice === 7 &&
      huitieme.groupes[0].photos.length === 19,
    `${huitieme.style} · ${huitieme.indice + 1}/${huitieme.groupes[0].photos.length}`
  );
  verif(
    "LA PHOTO DEMANDÉE PASSE AVANT LES TROIS AUTRES CRITÈRES : même en " +
      "cherchant « realisme », c'est elle qui décide",
    ouvertureGalerie(groupes, "realisme", "", "", "j8").indice === 7 &&
      ouvertureGalerie(groupes, "realisme", "", "", "j8").style === "japonais"
  );
  const introuvable = ouvertureGalerie(groupes, "", "", "", "inconnue");
  verif(
    "UNE PHOTO INTROUVABLE NE CASSE RIEN : on retombe EXACTEMENT sur le " +
      "comportement d'avant",
    introuvable.style === sans.style && introuvable.indice === sans.indice,
    `${introuvable.style} · ${introuvable.indice}`
  );
  verif(
    "LES TROIS ENVELOPPES PASSENT PAR LA MÊME FONCTION — aucun second " +
      "mécanisme n'est écrit : la page, la fenêtre superposée, et la " +
      "carte qui porte la photo dans son adresse",
    /photoInitiale\n/.test(fiche) &&
      /photoRecherche\n/.test(fenetreF) &&
      /if \(photoRecherche\) suite\.set\("photo", photoRecherche\);/.test(carte) &&
      /photoRecherche=\{serieOuverte\.photo\}/.test(pageFav) &&
      /photoRecherche=\{photo\.id\}/.test(pageFav)
  );
  verif(
    "LE SERVEUR LIT CE QU'IL FAUT POUR LA RÈGLE 5 : l'ordre de l'artiste " +
      "et le compte de j'aime, ce dernier par une VUE (la table des " +
      "favoris reste privée)",
    /coeurs_par_photo/.test(serveur) &&
      /jaime: jaimeParPhoto\.get\(ligne\.id\) \?\? 0/.test(serveur) &&
      /ordre: ligne\.ordre \?\? 0/.test(serveur)
  );
}

titre("vivant — la bonne photo, sur les deux largeurs");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    for (const [nom, viewport] of [
      ["web 1440", { width: 1440, height: 900 }],
      ["doigt 390", { width: 390, height: 844 }],
    ]) {
      const contexte = await nav.newContext({ viewport });
      const page = await contexte.newPage();
      await page.goto(`${BASE}/tatoueur/${FICHE}`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      await page.waitForSelector("[data-photo-fiche] [data-photo-cle]", {
        timeout: 90000,
      });
      await page.waitForTimeout(2000);

      /** Les clés du carrousel affiché, et la position courante. */
      const etat = () =>
        page.evaluate(() => {
          const cadre = document.querySelector(
            '[data-photo-fiche] [data-role="cadre"]'
          );
          const colonnes = [...cadre.querySelectorAll("[data-photo-cle]")];
          const pas = colonnes[0]?.getBoundingClientRect().width ?? 1;
          return {
            cles: colonnes.map((n) => n.getAttribute("data-photo-cle")),
            indice: Math.round(cadre.scrollLeft / pas),
          };
        });

      const depart = await etat();
      //  ⚠️ LES FICHES DE DÉMONSTRATION PLAFONNENT À QUATRE PHOTOS PAR
      //  STYLE — relevé sur les douze de l'accueil. On ne peut donc pas
      //  viser une huitième EN VIVANT : on vise LA DERNIÈRE, ce qui
      //  prouve exactement la même chose (« on n'arrive pas sur la
      //  première »). La huitième sur dix-neuf, elle, est prouvée plus
      //  haut, sur la fonction elle-même.
      if (depart.cles.length < 3) {
        nonJoue(
          `§4 en vivant (${nom})`,
          `le carrousel de cette fiche de démonstration ne porte que ` +
            `${depart.cles.length} photo(s) : rien à viser au-delà de la première`
        );
        await contexte.close();
        continue;
      }
      const rangVise = depart.cles.length - 1;
      verif(
        `${nom} — SANS `.trim() +
          " `?photo=`, LE CARROUSEL S'OUVRE SUR LA PREMIÈRE",
        depart.indice === 0,
        `indice ${depart.indice} sur ${depart.cles.length}`
      );

      const visee = depart.cles[rangVise];
      await page.goto(
        `${BASE}/tatoueur/${FICHE}?photo=${encodeURIComponent(visee)}`,
        { waitUntil: "domcontentloaded", timeout: 120000 }
      );
      await page.waitForSelector("[data-photo-fiche] [data-photo-cle]", {
        timeout: 90000,
      });
      await page.waitForTimeout(2000);
      const arrivee = await etat();
      verif(
        `${nom} — AVEC `.trim() +
          ` \`?photo=<${rangVise + 1}ᵉ>\`, ON TOMBE PILE SUR ELLE, pas sur la première`,
        arrivee.indice === rangVise && arrivee.cles[rangVise] === visee,
        `indice ${arrivee.indice + 1}/${arrivee.cles.length} · clé ${arrivee.cles[arrivee.indice]}`
      );
      await contexte.close();
    }
  } finally {
    await nav.close();
  }
}

nonJoue(
  "« MA SÉLECTION » EN VIVANT, ET LE COMPTE DE LA MIGRATION",
  "la page `/mes-favoris` exige une session Supabase validée par le " +
    "serveur, que ce conteneur ne peut pas signer ; et le réseau sortant " +
    "n'atteint pas la base (« Host not in allowlist »), je ne peux donc " +
    "PAS compter les lignes que la migration convertira. La requête de " +
    "comptage est écrite en tête du fichier de migration : elle n'efface " +
    "rien et donne le nombre exact. Les règles du §1, elles, sont " +
    "EXÉCUTÉES ici, et le §4 est mesuré en vivant sur la fiche publique"
);

process.exit(bilan());
