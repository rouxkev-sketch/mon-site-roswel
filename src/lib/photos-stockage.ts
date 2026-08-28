import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ██ LE MÉNAGE DU STOCKAGE — UNE SEULE ÉCRITURE (passe nº 692) ██
 * ==================================================================
 * CE QUE L'AUDIT nº 691 A TROUVÉ, et c'était sa correction nº 1 :
 * QUATRE FUITES, UNE SEULE CAUSE. Les nettoyages travaillaient sur les
 * NOMS DE FICHIERS — ils gardaient ceux qui « contiennent
 * l'identifiant du portfolio » — alors qu'un fichier s'appelle
 * `<compte>/<style>-<horodatage>-<rang>.jpg` : il ne porte JAMAIS cet
 * identifiant. Le filtre ne retenait donc rien, et pas une seule photo
 * n'était effacée :
 *   R1  ni à la purge des trente jours, ni à la suppression admin ;
 *   R3  ni quand un compte partait par l'écran des artisans ;
 *   R5  ni quand quelqu'un retirait une photo de son portfolio.
 *   R4  et là où un ménage avait lieu, `list()` s'arrêtait à cent.
 *
 * LE REMÈDE TIENT EN UNE PHRASE : on n'efface plus d'après des NOMS,
 * on efface d'après les ADRESSES QUE LA BASE CONNAÎT — les lignes de
 * `photos_tatoueur` et les colonnes d'adresse de la fiche. La base
 * sait exactement quels fichiers sont à elle ; le stockage, lui, ne
 * sait rien.
 *
 * ⚠️ D'OÙ L'ORDRE, QUI EST TOUT : ON LIT LES ADRESSES AVANT DE
 * SUPPRIMER LES LIGNES. Les lignes effacées d'abord, il ne reste plus
 * rien pour retrouver les fichiers — c'est la faute d'origine, dans
 * l'autre sens.
 *
 * ⚠️ ET LE MÉNAGE N'EMPÊCHE JAMAIS LA SUPPRESSION. Aucune fonction de
 * ce fichier ne lève : elles rendent un compte rendu (« effacés »,
 * « introuvables », « échecs »). Une photo qu'on n'arrive pas à
 * effacer est un fichier de trop ; une suppression qui échoue à cause
 * d'elle serait une personne qui ne peut pas partir.
 */

/** Le seau des photos du produit YokoFolio. */
export const BUCKET_PHOTOS = "photos-tatoueurs";

/** Le plafond du client Supabase pour `list()` — vérifié à l'audit
    nº 691 dans le paquet installé (`DEFAULT_SEARCH_OPTIONS.limit`).
    C'est LUI qu'on pagine : sans quoi un compte à plus de cent
    fichiers en garde la queue pour toujours (R4). */
const PLAFOND_LISTE = 100;

/** Combien de fichiers par appel à `remove`. Une liste de plusieurs
    milliers d'adresses dans une seule requête finit par être refusée ;
    par lots, jamais. */
const LOT_EFFACEMENT = 100;

export type CompteRenduDuMenage = {
  /** Les fichiers réellement retirés du stockage. */
  effaces: number;
  /** Les adresses connues de la base qui n'existaient plus. Ce n'est
      PAS une erreur : une photo déjà effacée est une photo effacée. */
  introuvables: number;
  /** Ce qui n'a pas pu être retiré, avec la raison. */
  echecs: Array<{ chemin: string; raison: string }>;
};

const VIDE: CompteRenduDuMenage = { effaces: 0, introuvables: 0, echecs: [] };

/**
 * L'ADRESSE PUBLIQUE → LE CHEMIN DANS LE SEAU.
 * Une adresse ressemble à
 *   https://<projet>.supabase.co/storage/v1/object/public/<seau>/<chemin>
 * et le chemin est tout ce qui suit le nom du seau.
 * ⚠️ TROIS FORMES EXISTENT (`public`, `sign`, `authenticated`) : on les
 * accepte toutes, parce qu'un jour une adresse signée pourrait être
 * écrite en base et qu'on ne veut pas d'un ménage qui l'ignore.
 * ⚠️ RIEN D'AUTRE NE PASSE : une adresse de démonstration
 * (`/images-demo/…`), une adresse d'un AUTRE seau, une chaîne vide
 * rendent `null`. On n'efface que ce qu'on a reconnu.
 */
