import Image from "next/image";
import Link from "next/link";
import { COULEURS, MARQUE } from "@/config/roswel";
import type { ArtisanResultat } from "@/lib/recherche-artisans";
import { libelleMetiersArtisan } from "@/lib/metiers";
import { lienTelephone, lienWhatsApp } from "@/lib/contact";
import { abregerSaint, anneesExistence, nomVilleCourt } from "@/lib/villes";
import { estSociete } from "@/lib/compte-artisan";
import {
  estEnAbsence,
  estOuvertMaintenant,
  finCreneauActuel,
  heureEnTexte,
  jourActuel24,
  prochaineOuverture,
  semaineEntiere24,
} from "@/lib/horaires";
import { estJourFerie } from "@/lib/feries";
import { infosNiveau } from "@/components/Pastille";
import { BoutonFavoriCarte } from "@/components/BoutonFavoriCarte";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { StatutJoignabilite } from "@/components/StatutJoignabilite";
import { TexteAbregeable } from "@/components/TexteAbregeable";
import {
  IconeBadgeVerifie,
  IconeTelephone,
  IconeWhatsApp,
} from "@/components/Icones";

// Format compact des grands nombres : 12400 → « 12,4 k »
const formatCompact = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// Format des notes : 4.8 → « 4,8 »
const formatNote = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * « De retour le 1er septembre » : le LENDEMAIN de la fin d'absence
 * (indisponible jusqu'au 31 août inclus → de retour le 1er septembre).
 */
export function libelleRetour(fin: string): string {
  const retour = new Date(`${fin}T00:00:00Z`);
  retour.setUTCDate(retour.getUTCDate() + 1);
  const jour = retour.getUTCDate();
  const jourTexte = jour === 1 ? "1er" : String(jour);
  const mois = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    timeZone: "UTC",
  }).format(retour);
  const annee = retour.getUTCFullYear();
  const suffixeAnnee = annee === new Date().getFullYear() ? "" : ` ${annee}`;
  return `De retour le ${jourTexte} ${mois}${suffixeAnnee}`;
}

/** Les abréviations françaises usuelles des mois */
const MOIS_ABREGES: Record<string, string> = {
  janvier: "janv.",
  février: "févr.",
  mars: "mars",
  avril: "avr.",
  mai: "mai",
  juin: "juin",
  juillet: "juil.",
  août: "août",
  septembre: "sept.",
  octobre: "oct.",
  novembre: "nov.",
  décembre: "déc.",
};

/** « De retour le 1er septembre » → « De retour le 1er sept. » */
export function abregerMois(texte: string): string {
  let resultat = texte;
  for (const [mois, abrege] of Object.entries(MOIS_ABREGES)) {
    resultat = resultat.replace(mois, abrege);
  }
  return resultat;
}

/** Les jours de la semaine abrégés, même style que les mois */
const JOURS_ABREGES: Record<string, string> = {
  lundi: "lun.",
  mardi: "mar.",
  mercredi: "mer.",
  jeudi: "jeu.",
  vendredi: "ven.",
  samedi: "sam.",
  dimanche: "dim.",
};

/** « retour lundi à 08h00 » → « retour lun. à 08h00 » */
export function abregerJour(texte: string): string {
  let resultat = texte;
  for (const [jour, abrege] of Object.entries(JOURS_ABREGES)) {
    resultat = resultat.replace(jour, abrege);
  }
  return resultat;
}

/**
 * LE STATUT DE JOIGNABILITÉ — format « État · Précision » :
 *  - le mot d'ÉTAT en tête, en GRAS et coloré (VERT « Joignable » /
 *    ROUGE « Indisponible ») ;
 *  - la PRÉCISION après le « · », en GRIS et sans gras.
 * Correspondances :
 *  - en créneau → « Joignable · jusqu'à 19h00 » ;
 *  - jour en cours en 24h/24 → « Joignable · 24/24 » ;
 *  - 24h/24 toute la semaine → « Joignable · 24/24 · 7/7 » ;
 *  - fermé pour l'instant → « Indisponible · retour lundi à 08h00 »
 *    (ou « … · retour à 14h00 » le jour même) ;
 *  - en absence → « Indisponible · retour le 1er sept. ».
 * La puce ronde en tête garde la couleur de l'état.
 * Renvoie null si les horaires ne permettent aucun calcul.
 */
