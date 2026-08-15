/**
 * BANC DE LA PASSE Nº 286
 * ==================================================================
 * §1 L'ÉCRAN DE CONFIRMATION SANS PHOTO NEUVE parle du portfolio :
 *    « C'est enregistré » / « Ton portfolio est à jour et en ligne. » ;
 * §2 LE MENU DÉROULANT DE « MON COMPTE » montre sa barre de
 *    défilement dès que la liste des portfolios déborde ;
 * §3 LE NOM DU LIEU SAISI À LA MAIN (`nom_lieu`) est enfin LU : la
 *    colonne était bien écrite (nº 266), c'est la lecture qui prenait
 *    `intitule` — l'adresse — à sa place, et l'écrivait donc deux fois ;
 * §4 LA GRAMMAIRE DES LIEUX EN TROIS LIGNES : étiquette grise en
 *    capitales (celle de STYLES / RENDU / TECHNIQUE), nom en blanc,
 *    adresse en gris — toutes les combinaisons, plus les adresses et
 *    l'équipe d'un salon ou d'un studio.
 *
 * ⚠️ UNE SEULE LARGEUR (1440 px — les fiches publiques du web ; la
 * grammaire est la même au doigt, ce sont les mêmes composants).
 * ⚠️ LE REJEU DU §3 ET DU §4 EST CELUI DU VRAI CODE :
 * `troisLignesDuMode` est importée depuis `src/lib/modes-exercice.ts`
 * tel quel (Node retire les annotations de type) — y compris sur LE
 * RELEVÉ EXACT du propriétaire (« Hand In Glove Tattoo », 44 Rue
 * Trousseau), que la base de démonstration ne contient pas.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

/*  ⚠️ AMENDÉ LE 2026-08-15 (nº 288, §1 et §2) — LES ÉTIQUETTES ET LE
    TITRE ONT CHANGÉ SUR CONSIGNE. Ce que la nº 286 avait livré et que
    la nº 288 remplace VOLONTAIREMENT :
     · le télégraphe « SALON · RÉSIDENT » devient du français —
       FONDATEUR DU SALON, RÉSIDENT DU SALON, EN GUEST AU SALON, les
       trois mêmes AU STUDIO, et REÇOIT À DOMICILE (le mot « artiste »
       n'y apparaît nulle part) ;
     · le titre « ÉQUIPE » est RETIRÉ — il venait d'une proposition,
       jamais d'une demande.
    Les vérifications ci-dessous suivent, et le disent. TOUT LE RESTE
    de la nº 286 est vérifié inchangé : la structure en trois lignes,
    « à domicile » sans adresse, l'adresse jamais écrite deux fois, le
    nom qui devient un lien s'il a une fiche. Le détail est au banc de
    la nº 288. */

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const formulaire = lire("src/components/FormulaireFiche.tsx");
const menuEspace = sansNotes(lire("src/components/MenuEspace.tsx"));
const globals = lire("src/app/globals.css");
const modesLib = sansNotes(lire("src/lib/modes-exercice.ts"));
const blocLieux = sansNotes(lire("src/components/BlocLieux.tsx"));
const exercice = sansNotes(lire("src/lib/enregistrer-exercice.ts"));

/* ==================================================================
 * LE REJEU — le vrai code, chargé tel quel
 * ================================================================== */
const atelier = mkdtempSync(join(tmpdir(), "verif-p286-"));
const reecrire = (texte) =>
  texte
    .replace(/from "@\/config\/tatouage"/g, 'from "./config-tatouage.ts"')
    .replace(/from "@\/lib\/adresse"/g, 'from "./adresse.ts"')
    .replace(/from "@\/lib\/horaires-studio"/g, 'from "./horaires-studio.ts"')
    .replace(/from "@\/lib\/geocodage\/types"/g, 'from "./geo-types.ts"');
writeFileSync(
  `${atelier}/modes-exercice.ts`,
  reecrire(lire("src/lib/modes-exercice.ts"))
);
writeFileSync(`${atelier}/config-tatouage.ts`, lire("src/config/tatouage.ts"));
writeFileSync(`${atelier}/adresse.ts`, reecrire(lire("src/lib/adresse.ts")));
//  Les deux modules de types (importés en `import type` : effacés au
//  retrait des annotations) — des coquilles vides suffisent.
writeFileSync(`${atelier}/horaires-studio.ts`, "export {};\n");
writeFileSync(`${atelier}/geo-types.ts`, "export {};\n");
const { troisLignesDuMode, etiquetteDuLieu, nomDuLieuDuMode } = await import(
  `${atelier}/modes-exercice.ts`
);