export function cheminDansLeSeau(
  adresse: unknown,
  seau: string = BUCKET_PHOTOS
): string | null {
  if (typeof adresse !== "string" || !adresse) return null;
  const sansRequete = adresse.split("?")[0];
  const marque = "/storage/v1/object/";
  const depart = sansRequete.indexOf(marque);
  if (depart < 0) return null;
  let reste = sansRequete.slice(depart + marque.length);
  for (const prefixe of ["public/", "sign/", "authenticated/"]) {
    if (reste.startsWith(prefixe)) {
      reste = reste.slice(prefixe.length);
      break;
    }
  }
  if (!reste.startsWith(`${seau}/`)) return null;
  const chemin = reste.slice(seau.length + 1);
  //  Décodé : la base garde l'adresse telle que le stockage l'a
  //  rendue, et `remove` attend un chemin brut.
  try {
    return decodeURIComponent(chemin) || null;
  } catch {
    return chemin || null;
  }
}

/** Les chemins DISTINCTS d'un tas de valeurs quelconques — la même
    règle qu'au comptage des photos de la nº 688 : les colonnes se
    recouvrent (une photo de style EST souvent une photo de galerie),
    un `Set` est la seule façon de ne compter, et de n'effacer, chaque
    fichier qu'une fois. */
export function cheminsDistincts(
  valeurs: unknown[],
  seau: string = BUCKET_PHOTOS
): string[] {
  const chemins = new Set<string>();
  for (const valeur of valeurs) {
    const chemin = cheminDansLeSeau(valeur, seau);
    if (chemin) chemins.add(chemin);
  }
  return [...chemins];
}

/** Toutes les adresses portées par une LIGNE de fiche et par ses
    photos — étalées à plat, sans tri ni dédoublonnage (c'est
    `cheminsDistincts` qui s'en charge). */
function adressesDeLaFiche(
  fiche: Record<string, unknown> | null,
  photos: Array<Record<string, unknown>>
): unknown[] {
  const valeurs: unknown[] = [];
  if (fiche) {
    valeurs.push(fiche.photo_principale, fiche.photo_profil);
    const tableau = fiche.photos;
    if (Array.isArray(tableau)) valeurs.push(...tableau);
    const parStyle = fiche.photos_styles;
    if (parStyle && typeof parStyle === "object") {
      valeurs.push(...Object.values(parStyle as Record<string, unknown>));
    }
  }
  for (const photo of photos) valeurs.push(photo.url, photo.miniature);
  return valeurs;
}

/**
 * LES FICHIERS D'UN PORTFOLIO — À LIRE AVANT DE LE SUPPRIMER.
 *
 * ⚠️ ET LE GARDE-FOU QUI COMPTE : on RETIRE de la liste toute adresse
 * qu'un AUTRE portfolio du même compte emploie encore. Le cas est rare
 * — chaque envoi fabrique un fichier neuf, horodaté — mais une
 * suppression ne se rattrape pas, et le prix de la vérification est
 * une lecture. Sans elle, supprimer un portfolio pourrait crever la
 * photo d'un autre.
 * ⚠️ CE N'EST JAMAIS UN BALAYAGE DE DOSSIER : on n'efface que ce que
 * les lignes de CE portfolio nomment. Un fichier orphelin d'une
 * ancienne fuite ne sera pas ramassé ici — c'est le prix de ne jamais
 * effacer ce qu'on n'a pas reconnu.
 */
