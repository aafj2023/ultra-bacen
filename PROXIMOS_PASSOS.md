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
- [ ] **Fase 4 (próxima):** Territórios completos — drill-down por microconteúdo (código, prioridade, dificuldade, status, driveUrl), transição de status, prereqs/sucessores navegáveis
- [ ] Fases 4–12 conforme §14 da spec

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
