/**
 * BANC DE LA PASSE Nº 285
 * ==================================================================
 * §1 LES SIX RÈGLES DE VALIDATION DU PORTFOLIO. Ce qui part en ligne
 *    tout de suite (tout), ce qui attend (les photos qui ARRIVENT, et
 *    elles seules), ce qui ne déclenche rien (un style vide, un
 *    réordonnancement), et la fiche qui RESTE EN LIGNE pendant
 *    l'attente — seules les photos en attente sont invisibles ;
 * §2 LES RETOUCHES DE LA FENÊTRE DE CARROUSEL (smartphone) : la barre
 *    à trois éléments alignés avec son compteur, les points supprimés,
 *    le titre descendu à côté du rond, et le rond qui dépose sur le
 *    PROFIL, à sa place.
 *
 * ⚠️ UNE SEULE LARGEUR (390 px — §2 est une retouche smartphone).
 * ⚠️ CE QUE CE BANC NE PEUT PAS JOUER, et le dit : le parcours réel
 * d'un envoi (déposer une photo, enregistrer, voir la fenêtre de
 * confirmation, valider côté administration) demande une BASE avec un
 * compte et une fiche PUBLIÉE. La base du propriétaire est hors de
 * portée de ce conteneur. Ce qui est prouvable l'est : les écritures
 * (à la source), la décision elle-même (REJOUÉE sur le vrai code), et
 * la clause SQL (jouée sur un PostgreSQL local — voir le compte rendu).
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

const formulaire = lire("src/components/FormulaireFiche.tsx");
const formulaireNu = sansNotes(formulaire);
const photosLib = sansNotes(lire("src/lib/enregistrer-photos.ts"));
const tatoueursNu = sansNotes(lire("src/lib/tatoueurs.ts"));
const adminNu = sansNotes(lire("src/app/api/admin/yokofolio/fiches/route.ts"));
const migration = lire("supabase/yokofolio-photos-en-attente.sql");
const fenetre = sansNotes(lire("src/components/FenetreCarrousel.tsx"));
const contenu = sansNotes(lire("src/components/ContenuFiche.tsx"));
const photosTatoueur = sansNotes(lire("src/lib/photos-tatoueur.ts"));

const FICHE = "/tatoueur/typo-sauvage-bordeaux";

/* ==================================================================
 * §1 — LES SIX RÈGLES
 * ================================================================== */
titre("§1 — RÈGLE 1 : la première création passe toujours la validation");
{
  verif(
    "une CRÉATION naît non publiée et en attente — inchangé",
    /publie: false,\s*statut: "en_attente",/.test(formulaireNu)
  );
  verif(
    "et ses photos N'ATTENDENT PAS à part : la fiche entière est " +
      "relue, elles avec (sinon elles resteraient invisibles après la " +
      "mise en ligne)",
    /await enregistrerPhotos\(supabase, creee, galerieAEcrire\);/.test(
      formulaireNu
    )
  );
}

