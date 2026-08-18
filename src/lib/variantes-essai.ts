/*  ⚠️ PAS DE DIRECTIVE « use client » ICI — même raison que
    lib/bas-de-la-pile : le script d'avant peinture, fabriqué par le
    serveur, a besoin de `variantePourLeScript`. */
/**
 * ██ LE BANC D'ÉPREUVE PAR VARIANTES — nº 353 ██
 * ==================================================================
 * L'ARGUMENT DU PROPRIÉTAIRE, ET IL EST DÉCISIF : les sites Next
 * ordinaires ont un retour fiable sur Chrome iPhone. Le juge de
 * Chrome ne les punit pas — il punit LE NÔTRE. La différence est donc
 * dans ce que NOTRE site écrit dans l'historique en plus du routeur.
 *
 * CE MODULE EST L'INTERRUPTEUR : il permet de couper ces écritures
 * UNE PAR UNE, depuis l'adresse, pour que le téléphone du
 * propriétaire — LE banc — nomme le coupable. Cinq cycles
 * carte→retour par variante ; la variante où les éjections cessent
 * désigne le mécanisme.
 *
 * COMMENT ON S'EN SERT :
 *  · `?variante=nu`                → RIEN que le routeur Next, comme
 *    un site ordinaire (toutes nos écritures coupées) ;
 *  · `?variante=sans-filet`        → tout sauf le cran du filet ;
 *  · `?variante=sans-surfaces`     → tout sauf les étapes des
 *    surfaces refermables (pose, fermeture par retour, reprise) ;
 *  · `?variante=sans-consommation` → tout sauf la consommation
 *    d'étape (nº 332-§1) ;
 *  · `?variante=sans-fenetres`     → tout sauf la fenêtre de
 *    carrousel (elle ne s'ouvre plus du tout dans cette variante) ;
 *  · `?variante=sans-profil`      → tout sauf la marque `profilJoue` ;
 *  · `?variante=sans-nettoyages`   → tout sauf les nettoyages
 *    d'adresse par `replaceState` ;
 *  · `?variante=sans-balise`       → tout sauf la balise de
 *    popularité (`navigator.sendBeacon` dans le toucher de carte) —
 *    c'est la variante de la FAMILLE 2 du complément nº 353 : la
 *    seule API appelée dans la chaîne du toucher avant l'écriture du
 *    routeur, donc la seule qui pourrait CONSOMMER l'activation que
 *    l'auto-réparation de Chrome devrait dépenser ;
 *  · `?variante=normal` (ou `0`)   → retour au site normal.
 * L'armement est DURABLE dans l'onglet (mémoire de session) : la
 * variante survit aux navigations douces et aux éjections-retours du
 * protocole, et meurt avec l'onglet. Cumulable avec les sondes. La
 * variante active est écrite dans le journal à chaque arrivée.
 *
 * ⚠️ LA MÉMOIRE DE NAVIGATION N'A PAS DE VARIANTE : elle n'écrit PAS
 * dans l'historique (localStorage seulement) — il n'y a rien à couper.
 * L'onglet Profil/Portfolio n'en a pas non plus : son `replaceState`
 * est ce que fait n'importe quel site Next par `router.replace`, et le
 * couper casserait l'onglet.
 *
 * ⚠️ SANS PARAMÈTRE, RIEN NE CHANGE : chaque porte lit une marque
 * absente et laisse passer. C'est la borne de la passe.
 *
 * ⚠️ TEMPORAIRE — chantier ouvert (lib/navigation-session) : ce
 * fichier, ses portes dans les modules, et son bloc du script d'avant
 * peinture partent quand le coupable est nommé.
 */

export const VARIANTES = [
  "nu",
  "sans-filet",
  "sans-surfaces",
  "sans-consommation",
  "sans-fenetres",
  "sans-profil",
  "sans-nettoyages",
  "sans-balise",
] as const;
export type NomDeVariante = (typeof VARIANTES)[number];

/** Les mécanismes qu'une variante peut couper. */
export type Mecanisme =
  | "filet"
  | "surfaces"
  | "consommation"
  | "fenetres"
  | "profil"
  | "nettoyages"
  | "balise";

export const CLE_VARIANTE = "roswel:variante-essai";
/** La marque posée sur <html> par le script d'avant peinture :
    `data-variante`. Tout le site lit ELLE — disponible dès la
    première ligne, aucun accès au stockage par lecture. */
export const MARQUE_VARIANTE = "variante";

/** La variante active, telle que la marque l'annonce. */
export function varianteActive(): NomDeVariante | null {
  if (typeof document === "undefined") return null;
  const marque = document.documentElement.dataset[MARQUE_VARIANTE];
  return (VARIANTES as readonly string[]).includes(marque ?? "")
    ? (marque as NomDeVariante)
    : null;
}

/** LA QUESTION QUE CHAQUE PORTE POSE : ce mécanisme est-il coupé ?
    `nu` coupe tout ; `sans-X` coupe X. Sans variante : rien. */
export function mecanismeCoupe(mecanisme: Mecanisme): boolean {
  const variante = varianteActive();
  if (!variante) return false;
  if (variante === "nu") return true;
  return variante === `sans-${mecanisme}`;
}

/**
 * LE MÊME ARMEMENT, EN TEXTE, POUR LE SCRIPT D'AVANT PEINTURE — le
 * motif des nº 335/343 : le module fabrique le texte, aucune copie à
 * la main. Il lit `?variante=`, range dans la mémoire de session
 * (`normal`/`0` désarme), et pose la marque sur `<html>`. Sans
 * variante : une lecture, rien d'autre.
 */
export function variantePourLeScript(): string {
  const cle = JSON.stringify(CLE_VARIANTE);
  const noms = JSON.stringify(VARIANTES);
  return `(function(){
var v=null;try{v=sessionStorage.getItem(${cle})}catch(e){}
var p=new URLSearchParams(location.search).get("variante");
if(p==="normal"||p==="0"){v=null;try{sessionStorage.removeItem(${cle})}catch(e){}}
else if(p&&${noms}.indexOf(p)>=0){v=p;try{sessionStorage.setItem(${cle},p)}catch(e){}}
if(v&&${noms}.indexOf(v)>=0)r.dataset[${JSON.stringify(MARQUE_VARIANTE)}]=v;
})()`;
}
