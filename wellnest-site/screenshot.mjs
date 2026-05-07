import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const URL = process.env.URL || 'http://localhost:4321/';
const OUT = '/tmp/wellnest-shots';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const sections = [
  { name: '01-hero',       selector: 'section:nth-of-type(1)' },
  { name: '02-features',   selector: '#features' },
  { name: '03-conditions', selector: '#conditions' },
  { name: '04-pricing',    selector: '#pricing' },
  { name: '05-privacy',    selector: '#privacy' },
  { name: '06-cta',        selector: '#start' },
  { name: '07-footer',     selector: 'footer' },
];

for (const s of sections) {
  const el = await page.$(s.selector);
  if (!el) { console.log('skip', s.name); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const path = `${OUT}/${s.name}.png`;
  await el.screenshot({ path, type: 'png' });
  console.log('wrote', path);
}

// also a mobile full-page
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const mp = await mobile.newPage();
await mp.goto(URL, { waitUntil: 'networkidle' });
await mp.waitForTimeout(800);
await mp.screenshot({ path: `${OUT}/00-mobile.png`, fullPage: true, type: 'png' });
console.log('wrote mobile');

await browser.close();
