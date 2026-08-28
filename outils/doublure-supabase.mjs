/**
 * ██ LA DOUBLURE DE SUPABASE — LE BANC, ET RIEN QUE LE BANC (nº 670) ██
 * ==================================================================
 * CE QU'ELLE EST. Un petit serveur qui RÉPOND À LA PLACE DE SUPABASE,
 * avec un catalogue inventé : trois styles, quarante-deux portfolios,
 * leurs photos. Il parle le dialecte que le site emploie (PostgREST +
 * une fonction de recherche) et rien de plus.
 *
 * POURQUOI ELLE EXISTE. L'atelier où tournent les passes n'a pas le
 * droit de joindre la vraie base : l'accueil y sortait donc VIDE — pas
 * une carte de style, pas un portfolio, aucun lien vers « /recherche ».
 * Or les défauts les plus tenaces du site (le bug des styles, nº 656,
 * 665, 669) ne se jouent QU'ENTRE CES LIENS-LÀ. Trois passes ont été
 * instruites sans pouvoir cliquer une seule carte. Avec cette doublure,
 * le banc rejoue enfin les vrais gestes : accueil → carte de style →
 * carte de portfolio → retours → autre carte.
 *
 * ⚠️ ELLE N'EST NI DANS LE SITE, NI DANS SES DÉPENDANCES. Elle vit dans
 * `outils/`, hors de `src/` : rien ne l'importe, elle n'entre dans
 * aucun assemblage, elle ne part jamais en production. C'est un outil
 * d'atelier, au même titre que `outils/demarrer.mjs`.
 * ⚠️ ELLE N'ÉCRIT RIEN, NE GARDE RIEN, N'AUTHENTIFIE PERSONNE : elle
 * répond, c'est tout. Aucune donnée réelle ne la traverse.
 *
 * ────────────────────────────────────────────────────────────────────
 * COMMENT S'EN SERVIR — trois commandes, dans trois terminaux.
 *
 *   1) LA DOUBLURE                     npm run banc:doublure
 *      Elle écoute sur http://127.0.0.1:3222 et écrit ce qu'on lui
 *      demande. Laisser tourner.
 *
 *   2) LA COMPILATION, TOURNÉE VERS ELLE
 *      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222 npm run build
 *      ⚠️ LA COMPILATION EST NÉCESSAIRE, et ce n'est pas un détail :
 *      l'accueil est PRÉRENDU. Son catalogue est figé au moment de
 *      compiler — le changer au démarrage seul ne sert à rien.
 *
 *   3) LE SITE, TOURNÉ VERS ELLE
 *      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222 npm run start
 *
 * ⚠️ NE JAMAIS COMPILER AINSI CE QU'ON LIVRE : la compilation de
 * livraison se fait sans cette variable, avec la vraie base. Celle-ci
 * ne sert qu'au banc.
 *
 * LE RALENTISSEUR. La vraie base répond en ~1 s (elle est distante, et
 * la recherche est géographique) ; celle-ci en 10 ms. Certaines fenêtres
 * de temps ne s'ouvrent donc jamais au banc. Pour les rétablir :
 *
 *      DELAI_RPC=1200 npm run banc:doublure
 *
 * ────────────────────────────────────────────────────────────────────
 * CE QU'ELLE SAIT RÉPONDRE, ET COMMENT L'ÉTENDRE. Deux tables
 * (`tatoueurs`, `photos_tatoueur`) et la fonction de recherche
 * (`rpc/rechercher_tatoueurs`). Tout le reste rend une liste vide, ce
 * qui suffit au site. Pour ajouter une table : une entrée dans
 * `TABLES`, et c'est fini — les filtres `eq.` et `in.` sont déjà
 * honorés. Chaque requête est écrite dans le terminal avec le nombre de
 * lignes rendues : c'est ce journal qui dit ce qu'il manque.
 */
import { createServer } from "http";

