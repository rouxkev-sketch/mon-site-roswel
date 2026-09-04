import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { natureConnue } from "@/lib/photos-tatoueur";
import { modesActifs, type ModeExerciceFiche } from "@/lib/modes-exercice";
//  §1 (nº 694) — la règle « en ligne » du site entier, posée sur une
//  lecture. Une seule écriture (voir sa note dans lib/artists).
import { listeEnLigne } from "@/lib/tatoueurs";

/**
 * CE QUE LA PAGE « MES FAVORIS » LIT — côté serveur
 * ==================================================
 * TROIS LECTURES SIMPLES, ET PAS UNE JOINTURE IMBRIQUÉE. C'est la
 * règle de la maison (voir `garnirFiches` dans lib/artists) et elle
 * a ici une deuxième raison : `favoris_photos` et `photos_tatoueur`
 * n'ont pas les mêmes politiques de lecture. Une imbriquée mélangerait
 * les deux dans une seule requête, et le moindre changement de
 * politique la ferait taire sans un mot. Trois lectures se lisent, se
 * mesurent et se réparent une par une.
 *
 * ⚠️ ON N'AFFICHE QUE CE QUI EST ENCORE EN LIGNE. Une fiche retirée du
 * site (hors ligne, suppression en cours, modération) disparaît des
 * favoris tant qu'elle n'est pas revenue — et REVIENT d'elle-même le
 * jour où elle est republiée : la ligne de favori, elle, n'a jamais
 * bougé. C'est exactement ce qu'on veut : ne rien perdre, ne rien
 * montrer qui ne soit pas public.
 * ⚠️ ET CETTE PHRASE ÉTAIT UNE INTENTION, PAS UN FAIT, jusqu'à la
 * nº 694 : la lecture ne filtrait que `publie`, si bien qu'une
 * SUPPRESSION EN COURS — qui ne touche pas à `publie` — laissait la
 * fiche ici pendant trente jours. Trois des quatre cas cités ci-dessus
 * n'étaient donc pas tenus. Ils le sont : voir le §1 (nº 694) sur la
 * lecture des fiches, plus bas.
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
  /** SON PORTFOLIO — ce que la bande compose (nº 638) et ce que le
      compte de nouveautés dénombre (§5).
      ⚠️ LE NOM RESTE, LE CONTENU A CHANGÉ (nº 639) : ce ne sont plus
      « les plus récentes » mais LE PORTFOLIO ENTIER de cet artiste,
      dans L'ORDRE DE L'ARTISTE. La date ne choisit plus rien — c'est
      tout le point de la nº 639. Le nom est conservé pour ne pas
      éparpiller un renommage dans trois fichiers ; sa note fait foi. */
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
 * ██ §1 (nº 639) — UN QUOTA PAR PORTFOLIO, PLUS UN PLAFOND GLOBAL ██
 * ==================================================================
 * CE QUI EST ANNULÉ : `PUBLICATIONS_LUES = 400`, qui demandait LES 400
 * PHOTOS LES PLUS RÉCENTES, tous suivis confondus. Deux défauts, et le
 * second vidait la nº 638 de son sens :
 *  · un tatoueur très actif mangeait la part des autres, qui n'avaient
 *    alors AUCUNE bande (relevé nº 637) ;
 *  · la coupe se faisait SUR LA DATE, donc AVANT le tri par favoris :
 *    une photo ancienne et très aimée n'arrivait jamais jusqu'au tri.
 *
 * ██ POURQUOI ON NE DEMANDE PAS « LES 25 PLUS AIMÉES » ██
 * Parce que la base ne peut pas les trier. Les favoris ne sont PAS dans
 * `photos_tatoueur` : ils vivent dans la vue `coeurs_par_photo`, une
 * table à part, clée par photo. Trier une lecture sur une colonne d'une
 * autre table demanderait une jointure — donc une fonction en base,
 * donc une migration, que cette passe s'interdit. La seule façon
 * honnête de ne perdre AUCUNE photo aimée est donc de ne pas choisir du
 * tout : ON LIT LE PORTFOLIO ENTIER.
 *
 * ██ CE NOMBRE N'EST DONC PAS UN CHOIX, C'EST UN FILET ██
 * DEUX CENTS, et il ne sert qu'à deux choses : empêcher un portfolio
 * pathologique de rapatrier des milliers de lignes, et ne pas dépendre
 * du plafond de mille que la base applique en silence quand on ne dit
 * rien. Un portfolio réel en compte SOIXANTE À CENT SOIXANTE (trois à
 * huit galeries, vingt photos au plus chacune — `PLAFOND_GALERIE`) :
 * deux cents couvre DIX galeries pleines, et n'est donc jamais atteint.
 * ⚠️ ET SI JAMAIS IL L'ÉTAIT, LA COUPE NE SE FAIT PAS SUR LA DATE : la
 * lecture est rangée par L'ORDRE DE L'ARTISTE (`ordre`), qui numérote
 * les photos DANS chaque galerie. Toutes les galeries donnent donc leur
 * première photo avant qu'aucune ne donne sa deuxième : ce qui tombe,
 * ce sont les fonds de galerie, uniformément, et jamais un artiste
 * entier.
 */
