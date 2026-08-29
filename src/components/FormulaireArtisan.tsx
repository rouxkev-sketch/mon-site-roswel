"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXEMPLES_PRESENTATION, GEO, LIMITES } from "@/config/roswel";
import { JOURS_SEMAINE, type HorairesSemaine } from "@/lib/horaires";
import { CACHE_PHOTOS } from "@/lib/cache-photos";
import { metiersDeLOffre, offreDesMetiers } from "@/lib/metiers";
import { compresserPhoto } from "@/lib/photo";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { ChampMetier } from "@/components/ChampMetier";
import { ChampVille, type VilleChoisie } from "@/components/ChampVille";

/** Les informations de la fiche telles que le formulaire les manipule.
    (« la nuit » et « le week-end » ne se cochent plus : le serveur les
    déduit des horaires) */
export type DonneesFiche = {
  nom_affiche: string;
  type_compte: "independant" | "societe";
  nom_societe: string | null;
  nom_responsable: string | null;
  photo_url: string | null;
  metiers: string[];
  ville_code_insee: string | null;
  ville_nom: string | null;
  ville_code_postal: string | null;
  /** Complément d'adresse FACULTATIF (rue + n°) : n'a d'intérêt que si
      l'artisan veut afficher une localisation précise (carte) sur sa
      fiche — un local où il reçoit ses clients par exemple. */
  adresse: string | null;
  rayon_intervention_km: number;
  lien_instagram: string | null;
  /** Site internet personnel, FACULTATIF : beaucoup d'artisans n'en ont
      pas, et leur fiche Roswel fait office de vitrine. */
  site_internet: string | null;
  bio: string | null;
  horaires: HorairesSemaine | null;
  dispo_urgence: boolean;
  dispo_feries: boolean;
  absence_debut: string | null;
  absence_fin: string | null;
  telephone: string | null;
  telephone_visible: boolean;
  whatsapp: string | null;
  siren: string | null;
};

/** L'éditeur d'un jour : 24h/24, ou une liste de créneaux (vide = fermé) */
type EtatJour = {
  vingtQuatre: boolean;
  creneaux: Array<{ debut: string; fin: string }>;
};

const CRENEAUX_MAX_PAR_JOUR = 4;

const classeChamp =
  "w-full min-h-[48px] rounded-2xl border border-bordure bg-fond px-4 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25";

/**
 * FORMULAIRE D'INSCRIPTION / MODIFICATION D'UN ARTISAN (étape 8a)
 * ---------------------------------------------------------------
 * Toutes les règles du cahier des charges (§13) : photo obligatoire,
 * Instagram obligatoire, nom de société OBLIGATOIRE, SIREN
 * OBLIGATOIRE (vérifié auprès de l'annuaire officiel — aucune
 * fiche validée sans), VILLE choisie dans le même sélecteur que le
 * moteur de recherche (le centre de la commune sert au calcul du
 * rayon d'intervention, et la ville s'affiche sur la carte),
 * téléphone optionnel avec case « afficher mon téléphone sur ma
 * fiche », WhatsApp avec case « identique au téléphone ».
 * L'enregistrement passe par le serveur (/api/artisan/fiche) qui
 * vérifie tout.
 */
