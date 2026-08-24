"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUES_YOKOFOLIO } from "@/config/tatouage";
import { ETATS_ROND_BARRE, IconeCroix, IconeMonde } from "@/components/Icones";
import { FenetreDeVerre, MenuDeVerre } from "@/components/SurfaceDeVerre";
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
 * · `FenetreLangue` — la fenêtre superposée, montée par son APPELANT,
 *   donc survivant à la fermeture du menu. UNE seule écriture pour les
 *   deux appareils : c'est le défaut relevé par le propriétaire (la
 *   fenêtre des langues n'était en verre NI sur web NI sur mobile,
 *   alors que l'inventaire de la nº 236 l'annonçait convertie — elle
 *   n'avait tout simplement jamais été touchée).
 * · `SelecteurLangue` — le globe de la barre : la même fenêtre sur
 *   mobile, un MENU DE VERRE ancré sous lui sur le web.
 *
 * ⚠️ RIEN N'EST BRANCHÉ, ET C'EST VOULU. Seul le français est actif ;
 * les autres langues sont grisées et NON CLIQUABLES (`disabled`, et
 * `aria-disabled` pour les lecteurs d'écran) avec la mention
 * « bientôt » — c'est elle qui explique, plus aucune phrase
 * au-dessus de la liste. La structure est prête : voir
 * LANGUES_YOKOFOLIO dans src/config/tatouage.ts.
 *
 * QUEL HABILLAGE POUR QUEL APPAREIL : la détection C1
 * (`dataset.appareil`), jamais la largeur de fenêtre — un iPhone
 * tourné reste un téléphone. La question ne se pose qu'au clic
 * d'ouverture, côté navigateur : aucune discordance d'hydratation.
 *
 * FERMETURE : Échap partout ; un clic hors du menu (web) ; le voile ou
 * la croix (superposée).
 */

function langueDuJour() {
  return LANGUES_YOKOFOLIO.find((langue) => langue.actif) ?? LANGUES_YOKOFOLIO[0];
}

/** LA LISTE — écrite UNE fois, posée dans les deux habillages. */
function ListeDesLangues({ surChoix }: { surChoix: () => void }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {LANGUES_YOKOFOLIO.map((langue) => (
        <li key={langue.code}>
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
      ))}
    </ul>
  );
}

/**
 * LA FENÊTRE SUPERPOSÉE DES LANGUES — en VERRE (nº 238-§4).
 * Voile à 25 %, plaque sans la moindre opacité partielle, montée dans
 * le corps du document : les trois règles de `SurfaceDeVerre`, sans
 * une valeur recopiée.
 * ⚠️ `z-[85]` : elle s'ouvre depuis « Mon compte », elle passe donc
 * au-dessus de lui — même si, depuis le §5, le menu se referme.
 */
export function FenetreLangue({ surFermeture }: { surFermeture: () => void }) {
  const plaque = useRef<HTMLDivElement>(null);
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

  //  Le focus ENTRE dans la fenêtre et y TOURNE EN ROND : sans ça, la
  //  tabulation partirait à l'aveugle dans la page derrière.
  useEffect(() => {
    const boite = plaque.current;
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
  }, []);

  return (
    <>
      {/*  LE WEB — la fenêtre de verre, inchangée (cachée au doigt). */}
      <FenetreDeVerre
        ariaLabel="Choisir la langue"
        //  §3 (nº 240) — 45 % : elle s'ouvre au-dessus de la mosaïque,
        //  et les cartes de flashs sont souvent blanches. §1 (nº 543) —
        //  ce réglage est devenu sans objet, la fenêtre n'étant plus en
        //  verre ; il reste écrit pour le jour où l'on y reviendrait.
        dense
        //  §1 (nº 543) — FOND OPAQUE au jeton `carte`, comme « Mon
        //  compte » depuis la nº 542. NI SA PLACE NI SA TAILLE NE
        //  CHANGENT : le cadre, la largeur et le rembourrage
        //  ci-dessous sont ceux d'avant, au caractère près.
        opaque
        surFermeture={surFermeture}
        largeur="max-w-[320px]"
        rembourrage="p-0"
        classeCadre="px-8 py-6 z-[85] mobile:hidden"
        classePlaque="max-h-[min(88dvh,640px)] flex flex-col overflow-hidden"
      >
        {/*  La ref du piège de focus suit l'habillage VISIBLE : la
             fenêtre au web, la page au doigt (juste en dessous). */}
        <div ref={auDoigt ? undefined : plaque} className="flex min-h-0 flex-col">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
            <h2 className="flex-1 min-w-0 text-[17px] font-bold tracking-tight text-sombre-texte">
              Langue
            </h2>
            <button
              type="button"
              onClick={surFermeture}
              aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                         text-sombre-texte-doux transition-colors hover:text-sombre-texte"
            >
              <IconeCroix taille={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <ListeDesLangues surChoix={surFermeture} />
          </div>
        </div>
      </FenetreDeVerre>

      {/*  LE DOIGT — la page plein écran (§4, nº 465) : le globe au
           rang 22 en blanc (l'écriture de la loupe du titre de la
           recherche), la liste telle quelle dessous — les mêmes
           rembourrages que dans la fenêtre. */}
      <PagePleinEcranMobile
        titre="Langue"
        icone={<IconeMonde taille={22} classe="shrink-0 text-white" />}
        ariaLabel="Choisir la langue"
        surFermer={surFermeture}
        classeCadre="z-[85]"
      >
        <div
          ref={auDoigt ? plaque : undefined}
          className="grow px-2 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
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
          opaque
          alignement="droite"
          role="dialog"
          aria-label="Choisir la langue"
          data-source-composant="SelecteurLangue · menu web"
          className="px-2 py-2"
        >
          <ListeDesLangues surChoix={fermer} />
        </MenuDeVerre>
      )}

      {/* ---- LA FENÊTRE SUPERPOSÉE (vrai mobile) ---- */}
      {ouvert && superposee && <FenetreLangue surFermeture={fermer} />}
    </div>
  );
}
