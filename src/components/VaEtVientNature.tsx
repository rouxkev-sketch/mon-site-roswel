"use client";

import { usePathname, useRouter } from "next/navigation";
import { IconeEclair, IconeGoutteDEncre } from "@/components/Icones";
import { OngletsLigne } from "@/components/OngletsLigne";
import { LIGNE_BORD_A_BORD_DOIGT, TEXTES_TATOUAGE } from "@/config/tatouage";
import {
  ADRESSE_ACCUEIL,
  ADRESSE_ACCUEIL_FLASH,
} from "@/lib/chemin-recherche";
import { NATURE_PAR_DEFAUT, type SlugNature } from "@/lib/photos-tatoueur";
//  §3 (nº 875) — le glissement latéral du site : UN seul reconnaisseur
//  pour « Ma sélection » (nº 526), une fiche (nº 527) et désormais
//  l'accueil. Voir la note du balayage, plus bas.
import { useGlissementLateralSurLaPage } from "@/lib/glissement-lateral";

/**
 * ██ LE VA-ET-VIENT TATTOO / FLASH DE L'ACCUEIL DU DOIGT ██
 * ======================================================================
 * DÉCISION DU PROPRIÉTAIRE (nº 857) : le champ de recherche de l'accueil
 * DISPARAÎT (la loupe de la barre le remplace) et, à sa place, un
 * va-et-vient à deux positions —
 *  · « Find your tattoo style… », une GOUTTE D'ENCRE à sa gauche ;
 *  · « Find your Flash style… », un ÉCLAIR à sa gauche.
 * La position ACTIVE porte icône + phrase, l'INACTIVE icône + mot court
 * (« Tattoo » / « Flash », nº 859-§2) : la phrase entière ne tient pas
 * deux fois, et un dessin seul ne disait pas assez.
 * SON DESSIN EST CELUI DU SITE (nº 858) : `OngletsLigne`, le va-et-vient
 * de « Ma sélection », avec ses réglages — même boîte d'onglet, même
 * ligne grise bord à bord, même typographie, même trait rose qui glisse.
 *
 * ██ §1 ET §3 (nº 860) — DEUX PAGES, PLUS UN INTERRUPTEUR ██
 * ------------------------------------------------------------------
 * CE QUI CHANGE, ET C'EST TOUT CE QUI CHANGE : ces deux positions ne
 * basculent plus un magasin de session — elles MÈNENT À DEUX PAGES,
 * « / » et « /flash ». Le va-et-vient est devenu une NAVIGATION, et son
 * onglet actif se lit dans L'ADRESSE.
 * POURQUOI : un interrupteur, c'est une seule page, donc une seule
 * position de défilement — aller dans Flash remontait la page. Le
 * propriétaire l'a vu trois passes de suite. Deux pages, et la mémoire
 * de position du site fait le travail seule, pour ces deux adresses
 * comme pour toutes les autres.
 * CE QUI PART AVEC : `lib/nature-accueil` — le magasin, sa mémoire de
 * session et les positions que la nº 859 retenait à la main. Rien de
 * tout cela n'a plus de raison d'être, et un mécanisme sans emploi est
 * un piège pour la passe suivante (règle nº 386).
 *
 * ██ §2 (nº 860) — LA PLACE DE CHAQUE NATURE : RETIRÉE À LA nº 889 ██
 * ------------------------------------------------------------------
 * LA DEMANDE D'ALORS : « Tattoo à 800 → Flash (sa position à elle) →
 * retour Tattoo à 800 ». Elle tenait par une demande nominative de
 * restitution (`demanderRestaurationPosition`) posée au départ et
 * consommée à l'arrivée. LE PROPRIÉTAIRE L'A RETIRÉE À LA nº 889 :
 * les deux accueils rouvrent EN HAUT, comme toute page neuve, et la
 * perte est assumée (voir docs/DEFILEMENT-889-INVENTAIRE.md).
 * ⚠️ CE QUI NE CHANGE PAS : basculer d'une nature à l'autre REMPLACE
 * l'étape d'historique (§1 nº 875, chez OngletsLigne) — un seul retour
 * ramène donc là d'où l'on venait.
 *
 * ██ §3 (nº 875) — UN BALAYAGE HORIZONTAL BASCULE TATTOO ↔ FLASH ██
 * ------------------------------------------------------------------
 * DÉCISION DU PROPRIÉTAIRE : au doigt, sur l'accueil, un balayage
 * horizontal passe d'une nature à l'autre — vers la gauche on va aux
 * flashs (l'onglet de droite), vers la droite on revient aux tattoos.
 * LE RECONNAISSEUR EST CELUI DU SITE, PAS UN SECOND (piège nº 378) :
 * `lib/glissement-lateral`, écrit à la nº 526 pour « Ma sélection » et
 * porté aux fiches à la nº 527. Chez lui sont écrits le seuil (64 px),
 * le verrou d'axe (le déplacement horizontal doit l'emporter, et la
 * dérive verticale annule), la bande de bord que le navigateur se
 * réserve pour SON geste de retour, le refus quand une surface est
 * ouverte par-dessus, le refus du pincement, et l'avalement du clic
 * fantôme. ICI, il ne reste que la traduction : le sens voulu désigne
 * une adresse, et cette adresse se rejoint comme si l'on avait touché
 * l'onglet.
 * ⚠️ « SANS CONFLIT AVEC LE GLISSEMENT DES PHOTOS », et c'est GRATUIT :
 * le module refuse tout geste qui part d'une boîte QUI DÉFILE
 * HORIZONTALEMENT (`partDUneZoneQuiDefile`, mesure générique, aucun
 * attribut à poser). Un balayage commencé sur une carte-galerie de
 * l'accueil fait donc défiler ses photos, et ne bascule rien — c'est
 * exactement la consigne, et elle vaudra aussi pour ce qu'une passe
 * future ajoutera.
 * ⚠️ LA ZONE : le geste doit PARTIR du corps de l'accueil
 * (`[data-corps-accueil]`, nommé chez IndexTatoueurs) — pas de la barre
 * fixe, où les onglets sont déjà des cibles tactiles.
 * ⚠️ AU DOIGT SEULEMENT, SANS UNE GARDE À ÉCRIRE : le module n'écoute
 * que des événements TACTILES et exige `data-appareil="mobile"` — la
 * règle nº 60, jamais une largeur.
 * ⚠️ ET C'EST LE MÊME CHEMIN QUE LE TOUCHER D'UN ONGLET : une seule
 * écriture pour les deux gestes.
 */

