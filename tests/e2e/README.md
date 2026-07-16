# Testes e2e (navegador real)

Dev-only — não fazem parte do app publicado. Requisitos:
`npm i playwright-core chart.js dexie katex` (num diretório qualquer) e um Chromium.

```
CDN_MODULES=/caminho/node_modules node tests/e2e/e2e-fase3.js   # boot, onboarding, idb, temas
CDN_MODULES=/caminho/node_modules node tests/e2e/e2e-fase4.js   # territórios, status, driveUrl
```

Os testes servem o repo por HTTP local, servem os CDNs a partir de node_modules
(rede externa bloqueada) e bloqueiam o service worker (`serviceWorkers:'block'`) —
sem isso, o SW intercepta o CDN no reload e o teste degrada para modo `ls`.
Ajuste `executablePath` do Chromium se necessário.
