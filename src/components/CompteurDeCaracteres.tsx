"use client";

import { longueurVisible } from "@/lib/emojis";

/**
 * ██ LE COMPTEUR D'UNE ZONE DE TEXTE — UNE SEULE ÉCRITURE (nº 800) ██
 * ==================================================================
 * CE QU'IL EST : le petit « 42/3000 » posé DANS le coin bas-droit du
 * champ où l'on tape. Il est né avec la bio du portfolio (nº 112), et
 * le propriétaire demande le MÊME sur le message de /contact —
 * « apparence et comportement identiques ».
 *
 * ⚠️ ET « IDENTIQUES » NE SE PROMET PAS, IL S'ORGANISE. Recopier ces
 * quinze lignes dans le formulaire de contact les aurait rendues
 * identiques UN JOUR — celui de la copie. À la première retouche de
 * l'un des deux, elles auraient divergé sans que personne ne le voie.
 * Le compteur est donc écrit ICI, une fois, et les deux champs
 * l'emploient : c'est le piège nº 378, et c'est la seule façon de
 * tenir la promesse.
 *
 * CE QU'IL SAIT, ET RIEN DE PLUS :
 *  · IL COMPTE CE QUE L'ŒIL VOIT (§4, nº 267) — des GRAPHÈMES, pas
 *    des unités techniques. Un cœur de couleur vaut UN caractère, un
 *    drapeau aussi. `length` en comptait deux et quatre, et une bio
 *    de dix émojis était refusée bien avant le plafond annoncé ;
 *  · IL DIT LE VRAI NOMBRE, TOUJOURS, même au-delà du plafond
 *    (nº 119) : la saisie ne peut plus l'atteindre, mais une valeur
 *    venue d'ailleurs le pourrait — et mieux vaut qu'elle se voie.
 *    Au dépassement, il passe en rouge et en gras ;
 *  · IL NE SE CLIQUE PAS (`pointer-events-none`) : il flotte au-dessus
 *    du champ, il ne doit pas voler le curseur.
 *
 * ⚠️ LE CHAMP DOIT LUI RÉSERVER SA PLACE — `pb-8` sur la zone de
 * texte, sans quoi la dernière ligne tapée passe dessous. Et il doit
 * le nommer par `aria-describedby={id}` : un lecteur d'écran annonce
 * alors le décompte en même temps que le champ.
 */
export function CompteurDeCaracteres({
  id,
  valeur,
  maximum,
}: {
  /** L'identifiant que le champ vise par `aria-describedby`. */
  id: string;
  valeur: string;
  maximum: number;
}) {
  const longueur = longueurVisible(valeur);
  const depasse = longueur > maximum;
  return (
    <p
      id={id}
      role="status"
      className={`pointer-events-none absolute bottom-2.5 right-3.5
                 text-[12.5px] tabular-nums ${
                   depasse ? "font-semibold text-erreur" : "text-sombre-texte-doux"
                 }`}
    >
      {longueur}/{maximum}
    </p>
  );
}
