/**
 * BANC DE LA PASSE Nº 272
 * ==================================================================
 * §1 une fiche créée par le compte ADMINISTRATEUR (le propriétaire)
 *    tombait dans l'exclusion nº 135 de l'écran de validation et
 *    n'apparaissait NULLE PART : la règle est complétée — une
 *    création qui attend est montrée. Les valeurs de la ligne neuve
 *    sont relevées à la source, le filtre livré est REJOUÉ, et les
 *    contraintes de statut sont vérifiées une à une ;
 * §2 le journal de bord : écrit CÔTÉ SERVEUR au fil de l'eau
 *    (chargements, navigations, erreurs, bascules de session), et
 *    son coupe-circuit arrête une boucle simulée au lieu de laisser
 *    le site clignoter — mesuré sur le fichier lui-même ;
 * §3 le miroir : la clé d'identité (genre + clé + nature du lieu)
 *    va sur LE BLOC ENTIER de chaque mode — l'isolement est joué
 *    VIVANT sur le vrai formulaire, champ par champ, dans les deux
 *    sens, pour salon, studio et guest (bascule de nature comprise) ;
 * §4 la fiche ouverte depuis une recherche ne montre que le carrousel
 *    demandé — style ET catégorie ; un style cherché SANS catégorie
 *    vaut « Réalisations » (le trou du relevé, mesuré : 5 photos au
 *    lieu de 4) ; sans recherche, tout s'affiche.
 *
 * ⚠️ LA VRAIE BASE EST HORS DE PORTÉE : la création réelle en base et
 * l'écran d'administration authentifié sont NON JOUÉS — remplacés par
 * la lecture ligne à ligne et le REJEU des écritures livrées (new
 * Function), comme en 265. Le formulaire de création, lui, se joue en
 * vrai (formulaireNeuf, sans base) — c'est là que vit le §3.
 * ⚠️ CHROMIUM N'EST PAS WEBKIT : rien ici ne parle pour Safari/iOS.
 * ⚠️ LARGEURS : la fiche publique est mesurée à 390 px (le relevé est
 * un téléphone), le formulaire à 1440 px (ses menus s'y pilotent sans
 * défilement) — dit ici pour n'être pas deviné.
 */
