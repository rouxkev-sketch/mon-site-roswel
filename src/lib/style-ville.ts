import { CARTES_PAR_PAGE } from "@/config/tatouage";
import { listerTatoueurs, lireVilleParSlug, styleConnu } from "@/lib/tatoueurs";
import { MESSAGE_INDISPONIBLE } from "@/lib/catalogue-demonstration";
import { memoireCourte } from "@/lib/memoire-courte";

/**
 * LA LECTURE D'UNE PAGE STYLE + VILLE, FAITE UNE SEULE FOIS
 * ==========================================================
 * « /tattoo/blackwork/lyon » a désormais TROIS lecteurs : les
 * métadonnées, l'image de partage et le corps de la page. Comme pour
 * une fiche (voir lib/fiche-lue), tout le monde appelle LA MÊME
 * instance de `cache`.
 *
 * ██ §2 (nº 724) — LA MOITIÉ DES REQUÊTES, ET LE `cache` DE REACT EST
 * PARTI ██
 * ------------------------------------------------------------------
 * CE QUE LA nº 687 AVAIT MESURÉ, ET QUE CETTE PASSE A REMESURÉ AVANT DE
 * TOUCHER À QUOI QUE CE SOIT : sur UN affichage, la fonction est
 * appelée DEUX FOIS avec les mêmes arguments — une fois par le corps de
 * la page, une fois par la résolution des MÉTADONNÉES. Le journal de la
 * doublure le dit sans ambiguïté : 16 requêtes reçues pour 7 distinctes,
 * chaque ligne en double. Le `cache` de React ne les réunit pas — dans
 * cette version de Next, `generateMetadata` ne se rend pas dans la même
 * portée que la page. La nº 687 avait renoncé (sa consigne était la
 * vitesse, et il n'y a ici aucune vitesse à gagner : les deux partent
 * ensemble et attendent la même latence) ; le propriétaire demande
 * aujourd'hui la facture de base de données.
 *
 * CE QUI REMPLACE `cache`, ET POURQUOI CE MOTIF-LÀ : une MÉMOIRE COURTE
 * PAR CLÉ — exactement l'écriture de `lib/fiches-admin` (identifiants
 * administrateurs), déjà éprouvée dans le projet. Rien de neuf n'est
 * inventé.
 * ⚠️ ON MÉMORISE LA PROMESSE, PAS LE RÉSULTAT, et c'est tout le point :
 * les deux appels partent au même instant (cinq millisecondes d'écart,
 * mesuré nº 687). Une mémoire de RÉSULTATS arriverait trop tard — le
 * second appel serait déjà parti. En rangeant la promesse dès le
 * premier appel, le second se greffe dessus et n'envoie rien.
 * ⚠️ DIX SECONDES, ET PAS DAVANTAGE : c'est un pont entre deux appels
 * simultanés, pas un cache de données. La page porte DÉJÀ son cache,
 * et il est cent fois plus long (`revalidate = 300`) — ces dix secondes
 * ne peuvent donc rien montrer de plus périmé que ce que la page sert
 * déjà.
 * ⚠️ UNE PROMESSE REJETÉE N'EST JAMAIS GARDÉE : elle est retirée de la
 * mémoire, sans quoi une panne d'un instant se rejouerait dix secondes
 * durant pour tout le monde.
 *
 * Style inconnu ou ville absente : on rend un résultat vide plutôt
 * qu'une erreur. C'est l'appelant qui décide quoi en faire (page
 * introuvable pour la page, image de marque pour l'aperçu).
 * ⚠️ ET DEPUIS LA nº 724, LE VIDE DIT AUSSI POURQUOI : `indisponible`
 * distingue « cette combinaison n'existe pas » de « la base n'a pas
 * répondu ». Voir la page, qui n'en tire pas les mêmes conclusions.
 */
/*  §1 (nº 725) — LE MÉCANISME A DÉMÉNAGÉ dans `lib/memoire-courte`,
    sans changer d’un iota : `/search` en avait besoin à son tour, et
    deux copies auraient fini par diverger (piège nº 378). Le grand bloc
    qui l’explique vit là-bas, désormais. */
export const chargerStyleVille = memoireCourte(
  lireStyleVille,
  (styleSlug: string, villeSlug: string, page: number = 1) =>
    `${styleSlug} ${villeSlug} ${page}`
);

