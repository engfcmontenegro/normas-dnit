/*
 * Ficha: DNER-ME 235/94 — Tinta para demarcação viária — teor de substâncias voláteis e não voláteis.
 * Com o teor de pigmento (DNER-ME 237), calcula também o veículo total e o veículo não volátil (DNER-PRO 250/94).
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  FE.FICHAS["dner-me-235-94"] = {
    titulo: "Tinta para demarcação viária — voláteis e não voláteis",
    resumo: "1 a 2 g de tinta prensados entre as metades de uma folha de alumínio; 3 h em estufa a 105 °C; V = (M₂ − M₃)/(M₂ − M₁) × 100 e NV = (M₃ − M₁)/(M₂ − M₁) × 100; média de duas determinações (seções 7 e 8). Opcional: veículo total e não volátil (DNER-PRO 250).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "test", r: "Temperatura da estufa (°C) — 105 ± 5 °C (6.5)", ph: "105" },
      { k: "hest", r: "Tempo na estufa (h) — 3 h (6.5)", ph: "3" },
      { k: "importar", r: "Teor de pigmento: importar de um ensaio salvo (DNER-ME 237) — opcional", tipo: "importar", de: "dner-me-237-94",
        dica: "para o veículo total e o veículo não volátil (DNER-PRO 250)",
        aplicar: function (e, P) { var r = e.resultados || {}; if (ok(r.pct)) P.pig = fmt(r.pct, 2); } },
      { k: "pig", r: "Teor de pigmento P (% em massa de tinta) — DNER-ME 237, opcional" },
    ]).concat(S.paramsEspec("naoVolatil")),
    padrao: { cor: "branca", espec: "" },
    tabelas: function () {
      return [{ chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 2,
        dica: "duas determinações; balança de 0,0001 g; os resultados não podem variar mais de 1,00 % (seção 9)",
        linhas: [
          { k: "M1", r: "Folha de alumínio dobrada (M₁) (6.1)", u: "g" },
          { k: "M2", r: "Folha + amostra (M₂) (6.4)", u: "g" },
          { calc: "am", r: "Massa da amostra (M₂ − M₁) — 1 a 2 g (6.2)", u: "g", casas: 4 },
          { k: "M3", r: "Folha + amostra após secagem (M₃) (6.6)", u: "g" },
          { calc: "V", r: "Matéria volátil V = (M₂ − M₃)/(M₂ − M₁) × 100", u: "%", casas: 2 },
          { calc: "NV", r: "Matéria não volátil NV = (M₃ − M₁)/(M₂ − M₁) × 100", u: "%", casas: 2, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var t = num(P.test), h = num(P.hest);
      if (ok(t) && (t < 100 || t > 110)) avisos.push("Temperatura da estufa " + fmt(t, 0) + " °C fora de 105 ± 5 °C (6.5).");
      if (ok(h) && h < 3) avisos.push("Secagem de " + fmt(h, 1) + " h; a norma prescreve 3 h (6.5).");
      var tab = (d.det || []).map(function (p, i) {
        var M1 = num(p.M1), M2 = num(p.M2), M3 = num(p.M3), am = ok(M1) && ok(M2) ? M2 - M1 : NaN, rot = "Det. " + (i + 1);
        if (ok(am) && (am < 1 || am > 2)) avisos.push(rot + ": amostra de " + fmt(am, 4) + " g fora de 1 a 2 g (6.2).");
        if (ok(M3) && ok(M2) && ok(M1) && (M3 > M2 || M3 < M1)) avisos.push(rot + ": M₃ deve ficar entre M₁ e M₂ — confira as pesagens.");
        var ok3 = ok(am) && am > 0 && ok(M3);
        return { am: am, V: ok3 ? (M2 - M3) / am * 100 : NaN, NV: ok3 ? (M3 - M1) / am * 100 : NaN };
      });
      var nvs = tab.map(function (o) { return o.NV; });
      var dif = S.duplicata(nvs, 1.0, "Matéria não volátil", "%", avisos, "seção 9");
      var r = { NV: FE.media(nvs), V: FE.media(tab.map(function (o) { return o.V; })), dif: dif, lim: S.limite("naoVolatil", P) };
      r.conforme = S.confere(r.NV, r.lim);
      S.avisoLimite(avisos, "Matéria não volátil", r.NV, r.lim, "%", 2);
      // DNER-PRO 250: Vt = 100 − P; R = NV − P; S = R / Vt × 100
      var Pg = num(P.pig);
      if (ok(Pg) && ok(r.NV)) {
        r.P = Pg; r.Vt = 100 - Pg; r.R = r.NV - Pg; r.Sv = r.Vt > 0 ? r.R / r.Vt * 100 : NaN;
        if (r.R < 0) avisos.push("Pigmento maior que a matéria não volátil — confira os teores.");
        if (P.espec && P.espec !== "manual") {
          var lv = S.limite("veicNV", P), lt = S.limite("veicTotal", P);
          r.limS = lv; r.limVt = lt;
          r.confS = S.confere(r.Sv, lv); r.confVt = S.confere(r.Vt, lt);
          S.avisoLimite(avisos, "Veículo não volátil no veículo", r.Sv, lv, "%", 2);
          S.avisoLimite(avisos, "Veículo total na tinta", r.Vt, lt, "%", 2);
        }
      }
      return { tab: { det: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var h = '<div class="fe-res">' + S.itemRes(fmt(r.NV, 2) + " <small>%</small>", "Matéria não volátil — média de 2 determinações" +
        (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "%", 2)) + " " + S.selo(r.conforme) : "")) +
        S.itemRes(fmt(r.V, 2) + " <small>%</small>", "Matéria volátil — média", "fe-res-p") +
        S.itemRes(fmt(r.dif, 2) + " <small>%</small>", "Diferença entre as determinações de NV (máx. 1,00 %)", "fe-res-p");
      if (ok(r.Sv)) {
        h += S.itemRes(fmt(r.Vt, 2) + " <small>%</small>", "Veículo total na tinta Vt = 100 − P (PRO 250, 5.1)" + (r.limVt ? " · " + esc(S.textoLimite(r.limVt, "%", 2)) + " " + S.selo(r.confVt) : ""), "fe-res-p");
        h += S.itemRes(fmt(r.Sv, 2) + " <small>%</small>", "Veículo não volátil no veículo S = (NV − P)/Vt × 100 (PRO 250, 5.3)" + (r.limS ? " · " + esc(S.textoLimite(r.limS, "%", 2)) + " " + S.selo(r.confS) : ""), "fe-res-p");
      }
      return h + "</div>";
    },
    relatorio: {
      notas: "V = (M₂ − M₃)/(M₂ − M₁) × 100 e NV = (M₃ − M₁)/(M₂ − M₁) × 100 (seção 7). Resultado: média aritmética de duas determinações, que não podem variar mais de 1,00 % (seções 8 e 9; diferença verificada em pontos percentuais de NV). Com o teor de pigmento P (DNER-ME 237): veículo total Vt = 100 − P; veículo não volátil na tinta R = NV − P; no veículo S = R / Vt × 100 (DNER-PRO 250/94).",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = S.linhaTinta(d.params);
        rows.push(["Matéria não volátil (NV)", (ok(r.NV) ? fmt(r.NV, 2) + " %" : "—") + (r.lim ? " — " + S.parecer("", r.NV, r.lim, "%", 2) : "")]);
        rows.push(["Matéria volátil (V)", ok(r.V) ? fmt(r.V, 2) + " %" : "—"]);
        rows.push(["Diferença entre as determinações de NV", ok(r.dif) ? fmt(r.dif, 2) + " % (máximo 1,00 %)" : "—"]);
        if (ok(r.Sv)) {
          rows.push(["Teor de pigmento (DNER-ME 237)", fmt(r.P, 2) + " %"]);
          rows.push(["Veículo total na tinta (DNER-PRO 250)", fmt(r.Vt, 2) + " %" + (r.limVt ? " — " + S.parecer("", r.Vt, r.limVt, "%", 2) : "")]);
          rows.push(["Veículo não volátil na tinta (R)", fmt(r.R, 2) + " %"]);
          rows.push(["Veículo não volátil no veículo (S)", fmt(r.Sv, 2) + " %" + (r.limS ? " — " + S.parecer("", r.Sv, r.limS, "%", 2) : "")]);
        }
        return rows;
      },
    },
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — NV 66 %, com pigmento de 45,0 % (atende)", dados: function () {
        return { ident: { registro: "EX-TS-235-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368", test: "105", hest: "3", pig: "45,00" },
          det: [{ M1: "1,2034", M2: "2,7518", M3: "2,2261" }, { M1: "1,1987", M2: "2,6021", M3: "2,1245" }] };
      } },
      { nome: "Tinta acrílica emulsionada em água — NV abaixo de 77 % e determinações discrepantes", dados: function () {
        return { ident: { registro: "EX-TS-235-2", obra: "Obra B", origem: "Fornecedor C" },
          params: { tinta: "Acrílica emulsionada em água", cor: "amarela", lote: "0103", espec: "em276", test: "105", hest: "3" },
          det: [{ M1: "1,2102", M2: "2,8015", M3: "2,4086" }, { M1: "1,2055", M2: "2,6630", M3: "2,2826" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-235-94"].rotuloImportar = function (r) { return "não voláteis " + window.FE.fmt(r.NV, 2) + " %" + (window.FE.ok(r.Sv) ? " · veíc. NV " + window.FE.fmt(r.Sv, 2) + " % · veíc. total " + window.FE.fmt(r.Vt, 2) + " %" : ""); };
})();
