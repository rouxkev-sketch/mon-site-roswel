import { NextResponse } from "next/server";
import { GEO, LIMITES, METIERS } from "@/config/roswel";
import { offreDesMetiers } from "@/lib/metiers";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { slugifier } from "@/lib/slug";
import { nettoyerSiren, verifierSiren } from "@/lib/siren";
import { calculerScoreTotal, determinerPastille } from "@/lib/score";
import {
  JOURS_SEMAINE,
  enMinutes,
  travailleNuit,
  travailleWeekend,
  type HorairesSemaine,
} from "@/lib/horaires";

/**
 * ENREGISTREMENT DE LA FICHE ARTISAN (étape 8a)
 * ---------------------------------------------
 * Reçoit le formulaire, vérifie TOUT côté serveur (on ne fait
 * jamais confiance au navigateur), vérifie le SIREN (OBLIGATOIRE)
 * auprès de l'annuaire officiel, choisit une adresse web unique,
 * puis enregistre. La fiche reste invisible tant que l'admin ne
 * l'a pas validée (statut « en_attente ») — et l'admin ne peut
 * pas valider sans SIREN vérifié.
 */

type Corps = {
  nom_affiche?: string;
  type_compte?: string;
  nom_societe?: string | null;
  nom_responsable?: string | null;
  photo_url?: string;
  metiers?: string[];
  ville_code_insee?: string;
  adresse?: string | null;
  rayon_intervention_km?: number;
  lien_instagram?: string;
  site_internet?: string | null;
  bio?: string | null;
  horaires?: Record<string, unknown>;
  dispo_urgence?: boolean;
  dispo_feries?: boolean;
  absence_debut?: string | null;
  absence_fin?: string | null;
  telephone?: string | null;
  telephone_visible?: boolean;
  whatsapp?: string | null;
  siren?: string | null;
};

