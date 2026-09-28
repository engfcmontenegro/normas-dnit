/*
 * Anexos das fichas de ensaio (fotos e arquivos) e pacote .zip de exportação/importação.
 * - window.FE_ARQ.anexos: guarda os arquivos no IndexedDB do navegador (o localStorage não comporta fotos);
 *   sem IndexedDB (ex.: navegação privada restrita) cai para a memória da página, com aviso.
 * - window.FE_ARQ.zip: zip mínimo sem dependências — grava sem compressão (fotos já são comprimidas) e lê
 *   entradas sem compressão ou "deflate" (DecompressionStream), o suficiente para os pacotes da aba.
 */
(function () {
  "use strict";

  // ---------- zip ----------
  var CRC_T = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function paraBytes(x) {
    if (x instanceof Uint8Array) return Promise.resolve(x);
    if (typeof x === "string") return Promise.resolve(new TextEncoder().encode(x));
    return x.arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function dataDos(d) {
    return {
      hora: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
      dia: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    };
  }

  // criar([{nome, dados: Blob | Uint8Array | string}]) -> Promise<Blob application/zip>
  function criar(arquivos) {
    return Promise.all(arquivos.map(function (a) { return paraBytes(a.dados); })).then(function (datas) {
      var enc = new TextEncoder(), partes = [], central = [], ofs = 0, t = dataDos(new Date());
      arquivos.forEach(function (a, i) {
        var dado = datas[i], nome = enc.encode(a.nome), crc = crc32(dado);
        var lh = new DataView(new ArrayBuffer(30));
        lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);  // UTF-8
        lh.setUint16(8, 0, true); lh.setUint16(10, t.hora, true); lh.setUint16(12, t.dia, true);
        lh.setUint32(14, crc, true); lh.setUint32(18, dado.length, true); lh.setUint32(22, dado.length, true);
        lh.setUint16(26, nome.length, true); lh.setUint16(28, 0, true);
        partes.push(lh.buffer, nome, dado);
        var ch = new DataView(new ArrayBuffer(46));
        ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
        ch.setUint16(10, 0, true); ch.setUint16(12, t.hora, true); ch.setUint16(14, t.dia, true);
        ch.setUint32(16, crc, true); ch.setUint32(20, dado.length, true); ch.setUint32(24, dado.length, true);
        ch.setUint16(28, nome.length, true); ch.setUint32(42, ofs, true);
        central.push(ch.buffer, nome);
        ofs += 30 + nome.length + dado.length;
      });
      var tamCentral = central.reduce(function (s, p) { return s + (p.byteLength || p.length); }, 0);
      var fim = new DataView(new ArrayBuffer(22));
      fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true);
      fim.setUint32(12, tamCentral, true); fim.setUint32(16, ofs, true);
      return new Blob(partes.concat(central, [fim.buffer]), { type: "application/zip" });
    });
  }

  // ler(Blob) -> Promise<{ "caminho/no/zip": Blob }>
  function ler(blob) {
    return blob.arrayBuffer().then(function (buf) {
      var v = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder(), i;
      for (i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) break;
      if (i < 0 || v.getUint32(i, true) !== 0x06054b50) throw new Error("arquivo .zip inválido");
      var n = v.getUint16(i + 10, true), p = v.getUint32(i + 16, true), tarefas = [], saida = {};
      for (var k = 0; k < n; k++) {
        if (v.getUint32(p, true) !== 0x02014b50) throw new Error("diretório do .zip corrompido");
        var metodo = v.getUint16(p + 10, true), tamC = v.getUint32(p + 20, true);
        var nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true);
        var local = v.getUint32(p + 42, true), nome = dec.decode(u8.subarray(p + 46, p + 46 + nl));
        var ini = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
        var bruto = u8.slice(ini, ini + tamC);
        p += 46 + nl + el + cl;
        if (/\/$/.test(nome)) continue;  // pasta
        if (metodo === 0) saida[nome] = new Blob([bruto]);
        else if (metodo === 8 && window.DecompressionStream) {
          tarefas.push((function (nomeK, dados) {
            return new Response(new Blob([dados]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).blob()
              .then(function (b) { saida[nomeK] = b; });
          })(nome, bruto));
        } else throw new Error("compressão não suportada no .zip (" + nome + ")");
      }
      return Promise.all(tarefas).then(function () { return saida; });
    });
  }

  // ---------- armazenamento dos anexos (IndexedDB) ----------
  var DB = "fichas_anexos_v1", ST = "arquivos", memoria = {}, dbProm = null, soMemoria = false;
  function abrirDb() {
    if (dbProm) return dbProm;
    dbProm = new Promise(function (ok, erro) {
      try {
        var r = indexedDB.open(DB, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(ST); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { erro(r.error); };
      } catch (e) { erro(e); }
    }).catch(function () { soMemoria = true; return null; });
    return dbProm;
  }
  function tx(modo, fn) {
    return abrirDb().then(function (db) {
      if (!db) return fn(null);
      return new Promise(function (ok, erro) {
        var t = db.transaction(ST, modo), st = t.objectStore(ST), res = fn(st);
        t.oncomplete = function () { ok(res && res.result !== undefined ? res.result : res); };
        t.onerror = function () { erro(t.error); };
      });
    });
  }
  var anexos = {
    guardar: function (id, blob) {
      return tx("readwrite", function (st) { if (!st) { memoria[id] = blob; return; } st.put(blob, id); });
    },
    ler: function (id) {
      return tx("readonly", function (st) { return st ? st.get(id) : { result: memoria[id] }; })
        .then(function (b) { return b || memoria[id] || null; });
    },
    apagar: function (ids) {
      return tx("readwrite", function (st) { ids.forEach(function (id) { if (st) st.delete(id); delete memoria[id]; }); });
    },
    chaves: function () {
      return tx("readonly", function (st) { return st ? st.getAllKeys() : { result: Object.keys(memoria) }; })
        .then(function (k) { return k || []; });
    },
    soMemoria: function () { return soMemoria; },
  };

  window.FE_ARQ = { zip: { criar: criar, ler: ler, crc32: crc32 }, anexos: anexos };
})();
