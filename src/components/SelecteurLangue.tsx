"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { LANGUES_YOKOFOLIO } from "@/config/tatouage";
import { ETATS_ROND_BARRE, IconeCroix, IconeMonde } from "@/components/Icones";
//  §1 (nº 655) — la largeur et l'encadré des fenêtres de la barre, là
//  où vit `MenuDeVerre` : « Langue » prend ceux de « Mon compte ».
//  `FenetreDeVerre` part avec la fenêtre centrée qu'elle habillait.
import {
  CLASSE_ENCADRE_FENETRE,
  LARGEUR_FENETRE_BARRE,
  MenuDeVerre,
} from "@/components/SurfaceDeVerre";
//  §1 (nº 650) — l'alignement des menus ancrés aux boutons ronds de
//  la barre, calculé là où vit la règle de placement.
import { ALIGNEMENT_BOUTON_ROND_BARRE } from "@/components/placement-menu";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
//  §4 (nº 465) — au doigt, l'écran devient une PAGE plein écran (le
//  gabarit de la page de recherche), avec son étape d'historique.
import { PagePleinEcranMobile } from "@/components/PagePleinEcranMobile";
import { useAppareilMobile } from "@/lib/appareil";
import { useEtapeQuiSeReferme } from "@/lib/etape-refermable";
//  §1 (nº 469) — le verrou de défilement compté (surfaces empilées).
import {
  poserLeVerrouDeDefilement,
  retirerLeVerrouDeDefilement,
} from "@/lib/verrou-defilement";

/**
 * LE SÉLECTEUR DE LANGUE
 * =======================
 * Deux déclencheurs, une seule liste :
 *  - le globe rond de la barre fixe (`SelecteurLangue`) ;
 *  - la ligne « Langue » du menu « Mon compte » (`EntreeLangue`) —
 *    c'est là que le globe vit une fois connecté, la barre gardant le
 *    cœur des favoris (passe nº 137).
 *
 * ⚠️ TROIS PIÈCES, ET C'EST LA CORRECTION DES §4 ET §5 DE LA Nº 238
 * ------------------------------------------------------------------
 * · `EntreeLangue`  — la LIGNE de menu, sans fenêtre : elle prévient
 *   son parent, qui se referme (§5 : une seule surface flottante à la
 *   fois). Tant que la fenêtre vivait DANS le menu, fermer le menu
 *   l'aurait emportée avec lui — impossible de faire l'un sans l'autre.
 * · `FenetreLangue` — l'ÉCRAN des langues, monté par son APPELANT, donc
 *   survivant à la fermeture du menu. UNE seule écriture pour les deux
 *   appareils : c'est le défaut relevé par le propriétaire (la fenêtre
 *   des langues n'était en verre NI sur web NI sur mobile, alors que
 *   l'inventaire de la nº 236 l'annonçait convertie — elle n'avait tout
 *   simplement jamais été touchée).
 *   §1 (nº 655) — AU WEB, CE N'EST PLUS UNE FENÊTRE CENTRÉE : c'est un
 *   MENU ANCRÉ sous l'avatar, comme « Mon compte ». Voir sa note.
 * · `SelecteurLangue` — le globe de la barre : le même écran sur
 *   mobile, un MENU DE VERRE ancré sous lui sur le web.
 *
 * ⚠️ RIEN N'EST BRANCHÉ, ET C'EST VOULU. Seule une langue est active —
 * l'ANGLAIS depuis la nº 465 ; les autres sont grisées et NON
 * CLIQUABLES (`disabled`, et `aria-disabled` pour les lecteurs
 * d'écran) avec la mention « bientôt » — c'est elle qui explique, plus
 * aucune phrase au-dessus de la liste. La structure est prête : voir
 * LANGUES_YOKOFOLIO dans src/config/tatouage.ts.
 * §1 (nº 655) — LE TRI EN DEUX ENCADRÉS LIT CE MÊME DRAPEAU, et rien
 * d'autre : la disponible en haut, les à venir en dessous.
 *
 * QUEL HABILLAGE POUR QUEL APPAREIL : la détection C1
 * (`dataset.appareil`), jamais la largeur de fenêtre — un iPhone
 * tourné reste un téléphone. La question ne se pose qu'au clic
 * d'ouverture, côté navigateur : aucune discordance d'hydratation.
 *
 * FERMETURE : Échap partout ; un clic hors du panneau (web) ; la croix,
 * le retour du téléphone ou un choix (doigt).
 */

function langueDuJour() {
  return LANGUES_YOKOFOLIO.find((langue) => langue.actif) ?? LANGUES_YOKOFOLIO[0];
}

