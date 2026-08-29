"use client";

import { useCallback, useEffect, useState } from "react";
import { IconeCroix } from "@/components/Icones";
import { ligneCarte } from "@/lib/adresse";
import {
  RechercheFicheInscrite,
  type FicheInscrite,
} from "@/components/RechercheFicheInscrite";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { PORTRAIT_ROND } from "@/config/tatouage";
//  §1 (nº 718) — la variante d'avatar à servir : la règle de
//  nommage et le repli vivent dans lib/avatar-variantes.
import { AVATAR_PETIT, sourceAvatar } from "@/lib/avatar-variantes";

/**
 * L'ÉQUIPE, VUE DEPUIS LE FORMULAIRE DU SALON
 * ============================================
 * LE CHEMIN INVERSE, ENFIN OUVERT. Jusqu'ici, un artiste pouvait
 * déclarer son salon ; un salon ne pouvait rien faire — il attendait.
 * Ici, il cherche ses artistes par leur nom et les ajoute.
 *
 * ⚠️ CE BLOC N'INVENTE RIEN. Tout existait déjà pour le sens
 * artiste → salon, et sert tel quel :
 *  · LA RECHERCHE   → `RechercheFicheInscrite`, en mode « artiste » ;
 *  · L'INVITATION   → POST /api/tatoueur/liaison avec
 *    `origine: "salon"` — la route acceptait ce sens depuis le
 *    premier jour, personne ne l'appelait ;
 *  · LA NOTIFICATION → posée par cette même route ;
 *  · LES DROITS     → les politiques de la migration nº 26, qui
 *    nomment déjà les deux origines.
 * Rien n'est dupliqué : ce fichier n'est qu'une interface.
 *
 * LA RÈGLE QUI TIENT TOUT : CELUI QUI INVITE NE VALIDE PAS. Le salon
 * ⚠️ RATTACHEMENT IMMÉDIAT (passe C). Choisir un nom dans la liste
 * met l'artiste dans l'équipe SUR-LE-CHAMP : il n'y a plus de
 * demande, plus d'accord à attendre, plus de notification. Ce qui
 * remplace l'autorisation, c'est que l'artiste peut se retirer quand
 * il veut — la base l'autorise des deux côtés.
 *
 * ⚠️ ET ÇA MARCHE AVANT MÊME QUE LA FICHE EXISTE (passe C bis). Le
 * bloc affichait « Enregistre d'abord ton portfolio » tant que la
 * fiche n'avait pas d'identifiant : on ne pouvait donc pas remplir le
 * formulaire d'une traite. Désormais, pendant la création, les
 * artistes choisis sont GARDÉS EN MÉMOIRE, affichés, retirables — et
 * le formulaire crée toutes les liaisons d'un coup, une fois la fiche
 * enregistrée et son identifiant connu. C'est exactement ce que font
 * déjà les photos et les modes d'exercice.
 */

/** ⚠️ LE PRÉFIXE D'UNE LIAISON PAS ENCORE EN BASE. Pendant la
    création d'une fiche, il n'y a pas d'identifiant à qui rattacher :
    on garde le choix en mémoire sous un identifiant de ce genre, et
    le formulaire les crée toutes à l'enregistrement. */
export const PREFIXE_EN_ATTENTE = "attente:";

export type LiaisonEquipe = {
  id: string;
  artiste_id: string;
  statut: "demande" | "validee" | "refusee";
  origine: "artiste" | "salon";
  nom: string;
  slug: string | null;
  photo: string | null;
  ville: string | null;
};

/** L'ÉTAT D'UNE LIAISON, dit en un mot et une couleur. */
const ETATS: Record<
  LiaisonEquipe["statut"],
  { mot: string; classe: string }
> = {
  //  ⚠️ « demande » NE SE PRODUIT PLUS depuis la passe C : un
  //  rattachement est immédiat. L'entrée reste pour les lignes
  //  anciennes qu'une base non migrée porterait encore — la nº 39 les
  //  bascule en « validee ».
  demande: {
    mot: "Dans l'équipe",
    classe: "border-[#34D399]/40 bg-[#34D399]/10 text-[#34D399]",
  },
  validee: {
    mot: "Dans l'équipe",
    classe: "border-[#34D399]/40 bg-[#34D399]/10 text-[#34D399]",
  },
  refusee: {
    mot: "Refusée",
    classe: "border-erreur/40 bg-erreur/10 text-erreur",
  },
};

