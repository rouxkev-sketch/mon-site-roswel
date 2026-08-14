/**
 * LA VUE PHOTOTHÈQUE (passe nº 140) — les images pures
 * =====================================================
 * Une seconde façon de regarder la mosaïque : TOUT est masqué — badge,
 * portrait, nom, adresse — il ne reste que les photos, et le cœur des
 * favoris dans l'angle. C'est voulu et assumé : qui a déjà filtré par
 * style et par ville cherche des IMAGES, pas des identités.
 *
 * ⚠️ ELLE EST INDÉPENDANTE DE LA DISPOSITION (deux colonnes / une) :
 * les deux réglages se combinent librement — c'est pour cela qu'elle
 * n'est pas un troisième état de disposition-grille, mais un magasin
 * à part, bâti sur le même modèle.
 *
 * ⚠️ LE CHOIX VIT DANS L'ADRESSE (nº 203-§1b) — « ?texte=sans », rien
 * pour le défaut (les cartes avec leur texte). Même raisonnement, même
 * mécanique et mêmes conséquences que lib/disposition-grille — le
 * JUMEAU de ce magasin, où tout est expliqué : serveur qui rend le bon
 * affichage du premier coup, remplacement d'adresse sans étape
 * d'historique, relecture au retour, clé de position qui contient le
 * paramètre, et adresse nue = défaut (le contrat des critères).
 *
 * §2 (nº 257) — … ET IL EST MÉMORISÉ DANS UN COOKIE, PARCE QUE LE
 * SERVEUR DOIT LE CONNAÎTRE.
 * ------------------------------------------------------------------
 * LE DÉFAUT, signalé deux fois : on choisit la mise en page sans
 * texte, on revient sur l'accueil, et la page s'affiche D'ABORD avec
 * le texte, puis le retire une seconde plus tard — un saut de page.
 * Ce n'était ni une animation ni un retard d'hydratation : c'était un
 * ÉTAT QUI N'EXISTAIT PAS CÔTÉ SERVEUR. L'adresse d'arrivée est nue
 * (« / »), le serveur rendait donc le défaut, et la préférence — rangée
 * dans le `sessionStorage`, que le serveur ne voit pas — ne pouvait
 * s'appliquer qu'APRÈS coup, en réécrivant l'adresse.
 *
 * LE REMÈDE EST CELUI DE LA nº 226-§1, à la lettre : UN COOKIE. C'est
 * le seul canal qui existe — le serveur rend le HTML avant qu'une
 * ligne de JavaScript n'ait tourné, et un cookie part avec CHAQUE
 * requête, la navigation du routeur comprise. La préférence est donc
 * écrite dans un cookie AU MOMENT DU CHOIX (sa valeur est connue là,
 * contrairement au nombre de colonnes, qui ne se mesure qu'avant la
 * peinture), et le serveur la lit (page.tsx, mes-favoris/page.tsx).
 * La politique du cookie — un an, `path=/`, `samesite=lax` — est celle
 * de la nº 226, écrite une seule fois (SUFFIXE_COOKIE_AFFICHAGE).
 *
 * ⚠️ ET LE MAGASIN LE LIT AUSSI, dans cet ordre : L'ADRESSE D'ABORD
 * (un lien partagé « ?texte=sans » l'emporte, le contrat des critères
 * ne bouge pas), LE COOKIE ENSUITE. Sans cela le navigateur dirait
 * « avec texte » là où le serveur vient de rendre « sans » — et le
 * saut reviendrait par la fenêtre, en écart d'hydratation.
 */

import { SUFFIXE_COOKIE_AFFICHAGE } from "@/lib/colonnes-mosaique";
import {
  cleDeSurface,
  surfaceCourante,
  type SurfaceAffichage,
} from "@/lib/surface-affichage";

const EVENEMENT = "yokofolio-vue-phototheque-changee";

/** Le paramètre d'adresse — écrit seulement quand le texte est masqué. */
export const PARAMETRE_TEXTE = "texte";

/** LE COOKIE DE LA MISE EN PAGE (§2, nº 257) — deux mots, aucune
    donnée personnelle. Le frère de `yf_colonnes`.
    §1 (nº 263) — IL N'EST PLUS UNIQUE : chaque surface a le sien
    (`cleCookieTexte`), la recherche garde la clé nue. */
export const COOKIE_TEXTE = "yf_texte";
export const TEXTE_SANS = "sans";
export const TEXTE_AVEC = "avec";

/** LE NOM DU COOKIE D'UNE SURFACE — la même écriture pour le serveur
    (page.tsx, mes-favoris/page.tsx) et pour ce magasin : ils ne
    peuvent pas diverger. */
export function cleCookieTexte(surface: SurfaceAffichage): string {
  return cleDeSurface(COOKIE_TEXTE, surface);
}

/**
 * LE COOKIE RELU — et jamais cru sur parole : n'importe qui peut
 * écrire n'importe quoi dans un cookie. Tout ce qui n'est pas le mot
 * exact vaut « avec le texte », le défaut du site.
 * ⚠️ PURE, et sans `window` : le serveur l'appelle.
 */
export function phototequeDuCookie(
  valeurCookie: string | undefined | null
): boolean {
  return valeurCookie === TEXTE_SANS;
}

