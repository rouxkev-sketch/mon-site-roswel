"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconeBouclierTrait,
  IconeChevronBas,
  IconeCloche,
  IconeFanion,
  IconePlus,
  IconeReglages,
  IconeSilhouette,
  IconeSortie,
  IconeUtilisateur,
} from "@/components/Icones";
import { EntreeLangue, FenetreLangue } from "@/components/SelecteurLangue";
import { FenetreNotifications } from "@/components/FenetreNotifications";
import { MenuDeVerre } from "@/components/SurfaceDeVerre";
import { FenetreNonEnregistre } from "@/components/GardeSaisie";
import {
  COULEUR_ETAT,
  LIBELLE_ETAT,
  chargerFichesDuCompte,
  etatDeLaFiche,
  ficheActive,
  memoriserFiche,
  type EtatFiche,
  type FicheDuCompte,
} from "@/lib/fiches-compte";
import type { Notification } from "@/lib/notifications";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { travailEnCours } from "@/lib/travail-en-cours";

/**
 * LE MENU « MON ESPACE » — le compte du tatoueur, depuis la barre
 * ================================================================
 * Connecté, le bouton de compte n'emmène plus nulle part : il OUVRE ce
 * menu. Un compte pouvant désormais gérer PLUSIEURS FICHES, le menu se
 * lit en deux temps — ce qui appartient au COMPTE, et ce qui
 * appartient à LA FICHE CHOISIE :
 *
 *   1. NOTIFICATIONS — la cloche, et le nombre de non lues posé à
 *      côté du titre en pastille discrète (jamais un gros compteur).
 *
 *   2. AJOUTER UN PORTFOLIO — une entrée du MENU, et la SEULE.
 *      Elle vivait AUSSI en pied du déroulant : deux chemins pour la
 *      même action, dans deux vocabulaires (une entrée grise en haut,
 *      un bouton vert en bas). Créer un portfolio relève du COMPTE,
 *      pas du portfolio qu'on regarde : sa place est ici.
 *
 *   ▓ LE BLOC DU PORTFOLIO — un fond un cran plus clair, d'un bord
 *   ▓ à l'autre de la fenêtre, SANS aucun cadre dessiné :
 *   ▓   3. LE SÉLECTEUR — le portfolio courant, son ÉTAT en deuxième
 *   ▓      ligne (une pastille de 6 px et un mot), et un VRAI menu
 *   ▓      déroulant qui se pose PAR-DESSUS le reste.
 *   ▓      ⚠️ CHAQUE ENTRÉE DE LA LISTE EST COMPOSÉE COMME CELLE-CI :
 *   ▓      le nom, puis la pastille et l'état SOUS le nom. Une liste
 *   ▓      qui ne ressemble pas à son champ oblige à relire.
 *   ▓   4. MODIFICATION
 *   ▓   5. MON PORTFOLIO
 *
 *   6. SÉCURITÉ
 *   7. DÉCONNEXION — SANS changer de page : la session s'efface, et
 *      c'est la page elle-même qui réagit.
 *
 * POURQUOI CE FOND, ET PAS UN CADRE : tout ce qu'il couvre dépend de
 * la fiche choisie en tête ; ce qui est au-dessus et en dessous
 * concerne le compte entier. Une nuance de fond dit cela sans ajouter
 * une boîte dans une boîte — et elle va d'un bord à l'autre, ce qu'un
 * cadre arrondi ne sait pas faire.
 *
 * DEUX HABILLAGES, UN PAR APPAREIL :
 *  - WEB : la fenêtre posée SOUS le bouton de compte, au format exact
 *    du panneau des filtres (même encadré, même ombre) ;
 *  - SMARTPHONE : une fenêtre CENTRÉE, derrière un voile sombre, plus
 *    étroite que celle du moteur. Elle est POSÉE DANS <body>
 *    (createPortal) : le flou d'arrière-plan de la barre fixe ferait
 *    sinon d'elle le repère des éléments « fixes ».
 */

