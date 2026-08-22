import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { COULEURS_SOMBRE, MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";

/**
 * LES IMAGES DE PARTAGE — ce qu'on voit dans une conversation
 * ============================================================
 * Quand un lien de yokofolio part sur WhatsApp, Instagram, Messenger
 * ou X, le réseau affiche un APERÇU. Sans image, c'est un rectangle
 * vide — pour un site dont le produit EST l'image, c'est le pire
 * endroit où être discret.
 *
 * CE FICHIER TIENT TOUT CE QUI EST COMMUN aux trois images du site
 * (l'accueil, une fiche, une page style + ville) : le format, les
 * couleurs, la signature, et les deux compositions de repli. Les
 * routes `opengraph-image.tsx` n'ont plus qu'à décrire LEUR image.
 *
 * LE FORMAT : 1200 × 630 pixels, PNG.
 *  · c'est la taille que Facebook, WhatsApp, LinkedIn et Messenger
 *    attendent, et celle dans laquelle X découpe sa grande carte
 *    (`summary_large_image`) ;
 *  · en dessous de 600 × 315, WhatsApp retombe sur la petite vignette
 *    carrée — l'image est alors presque invisible ;
 *  · le rapport 1,91:1 est celui de la carte des réseaux : à cette
 *    taille, rien n'est rogné nulle part ;
 *  · le poids reste très loin des plafonds (8 Mo pour Open Graph,
 *    5 Mo pour X).
 *
 * LA RÈGLE DE COMPOSITION : ces images sont vues PETITES, dans une
 * liste de conversations. Donc de grandes lettres, très peu de mots,
 * un contraste franc, et la photo qui occupe le maximum de place.
 */

export const TAILLE_PARTAGE = { width: 1200, height: 630 };
export const TYPE_PARTAGE = "image/png";

/** La largeur de la colonne PHOTO : un 4:5 à pleine hauteur, donc
    630 × 0,8. La photo n'est ainsi JAMAIS recadrée. */
export const LARGEUR_PHOTO = Math.round(TAILLE_PARTAGE.height * 0.8);

//  §4 (nº 466) — le rose ravivé se lit AU JETON de la charte tatouage,
//  plus jamais en dur : les images de partage suivent la marque.
export const ROSE = COULEURS_SOMBRE.primaire;
export const FOND = COULEURS_SOMBRE.fond;
export const TEXTE = COULEURS_SOMBRE.texte;
export const TEXTE_DOUX = COULEURS_SOMBRE.texteDoux;

/**
 * COMBIEN DE TEMPS UNE IMAGE DE PARTAGE RESTE VALABLE.
 * ====================================================
 * ⚠️ C'est LA réponse à « une fiche partagée dix fois ne doit pas
 * produire dix images ».
 *
 * `s-maxage=86400` : le cache qui sert le site (celui de l'hébergeur,
 * puis ceux de WhatsApp et de Facebook, qui gardent eux aussi les
 * aperçus) rend les MÊMES octets pendant 24 h. Dix partages, une seule
 * fabrication.
 *
 * `stale-while-revalidate=604800` : passé ce délai, l'ancienne image
 * part quand même TOUT DE SUITE, et la nouvelle se fabrique en
 * arrière-plan. Personne n'attend jamais un aperçu.
 *
 * Et surtout PAS `immutable` : un tatoueur change de photo, de nom ou
 * de ville — son aperçu doit suivre. Une journée de décalage est le
 * bon compromis ; une image figée pour toujours n'en serait pas un.
 */
export const CACHE_PARTAGE =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

/** LES FORMATS QUE LE GÉNÉRATEUR SAIT DESSINER. Tout le reste (webp,
    avif…) partirait en erreur AU MILIEU du rendu, là où le `try` ne
    rattrape plus rien : on refuse donc avant, et on prend le repli. */
const FORMATS_ACCEPTES = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];

/**
 * UNE IMAGE, RAPATRIÉE ET EMBARQUÉE dans le dessin.
 * Le générateur ne sait pas aller chercher une adresse relative : on
 * la complète, on télécharge les octets, et on les lui donne en clair.
 * Null au moindre problème (adresse morte, réseau, format refusé) —
 * l'appelant a toujours un repli, et une image de partage ne doit
 * JAMAIS faire échouer une page.
 */
