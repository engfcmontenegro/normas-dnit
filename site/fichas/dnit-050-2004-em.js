/*
 * Ficha: DNIT 050/2004-EM — Pavimento rígido — Cimento Portland — recebimento do lote.
 * Usa o motor FE.recebimentoMaterialEM e a configuração de cimento definidos em site/fichas/dner-em-036-95.js
 * (carregado antes deste arquivo).
 */
(function () {
  "use strict";
  var FE = window.FE, RM = FE.recebimentoMaterialEM;

  FE.FICHAS["dnit-050-2004-em"] = RM.criar(RM.cimento("050", {
    titulo: "Recebimento de cimento Portland para pavimento rígido",
    resumo: "Lote de até 30 t (6 c): exigências químicas (Tabela 2), físicas e mecânicas (Tabela 3) e teores dos componentes (Tabela 1) por tipo e classe; embalagem, massa dos sacos (7 e, 7 f), armazenamento (7 d), prazo da amostra (6 f) e contraprova no exemplar testemunho (7 c); parecer do lote.",
    tabela: "DNIT 050/2004-EM",
    contraprova: { secao: "7 c", texto: "no exemplar testemunho, em laboratório escolhido por consenso" },
    textos: { REJEITADO: { texto: "Há requisito da DNIT 050/2004-EM não atendido: o lote não deve ser empregado (resolva o impasse pela repetição dos ensaios no exemplar testemunho, 7 c)." } },
    notas: "Limites das Tabelas 2 e 3 (Anexos B e C) da DNIT 050/2004-EM por tipo e classe (4.2); teores da Tabela 1 (Anexo A) avaliados quando informados. Resultado de cada ensaio = média das " +
      "determinações, arredondada como indicado. Ensaios facultativos (nota 1 da Tabela 3): fim de pega e expansibilidade a frio. Aceitação (7): lote aceito quando todas as exigências são " +
      "atendidas; rejeitar sacos rasgados, molhados ou avariados e granel/contêiner contaminado (7 b); resultados fora: repetir no exemplar testemunho (7 c); reensaiar após 6 meses a granel/contêiner " +
      "ou 3 meses em sacos (7 d); rejeitar sacos com variação de 2 % sobre 50 kg (7 e) e o lote se a média de 30 sacos < 50 kg (7 f). Prazos (6 f): amostra no laboratório em até 10 dias; " +
      "resultados de resistência em até 11, 13, 17, 38 e 101 dias da amostragem para 1, 3, 7, 28 e 91 dias. Fim de pega do CP IV: a Tabela 3 traz \"≤ 2(1)\"; adotado ≤ 12 h, como o CP III e a " +
      "DNER-EM 036/95 (Quadro V). O CP V-ARI é para reparos de pequenas áreas (3.3, nota).",
    providencias: function (par, linhas, P) {
      return P.classe === "V" ? ["CP V-ARI: em pavimentação só para reparos de pequenas áreas, quando for necessária a rápida liberação ao tráfego (3.3, nota)."] : [];
    },
    exemplos: [
      { nome: "CP III-40 a granel para pavimento de concreto — lote aceito (com 91 dias)", dados: function () {
        return { ident: { registro: "REC-CIM-PR-01", data: "2026-04-06", obra: "Obra C — pavimento de concreto", origem: "Fabricante A", camada: "Placas de concreto" },
          params: { classe: "III-40", entrega: "granel", fornecedor: "Fabricante A — marca X", nf: "118201", quantidade: "29,4", dataReceb: "06/01/2026", dataAmostra: "06/01/2026",
            dataFab: "02/01/2026", dataLab: "08/01/2026", dataUso: "06/04/2026", iMarc: "S", iInteg: "S", iArm: "S", iTest: "S" },
          det: [{ ri: "0,92", pf: "2,85", so3: "2,40", co2: "1,85", s: "0,55", r075: "0,6", pegaIni: "3,6", pegaFim: "5,2", expQ: "0,0", expF: "0,5", rc3: "16,2", rc7: "27,4", rc28: "45,8", rc91: "53,1", tEsc: "52" },
            { ri: "0,88", pf: "2,91", so3: "2,44", co2: "1,79", s: "0,57", r075: "0,8", pegaIni: "3,8", expQ: "0,5", rc3: "16,8", rc7: "27,9", rc28: "46,4", rc91: "53,9" }] };
      } },
      { nome: "CP II-Z-32 em sacos — reprovado (perda ao fogo, 28 dias, sacos leves; lote > 30 t)", dados: function () {
        return { ident: { registro: "REC-CIM-PR-02", data: "2026-06-15", obra: "Obra D", origem: "Fabricante C", camada: "Pavimento de concreto — reparos" },
          params: { classe: "IIZ-32", entrega: "sacos", fornecedor: "Fabricante C — marca Z", quantidade: "36", dataReceb: "15/06/2026", dataAmostra: "15/06/2026", dataLab: "17/06/2026",
            dataUso: "20/07/2026", iMarc: "S", iInteg: "N", iArm: "S", iTest: "S",
            massasSacos: "49,6; 49,8; 49,5; 50,0; 49,7; 48,8; 49,9; 49,6; 49,8; 50,1; 49,7; 49,4; 49,9; 49,6; 49,8; 49,5; 50,0; 49,7; 49,9; 49,6; 49,8; 49,7; 49,5; 49,9; 50,0; 49,6; 49,8; 49,7; 49,9; 49,6" },
          det: [{ ri: "10,4", pf: "6,85", mgo: "3,10", so3: "3,20", co2: "4,40", r075: "3,5", blaine: "372", pegaIni: "2,9", expQ: "1,0", rc3: "18,4", rc7: "24,1", rc28: "30,6", tPoz: "12" },
            { ri: "10,8", pf: "6,79", mgo: "3,06", so3: "3,26", co2: "4,52", r075: "3,7", blaine: "368", pegaIni: "3,1", expQ: "0,5", rc3: "18,0", rc7: "23,7", rc28: "31,0" }] };
      } },
    ],
  }));
})();