export type Joignabilite = {
  etat: string;
  precision: string;
  /** Version raccourcie (jour de la semaine abrégé) si la place manque */
  precisionAbrege: string;
  couleur: string;
};

export function badgeDisponibilite(artisan: {
  horaires: ArtisanResultat["horaires"];
  dispo_feries: boolean;
  absence_debut: string | null;
  absence_fin: string | null;
}): Joignabilite | null {
  if (
    estEnAbsence(artisan.absence_debut, artisan.absence_fin) &&
    artisan.absence_fin
  ) {
    // CAS C — congé (date de retour connue) : « retour le 3 septembre »
    // (avec « le ») ; abrégé « retour le 3 sept. » si la place manque.
    const complet = libelleRetour(artisan.absence_fin).replace(/^De /, "");
    return {
      etat: "Indisponible",
      precision: complet,
      precisionAbrege: abregerMois(complet),
      couleur: COULEURS.erreur,
    };
  }

  const ferieNonTravaille = !artisan.dispo_feries && estJourFerie();
  if (estOuvertMaintenant(artisan.horaires) === true && !ferieNonTravaille) {
    const fin = finCreneauActuel(artisan.horaires);
    const precision = semaineEntiere24(artisan.horaires)
      ? "24/24 · 7/7"
      : jourActuel24(artisan.horaires)
        ? "24/24"
        : fin != null
          ? `jusqu'à ${heureEnTexte(fin)}`
          : "";
    return {
      etat: "Joignable",
      precision,
      precisionAbrege: precision,
      couleur: COULEURS.succes,
    };
  }

  const reprise = prochaineOuverture(
    artisan.horaires,
    artisan.dispo_feries,
    estJourFerie
  );
  if (!reprise) return null;
  // Format du retour (plus de « · » entre « retour » et l'heure/jour) :
  //  - CAS A (aujourd'hui ou demain, decalage ≤ 1) : « retour à 07h30 »
  //    — l'heure ; le jour est implicite ;
  //  - CAS B (2 à 7 jours) : « retour lundi » — le jour seul, sans
  //    heure ; abrégé « retour lun. » si la place manque.
  let precision: string;
  let precisionAbrege: string;
  if (reprise.decalage <= 1) {
    precision = precisionAbrege = `retour à ${heureEnTexte(reprise.minutes)}`;
  } else {
    precision = `retour ${reprise.jour}`;
    precisionAbrege = `retour ${abregerJour(reprise.jour)}`;
  }
  return {
    etat: "Indisponible",
    precision,
    precisionAbrege,
    couleur: COULEURS.erreur,
  };
}

/** Les 5 étoiles de la note Google (or = pleines, gris = vides) */
export function Etoiles({ note }: { note: number | null }) {
  const pleines = note == null ? 0 : Math.round(note);
  return (
    <span className="inline-flex gap-0.5 shrink-0" aria-hidden>
      {[1, 2, 3, 4, 5].map((position) => (
        <svg key={position} width="16" height="16" viewBox="0 0 24 24">
          <path
            fill={position <= pleines ? "#FBBC05" : "#D8DBE0"}
            d="M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17l-6 3.3 1.3-6.7-5-4.6 6.8-.8z"
          />
        </svg>
      ))}
    </span>
  );
}

