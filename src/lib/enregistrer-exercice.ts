import { fuseauDuLieu, semaineVersBase } from "@/lib/horaires-studio";
import {
  colonnesDuLieu,
  modeVide,
  nomLieuRequis,
  type ModeEnSaisie,
  type StudioEnSaisie,
} from "@/lib/modes-exercice";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ÉCRIRE LES MODES D'EXERCICE ET LES STUDIOS
 * ===========================================
 * Appelé par le formulaire, APRÈS l'enregistrement de la fiche —
 * ces lignes ont besoin de son identifiant.
 *
 * ⚠️ ON NE VIDE PAS POUR REMPLIR. La tentation était grande : effacer
 * toutes les lignes de la fiche, puis réinsérer celles de l'écran.
 * C'était faux, et gravement : chaque enregistrement — même une
 * virgule changée dans la bio — aurait détruit les LIAISONS VALIDÉES
 * (elles pendent aux modes, `on delete cascade`). Un salon aurait dû
 * reconfirmer son résident à chaque sauvegarde.
 * On travaille donc PAR IDENTITÉ :
 *   · les lignes de l'écran qui ont un `id` sont MISES À JOUR ;
 *   · celles qui n'en ont pas sont INSÉRÉES ;
 *   · celles de la base qui ne sont plus à l'écran sont SUPPRIMÉES
 *     (c'est le point 4 : supprimer un mode nettoie ses liaisons).
 *
 * ÉCRIT AVEC LA SESSION DE LA PERSONNE, jamais la clé de service :
 * les politiques de la migration nº 26 vérifient, ligne par ligne,
 * que la fiche visée lui appartient.
 *
 * JAMAIS BLOQUANT : si les tables n'existent pas encore (migration
 * nº 26 non passée), on n'interrompt RIEN — la fiche est enregistrée,
 * simplement sans ses modes. Le message part dans le journal.
 */

/** Le client Supabase du navigateur, tel que le formulaire le crée. */
type Client = SupabaseClient;

/**
 * UNE COLONNE DE LA MIGRATION Nº 33 MANQUE-T-ELLE ENCORE ?
 * ---------------------------------------------------------
 * `role`, `horaires` et `fuseau` arrivent avec la migration nº 33.
 * Tant qu'elle n'est pas passée, PostgREST refuse la ligne entière —
 * et la fiche ne s'enregistrerait plus du tout. On réessaie donc SANS
 * ces colonnes : le reste part normalement, et les nouveautés
 * attendent la migration. Aucune version du site n'exige une
 * migration pour fonctionner.
 */
const COLONNES_MIGRATION_33 = [
  "role",
  "horaires",
  "fuseau",
  //  ⚠️ AJOUTÉE PAR LA nº 40 (rayon du mode « à domicile »). Restée
  //  sans écrivain de la nº 418 à la nº 751 ; le mode « Autre » l'écrit
  //  de nouveau, une valeur par zone. La tolérance ne change pas —
  //  tant que la colonne manque, le reste part quand même.
  "rayon_km",
  //  ⚠️ AJOUTÉE PAR LA nº 41 (nature du lieu d'une session guest).
  "nature_lieu",
  //  §1 (nº 266) — LE NOM DU LIEU qui n'est pas sur YokoFolio. Même
  //  règle : tant que la migration n'est pas passée, le reste part
  //  quand même — aucune version du site n'exige une migration pour
  //  fonctionner.
  "nom_lieu",
  //  nº 750 — LE LIEN VERS LE CATALOGUE DES CONVENTIONS (colonne née
  //  avec `yokofolio-conventions-et-independent.sql`). Même tolérance,
  //  et elle coûte peu : la ligne garde sa localisation et le NOM de
  //  la convention, tous deux RECOPIÉS — seul le lien au catalogue
  //  manquerait sur une base où la migration n'est pas passée.
  "convention_id",
  //  nº 751 — LE STATUT DU MODE « AUTRE » (colonne née avec
  //  `yokofolio-conventions-et-independent.sql`, comme `convention_id`).
  //  Même tolérance : sans elle, la ligne garde sa zone et son rayon —
  //  seul le statut manquerait, et l'artiste le reposerait.
  "statut",
] as const;

