const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..');
const NM = process.env.CDN_MODULES || path.join(__dirname, 'node_modules');
const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' }[path.extname(p)] || 'text/plain' });
    res.end(data);
  });
});
const CDN = {
  'chart.js@4.5.0/dist/chart.umd.js': 'chart.js/dist/chart.umd.js',
  'dexie@4.4.4/dist/dexie.min.js': 'dexie/dist/dexie.min.js',
  'katex@0.17.0/dist/katex.min.css': 'katex/dist/katex.min.css',
  'katex@0.17.0/dist/katex.min.js': 'katex/dist/katex.min.js',
  'katex@0.17.0/dist/contrib/auto-render.min.js': 'katex/dist/contrib/auto-render.min.js'
};
(async () => {
  await new Promise(r => server.listen(8148, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const errors = []; let fails = 0, count = 0;
  const eq = (n, g, w) => { count++; if (JSON.stringify(g) !== JSON.stringify(w)) { fails++; console.error(`✗ ${n}: got ${JSON.stringify(g)} want ${JSON.stringify(w)}`); } };
  const page = await (await browser.newContext({ viewport: { width: 400, height: 900 }, serviceWorkers: 'block' })).newPage();
  await page.route('**/cdn.jsdelivr.net/npm/**', route => {
    const k = Object.keys(CDN).find(k => route.request().url().includes(k));
    if (!k) return route.abort();
    route.fulfill({ body: fs.readFileSync(path.join(NM, CDN[k])), contentType: route.request().url().endsWith('.css') ? 'text/css' : 'text/javascript' });
  });
  await page.route('**/www.gstatic.com/**', r => r.abort());
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('http://localhost:8148/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.Store && Store.ready);
  await page.waitForTimeout(300);

  // semana 1: CPs aparecem como meta (⚪), sem gatilho
  await page.click('nav button[data-tab="mais"]');
  await page.waitForTimeout(400);
  let lista = await page.locator('#cpLista').innerText();
  eq('CP1 listado', lista.includes('CP1'), true);
  eq('CP4 listado', lista.includes('CP4'), true);
  eq('GAP listado', lista.includes('GAP'), true);
  eq('semana 1: sem gatilho', (await page.locator('#cpAlerta').innerText()).trim(), '');
  eq('CP futuro = meta', lista.includes('meta'), true);

  // viaja para a semana 10: gatilho da Econometria dispara (sem dado)
  await page.evaluate(() => {
    D.firstWeek = Seeds.addDias(mondayStr(), -63); // 9 semanas atrás ⇒ semana 10
    save(); renderCheckpoints(); renderHeader();
  });
  await page.waitForTimeout(400);
  eq('semana 10 no header', (await page.locator('#hSub').innerText()).includes('Semana 10'), true);
  const alerta = await page.locator('#cpAlerta').innerText();
  eq('gatilho dispara sem dado', alerta.includes('Gatilho automático'), true);
  eq('motivo cita Econometria', alerta.includes('Econometria'), true);
  lista = await page.locator('#cpLista').innerText();
  eq('CP1 pendente (vencido)', lista.includes('pendente'), true);
  eq('pendências listadas com mínimos', lista.includes('FINANCAS: sem dado'), true);

  // alimenta Econometria ≥60%: 10 acertos → gatilho desarma
  await page.evaluate(async () => {
    for (let i = 0; i < 10; i++)
      await Store.add('itens', { data: today(), bancoId: null, microcodigo: 'EEC-05', territorio: 'ECONOMETRIA', loteId: 9, resposta: 'C', correto: true, confianca: 4, tempoMs: 1000, tipoErro: null, score: 1, flagCalibracao: null });
    renderCheckpoints();
  });
  await page.waitForTimeout(400);
  eq('gatilho desarma com EEC 100%', (await page.locator('#cpAlerta').innerText()).trim(), '');
  await page.screenshot({ path: 'bcb-cp.png' });

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e fase-10 ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
