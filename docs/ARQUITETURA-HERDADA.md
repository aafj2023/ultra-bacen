# ARQUITETURA HERDADA — R+ Study → BCB Study

> Mapa de clonagem da espinha dorsal do R+ Study (`/home/user/r-plus-study/index.html`, PWA de arquivo único com 1972 linhas: CSS 31–246, HTML 248–785, JS 787–1970; mais `sw.js`, `manifest.webmanifest`, `firestore.rules`). Alvo: **BCB Study** — app de concurso com 11 territórios com peso, itens Certo/Errado com confiança 1–5 e taxonomia de erros, SRS com dobra de intervalos, simulado 3h30 e discursivas.
>
> Legenda de decisão: **INTACTO** = copiar byte a byte (só renomear identificadores se indicado) · **ADAPTAR** = mecânica preservada, parâmetros/shape/rotulagem mudam · **REESCREVER** = só o padrão sobrevive, corpo novo · **NOVO** = não existe no R+, construir do zero.

---

## 1. Função → linhas → decisão

Linhas referem-se a `index.html` salvo indicação contrária.

### 1.1 Fundação temporal e estado global

| Função | Linhas | Decisão | Por quê |
|---|---|---|---|
| `ymd`/`parseYMD`/`monday`/`today`/`mondayStr` | 788–795 | **INTACTO** | Fundação anti-timezone de TODO o app: datas 'YYYY-MM-DD' em horário LOCAL (comentário na 790: evita virada de dia às 21h em UTC-3). Comparação lexicográfica depende do zero-padding. Nunca substituir por `toISOString().slice(0,10)`. |
| `SK='rplus7'` | 788 | **ADAPTAR** | Trocar por prefixo próprio (ex.: `'bcb1'`) e usá-lo em TODAS as chaves derivadas — ver gotcha #2. |
| `def()` + `D` + `save()` | 797–806 | **ADAPTAR** | Padrão intacto: hidratação síncrona de `localStorage[SK]` + `Object.assign(def(),parsed)` (tolera campos novos) + `save()` de triplo destino (localStorage + `Store.setSetting('appState',D)` + `Cloud.schedulePush()`, com guards `typeof`). Shape de `def()` reescrito: trocar `aulaGoal/qGoal/totalAulas/aulaLog` por metas do concurso e adicionar `territorios:[{id,nome,peso,metaQ}]` (11 itens seedados). |
| `sumLog` + getters (`cumAulas/weekAulas/monthAulas/todayAula`, idem Q) + `monthStart/weeksInMonth` | 1071–1082 | **INTACTO** | Contadores agregados sobre mapas `{'YYYY-MM-DD':n}` com filtro por comparação de string — o padrão mais reutilizável do app. Manter agregado para o pacing; dimensão por território vem do histórico granular do Store. |
| Getters de meta com override (`aulaGoal()`/`qGoal()` + `aulaMonthMeta()/qMonthMeta()`) | 1084–1087 | **ADAPTAR** | Padrão getter+override semanal é ouro (overrides zeram na segunda). Meta mensal é DERIVADA (`meta_semanal × dias_do_mês/7`), não armazenada. Renomear unidades; se pesos entrarem, manter retorno escalar por horizonte para o `pacing()` continuar plugável. |
| `daysLeft/weeksLeft/pctDone/remaining/daysLeftWeek` | 1090–1094 | **ADAPTAR** | Corrigir `new Date(D.provaDate)` (parse UTC) → `parseYMD`. Para BCB, `pctDone` vira percentual **ponderado** (Σ peso·feito / Σ peso·total) — o resto do motor consome escalares e não muda. |
| `checkWeekReset()` | 1136–1143 | **ADAPTAR** | Vira snapshot semanal + zera overrides, mas só roda em `launchApp()`. No clone: chamar também em `visibilitychange`/timer, e tratar N semanas puladas (hoje viram UM snapshot inflado que distorce `pace()`). |

### 1.2 Motor de ritmo (pacing engine)

