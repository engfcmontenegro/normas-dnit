/*
 * Ficha: DNER-PRO 250/94 — Cálculo do veículo total e do veículo não volátil em tinta para demarcação viária.
 * Com o teor de pigmento P (DNER-ME 237, 4.1) e a matéria não volátil NV / volátil V (DNER-ME 235, 4.2):
 *   Vt = 100 − P (5.1);  R = NV − P  ou  R = 100 − (P + V) (5.2);  S = R / Vt × 100 (5.3).
 * Uma coluna por amostra (tinta/cor/partida); P, NV e V digitados ou importados das fichas ME 237 e ME 235
 * (pareados pela partida e cor). Limites opcionais das EM de tinta (FE.sinalizacao, de dner-me-018-94.js).
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var TOL_SOMA = 0.05; // NV + V = 100 (as duas vêm das mesmas pesagens na DNER-ME 235); tolerância de arredondamento da ficha

  function chave(dados) { var p = dados.params || {}; return String(p.lote || "").trim() + "|" + (p.cor || ""); }
  function res(col) {
    var P = num(col.P), NV = num(col.NV), V = num(col.V), o = { P: P };
    o.Vt = ok(P) ? 100 - P : NaN;
    o.R1 = ok(NV) && ok(P) ? NV - P : NaN;
    o.R2 = ok(V) && ok(P) ? 100 - (P + V) : NaN;
    o.R = ok(o.R1) ? o.R1 : o.R2;
    o.S = ok(o.R) && ok(o.Vt) && o.Vt > 0 ? o.R / o.Vt * 100 : NaN;
    o.soma = ok(NV) && ok(V) ? NV + V : NaN;
    return o;
  }

  FE.FICHAS["dner-pro-250-94"] = {
    titulo: "Tinta para demarcação viária — Veículo total e veículo não volátil",
    resumo: "Com o teor de pigmento P (DNER-ME 237) e a matéria não volátil NV ou volátil V (DNER-ME 235): veículo total Vt = 100 − P, veículo não volátil na tinta R = NV − P = 100 − (P + V) e veículo não volátil no veículo S = R / Vt × 100 (seção 5), em % em massa.",
    blocos: [],
    params: [
      { k: "tinta", r: "Tinta (resina / produto)", ph: "ex.: acrílica base solvente" },
      { k: "imp", r: "Importar P (DNER-ME 237) e NV/V (DNER-ME 235) de ensaios salvos ou exemplos", tipo: "importarVarios", de: ["dner-me-237-94", "dner-me-235-94"],
        dica: "os ensaios da mesma partida e cor vão para a mesma coluna; o pigmento da ME 237 prevalece sobre o informado na ME 235",
        aplicar: function (lista, P, d) {
          var cols = [], idx = {};
          (d.am || []).forEach(function (c) { // mantém as colunas digitadas (não vazias)
            if (!c.imp && ["id", "P", "NV", "V"].some(function (k) { return String(c[k] || "").trim(); })) cols.push(c);
          });
          lista.forEach(function (e) {
            var k = chave(e.dados), r = e.resultados || {}, p = e.dados.params || {}, reg = (e.dados.ident || {}).registro || "";
            if (!(k in idx)) { idx[k] = cols.length; cols.push({ imp: "1", id: [p.lote ? "partida " + p.lote : "", p.cor || ""].filter(Boolean).join(", "), orig: "" }); }
            var c = cols[idx[k]];
            if (e.ficha === "dner-me-237-94" && ok(r.pct)) { c.P = fmt(r.pct, 2); c.deP = "1"; }
            if (e.ficha === "dner-me-235-94") {
              if (ok(r.NV)) c.NV = fmt(r.NV, 2);
              if (ok(r.V)) c.V = fmt(r.V, 2);
              if (!c.deP && ok(r.P)) c.P = fmt(r.P, 2);
            }
            c.orig = (c.orig ? c.orig + "; " : "") + (e.ficha === "dner-me-237-94" ? "ME 237 " : "ME 235 ") + reg;
            if (!P.tinta && p.tinta) P.tinta = p.tinta;
            if (!P.espec && p.espec && p.espec !== "manual") P.espec = p.espec;
          });
          cols.forEach(function (c) { delete c.deP; });
          d.am = cols.length ? cols : [{}];
        } },
    ].concat(S.paramsEspec("veicNV")),
    padrao: { espec: "" },
    tabelas: function () {
      return [{ chave: "am", titulo: "Amostras de tinta (seções 4 e 5)", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "uma coluna por partida/cor; informe NV ou V (ou ambos)",
        linhas: [
          { k: "id", r: "Identificação (partida, cor)", texto: true },
          { k: "orig", r: "Origem dos teores (ensaios)", texto: true },
          { grupo: "Teores determinados (seção 4)" },
          { k: "P", r: "Teor de pigmento P — DNER-ME 237 (4.1)", u: "%" },
          { k: "NV", r: "Matéria não volátil NV — DNER-ME 235 (4.2)", u: "%" },
          { k: "V", r: "Matéria volátil V — DNER-ME 235", u: "%" },
          { grupo: "Cálculos (seção 5)" },
          { calc: "Vt", r: "Veículo total na tinta Vt = 100 − P (5.1)", u: "%", casas: 2, destaque: true },
          { calc: "R1", r: "Veículo não volátil na tinta R = NV − P (5.2)", u: "%", casas: 2 },
          { calc: "R2", r: "Veículo não volátil na tinta R = 100 − (P + V) (5.2)", u: "%", casas: 2 },
          { calc: "S", r: "Veículo não volátil no veículo S = R / Vt × 100 (5.3)", u: "%", casas: 2, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var limS = S.limite("veicNV", P), limVt = P.espec && P.espec !== "manual" ? S.limite("veicTotal", P) : null;
      var tab = (d.am || []).map(function (c, i) {
        var o = res(c), rot = "Amostra " + (i + 1) + (c.id ? " (" + c.id + ")" : "");
        if (!ok(o.P) && (ok(num(c.NV)) || ok(num(c.V)))) avisos.push(rot + ": falta o teor de pigmento (DNER-ME 237, 4.1).");
        if (ok(o.P) && !ok(num(c.NV)) && !ok(num(c.V))) avisos.push(rot + ": falta a matéria não volátil ou volátil (DNER-ME 235, 4.2) para o veículo não volátil.");
        if (ok(o.P) && (o.P <= 0 || o.P >= 100)) avisos.push(rot + ": teor de pigmento fora de 0 a 100 %.");
        if (ok(o.soma) && Math.abs(o.soma - 100) > TOL_SOMA) avisos.push(rot + ": NV + V = " + fmt(o.soma, 2) + " % ≠ 100 % — as duas fórmulas de 5.2 dão R = " + fmt(o.R1, 2) + " % e " + fmt(o.R2, 2) + " %; confira (a ficha usa R = NV − P).");
        if (ok(o.R) && o.R < 0) avisos.push(rot + ": pigmento maior que a matéria não volátil (R < 0) — confira os teores.");
        o.confS = S.confere(o.S, limS); o.confVt = S.confere(o.Vt, limVt);
        S.avisoLimite(avisos, rot + ": veículo não volátil no veículo S", o.S, limS, "%", 2);
        S.avisoLimite(avisos, rot + ": veículo total Vt", o.Vt, limVt, "%", 2);
        o.id = c.id || "Amostra " + (i + 1);
        return o;
      });
      var r = { am: tab, limS: limS, limVt: limVt, n: tab.filter(function (o) { return ok(o.S) || ok(o.Vt); }).length };
      r.Vt = tab.length ? tab[0].Vt : NaN; r.R = tab.length ? tab[0].R : NaN; r.S = tab.length ? tab[0].S : NaN; r.P = tab.length ? tab[0].P : NaN;
      return { tab: { am: tab }, resultados: r, avisos: avisos };
    },
    rotuloImportar: function (r) { return "veíc. total " + fmt(r.Vt, 2) + " % · veíc. NV no veículo " + fmt(r.S, 2) + " %"; },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, cls) { return '<div class="fe-res-item' + (cls ? " " + cls : "") + '"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' + r.am.map(function (o) {
        return cx(fmt(o.Vt, 2) + " <small>%</small>", esc(o.id) + " — veículo total Vt (5.1)" + (r.limVt ? " · exigido " + esc(S.textoLimite(r.limVt, "%", 2)) + " " + S.selo(o.confVt) : "")) +
          cx(fmt(o.R, 2) + " <small>%</small>", esc(o.id) + " — veículo não volátil na tinta R (5.2)", "fe-res-p") +
          cx(fmt(o.S, 2) + " <small>%</small>", esc(o.id) + " — veículo não volátil no veículo S (5.3)" + (r.limS ? " · exigido " + esc(S.textoLimite(r.limS, "%", 2)) + " " + S.selo(o.confS) : ""));
      }).join("") + "</div>";
    },
    relatorio: {
      notas: "Cálculo conforme a DNER-PRO 250/94, em % em massa: veículo total Vt = 100 − P (5.1); veículo não volátil na tinta R = NV − P ou R = 100 − (P + V) (5.2); veículo não volátil no veículo S = R / Vt × 100 (5.3). P = teor de pigmento (DNER-ME 237); NV e V = matéria não volátil e volátil (DNER-ME 235). Como NV + V = 100, as duas fórmulas de 5.2 coincidem; se divergirem, a ficha usa R = NV − P e avisa. Resultados com duas casas decimais, como os ensaios de origem. Limites (opcionais): veículo não volátil no veículo e veículo total da especificação de material escolhida.",
      resultados: function (calc) {
        var r = calc.resultados, rows = [];
        r.am.forEach(function (o) {
          var pre = r.am.length > 1 ? o.id + " — " : "";
          rows.push([pre + "Teor de pigmento P", ok(o.P) ? fmt(o.P, 2) + " %" : "—"]);
          rows.push([pre + "Veículo total na tinta Vt", (ok(o.Vt) ? fmt(o.Vt, 2) + " %" : "—") + (r.limVt ? " — " + S.parecer("", o.Vt, r.limVt, "%", 2) : "")]);
          rows.push([pre + "Veículo não volátil na tinta R", ok(o.R) ? fmt(o.R, 2) + " %" : "—"]);
          rows.push([pre + "Veículo não volátil no veículo S", (ok(o.S) ? fmt(o.S, 2) + " %" : "—") + (r.limS ? " — " + S.parecer("", o.S, r.limS, "%", 2) : "")]);
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "Tinta branca base solvente, uma partida — atende a DNER-EM 368/00", dados: function () {
        return { ident: { registro: "EX-PRO250-01", data: "2025-04-30", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", espec: "em368" },
          am: [{ id: "partida 0002, branca", orig: "Laudo do laboratório (ME 237 e ME 235)", P: "44,50", NV: "66,20", V: "33,80" }] };
      } },
      { nome: "P e NV importados das fichas ME 237 e ME 235 (S abaixo de 38 %) e partida digitada com NV + V ≠ 100 %", dados: function () {
        var A = FE.aceitacao, F = FE.FICHAS["dner-pro-250-94"];
        var d = { ident: { registro: "EX-PRO250-02", data: "2025-08-21", obra: "Obra B", origem: "Fornecedor B" }, params: { tinta: "", espec: "" },
          am: [{ id: "partida 0418, branca", orig: "Laudo do laboratório (ME 237 e ME 235)", P: "46,30", NV: "68,10", V: "32,40" }] };
        return A.exemplos.importar(F.params, d, "imp", [["dner-me-237-94", 0], ["dner-me-235-94", 0]]);
      } },
    ],
  };
})();
