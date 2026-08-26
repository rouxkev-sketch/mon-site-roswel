import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { natureConnue } from "@/lib/photos-tatoueur";
import { modesActifs, type ModeExerciceFiche } from "@/lib/modes-exercice";

/**
 * CE QUE LA PAGE « MES FAVORIS » LIT — côté serveur
 * ==================================================
 * TROIS LECTURES SIMPLES, ET PAS UNE JOINTURE IMBRIQUÉE. C'est la
 * règle de la maison (voir `garnirFiches` dans lib/tatoueurs) et elle
 * a ici une deuxième raison : `favoris_photos` et `photos_tatoueur`
 * n'ont pas les mêmes politiques de lecture. Une imbriquée mélangerait
 * les deux dans une seule requête, et le moindre changement de
 * politique la ferait taire sans un mot. Trois lectures se lisent, se
 * mesurent et se réparent une par une.
 *
 * ⚠️ ON N'AFFICHE QUE CE QUI EST ENCORE PUBLIÉ. Une fiche retirée du
 * site (hors ligne, suppression en cours, modération) disparaît des
 * favoris tant qu'elle n'est pas revenue — et REVIENT d'elle-même le
 * jour où elle est republiée : la ligne de favori, elle, n'a jamais
 * bougé. C'est exactement ce qu'on veut : ne rien perdre, ne rien
 * montrer qui ne soit pas public.
 */

/**
 * SUIT-ON DÉJÀ CE TATOUEUR ? — la question posée PAR LE SERVEUR
 * ==============================================================
 * (passe nº 208-§1)
 *
 * Le bouton « Suivre » naissait toujours dans son état « pas suivi »,
 * puis se corrigeait une fois la liste des favoris arrivée du réseau :
 * sur un téléphone, cela se voyait — « Suivre », puis « Suivi ». C'est
 * le même défaut que le bouton de compte de la nº 203, et la même
 * correction : LE SERVEUR A LA SESSION, il répond avant de rendre.
 *
 * Une seule ligne lue, un oui ou un non — rien d'autre ne sort d'ici.
 * Jamais bloquant : base injoignable ou migration nº 54 pas passée, on
 * répond « non », qui est l'état de la quasi-totalité des visites.
 */
export async function suitCeTatoueur(
  utilisateurId: string,
  tatoueurId: string
): Promise<boolean> {
  try {
    const supabase = await creerClientSupabaseServeur();
    const { data } = await supabase
      .from("tatoueurs_suivis")
      .select("tatoueur_id")
      .eq("utilisateur_id", utilisateurId)
      .eq("tatoueur_id", tatoueurId)
      .maybeSingle();
    return data !== null;
  } catch {
    return false;
  }
}

/** UNE PHOTO ENREGISTRÉE, avec ce qu'il faut pour l'afficher. */
export type PhotoFavorite = {
  /** L'identifiant de la photo — la clé du cœur. */
  id: string;
  url: string;
  miniature: string;
  style: string;
  rendu: string | null;
  nature: string;
  /**
   * §1 (nº 278) — SA PLACE DANS LA GALERIE DE L'ARTISTE.
   * ------------------------------------------------------------------
   * ⚠️ ELLE MANQUAIT, ET C'ÉTAIT LE DÉFAUT. Sans elle, rien, nulle
   * part, ne pouvait remettre un carrousel favori dans l'ordre de son
   * auteur : la page affichait les photos dans l'ordre des LIGNES DE
   * FAVORIS, et ces lignes-là sont écrites toutes en même temps quand
   * on aime une galerie (un seul `upsert`, donc un seul `now()`, donc
   * des dates identiques, donc un ordre que PostgreSQL ne garantit
   * pas). La règle 1 du carrousel (voir lib/photos-tatoueur) exige la
   * colonne `ordre` : elle voyage désormais avec la photo.
   */
  ordre: number;
  /** Le tatoueur à qui elle appartient — la carte le nomme.
      ⚠️ SON IDENTIFIANT ET SON LIEU VOYAGENT AUSSI (nº 213-§3b) : la
      page « Ma sélection » affiche désormais LA CARTE DE LA MOSAÏQUE,
      qui attend une fiche — pas une photo. Ces colonnes étaient déjà
      lues par la requête ; elles s'arrêtaient simplement ici. */
  tatoueurId: string;
  tatoueurNom: string;
  tatoueurSlug: string;
  ville: string;
  region: string | null;
  pays: string | null;
  codePays: string | null;
  /** DE QUI VIENT LA PHOTO — « Artiste », « Salon », « Studio ».
      La carte de la mosaïque le dit dans l'image ; celle des favoris
      le disait pas (passe nº 142), et deux cartes identiques qui ne
      portent pas la même information se lisent comme deux objets
      différents. Les deux colonnes voyagent ensemble : c'est
      `libelleTypeFiche` qui en fait un mot. */
  typeFiche: string;
  etablissement: string;
  /** LE PORTRAIT DU TATOUEUR — la carte de la mosaïque le pose sous
      l'image ; celle des favoris ne le portait pas (nº 143-6A). */
  photoProfil: string | null;
};

