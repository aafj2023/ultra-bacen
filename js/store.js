// ═══════════════════════════════════════════════════════════════════════════
// STORE — persistência dual (§7): Dexie/IndexedDB com fallback localStorage.
// Arquitetura herdada do R+ (docs/ARQUITETURA-HERDADA.md §1.3), generalizada:
// API única por tabela em vez de CRUD duplicado por entidade.
// Prefixos: DB 'bcbDB' · localStorage 'bcb1_*' · NUNCA 'rplus*' (gotcha #2).
// Convenções: createdAt/updatedAt epoch-ms em todo registro; datas de
// calendário são strings locais 'YYYY-MM-DD' (gotcha #1 — nunca Date UTC).
// ═══════════════════════════════════════════════════════════════════════════
(function (root) {
'use strict';

var SK = 'bcb1';
var SCHEMA = {
  microconteudos: '&codigo, territorio, prioridade, status, ordem',
  sessoes:        '++id, data, territorio, createdAt',
  itens:          '++id, data, microcodigo, territorio, loteId, correto, tipoErro, createdAt',
  lotes:          '++id, modo, data, createdAt',
  discursivas:    '++id, data, versao, paiId, createdAt',
  revisoes:       '++id, dueDate, status, territorio, stage, createdAt',
  checkpoints:    '&id, semana',
  cronograma:     '&semana',
  settings:       '&key',
  streaks:        '&key',
  snapshots:      '++id, &weekKey'
};
// Chave primária por tabela ('id' auto-incrementado quando keyAuto).
var PK = {
  microconteudos: 'codigo', checkpoints: 'id', cronograma: 'semana',
  settings: 'key', streaks: 'key',
  sessoes: 'id', itens: 'id', lotes: 'id', discursivas: 'id',
  revisoes: 'id', snapshots: 'id'
};
var AUTO = { sessoes: 1, itens: 1, lotes: 1, discursivas: 1, revisoes: 1, snapshots: 1 };

var Store = (function () {
  var mode = null, db = null, ready = false;
  var LSK = SK + '_store_';           // bcb1_store_<tabela>
  var METAK = SK + '_store_meta';

  // ── fallback localStorage ────────────────────────────────────────────────
  function lsGet(t) { try { return JSON.parse(localStorage.getItem(LSK + t)) || []; } catch (e) { return []; } }
  function lsSet(t, arr) { localStorage.setItem(LSK + t, JSON.stringify(arr)); }
  function meta() { try { return JSON.parse(localStorage.getItem(METAK)) || {}; } catch (e) { return {}; } }
  function setMeta(m) { localStorage.setItem(METAK, JSON.stringify(m)); }
  function nextId(t) { var m = meta(); m['id_' + t] = (m['id_' + t] || 0) + 1; setMeta(m); return m['id_' + t]; }

  async function init() {
    if (typeof Dexie !== 'undefined' && typeof indexedDB !== 'undefined') {
      try {
        db = new Dexie('bcbDB');
        db.version(1).stores(SCHEMA);
        await db.open();
        mode = 'idb';
      } catch (e) { db = null; mode = 'ls'; }
    } else { mode = 'ls'; }
    ready = true;
    return mode;
  }

  function stamp(rec) {
    var now = Date.now();
    if (!rec.createdAt) rec.createdAt = now;
    rec.updatedAt = now;
    return rec;
  }

  // add: insere. Tabelas AUTO ganham id; tabelas com chave própria exigem-na.
  async function add(t, rec) {
    rec = stamp(Object.assign({}, rec));
    if (!AUTO[t] && (rec[PK[t]] === undefined || rec[PK[t]] === null))
      throw new Error(t + ': chave "' + PK[t] + '" obrigatória');
    if (mode === 'idb') { rec.id = AUTO[t] ? await db[t].add(rec) : (await db[t].add(rec), rec[PK[t]]); return rec; }
    if (AUTO[t] && rec.id === undefined) rec.id = nextId(t);
    var arr = lsGet(t);
    if (!AUTO[t] && arr.some(function (r) { return r[PK[t]] === rec[PK[t]]; }))
      throw new Error(t + ': chave duplicada ' + rec[PK[t]]);
    arr.push(rec); lsSet(t, arr); return rec;
  }

  // put: upsert pela chave primária (preserva createdAt do existente).
  async function put(t, rec) {
    var k = PK[t], key = rec[k];
    if (key === undefined || key === null) return add(t, rec);
    var atual = await get(t, key);
    var novo = stamp(Object.assign({}, atual || {}, rec));
    if (atual && atual.createdAt) novo.createdAt = atual.createdAt;
    if (mode === 'idb') { await db[t].put(novo); return novo; }
    var arr = lsGet(t), i = arr.findIndex(function (r) { return r[k] === key; });
    if (i >= 0) arr[i] = novo; else arr.push(novo);
    lsSet(t, arr); return novo;
  }

  async function get(t, key) {
    if (mode === 'idb') return (await db[t].get(key)) || null;
    var k = PK[t];
    return lsGet(t).find(function (r) { return r[k] === key; }) || null;
  }

  async function all(t) {
    if (mode === 'idb') return db[t].toArray();
    return lsGet(t).slice();
  }

  async function update(t, key, patch) {
    var atual = await get(t, key);
    if (!atual) return null;
    return put(t, Object.assign({}, atual, patch, (function () { var o = {}; o[PK[t]] = key; return o; })()));
  }

  async function remove(t, key) {
    if (mode === 'idb') { await db[t].delete(key); return; }
    var k = PK[t];
    lsSet(t, lsGet(t).filter(function (r) { return r[k] !== key; }));
  }

  async function clear(t) {
    if (mode === 'idb') { await db[t].clear(); return; }
    lsSet(t, []);
  }

  async function setSetting(key, value) { return put('settings', { key: key, value: value }); }
  async function getSetting(key) { var r = await get('settings', key); return r ? r.value : null; }

  // snapshot semanal: upsert por weekKey (índice único).
  async function putSnapshot(weekKey, rec) {
    var lista = await all('snapshots');
    var ex = lista.find(function (s) { return s.weekKey === weekKey; });
    if (ex) return update('snapshots', ex.id, Object.assign({}, rec, { weekKey: weekKey }));
    return add('snapshots', Object.assign({}, rec, { weekKey: weekKey }));
  }

  // ── backup (§12.9) — bundle validado por app (gotcha: backup do R+ aqui) ──
  var TABELAS = Object.keys(SCHEMA);
  async function exportAll() {
    var data = { meta: meta() };
    for (var i = 0; i < TABELAS.length; i++) data[TABELAS[i]] = await all(TABELAS[i]);
    return { app: 'bcb-study', version: 1, exportedAt: new Date().toISOString(), data: data };
  }
  async function importAll(bundle) {
    if (!bundle || bundle.app !== 'bcb-study' || !bundle.data)
      throw new Error('backup inválido: esperado app "bcb-study"');
    for (var i = 0; i < TABELAS.length; i++) {
      var t = TABELAS[i];
      await clear(t);
      var rows = bundle.data[t] || [];
      for (var j = 0; j < rows.length; j++) {
        if (mode === 'idb') await db[t].put(rows[j]);
        else { var arr = lsGet(t); arr.push(rows[j]); lsSet(t, arr); }
      }
    }
    if (mode === 'ls' && bundle.data.meta) setMeta(bundle.data.meta); // preserva contadores de id
    return true;
  }

  async function resetAll() {
    if (mode === 'idb' && db) { db.close(); await Dexie.delete('bcbDB'); }
    var apagar = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(SK) === 0) apagar.push(k);   // só bcb1* — nunca rplus*
    }
    apagar.forEach(function (k) { localStorage.removeItem(k); });
  }

  return {
    init: init, add: add, put: put, get: get, all: all, update: update,
    remove: remove, clear: clear, setSetting: setSetting, getSetting: getSetting,
    putSnapshot: putSnapshot, exportAll: exportAll, importAll: importAll,
    resetAll: resetAll,
    get mode() { return mode; }, get ready() { return ready; },
    SCHEMA: SCHEMA, PK: PK, SK: SK
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Store;
else root.Store = Store;
})(typeof self !== 'undefined' ? self : this);
