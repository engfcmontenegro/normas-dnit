/*
 * Ficha: DNER-EM 379/98 — Esferas de vidro para sinalização rodoviária horizontal — recebimento do lote.
 * Motor: FE.recebimentoMaterial.microesferas (site/fichas/dner-em-373-00.js). Faixa granulométrica: Tabela 1 da EM
 * (conferida no PDF); ensaios de origem DNER-ME 011, 013, 014, 022, 023, 057, 058 e 110/94.
 */
(function () {
  "use strict";
  var FE = window.FE, R = FE.recebimentoMaterial;

  var FX379 = { nome: "esferas de vidro", ref: "DNER-EM 379/98, Tabela 1",
    p: [[12, "1,7 mm", 100, 100], [14, "1,4 mm", 95, 100], [16, "1,2 mm", 80, 95], [18, "1,0 mm", 10, 40], [20, "0,84 mm", 0, 5], [25, "0,70 mm", 0, 2]] };

  var F = FE.FICHAS["dner-em-379-98"] = R.microesferas({
    em: "379", codigo: "DNER-EM 379/98",
    titulo: "Recebimento de esferas de vidro para sinalização horizontal",
    resumo: "Recebimento do lote (sacos de 25 kg): inspeção visual (DNER-PRO 132/94), amostra (DNER-PRO 251/94) e requisitos 4.3 e 5.1 a 5.9 — resistências químicas, sílica, aparência e defeitos, índice de refração, massa específica (2,4 a 2,6 g/cm³) e granulometria da Tabela 1, com importação das fichas DNER-ME e parecer (6.2).",
    secoes: { cacl2: "5.1", hcl: "5.2", agua: "5.3", na2s: "5.4", silica: "5.5", aparencia: "5.6", ir: "5.7", me: "5.8", gran: "5.9 · Tabela 1" },
    umidade: false, chumbo: "qual", massaEsp: { min: 2.4, max: 2.6 },
    faixas: function () { return FX379; },
    nomeMaterial: function () { return "Esferas de vidro (diâmetro máximo 1,7 mm)"; },
    params: [], padrao: {},
    secInspecao: "6.1 · 6.2.1", secAmostra: "4.2 · 6.1", secRejInsp: "6.2.1", secAceita: "6.2.3", secRejeita: "6.2.3", dispensa: null,
    conferirOrigem: function (e, P, notas) {
      if (e.ficha === "dner-me-058-94") {
        var t = ((e.dados || {}).params || {}).tipo;
        if (t && t !== "E379") notas.push(FE.aceitacao.importacao.rotulo(e) + ": granulometria ensaiada com a série/faixa do tipo " + t + "; as esferas da DNER-EM 379/98 usam as peneiras nº 12 a 25.");
      }
    },
    notas: "Critérios da DNER-EM 379/98: vidro soda-cal sem chumbo (4.3) e requisitos 5.1 a 5.9 (resistências ao CaCl₂, HCl, água — sem embaçar e ≤ 4,5 ml de HCl 0,10 N —, Na₂S; sílica ≥ 65 %; até 3 % quebradas/não fundidas e 30 % ovóides/deformadas; índice de refração ≥ 1,50; massa específica 2,4 a 2,6 g/cm³; granulometria da Tabela 1). " +
      "A EM não exige resistência à umidade (DNER-ME 015) nem prevê dispensa de ensaios. Inspeção visual pela DNER-PRO 132/94 — rejeição total ou parcial à vista da inspeção (6.2.1); amostra pela DNER-PRO 251/94. " +
      "Com a inspeção favorável, os resultados de cada partida são aferidos com a especificação (6.2.2): atendidas todas as exigências, o material é aceito; caso contrário, rejeitado (6.2.3). " +
      "A seção 5 da EM salta de 5.9 para 5.11 (não há 5.10). Aberturas da Tabela 1 conforme a EM (1,2 e 0,70 mm; nominais 1,18 e 0,710 mm).",
    exemplos: [
      { nome: "Esferas de vidro — lote aceito (ensaios importados; granulometria digitada)", dados: function () {
        var d = { ident: { registro: "REC-EV-2026-01", data: "2026-05-06", obra: "Obra C — sinalização horizontal", origem: "Fornecedor C", camada: "Esferas de vidro" },
          params: { fabricante: "Fornecedor C", produto: "Esferas de vidro 1,7 mm", partida: "EV-0412", dataFab: "12/04/2026", nf: "031007", quantidade: "2500",
            nRec: "100", inspTipo: "normal", sacosAm: "4", massaAm: "2530" },
          insp: [{ n: "2", def: "0" }, {}],
          gran: [{ p12: "100", p14: "98,4", p16: "88,1", p18: "27,5", p20: "2,3", p25: "0,6" }] };
        return R.exemplo(F, d, [["dner-me-011-94", 0], ["dner-me-014-94", 0], ["dner-me-023-94", 0], ["dner-me-022-94", 0], ["dner-me-057-94", 0],
          ["dner-me-110-94", 0], ["dner-me-013-94", 0]],
          { chumbo: "isento de chumbo", aparencia: "atende", quebradas: "0,8", ovoides: "9" });
      } },
      { nome: "Esferas de vidro — lote rejeitado (massa específica, sílica, HCl e resistência à água)", dados: function () {
        var d = { ident: { registro: "REC-EV-2026-02", data: "2026-06-17", obra: "Obra B — sinalização horizontal", origem: "Fornecedor B", camada: "Esferas de vidro" },
          params: { fabricante: "Fornecedor B", produto: "Esferas de vidro", partida: "EV-0520", dataFab: "20/05/2026", nf: "045377", quantidade: "5000",
            nRec: "200", inspTipo: "normal", sacosAm: "2", massaAm: "2450" },
          insp: [{ n: "4", def: "1", tipos: "1 saco com identificação incompleta" }, { n: "6", def: "0" }],
          gran: [{ p12: "100", p14: "96,0", p16: "82,5", p18: "38,0", p20: "4,1", p25: "1,5" }] };
        return R.exemplo(F, d, [["dner-me-013-94", 1], ["dner-me-057-94", 1], ["dner-me-014-94", 1], ["dner-me-023-94", 1]],
          { chumbo: "isento de chumbo", aparencia: "atende", quebradas: "1,5", ovoides: "12", cacl2: "não embaçada", na2s: "não embaçada", ir: "1,51" });
      } },
    ],
  });
})();
