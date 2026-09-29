/*
 * Ficha: DNER-ME 239/94 — Tinta para demarcação viária — determinação da resistência à abrasão (abrasímetro).
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ESP = ["e1", "e2", "e3", "e4", "e5", "e6"];

  FE.FICHAS["dner-me-239-94"] = {
    titulo: "Tinta para demarcação viária — resistência à abrasão",
    resumo: "Película em placa de alumínio (24 h a 25 °C + 3 h a 105 °C); em três áreas circulares, espessura seca média (≥ 5 medidas) e volume de óxido de alumínio em queda livre até romper a película (elipse de 4 mm); A = 0,300 × v / e; resultado: média das três áreas (seções 6 e 7).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "tesc", r: "Aferição: tempo de escoamento de 2 000 ml de abrasivo (s) — 27 ± 2 s (5.2.3)", ph: "27" },
      { k: "usos", r: "Número de usos da carga de abrasivo — no máximo 50 (5.3.6)" },
    ]).concat(S.paramsEspec("abrasao")),
    padrao: { cor: "branca", espec: "" },
    tabelas: function () {
      return [{ chave: "areas", titulo: "Áreas circulares ensaiadas (5.3)", rotulo: "Área", iniciais: 3, min: 3,
        dica: "três áreas de ≈ 30 mm na mesma placa; pelo menos 5 medidas de espessura seca em cada",
        linhas: [{ grupo: "Espessura seca da película (5.3.2)" }]
          .concat(ESP.map(function (k, i) { return { k: k, r: "Medida " + (i + 1) + (i === 5 ? " (opcional)" : ""), u: "mm" }; }))
          .concat([
            { calc: "e", r: "Espessura média (e)", u: "mm", casas: 3 },
            { grupo: "Abrasão (5.3.4 a 5.3.8)" },
            { k: "v", r: "Volume de abrasivo até romper a película (v)", u: "L" },
            { calc: "A", r: "A = 0,300 × v / e — litros referidos a 0,300 mm (seção 6)", u: "L", casas: 1, destaque: true },
            { calc: "desv", r: "Diferença para a média (máx. 10 %, seção 8)", u: "%", casas: 1 },
          ]) }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var te = num(P.tesc), us = num(P.usos);
      if (ok(te) && (te < 25 || te > 29)) avisos.push("Tempo de escoamento de " + fmt(te, 1) + " s fora de 27 ± 2 s: ajuste o abrasímetro (5.2.3).");
      if (ok(us) && us > 50) avisos.push("A carga de abrasivo não deve ser usada mais de 50 vezes (5.3.6).");
      var tab = (d.areas || []).map(function (p, i) {
        var es = ESP.map(function (k) { return num(p[k]); }).filter(ok), e = FE.media(es), v = num(p.v);
        if (es.length && es.length < 5) avisos.push("Área " + (i + 1) + ": " + es.length + " medida(s) de espessura; a norma pede pelo menos 5 (5.3.2).");
        return { e: e, A: ok(e) && ok(v) && e > 0 ? 0.300 * v / e : NaN };
      });
      var As = tab.map(function (o) { return o.A; }).filter(ok), m = FE.media(As);
      tab.forEach(function (o, i) {
        o.desv = ok(o.A) && ok(m) && m > 0 ? (o.A - m) / m * 100 : NaN;
        if (ok(o.desv) && Math.abs(o.desv) > 10 + 1e-9) avisos.push("Área " + (i + 1) + ": valor difere " + fmt(Math.abs(o.desv), 1) + " % da média (máximo 10 %, seção 8) — repetibilidade não atendida.");
      });
      if (As.length && As.length < 3) avisos.push("O resultado é a média das três áreas ensaiadas (5.3.9 e seção 7); há " + As.length + ".");
      var r = { A: m, n: As.length, lim: S.limite("abrasao", P) };
      r.maxDesv = Math.max.apply(null, tab.map(function (o) { return ok(o.desv) ? Math.abs(o.desv) : 0; }).concat([0]));
      r.conforme = S.confere(r.A, r.lim);
      S.avisoLimite(avisos, "Resistência à abrasão", r.A, r.lim, "L", 1);
      return { tab: { areas: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.itemRes(fmt(r.A, 1) + " <small>L</small>", "Resistência à abrasão (referida a 0,300 mm) — média de " + r.n + " áreas" +
        (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "L", 0)) + " " + S.selo(r.conforme) : "")) +
        S.itemRes(fmt(r.maxDesv, 1) + " <small>%</small>", "Maior diferença para a média (máx. 10 %)", "fe-res-p") + "</div>";
    },
    relatorio: {
      parametros: [["Película", "extensor de 0,68 ± 0,02 mm úmido; placa de alumínio; 24 h a 25 ± 5 °C e 60 ± 5 % UR + 3 h a 105 ± 5 °C; 2 h de esfriamento (5.1)"],
        ["Abrasivo", "óxido de alumínio branco, 99 %, grão 24, massa específica 3,95 ± 0,02 g/cm³ (3 b)"]],
      notas: "A = 0,300 × v / e, com v = litros de abrasivo necessários para romper a película (área elíptica de 4 mm) e e = espessura média da área (mm) (seção 6). Resultado: média das três áreas (seção 7); valores individuais não devem diferir da média em mais de 10 % (seção 8).",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return S.linhaTinta(d.params).concat([["Resistência à abrasão", (ok(r.A) ? fmt(r.A, 1) + " L" : "—") + (r.lim ? " — " + S.parecer("", r.A, r.lim, "L", 0) : "")],
          ["Maior diferença para a média", fmt(r.maxDesv, 1) + " % (máximo 10 %)"]]);
      },
    },
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — 89 L (atende)", dados: function () {
        return { ident: { registro: "EX-TS-239-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368", tesc: "27", usos: "12" },
          areas: [{ e1: "0,31", e2: "0,32", e3: "0,30", e4: "0,31", e5: "0,32", v: "93" },
            { e1: "0,30", e2: "0,30", e3: "0,31", e4: "0,29", e5: "0,30", v: "88" },
            { e1: "0,32", e2: "0,31", e3: "0,31", e4: "0,32", e5: "0,33", v: "96" }] };
      } },
      { nome: "Tinta acrílica emulsionada, amarela — 70 L e área discrepante (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-239-2", obra: "Obra B", origem: "Fornecedor C" },
          params: { tinta: "Acrílica emulsionada em água", cor: "amarela", lote: "0103", espec: "em276", tesc: "28", usos: "30" },
          areas: [{ e1: "0,29", e2: "0,30", e3: "0,29", e4: "0,30", e5: "0,29", v: "72" },
            { e1: "0,30", e2: "0,31", e3: "0,30", e4: "0,31", e5: "0,30", v: "61" },
            { e1: "0,29", e2: "0,29", e3: "0,30", e4: "0,28", e5: "0,29", v: "73" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-239-94"].rotuloImportar = function (r) { return "abrasão " + window.FE.fmt(r.A, 1) + " L"; };
})();
