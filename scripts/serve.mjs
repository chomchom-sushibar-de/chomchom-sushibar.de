import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const portIndex = process.argv.indexOf("--port");
const rootIndex = process.argv.indexOf("--root");
const port = portIndex === -1 ? 4173 : Number(process.argv[portIndex + 1]);
const root = rootIndex === -1 ? repositoryRoot : resolve(repositoryRoot, process.argv[rootIndex + 1]);
const basePrefix = "/chomchom-sushibar.de/";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8"
};

function safePath(pathname) {
  var decoded;
  try { decoded = decodeURIComponent(pathname); } catch (error) { return null; }
  if (decoded.startsWith(basePrefix)) decoded = decoded.slice(basePrefix.length - 1);
  const relative = decoded.replace(/^\/+/, "") || "index.html";
  const candidate = resolve(root, relative);
  return candidate === root || candidate.startsWith(root + sep) ? candidate : null;
}

async function existingFile(candidate) {
  try {
    const details = await stat(candidate);
    if (details.isDirectory()) return resolve(candidate, "index.html");
    return details.isFile() ? candidate : null;
  } catch (error) {
    return null;
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const requested = safePath(url.pathname);
  let file = requested ? await existingFile(requested) : null;
  let status = 200;
  if (!file) {
    file = resolve(root, "404.html");
    status = 404;
  }
  try {
    await access(file);
  } catch (error) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(status, {
    "Content-Type": contentTypes[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
