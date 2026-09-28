/*
 * Ficha: DNER-ME 400/99 — Agregados — Desgaste após fervura de agregado pétreo natural.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  function calcAmostra(x) {
    var M1 = num(x.m1), r1 = num(x.mr1), r2 = num(x.mr2), pas = num(x.mp);
    var o = {};
    if (!ok(M1) || M1 <= 0) return o;
    if (ok(r1)) o.p10 = (M1 - r1) / M1 * 100;                      // P10 = (M1 − Mr1) / M1 × 100
    if (ok(r1) && ok(r2)) o.p40 = (M1 - (r1 + r2)) / M1 * 100;     // P40 = (M1 − (Mr1 + Mr2)) / M1 × 100
    if (ok(r1) && ok(r2) && ok(pas)) o.fech = (r1 + r2 + pas - M1) / M1 * 100;
    return o;
  }

  FE.FICHAS["dner-me-400-99"] = {
    titulo: "Desgaste após fervura de agregado pétreo natural",
    resumo: "Amostra 19,0–2,0 mm enchendo metade de um frasco de 500 cm³, com 200 cm³ de água destilada, fervida 15 min na panela de pressão e agitada 30 min; P₁₀ = (M₁ − Mr₁) / M₁ × 100 e P₄₀ = (M₁ − (Mr₁ + Mr₂)) / M₁ × 100.",
    blocos: [],
    params: [
      { k: "litologia", r: "Tipo litológico (anexo)", ph: "ex.: basalto" },
      { k: "classificacao", r: "Classificação visual (anexo)", ph: "ex.: rocha sã, cinza-escura, granulação fina" },
      { k: "valvula", r: "Válvula da panela de pressão (3 a)", tipo: "select",
        opcoes: [["0,098", "0,098 MPa (1 kgf/cm²)"], ["0,049", "0,049 MPa (0,5 kgf/cm²)"]] },
      { k: "limite", r: "Desgaste máximo admitido na nº 10 (%) — opcional", dica: "da especificação ou do projeto; a norma não fixa limite" },
    ],
    padrao: { valvula: "0,098" },
    tabelas: function () {
      return [{
        chave: "am", titulo: "Amostras (anexo — ficha de ensaio)", rotulo: "Amostra", iniciais: 3, min: 1,
        dica: "um frasco por amostra; massas secas em estufa (5.1 i)",
        linhas: [
          { k: "frasco", r: "Frasco nº", texto: true },
          { k: "m1", r: "Massa inicial (M₁) — seção 4", u: "g" },
          { k: "mr1", r: "Massa retida na nº 10 — 2,0 mm (Mr₁)", u: "g" },
          { k: "mr2", r: "Massa retida na nº 40 — 0,42 mm (Mr₂)", u: "g" },
          { k: "mp", r: "Massa passando na nº 40 (5.1 i) — conferência", u: "g" },
          { calc: "fech", r: "Fechamento (Mr₁ + Mr₂ + passante − M₁) / M₁", u: "%", casas: 2 },
          { calc: "p10", r: "P₁₀ = (M₁ − Mr₁) / M₁ × 100", u: "%", casas: 2, destaque: true },
          { calc: "p40", r: "P₄₀ = (M₁ − (Mr₁ + Mr₂)) / M₁ × 100", u: "%", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var am = (d.am || []).map(function (x, i) {
        var o = calcAmostra(x), R = "Amostra " + (i + 1) + ": ";
        var M1 = num(x.m1), r1 = num(x.mr1), r2 = num(x.mr2);
        if (ok(M1) && ok(r1) && r1 > M1) avisos.push(R + "massa retida na nº 10 maior que a massa inicial — confira.");
        if (ok(M1) && ok(r1) && ok(r2) && r1 + r2 > M1) avisos.push(R + "Mr₁ + Mr₂ maior que a massa inicial — confira.");
        if (ok(o.fech) && Math.abs(o.fech) > 0.5) avisos.push(R + "retidos + passante diferem " + fmt(o.fech, 2) + " % da massa inicial — confira perdas na lavagem (5.1 h).");
        return o;
      });
      var p10 = media(am.map(function (o) { return o.p10; })), p40 = media(am.map(function (o) { return o.p40; }));
      var n = am.filter(function (o) { return ok(o.p10); }).length;
      var lim = num(P.limite);
      if (ok(p10) && ok(lim) && p10 > lim) avisos.push("Desgaste na nº 10 de " + fmt(p10, 1) + " %, acima do máximo admitido de " + fmt(lim, 1) + " %.");
      return { tab: { am: am }, resultados: { p10: p10, p40: p40, n: n, limite: lim, conforme: ok(p10) && ok(lim) ? p10 <= lim : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.p10, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">Desgaste na peneira nº 10 (P₁₀) — média de ' + r.n + " amostra(s)" +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.p40, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">Desgaste na peneira nº 40 (P₄₀) — média</div></div></div>';
    },
    relatorio: {
      notas: "P₁₀ = (M₁ − Mr₁) / M₁ × 100 e P₄₀ = (M₁ − (Mr₁ + Mr₂)) / M₁ × 100 (seção 6); M₁ = massa inicial, Mr₁ = retida na nº 10, Mr₂ = retida na nº 40. Fervura de 15 min após a válvula soltar vapor, resfriamento abaixo de 27 °C e agitação de 30 min no agitador de peneiras (5.1 d–g); lavagem na nº 40 e secagem em estufa (5.1 h–i). Resultado: média das amostras, como no anexo; a norma não fixa arredondamento (uma casa decimal).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.litologia) rows.push(["Tipo litológico", P.litologia]);
        if (P.classificacao) rows.push(["Classificação visual", P.classificacao]);
        rows.push(["Desgaste após fervura — peneira nº 10 (P₁₀)", fmt(r.p10, 1) + " % (média de " + r.n + " amostras)" +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.limite, 1) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.limite, 1) + " %")]);
        rows.push(["Desgaste após fervura — peneira nº 40 (P₄₀)", fmt(r.p40, 1) + " %"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Basalto são — três frascos", dados: function () {
        return { ident: { registro: "EX-FV-001", obra: "Obra C", origem: "Pedreira X" },
          params: { litologia: "Basalto", classificacao: "Rocha sã, cinza-escura, granulação fina", valvula: "0,098" },
          am: [{ frasco: "1", m1: "412,6", mr1: "405,3", mr2: "3,1", mp: "4,0" }, { frasco: "2", m1: "408,9", mr1: "401,2", mr2: "3,5", mp: "4,1" },
            { frasco: "3", m1: "415,2", mr1: "408,0", mr2: "3,0", mp: "4,0" }] };
      } },
      { nome: "Rocha alterada — desgaste alto, fechamento fora", dados: function () {
        return { ident: { registro: "EX-FV-002", origem: "Pedreira Y" },
          params: { litologia: "Granito", classificacao: "Rocha alterada, feldspatos caulinizados", valvula: "0,098", limite: "5" },
          am: [{ frasco: "1", m1: "398,4", mr1: "361,7", mr2: "15,2", mp: "21,3" }, { frasco: "2", m1: "401,1", mr1: "366,0", mr2: "14,1", mp: "17,2" },
            { frasco: "3", m1: "396,7", mr1: "358,8", mr2: "16,0", mp: "21,6" }] };
      } },
    ],
  };
})();
