/*
 * Ficha: DNER-EM 262/94 — Escórias de aciaria para pavimentos rodoviários — aceitação do lote.
 * Motor FE.recebimentoMaterialEM (site/fichas/dner-em-036-95.js) e configuração das escórias
 * (FE.recebimentoMaterialEM.escoria, site/fichas/dner-em-260-94.js), carregados antes deste arquivo.
 */
(function () {
  "use strict";
  var FE = window.FE, RM = FE.recebimentoMaterialEM;
  var ID = "dner-em-262-94";

  FE.FICHAS[ID] = RM.criar(RM.escoria("aciaria", {
    titulo: "Aceitação de escória de aciaria para pavimentação",
    resumo: "Potencial de expansão (PTM 130 / DNIT 113-ME, máx. 3 % ou o projeto), impurezas e granulometria (4); absorção, massa específica, massa unitária, Los Angeles e durabilidade ao sulfato de sódio (5.1); lote de amostragem ≤ 2 000 t (6.1); parecer (7).",
    notas: "DNER-EM 262/94: 4.1 — potencial de expansão pelo PTM 130 adaptado pelo DER-MG (DNIT 113-ME), máx. 3 % ou o valor da especificação particular; 4.2 — isenta de impurezas orgânicas, " +
      "escória de alto-forno e solos; 4.3 — 40 % até 1/2\" e 60 % de 1/2\" a 2\", atendendo à granulometria de projeto. 5.1: absorção 1 % a 2 % e massa específica 3 a 3,5 g/cm³ (NBR 9937), massa " +
      "unitária 1,5 a 1,7 kg/dm³ (NBR 7251), Los Angeles ≤ 25 % (NBR 6465; a EM cita \"sub-base e revestimento\"), durabilidade ao sulfato de sódio, 5 ciclos, 0 a 5 % (ASTM C 88). Resultados = " +
      "média das amostras. Aceitação (7.1): atender a esta Norma e às especificações particulares do projeto; caso contrário, rejeitar (7.2).",
    exemplos: [
      { nome: "Escória de aciaria envelhecida para sub-base — lote aceito (expansão importada da DNIT 113-ME)", dados: function () {
        var d = { ident: { registro: "REC-EAC-01", data: "2026-06-02", obra: "Obra C", origem: "Usina C", camada: "Sub-base" },
          params: { camada: "subbase", meTipo: "real", fornecedor: "Usina C — pátio de cura", quantidade: "1800", dataReceb: "02/06/2026", dataAmostra: "02/06/2026",
            iImp: "S", iProj: "S", iPart: "S", iNota: "S" },
          det: [{ abs: "1,45", me: "3,280", mu: "1,62", la: "21", dur: "1,8", p12: "38,5", p50: "100" }, { mu: "1,64", la: "22", dur: "2,2", p12: "40,1", p50: "100" }] };
        RM.importarEx(ID, d, "impExp", [["dnit-113-2009-me", 0]]);
        return d;
      } },
      { nome: "Escória pouco curada para revestimento — rejeitada (expansão, absorção, Los Angeles, contaminação)", dados: function () {
        var d = { ident: { registro: "REC-EAC-02", data: "2026-07-08", obra: "Obra D", origem: "Usina D", camada: "Revestimento" },
          params: { camada: "rev", meTipo: "real", fornecedor: "Usina D", quantidade: "1500", dataReceb: "08/07/2026", dataAmostra: "08/07/2026", iImp: "N", iProj: "S" },
          det: [{ abs: "2,35", me: "3,420", mu: "1,68", la: "27", dur: "3,1", p12: "42,0", p50: "100" }, { abs: "2,41", me: "3,405", mu: "1,66", la: "29", dur: "3,5", p12: "43,2", p50: "100" }] };
        RM.importarEx(ID, d, "impExp", [["dnit-113-2009-me", 1]]);
        return d;
      } },
    ],
  }));
})();
