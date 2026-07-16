// Extrai blocos testáveis do index.html (cópia canônica ÚNICA — single-file §1)
// e os compila como módulos CommonJS. Uso: const M = loadBlock('motor-cebraspe');
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const INDEX = path.join(__dirname, '..', 'index.html');

function extract(name) {
  const html = fs.readFileSync(INDEX, 'utf8');
  const re = new RegExp('/\\*<' + name + '>\\*/([\\s\\S]*?)/\\*</' + name + '>\\*/');
  const m = re.exec(html);
  if (!m) throw new Error('bloco não encontrado no index.html: ' + name);
  return m[1];
}

function loadBlock(name, sandboxExtras) {
  const code = extract(name);
  const mod = { exports: {} };
  const sandbox = Object.assign({
    module: mod, exports: mod.exports, console: console,
    localStorage: global.localStorage, setTimeout: setTimeout, clearTimeout: clearTimeout,
    Date: Date, JSON: JSON, Math: Math, Object: Object, Promise: Promise, Error: Error
  }, sandboxExtras || {});
  vm.runInNewContext(code, sandbox, { filename: 'index.html#' + name });
  return mod.exports;
}

module.exports = { extract, loadBlock };
