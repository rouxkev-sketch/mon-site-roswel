"use client";

import { useEffect } from "react";
//  §1 (nº 799) — LA RÈGLE VIT LÀ, ET NULLE PART AILLEURS.
import { garderLeTexteALaCopie } from "@/lib/copie-du-texte";

/**
 * ██ nº 798 — COPIER DU TEXTE, PAS DU DÉCOR ██
 * ==================================================================
 * ██ LE DÉFAUT, TEL QUE LE PROPRIÉTAIRE L'A VU ██ On sélectionne le
 * texte d'une page, on copie, on colle dans un traitement de texte ou
 * un courriel — et le texte arrive SURLIGNÉ de la couleur du fond du
 * site, en GROS caractères. Constaté sur « Qui sommes-nous », puis sur
 * « Mentions légales ».
 *
 * ██ LA CAUSE, LUE DANS LE PRESSE-PAPIERS LUI-MÊME ██ Un navigateur
 * n'y pose pas UNE version du texte, mais DEUX : `text/plain` (le
 * texte nu) et `text/html` (le texte habillé). Word, Gmail, Notes,
 * Pages : tous collent la SECONDE. Or, pour la fabriquer, le
 * navigateur calcule les styles EFFECTIFS de chaque élément copié et
 * les écrit à l'intérieur, un par un — c'est ainsi qu'un collage
 * « ressemble » à l'original. Relevé au banc :
 *
 *     background-color: rgb(11, 15, 20)   ← le fond du site (#0B0F14)
 *     color: rgb(242, 242, 244)           ← le texte clair
 *     font-size: clamp(2rem, 5.5vw, 2.9rem)  ← jusqu'à 46 px
 *
 * Le surlignage, c'est ce fond-là ; les gros caractères, cette
 * taille-là. Rien n'est cassé dans le site : c'est le comportement
 * NORMAL du navigateur, et tout site à fond sombre le subit. Mais le
 * résultat est mauvais pour qui copie, et il se corrige.
 *
 * ██ CE QUE FAIT CE GARDE ██ Il écoute la copie et confie le travail à
 * `garderLeTexteALaCopie` (lib/copie-du-texte), qui pose LE TEXTE NU,
 * ET RIEN D'AUTRE. Aucune version habillée n'est déposée — donc plus
 * rien à emporter. Coller rend du texte qui prend la police et la
 * couleur du document d'accueil, ce que tout le monde attend.
 *
 * ⚠️ ET LA RÈGLE N'EST PAS ÉCRITE ICI, C'EST LE POINT DE LA nº 799 :
 * elle existait DÉJÀ depuis la nº 514, dans `lib/copie-du-texte`, où
 * elle réparait un autre défaut de copie (WebKit posait l'URL d'un
 * lien à la place de son texte). Le remède est le même au mot près.
 * La nº 798 l'avait réécrite ici : deux écritures pour une seule
 * règle, le piège nº 378. Ce fichier ne fait plus que l'appeler.
 *
 * ⚠️ ON NE TOUCHE PAS À CE QU'ON NE COMPREND PAS : si la sélection est
 * vide, ou si elle vient d'un CHAMP DE SAISIE (`window.getSelection()`
 * ne rend pas le texte sélectionné dans un `<input>` ou un
 * `<textarea>` — il rend une chaîne vide), la règle ne fait RIEN et le
 * navigateur copie comme d'habitude. Vérifié au banc, pas supposé : on
 * copie un champ du formulaire de contact et l'on retrouve son contenu
 * intact dans le presse-papiers.
 * ⚠️ IL EST MONTÉ UNE SEULE FOIS, à la racine du groupe
 * (src/app/(tatouage)/layout.tsx) : le fond sombre y est posé, et le
 * défaut n'a jamais été propre à une page. L'écouteur vit et meurt
 * avec le site, pas avec un écran.
 * ⚠️ ET IL N'Y A RIEN À VOIR : ce composant ne rend aucun élément, ne
 * change aucune mesure, n'ajoute aucune règle de style. La feuille CSS
 * ne bouge pas d'un octet.
 */
export function CopieTexteNu() {
  useEffect(() => {
    const surCopie = (evenement: ClipboardEvent) => garderLeTexteALaCopie(evenement);
    document.addEventListener("copy", surCopie);
    return () => document.removeEventListener("copy", surCopie);
  }, []);
  return null;
}
