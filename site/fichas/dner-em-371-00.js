/*
 * Ficha: DNER-EM 371/00 — Tinta para sinalização horizontal rodoviária à base de resina estireno-acrilato e/ou
 * estireno-butadieno — recebimento da partida.
 * Motor comum: FE.recebimentoMaterial.tinta (site/fichas/dner-em-276-00.js); limites de FE.sinalizacao
 * (site/fichas/dner-me-018-94.js), conferidos com as Tabelas 1 e 2 do PDF da EM.
 */
(function () {
  "use strict";
  var R = window.FE.recebimentoMaterial;

  var F = window.FE.FICHAS["dner-em-371-00"] = R.tinta({
    em: "em371", codigo: "DNER-EM 371/00",
    titulo: "Recebimento de tinta para sinalização horizontal — resina estireno-acrilato e/ou estireno-butadieno",
    resumo: "Recebimento da partida: inspeção visual dos recipientes (DNER-PRO 231/94), amostra (DNER-PRO 104/94) e requisitos das Tabelas 1 e 2 (consistência, estabilidade, não voláteis, pigmento, TiO₂ ou PbCrO₄, veículo, secagem, abrasão, massa específica, brilho, cor, ensaios qualitativos e resina), com importação das fichas DNER-ME e parecer (seção 7).",
    tabQuant: "Tabela 1", tabQual: "Tabela 2",
    quant: ["consistencia", "estabArm", "naoVolatil", "pigmento", "tio2", "pbcro4", "veicNV", "veicTotal", "secagem", "abrasao", "massaEsp", "brilho"],
    qual: ["cor", "diluicao", "flexibilidade", "aderencia", "agua", "calor", "sangramento", "nata", "breu",
      { id: "resina", r: "Resina", metodo: "método não citado na EM", exig: "estireno-acrilato e/ou estireno-butadieno", bom: "atende", mau: "não atende",
        ph: "atende / não atende" }],
    notas: "Critérios da DNER-EM 371/00: condições gerais (seção 4), Tabela 1 (quantitativos) e Tabela 2 (qualitativos). Cromato de chumbo (tinta amarela): a EM permite substituir até 15 % do teor utilizado por TiO₂. " +
      "Inspeção visual pela DNER-PRO 231/94 (Tabela 1 normal / Tabela 2 rigorosa) — rejeição total ou parcial à vista da inspeção (7.1); amostragem pela DNER-PRO 104/94 (≥ 2 L por cor, tipo e lote). " +
      "A partida que satisfaz as seções 4 e 5 é aceita; caso contrário, rejeitada (7.2). A exclusivo critério do órgão, podem ser dispensados ensaios (6.3.3). " +
      "Ensaios importados das fichas DNER-ME são recalculados e comparados com os limites desta EM (o pior resultado de cada requisito). Massa específica: DNER-ME 190/94 (fora do acervo).",
    exemplos: [
      { nome: "Tinta branca — partida aceita (ensaios importados das fichas DNER-ME)", dados: function () {
        var d = { ident: { registro: "REC-TE-2026-01", data: "2026-02-10", obra: "Obra C — sinalização horizontal", origem: "Fornecedor C", camada: "Tinta estireno-acrilato — branca" },
          params: { cor: "branca", fabricante: "Fornecedor C", produto: "Tinta estireno-acrilato — branca", partida: "0209", dataFab: "12/01/2026", validade: "12/01/2027",
            nf: "003318", quantidade: "1620", nRec: "90", inspTipo: "normal", volAm: "3,6", recAm: "lata de 3,6 L lacrada nº 31" },
          insp: [{ n: "7", def: "0" }, {}] };
        return R.exemplo(F, d, [["dner-me-028-94", 0], ["dner-me-038-94", 0], ["dner-me-235-94", 0], ["dner-me-237-94", 0], ["dner-me-238-94", 0],
          ["dner-me-186-94", 0], ["dner-me-239-94", 0], ["dner-me-236-94", 0], ["dner-me-183-94", 0], ["dner-me-184-94", 0], ["dner-me-019-94", 0],
          ["dner-me-139-94", 0], ["dner-me-020-94", 0], ["dner-me-234-94", 0], ["dner-me-018-94", 0], ["dner-me-185-94", 0], ["dner-me-240-94", 0]],
          { aspecto: "atende", massaEsp: "1,41", resina: "atende" });
      } },
      { nome: "Tinta amarela — partida rejeitada (PbCrO₄, pigmento e sete ensaios qualitativos)", dados: function () {
        var d = { ident: { registro: "REC-TE-2026-02", data: "2026-07-08", obra: "Obra B — sinalização horizontal", origem: "Fornecedor B", camada: "Tinta estireno-acrilato — amarela" },
          params: { cor: "amarela", fabricante: "Fornecedor B", produto: "Tinta estireno-acrilato — amarela", partida: "0417", dataFab: "02/06/2026", nf: "220388",
            quantidade: "900", nRec: "50", inspTipo: "rigorosa", volAm: "3,6", naoRealizados: "dispensados" },
          insp: [{ n: "7", def: "0" }, {}] };
        return R.exemplo(F, d, [["dner-me-233-94", 1], ["dner-me-237-94", 1], ["dner-me-018-94", 1], ["dner-me-019-94", 1], ["dner-me-139-94", 1],
          ["dner-me-184-94", 1], ["dner-me-185-94", 1], ["dner-me-234-94", 1], ["dner-me-240-94", 1]],
          { aspecto: "atende" });
      } },
    ],
  });
})();