const PHOTOS_PAR_PORTFOLIO = 200;

/**
 * ██ §1 (nº 639) — LA LECTURE DE TROP QU'ON PRÉFÈRE, ET POURQUOI ██
 * ==================================================================
 * UNE REQUÊTE PAR PORTFOLIO SUIVI, TOUTES LANCÉES ENSEMBLE. C'est la
 * voie que le propriétaire a retenue à la nº 639, et elle est la seule
 * qui GARANTISSE le quota : avec une lecture commune, si large
 * soit-elle, il reste toujours un corpus assez gros pour qu'un dernier
 * suivi tombe en dehors. Avec une requête chacun, personne ne peut plus
 * être privé de bande par la faute d'un autre — c'est vrai par
 * construction, pas par calibrage.
 * ⚠️ CE QUE ÇA COÛTE, ET IL FAUT LE DIRE : le nombre d'ALLERS-RETOURS
 * suit le nombre de suivis. Ils partent tous en même temps (`Promise.all`),
 * donc l'attente reste celle du plus lent — mais la base, elle, en voit
 * N. À l'échelle du site (quelques dizaines de suivis au plus), c'est
 * le bon échange ; au-delà de la centaine, il faudra la fonction en
 * base que cette passe a refusée.
 * ⚠️ UNE FICHE QUI ÉCHOUE NE FAIT PERDRE QUE SA BANDE : chaque lecture
 * est avalée séparément, les autres arrivent quand même.
 * ⚠️ ET L'ORDRE EST TOTALEMENT DÉTERMINÉ : `ordre` puis `id`. Sans le
 * second, deux photos de même rang seraient rendues dans un ordre que
 * la base ne promet pas — et la bande pourrait changer sans raison
 * d'une visite à l'autre.
 */

/**
 * ██ §1 (nº 639) — LES FAVORIS : LA VUE ENTIÈRE, PAS UNE LISTE D'ID ██
 * ==================================================================
 * C'est la leçon de la nº 634, et elle devient obligatoire ici. La
 * lecture d'avant demandait les favoris `.in("photo_id", …)` avec la
 * liste des photos rapatriées. Elle tenait tant que cette liste faisait
 * quatre cents lignes ; elle en fait maintenant plusieurs milliers, et
 * PostgREST met cette liste DANS L'ADRESSE de la requête — quarante
 * octets par identifiant. On aurait dépassé la longueur qu'un serveur
 * accepte, la lecture aurait échoué EN SILENCE (l'erreur est avalée),
 * tous les favoris seraient tombés à zéro, et le tri de la nº 638
 * n'aurait plus rien trié.
 * ON DEMANDE DONC LA VUE TELLE QUELLE : une adresse courte, une seule
 * lecture, et un plafond écrit. Elle ne porte que les photos AIMÉES —
 * une photo sans cœur n'y a pas de ligne —, donc elle est bien plus
 * petite que la table des photos. Ce qui en revient et ne nous concerne
 * pas n'est jamais consulté : on ne l'interroge que par les
 * identifiants qu'on a déjà en main.
 */
