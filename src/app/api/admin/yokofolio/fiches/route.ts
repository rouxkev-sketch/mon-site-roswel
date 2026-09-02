import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { identifiantsAdmin } from "@/lib/fiches-admin";
import { rafraichirPagesPubliques } from "@/lib/rafraichir";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
//  §1 (nº 675) — l'effacement d'une fiche, écrit une seule fois (le
//  corps de la purge des trente jours). Voir lib/suppression-compte.
//  §1 (nº 696) — il ne sert plus qu'à « purger maintenant » : la
//  suppression admin ordinaire pose désormais une échéance à sept
//  jours, avec le même calcul que les trente (`echeanceSuppression`).
import {
  DELAI_SUPPRESSION_ADMIN_JOURS,
  echeanceSuppression,
  supprimerLaFicheDefinitivement,
} from "@/lib/suppression-compte";
import {
  creerNotification,
  proprietaireDeLaFiche,
} from "@/lib/notifications";

/**
 * ADMIN YOKOFOLIO — LES FICHES À VALIDER
 * ---------------------------------------
 * GET  : tout ce qui ATTEND une décision, par ordre d'arrivée :
 *         - les fiches pas encore publiées (créations) ;
 *         - les fiches EN LIGNE dont le tatoueur a modifié le contenu
 *           (le `brouillon`) — l'écran montre alors la VERSION
 *           MODIFIÉE, fusionnée, avec `modification: true`.
 * POST : la décision — { id, action: "valider" | "modifier" |
 *        "hors_ligne", motifs?: string[], note?: string }.
 *        « valider » publie : s'il y a un brouillon, il REMPLACE la
 *        version publique, puis il est vidé ; la notification
 *        « fiche validée » est armée (validation_a_notifier) — et la
 *        mise hors ligne éventuelle est levée.
 *        « modifier » enregistre les motifs cochés et rend la main au
 *        tatoueur (statut « modifications ») — une fiche DÉJÀ EN LIGNE
 *        le RESTE, telle quelle : le refus ne dépublie jamais.
 *        « hors_ligne » DÉPUBLIE la fiche (elle disparaît de la
 *        recherche et des pages publiques — le compte, lui, reste
 *        actif : le tatoueur garde son espace pour corriger), avec
 *        les mêmes motifs cochés que le refus.
 * Accès : administrateurs uniquement (vérifié CÔTÉ SERVEUR).
 */

/**
 * LES CHAMPS QUI ONT CHANGÉ — le brouillon comparé à la version en
 * ligne (passe nº 152).
 * ⚠️ ON COMPARE CE QUI SE VOIT, pas la mécanique : `slug`, `publie`,
 * `statut`, les dates et les décisions de modération ne sont pas du
 * contenu à relire. Un champ absent du brouillon n'a pas changé (le
 * formulaire n'envoie que ce qu'il gère).
 * La comparaison est FAITE SUR LE TEXTE (`JSON.stringify`) : elle
 * traite les tableaux (styles, filtres) et les objets
 * (`photos_styles`) sans code particulier, et l'ordre y compte — deux
 * styles réordonnés SONT une modification à relire.
 */
const CHAMPS_LISIBLES: Array<[string, string]> = [
  ["nom", "Name"],
  ["bio", "Bio"],
  ["styles", "Styles"],
  ["ville_nom", "City"],
  ["adresse", "Address"],
  ["code_postal", "ZIP code"],
  ["photo_profil", "Profile photo"],
  ["photo_principale", "Main photo"],
  ["photos_styles", "Photos"],
  ["lien_instagram", "Instagram"],
  ["lien_tiktok", "TikTok"],
  ["site_web", "Website"],
  ["site_web_titre", "Website title"],
  ["page_de_liens", "Second link"],
  ["page_de_liens_titre", "Second link title"],
  ["filtres_technique", "Technique"],
  ["filtres_composition", "Composition"],
  ["filtres_besoins", "Needs"],
  ["type_fiche", "Portfolio type"],
  ["etablissement", "Business type"],
];

function champsModifies(
  ligne: Record<string, unknown>,
  brouillon: Record<string, unknown> | null
): string[] {
  if (!brouillon) return [];
  const memeChose = (a: unknown, b: unknown) =>
    JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  return CHAMPS_LISIBLES.filter(
    ([cle]) => cle in brouillon && !memeChose(brouillon[cle], ligne[cle])
  ).map(([, libelle]) => libelle);
}

/*  §4 (nº 696) — COMBIEN DE JOURS ONT ÉTÉ ACCORDÉS. C'est l'écart
    entre la demande et l'échéance qui dit QUI a supprimé : sept jours,
    c'est l'administration ; trente, c'est le tatoueur lui-même. On
    arrondit au jour le plus proche — les deux dates sont écrites à
    quelques millisecondes d'intervalle, et une seconde de dérive ne
    doit pas faire répondre « 6 ».
    ⚠️ RIEN N'EST DEVINÉ SI L'UNE DES DEUX MANQUE : on rend `null`, et
    l'écran dit simplement « suppression en cours » sans l'attribuer. */
