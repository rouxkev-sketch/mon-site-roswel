import type { Metadata } from "next";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
//  §4 (nº 475) — le lien vers l'accueil qui déclare son départ.
import { LienAccueil } from "@/components/LienAccueil";

/**
 * LA PAGE LÉGALE DE YOKOFOLIO — « Legal Notice »
 * ==============================================
 * Adresse : /mentions-legales (l'adresse n'a pas bougé à la nº 804 :
 * les adresses du site sont un sujet à part, voir le rapport).
 *
 * ██ RÉÉCRITE EN ANGLAIS ET ADAPTÉE AUX ÉTATS-UNIS (nº 804) ██
 * ==================================================================
 * Le site devient anglais (marché : Austin, Texas). Cette page est
 * TRADUITE et ADAPTÉE « raisonnablement » — la consigne du
 * propriétaire — et tout ce qui mérite un juriste est LISTÉ dans
 * docs/A-VALIDER-AVOCAT.md, pas tranché ici.
 *
 * CE QUI A ÉTÉ RETIRÉ, parce que franco-français ou propre à l'Union
 * européenne, et que la page ne s'adresse plus à ce public :
 *  · la référence à la loi LCEN (article 6-III-2) qui justifiait de
 *    ne pas publier l'adresse d'un éditeur particulier — l'idée
 *    (identité remise aux hébergeurs, non publiée) RESTE, sans le
 *    numéro d'article ;
 *  · la section « Directeur de la publication », notion française sans
 *    équivalent utile ici ;
 *  · les articles du RGPD (6.1.b), l'article 82 de la loi Informatique
 *    et Libertés, la réclamation à la CNIL, et le paragraphe sur le
 *    « transfert hors de l'Union européenne » ;
 *  · SIREN et TVA intracommunautaire dans la clause de mise à jour.
 *
 * CE QUI RESTE, ET C'EST LE FOND : qui publie, qui héberge, ce qui est
 * collecté et pourquoi, combien de temps, comment on supprime son
 * compte, à qui appartiennent les photos, les liens sortants. Rien
 * n'est vendu, aucune publicité, aucune donnée revendue — ce sont des
 * FAITS sur le site, ils ne changent pas avec la langue.
 *
 * ⚠️ AUCUN FAIT NOUVEAU N'EST INVENTÉ : pas d'entité américaine, pas
 * de « designated agent » DMCA, pas de clause de droit applicable —
 * ce sont précisément les points remis au juriste. La page dit ce que
 * le site fait, et rien qu'elle ne puisse tenir.
 *
 * ⚠️ LA BASE EST HÉBERGÉE AUX ÉTATS-UNIS depuis la nº 766 (projet
 * Supabase « USA Est ») : l'adresse de Supabase Inc. (Singapour) est
 * celle de la société, pas celle du serveur. La page dit les deux.
 *
 * Le jour où une société est créée : dénomination, forme, siège et
 * numéro d'enregistrement deviennent nécessaires. Tout est regroupé
 * dans un seul objet, ÉDITEUR, pour n'avoir qu'un endroit à reprendre.
 */

const ÉDITEUR = {
  contact: "contact@yokofolio.com",
};

const HÉBERGEURS = [
  {
    nom: "Vercel Inc.",
    role: "website hosting",
    adresse: "440 N Barranca Ave #4133, Covina, CA 91723, United States",
    site: "https://vercel.com",
  },
  {
    nom: "Supabase Inc.",
    role: "database hosting (servers located in the United States)",
    adresse: "970 Toa Payoh North #07-04, Singapore 318992",
    site: "https://supabase.com",
  },
];

export const metadata: Metadata = {
  title: "Legal Notice",
  description: `Who publishes ${MARQUE_YOKOFOLIO.nom}, who hosts it, and what happens to the information that goes through it.`,
  alternates: { canonical: `${adresseDuSite()}/mentions-legales` },
};

/** Une section : titre net, texte lisible, marges généreuses. */
function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-sombre-bordure pt-7 first:border-0 first:pt-0">
      <h2 className="text-[clamp(1.05rem,2.2vw,1.25rem)] font-bold text-sombre-texte">
        {titre}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-sombre-texte-doux">
        {children}
      </div>
    </section>
  );
}

