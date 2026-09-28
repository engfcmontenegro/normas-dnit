/*
 * Ficha: DNIT 254/2023-ME — Solos — Compactação em equipamento miniatura — Mini-CBR e expansão.
 * Registra-se no motor de site/fichas.js (window.FE). Os corpos de prova vêm da DNIT 228-ME (Mini-Proctor):
 * o campo "importar" copia umidade, altura e MEAS de cada CP e a umidade ótima / MEAS máxima.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var PEN = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];   // 6.1 k
  var EXP_L = [["e1", "1 h"], ["e4", "4 h"], ["e6", "6 h"]];               // NOTA 1
  var COND = {
    IP: "Com imersão e com sobrecarga (IP)", IS: "Com imersão e sem sobrecarga (IS)",
    HP: "Sem imersão e com sobrecarga (HP)", HS: "Sem imersão e sem sobrecarga (HS)",
  };
  function chaveP(x) { return "p" + String(x).replace(".", "_"); }
  function imerso(P) { return (P.condicao || "IP").charAt(0) === "I"; }

  // mini-CBR (eq. 2 e 3)
  function cbr1(C) { return ok(C) && C > 0 ? Math.pow(10, -0.254 + 0.896 * Math.log10(C)) : NaN; }
  function cbr2(C) { return ok(C) && C > 0 ? Math.pow(10, -0.356 + 0.937 * Math.log10(C)) : NaN; }

  function carga(P, leitura) {   // kgf pela constante do anel ou pela tabela de aferição
    if (!ok(leitura)) return NaN;
    var tab = FE.curvaSpeedy(P.aferTabela);
    if (tab.length >= 2) return FE.interpolar(tab, leitura);
    var K = num(P.aferK);
    return ok(K) ? K * leitura : NaN;
  }
  function interp(xs, ys, x) {
    if (!ok(x) || xs.length < 2 || x < xs[0] || x > xs[xs.length - 1]) return NaN;
    for (var i = 1; i < xs.length; i++) if (x <= xs[i] + 1e-12) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    return NaN;
  }
  // correção do zero (7.2 b, Figura C1): tangente no trecho mais inclinado do início da curva (até 2 mm)
  function correcaoZero(xs, ys) {
    var k = -1, sMax = 0;
    for (var i = 1; i < xs.length && xs[i] <= 2 + 1e-9; i++) {
      var s = (ys[i] - ys[i - 1]) / (xs[i] - xs[i - 1]);
      if (s > sMax * 1.001) { sMax = s; k = i; }
    }
    if (k <= 1 || sMax <= 0) return 0;            // curva já começa no trecho mais inclinado: sem inflexão
    var c = xs[k - 1] - ys[k - 1] / sMax;
    return c >= 0.05 ? c : 0;
  }
  // correção do cisalhamento (7.2 b, Figura C2): prolonga a curva com a tendência anterior à carga máxima
  // (potência C = a·x^b ajustada em log-log aos pontos entre 0,5 mm e o ponto anterior ao máximo)
  function prolongamento(xs, ys, c) {
    var iMax = 0;
    for (var i = 1; i < ys.length; i++) if (ys[i] > ys[iMax]) iMax = i;
    var cai = false;
    for (var j = iMax + 1; j < ys.length; j++) if (xs[j] > 2 && ys[j] < ys[iMax] * 0.995) cai = true;
    if (!cai || xs[iMax] >= 2.5) return null;
    var L = [], k;
    for (k = 1; k < iMax; k++) if (xs[k] - c >= 0.5) L.push([Math.log(xs[k] - c), Math.log(ys[k])]);
    if (L.length < 2) return null;
    var n = L.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    L.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; });
    var b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = Math.exp((sy - b * sx) / n);
    return { xMax: xs[iMax], f: function (x) { return a * Math.pow(x, b); } };
  }
  // valor na umidade ótima: interpolação linear entre os CPs vizinhos (curvas da Figura E1)
  function naOtima(pts, chave, hOt) {
    var us = pts.filter(function (o) { return o.usar && ok(o.h) && ok(o[chave]); }).sort(function (a, b) { return a.h - b.h; });
    return ok(hOt) ? interp(us.map(function (o) { return o.h; }), us.map(function (o) { return o[chave]; }), hOt) : NaN;
  }

  // ---------- gráficos ----------
  function cores(opt) {
    return opt && opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", s: ["#1f5fbf", "#c0392b", "#27884a", "#8e44ad", "#d35400", "#555"] }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", s: ["#4f8cff", "#e0a13a", "#3fb67a", "#b07cf0", "#ff7a59", "#9aa3b2"] };
  }
  function passo(span, alvo) {
    var p = Math.pow(10, Math.floor(Math.log10(span / alvo))), m = span / alvo / p;
    return p * (m > 5 ? 10 : m > 2 ? 5 : m > 1 ? 2 : 1);
  }
  // painel cartesiano simples: cfg {x0,x1,y0,y1, xlab, ylab, series:[{pts,cor,tr,mk,rot}], vlin:[{x,cor}], hlin, casasY}
  function painel(box, cfg, c) {
    var s = "", X = function (v) { return box.x + (v - cfg.x0) / (cfg.x1 - cfg.x0) * box.w; },
      Y = function (v) { return box.y + box.h - (v - cfg.y0) / (cfg.y1 - cfg.y0) * box.h; };
    var px = passo(cfg.x1 - cfg.x0, 8), py = passo(cfg.y1 - cfg.y0, 5);
    for (var gx = Math.ceil(cfg.x0 / px - 1e-9) * px; gx <= cfg.x1 + 1e-9; gx += px) {
      if (Math.abs(gx) < 1e-9) gx = 0;
      s += '<line x1="' + X(gx) + '" y1="' + box.y + '" x2="' + X(gx) + '" y2="' + (box.y + box.h) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      if (!cfg.semX) s += '<text x="' + X(gx) + '" y="' + (box.y + box.h + 14) + '" text-anchor="middle" fill="' + c.txt + '">' + fmt(gx, px < 1 ? 1 : 0) + "</text>";
    }
    for (var gy = Math.ceil(cfg.y0 / py - 1e-9) * py; gy <= cfg.y1 + 1e-9; gy += py) {
      if (Math.abs(gy) < 1e-9) gy = 0;
      s += '<line x1="' + box.x + '" y1="' + Y(gy) + '" x2="' + (box.x + box.w) + '" y2="' + Y(gy) + '" stroke="' + c.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (box.x - 5) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(gy, cfg.casasY !== undefined ? cfg.casasY : (py < 1 ? (py < 0.1 ? 2 : 1) : 0)) + "</text>";
    }
    s += '<rect x="' + box.x + '" y="' + box.y + '" width="' + box.w + '" height="' + box.h + '" fill="none" stroke="' + c.eixo + '"/>';
    if (cfg.xlab) s += '<text x="' + (box.x + box.w / 2) + '" y="' + (box.y + box.h + 30) + '" text-anchor="middle" fill="' + c.txt + '">' + esc(cfg.xlab) + "</text>";
    if (cfg.ylab) s += '<text transform="translate(' + (box.x - 44) + " " + (box.y + box.h / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">' + esc(cfg.ylab) + "</text>";
    (cfg.vlin || []).forEach(function (v) {
      if (ok(v.x) && v.x >= cfg.x0 && v.x <= cfg.x1) s += '<line x1="' + X(v.x) + '" y1="' + box.y + '" x2="' + X(v.x) + '" y2="' + (box.y + box.h) + '" stroke="' + v.cor + '" stroke-dasharray="4 3"/>';
    });
    (cfg.hlin || []).forEach(function (v) {
      if (ok(v.y) && v.y >= cfg.y0 && v.y <= cfg.y1) s += '<line x1="' + box.x + '" y1="' + Y(v.y) + '" x2="' + (ok(v.ate) ? X(v.ate) : box.x + box.w) + '" y2="' + Y(v.y) + '" stroke="' + v.cor + '" stroke-dasharray="4 3"/>' +
        (v.rot ? '<text x="' + (box.x + 4) + '" y="' + (Y(v.y) - 4) + '" fill="' + v.cor + '" font-weight="bold">' + esc(v.rot) + "</text>" : "");
    });
    (cfg.series || []).forEach(function (se) {
      var pts = se.pts.filter(function (p) { return ok(p[0]) && ok(p[1]); });
      if (!pts.length) return;
      if (pts.length > 1 && se.linha !== false) s += '<path d="' + pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(Math.min(Math.max(p[1], cfg.y0), cfg.y1)).toFixed(1); }).join(" ") +
        '" fill="none" stroke="' + se.cor + '" stroke-width="' + (se.larg || 1.6) + '"' + (se.tr ? ' stroke-dasharray="' + se.tr + '"' : "") + "/>";
      if (se.mk !== false) pts.forEach(function (p) { s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3.5" fill="' + se.cor + '"/>'; });
    });
    return s;
  }
  function legenda(itens, x, y, c) {
    var s = "", xx = x;
    itens.forEach(function (it) {
      s += '<line x1="' + xx + '" y1="' + (y - 4) + '" x2="' + (xx + 16) + '" y2="' + (y - 4) + '" stroke="' + it.cor + '" stroke-width="2"' + (it.tr ? ' stroke-dasharray="' + it.tr + '"' : "") + "/>" +
        '<text x="' + (xx + 20) + '" y="' + y + '" fill="' + c.txt + '">' + esc(it.rot) + "</text>";
      xx += 30 + it.rot.length * 6;
    });
    return s;
  }
  function faixa(vals, pad, min0) {
    var v = vals.filter(ok);
    if (!v.length) return null;
    var a = Math.min.apply(null, v), b = Math.max.apply(null, v), p = Math.max((b - a) * pad, Math.abs(b) * 0.02, 0.05);
    return [min0 ? 0 : a - p, b + p];
  }

  // Figura E1: MEAS, mini-CBR e expansão × umidade de compactação, leitura na umidade ótima
  function graficoE1(calc, d, opt) {
    opt = opt || {};
    var pts = calc.pontos.filter(function (o) { return ok(o.h); }), r = calc.resultados, c = cores(opt);
    if (!pts.some(function (o) { return ok(o.cbr); })) return '<div class="fe-graf-vazio">O gráfico aparece com a umidade e as leituras de penetração dos corpos de prova.</div>';
    var paineis = [];
    if (imerso(d.params || {}) && pts.some(function (o) { return ok(o.E); })) paineis.push({ k: "E", rot: "Expansão E (%)", v: r.E, casas: 1 });
    paineis.push({ k: "cbr", rot: "Mini-CBR (%)", v: r.cbr, casas: 1 });
    if (pts.some(function (o) { return ok(o.meas); })) paineis.push({ k: "meas", rot: "MEAS (g/cm³)", v: r.measMax, casas: 3 });
    var W = opt.w || 560, hp = 120, H = paineis.length * (hp + 12) + 46, m = { l: 62, r: 16, t: 10 };
    var hs = pts.map(function (o) { return o.h; }).concat(ok(r.hOt) ? [r.hOt] : []);
    var x0 = Math.floor(Math.min.apply(null, hs) - 1), x1 = Math.ceil(Math.max.apply(null, hs) + 1);
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    paineis.forEach(function (pn, i) {
      var serie = pts.filter(function (o) { return ok(o[pn.k]); }).sort(function (a, b) { return a.h - b.h; });
      var f = faixa(serie.map(function (o) { return o[pn.k]; }).concat(ok(pn.v) ? [pn.v] : []), 0.15, pn.k !== "meas");
      if (!f) return;
      var box = { x: m.l, y: m.t + i * (hp + 12), w: W - m.l - m.r, h: hp };
      s += painel(box, { x0: x0, x1: x1, y0: f[0], y1: f[1], ylab: pn.rot, semX: i < paineis.length - 1, xlab: i === paineis.length - 1 ? "Teor de umidade de compactação hc (%)" : "",
        series: [{ pts: serie.map(function (o) { return [o.h, o[pn.k]]; }), cor: c.s[0] }],
        vlin: [{ x: r.hOt, cor: c.s[1] }], hlin: [{ y: pn.v, cor: c.s[1], ate: r.hOt, rot: ok(pn.v) ? fmt(pn.v, pn.casas) : "" }] }, c);
    });
    return s + "</svg>";
  }
  // curvas carga × penetração de cada CP (com a correção aplicada)
  function graficoPen(calc, opt) {
    opt = opt || {};
    var c = cores(opt), cps = calc.pontos.filter(function (o) { return o.curva && o.curva.xs.length > 1; });
    if (!cps.length) return '<div class="fe-graf-vazio">As curvas de penetração aparecem com as leituras do anel e a aferição.</div>';
    var W = opt.w || 560, H = opt.h || 300, m = { l: 62, r: 16, t: 12, b: 56 };
    var yMax = Math.max.apply(null, cps.map(function (o) { return Math.max.apply(null, o.curva.ys.concat([o.C1, o.C2].filter(ok))); }));
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    var series = [], leg = [];
    cps.forEach(function (o) {
      var cor = c.s[o.i % c.s.length];
      series.push({ pts: o.curva.xs.map(function (x, k) { return [x, o.curva.ys[k]]; }), cor: cor });
      if (o.cc > 0) series.push({ pts: [[o.cc, 0], [2 + o.cc, o.C1], [2.5 + o.cc, o.C2]], cor: cor, tr: "4 3", mk: false, larg: 1 });
      if (o.cis) series.push({ pts: [[o.cis.xMax, o.cis.f(o.cis.xMax - o.cc)], [2 + o.cc, o.C1], [2.5 + o.cc, o.C2]], cor: cor, tr: "2 3", mk: false, larg: 1 });
      leg.push({ rot: "CP " + (o.i + 1), cor: cor });
    });
    s += painel({ x: m.l, y: m.t, w: W - m.l - m.r, h: H - m.t - m.b }, { x0: 0, x1: 5.5, y0: 0, y1: Math.ceil(yMax * 1.1 / 5) * 5 || 10,
      xlab: "Penetração (mm)", ylab: "Carga (kgf)", series: series, vlin: [{ x: 2, cor: c.s[5] }, { x: 2.5, cor: c.s[5] }] }, c);
    s += legenda(leg, m.l, H - 6, c);
    return s + "</svg>";
  }

  FE.FICHAS["dnit-254-2023-me"] = {
    titulo: "Solos — Mini-CBR e expansão (equipamento miniatura)",
    resumo: "Corpos de prova do Mini-Proctor (DNIT 228-ME): expansão após ≥ 20 h de imersão, curva carga × penetração com correções, mini-CBR a 2,00 e 2,50 mm (eq. 2 e 3), valores na umidade ótima e RIS.",
    blocos: [],
    rotuloImportar: function (r) { return "mini-CBR " + fmt(r.cbr, 1) + " % (" + (r.condicao || "") + ")"; },
    params: [
      { k: "condicao", r: "Condição do ensaio (3.3 a 3.6)", tipo: "select", recarrega: true,
        opcoes: Object.keys(COND).map(function (k) { return [k, COND[k]]; }), dica: "sobrecarga padrão anelar de 490 g" },
      { k: "importar", r: "Corpos de prova: buscar Mini-Proctor salvo (DNIT 228-ME)", tipo: "importar", de: "dnit-228-2023-me",
        dica: "copia umidade, altura e MEAS de cada CP, a umidade ótima e a MEAS máxima",
        aplicar: function (e, P, d) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          d.pontos = (r.cps || []).map(function (cp, k) {
            var alvo = Object.assign({ usar: true }, (d.pontos || [])[k] || {});
            if (ok(cp.h)) alvo.h = fmt(cp.h, 2);
            if (ok(cp.A)) alvo.L0 = fmt(cp.A, 2);
            if (ok(cp.meas)) alvo.meas = fmt(cp.meas, 3);
            alvo.usar = cp.usar !== false;
            return alvo;
          });
          if (ok(r.hOt)) P.hOt = fmt(r.hOt, 1);
          if (ok(r.measMax)) P.measMax = fmt(r.measMax, 3);
          P.energia = r.energia || P.energia;
          P.compRegistro = (i.registro || "") + (i.origem ? " · " + i.origem : "");
        } },
      { k: "compRegistro", r: "Compactação de origem dos corpos de prova" },
      { k: "energia", r: "Energia de compactação", ph: "ex.: Normal" },
      { k: "hOt", r: "Umidade ótima ho (%)", dica: "da curva de compactação (DNIT 228-ME)" },
      { k: "measMax", r: "MEAS máxima (g/cm³)" },
      { k: "aferK", r: "Aferição do anel — constante (kgf por unidade de leitura)", dica: "carga = constante × leitura do extensômetro do anel" },
      { k: "aferTabela", r: "…ou tabela de aferição (leitura = carga kgf)", ph: "50=15,2; 100=30,1; 200=60,5", dica: "substitui a constante; interpolação linear" },
      { k: "correcao", r: "Correções da curva carga × penetração (7.2 b)", tipo: "select",
        opcoes: [["manual", "Só as informadas por CP (c e cargas corrigidas)"], ["auto", "Aplicar as correções sugeridas (inflexão e cisalhamento)"]] },
      { k: "outroCBR", r: "Mini-CBR na umidade ótima na condição complementar — para o RIS (7.3)",
        dica: "com a condição IP informe o mini-CBR HP (e vice-versa)", se: function (d) { var c = (d.params || {}).condicao || "IP"; return c === "IP" || c === "HP"; } },
      { k: "cbrMin", r: "Mini-CBR mínimo exigido (%) — opcional" },
      { k: "expMax", r: "Expansão máxima admitida (%) — opcional", se: function (d) { return imerso(d.params || {}); } },
    ],
    padrao: { condicao: "IP", correcao: "manual" },
    tabelas: function (d) {
      var P = d.params || {};
      var lin = [{ grupo: "Corpo de prova — Mini-Proctor, DNIT 228-ME (seção 5)" },
        { k: "h", r: "Teor de umidade de compactação (hc)", u: "%" },
        { k: "L0", r: "Altura inicial do CP após a compactação (L₀)", u: "mm" },
        { k: "meas", r: "MEAS do CP (opcional, para o gráfico)", u: "g/cm³" }];
      if (imerso(P)) {
        lin.push({ grupo: "Expansão — extensômetro do dispositivo de imersão (6.1 c–e e 7.1)" },
          { k: "Li", r: "Leitura inicial, antes de encher o tanque (Li)", u: "mm" });
        EXP_L.forEach(function (e) { lin.push({ k: e[0], r: "Leitura com " + e[1] + " (NOTA 1, opcional)", u: "mm" }); });
        lin.push({ k: "Lf", r: "Leitura final, após ≥ 20 h (Lf)", u: "mm" },
          { k: "tI", r: "Tempo de imersão", u: "h", ph: "20" },
          { calc: "E", r: "Expansão E = (Lf − Li) × 100 / L₀ (eq. 1)", u: "%", casas: 1, destaque: true });
      }
      lin.push({ grupo: "Penetração a ~1,25 mm/min — leituras do anel dinamométrico (6.1 j–k)" });
      PEN.forEach(function (x) { lin.push({ k: chaveP(x), r: fmt(x, 2) + " mm", u: "leitura" }); });
      lin.push({ k: "cMan", r: "Correção do zero c (manual, Figura C1)", u: "mm", ph: "—" },
        { calc: "cSug", r: "Correção do zero sugerida (tangente no ponto de inflexão)", u: "mm", casas: 2 },
        { k: "C1man", r: "Carga corrigida a 2,00 mm (manual — cisalhamento, Figura C2)", u: "kgf", ph: "—" },
        { k: "C2man", r: "Carga corrigida a 2,50 mm (manual — cisalhamento)", u: "kgf", ph: "—" },
        { calc: "C1", r: "Carga C₁ a 2,00 mm (7.2 c)", u: "kgf", casas: 1 },
        { calc: "C2", r: "Carga C₂ a 2,50 mm (7.2 c)", u: "kgf", casas: 1 },
        { calc: "cbr1", r: "mini-CBR₁ = 10^(−0,254 + 0,896 log C₁) (eq. 2)", u: "%", casas: 1 },
        { calc: "cbr2", r: "mini-CBR₂ = 10^(−0,356 + 0,937 log C₂) (eq. 3)", u: "%", casas: 1 },
        { calc: "cbr", r: "Mini-CBR do CP — o maior (7.2 e)", u: "%", casas: 1, destaque: true },
        { k: "hFinal", r: "Umidade após a penetração — topo, centro e base (6.1 m)", u: "%", ph: "opcional" });
      return [{ chave: "pontos", titulo: "Corpos de prova", rotulo: "CP", iniciais: 5, min: 1, usar: true,
        dica: "uma coluna por CP (cinco teores de umidade, seção 5). Desmarque \"usar\" para tirar um CP das curvas × umidade.", linhas: lin }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], im = imerso(P), auto = P.correcao === "auto";
      var tab = FE.curvaSpeedy(P.aferTabela), semAfer = !ok(num(P.aferK)) && tab.length < 2;
      var pontos = (d.pontos || []).map(function (p, i) {
        var o = { i: i, usar: p.usar !== false, h: num(p.h), meas: num(p.meas) }, rot = "CP " + (i + 1);
        if (im) {
          var Li = num(p.Li), Lf = num(p.Lf), L0 = num(p.L0);
          o.E = ok(Li) && ok(Lf) && ok(L0) && L0 > 0 ? (Lf - Li) * 100 / L0 : NaN;   // eq. 1
          if (ok(Li) && ok(Lf) && !ok(L0)) avisos.push(rot + ": informe a altura inicial L₀ para calcular a expansão.");
          var tI = num(p.tI);
          if (ok(tI) && tI < 20) avisos.push(rot + ": imersão de " + fmt(tI, 0) + " h — mínimo de 20 h (3.3 e 6.1 e).");
          if (ok(o.E) && o.E > 5) avisos.push(rot + ": expansão de " + fmt(o.E, 1) + " % (> 5 %) — recomenda-se traçar a curva tempo × expansão com as leituras intermediárias (NOTA 4).");
        }
        var xs = [0], ys = [0];
        PEN.forEach(function (x) {
          var cg = carga(P, num(p[chaveP(x)]));
          if (ok(cg)) { xs.push(x); ys.push(cg); }
        });
        if (xs.length > 1 && semAfer) avisos.push("Informe a aferição do anel (constante ou tabela) para converter as leituras em carga (7.2 a).");
        o.curva = { xs: xs, ys: ys };
        o.cSug = xs.length >= 5 ? correcaoZero(xs, ys) : NaN;
        var cMan = num(p.cMan);
        o.cc = ok(cMan) ? cMan : auto && ok(o.cSug) ? o.cSug : 0;
        if (ok(o.cSug) && o.cSug > 0 && !ok(cMan) && !auto) avisos.push(rot + ": a curva tem ponto de inflexão próximo à origem — correção do zero sugerida c = " + fmt(o.cSug, 2) + " mm (não aplicada; informe c ou escolha aplicar as sugeridas).");
        o.C1 = interp(xs, ys, 2 + o.cc);
        o.C2 = interp(xs, ys, 2.5 + o.cc);
        var pr = xs.length >= 5 ? prolongamento(xs, ys, o.cc) : null, c1m = num(p.C1man), c2m = num(p.C2man);
        if (pr) {
          if (auto && !ok(c1m) && !ok(c2m)) {
            o.cis = pr;
            if (2 + o.cc > pr.xMax) o.C1 = pr.f(2);
            if (2.5 + o.cc > pr.xMax) o.C2 = pr.f(2.5);
            avisos.push(rot + ": carga decrescente após o máximo (cisalhamento) — curva prolongada com a tendência anterior ao máximo (7.2 b; Figura C2).");
          } else if (!ok(c1m) && !ok(c2m)) {
            avisos.push(rot + ": carga decrescente após 2,00 mm (cisalhamento do CP) — prolongue a curva com a mesma tendência a partir de um ponto anterior à carga máxima e informe C₁/C₂ corrigidas, ou escolha aplicar as sugeridas (7.2 b; Figura C2).");
          }
        }
        if (ok(c1m)) o.C1 = c1m;
        if (ok(c2m)) o.C2 = c2m;
        if (xs.length > 1 && !ok(o.C2) && !semAfer) avisos.push(rot + ": leituras insuficientes para a carga a 2,50 mm" + (o.cc ? " (com a correção de " + fmt(o.cc, 2) + " mm)" : "") + ".");
        o.cbr1 = cbr1(o.C1); o.cbr2 = cbr2(o.C2);
        o.cbr = ok(o.cbr1) || ok(o.cbr2) ? Math.max(ok(o.cbr1) ? o.cbr1 : -1, ok(o.cbr2) ? o.cbr2 : -1) : NaN;
        return o;
      });
      var hOt = num(P.hOt), res = { hOt: hOt, measMax: num(P.measMax), condicao: P.condicao || "IP" };
      res.cbr = naOtima(pontos, "cbr", hOt);
      res.E = im ? naOtima(pontos, "E", hOt) : NaN;
      var comCBR = pontos.filter(function (o) { return ok(o.cbr) && ok(o.h); });
      if (comCBR.length && !ok(hOt)) avisos.push("Informe a umidade ótima (ou importe o Mini-Proctor) para obter o mini-CBR e a expansão na umidade ótima (8.1 c e 8.2 b).");
      else if (comCBR.length && !ok(res.cbr)) avisos.push("A umidade ótima está fora do intervalo de umidades dos CPs — não é possível interpolar.");
      if (comCBR.length && comCBR.length < 5) avisos.push("A norma prevê cinco corpos de prova com diferentes teores de umidade (seção 5); há " + comCBR.length + ".");
      // RIS (7.3) = mini-CBR IP / mini-CBR HP
      var outro = num(P.outroCBR);
      if (ok(outro) && ok(res.cbr) && outro > 0) {
        if (res.condicao === "IP") res.ris = res.cbr / outro * 100;
        else if (res.condicao === "HP") res.ris = outro / res.cbr * 100;
      }
      var cbrMin = num(P.cbrMin), expMax = num(P.expMax);
      if (ok(res.cbr) && ok(cbrMin) && res.cbr < cbrMin) avisos.push("Mini-CBR na umidade ótima = " + fmt(res.cbr, 1) + " %, abaixo do mínimo exigido de " + fmt(cbrMin, 0) + " %.");
      if (im && ok(res.E) && ok(expMax) && res.E > expMax) avisos.push("Expansão na umidade ótima = " + fmt(res.E, 1) + " %, acima da máxima admitida de " + fmt(expMax, 1) + " %.");
      res.cbrOk = ok(res.cbr) && ok(cbrMin) ? res.cbr >= cbrMin : null;
      return { tab: { pontos: pontos }, pontos: pontos, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, u, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + " <small>" + u + '</small></div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' + cx(fmt(r.cbr, 1), "%", "Mini-CBR " + esc(r.condicao) + " na umidade ótima (8.1 c)" +
        (r.cbrOk === null ? "" : r.cbrOk ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>'));
      if (imerso(P)) h += cx(fmt(r.E, 1), "%", "Expansão na umidade ótima (8.2 b)");
      if (ok(r.ris)) h += cx(fmt(r.ris, 0), "%", "RIS = mini-CBR IP / mini-CBR HP (eq. 4)");
      h += cx(fmt(r.hOt, 1) + " % · " + fmt(r.measMax, 3), "g/cm³", "Umidade ótima e MEAS máxima (DNIT 228-ME)", true);
      return h + "</div>";
    },
    graficos: function (calc, d, opt) { return [graficoE1(calc, d, opt), graficoPen(calc, opt)]; },
    relatorio: {
      parametros: [["Penetração", "pistão a ~1,25 mm/min; leituras de 0,25 a 5,00 mm; sobrecarga anelar padrão de 490 g quando com sobrecarga"]],
      notas: "E = (Lf − Li) × 100 / L₀ (eq. 1), aproximação de 0,1 %. Cargas pela aferição do anel; correção do zero pela tangente no ponto de inflexão (Figura C1) e do cisalhamento pelo prolongamento da curva (Figura C2), quando aplicadas. mini-CBR₁ = 10^(−0,254 + 0,896 log C₁) e mini-CBR₂ = 10^(−0,356 + 0,937 log C₂) (eq. 2 e 3; a Tabela D1 é só uma simplificação); adota-se o maior. Valores na umidade ótima por interpolação linear entre os CPs vizinhos nas curvas × umidade (Figura E1). RIS = mini-CBR IP / mini-CBR HP × 100 (eq. 4).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [["Condição do ensaio", COND[r.condicao] || r.condicao]];
        if (P.energia) rows.push(["Energia de compactação", P.energia]);
        rows.push(["Umidade ótima / MEAS máxima", fmt(r.hOt, 1) + " % / " + fmt(r.measMax, 3) + " g/cm³"]);
        rows.push(["Mini-CBR na umidade ótima", fmt(r.cbr, 1) + " %" + (r.cbrOk === null ? "" : r.cbrOk ? " — atende ao mínimo de " + P.cbrMin + " %" : " — NÃO ATENDE ao mínimo de " + P.cbrMin + " %")]);
        if (imerso(P)) rows.push(["Expansão na umidade ótima", fmt(r.E, 1) + " %"]);
        if (ok(r.ris)) rows.push(["Relação de Índice de Suporte (RIS)", fmt(r.ris, 0) + " %"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Areia argilosa laterítica — imersa com sobrecarga (IP), CPs do Mini-Proctor (gerado)", dados: function () {
        var pen = ["17 27 37 45 53 60 74 87 100 111 122 133 144", "32 52 70 86 101 115 141 166 189 211 233 253 273",
          "45 74 100 122 144 164 202 237 270 302 332 362 390", "34 56 75 92 108 123 151 178 202 226 249 271 293",
          "19 31 41 51 60 68 84 98 112 125 138 150 162"];
        var exp = [["5,00", "5,21", "5,33", "5,38", "5,45"], ["5,00", "5,12", "5,19", "5,22", "5,25"], ["5,00", "5,07", "5,11", "5,12", "5,15"],
          ["5,00", "5,04", "5,07", "5,08", "5,10"], ["5,00", "5,02", "5,03", "5,04", "5,05"]];
        var cp = [["8,90", "49,88", "1,862"], ["10,41", "50,09", "1,935"], ["11,90", "50,07", "1,958"], ["13,30", "49,70", "1,921"], ["14,70", "49,82", "1,846"]];
        return { ident: { registro: "EX-MCBR-001", obra: "Obra A", camada: "Base — solo arenoso fino laterítico", origem: "Jazida 1", data: "2026-03-11" },
          params: { condicao: "IP", importar: "ex:dnit-228-2023-me:1", compRegistro: "EX-MP-002 · Jazida 1", energia: "Normal", hOt: "11,7", measMax: "1,956",
            aferK: "0,30", correcao: "manual", outroCBR: "43", cbrMin: "12", expMax: "0,5" },
          pontos: cp.map(function (c, i) {
            var o = { usar: true, h: c[0], L0: c[1], meas: c[2], Li: exp[i][0], e1: exp[i][1], e4: exp[i][2], e6: exp[i][3], Lf: exp[i][4], tI: "22" };
            pen[i].split(" ").forEach(function (v, k) { o[chaveP(PEN[k])] = v; });
            return o;
          }) };
      } },
      { nome: "Mesmo solo — sem imersão, com sobrecarga (HP) e RIS (gerado)", dados: function () {
        var pen = ["54 90 120 148 173 198 243 285 325 364 400 436 470", "78 129 172 212 249 284 349 410 468 523 576 626 676",
          "85 141 189 232 272 311 382 449 512 572 629 685 739", "66 109 146 180 211 240 296 347 396 442 487 530 572",
          "38 63 84 104 122 139 171 201 229 256 282 307 331"];
        var cp = [["8,90", "49,88", "1,862"], ["10,41", "50,09", "1,935"], ["11,90", "50,07", "1,958"], ["13,30", "49,70", "1,921"], ["14,70", "49,82", "1,846"]];
        return { ident: { registro: "EX-MCBR-002", obra: "Obra A", camada: "Base — solo arenoso fino laterítico", origem: "Jazida 1", data: "2026-03-11" },
          params: { condicao: "HP", compRegistro: "EX-MP-002 · Jazida 1", energia: "Normal", hOt: "11,7", measMax: "1,956", aferK: "0,30", correcao: "manual", outroCBR: "23", cbrMin: "12" },
          pontos: cp.map(function (c, i) {
            var o = { usar: true, h: c[0], L0: c[1], meas: c[2] };
            pen[i].split(" ").forEach(function (v, k) { o[chaveP(PEN[k])] = v; });
            return o;
          }) };
      } },
      { nome: "Silte argiloso expansivo — correções da curva e mini-CBR abaixo do mínimo (gerado)", dados: function () {
        var pen = ["5 9 12 14 17 19 23 28 31 35 39 42 45", "1 5 12 16 20 24 31 37 43 48 53 59 63", "9 15 20 24 29 33 40 47 54 60 66 72 78",
          "7 12 17 20 24 27 27 26 26 25 24 24 23", "5 8 11 13 16 18 22 26 29 33 36 39 42"];
        var exp = [["4,00", "4,95", "5,70", "6,05", "7,10"], ["4,00", "4,70", "5,20", "5,50", "6,32"], ["4,00", "4,42", "4,80", "5,02", "5,61"],
          ["4,00", "4,31", "4,55", "4,70", "5,06"], ["4,00", "4,18", "4,32", "4,41", "4,62"]];
        var cp = [["12,20", "50,34", "1,515"], ["14,30", "49,93", "1,560"], ["16,40", "50,11", "1,600"], ["18,50", "50,30", "1,632"], ["20,60", "50,55", "1,618"]];
        return { ident: { registro: "EX-MCBR-003", obra: "Obra B", camada: "Subleito — silte argiloso", origem: "Jazida 2" },
          params: { condicao: "IP", energia: "Intermediária", hOt: "18,0", measMax: "1,625", aferK: "0,30", correcao: "auto", cbrMin: "12", expMax: "2" },
          pontos: cp.map(function (c, i) {
            var o = { usar: true, h: c[0], L0: c[1], meas: c[2], Li: exp[i][0], e1: exp[i][1], e4: exp[i][2], e6: exp[i][3], Lf: exp[i][4], tI: i === 4 ? "18" : "21" };
            pen[i].split(" ").forEach(function (v, k) { o[chaveP(PEN[k])] = v; });
            return o;
          }) };
      } },
    ],
  };
})();
