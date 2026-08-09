/**
 * L'HABILLAGE DU PRODUIT ARTISANS — et de LUI SEUL
 * =================================================
 * L'en-tête blanc, le pied de page complet et le bandeau cookies du
 * produit artisans vivent ICI, dans la mise en page de leur propre
 * groupe. C'est la correction de la passe nº 145-§1.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE — ET CE QU'IL REMPLACE.
 * Cet habillage vivait dans la mise en page RACINE, celle que TOUS les
 * produits partagent. Il s'appliquait donc partout par défaut, et une
 * LISTE D'ADRESSES tenue à la main (`ADRESSES_SANS_HABILLAGE_CLAIR`)
 * disait lesquelles n'en voulaient pas. Une liste s'oublie : trois
 * adresses de yokofolio nées après elle — /mes-favoris,
 * /apres-connexion, /rejoindre/<jeton> — n'y ont jamais été
 * inscrites, et affichaient donc la barre fixe d'un AUTRE PRODUIT à
 * un visiteur de yokofolio.
 *
 * Désormais la règle est STRUCTURELLE, plus déclarative : l'habillage
 * n'est plus posé nulle part par défaut, il est posé ici, et seules
 * les pages RANGÉES DANS CE DOSSIER le reçoivent. Une nouvelle page de
 * yokofolio (ou de l'agence, ou des outils) ne peut plus le porter par
 * oubli — il faudrait l'écrire dans ce groupe pour cela.
 *
 * « (artisans) » entre parenthèses n'apparaît PAS dans les adresses :
 * /artisans, /artisan/<nom>, /<métier>/<ville>, /favoris, /compte…
 * gardent exactement les leurs.
 */

import { BandeauCookies } from "@/components/BandeauCookies";
import { EnTete } from "@/components/EnTete";
import { PiedDePage } from "@/components/PiedDePage";

export default function MiseEnPageArtisans({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Menu commun aux pages du produit ARTISANS (collé en haut). */}
      <EnTete />
      {children}
      {/* Pied de page commun aux pages du produit artisans */}
      <PiedDePage />
      {/* Information cookies (RGPD) */}
      <BandeauCookies />
    </>
  );
}
