"use client";

import { useEffect, useState } from "react";

/**
 * ██ SONDE DU CADRE — `?sonde-cadre=1` (nº 281-§1) ██
 * ==================================================================
 * POURQUOI ELLE EXISTE. Le propriétaire voit, sur la page d'une fiche,
 * « une marge verticale côté gauche qui laisse transparaître la photo
 * d'à côté ». La nº 280-§4 a corrigé une cause plausible (la largeur
 * fractionnaire du cadre) et mesuré zéro écart sur vingt défilements
 * — mais le défaut est TOUJOURS là chez lui. Donc la cause mesurée ici
 * n'est pas la sienne, et continuer à corriger à l'aveugle serait
 * deviner. CETTE PASSE NE CORRIGE RIEN : elle donne de quoi RELEVER,
 * sur SON téléphone, les nombres qui décideront.
 *
 * CE QU'ELLE AFFICHE, en haut de l'écran, sur fond noir opaque :
 * la largeur du cadre au millième, `clientWidth` et `scrollWidth` du
 * conteneur qui défile, `scrollLeft` au millième, le nombre de photos,
 * la largeur d'UNE photo au millième, les rembourrages gauche et droit
 * et l'écart (`gap`) calculés, la densité d'écran, et la largeur de la
 * fenêtre.
 *
 * DEUX BOUTONS : « suivant » fait défiler d'une photo puis réaffiche
 * les mêmes valeurs ; « copier » met tout le relevé dans le
 * presse-papier en un seul appui.
 *
 * ⚠️ ELLE NE MODIFIE RIEN D'AUTRE : aucune classe posée, aucun style
 * touché, aucune mesure forcée. Sans `?sonde-cadre=1` dans l'adresse,
 * le composant ne rend RIEN — il ne s'installe même pas.
 */

/** Le cadre du carrousel — le conteneur qui défile (voir
    CarrouselPortfolio, `data-role="cadre"`). */
const CADRE = '[data-role="cadre"]';

type Releve = {
  cadreLargeur: string;
  clientWidth: number;
  scrollWidth: number;
  scrollLeft: string;
  photos: number;
  photoLargeur: string;
  paddingGauche: string;
  paddingDroit: string;
  gap: string;
  densite: number;
  fenetre: number;
  photoCourante: number;
};

function relever(): Releve | null {
  const cadre = document.querySelector<HTMLElement>(CADRE);
  if (!cadre) return null;
  const boite = cadre.getBoundingClientRect();
  const style = getComputedStyle(cadre);
  const colonnes = [
    ...cadre.querySelectorAll<HTMLElement>('[data-role^="colonne"]'),
  ];
  const premiere = colonnes[0]?.getBoundingClientRect();
  return {
    cadreLargeur: boite.width.toFixed(3),
    clientWidth: cadre.clientWidth,
    scrollWidth: cadre.scrollWidth,
    scrollLeft: cadre.scrollLeft.toFixed(3),
    photos: colonnes.length,
    photoLargeur: (premiere?.width ?? 0).toFixed(3),
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
    "SONDE CADRE (nº 281-§1)",
    `adresse : ${window.location.href}`,
    `cadre.width      ${releve.cadreLargeur} px`,
    `clientWidth      ${releve.clientWidth}`,
    `scrollWidth      ${releve.scrollWidth}`,
    `scrollLeft       ${releve.scrollLeft}`,
    `photos           ${releve.photos}`,
    `photo.width      ${releve.photoLargeur} px`,
    `padding-left     ${releve.paddingGauche}`,
    `padding-right    ${releve.paddingDroit}`,
    `gap              ${releve.gap}`,
    `devicePixelRatio ${releve.densite}`,
    `fenêtre          ${releve.fenetre} px`,
    `photo courante   ${releve.photoCourante} (entier attendu)`,
  ].join("\n");
}

export function SondeCadre() {
  const [active, setActive] = useState(false);
  const [releve, setReleve] = useState<Releve | null>(null);
  const [copie, setCopie] = useState(false);

  //  L'ADRESSE DÉCIDE, ET ELLE SEULE. Lu au montage, côté navigateur :
  //  aucun rendu du serveur n'en dépend, donc aucun écart d'hydratation.
  useEffect(() => {
    const demandee =
      new URLSearchParams(window.location.search).get("sonde-cadre") === "1";
    if (!demandee) return;
    //  ⚠️ DEUX IMAGES D'ATTENTE, et l'état posé DEDANS : la mise en
    //  page doit être finie (sinon on relève des largeurs qui
    //  n'existeront plus), et poser un état SYNCHRONEMENT dans un effet
    //  déclenche des rendus en cascade — le lint le refuse, à raison
    //  (le piège payé à la nº 272).
    const premiere = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setActive(true);
        setReleve(relever());
      })
    );
    return () => cancelAnimationFrame(premiere);
  }, []);

  if (!active) return null;

  const suivant = () => {
    const cadre = document.querySelector<HTMLElement>(CADRE);
    if (!cadre) return;
    //  UNE PHOTO — la largeur du cadre, exactement ce que fait le
    //  geste du doigt (accrochage compris).
    cadre.scrollBy({ left: cadre.getBoundingClientRect().width, behavior: "smooth" });
    //  On relit APRÈS l'arrêt : 600 ms couvrent le défilement doux et
    //  l'accrochage, sans rien forcer.
    window.setTimeout(() => setReleve(relever()), 600);
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

  const ligne = (nom: string, valeur: string | number) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ opacity: 0.75 }}>{nom}</span>
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
        font: "13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: "10px 12px",
        borderBottom: "1px solid #fff3",
      }}
    >
      {releve ? (
        <>
          {ligne("cadre.width", `${releve.cadreLargeur} px`)}
          {ligne("clientWidth", releve.clientWidth)}
          {ligne("scrollWidth", releve.scrollWidth)}
          {ligne("scrollLeft", releve.scrollLeft)}
          {ligne("photos", releve.photos)}
          {ligne("photo.width", `${releve.photoLargeur} px`)}
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
