"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ██ SONDE DU CADRE — `?sonde-cadre=1` (nº 281-§1, refaite en 282-§4) ██
 * ==================================================================
 * POURQUOI ELLE EXISTE. Le propriétaire voit, sur la page d'une fiche,
 * un trait blanc vertical au bord gauche du cadre — la tranche de la
 * photo d'à côté. La nº 280 a corrigé une cause réelle (la largeur
 * fractionnaire) sans faire disparaître le défaut : il fallait des
 * NOMBRES relevés sur SON écran, pas des déductions sur le mien.
 *
 * ⚠️ CE QUI CLOCHAIT DANS LA PREMIÈRE VERSION (nº 281), ET QUI EST
 * CORRIGÉ ICI. Elle ne relevait qu'à DEUX MOMENTS : au montage de la
 * page, et 600 ms après le bouton « suivant ». Aucun écouteur de
 * défilement. Un relevé pris après avoir changé de photo À LA MAIN
 * (flèches, points, doigt) affichait donc encore l'état du CHARGEMENT
 * — « scrollLeft 0,000 · photo courante 0 » pendant que l'écran
 * montrait la cinquième photo. Les deux faits ne se contredisaient
 * pas : ils n'étaient pas pris au même instant.
 * DÉSORMAIS ELLE MESURE EN CONTINU, à chaque image du navigateur :
 * ce qui s'affiche est toujours l'état de l'instant.
 *
 * ⚠️ ET ELLE SUIT LA PIÈCE QUI BOUGE. Le cadre, lui, ne bouge pas :
 * c'est une fenêtre immobile qui ROGNE. Ce qui se déplace, c'est SON
 * CONTENU — les colonnes. La sonde cherche donc, à chaque image, LA
 * COLONNE dont le bord gauche est le plus proche du bord gauche du
 * cadre (elle la trouve, elle ne la suppose pas), et elle affiche les
 * deux nombres qui décident :
 *  · LE DÉCALAGE RÉSIDUEL — bord gauche de la photo affichée MOINS
 *    bord gauche du cadre. Il doit valoir 0,000 : au-delà, une tranche
 *    de la photo voisine est DANS le cadre ;
 *  · LA FRACTION DU BORD — de combien le bord gauche du cadre manque
 *    le pixel entier. Elle doit valoir 0,000 : sinon le cadre est posé
 *    entre deux pixels, et le pixel partagé peut laisser passer la
 *    tranche d'à côté selon le moteur de rendu (nº 282-§2).
 * Les deux lignes sont VERTES à zéro, ROUGES sinon : il n'y a rien à
 * interpréter.
 *
 * ⚠️ ELLE DIT AUSSI COMBIEN DE CADRES EXISTENT SUR LA PAGE, et lequel
 * elle mesure : la question « est-ce le bon élément ? » ne doit plus
 * jamais rester ouverte.
 *
 * ⚠️ ELLE NE MODIFIE RIEN : aucune classe posée, aucun style touché,
 * aucune mise en page forcée. Sans `?sonde-cadre=1` dans l'adresse, le
 * composant ne rend RIEN — il ne s'installe même pas, et sa boucle de
 * mesure n'existe pas.
 */

/** Le cadre du carrousel — la fenêtre immobile qui rogne (voir
    CarrouselPortfolio, `data-role="cadre"`). Sur une page de fiche, on
    veut CELUI DE LA PHOTO : les cartes de la mosaïque du bas en
    portent un chacune. */
const CADRE = '[data-role="cadre"]';
const CADRE_DE_LA_FICHE = `[data-photo-fiche] ${CADRE}`;

/** Trois décimales, virgule française — la précision demandée. */
const trois = (valeur: number) => valeur.toFixed(3).replace(".", ",");

