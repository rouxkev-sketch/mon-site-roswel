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
 * `TABLES`, et c'est fini — les filtres `eq.`, `neq.` et `in.` sont
 * déjà honorés, EN LECTURE COMME EN SUPPRESSION (`order` et `limit`
 * demandent le cran `TRI=1`, plus bas). Chaque requête est écrite dans
 * le terminal avec le nombre de lignes rendues : c'est ce journal qui
 * dit ce qu'il manque.
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

/**
 * §2 (nº 689) — `FAUX_TOTAL=1` : LA BASE ANNONCE PLUS QU'ELLE NE REND.
 * ------------------------------------------------------------------
 * L'outil de sauvegarde COMPARE ce qu'il a copié au total que la base
 * annonce dans son en-tête `content-range`. Cette vérification-là ne
 * vaut que si on l'a vue MORDRE : un contrôle jamais déclenché est un
 * contrôle qu'on croit bon. Ce cran fait annoncer à la doublure un
 * total faux (9 999) tout en rendant ses lignes habituelles — la
 * sauvegarde doit alors lever une alerte, table par table.
 *
 *      FAUX_TOTAL=1 npm run banc:doublure
 *
 * ⚠️ IL NE SERT QU'À ÇA. Éteint (le défaut), la doublure n'envoie
 * aucun `content-range`, exactement comme avant cette passe.
 */
const FAUX_TOTAL = process.env.FAUX_TOTAL === "1";

/**
 * ██ §1 (nº 690) — LES CONDITIONS DE LA VRAIE BASE, REPRODUITES ██
 * ------------------------------------------------------------------
 * POURQUOI ELLES MANQUAIENT. La sauvegarde de la nº 689 passait ici et
 * SE FIGEAIT chez le propriétaire. La doublure n'avait rien de ce qui
 * fait la différence entre trois petites tables et une vraie base :
 * pas de grande table, pas de plafond de réponse, pas de table qui ne
 * répond jamais. Trois crans, et l'outil peut être éprouvé pour de bon.
 *
 *   GRANDE_TABLE=5000   une table `grande_table` de 5 000 lignes, pour
 *                       que la pagination existe vraiment. (nº 764 —
 *                       elle s'appelait `communes` ; cette table-là a
 *                       été supprimée de la vraie base, et un décor de
 *                       banc n'a aucune raison d'en porter le nom.)
 *   PLAFOND=500         le serveur ne rend jamais plus de 500 lignes,
 *                       même si on en demande 1 000 — c'est le
 *                       `max-rows` de PostgREST, et c'est le piège qui
 *                       faisait rendre une copie tronquée pour
 *                       complète ;
 *   TABLE_MUETTE=x      la table `x` accepte la requête et ne répond
 *                       JAMAIS. C'est le blocage lui-même.
 *
 *      GRANDE_TABLE=5000 PLAFOND=500 TABLE_MUETTE=grande_table \
 *        npm run banc:doublure
 *
 * ⚠️ ÉTEINTS (le défaut), ces trois crans ne changent rien : la
 * doublure répond exactement comme avant cette passe.
 */
const GRANDE_TABLE = Number(process.env.GRANDE_TABLE ?? 0);
const PLAFOND = Number(process.env.PLAFOND ?? 0);
const TABLE_MUETTE = process.env.TABLE_MUETTE ?? "";

/**
 * §2 (nº 690) — `IGNORER_ID=1` : LA BASE CRÉE LE COMPTE AVEC SON PROPRE
 * IDENTIFIANT, pas celui qu'on lui donne.
 * ------------------------------------------------------------------
 * C'est le cas le plus DANGEREUX de la restauration des comptes, et le
 * plus silencieux : le compte existe, la personne peut se connecter…
 * et ne retrouve AUCUN de ses portfolios, parce que le lien passe par
 * cet identifiant. L'outil doit le voir et le crier ; ce cran permet de
 * vérifier qu'il le fait.
 *
 *      IGNORER_ID=1 npm run banc:doublure
 */
const IGNORER_ID = process.env.IGNORER_ID === "1";

/**
 * ██ §1 (nº 695) — `TRI=1` : `order` EST HONORÉ, ET `limit` AVEC LUI ██
 * ------------------------------------------------------------------
 * LE MANQUE QUE L'AUDIT nº 691 A NOMMÉ : la doublure rendait TOUTE la
 * table, dans l'ordre où les lignes avaient été rangées. Une route qui
 * demande « les 50 plus récentes » recevait donc les 60 lignes du
 * compte, la plus ancienne comprise — et un défaut qui ne se voit QUE
 * lorsqu'une ligne tombe hors de la fenêtre devenait invisible.
 * C'est le cas R6, celui de cette passe : la bienvenue est la plus
 * ANCIENNE des nouvelles ; elle sort de la fenêtre passé cinquante, et
 * la garde ne la voyait plus.
 *
 * ⚠️ LES DEUX VONT ENSEMBLE, ET C'EST LE POINT. Honorer `limit` sans
 * `order`, ce serait couper cinquante lignes AU HASARD : le défaut se
 * reproduirait parfois, pour la mauvaise raison. Une mesure qui dépend
 * de l'ordre de rangement ne prouve rien.
 * ⚠️ ET C'EST UN CRAN, comme la nº 690 : éteint, la doublure répond
 * exactement comme avant, et aucun relevé déjà rendu n'est invalidé.
 *
 *      TRI=1 npm run banc:doublure
 */
const TRI = process.env.TRI === "1";

/**
 * ██ §1 (nº 745) — LA FICHE DU MOTEUR EST PARTIELLE, COMME EN VRAI ██
 * ------------------------------------------------------------------
 * CE QUE LA VRAIE BASE FAIT, ET QUE LA DOUBLURE NE FAISAIT PAS : la
 * fonction `rechercher_tatoueurs` (supabase/yokofolio-classement-
 * avant-la-coupe.sql) CONSTRUIT la fiche champ par champ — `booking`,
 * `booking_mois` et `dm_instagram` n'y sont PAS. La doublure, elle,
 * renvoyait la ligne ENTIÈRE : les cartes du banc connaissaient donc
 * le booking, quand celles de la prod l'ignorent — et le
 * réarrangement de la fenêtre superposée (la case Booking qui
 * s'insère devant Instagram à l'arrivée de la fiche complète) était
 * INVISIBLE au banc.
 * ⚠️ C'EST UN CRAN, comme la nº 690 : éteint, la doublure répond
 * exactement comme avant, aucun relevé déjà rendu n'est invalidé.
 *
 *      FICHE_PARTIELLE=1 npm run banc:doublure
 */
const FICHE_PARTIELLE = process.env.FICHE_PARTIELLE === "1";
/** Les champs que la vraie fonction met dans `fiche` — la liste de
    `jsonb_build_object`, recopiée de la fonction SQL. */
const CHAMPS_FICHE_MOTEUR = [
  "id", "nom", "slug", "ville_nom", "ville_slug", "latitude",
  "longitude", "adresse", "code_postal", "region", "pays", "code_pays",
  "lieu_id", "styles", "lien_instagram", "lien_tiktok", "lien_youtube",
  "site_web", "bio", "type_fiche", "mode_exercice", "rayon_zone_km",
  "villes", "photo_principale", "photo_profil", "photos",
  "photos_styles", "filtres_technique", "filtres_composition",
  "filtres_besoins", "ancien_slug", "publie", "galerie",
];

