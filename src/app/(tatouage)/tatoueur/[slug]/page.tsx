import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { libelleStyle, renduConnu, TEXTES_TATOUAGE } from "@/config/tatouage";
import {
  ficheExistanteNonPubliee,
  lireFicheProprietaire,
  lireTatoueur,
  slugActuelDepuisAncien,
  styleConnu,
} from "@/lib/tatoueurs";
import { PageMessageSombre } from "@/components/PageMessageSombre";
import { ficheLue } from "@/lib/fiche-lue";
import { suitCeTatoueur } from "@/lib/favoris-serveur";
import { utilisateurDepuisCookies } from "@/lib/session-cookie";
import { adresseDuSite } from "@/lib/site";
import { adresseStructuree } from "@/lib/adresse";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { FicheTatoueur } from "@/components/FicheTatoueur";
import { JsonLd } from "@/components/JsonLd";
import { RetourFenetreFiche } from "@/components/RetourFenetreFiche";

/**
 * LA FICHE D'UN TATOUEUR — une page par tatoueur
 * ===============================================
 * Adresse : /tatoueur/<slug>  (ex. /tatoueur/atelier-corvus)
 *
 * Indexable : c'est LA page qui doit sortir quand on cherche le nom
 * d'un tatoueur. Slug inconnu → page introuvable, jamais une page
 * vide qui polluerait l'index des moteurs.
 */

// LA FICHE EST LUE UNE FOIS PAR REQUÊTE, même si les métadonnées, le
// corps de page ET le texte de l'image de partage la demandent tous
// les trois : ils appellent tous la même instance (lib/fiche-lue).
const charger = ficheLue;
/** La même prudence pour la lecture RÉSERVÉE AU PROPRIÉTAIRE (fiche
    pas encore publiée, ou fiche d'essai d'un administrateur). */
const chargerProprietaire = cache(lireFicheProprietaire);

/**
 * LA FICHE TELLE QUE CETTE REQUÊTE PEUT LA VOIR — une seule règle,
 * partagée par les métadonnées et par la page.
 * `privee` : elle n'est visible QUE de son propriétaire (fiche en
 * attente, ou fiche d'essai d'administrateur). Elle s'affiche pour
 * lui, et ne doit JAMAIS entrer dans un index.
 */
