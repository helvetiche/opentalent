// Ensures the automation browser is running with remote debugging on (:9222)
// and lists its open tabs. Runs automatically before `npm run dev`
// (see `predev`), or on demand: npm run chrome:debug
// Chrome 136+ ignores --remote-debugging-port on the default profile, so
// automation uses a dedicated profile dir that coexists with your own Chrome.
// No dependencies, Node stdlib only.
import { execFileSync, spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const DEBUG_PORT = 9222,
  FETCH_TIMEOUT_MS = 2000,
  POLL_ATTEMPTS = 15,
  POLL_INTERVAL_MS = 1000,
  PREVIEW_LIMIT = 20
const BASE = process.env.CDP_ENDPOINT ?? `http://127.0.0.1:${DEBUG_PORT}`
const PROFILE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".chrome-automation")

async function getJson(path) {
  const response = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

function findChrome() {
  if (process.env.CHROME_PATH !== undefined && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH
  }
  const candidates =
    process.platform === "win32"
      ? [
          `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.LocalAppData}\\Google\\Chrome\\Application\\chrome.exe`,
        ]
      : process.platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/snap/bin/chromium"]
  return candidates.find((path) => existsSync(path)) ?? null
}

async function printTabs() {
  const targets = await getJson("/json/list")
  const pages = targets.filter((target) => target.type === "page")
  console.log(`Open tabs (${pages.length}):`)
  for (const page of pages.slice(0, PREVIEW_LIMIT)) {
    console.log(`- ${page.title} :: ${page.url}`)
  }
  if (pages.length > PREVIEW_LIMIT) {
    console.log(`…and ${pages.length - PREVIEW_LIMIT} more`)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function launchChrome(chrome) {
  spawn(
    chrome,
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${PROFILE_DIR}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--restore-last-session",
    ],
    { detached: true, stdio: "ignore" },
  ).unref()
}

async function waitForDebug() {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS)
    try {
      const version = await getJson("/json/version")
      console.log(`Chrome debug ready: ${version.Browser}`)
      await printTabs()
      return true
    } catch {
      // Still starting, keep polling.
    }
  }
  return false
}

function killAutomationChrome() {
  try {
    if (process.platform === "win32") {
      execFileSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*.chrome-automation*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
        ],
        { stdio: "ignore" },
      )
    } else {
      execFileSync("pkill", ["-f", ".chrome-automation"], { stdio: "ignore" })
    }
  } catch {
    // Nothing running, continue to launch.
  }
}

async function main() {
  const strict = process.argv.includes("--restart")
  const fail = (message) => {
    console.error(message)
    if (strict) {
      process.exit(1)
    }
  }
  if (process.argv.includes("--restart")) {
    console.log("Restarting the automation browser...")
    killAutomationChrome()
    await sleep(POLL_INTERVAL_MS)
  } else {
    try {
      const version = await getJson("/json/version")
      console.log(`Chrome debug ready: ${version.Browser}`)
      await printTabs()
      return
    } catch {
      // Not listening yet, fall through and launch it.
    }
  }
  const chrome = findChrome()
  if (chrome === null) {
    fail("Chrome not found. Set CHROME_PATH to your chrome executable and retry.")
    return
  }
  launchChrome(chrome)
  if (await waitForDebug()) {
    return
  }
  fail("Automation browser did not open :9222. Run npm run chrome:restart to reset it.")
}

await main()
