/*
 * Ficha: DNER-ME 401/99 — Agregados — Índice de degradação de rochas após compactação Marshall,
 * com ligante (IDML) e sem ligante (IDM).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var nomePen = FE.granulometria.nomePeneira;

  // Tabela 2: peneiras e granulometria original (% passando), coerente com a Tabela 1
  var PEN = [19, 9.5, 4.8, 2, 0.42, 0.074];
  var ORIG = [85, 65, 50, 35, 20, 5];
  var MASSA_T1 = 1200, TOL_T1 = 60;  // 4.1 c: 1200 g ± 60 g por corpo de prova
  var T1 = [["25,4 mm – 19 mm", 15, 180], ["19 mm – 9,5 mm", 20, 240], ["9,5 mm – nº 4", 15, 180], ["nº 4 – nº 10", 15, 180],
    ["nº 10 – nº 40", 15, 180], ["nº 40 – nº 200", 15, 180], ["< nº 200", 5, 60]];
  // valores-tentativa citados nas especificações (DNIT 034/2005-ES e DNIT 112/2009-ES, nota sobre Los Angeles > 50 %)
  var TENTATIVA = { com: 5, sem: 8 };
  function ch(mm) { return String(mm).replace(".", "_"); }
  function sigla(P) { return P.tipo === "sem" ? "IDM" : "IDML"; }

  // % passando de um CP: massas retidas individuais com base na massa original dos agregados (4.3.1 b) ou % digitado
  function calcCP(x, P) {
    var o = { pass: [] };
    if (P.entrada === "pct") {
      PEN.forEach(function (mm) { o.pass.push(num(x["q" + ch(mm)])); });
      o.completa = o.pass.every(ok);
      return o;
    }
    var m0 = num(x.m0);
    if (!ok(m0)) m0 = num(P.massaBase);
    if (!ok(m0)) m0 = MASSA_T1;
    o.m0 = m0;
    var acum = 0, falta = false;
    PEN.forEach(function (mm) {
      var r = num(x["r" + ch(mm)]);
      if (!ok(r)) falta = true;
      acum += ok(r) ? r : 0;
      o.pass.push(falta || m0 <= 0 ? NaN : (m0 - acum) / m0 * 100);
    });
    var f = num(x.fundo);
    o.soma = falta ? NaN : acum + (ok(f) ? f : 0);
    o.perda = ok(o.soma) && ok(f) ? (m0 - o.soma) / m0 * 100 : NaN;
    o.completa = !falta;
    return o;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], S = sigla(P);
    var cps = (d.cp || []).map(function (x) { return calcCP(x, P); });
    var tab = cps.map(function (o) {
      var t = { soma: o.soma, perda: o.perda };
      PEN.forEach(function (mm, j) { t["p" + ch(mm)] = o.pass[j]; });
      return t;
    });
    var completos = cps.filter(function (o) { return o.completa; });
    var med = PEN.map(function (mm, j) { return media(completos.map(function (o) { return o.pass[j]; })); });   // 4.3.1 d
    var D = med.map(function (m, j) { return ok(m) ? m - ORIG[j] : NaN; });                                    // 4.3.1 e
    var somaD = completos.length ? D.reduce(function (a, b) { return a + b; }, 0) : NaN;                       // 4.3.1 f
    var id = ok(somaD) ? somaD / 6 : NaN;                                                                       // 4.3.2

    cps.forEach(function (o, i) {
      var r = "CP " + (i + 1) + ": ";
      if (P.entrada !== "pct") {
        if (ok(o.m0) && Math.abs(o.m0 - MASSA_T1) > TOL_T1) avisos.push(r + "massa total das frações de " + fmt(o.m0, 0) + " g, fora de 1 200 g ± 60 g (4.1 c).");
        if (ok(o.soma) && o.soma > o.m0 * 1.001) avisos.push(r + "a soma das massas (" + fmt(o.soma, 0) + " g) supera a massa original dos agregados (" + fmt(o.m0, 0) + " g) — confira as pesagens.");
      } else {
        for (var j = 1; j < PEN.length; j++) {
          if (ok(o.pass[j]) && ok(o.pass[j - 1]) && o.pass[j] > o.pass[j - 1]) { avisos.push(r + "% passando cresce da peneira " + nomePen(PEN[j - 1]) + " para a " + nomePen(PEN[j]) + " — confira."); break; }
        }
        if (o.pass.some(function (v) { return ok(v) && (v < 0 || v > 100); })) avisos.push(r + "% passando fora do intervalo 0–100.");
      }
    });
    if (completos.length && completos.length < 3) avisos.push("Devem ser moldados três corpos de prova (4.1 d); há " + completos.length + " completo(s).");
    D.forEach(function (v, j) {
      if (ok(v) && v < -0.5) avisos.push("D negativo na peneira " + nomePen(PEN[j]) + " (" + fmt(v, 1) + "): após a compactação passa menos que na granulometria original — confira a preparação e o peneiramento.");
    });
    if (P.tipo !== "sem") {
      var teor = num(P.teor);
      if (ok(teor) && Math.abs(teor - 5) > 0.05) avisos.push("Teor de ligante de " + fmt(teor, 1) + " %: a norma manda acrescentar 5 % em peso de ligante (4.1 f).");
      var tA = num(P.tAgreg);
      if (ok(tA) && tA > 177) avisos.push("Temperatura dos agregados de " + fmt(tA, 0) + " °C: não deve ultrapassar 177 °C (4.1 f).");
    }
    var lim = num(P.limite);
    if (ok(id) && ok(lim) && id > lim) avisos.push(S + " = " + fmt(id, 1) + " %, acima do valor-tentativa/máximo de " + fmt(lim, 1) + " %.");
    return { tab: { cp: tab }, resultados: { id: id, sigla: S, somaD: somaD, media: med, D: D, amostras: cps.map(function (o) { return o.pass; }),
      n: completos.length, limite: lim, conforme: ok(id) && ok(lim) ? id <= lim : null }, avisos: avisos };
  }

  function tabela2(calc, relat) {
    var r = calc.resultados, n = r.amostras.length;
    var h = '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th>Peneira</th><th>Original</th>' +
      r.amostras.map(function (_, i) { return "<th>AM " + (i + 1) + "</th>"; }).join("") + "<th>Média</th><th>D</th></tr></thead><tbody>";
    PEN.forEach(function (mm, j) {
      h += "<tr><td>" + esc(nomePen(mm)) + "</td><td>" + ORIG[j] + "</td>" + r.amostras.map(function (a) { return "<td>" + fmt(a[j], 1) + "</td>"; }).join("") +
        "<td><b>" + fmt(r.media[j], 1) + "</b></td><td><b>" + fmt(r.D[j], 1) + "</b></td></tr>";
    });
    h += '<tr><td colspan="' + (n + 3) + '" style="text-align:right">ΣD</td><td><b>' + fmt(r.somaD, 1) + "</b></td></tr></tbody></table>";
    return h;
  }

  function grafico(calc, d, opt) {
    opt = opt || {};
    var r = calc.resultados;
    if (!r.media.some(ok)) return '<div class="fe-graf-vazio">As curvas aparecem com as massas retidas (ou % passando) de ao menos um corpo de prova.</div>';
    var W = opt.w || 560, H = opt.h || 300, m = { l: 46, r: 16, t: 14, b: 44 };
    var x0 = Math.log10(0.05), x1 = Math.log10(30);
    function X(mm) { return m.l + (Math.log10(mm) - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / 100 * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cor = imp ? "#1f5fbf" : "#4f8cff", corO = imp ? "#666" : "#9aa3b2";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    PEN.concat([25]).forEach(function (mm) {
      s += '<line x1="' + X(mm) + '" y1="' + m.t + '" x2="' + X(mm) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(mm) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + fmt(mm, mm < 1 ? 3 : mm < 10 ? 1 : 0).replace(/,?0+$/, "") + "</text>";
    });
    for (var v = 0; v <= 100; v += 10) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + v + "</text>";
    }
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Abertura da peneira (mm) — escala logarítmica</text>' +
      '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">% passando</text>';
    function linha(vals, extra) {
      var pts = [[25, 100]].concat(PEN.map(function (mm, j) { return [mm, vals[j]]; })).filter(function (p) { return ok(p[1]); });
      return '<path d="' + pts.map(function (p, k) { return (k ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ") + '" fill="none" ' + extra + "/>";
    }
    if (r.amostras.length > 1) r.amostras.forEach(function (a) { s += linha(a, 'stroke="' + txt + '" stroke-width="1" stroke-dasharray="2 3" opacity="0.6"'); });
    s += linha(ORIG, 'stroke="' + corO + '" stroke-width="1.8" stroke-dasharray="6 4"');
    s += linha(r.media, 'stroke="' + cor + '" stroke-width="2.2"');
    PEN.forEach(function (mm, j) { if (ok(r.media[j])) s += '<circle cx="' + X(mm) + '" cy="' + Y(r.media[j]) + '" r="3.2" fill="' + cor + '"/>'; });
    s += '<text x="' + (m.l + 8) + '" y="' + (m.t + 14) + '" fill="' + cor + '">— média após compactação</text>' +
      '<text x="' + (m.l + 8) + '" y="' + (m.t + 28) + '" fill="' + corO + '">- - granulometria original (Tabela 2)</text>';
    return s + "</svg>";
  }

  function massas(m0, pass, perda) {
    var o = { m0: String(m0) }, ant = 100;
    PEN.forEach(function (mm, j) { o["r" + ch(mm)] = String(Math.round((ant - pass[j]) / 100 * m0)); ant = pass[j]; });
    o.fundo = String(Math.round(ant / 100 * m0 - perda));
    return o;
  }

  FE.FICHAS["dner-me-401-99"] = {
    titulo: "Índice de degradação após compactação Marshall (IDML / IDM)",
    resumo: "Três corpos de prova de 1 200 g ± 60 g na granulometria padrão (Tabela 1), compactados com 50 golpes por face no molde Marshall, com 5 % de ligante (IDML, peneiramento após a extração) ou sem ligante (IDM); D = % passando médio − original; ID = ΣD / 6.",
    blocos: [],
    params: [
      { k: "tipo", r: "Ensaio", tipo: "select", recarrega: true,
        opcoes: [["com", "IDML — com ligante (seção 4)"], ["sem", "IDM — sem ligante (seção 5)"]] },
      { k: "material", r: "Rocha / agregado ensaiado", ph: "ex.: brita de basalto" },
      { k: "ligante", r: "Ligante (4.1 e)", ph: "ex.: CAP 50/70", se: function (d) { return (d.params || {}).tipo !== "sem"; } },
      { k: "teor", r: "Teor de ligante (% em peso, 4.1 f)", ph: "5", se: function (d) { return (d.params || {}).tipo !== "sem"; } },
      { k: "tAgreg", r: "Temperatura dos agregados (°C, 4.1 f)", dica: "≈ 28 °C acima da do ligante, sem ultrapassar 177 °C",
        se: function (d) { return (d.params || {}).tipo !== "sem"; } },
      { k: "tComp", r: "Temperatura de compactação (°C, 4.1 h)", dica: "ligante com viscosidade Saybolt-Furol de 140 ± 15 s",
        se: function (d) { return (d.params || {}).tipo !== "sem"; } },
      { k: "extracao", r: "Extração do ligante (4.2)", ph: "DNER-ME 053/94 (Rotarex)", se: function (d) { return (d.params || {}).tipo !== "sem"; } },
      { k: "entrada", r: "Entrada do peneiramento após compactação", tipo: "select", recarrega: true,
        opcoes: [["massas", "Massas retidas em cada peneira (g)"], ["pct", "% passando já calculado"]] },
      { k: "massaBase", r: "Massa original dos agregados — padrão das colunas (g)", ph: "1200",
        dica: "Tabela 1: 1 200 g ± 60 g (4.1 c); base do % passando (4.3.1 b)", se: function (d) { return (d.params || {}).entrada !== "pct"; } },
      { k: "limite", r: "ID máximo admitido (%) — opcional",
        dica: "valores-tentativa das especificações DNIT 034/2005-ES e 112/2009-ES: IDML = 5 %, IDM = 8 %" },
    ],
    padrao: { tipo: "com", entrada: "massas", teor: "5" },
    tabelas: function (d) {
      var P = d.params || {}, linhas;
      if (P.entrada === "pct") {
        linhas = [{ grupo: "Granulometria após compactação — % passando (Tabela 2)" }].concat(PEN.map(function (mm) {
          return { k: "q" + ch(mm), r: "Passando na " + nomePen(mm), u: "%" };
        }));
      } else {
        linhas = [{ grupo: "Corpo de prova (4.1 b–c)" },
          { k: "m0", r: "Massa original dos agregados — base do % passando", u: "g", padrao: "massaBase", padraoFixo: String(MASSA_T1) },
          { grupo: (P.tipo === "sem" ? "Peneiramento após compactação" : "Peneiramento dos agregados após a extração (4.3.1)") + " — massa retida em cada peneira (não acumulada)" }]
          .concat(PEN.map(function (mm) { return { k: "r" + ch(mm), r: "Retido na " + nomePen(mm), u: "g" }; }))
          .concat([{ k: "fundo", r: "Fundo (passa na nº 200)", u: "g" },
            { calc: "soma", r: "Soma das massas", u: "g", casas: 0 },
            { calc: "perda", r: "Diferença para a massa original (perda)", u: "%", casas: 2 },
            { grupo: "% passando (4.3.1 b–c) — base: massa original dos agregados" }])
          .concat(PEN.map(function (mm) { return { calc: "p" + ch(mm), r: "Passando na " + nomePen(mm), u: "%", casas: 1, destaque: mm === 0.074 }; }));
      }
      return [{ chave: "cp", titulo: "Corpos de prova (4.1 d; 4.3.1)", rotulo: "CP", iniciais: 3, min: 1,
        nomes: ["CP 1 (AM 1)", "CP 2 (AM 2)", "CP 3 (AM 3)", "CP 4", "CP 5"], linhas: linhas,
        dica: "três corpos de prova; o % passando usa a massa original dos agregados de cada CP" }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.id, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">' + r.sigla + " = ΣD / 6 — média de " + r.n + " CP(s)" +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.somaD, 1) + '</div><div class="fe-res-r">ΣD (4.3.1 f)</div></div></div>' + tabela2(calc, false);
    },
    grafico: grafico,
    relatorio: {
      notas: "Tabela 2: % passando de cada CP com base na massa original dos agregados (4.3.1 b), média por peneira, D = média − granulometria original (19 mm 85; 9,5 mm 65; nº 4 50; nº 10 35; nº 40 20; nº 200 5), ID = ΣD / 6 (4.3.2). Compactação com o soquete Marshall (4 540 g, queda de 45,72 cm), 50 golpes em cada face (4.1 j). IDML: 5 % de ligante e peneiramento após a extração (4.1 f; 4.2); IDM: mesmo procedimento sem aquecimento e sem ligante (seção 5). A norma não fixa arredondamento: ID com uma casa decimal.",
      parametros: [["Granulometria padrão (Tabela 1)", T1.map(function (q) { return q[0] + ": " + q[1] + " % (" + q[2] + " g)"; }).join("; ")]],
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push([r.sigla === "IDM" ? "Índice de degradação após compactação Marshall sem ligante (IDM)" : "Índice de degradação após compactação Marshall com ligante (IDML)",
          fmt(r.id, 1) + " % — ΣD = " + fmt(r.somaD, 1) + " (" + r.n + " CPs)" +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.limite, 1) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.limite, 1) + " %")]);
        return rows;
      },
      extraHtml: function (calc) { return "<h2>Tabela 2 — Cálculo do ID</h2>" + tabela2(calc, true); },
    },
    exemplos: [
      { nome: "IDML — brita de basalto com CAP (três CPs, atende a 5 %)", dados: function () {
        return { ident: { registro: "EX-IDML-001", obra: "Obra B", origem: "Pedreira Z", camada: "Agregado para concreto asfáltico" },
          params: { tipo: "com", material: "Brita de basalto", ligante: "CAP 50/70", teor: "5", tAgreg: "170", tComp: "145",
            extracao: "DNER-ME 053/94 (Rotarex)", entrada: "massas", massaBase: "1200", limite: String(TENTATIVA.com) },
          cp: [massas(1204, [87.4, 68.1, 53.5, 38.0, 22.4, 6.3], 3), massas(1197, [87.9, 68.6, 53.9, 38.3, 22.7, 6.5], 4),
            massas(1201, [87.1, 67.9, 53.2, 37.8, 22.2, 6.2], 2)] };
      } },
      { nome: "IDM — rocha alterada sem ligante (um CP fora de 1 200 ± 60 g, reprovado a 8 %)", dados: function () {
        return { ident: { registro: "EX-IDM-002", origem: "Pedreira Y", camada: "Agregado com Los Angeles > 50 %" },
          params: { tipo: "sem", material: "Granito alterado", entrada: "massas", massaBase: "1200", limite: String(TENTATIVA.sem) },
          cp: [massas(1198, [94.0, 78.2, 63.5, 47.1, 29.2, 10.4], 5), massas(1275, [94.6, 78.9, 64.0, 47.6, 29.8, 10.7], 6),
            massas(1203, [93.8, 77.9, 63.1, 46.8, 29.0, 10.2], 4)] };
      } },
    ],
  };
})();
