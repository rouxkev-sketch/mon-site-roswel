import type { Metadata } from "next";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { adresseDuSite } from "@/lib/site";
//  nº 811/814 — les adresses des pages éditoriales, écrites une fois.
import {
  CHEMIN_CONTACT,
  CHEMIN_LEGAL,
  CHEMIN_TERMS,
} from "@/lib/chemins-editoriaux";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
//  §4 (nº 475) — le lien vers l'accueil qui déclare son départ.
import { LienAccueil } from "@/components/LienAccueil";
//  nº 811 — le lien qui précharge au geste et tire le rideau au clic
//  (les liens internes d'une page de texte ne préchargent pas à la vue).
import { LienAuGeste } from "@/components/LienAuGeste";
//  nº 814 — la section des pages de texte légal, partagée avec /legal ;
//  nº 815 — et la robe de leurs liens (le bleu des liens d'action).
import { CLASSE_LIEN_LEGAL, SectionLegale } from "@/components/SectionLegale";

/**
 * LES CONDITIONS D'UTILISATION DE YOKOFOLIO — « Terms of Use »
 * ============================================================
 * Adresse : /terms (nº 814 — la page naît ici, sans ancienne adresse ;
 * la constante vit dans lib/chemins-editoriaux). Le rideau de
 * chargement : `loading.tsx` à côté, comme les trois autres pages
 * éditoriales (nº 811) — sans squelette.
 *
 * ██ POURQUOI UNE PAGE À PART (nº 814) ██
 * ==================================================================
 * Le site s'adresse au public américain (Austin, Texas) depuis la
 * nº 804 ; aux États-Unis, les conditions d'utilisation sont un
 * document SÉPARÉ de la notice légale (docs/A-VALIDER-AVOCAT.md,
 * point 3). Cette page dit les RÈGLES : ce qu'est le service, ce qu'on
 * peut en faire, les comptes, les photos des artistes (ils garantissent
 * leurs droits), les portfolios que le site crée lui-même, l'absence de
 * garantie, la limite de responsabilité, le droit applicable. La page
 * légale (/legal) garde les FAITS : qui publie, qui héberge, les
 * données, les cookies, la procédure DMCA — les deux se lient.
 *
 * ⚠️ LE TON EST CELUI DU SITE : court, direct, « you » — pas un
 * contrat de trente pages. Chaque clause dit une chose que le site
 * fait ou ne fait pas, et rien qu'il ne puisse tenir.
 *
 * ⚠️ CE QUI EST UNE DÉCISION DU PROPRIÉTAIRE, AU MOT PRÈS : les
 * portfolios créés par l'administration sont PUBLICS et RETIRÉS
 * IMMÉDIATEMENT sur demande (« taken down immediately, no questions
 * asked »). C'est aussi ce que promet le message de démarchage
 * (lib/demarchage).
 *
 * ⚠️ CE QUI EST UN CHOIX DE LA nº 814, À CONFIRMER PAR UN JURISTE
 * (docs/A-VALIDER-AVOCAT.md) : le droit du Texas et les tribunaux du
 * comté de Travis (le marché du site — l'éditeur, lui, est un
 * particulier français) ; l'âge minimal de 18 ans pour un compte ; le
 * plafond de responsabilité à 100 $ ; la clause d'indemnisation. Tout
 * cela vit dans les constantes ci-dessous ou dans une seule phrase,
 * pour n'avoir qu'un endroit à reprendre.
 *
 * ⚠️ AUCUNE ADRESSE E-MAIL ICI : les questions passent par la page de
 * contact (le formulaire fonctionne, quelle que soit la boîte), les
 * notifications de droit d'auteur par l'agent DMCA de la page légale.
 * Une adresse de plus serait une adresse de plus à tenir à jour.
 */

/** Le droit applicable et le for — un seul endroit à reprendre. */
const DROIT_APPLICABLE = {
  loi: "the laws of the State of Texas, United States",
  tribunaux: "the state and federal courts located in Travis County, Texas",
};

/** L'âge minimal pour ouvrir un compte (choix nº 814, à confirmer). */
const AGE_MINIMAL = 18;

/** Le plafond de responsabilité, en dollars (choix nº 814, à confirmer). */
const PLAFOND_DOLLARS = 100;

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The rules for using ${MARQUE_YOKOFOLIO.nom}: the service, accounts, the artists' photos, liability and governing law.`,
  alternates: { canonical: `${adresseDuSite()}${CHEMIN_TERMS}` },
};

/** Un lien interne de la page : la robe des liens du texte légal — le
    BLEU des liens d'action depuis la nº 815 (voir `SectionLegale`). */
const CLASSE_LIEN = CLASSE_LIEN_LEGAL;

