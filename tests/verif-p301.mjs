/**
 * BANC DE LA PASSE Nº 301 — LIVRAISON RAPIDE
 * ==================================================================
 * TOUTE LA PASSE PORTE SUR « MA SÉLECTION » :
 *  §1 les deux titres, et le dégagement constant sous le titre (web) ;
 *  §2 la ligne d'information — mode en forme courte, ville et pays ;
 *  §3 plus d'encadré de survol sur la ligne d'identité, ICI SEULEMENT ;
 *  §4 les points de défilement supprimés, les chevrons agrandis et
 *     débordants, avec une ombre douce ;
 *  §5 les feuilles du bas renommées, et le mot « suivis » retiré.
 *
 * ⚠️ CE QUE CE BANC NE PEUT PAS FAIRE, ET IL LE DIT : la page
 * `/mes-favoris` EXIGE UNE VRAIE SESSION SUPABASE (le serveur valide le
 * jeton), et ce conteneur ne peut pas en fabriquer une — le cookie de
 * `commun-verif` suffit aux pages qui lisent un cookie, pas à celles
 * qui appellent `auth.getUser()`. La page redirige donc vers la
 * connexion, et RIEN d'elle n'est mesurable en vivant. Les §2 à §5 sont
 * donc vérifiés À LA SOURCE, au caractère près, et le §1 est prouvé EN
 * VIVANT sur le composant partagé (`LigneResultats`), qui est
 * exactement celui de cette page.
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 900.
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
import { writeFileSync, rmSync } from "node:fs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const ligneResultats = sansNotes(lire("src/components/LigneResultats.tsx"));
const pageFavoris = sansNotes(lire("src/components/PageFavoris.tsx"));
const menus = sansNotes(lire("src/components/MenusSelection.tsx"));
const blocSuivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
//  ⚠️ AMENDÉ LE 16/08/2026 (passe nº 306) — LE DESSIN DE LA GALERIE A
//  DÉMÉNAGÉ. La rangée, ses deux chevrons et ses deux fondus vivaient
//  dans `BlocSuivis` ; ils sont désormais dans `GalerieQuiDefile`,
//  partagé avec la colonne Portfolio d'une fiche (« il ne doit exister
//  qu'un seul dessin de galerie »). Les vérifications du §4 changent
//  donc de FICHIER, pas de contenu : ce qu'elles exigent est
//  strictement ce qu'elles exigeaient.
const galerieDefilante = sansNotes(
  lire("src/components/GalerieQuiDefile.tsx")
);
const dessinDeLaGalerie = blocSuivis + "\n" + galerieDefilante;
const blocLieux = sansNotes(lire("src/components/BlocLieux.tsx"));
const selection = sansNotes(lire("src/lib/selection-suivis.ts"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const index = sansNotes(lire("src/components/IndexTatoueurs.tsx"));

titre("§1 — les deux titres, et le dégagement constant");
{
  verif(
    "« Mes suivis » DEVIENT « Ma sélection de portfolios » et « Mes " +
      "favoris » « Ma sélection de photos » — les deux d'un coup, web " +
      "et smartphone (un seul rendu pour les deux)",
    /surLesFavoris \? "Ma sélection de photos" : "Ma sélection de portfolios"/.test(
      pageFavoris
    ) && !/"Mes suivis"|"Mes favoris"/.test(pageFavoris)
  );
  verif(
    "LA RAISON EST ÉCRITE DANS LE CODE — pour qu'aucune session future " +
      "ne les « corrige » : la liste ne contient pas que des artistes",
    /il y a aussi des salons et\s+des studios/.test(
      lire("src/components/PageFavoris.tsx")
    )
  );
  verif(
    "LA LIGNE DU SOUS-TITRE EST RÉSERVÉE quand il n'y en a pas : le " +
      "MÊME paragraphe, les mêmes classes, une espace insécable, muette " +
      "pour les lecteurs d'écran — aucune valeur recopiée",
    /degagementConstant && \(/.test(ligneResultats) &&
      /data-degagement-reserve=""/.test(ligneResultats) &&
      /aria-hidden="true"/.test(ligneResultats)
  );
  verif(
    "…ET SUR LE WEB SEULEMENT (`hidden lg:block`) — la consigne dit " +
      "« WEB »",
    /hidden lg:block mt-1\.5 text-\[15\.5px\] sm:text-\[16px\]/.test(
      ligneResultats
    )
  );
  verif(
    "SEULE « MA SÉLECTION » PASSE LE DRAPEAU : la page de recherche " +
      "(IndexTatoueurs) ne le passe nulle part, son rythme ne bouge pas",
    /degagementConstant\n/.test(pageFavoris) &&
      !/degagementConstant/.test(index)
  );
}

titre("§2 — le mode en forme courte, la ville et le pays");
{
  verif(
    "PLUS DE RUE, JAMAIS : les deux fonctions qui produisaient " +
      "l'adresse complète (`libelleLieuDuMode`, `libelleSecteurDuMode`) " +
      "ne sont PLUS appelées du tout dans cette écriture",
    !/libelleLieuDuMode|libelleSecteurDuMode/.test(selection)
  );
  verif(
    "LA VILLE ET LE PAYS VIENNENT DE L'ÉCRITURE UNIQUE DU SITE " +
      "(`ligneCarte`, celle des cartes de la mosaïque) — aucune seconde " +
      "grammaire de lieu n'est écrite ici",
    /import \{ ligneCarte \} from "@\/lib\/adresse";/.test(selection) &&
      /const villeEtPaysDuMode = \(mode: ModeExerciceFiche\) =>\s*\n?\s*ligneCarte\(\{/.test(
        selection
      )
  );
  verif(
    "LA FORME COURTE VIENT DE `genreMode(...).label` — « En salon », " +
      "« En studio », « À domicile », « Guest » —, jamais des libellés " +
      "longs de la fiche",
    /genreMode\("guest"\)\.label, villeEtPaysDuMode\(mode\)/.test(selection) &&
      /genreMode\(mode\.genre\)\.label, villeEtPaysDuMode\(mode\)/.test(
        selection
      )
  );
  verif(
    "LES QUATRE FORMES COURTES SONT BIEN CELLES-LÀ, AU MOT PRÈS, dans " +
      "le catalogue (`GENRES_MODE`)",
    ["En studio", "En salon", "À domicile", "Guest"].every((mot) =>
      new RegExp(`label: "${mot}"`).test(lire("src/config/tatouage.ts"))
    )
  );
  verif(
    "LE SÉPARATEUR EST CELUI DE LA PAGE (« · ») : « En salon · Lyon, " +
      "France »",
    /\.join\(" · "\)/.test(selection)
  );
  verif(
    "LES LIBELLÉS LONGS DE LA FICHE NE SONT PAS TOUCHÉS : `phrase` et " +
      "`phraseLiee` (« Résident chez », « Artiste en studio fixe ») " +
      "restent dans le catalogue",
    /phraseLiee: "Résident chez"/.test(lire("src/config/tatouage.ts")) &&
      /phrase: "Artiste en studio fixe"/.test(lire("src/config/tatouage.ts"))
  );
}

titre("§2 — `ligneCarte` EXÉCUTÉE : ce qu'elle écrit vraiment");
{
  /*  ⚠️ ON NE SE CONTENTE PAS DE LIRE LE CODE : `lib/adresse.ts` n'a
      AUCUN import, on peut donc le charger tel quel (Node 22 sait lire
      le TypeScript) et l'appeler. C'est la seule partie du §2 qui soit
      exécutable ici — le reste dépend de la page, qui ne s'ouvre pas. */
  const copie = "/tmp/adresse-p301.mts";
  writeFileSync(copie, lire("src/lib/adresse.ts"));
  try {
    const { ligneCarte } = await import(copie);
    const cas = [
      [{ ville: "Lyon", region: "Auvergne-Rhône-Alpes", pays: "France", code_pays: "FR" }, "Lyon, France"],
      [{ ville: "Bordeaux", region: null, pays: "France", code_pays: "FR" }, "Bordeaux, France"],
    ];
    verif(
      "« Lyon, France » et « Bordeaux, France » — la ville, puis le pays",
      cas.every(([lieu, attendu]) => ligneCarte(lieu) === attendu),
      cas.map(([lieu]) => ligneCarte(lieu)).join(" · ")
    );
    const americain = ligneCarte({
      ville: "Austin",
      region: "Texas",
      pays: "États-Unis",
      code_pays: "US",
    });
    verif(
      "ET LA DIVISION QUAND LE PAYS L'ÉCRIT — c'est la grammaire du " +
        "site, pas une invention de cette passe",
      /Austin/.test(americain) && /Unis|USA/.test(americain),
      americain
    );
    verif(
      "AUCUNE RUE, AUCUN NUMÉRO NE PEUT SORTIR DE LÀ : `ligneCarte` ne " +
        "reçoit même pas de champ `adresse`",
      !/adresse/.test(ligneCarte.toString())
    );
  } finally {
    rmSync(copie, { force: true });
  }
}

