// Bancada da Fase 5 — parser de importação + fila de reteste (funções puras).
'use strict';
const mem = {};
global.localStorage = {
  getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }, key: i => Object.keys(mem)[i] || null,
  get length() { return Object.keys(mem).length; }
};
const { loadBlock } = require('./_extract.js');
const S = loadBlock('seeds');

let fails = 0, count = 0;
function eq(nome, got, want) {
  count++;
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    fails++; console.error(`✗ ${nome}\n    got:  ${JSON.stringify(got)}\n    want: ${JSON.stringify(want)}`);
  }
}

const VALIDOS = { 'MAC-02': 'MACRO', 'EEC-05': 'ECONOMETRIA' };

// ═══ parseImport — JSON ═══
{
  const r = S.parseImport(JSON.stringify([
    { enunciado: 'No modelo IS-LM, política fiscal expansionista desloca a IS para a direita.', gabarito: 'C', microcodigo: 'MAC-02', fonte: 'TEC 1' },
    { enunciado: 'curto', gabarito: 'C', microcodigo: 'MAC-02' },
    { enunciado: 'Enunciado válido mas gabarito inválido para teste de rejeição.', gabarito: 'X', microcodigo: 'MAC-02' },
    { enunciado: 'Enunciado válido mas micro desconhecido para teste de rejeição.', gabarito: 'E', microcodigo: 'ZZZ-99' },
  ]), VALIDOS);
  eq('JSON: 1 ok, 3 rejeitadas', [r.ok.length, r.erros.length], [1, 3]);
  eq('JSON: território derivado do micro', r.ok[0].territorio, 'MACRO');
  eq('JSON: fonte preservada', r.ok[0].fonte, 'TEC 1');
  eq('motivos distintos', new Set(r.erros.map(e => e.motivo)).size, 3);
}
// ═══ parseImport — linhas ═══
{
  const r = S.parseImport(
    'MAC-02 | E | Sob metas de inflação, o BC controla diretamente o IPCA. | Cebraspe 2024\n' +
    '\n' +
    'EEC-05 | c | Em MQO, sob as hipóteses clássicas, o estimador é BLUE.\n' +
    'MAC-02 | E', VALIDOS);
  eq('linhas: 2 ok, 1 rejeitada (incompleta)', [r.ok.length, r.erros.length], [2, 1]);
  eq('linhas: gabarito minúsculo normalizado', r.ok[1].gabarito, 'C');
  eq('linhas: linha em branco ignorada', r.erros[0].linha, 4);
}
eq('vazio rejeitado', S.parseImport('', VALIDOS).erros.length, 1);
eq('JSON inválido rejeitado', S.parseImport('[{quebrado', VALIDOS).erros[0].motivo, 'JSON inválido');

// ═══ filaReteste ═══
{
  const banco = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  const tent = [
    // q1: errou depois acertou → FORA da fila (última = certa)
    { bancoId: 1, correto: false, tipoErro: 'LACUNA_CONTEUDO', flagCalibracao: null, createdAt: 10 },
    { bancoId: 1, correto: true, flagCalibracao: null, createdAt: 20 },
    // q2: última errada → NA fila
    { bancoId: 2, correto: true, flagCalibracao: null, createdAt: 10 },
    { bancoId: 2, correto: false, tipoErro: 'INTERPRETACAO', flagCalibracao: null, createdAt: 20 },
    // q3: acertou MAS mal calibrado (marcou com conf 2) → NA fila
    { bancoId: 3, correto: true, flagCalibracao: 'MARCACAO_BAIXA_CONFIANCA', createdAt: 10 },
    // q4: nunca respondida → fora
  ];
  const fila = S.filaReteste(banco, tent).map(q => q.id);
  eq('fila de reteste = [2,3]', fila, [2, 3]);
  eq('tentativa sem bancoId é ignorada', S.filaReteste(banco, [{ correto: false, createdAt: 5 }]).length, 0);
}


// ═══ montarSimulado (Fase 6) ═══
{
  let i = 0;
  const rnd = () => { i = (i + 13) % 97; return i / 97; };
  const banco = [];
  let id = 0;
  const add = (terr, n) => { for (let k = 0; k < n; k++) banco.push({ id: ++id, territorio: terr }); };
  add('PORTUGUES', 5); add('MACRO', 4); add('ECONOMETRIA', 2); add('ESTATISTICA', 2);
  add('LOGICA', 1); add('FINANCAS', 3);
  const comp = { PORTUGUES: 4, MACRO: 3, FINANCAS: 3, ESTATISTICA_ECONOMETRIA: 2, COSIF: 2, LOGICA_ESTAT: 2 };
  const m = S.montarSimulado(banco, comp, rnd);
  eq('sem duplicatas', new Set(m.fila.map(q => q.id)).size, m.fila.length);
  eq('faltantes reportados (COSIF sem banco)', m.faltantes.COSIF, 2);
  eq('total = pedido − faltante', m.fila.length, 16 - m.totalFaltante);
  // EST pode servir os dois blocos, mas cada questão só entra uma vez
  const est = m.fila.filter(q => ['ECONOMETRIA', 'ESTATISTICA', 'LOGICA'].includes(q.territorio)).length;
  eq('blocos estat/lógica servidos sem duplicar', est <= 5, true);
  const port = m.fila.filter(q => q.territorio === 'PORTUGUES').length;
  eq('Português na proporção', port, 4);
}
{
  const m = S.montarSimulado([], { MACRO: 5 }, () => 0.4);
  eq('banco vazio → tudo faltante', [m.fila.length, m.totalFaltante], [0, 5]);
}


// ═══ contarLinhas / diffLinhas (Fase 7) ═══
eq('vazio = 0 linhas', S.contarLinhas(''), 0);
eq('1 char = 1 linha', S.contarLinhas('a'), 1);
eq('70 chars = 1 linha', S.contarLinhas('x'.repeat(70)), 1);
eq('71 chars = 2 linhas', S.contarLinhas('x'.repeat(71)), 2);
eq('parágrafo vazio conta 1', S.contarLinhas('a\n\nb'), 3);
eq('2 parágrafos de 100 = 4 linhas', S.contarLinhas('y'.repeat(100) + '\n' + 'z'.repeat(100)), 4);
{
  const d = S.diffLinhas('a\nb\nc', 'a\nX\nc');
  eq('diff marca troca', d.map(l => l.tipo).join(''), '=-+=');
  eq('diff textos', [d[1].texto, d[2].texto], ['b', 'X']);
  eq('diff idêntico = tudo =', S.diffLinhas('a\nb', 'a\nb').every(l => l.tipo === '='), true);
  eq('diff inserção no fim', S.diffLinhas('a', 'a\nb').map(l => l.tipo).join(''), '=+');
}

console.log(fails === 0 ? `✅ ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
process.exit(fails ? 1 : 0);