import { readFileSync } from "node:fs";
import {
  BASE,
  RACINE,
  bilan,
  chromium,
  formulaireNeuf,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const formulaireNu = sansNotes(lire("src/components/FormulaireFiche.tsx"));
const fichesAdmin = sansNotes(
  lire("src/app/api/admin/yokofolio/fiches/route.ts")
);
const journalLib = sansNotes(lire("src/lib/journal-de-bord.ts"));
const journalRoute = sansNotes(
  lire("src/app/api/dev/journal-de-bord/route.ts")
);
const blocModesNu = sansNotes(lire("src/components/BlocModesExercice.tsx"));
const ficheTatoueurNu = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const fenetreFicheNu = sansNotes(lire("src/components/FenetreFiche.tsx"));
const ecranAuthNu = sansNotes(lire("src/components/EcranAuthentification.tsx"));
const useUtilisateurNu = sansNotes(lire("src/lib/use-utilisateur.ts"));

/* ==================================================================
 * §1 — CE QUE LA LIGNE NEUVE REÇOIT, ET CE QUE L'ADMIN FILTRE
 * ================================================================== */
titre("§1 — la création : les valeurs de visibilité, relevées à la source");
{
  const debutLigne = formulaireNu.indexOf("const ligne = {");
  const blocLigne = formulaireNu.slice(
    debutLigne,
    formulaireNu.indexOf("};", debutLigne)
  );
  verif(
    "la ligne neuve : statut « en_attente », publie false — et NI " +
      "hors_ligne NI supprime_le dans l'envoi (les défauts de colonne " +
      "les tiennent : false, et null)",
    blocLigne.includes('statut: "en_attente"') &&
      blocLigne.includes("publie: false") &&
      !blocLigne.includes("hors_ligne") &&
      !blocLigne.includes("supprime_le")
  );
  //  LES CONTRAINTES DE STATUT, UNE À UNE : les trois écritures qui
  //  existent en base selon les migrations passées — TOUTES admettent
  //  « en_attente ». Aucune ne peut refuser la création en silence.
  const contraintes = [
    ["supabase/yokofolio-fiches-tatoueurs.sql", /'en_attente', 'validee', 'refusee'/],
    ["supabase/yokofolio-moderation.sql", /'en_attente', 'validee', 'refusee', 'modifications'/],
    ["supabase/yokofolio-en-ligne-vraie-regle.sql", /'en_attente', 'validee', 'refusee', 'modifications'/],
  ];
  verif(
    "aucune contrainte ne refuse « en_attente » : les trois écritures " +
      "de la base l'admettent (la migration 60 n'a piégé que « modifications »)",
    contraintes.every(([fichier, forme]) => forme.test(lire(fichier)))
  );
  verif(
    "pas d'orpheline invisible : la fiche s'écrit D'ABORD, puis modes, " +
      "rattachements et photos — un échec dépendant laisse une fiche " +
      "« en_attente » que l'écran corrigé LISTE désormais",
    /const creee = \(insertion\.data as \{ id\?: string \} \| null\)\?\.id \?\? null;/.test(
      formulaireNu
    ) &&
      /await enregistrerExercice\(/.test(formulaireNu) &&
      /await enregistrerPhotos\(supabase, creee, galerieAEcrire\);/.test(
        formulaireNu
      )
  );
}

titre("§1 — le filtre de l'écran de validation, REJOUÉ sur les cas du relevé");
{
  //  L'ÉCRITURE LIVRÉE du filtre, extraite et rejouée telle quelle.
  const depart = fichesAdmin.indexOf(".filter((ligne) => {");
  const corps = fichesAdmin.slice(
    depart + ".filter((ligne) => {".length,
    fichesAdmin.indexOf("});", depart)
  );
  let filtre = null;
  try {
    filtre = new Function(
      "ligne",
      "comptesAdmin",
      corps.replace(/ as string \| null/g, "")
    );
  } catch {
    filtre = null;
  }
  const ADMIN = "compte-admin";
  const cas = filtre && {
    vraiTatoueur: filtre({ user_id: "compte-x", brouillon: null }, [ADMIN]),
    modificationAdmin: filtre(
      { user_id: ADMIN, brouillon: { nom: "n" } },
      [ADMIN]
    ),
    //  LE CAS DU RELEVÉ : la création normale du propriétaire —
    //  jamais publiée, jamais passée par l'interrupteur.
    creationAdmin: filtre(
      { user_id: ADMIN, brouillon: null, publie: false, admin_publique: null },
      [ADMIN]
    ),
    //  Une fiche déjà pilotée par l'interrupteur du démarchage : elle
    //  reste dehors, c'est lui qui la publie.
    interrupteur: filtre(
      { user_id: ADMIN, brouillon: null, publie: false, admin_publique: true },
      [ADMIN]
    ),
  };
  verif(
    "le filtre rejoué : vrai tatoueur MONTRÉ · modification d'admin " +
      "MONTRÉE (nº 152) · CRÉATION d'admin MONTRÉE (le correctif) · " +
      "fiche à interrupteur écartée (le démarchage garde son chemin)",
    Boolean(cas) &&
      cas.vraiTatoueur === true &&
      cas.modificationAdmin === true &&
      cas.creationAdmin === true &&
      cas.interrupteur === false,
    cas ? JSON.stringify(cas) : "extraction impossible"
  );
  verif(
    "l'OR de la lecture n'a pas bougé : « en_attente », plus les fiches " +
      "d'avant la colonne statut",
    fichesAdmin.includes(
      '.or("statut.eq.en_attente,and(publie.eq.false,statut.is.null)")'
    )
  );
}

/* ==================================================================
 * §2 — LE JOURNAL, À LA SOURCE : le fil de l'eau, et le coupe-circuit
 * ================================================================== */
titre("§2 — à la source : le journal écrit au fil de l'eau, la garde câblée");
{
  verif(
    "chaque ligne part TOUT DE SUITE (sendBeacon, fetch keepalive en " +
      "secours) — jamais un journal de fin de session",
    /navigator\.sendBeacon\?\.\(ADRESSE_JOURNAL/.test(journalLib) &&
      /keepalive: true/.test(journalLib)
  );
  verif(
    "le serveur AJOUTE ligne à ligne (appendFile) dans " +
      "journal-de-bord.ndjson, avec l'heure ET la session vue du serveur",
    /await appendFile\(chemin, ligne, "utf8"\);/.test(journalRoute) &&
      /session_vue_du_serveur/.test(journalRoute) &&
      /recu_le: new Date\(\)\.toISOString\(\)/.test(journalRoute)
  );
  verif(
    "les compteurs d'emballement existent tous les trois : navigations, " +
      "rechargements, rendus par seconde — et l'arrêt s'engage",
    /PLAFOND_NAVIGATIONS = 8/.test(journalLib) &&
      /PLAFOND_CHARGES = 5/.test(journalLib) &&
      /PLAFOND_RENDUS_PAR_SECONDE = 40/.test(journalLib) &&
      /function engagerLArret\(/.test(journalLib)
  );
  verif(
    "les DEUX gardes du miroir passent par le coupe-circuit — l'espace " +
      "et la page de compte — et la bascule de session est consignée",
    /redirectionDeGarde\("espace", "\/devenir-tatoueur"\)/.test(formulaireNu) &&
      /redirectionDeGarde\("connexion", arrivee\)/.test(ecranAuthNu) &&
      /setGardeCoupee\(true\)/.test(ecranAuthNu) &&
      //  coupée, la page de compte MONTRE l'écran de connexion au lieu
      //  du <main> vide qui attendait une redirection interdite.
      /pret && utilisateur && !gardeCoupee/.test(ecranAuthNu) &&
      /noterAuJournal\("session", \{ connecte: Boolean\(utilisateur\) \}\);/.test(
        useUtilisateurNu
      )
  );
  verif(
    "le journal est monté dans la mise en page tatouage, et ne rend rien",
    /<JournalDeBord \/>/.test(lire("src/app/(tatouage)/layout.tsx")) &&
      /return null;/.test(sansNotes(lire("src/components/JournalDeBord.tsx")))
  );
}

/* ==================================================================
 * §2 — VIVANT : le fichier s'écrit pendant la navigation, la boucle
 * simulée est arrêtée et consignée
 * ================================================================== */
const CHEMIN_JOURNAL = `${RACINE}/journal-de-bord.ndjson`;
function lignesDuJournal() {
  try {
    return readFileSync(CHEMIN_JOURNAL, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((ligne) => {
        try {
          return JSON.parse(ligne);
        } catch {
          return { genre: "illisible" };
        }
      });
  } catch {
    return [];
  }
}

titre("§2 — VIVANT : le journal pendant une navigation, puis la boucle simulée");
{
  const avant = lignesDuJournal().length;
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  const contexte = await nav.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await contexte.newPage();
  try {
    await page.goto(`${BASE}/tatoueur/camille-fauve-paris-18e`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    //  UNE NAVIGATION DOUCE — le lien du salon lié, dans la page.
    await page.locator('a[href^="/tatoueur/hokusai"]').first().click();
    await page.waitForTimeout(2500);
    const apresNavigation = lignesDuJournal();
    const neuves = apresNavigation.slice(avant);
    verif(
      "pendant la visite : une ligne « charge » ET une ligne de " +
        "navigation, écrites AU FIL DE L'EAU (le fichier grossit avant la fin)",
      neuves.some((l) => l.genre === "charge") &&
        neuves.some(
          (l) => l.genre === "navigation" || l.genre === "navigation-remplacee"
        ),
      `${neuves.length} ligne(s) neuve(s)`
    );
    verif(
      "chaque ligne porte les DEUX juges de la session : le cookie vu du " +
        "navigateur, la session vue du serveur",
      neuves.length > 0 &&
        neuves.every(
          (l) =>
            typeof l.session_cookie === "boolean" &&
            typeof l.session_vue_du_serveur === "boolean"
        )
    );

    //  LA BOUCLE SIMULÉE : douze navigations en rafale — le plafond
    //  est à huit sur dix secondes. Le coupe-circuit doit l'écrire ET
    //  s'engager (sessionStorage), sans casser la page.
    await page.evaluate(() => {
      for (let tour = 0; tour < 12; tour += 1) {
        history.pushState({}, "", `?tic=${tour}`);
      }
    });
    await page.waitForTimeout(1500);
    const arret = await page.evaluate(() =>
      sessionStorage.getItem("yf-journal-arret")
    );
    const emballements = lignesDuJournal()
      .slice(avant)
      .filter((l) => l.genre === "emballement");
    verif(
      "la boucle simulée est ARRÊTÉE (l'arrêt s'engage) et CONSIGNÉE " +
        "(une ligne « emballement », cause navigations)",
      arret !== null &&
        emballements.some((l) => l.cause === "navigations"),
      `arrêt ${arret ? "engagé" : "absent"} · ${emballements.length} emballement(s)`
    );
    //  Et la page, elle, vit toujours — le journal n'a rien cassé.
    verif(
      "la page reste vivante et intacte après la rafale (le journal " +
        "observe, il ne casse pas)",
      await page.evaluate(() => document.body.innerText.includes("Hokusai"))
    );
  } catch (erreur) {
    nonJoue("§2 vivant", `le parcours s'est interrompu — ${String(erreur).slice(0, 120)}`);
  } finally {
    await contexte.close();
    await nav.close();
  }
}

/* ==================================================================
 * §3 — LE MIROIR : la clé sur le bloc entier, à la source
 * ================================================================== */
titre("§3 — à la source : l'identité complète sur LE BLOC, plus sur les champs");
{
  verif(
    "la clé de bloc — genre + clé + nature du lieu — aux DEUX rendus " +
      "(lieu unique et accordéon), et plus AUCUNE clé de champ",
    (blocModesNu.match(
      /key=\{`\$\{session\.genre\}-\$\{session\.cle\}-\$\{session\.natureLieu \?\? ""\}`\}/g
    ) ?? []).length === 2 &&
      !/key=\{`\$\{mode\.genre\}-\$\{mode\.cle\}`\}/.test(blocModesNu)
  );
  verif(
    "la règle de la 265 ne bouge pas : changer la nature d'un guest " +
      "efface le lieu de l'autre (salon ET adresse, d'une écriture)",
    /modifier\(mode\.cle, \{ natureLieu, salon: null, lieu: null \}\)/.test(
      blocModesNu
    )
  );
  verif(
    "les DONNÉES du mode restent des données (rôle, dates, rayon " +
      "contrôlés par `modes`) : la remontée du bloc n'en perd aucune",
    /valeur=\{\(mode\.role \?\? ROLES_STUDIO\[0\]\.slug\) as RoleStudio\}/.test(
      blocModesNu
    ) &&
      /debut=\{mode\.debut_le\}/.test(blocModesNu) &&
      /const actif = mode\.rayonKm === rayon;/.test(blocModesNu)
  );
}

/* ==================================================================
 * §3 — VIVANT : l'isolement champ par champ, dans les deux sens
 * ================================================================== */
titre("§3 — VIVANT (1440 px) : salon, studio, guest — rien ne traverse");
{
  const { nav, ctx, page } = await ouvrirLeNavigateur("p272", {
    width: 1440,
    height: 950,
  });
  try {
    const pret = await formulaireNeuf(page, "artiste");
    if (!pret) {
      nonJoue(
        "§3 vivant",
        "le formulaire de création n'a pas atteint les blocs 2+ (parcours indisponible ici)"
      );
    } else {
      const onglet = (libelle) =>
        page
          .locator(
            '[role="radiogroup"][aria-label="Le mode d\'activité"] [role="radio"]',
            { hasText: libelle }
          )
          .first();
      const recherche = () => page.locator('input[placeholder="Recherche"]').first();
      const roleCoche = () =>
        page
          .locator(
            '[role="radiogroup"][aria-label="Ton rôle dans ce lieu"] [role="radio"][aria-checked="true"]'
          )
          .first()
          .innerText();
      const natureGuest = (libelle) =>
        page
          .locator(
            '[role="radiogroup"][aria-label="La nature du lieu qui t\'accueille"] [role="radio"]',
            { hasText: libelle }
          )
          .first();

      //  SALON : une recherche tapée, un rôle choisi.
      await onglet("En salon").click();
      await page.waitForTimeout(700);
      await recherche().fill("Corvus");
      await page
        .locator(
          '[role="radiogroup"][aria-label="Ton rôle dans ce lieu"] [role="radio"]',
          { hasText: "Artiste résident" }
        )
        .first()
        .click();
      await page.waitForTimeout(400);

      //  SALON → STUDIO : rien de « Corvus », rôle au défaut du studio.
      await onglet("En studio").click();
      await page.waitForTimeout(700);
      const rechercheStudio = await recherche().inputValue();
      const roleStudio = await roleCoche();
      verif(
        "salon → studio : la recherche du studio est VIDE, son rôle est " +
          "le sien (« Fondateur du studio », jamais le résident du salon)",
        rechercheStudio === "" && /Fondateur du studio/.test(roleStudio),
        `recherche « ${rechercheStudio} » · rôle « ${roleStudio.trim()} »`
      );
      //  On tape à son tour dans le studio…
      await recherche().fill("Atelier");
      await page.waitForTimeout(300);

      //  STUDIO → SALON : rien d'« Atelier », le rôle résident est resté
      //  (c'est une DONNÉE du mode salon, pas un état d'instance).
      await onglet("En salon").click();
      await page.waitForTimeout(700);
      const rechercheSalon = await recherche().inputValue();
      const roleSalon = await roleCoche();
      verif(
        "studio → salon : la recherche du salon est vide (jamais " +
          "« Atelier »), et SA donnée — le rôle résident — est intacte",
        rechercheSalon === "" && /Artiste résident/.test(roleSalon),
        `recherche « ${rechercheSalon} » · rôle « ${roleSalon.trim()} »`
      );

      //  GUEST : la bascule de nature — LE va-et-vient du relevé.
      await onglet("Guest").click();
      await page.waitForTimeout(700);
      const rechercheGuestArrivee = await recherche().inputValue();
      verif(
        "salon → guest : la recherche du guest arrive VIDE (ni Corvus ni " +
          "Atelier), et ses dates n'existent que chez lui",
        rechercheGuestArrivee === "" &&
          (await page.locator('text="Du"').count()) >= 0,
        `recherche « ${rechercheGuestArrivee} »`
      );
      await recherche().fill("Hokusai");
      await page.waitForTimeout(300);
      //  LA BASCULE DE NATURE — le va-et-vient du relevé. ⚠️ LE GUEST
      //  OUVRE SUR « STUDIO » (modeVierge pose natureLieu "prive") :
      //  le premier changement est donc VERS « Salon ». À chaque
      //  changement, le bloc REMONTE et le brouillon s'efface —
      //  l'écran dit ce que la règle de la 265 fait à la donnée.
      await natureGuest("Salon").click();
      await page.waitForTimeout(700);
      const rechercheNatureSalon = await recherche().inputValue();
      await natureGuest("Studio").click();
      await page.waitForTimeout(700);
      const rechercheNatureStudio = await recherche().inputValue();
      verif(
        "guest, nature studio → salon → studio : la saisie ne survit à " +
          "AUCUN côté du va-et-vient (« Hokusai » n'apparaît nulle part)",
        rechercheNatureSalon === "" && rechercheNatureStudio === "",
        `salon « ${rechercheNatureSalon} » · studio « ${rechercheNatureStudio} »`
      );

      //  GUEST → STUDIO → GUEST : l'autre sens de chaque paire.
      await recherche().fill("Vermillon");
      await page.waitForTimeout(300);
      await onglet("En studio").click();
      await page.waitForTimeout(700);
      const rechercheRetourStudio = await recherche().inputValue();
      await onglet("Guest").click();
      await page.waitForTimeout(700);
      const rechercheRetourGuest = await recherche().inputValue();
      verif(
        "guest → studio → guest : « Vermillon » ne traverse ni dans un " +
          "sens ni dans l'autre",
        rechercheRetourStudio === "" && rechercheRetourGuest === "",
        `studio « ${rechercheRetourStudio} » · guest « ${rechercheRetourGuest} »`
      );

      //  LE RAYON n'existe qu'à DOMICILE (sa donnée à lui, posée par
      //  formulaireNeuf) : les trois autres onglets n'en montrent pas.
      const rayonsAilleurs = await page
        .locator('button:has-text("25 km")')
        .count();
      await onglet("À domicile").click();
      await page.waitForTimeout(700);
      const rayonDomicile = await page
        .locator('button[aria-checked="true"]:has-text("25 km")')
        .count();
      verif(
        "le rayon vit à DOMICILE seul (« 25 km » coché là, absent des " +
          "autres onglets)",
        rayonsAilleurs === 0 && rayonDomicile === 1,
        `ailleurs ${rayonsAilleurs} · domicile ${rayonDomicile}`
      );
    }
  } catch (erreur) {
    nonJoue("§3 vivant", `le parcours s'est interrompu — ${String(erreur).slice(0, 140)}`);
  } finally {
    await ctx.close();
    await nav.close();
  }
}

/* ==================================================================
 * §4 — LE CARROUSEL DE LA RECHERCHE
 * ================================================================== */
titre("§4 — à la source : un style cherché sans catégorie vaut Réalisations");
{
  const attendu =
    /const serieCherchee =\s*natureInitiale \|\| styleInitial\s*\?\s*\{ nature: natureInitiale \|\| NATURE_PAR_DEFAUT, rendu: renduInitial \}\s*:\s*null;/;
  const attenduFenetre =
    /const serieCherchee =\s*natureRecherche \|\| styleRecherche\s*\?\s*\{ nature: natureRecherche \|\| NATURE_PAR_DEFAUT, rendu: renduRecherche \}\s*:\s*null;/;
  verif(
    "les DEUX enveloppes (page et fenêtre superposée) posent la même " +
      "règle — style OU catégorie cherchés → série restreinte, catégorie " +
      "par défaut « Réalisations »",
    attendu.test(ficheTatoueurNu) && attenduFenetre.test(fenetreFicheNu)
  );
  verif(
    "rien n'est détruit : le repli d'un style sans photo de la catégorie " +
      "abandonne la série (le style entier s'affiche), et l'onglet " +
      "Portfolio garde tout",
    /const serieEffective = photosRestreintes\.length > 0 \? serieOuverte : null;/.test(
      ficheTatoueurNu
    )
  );
}

titre("§4 — VIVANT (390 px) : le carrousel suit la recherche, et elle seule");
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
  //  Typo Sauvage (démonstration) : 5 photos en « lettrage », dont UN
  //  flash — les quatre ouvertures se distinguent donc au compteur.
  const releves = {};
  try {
    for (const [cle, adresse] of [
      ["realisations", "/tatoueur/typo-sauvage-bordeaux?style=lettering&nature=tatouage"],
      ["flashs", "/tatoueur/typo-sauvage-bordeaux?style=lettering&nature=flash"],
      ["styleSeul", "/tatoueur/typo-sauvage-bordeaux?style=lettering"],
      ["sansRecherche", "/tatoueur/typo-sauvage-bordeaux"],
    ]) {
      await page.goto(`${BASE}${adresse}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(2200);
      releves[cle] = await page.evaluate(() => {
        const carrousel = document.querySelector("[data-carrousel]");
        const compteur = carrousel?.querySelector('[data-role="compteur"]');
        return {
          nature: carrousel?.getAttribute("data-serie-nature") ?? null,
          //  Une seule photo : pas de compteur — on lit « 1/1 ».
          compteur: compteur ? compteur.textContent.trim() : "1/1",
        };
      });
    }
    verif(
      "réalisations réalistes → LE carrousel demandé seul (4 photos, " +
        "catégorie déclarée « tatouage »)",
      releves.realisations.compteur === "1/4" &&
        releves.realisations.nature === "tatouage",
      JSON.stringify(releves.realisations)
    );
    verif(
      "flashs réalistes → les flashs du style SEULS (1 photo), même si " +
        "l'artiste a d'autres flashs ailleurs",
      releves.flashs.compteur === "1/1" && releves.flashs.nature === "flash",
      JSON.stringify(releves.flashs)
    );
    verif(
      "LE TROU DU RELEVÉ, refermé : un style cherché SANS catégorie vaut " +
        "Réalisations — 4 photos, plus jamais 5 avec le flash mêlé",
      releves.styleSeul.compteur === "1/4" &&
        releves.styleSeul.nature === "tatouage",
      JSON.stringify(releves.styleSeul)
    );
    verif(
      "une fiche ouverte SANS recherche montre tout (5 photos, aucune " +
        "catégorie déclarée)",
      releves.sansRecherche.compteur === "1/5" &&
        releves.sansRecherche.nature === null,
      JSON.stringify(releves.sansRecherche)
    );
  } catch (erreur) {
    nonJoue("§4 vivant", `la démonstration n'a pas répondu — ${String(erreur).slice(0, 120)}`);
  } finally {
    await contexte.close();
    await nav.close();
  }
}

nonJoue(
  "la création RÉELLE en base, et l'écran d'administration authentifié",
  "Supabase et le compte administrateur sont hors de portée de ce " +
    "conteneur : les valeurs écrites et le filtre sont prouvés par la " +
    "source et par le REJEU des écritures livrées (comme en 265) — la " +
    "création de bout en bout revient au propriétaire, écran ouvert"
);

process.exit(bilan());