/**
 * ██ §1 (nº 673) — UN STYLE AJOUTÉ, ET SON RALENTISSEUR ██
 * ------------------------------------------------------------------
 * POURQUOI IL EST LÀ. Le défaut des styles a une cause côté serveur, et
 * elle tient à la DIFFÉRENCE entre deux sortes de styles :
 *  · les QUARANTE ET UN DU CODE (config/tatouage) sont connus toujours ;
 *  · ceux NÉS D'UNE SUGGESTION vivent en base, dans `suggestions_style`,
 *    et sont posés dans un registre au début du rendu.
 * « neo-japonais » — le style du relevé du propriétaire — est du SECOND
 * genre : il n'est pas dans le code. Sans cette table, la doublure ne
 * pouvait pas reproduire son cas.
 * ⚠️ `DELAI_STYLES` OUVRE LA FENÊTRE : en production, la lecture de cette
 * table part vers une base distante ; ici elle répond en une
 * milliseconde. Le délai rétablit la durée réelle — c'est pendant elle
 * que la page se rend, et c'est tout le sujet de la passe.
 */
const STYLES_AJOUTES_DOUBLURE = [
  { slug: "neo-japonais", label: "Néo-japonais", famille: null, etat: "acceptee" },
];

const STYLES = ["trash-polka", "realisme", "blackwork", "neo-japonais"];
//  ASSEZ DE MONDE pour que la mosaïque de l'accueil déborde et que
//  le lien « Voir plus » apparaisse : c'est LUI qui porte l'adresse
//  « /recherche?nature=tatouage… » du relevé du propriétaire.
const PAR_STYLE = 14;

/**
 * §1 (nº 681) — `SLUGS_UNIQUES=1` : UN SLUG PAR FICHE, POUR MESURER LA
 * FICHE PUBLIQUE.
 * ------------------------------------------------------------------
 * LE DÉFAUT DE BANC QUE CE CRAN CORRIGE, et ce n'en est pas un du site.
 * Les quatorze gabarits d'un style PARTAGENT leur slug (`demo-realisme`
 * pour les quatorze). `/tatoueur/[slug]` lit UNE fiche : quatorze
 * réponses pour une lecture unique, et la page rend 404. La fiche
 * publique — la page la plus vue du produit — était donc la seule
 * qu'on ne pouvait pas mesurer.
 *
 * ⚠️ ÉTEINT PAR DÉFAUT, ET C'EST TOUT L'INTÉRÊT. Le banc du bug des
 * styles (nº 673) et celui de la cascade (nº 678) tournent sur les
 * slugs partagés ; les changer sous eux invaliderait leurs relevés. Le
 * cran ne s'allume que si on le demande :
 *
 *      SLUGS_UNIQUES=1 DELAI_BASE=120 npm run banc:doublure
 *
 * ⚠️ ET IL NE TOUCHE QUE LE SLUG : le compte de fiches, les styles, les
 * photos et les villes ne bougent pas d'une ligne. La mosaïque déborde
 * toujours, « Voir plus » apparaît toujours.
 */
const SLUGS_UNIQUES = process.env.SLUGS_UNIQUES === "1";

/**
 * §1 (nº 686) — `MUETTE=1` : LA BASE QUI NE RÉPOND JAMAIS.
 * ------------------------------------------------------------------
 * C'est l'incident du 27 août, reproduit à volonté. La doublure ACCEPTE
 * la connexion et ne répond PLUS — elle ne refuse pas, elle ne coupe
 * pas : elle fait attendre. C'est exactement ce qui fige un site sans
 * délai de garde, et c'est le seul moyen d'éprouver celui de la nº 686.
 * ⚠️ ELLE NE FERME PAS LA SOCKET : une socket fermée rendrait une
 * ERREUR, que les `try/catch` du site attrapent déjà depuis toujours.
 * Ce qu'on veut reproduire, c'est le SILENCE.
 *
 *      MUETTE=1 npm run banc:doublure
 */
const MUETTE = process.env.MUETTE === "1";

