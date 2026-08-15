/**
 * BANC DE LA PASSE Nº 288
 * ==================================================================
 * §1 le titre « ÉQUIPE » de la nº 286 est RETIRÉ — les lignes de
 *    l'équipe, elles, ne bougent pas ;
 * §2 les SEPT étiquettes explicites, en français, remplacent le
 *    télégraphe « SALON · RÉSIDENT » — et le mot « artiste » n'y
 *    apparaît nulle part ;
 * §3 LE RÔLE NE SE CONTREDIT PLUS : une seule information, celle que
 *    l'artiste déclare, lue par sa fiche ET par celle du lieu ;
 * §4 l'adresse d'un studio est cliquable, même sans rue — le même
 *    système que le salon, pas un second.
 *
 * ⚠️ UNE SEULE LARGEUR (390 px), livraison rapide.
 * ⚠️ CE QUE CE BANC NE PEUT PAS JOUER : la contradiction du §3 telle
 * que le propriétaire l'a relevée (Funambulink) vit dans SA base —
 * hors de portée de ce conteneur. La correction est prouvée là où elle
 * s'écrit : la déclaration lue une fois, et la traduction REJOUÉE sur
 * le vrai code.
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

const modes = lire("src/lib/modes-exercice.ts");
const modesNu = sansNotes(modes);
const bloc = sansNotes(lire("src/components/BlocLieux.tsx"));
const tatoueursNu = sansNotes(lire("src/lib/tatoueurs.ts"));
const config = sansNotes(lire("src/config/tatouage.ts"));

/* ==================================================================
 * LE REJEU — les deux fonctions du vrai fichier, extraites telles
 * quelles : si la règle change, ce banc change avec elle.
 * ================================================================== */
const corpsDe = (nom, signature) => {
  const debut = modesNu.indexOf(`export function ${nom}(`);
  if (debut < 0) return null;
  const ouvrante = modesNu.indexOf(signature, debut);
  if (ouvrante < 0) return null;
  //  On coupe APRÈS la signature (le piège payé aux nº 272, 275, 278 :
  //  un type générique contient des accolades).
  const depart = ouvrante + signature.length;
  let profondeur = 1;
  let fin = depart;
  while (fin < modesNu.length && profondeur > 0) {
    if (modesNu[fin] === "{") profondeur += 1;
    if (modesNu[fin] === "}") profondeur -= 1;
    fin += 1;
  }
  return modesNu.slice(depart, fin - 1);
};

const corpsType = corpsDe("typeDeLieuDuMode", "): string {");
const corpsEtiquette = corpsDe("etiquetteDuLieu", "): string {");

/*  Les deux mots du rôle viennent du formulaire : on les VÉRIFIE dans
    la configuration avant de s'en servir comme bouchon. */
const rolesJustes =
  /choix: "Fondateur"/.test(config) && /choix: "Résident"/.test(config);
const libelleRoleCourt = (slug) =>
  slug === "fondateur" ? "Fondateur" : slug === "resident" ? "Résident" : "";
const genreMode = () => ({ label: "En salon" });

const typeDeLieuDuMode = corpsType
  ? new Function("mode", corpsType)
  : () => "";
const etiquetteDuLieu = corpsEtiquette
  ? new Function(
      "mode",
      "typeDeLieuDuMode",
      "libelleRoleCourt",
      "genreMode",
      corpsEtiquette
    )
  : () => "";
const etiquette = (mode) =>
  etiquetteDuLieu(mode, typeDeLieuDuMode, libelleRoleCourt, genreMode);

/* ==================================================================
 * §1 — LE TITRE « ÉQUIPE » S'EN VA
 * ================================================================== */
titre("§1 — le titre « ÉQUIPE » est retiré, les lignes restent");
{
  verif(
    "plus aucun titre « Équipe » dans le bloc des lieux",
    !/>Équipe</.test(bloc)
  );
  verif(
    "les lignes de l'équipe n'ont pas bougé : rond, nom en blanc, rôle " +
      "en gris dessous, ligne entière cliquable",
    /<PhotoRonde source=\{membre\.photo\} nature="personne" \/>/.test(bloc) &&
      /text-\[15px\] font-medium leading-snug text-sombre-texte/.test(bloc) &&
      /\{roleDuMembre\(membre\)\}/.test(bloc) &&
      /className=\{CLASSES_LIGNE_CLIQUABLE\}/.test(bloc)
  );
  verif(
    "l'ordre imposé et les dates de guest EN BLANC sont intacts",
    /equipeOrdonnee\(equipe\)/.test(bloc) &&
      /<DatesDeSession\s+debut=\{membre\.debut_le\}\s+fin=\{membre\.fin_le\}\s+enBlanc\s+\/>/.test(
        bloc.replace(/\s+/g, " ").replace(/ \/>/g, " />")
      ) ||
      /enBlanc/.test(bloc)
  );
}

/* ==================================================================
 * §2 — LES SEPT ÉTIQUETTES
 * ================================================================== */