/** UNE PHOTO D'UN SUIVI — la bande de trois du bloc (nº 243-§4). */
export type PhotoDuSuivi = {
  id: string;
  url: string;
  miniature: string;
  style: string;
  rendu: string | null;
  nature: string;
  /** §1 (nº 302) — LA PLACE VOULUE PAR L'ARTISTE dans sa galerie. Elle
      manquait ici : la composition de la galerie de « Ma sélection »
      range chaque carrousel dans l'ordre de son auteur (règle 1 du
      carrousel), elle a donc besoin de cette colonne. */
  ordre: number;
  /** §1 (nº 302), RÈGLE 5 — LE NOMBRE DE J'AIME REÇUS PAR CETTE PHOTO,
      tous comptes confondus. Il vient de la vue `coeurs_par_photo`
      (migration `yokofolio-coeur-une-photo`) : la table des favoris est
      privée, seul un COMPTE en sort — il ne nomme personne. Base sans
      la migration : zéro partout, et la galerie garde l'ordre de
      l'artiste. */
  jaime: number;
  /** La date de publication — elle sert au classement ET au compte de
      nouveautés (nº 243-§5). */
  creeLe: string;
};

/** UN TATOUEUR SUIVI, tel que l'onglet « Tatoueurs » le montre. */
export type TatoueurSuivi = {
  id: string;
  nom: string;
  slug: string;
  ville: string;
  region: string | null;
  pays: string | null;
  codePays: string | null;
  photoProfil: string | null;
  /** Le type de la fiche (« artiste », « salon », « prive ») — la
      ligne d'un LIEU suivi s'écrit avec `libelleTypeFiche`. */
  typeFiche: string;
  etablissement: string;
  /** ⚠️ SES MODES D'EXERCICE (nº 243-§2 et §3) : ce sont EUX qui
      portent les dates de guest (migration nº 21) et la ligne
      d'information. Aucune seconde source n'est créée. */
  modes: ModeExerciceFiche[];
  /** SES PUBLICATIONS RÉCENTES — les plus récentes d'abord. Elles
      servent aux trois photos du bloc (§4) et au compte du §5. */
  recentes: PhotoDuSuivi[];
  /** LE COMPTE DE NOUVEAUTÉS (§5) — publications postérieures à la
      dernière visite de CETTE page. Zéro quand on ne sait pas. */
  nouveautes: number;
};

export type ContenuFavoris = {
  photos: PhotoFavorite[];
  suivis: TatoueurSuivi[];
};

const VIDE: ContenuFavoris = { photos: [], suivis: [] };

/**
 * COMBIEN DE PUBLICATIONS ON REGARDE EN ARRIÈRE. Une lecture bornée,
 * pour tous les suivis à la fois : au-delà, ni la bande de trois ni le
 * compte de nouveautés ne changeraient quoi que ce soit à l'écran.
 */
const PUBLICATIONS_LUES = 400;

/**
 * TOUT CE QUE CE COMPTE A GARDÉ. Rendu VIDE — jamais en erreur — si
 * les migrations nº 53 et 54 ne sont pas encore passées : la page
 * s'affiche alors avec son état vide, ce qui est la vérité.
 */