/** Les initiales (jusqu'à deux) d'un nom, pour les photos absentes */
function initialesDe(nom: string): string {
  return (
    nom
      .split(/\s+/)
      .filter((mot) => /^[\p{L}]/u.test(mot))
      .slice(0, 2)
      .map((mot) => mot[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/** Une petite étoile dorée (note Google), à côté du chiffre */
function EtoileOr({ taille = 15 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        fill="#FBBC05"
        d="M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17l-6 3.3 1.3-6.7-5-4.6 6.8-.8z"
      />
    </svg>
  );
}

/**
 * Une STATISTIQUE de la carte, SANS icône : la valeur (grand chiffre
 * gras) + éventuelle petite étoile jaune sur la 1re ligne, le libellé
 * gris plus petit sur la 2e. CENTRÉE horizontalement dans son tiers
 * (valeur + étoile et libellé centrés). Les trois stats (Google,
 * ancienneté, Instagram) partagent ce gabarit.
 */
function StatCarte({
  valeur,
  etoile = false,
  libelle,
}: {
  valeur: string;
  etoile?: boolean;
  libelle: string;
}) {
  return (
    <div className="min-w-0 flex flex-col items-center text-center">
      <span className="flex items-center gap-1">
        <strong className="text-[18px] text-encre whitespace-nowrap">{valeur}</strong>
        {etoile && <EtoileOr taille={18} />}
      </span>
      <span className="text-[13px] text-encre-douce leading-tight mt-0.5">
        {libelle}
      </span>
    </div>
  );
}

/** L'ancienneté « 2 ans / d'ancienneté » (valeur, libellé) */
function ancienneteCarte(
  dateCreation: string | null,
  sirenVerifie: boolean
): { valeur: string; libelle: string } {
  const annees = dateCreation ? anneesExistence(dateCreation) : 0;
  if (annees >= 1) {
    return { valeur: annees === 1 ? "1 an" : `${annees} ans`, libelle: "d'ancienneté" };
  }
  if (dateCreation) {
    return { valeur: `${new Date(dateCreation).getFullYear()}`, libelle: "création" };
  }
  return { valeur: sirenVerifie ? "SIREN" : "—", libelle: "vérifié" };
}

/**
 * CARTE D'UN ARTISAN (résultats de recherche et favoris) — maquette
 * ------------------------------------------------------------------
 * HAUT DE CARTE, bloc horizontal : une grande PHOTO RONDE à gauche
 * (~28 % de la largeur — jamais de photo rectangulaire, jamais de
 * pastille flottante), puis à droite le bloc texte : nom en gros puis,
 * resserrés juste en dessous (texte seul, SANS icône), « Métier · Ville »
 * (gris compact) et la ligne de JOIGNABILITÉ (puce ronde + texte coloré).
 * Puis la LIGNE DES 3 CHIFFRES (Google note + avis · ancienneté ·
 * Instagram abonnés — SANS icône), aérée mais compacte, chacun CENTRÉ
 * dans son tiers.
 * Le CŒUR favori, lui, est SEUL (sans encadré) dans l'angle HAUT DROIT
 * de la carte (façon Airbnb / Vinted).
 * Puis la ligne des BOUTONS, coins arrondis ~12 px, MÊME hauteur et MÊME
 * style (fond blanc, contour gris fin) — seule l'icône est colorée :
 * « Appeler » (téléphone bleu iOS), « Whatsapp » (vert WhatsApp) et
 * « Partager » (icône grise : partage natif mobile / copie du lien PC).
 * Enfin, À L'INTÉRIEUR de la carte (si l'artisan a un badge de niveau),
 * un BANDEAU DE PIED séparé par un trait fin : à gauche l'icône ronde à
 * coche + « Très recommandé » (rose) / « Recommandé » (bleu), à droite
 * « Score de confiance X/100 ». Sans badge : pas de bandeau.
 */
export function CarteArtisan({
  artisan,
  userId = null,
  initialFavori = false,
  villeRecherchee = null,
  metierRecherche = null,
  surClicFiche,
}: {
  artisan: ArtisanResultat;
  userId?: string | null;
  initialFavori?: boolean;
  /** La ville RECHERCHÉE (nom court) — la partie « Écully » de
      « Plombier · Écully » ; sans recherche (favoris…), repli sur la
      ville de l'artisan */
  villeRecherchee?: string | null;
  /** Le métier RECHERCHÉ (libellé) — la partie « Plombier » de
      « Plombier · Écully » ; sans recherche (favoris…), repli sur le
      premier métier de l'artisan */
  metierRecherche?: string | null;
  /** Mode double colonnes : sur grand écran le clic ouvre la fiche
      dans la colonne au lieu de naviguer (la page de résultats
      passe cette fonction). La carte sélectionnée ne porte AUCUN
      marquage visuel : elle reste identique aux autres. */
  surClicFiche?: (slug: string) => void;
}) {
  const aDesAvis =
    artisan.note_google != null && (artisan.nombre_avis_google ?? 0) > 0;
  const niveau = infosNiveau(artisan.pastille);
  const telephoneAffiche = Boolean(artisan.telephone) && artisan.telephone_visible;
  const lienFiche = `/artisan/${artisan.slug ?? artisan.id}`;
  // Deux gris de contour : « clair » (quasi imperceptible, façon
  // Notion/Linear) pour la CARTE et le trait du bandeau de pied ;
  // « bordureCarte » (un peu plus visible) pour les boutons Whatsapp
  // et le cœur.
  const couleurContourCarte = COULEURS.bordureCarteClaire;
  const couleurBordure = COULEURS.bordureCarte;
  const anciennete = ancienneteCarte(
    artisan.date_creation_entreprise,
    artisan.siren_verifie
  );
  // La joignabilité (2 couleurs) : ligne colorée à puce sous le nom.
  const dispo = badgeDisponibilite(artisan);
  // Ville et métier (« Plombier · Écully ») : ceux de la recherche en
  // cours, sinon (favoris…) ceux de l'artisan.
  const villeIntervention =
    villeRecherchee ?? nomVilleCourt(artisan.ville_nom ?? "");
  // Le métier affiché est l'ENTRÉE RÉELLE de l'artisan : un
  // « Plombier & Chauffagiste » s'affiche ainsi, même quand la
  // recherche portait sur « Plombier » seul.
  const libelleMetier =
    libelleMetiersArtisan(artisan.metiers) || metierRecherche || "";
  // « Plombier · Écully » : métier + ville joints, format compact et
  // gris (plus de préfixe « Métier : » ni « Intervient sur », sans icône).
  const metierEtVille = [libelleMetier, villeIntervention]
    .filter(Boolean)
    .join(" · ");
  // La même ligne avec « Saint » abrégé (« St-Priest ») : utilisée
  // UNIQUEMENT si la ligne complète ne tient pas dans la largeur —
  // mieux vaut « St-Priest » entier que « Sain… » tronqué.
  const metierEtVilleAbrege = [libelleMetier, abregerSaint(villeIntervention)]
    .filter(Boolean)
    .join(" · ");
  // Type de compte : cercle (indépendant) / carré arrondi (société).
  // Plus de ligne secondaire (ni société, ni « Dirigée par … »).
  const societe = estSociete(artisan);

  // Un clic ouvre la fiche ; une SÉLECTION de texte ne l'ouvre PAS
  // (on annule la navigation si du texte est sélectionné). Sur grand
  // écran, ouverture dans la colonne de droite (sans navigation).
  const surClicLien = (evenement: React.MouseEvent) => {
    const selection =
      typeof window !== "undefined" ? window.getSelection() : null;
    if (selection && selection.toString().length > 0) {
      evenement.preventDefault();
      return;
    }
    if (surClicFiche && window.matchMedia("(min-width: 1024px)").matches) {
      evenement.preventDefault();
      surClicFiche(artisan.slug ?? artisan.id);
    }
  };

  return (
    <div>
      {/* Style 2026 : coins arrondis 16 px, contour ultra-fin 1 px gris
          clair, ombre imperceptible, fond blanc pur — la carte
          « flotte » sur le fond gris de la page (dès 768 px). */}
      <article
        className="relative rounded-2xl border overflow-hidden bg-fond shadow-[0_1px_4px_rgba(16,27,51,0.06)]"
        style={{ borderColor: couleurContourCarte }}
      >
        {/* Cœur favori SEUL (sans encadré) dans l'angle HAUT DROIT,
            aligné avec le haut de la photo — façon Airbnb / Vinted.
            Posé au-dessus (z-10), hors du lien : le clic bascule le
            favori sans jamais ouvrir la fiche. */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <BoutonFavoriCarte
            artisanId={artisan.id}
            nomArtisan={artisan.nom_affiche}
            userId={userId}
            initialActif={initialFavori}
            variante="nu"
          />
        </div>

        {/* ===== Haut : PHOTO RONDE à gauche + bloc texte à droite ===== */}
        <Link
          href={lienFiche}
          onClick={surClicFiche ? surClicLien : undefined}
          className="flex items-center gap-4 px-4 pt-4 pb-1"
        >
          {/* Grande photo (~28 % de la largeur) : CERCLE ROND pour un
              indépendant (une personne), CARRÉ AUX ANGLES ARRONDIS pour
              une société (une entreprise) — même taille. */}
          {/* Photo ~28 % de la carte, PLAFONNÉE à 104 px à toutes les
              largeurs (y compris smartphone étiré) : elle ne grandit pas
              démesurément quand la carte s'élargit — reste proportionnée. */}
          <span
            className={`relative w-[28%] max-w-[104px] aspect-square overflow-hidden shrink-0 bg-gradient-to-br from-degrade-debut to-degrade-fin flex items-center justify-center ${
              societe ? "rounded-2xl" : "rounded-full"
            }`}
          >
            {artisan.photo_url ? (
              <Image
                src={artisan.photo_url}
                alt={`Photo de ${artisan.nom_affiche}`}
                fill
                sizes="104px"
                className="object-cover"
              />
            ) : (
              <span aria-hidden className="text-white font-bold text-3xl select-none">
                {initialesDe(artisan.nom_affiche)}
              </span>
            )}
          </span>

          {/* Bloc texte, aligné à gauche, centré verticalement :
              1) le NOM en gros (~18 px, gras — accent visuel fort) ;
              2) « Plombier · Écully » en gris, compact (sans préfixe
                 ni icône) ;
              3) la ligne de JOIGNABILITÉ discrète : petite puce ronde
                 de 6 px, verte (Joignable) / rouge (Indisponible),
                 suivie du texte de la MÊME couleur, non gras. */}
          <span className="min-w-0 flex-1 flex flex-col">
            {/* pr-7 : réserve la place du cœur en haut à droite ; le nom
                ne passe jamais dessous. line-clamp-2 : un nom (ou une
                raison sociale) trop long est limité à DEUX lignes maximum,
                tronqué par « … » au-delà — jamais de troisième ligne. */}
            <span className="text-[18px] font-bold text-encre leading-tight pr-7 line-clamp-2">
              {artisan.nom_affiche}
            </span>
            {metierEtVille && (
              <TexteAbregeable
                complet={metierEtVille}
                abrege={metierEtVilleAbrege}
                classe="mt-1 text-[14px] text-encre-douce"
              />
            )}
            {dispo && (
              <span className="mt-1 flex items-center gap-1.5 min-w-0">
                <span
                  aria-hidden
                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: dispo.couleur }}
                />
                {/* Mot d'état coloré (vert/rouge), reste de la phrase en
                    GRIS ; jour abrégé automatiquement si la place manque,
                    jamais de troncature ni de retour à la ligne. */}
                <StatutJoignabilite
                  etat={dispo.etat}
                  precision={dispo.precision}
                  precisionAbrege={dispo.precisionAbrege}
                  couleur={dispo.couleur}
                  classe="text-[13px] leading-tight"
                />
              </span>
            )}
          </span>
        </Link>

        {/* ===== Les 3 chiffres, alignés à gauche dans chaque tiers.
            Ordre : Google (gauche) · Ancienneté (centre) · Instagram
            (droite). ===== */}
        <Link
          href={lienFiche}
          onClick={surClicFiche ? surClicLien : undefined}
          className="block px-4 py-3"
        >
          {/* À TOUTES les largeurs (mobile, 768–1023 en grille, et mode
              double ≥ 1024 « format 1440 ») : la rangée des 3 chiffres suit
              la carte (l'espace entre blocs grandit modérément avec la
              largeur) MAIS est bornée à 350 px et centrée — l'espacement
              reste aéré et régulier sans devenir excessif quand la carte
              s'élargit (≈ 25 px vers 375 px de carte → ≈ 38 px au plafond),
              jamais tassé ni éclaté. Même logique d'équilibrage partout. */}
          <div className="grid grid-cols-3 gap-2 max-w-[350px] mx-auto">
            <StatCarte
              valeur={aDesAvis ? formatNote.format(Number(artisan.note_google)) : "—"}
              etoile={aDesAvis}
              libelle={
                aDesAvis ? `${artisan.nombre_avis_google} avis Google` : "avis à venir"
              }
            />
            <StatCarte valeur={anciennete.valeur} libelle={anciennete.libelle} />
            <StatCarte
              valeur={
                artisan.abonnes_instagram != null
                  ? formatCompact.format(artisan.abonnes_instagram)
                  : "—"
              }
              libelle="abonnés Insta"
            />
          </div>
        </Link>

        {/* ===== Boutons d'action, coins arrondis ~12 px, MÊME hauteur
            (48 px) et MÊME style : fond blanc, contour gris fin, texte
            gris foncé — seule l'ICÔNE de canal est colorée (« Appeler »
            téléphone BLEU iOS, « Whatsapp » vert WhatsApp). Puis le
            bouton PARTAGER (même gabarit, icône grise). Ces boutons
            gardent leur action propre et n'ouvrent jamais la fiche. ===== */}
        <div className={`flex items-center gap-2.5 px-4 pt-1 ${niveau ? "pb-3" : "pb-4"}`}>
          {telephoneAffiche && (
            <a
              href={lienTelephone(artisan.telephone!)}
              aria-label={`Appeler ${artisan.nom_affiche}`}
              className="flex-1 h-12 rounded-xl border bg-fond flex items-center justify-center gap-2 text-[15px] font-semibold text-encre-douce hover:bg-fond-doux active:scale-[0.99] transition"
              style={{ borderColor: couleurBordure }}
            >
              {/* seule l'icône est colorée : bleu iOS (~#007AFF) */}
              <span className="flex shrink-0" style={{ color: COULEURS.contactTelephone }}>
                <IconeTelephone taille={20} />
              </span>
              Appeler
            </a>
          )}
          {artisan.whatsapp && (
            <a
              href={lienWhatsApp(
                artisan.whatsapp,
                `Bonjour ${artisan.nom_affiche}, je vous ai trouvé sur Roswel.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Écrire à ${artisan.nom_affiche} sur WhatsApp`}
              className="flex-1 h-12 rounded-xl border bg-fond flex items-center justify-center gap-2 text-[15px] font-semibold text-encre-douce hover:bg-fond-doux active:scale-[0.99] transition"
              style={{ borderColor: couleurBordure }}
            >
              <span className="flex shrink-0" style={{ color: COULEURS.contactWhatsApp }}>
                <IconeWhatsApp taille={20} />
              </span>
              Whatsapp
            </a>
          )}
          {/* Partager : MÊME gabarit que l'ancien cœur (carré 48 px,
              fond blanc, contour gris fin), icône grise. SMARTPHONE
              (< 560 px) : feuille de partage NATIVE, inchangée. À
              PARTIR DE 560 px : la MÊME fenêtre de partage que la fiche
              artisan — même composant, même contenu, même
              comportement. Une bulle « Lien copié » ne laissait aucun
              choix ; la fenêtre en offre cinq. Le cœur, lui, est passé
              en haut à droite. */}
          <BoutonPartageFiche
            nomArtisan={artisan.nom_affiche}
            cheminFiche={lienFiche}
            variante="carte"
            couleurContour={couleurBordure}
            //  nº 759 — la marque se dit ICI depuis que le défaut du
            //  composant est celui de YokoFolio (voir sa note).
            marque={MARQUE.nom}
            avecFenetre
            metier={libelleMetier || undefined}
            commune={villeIntervention || undefined}
          />
        </div>

        {/* ===== BANDEAU DE PIED, à l'INTÉRIEUR de la carte, séparé par
            un trait fin gris clair. UNIQUEMENT si l'artisan a un badge de
            niveau (Recommandé ≥ 40 / Très recommandé ≥ 75) : à GAUCHE
            l'icône ronde à coche (la même que sur la fiche) + le libellé
            coloré (rose « Très recommandé » / bleu « Recommandé ») ; à
            DROITE « Score de confiance X/100 » en gris. Sans badge
            (score < 40) : AUCUN bandeau, aucun score — la carte s'arrête
            à la ligne des boutons. ===== */}
        {niveau && (
          <div
            className="flex items-center justify-between gap-2 border-t px-4 py-3"
            style={{ borderColor: couleurContourCarte }}
          >
            <span
              className="inline-flex items-center gap-1.5 min-w-0 font-bold text-[13px]"
              style={{ color: niveau.couleur }}
            >
              <span className="shrink-0 flex" aria-hidden>
                <IconeBadgeVerifie taille={18} teinte={niveau.couleur} />
              </span>
              <span className="truncate">{niveau.label}</span>
            </span>
            {/* « Score de confiance » : EXACTEMENT la même typographie
                que « d'ancienneté » sous les trois chiffres — même gris
                de la charte (encre-douce) et même taille (13 px). La
                couleur était déjà la bonne ; c'était la taille, plus
                petite d'un pixel, qui faisait paraître ce libellé plus
                pâle que son voisin. */}
            <span className="shrink-0 text-[13px] text-encre-douce whitespace-nowrap">
              Score de confiance{" "}
              {/* LE CHIFFRE EN ROSE (couleur de la marque) : c'est LA
                  donnée de la carte, celle qui justifie le classement.
                  Le libellé qui le précède reste gris et fin — le
                  contraste des deux fait lire le score en premier.
                  Graisse et taille inchangées. */}
              <span className="font-bold text-primaire">
                {artisan.score_total}/100
              </span>
            </span>
          </div>
        )}
      </article>
    </div>
  );
}
