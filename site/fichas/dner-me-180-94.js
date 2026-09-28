/*
 * Ficha: DNER-ME 180/94 — Solos estabilizados com cinza volante e cal hidratada — Resistência à compressão simples.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media, parabola = FE.parabola;
  var G = 9.80665;

  var IDADES = [7, 14, 28];  // 6.6.3: no mínimo três tempos de cura
  var ENERGIAS = { normal: { nome: "Normal — 0,59 MN·m/m³, 9 golpes por camada", n: 9 },
    intermediaria: { nome: "Intermediária — 1,29 MN·m/m³, 20 golpes por camada", n: 20 },
    modificada: { nome: "Modificada — 2,69 MN·m/m³, 41 golpes por camada", n: 41 } };
  var CARGAS = [["kN", "kN"], ["N", "N"], ["kgf", "kgf (1 kgf = 9,80665 N)"], ["tf", "tf (1 tf = 9,80665 kN)"]];
  var FATOR = { N: 1, kN: 1000, kgf: G, tf: 1000 * G };
  var VOL_PADRAO = Math.PI * 5 * 5 * 20;  // molde Ø 10,0 cm × 20,0 cm (5 m) = 1 570,8 cm³
  var AMOSTRAS_U = [["u1", "Início da 1ª camada"], ["u2", "Início da 2ª camada"], ["u3", "Final da última camada"]];

  // linhas de umidade do bloco (DNIT 456) sem o nº do recipiente
  function linhasUmidade(pref, rot) {
    return FE.BLOCOS.umidade.linhas(pref, rot, "lab").filter(function (l) { return l.k !== pref + "n"; })
      .map(function (l) { return l.calc ? { calc: l.calc, r: rot + " — teor de umidade (6.4.2)", u: "%", casas: 2 } : l; });
  }

  // ajuste parabólico e máximo; se a curva não tiver máximo dentro do intervalo ensaiado, usa o maior ponto
  function maximo(pts) {
    var us = pts.filter(function (p) { return p.usar && ok(p.x) && ok(p.y); });
    if (us.length < 3) return { ajuste: null, x: NaN, y: NaN, modo: "" };
    var fit = parabola(us.map(function (p) { return p.x; }), us.map(function (p) { return p.y; }));
    var xs = us.map(function (p) { return p.x; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    if (fit && fit.a < 0) {
      var xv = -fit.b / (2 * fit.a);
      if (xv >= x0 && xv <= x1) return { ajuste: fit, x: xv, y: fit.a * xv * xv + fit.b * xv + fit.c, modo: "curva" };
    }
    var best = us.reduce(function (a, b) { return b.y > a.y ? b : a; });
    return { ajuste: fit && fit.a < 0 ? fit : null, x: best.x, y: best.y, modo: "ponto" };
  }
  function naCurva(fit, x) { return fit && ok(x) ? fit.a * x * x + fit.b * x + fit.c : NaN; }

  function grafico(series, opt, rotX, rotY, casasY, marcas) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 300, m = { l: 56, r: 16, t: 16, b: 42 };
    var todos = [];
    series.forEach(function (s) { s.pts.forEach(function (p) { if (ok(p.x) && ok(p.y)) todos.push(p); }); });
    if (!todos.length) return '<div class="fe-graf-vazio">O gráfico aparece quando houver pontos completos.</div>';
    var xs = todos.map(function (p) { return p.x; }), ys = todos.map(function (p) { return p.y; });
    series.forEach(function (s) { if (ok(s.max && s.max.y)) ys.push(s.max.y); });
    var x0 = Math.floor(Math.min.apply(null, xs) - 0.5), x1 = Math.ceil(Math.max.apply(null, xs) + 0.5);
    var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys), pad = Math.max((yMax - yMin) * 0.15, casasY === 3 ? 0.01 : 0.2);
    var y0 = opt.zeroY ? 0 : yMin - pad, y1 = yMax + pad;
    var passoY = casasY === 3 ? ((y1 - y0) > 0.2 ? 0.05 : (y1 - y0) > 0.08 ? 0.02 : 0.01) : ((y1 - y0) > 12 ? 2 : 1);
    y0 = Math.floor(y0 / passoY) * passoY; y1 = Math.ceil(y1 / passoY) * passoY;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222" } : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)" };
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    for (var gx = x0; gx <= x1; gx++) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
    }
    for (var gy = y0; gy <= y1 + 1e-9; gy += passoY) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + fmt(gy, casasY === 3 ? 3 : 0) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">' + esc(rotX) + "</text>" +
      '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">' + esc(rotY) + "</text>";
    series.forEach(function (se, k) {
      var c = opt.imprimir ? se.corP : se.cor, us = se.pts.filter(function (p) { return p.usar && ok(p.x) && ok(p.y); });
      if (se.max && se.max.ajuste && us.length) {
        var a = Math.min.apply(null, us.map(function (p) { return p.x; })) - 0.3, b = Math.max.apply(null, us.map(function (p) { return p.x; })) + 0.3, dc = "";
        for (var x = a; x <= b + 1e-9; x += (b - a) / 60) {
          var y = naCurva(se.max.ajuste, x);
          if (y >= y0 && y <= y1) dc += (dc ? " L" : "M") + X(x).toFixed(1) + " " + Y(y).toFixed(1);
        }
        if (dc) s += '<path d="' + dc + '" fill="none" stroke="' + c + '" stroke-width="1.8"/>';
      }
      se.pts.forEach(function (p) {
        if (!ok(p.x) || !ok(p.y)) return;
        var f = p.usar ? c : "none";
        s += se.marca === "tri" ? '<path d="M' + X(p.x) + " " + (Y(p.y) - 5) + " l5 9 l-10 0 z" + '" fill="' + f + '" stroke="' + c + '" stroke-width="1.4"/>'
          : se.marca === "qua" ? '<rect x="' + (X(p.x) - 4) + '" y="' + (Y(p.y) - 4) + '" width="8" height="8" fill="' + f + '" stroke="' + c + '" stroke-width="1.4"/>'
          : '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.2" fill="' + f + '" stroke="' + c + '" stroke-width="1.4"/>';
      });
      if (se.max && ok(se.max.y)) {
        s += '<line x1="' + X(se.max.x) + '" y1="' + Y(se.max.y) + '" x2="' + X(se.max.x) + '" y2="' + (H - m.b) + '" stroke="' + c + '" stroke-dasharray="3 3"/>' +
          '<text x="' + (X(se.max.x) + 6) + '" y="' + (Y(se.max.y) - 6) + '" fill="' + c + '" font-weight="bold">' + esc(se.rotMax || "") + "</text>";
      }
      if (se.nome) s += '<text x="' + (W - m.r - 8) + '" y="' + (m.t + 14 + 14 * k) + '" text-anchor="end" fill="' + c + '">' + esc(se.nome) + "</text>";
    });
    return s + "</svg>";
  }

  FE.FICHAS["dner-me-180-94"] = {
    titulo: "Solo–cinza volante–cal — Resistência à compressão simples",
    resumo: "Solo estabilizado com cinza volante e cal hidratada (fração < 25,4 mm), compactado em molde Ø 10 × 20 cm (5 camadas) em ao menos 5 umidades; curva de compactação e curvas de Rcs × umidade aos 7, 14 e 28 dias (cura em saco plástico + 24 h de imersão). Cada Rcs é a média de 3 CPs, excluído o que variar mais de 10 % da média; aproximação de 0,1 MPa.",
    blocos: ["umidade"],
    params: [
      { k: "mistura", r: "Mistura (A.1)", ph: "ex.: 13 % cinza, 4 % cal, 53 % solo A-3, 30 % brita; + 1 % cimento" },
      { k: "energia", r: "Energia de compactação (6.5.1)", tipo: "select", opcoes: Object.keys(ENERGIAS).map(function (k) { return [k, ENERGIAS[k].nome]; }) },
      { k: "volume", r: "Volume do molde (V, cm³)", ph: fmt(VOL_PADRAO, 1), dica: "molde tripartido Ø 10,0 cm × 20,0 cm (5 m)" },
      { k: "diametro", r: "Diâmetro nominal dos CPs (mm)", ph: "100", dica: "usado quando o diâmetro médio do ponto não for informado" },
      { k: "unidade", r: "Unidade da carga lida", tipo: "select", recarrega: true, opcoes: CARGAS },
      { k: "taxa", r: "Velocidade de carregamento (MPa/s) — opcional", ph: "0,5", dica: "0,3 a 0,8 MPa/s (5 p; 7.1)" },
    ],
    padrao: { energia: "modificada", unidade: "kN" },
    tabelas: function (d) {
      var P = d.params || {}, u = P.unidade || "kN";
      var linhas = [{ grupo: "Teor de umidade da mistura (6.4) — bloco Teor de umidade" }];
      AMOSTRAS_U.forEach(function (a) { linhas = linhas.concat(linhasUmidade(a[0], a[1])); });
      linhas.push({ calc: "h", r: "Teor de umidade médio (h)", u: "%", casas: 2, destaque: true },
        { grupo: "Compactação (6.5) — média dos CPs moldados no ponto" },
        { k: "mc", r: "Massa do cilindro", u: "g" },
        { k: "mt", r: "Cilindro + mistura compactada rasada", u: "g" },
        { calc: "mu", r: "Massa da mistura úmida (m's)", u: "g", casas: 0 },
        { calc: "gs", r: "ms = 100·m's / ((100 + h)·V) (6.5.5)", u: "g/cm³", casas: 3, destaque: true },
        { grupo: "Ruptura (7) — 3 CPs por idade, após 24 h de imersão" },
        { k: "dcp", r: "Diâmetro médio dos CPs (duas leituras, ± 1 mm)", u: "mm", ph: P.diametro || "100" });
      IDADES.forEach(function (i) {
        linhas.push({ grupo: "Cura de " + i + " dias" });
        [1, 2, 3].forEach(function (c) { linhas.push({ k: "q" + i + "_" + c, r: i + " d — carga de ruptura, CP " + c, u: u }); });
        linhas.push({ calc: "n" + i, r: i + " d — CPs considerados (± 10 %, 7.2)", u: "", casas: 0 },
          { calc: "r" + i, r: "Rcs " + i + " d — média (7.2; 7.3)", u: "MPa", casas: 1, destaque: true });
      });
      return [{ chave: "pontos", titulo: "Pontos (umidades)", rotulo: "Ponto", iniciais: 5, min: 3, usar: true, linhas: linhas,
        dica: "uma coluna por umidade; desmarque \"usar\" para tirar um ponto do ajuste das curvas" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fat = FATOR[P.unidade] || 1000;
      var V = ok(num(P.volume)) ? num(P.volume) : VOL_PADRAO, dNom = ok(num(P.diametro)) ? num(P.diametro) : 100;
      var pontos = (d.pontos || []).map(function (p, i) {
        var rot = "Ponto " + (i + 1), o = { usar: p.usar !== false };
        var ws = [];
        AMOSTRAS_U.forEach(function (a) {
          var w = FE.BLOCOS.umidade.calcular(p, a[0], "lab").w;
          o[a[0] + "W"] = w;
          if (ok(w)) ws.push(w);
        });
        o.h = ws.length ? media(ws) : NaN;
        if (ws.length && ws.length < 3) avisos.push(rot + ": " + ws.length + " amostra(s) de umidade — retiram-se três (início da 1ª e da 2ª camadas e final da última, 6.4.1).");
        if (ws.length > 1 && Math.max.apply(null, ws) - Math.min.apply(null, ws) > 1) avisos.push(rot + ": as amostras de umidade diferem mais de 1 ponto percentual — confira as pesagens.");
        o.mu = num(p.mt) - num(p.mc);
        o.gs = ok(o.mu) && o.mu > 0 && ok(o.h) ? 100 * o.mu / ((100 + o.h) * V) : NaN;
        var dcp = ok(num(p.dcp)) ? num(p.dcp) : dNom, A = Math.PI * dcp * dcp / 4;  // mm²
        IDADES.forEach(function (id) {
          var rs = [1, 2, 3].map(function (c) { var q = num(p["q" + id + "_" + c]); return ok(q) ? q * fat / A : NaN; }).filter(ok);
          if (!rs.length) return;
          var m = media(rs), fica = rs.filter(function (r) { return Math.abs(r - m) / m <= 0.10 + 1e-12; });
          o["n" + id] = fica.length;
          o["r" + id] = fica.length ? media(fica) : NaN;
          o["i" + id] = rs;
          if (rs.length < 3) avisos.push(rot + ", " + id + " dias: " + rs.length + " CP(s) — cada resistência é a média de 3 CPs (7.2).");
          if (fica.length < rs.length) avisos.push(rot + ", " + id + " dias: excluído(s) " + (rs.length - fica.length) + " CP(s) com variação superior a 10 % da média dos três (" +
            rs.map(function (r) { return fmt(r, 2); }).join("; ") + " MPa; média " + fmt(m, 2) + ") — Rcs = " + fmt(o["r" + id], 1) + " MPa com " + fica.length + " CP(s) (7.2).");
          if (fica.length === 1 && rs.length === 3) avisos.push(rot + ", " + id + " dias: restou um único CP — resultados muito dispersos; considere repetir o ponto.");
        });
        return o;
      });
      var val = pontos.filter(function (o) { return ok(o.h) && ok(o.gs); });
      if (val.length < 5) avisos.push("Aconselha-se no mínimo 5 pontos na curva de compactação (3 no ramo seco e 2 no úmido, 6.5.2); há " + val.length + ".");
      // curva de compactação
      var comp = maximo(pontos.map(function (o) { return { x: o.h, y: o.gs, usar: o.usar }; }));
      if (comp.modo === "ponto") avisos.push("A curva de compactação ajustada não tem máximo dentro das umidades ensaiadas: adotado o maior ponto — ensaie mais umidades no ramo " + (comp.x <= Math.min.apply(null, val.map(function (o) { return o.h; })) + 1e-9 ? "seco" : "úmido") + ".");
      if (ok(comp.x)) {
        var us = val.filter(function (o) { return o.usar; }), secos = us.filter(function (o) { return o.h < comp.x; }).length, umidos = us.length - secos;
        if (secos < 3 || umidos < 2) avisos.push("Recomendam-se 3 pontos no ramo seco e 2 no úmido (6.5.2); há " + secos + " no seco e " + umidos + " no úmido.");
      }
      // curvas de resistência
      var rcs = {};
      IDADES.forEach(function (id) {
        var pts = pontos.map(function (o) { return { x: o.h, y: o["r" + id], usar: o.usar }; });
        var n = pts.filter(function (p) { return ok(p.x) && ok(p.y); }).length;
        if (!n) return;
        var mx = maximo(pts);
        rcs[id] = { max: mx, n: n, naOtima: naCurva(mx.ajuste, comp.x) };
        if (n < 3) avisos.push("Rcs aos " + id + " dias: " + n + " ponto(s) — são necessários ao menos 3 para traçar a curva (8.1).");
        else if (mx.modo === "ponto") avisos.push("Curva de Rcs aos " + id + " dias sem máximo dentro das umidades ensaiadas: adotado o maior valor medido (" + fmt(mx.y, 1) + " MPa).");
      });
      var faltam = IDADES.filter(function (id) { return !rcs[id]; });
      if (faltam.length && faltam.length < 3) avisos.push("Sem resultados aos " + faltam.join(" e ") + " dias — adotam-se no mínimo três tempos de cura: 7, 14 e 28 dias (6.6.3).");
      var taxa = num(P.taxa);
      if (ok(taxa) && (taxa < 0.3 || taxa > 0.8)) avisos.push("Velocidade de carregamento de " + fmt(taxa, 2) + " MPa/s fora de 0,3 a 0,8 MPa/s (7.1).");
      return { tab: { pontos: pontos }, pontos: pontos, resultados: { gsMax: comp.y, hOt: comp.x, comp: comp, rcs: rcs }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = cx(fmt(r.gsMax, 3) + " <small>g/cm³</small>", "Massa específica aparente seca máxima (6.5.4)") + cx(fmt(r.hOt, 1) + " <small>%</small>", "Umidade ótima");
      IDADES.forEach(function (id) {
        var x = r.rcs[id];
        if (!x) return;
        h += cx(fmt(x.max.y, 1) + " <small>MPa</small>", "Rcs máx. aos " + id + " dias (8.2) — em h = " + fmt(x.max.x, 1) + " %" + (ok(x.naOtima) ? "; na umidade ótima: " + fmt(x.naOtima, 1) + " MPa" : ""));
      });
      return '<div class="fe-res">' + h + "</div>";
    },
    graficos: function (calc, d, opt) {
      var r = calc.resultados, pts = calc.pontos;
      var g1 = grafico([{ pts: pts.map(function (o) { return { x: o.h, y: o.gs, usar: o.usar }; }), max: r.comp, cor: "#4f8cff", corP: "#1f5fbf",
        rotMax: ok(r.gsMax) ? fmt(r.gsMax, 3) + " g/cm³ · " + fmt(r.hOt, 1) + " %" : "" }], opt, "Teor de umidade h (%)", "ms (g/cm³)", 3);
      var cores = { 7: ["#4f8cff", "#1f5fbf", "circ"], 14: ["#e0a13a", "#c0392b", "tri"], 28: ["#3ecf8e", "#2e7d32", "qua"] };
      var ser = IDADES.filter(function (id) { return r.rcs[id]; }).map(function (id) {
        return { pts: pts.map(function (o) { return { x: o.h, y: o["r" + id], usar: o.usar }; }), max: r.rcs[id].max, cor: cores[id][0], corP: cores[id][1], marca: cores[id][2],
          nome: id + " dias", rotMax: fmt(r.rcs[id].max.y, 1) };
      });
      var o2 = Object.assign({}, opt || {}, { zeroY: true });
      return [g1].concat(ser.length ? [grafico(ser, o2, "Teor de umidade h (%)", "Rcs (MPa)", 1)] : []);
    },
    relatorio: {
      notas: "h = (Ph − Ps) / Ps × 100, média de três amostras (6.4); ms = 100·m's / ((100 + h)·V), com m's = massa da mistura úmida compactada (6.5.5). Rcs = carga de ruptura / área da seção, média de 3 CPs por umidade e idade, excluído o resultado que variar mais de 10 % da média dos três; aproximação de 0,1 MPa (7.2 e 7.3). Máximos das curvas (6.5.4 e 8.2) por ajuste parabólico (mínimos quadrados) dos pontos marcados; sem máximo dentro das umidades ensaiadas, adota-se o maior ponto. Golpes por camada n = E·V / (9,8·P·H·Nc): 9 (normal), 20 (intermediária), 41 (modificada), soquete de 4,536 kg, queda de 45,72 cm, 5 camadas.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        rows.push(["Massa específica aparente seca máxima / umidade ótima", fmt(r.gsMax, 3) + " g/cm³ / " + fmt(r.hOt, 1) + " %" + (r.comp.modo === "ponto" ? " (maior ponto)" : "")]);
        IDADES.forEach(function (id) {
          var x = r.rcs[id];
          if (x) rows.push(["Rcs máxima aos " + id + " dias", fmt(x.max.y, 1) + " MPa em h = " + fmt(x.max.x, 1) + " %" + (x.max.modo === "ponto" ? " (maior valor medido)" : "") +
            (ok(x.naOtima) ? " — na umidade ótima: " + fmt(x.naOtima, 1) + " MPa" : "")]);
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo do Anexo da norma — solo A-3 + brita, cinza 13 %, cal 4 %, energia modificada", dados: function () {
        // Anexo informativo, Tabela 2 (p. 10): h, ms e Rcs 7/14/28 d dos 6 pontos; massas e cargas geradas a partir desses valores
        // (molde Ø 10 × 20 cm, cilindro de 4 250 g, três CPs por idade a 0,98 / 1,00 / 1,02 do valor tabelado).
        var tab = [[4.02, 2.128, 3.86, 6.00, 8.04], [5.06, 2.146, 3.92, 6.21, 8.84], [5.96, 2.152, 3.01, 5.32, 9.29],
          [7.05, 2.127, 2.17, 3.76, 7.12], [8.11, 2.099, 1.52, 3.05, 5.59], [9.05, 2.080, NaN, NaN, NaN]];
        var A = Math.PI * 100 * 100 / 4;
        var pontos = tab.map(function (t) {
          var p = { usar: true, mc: "4250", mt: String(Math.round(4250 + t[1] * (100 + t[0]) / 100 * VOL_PADRAO)) };
          AMOSTRAS_U.forEach(function (a) { p[a[0] + "t"] = "30,00"; p[a[0] + "s"] = "230,00"; p[a[0] + "u"] = fmt(230 + 200 * t[0] / 100, 2); });
          IDADES.forEach(function (id, j) {
            if (!ok(t[2 + j])) return;
            [0.98, 1, 1.02].forEach(function (f, c) { p["q" + id + "_" + (c + 1)] = fmt(t[2 + j] * f * A / 1000, 2); });
          });
          return p;
        });
        return { ident: { registro: "EX-RCS-001", camada: "Base — solo-cinza-cal (exemplo da norma)", origem: "DNER-ME 180/94, Anexo" },
          params: { mistura: "13 % cinza volante, 4 % cal hidratada, 53 % solo arenoso A-3, 30 % brita 9,5–19 mm; + 1 % de cimento", energia: "modificada", diametro: "100", unidade: "kN", taxa: "0,5" },
          pontos: pontos };
      } },
      { nome: "Solo argiloso + 20 % cinza + 5 % cal — energia intermediária, 5 pontos", dados: function () {
        // valores-alvo: h 14,5 / 16,4 / 18,3 / 20,1 / 22,0 %; ms 1,642 / 1,688 / 1,702 / 1,681 / 1,641 g/cm³
        var alvo = [[14.5, 1.642, [0.92, 1.35, 1.88]], [16.4, 1.688, [1.10, 1.62, 2.30]], [18.3, 1.702, [1.08, 1.66, 2.41]],
          [20.1, 1.681, [0.90, 1.41, 2.05]], [22.0, 1.641, [0.66, 1.05, 1.55]]];
        var A = Math.PI * 100 * 100 / 4, desvio = [[0.97, 1.01, 1.02], [1.03, 0.99, 0.98], [1.0, 0.96, 1.04]];
        var pontos = alvo.map(function (t, k) {
          var p = { usar: true, mc: "4180", mt: String(Math.round(4180 + t[1] * (100 + t[0]) / 100 * VOL_PADRAO)), dcp: "100" };
          AMOSTRAS_U.forEach(function (a, j) { var w = t[0] + (j - 1) * 0.1; p[a[0] + "t"] = "28,40"; p[a[0] + "s"] = "178,40"; p[a[0] + "u"] = fmt(178.4 + 150 * w / 100, 2); });
          IDADES.forEach(function (id, j) { desvio[k % 3].forEach(function (f, c) { p["q" + id + "_" + (c + 1)] = fmt(t[2][j] * f * A / 1000, 2); }); });
          return p;
        });
        return { ident: { registro: "EX-RCS-002", camada: "Sub-base — solo-cinza-cal", origem: "Jazida 3 + cinza da UTE" },
          params: { mistura: "75 % solo argiloso A-6, 20 % cinza volante, 5 % cal hidratada CH-I", energia: "intermediaria", diametro: "100", unidade: "kN", taxa: "0,4" },
          pontos: pontos };
      } },
      { nome: "Poucos pontos, CP disperso, só 7 dias e carregamento rápido", dados: function () {
        var A = Math.PI * 100 * 100 / 4;
        function pt(h, gs, rs) {
          var p = { usar: true, mc: "4250", mt: String(Math.round(4250 + gs * (100 + h) / 100 * VOL_PADRAO)) };
          [["u1", h], ["u2", h + 0.2]].forEach(function (a) { p[a[0] + "t"] = "30,00"; p[a[0] + "s"] = "230,00"; p[a[0] + "u"] = fmt(230 + 200 * a[1] / 100, 2); });
          rs.forEach(function (r, c) { p["q7_" + (c + 1)] = fmt(r * A / 1000, 2); });
          return p;
        }
        return { ident: { registro: "EX-RCS-003", camada: "Base — areia-cinza-cal (estudo preliminar)" },
          params: { mistura: "80 % areia, 15 % cinza volante, 5 % cal", energia: "modificada", diametro: "100", unidade: "kN", taxa: "1,2" },
          pontos: [pt(7.0, 1.880, [1.20, 1.25, 1.18]), pt(8.5, 1.915, [1.42, 1.10, 1.46]), pt(10.0, 1.940, [1.51, 1.48, 1.55]), pt(11.5, 1.958, [1.40, 1.38])] };
      } },
    ],
  };
})();
