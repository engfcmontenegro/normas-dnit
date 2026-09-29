/*
 * Ficha: DNER-ME 241/94 — Material termoplástico — Dióxido de titânio no pigmento (redutor de Jones).
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * Equivalência do KMnO₄ (4.7.1): T = W × 1,192 / Vp (g de TiO₂ por ml).
 * TiO₂ na matéria mineral (6.1): (V − B) × T / S × 100.
 * Matéria mineral (6.2) = 100 − teor de ligante (DNER-ME 248/94); TiO₂ no termoplástico (6.3) = TiO₂ mineral × matéria mineral / 100.
 * Limite opcional: DNER-EM 372/2000, 5.2 — termoplástico branco com no mínimo 10 % de TiO₂ na composição final.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ESPEC = [["372", "DNER-EM 372/2000 — termoplástico branco: TiO₂ ≥ 10 % (5.2)", 10, null, "DNER-EM 372/2000, 5.2"]];

  FE.FICHAS["dner-me-241-94"] = {
    titulo: "Material termoplástico — dióxido de titânio no pigmento",
    resumo: "1,000 0 g de matéria mineral (DNER-ME 248) solubilizados em H₂SO₄ + (NH₄)₂SO₄, reduzidos no redutor de Jones e titulados com KMnO₄ 0,1 N: TiO₂ % = (V − B) × T / S × 100 na matéria mineral; no termoplástico, × (100 − ligante) / 100.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: termoplástico branco" },
      { k: "ligante", r: "Teor de ligante do termoplástico (%) — DNER-ME 248/94", dica: "matéria mineral = 100 − teor de ligante (6.2)" },
      S.importar248(),
      { k: "modoT", r: "Equivalência T da solução de KMnO₄ (4.7)", tipo: "select", recarrega: true,
        opcoes: [["pad", "Padronizar com oxalato de sódio (tabela abaixo)"], ["inf", "Informar T de padronização anterior"]],
        dica: "recomenda-se padronizar pelo menos bimensalmente (4.7.1, nota)" },
      { k: "T", r: "T — g de TiO₂ por ml de KMnO₄", ph: "ex.: 0,00800", se: function (d) { return (d.params || {}).modoT === "inf"; } },
      { k: "dataT", r: "Data da padronização", tipo: "date", se: function (d) { return (d.params || {}).modoT === "inf"; } },
    ].concat(S.paramsLimite(ESPEC, "%", "DNER-EM 372/2000 (5.2) — termoplástico branco")),
    padrao: { modoT: "pad", espec: "" },
    tabelas: function (d) {
      var t = [];
      if ((d.params || {}).modoT !== "inf") t.push({
        chave: "pad", titulo: "Padronização do KMnO₄ com oxalato de sódio (4.7)", rotulo: "Titulação", iniciais: 1, min: 1,
        dica: "0,250 0 g a 0,300 0 g de Na₂C₂O₄ seco a 105–110 °C em 250 ml de água a 80–90 °C + 15 ml de H₂SO₄ (1:1); titular acima de 60 °C",
        linhas: [
          { k: "W", r: "Massa de oxalato de sódio, W", u: "g" },
          { k: "Vp", r: "Volume de KMnO₄ gasto, Vp", u: "ml" },
          { calc: "T", r: "T = W × 1,192 / Vp (4.7.1)", u: "g/ml", casas: 6, destaque: true },
        ],
      });
      t.push({
        chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 1, min: 1,
        dica: "titular imediatamente após retirar o frasco recebedor (5.10); prova em branco com os mesmos reagentes pelo redutor (5.11)",
        linhas: [
          { k: "S", r: "Massa de matéria mineral, S (5.1 — 1,000 0 g)", u: "g" },
          { k: "V", r: "KMnO₄ gasto na titulação da amostra, V (5.10)", u: "ml" },
          { k: "B", r: "KMnO₄ gasto na prova em branco, B (5.11)", u: "ml" },
          { calc: "tm", r: "TiO₂ na matéria mineral = (V − B) × T / S × 100 (6.1)", u: "%", casas: 2 },
          { calc: "tt", r: "TiO₂ no termoplástico (6.3)", u: "%", casas: 2, destaque: true },
        ],
      });
      return t;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], inf = P.modoT === "inf";
      var pad = (inf ? [] : d.pad || []).map(function (x, i) {
        var W = num(x.W), Vp = num(x.Vp);
        if (ok(W) && (W < 0.25 - 1e-9 || W > 0.3 + 1e-9)) avisos.push("Padronização " + (i + 1) + ": " + fmt(W, 4) + " g de oxalato — a norma pede de 0,250 0 g a 0,300 0 g (4.7 a).");
        return { T: ok(W) && ok(Vp) && Vp > 0 ? W * 1.192 / Vp : NaN };
      });
      var T = inf ? num(P.T) : media(pad.map(function (o) { return o.T; }));
      if (ok(T) && Math.abs(T - 0.008) / 0.008 > 0.1) avisos.push("T = " + fmt(T, 6) + " g/ml, longe do nominal de 0,008 g/ml da solução 0,1 N (4.6) — confira a padronização.");
      if (!ok(T)) avisos.push("Informe a padronização do KMnO₄ (T) para calcular.");
      var lig = num(P.ligante), mineral = ok(lig) ? 100 - lig : NaN;
      if (!ok(lig)) avisos.push("Informe o teor de ligante (DNER-ME 248/94) para expressar o TiO₂ no termoplástico (6.2, 6.3).");
      var dets = (d.det || []).map(function (x, i) {
        var Sm = num(x.S), V = num(x.V), B = num(x.B), rot = "Determinação " + (i + 1) + ": ";
        var tm = ok(Sm) && Sm > 0 && ok(V) && ok(B) && ok(T) ? (V - B) * T / Sm * 100 : NaN;
        if (ok(Sm) && Math.abs(Sm - 1) > 0.01 + 1e-9) avisos.push(rot + "massa de " + fmt(Sm, 4) + " g; a norma pede 1,000 0 g (5.1) — aviso acima de 1 %.");
        if (ok(V) && !ok(num(x.B))) avisos.push(rot + "informe a prova em branco, B (5.11).");
        if (ok(V) && ok(B) && V <= B) avisos.push(rot + "volume da amostra menor ou igual ao do branco — confira.");
        return { tm: tm, tt: ok(tm) && ok(mineral) ? tm * mineral / 100 : NaN };
      });
      var tmM = media(dets.map(function (o) { return o.tm; })), ttM = media(dets.map(function (o) { return o.tt; }));
      var tt = ok(ttM) ? Math.round(ttM * 10) / 10 : NaN;
      var lim = S.limite(P, ESPEC), conf = S.confere(tt, lim);
      if (lim && !ok(tt) && ok(tmM)) avisos.push("A especificação refere-se ao teor na composição final do produto: informe o teor de ligante.");
      if (conf === false) avisos.unshift("TiO₂ no termoplástico de " + fmt(tt, 1) + " %, abaixo do mínimo de " + fmt(lim.min, 0) + " % (" + lim.ref + ").");
      return { tab: { pad: pad, det: dets }, resultados: { T: T, tm: tmM, tt: tt, mineral: mineral, n: dets.filter(function (o) { return ok(o.tm); }).length, lim: lim, conforme: conf }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card((ok(r.tt) ? fmt(r.tt, 1) : "—") + " <small>%</small>",
        "TiO₂ no material termoplástico (6.3)" + (r.lim ? " · " + esc(S.textoLim(r.lim, 0, "%")) + S.sit(r.conforme) : ""), true) +
        S.card(ok(r.tm) ? fmt(r.tm, 2) + " %" : "—", "TiO₂ na matéria mineral (6.1)" + (r.n > 1 ? " — média de " + r.n : "")) +
        S.card(ok(r.mineral) ? fmt(r.mineral, 1) + " %" : "—", "Matéria mineral = 100 − ligante (6.2)") +
        S.card(ok(r.T) ? fmt(r.T, 6) : "—", "T — g de TiO₂ por ml de KMnO₄ (4.7.1)") + "</div>";
    },
    relatorio: {
      notas: "T = W × 1,192 / Vp (4.7.1). TiO₂ na matéria mineral = (V − B) × T / S × 100 (6.1); matéria mineral = 100 − teor de ligante (DNER-ME 248/94) (6.2); " +
        "TiO₂ no termoplástico = TiO₂ na matéria mineral × % matéria mineral / 100 (6.3). O resultado é expresso em % de TiO₂ em massa no material termoplástico (7), com uma casa decimal (a norma não fixa o arredondamento).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Equivalência do KMnO₄ (T)", ok(r.T) ? fmt(r.T, 6) + " g de TiO₂/ml" + (P.modoT === "inf" && P.dataT ? " (padronizado em " + P.dataT.split("-").reverse().join("/") + ")" : "") : "—"]);
        rows.push(["TiO₂ na matéria mineral", ok(r.tm) ? fmt(r.tm, 2) + " %" : "—"]);
        rows.push(["Matéria mineral (100 − ligante)", ok(r.mineral) ? fmt(r.mineral, 1) + " %" : "—"]);
        rows.push(["Dióxido de titânio no material termoplástico", ok(r.tt) ? fmt(r.tt, 1) + " %" : "—"]);
        if (r.lim) rows.push(["Especificação", S.textoLim(r.lim, 0, "%") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Termoplástico branco — 10,3 % de TiO₂", dados: function () {
        return { ident: { registro: "EX-TP241-01", data: "2026-04-03", obra: "Obra A", local: "Partida 115", origem: "Fornecedor D", camada: "Termoplástico branco (extrusão)" },
          params: { material: "Termoplástico branco", ligante: "20,0", modoT: "pad", espec: "372" },
          pad: [{ W: "0,2800", Vp: "41,70" }],
          det: [{ S: "1,0000", V: "16,20", B: "0,10" }] };
      } },
      { nome: "Termoplástico branco — TiO₂ abaixo de 10 % (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP241-02", data: "2026-04-04", obra: "Obra B", local: "Partida 90", origem: "Fornecedor E", camada: "Termoplástico branco (aspersão)" },
          params: { material: "Termoplástico branco", ligante: "22,5", modoT: "inf", T: "0,008004", dataT: "2026-03-02", espec: "372" },
          det: [{ S: "1,0002", V: "13,10", B: "0,10" }, { S: "0,9998", V: "13,05", B: "0,10" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-241-94"].rotuloImportar = function (r) { return "TiO₂ " + window.FE.fmt(r.tt, 1) + " % na composição"; };
})();
