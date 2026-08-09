"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChampMetier } from "@/components/ChampMetier";
import { ChampVille, type VilleChoisie } from "@/components/ChampVille";
import { EnteteModale, FenetreModale } from "@/components/FenetreModale";
import { memoriserRecherche } from "@/lib/recherche-session";
import type { TypeArtisan } from "@/lib/recherche-artisans";
import { IconeReglages } from "@/components/Icones";

const FILTRES = [
  { cle: "urgence", label: "Urgence" },
  { cle: "nuit", label: "La nuit" },
  { cle: "weekend", label: "Le week-end" },
] as const;

type CleFiltre = (typeof FILTRES)[number]["cle"];

/** Les trois choix de la fenêtre « Filtrer les résultats ». Ils
    s'appuient sur le type de compte déjà présent en base — celui qui
    décide de la forme de la photo sur les cartes. */
const TYPES: { cle: TypeArtisan; label: string }[] = [
  { cle: "tous", label: "Tous les artisans" },
  { cle: "independant", label: "Artisan indépendant" },
  { cle: "societe", label: "Entreprise" },
];

/**
 * MENU DE RECHERCHE COMPACT (page de résultats)
 * ---------------------------------------------
 * Rangée 1 : UN SEUL encadré qui contient le métier et la ville,
 * séparés par un trait vertical (même taille de texte pour les
 * deux). Rangée 2 : les trois filtres puis la loupe qui relance
 * la recherche — tous à la même hauteur que l'encadré du dessus.
 *
 * DE 660 à 1023 px : tout passe sur UNE SEULE LIGNE horizontale —
 * l'encadré métier|ville, puis les trois filtres, puis la loupe —
 * alignés, à la même hauteur, centrés verticalement (smartphone étiré
 * ≥ 660 px ET tablette).
 *   • 660–767 px (smartphone étiré) : les pilules de filtre sont à leur
 *     largeur NATURELLE (serrées autour du texte) et l'encadré
 *     métier|ville prend TOUTE la place restante (flex-1) — champs larges,
 *     pilules compactes, rendu équilibré.
 *   • 768–1023 px : réparti en parts (encadré 5 / filtres 6) — INCHANGÉ.
 * En dessous de 660 px (smartphone étroit) et à partir de 1024 px
 * (colonne liste étroite du mode double) : deux rangées.
 */