const POSITIONS: ReadonlyArray<{
  nature: SlugNature;
  /** L'adresse de la page — c'est elle qui décide, désormais (nº 860). */
  adresse: string;
  /** Le titre entier — les deux positions le portent tel quel, et
      c'est aussi leur nom accessible. */
  texte: string;
  Icone: typeof IconeGoutteDEncre;
}> = [
  {
    nature: "tatouage",
    adresse: ADRESSE_ACCUEIL,
    texte: TEXTES_TATOUAGE.titreVaEtVientTattoo,
    Icone: IconeGoutteDEncre,
  },
  {
    nature: "flash",
    adresse: ADRESSE_ACCUEIL_FLASH,
    texte: TEXTES_TATOUAGE.titreVaEtVientFlash,
    Icone: IconeEclair,
  },
];

export function VaEtVientNature() {
  /*  §1 (nº 860) — LA PAGE OUVERTE SE LIT DANS L'ADRESSE, et nulle part
      ailleurs : plus de magasin, plus de mémoire à tenir d'accord. */
  const chemin = usePathname();
  const router = useRouter();
  const active: SlugNature =
    chemin === ADRESSE_ACCUEIL_FLASH ? "flash" : NATURE_PAR_DEFAUT;

  /*  §3 (nº 875) — LE BALAYAGE. Il ne fait rien d'autre que ce que fait
      le toucher d'un onglet. Voir la note de l'en-tête. */
  useGlissementLateralSurLaPage((sens) => {
    const voulue = POSITIONS[sens === 1 ? 1 : 0];
    if (voulue.nature === active) return;
    //  §1 (nº 875) — REMPLACER, jamais empiler : la même règle que le
    //  lien d'onglet, qui la porte pour les deux (OngletsLigne).
    router.replace(voulue.adresse);
  }, "[data-corps-accueil]");

  return (
    <div data-va-et-vient-nature="" className="hidden mobile:block w-full">
      <OngletsLigne
        ariaLabel="Tattoo or flash"
        cleActive={active}
        classeOnglet="px-1 min-h-[43px]"
        classeLigne={LIGNE_BORD_A_BORD_DOIGT}
        options={POSITIONS.map(({ nature, adresse, texte, Icone }) => ({
          cle: nature,
          href: adresse,
          nom: texte,
          /*  §1 (nº 863) — LES DEUX POSITIONS PORTENT LEUR ICÔNE ET LEUR
              TITRE ENTIER, actives ou non : rien ne change à la bascule
              que la couleur et le trait. Le titre n'est pas coupé
              (`truncate` est parti à la nº 863) : jamais abrégé, c'est
              la consigne.
              §1 (nº 865) — ET IL TIENT SUR UNE LIGNE (« Tattoo styles »,
              « Flash styles ») : l'interligne de vingt et l'alignement à
              gauche que la nº 863 avait posés pour deux lignes n'ont
              plus d'objet — une classe qui ne dit plus rien est un piège
              pour la passe suivante, elles partent. */
          label: (
            <span className="flex min-w-0 items-center gap-2">
              <Icone taille={20} classe="shrink-0" />
              <span className="min-w-0">{texte}</span>
            </span>
          ),
        }))}
      />
    </div>
  );
}