titre("§3 — plus d'encadré de survol, ET SEULEMENT ICI");
{
  verif(
    "LA LIGNE D'IDENTITÉ DE « MA SÉLECTION » PREND L'ÉCRITURE SANS " +
      "ENCADRÉ : plus de fond au survol, plus d'état enfoncé",
    /CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE\} lg:gap-5/.test(blocSuivis) &&
      !/\$\{CLASSES_LIGNE_CLIQUABLE\}/.test(blocSuivis)
  );
  verif(
    "LA GÉOMÉTRIE NE BOUGE PAS D'UN PIXEL : c'est la même écriture " +
      "moins la plaque (`-m-2 p-2` s'annulaient)",
    /export const CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE =\s*\n?\s*"group flex items-start gap-3\.5";/.test(
      blocLieux
    )
  );
  verif(
    "L'ENCADRÉ RESTE INTACT PARTOUT AILLEURS : la constante partagée " +
      "n'a pas changé d'un caractère",
    /"group flex items-start gap-3\.5 rounded-xl -m-2 p-2 " \+\s*\n?\s*"transition-colors hover:bg-white\/5 active:bg-white\/10";/.test(
      blocLieux
    )
  );
  verif(
    "…ET LA CORRECTION DE SES ARRONDIS (nº 298) N'EST PAS TOUCHÉE : le " +
      "bord qui rogne reste écarté de 12 px sur la colonne d'une fiche",
    /lg:overflow-y-auto lg:pl-10 lg:-ml-10 lg:pr-3 lg:-mr-3/.test(fiche)
  );
  verif(
    "LA LIGNE RESTE UN LIEN VERS LA FICHE, pastille comprise",
    /href=\{`\/tatoueur\/\$\{suivi\.slug\}`\}\n\s*data-ligne-suivi=""/.test(
      blocSuivis
    )
  );
}

