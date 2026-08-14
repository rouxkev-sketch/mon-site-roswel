/**
 * BANC DE LA PASSE Nº 268
 * ==================================================================
 * §1 plus aucun rôle en capitales sur les fiches : « En salon ·
 *    Fondateur », « En salon · Résident » — taille et couleur
 *    inchangées, seule la casse ;
 * §2 sur une fiche d'ARTISTE, la ligne d'un lieu qui a sa fiche prend
 *    l'encadré de la nº 232 au survol (pastille + texte englobés) ; le
 *    lien est borné au NOM + ADRESSE — l'étiquette du rôle n'est ni
 *    soulignée ni cliquable ; une adresse sans fiche n'a rien ;
 * §3 sur SA PROPRE fiche, un salon/studio n'a AUCUN encadré : le lien
 *    d'adresse est dit par le soulignement de la nº 229 — fin, décalé,
 *    permanent — et la couleur ne change jamais.
 *
 * ⚠️ JOUÉ SUR LES FICHES DE DÉMONSTRATION : la base est hors de
 * portée, et le site sert alors son jeu de démonstration — les mêmes
 * composants, les mêmes classes, les mêmes chemins de rendu que les
 * vraies fiches (BlocLieux est unique). C'est un montage React
 * COMPLET, pas une injection.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
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

const ouvrirA = async (largeur, chemin = "/") => {
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
  const fermerContexte = contexte.close.bind(contexte);
  contexte.close = async () => {
    await fermerContexte();
    await nav.close();
  };
  return { contexte, page };
};

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const blocLieux = lire("src/components/BlocLieux.tsx");
const blocNu = sansNotes(blocLieux);

//  LA FICHE D'ARTISTE DE DÉMONSTRATION (elle porte un salon lié), et
//  la fiche du SALON lié — relevées sur l'accueil vivant.
const FICHE_ARTISTE = "/tatoueur/camille-fauve-paris-18e";

/* ==================================================================
 * §1/§2/§3 — À LA SOURCE
 * ================================================================== */