function colonneNeuveAbsente(message: string): string | null {
  const bas = message.toLowerCase();
  if (!bas.includes("column") && !bas.includes("schema cache")) return null;
  return COLONNES_MIGRATION_33.find((colonne) => bas.includes(colonne)) ?? null;
}

/** Écrire une ligne, en retirant au besoin les colonnes que la base
    ne connaît pas encore. Rend la réponse finale. */
async function ecrireEnTolerant<T>(
  ligne: Record<string, unknown>,
  // ⚠️ `PromiseLike` ET NON `Promise` : les requêtes de supabase-js
  // sont des objets « thenable » (on peut encore les affiner avant de
  // les attendre), pas de vraies promesses.
  envoyer: (ligne: Record<string, unknown>) => PromiseLike<{
    error: { message: string } | null;
    data?: T;
  }>
) {
  let candidate = { ...ligne };
  let reponse = await envoyer(candidate);
  for (let essai = 0; essai < COLONNES_MIGRATION_33.length && reponse.error; essai++) {
    const enCause = colonneNeuveAbsente(reponse.error.message);
    if (!enCause || !(enCause in candidate)) break;
    candidate = { ...candidate };
    delete candidate[enCause];
    reponse = await envoyer(candidate);
  }
  return reponse;
}

export type ResultatExercice = {
  /** Les modes écrits, avec l'identifiant que la base leur a donné —
      c'est lui que les demandes de rattachement citent. */
  modes: Array<{ id: string; salonId: string | null }>;
};

export async function enregistrerExercice(
  supabase: Client,
  ficheId: string,
  typeFiche: "artiste" | "salon",
  modes: ModeEnSaisie[],
  studios: StudioEnSaisie[],
  /** ⚠️ LES STUDIOS QUE LA PERSONNE A RETIRÉS À L'ÉCRAN (passe nº 104).
      C'ÉTAIT LE BUG DU « STUDIO FANTÔME » : le formulaire charge
      TOUTES les lignes de la table, la croix ne les retirait que de
      l'état React, et `ecrireStudios` ne supprime jamais rien (son
      garde-fou, voir plus bas). La ligne revenait donc à chaque
      rechargement. On ne supprime QUE ce qui a été explicitement
      retiré d'un écran qui le montrait — jamais par différence
      aveugle avec la base. */
  studiosASupprimer: string[] = []
): Promise<ResultatExercice> {
  const ecrits: ResultatExercice = { modes: [] };
  try {
    if (typeFiche === "artiste") {
      ecrits.modes = await ecrireModes(supabase, ficheId, modes);
      // Un artiste n'a pas de studio : si sa fiche en portait (elle a
      // changé de type), on efface — sinon ils resteraient affichés.
      await supabase.from("studios").delete().eq("tatoueur_id", ficheId);
    } else {
      await ecrireStudios(supabase, ficheId, studios);
      if (studiosASupprimer.length > 0) {
        //  `.eq("tatoueur_id", …)` en plus de l'`.in` : ceinture et
        //  bretelles — on ne peut viser que ses propres lignes, et la
        //  politique de la base le revérifie de toute façon.
        await supabase
          .from("studios")
          .delete()
          .in("id", studiosASupprimer)
          .eq("tatoueur_id", ficheId);
      }
      await supabase.from("modes_exercice").delete().eq("tatoueur_id", ficheId);
    }
  } catch (erreur) {
    console.warn(
      "[exercice] non écrit :",
      erreur instanceof Error ? erreur.message : String(erreur)
    );
  }
  return ecrits;
}