export function MenuEspace({
  idUtilisateur,
  nom,
  hauteur,
}: {
  idUtilisateur: string;
  /** Le nom du compte (info-bulle du déclencheur). */
  nom: string;
  /** La hauteur des boutons de la barre (alignement au pixel). */
  hauteur: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  /*  ⚠️ PLUS DE REPÈRE « NON PUBLIQUE » DANS LE MENU (passe nº 133).
      Il ne disait rien à personne d'autre qu'à l'administrateur, et il
      encombrait deux lignes du sélecteur — celle du portfolio choisi
      ET chacune de la liste. L'information n'est pas perdue : elle vit
      dans /admin, section des fiches d'essai, avec son interrupteur.
      C'est là qu'on la règle ; c'est donc là qu'on la lit. */
  /** TOUTES les fiches du compte, et celle sur laquelle on travaille. */
  const [fiches, setFiches] = useState<FicheDuCompte[]>([]);
  const [idFiche, setIdFiche] = useState<string | null>(null);
  const [selecteurOuvert, setSelecteurOuvert] = useState(false);
  /** Les nouvelles du compte, et leur fenêtre. */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOuvertes, setNotificationsOuvertes] = useState(false);
  /** La fenêtre des langues (nº 238-§5) : montée par le MENU, pas par
      sa ligne — elle survit donc à la fermeture du menu. */
  const [langueOuverte, setLangueOuverte] = useState(false);
  /** L'avertissement « tu as une saisie en cours » — voir plus bas. */
  const [avertirAvantCreation, setAvertirAvantCreation] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  /** La plaque du menu web — montée dans le corps du document
      (nº 238-§4) : la fermeture au clic dehors doit la connaître.
      ⚠️ L'ANCRE DU MENU EST `zone`, PAS UN DES DEUX BOUTONS : il y en a
      deux (écran étroit / large) et l'un des deux est toujours
      `display: none`, donc sans boîte à mesurer. La zone, elle, a
      toujours celle du bouton visible. */
  const plaqueWeb = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fiche = ficheActive(fiches, idFiche);
  const etat: EtatFiche = etatDeLaFiche(fiche);
  const nonLues = notifications.filter((n) => !n.lue_le).length;

  /** L'adresse d'une entrée qui travaille sur LA fiche choisie : elle
      emporte son identifiant, pour que le formulaire et l'aperçu
      ouvrent la bonne — même après un rechargement complet. */
  const versFiche = useCallback(
    (suffixe = "") => {
      const base = "/devenir-tatoueur/fiche";
      const params = [fiche ? `fiche=${fiche.id}` : "", suffixe]
        .filter(Boolean)
        .join("&");
      return params ? `${base}?${params}` : base;
    },
    [fiche]
  );

  /** LES FICHES ET LES NOUVELLES — une lecture, les deux ensemble.
      ⚠️ ELLE N'EST JAMAIS LANCÉE AU MONTAGE, et ce n'est pas un
      oubli : une lecture authentifiée sur CHAQUE page, pour un menu
      que la plupart des visites n'ouvrent jamais, coûte une requête à
      chaque affichage — et fait rejouer la session du client Supabase
      hors de tout geste (mesuré : la liste des favoris s'en trouvait
      perdue). On lit quand on ouvre, et seulement là. */
  const lireLeCompte = useCallback(async () => {
    try {
      const supabase = creerClientSupabaseNavigateur();
      const liste = await chargerFichesDuCompte(supabase, idUtilisateur);
      setFiches(liste);
      // On recale le choix : la fiche mémorisée peut avoir disparu.
      setIdFiche((courant) => ficheActive(liste, courant)?.id ?? null);
    } catch {
      //  ⚠️ ON NE VIDE PAS LA LISTE (passe nº 142). Une lecture qui
      //  échoue — réseau coupé le temps d'un geste — faisait
      //  disparaître le bloc du portfolio d'un menu déjà ouvert. On
      //  garde ce qu'on montrait : seule une lecture RÉUSSIE change
      //  ce qui est à l'écran.
    }
    try {
      const reponse = await fetch("/api/tatoueur/notifications");
      const donnees = (await reponse.json().catch(() => null)) as {
        notifications?: Notification[];
      } | null;
      setNotifications(donnees?.notifications ?? []);
    } catch {
      // Pas de nouvelles : le menu vit très bien sans.
    }
  }, [idUtilisateur]);

  /**
   * OUVRIR — ET N'OUVRIR QU'UNE FOIS LE CONTENU PRÊT (passe nº 142)
   * ================================================================
   * La fenêtre s'affichait EN DEUX TEMPS : ses quatre entrées de base
   * d'abord, puis — la lecture revenue — le sélecteur de portfolios,
   * « Modification » et « Mon portfolio » qui s'insèrent et poussent
   * tout le reste vers le bas. Sur smartphone, où la fenêtre occupe
   * l'écran, le saut se voit en entier.
   *
   * LE REMÈDE N'EST NI UN SQUELETTE NI UNE RÉSERVE DE PLACE : on
   * n'ouvre pas une fenêtre à moitié. La PREMIÈRE ouverture attend sa
   * lecture — le temps d'un aller-retour —, puis la fenêtre paraît
   * COMPLÈTE, d'un seul coup. Les suivantes sont immédiates : ce
   * qu'on sait déjà s'affiche tel quel, pendant qu'une relecture
   * silencieuse le remet à jour derrière.
   */
  const dejaLu = useRef(false);

  const basculerLeMenu = useCallback(() => {
    if (ouvert) {
      setOuvert(false);
      return;
    }
    if (dejaLu.current) {
      //  On sait déjà : la fenêtre s'ouvre tout de suite, et se remet
      //  à jour derrière sans jamais se vider.
      setOuvert(true);
      void lireLeCompte();
      return;
    }
    void (async () => {
      await lireLeCompte();
      dejaLu.current = true;
      setOuvert(true);
    })();
  }, [ouvert, lireLeCompte]);

  /** Choisir une fiche : on la retient pour la prochaine fois. */
  function choisirFiche(id: string) {
    setIdFiche(id);
    memoriserFiche(id);
    setSelecteurOuvert(false);
  }

  /** L'adresse d'une création — la même depuis les deux entrées. */
  const ADRESSE_NOUVELLE = "/devenir-tatoueur/fiche?fiche=nouvelle";

  /** ALLER CRÉER UNE FICHE, pour de bon.
      DEUX CAS, ET IL FAUT LES DEUX :
       · on est ailleurs → on navigue, et la CLÉ REACT de l'enveloppe
         (EspaceFiche) change : le formulaire est démonté puis remonté,
         donc vierge ;
       · on est DÉJÀ sur `?fiche=nouvelle` → naviguer vers la même
         adresse ne déclenche rien du tout. On envoie alors
         l'événement que l'enveloppe attend : même remontage, même
         formulaire neuf. Sans ce cas, cliquer deux fois de suite
         « Ajouter un portfolio » laissait la première saisie à l'écran. */
  function allerCreerUneFiche() {
    setOuvert(false);
    setSelecteurOuvert(false);
    setAvertirAvantCreation(false);
    const ici = `${window.location.pathname}${window.location.search}`;
    if (ici === ADRESSE_NOUVELLE) {
      window.dispatchEvent(new Event("yokofolio-fiche-neuve"));
      return;
    }
    router.push(ADRESSE_NOUVELLE);
  }

  /** LE GESTE DU MENU — il commence par regarder si l'on a quelque
      chose à perdre. Un formulaire à moitié rempli qui s'efface sans
      un mot est la façon la plus sûre de faire recommencer quelqu'un
      qui n'a rien demandé. */
  function demanderUneNouvelleFiche() {
    if (travailEnCours()) {
      setOuvert(false);
      setSelecteurOuvert(false);
      setAvertirAvantCreation(true);
      return;
    }
    allerCreerUneFiche();
  }

  // Échap ferme toujours. UN CLIC EXTÉRIEUR ferme aussi — mais SUR LE
  // WEB SEULEMENT : sur smartphone, la fenêtre est CENTRÉE et posée
  // dans <body>, donc « hors de la zone » ; fermer au mousedown
  // emporterait le menu avant que le tap n'atteigne l'entrée
  // choisie. C'est le VOILE qui ferme là-bas, au relâchement.
  // Et, comme pour la fenêtre du moteur, la page ne défile plus
  // derrière tant que la fenêtre mobile est ouverte.
  useEffect(() => {
    if (!ouvert) return;
    const surMobile = document.documentElement.dataset.appareil === "mobile";
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuvert(false);
    }
    function auPointeur(evenement: MouseEvent) {
      if (surMobile) return;
      const cible = evenement.target as Node;
      //  ⚠️ LA PLAQUE DU WEB EST DANS LE CORPS DU DOCUMENT (nº 238-§4) :
      //  sans ce test, le premier clic dans le menu le refermait.
      if (plaqueWeb.current?.contains(cible)) return;
      if (!zone.current?.contains(cible)) setOuvert(false);
    }
    const defilementAvant = document.body.style.overflow;
    if (surMobile) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", auClavier);
    document.addEventListener("mousedown", auPointeur);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("mousedown", auPointeur);
      if (surMobile) document.body.style.overflow = defilementAvant;
    };
  }, [ouvert]);

  /* Échap referme l'avertissement — c'est la fenêtre partagée
     (FenetreNonEnregistre) qui s'en charge elle-même. */

  /** DÉCONNEXION SANS REDIRECTION FORCÉE : la session s'efface, la
      page réagit d'elle-même.
      ⚠️ CE QUE ÇA DONNE DEPUIS LA PASSE Nº 133 : les pages du compte
      (formulaire de portfolio, Sécurité) MÈNENT DROIT à la page de
      connexion — l'écran « Connecte-toi d'abord » qui s'y affichait
      n'existe plus. Les pages publiques, elles, continuent comme si
      de rien n'était : la barre repasse simplement aux boutons de
      visiteur. Rien n'arrache le lecteur à ce qu'il regardait. */
  function deconnecter() {
    setOuvert(false);
    creerClientSupabaseNavigateur()
      .auth.signOut()
      .catch(() => {
        // Serveur injoignable : la session locale est déjà effacée.
      });
  }

  /** UNE ENTRÉE DU MENU — icône, libellé, action. LES QUATRE ENTRÉES
      SONT RIGOUREUSEMENT IDENTIQUES : même taille de texte, même
      hauteur, et surtout une icône enfermée dans une BOÎTE DE LARGEUR
      FIXE. Sans cette boîte, chaque dessin d'icône a sa propre largeur
      et les libellés partent d'un pixel différent — c'est ce qui
      faisait « bouger » Modification et Ma fiche par rapport à
      Sécurité et Déconnexion. */
  //  §2 (nº 237) — L'ÉTAT DE LA LIGNE EST UN VOILE TRANSLUCIDE, plus
  //  jamais un aplat : le fond s'éclaircit comme sur les lignes
  //  cliquables des fiches (nº 229), la couleur du texte ne change
  //  jamais, aucun rose. La fenêtre est en verre depuis la nº 236 :
  //  un aplat opaque y faisait une boîte posée sur la plaque.
  //  AU DOIGT : l'état ENFONCÉ (`active:`) — il apparaît sous le doigt
  //  et repart au relâchement, il ne reste jamais (le `hover:` de
  //  Tailwind v4 ne s'applique qu'aux appareils qui survolent).
  //  MÊME GÉOMÉTRIE des deux côtés : la classe est unique, la hauteur
  //  (46 px), le rayon (`rounded-xl`) et le retrait (`px-3`) aussi.
  const classeEntree =
    "flex w-full items-center gap-3 rounded-xl px-3 min-h-[46px] text-left " +
    "text-[14.5px] font-semibold text-sombre-texte " +
    "hover:bg-white/5 active:bg-white/10 transition-colors";
  // LES ICÔNES SORTENT DU GRIS DOUX : à 22 px, sur fond anthracite,
  // elles se devinaient plus qu'elles ne se lisaient. Elles prennent
  // la couleur du texte, à 80 % — présentes, jamais criardes.
  const boiteIcone =
    "flex w-[22px] shrink-0 justify-center text-sombre-texte/80";

  /** LE CONTENU DU MENU — le même sur les deux appareils ; seul
      l'habillage change (fenêtre sous le bouton / fenêtre centrée). */
  const contenuMenu = (
    <div className="py-2 flex flex-col gap-1">
      {/* ---------- 1. LES NOTIFICATIONS — hors du bloc de la fiche :
          elles concernent le COMPTE. Le nombre de non lues se pose à
          CÔTÉ du titre, en pastille discrète. ---------- */}
      <div className="px-2">
        <button
          type="button"
          onClick={() => {
            setSelecteurOuvert(false);
            //  §5 (nº 238) — UNE SEULE SURFACE FLOTTANTE À LA FOIS :
            //  ouvrir les notifications FERME « Mon compte ». Les deux
            //  restaient superposées, et la fenêtre du dessous se
            //  voyait par transparence à travers celle du dessus.
            //  La fermer, elle, rend la page : elle ne rouvre rien.
            setOuvert(false);
            setNotificationsOuvertes(true);
          }}
          className={classeEntree}
        >
          <span className={boiteIcone}>
            <IconeCloche taille={22} />
          </span>
          <span className="flex-1">Notifications</span>
          {nonLues > 0 && (
            <span
              aria-label={`${nonLues} non lue${nonLues > 1 ? "s" : ""}`}
              className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primaire
                         text-[11.5px] font-bold text-white leading-5 text-center"
            >
              {nonLues > 99 ? "99+" : nonLues}
            </span>
          )}
        </button>

        {/* ---------- 2. MA SÉLECTION (passe nº 137, renommée à la
            nº 145-§3) — SOUS Notifications.
            L'entrée du compte ouvert à tous : les photos gardées et
            les tatoueurs suivis. Elle vient AVANT « Ajouter un
            portfolio », parce qu'elle concerne tout le monde quand la
            suivante ne concerne que ceux qui veulent se montrer.
            ⚠️ LE FANION, ET PLUS LE CŒUR : ici l'icône désigne un
            ENDROIT — la pochette où l'on range — quand le cœur des
            photos désigne un GESTE. Le cœur, lui, ne bouge pas des
            cartes ni des fiches. Taille et graisse inchangées. */}
        <Link
          href="/mes-favoris"
          onClick={() => setOuvert(false)}
          className={classeEntree}
        >
          <span className={boiteIcone}>
            <IconeFanion taille={22} />
          </span>
          <span className="flex-1">Ma sélection</span>
        </Link>

        {/* ---------- 3. AJOUTER UN PORTFOLIO — une entrée du MENU, et
            la SEULE : elle a disparu du pied du déroulant. Créer une fiche relève du
            COMPTE, pas de la fiche qu'on regarde : sa place est ici,
            juste sous « Notifications ».
            AUCUNE COULEUR PARTICULIÈRE : même libellé, même graisse,
            même taille et même gris d'icône que « Notifications ». Le
            vert du pied de liste disait « attention, création » là où
            il ne s'agit que d'une entrée de menu de plus. ---------- */}
        {/* UN BOUTON, PLUS UN LIEN. Un lien vers la même page ne
            faisait que changer les paramètres d'adresse : le
            formulaire déjà à l'écran restait en place, avec les
            données de la fiche précédente. Le bouton, lui, sait
            reconnaître le cas « on y est déjà » — et surtout, il
            demande d'abord si une saisie est en cours. */}
        <button
          type="button"
          onClick={demanderUneNouvelleFiche}
          className={classeEntree}
        >
          <span className={boiteIcone}>
            <IconePlus taille={22} />
          </span>
          <span className="flex-1">Ajouter un portfolio</span>
        </button>
      </div>

      {/* ---------- LE BLOC DE LA FICHE CHOISIE ----------
          PAS D'ENCADRÉ : un simple FOND un cran plus clair que celui
          de la fenêtre, D'UN BORD À L'AUTRE. Un cadre dessiné faisait
          une boîte dans une boîte ; une nuance de fond dit la même
          chose sans rien ajouter au dessin — c'est ce que font les
          menus de compte d'aujourd'hui.
          Tout ce qui est ici dépend de la fiche choisie en tête. */}
      {/*  ⚠️ TOUT CE BLOC DISPARAÎT TANT QU'AUCUN PORTFOLIO N'A ÉTÉ
           ENVOYÉ (passe nº 133). Un compte tout neuf n'a rien à
           sélectionner, rien à modifier et rien à montrer : le
           sélecteur affichait « Aucun portfolio · Brouillon », et
           « Modification » comme « Mon portfolio » menaient au
           formulaire de création — que « + Ajouter un portfolio »
           ouvre déjà, en un seul mot clair.

           COMMENT ON SAIT QU'UN PORTFOLIO A ÉTÉ ENVOYÉ : la ligne
           `tatoueurs` n'est écrite QU'À L'ENVOI (voir `envoyer` dans
           FormulaireFiche — aucun brouillon n'est créé avant). Une
           liste non vide EST donc la preuve de l'envoi ; il n'y a
           rien d'autre à interroger.

           ET DANS L'AUTRE SENS, sans une ligne de plus : un portfolio
           en cours de suppression EST encore dans la liste (c'est ce
           qui permet de le réactiver) ; le jour où les 30 jours
           tombent, la purge efface la ligne, la liste se vide, et le
           menu revient de lui-même à ses quatre entrées. */}
      {fiches.length > 0 && (
      <div
        //  ⚠️ `eleve-clair/70` depuis la nº 144-§3 : posé sur la fenêtre
        //  `eleve`, l'ancien `eleve/70` disparaissait. Le contraste
        //  relatif est LE MÊME qu'avant (≈ 6 points), mesuré.
        className="my-1.5 bg-sombre-eleve-clair/70
                   px-2 py-2.5 flex flex-col gap-1"
      >
        {/* PAS DE TITRE DE GROUPE. « La fiche choisie » nommait ce que
            le sélecteur montre déjà : le nom du portfolio est écrit en
            toutes lettres juste dessous, en gras. Une étiquette qui
            répète son champ n'aide personne — elle ajoute une ligne. */}
        {/* LE SÉLECTEUR — un VRAI menu déroulant : la liste se pose
            PAR-DESSUS le menu (absolute), elle ne le pousse pas et ne
            le remplace pas. Le reste des entrées demeure visible et à
            sa place pendant qu'elle est ouverte.
            L'ÉTAT DE LA FICHE VIT ICI, en deuxième ligne : une
            pastille de 6 px et un mot. C'était un encadré entier, avec
            un gros rond de couleur et une phrase — l'élément le plus
            voyant d'un menu où il n'est qu'un renseignement. */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSelecteurOuvert((v) => !v)}
            aria-expanded={selecteurOuvert}
            // IL DOIT SE VOIR QU'ON PEUT L'OUVRIR — mais SANS CONTOUR
            // (charte, nº 132) : c'est un CHAMP, il se dit par son
            // FOND et par son chevron. À l'ouverture le fond
            // s'éclaircit encore — la grammaire du focus des champs,
            // sans un trait.
            // ⚠️ ENCORE UN CRAN (passe nº 146-§3, deuxième signalement) :
            // la fenêtre a été éclaircie à la nº 144 (`carte` → `eleve`)
            // mais le sélecteur, resté à `bordure` (56,56,63) sur le
            // bloc `eleve-clair/70`, ne s'en détachait plus. Il prend
            // `haut` (65,65,73) au repos et `haut-clair` (75,75,84)
            // ouvert : chaque niveau s'éclaircit, jamais de contour.
            className={`flex w-full items-center gap-3 rounded-xl px-3
                       min-h-[54px] text-left transition-colors ${
                         selecteurOuvert
                           ? "bg-sombre-haut-clair"
                           : "bg-sombre-haut hover:bg-sombre-haut-clair"
                       }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-semibold text-sombre-texte leading-tight">
                {fiche ? fiche.nom : "Aucun portfolio"}
              </span>
              <span className="mt-1 flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${COULEUR_ETAT[etat]}`}
                />
                <span className="text-[12px] text-sombre-texte-doux leading-none">
                  {LIBELLE_ETAT[etat]}
                </span>
              </span>
            </span>
            {/*  ⚠️ LE CHEVRON NE ROSIT PLUS OUVERT (nº 144-§2) : la
                 ROTATION dit déjà l'état, et le rose est réservé aux
                 accents forts — pas aux fenêtres ouvertes. */}
            <IconeChevronBas
              taille={16}
              classe={`shrink-0 transition-transform text-sombre-texte-doux ${
                selecteurOuvert ? "rotate-180" : ""
              }`}
            />
          </button>

          {selecteurOuvert && (
            //  La liste au MÊME niveau que le champ ouvert (nº 134) :
            //  elle le prolonge, elle ne peut pas être plus sombre.
            <div
              className="absolute left-0 right-0 top-full z-20 mt-1
                         rounded-xl bg-sombre-haut-clair overflow-hidden"
            >
              <ul className="max-h-[220px] overflow-y-auto overscroll-contain">
                {fiches.map((entree) => {
                  const etatEntree = etatDeLaFiche(entree);
                  const choisie = entree.id === fiche?.id;
                  return (
                    <li key={entree.id}>
                      {/* ⚠️ EXACTEMENT LA MÊME COMPOSITION QUE L'ENTRÉE
                          SÉLECTIONNÉE, au-dessus : le nom sur la
                          première ligne, puis la pastille et l'état
                          SOUS le nom, alignés sur lui.
                          La pastille était posée À GAUCHE du bloc,
                          centrée entre les deux lignes : les noms de
                          la liste se retrouvaient décalés par rapport
                          au nom affiché dans le sélecteur, et l'œil
                          ne reconnaissait plus la même chose. */}
                      <button
                        type="button"
                        onClick={() => choisirFiche(entree.id)}
                        className={`block w-full px-3 py-2.5 text-left
                                   transition-colors hover:bg-white/[0.06] ${
                                     choisie ? "bg-white/[0.04]" : ""
                                   }`}
                      >
                        <span className="block truncate text-[14.5px] font-semibold text-sombre-texte leading-tight">
                          {entree.nom}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${COULEUR_ETAT[etatEntree]}`}
                          />
                          <span className="text-[12px] text-sombre-texte-doux leading-none">
                            {LIBELLE_ETAT[etatEntree]}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <nav aria-label="Le portfolio choisi" className="flex flex-col gap-0.5">
          {/* Le formulaire, en haut de page. L'ÉVÉNEMENT prévient le
              formulaire s'il est DÉJÀ affiché (naviguer vers la même
              adresse ne déclenche rien) : il remonte alors la page et
              rouvre l'annonce de validation lui-même. */}
          <Link
            href={versFiche()}
            onClick={() => {
              setOuvert(false);
              window.dispatchEvent(new Event("yokofolio-modification-demandee"));
            }}
            className={classeEntree}
          >
            <span className={boiteIcone}>
              <IconeReglages taille={22} />
            </span>
            Modification
          </Link>

          {/* L'aperçu public réel. */}
          <Link
            href={versFiche("vue=apercu")}
            onClick={() => setOuvert(false)}
            className={classeEntree}
          >
            <span className={boiteIcone}>
              <IconeUtilisateur taille={22} />
            </span>
            Mon portfolio
          </Link>
        </nav>
      </div>
      )}

      {/* ---------- LE COMPTE, hors du bloc : sur le fond normal. */}
      <nav aria-label="Mon compte" className="px-2 flex flex-col gap-0.5">
        {/* LA LANGUE — AU-DESSUS DE SÉCURITÉ (passe nº 137). Le globe
            a quitté la barre fixe, où le CŒUR des favoris a pris sa
            place une fois connecté : une barre de smartphone n'a pas
            de quoi porter les deux. Il ouvre EXACTEMENT la même
            fenêtre que le globe de la barre — c'est le même composant.
            ⚠️ LA LIGNE SEULE (nº 238-§5) : la fenêtre est montée PLUS
            BAS, hors du menu. Tant qu'elle vivait ici, refermer « Mon
            compte » l'aurait emportée avec lui — les deux ne pouvaient
            qu'être empilées. Et la ligne porte enfin la classe
            commune : elle gardait un survol en aplat (nº 237-§2). */}
        <EntreeLangue
          classe={classeEntree}
          surOuvrir={() => {
            setOuvert(false);
            setLangueOuverte(true);
          }}
        />

        <Link
          href="/devenir-tatoueur/securite"
          onClick={() => setOuvert(false)}
          className={classeEntree}
        >
          <span className={boiteIcone}>
            {/* UN BOUCLIER, plus un cadenas (nº 129) : le cadenas dit
                « c'est fermé », le bouclier dit « c'est protégé » —
                c'est bien de cela qu'il s'agit ici. */}
            <IconeBouclierTrait taille={22} />
          </span>
          Sécurité
        </Link>

        <button type="button" onClick={deconnecter} className={classeEntree}>
          <span className={boiteIcone}>
            <IconeSortie taille={22} />
          </span>
          Déconnexion
        </button>
      </nav>
    </div>
  );

  return (
    <div ref={zone} className="relative flex items-center gap-1.5">
      {/* ÉCRAN ÉTROIT : l'icône personnage, ROSE (connecté). */}
      <button
        type="button"
        onClick={basculerLeMenu}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={`Mon espace — ${nom}`}
        title={`Mon espace — ${nom}`}
        style={{ height: hauteur, width: hauteur }}
        className="sm:hidden flex items-center justify-center rounded-full
                   text-primaire transition-colors hover:bg-sombre-eleve
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire"
      >
        {/*  LA SILHOUETTE SEULE, rang 24 (nº 147-§5 et §6) — ROSE :
             c'est l'état connecté, le rose le dit (charte). */}
        <IconeSilhouette taille={24} />
      </button>

      {/* ÉCRAN LARGE (nº 147-§4) : LA CAPSULE « Mon espace » A
          DISPARU. Reste l'ICÔNE DU COMPTE seule — la silhouette, ROSE
          parce que connecté (charte).
          ⚠️ LE TRIANGLE QUI DISAIT « ouvert / fermé » EST SUPPRIMÉ
          (nº 155-§5A), à la demande du propriétaire : l'état reste dit
          aux lecteurs d'écran (`aria-expanded`), l'œil, lui, voit la
          fenêtre — l'indicateur ne disait rien de plus. Le nom du
          compte reste en info-bulle. Même gabarit rond que le globe et
          le fanion : la barre s'aligne. */}
      <button
        type="button"
        onClick={basculerLeMenu}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={`Mon espace — ${nom}`}
        title={`Mon espace — ${nom}`}
        style={{ height: hauteur, width: hauteur }}
        className="hidden sm:flex items-center justify-center rounded-full
                   text-primaire transition-colors hover:bg-sombre-eleve
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire"
      >
        <IconeSilhouette taille={24} classe="shrink-0" />
      </button>

      {/* LE CONTENU DU MENU — écrit UNE FOIS, posé dans les deux
          habillages (web sous le bouton, smartphone au centre). */}
      {ouvert && (
        <>
          {/* WEB : la fenêtre sous le bouton.
              ⚠️ ELLE N'ÉTAIT PAS EN VERRE (nº 238-§4), ET LE
              PROPRIÉTAIRE L'A VU : l'inventaire de la nº 236 annonçait
              « la fenêtre du compte » convertie — seule celle du
              SMARTPHONE l'avait été. Deux écritures pour une même
              fenêtre, et le défaut ne se voyait donc que d'un côté :
              c'est la signature d'un doublon, et la raison pour
              laquelle le banc à une seule largeur n'a rien vu.
              ELLE PASSE PAR `MenuDeVerre` — la plaque est montée dans
              le corps du document, comme le panneau des filtres : la
              barre fixe porte son propre flou, donc une racine
              d'arrière-plan, et un enfant n'y flouterait que
              l'intérieur de la barre. */}
          <MenuDeVerre
            ouvert={ouvert}
            ancre={zone}
            refPanneau={plaqueWeb}
            largeur={290}
            alignement="droite"
            role="dialog"
            aria-label="Mon espace"
            data-source-composant="MenuEspace · fenêtre web"
            className="mobile:hidden"
          >
            {contenuMenu}
          </MenuDeVerre>

          {/* SMARTPHONE : la fenêtre CENTRÉE derrière son voile — le
              traitement exact de la fenêtre du moteur de recherche.
              Le voile encaisse le toucher (rien ne traverse vers la
              carte du dessous) et referme au relâchement.

              ELLE EST PLUS ÉTROITE QUE CELLE DU MOTEUR, ET CELA SE
              VOIT. Un menu de compte n'a que des lignes de texte à
              montrer : rien ne justifiait qu'il occupe presque toute
              la largeur de l'écran, où il ne laissait qu'un liseré de
              voile — donc l'impression d'une PAGE, pas d'une fenêtre.
              32 px de marge garantie de chaque côté (px-8) et un
              plafond à 320 px (contre 420 px pour le moteur) : le
              voile redevient franchement visible, et la hiérarchie
              entre les deux fenêtres se lit d'un coup d'œil. */}
          {createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Mon espace"
              className="hidden mobile:flex fixed inset-0 z-[70] items-center
                         justify-center px-8 py-6"
            >
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOuvert(false)}
                className="absolute inset-0 bg-black/25 cursor-default
                           opacity-100 transition-opacity duration-200 starting:opacity-0"
              />
              <div
                data-verre-fenetre=""
                className="relative w-full max-w-[320px] max-h-[min(92dvh,700px)]
                           overflow-y-auto overscroll-contain rounded-3xl"
              >
                {contenuMenu}
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {/* LA FENÊTRE DES NOTIFICATIONS — au-dessus du menu, sur les
          deux appareils. Marquer une nouvelle comme lue met le
          compteur à jour SUR-LE-CHAMP, sans attendre le serveur. */}
      {notificationsOuvertes && (
        <FenetreNotifications
          notifications={notifications}
          onFermer={() => setNotificationsOuvertes(false)}
          onLue={(id) =>
            setNotifications((liste) =>
              liste.map((n) =>
                n.id === id && !n.lue_le
                  ? { ...n, lue_le: new Date().toISOString() }
                  : n
              )
            )
          }
          onToutLu={() =>
            setNotifications((liste) =>
              liste.map((n) =>
                n.lue_le ? n : { ...n, lue_le: new Date().toISOString() }
              )
            )
          }
        />
      )}

      {/* LA FENÊTRE DES LANGUES — montée ICI, et non dans la ligne qui
          l'ouvre (nº 238-§5) : la ligne vit dans le menu, la fenêtre
          lui survit. Ouvrir ferme « Mon compte » ; fermer rend la
          page, sans rien rouvrir. */}
      {langueOuverte && (
        <FenetreLangue surFermeture={() => setLangueOuverte(false)} />
      )}

      {/* ---------- « MODIFICATIONS NON ENREGISTRÉES » ----------
          ⚠️ LA FENÊTRE PARTAGÉE (passe nº 116) : le même avertissement
          que celui de la garde de navigation globale (GardeSaisie) —
          mêmes textes, même charte (aucun contour, capsule pleine
          largeur pour rester, texte rouge pour quitter). Deux
          fenêtres différentes pour un même danger auraient fini par
          se contredire. */}
      {avertirAvantCreation && (
        <FenetreNonEnregistre
          surRester={() => setAvertirAvantCreation(false)}
          surQuitter={allerCreerUneFiche}
        />
      )}
    </div>
  );
}
