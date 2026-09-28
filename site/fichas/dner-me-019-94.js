/*
 * Ficha: DNER-ME 019/94 — Tinta para demarcação viária — determinação da flexibilidade.
 * Usa FE.sinalizacao.fichaQualitativa (definida em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, C = S.COND;
  FE.FICHAS["dner-me-019-94"] = S.fichaQualitativa({
    titulo: "Tinta para demarcação viária — flexibilidade",
    nomeResultado: "Flexibilidade",
    resumo: "Película úmida de 0,38 mm em placa de folha-de-flandres; 18 h a 25 °C, 2 h em estufa a 50 °C, esfriamento ≥ 1/2 h; dobramento de 180° sobre barra de 12,5 mm: sem fissurar, lascar ou perder aderência = satisfatório (seção 6).",
    chave: "flexibilidade",
    condicoes: [
      C.espessura("5.2.2"),
      C.temp("tseca", "Temperatura de secagem", 25, 2, "5.2.3"),
      C.duracao("hseca", "Tempo de secagem na horizontal", 18, "5.2.3"),
      C.temp("test", "Temperatura da estufa", 50, 5, "5.2.4"),
      C.duracao("hest", "Tempo na estufa", 2, "5.2.4"),
      C.duracao("hesf", "Esfriamento à temperatura ambiente, mínimo", 0.5, "5.2.5"),
      { k: "barra", r: "Diâmetro da barra metálica — 12,5 mm (3 d)", u: "mm", cs: 1 },
      { k: "ang", r: "Ângulo de dobramento — 180° (5.2.6)", u: "°", cs: 0 },
    ],
    observacoes: [
      { k: "fiss", r: "Fissuras na película (6)", curto: "fissuras" },
      { k: "lasc", r: "Lascamento (6)", curto: "lascamento" },
      { k: "ader", r: "Perda de aderência (6)", curto: "perda de aderência" },
    ],
    calc: function (p, o, rot, avisos) {
      var b = FE.num(p.barra), a = FE.num(p.ang);
      if (FE.ok(b) && Math.abs(b - 12.5) > 0.05) avisos.push(rot + ": barra de " + FE.fmt(b, 1) + " mm; a norma prescreve 12,5 mm (3 d).");
      if (FE.ok(a) && a < 180) avisos.push(rot + ": dobramento de " + FE.fmt(a, 0) + "°; a norma prescreve 180° (5.2.6).");
    },
    notas: "Placa de folha-de-flandres (≈ 7,5 cm × 12,5 cm; 0,19 a 0,25 g/cm²) lixada e desengordurada com álcool e tolueno (5.1). Satisfatório quando a película não fissura, não lasca nem perde aderência após o dobramento de 180° em torno da barra de 12,5 mm (seção 6).",
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — satisfatória", dados: function () {
        return { ident: { registro: "EX-TS-019-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368" },
          cps: [{ esp: "0,38", tseca: "25", hseca: "18", test: "50", hest: "2", hesf: "0,5", barra: "12,5", ang: "180", fiss: "N", lasc: "N", ader: "N" }] };
      } },
      { nome: "Tinta amarela — fissuras no dobramento, não satisfatória", dados: function () {
        return { ident: { registro: "EX-TS-019-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-butadieno base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          cps: [{ esp: "0,39", tseca: "24", hseca: "18", test: "52", hest: "2", hesf: "1", barra: "12,5", ang: "180", fiss: "S", lasc: "N", ader: "S" }] };
      } },
    ],
  });
})();
