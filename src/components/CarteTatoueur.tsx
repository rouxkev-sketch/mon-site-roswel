"use client";

import { useRef } from "react";
import Link from "next/link";
import { libelleTypeFiche, PHOTO_PORTFOLIO, PORTRAIT_ROND } from "@/config/tatouage";
import { useDispositionGrille } from "@/components/AffichageMosaique";
import { legendeDeCarte, photoChoisie, photoPourStyle } from "@/lib/photo-tatoueur";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { ligneCarte } from "@/lib/adresse";
import { pincementRecent, usePincement } from "@/components/ZoomPincement";
import type { Tatoueur } from "@/lib/tatoueurs";
//  ⚠️ TEMPORAIRE (nº 175-§6) — la sonde-journal note l'ouverture d'une
//  fiche. Elle n'écrit RIEN sans `?sonde-bascule=1`.
import { noter, sauvegarderMaintenant } from "@/lib/journal-bascule";

/**
 * LA CARTE D'UN TATOUEUR
 * ======================
 * NI CONTOUR, NI CADRE : une image, et son nom dessous. La carte ne
 * s'annonce pas, elle laisse voir. C'est le parti pris des galeries
 * d'aujourd'hui — ce qui tient la grille, c'est le rythme des images,
 * pas des rectangles dessinés autour.
 *
 * L'ombre est DOUCE au repos et se creuse au survol : elle donne du
 * relief sans jamais faire un contour. AUCUN grossissement de la photo
 * au survol — le curseur main suffit à dire que la carte se clique.
 *
 * SOUS L'IMAGE : LE PORTRAIT ROND, puis deux lignes de texte — le
 * nom, puis la ville, et rien de plus. Le portrait fait EXACTEMENT la
 * hauteur de ces deux lignes. Il disparaît en deux colonnes sur
 * smartphone, où la carte est trop étroite pour lui.
 * La seule chose posée DANS l'image est une pastille sombre ALLÉGÉE,
 * angle bas DROIT : « Artiste » ou « Salon ». Ni styles, ni icône de
 * réseau — les réseaux vivent sur la fiche.
 *
 * LA PHOTO SUIT LE STYLE CHERCHÉ (voir `photoPourStyle`) : qui cherche
 * « réalisme » voit le réalisme de ce tatoueur, pas sa première image.
 *
 * TOUTE LA CARTE EST CLIQUABLE et mène à la fiche, par le lien étiré
 * en fond (`after:absolute after:inset-0`).
 *
 * SMARTPHONE (variante `mobile:`) : la grille imite Instagram — image
 * aux ANGLES DROITS, bord à bord, nom un cran plus discret (la ville
 * ne change pas). La photo s'AGRANDIT AU PINCEMENT à deux doigts
 * (usePincement) : le lien étiré recouvre l'image, c'est donc LA
 * CARTE ENTIÈRE qui écoute les doigts, et SEULE LA PHOTO qui grossit.
 * Un pincement n'ouvre JAMAIS la fiche : seul le tap simple navigue
 * (garde `pincementRecent` dans `auClic`).
 */
