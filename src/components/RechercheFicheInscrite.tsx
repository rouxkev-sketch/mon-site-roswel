"use client";

import { useEffect, useRef, useState } from "react";
import { IconeCroix, IconeLoupe } from "@/components/Icones";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import { ligneCarte } from "@/lib/adresse";
import { useAppareilMobile } from "@/lib/appareil";
import { armerLaRemontee } from "@/lib/remontee-champ";
//  §1 (nº 718) — la variante d'avatar à servir : la règle de
//  nommage et le repli vivent dans lib/avatar-variantes.
import { AVATAR_PETIT, sourceAvatar } from "@/lib/avatar-variantes";

/**
 * LA RECHERCHE INTERNE — « ton salon est-il déjà sur yokofolio ? »
 * ================================================================
 * Une barre posée AU-DESSUS du champ d'adresse. On y tape un nom ; la
 * liste des fiches inscrites s'ouvre dessous ; on en choisit une, et
 * l'adresse n'est plus à saisir — elle vient du salon.
 *
 * MÊME RYTHME QUE LE CHAMP DE LOCALISATION, et c'est voulu : deux
 * caractères au minimum, une PAUSE DE FRAPPE avant d'interroger le
 * serveur, la requête précédente annulée. Deux barres de recherche qui
 * se répondent doivent se comporter pareil.
 *
 * LE PANNEAU RESTE DANS LE FLUX — pas de portail, pas de coordonnées :
 * il est le frère suivant du champ, le navigateur le place dessous.
 * C'est la leçon du menu de localité, appliquée d'emblée ici : rien
 * ne peut passer par-dessus le champ, ni sortir de l'écran.
 *
 * RIEN N'EST OBLIGATOIRE : ne rien trouver est un cas NORMAL, pas un
 * échec. La phrase le dit, et le champ d'adresse en dessous prend le
 * relais.
 */

export type FicheInscrite = {
  id: string;
  nom: string;
  slug: string;
  ville_nom: string | null;
  photo_profil: string | null;
  /** L'adresse publique de la fiche : elle situe le mode d'exercice
      de celui qui la choisit, sans qu'il ait rien à ressaisir. */
  adresse?: string | null;
  code_postal?: string | null;
  region?: string | null;
  pays?: string | null;
  code_pays?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lieu_id?: string | null;
};

/** Deux lettres : en dessous, la liste ne veut rien dire. */
const SAISIE_MINIMUM = 2;
/** La même pause que le champ de localisation — on ne cherche pas à
    chaque lettre. */
const PAUSE_FRAPPE_MS = 300;

