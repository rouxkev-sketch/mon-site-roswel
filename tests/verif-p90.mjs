/**
 * SUITE PERMANENTE — issue du balayage de la passe nº 90
 * =======================================================
 * REMISE À JOUR À LA PASSE nº 98. Ce qu'elle vérifiait de durable a
 * été gardé ; ce qui décrivait un écran disparu a été retiré, avec la
 * passe fautive nommée à chaque fois.
 *
 * ⚠️ CE QUI A ÉTÉ RETIRÉ
 * ----------------------
 * · §5 « La fenêtre de recherche (téléphone) » — 12 assertions.
 *   LA FENÊTRE SUPERPOSÉE N'EXISTE PLUS : la passe nº 104 l'a
 *   remplacée par une PAGE de recherche pleine hauteur. Tout ce qui
 *   mesurait sa remontée, sa redescente, sa fermeture ou la position
 *   de ses boutons décrivait un écran qui n'est plus construit. Les
 *   acquis de la nouvelle page sont vérifiés par verif-p104 à p114.
 * · §11 « les deux migrations livrées sont numérotées 34 et 35 » —
 *   une assertion. Elle datait la passe ; la chaîne en compte 43
 *   aujourd'hui. Le bon outil pour cela n'est pas un test de
 *   navigateur mais `supabase/yokofolio-verification-migrations.sql`.
 *
 * ⚠️ CE QUI A ÉTÉ MIS À JOUR
 * --------------------------
 * · L'ancre du bloc 1 : « Je tatoue en mon nom » → « Qui es-tu ? »
 *   (passe nº 95, refonte du bloc 1 en trois cartes).
 * · Les sections qui exigent une session sont désormais GARDÉES : sans
 *   session elles sont dites « NON JOUÉES », et le reste tourne quand
 *   même. Avant, la suite entière s'arrêtait là.
 *
 *     npm run verif:p90       (serveur de développement démarré)
 */

import {
  BASE, lire, verif, titre, nonJoue, bilan,
  ouvrirLeNavigateur, formulaireAccessible, RAISON_SANS_SESSION,
} from "./commun-verif.mjs";

const { nav, page } = await ouvrirLeNavigateur("verif-p90");
const FORM = await formulaireAccessible(page);

/* ================================================================
 * 1 · LE FORMULAIRE S'OUVRE, SESSION CONNECTÉE
 * ================================================================ */
titre("1 · Le formulaire s'ouvre, session connectée");
if (FORM) {
  verif(
    "la session est reconnue",
    !/connecte-toi|se connecter pour/i.test(await page.locator("body").innerText())
  );
  verif(
    "le formulaire est RENDU",
    (await page.locator("body").innerText()).includes("Qui es-tu")
  );
} else {
  nonJoue("1 · Le formulaire s'ouvre", RAISON_SANS_SESSION);
}

/* ================================================================
 * 2 · LES CHAMPS, SANS ÉPINGLE NI LOUPE EN DOUBLE
 * ================================================================
 * ⚠️ CES QUATRE-LÀ SE LISENT DANS LE CODE, et c'est délibéré : un
 * émoji parasite est une chaîne de caractères dans un composant. La
 * chercher là est plus sûr que de la chercher à l'écran, où elle peut
 * se cacher derrière un état.
 */
titre("2 · Les champs, sans épingle ni loupe en double");
verif(
  "l'épingle du champ d'adresse des studios a disparu du code",
  !lire("src/components/BlocStudios.tsx").includes("📍")
);
verif(
  "la 2e loupe du champ « rechercher une fiche » a disparu",
  (lire("src/components/RechercheFicheInscrite.tsx").match(/🔍/g) ?? []).length === 0
);
verif(
  "le champ de localisation ne porte aucun émoji",
  !/[📍🔍]/u.test(lire("src/components/ChampLocalisation.tsx"))
);

/* ================================================================
 * 3 · LE REMPLISSAGE AUTOMATIQUE DU NAVIGATEUR
 * ================================================================ */
titre("3 · Le remplissage automatique du navigateur");
verif(
  "le module d'attributs est partagé, pas recopié",
  lire("src/lib/champs-sans-remplissage.ts").includes("SANS_REMPLISSAGE_AUTO")
);
for (const composant of [
  "ChampLocalisation",
  "FormulaireFiche",
  "ChampBio",
  "BlocStudios",
  "RechercheFicheInscrite",
]) {
  verif(
    `${composant} passe par le module partagé`,
    lire(`src/components/${composant}.tsx`).includes("sansRemplissageAuto")
  );
}

