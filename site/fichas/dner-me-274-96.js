/*
 * Ficha: DNER-ME 274/96 — Solo-cimento — Determinação da absorção d'água.
 * CPs moldados pela DNER-ME 202/94 (Método A), 7 dias de cura, secos em estufa, 24 h de imersão.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, media = FE.media;

  FE.FICHAS["dner-me-274-96"] = {
    titulo: "Solo-cimento — Absorção d'água",
    resumo: "Corpos de prova de solo-cimento (passante na 4,8 mm, energia normal, DNER-ME 202 Método A), curados 7 dias, secos em estufa até massa constante (ms) e imersos 24 h (mu); A = (mu − ms) / ms × 100; resultado = média dos CPs (mínimo de dois).",
    blocos: [],
    params: [
      { k: "cimento", r: "Teor de cimento (% da massa de solo seco)", ph: "ex.: 6" },
      { k: "cura", r: "Cura em câmara úmida (dias)", ph: "7", dica: "período de cura lenta de sete dias (4.2)" },
      { k: "estufa", r: "Temperatura da estufa", tipo: "select", opcoes: [["105", "105 °C a 110 °C (3.3)"], ["outra", "Outra — informar nas observações"]] },
      { k: "aMax", r: "Absorção máxima admitida (%) — opcional", dica: "da especificação de projeto" },
    ],
    padrao: { cura: "7", estufa: "105" },
    tabelas: function () {
      return [{ chave: "cps", titulo: "Corpos de prova", rotulo: "CP", iniciais: 2, min: 2,
        dica: "no mínimo dois CPs (4.1); pesagens com resolução de 1 g (3.1)",
        linhas: [
          { k: "id", r: "Identificação do CP", texto: true },
          { k: "ms", r: "Massa seca constante após estufa (ms, 4.2)", u: "g" },
          { k: "mu", r: "Massa após 24 h de imersão, enxugado, pesado em até 3 min (mu, 4.3–4.4)", u: "g" },
          { calc: "agua", r: "Água absorvida (mu − ms)", u: "g", casas: 0 },
          { calc: "A", r: "Absorção A = (mu − ms) / ms × 100 (5.1)", u: "%", casas: 1, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var cps = (d.cps || []).map(function (p, i) {
        var ms = num(p.ms), mu = num(p.mu), o = {};
        o.agua = ok(ms) && ok(mu) ? mu - ms : NaN;
        o.A = ok(o.agua) && ms > 0 ? o.agua / ms * 100 : NaN;
        if (ok(o.A) && o.A < 0) avisos.push("CP " + (i + 1) + ": massa após imersão menor que a massa seca — confira as pesagens.");
        return o;
      });
      var vals = cps.map(function (o) { return o.A; }).filter(ok);
      if (vals.length && vals.length < 2) avisos.push("A norma pede no mínimo dois corpos de prova (4.1); há " + vals.length + ".");
      var cura = num(P.cura);
      if (ok(cura) && cura !== 7) avisos.push("Cura de " + fmt(cura, 0) + " dias; a norma prevê cura lenta de sete dias em câmara úmida (4.2).");
      var A = vals.length ? media(vals) : NaN, aMax = num(P.aMax);
      var conforme = ok(A) && ok(aMax) ? Math.round(A * 10) / 10 <= aMax : null;
      if (conforme === false) avisos.push("Absorção média de " + fmt(A, 1) + " %, acima da máxima admitida de " + fmt(aMax, 1) + " %.");
      var disp = vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN;
      return { tab: { cps: cps }, resultados: { A: A, n: vals.length, disp: disp, aMax: aMax, conforme: conforme }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.A, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">Absorção d\'água — média de ' + r.n + " CP(s) (5.2)" +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.disp, 1) + ' <small>%</small></div><div class="fe-res-r">Diferença entre o maior e o menor CP</div></div></div>';
    },
    relatorio: {
      parametros: [["Moldagem", "DNER-ME 202/94, Método A (passante na 4,8 mm, energia normal)"]],
      notas: "A = (mu − ms) / ms × 100 (5.1), com ms = massa seca constante após a cura de 7 dias e mu = massa após 24 h de imersão, enxugada com pano úmido e pesada em até 3 min. Resultado: valor médio da absorção dos CPs ensaiados (5.2), no mínimo dois (4.1); apresentado com aproximação de 0,1 % (a norma não fixa o arredondamento).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.cimento) rows.push(["Teor de cimento", P.cimento + " %"]);
        calc.tab.cps.forEach(function (o, i) { if (ok(o.A)) rows.push(["Absorção — CP " + (((d.cps || [])[i] || {}).id || i + 1), fmt(o.A, 1) + " %"]); });
        rows.push(["Absorção d'água (média)", fmt(r.A, 1) + " %" + (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.aMax, 1) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.aMax, 1) + " %")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Solo arenoso + 6 % de cimento — 2 CPs", dados: function () {
        return { ident: { registro: "EX-AB-001", camada: "Base — solo-cimento", origem: "Jazida 1" },
          params: { cimento: "6", cura: "7", estufa: "105" },
          cps: [{ id: "1", ms: "1874", mu: "1981" }, { id: "2", ms: "1869", mu: "1972" }] };
      } },
      { nome: "Solo argiloso + 10 % de cimento — 3 CPs, acima do máximo admitido", dados: function () {
        return { ident: { registro: "EX-AB-002", camada: "Sub-base — solo-cimento", origem: "Jazida 3" },
          params: { cimento: "10", cura: "7", estufa: "105", aMax: "12" },
          cps: [{ id: "A", ms: "1598", mu: "1812" }, { id: "B", ms: "1605", mu: "1816" }, { id: "C", ms: "1590", mu: "1797" }] };
      } },
      { nome: "Um só CP e cura de 14 dias", dados: function () {
        return { ident: { registro: "EX-AB-003", camada: "Solo-cimento (controle de obra)", origem: "Jazida 2" },
          params: { cimento: "5", cura: "14", estufa: "105", aMax: "10" },
          cps: [{ id: "1", ms: "1921", mu: "2034" }, {}] };
      } },
    ],
  };
})();