function erreur(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

/** "HH:MM-HH:MM" bien formé (heures lisibles) ? */
function creneauValide(plage: unknown): plage is string {
  if (typeof plage !== "string") return false;
  const [debut, fin] = plage.split("-");
  return enMinutes(debut ?? "") != null && enMinutes(fin ?? "") != null;
}

/**
 * Nettoie et valide les horaires reçus : pour chaque jour, null
 * (fermé), "24h24", ou 1 à 4 créneaux "HH:MM-HH:MM". Renvoie null
 * si une valeur est illisible.
 */
function nettoyerHoraires(brut: Record<string, unknown> | undefined):
  | HorairesSemaine
  | null {
  const propre: HorairesSemaine = {};
  for (const jour of JOURS_SEMAINE) {
    const valeur = brut?.[jour];
    if (valeur == null) {
      propre[jour] = null;
      continue;
    }
    if (valeur === "24h24") {
      propre[jour] = "24h24";
      continue;
    }
    if (
      Array.isArray(valeur) &&
      valeur.length >= 1 &&
      valeur.length <= 4 &&
      valeur.every(creneauValide)
    ) {
      propre[jour] = valeur as string[];
      continue;
    }
    return null; // format inattendu
  }
  return propre;
}

/** "AAAA-MM-JJ" plausible ? */
function dateValide(texte: unknown): texte is string {
  return (
    typeof texte === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(texte) &&
    !Number.isNaN(new Date(texte).getTime())
  );
}

export async function POST(request: Request) {
  // ----- 1. Qui est connecté ? -----
  const supabaseSession = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabaseSession.auth.getUser();
  if (!user) {
    return erreur("Connecte-toi pour enregistrer ta fiche.", 401);
  }

  let corps: Corps;
  try {
    corps = (await request.json()) as Corps;
  } catch {
    return erreur("Formulaire illisible : recharge la page et réessaie.");
  }

  // ----- 2. Vérifications des champs -----
  const nom = (corps.nom_affiche ?? "").trim();
  if (nom.length < 2 || nom.length > 80) {
    return erreur("Le nom affiché doit faire entre 2 et 80 caractères.");
  }

  // Type de compte : indépendant (photo en cercle) ou société (photo
  // en carré arrondi). Par défaut « indépendant ».
  const typeCompte = corps.type_compte === "societe" ? "societe" : "independant";

  const photoUrl = corps.photo_url ?? "";
  if (!photoUrl.includes(`/photos-artisans/${user.id}/`)) {
    return erreur(
      typeCompte === "societe"
        ? "Le logo ou la photo est obligatoire (carré)."
        : "La photo de votre visage est obligatoire (carré)."
    );
  }

  // Le métier : UNE SEULE entrée de la liste fermée (un métier simple
  // OU une double compétence). On vérifie que les métiers reçus
  // correspondent EXACTEMENT à une entrée du menu — jamais une
  // combinaison libre.
  const metiersValides = METIERS.map((m) => m.slug);
  const metiers = (corps.metiers ?? []).filter((m) =>
    metiersValides.includes(m)
  );
  if (metiers.length === 0) {
    return erreur("Choisis ton métier dans la liste.");
  }
  if (!offreDesMetiers(metiers)) {
    return erreur(
      "Choisis UNE entrée de la liste : un métier, ou une double compétence."
    );
  }

  // La ville : choisie dans le sélecteur du moteur de recherche.
  // On relit la commune en base : nom officiel, code postal et
  // coordonnées GPS de son centre (calcul du rayon d'intervention).
  if (!corps.ville_code_insee) {
    return erreur("Choisis ta ville dans la liste de suggestions.");
  }

  const rayon = Number(corps.rayon_intervention_km);
  if (!GEO.rayonsInterventionKm.includes(rayon)) {
    return erreur("Choisis un rayon d'intervention dans la liste.");
  }

  // Complément d'adresse FACULTATIF (rue) : n'a d'effet que sur la carte
  // de la fiche ; la ville seule reste obligatoire (ci-dessus).
  const adresse = (corps.adresse ?? "").toString().trim() || null;
  if (adresse && adresse.length > 120) {
    return erreur("L'adresse précise est limitée à 120 caractères.");
  }

  const instagram = (corps.lien_instagram ?? "").trim();
  if (!/^https:\/\/(www\.)?instagram\.com\/.+/i.test(instagram)) {
    return erreur(
      "Le lien Instagram est obligatoire (au format https://www.instagram.com/votre.compte)."
    );
  }

  // Site internet FACULTATIF : vide = pas de site (la fiche affichera un
  // tiret). S'il est renseigné, il doit être une vraie adresse http(s) —
  // c'est un lien que les visiteurs vont ouvrir.
  const siteInternet = (corps.site_internet ?? "").toString().trim() || null;
  if (siteInternet && !/^https?:\/\/[^\s]+\.[^\s]+/i.test(siteInternet)) {
    return erreur(
      "L'adresse de ton site doit commencer par https:// (par exemple https://www.mon-entreprise.fr)."
    );
  }
  if (siteInternet && siteInternet.length > 200) {
    return erreur("L'adresse de ton site est limitée à 200 caractères.");
  }

  // PRÉSENTATION : obligatoire, et assez fournie pour dire quelque
  // chose. Les RETOURS À LA LIGNE sont conservés tels quels (seuls les
  // espaces de début et de fin sont retirés) : l'artisan peut écrire un
  // paragraphe puis une liste à tirets, et sa fiche les affichera.
  const bio = (corps.bio ?? "").toString().trim();
  if (bio.length < LIMITES.bioMinCaracteres) {
    return erreur(
      `La présentation est obligatoire : ${LIMITES.bioMinCaracteres} caractères minimum.`
    );
  }
  if (bio.length > LIMITES.bioMaxCaracteres) {
    return erreur(
      `La présentation est limitée à ${LIMITES.bioMaxCaracteres} caractères.`
    );
  }

  // Indépendant : société facultative (petite ligne) ; société : le
  // nom de la société EST le nom affiché, et le responsable facultatif
  // (« Dirigée par … »). Les champs non pertinents sont mis à null.
  const nomSociete =
    typeCompte === "independant"
      ? (corps.nom_societe ?? "").toString().trim() || null
      : null;
  const nomResponsable =
    typeCompte === "societe"
      ? (corps.nom_responsable ?? "").toString().trim() || null
      : null;

  // Les horaires : fermé / 24h24 / créneaux — puis DÉDUCTION de
  // « travaille la nuit » et « travaille le week-end » (plus de cases)
  const horaires = nettoyerHoraires(corps.horaires);
  if (horaires === null) {
    return erreur(
      "Horaires illisibles : chaque jour doit être fermé, « 24h/24 », ou 1 à 4 créneaux HH:MM-HH:MM."
    );
  }

  // RÈGLE DE CONTACT MINIMUM : au moins un moyen de contact
  // JOIGNABLE — un téléphone affiché ou un WhatsApp. Jamais de
  // fiche fantôme impossible à contacter.
  const whatsapp = (corps.whatsapp ?? "").toString().trim();
  if (whatsapp && whatsapp.replace(/\D/g, "").length < 10) {
    return erreur("Le numéro WhatsApp doit contenir au moins 10 chiffres.");
  }
  const telephoneNettoye = corps.telephone?.toString().trim() || null;
  const telephoneVisible = corps.telephone_visible === true;
  if (!whatsapp && !(telephoneNettoye && telephoneVisible)) {
    return erreur(
      "Au moins un moyen de contact est obligatoire : un téléphone affiché sur la fiche, ou un numéro WhatsApp."
    );
  }

  // La période de fermeture (absence) : les deux dates ou aucune
  const absenceDebut = corps.absence_debut ?? null;
  const absenceFin = corps.absence_fin ?? null;
  if (absenceDebut !== null || absenceFin !== null) {
    if (!dateValide(absenceDebut) || !dateValide(absenceFin)) {
      return erreur(
        "Période de fermeture : renseigne les deux dates (ou aucune)."
      );
    }
    if (absenceFin < absenceDebut) {
      return erreur(
        "Période de fermeture : la date de fin doit suivre la date de début."
      );
    }
  }

  // ----- 3. Vérification du SIREN (OBLIGATOIRE) -----
  // Le SIREN sert UNIQUEMENT à vérifier que l'entreprise existe et
  // est active : aucune fiche n'est validée sans SIREN vérifié.
  if (!corps.siren) {
    return erreur("Le numéro SIREN est obligatoire (9 chiffres).");
  }
  const siren = nettoyerSiren(corps.siren);
  if (siren.length !== 9) {
    return erreur("Le SIREN doit contenir exactement 9 chiffres.");
  }
  let sirenVerifie = false;
  let dateCreation: string | null = null;
  let noteSiren = "";
  const resultat = await verifierSiren(siren, nom);
  if (resultat.etat === "verifie") {
    sirenVerifie = true;
    dateCreation = resultat.dateCreation;
    noteSiren = ` SIREN vérifié : ${resultat.nomLegal}.`;
  } else if (resultat.etat === "introuvable") {
    return erreur(
      "Ce SIREN est introuvable dans l'annuaire officiel des entreprises. Vérifie le numéro."
    );
  } else if (resultat.etat === "inactif") {
    return erreur(
      `Ce SIREN correspond à un établissement fermé (${resultat.nomLegal}). Vérifie le numéro.`
    );
  } else {
    // Annuaire injoignable : on enregistre quand même — la fiche ne
    // pourra de toute façon pas être validée avant re-vérification.
    noteSiren =
      " La vérification du SIREN n'a pas pu aboutir (annuaire injoignable) : elle sera refaite à la validation.";
  }

  // ----- 4. Enregistrement -----
  try {
    const admin = creerClientSupabaseAdmin();

    // La commune choisie (centre GPS officiel de la table communes)
    const { data: commune, error: erreurCommune } = await admin
      .from("communes")
      .select("code_insee, nom, codes_postaux, latitude, longitude")
      .eq("code_insee", corps.ville_code_insee)
      .maybeSingle();
    if (erreurCommune) throw new Error(erreurCommune.message);
    if (!commune) {
      return erreur("Ville introuvable : choisis-la dans la liste de suggestions.");
    }

    // La fiche existe-t-elle déjà pour ce compte ? (ses chiffres
    // Instagram/Google et sa date Sirene servent au recalcul du score)
    const { data: existante, error: erreurLecture } = await admin
      .from("artisans")
      .select(
        "id, slug, statut_validation, abonnes_instagram, publications_instagram, note_google, nombre_avis_google, date_creation_entreprise"
      )
      .eq("user_id", user.id)
      .maybeSingle();
    if (erreurLecture) throw new Error(erreurLecture.message);

    // La date de création retenue : celle que l'annuaire vient de
    // confirmer, sinon celle déjà en base (jamais écrasée par un
    // annuaire injoignable).
    const dateCreationRetenue =
      dateCreation ?? existante?.date_creation_entreprise ?? null;

    // Le score de confiance est recalculé à CHAQUE vérification
    // Sirene : l'ancienneté (20 points) vient de cette date.
    const score = calculerScoreTotal(
      existante?.abonnes_instagram ?? null,
      existante?.publications_instagram ?? null,
      existante?.note_google ?? null,
      existante?.nombre_avis_google ?? null,
      dateCreationRetenue
    );

    // Adresse web (slug) : choisie à la création, stable ensuite
    let slug = existante?.slug ?? null;
    if (!slug) {
      const base = slugifier(nom) || "artisan";
      slug = base;
      for (let i = 2; ; i += 1) {
        const { data: pris } = await admin
          .from("artisans")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!pris) break;
        slug = `${base}-${i}`;
      }
    }

    // Une fiche corrigée repart en vérification ; sinon statut inchangé
    const statut =
      existante?.statut_validation === "modifications_demandees"
        ? "en_attente"
        : (existante?.statut_validation ?? "en_attente");

    const valeurs = {
      user_id: user.id,
      slug,
      nom_affiche: nom,
      type_compte: typeCompte,
      nom_societe: nomSociete,
      nom_responsable: nomResponsable,
      photo_url: photoUrl,
      ville_code_insee: commune.code_insee,
      ville_nom: commune.nom,
      ville_code_postal: commune.codes_postaux?.[0] ?? null,
      adresse,
      latitude: commune.latitude,
      longitude: commune.longitude,
      rayon_intervention_km: rayon,
      lien_instagram: instagram,
      site_internet: siteInternet,
      bio,
      horaires,
      dispo_urgence: Boolean(corps.dispo_urgence),
      // Déduites des horaires — jamais cochées à la main
      dispo_nuit: travailleNuit(horaires),
      dispo_weekend: travailleWeekend(horaires),
      dispo_feries: Boolean(corps.dispo_feries),
      absence_debut: absenceDebut,
      absence_fin: absenceFin,
      telephone: telephoneNettoye,
      // La case « Afficher mon téléphone » est enregistrée TELLE
      // QUELLE (décochée = décochée) — elle ne concerne QUE le
      // téléphone, jamais WhatsApp
      telephone_visible: telephoneVisible,
      whatsapp: whatsapp || null,
      siren,
      siren_verifie: sirenVerifie,
      date_creation_entreprise: dateCreationRetenue,
      score_total: score,
      pastille: determinerPastille(score),
      statut_validation: statut,
      motifs_modifications: [] as string[], // repart propre après correction
    };

    const { data: enregistre, error: erreurEcriture } = await admin
      .from("artisans")
      .upsert(valeurs, { onConflict: "user_id" })
      .select("id")
      .single();
    if (erreurEcriture || !enregistre) {
      throw new Error(erreurEcriture?.message ?? "échec de l'enregistrement");
    }

    // Les métiers (on remplace la liste)
    await admin.from("artisan_metiers").delete().eq("artisan_id", enregistre.id);
    const { error: erreurMetiers } = await admin
      .from("artisan_metiers")
      .insert(metiers.map((metier) => ({ artisan_id: enregistre.id, metier })));
    if (erreurMetiers) throw new Error(erreurMetiers.message);

    return NextResponse.json({
      ok: true,
      message: existante
        ? `Fiche mise à jour.${noteSiren}${
            statut === "en_attente"
              ? " Elle repart en vérification : elle sera visible après validation."
              : ""
          }`
        : `Fiche envoyée !${noteSiren} Elle sera visible dès qu'elle aura été vérifiée par notre équipe.`,
    });
  } catch (e) {
    return erreur(
      `Enregistrement impossible : ${e instanceof Error ? e.message : String(e)}`,
      500
    );
  }
}
