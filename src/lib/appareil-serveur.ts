import { headers } from "next/headers";

/**
 * L'APPAREIL, VU DU SERVEUR — L'ÉCRITURE UNIQUE
 * ==================================================================
 * §2 (nº 335) — POURQUOI CE MODULE EXISTE, ALORS QUE LE SITE DÉTECTE
 * L'APPAREIL DANS LE NAVIGATEUR DEPUIS LA Nº 60.
 * ------------------------------------------------------------------
 * LA RÈGLE DU SITE NE CHANGE PAS : partout où l'on AFFICHE, c'est un
 * DOIGT qui décide, jamais une largeur, et la question se pose au
 * navigateur (`matchMedia("(pointer: coarse)")`, reflété dans
 * `data-appareil`). Cette règle-là est intacte.
 *
 * MAIS IL EXISTE UN CAS OÙ ELLE NE PEUT PAS RÉPONDRE À TEMPS : quand
 * la décision n'est pas « quoi afficher » mais « QUELLE PAGE SERVIR ».
 * Le lien de partage d'un carrousel en est un. Décidée dans le
 * navigateur, la bascule vers la fiche a lieu APRÈS le premier
 * affichage : on voit une page, puis l'autre. Le propriétaire l'a
 * relevé — « j'ouvre le lien, je vois la fiche une seconde, puis la
 * photo ». Aucune correction côté navigateur ne peut supprimer cette
 * seconde : elle est le temps qu'il faut au navigateur pour exister.
 *
 * LA DOCTRINE, POSÉE PAR LE PROPRIÉTAIRE À LA Nº 335 : « c'est le
 * serveur qui décide, d'après l'adresse, et il sert directement la
 * fenêtre ». Ici, la décision est donc prise AVANT la première image —
 * avant même que le HTML ne parte.
 *
 * ⚠️ CE QUE LE SERVEUR PEUT LIRE, ET SES LIMITES. Il n'a pas de
 * `matchMedia` : il n'a que les en-têtes de la requête. Deux sources,
 * dans cet ordre :
 *  1. L'IDENTITÉ DU NAVIGATEUR (`user-agent`) — c'est la seule que
 *     Safari envoie, et l'iPhone du propriétaire est un Safari ;
 *  2. L'INDICE CLIENT `sec-ch-ua-mobile` — Chromium l'envoie
 *     spontanément, et il dit « ?1 » sur un téléphone.
 * Une erreur de lecture ne casse rien : au pire, un écran tactile
 * reçoit la fiche (avec la bonne photo, la fiche rouvre la fenêtre),
 * ou un écran de bureau reçoit la fenêtre. Jamais de page blanche.
 *
 * ⚠️ À N'UTILISER QUE POUR CHOISIR QUELLE PAGE SERVIR. Pour tout ce
 * qui s'affiche, la règle du doigt reste la seule (nº 60) : elle est
 * juste, celle-ci n'est qu'une approximation.
 */

/** Les identités qui disent un écran tactile, dans l'ordre où on les
    rencontre : iOS, Android, les liseuses, les vieux mobiles. */
const IDENTITES_TACTILES =
  /iPhone|iPad|iPod|Android|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i;

/** L'écran de celui qui demande est-il TACTILE, autant qu'on puisse le
    savoir depuis le serveur ? */
export async function ecranTactileServeur(): Promise<boolean> {
  const entetes = await headers();
  if (IDENTITES_TACTILES.test(entetes.get("user-agent") ?? "")) return true;
  return (entetes.get("sec-ch-ua-mobile") ?? "").includes("?1");
}
