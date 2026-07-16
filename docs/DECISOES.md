# BCB Study — Decisões de projeto (log vivo)

> Formato: data · decisão · fonte. Regra §18 da spec: o plano pedagógico é a fonte de verdade;
> engenharia não altera regra pedagógica.

## 2026-07-16 — Fase 0 (respostas do dono às perguntas do §17/§15)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Repositório | **Substituir o app v1 deste repo (`ultra-bacen`)** pelo BCB Study. O kit `mentor/` permanece. URL: `aafj2023.github.io/ultra-bacen/`. |
| 2 | Firebase | **Projeto novo** (não reusar `doctor-calendar-c4c6f`). Dono cria em console.firebase.google.com (Auth Google + Firestore) e fornece o `firebaseConfig`. Até lá: app roda em **modo local** (Dexie/localStorage + backup JSON), gate desativado por flag. |
| 3 | Origem dos itens C/E | **Ambos**: cadastro manual no app + importador de lote (texto estruturado/JSON: enunciado, gabarito, microcódigo, fonte). |
| 4 | Discursivas | **Grade de autoavaliação** (estrutura, conteúdo, norma culta, aderência ao comando) gera a nota; nota manual continua possível. |

## Premissas assumidas (corrigir se erradas)

- **SRS:** arquivo `05-Metodologia-de-Revisao` não fornecido → defaults do R+ (D+1/D+7/D+15/D+30 + stage `react`) **com a dobra do §12.6** (intervalos ~15% mais curtos em DIREITO/LOGICA/COSIF/ECONOMETRIA). *(§17 pedia confirmação — assumido; sem objeção, vale.)*
- **Email master:** `alvarofelisbertojr@gmail.com` (único). Confirmar antes de gravar em `firestore.rules`.
- **Prefixo de storage:** `bcb1` (localStorage), DB `bcbDB`, cache `bcb-v1` — distinto de `rplus*` nos 5 pontos acoplados (gotcha #2 do mapa herdado), garantindo coexistência no mesmo origin do GitHub Pages.

## 2026-07-16 — Firebase criado pelo dono (Fase 0 fechada)

- Projeto **Aprov-Bacen** (`aprov-bacen`), Firestore em `southamerica-east1`, Auth Google ativo.
- **Email master confirmado:** `alvarofelisbertojr@gmail.com`.
- Config web (público por design — vai inline no `index.html` como `window.BCB_FIREBASE`):
  `apiKey AIzaSyDXXbwnRD7zSEXstCEx5MxNhC_B_M__gMA · authDomain aprov-bacen.firebaseapp.com ·
  projectId aprov-bacen · storageBucket aprov-bacen.firebasestorage.app ·
  messagingSenderId 591355440221 · appId 1:591355440221:web:e80fa1fc30221ba615f1b4`
- ⚠️ **Firestore em modo de teste — regras expiram ~15/08/2026.** As `firestore.rules`
  definitivas (padrão allowlist do R+, master acima) DEVEM ser publicadas na Fase 3, antes
  do prazo.

## 2026-07-16 — Fase 1 entregue (motores puros)

- `js/motor-cebraspe.js` (§5+§11) e `js/motor-ritmo.js` (§6+§10+§9.4); `tests/motor.test.js`
  com **66 casos-limite, 66 verdes** (`node tests/motor.test.js`).
- **Desvio deliberado da spec:** `LIMIAR = 1/3` exato, não o literal `0.3333` do §5.2 —
  a própria §5.4 proíbe arredondamento interno (`deveMarcar(0.3333)===false` está nos testes).
  UI exibe `33,33%` via `LIMIAR_LABEL`.
- Premissas de borda gravadas em teste: `done == expected*1.1` → ontrack (banda estrita);
  `examPacing` com 'ahead' espelhado a +5pp; critérios de checkpoint ≥ inclusivos;
  CP sem dado = reprovado; gatilho Econometria dispara com dado ausente.
- `composicaoSimulado` usa maior-resto (Hamilton) e preserva a ordem de chaves do blueprint.

## 2026-07-16 — Fase 2 entregue (Store + seeds)

- `js/store.js`: dual Dexie(`bcbDB` v1)/localStorage(`bcb1_*`) com **API genérica**
  (`add/put/get/all/update/remove/clear`) — desvio deliberado do CRUD-por-entidade do R+
  (lá os defaults duplicados são gotcha; aqui 11 tabelas tornariam insustentável).
  Backup exige `bundle.app==='bcb-study'` (rejeita backup do R+). `resetAll` apaga só `bcb1*`.
- `js/seeds.js`: §8 literal (107+8, `console.assert` + throw), §9 (35 semanas: F1 grade
  literal, F2 ciclos C1–C6, F3 + 3 de buffer), §10 (6 checkpoints). `seedAll` idempotente
  **preserva progresso** (status/driveUrl/geradoEm) e atualiza campos pedagógicos.
- **Premissa nova:** enum de status do microconteúdo = `PENDENTE→GERADO→EM_ESTUDO→CONCLUIDO`
  (✅ do mapa curricular = CONCLUIDO). A spec não fixa o enum; corrigir aqui se discordar.
- **Premissa nova:** na F1, códigos EST-xx aparecem no slot Lógica do §9.1 (semanas 5/7/8) —
  seedados como estão (estatística de base é manutenção embutida, §9.1 nota).
- Gate: `node tests/store.test.js` 47/47 + regressão motor 66/66. Modo `idb` será validado
  no navegador na Fase 3 (Node não tem IndexedDB; fallback ls cobre a lógica comum).

## 2026-07-16 — Fases 5-12 entregues (app completo)

Premissas registradas durante a implementação (corrigir se discordar):
- **Linha de discursiva** = 70 caracteres; parágrafo vazio conta 1 (bloqueio absoluto da UI).
- **Discursivas nos checkpoints** contam registros (cada versão é uma prática de escrita).
- **Simulado mini/parcial**: duração proporcional aos 210min do completo; hard stop registra
  restante como BRANCO conf 1 (sem flag de calibração); estado em memória (sair = entregar).
- **Dormentes ativados** pelo gap analysis vão para o território `CONT` e mantêm prioridade
  CONT (fim da fila de geração).
- **BLUEPRINT_2027**: `corrigirItem` aceita acerto/erro custom e o limiar é recalibrado
  (p > −erro/(acerto−erro)); ⚠ o agregado `liquido()` continua na convenção Cebraspe −0,5 —
  se o edital 2027 mudar a penalização, ajustar agregadores na fase pós-edital (pendência
  condicional).
- **SRS**: 'Difícil' reagenda +2d sem regredir; react promove direto ao stage 2; dobra
  ~15% (mín. 1 dia) em DIREITO/LOGICA/COSIF/ECONOMETRIA; teto corta exibição, não o banco.

## Pendências que bloqueiam fases

| Fase bloqueada | Pendência | Quem |
|---|---|---|
| Fase 3 (**prazo 15/08/2026**) | Publicar `firestore.rules` definitivas no console | Claude prepara · dono publica |
| Fase 11 | Edital Auditor 2027 (para o gap analysis) | mundo |
