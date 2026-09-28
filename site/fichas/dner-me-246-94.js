/*
 * Ficha: DNER-ME 246/94 — Material termoplástico — Resistência à luz.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 */
(function () {
  "use strict";
  var S = window.FE.sinalizacao2;
  window.FE.FICHAS["dner-me-246-94"] = S.fichaQualitativa({
    titulo: "Material termoplástico — resistência à luz",
    resumo: "Película aplicada a quente com extensor de 3 mm sobre placa de alumínio, 3 h a (25 ± 2) °C, destacada e exposta a 40 cm de lâmpada GE 275 W (sun lamp) por 100 h; comparar com amostra não exposta: satisfatório se não houver variação de cor (6).",
    params: [{ k: "material", r: "Material", ph: "ex.: termoplástico amarelo" },
      { k: "lampada", r: "Lâmpada (3 b)", ph: "GE-275 W \"sun lamp\" RS ou similar" }],
    cond: function () {
      return [
        { k: "extensor", r: "Abertura do extensor (3 a — 3 mm)", u: "mm", min: 2.97, max: 3.03, casas: 2 },
        { k: "tCura", r: "Temperatura de repouso da placa (4.1.2 — 25 ± 2 °C)", u: "°C", min: 23, max: 27, casas: 0 },
        { k: "cura", r: "Tempo de repouso antes de destacar (4.1.2 — 3 h)", u: "h", min: 3, casas: 1 },
        { k: "dist", r: "Distância à lâmpada (5.2 — 40 cm)", u: "cm", min: 39.6, max: 40.4, casas: 1 },
        { k: "exposicao", r: "Tempo de exposição (5.2 — 100 h)", u: "h", min: 100, casas: 0 },
      ];
    },
    obs: [{ k: "variacao", r: "Cor, comparada com a amostra não exposta (5.4)", opcoes: [["nao", "Sem variação de cor", true], ["sim", "Com variação de cor", false]],
      dica: "corpo de prova protegido de poeira durante a exposição e resfriado à temperatura ambiente (5.2, 5.3)" }],
    espec: [["372", "DNER-EM 372/2000 — 5.13: resistência à luz satisfatória", "DNER-EM 372/2000, 5.13"]],
    notas: "Satisfatório se o material não apresentar variação de cor em relação à amostra não exposta; caso contrário, não satisfatório (6). " +
      "Extensor e distância: aviso para desvio acima de 1 % do nominal; tempos de repouso e de exposição tratados como mínimos.",
    exemplos: [
      { nome: "Termoplástico amarelo — sem variação de cor", dados: function () {
        return { ident: { registro: "EX-TP246-01", data: "2026-04-13", obra: "Obra A", local: "Partida 88", origem: "Fornecedor D", camada: "Termoplástico amarelo" },
          params: { material: "Termoplástico amarelo", lampada: "GE 275 W sun lamp", variacao: "nao", espec: "372" },
          cond: [{ extensor: "3,00", tCura: "25", cura: "3", dist: "40", exposicao: "100" }] };
      } },
      { nome: "Termoplástico branco — amarelou após 100 h (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP246-02", data: "2026-04-14", obra: "Obra B", local: "Partida 115", origem: "Fornecedor E", camada: "Termoplástico branco" },
          params: { material: "Termoplástico branco", lampada: "Lâmpada similar 275 W", variacao: "sim", espec: "372" },
          cond: [{ extensor: "3,00", tCura: "24", cura: "3", dist: "40", exposicao: "100" }] };
      } },
    ],
  });
})();
