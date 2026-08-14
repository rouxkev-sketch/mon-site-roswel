/**
 * BANC DE LA PASSE Nº 271
 * ==================================================================
 * §1 le soulignement des liens de fiche N'APPARAÎT QU'AU SURVOL —
 *    au repos, l'adresse d'un salon/studio est du texte nu ; au
 *    doigt, l'état enfoncé de la nº 229 à l'appui ;
 * §2 le trait est CELUI DE LA LIGNE D'ÉQUIPE (nº 229) — la même
 *    écriture (`SOULIGNEMENT_LIEN`), pas une valeur recopiée :
 *    épaisseur, couleur, décalage comparés valeur par valeur ; il ne
 *    reste qu'UNE écriture de soulignement dans le dépôt ;
 * §3 rien d'autre ne bouge : l'encadré 268 de la fiche d'artiste, le
 *    lien borné, le rôle jamais souligné, aucun encadré dans le bloc
 *    adresse, la couleur du texte jamais changée, aucun rose.
 *
 * MÉTHODE : la source ligne à ligne (et un balayage du dépôt entier
 * pour l'unicité de l'écriture), puis le VIVANT aux deux largeurs sur
 * les fiches de démonstration — Hokusai Mécanique (salon : adresse +
 * équipe sur la même page, la comparaison valeur par valeur se fait
 * sur place) et Camille Fauve (artiste : lien nom + adresse).
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
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

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const blocLieux = lire("src/components/BlocLieux.tsx");
const blocNu = sansNotes(blocLieux);
const contenuNu = sansNotes(lire("src/components/ContenuFiche.tsx"));

/* ==================================================================
 * §2 — L'ÉCRITURE UNIQUE, À LA SOURCE
 * ================================================================== */
titre("§2 — une seule écriture de soulignement, celle de la 229");
{
  const constante = blocNu.match(
    /export const SOULIGNEMENT_LIEN =\s*"([^"]+)" \+\s*"([^"]+)";/
  );
  const ecriture = constante ? constante[1] + constante[2] : "";
  const jetons = ecriture.split(/\s+/).filter(Boolean);
  verif(
    "SOULIGNEMENT_LIEN : fin (decoration-1), décalé (underline-offset-4), " +
      "gris doux, au SURVOL seul (group-hover) — jamais `underline` nu",
    jetons.includes("underline-offset-4") &&
      jetons.includes("decoration-1") &&
      jetons.includes("decoration-sombre-texte-doux") &&
      jetons.includes("group-hover:underline") &&
      !jetons.includes("underline"),
    ecriture
  );

  //  LE DÉPÔT ENTIER : les jetons du trait ne s'écrivent qu'UNE fois
  //  (dans la constante) — plus aucune recopie nulle part dans src/.
  const fichiers = [];
  const parcourir = (dossier) => {
    for (const nom of readdirSync(dossier)) {
      const chemin = `${dossier}/${nom}`;
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(tsx?|css)$/.test(nom)) fichiers.push(chemin);
    }
  };
  parcourir(`${RACINE}/src`);
  const compter = (jeton) => {
    let total = 0;
    const porteurs = [];
    for (const chemin of fichiers) {
      const code = sansNotes(readFileSync(chemin, "utf8"));
      const fois = code.split(jeton).length - 1;
      if (fois > 0) {
        total += fois;
        porteurs.push(`${chemin.slice(RACINE.length + 1)}×${fois}`);
      }
    }
    return { total, porteurs };
  };
  const traitFin = compter("decoration-1");
  const auSurvol = compter("group-hover:underline");
  verif(
    "il ne reste qu'UNE écriture dans tout src/ : `decoration-1` et " +
      "`group-hover:underline` n'existent que dans la constante",
    traitFin.total === 1 &&
      auSurvol.total === 1 &&
      traitFin.porteurs[0]?.startsWith("src/components/BlocLieux.tsx") &&
      auSurvol.porteurs[0]?.startsWith("src/components/BlocLieux.tsx"),
    `decoration-1 : ${traitFin.porteurs.join(", ")} · group-hover:underline : ${auSurvol.porteurs.join(", ")}`
  );
  verif(
    "les QUATRE lecteurs importent l'écriture — équipe, lien d'artiste, " +
      "adresse, liens sous la photo — aucune recopie",
    (blocNu.match(/\$\{SOULIGNEMENT_LIEN\}/g) ?? []).length === 3 &&
      (contenuNu.match(/\$\{SOULIGNEMENT_LIEN\}/g) ?? []).length === 1 &&
      contenuNu.includes("SOULIGNEMENT_LIEN,")
  );
}

