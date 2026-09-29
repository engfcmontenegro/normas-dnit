/*
 * Ficha: DNER-ME 014/94 — Microesferas de vidro — Resistência ao ácido clorídrico.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 */
(function () {
  "use strict";
  var S = window.FE.sinalizacao2, n10 = S.nominal(10, 1);
  window.FE.FICHAS["dner-me-014-94"] = S.fichaQualitativa({
    titulo: "Microesferas de vidro — resistência ao ácido clorídrico",
    resumo: "10 g de microesferas cobertas por solução de HCl de pH 5 a 5,3 durante 90 h; filtrar, secar (ao ar ou em estufa) e comparar ao microscópio com amostra não tratada do mesmo lote: satisfatório se a superfície não estiver embaçada (7).",
    params: [{ k: "material", r: "Material", ph: "ex.: microesferas tipo I A (innermix)" },
      { k: "secagem", r: "Secagem (6.4)", tipo: "select", recarrega: true, opcoes: [["ar", "Ao ar"], ["estufa", "Em estufa (110 ± 5) °C"]] }],
    padrao: { secagem: "ar" },
    cond: function (d) {
      var c = [
        { k: "massa", r: "Massa da amostra (6.1 — 10 g)", u: "g", min: n10.min, max: n10.max, casas: 2 },
        { k: "ph", r: "pH da solução de ácido clorídrico (4 — 5 a 5,3)", u: "", min: 5, max: 5.3, casas: 2 },
        { k: "tempo", r: "Tempo de repouso na solução (6.2 — 90 h)", u: "h", min: 90, casas: 0 },
      ];
      if ((d.params || {}).secagem === "estufa") c.push({ k: "tEstufa", r: "Temperatura da estufa (3 g — 110 ± 5 °C)", u: "°C", min: 105, max: 115, casas: 0 });
      c.push({ k: "aumento", r: "Aumento do microscópio (3 b — 100× a 200×)", u: "×", min: 100, max: 200, casas: 0 });
      return c;
    },
    obs: [{ k: "superficie", r: "Superfície das microesferas, comparadas com as não tratadas (6.5, 7)",
      opcoes: [["limpa", "Não embaçada", true], ["embacada", "Embaçada", false]], dica: "comparar com microesferas não tratadas do mesmo lote (6.5)" }],
    espec: [["373", "DNER-EM 373/2000 — 5.2: não devem apresentar superfície embaçada", "DNER-EM 373/2000, 5.2"],
      ["379", "DNER-EM 379/98 — 5.2: não devem apresentar superfície embaçada", "DNER-EM 379/98, 5.2"]],
    notas: "Satisfatório quando as microesferas tratadas não apresentam superfície embaçada (7.1); caso contrário, não satisfatório (7.2). " +
      "A norma não fixa tolerância para a massa: a ficha avisa desvios acima de 1 % de 10 g; o tempo de repouso (90 h) é tratado como mínimo.",
    exemplos: [
      { nome: "Microesferas tipo I A — não embaçadas", dados: function () {
        return { ident: { registro: "EX-MV014-01", data: "2026-03-02", obra: "Obra A", local: "Lote 3", origem: "Fornecedor A", camada: "Microesferas tipo I A (innermix)" },
          params: { material: "Microesferas de vidro tipo I A", secagem: "estufa", superficie: "limpa", espec: "373" },
          cond: [{ massa: "10,01", ph: "5,1", tempo: "90", tEstufa: "110", aumento: "100" }] };
      } },
      { nome: "Esferas de vidro — embaçadas, pH fora da faixa (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV014-02", data: "2026-03-05", obra: "Obra C", local: "Lote 21", origem: "Fornecedor C", camada: "Esferas de vidro (DNER-EM 379)" },
          params: { material: "Esferas de vidro", secagem: "ar", superficie: "embacada", espec: "379" },
          cond: [{ massa: "10,00", ph: "4,6", tempo: "90", aumento: "200" }] };
      } },
    ],
  });
  window.FE.FICHAS["dner-me-014-94"].rotuloImportar = function (r) { return "HCl: " + (r.satisf === true ? "satisfatório" : r.satisf === false ? "não satisfatório" : "sem parecer"); };
})();
