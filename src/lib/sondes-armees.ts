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

/**
 * Les sondes du REGISTRE DURABLE, nommées une fois. L'ordre n'a pas
 * d'importance.
 *
 * ██ §1 (nº 712) — UN TRACEUR ENTRE DANS LE REGISTRE ██
 * ------------------------------------------------------------------
 * `journal` ne s'armait PAS : il tournait TOUJOURS, et c'est ce que le
 * propriétaire fait cesser à la nº 712. Le journal de bord (nº 272-§2)
 * envoyait une ligne au serveur (`/api/dev/journal-de-bord`) à CHAQUE
 * chargement et à chaque navigation : mesuré au banc de la nº 712, un
 * envoi au chargement et DEUX par navigation, sur les trois pages
 * d'échantillon. Éteint, il n'envoie plus rien.
 *
 * ██ §2 (nº 790) — CE QUI EST SORTI DU REGISTRE, ET POURQUOI ██
 * ------------------------------------------------------------------
 * Le grand ménage d'avant mise en ligne a retiré quatre des cinq
 * sondes qui vivaient ici — `boite-noire`, `historique`, `retour`,
 * `clic` — parce que le défaut de chacune est clos depuis longtemps
 * (voir le rapport de la passe). Il ne reste que le JOURNAL DE BORD,
 * qui ne vise aucun défaut précis : il enregistre les chargements, les
 * navigations, les erreurs et les bascules de session, et c'est le
 * seul témoin qui dise ce que le SERVEUR voyait au même instant.
 * ⚠️ UN ARMEMENT PÉRIMÉ SE NETTOIE TOUT SEUL : la mémoire locale d'un
 * navigateur peut encore porter « boite-noire » ou « clic » dans la
 * liste ; toute lecture passe par `SONDES.filter(…)`, donc un nom qui
 * n'est plus au registre est simplement ignoré, puis effacé à la
 * première écriture. Rien à purger à la main.
 */
export const SONDES = ["journal"] as const;
export type NomDeSonde = (typeof SONDES)[number];

/** La mémoire LOCALE — elle survit à l'ouverture d'un onglet neuf, ce
    que la mémoire d'onglet ne fait pas. C'est toute la raison d'être
    de cette passe. */
export const CLE_ARMEMENT = "yokofolio:sondes-armees";

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

/** Les sondes que l'ADRESSE COURANTE réclame, ici et maintenant. */
function sondesDeLAdresse(): NomDeSonde[] {
  if (typeof location === "undefined") return [];
  try {
    const parametres = new URLSearchParams(location.search);
    return SONDES.filter((nom) => parametres.has(PREFIXE_PARAMETRE + nom));
  } catch {
    return [];
  }
}

/**
 * ██ LE RÉARMEMENT PAR L'ADRESSE — LA SECONDE VOIE (nº 494) ██
 * ==================================================================
 * LE DÉFAUT RELEVÉ PAR LE PROPRIÉTAIRE : après un désarmement, rouvrir
 * une adresse avec `?sonde-retour=1` ne rallumait plus rien, même dans
 * un onglet neuf. Une sonde qu'on ne peut plus rallumer ne sert à rien.
 *
 * ⚠️ CE QUE JE N'AI PAS ÉTABLI, ET JE LE DIS : la lecture du code ne
 * montre PAS pourquoi la première voie tombe en panne. Le script
 * d'avant peinture lit bien `location.search`, ajoute les sondes
 * demandées à celles de la mémoire, et pose la marque — cette
 * mécanique-là est juste, ligne à ligne.
 * CE QUE JE CHANGE EST DONC UNE SECONDE VOIE, PAS UNE RÉPARATION DE LA
 * PREMIÈRE : jusqu'ici, le paramètre d'adresse n'était lu QU'À UN SEUL
 * ENDROIT du site, ce script. S'il ne tourne pas — page servie par un
 * cache, script d'une mise en ligne antérieure (le millésime existe
 * parce que c'est arrivé deux fois, note §B nº 347), stockage refusé —
 * plus RIEN ne regarde l'adresse, et aucun rechargement n'y change
 * quoi que ce soit. Le site lit désormais l'adresse lui-même, à la
 * première question posée sur l'armement.
 * ⚠️ UNE FOIS PAR ADRESSE, ET NON UNE FOIS PAR CHARGEMENT : on retient
 * la requête déjà lue. La réconciliation ÉCRIT, la question est posée
 * à chaque rendu — sans cette mémoire, on écrirait des dizaines de
 * fois pour rien. Et en retenant l'ADRESSE plutôt qu'un simple
 * « déjà fait », une navigation interne vers `?sonde-…=1` réarme elle
 * aussi : le module n'est pas rechargé dans ce cas-là.
 * ⚠️ L'ADRESSE AJOUTE, ELLE NE RETIRE PAS : une sonde armée
 * durablement reste armée même si l'adresse ne la nomme pas — c'est
 * tout l'acquis de la nº 343 (armer une fois, mesurer à l'adresse nue).
 */