/** Un mode, tel que la fiche le lit — les champs utiles seulement. */
const mode = (surcharge) => ({
  id: "m1",
  genre: "salon",
  role: null,
  salon_id: null,
  salon_nom: null,
  salon_slug: null,
  nom_lieu: null,
  intitule: "44 Rue Trousseau, 75011 Paris",
  adresse: "44 Rue Trousseau",
  code_postal: "75011",
  ville: "Paris",
  region: null,
  pays: "France",
  code_pays: "FR",
  latitude: null,
  longitude: null,
  lieu_id: null,
  debut_le: null,
  fin_le: null,
  ordre: 0,
  ...surcharge,
});

/* ==================================================================
 * §1 — L'ÉCRAN DE CONFIRMATION
 * ================================================================== */
titre("§1 — le texte sans photo neuve parle du portfolio");
{
  verif(
    "« C'est enregistré » / « Ton portfolio est à jour et en ligne. »",
    /C&apos;est enregistré/.test(formulaire) &&
      /Ton portfolio est à jour et en ligne\./.test(formulaire) &&
      !/Modifications en ligne/.test(formulaire) &&
      !/Elles sont visibles tout de suite\./.test(formulaire)
  );
  verif(
    "les deux autres voix n'ont pas bougé",
    /Merci&nbsp;!/.test(formulaire) &&
      /Nouvelles photos envoyées/.test(formulaire) &&
      /Relues et en ligne sous 24&nbsp;h\./.test(formulaire)
  );
}

/* ==================================================================
 * §2 — LA BARRE DE DÉFILEMENT DU MENU
 * ================================================================== */
titre("§2 — le menu des portfolios montre sa barre dès qu'il déborde");
{
  verif(
    "la liste des portfolios porte `defilement-visible` — l'exception " +
      "assumée à la règle « jamais d'ascenseur » du site",
    /max-h-\[220px\] overflow-y-auto overscroll-contain defilement-visible/.test(
      menuEspace
    )
  );
  verif(
    "l'exception est bien celle de globals.css : un curseur fin et " +
      "arrondi, sans piste, dans le gris du site — et RIEN quand le " +
      "contenu tient (c'est `overflow-y: auto` qui décide)",
    /\*:not\(\.defilement-visible\)/.test(globals) &&
      /\.defilement-visible::-webkit-scrollbar-thumb/.test(globals) &&
      /border-radius: 999px/.test(globals)
  );
  nonJoue(
    "§2 · LE MENU EN VIVANT (cinq portfolios qui débordent)",
    "le sélecteur ne s'affiche que connecté, avec PLUSIEURS fiches sur " +
      "le compte — la base du propriétaire est hors de portée de ce " +
      "conteneur. La classe posée est celle des menus déroulants du " +
      "site, dont le comportement est déjà en production"
  );
}

/* ==================================================================
 * §3 — LE NOM DU LIEU SAISI À LA MAIN
 * ================================================================== */
titre("§3 — l'erreur était À LA LECTURE, et elle est corrigée");
{
  verif(
    "L'ÉCRITURE ÉTAIT BONNE (nº 266, vérifiée, non touchée) : le " +
      "formulaire écrit `nom_lieu` quand le lieu n'a pas de portfolio",
    /nom_lieu: nomLieuRequis\(mode\)/.test(exercice)
  );
  verif(
    "LA LECTURE, ELLE, NE LE DÉCLARAIT PAS : le type de la fiche " +
      "publique porte désormais `nom_lieu`",
    /nom_lieu\?: string \| null;/.test(modesLib)
  );
  verif(
    "et le nom se lit `salon_nom` PUIS `nom_lieu` — JAMAIS `intitule`, " +
      "qui est l'adresse (c'était le doublon du relevé)",
    /return \(mode\.salon_nom \|\| mode\.nom_lieu \|\| ""\)\.trim\(\);/.test(
      modesLib
    ) && !/salon_nom \?\? mode\.intitule/.test(blocLieux)
  );

  //  LE RELEVÉ DU PROPRIÉTAIRE, REJOUÉ SUR LE VRAI CODE : gaston-paris,
  //  résident d'un salon SANS portfolio, nom saisi à la main.
  const gaston = mode({
    role: "resident",
    nom_lieu: "Hand In Glove Tattoo",
  });
  const lignes = troisLignesDuMode(gaston);
  verif(
    "REJEU — le relevé : le nom saisi S'AFFICHE, l'adresse UNE SEULE " +
      "fois, sous lui",
    lignes.nom === "Hand In Glove Tattoo" &&
      /44 Rue Trousseau/.test(lignes.adresse) &&
      !/44 Rue Trousseau/.test(lignes.nom),
    `« ${lignes.etiquette} » / « ${lignes.nom} » / « ${lignes.adresse} »`
  );
  verif(
    "et son étiquette dit le lieu ET le rôle (AMENDÉE nº 288 : " +
      "« Résident du salon », en français)",
    lignes.etiquette === "Résident du salon"
  );
}

