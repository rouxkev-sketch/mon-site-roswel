import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { libelleStyle, renduConnu } from "@/config/tatouage";
import { natureCherchee, styleConnu } from "@/lib/tatoueurs";
import { ficheLue } from "@/lib/fiche-lue";
import { adresseDuSite } from "@/lib/site";
import { NATURE_PAR_DEFAUT } from "@/lib/photos-tatoueur";
import { CompteurConsultation } from "@/components/CompteurConsultation";
import { FenetreCarrousel } from "@/components/FenetreCarrousel";
//  §2 (nº 335) — c'est le serveur qui décide, d'après l'adresse et
//  l'appareil : voir plus bas, et lib/appareil-serveur.
import { ecranTactileServeur } from "@/lib/appareil-serveur";

/**
 * ██ LA FENÊTRE DE CARROUSEL, EN PAGE À PART ENTIÈRE (nº 284) ██
 * ==================================================================
 * Adresse : /tatoueur/<slug>/carrousel?style=…&nature=…&rendu=…&photo=N
 *
 * POURQUOI CETTE PAGE EXISTE. Sur smartphone, la fiche ouvre la
 * fenêtre de carrousel PAR-DESSUS elle (un pushState vers CETTE
 * adresse — voir FicheTatoueur). ON PARTAGE LA FENÊTRE ELLE-MÊME :
 * son adresse doit donc être une vraie page, servie par le serveur,
 * qui ouvre la fenêtre chez quelqu'un qui n'a jamais vu la fiche.
 * `photo=N` : elle s'ouvre sur LA PHOTO TOUCHÉE, jamais sur la
 * première.
 *
 * CE QUE CETTE PAGE NE REND PAS : le menu fixe du site (EnTeteTatouage)
 * — la fenêtre vit sans lui, c'est sa définition. Sa flèche est un
 * lien vers LA FICHE, sur ce carrousel (il n'y a aucune page dessous
 * à retrouver). Sur un écran non tactile, la fenêtre n'existe pas :
 * le composant repart vers la fiche (`location.replace`) — la version
 * web ne change en rien.
 *
 * L'IMAGE D'APERÇU est celle de la nº 281 : la route
 * `/tatoueur/<slug>/partage` avec les mêmes tags — la première photo
 * du carrousel partagé. Une seule composition, aucun doublon.
 *
 * ⚠️ JAMAIS INDEXÉE : c'est une PRÉSENTATION de la fiche, pas une
 * page de plus — l'adresse canonique reste celle de la fiche, et les
 * moteurs n'ont rien à faire ici (`noindex, follow`).
 */

/** Un paramètre d'adresse, réduit à sa première valeur. */
const seul = (valeur: string | string[] | undefined): string =>
  Array.isArray(valeur) ? (valeur[0] ?? "") : (valeur ?? "");

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { tatoueur, demonstration } = await ficheLue(slug);
  if (!tatoueur) {
    return {
      title: "Tatoueur introuvable",
      robots: { index: false, follow: false },
    };
  }
  const criteres = await searchParams;
  const style = styleConnu(seul(criteres.style));
  const nature = natureCherchee(seul(criteres.nature));
  const rendu = renduConnu(seul(criteres.rendu));
  //  §2 (nº 281) — LA MÊME IMAGE QUE LE LIEN DE FICHE : la route
  //  `/partage`, avec les tags de l'adresse. Sans tag, elle rend
  //  l'aperçu de la fiche — jamais d'image vide, jamais d'erreur.
  const tags = new URLSearchParams();
  if (style) tags.set("style", style);
  if (nature) tags.set("nature", nature);
  if (rendu) tags.set("rendu", rendu);
  const image = {
    images: [
      {
        url:
          `${adresseDuSite()}/tatoueur/${tatoueur.slug}/partage` +
          (tags.toString() ? `?${tags.toString()}` : ""),
        width: 1200,
        height: 630,
        alt:
          `Portfolio de ${tatoueur.nom} à ${tatoueur.ville_nom}` +
          (style ? ` — ${libelleStyle(style)}` : "") +
          " · yokofolio",
      },
    ],
  };
  return {
    title:
      `Portfolio de ${tatoueur.nom}` +
      (style ? ` — ${libelleStyle(style)}` : ""),
    description:
      `${tatoueur.nom}, tatoueur à ${tatoueur.ville_nom} — le portfolio` +
      (style ? ` ${libelleStyle(style)}` : "") +
      " sur yokofolio.",
    openGraph: image,
    twitter: image,
    alternates: {
      canonical: `${adresseDuSite()}/tatoueur/${tatoueur.slug}`,
    },
    robots: { index: false, follow: !demonstration },
  };
}