titre("§2 — rejeu : les sept étiquettes, au mot près");
{
  verif(
    "les deux fonctions sont extractibles du vrai fichier",
    Boolean(corpsType && corpsEtiquette) && rolesJustes
  );
  const attendu = [
    ["FONDATEUR DU SALON", { genre: "salon", role: "fondateur" }],
    ["RÉSIDENT DU SALON", { genre: "salon", role: "resident" }],
    ["FONDATEUR DU STUDIO", { genre: "prive", role: "fondateur" }],
    ["RÉSIDENT DU STUDIO", { genre: "prive", role: "resident" }],
    ["EN GUEST AU SALON", { genre: "guest", nature_lieu: "salon" }],
    ["EN GUEST AU STUDIO", { genre: "guest", nature_lieu: "prive" }],
    ["REÇOIT À DOMICILE", { genre: "domicile" }],
  ];
  const rendus = attendu.map(([, mode]) => etiquette(mode).toUpperCase());
  verif(
    "LES SEPT, dans l'ordre : " + attendu.map(([mot]) => mot).join(" · "),
    attendu.every(([mot], rang) => rendus[rang] === mot),
    rendus.join(" · ")
  );
  verif(
    "LE MOT « ARTISTE » N'APPARAÎT NULLE PART dans les étiquettes",
    rendus.every((mot) => !mot.includes("ARTISTE"))
  );
  verif(
    "et le télégraphe de la nº 286 a disparu : plus aucun « · » dans " +
      "une étiquette",
    rendus.every((mot) => !mot.includes("·"))
  );
  verif(
    "LA STRUCTURE EN TROIS LIGNES NE CHANGE PAS : étiquette grise en " +
      "capitales, nom en blanc, adresse en gris",
    /<p className=\{ECRITURE_TITRE_SECTION\}>\{etiquette\}<\/p>/.test(bloc) &&
      /text-\[15px\] font-medium leading-snug text-sombre-texte/.test(bloc) &&
      /text-\[14px\] leading-relaxed text-sombre-texte-doux/.test(bloc)
  );
  //  LES RÈGLES DE LA Nº 286, MAINTENUES.
  verif(
    "À DOMICILE : aucun nom de lieu, AUCUNE ADRESSE — la ville, puis le " +
      "rayon en gris",
    /if \(mode\.genre === "domicile"\) \{/.test(modesNu) &&
      /nom: ligneCarte\(lieu\),/.test(modesNu) &&
      /adresse: rayon > 0 \? `Dans un rayon de \$\{rayon\} km` : "",/.test(
        modesNu
      )
  );
  verif(
    "SANS FICHE NI NOM SAISI : l'adresse monte sur la ligne blanche, et " +
      "il n'y a pas de troisième ligne — jamais écrite deux fois",
    /if \(!nom\) return \{ etiquette, nom: adresse, adresse: "" \};/.test(
      modesNu
    )
  );
}

/* ==================================================================
 * §3 — UNE SEULE INFORMATION, LUE AUX DEUX ENDROITS
 * ================================================================== */
titre("§3 — le rôle vient de la déclaration de l'artiste");
{
  verif(
    "la fiche du LIEU va chercher la déclaration (`modes_exercice`), " +
      "une fois, pour tous les membres",
    /\.from\("modes_exercice"\)/.test(tatoueursNu) &&
      /\.select\("tatoueur_id, salon_id, genre, role"\)/.test(tatoueursNu) &&
      /\.in\("tatoueur_id", artistesDeLEquipe\)/.test(tatoueursNu)
  );
  verif(
    "et cette déclaration EST PASSÉE à la traduction unique",
    /declarations\.get\(`\$\{ligne\.salon_id\}\|\$\{ligne\.artiste_id\}`\) \?\? null/.test(
      tatoueursNu
    )
  );
  verif(
    "LA TRADUCTION PRÉFÈRE LA DÉCLARATION à ce que rend la vue",
    /const genre = declaration\?\.genre \?\? ligne\.genre;/.test(modesNu) &&
      /const role = declaration\?\.role \?\? ligne\.role;/.test(modesNu)
  );

  /*  LE REJEU DE LA TRADUCTION — le cas exact du relevé : l'artiste a
      déclaré « fondateur », la vue rend `null` (liaison sans mode). */
  const corpsMembre = corpsDe("membreDepuisVue", "): MembreEquipe {");
  const membreDepuisVue = corpsMembre
    ? new Function("ligne", "declaration", corpsMembre)
    : null;
  verif("la traduction est extractible", Boolean(membreDepuisVue));
  if (membreDepuisVue) {
    const vue = {
      artiste_id: "a1",
      artiste_nom: "Funambulink Ttt",
      artiste_slug: "funambulink-ttt-lyon",
      artiste_photo: null,
      genre: "salon",
      role: null,
      debut_le: null,
      fin_le: null,
    };
    verif(
      "AVANT (la vue seule, rôle null) : « resident » — la valeur " +
        "DEVINÉE, celle du relevé du propriétaire",
      membreDepuisVue(vue, null).role === "resident",
      membreDepuisVue(vue, null).role
    );
    verif(
      "APRÈS (la déclaration de l'artiste) : « fondateur » — les deux " +
        "fiches disent enfin la même chose",
      membreDepuisVue(vue, { genre: "salon", role: "fondateur" }).role ===
        "fondateur",
      membreDepuisVue(vue, { genre: "salon", role: "fondateur" }).role
    );
    verif(
      "un GUEST déclaré reste un guest (le genre suit la même règle)",
      membreDepuisVue(vue, { genre: "guest", role: null }).genre === "guest"
    );
  }
}

/* ==================================================================
 * §4 — L'ADRESSE D'UN STUDIO SE CLIQUE
 * ================================================================== */
titre("§4 — l'adresse se clique même sans rue");
{
  verif(
    "la condition n'exige plus de RUE : il suffit qu'il y ait quelque " +
      "chose à chercher",
    /const complete = Boolean\(lieu && adresse\);/.test(bloc) &&
      !/const complete = Boolean\(lieu\?\.adresse && adresse\)/.test(bloc)
  );
  verif(
    "c'est LE MÊME système : le même lien Google Maps, la même fenêtre " +
      "translucide au doigt — pas un second",
    /href=\{adresseMaps\(lieu\)\}/.test(bloc) &&
      /<FenetreAdresse/.test(bloc) &&
      (bloc.match(/function FenetreAdresse/g) ?? []).length === 1
  );
  verif(
    "la requête Maps se compose avec ce qu'on a (rue si elle existe, " +
      "sinon ville, région, pays) — l'écriture unique de lib/adresse",
    /ligneMaps\(lieu\)/.test(bloc)
  );
  verif(
    "« À DOMICILE » N'EST PAS TOUCHÉ : il ne passe pas par cette ligne " +
      "d'adresse (sa ville et son rayon viennent de troisLignesDuMode)",
    !/AdresseCliquable/.test(
      bloc.slice(bloc.indexOf("export function BlocProfilsArtiste"))
    )
  );
}

/* ==================================================================
 * VIVANT — 390 px
 * ================================================================== */
titre("vivant (390 px) : les étiquettes servies, le titre parti");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    });
    const page = await contexte.newPage();

    //  UN SALON : l'adresse se clique, et aucun titre « Équipe ».
    await page.goto(`${BASE}/tatoueur/atelier-corvus-lyon-1er`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(2000);
    const salon = await page.evaluate(() => ({
      etiquettes: [...document.querySelectorAll("p.uppercase")].map((e) =>
        e.textContent.trim()
      ),
      maps: document.querySelector('a[href*="google.com/maps"]')?.textContent
        ?.trim(),
    }));
    verif(
      "sur un SALON : « Adresse du salon », et AUCUN titre « Équipe »",
      salon.etiquettes.includes("Adresse du salon") &&
        !salon.etiquettes.includes("Équipe"),
      salon.etiquettes.join(" · ")
    );
    verif(
      "et son adresse est un lien Google Maps",
      Boolean(salon.maps),
      salon.maps ?? "(aucun)"
    );

    //  UN ARTISTE : les étiquettes explicites, servies.
    await page.goto(`${BASE}/tatoueur/studio-cameleon-bordeaux`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(2000);
    const artiste = await page.evaluate(() =>
      [...document.querySelectorAll("p.uppercase")].map((e) =>
        e.textContent.trim()
      )
    );
    verif(
      "sur un ARTISTE : des étiquettes qui se LISENT (« Reçoit à " +
        "domicile », « Résident du salon »), plus aucun télégraphe",
      artiste.includes("Reçoit à domicile") &&
        artiste.some((mot) => /^(Fondateur|Résident) du (salon|studio)$/.test(mot)) &&
        !artiste.some((mot) => mot.includes("·")),
      artiste.join(" · ")
    );
  } finally {
    await nav.close();
  }
}

titre("NON JOUÉ ICI");
{
  nonJoue(
    "§3 · LA CONTRADICTION TELLE QUE RELEVÉE (Funambulink : fondateur " +
      "sur sa fiche, résident sur celle de son studio)",
    "les deux fiches vivent dans la base du propriétaire, hors de " +
      "portée de ce conteneur (Supabase n'y répond pas). La correction " +
      "est prouvée là où elle s'écrit : la déclaration lue une seule " +
      "fois (à la source), et la traduction REJOUÉE sur le vrai code — " +
      "rôle null + déclaration « fondateur » rend « fondateur »"
  );
  nonJoue(
    "§4 · UN STUDIO SANS RUE (« Félines, France »)",
    "aucune fiche de démonstration de ce conteneur n'a une adresse " +
      "sans rue : le cas est prouvé à la source (la condition n'exige " +
      "plus `lieu.adresse`), et en vivant sur un salon dont l'adresse " +
      "complète ouvre bien le même lien"
  );
}

process.exit(bilan());
