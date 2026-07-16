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
  await new Promise(r => server.listen(8143, r));
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
  await page.goto('http://localhost:8143/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.Store && Store.ready);
  await page.waitForTimeout(400);

  // importar lote (JSON com 2 válidas + 1 rejeitada)
  await page.click('nav button[data-tab="itens"]');
  await page.click('#btnImport');
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    document.getElementById('impTxt').value = JSON.stringify([
      { enunciado: 'No IS-LM, expansão fiscal desloca a curva IS para a direita.', gabarito: 'C', microcodigo: 'MAC-02', fonte: 'teste' },
      { enunciado: 'Sob o regime de metas, o BC controla diretamente o índice de preços.', gabarito: 'E', microcodigo: 'MAC-02' },
      { enunciado: 'Item com micro inexistente para rejeição.', gabarito: 'C', microcodigo: 'XXX-1' }
    ]);
  });
  await page.click('#itemSheet .btn:not(.sec)');
  await page.waitForTimeout(300);
  eq('import: 2 no banco', await page.evaluate(() => Store.all('banco').then(b => b.length)), 2);
  eq('import: 1 rejeitada exibida', (await page.locator('#impResult').innerText()).includes('1 rejeitadas'), true);
  await page.evaluate(() => fecharItem());

  // cadastro manual
  await page.click('#btnNovoItem');
  await page.waitForTimeout(200);
  await page.selectOption('#qMicro', 'EEC-05');
  await page.evaluate(() => { document.getElementById('qEnun').value = 'Sob as hipóteses de Gauss-Markov, o estimador MQO é BLUE.'; });
  await page.click('#qGabC');
  await page.click('#itemSheet .btn:not(.sec)');
  await page.waitForTimeout(300);
  eq('cadastro: 3 no banco', await page.evaluate(() => Store.all('banco').then(b => b.length)), 3);

  // treino: fluxo TRAVADO
  await page.click('#btnTreino');
  await page.waitForTimeout(300);
  eq('passo 1: sem botões C/E antes da confiança',
    (await page.locator('#itemSheet').innerText()).includes('CERTO'), false);
  await page.evaluate(() => declararConfianca(4));
  await page.waitForTimeout(150);
  eq('passo 2: confiança travada visível', (await page.locator('#itemSheet').innerText()).includes('Confiança declarada: 4'), true);
  // responde ERRADO de propósito contra gabarito p/ cair na taxonomia
  const gab = await page.evaluate(() => sessao.fila[0].gabarito);
  await page.evaluate(g => responder(g === 'C' ? 'E' : 'C'), gab);
  await page.waitForTimeout(250);
  eq('feedback de erro', (await page.locator('#itemSheet').innerText()).includes('Errado'), true);
  eq('taxonomia obrigatória na tela', (await page.locator('#itemSheet').innerText()).includes('Classifique o erro'), true);
  eq('sem botão Próximo antes de classificar', (await page.locator('#itemSheet').innerText()).includes('Próximo item'), false);
  await page.evaluate(() => classificarErro('VERDADE_ESTRANHA'));
  await page.waitForTimeout(200);
  eq('depois de classificar, Próximo aparece', (await page.locator('#itemSheet').innerText()).includes('Próximo item'), true);
  await page.evaluate(() => proximoItem());
  await page.waitForTimeout(150);
  // item 2: acerta com confiança 5
  await page.evaluate(() => declararConfianca(5));
  const gab2 = await page.evaluate(() => sessao.fila[sessao.idx].gabarito);
  await page.evaluate(g => responder(g), gab2);
  await page.waitForTimeout(200);
  await page.evaluate(() => proximoItem());
  await page.waitForTimeout(150);
  // item 3: BRANCO com confiança 1 (racional; sem flag)
  await page.evaluate(() => declararConfianca(1));
  await page.evaluate(() => responder('BRANCO'));
  await page.waitForTimeout(200);
  await page.evaluate(() => proximoItem());
  await page.waitForTimeout(300);
  eq('resumo do lote com líquido', (await page.locator('#itemSheet').innerText()).includes('Líquido'), true);
  await page.evaluate(() => fecharItem());

  // derivados: 3 tentativas; líquido = (1 - 0,5)/3 = 16,67%
  const ten = await page.evaluate(() => Store.all('itens'));
  eq('3 tentativas gravadas', ten.length, 3);
  eq('tipoErro persistido', ten[0].tipoErro, 'VERDADE_ESTRANHA');
  eq('scores derivados', ten.map(t => t.score), [-0.5, 1, 0]);
  await page.waitForTimeout(300);
  eq('badge líquido global no Início', (await page.evaluate(() => { goTab('inicio'); return renderBadges().then(() => document.getElementById('badges').innerText); })).includes('16,67%'), true);

  // fila de reteste: a errada entra; refazer certo → sai
  eq('reteste com 1', await page.evaluate(() => Promise.all([Store.all('banco'), Store.all('itens')]).then(([b, t]) => Seeds.filaReteste(b, t).length)), 1);
  await page.click('nav button[data-tab="itens"]');
  await page.click('#btnReteste');
  await page.waitForTimeout(250);
  await page.evaluate(() => declararConfianca(4));
  const gab3 = await page.evaluate(() => sessao.fila[0].gabarito);
  await page.evaluate(g => responder(g), gab3);
  await page.waitForTimeout(200);
  await page.evaluate(() => proximoItem());
  await page.waitForTimeout(250);
  await page.evaluate(() => fecharItem());
  eq('reteste zerado após acerto', await page.evaluate(() => Promise.all([Store.all('banco'), Store.all('itens')]).then(([b, t]) => Seeds.filaReteste(b, t).length)), 0);

  // território MACRO mostra líquido real
  await page.click('nav button[data-tab="terr"]');
  await page.waitForTimeout(300);
  const macroRow = await page.locator('#terrList .terr-row').nth(1).innerText();
  eq('grid mostra líquido do MACRO', /líquido\s+[\d,]+%/.test(macroRow), true);
  await page.locator('#terrList .terr-row').nth(1).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'bcb-itens.png' });

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e fase-5 ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
