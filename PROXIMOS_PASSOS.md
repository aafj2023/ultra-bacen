# BCB Study — Próximos passos / Handoff

App de gestão de aprovação para **Auditor do BCB — Economia e Finanças** (prova ~mar/2027).
Single-file (`index.html`), vanilla + Chart.js + Dexie + Firebase compat + KaTeX. PWA offline.
**Spec completa:** prompt v2 do dono (18 seções) — fonte de verdade pedagógica (§18).

## 🔗 Endereços
- **App no ar:** https://aafj2023.github.io/ultra-bacen/ *(hoje: app v1 provisório; será substituído pelo BCB Study)*
- **Código:** https://github.com/aafj2023/ultra-bacen
- **Docs:** `docs/ARQUITETURA-HERDADA.md` (mapa do clone R+→BCB) · `docs/DECISOES.md` (decisões + pendências)
- **Firebase:** projeto NOVO a criar pelo dono (não é o `doctor-calendar-c4c6f`)

## ▶️ Como retomar
Abrir sessão do Claude neste repositório e dizer: "continuar o BCB Study — fase N".
O Claude lê este arquivo + `docs/` e sabe onde parou.

## 📍 Estado atual (2026-07-16)
- [x] **Fase 0:** R+ lido (mapa em `docs/ARQUITETURA-HERDADA.md`) · §17 respondido · repo+Pages no ar · **Firebase `aprov-bacen` criado** (config em `docs/DECISOES.md`; ⚠️ rules de teste expiram ~15/08)
- [x] **Fase 1:** motores puros entregues — `js/motor-cebraspe.js` (§5+§11) + `js/motor-ritmo.js` (§6+§10+§9.4) · **gate verde: `node tests/motor.test.js` → 66/66**
- [x] **Fase 2:** `js/store.js` (dual idb/ls, API genérica, backup validado por app) + `js/seeds.js` (§8: 107 ativos + 8 dormentes c/ assert; §9: 35 semanas; §10: 6 checkpoints; `proximoArquivo()`) · **gate verde: `node tests/store.test.js` → 47/47** (+ regressão Fase 1 66/66)
- [x] **Fase 3:** index.html novo (single-file, blocos inline + tests extraem do index) · Cloud/gate/onboarding/dark mode · sw.js bcb-v1 · firestore.rules prontas · **gates: motor 66/66 · store 47/47 · e2e navegador 16/16 (modo idb validado)**
- [x] **Fase 4:** Territórios completos — drill-down (grid → território → sheet do micro), transição de status com geradoEm, driveUrl validado, prereqs navegáveis, push explícito à nuvem · **gates: 66/66 + 47/47 + e2e fase-4 12/12 + regressão e2e fase-3 16/16**
- [x] **Fase 5:** Itens C/E — banco de questões (tabela banco, Dexie v2), cadastro manual + importador (JSON e linhas, com relatório de rejeição), fluxo TRAVADO confiança→resposta→taxonomia, fila de reteste (última errada ou mal calibrada), líquido real no Início/Territórios/drill/micro + Brier + gerar lote por micro · **gates: 11/11 + 66/66 + 47/47 + e2e 17/17**
- [x] **Fase 6:** Simulado — completo 3h30/parcial/mini (duração proporcional), composição pelo blueprint via montarSimulado puro (faltantes reportados, sem corte silencioso), zero feedback durante, hard stop → restante vira BRANCO automático, correção final (líquido/pontos/Brier/diagnóstico/por-território) com taxonomia inline · **gates: itens 17/17 + e2e fase-6 11/11 + regressões**
- [x] **Fase 7:** Discursivas — editor com bloqueio absoluto (40 linhas F1 → 80 F2; 1 linha=70 chars, premissa), cronômetro, autosave 10s local/30s nuvem, versionamento imutável com paiId, diff LCS entre versões, modo às cegas, grade de autoavaliação (4 critérios 0-10 → nota média) · **gates: puros 27/27 + e2e fase-7 11/11 + regressões**
- [x] **Fase 8:** SRS — D+1/7/15/30 + react, urgência atraso×10+pesoStage, Difícil=+2d sem regredir, dobra ~15% em DIR/LOG/COS/EEC, teto diário ajustável, reconstrução retroativa sem estourar teto, gancho micro→EM_ESTUDO/CONCLUIDO agenda D+1, badge na nav · **gates: puros 42/42 + e2e fase-8 11/11 + regressões**
- [x] **Fase 9:** Registro de sessões (frente+minutos+desfazer) · horizontes por território com paceBar/pmark/pílulas (pacing herdado) e total da semana · Stats: streak, heatmap 84d, curva semanal do líquido (ref CP1 60%), calibração real×esperado, mapa de erros por taxonomia, tempo médio/item, cobertura ponderada + examPacing · charts re-renderizam ao abrir o pane · **gates: e2e fase-9 13/13 + regressões**
- [x] **Fase 10:** Checkpoints CP0-CP4+GAP com semáforo lendo dados vivos (avaliaCheckpoint; futuro=meta, vencido reprovado=pendente c/ lista de mínimos) e gatilho automático da Econometria a partir da semana 10 (dispara sem dado ou <60%, desarma ao atingir; premissa: discursivas contam registros) · **gates: e2e fase-10 11/11 + regressões**
- [ ] **Fase 11 (próxima):** Gap analysis — colar edital Auditor 2027, diff contra 2024, marcar NOVO/REMOVIDO/REFORMULADO/IGUAL, ativar dormentes, criar BLUEPRINT_2027 (recalibra limiar/pesos) sem redeploy
- [ ] Fases 7–12 conforme §14 da spec

### Notas para a Fase 4
- Cópia canônica de código é o index.html; tests/_extract.js compila os blocos p/ Node.
- PENDÊNCIA DO DONO (prazo 15/08): publicar firestore.rules no console do aprov-bacen
  (Firestore → Regras → colar o arquivo → Publicar). Sem isso o modo de teste expira.
- No 1º acesso real: login Google no app publicado → completar onboarding → verificar
  doc backups/{uid} criado no Firestore.

## 🛠️ Convenções técnicas decididas
- Prefixos: localStorage `bcb1*` · Dexie `bcbDB` · SW cache `bcb-v1` (nunca `rplus*` — coexistência no mesmo origin)
- Datas: SEMPRE `parseYMD`/strings locais `YYYY-MM-DD` (gotcha #1 do mapa — nunca `new Date('YYYY-MM-DD')` nem `toISOString()`)
- Toda escrita em lote no Store fora de `save()` exige `Cloud.schedulePush()` explícito (gotcha #5)
- `score`/`correto` são DERIVADOS, nunca digitados · líquido manda, bruto é secundário (§5.3)
- Blueprint versionado (§11): nenhum peso hardcoded em componente
