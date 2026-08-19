const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "site");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".mp3": "audio/mpeg"
};

http.createServer((req, res) => {
  let requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (requestPath === "/") requestPath = "/index.html";
  let file = path.join(root, requestPath);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(root, "index.html");
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(4173, "127.0.0.1", () => {
  console.log("Preview running at http://127.0.0.1:4173");
});
