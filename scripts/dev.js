import {execSync, spawn} from "node:child_process";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname, join, normalize} from "node:path";
import process from "node:process";

const PORT = 5500;
const ROOT = process.cwd();

const MIME_TYPES = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".map": "application/json",
    ".json": "application/json",
};

const children = [];

function runToCompletion(args) {
    execSync(["npm", ...args].join(" "), {stdio: "inherit", shell: true});
}

function runInBackground(args) {
    const child = spawn(["npm", ...args].join(" "), {stdio: "inherit", shell: true});
    children.push(child);
    return child;
}

function startServer() {
    const server = createServer(async (req, res) => {
        const urlPath = decodeURIComponent(req.url === "/" ? "/index.html" : req.url.split("?")[0]);
        const filePath = normalize(join(ROOT, urlPath));
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403);
            res.end("Forbidden");
            return;
        }
        try {
            const data = await readFile(filePath);
            const type = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
            res.writeHead(200, {"Content-Type": type});
            res.end(data);
        } catch {
            res.writeHead(404);
            res.end("Not found");
        }
    });
    server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
    return server;
}

function openBrowser(url) {
    const platform = process.platform;
    if (platform === "win32") {
        spawn("cmd", ["/c", "start", "", url], {stdio: "ignore", shell: true});
    } else if (platform === "darwin") {
        spawn("open", [url], {stdio: "ignore"});
    } else {
        spawn("xdg-open", [url], {stdio: "ignore"});
    }
}

function shutdown() {
    for (const child of children) {
        child.kill();
    }
    process.exit(0);
}

console.log("Initial build...");
runToCompletion(["run", "build"]);

startServer();
runInBackground(["run", "watch:ts"]);
runInBackground(["run", "watch:css"]);
openBrowser(`http://localhost:${PORT}/index.html`);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
