/* eslint-disable @next/next/no-img-element */
import { MARQUE } from "@/config/roswel";

/**
 * LOGOS DÉFINITIFS
 * ----------------
 * Les deux fichiers officiels sont déposés dans public/images/ et
 * sont INTOUCHABLES (règle dans AGENTS.md — comme .env.local) :
 *  - /images/roswel-icone.png : l'icône seule (carré arrondi rose,
 *    coche blanche opaque) — favicon, PWA, modules de l'accueil ;
 *  - /images/roswel-logo.png  : le logo complet (icône + nom) —
 *    menu, pages légales, pages admin.
 * Tout le site passe par ces deux composants : pour changer de
 * logo un jour, il suffira de remplacer les fichiers images.
 */

// L'icône seule (carré arrondi + coche blanche)
export function LogoIcone({ taille = 40 }: { taille?: number }) {
  return (
    <img
      src="/images/roswel-icone.png"
      alt={`Logo ${MARQUE.nom}`}
      width={taille}
      height={taille}
      style={{ width: taille, height: taille }}
    />
  );
}

// Largeur/hauteur du logo complet : l'espace est RÉSERVÉ dès le
// premier rendu (plus d'image « contractée » qui saute en se
// chargeant). Si le vôtre est plus étroit ou plus large, ajustez ce
// seul nombre (largeur ÷ hauteur du fichier roswel-logo.png).
const RATIO_LOGO_COMPLET = 3.2;

// Le logo complet : icône + nom « roswel ».
// « tailleIcone » garde son sens historique : la hauteur d'affichage.
// « classe » permet une hauteur QUI CHANGE AVEC LA LARGEUR D'ÉCRAN (le
// menu est plus grand sur le web que sur le téléphone) : la hauteur
// vient alors des classes, la largeur suit toute seule (`w-auto` + les
// attributs width/height, qui donnent le rapport du fichier). Sans
// classe, rien ne change : hauteur et largeur restent posées en dur,
// comme avant, et l'espace est réservé dès le premier rendu.
export function LogoComplet({
  tailleIcone = 36,
  classe,
}: {
  tailleIcone?: number;
  classe?: string;
}) {
  return (
    <img
      src="/images/roswel-logo.png"
      alt={MARQUE.nom}
      width={Math.round(tailleIcone * RATIO_LOGO_COMPLET)}
      height={tailleIcone}
      className={classe}
      style={
        classe
          ? { objectFit: "contain", objectPosition: "left center" }
          : {
              height: tailleIcone,
              width: tailleIcone * RATIO_LOGO_COMPLET,
              objectFit: "contain",
              objectPosition: "left center",
            }
      }
    />
  );
}