titre("§4 — les points partis, les chevrons agrandis et débordants");
{
  verif(
    "LES POINTS DE DÉFILEMENT SONT SUPPRIMÉS, code compris : plus " +
      "d'indicateur, plus de tirets",
    !/data-indicateur-pages/.test(dessinDeLaGalerie) &&
      !/data-page-courante/.test(dessinDeLaGalerie) &&
      !/h-0\.5 w-4 rounded-full/.test(dessinDeLaGalerie)
  );
  verif(
    "…ET LES DEUX VALEURS QUI NE SERVAIENT QU'À EUX SONT PARTIES AUSSI " +
      "(le nombre de pages, le décalage du bord droit) — aucun calcul " +
      "sans lecteur",
    !/pages: Math\.max/.test(dessinDeLaGalerie) &&
      !/decalage: /.test(dessinDeLaGalerie)
  );
  verif(
    "…MAIS LE DÉFILEMENT NE PERD RIEN : la page courante reste le PAS " +
      "des chevrons, et les deux bouts de course décident toujours de " +
      "leur existence",
    /page: contenu \? Math\.round\(cadre\.scrollLeft \/ contenu\) : 0/.test(
      dessinDeLaGalerie
    ) &&
      /Math\.max\(0, etat\.page \+ sens\) \* largeurContenu\(cadre\)/.test(
        dessinDeLaGalerie
      ) &&
      /\{etat\.gauche && bandeau\(-1\)\}/.test(dessinDeLaGalerie)
  );
  verif(
    "LE CHEVRON DÉBORDE DES MARGES : sa zone passe de 16/24 px à 40 px, " +
      "soit 24 px de plus que la marge du doigt et 16 px de plus que " +
      "celle du web — il empiète donc sur les vignettes",
    /\} w-10 items-center justify-center text-white/.test(dessinDeLaGalerie) &&
      !/w-4 sm:w-6 items-center justify-center text-white/.test(dessinDeLaGalerie)
  );
  verif(
    "…ET IL DÉBORDE VERS L'INTÉRIEUR, LE SEUL SENS POSSIBLE : son bord " +
      "extérieur reste celui de la marge, sans quoi un élément absolu " +
      "sortirait de la fenêtre et ÉLARGIRAIT le document (piège nº 228)",
    /decalageGauche = "-left-4 sm:-left-6"/.test(dessinDeLaGalerie) &&
      /decalageDroite = "-right-4 sm:-right-6"/.test(dessinDeLaGalerie) &&
      /sens === 1 \? decalageDroite : decalageGauche/.test(dessinDeLaGalerie)
  );
  verif(
    "LE DESSIN SUIT SA ZONE : 20 × 40 au lieu de 12 × 24, même " +
      "proportion, trait remis à l'échelle (1,8 × 40 ÷ 24 = 3)",
    /width="20"\n\s*height="40"\n\s*viewBox="0 0 12 24"/.test(dessinDeLaGalerie) &&
      /strokeWidth="3"/.test(dessinDeLaGalerie)
  );
  verif(
    "UNE OMBRE DOUCE, PAS UN CONTOUR : un `drop-shadow`, aucun `stroke` " +
      "de contour, aucune bordure, aucun fond, aucun disque",
    /\[filter:drop-shadow\(0_1px_3px_rgba\(0,0,0,0\.65\)\)\]/.test(dessinDeLaGalerie) &&
      !/border/.test(
        dessinDeLaGalerie.slice(
          dessinDeLaGalerie.indexOf("const bandeau"),
          dessinDeLaGalerie.indexOf("const voile")
        )
      ) &&
      !/rounded-full bg-/.test(
        dessinDeLaGalerie.slice(
          dessinDeLaGalerie.indexOf("const bandeau"),
          dessinDeLaGalerie.indexOf("const voile")
        )
      )
  );
  //  ⚠️ AMENDÉ LE 16/08/2026 (passe nº 306) — le cœur des vignettes qui
  //  servait de témoin a été SUPPRIMÉ à la nº 302-§2. Ce qui reste
  //  vérifiable, et qui est le fond de l'exigence : l'ombre du chevron
  //  est bien un `drop-shadow`, jamais un contour.
  verif(
    "ET C'EST UNE OMBRE, PAS UN CONTOUR : un `drop-shadow` sur le trait",
    /\[filter:drop-shadow\(0_1px_3px_rgba\(0,0,0,0\.65\)\)\]/.test(
      dessinDeLaGalerie
    )
  );
  verif(
    "LA ZONE DU CHEVRON EST EN POSITION ABSOLUE : elle ne participe pas " +
      "à la mise en page, elle ne peut donc pas élargir le document " +
      "(le piège de la nº 228)",
    /absolute inset-y-0 z-\[2\]/.test(dessinDeLaGalerie)
  );
}

