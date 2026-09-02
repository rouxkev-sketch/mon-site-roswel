/**
 * ██ §1 (nº 686) — LE DÉLAI DE GARDE DES LECTURES SUPABASE ██
 * ==================================================================
 * CE QUI EST ARRIVÉ, ET C'EST TOUTE LA RAISON DE CE FICHIER. Le
 * 27 août au soir, un incident passager côté base a rendu le site
 * INUTILISABLE : chargement infini sur toutes les pages, tous
 * appareils, tous navigateurs. Le code n'y était pour rien — le même
 * code redéployé se figeait pareil.
 *
 * LA CAUSE, NOMMÉE : aucune lecture Supabase n'avait de délai maximal.
 * `chargerStylesAjoutes()` est ATTENDU au début de chaque rendu
 * (nº 673) ; son `try/catch` attrape une ERREUR, pas une ATTENTE. Une
 * base qui ne répond pas n'échoue pas : elle fait attendre. La page
 * attendait donc jusqu'au délai de la fonction d'hébergement, c'est-à-
 * dire, vu du visiteur, indéfiniment.
 *
 * CE QUE CE FICHIER POSE : un `fetch` qui ABANDONNE au bout de dix
 * secondes. Écrit UNE fois, passé aux quatre fabriques de clients
 * (navigateur, serveur, serveur anonyme, administration) — pas une
 * copie par appel, pas un réglage à retenir à chaque nouvelle lecture.
 *
 * ⚠️ CE QUE ÇA CHANGE QUAND TOUT VA BIEN : RIEN. Une lecture qui
 * répond en 120 ms ne voit jamais ce minuteur. Le délai n'existe que
 * pour le jour où la base se tait.
 *
 * ⚠️ ET UN ABANDON N'EST PAS UNE PANNE : il lève, comme n'importe
 * quelle erreur réseau, et les appelants du site attrapent déjà —
 * `chargerStylesAjoutes` retombe sur les quarante et un styles du
 * code, `lirePopularite` sur une carte vide, `rechercheEnBase` sur son
 * ancien chemin. La page se rend DÉGRADÉE MAIS VIVANTE, ce qui était
 * exactement la demande.
 *
 * ⚠️ DIX SECONDES, ET POURQUOI PAS TROIS. Une lecture géographique
 * lente en production tient en une seconde et demie (relevé nº 678) ;
 * dix laissent une marge de six fois pour une base engorgée mais
 * vivante, tout en restant SOUS le délai des fonctions d'hébergement.
 * Trois secondes couperaient des lectures qui allaient aboutir — on
 * fabriquerait une panne pour en éviter une autre.
 */

/** Le délai maximal d'une lecture, en millisecondes. */
export const DELAI_LECTURE_MS = 10_000;