function memoriser(voulue: boolean) {
  try {
    //  §2 (nº 257) — LE COOKIE REMPLACE LE `sessionStorage` de la
    //  nº 212-§3 : il dit la même chose, mais le serveur le voit. Une
    //  seule mémoire, donc rien à tenir d'accord.
    //  §1 (nº 263) — LA CLÉ EST CELLE DE LA SURFACE : un choix fait sur
    //  « Ma sélection » ne s'écrit jamais dans la mémoire de la
    //  recherche, ni l'inverse.
    document.cookie = `${cleCookieTexte(surfaceCourante())}=${
      voulue ? TEXTE_SANS : TEXTE_AVEC
    }${SUFFIXE_COOKIE_AFFICHAGE}`;
  } catch {
    // Cookies refusés : la préférence vivra le temps de la page.
  }
}

function memorisee(surface: SurfaceAffichage): boolean | null {
  try {
    const cle = cleCookieTexte(surface);
    const lue = document.cookie
      .split("; ")
      .find((morceau) => morceau.startsWith(`${cle}=`))
      ?.slice(cle.length + 1);
    return lue === TEXTE_SANS ? true : lue === TEXTE_AVEC ? false : null;
  } catch {
    return null;
  }
}

/** Remettre la vue au pas après une navigation — l'adresse d'abord, la
    préférence mémorisée à défaut. */
export function reprendrePhototheque() {
  //  ⚠️ PLUS RIEN À CORRIGER À L'ÉCRAN (§2, nº 257) : le serveur a
  //  déjà rendu la bonne mise en page (il lit le cookie) et la
  //  première lecture du magasin dit la même chose. On relit, on
  //  prévient — et si l'adresse portait le paramètre, on le retient.
  const surface = surfaceCourante();
  valeurs[surface] = depuisLAdresse() ?? memorisee(surface) ?? false;
  if (new URLSearchParams(window.location.search).has(PARAMETRE_TEXTE)) {
    memoriser(valeurs[surface]);
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

/** LA source de vérité entre deux relectures de l'adresse.
    §1 (nº 263) — UNE PAR SURFACE : le module survit aux navigations du
    routeur, et une valeur unique portait le choix d'une page sur
    l'autre — c'était le troisième étage du défaut, avec le cookie. */
const valeurs: Record<SurfaceAffichage, boolean | null> = {
  recherche: null,
  selection: null,
};

/** La lecture de l'adresse — `null` quand elle ne dit rien (c'est
    alors au cookie de parler, §2 nº 257). */
function depuisLAdresse(): boolean | null {
  try {
    const parametres = new URLSearchParams(window.location.search);
    if (!parametres.has(PARAMETRE_TEXTE)) return null;
    return parametres.get(PARAMETRE_TEXTE) === TEXTE_SANS;
  } catch {
    return null;
  }
}

/** Écrit (ou efface) le paramètre — un remplacement, jamais une étape. */
function ecrireDansLAdresse(voulue: boolean) {
  try {
    const parametres = new URLSearchParams(window.location.search);
    if (voulue) parametres.set(PARAMETRE_TEXTE, "sans");
    else parametres.delete(PARAMETRE_TEXTE);
    const requete = parametres.toString();
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + (requete ? `?${requete}` : "") + window.location.hash
    );
  } catch {
    // Adresse inaccessible : la vue vivra le temps de la page.
  }
}

/** La vue en cours — celle de l'adresse.
    §1 (nº 263) — DE LA SURFACE DEMANDÉE (la page en cours par défaut).
    L'adresse n'appartient qu'à la page qui la porte : pour une surface
    étrangère (la barre qui bâtit une adresse de recherche depuis
    « Ma sélection »), seule sa mémoire parle. */
export function lirePhototheque(
  surface: SurfaceAffichage = surfaceCourante()
): boolean {
  //  §2 (nº 257) — L'ADRESSE, PUIS LE COOKIE : la première lecture du
  //  navigateur doit dire EXACTEMENT ce que le serveur vient de
  //  rendre, sans quoi le premier rendu se corrige à l'écran — le
  //  saut de page qu'on vient de supprimer.
  if (valeurs[surface] === null) {
    valeurs[surface] =
      (surface === surfaceCourante() ? depuisLAdresse() : null) ??
      memorisee(surface) ??
      false;
  }
  return valeurs[surface];
}

/**
 * POSER LA VUE VOULUE — explicite, donc idempotente (nº 164) : deux
 * fois la même demande ne font qu'un seul changement. Toujours SUR LA
 * SURFACE EN COURS : une bascule agit là où elle vit (nº 263-§1).
 */
export function poserPhototheque(voulue: boolean) {
  if (lirePhototheque() === voulue) return;
  valeurs[surfaceCourante()] = voulue;
  ecrireDansLAdresse(voulue);
  memoriser(voulue);
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Bascule et prévient tous les abonnés (grille, cartes, boutons). */
export function basculerPhototheque() {
  poserPhototheque(!lirePhototheque());
}

/** Abonnement — le RETOUR (popstate) est le seul moment où l'adresse a
    raison contre la mémoire : on relit alors, et alors seulement. */
export function souscrirePhototheque(rappel: () => void) {
  const auRetour = () => {
    const surface = surfaceCourante();
    valeurs[surface] = depuisLAdresse() ?? memorisee(surface) ?? false;
    rappel();
  };
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("popstate", auRetour);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("popstate", auRetour);
  };
}