async function ecrireModes(
  supabase: Client,
  ficheId: string,
  modes: ModeEnSaisie[]
): Promise<Array<{ id: string; salonId: string | null }>> {
  //  1) CE QUI DISPARAÎT — les lignes de la base absentes de l'écran.
  /*  §2 et §3 (nº 265) — LA CAUSE COMMUNE DES DEUX DÉFAUTS, ET ELLE
      EST ICI. `gardes` retenait l'identifiant de TOUS les encadrés à
      l'écran, y compris ceux que la croix venait de VIDER : quand un
      lieu est le seul de son genre, la croix ne le retire pas, elle le
      remplace par un encadré VIERGE en lui laissant son identifiant
      (BlocModesExercice, `fermerCeLieu` → `modeVierge(genre, cle,
      mode.id)`). Cet identifiant protégeait donc la ligne de la
      suppression — et comme l'encadré est vide, la boucle d'écriture
      le saute (`modeVide`, plus bas). Résultat : LA LIGNE D'ORIGINE
      RESTAIT EN BASE, INCHANGÉE.
       · supprimer « à domicile » ne s'enregistrait pas (§2) : le mode
         revenait au rechargement, formulaire et fiche publique ;
       · retirer « artiste résident » puis choisir « fondateur » (§3)
         laissait DEUX lignes : l'ancienne, vidée à l'écran mais
         intacte en base, et la nouvelle.
      LA RÈGLE POSÉE : l'état enregistré est EXACTEMENT celui que
      montre le formulaire. Ne protège donc de la suppression que ce
      qui va vraiment être RÉÉCRIT — les encadrés qui portent un genre
      et une saisie. Un encadré vidé n'est plus une ligne : la sienne
      part. Un encadré NEUF laissé vide n'a pas d'identifiant : il n'y
      a rien à supprimer, et rien n'est écrit (le garde-fou de la
      nº 124 tient toujours). */
  const gardes = modes
    .filter((mode) => mode.genre && !modeVide(mode))
    .map((mode) => mode.id)
    .filter(Boolean) as string[];
  const suppression = supabase
    .from("modes_exercice")
    .delete()
    .eq("tatoueur_id", ficheId);
  //  ⚠️ ET L'ON REGARDE LA RÉPONSE (nº 265) : une suppression refusée
  //  passait inaperçue — l'appel était attendu, jamais lu. Un
  //  enregistrement qui ne supprime pas doit se dire.
  const effacement = await (gardes.length > 0
    ? suppression.not("id", "in", `(${gardes.join(",")})`)
    : suppression);
  if (effacement.error) throw new Error(effacement.error.message);

  // 2) CE QUI RESTE ET CE QUI ARRIVE.
  const ecrits: Array<{ id: string; salonId: string | null }> = [];
  for (let rang = 0; rang < modes.length; rang++) {
    const mode = modes[rang];
    // ⚠️ UN ENCADRÉ OUVERT MAIS VIDE NE PART PAS EN BASE. Depuis la
    // refonte du bloc, on peut ajouter un mode et ne pas choisir son
    // genre — c'est un état de saisie légitime, pas une ligne. La
    // contrainte `modes_exercice_genre_connu` refuserait de toute
    // façon la chaîne vide, et l'enregistrement entier échouerait.
    // ⚠️ ET DEPUIS LE SÉLECTEUR HORIZONTAL (passe nº 124), UN MODE
    // VIERGE NON PLUS : ouvrir un onglet crée un encadré de ce genre,
    // sans qu'un seul champ ait été touché. L'écrire poserait une
    // ligne sans coordonnées — invisible sur la carte, fausse sur la
    // fiche. Il reste protégé de la suppression (son id est dans
    // `gardes`) : on n'efface que ce que la croix a explicitement
    // retiré, jamais un encadré simplement laissé vide.
    if (!mode.genre || modeVide(mode)) continue;
    // Un salon lié situe le mode : on recopie SON adresse, pour que
    // la ligne reste lisible même si le salon disparaît un jour.
    const lieu = mode.salon
      ? {
          intitule: mode.salon.adresse ?? mode.salon.nom,
          adresse: mode.salon.adresse ?? null,
          code_postal: mode.salon.code_postal ?? null,
          ville: mode.salon.ville ?? null,
          region: mode.salon.region ?? null,
          pays: mode.salon.pays ?? null,
          code_pays: mode.salon.code_pays ?? null,
          latitude: mode.salon.latitude ?? null,
          longitude: mode.salon.longitude ?? null,
          lieu_id: mode.salon.lieu_id ?? null,
        }
      : colonnesDuLieu(mode.lieu);

    // Le type est posé À LA MAIN : les deux façons de situer un mode
    // (salon lié, adresse saisie) ne rendent pas exactement les mêmes
    // clés, et TypeScript refuserait de les réunir sans ça.
    const ligne: Record<string, unknown> = {
      tatoueur_id: ficheId,
      genre: mode.genre,
      //  LE SOUS-CHOIX A DE SENS POUR LES DEUX LIEUX QUI ONT UNE
      //  ÉQUIPE : « en salon » ET, depuis la passe nº 100, « en studio
      //  privé ». Partout ailleurs (guest) il vaut null.
      //  ⚠️ LA BASE LE VÉRIFIE : la contrainte
      //  `modes_exercice_role_coherent` interdisait tout rôle hors du
      //  genre « salon » (migration nº 33) ; la migration nº 44
      //  l'AUTORISE pour « prive », sans l'exiger — les lignes déjà
      //  enregistrées, qui n'en ont pas, restent donc valables.
      role:
        mode.genre === "salon" || mode.genre === "prive"
          ? (mode.role ?? null)
          : null,
      salon_id: mode.salon?.id ?? null,
      ...lieu,
      //  ██ nº 751 — LE RAYON REVIT, ET IL EST À « AUTRE » ██
      //  Il fut celui d'« à domicile », puis de « Disponible »
      //  (nº 414-417) ; la nº 418 a supprimé ce mode et la colonne est
      //  restée écrite à null. Le mode « Autre » l'écrit de nouveau :
      //  UNE VALEUR PAR ZONE, celle de sa capsule.
      //  ⚠️ NULL RESTE POSSIBLE SUR UNE LIGNE « Autre » : une région ou
      //  un pays n'a pas de rayon (voir `rayonKm`). Les trois vues
      //  géographiques le lisent déjà ainsi — `coalesce(m.rayon_km, 0)`
      //  (nº 749) : sans rayon, la zone vaut son point seul.
      rayon_km: mode.genre === "independent" ? (mode.rayonKm ?? null) : null,
      //  nº 751 — LE STATUT, propre au mode « Autre » et null partout
      //  ailleurs (la contrainte `modes_exercice_statut_connu` l'exige).
      //  ⚠️ IL EST RÉPÉTÉ SUR CHAQUE ZONE : chaque mode le porte déjà en
      //  mémoire (le menu écrit sur toutes les lignes en une fois), il
      //  n'y a donc rien à recopier ici.
      statut: mode.genre === "independent" ? (mode.statut ?? null) : null,
      //  LA NATURE DU LIEU VISITÉ n'a de sens que pour un guest.
      nature_lieu: mode.genre === "guest" ? (mode.natureLieu ?? null) : null,
      //  §1 (nº 266) — LE NOM DU LIEU SAISI À LA MAIN. Il n'a de sens
      //  que là où le champ existe (`nomLieuRequis` : un lieu qui a
      //  son portfolio porte déjà le sien) — ailleurs null, comme le
      //  rayon et la nature.
      //  ⚠️ nº 750 — UNE CONVENTION Y ÉCRIT SON NOM, et c'est la même
      //  idée qu'un salon lié : la localisation ET le nom sont
      //  RECOPIÉS sur la ligne, pour qu'elle reste lisible même si la
      //  convention quitte un jour le catalogue (`convention_id` est
      //  `on delete set null`). C'est aussi ce qui donne son titre à
      //  la plaque de la fiche publique sans une requête de plus.
      nom_lieu:
        mode.genre === "convention"
          ? (mode.convention?.nom ?? "").trim() || null
          : nomLieuRequis(mode)
            ? (mode.nomLieu ?? "").trim() || null
            : null,
      //  nº 750 — LE LIEN VERS LE CATALOGUE : la seule colonne propre
      //  au mode Convention. Null partout ailleurs.
      convention_id:
        mode.genre === "convention" ? (mode.convention?.id ?? null) : null,
      //  ⚠️ nº 750 — LES DATES SONT CELLES DE L'ARTISTE, et elles
      //  valent pour DEUX genres désormais : sa session guest, et sa
      //  présence à une convention (il peut n'y être qu'un jour sur
      //  sept — conception nº 748-B1). Mêmes colonnes, même expiration
      //  automatique par `modes_exercice_actifs`.
      debut_le:
        mode.genre === "guest" || mode.genre === "convention"
          ? mode.debut_le || null
          : null,
      fin_le:
        mode.genre === "guest" || mode.genre === "convention"
          ? mode.fin_le || null
          : null,
      ordre: rang,
    };

    const reponse = await ecrireEnTolerant<{ id?: string } | null>(
      ligne,
      (candidate) =>
        mode.id
          ? supabase
              .from("modes_exercice")
              .update(candidate)
              .eq("id", mode.id)
              .select("id")
              .maybeSingle()
          : supabase
              .from("modes_exercice")
              .insert(candidate)
              .select("id")
              .maybeSingle()
    );

    if (reponse.error) throw new Error(reponse.error.message);
    const identifiant = (reponse.data as { id?: string } | null)?.id;
    if (identifiant) {
      ecrits.push({ id: identifiant, salonId: mode.salon?.id ?? null });
    }
  }
  return ecrits;
}

