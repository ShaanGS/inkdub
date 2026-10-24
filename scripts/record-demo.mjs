// Record docs/inkdub-demo.mp4: the landing banner, the reader switching styles, and a live Gemma 4
// dub of a page on the production site. Drives headless Chrome over the DevTools protocol and stitches
// the screencast frames with ffmpeg, keeping real timings (the Gemma wait is not sped up).
// usage: node scripts/record-demo.mjs [base-url]
import { spawn, spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.argv[2] ?? "https://inkdub-app.vercel.app";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334;
const FRAMES = path.resolve(".demo-frames");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await rm(FRAMES, { recursive: true, force: true });
await mkdir(FRAMES, { recursive: true });
const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${PORT}`, "--hide-scrollbars", "--user-data-dir=/tmp/inkdub-record"],
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
const frames = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Page.screencastFrame") {
    const { data, metadata, sessionId } = message.params;
    frames.push({ data, time: metadata.timestamp });
    ws.send(JSON.stringify({ id: ++nextId, method: "Page.screencastFrameAck", params: { sessionId } }));
    return;
  }
  pending.get(message.id)?.(message.result);
  pending.delete(message.id);
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const run = (expression) => send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
const press = async (key, code = key, keyCode = 0) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: keyCode, text: key.length === 1 ? key : undefined });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode });
};

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: 1440, maxHeight: 900 });

// 1. The banner.
await send("Page.navigate", { url: `${BASE}/` });
await sleep(5500);

// 2. One page, four voices, then a page turn.
await send("Page.navigate", { url: `${BASE}/read?page=4&view=original` });
await sleep(3000);
for (const key of ["2", "3", "4"]) {
  await press(key, `Digit${key}`, 48 + Number(key));
  await sleep(2600);
}
await press("ArrowRight", "ArrowRight", 39);
await sleep(3000);

// 3. A live dub through the production API.
await send("Page.navigate", { url: `${BASE}/dub` });
await sleep(2500);
await run(`document.querySelector('img[alt="Sample comic page"]').closest('button').click()`);
for (let i = 0; i < 120; i++) {
  await sleep(500);
  const { value } = await run(`document.body.innerText.includes("bubbles lettered by")`);
  if (value) break;
}
await sleep(3500);
await run(`[...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.includes("Madras")).click()`);
await sleep(3500);

await send("Page.stopScreencast");
ws.close();
chrome.kill();

// Stitch with each frame held until the next one arrived, so the video plays in real time.
const list = [];
for (const [i, frame] of frames.entries()) {
  const file = path.join(FRAMES, `f${String(i).padStart(5, "0")}.jpg`);
  await writeFile(file, Buffer.from(frame.data, "base64"));
  const hold = i + 1 < frames.length ? frames[i + 1].time - frame.time : 1;
  list.push(`file '${file}'`, `duration ${Math.max(0.01, hold).toFixed(3)}`);
}
list.push(`file '${path.join(FRAMES, `f${String(frames.length - 1).padStart(5, "0")}.jpg`)}'`);
await writeFile(path.join(FRAMES, "list.txt"), list.join("\n"));
const ffmpeg = spawnSync(
  "ffmpeg",
  ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", path.join(FRAMES, "list.txt"),
    "-vf", "fps=30,scale=1280:-2,format=yuv420p", "-c:v", "libx264", "-crf", "24", "-movflags", "+faststart",
    "docs/inkdub-demo.mp4"],
  { stdio: "inherit" },
);
await rm(FRAMES, { recursive: true, force: true });
console.log(`${frames.length} frames -> docs/inkdub-demo.mp4 (ffmpeg exit ${ffmpeg.status})`);