/** LES LIAISONS D'UN SALON, avec le nom et l'avatar de chaque artiste.
    DEUX REQUÊTES PLUTÔT QU'UNE JOINTURE : la table pointe DEUX FOIS
    vers `tatoueurs` (l'artiste et le salon), et une jointure implicite
    obligerait à nommer la contrainte à la main — un nom qui n'est pas
    à nous et qui peut changer. Deux lectures simples ne cassent pas. */
export async function chargerEquipeDuSalon(
  supabase: ReturnType<typeof creerClientSupabaseNavigateur>,
  salonId: string
): Promise<LiaisonEquipe[]> {
  try {
    const { data, error } = await supabase
      .from("liaisons_artiste_salon")
      .select("id, artiste_id, statut, origine, demandee_le")
      .eq("salon_id", salonId)
      .order("demandee_le", { ascending: false });
    if (error || !Array.isArray(data) || data.length === 0) return [];
    const lignes = data as unknown as Array<{
      id: string;
      artiste_id: string;
      statut: LiaisonEquipe["statut"];
      origine: LiaisonEquipe["origine"];
    }>;
    const { data: fiches } = await supabase
      .from("tatoueurs")
      //  `photo_principale` EN REPLI (passe nº 104) : une fiche
      //  d'avant le portrait rond n'a pas de `photo_profil` — sa
      //  pastille restait à l'initiale alors qu'elle a des photos.
      //  ⚠️ RÉGION ET PAYS EN PLUS (passe nº 115) : la seconde ligne de
      //  la liste ne dit plus « Lyon » mais « Lyon, France » — et
      //  « Miami, FL, États-Unis » pour les pays qui écrivent leur
      //  État. Situer un membre d'équipe demande son pays.
      .select(
        "id, nom, slug, photo_profil, photo_principale, ville_nom, " +
          "region, pays, code_pays"
      )
      .in("id", lignes.map((ligne) => ligne.artiste_id));
    const parId = new Map(
      ((fiches ?? []) as unknown as Array<{
        id: string;
        nom: string;
        slug: string | null;
        photo_profil: string | null;
        photo_principale: string | null;
        ville_nom: string | null;
        region: string | null;
        pays: string | null;
        code_pays: string | null;
      }>).map((fiche) => [fiche.id, fiche])
    );
    return lignes.map((ligne) => {
      const fiche = parId.get(ligne.artiste_id);
      return {
        id: ligne.id,
        artiste_id: ligne.artiste_id,
        statut: ligne.statut,
        origine: ligne.origine,
        nom: fiche?.nom ?? "Portfolio retiré",
        slug: fiche?.slug ?? null,
        photo: fiche?.photo_profil ?? fiche?.photo_principale ?? null,
        ville: ligneCarte({
          ville: fiche?.ville_nom,
          region: fiche?.region,
          pays: fiche?.pays,
          code_pays: fiche?.code_pays,
        }),
      };
    });
  } catch {
    // Table absente (migration nº 26 non passée) : une liste vide, et
    // surtout pas un formulaire en panne.
    return [];
  }
}