export function FormulaireArtisan({
  userId,
  initial,
}: {
  userId: string;
  initial: DonneesFiche | null;
}) {
  const router = useRouter();

  // Type de compte : indépendant (personne, photo en cercle) ou
  // société (entreprise, photo en carré arrondi). Le formulaire s'adapte.
  const [typeCompte, setTypeCompte] = useState<"independant" | "societe">(
    initial?.type_compte ?? "independant"
  );
  const [nom, setNom] = useState(initial?.nom_affiche ?? "");
  const societe = typeCompte === "societe";
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? null);
  const [apercuPhoto, setApercuPhoto] = useState<string | null>(
    initial?.photo_url ?? null
  );
  const [photoEnCours, setPhotoEnCours] = useState(false);
  // L'ENTRÉE choisie (métier simple ou double compétence) et les
  // métiers qu'elle représente en base
  const [metiers, setMetiers] = useState<string[]>(initial?.metiers ?? []);
  const [offreMetier, setOffreMetier] = useState<string>(
    () => offreDesMetiers(initial?.metiers ?? [])?.slug ?? ""
  );
  const villeInitiale: VilleChoisie | null =
    initial?.ville_code_insee && initial.ville_nom
      ? {
          code_insee: initial.ville_code_insee,
          nom: initial.ville_nom,
          slug: "",
          code_postal: initial.ville_code_postal ?? "",
        }
      : null;
  const [ville, setVille] = useState<VilleChoisie | null>(villeInitiale);
  const [adresse, setAdresse] = useState(initial?.adresse ?? "");
  const [rayon, setRayon] = useState(
    initial?.rayon_intervention_km ?? GEO.rayonsInterventionKm[1]
  );
  const [instagram, setInstagram] = useState(initial?.lien_instagram ?? "");
  const [siteInternet, setSiteInternet] = useState(initial?.site_internet ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [horaires, setHoraires] = useState<Record<string, EtatJour>>(() => {
    const etat: Record<string, EtatJour> = {};
    for (const jour of JOURS_SEMAINE) {
      const valeur = initial?.horaires?.[jour];
      if (valeur === "24h24") {
        etat[jour] = { vingtQuatre: true, creneaux: [] };
        continue;
      }
      // Nouveau format (tableau) ou ancien (une plage en texte)
      const plages =
        valeur == null ? [] : Array.isArray(valeur) ? valeur : [valeur];
      etat[jour] = {
        vingtQuatre: false,
        creneaux: plages
          .map((plage) => {
            const [debut, fin] = String(plage).split("-");
            return { debut: debut?.trim() ?? "", fin: fin?.trim() ?? "" };
          })
          .filter((c) => c.debut && c.fin),
      };
    }
    return etat;
  });
  const [urgence, setUrgence] = useState(initial?.dispo_urgence ?? false);
  const [feries, setFeries] = useState(initial?.dispo_feries ?? false);
  const [absenceDebut, setAbsenceDebut] = useState(initial?.absence_debut ?? "");
  const [absenceFin, setAbsenceFin] = useState(initial?.absence_fin ?? "");
  const [telephone, setTelephone] = useState(initial?.telephone ?? "");
  const [telephoneVisible, setTelephoneVisible] = useState(
    initial?.telephone_visible ?? true // cochée par défaut
  );
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [whatsappIdentique, setWhatsappIdentique] = useState(
    Boolean(initial?.whatsapp && initial.whatsapp === initial.telephone)
  );
  const [siren, setSiren] = useState(initial?.siren ?? "");

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [retour, setRetour] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  /* ----- Photo : compression puis envoi dans SON dossier ----- */
  async function changerPhoto(evenement: React.ChangeEvent<HTMLInputElement>) {
    const fichier = evenement.target.files?.[0];
    if (!fichier) return;

    setPhotoEnCours(true);
    setApercuPhoto(URL.createObjectURL(fichier)); // aperçu immédiat
    try {
      const compressee = await compresserPhoto(fichier);
      const chemin = `${userId}/photo-${Date.now()}.jpg`;
      const supabase = creerClientSupabaseNavigateur();
      const { error } = await supabase.storage
        .from("photos-artisans")
        //  §1 (nº 721) — la durée, et RIEN d'autre : cet envoi n'a jamais
        //  eu `upsert`, on ne le lui ajoute pas au passage.
        .upload(chemin, compressee, {
          contentType: "image/jpeg",
          cacheControl: CACHE_PHOTOS,
        });
      if (error) throw new Error(error.message);

      const { data } = supabase.storage
        .from("photos-artisans")
        .getPublicUrl(chemin);
      setPhotoUrl(data.publicUrl);
    } catch {
      setApercuPhoto(photoUrl); // on revient à l'ancienne photo
      setRetour({
        ok: false,
        message:
          "L'envoi de la photo a échoué. Vérifie ta connexion puis réessaie.",
      });
    }
    setPhotoEnCours(false);
  }

  // Choix UNIQUE : l'entrée choisie remplace la liste des métiers
  // enregistrés (une double compétence en pose deux).
  function choisirOffreMetier(slug: string) {
    setOffreMetier(slug);
    setMetiers(metiersDeLOffre(slug));
  }

  // L'exemple de présentation affiché dans le champ vide : celui du
  // métier choisi (pour une double compétence, celui du PREMIER métier —
  // « Plombier & Chauffagiste » montre l'exemple du plombier), et un
  // exemple générique tant qu'aucun métier n'est sélectionné.
  const exemplePresentation =
    EXEMPLES_PRESENTATION[metiers[0] ?? ""] ?? EXEMPLES_PRESENTATION.defaut;

  /* ----- Manipulation des horaires (par jour) ----- */
  function poserJour(jour: string, etat: EtatJour) {
    setHoraires((actuels) => ({ ...actuels, [jour]: etat }));
  }

  function basculer24h(jour: string) {
    const etat = horaires[jour];
    poserJour(jour, { vingtQuatre: !etat.vingtQuatre, creneaux: [] });
  }

  function ajouterCreneau(jour: string) {
    const etat = horaires[jour];
    if (etat.creneaux.length >= CRENEAUX_MAX_PAR_JOUR) return;
    // Second créneau proposé après une coupure déjeuner classique
    const nouveau =
      etat.creneaux.length === 0
        ? { debut: "08:00", fin: "18:00" }
        : { debut: "14:00", fin: "18:00" };
    poserJour(jour, {
      vingtQuatre: false,
      creneaux: [...etat.creneaux, nouveau],
    });
  }

  function supprimerCreneau(jour: string, indice: number) {
    const etat = horaires[jour];
    poserJour(jour, {
      ...etat,
      creneaux: etat.creneaux.filter((_, i) => i !== indice),
    });
  }

  function modifierCreneau(
    jour: string,
    indice: number,
    champ: "debut" | "fin",
    valeur: string
  ) {
    const etat = horaires[jour];
    poserJour(jour, {
      ...etat,
      creneaux: etat.creneaux.map((c, i) =>
        i === indice ? { ...c, [champ]: valeur } : c
      ),
    });
  }

  /* ----- Envoi au serveur ----- */
  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setRetour(null);

    if (nom.trim().length < 2)
      return setRetour({
        ok: false,
        message: societe
          ? "Le nom de la société est obligatoire."
          : "Votre prénom et nom sont obligatoires.",
      });
    if (!photoUrl)
      return setRetour({
        ok: false,
        message: societe
          ? "Le logo ou la photo est obligatoire (carré)."
          : "La photo de votre visage est obligatoire (carré).",
      });
    if (!offreMetier || metiers.length === 0)
      return setRetour({
        ok: false,
        message: "Choisis ton métier dans la liste (ou une double compétence).",
      });
    if (!ville)
      return setRetour({ ok: false, message: "Choisis ta ville dans la liste de suggestions." });
    if (bio.trim().length < LIMITES.bioMinCaracteres)
      return setRetour({
        ok: false,
        message: `Votre présentation est obligatoire : ${LIMITES.bioMinCaracteres} caractères minimum (vous en avez ${bio.trim().length}).`,
      });
    if (siren.replace(/\D/g, "").length !== 9)
      return setRetour({
        ok: false,
        message: "Le numéro SIREN est obligatoire : 9 chiffres.",
      });
    for (const jour of JOURS_SEMAINE) {
      const etat = horaires[jour];
      if (etat.vingtQuatre) continue;
      if (etat.creneaux.some((c) => !c.debut || !c.fin)) {
        return setRetour({
          ok: false,
          message: `Horaires du ${jour} : chaque créneau doit avoir une heure de début et de fin (ou supprime-le).`,
        });
      }
    }
    if ((absenceDebut && !absenceFin) || (!absenceDebut && absenceFin)) {
      return setRetour({
        ok: false,
        message: "Période de fermeture : renseigne les deux dates (ou aucune).",
      });
    }
    if (absenceDebut && absenceFin && absenceFin < absenceDebut) {
      return setRetour({
        ok: false,
        message: "Période de fermeture : la date de fin doit suivre la date de début.",
      });
    }
    // RÈGLE DE CONTACT MINIMUM : au moins un moyen de contact
    // joignable — téléphone AFFICHÉ ou WhatsApp (jamais de fiche
    // impossible à contacter)
    const whatsappEffectif = (
      whatsappIdentique && telephone.trim() !== "" ? telephone : whatsapp
    ).trim();
    if (whatsappEffectif && whatsappEffectif.replace(/\D/g, "").length < 10) {
      return setRetour({
        ok: false,
        message: "Le numéro WhatsApp doit contenir au moins 10 chiffres.",
      });
    }
    const telephoneJoignable = telephone.trim() !== "" && telephoneVisible;
    if (!whatsappEffectif && !telephoneJoignable) {
      return setRetour({
        ok: false,
        message:
          "Renseignez au moins un moyen de contact : un téléphone affiché sur votre fiche, ou un numéro WhatsApp.",
      });
    }

    setEnvoiEnCours(true);
    try {
      // Le nouveau format : "24h24", liste de créneaux, ou null (fermé)
      const horairesEnregistres: Record<string, string[] | "24h24" | null> = {};
      for (const jour of JOURS_SEMAINE) {
        const etat = horaires[jour];
        if (etat.vingtQuatre) {
          horairesEnregistres[jour] = "24h24";
        } else if (etat.creneaux.length > 0) {
          horairesEnregistres[jour] = etat.creneaux.map(
            (c) => `${c.debut}-${c.fin}`
          );
        } else {
          horairesEnregistres[jour] = null; // fermé
        }
      }

      const reponse = await fetch("/api/artisan/fiche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_affiche: nom.trim(),
          type_compte: typeCompte,
          nom_societe: null,
          nom_responsable: null,
          photo_url: photoUrl,
          metiers,
          ville_code_insee: ville.code_insee,
          adresse: adresse.trim() || null,
          rayon_intervention_km: rayon,
          lien_instagram: instagram.trim(),
          site_internet: siteInternet.trim() || null,
          bio: bio.trim(),
          horaires: horairesEnregistres,
          dispo_urgence: urgence,
          dispo_feries: feries,
          absence_debut: absenceDebut || null,
          absence_fin: absenceFin || null,
          telephone: telephone.trim() || null,
          telephone_visible: telephoneVisible,
          whatsapp: whatsappEffectif || null,
          siren: siren.trim() || null,
        }),
      });
      const resultat = (await reponse.json()) as { ok: boolean; message: string };
      setRetour(resultat);
      if (resultat.ok) router.refresh(); // met à jour le bandeau de statut
    } catch {
      setRetour({
        ok: false,
        message: "Pas de réponse du serveur. Vérifie ta connexion puis réessaie.",
      });
    }
    setEnvoiEnCours(false);
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-6">
      {/* ----- Type de compte (obligatoire, en tête) ----- */}
      <fieldset>
        <legend className="block text-sm font-medium mb-1.5">
          Vous êtes <span className="text-erreur">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { cle: "independant", label: "Artisan indépendant" },
            { cle: "societe", label: "Société ou entreprise" },
          ].map(({ cle, label }) => (
            <button
              key={cle}
              type="button"
              aria-pressed={typeCompte === cle}
              onClick={() => setTypeCompte(cle as "independant" | "societe")}
              className={`min-h-[48px] rounded-2xl border px-3 text-sm font-medium transition-colors ${
                typeCompte === cle
                  ? "border-primaire bg-primaire-clair text-primaire-fonce"
                  : "border-bordure text-encre-douce"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Rassurant à la bascule (indépendant ↔ société) : on ne perd
            rien en changeant de type de compte. */}
        <p className="text-[13px] text-encre-douce mt-2">
          Vous pouvez changer à tout moment. Vos avis, votre ancienneté et
          votre score de confiance sont conservés.
        </p>
      </fieldset>

      {/* ----- Nom principal (adapté au type de compte) ----- */}
      <div>
        <label htmlFor="champ-nom" className="block text-sm font-medium mb-1.5">
          {societe ? "Nom de la société" : "Prénom et nom"}{" "}
          <span className="text-erreur">*</span>{" "}
          <span className="text-encre-douce font-normal">
            {societe ? "(affiché en gros sur votre fiche)" : "(votre nom, affiché en gros)"}
          </span>
        </label>
        <input
          id="champ-nom"
          type="text"
          required
          minLength={2}
          maxLength={80}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder={societe ? "Ex. Plomberie Lyonnaise SARL" : "Ex. Marc-Antoine Perrez"}
          className={classeChamp}
        />
      </div>

      {/* ----- Photo (carré, affichée en cercle ou carré arrondi) ----- */}
      <div>
        <span className="block text-sm font-medium mb-1">
          {societe ? "Logo ou photo" : "Photo de votre visage"}{" "}
          <span className="text-erreur">*</span>{" "}
          <span className="text-encre-douce font-normal">(carré 1:1)</span>
        </span>
        <p className="text-[13px] text-encre-douce mb-2">
          {societe
            ? "Affichée en carré aux angles arrondis sur votre fiche. Une photo humaine rassure plus qu'un logo : nous recommandons vivement une photo du gérant ou d'un artisan référent."
            : "Une photo claire de votre visage, affichée en cercle rond sur votre fiche."}
        </p>
        <div className="flex items-center gap-4">
          {apercuPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={apercuPhoto}
              alt="Aperçu de la photo"
              className={`w-20 h-20 object-cover border border-bordure ${
                societe ? "rounded-2xl" : "rounded-full"
              }`}
            />
          ) : (
            <div
              className={`w-20 h-20 bg-fond-doux border border-bordure flex items-center justify-center text-2xl text-encre-douce ${
                societe ? "rounded-2xl" : "rounded-full"
              }`}
            >
              📷
            </div>
          )}
          <label className="min-h-[44px] inline-flex items-center rounded-full border border-bordure px-5 text-sm font-medium cursor-pointer hover:bg-fond-doux">
            {photoEnCours
              ? "Envoi en cours…"
              : apercuPhoto
                ? "Changer la photo"
                : "Choisir une photo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={changerPhoto}
              disabled={photoEnCours}
            />
          </label>
        </div>
      </div>

      {/* ----- Métier : UN SEUL choix dans la liste fermée -----
          Le MÊME menu que la recherche (ChampMetier) : les doubles
          compétences en tête, puis les métiers uniques. L'artisan
          choisit UNE entrée — un métier simple OU une double
          compétence, jamais les deux. */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Votre métier <span className="text-erreur">*</span>{" "}
          <span className="text-encre-douce font-normal">
            (un seul choix : un métier, ou une double compétence)
          </span>
        </label>
        <ChampMetier
          valeur={offreMetier}
          surChangement={choisirOffreMetier}
          placeholder="Quel artisan ?"
        />
      </div>

      {/* ----- Zone d'intervention ----- */}
      <div>
        <label htmlFor="champ-ville" className="block text-sm font-medium mb-1.5">
          Ville <span className="text-erreur">*</span>{" "}
          <span className="text-encre-douce font-normal">
            (affichée sur votre carte — son centre sert au calcul de distance)
          </span>
        </label>
        <ChampVille
          etiquette={null}
          texteIndicatif="Ex. Villeurbanne, Lyon…"
          villeInitiale={villeInitiale}
          surChoix={setVille}
        />

        {/* Complément d'adresse FACULTATIF (rue + numéro) : n'a d'intérêt
            que pour afficher une localisation précise (carte) sur la
            fiche — par exemple un local où vous recevez vos clients. */}
        <label htmlFor="champ-adresse" className="block text-sm font-medium mt-3 mb-1.5">
          Adresse précise{" "}
          <span className="text-encre-douce font-normal">(facultatif)</span>
        </label>
        <input
          id="champ-adresse"
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Ex. 24 rue Paul Bert"
          autoComplete="street-address"
          maxLength={120}
          className={classeChamp}
        />
        <p className="text-xs text-encre-douce mt-1.5">
          Utile uniquement si vous souhaitez afficher une localisation
          précise (une carte) sur votre fiche — un local où vous recevez
          vos clients, par exemple. Sinon, laissez vide : seule votre ville
          sera affichée.
        </p>

        <label htmlFor="champ-rayon" className="block text-sm font-medium mt-3 mb-1.5">
          Rayon d&apos;intervention
        </label>
        <select
          id="champ-rayon"
          value={rayon}
          onChange={(e) => setRayon(Number(e.target.value))}
          className={classeChamp}
        >
          {GEO.rayonsInterventionKm.map((km) => (
            <option key={km} value={km}>
              {km} km autour de mon adresse
            </option>
          ))}
        </select>
      </div>

      {/* ----- Instagram ----- */}
      <div>
        <label htmlFor="champ-instagram" className="block text-sm font-medium mb-1.5">
          Votre compte Instagram <span className="text-erreur">*</span>
        </label>
        <input
          id="champ-instagram"
          type="url"
          required
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="https://www.instagram.com/votre.compte"
          className={classeChamp}
        />
      </div>

      {/* ----- Site internet (FACULTATIF) -----
          Sans site, la fiche affiche simplement un tiret : aucune
          pénalité, la fiche Roswel EST la vitrine. */}
      <div>
        <label htmlFor="champ-site" className="block text-sm font-medium mb-1.5">
          Votre site internet{" "}
          <span className="text-encre-douce font-normal">(facultatif)</span>
        </label>
        <input
          id="champ-site"
          type="url"
          value={siteInternet}
          onChange={(e) => setSiteInternet(e.target.value)}
          placeholder="https://www.votre-entreprise.fr"
          className={classeChamp}
        />
      </div>

      {/* ----- Présentation (OBLIGATOIRE) ----- */}
      <div>
        <label htmlFor="champ-bio" className="block text-sm font-medium mb-1.5">
          Votre présentation <span className="text-erreur">*</span>
        </label>
        {/* Le CONSEIL, avant le champ : on dit quoi écrire AVANT
            d'écrire, pas après. */}
        <p className="text-xs text-encre-douce mb-2">
          Citez vos prestations, vos secteurs d&apos;intervention et vos années
          d&apos;expérience.
        </p>
        <textarea
          id="champ-bio"
          required
          rows={9}
          minLength={LIMITES.bioMinCaracteres}
          maxLength={LIMITES.bioMaxCaracteres}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          // L'exemple suit le MÉTIER choisi : un plombier ne se présente
          // pas comme un peintre. Il montre aussi la mise en forme
          // attendue — un paragraphe, une ligne vide, puis des tirets.
          placeholder={exemplePresentation}
          className={`${classeChamp} py-3 leading-relaxed`}
        />
        {/* COMPTEUR en direct : rouge tant que le minimum n'est pas
            atteint (l'enregistrement serait refusé), gris ensuite. */}
        <p
          className={`mt-1.5 text-xs ${
            bio.trim().length < LIMITES.bioMinCaracteres
              ? "text-erreur font-medium"
              : "text-encre-douce"
          }`}
        >
          {bio.trim().length} / {LIMITES.bioMaxCaracteres} caractères
          {bio.trim().length < LIMITES.bioMinCaracteres &&
            ` — minimum ${LIMITES.bioMinCaracteres}`}
        </p>
        {/* ENCOURAGEMENT — jamais bloquant : le minimum est atteint, la
            fiche peut être enregistrée, mais un texte plus fourni la
            servira mieux. */}
        {bio.trim().length >= LIMITES.bioMinCaracteres &&
          bio.trim().length < LIMITES.bioSeuilConseil && (
            <p className="mt-1 text-xs text-encre-douce">
              Un texte plus détaillé rend votre fiche plus visible sur Google.
            </p>
          )}
      </div>

      {/* ----- Horaires (par jour : fermé, 24h/24, ou créneaux) ----- */}
      <fieldset>
        <legend className="text-sm font-medium mb-1.5">Horaires</legend>
        <p className="text-xs text-encre-douce mb-2">
          Pour chaque jour : laissez « Fermé », cochez « 24h/24 », ou
          ajoutez un ou plusieurs créneaux (ex. 08:00 – 12:00 puis
          14:00 – 18:00). Travailler la nuit ou le week-end se déduit
          automatiquement de ces horaires.
        </p>
        <div className="rounded-2xl border border-bordure divide-y divide-bordure/60 overflow-hidden">
          {JOURS_SEMAINE.map((jour) => {
            const etat = horaires[jour];
            const ferme = !etat.vingtQuatre && etat.creneaux.length === 0;
            return (
              <div key={jour} className="px-3 py-2.5 text-sm">
                {/* Ligne du jour : nom, état, case 24h/24 */}
                <div className="flex items-center justify-between gap-2 min-h-[36px]">
                  <span className="capitalize font-medium">
                    {jour}
                    {ferme && (
                      <span className="text-encre-douce font-normal"> — Fermé</span>
                    )}
                  </span>
                  <label className="flex items-center gap-2 min-h-[44px] px-1 cursor-pointer text-encre-douce">
                    <input
                      type="checkbox"
                      checked={etat.vingtQuatre}
                      onChange={() => basculer24h(jour)}
                      className="w-4 h-4 accent-(--rw-primaire)"
                    />
                    Ouvert 24h/24
                  </label>
                </div>

                {/* Les créneaux du jour */}
                {!etat.vingtQuatre &&
                  etat.creneaux.map((creneau, indice) => (
                    <div
                      key={indice}
                      className="flex items-center gap-1.5 mt-1.5"
                    >
                      <input
                        type="time"
                        value={creneau.debut}
                        aria-label={`${jour} : début du créneau ${indice + 1}`}
                        onChange={(e) =>
                          modifierCreneau(jour, indice, "debut", e.target.value)
                        }
                        className="rounded-lg border border-bordure px-2 py-2 min-h-[44px]"
                      />
                      –
                      <input
                        type="time"
                        value={creneau.fin}
                        aria-label={`${jour} : fin du créneau ${indice + 1}`}
                        onChange={(e) =>
                          modifierCreneau(jour, indice, "fin", e.target.value)
                        }
                        className="rounded-lg border border-bordure px-2 py-2 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => supprimerCreneau(jour, indice)}
                        aria-label={`Supprimer le créneau ${indice + 1} du ${jour}`}
                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-encre-douce hover:bg-fond-doux text-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                {/* Ajouter un créneau */}
                {!etat.vingtQuatre &&
                  etat.creneaux.length < CRENEAUX_MAX_PAR_JOUR && (
                    <button
                      type="button"
                      onClick={() => ajouterCreneau(jour)}
                      className="mt-1.5 min-h-[40px] px-3 rounded-full border border-bordure text-xs font-medium text-primaire hover:bg-fond-doux"
                    >
                      + Ajouter un créneau
                    </button>
                  )}
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* ----- Urgence et jours fériés ----- */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium mb-1.5">Interventions</legend>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={urgence}
            onChange={(e) => setUrgence(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-(--rw-primaire)"
          />
          <span className="text-sm">
            <span className="font-medium">Dépannage d&apos;urgence</span>
            <span className="block text-encre-douce text-xs mt-0.5">
              Vous acceptez d&apos;intervenir immédiatement, sans
              rendez-vous, pendant vos horaires d&apos;ouverture.
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2.5 min-h-[36px] cursor-pointer">
          <input
            type="checkbox"
            checked={feries}
            onChange={(e) => setFeries(e.target.checked)}
            className="w-4 h-4 accent-(--rw-primaire)"
          />
          <span className="text-sm font-medium">
            J&apos;interviens les jours fériés
          </span>
        </label>
      </fieldset>

      {/* ----- Période de fermeture (vacances, chantier long…) ----- */}
      <fieldset>
        <legend className="text-sm font-medium mb-1.5">
          Période de fermeture{" "}
          <span className="text-encre-douce font-normal">(optionnel)</span>
        </legend>
        <p className="text-xs text-encre-douce mb-2">
          Pendant cette période, votre fiche reste visible avec la
          mention « Indisponible jusqu&apos;au… » et vous ne ressortez
          plus dans le filtre Urgence. Tout redevient normal
          automatiquement après la date de fin.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            du
            <input
              type="date"
              value={absenceDebut}
              onChange={(e) => setAbsenceDebut(e.target.value)}
              aria-label="Début de la période de fermeture"
              className="rounded-lg border border-bordure px-2 py-2 min-h-[44px]"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            au
            <input
              type="date"
              value={absenceFin}
              onChange={(e) => setAbsenceFin(e.target.value)}
              aria-label="Fin de la période de fermeture"
              className="rounded-lg border border-bordure px-2 py-2 min-h-[44px]"
            />
          </label>
          {(absenceDebut || absenceFin) && (
            <button
              type="button"
              onClick={() => {
                setAbsenceDebut("");
                setAbsenceFin("");
              }}
              className="min-h-[44px] px-4 rounded-full border border-bordure text-sm font-medium hover:bg-fond-doux"
            >
              Annuler la période
            </button>
          )}
        </div>
      </fieldset>

      {/* ----- Contact : au moins un des deux (téléphone affiché
              ou WhatsApp) — jamais de fiche injoignable ----- */}
      <div className="flex flex-col gap-3">
        <p className="text-sm text-encre-douce">
          Au moins un moyen de contact est obligatoire :{" "}
          <strong className="text-encre">
            un téléphone affiché ou un WhatsApp
          </strong>{" "}
          — c&apos;est par là que vos clients vous joignent.
        </p>
        <div>
          <label htmlFor="champ-whatsapp" className="block text-sm font-medium mb-1.5">
            WhatsApp{" "}
            <span className="text-encre-douce font-normal">
              (recommandé — discussion directe depuis votre fiche)
            </span>
          </label>
          {telephone.trim() !== "" && (
            <label className="flex items-center gap-2 text-sm min-h-[36px] mb-1">
              <input
                type="checkbox"
                checked={whatsappIdentique}
                onChange={(e) => setWhatsappIdentique(e.target.checked)}
                className="w-4 h-4 accent-(--rw-primaire)"
              />
              Le même numéro que mon téléphone ci-dessous
            </label>
          )}
          {!(whatsappIdentique && telephone.trim() !== "") && (
            <input
              id="champ-whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="06 12 34 56 78"
              className={classeChamp}
            />
          )}
        </div>

        <div>
          <label htmlFor="champ-telephone" className="block text-sm font-medium mb-1.5">
            Téléphone{" "}
            <span className="text-encre-douce font-normal">(optionnel)</span>
          </label>
          <input
            id="champ-telephone"
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="06 12 34 56 78"
            className={classeChamp}
          />
        </div>
        {telephone.trim() !== "" && (
          <div>
            {/* Cette case ne concerne QUE le téléphone : décochée,
                le numéro n'apparaît nulle part — le contact passe
                par WhatsApp */}
            <label className="flex items-center gap-2 text-sm min-h-[36px]">
              <input
                type="checkbox"
                checked={telephoneVisible}
                onChange={(e) => setTelephoneVisible(e.target.checked)}
                className="w-4 h-4 accent-(--rw-primaire)"
              />
              Afficher mon téléphone sur ma fiche
            </label>
            <p className="text-xs text-encre-douce mt-0.5 pl-6">
              Décochée : votre numéro n&apos;apparaît nulle part — il
              vous faut alors un WhatsApp renseigné pour rester
              joignable.
            </p>
          </div>
        )}
      </div>

      {/* ----- SIREN (obligatoire) ----- */}
      <div>
        <label htmlFor="champ-siren" className="block text-sm font-medium mb-1.5">
          Numéro SIREN <span className="text-erreur">*</span>{" "}
          <span className="text-encre-douce font-normal">
            (vérifié auprès de l&apos;annuaire officiel des entreprises —
            aucune fiche n&apos;est validée sans SIREN vérifié)
          </span>
        </label>
        <input
          id="champ-siren"
          type="text"
          inputMode="numeric"
          required
          value={siren}
          onChange={(e) => setSiren(e.target.value)}
          placeholder="9 chiffres"
          className={classeChamp}
        />
      </div>

      {/* ----- Envoi ----- */}
      <button
        type="submit"
        disabled={envoiEnCours || photoEnCours}
        className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full min-h-[52px] transition-colors disabled:opacity-60"
      >
        {envoiEnCours
          ? "Enregistrement…"
          : initial
            ? "Enregistrer les modifications"
            : "Envoyer ma fiche pour vérification"}
      </button>

      {retour && (
        <div
          role="status"
          className={`rounded-2xl border p-4 text-sm ${
            retour.ok
              ? "border-succes/40 bg-succes/5"
              : "border-erreur/40 bg-erreur/5"
          }`}
        >
          {retour.ok ? "✅ " : "❌ "}
          {retour.message}
        </div>
      )}
    </form>
  );
}
