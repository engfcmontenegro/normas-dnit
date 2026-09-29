/*
 * Ficha: DNIT 418/2019-EM — Pavimentação — Solo-cal — Cal virgem e cal hidratada — recebimento do lote.
 * Motor FE.recebimentoMaterialEM (site/fichas/dner-em-036-95.js). Limites da Tabela do Anexo A.
 */
(function () {
  "use strict";
  var FE = window.FE, RM = FE.recebimentoMaterialEM, ok = FE.ok;
  var ID = "dnit-418-2019-em";
  function cv(P) { return (P.classe || "CH") === "CV"; }
  function por(a, b, casas) { return function (P) { var x = cv(P) ? a : b; return x ? Object.assign({ casas: casas === undefined ? 1 : casas }, x) : null; }; }
  var GQ = "Exigências químicas (Anexo A)", GF = "Exigências físicas — granulometria (Anexo A)";
  var GRL = { p96: por({ min: 100, texto: "100 %" }, null), p48: por({ min: 100, texto: "100 %" }, null), p2: por({ min: 95 }, null),
    p021: por({ min: 70 }, { min: 98 }), p0075: por({ min: 50 }, { min: 93 }) };
  var CURVA = [[9.6, "p96"], [4.8, "p48"], [2, "p2"], [0.21, "p021"], [0.075, "p0075"]];

  FE.FICHAS[ID] = RM.criar({
    titulo: "Recebimento de cal virgem e cal hidratada (pavimentação)",
    resumo: "Cal virgem (CV) ou cal hidratada (CH): óxidos totais, CaO disponível, Ca(OH)₂, MgO, CO₂, SO₃, umidade, reatividade e granulometria comparados com o Anexo A; FISPQ, ficha técnica, certificado e fornecimento (4); contraprova por nova amostragem (7 c); parecer do lote (7).",
    tabela: "Tabela do Anexo A",
    classes: [["CV", "Cal virgem (óxido de cálcio)"], ["CH", "Cal hidratada (hidróxido de cálcio)"]],
    rotuloClasse: "Produto",
    padrao: { classe: "CH", embalagem: "granel" },
    params: [
      { k: "uso", r: "Finalidade", tipo: "select", opcoes: [["estab", "Melhoria/estabilização de solos (solo-cal)"], ["mistura", "Misturas asfálticas (fíler / melhorador de adesividade)"]] },
      { k: "embalagem", r: "Fornecimento (4.3)", tipo: "select", opcoes: [["granel", "A granel"], ["bigbag", "Big bags de 500 a 1 500 kg"], ["sacos", "Sacos de papel ou plástico (20 ou 25 kg)"]] },
    ],
    lote: { unid: "t" },
    rotuloDet: "Amostra",
    contraprova: { secao: "7 c", texto: "com nova amostragem na presença das partes, em laboratório escolhido por consenso" },
    ensaios: [
      { id: "oxt", grupo: GQ, r: "Óxidos totais (CaO + MgO), base não volátil", metodo: "NBR 6473", secao: "Anexo A", u: "%", casas: 1, lim: por({ min: 90 }, { min: 90 }) },
      { id: "caod", grupo: GQ, r: "Óxido de cálcio disponível (CaO disp.)", metodo: "NBR 6473", secao: "Anexo A", u: "%", casas: 1, lim: por({ min: 80 }, { min: 65 }) },
      { id: "caoh", grupo: GQ, r: "Hidróxido de cálcio — Ca(OH)₂", metodo: "NBR 6473", secao: "Anexo A", u: "%", casas: 1, lim: por(null, { min: 85 }) },
      { id: "mgo", grupo: GQ, r: "Óxido de magnésio (MgO)", metodo: "NBR 6473", secao: "Anexo A", u: "%", casas: 1, lim: por({ max: 5 }, { max: 5 }) },
      { id: "co2", grupo: GQ, r: "Anidrido carbônico (CO₂)", metodo: "NBR 6473", secao: "Anexo A", u: "%", casas: 1, lim: por({ max: 4 }, { max: 4 }) },
      { id: "so3", grupo: GQ, r: "Trióxido de enxofre (SO₃)", metodo: "NBR 6473", secao: "Anexo A", u: "%", casas: 1, lim: por({ max: 2 }, { max: 2 }) },
      { id: "umid", grupo: GQ, r: "Umidade", metodo: "NBR 6473", secao: "Anexo A", u: "%", casas: 1, lim: por(null, { max: 2 }) },
      { id: "reat", grupo: GQ, r: "Reatividade — tempo para elevação de 30 °C (ΔT 30°)", metodo: "NBR 10790", secao: "Anexo A", u: "min", casas: 1, lim: por({ max: 10, casas: 0 }, null) },
      { id: "p96", grupo: GF, r: "Passando na peneira de 9,6 mm", metodo: "NBR 9552", secao: "Anexo A", u: "%", casas: 1, lim: GRL.p96 },
      { id: "p48", grupo: GF, r: "Passando na peneira de 4,8 mm", metodo: "NBR 9552", secao: "Anexo A", u: "%", casas: 1, lim: GRL.p48 },
      { id: "p2", grupo: GF, r: "Passando na peneira de 2 mm", metodo: "NBR 9552", secao: "Anexo A", u: "%", casas: 1, lim: GRL.p2 },
      { id: "p021", grupo: GF, r: "Passando na peneira de 0,21 mm", metodo: "NBR 9552 (CV) / NBR 9289 (CH)", secao: "Anexo A", u: "%", casas: 1, lim: GRL.p021 },
      { id: "p0075", grupo: GF, r: "Passando na peneira de 0,075 mm", metodo: "NBR 9552 (CV) / NBR 9289 (CH)", secao: "Anexo A", u: "%", casas: 1, lim: GRL.p0075 },
    ],
    inspecao: [
      { k: "iFispq", r: "Acompanhada da FISPQ (NBR 14725-4)", secao: "4.1", exigido: "FISPQ entregue", falha: "ressalva" },
      { k: "iCert", r: "Certificado do fabricante/distribuidor com os ensaios da EM, data de fabricação, procedência, tipo e quantidade", secao: "4.2", exigido: "certificado completo", falha: "ressalva" },
      { k: "iFicha", r: "Ficha técnica do produto (nome técnico e comercial, fabricante, características, finalidade, instruções)", secao: "4.2", exigido: "ficha técnica entregue", falha: "ressalva", opcional: true },
      { k: "iEmb", r: "Fornecimento e armazenagem: produto seco, embalagens fechadas sobre paletes e cobertas / silos adequados", secao: "4.3 / 4.4", exigido: "atende", falha: "ressalva" },
      { k: "iAmostra", r: "Amostragem conforme a NBR 6471", secao: "6 b", exigido: "atende" },
    ],
    graficos: function (calc, d, opt) {
      var V = calc.resultados.V, P = d.params || {};
      var pts = CURVA.map(function (c) { return { mm: c[0], pass: V[c[1]] }; }).filter(function (p) { return ok(p.pass); });
      if (!pts.length) return [];
      return [RM.graficoGran("Granulometria da " + (cv(P) ? "cal virgem" : "cal hidratada") + " (Anexo A — mínimos)", [{ pts: pts }],
        CURVA.map(function (c) { var l = GRL[c[1]](P); return l ? { mm: c[0], min: l.min, max: 100 } : null; }).filter(Boolean), opt)];
    },
    notas: "Limites da Tabela do Anexo A da DNIT 418/2019-EM (cal virgem | cal hidratada): óxidos totais (CaO + MgO) em base não volátil ≥ 90,0 | ≥ 90,0 %; CaO disponível ≥ 80,0 | ≥ 65,0 %; " +
      "Ca(OH)₂ — | ≥ 85,0 %; MgO ≤ 5,0 %; CO₂ ≤ 4,0 %; SO₃ ≤ 2,0 %; umidade — | ≤ 2,0 %; reatividade ΔT 30 °C ≤ 10 min | —; passando em 9,6 e 4,8 mm 100 % | —; em 2 mm ≥ 95 % | —; " +
      "em 0,21 mm ≥ 70 | ≥ 98 %; em 0,075 mm ≥ 50 | ≥ 93 %. Resultado = média das amostras. Aceitação (7): lote aceito quando os resultados atendem (ou por acordo entre as partes, 7 b); " +
      "resultados fora ou dúvida na coleta: nova amostragem na presença das partes e repetição em laboratório escolhido por consenso (7 c). O hidróxido de cálcio em suspensão aquosa " +
      "(3.3) não tem coluna na Tabela do Anexo A.",
    exemplos: [
      { nome: "Cal hidratada para solo-cal — lote aceito", dados: function () {
        return { ident: { registro: "REC-CAL-01", data: "2026-02-24", obra: "Obra A", origem: "Fornecedor A", camada: "Sub-base de solo-cal" },
          params: { classe: "CH", uso: "estab", embalagem: "bigbag", fornecedor: "Fornecedor A", nf: "33012", quantidade: "24", dataReceb: "24/02/2026", dataAmostra: "24/02/2026",
            iFispq: "S", iCert: "S", iFicha: "S", iEmb: "S", iAmostra: "S" },
          det: [{ oxt: "94,8", caod: "71,2", caoh: "89,6", mgo: "1,2", co2: "2,6", so3: "0,4", umid: "0,9", p021: "99,4", p0075: "95,8" },
            { oxt: "95,1", caod: "70,6", caoh: "89,1", mgo: "1,3", co2: "2,8", so3: "0,4", umid: "1,1", p021: "99,2", p0075: "95,1" }] };
      } },
      { nome: "Cal virgem micro granulada — reprovada (CaO disponível, CO₂, reatividade, finos)", dados: function () {
        return { ident: { registro: "REC-CAL-02", data: "2026-05-11", obra: "Obra B", origem: "Fornecedor B", camada: "Estabilização de subleito" },
          params: { classe: "CV", uso: "estab", embalagem: "granel", fornecedor: "Fornecedor B", quantidade: "30", dataReceb: "11/05/2026", dataAmostra: "11/05/2026",
            iFispq: "S", iCert: "N", iEmb: "S", iAmostra: "S" },
          det: [{ oxt: "91,5", caod: "76,4", mgo: "2,1", co2: "5,2", so3: "0,6", reat: "13,5", p96: "100", p48: "100", p2: "96,8", p021: "68,2", p0075: "47,5" },
            { oxt: "91,0", caod: "75,8", mgo: "2,3", co2: "5,6", so3: "0,7", reat: "14,2", p96: "100", p48: "100", p2: "96,1", p021: "66,9", p0075: "46,8" }] };
      } },
    ],
  });
})();