/**
 * ██ §1 (nº 688) — LA DOUBLURE SAIT DÉSORMAIS DIRE QUI EST CONNECTÉ ██
 * ------------------------------------------------------------------
 * CE QUI MANQUAIT, ET CE QUE ÇA EMPÊCHAIT DE MESURER : le banc forge un
 * cookie de session (scratchpad/session-forgee), et le NAVIGATEUR s'en
 * contente — il lit la session dans le cookie. LE SERVEUR, lui, ne s'en
 * contente pas : `verifierAdmin` appelle `supabase.auth.getUser()`, qui
 * interroge `GET /auth/v1/user`. La doublure ne connaissait pas cette
 * adresse : toute route d'administration répondait 401, et rien de ce
 * qui se passe DERRIÈRE elle ne pouvait être éprouvé.
 * CE QU'ELLE FAIT MAINTENANT : elle DÉCODE le jeton porté par
 * l'en-tête `Authorization` et rend la personne qu'il désigne. Elle ne
 * vérifie AUCUNE signature — c'est une doublure, pas un service
 * d'authentification : le banc décide qui il est en forgeant son jeton,
 * et c'est précisément ce qu'on veut pouvoir faire varier (un compte
 * ordinaire, un compte administrateur).
 * ⚠️ ELLE N'INVENTE PERSONNE : sans jeton lisible, elle rend 401 comme
 * la vraie. Un banc qui oublie son cookie doit le voir.
 */