export async function fichiersDUnPortfolio(
  client: SupabaseClient,
  ficheId: string,
  seau: string = BUCKET_PHOTOS
): Promise<string[]> {
  //  ⚠️ `await` ET `try/catch`, PAS `.then().catch()` : le constructeur
  //  de requête de PostgREST est un `PromiseLike`, il n'a pas de
  //  `.catch`. Une lecture qui échoue rend une liste vide — on
  //  n'efface alors rien, ce qui est le bon côté de l'erreur.
  let ligne: Record<string, unknown> | null = null;
  let photos: Array<Record<string, unknown>> = [];
  try {
    const r = await client
      .from("tatoueurs")
      .select("user_id, photo_principale, photo_profil, photos, photos_styles")
      .eq("id", ficheId)
      .maybeSingle();
    if (!r.error) ligne = r.data as Record<string, unknown> | null;
  } catch {
    ligne = null;
  }
  try {
    const r = await client
      .from("photos_tatoueur")
      .select("url, miniature")
      .eq("tatoueur_id", ficheId);
    if (!r.error) photos = (r.data ?? []) as Array<Record<string, unknown>>;
  } catch {
    photos = [];
  }

  const aEffacer = new Set(cheminsDistincts(adressesDeLaFiche(ligne, photos), seau));
  if (aEffacer.size === 0) return [];

  const proprietaire = ligne?.user_id;
  if (typeof proprietaire !== "string" || !proprietaire) return [...aEffacer];

  //  CE QUE LES AUTRES PORTFOLIOS DE LA MÊME PERSONNE EMPLOIENT ENCORE.
  let autres: Array<Record<string, unknown>> = [];
  try {
    const r = await client
      .from("tatoueurs")
      .select("id, photo_principale, photo_profil, photos, photos_styles")
      .eq("user_id", proprietaire)
      .neq("id", ficheId);
    if (!r.error) autres = (r.data ?? []) as Array<Record<string, unknown>>;
  } catch {
    autres = [];
  }
  /*  ⚠️ ET ON REFILTRE ICI, APRÈS LA BASE — le banc l'a exigé, et il
      avait raison. Si le `neq` ci-dessus n'était pas honoré (une
      doublure, un jour une autre couche), la fiche qu'on supprime se
      retrouverait dans SES PROPRES « autres portfolios » : toutes ses
      adresses passeraient en « encore employées », et le ménage
      n'effacerait plus RIEN — en silence, exactement le défaut qu'on
      corrige. Une ligne de filtre coûte moins qu'une garantie
      empruntée à la base. */
  autres = autres.filter((f) => String(f.id) !== ficheId);
  if (autres.length === 0) return [...aEffacer];

  const identifiants = autres
    .map((f) => f.id)
    .filter((v): v is string => typeof v === "string");
  let photosDesAutres: Array<Record<string, unknown>> = [];
  if (identifiants.length > 0) {
    try {
      const r = await client
        .from("photos_tatoueur")
        .select("url, miniature")
        .in("tatoueur_id", identifiants);
      if (!r.error) photosDesAutres = (r.data ?? []) as Array<Record<string, unknown>>;
    } catch {
      photosDesAutres = [];
    }
  }

  const gardes = new Set(
    cheminsDistincts(
      [
        ...autres.flatMap((f) => adressesDeLaFiche(f, [])),
        ...photosDesAutres.flatMap((p) => [p.url, p.miniature]),
      ],
      seau
    )
  );
  return [...aEffacer].filter((chemin) => !gardes.has(chemin));
}

/**
 * EFFACER DES FICHIERS, par lots, sans jamais lever.
 * ⚠️ CE QUI N'EXISTE PLUS N'EST PAS UNE ERREUR : `remove` rend la
 * liste de ce qu'il a VRAIMENT retiré. La différence, c'est ce qui
 * n'était déjà plus là — on la compte à part, et on n'en fait pas un
 * incident (le ménage est peut-être passé deux fois, et c'est bien).
 */
export async function effacerDesFichiers(
  client: SupabaseClient,
  chemins: string[],
  seau: string = BUCKET_PHOTOS
): Promise<CompteRenduDuMenage> {
  if (chemins.length === 0) return { ...VIDE };
  const rendu: CompteRenduDuMenage = { effaces: 0, introuvables: 0, echecs: [] };
  for (let depart = 0; depart < chemins.length; depart += LOT_EFFACEMENT) {
    const lot = chemins.slice(depart, depart + LOT_EFFACEMENT);
    try {
      const { data, error } = await client.storage.from(seau).remove(lot);
      if (error) {
        for (const chemin of lot) rendu.echecs.push({ chemin, raison: error.message });
        continue;
      }
      const retires = Array.isArray(data) ? data.length : 0;
      rendu.effaces += retires;
      rendu.introuvables += Math.max(lot.length - retires, 0);
    } catch (erreur) {
      const raison = erreur instanceof Error ? erreur.message : String(erreur);
      for (const chemin of lot) rendu.echecs.push({ chemin, raison });
    }
  }
  return rendu;
}