| Função | Linhas | Decisão | Por quê |
|---|---|---|---|
| `pacing(target,done,dElapsed,dTotal)` | 1753–1766 | **INTACTO** | Núcleo PURO e agnóstico de domínio: `expected=target*(dElapsed/dTotal)`, status `done/ahead/ontrack/behind` com banda ±10%, `expPct` posiciona a marca `.pmark`. É o coração do subsistema. |
| `pace()` (ritmo real ponderado) | 1097–1105 | **INTACTO** | Média ponderada das últimas 4 semanas (pesos 1..4) com fallbacks robustos. Só renomear unidade. Depende do `checkWeekReset` alimentar `weekHistory` corretamente. |
| `proj()` (projeção até a prova) | 1106–1115 | **INTACTO** | Modelo linear simples/eficaz. Atenção: `finishDate` é objeto `Date`, única data não-string do app. Com `pctDone` ponderado, funciona sem mudanças. |
| `weekPacing()/monthPacing()` | 1767–1768 | **ADAPTAR** | ÚNICO ponto de ligação entre getters de domínio e o `pacing()` genérico — é aqui que territórios/pesos se plugam no clone. |
| `examPacing()` + `projectAtDate()/endOfNextMonth()` | 1769–1787 | **ADAPTAR** | Curva planejada linear ancorada em `firstWeek`. Trocar parsing UTC por `parseYMD`. Folgas ±5pp / −3pp calibradas à mão. |
| `risk()` (semáforo do header) | 1116–1133 | **ADAPTAR** | Copiar a **regra de coerência** (se `weekPacing` behind, header sobe low→med para não contradizer o card) — é o insight valioso. Recalibrar limiares (1.5x/1.15x, 25/12pp) para volume de concurso. |
| `statusPill()` / `paceBar()` / `.pmark` | 1884–1895 + CSS 127–129 | **INTACTO** | Trio pacing()+paceBar()+pmark é a espinha dorsal visual, reusado em 4 abas. Interface limpa (consome o objeto de `pacing()`). Extrair cores hex inline p/ tokens; corrigir gênero dos rótulos ('adiantada'). |
| `naMsg/nextMonthHtml/examHtml` + `renderHorizons()` | 1896–1920 | **ADAPTAR** | Estrutura copia; textos reescreve. Manter a regra deliberada pílula×texto do `examHtml` (usa `onTime`, ahead só a +8pp — comentário linha 1905). |
| `behavioral()/pickInsight()/renderMissionInsight()` | 1543–1561 | **REESCREVER** | Padrão de priorização warn>good copia; mensagens são de residência médica. Nota: linha 1548 lê `D.aulaGoal` direto DE PROPÓSITO (meta base, ignora override). |
| `renderToday()` (Missão de hoje) + `renderHeader()` | 1234–1251, 1192–1205 | **ADAPTAR** | Fórmula da missão (restante da semana ÷ dias restantes, incluindo hoje; `rT=min(dueReviews,budget)`) copia; unidades e rótulos mudam. |
| `adjAulaGoal/adjQGoal/resetWeek/addQ` | 1254–1256, 1953–1956 | **ADAPTAR** | Steppers de override; ajustar pisos/passos às unidades BCB. |
| Onboarding de metas (`obNext/obSum/obUI`) | 1145–1179 | **REESCREVER** | Slides para concurso (data da prova, territórios/pesos, metas). CRÍTICO: `firstWeek=weekStart=mondayStr()` setado AQUI é a âncora de toda a curva planejada — não esquecer. Contagem de slides hardcoded em 4 lugares (CSS 223-224, HTML, `obUI`, `obNext`). |

### 1.3 Persistência (Store)