const TATOUEURS = STYLES.flatMap((style, s) =>
  Array.from({ length: PAR_STYLE }, (_, k) => k).map((k) => {
    const i = `${s}-${k}`;
    return ({
  id: `demo-${i}`,
  slug: SLUGS_UNIQUES ? `demo-${style}-${k}` : `demo-${style}`,
  nom: `Atelier ${style}`,
  publie: true, ville_nom: "Lyon", ville_code_postal: "69001",
  /*  §1 (nº 681) — SANS `ville_slug`, `/tatouage/<style>/<ville>` rend
      404 : `chargerStyleVille` ne retrouve aucune ville, et la page
      « style + ville » était la seconde qu'on ne pouvait pas mesurer.
      Le champ manquait au gabarit ; l'ajouter ne change rien à ce qui
      existait — rien ne le lisait, faute qu'il existe.
      ⚠️ ET IL SUIT LE MÊME CRAN, pour la même raison qu'au slug de
      fiche : `lireVilleParSlug` fait un `.limit(1).maybeSingle()`, la
      doublure IGNORE `limit`, et cinquante-six réponses pour une
      lecture unique rendent `null`. Faire honorer `limit` à la
      doublure serait plus propre EN THÉORIE et dangereux en pratique :
      la mosaïque de l'accueil se lit avec une limite, et le banc du
      bug des styles (nº 673) tourne dessus. On ne touche pas à ce qui
      porte un relevé déjà rendu. */
  ville_slug: SLUGS_UNIQUES ? `lyon-${s}-${k}` : "lyon",
  departement: "69", region: "Auvergne-Rhône-Alpes", pays: "FR",
  code_pays: "FR", latitude: 45.76, longitude: 4.83,
  type_fiche: "artiste", etablissement: null, mode_exercice: "studio",
  rayon_zone_km: null, villes: null,
  photo_profil: `/images-demo/tatouage/${style}-1.svg`,
  ancien_slug: null, supprime_le: null, purge_le: null,
  styles: [style], cree_le: "2026-01-01T00:00:00Z",
  maj_le: "2026-01-01T00:00:00Z", score: 10, bio: null,
  lien_instagram: null, telephone: null, email: null,
    });
  })
);
const PHOTOS = TATOUEURS.flatMap((t) =>
  [0, 1, 2].map((n) => ({
    id: `photo-${t.id}-${n}`, tatoueur_id: t.id, style: t.styles[0],
    rendu: "noir", nature: "tatouage",
    url: `/images-demo/tatouage/${t.styles[0]}-${n + 1}.svg`,
    miniature: `/images-demo/tatouage/${t.styles[0]}-${n + 1}.svg`,
    ordre: n, cree_le: "2026-01-01T00:00:00Z",
  }))
);
const TABLES = {
  tatoueurs: TATOUEURS,
  photos_tatoueur: PHOTOS,
  //  §1 (nº 673) — les styles nés d'une suggestion, lus par
  //  `lib/styles-ajoutes` au début du rendu de chaque page.
  suggestions_style: STYLES_AJOUTES_DOUBLURE,
};

/**
 * §2 (nº 684) — CE QU'ON INSÈRE, LA DOUBLURE LE GARDE.
 * ------------------------------------------------------------------
 * LE DÉFAUT DE BANC QUE CECI CORRIGE, et il faussait un chiffre publié.
 * La doublure traitait un POST comme un GET : elle ne stockait rien.
 * Or la route des notifications POSE LA BIENVENUE quand elle ne la
 * trouve pas dans la liste (nº 663) — et comme la liste revenait
 * toujours vide, elle la reposait À CHAQUE APPEL. Un aller-retour de
 * plus, à chaque fois, sur une écriture qui en production n'a lieu
 * QU'UNE FOIS dans la vie d'un compte. Mesuré : la route s'affichait à
 * ~509 ms au lieu de ~390.
 * ⚠️ ÇA NE SURVIT PAS AU REDÉMARRAGE, et c'est très bien : chaque
 * lancement du banc repart d'une base propre, comme avant. On corrige
 * la fidélité d'une SESSION de mesure, on n'invente pas une base.
 */
function ranger(table, brut) {
  let lignes;
  try {
    lignes = JSON.parse(brut || "null");
  } catch {
    return [];
  }
  if (!lignes) return [];
  const ajoutees = (Array.isArray(lignes) ? lignes : [lignes]).map((l, n) => ({
    id: l.id ?? `insere-${table}-${Date.now()}-${n}`,
    ...l,
  }));
  if (!TABLES[table]) TABLES[table] = [];
  TABLES[table].push(...ajoutees);
  return ajoutees;
}

