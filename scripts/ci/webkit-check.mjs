// Loads every page of the live site in WebKit (Safari's engine, used by every iPhone browser) at several
// device sizes and reports JS errors, whether the hero/page header is on screen, and blank areas.
import { webkit, devices } from 'playwright';
import { PNG } from 'pngjs';
const BASE = process.env.URL || 'https://aayera.pages.dev';
const PAGES = ['/', '/about/', '/business-verticals/', '/business-verticals/events-conferences/', '/business-verticals/academy/', '/clients/', '/contact/', '/industries/', '/our-platforms/'];
const DEVICES = {
  'iPhone 16 Plus': { ...devices['iPhone 15 Pro Max'], viewport: { width: 430, height: 739 }, screen: { width: 430, height: 932 }, deviceScaleFactor: 3 },
  'iPhone SE': devices['iPhone SE'],
  'iPad Mini': devices['iPad Mini'],
  'Safari Mac': { viewport: { width: 1440, height: 900 } },
};
// mean brightness (0-255) of each quarter of the screen, top to bottom
const bands = (buf) => { const png = PNG.sync.read(buf); const out = []; for (let b = 0; b < 4; b++) { let s = 0, n = 0; for (let y = Math.floor(png.height * b / 4); y < Math.floor(png.height * (b + 1) / 4); y += 6) for (let x = 0; x < png.width; x += 6) { const i = (y * png.width + x) * 4; s += (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3; n++; } out.push(Math.round(s / n)); } return out; };
const browser = await webkit.launch();
let problems = 0;
for (const [dname, dev] of Object.entries(DEVICES)) {
  const ctx = await browser.newContext(dev);
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const hero = document.querySelector('.hero, .phero');
      const r = hero?.getBoundingClientRect();
      return { header: hero ? hero.className.split(' ')[0] : 'MISSING', headerH: r ? Math.round(r.height) : 0, sideScroll: document.documentElement.scrollWidth > innerWidth };
    });
    // scroll through the page so every island hydrates and every reveal runs, then look for errors again
    const H = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 500) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(600);
    const b = bands(await page.screenshot());
    const bad = errs.length || info.header === 'MISSING' || info.headerH < 100 || info.sideScroll || Math.max(...b) < 12;
    if (bad) problems++;
    console.log(`${bad ? 'PROBLEM' : 'ok     '} ${dname.padEnd(15)} ${path.padEnd(42)} header=${info.header}(${info.headerH}px) brightness=${JSON.stringify(b)}${info.sideScroll ? ' SIDEWAYS-SCROLL' : ''}${errs.length ? ' ERRORS: ' + errs.join(' | ') : ''}`);
    await page.close();
  }
  await ctx.close();
}
// home page interactions on iPhone 16 Plus: swipe to change slide, swipe up for the photo-grid intro
{
  const ctx = await browser.newContext(DEVICES['iPhone 16 Plus']);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const state = () => page.evaluate(() => ({ slide: [...document.querySelectorAll('.slide')].findIndex((s) => s.classList.contains('on')), wall: getComputedStyle(document.querySelector('.mosaic')).opacity, y: Math.round(scrollY) }));
  const s0 = await state();
  await page.evaluate(() => window.scrollTo(0, 5)); // anything moving the page plays/skips the intro
  await page.waitForTimeout(2500);
  const s1 = await state();
  console.log(`home interactions (iPhone 16 Plus): start ${JSON.stringify(s0)} after scroll ${JSON.stringify(s1)}${errs.length ? ' ERRORS: ' + errs.join(' | ') : ''}`);
  if (errs.length) problems++;
  await ctx.close();
}
await browser.close();
console.log(problems ? `${problems} PROBLEM(S)` : 'ALL OK');