| Função | Linhas | Decisão | Por quê |
|---|---|---|---|
| Store IIFE (arquitetura dual idb/ls) | 809–970 | **INTACTO** (arquitetura) | Singleton em closure, `mode='idb'|'ls'`, `ready`, getters read-only, `nextId()` para ids no fallback. Renomear chaves `LSK` (`rplus7_*`→prefixo BCB) e tabelas de domínio. |
| `Store.init()` | 819–844 | **ADAPTAR** | Esqueleto try/open/catch-fallback/migrate/ready intacto. Mudar: DB `'bcbDB'`, colapsar em `version(1)` única com schema final (app novo, sem herança de dados), índice `disciplina`→`territorio` (nome do índice DEVE bater com o campo). |
| CRUD aulas (`addLesson/updateLesson/deleteLesson/getLessons`) | 847–865 | **ADAPTAR** | É O template CRUD para clonar por tabela: defaults + dual-mode + sort por string de data com desempate por `createdAt`. Mudar só defaults, nome da tabela e chave do contador. |
| CRUD questões (`addQuestionRec/getQuestions`) | 868–874 | **ADAPTAR** | Estender defaults para o domínio C/E: `{n, acertos, erros, territorio}` por sessão — alimenta os pesos. O registro item-a-item vai em tabela nova (ver §2). |
| CRUD reviews (`addReview/bulkAddReviews/getReviews/updateReview/deleteReview/clearReviews`) | 877–900 | **ADAPTAR** | `disciplina`→`territorio` (defaults E índice), `lessonId`→`topicId`. Defaults duplicados literais em `addReview` e `bulkAddReviews` — extrair para constante no clone. |
| `setSetting/getSetting` | 903–910 | **INTACTO** | KV totalmente genérico. |
| `putSnapshot()` | 911–915 | **INTACTO** | Upsert por `&weekKey` único; só ajustar prefixos ('A'/'Q') se os tipos mudarem. |
| `migrate()` | 918–928 | **REESCREVER** | Corpo é específico do legado v6→v7 do R+ — descartar. Copiar só o PADRÃO: flag idempotente no meta + try/catch dentro de `init()`. No BCB, o corpo semeia os 11 territórios `{id,nome,peso}` do edital na primeira execução. |
| `exportAll()/importAll()` | 931–966 | **ADAPTAR** | Trocar lista de tabelas. Manter divisão de responsabilidade: `importAll` cuida das tabelas (clear+bulkPut preservando ids), o CHAMADOR cuida do appState+reload. `exportAll` referencia o global `D` (acoplamento escondido). |
| Backup UI (`exportData/triggerImport/importData`) | 1716–1744 | **ADAPTAR** | Fluxo intacto. Mudar tag `app:'rplus-study'`→`'bcb-study'` e **passar a validar** `bundle.app` no import (hoje só checa `data.appState` — backup do R+ importaria no BCB sem aviso). |
| Boot em duas fases + `onStoreReady` | 1966–1969, 1934 | **INTACTO** | First-paint instantâneo com D síncrono; enriquecimento assíncrono via IDB. `onStoreReady` é o hook da "segunda passada" de render. |
| `resetAll()` | 1957–1964 | **ADAPTAR** | Filtro `indexOf('rplus')===0` e `Dexie.delete('rplusDB')` devem casar com os novos nomes — ver gotcha #2. |

### 1.4 SRS (revisão espaçada)

| Função | Linhas | Decisão | Por quê |
|---|---|---|---|
| `REVIEWS` global + `loadReviews()` | 1789–1790 | **INTACTO** | Cache em memória sem reatividade: disciplina "mutou → loadReviews() → render" é obrigatória. |
| `dueReviews()` | 1792 | **INTACTO** | Filtro `pending && dueDate<=today()` (lexicográfico) + sort por urgência. Sem teto no banco — teto só na render. |
| `reviewUrgency()` | 1791 | **ADAPTAR** | **Ponto de injeção do peso do território**: hoje `od*10 + sw` (atraso domina, stage precoce desempata). No BCB: `od*10 + sw + peso*K` ou fator multiplicativo — calibrar mantendo a escala 10x do atraso. |
| `stageLabel` + escada de stages | 1793 | **REESCREVER** | R+ usa escada fixa D+1/D+7/D+15/D+30. BCB usa **SRS com dobra**: intervalos dobram (ex.: D+1→D+2→D+4→D+8→D+16→D+32→D+64) — trocar o mapa do label e a cadeia de gaps. |
| `completeReview()` + `reviewOk/reviewDifficult` | 1795–1809 | **ADAPTAR** | Máquina de estados copia (react promove direto; 'Difícil' reagenda +2d SEM regredir stage; último stage → done; intervalos ancorados em `today()` da conclusão, não no dueDate). Gaps reescritos para dobra; `REVIEW_QS=8` pode virar função do peso; decidir se mantém a soma ao `questLog` (revisão = bloco de questões). |
| `REVIEW_QS/RECENCY/reviewBudget()/addDays` | 1746–1750 | **ADAPTAR** | `reviewBudget` e `addDays` intactos. `RECENCY`: refaixar para concurso ('este mês / semestre passado / ano passado'). |
| `seedRetro()` | 1864–1875 | **ADAPTAR** | Peça mais reutilizável: substituição idempotente das retro-pending + expansão + sort por antiguidade + distribuição `budget/dia` a partir de amanhã. No BCB: rows por território, sort por `_u` E peso. Lembrar: chama `Cloud.schedulePush()` explícito (não passa por `save()`). |
| Modal retro (`openRetro/.../saveRetro`) | 1834–1881 | **ADAPTAR** | 'Disciplina/Nº aulas'→'Território/Nº tópicos'. Manter o `confirm()` de substituição. |
| Gancho estudo→revisão (`saveLessonModal`) | 1428–1452 | **ADAPTAR** | Bifurcação react/D+1 (aula >2 dias atrás → reativação hoje; senão D+1 da DATA do estudo) copia; entidade vira tópico de território. |
| `quickLogAula` / `undoLastAula` / `removeReviewForLesson` | 1453–1480 | **ADAPTAR** | Vira "marquei tópico X do território Y". `removeReviewForLesson` assume 1 pending por item (`find`) — trocar por `filter` se o BCB permitir múltiplas. |
| `renderReviews` + `renderReviewsSummary/toggleReviews` | 1811–1832, 1921–1931 | **ADAPTAR** | Estrutura copia; exibir peso do território; cor via mapa estático. Ids interpolados crus no onclick — manter ids numéricos. |

