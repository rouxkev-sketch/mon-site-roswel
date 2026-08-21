"use client";

import { useEffect, useRef, useState } from "react";
import { EnteteModale, FenetreModale } from "@/components/FenetreModale";
import { FenetreDeVerre } from "@/components/SurfaceDeVerre";
import {
  IconePartageEmail,
  IconePartageFacebook,
  IconePartageSms,
  IconePartageWhatsApp,
} from "@/components/IconeReseau";
import {
  IconeBulleMessage,
  IconeEnveloppe,
  IconeFacebook,
  IconeLien,
  IconePartage,
  IconePartageIOS,
  IconeWhatsApp,
} from "@/components/Icones";
import { COULEURS, MARQUE } from "@/config/roswel";

/**
 * VRAI APPAREIL MOBILE ?
 * ----------------------
 * La question n'est PAS « la fenêtre est-elle étroite ? » ni « le
 * navigateur connaît-il navigator.share ? » : macOS connaît le partage
 * natif, et un MacBook dont on rétrécit la fenêtre affiche la mise en
 * page smartphone tout en restant un ordinateur. Deux conditions donc,
 * et les deux à la fois :
 *
 *  1. une SIGNATURE DE NAVIGATEUR mobile (iOS, iPadOS, Android…) ;
 *     l'iPad se déclare « Macintosh » depuis iPadOS 13 — seul son
 *     nombre de points de contact le trahit ;
 *  2. un POINTEUR PRINCIPAL TACTILE. Un PC portable à écran tactile
 *     garde sa souris comme pointeur principal : il n'est donc jamais
 *     pris pour un mobile.
 *
 * Aucune largeur de fenêtre n'intervient.
 */