type Releve = {
  cadres: number;
  cadreDeLaFiche: boolean;
  cadreLargeur: string;
  clientWidth: number;
  scrollWidth: number;
  scrollLeft: string;
  photos: number;
  photoLargeur: string;
  /** LA PIÈCE MOBILE : le rang de la colonne trouvée au bord gauche. */
  rangMobile: number;
  /** Sa position, dans la page, au millième. */
  positionMobile: string;
  /** Le bord gauche du cadre, dans la page, au millième. */
  bordCadre: string;
  /** LES DEUX NOMBRES QUI DÉCIDENT — texte affiché et verdict. */
  residuel: string;
  residuelJuste: boolean;
  fraction: string;
  fractionJuste: boolean;
  paddingGauche: string;
  paddingDroit: string;
  gap: string;
  densite: number;
  fenetre: number;
  photoCourante: number;
};

function relever(): Releve | null {
  const tous = document.querySelectorAll<HTMLElement>(CADRE);
  const deLaFiche = document.querySelector<HTMLElement>(CADRE_DE_LA_FICHE);
  const cadre = deLaFiche ?? tous[0];
  if (!cadre) return null;
  const boite = cadre.getBoundingClientRect();
  const style = getComputedStyle(cadre);
  const colonnes = [
    ...cadre.querySelectorAll<HTMLElement>('[data-role^="colonne"]'),
  ];

  //  LA PIÈCE MOBILE, TROUVÉE ET NON SUPPOSÉE : la colonne dont le bord
  //  gauche est le plus proche du bord gauche du cadre. C'est celle que
  //  l'œil voit — quelle que soit la façon dont elle est arrivée là.
  let rang = -1;
  let meilleur = Infinity;
  colonnes.forEach((colonne, index) => {
    const ecart = Math.abs(colonne.getBoundingClientRect().left - boite.left);
    if (ecart < meilleur) {
      meilleur = ecart;
      rang = index;
    }
  });
  const boiteMobile =
    rang >= 0 ? colonnes[rang].getBoundingClientRect() : undefined;
  const premiere = colonnes[0]?.getBoundingClientRect();

  //  LE DÉCALAGE RÉSIDUEL — ce que le propriétaire doit voir à zéro.
  const residuel = boiteMobile ? boiteMobile.left - boite.left : 0;
  //  LA FRACTION DU BORD — de combien le cadre manque le pixel entier.
  const fraction = boite.left - Math.round(boite.left);

  return {
    cadres: tous.length,
    cadreDeLaFiche: Boolean(deLaFiche),
    cadreLargeur: trois(boite.width),
    clientWidth: cadre.clientWidth,
    scrollWidth: cadre.scrollWidth,
    scrollLeft: trois(cadre.scrollLeft),
    photos: colonnes.length,
    photoLargeur: trois(premiere?.width ?? 0),
    rangMobile: rang,
    positionMobile: trois(boiteMobile?.left ?? 0),
    bordCadre: trois(boite.left),
    residuel: trois(residuel),
    //  Un demi-millième : la limite du bruit d'arrondi des mesures du
    //  navigateur (un soixante-quatrième de pixel), pas une tolérance
    //  de complaisance.
    residuelJuste: Math.abs(residuel) < 0.0005,
    fraction: trois(fraction),
    fractionJuste: Math.abs(fraction) < 0.0005,
    paddingGauche: style.paddingLeft,
    paddingDroit: style.paddingRight,
    //  L'écart entre colonnes, TEL QUE LE NAVIGATEUR LE CALCULE :
    //  « normal » veut dire « aucun écart déclaré », et c'est une
    //  réponse — on ne la traduit pas en « 0px », qui laisserait
    //  croire à une valeur posée.
    gap: style.columnGap,
    densite: window.devicePixelRatio,
    fenetre: window.innerWidth,
    //  Sur quelle photo on est : le rapport du défilement à la largeur
    //  d'une photo. Il DEVRAIT être entier — c'est là que le défaut se
    //  lira si l'arrêt tombe entre deux.
    photoCourante:
      premiere && premiere.width > 0
        ? Number((cadre.scrollLeft / premiere.width).toFixed(3))
        : 0,
  };
}

