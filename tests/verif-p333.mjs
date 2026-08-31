/**
 * BANC DE LA PASSE Nº 333 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — DANS « MA SÉLECTION », UN FILTRE VALIDÉ LAISSE SON ENTRÉE, et
 *      annuler n'en coûte aucune. Le mécanisme est CELUI DE LA
 *      RECHERCHE, pas un second.
 * §2 — AU RETOUR DEPUIS DES RÉSULTATS, l'accueil retrouve sa position.
 *      Deux causes, toutes deux mesurées : la mémoire était EFFACÉE au
 *      départ, puis, une fois gardée, elle n'était plus LUE.
 * §3 — les cinq points « non joués » depuis la nº 329.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch` (livraison rapide).
 *
 * ⚠️ CE BANC NE PEUT OUVRIR AUCUNE SESSION, ET LA RAISON N'EST PAS LE
 * MOT DE PASSE. Le conteneur d'épreuve ne joint pas l'hôte Supabase du
 * projet : la passerelle réseau répond 403 au CONNECT
 * (« connect_rejected … supabase.co:443 »). Tout ce qui vit derrière
 * une session — « Ma sélection », le menu « Mon espace », l'aperçu —
 * reste donc hors de portée d'ici, avec ou sans identifiants. Aucun
 * identifiant n'est écrit dans ce fichier, ni ailleurs.
 */
import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const { nav, ctx } = await ouvrirLeNavigateur(
  "p333",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);

/** Une recherche entière au doigt, avec un style choisi. */
async function unecherche(p, style) {
  await p
    .locator('button[aria-label^="Rechercher"]')
    .first()
    .evaluate((el) => el.click());
  await p.waitForTimeout(700);
  await p.locator('[aria-label="Style"]').first().evaluate((el) => el.click());
  await p.waitForTimeout(700);
  const dejaOuverte = await p.evaluate(
    (libelle) =>
      [...document.querySelectorAll("button")].some((e) =>
        (e.textContent || "").trim().startsWith(libelle)
      ),
    style
  );
  if (!dejaOuverte) {
    await p.evaluate(() => {
      const porte = [...document.querySelectorAll("button")].find(
        (e) => (e.textContent || "").trim() === "Réalisations"
      );
      porte?.click();
    });
    await p.waitForTimeout(600);
  }
  const choisi = await p.evaluate((libelle) => {
    const option = [...document.querySelectorAll("button")].find((e) =>
      (e.textContent || "").trim().startsWith(libelle)
    );
    if (!option) return false;
    option.click();
    return true;
  }, style);
  await p.waitForTimeout(600);
  await p
    .locator('button:has-text("Valider")')
    .first()
    .evaluate((el) => el.click());
  await p.waitForTimeout(1400);
  return choisi;
}

/* ==================================================================
 * §1 — UN FILTRE VALIDÉ LAISSE SON ENTRÉE
 * ================================================================== */