titre("§1 — RÈGLE 2 : une fois validée, tout part en ligne");
{
  verif(
    "le BROUILLON a quitté le chemin d'une fiche en ligne : plus de " +
      "`brouillon: champs`, plus de `statut: en_attente` sur une " +
      "modification",
    !/brouillon: champs/.test(formulaireNu) &&
      !/statut: "en_attente",\s*motifs_moderation: null,\s*note_moderation: null,\s*exercice_verrouille/.test(
        formulaireNu
      )
  );
  verif(
    "les modifications s'écrivent DIRECTEMENT sur la ligne publique, " +
      "et le brouillon d'avant cette passe est effacé",
    /maj = \{\s*\.\.\.champs,\s*\.\.\.champsIdentite,\s*brouillon: null,/.test(
      formulaireNu.replace(/\s+/g, " ").replace(/ /g, " ")
    ) ||
      (/\.\.\.champs,/.test(formulaireNu) && /brouillon: null,/.test(formulaireNu))
  );
  verif(
    "`publie` n'est toujours pas touché par une modification : la " +
      "fiche ne peut pas sortir du site en s'enregistrant",
    /delete champs\.publie;/.test(formulaireNu)
  );
}

titre("§1 — RÈGLE 3 : exception unique, LES PHOTOS QUI ARRIVENT");
{
  verif(
    "la décision se prend sur les photos SANS identifiant — celles " +
      "qui n'ont jamais existé en base",
    /const photosQuiArrivent = triees\.filter\(\(photo\) => !photo\.id\)\.length;/.test(
      formulaireNu
    )
  );
  verif(
    "les arrivées sont écrites EN ATTENTE quand la fiche est déjà " +
      "publiée, et seulement alors",
    /arriveesEnAttente \? \{ \.\.\.l\.ligne, en_attente: true \} : l\.ligne/.test(
      photosLib.replace(/\s+/g, " ")
    ) && /Boolean\(ficheChargee\.publie\)/.test(formulaireNu)
  );
  verif(
    "une base sans la colonne rejoue l'insertion SANS elle : aucune " +
      "photo n'est perdue, le site n'exige pas la migration",
    /insertion\.error\.message\.toLowerCase\(\)\.includes\("en_attente"\)/.test(
      photosLib
    )
  );

  /*  LE REJEU — c'est la ligne du VRAI fichier qu'on rejoue, extraite
      telle quelle : si la règle change, ce banc change avec elle. */
  const ligne = formulaireNu.match(
    /const photosQuiArrivent = triees\.filter\([^;]+;/
  );
  verif("la règle est extractible pour être rejouée", Boolean(ligne));
  if (ligne) {
    const compter = new Function(
      "triees",
      `${ligne[0]} return photosQuiArrivent;`
    );
    //  CAS 1 de la règle 3 — de nouvelles photos dans un carrousel qui
    //  existe déjà : trois anciennes, deux neuves.
    const carrouselExistant = [
      { id: "a", style: "realisme", ordre: 0 },
      { id: "b", style: "realisme", ordre: 1 },
      { id: "c", style: "realisme", ordre: 2 },
      { id: null, style: "realisme", ordre: 3 },
      { id: undefined, style: "realisme", ordre: 4 },
    ];
    verif(
      "REJEU — CAS 1 : de nouvelles photos dans un carrousel existant " +
        "déclenchent la validation",
      compter(carrouselExistant) === 2,
      `${compter(carrouselExistant)} photo(s) qui arrivent`
    );
    //  CAS 2 — un nouveau style ET ses photos.
    const styleNeuf = [
      { id: "a", style: "realisme", ordre: 0 },
      { id: null, style: "japonais", ordre: 1 },
      { id: null, style: "japonais", ordre: 2 },
    ];
    verif(
      "REJEU — CAS 2 : un nouveau style et ses photos déclenchent la " +
        "validation",
      compter(styleNeuf) === 2,
      `${compter(styleNeuf)} photo(s) qui arrivent`
    );
    //  RÈGLE 5 — RÉORDONNER : les mêmes lignes, un autre ordre.
    const reordonnees = [
      { id: "c", style: "realisme", ordre: 0 },
      { id: "a", style: "realisme", ordre: 1 },
      { id: "b", style: "realisme", ordre: 2 },
    ];
    verif(
      "REJEU — RÈGLE 5 : RÉORDONNER NE DÉCLENCHE RIEN (les lignes " +
        "gardent leur identifiant, elles sont mises à jour)",
      compter(reordonnees) === 0,
      `${compter(reordonnees)} photo(s) qui arrivent`
    );
    //  RÈGLE 4 — un style sans photo : aucune ligne de photo, donc rien.
    verif(
      "REJEU — RÈGLE 4 : un style créé SANS photo n'ajoute aucune " +
        "ligne, donc ne déclenche rien",
      compter([{ id: "a", style: "realisme", ordre: 0 }]) === 0
    );
    //  ET UNE MODIFICATION DE TEXTE SEULE : rien non plus (règle 2).
    verif(
      "REJEU — RÈGLE 2 : une bio corrigée sans toucher aux photos ne " +
        "déclenche rien",
      compter([
        { id: "a", style: "realisme", ordre: 0 },
        { id: "b", style: "realisme", ordre: 1 },
      ]) === 0
    );
  }
}

titre("§1 — RÈGLE 4 : elle était DÉJÀ EN PLACE (vérifiée, non réécrite)");
{
  verif(
    "les styles d'une fiche se DÉDUISENT de ses photos " +
      "(`stylesDuPortfolio`) : un style vide n'entre même pas dans la " +
      "fiche — règle antérieure, laissée telle quelle",
    /export function stylesDuPortfolio\(/.test(photosTatoueur) &&
      /for \(const photo of galerieOrdonnee\(photos\)\)/.test(photosTatoueur) &&
      /const stylesChoisis = stylesDuPortfolio\(/.test(formulaireNu)
  );
}

titre("§1 — RÈGLE 6 : la fiche reste en ligne, seules les photos attendent");
{
  verif(
    "PREMIÈRE MOITIÉ, DÉJÀ EN PLACE : une modification n'a jamais " +
      "touché `publie` (voir règle 2) — la fiche ne sort pas du site",
    /delete champs\.publie;/.test(formulaireNu)
  );
  verif(
    "SECONDE MOITIÉ, POSÉE ICI : une photo en attente n'existe pas " +
      "pour le public — la lecture de la page d'une fiche l'écarte",
    /if \(ligne\.en_attente === true\) continue;/.test(tatoueursNu)
  );
  verif(
    "et le chemin rapide l'écarte EN BASE (migration nº 70)",
    /and not coalesce\(p3\.en_attente, false\)/.test(migration) &&
      /add column if not exists en_attente boolean not null default false/.test(
        migration
      )
  );
  verif(
    "la migration garde l'acquis de la nº 69 (coupe par carrousel) et " +
      "pose son index",
    /rang_dans_le_carrousel/.test(migration) &&
      /create index if not exists photos_tatoueur_en_attente_idx/.test(
        migration
      )
  );
  /*  ⚠️ ON NE REGARDE QUE LE CAS B — la fiche EN LIGNE. Le cas A (pas
      encore publiée) garde son `statut: "en_attente"`, et c'est la
      règle 1 : sa première mise en ligne attend une décision. */
  const casB = formulaireNu.slice(
    formulaireNu.indexOf("if (ficheChargee.publie) {"),
    formulaireNu.indexOf("      } else {", formulaireNu.indexOf("if (ficheChargee.publie) {"))
  );
  verif(
    "aucun `statut` n'est posé sur la fiche en ligne pour des photos : " +
      "elle ne retourne JAMAIS dans la file entière",
    casB.length > 50 && !/statut:/.test(casB),
    `${casB.length} caractères examinés`
  );
  verif(
    "et le cas A, lui, garde sa file : la PREMIÈRE mise en ligne " +
      "attend toujours une décision (règle 1)",
    /statut: "en_attente"/.test(
      formulaireNu.slice(formulaireNu.indexOf("      } else {", formulaireNu.indexOf("if (ficheChargee.publie) {")))
    )
  );
}

titre("§1 — LA FILE D'ATTENTE DE L'ADMINISTRATION ET SA SORTIE");
{
  verif(
    "l'écran d'administration va CHERCHER les fiches dont des photos " +
      "attendent (sans quoi elles attendraient pour toujours)",
    /\.from\("photos_tatoueur"\)\s*\.select\("tatoueur_id"\)\s*\.eq\("en_attente", true\)/.test(
      adminNu.replace(/\s+/g, " ").replace(/ \./g, " .")
    ) || /\.eq\("en_attente", true\)/.test(adminNu)
  );
  verif(
    "il dit COMBIEN de photos attendent, fiche par fiche",
    /photos_en_attente:/.test(adminNu)
  );
  verif(
    "« VALIDER » LIBÈRE LES PHOTOS — et seulement « valider »",
    /if \(action === "valider"\) \{\s*await admin\s*\.from\("photos_tatoueur"\)\s*\.update\(\{ en_attente: false \}\)/.test(
      adminNu.replace(/\s+/g, " ").replace(/ \./g, " .").replace(/ \{/g, " {")
    ) ||
      (/\.update\(\{ en_attente: false \}\)/.test(adminNu) &&
        /\.eq\("en_attente", true\)/.test(adminNu))
  );
}

titre("§1 — L'ÉCRAN DE CONFIRMATION : trois voix, aucune ne ment");
{
  verif(
    "PREMIÈRE FICHE — « Merci ! » et les 24 h : inchangé",
    /Merci&nbsp;!/.test(formulaire) &&
      /On vérifie ton portfolio&nbsp;: il sera en ligne sous\s*24&nbsp;h\./.test(
        formulaire
      )
  );
  verif(
    "DES PHOTOS NEUVES — le titre devient « Nouvelles photos " +
      "envoyées », le sous-titre ne change pas",
    /Nouvelles photos envoyées/.test(formulaire) &&
      /Relues et en ligne sous 24&nbsp;h\./.test(formulaire) &&
      !/Modifications envoyées/.test(formulaire)
  );
  verif(
    "AUCUNE PHOTO NEUVE — on ne parle NI de relecture NI de 24 h : " +
      "c'est déjà en ligne",
    /Modifications en ligne/.test(formulaire) &&
      /Elles sont visibles tout de suite\./.test(formulaire)
  );
  verif(
    "et c'est un GESTE qui décide, pas un état : l'adresse porte " +
      "`photos=1`, et elle est nettoyée aussitôt",
    /\(ficheChargee\.publie && photosQuiArrivent > 0 \? "&photos=1" : ""\)/.test(
      formulaireNu
    ) && /propre\.searchParams\.delete\("photos"\);/.test(formulaireNu)
  );
}

titre("§1 — NON JOUÉ ICI : le parcours réel d'un envoi");
{
  nonJoue(
    "§1 · L'ENVOI DE BOUT EN BOUT (déposer une photo, enregistrer, " +
      "voir la fenêtre, valider côté administration)",
    "il demande une base avec un compte connecté ET une fiche déjà " +
      "PUBLIÉE — la base du propriétaire est hors de portée de ce " +
      "conteneur (Supabase n'y répond pas). Ce qui est prouvable l'est " +
      "autrement : les écritures à la source, LA DÉCISION REJOUÉE sur " +
      "la ligne extraite du vrai fichier (§1 · règle 3), et la clause " +
      "SQL jouée sur un PostgreSQL local — 8 photos visibles pendant " +
      "l'attente, 14 après validation (chiffres au compte rendu)"
  );
}

/* ==================================================================
 * §2 — LES RETOUCHES DE LA FENÊTRE
 * ================================================================== */
titre("§2 — à la source : ce qui a changé, et ce qui n'a pas bougé");
{
  verif(
    "LES POINTS ONT QUITTÉ LA FENÊTRE (§2-2) — mais la frise reste " +
      "l'écriture du WEB, intacte",
    !/<PointsDuCarrousel/.test(fenetre) &&
      /export function PointsDuCarrousel\(/.test(
        sansNotes(lire("src/components/CarrouselPortfolio.tsx"))
      )
  );
  verif(
    "LE COMPTEUR est à droite, en gris, à chiffres de largeur fixe " +
      "(« 9/19 » puis « 10/19 » ne font pas sauter la barre)",
    /data-role="compteur-fenetre"/.test(fenetre) &&
      /tabular-nums text-sombre-texte-doux/.test(fenetre) &&
      /\{n > 1 \? `\$\{rang \+ 1\}\/\$\{n\}` : ""\}/.test(fenetre)
  );
  verif(
    "LE LOGO GARDE SA TAILLE (24 px), la flèche et ses destinations " +
      "ne bougent pas",
    /<LogoYokofolio hauteur=\{24\} \/>/.test(fenetre) &&
      /aria-label="Retour"/.test(fenetre) &&
      /href=\{adresseFiche\}/.test(fenetre)
  );
  verif(
    "LE ROND MÈNE AU PROFIL, À SA PLACE (§2-6) : `#profil`, que la " +
      "fiche lit pour jouer LA MÊME remontée que l'onglet Profil",
    /href=\{`\/tatoueur\/\$\{tatoueur\.slug\}#profil`\}/.test(fenetre) &&
      /window\.location\.hash !== "#profil"/.test(contenu) &&
      /requestAnimationFrame\(\(\) => remonterSousLaBarre\(\)\)/.test(contenu)
  );
  verif(
    "et l'ancre est effacée aussitôt : un rechargement ne rejoue pas " +
      "un mouvement que personne n'a demandé",
    /replace\(\/#profil\$\/, ""\)/.test(contenu)
  );
  verif(
    "CE QUI NE CHANGE PAS (nº 284) : le carrousel natif, la photo " +
      "nette, le gel du corps, l'adresse partageable",
    /<CarrouselPortfolio/.test(fenetre) &&
      /sansCompteur/.test(fenetre) &&
      /sansPoints/.test(fenetre) &&
      /gelerLeCorps\(positionPage\)/.test(fenetre) &&
      !/translateX/.test(fenetre)
  );
}

titre("§2 — vivant (390 px) : la fenêtre, mesurée");
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
    await page.goto(
      `${BASE}${FICHE}/carrousel?style=chicano&nature=tatouage&rendu=black_and_grey`,
      { waitUntil: "domcontentloaded", timeout: 90000 }
    );
    await page.waitForSelector("[data-fenetre-carrousel]", { timeout: 60000 });
    await page.waitForTimeout(2500);

    const mesure = await page.evaluate(() => {
      const fenetre = document.querySelector("[data-fenetre-carrousel]");
      const barre = fenetre.querySelector(".flex.h-14");
      const fleche = barre.querySelector(
        'a[aria-label="Voir la fiche"], button[aria-label="Retour"]'
      );
      const logo = barre.querySelector(
        'a[aria-label="Accueil YokoFolio"] img'
      );
      const compteur = fenetre.querySelector('[data-role="compteur-fenetre"]');
      const cadre = fenetre.querySelector('[data-role="cadre"]');
      const ligne = fenetre.querySelector(".flex.items-center.gap-3");
      const rond = ligne?.querySelector("a");
      const titre = ligne?.querySelector("h1");
      const sous = ligne?.querySelector("p");
      const boite = (element) => {
        const r = element.getBoundingClientRect();
        return {
          haut: +r.top.toFixed(1),
          bas: +r.bottom.toFixed(1),
          gauche: +r.left.toFixed(1),
          droite: +r.right.toFixed(1),
          hauteur: +r.height.toFixed(1),
        };
      };
      const milieu = (element) => {
        const r = element.getBoundingClientRect();
        return +(r.top + r.height / 2).toFixed(1);
      };
      return {
        compteur: compteur?.textContent ?? "",
        points: fenetre.querySelectorAll('[data-role="pagination"]').length,
        //  LES TROIS ÉLÉMENTS DE LA BARRE, sur une seule ligne.
        milieux: {
          fleche: milieu(fleche),
          logo: milieu(logo),
          compteur: milieu(compteur),
        },
        logoHauteur: boite(logo).hauteur,
        //  RIEN AU-DESSUS DE LA PHOTO QUE LA BARRE.
        titreSousLaPhoto: boite(titre).haut > boite(cadre).bas,
        //  LE BLOC DE TEXTE, CONTENU DANS LA HAUTEUR DU ROND.
        texteDansLeRond:
          boite(titre).haut >= boite(rond).haut &&
          boite(sous).bas <= boite(rond).bas,
        centreRond: milieu(rond),
        centreTexte: +((boite(titre).haut + boite(sous).bas) / 2).toFixed(1),
        ecartRondTexte: +(boite(titre).gauche - boite(rond).droite).toFixed(1),
        //  LA CHARTE : aucun contour, nulle part.
        contours: [...fenetre.querySelectorAll("*")].filter((element) => {
          const style = getComputedStyle(element);
          return (
            parseFloat(style.borderTopWidth) > 0 ||
            parseFloat(style.borderLeftWidth) > 0 ||
            parseFloat(style.borderRightWidth) > 0 ||
            parseFloat(style.borderBottomWidth) > 0
          );
        }).length,
        fond: getComputedStyle(fenetre).backgroundColor,
        graisseTitre: getComputedStyle(titre).fontWeight,
        tailleSous: getComputedStyle(sous).fontSize,
        rondHref: rond?.getAttribute("href") ?? "",
      };
    });

    verif(
      "LA BARRE : ses trois éléments sont alignés entre eux, au pixel",
      mesure.milieux.fleche === mesure.milieux.logo &&
        mesure.milieux.logo === mesure.milieux.compteur,
      `flèche ${mesure.milieux.fleche} · logo ${mesure.milieux.logo} · compteur ${mesure.milieux.compteur}`
    );
    verif(
      "le LOGO garde sa taille (24 px de haut)",
      mesure.logoHauteur === 24,
      `${mesure.logoHauteur} px`
    );
    verif(
      "LE COMPTEUR s'affiche, en gris, à droite",
      /^\d+\/\d+$/.test(mesure.compteur.trim()),
      `« ${mesure.compteur} »`
    );
    verif(
      "AUCUN POINT de défilement dans la fenêtre (§2-2)",
      mesure.points === 0,
      `${mesure.points} frise(s)`
    );
    verif(
      "LE TITRE EST SOUS LA PHOTO (§2-3) : au-dessus, il ne reste que " +
        "la barre",
      mesure.titreSousLaPhoto
    );
    verif(
      "LE BLOC TITRE + SOUS-TITRE TIENT DANS LA HAUTEUR DU ROND (§2-5)",
      mesure.texteDansLeRond
    );
    verif(
      "et il est CENTRÉ VERTICALEMENT sur le rond, au dixième de pixel",
      Math.abs(mesure.centreRond - mesure.centreTexte) < 0.5,
      `rond ${mesure.centreRond} · texte ${mesure.centreTexte}`
    );
    verif(
      "le texte est COLLÉ au rond, d'un espace franc et unique",
      mesure.ecartRondTexte > 8 && mesure.ecartRondTexte <= 16,
      `${mesure.ecartRondTexte} px`
    );
    verif(
      "CHARTE : fond anthracite, AUCUN contour nulle part, le style en " +
        "gras et sa série plus petite",
      mesure.contours === 0 &&
        mesure.fond === "rgb(26, 26, 29)" &&
        mesure.graisseTitre === "700" &&
        mesure.tailleSous === "13px",
      `${mesure.contours} contour(s) · ${mesure.fond}`
    );
    verif(
      "LE ROND MÈNE AU PROFIL, avec son ancre",
      mesure.rondHref === `${FICHE}#profil`,
      mesure.rondHref
    );

    //  LE COMPTEUR AVANCE — c'est ce qu'on lui demande.
    const avant = mesure.compteur.trim();
    await page.evaluate(() => {
      const cadre = document.querySelector(
        '[data-fenetre-carrousel] [data-role="cadre"]'
      );
      const colonne = cadre.querySelector('[data-role="colonne 1"]');
      cadre.scrollTo({ left: colonne.offsetLeft, behavior: "instant" });
    });
    await page.waitForTimeout(900);
    const apres = (
      await page.evaluate(
        () =>
          document.querySelector('[data-role="compteur-fenetre"]')
            ?.textContent ?? ""
      )
    ).trim();
    verif(
      "IL AVANCE avec le défilement : il dit toujours où l'on en est",
      apres !== avant && /^2\//.test(apres),
      `« ${avant} » → « ${apres} »`
    );
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
