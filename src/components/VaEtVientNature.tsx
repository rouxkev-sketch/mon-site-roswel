"use client";

import { IconeEclair, IconeGoutteDEncre } from "@/components/Icones";
import { OngletsLigne } from "@/components/OngletsLigne";
import { LIGNE_BORD_A_BORD_DOIGT, TEXTES_TATOUAGE } from "@/config/tatouage";
import { poserNatureAccueil, useNatureAccueil } from "@/lib/nature-accueil";
import type { SlugNature } from "@/lib/photos-tatoueur";

/**
 * ██ §1-§2 (nº 857, REFAIT §1 nº 858) — LE VA-ET-VIENT TATTOO / FLASH
 * DE L'ACCUEIL DU DOIGT ██
 * ======================================================================
 * DÉCISION DU PROPRIÉTAIRE (nº 857) : le champ de recherche de l'accueil
 * DISPARAÎT (la loupe de la barre le remplace, comme sur les autres
 * pages) et, à sa place, un va-et-vient à deux positions —
 *  · « Find your tattoo style… », une GOUTTE D'ENCRE à sa gauche ;
 *  · « Find your Flash style… », un ÉCLAIR à sa gauche.
 * LE TEXTE EST TROP LONG POUR LES DEUX À LA FOIS : la position ACTIVE
 * montre icône + phrase, l'INACTIVE l'ICÔNE SEULE. Un tap bascule.
 *
 * ██ §1 (nº 858) — CE N'EST PLUS UN OBJET À PART : C'EST LE VA-ET-VIENT
 * DU SITE ██
 * ------------------------------------------------------------------
 * CE QUE LA nº 857 AVAIT FAIT, ET QUE LE PROPRIÉTAIRE CORRIGE : elle
 * dessinait ici une piste en pilule, ses deux fonds et sa ligne — un
 * SECOND va-et-vient, qui ne ressemblait pas à celui de « Ma sélection ».
 * « Il doit être LE MÊME COMPOSANT », à la lettre. Ce fichier ne dessine
 * donc plus rien : il APPELLE `OngletsLigne`, comme « Ma sélection »
 * (MenusSelection), avec les mêmes réglages —
 *   · la même boîte d'onglet (`px-1 min-h-[43px]`) ;
 *   · la même ligne grise, BORD À BORD au doigt (`LIGNE_BORD_A_BORD_DOIGT`,
 *     la même constante) ;
 *   · la même typographie (le défaut du composant, 15 px demi-gras) ;
 *   · le même trait rose qui glisse sous l'onglet actif.
 * Sa hauteur est donc celle de l'autre au pixel : 43 + 3 = 46.
 *
 * CE QU'ON GARDE DE LA nº 857, ET RIEN D'AUTRE : la MÉCANIQUE. L'onglet
 * inactif se réduit à son icône, l'actif porte icône + phrase. Le
 * composant sait le faire depuis la nº 858 (`largeurInactive`), sans
 * quoi la phrase serait coupée — 179 px de colonne pour 202 de contenu,
 * mesuré. Le nom entier reste celui de chaque onglet (`nom`) : l'œil
 * voit un dessin, un lecteur d'écran entend la phrase.
 *
 * ⚠️ AU DOIGT SEULEMENT (règle nº 60) : le web garde son champ.
 * ⚠️ QUI L'ÉCOUTE : la page (IndexTatoueurs) lit la même nature dans le
 * même magasin (lib/nature-accueil) et montre les cartes de style de
 * cette nature — c'est le §4 de la nº 857.
 */

/** La largeur d'un onglet réduit à son icône : la hauteur de la piste,
    pour que le dessin y tienne dans un carré. */
const LARGEUR_ICONE_SEULE = "43px";

const POSITIONS: ReadonlyArray<{
  nature: SlugNature;
  texte: string;
  Icone: typeof IconeGoutteDEncre;
}> = [
  { nature: "tatouage", texte: TEXTES_TATOUAGE.invitePilule, Icone: IconeGoutteDEncre },
  { nature: "flash", texte: TEXTES_TATOUAGE.inviteFlash, Icone: IconeEclair },
];

export function VaEtVientNature() {
  const active = useNatureAccueil();
  return (
    <div data-va-et-vient-nature="" className="hidden mobile:block w-full">
      <OngletsLigne
        ariaLabel="Tattoo or flash"
        cleActive={active}
        surChoix={(cle) => poserNatureAccueil(cle as SlugNature)}
        classeOnglet="px-1 min-h-[43px]"
        classeLigne={LIGNE_BORD_A_BORD_DOIGT}
        largeurInactive={LARGEUR_ICONE_SEULE}
        options={POSITIONS.map(({ nature, texte, Icone }) => ({
          cle: nature,
          nom: texte,
          label:
            nature === active ? (
              <span className="flex min-w-0 items-center gap-2">
                <Icone taille={20} classe="shrink-0" />
                <span className="min-w-0 truncate">{texte}</span>
              </span>
            ) : (
              <Icone taille={20} classe="shrink-0" />
            ),
        }))}
      />
    </div>
  );
}
