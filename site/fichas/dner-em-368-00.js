/*
 * Ficha: DNER-EM 368/00 — Tinta para sinalização horizontal rodoviária à base de resina acrílica e/ou vinílica
 * (base solvente) — recebimento da partida.
 * Motor comum: FE.recebimentoMaterial.tinta (site/fichas/dner-em-276-00.js); limites de FE.sinalizacao
 * (site/fichas/dner-me-018-94.js), conferidos com as Tabelas 1 e 2 do PDF da EM.
 */
(function () {
  "use strict";
  var R = window.FE.recebimentoMaterial;

  var F = window.FE.FICHAS["dner-em-368-00"] = R.tinta({
    em: "em368", codigo: "DNER-EM 368/00",
    titulo: "Recebimento de tinta para sinalização horizontal — resina acrílica e/ou vinílica (base solvente)",
    resumo: "Recebimento da partida: inspeção visual dos recipientes (DNER-PRO 231/94), amostra (DNER-PRO 104/94) e requisitos das Tabelas 1 e 2 (consistência, estabilidade, não voláteis, pigmento, TiO₂ ou PbCrO₄, veículo, secagem, abrasão, massa específica, brilho, cor e ensaios qualitativos), com importação das fichas DNER-ME e parecer (seção 7).",
    tabQuant: "Tabela 1", tabQual: "Tabela 2",
    quant: ["consistencia", "estabArm", "naoVolatil", "pigmento", "tio2", "pbcro4", "veicNV", "veicTotal", "secagem", "abrasao", "massaEsp", "brilho"],
    qual: ["cor", "flexibilidade", "sangramento", "agua", "calor", "diluicao", "aderencia", "nata", "breu",
      { id: "ivnv", r: "Identificação do veículo não volátil (espectrograma no infravermelho)", metodo: "método não citado na EM",
        exig: "bandas de resinas acrílicas e/ou vinílicas", bom: "atende", mau: "não atende", ph: "atende / não atende" }],
    notas: "Critérios da DNER-EM 368/00: condições gerais (seção 4), Tabela 1 (quantitativos) e Tabela 2 (qualitativos). Cromato de chumbo (tinta amarela): a EM permite substituir até 15 % do teor utilizado por TiO₂. " +
      "Inspeção visual pela DNER-PRO 231/94 (Tabela 1 normal / Tabela 2 rigorosa) — rejeição total ou parcial à vista da inspeção (7.1); amostragem pela DNER-PRO 104/94 (≥ 2 L por cor, tipo e lote). " +
      "A partida que satisfaz as seções 4 e 5 é aceita; caso contrário, rejeitada (7.2). A exclusivo critério do órgão, podem ser dispensados ensaios (6.3.3). " +
      "Ensaios importados das fichas DNER-ME são recalculados e comparados com os limites desta EM (o pior resultado de cada requisito). Massa específica: DNER-ME 190/94 (fora do acervo); veículo total e veículo não volátil: DNER-PRO 250/94 (calculados na ficha da DNER-ME 235/94 quando o teor de pigmento é informado).",
    exemplos: [
      { nome: "Tinta branca — partida aceita (ensaios importados das fichas DNER-ME; inspeção com lote de 300 recipientes)", dados: function () {
        var d = { ident: { registro: "REC-TS-2026-01", data: "2026-03-18", obra: "Obra A — sinalização horizontal", origem: "Fornecedor A", camada: "Tinta acrílica base solvente — branca" },
          params: { cor: "branca", fabricante: "Fornecedor A", produto: "Tinta acrílica base solvente — branca", partida: "0001", dataFab: "20/02/2026", validade: "20/02/2027",
            nf: "007781", quantidade: "5400", nRec: "300", inspTipo: "normal", volAm: "3,6", recAm: "lata de 3,6 L lacrada nº 08" },
          insp: [{ n: "15", def: "1", tipos: "1 lata com identificação ilegível" }, { n: "30", def: "0" }] };
        return R.exemplo(F, d, [["dner-me-028-94", 0], ["dner-me-038-94", 0], ["dner-me-235-94", 0], ["dner-me-237-94", 0], ["dner-me-238-94", 0],
          ["dner-me-186-94", 0], ["dner-me-239-94", 0], ["dner-me-236-94", 0], ["dner-me-183-94", 0], ["dner-me-019-94", 0], ["dner-me-018-94", 0],
          ["dner-me-020-94", 0], ["dner-me-234-94", 0], ["dner-me-184-94", 0], ["dner-me-139-94", 0], ["dner-me-185-94", 0], ["dner-me-240-94", 0]],
          { aspecto: "atende", massaEsp: "1,38", ivnv: "atende" });
      } },
      { nome: "Tinta amarela — partida rejeitada (consistência, estabilidade, secagem, brilho e cor)", dados: function () {
        var d = { ident: { registro: "REC-TS-2026-02", data: "2026-06-02", obra: "Obra B — sinalização horizontal", origem: "Fornecedor B", camada: "Tinta base solvente — amarela" },
          params: { cor: "amarela", fabricante: "Fornecedor B", produto: "Tinta base solvente — amarela", partida: "0417", dataFab: "05/05/2026", nf: "220145",
            quantidade: "2160", nRec: "120", inspTipo: "normal", volAm: "3,6" },
          insp: [{ n: "7", def: "0" }, {}] };
        return R.exemplo(F, d, [["dner-me-028-94", 1], ["dner-me-038-94", 1], ["dner-me-186-94", 1], ["dner-me-236-94", 1], ["dner-me-183-94", 1],
          ["dner-me-233-94", 0]],
          { aspecto: "atende", naoVolatil: "64,2", pigmento: "44,5" });
      } },
    ],
  });
})();
