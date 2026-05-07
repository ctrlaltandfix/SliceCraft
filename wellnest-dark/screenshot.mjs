import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const URL = process.env.URL || 'http://localhost:4322/';
const OUT = '/tmp/wellnest-dark-shots';
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
await page.waitForTimeout(800);

// trigger scroll-based reveals by walking through the page
await page.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y <= h; y += 600) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(600);

// full
await page.screenshot({ path: `${OUT}/00-full.png`, fullPage: true, type: 'png' });
console.log('wrote full');

// hero (above the fold)
await page.screenshot({ path: `${OUT}/01-hero.png`, fullPage: false, type: 'png' });
console.log('wrote hero');

// per section
const sections = [
  { name: '02-modules',    selector: '#modules' },
  { name: '03-conditions', selector: '#conditions' },
  { name: '04-pricing',    selector: '#pricing' },
  { name: '05-privacy',    selector: '#privacy' },
  { name: '06-cta',        selector: '#start' },
];
for (const s of sections) {
  const el = await page.$(s.selector);
  if (!el) continue;
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await el.screenshot({ path: `${OUT}/${s.name}.png`, type: 'png' });
  console.log('wrote', s.name);
}

// mobile
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const mp = await mctx.newPage();
await mp.goto(URL, { waitUntil: 'networkidle' });
await mp.waitForTimeout(800);
await mp.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y <= h; y += 400) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await mp.waitForTimeout(600);
await mp.screenshot({ path: `${OUT}/07-mobile.png`, fullPage: true });
console.log('wrote mobile');

await browser.close();