### 1.5 Shell de UI

| Função | Linhas | Decisão | Por quê |
|---|---|---|---|
| Tokens CSS `:root` | 31–36 | **ADAPTAR** | Estrutura de tokens copia, MAS dezenas de hex hardcoded fora deles (gradiente `#4338ca,#7c3aed` em 3 lugares + meta theme-color, cores de charts/paceBar/heatmap) — rebranding = busca/substituição, não só tokens. |
| Layout (hdr + content + panes) | 38–66, 349–372, 711 | **INTACTO** | `padding-bottom:64px` do `.content` acoplado à altura da `.bnav` — mudar juntos. |
| `bnav` + `goTab` + `TABS` | 68–72, 713–719, 1936–1950 | **ADAPTAR** | Mecanismo intacto; acoplamento triplo por convenção (chave TABS ↔ ids pane/botão ↔ função renderX). BCB ganha abas novas (Simulado, Discursivas) — registrar os três pontos. |
| Menu de perfil / avatar | 42–51, 722–731, 1206–1231 | **INTACTO** | Genérico (foto Google com fallback iniciais, clique-fora via listener com setTimeout 0). |
| Gate (login) + `showGate/enterApp` | 250–260, 207–219, 1633–1664 | **ADAPTAR** | Estrutura e máquina de estados copiam; branding/textos mudam. `enterApp` acopla ao onboarding via `D.done`. |
| Heatmap | 581–586, 1576–1589 | **ADAPTAR** | Mecanismo (112 células, grid por coluna) copia; thresholds misturam métricas com pesos arbitrários — recalibrar; paleta duplicada em JS e legenda HTML (2 lugares). |
| `streaks()` / `consistency()` | 1516–1532, 1571–1575 | **INTACTO** / ADAPTAR | `streaks()` é 100% genérico. `consistency()` acoplado a `aulaGoal/weekHistory`. |
| `renderCourseMap` | 1590–1606 | **REESCREVER** | Ponto central de adaptação: vira mapa dos 11 territórios com barra = progresso **vs meta ponderada** (hoje é relativa ao máximo). Padrão visual disc-row/pwrap/pfill copia. |
| `discColor/DISC_PAL` | 1406–1408 | **REESCREVER** | Cor por ordem de primeira aparição no runtime = instável entre reloads. Territórios são fixos → **mapa estático território→cor** (manter assinatura `discColor(name)→hex`). |
| `discChips` | 1481–1495 | **ADAPTAR** | Chips derivados do histórico → lista FIXA dos 11 territórios. Corrigir bug de apóstrofo no onclick inline. |
| Modais bottom-sheet | 165–182, 733–785, 1411–1461 | **ADAPTAR** | CSS e padrão de abertura (`closeAllModals()+classList.add`) intactos; campos mudam. Considerar fechar por backdrop/ESC (não existe). `saveLessonModal` acopla 3 sistemas (Store + log diário D + SRS) — manter o tripé. |
| `renderAll` + padrão mutate→save→renderAll | 1187, 806 | **INTACTO** | Simples e à prova de inconsistência nesta escala; charts destroy()+new a cada passada. Monitorar custo se o BCB tiver mais cards. |
| Estados vazios/'Carregando…' por string inline | vários | **INTACTO** | Convenção barata: guard `Store.ready` + HTML instrucional. |

### 1.6 Cloud / Firebase