function utilisateurDuJeton(req) {
  const entete = req.headers.authorization ?? "";
  const jeton = entete.startsWith("Bearer ") ? entete.slice(7) : "";
  const charge = jeton.split(".")[1];
  if (!charge) return null;
  try {
    const json = JSON.parse(
      Buffer.from(charge.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    );
    if (!json.sub) return null;
    const metaApp = json.app_metadata ?? {};
    //  §3 (nº 783) — CE QUE LE JETON DIT N'EST PLUS FORCÉMENT VRAI : un
    //  fournisseur délié depuis l'émission du jeton doit avoir disparu
    //  de la réponse, sinon l'écran continuerait de l'annoncer.
    const restants = fournisseursDe(json.sub, metaApp);
    return {
      id: json.sub,
      aud: json.aud ?? "authenticated",
      role: json.role ?? "authenticated",
      email: json.email ?? null,
      app_metadata: { ...metaApp, provider: restants[0] ?? null, providers: restants },
      //  §3 (nº 783) — LA LISTE DES IDENTITÉS, que `getUserIdentities`
      //  lit pour savoir quoi délier (elle passe par `getUser`).
      identities: identitesDe(json.sub, json.email ?? null, metaApp),
      user_metadata: json.user_metadata ?? {},
      created_at: new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * ██ §3 (nº 783) — LES IDENTITÉS D'UN COMPTE, ET CE QU'ON LEUR RETIRE ██
 * ------------------------------------------------------------------
 * Chez le vrai Supabase, `app_metadata.providers` et la liste
 * `identities` disent la même chose vue de deux côtés ; c'est la
 * SECONDE que `unlinkIdentity` réclame, parce qu'elle seule porte un
 * `identity_id`. La doublure la fabrique donc à partir de la première.
 * ⚠️ ET ELLE SE SOUVIENT DES RETRAITS (`DELIEES`), sans quoi le banc ne
 * pourrait pas éprouver ce qui compte : que le moyen d'entrée a
 * VRAIMENT disparu, et que l'écran le dit au rafraîchissement.
 */
const DELIEES = new Set();          //  « <id compte>|<fournisseur> »
const cleDeliee = (compte, fournisseur) => `${compte}|${fournisseur}`;

function fournisseursDe(compte, metaApp) {
  const bruts = Array.isArray(metaApp?.providers)
    ? metaApp.providers
    : metaApp?.provider
      ? [metaApp.provider]
      : [];
  return bruts.filter((f) => !DELIEES.has(cleDeliee(compte, f)));
}

function identitesDe(compte, courriel, metaApp) {
  return fournisseursDe(compte, metaApp).map((fournisseur) => ({
    identity_id: `${compte}-${fournisseur}`,
    id: compte,
    user_id: compte,
    provider: fournisseur,
    identity_data: { email: courriel, sub: compte },
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }));
}

/**
 * ██ §3 (nº 783) — UNE SESSION DE BANC, ÉCRITE UNE SEULE FOIS ██
 * ------------------------------------------------------------------
 * Deux chemins la réclament — l'ouverture (échange du code, mot de
 * passe) et la reprise (`grant_type=refresh_token`, ce que déclenche
 * `delierGoogle`). Ils rendaient deux objets écrits séparément : le
 * jour où l'un des deux oublie un champ, la panne se cherche dans le
 * site. Une seule écriture, comme partout ailleurs (piège nº 378).
 * ⚠️ LE JETON DE REPRISE EST UNIQUE, et il le faut : c'est la clé du
 * carnet `SESSIONS`. Un jeton constant ferait se confondre deux
 * comptes ouverts dans deux onglets du même banc.
 */
const SESSIONS = new Map();
let compteurDeSessions = 0;

function sessionDeBanc({ identifiant, courriel, metaApp }) {
  const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  /*  §1 (nº 792) — LA DURÉE DU JETON D'ACCÈS, RÉGLABLE. En vrai elle
      vaut une heure : impossible d'éprouver « je rouvre le navigateur
      le lendemain » sans attendre une heure. `DUREE_JETON=5` la met à
      cinq secondes, et le banc reproduit alors en une minute ce que le
      propriétaire vit chaque matin — un jeton d'accès MORT, et le seul
      jeton de reprise pour rattraper la session. */
  const duree = Number(process.env.DUREE_JETON || 3600);
  const expire = Math.floor(Date.now() / 1000) + duree;
  const identite = { nom: "Kevin", nom_affiche: "Kevin" };
  const restants = fournisseursDe(identifiant, metaApp);
  const metaAJour = { ...metaApp, provider: restants[0] ?? null, providers: restants };
  const personne = {
    id: identifiant, aud: "authenticated", role: "authenticated",
    email: courriel,
    //  §1 (nº 783) — le fournisseur dit la vérité : c'est lui que la
    //  page Sécurité lit pour savoir si ce compte a un mot de passe.
    app_metadata: metaAJour,
    identities: identitesDe(identifiant, courriel, metaApp),
    user_metadata: identite, created_at: new Date(0).toISOString(),
  };
  const jeton = [
    b64u({ alg: "HS256", typ: "JWT" }),
    b64u({ sub: identifiant, aud: "authenticated", role: "authenticated",
      email: courriel, exp: expire, iat: Math.floor(Date.now() / 1000),
      app_metadata: metaAJour, user_metadata: identite }),
    "signature-de-banc",
  ].join(".");
  const reprise = `rafraichissement-de-banc-${++compteurDeSessions}`;
  SESSIONS.set(reprise, { identifiant, courriel, metaApp });
  return {
    access_token: jeton, token_type: "bearer", expires_in: duree,
    expires_at: expire, refresh_token: reprise, user: personne,
  };
}

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
/*  §1 (nº 689) — LE DÉCOR DE LA SAUVEGARDE : deux comptes, un panier,
    trois fichiers. Rien de ceci n'est lu par le site (voir la note du
    §1 nº 689 plus bas) ; c'est le minimum pour que l'outil de
    sauvegarde ait quelque chose à copier au banc. */
const COMPTES_DOUBLURE = [
  { id: "00000000-0000-4000-8000-000000000001", email: "essai@yokofolio.test",
    created_at: "2026-01-01T00:00:00Z", last_sign_in_at: "2026-08-01T00:00:00Z" },
  { id: "11111111-1111-4111-8111-111111111111", email: "camille@yokofolio.test",
    created_at: "2026-06-01T00:00:00Z", last_sign_in_at: null },
];
const PANIER = "photos-tatoueurs";
const FICHIERS_STOCKAGE = [
  "00000000-0000-4000-8000-000000000001/demo-0-0-realisme.svg",
  "00000000-0000-4000-8000-000000000001/demo-0-0-blackwork.svg",
  "11111111-1111-4111-8111-111111111111/fiche-a-refuser-realisme.svg",
];

/*  §1 (nº 690) — LA GRANDE TABLE, quand on la demande. Cinq mille
    lignes, c'est ce qu'il faut pour que la pagination existe pour de
    bon (la doublure n'avait que des tables d'une page). */
const GRANDE = GRANDE_TABLE > 0
  ? Array.from({ length: GRANDE_TABLE }, (_, n) => ({
      id: `commune-${String(n).padStart(6, "0")}`,
      nom: `Commune ${n}`, code_postal: String(10000 + (n % 89000)),
    }))
  : [];

const TABLES = {
  tatoueurs: TATOUEURS,
  photos_tatoueur: PHOTOS,
  ...(GRANDE_TABLE > 0 ? { grande_table: GRANDE } : {}),
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
/*  ██ nº 754 — LES CONTRAINTES DE LA VRAIE BASE, ENFIN APPLIQUÉES ██
    ====================================================================
    CE QUE LA nº 754 A COÛTÉ, ET C'EST TOUTE LA RAISON DE CE BLOC : un
    mode « Convention » ne s'enregistrait pas EN PRODUCTION — la
    contrainte `modes_exercice_dates_coherentes`, écrite à la migration
    nº 26, n'accepte des dates que pour le genre 'guest' ; une ligne
    'convention' datée était refusée par PostgreSQL. Les bancs des
    passes 750 à 753 étaient TOUS VERTS sur ce parcours : la doublure
    range ce qu'on lui donne, sans jamais rien vérifier. Le défaut ne
    pouvait pas s'y voir.
    CE QUE FAIT CE BLOC : il refuse, comme la vraie base, ce que les
    contraintes du dépôt refusent. Une doublure trop gentille valide
    des passes qui casseront en production ; c'est la leçon la plus
    chère de cette passe.
    ⚠️ ON NE RECOPIE QUE CE QUI EST ÉCRIT DANS `supabase/*.sql`, et le
    commentaire nomme le fichier : une contrainte inventée ici ferait
    échouer des bancs pour une règle qui n'existe nulle part.
    ⚠️ LE MESSAGE IMITE POSTGREST : « new row ... violates check
    constraint "..." ». C'est ce que le site lit et affiche.  */
const CONTRAINTES = {
  //  yokofolio-modes-et-liaisons.sql (nº 26), élargie par la nº 749
  //  (genres) puis la nº 754 (dates).
  modes_exercice: [
    {
      nom: "modes_exercice_genre_connu",
      tenue: (l) =>
        ["salon", "guest", "prive", "disponible", "convention", "independent"]
          .includes(l.genre),
    },
    {
      //  ⚠️ LA CONTRAINTE DU DÉFAUT DE LA nº 754. Elle est écrite ici
      //  DANS SON ÉTAT CORRIGÉ (`yokofolio-dates-convention.sql`) : le
      //  banc éprouve donc la base telle qu'elle sera une fois le SQL
      //  collé. Avec l'ancienne, la ligne 'convention' est refusée —
      //  c'est exactement ce que le propriétaire a vécu.
      nom: "modes_exercice_dates_coherentes",
      tenue: (l) => {
        /*  ⚠️ LE CRAN `CONTRAINTE_DATES=ancienne` REJOUE LA BASE D'AVANT
            LE CORRECTIF — celle de la migration nº 26, où SEUL 'guest'
            porte des dates. C'est la base que le propriétaire avait
            sous les yeux quand sa convention a disparu, et c'est ce
            cran qui permet de le PROUVER au banc plutôt que de le
            raconter. Éteint (le défaut), la doublure applique la règle
            corrigée de `yokofolio-dates-convention.sql`. */
        const genresDates =
          process.env.CONTRAINTE_DATES === "ancienne"
            ? ["guest"]
            : ["guest", "convention"];
        if (genresDates.includes(l.genre)) {
          return Boolean(l.debut_le && l.fin_le && l.fin_le >= l.debut_le);
        }
        return l.debut_le == null && l.fin_le == null;
      },
    },
    {
      nom: "modes_exercice_situe",
      tenue: (l) =>
        l.salon_id != null || (l.latitude != null && l.longitude != null),
    },
    {
      //  yokofolio-role-studio-prive.sql
      nom: "modes_exercice_role_coherent",
      tenue: (l) =>
        (l.genre === "salon" && l.role != null) ||
        l.genre === "prive" ||
        l.role == null,
    },
    {
      //  yokofolio-nature-lieu-guest.sql
      nom: "modes_exercice_nature_connue",
      tenue: (l) => l.nature_lieu == null || ["salon", "prive"].includes(l.nature_lieu),
    },
    {
      //  yokofolio-conventions-et-independent.sql (nº 749)
      nom: "modes_exercice_statut_connu",
      tenue: (l) =>
        l.statut == null ||
        [
          "guest_spots_only",
          "conventions_only",
          "guest_spots_and_conventions",
          "on_break",
          "available_on_request",
        ].includes(l.statut),
    },
  ],
  //  yokofolio-conventions-et-independent.sql (nº 749) : `propose` et
  //  `code_pays` sont NOT NULL dès la demande — le propriétaire l'a
  //  rappelé à la nº 754, et la doublure l'ignorait.
  conventions: [
    {
      nom: "conventions_propose_non_nul",
      tenue: (l) => typeof l.propose === "string" && l.propose.trim() !== "",
    },
    {
      nom: "conventions_code_pays",
      tenue: (l) => typeof l.code_pays === "string" && /^[A-Z]{2}$/.test(l.code_pays),
    },
  ],
};

/** Ce que la vraie base refuserait — le nom de la contrainte, ou null.
    ⚠️ SEULES LES TABLES CONNUES SONT VÉRIFIÉES : ailleurs, la doublure
    range comme avant, et aucun banc déjà rendu ne change. */
function contrainteViolee(table, ligne) {
  const regles = CONTRAINTES[table];
  if (!regles) return null;
  for (const regle of regles) {
    let tenue = false;
    try {
      tenue = regle.tenue(ligne);
    } catch {
      tenue = true; //  une règle qui jette ne doit pas bloquer un banc.
    }
    if (!tenue) return regle.nom;
  }
  return null;
}

function ranger(table, brut) {
  let lignes;
  try {
    lignes = JSON.parse(brut || "null");
  } catch {
    return [];
  }
  if (!lignes) return [];
  /*  §1 (nº 688) — LES DÉFAUTS DE COLONNE, comme la vraie base. La
      table des nouvelles déclare `creee_le timestamptz default now()` ;
      la doublure ne rangeait que ce qu'on lui donnait, et une
      notification fraîchement écrite s'affichait « Invalid Date » au
      banc. On cherche alors un défaut du site là où il n'y en a pas.
      ⚠️ ON N'INVENTE QUE CE QUE LE SCHÉMA PROMET : une date d'écriture,
      au moment de l'écriture. Rien d'autre. */
  const ajoutees = (Array.isArray(lignes) ? lignes : [lignes]).map((l, n) => ({
    id: l.id ?? `insere-${table}-${Date.now()}-${n}`,
    ...(table === "notifications_compte" && !l.creee_le
      ? { creee_le: new Date().toISOString() }
      : {}),
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

  /*  §1 (nº 688) — LE PRÉ-VOL DU NAVIGATEUR. Une requête portant
      `Authorization` ou `apikey` est « non simple » : le navigateur
      envoie d'abord un OPTIONS, et refuse la vraie si la réponse ne
      l'autorise pas. La doublure n'y répondait pas — ce qui passait
      inaperçu tant que TOUTES ses réponses étaient des 200 permissifs.
      Dès qu'une adresse a pu rendre autre chose (le 401 ci-dessous), le
      défaut est sorti : « blocked by CORS policy », et le menu du compte
      ne s'ouvrait plus au banc. */
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      //  ⚠️ nº 756 — `PUT` REJOINT LA LISTE. Le client du navigateur
      //  rafraîchit la session par un `PUT /auth/v1/user`
      //  (`auth.updateUser`) : la méthode manquait, le navigateur
      //  refusait la requête pour CORS, et la page recevait un
      //  « Failed to fetch » sans rapport avec ce qu'on éprouvait.
      //  Défaut d'outil, comme `ilike` à la nº 751.
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-max-age": "600",
    });
    res.end();
    return;
  }

  /*  ██ §1 (nº 689) — CE QU'IL FAUT POUR ÉPROUVER LA SAUVEGARDE ██
      ------------------------------------------------------------------
      L'outil `outils/sauvegarde` demande à la base TROIS choses que la
      doublure ne savait pas dire. Elles sont ajoutées ici, au plus
      simple, pour qu'un banc puisse le faire tourner en entier :
       · LA LISTE DES TABLES. PostgREST publie à sa racine un document
         qui décrit ce qu'il expose ; on en rend la seule partie que
         l'outil lit — `paths`, une entrée par table.
       · LES COMPTES (`/auth/v1/admin/users`) — deux comptes de
         démonstration, assez pour vérifier que le fichier se remplit.
       · LE STOCKAGE : un panier, trois fichiers, et leur contenu.
      ⚠️ AUCUN DE CES TROIS N'EST LU PAR LE SITE. Ils n'existent que
      pour le banc de la sauvegarde ; rien de ce qui tournait avant ne
      les rencontre. */
  if (u.pathname === "/rest/v1/" || u.pathname === "/rest/v1") {
    const paths = {};
    for (const nom of Object.keys(TABLES)) paths[`/${nom}`] = {};
    res.writeHead(200, {
      "content-type": "application/openapi+json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify({ swagger: "2.0", paths }));
    return;
  }
  /*  ██ nº 756 — UN COMPTE PAR SON IDENTIFIANT ██
      -------------------------------------------------------------
      DÉFAUT D'OUTIL, PAS DU SITE. Les écrans d'administration relisent
      l'adresse de courriel du demandeur (`auth.admin.getUserById`,
      styles nº 122 et conventions nº 756) : c'est un
      `GET /auth/v1/admin/users/<id>`, que la doublure ne connaissait
      pas — elle ne savait rendre que LA LISTE. La requête tombait donc
      sur le 404 générique, et la ligne s'affichait « compte supprimé »
      alors que le compte existe.
      ⚠️ UN COMPTE INCONNU REND 404 AVEC UN CORPS VIDE, comme la vraie
      API : c'est ce que le site doit savoir traverser — il n'affiche
      alors pas d'adresse, sans casser la liste.
      ⚠️ LE COMPTE DE BANC EST AJOUTÉ À LA VOLÉE : les bancs se
      connectent avec l'identifiant qu'ils veulent (le jeton est
      fabriqué), et la liste ci-dessus n'en connaît que deux. Rendre
      l'adresse d'administration pour tout identifiant inconnu ferait
      mentir la doublure ; on rend donc 404, et les bancs qui ont
      besoin d'un courriel posent le compte eux-mêmes (POST sur la
      liste). */
  if (u.pathname.startsWith("/auth/v1/admin/users/")) {
    const cherche = decodeURIComponent(u.pathname.split("/").pop() ?? "");
    const compte = COMPTES_DOUBLURE.find((c) => String(c.id) === cherche);
    console.log(
      new Date().toISOString().slice(11, 19),
      "GET auth/admin/users/<id> →", compte ? compte.email : "404"
    );
    res.writeHead(compte ? 200 : 404, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify(compte ? { ...compte, aud: "authenticated" } : {}));
    return;
  }
  if (u.pathname === "/auth/v1/admin/users") {
    /*  §2 (nº 690) — LA CRÉATION D'UN COMPTE, pour éprouver
        `restaurer-comptes`. La vraie API refuse une adresse déjà prise
        par un 422 ; on fait pareil, c'est ce que l'outil doit
        rencontrer s'il s'y trompait. */
    if (req.method === "POST") {
      let demande = {};
      try { demande = JSON.parse(brut || "{}"); } catch { demande = {}; }
      const adresse = String(demande.email ?? "").trim().toLowerCase();
      const deja = COMPTES_DOUBLURE.some(
        (c) => String(c.email).toLowerCase() === adresse
      );
      if (!adresse || deja) {
        console.log(
          new Date().toISOString().slice(11, 19),
          "POST auth/admin/users →", deja ? "422 (adresse prise)" : "422 (sans adresse)"
        );
        res.writeHead(422, { "content-type": "application/json" });
        res.end(JSON.stringify({ message: "User already registered" }));
        return;
      }
      const compte = {
        //  Le cran `IGNORER_ID` fabrique le cas silencieux : la base
        //  garde SON identifiant, pas celui qu'on lui donne.
        id: IGNORER_ID || !demande.id
          ? `neuf-${Date.now()}-${COMPTES_DOUBLURE.length}`
          : String(demande.id),
        email: demande.email,
        created_at: new Date().toISOString(),
        last_sign_in_at: null,
        user_metadata: demande.user_metadata ?? {},
        app_metadata: demande.app_metadata ?? {},
      };
      COMPTES_DOUBLURE.push(compte);
      console.log(
        new Date().toISOString().slice(11, 19),
        "POST auth/admin/users ← créé", compte.email, compte.id
      );
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(compte));
      return;
    }
    console.log(
      new Date().toISOString().slice(11, 19),
      "GET auth/admin/users →", COMPTES_DOUBLURE.length
    );
    res.writeHead(200, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify({ users: COMPTES_DOUBLURE, aud: "authenticated" }));
    return;
  }
  if (u.pathname === "/storage/v1/bucket") {
    res.writeHead(200, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify([{ id: PANIER, name: PANIER, public: true }]));
    return;
  }
  if (u.pathname.startsWith(`/storage/v1/object/list/`)) {
    let prefixe = "";
    try { prefixe = JSON.parse(brut || "{}").prefix ?? ""; } catch { prefixe = ""; }
    //  L'API rend UN NIVEAU à la fois : les fichiers du préfixe, et
    //  les dossiers en dessous — ces derniers SANS identifiant.
    const dedans = FICHIERS_STOCKAGE
      .filter((c) => (prefixe ? c.startsWith(prefixe + "/") : true))
      .map((c) => (prefixe ? c.slice(prefixe.length + 1) : c));
    const vus = new Set();
    const corps = [];
    for (const reste of dedans) {
      const [tete, ...suite] = reste.split("/");
      if (vus.has(tete)) continue;
      vus.add(tete);
      corps.push(
        suite.length === 0
          ? { name: tete, id: `objet-${tete}`, metadata: { size: 32 } }
          : { name: tete, id: null }
      );
    }
    /*  §1 (nº 692) — `limit` ET `offset` SONT HONORÉS. Le vrai
        stockage plafonne ses listes (cent par défaut côté client) ;
        sans ce plafond ici, la pagination de la nº 692 (R4) ne pouvait
        pas être éprouvée — un dossier de cent cinquante fichiers
        rentrait d'un coup, et le défaut restait invisible. */
    let combien = corps.length;
    let debut = 0;
    try {
      const demande = JSON.parse(brut || "{}");
      if (Number.isFinite(demande.limit)) combien = Number(demande.limit);
      if (Number.isFinite(demande.offset)) debut = Number(demande.offset);
    } catch { /* corps vide */ }
    const page = corps.slice(debut, debut + combien);
    console.log(
      new Date().toISOString().slice(11, 19),
      "POST storage/list", prefixe || "(racine)",
      `→ ${page.length}/${corps.length}`
    );
    res.writeHead(200, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify(page));
    return;
  }

  /*  ██ §1 (nº 692) — DÉPOSER ET EFFACER DES FICHIERS ██
      ------------------------------------------------------------------
      La doublure savait LISTER et SERVIR ; elle ne savait ni ranger ni
      retirer. C'était juste assez pour la sauvegarde (nº 689), pas pour
      éprouver un MÉNAGE : sans effacement réel, « les fichiers du
      portfolio partent, ceux des autres restent » n'est pas une mesure,
      c'est une espérance.
      DEUX VERBES, comme la vraie API :
       · `POST   /storage/v1/object/<seau>/<chemin>` dépose ;
       · `DELETE /storage/v1/object/<seau>` avec `{ prefixes: [...] }`
         retire, et rend CE QU'IL A VRAIMENT RETIRÉ — c'est cette
         différence-là que le site compte comme « déjà absent ». */
  if (u.pathname === `/storage/v1/object/${PANIER}` && req.method === "DELETE") {
    let demandes = [];
    try { demandes = JSON.parse(brut || "{}").prefixes ?? []; } catch { demandes = []; }
    const retires = [];
    for (const chemin of Array.isArray(demandes) ? demandes : []) {
      const rang = FICHIERS_STOCKAGE.indexOf(chemin);
      if (rang >= 0) {
        FICHIERS_STOCKAGE.splice(rang, 1);
        retires.push({ name: chemin });
      }
    }
    console.log(
      new Date().toISOString().slice(11, 19),
      "DELETE storage ←", `${retires.length}/${(demandes ?? []).length}`,
      "· reste", FICHIERS_STOCKAGE.length
    );
    res.writeHead(200, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify(retires));
    return;
  }
  if (
    u.pathname.startsWith(`/storage/v1/object/${PANIER}/`) &&
    (req.method === "POST" || req.method === "PUT")
  ) {
    const chemin = decodeURIComponent(
      u.pathname.slice(`/storage/v1/object/${PANIER}/`.length)
    );
    if (!FICHIERS_STOCKAGE.includes(chemin)) FICHIERS_STOCKAGE.push(chemin);
    console.log(
      new Date().toISOString().slice(11, 19),
      "POST storage ← rangé", chemin, "· total", FICHIERS_STOCKAGE.length
    );
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ Key: `${PANIER}/${chemin}` }));
    return;
  }
  if (u.pathname.startsWith(`/storage/v1/object/${PANIER}/`)) {
    const chemin = decodeURIComponent(
      u.pathname.slice(`/storage/v1/object/${PANIER}/`.length)
    );
    if (!FICHIERS_STOCKAGE.includes(chemin)) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "Object not found" }));
      return;
    }
    res.writeHead(200, {
      "content-type": "image/svg+xml",
      "access-control-allow-origin": "*",
    });
    res.end(`<svg xmlns="http://www.w3.org/2000/svg"><!-- ${chemin} --></svg>`);
    return;
  }

  /**
   * §2 (nº 703) — OUVRIR UNE SESSION POUR DE VRAI.
   * ------------------------------------------------------------------
   * POURQUOI ELLE ARRIVE MAINTENANT. La nº 703 ne charge la
   * bibliothèque du client QUE si un cookie de session existe. La
   * question qui décide de cette écriture est donc : « après une
   * connexion faite DANS le document, l'en-tête se met-il à jour ? »
   * On ne peut y répondre qu'en se connectant réellement — d'où cette
   * route, que la doublure ne connaissait pas.
   * ⚠️ AUCUN MOT DE PASSE N'EST VÉRIFIÉ, et il ne faut pas s'en
   * étonner : la doublure ne garde aucun compte. Elle rend une session
   * bien formée pour l'adresse demandée, c'est tout ce que le banc a
   * besoin d'éprouver. Elle ne sert JAMAIS en production.
   */
  /**
   * ██ §1 (nº 783) — LE DÉPART CHEZ GOOGLE ██
   * ------------------------------------------------------------------
   * C'est ici que le client Supabase envoie le navigateur quand on
   * touche « Continuer avec Google » : le vrai service redirige alors
   * vers Google, qui redirige vers le service, qui redirige ENFIN vers
   * le site avec un code.
   * LA DOUBLURE COUPE AU PLUS COURT — elle renvoie directement à
   * l'adresse demandée (`redirect_to`) avec un code : ce que le banc
   * doit éprouver, c'est CE QUE LE SITE FAIT DU RETOUR, pas le voyage
   * chez Google.
   * ⚠️ ELLE VÉRIFIE QUAND MÊME LE FOURNISSEUR ET L'ADRESSE : un
   * `provider` inconnu ou un `redirect_to` manquant sont refusés, comme
   * chez le vrai — sans quoi le banc validerait un appel qui échouerait
   * en vrai.
   */
  if (u.pathname === "/auth/v1/authorize") {
    const fournisseur = u.searchParams.get("provider");
    const retour = u.searchParams.get("redirect_to");
    if (fournisseur !== "google" || !retour) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "provider is not enabled" }));
      return;
    }
    /*  Le code porte le CAS À JOUER, pour que la sonde puisse demander
        un compte neuf ou un compte déjà connu (voir /auth/v1/token).
        ⚠️ « MIXTE » EST UN COMPTE EXISTANT (corrigé nº 787), et il ne
        peut pas être autre chose : un compte qui a DÉJÀ un mot de passe
        en plus de Google est, par définition, un compte que le site
        connaît. Il rendait jusqu'ici l'identifiant du compte NEUF —
        celui qui ne possède rien —, si bien qu'un banc lancé en
        `mixte` trouvait la liste des portfolios vide et ne pouvait pas
        éprouver le bloc « Supprimer ». */
    const cas =
      process.env.GOOGLE_COMPTE === "existant" ||
      process.env.GOOGLE_COMPTE === "mixte"
        ? "existant"
        : "neuf";
    const separateur = retour.includes("?") ? "&" : "?";
    const vers = `${retour}${separateur}code=code-google-${cas}`;
    console.log(
      new Date().toISOString().slice(11, 19),
      "GET auth/authorize google →", cas
    );
    res.writeHead(302, { location: vers });
    res.end();
    return;
  }

  if (u.pathname === "/auth/v1/token" && req.method === "POST") {
    let courriel = "banc@yokofolio.test";
    let codeRecu = "";
    let jetonDeReprise = "";
    try {
      const corps = JSON.parse(brut || "{}");
      courriel = corps.email ?? courriel;
      codeRecu = corps.auth_code ?? corps.code ?? "";
      jetonDeReprise = corps.refresh_token ?? "";
    } catch { /* corps vide */ }
    /*  §3 (nº 783) — LE RENOUVELLEMENT DE SESSION. `delierGoogle`
        l'appelle juste après avoir retiré une identité, et c'est LUI
        qui réécrit le cookie : sans lui, l'écran continuerait d'annoncer
        Google. La doublure doit donc rendre LA MÊME PERSONNE qu'à
        l'ouverture — d'où le carnet `SESSIONS` — avec ses fournisseurs
        RECALCULÉS (le délié en moins).
        ⚠️ SANS CE BRANCHEMENT, un renouvellement retombait sur les
        valeurs par défaut du bloc suivant : le compte Google devenait
        un compte e-mail au premier rafraîchissement. */
    if (u.searchParams.get("grant_type") === "refresh_token") {
      const connu = SESSIONS.get(jetonDeReprise);
      if (!connu) {
        res.writeHead(400, {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        });
        res.end(JSON.stringify({ error: "invalid_grant", error_description: "Invalid Refresh Token" }));
        return;
      }
      console.log(
        new Date().toISOString().slice(11, 19),
        "POST auth/token (reprise) →", connu.courriel,
        fournisseursDe(connu.identifiant, connu.metaApp).join("+") || "(aucun)"
      );
      res.writeHead(200, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(JSON.stringify(sessionDeBanc(connu)));
      return;
    }
    /*  §1 (nº 783) — L'ÉCHANGE DU CODE APRÈS GOOGLE. Le client
        l'appelle avec `grant_type=pkce` et le code reçu ; la session
        rendue doit alors porter GOOGLE comme fournisseur, sans quoi le
        banc ne pourrait pas distinguer les deux chemins d'entrée.
        · « neuf »     — un compte que le site n'a jamais vu ;
        · « existant » — celui du décor, qui revient se connecter. */
    const parGoogle =
      u.searchParams.get("grant_type") === "pkce" ||
      codeRecu.startsWith("code-google-");
    const googleNeuf = codeRecu.endsWith("-neuf");
    if (parGoogle) courriel = googleNeuf ? "neuf@gmail.test" : "banc@yokofolio.test";
    /*  §1 (nº 790) — LE COMPTE ADMIN, POUR ÉPROUVER LE VERROU DE /dev.
        `COURRIEL_GOOGLE=<adresse>` fait entrer la doublure sous CETTE
        adresse-là. C'est le seul moyen d'ouvrir une session dont
        `estCourrielAdmin` dit oui : la liste des administrateurs est
        une constante du code (config/tatouage), pas une variable
        d'environnement. Sans ce réglage, rien ne change. */
    if (parGoogle && process.env.COURRIEL_GOOGLE) {
      courriel = process.env.COURRIEL_GOOGLE;
    }
    const identifiant = parGoogle && googleNeuf
      ? "eeee0000-0000-4000-8000-00000goog999"
      : "eeee0000-0000-4000-8000-0000000ent03";
    /*  §3 (nº 783) — LE COMPTE MIXTE, celui qui a LES DEUX moyens
        d'entrer. C'est le seul sur lequel « Délier » a le droit
        d'apparaître, donc le seul qui permette de l'éprouver.
        Il s'ouvre par `GOOGLE_COMPTE=mixte`. */
    const metaApp = parGoogle
      ? process.env.GOOGLE_COMPTE === "mixte"
        ? { provider: "google", providers: ["google", "email"] }
        : { provider: "google", providers: ["google"] }
      : { provider: "email", providers: ["email"] };
    console.log(
      new Date().toISOString().slice(11, 19),
      "POST auth/token →", courriel
    );
    res.writeHead(200, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify(sessionDeBanc({ identifiant, courriel, metaApp })));
    return;
  }

  /**
   * ██ §3 (nº 783) — LIER UNE IDENTITÉ (départ) ██
   * ------------------------------------------------------------------
   * `linkIdentity` ne redirige pas elle-même : elle DEMANDE l'adresse
   * ici, en JSON, puis le navigateur s'y rend. On rend donc l'adresse
   * de notre propre `/authorize`, qui joue le rôle de Google.
   * ⚠️ ELLE EXIGE UNE SESSION, comme la vraie : lier, c'est ajouter à
   * un compte — sans compte, il n'y a rien à quoi ajouter.
   */
  if (u.pathname === "/auth/v1/user/identities/authorize") {
    const personne = utilisateurDuJeton(req);
    if (!personne) {
      res.writeHead(401, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(JSON.stringify({ message: "invalid claim: missing sub claim" }));
      return;
    }
    const retour = u.searchParams.get("redirect_to") ?? "";
    const adresse =
      `http://127.0.0.1:3222/auth/v1/authorize` +
      `?provider=${encodeURIComponent(u.searchParams.get("provider") ?? "")}` +
      `&redirect_to=${encodeURIComponent(retour)}`;
    console.log(
      new Date().toISOString().slice(11, 19),
      "GET auth/identities/authorize →", u.searchParams.get("provider")
    );
    res.writeHead(200, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify({ url: adresse }));
    return;
  }

  /**
   * ██ §3 (nº 783) — DÉLIER UNE IDENTITÉ ██
   * ------------------------------------------------------------------
   * ⚠️ ELLE REFUSE LA DERNIÈRE, comme la vraie — et c'est le refus le
   * plus important du lot : un compte sans identité n'a plus de porte.
   * Le message est celui de Supabase, en anglais : le site doit savoir
   * le traduire (voir `traduire`, lib/connexion-google).
   */
  if (u.pathname.startsWith("/auth/v1/user/identities/") && req.method === "DELETE") {
    const personne = utilisateurDuJeton(req);
    if (!personne) {
      res.writeHead(401, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(JSON.stringify({ message: "invalid claim: missing sub claim" }));
      return;
    }
    const vise = decodeURIComponent(u.pathname.split("/").pop() ?? "");
    const cible = (personne.identities ?? []).find((une) => une.identity_id === vise);
    if (!cible) {
      res.writeHead(404, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(JSON.stringify({ message: "Identity not found" }));
      return;
    }
    if ((personne.identities ?? []).length <= 1) {
      res.writeHead(422, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(JSON.stringify({ message: "User must have at least 1 identity after unlinking" }));
      return;
    }
    DELIEES.add(cleDeliee(personne.id, cible.provider));
    console.log(
      new Date().toISOString().slice(11, 19),
      "DELETE auth/identities →", cible.provider, "retiré"
    );
    res.writeHead(200, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end("{}");
    return;
  }

  //  §1 (nº 688) — QUI EST CONNECTÉ. Voir la note de `utilisateurDuJeton`.
  if (u.pathname === "/auth/v1/user") {
    const personne = utilisateurDuJeton(req);
    console.log(
      new Date().toISOString().slice(11, 19),
      "GET auth/user →", personne?.email ?? "(aucun jeton)"
    );
    //  ⚠️ LE REFUS PORTE LES MÊMES EN-TÊTES QUE L'ACCEPTATION : sans
    //  eux, le navigateur ne lit même pas le 401 — il annonce une
    //  erreur de CORS, et l'on cherche la panne au mauvais endroit.
    res.writeHead(personne ? 200 : 401, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(
      JSON.stringify(
        personne ?? { message: "invalid claim: missing sub claim" }
      )
    );
    return;
  }

  const table = u.pathname.replace(/^\/rest\/v1\//, "");

  /*  §1 (nº 690) — LA TABLE QUI NE RÉPOND JAMAIS. On garde la requête
      ouverte, sans rien écrire — comme `MUETTE`, mais pour UNE table.
      C'est le blocage exact que le propriétaire a subi, réduit à ce
      qu'il faut pour l'éprouver. */
  if (TABLE_MUETTE && table === TABLE_MUETTE) {
    console.log(
      new Date().toISOString().slice(11, 19),
      req.method, table, "→ (muette, aucune réponse)"
    );
    return;
  }

  /*  §1 (nº 688) — UNE SUPPRESSION SUPPRIME POUR DE BON. Sans cela, une
      décision d'administration qui efface une fiche rendait 200 et la
      fiche restait : la relecture de l'écran la remontrait, et le banc
      ne pouvait pas distinguer « effacé » de « ignoré ». On retire les
      lignes que les filtres désignent, et l'on rend celles qu'on vient
      de retirer — ce que fait PostgREST. */
  /*  ██ §1 (nº 696) — LA DOUBLURE SAIT ENFIN MODIFIER ██
      ------------------------------------------------------------------
      CE QUI MANQUAIT, ET DEPUIS QUAND. La nº 694 l'avait noté sans le
      corriger : « la doublure n'a pas de PATCH » — son banc retirait
      donc la fiche et la reposait pour en changer l'état. Ça suffisait
      tant qu'on ne mesurait que des LECTURES. La nº 696, elle, repose
      tout entière sur un `update` : la suppression de l'administration
      n'efface plus rien, elle POSE DEUX DATES. Sans PATCH, il n'y a
      rien à prouver.
      ⚠️ IL PARTAGE SES FILTRES AVEC `DELETE`, mot pour mot — la même
      boucle, la même liste `eq`/`neq`/`in` (nº 695). Deux écritures
      auraient divergé, et celle qui se trompe de filtre modifie des
      lignes qu'on n'a pas visées : le pire des mensonges de banc.
      ⚠️ ET IL REND LES LIGNES MODIFIÉES, comme PostgREST après
      `.select()`. */
  if (req.method === "PATCH" || req.method === "DELETE") {
    const efface = req.method === "DELETE";
    let modifications = {};
    if (!efface) {
      try { modifications = JSON.parse(brut || "{}"); } catch { /* corps vide */ }
    }
    const restantes = [];
    const parties = [];
    for (const ligne of TABLES[table] ?? []) {
      let vise = true;
      for (const [cle, val] of u.searchParams) {
        if (["select", "order", "limit", "offset"].includes(cle)) continue;
        /*  ██ §2 (nº 695) — `neq` ET `in` VALENT ICI AUSSI ██
            LE PIÈGE, ET IL A DÉJÀ MORDU (nº 692, du côté des lectures) :
            un filtre que la doublure ne SAIT PAS lire, elle l'ignore —
            et une suppression qui ignore un filtre supprime PLUS LARGE
            que demandé. Un « efface toutes les bienvenues SAUF la plus
            ancienne » (`id=neq.…`) les effaçait donc TOUTES, et le banc
            aurait prouvé le contraire de la vérité.
            ⚠️ AUCUN RELEVÉ ANCIEN N'EN DÉPEND : les trois bancs qui
            suppriment (nº 688, 692, 694) ne visent que par `eq`. Et un
            banc ne peut de toute façon pas dépendre d'un effacement
            TROP LARGE. Pas de cran, donc : c'est une correction.
            ██ §1 (nº 750) — `not.` VAUT ICI AUSSI, ET C'ÉTAIT LE TROU ██
            LA MÊME LEÇON, QUATRIÈME FOIS — et cette fois du côté des
            ÉCRITURES, là où elle coûte le plus cher. La lecture honore
            `not.` depuis la nº 696 ; la suppression, non. Or c'est
            EXACTEMENT la forme du garde-fou qui protège les modes
            d'exercice déjà enregistrés (`lib/enregistrer-exercice` :
            « efface les lignes de cette fiche SAUF celles que l'écran
            va réécrire », `.not("id", "in", …)`). Filtre ignoré =
            suppression élargie : la doublure effaçait TOUS les modes de
            la fiche, et le banc de la nº 750 accusait le site d'avoir
            perdu un mode que le site avait, lui, correctement protégé.
            ⚠️ AUCUN RELEVÉ ANCIEN N'EN DÉPEND : aucun banc antérieur
            n'emploie `not.` en écriture (le seul appelant est
            l'enregistrement des modes, éprouvé pour la première fois
            ici). Pas de cran : c'est une correction. */
        const negation = /^not\.(.*)$/.exec(val);
        const brutFiltre = negation ? negation[1] : val;
        const m = /^(eq|neq|in)\.(.*)$/.exec(brutFiltre);
        if (!m) continue;
        const valeur = String(ligne[cle]);
        let correspond = true;
        if (m[1] === "eq") correspond = valeur === String(m[2]);
        if (m[1] === "neq") correspond = valeur !== String(m[2]);
        if (m[1] === "in") {
          const liste = m[2].replace(/^\(|\)$/g, "").split(",")
            .map((s) => s.replace(/^"|"$/g, ""));
          correspond = liste.includes(valeur);
        }
        //  La négation retourne la réponse, elle ne change rien d'autre :
        //  sans `not.`, le comportement est celui d'avant, au caractère.
        if (negation ? correspond : !correspond) vise = false;
      }
      /*  UN `PATCH` GARDE LA LIGNE, il la recouvre : les colonnes
          nommées prennent leur nouvelle valeur, les autres ne bougent
          pas. La ligne reste À SA PLACE dans la table — l'ordre de
          rangement ne doit pas changer sous un banc qui compte. */
      if (vise && !efface) Object.assign(ligne, modifications);
      (vise ? parties : restantes).push(ligne);
    }
    if (efface && TABLES[table]) TABLES[table] = restantes;
    console.log(
      new Date().toISOString().slice(11, 19),
      req.method, table, efface ? "← retiré" : "← modifié", parties.length
    );
    envoyer(res, parties);
    return;
  }
  //  UNE ÉCRITURE : on range, et l'on rend ce qu'on vient de ranger —
  //  c'est ce que PostgREST fait avec `.select()` après un `insert`.
  if (req.method === "POST" && !table.startsWith("rpc/")) {
    /*  nº 754 — LA VÉRIFICATION AVANT LE RANGEMENT : une ligne que la
        vraie base refuserait ne doit pas entrer ici non plus. On répond
        comme PostgREST — code 400, message qui NOMME la contrainte —
        pour que le site prenne exactement le chemin de production. */
    const refus = (() => {
      let lignes;
      try {
        lignes = JSON.parse(brut || "null");
      } catch {
        return null;
      }
      if (!lignes) return null;
      for (const ligne of Array.isArray(lignes) ? lignes : [lignes]) {
        const nom = contrainteViolee(table, ligne);
        if (nom) return nom;
      }
      return null;
    })();
    if (refus) {
      console.log(
        new Date().toISOString().slice(11, 19),
        "POST", table, "✖ REFUSÉ par", refus
      );
      //  Les mêmes en-têtes que `envoyer` — le navigateur du banc lit
      //  cette réponse depuis une autre origine.
      res.writeHead(400, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(
        JSON.stringify({
          code: "23514",
          message: `new row for relation "${table}" violates check constraint "${refus}"`,
        })
      );
      return;
    }
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
  /*  ██ §2 (nº 696) — LA VUE `fiches_a_purger`, CALCULÉE ██
      Ce n'est pas une table : c'est un `select` sur `tatoueurs` où
      l'échéance est passée (migration nº 24). La doublure rendait donc
      une liste vide, et la purge nocturne n'effaçait jamais rien au
      banc — impossible de prouver le dernier temps de la nº 696.
      ⚠️ ELLE EST RECALCULÉE À CHAQUE LECTURE, comme une vraie vue : on
      pose une échéance dans le passé et elle apparaît, sans qu'on ait
      rien d'autre à ranger. */
  if (table === "fiches_a_purger") {
    const maintenant = Date.now();
    corps = (TABLES.tatoueurs ?? []).filter(
      (l) => l.purge_le && Date.parse(l.purge_le) <= maintenant
    );
  }
  if (table === "rpc/rechercher_tatoueurs") {
    let params = {};
    try { params = JSON.parse(brut || "{}"); } catch { /* corps vide */ }
    const style = params.p_style;
    /*  §1 (nº 745) — SOUS LE CRAN, LA RÉPONSE EST CELLE DE LA VRAIE
        FONCTION : des lignes ENVELOPPÉES `{ fiche, distance_km,
        total_resultats }`, et une fiche RÉDUITE aux champs qu'elle
        construit (ni booking, ni dm_instagram). C'est ce qui fait
        prendre au site son chemin de PRODUCTION (`rechercheEnBase`) :
        à plat, il ne reconnaît rien et repart par le chemin de secours
        — qui, lui, lit le booking, et cachait le réarrangement de la
        fenêtre superposée. Éteint : à plat, comme avant. */
    const photosMax = Number(params.p_photos_max ?? 0) || Infinity;
    corps = TATOUEURS.filter((l) => !style || l.styles.includes(style))
      .map((l, _i, tous) =>
        FICHE_PARTIELLE
          ? {
              fiche: {
                ...Object.fromEntries(
                  CHAMPS_FICHE_MOTEUR.filter((champ) => champ in l).map(
                    (champ) => [champ, l[champ]]
                  )
                ),
                //  La vraie fonction JOINT les photos (`galerie`,
                //  coalesce(g.photos)) : la doublure fait pareil,
                //  bornée à `p_photos_max` comme elle.
                galerie: (TABLES.photos_tatoueur ?? [])
                  .filter((p) => p.tatoueur_id === l.id)
                  .slice(0, photosMax),
              },
              distance_km: null,
              total_resultats: tous.length,
            }
          : { ...l, total: tous.length, distance_km: null }
      );
  } else {
    for (const [cle, val] of u.searchParams) {
      if (["select", "order", "limit", "offset"].includes(cle)) continue;
      //  §2 (nº 692) — `neq` REJOINT `eq` ET `in`, et le banc l'a
      //  réclamé : sans lui, un « tous les autres portfolios de cette
      //  personne » rendait AUSSI celui qu'on supprimait, et le ménage
      //  du stockage se croyait interdit d'effacer quoi que ce soit.
      /*  ██ §3 (nº 696) — `is` ET `not.` SONT HONORÉS À LEUR TOUR ██
          LA MÊME LEÇON QUE LA nº 692, TROISIÈME FOIS : un filtre que la
          doublure ne sait pas lire, elle l'ignore — et une lecture qui
          ignore un filtre rend PLUS LARGE que demandé. « Les portfolios
          dont l'échéance est posée » (`purge_le=not.is.null`) les
          rendait TOUS : l'écran des suppressions en cours aurait
          affiché le catalogue entier, et le banc l'aurait validé.
          ⚠️ AUCUN RELEVÉ ANCIEN N'EN DÉPEND : là où ces filtres étaient
          ignorés (nº 694, `.not("hors_ligne","is",true)`), le SITE
          refiltrait derrière en JavaScript (`estEnLigne`) — le résultat
          était déjà le bon, il l'est désormais pour la bonne raison.
          Pas de cran : c'est une correction. */
      const negation = /^not\.(.*)$/.exec(val);
      const brutFiltre = negation ? negation[1] : val;
      const estNul = /^is\.(.*)$/.exec(brutFiltre);
      if (estNul) {
        const attendu =
          estNul[1] === "null" ? null : estNul[1] === "true" ? true : false;
        corps = corps.filter((l) => {
          const valeurLigne = l[cle] ?? null;
          const egal = attendu === null ? valeurLigne === null : valeurLigne === attendu;
          return negation ? !egal : egal;
        });
        continue;
      }
      /*  ██ nº 751 — `ilike` (et `like`), ENFIN HONORÉS ██
          ------------------------------------------------------------------
          LE RELEVÉ, au banc du mode « Autre » : le champ de ville
          proposait LYON quoi qu'on tape — « Paris », « Bordeaux »,
          n'importe quoi. LA CAUSE ÉTAIT ICI, pas dans le site : le
          catalogue de villes cherche `ilike '%Paris%'` puis coupe à 64
          lignes ; la doublure ignorait le filtre, rendait les 64
          premières fiches — toutes de Lyon, le décor en pose 68 — et le
          site n'avait plus qu'elles à dédoublonner.
          `%` vaut « n'importe quoi », `_` vaut « un caractère » : c'est
          tout ce que PostgREST en attend. `ilike` ne regarde pas la
          casse, `like` si. Le reste du motif est échappé — un point ou
          une parenthèse dans un nom de ville ne doit pas devenir une
          expression régulière. */
      const motif = /^(ilike|like)\.(.*)$/.exec(brutFiltre);
      if (motif) {
        const regle = new RegExp(
          "^" +
            motif[2]
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
              .replace(/%/g, ".*")
              .replace(/_/g, ".") +
            "$",
          motif[1] === "ilike" ? "i" : ""
        );
        corps = corps.filter((l) => {
          const va = regle.test(String(l[cle] ?? ""));
          return negation ? !va : va;
        });
        continue;
      }
      const m = /^(eq|neq|in)\.(.*)$/.exec(brutFiltre);
      if (!m) continue;
      //  `not.eq.x` vaut `neq.x` — PostgREST accepte les deux formes.
      if (negation && m[1] === "eq") m[1] = "neq";
      if (m[1] === "eq" || m[1] === "neq") {
        const attendu = m[2] === "true" ? true : m[2] === "false" ? false : m[2];
        corps = corps.filter((l) =>
          m[1] === "eq"
            ? String(l[cle]) === String(attendu)
            : String(l[cle]) !== String(attendu)
        );
      } else {
        const liste = m[2].replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, ""));
        corps = corps.filter((l) => liste.includes(String(l[cle])));
      }
    }
  }
  /*  ██ §1 (nº 690) — `limit` ET `offset` SONT ENFIN HONORÉS ██
      ------------------------------------------------------------------
      ⚠️ LA nº 681 AVAIT ÉCARTÉ CETTE IDÉE, ET SA RAISON RESTE ENTIÈRE :
      « faire honorer `limit` à la doublure serait plus propre EN
      THÉORIE et dangereux en pratique » — la mosaïque de l'accueil se
      lit avec une limite, et le banc du bug des styles tourne dessus.
      CE QUI CHANGE, ET SEULEMENT ÇA : on n'honore ces deux paramètres
      QUE SI UN CRAN DE CETTE PASSE EST ALLUMÉ (`GRANDE_TABLE` ou
      `PLAFOND`). Éteints — c'est-à-dire pour tous les bancs déjà
      rendus —, la doublure répond comme avant, entièrement, et aucun
      relevé publié n'est invalidé.
      LE PLAFOND, LUI, EST LE PIÈGE DE LA VRAIE BASE : PostgREST ne rend
      jamais plus de `max-rows` lignes, même si l'on en demande mille.
      C'est ce qui faisait rendre une copie tronquée pour complète. */
  /*  §1 (nº 695) — LE TRI, AVANT LA COUPE. `order=creee_le.desc`, et
      plusieurs colonnes séparées par des virgules comme le fait
      PostgREST. On ne compare que des chaînes et des nombres : les
      dates ISO se classent déjà bien en chaîne, et c'est tout ce dont
      les bancs ont besoin. */
  const tri = TRI ? (u.searchParams.get("order") ?? "") : "";
  if (tri) {
    const clefs = tri.split(",").map((bout) => {
      const [colonne = "", ...options] = bout.trim().split(".");
      return { colonne, sens: options.includes("asc") ? 1 : -1 };
    });
    corps = [...corps].sort((a, b) => {
      for (const { colonne, sens } of clefs) {
        const x = a[colonne], y = b[colonne];
        if (x === y) continue;
        //  Une valeur absente part au bout, dans les deux sens — c'est
        //  le `nulls last` de PostgREST sur un tri descendant.
        if (x == null) return 1;
        if (y == null) return -1;
        return (x < y ? -1 : 1) * sens;
      }
      return 0;
    });
  }
  const total = corps.length;
  if (GRANDE_TABLE > 0 || PLAFOND > 0 || TRI) {
    const debut = Number(u.searchParams.get("offset") ?? 0) || 0;
    let combien = Number(u.searchParams.get("limit") ?? corps.length) || corps.length;
    if (PLAFOND > 0) combien = Math.min(combien, PLAFOND);
    corps = corps.slice(debut, debut + combien);
    //  `Prefer: count=exact` → la base annonce le total, comme la vraie.
    if ((req.headers.prefer ?? "").includes("count=exact")) {
      res.setHeader(
        "content-range",
        `${debut}-${Math.max(debut + corps.length - 1, debut)}/${total}`
      );
    }
  }
  console.log(
    new Date().toISOString().slice(11, 19), req.method, table, "→", corps.length,
    total !== corps.length ? `(sur ${total})` : ""
  );
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
    //  §2 (nº 689) — voir la note de `FAUX_TOTAL`. Éteint, cet en-tête
    //  n'existe pas et la doublure répond comme avant.
    ...(FAUX_TOTAL && Array.isArray(corps)
      ? { "content-range": `0-${Math.max(corps.length - 1, 0)}/9999` }
      : {}),
  });
  res.end(JSON.stringify(corps));
}

createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  let brut = "";
  req.on("data", (m) => { brut += m; });
  req.on("end", () => repondre(req, res, u, brut));
}).listen(3222, "127.0.0.1", () => console.log("doublure Supabase sur :3222"));