export default function PageMentionsLegales() {
  return (
    <>
      <EnTeteTatouage />

      <main className="flex-1 mx-auto w-full max-w-[760px] px-4 sm:px-6 pt-10 pb-20">
        <h1 className="text-[clamp(1.8rem,4.5vw,2.4rem)] font-bold leading-tight text-sombre-texte">
          Legal Notice
        </h1>
        <p className="mt-3 text-[15px] text-sombre-texte-doux">
          Who publishes {MARQUE_YOKOFOLIO.nom}, who hosts it, and what
          happens to the information that goes through it.
        </p>

        <div className="mt-10 flex flex-col gap-7">
          <Section titre="Publisher">
            <p>
              <strong className="text-sombre-texte">
                This site is published by an individual, on a personal,
                non-commercial basis.
              </strong>
              <br />
              Contact:{" "}
              <a
                href={`mailto:${ÉDITEUR.contact}`}
                className="text-primaire hover:underline"
              >
                {ÉDITEUR.contact}
              </a>
            </p>
            <p>
              {MARQUE_YOKOFOLIO.nom}{" "}
              is published WITHOUT A BUSINESS MODEL: the site sells nothing,
              takes no commission, shows no advertising and sells no data.
            </p>
            <p>
              The publisher&apos;s full identity has been provided to the
              hosting providers below. It is not published on the site; it
              will be disclosed upon a lawful request from a competent
              authority.
            </p>
          </Section>

          <Section titre="Hosting">
            <p>The site and its data are hosted by:</p>
            <ul className="flex flex-col gap-3">
              {HÉBERGEURS.map((h) => (
                <li key={h.nom}>
                  <strong className="text-sombre-texte">{h.nom}</strong> —{" "}
                  {h.role}
                  <br />
                  {h.adresse}
                  <br />
                  <a
                    href={h.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primaire hover:underline"
                  >
                    {h.site.replace("https://", "")}
                  </a>
                </li>
              ))}
            </ul>
            <p>The site&apos;s data is processed in the United States.</p>
          </Section>

          <Section titre="Personal information">
            <p>
              A visitor who simply searches for a tattoo artist creates no
              account and provides no information: {MARQUE_YOKOFOLIO.nom}{" "}
              asks for nothing.
            </p>
            {/*  LE COMPTE VISITEUR (nº 322). Les trois données nommées ici
                 sont EXACTEMENT les trois tables du site —
                 `tatoueurs_suivis`, `favoris_photos` et
                 `visites_selection` — et toutes trois disparaissent avec
                 le compte (`on delete cascade` sur `auth.users`), ce qui
                 est précisément ce que la dernière phrase promet. */}
            <p>
              A VISITOR who wants to keep a selection creates an account with
              an email address. The site then stores the portfolios they
              follow, the photos they saved, and the date of their last
              visit — only to show them their favorites and flag what is new
              since their last visit. None of this is sold, shared, or used
              for advertising. Retention: as long as the account exists,
              then deletion.
            </p>
            <p>
              A TATTOO ARTIST who creates a portfolio provides a name, a
              city, an email address, their styles, their images and links
              to their social accounts. This information is used only to
              display the portfolio and to contact them about it. It is
              neither sold, nor shared, nor used for advertising. Retention:
              as long as the portfolio exists, then deletion.
            </p>
            {/*  LA RELECTURE DES PHOTOS (nº 322). Elle existe (une fiche
                 modifiée repasse en validation), et c'est un ACCÈS de
                 l'éditeur aux images déposées : une page qui dit ce que
                 deviennent les informations doit le dire. */}
            <p>
              Photos submitted to a portfolio are reviewed before they are
              published. The publisher therefore has access to them, for
              that sole purpose.
            </p>
            <p>
              The contact form collects a name, an email address and a
              message. They are used only to reply, and kept only as long as
              needed for that exchange.
            </p>
            <p>
              <strong className="text-sombre-texte">
                Access, correction and DELETION.
              </strong>{" "}
              {/*  LA SUPPRESSION SE FAIT DEPUIS LE COMPTE, ET ELLE PASSE EN
                   PREMIER (nº 322) : l'écran Sécurité (`BlocSuppressions`)
                   supprime une fiche ou le compte entier, sans demander à
                   personne, et il est ouvert à TOUT compte connecté,
                   visiteur compris. La voie de l'e-mail RESTE, juste
                   après : elle sert à qui ne peut plus se connecter. */}
              An account can be deleted at any time by its owner, DIRECTLY
              FROM THE ACCOUNT, without asking anyone. A tattoo artist can
              also request, at any time, the correction or the complete
              deletion of their portfolio and account, by simply emailing{" "}
              <a
                href={`mailto:${ÉDITEUR.contact}`}
                className="text-primaire hover:underline"
              >
                {ÉDITEUR.contact}
              </a>
              . Deletion is carried out without conditions and without undue
              delay. Anyone can also ask what information the site holds
              about them, and have it corrected.
            </p>
          </Section>

          <Section titre="Cookies">
            <p>
              {MARQUE_YOKOFOLIO.nom}{" "}
              sets NO advertising cookies and uses no analytics tool that
              would track visitors from one site to another.
            </p>
            <p>
              Only the cookies strictly necessary for the site to work are
              used: they keep a logged-in user&apos;s session open. Browsing
              without an account sets none.
            </p>
          </Section>

          <Section titre="The photos belong to the tattoo artists">
            <p>
              Every image published on a portfolio remains the FULL PROPERTY
              of the tattoo artist who submitted it. {MARQUE_YOKOFOLIO.nom}{" "}
              claims no rights over these images: the site displays them to
              present their author&apos;s work, and for nothing else.
            </p>
            <p>
              By submitting an image, a tattoo artist declares that they are
              its author or hold the necessary rights, and authorizes its
              display on the site. This authorization ends as soon as the
              portfolio is deleted.
            </p>
            <p>
              Reproducing these images elsewhere without their author&apos;s
              consent is copyright infringement. Anyone who notices an image
              published without authorization can write to{" "}
              <a
                href={`mailto:${ÉDITEUR.contact}`}
                className="text-primaire hover:underline"
              >
                {ÉDITEUR.contact}
              </a>
              : it will be taken down.
            </p>
            <p>
              The name {MARQUE_YOKOFOLIO.nom}, its logo and the site&apos;s
              code remain the property of the publisher.
            </p>
          </Section>

          <Section titre="Links to Instagram and TikTok">
            <p>
              {/*  ⚠️ LE `{" "}` APRÈS LE NOM DE MARQUE : sans lui, on
                   lisait « yokofolion'en est ni l'éditeur ». Voir
                   BlocSuppressions pour la règle. */}
              Portfolios link to the artists&apos; accounts on third-party
              sites. {MARQUE_YOKOFOLIO.nom}{" "}
              neither publishes nor is responsible for them: once you follow
              a link, the terms and privacy policy of those platforms apply.
            </p>
          </Section>

          <Section titre="Updates">
            <p>
              This notice describes a site published by an individual, on a
              non-commercial basis. If a company is created to operate{" "}
              {MARQUE_YOKOFOLIO.nom}, it will be updated accordingly (company
              name, legal form, registered office, registration number).
            </p>
          </Section>
        </div>

        {/*  LA DATE DE DERNIÈRE MISE À JOUR (nº 322). Elle ferme le
             CONTENU, avant le lien de retour, qui est de la navigation et
             non du texte légal. Même écriture que le chapô, même marge
             que la pile de sections : la page ne gagne aucun jeton.
             ⚠️ ELLE CHANGE À LA nº 804 : le contenu a changé de fond
             (adaptation américaine), la date le dit. */}
        <p className="mt-10 text-[15px] text-sombre-texte-doux">
          Last updated: September 2, 2026
        </p>

        {/*  §4 (nº 475) — LE DÉPART VERS L'ACCUEIL SE DÉCLARE : ce
             bouton finit le parcours et va EN AVANT. La page reste
             serveur, seul le lien est client.
             §2 (nº 799) — LES MESURES DE LA nº 788 : 40 px et 14 px,
             comme les capsules de « Qui sommes-nous ». */}
        <LienAccueil
          className="mt-12 inline-flex items-center justify-center rounded-full
                     px-6 min-h-[40px] text-[14px] border border-sombre-bordure
                     text-sombre-texte hover:border-primaire hover:text-primaire
                     transition-colors"
        >
          Back to home
        </LienAccueil>
      </main>
    </>
  );
}
