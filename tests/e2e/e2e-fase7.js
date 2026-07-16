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
  await new Promise(r => server.listen(8145, r));
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
  await page.goto('http://localhost:8145/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.Store && Store.ready);
  await page.waitForTimeout(300);

  // nova discursiva
  await page.click('nav button[data-tab="mais"]');
  await page.click('#btnNovaDisc');
  await page.waitForTimeout(250);
  eq('limite Fase 1 = 40 linhas', (await page.locator('#itemSheet .sub').innerText()).includes('40 linhas'), true);
  await page.fill('#dTema', 'Política monetária e metas de inflação');
  await page.fill('#dEnun', 'Disserte sobre o regime de metas no arranjo brasileiro.');
  // bloqueio absoluto: tenta colar texto de ~50 linhas (50*70 chars)
  await page.evaluate(() => {
    const el = document.getElementById('dCorpo');
    el.value = 'Linha de teste sobre política monetária no regime de metas. '.repeat(60);
    el.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(200);
  const linhas = await page.evaluate(() => Seeds.contarLinhas(document.getElementById('dCorpo').value));
  eq('bloqueio absoluto em 40', linhas <= 40, true);
  eq('aviso de limite visível', (await page.locator('#dTrava').innerText()).includes('limite'), true);
  // submete v1
  await page.evaluate(() => submeterDiscursiva());
  await page.waitForTimeout(300);
  eq('grade abre após submissão', (await page.locator('#itemSheet').innerText()).includes('Autoavaliação'), true);
  await page.evaluate(() => { document.getElementById('g_conteudo').value = 8; });
  await page.evaluate(() => salvarGrade((window.__did = 1, 1)));
  await page.waitForTimeout(250);
  const d1 = await page.evaluate(() => Store.get('discursivas', 1));
  eq('v1 imutável gravada c/ nota', [d1.versao, d1.nota != null], [1, true]);
  eq('nota = média da grade', d1.nota, (5 + 8 + 5 + 5) / 4);

  // nova versão (paiId) com texto alterado → diff
  await page.evaluate(() => verDiscursiva(1));
  await page.waitForTimeout(200);
  await page.evaluate(() => { fecharItem(); abrirEditorDisc(window._verDisc); });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const el = document.getElementById('dCorpo');
    el.value = el.value.slice(0, 500) + '\nConclusão adicional sobre credibilidade e ancoragem de expectativas.';
    el.dispatchEvent(new Event('input'));
  });
  await page.evaluate(() => submeterDiscursiva());
  await page.waitForTimeout(300);
  await page.evaluate(() => fecharItem());
  const d2 = await page.evaluate(() => Store.get('discursivas', 2));
  eq('v2 encadeada', [d2.versao, d2.paiId], [2, 1]);
  // diff visível
  await page.evaluate(() => verDiscursiva(2));
  await page.waitForTimeout(250);
  const ver = await page.locator('#itemSheet').innerText();
  eq('diff presente', ver.includes('Diff vs v1'), true);
  eq('lista agrupa versões', (await page.evaluate(() => { fecharItem(); return renderDiscursivas().then(() => document.getElementById('discLista').innerText); })).includes('2 versões'), true);

  // rascunho: abre editor, digita, fecha → draft persiste no localStorage
  await page.click('#btnNovaDisc');
  await page.waitForTimeout(200);
  await page.fill('#dTema', 'Rascunho de estabilidade financeira');
  await page.evaluate(() => fecharEditorDisc());
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('bcb1_disc_draft')));
  eq('rascunho salvo ao fechar', draft.tema, 'Rascunho de estabilidade financeira');
  await page.click('#btnNovaDisc');
  await page.waitForTimeout(200);
  eq('rascunho restaurado', await page.inputValue('#dTema'), 'Rascunho de estabilidade financeira');
  await page.screenshot({ path: 'bcb-disc.png' });

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e fase-7 ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
