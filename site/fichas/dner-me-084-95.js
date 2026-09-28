/*
 * Ficha: DNER-ME 084/95 — Agregado miúdo: determinação da densidade real (picnômetro de 500 mL, fervura).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // D25 = (b − a) / ((d − a) − (c − b))   (7.1.1)
  function d25(x) {
    var a = num(x.a), b = num(x.b), c = num(x.c), dd = num(x.d), o = {};
    if (ok(a) && ok(b)) o.ms = b - a;
    if (ok(a) && ok(dd)) o.vw = dd - a;
    if (ok(b) && ok(c)) o.wc = c - b;
    if (ok(o.ms) && ok(o.vw) && ok(o.wc) && o.vw - o.wc > 0) { o.vol = o.vw - o.wc; o.D = o.ms / o.vol; }
    return o;
  }
  function r2(x) { return ok(x) ? Math.round(x * 100) / 100 : NaN; }

  FE.FICHAS["dner-me-084-95"] = {
    titulo: "Densidade real de agregado miúdo (picnômetro)",
    resumo: "Cerca de 500 g do material entre as peneiras de 4,8 mm e 0,075 mm, seco em estufa; picnômetro com água fervida por 15 min e levado a 25 °C: D25 = (b − a) / ((d − a) − (c − b)); média de duas determinações, com aproximação de 0,01.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: areia, pó de pedra" },
      { k: "temperatura", r: "Temperatura da água ao completar o picnômetro (°C)", ph: "25", dica: "6.5, 6.6 e 6.8: 25 °C (termômetro graduado em 0,5 °C)" },
    ],
    padrao: { temperatura: "25" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 2, fixo: true,
        dica: "duas determinações (7.2.1); todas as massas com aproximação de 0,01 g (6.1)",
        linhas: [
          { k: "picn", r: "Picnômetro nº", texto: true },
          { k: "a", r: "Picnômetro vazio, seco e limpo (a) (6.2)", u: "g" },
          { k: "b", r: "Picnômetro + amostra seca (b) (6.3)", u: "g" },
          { k: "c", r: "Picnômetro + amostra + água até o traço (c) (6.7)", u: "g" },
          { k: "d", r: "Picnômetro cheio d'água até o traço (d) (6.8)", u: "g" },
          { calc: "ms", r: "Massa da amostra seca b − a", u: "g", casas: 2 },
          { calc: "vol", r: "Massa de água deslocada (d − a) − (c − b)", u: "g", casas: 2 },
          { calc: "D", r: "Densidade real D25 = (b − a) / ((d − a) − (c − b)) (7.1.1)", u: "", casas: 3, destaque: true },
          { calc: "desvio", r: "Afastamento da média (máx. ± 0,02 — 7.2.2)", u: "", casas: 3 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var T = num(P.temperatura);
      if (ok(T) && Math.abs(T - 25) > 0.5) avisos.push("Temperatura de " + fmt(T, 1) + " °C: a norma fixa 25 °C para o banho e a água do picnômetro (6.5, 6.6 e 6.8); o resultado D25 pressupõe 25/25 °C.");
      var dets = (d.det || []).map(function (x, i) {
        var o = d25(x), n = "Determinação " + (i + 1) + ": ";
        if (ok(o.ms) && (o.ms < 450 || o.ms > 550)) avisos.push(n + "amostra de " + fmt(o.ms, 2) + " g; a norma toma cerca de 500 g (5.2).");
        if (ok(o.ms) && o.ms <= 0) avisos.push(n + "b deve ser maior que a.");
        var c = num(x.c), dd = num(x.d);
        if (ok(c) && ok(dd) && c <= dd) avisos.push(n + "c (picnômetro + amostra + água) deve ser maior que d (picnômetro + água).");
        return o;
      });
      var vals = dets.map(function (o) { return o.D; }).filter(ok);
      var m = media(vals), dmax = NaN;
      if (vals.length === 2) {
        dets.forEach(function (o) { if (ok(o.D)) o.desvio = o.D - m; });
        dmax = Math.max.apply(null, vals.map(function (v) { return Math.abs(v - m); }));
        if (dmax > 0.02 + 1e-9) avisos.push("As determinações afastam-se ± " + fmt(dmax, 3) + " da média (máximo ± 0,02 para um mesmo operador — 7.2.2): repita o ensaio.");
      } else if (vals.length === 1) avisos.push("O resultado é a média de duas determinações (7.2.1); há uma.");
      return { tab: { det: dets }, resultados: { D: m, Dr: r2(m), dmax: dmax, n: vals.length, conforme: ok(dmax) ? dmax <= 0.02 + 1e-9 : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.Dr, 2) + '</div><div class="fe-res-r">Densidade real D25 — média de ' +
        r.n + (r.n === 1 ? " determinação" : " determinações") + ", aproximação de centésimos (" + fmt(r.D, 3) + ")</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">± ' + fmt(r.dmax, 3) + '</div><div class="fe-res-r">Maior afastamento da média (máx. ± 0,02)' +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div></div>";
    },
    relatorio: {
      notas: "D25 = (b − a)/((d − a) − (c − b)) (7.1.1): a = picnômetro vazio; b = picnômetro + amostra seca; c = picnômetro + amostra + água; d = picnômetro cheio d'água, a 25 °C. Resultado: média de duas determinações, adimensional, com aproximação de centésimos (7.2.1); as determinações não devem diferir de ± 0,02 da média (7.2.2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Densidade real D25", fmt(r.Dr, 2) + " (média de " + r.n + " determinações)"]);
        rows.push(["Maior afastamento da média", "± " + fmt(r.dmax, 3) + (r.conforme === null ? "" : r.conforme ? " — atende (≤ ± 0,02)" : " — NÃO ATENDE (> ± 0,02): repetir")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Pó de pedra — duas determinações", dados: function () {
        return { ident: { registro: "EX-084-001", origem: "Pedreira Y", camada: "Pó de pedra" },
          params: { material: "Pó de pedra (4,8 mm a 0,075 mm)", temperatura: "25" },
          det: [{ picn: "1", a: "182,45", b: "682,61", c: "990,93", d: "676,37" },
            { picn: "2", a: "179,88", b: "678,40", c: "985,74", d: "672,51" }] };
      } },
      { nome: "Areia quartzosa — duas determinações", dados: function () {
        return { ident: { registro: "EX-084-002", origem: "Areal Y", camada: "Areia média" },
          params: { material: "Areia média", temperatura: "25" },
          det: [{ picn: "3", a: "175,20", b: "675,82", c: "984,06", d: "672,43" },
            { picn: "4", a: "181,02", b: "680,15", c: "988,93", d: "678,17" }] };
      } },
      { nome: "Areia — determinações discrepantes (fora de ± 0,02)", dados: function () {
        return { ident: { registro: "EX-084-003", origem: "Areal B", camada: "Areia fina" },
          params: { material: "Areia fina", temperatura: "27" },
          det: [{ picn: "1", a: "182,45", b: "680,10", c: "990,50", d: "676,37" },
            { picn: "2", a: "179,88", b: "681,33", c: "985,44", d: "672,51" }] };
      } },
    ],
  };
})();