function enTexte(releve: Releve): string {
  return [
    "SONDE CADRE (nº 282-§4)",
    `adresse : ${window.location.href}`,
    `cadres sur la page ${releve.cadres} (mesuré : ` +
      `${releve.cadreDeLaFiche ? "celui de la fiche" : "le premier trouvé"})`,
    `cadre.width       ${releve.cadreLargeur} px`,
    `clientWidth       ${releve.clientWidth}`,
    `scrollWidth       ${releve.scrollWidth}`,
    `scrollLeft        ${releve.scrollLeft}`,
    `photos            ${releve.photos}`,
    `photo.width       ${releve.photoLargeur} px`,
    `pièce mobile      colonne ${releve.rangMobile}`,
    `bord du cadre     ${releve.bordCadre} px`,
    `bord de la photo  ${releve.positionMobile} px`,
    `DÉCALAGE RÉSIDUEL ${releve.residuel} px  (0,000 attendu)`,
    `FRACTION DU BORD  ${releve.fraction} px  (0,000 attendu)`,
    `padding-left      ${releve.paddingGauche}`,
    `padding-right     ${releve.paddingDroit}`,
    `gap               ${releve.gap}`,
    `devicePixelRatio  ${releve.densite}`,
    `fenêtre           ${releve.fenetre} px`,
    `photo courante    ${releve.photoCourante} (entier attendu)`,
  ].join("\n");
}