export default function PageConditionsUtilisation() {
  return (
    <>
      <EnTeteTatouage />

      <main className="flex-1 mx-auto w-full max-w-[760px] px-4 sm:px-6 pt-10 pb-20">
        <h1 className="text-[clamp(1.8rem,4.5vw,2.4rem)] font-bold leading-tight text-sombre-texte">
          Terms of Use
        </h1>
        <p className="mt-3 text-[15px] text-sombre-texte-doux">
          The rules for using {MARQUE_YOKOFOLIO.nom} — short, and in plain
          English.
        </p>

        <div className="mt-10 flex flex-col gap-7">
          <SectionLegale titre="What these terms are">
            <p>
              These Terms of Use are an agreement between you and the
              publisher of {MARQUE_YOKOFOLIO.nom} — an individual, publishing
              the site on a personal, non-commercial basis (see the{" "}
              <LienAuGeste href={CHEMIN_LEGAL} className={CLASSE_LIEN}>
                Legal Notice
              </LienAuGeste>
              ). They apply to everyone who uses the site, with or without
              an account. By using {MARQUE_YOKOFOLIO.nom}, you accept them;
              if you don&apos;t, please don&apos;t use the site.
            </p>
            <p>
              The Legal Notice — who publishes and hosts the site, what
              happens to personal information, and the copyright (DMCA)
              procedure — is part of these terms.
            </p>
          </SectionLegale>

          <SectionLegale titre="The service">
            <p>
              {MARQUE_YOKOFOLIO.nom} helps you find tattoo artists by style
              and city, and shows their work in that exact style. It is
              free: no fee, no commission, no advertising.
            </p>
            <p>
              {MARQUE_YOKOFOLIO.nom} is not a party to anything you arrange
              with an artist. It does not verify their licenses, training
              or hygiene, and it does not check the work shown beyond what
              the artist declares. Choosing an artist, and getting the
              tattoo, is your decision and your responsibility.
            </p>
            <p>
              The site is published by one person, without a business
              model: it may change, pause or stop at any time.
            </p>
          </SectionLegale>

          <SectionLegale titre="Using the site">
            <p>
              Use the site for what it is made for: finding artists, keeping
              a selection, presenting your own work. Do not:
            </p>
            <ul className="flex flex-col gap-2 pl-5 list-disc">
              <li>
                copy, scrape or download the artists&apos; photos or the
                site&apos;s content in bulk, or reuse them anywhere without
                their author&apos;s permission;
              </li>
              <li>
                pretend to be someone else, or create a portfolio in
                someone else&apos;s name;
              </li>
              <li>
                publish anything unlawful, hateful or harassing, or anything
                that is not tattoo work;
              </li>
              <li>
                try to break, overload or bypass the site&apos;s protections,
                or access it with automated tools other than ordinary search
                engines.
              </li>
            </ul>
            <p>
              Content or accounts that break these rules can be taken down
              or closed, with notice when possible.
            </p>
          </SectionLegale>

          <SectionLegale titre="Accounts">
            <p>
              You need an account to keep a selection (saved photos,
              portfolios you follow) or to publish a portfolio. You must be
              at least {AGE_MINIMAL} years old to create one.
            </p>
            <p>
              Give accurate information, keep your password to yourself,
              and tell us if you think someone else is using your account:
              you are responsible for what happens under it.
            </p>
            <p>
              You can delete your account at any time, directly from the
              account. Everything it holds goes with it — the Legal Notice
              says what, and for how long it was kept.
            </p>
          </SectionLegale>

          <SectionLegale titre="Artists' portfolios and photos">
            <p>
              <strong className="text-sombre-texte">
                Your photos stay yours.
              </strong>{" "}
              {MARQUE_YOKOFOLIO.nom} claims no rights over them.
            </p>
            <p>
              By publishing a photo, you declare and warrant that you are
              its author or hold the rights needed to publish it, that it
              shows your own work, and that you have the permission of any
              person recognizable in it.
            </p>
            <p>
              You give {MARQUE_YOKOFOLIO.nom} a non-exclusive, free,
              worldwide license to host, store, resize and display your
              photos and your portfolio, on the site and in its previews
              (link previews on social networks and search engines), for
              the sole purpose of presenting your work. The license ends
              when you delete the photo or the portfolio; technical copies
              (caches, previews) can survive a few hours.
            </p>
            <p>
              Photos are reviewed before they are published.{" "}
              {MARQUE_YOKOFOLIO.nom} can decline or remove a photo or a
              portfolio that breaks these terms or the law, and tells you
              why when it does.
            </p>
          </SectionLegale>

          {/*  LA DÉCISION DU PROPRIÉTAIRE (nº 814), AU MOT PRÈS : ces
               portfolios sont PUBLICS, et RETIRÉS IMMÉDIATEMENT sur
               demande. Le message de démarchage (lib/demarchage) promet
               la même chose : « tu le récupères, ou tu le fais
               retirer ». */}
          <SectionLegale titre={`Portfolios created by ${MARQUE_YOKOFOLIO.nom}`}>
            <p>
              To get started, {MARQUE_YOKOFOLIO.nom} sometimes creates a
              portfolio for a tattoo artist from what they have already
              made public — name, city, styles, links to their social
              accounts, and images of their work. Such a portfolio is
              public, like any other, and it is offered to the artist, who
              can:
            </p>
            <ul className="flex flex-col gap-2 pl-5 list-disc">
              <li>
                <strong className="text-sombre-texte">claim it</strong>,
                through the link they receive: it becomes theirs, with all
                the rights and duties above;
              </li>
              <li>
                <strong className="text-sombre-texte">
                  have it removed
                </strong>
                : on request, it is taken down immediately, no questions
                asked. Use the link in the message you received, or{" "}
                <LienAuGeste href={CHEMIN_CONTACT} className={CLASSE_LIEN}>
                  write to us
                </LienAuGeste>
                .
              </li>
            </ul>
          </SectionLegale>

          <SectionLegale titre="Copyright and DMCA">
            <p>
              If you believe a photo on {MARQUE_YOKOFOLIO.nom} infringes
              your copyright, send a notice to the site&apos;s designated
              agent. The procedure, what a notice must contain, and the
              counter-notification are in the{" "}
              <LienAuGeste href={`${CHEMIN_LEGAL}#dmca`} className={CLASSE_LIEN}>
                Copyright and DMCA section of the Legal Notice
              </LienAuGeste>
              . Accounts that infringe repeatedly are closed.
            </p>
          </SectionLegale>

          <SectionLegale titre="No warranty">
            <p>
              {MARQUE_YOKOFOLIO.nom} is provided &quot;as is&quot; and
              &quot;as available&quot;, without warranties of any kind,
              express or implied — including merchantability, fitness for a
              particular purpose and non-infringement. We do not promise
              that the site will always be available or error-free, or
              that its content, the artists&apos; information included, is
              accurate or up to date.
            </p>
          </SectionLegale>

          <SectionLegale titre="Limitation of liability">
            <p>
              To the fullest extent permitted by law, the publisher is not
              liable for any indirect, incidental, special, consequential or
              punitive damages, nor for any loss of data, business or
              profit, arising from your use of the site, from an
              artist&apos;s work or conduct, or from content published by
              others. The site is free: in any event, the publisher&apos;s
              total liability for anything related to it is limited to{" "}
              {PLAFOND_DOLLARS} U.S. dollars. Some states do not allow some
              of these limits; where that is the case, they apply as far as
              the law permits, and nothing here takes away rights you have
              as a consumer that cannot be waived.
            </p>
            <p>
              If your content or your use of the site causes a claim
              against the publisher, you agree to cover the resulting
              costs, including reasonable attorney&apos;s fees.
            </p>
          </SectionLegale>

          <SectionLegale titre="Governing law and disputes">
            <p>
              These terms are governed by {DROIT_APPLICABLE.loi}, without
              regard to its conflict-of-law rules. Any dispute that cannot
              be settled amicably goes to {DROIT_APPLICABLE.tribunaux}, and
              you consent to their jurisdiction.
            </p>
            <p>
              Before that,{" "}
              <LienAuGeste href={CHEMIN_CONTACT} className={CLASSE_LIEN}>
                write to us
              </LienAuGeste>
              : most problems are solved with an email, and we will try to
              solve yours within thirty days.
            </p>
          </SectionLegale>

          <SectionLegale titre="Changes">
            <p>
              These terms can change — when the site changes, or the law
              does. The date below says when they last did; a material
              change is announced on the site. Using {MARQUE_YOKOFOLIO.nom}{" "}
              after a change means you accept the new terms.
            </p>
          </SectionLegale>

          <SectionLegale titre="Contact">
            <p>
              Questions about these terms: the{" "}
              <LienAuGeste href={CHEMIN_CONTACT} className={CLASSE_LIEN}>
                contact page
              </LienAuGeste>
              . Copyright notices: the designated agent, in the{" "}
              <LienAuGeste href={`${CHEMIN_LEGAL}#dmca`} className={CLASSE_LIEN}>
                Legal Notice
              </LienAuGeste>
              .
            </p>
          </SectionLegale>
        </div>

        {/*  LA DATE DE DERNIÈRE MISE À JOUR : elle ferme le CONTENU,
             avant le lien de retour (la règle de la page légale,
             nº 322). Première version : nº 814. */}
        <p className="mt-10 text-[15px] text-sombre-texte-doux">
          Last updated: September 2, 2026
        </p>

        {/*  §4 (nº 475) — LE DÉPART VERS L'ACCUEIL SE DÉCLARE ; les
             mesures de la nº 788 (40 px, 14 px), comme /legal. */}
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