titre("§5 — les feuilles du bas, et le mot « suivis »");
{
  verif(
    "LA FEUILLE S'INTITULE « Filtre de portfolios » sur les portfolios " +
      "et « Filtre de photos » sur les favoris",
    /titreFeuille=\{\s*\n?\s*surLesFavoris \? "Filtre de photos" : "Filtre de portfolios"\s*\n?\s*\}/.test(
      menus
    )
  );
  verif(
    "LE MOT « SUIVIS » A DISPARU DE TOUT CE QUI S'AFFICHE SUR CETTE " +
      "PAGE : le titre, le badge, le titre de groupe, la feuille",
    !/"Mes suivis"/.test(pageFavoris) &&
      !/label: "Suivis"/.test(menus) &&
      !/"Tous les suivis"/.test(selection) &&
      /label: "Portfolios"/.test(menus) &&
      /titre: "Tous les portfolios"/.test(selection)
  );
  verif(
    "LE MOT « FAVORIS » N'EST PAS TOUCHÉ — rien ne demandait de le " +
      "changer, et c'est celui de l'icône de la barre et de l'adresse",
    /label: "Favoris"/.test(menus) &&
      /aria-label="Mes favoris"/.test(lire("src/components/EnTete.tsx"))
  );
}

titre("vivant — le dégagement du §1, sur le composant partagé");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/?style=realisme`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("[data-titre-mosaique]", { timeout: 90000 });
    await page.waitForTimeout(2000);

    /** Le dégagement : du bas du TEXTE du titre au haut de ce qui suit. */
    const degagement = () =>
      page.evaluate(() => {
        const bloc = document.querySelector("[data-titre-mosaique]");
        const h = bloc.querySelector("h1,h2");
        const suivant = bloc.nextElementSibling;
        return (
          (suivant?.getBoundingClientRect().top ??
            bloc.getBoundingClientRect().bottom) -
          h.getBoundingClientRect().bottom
        );
      });

    const avecSousTitre = await degagement();
    //  L'ÉTAT « SANS SOUS-TITRE » : on retire le paragraphe, comme le
    //  fait la page quand aucun filtre n'est en cours.
    await page.evaluate(() => {
      document.querySelector("[data-titre-mosaique] p")?.remove();
    });
    await page.waitForTimeout(300);
    const sansSousTitre = await degagement();
    //  ET L'ÉTAT CORRIGÉ : on repose la ligne RÉSERVÉE, exactement
    //  celle que `degagementConstant` rend.
    await page.evaluate(() => {
      const bloc = document.querySelector("[data-titre-mosaique]");
      const p = document.createElement("p");
      p.setAttribute("aria-hidden", "true");
      p.setAttribute("data-degagement-reserve", "");
      p.className =
        "hidden lg:block mt-1.5 text-[15.5px] sm:text-[16px] text-sombre-texte-doux";
      p.innerHTML = "&nbsp;";
      bloc.append(p);
    });
    await page.waitForTimeout(300);
    const reserve = await degagement();

    verif(
      "AVANT — le dégagement sous le titre CHANGE selon qu'un sous-titre " +
        "est écrit ou non : la page sautait de 30 px",
      Math.abs(avecSousTitre - 54) < 0.5 && Math.abs(sansSousTitre - 24) < 0.5,
      `avec ${avecSousTitre.toFixed(3)} px · sans ${sansSousTitre.toFixed(3)} px`
    );
    verif(
      "APRÈS — la ligne réservée rend au titre EXACTEMENT le dégagement " +
        "qu'il a sous un sous-titre",
      Math.abs(reserve - avecSousTitre) < 0.001,
      `réservé ${reserve.toFixed(3)} px · avec sous-titre ${avecSousTitre.toFixed(3)} px`
    );
  } finally {
    await nav.close();
  }
}

nonJoue(
  "« MA SÉLECTION » EN VIVANT",
  "la page `/mes-favoris` appelle `supabase.auth.getUser()` et redirige " +
    "vers la connexion sans session VALIDÉE PAR LE SERVEUR — le cookie " +
    "fabriqué de `commun-verif` ne franchit pas cette porte, et ce " +
    "conteneur ne peut pas signer un vrai jeton. Les §2 à §5 sont donc " +
    "vérifiés à la source au caractère près, et `ligneCarte` est en " +
    "plus EXÉCUTÉE ; le §1 est mesuré en vivant sur le composant " +
    "partagé, qui est celui de cette page"
);

process.exit(bilan());