export function CarteTatoueur({
  tatoueur,
  styleRecherche = "",
  renduRecherche = "",
  prioritaire = false,
  phototheque = false,
  surOuverture,
  surApproche,
}: {
  /** LA VUE PHOTOTHÈQUE (nº 140) : la photo seule — ni badge, ni
      portrait, ni nom, ni adresse. SEUL LE CŒUR des favoris reste,
      dans l'angle. Le clic mène à la fiche, comme toujours. */
  phototheque?: boolean;
  tatoueur: Tatoueur;
  /** Le style demandé dans le moteur, s'il y en a un. */
  styleRecherche?: string;
  /** LE RENDU demandé, s'il n'en reste qu'un allumé : chercher de la
      couleur et tomber sur du noir et gris serait un mensonge
      d'affichage. */
  renduRecherche?: string;
  /** LES PREMIÈRES CARTES DE LA GRILLE. Leur photo est celle que
      Google mesure (le « plus grand élément affiché ») : elle ne doit
      PAS être différée — voir GrilleTatoueurs. */
  prioritaire?: boolean;
  /** GRAND ÉCRAN (≥ 1024 px) : ouvre la FENÊTRE de fiche par-dessus la
      grille au lieu de naviguer (mécanique d'Instagram). Le lien reste
      un vrai lien : clic du milieu, Ctrl+clic et moteurs de recherche
      vont toujours à la page /tatoueur/nom. */
  surOuverture?: () => void;
  /** LE SURVOL (web) : la grille en profite pour demander d'avance la
      fiche complète — au clic, la fenêtre a déjà tout. N'a aucun effet
      visible. */
  surApproche?: () => void;
}) {
  const photo = photoPourStyle(tatoueur, styleRecherche, renduRecherche);
  /** LA PHOTO EXACTE QU'ON REGARDE — c'est ELLE que le cœur
      enregistre, pas « une photo de ce tatoueur ». Absente quand la
      galerie est vide (fiche d'avant le portfolio catalogué, ou fiche
      de démonstration) : le cœur ne s'affiche alors pas — enregistrer
      une image qui n'existe pas en base n'aurait aucun sens. */
  const photoEnregistrable = photoChoisie(
    tatoueur,
    styleRecherche,
    renduRecherche
  );
  /** En « une colonne » (bouton de disposition, vrais mobiles), le
      nom et la localité GRANDISSENT sous la grande image. La valeur
      vient de L'ADRESSE (nº 203-§1b), servie par le serveur. */
  const disposition = useDispositionGrille();
  const uneColonne = disposition === "une";

  /** LE ZOOM AU PINCEMENT (vrais mobiles) : la carte écoute, la photo
      grossit — voir ZoomPincement.tsx pour la mécanique. */
  const zoneCarte = useRef<HTMLElement>(null);
  const cadrePhoto = useRef<HTMLDivElement>(null);
  const gestesPincement = usePincement({ ecoute: zoneCarte, cible: cadrePhoto });

  /** L'ADRESSE DE LA FICHE — elle EMPORTE le style cherché (?style=…) :
      la fiche ouvre alors son carrousel sur la photo de CE style, la
      continuité exacte de la photo de la carte. Calculée une fois : le
      lien l'affiche, et la navigation de document du smartphone s'en
      sert aussi. */
  const adresseFiche = (() => {
    const suite = new URLSearchParams();
    if (styleRecherche) suite.set("style", styleRecherche);
    if (renduRecherche) suite.set("rendu", renduRecherche);
    const requete = suite.toString();
    return requete
      ? `/tatoueur/${tatoueur.slug}?${requete}`
      : `/tatoueur/${tatoueur.slug}`;
  })();

  /** LA BALISE DE POPULARITÉ : chaque clic vers la fiche est signalé
      au serveur (qui dédoublonne par visiteur sur 24 h et écarte les
      robots — voir /api/tatoueur/clic). `sendBeacon` : l'envoi part
      sans retarder la navigation, et survit même au départ de la
      page. Jamais bloquant, jamais d'erreur visible. */
  function signalerClic() {
    try {
      const corps = new Blob([JSON.stringify({ slug: tatoueur.slug })], {
        type: "application/json",
      });
      if (!navigator.sendBeacon?.("/api/tatoueur/clic", corps)) {
        fetch("/api/tatoueur/clic", {
          method: "POST",
          body: JSON.stringify({ slug: tatoueur.slug }),
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Navigateur sans balise : le clic ne sera pas compté, c'est tout.
    }
  }

  /** N'intercepte QUE le clic simple, sur les APPAREILS À SOURIS
      (toute largeur de fenêtre — la fenêtre superposée sait s'y
      adapter) : toute autre combinaison (nouvel onglet, clic du
      milieu…) garde le lien, et les vrais mobiles naviguent vers la
      page. Le clic est COMPTÉ dans tous les cas — SAUF au sortir d'un
      pincement : agrandir une photo n'est pas choisir une fiche. */
  function auClic(evenement: React.MouseEvent) {
    if (pincementRecent()) {
      evenement.preventDefault();
      return;
    }
    signalerClic();
    //  ⚠️ TEMPORAIRE (nº 175-§6) — LA SONDE-JOURNAL. On note QUELLE
    //  fiche on ouvre et D'OÙ on part : sans la position de départ,
    //  aucun retour ne peut être jugé. N'écrit rien sans
    //  `?sonde-bascule=1`.
    noter(
      `OUVERTURE FICHE ${tatoueur.slug} · défilement ${Math.round(
        window.scrollY
      )} · depuis ${window.location.pathname}${window.location.search}`
    );
    //  Le journal part avec nous : la page suivante le relira.
    sauvegarderMaintenant();
    // Nouvel onglet, clic du milieu… : on ne touche à rien.
    if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;

    /**
     * SUR SMARTPHONE : LA MÊME NAVIGATION INTERNE QUE SUR LE WEB
     * ===========================================================
     * (refonte nº 191)
     * ⚠️ LE `location.assign` A ÉTÉ SUPPRIMÉ, ET AVEC LUI L'ESSAI
     * `?essai=document` qui l'allumait. Il avait été fabriqué pour une
     * hypothèse : le balayage du doigt ne révèle une capture que si la
     * page précédente est un VRAI document, donc une navigation de
     * document devait rendre l'image manquante. Éprouvée sur l'iPhone
     * du propriétaire, elle n'a rien rendu — l'écran reste noir — et
     * elle coûtait tout le reste : document rechargé, page reconstruite,
     * mosaïque et position à retrouver par des mémoires parallèles.
     *
     * Une carte est donc un LIEN ORDINAIRE, sur mobile comme sur le
     * web : on ne fait rien, et `<Link>` navigue. La mosaïque n'est pas
     * démontée par un rechargement, l'adresse porte tout ce qu'il faut
     * pour la reconstruire (critères ET nombre de pages), et le retour
     * la retrouve telle quelle.
     *
     * ⚠️ SUR LE WEB, la fiche s'ouvre en FENÊTRE superposée
     * (`surOuverture`) : la grille n'est jamais démontée. C'est le seul
     * cas où l'on intercepte le clic.
     */
    if (document.documentElement.dataset.appareil === "mobile") {
      // ⚠️ ON S'ARRÊTE ICI : sur un vrai mobile, la fenêtre superposée
      // du web n'a rien à faire. Sans cet arrêt, le lien ouvrait la
      // fenêtre au lieu de naviguer — mesuré.
      return;
    }

    if (!surOuverture) return;
    evenement.preventDefault();
    surOuverture();
  }

  return (
    <article
      ref={zoneCarte}
      // Son identité, pour la retrouver après un changement de
      // disposition (voir src/lib/carte-du-haut.ts).
      data-carte={tatoueur.id}
      className="group relative flex flex-col"
      // Le doigt garde le défilement ; le pincement, non — il zoome
      // la photo (jamais la page).
      style={{ touchAction: "pan-x pan-y" }}
      onPointerEnter={surApproche}
      {...gestesPincement}
    >
      {/* L'ENVELOPPE DE LA PHOTO — elle ne bouge JAMAIS. C'est elle
          qui porte le badge : le pincement ne transforme que le cadre
          intérieur, le badge reste donc à sa place et à sa taille,
          comme le badge de style des fiches. */}
      <div className="relative">
        {/* La photo : 4:5, elle porte la carte. Angles DROITS partout —
            la grille assume le rythme des images, sans coins adoucis.
            C'est CE CADRE ENTIER que le pincement agrandit (il passe
            par-dessus ses voisines le temps du geste, puis se range). */}
        <div
          ref={cadrePhoto}
          className="relative w-full aspect-4/5 overflow-hidden rounded-none
                     bg-sombre-eleve
                     shadow-[0_2px_12px_rgba(0,0,0,0.35)]
                     transition-shadow duration-300
                     group-hover:shadow-[0_12px_34px_rgba(0,0,0,0.55)]"
        >
          {/*  ⚠️ LA SOURCE NE DÉPEND PAS DE LA DISPOSITION (nº 175-§5),
               ET CELA DOIT LE RESTER.
               ------------------------------------------------------
               Le propriétaire voit l'écran se vider à la bascule de
               disposition — et presque jamais au bouton du texte. La
               seule différence entre les deux : la disposition change
               la LARGEUR des cartes. Si la largeur demandée changeait
               avec elle, le navigateur écarterait les images qu'il a
               pour en retélécharger d'autres, et il ne resterait que le
               fond le temps du chargement.
               ELLE NE CHANGE PAS, et c'est vérifié : `photo` est
               calculée SANS jamais lire `disposition` ; il n'y a ni
               `srcset` ni `sizes` — donc AUCUNE largeur négociée ; et
               les dimensions déclarées sont celles de la PLEINE
               LARGEUR (1080 × 1350), en deux colonnes comme en une.
               L'image chargée est donc réutilisée telle quelle, et
               seuls les styles la redimensionnent.
               ⚠️ NE JAMAIS introduire ici un `sizes`, un `srcset`, une
               largeur dans l'URL, ni une source choisie d'après
               `uneColonne` : ce serait exactement le défaut. */}
          {/* eslint-disable-next-line @next/next/no-img-element --
              les images de démonstration sont des SVG dessinés à la
              volée ; l'optimiseur de Next n'a rien à y gagner. */}
          <img
            src={photo}
            // CE QUE MONTRE VRAIMENT LA CARTE : le nom, la ville, et le
            // style (avec le rendu quand la photo est taguée) — voir
            // `legendeDeCarte`.
            alt={legendeDeCarte(tatoueur, styleRecherche, renduRecherche)}
            // LES PREMIÈRES CARTES NE SONT PAS DIFFÉRÉES : l'image
            // mesurée par Google ne doit pas attendre le défilement.
            loading={prioritaire ? "eager" : "lazy"}
            fetchPriority={prioritaire ? "high" : undefined}
            // LA PLACE EST RÉSERVÉE AVANT L'ARRIVÉE DE LA PHOTO. Le
            // cadre au-dessus impose déjà le format 4:5, mais déclarer
            // les dimensions intrinsèques rend la réserve indépendante
            // de la feuille de style : si elle tarde, la page ne bouge
            // pas davantage.
            width={PHOTO_PORTFOLIO.largeur}
            height={PHOTO_PORTFOLIO.hauteur}
            className="w-full h-full object-cover"
          />
        </div>

        {/* LE BADGE « Artiste » / « Salon » — DANS l'image, angle bas
            DROIT. UNE PASTILLE SOMBRE, ALLÉGÉE : le noir à 38 %
            seulement, avec un flou d'arrière-plan qui va chercher la
            couleur de la photo en dessous. AUCUN CONTOUR : le liseré
            blanc qu'il portait dessinait un objet là où l'on voulait
            juste une ombre posée — il se voyait plus que le texte.
            Le texte reste blanc : il se lit sur une photo sombre
            comme sur une photo claire, sans jamais s'imposer.
            LE CALAGE, tenu au pixel : `inline-flex` + `justify-center`
            + `items-center`, une HAUTEUR FIXE et `leading-none`. Le
            texte est alors centré pour de bon, horizontalement comme
            verticalement — les 10 px de retrait sont exactement les
            mêmes à gauche et à droite, et la hauteur de ligne ne
            décale plus le mot vers le haut. */}
        {!phototheque && (
          <span
            className="absolute bottom-2 right-2 inline-flex h-[22px]
                       items-center justify-center rounded-full
                       bg-black/38 backdrop-blur-md
                       px-2.5 text-[11.5px] font-semibold leading-none
                       text-white pointer-events-none select-none"
          >
            {libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement)}
          </span>
        )}

        {/* LE CŒUR — DANS l'image, angle HAUT DROIT : l'angle opposé
            au badge, celui que tous les sites d'images réservent à ce
            geste. Il est posé APRÈS le lien étiré dans l'ordre du
            document et porte `z-10` : le doigt le trouve avant la
            carte, et n'ouvre donc jamais la fiche par erreur.
            ⚠️ C'EST LE SEUL ÉLÉMENT QUE LA PHOTOTHÈQUE CONSERVE. */}
        {photoEnregistrable && (
          <div className="absolute top-2 right-2">
            <BoutonCoeurPhoto photoId={photoEnregistrable.id} />
          </div>
        )}

        {/* EN PHOTOTHÈQUE, LE LIEN DE FICHE RECOUVRE L'IMAGE : le bloc
            de texte qui portait le lien étiré est masqué, la photo
            doit rester cliquable. Même clic, même mécanique (fenêtre
            sur le web, navigation de document sur mobile), même
            préchargement — c'est `auClic` qui décide, comme pour le
            lien du nom. z-[1] : sous le cœur (z-10), au-dessus de la
            photo. */}
        {phototheque && (
          <Link
            href={adresseFiche}
            aria-label={`Voir la fiche de ${tatoueur.nom}`}
            onClick={auClic}
            className="absolute inset-0 z-[1] outline-none
                       focus-visible:outline-2 focus-visible:-outline-offset-2
                       focus-visible:outline-primaire"
          />
        )}
      </div>

      {/* SOUS LA CARTE : le portrait, puis deux lignes de texte.
          Sur mobile, l'image touche les bords : le texte reprend une
          marge intérieure, et le nom descend d'un cran (la ville,
          elle, ne bouge pas).

          LE PORTRAIT ROND, À GAUCHE — il donne un visage à chaque
          carte, ce qu'une photo de tatouage ne fait jamais.

          ⚠️ SA TAILLE EST DONNÉE EN PIXELS, LARGEUR ET HAUTEUR — et
          c'est la seule façon d'en garantir un CERCLE. La version
          précédente demandait « la hauteur du bloc de texte »
          (`self-stretch`) et « la largeur = la hauteur »
          (`aspect-square`) : deux règles qui se mordent la queue. Dans
          une rangée, le navigateur calcule les LARGEURS d'abord, les
          hauteurs ensuite ; au moment de choisir la largeur du
          portrait, la hauteur à copier n'existe pas encore. Il prenait
          donc la largeur du contenu — quelques pixels — puis
          l'étirait en hauteur : le rectangle vertical de la capture.
          Aucune largeur de carte, aucune longueur de nom ne peut
          désormais l'aplatir.

          LES DEUX LIGNES ONT UNE HAUTEUR DE LIGNE FIXE (19 px, 21 px
          en une colonne sur smartphone) et sont limitées à UNE ligne :
          le bloc de texte mesure donc toujours 40 px (44 px), soit
          exactement le portrait. Le haut du cercle est au haut du nom,
          son bas au bas de la localité — nom court, nom long ou nom
          très long tronqué, la mesure ne bouge pas.
          EN DEUX COLONNES SUR SMARTPHONE, il disparaît : la carte n'y
          fait que 190 px de large, le portrait mangerait le nom. */}
      {!phototheque && (
      <div className="pt-3 px-0.5 mobile:px-4 mobile:pt-2.5 flex items-center gap-2.5">
        <span
          className={`shrink-0 h-10 w-10 flex items-center
                     justify-center overflow-hidden rounded-full
                     bg-sombre-eleve ${
                       uneColonne ? "mobile:h-11 mobile:w-11" : "mobile:hidden"
                     }`}
        >
          {tatoueur.photo_profil ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               photo déposée par le tatoueur, servie telle quelle. */
            <img
              src={tatoueur.photo_profil}
              alt=""
              loading="lazy"
              width={PORTRAIT_ROND}
              height={PORTRAIT_ROND}
              className="h-full w-full object-cover"
            />
          ) : (
            /* LE REPLI DES FICHES D'AVANT LA PHOTO DE PROFIL :
               l'initiale, comme partout ailleurs sur le site. */
            <span
              aria-hidden="true"
              className="text-[13px] font-bold text-sombre-texte-doux"
            >
              {tatoueur.nom.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        {/* LE BLOC DE TEXTE — deux lignes, hauteur au pixel : 19 + 2 +
            19 = 40 px (21 + 2 + 21 = 44 px en une colonne sur
            smartphone). C'est cette hauteur que le portrait reprend. */}
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <h3
          className={`font-semibold text-[15px] text-sombre-texte leading-[19px] line-clamp-1 ${
            uneColonne
              ? "mobile:text-[17px] mobile:leading-[21px]"
              : "mobile:text-[14px]"
          }`}
        >
          {/* Le lien de fiche s'étire sur TOUTE la carte. Il EMPORTE
              le style cherché (?style=…) : la page de fiche ouvre
              alors son carrousel sur la photo de CE style — la
              continuité exacte de la photo de la carte. */}
          <Link
            href={adresseFiche}
            // ⚠️ SUR SMARTPHONE, LE PRÉCHARGEMENT NE SERT PLUS À RIEN :
            // le clic part en navigation de document, et ce que Next
            // précharge (la charge du routeur) ne peut pas la servir.
            // Dix-huit cartes, dix-huit demandes inutiles. Le web, lui,
            // garde son préchargement — sa fenêtre s'en sert vraiment.
            onClick={auClic}
            className="outline-none after:absolute after:inset-0 after:content-['']
                       focus-visible:underline"
          >
            {tatoueur.nom}
          </Link>
        </h3>
        <p
          className={`text-sombre-texte-doux leading-[19px] line-clamp-1 ${
            uneColonne
              ? "text-[14.5px] mobile:leading-[21px]"
              : "text-[13px]"
          }`}
        >
          {/* ⚠️ VILLE ET PAYS, RIEN D'AUTRE (passe nº 114) — et le code
              de l'État pour les pays qui l'écrivent : « Miami, FL,
              États-Unis ». La règle vit dans lib/adresse, jamais ici. */}
          {ligneCarte({
            ville: tatoueur.ville_nom,
            region: tatoueur.region,
            pays: tatoueur.pays,
            code_pays: tatoueur.code_pays,
          })}
        </p>
        </div>
      </div>
      )}
    </article>
  );
}