/**
 * ██ §1 (nº 655) — DEUX ENCADRÉS, SUR LE MODÈLE DE « MON COMPTE » ██
 * ==================================================================
 * LA CONSIGNE, MOT POUR MOT : « l'encadré du haut : la langue
 * disponible — l'anglais ; l'encadré du dessous : toutes les langues
 * bientôt disponibles ». La liste plate d'avant (sept lignes à la
 * suite, la disponible en tête par le seul jeu de la couleur et de la
 * graisse) devient donc DEUX BOÎTES, celles-là mêmes que « Mon
 * compte » emploie depuis la nº 530 — `CLASSE_ENCADRE_FENETRE`, avec
 * le `p-2` de son encadré du compte.
 *
 * ⚠️ LE PARTAGE EST FAIT, ET IL EST VOULU : c'est UNE écriture pour
 * TROIS surfaces — la fenêtre du web (ancrée sous l'avatar depuis
 * cette passe), la page du doigt, et le MENU DU GLOBE du visiteur non
 * connecté. Ce dernier n'était pas visé par la consigne et change donc
 * d'aspect avec les deux autres : le forker aurait donné deux menus de
 * langue différents selon qu'on est connecté ou non — la raison écrite
 * en toutes lettres à la nº 543-§2, et je ne la rouvre pas.
 * ⚠️ RIEN N'EST DÉCIDÉ ICI SUR QUI EST DISPONIBLE : c'est le drapeau
 * `actif` de `LANGUES_YOKOFOLIO` (config/tatouage) qui trie, et il dit
 * ANGLAIS depuis la nº 465. Le jour où une deuxième langue s'ouvrira,
 * elle montera d'elle-même dans l'encadré du haut.
 * ⚠️ UNE BOÎTE VIDE NE S'AFFICHE PAS : sans langue active, l'encadré
 * du haut n'existe pas — un cadre gris sans contenu se lirait comme un
 * défaut.
 */
