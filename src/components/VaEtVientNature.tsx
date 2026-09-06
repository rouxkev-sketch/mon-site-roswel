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
import {
  demanderRestaurationPosition,
  lireLaPlace,
  memoriserDefilement,
} from "@/lib/navigation-session";
//  §3 (nº 875) — le glissement latéral du site : UN seul reconnaisseur
//  pour « Ma sélection » (nº 526), une fiche (nº 527) et désormais
//  l'accueil. Voir la note du balayage, plus bas.
import { useGlissementLateralSurLaPage } from "@/lib/glissement-lateral";
//  §3 (nº 875) — la position se lit SOUS LE GEL, jamais brute (point 4
//  de la règle de navigation).
import { positionSousLeGel } from "@/lib/gel-du-corps";

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
 * CE QUE LA MESURE DISAIT À LA nº 863, ET QU'IL FALLAIT DIRE : au corps
 * de la charte (15 px demi-gras), « Explore tattoo styles » faisait
 * 159 px d'encre — 195 avec l'icône, son écart et le rembourrage — pour
 * des colonnes de 179 px à 390, 164 à 360 : les deux titres ne tenaient
 * pas sur une ligne, et passaient à la ligne dans leur colonne, entiers.
 *
 * ██ §1 (nº 865) — L'ARBITRAGE DU PROPRIÉTAIRE : « Tattoo styles » ET
 * « Flash styles » ██
 * ------------------------------------------------------------------
 * « Explore » s'en va, et tout tient : 106 et 96 px d'encre, 142 et 132
 * avec l'icône, pour les mêmes colonnes. Entiers, sur UNE ligne, aux
 * deux positions, sur tous les téléphones courants — mesuré au banc
 * 864. Ce que la nº 863 avait posé pour le cas des deux lignes
 * (l'interligne de vingt, l'alignement à gauche) n'a plus d'objet et
 * repart avec lui : le titre porte l'écriture nue de l'onglet, comme
 * les mots de « Ma sélection ».
 *
 * ██ §1 ET §2 (nº 875) — L'ÉTAPE REMPLACÉE, LA DEMANDE CONDITIONNÉE ██
 * ------------------------------------------------------------------
 * DEUX CHOSES CHANGENT ICI, ET ELLES SONT DE LA MÊME FAMILLE :
 *  · L'ÉTAPE D'HISTORIQUE. Basculer d'une nature à l'autre REMPLACE
 *    l'étape courante au lieu d'en poser une (§1). Rien n'est écrit
 *    dans ce fichier : la règle vit chez le lien partagé
 *    (OngletsLigne, §1 nº 875), avec son pourquoi, et les deux
 *    va-et-vient à adresses du site l'héritent ensemble.
 *  · LA DEMANDE DE RESTITUTION, QUI NE SE POSE PLUS À VIDE (§2).
 *    Jusqu'ici, toucher un onglet posait `demanderRestaurationPosition`
 *    SANS CONDITION — même quand la page visée n'avait aucune place
 *    rangée. La demande restait alors en session, nominative, et
 *    attendait : la prochaine arrivée à cette adresse-là, quelle
 *    qu'elle soit, la consommait et RENDAIT une place qu'on n'avait
 *    pas demandée. Le va-et-vient d'un portfolio ne fait pas cela
 *    depuis la nº 873 — il ne déclare QUE SI une place existe
 *    (`avantDePartir`, ContenuFiche) —, et c'est la bonne règle : une
 *    première visite arrive en haut, nette et instantanée. Les deux
 *    va-et-vient la partagent désormais mot pour mot.
 *    ⚠️ ET LE PLANCHER LA RESSERRE ENCORE, GRATUITEMENT : depuis la
 *    nº 875, `lireLaPlace` ne rend rien sous 24 px (une note de six
 *    pixels n'est pas une place). La question posée ici — « une place
 *    existe-t-elle ? » — hérite donc du plancher sans le connaître.
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
 * ⚠️ ET C'EST LE MÊME CHEMIN QUE LE TOUCHER D'UN ONGLET (`allerA`) :
 * une seule écriture pour les deux gestes. Un glissement n'étant pas un
 * clic, la mémoire de navigation n'a pas vu partir la page — on écrit
 * donc sa place nous-mêmes, exactement comme le glissement d'une fiche
 * (ContenuFiche, §2 nº 527).
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

  /*  §2 (nº 875) — CE QU'IL FAUT DÉCLARER AVANT DE PARTIR, et rien de
      plus : la demande n'est posée QUE SI la page visée a une place.
      C'est mot pour mot `avantDePartir` d'une fiche (ContenuFiche,
      §1 nº 873) — voir la note de l'en-tête. */
  const avantDePartir = (adresse: string) => {
    if (lireLaPlace(adresse)) demanderRestaurationPosition(adresse);
  };

  /*  §3 (nº 875) — LE BALAYAGE. Il ne fait rien d'autre que ce que fait
      le toucher d'un onglet, à une ligne près : la mémoire de
      navigation n'a pas vu partir la page (aucun clic), on écrit donc
      sa place avant de la quitter. Voir la note de l'en-tête. */
  useGlissementLateralSurLaPage((sens) => {
    const voulue = POSITIONS[sens === 1 ? 1 : 0];
    if (voulue.nature === active) return;
    memoriserDefilement(
      window.location.pathname + window.location.search,
      positionSousLeGel()
    );
    avantDePartir(voulue.adresse);
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
          //  §2 (nº 860) — « la prochaine arrivée à cette adresse rend
          //  sa place » : posé au départ, consommé à l'arrivée par
          //  MemoireNavigation. Voir la note, plus haut.
          //  §2 (nº 875) — … ET SEULEMENT S'IL Y A UNE PLACE (voir
          //  `avantDePartir`, plus haut) : une première visite arrive
          //  en haut, et aucune demande ne reste à traîner en session.
          surClic: () => avantDePartir(adresse),
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