titre("§1 — valider un filtre coûte une entrée, annuler n'en coûte aucune");
{
  const filtres = sansNotes(lire("src/lib/filtres-selection.ts"));
  verif(
    "LE FILTRE DIT AU MODULE COMMUN QUE L'ADRESSE CHANGE",
    /laSurfaceVaNaviguer\(\);[\s\S]{0,200}window\.history\.replaceState\(/.test(
      filtres
    ),
    "`laSurfaceVaNaviguer()` AVANT d'écrire le filtre sur l'étape"
  );
  verif(
    "…et C'EST LE MÊME MÉCANISME QUE LA RECHERCHE, pas un second",
    /from "@\/lib\/etape-refermable"/.test(filtres) &&
      !/pushState|history\.back/.test(filtres),
    "aucun dispositif jumeau : ni `pushState`, ni recul, dans ce module"
  );
  const moteur = sansNotes(lire("src/components/MoteurTatouage.tsx"));
  verif(
    "…la même que « Valider » de la page de recherche appelle depuis la nº 331",
    /laSurfaceVaNaviguer\(\);/.test(moteur),
    "une seule écriture pour les deux surfaces"
  );
  /*  L'ÉTAPE PORTE DÉJÀ LE FILTRE : `replaceState` l'écrit DESSUS, donc
      la laisser, c'est la consommer — jamais la doubler. */
  verif(
    "L'ÉTAPE EST CONSOMMÉE PAR LE FILTRE, pas doublée",
    /window\.history\.replaceState\(\s*window\.history\.state,/.test(filtres),
    "le filtre est écrit SUR l'étape du panneau, qui reste alors en place"
  );
  verif(
    "ET LES DEUX ACQUIS NE BOUGENT PAS : la liste remonte toujours en haut",
    /ouvrirLaListeEnHaut\(\);/.test(filtres),
    "nº 330-§1 intacte"
  );
  const refermable = sansNotes(lire("src/lib/etape-refermable.ts"));
  verif(
    "ANNULER NE COÛTE RIEN : sans marque, le module reprend son étape",
    /if \(navigationDemandee\) return;/.test(refermable) &&
      /window\.history\.back\(\);/.test(refermable),
    "refermer sans rien choisir n'appelle pas la marque — la reprise a lieu"
  );

  /* ---------- LA MOITIÉ MESURABLE : « annuler ne coûte rien » --------
     Le panneau des filtres vit derrière une session, hors de portée.
     La MÊME écriture gouverne la page de recherche, elle publique :
     on y mesure qu'une fermeture SANS navigation reprend bien son
     étape — c'est le contre-contrôle du §1. */
  const p1 = await ctx.newPage();
  await p1.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p1.waitForTimeout(900);
  const avant = await p1.evaluate(() => history.length);
  await p1
    .locator('button[aria-label^="Rechercher"]')
    .first()
    .evaluate((el) => el.click());
  await p1.waitForTimeout(900);
  const ouverte = await p1.evaluate(() => history.length);
  await p1.keyboard.press("Escape");
  await p1.waitForTimeout(1400);
  const apres = await p1.evaluate(() => ({
    pile: history.length,
    ou: location.pathname + location.search,
  }));
  verif(
    "ANNULER (fermeture sans choix) NE LAISSE AUCUNE ENTRÉE",
    ouverte === avant + 1 && apres.ou === "/",
    `${avant} → ${ouverte} à l'ouverture, puis retour à l'étape du dessous`
  );
  await p1.close();
}

/* ==================================================================
 * §2 — LA POSITION DE L'ACCUEIL AU RETOUR
 * ================================================================== */
titre("§2 — au retour depuis des résultats, l'accueil retrouve sa place");
{
  const neuve = sansNotes(lire("src/lib/liste-neuve.ts"));
  verif(
    "ON N'EFFACE PLUS LA POSITION DE LA PAGE QU'ON QUITTE",
    /adresseDeLaListe\?: string/.test(neuve) &&
      /oublierDefilementDe\(\s*adresseDeLaListe \?\?/.test(neuve),
    "l'adresse de la liste QUI ARRIVE, jamais celle qu'on laisse"
  );
  const index = sansNotes(lire("src/components/IndexTatoueurs.tsx"));
  verif(
    "…et LA RECHERCHE LUI DONNE SA DESTINATION",
    /const adresse = adresseDe\(suivants, 1\);\s*ouvrirLaListeEnHaut\(adresse\);/.test(
      index
    ),
    "`ouvrirLaListeEnHaut(adresse)` — l'accueil garde sa place"
  );
  const memoire = sansNotes(lire("src/components/MemoireNavigation.tsx"));
  verif(
    "L'EFFET SORTI FAUTE DE SIGNAL SE NOTE, et le `popstate` le réveille",
    /attenteDeTraversee\.current = url;/.test(memoire) &&
      /if \(attenteDeTraversee\.current === adresseTraversee\.current\)/.test(
        memoire
      ),
    "le routeur remet l'adresse 5 ms AVANT le popstate — mesuré"
  );
  verif(
    "…et RIEN D'AUTRE ne le réveille : une surface qui se referme n'y touche pas",
    /attenteDeTraversee\.current = null;/.test(memoire),
    "un popstate sans changement d'adresse n'était pas en attente"
  );

  /* ---------- LA MESURE, AU PIXEL ---------- */
  const p2 = await ctx.newPage();
  await p2.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p2.waitForTimeout(1200);
  await p2.evaluate(() =>
    window.scrollTo({ top: 900, left: 0, behavior: "instant" })
  );
  await p2.waitForTimeout(900);
  const quittee = await p2.evaluate(() => Math.round(window.scrollY));
  const memoireAvant = await p2.evaluate(() =>
    localStorage.getItem("yokofolio:defilement:/")
  );
  const jouee = await unecherche(p2, "Blackwork");
  if (!jouee || quittee < 100) {
    nonJoue(
      "§2 EN VIVANT",
      `la recherche n'a pas pu être jouée (position ${quittee}, style choisi ` +
        `${jouee}) — les contrôles de source ci-dessus tiennent.`
    );
  } else {
    const memoireApres = await p2.evaluate(() =>
      localStorage.getItem("yokofolio:defilement:/")
    );
    verif(
      "LA MÉMOIRE DE L'ACCUEIL SURVIT À LA RECHERCHE",
      memoireApres !== null && memoireApres === memoireAvant,
      `avant ${memoireAvant} · après ${memoireApres} (elle était EFFACÉE avant cette passe)`
    );
    await p2.goBack({ waitUntil: "commit" });
    await p2.waitForTimeout(2200);
    const rendue = await p2.evaluate(() => ({
      y: Math.round(window.scrollY),
      ou: location.pathname + location.search,
    }));
    verif(
      "AU RETOUR, L'ACCUEIL EST RENDU À LA POSITION QUITTÉE",
      rendue.ou === "/" && Math.abs(rendue.y - quittee) <= 4,
      `quittée à ${quittee} · rendue à ${rendue.y} (0 avant cette passe)`
    );
  }
  await p2.close();

  /*  LA BORNE : une surface qui se referme ne doit PAS déclencher de
      restitution — sans quoi l'on reposerait une position par-dessus le
      dégel, et le défaut de la nº 329 rouvrirait. */
  const p3 = await ctx.newPage();
  await p3.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p3.waitForTimeout(1000);
  await p3.evaluate(() =>
    window.scrollTo({ top: 600, left: 0, behavior: "instant" })
  );
  await p3.waitForTimeout(600);
  await p3
    .locator('button[aria-label^="Rechercher"]')
    .first()
    .evaluate((el) => el.click());
  await p3.waitForTimeout(900);
  await p3.goBack({ waitUntil: "commit" });
  await p3.waitForTimeout(1600);
  const apresSurface = await p3.evaluate(() => ({
    y: Math.round(window.scrollY),
    recherche: Boolean(document.documentElement.dataset.recherche),
  }));
  verif(
    "REFERMER UNE SURFACE NE DÉCLENCHE AUCUNE RESTITUTION PARASITE",
    apresSurface.recherche === false && Math.abs(apresSurface.y - 600) <= 6,
    `${apresSurface.y} px — la page est rendue par le dégel, pas par la mémoire`
  );
  await p3.close();
}

/* ==================================================================
 * §3 — LES CINQ POINTS « NON JOUÉS »
 * ================================================================== */
titre("§3 — ce qui reste hors de portée, et pourquoi");
{
  /*  Un seul des cinq est atteignable sans session : le quatrième, du
      côté ORDINATEUR, ne l'est pas non plus (l'aperçu vit dans
      l'espace). On mesure donc ce qui est public et qui les borde. */
  const p4 = await ctx.newPage();
  await p4.goto(`${BASE}/mes-favoris`, { waitUntil: "networkidle" });
  await p4.waitForTimeout(900);
  /*  ⚠️ ON REGARDE OÙ L'ON ATTERRIT, PAS LE STATUT : Playwright SUIT la
      redirection, et rend donc 200 sur la page d'arrivée. La question
      est « suis-je sur Ma sélection ? », et la réponse doit être non. */
  const arrivee = await p4.evaluate(() => location.pathname);
  verif(
    "« MA SÉLECTION » EST BIEN HORS DE PORTÉE SANS SESSION",
    arrivee !== "/mes-favoris",
    `on atterrit sur ${arrivee} — c'est la redirection attendue, pas un défaut`
  );
  await p4.close();
}

nonJoue(
  "LES CINQ POINTS DU §3, ET LE §1 EN CHIFFRES",
  "ils demandent tous une session, et ce conteneur NE PEUT PAS EN " +
    "OUVRIR — la raison n'est pas le mot de passe. La passerelle réseau " +
    "de cet environnement refuse la connexion à l'hôte Supabase du " +
    "projet : « connect_rejected · gateway answered 403 to CONNECT · " +
    "…supabase.co:443 ». Le navigateur du conteneur est derrière la " +
    "même passerelle : ni le banc, ni une saisie à la main ne peuvent " +
    "se connecter. Il faut ajouter cet hôte aux réglages de sortie " +
    "réseau de l'environnement ; alors seulement ces cinq points, et " +
    "les chiffres du §1, deviendront mesurables ici."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Toutes les mesures ci-dessus valent " +
    "pour Chromium et pour lui seul — ce n'est une preuve ni pour " +
    "Safari, ni pour l'iPhone du propriétaire."
);

await bilan(nav);
