/*
 * Ficha: DNER-ME 245/94 — Material termoplástico — Cor (escala Munsell).
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * Película aplicada a quente com extensor de 3 mm sobre placa de alumínio desengordurada; após no mínimo 3 h a (25 ± 2) °C,
 * compara-se com o padrão de branco do laboratório (escala Munsell) ou com a escala Munsell para amarelo (4.2.3).
 * O resultado é a notação Munsell ou o padrão correspondente (5).
 * Comparação opcional com a DNER-EM 372/2000: branco N 9,5 com tolerância N 9,0 (5.11); amarelo 10 YR 7,5/14, tolerâncias
 * 2,0 Y 7,5/14 e 10 YR 6,5/14 (5.12) — a ficha lê: matiz de 10 YR a 2,0 Y e valor de 6,5 a 7,5; croma nominal 14 (sem tolerância na EM).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var COND = [
    { k: "extensor", r: "Abertura do extensor (3 a — 3 mm)", u: "mm", min: 2.97, max: 3.03, casas: 2 },
    { k: "secPlaca", r: "Secagem da placa após o desengorduramento (4.1.2 — 30 min)", u: "min", min: 30, casas: 0 },
    { k: "tCura", r: "Temperatura de repouso (4.2.2 — 25 ± 2 °C)", u: "°C", min: 23, max: 27, casas: 0 },
    { k: "cura", r: "Tempo de repouso, horizontal, sem poeira nem sol (4.2.2 — mín. 3 h)", u: "h", min: 3, casas: 1 },
  ];
  // matiz em escala contínua: 10 YR = 0 Y; 2,0 Y = 2; 9 YR = −1
  function matizY(h, fam) { return ok(h) ? (fam === "YR" ? h - 10 : h) : NaN; }
  function fmtN(x) { return fmt(x, x % 1 ? 1 : 0); }

  FE.FICHAS["dner-me-245-94"] = {
    titulo: "Material termoplástico — cor",
    resumo: "Película aplicada a quente (extensor de 3 mm) sobre placa de alumínio desengordurada, 3 h a (25 ± 2) °C; comparação com o padrão de branco do laboratório ou com a escala Munsell para amarelo; resultado em notação Munsell ou padrão correspondente (5).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: termoplástico amarelo" },
      { k: "cor", r: "Cor do material", tipo: "select", recarrega: true, opcoes: [["branco", "Branco"], ["amarelo", "Amarelo"]] },
      { k: "modo", r: "Comparação (4.2.3)", tipo: "select", recarrega: true,
        opcoes: [["munsell", "Notação Munsell lida"], ["padrao", "Padrão do laboratório (sem notação)"]] },
      { k: "N", r: "Valor Munsell do branco — N", ph: "ex.: 9,5", se: function (d) { var P = d.params || {}; return P.modo !== "padrao" && P.cor !== "amarelo"; } },
      { k: "hue", r: "Matiz — número", ph: "ex.: 10", se: function (d) { var P = d.params || {}; return P.modo !== "padrao" && P.cor === "amarelo"; } },
      { k: "fam", r: "Matiz — família", tipo: "select", opcoes: [["YR", "YR (amarelo-vermelho)"], ["Y", "Y (amarelo)"]],
        se: function (d) { var P = d.params || {}; return P.modo !== "padrao" && P.cor === "amarelo"; } },
      { k: "valor", r: "Valor (luminosidade)", ph: "ex.: 7,5", se: function (d) { var P = d.params || {}; return P.modo !== "padrao" && P.cor === "amarelo"; } },
      { k: "croma", r: "Croma", ph: "ex.: 14", se: function (d) { var P = d.params || {}; return P.modo !== "padrao" && P.cor === "amarelo"; } },
      { k: "padraoNome", r: "Padrão correspondente", ph: "ex.: padrão branco nº 2 do laboratório", se: function (d) { return (d.params || {}).modo === "padrao"; } },
      { k: "corresp", r: "A amostra corresponde ao padrão?", tipo: "select", se: function (d) { return (d.params || {}).modo === "padrao"; },
        opcoes: [["", "— não registrado —"], ["sim", "Sim — mesma tonalidade"], ["nao", "Não — tonalidade diferente"]] },
      { k: "espec", r: "Especificação para comparação — opcional", tipo: "select",
        opcoes: [["", "— sem comparação —"], ["372", "DNER-EM 372/2000 — branco N 9,5 (tol. N 9,0), 5.11; amarelo 10 YR 7,5/14 (tol. 2,0 Y 7,5/14 e 10 YR 6,5/14), 5.12"]] },
    ].concat(COND.map(function (c) { return { k: c.k, r: c.r + " — registrado" }; })),
    padrao: { cor: "branco", modo: "munsell", fam: "YR", espec: "" },
    tabelas: function () { return []; },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], am = P.cor === "amarelo", em = P.espec === "372";
      COND.forEach(function (c) { var a = S.condicao(c, num(P[c.k])); if (a) avisos.push(a); });
      var notacao = "", conf = null, detalhe = "";
      if (P.modo === "padrao") {
        notacao = P.padraoNome ? "padrão: " + P.padraoNome : "";
        conf = P.corresp === "sim" ? true : P.corresp === "nao" ? false : null;
        if (conf === null) avisos.push("Registre se a amostra corresponde ao padrão.");
        detalhe = "comparação com o padrão do laboratório";
      } else if (!am) {
        var N = num(P.N);
        if (ok(N)) {
          notacao = "N " + fmtN(N);
          if (N > 10 || N < 0) avisos.push("Valor Munsell fora da escala (0 a 10).");
          if (em) { conf = N >= 9 - 1e-9; detalhe = "N 9,5, tolerância N 9,0 (DNER-EM 372/2000, 5.11)"; }
        } else avisos.push("Informe o valor Munsell N lido.");
      } else {
        var h = num(P.hue), fam = P.fam || "YR", V = num(P.valor), C = num(P.croma);
        if (ok(h) && ok(V) && ok(C)) {
          notacao = fmtN(h) + " " + fam + " " + fmtN(V) + "/" + fmtN(C);
          if (h <= 0 || h > 10) avisos.push("Número do matiz fora de 0 a 10 — confira.");
          if (em) {
            var hy = matizY(h, fam), okH = hy >= -1e-9 && hy <= 2 + 1e-9, okV = V >= 6.5 - 1e-9 && V <= 7.5 + 1e-9;
            conf = okH && okV;
            detalhe = "10 YR 7,5/14; tolerâncias 2,0 Y 7,5/14 e 10 YR 6,5/14 (DNER-EM 372/2000, 5.12)";
            if (!okH) avisos.unshift("Matiz " + fmtN(h) + " " + fam + " fora do intervalo de 10 YR a 2,0 Y (DNER-EM 372/2000, 5.12).");
            if (!okV) avisos.unshift("Valor " + fmtN(V) + " fora do intervalo de 6,5 a 7,5 (DNER-EM 372/2000, 5.12).");
            if (Math.abs(C - 14) > 1e-9) avisos.push("Croma " + fmtN(C) + " diferente do nominal 14; a especificação não fixa tolerância de croma — avalie.");
          }
        } else avisos.push("Informe matiz, valor e croma lidos na escala Munsell.");
      }
      if (P.modo === "padrao" && em) detalhe = "padrão do laboratório (a DNER-EM 372/2000 fixa a cor em notação Munsell, 5.11 e 5.12)";
      if (conf === false && em && P.modo !== "padrao" && !am) avisos.unshift("Branco " + notacao + " abaixo da tolerância N 9,0 (DNER-EM 372/2000, 5.11).");
      return { tab: {}, resultados: { notacao: notacao, cor: am ? "amarelo" : "branco", conforme: conf, detalhe: detalhe, em: em || P.modo === "padrao" }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card(r.notacao ? esc(r.notacao) : "—", "Cor do termoplástico " + r.cor + " (5)", true) +
        (r.em && r.detalhe ? S.card(r.conforme === null ? "—" : r.conforme ? '<span class="fe-ok">atende</span>' : '<span class="fe-nok">não atende</span>', esc(r.detalhe)) : "") + "</div>";
    },
    relatorio: {
      notas: "Resultado dado pela notação da escala Munsell ou pelo padrão correspondente à tonalidade (5), após no mínimo 3 h a (25 ± 2) °C em posição horizontal, livre de poeira e de luz solar direta (4.2.2). " +
        "DNER-EM 372/2000: branco N 9,5 com tolerância N 9,0 (5.11); amarelo 10 YR 7,5/14 com tolerâncias 2,0 Y 7,5/14 e 10 YR 6,5/14 (5.12) — lidas pela ficha como matiz de 10 YR a 2,0 Y e valor de 6,5 a 7,5, croma nominal 14.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Cor (" + r.cor + ")", r.notacao || "—"]);
        if (r.em && r.detalhe) rows.push([P.modo === "padrao" ? "Correspondência ao padrão" : "Especificação", r.detalhe + (r.conforme === null ? "" : r.conforme ? " — ATENDE" : " — NÃO ATENDE")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Termoplástico amarelo — 10 YR 7/14", dados: function () {
        return { ident: { registro: "EX-TP245-01", data: "2026-04-15", obra: "Obra A", local: "Partida 88", origem: "Fornecedor D", camada: "Termoplástico amarelo" },
          params: { material: "Termoplástico amarelo", cor: "amarelo", modo: "munsell", hue: "10", fam: "YR", valor: "7", croma: "14", espec: "372",
            extensor: "3,00", secPlaca: "30", tCura: "25", cura: "3" } };
      } },
      { nome: "Termoplástico branco — N 8,5, abaixo da tolerância (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP245-02", data: "2026-04-16", obra: "Obra B", local: "Partida 115", origem: "Fornecedor E", camada: "Termoplástico branco" },
          params: { material: "Termoplástico branco", cor: "branco", modo: "munsell", N: "8,5", espec: "372",
            extensor: "3,00", secPlaca: "30", tCura: "26", cura: "2" } };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-245-94"].rotuloImportar = function (r) { return "cor " + (r.notacao || "—") + (r.conforme === true ? " · conforme" : r.conforme === false ? " · não conforme" : ""); };
})();
