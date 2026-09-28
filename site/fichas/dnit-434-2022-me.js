/*
 * Ficha: DNIT 434/2022-ME — Fadiga por compressão diametral à tensão controlada em camadas estabilizadas quimicamente.
 * O equipamento fornece, por corpo de prova, a carga aplicada e o número de ciclos até a ruptura completa; a ficha
 * calcula σt (eq. 2) e %RF = σt/σr e ajusta o modelo Nfad = 10^(K1 + K2·%RF) (eq. 1), com as verificações das seções 5 a 8.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G = 9.80665;

  // rótulo dos ensaios de resistência à tração salvos (DNIT 136) no campo "importar"

  // ---------- gráfico XY com escalas linear ou logarítmica ----------
  var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function rotLog(k) {
    if (k >= -3 && k <= 6) return fmt(Math.pow(10, k), Math.max(0, -k));
    return "10" + String(k).split("").map(function (c) { return SUP[c]; }).join("");
  }
  function passoLin(a, b) {
    var r = (b - a) / 5 || 1, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  // o = {opt, logX, logY, logY2, xl, yl, y2l, series: [{pts: [[x, y]], cor, linha, marca, trac, rot, y2}], vlinhas: [{x, cor, rot}],
  //      leg: "dir"|"esq", vazio, xInclui, yInclui}
  function grafXY(o) {
    var temY2 = o.series.some(function (s) { return s.y2; });
    var opt = o.opt || {}, W = opt.w || 560, H = opt.h || 300, m = { l: 62, r: temY2 ? 62 : 26, t: 14, b: 42 };
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var xs = [], ys = [], y2s = [];
    o.series.forEach(function (s) {
      var lg = s.y2 ? o.logY2 : o.logY;
      s.pts.forEach(function (p) {
        if (ok(p[0]) && ok(p[1]) && (!o.logX || p[0] > 0) && (!lg || p[1] > 0)) { xs.push(p[0]); (s.y2 ? y2s : ys).push(p[1]); }
      });
    });
    if (!ys.length && y2s.length) ys = y2s.slice();
    if (xs.length < 2) return '<div class="fe-graf-vazio">' + (o.vazio || "O gráfico aparece com os resultados.") + "</div>";
    function eixo(v, log, inclui) {
      v = v.concat((inclui || []).filter(function (x) { return ok(x) && (!log || x > 0); }));
      var a = Math.min.apply(null, v), b = Math.max.apply(null, v);
      if (log) {
        var la = Math.floor(Math.log10(a) + 1e-9), lb = Math.ceil(Math.log10(b) - 1e-9);
        if (lb <= la) lb = la + 1;
        return { log: true, a: la, b: lb };
      }
      if (a === b) { a -= 1; b += 1; }
      var p = passoLin(a, b);
      return { log: false, a: Math.floor(a / p + 1e-9) * p, b: Math.ceil(b / p - 1e-9) * p, p: p };
    }
    var ex = eixo(xs, o.logX, o.xInclui), ey = eixo(ys, o.logY, o.yInclui), ey2 = y2s.length ? eixo(y2s, o.logY2, o.y2Inclui) : null;
    function X(v) { return m.l + ((ex.log ? Math.log10(v) : v) - ex.a) / (ex.b - ex.a) * (W - m.l - m.r); }
    function Yde(e) { return function (v) { return H - m.b - ((e.log ? Math.log10(v) : v) - e.a) / (e.b - e.a) * (H - m.t - m.b); }; }
    var Y = Yde(ey), Y2 = ey2 ? Yde(ey2) : Y;
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    function linhaGrade(x1, y1, x2, y2, w) {
      s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + grade + '" stroke-width="' + w + '"/>';
    }
    function marcas(e, vert) {
      var L = [];
      if (e.log) {
        for (var k = e.a; k <= e.b; k++) {
          L.push([Math.pow(10, k), rotLog(k), 0.9]);
          if (k < e.b) for (var j = 2; j <= 9; j++) L.push([j * Math.pow(10, k), "", 0.35]);
        }
      } else {
        var casas = Math.max(0, -Math.floor(Math.log10(e.p) + 1e-9));
        for (var v = e.a; v <= e.b + e.p * 1e-6; v += e.p) L.push([v, fmt(Math.abs(v) < e.p * 1e-6 ? 0 : v, casas), 0.6]);
      }
      L.forEach(function (t) {
        if (vert) {
          var x = X(t[0]); linhaGrade(x, m.t, x, H - m.b, t[2]);
          if (t[1]) s += '<text x="' + x.toFixed(1) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + t[1] + "</text>";
        } else {
          var y = Y(t[0]); linhaGrade(m.l, y, W - m.r, y, t[2]);
          if (t[1]) s += '<text x="' + (m.l - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" fill="' + txt + '">' + t[1] + "</text>";
        }
      });
    }
    marcas(ex, true); marcas(ey, false);
    if (ey2) {  // eixo secundário (direita), só rótulos
      var L2 = [];
      if (ey2.log) for (var k2 = ey2.a; k2 <= ey2.b; k2++) L2.push([Math.pow(10, k2), rotLog(k2)]);
      else for (var v2 = ey2.a, c2 = Math.max(0, -Math.floor(Math.log10(ey2.p) + 1e-9)); v2 <= ey2.b + ey2.p * 1e-6; v2 += ey2.p) L2.push([v2, fmt(v2, c2)]);
      L2.forEach(function (t2) {
        var y = Y2(t2[0]);
        s += '<line x1="' + (W - m.r) + '" y1="' + y.toFixed(1) + '" x2="' + (W - m.r + 4) + '" y2="' + y.toFixed(1) + '" stroke="' + txt + '"/>';
        s += '<text x="' + (W - m.r + 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="start" fill="' + txt + '">' + t2[1] + "</text>";
      });
      s += '<text transform="translate(' + (W - 10) + " " + ((H - m.b + m.t) / 2) + ') rotate(90)" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.y2l || "") + "</text>";
    }
    (o.vlinhas || []).forEach(function (vl, iv) {
      if (!ok(vl.x) || (o.logX && vl.x <= 0)) return;
      var x = X(vl.x);
      if (x < m.l || x > W - m.r) return;
      s += '<line x1="' + x.toFixed(1) + '" y1="' + m.t + '" x2="' + x.toFixed(1) + '" y2="' + (H - m.b) + '" stroke="' + (vl.cor || txt) + '" stroke-width="1.2" stroke-dasharray="4 3"/>';
      if (vl.rot) s += '<text x="' + (x + 4).toFixed(1) + '" y="' + (H - m.b - 6 - iv * 13) + '" text-anchor="start" fill="' + (vl.cor || txt) + '">' + FE.esc(vl.rot) + "</text>";
    });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.xl || "") + "</text>";
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.yl || "") + "</text>";
    var nl = 0;
    o.series.forEach(function (sr) {
      var lg = sr.y2 ? o.logY2 : o.logY, Ys = sr.y2 ? Y2 : Y;
      var pts = sr.pts.filter(function (p) { return ok(p[0]) && ok(p[1]) && (!o.logX || p[0] > 0) && (!lg || p[1] > 0); }), cor = sr.cor || "#4f8cff";
      if (!pts.length) return;
      if (sr.linha) s += '<path d="' + pts.map(function (p, j) { return (j ? "L" : "M") + X(p[0]).toFixed(1) + " " + Ys(p[1]).toFixed(1); }).join(" ") +
        '" fill="none" stroke="' + cor + '" stroke-width="' + (sr.larg || 1.8) + '"' + (sr.trac ? ' stroke-dasharray="5 4"' : "") + "/>";
      if (sr.marca !== false) pts.forEach(function (p) {
        s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Ys(p[1]).toFixed(1) + '" r="' + (sr.raio || 3) + '" fill="' + (sr.vazado ? "none" : cor) + '" stroke="' + cor + '"/>';
      });
      if (sr.rot) {
        var dir = o.leg === "dir";
        s += '<text x="' + (dir ? W - m.r - 8 : m.l + 8) + '" y="' + (m.t + 12 + nl * 13) + '" text-anchor="' + (dir ? "end" : "start") + '" fill="' + cor + '">' + FE.esc(sr.rot) + "</text>";
        nl++;
      }
    });
    return s + "</svg>";
  }
  var CORES = ["#4f8cff", "#e0a13a", "#34c38f", "#b58cff", "#e5534b", "#4fc3d9", "#9aa3b2"];
  // regressão linear y = a + b·x com R²
  function regLin(xs, ys) {
    var P = [];
    xs.forEach(function (x, i) { if (ok(x) && ok(ys[i])) P.push([x, ys[i]]); });
    var n = P.length;
    if (n < 2) return null;
    var mx = media(P.map(function (p) { return p[0]; })), my = media(P.map(function (p) { return p[1]; }));
    var sxx = 0, sxy = 0, syy = 0;
    P.forEach(function (p) { sxx += (p[0] - mx) * (p[0] - mx); sxy += (p[0] - mx) * (p[1] - my); syy += (p[1] - my) * (p[1] - my); });
    if (!sxx) return null;
    var b = sxy / sxx;
    return { a: my - b * mx, b: b, r2: syy ? sxy * sxy / (sxx * syy) : NaN, n: n };
  }

  FE.FICHAS["dnit-434-2022-me"] = {
    titulo: "Camadas estabilizadas quimicamente — Fadiga por compressão diametral à tensão controlada",
    resumo: "CPs de 100 mm de diâmetro e 50 a 70 mm de altura (serrados de amostras de 100 × 200 mm), carregamento repetido a 1 Hz (0,1 s de carga e 0,9 s de repouso) até a ruptura completa, em quatro níveis de tensão entre 50 % e 90 % da RT, três CPs por nível. σt = 2F/(π·d·t) (eq. 2), %RF = σt/σr e Nfad = 10^(K1 + K2·%RF) (eq. 1) ajustado por regressão de log N sobre %RF, com R² ≥ 0,8 para 12 CPs.",
    blocos: [],
    params: [
      { k: "material", r: "Material estabilizado", ph: "ex.: BGTC 4 % de cimento, 7 dias de cura" },
      { k: "cura", r: "Tempo de cura (dias)", ph: "ex.: 28", dica: "CPs ensaiados em idades próximas (nota 5)" },
      { k: "importarRT", r: "Resistência à tração: importar de um ensaio salvo (DNIT 136)", tipo: "importar", de: "dnit-136-2018-me",
        dica: "média de três CPs escolhidos aleatoriamente entre os moldados (6 a)",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          if (ok(r.rt)) P.rt = fmt(r.rt, 3);
          P.rtRegistro = (i.registro || "ensaio salvo") + (i.camada ? " · " + i.camada : "");
        } },
      { k: "rtRegistro", r: "Ensaio de resistência à tração de origem" },
      { k: "rt", r: "Resistência à tração estática média — σr (MPa) (6 a)", ph: "ex.: 0,85" },
      { k: "rf", r: "Expressão de %RF no modelo (eq. 1)", tipo: "select",
        opcoes: [["pct", "Porcentagem (ex.: 75)"], ["fracao", "Fração (ex.: 0,75)"]],
        dica: "a norma chama %RF de razão σt/σr sem fixar a escala; K2 muda na mesma proporção (× 100)" },
      { k: "unidade", r: "Unidade das dimensões", tipo: "select", opcoes: [["mm", "mm"], ["cm", "cm"]] },
      { k: "carga", r: "Unidade da carga aplicada", tipo: "select", recarrega: true, opcoes: [["N", "N"], ["kgf", "kgf"], ["kN", "kN"]] },
    ],
    padrao: { rf: "pct", unidade: "mm", carga: "N" },
    tabelas: function (d) {
      var P = d.params || {}, u = P.unidade === "cm" ? "cm" : "mm";
      return [{ chave: "cp", titulo: "Corpos de prova", rotulo: "CP", iniciais: 12, min: 1, usar: true,
        dica: "uma coluna por CP (três por nível de tensão); desmarque \"usar\" para tirar um CP da regressão",
        linhas: [
          { k: "id", r: "Identificação do CP", texto: true },
          { k: "d", r: "Diâmetro d (5.2: 100 mm)", u: u },
          { k: "t", r: "Altura (espessura) t (5.2: 50 a 70 mm)", u: u },
          { k: "m", r: "Massa (5.2)", u: "g" },
          { k: "nivel", r: "Nível de tensão pretendido (% de σr)", u: "%" },
          { k: "f", r: "Carga aplicada F — opcional", u: P.carga || "N", ph: "de σt" },
          { k: "n", r: "Número de ciclos até a ruptura — N", u: "ciclos" },
          { calc: "F", r: "Carga aplicada F", u: "N", casas: 0 },
          { calc: "st", r: "σt = 2F/(π·d·t) (eq. 2)", u: "MPa", casas: 3 },
          { calc: "rf", r: "%RF = σt/σr", u: "%", casas: 1, destaque: true },
          { calc: "logN", r: "log N", u: "", casas: 3 },
          { calc: "nPrev", r: "N do modelo (eq. 1)", u: "ciclos", casas: 0 },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fd = P.unidade === "cm" ? 10 : 1, fc = P.carga === "kgf" ? G : P.carga === "kN" ? 1000 : 1;
      var rt = num(P.rt), dims = [], nivF = [], semSig = [], massas = [];
      var cps = (d.cp || []).map(function (x, i) {
        var rot = "CP " + (x.id || i + 1), o = { usar: x.usar !== false };
        var dd = num(x.d) * fd, t = num(x.t) * fd, niv = num(x.nivel), F = num(x.f) * fc, N = num(x.n), m = num(x.m);
        if (ok(t) && (t < 50 || t > 70)) dims.push(rot + ": t = " + fmt(t, 1) + " mm");
        if (ok(dd) && Math.abs(dd - 100) > 5) dims.push(rot + ": d = " + fmt(dd, 1) + " mm");
        if (ok(m)) massas.push(m);
        if (ok(F) && ok(t) && ok(dd)) o.st = 2 * F / (Math.PI * dd * t);
        else if (ok(niv) && ok(rt)) { o.st = niv / 100 * rt; if (ok(t) && ok(dd)) F = o.st * Math.PI * dd * t / 2; }
        else o.st = NaN;
        o.F = F; o.N = N;
        o.rf = ok(o.st) && ok(rt) && rt > 0 ? o.st / rt * 100 : NaN;
        o.nivel = ok(niv) ? niv : o.rf;
        o.logN = ok(N) && N > 0 ? Math.log10(N) : NaN;
        if (ok(o.rf) && (o.rf < 50 - 0.05 || o.rf > 90 + 0.05)) nivF.push(rot + " (" + fmt(o.rf, 1) + " %)");
        if (!ok(o.st) && ok(N)) semSig.push(rot);
        return o;
      });
      if (!ok(rt)) avisos.push("Informe a resistência à tração estática média σr — ou importe um ensaio da DNIT 136 (6 a).");
      if (dims.length) avisos.push("Dimensões fora do especificado (5.2: altura de 50 a 70 mm, diâmetro de 100 mm): " + dims.join("; ") + ".");
      if (nivF.length) avisos.push("Tensão fora da faixa de 50 % a 90 % de σr (6 b, e): " + nivF.join("; ") + ".");
      if (semSig.length) avisos.push("Sem tensão: informe a carga aplicada ou o nível e σr — " + semSig.join(", ") + ".");
      if (massas.length > 1) {
        var mm = media(massas), dvm = Math.max.apply(null, massas.map(function (v) { return Math.abs(v - mm) / mm * 100; }));
        if (dvm > 2) avisos.push("Massas dos CPs com afastamento de até " + fmt(dvm, 1) + " % da média — a norma pede valores próximos para manter a representatividade (5.2; sem limite numérico).");
      }
      var us = cps.filter(function (o) { return o.usar && ok(o.logN) && ok(o.rf); });
      var niveis = {};
      us.forEach(function (o) { var k = fmt(o.nivel, 1); niveis[k] = (niveis[k] || 0) + 1; });
      var nNiv = Object.keys(niveis).length, poucos = Object.keys(niveis).filter(function (k) { return niveis[k] < 3; });
      if (us.length < 12 || nNiv < 4) avisos.push("O resultado deve basear-se em pelo menos 12 CPs e 4 níveis de tensão (8); há " + us.length + " CP(s) em " + nNiv + " nível(is).");
      if (poucos.length) avisos.push("Devem ser ensaiados três CPs por nível de tensão (6 e): nível(is) " + poucos.map(function (k) { return k + " % (" + niveis[k] + ")"; }).join(", ") + ".");
      var escala = P.rf === "fracao" ? 0.01 : 1;
      var g = regLin(us.map(function (o) { return o.rf * escala; }), us.map(function (o) { return o.logN; }));
      var r = { n: us.length, niveis: nNiv, rt: rt, escala: P.rf === "fracao" ? "fracao" : "pct",
        K1: g ? g.a : NaN, K2: g ? g.b : NaN, r2: g ? g.r2 : NaN,
        pontos: us.map(function (o) { return { rf: o.rf, N: o.N }; }) };
      cps.forEach(function (o) { o.nPrev = g && ok(o.rf) ? Math.pow(10, g.a + g.b * o.rf * escala) : NaN; });
      if (g && g.b >= 0) avisos.push("K2 ≥ 0: a vida de fadiga não diminui com a tensão — confira os dados.");
      if (ok(r.r2) && r.r2 < 0.8) avisos.push("R² = " + fmt(r.r2, 3) + " < 0,8 — aumente o número de corpos de prova ensaiados para melhorar o ajuste (7).");
      return { tab: { cp: cps }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var eq = ok(r.K1) ? "Nfad = 10^(" + fmt(r.K1, 3) + " " + (r.K2 < 0 ? "− " : "+ ") + fmt(Math.abs(r.K2), r.escala === "fracao" ? 3 : 5) + " · %RF)" : "—";
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + eq + '</div><div class="fe-res-r">Modelo de fadiga (eq. 1) — %RF em ' +
        (r.escala === "fracao" ? "fração" : "porcentagem") + " · K1 = " + fmt(r.K1, 4) + " · K2 = " + fmt(r.K2, r.escala === "fracao" ? 4 : 6) + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.r2) ? "R² = " + fmt(r.r2, 3) : "—") + '</div><div class="fe-res-r">' + r.n + " CPs, " + r.niveis + " níveis · mínimo 0,8" +
        (ok(r.r2) ? (r.r2 >= 0.8 ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') : "") + "</div></div></div>";
    },
    graficos: function (calc, d, opt) {
      var r = calc.resultados, pts = r.pontos, series = [{ pts: pts.map(function (p) { return [p.rf, p.N]; }), cor: CORES[0], rot: "CPs ensaiados" }];
      if (ok(r.K1) && pts.length > 1) {
        var xs = pts.map(function (p) { return p.rf; }), a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), L = [], esc100 = r.escala === "fracao" ? 0.01 : 1;
        for (var i = 0; i <= 20; i++) { var x = a + (b - a) * i / 20; L.push([x, Math.pow(10, r.K1 + r.K2 * x * esc100)]); }
        series.push({ pts: L, cor: CORES[1], linha: true, marca: false, rot: "Nfad = 10^(K1 + K2·%RF) · R² = " + fmt(r.r2, 3) });
      }
      return [grafXY({ opt: opt, logY: true, xl: "Relação de tensões σt/σr (%)", yl: "Número de ciclos até a ruptura, N", series: series, leg: "dir",
        vazio: "A curva de fadiga aparece com σt e N de pelo menos dois CPs." })];
    },
    relatorio: {
      parametros: [["Carregamento", "Tensão controlada; pulso de 0,1 s + repouso de 0,9 s (1 Hz); critério: ruptura completa do CP (3.3)"]],
      notas: "σt = 2F/(π·d·t) (eq. 2), F em N e d, t em mm → MPa; sem a carga, σt = nível × σr. %RF = σt/σr. Nfad = 10^(K1 + K2·%RF) (eq. 1): regressão linear por mínimos quadrados de log N sobre %RF com os CPs considerados; R² da regressão (log N). A norma diz que %RF é uma razão \"expressa em MPa\" (seção 7), o que não se aplica a uma razão adimensional; a escala de %RF (porcentagem ou fração) está indicada no resultado. Mínimo de 12 CPs e 4 níveis (8); R² < 0,8 exige mais CPs (7).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material + (P.cura ? " — cura de " + P.cura + " dias" : "")]);
        rows.push(["Modelo de fadiga (eq. 1), %RF em " + (r.escala === "fracao" ? "fração" : "porcentagem"), ok(r.K1) ? "K1 = " + fmt(r.K1, 4) + "; K2 = " + fmt(r.K2, r.escala === "fracao" ? 4 : 6) : "—"]);
        rows.push(["Coeficiente de determinação R²", fmt(r.r2, 4) + (ok(r.r2) ? (r.r2 >= 0.8 ? " (≥ 0,8)" : " — ABAIXO DE 0,8: ensaiar mais CPs") : "")]);
        rows.push(["Corpos de prova / níveis de tensão na regressão", r.n + " / " + r.niveis]);
        if (ok(r.rt)) rows.push(["Resistência à tração estática σr (DNIT 136)", fmt(r.rt, 3) + " MPa" + (P.rtRegistro ? " — " + P.rtRegistro : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "BGTC 4 % — 12 CPs em 4 níveis (55/65/75/85 %), cargas em N", dados: function () {
        // valores-alvo: σr = 0,85 MPa; log N = 10,45 − 0,09·%RF (N ≈ 316 mil a 55 % e 630 a 85 %), com dispersão de ± 0,15 em log N
        var L = [["B1", 55, 0.10, 64.8, 2398], ["B2", 55, -0.12, 65.3, 2410], ["B3", 55, 0.04, 64.1, 2385], ["B4", 65, -0.08, 65.0, 2402],
          ["B5", 65, 0.13, 64.6, 2391], ["B6", 65, -0.02, 65.4, 2415], ["B7", 75, 0.07, 64.9, 2399], ["B8", 75, -0.14, 65.1, 2405],
          ["B9", 75, 0.02, 64.4, 2388], ["B10", 85, -0.05, 65.2, 2408], ["B11", 85, 0.11, 64.7, 2394], ["B12", 85, -0.10, 65.0, 2401]];
        return { ident: { registro: "EX-FQ-001", obra: "Obra A", camada: "Base — BGTC 4 % de cimento", origem: "Pedreira X" },
          params: { material: "BGTC, 4 % de cimento Portland", cura: "28", rt: "0,85", rtRegistro: "EX-RT (valor informado)", rf: "pct", unidade: "mm", carga: "N" },
          cp: L.map(function (x) {
            var F = x[1] / 100 * 0.85 * Math.PI * 100.1 * x[3] / 2, N = Math.pow(10, 10.45 - 0.09 * x[1] + x[2]);
            return { usar: true, id: x[0], d: "100,1", t: fmt(x[3], 1), m: String(x[4]), nivel: String(x[1]), f: String(Math.round(F)), n: String(Math.round(N)) };
          }) };
      } },
      { nome: "Solo-cimento — 8 CPs em 3 níveis, um nível abaixo de 50 % e R² baixo", dados: function () {
        // valores-alvo: σr = 0,42 MPa; níveis 45/60/80 %; log N = 9,2 − 0,075·%RF com dispersão grande; CP S5 com 72 mm de altura
        var L = [["S1", 45, -0.85, 60.2], ["S2", 45, -0.70, 59.8], ["S3", 45, 0.10, 61.0], ["S4", 60, -0.55, 60.5], ["S5", 60, 0.50, 72.0],
          ["S6", 80, 0.75, 60.1], ["S7", 80, 0.40, 59.6], ["S8", 80, 0.05, 60.8]];
        return { ident: { registro: "EX-FQ-002", obra: "Obra C", camada: "Sub-base — solo-cimento 7 %", origem: "Jazida 2" },
          params: { material: "Solo-cimento, 7 % de cimento", cura: "7", rt: "0,42", rf: "fracao", unidade: "cm", carga: "kgf" },
          cp: L.map(function (x) {
            var F = x[1] / 100 * 0.42 * Math.PI * 100.0 * x[3] / 2 / G, N = Math.pow(10, 9.2 - 0.075 * x[1] + x[2]);
            return { usar: true, id: x[0], d: "10,00", t: fmt(x[3] / 10, 2), nivel: String(x[1]), f: fmt(F, 1), n: String(Math.round(N)) };
          }) };
      } },
    ],
  };
})();