export function RechercheCompacte({
  metierActuel,
  villeActuelle,
  filtres,
}: {
  metierActuel: string;
  villeActuelle: {
    nom: string;
    slug: string;
    code_insee: string;
    code_postal: string;
  };
  filtres: {
    urgence: boolean;
    nuit: boolean;
    weekend: boolean;
    type: TypeArtisan;
  };
}) {
  const router = useRouter();
  const [metier, setMetier] = useState(metierActuel);
  const [ville, setVille] = useState<VilleChoisie | null>(villeActuelle);
  // Métier ouvert → l'encadré partagé passe au rose (comme la ville
  // le fait via focus-within)
  const [metierOuvert, setMetierOuvert] = useState(false);
  const [actifs, setActifs] = useState<Record<CleFiltre, boolean>>({
    urgence: filtres.urgence,
    nuit: filtres.nuit,
    weekend: filtres.weekend,
  });
  const [type, setType] = useState<TypeArtisan>(filtres.type);
  const [fenetreFiltre, setFenetreFiltre] = useState(false);
  // Le champ ville dépose ici sa façon de valider (voir ChampVille) :
  // la loupe posée dans le champ n'a plus qu'à l'appeler.
  const validerVille = useRef<(() => void) | null>(null);

  // LE MOTEUR SUIT TOUJOURS LA RECHERCHE AFFICHÉE
  // ---------------------------------------------
  // Les champs ci-dessus sont initialisés avec la recherche en cours,
  // puis vivent leur vie : le visiteur peut changer de métier, de ville
  // ou de filtre AVANT de relancer. Mais quand c'est la PAGE qui change
  // de recherche sans passer par ce formulaire — lien « Réessayez sans
  // filtre », bouton Précédent du navigateur, lien interne… — React
  // conserve l'état d'un composant qui reste monté : les pilules
  // restaient donc allumées alors que les filtres n'étaient plus
  // appliqués, et la liste affichée les contredisait.
  // On compare ici la recherche affichée à celle qu'on avait relevée :
  // dès qu'elle change, les champs se recalent dessus. C'est la façon
  // recommandée d'ajuster un état sur ses propriétés — un rendu de plus,
  // aucun clignotement, et surtout AUCUNE désynchronisation possible
  // entre ce que le moteur montre et la recherche réellement affichée.
  const rechercheAffichee = `${metierActuel}|${villeActuelle.slug}|${filtres.urgence}|${filtres.nuit}|${filtres.weekend}|${filtres.type}`;
  const [rechercheRelevee, setRechercheRelevee] = useState(rechercheAffichee);
  if (rechercheAffichee !== rechercheRelevee) {
    setRechercheRelevee(rechercheAffichee);
    setMetier(metierActuel);
    setVille(villeActuelle);
    setActifs({
      urgence: filtres.urgence,
      nuit: filtres.nuit,
      weekend: filtres.weekend,
    });
    setType(filtres.type);
  }

  // RECHERCHE INSTANTANÉE
  // ---------------------
  // Plus de « on choisit puis on valide » : CHAQUE interaction relance
  // la recherche tout de suite — métier, filtre, ville, type d'artisan.
  // On passe toujours par l'ADRESSE (router.push) : la page se met à
  // jour, et un rafraîchissement comme un lien partagé retrouvent
  // exactement la même recherche. Chaque fonction reçoit la valeur
  // qu'elle vient de poser : on ne dépend pas d'un état pas encore
  // rafraîchi.
  function naviguer(
    versMetier: string,
    versVille: VilleChoisie | null,
    versFiltres: Record<CleFiltre, boolean>,
    versType: TypeArtisan
  ) {
    if (!versMetier || !versVille) return;

    memoriserRecherche({
      metier: versMetier,
      villeNom: versVille.nom,
      villeSlug: versVille.slug,
      codeInsee: versVille.code_insee,
    });

    const parametres = new URLSearchParams();
    for (const { cle } of FILTRES) {
      if (versFiltres[cle]) parametres.set(cle, "1");
    }
    if (versType !== "tous") parametres.set("type", versType);
    const suffixe = parametres.size > 0 ? `?${parametres.toString()}` : "";

    router.push(`/${versMetier}/${versVille.slug}${suffixe}`);
  }

  function changerMetier(nouveau: string) {
    setMetier(nouveau);
    naviguer(nouveau, ville, actifs, type);
  }

  function choisirVille(nouvelle: VilleChoisie | null) {
    setVille(nouvelle);
    // Une ville EFFACÉE (le champ se vide pour une nouvelle saisie) ne
    // relance rien : on attend le nouveau choix.
    if (nouvelle) naviguer(metier, nouvelle, actifs, type);
  }

  function basculerFiltre(cle: CleFiltre) {
    const suivants = { ...actifs, [cle]: !actifs[cle] };
    setActifs(suivants);
    naviguer(metier, ville, suivants, type);
  }

  function changerType(nouveau: TypeArtisan) {
    setType(nouveau);
    naviguer(metier, ville, actifs, nouveau);
  }

  /** LA TOUCHE ENTRÉE dans le champ ville : elle retient la première
      suggestion ouverte (ou reconfirme la ville déjà choisie), ce qui
      relance la recherche.

      Il n'y a plus de LOUPE ici : la ville se choisit obligatoirement
      dans la liste de suggestions, et les cartes se mettent à jour
      TOUTES SEULES au moment du choix (voir `choisirVille`). Un bouton
      qui ne fait que répéter ce qui vient de se produire n'a aucune
      raison d'occuper la place — et cette place revient au champ. */
  function validerLaVille() {
    validerVille.current?.();
    if (ville) naviguer(metier, ville, actifs, type);
  }

  function relancer(evenement: React.FormEvent) {
    // La touche Entrée dans un champ : même chose que la loupe.
    evenement.preventDefault();
    validerLaVille();
  }

  return (
    <form
      onSubmit={relancer}
      className="flex flex-col gap-2 min-[660px]:max-lg:flex-row min-[660px]:max-lg:items-stretch min-[660px]:max-lg:gap-2"
      aria-label="Modifier la recherche"
    >
      {/* Rangée 1 : métier | ville dans un seul encadré. Contour ROSE
          quand le métier OU la ville est ouvert/actif (métier via
          l'état, ville via focus-within), GRIS sinon.
          768–1023 px : cet encadré prend ~45 % de la ligne unique. */}
      <div
        className={`relative flex items-stretch min-h-[50px] rounded-2xl border bg-fond min-[660px]:max-lg:flex-1 min-[660px]:max-lg:min-w-0 md:max-lg:max-w-[440px] ${
          metierOuvert
            ? "border-primaire ring-2 ring-primaire/25"
            : "border-bordure-champ focus-within:border-primaire focus-within:ring-2 focus-within:ring-primaire/25"
        }`}
      >
        {/* RÉPARTITION MÉTIER / VILLE — le métier reçoit 3 parts, la
            ville 2 : le métier reste le plus large (son libellé le plus
            long, « Plombier & Chauffagiste », demande 220 px) sans jamais
            AFFAMER la ville. Chacun a un PLANCHER — 150 px pour le
            métier, 130 px pour la ville : sur les fenêtres les plus
            étroites, les deux se resserrent ENSEMBLE au lieu que la ville
            se réduise à un timbre-poste (elle tombait à 48 px vers 660,
            à 109 px vers 768). Padding resserré (compact) des deux
            côtés : ~16 px de largeur utile gagnés sur les libellés. */}
        {/* PLANCHERS selon la mise en page :
            • DEUX RANGÉES (< 660 px et ≥ 1024 px) — l'encadré occupe
              toute la largeur : le métier garde ses 220 px, largeur
              exacte de « Plombier & Chauffagiste » en entier ;
            • UNE SEULE LIGNE (660–1023) — la place est partagée avec les
              filtres : le plancher descend à 150 px, sinon la ville
              serait écrasée. Le libellé le plus long se coupe alors
              entre 660 et 729 px, et seulement lui. */}
        <div className="flex-[3] min-w-[220px] min-[660px]:max-md:min-w-[150px] md:max-lg:min-w-[230px]">
          <ChampMetier
            valeur={metier}
            surChangement={changerMetier}
            sansBordure
            hauteur="h-full min-h-[48px]"
            taillePolice="text-base"
            onOuvertureChange={setMetierOuvert}
            compact
          />
        </div>

        {/* Le trait vertical entre les deux sélecteurs */}
        <span aria-hidden className="w-px self-stretch bg-bordure-champ my-2" />

        <div className="flex-[2] min-w-[64px] min-[660px]:min-w-[130px]">
          <ChampVille
            surChoix={choisirVille}
            actionValider={validerVille}
            etiquette={null}
            texteIndicatif="Quelle ville ?"
            sansBordure
            villeInitiale={villeActuelle}
            // Moteur des RÉSULTATS : le champ affiche « Écully », sans le
            // code postal (la place est comptée). La liste de suggestions
            // le garde pour distinguer deux communes de même nom.
            avecCodePostal={false}
            compact
          />
        </div>

      </div>

      {/* Rangée 2 : les trois filtres puis la loupe — même rayon
          d'arrondi que l'encadré des champs du dessus. Sur
          SMARTPHONE (moins de 640 px) la rangée est plus basse
          (40 px) pour alléger le haut de page ; à partir des
          tablettes, hauteur d'origine (50 px). */}
      <div
        // SUR UNE SEULE LIGNE (660–1023) : les pilules prennent leur
        // largeur NATURELLE (flex-none) — de 660 à 1023, et plus
        // seulement jusqu'à 767. Auparavant, à partir de 768, elles se
        // partageaient une part fixe de la ligne et recevaient BIEN PLUS
        // que leur texte ne demande (122 px pour « Le week-end » qui en
        // réclame 99) : tout ce surplus était pris sur le champ ville,
        // qui retombait de 155 à 109 px en passant 767 → 768. Le
        // surplus revient désormais à l'encadré métier|ville.
        className="flex items-stretch gap-1.5 min-[660px]:max-md:flex-none min-[660px]:max-md:min-w-0 md:max-lg:flex-1 md:max-lg:min-w-0 min-[660px]:max-lg:items-end"
        role="group"
        aria-label="Filtres"
      >
        {FILTRES.map(({ cle, label }) => (
          <button
            key={cle}
            type="button"
            aria-pressed={actifs[cle]}
            onClick={() => basculerFiltre(cle)}
            className={`flex-auto min-[660px]:max-md:flex-none min-h-[40px] min-[660px]:max-lg:h-10 rounded-2xl border px-2 min-[660px]:max-md:px-3 md:max-lg:px-4 md:max-lg:flex-auto md:max-lg:shrink-0 text-[12px] font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
              actifs[cle]
                ? "border-primaire bg-primaire-clair text-primaire-fonce"
                : // Inactif : fond BLANC + MÊME contour foncé que les
                  // champs métier/ville au-dessus (border-bordure-champ) —
                  // les 5 zones du moteur ont un contour identique.
                  "border-bordure-champ bg-fond text-encre"
            }`}
          >
            {label}
          </button>
        ))}

        {/* LE BOUTON FILTRE — à la place de l'ancienne loupe, qui n'a
            plus de rôle depuis que la recherche est instantanée (sa
            fonction est reprise par la loupe du champ ville). Il garde
            EXACTEMENT le gabarit libéré (46 px puis 72 × 40) pour que la
            rangée ne bouge pas d'un pixel, mais il prend l'habillage des
            pilules voisines : fond blanc, contour gris, icône foncée —
            et le rose des pilules actives dès qu'un type d'artisan est
            choisi. */}
        <button
          type="button"
          onClick={() => setFenetreFiltre(true)}
          aria-haspopup="dialog"
          // PAS d'`aria-pressed` ici : ce bouton n'est pas un
          // interrupteur, il OUVRE une fenêtre (les trois pilules
          // voisines, elles, en sont). Le filtre en cours est annoncé
          // dans son libellé — un lecteur d'écran l'entend, là où l'œil
          // voit le rose.
          aria-label={
            type === "tous"
              ? "Filtrer les résultats"
              : `Filtrer les résultats — ${
                  TYPES.find(({ cle }) => cle === type)?.label ?? ""
                }`
          }
          className={`w-[46px] min-w-[46px] min-h-[40px] min-[660px]:h-10 min-[660px]:w-[72px] min-[660px]:min-w-[72px] shrink-0 rounded-2xl border flex items-center justify-center transition-colors ${
            type !== "tous"
              ? "border-primaire bg-primaire-clair text-primaire-fonce"
              : "border-bordure-champ bg-fond text-encre"
          }`}
        >
          <IconeReglages taille={19} />
        </button>
      </div>

      {/* ----- « Filtrer les résultats » : LA COQUE COMMUNE ----- */}
      <FenetreModale
        ouvert={fenetreFiltre}
        surFermeture={() => setFenetreFiltre(false)}
        idTitre="titre-filtre"
        largeur="courte"
      >
        <>
          <EnteteModale
            idTitre="titre-filtre"
            titre="Filtrer les résultats"
            surFermeture={() => setFenetreFiltre(false)}
          />

          {/* Un seul choix : des boutons ronds, comme la fenêtre de
              signalement. Le clic met les résultats à jour tout de
              suite — la fenêtre reste ouverte, on voit le filtre
              basculer avant de refermer. */}
          <fieldset className="mt-6 flex flex-col gap-2 pb-1">
            <legend className="sr-only">Type d&apos;artisan</legend>
            {TYPES.map(({ cle, label }) => (
              <label
                key={cle}
                className="flex items-center gap-2.5 text-sm min-h-[44px] cursor-pointer"
              >
                <input
                  type="radio"
                  name="type-artisan"
                  value={cle}
                  checked={type === cle}
                  onChange={() => changerType(cle)}
                  className="w-4.5 h-4.5 shrink-0 accent-(--rw-primaire)"
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        </>
      </FenetreModale>
    </form>
  );
}
