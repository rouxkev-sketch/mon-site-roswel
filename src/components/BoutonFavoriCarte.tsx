"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { COULEURS } from "@/config/roswel";
import {
  amorcerFavori,
  definirFavori,
  nombreFavorisAffiche,
  useFavori,
} from "@/lib/favoris-store";
import { COULEUR_CONTOUR_BADGE } from "@/components/Pastille";

/**
 * LE CŒUR FAVORI (cartes et fiche)
 * --------------------------------
 * Sélectionné : le cœur devient ENTIÈREMENT rose (remplissage ET
 * contour — rose de la marque). Zone tactile de 44 px, qui n'ouvre
 * jamais la fiche. Connecté : ajoute/retire ; sinon → connexion.
 * L'état est PARTAGÉ (favoris-store) : tous les cœurs du même
 * artisan (carte + fiche) se synchronisent à l'instant, sans
 * rechargement — bien visible en mode double.
 * Au clic : petite animation « pop » (rebond) + éclat de particules
 * discret à l'activation, façon X/Instagram/Airbnb.
 * Deux habillages :
 * - « carte » : carré blanc aux coins arrondis (~12 px), contour fin
 *   gris — même hauteur et mêmes coins que les boutons Appeler /
 *   Whatsapp de la carte ;
 * - « fiche » : disque blanc SANS contour, au même diamètre que le
 *   bouton retour (posé sur la photo).
 */

// Six particules, réparties en étoile autour du cœur
const PARTICULES = [
  { dx: "0px", dy: "-13px" },
  { dx: "11px", dy: "-7px" },
  { dx: "11px", dy: "7px" },
  { dx: "0px", dy: "13px" },
  { dx: "-11px", dy: "7px" },
  { dx: "-11px", dy: "-7px" },
];