/**
 * LE MÉNAGE D'UN PORTFOLIO — la fonction que les quatre chemins
 * appellent. Elle LIT, puis EFFACE. Elle ne touche à aucune ligne :
 * c'est l'appelant qui supprime, APRÈS.
 */
export async function nettoyerLeStockageDUnPortfolio(
  client: SupabaseClient,
  ficheId: string,
  seau: string = BUCKET_PHOTOS
): Promise<CompteRenduDuMenage> {
  try {
    const chemins = await fichiersDUnPortfolio(client, ficheId, seau);
    return await effacerDesFichiers(client, chemins, seau);
  } catch (erreur) {
    return {
      effaces: 0,
      introuvables: 0,
      echecs: [
        {
          chemin: `(portfolio ${ficheId})`,
          raison: erreur instanceof Error ? erreur.message : String(erreur),
        },
      ],
    };
  }
}

/**
 * TOUT UN DOSSIER DU STOCKAGE, AU-DELÀ DE CENT (R4).
 * ⚠️ POURQUOI UN BALAYAGE DE DOSSIER EST LÉGITIME ICI, ET NULLE PART
 * AILLEURS : on ne s'en sert que lorsque le COMPTE ENTIER s'en va. Le
 * dossier porte l'identifiant de la personne, tout ce qu'il contient
 * est à elle, et il n'y a plus personne pour en vouloir quoi que ce
 * soit. C'est aussi la seule occasion de ramasser les orphelins des
 * fuites d'avant cette passe.
 * ⚠️ ET IL DESCEND DANS LES SOUS-DOSSIERS : `list` rend les fichiers
 * d'un niveau, et les dossiers SANS identifiant. Un seul niveau
 * laisserait tout ce qui est rangé plus bas.
 */
export async function listerToutLeDossier(
  client: SupabaseClient,
  dossier: string,
  seau: string = BUCKET_PHOTOS
): Promise<string[]> {
  const trouves: string[] = [];
  for (let depart = 0; ; depart += PLAFOND_LISTE) {
    let lot: Array<{ name?: string; id?: string | null }> = [];
    try {
      const { data, error } = await client.storage
        .from(seau)
        .list(dossier, { limit: PLAFOND_LISTE, offset: depart });
      if (error) break;
      lot = (data ?? []) as Array<{ name?: string; id?: string | null }>;
    } catch {
      break;
    }
    if (lot.length === 0) break;
    for (const entree of lot) {
      if (!entree?.name) continue;
      const chemin = dossier ? `${dossier}/${entree.name}` : entree.name;
      //  Une entrée SANS identifiant est un dossier, pas un fichier.
      if (entree.id) trouves.push(chemin);
      else trouves.push(...(await listerToutLeDossier(client, chemin, seau)));
    }
    if (lot.length < PLAFOND_LISTE) break;
    //  Filet : un stockage qui ignorerait `offset` rendrait toujours la
    //  même page. Cinq cents pages, et l'on s'arrête.
    if (depart > PLAFOND_LISTE * 500) break;
  }
  return trouves;
}

/**
 * LE MÉNAGE D'UN COMPTE ENTIER — tout son dossier, paginé.
 * Employé par les purges de compte, et par elles seules.
 */
export async function nettoyerLeStockageDUnCompte(
  client: SupabaseClient,
  utilisateurId: string,
  seau: string = BUCKET_PHOTOS
): Promise<CompteRenduDuMenage> {
  try {
    const chemins = await listerToutLeDossier(client, utilisateurId, seau);
    return await effacerDesFichiers(client, chemins, seau);
  } catch (erreur) {
    return {
      effaces: 0,
      introuvables: 0,
      echecs: [
        {
          chemin: `(compte ${utilisateurId})`,
          raison: erreur instanceof Error ? erreur.message : String(erreur),
        },
      ],
    };
  }
}

/** Le compte rendu, dit en une ligne — pour le journal du serveur. */
export function direLeMenage(rendu: CompteRenduDuMenage): string {
  return (
    `${rendu.effaces} fichier(s) effacé(s)` +
    (rendu.introuvables > 0 ? `, ${rendu.introuvables} déjà absent(s)` : "") +
    (rendu.echecs.length > 0 ? `, ${rendu.echecs.length} en échec` : "")
  );
}