export async function imageEmbarquee(
  adresse: string | null | undefined
): Promise<string | null> {
  if (!adresse) return null;
  try {
    const complete = adresse.startsWith("http")
      ? adresse
      : `${adresseDuSite()}${adresse}`;
    const reponse = await fetch(complete);
    if (!reponse.ok) return null;
    const type = (reponse.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!FORMATS_ACCEPTES.includes(type)) return null;
    const octets = Buffer.from(await reponse.arrayBuffer());
    // Une image de partage qui pèse plus que la page qu'elle annonce
    // n'a pas de sens : au-delà de 4 Mo, on préfère le repli.
    if (octets.byteLength > 4_000_000) return null;
    return `data:${type};base64,${octets.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * LE LOGO DÉPOSÉ PAR LE PROPRIÉTAIRE — lu sur le disque, tel quel.
 * ⚠️ Le code ne le fabrique pas, ne le recadre pas, n'en invente
 * aucune variante. S'il n'est pas dans `public/` (il est recopié à la
 * main à chaque livraison), on rend null, et la signature s'écrit
 * alors EN TOUTES LETTRES — c'est le NOM de la marque, pas une
 * reconstitution de son dessin.
 */
export async function logoDeMarque(): Promise<string | null> {
  try {
    const octets = await readFile(
      join(process.cwd(), "public", "yokofolio-logo.png")
    );
    return `data:image/png;base64,${octets.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Couper proprement : mieux vaut un mot en moins qu'une ligne de
    trop sur une image qu'on regarde en petit. */
export function coupe(texte: string, maximum: number): string {
  const propre = (texte ?? "").trim();
  return propre.length <= maximum ? propre : `${propre.slice(0, maximum - 1)}…`;
}

/**
 * LA SIGNATURE — le logo s'il est là, le nom sinon. Discrète : elle
 * dit d'où vient le lien, elle ne prend pas la vedette.
 */
export function Signature({
  logo,
  taille = 34,
}: {
  logo: string | null;
  taille?: number;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt="" height={taille} style={{ height: taille }} />
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: ROSE,
        }}
      />
      <div
        style={{
          fontSize: taille,
          fontWeight: 700,
          color: TEXTE,
          letterSpacing: -0.5,
        }}
      >
        {MARQUE_YOKOFOLIO.nom}
      </div>
    </div>
  );
}

/**
 * LA PASTILLE DE STYLE — « Blackwork », en rose, cerclée.
 * C'est le seul mot de couleur de l'image : il dit d'un coup d'œil de
 * quel tatouage on parle, sans jamais concurrencer le nom.
 */
export function Pastille({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "flex-start",
        padding: "9px 22px",
        borderRadius: 999,
        border: `2px solid ${ROSE}`,
        color: ROSE,
        fontSize: 26,
        fontWeight: 600,
        letterSpacing: 0.4,
      }}
    >
      {children}
    </div>
  );
}

/**
 * L'IMAGE DE MARQUE — l'accueil, les pages fixes, et LE REPLI de tout
 * le reste (fiche sans photo, mode démonstration, fiche masquée).
 * Fond anthracite, une lueur rose très basse, la promesse en grand, la
 * signature dessous. Aucune donnée à lire : elle ne coûte rien.
 */
export function CompositionMarque({
  logo,
  titre,
  sousTitre,
  largeurTitre = 900,
}: {
  logo: string | null;
  titre: string;
  sousTitre?: string;
  /** LA LARGEUR OÙ LE TITRE PEUT S'ÉCRIRE. 900 par défaut : la promesse
      de l'accueil se coupe alors en deux lignes équilibrées. Une phrase
      plus courte (« Tatoueurs blackwork à Lyon 1er ») demande toute la
      largeur utile, sinon ses deux derniers caractères tombent seuls
      sur une deuxième ligne. */
  largeurTitre?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 72,
        background: FOND,
        // La lueur rose part du bas gauche : elle réchauffe l'aplat
        // sans jamais passer derrière le texte.
        backgroundImage: `radial-gradient(circle at 8% 108%, ${ROSE}38 0%, ${ROSE}00 46%)`,
      }}
    >
      <Signature logo={logo} taille={44} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            width: 76,
            height: 5,
            borderRadius: 999,
            background: ROSE,
            marginBottom: 30,
          }}
        />
        <div
          style={{
            fontSize: 66,
            fontWeight: 700,
            color: TEXTE,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            maxWidth: largeurTitre,
          }}
        >
          {titre}
        </div>
        {sousTitre && (
          <div
            style={{
              marginTop: 22,
              fontSize: 32,
              color: TEXTE_DOUX,
              // Toute la largeur utile (1200 − 2 × 72) : le sous-titre
              // tient ainsi sur UNE ligne, sans mot orphelin en dessous.
              maxWidth: 1056,
            }}
          >
            {sousTitre}
          </div>
        )}
      </div>
    </div>
  );
}
