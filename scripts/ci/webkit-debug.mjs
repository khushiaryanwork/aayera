// Pinpoint where WebKit crashes on a page: each variant in a fresh browser, logging each scroll step.
import { webkit, devices } from 'playwright';
const BASE = process.env.URL || 'https://aayera.pages.dev';
const PATH = process.env.PAGE || '/about/';
const phone = { ...devices['iPhone 15 Pro Max'], viewport: { width: 430, height: 739 }, deviceScaleFactor: 3 };
const variants = [
  ['phone, JS off', { ...phone, javaScriptEnabled: false }],
  ['phone, JS on, DPR 1', { ...phone, deviceScaleFactor: 1 }],
  ['phone, JS on', phone],
  ['desktop Safari', { viewport: { width: 1440, height: 900 } }],
];
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT ${what}`)), ms))]);
for (const [name, opts] of variants) {
  const browser = await webkit.launch();
  try {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    let crashed = false; const errs = [];
    page.on('crash', () => (crashed = true));
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await withTimeout(page.goto(BASE + PATH, { waitUntil: 'load' }), 30000, 'goto');
    await page.waitForTimeout(1500);
    const H = await withTimeout(page.evaluate(() => document.body.scrollHeight), 10000, 'height');
    let last = 0, where = '';
    for (let y = 0; y < H; y += 250) {
      where = await withTimeout(page.evaluate((y) => { scrollTo(0, y); const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); const sec = e?.closest('section,header,footer'); return sec ? (sec.className || sec.tagName) : ''; }, y), 10000, `scroll ${y}`);
      last = y;
      await page.waitForTimeout(120);
      if (crashed) break;
    }
    console.log(`${crashed ? 'CRASH ' : 'ok    '} ${name.padEnd(22)} ${PATH} reached ${last}/${H}px, section at centre: ${where}${errs.length ? ' | errors: ' + errs.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log(`CRASH  ${name.padEnd(22)} ${PATH} ${e.message.split('\n')[0]}`);
  }
  await withTimeout(browser.close(), 10000, 'close').catch(() => {});
}
process.exit(0);
