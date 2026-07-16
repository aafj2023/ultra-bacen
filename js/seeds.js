// ═══════════════════════════════════════════════════════════════════════════
// SEEDS — dados canônicos do plano (§8 microconteúdos v4 · §9 cronograma 35
// semanas v4 · §10 checkpoints). FONTE DE VERDADE PEDAGÓGICA (§18): nenhuma
// decisão de engenharia altera estes dados. Ordem de geração dos arquivos:
// MAX → ALTA → MEDIA → HEDGE → F2 → CONT; dentro do nível, campo `ordem`
// (= ordem literal da listagem do §8, NUNCA alfabética).
// ═══════════════════════════════════════════════════════════════════════════
(function (root) {
'use strict';

var SEED_VERSION = 1;

var NATUREZA = {
  MACRO: 'RECONSTRUCAO', FINANCAS: 'BLINDAGEM', ECONOMETRIA: 'RECONSTRUCAO',
  ESTATISTICA: 'MANUTENCAO', COSIF: 'RECONSTRUCAO', LOGICA: 'RECONSTRUCAO',
  MICRO: 'MANUTENCAO', FMM: 'MANUTENCAO', PORTUGUES: 'MANUTENCAO',
  DIREITO: 'HEDGE', ATU: 'RECONSTRUCAO'
};
var PRIORIDADE_ORDEM = ['MAX', 'ALTA', 'MEDIA', 'HEDGE', 'F2', 'CONT'];
var STATUS = ['PENDENTE', 'GERADO', 'EM_ESTUDO', 'CONCLUIDO']; // ✅ = CONCLUIDO

// [codigo, nome, itemEdital, prioridade, dificuldade] — ordem literal do §8.
var LISTAS = {
  MACRO: [
    ['MAC-02', 'Fundação IS-LM/demanda agregada (base didática)', 'ed.1', 'MAX', 'M'],
    ['MAC-01', 'Modelo clássico: neutralidade, dicotomia', 'ed.1', 'MAX', 'D'],
    ['MAC-03', 'Novo-keynesiano: rigidez, IS dinâmica, Phillips NK, regra de juros', 'ed.1', 'MAX', 'MD'],
    ['MAC-04', 'AS-AD: construção, choques, ajuste CP→LP', 'ed.1', 'ALTA', 'M'],
    ['MAC-05', 'Solow: estado estacionário, regra de ouro, convergência', 'ed.1', 'MAX', 'D'],
    ['MAC-06', 'Crescimento endógeno (AK, Romer, capital humano)', 'ed.1', 'MAX', 'D'],
    ['MAC-07', 'Escolha intertemporal: consumo (Fisher, RPC, ciclo de vida), investimento', 'ed.1', 'MAX', 'D'],
    ['MAC-08', 'Escolha intertemporal: governo, ricardiana, conta corrente', 'ed.1', 'MAX', 'D'],
    ['MAC-15', 'Paridade coberta e descoberta (CIP/UIP)', 'ed.5', 'MAX', 'D'],
    ['MAC-16', 'Câmbio, PPC, termos de troca; exportação/importação', 'ed.5', 'MAX', 'D'],
    ['MAC-09', 'PM: regras × discricionariedade; credibilidade (Kydland-Prescott)', 'ed.2', 'ALTA', 'D'],
    ['MAC-10', 'PM convencional: objetivos, instrumentos, operacionalidade', 'ed.2', 'MEDIA', 'M'],
    ['MAC-11', 'PM não convencional: QE, forward guidance', 'ed.2', 'ALTA', 'D'],
    ['MAC-12', 'Regime de metas (arranjo brasileiro, meta contínua)', 'ed.2', 'MEDIA', 'M'],
    ['MAC-13', 'Política macroprudencial e estabilidade financeira', 'ed.3', 'ALTA', 'D'],
    ['MAC-14', 'Política fiscal: déficit, dívida, sustentabilidade (r−g)', 'ed.4', 'ALTA', 'D'],
    ['MAC-17', 'Curva de Phillips, expectativas racionais e inflação', 'ed.6', 'MEDIA', 'M'],
    ['MAC-18', 'Ciclos econômicos reais (RBC)', 'ed.7', 'ALTA', 'D'],
    ['MAC-19', 'Mercado de trabalho: NK × clássico, taxa natural', 'ed.8', 'MEDIA', 'M']
  ],
  FINANCAS: [
    ['FIN-08', 'Teoria de carteiras: média-variância, fronteira, utilidade, ativo livre de risco', 'ed.3', 'MAX', 'D'],
    ['FIN-09', 'CAPM e extensões (CML×SML, beta, multifatores)', 'ed.4.1', 'MAX', 'D'],
    ['FIN-12', 'Renda fixa: apreçamento, duration e convexidade', 'ed.6', 'MAX', 'D'],
    ['FIN-11', 'ETTJ: teorias, taxas à vista/a termo, movimentos', 'ed.5', 'MAX', 'D'],
    ['FIN-14', 'Risco: volatilidade, VaR (premissas!), estresse', 'ed.8', 'MAX', 'D'],
    ['FIN-05', 'Derivativos: futuros, termo, swaps, opções', 'ed.1.8', 'MAX', 'D'],
    ['FIN-07', 'Eficiência de mercado: formas, propriedades, estratégias', 'ed.2', 'MAX', 'M'],
    ['FIN-10', 'APT', 'ed.4.2', 'ALTA', 'D'],
    ['FIN-01', 'Títulos do Tesouro (LTN, NTN-B/F, LFT)', 'ed.1.1', 'ALTA', 'M'],
    ['FIN-02', 'Dívida privada e securitização', 'ed.1.2-3', 'ALTA', 'M'],
    ['FIN-03', 'Compromissadas, depósito a prazo, DI', 'ed.1.4-5', 'ALTA', 'M'],
    ['FIN-04', 'Ações e fundos (CVM 175)', 'ed.1.6-7', 'ALTA', 'M'],
    ['FIN-06', 'Derivativos de crédito (CDS, TRS)', 'ed.1.9', 'ALTA', 'D'],
    ['FIN-13', 'Riscos ESG', 'ed.7', 'MEDIA', 'F']
  ],
  ECONOMETRIA: [
    ['EEC-05', 'Regressão simples e múltipla (MQO, hipóteses) — do zero na prática', 'ed.4', 'MAX', 'M'],
    ['EEC-08', 'Violações: heterocedasticidade, autocorrelação, multicolinearidade, endogeneidade', 'ed.4', 'MAX', 'D'],
    ['EEC-06', 'Séries temporais: estacionariedade, raiz unitária, VAR', 'ed.5', 'MAX', 'D'],
    ['EEC-09', 'Cointegração e correção de erros (VEC)', 'ed.5', 'ALTA', 'D'],
    ['EEC-07', 'Dados em painel: EF, EA, técnicas de identificação', 'ed.6', 'MAX', 'D'],
    ['EEC-10', 'Interpretação de output econométrico (leitura de tabelas de regressão)', 'ed.3-6', 'MAX', 'M'],
    ['EEC-02', 'LGN, TCL, processos estocásticos', 'ed.2,7', 'ALTA', 'D']
  ],
  ESTATISTICA: [
    ['EST-06', 'Distribuições, esperança, momentos, esperança condicional', 'esp.1', 'MEDIA', 'M'],
    ['EST-07', 'Inferência: estimação pontual/intervalar, propriedades', 'esp.3', 'MEDIA', 'M'],
    ['EST-08', 'Testes de hipóteses e amostragem', 'esp.3', 'MEDIA', 'M'],
    ['EST-04', 'Probabilidade condicional e independência (Bayes)', 'bas.2.5', 'MEDIA', 'M'],
    ['EST-01', 'População, amostra, histogramas, frequências', 'bas.2.1-2', 'MEDIA', 'F'],
    ['EST-02', 'Medidas de posição (média, moda, mediana, separatrizes)', 'bas.2.3', 'MEDIA', 'F'],
    ['EST-03', 'Medidas de dispersão absoluta e relativa', 'bas.2.4', 'MEDIA', 'M'],
    ['EST-05', 'Variável aleatória e funções de distribuição', 'bas.2.6', 'MEDIA', 'M']
  ],
  COSIF: [
    ['COS-02', 'Instrumentos financeiros: classificação/mensuração (4.966: SPPI, VJR/VJORA/custo)', 'ed.2', 'ALTA', 'D'],
    ['COS-04', 'Operações de crédito: perdas esperadas, estágios, write-off', 'ed.2.2', 'ALTA', 'D'],
    ['COS-01', 'Princípios gerais, estrutura, escrituração', 'ed.1', 'ALTA', 'M'],
    ['COS-03', 'Interfinanceiras, TVM e derivativos (registro)', 'ed.2.1', 'ALTA', 'D'],
    ['COS-11', 'Conglomerado prudencial', 'ed.10', 'ALTA', 'D'],
    ['COS-10', 'Demonstrações financeiras de divulgação das IFs', 'ed.9', 'ALTA', 'M'],
    ['COS-15', 'Auditoria independente nas IFs', 'ed.14', 'ALTA', 'M'],
    ['COS-08', 'Provisões, passivos e ativos contingentes', 'ed.7', 'MEDIA', 'M'],
    ['COS-05', 'Investimentos mantidos para venda', 'ed.2.3', 'MEDIA', 'M'],
    ['COS-06', 'Arrendamento mercantil', 'ed.3', 'MEDIA', 'M'],
    ['COS-07', 'Não financeiros p/ venda; imobilizado; intangível', 'ed.4-6', 'MEDIA', 'M'],
    ['COS-09', 'PL e remuneração do capital próprio (JCP)', 'ed.8', 'MEDIA', 'M'],
    ['COS-12', 'Combinado cooperativo: balancete e auditoria', 'ed.11', 'MEDIA', 'D'],
    ['COS-13', 'Grupos de consórcio', 'ed.12', 'MEDIA', 'M'],
    ['COS-14', 'Liquidação extrajudicial', 'ed.13', 'MEDIA', 'M']
  ],
  LOGICA: [
    ['LOG-02', 'Proposições, conectivos e tabelas-verdade', '1.3.1-2', 'ALTA', 'M'],
    ['LOG-03', 'Equivalências e leis de Morgan; negações', '1.3.3-4', 'ALTA', 'M'],
    ['LOG-01', 'Estruturas lógicas e argumentação', '1.1-2', 'ALTA', 'M'],
    ['LOG-04', 'Problemas de lógica (verdade/mentira, associação)', '1.3.4', 'ALTA', 'M']
  ],
  MICRO: [
    ['MIC-01', 'Teoria do consumidor (dualidade, Slutsky, demanda)', 'ed.1', 'MEDIA', 'D'],
    ['MIC-02', 'Teoria da firma: produção, custos, oferta', 'ed.1', 'MEDIA', 'M'],
    ['MIC-03', 'Estruturas de mercado e poder de mercado', 'ed.2', 'MEDIA', 'M'],
    ['MIC-07', 'Informação assimétrica: seleção adversa, risco moral', 'ed.4', 'MEDIA', 'D'],
    ['MIC-04', 'Concentração (HHI, CR) e organização industrial', 'ed.2', 'F2', 'D'],
    ['MIC-05', 'Teoria dos jogos (Nash, dominância, repetidos)', 'ed.3', 'F2', 'D'],
    ['MIC-06', 'Leilões (tipos, equivalência de receita, maldição do vencedor)', 'ed.3', 'F2', 'D'],
    ['MIC-08', 'Externalidades e bens públicos (Pigou, Coase)', 'ed.4', 'F2', 'M'],
    ['MIC-09', 'Equilíbrio geral: Walras, Pareto, teoremas do bem-estar', 'ed.5', 'F2', 'D'],
    ['MIC-10', 'Bem-estar social (Arrow)', 'ed.6', 'F2', 'D'],
    ['MIC-11', 'Economia comportamental', 'ed.7', 'F2', 'M']
  ],
  FMM: [
    ['FMM-03', 'Multiplicador monetário; criação/destruição de moeda', 'M3', 'MEDIA', 'M'],
    ['FMM-05', 'Balanço de pagamentos (BPM6)', 'M5', 'MEDIA', 'M'],
    ['FMM-01', 'Contas nacionais e identidades', 'M1', 'MEDIA', 'M'],
    ['FMM-02', 'Agregados monetários (M1-M4)', 'M2', 'MEDIA', 'F'],
    ['FMM-04', 'Contas do sistema monetário', 'M4', 'MEDIA', 'M'],
    ['FMM-07', 'Consumidor básico (indiferença, restrição, efeitos)', 'm2.1-4', 'MEDIA', 'M'],
    ['FMM-08', 'Curva de demanda e elasticidades', 'm2.5-6', 'MEDIA', 'M'],
    ['FMM-06', 'Organização econômica, custo de oportunidade, FPP', 'm1', 'MEDIA', 'F']
  ],
  PORTUGUES: [
    ['POR-10', 'Reescrita e significação (equivalência semântica)', 'ed.6', 'MEDIA', 'D'],
    ['POR-08', 'Concordância verbal e nominal', 'ed.5.5', 'MEDIA', 'M'],
    ['POR-01', 'Compreensão e interpretação; gêneros', 'ed.1,2', 'MEDIA', 'M'],
    ['POR-07', 'Pontuação', 'ed.5.4', 'MEDIA', 'M'],
    ['POR-09', 'Regência, crase, colocação', 'ed.5.6-8', 'MEDIA', 'M'],
    ['POR-06', 'Coordenação e subordinação', 'ed.5.2-3', 'MEDIA', 'M'],
    ['POR-03', 'Coesão: referenciação, conectores', 'ed.4.1', 'MEDIA', 'M'],
    ['POR-04', 'Tempos e modos verbais', 'ed.4.2', 'MEDIA', 'M'],
    ['POR-05', 'Classes de palavras', 'ed.5.1', 'MEDIA', 'M'],
    ['POR-02', 'Ortografia oficial', 'ed.3', 'MEDIA', 'F']
  ],
  DIREITO: [
    ['DAD-06', 'Ato: conceito, requisitos, atributos, comunicação', '4.1-2', 'HEDGE', 'M'],
    ['DAD-07', 'Anulação, revogação, convalidação; discricionariedade × vinculação', '4.3-4', 'HEDGE', 'M'],
    ['DAD-02', 'Poderes; polícia; uso e abuso (Tema 532 STF)', 'ed.2', 'HEDGE', 'D'],
    ['DAD-01', 'Princípios; direta e indireta; entidades (natureza do BCB)', 'ed.1,3', 'HEDGE', 'M'],
    ['DAD-08', '8.112: provimento, vacância, direitos, disciplinar, PAD', 'ed.5', 'HEDGE', 'M'],
    ['DAD-12', 'Improbidade (8.429 c/ 14.230)', 'ed.6', 'HEDGE', 'D'],
    ['DAD-13', 'Ética: Dec. 1.171, Cód. Conduta, 12.813, LAI', 'ed.7-10', 'HEDGE', 'M'],
    ['DAD-16', 'LGPD', 'ed.11', 'HEDGE', 'M']
  ],
  ATU: [
    ['ATU-01', 'Dossiê: conjuntura monetária e inflação', '—', 'F2', 'M'],
    ['ATU-02', 'Dossiê: estabilidade financeira e inovação BCB', '—', 'F2', 'M'],
    ['ATU-03', 'Dossiê: temas transversais (clima, tecnologia, geopolítica)', '—', 'F2', 'M']
  ]
};

// §8.12 Módulos dormentes — fora da fila até o gap analysis (§12.10).
var DORMENTES = [
  ['CONT-SFN-01', 'SFN institucional I: Lei 4.595 e estrutura do SFN', 'edital incluir SFN institucional'],
  ['CONT-SFN-02', 'SFN institucional II: LC 179 (autonomia do BCB) e supervisores', 'edital incluir SFN institucional'],
  ['CONT-SFN-03', 'SFN institucional III: Basileia autônoma', 'edital incluir SFN institucional'],
  ['CONT-FP-01', 'Finanças públicas I: LRF', 'edital incluir finanças públicas'],
  ['CONT-FP-02', 'Finanças públicas II: orçamento na CF (arts. 165-169), PPA/LDO/LOA', 'edital incluir finanças públicas'],
  ['CONT-FP-03', 'Finanças públicas III: tributação e federalismo', 'edital incluir finanças públicas'],
  ['CONT-DC-01', 'Direito Constitucional autônomo', 'edital incluir Direito Constitucional'],
  ['CONT-DF-01', 'Direito Financeiro autônomo (Lei 4.320)', 'edital incluir Direito Financeiro']
];

// Constrói a lista final com `ordem` global = ordem literal do documento §8.
function buildMicros() {
  var out = [], ordem = 0;
  Object.keys(LISTAS).forEach(function (terr) {
    LISTAS[terr].forEach(function (l) {
      ordem++;
      out.push({
        codigo: l[0], nome: l[1], territorio: terr, itemEdital: l[2],
        prioridade: l[3], dificuldade: l[4], natureza: NATUREZA[terr],
        status: 'PENDENTE', ordem: ordem, prereqs: [], sucessores: [],
        driveUrl: null, dormente: false, gatilho: null, geradoEm: null
      });
    });
  });
  DORMENTES.forEach(function (d) {
    ordem++;
    out.push({
      codigo: d[0], nome: d[1], territorio: null, itemEdital: null,
      prioridade: 'CONT', dificuldade: null, natureza: null,
      status: 'PENDENTE', ordem: ordem, prereqs: [], sucessores: [],
      driveUrl: null, dormente: true, gatilho: d[2], geradoEm: null
    });
  });
  return out;
}

// ── §9 Cronograma — 35 semanas ───────────────────────────────────────────────
// Fase 1 (1-10): grade literal do §9.1. Fase 2 (11-22): ciclos §9.2.
// Fase 3 (23-32+): §9.3. 33-35: buffer (§9.4, ~3 semanas de folga).
function buildCronograma() {
  var F1 = [
    { s: 1, MACRO: ['MAC-02'], ECONOMETRIA: ['EEC-05'], FINANCAS: ['FIN-08'], COSIF: ['COS-01'], LOGICA: ['LOG-02'], DIREITO: [], disc: null },
    { s: 2, MACRO: ['MAC-01'], ECONOMETRIA: ['EEC-08'], FINANCAS: ['FIN-09'], COSIF: ['COS-02'], LOGICA: ['LOG-03'], DIREITO: ['DAD-06'], disc: null },
    { s: 3, MACRO: ['MAC-03'], ECONOMETRIA: ['EEC-10'], FINANCAS: ['FIN-12'], COSIF: ['COS-04'], LOGICA: ['LOG-01'], DIREITO: [], disc: 'D1: PM/metas' },
    { s: 4, MACRO: ['MAC-04'], ECONOMETRIA: ['EEC-06'], FINANCAS: ['FIN-11'], COSIF: ['COS-03'], LOGICA: ['LOG-04'], DIREITO: ['DAD-07'], disc: 'D2: choque de oferta' },
    { s: 5, MACRO: ['MAC-05'], ECONOMETRIA: ['EEC-09'], FINANCAS: ['FIN-05'], COSIF: ['COS-11'], LOGICA: ['EST-04'], DIREITO: [], disc: 'D3: câmbio/paridades' },
    { s: 6, MACRO: ['MAC-15'], ECONOMETRIA: ['EEC-07'], FINANCAS: ['FIN-14'], COSIF: ['COS-10'], LOGICA: [], DIREITO: ['DAD-02'], disc: 'D4: dívida (r−g)', nota: 'Revisão LOG' },
    { s: 7, MACRO: ['MAC-16'], ECONOMETRIA: ['EEC-02'], FINANCAS: ['FIN-07'], COSIF: ['COS-15'], LOGICA: ['EST-02', 'EST-03'], DIREITO: [], disc: 'D5: crescimento' },
    { s: 8, MACRO: ['MAC-06', 'MAC-07'], ECONOMETRIA: [], FINANCAS: ['FIN-01', 'FIN-02'], COSIF: ['COS-05', 'COS-06'], LOGICA: ['EST-05'], DIREITO: ['DAD-01'], disc: 'D6: escolha intertemporal', nota: 'Revisão econometria + questões' },
    { s: 9, MACRO: ['MAC-08', 'MAC-18'], ECONOMETRIA: [], FINANCAS: ['FIN-03', 'FIN-04'], COSIF: ['COS-07', 'COS-08', 'COS-09'], LOGICA: [], DIREITO: ['DAD-08'], disc: 'D7: estabilidade financeira', nota: 'Simulado econometria · bateria lógica' },
    { s: 10, MACRO: [], ECONOMETRIA: [], FINANCAS: ['FIN-06', 'FIN-10', 'FIN-13'], COSIF: ['COS-12', 'COS-13', 'COS-14'], LOGICA: [], DIREITO: ['DAD-12', 'DAD-13'], disc: 'D8: COSIF/crédito', nota: 'Revisão + simulado · reteste pontos fracos', checkpoint: 'CP1' }
  ];
  var CICLOS = [
    { id: 'C1', semanas: [11, 12], foco: 'Econometria aprofundamento (raiz unitária avançada, cointegração aplicada, painel dinâmico, diagnóstico) + FIN cobertura formal', codigos: [] },
    { id: 'C2', semanas: [13, 14], foco: 'Macro: bloco de política', codigos: ['MAC-09', 'MAC-10', 'MAC-11', 'MAC-12', 'MAC-13', 'MAC-14', 'MAC-17', 'MAC-19'] },
    { id: 'C3', semanas: [15, 16], foco: 'Finanças formal completa (instrumentos, ESG) + estatística revisão', codigos: [], checkpoint: 'CP2' },
    { id: 'C4', semanas: [17, 18], foco: 'COSIF extensão pendente + Micro núcleo', codigos: ['MIC-01', 'MIC-02', 'MIC-03', 'MIC-07'] },
    { id: 'C5', semanas: [19, 20], foco: 'Micro Fase 2 (jogos, leilões, eq. geral, bem-estar, comportamental) + FMM', codigos: ['MIC-04', 'MIC-05', 'MIC-06', 'MIC-08', 'MIC-09', 'MIC-10', 'MIC-11', 'FMM-01', 'FMM-02', 'FMM-03', 'FMM-04', 'FMM-05', 'FMM-06', 'FMM-07', 'FMM-08'] },
    { id: 'C6', semanas: [21, 22], foco: 'Português (bateria) + Lógica avançada + ATU', codigos: ['ATU-01', 'ATU-02', 'ATU-03'], checkpoint: 'CP3' }
  ];
  var out = [];
  F1.forEach(function (w) {
    out.push({
      semana: w.s, fase: 1,
      plano: { MACRO: w.MACRO, ECONOMETRIA: w.ECONOMETRIA, FINANCAS: w.FINANCAS, COSIF: w.COSIF, LOGICA: w.LOGICA, DIREITO: w.DIREITO },
      discursiva: w.disc, nota: w.nota || null, checkpoint: w.checkpoint || null
    });
  });
  CICLOS.forEach(function (c) {
    c.semanas.forEach(function (s, i) {
      out.push({
        semana: s, fase: 2, ciclo: c.id, foco: c.foco,
        codigos: i === 0 ? c.codigos : [],   // códigos ancorados na 1ª semana do ciclo
        discursiva: 'discursiva semanal', nota: null,
        checkpoint: (i === c.semanas.length - 1 && c.checkpoint) ? c.checkpoint : null
      });
    });
  });
  out.push({ semana: 23, fase: 3, foco: 'Gap analysis edital Auditor; ativar contingência; recalibrar', discursiva: 'discursiva semanal', checkpoint: null });
  for (var s = 24; s <= 30; s++)
    out.push({ semana: s, fase: 3, foco: 'Simulado completo semanal + análise de erros; discursiva às cegas; revisão espaçada', discursiva: 'discursiva às cegas', checkpoint: null });
  out.push({ semana: 31, fase: 3, foco: 'Só revisão, questões, descanso', discursiva: null, checkpoint: 'CP4' });
  out.push({ semana: 32, fase: 3, foco: 'Só revisão, questões, descanso', discursiva: null, checkpoint: null });
  for (s = 33; s <= 35; s++)
    out.push({ semana: s, fase: 3, foco: 'Buffer (§9.4): folga p/ reforço de Econometria, contingência do edital ou semanas perdidas', discursiva: null, checkpoint: null });
  return out;
}

// ── §10 Checkpoints (critérios em LÍQUIDO — frações) ────────────────────────
var SEED_CHECKPOINTS = [
  { id: 'CP0', semana: 1, dataAprox: 'jul/26', descricao: 'Cobertura de Finanças/COSIF/Econometria confirmada no curso' },
  { id: 'CP1', semana: 10, dataAprox: 'set/26', criterios: { FINANCAS: 0.85, MACRO: 0.65, ECONOMETRIA: 0.60, LOGICA: 0.70, COSIF: 0.60, ESTATISTICA: 0.80, DIREITO: 0.50 }, discursivasMin: 8 },
  { id: 'CP2', semana: 16, dataAprox: 'nov/26', liquidoGlobalMin: 0.65, itensMin: 100, descricao: '100 itens em proporção real do blueprint' },
  { id: 'CP3', semana: 22, dataAprox: 'dez/26', liquidoGlobalMin: 0.70, discursivasMin: 20, coberturaMin: 100 },
  { id: 'GAP', semana: null, dataAprox: 'até 03/01/27', descricao: 'Gap analysis do edital Auditor em 7 dias' },
  { id: 'CP4', semana: 31, dataAprox: 'fev-mar/27', liquidoGlobalMin: 0.75, descricao: 'Simulado completo' }
];

// ── Fila "Próximo arquivo" (§8/§12.1): primeiro PENDENTE na ordem
// MAX→ALTA→MEDIA→HEDGE→F2→CONT; dentro do nível, campo `ordem`. Dormentes
// NUNCA entram (só o gap analysis os acorda). Função pura.
function proximoArquivo(micros) {
  var fila = micros.filter(function (m) { return !m.dormente && m.status === 'PENDENTE'; });
  fila.sort(function (a, b) {
    var pa = PRIORIDADE_ORDEM.indexOf(a.prioridade), pb = PRIORIDADE_ORDEM.indexOf(b.prioridade);
    return pa - pb || a.ordem - b.ordem;
  });
  return fila.length ? fila[0] : null;
}

// ── seedAll: idempotente; NUNCA sobrescreve progresso do usuário ────────────
// (status/driveUrl/geradoEm de registro existente são preservados; campos
// pedagógicos — nome/prioridade/ordem/etc. — são atualizados pela versão nova).
async function seedAll(Store) {
  var micros = buildMicros();

  // §8: console.assert da volumetria (obrigatório na spec)
  var ativos = micros.filter(function (m) { return !m.dormente; }).length;
  var dorm = micros.filter(function (m) { return m.dormente; }).length;
  console.assert(ativos === 107, 'volumetria: esperados 107 ativos, há ' + ativos);
  console.assert(dorm === 8, 'volumetria: esperados 8 dormentes, há ' + dorm);
  var porTerr = { MACRO: 19, FINANCAS: 14, ECONOMETRIA: 7, ESTATISTICA: 8, COSIF: 15, LOGICA: 4, MICRO: 11, FMM: 8, PORTUGUES: 10, DIREITO: 8, ATU: 3 };
  Object.keys(porTerr).forEach(function (t) {
    var n = micros.filter(function (m) { return m.territorio === t; }).length;
    console.assert(n === porTerr[t], 'volumetria ' + t + ': esperado ' + porTerr[t] + ', há ' + n);
  });
  if (ativos !== 107 || dorm !== 8) throw new Error('volumetria do seed inválida');

  var existentes = {};
  (await Store.all('microconteudos')).forEach(function (m) { existentes[m.codigo] = m; });
  for (var i = 0; i < micros.length; i++) {
    var m = micros[i], ex = existentes[m.codigo];
    if (ex) {
      // preserva progresso; atualiza campos pedagógicos
      m = Object.assign({}, m, { status: ex.status, driveUrl: ex.driveUrl, geradoEm: ex.geradoEm, dormente: ex.dormente });
    }
    await Store.put('microconteudos', m);
  }

  var cron = buildCronograma();
  console.assert(cron.length === 35, 'cronograma: esperadas 35 semanas, há ' + cron.length);
  for (i = 0; i < cron.length; i++) await Store.put('cronograma', cron[i]);
  for (i = 0; i < SEED_CHECKPOINTS.length; i++) await Store.put('checkpoints', SEED_CHECKPOINTS[i]);

  await Store.setSetting('seedVersion', SEED_VERSION);
  return { ativos: ativos, dormentes: dorm, semanas: cron.length, checkpoints: SEED_CHECKPOINTS.length };
}

var M = {
  SEED_VERSION: SEED_VERSION, PRIORIDADE_ORDEM: PRIORIDADE_ORDEM, STATUS: STATUS,
  NATUREZA: NATUREZA, buildMicros: buildMicros, buildCronograma: buildCronograma,
  SEED_CHECKPOINTS: SEED_CHECKPOINTS, proximoArquivo: proximoArquivo, seedAll: seedAll
};
if (typeof module !== 'undefined' && module.exports) module.exports = M;
else root.Seeds = M;
})(typeof self !== 'undefined' ? self : this);
