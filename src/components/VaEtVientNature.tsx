"use client";

import { usePathname } from "next/navigation";
import { IconeEclair, IconeGoutteDEncre } from "@/components/Icones";
import { OngletsLigne } from "@/components/OngletsLigne";
import { LIGNE_BORD_A_BORD_DOIGT, TEXTES_TATOUAGE } from "@/config/tatouage";
import {
  ADRESSE_ACCUEIL,
  ADRESSE_ACCUEIL_FLASH,
} from "@/lib/chemin-recherche";
import { NATURE_PAR_DEFAUT, type SlugNature } from "@/lib/photos-tatoueur";
import { demanderRestaurationPosition } from "@/lib/navigation-session";

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
 * ██ §2 (nº 860) — CHAQUE PAGE RETROUVE SA PLACE ██
 * ------------------------------------------------------------------
 * LA DEMANDE : « Tattoo à 800 → Flash (sa position à elle) → retour
 * Tattoo à 800. Aucune influence entre les deux. »
 * CE QUE LE SITE FAIT DÉJÀ, ET QU'ON NE RÉÉCRIT PAS : il ÉCRIT la
 * position de la page qu'on quitte, à chaque départ par un lien, sous
 * la clé de son adresse (MemoireNavigation → `memoriserDefilement`).
 * Les deux places existent donc déjà, séparées, sans une ligne de plus.
 * CE QU'IL MANQUAIT : les rendre. Une navigation EN AVANT arrive en
 * haut — c'est la règle, et elle est juste (on ne veut pas qu'un lien
 * quelconque vous repose au milieu d'une page). Le site a un mot pour
 * l'exception, et il servait déjà au retour reconstruit d'une fiche :
 * `demanderRestaurationPosition(adresse)` — « la prochaine arrivée à
 * CETTE adresse rend sa place ». C'est exactement ce que ces deux
 * onglets sont : un aller-retour entre deux pages jumelles, pas une
 * navigation neuve.
 * ⚠️ LA DEMANDE EST NOMINATIVE : elle porte l'adresse visée, donc elle
 * ne peut pas repeindre une autre page ; et tout geste l'annule (voir
 * `oublierRestaurationPosition`) — si le doigt bouge avant l'arrivée,
 * on reste où le doigt a mis la page.
 * ⚠️ RIEN N'EST RETENU ICI : les positions vivent dans la mémoire du
 * site, sous les deux adresses. Le magasin de la nº 859, qui les gardait
 * à la main, est parti avec l'interrupteur.
 *
 * ⚠️ AU DOIGT SEULEMENT (règle nº 60) : le web garde son champ de
 * recherche dans la barre, et n'affiche pas ce va-et-vient. L'adresse
 * « /flash » y répond de la même façon — c'est la même page.
 * ⚠️ LES LIENS SONT DANS LE DOCUMENT AUX DEUX APPAREILS : ce bloc est
 * MASQUÉ au web (`hidden mobile:block`), pas retiré — les deux adresses
 * restent donc liées l'une à l'autre pour qui lit le document.
 */

/**
 * La largeur d'une position inactive, mesurée (nº 859) : « Tattoo », le
 * plus long des deux mots, fait 49 px au corps 15 demi-gras ; l'icône
 * 20 ; leur écart 8 ; le rembourrage 4 de chaque côté. Soit 85 — on
 * prend 88, le cran au-dessus. Il reste 270 à la position active, pour
 * une phrase qui en demande 210 : elle n'est pas coupée.
 */
const LARGEUR_MOT_COURT = "88px";

const POSITIONS: ReadonlyArray<{
  nature: SlugNature;
  /** L'adresse de la page — c'est elle qui décide, désormais (nº 860). */
  adresse: string;
  /** La phrase entière — la position active, et le nom accessible des
      deux (l'œil lit un mot, un lecteur d'écran entend la phrase). */
  texte: string;
  /** Le mot court de la position inactive (nº 859-§2) : les titres des
      deux catégories du catalogue, et les mots des onglets de la page
      de recherche. Aucun vocabulaire neuf. */
  mot: string;
  Icone: typeof IconeGoutteDEncre;
}> = [
  {
    nature: "tatouage",
    adresse: ADRESSE_ACCUEIL,
    texte: TEXTES_TATOUAGE.invitePilule,
    mot: "Tattoo",
    Icone: IconeGoutteDEncre,
  },
  {
    nature: "flash",
    adresse: ADRESSE_ACCUEIL_FLASH,
    texte: TEXTES_TATOUAGE.inviteFlash,
    mot: "Flash",
    Icone: IconeEclair,
  },
];

export function VaEtVientNature() {
  /*  §1 (nº 860) — LA PAGE OUVERTE SE LIT DANS L'ADRESSE, et nulle part
      ailleurs : plus de magasin, plus de mémoire à tenir d'accord. */
  const chemin = usePathname();
  const active: SlugNature =
    chemin === ADRESSE_ACCUEIL_FLASH ? "flash" : NATURE_PAR_DEFAUT;
  return (
    <div data-va-et-vient-nature="" className="hidden mobile:block w-full">
      <OngletsLigne
        ariaLabel="Tattoo or flash"
        cleActive={active}
        classeOnglet="px-1 min-h-[43px]"
        classeLigne={LIGNE_BORD_A_BORD_DOIGT}
        largeurInactive={LARGEUR_MOT_COURT}
        options={POSITIONS.map(({ nature, adresse, texte, mot, Icone }) => ({
          cle: nature,
          href: adresse,
          nom: texte,
          //  §2 (nº 860) — « la prochaine arrivée à cette adresse rend
          //  sa place » : posé au départ, consommé à l'arrivée par
          //  MemoireNavigation. Voir la note, plus haut.
          surClic: () => demanderRestaurationPosition(adresse),
          /*  Les deux positions portent leur icône ET un texte ; seul ce
              texte change — la phrase entière quand la page est ouverte,
              le mot court sinon. L'écriture est la même des deux côtés,
              et c'est ce qui fait que la bascule se lit comme un
              dépliement et non comme un échange. */
          label: (
            <span className="flex min-w-0 items-center gap-2">
              <Icone taille={20} classe="shrink-0" />
              <span className="min-w-0 truncate">
                {nature === active ? texte : mot}
              </span>
            </span>
          ),
        }))}
      />
    </div>
  );
}