| Função | Linhas | Decisão | Por quê |
|---|---|---|---|
| `window.RPLUS_FIREBASE` | 20–30 | **ADAPTAR** | Renomear `window.BCB_FIREBASE` + projeto Firebase PRÓPRIO (não reutilizar `doctor-calendar-c4c6f`). Ausência = modo 'unconfigured' (degradação graciosa). |
| Cloud IIFE completo | 972–1068 | **INTACTO** | Agnóstico ao domínio (serializa o blob do `exportAll`) — a troca disciplinas→territórios NÃO o toca. Mudar: `MASTER_EMAILS` (linha 977), prefixo das 3 chaves LS. |
| `loadSeq`/`init` (SDK compat 10.12.2) | 983–996 | **INTACTO** | Versão `V` duplicada no PRECACHE do sw.js (linhas 12–14) — bump nos dois. |
| `signIn/signOut/retryOtherAccount` | 997–1003 | **INTACTO** | Considerar fallback `signInWithRedirect` (popup falha em PWA iOS standalone). |
| `checkAccess/isMaster` + allowlist CRUD | 1004–1026 | **ADAPTAR** | Padrão de grace offline (`LS_ACCESS===uid`) é valioso. Emails master duplicados em `firestore.rules` — mudar juntos. |
| `pull/push/schedulePush/wipeCloud/applyRemote/onAuthChange` | 1027–1065 | **INTACTO** | Coração do sync: doc único, overwrite total, last-writer-wins, decisão pull-vs-push só no login. Preservar a ordem `data.appState=D` FORÇADO depois do `exportAll()` (1034–1035). |
| `renderCloud` / Admin UI | 1666–1713 | **INTACTO** | Genéricos. |
| `firestore.rules` | rules 1–33 | **ADAPTAR** | Estrutura allowlist+backup-por-dono copia; trocar emails master. Publicação no console é passo MANUAL de deploy. |

### 1.7 PWA / deploy

| Função | Linhas | Decisão | Por quê |
|---|---|---|---|
| `sw.js` CACHE+PRECACHE | sw.js 2–15 | **ADAPTAR** | `'rplus-v2'`→`'bcb-v1'` em DOIS lugares (linha 2 e `startsWith('rplus')` na 28). URLs de CDN idênticas às do index.html. |
| Handlers install/activate/fetch | sw.js 17–57 | **INTACTO** | `allSettled` no precache, `skipWaiting+claim`, network-first p/ documento com put fixo em `'./index.html'` (só funciona porque é single-file), cache-first+revalidação p/ resto, bypass de não-GET (essencial p/ Firestore). |
| `manifest.webmanifest` | 1–18 | **ADAPTAR** | Nome/descrição/cores/ícones. MANTER `start_url`/`scope` relativos `'./'` (subpath do GitHub Pages). Gerar maskable de verdade. |
| Tags PWA no head + registro do SW | 4–17 | **ADAPTAR** | Trocar título/theme-color; hrefs relativos preservados. Registro `.catch(()=>{})` silencioso — testar com DevTools. |
| CDNs Chart.js/Dexie | 18–19 | **ADAPTAR** | Copiar tags; **pinar Dexie em versão exata + adicionar SRI** (hoje `@4` flutuante sem integrity é o único script sem SRI). |
| Deploy GitHub Pages | PROXIMOS_PASSOS.md 6–11, 51–58 | **REESCREVER** | Replicar o modelo (repo + Pages em subpath, tudo path-relativo, bump `bcb-vN` ao mudar libs); handoff doc novo. |

### 1.8 Sem herança — construir NOVO no BCB Study

| Módulo | Base de apoio herdada |
|---|---|
| Registro item-a-item Certo/Errado com confiança 1–5 + taxonomia de erros | Template CRUD do Store (847–865) + tabela nova `itens` (ver §2) |
| Simulado 3h30 (timer, bloco de itens, correção com penalidade C/E) | Modais bottom-sheet + tabela nova `simulados`; nada de timer existe no R+ |
| Discursivas (banco de temas, autoavaliação) | Template CRUD + padrão de lista `.hl` |
| Matriz confiança×acerto (calibração) e drill por taxonomia de erro | pacing()/paceBar como componentes de exibição |
| Dark mode / toasts / skeletons | NÃO existem no R+ (`color-scheme:light` fixo; alert/confirm nativos; `@keyframes pop` é dead code) — se o plano do BCB os assume, são construções novas |

---

## 2. Formas de dados persistidos

### 2.1 Herdadas (com renomeação de prefixo `rplus7`→prefixo BCB)

