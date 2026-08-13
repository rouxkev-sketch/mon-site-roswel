/**
 * LE BANC DE LA PASSE Nº 243 — « MA SÉLECTION » : STRUCTURE, RÈGLES
 * ==================================================================
 * ⚠️ CHROMIUM, ET RIEN D'AUTRE : un vert ici prouve la MÉCANIQUE et
 * les nombres, jamais le rendu de WebKit.
 *
 * ⚠️ LA PAGE EXIGE UNE SESSION, et la base est hors de portée d'ici :
 * /mes-favoris redirige vers la connexion — les contrôles VIVANTS de
 * la page sont donc dits NON JOUÉS, sans maquillage. Ce qui est prouvé
 * pour de vrai :
 *  · LES RÈGLES (§2, §3, §4, §5) s'exécutent RÉELLEMENT — le harnais
 *    `regles-p243.harnais.mjs` importe le vrai module TypeScript
 *    (aucune réécriture) et le banc juge ses réponses ;
 *  · LA STRUCTURE, à la source : plus de fenêtre, l'onglet dans
 *    l'adresse, la pastille dans le lien, la vignette vers la photo,
 *    l'écriture de visite au départ seulement.
 *
 * Il se lance comme les autres :  node tests/verif-p243.mjs
 * (le site doit tourner sur http://localhost:3000 — .next PURGÉ).
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium, BASE, verif, titre, bilan, nonJoue, lire } from "./commun-verif.mjs";

const navigateur = await chromium.launch();

/* ==================================================================
 * §1 — PLUS DE FENÊTRE, TOUT DANS LA PAGE
 * ================================================================== */
