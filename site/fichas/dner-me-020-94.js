/*
 * Ficha: DNER-ME 020/94 — Tinta para demarcação viária — resistência à água.
 * Usa FE.sinalizacao.fichaQualitativa (definida em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, C = S.COND;
  FE.FICHAS["dner-me-020-94"] = S.fichaQualitativa({
    titulo: "Tinta para demarcação viária — resistência à água",
    nomeResultado: "Resistência à água",
    resumo: "Película úmida de 0,38 mm em placa de vidro; 72 h a 25 °C; metade da placa imersa em água destilada a 25 °C por 24 h; 2 h ao ar; exame a olho nu: sem empolamento, perda de aderência ou deterioração (admite-se pequena perda de brilho) = satisfatório (seção 6).",
    chave: "agua",
    condicoes: [
      C.espessura("5.2"),
      C.temp("tseca", "Temperatura de secagem", 25, 2, "5.3"),
      C.duracao("hseca", "Tempo de secagem na horizontal", 72, "5.3"),
      C.temp("tag", "Temperatura da água destilada", 25, 2, "5.4"),
      C.duracao("hima", "Tempo de imersão", 24, "5.4"),
      { k: "incl", r: "Inclinação da placa em relação à vertical — até 45° (5.4)", curto: "inclinação da placa", u: "°", hi: 45, cs: 0, sec: "5.4" },
      C.duracao("har", "Secagem ao ar após a imersão", 2, "5.5"),
    ],
    observacoes: [
      { k: "emp", r: "Empolamento (bolhas) (6)", curto: "empolamento" },
      { k: "ader", r: "Perda de aderência (6)", curto: "perda de aderência" },
      { k: "det", r: "Outras evidências de deterioração (6)", curto: "outra deterioração" },
      { k: "bri", r: "Pequena perda de brilho — admitida, não reprova (6)", curto: "pequena perda de brilho", defeito: false },
    ],
    notas: "Placa de vidro ≈ 120 mm × 200 mm × 4 mm desengordurada com álcool e tolueno; imersão até a metade do comprimento, na vertical ou inclinada até 45° (5.4). Satisfatório quando a película não apresenta empolamento, perda de aderência ou outras evidências de deterioração, a não ser uma pequena perda de brilho (seção 6).",
    exemplos: [
      { nome: "Tinta acrílica emulsionada em água, branca — satisfatória (pequena perda de brilho)", dados: function () {
        return { ident: { registro: "EX-TS-020-1", obra: "Obra A", origem: "Fornecedor C" },
          params: { tinta: "Acrílica emulsionada em água", cor: "branca", lote: "0102", espec: "em276" },
          cps: [{ esp: "0,38", tseca: "25", hseca: "72", tag: "25", hima: "24", incl: "0", har: "2", emp: "N", ader: "N", det: "N", bri: "S" }] };
      } },
      { nome: "Tinta amarela — empolamento após imersão, não satisfatória", dados: function () {
        return { ident: { registro: "EX-TS-020-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Acrílica base solvente", cor: "amarela", lote: "0418", espec: "em368" },
          cps: [{ esp: "0,37", tseca: "26", hseca: "72", tag: "24", hima: "24", incl: "30", har: "2", emp: "S", ader: "N", det: "N", bri: "S" }] };
      } },
    ],
  });
})();