export default async function PageFenetreCarrousel({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const criteres = await searchParams;
  const style = styleConnu(seul(criteres.style));
  const nature = natureCherchee(seul(criteres.nature));
  const rendu = renduConnu(seul(criteres.rendu));
  const photo = Math.max(0, Math.floor(Number(seul(criteres.photo))) || 0);

  /** La fiche, sur ce carrousel — la destination de tous les replis.
      ⚠️ Le type `never` n'est pas décoratif : il dit au compilateur que
      cet appel ne rend jamais la main (`redirect` jette), et c'est ce
      qui permet à la suite de savoir que la fiche existe. */
  const versLaFiche: () => never = () => {
    const tags = new URLSearchParams();
    if (style) tags.set("style", style);
    if (nature) tags.set("nature", nature);
    if (rendu) tags.set("rendu", rendu);
    redirect(`/tatoueur/${slug}${tags.toString() ? `?${tags.toString()}` : ""}`);
  };

  /**
   * §2 (nº 335) — C'EST LE SERVEUR QUI DÉCIDE, ET IL SERT DIRECTEMENT
   * LA FENÊTRE.
   * ==================================================================
   * CE QUI ÉTAIT ÉCRIT, ET CE QUE LE PROPRIÉTAIRE VOYAIT. Le repli vers
   * la fiche — « sur un écran non tactile, la fenêtre n'existe pas »
   * (nº 284) — était décidé DANS LE NAVIGATEUR, par un effet de
   * `FenetreCarrousel`. Un effet s'exécute APRÈS le premier affichage :
   * il y avait donc forcément une image, puis une autre. Et comme la
   * fiche, en arrivant, relit les tags de l'adresse et ROUVRE la
   * fenêtre par-dessus, cela donnait exactement le relevé du
   * propriétaire : « j'ouvre le lien de partage, je vois la fiche
   * environ une seconde, puis la photo partagée ». La pire première
   * image possible pour quelqu'un qui arrive d'Instagram.
   *
   * LA DÉCISION EST DONC PRISE ICI, AVANT QUE LE HTML NE PARTE. Un
   * écran tactile reçoit LA FENÊTRE, directement, du premier octet ;
   * un écran de bureau reçoit une REDIRECTION vers la fiche, et son
   * navigateur n'a jamais rien peint d'autre. Dans les deux cas, plus
   * aucune image intermédiaire — il n'y a plus deux pages, il y en a
   * une.
   * ⚠️ LA VERSION WEB NE CHANGE TOUJOURS PAS (acquis nº 284) : elle
   * atterrit sur la fiche, comme avant. Ce qui change, c'est QUAND on
   * le décide, pas ce qu'on décide.
   * (Ce que le serveur sait de l'appareil, et ce qu'il n'en sait pas :
   * lib/appareil-serveur.)
   */
  if (!(await ecranTactileServeur())) versLaFiche();

  const { tatoueur } = await ficheLue(slug);
  //  FICHE INVISIBLE D'ICI (partie, pas encore publiée, vieux slug) :
  //  la page de fiche connaît TOUS ces cas — anciens slugs, lecture
  //  du propriétaire, « pas encore en ligne », 404. On ne les réécrit
  //  pas : on lui passe la main, avec les tags du carrousel.
  if (!tatoueur) versLaFiche();

  //  LA SÉRIE DEMANDÉE — la règle de la page de fiche (nº 272-§4) : un
  //  style sans catégorie vaut « Réalisations » ; aucune indication du
  //  tout, et la fenêtre ouvrira l'ensemble de la première photo
  //  (nº 278-§2 — c'est le composant qui le résout, comme la fiche).
  const serie =
    nature || style ? { nature: nature || NATURE_PAR_DEFAUT, rendu } : null;

  return (
    <main>
      {/* UN LIEN PARTAGÉ QU'ON OUVRE, C'EST UNE CONSULTATION — la même
          règle que la page de fiche (nº 220-§1) ; la base dédoublonne
          par visiteur, par fiche et par jour. */}
      <CompteurConsultation slug={tatoueur.slug} />
      <FenetreCarrousel
        tatoueur={tatoueur}
        style={style}
        serie={serie}
        photoInitiale={photo}
      />
    </main>
  );
}