/* ================================================================
 * 4 · LE COMPTE INSTAGRAM DU SITE
 * ================================================================ */
titre("4 · Le compte Instagram du site");
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(1200);
const lienInsta = page.locator('footer a[href="https://www.instagram.com/yoko.folio/"]');
verif("le lien est dans le pied de page", (await lienInsta.count()) === 1);
verif(
  "il s'ouvre dans un nouvel onglet, proprement",
  (await lienInsta.first().getAttribute("target")) === "_blank" &&
    (await lienInsta.first().getAttribute("rel"))?.includes("noopener")
);
//  ⚠️ nº 141-8 : plus de SVG maison — le glyphe `icone-instagram.png`
//  du propriétaire, éclairci par `invert`, dans un cercle gris.
verif(
  "il porte l'icône Instagram du propriétaire",
  (await lienInsta.first().locator('img[src="/icone-instagram.png"]').count()) === 1
);

/* ================================================================
 * 5 · RETIRÉE — LA FENÊTRE DE RECHERCHE SUPERPOSÉE N'EXISTE PLUS
 * ================================================================
 * Douze assertions mesuraient sa remontée à la saisie, sa redescente
 * au choix, sa fermeture au « Valider », la position de ses boutons.
 * LA PASSE Nº 104 l'a remplacée par une PAGE pleine hauteur : il n'y a
 * plus de fenêtre à mesurer. Ne pas les réécrire ici — les acquis de
 * la page sont tenus par verif-p104 à verif-p114.
 * ============================================================== */

/* ================================================================
 * 6 · YOUTUBE ET LINKTREE SUR LA FICHE
 * ================================================================ */
titre("6 · YouTube et Linktree sur la fiche");
await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await page.locator("h1").first().waitFor({ timeout: 60000 });
await page.waitForTimeout(1200);
verif(
  "YouTube est au format des autres réseaux (même fabrique de badge)",
  lire("src/components/FicheTatoueur.tsx").includes(
    '"instagram" | "tiktok" | "youtube"'
  )
);
verif(
  "une adresse Linktree s'affiche « Linktree »",
  lire("src/lib/liens-fiche.ts").toLowerCase().includes("linktree")
);
verif(
  "le champ du formulaire porte le nom attendu",
  lire("src/components/FormulaireFiche.tsx").includes("lien_youtube")
);

/* ================================================================
 * 7 · BESOINS ET RENDU SUR LES FICHES
 * ================================================================ */
titre("7 · Besoins et Rendu sur les fiches");
const sections = (await page.locator("h2").allInnerTexts()).map((t) => t.trim().toLowerCase());
verif("la section « Besoins » est là", sections.includes("besoins"), sections.join(" / "));
verif("la section « Rendu » est là", sections.includes("rendu"));
const badgesRendu = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find(
    (x) => x.textContent.trim().toLowerCase() === "rendu"
  );
  return h ? [...h.parentElement.querySelectorAll("li")].map((l) => l.textContent.trim()) : [];
});
verif(
  "elle porte de vrais badges, déduits des photos",
  badgesRendu.length > 0 &&
    badgesRendu.every((b) => ["Noir et gris", "Couleur"].includes(b)),
  badgesRendu.join(" · ")
);
verif(
  "une section vide ne s'affiche pas",
  lire("src/components/FicheTatoueur.tsx").includes("groupe.slugs.length > 0") &&
    lire("src/components/FenetreFiche.tsx").includes("groupe.slugs.length > 0")
);
verif(
  "le rendu se déduit des photos, en un seul endroit",
  lire("src/lib/photos-tatoueur.ts").includes("export function rendusDuPortfolio")
);

/* ================================================================
 * 8 · LES FILTRES BESOINS ET RENDU
 * ================================================================ */
