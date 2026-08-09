import { existsSync } from "fs";
import { join } from "path";
import Link from "next/link";
import {
  APPEL_FINAL,
  AVANTAGES,
  CHEMINS_AGENCE,
  EQUIPE,
  FAQ,
  HEROS,
  LIBELLE_RENDEZ_VOUS,
  SERVICES,
} from "@/config/agence";
import { AccordeonFaq } from "@/components/agence/AccordeonFaq";

/**
 * LA PAGE VITRINE — tout le site, sur un seul écran qui défile
 * =============================================================
 * Adresse : /
 *
 * Six sections dans l'ordre : héros, services, avantages, équipe,
 * appel final, FAQ — puis le pied de page, posé par la mise en page.
 * Les trois ancres du menu (services, equipe, faq) sont les `id` des
 * sections correspondantes.
 *
 * TOUS LES TEXTES VIENNENT DE src/config/agence.ts, où ils sont
 * marqués « PROVISOIRE ». Aucune phrase n'est écrite en dur ici :
 * remplacer un texte ne demande jamais d'ouvrir ce fichier.
 *
 * Le rythme : de grands blancs entre les sections (py-20 → py-36),
 * des titres larges qui suivent la largeur d'écran (`clamp`), et un
 * texte de lecture borné à ~68 caractères par ligne.
 */

/* ------------------------------------------------------------------
 * OÙ EST L'IMAGE, ET SOUS QUELLE EXTENSION ?
 * ------------------------------------------------------------------
 * Le fichier de contenu ne donne qu'un NOM, sans extension. On
 * regarde ici, sur le disque, laquelle a été déposée : mettre un
 * .png ou un .jpg revient au même, il n'y a rien à changer dans le
 * code. Vérification faite CÔTÉ SERVEUR, au rendu de la page : elle
 * ne coûte rien au visiteur.
 *
 * Renvoie null si aucun fichier n'est là. Le bloc affiche alors un
 * cadre d'attente qui rappelle le nom exact à déposer — plutôt qu'une
 * image cassée ou un trou dans la mise en page.
 * ------------------------------------------------------------------ */

const DOSSIER_IMAGES = ["public", "images", "agence"];
const EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

function cheminImage(nom: string): string | null {
  for (const extension of EXTENSIONS) {
    const fichier = `${nom}.${extension}`;
    // `turbopackIgnore` : sans lui, l'outil de construction voit un
    // chemin calculé et, ne sachant pas ce qu'on va lire, EMBARQUE TOUT
    // LE PROJET dans le paquet déployé — pour trois images. Le
    // commentaire lui dit de ne pas suivre cette piste ; le code, lui,
    // fonctionne exactement pareil.
    if (existsSync(join(/*turbopackIgnore: true*/ process.cwd(), ...DOSSIER_IMAGES, fichier))) {
      return `/images/agence/${fichier}`;
    }
  }
  return null;
}

/** Le cadre d'attente, tant que l'image n'a pas été déposée. */
function ImageAVenir({ nom }: { nom: string }) {
  return (
    <div
      className="w-full aspect-[4/3] rounded-3xl bg-black/[0.035]
                 border border-dashed border-black/15
                 flex flex-col items-center justify-center gap-2 px-6 text-center"
    >
      <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black/35">
        Image à déposer
      </span>
      <code className="text-[13px] text-black/50 break-all">
        public/images/agence/{nom}.png
      </code>
    </div>
  );
}

/** Le bouton rose, identique partout. */
function BoutonRendezVous({ classe = "" }: { classe?: string }) {
  return (
    <Link
      href={CHEMINS_AGENCE.rendezVous}
      className={`inline-flex items-center justify-center rounded-full bg-primaire
                  hover:bg-primaire-fonce text-white font-semibold transition-colors
                  px-8 h-14 text-base
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primaire ${classe}`}
    >
      {LIBELLE_RENDEZ_VOUS}
    </Link>
  );
}

