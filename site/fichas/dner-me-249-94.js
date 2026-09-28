/*
 * Ficha: DNER-ME 249/94 — Material termoplástico — Teor de microesferas de vidro.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * % de microesferas = A / M × 1,30 (5), A = material recolhido na placa inclinada, M = matéria mineral ensaiada
 * (≈ 4,000 0 g, DNER-ME 248/94). A fórmula impressa não tem o fator 100: a ficha calcula A / M × 1,30 × 100.
 * Sobre a matéria mineral; no termoplástico (composição final), × (100 − teor de ligante) / 100 — conversão da ficha,
 * análoga à 6.3 das DNER-ME 241 e 242/94. Limite opcional: DNER-EM 372/2000, 5.8 a — "innermix" (tipo I A) 18 % a 22 %
 * em massa da composição final. Nota da norma: o material recolhido deve ter no mínimo 70 % de partículas esféricas.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ESPEC = [["372", "DNER-EM 372/2000 — microesferas \"innermix\" 18 % a 22 % da composição final (5.8 a)", 18, 22, "DNER-EM 372/2000, 5.8 a"]];

  FE.FICHAS["dner-me-249-94"] = {
    titulo: "Material termoplástico — teor de microesferas de vidro",
    resumo: "≈ 4 g de matéria mineral (DNER-ME 248) atacados com HCl (1:1), lavados, secos e rolados em placa de vidro inclinada a 20° sob vibração; % de microesferas = A / M × 1,30 (× 100) na matéria mineral; no termoplástico, × (100 − ligante) / 100.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: termoplástico branco" },
      { k: "ligante", r: "Teor de ligante do termoplástico (%) — DNER-ME 248/94", dica: "para expressar o teor na composição final do produto" },
      S.importar248(),
      { k: "inclin", r: "Inclinação da placa de vidro (4.6 — aprox. 20°) — registrado (°)" },
    ].concat(S.paramsLimite(ESPEC, "%", "DNER-EM 372/2000 (5.8 a)")),
    padrao: { espec: "" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 1, min: 1,
        dica: "o HCl (1:1) elimina os carbonatos de cálcio e magnésio (4.1); recolher as partículas que rolam até a extremidade inferior da placa (4.7)",
        linhas: [
          { k: "M", r: "Massa de matéria mineral, M (4.1 — aprox. 4,000 0 g)", u: "g" },
          { k: "A", r: "Massa de material recolhido, A (4.8)", u: "g" },
          { k: "esf", r: "Partículas esféricas no material recolhido (nota — mín. 70 %) — opcional", u: "%" },
          { calc: "pm", r: "Microesferas = A / M × 1,30 × 100 (5) — na matéria mineral", u: "%", casas: 2 },
          { calc: "pt", r: "Microesferas no termoplástico = × (100 − ligante) / 100", u: "%", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var inc = num(P.inclin);
      if (ok(inc) && Math.abs(inc - 20) > 2) avisos.push("Placa a " + fmt(inc, 0) + "° — a norma indica aproximadamente 20° (4.6); aviso fora de ±10 %.");
      var lig = num(P.ligante), mineral = ok(lig) ? 100 - lig : NaN;
      var dets = (d.det || []).map(function (x, i) {
        var M = num(x.M), A = num(x.A), esf = num(x.esf), rot = "Determinação " + (i + 1) + ": ";
        var pm = ok(M) && M > 0 && ok(A) ? A / M * 1.3 * 100 : NaN;
        if (ok(M) && (M < 3.6 || M > 4.4)) avisos.push(rot + "matéria mineral de " + fmt(M, 4) + " g; a norma pede aproximadamente 4,000 0 g (4.1) — aviso fora de ±10 %.");
        if (ok(A) && ok(M) && A > M) avisos.push(rot + "material recolhido maior que a amostra — confira.");
        if (ok(esf) && esf < 70) avisos.push(rot + "o material recolhido tem " + fmt(esf, 0) + " % de partículas esféricas; mínimo de 70 % (nota da seção 5).");
        return { pm: pm, pt: ok(pm) && ok(mineral) ? pm * mineral / 100 : NaN, esfOk: ok(esf) ? esf >= 70 : null };
      });
      var pmM = media(dets.map(function (o) { return o.pm; })), ptM = media(dets.map(function (o) { return o.pt; }));
      var pm = ok(pmM) ? Math.round(pmM * 10) / 10 : NaN, pt = ok(ptM) ? Math.round(ptM * 10) / 10 : NaN;
      var lim = S.limite(P, ESPEC), conf = S.confere(pt, lim);
      if (!ok(lig) && ok(pm)) avisos.push("Informe o teor de ligante (DNER-ME 248/94) para expressar o teor na composição final do produto" + (lim ? " e comparar com a especificação" : "") + ".");
      if (conf === false) avisos.unshift("Microesferas no termoplástico: " + fmt(pt, 1) + " %, fora do limite de " + S.textoLim(lim, 0, "%") + " (" + lim.ref + ").");
      var esfRuim = dets.some(function (o) { return o.esfOk === false; });
      return { tab: { det: dets }, resultados: { pm: pm, pt: pt, mineral: mineral, n: dets.filter(function (o) { return ok(o.pm); }).length, lim: lim, conforme: conf, esfRuim: esfRuim }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card((ok(r.pt) ? fmt(r.pt, 1) : "—") + " <small>%</small>",
        "Microesferas de vidro no termoplástico" + (r.lim ? " · limite " + esc(S.textoLim(r.lim, 0, "%")) + S.sit(r.conforme) : ""), true) +
        S.card(ok(r.pm) ? fmt(r.pm, 1) + " %" : "—", "Microesferas na matéria mineral — A / M × 1,30 (5)" + (r.n > 1 ? " — média de " + r.n : "")) +
        S.card(ok(r.mineral) ? fmt(r.mineral, 1) + " %" : "—", "Matéria mineral = 100 − ligante") +
        (r.esfRuim ? S.card('<span class="fe-nok">&lt; 70 %</span>', "Partículas esféricas no material recolhido (nota)") : "") + "</div>";
    },
    relatorio: {
      notas: "% de microesferas = A / M × 1,30 (5), com A = massa do material recolhido e M = massa de matéria mineral; 1,30 é o fator para a porcentagem total de microesferas. A fórmula impressa não traz o fator 100 — a ficha expressa o resultado em %. " +
        "Teor no termoplástico = teor na matéria mineral × (100 − teor de ligante) / 100 (conversão adotada pela ficha, como na 6.3 das DNER-ME 241 e 242/94). O material deve ter no mínimo 70 % de partículas esféricas (nota).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Microesferas na matéria mineral", ok(r.pm) ? fmt(r.pm, 1) + " %" : "—"]);
        rows.push(["Matéria mineral (100 − ligante)", ok(r.mineral) ? fmt(r.mineral, 1) + " %" : "—"]);
        rows.push(["Microesferas de vidro no material termoplástico", ok(r.pt) ? fmt(r.pt, 1) + " %" : "—"]);
        if (r.esfRuim) rows.push(["Partículas esféricas", "abaixo de 70 % (nota da seção 5)"]);
        if (r.lim) rows.push(["Especificação", S.textoLim(r.lim, 0, "%") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Termoplástico branco — 19,5 % de microesferas", dados: function () {
        return { ident: { registro: "EX-TP249-01", data: "2026-04-06", obra: "Obra A", local: "Partida 115", origem: "Fornecedor D", camada: "Termoplástico branco (extrusão)" },
          params: { material: "Termoplástico branco", ligante: "20,0", inclin: "20", espec: "372" },
          det: [{ M: "4,0012", A: "0,7520", esf: "85" }] };
      } },
      { nome: "Termoplástico amarelo — poucas microesferas, esfericidade baixa (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP249-02", data: "2026-04-07", obra: "Obra B", local: "Partida 88", origem: "Fornecedor E", camada: "Termoplástico amarelo (aspersão)" },
          params: { material: "Termoplástico amarelo", ligante: "20,0", inclin: "20", espec: "372" },
          det: [{ M: "4,0005", A: "0,5480", esf: "62" }] };
      } },
    ],
  };
})();