function surAppareilMobile(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }
  const signature = navigator.userAgent;
  const mobileConnu =
    /Android|iPhone|iPod|iPad|Windows Phone|IEMobile|BlackBerry|Opera Mini|Mobile/i.test(
      signature
    );
  // iPadOS 13+ : se présente comme un Mac, mais un vrai Mac n'a AUCUN
  // point de contact (il en annonce 0). Le second garde-fou ci-dessous
  // écarte de toute façon un éventuel Mac relié à un écran tactile :
  // sa souris resterait le pointeur principal.
  const iPadDeguiseEnMac =
    /Macintosh/i.test(signature) && navigator.maxTouchPoints > 0;
  if (!mobileConnu && !iPadDeguiseEnMac) return false;

  return (
    navigator.maxTouchPoints > 0 &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * LE BOUTON PARTAGE
 * -----------------
 * Le comportement dépend de l'APPAREIL RÉEL, jamais de la largeur de
 * la fenêtre :
 * - TÉLÉPHONE ou TABLETTE (iOS, iPadOS, Android) : ouvre la feuille de
 *   partage NATIVE du système (Web Share API) — SMS, WhatsApp, Mail,
 *   AirDrop… C'est le geste attendu là-bas, quel que soit l'affichage.
 * - ORDINATEUR (macOS, Windows, Linux), Y COMPRIS en fenêtre étroite
 *   affichant la mise en page smartphone : JAMAIS de fenêtre de
 *   partage. Le lien est copié dans le presse-papiers et une petite
 *   bulle « Lien copié ! » le confirme (2 s).
 * Sur mobile, si la feuille native ÉCHOUE (partage refusé par le
 * navigateur, données non partageables…), on ne laisse pas la personne
 * les mains vides : repli sur la copie du lien. Une ANNULATION
 * volontaire, elle, ne déclenche rien — c'est un choix, pas une panne.
 *
 * Deux habillages :
 * - « fiche » : disque blanc posé sur la photo (comme le bouton retour) ;
 *   partage la PAGE COURANTE (on est déjà sur la fiche) ;
 * - « carte » : bouton carré aux coins arrondis, MÊME gabarit que les
 *   boutons Appeler / Whatsapp (48 px, fond blanc, contour gris fin),
 *   icône grise ; partage l'URL de la fiche indiquée par `cheminFiche`
 *   (ex. « /artisan/hugo-blanc-plombier-ecully »), résolue sur
 *   l'origine du site.
 */
/**
 * À PARTIR DE CETTE LARGEUR, le partage passe par NOTRE fenêtre.
 * 560 px : la même charnière que le bandeau de la fiche artisan, où
 * la fenêtre de partage est née.
 */
export const LARGEUR_FENETRE_PARTAGE = 560;

export function BoutonPartageFiche({
  nomArtisan,
  cheminFiche,
  variante = "fiche",
  couleurContour = COULEURS.bordureCarte,
  sansContour = false,
  bulleEnDessous = false,
  avecFenetre = false,
  metier,
  commune,
  marque = MARQUE.nom,
  sombre = false,
  contour = false,
  tailleIcone = 22,
}: {
  nomArtisan: string;
  /** Chemin de la fiche à partager (variante « carte ») ; à défaut, la
      page courante (variante « fiche »). */
  cheminFiche?: string;
  /** §1-2 (nº 458) — « icone » : la flèche de partage NUE (le dessin
      `IconePartageIOS`, la flèche vers le haut), sans disque ni fond —
      cible de 40 px, trait couleur du texte. C'est l'écriture UNIQUE
      des deux emplacements de la passe : la colonne gauche de la vue
      photo mobile et la rangée du profil, à gauche de « Suivre ».
      MÊME action `partager` que les autres habillages : rien d'autre
      ne change. */
  variante?: "fiche" | "carte" | "icone";
  /** §2 (nº 459) — LA TAILLE DU GLYPHE de la variante « icone » (les
      autres habillages ne la lisent pas). 22 par défaut (le profil, à
      gauche de « Suivre ») ; la vue photo du doigt demande 28 — la
      flèche nettement visible, la cible de 40 px inchangée. */
  tailleIcone?: number;
  couleurContour?: string;
  /** AUCUN contour (variante « carte ») : fond blanc seul — le rendu du
      bandeau de la fiche artisan ≥ 768 px. Les CARTES gardent le leur. */
  sansContour?: boolean;
  /** Bulle « Lien copié ! » SOUS le bouton au lieu d'au-dessus. Utile
      quand le bouton est déjà tout en haut de son encadré (bandeau de
      la fiche) : au-dessus, la bulle sortirait de la fiche. */
  bulleEnDessous?: boolean;
  /** OUVRE LA FENÊTRE DE PARTAGE — mais SEULEMENT à partir de
      LARGEUR_FENETRE_PARTAGE (560 px). En dessous, le comportement
      d'origine est conservé : feuille de partage du système sur
      téléphone, sinon copie du lien. Le seuil est vérifié AU CLIC,
      jamais au rendu : un même bouton peut ainsi servir sur toutes les
      largeurs (c'est le cas de celui des cartes). */
  avecFenetre?: boolean;
  /** Métier et commune de l'artisan : ils nourrissent le message
      pré-rempli du SMS et de l'e-mail. */
  metier?: string;
  commune?: string;
  /** LE NOM DE MARQUE cité dans le message partagé. Par défaut celui
      des artisans ; yokofolio passe le sien — un site ne partage pas
      une fiche « sur » un produit qui n'est pas le sien. */
  marque?: string;
  /** Habillage SOMBRE (yokofolio) : disque anthracite translucide qui
      tient aussi posé sur une photo — même famille que les boutons de
      la barre. Les fiches artisans ne passent jamais cette option. */
  sombre?: boolean;
  /** Habillage CONTOUR (yokofolio, web) : cercle blanc autour de
      l'icône blanche, fond de la couleur du site — le pendant exact du
      bouton retour « contour » posé devant le fil d'Ariane. Au survol,
      cercle et icône passent en rose. Prime sur `sombre`. */
  contour?: boolean;
}) {
  const [copie, setCopie] = useState(false);
  /** « Copié ! » du bouton intégré au champ de lien (fenêtre sombre). */
  const [copieChamp, setCopieChamp] = useState(false);
  const [fenetreOuverte, setFenetreOuverte] = useState(false);
  // Le retour visuel DANS la fenêtre : « Lien copié » ou « Message
  // copié », au même endroit dans les deux cas.
  const [retour, setRetour] = useState<string | null>(null);
  const declencheur = useRef<HTMLButtonElement>(null);

  /** L'URL PUBLIQUE de la fiche : le chemin résolu sur l'origine du
      site (https://roswel.fr/artisan/…), sinon la page courante. */
  function urlFiche() {
    return cheminFiche
      ? new URL(cheminFiche, window.location.origin).href
      : window.location.href;
  }

  /** Le message pré-rempli du SMS et de l'e-mail : nom, métier,
      commune et lien — dans cet ordre. */
  function messagePartage() {
    const qualite = [metier, commune ? `à ${commune}` : null]
      .filter(Boolean)
      .join(" ");
    return `${nomArtisan}${qualite ? ` — ${qualite}` : ""} sur ${marque} : ${urlFiche()}`;
  }

  /** Copie un texte dans le presse-papiers (lien ou message) */
  async function copierTexte(texte: string) {
    try {
      await navigator.clipboard.writeText(texte);
    } catch {
      // navigateur trop ancien : sélection de secours
      const zone = document.createElement("textarea");
      zone.value = texte;
      document.body.appendChild(zone);
      zone.select();
      document.execCommand("copy");
      zone.remove();
    }
  }

  /** Copie le lien et affiche la bulle « Lien copié ! » (2 s) —
      le comportement historique, hors fenêtre. */
  async function copierLeLien(url: string) {
    await copierTexte(url);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  /** Ouvre la fenêtre (et garde sous la main le bouton à qui rendre
      le focus en la refermant). */
  function ouvrirFenetre(evenement?: React.MouseEvent) {
    evenement?.preventDefault();
    evenement?.stopPropagation();
    declencheur.current?.focus();
    setRetour(null);
    setFenetreOuverte(true);
  }

  function fermerFenetre() {
    setFenetreOuverte(false);
    setTimeout(() => setRetour(null), 200);
  }

  /** Un onglet neuf, sans lien retour vers notre page (sécurité) */
  function ouvrirOnglet(adresse: string) {
    window.open(adresse, "_blank", "noopener,noreferrer");
  }

  /** SMS : on tente d'ouvrir l'application de messages. Sur un
      ORDINATEUR, ce type de lien ne mène souvent nulle part — aucune
      application n'y est associée. On observe donc si la page perd la
      main dans la seconde : si rien ne s'est passé, on copie le message
      et on l'annonce au même endroit que « Lien copié ». */
  function ouvrirSms() {
    const texte = messagePartage();
    let partie = false;
    const marquer = () => {
      partie = true;
    };
    window.addEventListener("blur", marquer, { once: true });
    document.addEventListener("visibilitychange", marquer, { once: true });
    //  `assign(...)` et non `href = ...` : même effet, et l'analyse de
    //  React ne voit plus une mutation faite pendant le rendu.
    window.location.assign(`sms:?&body=${encodeURIComponent(texte)}`);
    setTimeout(async () => {
      window.removeEventListener("blur", marquer);
      document.removeEventListener("visibilitychange", marquer);
      if (partie) return;
      await copierTexte(texte);
      setRetour("Message copié");
    }, 900);
  }

  /** E-mail : objet et corps pré-remplis */
  function ouvrirEmail() {
    const objet = `${nomArtisan} sur ${marque}`;
    window.location.assign(
      `mailto:?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(messagePartage())}`
    );
  }

  async function partager(evenement?: React.MouseEvent) {
    // Le bouton peut vivre dans une zone cliquable : ne jamais ouvrir
    // la fiche ni déclencher une navigation parente.
    evenement?.preventDefault();
    evenement?.stopPropagation();

    // FENÊTRE DE PARTAGE (≥ 560 px) : elle remplace aussi bien la
    // feuille du système que la copie silencieuse. Sous ce seuil —
    // smartphone — rien ne change : la feuille native reste ce qu'il y
    // a de mieux, elle donne accès à TOUTES les applications du
    // téléphone. La mesure se fait ici, au clic, et non au rendu : le
    // serveur ne connaît pas la largeur de l'écran, et un affichage
    // qui en dépendrait provoquerait une incohérence au chargement.
    if (avecFenetre && window.innerWidth >= LARGEUR_FENETRE_PARTAGE) {
      ouvrirFenetre(evenement);
      return;
    }

    const url = urlFiche();
    const donnees = {
      title: `${nomArtisan} sur ${marque}`,
      text: `Découvrez ${nomArtisan} sur ${marque}`,
      url,
    };

    // TÉLÉPHONE / TABLETTE uniquement : la feuille du système.
    // Sur ordinateur, on ne la propose JAMAIS — même si le navigateur
    // sait la faire (c'est le cas de macOS) et même en fenêtre étroite.
    if (
      surAppareilMobile() &&
      navigator.share &&
      navigator.canShare?.(donnees)
    ) {
      try {
        await navigator.share(donnees);
        return;
      } catch (erreur) {
        // ANNULATION volontaire : la personne a refermé la feuille,
        // c'est un choix — on ne fait rien de plus.
        if (erreur instanceof DOMException && erreur.name === "AbortError") {
          return;
        }
        // Tout autre échec : on enchaîne sur la copie du lien.
      }
    }

    // Ordinateur, ou repli après un partage natif en échec
    await copierLeLien(url);
  }


  /** Les CINQ moyens de partage — partagés par les deux habillages de
      la fenêtre (clair artisans, sombre yokofolio). `court` : le
      libellé bref sous les icônes rondes de la fenêtre sombre. */
  const actionsPartage = [
    {
      cle: "lien",
      libelle: "Copier le lien",
      court: "Copier",
      icone: <IconeLien taille={20} />,
      action: async () => {
        await copierTexte(urlFiche());
        setRetour("Lien copié");
      },
    },
    {
      cle: "whatsapp",
      libelle: "WhatsApp",
      court: "WhatsApp",
      icone: <IconeWhatsApp taille={20} />,
      action: () =>
        ouvrirOnglet(`https://wa.me/?text=${encodeURIComponent(messagePartage())}`),
    },
    { cle: "sms", libelle: "SMS", court: "SMS", icone: <IconeBulleMessage taille={20} />, action: ouvrirSms },
    { cle: "email", libelle: "E-mail", court: "E-mail", icone: <IconeEnveloppe taille={20} />, action: ouvrirEmail },
    {
      cle: "facebook",
      libelle: "Facebook",
      court: "Facebook",
      icone: <IconeFacebook taille={20} />,
      action: () =>
        ouvrirOnglet(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlFiche())}`
        ),
    },
  ];

  /** La fenêtre yokofolio ferme aussi à Échap (la coque claire des
      artisans le fait via FenetreModale ; ici, la coque est à nous). */
  const fenetreSombreActive = fenetreOuverte && avecFenetre && (sombre || contour);
  useEffect(() => {
    if (!fenetreSombreActive) return;
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") fermerFenetre();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
     
  }, [fenetreSombreActive]);

  /* ----- LA FENÊTRE DE PARTAGE, CHARTE SOMBRE (yokofolio) -----
     REFAITE À LA CHARTE (nº 241-§4B). DISPARUS : le titre, la croix,
     l'icône de copie (la rangée « Copier le lien » — le champ du bas
     copie déjà), le voile à 80 %, la plaque opaque et son fondu
     d'opacité (le piège de la nº 234). Elle se referme par un appui à
     côté, comme la fenêtre d'adresse — c'est FenetreDeVerre qui porte
     tout : plaque à 22 %, flou, saturation et liseré de fenêtre,
     voile à 25 % porteur du fondu, portail.
     CE QUI RESTE, ET RIEN D'AUTRE : WhatsApp, SMS, e-mail, Facebook —
     quatre ACTIONS INTERMÉDIAIRES à taille naturelle (aucune capsule
     rose ici, le rose n'a rien à y faire) — puis le champ contenant
     le lien, badge « Copier » À L'INTÉRIEUR, contre son bord droit.
     LES QUATRE ICÔNES : l'écriture unique de la nº 240 (IconeReseau,
     tracé 1,8 / grille 24 / currentColor) — aucun logo de couleur,
     aucun fond de marque, aucun disque. */
  const actionsFenetreSombre = [
    //  §3 (nº 242) — 28 px : à 22 elles se perdaient dans la fenêtre.
    //  Même écriture, même grille de 24, même épaisseur apparente —
    //  seul le rendu grandit.
    { cle: "whatsapp", libelle: "WhatsApp", icone: <IconePartageWhatsApp taille={28} /> },
    { cle: "sms", libelle: "SMS", icone: <IconePartageSms taille={28} /> },
    { cle: "email", libelle: "E-mail", icone: <IconePartageEmail taille={28} /> },
    { cle: "facebook", libelle: "Facebook", icone: <IconePartageFacebook taille={28} /> },
  ].map((entree) => ({
    ...entree,
    action: actionsPartage.find((a) => a.cle === entree.cle)?.action,
  }));

  const fenetreSombre = fenetreSombreActive ? (
    <FenetreDeVerre
      ariaLabel="Partager cette fiche"
      surFermeture={fermerFenetre}
      largeur="max-w-[440px]"
    >
      {/*  LES QUATRE PARTAGES — l'icône, le mot dessous ; au survol,
           le voile translucide des lignes de menu (nº 237-§2), jamais
           un aplat sur la plaque. */}
      <div className="flex items-start justify-between gap-1">
        {actionsFenetreSombre.map(({ cle, libelle, icone, action }) => (
          <button
            key={cle}
            type="button"
            onClick={action}
            className="flex flex-1 flex-col items-center gap-2 rounded-xl
                       px-2 py-3 text-sombre-texte
                       transition-colors hover:bg-white/5 active:bg-white/10"
          >
            {icone}
            <span className="text-[12px] leading-tight text-sombre-texte-doux">
              {libelle}
            </span>
          </button>
        ))}
      </div>

      {/*  LE LIEN, badge « Copier » DANS le champ, contre le bord
           droit. Le champ est un voile translucide (blanc 8 %, le gris
           foncé des badges éteints) — un fond opaque ferait une boîte
           sur la plaque. Le badge : `data-verre-capsule`, l'unique
           écriture — blanc 20 % NU (la lumière de la nº 242 est
           retirée par la nº 244-§1), le survol qui éclaircit d'un
           cran sans toucher au texte, l'état enfoncé au doigt, SANS
           flou propre. */}
      <div
        className="mt-5 flex items-center gap-2 rounded-xl bg-white/[0.08]
                   pl-4 pr-1.5 py-1.5"
      >
        <span
          className="min-w-0 flex-1 truncate text-[13px] text-sombre-texte-doux"
          title={typeof window === "undefined" ? undefined : urlFiche()}
        >
          {typeof window === "undefined" ? "" : urlFiche()}
        </span>
        <button
          type="button"
          aria-live="polite"
          onClick={async () => {
            await copierTexte(urlFiche());
            setCopieChamp(true);
            setTimeout(() => setCopieChamp(false), 2000);
          }}
          data-verre-capsule=""
          className="shrink-0 rounded-full px-4 min-h-[36px] text-[13px]
                     font-semibold text-sombre-texte"
        >
          {copieChamp ? "Copié !" : "Copier"}
        </button>
      </div>
    </FenetreDeVerre>
  ) : null;

  /* ----- LA FENÊTRE DE PARTAGE, CHARTE CLAIRE (artisans) -----
     Même coque que « Signaler » (FenetreModale) : voile, encadré,
     arrondis, ombre, largeur, Échap, clic extérieur, focus et blocage
     du défilement. Seul le contenu diffère. */
  const fenetre = avecFenetre && !(sombre || contour) ? (
    <FenetreModale
      ouvert={fenetreOuverte}
      surFermeture={fermerFenetre}
      idTitre="titre-partage"
      largeur="moyenne"
    >
      <>
        <EnteteModale
          idTitre="titre-partage"
          titre="Partager cette fiche"
          surFermeture={fermerFenetre}
        />

        {/* Les cinq moyens de partage, dans cet ordre. Même gabarit
            pour les cinq : contour fin, coins arrondis, fond blanc,
            icône puis libellé, le tout aligné à gauche. La boîte de
            l'icône a une largeur FIXE : les libellés tombent donc tous
            sur la même verticale. Aucune couleur de marque — le gris
            du site, comme le reste de la fiche. */}
        <div className="mt-6 flex flex-col gap-3">
          {actionsPartage.map(({ cle, libelle, icone, action }) => (
            <button
              key={cle}
              type="button"
              onClick={action}
              className="w-full min-h-[52px] rounded-2xl border border-bordure bg-fond flex items-center gap-3 px-4 text-sm font-semibold text-encre hover:bg-fond-doux transition-colors"
            >
              <span className="w-5 shrink-0 flex justify-center text-encre-douce">
                {icone}
              </span>
              {libelle}
            </button>
          ))}
        </div>

        {/* Le retour visuel — « Lien copié » comme « Message copié »
            s'affichent ICI, au même endroit. La fenêtre reste ouverte :
            on doit pouvoir lire la confirmation. */}
        <p
          role="status"
          aria-live="polite"
          className="mt-4 h-5 text-center text-xs text-encre-douce"
        >
          {retour}
        </p>
      </>
    </FenetreModale>
  ) : null;

  if (variante === "icone") {
    return (
      <div className="relative shrink-0">
        <button
          ref={declencheur}
          type="button"
          onClick={partager}
          aria-haspopup={avecFenetre ? "dialog" : undefined}
          aria-label={`Partager la fiche de ${nomArtisan}`}
          //  §1-2 (nº 458) — l'icône nue sur le fond de la page : la
          //  cible tactile de 40 px (le gabarit du fanion des cartes),
          //  le trait au blanc du site, un bref enfoncement — aucun
          //  disque, aucun verre.
          className="flex h-10 w-10 items-center justify-center
                     text-sombre-texte transition-transform active:scale-95"
        >
          <IconePartageIOS taille={tailleIcone} />
        </button>
        {copie && (
          <span
            role="status"
            className="absolute top-11 right-0 whitespace-nowrap rounded-full bg-encre text-white text-xs font-medium px-3 py-1.5 shadow-lg z-20"
          >
            Lien copié !
          </span>
        )}
        {fenetre}
        {fenetreSombre}
      </div>
    );
  }

  if (variante === "carte") {
    return (
      <div className="relative shrink-0">
        <button
          ref={declencheur}
          type="button"
          onClick={partager}
          aria-haspopup={avecFenetre ? "dialog" : undefined}
          aria-label={`Partager la fiche de ${nomArtisan}`}
          className={`w-12 h-12 rounded-xl bg-fond flex items-center justify-center text-encre-douce hover:bg-fond-doux active:scale-95 transition ${
            sansContour ? "" : "border"
          }`}
          style={sansContour ? undefined : { borderColor: couleurContour }}
        >
          <IconePartageIOS taille={20} />
        </button>

        {copie && (
          <span
            role="status"
            className={`absolute right-0 whitespace-nowrap rounded-full bg-encre text-white text-xs font-medium px-3 py-1.5 shadow-lg z-20 ${
              bulleEnDessous ? "top-full mt-2" : "bottom-full mb-2"
            }`}
          >
            Lien copié !
          </span>
        )}
        {fenetre}
        {fenetreSombre}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Un disque, trois habillages : blanc ombré (artisans), NOIR
          TRANSLUCIDE (yokofolio, posé sur la photo — la recette EXACTE
          des flèches du carrousel, pour que photo, flèches et partage
          parlent d'une seule voix) ou cercle blanc sur le fond du site
          (yokofolio, web). */}
      <button
        ref={declencheur}
        type="button"
        onClick={partager}
        aria-haspopup={avecFenetre ? "dialog" : undefined}
        aria-label={`Partager la fiche de ${nomArtisan}`}
        className={
          contour
            ? "w-10 h-10 rounded-full border border-white bg-sombre-fond flex items-center justify-center text-white hover:border-primaire hover:text-primaire transition-colors"
            : sombre
              ? "w-10 h-10 rounded-full bg-sombre-fond/55 backdrop-blur flex items-center justify-center text-sombre-texte hover:bg-sombre-eleve/75 transition-colors"
              : "w-11 h-11 rounded-full bg-white/95 shadow-md flex items-center justify-center text-encre active:scale-95 transition-transform"
        }
      >
        <IconePartage taille={20} />
      </button>

      {copie && (
        <span
          role="status"
          className="absolute top-12 right-0 whitespace-nowrap rounded-full bg-encre text-white text-xs font-medium px-3 py-1.5 shadow-lg"
        >
          Lien copié !
        </span>
      )}
      {fenetre}
      {fenetreSombre}
    </div>
  );
}