function repondre(req, res, u, brut) {
  //  §1 (nº 686) — LE SILENCE : on garde la requête ouverte, sans rien
  //  écrire. Le client attendra jusqu'à SON propre délai de garde.
  if (MUETTE) return;

  const table = u.pathname.replace(/^\/rest\/v1\//, "");
  //  UNE ÉCRITURE : on range, et l'on rend ce qu'on vient de ranger —
  //  c'est ce que PostgREST fait avec `.select()` après un `insert`.
  if (req.method === "POST" && !table.startsWith("rpc/")) {
    const ajoutees = ranger(table, brut);
    console.log(
      new Date().toISOString().slice(11, 19),
      "POST", table, "← rangé", ajoutees.length
    );
    const delaiEcriture = Number(process.env.DELAI_BASE ?? 0);
    if (delaiEcriture) {
      setTimeout(() => envoyer(res, ajoutees), delaiEcriture);
      return;
    }
    envoyer(res, ajoutees);
    return;
  }
  let corps = TABLES[table] ?? [];
  if (table === "rpc/rechercher_tatoueurs") {
    let params = {};
    try { params = JSON.parse(brut || "{}"); } catch { /* corps vide */ }
    const style = params.p_style;
    corps = TATOUEURS.filter((l) => !style || l.styles.includes(style))
      .map((l, _i, tous) => ({ ...l, total: tous.length, distance_km: null }));
  } else {
    for (const [cle, val] of u.searchParams) {
      if (["select", "order", "limit", "offset"].includes(cle)) continue;
      const m = /^(eq|in)\.(.*)$/.exec(val);
      if (!m) continue;
      if (m[1] === "eq") {
        const attendu = m[2] === "true" ? true : m[2] === "false" ? false : m[2];
        corps = corps.filter((l) => String(l[cle]) === String(attendu));
      } else {
        const liste = m[2].replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, ""));
        corps = corps.filter((l) => liste.includes(String(l[cle])));
      }
    }
  }
  console.log(new Date().toISOString().slice(11, 19), req.method, table, "→", corps.length);
  //  LE RALENTISSEUR : la recherche du propriétaire répond en ~1 s
  //  (base distante, requête géographique) ; ici en 10 ms. Ce délai
  //  rétablit la fenêtre de temps réelle — c'est elle qu'on soupçonne.
  const delai = Number(process.env.DELAI_RPC ?? 0);
  if (delai && table === "rpc/rechercher_tatoueurs") {
    setTimeout(() => envoyer(res, corps), delai);
    return;
  }
  /*  ██ §1 (nº 678) — LE RALENTISSEUR GÉNÉRAL ██
      La doublure répond en une milliseconde ; une vraie base répond en
      cent et quelques (aller-retour réseau compris). Sans ce délai, on
      ne peut PAS voir ce que la passe cherche : des lectures qui
      s'attendent les unes les autres au lieu de partir ensemble. Douze
      requêtes en série à 1 ms font 12 ms — invisible ; à 120 ms elles
      font une seconde et demie, et le défaut saute aux yeux.
        DELAI_BASE=120 npm run banc:doublure                          */
  const delaiBase = Number(process.env.DELAI_BASE ?? 0);
  if (delaiBase) {
    setTimeout(() => envoyer(res, corps), delaiBase);
    return;
  }
  //  §1 (nº 673) — le ralentisseur du catalogue des styles ajoutés :
  //  c'est pendant CETTE attente que la page se rend, et c'est là que
  //  le style se perdait. Voir l'en-tête de ce fichier.
  const delaiStyles = Number(process.env.DELAI_STYLES ?? 0);
  if (delaiStyles && table === "suggestions_style") {
    setTimeout(() => envoyer(res, corps), delaiStyles);
    return;
  }
  envoyer(res, corps);
}
function envoyer(res, corps) {
  res.writeHead(200, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  });
  res.end(JSON.stringify(corps));
}

createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  let brut = "";
  req.on("data", (m) => { brut += m; });
  req.on("end", () => repondre(req, res, u, brut));
}).listen(3222, "127.0.0.1", () => console.log("doublure Supabase sur :3222"));