async function ecrireStudios(
  supabase: Client,
  ficheId: string,
  studios: StudioEnSaisie[]
): Promise<void> {
  //  ⚠️ ON N'EFFACE PLUS RIEN — ET C'EST UN GARDE-FOU, PAS UN OUBLI.
  //  Cette fonction commençait par supprimer toutes les lignes de
  //  `studios` absentes du formulaire. C'était juste tant que le
  //  bloc 1 gérait TOUTES les adresses d'une enseigne. Depuis la
  //  passe C, il n'en gère plus qu'UNE : le « + Ajouter un autre
  //  studio » a disparu, remplacé par le bloc 12.
  //
  //  Garder la suppression aurait donc DÉTRUIT, au premier
  //  enregistrement, les adresses supplémentaires des enseignes qui
  //  en ont — sans que personne ne l'ait demandé, et sans retour
  //  possible. Un changement d'écran ne doit jamais effacer des
  //  données qu'il ne montre pas.
  //
  //  ⚠️ MAIS CE GARDE-FOU AVAIT UN ANGLE MORT (bug du « studio
  //  fantôme », corrigé à la passe nº 104). Le formulaire CHARGE
  //  toutes les lignes et les MONTRE — la croix de suppression ne les
  //  retirait que de l'écran, et rien ici ne répercutait ce geste :
  //  la ligne ressuscitait au rechargement. (L'ancienne note disait
  //  « elle se retire par le bloc 12 » — c'était faux : le bloc 12
  //  gère les LIAISONS entre fiches, pas les lignes de `studios`.)
  //  La suppression EXPLICITE passe désormais par le paramètre
  //  `studiosASupprimer` d'`enregistrerExercice` : on efface ce que
  //  la personne a retiré d'un écran qui le montrait, et rien d'autre.

  for (let rang = 0; rang < studios.length; rang++) {
    const studio = studios[rang];
    if (!studio.lieu) continue; // un studio sans adresse n'est rien
    const ligne: Record<string, unknown> = {
      tatoueur_id: ficheId,
      nom: studio.nom.trim() || null,
      ...colonnesDuLieu(studio.lieu),
      // LE PREMIER EST CELUI DE LA FICHE : c'est lui qui porte le nom,
      // le slug et les coordonnées de la page.
      principal: rang === 0,
      ordre: rang,
      // LES HORAIRES, ET LE FUSEAU QUI LEUR DONNE UN SENS. Le fuseau
      // se DÉDUIT de l'adresse qu'on vient de choisir : c'est ce qui
      // évite d'annoncer un studio de Montréal ouvert parce qu'il est
      // 15 h à Paris (voir lib/horaires-studio).
      horaires: studio.horaires ? semaineVersBase(studio.horaires) : null,
      fuseau: fuseauDuLieu(studio.lieu.code_pays, studio.lieu.longitude),
    };
    const reponse = await ecrireEnTolerant(ligne, (candidate) =>
      studio.id
        ? supabase.from("studios").update(candidate).eq("id", studio.id)
        : supabase.from("studios").insert(candidate)
    );
    if (reponse.error) throw new Error(reponse.error.message);
  }
}

