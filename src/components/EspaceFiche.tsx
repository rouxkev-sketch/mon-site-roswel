"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FormulaireFiche } from "@/components/FormulaireFiche";

/**
 * L'ENVELOPPE DU FORMULAIRE — celle qui garantit un formulaire VIERGE
 * ====================================================================
 * ⚠️ ELLE CORRIGE UN VRAI BUG, elle n'est pas une politesse
 * d'architecture. « Ajouter une fiche », cliqué depuis le formulaire
 * de MODIFICATION d'une autre fiche, ne faisait RIEN : l'adresse
 * passait bien à `?fiche=nouvelle`, mais l'écran ne bougeait pas.
 *
 * LA CAUSE : c'est la MÊME page. Next ne fait que changer les
 * paramètres d'adresse ; React reconnaît le même `<FormulaireFiche />`
 * au même endroit de l'arbre, le RÉUTILISE, et ses trente états
 * (nom, bio, photos, styles, modes d'exercice, verrou du bloc 1, fiche
 * chargée…) restent exactement ce qu'ils étaient. Le formulaire
 * n'était pas « rechargé sans données » : il n'était pas rechargé du
 * tout.
 *
 * LE REMÈDE : une CLÉ REACT qui suit la fiche demandée. Changer de
 * clé, c'est démonter l'ancien formulaire et en monter un neuf —
 * aucun état ne traverse. C'est structurel : un champ ajouté demain
 * sera vierge lui aussi, sans qu'on ait pensé à le remettre à zéro.
 * Une liste de remises à zéro écrite à la main, elle, aurait vieilli
 * dès le prochain champ.
 *
 * ET LE CAS OÙ L'ADRESSE NE CHANGE PAS : déjà sur `?fiche=nouvelle`,
 * cliquer « Ajouter une fiche » ne navigue nulle part — le menu envoie
 * alors l'événement `yokofolio-fiche-neuve`, et la génération
 * s'incrémente. Même effet, même remontage.
 */
export function EspaceFiche() {
  const parametres = useSearchParams();
  /** `nouvelle`, un identifiant, ou « la dernière retenue ». */
  const ficheDemandee = parametres.get("fiche") ?? "derniere";
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    function surFicheNeuve() {
      setGeneration((rang) => rang + 1);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    window.addEventListener("yokofolio-fiche-neuve", surFicheNeuve);
    return () =>
      window.removeEventListener("yokofolio-fiche-neuve", surFicheNeuve);
  }, []);

  return <FormulaireFiche key={`${ficheDemandee}#${generation}`} />;
}
