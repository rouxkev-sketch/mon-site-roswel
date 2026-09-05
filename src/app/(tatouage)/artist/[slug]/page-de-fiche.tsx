import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { libelleStyle, TEXTES_TATOUAGE } from "@/config/tatouage";
import {
  estEnLigne,
  ficheExistanteNonPubliee,
  slugActuelDepuisAncien,
} from "@/lib/tatoueurs";
import { creerClientSupabaseAnonyme } from "@/lib/supabase/server";
import { PageMessageSombre } from "@/components/PageMessageSombre";
import { ficheLue } from "@/lib/fiche-lue";
import { adresseDuSite } from "@/lib/site";
import { adresseStructuree } from "@/lib/adresse";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { FicheSelonLAdresse } from "@/components/FicheSelonLAdresse";
import { PontApercuFiche } from "@/components/PontApercuFiche";
import { JsonLd } from "@/components/JsonLd";
import { RetourFenetreFiche } from "@/components/RetourFenetreFiche";
import { CompteurConsultation } from "@/components/CompteurConsultation";
import {
  cheminDeFiche,
  LIBELLES_DES_VUES,
  type VueDeFiche,
} from "@/lib/lien-interne";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * ██ LES TROIS PAGES D'UN PORTFOLIO — UNE SEULE ÉCRITURE (nº 873-§1) ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE : le profil, le portfolio et les flashs d'un
 * artiste sont TROIS PAGES, à trois adresses — web comme doigt :
 *  · /artist/<nom>            → le PROFIL (l'en-tête et les infos) ;
 *  · /artist/<nom>/portfolio  → le PORTFOLIO (les tatouages) ;
 *  · /artist/<nom>/flash      → les FLASHS (les planches).
 * Chacune a SON TITRE, SA CANONIQUE et SON CONTENU PROPRE — pour Google
 * — et non une page dupliquée avec un onglet. Les trois routes
 * (page.tsx, portfolio/page.tsx, flash/page.tsx) ne font que nommer
 * leur vue : tout ce qu'elles ont en commun — la lecture de la fiche,
 * la vieille adresse redirigée, le portfolio pas encore en ligne, la
 * page introuvable, l'en-tête, le compteur, les données structurées —
 * est écrit ICI, une fois (pièges nº 378/379).
 *
 * Indexable : c'est LA page qui doit sortir quand on cherche le nom
 * d'un tatoueur. Slug inconnu → page introuvable, jamais une page
 * vide qui polluerait l'index des moteurs.
 *
 * ██ nº 359 — LA FICHE EST PRÉPARÉE D'AVANCE (étape 2, tranche 1) ██
 * ------------------------------------------------------------------
 * Le témoin mixte de la nº 358 a signé la cause des éjections de
 * retour sur Chrome iPhone : des fiches DYNAMIQUES traversées en
 * douceur suffisent, même depuis un accueil prérendu. Ces pages sont
 * donc prérendues et régénérées (5 min, comme l'accueil — mêmes
 * raisons ; `revalidate` s'écrit dans chaque route, Next l'exige en
 * clair), et TOUT ce qui variait par la requête a déménagé :
 *  · les tags de carte (?style=…&photo=…) et la consigne d'arrivée
 *    (?entree=lien) sont lus PAR LE NAVIGATEUR (FicheSelonLAdresse ;
 *    la règle nº 6 est tenue au pixel par la garde d'avant peinture —
 *    voir globals.css et le script) ;
 *  · l'aperçu du propriétaire et les métadonnées par tags vivent au
 *    JUMEAU COMPLET (full/page.tsx) ;
 *  · le bouton « Suivre » naît neutre et se remplit à la charge des
 *    favoris — le modèle des cœurs (nº 137), déjà accepté partout.
 * ⚠️ LES DEUX NOUVELLES PAGES N'ONT PAS DE JUMEAU : elles ne lisent
 * aucun tag (il n'y a plus de galerie « ouverte », nº 873-§3), et le
 * proxy ne les aiguille vers rien — un robot reçoit la page préparée.
 */

// LA FICHE EST LUE UNE FOIS PAR REQUÊTE, même si les métadonnées, le
// corps de page ET le texte de l'image de partage la demandent tous
// les trois : ils appellent tous la même instance (lib/fiche-lue).
const charger = ficheLue;

/**
 * nº 359 — LA FICHE PUBLIQUE, ET ELLE SEULE. Ces pages sont PRÉPARÉES
 * D'AVANCE : elles ne peuvent plus lire la session, donc plus servir
 * l'aperçu du propriétaire (fiche pas encore publiée) — c'est le
 * JUMEAU COMPLET (full/page.tsx) qui s'en charge, et le PONT
 * ci-dessous qui y mène.
 */
async function fichePublique(slug: string) {
  const { tatoueur, demonstration } = await charger(slug);
  return { tatoueur, demonstration, privee: false };
}

/**
 * ██ §1 (nº 873) — LE TITRE ET LA DESCRIPTION DE CHAQUE PAGE ██
 * ------------------------------------------------------------------
 * Le profil garde les siens (« <nom> — tattoo artist in <ville> ») ; le
 * portfolio et les flashs disent ce qu'ils montrent — trois titres
 * distincts pour trois adresses, c'est ce qu'un moteur attend (les
 * mots sont au lexique, nº 873).
 */
function titreEtDescription(
  tatoueur: Tatoueur,
  vue: VueDeFiche
): { title: string; description: string } {
  const styles = tatoueur.styles.map(libelleStyle).join(", ");
  const lesStyles = styles ? ` — ${styles}.` : ".";
  const ou = `in ${tatoueur.ville_nom}`;
  if (vue === "portfolio") {
    return {
      title: `${tatoueur.nom} — tattoo portfolio ${ou}`,
      description:
        `${tatoueur.nom}'s tattoo portfolio ${ou}${lesStyles}` +
        " Tattoos by style.",
    };
  }
  if (vue === "flash") {
    return {
      title: `${tatoueur.nom} — flash tattoos ${ou}`,
      description:
        `${tatoueur.nom}'s flash tattoos ${ou}${lesStyles}` +
        " Flash designs by style.",
    };
  }
  return {
    title: `${tatoueur.nom} — tattoo artist ${ou}`,
    description:
      `${tatoueur.nom}, tattoo artist ${ou}${lesStyles}` +
      " Instagram portfolio and styles.",
  };
}

export async function metadonneesDeFiche(
  slug: string,
  vue: VueDeFiche
): Promise<Metadata> {
  const { tatoueur, demonstration, privee } = await fichePublique(slug);
  if (!tatoueur) {
    /*  ██ §2 (nº 700) — L'ONGLET DISAIT LE CONTRAIRE DE LA PAGE ██
        ==============================================================
        LE CAS, TROUVÉ PAR L'AUDIT nº 691 (R13) : une adresse dont le
        portfolio EXISTE mais n'est pas publié affiche « Ce portfolio
        n'est pas encore en ligne » — c'est vrai — pendant que l'onglet
        du navigateur, lui, annonce « Tatoueur introuvable » — c'est
        faux. Deux phrases sur le même écran, qui se contredisent : la
        personne ne sait pas laquelle croire, et celle qui ment est
        justement la plus visible dans une liste d'onglets.
        LA CAUSE EST UNE DISTINCTION FAITE À UN SEUL ENDROIT : le corps
        de la page sépare « absent » de « pas encore publié » (voir plus
        bas) ; le titre, lui, ne connaissait qu'un seul cas.
        ⚠️ UNE LECTURE DE PLUS, ET SEULEMENT SUR CE CHEMIN-LÀ : la
        question n'est posée que si la fiche publique est introuvable —
        jamais sur une page qui s'affiche normalement. Elle ne rend
        qu'un oui ou un non (clé de service) : rien de la fiche ne sort.
        ⚠️ LE `noindex` NE BOUGE PAS : publié ou non, une page qui ne
        montre pas de portfolio n'a rien à faire dans un moteur. */
    if (await ficheExistanteNonPubliee(slug)) {
      return {
        title: "Portfolio not online yet",
        robots: { index: false, follow: false },
      };
    }
    return {
      title: "Tattoo artist not found",
      robots: { index: false, follow: false },
    };
  }

  /*  §2 (nº 281) — L'APERÇU PAR TAGS A DÉMÉNAGÉ AU JUMEAU COMPLET
      (nº 359) : il exige la lecture de la requête, que ces pages
      préparées d'avance ne font plus. Le proxy sert le jumeau aux
      robots d'aperçu — WhatsApp et Facebook reçoivent donc toujours
      l'image du carrousel désigné, à l'adresse publique inchangée. */
  return {
    ...titreEtDescription(tatoueur, vue),
    //  §1 (nº 873) — LA CANONIQUE EST CELLE DE LA PAGE : trois pages,
    //  trois canoniques — jamais deux adresses pour un même contenu.
    alternates: privee
      ? undefined
      : { canonical: `${adresseDuSite()}${cheminDeFiche(tatoueur.slug, vue)}` },
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

/** Les fiches EN LIGNE, préparées à la compilation — la même règle et
    les mêmes colonnes que le plan du site (sitemap.ts), pour les trois
    pages de chacune. Base injoignable à la compilation : liste vide,
    chaque page se prépare à sa première visite puis reste prête
    (régénération à la demande). */
export async function parametresDesFiches(): Promise<Array<{ slug: string }>> {
  try {
    const supabase = creerClientSupabaseAnonyme();
    const COLONNES = "slug, cree_le, decide_le, supprime_le, publie";
    const lire = (colonnes: string) =>
      supabase
        .from("tatoueurs")
        .select(colonnes)
        .eq("publie", true)
        .is("supprime_le", null);
    let { data, error } = await lire(`${COLONNES}, hors_ligne, statut`);
    if (error) ({ data, error } = await lire(COLONNES));
    if (error) return [];
    return ((data ?? []) as unknown as Array<Record<string, unknown>>)
      .filter((ligne) => typeof ligne.slug === "string" && estEnLigne(ligne))
      .map((ligne) => ({ slug: ligne.slug as string }));
  } catch {
    return [];
  }
}

/** LE CORPS D'UNE DES TROIS PAGES — la vue décide du contenu (ContenuFiche)
    et des données structurées ; tout le reste est commun. */
export async function PageDeFiche({
  slug,
  vue,
}: {
  slug: string;
  vue: VueDeFiche;
}) {
  const { tatoueur, demonstration } = await fichePublique(slug);

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
      //  nº 359 — la cible est NUE : ces pages ne lisent plus la
      //  requête. Les tags d'un très vieux lien se perdent au passage ;
      //  l'adresse moderne, elle, arrive telle quelle (aucune
      //  redirection). §1 (nº 873) — et la cible est LA MÊME PAGE :
      //  un vieux lien vers le portfolio arrive sur le portfolio.
      permanentRedirect(cheminDeFiche(actuel, vue));
    }
  }
  //  ⚠️ UNE FICHE QUI EXISTE MAIS N'EST PAS EN LIGNE N'EST PAS UN 404
  //  (nº 176-§3). Le 404 dit « cette adresse n'existe pas » — et ce
  //  serait faux : la fiche est là, elle attend d'être publiée. On le
  //  dit donc, à la charte, avec le même retour à l'accueil.
  //  (La question est posée par la clé de service et ne rend qu'un oui
  //  ou un non : rien de la fiche ne sort de là.)
  if (!tatoueur && (await ficheExistanteNonPubliee(slug))) {
    return (
      <>
        <PageMessageSombre titre="This portfolio isn't online yet." pleinEcran={false} />
        {/* nº 359 — LE PONT DU PROPRIÉTAIRE : cette page préparée
            d'avance ne connaît pas la session ; si un compte est
            connecté sur ce navigateur, le pont l'emmène au jumeau
            complet, qui sait montrer sa fiche en attente. Pour un
            visiteur sans compte : rien, le message reste. */}
        <PontApercuFiche slug={slug} />
      </>
    );
  }
  if (!tatoueur) notFound();

  const stylePrincipal = tatoueur.styles[0];
  /** L'adresse du profil — l'entité principale de chaque page — et
      celle de LA page rendue (le profil, le portfolio ou les flashs). */
  const adresseDuProfil = `${adresseDuSite()}${cheminDeFiche(tatoueur.slug)}`;
  const adresseDeLaPage = `${adresseDuSite()}${cheminDeFiche(tatoueur.slug, vue)}`;

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
      {/* LA CONSULTATION EST COMPTÉE ICI (nº 220-§1) — et plus
          seulement au clic sur une carte : un lien partagé, « Ma
          sélection » ou une adresse tapée à la main comptent
          désormais. La base dédoublonne par visiteur, par fiche et par
          jour : aucun double comptage possible — passer du profil au
          portfolio ne compte donc pas deux fois (nº 873). */}
      <CompteurConsultation slug={tatoueur.slug} />
      {/*  §1 (nº 281) — LA SONDE DU CADRE, `?sonde-cadre=1`. Elle ne
           s'installe QUE si l'adresse la demande (elle rend `null`
           sinon) et ne touche à rien d'autre : elle mesure et affiche.
           Elle vit sur CETTE page — celle d'une fiche de partage —,
           là où le propriétaire voit la bande à gauche du cadre. */}
      {/*  nº 359 — les tags de l'adresse sont lus PAR LE NAVIGATEUR :
           même adresse, mêmes règles (5 et 6), seul le lecteur change.
           Le bouton « Suivre » naît neutre — la charge des favoris le
           remplit, comme les cœurs (nº 137).
           §1 (nº 873) — et LA VUE vient de la route : c'est elle qui
           ouvre l'onglet, le navigateur n'a plus d'onglet à lire. */}
      <FicheSelonLAdresse
        tatoueur={tatoueur}
        demonstration={demonstration}
        vue={vue}
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
          il n'y en a pas serait faux, et Google le sanctionne.
          §1 (nº 873) — LES TROIS PAGES LE PORTENT : l'entité est la
          même (le profil), l'adresse de la page est la sienne. */}
      <JsonLd
        donnees={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          name: tatoueur.nom,
          description: TEXTES_TATOUAGE.descriptionSite,
          url: adresseDeLaPage,
          mainEntity: {
            "@type":
              tatoueur.type_fiche === "salon" ? "TattooParlor" : "Person",
            name: tatoueur.nom,
            ...(tatoueur.type_fiche === "salon"
              ? {}
              : { jobTitle: "Tattoo artist" }),
            url: adresseDuProfil,
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
            //  §2 (nº 387) — TikTok a quitté le produit : il ne part plus
            //  dans les données structurées non plus.
            sameAs: [tatoueur.lien_instagram].filter(
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
          fenêtre superposée (FenetreFiche, nº 200-§2).
          §1 (nº 873) — le portfolio et les flashs ajoutent leur marche :
          Accueil › Style › Nom › Portfolio (ou Flash). */}
      <JsonLd
        donnees={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: adresseDuSite(),
            },
            ...(stylePrincipal
              ? [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: libelleStyle(stylePrincipal),
                    item: `${adresseDuSite()}/tattoo/${stylePrincipal}/${tatoueur.ville_slug}`,
                  },
                ]
              : []),
            {
              "@type": "ListItem",
              position: stylePrincipal ? 3 : 2,
              name: tatoueur.nom,
              item: adresseDuProfil,
            },
            ...(vue === "profil"
              ? []
              : [
                  {
                    "@type": "ListItem",
                    position: stylePrincipal ? 4 : 3,
                    name: LIBELLES_DES_VUES[vue],
                    item: adresseDeLaPage,
                  },
                ]),
          ],
        }}
      />
    </>
  );
}