/**
 * LES RATTACHEMENTS QUI DÉCOULENT DES MODES.
 * Un artiste qui déclare travailler dans un salon inscrit entre
 * AUSSITÔT dans l'équipe de ce salon : c'est le sens « artiste →
 * salon » de la règle posée à la passe C. Le salon n'a rien à
 * accepter — il peut, en revanche, retirer l'artiste de son équipe
 * quand il veut. La réversibilité remplace l'autorisation.
 * ⚠️ LE NOM DE CETTE FONCTION PARLE ENCORE DE « DEMANDES » : il est
 * appelé à deux endroits du formulaire, et le renommer n'apporterait
 * rien à la personne qui l'utilise. Ce qu'elle fait est écrit ici.
 */
export async function demanderLesRattachements(
  ficheId: string,
  modes: Array<{ id: string; salonId: string | null }>
): Promise<void> {
  for (const mode of modes) {
    if (!mode.salonId) continue;
    try {
      await fetch("/api/tatoueur/liaison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisteId: ficheId,
          salonId: mode.salonId,
          modeId: mode.id,
          origine: "artiste",
        }),
      });
    } catch {
      // Un rattachement qui ne part pas ne bloque pas
      // l'enregistrement : il se refera au prochain.
    }
  }
}

/**
 * LES RATTACHEMENTS CHOISIS PENDANT LA CRÉATION D'UNE FICHE.
 * ==========================================================
 * Les blocs 11 (équipe) et 12 (autre adresse) sont utilisables AVANT
 * le premier enregistrement : on y choisit des fiches alors qu'il n'y
 * a encore rien à quoi les rattacher. Les choix attendent donc en
 * mémoire, et cette fonction les écrit tous d'un coup dès que la
 * fiche existe — exactement comme les photos et les modes.
 *
 * ⚠️ AUCUN ÉCHEC NE BLOQUE. Une fiche créée mais dont un rattachement
 * n'est pas parti reste une fiche créée : on ne perd pas tout le
 * formulaire pour une liaison. Elle se refera d'un clic dans le bloc,
 * qui, lui, sera devenu pleinement fonctionnel.
 *
 * ⚠️⚠️ MAIS « NE BLOQUE PAS » N'EST PAS « NE SE VOIT PAS ». Pendant la
 * panne de la passe nº 102, cette boucle ne regardait même pas la
 * réponse : les rattachements choisis pendant la création
 * disparaissaient EN SILENCE, sans un mot à l'écran ni une ligne dans
 * la console. C'était la moitié la plus cruelle du bug — sur une
 * fiche déjà enregistrée on voyait au moins un message rouge.
 * On journalise donc chaque échec, et on RETOURNE le nombre de
 * rattachements qui ne sont pas passés.
 */
