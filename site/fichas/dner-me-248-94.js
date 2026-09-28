/*
 * Ficha: DNER-ME 248/94 — Material termoplástico — Teor de ligante.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * Teor de ligante % = (C + A − B) / C × 100 (5): A = tubo vazio; B = tubo + material após a extração e secagem;
 * C = massa da amostra (30,0 g). O resíduo (B − A) é a matéria mineral usada nas DNER-ME 241, 242 e 249/94,
 * que importam deste ensaio o teor de ligante. Limites opcionais: DNER-EM 372/2000 — ligante 18 % a 24 % (5.1)
 * e partículas granulares + pigmentos + microesferas (matéria mineral) 76 % a 82 % (5.3).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ESPEC = [["372", "DNER-EM 372/2000 — ligante 18 % a 24 % (5.1); matéria mineral 76 % a 82 % (5.3)", 18, 24, "DNER-EM 372/2000, 5.1"]];

  FE.FICHAS["dner-me-248-94"] = {
    titulo: "Material termoplástico — teor de ligante",
    resumo: "30,0 g de termoplástico em tubo de centrífuga tarado; 5 extrações com tolueno + acetona (1:1), 2 com acetona e 1 com éter etílico, centrifugando e descartando o sobrenadante; secar a (105 ± 5) °C até massa constante: ligante % = (C + A − B) / C × 100.",
    blocos: [],
    params: [{ k: "material", r: "Material", ph: "ex.: termoplástico branco (extrusão)" },
      { k: "tEstufa", r: "Temperatura de secagem (4.5 — 105 ± 5 °C) — registrado (°C)" },
      { k: "extracoes", r: "Extrações feitas (4.1 a 4.4 — 5 tolueno/acetona + 2 acetona + 1 éter)", ph: "ex.: 5 + 2 + 1" }]
      .concat(S.paramsLimite(ESPEC, "%", "DNER-EM 372/2000 (5.1 e 5.3)")),
    padrao: { espec: "" },
    rotuloImportar: function (r) { return "ligante " + fmt(r.teor, 1) + " %"; },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 1, min: 1,
        dica: "pesagens com aproximação de 0,000 1 g (4.1); secar até massa constante (4.5)",
        linhas: [
          { k: "A", r: "Tubo centrifugador vazio, A (4.1)", u: "g" },
          { k: "C", r: "Massa da amostra de termoplástico, C (4.1 — 30,0 g)", u: "g" },
          { k: "B", r: "Tubo + material após extração e secagem, B (4.5)", u: "g" },
          { calc: "mm", r: "Matéria mineral = B − A", u: "g", casas: 4 },
          { calc: "lig", r: "Teor de ligante = (C + A − B) / C × 100 (5)", u: "%", casas: 2, destaque: true },
          { calc: "min", r: "Matéria mineral = 100 − teor de ligante", u: "%", casas: 2 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var tE = num(P.tEstufa);
      if (ok(tE) && (tE < 100 || tE > 110)) avisos.push("Secagem a " + fmt(tE, 0) + " °C — a norma prescreve (105 ± 5) °C (4.5).");
      var dets = (d.det || []).map(function (x, i) {
        var A = num(x.A), B = num(x.B), C = num(x.C), rot = "Determinação " + (i + 1) + ": ";
        var o = { mm: ok(A) && ok(B) ? B - A : NaN };
        o.lig = ok(o.mm) && ok(C) && C > 0 ? (C - o.mm) / C * 100 : NaN;
        o.min = ok(o.lig) ? 100 - o.lig : NaN;
        if (ok(C) && Math.abs(C - 30) > 0.3 + 1e-9) avisos.push(rot + "amostra de " + fmt(C, 2) + " g; a norma pede 30,0 g (4.1) — aviso acima de 1 %.");
        if (ok(o.mm) && o.mm <= 0) avisos.push(rot + "B menor ou igual a A — confira as pesagens.");
        if (ok(o.lig) && o.lig < 0) avisos.push(rot + "teor de ligante negativo — confira as pesagens.");
        return o;
      });
      var vals = dets.map(function (o) { return o.lig; }).filter(ok);
      var teor = vals.length ? Math.round(media(vals) * 10) / 10 : NaN, mineral = ok(teor) ? Math.round((100 - teor) * 10) / 10 : NaN;
      var lim = S.limite(P, ESPEC), conf = S.confere(teor, lim), confMin = P.espec === "372" ? S.confere(mineral, { min: 76, max: 82 }) : null;
      if (conf === false) avisos.unshift("Teor de ligante de " + fmt(teor, 1) + " %, fora do limite de " + S.textoLim(lim, 0, "%") + " (" + lim.ref + ").");
      if (confMin === false) avisos.unshift("Matéria mineral (partículas granulares, pigmentos e microesferas) de " + fmt(mineral, 1) + " %, fora de 76 % a 82 % (DNER-EM 372/2000, 5.3).");
      var amp = vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN;
      return { tab: { det: dets }, resultados: { teor: teor, mineral: mineral, n: vals.length, amp: amp, lim: lim, conforme: conf, confMin: confMin }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card((ok(r.teor) ? fmt(r.teor, 1) : "—") + " <small>%</small>",
        "Teor de ligante" + (r.n > 1 ? " — média de " + r.n + " determinações" : "") + (r.lim ? " · limite " + esc(S.textoLim(r.lim, 0, "%")) + S.sit(r.conforme) : ""), true) +
        S.card(ok(r.mineral) ? fmt(r.mineral, 1) + " %" : "—", "Matéria mineral (100 − ligante)" + (r.confMin === null ? "" : " · 76 % a 82 %" + S.sit(r.confMin))) +
        (ok(r.amp) ? S.card(fmt(r.amp, 2) + " %", "Diferença entre determinações (a norma não fixa tolerância)") : "") + "</div>";
    },
    relatorio: {
      notas: "Teor de ligante % = (C + A − B) / C × 100 (5), com A = massa do tubo centrifugador vazio, B = tubo com o material após a extração e a secagem a (105 ± 5) °C até massa constante e C = massa da amostra. " +
        "O resíduo é a matéria mineral usada nas DNER-ME 241, 242 e 249/94. Resultado com uma casa decimal (a norma não fixa o arredondamento).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Teor de ligante", (ok(r.teor) ? fmt(r.teor, 1) + " %" : "—") + (r.n > 1 ? " (média de " + r.n + " determinações)" : "")]);
        rows.push(["Matéria mineral", ok(r.mineral) ? fmt(r.mineral, 1) + " %" : "—"]);
        if (r.lim) rows.push(["Especificação — ligante", S.textoLim(r.lim, 0, "%") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        if (r.confMin !== null) rows.push(["Especificação — matéria mineral", "76 % a 82 % (DNER-EM 372/2000, 5.3)" + S.sitTxt(r.confMin)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Termoplástico branco — duplicata, 20,1 %", dados: function () {
        return { ident: { registro: "EX-TP248-01", data: "2026-04-01", obra: "Obra A", local: "Partida 115", origem: "Fornecedor D", camada: "Termoplástico branco (extrusão)" },
          params: { material: "Termoplástico branco", tEstufa: "105", extracoes: "5 + 2 + 1", espec: "372" },
          det: [{ A: "62,4512", C: "30,0105", B: "86,4561" }, { A: "61,9876", C: "30,0021", B: "85,9340" }] };
      } },
      { nome: "Termoplástico amarelo — ligante acima de 24 % (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP248-02", data: "2026-04-02", obra: "Obra B", local: "Partida 88", origem: "Fornecedor E", camada: "Termoplástico amarelo (aspersão)" },
          params: { material: "Termoplástico amarelo", tEstufa: "105", extracoes: "5 + 2 + 1", espec: "372" },
          det: [{ A: "62,1000", C: "30,0050", B: "84,1837" }] };
      } },
    ],
  };
})();