/** Le conteneur commun : même largeur, mêmes marges, partout. */
function Contenu({
  children,
  classe = "",
}: {
  children: React.ReactNode;
  classe?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-5 sm:px-8 ${classe}`}>
      {children}
    </div>
  );
}

export default function PageAgence() {
  return (
    <main>
      {/* ---------- 1. HÉROS ---------- */}
      <section className="pt-16 sm:pt-24 pb-4">
        <Contenu>
          <h1
            className="max-w-[16ch] font-bold tracking-[-0.02em] leading-[1.05]
                       text-[clamp(2.4rem,6.2vw,4.5rem)]"
          >
            {HEROS.titre}
          </h1>
          <p className="mt-7 max-w-[58ch] text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-black/60">
            {HEROS.sousTitre}
          </p>
          <div className="mt-10">
            <BoutonRendezVous />
          </div>
        </Contenu>
      </section>

      {/* ---------- 2. SERVICES ---------- */}
      <section id="services" className="scroll-mt-28 pt-24 sm:pt-32 pb-20 sm:pb-28">
        <Contenu>
          <h2 className="max-w-[20ch] font-bold tracking-[-0.02em] leading-[1.1] text-[clamp(1.9rem,4.2vw,3rem)]">
            {SERVICES.titre}
          </h2>
          <p className="mt-6 max-w-[62ch] text-[17px] sm:text-lg leading-relaxed text-black/60">
            {SERVICES.introduction}
          </p>

          {/* LES TROIS BLOCS, EN ALTERNANCE. Le premier (Audit IA)
              porte son image À GAUCHE, le deuxième à droite, le
              troisième à gauche.
              Sur smartphone, tout s'empile et l'IMAGE PASSE EN
              PREMIER : elle vient d'abord dans le flux, et c'est
              seulement à partir de 1024 px que l'ordre des colonnes
              s'inverse un bloc sur deux. */}
          <div className="mt-16 sm:mt-24 flex flex-col gap-20 sm:gap-28">
            {SERVICES.blocs.map((bloc, index) => {
              const source = cheminImage(bloc.image);
              const imageAGauche = index % 2 === 0;
              return (
                <article
                  key={bloc.id}
                  className="grid items-center gap-10 lg:gap-16 lg:grid-cols-2"
                >
                  <div className={imageAGauche ? "" : "lg:order-2"}>
                    {source ? (
                      // Images fournies par le propriétaire, déjà
                      // dimensionnées : l'optimiseur de Next n'a rien
                      // à y gagner, et une balise simple accepte
                      // n'importe quelle extension sans réglage.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={source}
                        alt={bloc.imageAlt}
                        // La première image est visible d'emblée sur
                        // grand écran : elle ne doit pas attendre.
                        loading={index === 0 ? "eager" : "lazy"}
                        className="w-full h-auto rounded-3xl bg-black/[0.03]
                                   ring-1 ring-black/[0.06]"
                      />
                    ) : (
                      <ImageAVenir nom={bloc.image} />
                    )}
                  </div>

                  <div className={imageAGauche ? "" : "lg:order-1"}>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-primaire">
                      {bloc.etiquette}
                    </p>
                    <h3 className="mt-4 font-bold tracking-[-0.015em] leading-[1.15] text-[clamp(1.6rem,3vw,2.35rem)]">
                      {bloc.titre}
                    </h3>
                    <p className="mt-5 max-w-[56ch] text-[16px] sm:text-[17px] leading-relaxed text-black/60">
                      {bloc.texte}
                    </p>
                    <Link
                      href={CHEMINS_AGENCE.rendezVous}
                      className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold
                                 text-black hover:text-primaire transition-colors rounded
                                 focus-visible:outline-2 focus-visible:outline-offset-4
                                 focus-visible:outline-primaire"
                    >
                      {SERVICES.lienBloc}
                      <span aria-hidden="true" className="text-primaire">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </Contenu>
      </section>

      {/* ---------- 3. AVANTAGES ---------- */}
      <section className="py-20 sm:py-28">
        <Contenu>
          <h2 className="font-bold tracking-[-0.02em] leading-[1.1] text-[clamp(1.9rem,4.2vw,3rem)]">
            {AVANTAGES.titre}
          </h2>
          <ul className="mt-12 grid gap-6 sm:gap-7 md:grid-cols-3">
            {AVANTAGES.cartes.map((carte, index) => (
              <li
                key={carte.id}
                className="rounded-3xl bg-black/[0.035] p-8 sm:p-9 flex flex-col"
              >
                <span
                  aria-hidden="true"
                  className="w-11 h-11 rounded-full bg-primaire text-white
                             flex items-center justify-center font-bold text-[15px]"
                >
                  {index + 1}
                </span>
                <h3 className="mt-6 text-[21px] font-bold tracking-[-0.01em]">
                  {carte.titre}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-black/60">
                  {carte.texte}
                </p>
              </li>
            ))}
          </ul>
        </Contenu>
      </section>

      {/* ---------- 4. ÉQUIPE ---------- */}
      <section id="equipe" className="scroll-mt-28 py-20 sm:py-28">
        <Contenu>
          <h2 className="font-bold tracking-[-0.02em] leading-[1.1] text-[clamp(1.9rem,4.2vw,3rem)]">
            {EQUIPE.titre}
          </h2>
          <p className="mt-6 max-w-[62ch] text-[17px] sm:text-lg leading-relaxed text-black/60">
            {EQUIPE.introduction}
          </p>

          {/* DEUX MEMBRES CÔTE À CÔTE dès 640 px, empilés en dessous.
              La liste est bornée à 860 px tant qu'ils ne sont que
              deux : étalées sur 1280 px, deux colonnes laisseraient
              un vide au milieu et des portraits démesurés.
              AJOUTER UN MEMBRE : une entrée de plus dans
              EQUIPE.membres, et rien d'autre — au troisième, la
              largeur se libère et une troisième colonne apparaît. */}
          <ul
            className={`mt-12 grid gap-8 sm:gap-10 sm:grid-cols-2 ${
              EQUIPE.membres.length > 2 ? "lg:grid-cols-3" : "max-w-[860px]"
            }`}
          >
            {EQUIPE.membres.map((membre) => {
              const portrait = membre.portrait
                ? cheminImage(membre.portrait)
                : null;
              return (
                <li key={membre.id} className="flex flex-col">
                  <div className="w-full aspect-4/5 rounded-3xl bg-black/[0.05] overflow-hidden flex items-center justify-center">
                    {portrait ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={portrait}
                        alt={`Portrait de ${membre.nom}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // EMPLACEMENT RÉSERVÉ, en attendant la photo :
                      // les initiales, et rien d'autre.
                      <span
                        aria-hidden="true"
                        className="text-[clamp(2rem,5vw,3rem)] font-bold text-black/20 tracking-tight"
                      >
                        {membre.nom
                          .split(" ")
                          .map((mot) => mot[0])
                          .join("")}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 text-[20px] font-bold tracking-[-0.01em]">
                    {membre.nom}
                  </h3>
                  <p className="mt-1 text-[15px] font-semibold text-primaire">
                    {membre.role}
                  </p>
                  <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed text-black/60">
                    {membre.bio}
                  </p>
                </li>
              );
            })}
          </ul>
        </Contenu>
      </section>

      {/* ---------- 5. APPEL FINAL ----------
          PLUS DE BOÎTE GRISE : c'était elle qui faisait « encadré de
          site des années 2010 ». À la place, une composition centrée
          qui respire — un filet fin pour marquer la rupture, une
          accroche discrète, un titre volontairement très grand, une
          seule phrase, le bouton, et une ligne de réassurance en
          dessous. La hiérarchie se lit d'un coup d'œil :
          accroche → titre → phrase → action → rassurance. */}
      <section className="py-16 sm:py-24">
        <Contenu>
          <div className="border-t border-black/10 pt-20 sm:pt-28 pb-4 flex flex-col items-center text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-primaire">
              {APPEL_FINAL.accroche}
            </p>
            <h2 className="mt-6 max-w-[16ch] font-bold tracking-[-0.025em] leading-[1.03] text-[clamp(2.2rem,6vw,4rem)]">
              {APPEL_FINAL.titre}
            </h2>
            <p className="mt-7 max-w-[46ch] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-relaxed text-black/55">
              {APPEL_FINAL.texte}
            </p>
            <div className="mt-11">
              <BoutonRendezVous classe="px-10 h-16 text-[17px]" />
            </div>
            <p className="mt-5 text-[14px] text-black/40">
              {APPEL_FINAL.reassurance}
            </p>
          </div>
        </Contenu>
      </section>

      {/* ---------- 6. FAQ ---------- */}
      <section id="faq" className="scroll-mt-28 py-20 sm:py-28">
        <Contenu>
          <h2 className="font-bold tracking-[-0.02em] leading-[1.1] text-[clamp(1.9rem,4.2vw,3rem)]">
            {FAQ.titre}
          </h2>
          <p className="mt-6 max-w-[62ch] text-[17px] sm:text-lg leading-relaxed text-black/60">
            {FAQ.introduction}
          </p>
          <div className="mt-12 max-w-[880px]">
            <AccordeonFaq />
          </div>
        </Contenu>
      </section>
    </main>
  );
}
