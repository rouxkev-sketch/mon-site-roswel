/**
 * ██ LE VOILE DE LA PAGE — §2 (nº 293) ██
 * ==================================================================
 * Quand une fenêtre ou un menu s'ouvre SUR LE WEB, la page s'assombrit
 * derrière lui. Un seul voile pour toutes les surfaces : la fenêtre du
 * compte, celle des filtres, le menu des styles du moteur, ceux de
 * « Ma sélection », et celui de la localité.
 *
 * ⚠️ UN COMPTE PARTAGÉ, exactement comme le gel du corps
 * (`lib/gel-du-corps`) : deux surfaces peuvent se recouvrir (un menu
 * ouvert dans une fenêtre), la PREMIÈRE pose le voile, la DERNIÈRE le
 * retire. Sans ce compte, la première fermeture l'emporterait et la
 * page redeviendrait claire sous une surface encore ouverte.
 * ⚠️ CE MODULE NE TOUCHE PAS AU GEL DU CORPS : ce sont deux choses
 * différentes, et celui-là ne bouge pas.
 */

let compte = 0;
const abonnes = new Set<(actif: boolean) => void>();

function diffuser() {
  const actif = compte > 0;
  for (const abonne of abonnes) abonne(actif);
}

/** S'abonner à l'état du voile. Rend la fonction de désabonnement. */
export function sAbonnerAuVoile(abonne: (actif: boolean) => void): () => void {
  abonnes.add(abonne);
  abonne(compte > 0);
  return () => {
    abonnes.delete(abonne);
  };
}

/** Une surface de plus est ouverte. */
export function poserLeVoile(): void {
  compte += 1;
  diffuser();
}

/** Une surface de moins. Le voile part avec la dernière. */
export function retirerLeVoile(): void {
  compte = Math.max(0, compte - 1);
  diffuser();
}

/** Pour la vérification : combien de surfaces le tiennent ? */
export function surfacesDuVoile(): number {
  return compte;
}