async function lireStyleVille(
  styleSlug: string,
  villeSlug: string,
  page: number = 1
) {
    const vide = {
      style: "",
      ville: null,
      tatoueurs: [],
      demonstration: false,
      total: 0,
      page: 1,
      /** La base n'a pas répondu — ce n'est PAS « ça n'existe pas ». */
      indisponible: false,
    };
    const style = styleConnu(styleSlug);
    if (!style) return vide;

    const rang = Math.max(Math.floor(page) || 1, 1);

    /**
     * ██ §2 (nº 687) — LES DEUX LECTURES PARTENT ENSEMBLE ██
     * ================================================================
     * CE QUI ÉTAIT MESURÉ. Le temps serveur de cette page suit une
     * droite ; on l'a relevé à quatre latences de base simulées —
     *      latence   0 ms →   56 ms
     *      latence  60 ms →  285 ms
     *      latence 120 ms →  524 ms
     *      latence 240 ms → 1006 ms
     * La pente vaut 3,96 : QUATRE lectures QUI S'ATTENDENT, et 56 ms de
     * calcul. Le journal de la doublure les nomme, dans l'ordre :
     *   1. `tatoueurs?ville_slug=eq.…&limit=1`  ← la ville, ci-dessous
     *   2. `popularite_tatoueurs` ∥ `rpc/rechercher_tatoueurs`
     *   3. `tatoueurs?select=…` (tout le catalogue)
     *   4. `modes_exercice` ∥ `studios` ∥ `equipe_salon` ∥ `photos_…`
     *
     * ⚠️ 3 ET 4 SONT UN ARTEFACT DU BANC, ET IL FAUT LE DIRE : la
     * doublure rend les lignes de `rechercher_tatoueurs` À PLAT, quand
     * la vraie fonction les rend enveloppées (`{ fiche, distance_km,
     * total_resultats }`). `rechercheEnBase` n'y reconnaît rien, rend
     * `null`, et `listerTatoueurs` reprend son CHEMIN DE SECOURS — d'où
     * ces deux étages en plus. EN PRODUCTION il n'y en a que DEUX : la
     * ville, puis la recherche. On ne corrige donc pas 3 et 4 : il n'y
     * a rien à corriger là où le vrai serveur ne passe pas.
     *
     * CE QUI EST CORRIGÉ, ET QUI EXISTE PARTOUT : l'étage 1 et l'étage 2
     * S'ATTENDAIENT SANS RAISON. La recherche ne demande RIEN à la
     * ville : elle reçoit `slugVille`, c'est-à-dire le morceau
     * d'adresse, pas un résultat de lecture (aucune coordonnée n'est
     * passée — cette page n'a pas de rayon, voir l'en-tête de la page).
     * Les deux partent donc ENSEMBLE, et deux allers-retours en série
     * deviennent un seul. C'est la leçon des nº 678 et nº 682.
     *
     * ⚠️ PAS DE `Promise.all`, ET C'EST UNE MESURE QUI L'A DÉCIDÉ. Le
     * premier jet attendait les deux d'un coup ; la fumée a montré
     * l'effet de bord : « /tattoo/realisme/ville-inconnue » — une
     * adresse qui finit en page introuvable — passait de UN aller-retour
     * à TROIS : 400 ms au banc au lieu de 145, parce qu'attendre les
     * deux, c'est attendre LE PLUS LONG. On rend donc la page
     * introuvable dès que la ville manque, sans attendre une liste dont
     * plus personne ne veut : le chemin fautif garde exactement son
     * coût d'avant, le bon chemin gagne son aller-retour. Aucun des
     * deux n'est perdant.
     *
     * ⚠️ ET LA PROMESSE LAISSÉE EN L'AIR NE PEUT PAS PARTIR EN FUMÉE —
     * c'est la condition sans laquelle ce départ anticipé serait un
     * piège, et c'est la même qu'à la nº 682 : `listerTatoueurs` avale
     * TOUS ses échecs (son corps entier est sous un `catch` qui rend la
     * démonstration ou le message d'indisponibilité). Elle ne rejette
     * jamais ; il n'y a donc aucun rejet à laisser échapper.
     *
     * ⚠️ CE QUE ÇA COÛTE, DIT FRANCHEMENT : sur une ville inconnue, la
     * recherche est bel et bien partie. Elle ne retient plus le
     * visiteur, mais la base la traite quand même — une requête qui n'y
     * trouve rien et répond vide. Le prix d'une adresse fautive contre
     * un aller-retour gagné sur toutes les autres.
     */
    const promesseVille = lireVilleParSlug(villeSlug);
    // ⚠️ LA VILLE ET LE STYLE SONT FILTRÉS EN BASE (passe
    // « performance ») : cette page ne charge plus le catalogue entier
    // pour en garder une poignée. `prioriserClics` garde le
    // comportement d'origine — une page de référencement montre les
    // tatoueurs LES PLUS CONSULTÉS de la ville, pas un tirage.
    const promesseListe = listerTatoueurs({
      style,
      slugVille: villeSlug,
      prioriserClics: true,
      limite: CARTES_PAR_PAGE,
      decalage: (rang - 1) * CARTES_PAR_PAGE,
    });

    const { ville, panne } = await promesseVille;
    //  §1 (nº 724) — LA DISTINCTION REMONTE JUSQU'ICI. Sans ville et
    //  sans panne : la combinaison n'existe pas. Sans ville MAIS en
    //  panne : on ne sait rien, et la page ne doit surtout pas conclure.
    if (!ville) return { ...vide, style, indisponible: panne };

    const { tatoueurs, demonstration, total, message } = await promesseListe;
    /*  §1 (nº 724) — LE SECOND TÉMOIN, et il ne coûte rien : la ville a
        pu être lue avant que la base ne flanche, ou la liste échouer
        seule. `listerTatoueurs` avale ses erreurs (nº 278) mais dit
        laquelle par son message — c'est le signal que le site emploie
        déjà partout ailleurs, on ne lui en invente pas un second. */
    return {
      style,
      ville,
      demonstration,
      tatoueurs,
      total,
      page: rang,
      indisponible: message === MESSAGE_INDISPONIBLE,
    };
}
