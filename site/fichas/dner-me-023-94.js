/*
 * Ficha: DNER-ME 023/94 — Microesferas de vidro — Resistência à água.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 * Critério (7.1): superfície não embaçada (a olho nu) E volume de HCl 0,10 N na titulação ≤ 4,5 ml.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var n10 = S.nominal(10, 1), n100 = S.nominal(100, 1), n01 = S.nominal(0.1, 1);
  FE.FICHAS["dner-me-023-94"] = S.fichaQualitativa({
    titulo: "Microesferas de vidro — resistência à água",
    resumo: "10 g de microesferas em extrator Soxhlet com 100 ml de água destilada, banho a (150 ± 5) °C, 1 h de ebulição (4 refluxos); secar e observar a olho nu; titular o líquido do balão com HCl 0,10 N (fenolftaleína): satisfatório se não houver embaçamento e o volume gasto for ≤ 4,5 ml (7.1).",
    params: [{ k: "material", r: "Material", ph: "ex.: microesferas tipo I A (innermix)" }],
    cond: function () {
      return [
        { k: "massa", r: "Massa da amostra (6.1 — 10 g)", u: "g", min: n10.min, max: n10.max, casas: 2 },
        { k: "agua", r: "Água destilada no balão (6.1 — 100 ml)", u: "ml", min: n100.min, max: n100.max, casas: 0 },
        { k: "tBanho", r: "Temperatura do banho / manta (6.2 — 150 ± 5 °C)", u: "°C", min: 145, max: 155, casas: 0 },
        { k: "tempo", r: "Tempo de ebulição (6.3 — 1 h)", u: "h", min: 1, casas: 2 },
        { k: "refluxos", r: "Número de refluxos no período (6.3 — 4)", u: "", min: 4, casas: 0 },
        { k: "tEstufa", r: "Temperatura da estufa (6.4 — 110 ± 5 °C)", u: "°C", min: 105, max: 115, casas: 0 },
        { k: "secagem", r: "Tempo de secagem em estufa (6.4 — 30 min)", u: "min", min: 30, casas: 0 },
        { grupo: "Titulação do líquido do balão (6.5 a 6.7)" },
        { k: "normal", r: "Normalidade do HCl (4.1 — 0,10 N)", u: "N", min: n01.min, max: n01.max, casas: 3 },
        { k: "vHCl", r: "Volume de HCl gasto na neutralização (6.7 — máx. 4,5 ml)", u: "ml", max: 4.5, casas: 2, criterio: true, obrig: true },
      ];
    },
    obs: [{ k: "superficie", r: "Superfície das microesferas, a olho nu (6.4)", opcoes: [["limpa", "Não embaçada", true], ["embacada", "Embaçada", false]] }],
    extra: function (d, res) { res.vHCl = num(((d.cond || [])[0] || {}).vHCl); },
    cards: function (r) { return S.card(ok(r.vHCl) ? fmt(r.vHCl, 2) + " ml" : "—", "HCl 0,10 N gasto na titulação (máx. 4,5 ml)"); },
    linhasRel: function (r) { return [["Volume de HCl 0,10 N gasto na titulação", ok(r.vHCl) ? fmt(r.vHCl, 2) + " ml (máx. 4,5 ml)" : "—"]]; },
    espec: [["373", "DNER-EM 373/2000 — 5.4: sem embaçamento e ≤ 4,5 ml de HCl 0,10 N", "DNER-EM 373/2000, 5.4"],
      ["379", "DNER-EM 379/98 — 5.3: sem embaçamento e ≤ 4,5 ml de HCl 0,10 N", "DNER-EM 379/98, 5.3"]],
    notas: "Satisfatório quando as microesferas não apresentam superfície embaçada e não são gastos mais do que 4,5 ml de HCl 0,10 N para neutralizar o líquido (viragem de rosa para incolor) (7.1); caso contrário, não satisfatório (7.2). " +
      "Massa, volume de água e normalidade: aviso para desvio acima de 1 % do nominal; tempos e número de refluxos tratados como mínimos. A norma não prevê correção do volume para HCl de normalidade diferente de 0,10 N.",
    exemplos: [
      { nome: "Microesferas tipo I A — 3,2 ml de HCl, não embaçadas", dados: function () {
        return { ident: { registro: "EX-MV023-01", data: "2026-03-16", obra: "Obra A", local: "Lote 3", origem: "Fornecedor A", camada: "Microesferas tipo I A (innermix)" },
          params: { material: "Microesferas de vidro tipo I A", superficie: "limpa", espec: "373" },
          cond: [{ massa: "10,00", agua: "100", tBanho: "150", tempo: "1", refluxos: "4", tEstufa: "110", secagem: "30", normal: "0,100", vHCl: "3,20" }] };
      } },
      { nome: "Esferas de vidro — 6,1 ml de HCl (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV023-02", data: "2026-03-17", obra: "Obra C", local: "Lote 21", origem: "Fornecedor C", camada: "Esferas de vidro (DNER-EM 379)" },
          params: { material: "Esferas de vidro", superficie: "limpa", espec: "379" },
          cond: [{ massa: "10,01", agua: "100", tBanho: "152", tempo: "1", refluxos: "4", tEstufa: "108", secagem: "30", normal: "0,100", vHCl: "6,10" }] };
      } },
    ],
  });
  window.FE.FICHAS["dner-me-023-94"].rotuloImportar = function (r) { return "água: " + (r.satisf === true ? "satisfatório" : r.satisf === false ? "não satisfatório" : "sem parecer") + (window.FE.ok(r.vHCl) ? " · " + window.FE.fmt(r.vHCl, 1) + " ml de HCl" : ""); };
})();
