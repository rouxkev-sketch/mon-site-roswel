import type { Metadata } from "next";
import { TAILLE_PAGE_REPLI } from "@/lib/colonnes-mosaique";
import { ADRESSE_ACCUEIL_FLASH } from "@/lib/chemin-recherche";
import { phototequeDuCookie } from "@/lib/vue-phototheque";
import { metadonneesAccueil, RenduAccueil } from "../_accueil/rendu";

/**
 * ██ §1 (nº 860) — L'ACCUEIL FLASH EST UNE PAGE, PAS UN INTERRUPTEUR ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE : les accueils Tattoo et Flash deviennent
 * DEUX ADRESSES — « / » et « /flash » —, comme « Favoris » et
 * « Portfolios » dans « Ma sélection ». Le va-et-vient de la barre les
 * relie par un lien (navigation douce) au lieu de basculer un magasin.
 *
 * LE DÉFAUT QUE CELA FERME, ET IL EST ENTIER : un interrupteur, c'est
 * UNE page — donc UNE position de défilement. Aller dans Flash remontait
 * la page ; la nº 859 avait dû retenir les deux positions à la main, et
 * le propriétaire voit encore la bascule. Deux pages, et c'est la
 * MÉMOIRE DE POSITION DU SITE qui s'en charge, comme partout ailleurs
 * (MemoireNavigation, banc 732) : chaque adresse garde la sienne, sans
 * une ligne écrite pour elle.
 *
 * ELLE EST PRÉRENDUE COMME L'ACCUEIL, et pour les mêmes raisons (nº 357,
 * lisibles sur `page.tsx` : aucune lecture de cookie, d'en-tête ni de
 * paramètre, régénération toutes les cinq minutes). Les deux pages
 * partagent le MÊME rendu (`_accueil/rendu`) et la MÊME lecture de
 * catalogue : elles ne peuvent pas se contredire.
 * ⚠️ ELLE N'A PAS DE SQUELETTE, ET C'EST VOULU : l'accueil n'en a pas
 * (pas de `loading.tsx`) parce qu'il est prérendu — il arrive d'un coup.
 * « Le squelette de /flash = celui de l'accueil » : aucun, des deux
 * côtés, et rien à sauter.
 * ⚠️ AU WEB, L'ADRESSE RÉPOND À L'IDENTIQUE : c'est le même rendu. Le
 * va-et-vient, lui, ne s'y affiche pas (il est propre au doigt) — voir
 * le compte rendu de la passe, qui dit par où le web y accède.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return metadonneesAccueil({}, TAILLE_PAGE_REPLI, ADRESSE_ACCUEIL_FLASH);
}

export default function AccueilFlash() {
  return (
    <RenduAccueil
      params={{}}
      taillePage={TAILLE_PAGE_REPLI}
      phototequeSansTexte={phototequeDuCookie(undefined)}
      mosaiqueNue
      natureDuCatalogue="flash"
    />
  );
}
