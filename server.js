// Serveur statique du site La Fleur d'Or, sans dépendance (Node.js 18 ou plus).
// Il ne sert que la page et le dossier assets/ : les fichiers de travail
// (PRODUCT.md, DESIGN.md, .impeccable, .claude, .git…) ne sont jamais exposés.
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const RACINE = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOTE = process.env.HOST || "0.0.0.0";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
};
const COMPRESSIBLES = new Set([".html", ".css", ".js", ".json", ".svg", ".md"]);

function fichierDemande(url) {
  let chemin;
  try {
    chemin = decodeURIComponent(new URL(url, "http://localhost").pathname);
  } catch {
    return null;
  }
  if (chemin === "/" || chemin === "/index.html") return path.join(RACINE, "index.html");
  if (!chemin.startsWith("/assets/")) return null;
  const complet = path.normalize(path.join(RACINE, chemin));
  // Refuse toute sortie du dossier assets (../, liens, etc.)
  if (!complet.startsWith(path.join(RACINE, "assets") + path.sep)) return null;
  return complet;
}

function pasTrouve(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Page introuvable.\n");
}

const serveur = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    res.end("Méthode non autorisée.\n");
    return;
  }

  if (/^\/admin(?:[/?#]|$)/.test(req.url || "")) {
    res.writeHead(501, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Le panneau d'administration a besoin de PHP : lancez le site avec XAMPP (http://localhost/fleur-dor/admin/).\n");
    return;
  }

  const fichier = fichierDemande(req.url);
  if (!fichier) return pasTrouve(res);

  fs.stat(fichier, (err, infos) => {
    if (err || !infos.isFile()) return pasTrouve(res);

    const ext = path.extname(fichier).toLowerCase();
    const etag = `W/"${infos.size.toString(16)}-${Math.floor(infos.mtimeMs).toString(16)}"`;
    const entetes = {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      ETag: etag,
      "Last-Modified": infos.mtime.toUTCString(),
      // La page se revalide à chaque visite ; les fichiers d'assets une heure.
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, entetes);
      res.end();
      return;
    }

    const gzip = COMPRESSIBLES.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    if (gzip) {
      entetes["Content-Encoding"] = "gzip";
      entetes.Vary = "Accept-Encoding";
    } else {
      entetes["Content-Length"] = infos.size;
    }
    res.writeHead(200, entetes);
    if (req.method === "HEAD") return res.end();

    const flux = fs.createReadStream(fichier);
    flux.on("error", () => res.destroy());
    if (gzip) flux.pipe(zlib.createGzip()).pipe(res);
    else flux.pipe(res);
  });
});

serveur.listen(PORT, HOTE, () => {
  console.log(`La Fleur d'Or : http://localhost:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => serveur.close(() => process.exit(0)));
}
