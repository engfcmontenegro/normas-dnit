/*
 * Ficha: DNER-ME 015/94 — Microesferas de vidro — Resistência à umidade.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 */
(function () {
  "use strict";
  var S = window.FE.sinalizacao2, n100 = S.nominal(100, 1);
  window.FE.FICHAS["dner-me-015-94"] = S.fichaQualitativa({
    titulo: "Microesferas de vidro — resistência à umidade",
    resumo: "100 g de microesferas imersas em água destilada por 5 min; escorrer a água e deixar fluir no funil de vidro (leve agitação só no início): satisfatório se escoarem livremente, sem interrupção (6).",
    params: [{ k: "material", r: "Material", ph: "ex.: microesferas tipo F (drop-on)" }],
    cond: function () {
      return [
        { k: "massa", r: "Massa da amostra (5.1 — 100 g)", u: "g", min: n100.min, max: n100.max, casas: 2 },
        { k: "tempo", r: "Tempo de repouso imerso (5.2 — 5 min)", u: "min", min: 5, casas: 0 },
        { k: "funil", r: "Diâmetro do funil de vidro (3 c — 12 cm, colo longo)", u: "cm", min: 11.88, max: 12.12, casas: 1 },
      ];
    },
    obs: [{ k: "escoamento", r: "Escoamento no funil de vidro (6)",
      opcoes: [["livre", "Fluiu livremente, sem interrupção", true], ["retido", "Ficou quantidade de microesferas retida no funil", false]],
      dica: "é permitida só uma leve agitação inicial para começar o escoamento (5.2)" }],
    espec: [["373", "DNER-EM 373/2000 — 5.3: devem fluir livremente, sem interrupção", "DNER-EM 373/2000, 5.3"]],
    notas: "Satisfatório quando as microesferas fluem ou escoam livremente, sem interrupção, no funil de vidro (6.1); não satisfatório quando fica retida no funil uma quantidade de microesferas (6.2). " +
      "A DNER-EM 379/98 (esferas de vidro) não exige este ensaio. Massa e funil: aviso para desvio acima de 1 % do nominal; o tempo de imersão é tratado como mínimo.",
    exemplos: [
      { nome: "Microesferas tipo F — escoamento livre", dados: function () {
        return { ident: { registro: "EX-MV015-01", data: "2026-03-09", obra: "Obra A", local: "Lote 12", origem: "Fornecedor A", camada: "Microesferas tipo F (drop-on)" },
          params: { material: "Microesferas de vidro tipo F", escoamento: "livre", espec: "373" },
          cond: [{ massa: "100,02", tempo: "5", funil: "12" }] };
      } },
      { nome: "Microesferas tipo G — retidas no funil (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV015-02", data: "2026-03-11", obra: "Obra B", local: "Lote 4", origem: "Fornecedor B", camada: "Microesferas tipo G (drop-on)" },
          params: { material: "Microesferas de vidro tipo G (com revestimento)", escoamento: "retido", espec: "373" },
          cond: [{ massa: "100,10", tempo: "5", funil: "12" }] };
      } },
    ],
  });
  window.FE.FICHAS["dner-me-015-94"].rotuloImportar = function (r) { return "umidade: " + (r.satisf === true ? "satisfatório" : r.satisf === false ? "não satisfatório" : "sem parecer"); };
})();