titre("§1 — à la source : la casse du rôle");
{
  verif(
    "plus aucun `toUpperCase` sur un rôle — le mot de `libelleRoleCourt`, tel quel",
    !/libelleRoleCourt\(mode\.role\)\.toUpperCase\(\)/.test(blocNu) &&
      /const role = mode\.genre === "guest" \? "" : libelleRoleCourt\(mode\.role\);/.test(
        blocNu
      ) &&
      //  … et l'équipe disait déjà le mot nu (roleDuMembre).
      /\{roleDuMembre\(membre\)\} ·/.test(blocNu)
  );
  verif(
    "aucune classe `uppercase` sur les lignes de profil ou d'adresse",
    !/etiquetteDuMode[\s\S]{0,600}uppercase/.test(blocNu)
  );
}
titre("§2 — à la source : l'encadré de la 232, le lien borné");
{
  verif(
    "la ligne LIÉE porte l'encadré de la nº 232 — l'écriture même, jamais un second dessin",
    /const lie = Boolean\(mode\.salon_slug && mode\.salon_nom\);/.test(blocNu) &&
      /\{lie \? \(\s*<div className=\{CLASSES_LIGNE_CLIQUABLE\}>/.test(blocNu) &&
      /"group flex items-start gap-3\.5 rounded-xl -m-2 p-2 " \+\s*"transition-colors hover:bg-white\/5 active:bg-white\/10"/.test(
        blocLieux
      )
  );
  verif(
    "le LIEN est borné au nom + adresse ; l'étiquette du rôle reste dehors",
    //  L'étiquette s'écrit AVANT le lien, hors de lui.
    /\{etiquetteDuMode\(mode\)\}\{" "\}\s*\{lie \? \(/.test(blocNu) &&
      //  Le lien contient le nom PUIS l'adresse, rien d'autre.
      /<Link[\s\S]{0,400}\{mode\.salon_nom\}\s*\{libelleLieuDuMode\(mode\)/.test(
        blocNu
      )
  );
  verif(
    "le soulignement du lien est celui de la 229, au survol de la LIGNE " +
      "(⚠️ nº 271 : l'écriture UNIQUE `SOULIGNEMENT_LIEN`, importée — " +
      "plus une recopie de jetons)",
    /text-sombre-texte \$\{SOULIGNEMENT_LIEN\}`\}\s*>\s*\{mode\.salon_nom\}/.test(
      blocNu
    )
  );
  verif(
    "une adresse SANS fiche : ni encadré, ni soulignement — la ligne nue",
    /<div className="flex items-start gap-3\.5">\s*\{pastille\}\s*\{colonne\}/.test(
      blocNu
    )
  );
}
titre("§3 — à la source : le soulignement seul sur sa propre adresse");
{
  //  ⚠️ ASSERTIONS RÉVISÉES PAR LA Nº 271 : le propriétaire a corrigé
  //  sa consigne 268 — le soulignement de l'adresse n'est plus AU
  //  REPOS mais AU SURVOL, et l'état enfoncé du doigt (nº 229) est
  //  revenu sur la ligne. L'encadré de la 232 (fond de SURVOL), lui,
  //  reste banni d'ici.
  const adresseSlice = blocNu.slice(
    blocNu.indexOf("function AdresseCliquable"),
    blocNu.indexOf("function BlocAdressesFiche")
  );
  verif(
    "l'adresse d'un salon/studio n'a PLUS l'encadré (aucun fond de " +
      "survol — nº 271 : l'état enfoncé du doigt, lui, est revenu)",
    /className=\{`group rounded-xl -m-2 p-2 transition-colors active:bg-white\/10 \$\{\s*pastille \? "flex items-start gap-3\.5" : "block"\s*\}`\}/.test(
      adresseSlice
    ) &&
      !adresseSlice.includes("hover:bg-white/5") &&
      !adresseSlice.includes("CLASSES_LIGNE_CLIQUABLE")
  );
  verif(
    "le soulignement (⚠️ nº 271 : AU SURVOL, plus au repos — la 268 " +
      "corrigée) : l'écriture unique, couleur du texte jamais changée",
    /cliquable \? ` \$\{SOULIGNEMENT_LIEN\}` : ""/.test(blocNu) &&
      //  Aucun changement de couleur au survol dans cette ligne.
      !/ligneTexte[\s\S]{0,400}hover:text/.test(blocNu)
  );
}

/* ==================================================================
 * VIVANT — LES FICHES DE DÉMONSTRATION, AUX DEUX LARGEURS
 * ================================================================== */
//  LA FICHE QUI PORTE UNE ADRESSE SANS FICHE LIÉE (relevée sur la
//  démonstration) : « En salon · Résident : 31 rue Sainte-Catherine ».
const FICHE_SANS_LIEN = "/tatoueur/typo-sauvage-bordeaux";

let ficheSalon = null;
for (const largeur of [390, 1440]) {
  titre(`VIVANT (${largeur} px) — la fiche d'artiste`);
  const { contexte, page } = await ouvrirA(largeur, FICHE_ARTISTE);
  try {
    const vu = await page.evaluate(() => {
      const texte = document.body.innerText;
      //  LA LIGNE LIÉE : le <li> qui contient un lien vers une fiche
      //  dans le bloc des profils.
      const lignes = [...document.querySelectorAll("li")].filter(
        (li) =>
          li.querySelector('a[href^="/tatoueur/"]') &&
          /En salon|En studio|Guest/.test(li.textContent ?? "")
      );
      const ligne = lignes[0] ?? null;
      const enveloppe = ligne?.firstElementChild ?? null;
      const lien = ligne?.querySelector('a[href^="/tatoueur/"]') ?? null;
      const p = ligne?.querySelector("p") ?? null;
      return {
        rolesEnCapitales: /FONDATEUR|RÉSIDENT/.test(texte),
        roleEnClair: /Fondateur|Résident/.test(texte),
        classesEnveloppe: enveloppe ? enveloppe.className : "(absent)",
        lienTexte: lien ? lien.textContent : "(absent)",
        lienHref: lien ? lien.getAttribute("href") : null,
        etiquetteDansLeLien: lien
          ? /En salon|En studio|Guest/.test(lien.textContent ?? "")
          : null,
        pClasses: p ? p.className : "(absent)",
      };
    });
    ficheSalon = ficheSalon ?? vu.lienHref;
    verif(
      `${largeur} px : aucun rôle en capitales, le mot en clair est là`,
      !vu.rolesEnCapitales && vu.roleEnClair
    );
    verif(
      `${largeur} px : l'enveloppe de la ligne liée porte les classes EXACTES de la 232`,
      [
        "group",
        "flex",
        "items-start",
        "gap-3.5",
        "rounded-xl",
        "-m-2",
        "p-2",
        "hover:bg-white/5",
        "active:bg-white/10",
      ].every((jeton) => vu.classesEnveloppe.split(/\s+/).includes(jeton)),
      vu.classesEnveloppe
    );
    verif(
      `${largeur} px : le lien contient nom + adresse, jamais l'étiquette du rôle`,
      Boolean(vu.lienTexte) &&
        vu.etiquetteDansLeLien === false &&
        (vu.lienTexte ?? "").includes("·"),
      `« ${String(vu.lienTexte).slice(0, 50)} »`
    );
    verif(
      `${largeur} px : la taille et la couleur de la ligne n'ont pas bougé (14 px gris doux)`,
      vu.pClasses.includes("text-[14px]") &&
        vu.pClasses.includes("text-sombre-texte-doux") &&
        !vu.pClasses.includes("uppercase")
    );
    //  LA LIGNE SANS FICHE vit sur une AUTRE fiche de démonstration :
    //  mesurée juste après, sur la même largeur.
    await page.goto(`${BASE}${FICHE_SANS_LIEN}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    const sans = await page.evaluate(() => {
      const sansFiche = [...document.querySelectorAll("li")].find(
        (li) =>
          !li.querySelector("a") &&
          /À domicile|En studio|En salon|Guest/.test(li.textContent ?? "") &&
          li.querySelector("p")
      );
      return {
        classes: sansFiche
          ? sansFiche.firstElementChild.className
          : "(absent)",
        souligne: sansFiche
          ? Boolean(sansFiche.querySelector('[class*="underline"]'))
          : null,
      };
    });
    verif(
      `${largeur} px : la ligne SANS fiche n'a ni encadré ni soulignement`,
      sans.classes !== "(absent)" &&
        !sans.classes.includes("hover:bg-white/5") &&
        !sans.classes.includes("-m-2") &&
        sans.souligne === false,
      `classes « ${sans.classes} » · souligné ${sans.souligne}`
    );
    await page.goto(`${BASE}${FICHE_ARTISTE}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    if (largeur === 1440) {
      //  LE SURVOL : l'encadré s'allume sur la ligne entière, le
      //  soulignement sur le lien — et la couleur du lien ne change
      //  pas.
      const ligne = page
        .locator('li:has(a[href^="/tatoueur/"])')
        .filter({ hasText: "En salon" })
        .first();
      const lien = ligne.locator('a[href^="/tatoueur/"]').first();
      const avant = await lien.evaluate((n) => getComputedStyle(n).color);
      await ligne.hover();
      await page.waitForTimeout(250);
      const apres = await ligne.evaluate((li) => {
        const enveloppe = li.firstElementChild;
        const lienN = li.querySelector('a[href^="/tatoueur/"]');
        const p = li.querySelector("p");
        return {
          fond: getComputedStyle(enveloppe).backgroundColor,
          soulignementLien: getComputedStyle(lienN).textDecorationLine,
          couleurLien: getComputedStyle(lienN).color,
          //  L'étiquette (le texte direct du <p>) n'est pas soulignée :
          //  le style du <p> lui-même ne porte aucun soulignement.
          soulignementEtiquette: getComputedStyle(p).textDecorationLine,
        };
      });
      verif(
        "1440 px : au survol, l'encadré englobe la ligne (fond blanc 5 %)",
        //  Chromium sérialise le blanc/5 en oklab : les deux écritures
        //  disent le même blanc à 5 %.
        apres.fond === "rgba(255, 255, 255, 0.05)" ||
          (apres.fond.startsWith("oklab(0.99") && apres.fond.includes("/ 0.05")),
        apres.fond
      );
      verif(
        "1440 px : le soulignement s'allume sur le LIEN seul, la couleur ne change pas",
        apres.soulignementLien === "underline" &&
          apres.soulignementEtiquette === "none" &&
          apres.couleurLien === avant,
        `lien ${apres.soulignementLien} · étiquette ${apres.soulignementEtiquette} · ${avant} → ${apres.couleurLien}`
      );
    }
  } catch (erreur) {
    nonJoue(`fiche artiste (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

for (const largeur of [390, 1440]) {
  titre(`VIVANT (${largeur} px) — la fiche du salon (sa propre adresse)`);
  if (!ficheSalon) {
    nonJoue(
      `fiche salon (${largeur} px)`,
      "le lien du salon n'a pas été relevé sur la fiche d'artiste"
    );
    continue;
  }
  const { contexte, page } = await ouvrirA(largeur, ficheSalon.split("?")[0]);
  try {
    const vu = await page.evaluate(() => {
      const texte = document.body.innerText;
      //  LE LIEN D'ADRESSE : celui vers Google Maps.
      const adresse = document.querySelector('a[href*="google.com/maps"]');
      const span = adresse?.querySelector('[class*="underline"]');
      return {
        rolesEnCapitales: /FONDATEUR|RÉSIDENT/.test(texte),
        adresseTrouvee: Boolean(adresse),
        classesAdresse: adresse ? adresse.className : "(absent)",
        soulignement: span ? getComputedStyle(span).textDecorationLine : null,
        epaisseur: span ? getComputedStyle(span).textDecorationThickness : null,
        decalage: span ? getComputedStyle(span).textUnderlineOffset : null,
        couleur: span ? getComputedStyle(span).color : null,
      };
    });
    verif(
      `${largeur} px : aucun rôle en capitales sur la fiche du salon (l'équipe parle bas)`,
      !vu.rolesEnCapitales
    );
    //  ⚠️ RÉVISÉ PAR LA Nº 271 : plus de fond de SURVOL, mais l'état
    //  enfoncé du doigt (active) et le `group` du soulignement sont
    //  revenus sur la ligne — et le soulignement n'existe plus AU
    //  REPOS : il n'apparaît qu'au survol.
    verif(
      `${largeur} px : AUCUN encadré au survol sur sa propre adresse — l'état enfoncé du doigt (nº 271) est là`,
      vu.adresseTrouvee &&
        !vu.classesAdresse.includes("hover:bg-white/5") &&
        vu.classesAdresse.includes("active:bg-white/10") &&
        vu.classesAdresse.includes("group"),
      `classes « ${vu.classesAdresse} »`
    );
    verif(
      `${largeur} px : RIEN au repos (nº 271) — le trait reste fin (1px) et décalé (4px), prêt pour le survol`,
      vu.soulignement === "none" &&
        vu.epaisseur === "1px" &&
        vu.decalage === "4px",
      `${vu.soulignement} · ${vu.epaisseur} · ${vu.decalage}`
    );
    if (largeur === 1440) {
      const span = page.locator('a[href*="google.com/maps"] [class*="underline"]').first();
      const avant = await span.evaluate((n) => getComputedStyle(n).color);
      await span.hover();
      await page.waitForTimeout(250);
      const apres = await span.evaluate((n) => ({
        couleur: getComputedStyle(n).color,
        soulignement: getComputedStyle(n).textDecorationLine,
        fondLien: getComputedStyle(n.closest("a")).backgroundColor,
      }));
      verif(
        "1440 px : au survol le soulignement s'allume, la couleur du texte est IDENTIQUE, aucun fond",
        apres.couleur === avant &&
          apres.soulignement === "underline" &&
          (apres.fondLien === "rgba(0, 0, 0, 0)" ||
            apres.fondLien === "transparent"),
        `${avant} → ${apres.couleur} · ${apres.soulignement} · fond ${apres.fondLien}`
      );
    }
  } catch (erreur) {
    nonJoue(`fiche salon (${largeur} px)`, String(erreur).slice(0, 90));
  }
  await contexte.close();
}

nonJoue(
  "les fiches RÉELLES (base)",
  "Supabase est hors de portée : le banc joue sur les fiches de " +
    "DÉMONSTRATION, qui montent les mêmes composants (BlocLieux est " +
    "l'unique écriture des profils, de l'équipe et des adresses) avec " +
    "les mêmes classes et les mêmes chemins de rendu. Seules les " +
    "données diffèrent — la vérification sur une vraie fiche revient " +
    "au propriétaire"
);

bilan();