export function BlocEquipeSalon({
  ficheId,
  surEnAttente,
}: {
  /** L'identifiant de la fiche du salon — null tant qu'elle n'a pas
      été enregistrée une première fois. Sans lui, il n'y a rien à
      quoi rattacher un artiste. */
  ficheId: string | null;
  /** LES CHOIX FAITS AVANT L'ENREGISTREMENT, remontés au formulaire :
      c'est lui qui créera les liaisons une fois l'identifiant connu. */
  surEnAttente?: (artistesIds: string[]) => void;
}) {
  const [liaisons, setLiaisons] = useState<LiaisonEquipe[]>([]);
  //  LES CHOIX D'AVANT L'ENREGISTREMENT. Ils vivent ici, s'affichent
  //  comme les autres, et partent en base au premier enregistrement.
  const [enAttente, setEnAttente] = useState<LiaisonEquipe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** Le compteur qui redemande la liste — bougé après chaque geste. */
  const [tour, setTour] = useState(0);

  /* LA LECTURE, à l'ouverture et après chaque ajout ou retrait.
     Elle passe par un minuteur à zéro : React déconseille de poser un
     état dans le corps même d'un effet (règle
     react-hooks/set-state-in-effect), et c'est le même contournement
     que dans la recherche de fiches. */
  useEffect(() => {
    let abandonne = false;
    const minuteur = setTimeout(async () => {
      const liste = ficheId
        ? await chargerEquipeDuSalon(creerClientSupabaseNavigateur(), ficheId)
        : [];
      if (abandonne) return;
      setLiaisons(liste);
      setChargement(false);
    }, 0);
    return () => {
      abandonne = true;
      clearTimeout(minuteur);
    };
  }, [ficheId, tour]);

  const relire = useCallback(() => setTour((rang) => rang + 1), []);

  //  ⚠️ ON PRÉVIENT LE FORMULAIRE À CHAQUE CHANGEMENT, et rien de plus :
  //  cet effet n'écrit aucun état ici, il transmet. C'est le formulaire
  //  qui créera les liaisons quand la fiche aura un identifiant.
  useEffect(() => {
    surEnAttente?.(enAttente.map((liaison) => liaison.artiste_id));
  }, [enAttente, surEnAttente]);

  /** RATTACHER — un POST, exactement celui du sens inverse.
      ⚠️ PLUS D'INVITATION, PLUS D'ATTENTE : l'artiste entre dans
      l'équipe tout de suite. Ce qui remplace son accord, c'est que
      LUI AUSSI peut défaire le lien, à tout moment. */
  async function inviter(fiche: FicheInscrite) {
    if (enCours) return;
    //  PAS ENCORE DE FICHE : on retient le choix, on l'affiche, et le
    //  formulaire s'en occupera à l'enregistrement.
    if (!ficheId) {
      setEnAttente((liste) =>
        liste.some((l) => l.artiste_id === fiche.id)
          ? liste
          : [
              ...liste,
              {
                id: `${PREFIXE_EN_ATTENTE}${fiche.id}`,
                artiste_id: fiche.id,
                statut: "validee" as const,
                origine: "salon" as const,
                nom: fiche.nom,
                slug: fiche.slug ?? null,
                photo: fiche.photo_profil ?? null,
                ville: ligneCarte({
                  ville: fiche.ville_nom,
                  region: fiche.region,
                  pays: fiche.pays,
                  code_pays: fiche.code_pays,
                }),
              },
            ]
      );
      return;
    }
    setEnCours(true);
    setMessage(null);
    try {
      const reponse = await fetch("/api/tatoueur/liaison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisteId: fiche.id,
          salonId: ficheId,
          origine: "salon",
        }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!donnees?.ok) {
        setMessage(
          donnees?.message ??
            "Le rattachement n'a pas pu être enregistré — réessaie."
        );
      }
      //  ⚠️ AUCUN MESSAGE QUAND ÇA MARCHE (passe nº 103). L'artiste
      //  apparaît dans la liste juste en dessous : c'est LA
      //  confirmation, une phrase par-dessus ne ferait que la redire.
    } catch {
      setMessage("Réseau indisponible : le rattachement n'est pas enregistré.");
    } finally {
      setEnCours(false);
      relire();
    }
  }

  /** RETIRER quelqu'un de l'équipe — le
      même geste en base (la liaison disparaît), deux mots différents
      à l'écran parce que ce ne sont pas les mêmes situations. */
  async function retirer(liaison: LiaisonEquipe) {
    if (liaison.id.startsWith(PREFIXE_EN_ATTENTE)) {
      setEnAttente((liste) => liste.filter((l) => l.id !== liaison.id));
      return;
    }
    if (enCours) return;
    setEnCours(true);
    setMessage(null);
    try {
      const reponse = await fetch("/api/tatoueur/liaison", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liaisonId: liaison.id }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!donnees?.ok) {
        setMessage(donnees?.message ?? "Le retrait n'a pas abouti.");
      }
    } catch {
      setMessage("Réseau indisponible : le retrait n'est pas parti.");
    } finally {
      setEnCours(false);
      relire();
    }
  }

  /* ---------- LA FICHE N'EXISTE PAS ENCORE ---------- */


  //  UNE SEULE LISTE À L'ÉCRAN : ce que la base connaît, plus ce qui
  //  attend l'enregistrement. Rien ne distingue les deux pour l'œil —
  //  c'est voulu : la personne coche, elle ne gère pas un état.
  const toutes = ficheId ? liaisons : enAttente;

  return (
    <div className="flex flex-col gap-4">
      <RechercheFicheInscrite
        id="equipe-recherche-artiste"
        type="artiste"
        etiquette="Ton équipe est-elle sur YokoFolio ?"
        // PAS DE LOUPE DANS LE FANTÔME : le champ en dessine déjà une,
        // vraie, à sa gauche (RechercheFicheInscrite). Les deux se
        // suivaient à trois pixels l'une de l'autre.
        texteIndicatif="Recherche un artiste"
        choisie={null}
        surChoix={(fiche) => {
          if (fiche) void inviter(fiche);
        }}
        exclure={toutes.map((liaison) => liaison.artiste_id)}
        //  ⚠️ « Déjà rattaché », COMME LES SALONS ET LES STUDIOS (passe
        //  nº 121). Le mot d'avant s'écrivait « Déjà dans l » suivi
        //  de la séquence \u2019 TAPÉE TELLE QUELLE dans un attribut
        //  JSX : là, ce n'est pas une échappe — le navigateur
        //  affichait les six caractères, « déjà dans lu2019équipe ».
        //  Deux listes qui font le même geste portent maintenant le
        //  même mot, et il n'a aucune apostrophe à échapper.
        libelleExclu="Déjà rattaché"
        messageVide="Aucun artiste trouvé"
      />

      {/* LE MESSAGE NE PORTE PLUS QUE DES ERREURS (passe nº 103) : une
          ligne rouge nue — un succès, lui, se voit dans la liste. */}
      {message && (
        <p role="status" className="text-[13px] leading-relaxed text-erreur">
          {message}
        </p>
      )}

      {/* ---------- LA LISTE — des LIGNES, plus des cartes ----------
          ⚠️ PLUS D'ENCADRÉ PAR ARTISTE (passe nº 103). Une carte
          grise par personne dans un bloc déjà encadré, c'était une
          boîte dans la boîte : un filet entre les lignes suffit,
          l'avatar rond structure assez. */}
      {chargement && ficheId ? (
        <p className="text-[13px] text-sombre-texte-doux">
          Lecture de ton équipe…
        </p>
      ) : toutes.length === 0 ? (
        /* ⚠️ PLUS DE PAVÉ « Personne pour l'instant… » (passe nº 101).
           Un encadré en pointillés qui explique qu'il est vide est le
           type même du texte qu'on écrit pour meubler : le champ de
           recherche juste au-dessus dit déjà quoi faire. */
        null
      ) : (
        <ul className="flex flex-col divide-y divide-sombre-bordure/60">
          {toutes.map((liaison) => {
            const etat = ETATS[liaison.statut];
            return (
              <li
                key={liaison.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center
                             overflow-hidden rounded-full bg-sombre-eleve"
                >
                  {liaison.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element --
                       photo déposée par la fiche, servie telle quelle. */
                    <img
                      //  §1 (nº 718) — la petite variante (rond de liste).
                      src={sourceAvatar(liaison.photo, AVATAR_PETIT)}
                      alt=""
                      width={PORTRAIT_ROND}
                      height={PORTRAIT_ROND}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="text-[14px] font-bold text-sombre-texte-doux"
                    >
                      {liaison.nom.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>

                {/* ⚠️ LE NOM SEUL, SUR UNE LIGNE (passe nº 121) : la
                    localité s'affichait dessous, alors qu'elle a DÉJÀ
                    servi — c'est dans la liste de résultats qu'elle
                    distingue deux homonymes. Ici, elle n'apprend plus
                    rien et décale le nom vers le haut du portrait. Le
                    nom se centre donc verticalement à côté de la photo
                    (`items-center` du <li>). */}
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-[14.5px] font-semibold text-sombre-texte">
                    {liaison.nom}
                  </span>
                  {/* ⚠️ PLUS DE PASTILLE VERTE « Dans l'équipe » (passe
                      nº 101). Elle disait ce que la LISTE dit déjà :
                      un artiste qui figure dans la liste de l'équipe
                      est dans l'équipe.
                      ⚠️ ET PLUS DE LOCALITÉ (passe nº 121) — elle a
                      servi dans les résultats, elle ne décide plus
                      rien ici.
                      ⚠️ « Refusée » RESTE AFFICHÉ, sur la MÊME ligne :
                      celui-là est une exception, et une exception se
                      signale — mais sans faire grandir la ligne. */}
                  {liaison.statut === "refusee" && (
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border
                                 px-2.5 py-[2px] text-[11.5px] font-semibold ${etat.classe}`}
                    >
                      {etat.mot}
                    </span>
                  )}
                </span>

                {/* ⚠️ UNE CROIX, PLUS « Retirer de l'équipe » (passe
                    nº 106) : le même geste que dans « Autre adresse »
                    — les deux blocs se répondent, ils doivent parler
                    la même langue. Le mot vit dans l'`aria-label`. */}
                <button
                  type="button"
                  onClick={() => retirer(liaison)}
                  disabled={enCours}
                  aria-label={`Retirer ${liaison.nom} de l'équipe`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full
                             text-sombre-texte-doux transition-colors
                             hover:text-sombre-texte
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconeCroix classe="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