function ListeDesLangues({ surChoix }: { surChoix: () => void }) {
  const disponibles = LANGUES_YOKOFOLIO.filter((langue) => langue.actif);
  const aVenir = LANGUES_YOKOFOLIO.filter((langue) => !langue.actif);
  return (
    <>
      {disponibles.length > 0 && (
        <div className={`p-2 ${CLASSE_ENCADRE_FENETRE}`}>
          <ul className="flex flex-col gap-0.5">
            {disponibles.map((langue) => (
              <LigneDeLangue
                key={langue.code}
                langue={langue}
                surChoix={surChoix}
              />
            ))}
          </ul>
        </div>
      )}
      {aVenir.length > 0 && (
        <div className={`p-2 ${CLASSE_ENCADRE_FENETRE}`}>
          <ul className="flex flex-col gap-0.5">
            {aVenir.map((langue) => (
              <LigneDeLangue
                key={langue.code}
                langue={langue}
                surChoix={surChoix}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** UNE LIGNE DE LANGUE — l'écriture d'origine, reprise AU CARACTÈRE :
    §1 (nº 655) ne fait que la sortir de la boucle pour que les deux
    encadrés la posent chacun. Ni sa géométrie, ni ses couleurs, ni sa
    puce, ni sa mention « bientôt » ne changent d'un signe. */
function LigneDeLangue({
  langue,
  surChoix,
}: {
  langue: (typeof LANGUES_YOKOFOLIO)[number];
  surChoix: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        lang={langue.code}
        disabled={!langue.actif}
        aria-disabled={!langue.actif}
        aria-current={langue.actif ? "true" : undefined}
        onClick={langue.actif ? surChoix : undefined}
        //  Le voile translucide des lignes de menu (nº 237-§2) :
        //  sur une plaque de verre, un aplat ferait une boîte
        //  posée dessus.
        /*  §3-a (nº 312) — ANNULATION DE LA nº 311, SUR CONSIGNE :
             UNE LANGUE INDISPONIBLE DOIT SE LIRE SANS EFFORT.
             ------------------------------------------------------
             La nº 311 l'avait ASSOMBRIE (de /50 à /20) parce que
             la consigne disait « on ne voit pas qu'elles sont
             désactivées ». C'était l'inverse : le propriétaire
             trouvait le /50 DÉJÀ trop sombre pour être lu. On
             remonte donc franchement AU-DESSUS du point de
             départ — /85. Elle reste distincte d'une langue
             disponible, qui est en BLANC PLEIN et en gras
             (`text-sombre-texte`, #F2F2F4, `font-semibold`) :
             c'est la COULEUR et la GRAISSE qui séparent les deux,
             plus l'effacement.
             ⚠️ C'EST UNE OPACITÉ, PAS UNE COULEUR NOUVELLE : sur
             une plaque de verre, un gris plein ferait une tache
             posée dessus (la règle de la nº 237-§2). */
        className={`w-full flex items-center gap-3 min-h-[46px] px-3 rounded-xl
                    text-left text-[14.5px] transition-colors ${
                      langue.actif
                        ? "text-sombre-texte font-semibold hover:bg-white/5 active:bg-white/10"
                        : "text-sombre-texte-doux/85 cursor-not-allowed"
                    }`}
      >
        {/* La puce ronde désigne la langue en cours — le seul
            repère, puisque aucune autre n'est cliquable. BLANCHE
            (nº 141-§5) : le rose est réservé aux accents forts,
            et une langue active n'en est pas un.
            §3 (nº 241) — LES POINTS DES LANGUES À VENIR ÉCLAIRCIS :
            `sombre-bordure` (#38383F) se perdait sur la plaque à
            45 %. Blanc à 40 % — GRIS, toujours : une langue à
            venir n'est ni une sélection (rose), ni un manque
            (rouge), ni une mise en ligne (vert).
            §3-b (nº 312) — ET IL REVIENT À 40 %, sa valeur d'avant
            la nº 311 : celle-ci l'avait descendu à 15 % pour qu'il
            suive un texte qu'on assombrissait, et le texte remonte.
            La valeur de la nº 241 est donc rendue telle quelle. */}
        <span
          aria-hidden
          className={`w-2 h-2 rounded-full shrink-0 ${
            langue.actif ? "bg-white" : "bg-white/40"
          }`}
        />
        {langue.label}
        {!langue.actif && (
          <span className="ml-auto text-[11.5px] uppercase tracking-wide">
            bientôt
          </span>
        )}
      </button>
    </li>
  );
}

/**
 * L'ÉCRAN DES LANGUES — DEUX HABILLAGES, UNE ÉCRITURE
 * ==================================================================
 * ██ §1 (nº 655) — AU WEB, ELLE QUITTE LE CENTRE POUR LA BARRE ██
 * ------------------------------------------------------------------
 * CE QUI EXISTAIT : une fenêtre CENTRÉE à l'écran (`FenetreDeVerre`,
 * nº 238-§4 puis nº 543), posée sur un voile qui la refermait au clic.
 * LA CONSIGNE : « elle doit se placer comme la fenêtre Mon compte
 * (nº 650) : à droite de l'interface, sous l'avatar — MÊME mécanisme,
 * MÊME largeur ».
 * C'EST DONC LE MÊME `MenuDeVerre`, aux mêmes trois réglages que « Mon
 * compte » : `LARGEUR_FENETRE_BARRE` (334 px), le décalage
 * `ALIGNEMENT_BOUTON_ROND_BARRE` (3 px — la différence de hauteur
 * entre les boutons ronds de la barre et les champs du moteur, nº 650)
 * et le fond opaque au jeton `carte`. Aucun nombre n'est écrit ici.
 *
 * ⚠️ CE QUE LE VOILE DE `FenetreDeVerre` FAISAIT, ET QUI EST RENDU
 * AUTREMENT — un menu ancré n'a pas de voile à lui :
 *  · L'ASSOMBRISSEMENT passe au VOILE DE LA PAGE (nº 293/294), celui
 *    que « Mon compte » et le menu du globe posent déjà : il épargne le
 *    bloc qui a ouvert la surface, et il est PERCÉ, pas empilé ;
 *  · LA FERMETURE AU CLIC À CÔTÉ devient un écouteur `mousedown`, la
 *    même écriture qu'au menu du globe, plus bas dans ce fichier.
 * Échap, la croix et le choix d'une langue referment comme avant : rien
 * de ce côté-là n'a bougé.
 *
 * ⚠️ L'ANCRE EST FACULTATIVE, et c'est ce qui sépare les deux
 * porteurs : « Mon compte » la donne (`zone`, la sienne) ; le globe de
 * la barre ne la donne PAS — il ne monte cette écriture-ci que sur un
 * VRAI TÉLÉPHONE, où c'est une page plein écran et où une ancre n'a
 * aucun sens. Sans ancre, le menu du web n'est simplement pas rendu.
 *
 * ⚠️ AU DOIGT, RIEN NE CHANGE DE GABARIT (consigne nº 655-§3 : « suivre
 * ce que fait déjà Mon compte sur cet appareil ») : la page plein écran
 * de la nº 465 reste, avec son étape d'historique (C-4, nº 330). Le
 * retour du téléphone la referme ; la croix, un choix ou Échap la
 * REPRENNENT (lib/etape-refermable) — jamais deux entrées pour une
 * navigation (nº 332-§1). Ouverte DEPUIS « Mon compte » resté ouvert
 * dessous, son étape s'empile sur la sienne : on retombe sur « Mon
 * compte » (la garde de rang, nº 465).
 * SEUL SON CONTENU SUIT LES DEUX ENCADRÉS, puisque la liste est une
 * écriture unique — et c'est précisément ce que « Mon compte » montre
 * sur cet appareil.
 */
export function FenetreLangue({
  ancre,
  surFermeture,
}: {
  /** §1 (nº 655) — le bloc sous lequel le menu du WEB se pose. Absente :
      pas de menu web (voir la note ci-dessus). */
  ancre?: RefObject<HTMLElement | null>;
  surFermeture: () => void;
}) {
  /** La page du doigt — le piège de focus s'y accroche là-bas. */
  const plaque = useRef<HTMLDivElement>(null);
  /** Le panneau du web — le piège de focus ET le test « dedans » du
      clic à côté (le menu vit dans le corps du document, nº 238-§4). */
  const panneauWeb = useRef<HTMLDivElement>(null);
  /*  ██ §4 (nº 465) — AU DOIGT, C'EST UNE PAGE, PLUS UNE FENÊTRE ██
      L'écran « Langue » adopte le gabarit de la page de recherche du
      smartphone : le titre et son globe en haut à gauche, la croix à
      l'opposé (`EnTetePleinEcran` — l'écriture partagée, pas une
      copie), le fond opaque plein écran. LE WEB NE CHANGE PAS : la
      fenêtre de verre ci-dessous reste son habillage, cachée au doigt
      par `mobile:hidden` (aucune bifurcation d'état : pas d'éclair du
      mauvais habillage au montage).
      ET ELLE POSE SON ÉTAPE (C-4, nº 330) — au doigt seulement : une
      surface qui couvre l'écran, une entrée d'historique. Le retour du
      téléphone la referme ; la croix, un choix ou Échap la REPRENNENT
      (l'écriture unique, lib/etape-refermable) — jamais deux entrées
      pour une navigation (nº 332-§1). Ouverte DEPUIS « Mon compte »
      resté ouvert dessous, son étape s'empile sur la sienne : le
      retour ou la croix ne referment qu'ELLE, et l'on retombe sur
      « Mon compte » (la garde de rang, nº 465 — etape-refermable). */
  const auDoigt = useAppareilMobile();
  useEtapeQuiSeReferme(auDoigt, surFermeture);

  /*  §1 (nº 655) — L'ASSOMBRISSEMENT DE LA PAGE, À LA PLACE DU VOILE
      DE `FenetreDeVerre`. C'est le MÊME mécanisme que « Mon compte »
      et que le menu du globe (`useVoileDeLaPage`, nº 293/294), pas un
      second : on lui donne l'ancre, il remonte au bloc qui la contient,
      pose le voile percé et l'enlève. Il sort de lui-même au doigt (la
      page plein écran est opaque, il n'y a rien à assombrir). */
  useVoileDeLaPage(Boolean(ancre), ancre);

  //  Échap ferme, et la page ne défile plus derrière.
  //  §1 (nº 469) — le blocage passe par le VERROU COMPTÉ
  //  (lib/verrou-defilement) : cette fenêtre s'EMPILE sur « Mon
  //  compte » au doigt (nº 465) — le « sauver puis rendre » d'avant
  //  capturait le « hidden » du dessous et le laissait pour toujours.
  useEffect(() => {
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") surFermeture();
    }
    poserLeVerrouDeDefilement();
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("keydown", auClavier);
      retirerLeVerrouDeDefilement();
    };
  }, [surFermeture]);

  /*  ██ §1 (nº 655) — LE CLIC À CÔTÉ REFERME, AU WEB ██
      Le voile de `FenetreDeVerre` s'en chargeait ; un menu ancré n'en a
      pas. L'écriture est celle du menu du globe, plus bas dans ce
      fichier — et le test porte sur LE PANNEAU, pas sur la zone : la
      plaque est dans le corps du document (nº 238-§4), donc « hors de
      l'ancre » pour n'importe quel test naïf.
      ⚠️ AU DOIGT, JAMAIS : la page couvre tout l'écran, et un appui sur
      son titre passerait pour un clic « à côté » — elle se refermerait
      sous le doigt. */
  useEffect(() => {
    if (auDoigt || !ancre) return;
    function auPointeur(evenement: MouseEvent) {
      if (panneauWeb.current?.contains(evenement.target as Node)) return;
      surFermeture();
    }
    document.addEventListener("mousedown", auPointeur);
    return () => document.removeEventListener("mousedown", auPointeur);
  }, [auDoigt, ancre, surFermeture]);

  //  Le focus ENTRE dans la fenêtre et y TOURNE EN ROND : sans ça, la
  //  tabulation partirait à l'aveugle dans la page derrière.
  //  §1 (nº 655) — LA BOÎTE SUIT L'HABILLAGE VISIBLE : le panneau du
  //  web, la page au doigt. Les deux sont rendus (aucune bifurcation
  //  d'état, donc aucun éclair du mauvais habillage) ; un seul est vu.
  useEffect(() => {
    const boite = auDoigt ? plaque.current : panneauWeb.current;
    if (!boite) return;
    const focusables = () => [
      ...boite.querySelectorAll<HTMLElement>("button:not([disabled])"),
    ];
    focusables()[0]?.focus();
    function auTab(evenement: KeyboardEvent) {
      if (evenement.key !== "Tab") return;
      const liste = focusables();
      if (liste.length === 0) return;
      const premier = liste[0];
      const dernier = liste[liste.length - 1];
      if (evenement.shiftKey && document.activeElement === premier) {
        evenement.preventDefault();
        dernier.focus();
      } else if (!evenement.shiftKey && document.activeElement === dernier) {
        evenement.preventDefault();
        premier.focus();
      }
    }
    document.addEventListener("keydown", auTab);
    return () => document.removeEventListener("keydown", auTab);
  }, [auDoigt]);

  return (
    <>
      {/*  ██ LE WEB — LE MENU ANCRÉ SOUS L'AVATAR (§1, nº 655) ██
           Les réglages sont ceux de « Mon compte », repris tels quels
           (MenuEspace) : largeur partagée, décalage d'alignement des
           boutons ronds, fond opaque, alignement à droite. */}
      {ancre && (
        <MenuDeVerre
          ouvert
          ancre={ancre}
          refPanneau={panneauWeb}
          largeur={LARGEUR_FENETRE_BARRE}
          decalageHaut={ALIGNEMENT_BOUTON_ROND_BARRE}
          opaque
          alignement="droite"
          role="dialog"
          aria-label="Choisir la langue"
          data-source-composant="SelecteurLangue · fenêtre du compte"
          className="mobile:hidden"
        >
          {/*  ██ §3 (nº 658) — LE TRAIT S'EN VA, LE TITRE DESCEND DANS
               LA COLONNE ██
               ==========================================================
               CE QUE LA nº 655 AVAIT POSÉ : une BARRE de titre à part,
               avec son trait d'un bord à l'autre — celle de
               « Notifications », pour que les deux fenêtres sœurs se
               ressemblent. Le propriétaire ne veut pas de ce trait ici,
               et veut les encadrés PLUS HAUT.
               CE QUI LE REMPLACE : la disposition de « Mon compte » —
               le titre entre DANS la colonne du contenu, comme sa tête,
               et c'est le `gap-3` de la colonne qui l'en sépare.
               L'AIR RÉCUPÉRÉ SE CHIFFRE : entre le mot et le premier
               encadré il y avait 16 px (le bas de la barre) plus 20 px
               (le haut de la colonne) = TRENTE-SIX. Il y en a désormais
               8 (`mb-2`) plus 12 (`gap-3`) = VINGT — la règle exacte de
               la tête de « Mon compte » (nº 641-§2), qui veut l'air
               sous le titre égal à l'air au-dessus. Les encadrés
               remontent donc de SEIZE pixels.
               ⚠️ LE TITRE ET LA CROIX NE CHANGENT NI DE RANG NI DE
               PLACE : 17 px gras, croix à l'opposé, compensée de −9 px
               — (36 − 18) / 2, l'écart entre sa cible et son dessin
               (règle nº 483). Son glyphe reste à 20 px du bord droit,
               à l'aplomb des encadrés, et le titre à 20 px du gauche :
               les deux vivent maintenant dans le `p-5` de la colonne au
               lieu du `px-5` de la barre — le même nombre.
               ⚠️ « NOTIFICATIONS » GARDE SON TRAIT, et je le dis plutôt
               que d'aligner de mon chef : la consigne ne vise que
               « Langue ». Les deux fenêtres divergent donc d'un trait,
               et c'est une décision, pas un oubli. */}
          <div className="flex flex-col gap-3 p-5">
            {/*  LE GLOBE DEVANT LE TITRE (nº 658) — « dans le même
                 style que les icônes de la fenêtre Mon compte » : rang
                 20, blanc à 80 %, et 10 px d'écart au mot. C'est
                 exactement la cloche de « Notifications », au
                 caractère — un seul dessin de titre pour les deux. */}
            <div className="mb-2 flex items-center gap-2.5">
              <IconeMonde taille={20} classe="shrink-0 text-sombre-texte/80" />
              <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
                Langue
              </h2>
              <button
                type="button"
                onClick={surFermeture}
                aria-label="Fermer"
                className="-mr-[9px] w-9 h-9 shrink-0 flex items-center justify-center
                           rounded-full text-sombre-texte-doux
                           hover:text-sombre-texte hover:bg-sombre-eleve
                           transition-colors"
              >
                <IconeCroix taille={18} />
              </button>
            </div>
            <ListeDesLangues surChoix={surFermeture} />
          </div>
        </MenuDeVerre>
      )}

      {/*  LE DOIGT — la page plein écran (§4, nº 465) : le globe au
           rang 22 en blanc (l'écriture de la loupe du titre de la
           recherche), les deux encadrés dessous.
           §1 (nº 655) — LES AIRS SONT CEUX DE « MON COMPTE » SUR CET
           APPAREIL, et pas d'autres : `px-4` sur les côtés, `pt-5` en
           haut, `gap-3` entre les boîtes (les réglages du doigt, chez
           MenuEspace).
           ⚠️ LA RÉSERVE BASSE PASSE À 72 px, ET C'EST LE PRIX DES
           ENCADRÉS : la barre du bas de Safari est TRANSLUCIDE — tant
           que cet écran montrait une liste sur le fond de page, elle ne
           laissait voir que du bleu nuit ; elle montrerait désormais le
           GRIS d'un encadré. C'est exactement le défaut de la nº 533-§6
           et son remède, repris au caractère. */}
      <PagePleinEcranMobile
        titre="Langue"
        icone={<IconeMonde taille={22} classe="shrink-0 text-white" />}
        ariaLabel="Choisir la langue"
        surFermer={surFermeture}
        classeCadre="z-[85]"
      >
        <div
          ref={plaque}
          className="grow flex flex-col gap-3 px-4 pt-5
                     pb-[max(4.5rem,env(safe-area-inset-bottom))]"
        >
          <ListeDesLangues surChoix={surFermeture} />
        </div>
      </PagePleinEcranMobile>
    </>
  );
}

/**
 * LA LIGNE « LANGUE » DU MENU « MON COMPTE ».
 * Elle ne porte AUCUNE fenêtre : elle prévient, son parent ferme et
 * ouvre (nº 238-§5). La classe lui est passée — c'est celle de toutes
 * les lignes du menu (nº 237-§2), écrite à un seul endroit.
 */
export function EntreeLangue({
  classe,
  surOuvrir,
  boite = "flex w-[22px] shrink-0 justify-center",
  taille = 22,
}: {
  classe: string;
  surOuvrir: () => void;
  /** §3 (nº 533) — LA BOÎTE ET LA TAILLE DE L'ICÔNE, RÉGLABLES. Cette
      ligne vit au milieu de cinq autres, dans un menu qui les rend
      toutes de la même main : quand elles grandissent, le globe doit
      grandir avec elles. Les DÉFAUTS sont les valeurs de toujours —
      qui ne passe rien ne voit rien changer. */
  boite?: string;
  taille?: number;
}) {
  const langueActive = langueDuJour();
  return (
    <button
      type="button"
      onClick={surOuvrir}
      aria-haspopup="dialog"
      className={classe}
    >
      <span className={`${boite} text-sombre-texte/80`}>
        <IconeMonde taille={taille} />
      </span>
      <span className="flex-1 truncate">Langue</span>
      {/*  §2 (nº 549) — LE NOM EN TOUTES LETTRES, PLUS LE CODE.
           D'OÙ IL VIENT : de `LANGUES_YOKOFOLIO` (config/tatouage), la
           liste unique des langues — c'est le MÊME `label` que l'écran
           « Langue » affiche dans sa liste (`ListeDesLangues`, plus
           haut dans ce fichier). Rien n'est écrit de neuf : « English »,
           « Español », « Deutsch », « Français », « Italiano »,
           « Português », « 日本語 » — les sept y sont déjà, et la ligne
           les suivra toutes sans qu'on y revienne.
           LES CAPITALES PARTENT AVEC LE CODE : elles étaient là pour
           « EN », un sigle. Un nom propre de langue s'écrit comme il se
           lit — et « Español » en capitales perdrait son accent à
           l'œil.
           ⚠️ ET IL NE POUSSE PAS LE LIBELLÉ : le nom ne peut pas
           grandir (`shrink-0` le tient à sa taille), et c'est « Langue »
           qui cède le premier si la place venait à manquer — il porte
           `flex-1` et, désormais, la coupure propre. Le plus long des
           sept (« Português », dix signes à 12,5 px ≈ 68 px) tient
           largement dans les 290 px de la fenêtre. */}
      <span className="shrink-0 text-[12.5px] font-medium tracking-wide text-sombre-texte-doux">
        {langueActive.label}
      </span>
    </button>
  );
}

/** LE GLOBE DE LA BARRE FIXE (visiteur non connecté). */
export function SelecteurLangue({ hauteur = 40 }: { hauteur?: number }) {
  const [ouvert, setOuvert] = useState(false);
  /** L'habillage choisi AU CLIC : superposée (vrai mobile), ou le menu
      de verre ancré sous le globe (web). */
  const [superposee, setSuperposee] = useState(false);
  const globe = useRef<HTMLButtonElement>(null);
  const plaque = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const langueActive = langueDuJour();

  function ouvrir() {
    setSuperposee(document.documentElement.dataset.appareil === "mobile");
    setOuvert(true);
  }

  function fermer() {
    setOuvert(false);
    globe.current?.focus();
  }

  /**
   * §2-a (nº 311) — LA PAGE S'ASSOMBRIT DERRIÈRE LE MENU DU GLOBE.
   * ------------------------------------------------------------------
   * C'ÉTAIT LA SIXIÈME SURFACE, ET ELLE AVAIT ÉTÉ OUBLIÉE. La nº 294 a
   * posé un voile qui recouvre TOUT l'écran, barre comprise, d'une
   * seule couleur, en n'épargnant que le bloc qui a ouvert la surface —
   * et cinq surfaces le consomment déjà (le menu des styles, le champ
   * de localité, le panneau des filtres, « Mon compte », le menu du
   * moteur). Le globe, non : sa fenêtre s'ouvrait sur une page qui ne
   * bougeait pas.
   * ⚠️ C'EST LE MÊME MÉCANISME, PAS UN SECOND : `useVoileDeLaPage`,
   * l'écriture unique (components/VoileDeLaPage). On lui donne notre
   * conteneur ; il remonte tout seul au premier encadré qui le
   * contient, pose le voile et l'enlève. Rien n'est recopié ici — ni
   * couleur, ni opacité, ni z-index.
   * ⚠️ LE WEB SEULEMENT, et sur deux niveaux : le crochet sort de
   * lui-même sur un vrai téléphone, et `!superposee` dit la même chose
   * côté rendu — la fenêtre superposée du doigt porte DÉJÀ son propre
   * voile (FenetreDeVerre), en poser un second l'assombrirait deux
   * fois.
   */
  useVoileDeLaPage(ouvert && !superposee, zone);

  //  Le menu du web : Échap et clic ailleurs referment.
  //  ⚠️ LA PLAQUE EST DANS LE CORPS DU DOCUMENT (nº 238-§4) : sans le
  //  test qui la nomme, choisir une langue refermerait avant le clic.
  useEffect(() => {
    if (!ouvert || superposee) return;
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") fermer();
    }
    function auPointeur(evenement: MouseEvent) {
      const cible = evenement.target as Node;
      if (plaque.current?.contains(cible)) return;
      if (!zone.current?.contains(cible)) setOuvert(false);
    }
    document.addEventListener("keydown", auClavier);
    document.addEventListener("mousedown", auPointeur);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("mousedown", auPointeur);
    };
  }, [ouvert, superposee]);

  return (
    <div ref={zone} className="relative shrink-0">
      <button
        ref={globe}
        type="button"
        onClick={ouvrir}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={`Langue : ${langueActive.label}`}
        title={`Langue : ${langueActive.label}`}
        // MÊME HAUTEUR que le bouton rose à sa droite : la barre garde
        // une seule ligne d'appui, sans décalage d'un pixel.
        style={{ height: hauteur, width: hauteur }}
        //  ⚠️ PLUS DE ROSE OUVERT (nº 144-§2) : le rose est réservé
        //  aux accents forts, et une fenêtre ouverte n'en est pas
        //  un. Ouvert, le FOND S'ÉCLAIRCIT — le même traitement que
        //  le bouton de filtres — et le globe reste blanc.
        /*  ██ §2 (nº 507) — LE GLOBE REJOINT L'ÉCRITURE DE LA BARRE ██
             Il avait la sienne : `hover:bg-sombre-eleve` posé à la
             main, sans état ENFONCÉ — sous le doigt, le globe était la
             seule icône de la barre à ne rien répondre. Il prend donc
             `ETATS_ROND_BARRE` (Icones.tsx), la constante que portent
             déjà la loupe, le fanion, le compte et le bouton de
             filtres : même cercle gris au survol, LE MÊME sous le
             doigt. La couleur ne change pas d'un cran — cette
             constante EST `hover:bg-sombre-eleve` depuis que le rose
             en est retiré (nº 507-§2) —, seul l'état enfoncé s'ajoute.
             ⚠️ LA BRANCHE « OUVERT » NE BOUGE PAS, et elle reste
             EXCLUSIVE : un seul fond peint à la fois (règle nº 389). */
        className={`shrink-0 flex items-center justify-center rounded-full
                   transition-colors text-sombre-texte
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire ${
                     ouvert ? "bg-sombre-eleve-clair" : ETATS_ROND_BARRE
                   }`}
      >
        {/* LE GLOBE DESSINÉ — celui du code, en `currentColor`.
            ⚠️ CE N'EST PAS `icone-world.png`. Une passe l'avait
            remplacé ici ; l'image du propriétaire ne sert QU'AU lien
            « Site internet ou Linktree » de la fiche publique.
            RANG 24 (nº 147-§6) : les icônes de la BARRE — globe,
            fanion, compte — montent de 22 à 24 ; l'entrée « Langue »
            de la fenêtre « Mon compte », elle, garde son 22. */}
        <IconeMonde taille={28} classe="mobile:h-6 mobile:w-6" />
      </button>

      {/* ---- LE MENU SOUS LA BARRE (web) ----
          DANS LE CORPS DU DOCUMENT (nº 238-§4) : la barre fixe portait
          son propre flou, donc une racine d'arrière-plan — un enfant
          n'y flouterait que l'intérieur de la barre. (Ce flou a été
          retiré à la nº 541 ; le portail, lui, reste indispensable pour
          que la barre ne découpe pas le menu.)
          ██ §2 (nº 543) — LA CINQUIÈME SURFACE, ET JE LA SIGNALE ██
          Le propriétaire n'en a nommé QUE QUATRE, et celle-ci n'en
          était pas : c'est le menu du globe, celui du VISITEUR NON
          CONNECTÉ. Il m'a laissé le choix de la faire suivre. Elle
          suit, et voici pourquoi : elle montre EXACTEMENT la même
          liste de langues que la fenêtre du §1, au web, dans un menu
          ancré sous un bouton de la même barre. Les laisser diverger
          donnerait deux menus de langue d'apparence différente selon
          qu'on est connecté ou non. Et le verre servait ici à tenir
          au-dessus des photos claires de la mosaïque (nº 238-§6) —
          un aplat opaque le fait mieux, pas moins bien.
          ⚠️ UN SEUL MOT, ET IL SE RETIRE AUSSI VITE : ni sa place, ni
          sa largeur, ni son alignement ne changent. */}
      {ouvert && !superposee && (
        <MenuDeVerre
          ouvert={ouvert}
          ancre={globe}
          refPanneau={plaque}
          largeur={290}
          //  §1 (nº 650) — le même décalage que « Mon compte », pour la
          //  même raison : ce globe est un bouton rond de 40 px, quand
          //  les champs du moteur en font 46. Voir la note complète
          //  chez MenuEspace, et la valeur dans placement-menu.
          decalageHaut={ALIGNEMENT_BOUTON_ROND_BARRE}
          opaque
          alignement="droite"
          role="dialog"
          aria-label="Choisir la langue"
          data-source-composant="SelecteurLangue · menu web"
          /*  §1 (nº 655) — `flex flex-col gap-3` S'AJOUTE, et rien
               d'autre : la liste rend désormais DEUX encadrés au lieu
               d'une liste plate, il leur faut l'écart de 12 px des
               boîtes de « Mon compte ».
               §3 (nº 658) — LE REMBOURRAGE PASSE DE 8 À 12 px, et c'est
               le titre qui l'appelle : un mot à 17 px collé à 8 px du
               bord se lirait comme un débordement. La largeur de 290 px,
               elle, ne bouge toujours pas — ce menu-ci n'a jamais été
               visé par les consignes de largeur. */
          className="flex flex-col gap-3 p-3"
        >
          {/*  ██ §3 (nº 658) — LE TITRE ET SON GLOBE, ICI AUSSI ██
               Le propriétaire les veut sur les DEUX menus de langue :
               celui du compte (plus haut dans ce fichier) et celui-ci,
               le menu du VISITEUR NON CONNECTÉ. C'est la même rangée,
               au caractère — même globe au rang 20 en blanc à 80 %,
               même mot à 17 px gras, même écart de 10 px.
               ⚠️ PAS DE CROIX ICI, et ce n'est pas un oubli : ce menu
               n'en a jamais eu. Il se referme par Échap, par un clic à
               côté ou par un choix — lui en poser une maintenant serait
               un changement que personne n'a demandé.
               ⚠️ NI `mb-2` NON PLUS : là-bas il rattrapait l'air du
               haut d'une colonne à 20 px ; ici la colonne en a 12, et
               le `gap-3` suffit à l'égaler. */}
          <div className="flex items-center gap-2.5">
            <IconeMonde taille={20} classe="shrink-0 text-sombre-texte/80" />
            <h2 className="min-w-0 flex-1 text-[17px] font-bold tracking-tight text-sombre-texte">
              Langue
            </h2>
          </div>
          <ListeDesLangues surChoix={fermer} />
        </MenuDeVerre>
      )}

      {/* ---- LA FENÊTRE SUPERPOSÉE (vrai mobile) ---- */}
      {ouvert && superposee && <FenetreLangue surFermeture={fermer} />}
    </div>
  );
}
