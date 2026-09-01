"use client";

import { useEffect, useRef, useState } from "react";
//  §1 (nº 660) — la trace permanente : ce défilement se signe.

/**
 * LE RECADREUR DE PHOTO — le cadre des fiches, en direct
 * =======================================================
 * ⚠️ RESTAURÉ À L'IDENTIQUE (passe nº 109) depuis l'état d'avant la
 * passe « portfolio catalogué » (commit parent de 93b2c54), à la
 * demande expresse du propriétaire : cette fenêtre-là était simple et
 * fonctionnait parfaitement. UN SEUL AJOUT est autorisé et fait : le
 * bouton « Supprimer », quand la fenêtre est ouverte sur une photo
 * déjà en galerie (`surSuppression`). Tout le reste est l'original.
 *
 * S'ouvre dès qu'une photo est choisie dans le formulaire de fiche :
 * l'image se DÉPLACE au doigt ou à la souris dans le cadre, et se
 * ZOOME à la molette, au pincement ou au curseur. Ce qu'on voit dans
 * le cadre est EXACTEMENT ce qui sera enregistré — l'aperçu, c'est le
 * cadre lui-même.
 *
 * DEUX FORMES, LA MÊME MÉCANIQUE :
 *  - « portrait » — le 4:5 des photos de style (1080 × 1350) ;
 *  - « rond »     — la PHOTO DE PROFIL : le cadre est un CERCLE, et
 *    c'est la seule différence. On découpe un carré (800 × 800), que
 *    l'affichage arrondit partout ; le cercle du recadreur montre
 *    déjà ce qui restera visible.
 * Déplacement, zoom, molette, pincement, curseur : identiques.
 *
 * « Valider » découpe le cadrage dans un canvas et rend un JPEG ;
 * « Annuler » referme sans rien garder. Aucune dépendance.
 *
 * Le composant est MONTÉ à l'ouverture et démonté à la fermeture (le
 * parent le rend sous condition) : chaque ouverture repart d'un état
 * neuf — image centrée, zoom 1.
 */

/** La forme du cadre — c'est tout ce qui distingue les deux usages. */
export type FormeRecadrage = "portrait" | "rond";

/**
 * Le cadre logique, en pixels, et les fichiers produits — par forme.
 * Le cadre reste assez petit pour tenir sur un écran de 390 px.
 *
 * LA RÉSOLUTION EST CELLE D'INSTAGRAM, ET CE N'EST PAS UNE COÏNCIDENCE
 * ------------------------------------------------------------------
 * 1080 × 1350, c'est exactement le format portrait 4:5 qu'Instagram
 * sert depuis des années — le cadre dans lequel les tatoueurs
 * regardent déjà leur propre travail tous les jours. Monter plus haut
 * (1440, 2048) ne se verrait sur aucun écran de téléphone, alourdirait
 * chaque photo d'un facteur deux à quatre, et ferait payer ce poids à
 * quelqu'un en 4G. Descendre plus bas se verrait immédiatement sur les
 * grands écrans.
 *
 * ET UNE MINIATURE, 320 × 400 — le vrai gain. Une carte de mosaïque
 * fait 300 px de large : y servir une image de 1080 revient à
 * télécharger vingt fois ce qu'on affiche. À 24 cartes par page, on
 * passe d'environ 4 Mo à 300 Ko.
 *
 * LA COMPRESSION : 0,88 en pleine résolution — le palier où le JPEG
 * cesse de se voir sur des dégradés de noir et gris, qui sont
 * précisément ce que ce site montre. 0,72 pour la miniature : à cette
 * taille, personne ne distingue mieux, et le fichier fond encore.
 */
const FORMES = {
  portrait: { cadre: [320, 400], sortie: [1080, 1350], miniature: [320, 400] },
  rond: { cadre: [300, 300], sortie: [800, 800], miniature: [160, 160] },
} as const;

/** La qualité JPEG — pleine résolution, puis miniature. */
const QUALITE_PLEINE = 0.88;
const QUALITE_MINIATURE = 0.72;

const ZOOM_MINIMUM = 1;
const ZOOM_MAXIMUM = 4;