export function SondeCadre() {
  const [active, setActive] = useState(false);
  const [releve, setReleve] = useState<Releve | null>(null);
  const [copie, setCopie] = useState(false);
  //  La dernière empreinte affichée : on ne repose un état que si un
  //  nombre a VRAIMENT changé — sinon la sonde rendrait soixante fois
  //  par seconde pour rien, et fausserait ce qu'elle mesure.
  const empreinte = useRef("");

  /**
   * LA MESURE EN CONTINU (§4, nº 282) — une image après l'autre, tant
   * que la sonde est demandée. C'est ce qui manquait : elle voit donc
   * le défilement au doigt, aux flèches, aux points, et l'arrivée en
   * douceur de l'accrochage.
   * ⚠️ L'ADRESSE DÉCIDE, ET ELLE SEULE. Lue au montage, côté navigateur :
   * aucun rendu du serveur n'en dépend, donc aucun écart d'hydratation.
   * Sans `?sonde-cadre=1`, aucune boucle n'est même lancée.
   */
  useEffect(() => {
    const demandee =
      new URLSearchParams(window.location.search).get("sonde-cadre") === "1";
    if (!demandee) return;
    let image = 0;
    const mesurer = () => {
      const frais = relever();
      const signature = frais ? JSON.stringify(frais) : "";
      if (signature !== empreinte.current) {
        empreinte.current = signature;
        setReleve(frais);
      }
      image = requestAnimationFrame(mesurer);
    };
    //  ⚠️ DEUX IMAGES D'ATTENTE AVANT LA PREMIÈRE MESURE : la mise en
    //  page doit être finie (sinon on relève des largeurs qui
    //  n'existeront plus), et poser un état SYNCHRONEMENT dans un effet
    //  déclenche des rendus en cascade — le lint le refuse, à raison
    //  (le piège payé à la nº 272).
    image = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setActive(true);
        mesurer();
      })
    );
    return () => cancelAnimationFrame(image);
  }, []);

  if (!active) return null;

  const suivant = () => {
    const cadre =
      document.querySelector<HTMLElement>(CADRE_DE_LA_FICHE) ??
      document.querySelector<HTMLElement>(CADRE);
    if (!cadre) return;
    //  UNE PHOTO — la largeur du cadre, exactement ce que fait le
    //  geste du doigt (accrochage compris). Plus besoin d'attendre
    //  pour relire : la boucle affiche tout le trajet.
    cadre.scrollBy({
      left: cadre.getBoundingClientRect().width,
      behavior: "smooth",
    });
  };

  const copier = async () => {
    if (!releve) return;
    const texte = enTexte(releve);
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
    } catch {
      //  Sans presse-papier (http local, permission refusée) : la
      //  méthode ancienne, celle de la fenêtre d'adresse.
      const zone = document.createElement("textarea");
      zone.value = texte;
      zone.setAttribute("readonly", "");
      zone.style.cssText =
        "position:fixed;top:0;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(zone);
      zone.focus();
      zone.setSelectionRange(0, texte.length);
      setCopie(document.execCommand("copy"));
      zone.remove();
    }
    window.setTimeout(() => setCopie(false), 1500);
  };

  const ligne = (nom: string, valeur: string | number, verdict?: boolean) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        //  LES DEUX LIGNES QUI DÉCIDENT SE VOIENT : vert à zéro, rouge
        //  sinon. Le reste est du contexte.
        color:
          verdict === undefined ? undefined : verdict ? "#34D399" : "#FB7185",
        fontWeight: verdict === undefined ? undefined : 700,
      }}
    >
      <span style={{ opacity: verdict === undefined ? 0.75 : 1 }}>{nom}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{valeur}</span>
    </div>
  );

  return (
    /*  ⚠️ TOUT EST EN STYLE EN LIGNE, et c'est voulu : une sonde ne
        doit dépendre d'aucune classe du site — ni de la charte, ni du
        thème. Elle est posée PAR-DESSUS (z-index très haut), en
        `fixed`, et ne déplace donc rien. */
    <div
      data-sonde-cadre=""
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        background: "#000",
        color: "#fff",
        font: "13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: "10px 12px",
        borderBottom: "1px solid #fff3",
      }}
    >
      {releve ? (
        <>
          {ligne(
            "cadres sur la page",
            `${releve.cadres} · ${
              releve.cadreDeLaFiche ? "celui de la fiche" : "le premier"
            }`
          )}
          {ligne("cadre.width", `${releve.cadreLargeur} px`)}
          {ligne("clientWidth", releve.clientWidth)}
          {ligne("scrollWidth", releve.scrollWidth)}
          {ligne("scrollLeft", releve.scrollLeft)}
          {ligne("photos", releve.photos)}
          {ligne("photo.width", `${releve.photoLargeur} px`)}
          {ligne("pièce mobile", `colonne ${releve.rangMobile}`)}
          {ligne("bord du cadre", `${releve.bordCadre} px`)}
          {ligne("bord de la photo", `${releve.positionMobile} px`)}
          {ligne(
            "DÉCALAGE RÉSIDUEL",
            `${releve.residuel} px`,
            releve.residuelJuste
          )}
          {ligne(
            "FRACTION DU BORD",
            `${releve.fraction} px`,
            releve.fractionJuste
          )}
          {ligne("padding-left", releve.paddingGauche)}
          {ligne("padding-right", releve.paddingDroit)}
          {ligne("gap", releve.gap)}
          {ligne("devicePixelRatio", releve.densite)}
          {ligne("fenêtre", `${releve.fenetre} px`)}
          {ligne("photo courante", releve.photoCourante)}
        </>
      ) : (
        <div>cadre introuvable sur cette page</div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button
          type="button"
          onClick={suivant}
          style={{
            flex: 1,
            minHeight: 44,
            background: "#fff",
            color: "#000",
            border: 0,
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          suivant
        </button>
        <button
          type="button"
          onClick={copier}
          style={{
            flex: 1,
            minHeight: 44,
            background: copie ? "#34D399" : "#fff",
            color: "#000",
            border: 0,
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {copie ? "copié" : "copier"}
        </button>
      </div>
    </div>
  );
}