- **appState `D`** (localStorage `SK`, espelhado em `Store.settings['appState']` e no doc Firestore): `{done:bool, provaDate:'YYYY-MM-DD', userName, aulaGoal, qGoal, totalAulas, lessonMin, reviewBudget:20, aulaWeekOverride:null|n, qWeekOverride, aulaLog:{'YYYY-MM-DD':n}, questLog:{...}, weekHistory:[{label:'S1',n}], qWeekHistory:[...], weekStart:'YYYY-MM-DD'(segunda atual), firstWeek:'YYYY-MM-DD'(âncora da curva planejada)}` — no BCB, adicionar `territorios:[{id,nome,peso,metaQ}]` e trocar unidades.
- **lessonsHistory** (→ `sessoesEstudo`): `{id:auto|nextId, date:'YYYY-MM-DD' local, disciplina→territorio, nome, numero:null|n, duracao:null|min, obs, createdAt:ms, updatedAt:ms, timestamp:ms(legado — remover no clone)}`.
- **questionsHistory** (→ `sessoesQuestoes`): `{id, date, n, disciplina→territorio, createdAt, updatedAt}` — estender com `{acertos, erros}`. Nota: no R+ o `addQ` NÃO grava aqui (só em `D.questLog`); registros vêm da migração.
- **reviews**: `{id, disciplina→territorio, label, stage:'react'|1..N (TIPO MISTO string/number), dueDate:'YYYY-MM-DD'|null, status:'pending'|'done', origin:'lesson'|'retro', lessonId→topicId:null|n, lastScore:'ok'|'dificil'|null, doneAt?:'YYYY-MM-DD', createdAt:ms, updatedAt:ms}` — SEM campo `timestamp`. No BCB: adicionar `peso` e estender a escada para a dobra.
- **weeklySnapshots**: `{id:auto, weekKey:único ('A'+label|'Q'+label), tipo, label, n, createdAt, updatedAt}`.
- **settings**: `{key:'&key', value:any, updatedAt:ms}`; no modo ls vira `meta['set_'+key]`.
- **streaks**: tabela `'&key'` declarada/exportada mas SEM CRUD no Store — vestigial; podar no clone ou implementar de verdade.
- **store meta** (localStorage `<prefixo>_store_meta`): `{lid?/qid?/rid?:contadores de id do modo ls, migratedV1?:true, snaps?:{weekKey:rec}, 'set_<key>'?:any}` — descartar o meta num import causa colisão de ids no fallback ls.
- **bundle de backup**: `{app:'bcb-study', version:1, exportedAt:ISO-UTC, data:{meta, appState, <todas as tabelas>[]}}` — `importData` aceita também o `data` cru (retrocompat).
- **Firestore** `backups/{uid}`: `{data:<bundle>, updatedAt:ms do CLIENTE (não serverTimestamp), email}` — doc único, limite 1 MiB. `allowed_users/{email-lowercase}`: `{email, enabled:bool, role:'tester', addedBy, addedAt:ms}`.
- **localStorage do Cloud**: `<prefixo>_cloud_sync` (lastSync ms), `<prefixo>_cloud_uid` (troca de conta zera lastSync), `<prefixo>_access` (grace offline).
- **Cache Storage**: um cache `'bcb-vN'`; documento sempre sob a chave `'./index.html'`.
- **Convenções transversais**: datas de calendário = strings `'YYYY-MM-DD'` LOCAIS comparáveis lexicograficamente; timestamps de auditoria/sync = epoch-ms `Date.now()`. Dois sistemas de tempo coexistem — nunca misturar numa mesma fórmula.

### 2.2 Novas (propostas para o domínio BCB)

- **itens** (registro C/E item-a-item): `{id, date, territorio, resposta:'C'|'E', gabarito:'C'|'E', acertou:bool, confianca:1-5, taxErro:null|'conteudo'|'interpretacao'|'atencao'|'chute'|..., fonte:'estudo'|'simulado', simuladoId:null|n, createdAt, updatedAt}` — índices `date, territorio, taxErro, simuladoId`.
- **simulados**: `{id, date, duracaoSeg (alvo 12600=3h30), status:'andamento'|'finalizado', itens:n, acertos, erros, brancos, liquido (C/E: acerto−erro), porTerritorio:{id:{n,acertos,erros}}, createdAt}`.
- **discursivas**: `{id, date, tema, territorio, palavras, notaAuto:0-10, obs, createdAt, updatedAt}`.
- **seed de territórios**: gravado no `migrate()` inicial como setting ou embutido em `D.territorios` — referenciar território por **id**, não string livre.

---

## 3. Top-10 gotchas que quebrariam o clone

