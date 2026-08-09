"use client";

import { useState } from "react";
import { ChampLocalisation } from "@/components/ChampLocalisation";
import {
  RechercheFicheInscrite,
  type FicheInscrite,
} from "@/components/RechercheFicheInscrite";
import type { LieuTrouve } from "@/lib/geocodage/types";

/**
 * SITUER UN LIEU — DEUX ZONES, L'UNE SOUS L'AUTRE
 * ================================================
 * ⚠️ CE COMPOSANT REMPLACE UNE ÉTAPE ENTIÈRE. On demandait d'abord
 * « ton studio est-il déjà sur yokofolio ? » avec deux boutons radio,
 * PUIS on affichait le champ correspondant. Trois clics pour une
 * information que le tatoueur connaît déjà — et un piège : cocher la
 * mauvaise case effaçait ce qu'on venait de saisir.
 *
 * LES DEUX CHEMINS SONT DONC OUVERTS EN MÊME TEMPS. On remplit celui
 * qui nous concerne, sans rien déclarer d'abord. La question ne se
 * pose plus : elle se résout en tapant.
 *
 * L'UNE SOUS L'AUTRE, JAMAIS CÔTE À CÔTE. Une adresse est trop large
 * pour la moitié d'un écran de téléphone : deux colonnes obligeraient
 * à tronquer, ou à faire défiler horizontalement.
 *
 * ⚠️ LA ZONE A N'EST JAMAIS BLOQUÉE. Une version précédente
 * ÉTEIGNAIT la zone inutilisée (`pointer-events-none`) : dès qu'une
 * adresse était saisie à la main, la recherche par nom devenait
 * inerte, et il fallait effacer l'adresse pour y revenir. C'était un
 * cul-de-sac — on tape souvent une adresse d'abord, PUIS on découvre
 * que son studio est déjà sur le site. La recherche reste donc
 * ouverte en permanence, adresse saisie ou non.
 *
 * ⚠️ LA ZONE B, ELLE, DISPARAÎT quand un établissement est retenu
 * (passe nº 105). Elle restait affichée, vidée par une reconstruction
 * du champ — un champ d'adresse vide sous un établissement déjà
 * choisi pose une question à laquelle il ne faut PAS répondre : le
 * lieu du mode, c'est celui de l'établissement. On ne montre pas un
 * champ qu'il ne faut pas remplir.
 *
 * ET ELLE REVIENT AVEC SON CONTENU. L'adresse qui était retenue au
 * moment du choix est MISE DE CÔTÉ (`lieuMisDeCote`), pas perdue :
 * retirer l'établissement par sa croix fait réapparaître le champ
 * exactement comme on l'avait laissé. Choisir un établissement pour
 * voir n'efface plus ce qu'on avait tapé avant.
 *
 * LA RÈGLE RESTE : UNE SEULE RÉPONSE EN MÉMOIRE.
 *  · trouver son studio dans la zone A REMPLACE l'adresse saisie
 *    (elle passe de côté, le champ disparaît) ;
 *  · le champ d'adresse n'existant plus quand un studio est retenu,
 *    l'autre sens ne peut plus se produire.
 * ⚠️ ET ELLE S'ÉCRIT EN UN SEUL GESTE : quand une zone prend la main,
 * c'est LE PARENT qui lâche l'autre réponse DANS LA MÊME écriture
 * (`surFiche` pose la fiche ET vide le lieu ; `surLieu` pose le lieu
 * ET vide la fiche). Deux écritures séparées se perdaient : React les
 * groupe, et la seconde — calculée depuis l'état d'avant — écrasait
 * la première. La fiche restait alors en mémoire SOUS l'adresse.
 *
 * PAS D'ENCADRÉ AUTOUR DES ZONES. Elles vivent DANS le contenant du
 * bloc de statut, et se distinguent par leur titre et l'espace qui
 * les sépare — c'est tout ce qu'il faut. Un cadre de plus, et l'œil
 * ne sait plus ce qui contient quoi.
 */

