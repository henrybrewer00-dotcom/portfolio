const { chromium } = require("playwright");
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ARTIFACTS = path.join(__dirname, "artifacts");
const PORT = 8848;

async function waitForServer(url, ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_) { /* retry */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Server did not start");
}

async function main() {
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  const server = spawn("python3", ["-m", "http.server", String(PORT)], {
    cwd: __dirname,
    stdio: "ignore",
  });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}/`);

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: ARTIFACTS, size: { width: 1280, height: 720 } },
    });

    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    // Scroll through the full deck — enough wheel events to reach full house
    for (let i = 0; i < 28; i++) {
      await page.mouse.wheel(0, 350);
      await page.waitForTimeout(650);
    }

    await page.waitForTimeout(3000);

    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    const src = await video.path();
    const webm = path.join(ARTIFACTS, "scroll-demo.webm");
    const mp4 = path.join(ARTIFACTS, "scroll-demo.mp4");
    fs.renameSync(src, webm);

    // H.264 MP4 plays everywhere; WebM often fails in preview UIs
    execFileSync("ffmpeg", [
      "-y", "-i", webm,
      "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-crf", "23",
      mp4,
    ], { stdio: "inherit" });

    console.log("Saved:", mp4);
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
