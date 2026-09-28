/*
 * Ficha: DNER-ME 244/94 — Material termoplástico — Estabilidade.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 */
(function () {
  "use strict";
  var S = window.FE.sinalizacao2, n250 = S.nominal(250, 1);
  window.FE.FICHAS["dner-me-244-94"] = S.fichaQualitativa({
    titulo: "Material termoplástico — estabilidade",
    resumo: "250 g de termoplástico fundidos em banho de óleo (branco a 200 ± 2 °C, amarelo a 180 ± 2 °C) e agitados a 150 rpm por 4 h; verter em tabuleiro com papel alumínio, esfriar 3 h e examinar a face em contato com o papel: satisfatório se não houver mudança acentuada de cor (5).",
    params: [{ k: "material", r: "Material", ph: "ex.: termoplástico extrudado" },
      { k: "cor", r: "Cor do material (4.1)", tipo: "select", recarrega: true, opcoes: [["branco", "Branco — banho a 200 ± 2 °C"], ["amarelo", "Amarelo — banho a 180 ± 2 °C"]] }],
    padrao: { cor: "branco" },
    cond: function (d) {
      var t = (d.params || {}).cor === "amarelo" ? 180 : 200;
      return [
        { k: "massa", r: "Massa de termoplástico (4.1 — 250 g)", u: "g", min: n250.min, max: n250.max, casas: 1 },
        { k: "tBanho", r: "Temperatura do banho de óleo (4.1 — " + t + " ± 2 °C)", u: "°C", min: t - 2, max: t + 2, casas: 0 },
        { k: "rpm", r: "Velocidade do agitador (3 a — aprox. 150 rpm)", u: "rpm", min: 135, max: 165, casas: 0 },
        { k: "tempo", r: "Tempo de agitação (4.2 — 4 h)", u: "h", min: 4, casas: 1 },
        { k: "resfr", r: "Resfriamento à temperatura ambiente (4.4 — 3 h)", u: "h", min: 3, casas: 1 },
      ];
    },
    obs: [{ k: "aspecto", r: "Face em contato com o papel alumínio (4.5)", opcoes: [["igual", "Sem mudança acentuada de cor", true], ["mudou", "Mudança acentuada de cor", false]] }],
    notas: "Satisfatório se o material termoplástico não sofrer mudança acentuada de cor; caso contrário, não satisfatório (5). " +
      "Massa: aviso para desvio acima de 1 % de 250 g; velocidade \"aproximada\" de 150 rpm: aviso fora de ±10 %; tempos de agitação e de resfriamento tratados como mínimos. " +
      "A DNER-EM 372/2000 exige que o material conserve a estabilidade (4.10), sem citar este método.",
    exemplos: [
      { nome: "Termoplástico branco — sem mudança de cor", dados: function () {
        return { ident: { registro: "EX-TP244-01", data: "2026-04-06", obra: "Obra A", local: "Partida 115", origem: "Fornecedor D", camada: "Termoplástico branco (extrusão)" },
          params: { material: "Termoplástico branco", cor: "branco", aspecto: "igual" },
          cond: [{ massa: "250,0", tBanho: "200", rpm: "150", tempo: "4", resfr: "3" }] };
      } },
      { nome: "Termoplástico amarelo — escureceu, banho acima de 182 °C (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP244-02", data: "2026-04-07", obra: "Obra B", local: "Partida 88", origem: "Fornecedor E", camada: "Termoplástico amarelo (aspersão)" },
          params: { material: "Termoplástico amarelo", cor: "amarelo", aspecto: "mudou" },
          cond: [{ massa: "250,3", tBanho: "186", rpm: "150", tempo: "4", resfr: "3" }] };
      } },
    ],
  });
})();