export function BoutonFavoriCarte({
  artisanId,
  nomArtisan,
  userId,
  initialActif,
  variante = "carte",
  diametre = 32,
  couleurContour = COULEUR_CONTOUR_BADGE,
  sansContour = false,
  nombreFavoris = null,
  colonne = "artisan_id",
}: {
  artisanId: string;
  nomArtisan: string;
  userId: string | null;
  initialActif: boolean;
  variante?: "carte" | "fiche" | "nu" | "compteur";
  /** Compteur (variante « compteur ») : nombre total de favoris. Le
      bouton l'ajuste en direct selon l'état de CE visiteur ; « 0 » n'est
      jamais affiché. */
  nombreFavoris?: number | null;
  /** Diamètre du cercle (variante « carte ») — pour l'aligner sur la
      hauteur des boutons Appeler / WhatsApp. */
  diametre?: number;
  /** Couleur du contour du cercle (variante « carte »). */
  couleurContour?: string;
  /** AUCUN contour (variante « compteur ») : fond blanc seul. C'est le
      rendu du bandeau de la fiche artisan ≥ 768 px, où le cœur et le
      partage sont posés sur le gris — un contour y ferait bouton lourd.
      Les CARTES, elles, gardent leur contour. */
  sansContour?: boolean;
  /** LA COLONNE DE LA TABLE `favoris` à écrire. « artisan_id » par
      défaut (les artisans du bâtiment), « tatoueur_id » pour l'index
      des tatoueurs — c'est la SEULE différence entre les deux
      produits : même bouton, même animation, même état partagé. */
  colonne?: "artisan_id" | "tatoueur_id";
}) {
  const router = useRouter();
  // État partagé : amorcé AVANT la lecture (premier instantané
  // client = celui du serveur, pas d'erreur d'hydratation)
  amorcerFavori(artisanId, initialActif);
  const actif = useFavori(artisanId, initialActif);
  const [enCours, setEnCours] = useState(false);
  // Animation déclenchée UNIQUEMENT au clic (jamais au montage, au
  // rendu ni à la restauration d'état) : `cle` incrémentée à chaque
  // clic force le rejeu ; `type` indique « pop » (retrait) ou
  // « eclat » (ajout, avec particules). Au repos : type = null →
  // AUCUNE classe d'animation, donc aucun grossissement à
  // l'affichage d'une page ou au retour arrière.
  const [anim, setAnim] = useState<{ cle: number; type: "pop" | "eclat" }>({
    cle: 0,
    type: "pop",
  });
  const [animeMaintenant, setAnimeMaintenant] = useState(false);

  async function basculer(evenement: React.MouseEvent) {
    evenement.preventDefault();
    evenement.stopPropagation();

    if (!userId) {
      router.push("/compte");
      return;
    }
    if (enCours) return;

    const nouvelEtat = !actif;
    // Un clic = une animation (pop toujours, éclat à l'activation)
    setAnim((a) => ({ cle: a.cle + 1, type: nouvelEtat ? "eclat" : "pop" }));
    setAnimeMaintenant(true);

    setEnCours(true);
    definirFavori(artisanId, nouvelEtat); // synchro immédiate partout
    try {
      const supabase = creerClientSupabaseNavigateur();
      if (nouvelEtat) {
        await supabase.from("particuliers").upsert({ id: userId });
        const { error } = await supabase
          .from("favoris")
          .upsert({ particulier_id: userId, [colonne]: artisanId });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("favoris")
          .delete()
          .eq(colonne, artisanId)
          .eq("particulier_id", userId);
        if (error) throw new Error(error.message);
      }
    } catch {
      definirFavori(artisanId, !nouvelEtat); // échec : on revient
    }
    setEnCours(false);
  }

  const coeur = (tailleCoeur: number) => (
    // key = anim.cle : à chaque clic, le remontage rejoue
    // l'animation ; au repos (animeMaintenant false) AUCUNE classe
    // d'animation → pas de « pop » à l'affichage
    <span
      key={anim.cle}
      className={animeMaintenant ? "rw-coeur-anime flex" : "flex"}
      onAnimationEnd={() => setAnimeMaintenant(false)}
    >
      <svg width={tailleCoeur} height={tailleCoeur} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 20.5C7.5 17.2 3.5 13.9 3.5 9.9 3.5 7 5.7 5 8.2 5c1.6 0 3 .8 3.8 2.1C12.8 5.8 14.2 5 15.8 5c2.5 0 4.7 2 4.7 4.9 0 4-4 7.3-8.5 10.6Z"
          fill={actif ? COULEURS.primaire : "none"}
          // Au repos : gris foncé des libellés « Appeler » / « Whatsapp »
          // (encre douce) pour harmoniser les trois boutons d'action.
          // Plein ROSE de la marque uniquement en favori (état actif).
          stroke={actif ? COULEURS.primaire : COULEURS.encreDouce}
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ transition: "fill .2s ease, stroke .2s ease" }}
        />
      </svg>
    </span>
  );

  // L'éclat de particules : UNIQUEMENT pendant l'animation d'une
  // ACTIVATION au clic (jamais au montage). key = anim.cle → rejeu.
  const eclat =
    animeMaintenant && anim.type === "eclat" ? (
      <span
        key={anim.cle}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        {PARTICULES.map((p, i) => (
          <span
            key={i}
            className="rw-particule absolute w-1 h-1 rounded-full"
            style={
              {
                backgroundColor: COULEURS.primaire,
                "--rw-dx": p.dx,
                "--rw-dy": p.dy,
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    ) : null;

  const etiquette = actif
    ? `Retirer ${nomArtisan} des favoris`
    : `Ajouter ${nomArtisan} aux favoris`;

  if (variante === "nu") {
    // Cœur SEUL, SANS encadré (angle haut droit de la carte) : aucune
    // pastille, aucun fond, aucun contour — juste l'icône (~22 px)
    // centrée dans une zone tactile confortable de 44 px, façon
    // Airbnb / Vinted / Booking. Mêmes couleurs que partout (gris au
    // repos, rose de la marque en favori).
    return (
      <button
        type="button"
        aria-pressed={actif}
        aria-label={etiquette}
        onClick={basculer}
        className="relative w-11 h-11 flex items-center justify-center active:scale-90 transition-transform"
      >
        {coeur(22)}
        {eclat}
      </button>
    );
  }

  if (variante === "compteur") {
    // Bouton carré à contour (même gabarit que le bouton « Partager »
    // des cartes) qui s'ÉLARGIT pour accueillir le compteur de favoris.
    // Le nombre est ajusté en direct selon l'état de CE visiteur ;
    // « 0 » (ni compteur serveur, ni favori du visiteur) ne s'affiche pas.
    // Le total est calculé par l'état partagé, à partir de repères
    // FIGÉS à la première rencontre de l'artisan (voir favoris-store) :
    // il monte et redescend symétriquement, quel que soit le cœur sur
    // lequel on clique et quoi qu'il arrive aux valeurs du serveur
    // entre-temps. « 0 » ne s'affiche jamais.
    const total = nombreFavorisAffiche(artisanId, nombreFavoris, actif);
    const montrerNombre = total >= 1;
    return (
      <button
        type="button"
        aria-pressed={actif}
        aria-label={etiquette}
        onClick={basculer}
        className={`relative h-12 rounded-xl bg-white flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-transform ${
          montrerNombre ? "px-3" : "w-12"
        }`}
        style={
          sansContour ? undefined : { border: `1px solid ${couleurContour}` }
        }
      >
        {coeur(20)}
        {montrerNombre && (
          <span className="text-[15px] font-semibold text-encre-douce tabular-nums">
            {total}
          </span>
        )}
        {eclat}
      </button>
    );
  }

  if (variante === "fiche") {
    // Disque plein sans contour, même diamètre que le bouton retour
    return (
      <button
        type="button"
        aria-pressed={actif}
        aria-label={etiquette}
        onClick={basculer}
        className="relative w-11 h-11 rounded-full bg-white/95 shadow-md flex items-center justify-center shrink-0 active:scale-95 transition-transform"
      >
        {coeur(20)}
        {eclat}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={actif}
      aria-label={etiquette}
      onClick={basculer}
      className="relative flex items-center justify-center shrink-0 active:scale-95 transition-transform"
      style={{ width: diametre, height: diametre }}
    >
      <span
        className="w-full h-full rounded-xl bg-white flex items-center justify-center"
        style={{ border: `1px solid ${couleurContour}` }}
      >
        {coeur(Math.round(diametre * 0.5))}
      </span>
      {eclat}
    </button>
  );
}
