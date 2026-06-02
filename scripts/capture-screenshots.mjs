import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:5174";
const chromePath = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const port = Number(process.env.CHROME_DEBUG_PORT ?? 9333);
const outDir = path.resolve("docs/screenshots");
const userDataDir = path.join(os.tmpdir(), `voicescript-screens-${process.pid}`);

let nextId = 1;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForExit(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once("exit", resolve);
  });
}

async function waitForJson(url, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // Chrome is still starting.
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.id) return;
    const item = pending.get(msg.id);
    if (!item) return;
    pending.delete(msg.id);
    if (msg.error) item.reject(new Error(JSON.stringify(msg.error)));
    else item.resolve(msg.result);
  };

  const opened = new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  return {
    async send(method, params = {}) {
      await opened;
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close() {
      ws.close();
    },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime evaluation failed");
  }
  return result.result.value;
}

async function setViewport(cdp, width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function waitFor(cdp, expression, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, `Boolean(${expression})`)) return;
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function openRoute(cdp, route, viewport = { width: 1440, height: 980 }) {
  await setViewport(cdp, viewport.width, viewport.height);
  await cdp.send("Page.navigate", { url: `${baseUrl}/#/${route}` });
  await waitFor(cdp, `document.querySelector(".shell")`);
  await cdp.send("Page.bringToFront");
  await sleep(600);
}

async function sanitizeDemoText(cdp) {
  await evaluate(
    cdp,
    `(() => {
      for (const node of document.querySelectorAll(".jc-title, h1, h2, h3, .drawer-title")) {
        if ((node.textContent ?? "").trim() === "asdasd") {
          node.textContent = "Intake Review — Nusantara Energy";
        }
      }
      return true;
    })()`,
  );
}

async function screenshot(cdp, name) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  await fs.writeFile(path.join(outDir, `${name}.png`), result.data, "base64");
}

const chrome = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "about:blank",
]);

try {
  await fs.mkdir(outDir, { recursive: true });
  await waitForJson(`http://127.0.0.1:${port}/json/version`);

  const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`);
  const target = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
  if (!target) throw new Error("Could not find a Chrome page target");

  const cdp = connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  await openRoute(cdp, "dashboard");
  await screenshot(cdp, "dashboard");

  await openRoute(cdp, "board", { width: 1600, height: 980 });
  await sanitizeDemoText(cdp);
  await screenshot(cdp, "workflow-board");

  await evaluate(
    cdp,
    `(() => {
      const cards = [...document.querySelectorAll(".job-card")];
      const card = cards.find((el) => /Test Case/i.test(el.textContent ?? "")) ??
        cards.find((el) => el.closest(".col")?.querySelector(".title")?.textContent?.trim() === "New");
      if (!card) throw new Error("No New job card found");
      card.click();
      return true;
    })()`,
  );
  await waitFor(cdp, `document.querySelector(".drawer")`);
  await sanitizeDemoText(cdp);
  await sleep(600);
  await screenshot(cdp, "job-details-drawer");

  await evaluate(
    cdp,
    `(() => {
      const button = [...document.querySelectorAll("button")]
        .find((el) => /assign reporter/i.test(el.textContent ?? ""));
      if (!button) throw new Error("Assign reporter button not found");
      button.click();
      return true;
    })()`,
  );
  await waitFor(cdp, `document.body.textContent.includes("Choose a reporter")`);
  await sanitizeDemoText(cdp);
  await sleep(900);
  await screenshot(cdp, "reporter-picker");

  await openRoute(cdp, "reporters", { width: 1280, height: 900 });
  await screenshot(cdp, "reporters-table");

  await openRoute(cdp, "editors", { width: 1280, height: 900 });
  await screenshot(cdp, "editors-table");

  cdp.close();
} finally {
  chrome.kill("SIGTERM");
  await waitForExit(chrome);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.rm(userDataDir, { recursive: true, force: true });
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(250);
    }
  }
}
