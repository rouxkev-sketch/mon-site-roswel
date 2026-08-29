/**
 * ██ nº 720 — LE RELAIS QUI COMPTE CE QUI TOUCHE VRAIMENT LE SERVEUR ██
 * ==================================================================
 * IL N'OBSERVE, ET NE CHANGE RIEN. Il se place entre le navigateur et
 * le serveur du site, transmet tout à l'identique — en-têtes compris,
 * dans les deux sens — et tient un journal.
 *
 * POURQUOI IL EXISTE, et c'est tout le point de la mesure.
 * Depuis la page, `performance.getEntriesByType("resource")` ne dit pas
 * toute la vérité quand un service worker est là : ce que la page voit,
 * c'est la réponse du SERVICE WORKER, pas le voyage que celui-ci a
 * peut-être fait derrière. Un fichier peut apparaître « gratuit » dans
 * la page alors que le service worker est allé le chercher.
 * Ici, il n'y a rien à interpréter : ce qui est écrit dans ce journal a
 * touché le serveur, ce qui n'y est pas ne l'a pas touché.
 *
 * On note aussi le STATUT rendu : 200 = le corps est reparti ;
 * 304 = un aller-retour pour s'entendre dire « rien n'a changé ».
 *
 * ══ COMMENT S'EN SERVIR ══
 *     node outils/relais-mesure-720.mjs            # écoute 3001 → 3000
 *     kill -USR2 <pid>                             # écrit le bilan
 * puis lancer le banc contre le relais :
 *     BANC_BASE=http://127.0.0.1:3001 node outils/banc-cache-720.mjs
 */

import { createServer, request as requete } from "node:http";

const PORT = Number(process.env.RELAIS_PORT ?? 3001);
const CIBLE_HOTE = process.env.RELAIS_HOTE ?? "127.0.0.1";
const CIBLE_PORT = Number(process.env.RELAIS_CIBLE ?? 3000);

/** Le journal : une ligne par requête reçue, dans l'ordre. */
const journal = [];
/** Une étiquette posée par le banc pour séparer les phases. */
let phase = "(sans phase)";

const serveur = createServer((entrante, sortante) => {
  //  Une adresse réservée au banc : elle change l'étiquette du journal
  //  et ne va jamais au serveur du site.
  if (entrante.url.startsWith("/__phase")) {
    phase = new URL(entrante.url, "http://relais").searchParams.get("nom") ?? "?";
    journal.push({ phase: "──────", url: phase, statut: 0, octets: 0 });
    sortante.writeHead(204, { "Access-Control-Allow-Origin": "*" });
    sortante.end();
    return;
  }

  const relais = requete(
    {
      host: CIBLE_HOTE,
      port: CIBLE_PORT,
      path: entrante.url,
      method: entrante.method,
      //  À L'IDENTIQUE : c'est ce qui rend la mesure honnête. Les
      //  en-têtes conditionnels du navigateur (`if-none-match`,
      //  `if-modified-since`) doivent arriver intacts, sinon le serveur
      //  ne pourrait jamais répondre 304 et l'on mesurerait notre
      //  propre relais au lieu du site.
      headers: { ...entrante.headers, host: `${CIBLE_HOTE}:${CIBLE_PORT}` },
    },
    (reponse) => {
      let octets = 0;
      reponse.on("data", (morceau) => (octets += morceau.length));
      reponse.on("end", () =>
        journal.push({
          phase,
          url: entrante.url,
          statut: reponse.statusCode,
          octets,
          consigne: reponse.headers["cache-control"] ?? "(aucune)",
        })
      );
      sortante.writeHead(reponse.statusCode, reponse.headers);
      reponse.pipe(sortante);
    }
  );
  relais.on("error", () => {
    sortante.writeHead(502);
    sortante.end("relais : serveur injoignable");
  });
  entrante.pipe(relais);
});

serveur.listen(PORT, () =>
  console.log(`relais de mesure : ${PORT} → ${CIBLE_HOTE}:${CIBLE_PORT}`)
);

/** Le bilan, à la demande — `kill -USR2 <pid>`. */
process.on("SIGUSR2", () => {
  console.log(`\n═══ CE QUI A TOUCHÉ LE SERVEUR (${journal.length} requêtes) ═══`);
  for (const l of journal) {
    if (l.statut === 0) {
      console.log(`\n──────── ${l.url} ────────`);
      continue;
    }
    console.log(
      `  ${String(l.statut).padStart(3)} ` +
        `${(Math.round(l.octets / 102.4) / 10).toFixed(1).padStart(7)}K  ` +
        `${l.url.slice(0, 58).padEnd(58)} ${l.consigne}`
    );
  }
  journal.length = 0;
});