/**
 * ██ §2 (nº 686) — POURQUOI UN DÉLAI PAR REQUÊTE NE SUFFIT PAS ██
 * ==================================================================
 * MESURÉ, et c'est la surprise de la passe. Contre une base MUETTE (la
 * doublure en mode `MUETTE=1`), avec un délai de 3 secondes :
 *      · un `fetch` NU abandonne à 3 004 ms — le mécanisme marche ;
 *      · le CLIENT SUPABASE rend la main à 19 017 ms, après avoir
 *        appelé notre `fetch` QUATRE FOIS.
 * Le client RÉESSAIE. Un délai posé sur chaque tentative est donc
 * multiplié par le nombre de reprises — et encore par le nombre de
 * lectures que la page enchaîne. Avec dix secondes, la page attendait
 * toujours à quatre-vingt-dix secondes : exactement la panne qu'on
 * croyait avoir réparée.
 *
 * D'OÙ LE DISJONCTEUR. Dès qu'une lecture EXPIRE, on retient que la
 * base est muette pendant quelques secondes : toutes les suivantes
 * échouent AUSSITÔT, sans attendre. La page paie donc UN délai en
 * tout — pas un par tentative, pas un par lecture — et se rend
 * dégradée en une dizaine de secondes.
 *
 * ⚠️ IL SE DÉCLENCHE SUR LE TEMPS ÉCOULÉ, PAS SUR LE NOM DE L'ERREUR,
 * et c'est une leçon payée au banc. J'avais écrit
 * `erreur.name === "TimeoutError"` : le `fetch` de Node enveloppe
 * l'abandon dans un `TypeError: fetch failed` et range la vraie cause
 * en dessous — le test était donc TOUJOURS FAUX, et le disjoncteur ne
 * s'ouvrait presque jamais. Ce qui définit un silence n'est pas
 * l'étiquette de l'erreur, c'est d'avoir ATTENDU longtemps pour rien :
 * une lecture qui échoue après plus de la moitié du délai est un
 * silence, quel que soit le nom qu'on lui donne.
 * ⚠️ ET UNE ERREUR ORDINAIRE NE L'OUVRE PAS. Un 404, un 401, un refus
 * de nom : tout cela revient en quelques millisecondes, donc bien en
 * deçà du seuil. On ne coupe jamais sur une réponse rapide.
 * ⚠️ VINGT SECONDES, ET LE CHIFFRE EST MESURÉ, PAS CHOISI. Avec CINQ,
 * la page tenait encore soixante-dix-huit secondes : les reprises de
 * supabase-js s'espacent de plus de cinq secondes, la fenêtre se
 * refermait entre deux, et chaque tentative repayait un délai plein.
 * Vingt couvre les reprises ET la fin d'un rendu — la page se rend
 * alors en une dizaine de secondes, ce qui était la demande.
 * ⚠️ IL SE REFERME TOUT SEUL. Passé la fenêtre, la lecture suivante
 * retente pour de bon : une base qui revient est reprise SANS
 * INTERVENTION. Le prix, dit franchement : jusqu'à vingt secondes
 * après son retour, une page peut encore se rendre dégradée. C'est
 * l'échange qu'on accepte pour ne plus jamais figer.
 * ⚠️ IL NE GARDE AUCUNE DONNÉE. Ce n'est pas un cache : il ne ressert
 * jamais une réponse, il se contente de ne pas attendre. Rien de
 * périmé ne peut en sortir.
 */
const FENETRE_MUETTE_MS = 20_000;

/** L'instant jusqu'auquel on tient la base pour muette. */
let muetteJusqua = 0;

/**
 * LA BASE A-T-ELLE EXPIRÉ IL Y A PEU ? — et la fenêtre REPART à chaque
 * fois qu'on répond oui.
 * ⚠️ CE DÉTAIL DÉCIDE DE TOUT, et il a été mesuré. Sans lui, la fenêtre
 * courait depuis la PREMIÈRE expiration : elle se refermait AU MILIEU
 * d'un rendu, et la lecture suivante repayait dix secondes pleines.
 * Relevé : « /recherche » tenait encore 41 s. En la faisant repartir à
 * chaque échec instantané, le disjoncteur reste ouvert tant que la page
 * demande — donc jusqu'à la fin du rendu — et la page se rend en une
 * dizaine de secondes.
 * ⚠️ IL NE PEUT PAS RESTER OUVERT POUR TOUJOURS : il faut, pour cela,
 * des lectures sans le moindre trou de vingt secondes. Une page rendue
 * cesse de demander ; la fenêtre expire donc juste après, et la
 * visite suivante retente pour de bon.
 */
function baseTenuePourMuette(): boolean {
  if (Date.now() >= muetteJusqua) return false;
  muetteJusqua = Date.now() + FENETRE_MUETTE_MS;
  return true;
}

/** Une lecture vient d'expirer : on ouvre la fenêtre. */
function noterLeSilence(): void {
  muetteJusqua = Date.now() + FENETRE_MUETTE_MS;
}

/**
 * ⚠️ POUR LE BANC UNIQUEMENT — remettre le disjoncteur à zéro. Deux
 * épreuves qui se suivent dans le même processus ne doivent pas hériter
 * du silence de la précédente. Rien dans le site n'appelle ceci.
 */
export function oublierLeSilence(): void {
  muetteJusqua = 0;
}

