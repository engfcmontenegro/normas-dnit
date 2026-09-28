/*
 * Ficha: DNER-ME 058/94 — Microesferas de vidro — Granulometria.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js)
 * e o gráfico de FE.granulometria (DNIT 412, em site/fichas.js).
 *
 * 50 g de microesferas secas peneiradas na série especificada para o tipo; % passando em cada peneira =
 * (massa inicial − retidos acumulados) / massa inicial × 100 (6.1).
 * Faixas opcionais: DNER-EM 373/2000, Tabela 1 (tipos I A, I B, F, G) e DNER-EM 379/98, Tabela 1 (esferas de vidro).
 * As aberturas seguem a ME 058/94 (3 b) quando a peneira é a mesma (nº 20 = 0,850 mm, que a EM 373 escreve 840 µm;
 * nº 70 = 0,212 mm, 210 µm na EM 373); as demais, a abertura nominal ABNT/ASTM do número indicado na especificação.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // peneiras por número: abertura (mm) e se consta da aparelhagem da ME 058/94 (3 b)
  var PEN = {
    12: [1.7, false], 14: [1.4, false], 16: [1.18, false], 18: [1.0, false], 20: [0.85, true], 25: [0.71, false], 30: [0.6, true],
    50: [0.3, true], 70: [0.212, true], 80: [0.18, false], 100: [0.15, true], 200: [0.075, true], 230: [0.063, true],
  };
  var SERIE_058 = [20, 30, 50, 70, 100, 200, 230];
  // faixas (% passando): [nº, mín, máx]
  var FAIXAS = {
    IA: { rot: "Tipo I A — \"innermix\" (DNER-EM 373/2000, Tabela 1)", ref: "DNER-EM 373/2000, Tabela 1 — tipo I A",
      p: [[20, 100, 100], [30, 90, 100], [50, 18, 35], [100, 0, 10], [200, 0, 2]] },
    IB: { rot: "Tipo I B — \"premix\" (DNER-EM 373/2000, Tabela 1)", ref: "DNER-EM 373/2000, Tabela 1 — tipo I B",
      p: [[50, 100, 100], [70, 85, 100], [100, 15, 55], [230, 0, 10]] },
    F: { rot: "Tipo F — \"drop-on\" (DNER-EM 373/2000, Tabela 1)", ref: "DNER-EM 373/2000, Tabela 1 — tipo F",
      p: [[18, 100, 100], [20, 98, 100], [30, 75, 95], [50, 9, 35], [80, 0, 5]] },
    G: { rot: "Tipo G — \"drop-on\" (DNER-EM 373/2000, Tabela 1)", ref: "DNER-EM 373/2000, Tabela 1 — tipo G",
      p: [[18, 100, 100], [20, 90, 100], [30, 10, 30], [50, 0, 5]] },
    E379: { rot: "Esferas de vidro (DNER-EM 379/98, Tabela 1)", ref: "DNER-EM 379/98, Tabela 1",
      p: [[12, 100, 100], [14, 95, 100], [16, 80, 95], [18, 10, 40], [20, 0, 5], [25, 0, 2]] },
  };
  function nomePen(n) { var p = PEN[n]; return "nº " + n + " — " + fmt(p[0], p[0] < 1 ? 3 : 2) + " mm"; }
  function faixa(P) { return FAIXAS[P.tipo] || null; }
  function serie(P) {
    var fx = faixa(P);
    if (P.serie === "058" || !fx) return SERIE_058.slice();
    if (P.serie === "ambas") {
      var s = SERIE_058.concat(fx.p.map(function (x) { return x[0]; }));
      return s.filter(function (n, i) { return s.indexOf(n) === i; }).sort(function (a, b) { return a - b; });
    }
    return fx.p.map(function (x) { return x[0]; });
  }
  function chave(n) { return "n" + n; }

  FE.FICHAS["dner-me-058-94"] = {
    titulo: "Microesferas de vidro — granulometria",
    resumo: "≈ 500 g secos a (110 ± 5) °C; 50 g (± 0,1 g) peneirados na série do tipo de microesfera (150 golpes/min, até passar ≤ 0,05 g em 1 min); % passando = (massa inicial − retidos acumulados) / massa inicial × 100 (6.1); faixas da DNER-EM 373/2000 e DNER-EM 379/98.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: microesferas tipo I B (premix)" },
      { k: "tipo", r: "Tipo / faixa granulométrica (5.3)", tipo: "select", recarrega: true,
        opcoes: [["", "— sem faixa (série da DNER-ME 058/94) —"]].concat(Object.keys(FAIXAS).map(function (k) { return [k, FAIXAS[k].rot]; })),
        dica: "a série de peneiras é a especificada para o tipo de microesferas (5.3)" },
      { k: "serie", r: "Série de peneiras", tipo: "select", recarrega: true, se: function (d) { return !!faixa(d.params || {}); },
        opcoes: [["faixa", "Peneiras da faixa escolhida"], ["058", "Série da DNER-ME 058/94 (3 b)"], ["ambas", "Faixa + série da DNER-ME 058/94"]] },
      { k: "peneiramento", r: "Peneiramento", tipo: "select", opcoes: [["manual", "Manual — 150 golpes/min, giro de 1/6 a cada 25 golpes (5.5)"], ["mecanico", "Mecânico (\"Rot-Up\"), mesmo tempo e golpes (nota)"]] },
      { k: "tEstufa", r: "Temperatura de secagem (5.2 — 110 ± 5 °C) — registrado (°C)" },
    ],
    padrao: { tipo: "", serie: "faixa", peneiramento: "manual" },
    tabelas: function (d) {
      var P = d.params || {};
      var linhas = [{ k: "M", r: "Massa inicial da amostra (5.4 — 50 g ± 0,1 g)", u: "g", destaque: true }, { grupo: "Massas retidas em cada peneira (5.7)" }];
      serie(P).forEach(function (n) { linhas.push({ k: chave(n), r: "Retido na " + nomePen(n) + (PEN[n][1] ? "" : " *"), u: "g" }); });
      linhas.push({ k: "fundo", r: "Fundo", u: "g" },
        { calc: "soma", r: "Soma das massas", u: "g", casas: 2 },
        { calc: "dif", r: "Diferença para a massa inicial", u: "%", casas: 2 });
      serie(P).forEach(function (n) { linhas.push({ calc: "p" + n, r: "% passando na " + nomePen(n) + " (6.1)", u: "%", casas: 1 }); });
      return [{ chave: "am", titulo: "Amostras", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "* peneira exigida pela especificação e não listada na aparelhagem da DNER-ME 058/94 (3 b); pesagens com 0,01 g (5.7)", linhas: linhas }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], pens = serie(P), fx = faixa(P);
      var tE = num(P.tEstufa);
      if (ok(tE) && (tE < 105 || tE > 115)) avisos.push("Secagem a " + fmt(tE, 0) + " °C — a norma prescreve (110 ± 5) °C (5.2).");
      var am = (d.am || []).map(function (a, i) {
        var M = num(a.M), rot = "Amostra " + (i + 1) + ": ", acum = 0, soma = 0;
        var o = { pen: [] };
        pens.forEach(function (n) { var v = num(a[chave(n)]); soma += ok(v) ? v : 0; });
        var fundo = num(a.fundo); soma += ok(fundo) ? fundo : 0;
        o.soma = soma; o.dif = ok(M) && M > 0 ? (soma - M) / M * 100 : NaN;
        if (!ok(M) || M <= 0) return o;
        if (Math.abs(M - 50) > 0.1 + 1e-9) avisos.push(rot + "massa inicial de " + fmt(M, 2) + " g; a norma pede 50 g com aproximação de 0,1 g (5.4).");
        if (Math.abs(o.dif) > 0.5) avisos.push(rot + "a soma das massas difere " + fmt(o.dif, 2) + " % da massa inicial (a norma não fixa tolerância; a ficha avisa acima de 0,5 %).");
        pens.forEach(function (n) {
          var v = num(a[chave(n)]); acum += ok(v) ? v : 0;
          var pass = (M - acum) / M * 100;
          o["p" + n] = pass;
          o.pen.push({ mm: PEN[n][0], n: n, pass: pass, ret: (ok(v) ? v : 0) / M * 100 });
        });
        return o;
      });
      var validas = am.filter(function (o) { return o.pen.length; });
      var med = pens.map(function (n, j) {
        var pass = media(validas.map(function (o) { return o.pen[j].pass; }));
        var f = fx ? fx.p.filter(function (x) { return x[0] === n; })[0] : null;
        var lim = f ? { min: f[1], max: f[2] } : null;
        return { mm: PEN[n][0], n: n, pass: pass, lim: lim, dentro: lim && ok(pass) ? pass >= lim.min - 1e-9 && pass <= lim.max + 1e-9 : null };
      });
      var fora = med.filter(function (m) { return m.dentro === false; });
      if (fora.length) avisos.unshift("Fora da faixa (" + fx.ref + ") em " + fora.length + " peneira(s): " + fora.map(function (m) {
        return nomePen(m.n) + " (" + fmt(m.pass, 1) + " %, faixa " + fmt(m.lim.min, 0) + "–" + fmt(m.lim.max, 0) + " %)";
      }).join("; ") + ".");
      if (fx) {
        var falta = fx.p.filter(function (x) { return pens.indexOf(x[0]) < 0; });
        if (falta.length) avisos.push("A série usada não inclui " + falta.map(function (x) { return nomePen(x[0]); }).join(", ") + ", exigida(s) pela faixa.");
        var extra = fx.p.filter(function (x) { return !PEN[x[0]][1]; });
        if (extra.length && validas.length) avisos.push("A faixa exige peneira(s) que não constam da aparelhagem da DNER-ME 058/94 (3 b): " +
          extra.map(function (x) { return nomePen(x[0]); }).join(", ") + ".");
      }
      var conf = fx && validas.length ? !fora.length : null;
      return { tab: { am: am }, amostras: am, resultados: { media: med, faixa: fx, conforme: conf, n: validas.length }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var h = '<div class="fe-res">' + S.card(r.conforme === null ? "—" : r.conforme ? '<span class="fe-ok">dentro da faixa</span>' : '<span class="fe-nok">fora da faixa</span>',
        r.faixa ? esc(r.faixa.ref) : "sem faixa de especificação", true) + "</div>";
      if (!r.n) return h;
      h += '<table class="fe-resumo"><thead><tr><th>Peneira</th><th>% passando' + (r.n > 1 ? " (média)" : "") + "</th>" + (r.faixa ? "<th>Faixa</th><th></th>" : "") + "</tr></thead><tbody>";
      r.media.forEach(function (m) {
        h += "<tr><td>" + esc(nomePen(m.n)) + "</td><td><b>" + fmt(m.pass, 1) + "</b></td>" + (r.faixa ? "<td>" + (m.lim ? fmt(m.lim.min, 0) + "–" + fmt(m.lim.max, 0) : "") + "</td><td>" +
          (m.dentro === null ? "" : m.dentro ? '<span class="fe-ok">ok</span>' : '<span class="fe-nok">fora</span>') + "</td>" : "") + "</tr>";
      });
      return h + "</tbody></table>";
    },
    graficos: function (calc, d, opt) {
      // gráfico da DNIT 412 (abertura em escala log × % passando, faixa sombreada)
      return [FE.granulometria.grafico({ resultados: { media: calc.resultados.media }, amostras: calc.amostras.filter(function (o) { return o.pen.length; }) }, opt)];
    },
    relatorio: {
      notas: "% passando em cada peneira = (massa inicial − massas retidas acumuladas) / massa inicial × 100 (6.1). Peneiramento até que não mais de 0,05 g passe em 1 min de peneiramento contínuo (5.5). " +
        "Aberturas: as da DNER-ME 058/94 (3 b) para as peneiras nº 20 (0,850 mm) e nº 70 (0,212 mm), que a DNER-EM 373/2000 indica como 840 µm e 210 µm; nº 12, 14, 16, 18, 25 e 80 com as aberturas nominais 1,70; 1,40; 1,18; 1,00; 0,710 e 0,180 mm (a DNER-EM 379/98 escreve 1,2 e 0,70 mm).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["% passando", r.media.map(function (m) { return "nº " + m.n + ": " + fmt(m.pass, 1) + (m.dentro === false ? " (FORA)" : ""); }).join(" · ")]);
        if (r.faixa) rows.push(["Faixa granulométrica", r.faixa.ref + (r.conforme === null ? "" : r.conforme ? " — DENTRO DA FAIXA" : " — FORA DA FAIXA")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Microesferas tipo I B — dentro da faixa", dados: function () {
        return { ident: { registro: "EX-MV058-01", data: "2026-03-09", obra: "Obra A", local: "Lote 12", origem: "Fornecedor A", camada: "Microesferas tipo I B (premix)" },
          params: { material: "Microesferas de vidro tipo I B", tipo: "IB", serie: "faixa", peneiramento: "manual", tEstufa: "110" },
          am: [{ M: "50,0", n50: "0,00", n70: "3,65", n100: "22,40", n230: "21,10", fundo: "2,80" }] };
      } },
      { nome: "Microesferas tipo F — graúdas demais, fora da faixa (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV058-02", data: "2026-03-10", obra: "Obra B", local: "Lote 7", origem: "Fornecedor B", camada: "Microesferas tipo F (drop-on)" },
          params: { material: "Microesferas de vidro tipo F", tipo: "F", serie: "faixa", peneiramento: "mecanico", tEstufa: "110" },
          am: [{ M: "50,1", n18: "0,00", n20: "1,90", n30: "14,20", n50: "27,50", n80: "5,30", fundo: "1,15" }] };
      } },
    ],
  };
})();