function joursEntreDeuxDates(
  depuis: string | null,
  jusqua: string | null
): number | null {
  if (!depuis || !jusqua) return null;
  const debut = Date.parse(depuis);
  const fin = Date.parse(jusqua);
  if (!Number.isFinite(debut) || !Number.isFinite(fin)) return null;
  return Math.round((fin - debut) / 86_400_000);
}

export async function GET() {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }

  try {
    const admin = creerClientSupabaseAdmin();
    // Tout ce qui attend une décision : statut « en_attente » (création
    // comme modification d'une fiche en ligne), plus les fiches d'avant
    // la colonne statut (publie=false, statut null).
    let reponse = await admin
      .from("tatoueurs")
      .select("*")
      .or("statut.eq.en_attente,and(publie.eq.false,statut.is.null)")
      .order("cree_le", { ascending: true });
    if (reponse.error) {
      // Base d'avant les migrations : les fiches non publiées, sans tri.
      reponse = await admin.from("tatoueurs").select("*").eq("publie", false);
    }
    if (reponse.error) throw new Error(reponse.error.message);

    /**
     * ██ §1 (nº 285) — LES FICHES DONT SEULES LES PHOTOS ATTENDENT ██
     * ==================================================================
     * Depuis la nº 285, une fiche en ligne ne retourne PLUS dans la
     * file quand on la modifie : tout part en ligne (règle 2), et LES
     * PHOTOS NEUVES SEULES attendent, ligne par ligne
     * (`photos_tatoueur.en_attente`). Leur fiche n'a donc ni brouillon,
     * ni statut « en_attente » — et sans ce qui suit, elle
     * n'apparaîtrait NULLE PART : les photos attendraient pour
     * toujours, exactement le défaut que la nº 152 avait corrigé pour
     * les brouillons.
     * ⚠️ ON NE TOUCHE PAS À SON STATUT POUR AUTANT (règle 6) : la fiche
     * reste en ligne, telle qu'elle était. C'est la FILE qui va la
     * chercher, pas la fiche qui vient s'y mettre.
     * ⚠️ SANS LA MIGRATION Nº 70, la colonne n'existe pas : la lecture
     * échoue, on l'ignore, et l'écran est celui d'avant cette passe.
     */
    const photosEnAttenteParFiche = new Map<string, number>();
    const attentes = await admin
      .from("photos_tatoueur")
      .select("tatoueur_id")
      .eq("en_attente", true);
    if (!attentes.error) {
      for (const ligne of (attentes.data ?? []) as Array<{
        tatoueur_id: string;
      }>) {
        photosEnAttenteParFiche.set(
          ligne.tatoueur_id,
          (photosEnAttenteParFiche.get(ligne.tatoueur_id) ?? 0) + 1
        );
      }
    }
    //  Les fiches concernées qui ne sont pas déjà dans la file.
    const dejaListees = new Set(
      ((reponse.data ?? []) as Array<Record<string, unknown>>).map((l) =>
        String(l.id)
      )
    );
    const manquantes = [...photosEnAttenteParFiche.keys()].filter(
      (id) => !dejaListees.has(id)
    );
    if (manquantes.length > 0) {
      const complement = await admin
        .from("tatoueurs")
        .select("*")
        .in("id", manquantes);
      if (!complement.error) {
        reponse = {
          ...reponse,
          data: [
            ...((reponse.data ?? []) as Array<Record<string, unknown>>),
            ...((complement.data ?? []) as Array<Record<string, unknown>>),
          ],
        } as typeof reponse;
      }
    }

    //  ⚠️ LES CRÉATIONS DE L'ADMINISTRATEUR NE SONT PAS RELUES (passe
    //  nº 135). Elles suivaient le même parcours de modération que
    //  celles des vrais tatoueurs : il relisait ce qu'il venait
    //  d'écrire, et une fiche préparée pour un démarchage restait
    //  invisible tant qu'il n'avait pas cliqué « Valider » dans son
    //  propre écran. Elles se mettent en ligne d'un interrupteur, dans
    //  le tableau de démarchage.
    //
    //  ⚠️ MAIS SES MODIFICATIONS, SI (passe nº 152) — ET C'EST LE
    //  DÉFAUT QUE CETTE PASSE CORRIGE. Modifier une fiche DÉJÀ EN LIGNE
    //  écrit les changements dans un `brouillon` et repasse la fiche en
    //  « en_attente » : c'est vrai pour TOUT LE MONDE, l'administrateur
    //  compris (voir FormulaireFiche, cas B). Sa fiche entrait donc dans
    //  une file d'attente… dont ce filtre l'excluait. Plus aucun écran
    //  ne pouvait approuver le changement : la modification restait
    //  invisible POUR TOUJOURS — un style ajouté qui n'apparaissait ni
    //  dans la recherche ni sur la fiche.
    //  LA RÈGLE EST DONC : une fiche d'administrateur n'est écartée QUE
    //  SI ELLE N'A RIEN EN ATTENTE. Dès qu'elle porte un brouillon,
    //  elle prend sa place dans la file, comme les autres — et
    //  l'interrupteur du démarchage, lui, continue de piloter sa mise
    //  en ligne (il ne touche plus au statut tant qu'une modification
    //  attend : voir demarchage/fiche/route.ts).
    //
    //  ⚠️⚠️ ET SES CRÉATIONS AUSSI, DEPUIS LA PASSE Nº 272 — C'EST LE
    //  DÉFAUT DU RELEVÉ. Le propriétaire du site EST l'administrateur
    //  (COURRIELS_ADMIN) : sa création NORMALE — le formulaire,
    //  « Envoyer mon portfolio pour vérification », statut
    //  « en_attente », publie=false — tombait dans l'exclusion de la
    //  nº 135 (pensée pour les fiches de démarchage) et n'apparaissait
    //  DANS AUCUN ÉCRAN de validation : elle ne pouvait jamais être
    //  mise en ligne par ce chemin. Le tableau de démarchage la
    //  listait bien (il liste TOUTES les fiches des comptes admins),
    //  mais comme une ligne « à envoyer », sans rien dire qu'elle
    //  attendait une décision.
    //  LA RÈGLE COMPLÈTE : une fiche d'un compte administrateur est
    //  écartée SEULEMENT quand rien n'attend — ni brouillon (nº 152),
    //  ni CRÉATION jamais publiée. Une fiche déjà passée par
    //  l'interrupteur du démarchage (`admin_publique` posé) reste
    //  pilotée par lui, comme avant : elle n'entre pas dans la file.
    //  Les fiches préparées POUR un démarchage apparaissent désormais
    //  ici AUSSI, marquées `fiche_admin` (l'écran les annonce) : les
    //  voir en trop est un moindre mal — une création invisible ne
    //  l'est pas.
    //  ⚠️ RIEN NE CHANGE POUR LES VRAIS TATOUEURS : on écarte des
    //  PROPRIÉTAIRES, pas des fiches. Le jour où une adresse quitte
    //  COURRIELS_ADMIN, ses fiches reviennent ici d'elles-mêmes.
    const comptesAdmin = await identifiantsAdmin();
    const enAttente = ((reponse.data ?? []) as Array<Record<string, unknown>>)
      .filter((ligne) => {
        const proprietaire = ligne.user_id as string | null;
        if (!proprietaire || !comptesAdmin.includes(proprietaire)) return true;
        if (ligne.brouillon != null) return true;
        //  §1 (nº 285) — MÊME RAISON QUE LE BROUILLON : des photos qui
        //  attendent sont une décision à prendre, fût-ce sur une fiche
        //  d'administrateur.
        if (photosEnAttenteParFiche.has(String(ligne.id))) return true;
        //  LA CRÉATION D'UN ADMINISTRATEUR : jamais publiée, jamais
        //  passée par l'interrupteur — elle attend une décision, elle
        //  est montrée. (`admin_publique` absent d'une base pas
        //  encore migrée se lit comme « jamais posé » : on montre.)
        return ligne.publie !== true && ligne.admin_publique !== true;
      });

    // LE COMPTE PROPRIÉTAIRE, fiche par fiche : un compte peut en
    // avoir plusieurs, et l'admin doit voir laquelle vient de qui.
    // On lit les adresses en UNE fois, puis on les rattache.
    const comptes = new Map<string, string>();
    const identifiants = [
      ...new Set(
        enAttente
          .map((l) => l.user_id as string | null)
          .filter((v): v is string => Boolean(v))
      ),
    ];
    for (const identifiant of identifiants) {
      try {
        const { data } = await admin.auth.admin.getUserById(identifiant);
        if (data?.user?.email) comptes.set(identifiant, data.user.email);
      } catch {
        // Compte illisible : la fiche reste affichée, sans son adresse.
      }
    }

    /**
     * ██ §2 (nº 688) — COMBIEN DE PHOTOS PARTIRAIENT AVEC LA FICHE ██
     * ==================================================================
     * POURQUOI CE NOMBRE EXISTE : la fenêtre de confirmation de la
     * suppression le NOMME (« Portfolio X et ses 14 photos »). Le
     * propriétaire a supprimé la mauvaise demande d'un seul clic ; un
     * chiffre devant les yeux est ce qui distingue deux lignes qui se
     * ressemblent.
     * CE QU'IL COMPTE, EXACTEMENT — des ADRESSES DISTINCTES, jamais une
     * somme de colonnes :
     *  · la galerie (`photos_tatoueur`), qui est le vrai portfolio ;
     *  · les photos de style (`photos_styles`), la vignette
     *    (`photo_principale`) et le tableau `photos` de la ligne.
     * Les quatre SE RECOUVRENT — `photos_styles` sert de relais quand la
     * galerie est absente, et la vignette est l'une des autres. Un
     * `Set` d'adresses est donc la seule façon de ne compter chaque
     * image qu'une fois.
     * ⚠️ CE QUE ÇA COÛTE, DIT FRANCHEMENT : UNE lecture de plus sur
     * l'écran d'administration, bornée aux fiches de la file
     * (`in(...)`) — jamais la table entière. Elle ne sert qu'à un
     * chiffre : si elle échoue, on rend 0 et l'écran l'écrit
     * (« nombre de photos inconnu ») plutôt que de mentir.
     */
    const adressesParFiche = new Map<string, Set<string>>();
    try {
      const { data: images } = await admin
        .from("photos_tatoueur")
        .select("tatoueur_id, url")
        .in("tatoueur_id", [...dejaListees, ...manquantes]);
      for (const ligne of (images ?? []) as Array<{
        tatoueur_id: string;
        url: string | null;
      }>) {
        if (!ligne.url) continue;
        const lot = adressesParFiche.get(ligne.tatoueur_id) ?? new Set<string>();
        lot.add(ligne.url);
        adressesParFiche.set(ligne.tatoueur_id, lot);
      }
    } catch {
      //  Table absente (migration pas passée) : le compte vaudra 0, et
      //  l'écran dira qu'il ne sait pas.
    }

    // La version que l'admin doit VOIR : la ligne, recouverte de son
    // brouillon s'il existe (c'est LUI qui attend la validation).
    const fiches = enAttente.map(
      (ligne: Record<string, unknown>) => {
        const brouillon = ligne.brouillon as Record<string, unknown> | null;
        const proprietaire = ligne.user_id as string | null;
        return {
          ...ligne,
          ...(brouillon ?? {}),
          id: ligne.id,
          slug: ligne.slug,
          brouillon: undefined,
          modification: Boolean(brouillon),
          //  CE QUI A CHANGÉ (passe nº 152) — les champs dont le
          //  brouillon diffère de la version en ligne, nommés en
          //  français. « Vérifier » ne veut pas dire « tout relire » :
          //  sur une modification, seul ce qui bouge demande un avis.
          champs_modifies: champsModifies(ligne, brouillon),
          //  UNE FICHE D'ADMINISTRATEUR SE DIT (passe nº 152) : elle
          //  n'est ici que parce qu'elle a une modification en attente,
          //  et l'écran doit pouvoir l'annoncer.
          fiche_admin: Boolean(
            proprietaire && comptesAdmin.includes(proprietaire)
          ),
          //  §1 (nº 285) — COMBIEN DE PHOTOS ATTENDENT. L'écran peut
          //  ainsi dire « seules des photos attendent » : la fiche,
          //  elle, est en ligne et n'a rien à faire relire.
          photos_en_attente:
            photosEnAttenteParFiche.get(String(ligne.id)) ?? 0,
          //  §2 (nº 688) — TOUTES ses photos, comptées une seule fois
          //  chacune : c'est ce nombre que la confirmation de
          //  suppression annonce. La note du §2, plus haut, dit ce qui
          //  entre dedans et pourquoi c'est un `Set`.
          //  ⚠️ ON PART DE LA LIGNE, PAS DU BROUILLON : ce qui serait
          //  effacé, c'est ce qui EXISTE — un brouillon jamais publié ne
          //  fabrique aucun fichier de plus.
          photos_total: (() => {
            const adresses = new Set(adressesParFiche.get(String(ligne.id)) ?? []);
            for (const valeur of [
              ligne.photo_principale as string | null,
              ...((ligne.photos as string[] | null) ?? []),
              ...Object.values(
                (ligne.photos_styles as Record<string, string> | null) ?? {}
              ),
            ]) {
              if (typeof valeur === "string" && valeur) adresses.add(valeur);
            }
            return adresses.size;
          })(),
          compte: proprietaire ? (comptes.get(proprietaire) ?? null) : null,
        };
      }
    );
    /*  ██ §4 (nº 696) — « SUPPRESSIONS EN COURS » ██
        ==============================================================
        UNE SECONDE LISTE, ET ELLE NE PEUT PAS SORTIR DE LA PREMIÈRE :
        celle du dessus ne ramène que ce qui ATTEND UNE DÉCISION
        (`statut = en_attente`, ou une fiche d'avant la colonne). Un
        portfolio en cours de suppression, lui, garde le statut qu'il
        avait — un portfolio retiré alors qu'il était en ligne reste
        `validee`. Il n'apparaissait donc nulle part, et les sept jours
        se seraient écoulés sans que personne puisse revenir en
        arrière. Le critère est `purge_le`, et lui seul.
        ⚠️ LES DEUX DÉLAIS SONT DANS LA MÊME LISTE, distingués par
        l'ÉCART entre les deux dates — sept jours ou trente. C'est ce
        qui a permis de ne pas ajouter de colonne (voir
        DELAI_SUPPRESSION_ADMIN_JOURS, config/tatouage) : l'écart EST
        l'information, et il est déjà en base.
        ⚠️ SANS LES COLONNES, PAS D'ÉCRAN, PAS DE PANNE : une base
        d'avant la migration nº 24 fait échouer cette lecture ; on rend
        alors une liste vide, et l'écran est celui d'avant la passe. */
    const enSuppression = await admin
      .from("tatoueurs")
      .select("id, nom, slug, user_id, publie, statut, supprime_le, purge_le, photo_profil")
      .not("purge_le", "is", null)
      .order("purge_le", { ascending: true });
    const suppressions = enSuppression.error
      ? []
      : ((enSuppression.data ?? []) as Array<Record<string, unknown>>).map(
          (ligne) => {
            const proprietaire = ligne.user_id as string | null;
            return {
              ...ligne,
              //  L'ÉCART, EN JOURS ENTIERS : c'est lui qui nomme la
              //  suppression. On arrondit — une seconde de dérive entre
              //  les deux écritures ne doit pas changer la réponse.
              jours_demandes: joursEntreDeuxDates(
                ligne.supprime_le as string | null,
                ligne.purge_le as string | null
              ),
              compte: proprietaire ? (comptes.get(proprietaire) ?? null) : null,
              photos_total: new Set(
                adressesParFiche.get(String(ligne.id)) ?? []
              ).size,
            };
          }
        );
    return NextResponse.json({ ok: true, fiches, suppressions });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Couldn't load: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}

export async function POST(requete: NextRequest) {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }

  const corps = (await requete.json().catch(() => null)) as {
    id?: string;
    action?: string;
    motifs?: string[];
    note?: string;
  } | null;
  const id = corps?.id ?? "";
  const action = corps?.action ?? "";
  const motifs = (corps?.motifs ?? []).slice(0, 10);
  const note = (corps?.note ?? "").trim().slice(0, 600);

  //  §1 (nº 696) — deux actions de plus, celles de « Suppressions en
  //  cours » : revenir en arrière, ou ne pas attendre les sept jours.
  const ACTIONS = [
    "valider",
    "modifier",
    "hors_ligne",
    "supprimer",
    "annuler_suppression",
    "purger_maintenant",
  ];
  if (!id || !ACTIONS.includes(action)) {
    return NextResponse.json(
      { ok: false, message: "Incomplete request." },
      { status: 400 }
    );
  }
  if (["modifier", "hors_ligne"].includes(action) && motifs.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Check at least one reason." },
      { status: 400 }
    );
  }

  try {
    const admin = creerClientSupabaseAdmin();

    /*  ██ §1 (nº 675) — SUPPRIMER UNE DEMANDE DE MISE EN LIGNE ██
        ==============================================================
        CE QUE C'EST, ET POURQUOI ELLE SORT DU LOT. Les trois décisions
        du dessous MODIFIENT une fiche : elles la publient, la renvoient
        en correction, ou la retirent — la ligne reste, le tatoueur la
        garde. Celle-ci l'EFFACE, elle, et ses photos avec. Elle est
        faite pour ce que le propriétaire nomme : un FAUX COMPTE, un
        portfolio qui n'aurait jamais dû être déposé.
        ELLE SORT DONC AVANT le reste de la fonction, sans passer par la
        mise à jour.
        ██ §3 (nº 688) — MAIS ELLE PRÉVIENT LA PERSONNE, DÉSORMAIS ██
        LA nº 675 DISAIT : « il n'y a plus de ligne à notifier, et
        prévenir un faux compte n'aurait aucun sens ». LE PROPRIÉTAIRE
        TRANCHE AUTREMENT, et sa raison vaut mieux que la mienne : le
        faux compte est le cas RARE, la demande refusée est le cas
        COURANT, et voir son portfolio disparaître sans un mot est ce
        qu'il y a de pire. La nouvelle est donc posée — famille nº 664,
        genre `demande_refusee`, croix du refus.
        ⚠️ ELLE EST ÉCRITE AVANT L'EFFACEMENT, ET L'ORDRE EST OBLIGÉ :
        `notifications_compte.fiche_id` pointe vers `tatoueurs(id)`.
        Après la suppression, la clé étrangère refuserait la ligne ;
        avant, elle l'accepte, et le `on delete set null` la laisse
        lisible — c'est `fiche_nom`, recopié ici, qui portera le nom.
        ⚠️ ELLE NE PEUT PAS EMPÊCHER LA SUPPRESSION : `creerNotification`
        avale ses propres échecs et rend `false` (voir sa note). Une
        boîte de nouvelles indisponible ne doit pas bloquer une décision
        de modération.
        ⚠️ LE COMPTE DE CONNEXION N'EST PAS TOUCHÉ : supprimer un
        portfolio n'est pas supprimer quelqu'un. La personne garde son
        compte, ses favoris, ses suivis — et retrouve son identité de
        particulier au premier chargement (la règle de la nº 675, tenue
        par le rattrapage de MenuEspace).

        ██ §1 (nº 696) — ELLE N'EFFACE PLUS RIEN LE JOUR MÊME ██
        ==============================================================
        LA nº 675 ÉCRIVAIT LE CONTRAIRE, et je l'avais justifié : « ici
        c'est l'administration qui tranche contre un abus, il n'y a
        rien à protéger ». LE PROPRIÉTAIRE TRANCHE AUTREMENT, et il a
        raison : ce qu'il y avait à protéger, c'est LUI — contre son
        propre clic. Un faux compte peut attendre sept jours ; une
        suppression faite par erreur, elle, ne se rattrape pas.
        CE QUE ÇA DEVIENT : les deux colonnes des trente jours,
        remplies avec sept (`echeanceSuppression(…, DELAI_…_ADMIN_…)`).
        Rien d'autre. La fiche sort du public à la seconde même
        (`estEnLigne` regarde `supprime_le`, nº 694), la purge nocturne
        la ramassera à l'échéance, et le stockage sera nettoyé par le
        même chemin qu'avant (nº 692) — sauf qu'il passe désormais par
        `purgerFichesEchues`, pas par un appel direct.
        ⚠️ L'ORDRE S'INVERSE, ET C'EST VOULU. La nº 688 écrivait la
        nouvelle AVANT l'effacement, parce que la clé étrangère
        `fiche_id` aurait refusé une fiche déjà partie. Plus rien ne
        part : on écrit donc APRÈS, une fois l'échéance vraiment posée.
        Annoncer un retrait qui n'a pas eu lieu serait pire que le
        silence.
        ⚠️ ET LA NOUVELLE N'EST PLUS TOUJOURS LA MÊME (§4 du brief) :
        « Demande de portfolio refusée » ne convient qu'à une demande
        JAMAIS validée. Un portfolio qui était en ligne reçoit
        « Portfolio retiré ». C'est `publie`/`statut` qui départage.
        ⚠️ ON DIT À L'ADMINISTRATION SI LA NOUVELLE EST PARTIE. C'est le
        §1 du brief : une pose qui échoue le faisait en silence, et le
        propriétaire ne l'a appris que des semaines plus tard, en
        production. `creerNotification` avale toujours ses erreurs (une
        boîte de nouvelles indisponible ne doit pas bloquer une
        décision de modération) — mais elle rend `false`, et ce `false`
        remonte maintenant jusqu'à l'écran. */
    if (action === "supprimer") {
      const { data: ligne } = await admin
        .from("tatoueurs")
        //  §3 (nº 688) — LE NOM AUSSI : c'est lui que la nouvelle
        //  recopie, pour rester lisible après la purge.
        //  §5 (nº 696) — ET LE SLUG : voir `rafraichirPagesPubliques`
        //  plus bas. On le lit ICI, tant que la ligne est sous la main.
        .select("user_id, nom, slug, publie, statut")
        .eq("id", id)
        .maybeSingle();
      const fiche = ligne as {
        user_id?: string | null;
        nom?: string | null;
        slug?: string | null;
        publie?: boolean | null;
        statut?: string | null;
      } | null;
      if (!fiche) {
        return NextResponse.json(
          { ok: false, message: "This portfolio no longer exists." },
          { status: 404 }
        );
      }
      const maintenant = new Date();
      const purgeLe = echeanceSuppression(
        maintenant,
        DELAI_SUPPRESSION_ADMIN_JOURS
      ).toISOString();
      const { error } = await admin
        .from("tatoueurs")
        .update({ supprime_le: maintenant.toISOString(), purge_le: purgeLe })
        .eq("id", id);
      if (error) throw new Error(error.message);
      /*  ██ §5 (nº 696) — « INVISIBLE IMMÉDIATEMENT » L'ÉTAIT MOINS
          QU'ON NE LE CROYAIT ██
          ==========================================================
          CE QUE LE BANC A MONTRÉ, ET JE NE L'ATTENDAIS PAS : après la
          suppression, `/tatoueur/<slug>` répondait encore 200 avec le
          portfolio entier. La règle de visibilité était pourtant juste
          (`estEnLigne` regarde `supprime_le`, nº 694) — c'est LE CACHE
          qui parlait : cette page est PRÉRENDUE, avec une remise à
          jour toutes les cinq minutes.
          ⚠️ CE N'EST PAS UN DÉFAUT DE CETTE PASSE : la suppression
          IMMÉDIATE d'avant (nº 675) sortait par le même `return`
          anticipé, sans vider le cache — un portfolio effacé de la
          base restait donc affiché jusqu'à cinq minutes. Personne ne
          l'avait vu parce que personne n'avait mesuré la page publique
          juste après.
          LA CORRECTION est l'appel qui existait déjà pour les trois
          autres décisions, quelques centaines de lignes plus bas : les
          trois branches de la suppression l'appellent désormais aussi.
          ⚠️ IL NE S'ATTEND PAS (pas de `await`) : vider un cache ne
          doit pas retarder la réponse à l'administration. C'est
          l'usage qu'en font déjà les autres décisions. */
      rafraichirPagesPubliques(fiche.slug ?? null);

      //  EN LIGNE, OU JAMAIS VALIDÉ ? Les deux phrases du propriétaire.
      const etaitEnLigne = fiche.publie === true || fiche.statut === "validee";
      const notifiee = await creerNotification({
        userId: fiche.user_id,
        ficheId: id,
        ficheNom: fiche.nom ?? null,
        genre: etaitEnLigne ? "portfolio_retire" : "demande_refusee",
      });
      return NextResponse.json({
        ok: true,
        purgeLe,
        notifiee,
        //  LA NUANCE QUI COMPTE POUR L'ÉCRAN : une fiche de démarchage
        //  n'a AUCUN propriétaire — il n'y a personne à prévenir, ce
        //  n'est pas un échec. `creerNotification` rend `false` dans
        //  les deux cas ; cette ligne les sépare.
        sansProprietaire: !fiche.user_id,
      });
    }

    /*  ██ §2 (nº 696) — REVENIR EN ARRIÈRE PENDANT LES SEPT JOURS ██
        Les deux colonnes repassent à null, et RIEN D'AUTRE n'est
        touché : c'est ce qui fait revenir le portfolio EXACTEMENT tel
        qu'il était — publié ou non, brouillon compris. C'est déjà le
        mot pour mot de l'annulation du tatoueur (nº 24) ; on ne fait
        que l'ouvrir à l'administration.
        ⚠️ LA NOUVELLE DU RETRAIT N'EST PAS EFFACÉE, et c'est la
        consigne : une parole du site ne se reprend pas — la personne
        l'a peut-être déjà lue. On en pose une SECONDE, qui dit que le
        portfolio est rétabli. */
    if (action === "annuler_suppression") {
      const { data: ligne } = await admin
        .from("tatoueurs")
        .select("user_id, nom, slug, purge_le")
        .eq("id", id)
        .maybeSingle();
      const fiche = ligne as {
        user_id?: string | null;
        nom?: string | null;
        slug?: string | null;
        purge_le?: string | null;
      } | null;
      if (!fiche) {
        return NextResponse.json(
          { ok: false, message: "This portfolio no longer exists." },
          { status: 404 }
        );
      }
      const { error } = await admin
        .from("tatoueurs")
        .update({ supprime_le: null, purge_le: null })
        .eq("id", id);
      if (error) throw new Error(error.message);
      //  §5 (nº 696) — le retour est aussi pressé que le départ : sans
      //  ça, le portfolio rétabli resterait absent du public jusqu'à
      //  cinq minutes. Voir la note de « supprimer ».
      rafraichirPagesPubliques(fiche.slug ?? null);
      const notifiee = await creerNotification({
        userId: fiche.user_id,
        ficheId: id,
        ficheNom: fiche.nom ?? null,
        genre: "portfolio_retabli",
      });
      return NextResponse.json({
        ok: true,
        notifiee,
        sansProprietaire: !fiche.user_id,
      });
    }

    /*  ██ §3 (nº 696) — NE PAS ATTENDRE L'ÉCHÉANCE ██
        L'effacement d'avant cette passe, gardé intact et déplacé ici :
        `supprimerLaFicheDefinitivement` est le corps extrait de
        `purgerFichesEchues` (lib/suppression-compte) — mêmes photos du
        stockage effacées (nº 692), même ligne supprimée. Deux
        écritures auraient fini par diverger, et celle qui oublie les
        photos laisse des fichiers orphelins pour toujours.
        ⚠️ AUCUNE NOUVELLE ICI : la personne a déjà été prévenue le jour
        de la demande. Lui redire la même chose sept jours plus tard —
        ou le jour même si l'on abrège — n'apprendrait rien.
        ⚠️ ET L'ÉCRAN EXIGE LE MOT TAPÉ pour celle-ci comme pour
        l'autre : c'est bien elle qui ne se rattrape pas. */
    if (action === "purger_maintenant") {
      const { data: ligne } = await admin
        .from("tatoueurs")
        .select("user_id, slug")
        .eq("id", id)
        .maybeSingle();
      const fiche = ligne as {
        user_id?: string | null;
        slug?: string | null;
      } | null;
      await supprimerLaFicheDefinitivement(id, fiche?.user_id ?? null);
      //  §5 (nº 696) — et la page prérendue s'en va avec la ligne.
      rafraichirPagesPubliques(fiche?.slug ?? null);
      return NextResponse.json({ ok: true });
    }

    /*  ██ §1 (nº 700) — ON NE DÉCIDE PAS SUR UN PORTFOLIO QUI S'EN VA ██
        ==============================================================
        LE CAS, TROUVÉ PAR L'AUDIT nº 691 (R7) : une suppression est en
        cours (celle du tatoueur, trente jours, ou celle de
        l'administration, sept) et une validation arrive. « Valider »
        écrit `publie`, `statut` et `hors_ligne` — JAMAIS les deux dates
        de la suppression. On obtenait donc un portfolio « validé » qui
        reste invisible (`estEnLigne` regarde `supprime_le`, nº 694),
        une nouvelle « Portfolio en ligne » qui ment à la personne, et
        une purge qui l'effacera quand même à l'échéance.

        DEUX CONDUITES POSSIBLES, ET J'AI CHOISI LA PLUS SÛRE.
        LEVER LA SUPPRESSION en même temps que l'on valide serait
        commode — un geste au lieu de deux. C'est aussi le plus
        dangereux : quand c'est LE TATOUEUR qui a demandé la
        suppression, l'administration ressusciterait son portfolio sans
        le savoir ni le vouloir, contre une décision qui n'est pas la
        sienne. Une modération ne doit jamais défaire en silence le
        choix de quelqu'un d'autre.
        ON REFUSE DONC, ET ON DIT POURQUOI. Le geste manquant existe
        déjà : « Annuler » dans « Suppressions en cours » (nº 696). Deux
        gestes explicites valent mieux qu'un implicite.
        ⚠️ LES TROIS DÉCISIONS SONT CONCERNÉES, pas seulement la
        validation : mettre hors ligne ou demander des modifications sur
        un portfolio qui part n'a pas davantage de sens, et poserait la
        même nouvelle trompeuse. Un seul contrôle, avant la branche.
        ⚠️ ET L'ORDRE INVERSE VA DE SOI : supprimer un portfolio qui
        attend une validation reste permis — c'est même le cas courant
        (une demande qu'on refuse), et la nº 696 lui pose déjà la bonne
        nouvelle. Rien à garder de ce côté-là. */
    const { data: etat } = await admin
      .from("tatoueurs")
      .select("nom, supprime_le, purge_le")
      .eq("id", id)
      .maybeSingle();
    const enPartance = etat as {
      nom?: string | null;
      supprime_le?: string | null;
      purge_le?: string | null;
    } | null;
    if (enPartance?.supprime_le || enPartance?.purge_le) {
      return NextResponse.json(
        {
          ok: false,
          message:
            `"${enPartance.nom ?? "This portfolio"}" is being deleted: ` +
            "no decision can apply to it. Cancel the deletion under " +
            "\"Deletions in progress\" first, then come back here.",
        },
        { status: 409 }
      );
    }

    let valeurs: Record<string, unknown>;
    if (action === "valider") {
      // Le brouillon éventuel devient LA fiche publique.
      const { data } = await admin
        .from("tatoueurs")
        .select("brouillon")
        .eq("id", id)
        .maybeSingle();
      const brouillon =
        (data as { brouillon?: Record<string, unknown> | null } | null)
          ?.brouillon ?? null;
      valeurs = {
        ...(brouillon ?? {}),
        publie: true,
        statut: "validee",
        hors_ligne: false,
        motifs_moderation: null,
        note_moderation: null,
        decide_le: new Date().toISOString(),
        brouillon: null,
        validation_a_notifier: true,
      };
    } else if (action === "hors_ligne") {
      // « Mettre la fiche hors ligne » : DÉPUBLIÉE (plus aucune page
      // publique ne la sert — recherche, mosaïque, fiche), le drapeau
      // `hors_ligne` distingue cette sanction d'une simple attente,
      // et les motifs cochés guident la correction — exactement le
      // mécanisme du refus. Le COMPTE, lui, n'est pas touché : le
      // tatoueur garde son espace.
      valeurs = {
        publie: false,
        hors_ligne: true,
        statut: "modifications",
        motifs_moderation: motifs,
        note_moderation: note || null,
        decide_le: new Date().toISOString(),
      };
    } else {
      // « Demander des modifications » : les motifs partent, la fiche
      // repasse au tatoueur. `publie` N'EST PAS TOUCHÉ — une fiche en
      // ligne le reste, sa version publique n'a pas bougé.
      valeurs = {
        statut: "modifications",
        motifs_moderation: motifs,
        note_moderation: note || null,
        decide_le: new Date().toISOString(),
      };
    }

    // Les colonnes des migrations récentes peuvent manquer : on retire
    // CELLE que l'erreur nomme et on réessaie, sans jamais abandonner
    // la décision elle-même.
    const tolerees = [
      "validation_a_notifier",
      "brouillon",
      "decide_le",
      "motifs_moderation",
      "note_moderation",
      "hors_ligne",
      "statut",
    ];
    let maj = await admin.from("tatoueurs").update(valeurs).eq("id", id);
    for (let essai = 0; essai < tolerees.length && maj.error; essai++) {
      const message = maj.error.message.toLowerCase();
      const enCause = tolerees.find(
        (colonne) => message.includes(colonne) && colonne in valeurs
      );
      if (!enCause) break;
      valeurs = { ...valeurs };
      delete valeurs[enCause];
      maj = await admin.from("tatoueurs").update(valeurs).eq("id", id);
    }
    if (maj.error && action === "valider") {
      // Dernier repli : la seule colonne dont tout dépend.
      maj = await admin.from("tatoueurs").update({ publie: true }).eq("id", id);
    }
    if (maj.error) throw new Error(maj.error.message);

    /**
     * §1 (nº 285) — VALIDER LIBÈRE AUSSI LES PHOTOS QUI ATTENDAIENT.
     * ------------------------------------------------------------------
     * C'est le geste qui TERMINE la règle 3 : les photos neuves
     * deviennent publiques, d'un coup, avec le reste. Sans lui elles
     * resteraient invisibles pour toujours.
     * ⚠️ SEULEMENT SUR « VALIDER » : demander des modifications ou
     * mettre hors ligne laisse les photos en attente — elles n'ont pas
     * été acceptées, elles ne doivent pas s'afficher.
     * ⚠️ JAMAIS BLOQUANT : sans la migration nº 70 la colonne n'existe
     * pas, et il n'y a alors rien à libérer (aucune photo n'attend).
     */
    if (action === "valider") {
      await admin
        .from("photos_tatoueur")
        .update({ en_attente: false })
        .eq("tatoueur_id", id)
        .eq("en_attente", true);
    }

    // LE CACHE DES PAGES PUBLIQUES EST VIDÉ TOUT DE SUITE : une fiche
    // validée doit apparaître dans la mosaïque et sur sa page « style
    // + ville » sans attendre (voir src/lib/rafraichir.ts).
    rafraichirPagesPubliques(
      (
        await admin
          .from("tatoueurs")
          .select("slug")
          .eq("id", id)
          .maybeSingle()
      ).data?.slug ?? null
    );

    // LA NOTIFICATION — elle NOMME la fiche concernée : un compte peut
    // en gérer plusieurs, « ta modification est refusée » ne veut plus
    // rien dire sans dire laquelle. Jamais bloquante : la décision est
    // déjà enregistrée, une notification manquée ne la défait pas.
    const proprietaire = await proprietaireDeLaFiche(id);
    if (proprietaire) {
      await creerNotification({
        userId: proprietaire.userId,
        ficheId: id,
        ficheNom: proprietaire.nom,
        genre:
          action === "valider"
            ? "validee"
            : action === "hors_ligne"
              ? "hors_ligne"
              : "modifications",
        detail: note || null,
        motifs: action === "valider" ? null : motifs,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `The decision wasn't saved: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
