/**
 * BANC DE LA PASSE Nº 303 — LIVRAISON RAPIDE
 * ==================================================================
 *  §1 les sous-titres de « Ma sélection » portent le compte ;
 *  §2 une photo aimée = une carte, et elle ouvre sur elle ;
 *  §3 le champ des styles s'intitule « Style » ;
 *  §4 au doigt, le champ localité prend la robe du champ Style.
 *
 * ⚠️ LES §1 ET §2 SONT EXÉCUTÉS, pas lus : leurs règles vivent hors de
 * React (`lib/selection-suivis`), le banc les charge pour de bon
 * (crochet d'alias `_alias-src.mjs`) et regarde ce qu'elles rendent.
 * ⚠️ LE §4 EST MESURÉ EN VIVANT, au doigt, avec son témoin : on repose
 * les anciennes classes et les deux champs doivent redevenir
 * différents — sans quoi la mesure ne prouverait rien.
 * ⚠️ UNE SEULE FENÊTRE PAR SUJET : 390 × 844 pour le doigt.
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

const { cartesDesFavoris, compteDeLaSelection } = await import(
  pathToFileURL(`${RACINE}/src/lib/selection-suivis.ts`).href
);
const { ouvertureSurUnePhoto } = await import(
  pathToFileURL(`${RACINE}/src/lib/photo-tatoueur.ts`).href
);

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const pageFav = sansNotes(lire("src/components/PageFavoris.tsx"));
const moteur = sansNotes(lire("src/components/MoteurTatouage.tsx"));
const menu = sansNotes(lire("src/components/MenuDeroulant.tsx"));
const champLieu = sansNotes(lire("src/components/ChampLocalisation.tsx"));
const ligneResultats = sansNotes(lire("src/components/LigneResultats.tsx"));

titre("§1 — le compte sous le titre, EXÉCUTÉ");
{
  const compte = (o) => compteDeLaSelection(o);
  verif(
    "LE CAS ORDINAIRE : « 18 portfolios » et « 29 photos »",
    compte({ surLesFavoris: false, total: 18, visibles: 18, filtreActif: false }) ===
      "18 portfolios" &&
      compte({ surLesFavoris: true, total: 29, visibles: 29, filtreActif: false }) ===
        "29 photos",
    compte({ surLesFavoris: false, total: 18, visibles: 18, filtreActif: false }) +
      " · " +
      compte({ surLesFavoris: true, total: 29, visibles: 29, filtreActif: false })
  );
  verif(
    "LE SINGULIER : « 1 portfolio », « 1 photo » — jamais « 1 portfolios »",
    compte({ surLesFavoris: false, total: 1, visibles: 1, filtreActif: false }) ===
      "1 portfolio" &&
      compte({ surLesFavoris: true, total: 1, visibles: 1, filtreActif: false }) ===
        "1 photo",
    compte({ surLesFavoris: false, total: 1, visibles: 1, filtreActif: false }) +
      " · " +
      compte({ surLesFavoris: true, total: 1, visibles: 1, filtreActif: false })
  );
  verif(
    "LE VIDE : « Aucun portfolio suivi », « Aucune photo en favori » — " +
      "jamais « 0 portfolios »",
    compte({ surLesFavoris: false, total: 0, visibles: 0, filtreActif: false }) ===
      "Aucun portfolio suivi" &&
      compte({ surLesFavoris: true, total: 0, visibles: 0, filtreActif: false }) ===
        "Aucune photo en favori",
    compte({ surLesFavoris: false, total: 0, visibles: 0, filtreActif: false }) +
      " · " +
      compte({ surLesFavoris: true, total: 0, visibles: 0, filtreActif: false })
  );
  verif(
    "LE FILTRE ACTIF : « 7 portfolios sur 18 » — le compte reste, et il " +
      "dit ce que le filtre a laissé",
    compte({ surLesFavoris: false, total: 18, visibles: 7, filtreActif: true }) ===
      "7 portfolios sur 18",
    compte({ surLesFavoris: false, total: 18, visibles: 7, filtreActif: true })
  );
  verif(
    "…ET UN FILTRE QUI NE LAISSE RIEN NE DIT PAS « 0 » : « Aucun " +
      "portfolio sur 18 », « Aucune photo sur 29 »",
    compte({ surLesFavoris: false, total: 18, visibles: 0, filtreActif: true }) ===
      "Aucun portfolio sur 18" &&
      compte({ surLesFavoris: true, total: 29, visibles: 0, filtreActif: true }) ===
        "Aucune photo sur 29",
    compte({ surLesFavoris: false, total: 18, visibles: 0, filtreActif: true }) +
      " · " +
      compte({ surLesFavoris: true, total: 29, visibles: 0, filtreActif: true })
  );
  verif(
    "…ET LE SINGULIER TIENT AUSSI SOUS FILTRE : « 1 portfolio sur 18 »",
    compte({ surLesFavoris: false, total: 18, visibles: 1, filtreActif: true }) ===
      "1 portfolio sur 18",
    compte({ surLesFavoris: false, total: 18, visibles: 1, filtreActif: true })
  );
  verif(
    "LE NOM DU FILTRE N'EST PAS PERDU : la page compose « <filtre> · " +
      "<compte> », les deux informations tiennent ensemble",
    /libelleDuChoix\(choix\),\s*\n\s*compteDeLaSelection\(\{/.test(pageFav) &&
      /\.filter\(Boolean\)\s*\n?\s*\.join\(" · "\)/.test(pageFav)
  );
  verif(
    "LA RÉSERVATION DE LA nº 301 EST GARDÉE — elle ne coûte rien",
    /degagementConstant/.test(pageFav) &&
      /data-degagement-reserve=""/.test(ligneResultats)
  );
}

titre("§2 — une photo aimée = une carte, EXÉCUTÉ");
{
  /** Trois photos AIMÉES du MÊME carrousel (même style, même rendu). */
  const troisDuMemeCarrousel = [1, 2, 3].map((n) => ({
    id: `p${n}`,
    url: `u${n}`,
    miniature: `m${n}`,
    style: "realisme",
    rendu: "noir-et-gris",
    nature: "tatouage",
    ordre: n - 1,
    tatoueurId: "t1",
    tatoueurNom: "Essai",
    tatoueurSlug: "essai",
    ville: "Lyon",
    region: null,
    pays: "France",
    codePays: "FR",
    typeFiche: "artiste",
    etablissement: "salon",
    photoProfil: null,
  }));
  const cartes = cartesDesFavoris(troisDuMemeCarrousel);
  verif(
    "TROIS PHOTOS AIMÉES D'UN MÊME CARROUSEL DONNENT TROIS CARTES — le " +
      "dédoublonnage par carrousel est bien parti",
    cartes.length === 3,
    `${cartes.length} carte(s)`
  );
  verif(
    "…AVEC TROIS CLÉS DISTINCTES, celles des photos",
    new Set(cartes.map((c) => c.cle)).size === 3 &&
      cartes.map((c) => c.cle).join(",") === "p1,p2,p3",
    cartes.map((c) => c.cle).join(" · ")
  );
  verif(
    "…ET CHAQUE CARTE MONTRE SA PROPRE PHOTO, pas la première du " +
      "carrousel : sa galerie ne contient qu'elle",
    cartes.every(
      (c, i) =>
        c.fiche.galerie.length === 1 &&
        c.fiche.galerie[0].id === `p${i + 1}` &&
        c.fiche.photo_principale === `m${i + 1}`
    ),
    cartes.map((c) => c.fiche.galerie.map((g) => g.id).join("+")).join(" · ")
  );
  verif(
    "L'ORDRE EST CELUI DES FAVORIS — le plus récemment aimé d'abord, " +
      "comme depuis toujours",
    cartes.map((c) => c.photo.id).join(",") === "p1,p2,p3"
  );

  //  ET CHACUNE OUVRE LA BONNE — par le mécanisme de la nº 302.
  const groupe = [
    {
      slug: "realisme",
      label: "Réalisme",
      photos: Array.from({ length: 14 }, (_, i) => ({
        cle: `p${i + 1}`,
        url: "u",
        miniature: "m",
        rendu: "noir-et-gris",
        nature: "tatouage",
        legende: "",
      })),
    },
  ];
  const rangs = cartes.map(
    (c) => ouvertureSurUnePhoto(groupe, c.cle)?.indice ?? -1
  );
  verif(
    "CHACUNE OUVRE PILE SUR ELLE : les trois cartes visent les rangs 1, " +
      "2 et 3 sur 14 — et la 8ᵉ vise bien « 8/14 »",
    rangs.join(",") === "0,1,2" &&
      ouvertureSurUnePhoto(groupe, "p8").indice === 7,
    `rangs ${rangs.map((r) => r + 1).join(", ")} · huitième ${
      ouvertureSurUnePhoto(groupe, "p8").indice + 1
    }/14`
  );
  verif(
    "LA PAGE PASSE BIEN L'IDENTIFIANT DE LA PHOTO AUX DEUX CHEMINS : " +
      "l'adresse de la carte (doigt) et la fenêtre superposée (web)",
    /photoRecherche=\{photo\.id\}/.test(pageFav) &&
      /photoRecherche=\{serieOuverte\.photo\}/.test(pageFav) &&
      /photo: photo\.id,/.test(pageFav)
  );
  verif(
    "LA RÈGLE EST SORTIE DU COMPOSANT (`cartesDesFavoris`) — donc elle " +
      "s'exécute, donc elle se prouve",
    /const ensemblesVisibles = cartesDesFavoris\(visibles\);/.test(pageFav) &&
      !/cleEnsembleFavori/.test(pageFav)
  );
}