async function ficheVisible(slug: string): Promise<{
  tatoueur: Awaited<ReturnType<typeof lireTatoueur>>["tatoueur"];
  demonstration: boolean;
  privee: boolean;
}> {
  const { tatoueur, demonstration } = await charger(slug);
  if (tatoueur) return { tatoueur, demonstration, privee: false };
  const session = utilisateurDepuisCookies((await cookies()).getAll());
  if (!session?.id) return { tatoueur: null, demonstration: false, privee: false };
  const duProprietaire = await chargerProprietaire(slug, session.id);
  return {
    tatoueur: duProprietaire.tatoueur,
    demonstration: false,
    privee: duProprietaire.tatoueur !== null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { tatoueur, demonstration, privee } = await ficheVisible(slug);
  if (!tatoueur) {
    return { title: "Tatoueur introuvable", robots: { index: false, follow: false } };
  }

  const styles = tatoueur.styles.map(libelleStyle).join(", ");
  return {
    title: `${tatoueur.nom} — tatoueur à ${tatoueur.ville_nom}`,
    description:
      `${tatoueur.nom}, tatoueur à ${tatoueur.ville_nom}` +
      (styles ? ` — ${styles}.` : ".") +
      " Portfolio Instagram et styles pratiqués.",
    alternates: privee
      ? undefined
      : { canonical: `${adresseDuSite()}/tatoueur/${tatoueur.slug}` },
    // DEUX RAISONS DE NE PAS INDEXER, et une seule instruction :
    //  · MODE DÉMONSTRATION — ce tatoueur N'EXISTE PAS. La page reste
    //    affichée (elle sert à voir le site tourner), mais dix-huit
    //    faux tatoueurs indexés, adresses comprises, abîmeraient le
    //    site pour longtemps ;
    //  · FICHE PRIVÉE — pas encore publiée, ou fiche d'essai d'un
    //    administrateur : elle ne s'affiche que pour son propriétaire.
    robots:
      demonstration || privee ? { index: false, follow: false } : undefined,
  };
}

export default async function PageFicheTatoueur({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ style?: string; rendu?: string; studio?: string }>;
}) {
  const { slug } = await params;
  const { style, rendu, studio } = await searchParams;
  const { tatoueur, demonstration } = await ficheVisible(slug);

  // LE PROPRIÉTAIRE VOIT SA FICHE même pas encore publiée, et ses
  // fiches d'essai s'il est administrateur (les visiteurs, eux, ne
  // voient que les fiches publiées et non masquées) : c'est
  // `ficheVisible` qui tranche, une fois pour les métadonnées et pour
  // la page. AUCUN badge d'état ici : une fiche consultée depuis la
  // recherche ou une adresse publique est la même pour tout le monde
  // — l'état vit dans le menu « Mon espace » et dans le formulaire.
  //
  // UN VIEUX LIEN ? Les adresses portent la ville depuis la refonte
  // (maison-vermillon → maison-vermillon-lille). L'ancienne est
  // gardée en base : on redirige DÉFINITIVEMENT (301) vers la
  // nouvelle — un lien partagé il y a des mois continue de marcher,
  // et les moteurs de recherche transfèrent son ancienneté.
  if (!tatoueur) {
    const actuel = await slugActuelDepuisAncien(slug);
    if (actuel && actuel !== slug) {
      permanentRedirect(
        style ? `/tatoueur/${actuel}?style=${style}` : `/tatoueur/${actuel}`
      );
    }
  }
  //  ⚠️ UNE FICHE QUI EXISTE MAIS N'EST PAS EN LIGNE N'EST PAS UN 404
  //  (nº 176-§3). Le 404 dit « cette adresse n'existe pas » — et ce
  //  serait faux : la fiche est là, elle attend d'être publiée. On le
  //  dit donc, à la charte, avec le même retour à l'accueil.
  //  (La question est posée par la clé de service et ne rend qu'un oui
  //  ou un non : rien de la fiche ne sort de là.)
  if (!tatoueur && (await ficheExistanteNonPubliee(slug))) {
    return <PageMessageSombre titre="Cette fiche n'est pas encore en ligne." pleinEcran={false} />;
  }
  if (!tatoueur) notFound();

  const stylePrincipal = tatoueur.styles[0];

  //  SUIT-ON DÉJÀ CE TATOUEUR ? (nº 208-§1) — la question est posée
  //  ICI, côté serveur, qui a le cookie de session : le bouton naît
  //  donc dans le bon état, et ne se corrige plus sous les yeux. Une
  //  visite sans compte ne coûte aucune requête.
  const session = utilisateurDepuisCookies((await cookies()).getAll());
  const suiviAuDepart = session?.id
    ? await suitCeTatoueur(session.id, tatoueur.id)
    : false;

  return (
    <>
      {/* SMARTPHONE : pas de moteur dans la barre — sur une fiche, on
          regarde un portfolio, on ne cherche pas. Le web garde le sien
          (il RAMÈNE à l'accueil avec les critères). */}
      <EnTeteTatouage />
      {/* WEB : si cette page est un RECHARGEMENT d'une fiche qui était
          ouverte en fenêtre superposée, ce composant repart vers la
          grille et la fenêtre s'y rouvre — recherche et position
          retrouvées (voir GrilleTatoueurs). */}
      <RetourFenetreFiche slug={tatoueur.slug} />
      <FicheTatoueur
        studioCourant={studio ?? null}
        tatoueur={tatoueur}
        demonstration={demonstration}
        styleInitial={styleConnu(style)}
        renduInitial={renduConnu(rendu)}
        suiviAuDepart={suiviAuDepart}
      />
      {/* ⚠️ CE BLOC EST INVISIBLE, ET C'EST LE PLUS IMPORTANT DE LA
          PAGE POUR LE RÉFÉRENCEMENT LOCAL (passe nº 114). Il ne
          reprend PAS l'adresse affichée : celle-ci est volontairement
          courte (« Miami, FL, États-Unis »), tandis que les moteurs
          reçoivent ici la version COMPLÈTE — rue, code postal, ville,
          région en toutes lettres, code ISO du pays. Sans lui, un
          salon n'apparaît sur aucune carte, et c'est là que tout le
          monde cherche.

          LE TYPE SUIT LA NATURE DE LA FICHE : un salon et un studio
          sont des ÉTABLISSEMENTS (`TattooParlor`, un commerce que
          Google sait placer et ouvrir aux horaires) ; un artiste
          indépendant reste une PERSONNE. Déclarer un commerce là où
          il n'y en a pas serait faux, et Google le sanctionne. */}
      <JsonLd
        donnees={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          name: tatoueur.nom,
          description: TEXTES_TATOUAGE.descriptionSite,
          url: `${adresseDuSite()}/tatoueur/${tatoueur.slug}`,
          mainEntity: {
            "@type":
              tatoueur.type_fiche === "salon" ? "TattooParlor" : "Person",
            name: tatoueur.nom,
            ...(tatoueur.type_fiche === "salon"
              ? {}
              : { jobTitle: "Tatoueur" }),
            url: `${adresseDuSite()}/tatoueur/${tatoueur.slug}`,
            ...(tatoueur.photo_profil
              ? { image: `${adresseDuSite()}${tatoueur.photo_profil}` }
              : {}),
            //  L'ADRESSE COMPLÈTE, écrite par lib/adresse — la seule
            //  autorité du site en la matière.
            address: adresseStructuree({
              adresse: tatoueur.adresse,
              code_postal: tatoueur.code_postal,
              ville: tatoueur.ville_nom,
              region: tatoueur.region,
              pays: tatoueur.pays,
              code_pays: tatoueur.code_pays,
            }),
            //  LES COORDONNÉES EXACTES : c'est ce couple, et non le
            //  texte de l'adresse, qui pose l'épingle sur la carte.
            ...(Number.isFinite(tatoueur.latitude) &&
            Number.isFinite(tatoueur.longitude)
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: tatoueur.latitude,
                    longitude: tatoueur.longitude,
                  },
                }
              : {}),
            knowsAbout: tatoueur.styles.map(libelleStyle),
            // Les comptes officiels du tatoueur : ce sont eux, et non
            // notre fiche, qui font autorité aux yeux des moteurs.
            sameAs: [tatoueur.lien_instagram, tatoueur.lien_tiktok].filter(
              (lien): lien is string => Boolean(lien)
            ),
          },
        }}
      />
      {/* LE FIL D'ARIANE, version moteurs de recherche — INVISIBLE.
          ⚠️ La page elle-même n'affiche AUCUN fil d'Ariane (nº 200-§1) :
          on y arrive directement, il n'y a pas de chemin à remonter.
          Le chemin Accueil › Style › Nom ne se voit qu'à deux endroits :
          ici, pour les résultats de recherche, et dans le bandeau de la
          fenêtre superposée (FenetreFiche, nº 200-§2). */}
      <JsonLd
        donnees={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Accueil",
              item: adresseDuSite(),
            },
            ...(stylePrincipal
              ? [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: libelleStyle(stylePrincipal),
                    item: `${adresseDuSite()}/tatouage/${stylePrincipal}/${tatoueur.ville_slug}`,
                  },
                ]
              : []),
            {
              "@type": "ListItem",
              position: stylePrincipal ? 3 : 2,
              name: tatoueur.nom,
              item: `${adresseDuSite()}/tatoueur/${tatoueur.slug}`,
            },
          ],
        }}
      />
    </>
  );
}
