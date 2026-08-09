"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconeBouclierTrait,
  IconeChevronBas,
  IconeCloche,
  IconePlus,
  IconeReglages,
  IconeSortie,
  IconeUtilisateur,
} from "@/components/Icones";
import { FenetreNotifications } from "@/components/FenetreNotifications";
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
  /** L'avertissement « tu as une saisie en cours » — voir plus bas. */
  const [avertirAvantCreation, setAvertirAvantCreation] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
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

  // LES FICHES ET LES NOUVELLES — relues à CHAQUE ouverture : léger,
  // et toujours vrai au moment où l'on regarde.
  useEffect(() => {
    if (!ouvert) return;
    let abandonne = false;
    (async () => {
      try {
        const supabase = creerClientSupabaseNavigateur();
        const liste = await chargerFichesDuCompte(supabase, idUtilisateur);
        if (abandonne) return;
        setFiches(liste);
        // On recale le choix : la fiche mémorisée peut avoir disparu.
        const retenue = ficheActive(liste, idFiche);
        setIdFiche(retenue?.id ?? null);
      } catch {
        if (!abandonne) setFiches([]);
      }
      try {
        const reponse = await fetch("/api/tatoueur/notifications");
        const donnees = (await reponse.json().catch(() => null)) as {
          notifications?: Notification[];
        } | null;
        if (!abandonne) setNotifications(donnees?.notifications ?? []);
      } catch {
        // Pas de nouvelles : le menu vit très bien sans.
      }
    })();
    return () => {
      abandonne = true;
    };
    // `idFiche` volontairement absent : on ne relit pas la base à
    // chaque changement de fiche, seulement à l'ouverture du menu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, idUtilisateur]);

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
      if (!zone.current?.contains(evenement.target as Node)) setOuvert(false);
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
  const classeEntree =
    "flex w-full items-center gap-3 rounded-xl px-3 min-h-[46px] text-left " +
    "text-[14.5px] font-semibold text-sombre-texte hover:bg-sombre-eleve " +
    "transition-colors";
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

        {/* ---------- 2. AJOUTER UN PORTFOLIO — une entrée du MENU, et
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
        className="my-1.5 bg-sombre-eleve/70
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
            // s'éclaircit encore et le chevron passe au rose — la
            // grammaire du focus des champs, sans un trait.
            // ⚠️ DEUX CRANS AU-DESSUS DU BLOC (passe nº 134) : posé
            // sur `bg-sombre-eleve/70` (≈ 41,41,46), le fond
            // `bg-sombre-eleve` (44,44,49) ne s'en distinguait que de
            // trois points — le sélecteur était invisible. Il prend
            // `eleve-clair` (53,53,59) au repos, `bordure` (56,56,63)
            // ouvert : chaque niveau s'éclaircit, jamais de contour.
            className={`flex w-full items-center gap-3 rounded-xl px-3
                       min-h-[54px] text-left transition-colors ${
                         selecteurOuvert
                           ? "bg-sombre-bordure"
                           : "bg-sombre-eleve-clair hover:bg-sombre-bordure"
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
            <IconeChevronBas
              taille={16}
              classe={`shrink-0 transition-transform ${
                selecteurOuvert
                  ? "rotate-180 text-primaire"
                  : "text-sombre-texte-doux"
              }`}
            />
          </button>

          {selecteurOuvert && (
            //  La liste au MÊME niveau que le champ ouvert (nº 134) :
            //  elle le prolonge, elle ne peut pas être plus sombre.
            <div
              className="absolute left-0 right-0 top-full z-20 mt-1
                         rounded-xl bg-sombre-bordure overflow-hidden"
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
        onClick={() => setOuvert(!ouvert)}
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
        <IconeUtilisateur taille={22} />
      </button>

      {/* ÉCRAN LARGE : le bouton rose « Mon espace ». */}
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={`Mon espace — ${nom}`}
        style={{ height: hauteur }}
        className="hidden sm:flex rounded-full px-5 items-center gap-2
                   bg-primaire hover:bg-primaire-fonce text-white
                   text-sm font-semibold transition-colors whitespace-nowrap
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire"
      >
        <span className="max-w-[180px] truncate">Mon espace</span>
        <IconeUtilisateur taille={18} classe="shrink-0 text-white" />
      </button>

      {/* LE CONTENU DU MENU — écrit UNE FOIS, posé dans les deux
          habillages (web sous le bouton, smartphone au centre). */}
      {ouvert && (
        <>
          {/* WEB : la fenêtre sous le bouton, comme avant. */}
          <div
            role="dialog"
            aria-label="Mon espace"
            className="mobile:hidden absolute top-full right-0 z-30 mt-2 w-[290px]
                       rounded-2xl bg-sombre-carte"
          >
            {contenuMenu}
          </div>

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
                className="absolute inset-0 bg-black/60 cursor-default"
              />
              <div
                className="relative w-full max-w-[320px] max-h-[min(92dvh,700px)]
                           overflow-y-auto overscroll-contain rounded-3xl
                           bg-sombre-carte
                           opacity-100 transition-opacity duration-200 starting:opacity-0"
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