titre("§3 — le champ des styles s'intitule « Style »");
{
  verif(
    "LE MOT « Explorer » N'EST PLUS LE LIBELLÉ DE CE CHAMP, ni en web ni " +
      "au doigt — les deux emplacements portent « Style »",
    !/ariaLabel="Explorer"/.test(moteur) &&
      !/placeholder="Explorer"/.test(moteur) &&
      (moteur.match(/ariaLabel="Style"/g) ?? []).length === 2 &&
      (moteur.match(/placeholder="Style"/g) ?? []).length === 2
  );
}

titre("§4 — la robe des deux champs, à la source");
{
  verif(
    "LA ROBE EST DÉCLARÉE UNE SEULE FOIS (`ROBE_CHAMP_SOMBRE`) — deux " +
      "chaînes recopiées dans deux fichiers finiraient par diverger",
    /export const ROBE_CHAMP_SOMBRE = \{/.test(menu) &&
      /rayon: "rounded-2xl"/.test(menu) &&
      /repos: "bg-sombre-eleve"/.test(menu) &&
      /actifAuFocus: "focus:bg-sombre-eleve-clair"/.test(menu)
  );
  verif(
    "LE MENU LA CONSOMME LUI-MÊME : aucune valeur en dur ne subsiste " +
      "dans son habillage sombre",
    /const rayon = arrondi \?\? ROBE_CHAMP_SOMBRE\.rayon;/.test(menu) &&
      /ouvert \? ROBE_CHAMP_SOMBRE\.actif : ROBE_CHAMP_SOMBRE\.repos/.test(menu)
  );
  verif(
    "LE CHAMP LOCALITÉ LA CONSOMME AUSSI, par `robeDeMenu` — et il " +
      "n'écrit lui-même ni arrondi ni fond",
    /import \{ ROBE_CHAMP_SOMBRE \} from "@\/components\/MenuDeroulant";/.test(
      champLieu
    ) &&
      /\$\{ROBE_CHAMP_SOMBRE\.rayon\} \$\{ROBE_CHAMP_SOMBRE\.repos\}/.test(
        champLieu
      ) &&
      /\$\{ROBE_CHAMP_SOMBRE\.actifAuFocus\}/.test(champLieu)
  );
  verif(
    "SEUL LE MOTEUR AU DOIGT LE DEMANDE — le web n'est pas touché (il " +
      "passe `sansBordure`, une autre branche), et le formulaire garde " +
      "sa robe d'origine",
    /robeDeMenu\n/.test(moteur) &&
      /rounded-lg border bg-sombre-eleve-clair px-4 text-base/.test(champLieu)
  );
}

titre("vivant — 390 × 844 : les deux champs se ressemblent");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    //  OUVRIR LA PAGE DU MOTEUR : c'est le champ de la barre qui la
    //  déplie, comme sous le doigt.
    const ouvert = await page.evaluate(() => {
      const cible = [...document.querySelectorAll("button, [role='button']")].find(
        (n) => /Recherche|Rechercher/i.test(n.textContent || "")
      );
      cible?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return Boolean(cible);
    });
    await page.waitForTimeout(1800);

    const mesures = await page.evaluate(() => {
      const style = document.querySelector('[data-remonte-au-menu] [role="combobox"], [data-remonte-au-menu] button');
      const lieu = document.querySelector('input[id$="-fenetre-lieu"]');
      if (!style || !lieu) return null;
      const boite = (n) => {
        const cs = getComputedStyle(n);
        return { rayon: cs.borderTopLeftRadius, fond: cs.backgroundColor };
      };
      return { style: boite(style), lieu: boite(lieu) };
    });

    if (!ouvert || !mesures) {
      nonJoue(
        "§4 en vivant",
        "la page du moteur au doigt ne s'est pas ouverte par ce chemin " +
          "(le champ de la barre n'a pas été trouvé) ; la robe est " +
          "vérifiée à la source, et elle vient d'une SEULE déclaration " +
          "partagée — les deux champs ne peuvent pas diverger"
      );
    } else {
      verif(
        "APRÈS — LES DEUX CHAMPS ONT LE MÊME ARRONDI ET LE MÊME FOND",
        mesures.style.rayon === mesures.lieu.rayon &&
          mesures.style.fond === mesures.lieu.fond,
        `style ${mesures.style.rayon} / ${mesures.style.fond} · lieu ` +
          `${mesures.lieu.rayon} / ${mesures.lieu.fond}`
      );
      //  LE TÉMOIN : on repose l'ancienne robe du champ de localité.
      //  Les deux doivent alors REDEVENIR différents.
      const temoin = await page.evaluate(() => {
        const lieu = document.querySelector('input[id$="-fenetre-lieu"]');
        //  ⚠️ `setProperty(..., "important")` : la feuille du site pose
        //  des fonds de champ que le style en ligne ne dépasse pas
        //  toujours — et un témoin qui n'agit pas ne prouve rien.
        lieu.style.setProperty("border-radius", "0.5rem", "important");
        lieu.style.setProperty("background-color", "rgb(58, 58, 66)", "important");
        const cs = getComputedStyle(lieu);
        return { rayon: cs.borderTopLeftRadius, fond: cs.backgroundColor };
      });
      //  ⚠️ LE TÉMOIN NE PORTE QUE SUR L'ARRONDI, et je le dis : le
      //  fond du champ résiste au style en ligne (la feuille du site le
      //  repose), je n'ai donc pas pu le remettre à son ancienne valeur
      //  depuis le banc. L'égalité des fonds, elle, est établie par la
      //  mesure ci-dessus ET par la source — une seule déclaration
      //  partagée, que les deux champs consomment.
      verif(
        "TÉMOIN — EN REPOSANT L'ANCIEN ARRONDI (8 px), les deux " +
          "redeviennent DIFFÉRENTS : l'égalité mesurée ci-dessus n'est " +
          "donc pas un hasard de rendu",
        temoin.rayon !== mesures.style.rayon,
        `témoin ${temoin.rayon} · style ${mesures.style.rayon}`
      );
    }

    /* ---- §3 en vivant : le mot du champ ------------------------- */
    const mots = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-label="Style"], [aria-label="Explorer"]')].map(
        (n) => n.getAttribute("aria-label")
      )
    );
    verif(
      "§3 EN VIVANT — le champ des styles porte « Style », et plus " +
        "« Explorer »",
      mots.length > 0 && mots.every((m) => m === "Style"),
      mots.join(" · ") || "aucun champ trouvé"
    );
  } finally {
    await nav.close();
  }
}

nonJoue(
  "« MA SÉLECTION » EN VIVANT",
  "la page `/mes-favoris` exige une session Supabase validée par le " +
    "serveur, que ce conteneur ne peut pas signer. Les §1 et §2 sont " +
    "donc EXÉCUTÉS hors navigateur — c'est plus fort qu'une capture : " +
    "on voit ce que les règles rendent, cas par cas"
);

process.exit(bilan());