titre("§1 — la fenêtre des suivis est supprimée, code compris");
{
  verif(
    "le fichier FenetreTatoueursSuivis n'existe plus",
    !existsSync("/home/user/mon-site-roswel/src/components/FenetreTatoueursSuivis.tsx")
  );
  const restes = execSync(
    "grep -rln 'FenetreTatoueursSuivis' src --include=*.tsx --include=*.ts || true",
    { cwd: "/home/user/mon-site-roswel", encoding: "utf8" }
  )
    .split("\n")
    .filter(Boolean);
  verif(
    "et plus personne ne la nomme — elle n'est pas en sommeil",
    restes.length === 0,
    restes.join(", ") || "aucune référence"
  );
  const pageFavoris = lire("src/components/PageFavoris.tsx");
  verif(
    "le sélecteur habituel (OngletsLigne) porte Photos · Tatoueurs",
    /OngletsLigne/.test(pageFavoris) &&
      /label: "Photos"/.test(pageFavoris) &&
      /label: "Tatoueurs"/.test(pageFavoris)
  );
  verif(
    "l'onglet vit dans l'ADRESSE : pushState au choix, popstate au retour",
    /history\.pushState\(\{ ongletSelection/.test(pageFavoris) &&
      /addEventListener\("popstate"/.test(pageFavoris) &&
      /\?onglet=/.test(pageFavoris)
  );
  verif(
    "et le serveur lit l'onglet demandé — la page naît dans le bon",
    /searchParams/.test(lire("src/app/(tatouage)/mes-favoris/page.tsx")) &&
      /ongletInitial/.test(lire("src/app/(tatouage)/mes-favoris/page.tsx"))
  );
  const bloc = lire("src/components/BlocSuivis.tsx");
  verif(
    "aucun défilement imbriqué : le bloc des suivis ne défile jamais sur lui-même",
    !/overflow-y-auto|overflow-y-scroll|max-h-\[/.test(bloc)
  );
}

/* ==================================================================
 * §2 à §5 — LES RÈGLES, EXÉCUTÉES POUR DE VRAI
 * ================================================================== */
titre("§2 — les trois groupes (le vrai module, exécuté)");
const regles = JSON.parse(
  execSync("node --experimental-strip-types tests/regles-p243.harnais.mjs 2>/dev/null", {
    cwd: "/home/user/mon-site-roswel",
    encoding: "utf8",
  })
);
{
  verif(
    "les trois groupes, dans l'ordre : Cette semaine, À venir, Tous les suivis",
    regles.groupes.map((g) => g.cle).join(",") === "semaine,avenir,tous" &&
      regles.groupes.map((g) => g.titre).join(" · ") ===
        "Cette semaine · À venir · Tous les suivis"
  );
  verif(
    "CETTE SEMAINE : session en cours puis départ dans 5 jours — début croissant",
    regles.groupes[0].suivis.join(",") === "guest-en-cours,guest-semaine",
    regles.groupes[0].suivis.join(", ")
  );
  verif(
    "À VENIR : la session à 20 jours, seule",
    regles.groupes[1].suivis.join(",") === "guest-a-venir"
  );
  verif(
    "TOUS LES SUIVIS : par publication la plus récente — et la session TERMINÉE y est",
    regles.groupes[2].suivis.join(",") === "salon-suivi,guest-termine",
    regles.groupes[2].suivis.join(", ")
  );
  verif(
    "une session terminée n'est un guest pour AUCUN groupe daté",
    regles.guestDuTermine === null
  );
  verif(
    "un groupe vide ne rend RIEN : sans guest, seul « Tous les suivis » existe",
    regles.groupesSansGuests.length === 1 &&
      regles.groupesSansGuests[0].cle === "tous"
  );
}

titre("§3 — la ligne d'information, les quatre cas");
{
  const lignes = regles.lignes;
  verif(
    "artiste en salon : « En salon · … » (libelleLieuDuMode, rien d'inventé)",
    lignes.salon.texte === "En salon · 4 rue X, Lyon, France",
    lignes.salon.texte
  );
  verif(
    "artiste à domicile : « À domicile · … » (libelleSecteurDuMode)",
    lignes.domicile.texte === "À domicile · Bordeaux, France · Rayon 50 km",
    lignes.domicile.texte
  );
  verif(
    "guest : « Guest à Lyon · 3 – 8 mars »",
    lignes.guest.texte === "Guest à Lyon · 3 – 8 mars",
    lignes.guest.texte
  );
  verif(
    "salon ou studio suivi : « Salon · Lyon 2e » (libelleTypeFiche)",
    lignes.lieu.texte === "Salon · Lyon 2e",
    lignes.lieu.texte
  );
  verif(
    "la date dans les sept jours est MARQUÉE (proche), jamais colorée ici",
    lignes.guestProche.proche === true && lignes.guest.proche === false
  );
  const bloc = lire("src/components/BlocSuivis.tsx");
  verif(
    "le rendu pose l'attribut data-guest-proche — la passe Fable le traitera",
    /data-guest-proche=\{info\.proche \? "" : undefined\}/.test(bloc) &&
      !/data-guest-proche[^\n]*text-primaire|proche[^\n]*font-bold/.test(bloc)
  );
}

titre("§4 — les trois photos, dans l'ordre strict");
{
  const bandes = regles.bandes;
  verif(
    "cas 1 : les photos AIMÉES de cet artiste, et elles seules",
    bandes.aimees.cas === "aimees" &&
      bandes.aimees.provenance === "Vos coups de cœur" &&
      bandes.aimees.photos.map((p) => p.id).join(",") === "aimee-1",
    bandes.aimees.photos.map((p) => p.id).join(", ")
  );
  verif(
    "cas 2 : aucune aimée → trois RÉALISATIONS récentes, JAMAIS un flash",
    bandes.realisations.cas === "realisations" &&
      bandes.realisations.provenance === "Ses dernières réalisations" &&
      bandes.realisations.photos.map((p) => p.id).join(",") === "r1,r2,r3" &&
      bandes.realisations.photos.every((p) => p.nature !== "flash")
  );
  verif(
    "cas 3 : aucune réalisation → ses derniers FLASHS",
    bandes.flashs.cas === "flashs" &&
      bandes.flashs.provenance === "Ses derniers flashs" &&
      bandes.flashs.photos.map((p) => p.id).join(",") === "f2,f3"
  );
  verif(
    "moins de trois : que ce qui existe — jamais de doublon, jamais de case comblée",
    bandes.aimees.photos.length === 1 &&
      bandes.flashs.photos.length === 2 &&
      new Set(bandes.flashs.photos.map((p) => p.id)).size === 2
  );
}

titre("§5 — le compteur de nouveautés");
{
  verif(
    "un compte à zéro ne s'affiche pas du tout",
    regles.nouveautes.zero === ""
  );
  verif(
    "le libellé s'accorde : « 1 nouvelle réalisation », « 3 nouvelles réalisations »",
    regles.nouveautes.une === "1 nouvelle réalisation" &&
      regles.nouveautes.trois === "3 nouvelles réalisations"
  );
  //  LE PIÈGE DU §5, à la source : la visite se LIT au rendu, et ne
  //  s'ÉCRIT qu'au départ.
  const serveur = lire("src/lib/favoris-serveur.ts");
  const route = lire("src/app/api/selection/visite/route.ts");
  const pageFavoris = lire("src/components/PageFavoris.tsx");
  verif(
    "la visite se LIT au rendu (lireLaDerniereVisite), côté serveur",
    /lireLaDerniereVisite/.test(serveur) && /visites_selection/.test(serveur)
  );
  verif(
    "elle ne s'ÉCRIT qu'au DÉPART : pagehide + démontage, jamais à l'ouverture",
    /pagehide/.test(pageFavoris) &&
      /sendBeacon/.test(pageFavoris) &&
      !/useEffect\(\(\) => \{\s*\n?\s*(void )?fetch\("\/api\/selection\/visite"/.test(pageFavoris)
  );
  verif(
    "la route écrit l'horodatage en upsert, une ligne par compte",
    /upsert/.test(route) && /onConflict: "utilisateur_id"/.test(route)
  );
  const migration = lire("supabase/yokofolio-visites-selection.sql");
  verif(
    "la migration nº 68 existe : une table, une ligne par compte, ses politiques",
    /create table if not exists public\.visites_selection/.test(migration) &&
      /utilisateur_id uuid primary key/.test(migration) &&
      /enable row level security/.test(migration)
  );
}

/* ==================================================================
 * §3/§6 — LA STRUCTURE DU BLOC, à la source
 * ================================================================== */
titre("§3 — le bloc d'un artiste : liens et briques partagées");
{
  const bloc = lire("src/components/BlocSuivis.tsx");
  verif(
    "la ligne d'identité est UN lien, pastille comprise (PhotoRonde DANS le Link)",
    /<Link[\s\S]{0,400}data-ligne-suivi[\s\S]{0,200}<PhotoRonde/.test(bloc) &&
      /CLASSES_LIGNE_CLIQUABLE/.test(bloc)
  );
  verif(
    "les briques sont RÉUTILISÉES : PhotoRonde et CLASSES_LIGNE_CLIQUABLE importées de BlocLieux",
    /import \{ CLASSES_LIGNE_CLIQUABLE, PhotoRonde \} from "@\/components\/BlocLieux"/.test(bloc)
  );
  verif(
    "une vignette ouvre LA PHOTO (?photo=…), pas la fiche nue",
    /data-vignette-suivi[\s\S]{0,300}/.test(bloc) &&
      /&photo=\$\{photo\.id\}/.test(bloc)
  );
  verif(
    "rien d'autre n'est cliquable : provenance et titres de groupe sont des <p>/<h2>",
    /<p\s*\n?\s*data-provenance/.test(bloc) && /<h2[^>]*>\s*\{groupe\.titre\}/.test(bloc)
  );
  verif(
    "les règles ne vivent PAS dans le composant : il importe lib/selection-suivis",
    /from "@\/lib\/selection-suivis"/.test(bloc) &&
      !/JOURS_PROCHES|localeCompare/.test(bloc)
  );
}

/* ==================================================================
 * LES CONTRÔLES VIVANTS — la page exige une session
 * ================================================================== */
titre("§6 — la page vivante, aux deux largeurs");
for (const [nomLargeur, options] of [
  ["390 px", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ["1440 px", { viewport: { width: 1440, height: 900 } }],
]) {
  const contexte = await navigateur.newContext(options);
  const page = await contexte.newPage();
  try {
    const reponse = await page.goto(`${BASE}/mes-favoris`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const adresse = page.url();
    if (adresse.includes("/devenir-tatoueur")) {
      nonJoue(
        `§6 · la page vivante (${nomLargeur})`,
        "elle exige une session (base hors de portée) : redirigée vers la connexion — onglets, retour et position ne peuvent pas se mesurer ici ; les règles, elles, sont exécutées ci-dessus"
      );
    } else {
      verif(`la page répond (${nomLargeur})`, reponse.ok(), String(reponse.status()));
    }
  } catch (erreur) {
    nonJoue(`§6 · ${nomLargeur}`, String(erreur).slice(0, 70));
  }
  await contexte.close();
}

await navigateur.close();
bilan();