export function RecadreurPhoto({
  fichier,
  forme = "portrait",
  compteur,
  surValidation,
  surImageIllisible,
  surFermeture,
  surSuppression,
}: {
  /** La photo à recadrer (le composant n'est monté qu'avec une photo). */
  fichier: File;
  /** « portrait » (photos de style) ou « rond » (photo de profil). */
  forme?: FormeRecadrage;
  /** LA SÉRIE EN COURS (passe nº 112) — « 3 sur 12 » : présent quand
      plusieurs photos ont été choisies d'un coup et que la fenêtre
      les enchaîne. Valider passe à la suivante ; fermer abandonne ce
      qui reste (le validé est déjà en galerie). */
  compteur?: { rang: number; total: number };
  /** Reçoit le cadrage validé : la PLEINE RÉSOLUTION, et la
      MINIATURE tirée du même cadrage — donc rigoureusement le même
      cadre, à deux tailles. */
  surValidation: (image: Blob, miniature: Blob) => void;
  /** ⚠️ LA PHOTO NE SE DÉCODE PAS (passe nº 127) — un format que ce
      navigateur ne connaît pas. Sans ce signal, la fenêtre restait sur
      un cadre noir et un « Valider » sourd, indéfiniment. */
  surImageIllisible?: () => void;
  surFermeture: () => void;
  //  (⚠️ `surAutrePhoto` a disparu à la passe nº 110, avec le lien
  //  « Choisir une autre photo » qu'elle servait — voir plus bas.)
  /** ⚠️ L'AJOUT DE LA PASSE Nº 109, le seul : présent quand la
      fenêtre est ouverte sur une photo DÉJÀ EN GALERIE — le geste de
      suppression vit ici, là où on regarde la photo en grand. */
  surSuppression?: () => void;
}) {
  const rond = forme === "rond";
  /** La confirmation de suppression — une ligne qui remplace les
      boutons, jamais une fenêtre sur la fenêtre. */
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);
  /** ⚠️ UN SEUL DÉCOUPAGE À LA FOIS (passe nº 126, conservé). Deux
      tapes coup sur coup sur « Valider » relançaient deux découpages
      complets sur un fil déjà pris. Le verrou reste ; c'est le SEUL
      reste de cette passe ici.
      ⚠️ ET IL NE SE VOIT PLUS (passe nº 127). La nº 126 y avait ajouté
      une photo qui pâlit et trois boutons qui se figent : le
      propriétaire n'en veut pas — ce moment-là ne lui a jamais posé de
      problème. C'est donc une simple référence, plus un état : rien à
      l'écran, aucun rendu de plus. */
  const decoupageEnCours = useRef(false);
  /** Le découpage lancé puis ABANDONNÉ : la fenêtre a été refermée
      avant que les images ne soient prêtes. Sans ce drapeau, la photo
      entrerait en galerie alors qu'on vient de renoncer. */
  const abandonne = useRef(false);
  //  La fermeture passe par une référence : l'effet qui gèle la page ne
  //  doit dépendre d'AUCUNE fonction refabriquée à chaque rendu.
  const fermerLaFenetre = useRef(surFermeture);
  const signalerIllisible = useRef(surImageIllisible);
  useEffect(() => {
    fermerLaFenetre.current = surFermeture;
    signalerIllisible.current = surImageIllisible;
  });
  //  ⚠️ REMIS À PLAT À CHAQUE MONTAGE, pas seulement levé au démontage.
  //  En mode strict, React monte, démonte, remonte : sans cette remise
  //  à zéro, le drapeau restait levé dès la première seconde et TOUS
  //  les découpages étaient jetés en silence.
  useEffect(() => {
    abandonne.current = false;
    return () => {
      abandonne.current = true;
    };
  }, []);
  const [CADRE_LARGEUR, CADRE_HAUTEUR] = FORMES[forme].cadre;
  const [SORTIE_LARGEUR, SORTIE_HAUTEUR] = FORMES[forme].sortie;
  const [MINIATURE_LARGEUR, MINIATURE_HAUTEUR] = FORMES[forme].miniature;
  // L'image source, une fois lue (dimensions naturelles comprises).
  const [source, setSource] = useState<{
    url: string;
    largeur: number;
    hauteur: number;
  } | null>(null);
  const imageSource = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const cadre = useRef<HTMLDivElement>(null);
  // Les doigts posés (déplacement à un doigt, pincement à deux).
  const doigts = useRef(new Map<number, { x: number; y: number }>());
  const pincement = useRef<{ distance: number; zoom: number } | null>(null);

  /* ---- Charger l'image (asynchrone : jamais d'état posé en plein
          rendu d'effet). ---- */
  useEffect(() => {
    //  Photo suivante d'une série : le verrou de découpage se rouvre.
    decoupageEnCours.current = false;
    //  ⚠️ CE CHARGEMENT-CI EST-IL ENCORE LE BON ? Le nettoyage révoque
    //  l'adresse de l'objet : l'image en vol échoue alors AVEC un
    //  `error`, et il ne faut surtout pas le prendre pour un fichier
    //  illisible. Le cas se produit à chaque fois que la photo change —
    //  et, en mode strict, dès le premier montage.
    let vivant = true;
    const url = URL.createObjectURL(fichier);
    const image = new Image();
    image.onload = () => {
      if (!vivant) return;
      imageSource.current = image;
      setSource({
        url,
        largeur: image.naturalWidth,
        hauteur: image.naturalHeight,
      });
    };
    //  Un format que ce navigateur ne sait pas décoder : on le DIT, au
    //  lieu de laisser un cadre noir et un bouton sourd.
    image.onerror = () => {
      if (vivant) signalerIllisible.current?.();
    };
    image.src = url;
    return () => {
      vivant = false;
      URL.revokeObjectURL(url);
    };
  }, [fichier]);

  /* ---- Figer la page derrière + Échap pour annuler. ----
     ⚠️ UNE FOIS, ET UNE SEULE (passe nº 126). Cet effet dépendait de
     `surFermeture` — une fonction que le formulaire refabrique à CHAQUE
     rendu. Il se rejouait donc en permanence : la page était dégelée,
     regelée, et remise à sa position de défilement, plusieurs dizaines
     de fois pour une série de vingt photos (mesuré : 195 écritures sur
     le style du corps). Invisible sur un ordinateur ; sur un téléphone,
     c'est la page qui sursaute sous la fenêtre. La fermeture passe donc
     par une référence, et l'effet ne dépend plus de rien. */
  useEffect(() => {
    const positionPage = window.scrollY;
    const corps = document.body.style;
    corps.position = "fixed";
    corps.top = `-${positionPage}px`;
    corps.left = "0";
    corps.right = "0";
    corps.width = "100%";
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") fermerLaFenetre.current();
    };
    window.addEventListener("keydown", surTouche);
    return () => {
      window.removeEventListener("keydown", surTouche);
      corps.position = "";
      corps.top = "";
      corps.left = "";
      corps.right = "";
      corps.width = "";
      window.scrollTo({ top: positionPage, left: 0, behavior: "instant" });
    };
    //  Volontairement SANS dépendance : voir le commentaire ci-dessus.
  }, []);

  /* ---- La molette : zoom NON passif (il faut retenir la page). ---- */
  useEffect(() => {
    const zone = cadre.current;
    if (!zone) return;
    const surMolette = (evenement: WheelEvent) => {
      evenement.preventDefault();
      const facteur = evenement.deltaY < 0 ? 1.08 : 1 / 1.08;
      setZoom((courant) =>
        Math.min(ZOOM_MAXIMUM, Math.max(ZOOM_MINIMUM, courant * facteur))
      );
    };
    zone.addEventListener("wheel", surMolette, { passive: false });
    return () => zone.removeEventListener("wheel", surMolette);
  }, [source]);

  /** L'échelle « couvrir le cadre » : la plus petite image remplit. */
  const echelleBase = source
    ? Math.max(CADRE_LARGEUR / source.largeur, CADRE_HAUTEUR / source.hauteur)
    : 1;
  const largeurAffichee = source ? source.largeur * echelleBase * zoom : 0;
  const hauteurAffichee = source ? source.hauteur * echelleBase * zoom : 0;

  /** Le décalage est BORNÉ : l'image couvre toujours tout le cadre. */
  function borner(prochaine: { x: number; y: number }, z = zoom) {
    const l = source ? source.largeur * echelleBase * z : 0;
    const h = source ? source.hauteur * echelleBase * z : 0;
    const bordX = Math.max(0, (l - CADRE_LARGEUR) / 2);
    const bordY = Math.max(0, (h - CADRE_HAUTEUR) / 2);
    return {
      x: Math.min(bordX, Math.max(-bordX, prochaine.x)),
      y: Math.min(bordY, Math.max(-bordY, prochaine.y)),
    };
  }

  // Le zoom change (molette, curseur, pincement) : on re-borne.
  const [zoomPrecedent, setZoomPrecedent] = useState(zoom);

  /* ⚠️ LA PHOTO SUIVANTE D'UNE SÉRIE (passe nº 126) — SANS REMONTER
     LA FENÊTRE. Le parent changeait de `key` à chaque photo : la
     fenêtre était démontée puis remontée, et avec elle l'effet qui
     FIGE LA PAGE derrière (body en `position: fixed`, défilement
     mémorisé puis restitué). Vingt photos, c'était vingt gels et
     vingt dégels de la page, chacun avec son aller-retour de
     défilement — invisible sur un ordinateur, brutal sur un
     téléphone. La fenêtre reste donc MONTÉE d'un bout à l'autre de la
     série, et c'est ici qu'on repart à neuf quand le fichier change :
     image vidée, zoom à 1, cadrage recentré, confirmation refermée.
     Deux fichiers identiques choisis à la suite restent deux objets
     `File` distincts : la comparaison d'identité suffit. */
  const [fichierPrecedent, setFichierPrecedent] = useState(fichier);
  if (fichier !== fichierPrecedent) {
    setFichierPrecedent(fichier);
    setSource(null);
    setZoom(1);
    setZoomPrecedent(1);
    setPosition({ x: 0, y: 0 });
    setConfirmeSuppression(false);
    //  (le verrou de découpage, lui, se rouvre dans l'effet de
    //  chargement — on ne touche pas à une référence en plein rendu.)
  } else if (zoom !== zoomPrecedent) {
    setZoomPrecedent(zoom);
    setPosition((courante) => borner(courante, zoom));
  }

  /* ---- Doigts et souris : déplacer, pincer. ---- */
  function debut(evenement: React.PointerEvent) {
    cadre.current?.setPointerCapture(evenement.pointerId);
    doigts.current.set(evenement.pointerId, {
      x: evenement.clientX,
      y: evenement.clientY,
    });
    if (doigts.current.size === 2) {
      const [a, b] = [...doigts.current.values()];
      pincement.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
      };
    }
  }
  function mouvement(evenement: React.PointerEvent) {
    const precedent = doigts.current.get(evenement.pointerId);
    if (!precedent) return;
    const courant = { x: evenement.clientX, y: evenement.clientY };
    doigts.current.set(evenement.pointerId, courant);

    if (doigts.current.size === 2 && pincement.current) {
      // PINCEMENT : le zoom suit l'écart entre les deux doigts.
      const [a, b] = [...doigts.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const prochainZoom = Math.min(
        ZOOM_MAXIMUM,
        Math.max(
          ZOOM_MINIMUM,
          (pincement.current.zoom * distance) / pincement.current.distance
        )
      );
      setZoom(prochainZoom);
    } else if (doigts.current.size === 1) {
      // DÉPLACEMENT : l'image suit le doigt, dans les bornes.
      setPosition((courante) =>
        borner({
          x: courante.x + (courant.x - precedent.x),
          y: courante.y + (courant.y - precedent.y),
        })
      );
    }
  }
  function fin(evenement: React.PointerEvent) {
    doigts.current.delete(evenement.pointerId);
    if (doigts.current.size < 2) pincement.current = null;
  }

  /* ---- Valider : découper le cadrage dans un canvas. ---- */
  function valider() {
    const image = imageSource.current;
    //  ⚠️ UNE SEULE TAPE COMPTE (nº 126). Sans ce verrou, chaque tape
    //  supplémentaire relançait un découpage complet sur un fil déjà
    //  saturé : l'attente doublait, et la série sautait des photos —
    //  « 1 sur 5 » passait à « 3 sur 5 ».
    if (!image || !source || decoupageEnCours.current) return;
    decoupageEnCours.current = true;
    const echelle = echelleBase * zoom; // pixels affichés par pixel naturel
    const sourceLargeur = CADRE_LARGEUR / echelle;
    const sourceHauteur = CADRE_HAUTEUR / echelle;
    const sourceX = (source.largeur - sourceLargeur) / 2 - position.x / echelle;
    const sourceY = (source.hauteur - sourceHauteur) / 2 - position.y / echelle;

    /** LE MÊME DÉCOUPAGE, À DEUX TAILLES. La miniature n'est pas un
        recadrage de plus : c'est la MÊME fenêtre source, redessinée
        plus petit — ce que montre la carte est donc exactement ce que
        montrera la fiche.
        ⚠️ ET ELLE SORT BIEN DE LA PHOTO D'ORIGINE (mesuré à la passe
        nº 126). La tirer du canevas 1080 × 1350 déjà produit semblait
        deux fois moins cher — il a fallu le chronométrer pour voir que
        c'est l'inverse : relire un canevas coûte plus que réduire la
        photo une seconde fois (261 ms → 305 ms sur un téléphone
        simulé). On garde donc les deux réductions depuis la source. */
    function decouper(largeur: number, hauteur: number, qualite: number) {
      const toile = document.createElement("canvas");
      toile.width = largeur;
      toile.height = hauteur;
      const pinceau = toile.getContext("2d");
      if (!pinceau) return null;
      // Le rééchantillonnage de qualité : sans lui, une réduction au
      // quart fait crénelé sur les traits fins — c'est-à-dire sur
      // l'essentiel de ce que ce site montre.
      pinceau.imageSmoothingEnabled = true;
      pinceau.imageSmoothingQuality = "high";
      pinceau.drawImage(
        image!,
        sourceX,
        sourceY,
        sourceLargeur,
        sourceHauteur,
        0,
        0,
        largeur,
        hauteur
      );
      return new Promise<Blob | null>((resoudre) =>
        toile.toBlob(resoudre, "image/jpeg", qualite)
      );
    }

    void (async () => {
      const pleine = await decouper(
        SORTIE_LARGEUR,
        SORTIE_HAUTEUR,
        QUALITE_PLEINE
      );
      const petite = await decouper(
        MINIATURE_LARGEUR,
        MINIATURE_HAUTEUR,
        QUALITE_MINIATURE
      );
      //  La fenêtre a été refermée pendant le découpage : on jette le
      //  résultat plutôt que de faire entrer en galerie une photo à
      //  laquelle on vient de renoncer.
      if (abandonne.current) return;
      if (pleine && petite) surValidation(pleine, petite);
      //  Le découpage a échoué (canevas refusé) : le verrou se rouvre
      //  plutôt que de laisser le bouton sourd pour toujours.
      else decoupageEnCours.current = false;
    })();
  }

  return (
    /*  ██ §2 (nº 666) — LE RECADREUR PASSE AU-DESSUS DE TOUT CE QUI
         PEUT L'OUVRIR ██
         ==============================================================
         LE SYMPTÔME DU PROPRIÉTAIRE : au doigt, choisir ou prendre une
         photo depuis « Éditer », valider l'aperçu du téléphone — et
         RIEN. On restait sur « Éditer », comme si le recadreur ne
         s'ouvrait jamais.
         LA CAUSE, ET IL S'OUVRAIT BEL ET BIEN : il était DERRIÈRE. Ce
         cadre valait `z-[80]`, et il l'a toujours valu ; ce qui a
         changé, c'est SA PLACE. Jusqu'à la nº 658 il était DESCENDANT
         de la surface qui l'ouvre — dans son contexte d'empilement,
         donc au-dessus d'elle quoi qu'il arrive. Depuis, un portail le
         monte dans le corps du document (c'est ce qui l'a réparé au
         doigt : un `fixed` enfermé dans une page recalée sur
         `visualViewport` se pose n'importe où). Il y devient le FRÈRE
         des pages plein écran des fenêtres de la barre — et
         celles-là valent `z-[85]` (SelecteurLangue, FenetreIdentite,
         FenetreNotifications). Quatre-vingts sous quatre-vingt-cinq :
         il était peint dessous, invisible, et l'écran ne bougeait pas.
         LA RÈGLE, DÉSORMAIS : le recadreur couvre TOUT CE QUI PEUT
         L'OUVRIR. `z-[90]` — au-dessus des pages de la barre (85) et
         des fenêtres superposées (80), sous la fenêtre d'envoi (95) et
         sous le trait de chargement (96), qui doivent rester visibles
         par-dessus n'importe quoi.
         ⚠️ CE RANG N'EST PAS INVENTÉ : `GardeSaisie` (le « tu as des
         modifications non enregistrées ») le porte déjà. La feuille ne
         gagne donc pas un octet — vérifié, elle est identique à celle
         de la nº 665. Et les deux ne peuvent pas se croiser : la garde
         de saisie naît quand on cherche à QUITTER, or le recadreur
         couvre l'écran — tant qu'il est là, aucun lien n'est cliquable.
         ⚠️ POURQUOI CORRIGER ICI ET PAS CHEZ « ÉDITER » : baisser la
         page à 80 la ferait passer sous « Mon compte », d'où elle
         s'ouvre. C'est le recadreur qui a changé de niveau, c'est à lui
         de dire le sien.
         ⚠️ LE PORTFOLIO N'EST PAS TOUCHÉ : `BlocPortfolio` monte ce
         composant dans le flux de sa page, sans portail — un rang plus
         haut dans un contexte d'empilement où il était déjà seul ne
         change rien à ce qu'on voit. */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recadrer la photo"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={surFermeture}
        className="absolute inset-0 bg-black/85"
      />
      <div
        className="relative w-full max-w-[380px] rounded-2xl bg-sombre-carte p-5
                   shadow-[0_24px_80px_rgba(0,0,0,0.6)]
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
      >
        {/* ⚠️ DEUX TITRES, DEUX NOMS DE CHOSES (passes nº 110 puis 111).
            « NOUVELLE PUBLICATION » pour une photo de portfolio,
            « PHOTO DE PROFIL » pour l'autre : le vocabulaire de tout le
            monde, et il dit CE QU'ON FABRIQUE plutôt que le geste
            technique à faire.
            PLUS AUCUN SOUS-TITRE (nº 111) : « déplace, zoome, ce que tu
            vois est ce qui sera montré » expliquait ce que le cadre
            montre déjà — on le voit en le faisant. */}
        <div className="flex items-baseline justify-between gap-3">
          {/* ⚠️ PLUS DE CAPITALES (passe nº 131) : un TITRE porte une
              seule majuscule, celle du premier mot — comme ceux de la
              page Sécurité et des blocs du formulaire. Les capitales
              espacées restent le registre des INTERTITRES (13-14 px,
              gris doux), pas celui d'un titre de fenêtre à 17 px. */}
          <h2 className="text-[17px] font-bold tracking-tight text-sombre-texte">
            {rond ? "Photo de profil" : "Nouvelle publication"}
          </h2>
          {/* LE COMPTEUR DE SÉRIE — où l'on en est, d'un coup d'œil :
              la fenêtre enchaîne les photos sans revenir à la grille. */}
          {compteur && (
            <span
              role="status"
              className="shrink-0 text-[13.5px] font-semibold tabular-nums
                         text-sombre-texte-doux"
            >
              {compteur.rang} sur {compteur.total}
            </span>
          )}
        </div>

        {/* LE CADRE = L'APERÇU. Ce qui s'y voit sera l'image. */}
        <div
          ref={cadre}
          onPointerDown={debut}
          onPointerMove={mouvement}
          onPointerUp={fin}
          onPointerCancel={fin}
          style={{
            width: CADRE_LARGEUR,
            height: CADRE_HAUTEUR,
            touchAction: "none",
          }}
          className={`relative mx-auto mt-4 overflow-hidden bg-black
                     cursor-grab active:cursor-grabbing select-none ${
                       // LE CADRE EST LE MASQUE : rond pour la photo de
                       // profil — et BORDS CARRÉS pour une photo de
                       // galerie (passe nº 112) : la photo se recadre
                       // telle qu'elle s'affichera, au pixel près,
                       // angles compris.
                       rond ? "rounded-full" : ""
                     }`}
        >
          {source && (
            /* eslint-disable-next-line @next/next/no-img-element --
               aperçu local (URL d'objet), jamais optimisable. */
            <img
              src={source.url}
              alt=""
              draggable={false}
              style={{
                width: largeurAffichee,
                height: hauteurAffichee,
                maxWidth: "none",
                // Centrée dans le cadre, PUIS décalée du déplacement :
                // les % de translate se réfèrent à l'image elle-même.
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
              }}
              className="absolute left-1/2 top-1/2"
            />
          )}
        </div>

        {/* LE ZOOM : − curseur + (la molette et le pincement font pareil). */}
        <div className="mt-4 flex items-center gap-3">
          <span aria-hidden="true" className="text-sombre-texte-doux text-lg leading-none">
            −
          </span>
          <input
            type="range"
            min={ZOOM_MINIMUM}
            max={ZOOM_MAXIMUM}
            step={0.01}
            value={zoom}
            onChange={(evenement) => setZoom(Number(evenement.target.value))}
            aria-label="Zoom"
            className="flex-1 accent-primaire"
          />
          <span aria-hidden="true" className="text-sombre-texte-doux text-lg leading-none">
            +
          </span>
        </div>

        {confirmeSuppression ? (
          /* LA CONFIRMATION TIENT SUR LA LIGNE DES BOUTONS (passe
             nº 121). Elle s'empilait au-dessus d'eux — question sur
             une ligne, boutons sur une autre : la fenêtre grandissait
             de trente pixels et TOUTE la mise en page sautait, image
             comprise, au moment précis où l'on hésite.
             Elle occupe donc EXACTEMENT la place des trois boutons :
             la question à gauche (là où était « Supprimer »), les deux
             réponses à droite (là où étaient « Annuler » et
             « Valider »). La hauteur ne bouge pas d'un pixel —
             `min-h-[46px]`, celle de la capsule qu'elle remplace.
             RÈGLE DES BOUTONS : les deux actions en texte brut, le
             rouge pour celle qui détruit. */
          <div className="mt-4 flex min-h-[46px] items-center justify-between gap-3">
            {/* ⚠️ « SUPPRIMER ? », ET RIEN DE PLUS (passe nº 122).
                « Supprimer cette photo ? » nommait ce que la fenêtre
                montre déjà en grand, juste au-dessus. Deux mots
                suffisent, et la question tient sans serrer les deux
                réponses qui la suivent sur la même ligne. */}
            <p className="min-w-0 text-[14px] font-semibold text-sombre-texte">
              Supprimer&nbsp;?
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmeSuppression(false)}
                className="px-2 min-h-[44px] text-[14px] font-semibold
                           text-sombre-texte-doux transition-colors
                           hover:text-sombre-texte"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={surSuppression}
                className="px-2 min-h-[44px] text-[14px] font-semibold
                           text-erreur transition-colors hover:opacity-75"
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          //  RÈGLE DES BOUTONS, enfin appliquée ici (passe nº 112) :
          //  l'action positive porte la capsule pleine, à sa mesure ;
          //  annuler est un TEXTE BRUT — les deux ne pèsent plus
          //  pareil.
          //  ⚠️ ET « SUPPRIMER » LES REJOINT SUR LA MÊME LIGNE (passe
          //  nº 120), TOUT À GAUCHE : il occupait une ligne entière
          //  sous les boutons, pleine largeur et centrée — un geste
          //  destructeur avec plus de place que « Valider ». Trois
          //  poids, trois places : détruire à gauche, en texte rouge ;
          //  renoncer à droite, en texte gris ; valider au bout, seule
          //  capsule pleine.
          <div className="mt-4 flex items-center justify-between gap-3">
            {surSuppression ? (
              <button
                type="button"
                onClick={() => setConfirmeSuppression(true)}
                className="px-2 min-h-[44px] text-[14px] font-semibold
                           text-erreur transition-colors hover:opacity-75"
              >
                Supprimer
              </button>
            ) : (
              //  Sans suppression possible (une photo qu'on dépose),
              //  la place reste vide : Annuler et Valider ne bougent
              //  pas d'un pixel.
              <span aria-hidden="true" />
            )}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={surFermeture}
                className="px-2 min-h-[44px] text-[14px] font-semibold
                           text-sombre-texte-doux transition-colors
                           hover:text-sombre-texte"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={valider}
                disabled={!source}
                className="inline-flex items-center rounded-full bg-primaire px-7
                           min-h-[46px] text-white font-semibold transition-colors
                           hover:bg-primaire-fonce disabled:opacity-60"
              >
                Valider
              </button>
            </div>
          </div>
        )}

        {/* ⚠️ « CHOISIR UNE AUTRE PHOTO » A ÉTÉ RETIRÉ (passe nº 110).
            Le lien doublait « Annuler » : refermer la fenêtre ramène
            sur la tuile d'ajout, qui rouvre le sélecteur de fichier —
            un geste au lieu de deux, et une ligne de moins sous les
            boutons. */}

        {/* ⚠️ « SUPPRIMER CETTE PHOTO » N'EST PLUS ICI (passe nº 120) :
            il a rejoint la ligne des boutons, tout à gauche — voir
            plus haut. */}
      </div>
    </div>
  );
}
