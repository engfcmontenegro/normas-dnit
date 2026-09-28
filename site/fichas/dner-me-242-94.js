/*
 * Ficha: DNER-ME 242/94 — Material termoplástico — Cromato de chumbo no pigmento.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * PbCrO₄ na matéria mineral (6.1) = B × N × 0,1077 × 100 / A (titulação iodométrica com tiossulfato de sódio).
 * Matéria mineral (6.2) = 100 − teor de ligante (DNER-ME 248/94); PbCrO₄ no termoplástico (6.3) = PbCrO₄ mineral × matéria mineral / 100.
 * Limite opcional: DNER-EM 372/2000, 5.2 — termoplástico amarelo com no mínimo 2 % de cromato de chumbo na mistura.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ESPEC = [["372", "DNER-EM 372/2000 — termoplástico amarelo: PbCrO₄ ≥ 2 % (5.2)", 2, null, "DNER-EM 372/2000, 5.2"]];

  FE.FICHAS["dner-me-242-94"] = {
    titulo: "Material termoplástico — cromato de chumbo no pigmento",
    resumo: "1,000 0 g de matéria mineral (DNER-ME 248) dissolvidos em solução de NaCl + HCl, + 10 ml de KI a 300 g/l e titulados com tiossulfato de sódio 0,1 N (amido): PbCrO₄ % = B × N × 0,1077 × 100 / A na matéria mineral; no termoplástico, × (100 − ligante) / 100.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: termoplástico amarelo" },
      { k: "ligante", r: "Teor de ligante do termoplástico (%) — DNER-ME 248/94", dica: "matéria mineral = 100 − teor de ligante (6.2)" },
      S.importar248(),
      { k: "N", r: "Normalidade da solução de tiossulfato de sódio, N (4.2.3)", ph: "0,1000", dica: "padronizada com bicromato de potássio" },
    ].concat(S.paramsLimite(ESPEC, "%", "DNER-EM 372/2000 (5.2) — termoplástico amarelo")),
    padrao: { espec: "" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 1, min: 1,
        dica: "manter a solução fria para o iodo não volatilizar (5.3); amido quando a cor ficar amarelo-pálida, até desaparecer o azul (5.4, 5.5)",
        linhas: [
          { k: "A", r: "Massa de matéria mineral, A (5.1 — 1,000 0 g)", u: "g" },
          { k: "B", r: "Tiossulfato gasto na titulação, B (5.6)", u: "ml" },
          { calc: "pm", r: "PbCrO₄ na matéria mineral = B × N × 0,1077 × 100 / A (6.1)", u: "%", casas: 2 },
          { calc: "pt", r: "PbCrO₄ no termoplástico (6.3)", u: "%", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var N = ok(num(P.N)) ? num(P.N) : NaN;
      if (!ok(N)) avisos.push("Informe a normalidade N da solução de tiossulfato de sódio (4.2.3).");
      else if (Math.abs(N - 0.1) / 0.1 > 0.1) avisos.push("N = " + fmt(N, 4) + " — a solução prescrita é 0,1 N (4.2.3); confira a padronização.");
      var lig = num(P.ligante), mineral = ok(lig) ? 100 - lig : NaN;
      if (!ok(lig)) avisos.push("Informe o teor de ligante (DNER-ME 248/94) para expressar o PbCrO₄ no termoplástico (6.2, 6.3).");
      var dets = (d.det || []).map(function (x, i) {
        var A = num(x.A), B = num(x.B), rot = "Determinação " + (i + 1) + ": ";
        var pm = ok(A) && A > 0 && ok(B) && ok(N) ? B * N * 0.1077 * 100 / A : NaN;
        if (ok(A) && Math.abs(A - 1) > 0.01 + 1e-9) avisos.push(rot + "massa de " + fmt(A, 4) + " g; a norma pede 1,000 0 g (5.1) — aviso acima de 1 %.");
        return { pm: pm, pt: ok(pm) && ok(mineral) ? pm * mineral / 100 : NaN };
      });
      var pmM = media(dets.map(function (o) { return o.pm; })), ptM = media(dets.map(function (o) { return o.pt; }));
      var pt = ok(ptM) ? Math.round(ptM * 100) / 100 : NaN;
      var lim = S.limite(P, ESPEC), conf = S.confere(pt, lim);
      if (lim && !ok(pt) && ok(pmM)) avisos.push("A especificação refere-se ao teor na mistura: informe o teor de ligante.");
      if (conf === false) avisos.unshift("PbCrO₄ no termoplástico de " + fmt(pt, 2) + " %, abaixo do mínimo de " + fmt(lim.min, 0) + " % (" + lim.ref + ").");
      return { tab: { det: dets }, resultados: { pm: pmM, pt: pt, mineral: mineral, n: dets.filter(function (o) { return ok(o.pm); }).length, lim: lim, conforme: conf }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card((ok(r.pt) ? fmt(r.pt, 2) : "—") + " <small>%</small>",
        "Cromato de chumbo no material termoplástico (6.3)" + (r.lim ? " · " + esc(S.textoLim(r.lim, 0, "%")) + S.sit(r.conforme) : ""), true) +
        S.card(ok(r.pm) ? fmt(r.pm, 2) + " %" : "—", "PbCrO₄ na matéria mineral (6.1)" + (r.n > 1 ? " — média de " + r.n : "")) +
        S.card(ok(r.mineral) ? fmt(r.mineral, 1) + " %" : "—", "Matéria mineral = 100 − ligante (6.2)") + "</div>";
    },
    relatorio: {
      notas: "PbCrO₄ na matéria mineral = B × N × 0,1077 × 100 / A (6.1), com A = massa da amostra (g), B = ml de tiossulfato e N = normalidade do tiossulfato; matéria mineral = 100 − teor de ligante (DNER-ME 248/94) (6.2); " +
        "PbCrO₄ no termoplástico = PbCrO₄ na matéria mineral × % matéria mineral / 100 (6.3). Resultado em % de cromato de chumbo em massa no material termoplástico (7), com duas casas decimais (a norma não fixa o arredondamento).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["PbCrO₄ na matéria mineral", ok(r.pm) ? fmt(r.pm, 2) + " %" : "—"]);
        rows.push(["Matéria mineral (100 − ligante)", ok(r.mineral) ? fmt(r.mineral, 1) + " %" : "—"]);
        rows.push(["Cromato de chumbo no material termoplástico", ok(r.pt) ? fmt(r.pt, 2) + " %" : "—"]);
        if (r.lim) rows.push(["Especificação", S.textoLim(r.lim, 0, "%") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Termoplástico amarelo — 2,93 % de PbCrO₄", dados: function () {
        return { ident: { registro: "EX-TP242-01", data: "2026-04-03", obra: "Obra A", local: "Partida 88", origem: "Fornecedor D", camada: "Termoplástico amarelo (extrusão)" },
          params: { material: "Termoplástico amarelo", ligante: "20,0", N: "0,1000", espec: "372" },
          det: [{ A: "1,0000", B: "3,40" }] };
      } },
      { nome: "Termoplástico amarelo — PbCrO₄ abaixo de 2 % (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP242-02", data: "2026-04-04", obra: "Obra B", local: "Partida 91", origem: "Fornecedor E", camada: "Termoplástico amarelo (aspersão)" },
          params: { material: "Termoplástico amarelo", ligante: "20,0", N: "0,1000", espec: "372" },
          det: [{ A: "1,0001", B: "2,20" }, { A: "0,9997", B: "2,25" }] };
      } },
    ],
  };
})();
