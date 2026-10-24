// Screenshot a running Inkdub for the README and the social card. Drives headless Chrome over the
// DevTools protocol and waits in real time, so every lettering animation has finished.
// usage: node scripts/shoot.mjs [base-url]   (default: a local production server on :3100)
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${PORT}`, "--hide-scrollbars", "--user-data-dir=/tmp/inkdub-shoot"],
  { stdio: "ignore" },
);

let target;
for (let i = 0; i < 50 && !target; i++) {
  try {
    target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  } catch {
    await sleep(200);
  }
}
if (!target) throw new Error("Chrome did not start");

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  pending.get(message.id)?.(message.result);
  pending.delete(message.id);
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

async function shot(out, width, height, path, wait = 5000) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: BASE + path });
  await sleep(wait);
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(out, Buffer.from(data, "base64"));
  console.log(out);
}

await mkdir("docs/frames", { recursive: true });
await send("Page.enable");
await shot("app/opengraph-image.png", 1200, 630, "/card", 3000);
await shot("app/twitter-image.png", 1200, 630, "/card", 3000);
await shot("docs/landing.png", 1440, 900, "/?hero=madras");
await shot("docs/reader-madras.png", 1440, 1100, "/read?page=4&view=madras");
await shot("docs/reader-tamil.png", 1440, 1100, "/read?page=2&view=tamil");
for (const view of ["original", "tamil", "tanglish", "madras"]) {
  await shot(`docs/frames/${view}.png`, 1100, 1500, `/read?page=6&view=${view}`);
}
ws.close();
chrome.kill();