/**
 * ██ §3 (nº 686) — ON REND UN REFUS, ON NE LÈVE PAS D'ERREUR ██
 * ==================================================================
 * LA DERNIÈRE CAUSE, ET ELLE NE SE VOYAIT QU'AUX HORODATAGES. Le
 * disjoncteur du §2 coupait bien : une seule attente de dix secondes,
 * puis dix-sept lectures tranchées à l'instant. Et la page mettait
 * pourtant vingt-huit secondes de plus. Les heures des coupures l'ont
 * dit — écarts de 1 s, puis 2 s, puis 4 s, trois fois de suite :
 *
 *      popularite_tatoueurs   16794 · 17795 · 19798 · 23800
 *      clics_tatoueurs        23801 · 24802 · 26804 · 30805
 *      tatoueurs (styles)     30807 · 31808 · 33811 · 37816
 *
 * supabase-js REESSAIE AVEC UN DÉLAI CROISSANT quand le `fetch` LÈVE.
 * Couper la requête ne coupe pas L'ATTENTE ENTRE DEUX TENTATIVES :
 * sept secondes par lecture, trois lectures, vingt et une secondes.
 *
 * LE REMÈDE : ne pas lever. Un `fetch` qui LÈVE ressemble à une panne
 * de réseau, et une panne de réseau, ça se retente. Un `fetch` qui REND
 * UNE RÉPONSE — fût-elle un 503 — est une réponse du serveur : le
 * client la transmet à l'appelant SANS INSISTER. L'erreur remonte
 * aussitôt aux `try/catch` du site, qui dégradent comme prévu.
 *
 * ⚠️ ET LE CODE EST UN 400, PAS UN 503 — encore une leçon des
 * horodatages. Avec 503, les GET étaient TOUJOURS réessayés (1 s, 2 s,
 * 4 s), seul le POST du RPC ne l'était pas : la politique de reprise
 * vise les erreurs SERVEUR, qu'on suppose passagères. Un 400 dit « ta
 * demande ne passera pas », et personne ne retente cela. C'est le seul
 * code qui arrête net la cascade.
 * ⚠️ LE CORPS EST DU JSON D'ERREUR POSTGREST, pas une page vide : c'est
 * ce que les clients savent lire, et cela leur évite d'échouer une
 * seconde fois en analysant la réponse.
 */
function REPONSE_BASE_MUETTE(): Response {
  return new Response(
    JSON.stringify({
      message: "Database unreachable — read abandoned (nº 686).",
      code: "yf_base_muette",
    }),
    { status: 400, headers: { "content-type": "application/json" } }
  );
}

/**
 * LE `fetch` DES CLIENTS SUPABASE, avec son abandon.
 *
 * ⚠️ IL COMBINE LES SIGNAUX, IL N'EN REMPLACE AUCUN. supabase-js pose
 * parfois SON propre `signal` (une requête qu'il annule lui-même) :
 * l'écraser casserait ses annulations. `AbortSignal.any` fait courir
 * les deux — le premier qui parle gagne.
 *
 * ⚠️ ET IL NE CASSE RIEN LÀ OÙ CES OUTILS MANQUENT. `AbortSignal.any`
 * et `AbortSignal.timeout` sont récents ; sur un moteur qui ne les a
 * pas, on rend le `fetch` d'origine, sans délai. Le site se comporte
 * alors comme avant cette passe — jamais plus mal.
 */
export function fetchAvecDelai(
  delaiMs: number = DELAI_LECTURE_MS
): typeof fetch {
  const possible =
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function" &&
    typeof AbortSignal.any === "function";
  if (!possible) return fetch;

  return async (entree: RequestInfo | URL, options?: RequestInit) => {
    //  §2 — LE DISJONCTEUR : la base s'est tue il y a moins de vingt
    //  secondes, on n'attend pas une seconde de plus. L'appelant reçoit
    //  une erreur, comme pour n'importe quelle panne réseau, et ses
    //  `try/catch` font le reste.
    if (baseTenuePourMuette()) return REPONSE_BASE_MUETTE();
    const minuteur = AbortSignal.timeout(delaiMs);
    const signal = options?.signal
      ? AbortSignal.any([options.signal, minuteur])
      : minuteur;
    const debut = Date.now();
    try {
      return await fetch(entree, { ...options, signal });
    } catch (erreur) {
      //  ⚠️ C'EST LE TEMPS ÉCOULÉ QUI DÉCIDE, pas le nom de l'erreur
      //  (voir §2) : au-delà de la moitié du délai, on a attendu pour
      //  rien — c'est un silence, et la fenêtre s'ouvre.
      if (Date.now() - debut >= delaiMs / 2) {
        noterLeSilence();
        //  §3 — ON NE RELÈVE PAS : on rend un refus. Voir la note.
        return REPONSE_BASE_MUETTE();
      }
      throw erreur;
    }
  };
}
