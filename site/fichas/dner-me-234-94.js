/*
 * Ficha: DNER-ME 234/94 — Tinta para demarcação viária — determinação da resistência ao calor.
 * Usa FE.sinalizacao.fichaQualitativa (definida em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, C = S.COND;
  FE.FICHAS["dner-me-234-94"] = S.fichaQualitativa({
    titulo: "Tinta para demarcação viária — resistência ao calor",
    nomeResultado: "Resistência ao calor",
    resumo: "Película úmida de 0,38 mm em placa de folha-de-flandres; 24 h ao ar a 25 °C; 3 h em estufa a 80 °C; esfriamento ≥ 1/2 h; exame a olho nu: sem fissuras, empolamento, alteração de brilho ou de cor = satisfatório (seção 6).",
    chave: "calor",
    condicoes: [
      C.espessura("3 b"),
      C.temp("tseca", "Temperatura de secagem ao ar", 25, 2, "5.2.2"),
      C.duracao("hseca", "Tempo de secagem na horizontal", 24, "5.2.2"),
      C.temp("test", "Temperatura da estufa", 80, 5, "5.2.3"),
      C.duracao("hest", "Tempo na estufa", 3, "5.2.3"),
      C.duracao("hesf", "Esfriamento à temperatura ambiente, mínimo", 0.5, "5.2.4"),
    ],
    observacoes: [
      { k: "fiss", r: "Fissuras (6)", curto: "fissuras" },
      { k: "emp", r: "Empolamento (6)", curto: "empolamento" },
      { k: "bri", r: "Alteração de brilho (6)", curto: "alteração de brilho" },
      { k: "cor", r: "Alteração de cor (6)", curto: "alteração de cor" },
      { k: "det", r: "Outro indício de deterioração (6)", curto: "outra deterioração" },
    ],
    notas: "Placa de folha-de-flandres (≈ 7,5 cm × 12,5 cm; 0,19 a 0,25 g/cm²) lixada e desengordurada com álcool e tolueno (5.1). Satisfatório quando a tinta não apresenta fissuras, empolamento, alteração de brilho, de cor ou qualquer indício de deterioração (seção 6).",
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — satisfatória", dados: function () {
        return { ident: { registro: "EX-TS-234-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368" },
          cps: [{ esp: "0,38", tseca: "25", hseca: "24", test: "80", hest: "3", hesf: "0,5", fiss: "N", emp: "N", bri: "N", cor: "N", det: "N" }] };
      } },
      { nome: "Tinta amarela — empolamento e alteração de cor; estufa acima de 85 °C", dados: function () {
        return { ident: { registro: "EX-TS-234-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          cps: [{ esp: "0,38", tseca: "25", hseca: "24", test: "87", hest: "3", hesf: "1", fiss: "N", emp: "S", bri: "S", cor: "S", det: "N" }] };
      } },
    ],
  });
})();
