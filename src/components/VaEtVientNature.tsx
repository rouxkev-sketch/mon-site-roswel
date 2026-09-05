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
 *
 * ██ §1 (nº 863) — DEUX TITRES, TOUJOURS ENTIERS ██
 * ------------------------------------------------------------------
 * DÉCISION DU PROPRIÉTAIRE : les deux positions deviennent « Explore
 * tattoo styles » (goutte) et « Explore flash styles » (éclair), icône
 * devant chaque titre, et les titres restent TOUJOURS ENTIERS, actif
 * comme inactif — plus jamais d'abréviation. Le mot court de la nº 859
 * et sa colonne de 88 px partent donc, code compris : les deux colonnes
 * redeviennent égales, comme celles de « Ma sélection » (le défaut du
 * composant partagé, sans `largeurInactive`).
 * CE QUE LA MESURE DIT, ET QU'IL FAUT DIRE : au corps de la charte
 * (15 px demi-gras), « Explore tattoo styles » fait 159 px d'encre ;
 * avec l'icône (20), son écart (8) et le rembourrage (4 de chaque
 * côté), une position demande 195 px. Les deux côte à côte : 390 —
 * sur une grille qui en offre 358 à 390 px de large (la page pose ses
 * marges), 343 à 375, 328 à 360. LES DEUX TITRES NE TIENNENT DONC PAS
 * SUR UNE LIGNE À CE CORPS, sur aucun téléphone courant. La consigne
 * pour ce cas est « le dire et proposer, ne pas abréger » : rien n'est
 * abrégé, rien n'est réduit — le titre PASSE À LA LIGNE dans sa
 * colonne (plus de `truncate`), et la page reste lisible en attendant
 * l'arbitrage du propriétaire (voir le compte rendu de la passe).
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
  const active: SlugNature =
    chemin === ADRESSE_ACCUEIL_FLASH ? "flash" : NATURE_PAR_DEFAUT;
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
          //  §2 (nº 860) — « la prochaine arrivée à cette adresse rend
          //  sa place » : posé au départ, consommé à l'arrivée par
          //  MemoireNavigation. Voir la note, plus haut.
          surClic: () => demanderRestaurationPosition(adresse),
          /*  §1 (nº 863) — LES DEUX POSITIONS PORTENT LEUR ICÔNE ET LEUR
              TITRE ENTIER, actives ou non : rien ne change à la bascule
              que la couleur et le trait. Le titre n'est plus coupé
              (`truncate` est parti) : là où la colonne est trop étroite
              pour lui, il passe à la ligne — jamais abrégé, c'est la
              consigne. `text-left` : un titre sur deux lignes se lit
              aligné sur son icône, pas centré ligne par ligne.
              ⚠️ `leading-5` — ET LA BARRE NE GRANDIT PAS D'UN PIXEL :
              deux lignes à l'interligne courant (22,5 px) font 45, soit
              deux de plus que l'onglet (43) ; la ligne du va-et-vient
              descendait d'autant, sous la réserve que la page garde à
              la barre (116, lib/reserve-barre), et le premier contenu
              se retrouvait à quatorze de la ligne au lieu de seize
              (mesuré au banc 863). À vingt pixels d'interligne, les
              deux lignes font quarante et tiennent dans l'onglet : la
              barre, sa réserve et le script d'avant peinture ne bougent
              pas. Un seul interligne sur ce texte (piège nº 389). */
          label: (
            <span className="flex min-w-0 items-center gap-2">
              <Icone taille={20} classe="shrink-0" />
              <span className="min-w-0 text-left leading-5">{texte}</span>
            </span>
          ),
        }))}
      />
    </div>
  );
}
