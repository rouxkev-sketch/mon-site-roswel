"use client";

import { IconeEclair, IconeGoutteDEncre } from "@/components/Icones";
import {
  COULEURS_SOMBRE,
  LIGNE_BORD_A_BORD_DOIGT,
  TEXTES_TATOUAGE,
  TRAIT_SEPARATION_FOND,
} from "@/config/tatouage";
import { poserNatureAccueil, useNatureAccueil } from "@/lib/nature-accueil";
import type { SlugNature } from "@/lib/photos-tatoueur";

/**
 * ██ §1-§2 (nº 857) — LE VA-ET-VIENT TATTOO / FLASH DE L'ACCUEIL DU DOIGT ██
 * ======================================================================
 * DÉCISION DU PROPRIÉTAIRE : le champ de recherche de l'accueil
 * DISPARAÎT (la loupe de la barre le remplace, comme sur les autres
 * pages) et, à sa place, un BOUTON DE VA-ET-VIENT à deux positions —
 * des onglets segmentés :
 *  · « Find your tattoo style… », une GOUTTE D'ENCRE à sa gauche ;
 *  · « Find your Flash style… », un ÉCLAIR à sa gauche.
 * LE TEXTE EST TROP LONG POUR LES DEUX À LA FOIS, et c'est réglé comme
 * il l'a dit : la position ACTIVE montre icône + texte, la position
 * INACTIVE montre l'ICÔNE SEULE. Un tap bascule.
 *
 * LA ROBE, ET D'OÙ ELLE VIENT : une piste en pilule au fond des badges
 * de recherche (`carteClair`, le barreau de la nº 848), et dedans la
 * position active en pilule pleine d'un cran plus clair (`haut`), texte
 * et icône en blanc de la charte ; l'icône inactive en gris doux, dans
 * un rond de la hauteur de la piste. Les deux fonds VOYAGENT DANS LE
 * MARQUAGE (la leçon de la nº 849 : une classe neuve n'existe que dans
 * une feuille neuve — un fond que la feuille ignore ne se peint pas).
 *
 * LA HAUTEUR EST CELLE DU CHAMP QU'IL REMPLACE, ET C'EST VOULU : 43 px
 * de piste + la boîte de 3 px de la ligne = 46 — l'arithmétique même du
 * va-et-vient de « Ma sélection » (OngletsLigne, 43 + 3). La rangée de
 * la barre garde donc ses 58 (12 d'air + 46), la réserve ses 122
 * (lib/reserve-barre), et le squelette n'a rien à apprendre.
 *
 * IL EST FIXE (§2) : il vit DANS LA BARRE FIXE, à la place de la pilule,
 * et la barre ne replie jamais sa rangée sur l'accueil (nº 846,
 * `rangeeFixe`). La page défile SOUS SA LIGNE DE SÉPARATION — la ligne
 * fine et grise qui court bord à bord sous la piste, la même que celle
 * de « Ma sélection » (`LIGNE_BORD_A_BORD_DOIGT`), et le contenu passe
 * dessous comme sous la barre.
 *
 * L'ARIA EST CELLE DES ONGLETS DU SITE : `radiogroup` + `radio` /
 * `aria-checked`, et la position à icône seule garde son NOM entier
 * (`aria-label`) — un lecteur d'écran entend les deux textes, l'œil n'en
 * voit qu'un.
 *
 * ⚠️ AU DOIGT SEULEMENT (règle nº 60, `mobile:`) : le web garde son champ.
 * ⚠️ QUI L'ÉCOUTE : la page (IndexTatoueurs) lit la même nature dans le
 * même magasin (lib/nature-accueil) et montre les cartes de style de
 * cette nature — c'est le §4.
 */
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
      <div
        role="radiogroup"
        aria-label="Tattoo or flash"
        style={{ backgroundColor: COULEURS_SOMBRE.carteClair }}
        className="flex min-h-[43px] items-center rounded-full"
      >
        {POSITIONS.map(({ nature, texte, Icone }) => {
          const actif = nature === active;
          return (
            <button
              key={nature}
              type="button"
              role="radio"
              aria-checked={actif}
              aria-label={texte}
              data-position-nature={nature}
              onClick={() => poserNatureAccueil(nature)}
              style={actif ? { backgroundColor: COULEURS_SOMBRE.haut } : undefined}
              className={`flex min-h-[43px] items-center justify-center gap-2 rounded-full
                          transition-colors ${
                            actif
                              ? "min-w-0 flex-1 px-4 text-sombre-texte"
                              : "w-[43px] shrink-0 text-sombre-texte-doux"
                          }`}
            >
              <Icone taille={20} classe="shrink-0" />
              {actif && (
                <span className="min-w-0 truncate text-[15px] leading-tight font-semibold">
                  {texte}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/*  LA LIGNE DE SÉPARATION — la boîte de 3 px des onglets du site,
           et dedans le trait d'un pixel, gris de la charte, BORD À BORD :
           c'est sous elle que la page défile. */}
      <div className="relative h-[3px]" aria-hidden="true">
        <span
          data-ligne-va-et-vient=""
          className={`absolute bottom-0 h-px ${TRAIT_SEPARATION_FOND} ${LIGNE_BORD_A_BORD_DOIGT}`}
        />
      </div>
    </div>
  );
}
