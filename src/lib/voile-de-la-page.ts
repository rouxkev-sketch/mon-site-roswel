/**
 * ██ LE VOILE DE LA PAGE — §2 (nº 293), refait §3 (nº 294) ██
 * ==================================================================
 * Quand une fenêtre ou un menu s'ouvre SUR LE WEB, tout l'écran
 * s'assombrit derrière lui — la barre comprise. Un seul voile pour
 * toutes les surfaces : la fenêtre du compte, celle des filtres, le
 * menu des styles du moteur, ceux de « Ma sélection », et celui de la
 * localité.
 *
 * ⚠️ UN COMPTE PARTAGÉ, exactement comme le gel du corps
 * (`lib/gel-du-corps`) : deux surfaces peuvent se recouvrir (un menu
 * ouvert dans une fenêtre), la PREMIÈRE pose le voile, la DERNIÈRE le
 * retire. Sans ce compte, la première fermeture l'emporterait et la
 * page redeviendrait claire sous une surface encore ouverte.
 * ⚠️ CE MODULE NE TOUCHE PAS AU GEL DU CORPS : ce sont deux choses
 * différentes, et celui-là ne bouge pas.
 *
 * §3 (nº 294) — LE BLOC QUI OUVRE RESTE CLAIR, ET C'EST LE BLOC
 * ENTIER. Chaque surface dépose ici, avec son jeton, L'ÉLÉMENT à
 * épargner : sur « Ma sélection » et sur le moteur, c'est l'ENCADRÉ
 * complet (favoris/suivis, localité/style), jamais le seul segment
 * touché — on ne coupe pas un bloc en deux luminosités.
 */

/** Une surface ouverte : son jeton, et le bloc qu'elle épargne. */
type Surface = { jeton: object; bloc: () => HTMLElement | null };

const surfaces: Surface[] = [];
const abonnes = new Set<() => void>();

function diffuser() {
  for (const abonne of abonnes) abonne();
}

/** S'abonner aux changements. Rend la fonction de désabonnement. */
export function sAbonnerAuVoile(abonne: () => void): () => void {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

/** Le voile est-il posé ? */
export function voilePose(): boolean {
  return surfaces.length > 0;
}

/**
 * LE BLOC À ÉPARGNER — celui de la DERNIÈRE surface ouverte qui en
 * déclare un. Une seule fenêtre claire à la fois : c'est celle dans
 * laquelle on écrit.
 */
export function blocEpargne(): HTMLElement | null {
  for (let rang = surfaces.length - 1; rang >= 0; rang -= 1) {
    const element = surfaces[rang].bloc();
    if (element) return element;
  }
  return null;
}

/** Une surface de plus est ouverte. Rend son jeton. */
export function poserLeVoile(bloc: () => HTMLElement | null): object {
  const jeton = {};
  surfaces.push({ jeton, bloc });
  diffuser();
  return jeton;
}

/** Une surface de moins. Le voile part avec la dernière. */
export function retirerLeVoile(jeton: object): void {
  const rang = surfaces.findIndex((surface) => surface.jeton === jeton);
  if (rang >= 0) surfaces.splice(rang, 1);
  diffuser();
}

/** Pour la vérification : combien de surfaces le tiennent ? */
export function surfacesDuVoile(): number {
  return surfaces.length;
}