export async function creerLesRattachementsEnAttente(
  ficheId: string,
  artistesDeLEquipe: string[],
  autresAdresses: string[]
): Promise<number> {
  const envois: Array<{ artisteId: string; salonId: string; origine: string }> = [
    //  L'ÉQUIPE : la fiche est le SALON, l'autre est l'artiste.
    ...artistesDeLEquipe.map((artisteId) => ({
      artisteId,
      salonId: ficheId,
      origine: "salon",
    })),
    //  LES AUTRES ADRESSES : deux établissements, origine « adresse ».
    ...autresAdresses.map((autreId) => ({
      artisteId: ficheId,
      salonId: autreId,
      origine: "adresse",
    })),
  ];
  let manques = 0;
  for (const envoi of envois) {
    try {
      const reponse = await fetch("/api/tatoueur/liaison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envoi),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!donnees?.ok) {
        manques += 1;
        console.error("[liaison] rattachement en attente non enregistré", {
          origine: envoi.origine,
          message: donnees?.message ?? `réponse ${reponse.status}`,
        });
      }
    } catch {
      // Voir l'en-tête : jamais bloquant — mais jamais muet non plus.
      manques += 1;
      console.error("[liaison] réseau indisponible pour un rattachement", {
        origine: envoi.origine,
      });
    }
  }
  return manques;
}
