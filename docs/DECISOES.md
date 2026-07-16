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

## Pendências que bloqueiam fases

| Fase bloqueada | Pendência | Quem |
|---|---|---|
| Fase 0 (fecho) / 3 (gate real) | `firebaseConfig` do projeto novo + confirmação do email master | dono |
| Fase 11 | Edital Auditor 2027 (para o gap analysis) | mundo |