let derniereAdresseLue: string | null = null;

function reconcilierAvecLAdresse(): void {
  if (typeof document === "undefined" || typeof location === "undefined") return;
  if (location.search === derniereAdresseLue) return;
  derniereAdresseLue = location.search;
  const demandees = sondesDeLAdresse();
  if (demandees.length === 0) return;
  const marque = document.documentElement.dataset[MARQUE_SONDES];
  const deja = marque
    ? SONDES.filter((nom) => marque.split(" ").includes(nom))
    : [];
  const manquantes = demandees.filter((nom) => !deja.includes(nom));
  if (manquantes.length > 0) poser([...deja, ...manquantes]);
}

/**
 * ██ §2 (nº 712) — LE REPLI, QUAND IL N'Y A PAS DE MARQUE ██
 * ==================================================================
 * LE DÉFAUT QU'IL FERME, TROUVÉ AU BANC DE LA nº 712 : la marque est
 * posée par le script d'avant peinture, et ce script ne vit que dans
 * la mise en page du groupe « tatouage ». Sur une page qui n'en fait
 * pas partie — le tableau de bord `/dev`, précisément — la marque
 * n'existe PAS. La liste revenait donc VIDE alors que des sondes
 * étaient bel et bien armées, et le tableau de bord, croyant partir
 * de rien, EFFAÇAIT les autres sondes en en allumant une.
 * LE REPLI : sans marque, on lit la mémoire durable — la source de
 * vérité, celle que le script lui-même recopie.
 * ⚠️ ET IL NE COÛTE RIEN SUR LE SITE, ce qui est tout le point : la
 * lecture n'a lieu qu'UNE fois par page (elle est retenue ici), et
 * seulement là où la marque manque. Sur les pages du site, la marque
 * est posée avant la première peinture : on ne descend jamais
 * jusqu'ici. `poser` remet ce souvenir à zéro, les deux ne peuvent
 * pas se contredire.
 */
let repliRetenu: NomDeSonde[] | null = null;

function repliDeLaMemoire(): NomDeSonde[] {
  if (repliRetenu) return repliRetenu;
  let gardees: NomDeSonde[] = [];
  try {
    const brut = localStorage.getItem(CLE_ARMEMENT) ?? "";
    gardees = SONDES.filter((nom) => brut.split(" ").includes(nom));
  } catch {
    //  stockage refusé : rien n'est armé, et c'est la bonne réponse.
  }
  repliRetenu = gardees;
  return gardees;
}

/** La liste des sondes armées, telle que la marque l'annonce — après
    que l'adresse a eu son mot à dire, et à défaut de marque, telle que
    la mémoire durable la garde (§2 nº 712). */
export function sondesArmees(): NomDeSonde[] {
  if (typeof document === "undefined") return [];
  reconcilierAvecLAdresse();
  const marque = document.documentElement.dataset[MARQUE_SONDES];
  if (!marque) return repliDeLaMemoire();
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
  //  §2 (nº 712) — le souvenir du repli est périmé : on vient d'écrire.
  repliRetenu = null;
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

/** ÉTEINDRE UNE SEULE SONDE — l'interrupteur du tableau de bord
    (§1 nº 712). Les autres restent dans leur état, exactement comme
    `armerLaSonde` de l'autre côté.
    ⚠️ CE QUI EST DÉJÀ POSÉ RESTE POSÉ jusqu'au prochain chargement :
    une enveloppe sur `history`, un écouteur. Le tableau de bord le
    dit — c'est la même réserve que le bouton « DÉSARMER » des
    panneaux depuis la nº 343. */
export function eteindreLaSonde(nom: NomDeSonde): void {
  if (typeof document === "undefined") return;
  const deja = sondesArmees();
  if (!deja.includes(nom)) return;
  poser(deja.filter((autre) => autre !== nom));
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
