import Link from "next/link";
import { IconeHorloge } from "@/components/Icones";
import { PastilleEvenement } from "@/components/PastilleEvenement";

/**
 * ██ LE LIEN D'E-MAIL PÉRIMÉ (passe nº 828) ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : un lien expiré ou déjà cliqué renvoyait
 * À L'ACCUEIL avec un `?erreur=connexion` que personne ne lit. On
 * arrivait sur la page d'accueil sans savoir pourquoi, et sans rien à
 * faire.
 *
 * CE QUE C'EST : l'écran qui le dit, et qui donne la suite. Il vit ICI
 * et pas dans une page, parce qu'il sert à DEUX endroits (piège
 * nº 378) :
 *  · la page /lien-expire, où /auth/callback envoie quand la
 *    vérification du jeton échoue ;
 *  · la page du nouveau mot de passe, quand on l'ouvre sans session
 *    (un lien recliqué, un signet gardé).
 *
 * LE PATRON EST CELUI DE L'ÉCRAN DE SUCCÈS DE LA PAGE CONTACT : la
 * pastille, le titre, une phrase, puis le geste — mêmes airs (`mt-5`,
 * `mt-3`, `mt-7`), même échelle de titre. Seul le TON change : la
 * coche VERTE du succès devient l'horloge GRISE (`info`) — rien n'a
 * échoué, rien n'a réussi non plus, le lien a simplement fait son
 * temps. C'est l'échelle de couleurs de la nº 811, sans invention.
 */
export function LienExpire() {
  return (
    <div className="mt-10 text-center">
      <PastilleEvenement ton="info" symbole={IconeHorloge} classe="mx-auto" />
      <h1 className="mt-5 text-[clamp(1.3rem,3vw,1.6rem)] font-bold text-sombre-texte">
        This link has expired or was already used
      </h1>
      <p className="mt-3 text-sombre-texte-doux leading-relaxed">
        For your security, these links only work once, and not for long.
        Ask for a new one — it takes a minute.
      </p>
      {/*  LE GESTE MÈNE AU FORMULAIRE « Forgot your password? » : c'est
           l'onglet de CONNEXION, où vivent le champ d'adresse et le
           lien qui redemande un e-mail. `?mode=connexion` ouvre cet
           onglet dès la première image (le paramètre existe depuis la
           nº 397 et est filtré par la page).
           ⚠️ AUX MESURES DE LA CHARTE, comme le bouton de second rang
           de la page Contact : 40 px de haut, 14 px de texte, fond
           `sombre-eleve` — le rose reste à l'action finale. */}
      <Link
        href="/devenir-tatoueur?mode=connexion"
        className="mt-7 inline-flex items-center justify-center rounded-full
                   px-5 min-h-[40px] text-[14px] bg-sombre-eleve
                   hover:bg-sombre-haut text-white font-semibold
                   transition-colors"
      >
        Request a new link
      </Link>
    </div>
  );
}
