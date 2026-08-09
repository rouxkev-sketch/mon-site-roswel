import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PASTILLES,
  SCORE_ANCIENNETE,
  SCORE_GOOGLE,
  SCORE_INSTAGRAM,
} from "@/config/roswel";
import { SimulateurScore } from "@/components/SimulateurScore";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Simulateur de score (outil)",
};

const formatNombre = new Intl.NumberFormat("fr-FR");

/** Étiquettes des lignes Instagram : "10 000 et plus", "2 000 à 9 999"… */
function lignesInstagram() {
  return SCORE_INSTAGRAM.grille.map((ligne, i) => {
    const precedent = SCORE_INSTAGRAM.grille[i - 1];
    const label = precedent
      ? `${formatNombre.format(ligne.abonnesMin)} à ${formatNombre.format(precedent.abonnesMin - 1)}`
      : `${formatNombre.format(ligne.abonnesMin)} et plus`;
    return { label, points: ligne.points };
  });
}

/** Étiquettes des colonnes publications : "moins de 30", "30 à 149", "150 et plus" */
function colonnesPublications() {
  return SCORE_INSTAGRAM.paliersPublications.map((palier, i) => {
    const suivant = SCORE_INSTAGRAM.paliersPublications[i + 1];
    if (i === 0 && suivant != null) return `moins de ${suivant}`;
    return suivant != null ? `${palier} à ${suivant - 1}` : `${palier} et plus`;
  });
}

/** Étiquettes des lignes Google : "5,0", "4,7 à 4,9", …, "moins de 3,0" */
function lignesGoogle() {
  const formatNote = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1 });
  return SCORE_GOOGLE.grille.map((ligne, i) => {
    const precedent = SCORE_GOOGLE.grille[i - 1];
    let label: string;
    if (!precedent) label = formatNote.format(ligne.noteMin);
    else if (ligne.noteMin === 0) label = `moins de ${formatNote.format(precedent.noteMin)}`;
    else label = `${formatNote.format(ligne.noteMin)} à ${formatNote.format(precedent.noteMin - 0.1)}`;
    return { label, points: ligne.points };
  });
}

/** Étiquettes des colonnes d'avis : "1-4", "5-19", …, "100+" */
function colonnesAvis() {
  return SCORE_GOOGLE.paliersNbAvis.map((palier, i) => {
    const suivant = SCORE_GOOGLE.paliersNbAvis[i + 1];
    return suivant != null ? `${palier}-${suivant - 1}` : `${palier}+`;
  });
}

/** Étiquettes des paliers d'ancienneté : "20 ans et plus", …, "moins d'1 an" */
function lignesAnciennete() {
  return SCORE_ANCIENNETE.paliers.map((palier, i) => {
    const precedent = SCORE_ANCIENNETE.paliers[i - 1];
    let label: string;
    if (!precedent) label = `${palier.ansMin} ans et plus`;
    else if (palier.ansMin === 0) label = "moins d'1 an";
    else if (precedent.ansMin - 1 === palier.ansMin) label = `${palier.ansMin} ans`;
    else label = `${palier.ansMin} à ${precedent.ansMin - 1} ans`;
    return { label, points: palier.points };
  });
}

/**
 * PAGE OUTIL — SIMULATEUR DE SCORE (étape 7)
 * ------------------------------------------
 * Les deux grilles affichées ici sont LUES dans src/config/roswel.ts :
 * modifier la config change ces tableaux et tous les calculs du site.
 * Développement uniquement :
 * http://localhost:3000/admin/simulateur-score
 */
export default function PageSimulateurScore() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-8">
        <div>
          <h1 className="text-xl font-bold">Simulateur de score</h1>
          <p className="text-encre-douce text-sm mt-2">
            Tape les chiffres d&apos;un artisan : le score se calcule en
            direct avec les grilles du fichier de réglages central. Les
            tableaux ci-dessous sont lus dans ce même fichier.
          </p>
        </div>

        <SimulateurScore />

        {/* Grille Instagram, lue depuis la config */}
        <section>
          <h2 className="text-sm font-semibold mb-2">
            Grille Instagram (sur {SCORE_INSTAGRAM.maximum}) — abonnés × publications
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-bordure">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-fond-doux text-encre-douce">
                  <th className="text-left font-medium p-2.5">Abonnés ↓ Publications →</th>
                  {colonnesPublications().map((libelle) => (
                    <th key={libelle} className="font-medium p-2.5 text-center">
                      {libelle}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignesInstagram().map(({ label, points }) => (
                  <tr key={label} className="border-t border-bordure/60">
                    <td className="p-2.5 text-encre-douce">{label}</td>
                    {points.map((valeur, i) => (
                      <td key={i} className="p-2.5 text-center font-semibold">
                        {valeur}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Grille Google, lue depuis la config */}
        <section>
          <h2 className="text-sm font-semibold mb-2">
            Grille avis Google (sur {SCORE_GOOGLE.maximum}) — note × nombre d&apos;avis
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-bordure">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-fond-doux text-encre-douce">
                  <th className="text-left font-medium p-2.5">Note ↓ Avis →</th>
                  {colonnesAvis().map((libelle) => (
                    <th key={libelle} className="font-medium p-2.5 text-center">
                      {libelle}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignesGoogle().map(({ label, points }) => (
                  <tr key={label} className="border-t border-bordure/60">
                    <td className="p-2.5 text-encre-douce whitespace-nowrap">{label}</td>
                    {points.map((valeur, i) => (
                      <td key={i} className="p-2.5 text-center font-semibold">
                        {valeur}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Grille ancienneté, lue depuis la config */}
        <section>
          <h2 className="text-sm font-semibold mb-2">
            Grille ancienneté (sur {SCORE_ANCIENNETE.maximum}) — années
            d&apos;existence de l&apos;entreprise (annuaire Sirene)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-bordure">
            <table className="w-full text-xs">
              <tbody>
                {lignesAnciennete().map(({ label, points }) => (
                  <tr key={label} className="border-t border-bordure/60 first:border-t-0">
                    <td className="p-2.5 text-encre-douce">{label}</td>
                    <td className="p-2.5 text-center font-semibold">{points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-encre-douce mt-2">
            Calculée automatiquement depuis la date de création renvoyée
            par l&apos;annuaire officiel à la vérification du SIREN —
            jamais saisie à la main. Sans date vérifiée : 0 point.
          </p>
        </section>

        {/* Seuils des pastilles, lus depuis la config */}
        <section className="rounded-2xl border border-bordure bg-fond-doux p-4 text-sm">
          <h2 className="font-semibold mb-2">Seuils des pastilles</h2>
          <ul className="space-y-1 text-encre-douce">
            <li>
              🏆 {PASTILLES.top.label} : {PASTILLES.top.seuil} points et plus
            </li>
            <li>
              👍 {PASTILLES.recommande.label} : {PASTILLES.recommande.seuil} à{" "}
              {PASTILLES.top.seuil - 1} points
            </li>
            <li>Moins de {PASTILLES.recommande.seuil} points : aucune pastille</li>
          </ul>
        </section>

        <p className="text-xs text-encre-douce">
          Après une modification des grilles dans la config, penser à{" "}
          <Link href="/admin/recalculer-scores" className="text-primaire underline">
            recalculer les scores enregistrés
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
