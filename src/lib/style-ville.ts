import { cache } from "react";
import { CARTES_PAR_PAGE } from "@/config/tatouage";
import { listerTatoueurs, lireVilleParSlug, styleConnu } from "@/lib/tatoueurs";

/**
 * LA LECTURE D'UNE PAGE STYLE + VILLE, FAITE UNE SEULE FOIS
 * ==========================================================
 * « /tatouage/blackwork/lyon » a désormais TROIS lecteurs : les
 * métadonnées, l'image de partage et le corps de la page. Comme pour
 * une fiche (voir lib/fiche-lue), tout le monde appelle LA MÊME
 * instance de `cache`.
 *
 * ⚠️ ET CE N'EST VRAI QU'À MOITIÉ — MESURÉ, PAS SUPPOSÉ (nº 687) ██
 * ------------------------------------------------------------------
 * CETTE NOTE PROMETTAIT « trois lectures ramenées à une ». Une sonde
 * posée ici le temps d'un relevé (un journal et une pile d'appels, à
 * chaque entrée) dit autre chose : sur UN affichage de page, la
 * fonction est appelée DEUX FOIS, avec exactement les mêmes arguments
 * (`realisme lyon-1-0 1`), depuis deux endroits différents — une fois
 * par le corps de la page, une fois par la résolution des MÉTADONNÉES.
 * Le journal de la doublure le confirme : chacune des lectures de la
 * page y figure en double, à cinq millisecondes d'intervalle. Le
 * `cache` de React ne les réunit pas : dans cette version de Next,
 * `generateMetadata` ne se rend pas dans la même portée que la page.
 *
 * CE QUE ÇA COÛTE, EXACTEMENT : deux fois plus de requêtes envoyées à
 * la base pour un affichage — et PAS UNE MILLISECONDE de plus pour le
 * visiteur, parce que les deux partent ensemble et attendent la même
 * latence. C'est une facture de base de données, pas un temps
 * d'attente. C'est pourquoi la nº 687 ne l'a PAS corrigé : sa consigne
 * était la vitesse, et il n'y a ici aucune vitesse à gagner. Le jour où
 * l'on voudra la moitié de ces requêtes, il faudra une mémoire de
 * l'instant partagée entre les métadonnées et la page — ce que `cache`
 * était censé être — et cela se décide dans sa propre passe.
 *
 * Style inconnu ou ville absente : on rend un résultat vide plutôt
 * qu'une erreur. C'est l'appelant qui décide quoi en faire (page
 * introuvable pour la page, image de marque pour l'aperçu).
 */
export const chargerStyleVille = cache(
  async (styleSlug: string, villeSlug: string, page: number = 1) => {
    const vide = { style: "", ville: null, tatoueurs: [], demonstration: false, total: 0, page: 1 };
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
     * l'effet de bord : « /tatouage/realisme/ville-inconnue » — une
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

    const ville = await promesseVille;
    if (!ville) return { ...vide, style };

    const { tatoueurs, demonstration, total } = await promesseListe;
    return { style, ville, demonstration, tatoueurs, total, page: rang };
  }
);
