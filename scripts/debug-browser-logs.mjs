import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { chromium } from "playwright";

const APP_URL = process.env.DEBUG_APP_URL || "http://localhost:5173";
const APP_WAIT_TIMEOUT_MS = Number(process.env.DEBUG_APP_WAIT_TIMEOUT_MS || 30000);
const APP_WAIT_INTERVAL_MS = 500;
const artifactsDir = path.resolve("artifacts");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFilePath = path.join(artifactsDir, `browser-debug-${timestamp}.log`);

fs.mkdirSync(artifactsDir, { recursive: true });
const stream = fs.createWriteStream(logFilePath, { flags: "a" });

function writeLog(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  stream.write(`${line}\n`);
}

function truncate(text, max = 800) {
  if (!text) {
    return "";
  }

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max)}…`;
}

function shouldCaptureResponseBody(url) {
  return (
    url.includes("industrialized-construction/informed-design") ||
    url.includes("developer.api.autodesk.com")
  );
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: false, channel: "chrome" });
  } catch (error) {
    writeLog(
      `Chrome channel unavailable (${error.message}). Falling back to Playwright Chromium.`,
    );
    return chromium.launch({ headless: false });
  }
}

async function waitForAppReady() {
  const start = Date.now();

  while (Date.now() - start < APP_WAIT_TIMEOUT_MS) {
    try {
      const response = await fetch(APP_URL, { method: "GET" });
      if (response.ok) {
        return;
      }
    } catch {
      // app not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, APP_WAIT_INTERVAL_MS));
  }

  throw new Error(
    `App URL did not become ready within ${APP_WAIT_TIMEOUT_MS}ms: ${APP_URL}`,
  );
}

async function main() {
  writeLog(`Starting browser debug session for ${APP_URL}`);
  writeLog("Waiting for app URL to be reachable...");
  await waitForAppReady();

  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  page.on("console", (message) => {
    writeLog(`[console:${message.type()}] ${message.text()}`);
  });

  page.on("pageerror", (error) => {
    writeLog(`[pageerror] ${error.stack || error.message}`);
  });

  page.on("requestfailed", (request) => {
    writeLog(
      `[requestfailed] ${request.method()} ${request.url()} :: ${request.failure()?.errorText}`,
    );
  });

  page.on("response", async (response) => {
    const status = response.status();

    if (status < 400) {
      return;
    }

    const url = response.url();
    let details = "";

    if (shouldCaptureResponseBody(url)) {
      try {
        details = truncate(await response.text());
      } catch {
        details = "<could not read response body>";
      }
    }

    writeLog(
      `[response:${status}] ${response.request().method()} ${url}${details ? ` :: ${details}` : ""}`,
    );
  });

  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  writeLog("Browser opened. Reproduce the issue in the launched window.");
  writeLog(`Logs are being saved to ${logFilePath}`);

  const readline = createInterface({ input: stdin, output: stdout });
  await readline.question("Press ENTER to stop logging and close browser... ");
  readline.close();

  await context.close();
  await browser.close();
  stream.end();

  console.log(`\nDebug session finished. Log file: ${logFilePath}`);
}

main().catch((error) => {
  writeLog(`[fatal] ${error.stack || error.message}`);
  stream.end();
  process.exit(1);
});
