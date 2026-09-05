/**
 * ██ §6 (nº 853) — UNE VUE DE PORTFOLIO, ET SON GARDE-FOU ██
 * ==================================================================
 * LE PROPRIÉTAIRE : « une vue comptée à l'ouverture d'un profil ;
 * garde-fou : une par portfolio et par session/heure ».
 *
 * LE GARDE-FOU VIT DANS LE NAVIGATEUR, et c'est ce que la consigne
 * décrit : « par session » n'a de sens que là. Chaque portfolio vu
 * laisse l'heure de sa dernière vue dans le magasin de SESSION ; une
 * seconde ouverture dans l'heure ne renvoie rien. Fermer l'onglet vide
 * le magasin : une nouvelle session peut compter de nouveau, ce qui est
 * la règle demandée.
 * ⚠️ CE N'EST PAS UNE PROTECTION CONTRE LA FRAUDE, et il faut le dire :
 * qui veut gonfler son compteur peut vider son magasin. C'est un
 * garde-fou d'USAGE — il empêche qu'un aller-retour entre deux fiches
 * compte dix vues. Une vraie protection se poserait en base, par
 * empreinte de visiteur, comme le fait déjà le comptage de popularité
 * (api/tatoueur/clic) ; le propriétaire n'en a pas demandé, et je ne
 * l'invente pas.
 * ⚠️ JAMAIS BLOQUANT : l'envoi part sans qu'on attende la réponse, et
 * un échec n'a aucun effet visible. Un navigateur sans magasin de
 * session (mode privé strict) compte alors chaque ouverture — c'est le
 * repli le moins mauvais, et il ne casse rien.
 */

/** Une heure, en millisecondes — la fenêtre du garde-fou. */
export const FENETRE_VUE = 3_600_000;

/** La clé du magasin, une par portfolio. */
const cle = (slug: string) => `vue-portfolio:${slug}`;

/**
 * Signale une vue si l'heure est passée depuis la dernière. Rend VRAI
 * quand l'envoi part — c'est ce que le banc lit.
 */
export function signalerVue(slug: string): boolean {
  if (!slug) return false;
  try {
    const derniere = Number(sessionStorage.getItem(cle(slug)) ?? 0);
    if (derniere && Date.now() - derniere < FENETRE_VUE) return false;
    sessionStorage.setItem(cle(slug), String(Date.now()));
  } catch {
    //  Pas de magasin : on compte quand même (voir la note du haut).
  }
  try {
    const corps = new Blob([JSON.stringify({ slug })], {
      type: "application/json",
    });
    //  `sendBeacon` : l'envoi survit au départ de la page et ne retarde
    //  rien. Le `fetch` n'est qu'un repli — l'écriture du site pour ce
    //  cas (lib/balise-popularite, nº 220).
    if (!navigator.sendBeacon?.("/api/tatoueur/vue", corps)) {
      void fetch("/api/tatoueur/vue", {
        method: "POST",
        body: JSON.stringify({ slug }),
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}