/**
 * ⚠️ LES DEUX SOUS-TITRES SONT DEVENUS FACULTATIFS (passe nº 100).
 * Ils annonçaient chacun leur zone : « Mon salon est sur le site » /
 * « Je ne trouve pas mon salon », et quatre variantes de plus pour un
 * guest. Six lignes de titre pour deux champs, au-dessus d'une
 * question — « Ton salon est-il sur yokofolio ? » — qui disait déjà
 * tout. Les appelants passent désormais `titre` (UNE question, au-
 * dessus des deux) et laissent `titreInscrit`/`titreManuel` à null.
 *
 * SANS TITRES, LA PASTILLE « RETENU » DISPARAÎT AUSSI — et rien n'est
 * perdu. Elle servait à désigner celle des deux réponses que le
 * formulaire garde ; or les deux champs ne peuvent PLUS afficher
 * quelque chose en même temps (voir `retenirLaFiche` et
 * `retenirLeLieu` : la dernière réponse lâche l'autre, et le champ
 * d'adresse se reconstruit à vide). Celui des deux qui porte du texte
 * EST le retenu : une pastille pour le redire serait du bruit.
 */

/** LA PASTILLE « RETENU » — elle dit LAQUELLE des deux réponses le
    formulaire garde, sans rien interdire à l'autre. */
function PastilleRetenu() {
  return (
    <span
      className="ml-2 inline-flex items-center rounded-full bg-primaire/15
                 px-2 py-0.5 align-middle text-[11px] font-semibold
                 uppercase tracking-wide text-primaire"
    >
      Retenu
    </span>
  );
}