/* ==================================================================
 * §4 — LA GRAMMAIRE DES TROIS LIGNES, TOUTES COMBINAISONS
 * ================================================================== */
titre("§4 — rejeu : toutes les combinaisons, sur le vrai code");
{
  const attendus = [
    //  [surcharge du mode, étiquette attendue]
    [{ genre: "salon", role: "resident", nom_lieu: "X" }, "Résident du salon"],
    [{ genre: "salon", role: "fondateur", nom_lieu: "X" }, "Fondateur du salon"],
    [{ genre: "prive", role: "resident", nom_lieu: "X" }, "Résident du studio"],
    [{ genre: "prive", role: "fondateur", nom_lieu: "X" }, "Fondateur du studio"],
    [{ genre: "guest", nature_lieu: "salon", nom_lieu: "X" }, "En guest au salon"],
    [{ genre: "guest", nature_lieu: "prive", nom_lieu: "X" }, "En guest au studio"],
  ];
  for (const [surcharge, etiquette] of attendus) {
    const lignes = troisLignesDuMode(mode(surcharge));
    verif(
      `« ${etiquette} » — l'étiquette porte le type de lieu, le nom est ` +
        "la ligne blanche",
      lignes.etiquette === etiquette && lignes.nom === "X",
      `« ${lignes.etiquette} »`
    );
  }
  //  UN GUEST SANS NATURE DE LIEU (base d'avant la nº 41) : on
  //  n'invente rien — « Guest » seul.
  verif(
    "guest sans nature de lieu (AMENDÉE nº 288) : « En guest » seul, " +
      "jamais un type inventé",
    etiquetteDuLieu(mode({ genre: "guest" })) === "En guest"
  );

  //  À DOMICILE : la ville en blanc, LE RAYON en gris — et AUCUNE
  //  adresse, jamais (personne ne publie celle de son domicile).
  const domicile = troisLignesDuMode(
    mode({ genre: "domicile", rayon_km: 30 })
  );
  verif(
    "À DOMICILE (AMENDÉE nº 288 : « Reçoit à domicile ») / la ville / « Dans un rayon de " +
      "30 km » — et pas une rue en vue",
    domicile.etiquette === "Reçoit à domicile" &&
      domicile.nom === "Paris, France" &&
      domicile.adresse === "Dans un rayon de 30 km" &&
      !/Trousseau/.test(domicile.nom + domicile.adresse),
    `« ${domicile.nom} » / « ${domicile.adresse} »`
  );

  //  NI FICHE NI NOM SAISI : l'adresse monte en blanc, pas de
  //  troisième ligne — JAMAIS écrite deux fois.
  const sansNom = troisLignesDuMode(mode({ role: "resident" }));
  verif(
    "sans fiche ni nom : l'adresse prend la ligne blanche, et il n'y a " +
      "PAS de troisième ligne",
    /44 Rue Trousseau/.test(sansNom.nom) && sansNom.adresse === "",
    `« ${sansNom.nom} » / « ${sansNom.adresse} »`
  );

  //  LE SALON LIÉ garde la priorité sur le nom saisi.
  verif(
    "un salon LIÉ garde la priorité : son nom de fiche d'abord",
    nomDuLieuDuMode(
      mode({ salon_nom: "Graphink Tattoo Studio", nom_lieu: "Autre" })
    ) === "Graphink Tattoo Studio"
  );
}

