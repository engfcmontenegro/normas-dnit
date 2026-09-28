/*
 * Ficha: DNER-ME 197/97 — Agregados: resistência ao esmagamento de agregados graúdos.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var DIF_MAX = 3;  // 6.2: diferença entre determinações ≤ 3 % (pontos percentuais de R)

  // R = (Mi − Mf) / Mi × 100 (6.1)
  function resist(Mi, Mf) { return ok(Mi) && ok(Mf) && Mi > 0 ? (Mi - Mf) / Mi * 100 : NaN; }

  FE.FICHAS["dner-me-197-97"] = {
    titulo: "Resistência ao esmagamento de agregado graúdo",
    resumo: "Fração 12,5–9,5 mm seca em estufa, apiloada no recipiente e comprimida no cilindro sob 400 kN a (40 ± 5) kN/min; R = (Mᵢ − M_f) / Mᵢ × 100 com M_f retido na peneira de 2,4 mm; média de duas determinações com diferença ≤ 3 % (terceira se preciso).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: brita 1 para concreto" },
      { k: "carga", r: "Carga total aplicada (kN) (5.6)", ph: "400" },
      { k: "taxa", r: "Velocidade de carregamento (kN/min) (5.6)", ph: "40" },
      { k: "espec", r: "Critério da especificação — opcional", tipo: "select", recarrega: true,
        opcoes: [["", "Nenhum"], ["rmax", "R máximo (%) — R como calculado em 6.1"],
          ["retmin", "Fração retida 100 − R mínima (%) — leitura da DNIT 462-EM (ver nota)"]] },
      { k: "limite", r: "Valor do limite (%)", se: function (d) { return !!(d.params || {}).espec; },
        dica: "DNIT 462/2025-EM (6.6): ≥ 65 % para concreto sujeito a desgaste superficial, ≥ 55 % para os demais" },
    ],
    padrao: { carga: "400", taxa: "40", espec: "" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 2,
        dica: "duas determinações (5.9); acrescente a terceira se a diferença passar de 3 % (6.2)",
        linhas: [
          { k: "Mi", r: "Massa inicial seca, no recipiente (Mᵢ) (5.3)", u: "g" },
          { k: "Mf", r: "Massa retida na peneira de 2,4 mm (M_f) (5.8)", u: "g" },
          { calc: "R", r: "R = (Mᵢ − M_f) / Mᵢ × 100 (6.1)", u: "%", casas: 1, destaque: true },
          { calc: "ret", r: "Fração retida na 2,4 mm = 100 − R (informativo)", u: "%", casas: 1 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var rows = (d.det || []).map(function (x, i) {
        var Mi = num(x.Mi), Mf = num(x.Mf), R = resist(Mi, Mf);
        if (ok(Mi) && ok(Mf) && Mf > Mi) avisos.push("Determinação " + (i + 1) + ": massa retida maior que a inicial — confira.");
        return { R: R, ret: ok(R) ? 100 - R : NaN };
      });
      var val = rows.map(function (o, i) { return { i: i, R: o.R }; }).filter(function (o) { return ok(o.R); });
      if ((d.det || []).length > 3) avisos.push("A norma prevê no máximo três determinações (6.2).");
      var par = null, dif12 = NaN;
      if (val.length >= 2) dif12 = Math.abs(val[0].R - val[1].R);
      if (val.length === 2) {
        if (dif12 <= DIF_MAX) par = [val[0], val[1]];
        else avisos.push("Diferença de " + fmt(dif12, 1) + " % entre a 1ª e a 2ª determinação (limite 3 %): faça uma terceira determinação e adote as duas que satisfaçam o limite (6.2).");
      } else if (val.length >= 3) {
        var cands = [];
        for (var a = 0; a < val.length; a++) for (var b = a + 1; b < val.length; b++) {
          var df = Math.abs(val[a].R - val[b].R);
          if (df <= DIF_MAX) cands.push({ p: [val[a], val[b]], d: df });
        }
        cands.sort(function (x, y) { return x.d - y.d; });
        if (cands.length) par = cands[0].p;
        else avisos.push("Nenhum par de determinações com diferença ≤ 3 % (6.2): o resultado não pode ser adotado — refaça o ensaio.");
        if (dif12 <= DIF_MAX) avisos.push("A 1ª e a 2ª determinação já atendiam ao limite de 3 % — a terceira não era necessária.");
      } else if (val.length === 1) avisos.push("O resultado é a média de duas determinações (6.2).");
      var R = par ? (par[0].R + par[1].R) / 2 : NaN, difPar = par ? Math.abs(par[0].R - par[1].R) : NaN;
      var carga = num(P.carga), taxa = num(P.taxa);
      if (ok(carga) && carga !== 400) avisos.push("Carga total de " + fmt(carga, 0) + " kN — a norma prescreve 400 kN (5.6).");
      if (ok(taxa) && (taxa < 35 || taxa > 45)) avisos.push("Velocidade de " + fmt(taxa, 1) + " kN/min fora de (40 ± 5) kN/min (5.6).");
      var lim = num(P.limite), conforme = null;
      if (ok(R) && ok(lim) && P.espec) {
        conforme = P.espec === "rmax" ? R <= lim : (100 - R) >= lim;
        if (!conforme) avisos.push(P.espec === "rmax" ? "R = " + fmt(R, 1) + " %, acima do máximo de " + fmt(lim, 0) + " %."
          : "Fração retida 100 − R = " + fmt(100 - R, 1) + " %, abaixo do mínimo de " + fmt(lim, 0) + " %.");
      }
      return { tab: { det: rows }, resultados: { R: R, dif: difPar, dif12: dif12, par: par ? par.map(function (o) { return o.i + 1; }) : null,
        espec: P.espec, lim: lim, conforme: conforme }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.R) ? fmt(r.R, 1) : "—") + ' <small>%</small></div>' +
        '<div class="fe-res-r">Resistência ao esmagamento R (6.1) — média das determinações ' + (r.par ? r.par.join(" e ") : "—") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.R) ? fmt(100 - r.R, 1) + " %" : "—") + '</div><div class="fe-res-r">Fração retida na 2,4 mm (100 − R)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.dif) ? fmt(r.dif, 1) + " %" : ok(r.dif12) ? fmt(r.dif12, 1) + " %" : "—") +
        '</div><div class="fe-res-r">Diferença entre as determinações (limite 3 %)</div></div></div>';
    },
    relatorio: {
      notas: "R = (Mᵢ − M_f) / Mᵢ × 100 (6.1): Mᵢ = massa seca inicial (fração 12,5–9,5 mm apiloada no recipiente), M_f = massa retida na peneira de 2,4 mm após 400 kN a (40 ± 5) kN/min. Resultado: média de duas determinações cuja diferença não supere 3 % (interpretada como 3 pontos percentuais de R); caso contrário, terceira determinação e adoção do par que atende ao limite (6.2). A norma não fixa arredondamento; resultado com uma decimal. Observação: pela fórmula, R é a porcentagem de finos produzidos (quanto menor, mais resistente); a DNIT 462-EM exige \"resistência ao esmagamento\" ≥ 55 % ou 65 %, o que só é coerente com a fração retida (100 − R), também apresentada.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Resistência ao esmagamento R", ok(r.R) ? fmt(r.R, 1) + " % — média das determinações " + r.par.join(" e ") : "—"]);
        rows.push(["Fração retida na peneira de 2,4 mm (100 − R)", ok(r.R) ? fmt(100 - r.R, 1) + " %" : "—"]);
        rows.push(["Diferença entre as determinações adotadas", ok(r.dif) ? fmt(r.dif, 1) + " % (limite 3 %)" : "—"]);
        if (r.conforme !== null) rows.push(["Especificação", (r.espec === "rmax" ? "R ≤ " : "100 − R ≥ ") + fmt(r.lim, 0) + " % — " + (r.conforme ? "atende" : "NÃO ATENDE")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 granítica — duas determinações concordantes", dados: function () {
        return { ident: { registro: "EX-ESM-001", obra: "Obra A", camada: "Brita 1 — concreto", origem: "Pedreira X", data: "2026-06-03" },
          params: { material: "Brita 1 (granito)", carga: "400", taxa: "40", espec: "retmin", limite: "65" },
          det: [{ Mi: "3012", Mf: "2338" }, { Mi: "2986", Mf: "2295" }] };
      } },
      { nome: "Brita de gnaisse — diferença acima de 3 %, terceira determinação", dados: function () {
        return { ident: { registro: "EX-ESM-002", obra: "Obra B", camada: "Brita 1", origem: "Pedreira Y", data: "2026-06-11" },
          params: { material: "Brita 1 (gnaisse)", carga: "400", taxa: "42", espec: "rmax", limite: "30" },
          det: [{ Mi: "2954", Mf: "2168" }, { Mi: "2977", Mf: "2072" }, { Mi: "2961", Mf: "2150" }] };
      } },
      { nome: "Seixo britado — resistência insuficiente (reprovado)", dados: function () {
        return { ident: { registro: "EX-ESM-003", camada: "Concreto de calçada", origem: "Fornecedor A" },
          params: { material: "Seixo britado", carga: "400", taxa: "48", espec: "retmin", limite: "55" },
          det: [{ Mi: "2890", Mf: "1532" }, { Mi: "2905", Mf: "1571" }] };
      } },
    ],
  };
})();