export function DeuxZonesLieu({
  /** Une clé unique — deux modules sur la même page ne doivent pas
      partager les identifiants de leurs champs. */
  prefixe,
  /** LA QUESTION UNIQUE, au-dessus des deux zones — « Ton salon
      est-il sur yokofolio ? ». C'est la forme retenue partout depuis
      la passe nº 100 ; null quand l'appelant pose la question
      lui-même (le guest, qui l'accompagne de sa bascule). */
  titre = null,
  /** Les sous-titres, un par zone. FACULTATIFS : voir la note plus
      haut. Null = la zone n'a que son champ. */
  titreInscrit = null,
  titreManuel = null,
  /** La fiche inscrite retenue, s'il y en a une. */
  ficheChoisie,
  surFiche,
  /** Le lieu saisi à la main, s'il y en a un. */
  lieu,
  surLieu,
  surMobile,
  enErreur = false,
  /** Le type de fiche cherchée dans la zone A. */
  type = "salon",
  /** LA NATURE DU LIEU CHERCHÉ (passe nº 121) : « salon », « prive »,
      ou rien du tout pour accepter les deux. */
  etablissement,
  /** LA PHRASE QUAND LA ZONE A NE TROUVE RIEN (passe nº 121). */
  messageVide,
  /** CE QU'ON LIT DANS LES CHAMPS. Les deux zones servent au salon
      comme au studio privé : les mots changent, la mécanique non. */
  indicationInscrit = "Recherche par nom",
  indicationManuel = "Je tape son adresse",
}: {
  prefixe: string;
  titre?: string | null;
  titreInscrit?: string | null;
  titreManuel?: string | null;
  indicationInscrit?: string;
  indicationManuel?: string;
  ficheChoisie: FicheInscrite | null;
  surFiche: (fiche: FicheInscrite | null) => void;
  lieu: LieuTrouve | null;
  surLieu: (lieu: LieuTrouve | null) => void;
  surMobile: boolean;
  enErreur?: boolean;
  type?: "salon" | "artiste";
  etablissement?: "salon" | "prive";
  messageVide?: string;
}) {
  const zoneAremplie = Boolean(ficheChoisie);
  const zoneBremplie = !zoneAremplie && Boolean(lieu);

  /** L'ADRESSE MISE DE CÔTÉ pendant qu'un établissement est retenu
      (passe nº 105). Elle est capturée au moment du choix, et rendue
      au parent quand la croix retire l'établissement : le champ
      d'adresse réapparaît alors avec le contenu qu'il avait.
      ⚠️ SEULE UNE ADRESSE RETENUE (choisie dans la liste) se met de
      côté : du texte tapé sans être choisi n'a jamais été une
      réponse, il n'a rien à restituer. */
  const [lieuMisDeCote, setLieuMisDeCote] = useState<LieuTrouve | null>(null);

  /** CHOISIR UN STUDIO INSCRIT MET L'ADRESSE DE CÔTÉ ; le retirer la
      restitue. Le parent, lui, ne garde qu'UNE réponse à la fois —
      c'est sa propre écriture qui lâche l'autre (voir le contrat des
      deux rappels, dans la note d'en-tête). */
  function retenirLaFiche(fiche: FicheInscrite | null) {
    if (fiche) {
      setLieuMisDeCote(lieu);
      surFiche(fiche);
      return;
    }
    surFiche(null);
    //  MÊME NULLE, la restitution s'écrit : elle garantit qu'aucune
    //  adresse fantôme ne reste chez le parent après le détachement.
    surLieu(lieuMisDeCote);
    setLieuMisDeCote(null);
  }

  /** RETENIR UNE ADRESSE — le champ n'existe qu'en l'absence de
      studio retenu : il n'y a donc jamais d'autre réponse à lâcher
      ici. C'est le parent qui vide la sienne dans la même écriture. */
  function retenirLeLieu(choisi: LieuTrouve | null) {
    surLieu(choisi);
  }

  return (
    // LES DEUX CHAMPS SE SUIVENT DE PRÈS (gap-3) : ils répondent à UNE
    // seule question, posée une fois au-dessus. Seule la variante à
    // sous-titres (un par zone) garde ses cinq unités : là, chaque
    // zone forme un groupe qui respire.
    <div className={titreInscrit ? "flex flex-col gap-5" : "flex flex-col gap-3"}>
      {titre && (
        //  ⚠️ LES MARGES DE LA QUESTION (passe nº 105) : elle collait
        //  à ce qui la précède et flottait loin de ses champs — le
        //  contraire du bon sens, elle est LEUR titre. `mt-2` la
        //  décolle du haut ; le gap-3 du contenant (et non plus 5) la
        //  rapproche de ses deux zones.
        //  ⚠️ LE TITRE NE ROUGIT JAMAIS (passe nº 116) : « Ton salon
        //  est-il sur YokoFolio ? » reste BLANC en toutes
        //  circonstances — ce sont les CHAMPS qui s'encadrent de
        //  rouge, pas la question.
        <p className="mt-2 text-[13.5px] font-semibold text-sombre-texte">
          {titre}
        </p>
      )}

      {/* ---------- ZONE A — le lieu est déjà sur yokofolio ---------- */}
      <div>
        {titreInscrit && (
          //  Même règle qu'au-dessus (nº 116) : le titre reste blanc.
          <p className="mb-2 text-[13.5px] font-semibold text-sombre-texte">
            {titreInscrit}
            {zoneAremplie && <PastilleRetenu />}
          </p>
        )}
        <RechercheFicheInscrite
          id={`${prefixe}-inscrit`}
          type={type}
          //  LA NATURE DU LIEU ET LA PHRASE DU VIDE suivent le mode qui
          //  pose la question (passe nº 121).
          etablissement={etablissement}
          messageVide={messageVide}
          etiquette=""
          texteIndicatif={indicationInscrit}
          choisie={ficheChoisie}
          surChoix={retenirLaFiche}
          //  ⚠️ LE MANQUE ENCADRE AUSSI LA RECHERCHE (passe nº 116) :
          //  les deux champs répondent à la même question — quand elle
          //  reste sans réponse, les deux le disent.
          enErreur={enErreur}
        />
      </div>

      {/* ---------- ZONE B — il n'y est pas, on saisit l'adresse ----
          ⚠️ ELLE N'EXISTE PLUS quand un établissement est retenu
          (passe nº 105) : le lieu du mode est alors celui de
          l'établissement, et un champ d'adresse vide sous ce choix
          poserait une question à ne pas remplir. Elle REVIENT — avec
          l'adresse mise de côté — dès que la croix retire
          l'établissement. Le champ se remonte à ce moment-là et lit
          `lieuInitial` : c'est ce qui réaffiche le contenu d'avant. */}
      {!zoneAremplie && (
        <div>
          {titreManuel && (
            //  Même règle (nº 116) : le titre reste blanc.
            <p className="mb-2 text-[13.5px] font-semibold text-sombre-texte">
              {titreManuel}
              {zoneBremplie && <PastilleRetenu />}
            </p>
          )}
          <ChampLocalisation
            id={`${prefixe}-adresse`}
            etiquette={null}
            texteIndicatif={indicationManuel}
            lieuInitial={lieu}
            surChoix={retenirLeLieu}
            panneauDansLeFlux={surMobile}
            remonterAuToucher={surMobile}
            croixEffacement
            enErreur={enErreur}
          />
        </div>
      )}
    </div>
  );
}

