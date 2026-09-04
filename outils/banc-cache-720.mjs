/**
 * ██ nº 720 — LE BANC DU CACHE : que se passe-t-il à la DEUXIÈME visite ? ██
 * ==================================================================
 * IL N'OBSERVE, ET NE CHANGE RIEN — ni au site, ni aux fichiers. On
 * ouvre une page, on ferme l'onglet, on rouvre la même page dans le
 * MÊME profil (le cache et le service worker survivent), et l'on
 * regarde, fichier par fichier :
 *  · ce qui est REPRIS sans toucher au réseau (servi par le cache
 *    HTTP, ou par le service worker) ;
 *  · ce qui est REVALIDÉ — un aller-retour pour s'entendre dire « rien
 *    n'a changé » (304). Le corps ne repart pas, mais la latence, si ;
 *  · ce qui est RETÉLÉCHARGÉ en entier.
 *
 * ⚠️ DEUX PIÈGES DE MESURE, PAYÉS COMPTANT AVANT D'ÉCRIRE CE FICHIER.
 *
 * 1. UN PROFIL SUR DISQUE EST OBLIGATOIRE. Un navigateur lancé sans
 *    dossier de profil n'a pas de cache HTTP durable : tout paraît
 *    retéléchargé, y compris les fichiers marqués « valables un an ».
 *    D'où `launchPersistentContext`, et non `launch` + `newContext`.
 *
 * 2. AUCUNE INTERCEPTION (`ctx.route`). Détourner ne serait-ce qu'UNE
 *    adresse allume l'interception du protocole de débogage, et celle-ci
 *    COURT-CIRCUITE LE CACHE DISQUE DU NAVIGATEUR — pour toutes les
 *    requêtes, pas seulement celle qu'on visait. Mesuré : avec une route
 *    sur `/sw.js`, 0 fichier repris ; avec l'option native
 *    `serviceWorkers: "block"`, 24 fichiers repris et 0 octet réseau.
 *    C'est pourquoi le monde « sans SW » se règle par cette OPTION.
 *
 * ⚠️ CE QU'IL MESURE, ET SEULEMENT CELA : le serveur local
 * (`npm run start`). En ligne, l'hébergeur ajoute son propre cache
 * devant — les consignes qu'il transmet sont les mêmes, les temps non.
 *
 * ══ COMMENT S'EN SERVIR ══
 *     BANC_PLAYWRIGHT=/chemin/vers/playwright-core/index.js \
 *       BANC_PROFILS=/un/dossier/jetable \
 *       node outils/banc-cache-720.mjs
 */

import { rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BANC_BASE ?? "http://127.0.0.1:3000";

let chromium;
try {
  //  ⚠️ LES DEUX FORMES, comme banc-vitesse : selon la façon dont le
  //  paquet est chargé, `chromium` est en haut ou sous `default`.
  const paquet = await import(process.env.BANC_PLAYWRIGHT ?? "playwright-core");
  chromium = paquet.chromium ?? paquet.default?.chromium;
  if (!chromium) throw new Error("chromium introuvable dans le paquet");
} catch {
  console.error(
    "✖ Ce banc a besoin de « playwright-core ».\n" +
      "   npm i --no-save playwright-core\n" +
      "   ou BANC_PLAYWRIGHT=/chemin/vers/playwright-core/index.js node outils/banc-cache-720.mjs"
  );
  process.exit(1);
}
const NAVIGATEUR = process.env.BANC_NAVIGATEUR ?? "/opt/pw-browsers/chromium";

/** À quelle famille appartient une adresse ? */
function famille(url) {
  const { pathname, searchParams } = new URL(url);
  if (pathname.startsWith("/_next/static/media/")) return "polices et médias";
  if (pathname.endsWith(".css")) return "feuille de style";
  if (pathname.startsWith("/_next/static/")) return "code JS";
  if (pathname.startsWith("/_next/image")) return "images (optimiseur)";
  if (pathname.startsWith("/api/")) return "routes API";
  if (pathname === "/sw.js" || pathname.endsWith(".webmanifest")) return "service worker";
  if (/\.(png|jpe?g|webp|avif|svg|gif|ico)$/i.test(pathname)) return "images statiques";
  if (searchParams.has("_rsc")) return "données de navigation";
  return "pages (HTML)";
}

const PAGES = [
  { nom: "accueil", chemin: "/" },
  { nom: "recherche", chemin: "/search?nature=tatouage" },
];

/*  ██ DEUX MONDES, POUR SÉPARER LES DEUX MÉMOIRES ██
    « avec SW » = le site tel qu'il est, ses deux mémoires en action.
    « sans SW » = le cache HTTP tout seul, le service worker empêché de
    s'installer. La DIFFÉRENCE, c'est exactement le travail que fait le
    service worker — et donc aussi ce que le visiteur retéléchargerait
    le jour d'un déploiement, puisque l'activation jette tous ses
    caches. */
const MONDES = [
  { nom: "avec SW", options: {} },
  { nom: "sans SW", options: { serviceWorkers: "block" } },
];

/*  ██ ON MESURE DANS LA PAGE, PAS AU BORD DU NAVIGATEUR ██
    Écouter les réponses depuis l'extérieur compte DEUX FOIS quand un
    service worker est là : sa réponse à la page, PUIS la requête
    réseau qu'il lance lui-même. La page, elle, ne connaît qu'une
    entrée par ressource — et elle dit ce qui compte vraiment :
     · `transferSize === 0` → RIEN n'est allé sur le réseau ;
     · `transferSize` petit avec un corps plus gros → un aller-retour
       de revalidation (304), le corps n'a pas repassé ;
     · sinon → retéléchargé en entier.
    On joint le DOCUMENT lui-même (entrée « navigation »), que la liste
    des ressources ne contient pas : c'est la page HTML. */
const RELEVE = `(() => {
  const doc = performance.getEntriesByType("navigation")[0];
  const lignes = performance.getEntriesByType("resource").map((r) => ({
    url: r.name, transfere: r.transferSize, corps: r.encodedBodySize,
  }));
  if (doc) lignes.unshift({ url: location.href, transfere: doc.transferSize, corps: doc.encodedBodySize });
  return lignes;
})()`;

const racineProfils =
  process.env.BANC_PROFILS ?? (await mkdtemp(join(tmpdir(), "banc-cache-720-")));

for (const page_ of PAGES)
  for (const monde of MONDES) {
    //  UN PROFIL NEUF par cas, mais SUR DISQUE : les deux visites le
    //  partagent, c'est ce qui fait le « déjà vu » de la seconde.
    const profil = join(racineProfils, `${page_.nom}-${monde.nom.replace(/\s/g, "")}`);
    await rm(profil, { recursive: true, force: true });
    const ctx = await chromium.launchPersistentContext(profil, {
      executablePath: NAVIGATEUR,
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ...monde.options,
    });

    /*  Quand le relais de mesure est devant (BANC_PHASES=1), on lui pose
        une étiquette avant chaque visite : son journal se lit alors
        phase par phase au lieu d'un seul bloc. Sans relais, on ne
        demande rien. */
    const marquerPhase = async (nom) => {
      if (!process.env.BANC_PHASES) return;
      try {
        await ctx.request.get(`${BASE}/__phase?nom=${encodeURIComponent(nom)}`);
      } catch {}
    };

    //  ── PREMIÈRE VISITE ──
    await marquerPhase(`${page_.nom} · ${monde.nom} · visite 1`);
    const onglet1 = await ctx.newPage();
    await onglet1.goto(BASE + page_.chemin, { waitUntil: "load", timeout: 60000 });
    await onglet1.waitForTimeout(3500);
    const brutes1 = await onglet1.evaluate(RELEVE);
    await onglet1.close();

    //  ── DEUXIÈME VISITE, même profil ──
    await marquerPhase(`${page_.nom} · ${monde.nom} · VISITE 2`);
    const onglet2 = await ctx.newPage();
    await onglet2.goto(BASE + page_.chemin, { waitUntil: "load", timeout: 60000 });
    await onglet2.waitForTimeout(3500);
    const brutes2 = await onglet2.evaluate(RELEVE);
    const swActif = await onglet2.evaluate(
      "Boolean(navigator.serviceWorker && navigator.serviceWorker.controller)"
    );
    await onglet2.close();

    const habiller = (lignes) =>
      lignes.map((l) => ({
        ...l,
        famille: famille(l.url),
        octets: l.corps,
        //  RIEN sur le réseau : le cache (HTTP ou service worker) a servi.
        reprise: l.transfere === 0,
        //  Un petit transfert pour un corps déjà connu : une revalidation.
        revalidee: l.transfere > 0 && l.transfere < 500 && l.corps > 0,
      }));
    const premiere = habiller(brutes1);
    const seconde = habiller(brutes2);
    const reseau = (lignes) => lignes.reduce((s, l) => s + l.transfere, 0);

    console.log(`\n════════ ${page_.nom} · ${monde.nom} ════════`);
    console.log(
      `  1re visite : ${premiere.length} fichiers · ` +
        `${Math.round(reseau(premiere) / 1024)} Ko sur le réseau`
    );
    console.log(
      `  2e visite  : ${seconde.length} fichiers · ` +
        `${Math.round(reseau(seconde) / 1024)} Ko sur le réseau · ` +
        `service worker ${swActif ? "ACTIF" : "absent"}`
    );

    //  Le détail par famille, à la SECONDE visite : c'est là que tout se
    //  joue. Une seule colonne compte vraiment — les OCTETS RÉSEAU,
    //  c'est-à-dire ce que le visiteur repaie pour revenir.
    const familles = new Map();
    for (const ligne of seconde) {
      const f = familles.get(ligne.famille) ?? {
        n: 0,
        octets: 0,
        reprises: 0,
        revalidees: 0,
        retelechargees: 0,
        octetsReseau: 0,
      };
      f.n += 1;
      f.octets += ligne.octets;
      f.octetsReseau += ligne.transfere;
      if (ligne.reprise) f.reprises += 1;
      else if (ligne.revalidee) f.revalidees += 1;
      else f.retelechargees += 1;
      familles.set(ligne.famille, f);
    }
    console.log("  ── à la 2e visite, par famille ──");
    console.log(
      "   famille                fich.   poids  repris  reval.  retéléch.   octets réseau"
    );
    for (const [nom, f] of [...familles].sort(
      (a, b) => b[1].octetsReseau - a[1].octetsReseau
    )) {
      console.log(
        `   ${nom.padEnd(22)} ${String(f.n).padStart(4)} ` +
          `${(Math.round(f.octets / 102.4) / 10).toFixed(1).padStart(7)}K ` +
          `${String(f.reprises).padStart(7)} ${String(f.revalidees).padStart(7)} ` +
          `${String(f.retelechargees).padStart(10)} ` +
          `${(Math.round(f.octetsReseau / 102.4) / 10).toFixed(1).padStart(15)}K`
      );
    }
    const total = [...familles.values()].reduce(
      (s, f) => ({ octets: s.octets + f.octets, reseau: s.reseau + f.octetsReseau }),
      { octets: 0, reseau: 0 }
    );
    console.log(
      `   ${"TOTAL".padEnd(22)} ${String(seconde.length).padStart(4)} ` +
        `${(Math.round(total.octets / 102.4) / 10).toFixed(1).padStart(7)}K ` +
        `${" ".repeat(26)}${(Math.round(total.reseau / 102.4) / 10)
          .toFixed(1)
          .padStart(15)}K`
    );

    //  ── LE DÉTAIL DES IMAGES DE `public/` ──
    //  Cette famille est la seule dont la consigne serveur (`max-age=0`)
    //  contredit la nature (des fichiers qui ne bougent jamais) : on
    //  regarde donc CHAQUE fichier, pas seulement le total.
    const images = seconde.filter((l) => l.famille === "images statiques");
    if (images.length) {
      console.log("  ── le détail des images de public/ ──");
      for (const l of images) {
        console.log(
          `   ${l.reprise ? "repris    " : l.revalidee ? "revalidé  " : "RETÉLÉCH. "}` +
            `${(Math.round(l.transfere / 102.4) / 10).toFixed(1).padStart(7)}K ` +
            `(corps ${(Math.round(l.corps / 102.4) / 10).toFixed(1)}K)  ` +
            `${l.url.replace(BASE, "").slice(0, 60)}`
        );
      }
    }

    //  ── LE DÉTAIL DES FICHIERS QUI REPASSENT SUR LE RÉSEAU ──
    //  Le tableau dit COMBIEN ; cette liste dit LESQUELS, et c'est elle
    //  qui nomme les défauts.
    const coupables = seconde
      .filter((l) => !l.reprise && l.transfere > 0)
      .sort((a, b) => b.transfere - a.transfere)
      .slice(0, 12);
    if (coupables.length) {
      console.log("  ── ce qui repasse sur le réseau (les 12 plus lourds) ──");
      for (const l of coupables) {
        const court = l.url.replace(BASE, "").slice(0, 60);
        console.log(
          `   ${l.revalidee ? "revalidé  " : "RETÉLÉCH. "}` +
            `${(Math.round(l.transfere / 102.4) / 10).toFixed(1).padStart(7)}K ` +
            `(corps ${(Math.round(l.corps / 102.4) / 10).toFixed(1)}K)  ${court}`
        );
      }
    }
    await ctx.close();
  }
