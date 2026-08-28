"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
//  §2 (nº 488) — l'horloge de la ligne des horaires : le dessin
//  existait déjà, rien n'est ajouté au catalogue d'icônes.
import { IconeChevronBas, IconeHorloge } from "@/components/Icones";
//  §1 (nº 502) — l'écriture de la plaque, partagée : elle vivait ici
//  sans être exportée, elle vit désormais dans un module qui ne dépend
//  de rien (voir la note, plus bas, à la place qu'elle occupait).
import { ENCADRE_MEMBRE, ENCADRE_MEMBRE_CLIQUABLE } from "@/components/plaque";
//  §1 (nº 514) — « ce qui est surligné est ce qui est copié » :
//  une seule écriture, pour tous les liens qui portent du texte.
import { garderLeTexteALaCopie } from "@/lib/copie-du-texte";
//  §3 (nº 388) — l'icône de la ligne d'adresse, et l'écriture des
//  lignes de profil (module sans dépendance : voir lignes-profil).
import { IconeLocalisation } from "@/components/IconeReseau";
import {
  BOITE_ICONE_LIGNE,
  ECRITURE_LIGNE_FICHE,
  LIEN_QUI_SORT,
  //  §2 (nº 524) — le gris doux des lignes de profil : la mention
  //  au-dessus d'une plaque lit la MÊME constante que la ligne
  //  « Booking ouvert », au lieu d'en recopier la valeur.
  LIGNE_GRISE,
} from "@/components/lignes-profil";
//  §2 (nº 703) — L'ÉCRITURE UNIQUE, PRISE À LA FEUILLE. La viser dans
//  `ContenuFiche` refermait un CERCLE (la fiche monte ce bloc, ce bloc
//  réclamait la fiche) et, par le menu qui monte `PhotoRonde` d'ici,
//  faisait voyager le client de la base sur toutes les pages du site.
import { adresseDeLienInterne } from "@/lib/lien-interne";
import {
  laLargeurVeutUneFenetre,
  useOuvertureFiche,
} from "@/components/PileFiches";
//  §4 (nº 703) — `ICONE_ADRESSE` et `PORTRAIT_ROND` sont partis avec
//  le rond, dans `components/PhotoRonde` : ils n'étaient là que pour
//  lui.
import {
  etatOuverture,
  JOURS_STUDIO,
  libelleDuJour,
  momentChezLeStudio,
  semaineDepuisBase,
  semaineRenseignee,
} from "@/lib/horaires-studio";
import {
  equipeOrdonnee,
  libelleStylesEquipe,
  //  §6 (nº 492), EN DEUX MORCEAUX DEPUIS LA nº 493 — « RÉSIDENT •
  //  Booking ouvert · 12 mois d'attente » : l'écriture unique de la
  //  mention posée au-dessus d'un encadré, statut d'un côté (il se
  //  peint en capitales) et booking de l'autre.
  mentionDuLieu,
  mentionDuMembre,
  type MentionEnDeuxMorceaux,
  modesOrdonnes,
  SEPARATEUR_MENTION,
  //  §5 (nº 492) — `roleDuMembre` n'est plus lu ICI : le rôle a quitté
  //  la ligne du nom, et c'est `mentionDuMembre` qui l'appelle
  //  désormais, dans le module où il vit.
  lieuEnDeuxLignes,
  periodeDeSession,
  type MembreEquipe,
  type ModeExerciceFiche,
  type StudioFiche,
} from "@/lib/modes-exercice";
import { ligneFiche, ligneMaps, type LieuAffichable } from "@/lib/adresse";
import { ECRITURE_TITRE_SECTION, profilDeLaFiche } from "@/config/tatouage";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * OÙ TRAVAILLE CETTE FICHE — les adresses d'un lieu, les profils d'un
 * artiste
 * ==================================================================
 * (passe nº 222-§4 et §5)
 *
 * DEUX FORMES POUR UNE MÊME QUESTION, et c'est pour cela qu'elles
 * vivent dans le même fichier : « où est-ce, et qui y est ? ».
 *
 *  · UN SALON OU UN STUDIO a des ADRESSES, empilées de haut en bas
 *    (nº 226-§3) : celle de l'affiche d'abord — photo, ligne
 *    d'adresse, horaires —, puis chaque autre adresse sur sa ligne
 *    (« Autre adresse : » en lien Google Maps), puis l'équipe,
 *    TOUJOURS après toutes les adresses. Le sélecteur « Adresse /
 *    Autre adresse » de la nº 222 est SUPPRIMÉ, code compris : il
 *    cachait une adresse derrière une autre adresse.
 *  · UN ARTISTE a des PROFILS : à domicile, en studio, en salon,
 *    guest. Une entrée chacun, dans l'ordre imposé (nº 222-§1g).
 *
 * ⚠️ LES LIENS VERS D'AUTRES FICHES (un membre de l'équipe, le salon
 * d'un profil) OUVRENT UNE FENÊTRE SUPERPOSÉE (nº 226-§5) quand une
 * pile enveloppe la fiche (voir PileFiches) — web comme mobile ; le
 * lien reste un vrai lien pour tout le reste (nouvel onglet, moteurs).
 *
 * ⚠️ AUCUN ENCADRÉ, AUCUN CONTOUR. La charte de la fiche ne connaît
 * que trois niveaux de gris — la page, le bloc, le badge — et rien
 * n'est cerclé. Les horaires, qui vivaient dans un cadre arrondi, sont
 * désormais du TEXTE NU : un état en couleur, la suite en gris, un
 * chevron qui déroule les sept jours.
 *
 * ⚠️ ÉCRIT UNE SEULE FOIS. La page de fiche et la fenêtre superposée
 * montent toutes les deux `ContenuFiche`, qui monte ce fichier : il
 * n'existe aucun deuxième exemplaire de ces blocs.
 */

/* ==================================================================
 * LES BRIQUES PARTAGÉES
 * ================================================================== */

/**
 * §4 (nº 703) — LE ROND A DÉMÉNAGÉ dans `components/PhotoRonde`, avec
 * toutes ses explications. RIEN DE SON ÉCRITURE N'A CHANGÉ ; seul
 * l'endroit a changé, et la raison est de POIDS, au sens propre : le
 * menu du compte ne prenait ici QUE ce rond, mais emportait avec lui
 * ce fichier et tout ce qui pend derrière — jusqu'au client de la
 * base, sur chaque page du site. Le détail est écrit là-bas.
 * ⚠️ LA RÉEXPORTATION EST VOULUE, et elle doit rester : `BlocSuivis`
 * et les autres appelants continuent d'écrire
 * `from "@/components/BlocLieux"` sans rien savoir du déménagement.
 */
export { PhotoRonde } from "@/components/PhotoRonde";

/*  Réexporter ne fait pas entrer le nom dans CE fichier : les plaques
    d'équipe et les lignes d'adresse d'ici montent le rond, il leur
    faut donc l'import. */
import { PhotoRonde } from "@/components/PhotoRonde";

/**
 * LE CLIC D'UN LIEN VERS UNE AUTRE FICHE (nº 226-§5) : quand une pile
 * de fenêtres enveloppe (PileFiches), le clic simple ouvre la fiche
 * PAR-DESSUS celle qu'on lit, au lieu de changer de page. Toute autre
 * combinaison (nouvel onglet, clic du milieu…) garde le lien, et
 * l'adresse directe rend toujours la page complète. Sans pile
 * (l'aperçu « Ma fiche ») : `undefined`, le lien navigue.
 *
 * ⚠️ AU DOIGT, LE LIEN NAVIGUE (nº 230-§3). La fenêtre superposée est
 * la présentation du WEB ; sous 1024 px, une fiche liée s'affiche
 * comme n'importe quelle fiche de smartphone — une page. On ne
 * détourne donc pas le clic : `<Link>` fait son métier, pousse UNE
 * entrée d'historique, et le retour revient à la fiche précédente à
 * sa position. La règle de largeur vit dans PileFiches, en un seul
 * endroit ; elle est lue AU CLIC, jamais au rendu.
 */
function useClicVersFiche() {
  const ouvrirFiche = useOuvertureFiche();
  if (!ouvrirFiche) return undefined;
  return (slug: string) => (evenement: React.MouseEvent) => {
    if (
      evenement.metaKey ||
      evenement.ctrlKey ||
      evenement.shiftKey ||
      evenement.altKey
    ) {
      return;
    }
    /*  ÉCRAN ÉTROIT : on laisse passer — le lien navigue vers la page.
        §4 (nº 329) — LA CONSIGNE EST DANS L'ADRESSE DU LIEN, plus dans
        une mémoire de session : le `href` porte déjà `?entree=lien`
        (voir `adresseDeLienInterne`, plus bas), il n'y a donc RIEN à
        poser au clic. Un retour et un pas en avant la retrouvent
        d'eux-mêmes — c'est tout ce que la nº 295 n'arrivait pas à
        faire. */
    if (!laLargeurVeutUneFenetre()) return;
    evenement.preventDefault();
    ouvrirFiche(slug, `/tatoueur/${slug}`);
  };
}

/** « Adresse : » en gris, la valeur en blanc — la grammaire de tout ce
    bloc : une étiquette grise, une valeur blanche. */
function LigneEtiquetee({
  etiquette,
  valeur,
}: {
  etiquette: string;
  valeur: string;
}) {
  //  ⚠️ ELLE NE DISPARAÎT PLUS QUAND LA VALEUR MANQUE (nº 224-§1) :
  //  c'était le défaut — un lieu saisi à la main dont l'adresse ne
  //  rendait rien effaçait toute la ligne, pastille comprise, et
  //  l'information sautait sans laisser de trace. L'étiquette reste,
  //  et dit ce qui manque plutôt que de se taire.
  //  §4 (nº 286) — MÊME GRAMMAIRE QUE PARTOUT : l'étiquette grise en
  //  capitales, la valeur en blanc DESSOUS.
  return (
    <div className="[overflow-wrap:anywhere]">
      <p className={ECRITURE_TITRE_SECTION}>{etiquette}</p>
      <p className="mt-1.5 text-[15px] font-medium leading-snug text-sombre-texte">
        {valeur || "non renseignée"}
      </p>
    </div>
  );
}

/** LES DEUX DATES D'UNE SESSION GUEST — sur DEUX lignes, détachées du
    nom : c'est un engagement de plusieurs semaines, il se lit comme
    tel. Rien quand la session n'a pas ses deux bornes. */
function DatesDeSession({
  debut,
  fin,
  enBlanc = false,
}: {
  debut: string | null;
  fin: string | null;
  /** §4 (nº 286) — LES DATES D'UN GUEST SONT EN BLANC sur les lieux et
      dans l'équipe : c'est l'information qui décide le visiteur à
      prendre rendez-vous MAINTENANT, elle ne peut pas être un détail
      gris. Ailleurs (le reste du site), rien ne change. */
  enBlanc?: boolean;
}) {
  /*  ██ §3 (nº 413) — UNE SEULE LIGNE, ET LA RÈGLE VIT AILLEURS ██
       CE QU'IL Y AVAIT : deux paragraphes, « Du … » puis « Au … », et
       une garde qui exigeait LES DEUX dates — un guest sans date de
       fin n'affichait donc RIEN, silencieusement.
       CE QUE C'EST DEVENU : une ligne, composée par `periodeDeSession`
       (lib/modes-exercice), qui porte la règle de l'année, celle des
       mois abrégés et les quatre cas limites. CE COMPOSANT NE DÉCIDE
       PLUS RIEN — il pose, comme le reste du fichier.
       ⚠️ LA GARDE EST MAINTENANT LA CHAÎNE ELLE-MÊME : vide, on ne rend
       rien. C'est elle, et elle seule, qui protège d'une ligne vide ou
       d'un tiret orphelin — les deux fiches la partagent, puisqu'elles
       partagent ce composant.
       ⚠️ `mt-2.5` ET LA COULEUR NE BOUGENT PAS : le blanc des dates
       (nº 286-§4) reste ce qui décide le visiteur à prendre rendez-vous
       maintenant. Seul `leading-relaxed` part avec la seconde ligne
       qu'il espaçait — une ligne unique prend l'interligne du bloc. */
  const periode = periodeDeSession(debut, fin);
  if (!periode) return null;
  return (
    <p
      data-periode-guest=""
      /*  §3 (nº 504) — LA GRAISSE EST DITE EN TOUTES LETTRES.
          Le propriétaire relève les dates « en gras ». ELLES NE L'ONT
          JAMAIS ÉTÉ dans le code : ce paragraphe n'a jamais porté de
          classe de graisse, il hérite donc du 400 du corps de page.
          `font-normal` est posé ici pour VERROUILLER cette valeur —
          il ne change pas un pixel aujourd'hui, il empêche qu'une
          graisse tombe d'un parent demain.
          ⚠️ CE QUI DONNE L'IMPRESSION DE GRAS, ET C'EST AILLEURS : la
          COULEUR. Avec `enBlanc`, ces dates sont peintes du blanc de la
          charte (#F2F2F4) au milieu de voisines en gris doux — et sur
          un fond sombre, un texte blanc paraît toujours plus épais que
          son entourage. Le propriétaire a exclu de toucher à la
          couleur pour cette passe ; c'est donc le seul levier qui
          reste, et il est nommé ici pour la prochaine. */
      className={`mt-2.5 text-[14px] font-normal ${
        enBlanc ? "text-sombre-texte" : "text-sombre-texte-doux"
      }`}
    >
      {periode}
    </p>
  );
}

