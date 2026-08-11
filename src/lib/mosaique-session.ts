"use client";

import type { Tatoueur } from "@/lib/tatoueurs";
import {
  adresseDeRecherche,
  adresseDeRechercheCourante,
} from "@/lib/adresse-recherche";

/**
 * LA MOSAÏQUE MISE DE CÔTÉ — pour que le retour retombe PILE
 * ===========================================================
 * LE DÉFAUT CORRIGÉ : sur smartphone, revenir d'une fiche vers la
 * mosaïque ne rendait pas la position quittée. On repartait plus haut,
 * puis la page se recalait pendant une à deux secondes.
 *
 * LA CAUSE, ET ELLE N'EST PAS DANS LE DÉFILEMENT.
 * Sur smartphone, une carte est un VRAI LIEN : toucher une fiche
 * QUITTE la page des résultats, et le composant qui la tient
 * (IndexTatoueurs) est démonté. Au retour, il se remonte sur ce que le
 * serveur avait rendu — LES VINGT-QUATRE PREMIÈRES FICHES. Tout ce que
 * « Voir plus » avait ajouté a disparu.
 * La page est alors trop COURTE : la position mémorisée (900 px) est
 * rabotée par le navigateur à la hauteur disponible (249 px mesurés).
 * Puis les images se posent, la page s'allonge, et la mécanique de
 * restauration repousse la page vers le bas par petits pas — d'où le
 * « recalage » que l'on voit passer.
 * Restaurer le défilement sans restaurer la LONGUEUR ne peut donc pas
 * marcher. C'est la mosaïque entière qu'il faut rendre.
 *
 * (Sur le web, le défaut n'existe pas : la fiche s'y ouvre en fenêtre
 * superposée, la grille n'est jamais démontée. C'est pourquoi le test
 * de non-régression du retour, qui tourne en 1366, passait depuis
 * toujours.)
 *
 * CE QU'ON GARDE : les fiches affichées, leur nombre de pages et le
 * total, pour UNE SEULE adresse — la dernière consultée. Une entrée
 * unique borne la place occupée, et c'est la seule dont on ait besoin :
 * on ne revient jamais que de la page qu'on vient de quitter.
 *
 * OÙ : `sessionStorage`, qui vit et meurt avec l'onglet. Une nouvelle
 * visite repart donc d'une mosaïque neuve, ce qui est bien ce qu'on
 * veut : ces fiches sont un instantané, pas un cache de données.
 */

/** Au-delà, l'instantané est jeté : les fiches ont pu changer. */
const DUREE_MS = 30 * 60 * 1000;

const CLE = "yokofolio:mosaique";

export type MosaiqueMemorisee = {
  /** L'adresse EXACTE (chemin + critères) à laquelle elle appartient. */
  adresse: string;
  tatoueurs: Tatoueur[];
  /** Combien de pages « Voir plus » avaient été chargées. */
  page: number;
  /** Le total annoncé par la base (il décide du bouton « Voir plus »). */
  total: number;
  quand: number;
};

/** Met la mosaïque de côté. Silencieux si le stockage est indisponible
    (navigation privée, quota) : le retour se contentera alors de la
    première page, comme avant. */
export function memoriserMosaique(
  adresseDemandee: string,
  tatoueurs: Tatoueur[],
  page: number,
  total: number
) {
  //  ⚠️ LA MÊME CLÉ QUE LA POSITION (nº 184-§2) : l'adresse CANONIQUE
  //  de la recherche — critères compris, réglages de sonde exclus. Une
  //  mosaïque appartient à une recherche précise, jamais à une autre.
  const adresse = adresseDeRecherche(adresseDemandee);
  try {
    //  ⚠️ UNE NOTE NE RÉTRÉCIT JAMAIS (passe nº 181-§1a).
    //  ----------------------------------------------------------
    //  LE DÉFAUT : au retour d'une fiche, le composant se remonte sur
    //  ce que le serveur a rendu — LA PREMIÈRE PAGE, vingt cartes — et
    //  cet effet s'exécute aussitôt. Il écrasait alors la note qui en
    //  contenait quarante ou soixante par une note de vingt. La
    //  restitution n'avait plus rien à restituer, la page restait
    //  courte, et la position mémorisée (4964 px sur un document de
    //  3717) devenait inatteignable : on atterrissait en haut.
    //  LA RÈGLE EST DONC : pour une MÊME ADRESSE, on n'écrit que si
    //  l'on a AU MOINS AUTANT de cartes. Grandir (« Voir plus ») écrit ;
    //  rétrécir ne fait rien. Une recherche différente porte une autre
    //  adresse — elle passe donc toujours (voir `lireMosaique`, qui
    //  n'accepte une note que pour son adresse).
    const brut = sessionStorage.getItem(CLE);
    if (brut) {
      const note = JSON.parse(brut) as MosaiqueMemorisee | null;
      if (
        note &&
        note.adresse === adresse &&
        Array.isArray(note.tatoueurs) &&
        note.tatoueurs.length > tatoueurs.length &&
        Date.now() - (note.quand ?? 0) <= DUREE_MS
      ) {
        return;
      }
    }
    sessionStorage.setItem(
      CLE,
      JSON.stringify({ adresse, tatoueurs, page, total, quand: Date.now() })
    );
  } catch {
    // Rien : perdre l'instantané ne doit jamais casser la navigation.
  }
}

/** La mosaïque mise de côté POUR CETTE ADRESSE, ou null. */
export function lireMosaique(adresseDemandee: string): MosaiqueMemorisee | null {
  const adresse = adresseDeRecherche(adresseDemandee);
  try {
    const brut = sessionStorage.getItem(CLE);
    if (!brut) return null;
    const note = JSON.parse(brut) as MosaiqueMemorisee | null;
    if (!note || note.adresse !== adresse) return null;
    if (Date.now() - note.quand > DUREE_MS) return null;
    // Une mosaïque plus courte que ce que le serveur vient de rendre
    // n'a rien à apporter : on la laisse tomber.
    if (!Array.isArray(note.tatoueurs) || note.tatoueurs.length === 0) {
      return null;
    }
    return note;
  } catch {
    return null;
  }
}

/** L'adresse courante, telle que la mémoire la nomme — c'est-à-dire
    l'adresse CANONIQUE de la recherche affichée (nº 184-§2). */
export function adresseCourante(): string {
  return adresseDeRechercheCourante();
}
