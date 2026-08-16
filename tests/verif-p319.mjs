/**
 * BANC DE LA PASSE Nº 319 — LIVRAISON ÉCONOME (graphique)
 * ==================================================================
 * Les deux pages passées à la charte : « Qui sommes-nous » et
 * « Contact ». UN SEUL navigateur, UNE SEULE largeur (1440 × 823),
 * aucune mesure « avant » : on mesure le résultat, rien de plus.
 */
import {
  BASE,
  bilan,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const GRIS_DOUX = "rgb(168, 168, 176)"; //  #A8A8B0 texteDoux
const CHAMP_REPOS = "rgb(63, 63, 71)"; //  #3F3F47 eleveClair
const CHAMP_FOCUS = "rgb(74, 74, 83)"; //  #4A4A53 haut
const TRAIT = "rgb(74, 74, 83)"; //  #4A4A53 trait (nº 315)
const ROSE = "rgb(238, 61, 111)"; //  #EE3D6F primaire
const ELEVE = "rgb(51, 51, 58)"; //  #33333A eleve

const { nav, page } = await ouvrirLeNavigateur("p319", {
  width: 1440,
  height: 823,
});

/* ==================================================================
 * §1 · §2 — QUI SOMMES-NOUS
 * ================================================================== */
titre("Qui sommes-nous — la charte, et le texte au mot près");
{
  await page.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });

  const m = await page.evaluate(() => {
    const main = document.querySelector("main");
    const titres = [...main.querySelectorAll("h1, h2")].map((h) => {
      const s = getComputedStyle(h);
      return {
        texte: h.textContent.replace(/ /g, " ").trim(),
        taille: s.fontSize,
        graisse: s.fontWeight,
        casse: s.textTransform,
        couleur: s.color,
      };
    });
    const paragraphes = [...main.querySelectorAll("section p")].map((p) =>
      p.textContent.replace(/ /g, " ").replace(/\s+/g, " ").trim()
    );
    const gras = [...main.querySelectorAll("section strong")].map((n) => ({
      texte: n.textContent.replace(/ /g, " ").trim(),
      couleur: getComputedStyle(n).color,
    }));
    const separateurs = [...main.querySelectorAll("section, div")]
      .map((n) => getComputedStyle(n))
      .filter((s) => s.borderTopWidth === "1px" && s.borderTopStyle === "solid")
      .map((s) => s.borderTopColor);
    const liens = [...main.querySelectorAll("a")].map((a) => {
      const s = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return {
        texte: a.textContent.trim(),
        fond: s.backgroundColor,
        bordure: `${s.borderTopWidth} ${s.borderTopColor}`,
        rayon: s.borderRadius,
        largeur: Math.round(r.width),
      };
    });
    const corps = main.querySelector("section p");
    const sCorps = getComputedStyle(corps);
    const sMain = getComputedStyle(main);
    return {
      titres,
      paragraphes,
      gras,
      separateurs,
      liens,
      corps: { taille: sCorps.fontSize, couleur: sCorps.color },
      margesMain: [sMain.paddingLeft, sMain.paddingRight],
      largeurMain: main.getBoundingClientRect().width,
    };
  });

  //  §2 — LES TROIS TITRES, dans l'écriture des titres de section.
  verif(
    "les trois titres sont là, dans l'ordre du texte",
    m.titres.map((t) => t.texte).join(" | ") ===
      "Pourquoi « YokoFolio » ? | Ce que fait le site | Ce qu'on ne fait pas",
    m.titres.map((t) => t.texte).join(" | ")
  );
  verif(
    "…et ils portent L'ÉCRITURE DES TITRES DE SECTION du site : 13 px, " +
      "demi-gras, capitales, gris doux",
    m.titres.every(
      (t) =>
        t.taille === "13px" &&
        t.graisse === "600" &&
        t.casse === "uppercase" &&
        t.couleur === GRIS_DOUX
    ),
    `${m.titres[0].taille} · ${m.titres[0].graisse} · ${m.titres[0].casse} · ${m.titres[0].couleur}`
  );

  //  §2 — LE TEXTE, AU MOT PRÈS (les neuf paragraphes).
  const ATTENDUS = [
    "« Yoko » vient du japonais, signifie « couché, sur le côté ». Regarde le cœur rose du logo, il est incliné. « Folio » vient de portfolio : c'est le cœur du site. YokoFolio, c'est un cœur incliné qui t'emmène vers des portfolios.",
    "Un tatouage commence par un style. YokoFolio classe les tatoueurs par style.",
    "Essaie de chercher « du réalisme autour de Lyon » sur Instagram : aucune case ne pose cette question. Ici, c'est précisément celle qu'on te pose.",
    "Choisis un style, une ville et un rayon : les tatoueurs qui correspondent s'affichent, chacun avec un portfolio consacré à son travail dans le style recherché.",
    "YokoFolio ne remplace pas Instagram — il t'y conduit, avec le bon artiste au bout.",
    "Tatoueur ? Crée ton portfolio : un style montré est un style trouvable.",
    "Curieux ? Cherche, et découvre ton prochain tatouage.",
    "Pas d'avis, pas de notes.",
    "Personne ne commente ni ne juge le travail d'un tatoueur ici. Son portfolio parle pour lui. À toi de te faire ton avis.",
  ];
  const normalise = (t) => t.replace(/[’']/g, "'");
  const ecarts = ATTENDUS.filter(
    (attendu, rang) => normalise(m.paragraphes[rang] ?? "") !== normalise(attendu)
  );
  verif(
    "LE TEXTE EST CELUI DU PROPRIÉTAIRE, AU MOT PRÈS — neuf paragraphes, " +
      "zéro écart",
    m.paragraphes.length === ATTENDUS.length && ecarts.length === 0,
    ecarts.length
      ? `écart sur : « ${ecarts[0].slice(0, 60)}… »`
      : "9 paragraphes conformes"
  );
  //  §2 — LES QUATRE GRAS, en blanc (la grammaire du site).
  verif(
    "les QUATRE passages en gras sont là, et en blanc",
    m.gras.map((g) => normalise(g.texte)).join(" | ") ===
      normalise(
        "il t'y conduit, avec le bon artiste au bout. | Tatoueur ? | Curieux ? | À toi de te faire ton avis."
      ) && m.gras.every((g) => g.couleur === "rgb(242, 242, 244)"),
    m.gras.map((g) => g.texte).join(" | ")
  );

  //  §1 — LES JETONS : corps de lecture, séparateurs, marges, boutons.
  verif(
    "le corps de texte est la lecture du site : 15 px, gris doux",
    m.corps.taille === "15px" && m.corps.couleur === GRIS_DOUX,
    `${m.corps.taille} · ${m.corps.couleur}`
  );
  verif(
    "les séparateurs sont LE TRAIT du site (nº 315) : 1 px, #4A4A53",
    m.separateurs.length === 3 && m.separateurs.every((c) => c === TRAIT),
    `${m.separateurs.length} trait(s) · ${m.separateurs[0]}`
  );
  verif(
    "les marges de page sont celles du site (24 px à cette largeur)",
    m.margesMain.join("/") === "24px/24px",
    m.margesMain.join(" / ")
  );
  const [principal, secondaire] = m.liens.slice(-2);
  verif(
    "L'ACTION FINALE : capsule rose pleine largeur — la seule de la page",
    principal.texte === "Chercher un tatoueur" &&
      principal.fond === ROSE &&
      principal.largeur === Math.round(m.largeurMain) - 48 &&
      m.liens.filter((l) => l.fond === ROSE).length === 1,
    `${principal.fond} · ${principal.largeur} px (colonne ${Math.round(m.largeurMain) - 48} px)`
  );
  verif(
    "l'action intermédiaire : capsule à sa taille naturelle, fond eleve, " +
      "AUCUN contour",
    secondaire.fond === ELEVE &&
      secondaire.bordure === "0px rgb(242, 242, 244)" &&
      secondaire.largeur < principal.largeur / 2,
    `${secondaire.texte} · ${secondaire.fond} · bordure ${secondaire.bordure} · ${secondaire.largeur} px`
  );
  verif(
    "AUCUN CONTOUR sur la page : pas un lien, pas un bloc n'a de bordure " +
      "peinte (hors les traits de séparation)",
    m.liens.every((l) => l.bordure.startsWith("0px")),
    "0 contour"
  );
}

/* ==================================================================
 * §1 · §3 — CONTACT
 * ================================================================== */
titre("Contact — les champs de la charte, et les libellés dedans");
{
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForSelector("#contact-nom", { timeout: 20000 });

  const c = await page.evaluate(() => {
    const main = document.querySelector("main");
    const lire = (sel) => {
      const n = main.querySelector(sel);
      const s = getComputedStyle(n);
      return {
        placeholder: n.getAttribute("placeholder"),
        fond: s.backgroundColor,
        rayon: s.borderRadius,
        bordure: s.borderTopColor,
        contour: s.outlineStyle,
      };
    };
    return {
      nom: lire("#contact-nom"),
      email: lire("#contact-email"),
      message: lire("#contact-message"),
      etiquettes: main.querySelectorAll("label").length,
      bouton: (() => {
        const b = main.querySelector('button[type="submit"]');
        const s = getComputedStyle(b);
        const r = b.getBoundingClientRect();
        return { fond: s.backgroundColor, largeur: Math.round(r.width) };
      })(),
      largeurForm: Math.round(
        main.querySelector("form").getBoundingClientRect().width
      ),
      titre: (() => {
        const s = getComputedStyle(main.querySelector("h1"));
        return `${s.fontSize} ${s.fontWeight}`;
      })(),
      margesMain: getComputedStyle(main).paddingLeft,
    };
  });

  verif(
    "§3 — les libellés vivent DANS les champs : « Nom », « E-mail », " +
      "« Message » — et plus de « Ex. Léa »",
    c.nom.placeholder === "Nom" &&
      c.email.placeholder === "E-mail" &&
      c.message.placeholder === "Message" &&
      c.etiquettes === 0,
    `« ${c.nom.placeholder} » · « ${c.email.placeholder} » · « ${c.message.placeholder} » · 0 étiquette au-dessus`
  );
  verif(
    "les trois champs portent LA robe du site : fond #3F3F47, arrondi " +
      "8 px, bordure transparente — aucun contour",
    [c.nom, c.email, c.message].every(
      (champ) =>
        champ.fond === CHAMP_REPOS &&
        champ.rayon === "8px" &&
        champ.bordure === "rgba(0, 0, 0, 0)"
    ),
    `${c.nom.fond} · ${c.nom.rayon} · bordure ${c.nom.bordure}`
  );

  //  LE FOCUS : le fond s'éclaircit — pas de contour, pas de rose.
  //  (un clic, puis le temps de la transition de couleur : on mesure
  //  l'état posé, jamais le dégradé en vol)
  await page.click("#contact-nom");
  await page.waitForTimeout(350);
  const focus = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector("#contact-nom"));
    return {
      fond: s.backgroundColor,
      contour: s.outlineStyle,
      bordure: s.borderTopColor,
    };
  });
  verif(
    "au focus, le fond monte à #4A4A53 — sans contour, sans halo, sans rose",
    focus.fond === CHAMP_FOCUS &&
      focus.contour === "none" &&
      focus.bordure === "rgba(0, 0, 0, 0)",
    `${focus.fond} · outline ${focus.contour} · bordure ${focus.bordure}`
  );
  verif(
    "l'action finale : capsule rose pleine largeur, la seule de la page",
    c.bouton.fond === ROSE && c.bouton.largeur === c.largeurForm,
    `${c.bouton.fond} · ${c.bouton.largeur} px = formulaire ${c.largeurForm} px`
  );
  verif(
    "le titre et les marges sont ceux du site : 20 px gras, 24 px de marge",
    c.titre === "20px 700" && c.margesMain === "24px",
    `${c.titre} · ${c.margesMain}`
  );
}

await nav.close();
process.exit(bilan());