1. **Timezone dividido.** `ymd/parseYMD/today` são deliberadamente LOCAIS (linha 790: virada de dia às 21h em UTC-3), mas `daysLeft`, `examPacing`, `projectAtDate`, `reviewUrgency`, `streaks` usam `new Date('YYYY-MM-DD')` = meia-noite UTC. Hoje funciona porque cada fórmula compara UTC-com-UTC; **misturar os dois estilos numa fórmula nova quebra em UTC-3**. No clone: padronizar TUDO em `parseYMD`, e nunca `toISOString().slice(0,10)`.
2. **Prefixo `rplus` em 5 pontos acoplados.** localStorage (`rplus7*`), Dexie (`'rplusDB'`), cache do SW (`'rplus-v2'` + `startsWith('rplus')` na linha 28 do sw.js), `resetAll()` (apaga por `indexOf('rplus')===0`) e nome do bundle. Se BCB e R+ coexistirem no mesmo origin (mesmo usuário do GitHub Pages), prefixo repetido faz **um app apagar os dados/caches do outro**. Escolher prefixo único e trocar nos 5 pontos em conjunto.
3. **Contabilidade dupla D↔Store.** `aulaLog/questLog` (agregado diário em `D`) e `lessonsHistory/reviews` (granular no Store) são paralelos e sincronizados **manualmente** em cada mutador (`saveLessonModal`, `quickLogAula`, `undoLastAula`, `deleteLessonRec`). Esquecer um lado diverge contadores silenciosamente ('untyped' do courseMap é exatamente essa diferença). É o acoplamento escondido mais perigoso ao adaptar.
4. **Índice Dexie = nome literal do campo.** Renomear `disciplina`→`territorio` exige mudar os defaults dos CRUDs **e** as strings de `stores()` — e índice novo exige bump de `version()`. App novo: começar com `version(1)` única contendo o schema final; nunca remover versões depois de publicado.
5. **Só `save()` agenda push para a nuvem.** Escritas diretas no Store (ex.: `bulkAddReviews` no `seedRetro`) precisam de `Cloud.schedulePush()` explícito (padrão da linha 1873). Toda feature nova do BCB que escreva no Store sem passar por `save()` vai "funcionar" localmente e nunca sincronizar. Além disso o push é `setTimeout` de 1500ms sem flush em `beforeunload` — fechar a aba perde o push.
6. **Sync = last-writer-wins de doc único com relógio do cliente.** `updatedAt`/`lastSync` usam `Date.now()` (não serverTimestamp); a decisão pull-vs-push só acontece no login/troca de uid; dois aparelhos abertos se sobrescrevem. E o backup inteiro vive em UM doc Firestore (limite 1 MiB) — com registro item-a-item C/E do BCB, o bundle cresce muito mais rápido que no R+: **monitorar tamanho ou paginar**.
7. **SRS: `stage` é tipo misto e o teto nunca reagenda.** `stage` é `'react'` OU número — todo código precisa do branch `==='react'` antes de `+r.stage` (normalizar no clone). `reviewBudget` só corta na renderização (`slice`), nunca no banco; 'Difícil' NÃO regride stage (loop +2d eterno); defaults duplicados em `addReview`/`bulkAddReviews`; `completeReview` injeta `REVIEW_QS=8` no `questLog` — revisões inflam o contador de questões por design; se remover, remover os dois lados juntos.
8. **`checkWeekReset` só roda em `launchApp()` e semana começa SEGUNDA.** PWA aberta cruzando a segunda não vira a semana; N semanas sem abrir viram UM snapshot inflado que distorce `pace()` e a consistência. Na segunda, `dElapsed=0` → tudo 'ontrack' por definição. Overrides de meta zeram na virada — e metas devem SEMPRE ser lidas pelos getters (`aulaGoal()`), nunca `D.aulaGoal` direto (exceção deliberada: `behavioral()` linha 1548).
9. **Injeção em onclick inline + ids fixos do DOM.** Handlers são strings interpoladas (`quickLogAula('${esc(d)}')`, `reviewOk(${r.id})`): nome com apóstrofo quebra o atributo (esc() vira `&#39;` que decodifica de volta), e ids não numéricos quebram. Territórios do BCB têm nomes fixos — usar ids numéricos/slugs na interpolação. Render acoplado a dezenas de ids fixos duplicados (rcGoal/rcGoal2 etc.) — esquecer um espelho deixa números divergentes na tela.
10. **Acoplamentos escondidos por globals typeof-guarded + duplicações cross-file.** O Cloud referencia `refreshAuthUI/showGate/enterApp/renderAll/onStoreReady/Store/D/def()/SK` por guard `typeof` — o BCB precisa expor exatamente esses contratos ou o sync roda "no vácuo". `MASTER_EMAILS` duplicado em index.html (977) e firestore.rules (8); versão do SDK Firebase (`10.12.2`) duplicada em index.html (974) e PRECACHE do sw.js (12–14); URLs de CDN duplicadas nas tags e no PRECACHE — **cada bump muda 2 arquivos + bump do CACHE**. Bônus no mesmo espírito: `renderStreaks/renderHeatmap/renderCourseMap` estão DENTRO do `if(typeof Chart!=='undefined')` (1344–1352) — se o CDN do Chart falhar, somem; tirar do if no clone.

