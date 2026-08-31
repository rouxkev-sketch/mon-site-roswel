/**
 * L'ADRESSE D'UNE RECHERCHE — LA CLÉ SOUS LAQUELLE ON RANGE SA PLACE
 * ==================================================================
 * (passe nº 184-§2)
 *
 * LE DÉFAUT RELEVÉ SUR L'IPHONE DU PROPRIÉTAIRE :
 *
 *     ÉTAT position · yokofolio:defilement:/ · TROUVÉ y=10965 · 985 s
 *     ÉTAT mosaïque · TROUVÉ 20 fiches · page 1
 *     RETOUR demandée 10965 · document 12086 puis 1338 · atteinte 132
 *
 * La position prise dans la mosaïque COMPLÈTE (10965 px) était réclamée
 * sur une page filtrée qui ne mesure que 1338 px : toutes les
 * recherches se partageaient la même place. Une position appartient à
 * UNE recherche précise — jamais à une autre.
 *
 * CE QUE FAIT CETTE FONCTION, ET RIEN DE PLUS : elle rend l'adresse
 * CANONIQUE d'une recherche — le chemin, plus les critères, et eux
 * seuls. C'est cette adresse-là qui sert de clé à la position de
 * défilement (lib/navigation-session) comme à la mosaïque mise de côté
 * (lib/mosaique-session).
 *
 * DEUX RÈGLES, ET ELLES VONT ENSEMBLE :
 *
 *  1. LES CRITÈRES EN FONT PARTIE. `/?style=abstrait` et `/` sont deux
 *     recherches différentes, donc deux clés différentes, donc deux
 *     positions. C'est la correction demandée.
 *
 *  2. CE QUI N'EST PAS UN CRITÈRE N'EN FAIT PAS PARTIE. Les paramètres
 *     de sonde et de mesure (`?sonde-bascule=1`, `?clair=2`, `?verre=`,
 *     `?flou=`, `?sans=`) ne décrivent aucune recherche : les garder
 *     fabriquerait une clé par réglage de sonde — et c'est justement ce
 *     qui rendait le relevé du propriétaire illisible, la mosaïque
 *     rangée sous « / » étant déclarée « ≠ adresse courante » dès qu'on
 *     ouvrait la sonde. Tout le reste compte comme un critère : mieux
 *     vaut une clé de trop qu'une clé partagée entre deux recherches.
 *
 * ⚠️ ET LES CRITÈRES SONT TRIÉS : `?style=a&nature=b` et
 * `?nature=b&style=a` sont la MÊME recherche. Sans le tri, l'ordre
 * d'écriture des paramètres suffirait à perdre une position.
 *
 * ⚠️ LA MÊME LOGIQUE EXISTE EN CLAIR DANS LE SCRIPT D'AVANT PEINTURE
 * (lib/script-avant-peinture) : lui s'exécute avant que le moindre
 * module ne soit chargé, il ne peut donc pas appeler cette fonction. Si
 * l'une des deux change, l'AUTRE AUSSI — sinon la position posée avant
 * la première peinture irait chercher une clé que personne n'écrit.
 */

/** Les paramètres qui ne décrivent PAS une recherche. */
/**
 * ⚠️ « disposition » ET « texte » ONT REJOINT LA LISTE (nº 212-§4).
 * Ce sont des RÉGLAGES D'AFFICHAGE, pas des critères : la mosaïque
 * montre les mêmes tatoueurs en deux colonnes ou en une. Les garder
 * dans la clé fabriquait une clé par disposition — la position notée
 * en pleine largeur ne se retrouvait donc plus si l'on revenait avec
 * l'autre disposition, ou si le paramètre s'était perdu en route
 * (§3). La position se range désormais sous LES SEULS CRITÈRES, et un
 * retour la retrouve quelle que soit la façon de regarder.
 */
export const HORS_RECHERCHE = [
  "clair",
  "verre",
  "flou",
  "sans",
  "disposition",
  "texte",
];

/** §1 (nº 335) — LE PRÉFIXE DES SONDES, nommé une seule fois. Le
    script d'avant peinture le reprend TEL QUEL (voir plus bas) : il ne
    peut pas appeler ce module, mais il ne doit pas non plus recopier
    sa règle à la main. */
export const PREFIXE_REGLAGE = "sonde";

/** Vrai pour un paramètre de sonde ou de mesure. */
function estUnReglage(nom: string): boolean {
  return nom.startsWith(PREFIXE_REGLAGE) || HORS_RECHERCHE.includes(nom);
}

/**
 * §1 (nº 335) — LA MÊME RÈGLE, EN TEXTE, POUR LE SCRIPT D'AVANT
 * PEINTURE.
 * ------------------------------------------------------------------
 * Ce script s'exécute AVANT que le moindre module ne soit chargé : il
 * ne peut pas appeler `estUnReglage`. Jusqu'à la nº 335 il en gardait
 * une COPIE à la main — et l'en-tête de ce fichier avertissait déjà
 * « si l'une des deux change, l'AUTRE AUSSI ». Deux copies d'une
 * règle, c'est exactement ce qui a coûté les passes nº 328 à 334.
 * DÉSORMAIS IL N'Y EN A QU'UNE : cette fonction rend la CONDITION
 * JavaScript, fabriquée à partir des mêmes constantes. Ajouter un
 * réglage à la liste ci-dessus le retire du script au même instant.
 */
export function conditionDeReglagePourLeScript(variable: string): string {
  const noms = HORS_RECHERCHE.map((nom) => `${variable}===${JSON.stringify(nom)}`);
  return [
    `${variable}.indexOf(${JSON.stringify(PREFIXE_REGLAGE)})===0`,
    ...noms,
  ].join("||");
}

/** LES CRITÈRES SEULS, triés et nettoyés — sans le chemin. Vide quand
    la recherche n'en porte aucun (la mosaïque complète). */
export function criteresDeLAdresse(adresse: string): string {
  const coupe = adresse.indexOf("?");
  if (coupe < 0) return "";
  const parametres = new URLSearchParams(adresse.slice(coupe + 1));
  for (const nom of [...parametres.keys()]) {
    if (estUnReglage(nom)) parametres.delete(nom);
  }
  parametres.sort();
  return parametres.toString();
}

/** L'adresse canonique d'une recherche : chemin + critères triés. */
export function adresseDeRecherche(adresse: string): string {
  const coupe = adresse.indexOf("?");
  if (coupe < 0) return adresse;
  const chemin = adresse.slice(0, coupe);
  const requete = criteresDeLAdresse(adresse);
  return requete ? `${chemin}?${requete}` : chemin;
}

/** L'adresse canonique de la page affichée en ce moment. */
export function adresseDeRechercheCourante(): string {
  return adresseDeRecherche(window.location.pathname + window.location.search);
}

/** Les critères que l'ADRESSE demande en ce moment. */
export function criteresCourants(): string {
  return criteresDeLAdresse(window.location.search);
}

/**
 * LES CRITÈRES QUE LA MOSAÏQUE MONTRE VRAIMENT (nº 185-a) — lus dans le
 * DOM, donc dits par la page elle-même. `null` : cette page n'a pas de
 * mosaïque (une fiche, un formulaire…), il n'y a rien à comparer.
 * C'est IndexTatoueurs qui pose ce marqueur, sur la valeur de ses
 * cartes AFFICHÉES — pas de celles qu'il vient de demander.
 */
export function criteresDeLaMosaique(): string | null {
  const noeud = document.querySelector<HTMLElement>("[data-criteres-mosaique]");
  return noeud ? noeud.dataset.criteresMosaique ?? "" : null;
}