/**
 * UNE SEULE ZONE — pour les lieux qui n'ont RIEN à chercher.
 * « À domicile » et « Studio privé » ne se cherchent pas sur
 * yokofolio : on ne devient pas résident de son propre salon, et un
 * studio privé n'a par définition pas de page publique. Leur proposer
 * une recherche de studio inscrit serait un cul-de-sac déguisé en
 * choix.
 * Ils gardent donc UN champ.
 *
 * ⚠️ DEUX LIGNES ONT DISPARU ICI (passe nº 100), et c'est voulu :
 *  · LE TITRE est devenu FACULTATIF. « Où te déplaces-tu ? » vit
 *    désormais DANS le champ, comme indication : un titre et un
 *    fantôme qui disent la même chose à deux centimètres l'un de
 *    l'autre, c'est une ligne de trop dans un formulaire déjà long.
 *  · LA PROMESSE DE VIE PRIVÉE (« Seuls la ville et le code postal
 *    seront publics — jamais la rue ni le numéro. ») a été retirée.
 *    ⚠️ SEULE LA PHRASE PART, PAS LA RÈGLE : elle vit dans
 *    `adressePubliable` (FormulaireFiche) et décide pour de bon ce
 *    que la fiche publie. Le texte ne la portait pas, il la
 *    racontait.
 */
export function ZoneLieuSeule({
  prefixe,
  titre = null,
  lieu,
  surLieu,
  surMobile,
  enErreur = false,
  indication = "Je tape mon adresse, ou ma ville",
  souscrit,
}: {
  prefixe: string;
  titre?: string | null;
  /** Ce qu'on lit dans le champ. */
  indication?: string;
  /** Ce qui se glisse SOUS le champ une fois le lieu choisi — le
      rayon de déplacement du mode « À domicile ». */
  souscrit?: React.ReactNode;
  lieu: LieuTrouve | null;
  surLieu: (lieu: LieuTrouve | null) => void;
  surMobile: boolean;
  enErreur?: boolean;
}) {
  return (
    <div>
      {titre && (
        //  Le titre ne rougit jamais (nº 116) — seul le champ le fait.
        <p className="mb-2 text-[13.5px] font-semibold text-sombre-texte">
          {titre}
        </p>
      )}
      <ChampLocalisation
        id={`${prefixe}-adresse`}
        etiquette={null}
        texteIndicatif={indication}
        lieuInitial={lieu}
        surChoix={surLieu}
        panneauDansLeFlux={surMobile}
        remonterAuToucher={surMobile}
        croixEffacement
        enErreur={enErreur}
      />
      {souscrit}
    </div>
  );
}