titre("8 · Les filtres Besoins et Rendu");
async function combien(parametres) {
  await page.goto(`${BASE}/?${parametres}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(1400);
  return page.locator("a[href^='/tatoueur/']").count();
}
const total = await combien("");
verif("l'accueil montre des fiches", total > 0, `${total}`);
for (const [slug, mot] of [
  ["cover", "Cover"],
  ["scar", "Cicatrice"],
  ["color", "Couleur"],
  ["black_and_grey", "Noir et gris"],
]) {
  const restants = await combien(`exclure=${slug}`);
  verif(`éteindre « ${mot} » retire des tatoueurs`, restants < total, `${restants}/${total}`);
}
const cumul = await combien("exclure=cover,color");
verif("les groupes se cumulent", cumul <= total, `${cumul}/${total}`);
verif(
  "la recherche passe par la BASE, pas par un filtrage en JavaScript",
  lire("src/lib/tatoueurs.ts").includes("rechercher_tatoueurs")
);
verif(
  "le code et la base partagent la même règle sur les besoins",
  lire("src/lib/tatoueurs.ts").includes("filtres_besoins") &&
    lire("supabase/yokofolio-filtres-besoins-rendu.sql").includes("p_besoins")
);

/* ================================================================
 * 9 · LE RÔLE « FONDATEUR »
 * ================================================================ */
titre("9 · Le rôle « Fondateur »");
verif(
  "le formulaire dit « Fondateur », plus « Fondateur / Gérant »",
  lire("src/config/tatouage.ts").includes("Fondateur") &&
    !lire("src/config/tatouage.ts").includes("Fondateur / Gérant")
);
verif("« Résident » n'a pas bougé", lire("src/config/tatouage.ts").includes("Résident"));

/* ================================================================
 * 10 · RECHERCHE DE STUDIO ET ADRESSE, TOUTES DEUX VIVANTES
 * ================================================================
 * ⚠️ L'ACQUIS DE FOND, celui qui compte : aucune des deux zones n'est
 * jamais rendue inerte. Une version ancienne éteignait la recherche
 * par nom dès qu'une adresse était saisie — un cul-de-sac déguisé en
 * choix. La règle est devenue « la dernière réponse gagne ».
 */
titre("10 · Recherche de studio et adresse, toutes deux vivantes");
//  ⚠️ ON RETIRE LES COMMENTAIRES AVANT DE CHERCHER. La première
//  version de cette assertion lisait le fichier entier — et le
//  commentaire d'en-tête EXPLIQUE justement que `pointer-events-none`
//  a été retiré. Elle échouait donc à cause de la phrase qui raconte
//  sa propre réussite. Un test qui lit les commentaires teste la
//  prose, pas le produit.
const sansCommentaires = (chemin) =>
  lire(chemin)
    .replace(/\/\*[^]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
verif(
  "aucune zone n'est rendue inerte (pointer-events-none)",
  !sansCommentaires("src/components/DeuxZonesLieu.tsx").includes(
    "pointer-events-none"
  )
);
verif(
  "une pastille dit laquelle des deux est retenue",
  lire("src/components/DeuxZonesLieu.tsx").includes("PastilleRetenu")
);
verif(
  "choisir une fiche lâche l'adresse, et réciproquement",
  lire("src/components/DeuxZonesLieu.tsx").includes("retenirLaFiche") &&
    lire("src/components/DeuxZonesLieu.tsx").includes("retenirLeLieu")
);

/* ================================================================
 * 11 · NON-RÉGRESSIONS
 * ================================================================ */
titre("11 · Non-régressions");
for (const chemin of ["/", "/qui-sommes-nous", "/contact", "/mentions-legales"]) {
  const reponse = await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  verif(`la route ${chemin} répond`, (reponse?.status() ?? 0) < 400);
}
verif(
  "le verrou du bloc 1 et sa confirmation tiennent",
  lire("src/components/FormulaireFiche.tsx").includes("Je confirme")
);
verif(
  "les quatre modes, le sous-choix, les sessions guest, les liaisons",
  lire("src/config/tatouage.ts").includes("GENRES_MODE") &&
    lire("src/lib/modes-exercice.ts").includes("modesActifs")
);
verif(
  "la recherche en base, sa pagination, son cache",
  lire("src/lib/tatoueurs.ts").includes("p_limite") &&
    lire("src/lib/tatoueurs.ts").includes("p_decalage")
);
verif(
  "le module Photon n'a pas bougé",
  lire("src/lib/geocodage/photon.ts").includes("photon.komoot.io")
);
verif(
  "les logos et icônes sont référencés, jamais fabriqués",
  lire("src/components/Logo.tsx").includes("/images/roswel-logo.png") &&
    lire("src/components/Logo.tsx").includes("/images/roswel-icone.png")
);

await nav.close();
process.exit(bilan());
