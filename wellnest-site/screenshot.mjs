import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const URL = process.env.URL || 'http://localhost:4321/';
const OUT = '/tmp/wellnest-shots';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

const shots = [
  { name: 'desktop-full',  width: 1440, height: 900,  fullPage: true  },
  { name: 'desktop-hero',  width: 1440, height: 900,  fullPage: false },
  { name: 'mobile-full',   width: 390,  height: 844,  fullPage: true  },
];

for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  // give web fonts a moment
  await page.waitForTimeout(800);
  const path = `${OUT}/${s.name}.png`;
  await page.screenshot({ path, fullPage: s.fullPage, type: 'png' });
  console.log('wrote', path);
  await ctx.close();
}

await browser.close();
