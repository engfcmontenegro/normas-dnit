/*
 * Aba "Fichas de Ensaios": formulários de cálculo dos métodos de ensaio (ME) e relatório.
 *
 * Organização
 * - BLOCOS: ensaios-base reutilizáveis (ex.: teor de umidade, DNIT 456-ME). Um bloco fornece as linhas
 *   de entrada e a conta; é usado pela ficha própria do ensaio e encaixado dentro de outras fichas
 *   (cada ponto do Proctor, cada furo da massa específica in situ).
 * - FICHAS[<id da norma>]: { titulo, resumo, blocos, params: [...], tabelas(d) -> [{chave, titulo, rotulo,
 *   linhas, iniciais, min, usar}], calcular(d) -> {tab: {chave: [...]}, resultados, avisos},
 *   resultadosHtml(calc, d), grafico?(calc, d, opt), relatorio: {parametros?, notas?}, exemplo() }
 * - Um campo de parâmetro {tipo: "importar", de: <id da ficha>} traz resultados de um ensaio salvo de outra
 *   ficha (ex.: γs,máx e umidade ótima do Proctor para o grau de compactação).
 * - Motor: identificação, tabelas em colunas (navegação como no Excel), cálculo ao vivo, salvar/abrir no
 *   navegador, exportar/importar arquivo, relatório A4 para imprimir/PDF.
 * Os cálculos seguem o texto da norma (seções citadas nos rótulos).
 */
