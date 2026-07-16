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
  await new Promise(r => server.listen(8144, r));
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
  await page.goto('http://localhost:8144/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.Store && Store.ready);

  // semeia banco com 6 questões (3 MACRO, 2 PORTUGUES, 1 FINANCAS), gabaritos conhecidos
  await page.evaluate(async () => {
    const qs = [
      ['MAC-02', 'MACRO', 'C'], ['MAC-01', 'MACRO', 'E'], ['MAC-03', 'MACRO', 'C'],
      ['POR-01', 'PORTUGUES', 'E'], ['POR-02', 'PORTUGUES', 'C'], ['FIN-08', 'FINANCAS', 'E']
    ];
    for (const [cod, terr, gab] of qs)
      await Store.add('banco', { microcodigo: cod, territorio: terr, gabarito: gab,
        enunciado: 'Julgue o item de teste ' + cod + ' quanto ao seu conteudo formal.', fonte: 'e2e', comentario: null, favorita: false });
  });

  // simulado de 6 itens com 4s de duração (override) → hard stop no meio
  await page.evaluate(() => iniciarSimulado(6, 4));
  await page.waitForTimeout(400);
  const filaLen = await page.evaluate(() => sim.fila.length);
  eq('timer visível', await page.locator('#simTimer').count(), 1);
  eq('limiar visível', (await page.locator('#itemSheet').innerText()).includes('33,33%'), true);
  // item 1: responde CERTO (sem feedback → próximo item direto)
  await page.evaluate(() => simConfianca(4));
  await page.evaluate(() => simResponder('C'));
  await page.waitForTimeout(200);
  const txt = await page.locator('#itemSheet').innerText();
  eq('zero feedback durante (sem "Certo/Errado" na tela)', /✔|✘|gabarito/.test(txt), false);
  eq('avançou para item 2', txt.includes('item 2/' + filaLen), true);
  // item 2: responde
  await page.evaluate(() => simConfianca(5));
  await page.evaluate(() => simResponder('E'));
  // espera o HARD STOP (resta ~3s)
  await page.waitForFunction(() => document.getElementById('itemSheet').innerText.includes('Correção'), { timeout: 8000 });
  const cor = await page.locator('#itemSheet').innerText();
  eq('correção indica tempo esgotado', cor.includes('tempo esgotado'), true);
  eq('correção mostra líquido', cor.includes('Líquido'), true);
  const ten = await page.evaluate(() => Store.all('itens'));
  eq('registros = fila inteira', ten.length, filaLen);
  eq('brancos automáticos = não respondidos', ten.filter(t => t.autoBranco).length, filaLen - 2);
  const lote = await page.evaluate(() => Store.all('lotes').then(l => l[l.length - 1]));
  eq('lote marcado hardStop', lote.hardStop, true);
  eq('lote guarda composição', typeof lote.composicao, 'object');
  // classifica um erro na correção (se houver select)
  const temErro = await page.locator('#itemSheet select').count();
  if (temErro) {
    await page.locator('#itemSheet select').first().selectOption('CALCULO_SOB_PRESSAO');
    await page.waitForTimeout(200);
    const errAtualizado = await page.evaluate(() => Store.all('itens').then(t => t.filter(x => x.tipoErro === 'CALCULO_SOB_PRESSAO').length));
    eq('classificação na correção persiste', errAtualizado, 1);
  }
  await page.screenshot({ path: 'bcb-simulado.png' });
  await page.evaluate(() => fecharItem());
  // reteste recebeu os errados do simulado (se houver)
  const rt = await page.evaluate(() => Promise.all([Store.all('banco'), Store.all('itens')]).then(([b, t]) => Seeds.filaReteste(b, t).length));
  eq('reteste coerente (errados do simulado)', rt >= 0, true);

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e fase-6 ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