export async function lireLesFavoris(
  utilisateurId: string
): Promise<ContenuFavoris> {
  try {
    const supabase = await creerClientSupabaseServeur();

    /* ---- 1. LES LIGNES DE FAVORIS, la plus récente d'abord ---- */
    const [lignesPhotos, lignesSuivis] = await Promise.all([
      supabase
        .from("favoris_photos")
        .select("photo_id, cree_le")
        .eq("utilisateur_id", utilisateurId)
        .order("cree_le", { ascending: false }),
      supabase
        .from("tatoueurs_suivis")
        .select("tatoueur_id, cree_le")
        .eq("utilisateur_id", utilisateurId)
        .order("cree_le", { ascending: false }),
    ]);

    const idsPhotos = (lignesPhotos.data ?? []).map(
      (ligne) => ligne.photo_id as string
    );
    const idsSuivis = (lignesSuivis.data ?? []).map(
      (ligne) => ligne.tatoueur_id as string
    );
    if (idsPhotos.length === 0 && idsSuivis.length === 0) return VIDE;

    /* ---- 2. LES PHOTOS, puis LES FICHES qui les portent ---- */
    const photos =
      idsPhotos.length > 0
        ? await supabase
            .from("photos_tatoueur")
            //  §1 (nº 278) — `ordre` EST LU : c'est la place que
            //  l'artiste a donnée à la photo dans sa galerie, et la
            //  règle 1 du carrousel en dépend entièrement.
            .select("id, tatoueur_id, style, rendu, nature, url, miniature, ordre")
            .in("id", idsPhotos)
        : { data: [], error: null };

    type LignePhoto = {
      id: string;
      tatoueur_id: string;
      style: string;
      rendu: string | null;
      nature?: string | null;
      url: string;
      miniature: string | null;
      ordre?: number | null;
    };
    const brutes = (photos.error ? [] : (photos.data ?? [])) as unknown as
      LignePhoto[];

    //  TOUTES LES FICHES CONCERNÉES — celles des photos ET celles
    //  qu'on suit, en UNE lecture. Publiées seulement.
    const idsFiches = [
      ...new Set([...brutes.map((p) => p.tatoueur_id), ...idsSuivis]),
    ];
    const fiches =
      idsFiches.length > 0
        ? await supabase
            .from("tatoueurs")
            .select(
              "id, nom, slug, ville_nom, region, pays, code_pays, photo_profil, " +
                //  LE BADGE DE LA CARTE (passe nº 142) — les deux
                //  colonnes que `libelleTypeFiche` croise.
                "type_fiche, etablissement"
            )
            .in("id", idsFiches)
            .eq("publie", true)
        : { data: [], error: null };

    type LigneFiche = {
      id: string;
      nom: string;
      slug: string;
      ville_nom: string | null;
      region: string | null;
      pays: string | null;
      code_pays: string | null;
      photo_profil: string | null;
      type_fiche: string | null;
      etablissement: string | null;
    };
    const parFiche = new Map<string, LigneFiche>();
    for (const ligne of (fiches.error ? [] : (fiches.data ?? [])) as unknown as
      LigneFiche[]) {
      parFiche.set(ligne.id, ligne);
    }

    /* ---- 3. REMISE DANS L'ORDRE DES FAVORIS ----
       ⚠️ C'EST `idsPhotos` QUI COMMANDE, pas la base : `in(...)` rend
       les lignes dans l'ordre qui l'arrange. L'ordre voulu est celui
       de l'enregistrement, le dernier d'abord — il vient de la
       première lecture, et on le rejoue ici. */
    const parPhoto = new Map(brutes.map((photo) => [photo.id, photo]));
    const listePhotos: PhotoFavorite[] = [];
    for (const id of idsPhotos) {
      const photo = parPhoto.get(id);
      if (!photo) continue;
      const fiche = parFiche.get(photo.tatoueur_id);
      if (!fiche) continue; // Fiche dépubliée : on n'affiche pas.
      listePhotos.push({
        id: photo.id,
        url: photo.url,
        miniature: photo.miniature || photo.url,
        style: photo.style,
        rendu: photo.rendu,
        nature: natureConnue(photo.nature),
        //  §1 (nº 278) — la place voulue par l'artiste. Une base à qui
        //  il manquerait la colonne rend `null` : on lit 0, comme le
        //  défaut de la migration nº 31 — l'ordre de la liste sert
        //  alors de départage, exactement comme avant.
        ordre: photo.ordre ?? 0,
        tatoueurId: fiche.id,
        tatoueurNom: fiche.nom,
        tatoueurSlug: fiche.slug,
        ville: fiche.ville_nom ?? "",
        region: fiche.region,
        pays: fiche.pays,
        codePays: fiche.code_pays,
        //  LES MÊMES REPLIS QUE `normaliser` dans lib/tatoueurs : une
        //  fiche d'avant la migration nº 38 n'a ni l'une ni l'autre.
        typeFiche: fiche.type_fiche ?? "salon",
        etablissement: fiche.etablissement ?? "salon",
        photoProfil: fiche.photo_profil,
      });
    }

    /* ---- 4. CE QU'IL FAUT POUR L'ONGLET « TATOUEURS » (nº 243) ----
       DEUX LECTURES DE PLUS, et seulement si l'on suit quelqu'un :
        · LES MODES D'EXERCICE — ils portent les dates de guest
          (migration nº 21) et la ligne d'information. C'est la SEULE
          source : rien n'est recopié ailleurs ;
        · LES PUBLICATIONS RÉCENTES de ces fiches — la bande de trois
          photos, et le compte de nouveautés depuis la dernière visite.
       ⚠️ TROIS LECTURES SIMPLES, JAMAIS UNE IMBRIQUÉE : la règle de la
       maison, rappelée en tête de ce fichier. */
    const suivisPresents = idsSuivis.filter((id) => parFiche.has(id));
    const [lignesModes, lignesRecentes, visite] = await Promise.all([
      suivisPresents.length > 0
        ? supabase.from("modes_exercice").select("*").in("tatoueur_id", suivisPresents)
        : Promise.resolve({ data: [], error: null }),
      suivisPresents.length > 0
        ? supabase
            .from("photos_tatoueur")
            .select(
              //  §1 (nº 302) — `ordre` EST LU ICI AUSSI : la galerie de
              //  « Ma sélection » range chaque carrousel dans l'ordre
              //  de son auteur.
              //  ██ §1 (nº 638) — ET `en_attente` AVEC LUI ██
              //  C'est la colonne de la RÈGLE 6 DE LA nº 285 : une photo
              //  qui vient d'arriver sur une fiche déjà validée « est
              //  visible de son auteur, JAMAIS du public ». Deux
              //  lectures du site la tenaient — la recherche en base, et
              //  `garnirFiches` (lib/tatoueurs) — mais celle-ci NE LA
              //  DEMANDAIT MÊME PAS : la bande de « Ma sélection »
              //  montrait donc les photos en attente à tous ceux qui
              //  suivent l'artiste. Relevé nº 637, fermé ici.
              "id, tatoueur_id, style, rendu, nature, url, miniature, cree_le, ordre, en_attente"
            )
            .in("tatoueur_id", suivisPresents)
            .order("cree_le", { ascending: false })
            .limit(PUBLICATIONS_LUES)
        : Promise.resolve({ data: [], error: null }),
      lireLaDerniereVisite(utilisateurId),
    ]);

    type LigneMode = ModeExerciceFiche & { tatoueur_id: string };
    const modesParFiche = new Map<string, ModeExerciceFiche[]>();
    for (const ligne of (lignesModes.error ? [] : (lignesModes.data ?? [])) as unknown as LigneMode[]) {
      const liste = modesParFiche.get(ligne.tatoueur_id) ?? [];
      liste.push(ligne);
      modesParFiche.set(ligne.tatoueur_id, liste);
    }

    type LigneRecente = {
      id: string;
      tatoueur_id: string;
      style: string;
      rendu: string | null;
      nature?: string | null;
      url: string;
      miniature: string | null;
      cree_le: string;
      ordre?: number | null;
      /** §1 (nº 638) — la colonne de la règle 6 (nº 285). FACULTATIVE :
          sans la migration `yokofolio-photos-en-attente`, elle n'existe
          pas, la base rend `undefined`, et le site se comporte comme
          avant — exactement le repli de `garnirFiches`. */
      en_attente?: boolean | null;
    };
    /**
     * §1 (nº 302), RÈGLE 5 — LES J'AIME DE CES PHOTOS, EN UNE LECTURE.
     * ------------------------------------------------------------------
     * ⚠️ UNE VUE, PAS LA TABLE : `favoris_photos` est privée (RLS de la
     * migration nº 53) — personne ne peut lire les favoris d'un autre,
     * et c'est très bien ainsi. `coeurs_par_photo` n'en rend qu'un
     * COMPTE par photo, qui ne nomme personne.
     * ⚠️ ET ELLE PEUT NE PAS EXISTER : tant que la migration n'est pas
     * passée, la lecture échoue et l'on répond zéro partout — la
     * galerie garde alors l'ordre de l'artiste, sans rien casser.
     */
    const lignesBrutes = (lignesRecentes.error
      ? []
      : (lignesRecentes.data ?? [])) as unknown as LigneRecente[];
    const jaimeParPhoto = new Map<string, number>();
    if (lignesBrutes.length > 0) {
      const comptes = await supabase
        .from("coeurs_par_photo")
        .select("photo_id, coeurs")
        .in(
          "photo_id",
          lignesBrutes.map((ligne) => ligne.id)
        );
      for (const ligne of (comptes.error
        ? []
        : (comptes.data ?? [])) as unknown as {
        photo_id: string;
        coeurs: number | null;
      }[]) {
        jaimeParPhoto.set(ligne.photo_id, Number(ligne.coeurs ?? 0));
      }
    }
    const recentesParFiche = new Map<string, PhotoDuSuivi[]>();
    for (const ligne of lignesBrutes) {
      //  ██ §1 (nº 638) — RÈGLE 6 DE LA nº 285, TENUE ICI AUSSI ██
      //  Le test est écrit comme celui de `garnirFiches`
      //  (lib/tatoueurs) : STRICTEMENT `=== true`, jamais « faux ou
      //  absent ». Sans la migration la colonne n'existe pas, la valeur
      //  est `undefined`, la photo est gardée, et rien ne change.
      //  ⚠️ ET LE COMPTE DE NOUVEAUTÉS SUIT TOUT SEUL : il se calcule
      //  plus bas sur cette même liste — une photo en attente ne peut
      //  donc plus être annoncée comme une nouveauté avant d'exister.
      if (ligne.en_attente === true) continue;
      const liste = recentesParFiche.get(ligne.tatoueur_id) ?? [];
      liste.push({
        id: ligne.id,
        url: ligne.url,
        miniature: ligne.miniature || ligne.url,
        style: ligne.style,
        rendu: ligne.rendu,
        nature: natureConnue(ligne.nature),
        creeLe: ligne.cree_le,
        //  Une base à qui il manquerait la colonne rend `null` : on lit
        //  0, comme le défaut de la migration nº 31.
        ordre: ligne.ordre ?? 0,
        jaime: jaimeParPhoto.get(ligne.id) ?? 0,
      });
      recentesParFiche.set(ligne.tatoueur_id, liste);
    }

    const listeSuivis: TatoueurSuivi[] = [];
    for (const id of idsSuivis) {
      const fiche = parFiche.get(id);
      if (!fiche) continue;
      const recentes = recentesParFiche.get(id) ?? [];
      listeSuivis.push({
        id: fiche.id,
        nom: fiche.nom,
        slug: fiche.slug,
        ville: fiche.ville_nom ?? "",
        region: fiche.region,
        pays: fiche.pays,
        codePays: fiche.code_pays,
        photoProfil: fiche.photo_profil,
        typeFiche: fiche.type_fiche ?? "salon",
        etablissement: fiche.etablissement ?? "salon",
        modes: modesActifs(modesParFiche.get(id) ?? []),
        recentes,
        //  ⚠️ LE COMPTE SE LIT, IL NE S'ÉCRIT PAS ICI (nº 243-§5) :
        //  l'horodatage de visite n'est écrit qu'au DÉPART de la page
        //  (voir /api/selection/visite). Sans visite connue — la
        //  première —, aucune nouveauté n'est annoncée : tout serait
        //  « nouveau », ce qui ne veut rien dire.
        nouveautes: visite
          ? recentes.filter((photo) => photo.creeLe > visite).length
          : 0,
      });
    }

    return { photos: listePhotos, suivis: listeSuivis };
  } catch {
    //  Migrations pas encore passées, base injoignable : la page
    //  montre son état vide. Elle ne tombe jamais en erreur.
    return VIDE;
  }
}

/* ==================================================================
 * LA DERNIÈRE VISITE DE « MA SÉLECTION » (nº 243-§5)
 * ==================================================================
 * ⚠️ LE PIÈGE, ET IL EST DIT EN TOUTES LETTRES : écrire l'horodatage
 * À L'OUVERTURE effacerait les compteurs avant qu'ils n'aient été lus.
 * On LIT ici, au rendu de la page ; on n'ÉCRIT qu'au DÉPART, depuis le
 * navigateur (voir /api/selection/visite et `MemoireVisiteSelection`).
 *
 * Table `visites_selection` (migration nº 68) : une ligne par compte,
 * la page entière étant concernée. Absente — migration pas encore
 * passée —, on répond `null` : aucun compteur ne s'affiche, et rien
 * ne casse.
 */
export async function lireLaDerniereVisite(
  utilisateurId: string
): Promise<string | null> {
  try {
    const supabase = await creerClientSupabaseServeur();
    const { data } = await supabase
      .from("visites_selection")
      .select("vu_le")
      .eq("utilisateur_id", utilisateurId)
      .maybeSingle();
    return (data?.vu_le as string | undefined) ?? null;
  } catch {
    return null;
  }
}
