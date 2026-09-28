/*
 * Ficha: DNER-ME 022/94 — Microesferas de vidro — Resistência à solução de sulfeto de sódio.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 */
(function () {
  "use strict";
  var S = window.FE.sinalizacao2, n10 = S.nominal(10, 1);
  window.FE.FICHAS["dner-me-022-94"] = S.fichaQualitativa({
    titulo: "Microesferas de vidro — resistência à solução de sulfeto de sódio",
    resumo: "10 g de microesferas em solução de 50 % de sulfeto de sódio, 48 % de água e 2 % de tensoativo por 60 min, agitando a cada 5 min; filtrar, secar a (110 ± 5) °C por 2 h, resfriar 2 h e comparar ao microscópio com amostra não tratada: satisfatório se a superfície não estiver embaçada (7).",
    params: [{ k: "material", r: "Material", ph: "ex.: microesferas tipo I B (premix)" }],
    cond: function () {
      return [
        { k: "massa", r: "Massa da amostra (6.1 — 10 g)", u: "g", min: n10.min, max: n10.max, casas: 2 },
        { grupo: "Solução (6.2)" },
        { k: "na2s", r: "Sulfeto de sódio (50 %)", u: "%", min: 49.5, max: 50.5, casas: 1 },
        { k: "agua", r: "Água destilada (48 %)", u: "%", min: 47.52, max: 48.48, casas: 1 },
        { k: "tenso", r: "Agente tensoativo (2 %)", u: "%", min: 1.98, max: 2.02, casas: 1 },
        { grupo: "Tratamento" },
        { k: "tempo", r: "Tempo de contato com a solução (6.3 — 60 min)", u: "min", min: 60, casas: 0 },
        { k: "agit", r: "Intervalo entre agitações (6.3 — 5 min)", u: "min", max: 5, casas: 0 },
        { k: "tEstufa", r: "Temperatura da estufa (6.5 — 110 ± 5 °C)", u: "°C", min: 105, max: 115, casas: 0 },
        { k: "secagem", r: "Tempo de secagem em estufa (6.5 — 2 h)", u: "h", min: 2, casas: 1 },
        { k: "dess", r: "Resfriamento em dessecador (6.6 — 2 h)", u: "h", min: 2, casas: 1 },
        { k: "aumento", r: "Aumento do microscópio (3 f — 100× a 200×)", u: "×", min: 100, max: 200, casas: 0 },
      ];
    },
    obs: [{ k: "superficie", r: "Superfície das microesferas, comparadas com as não tratadas (6.7, 7)",
      opcoes: [["limpa", "Não embaçada", true], ["embacada", "Embaçada", false]] }],
    espec: [["373", "DNER-EM 373/2000 — 5.5: não devem apresentar superfície embaçada", "DNER-EM 373/2000, 5.5"],
      ["379", "DNER-EM 379/98 — 5.4: não devem apresentar superfície embaçada", "DNER-EM 379/98, 5.4"]],
    notas: "Satisfatório quando as microesferas tratadas não apresentam superfície embaçada (7.1); caso contrário, não satisfatório (7.2). " +
      "Sem tolerância na norma para massa e composição da solução: aviso para desvio acima de 1 % do valor nominal; tempos de contato, secagem e resfriamento tratados como mínimos; intervalo entre agitações, como máximo.",
    exemplos: [
      { nome: "Microesferas tipo I B — não embaçadas", dados: function () {
        return { ident: { registro: "EX-MV022-01", data: "2026-03-12", obra: "Obra A", local: "Lote 12", origem: "Fornecedor A", camada: "Microesferas tipo I B (premix)" },
          params: { material: "Microesferas de vidro tipo I B", superficie: "limpa", espec: "373" },
          cond: [{ massa: "10,00", na2s: "50", agua: "48", tenso: "2", tempo: "60", agit: "5", tEstufa: "110", secagem: "2", dess: "2", aumento: "150" }] };
      } },
      { nome: "Microesferas tipo F — embaçadas, secagem curta (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV022-02", data: "2026-03-13", obra: "Obra B", local: "Lote 7", origem: "Fornecedor B", camada: "Microesferas tipo F (drop-on)" },
          params: { material: "Microesferas de vidro tipo F", superficie: "embacada", espec: "373" },
          cond: [{ massa: "10,05", na2s: "50", agua: "48", tenso: "2", tempo: "60", agit: "10", tEstufa: "112", secagem: "1,5", dess: "2", aumento: "100" }] };
      } },
    ],
  });
})();