(function () {
  "use strict";

  var FICHAS = {};
  var BLOCOS = {};
  var STORE = "fichas_ensaio_v1";

  // ---------- utilidades ----------
  function num(v) {
    if (v === null || v === undefined) return NaN;
    var s = String(v).trim().replace(/\s/g, "");
    if (!s) return NaN;
    if (s.indexOf(",") !== -1) s = s.replace(/\./g, "").replace(",", ".");  // 1.234,5 -> 1234.5
    return Number(s);
  }
  function ok(x) { return typeof x === "number" && isFinite(x); }
  function fmt(x, casas) {
    if (!ok(x)) return "—";
    return x.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  // algarismos significativos (DNIT 458: massas específicas com três algarismos significativos)
  function fmtSig(x, sig) {
    if (!ok(x) || x === 0) return fmt(x, 0);
    var casas = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(x))));
    return fmt(x, casas);
  }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function media(arr) {
    var v = arr.filter(ok);
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : NaN;
  }
  function uid() { return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // parábola y = a x² + b x + c por mínimos quadrados (mesmo método das planilhas de laboratório)
  function parabola(xs, ys) {
    var n = xs.length;
    if (n < 3) return null;
    var sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0;
    for (var i = 0; i < n; i++) {
      var x = xs[i], y = ys[i], x2 = x * x;
      sx += x; sx2 += x2; sx3 += x2 * x; sx4 += x2 * x2; sy += y; sxy += x * y; sx2y += x2 * y;
    }
    var M = [[sx4, sx3, sx2], [sx3, sx2, sx], [sx2, sx, n]], V = [sx2y, sxy, sy];
    function det(m) {
      return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    }
    var D = det(M);
    if (!D) return null;
    function troca(col) { return M.map(function (r, i) { return r.map(function (v, j) { return j === col ? V[i] : v; }); }); }
    return { a: det(troca(0)) / D, b: det(troca(1)) / D, c: det(troca(2)) / D };
  }

  // ---------- armazenamento (navegador) ----------
  function lerTodos() {
    try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch (e) { return []; }
  }
  function gravarTodos(lista) {
    try { localStorage.setItem(STORE, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }

  // ---------- identificação comum a todas as fichas ----------
  var IDENT = [
    { k: "registro", r: "Registro / nº da amostra" },
    { k: "data", r: "Data do ensaio", tipo: "date" },
    { k: "obra", r: "Obra / rodovia" },
    { k: "trecho", r: "Trecho / segmento" },
    { k: "local", r: "Estaca / local de coleta" },
    { k: "origem", r: "Jazida / origem do material" },
    { k: "camada", r: "Camada / material" },
    { k: "laboratorista", r: "Laboratorista" },
    { k: "responsavel", r: "Responsável técnico" },
  ];

  // =====================================================================================
  // BLOCO — Teor de umidade (DNIT 456/2025-ME)
  // =====================================================================================
  var METODOS_UMIDADE = [["lab", "Laboratório — estufa (5.2)"], ["frigideira", "Expedito — frigideira (5.1.1)"],
    ["speedy", "Expedito — \"Speedy\" (5.1.2)"]];

  // curva de calibração do Speedy digitada como "20=2,5; 50=6,1; 100=12" (pressão kPa = umidade %)
  function curvaSpeedy(texto) {
    var pares = [];
    String(texto || "").split(/[;\n]+/).forEach(function (par) {
      var m = par.split("=");
      if (m.length === 2 && ok(num(m[0])) && ok(num(m[1]))) pares.push([num(m[0]), num(m[1])]);
    });
    return pares.sort(function (a, b) { return a[0] - b[0]; });
  }
  function interpolar(pares, x) {
    if (pares.length < 2 || !ok(x) || x < pares[0][0] || x > pares[pares.length - 1][0]) return NaN;
    for (var i = 1; i < pares.length; i++) {
      if (x <= pares[i][0]) {
        var a = pares[i - 1], b = pares[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      }
    }
    return NaN;
  }

  BLOCOS.umidade = {
    nome: "Teor de umidade",
    norma: "dnit-456-2025-me",
    // linhas de entrada de uma determinação; pref = prefixo das chaves (ex.: "c1" -> c1n, c1t, c1u, c1s)
    linhas: function (pref, rot, metodo) {
      var R = rot ? rot + " — " : "";
      if (metodo === "speedy") {
        return [
          { k: pref + "m", r: R + "massa da amostra (conforme o fabricante)", u: "g" },
          { k: pref + "p", r: R + "pressão lida no manômetro", u: "kPa" },
          { k: pref + "w", r: R + "umidade pela curva de calibração", u: "%", ph: "auto" },
          { calc: pref + "W", r: R + "teor de umidade (w)", u: "%", casas: 1 },
        ];
      }
      return [
        { k: pref + "n", r: R + "recipiente nº", texto: true },
        { k: pref + "t", r: R + "tara (mₜ)", u: "g" },
        { k: pref + "u", r: R + "tara + amostra úmida (mₜ₊ₐ)", u: "g" },
        { k: pref + "s", r: R + "tara + amostra seca (mₜ₊ₐₛ)", u: "g" },
        { calc: pref + "W", r: R + "teor de umidade (w) — eq. 1", u: "%", casas: 2 },
      ];
    },
    // devolve {w, mUmida, aviso}
    calcular: function (p, pref, metodo, curva) {
      if (metodo === "speedy") {
        var pr = num(p[pref + "p"]), wLida = num(p[pref + "w"]);
        var w = ok(wLida) ? wLida : interpolar(curva || [], pr);
        var aviso = "";
        if (ok(pr) && pr < 20) aviso = "pressão abaixo de 20 kPa: repetir com a massa de amostra imediatamente superior (NOTA 1)";
        else if (ok(pr) && pr > 150) aviso = "pressão acima de 150 kPa: repetir com a massa de amostra imediatamente inferior (NOTA 1)";
        else if (ok(pr) && !ok(w)) aviso = "informe a umidade lida na curva do aparelho ou cadastre a curva de calibração";
        return { w: w, mUmida: num(p[pref + "m"]), aviso: aviso };
      }
      var t = num(p[pref + "t"]), u = num(p[pref + "u"]), s = num(p[pref + "s"]);
      if (!ok(t) || !ok(u) || !ok(s) || s - t <= 0 || u < s) return { w: NaN, mUmida: ok(u) && ok(t) ? u - t : NaN };
      // w = (mₜ₊ₐ − mₜ₊ₐₛ) / (mₜ₊ₐₛ − mₜ) × 100   (DNIT 456, eq. 1)
      return { w: (u - s) / (s - t) * 100, mUmida: u - t, mSeca: s - t };
    },
  };

  // massas mínimas (DNIT 456, Tabelas 1 e 2)
  var MIN_SOLO = [["0,42", 10], ["4,8", 100], ["12,5", 300], ["25,0", 500], ["50,0", 1000]];
  var MIN_AGREG = [["9,5", 1500], ["12,5", 2000], ["19,0", 3000], ["25,0", 4000], ["38,0", 6000], ["50,0", 8000], ["76,0", 13000]];

  // =====================================================================================
  // DNIT 456/2025-ME — Teor de umidade de solos e agregados (ficha própria do bloco)
  // =====================================================================================
  FICHAS["dnit-456-2025-me"] = {
    titulo: "Teor de umidade de solos e agregados",
    resumo: "Métodos de laboratório (estufa) e expeditos (frigideira e \"Speedy\"); resultado com aproximação de 0,1 %.",
    blocos: ["umidade"],
    params: [
      { k: "material", r: "Material", tipo: "select", recarrega: true, opcoes: [["solo", "Solo"], ["agregado", "Agregado"]] },
      { k: "metodo", r: "Método", tipo: "select", recarrega: true, opcoes: METODOS_UMIDADE },
      { k: "tamanho", r: "Tamanho máximo das partículas (mm)", tipo: "select", recarrega: true,
        opcoes: function (d) {
          var t = (d.params || {}).material === "agregado" ? MIN_AGREG : MIN_SOLO;
          return [["", "—"]].concat(t.map(function (x) { return [x[0], x[0] + " mm — mínimo " + x[1].toLocaleString("pt-BR") + " g"]; }));
        },
        dica: "define a massa mínima de amostra (Tabelas 1 e 2)", se: function (d) { return (d.params || {}).metodo !== "speedy"; } },
      { k: "temperatura", r: "Temperatura de secagem", tipo: "select",
        opcoes: [["105", "105 °C a 110 °C"], ["60", "60 °C a 65 °C (turfas e solos orgânicos)"]],
        se: function (d) { return (d.params || {}).metodo === "lab" && (d.params || {}).material !== "agregado"; } },
      { k: "curva", r: "Curva de calibração do Speedy (pressão kPa = umidade %)", ph: "20=2,5; 50=6,1; 100=12,0; 150=17,8",
        dica: "pares separados por ponto e vírgula; a umidade é interpolada (5.1.2 j)", se: function (d) { return (d.params || {}).metodo === "speedy"; } },
    ],
    padrao: { material: "solo", metodo: "lab", temperatura: "105" },
    tabelas: function (d) {
      var P = d.params || {};
      var linhas = BLOCOS.umidade.linhas("d", "", P.metodo || "lab");
      if (P.metodo === "lab" && P.material === "agregado") {
        linhas.splice(4, 0, { k: "d2", r: "tara + amostra seca — 2ª pesagem (constância de massa, 5.2.2 f)", u: "g" },
          { calc: "var", r: "variação entre pesagens sucessivas", u: "%", casas: 2 });
      }
      if (P.metodo !== "speedy") linhas.splice(4, 0, { calc: "mA", r: "massa da amostra úmida", u: "g", casas: 1 });
      return [{ chave: "det", titulo: "Determinações", rotulo: "Det.", linhas: linhas, iniciais: 2, min: 1,
        dica: "uma coluna por determinação (recipiente); o resultado é a média" }];
    },
    calcular: function (d) {
      var P = d.params || {}, metodo = P.metodo || "lab", avisos = [];
      var curva = curvaSpeedy(P.curva);
      var tabMin = P.material === "agregado" ? MIN_AGREG : MIN_SOLO;
      var minimo = (tabMin.filter(function (x) { return x[0] === P.tamanho; })[0] || [])[1];
      var det = (d.det || []).map(function (p, i) {
        var r = BLOCOS.umidade.calcular(p, "d", metodo, curva);
        var o = { dW: r.w, mA: r.mUmida };
        if (r.aviso) avisos.push("Determinação " + (i + 1) + ": " + r.aviso + ".");
        if (minimo && ok(r.mUmida) && r.mUmida < minimo) {
          avisos.push("Determinação " + (i + 1) + ": amostra de " + fmt(r.mUmida, 1) + " g, abaixo do mínimo de " +
            minimo.toLocaleString("pt-BR") + " g (" + (P.material === "agregado" ? "Tabela 2" : "Tabela 1") + ").");
        }
        if (metodo === "lab" && P.material === "agregado") {
          var s1 = num(p.ds), s2 = num(p.d2), t = num(p.dt);
          if (ok(s1) && ok(s2) && ok(t) && s2 - t > 0) {
            o["var"] = Math.abs(s1 - s2) / (s2 - t) * 100;
            if (o["var"] > 0.1) avisos.push("Determinação " + (i + 1) + ": variação de " + fmt(o["var"], 2) +
              " % entre pesagens sucessivas — ainda não há constância de massa (≤ 0,1 %, 5.2.2 f).");
          }
        }
        return o;
      });
      if (metodo === "speedy" && P.material === "agregado") avisos.push("O método do Speedy é recomendado para materiais arenosos (5.1.2 a).");
      return { tab: { det: det }, resultados: { w: media(det.map(function (x) { return x.dW; })) }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var m = (METODOS_UMIDADE.filter(function (x) { return x[0] === ((d.params || {}).metodo || "lab"); })[0] || [])[1];
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(calc.resultados.w, 1) +
        ' <small>%</small></div><div class="fe-res-r">Teor de umidade (média, aproximação de 0,1 %)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(m || "") + '</div><div class="fe-res-r">Método</div></div></div>';
    },
    relatorio: {
      notas: "w = (mₜ₊ₐ − mₜ₊ₐₛ) / (mₜ₊ₐₛ − mₜ) × 100 (eq. 1); no Speedy, umidade pela curva de calibração do aparelho.",
      resultados: function (calc, d) {
        var m = (METODOS_UMIDADE.filter(function (x) { return x[0] === ((d.params || {}).metodo || "lab"); })[0] || [])[1];
        return [["Teor de umidade (média das determinações)", fmt(calc.resultados.w, 1) + " %"], ["Método", m || ""]];
      },
    },
    exemplo: function () {
      return {
        ident: { registro: "EX-U-001", camada: "Base — solo-cimento", origem: "Jazida 1" },
        params: { material: "solo", metodo: "lab", tamanho: "4,8", temperatura: "105" },
        det: [{ dn: "37", dt: "15,22", du: "132,48", ds: "117,86" }, { dn: "41", dt: "14,87", du: "128,90", ds: "114,65" }],
      };
    },
  };

  // =====================================================================================
  // BLOCO — Compactação (moldagem dos corpos de prova e curva de compactação)
  // usado pela DNIT 164/2013-ME e pela DNIT 172/2016-ME (o ISC traça a curva com os próprios CPs, 6.1 e 8.1)
  // =====================================================================================
  var ENERGIAS = { A: { nome: "Normal (Método A)", golpes: 12 }, B: { nome: "Intermediária (Método B)", golpes: 26 },
    C: { nome: "Modificada (Método C)", golpes: 55 } };
  // volume útil do molde: Ø 15,24 cm, altura 17,78 cm menos o disco espaçador de 6,35 cm
  var VOL_PADRAO = Math.round(Math.PI * Math.pow(15.24 / 2, 2) * (17.78 - 6.35));
  var ALT_PADRAO = Math.round((17.78 - 6.35) * 100) / 10;  // altura do CP em mm (114,3)
  // chaves de dados que pertencem à moldagem (copiadas ao importar uma compactação salva)
  var CHAVES_MOLDAGEM = ["usar", "c1n", "c1t", "c1u", "c1s", "c2n", "c2t", "c2u", "c2s", "moldeN", "moldeM", "moldeV", "moldeSolo"];

  BLOCOS.compactacao = {
    nome: "Compactação",
    norma: "dnit-164-2013-me",
    linhas: function (secUmid, secCP) {
      var U = BLOCOS.umidade;
      return [{ grupo: "Umidade do corpo de prova — bloco Teor de umidade, DNIT 456-ME (" + secUmid + ")" }]
        .concat(U.linhas("c1", "Cápsula 1", "lab"))
        .concat(U.linhas("c2", "Cápsula 2 (siltosos/argilosos)", "lab"))
        .concat([{ calc: "h", r: "Teor de umidade médio (h)", u: "%", casas: 2, destaque: true },
          { grupo: "Corpo de prova compactado (" + secCP + ")" },
          { k: "moldeN", r: "Molde nº", texto: true },
          { k: "moldeM", r: "Massa do molde", u: "g" },
          { k: "moldeV", r: "Volume do molde (V)", u: "cm³", padrao: "volumePadrao", padraoFixo: String(VOL_PADRAO) },
          { k: "moldeSolo", r: "Molde + solo úmido compactado", u: "g" },
          { calc: "Ph", r: "Massa do solo úmido (P'h)", u: "g", casas: 0 },
          { calc: "gh", r: "Massa específica aparente úmida (γh = P'h / V)", u: "g/cm³", casas: 3 },
          { calc: "gs", r: "Massa específica aparente seca (γs = γh × 100 / (100 + h))", u: "g/cm³", casas: 3, destaque: true }]);
    },
    // pontos da moldagem + curva (parábola por mínimos quadrados) -> {pontos, res, avisos}
    calcular: function (d, minPontos, rotuloPonto) {
      var P = d.params || {};
      var volPad = num(P.volumePadrao);
      if (!ok(volPad)) volPad = VOL_PADRAO;
      var avisos = [], rot = rotuloPonto || "Ponto";
      var pontos = (d.pontos || []).map(function (p, i) {
        var h1 = BLOCOS.umidade.calcular(p, "c1", "lab").w, h2 = BLOCOS.umidade.calcular(p, "c2", "lab").w;
        var h = media([h1, h2]);
        var V = ok(num(p.moldeV)) ? num(p.moldeV) : volPad;
        var Ph = num(p.moldeSolo) - num(p.moldeM);
        var gh = ok(Ph) && Ph > 0 ? Ph / V : NaN;               // γh = P'h / V
        var gs = ok(gh) && ok(h) ? gh * 100 / (100 + h) : NaN;  // γs = γh × 100/(100+h)
        if (ok(h1) && ok(h2) && Math.abs(h1 - h2) > 1) {
          avisos.push(rot + " " + (i + 1) + ": as duas cápsulas diferem " + fmt(Math.abs(h1 - h2), 2) +
            " ponto(s) percentual(is) de umidade — confira as pesagens.");
        }
        return { c1W: h1, c2W: h2, h: h, Ph: Ph, gh: gh, gs: gs, usar: p.usar !== false };
      });
      var validos = pontos.filter(function (p) { return ok(p.h) && ok(p.gs); });
      var usados = validos.filter(function (p) { return p.usar; });
      if (minPontos && validos.length < minPontos) {
        avisos.push("A norma pede no mínimo " + minPontos + " corpos de prova; há " + validos.length + " completo(s).");
      }
      var res = { gsMax: NaN, hOt: NaN, ajuste: null };
      if (usados.length >= 3) {
        var fit = parabola(usados.map(function (p) { return p.h; }), usados.map(function (p) { return p.gs; }));
        if (fit && fit.a < 0) {
          res.ajuste = fit;
          res.hOt = -fit.b / (2 * fit.a);
          res.gsMax = fit.a * res.hOt * res.hOt + fit.b * res.hOt + fit.c;
          var hs = usados.map(function (p) { return p.h; });
          var minH = Math.min.apply(null, hs), maxH = Math.max.apply(null, hs);
          if (res.hOt < minH || res.hOt > maxH) {
            avisos.push("O máximo da curva ficou fora do intervalo de umidades ensaiadas: faça mais pontos no ramo " +
              (res.hOt < minH ? "seco" : "úmido") + ".");
          }
          var secos = hs.filter(function (h) { return h < res.hOt; }).length, umidos = hs.length - secos;
          if (secos < 2 || umidos < 2) {
            avisos.push("Recomenda-se ao menos dois pontos em cada ramo da curva (há " + secos + " no ramo seco e " + umidos + " no úmido).");
          }
        } else {
          avisos.push("Os pontos marcados não formam uma curva com máximo (concavidade para baixo): revise os pontos ou desmarque os discrepantes.");
        }
      } else if (validos.length) {
        avisos.push("Marque ao menos três pontos para traçar a curva de compactação.");
      }
      return { pontos: pontos, res: res, avisos: avisos };
    },
  };

  // gráfico da curva de compactação; opt.isc = {pontos: [{h, v, usar}], ajuste, final, rotulo} desenha a curva
  // ISC × umidade no eixo da direita (DNIT 172, 8.2: "de preferência, na mesma folha")
  function graficoCompactacao(calc, d, opt) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 320, m = { l: 58, r: opt.isc ? 52 : 16, t: 14, b: 42 };
    var pts = calc.pontos.filter(function (p) { return ok(p.h) && ok(p.gs); });
    if (!pts.length) return '<div class="fe-graf-vazio">O gráfico aparece quando houver pontos completos.</div>';
    var r = calc.resultados;
    var xs = pts.map(function (p) { return p.h; }), ys = pts.map(function (p) { return p.gs; });
    var x0 = Math.floor(Math.min.apply(null, xs) - 1), x1 = Math.ceil(Math.max.apply(null, xs) + 1);
    var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys.concat(ok(r.gsMax) ? [r.gsMax] : []));
    var pad = Math.max((yMax - yMin) * 0.25, 0.02);
    var y0 = Math.floor((yMin - pad) * 100) / 100, y1 = Math.ceil((yMax + pad) * 100) / 100;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", curva: "#1f5fbf", sat: "#888", pt: "#1f5fbf", isc: "#c0392b" }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", curva: "#4f8cff", sat: "#9aa3b2", pt: "#4f8cff", isc: "#e0a13a" };
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    var passoX = (x1 - x0) > 12 ? 2 : 1;
    for (var gx = x0; gx <= x1; gx += passoX) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
    }
    var passoY = (y1 - y0) > 0.3 ? 0.05 : (y1 - y0) > 0.12 ? 0.02 : 0.01;
    for (var gy = Math.ceil(y0 / passoY) * passoY; gy <= y1 + 1e-9; gy += passoY) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + fmt(gy, 3) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
    s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Teor de umidade h (%)</text>';
    s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.curva + '">γs (g/cm³)</text>';
    var Gs = num((d.params || {}).gs);
    if (ok(Gs) && Gs > 1.5 && Gs < 4) {
      var ds = "";
      for (var hx = x0; hx <= x1 + 1e-9; hx += (x1 - x0) / 60) {
        var ysat = Gs / (1 + hx * Gs / 100);
        if (ysat >= y0 && ysat <= y1) ds += (ds ? " L" : "M") + X(hx).toFixed(1) + " " + Y(ysat).toFixed(1);
      }
      if (ds) s += '<path d="' + ds + '" fill="none" stroke="' + cor.sat + '" stroke-dasharray="5 4"/>' +
        '<text x="' + (W - m.r - 4) + '" y="' + (m.t + 12) + '" text-anchor="end" fill="' + cor.sat + '">S = 100 %</text>';
    }
    var us = calc.pontos.filter(function (p) { return p.usar && ok(p.h) && ok(p.gs); });
    var ha = us.length ? Math.min.apply(null, us.map(function (p) { return p.h; })) - 0.5 : x0;
    var hb = us.length ? Math.max.apply(null, us.map(function (p) { return p.h; })) + 0.5 : x1;
    if (r.ajuste) {
      var a = r.ajuste, dc = "";
      for (var hc = ha; hc <= hb + 1e-9; hc += (hb - ha) / 60) {
        var yc = a.a * hc * hc + a.b * hc + a.c;
        dc += (dc ? " L" : "M") + X(hc).toFixed(1) + " " + Y(Math.max(yc, y0)).toFixed(1);
      }
      s += '<path d="' + dc + '" fill="none" stroke="' + cor.curva + '" stroke-width="2"/>';
      if (ok(r.gsMax)) {
        s += '<line x1="' + X(r.hOt) + '" y1="' + m.t + '" x2="' + X(r.hOt) + '" y2="' + (H - m.b) + '" stroke="' + cor.curva + '" stroke-dasharray="3 3"/>';
        s += '<line x1="' + m.l + '" y1="' + Y(r.gsMax) + '" x2="' + X(r.hOt) + '" y2="' + Y(r.gsMax) + '" stroke="' + cor.curva + '" stroke-dasharray="3 3"/>';
        s += '<text x="' + (X(r.hOt) + 6) + '" y="' + (Y(r.gsMax) - 6) + '" fill="' + cor.curva + '" font-weight="bold">' +
          fmt(r.gsMax, 3) + " g/cm³ · " + fmt(r.hOt, 1) + " %</text>";
      }
    }
    calc.pontos.forEach(function (p, i) {
      if (!ok(p.h) || !ok(p.gs)) return;
      s += '<circle cx="' + X(p.h) + '" cy="' + Y(p.gs) + '" r="4.5" fill="' + (p.usar ? cor.pt : "none") + '" stroke="' + cor.pt + '" stroke-width="1.5"/>';
      s += '<text x="' + (X(p.h) + 7) + '" y="' + (Y(p.gs) + 13) + '" fill="' + cor.txt + '" font-size="10">' + (i + 1) + "</text>";
    });
    // ISC × umidade (eixo da direita)
    if (opt.isc) {
      var ip = opt.isc.pontos.filter(function (p) { return ok(p.h) && ok(p.v); });
      if (ip.length) {
        var vMax = Math.max.apply(null, ip.map(function (p) { return p.v; }).concat(ok(opt.isc.final) ? [opt.isc.final] : []));
        var passoV = vMax > 100 ? 25 : vMax > 40 ? 10 : 5, v1 = Math.ceil(vMax * 1.15 / passoV) * passoV;
        var YV = function (v) { return H - m.b - v / v1 * (H - m.t - m.b); };
        for (var gv = 0; gv <= v1 + 1e-9; gv += passoV) {
          s += '<text x="' + (W - m.r + 6) + '" y="' + (YV(gv) + 4) + '" fill="' + cor.isc + '">' + gv + "</text>";
        }
        s += '<text transform="translate(' + (W - 10) + " " + ((H - m.b + m.t) / 2) + ') rotate(90)" text-anchor="middle" fill="' + cor.isc + '">' + esc(opt.isc.rotulo || "ISC (%)") + "</text>";
        if (opt.isc.ajuste) {
          var q = opt.isc.ajuste, di = "";
          for (var hi = ha; hi <= hb + 1e-9; hi += (hb - ha) / 60) {
            var vi = q.a * hi * hi + q.b * hi + q.c;
            if (vi >= 0 && vi <= v1) di += (di ? " L" : "M") + X(hi).toFixed(1) + " " + YV(vi).toFixed(1);
          }
          if (di) s += '<path d="' + di + '" fill="none" stroke="' + cor.isc + '" stroke-width="1.8" stroke-dasharray="7 3"/>';
        }
        ip.forEach(function (p) {
          s += '<rect x="' + (X(p.h) - 4) + '" y="' + (YV(p.v) - 4) + '" width="8" height="8" fill="' + (p.usar ? cor.isc : "none") + '" stroke="' + cor.isc + '" stroke-width="1.5"/>';
        });
        if (ok(opt.isc.final) && ok(r.hOt)) {
          s += '<line x1="' + X(r.hOt) + '" y1="' + YV(opt.isc.final) + '" x2="' + (W - m.r) + '" y2="' + YV(opt.isc.final) + '" stroke="' + cor.isc + '" stroke-dasharray="3 3"/>';
          s += '<text x="' + (X(r.hOt) + 6) + '" y="' + (YV(opt.isc.final) + 14) + '" fill="' + cor.isc + '" font-weight="bold">ISC ' + fmt(opt.isc.final, 0) + " %</text>";
        }
      }
    }
    return s + "</svg>";
  }

  // =====================================================================================
  // DNIT 164/2013-ME — Solos — Compactação utilizando amostras não trabalhadas
  // =====================================================================================
  FICHAS["dnit-164-2013-me"] = {
    titulo: "Solos — Compactação utilizando amostras não trabalhadas",
    resumo: "Curva de compactação (massa específica aparente seca × umidade), massa específica aparente seca máxima e umidade ótima.",
    blocos: ["umidade", "compactacao"],
    params: [
      { k: "energia", r: "Energia de compactação (seção 6)", tipo: "select",
        opcoes: [["A", "Normal — 12 golpes/camada"], ["B", "Intermediária — 26 golpes/camada"], ["C", "Modificada — 55 golpes/camada"]] },
      { k: "volumePadrao", r: "Volume do molde padrão (cm³)", recarrega: "tabela", dica: "Ø 15,24 cm × (17,78 − 6,35) cm ≈ " + VOL_PADRAO +
        " cm³; use a capacidade aferida do seu molde", ph: String(VOL_PADRAO) },
      { k: "ret19", r: "Material retido na peneira de 19 mm (%)", dica: "substituído por igual massa passando na 19 mm e retido na 4,8 mm (4.2)" },
      { k: "gs", r: "Massa específica dos grãos (g/cm³) — opcional", dica: "só para traçar a curva de saturação (S = 100 %) no gráfico" },
    ],
    padrao: { energia: "B" },
    tabelas: function () {
      return [{
        chave: "pontos", titulo: "Pontos da curva", rotulo: "Ponto", iniciais: 5, min: 5, usar: true,
        dica: "uma coluna por corpo de prova; mínimo de 5 (5.4). Desmarque \"usar\" para tirar um ponto discrepante do ajuste.",
        linhas: BLOCOS.compactacao.linhas("5.1 e 7.1", "5.3 e 7.2"),
      }];
    },
    calcular: function (d) {
      var c = BLOCOS.compactacao.calcular(d, 5, "Ponto");
      return { tab: { pontos: c.pontos }, pontos: c.pontos, resultados: c.res, avisos: c.avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, en = ENERGIAS[(d.params || {}).energia || "B"];
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gsMax, 3) +
        ' <small>g/cm³</small></div><div class="fe-res-r">Massa específica aparente seca máxima (8.2)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.hOt, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">Umidade ótima (8.3)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(en ? en.nome : "—") + '</div>' +
        '<div class="fe-res-r">Energia · ' + (en ? en.golpes : "—") + " golpes/camada, 5 camadas</div></div></div>";
    },
    relatorio: {
      parametros: [["Compactação", "5 camadas, soquete de 4,536 kg, queda de 45,72 cm, molde Ø 15,24 cm com disco espaçador"]],
      notas: "Curva de compactação: parábola ajustada por mínimos quadrados aos pontos considerados; γs,máx e umidade ótima no vértice (8.2 e 8.3). Umidade de cada ponto pela eq. 1 da DNIT 456-ME (= 7.1).",
      resultados: function (calc) {
        return [["Massa específica aparente seca máxima", fmt(calc.resultados.gsMax, 3) + " g/cm³"],
          ["Umidade ótima", fmt(calc.resultados.hOt, 1) + " %"]];
      },
    },
    grafico: function (calc, d, opt) { return graficoCompactacao(calc, d, opt); },
    // exemplo: pontos da planilha PROCTOR INTERMEDIÁRIO do laboratório, com a umidade de cada ponto por cápsula
    exemplo: function () {
      return {
        ident: { registro: "EX-001", obra: "Exemplo", camada: "Base — solo-cimento 3 %", origem: "Jazida 1" },
        params: { energia: "B", volumePadrao: "", ret19: "0", gs: "2,65" },
        pontos: pontosExemplo(),
      };
    },
  };
  function pontosExemplo() {
    var hs = [8.77, 10.80, 12.83, 14.86, 16.88];
    var moldes = [["10", 5007, 2320, 9000], ["45", 4129, 2298, 8750], ["2", 5202, 2305, 10150], ["16", 4990, 2310, 10000], ["31", 4720, 2305, 9500]];
    return hs.map(function (h, i) {
      var t = 15 + i, seco = t + 100, umido = seco + h;  // 100 g de solo seco por cápsula
      return { usar: true, c1n: String(20 + i), c1t: fmt(t, 2), c1u: fmt(umido, 2), c1s: fmt(seco, 2),
        moldeN: moldes[i][0], moldeM: String(moldes[i][1]), moldeV: String(moldes[i][2]), moldeSolo: String(moldes[i][3]) };
    });
  }

  // =====================================================================================
  // DNIT 172/2016-ME — Solos — Índice de Suporte Califórnia (amostras não trabalhadas)
  // =====================================================================================
  var PENETRACOES = [[0.5, 0.63, 0.025], [1, 1.27, 0.05], [1.5, 1.90, 0.075], [2, 2.54, 0.1], [3, 3.81, 0.15], [4, 5.08, 0.2],
    [6, 7.62, 0.3], [8, 10.16, 0.4], [10, 12.70, 0.5]];  // Tabela 1: tempo (min), mm, pol
  var PRESSAO_PADRAO = { "2.54": 70.31, "5.08": 105.46 };   // Tabela 3 (kgf/cm²)
  var LEITURAS_EXP = [0, 24, 48, 72, 96];                   // horas (6.2)

  // aferição do anel: pressão (kgf/cm²) = K × leitura, ou tabela "leitura = pressão" interpolada
  function pressaoAnel(P, leitura) {
    if (!ok(leitura)) return NaN;
    var tab = curvaSpeedy(P.aferTabela);  // mesmo formato "x = y; ..." do Speedy
    if (tab.length >= 2) return interpolar([[0, 0]].concat(tab), leitura);
    var K = num(P.aferK);
    return ok(K) ? K * leitura : NaN;
  }
  // curva pressão × penetração (com a origem) e correção "c" pelo ponto de inflexão (7.3)
  function interpCurva(xs, ys, x) {
    for (var i = 1; i < xs.length; i++) {
      if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    }
    return NaN;
  }
  function correcaoSugerida(xs, ys) {
    // inflexão: a inclinação cresce no início (curva côncava para cima). Tangente no trecho de maior
    // inclinação anterior à queda; c = onde essa tangente corta o eixo das penetrações.
    var inc = [];
    for (var i = 1; i < xs.length; i++) inc.push((ys[i] - ys[i - 1]) / (xs[i] - xs[i - 1]));
    if (inc.length < 3 || !(inc[1] > inc[0] * 1.2)) return 0;  // concavidade inicial nítida (≥ 20 % a mais de inclinação)
    var k = 0;
    for (var j = 1; j < inc.length && xs[j + 1] <= 5.08; j++) { if (inc[j] > inc[k]) k = j; else break; }
    var sl = inc[k];
    if (!(sl > 0)) return 0;
    var c = xs[k] - ys[k] / sl;
    return c >= 0.1 ? c : 0;
  }

  FICHAS["dnit-172-2016-me"] = {
    titulo: "Solos — Índice de Suporte Califórnia (amostras não trabalhadas)",
    resumo: "Moldagem e curva de compactação dos próprios corpos de prova, expansão em 96 h, penetração, ISC de cada CP e ISC na umidade ótima (8.2).",
    blocos: ["umidade", "compactacao"],
    params: [
      { k: "energia", r: "Energia de compactação (6.1.1)", tipo: "select",
        opcoes: [["A", "12 golpes/camada — subleito"], ["B", "26 golpes/camada — sub-base"], ["C", "55 golpes/camada — base"]] },
      { k: "importar", r: "Corpos de prova: importar de uma compactação salva (DNIT 164)", tipo: "importar", de: "dnit-164-2013-me",
        dica: "copia a moldagem (umidade, molde e massas) dos pontos; expansão e penetração continuam aqui",
        aplicar: function (e, P, d) {
          var src = (e.dados || {}).pontos || [];
          d.pontos = src.map(function (p, i) {
            var alvo = Object.assign({}, (d.pontos || [])[i] || {});
            CHAVES_MOLDAGEM.forEach(function (k) { if (p[k] !== undefined) alvo[k] = p[k]; });
            return alvo;
          });
          ["energia", "volumePadrao", "ret19"].forEach(function (k) { if ((e.dados.params || {})[k] !== undefined) P[k] = e.dados.params[k]; });
          P.compRegistro = ((e.dados.ident || {}).registro || "") + ((e.dados.ident || {}).origem ? " · " + e.dados.ident.origem : "");
        } },
      { k: "compRegistro", r: "Compactação de origem dos corpos de prova" },
      { k: "volumePadrao", r: "Volume do molde padrão (cm³)", recarrega: "tabela", ph: String(VOL_PADRAO),
        dica: "Ø 15,24 cm × (17,78 − 6,35) cm ≈ " + VOL_PADRAO + " cm³; use a capacidade aferida" },
      { k: "altura", r: "Altura inicial do corpo de prova (mm)", recarrega: "tabela", ph: String(ALT_PADRAO).replace(".", ","),
        dica: "para a expansão (7.2); padrão 17,78 − 6,35 cm; informe por molde na tabela se variar" },
      { k: "sobrecarga", r: "Sobrecarga (kg)", ph: "4,54", dica: "massa superior a 4,536 kg (6.2)" },
      { k: "aferK", r: "Aferição do anel — constante K (kgf/cm² por unidade de leitura)",
        dica: "pressão calculada = K × leitura do extensômetro do anel (ex.: 0,077)" },
      { k: "aferTabela", r: "…ou tabela de aferição (leitura = pressão kgf/cm²)", ph: "100=7,7; 500=38,5; 1000=77,0",
        dica: "se preenchida, substitui a constante; interpolação linear" },
      { k: "correcao", r: "Correção da curva pressão × penetração (7.3)", tipo: "select",
        opcoes: [["manual", "Só quando informada por CP (c manual)"], ["auto", "Aplicar a correção sugerida (inflexão)"]] },
      { k: "iscMin", r: "ISC mínimo exigido (%) — opcional", dica: "da especificação de serviço" },
      { k: "expMax", r: "Expansão máxima admitida (%) — opcional", dica: "da especificação de serviço" },
      { k: "gs", r: "Massa específica dos grãos (g/cm³) — opcional", dica: "curva de saturação no gráfico" },
    ],
    padrao: { energia: "B", correcao: "manual" },
    tabelas: function (d) {
      var P = d.params || {};
      var linhas = BLOCOS.compactacao.linhas("6.1.3 e 7.1", "6.1.2 e 7.1");
      linhas = linhas.concat([{ grupo: "Expansão — leituras do extensômetro a cada 24 h, CP imerso (6.2 e 7.2)" },
        { k: "alt", r: "Altura inicial do CP", u: "mm", padrao: "altura", padraoFixo: String(ALT_PADRAO).replace(".", ",") }])
        .concat(LEITURAS_EXP.map(function (hh) { return { k: "e" + hh, r: "Leitura com " + hh + " h", u: "mm" }; }))
        .concat([{ calc: "exp", r: "Expansão = (final − inicial) / altura × 100", u: "%", casas: 2, destaque: true },
          { grupo: "Penetração — leituras no extensômetro do anel, 1,27 mm/min (6.3, Tabela 1)" }])
        .concat(PENETRACOES.map(function (x) { return { k: "p" + String(x[1]).replace(".", "_"), r: fmt(x[1], 2) + " mm (" + fmt(x[2], 3) + " pol) — " + fmt(x[0], 1) + " min", u: "leitura" }; }))
        .concat([
          { k: "cMan", r: "Correção c (manual)", u: "mm", ph: "—" },
          { calc: "cSug", r: "Correção c sugerida (ponto de inflexão)", u: "mm", casas: 2 },
          { calc: "p254", r: "Pressão em 2,54 mm (calculada ou corrigida)", u: "kgf/cm²", casas: 2 },
          { calc: "p508", r: "Pressão em 5,08 mm (calculada ou corrigida)", u: "kgf/cm²", casas: 2 },
          { calc: "i254", r: "ISC em 0,1 pol = P / 70,31 × 100", u: "%", casas: 1 },
          { calc: "i508", r: "ISC em 0,2 pol = P / 105,46 × 100", u: "%", casas: 1 },
          { calc: "isc", r: "ISC do corpo de prova (o maior)", u: "%", casas: 1, destaque: true },
        ]);
      return [{ chave: "pontos", titulo: "Corpos de prova", rotulo: "CP", iniciais: 5, min: 5, usar: true,
        dica: "uma coluna por CP (geralmente cinco, 5.3); os mesmos CPs dão a curva de compactação, a expansão e o ISC",
        linhas: linhas }];
    },
    calcular: function (d) {
      var P = d.params || {};
      var c = BLOCOS.compactacao.calcular(d, 5, "CP");
      var avisos = c.avisos.slice();
      var altPad = ok(num(P.altura)) ? num(P.altura) : ALT_PADRAO;
      var semAfer = !ok(num(P.aferK)) && curvaSpeedy(P.aferTabela).length < 2;
      (d.pontos || []).forEach(function (p, i) {
        var o = c.pontos[i], rot = "CP " + (i + 1);
        // expansão (7.2): leitura final − inicial, em % da altura inicial
        var leit = LEITURAS_EXP.map(function (hh) { return num(p["e" + hh]); }).filter(ok);
        var alt = ok(num(p.alt)) ? num(p.alt) : altPad;
        o.exp = leit.length >= 2 ? (leit[leit.length - 1] - leit[0]) / alt * 100 : NaN;
        if (leit.length >= 2 && leit.length < LEITURAS_EXP.length) avisos.push(rot + ": expansão com " + (leit.length - 1) * 24 + " h de imersão; a norma pede 96 h (6.2).");
        // penetração (6.3 e 7.3)
        var xs = [0], ys = [0];
        PENETRACOES.forEach(function (x) {
          var pr = pressaoAnel(P, num(p["p" + String(x[1]).replace(".", "_")]));
          if (ok(pr)) { xs.push(x[1]); ys.push(pr); }
        });
        o.cSug = xs.length >= 4 ? correcaoSugerida(xs, ys) : NaN;
        var cMan = num(p.cMan);
        var cc = ok(cMan) ? cMan : (P.correcao === "auto" && ok(o.cSug) ? o.cSug : 0);
        o.p254 = interpCurva(xs, ys, 2.54 + cc);
        o.p508 = interpCurva(xs, ys, 5.08 + cc);
        o.i254 = o.p254 / PRESSAO_PADRAO["2.54"] * 100;
        o.i508 = o.p508 / PRESSAO_PADRAO["5.08"] * 100;
        o.isc = ok(o.i254) || ok(o.i508) ? Math.max(ok(o.i254) ? o.i254 : -1, ok(o.i508) ? o.i508 : -1) : NaN;
        o.curva = { xs: xs, ys: ys, c: cc };
        if (xs.length > 1 && semAfer) avisos.push("Informe a aferição do anel (constante K ou tabela) para converter as leituras em pressão.");
        if (ok(o.cSug) && o.cSug > 0 && !ok(cMan) && P.correcao !== "auto") {
          avisos.push(rot + ": a curva pressão × penetração tem inflexão no início — correção sugerida c = " + fmt(o.cSug, 2) +
            " mm (não aplicada; informe c ou escolha aplicar a sugerida).");
        }
      });
      // curvas ISC × umidade e expansão × umidade; leitura na umidade ótima (8.2)
      function naOtima(chave) {
        var us = c.pontos.filter(function (o) { return o.usar && ok(o.h) && ok(o[chave]); });
        if (!ok(c.res.hOt) || us.length < 2) return { v: NaN, ajuste: null };
        if (us.length >= 3) {
          var q = parabola(us.map(function (o) { return o.h; }), us.map(function (o) { return o[chave]; }));
          if (q) return { v: q.a * c.res.hOt * c.res.hOt + q.b * c.res.hOt + q.c, ajuste: q };
        }
        var srt = us.slice().sort(function (a, b) { return a.h - b.h; });
        return { v: interpCurva(srt.map(function (o) { return o.h; }), srt.map(function (o) { return o[chave]; }), c.res.hOt), ajuste: null };
      }
      var I = naOtima("isc"), E = naOtima("exp");
      var res = Object.assign({}, c.res, { isc: I.v, iscAjuste: I.ajuste, exp: E.v });
      var iscMin = num(P.iscMin), expMax = num(P.expMax);
      if (ok(res.isc) && ok(iscMin) && res.isc < iscMin) avisos.push("ISC = " + fmt(res.isc, 0) + " %, abaixo do mínimo exigido de " + fmt(iscMin, 0) + " %.");
      if (ok(res.exp) && ok(expMax) && res.exp > expMax) avisos.push("Expansão = " + fmt(res.exp, 2) + " %, acima da máxima admitida de " + fmt(expMax, 2) + " %.");
      return { tab: { pontos: c.pontos }, pontos: c.pontos, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, u, rot, casas) {
        return '<div class="fe-res-item"><div class="fe-res-v">' + fmt(v, casas) + " <small>" + u + '</small></div><div class="fe-res-r">' + rot + "</div></div>";
      }
      return '<div class="fe-res">' + cx(r.isc, "%", "ISC na umidade ótima (8.2)" + (ok(num(P.iscMin)) ? " · mínimo " + P.iscMin + " %" : ""), 0) +
        cx(r.exp, "%", "Expansão na umidade ótima" + (ok(num(P.expMax)) ? " · máxima " + P.expMax + " %" : ""), 2) +
        cx(r.gsMax, "g/cm³", "Massa específica aparente seca máxima (8.1)", 3) + cx(r.hOt, "%", "Umidade ótima (8.1)", 1) + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var comp = graficoCompactacao(calc, d, Object.assign({}, opt, { isc: {
        pontos: calc.pontos.map(function (o) { return { h: o.h, v: o.isc, usar: o.usar }; }),
        ajuste: calc.resultados.iscAjuste, final: calc.resultados.isc, rotulo: "ISC (%)" } }));
      return [comp, graficoPenetracao(calc, opt)];
    },
    relatorio: {
      parametros: [["Moldagem", "5 camadas, soquete de 4,536 kg, queda de 45,72 cm; imersão de 96 h; penetração a 1,27 mm/min"]],
      notas: "Curvas de compactação, ISC × umidade e expansão × umidade: parábolas por mínimos quadrados aos CPs considerados; ISC e expansão lidos na umidade ótima (8.2). ISC de cada CP: maior valor entre 0,1 e 0,2 pol (7.3). Pressões padrão 70,31 e 105,46 kgf/cm².",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["Índice de Suporte Califórnia (na umidade ótima)", fmt(r.isc, 0) + " %"], ["Expansão (na umidade ótima)", fmt(r.exp, 2) + " %"],
          ["Massa específica aparente seca máxima", fmt(r.gsMax, 3) + " g/cm³"], ["Umidade ótima", fmt(r.hOt, 1) + " %"]];
      },
    },
    exemplo: function () {
      // moldagem = a do exemplo da compactação; leituras do anel com K = 0,077 kgf/cm² por divisão
      var pts = pontosExemplo();
      var pen = [[110, 242, 370, 435, 538, 595, 720, 800, 860], [210, 420, 640, 800, 1010, 1170, 1400, 1560, 1680],
        [300, 600, 930, 1150, 1480, 1720, 2050, 2280, 2450], [180, 360, 560, 700, 890, 1030, 1240, 1380, 1480],
        [75, 150, 240, 300, 390, 450, 540, 600, 650]];
      var exp = [[2.00, 2.10, 2.16, 2.19, 2.20], [2.00, 2.05, 2.08, 2.09, 2.10], [2.00, 2.02, 2.03, 2.05, 2.05],
        [2.00, 2.01, 2.02, 2.03, 2.03], [2.00, 2.01, 2.01, 2.02, 2.02]];
      pts.forEach(function (p, i) {
        LEITURAS_EXP.forEach(function (hh, j) { p["e" + hh] = fmt(exp[i][j], 2); });
        PENETRACOES.forEach(function (x, j) { p["p" + String(x[1]).replace(".", "_")] = String(pen[i][j]); });
      });
      return {
        ident: { registro: "EX-ISC-001", obra: "Exemplo", camada: "Base — solo-cimento 3 %", origem: "Jazida 1" },
        params: { energia: "B", aferK: "0,077", correcao: "manual", sobrecarga: "4,54", iscMin: "80", expMax: "0,5" },
        pontos: pts,
      };
    },
  };

  // curvas pressão × penetração de todos os CPs (com a correção aplicada marcada)
  function graficoPenetracao(calc, opt) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 280, m = { l: 52, r: 16, t: 14, b: 40 };
    var curvas = calc.pontos.map(function (o) { return o.curva; }).filter(function (c) { return c && c.xs.length > 1; });
    if (!curvas.length) return '<div class="fe-graf-vazio">As curvas de penetração aparecem com as leituras do anel e a aferição.</div>';
    var pMax = Math.max.apply(null, curvas.map(function (c) { return Math.max.apply(null, c.ys); }));
    var passo = pMax > 100 ? 20 : pMax > 40 ? 10 : 5, y1 = Math.ceil(pMax * 1.1 / passo) * passo;
    function X(v) { return m.l + v / 13 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / y1 * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cores = ["#4f8cff", "#34c38f", "#e0a13a", "#b58cff", "#e5534b", "#4fc3d9", "#9aa3b2"];
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    [0, 2.54, 5.08, 7.62, 10.16, 12.7].forEach(function (x) {
      s += '<line x1="' + X(x) + '" y1="' + m.t + '" x2="' + X(x) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="' + (x === 2.54 || x === 5.08 ? 1.2 : 0.6) + '"/>';
      s += '<text x="' + X(x) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + fmt(x, 2) + "</text>";
    });
    for (var gy = 0; gy <= y1; gy += passo) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + txt + '">' + gy + "</text>";
    }
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">Penetração (mm)</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Pressão (kgf/cm²)</text>';
    calc.pontos.forEach(function (o, i) {
      var c = o.curva;
      if (!c || c.xs.length < 2) return;
      var cor = cores[i % cores.length];
      s += '<path d="' + c.xs.map(function (x, j) { return (j ? "L" : "M") + X(x).toFixed(1) + " " + Y(c.ys[j]).toFixed(1); }).join(" ") +
        '" fill="none" stroke="' + cor + '" stroke-width="1.8"/>';
      c.xs.forEach(function (x, j) { if (j) s += '<circle cx="' + X(x) + '" cy="' + Y(c.ys[j]) + '" r="2.5" fill="' + cor + '"/>'; });
      if (c.c > 0) s += '<line x1="' + X(c.c) + '" y1="' + (H - m.b) + '" x2="' + X(c.c) + '" y2="' + (H - m.b - 8) + '" stroke="' + cor + '" stroke-width="2"/>';
      s += '<text x="' + (m.l + 8) + '" y="' + (m.t + 12 + i * 13) + '" text-anchor="start" fill="' + cor + '">CP ' + (i + 1) +
        (ok(o.isc) ? " · ISC " + fmt(o.isc, 0) + " %" : "") + "</text>";
    });
    return s + "</svg>";
  }
  // =====================================================================================
  // DNIT 458/2025-ME — Solos — Massa específica aparente in situ (frasco de areia) e grau de compactação
  // =====================================================================================
  FICHAS["dnit-458-2025-me"] = {
    titulo: "Solos — Massa específica aparente in situ (frasco de areia) e grau de compactação",
    resumo: "Calibração do frasco e da areia (6.1–6.2), volume do furo, massa específica aparente seca de campo e grau de compactação (6.5).",
    blocos: ["umidade"],
    params: [
      { k: "frasco", r: "Frasco de areia nº" },
      { k: "vc", r: "Volume do cilindro de calibração Vc (cm³)", dica: "cilindro de volume conhecido (6.2)" },
      { k: "meaAdot", r: "MEa adotada (g/cm³) — se não calibrar hoje", dica: "usada só quando a tabela de calibração estiver vazia" },
      { k: "m3Adot", r: "M3 adotada (g) — areia do funil e rebaixo", dica: "idem" },
      { k: "metodo", r: "Umidade do solo do furo — método (DNIT 456)", tipo: "select", recarrega: true, opcoes: METODOS_UMIDADE },
      { k: "curva", r: "Curva de calibração do Speedy (kPa = %)", ph: "20=2,5; 50=6,1; 100=12,0",
        se: function (d) { return (d.params || {}).metodo === "speedy"; } },
      { k: "importar", r: "Referência de laboratório: buscar compactação salva", tipo: "importar", de: "dnit-164-2013-me",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          if (ok(r.gsMax)) P.meLab = fmt(r.gsMax, 3);
          if (ok(r.hOt)) P.hOt = fmt(r.hOt, 1);
          P.labRegistro = (i.registro || "") + (i.origem ? " · " + i.origem : "") + (i.data ? " · " + i.data.split("-").reverse().join("/") : "");
        } },
      { k: "meLab", r: "MEₗₐb — massa específica aparente seca máxima (g/cm³)", dica: "do ensaio de compactação (DNIT 164) na energia especificada" },
      { k: "hOt", r: "Umidade ótima do laboratório (%)" },
      { k: "labRegistro", r: "Ensaio de compactação de referência" },
      { k: "gcMin", r: "Grau de compactação mínimo exigido (%) — opcional", dica: "da especificação de serviço (ex.: 100 %)" },
      { k: "gs", r: "Massa específica dos grãos (g/cm³) — opcional", dica: "para verificar a saturação (resultados acima de 95 % são suspeitos, seção 5)" },
    ],
    padrao: { metodo: "lab" },
    tabelas: function (d) {
      var P = d.params || {};
      return [
        { chave: "calib", titulo: "Calibração do frasco e da areia (6.1 e 6.2)", rotulo: "Det.", iniciais: 3, min: 3,
          dica: "três determinações antes de cada ensaio; a areia só pode ser usada se cada MEa diferir menos de 1 % da média",
          linhas: [
            { k: "M1", r: "M1 — frasco montado cheio de areia", u: "g" },
            { k: "M2", r: "M2 — frasco após encher funil e rebaixo", u: "g" },
            { calc: "M3", r: "M3 = M1 − M2 (eq. 1)", u: "g", casas: 0 },
            { k: "M4", r: "M4 — frasco após encher o cilindro", u: "g" },
            { calc: "M5", r: "M5 = M1 − M4 − M3 (eq. 2)", u: "g", casas: 0 },
            { calc: "MEa", r: "MEa = M5 / Vc (eq. 3)", u: "g/cm³", casas: 3, destaque: true },
            { calc: "dev", r: "Diferença para a média", u: "%", casas: 2 },
          ] },
        { chave: "furos", titulo: "Furos ensaiados (6.3 e 6.4)", rotulo: "Furo", iniciais: 1, min: 1,
          dica: "uma coluna por furo",
          linhas: [
            { k: "estaca", r: "Estaca", texto: true },
            { k: "posicao", r: "Posição (LE / eixo / LD)", texto: true },
            { k: "prof", r: "Profundidade do furo", u: "cm" },
            { grupo: "Volume do furo" },
            { k: "M1", r: "M1 — frasco cheio antes do ensaio", u: "g" },
            { k: "M6", r: "M6 — frasco após encher o furo", u: "g" },
            { calc: "M7", r: "M7 = M1 − M6 (eq. 4)", u: "g", casas: 0 },
            { calc: "M8", r: "M8 = M7 − M3 (eq. 5)", u: "g", casas: 0 },
            { calc: "V", r: "V = M8 / MEa (eq. 6)", u: "cm³", casas: 0 },
            { grupo: "Solo extraído do furo" },
            { k: "mb", r: "Recipiente + solo úmido", u: "g" },
            { k: "mr", r: "Recipiente (tara)", u: "g", ph: "0" },
            { calc: "Mh", r: "Mh — massa do solo úmido", u: "g", casas: 0 },
            { grupo: "Umidade do solo do furo — bloco Teor de umidade, DNIT 456-ME" },
          ].concat(BLOCOS.umidade.linhas("u", "", P.metodo || "lab")).concat([
            { grupo: "Resultados (6.4 e 6.5)" },
            { calc: "MEh", r: "MEh = Mh / V (eq. 7)", u: "g/cm³", casas: 3 },
            { calc: "MEd", r: "MEd = MEh × 100 / (100 + w) (eq. 8)", u: "g/cm³", casas: 3, destaque: true },
            { calc: "GC", r: "GC = MEd / MEₗₐb × 100 (eq. 9)", u: "%", casas: 1, destaque: true },
            { calc: "dw", r: "Desvio de umidade (w − h ótima)", u: "p.p.", casas: 1 },
            { calc: "S", r: "Grau de saturação (se informada a massa específica dos grãos)", u: "%", casas: 1 },
          ]) },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var Vc = num(P.vc);
      var calib = (d.calib || []).map(function (c) {
        var M1 = num(c.M1), M2 = num(c.M2), M4 = num(c.M4);
        var M3 = M1 - M2, M5 = M1 - M4 - M3;
        return { M3: M3, M5: M5, MEa: ok(M5) && ok(Vc) && Vc > 0 ? M5 / Vc : NaN };
      });
      var meaMed = media(calib.map(function (c) { return c.MEa; })), m3Med = media(calib.map(function (c) { return c.M3; }));
      calib.forEach(function (c, i) {
        c.dev = ok(c.MEa) && ok(meaMed) ? Math.abs(c.MEa - meaMed) / meaMed * 100 : NaN;
        if (c.dev >= 1) avisos.push("Calibração " + (i + 1) + ": MEa difere " + fmt(c.dev, 2) + " % da média — a areia não pode ser utilizada (variação deve ser inferior a 1 %, 6.2).");
      });
      var nCal = calib.filter(function (c) { return ok(c.MEa); }).length;
      if (nCal && nCal < 3) avisos.push("A calibração deve ser repetida três vezes antes de cada ensaio (6.2); há " + nCal + ".");
      if (ok(num(c0(d.calib, "M1"))) && !ok(Vc)) avisos.push("Informe o volume do cilindro de calibração (Vc).");
      var MEa = ok(meaMed) ? meaMed : num(P.meaAdot), M3 = ok(m3Med) ? m3Med : num(P.m3Adot);
      var origemMEa = ok(meaMed) ? "calibração do dia" : ok(num(P.meaAdot)) ? "valor adotado" : "";
      var meLab = num(P.meLab), hOt = num(P.hOt), gcMin = num(P.gcMin), Gs = num(P.gs);
      var curva = curvaSpeedy(P.curva);
      var furos = (d.furos || []).map(function (f, i) {
        var M7 = num(f.M1) - num(f.M6), M8 = M7 - M3, V = ok(M8) && ok(MEa) && MEa > 0 ? M8 / MEa : NaN;
        var mr = ok(num(f.mr)) ? num(f.mr) : 0, Mh = num(f.mb) - mr;
        var u = BLOCOS.umidade.calcular(f, "u", P.metodo || "lab", curva);
        if (u.aviso) avisos.push("Furo " + (i + 1) + ": " + u.aviso + ".");
        var MEh = ok(Mh) && ok(V) && V > 0 ? Mh / V : NaN;
        var MEd = ok(MEh) && ok(u.w) ? MEh * 100 / (100 + u.w) : NaN;
        var GC = ok(MEd) && ok(meLab) && meLab > 0 ? MEd / meLab * 100 : NaN;
        var S = NaN;
        if (ok(Gs) && ok(MEd) && ok(u.w) && Gs > MEd) S = (u.w / 100) * Gs / (Gs / MEd - 1) * 100;  // S = w·Gs/e
        var rot = "Furo " + (i + 1) + (f.estaca ? " (estaca " + f.estaca + ")" : "");
        if (ok(S) && S > 95) avisos.push(rot + ": saturação de " + fmt(S, 1) + " % — resultado suspeito (> 95 %, seção 5).");
        if (ok(GC) && ok(gcMin) && GC < gcMin) avisos.push(rot + ": GC = " + fmt(GC, 1) + " %, abaixo do mínimo exigido de " + fmt(gcMin, 1) + " %.");
        var prof = num(f.prof);
        if (ok(prof) && (prof < 12 || prof > 18)) avisos.push(rot + ": profundidade de " + fmt(prof, 0) + " cm; a norma indica furo com profundidade próxima a 15 cm (6.3 c).");
        return { M7: M7, M8: M8, V: V, Mh: Mh, uW: u.w, MEh: MEh, MEd: MEd, GC: GC, dw: ok(u.w) && ok(hOt) ? u.w - hOt : NaN, S: S,
          estaca: f.estaca, posicao: f.posicao, conforme: ok(GC) && ok(gcMin) ? GC >= gcMin : null };
      });
      if (!ok(MEa)) avisos.push("Sem massa específica aparente da areia: preencha a calibração ou informe a MEa adotada.");
      if (!ok(M3)) avisos.push("Sem M3 (areia do funil e rebaixo): preencha a calibração ou informe a M3 adotada.");
      if (furos.some(function (f) { return ok(f.MEd); }) && !ok(meLab)) avisos.push("Informe MEₗₐb (ou busque uma compactação salva) para calcular o grau de compactação.");
      return { tab: { calib: calib, furos: furos },
        resultados: { MEa: MEa, M3: M3, origemMEa: origemMEa, meLab: meLab, hOt: hOt, gcMin: gcMin, furos: furos,
          gcMedio: media(furos.map(function (f) { return f.GC; })) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var linhas = r.furos.map(function (f, i) {
        var sit = f.conforme === null ? "—" : f.conforme ? '<span class="fe-ok">conforme</span>' : '<span class="fe-nok">abaixo do mínimo</span>';
        return "<tr><td>" + (i + 1) + "</td><td>" + esc(f.estaca || "") + "</td><td>" + esc(f.posicao || "") + "</td><td>" + fmt(f.uW, 1) +
          "</td><td>" + fmtSig(f.MEd, 3) + "</td><td><b>" + fmt(f.GC, 1) + "</b></td><td>" + sit + "</td></tr>";
      }).join("");
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.MEa, 3) + ' <small>g/cm³</small></div>' +
        '<div class="fe-res-r">MEa da areia (' + esc(r.origemMEa || "—") + ")</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.meLab, 3) + ' <small>g/cm³</small></div><div class="fe-res-r">MEₗₐb (compactação) · h ótima ' +
        fmt(r.hOt, 1) + " %</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gcMedio, 1) + ' <small>%</small></div><div class="fe-res-r">Grau de compactação médio' +
        (ok(r.gcMin) ? " · mínimo exigido " + fmt(r.gcMin, 1) + " %" : "") + "</div></div></div>" +
        '<table class="fe-resumo"><thead><tr><th>Furo</th><th>Estaca</th><th>Posição</th><th>w (%)</th><th>MEd (g/cm³)</th><th>GC (%)</th><th>Situação</th></tr></thead><tbody>' +
        linhas + "</tbody></table>";
    },
    relatorio: {
      notas: "Massas específicas com três algarismos significativos; umidade e grau de compactação com aproximação de 0,1 % (seção 7). Umidade do solo do furo pela DNIT 456-ME.",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["Massa específica aparente da areia (MEa)", fmt(r.MEa, 3) + " g/cm³ (" + (r.origemMEa || "—") + ")"],
          ["MEₗₐb / umidade ótima", fmtSig(r.meLab, 3) + " g/cm³ / " + fmt(r.hOt, 1) + " %"]].concat(r.furos.map(function (f, i) {
          return ["Furo " + (i + 1) + (f.estaca ? " — estaca " + f.estaca : "") + (f.posicao ? " (" + f.posicao + ")" : ""),
            "w = " + fmt(f.uW, 1) + " % · MEd = " + fmtSig(f.MEd, 3) + " g/cm³ · GC = " + fmt(f.GC, 1) + " %" +
            (f.conforme === null ? "" : f.conforme ? " · conforme" : " · ABAIXO DO MÍNIMO")];
        }));
      },
    },
    // exemplo: furo da planilha DENSIDADE IN SITU do laboratório (estaca 2, eixo)
    exemplo: function () {
      return {
        ident: { registro: "EX-IS-001", obra: "Exemplo", trecho: "Rua B", camada: "Sub-base" },
        params: { frasco: "1", vc: "2000", metodo: "lab", meLab: "1,828", hOt: "15,4", labRegistro: "exemplo (planilha)", gcMin: "100" },
        calib: [{ M1: "7000", M2: "6505", M4: "3689" }, { M1: "7000", M2: "6506", M4: "3690" }, { M1: "7000", M2: "6504", M4: "3688" }],
        furos: [{ estaca: "2", posicao: "eixo", prof: "15", M1: "7000", M6: "4335", mb: "3300", mr: "0",
          un: "12", ut: "20,00", uu: "136,30", us: "120,00" }],
      };
    },
  };
  function c0(arr, k) { return arr && arr[0] ? arr[0][k] : ""; }

  // =====================================================================================
  // EXEMPLOS de cada ficha (grupo "Exemplos" na lista de ensaios; abrir carrega uma cópia).
  // Os números saem de valores-alvo coerentes (umidade, γs, ISC, expansão, GC), para que cada
  // exemplo seja internamente consistente; o 1º de cada ficha usa dados das planilhas do laboratório.
  // =====================================================================================
  function capsula(t, ms, h) {  // tara, massa seca da amostra, umidade (%) -> [tara, tara+úmida, tara+seca]
    var s = t + ms, u = s + ms * h / 100;
    return [fmt(t, 2), fmt(u, 2), fmt(s, 2)];
  }
  function pontosCompactacao(cfg) {
    return cfg.hs.map(function (h, i) {
      var c1 = capsula(14 + i * 0.37, 90 + i * 3, h - (cfg.duasCap ? 0.15 : 0));
      var mm = cfg.molde.m + i * 7;
      var p = { usar: true, c1n: String(10 + i), c1t: c1[0], c1u: c1[1], c1s: c1[2],
        moldeN: String(i + 1), moldeM: String(mm), moldeV: String(cfg.molde.v) };
      if (cfg.duasCap) {
        var c2 = capsula(15.1 + i * 0.29, 85 + i * 2, h + 0.15);
        p.c2n = String(40 + i); p.c2t = c2[0]; p.c2u = c2[1]; p.c2s = c2[2];
      }
      p.moldeSolo = String(Math.round(mm + cfg.gss[i] * (1 + h / 100) * cfg.molde.v));
      return p;
    });
  }
  // leituras do anel (K = constante) para um ISC-alvo em 0,1 pol; "infl" = curva com assentamento inicial
  var REL_PEN = [0.30, 0.58, 0.80, 1.0, 1.28, 1.48, 1.80, 2.05, 2.25];
  var REL_INFL = [0.07, 0.22, 0.58, 1.0, 1.40, 1.62, 1.95, 2.20, 2.40];
  function leiturasPen(iscPct, K, infl) {
    var p254 = iscPct / 100 * 70.31;
    return (infl ? REL_INFL : REL_PEN).map(function (r) { return String(Math.round(p254 * r / K)); });
  }
  function leiturasExp(expPct, altMm) {  // extensômetro começando em 2,00 mm
    var total = expPct / 100 * altMm;
    return [0, 0.55, 0.8, 0.93, 1].map(function (f) { return fmt(2 + total * f, 2); });
  }
  function comEnsaioISC(pontos, iscs, exps, K, alt, infl) {
    pontos.forEach(function (p, i) {
      var pen = leiturasPen(iscs[i], K, infl && infl.indexOf(i) !== -1), ex = leiturasExp(exps[i], alt);
      PENETRACOES.forEach(function (x, j) { p["p" + String(x[1]).replace(".", "_")] = pen[j]; });
      LEITURAS_EXP.forEach(function (hh, j) { p["e" + hh] = ex[j]; });
    });
    return pontos;
  }
  var CURVA_SPEEDY_EX = "20=2,1; 40=4,3; 60=6,6; 80=8,8; 100=11,0; 120=13,1; 150=16,2";

  var SUBLEITO = { hs: [18, 20, 22, 24, 26], gss: [1.52, 1.58, 1.61, 1.58, 1.52], molde: { m: 4850, v: 2085 }, duasCap: true };
  var BASE_GRAN = { hs: [4.5, 5.5, 6.5, 7.5, 8.5], gss: [2.08, 2.15, 2.19, 2.16, 2.10], molde: { m: 5120, v: 2085 }, duasCap: false };

  FICHAS["dnit-456-2025-me"].exemplos = [
    { nome: "Solo — estufa, 2 determinações", dados: FICHAS["dnit-456-2025-me"].exemplo },
    { nome: "Agregado graúdo 19 mm — estufa com verificação de constância de massa", dados: function () {
      return { ident: { registro: "EX-U-002", camada: "Brita graduada", origem: "Pedreira A" },
        params: { material: "agregado", metodo: "lab", tamanho: "19,0" },
        det: [{ dn: "B1", dt: "612,40", du: "3715,20", ds: "3653,80", d2: "3653,10" },
          { dn: "B2", dt: "598,10", du: "3702,60", ds: "3640,90", d2: "3640,40" }] };
    } },
    { nome: "Solo arenoso — Speedy com curva de calibração", dados: function () {
      return { ident: { registro: "EX-U-003", camada: "Sub-base — areia", local: "Estaca 42" },
        params: { material: "solo", metodo: "speedy", curva: CURVA_SPEEDY_EX },
        det: [{ dm: "6", dp: "58" }, { dm: "6", dp: "61" }] };
    } },
    { nome: "Solo — frigideira (campo)", dados: function () {
      return { ident: { registro: "EX-U-004", camada: "Aterro", local: "Estaca 118" },
        params: { material: "solo", metodo: "frigideira", tamanho: "4,8" },
        det: [{ dn: "F1", dt: "412,00", du: "612,50", ds: "588,30" }] };
    } },
  ];

  FICHAS["dnit-164-2013-me"].exemplos = [
    { nome: "Base solo-cimento 3 % — Proctor intermediário (planilha do laboratório)", dados: FICHAS["dnit-164-2013-me"].exemplo },
    { nome: "Subleito argiloso — Proctor normal (12 golpes), 2 cápsulas por ponto", dados: function () {
      return { ident: { registro: "EX-002", camada: "Subleito — argila siltosa", origem: "Corte km 12" },
        params: { energia: "A", gs: "2,70" }, pontos: pontosCompactacao(SUBLEITO) };
    } },
    { nome: "Base granular — Proctor modificado (55 golpes), 12 % retido na 19 mm", dados: function () {
      return { ident: { registro: "EX-003", camada: "Base — solo-brita", origem: "Jazida 4" },
        params: { energia: "C", ret19: "12", gs: "2,75" }, pontos: pontosCompactacao(BASE_GRAN) };
    } },
  ];

  FICHAS["dnit-172-2016-me"].exemplos = [
    { nome: "Base solo-cimento — 26 golpes (leituras da planilha do laboratório no CP 1)", dados: FICHAS["dnit-172-2016-me"].exemplo },
    { nome: "Subleito argiloso — 12 golpes, expansão alta, CP com curva corrigida", dados: function () {
      return { ident: { registro: "EX-ISC-002", camada: "Subleito — argila siltosa", origem: "Corte km 12" },
        params: { energia: "A", aferK: "0,077", correcao: "auto", sobrecarga: "4,54", expMax: "2", gs: "2,70" },
        pontos: comEnsaioISC(pontosCompactacao(SUBLEITO), [7, 10, 12, 9, 5], [2.4, 1.6, 1.0, 0.7, 0.5], 0.077, ALT_PADRAO, [2]) };
    } },
    { nome: "Base granular — 55 golpes, ISC alto, baixa expansão", dados: function () {
      return { ident: { registro: "EX-ISC-003", camada: "Base — solo-brita", origem: "Jazida 4" },
        params: { energia: "C", aferK: "0,077", correcao: "manual", sobrecarga: "4,54", iscMin: "80", expMax: "0,5" },
        pontos: comEnsaioISC(pontosCompactacao(BASE_GRAN), [62, 85, 104, 88, 60], [0.20, 0.12, 0.08, 0.05, 0.04], 0.077, ALT_PADRAO) };
    } },
  ];

  // furo gerado a partir de GC-alvo e pressão do Speedy
  function furoExemplo(est, pos, gcAlvo, pressao, meLab, mea, m3) {
    var w = interpolar(curvaSpeedy(CURVA_SPEEDY_EX), pressao);
    var V = 1480 + (est % 7) * 12, MEd = gcAlvo / 100 * meLab, MEh = MEd * (1 + w / 100);
    var M1 = 7200, M6 = Math.round(M1 - (V * mea + m3));
    return { estaca: String(est), posicao: pos, prof: "15", M1: String(M1), M6: String(M6),
      mb: String(Math.round(MEh * V + 250)), mr: "250", um: "6", up: String(pressao) };
  }
  FICHAS["dnit-458-2025-me"].exemplos = [
    { nome: "Sub-base — 1 furo, estufa (planilha do laboratório, estaca 2)", dados: FICHAS["dnit-458-2025-me"].exemplo },
    { nome: "Base granular — 4 furos, umidade pelo Speedy, um furo abaixo do mínimo", dados: function () {
      var mea = 1.412, m3 = 488, meLab = 2.183;  // = γs,máx do exemplo "Base granular — Proctor modificado"
      return {
        ident: { registro: "EX-IS-002", obra: "Exemplo", trecho: "km 10 ao km 11", camada: "Base — solo-brita" },
        params: { frasco: "2", vc: "2000", metodo: "speedy", curva: CURVA_SPEEDY_EX, meLab: "2,183", hOt: "6,6",
          labRegistro: "EX-003 (exemplo Proctor modificado)", gcMin: "100" },
        calib: [{ M1: "7200", M2: "6712", M4: "3888" }, { M1: "7200", M2: "6713", M4: "3890" }, { M1: "7200", M2: "6711", M4: "3887" }],
        furos: [furoExemplo(10, "LD", 101.2, 58, meLab, mea, m3), furoExemplo(15, "eixo", 99.1, 64, meLab, mea, m3),
          furoExemplo(20, "LE", 102.0, 55, meLab, mea, m3), furoExemplo(25, "eixo", 100.6, 60, meLab, mea, m3)],
      };
    } },
  ];

  // ---------- relatório completo (HTML autônomo, A4) ----------
  function valorParam(f, d) {
    var v = (d.params || {})[f.k] || "";
    if (f.tipo === "select") {
      var ops = typeof f.opcoes === "function" ? f.opcoes(d) : f.opcoes;
      v = (ops.filter(function (o) { return o[0] === v; })[0] || ["", ""])[1];
    }
    return v;
  }
  function montarRelatorio(F, n, d) {
    var calc = F.calcular(d), i = d.ident || {};
    var identHtml = IDENT.map(function (f) {
      var v = i[f.k] || "";
      if (f.tipo === "date" && v) v = v.split("-").reverse().join("/");
      return "<tr><th>" + esc(f.r) + "</th><td>" + esc(v) + "</td></tr>";
    });
    var paramRows = [["Norma", n.codigo + " — " + n.titulo]];
    F.params.forEach(function (f) {
      if (f.tipo === "importar" || (f.se && !f.se(d))) return;
      var v = valorParam(f, d);
      if (f.k === "volumePadrao" && !v) v = VOL_PADRAO + " (nominal)";
      if (v) paramRows.push([f.r.replace(/ — opcional$/, "").replace(/ — se não calibrar hoje$/, ""), v]);
    });
    ((F.relatorio || {}).parametros || []).forEach(function (r) { paramRows.push(r); });
    var TH = '<th style="width:42%;background:#f2f2f2;font-weight:normal">';
    var paramHtml = paramRows.map(function (r) { return "<tr>" + TH + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("");

    var tabsHtml = F.tabelas(d).map(function (T) {
      var cols = d[T.chave] || [], ct = (calc.tab || {})[T.chave] || [];
      if (!cols.length) return "";
      var corpo = T.linhas.map(function (l) {
        if (l.grupo) return '<tr class="g"><td colspan="' + (cols.length + 2) + '">' + esc(l.grupo) + "</td></tr>";
        var vals = cols.map(function (p, k) {
          if (l.calc) return fmt((ct[k] || {})[l.calc], l.casas);
          return p[l.k] || (l.padrao ? ((d.params || {})[l.padrao] || l.padraoFixo || "") : "");
        });
        if (vals.every(function (v) { return v === "" || v === "—"; })) return "";  // linha sem dados não entra
        return "<tr" + (l.destaque ? ' class="d"' : "") + "><th>" + esc(l.r) + '</th><td class="u">' + esc(l.u || "") + "</td>" +
          vals.map(function (v) { return "<td>" + esc(v) + "</td>"; }).join("") + "</tr>";
      }).join("");
      var nota = T.usar && cols.some(function (p) { return p.usar === false; }) ? '<p class="nota">* não considerado no ajuste da curva.</p>' : "";
      return "<h2>" + esc(T.titulo) + '</h2><table class="pts"><tr><th>' + esc(T.rotulo) + "</th><th></th>" + cols.map(function (p, k) {
        return "<th>" + (k + 1) + (T.usar && p.usar === false ? "*" : "") + "</th>";
      }).join("") + "</tr>" + corpo + "</table>" + nota;
    }).join("");

    var resRows = (F.relatorio && F.relatorio.resultados) ? F.relatorio.resultados(calc, d) : [];
    var resHtml = '<table class="res">' + resRows.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td><b>" + esc(r[1]) + "</b></td></tr>"; }).join("") + "</table>";
    var gOpt = { imprimir: true, w: 620, h: 330 };
    var graf = (F.graficos ? F.graficos(calc, d, gOpt) : F.grafico ? [F.grafico(calc, d, gOpt)] : []).map(function (x) { return '<div class="graf">' + x + "</div>"; }).join("");
    var canc = n.status === "cancelada" ? '<div class="canc">ATENÇÃO: norma cancelada pelo DNIT — não está mais em vigor.</div>' : "";
    var hoje = new Date().toLocaleString("pt-BR");
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ' + esc(n.codigo) + " " + esc(i.registro || "") + "</title><style>" +
      "@page{size:A4;margin:14mm 12mm}body{font:11px/1.35 Arial,sans-serif;color:#111;margin:0}" +
      "h1{font-size:15px;margin:0}h2{font-size:12px;margin:14px 0 5px;border-bottom:1px solid #999;padding-bottom:2px;text-transform:uppercase;letter-spacing:.03em}" +
      ".cab{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:6px}" +
      ".cab .n{font-size:12px;font-weight:bold;text-align:right}.sub{color:#444;margin-top:2px}" +
      "table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:3px 5px;text-align:left;vertical-align:top}" +
      ".duas{display:grid;grid-template-columns:1fr 1fr;gap:10px}.duas th{width:45%;background:#f2f2f2;font-weight:normal}" +
      ".pts th,.pts td{text-align:center;font-size:10.5px}.pts th:first-child{text-align:left;width:36%}.pts .u{color:#555}" +
      ".pts tr.g td{background:#e9e9e9;text-align:left;font-weight:bold}.pts tr.d td{font-weight:bold}" +
      ".res th{width:42%;background:#f2f2f2;font-weight:normal}.res td b{font-size:12.5px}" +
      ".graf{text-align:center;margin-top:8px}.graf svg{width:100%;max-width:560px}" +
      ".av{border:1px solid #c77d12;background:#fff6e5;padding:5px 8px;margin-top:6px}.nota{color:#555;margin:4px 0}" +
      ".canc{border:2px solid #c0392b;color:#c0392b;font-weight:bold;padding:5px 8px;margin:8px 0}" +
      ".ass{display:flex;gap:30px;margin-top:34px}.ass div{flex:1;border-top:1px solid #111;text-align:center;padding-top:3px}" +
      ".rod{margin-top:14px;color:#666;font-size:9.5px;border-top:1px solid #ccc;padding-top:4px}" +
      ".btn{position:fixed;top:10px;right:10px;padding:6px 12px}@media print{.btn{display:none}}" +
      '</style></head><body><button class="btn" onclick="print()">Imprimir / salvar PDF</button>' +
      '<div class="cab"><div><h1>RELATÓRIO DE ENSAIO</h1><div class="sub">' + esc(F.titulo) + '</div></div><div class="n">' + esc(n.codigo) +
      '<br><span style="font-weight:normal">Registro: ' + esc(i.registro || "—") + "</span></div></div>" + canc +
      '<h2>Identificação</h2><div class="duas"><table>' + identHtml.slice(0, 5).join("") + "</table><table>" + identHtml.slice(5).join("") + "</table></div>" +
      "<h2>Parâmetros</h2><table>" + paramHtml + "</table>" + tabsHtml +
      "<h2>Resultados</h2>" + resHtml + graf +
      ((F.relatorio || {}).notas ? '<p class="nota">' + esc(F.relatorio.notas) + "</p>" : "") +
      (calc.avisos.length ? '<div class="av">' + calc.avisos.map(function (a) { return "⚠ " + esc(a); }).join("<br>") + "</div>" : "") +
      (d.obs ? "<h2>Observações</h2><p>" + esc(d.obs).replace(/\n/g, "<br>") + "</p>" : "") +
      '<div class="ass"><div>' + esc(i.laboratorista || "Laboratorista") + "</div><div>" + esc(i.responsavel || "Responsável técnico") + "</div></div>" +
      '<div class="rod">Calculado conforme ' + esc(n.codigo) + " · gerado em " + esc(hoje) + " pelo acervo Normas DNER/DNIT.</div></body></html>";
  }

  // =====================================================================================
  // Motor da aba
  // =====================================================================================
  window.initFichas = function (ctx) {
    var byId = ctx.byId, DEPS = ctx.DEPS || {};
    var lista = document.getElementById("fe-lista");
    var painel = document.getElementById("fe-painel");
    var estado = { ficha: null, ensaio: null };  // ensaio = {uid, ficha, dados, resultados, atualizado}
    var ultimoCalc = null;

    function exemplosDe(fid) {
      var F = FICHAS[fid];
      return F.exemplos || (F.exemplo ? [{ nome: "Exemplo", dados: F.exemplo }] : []);
    }
    // exemplo como "ensaio" (dados novos a cada chamada; resultados calculados na hora)
    function ensaioExemplo(fid, i) {
      var ex = exemplosDe(fid)[i];
      if (!ex) return null;
      var dados = JSON.parse(JSON.stringify(typeof ex.dados === "function" ? ex.dados() : ex.dados));
      dados.ident = dados.ident || {};
      dados.obs = dados.obs || "";
      var r = FICHAS[fid].calcular(dados).resultados;
      return { uid: uid(), ficha: fid, dados: dados, exemplo: ex.nome,
        resultados: JSON.parse(JSON.stringify(r, function (k, v) { return k === "ajuste" || k === "furos" || k === "iscAjuste" ? undefined : v; })) };
    }

    function fichasDisponiveis() {
      return Object.keys(FICHAS).filter(function (id) { return byId[id]; });
    }
    function tabelasDe(fid, d) { return FICHAS[fid].tabelas(d); }
    function novoEnsaio(fid) {
      var F = FICHAS[fid];
      var d = { ident: { data: new Date().toISOString().slice(0, 10) }, params: Object.assign({}, F.padrao || {}), obs: "" };
      tabelasDe(fid, d).forEach(function (T) {
        d[T.chave] = [];
        for (var i = 0; i < (T.iniciais || 1); i++) d[T.chave].push(T.usar ? { usar: true } : {});
      });
      return { uid: uid(), ficha: fid, dados: d };
    }
    function garantirTabelas() {  // ensaio antigo/importado sem alguma tabela
      var d = estado.ensaio.dados;
      tabelasDe(estado.ficha, d).forEach(function (T) {
        if (!Array.isArray(d[T.chave]) || !d[T.chave].length) {
          d[T.chave] = [];
          for (var i = 0; i < (T.iniciais || 1); i++) d[T.chave].push(T.usar ? { usar: true } : {});
        }
      });
      d.params = d.params || {};
      Object.keys(FICHAS[estado.ficha].padrao || {}).forEach(function (k) { if (d.params[k] === undefined) d.params[k] = FICHAS[estado.ficha].padrao[k]; });
    }

    function renderLista() {
      var salvos = lerTodos();
      lista.innerHTML = '<div class="fe-sec">Fichas disponíveis</div>' + fichasDisponiveis().map(function (id) {
        var n = byId[id], F = FICHAS[id], qtd = salvos.filter(function (s) { return s.ficha === id; }).length;
        var bl = (F.blocos || []).filter(function (b) { return BLOCOS[b].norma !== id; }).map(function (b) { return BLOCOS[b].nome; });
        return '<div class="norma-item' + (estado.ficha === id ? " selected" : "") + '" data-f="' + esc(id) + '">' +
          '<div class="codigo">' + esc(n.codigo) + "</div><div class=\"titulo\">" + esc(F.titulo) +
          (bl.length ? " · usa bloco: " + esc(bl.join(", ")) : "") + (qtd ? " · " + qtd + " salvo(s)" : "") + "</div></div>";
      }).join("") +
        '<div class="fe-sec fe-sec-em">Em preparação</div><div class="fe-prox">Próximas fichas (após aprovação): ' +
        "granulometria, abrasão Los Angeles, equivalente de areia, ligantes…</div>";
    }

    function relacoes(fid) {
      var d = DEPS[fid] || { depende: [], usado_por: [] };
      function link(id) {
        if (!byId[id]) return "";
        return '<a class="fe-rel" data-id="' + esc(id) + '">' + esc(byId[id].codigo) + "</a>" +
          (FICHAS[id] && id !== fid ? '<a class="fe-ficha-link" data-f="' + esc(id) + '" title="abrir a ficha">🧮</a>' : "");
      }
      var antes = d.depende.filter(function (x) { return x.id; }).map(function (x) { return link(x.id); }).join(" ");
      var depois = d.usado_por.map(link).join(" ");
      var F = FICHAS[fid];
      var bl = (F.blocos || []).filter(function (b) { return BLOCOS[b].norma !== fid; }).map(function (b) {
        return BLOCOS[b].nome + " (" + link(BLOCOS[b].norma) + ")";
      });
      return '<div class="fe-relacoes">' +
        (bl.length ? "<span><b>Blocos encaixados:</b> " + bl.join(", ") + "</span>" : "") +
        (antes ? "<span><b>Pré-requisitos:</b> " + antes + "</span>" : "") +
        (depois ? "<span><b>Usam este resultado:</b> " + depois + "</span>" : "") + "</div>";
    }

    function opcoesDe(f) {
      return typeof f.opcoes === "function" ? f.opcoes(estado.ensaio.dados) : f.opcoes;
    }
    function campo(grupo, f, valor) {
      var id = "fe-" + grupo + "-" + f.k, input;
      if (f.tipo === "select") {
        input = '<select id="' + id + '" data-g="' + grupo + '" data-k="' + f.k + '">' + opcoesDe(f).map(function (o) {
          return '<option value="' + esc(o[0]) + '"' + (valor === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>";
        }).join("") + "</select>";
      } else if (f.tipo === "importar") {
        var salvos = lerTodos().filter(function (s) { return s.ficha === f.de && s.resultados; });
        var rotulo = function (i, r) {
          return (i.registro || "sem registro") + " · " + (i.origem || i.local || "") + " · γs,máx " + fmt(r.gsMax, 3) + " · h ót " + fmt(r.hOt, 1) + " %";
        };
        input = '<select id="' + id + '" data-importar="' + esc(f.k) + '"><option value="">— escolher um ensaio de ' +
          esc(byId[f.de] ? byId[f.de].codigo : f.de) + " —</option>" +
          (salvos.length ? '<optgroup label="Salvos neste navegador">' + salvos.map(function (s) {
            return '<option value="' + esc(s.uid) + '"' + (valor === s.uid ? " selected" : "") + ">" + esc(rotulo(s.dados.ident || {}, s.resultados || {})) + "</option>";
          }).join("") + "</optgroup>" : "") +
          '<optgroup label="Exemplos">' + exemplosDe(f.de).map(function (ex, k) {
            var e = ensaioExemplo(f.de, k), v = "ex:" + f.de + ":" + k;
            return '<option value="' + v + '"' + (valor === v ? " selected" : "") + ">" + esc("Exemplo — " + ex.nome + " · γs,máx " + fmt(e.resultados.gsMax, 3) + " · h ót " + fmt(e.resultados.hOt, 1) + " %") + "</option>";
          }).join("") + "</optgroup></select>";
      } else {
        input = '<input id="' + id + '" data-g="' + grupo + '" data-k="' + f.k + '" type="' + (f.tipo === "date" ? "date" : "text") +
          '" value="' + esc(valor || "") + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + ">";
      }
      return '<label class="fe-campo' + (f.tipo === "importar" ? " fe-campo-imp" : "") + '"><span>' + esc(f.r) + "</span>" + input +
        (f.dica ? "<small>" + esc(f.dica) + "</small>" : "") + "</label>";
    }

    function renderFicha() {
      var fid = estado.ficha;
      if (!fid) { painel.innerHTML = '<div class="empty-state">Escolha uma ficha à esquerda.</div>'; return; }
      var F = FICHAS[fid], n = byId[fid];
      if (!estado.ensaio || estado.ensaio.ficha !== fid) estado.ensaio = novoEnsaio(fid);
      garantirTabelas();
      var d = estado.ensaio.dados;
      var salvos = lerTodos().filter(function (s) { return s.ficha === fid; });

      var html = '<div class="content-header"><div class="header-top"><div>' +
        '<div class="codigo">' + esc(F.titulo) + "</div>" +
        '<div class="meta"><a class="fe-rel" data-id="' + esc(fid) + '">' + esc(n.codigo) + "</a> — " + esc(F.resumo) + "</div></div>" +
        '<div class="header-actions"><button class="edit-btn" id="fe-novo">Novo</button>' +
        '<button class="edit-btn save" id="fe-salvar">Salvar</button>' +
        '<button class="edit-btn save" id="fe-relatorio">Gerar relatório</button></div></div>' +
        relacoes(fid) + "</div>";

      html += '<div class="fe-salvos"><label>Abrir ensaio: <select id="fe-abrir"><option value="">— escolher um exemplo ou um ensaio salvo —</option>' +
        '<optgroup label="Exemplos">' + exemplosDe(fid).map(function (ex, k) {
          return '<option value="ex:' + k + '"' + (estado.ensaio.exemplo === ex.nome ? " selected" : "") + ">" + esc(ex.nome) + "</option>";
        }).join("") + "</optgroup>" +
        (salvos.length ? '<optgroup label="Salvos neste navegador">' + salvos.map(function (s) {
          var i = s.dados.ident || {};
          return '<option value="' + esc(s.uid) + '"' + (s.uid === estado.ensaio.uid ? " selected" : "") + ">" +
            esc((i.registro || "sem registro") + " · " + (i.data || "") + " · " + (i.local || i.origem || "")) + "</option>";
        }).join("") + "</optgroup>" : "") + '</select></label>' +
        (estado.ensaio.exemplo ? ' <span class="fe-ex-tag">exemplo — salve para guardar uma cópia</span>' : "") +
        ' <button class="fe-link" id="fe-exportar">Exportar arquivo</button>' +
        ' <label class="fe-link">Importar arquivo<input type="file" id="fe-importar" accept=".json" hidden></label>' +
        (salvos.some(function (s) { return s.uid === estado.ensaio.uid; }) ? ' <button class="fe-link fe-perigo" id="fe-excluir">Excluir este ensaio</button>' : "") +
        '<span id="fe-status"></span></div>';

      html += '<h3 class="fe-h">Identificação</h3><div class="fe-grid">' +
        IDENT.map(function (f) { return campo("ident", f, (d.ident || {})[f.k]); }).join("") + "</div>";
      html += '<h3 class="fe-h">Parâmetros do ensaio</h3><div class="fe-grid">' +
        F.params.filter(function (f) { return !f.se || f.se(d); })
          .map(function (f) { return campo("params", f, (d.params || {})[f.tipo === "importar" ? f.k : f.k]); }).join("") + "</div>";

      tabelasDe(fid, d).forEach(function (T) {
        html += '<h3 class="fe-h">' + esc(T.titulo) + (T.dica ? ' <span class="fe-hint">' + esc(T.dica) + "</span>" : "") + "</h3>" +
          '<div class="fe-tab-wrap"><table class="fe-tab" id="fe-tab-' + T.chave + '" data-t="' + T.chave + '"></table></div>' +
          '<div class="fe-pts-acoes"><button class="edit-btn" data-add="' + T.chave + '">+ ' + esc(T.rotulo) + '</button> ' +
          '<button class="edit-btn" data-rem="' + T.chave + '">− Último</button></div>';
      });

      html += '<h3 class="fe-h">Resultados</h3><div id="fe-resultados"></div>' +
        (F.grafico || F.graficos ? '<div class="fe-grafs" id="fe-grafico"></div>' : "") + '<div id="fe-avisos"></div>' +
        '<h3 class="fe-h">Observações</h3><textarea id="fe-obs" class="fe-obs" rows="3" placeholder="Ocorrências, desvios, material, etc.">' +
        esc(d.obs || "") + "</textarea>";
      painel.innerHTML = html;
      renderTabelas();
      recalcular();
      ligarEventos();
    }

    function renderTabelas() {
      var d = estado.ensaio.dados;
      tabelasDe(estado.ficha, d).forEach(function (T) {
        var cols = d[T.chave];
        var cab = '<tr><th class="fe-rot">' + esc(T.rotulo) + '</th><th class="fe-u"></th>' + cols.map(function (p, i) {
          return "<th><div>" + (i + 1) + "</div>" + (T.usar ? '<label class="fe-usar"><input type="checkbox" data-t="' + T.chave + '" data-i="' + i +
            '" data-k="usar"' + (p.usar !== false ? " checked" : "") + "> usar</label>" : "") + "</th>";
        }).join("") + "</tr>";
        var corpo = T.linhas.map(function (l) {
          if (l.grupo) return '<tr class="fe-grupo"><td colspan="' + (cols.length + 2) + '">' + esc(l.grupo) + "</td></tr>";
          var tds = cols.map(function (p, i) {
            if (l.calc) return '<td class="fe-calc' + (l.destaque ? " fe-dest" : "") + '" data-t="' + T.chave + '" data-c="' + l.calc + '" data-i="' + i + '">—</td>';
            var ph = l.padrao ? (d.params[l.padrao] || l.padraoFixo || "") : (l.ph || "");
            return '<td><input data-t="' + T.chave + '" data-i="' + i + '" data-k="' + l.k + '" value="' + esc(p[l.k] || "") + '"' +
              (ph ? ' placeholder="' + esc(ph) + '"' : "") + (l.texto ? "" : ' inputmode="decimal"') + "></td>";
          }).join("");
          return '<tr class="' + (l.calc ? "fe-linha-calc" : "") + '"><th class="fe-rot">' + esc(l.r) + '</th><td class="fe-u">' + esc(l.u || "") + "</td>" + tds + "</tr>";
        }).join("");
        document.getElementById("fe-tab-" + T.chave).innerHTML = "<thead>" + cab + "</thead><tbody>" + corpo + "</tbody>";
      });
    }

    function recalcular() {
      var F = FICHAS[estado.ficha], d = estado.ensaio.dados;
      var calc = F.calcular(d);
      ultimoCalc = calc;
      var tabs = tabelasDe(estado.ficha, d);
      Array.prototype.forEach.call(painel.querySelectorAll("td.fe-calc"), function (td) {
        var T = tabs.filter(function (x) { return x.chave === td.dataset.t; })[0];
        var l = T.linhas.filter(function (x) { return x.calc === td.dataset.c; })[0];
        var v = ((calc.tab || {})[td.dataset.t] || [])[Number(td.dataset.i)] || {};
        td.textContent = fmt(v[td.dataset.c], l.casas);
      });
      document.getElementById("fe-resultados").innerHTML = F.resultadosHtml(calc, d);
      var g = document.getElementById("fe-grafico");
      if (g) g.innerHTML = (F.graficos ? F.graficos(calc, d) : [F.grafico(calc, d)]).map(function (x) { return '<div class="fe-graf-box">' + x + "</div>"; }).join("");
      document.getElementById("fe-avisos").innerHTML = calc.avisos.length
        ? '<div class="fe-avisos">' + calc.avisos.map(function (a) { return "<div>⚠ " + esc(a) + "</div>"; }).join("") + "</div>" : "";
    }

    function status(t) {
      var s = document.getElementById("fe-status");
      if (s) { s.textContent = t; setTimeout(function () { if (s.textContent === t) s.textContent = ""; }, 3000); }
    }

    // ---------- navegação de planilha nas tabelas (como no Excel) ----------
    // ↑/↓ e Enter/Shift+Enter mudam de linha (Enter no fim da coluna vai para o topo da próxima);
    // ←/→ mudam de coluna quando o cursor está no início/fim do texto ou com tudo selecionado;
    // Tab/Shift+Tab mudam de coluna. Ao entrar na célula o conteúdo fica selecionado.
    function celulaVizinha(inp, dLin, dCol, quebra) {
      var tab = inp.closest("table");
      var linhas = Array.prototype.filter.call(tab.querySelectorAll("tbody tr"), function (tr) { return tr.querySelector("input[data-i]"); });
      var lin = linhas.indexOf(inp.closest("tr")), col = Number(inp.dataset.i);
      var nCol = estado.ensaio.dados[tab.dataset.t].length;
      var L = lin + dLin, C = col + dCol;
      if (quebra && L >= linhas.length) { L = 0; C = col + 1; }
      if (quebra && L < 0) { L = linhas.length - 1; C = col - 1; }
      if (L < 0 || L >= linhas.length || C < 0 || C >= nCol) return null;
      return linhas[L].querySelector('input[data-i="' + C + '"]');
    }
    function navegarTabela(ev) {
      var t = ev.target;
      if (!t.matches || !t.matches(".fe-tab tbody input[data-i]")) return;
      var tudo = t.selectionStart === 0 && t.selectionEnd === t.value.length;
      var alvo = null;
      switch (ev.key) {
        case "ArrowDown": alvo = celulaVizinha(t, 1, 0); break;
        case "ArrowUp": alvo = celulaVizinha(t, -1, 0); break;
        case "Enter": alvo = celulaVizinha(t, ev.shiftKey ? -1 : 1, 0, true); break;
        case "ArrowRight": if (tudo || t.selectionEnd === t.value.length) alvo = celulaVizinha(t, 0, 1); break;
        case "ArrowLeft": if (tudo || t.selectionStart === 0) alvo = celulaVizinha(t, 0, -1); break;
        case "Tab": alvo = celulaVizinha(t, 0, ev.shiftKey ? -1 : 1); if (!alvo) return; break;
        default: return;
      }
      if (ev.key === "Enter" || ev.key === "Tab" || alvo) ev.preventDefault();
      if (alvo) { alvo.focus(); alvo.select(); }
    }

    function ligarEventos() {
      var d = estado.ensaio.dados, F = FICHAS[estado.ficha];
      painel.onkeydown = navegarTabela;
      painel.onfocusin = function (ev) {
        var t = ev.target;
        if (t.matches && t.matches(".fe-tab tbody input[data-i]")) setTimeout(function () { if (document.activeElement === t) t.select(); }, 0);
      };
      painel.oninput = function (ev) {
        var t = ev.target;
        if (t.id === "fe-obs") { d.obs = t.value; return; }
        if (t.dataset.g) {
          d[t.dataset.g] = d[t.dataset.g] || {};
          d[t.dataset.g][t.dataset.k] = t.value;
          var f = t.dataset.g === "params" ? F.params.filter(function (x) { return x.k === t.dataset.k; })[0] : null;
          if (f && f.recarrega === "tabela") renderTabelas();
          if (f && f.recarrega === true && ev.type === "change") { renderFicha(); return; }
          recalcular();
          return;
        }
        if (t.dataset.i !== undefined && t.dataset.k && t.dataset.t) {
          d[t.dataset.t][Number(t.dataset.i)][t.dataset.k] = t.type === "checkbox" ? t.checked : t.value;
          recalcular();
        }
      };
      painel.onchange = function (ev) {
        var t = ev.target;
        if (t.dataset.importar) {  // traz resultados de um ensaio salvo de outra ficha
          var f = F.params.filter(function (x) { return x.k === t.dataset.importar; })[0];
          var mEx = /^ex:(.+):(\d+)$/.exec(t.value);
          var e = mEx ? ensaioExemplo(mEx[1], Number(mEx[2])) : lerTodos().filter(function (s) { return s.uid === t.value; })[0];
          d.params[f.k] = t.value;
          if (e) { f.aplicar(e, d.params, d); renderFicha(); status("Resultados importados de " + ((e.dados.ident || {}).registro || "ensaio salvo") + "."); }
          return;
        }
        painel.oninput(ev);
      };
      painel.onclick = function (ev) {
        var a = ev.target.closest(".fe-rel");
        if (a) { ctx.abrirNorma(a.dataset.id); return; }
        var fl = ev.target.closest(".fe-ficha-link");
        if (fl) { abrir(fl.dataset.f); return; }
        var add = ev.target.closest("[data-add]"), rem = ev.target.closest("[data-rem]");
        if (add) { d[add.dataset.add].push({ usar: true }); renderTabelas(); recalcular(); }
        if (rem && d[rem.dataset.rem].length > 1) { d[rem.dataset.rem].pop(); renderTabelas(); recalcular(); }
      };
      document.getElementById("fe-novo").onclick = function () { estado.ensaio = novoEnsaio(estado.ficha); renderFicha(); };
      document.getElementById("fe-salvar").onclick = function () {
        var todos = lerTodos().filter(function (s) { return s.uid !== estado.ensaio.uid; });
        estado.ensaio.atualizado = new Date().toISOString();
        delete estado.ensaio.exemplo;
        // resultados ficam disponíveis para as fichas que dependem desta (campo "importar")
        var r = ultimoCalc ? ultimoCalc.resultados : null;
        estado.ensaio.resultados = r ? JSON.parse(JSON.stringify(r, function (k, v) { return k === "ajuste" || k === "furos" ? undefined : v; })) : null;
        todos.push(estado.ensaio);
        if (gravarTodos(todos)) { renderLista(); renderFicha(); status("Salvo neste navegador."); }
        else status("Não foi possível salvar (armazenamento do navegador indisponível) — use Exportar arquivo.");
      };
      var ex = document.getElementById("fe-excluir");
      if (ex) ex.onclick = function () {
        if (!confirm("Excluir este ensaio salvo neste navegador?")) return;
        gravarTodos(lerTodos().filter(function (s) { return s.uid !== estado.ensaio.uid; }));
        estado.ensaio = novoEnsaio(estado.ficha);
        renderLista(); renderFicha();
      };
      document.getElementById("fe-abrir").onchange = function (ev) {
        ev.stopPropagation();
        var v = ev.target.value;
        if (v.indexOf("ex:") === 0) {
          var e = ensaioExemplo(estado.ficha, Number(v.slice(3)));
          e.dados.ident.data = new Date().toISOString().slice(0, 10);
          estado.ensaio = e;
          renderFicha();
          return;
        }
        var s = lerTodos().filter(function (x) { return x.uid === v; })[0];
        if (s) { estado.ensaio = s; renderFicha(); }
      };
      document.getElementById("fe-exportar").onclick = function () {
        var blob = new Blob([JSON.stringify(estado.ensaio, null, 1)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (byId[estado.ficha].codigo + "_" + ((d.ident || {}).registro || "ensaio")).replace(/[^\w.-]+/g, "_") + ".json";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      };
      document.getElementById("fe-importar").onchange = function (ev) {
        ev.stopPropagation();
        var f = ev.target.files[0];
        if (!f) return;
        f.text().then(function (t) {
          var e = JSON.parse(t);
          if (!e || !FICHAS[e.ficha] || !e.dados) throw new Error("arquivo não é um ensaio desta aba");
          estado.ficha = e.ficha;
          estado.ensaio = e;
          renderLista(); renderFicha(); status("Ensaio importado (salve para guardar neste navegador).");
        }).catch(function (err) { alert("Não foi possível importar: " + err.message); });
      };
      document.getElementById("fe-relatorio").onclick = function () {
        var doc = montarRelatorio(FICHAS[estado.ficha], byId[estado.ficha], estado.ensaio.dados);
        var w = window.open("", "_blank");
        if (!w) { alert("O navegador bloqueou a janela do relatório: permita pop-ups para esta página."); return; }
        w.document.open();
        w.document.write(doc);
        w.document.close();
      };
    }

    function abrir(fid) {
      if (!FICHAS[fid]) return;
      estado.ficha = fid;
      estado.ensaio = null;
      renderLista();
      renderFicha();
    }

    lista.onclick = function (ev) {
      var it = ev.target.closest(".norma-item");
      if (it) abrir(it.dataset.f);
    };

    estado.ficha = fichasDisponiveis()[0] || null;
    renderLista();
    renderFicha();
    return { abrir: abrir, temFicha: function (fid) { return !!FICHAS[fid]; } };
  };
  window.FICHAS_ENSAIO = FICHAS;
  window.BLOCOS_ENSAIO = BLOCOS;
  window.montarRelatorioFicha = montarRelatorio;
})();