/* ==================================================================
 * §1 et §3 — LA SOURCE : au survol seul, l'état enfoncé, rien d'autre
 * ================================================================== */
titre("§1/§3 — à la source : le repos nu, l'état enfoncé, ce qui ne change pas");
{
  const adresseSlice = blocNu.slice(
    blocNu.indexOf("function AdresseCliquable"),
    blocNu.indexOf("function BlocAdressesFiche")
  );
  verif(
    "l'adresse : le soulignement vient de l'écriture unique, conditionné " +
      "au lien — plus aucun `underline` permanent dans AdresseCliquable",
    /cliquable \? ` \$\{SOULIGNEMENT_LIEN\}` : ""/.test(adresseSlice) &&
      !/[" ]underline[ "]/.test(adresseSlice)
  );
  verif(
    "la ligne d'adresse est le `group` du trait, et porte l'état enfoncé " +
      "de la 229 (`active:bg-white/10`) — SANS fond de survol, sans encadré 232",
    /className=\{`group rounded-xl -m-2 p-2 transition-colors active:bg-white\/10 \$\{\s*pastille \? "flex items-start gap-3\.5" : "block"\s*\}`\}/.test(
      adresseSlice
    ) &&
      !adresseSlice.includes("hover:bg-white/5") &&
      !adresseSlice.includes("CLASSES_LIGNE_CLIQUABLE")
  );
  verif(
    "ce qui ne change pas : l'encadré 232 de la ligne d'artiste (l'écriture " +
      "même), le rôle hors du lien, l'équipe soulignée seulement AVEC fiche",
    /"group flex items-start gap-3\.5 rounded-xl -m-2 p-2 " \+\s*"transition-colors hover:bg-white\/5 active:bg-white\/10"/.test(
      blocLieux
    ) &&
      /\{lie \? \(\s*<div className=\{CLASSES_LIGNE_CLIQUABLE\}>/.test(blocNu) &&
      /\{etiquetteDuMode\(mode\)\}\{" "\}\s*\{lie \? \(/.test(blocNu) &&
      /avecFiche \? ` \$\{SOULIGNEMENT_LIEN\}` : ""/.test(blocNu)
  );
  verif(
    "aucun rose : aucun `hover:text` dans les trois lignes soulignées",
    !/ligneTexte[\s\S]{0,500}hover:text/.test(blocNu) &&
      !/EquipeDuLieu[\s\S]{0,1800}hover:text/.test(blocNu) &&
      !/lienEnLigne[\s\S]{0,900}hover:text-primaire/.test(contenuNu)
  );
}

/* ==================================================================
 * LE VIVANT — les deux fiches, aux deux largeurs
 * ================================================================== */
const FICHE_SALON = "/tatoueur/hokusai-mecanique-paris-11e";
const FICHE_ARTISTE = "/tatoueur/camille-fauve-paris-18e";
const GRIS_DOUX = "rgb(168, 168, 176)"; // #A8A8B0, sombre-texte-doux
const ROSE = "rgb(238, 61, 111)"; // #EE3D6F, jamais ici

/** Un blanc à 10 % (l'état enfoncé) — rgba ou l'oklab de Chromium
    (tolérance d'un demi-millième : la valeur est lue à la fin d'une
    transition de 150 ms, jamais pendant). */
const blancDix = (fond) => {
  if (fond === "rgba(255, 255, 255, 0.1)") return true;
  const alpha = fond.match(/\/ ([\d.]+)\)/);
  return (
    fond.startsWith("oklab(0.99") &&
    alpha !== null &&
    Math.abs(Number(alpha[1]) - 0.1) <= 0.005
  );
};

async function ouvrirA(largeur, chemin) {
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  //  ⚠️ POINTEUR SOURIS AUX DEUX LARGEURS : le survol est l'objet même
  //  de la passe, et un contexte tactile n'en a pas. À 390 px on
  //  mesure la feuille de style mobile avec une souris — c'est le
  //  comportement CSS qui est jugé, pas l'appareil.
  const contexte = await nav.newContext({
    viewport: { width: largeur, height: largeur < 768 ? 844 : 950 },
  });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${chemin}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  const fermer = async () => {
    await contexte.close();
    await nav.close();
  };
  return { page, fermer };
}

/** Le triple d'un trait, extrait d'un relevé : épaisseur, décalage,
    couleur — les trois valeurs que la consigne compare une à une. */
const TRIPLE = ({ epaisseur, decalage, couleur }) => ({
  epaisseur,
  decalage,
  couleur,
});

for (const largeur of [390, 1440]) {
  titre(`VIVANT (${largeur} px) — la fiche du salon : adresse et équipe`);
  let tripleEquipe = null;
  const salon = await ouvrirA(largeur, FICHE_SALON);
  try {
    await salon.page.waitForSelector('a[href*="google.com/maps"]', {
      timeout: 20000,
    });
    const repos = await salon.page.evaluate(() => {
      const lienAdresse = document.querySelector('a[href*="google.com/maps"]');
      const spanAdresse = lienAdresse.querySelector('[class*="underline"]');
      const ligneEquipe = [...document.querySelectorAll("li")].find((li) =>
        li.querySelector('a[href^="/tatoueur/"] p')
      );
      const pEquipe = ligneEquipe?.querySelector("p") ?? null;
      const mesure = (n) => {
        const s = getComputedStyle(n);
        return {
          ligne: s.textDecorationLine,
          epaisseur: s.textDecorationThickness,
          decalage: s.textUnderlineOffset,
          couleur: s.textDecorationColor,
          texte: s.color,
        };
      };
      return {
        adresse: spanAdresse ? mesure(spanAdresse) : null,
        equipe: pEquipe ? mesure(pEquipe) : null,
        classesLien: lienAdresse.className,
      };
    });
    verif(
      `${largeur} px : AU REPOS, aucun soulignement — ni l'adresse, ni l'équipe`,
      repos.adresse?.ligne === "none" && repos.equipe?.ligne === "none",
      `adresse ${repos.adresse?.ligne} · équipe ${repos.equipe?.ligne}`
    );
    tripleEquipe = repos.equipe && TRIPLE(repos.equipe);
    const tripleAdresse = repos.adresse && TRIPLE(repos.adresse);
    verif(
      `${largeur} px : épaisseur, décalage et couleur du trait IDENTIQUES à la ligne d'équipe, valeur par valeur`,
      Boolean(tripleEquipe && tripleAdresse) &&
        tripleAdresse.epaisseur === tripleEquipe.epaisseur &&
        tripleAdresse.decalage === tripleEquipe.decalage &&
        tripleAdresse.couleur === tripleEquipe.couleur &&
        tripleEquipe.epaisseur === "1px" &&
        tripleEquipe.decalage === "4px" &&
        tripleEquipe.couleur === GRIS_DOUX,
      `adresse ${JSON.stringify(tripleAdresse)} · équipe ${JSON.stringify(tripleEquipe)}`
    );

    //  LE SURVOL DE L'ADRESSE : le trait s'allume, la couleur du texte
    //  ne bouge pas, et AUCUN fond (pas d'encadré au survol).
    const lienAdresse = salon.page
      .locator('a[href*="google.com/maps"]')
      .first();
    await lienAdresse.hover();
    await salon.page.waitForTimeout(250);
    const surVol = await lienAdresse.evaluate((a) => {
      const span = a.querySelector('[class*="underline"]');
      const s = getComputedStyle(span);
      return {
        ligne: s.textDecorationLine,
        texte: s.color,
        fond: getComputedStyle(a).backgroundColor,
      };
    });
    verif(
      `${largeur} px : au SURVOL, le soulignement s'allume — texte inchangé, aucun fond, aucun rose`,
      surVol.ligne === "underline" &&
        surVol.texte === repos.adresse.texte &&
        surVol.texte !== ROSE &&
        (surVol.fond === "rgba(0, 0, 0, 0)" || surVol.fond === "transparent"),
      `${surVol.ligne} · texte ${repos.adresse.texte} → ${surVol.texte} · fond ${surVol.fond}`
    );

    //  L'ÉTAT ENFONCÉ (nº 229) : à l'appui, le fond monte à blanc/10 —
    //  puis le geste est relâché AILLEURS, aucun clic ne part.
    const boite = await lienAdresse.boundingBox();
    await salon.page.mouse.move(
      boite.x + boite.width / 2,
      boite.y + boite.height / 2
    );
    await salon.page.mouse.down();
    //  ⚠️ ON ATTEND LA FIN DE LA TRANSITION (`transition-colors`,
    //  150 ms) : mesuré à 150 ms, le fond disait 0.0993 — un blanc/10
    //  encore en route, pas une autre valeur.
    await salon.page.waitForTimeout(450);
    const enfonce = await lienAdresse.evaluate(
      (a) => getComputedStyle(a).backgroundColor
    );
    await salon.page.mouse.move(2, 2);
    await salon.page.mouse.up();
    verif(
      `${largeur} px : l'état enfoncé de la 229 à l'appui (blanc 10 %)`,
      blancDix(enfonce),
      enfonce
    );

    //  LE TRAIT DE RÉFÉRENCE s'allume pareil : survol de la ligne
    //  d'équipe.
    const ligneEquipe = salon.page
      .locator('li:has(a[href^="/tatoueur/"] p)')
      .first();
    await ligneEquipe.locator("a").first().hover();
    await salon.page.waitForTimeout(250);
    const equipeSurvol = await ligneEquipe.evaluate(
      (li) => getComputedStyle(li.querySelector("p")).textDecorationLine
    );
    verif(
      `${largeur} px : la ligne d'équipe garde son trait au survol (la référence vit)`,
      equipeSurvol === "underline"
    );
  } catch (erreur) {
    nonJoue(
      `fiche salon (${largeur} px)`,
      `la démonstration n'a pas répondu — ${String(erreur).slice(0, 110)}`
    );
  } finally {
    await salon.fermer();
  }

  titre(`VIVANT (${largeur} px) — la fiche d'artiste : le lien nom + adresse`);
  const artiste = await ouvrirA(largeur, FICHE_ARTISTE);
  try {
    await artiste.page.waitForSelector('li a[href^="/tatoueur/"]', {
      timeout: 20000,
    });
    const ligne = artiste.page
      .locator('li:has(a[href^="/tatoueur/"])')
      .filter({ hasText: "En salon" })
      .first();
    const lien = ligne.locator('a[href^="/tatoueur/"]').first();
    const reposArtiste = await lien.evaluate((n) => {
      const s = getComputedStyle(n);
      return {
        ligne: s.textDecorationLine,
        epaisseur: s.textDecorationThickness,
        decalage: s.textUnderlineOffset,
        couleur: s.textDecorationColor,
        texte: s.color,
      };
    });
    verif(
      `${largeur} px : au repos, le lien nom + adresse n'est PAS souligné`,
      reposArtiste.ligne === "none",
      reposArtiste.ligne
    );
    verif(
      `${largeur} px : son trait est CELUI de l'équipe, valeur par valeur — gris doux même sur texte clair`,
      Boolean(tripleEquipe) &&
        reposArtiste.epaisseur === tripleEquipe.epaisseur &&
        reposArtiste.decalage === tripleEquipe.decalage &&
        reposArtiste.couleur === tripleEquipe.couleur,
      `lien ${JSON.stringify(TRIPLE(reposArtiste))} · équipe ${JSON.stringify(tripleEquipe)}`
    );
    //  LE SURVOL DE LA LIGNE : l'encadré 268 s'allume (blanc/5), le
    //  trait s'allume sur le lien SEUL, le rôle reste nu, la couleur
    //  du lien ne change pas.
    await ligne.hover();
    await artiste.page.waitForTimeout(250);
    const survolArtiste = await ligne.evaluate((li) => {
      const enveloppe = li.firstElementChild;
      const lienN = li.querySelector('a[href^="/tatoueur/"]');
      const p = li.querySelector("p");
      return {
        fond: getComputedStyle(enveloppe).backgroundColor,
        lien: getComputedStyle(lienN).textDecorationLine,
        role: getComputedStyle(p).textDecorationLine,
        couleur: getComputedStyle(lienN).color,
      };
    });
    verif(
      `${largeur} px : l'encadré 268 reste, le trait sur le lien seul, le rôle jamais souligné, couleur inchangée`,
      (survolArtiste.fond === "rgba(255, 255, 255, 0.05)" ||
        (survolArtiste.fond.startsWith("oklab(0.99") &&
          survolArtiste.fond.includes("/ 0.05"))) &&
        survolArtiste.lien === "underline" &&
        survolArtiste.role === "none" &&
        survolArtiste.couleur === reposArtiste.texte &&
        survolArtiste.couleur !== ROSE,
      `fond ${survolArtiste.fond} · lien ${survolArtiste.lien} · rôle ${survolArtiste.role}`
    );
    //  LES LIENS SOUS LA PHOTO partagent l'écriture : repos nu, trait
    //  au survol (mesuré une fois par largeur, sur « Instagram »).
    const lienInstagram = artiste.page
      .locator('a[href*="instagram.com"]')
      .filter({ hasText: "Instagram" })
      .first();
    const spanInstagram = lienInstagram.locator('[class*="underline"]').first();
    const reposLien = await spanInstagram.evaluate(
      (n) => getComputedStyle(n).textDecorationLine
    );
    await lienInstagram.hover();
    await artiste.page.waitForTimeout(200);
    const survolLien = await spanInstagram.evaluate((n) => {
      const s = getComputedStyle(n);
      return { ligne: s.textDecorationLine, couleur: s.textDecorationColor };
    });
    verif(
      `${largeur} px : les liens sous la photo — même écriture, repos nu, trait gris doux au survol`,
      reposLien === "none" &&
        survolLien.ligne === "underline" &&
        survolLien.couleur === GRIS_DOUX,
      `repos ${reposLien} · survol ${survolLien.ligne} ${survolLien.couleur}`
    );
  } catch (erreur) {
    nonJoue(
      `fiche artiste (${largeur} px)`,
      `la démonstration n'a pas répondu — ${String(erreur).slice(0, 110)}`
    );
  } finally {
    await artiste.fermer();
  }
}

nonJoue(
  "les fiches RÉELLES (base) et le vrai doigt",
  "Supabase est hors de portée (fiches de DÉMONSTRATION — le même " +
    "montage React) ; et l'état enfoncé est mesuré à la souris " +
    "(mouse.down déclenche :active dans Chromium) — le toucher réel " +
    "revient à l'iPhone du propriétaire"
);

process.exit(bilan());
