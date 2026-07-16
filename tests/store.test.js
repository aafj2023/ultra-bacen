// Bancada da Fase 2 — Store (modo ls) + seeds §8/§9/§10. Node puro.
// O modo 'idb' (Dexie) é validado no navegador na Fase 3 — aqui exercitamos
// o fallback localStorage, que compartilha toda a lógica acima do backend.
'use strict';

// shim de localStorage p/ Node
const mem = {};
global.localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; },
  key: i => Object.keys(mem)[i] || null,
  get length() { return Object.keys(mem).length; }
};

const { loadBlock } = require('./_extract.js');
const Store = loadBlock('store');
const Seeds = loadBlock('seeds');

let fails = 0, count = 0;
function eq(nome, got, want) {
  count++;
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    fails++; console.error(`✗ ${nome}\n    got:  ${JSON.stringify(got)}\n    want: ${JSON.stringify(want)}`);
  }
}
async function throwsAsync(nome, fn) {
  count++;
  try { await fn(); fails++; console.error(`✗ ${nome} (não lançou)`); } catch (e) { /* ok */ }
}

(async () => {
  // ═══ init em modo ls (Node não tem indexedDB) ═══
  eq('modo fallback', await Store.init(), 'ls');
  eq('ready', Store.ready, true);

  // ═══ seed + volumetria (§8) ═══
  const r = await Seeds.seedAll(Store);
  eq('107 ativos', r.ativos, 107);
  eq('8 dormentes', r.dormentes, 8);
  eq('35 semanas', r.semanas, 35);
  eq('6 checkpoints', r.checkpoints, 6);

  const micros = await Store.all('microconteudos');
  eq('115 registros', micros.length, 115);
  eq('códigos únicos', new Set(micros.map(m => m.codigo)).size, 115);
  eq('ordem única', new Set(micros.map(m => m.ordem)).size, 115);
  eq('todo ativo tem território válido',
    micros.filter(m => !m.dormente).every(m => Seeds.NATUREZA[m.territorio] !== undefined), true);
  eq('toda prioridade é do enum',
    micros.every(m => Seeds.PRIORIDADE_ORDEM.includes(m.prioridade)), true);
  eq('dormentes têm gatilho', micros.filter(m => m.dormente).every(m => !!m.gatilho), true);
  eq('naturezas coerentes (FIN=BLINDAGEM, DAD=HEDGE)',
    [micros.find(m => m.codigo === 'FIN-08').natureza, micros.find(m => m.codigo === 'DAD-01').natureza],
    ['BLINDAGEM', 'HEDGE']);

  // ═══ fila "Próximo arquivo" (§8/§12.1) ═══
  eq('primeiro da fila é MAC-02 (MAX, ordem 1)', Seeds.proximoArquivo(micros).codigo, 'MAC-02');
  await Store.update('microconteudos', 'MAC-02', { status: 'CONCLUIDO' });
  eq('depois de concluir MAC-02 vem MAC-01', Seeds.proximoArquivo(await Store.all('microconteudos')).codigo, 'MAC-01');
  {
    // esgotando os MAX: o próximo nível é ALTA respeitando a ordem do documento
    const m2 = (await Store.all('microconteudos')).map(m =>
      (m.prioridade === 'MAX') ? Object.assign({}, m, { status: 'CONCLUIDO' }) : m);
    eq('MAX esgotado → primeiro ALTA é MAC-04', Seeds.proximoArquivo(m2).codigo, 'MAC-04');
    // dormentes nunca aparecem, mesmo com tudo concluído
    const tudo = m2.map(m => m.dormente ? m : Object.assign({}, m, { status: 'CONCLUIDO' }));
    eq('tudo concluído → fila vazia (dormentes fora)', Seeds.proximoArquivo(tudo), null);
  }

  // ═══ seed idempotente: reseed NÃO apaga progresso nem duplica ═══
  await Store.update('microconteudos', 'FIN-08', { driveUrl: 'https://drive/x', status: 'GERADO' });
  await Seeds.seedAll(Store);
  const fin08 = await Store.get('microconteudos', 'FIN-08');
  eq('reseed preserva status', fin08.status, 'GERADO');
  eq('reseed preserva driveUrl', fin08.driveUrl, 'https://drive/x');
  eq('reseed preserva MAC-02 concluído', (await Store.get('microconteudos', 'MAC-02')).status, 'CONCLUIDO');
  eq('reseed não duplica', (await Store.all('microconteudos')).length, 115);

  // ═══ cronograma (§9) ═══
  const cron = await Store.all('cronograma');
  eq('semanas 1-35 sem buraco', cron.map(c => c.semana).sort((a, b) => a - b).join(','),
    Array.from({ length: 35 }, (_, i) => i + 1).join(','));
  eq('S10 tem CP1', (await Store.get('cronograma', 10)).checkpoint, 'CP1');
  eq('S16 tem CP2', (await Store.get('cronograma', 16)).checkpoint, 'CP2');
  eq('S22 tem CP3', (await Store.get('cronograma', 22)).checkpoint, 'CP3');
  eq('S31 tem CP4', (await Store.get('cronograma', 31)).checkpoint, 'CP4');
  eq('S1 planeja MAC-02', (await Store.get('cronograma', 1)).plano.MACRO, ['MAC-02']);
  eq('fases coerentes', [
    (await Store.get('cronograma', 10)).fase,
    (await Store.get('cronograma', 11)).fase,
    (await Store.get('cronograma', 23)).fase
  ], [1, 2, 3]);
  {
    // todo código citado no cronograma existe nos microconteúdos
    const codigos = new Set(micros.map(m => m.codigo));
    const citados = [];
    cron.forEach(c => {
      if (c.plano) Object.values(c.plano).forEach(arr => citados.push(...arr));
      if (c.codigos) citados.push(...c.codigos);
    });
    eq('códigos do cronograma existem', citados.filter(c => !codigos.has(c)), []);
  }

  // ═══ CRUD genérico ═══
  const s1 = await Store.add('sessoes', { data: '2026-07-20', territorio: 'MACRO', minutos: 120 });
  const s2 = await Store.add('sessoes', { data: '2026-07-21', territorio: 'ECONOMETRIA', minutos: 120 });
  eq('ids auto-incrementados', [s1.id, s2.id], [1, 2]);
  eq('createdAt presente', typeof s1.createdAt, 'number');
  await Store.update('sessoes', 1, { minutos: 150 });
  eq('update aplica patch', (await Store.get('sessoes', 1)).minutos, 150);
  await Store.remove('sessoes', 2);
  eq('remove', (await Store.all('sessoes')).length, 1);
  await throwsAsync('add sem chave em tabela keyed lança', () => Store.add('checkpoints', { semana: 99 }));
  await throwsAsync('chave duplicada lança', () => Store.add('checkpoints', { id: 'CP1', semana: 10 }));

  // item C/E persiste campos derivados do motor (o Store não recalcula)
  const it = await Store.add('itens', {
    data: '2026-07-20', microcodigo: 'MAC-02', territorio: 'MACRO', loteId: 1,
    resposta: 'C', correto: true, confianca: 4, tempoMs: 45000, tipoErro: null, score: 1
  });
  eq('item persistido', (await Store.get('itens', it.id)).microcodigo, 'MAC-02');

  // settings + snapshot
  await Store.setSetting('blueprintAtivo', '2024');
  eq('setting roundtrip', await Store.getSetting('blueprintAtivo'), '2024');
  await Store.putSnapshot('S1', { horas: 14 });
  await Store.putSnapshot('S1', { horas: 16 });
  const snaps = await Store.all('snapshots');
  eq('snapshot upsert por weekKey', [snaps.length, snaps[0].horas], [1, 16]);

  // ═══ backup: export → wipe → import → intacto ═══
  const bundle = await Store.exportAll();
  eq('bundle identifica o app', bundle.app, 'bcb-study');
  await Store.clear('microconteudos'); await Store.clear('sessoes');
  eq('wipe confirmado', (await Store.all('microconteudos')).length, 0);
  await Store.importAll(bundle);
  eq('import restaura 115 micros', (await Store.all('microconteudos')).length, 115);
  eq('import restaura progresso', (await Store.get('microconteudos', 'FIN-08')).status, 'GERADO');
  eq('import restaura sessões', (await Store.all('sessoes')).length, 1);
  const s3 = await Store.add('sessoes', { data: '2026-07-22', territorio: 'COSIF' });
  eq('contador de id sobrevive ao import (sem colisão)', s3.id > 1, true);
  await throwsAsync('backup de outro app é rejeitado', () => Store.importAll({ app: 'r-plus', data: {} }));

  // ═══ resetAll respeita prefixo (não toca chaves alheias) ═══
  localStorage.setItem('rplus7_intocavel', 'x');
  await Store.resetAll();
  eq('bcb1* apagado', (await Store.all('microconteudos')).length, 0);
  eq('chave alheia intacta', localStorage.getItem('rplus7_intocavel'), 'x');

  console.log(fails === 0 ? `✅ ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA FATAL:', e); process.exit(1); });