*Menções honrosas:* validação fraca do `importData` (aceitaria backup do R+ no BCB — validar `bundle.app`); `migratedV1` no localStorage vs tabelas no IDB (limpar só o LS re-executa a migração e duplica registros); erros engolidos em catch vazio por todo o Store (adicionar `console.warn` em dev); `mode idb/ls` decidido uma vez e nunca reconciliado (divergência silenciosa entre backends); `proj().finishDate` é o único `Date` objeto num app de strings.

---

## 4. Ordem recomendada de extração

Racional geral: dependências fluem fundação → Store → shell → motor → domínio → SRS → periféricos. Cloud fica por último porque os guards `typeof` em `save()` permitem o app rodar sem ele; PWA/SW fica quase no fim porque cache atrapalha a iteração de dev.

1. **Fundação temporal + estado** (788–806): `ymd/parseYMD/monday/today/mondayStr` intactos; `SK` novo; `def()` com o shape BCB (incl. `territorios` com peso); `D` + `save()` (sem o trecho Cloud por ora). Decisão de projeto já aqui: **padronizar `parseYMD` em todo cálculo novo**.
2. **Store** (809–970): IIFE dual-mode com `'bcbDB'` e `version(1)` única; clonar o template CRUD (847–865) para `sessoesEstudo`, `sessoesQuestoes`, `reviews`, `itens`, `simulados`, `discursivas`; `setSetting/putSnapshot/exportAll/importAll`; `migrate()` reescrito para semear os 11 territórios; contadores `nextId` novos.
3. **Boot em duas fases + shell** (1966–1969, 1934, 1187; CSS/HTML do layout, bnav/goTab/TABS, modais, menu de perfil, estados 'Carregando…'): app navegável vazio, sem gate (stub `showGate→enterApp` direto).
4. **Motor de pacing** (1071–1143, 1753–1787, 1884–1920): getters de log, metas com override, `pacing()` intacto, `pace/proj/risk/checkWeekReset` (com os dois fixes de week-reset), `paceBar/statusPill/renderHorizons/renderToday/renderHeader`. Aqui nasce o **`pctDone` ponderado por peso** — todo o resto consome escalares.
5. **Domínio BCB** (novo, usando o template do passo 2): registro de itens C/E com confiança 1–5 + taxonomia; chips fixos de território (adaptação de 1481–1495 com mapa estático de cores); contadores rápidos; `renderCourseMap` reescrito como mapa ponderado de territórios.
6. **SRS** (1746–1881, 1428–1480): cache `REVIEWS/loadReviews`, `dueReviews`, `reviewUrgency` com peso, escada de **dobra** em `completeReview`, ganchos estudo→revisão, `seedRetro` + modal retro, renders.
7. **Stats** (1516–1606): `streaks()` intacto, heatmap recalibrado, `behavioral()` reescrito — e fora do `if(Chart)`.
8. **Módulos novos**: simulado 3h30 (timer + bloco de itens + correção líquida C/E gravando em `itens`/`simulados`) e discursivas. Ficam depois do SRS porque reusam a tabela `itens` e alimentam pesos/urgência.
9. **Backup + reset** (1716–1744, 1957–1964): export/import com validação de `bundle.app`, `resetAll` com prefixo novo. Onboarding reescrito (setando `firstWeek`!) entra aqui, quando todos os campos que ele grava já existem.
10. **PWA** (sw.js, manifest, head 4–19, ícones): prefixo de cache `bcb-v1` nos dois pontos, PRECACHE sincronizado com as tags, Dexie pinado + SRI, ícones novos, deploy GitHub Pages em subpath.
11. **Cloud/Firebase por último** (20–30, 972–1068, 1633–1713, firestore.rules): projeto Firebase próprio, `window.BCB_FIREBASE`, Cloud IIFE com `MASTER_EMAILS` novos (JS + rules juntos), gate real substituindo o stub do passo 3, admin UI, publicação manual das rules no console. Ao ligar, reintroduzir o trecho `Cloud.schedulePush()` em `save()` e auditar TODOS os caminhos de escrita em lote para o push explícito.

**Critério de pronto por fase**: cada passo termina com o app abrindo do zero (localStorage limpo), registrando um dado do domínio novo e sobrevivendo a reload — a arquitetura de boot em duas fases garante que fases posteriores nunca bloqueiam o first-paint das anteriores.

---

*Fontes: `/home/user/r-plus-study/index.html`, `/home/user/r-plus-study/sw.js`, `/home/user/r-plus-study/manifest.webmanifest`, `/home/user/r-plus-study/firestore.rules`, `/home/user/r-plus-study/PROXIMOS_PASSOS.md`. Números de linha referem-se ao estado inventariado em 2026-07-16.*