/**
 * LES HORAIRES, EN TEXTE NU (nº 222-§4).
 * « Fermé · ouvre lundi ⌵ » — l'état en couleur (rouge fermé, vert
 * ouvert), la suite en gris, le chevron déroule les sept jours.
 * ⚠️ SANS AUCUN ENCADRÉ : le cadre arrondi de la nº 122 est supprimé.
 * ⚠️ L'ÉTAT SE CALCULE DANS LE FUSEAU DU LIEU, jamais dans celui du
 * visiteur — la règle vit dans `etatOuverture`, et nulle part ailleurs.
 */
function HorairesEnLigne({
  horaires,
  fuseau,
}: {
  horaires: unknown;
  fuseau: string | null | undefined;
}) {
  const [ouvert, setOuvert] = useState(false);
  const semaine = semaineDepuisBase(horaires);
  if (!semaineRenseignee(semaine)) return null;

  //  ⚠️ L'HEURE N'EST PAS RELUE CHAQUE MINUTE ICI : ce bloc est rendu
  //  par le serveur puis repris tel quel. Un rafraîchissement change
  //  le texte entre les deux et l'hydratation le signale — d'où
  //  `suppressHydrationWarning`, comme dans HorairesStudio.
  const etat = etatOuverture(semaine, fuseau);
  const aujourdhui = momentChezLeStudio(fuseau).jour;
  //  « Ouvert • Ferme à 19h » → l'état d'un côté, la suite de l'autre.
  const [motEtat, ...reste] = etat.libelle.split(" • ");
  const suite = reste.join(" • ");

  return (
    /*  ██ §2 (nº 489) — LA MARGE DU HAUT S'EN VA : C'EST ELLE QUI
         DÉCALAIT L'HORLOGE ██
         ------------------------------------------------------------
         LA CAUSE, NOMMÉE. Ce volet s'ouvrait par six pixels de marge
         haute (§3 nº 389) : à l'époque il était ACCOLÉ sous l'adresse,
         dans la même boîte, et il fallait l'en décoller. Depuis la
         nº 488 il n'est plus accolé à rien — il est le CONTENU d'une
         ligne à part, avec sa propre icône. Ces six pixels poussaient
         donc son TEXTE vers le bas, tandis que l'icône, alignée en
         haut de la ligne comme toutes les autres (`items-start`),
         restait où elle était : elle paraissait plus haute d'exactement
         cette marge.
         ⚠️ CE N'ÉTAIT PAS LE VOLET DÉROULANT : l'hypothèse d'un centrage
         sur la hauteur totale ne tient pas — la ligne aligne EN HAUT,
         et la boîte de l'icône fait la hauteur d'UNE ligne de texte
         (`BOITE_ICONE_LIGNE`, hauteur en `em`, nº 389-§6). Volet ouvert
         ou fermé, rien ne bougeait de ce côté-là.
         LE REMÈDE, SANS AUCUN DÉCALAGE À LA MAIN : la marge disparaît.
         Le procédé des autres lignes s'applique alors tel quel — le
         texte du volet commence au même point que celui de l'adresse
         ou du site, et son bouton porte déjà la même écriture
         (`text-[15px] leading-snug`, celle d'`ECRITURE_LIGNE_FICHE`).
         L'air au-dessus, lui, est celui de la liste : les vingt pixels
         de son écart commun (nº 488).
         ⚠️ LE VOLET NE CHANGE EN RIEN D'AUTRE : mécanisme d'ouverture,
         flèche, contenu, couleurs, calcul d'état dans le fuseau du
         lieu — tout est intact. */
    <div>
      <button
        type="button"
        onClick={() => setOuvert((etait) => !etait)}
        aria-expanded={ouvert}
        /*  §4 (nº 389) — LA MAIN AU SURVOL. Tailwind v4 ne pose plus
             `cursor: pointer` sur les boutons — c'est une rupture
             annoncée de la version : la feuille de base rend au
             navigateur son curseur par défaut, et une flèche sur un
             élément cliquable ne dit rien à personne. On la déclare
             donc, ici, sur le bouton qui déplie les horaires. */
        className="flex cursor-pointer items-center gap-1.5 text-left text-[15px] leading-snug"
      >
        <span
          suppressHydrationWarning
          className={`font-semibold ${etat.ouvert ? "text-succes" : "text-erreur"}`}
        >
          {motEtat}
        </span>
        {suite && (
          <span suppressHydrationWarning className="text-sombre-texte-doux">
            {/*  « ouvre lundi », pas « Ouvre lundi » : la phrase
                 continue après l'état, elle ne recommence pas. */}
            · {suite.charAt(0).toLowerCase() + suite.slice(1)}
          </span>
        )}
        <span
          aria-hidden="true"
          className={`shrink-0 text-sombre-texte-doux transition-transform
                     duration-200 ${ouvert ? "rotate-180" : ""}`}
        >
          <IconeChevronBas taille={16} />
        </span>
      </button>

      {ouvert && (
        <dl className="mt-3 grid grid-cols-[minmax(84px,auto)_1fr] gap-x-6 gap-y-2">
          {JOURS_STUDIO.map((jour) => {
            const cest = jour.index === aujourdhui;
            const robe = cest
              ? "font-semibold text-sombre-texte"
              : "font-normal text-sombre-texte-doux";
            return (
              <div key={jour.index} className="contents">
                <dt suppressHydrationWarning className={`text-[14px] ${robe}`}>
                  {jour.label}
                </dt>
                <dd suppressHydrationWarning className={`text-[14px] ${robe}`}>
                  {libelleDuJour(semaine[jour.index] ?? [])}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}

/**
 * L'ÉQUIPE D'UNE ADRESSE — « Fondateur · Kevin Roux ».
 * Le rôle en gris, le nom en blanc ; l'ordre est imposé (fondateurs,
 * résidents, guests) et vit dans `equipeOrdonnee`. Un guest porte ses
 * deux dates, sur deux lignes.
 * ⚠️ ALIGNÉE SOUS LA PHOTO DU LIEU : elle commence au bord gauche du
 * bloc, pas dans la colonne de texte de l'adresse.
 *
 * ⚠️ TOUTE LA LIGNE EST LE LIEN (nº 226-§4) : pastille, rôle et nom
 * vivent dans UN SEUL élément cliquable — la pastille a le lien pour
 * ancêtre, il n'y a qu'une zone d'appui. Aucun contour, aucun halo.
 * Un membre sans fiche (pas de slug) reste une ligne inerte.
 *
 * §1 (nº 229) — LA PASTILLE EST ANCRÉE EN HAUT, LE TEXTE NE LA
 * DÉPASSE JAMAIS. Le `items-center` de la nº 227 centrait la PASTILLE
 * sur son texte : un texte de plusieurs lignes débordait AU-DESSUS
 * d'elle, et un volet qui s'ouvre la faisait DESCENDRE. La règle est
 * désormais celle de la photo de profil (nº 225-§2), en CSS pur : la
 * ligne est calée en haut (`items-start` — la pastille ne bouge
 * JAMAIS), et c'est la COLONNE DE TEXTE qui porte la bascule —
 * `min-h-13` (la hauteur de la pastille) et `justify-center`. Un
 * texte moins haut est centré sur elle ; un texte plus haut aligne
 * son sommet sur le haut de la pastille et continue dessous.
 *
 * §2 (nº 229) — 32 px entre deux lignes à pastille (`gap-8`), 32 px
 * au-dessus de la première comme sous la dernière, 14 px entre la
 * pastille et son texte (`gap-3.5`, inchangé depuis la nº 227).
 *
 * §5 (nº 227) — LE SURVOL, le même pour toutes les lignes cliquables :
 * la couleur du texte ne change JAMAIS (le rose est réservé), le fond
 * de la ligne monte d'un cran (un voile blanc léger — la même ligne
 * vit sur l'anthracite de la page ET sur la carte de la fenêtre, un
 * jeton fixe ne serait « un cran au-dessus » que d'un seul des deux),
 * et le texte prend un fin soulignement décalé. Le rembourrage est
 * annulé par des marges négatives : la surface respire sans déplacer
 * le texte d'un pixel. Au doigt, pas de survol : un bref état enfoncé
 * (`active:`), qui ne reste jamais.
 */
/**
 * L'ENCADRÉ D'UNE LIGNE CLIQUABLE À PASTILLE — UNE SEULE ÉCRITURE
 * (nº 232-§1). Ses porteurs, depuis la nº 276-§2 : les lignes qui
 * mènent à une FICHE DU SITE — un membre d'équipe, le salon lié d'un
 * profil d'artiste — et elles seules. TOUT l'encadré est alors le
 * lien, pastille comprise. La ligne d'ADRESSE ne le porte PLUS : sa
 * destination sort du site (Google Maps), et « dehors on souligne » —
 * seule l'adresse s'y clique (voir AdresseCliquable). C'est cette
 * constante qui garantit l'écriture unique — pas de second dessin.
 */
/**
 * ⚠️ §2 (nº 496) — CETTE CONSTANTE N'A PLUS AUCUN PORTEUR. Ses deux
 * derniers étaient le membre d'équipe (passé à la plaque permanente à
 * la nº 492) et le lieu d'un profil d'artiste (passé à la même plaque
 * à la nº 496). Elle reste écrite parce qu'elle DIT une règle — « une
 * fiche du site, on encadre ; dehors, on souligne » — et que quatre
 * notes du site y renvoient ; elle n'est PAS un modèle à reprendre
 * pour un bloc neuf. Le modèle, c'est `ENCADRE_MEMBRE`.
 * ⚠️ SON DÉBORD DE 8 px N'EXISTE DONC PLUS SUR LA FICHE. Le dégagement
 * que la colonne de lecture porte pour lui (`FicheTatoueur`, nº 298 et
 * 312) n'est PAS retiré ici : c'est un conteneur partagé, hors de
 * cette passe (piège 378/379). Il ne coûte rien — il écarte un bord
 * qui rogne, il ne déplace aucun contenu.
 */
export const CLASSES_LIGNE_CLIQUABLE =
  "group flex items-start gap-3.5 rounded-xl -m-2 p-2 " +
  "transition-colors hover:bg-white/5 active:bg-white/10";

/**
 * §3 (nº 301) — LA MÊME LIGNE, SANS SON ENCADRÉ DE SURVOL.
 * ==================================================================
 * ⚠️ UN SEUL PORTEUR, ET C'EST VOULU : la ligne d'identité de « Ma
 * sélection » (BlocSuivis). Le propriétaire n'y veut plus de fond au
 * survol — l'ensemble reste cliquable et mène à la fiche, c'est
 * seulement la plaque qui disparaît. PARTOUT AILLEURS l'encadré reste,
 * et la correction de ses arrondis (nº 298, `lg:px-3` / `lg:-mx-3` sur
 * la colonne de lecture d'une fiche) n'est pas touchée.
 *
 * ⚠️ MÊME GÉOMÉTRIE, AU PIXEL : `-m-2 p-2` s'annulent, les retirer ne
 * déplace donc RIEN — ni le rond, ni le nom, ni les lignes. Seuls le
 * rayon, la transition et les deux fonds partent, puisqu'ils n'ont plus
 * rien à dessiner. `group` reste : il sert aux enfants qui réagissent
 * au survol de la ligne.
 *
 * ██ §2 (nº 586) — LE ROND SE CENTRE SUR LE TEXTE, IL NE SE CALE PLUS
 * EN HAUT ██
 * L'alignement était `items-start`, hérité de la ligne encadrée
 * ci-dessus. Il ne se voyait pas : le bloc de texte porte une hauteur
 * minimale égale à celle du rond (52 px au doigt, 72 au web) et centre
 * son contenu dedans — à une ou deux lignes, les deux hauteurs sont
 * donc identiques et le haut vaut le centre. IL SE VOIT DÈS QUE LE
 * TEXTE DÉPASSE : la nº 586 autorise la ligne de situation à passer
 * sur deux lignes, le bloc devient alors plus haut que le rond, et
 * caler en haut laisserait le rond décroché.
 * ⚠️ CETTE CONSTANTE N'A QU'UN PORTEUR (voir juste au-dessus) : le
 * changement ne touche que la ligne d'identité de « Ma sélection ».
 * `CLASSES_LIGNE_CLIQUABLE`, elle, garde son `items-start`.
 * ⚠️ UNE SEULE CLASSE D'ALIGNEMENT, REMPLACÉE — jamais deux posées
 * l'une sur l'autre : entre `items-start` et `items-center`, ce n'est
 * pas l'ordre de l'attribut qui déciderait, mais celui de la feuille.
 */
export const CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE =
  "group flex items-center gap-3.5";

/**
 * LE SOULIGNEMENT D'UN LIEN DE FICHE — UNE SEULE ÉCRITURE (nº 271-§2)
 * ====================================================================
 * C'est celui de la ligne d'équipe (nº 229), et lui seul : FIN
 * (`decoration-1`), DÉCALÉ (`underline-offset-4`), GRIS DOUX, et il
 * n'apparaît qu'AU SURVOL de la ligne (`group-hover` — l'élément
 * survolable porte la classe `group`). Au repos : du texte nu. Au
 * doigt, pas de survol : l'état enfoncé (`active:`) parle à sa place.
 *
 * ⚠️ LA COULEUR EST ÉCRITE, ET VOICI POURQUOI. La nº 229 tenait son
 * gris du `<p>` gris doux qui déclarait le soulignement — sans un mot.
 * La nº 268 a recopié les mêmes jetons sur des éléments à TEXTE CLAIR
 * (le lien d'artiste, l'adresse) : même `decoration-1`, mais un trait
 * PRESQUE BLANC — c'est lui que le relevé lisait « plus épais ». La
 * couleur (`decoration-sombre-texte-doux`) fait donc partie de
 * l'écriture : le trait est LE MÊME, où que le texte soit clair ou
 * doux.
 *
 * ⚠️ UN SEUL LECTEUR, UN SEUL USAGE (nº 273-§2) : le soulignement ne
 * sert plus qu'à CE QUI SORT DU SITE — et il n'y a qu'un cas,
 * l'ADRESSE (AdresseCliquable : Google Maps sur le web, la fenêtre
 * de verre au doigt — le cas de l'artiste qui a saisi l'adresse de
 * son lieu à la main, faute de portfolio à lier). Les lignes qui
 * mènent à une fiche DU SITE (équipe, profil d'artiste, liens sous
 * la photo) ont perdu le leur : leur fond qui monte au survol dit
 * déjà le clic, le trait faisait double emploi. Si un second endroit
 * doit un jour sortir du site, il importe CETTE constante — jamais
 * une recopie des jetons, et jamais pour un lien interne.
 */
export const SOULIGNEMENT_LIEN =
  "underline-offset-4 decoration-1 decoration-sombre-texte-doux " +
  "group-hover:underline";

/*  ██ §1 (nº 502) — L'ÉCRITURE DE LA PLAQUE A DÉMÉNAGÉ ██
    Elle vivait ici, sans être exportée : deux constantes que seuls
    les deux blocs de ce fichier lisaient. La nº 502 en a eu besoin
    depuis `FicheTatoueur` (la rangée du profil de la vue photo au
    doigt), qui n'a rien à faire avec le bloc des lieux — et recopier
    un dessin, c'est le condamner à diverger à la passe suivante.
    ELLES SONT DONC DANS `components/plaque`, un fichier qui ne dépend
    de rien, avec TOUTE leur documentation : la règle de l'air égal sur
    les quatre côtés (nº 497), le choix contraint du fond (nº 491-§1),
    et l'avertissement sur le rond de repli (nº 492). Aucune valeur n'a
    changé au passage.
    ⚠️ LES DEUX BLOCS DE CE FICHIER LES LISENT MAINTENANT DE LÀ-BAS :
    l'équipe d'un salon et les lieux d'un artiste, exactement comme
    avant. */

/**
 * ██ §6 (nº 492), §2 (nº 493), §3 (nº 496) — LA MENTION AU-DESSUS ██
 * ==================================================================
 * Le STATUT, puis son complément, en gris, posés en haut à gauche À
 * L'EXTÉRIEUR de la plaque. Sur un salon, le complément est l'état du
 * CARNET du membre ; sur une fiche d'artiste, c'est le TYPE DE LIEU.
 * Le dessin, lui, est le MÊME — et c'est pour ça qu'il est écrit une
 * seule fois, ici : même gris, même taille, même séparateur, même air
 * sous le texte. Les deux emplois ne peuvent pas diverger.
 *
 * ⚠️ ELLE N'EST PAS DANS LE LIEN, et c'est voulu : le lien, c'est la
 * plaque. Une mention au-dessus ne se clique pas.
 * ⚠️ QUATORZE PIXELS — un cran sous les 15 px du nom, et exactement la
 * taille que le rôle portait déjà quand il vivait dans la plaque :
 * rien de neuf n'est inventé. Quatre pixels la séparent de la plaque.
 *
 * ██ LE STATUT EN MAJUSCULES, ET LUI SEUL (nº 493) ██
 * `uppercase` est une TRANSFORMATION D'AFFICHAGE : le texte reste
 * « Résident » dans le code et dans le document, et c'est le
 * navigateur qui le peint en capitales. Deux conséquences voulues :
 * les ACCENTS SONT CONSERVÉS (« RÉSIDENT », jamais « RESIDENT » — la
 * règle CSS suit l'Unicode, contrairement à une écriture en dur), et
 * une traduction anglaise passera en capitales toute seule.
 * Le complément, lui, garde sa casse : la classe est posée sur le SEUL
 * morceau du statut, pas sur le paragraphe.
 * ⚠️ JAMAIS DE PUCE ORPHELINE : le séparateur n'est posé que si le
 * complément existe, et le statut manquant ne rend rien du tout.
 */
function MentionAuDessus({ mention }: { mention: MentionEnDeuxMorceaux }) {
  if (!mention.statut && !mention.complement) return null;
  return (
    /*  ██ §2 (nº 524) — LA MENTION S'ALIGNE SUR LA LIGNE « BOOKING
        OUVERT », ET LE GRAS DE LA nº 523 EST ANNULÉ ██
        ----------------------------------------------------------
        LA LIGNE DE RÉFÉRENCE, RELEVÉE (ContenuFiche, l'étiquette
        d'état du booking) : `ECRITURE_LIGNE_FICHE` — 15 px,
        `leading-snug` — et `LIGNE_GRISE`, le gris doux. AUCUNE classe
        de graisse : elle hérite donc de la normale.
        CE QUI CHANGE ICI : le gras part (il datait de la nº 523), et
        la TAILLE MONTE DE 14 À 15 PX — c'était le seul écart qui
        restait, et le propriétaire demandait la même. La couleur, elle,
        était déjà la bonne.
        ⚠️ ON NE RECOPIE PAS LES VALEURS, ON LIT LES MÊMES CONSTANTES :
        deux écritures qui doivent dire la même chose finissent
        toujours par diverger.

        ██ §1 (nº 552) — ET LES DEUX SE SÉPARENT SUR LA COULEUR ██
        ----------------------------------------------------------
        LA LIGNE DU BOOKING EST PASSÉE EN BLANC (`texte`, ContenuFiche).
        CETTE MENTION-CI RESTE GRISE, et ce n'est pas un oubli : le
        blanc a été posé sur la COLONNE DE TEXTE de la ligne du
        booking, pas sur `LIGNE_GRISE` — donc rien n'a été emporté, et
        la question « faut-il suivre ? » se pose à part.
        LA RÉPONSE EST NON, POUR CE QU'ELLE EST : une LÉGENDE posée
        au-dessus d'une plaque, jamais l'objet qu'on regarde. Le nom
        DANS la plaque est le blanc de ce bloc ; une légende aussi
        claire que lui les mettrait au même rang, et il y en a une par
        plaque — une colonne de membres d'équipe deviendrait une
        colonne de blanc. Sa lisibilité ne se discute pas :
        `texteDoux` sur le fond des sections vaut 8,14.
        ⚠️ CE QUE LA nº 524 A ALIGNÉ RESTE ALIGNÉ, et c'était son
        sujet : la TAILLE (15 px) et la GRAISSE (normale). La couleur,
        elle, était déjà celle-ci avant la nº 524 — elle n'a jamais
        été empruntée à la ligne du booking.
        ⚠️ DONC `ECRITURE_LIGNE_FICHE` RESTE LU DES DEUX CÔTÉS (taille
        et interligne, la vraie garantie de la nº 524), et `LIGNE_GRISE`
        aussi — mais il ne faut plus lire cette dernière comme un lien
        avec le booking : elle ne dit plus que « cette ligne-ci reste
        dans le site », et trois autres porteurs la partagent.
        ⚠️ CE QUI NE BOUGE PAS : les majuscules du statut (nº 493), le
        séparateur, la place au-dessus de la plaque, et l'air en
        dessous (`mb-1`).
        ⚠️ ET ÇA VAUT PARTOUT D'UN COUP : cette écriture est la seule du
        site depuis la nº 496 — membres d'équipe et guests d'un salon ou
        d'un studio, lieux d'une fiche d'artiste. */
    <p className={`mb-1 ${ECRITURE_LIGNE_FICHE} ${LIGNE_GRISE} [overflow-wrap:anywhere]`}>
      {mention.statut && <span className="uppercase">{mention.statut}</span>}
      {mention.complement && (
        <>
          {mention.statut && SEPARATEUR_MENTION}
          {mention.complement}
        </>
      )}
    </p>
  );
}

function EquipeDuLieu({ equipe }: { equipe: MembreEquipe[] | null | undefined }) {
  const clicVersFiche = useClicVersFiche();
  /*  ██ §2 (nº 411) — UNE SEULE LISTE, DE NOUVEAU ██
       La nº 409 avait sorti les guests d'ici pour leur donner une
       section, et la nº 410 l'avait séparée par un trait. Le
       propriétaire abandonne les deux : membres et guests reviennent
       dans la MÊME liste continue, présentés de la même façon, sans
       trait ni titre ni section.
       ⚠️ L'ORDRE N'EST PLUS CELUI DE LA nº 411 (§3, nº 493) : les
       fondateurs reprennent la tête, puis les résidents, puis les
       guests par date — trois rangs, et non plus deux. La règle vit
       entièrement dans `equipeOrdonnee`. Et un
       artiste À LA FOIS membre ET guest apparaît toujours DEUX fois,
       l'acquis de la nº 410 : ce sont deux LIGNES de la vue, chacune
       avec sa clé, et rien ici ne les rapproche.
       ⚠️ LES GUESTS GARDENT LEURS DATES : elles se rendent plus bas,
       sous la condition `membre.genre === "guest"` qui n'a jamais
       quitté cette liste. Les membres n'en ont pas. */
  const membres = equipeOrdonnee(equipe);
  if (membres.length === 0) return null;
  //  §1 (nº 288) — PAS DE TITRE « ÉQUIPE ». Celui de la nº 286 venait
  //  d'une proposition, jamais d'une demande : il est retiré. Les
  //  lignes, elles, ne bougent pas d'un pixel — rond, nom en blanc,
  //  rôle en gris dessous, ligne entière cliquable, ordre fondateurs ·
  //  résidents · guests, dates de guest en blanc.
  return (
    <ul
      /**
       * ██ §7 (nº 389) — PLUS DE DOUBLE AIR EN TÊTE DE SECTION ██
       * ==================================================================
       * MESURÉ, ET C'EST UNE VRAIE INÉGALITÉ ÉCRITE — pas un effet
       * d'optique comme celle de la nº 385 : la section porte
       * `mt-10 pt-10` (40 px au-dessus du trait, 40 en dessous), et ce
       * bloc ajoutait SES 32 px par-dessus. Au-dessus de la photo :
       * 40 + 32 = 72 px. En dessous du bloc, jusqu'au trait suivant :
       * 40 px. Soixante-douze contre quarante.
       * D'OÙ ÇA VIENT : ces 32 px séparaient l'équipe de l'ADRESSE qui
       * la précédait dans le même bloc. La nº 388 a fait descendre
       * l'adresse dans les lignes du profil ; l'équipe s'est retrouvée
       * EN TÊTE, et sa marge n'avait plus rien à séparer.
       * LE REMÈDE : `first:mt-0`. En tête de section, le bloc n'ajoute
       * rien et l'air vaut les 40 px du conteneur, des deux côtés.
       * Derrière une autre adresse, les 32 px reviennent d'eux-mêmes —
       * ils n'ont jamais été de trop là.
       * ⚠️ AUCUN CONTENEUR N'EST TOUCHÉ : la correction est sur
       * l'élément qui portait la marge, comme le propriétaire l'a
       * demandé depuis la nº 380.
       */
      className="mt-8 first:mt-0 flex flex-col gap-8"
    >
      {membres.map((membre) => {
        //  §2 (nº 493) — les deux morceaux de la mention du dessus :
        //  le statut, qui se peint en capitales, et le booking, qui
        //  garde sa casse. Lus UNE fois pour la ligne.
        const mention = mentionDuMembre(membre);
        /*  ⚠️ LA PASTILLE EST LÀ MÊME SANS PHOTO (nº 224-§1) : un
            rond gris uni, rien dedans. C'est elle qui tient la
            colonne — sans elle, une équipe où un seul membre a
            déposé sa photo s'affichait en escalier. */
        //  §2 (nº 273) — la ligne s'écrit PAREIL avec ou sans fiche :
        //  le soulignement qui les distinguait est parti.
        //  §2 (nº 492) — et l'encadré ne dit plus le clic non plus : il
        //  est permanent. Ce qui distingue une ligne cliquable, c'est
        //  son survol et son appui, rien d'autre.
        const ligne = () => (
          <>
            {/*  §2 (nº 492) — DEUX CRANS AU-DESSUS DE LA PLAQUE, et pas
                 un : au repos elle vaut `bg-sombre-eleve`, au survol elle
                 monte à `bg-sombre-eleve-clair`. Un rond posé sur ce
                 deuxième cran disparaîtrait au passage de la souris. Le
                 cran d'encore au-dessus le garde lisible dans les deux
                 états — et il ne concerne QUE le repli sans photo : une
                 vraie photo couvre le rond entièrement. */}
            <PhotoRonde
              source={membre.photo}
              nature="personne"
              //  §1 (nº 524) — le rond revient à sa valeur d'avant la
              //  nº 523, avec sa plaque : trois crans au-dessus d'elle,
              //  pour que l'icône d'un lieu sans fiche reste lisible.
              classeFond="bg-sombre-haut"
            />
            <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
              {/*  §4 (nº 286) — LE NOM D'ABORD, EN BLANC ; LE RÔLE
                   DESSOUS, EN GRIS. La forme « Résident · Kevin Roux »
                   faisait lire le rôle avant la personne, et sur une
                   même ligne : c'est le nom qu'on cherche dans une
                   équipe. Même grammaire que les lieux au-dessus —
                   valeur blanche, détail gris.
                   §2 (nº 273) — PLUS DE SOULIGNEMENT : l'encadré au
                   survol (CLASSES_LIGNE_CLIQUABLE) dit déjà qu'elle se
                   clique. Le soulignement reste réservé à ce qui SORT
                   du site (l'adresse). */}
              {/*  ██ §2 (nº 392) — LE RÔLE REMONTE SUR LA LIGNE DU NOM ██
                   ==============================================================
                   TROIS LIGNES DEVENAIENT DEUX : « Funambulink Ttt »,
                   « Fondateur » et « Trash Polka » s'empilaient ; le nom et
                   le rôle partagent désormais la première, le style garde la
                   seconde.
                   CE QUI NE CHANGE PAS D'UN POIL : le NOM. Même balise, même
                   `text-[15px] font-medium leading-snug text-sombre-texte`,
                   même `[overflow-wrap:anywhere]`. Le rôle n'est plus un
                   paragraphe à lui, c'est un morceau de celui-ci.
                   LES GRIS SONT CEUX QUI EXISTENT DÉJÀ, aucun n'est inventé :
                   la puce et le rôle prennent `text-sombre-texte-doux` — le
                   gris que le rôle portait DÉJÀ sur sa propre ligne, et celui
                   de la ligne des styles juste en dessous.
                   `font-normal` SUR LE RÔLE : le paragraphe du nom porte
                   `font-medium`, et le rôle, lui, n'a jamais été en demi-gras.
                   On lui rend donc sa graisse d'avant, explicitement.
                   PLUS DE `leading-relaxed` SUR LE RÔLE : cet interligne
                   dimensionnait SA ligne, celle qu'il n'a plus. Il vit
                   maintenant dans la ligne du nom, dont l'interligne
                   (`leading-snug`) commande — sans quoi il l'aurait fait
                   grandir de deux pixels pour rien.
                   LA PUCE EST CELLE DE TOUTE LA FICHE : même caractère, même
                   `px-1.5`, même `aria-hidden` que les pratiques et les
                   styles — pas un second séparateur.
                   ⚠️ ET SON `<wbr />`, LEÇON DE LA Nº 391 : sans caractère
                   d'espace autour d'elle, et « • » étant de classe de coupure
                   alphabétique, « Ttt•Fondateur » serait un seul mot pour le
                   navigateur. L'occasion de coupure de largeur nulle lui rend
                   le droit de replier proprement entre le nom et le rôle
                   quand la colonne est étroite. Elle ne dessine rien et
                   n'ajoute aucun pixel.
                   ██ §5 (nº 492) — CETTE NOTE DÉCRIT UN ÉTAT PÉRIMÉ ██
                   Le rôle a QUITTÉ la ligne du nom : il est remonté au-dessus
                   de l'encadré, dans la mention grise, avec le booking (§6).
                   La première ligne ne porte donc plus QUE LE NOM — la puce,
                   son `<wbr />` et le morceau gris sont partis avec lui. Ce
                   qui reste ci-dessus vaut comme histoire, pas comme
                   description : c'est la ligne juste dessous qui fait foi.
                   ⚠️ LE NOM, LUI, N'A PAS BOUGÉ D'UN POIL : même balise,
                   mêmes classes, même `[overflow-wrap:anywhere]`.
                   ██ §1 ET §2 (nº 555) — CETTE DERNIÈRE PHRASE TOMBE ██
                   LE NOM BOUGE, sur DEUX points, et c'est le relevé de la
                   nº 554 qui les a nommés :
                    · LA GRAISSE — il était `font-medium` quand le nom
                      d'un LIEU, sur une plaque rigoureusement identique
                      (même `ENCADRE_MEMBRE`, même colonne, même 15 px,
                      même blanc), était `font-semibold`. Deux dessins
                      pour un même objet, sans qu'aucune note ne
                      l'explique : c'est le défaut de la nº 498 qui se
                      rejouait. Le membre rejoint le lieu — et rejoint du
                      même coup la carte de la mosaïque (nº 481) et la
                      ligne de « Ma sélection », toutes deux en
                      `font-semibold` depuis longtemps. Il n'y avait pas
                      de troisième graisse à aligner : les cinq plaques
                      du site n'en portaient que deux.
                    · LA TAILLE — 15 → 16 px. La fiche n'avait que DEUX
                      rangs : le nom en 19-20 px, et TOUT le reste en
                      15 px. Le nom d'une plaque est le seul texte de ce
                      second rang qu'on cherche des yeux ; il prend donc
                      le cran qui manquait entre les deux.
                   ⚠️ LA HAUTEUR NE BOUGE PAS D'UN PIXEL, et c'est
                   mesurable : la ligne passe de 20,625 px (15 × 1,375) à
                   22 px (16 × 1,375). Le bloc de texte d'un membre à deux
                   lignes passe donc de 43,25 à 44,625 px — toujours SOUS
                   le plancher de 52 px (`min-h-13`) qui commande la
                   hauteur et l'alignement sur la photo. C'est le
                   plancher qui décide, hier comme aujourd'hui.
                   ⚠️ ET LES NOMS LONGS SE COUPENT COMME AVANT :
                   `[overflow-wrap:anywhere]` est intact — le nom se
                   replie, il n'est jamais tranché ni abrégé. Un pli de
                   plus reste sous le plancher (22 × 2 + 2 + 20,625 =
                   66,6 px, la plaque grandit alors comme elle le faisait
                   déjà à 15 px). */}
              <p className="text-[16px] font-semibold leading-snug text-sombre-texte [overflow-wrap:anywhere]">
                {membre.nom}
              </p>
              {/*  §3 (nº 313) — SES STYLES, SOUS SON RÔLE — et depuis la
                   nº 392, sous la ligne QUI PORTE son nom ET son rôle :
                   c'est donc la DEUXIÈME et dernière ligne du bloc.
                   ⚠️ RIEN N'Y CHANGE : même taille (13 px), même gris,
                   même `mt-0.5`. Le propriétaire l'a demandé tel quel.
                   ------------------------------------------------------
                   Ils viennent de SA déclaration, sur sa propre fiche —
                   jamais d'une recopie dans le salon (voir
                   `garnirFiches`). Trois au plus, puis le reste compté
                   (« +2 ») : la règle vit dans `libelleStylesEquipe`,
                   en fonction pure.
                   ⚠️ AUCUNE CAPSULE, AUCUN CONTOUR : du texte gris, un
                   cran plus petit que le rôle. Les capsules de style
                   restent réservées à la section STYLES d'une fiche —
                   ici, ce serait une deuxième grammaire pour la même
                   information.
                   ⚠️ RIEN NE SE REND QUAND IL N'Y A RIEN : pas une
                   ligne vide, pas un espace. Un membre sans style
                   déclaré garde exactement la ligne d'avant cette
                   passe. */}
              {libelleStylesEquipe(membre.styles) && (
                <p
                  data-styles-membre=""
                  /*  ██ §2 (nº 413) — LA LIGNE DES STYLES PASSE À 15 px ██
                       Elle était à 13 px (nº 313) sous une ligne de
                       15 px : deux corps différents pour deux lignes du
                       même bloc, et le propriétaire veut la même
                       taille. C'est la ligne du dessus qui donne la
                       valeur — aucune n'est inventée.
                       ⚠️ `leading-relaxed` PART AVEC : cet interligne
                       (1,625) était calibré pour du 13 px. Gardé à
                       15 px il aurait ajouté 3 px de hauteur à lui
                       seul ; on prend `leading-snug` (1,375), celui de
                       la ligne du dessus — les deux lignes du bloc ont
                       ainsi le même corps ET le même interligne.
                       ⚠️ CE QUE ÇA COÛTE EN HAUTEUR, ET POURQUOI RIEN NE
                       BOUGE : la ligne passe de 21,1 px (13 × 1,625) à
                       20,6 px (15 × 1,375) — elle MAIGRIT d'un demi-
                       pixel. Le bloc de texte d'un membre à deux lignes
                       fait donc ~43 px, toujours sous le plancher de
                       52 px (`min-h-13`, nº 229 et 410) qui commande la
                       hauteur et l'alignement sur la photo de profil
                       recentrée à la nº 389. Rien ne se décale.
                       ⚠️ CE TOTAL A CHANGÉ À LA nº 555, la conclusion
                       NON : le nom au-dessus est passé à 16 px, donc le
                       bloc à deux lignes fait 44,6 px et non plus 43,25.
                       Toujours sous les 52 px du plancher — c'est lui
                       qui commande, et cette ligne-ci n'a pas bougé
                       d'un caractère. */
                  className="mt-0.5 text-[15px] leading-snug text-sombre-texte-doux"
                >
                  {libelleStylesEquipe(membre.styles)}
                </p>
              )}
              {membre.genre === "guest" && (
                <DatesDeSession
                  debut={membre.debut_le}
                  fin={membre.fin_le}
                  enBlanc
                />
              )}
            </div>
          </>
        );
        return (
          <li key={membre.cle ?? membre.artiste_id}>
            <MentionAuDessus mention={mention} />
            {/**
              * ██ §1 (nº 513) — LE NOM D'UN MEMBRE REDEVIENT
              * SÉLECTIONNABLE, ET RIEN D'AUTRE NE CHANGE ██
              * --------------------------------------------------------
              * LE DÉFAUT (relevé nº 511) : au web, impossible de
              * surligner le nom d'un membre pour le copier. Ce n'était
              * PAS `select-none` — il n'y en a aucun ici. C'est que le
              * texte vit DANS un lien : glisser sur le texte d'un lien
              * ne surligne pas, ça démarre le GLISSER-DÉPOSER du lien
              * (le navigateur croit qu'on veut l'emporter ailleurs).
              * LE REMÈDE, EN UN MOT : l'attribut `draggable` posé à
              * faux — il est sur le lien, juste en dessous. Le
              * navigateur cesse de proposer le glisser-déposer, et le
              * glissement redevient ce qu'il est partout ailleurs :
              * une sélection. C'est le procédé que le LOGO porte
              * depuis toujours (EnTeteTatouage), pour la même raison.
              * ⚠️ CE QUE ÇA NE TOUCHE PAS, et c'est tout l'intérêt :
              * la plaque reste ENTIÈREMENT cliquable (le lien ne change
              * ni de taille ni de contenu), son fond s'éclaircit
              * toujours au survol (nº 492 — c'est du CSS, et cet
              * attribut n'est pas du CSS), le clic du milieu ouvre
              * toujours un onglet, le focus au clavier ne bouge pas, et
              * le doigt ne voit aucune différence : on ne glisse pas un
              * lien au doigt, il n'y a rien à désactiver là-bas.
              * ⚠️ UN CLIC SIMPLE NAVIGUE TOUJOURS : pour copier, il
              * faut un vrai glissement. C'est le comportement normal
              * de n'importe quel lien de texte, pas un réglage.
              * ⚠️ ET CETTE NOTE VIT AU-DESSUS DU TERNAIRE, PAS DEDANS :
              * entre les parenthèses d'une branche, JSX n'accepte
              * qu'UNE expression — une note s'y compte comme une
              * seconde, et le fichier ne compile plus.
              */}
            {membre.slug ? (
              <Link
                href={adresseDeLienInterne(membre.slug)}
                onClick={clicVersFiche?.(membre.slug)}
                draggable={false}
                //  §1 (nº 514) — SURLIGNER NE SUFFISAIT PAS : copiée,
                //  une sélection entièrement contenue dans un lien
                //  rendait l'ADRESSE du lien, pas le texte (le
                //  comportement de WebKit). On pose donc nous-mêmes ce
                //  qui est vu. La raison complète vit dans
                //  lib/copie-du-texte.
                onCopy={garderLeTexteALaCopie}
                className={ENCADRE_MEMBRE_CLIQUABLE}
              >
                {ligne()}
                {/*  ██ §4 (nº 493) — LE CHEVRON DIT QUE ÇA S'OUVRE ██
                     Rien ne le disait : au doigt il n'y a pas de survol,
                     et une plaque permanente (nº 492) ne signale plus le
                     clic à elle seule. La FORME s'en charge — pas la
                     couleur : il prend le gris des textes secondaires,
                     jamais le bleu des liens qui sortent ni le rose.
                     C'EST L'ICÔNE DES HORAIRES, pivotée d'un quart de
                     tour vers la gauche pour pointer à droite — le même
                     procédé que son `rotate-180` à l'ouverture d'un
                     volet. Aucun dessin nouveau.
                     ⚠️ IL EST DANS LE LIEN, ET SEULEMENT LÀ : un membre
                     sans fiche n'a pas de chevron (voir la branche
                     juste dessous) — on ne promet pas une page qui
                     n'existe pas.
                     ⚠️ CENTRÉ SUR TOUTE LA PLAQUE, pas sur le nom :
                     `self-center` le sort du `items-start` de la rangée,
                     qui cale la photo en haut. Les rembourrages haut et
                     bas étant égaux (8 px), le centre de la rangée EST
                     le centre de la plaque.
                     ⚠️ LE TEXTE SE RÉDUIT, IL NE DÉBORDE PAS : la
                     colonne du milieu porte `min-w-0 flex-1` et le
                     chevron `shrink-0`. Les 14 px du `gap-3.5` de la
                     rangée s'intercalent entre les deux, et les 12 px de
                     rembourrage droit (12 px — la nº 497 l'a porté aux
                     quatre côtés) le tiennent à distance du bord. */}
                <span
                  aria-hidden="true"
                  className="-rotate-90 self-center shrink-0 text-sombre-texte-doux"
                >
                  <IconeChevronBas taille={16} />
                </span>
              </Link>
            ) : (
              /*  §2 (nº 492) — UN MEMBRE SANS FICHE GARDE SA PLAQUE : le
                  fond ne dit plus « ça se clique » (il est permanent), il
                  dit « voici une personne ». Le survol, l'appui — et
                  depuis la nº 493 le CHEVRON — lui manquent, puisqu'il
                  n'y a rien à ouvrir. C'est la MÊME condition qui décide
                  des quatre : `membre.slug`. */
              <div className={ENCADRE_MEMBRE}>{ligne()}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ==================================================================
 * §4 — LES ADRESSES D'UN SALON OU D'UN STUDIO
 * ================================================================== */

/** Un studio, ramené au format que lit lib/adresse. */
function lieuDuStudio(studio: StudioFiche): LieuAffichable {
  return {
    adresse: studio.adresse,
    code_postal: studio.code_postal,
    ville: studio.ville,
    region: studio.region,
    pays: studio.pays,
    code_pays: studio.code_pays,
  };
}

/** L'adresse Google Maps d'un lieu — la recherche COMPLÈTE, code
    postal et pays compris : un plan n'est pas un affichage. */
function adresseMaps(lieu: LieuAffichable): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    ligneMaps(lieu)
  )}`;
}

/**
 * §3 (nº 225) — LA FENÊTRE D'ADRESSE DU SMARTPHONE, DÉPOUILLÉE
 * ==================================================================
 * (nº 231-§2) Elle portait trop de choses : la croix, l'adresse
 * répétée (le visiteur vient de cliquer dessus), les badges du lieu —
 * tout est SUPPRIMÉ, code compris. Il ne reste que LES DEUX ACTIONS,
 * empilées, de dimensions identiques : « Copier l'adresse » en verre
 * blanc au-dessus, « Ouvrir dans Google Maps » en verre teinté rose
 * dessous — l'unique action finale. La fenêtre se referme par un
 * appui à côté d'elle, et rétrécit à la hauteur de son contenu.
 *
 * LE VERRE GARDE LES VALEURS DE LA Nº 229-§5 : plaque anthracite à
 * 40 %, `blur(30px) saturate(180%)`, liseré atténué — la règle vit
 * dans globals.css (`[data-verre-fenetre]`, les DEUX lignes
 * littérales, préfixée d'abord, jamais de `@supports`, jamais de
 * `var()` dans le filtre : les pièges payés du nº 225-§4).
 */
function FenetreAdresse({
  adresse,
  lieu,
  surFermeture,
}: {
  /** L'adresse en toutes lettres — elle ne s'AFFICHE plus, mais c'est
      elle que « Copier l'adresse » met au presse-papier. */
  adresse: string;
  lieu: LieuAffichable;
  surFermeture: () => void;
}) {
  const [copie, setCopie] = useState(false);

  /** Dit si la copie a VRAIMENT eu lieu : c'est elle qui autorise la
      fermeture différée (nº 232-§2) — une copie ratée laisse la
      fenêtre ouverte plutôt que de mimer un succès. */
  async function copier(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(adresse);
      setCopie(true);
      return true;
    } catch {
      //  Sans presse-papier (http local) : la méthode ancienne.
    }
    try {
      const zone = document.createElement("textarea");
      zone.value = adresse;
      zone.setAttribute("readonly", "");
      zone.style.cssText =
        "position:fixed;top:0;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(zone);
      zone.focus();
      zone.setSelectionRange(0, adresse.length);
      const fait = document.execCommand("copy");
      zone.remove();
      if (fait) setCopie(true);
      return fait;
    } catch {
      //  Rien : le bouton garde son mot, l'adresse reste lisible.
      return false;
    }
  }

  /**
   * §2 (nº 232) — LA FENÊTRE SE REFERME APRÈS L'ACTION.
   * « Adresse copiée » se lit 600 ms — assez pour la confirmation,
   * pas assez pour attendre — puis la fenêtre part. Elle ne part QUE
   * si la copie a réussi.
   * ⚠️ AUCUNE ENTRÉE D'HISTORIQUE À RETIRER : l'ouverture n'en pousse
   * pas (un simple état React, voir AdresseCliquable) — l'historique
   * ne grossit donc jamais d'un cran par adresse consultée, et le
   * banc le compte.
   */
  function copierPuisFermer() {
    void copier().then((fait) => {
      if (fait) window.setTimeout(surFermeture, 600);
    });
  }

  /**
   * §2 (nº 234) — LA FENÊTRE EST POSÉE DANS LE CORPS DU DOCUMENT
   * ==================================================================
   * TROIS PASSES ONT MESURÉ DES VALEURS JUSTES DANS CHROMIUM pendant
   * que l'iPhone montrait une plaque presque noire. Les valeurs
   * n'étaient pas le sujet : la STRUCTURE l'était. Deux causes, toutes
   * deux corrigées ici, et aucune n'est une question d'opacité.
   *
   * 1. CE QUE LA PLAQUE FLOUTE, C'EST LE VOILE. Un `backdrop-filter`
   *    floute TOUT CE QUI EST PEINT DERRIÈRE lui dans sa racine
   *    d'arrière-plan — le voile compris, puisqu'il est peint juste
   *    avant elle. Un voile noir à 55 % couvrant tout l'écran, c'est
   *    donc un aplat noir que la plaque floute : flouter du noir uni
   *    donne du noir uni. Aucun réglage de la plaque ne pouvait
   *    corriger cela — c'est LE VOILE qu'il fallait alléger (il passe
   *    à 25 %), et c'est mesurable partout, sans WebKit.
   *
   * 2. LA PLAQUE ÉTAIT SA PROPRE RACINE D'ARRIÈRE-PLAN pendant son
   *    ouverture. Elle portait `transition-opacity` +
   *    `starting:opacity-0` : une opacité INFÉRIEURE À 1 crée une
   *    nouvelle racine, et l'élément ne floute alors plus la page mais
   *    son propre plan. Relevé au banc, plaque saisie en pleine
   *    ouverture : `opacity 0.0852719`. Le fondu est donc passé AU
   *    VOILE, qui ne floute rien ; la plaque, elle, n'a plus aucune
   *    opacité partielle, à aucun instant.
   *
   * ⚠️ ET ELLE EST MONTÉE DANS `document.body` (portail) : plus aucun
   * ancêtre de la fiche — bloc collant, conteneur, futur `transform`
   * d'animation — ne peut créer une racine au-dessus d'elle. Le voile
   * et la plaque restent FRÈRES, et leur seul parent est un conteneur
   * nu (`position: fixed`, qui ne crée aucune racine).
   */
  const fenetre = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adresse du lieu"
      className="fixed inset-0 z-[80] flex items-center justify-center p-6"
    >
      {/*  LE VOILE — un appui à côté de la fenêtre referme. Sa couleur
           est en `rgba` (jamais une `opacity`, qui créerait une racine
           d'arrière-plan), il ne porte AUCUN filtre, et c'est LUI qui
           porte le fondu d'ouverture. */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={surFermeture}
        className="absolute inset-0 bg-black/25
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
      />
      {/*  Le liseré (plus lumineux en haut, ATTÉNUÉ à la nº 229-§5 —
           il se devine, il ne se lit pas) vit dans la règle
           [data-verre-fenetre] de globals.css, avec le verre. */}
      {/*  ⚠️ AUCUNE OPACITÉ, AUCUNE TRANSITION D'OPACITÉ ICI : ce sont
           elles qui faisaient de la plaque sa propre racine
           d'arrière-plan pendant l'ouverture (voir la note ci-dessus).
           Le fondu appartient au voile. */}
      <div
        /*  §1 (nº 544) — CETTE PLAQUE N'EST PLUS EN VERRE. L'attribut
             de verre est retiré et le jeton `carte` de la nº 466 le
             remplace — la teinte des nº 542-543, que le propriétaire
             étend aux fenêtres superposées. `globals.css` n'est pas
             touché (règle nº 172). Le LISERÉ part avec l'attribut : il
             n'a plus d'épaisseur de verre à suggérer.
             ⚠️ RIEN D'AUTRE NE BOUGE : ni la largeur, ni l'arrondi, ni
             le rembourrage, ni le voile au-dessus.
             ⚠️ LES DEUX CAPSULES DE VERRE DE CETTE FENÊTRE (blanc à
             20 %, et l'action rose à 40 %) NE SONT PAS TOUCHÉES : ce
             sont des voiles, et un voile blanc se voit MIEUX sur une
             plaque plus claire (1,82 → 1,92). */
        className="relative w-full max-w-[360px] rounded-3xl bg-sombre-carte p-6"
      >
        {/*  DEUX CAPSULES, ET RIEN D'AUTRE (nº 231-§2). « Copier
             l'adresse » — LE JUMEAU EXACT du badge d'ouverture : même
             largeur (pleine), même hauteur, même rayon — en verre
             blanc, jamais en rose (l'action finale reste seule à le
             porter). Le mot devient « Adresse copiée » après l'appui. */}
        {/*  §1 (nº 244) — LA CAPSULE EST NUE : la lumière de la nº 242
             est RETIRÉE (plus d'anneau, plus de trait clair), le blanc
             remonte à 20 %. Tout vit dans `data-verre-capsule`
             (globals.css) — l'unique écriture, partagée avec le badge
             « Copier » de la fenêtre Partage : retirée là-bas, retirée
             partout. */}
        <button
          type="button"
          onClick={copierPuisFermer}
          data-verre-capsule=""
          className="flex min-h-[48px] w-full items-center justify-center
                     rounded-full text-[15px] font-semibold text-sombre-texte"
        >
          {copie ? "Adresse copiée" : "Copier l'adresse"}
        </button>

        {/*  L'ACTION FINALE — la seule capsule rose de la fenêtre, en
             VERRE TEINTÉ (nº 227-§6, allégé nº 229-§5 : rose à 45 %,
             mêmes flou et saturation que la plaque — jamais un aplat
             opaque). */}
        {/*  Le lien s'ouvre (nouvel onglet), la fenêtre se referme
             DANS LE MÊME GESTE (nº 232-§2) — rien à attendre ici. */}
        <a
          href={adresseMaps(lieu)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={surFermeture}
          data-verre-action=""
          //  Nue elle aussi (nº 244-§1) : le rose reste à 40 %, sans
          //  ombre interne ni contour, et l'état enfoncé ne passe
          //  jamais par `opacity` (nº 234).
          className="mt-3 flex min-h-[48px] w-full items-center justify-center
                     rounded-full text-[15px] font-semibold text-white"
        >
          Ouvrir dans Google Maps
        </a>
      </div>
    </div>
  );

  //  LE PORTAIL — jamais pendant le rendu du serveur (`document`
  //  n'existe pas) ; la fenêtre ne s'ouvre que sur un geste, donc
  //  toujours côté navigateur.
  return typeof document === "undefined"
    ? fenetre
    : createPortal(fenetre, document.body);
}

/**
 * §1 (nº 290) — LE LIEN D'ADRESSE, ET IL N'Y EN A QU'UN
 * ==================================================================
 * LE DÉFAUT RELEVÉ : sur la fiche d'un ARTISTE, l'adresse d'un lieu
 * saisi à la main (« 44 Rue Trousseau, Paris, France ») était du
 * TEXTE MORT. Ce n'était PAS le verrou de la nº 288-§4 — celui-là ne
 * gardait que `AdresseCliquable` — mais UN AUTRE CHEMIN : la fiche
 * d'artiste pose ses lieux avec `TroisLignesDuLieu`, dont la ligne
 * d'adresse était un simple `<p>` qui n'a jamais rencontré
 * `AdresseCliquable`.
 *
 * LE REMÈDE, ET LA RÈGLE : le lien lui-même sort d'`AdresseCliquable`
 * et devient CE composant, que les deux chemins consomment. Il n'y a
 * donc pas un second mécanisme — il y en a un, partagé : même
 * `ligneMaps`, même soulignement au survol, même interception au
 * doigt, même fenêtre de verre (« Copier l'adresse » / « Ouvrir dans
 * Google Maps »).
 *
 * CE QU'IL NE FAIT PAS : sans lieu à chercher (`lieu` nul — un
 * DOMICILE n'expose jamais d'adresse) ou sans texte, il rend le texte
 * NU, exactement comme avant. C'est la seule exception, et elle ne
 * change pas.
 *
 * (Il a été EXPORTÉ le temps des nº 416-417, pour la ligne du profil
 * du mode sans lieu ; ce mode est supprimé — nº 418 — et l'export avec
 * lui : ses deux appelants sont de nouveau dans ce fichier.)
 */
function LienAdresse({
  texte,
  lieu,
  classeTexte,
  soulignement = SOULIGNEMENT_LIEN,
}: {
  texte: string;
  /** `null` = rien à chercher : le texte reste du texte. */
  lieu: LieuAffichable | null;
  classeTexte: string;
  /**
   * §2 (nº 389) — LE SOULIGNEMENT AU SURVOL, RÉGLABLE.
   * ------------------------------------------------------------------
   * Il est la règle du site depuis la nº 271 — « dehors on souligne »
   * — et rien ne change pour les adresses des AUTRES lieux, qui le
   * gardent par défaut. Mais la ligne d'adresse du profil (nº 388) est
   * désormais BLEUE : le bleu dit déjà qu'elle sort du site, et le
   * propriétaire n'a pas demandé de trait. Elle passe donc une chaîne
   * vide, et son seul effet de survol est l'éclaircissement du bleu.
   */
  soulignement?: string;
}) {
  const [fenetre, setFenetre] = useState(false);
  if (!lieu || !texte) return <span className={classeTexte}>{texte}</span>;
  return (
    <>
      {/*  §1 (nº 271) — LE SOULIGNEMENT N'APPARAÎT QU'AU SURVOL : au
           repos, l'adresse est du TEXTE NU. C'est l'écriture UNIQUE
           (`SOULIGNEMENT_LIEN`) : fin, décalé, gris doux — la couleur
           du texte, elle, ne change jamais.
           §2 (nº 276) — LE LIEN EST EN LIGNE, AUTOUR DE LA SEULE
           ADRESSE. La destination SORT du site (Google Maps, ou la
           fenêtre de verre au doigt) : AUCUN encadré — « dehors on
           souligne » — et seule l'adresse répond. Le `group` du
           soulignement est donc le lien lui-même : le trait s'allume
           au survol de l'adresse, pas de toute la ligne. Au doigt,
           pas de survol : le bref état enfoncé (`active:`). */}
      <a
        href={adresseMaps(lieu)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(evenement) => {
          //  SMARTPHONE : la fenêtre, pas la navigation.
          if (document.documentElement.dataset.appareil === "mobile") {
            evenement.preventDefault();
            setFenetre(true);
          }
        }}
        //  §1 (nº 513) — L'ADRESSE SE COPIE. C'est le texte du site
        //  qu'on recopie le plus — pour le coller dans un message, dans
        //  un autre plan — et il était le plus difficile à prendre :
        //  glisser dessus emportait le lien au lieu de surligner. Même
        //  geste que les plaques (la raison est écrite en entier à la
        //  plaque des membres), et le plan s'ouvre exactement comme
        //  avant : `href` et `onClick` ne sont pas touchés.
        //  ⚠️ AU DOIGT, RIEN NE CHANGE — et il y a de toute façon un
        //  bouton « Copier l'adresse » dans la fenêtre de verre.
        draggable={false}
        //  §1 (nº 514) — ET C'EST LE TEXTE QUI PART AU PRESSE-PAPIERS,
        //  plus l'adresse Google Maps : surligner l'adresse et la
        //  copier rendait l'URL du plan, parce que la sélection tient
        //  tout entière dans ce lien (le comportement de WebKit). On
        //  pose donc nous-mêmes ce qui est vu — voir lib/copie-du-texte.
        onCopy={garderLeTexteALaCopie}
        className="group rounded transition-colors active:bg-white/10"
      >
        <span className={`${classeTexte} ${soulignement}`}>{texte}</span>
      </a>
      {fenetre && (
        <FenetreAdresse
          adresse={texte}
          lieu={lieu}
          surFermeture={() => setFenetre(false)}
        />
      )}
    </>
  );
}

/**
 * L'ADRESSE, CLIQUABLE QUAND ELLE EST COMPLÈTE (nº 225-§3).
 *  · WEB : un lien ordinaire vers Google Maps, nouvel onglet ;
 *  · SMARTPHONE : la fenêtre de verre ci-dessus — le lien est
 *    intercepté, rien ne navigue.
 * Une adresse INCOMPLÈTE (pas de rue) reste du texte : un plan sans
 * rue tombe n'importe où.
 * L'ÉTIQUETTE se choisit (nº 226-§3) : « Adresse : » pour celle de
 * l'affiche, « Autre adresse : » pour les suivantes — même grammaire,
 * même lien Google Maps.
 */
function AdresseCliquable({
  etiquette = "Adresse",
  adresse,
  lieu,
  pastille,
}: {
  etiquette?: string;
  adresse: string;
  lieu: LieuAffichable | null;
  /** LA PASTILLE DU LIEU, quand la ligne en porte une (l'adresse de
      l'affiche) : elle entre alors DANS l'encadré (nº 232-§1), comme
      la pastille d'un membre d'équipe. Les « Autre adresse » n'en ont
      pas et gardent leur ligne de texte seule. */
  pastille?: React.ReactNode;
}) {
  /**
   * §4 (nº 288) — UNE LOCALITÉ SEULE SE CLIQUE AUSSI.
   * ------------------------------------------------------------------
   * LE DÉFAUT RELEVÉ : sur la fiche d'un studio, « Félines, France »
   * était du TEXTE MORT. La condition exigeait une RUE
   * (`lieu?.adresse`) — la règle de la nº 225-§3, « un plan sans rue
   * tombe n'importe où ». Or un studio n'a souvent que sa localité, et
   * ouvrir la localité est déjà utile : ce n'est jamais une erreur.
   * On n'exige donc plus qu'UNE CHOSE : qu'il y ait quelque chose à
   * chercher. `ligneMaps` compose la requête avec ce qu'il a — rue si
   * elle existe, sinon ville, région, pays.
   * ⚠️ CELA NE TOUCHE PAS « À DOMICILE » : un domicile n'expose jamais
   * d'adresse, et il ne passe pas par ici (voir BlocProfilsArtiste, où
   * la ville et le rayon remplacent nom et adresse). Un studio est un
   * lieu PROFESSIONNEL — ce n'est pas le même cas.
   */
  const complete = Boolean(lieu && adresse);

  /*  §4 (nº 286) — DEUX LIGNES, la grammaire de toute la fiche :
       l'étiquette grise en capitales (« ADRESSE DU SALON »), puis
       l'adresse en blanc dessous. Le deux-points est parti avec la
       ligne unique — une étiquette de section n'en porte pas. */
  const ligneTexte = (cliquable: boolean) => (
    <div className="[overflow-wrap:anywhere]">
      <p className={ECRITURE_TITRE_SECTION}>{etiquette}</p>
      <p className="mt-1.5">
        {/*  §1 (nº 290) — LE LIEN EST DÉSORMAIS `LienAdresse`, partagé
             avec la fiche d'artiste : plus une seule ligne de lien
             recopiée ici. */}
        <LienAdresse
          texte={adresse}
          lieu={cliquable ? lieu : null}
          classeTexte="text-[15px] font-medium text-sombre-texte"
        />
      </p>
    </div>
  );

  if (!complete || !lieu) {
    //  ADRESSE INCOMPLÈTE : pas de plan, pas de lien — mais la ligne
    //  garde sa pastille et sa colonne quand elle en a une, comme une
    //  ligne d'équipe sans fiche.
    return pastille ? (
      <div className="flex items-start gap-3.5">
        {pastille}
        <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
          <LigneEtiquetee etiquette={etiquette} valeur={adresse} />
        </div>
      </div>
    ) : (
      <LigneEtiquetee etiquette={etiquette} valeur={adresse} />
    );
  }

  return (
    <>
      {/*  §2 (nº 276) — LA RANGÉE N'EST PLUS LE LIEN. La 271 faisait
           de toute la ligne la surface cliquable (l'<a> portait la
           rangée entière, pastille comprise) : or la destination SORT
           du site — Google Maps, ou la fenêtre de verre au doigt — et
           la règle du propriétaire tient à la destination : « dehors
           on souligne », SEULE L'ADRESSE se clique (le lien est en
           ligne, dans `ligneTexte`). La rangée redevient donc un
           simple bloc de mise en page : aucun encadré, aucun fond de
           survol — l'encadré est réservé à ce qui mène à une fiche du
           site.
           ⚠️ LES HORAIRES RESTENT DEHORS (nº 230-§4, tenu) : le
           chevron ne peut pas déclencher le lien de l'adresse.
           §5 (nº 227) — aucun rose : la couleur ne change jamais. */}
      <div className={pastille ? "flex items-start gap-3.5" : "block"}>
        {pastille}
        {pastille ? (
          <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
            {ligneTexte(true)}
          </div>
        ) : (
          ligneTexte(true)
        )}
      </div>
    </>
  );
}

/**
 * ██ §3 (nº 388) — L'ADRESSE DESCEND DANS LA SÉRIE DES LIGNES ██
 * ==================================================================
 * CE QUI DISPARAÎT : le titre « Adresse du salon » et la PHOTO ronde
 * qui l'accompagnait. L'adresse n'est plus une section coiffée d'une
 * étiquette : c'est une LIGNE, la sixième, sous Booking, le site, les
 * pratiques et les styles.
 *
 * CE QU'ELLE DEVIENT : exactement la forme de ses voisines —
 * `BOITE_ICONE_LIGNE` pour l'icône de localisation,
 * `ECRITURE_LIGNE_FICHE` pour le texte. Aucune valeur n'est écrite
 * ici : les deux constantes sont celles que toutes les lignes lisent.
 * Elle est BLEUE, comme Instagram et pour la même raison (§5) : elle
 * mène dehors, sur un plan.
 *
 * LE VOLET DES HORAIRES EST DÉPLACÉ, PAS RÉÉCRIT : c'est le même
 * `HorairesEnLigne`, avec son mécanisme d'ouverture, sa flèche, son
 * contenu et ses couleurs (« Ouvert » vert, « Fermé » rouge). Il se
 * pose juste sous l'adresse, aligné sur elle — son retrait gauche
 * n'est plus les 66 px de la pastille disparue, mais les 32 px de la
 * colonne d'icônes (22 de boîte + 10 d'écart), c'est-à-dire
 * l'alignement du texte de toutes les lignes.
 *
 * ⚠️ RIEN D'ORPHELIN : sans adresse lisible, la ligne entière ne rend
 * rien — ni icône, ni volet. Sans horaires, `HorairesEnLigne` ne rend
 * rien de lui-même, comme avant.
 * ⚠️ SALONS ET STUDIOS SEULEMENT : c'est l'appelant qui décide (voir
 * ContenuFiche) — une fiche d'artiste garde ses profils inchangés.
 */
export function LigneAdresseDuLieu({
  tatoueur,
}: {
  tatoueur: Tatoueur;
}) {
  const studios = (tatoueur.studios ?? [])
    .slice()
    .sort((a, b) => a.ordre - b.ordre);
  const principal =
    studios.find((studio) => studio.principal) ?? studios[0] ?? null;
  const lieuPrincipal: LieuAffichable = principal
    ? lieuDuStudio(principal)
    : {
        adresse: tatoueur.adresse,
        code_postal: tatoueur.code_postal,
        ville: tatoueur.ville_nom,
        region: tatoueur.region,
        pays: tatoueur.pays,
        code_pays: tatoueur.code_pays,
      };
  const adresse = ligneFiche(lieuPrincipal);
  if (!adresse) return null;
  /*  ██ §2 (nº 488) — LES HORAIRES QUITTENT L'ADRESSE ██
      ==================================================
      CE QU'IL Y AVAIT : le volet était ACCOLÉ sous l'adresse, dans une
      boîte commune, aligné par un simple retrait à gauche — il se
      lisait comme une suite de l'adresse, sans étiquette à lui.
      CE QU'IL Y A : DEUX LIGNES SŒURS, rendues côte à côte dans un
      fragment. Elles deviennent donc des enfants DIRECTS de la liste
      d'informations, et c'est ce qui donne l'air demandé : l'écart
      vertical de cette liste (ContenuFiche, §5) — VINGT-QUATRE pixels
      depuis la nº 538, vingt auparavant, exactement l'air qui sépare
      déjà le booking, le site et les étiquettes. Aucune marge n'est
      posée ici : la liste seule commande, comme pour toutes les
      autres lignes.
      SON ICÔNE : l'HORLOGE, qui existait déjà (components/Icones,
      `IconeHorloge`) — rien de dessiné pour l'occasion. Elle est au
      rang des autres (20 px dans la boîte partagée) et porte le même
      gris doux.
      ⚠️ LE VOLET LUI-MÊME N'EST PAS TOUCHÉ : `HorairesEnLigne` garde
      son ouverture, sa fermeture, son contenu, son calcul d'état dans
      le fuseau du lieu. Ce sont sa PLACE et son ÉTIQUETTE qui
      changent.
      ⚠️ ET IL RESTE MUET QUAND IL N'A RIEN À DIRE : sans horaires
      renseignés, `HorairesEnLigne` rend `null` — la ligne entière
      disparaît alors, icône comprise, au lieu de laisser une horloge
      orpheline. C'est le piège de la nº 386, et c'est pourquoi la
      garde interroge la MÊME donnée que le volet. */
  const aDesHoraires = semaineRenseignee(semaineDepuisBase(principal?.horaires));
  return (
    <>
      <p className={`flex items-start gap-2.5 ${ECRITURE_LIGNE_FICHE}`}>
        {/*  ██ §1 (nº 392) — L'ICÔNE DE LOCALISATION REVIENT AU GRIS ██
             La nº 391 lui avait donné `text-sombre-lien`, le jeton du
             mot. Le propriétaire est revenu dessus : elle reprend le
             gris doux de la nº 389, celui de toutes les autres icônes
             de la colonne.
             ⚠️ L'ADRESSE, ELLE, RESTE BLEUE : sa couleur n'est pas ici,
             elle est posée sur le LIEN (`classeTexte={LIEN_QUI_SORT}`,
             juste dessous) — cette boîte-ci ne porte que l'icône. Rien
             d'autre ne bouge, ni le survol, ni le soulignement retiré à
             la nº 389.
             ⚠️ UNE SEULE CLASSE DE COULEUR SUR CETTE BOÎTE : le piège
             de la nº 389 (l'ordre alphabétique de Tailwind tranche entre
             deux classes de même poids posées sur le MÊME élément) ne
             peut pas se reproduire — il n'y en a qu'une, et le bleu vit
             sur un autre élément. */}
        <span className={`${BOITE_ICONE_LIGNE} text-sombre-texte-doux`}>
          <IconeLocalisation taille={20} />
        </span>
        <span className="min-w-0 [overflow-wrap:anywhere]">
          <LienAdresse
            texte={adresse}
            lieu={lieuPrincipal}
            classeTexte={LIEN_QUI_SORT}
            //  §2 (nº 389) — aucun trait : le bleu dit déjà que la
            //  destination sort du site, et il s'éclaircit au survol.
            soulignement=""
          />
        </span>
      </p>
      {aDesHoraires && (
        <p className={`flex items-start gap-2.5 ${ECRITURE_LIGNE_FICHE}`}>
          <span className={`${BOITE_ICONE_LIGNE} text-sombre-texte-doux`}>
            <IconeHorloge taille={20} />
          </span>
          <span className="min-w-0">
            <HorairesEnLigne
              horaires={principal?.horaires}
              fuseau={principal?.fuseau}
            />
          </span>
        </p>
      )}
    </>
  );
}

export function BlocAdressesFiche({
  tatoueur,
  studioCourantId,
}: {
  tatoueur: Tatoueur;
  /** Le studio que l'adresse désigne (`?studio=<id>`), quand il y en a
      un : c'est lui qui passe en tête. */
  studioCourantId?: string | null;
}) {
  const studios = (tatoueur.studios ?? [])
    .slice()
    .sort((a, b) => a.ordre - b.ordre);

  /** Le studio de la fiche elle-même, en tête : c'est « Adresse ». */
  const principal =
    studios.find((studio) => studio.id === studioCourantId) ??
    studios.find((studio) => studio.principal) ??
    studios[0] ??
    null;
  const autres = studios.filter((studio) => studio.id !== principal?.id);
  //  §3 (nº 388) — `lieuPrincipal`, `adressePrincipale` et
  //  `etiquettePrincipale` sont partis avec l'adresse : elle se
  //  dessine maintenant dans `LigneAdresseDuLieu`, plus haut.

  /**
   * §4 (nº 286) — L'ÉTIQUETTE PORTE LE TYPE DE LIEU : « ADRESSE DU
   * SALON », « ADRESSE DU STUDIO ». Un visiteur qui arrive
   * directement sur la page doit savoir ce qu'il regarde — « Adresse »
   * seul ne le disait pas.
   * ⚠️ LE MOT VIENT DE `profilDeLaFiche`, l'unique écriture qui
   * traduit `type_fiche` + `etablissement` : la carte, le moteur et
   * cette page ne peuvent pas se contredire.
   * ⚠️ ET L'ACCORD SUIT LE NOMBRE : « AUTRE ADRESSE » s'il n'y en a
   * qu'une, « AUTRES ADRESSES » au-delà.
   */
  const typeDuLieu =
    profilDeLaFiche(tatoueur.type_fiche, tatoueur.etablissement) ===
    "studio-prive"
      ? "studio"
      : "salon";
  const etiquetteAutres =
    autres.length > 1
      ? `Autres adresses du ${typeDuLieu}`
      : `Autre adresse du ${typeDuLieu}`;

  /**
   * §3 (nº 226) — L'EMPILEMENT REMPLACE LE VA-ET-VIENT.
   * Le sélecteur « Adresse / Autre adresse » (OngletsLigne) est
   * SUPPRIMÉ, son état avec : il cachait une adresse derrière une
   * autre adresse. De haut en bas, désormais :
   *  1. l'adresse de l'affiche, telle qu'elle était — photo, ligne
   *     d'adresse cliquable, horaires ;
   *  2. chaque AUTRE adresse sur sa ligne : « Autre adresse : » suivi
   *     de l'adresse, en lien Google Maps (la même mécanique que la
   *     première — fenêtre de verre au doigt, nouvel onglet au web) ;
   *  3. l'ÉQUIPE, TOUJOURS après toutes les adresses — elle appartient
   *     à l'enseigne, pas à une adresse (la vue `equipe_salon` ne
   *     distingue pas les studios).
   */
  return (
    <div>
      {/*  §2 (nº 276) — LA LIGNE D'ADRESSE N'A PLUS D'ENCADRÉ : sa
           destination sort du site, seule l'ADRESSE se clique (lien en
           ligne, soulignement au survol — voir AdresseCliquable). La
           pastille reste ancrée en haut (nº 229-§1), la colonne garde
           sa bascule de centrage — la géométrie de la rangée n'a pas
           bougé d'un pixel.
           ⚠️ LES HORAIRES SONT DEHORS (nº 230-§4, tenu) : hors de la
           rangée, hors du lien — le chevron ne peut pas déclencher
           l'adresse. Leur retrait gauche (66 px = 52 de pastille + 14
           d'écart) les garde alignés sous la colonne de texte, là où
           ils ont toujours été. */}
      {/*  §3 (nº 388) — L'ADRESSE PRINCIPALE ET SES HORAIRES ONT
           QUITTÉ CE BLOC : ils sont descendus dans la série des lignes
           de profil (`LigneAdresseDuLieu`, plus haut), sans titre ni
           photo. Rien ne reste ici à leur place — ce bloc commençait
           par eux, il commence maintenant par les AUTRES adresses,
           chacune avec sa propre marge. Un salon à une seule adresse
           ne rend donc plus que son équipe, et un salon sans équipe ne
           rend plus rien du tout : la section entière disparaît avec
           son trait, exactement comme « Pratique » à la nº 386. */}

      {/*  2. LES AUTRES ADRESSES — une ligne chacune, au bord gauche
           du bloc, comme l'équipe dessous. Le rythme du bloc est de
           32 px (nº 229-§2). Le `flex flex-col` date du temps où la
           rangée portait des marges négatives (l'encadré, retiré à la
           nº 276-§2) ; il ne coûte rien et protège le rythme si une
           marge d'enfant revenait un jour. */}
      {autres.map((studio) => (
        <div
              key={studio.id}
              /*  §7 (nº 389) — `first:mt-0` : voir la note de l'équipe,
                   juste dessous. Une autre adresse en tête de section
                   ne doit pas ajouter ses 32 px aux 40 du conteneur. */
              className="mt-8 first:mt-0 flex flex-col"
            >
          <AdresseCliquable
            etiquette={etiquetteAutres}
            adresse={ligneFiche(lieuDuStudio(studio))}
            lieu={lieuDuStudio(studio)}
          />
        </div>
      ))}

      {/*  3. L'ÉQUIPE — après TOUTES les adresses, toujours. */}
      {/*  §2 (nº 411) — LES GUESTS SONT DEDANS. La section séparée de
           la nº 409 et le trait de la nº 410 sont supprimés : une
           seule liste, un seul composant. */}
      <EquipeDuLieu equipe={tatoueur.equipe} />
    </div>
  );
}

/* ==================================================================
 * §5 — LES PROFILS D'UN ARTISTE
 * ================================================================== */

/**
 * ██ §4 (nº 286) — LA GRAMMAIRE DES LIEUX : TROIS LIGNES ██
 * ==================================================================
 * LA FORME ABANDONNÉE — « En salon · Résident : Hand In Glove · 44
 * Rue Trousseau, Paris » : ton administratif, deux-points superflu,
 * double séparateur, et l'adresse écrite deux fois quand aucun nom
 * n'était lu (le défaut du §3).
 *
 * LA FORME, DÉSORMAIS, et c'est celle de TOUTE la fiche — une
 * étiquette grise en capitales, une valeur blanche, un détail gris :
 *
 *      SALON · RÉSIDENT
 *      Hand In Glove Tattoo
 *      44 Rue Trousseau, Paris
 *
 * ⚠️ LES TROIS LIGNES SE DÉCIDENT DANS `troisLignesDuMode`
 * (lib/modes-exercice), pas ici : l'aperçu du formulaire et la fiche
 * publique liront donc toujours la même chose. Ce composant POSE, il
 * ne choisit pas.
 * ⚠️ L'ÉTIQUETTE EST CELLE DES AUTRES (`ECRITURE_TITRE_SECTION` — les
 * capitales grises espacées de STYLES, RENDU, TECHNIQUE) : aucune
 * valeur graphique n'est écrite ici.
 */
function TroisLignesDuLieu({
  mode,
  sansLien = false,
}: {
  mode: ModeExerciceFiche;
  /** LA LIGNE ENTIÈRE EST DÉJÀ UN LIEN vers la fiche du lieu : on n'en
      met pas un second dedans — ni en HTML (un `<a>` dans un `<a>`),
      ni en charte (« dedans on encadre, dehors on souligne — jamais
      les deux »). L'adresse se clique alors SUR LA FICHE DU LIEU, où
      elle est déjà cliquable. */
  sansLien?: boolean;
}) {
  /*  ██ §4 (nº 409) — DEUX LIGNES, ET LE NOM PASSE EN TÊTE ██
       L'étiquette en capitales (« RÉSIDENT DU SALON ») disparaît : le
       rôle descend sur la seconde ligne, en blanc, suivi du type de
       lieu et du lieu, en gris. Les morceaux viennent de
       `lieuEnDeuxLignes` (lib/modes-exercice), qui garantit qu'aucun
       n'est vide — la puce ne peut donc pas rester orpheline. */
  //  §4 (nº 496) — de la composition en deux lignes, on ne retient
  //  plus que le NOM et la VILLE. Le rôle et le type de lieu partent
  //  dans la mention du dessus (voir `mentionDuLieu`) ; `suite` les
  //  range dans cet ordre — type de lieu, puis ville — et c'est donc
  //  son DERNIER morceau qui nomme le lieu.
  const { nom, suite } = lieuEnDeuxLignes(mode);
  const adresse = suite.length > 0 ? suite[suite.length - 1] : "";
  /**
   * §1 (nº 290) — LE LIEU QUE LE PLAN VA CHERCHER : les mêmes champs
   * que partout ailleurs (`LieuAffichable`), lus sur le mode.
   * `ligneMaps` compose la requête avec ce qu'il a — rue si elle
   * existe, sinon ville, région, pays.
   * (Le mode SANS LIEU des nº 414-417 avait ici un cas à lui — jamais
   * d'adresse à ouvrir. Il est supprimé du site — nº 418 —, et
   * `sansLien` redevient le seul cas de texte nu, comme avant la
   * nº 414.)
   */
  const lieu: LieuAffichable | null = sansLien
    ? null
    : {
        adresse: mode.adresse,
        code_postal: mode.code_postal,
        ville: mode.ville ?? mode.intitule,
        region: mode.region,
        pays: mode.pays,
        code_pays: mode.code_pays,
      };
  return (
    <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
      {/*  LIGNE 1 — LE NOM DU LIEU, EN GRAS ET EN BLANC. C'est ce
           qu'on cherche des yeux : il passe donc devant le rôle, qui
           occupait cette place en capitales grises jusqu'à la nº 408.
           ⚠️ LA HAUTEUR NE CHANGE PAS : cette ligne prend exactement la
           place de l'ancienne étiquette. Les deux paragraphes de
           `ECRITURE_TITRE_SECTION` et de cette ligne-ci ne font pas la
           même hauteur — le bloc garde donc son plancher `min-h-13` et
           son `justify-center`, qui sont ce qui aligne la colonne sur la
           pastille depuis la nº 229. C'est lui, pas la somme des
           lignes, qui décide de la hauteur.
           ⚠️ CETTE NOTE DISAIT « 11 px, `leading-relaxed` » POUR
           `ECRITURE_TITRE_SECTION` : c'était faux depuis longtemps —
           la constante vaut 13 px et ne porte aucun interligne (relevé
           nº 554). Les deux chiffres sont retirés plutôt que corrigés :
           une note qui recopie une valeur vivant ailleurs se périme à
           chaque passe, et l'argument tient sans eux.
           ██ §2 (nº 555) — LE NOM PASSE DE 15 À 16 px ██
           LA RAISON, ET ELLE EST DE HIÉRARCHIE : la fiche n'avait que
           deux rangs — le nom du tatoueur en 19-20 px, et TOUT le reste
           en 15 px (relevé nº 554, §4). Le nom d'une plaque est ce
           qu'on cherche des yeux dans ce second rang ; il prend le cran
           qui manquait. Le nom d'un MEMBRE D'ÉQUIPE monte du même cran,
           dans la même passe : les deux plaques ne peuvent pas
           diverger, c'est tout le sujet du §1.
           ⚠️ CE QUI NE MONTE PAS, ET C'EST LA MOITIÉ DE LA DEMANDE :
           l'adresse juste dessous, les styles d'un membre, la mention
           grise au-dessus, la bio et les lignes d'information restent
           à 15 px. Le cran neuf est réservé aux NOMS.
           ⚠️ LA HAUTEUR NE BOUGE TOUJOURS PAS : 16 × 1,375 = 22 px au
           lieu de 20,625. Avec l'adresse (20,625) et les 2 px d'écart,
           le texte occupe 44,6 px au lieu de 43,25 — sous les 52 px du
           plancher dans les deux cas. La photo ronde recentrée à la
           nº 389 ne se déplace pas d'un pixel. */}
      {nom && (
        <p className="text-[16px] font-semibold leading-snug text-sombre-texte [overflow-wrap:anywhere]">
          <LienAdresse texte={nom} lieu={null} classeTexte="" />
        </p>
      )}
      {/*  LIGNE 2 — ELLE PORTAIT le rôle en blanc puis le reste en
           gris, séparés par la puce du site. CETTE DESCRIPTION EST
           PÉRIMÉE DEPUIS LA nº 496 : voir le §4 juste dessous, qui
           fait foi. Ce qui reste vrai de cette note : le lieu est
           cliquable vers le plan, et c'est le DERNIER morceau qui le
           porte — celui qui nomme la ville. */}
      {/*  ██ §3 (nº 410) — LES DEUX LIGNES SE RESSERRENT ██
           C'ÉTAIT `mt-1.5` (6 px), hérité de l'ancienne ligne du nom
           qui suivait une étiquette en capitales — un écart de
           SECTION, pas d'un titre à son sous-titre. Trop pour deux
           lignes qui disent la même chose.
           CE QUE JE PRENDS : `mt-0.5` (2 px). D'OÙ ÇA VIENT : c'est
           l'écart que la ligne des STYLES d'un membre d'équipe porte
           déjà sous son nom (`mt-0.5`, nº 313), à quelques pixels
           d'ici et dans la même colonne. Aucune valeur neuve.
           ⚠️ LA HAUTEUR DU BLOC NE CHANGE PAS D'UN PIXEL, et c'est
           mesurable : la colonne porte `min-h-13` (52 px) et
           `justify-center` depuis la nº 229. Deux lignes de 15 px en
           `leading-snug` font 20,6 px chacune ; avec 6 px d'écart le
           texte occupait 47,2 px, avec 2 px il occupe 43,2 px — sous
           les 52 px dans les DEUX cas. C'est donc le plancher qui
           commande la hauteur, hier comme aujourd'hui, et la photo de
           profil recentrée à la nº 389 ne bouge pas. Seul l'écart
           INTERNE se resserre.
           ⚠️ LES CHIFFRES ONT BOUGÉ À LA nº 555, LA CONCLUSION NON : la
           première ligne est passée à 16 px (22 px de haut), le texte
           occupe donc 44,6 px au lieu de 43,2. Le plancher de 52 px
           commande toujours. */}
      {/*  ██ §4 (nº 496) — LA LIGNE 2 NE PORTE PLUS QUE L'ADRESSE ██
           ==============================================================
           CE QU'ELLE CONTENAIT JUSQU'ICI : le RÔLE en blanc, puis le
           TYPE DE LIEU, puis la ville et le pays, séparés par des puces
           — « Résident • Salon • Paris, France ».
           CE QU'ELLE PORTE MAINTENANT : « Paris, France », en gris, et
           rien d'autre. Le rôle et le type de lieu sont montés dans la
           mention posée AU-DESSUS de la plaque (§3), où ils forment
           « RÉSIDENT • Salon ». Aucun mot n'est perdu, ils ont changé
           de place.
           ⚠️ LE LIEN VERS LE PLAN NE BOUGE PAS : c'est toujours le
           DERNIER morceau qui le porte — celui qui nomme la ville —, et
           c'est justement le seul qui reste. Quand la plaque entière
           est déjà un lien vers la fiche du lieu, `sansLien` le neutralise
           comme avant (pas de `<a>` dans un `<a>`).
           ⚠️ PLUS DE PUCE ICI : il n'y a plus qu'un morceau à écrire,
           donc plus rien à séparer. */}
      {adresse && (
        <p className="mt-0.5 text-[15px] leading-snug text-sombre-texte-doux [overflow-wrap:anywhere]">
          <LienAdresse texte={adresse} lieu={lieu} classeTexte="" />
        </p>
      )}
      {/*  UN GUEST PORTE SES DATES EN BLANC, et c'est voulu : c'est
           l'information qui décide le visiteur à prendre rendez-vous
           MAINTENANT — elle ne peut pas être un détail gris. */}
      {mode.genre === "guest" && (
        <DatesDeSession debut={mode.debut_le} fin={mode.fin_le} enBlanc />
      )}
    </div>
  );
}

export function BlocProfilsArtiste({
  tatoueur,
}: {
  tatoueur: Tatoueur;
}) {
  /** Le salon lié d'un profil s'ouvre en fenêtre superposée
      (nº 226-§5), comme un membre d'équipe. */
  const clicVersFiche = useClicVersFiche();
  /*  §6 (nº 415, simplifié par la nº 418) — TOUS LES MODES SONT DES
      LIEUX À NOUVEAU : le mode SANS lieu, qui devait être écarté
      d'ici, est supprimé du site. `modesOrdonnes` suffit.
      ⚠️ LA GARDE DU TRAIT RESTE, ELLE, dans l'enveloppe (ContenuFiche)
      et elle garde tout son sens : un artiste SANS AUCUN mode fait
      rendre `null` à ce bloc, et le trait de séparation — posé par
      l'enveloppe, jamais par le bloc — s'afficherait seul au-dessus du
      vide. C'est le piège de la nº 386, et il précède le mode
      supprimé : il ne part pas avec lui. */
  const modes = modesOrdonnes(tatoueur.modes);
  if (modes.length === 0) return null;

  return (
    /*  §1 et §2 (nº 229) — le même rythme que l'équipe : la pastille
        ANCRÉE en haut (`items-start`), la colonne de texte porte la
        bascule `min-h-13` + `justify-center` (un guest à plusieurs
        lignes ne dépasse jamais au-dessus), 32 px entre deux lignes
        (`gap-8`), 14 px entre pastille et texte. */
    <ul className="flex flex-col gap-8">
      {modes.map((mode) => {
        /*  LA PASTILLE : le logo du salon lié, ou le glyphe d'adresse
            quand le lieu a été saisi à la main.
            (Le cas « à domicile » de la nº 224-§1 montrait ici la
            photo de profil de l'artiste, faute d'autre lieu ; la
            nº 414 l'avait rétabli sous un autre nom, la nº 418
            supprime ce mode — il n'a plus d'objet.) */
        /*  §2 (nº 496) — LE MÊME ROND QUE DANS L'ÉQUIPE, et pour la
            même raison : posé sur la plaque `bg-sombre-eleve`, un rond
            de repli de la même couleur disparaîtrait dedans. Deux
            crans au-dessus, il reste lisible au repos comme au survol
            (voir la note de `PhotoRonde`, nº 492). */
        const pastille = (
          <PhotoRonde
            source={mode.salon_photo}
            nature="lieu"
            //  §1 (nº 524) — le rond revient à sa valeur d'avant la
            //  nº 523 (voir plaque.ts).
            classeFond="bg-sombre-haut"
          />
        );
        const lie = Boolean(mode.salon_slug && mode.salon_nom);
        const colonne = <TroisLignesDuLieu mode={mode} sansLien={lie} />;
        return (
          <li key={mode.id}>
            {/*  §3 (nº 496) — « RÉSIDENT • Salon », au-dessus et dehors :
                 le MÊME dessin que sur un salon (`MentionAuDessus`), le
                 même séparateur, la même écriture. Seul le second
                 morceau change de nature — un type de lieu ici, l'état
                 d'un carnet là-bas. */}
            <MentionAuDessus mention={mentionDuLieu(mode)} />
            {lie ? (
              /*  §2 (nº 276) — LE LIEU A SA PROPRE FICHE : TOUT
                  L'ENCADRÉ EST LE LIEN, pastille comprise — exactement
                  la ligne d'un membre d'équipe sur la fiche d'un
                  salon. La consigne de la 268 (« le lien reste borné
                  au nom + adresse ») est ANNULÉE par le propriétaire :
                  elle laissait un encadré qui ne répondait qu'au
                  texte. La règle tient à la DESTINATION : une fiche DU
                  SITE → l'encadré entier se clique, rien n'est
                  souligné (« dedans on encadre, dehors on souligne —
                  jamais les deux »).
                  ██ §2 (nº 496) — L'ÉCRITURE CHANGE, PAS LA RÈGLE ██
                  Ce n'est plus `CLASSES_LIGNE_CLIQUABLE` (l'encadré au
                  survol, débordant de 8 px) mais `ENCADRE_MEMBRE_
                  CLIQUABLE` — la plaque permanente de la nº 492, celle
                  de l'équipe des salons : fond uni qui se détache de la
                  page ET de la fenêtre superposée, quatre coins à
                  12 px, DOUZE pixels d'air sur les quatre côtés
                  (nº 497), arrêt aux marges, aucune bordure. Une seule
                  écriture pour les deux blocs : ils ne peuvent plus
                  diverger.
                  ⚠️ `CLASSES_LIGNE_CLIQUABLE` N'A PLUS DE PORTEUR sur
                  la fiche, et elle reste pourtant en place : d'autres
                  surfaces l'importent (voir ses lecteurs). Elle n'est
                  pas modifiée d'un caractère. */
              <Link
                href={adresseDeLienInterne(mode.salon_slug ?? "")}
                //  `lie` garantit le slug ; le `?? ""` ne sert qu'au
                //  typage (le rappel exige une chaîne).
                onClick={clicVersFiche?.(mode.salon_slug ?? "")}
                //  §1 (nº 513) — le nom du salon se surligne et se
                //  copie : sans ceci, glisser dessus emporterait le
                //  lien. Même geste que la plaque des membres, plus
                //  haut dans ce fichier, où la raison est écrite en
                //  entier.
                draggable={false}
                //  §1 (nº 514) — et c'est le NOM qui part au
                //  presse-papiers, pas l'adresse de la fiche (voir
                //  lib/copie-du-texte).
                onCopy={garderLeTexteALaCopie}
                className={ENCADRE_MEMBRE_CLIQUABLE}
              >
                {pastille}
                {colonne}
                {/*  §4 (nº 493, étendu par la nº 496) — LE CHEVRON DIT
                     QUE ÇA S'OUVRE : la même icône que le volet des
                     horaires, pivotée d'un quart de tour, dans le gris
                     des textes secondaires. Centré sur TOUTE la plaque
                     (`self-center`), et présent SEULEMENT quand le lieu
                     a une fiche — la branche du dessous n'en a pas. */}
                <span
                  aria-hidden="true"
                  className="-rotate-90 self-center shrink-0 text-sombre-texte-doux"
                >
                  <IconeChevronBas taille={16} />
                </span>
              </Link>
            ) : (
              /*  §2 (nº 496) — AUCUNE FICHE : la plaque reste (elle dit
                  « voici un lieu », pas « ça se clique »), mais sans
                  survol, sans appui, et SANS CHEVRON — on ne promet pas
                  une page qui n'existe pas. */
              <div className={ENCADRE_MEMBRE}>
                {pastille}
                {colonne}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