titre("§4 — à la source : l'écriture est unique, l'étiquette est celle du site");
{
  verif(
    "les trois lignes se décident dans `troisLignesDuMode` " +
      "(lib/modes-exercice), et BlocLieux ne fait que les poser",
    /export function troisLignesDuMode\(/.test(modesLib) &&
      /troisLignesDuMode\(mode\)/.test(blocLieux)
  );
  verif(
    "l'étiquette est `ECRITURE_TITRE_SECTION` — celle de STYLES / " +
      "RENDU / TECHNIQUE — les capitales viennent de la feuille de " +
      "style, jamais du texte",
    /className=\{ECRITURE_TITRE_SECTION\}>\{etiquette\}/.test(blocLieux) &&
      /uppercase/.test(sansNotes(lire("src/config/tatouage.ts")).match(/ECRITURE_TITRE_SECTION =[^;]+;/)?.[0] ?? "")
  );
  verif(
    "LES DATES D'UN GUEST SONT EN BLANC — sur les profils ET dans " +
      "l'équipe : c'est l'information qui décide le visiteur",
    (blocLieux.match(/enBlanc/g) ?? []).length >= 3 &&
      /enBlanc \? "text-sombre-texte" : "text-sombre-texte-doux"/.test(
        blocLieux
      )
  );
  verif(
    "l'adresse d'un salon dit SON TYPE (« Adresse du salon / du " +
      "studio »), et l'accord suit le nombre (le titre « ÉQUIPE » est " +
        "RETIRÉ à la nº 288)",
    /`Adresse du \$\{typeDuLieu\}`/.test(blocLieux) &&
      /`Autres adresses du \$\{typeDuLieu\}`/.test(blocLieux) &&
      /`Autre adresse du \$\{typeDuLieu\}`/.test(blocLieux) &&
      !/>Équipe<\/p>/.test(blocLieux)
  );
  verif(
    "dans l'équipe : le nom en blanc, le rôle en gris DESSOUS, la " +
      "ligne entière cliquable (CLASSES_LIGNE_CLIQUABLE, inchangée)",
    /\{membre\.nom\}\s*<\/p>\s*<p className="mt-0\.5 text-\[14px\] leading-relaxed text-sombre-texte-doux">\s*\{roleDuMembre\(membre\)\}/.test(
      blocLieux
    ) && /className=\{CLASSES_LIGNE_CLIQUABLE\}/.test(blocLieux)
  );
}

/* ==================================================================
 * §4 — VIVANT (1440 px) : les fiches de démonstration
 * ================================================================== */
titre("§4 — vivant (1440 px) : la grammaire, mesurée sur les fiches");
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
    const GRIS = "rgb(168, 168, 176)";

    //  UN ARTISTE RÉSIDENT D'UN SALON LIÉ — les trois lignes pleines.
    await page.goto(`${BASE}/tatoueur/camille-fauve-paris-18e`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(2000);
    const troisLignes = await page.evaluate(() => {
      const etiquette = [...document.querySelectorAll("li p")].find((p) =>
        /Résident du salon/i.test(p.textContent ?? "")
      );
      if (!etiquette) return null;
      const bloc = etiquette.parentElement;
      const [l1, l2, l3] = [...bloc.querySelectorAll("p")];
      const style = (e) => getComputedStyle(e);
      return {
        etiquette: l1.textContent.trim(),
        majuscules: style(l1).textTransform,
        nom: l2?.textContent.trim(),
        couleurNom: l2 ? style(l2).color : "",
        adresse: l3?.textContent.trim(),
        couleurAdresse: l3 ? style(l3).color : "",
        lienLigne: Boolean(etiquette.closest("a")),
      };
    });
    verif(
      "SALON · RÉSIDENT / Hokusai Mécanique / l'adresse — étiquette en " +
        "capitales, nom en blanc, adresse en gris",
      Boolean(troisLignes) &&
        troisLignes.majuscules === "uppercase" &&
        troisLignes.nom === "Hokusai Mécanique" &&
        troisLignes.couleurNom !== GRIS &&
        /rue de la Roquette/.test(troisLignes.adresse ?? "") &&
        troisLignes.couleurAdresse === GRIS,
      troisLignes
        ? `« ${troisLignes.etiquette} » / « ${troisLignes.nom} » / « ${troisLignes.adresse} »`
        : "bloc introuvable"
    );
    verif(
      "le lieu a sa fiche : LA LIGNE ENTIÈRE est le lien",
      Boolean(troisLignes?.lienLigne)
    );

    //  UN LIEU SAISI À LA MAIN SANS NOM — l'adresse UNE SEULE fois.
    await page.goto(`${BASE}/tatoueur/typo-sauvage-bordeaux`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(2000);
    const sansNom = await page.evaluate(() => {
      //  AMENDÉ nº 288 : les étiquettes ne commencent plus par le type
      //  de lieu — elles se lisent (« Résident du salon », « En guest
      //  au salon »). On vise donc la même famille, dite autrement.
      const etiquette = [...document.querySelectorAll("li p")].find((p) =>
        /(du|au) (salon|studio)$/i.test(p.textContent?.trim() ?? "")
      );
      if (!etiquette) return null;
      const texte = etiquette.parentElement.textContent ?? "";
      return {
        occurrences: (texte.match(/rue Sainte-Catherine/g) ?? []).length,
      };
    });
    verif(
      "lieu saisi SANS nom : l'adresse s'écrit UNE SEULE fois — le " +
        "doublon du relevé est mort",
      sansNom?.occurrences === 1,
      `${sansNom?.occurrences ?? "?"} occurrence(s)`
    );

    //  À DOMICILE — jamais de rue.
    await page.goto(`${BASE}/tatoueur/studio-cameleon-bordeaux`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(2000);
    verif(
      "À DOMICILE : la ville, et AUCUNE rue nulle part",
      await page.evaluate(() => {
        const etiquette = [...document.querySelectorAll("li p")].find((p) =>
          /^Reçoit à domicile$/i.test(p.textContent?.trim() ?? "")
        );
        if (!etiquette) return false;
        const texte = etiquette.parentElement.textContent ?? "";
        return /Bordeaux/.test(texte) && !/rue|avenue|place/i.test(texte);
      })
    );

    //  LA PAGE D'UN SALON — adresses typées, équipe étiquetée, rôles
    //  sous les noms, dates de guest en blanc.
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(2000);
    const salon = await page.evaluate(() => {
      const GRIS = "rgb(168, 168, 176)";
      const etiquettes = [...document.querySelectorAll("p")]
        .filter((p) => getComputedStyle(p).textTransform === "uppercase")
        .map((p) => p.textContent.trim());
      const equipe = [...document.querySelectorAll("li")]
        .map((li) => {
          const [nom, role] = [...li.querySelectorAll("p")];
          if (!nom || !role) return null;
          return {
            nom: nom.textContent.trim(),
            couleurNom: getComputedStyle(nom).color,
            role: role.textContent.trim(),
            couleurRole: getComputedStyle(role).color,
            dates: [...li.querySelectorAll("div p")]
              .filter((p) => /^Du |^Au /.test(p.textContent ?? ""))
              .map((p) => getComputedStyle(p).color),
            lien: Boolean(li.querySelector("a")),
          };
        })
        .filter(Boolean)
        .filter((m) => ["Fondateur", "Résident", "Guest"].includes(m.role));
      return { etiquettes, equipe, gris: GRIS };
    });
    verif(
      "« ADRESSE DU SALON », « AUTRE ADRESSE DU SALON » (au singulier : " +
        "il n'y en a qu'une) — les étiquettes du site (« ÉQUIPE » est " +
        "retiré à la nº 288)",
      salon.etiquettes.includes("Adresse du salon") &&
        salon.etiquettes.includes("Autre adresse du salon") &&
        !salon.etiquettes.includes("Équipe"),
      salon.etiquettes.join(" · ")
    );
    verif(
      "l'équipe : le nom en blanc, le rôle en gris dessous, la ligne " +
        "entière cliquable",
      salon.equipe.length >= 2 &&
        salon.equipe.every(
          (membre) =>
            membre.couleurNom !== salon.gris &&
            membre.couleurRole === salon.gris &&
            membre.lien
        ),
      salon.equipe.map((m) => `${m.nom} (${m.role})`).join(" · ")
    );
    const guest = salon.equipe.find((m) => m.role === "Guest");
    verif(
      "l'ordre : fondateurs, puis résidents, puis guests — et le guest " +
        "porte ses dates EN BLANC",
      Boolean(guest) &&
        salon.equipe.findIndex((m) => m.role === "Guest") ===
          salon.equipe.length - 1 &&
        guest.dates.length === 2 &&
        guest.dates.every((c) => c !== salon.gris),
      guest ? `dates ${guest.dates.join(" · ")}` : "aucun guest"
    );
  } finally {
    await nav.close();
  }
}

titre("§4 — CE QUE LA BASE NE PERMET PAS ENCORE");
{
  nonJoue(
    "§4 · SALON · GUEST et STUDIO · GUEST en vivant, et le rayon « à " +
      "domicile »",
    "les fiches de démonstration n'ont ni `nature_lieu` sur leurs " +
      "guests, ni `rayon_km`, ni `nom_lieu` (colonnes réelles, données " +
      "de démo jamais garnies) : ces cas sont prouvés par le REJEU du " +
      "vrai code ci-dessus, pas à l'écran. Le relevé de gaston-paris " +
      "vit dans la base du propriétaire, hors de portée d'ici"
  );
}

process.exit(bilan());