export function RechercheFicheInscrite({
  type,
  etablissement,
  etiquette,
  texteIndicatif,
  choisie,
  surChoix,
  id,
  exclure,
  libelleExclu = "Already linked",
  messageVide,
  enErreur = false,
}: {
  /** « salon » quand on cherche un LIEU (salon ou studio privé) ;
      « artiste » pour le chemin inverse, depuis le formulaire d'un
      salon. C'est la colonne `type_fiche`. */
  type: "salon" | "artiste";
  /** ⚠️ LA NATURE DU LIEU (passe nº 121) — la colonne `etablissement`.
      `type_fiche = 'salon'` désigne TOUS les lieux : un salon comme un
      studio privé. Le mode « En studio » ne doit proposer QUE des
      studios, « En salon » QUE des salons ; le guest et l'autre
      adresse acceptent les deux, et ne passent donc rien ici. */
  etablissement?: "salon" | "prive";
  etiquette: string;
  texteIndicatif: string;
  /** La fiche déjà retenue, s'il y en a une. */
  choisie: FicheInscrite | null;
  surChoix: (fiche: FicheInscrite | null) => void;
  id: string;
  /** LES FICHES DÉJÀ RETENUES AILLEURS — elles restent VISIBLES dans
      la liste, mais inertes, avec un mot qui dit pourquoi. Les faire
      disparaître ferait croire qu'elles ne sont pas inscrites, et l'on
      chercherait deux fois le même nom sans comprendre. */
  exclure?: string[];
  /** Ce mot, justement. ⚠️ « Déjà rattaché » PARTOUT (passe nº 121) :
      l'équipe disait « déjà dans l'équipe » — avec une apostrophe mal
      encodée, en prime. Deux listes qui font le même geste doivent
      porter le même mot. */
  libelleExclu?: string;
  /** LA PHRASE QUAND ON NE TROUVE RIEN (passe nº 121) — elle nomme ce
      qu'on cherchait : « Aucun studio trouvé », « Aucun artiste
      trouvé »… Sans elle, un repli générique s'affiche. */
  messageVide?: string;
  /** LE MANQUE DU BLOC 1 (passe nº 116) : « Je confirme » sans lieu
      encadre ce champ de ROUGE — il s'éteint dès qu'une réponse est
      donnée (recherche OU adresse manuelle). */
  enErreur?: boolean;
}) {
  const [texte, setTexte] = useState("");
  const [resultats, setResultats] = useState<FicheInscrite[]>([]);
  const [ouverte, setOuverte] = useState(false);
  const [cherche, setCherche] = useState(false);
  const requete = useRef(0);
  /**
   * §3 (nº 266) — LA LISTE DÉBORDE-T-ELLE VRAIMENT ?
   * ------------------------------------------------------------------
   * C'est cette réponse, et elle seule, qui pose l'exception
   * `defilement-visible` (voir la note du panneau, plus bas) : une
   * barre n'a de sens que s'il reste quelque chose à voir. Mesurée sur
   * le panneau lui-même — jamais devinée d'après le nombre de
   * résultats, qui ne dit rien de la hauteur réelle des lignes — et
   * remesurée quand la liste change ou que la fenêtre bouge
   * (ResizeObserver, comme les rangées de la nº 252).
   */
  const panneauListe = useRef<HTMLDivElement>(null);
  const [listeDeborde, setListeDeborde] = useState(false);
  useEffect(() => {
    const cadre = panneauListe.current;
    if (!cadre) {
      setListeDeborde(false);
      return;
    }
    const lire = () =>
      setListeDeborde(cadre.scrollHeight > cadre.clientHeight + 1);
    lire();
    const observateur = new ResizeObserver(lire);
    observateur.observe(cadre);
    for (const enfant of cadre.children) observateur.observe(enfant);
    return () => observateur.disconnect();
  }, [ouverte, resultats, cherche]);
  /** LA ZONE « champ + panneau » — elle sert à savoir ce qui est
      DEDANS quand on clique DEHORS (passe nº 121). */
  const zone = useRef<HTMLDivElement>(null);

  /**
   * LA REMONTÉE AU TOUCHER — ce champ y a droit (passe nº 162-§1)
   * =============================================================
   * ⚠️ IL LA TENAIT DE L'ÉCOUTEUR GLOBAL, QUI N'EXISTE PLUS. La
   * nº 155-§1 faisait remonter TOUS les champs du site ; la nº 162-§1
   * annule cette règle — brutale et inutile pour un champ sans liste.
   * Mais celui-ci EN A UNE : « ton salon est-il déjà sur yokofolio ? »
   * ouvre un panneau de résultats DANS LE FLUX, juste dessous. Sans
   * remontée, ce panneau naît coincé entre le champ et le clavier.
   * Il arme donc la mécanique lui-même, comme le champ de localité.
   *
   * C1 — L'APPAREIL, JAMAIS LA LARGEUR : à la souris, aucun clavier ne
   * recouvre rien, et faire défiler au clic serait une gêne.
   */
  const surMobile = useAppareilMobile();
  const arret = useRef<(() => void) | null>(null);
  useEffect(() => () => arret.current?.(), []);

  /* ---------- CLIQUER À CÔTÉ REFERME (passe nº 121) ----------
     Le panneau de résultats restait ouvert indéfiniment : ni le clic
     ailleurs, ni le toucher, ni Échap ne le fermaient — seul un choix
     ou une nouvelle frappe. Tous les autres menus du site le font
     (localité, menus déroulants) ; celui-ci avait été oublié.
     `pointerdown` couvre la souris ET le doigt d'un seul écouteur. */
  useEffect(() => {
    if (!ouverte) return;
    function auPointeurDehors(evenement: PointerEvent) {
      if (!zone.current) return;
      if (zone.current.contains(evenement.target as Node)) return;
      setOuverte(false);
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuverte(false);
    }
    document.addEventListener("pointerdown", auPointeurDehors);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("pointerdown", auPointeurDehors);
      document.removeEventListener("keydown", auClavier);
    };
  }, [ouverte]);

  useEffect(() => {
    const saisie = texte.trim();
    // Trop court : on referme, mais PAS dans le corps de l'effet
    // (React déconseille d'y poser un état — voir la règle
    // react-hooks/set-state-in-effect). Le même minuteur s'en charge.
    const minuteur = setTimeout(async () => {
      if (saisie.length < SAISIE_MINIMUM) {
        setResultats([]);
        setOuverte(false);
        return;
      }
      const numero = ++requete.current;
      setCherche(true);
      try {
        const reponse = await fetch(
          `/api/tatoueur/search-fiches?type=${type}` +
            //  LA NATURE DU LIEU, quand elle est demandée (nº 121).
            (etablissement ? `&etablissement=${etablissement}` : "") +
            `&q=${encodeURIComponent(saisie)}`
        );
        const donnees = (await reponse.json()) as {
          ok: boolean;
          fiches?: FicheInscrite[];
        };
        if (numero !== requete.current) return; // réponse dépassée
        setResultats(donnees.fiches ?? []);
        setOuverte(true);
      } catch {
        if (numero === requete.current) {
          setResultats([]);
          setOuverte(true);
        }
      }
      if (numero === requete.current) setCherche(false);
    }, PAUSE_FRAPPE_MS);
    return () => clearTimeout(minuteur);
  }, [texte, type, etablissement]);

  /* LA FICHE RETENUE — plus de champ, une pastille qui la nomme, et
     une croix pour revenir en arrière. On ne laisse pas coexister
     « ce que j'ai choisi » et « ce que je tape » : ce serait deux
     vérités à l'écran. */
  if (choisie) {
    return (
      <div>
        {/* ⚠️ mb-3, ET SEULEMENT SI L'ÉTIQUETTE EXISTE (passe nº 106) :
            « Ton équipe est-elle sur YokoFolio ? » collait à son champ,
            et une étiquette vide laissait traîner sa marge. */}
        {etiquette && (
          <p className="mb-3 text-sm font-medium text-sombre-texte">{etiquette}</p>
        )}
        {/* ⚠️ NI CONTOUR NI TEINTE (passe nº 117, point 3). Cette
            pastille portait un cadre rose à 45 % et un fond rose à
            10 % : sur l'anthracite, un encadré cerné ET rempli de
            rouge — exactement le dessin d'une erreur. On la choisit
            juste après avoir vu les champs rougir, et l'on croyait que
            le manque n'était pas levé. Il l'était : c'est le DESSIN
            qui mentait. La charte tranche — aucun contour, un fond
            d'un cran plus clair, le rose réservé aux badges
            sélectionnés, au bouton final et à la ligne du sélecteur. */}
        {/*  ██ §2 (nº 419) — LA PALETTE DU FORMULAIRE ██
             CE QUE CE CHAMP PORTAIT : `bg-sombre-eleve`, un cran plus
             sombre que le champ de recherche juste au-dessus, qui est
             sur `bg-sombre-eleve-clair` (l. ~342) — alors que c'est LE
             MÊME champ, une fois la fiche retenue. La cause est celle
             de la nº 419 tout entière : la paire du MOTEUR
             (`ROBE_CHAMP_SOMBRE`) au lieu de celle du FORMULAIRE
             (`CHAMP`, champs-formulaire). Il prend donc le niveau de
             son propre champ de saisie, et de tous les autres.
             ⚠️ LA PASTILLE DE LA PHOTO RESTE UN CRAN EN DESSOUS
             (`bg-sombre-eleve`) : ce n'est pas un champ, c'est le
             LOGEMENT d'une image — le creux qui se voit quand la fiche
             n'a pas de photo, exactement comme les pastilles de
             `PhotoRonde` (BlocLieux). Le fond ne monte que d'un cran,
             il ne se met pas à niveau avec ce qu'il creuse. */}
        <div className="flex items-center gap-3 rounded-lg bg-sombre-eleve-clair px-3 py-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center
                       overflow-hidden rounded-full bg-sombre-eleve"
          >
            {choisie.photo_profil ? (
              /* eslint-disable-next-line @next/next/no-img-element --
                 photo déposée par la fiche, servie telle quelle. */
              <img
                //  §1 (nº 718) — la petite variante (rond de liste).
                src={sourceAvatar(choisie.photo_profil, AVATAR_PETIT)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden="true" className="text-[13px] font-bold text-sombre-texte-doux">
                {choisie.nom.trim().charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          {/* ⚠️ LE NOM SEUL, SUR UNE LIGNE (passe nº 121). L'adresse
              s'affichait dessous — elle avait DÉJÀ servi : c'est elle
              qui a permis de distinguer les homonymes DANS LA LISTE de
              résultats. Une fois le choix fait, elle ne décide plus
              rien et casse l'alignement du nom avec le portrait. Le
              nom est donc seul, et centré verticalement à côté de la
              photo (`items-center` du contenant). */}
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-sombre-texte">
            {choisie.nom}
          </span>
          <button
            type="button"
            aria-label="Remove this choice"
            title="Remove this choice"
            onClick={() => {
              surChoix(null);
              setTexte("");
              setResultats([]);
              setOuverte(false);
            }}
            //  §2 (nº 419) — LA CROIX SUIT SON CHAMP : son survol
            //  était `bg-sombre-eleve`, désormais la couleur DU champ
            //  qui la porte — il ne s'y verrait plus. Elle monte d'un
            //  cran, comme tout le reste.
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                       text-sombre-texte-doux transition-colors
                       hover:bg-sombre-haut hover:text-sombre-texte"
          >
            <IconeCroix taille={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={zone}>
      {/* Même règle qu'au-dessus : mb-3, et pas d'étiquette vide. */}
      {etiquette && (
        <label
          htmlFor={id}
          className="mb-3 block text-sm font-medium text-sombre-texte"
        >
          {etiquette}
        </label>
      )}
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2
                     text-sombre-texte-doux"
        >
          <IconeLoupe taille={16} />
        </span>
        <input
          id={id}
          type="text"
          // LE REMPLISSAGE AUTOMATIQUE EST NEUTRALISÉ ICI AUSSI : un
          // champ nommé « chercher un artiste » attirait la fiche de
          // contact du navigateur par-dessus nos suggestions.
          {...sansRemplissageAuto(id)}
          value={texte}
          placeholder={texteIndicatif}
          //  L'attribut qui porte la marge de remontée (globals.css) —
          //  posé seulement quand la remontée a lieu.
          data-remonte-au-toucher={surMobile ? "" : undefined}
          onChange={(evenement) => setTexte(evenement.target.value)}
          onFocus={(evenement) => {
            if (resultats.length > 0) setOuverte(true);
            //  LA PLACE POUR LA LISTE (nº 162-§1) — voir plus haut.
            if (!surMobile) return;
            arret.current?.();
            arret.current = armerLaRemontee(evenement.currentTarget);
          }}
          onBlur={() => {
            arret.current?.();
            arret.current = null;
          }}
          //  ⚠️ PLUS DE CONTOUR NI D'ANNEAU AU FOCUS (passe nº 116) —
          //  ce champ avait échappé à la règle de la nº 112 : le fond
          //  s'éclaircit au focus, et la bordure (dans la boîte, donc
          //  sans décalage) ne s'allume qu'en ROUGE, pour un manque.
          //  ⚠️ `pr-11` (passe nº 121) : la croix de vidage occupe la
          //  droite du champ — le texte ne doit jamais passer dessous.
          className={`w-full min-h-[48px] rounded-lg border
                     bg-sombre-eleve-clair pl-10 pr-11 text-base text-sombre-texte
                     placeholder:text-sombre-texte-doux outline-none
                     transition-colors focus:bg-sombre-haut ${
                       enErreur ? "border-erreur" : "border-transparent"
                     }`}
        />
        {/* ---------- LA CROIX DE VIDAGE (passe nº 121) ----------
            Une recherche infructueuse s'effaçait LETTRE PAR LETTRE, au
            doigt, sur un clavier qui masque la moitié de l'écran. La
            croix n'apparaît qu'une fois quelque chose de tapé, vide le
            champ ET referme le panneau d'un seul geste. Traitement
            discret : ni capsule, ni rose — le gris doux des icônes,
            qui s'éclaircit au survol. */}
        {texte.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            title="Clear search"
            onClick={() => {
              setTexte("");
              setResultats([]);
              setOuverte(false);
              document.getElementById(id)?.focus();
            }}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2
                       items-center justify-center rounded-full
                       text-sombre-texte-doux transition-colors
                       hover:text-sombre-texte"
          >
            <IconeCroix taille={16} />
          </button>
        )}
      </div>

      {ouverte && (
        <div
          ref={panneauListe}
          /*  §3 (nº 266) — LE POINT BLANC FANTÔME, ET SA CAUSE.
              MESURE : ce n'est ni une puce de liste, ni un élément
              rendu par le menu, ni un reste de peinture (le trait
              fantôme de la nº 258). C'est LE POUCE DE LA BARRE DE
              DÉFILEMENT de ce panneau. La règle
              `.defilement-visible::-webkit-scrollbar-thumb`
              (globals.css) dessine une barre CLASSIQUE — 11 px de
              large, `border: 3px solid transparent` + `background-clip:
              content-box` (donc 5 px visibles), `border-radius: 999px`,
              couleur `--rw-bordure-carte`, le gris très clair. Blink la
              peint MÊME QUAND IL N'Y A RIEN À FAIRE DÉFILER : le pouce
              occupe alors toute la piste, et sur une liste d'une ou
              deux entrées cette capsule de 5 px de large fait à peine
              plus haut que large — un POINT CLAIR sur le bord droit.
              C'est exactement le relevé : il n'apparaît qu'avec le
              menu ouvert, et sur le côté droit.
              LE REMÈDE N'EST PAS UN MASQUE : on ne pose l'exception
              `defilement-visible` QUE lorsque la liste déborde
              vraiment — c'est la seule raison qui l'a fait naître (la
              barre disait qu'il restait des choix plus bas). Sans
              débordement, le panneau retombe sous la règle générale du
              site (« jamais d'ascenseur affiché ») : il n'y a plus de
              pouce à peindre, donc plus de point. */
          /*  ██ §1 (nº 553) — LE PANNEAU MONTE AU RANG DES ENCADRÉS ██
              C'est le CINQUIÈME panneau déroulant du formulaire — celui
              qui cherche un salon, un studio ou un membre d'équipe —, et
              il n'était dans aucun inventaire précédent : il n'a jamais
              porté de verre, il était en aplat `carte` depuis toujours.
              Il souffrait pourtant du même défaut, en pire : les
              encadrés du formulaire SONT à `carte` (`FormulaireFiche`),
              donc ce panneau avait très exactement la couleur de ce qui
              le porte — contraste 1,00. Il passe à `eleve` (#262C34),
              le rang des encadrés du site : 1,18 avec l'encadré, 1,37
              avec la page quand il déborde.
              ██ ET LA BORDURE PART ██
              `border border-sombre-bordure` était la BÉQUILLE de ce
              défaut : quand un panneau a la couleur de son support, il
              ne reste qu'un trait pour dire où il commence. Le fond le
              dit maintenant tout seul — c'est la charte, mot pour mot
              (nº 139 : « plus de contour, le panneau se dit par son
              fond »), et c'était le seul contour des cinq panneaux.
              Le trait valait 1,28 sur `carte` ; le fond vaut 1,18 sur
              le même support, sur toute la surface au lieu d'un pixel.
              ⚠️ SI TU LA VEUX, ELLE REVIENT EN REMETTANT CES DEUX MOTS.
              ⚠️ LA GÉOMÉTRIE NE BOUGE PAS : `box-sizing: border-box` est
              posé sur tout le site, la boîte extérieure du panneau est
              donc au pixel près la même sans son trait. */
          className={`mt-1.5 max-h-[280px] overflow-y-auto overscroll-contain
                     rounded-lg bg-sombre-eleve${
                       listeDeborde ? " defilement-visible" : ""
                     }`}
        >
          {resultats.length === 0 ? (
            //  ⚠️ LE MESSAGE NOMME CE QU'ON CHERCHAIT (passe nº 121) :
            //  « Aucun studio trouvé », « Aucun salon trouvé »,
            //  « Aucun artiste trouvé »… Il était écrit une fois pour
            //  toutes et parlait de « studio » même en cherchant un
            //  artiste. Chaque appelant fournit le sien ; le repli ne
            //  sert qu'aux cas non nommés.
            <p className="px-4 py-3 text-[13px] leading-relaxed text-sombre-texte-doux">
              {cherche
                ? "Searching…"
                : (messageVide ??
                  (type === "salon"
                    ? "No studio / shop found"
                    : "No artist found"))}
            </p>
          ) : (
            <ul>
              {resultats.map((fiche) => {
                const deja = (exclure ?? []).includes(fiche.id);
                return (
                <li key={fiche.id}>
                  <button
                    type="button"
                    disabled={deja}
                    onClick={() => {
                      surChoix(fiche);
                      setOuverte(false);
                      setTexte("");
                    }}
                    //  ⚠️ PLUS DE FLASH ROSE À L'APPUI (passe nº 121).
                    //  `active:bg-primaire/20` colorait la ligne en
                    //  rose au toucher — et le rose RESTAIT une seconde
                    //  sur téléphone, là où le web ne montrait rien.
                    //  Le rose est réservé aux badges sélectionnés, au
                    //  bouton final et à la ligne du sélecteur : une
                    //  ligne de liste qu'on effleure n'est aucun des
                    //  trois. L'appui éclaircit le fond d'un cran,
                    //  comme le survol, ni plus ni moins.
                    //  §1 (nº 553) — ET « UN CRAN » SE COMPTE DEPUIS LE
                    //  PANNEAU, qui vient de monter à `eleve` : le
                    //  survol y valait la MÊME couleur, il aurait
                    //  disparu (1,00). Il monte donc avec lui, à
                    //  `eleve-clair` — 1,21, soit un peu mieux que les
                    //  1,18 qu'il avait avant cette passe.
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left
                               transition-colors ${
                                 deja
                                   ? "opacity-45 cursor-not-allowed"
                                   : "hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair"
                               }`}
                  >
                    <span
                      //  §1 (nº 553) — LE LOGEMENT DE LA PHOTO SUIT LE
                      //  PANNEAU. Il se lisait d'un cran au-dessus de
                      //  lui (`eleve` sur `carte`) ; le panneau étant
                      //  passé à `eleve`, ce rond serait devenu
                      //  invisible quand la fiche n'a pas de photo — et
                      //  c'est justement le cas où il doit se voir,
                      //  puisqu'il ne montre alors qu'une initiale.
                      //  L'écart d'un cran est conservé : 1,18 hier,
                      //  1,21 aujourd'hui.
                      className="flex h-9 w-9 shrink-0 items-center justify-center
                                 overflow-hidden rounded-full bg-sombre-eleve-clair"
                    >
                      {fiche.photo_profil ? (
                        /* eslint-disable-next-line @next/next/no-img-element --
                           photo déposée par la fiche, servie telle quelle. */
                        <img
                          //  §1 (nº 718) — la petite variante.
                          src={sourceAvatar(fiche.photo_profil, AVATAR_PETIT)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="text-[13px] font-bold text-sombre-texte-doux"
                        >
                          {fiche.nom.trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium text-sombre-texte">
                        {fiche.nom}
                      </span>
                      {ligneCarte(fiche) && (
                        <span className="block truncate text-[12.5px] text-sombre-texte-doux">
                          {ligneCarte(fiche)}
                        </span>
                      )}
                    </span>
                    {deja && (
                      //  ⚠️ SANS CONTOUR (charte) : le fond d'un cran
                      //  plus clair suffit à détacher le mot.
                      //  §1 (nº 553) — « UN CRAN PLUS CLAIR » SE COMPTE
                      //  DEPUIS LE PANNEAU, passé à `eleve` : la
                      //  pastille monte avec lui, sinon elle n'aurait
                      //  plus aucun fond à montrer et il ne resterait
                      //  qu'un mot gris posé dans la ligne.
                      <span
                        className="shrink-0 rounded-full bg-sombre-eleve-clair
                                   px-2.5 py-[3px] text-[11.5px] font-semibold
                                   text-sombre-texte-doux"
                      >
                        {libelleExclu}
                      </span>
                    )}
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
