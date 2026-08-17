/**
 * ██ L'ARMEMENT DES SONDES — UNE SEULE ÉCRITURE (nº 343) ██
 * ==================================================================
 * POURQUOI CE MODULE EXISTE, ET POURQUOI MAINTENANT.
 *
 * Le défaut que le propriétaire poursuit — un retour qui l'expulse du
 * site — ne se produit QU'À L'ADRESSE NUE, en première entrée d'un
 * onglet neuf. Un paramètre dans l'adresse le fait disparaître. Or nos
 * trois sondes s'armaient TOUTES par l'adresse (`?sonde-clic=1`…) :
 * les armer, c'était faire disparaître ce qu'on voulait voir. Elles
 * étaient donc, littéralement, incapables de mesurer ce défaut-là.
 *
 * CE QUE CE MODULE CHANGE, ET RIEN D'AUTRE :
 *  1. L'ARMEMENT DEVIENT DURABLE. Il vit dans la mémoire LOCALE (et
 *     non celle de l'onglet) : on arme une fois, puis on ouvre un
 *     onglet NEUF à l'adresse nue, et les sondes sont là.
 *  2. IL EST LU AU PLUS TÔT — par le script d'avant peinture, avant
 *     toute ligne d'application. Lu après l'hydratation, il aurait
 *     manqué les toutes premières entrées d'historique : justement
 *     celles qui expulsent.
 *  3. UN SEUL MÉCANISME POUR LES TROIS SONDES. Elles avaient trois
 *     armements différents (deux par l'adresse, un par la mémoire
 *     d'onglet) ; il n'y en a plus qu'un.
 *
 * ==================================================================
 * ⚠️ DÉSARMÉES, LES SONDES NE COÛTENT RIEN, ET C'EST VÉRIFIÉ AU BANC :
 * aucune écriture, aucun écouteur, aucun attribut, aucune enveloppe
 * autour de `history`. Le script d'avant peinture fait UNE LECTURE de
 * la mémoire locale — c'est le prix minimum d'un armement durable, et
 * c'est tout ce qu'il en coûte.
 *
 * ⚠️ AUCUNE SONDE NE POSE D'ENTRÉE D'HISTORIQUE, ne gèle rien, ne
 * défile pas, n'entoure la page d'aucun conteneur. Règle du site
 * depuis le début, rappelée par le propriétaire à la nº 343.
 *
 * ⚠️ TEMPORAIRE, comme les sondes : le jour où on les retire, ce
 * fichier part avec elles (bandeau des chantiers ouverts,
 * lib/navigation-session).
 */

/** Les trois sondes, nommées une fois. L'ordre n'a pas d'importance. */
export const SONDES = ["historique", "retour", "clic"] as const;
export type NomDeSonde = (typeof SONDES)[number];

/** La mémoire LOCALE — elle survit à l'ouverture d'un onglet neuf, ce
    que la mémoire d'onglet ne fait pas. C'est toute la raison d'être
    de cette passe. */
export const CLE_ARMEMENT = "roswel:sondes-armees";

/** La marque posée sur `<html>` par le script d'avant peinture. Tout
    le site lit ELLE, jamais la mémoire : elle est disponible dès la
    première ligne, et elle ne coûte pas un accès au stockage par
    lecture. */
export const MARQUE_SONDES = "sondes";

/** Le paramètre d'adresse qui ARME (et n'a plus besoin d'être répété) :
    `?sonde-clic=1`, `?sonde-historique=1`, `?sonde-retour=1`. */
export const PREFIXE_PARAMETRE = "sonde-";

/* ==================================================================
 * CE QUE LE SITE LIT
 * ================================================================== */

/** La liste des sondes armées, telle que la marque l'annonce. */
export function sondesArmees(): NomDeSonde[] {
  if (typeof document === "undefined") return [];
  const marque = document.documentElement.dataset[MARQUE_SONDES];
  if (!marque) return [];
  return SONDES.filter((nom) => marque.split(" ").includes(nom));
}

/** Cette sonde-là est-elle armée ? La seule question que les sondes
    posent, et elles la posent toutes de la même façon. */
export function sondeArmee(nom: NomDeSonde): boolean {
  return sondesArmees().includes(nom);
}

/* ==================================================================
 * ARMER, DÉSARMER
 * ================================================================== */

/** Écrit la liste dans la mémoire locale ET dans la marque : les deux
    ne peuvent pas se contredire. */
function poser(noms: NomDeSonde[]): void {
  const racine = document.documentElement;
  if (noms.length === 0) {
    delete racine.dataset[MARQUE_SONDES];
    try {
      localStorage.removeItem(CLE_ARMEMENT);
    } catch {
      // stockage refusé : l'armement vit alors le temps de la page
    }
    return;
  }
  racine.dataset[MARQUE_SONDES] = noms.join(" ");
  try {
    localStorage.setItem(CLE_ARMEMENT, noms.join(" "));
  } catch {
    // idem
  }
}

/** ARMER UNE SONDE, durablement. Les autres restent dans leur état. */
export function armerLaSonde(nom: NomDeSonde): void {
  if (typeof document === "undefined") return;
  const deja = sondesArmees();
  if (deja.includes(nom)) return;
  poser([...deja, nom]);
}

/** TOUT DÉSARMER, d'un geste — c'est ce que fait le bouton
    « DÉSARMER » de chaque panneau. Les enveloppes déjà posées sur
    `history` ne se retirent qu'au prochain chargement : le bouton le
    dit. */
export function desarmerLesSondes(): void {
  if (typeof document === "undefined") return;
  poser([]);
}

/* ==================================================================
 * CE QUE LE SCRIPT D'AVANT PEINTURE EXÉCUTE
 * ================================================================== */

/**
 * LE MÊME ARMEMENT, EN TEXTE, POUR LE SCRIPT D'AVANT PEINTURE.
 * Il s'exécute avant tout module : il ne peut pas appeler ce qui
 * précède, et il ne doit pas en garder une copie à la main (la leçon
 * des passes nº 328 à 337). On lui rend donc le code TOUT FAIT,
 * construit à partir des mêmes constantes.
 *
 * CE QU'IL FAIT, DANS L'ORDRE :
 *  1. il lit les paramètres d'adresse `?sonde-…=1` et les ARME
 *     durablement — c'est ainsi qu'on arme, une fois ;
 *  2. il lit la mémoire locale et pose la marque sur `<html>`.
 * Si rien n'est armé, il ne pose rien et n'écrit rien.
 *
 * ⚠️ `r` est la variable qui porte `document.documentElement` dans le
 * script appelant ; tout est déjà enveloppé dans un `try` là-bas.
 */
export function armementPourLeScript(): string {
  const cle = JSON.stringify(CLE_ARMEMENT);
  const noms = JSON.stringify(SONDES);
  const prefixe = JSON.stringify(PREFIXE_PARAMETRE);
  return `(function(){
var demandees=[];try{demandees=(localStorage.getItem(${cle})||"").split(" ").filter(Boolean)}catch(e){}
var p=new URLSearchParams(location.search);
${noms}.forEach(function(n){if(p.has(${prefixe}+n)&&demandees.indexOf(n)<0)demandees.push(n)});
if(!demandees.length)return;
try{localStorage.setItem(${cle},demandees.join(" "))}catch(e){}
r.dataset[${JSON.stringify(MARQUE_SONDES)}]=demandees.join(" ");
})()`;
}
