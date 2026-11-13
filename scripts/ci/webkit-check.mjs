// Loads the live home page in WebKit (Safari's engine) at iPhone 16 Plus size and records what it sees.
import { webkit, devices } from 'playwright';
import fs from 'node:fs';
const URL = process.env.URL || 'https://aayera.pages.dev/';
fs.mkdirSync('out', { recursive: true });
const iphone = { ...devices['iPhone 15 Pro Max'], viewport: { width: 430, height: 739 }, screen: { width: 430, height: 932 }, deviceScaleFactor: 3 };
const browser = await webkit.launch();
const ctx = await browser.newContext(iphone);
const page = await ctx.newPage();
const log = [];
page.on('console', (m) => log.push(`[console.${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => log.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on('requestfailed', (r) => log.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
await page.goto(URL, { waitUntil: 'load' });
const probe = () => page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const box = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), op: cs.opacity, vis: cs.visibility, tf: cs.transform.slice(0, 60) }; };
  const img = q('.slide.on img');
  return { scrollY, innerH: innerHeight, hero: box('.hero'), sticky: box('.hero-sticky'), frame: box('.hero-frame, .frame'), slideOn: box('.slide.on'), media: box('.slide.on .slide-media'), img: img ? { complete: img.complete, nw: img.naturalWidth, src: (img.currentSrc || '').slice(-60) } : null, mosaic: box('.mosaic'), title: box('.hero h1, .hero h2') };
});
for (const [t, name] of [[300, 'a-load'], [2500, 'b-2s'], [6000, 'c-8s']]) {
  await page.waitForTimeout(t);
  log.push(`[probe ${name}] ${JSON.stringify(await probe())}`);
  await page.screenshot({ path: `out/${name}.png` });
}
await page.screenshot({ path: 'out/d-full.png', fullPage: true });
fs.writeFileSync('out/log.txt', log.join('\n'));
console.log(log.join('\n'));
await browser.close();
