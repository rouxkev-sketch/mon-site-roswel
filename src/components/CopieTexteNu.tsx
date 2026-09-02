"use client";

import { useEffect } from "react";

/**
 * ██ nº 798 — COPIER DU TEXTE, PAS DU DÉCOR ██
 * ==================================================================
 * ██ LE DÉFAUT, TEL QUE LE PROPRIÉTAIRE L'A VU ██ On sélectionne le
 * texte de la page, on copie, on colle dans un traitement de texte ou
 * un courriel — et le texte arrive SURLIGNÉ de la couleur du fond du
 * site, en GROS caractères.
 *
 * ██ LA CAUSE, LUE DANS LE PRESSE-PAPIERS LUI-MÊME ██ Un navigateur
 * n'y pose pas UNE version du texte, mais DEUX : `text/plain` (le
 * texte nu) et `text/html` (le texte habillé). Word, Gmail, Notes,
 * Pages : tous collent la SECONDE. Or, pour la fabriquer, le
 * navigateur calcule les styles EFFECTIFS de chaque élément copié et
 * les écrit à l'intérieur, un par un — c'est ainsi qu'un collage
 * « ressemble » à l'original. Relevé au banc sur cette page :
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
 * ██ CE QUE FAIT CETTE ÉCRITURE ██ Elle intercepte la copie et pose
 * elle-même le presse-papiers : LE TEXTE NU, ET RIEN D'AUTRE. Aucune
 * version habillée n'est déposée — donc plus rien à emporter. Coller
 * rend du texte qui prend la police et la couleur du document
 * d'accueil, ce que tout le monde attend.
 *
 * ⚠️ ON NE TOUCHE PAS À CE QU'ON NE COMPREND PAS : si la sélection est
 * vide, ou si elle vient d'un CHAMP DE SAISIE (`window.getSelection()`
 * ne rend pas le texte sélectionné dans un `<input>` ou un
 * `<textarea>` — il rend une chaîne vide), on ne fait RIEN et le
 * navigateur copie comme d'habitude. Un copier-coller depuis un champ
 * garde donc son comportement natif, ici comme partout où l'on
 * réemploierait ce composant.
 * ⚠️ L'ÉCOUTEUR VIT ET MEURT AVEC LA PAGE qui le monte : il n'existe
 * pas ailleurs, et une navigation le retire. C'est voulu — le défaut a
 * été constaté sur « Qui sommes-nous », et cette passe ne change que
 * cela. Le mal est le même sur toutes les pages du site (le fond est
 * global) : ce composant est écrit pour être posé ailleurs le jour où
 * le propriétaire le demandera, sans rien réécrire.
 * ⚠️ ET IL N'Y A RIEN À VOIR : ce composant ne rend aucun élément, ne
 * change aucune mesure, n'ajoute aucune règle de style. La feuille CSS
 * ne bouge pas d'un octet.
 */
export function CopieTexteNu() {
  useEffect(() => {
    const surCopie = (evenement: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      const texte = selection.toString();
      //  Sélection vide : soit rien n'est pris, soit elle vient d'un
      //  champ de saisie. Dans les deux cas, on laisse faire.
      if (!texte.trim()) return;
      const presse = evenement.clipboardData;
      if (!presse) return;
      presse.setData("text/plain", texte);
      //  ⚠️ ET L'ON NE POSE PAS DE `text/html`. Ne rien poser, c'est
      //  ne rien avoir à nettoyer : l'application qui colle ne trouve
      //  que du texte, et lui applique ses propres styles.
      evenement.preventDefault();
    };
    document.addEventListener("copy", surCopie);
    return () => document.removeEventListener("copy", surCopie);
  }, []);
  return null;
}