const LIGNES_DE_COEURS = 50000;

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

    /*  TOUTES LES FICHES CONCERNÉES — celles des photos ET celles
        qu'on suit, en UNE lecture.
        ██ §1 (nº 694) — « EN LIGNE », PAS « PUBLIÉE » ██
        ------------------------------------------------------------------
        CE QUE L'AUDIT nº 691 A TROUVÉ (R2, rouge, prouvé au banc) :
        cette lecture filtrait `publie` TOUT SEUL. Or une suppression
        différée — d'un portfolio, ou d'un compte entier — n'écrit que
        `supprime_le` et NE TOUCHE PAS à `publie` : c'est ce qui permet
        de tout rendre plus tard exactement comme c'était. Pendant les
        trente jours, le portfolio disparaissait donc du public
        (`estEnLigne`, la règle de partout ailleurs) et RESTAIT ICI —
        carte, photo, et un lien qui menait à « Ce portfolio n'est pas
        encore en ligne ». Un message faux, en plus d'un lien mort.
        LA MÊME RÈGLE PARTOUT, DÉSORMAIS : `listeEnLigne` demande les
        quatre colonnes d'`estEnLigne` et filtre avec elle (voir sa note
        dans lib/artists).
        ⚠️ RIEN N'EST EFFACÉ, ET C'EST TOUT LE POINT : le favori et le
        suivi RESTENT en base. Ils sont MASQUÉS le temps de la
        suppression différée, et REVIENNENT si elle est annulée — la
        cascade, elle, ne joue qu'à la purge (V3 de l'audit). */
    const idsFiches = [
      ...new Set([...brutes.map((p) => p.tatoueur_id), ...idsSuivis]),
    ];
    const lignesFiches =
      idsFiches.length > 0
        ? await listeEnLigne<LigneFiche>((verrous) =>
            supabase
              .from("tatoueurs")
              .select(
                "id, nom, slug, ville_nom, region, pays, code_pays, photo_profil, " +
                  //  LE BADGE DE LA CARTE (passe nº 142) — les deux
                  //  colonnes que `libelleTypeFiche` croise.
                  "type_fiche, etablissement, " +
                  verrous
              )
              .in("id", idsFiches)
          )
        : [];

    const parFiche = new Map<string, LigneFiche>();
    for (const ligne of lignesFiches) parFiche.set(ligne.id, ligne);

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
        //  LES MÊMES REPLIS QUE `normaliser` dans lib/artists : une
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
        · LE PORTFOLIO de chacune — la bande de vignettes (nº 638) et le
          compte de nouveautés depuis la dernière visite.
       ⚠️ JAMAIS UNE LECTURE IMBRIQUÉE : la règle de la maison, rappelée
       en tête de ce fichier. Elles sont désormais PLUS DE TROIS — une
       par portfolio suivi (nº 639) —, mais chacune reste simple, et
       elles partent toutes ensemble. */
    const suivisPresents = idsSuivis.filter((id) => parFiche.has(id));
    const [lignesModes, lignesRecentes, visite] = await Promise.all([
      suivisPresents.length > 0
        ? supabase.from("modes_exercice").select("*").in("tatoueur_id", suivisPresents)
        : Promise.resolve({ data: [], error: null }),
      //  ██ §1 (nº 639) — UNE LECTURE PAR PORTFOLIO, TOUTES ENSEMBLE ██
      //  Voir la note de `PHOTOS_PAR_PORTFOLIO`, plus haut : c'est la
      //  seule forme qui GARANTISSE le quota, et la coupe éventuelle se
      //  fait sur l'ordre de l'artiste, jamais sur la date.
      Promise.all(
        suivisPresents.map((id) =>
          supabase
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
              //  `garnirFiches` (lib/artists) — mais celle-ci NE LA
              //  DEMANDAIT MÊME PAS : la bande de « Ma sélection »
              //  montrait donc les photos en attente à tous ceux qui
              //  suivent l'artiste. Relevé nº 637, fermé à la nº 638.
              //  ⚠️ ELLE EST FILTRÉE EN TYPESCRIPT, PAS ICI, et c'est
              //  délibéré (nº 639) : sans la migration la colonne
              //  n'existe pas, et un filtre serveur ferait échouer la
              //  lecture ENTIÈRE au lieu de ne rien filtrer.
              "id, tatoueur_id, style, rendu, nature, url, miniature, cree_le, ordre, en_attente"
            )
            .eq("tatoueur_id", id)
            .order("ordre", { ascending: true })
            .order("id", { ascending: true })
            .limit(PHOTOS_PAR_PORTFOLIO)
        )
      ),
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
    /*  §1 (nº 639) — LES N LECTURES SONT REMISES BOUT À BOUT ICI. Une
        fiche dont la lecture a échoué ne fait perdre QUE sa bande : les
        autres arrivent quand même. */
    const lignesBrutes: LigneRecente[] = [];
    for (const lecture of lignesRecentes) {
      if (lecture.error) continue;
      lignesBrutes.push(...((lecture.data ?? []) as unknown as LigneRecente[]));
    }
    const jaimeParPhoto = new Map<string, number>();
    if (lignesBrutes.length > 0) {
      //  §1 (nº 639) — LA VUE ENTIÈRE, ET NON PLUS UNE LISTE
      //  D'IDENTIFIANTS : voir la note de `LIGNES_DE_COEURS`, plus haut.
      const comptes = await supabase
        .from("coeurs_par_photo")
        .select("photo_id, coeurs")
        .limit(LIGNES_DE_COEURS);
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
      //  (lib/artists) : STRICTEMENT `=== true`, jamais « faux ou
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
