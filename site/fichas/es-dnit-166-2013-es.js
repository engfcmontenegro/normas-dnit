/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 166/2013-ES — Reciclagem de pavimento a frio "in situ" com adição de espuma de asfalto.
 * Usa FE.aceitacaoG2.espumaAsfalto (es-dnit-140-2022-es.js), comum com a DNIT 169/2014-ES (usina). O que a ES manda:
 *   5.1.2 espuma: taxa de expansão ≥ 10; meia-vida ≥ 8 s.   5.1.3 c / 7.1.1 finura do cimento a cada 250 m de faixa.
 *   5.1.5 agregados adicionais: LA ≤ 55 % (maior com desempenho comprovado), IF ≥ 0,5, durabilidade < 12 %; EA ≥ 40 %.
 *   5.3.1 c mistura: RT seca ≥ 0,25 MPa e saturada ≥ 0,15 MPa a 25 °C; granulometria na faixa da Tabela 1 (± tolerância do projeto).
 *   5.3.2.2 umidade entre 0,9 e 1,1 vez a do ensaio de compactação.   5.3.3 d espessura compactada ≥ 10 cm.
 *   7.2.1 a cada 250 m de faixa: cimento incorporado, Proctor modificado, umidade, granulometria e teor de betume, 2 CPs Marshall
 *         para RT (seca e saturada, 72 h a 60 °C), 2 CPs para massa específica, densidade in situ; MR: 2 por traço.
 *   7.2.2 espuma a cada 500 m de faixa ou jornada de 8 h.   7.2.3 GC ≥ 100 % da maior massa específica (Proctor modificado ou
 *         Marshall 75 golpes), a cada 250 m de faixa ou jornada.   7.3 geometria (largura até +10 cm; flecha +20 % ou
 *         declividade +0,5 %, sem falta; espessura ± 10 %); NOTA: deflexão complementar.
 *   7.4.2 X̄ ± k·s, k da Tabela 1 da DNER-PRO 277/97 (sem n = 11).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G2 = FE.aceitacaoG2;
  var PEN = ["p50_8", "p38_1", "p25_4", "p19_1", "p12_7", "p9_5", "p6_3", "p4_75", "p2_36", "p1_18", "p0_6", "p0_425", "p0_3", "p0_15", "p0_075"];
  function gran(est, reg, vals) { var c = { est: est, reg: reg }; PEN.forEach(function (k, i) { c[k] = String(vals[i]).replace(".", ","); }); return c; }
  G2.gran15 = gran;
  G2.espumaAsfalto({
    id: "dnit-166-2013-es", codigo: "DNIT 166/2013-ES", usina: false, rtCura: "60 °C", rtCPs: "2 CPs Marshall (75 golpes/face) por ponto, 72 h em estufa a 60 °C",
    s: { espuma: "5.1.2", agreg5: "5.1.5", agreg7: "7.1.2", tab1: "5.3.1 c", rt: "5.3.1 c", umid: "5.3.2.2 / 7.2.1 c", mist: "7.2.1", gc: "7.2.3", espum7: "7.2.2",
      fin: "5.1.3 c / 7.1.1", geo: "7.3", defl: "7.3", espLim: { min: 10, secao: "5.3.3 d", texto: "a espessura compactada na fase final nunca pode ser inferior a 10 cm" } },
    freqMist: { por: "faixa", a_cada: 250 },
    titulo: "Reciclagem a frio in situ com espuma de asfalto — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência (a cada 250 m de faixa) e aplica os critérios da DNIT 166/2013-ES: " +
      "umidade 0,9 a 1,1 × h ót, GC ≥ 100 % da maior massa específica (Proctor modificado ou Marshall), granulometria na Tabela 1, RT seca ≥ 0,25 MPa e saturada ≥ 0,15 MPa, " +
      "espuma (expansão ≥ 10, meia-vida ≥ 8 s), agregados adicionais, controle geométrico e deflexão complementar (7.4.2, Tabela 1 da DNER-PRO 277/97).",
    verificacoes: [
      { id: "cap", texto: "CAP 50/70, 85/100 ou 150/200 com certificado; penetração e viscosidade em cada carregamento", secao: "4 c / 5.1.1 / 7.1.3" },
      { id: "cim", texto: "Cimento com certificado de fabricação (DNER-EM 036)", secao: "5.1.3 a, b" },
      { id: "chuva", texto: "Sem execução em dias de chuva", secao: "4 b" },
      { id: "poco", texto: "Poço de sondagem a cada 500 m (espessuras, granulometria, umidade, betume)", secao: "5.3.1 a" },
      { id: "proj", texto: "Projeto da mistura aprovado pela Fiscalização antes da execução", secao: "5.3.1 b" },
      { id: "junta", texto: "Sobreposição ≥ 15 cm entre passadas, sem espuma nem água na sobreposição", secao: "5.3.2.3" },
      { id: "cura", texto: "Cura com pintura de ligação (DNIT 145) logo após a execução", secao: "5.3.3 i" },
      { id: "traf", texto: "Abertura ao tráfego só após a pintura de proteção", secao: "5.3.3 k" },
    ],
    notas: "DNIT 166/2013-ES. Frequências da mistura a cada 250 m de extensão de faixa de tráfego (7.2.1); GC a cada 250 m de faixa ou por jornada de 8 h (7.2.3 a — adotado o maior); " +
      "espuma a cada 500 m de faixa ou por jornada (7.2.2). Granulometria: Tabela 1 ∩ projeto ± tolerância; na Tabela 1 a tolerância da 2\" aparece como \"- 7\" (lida ± 7) e a nº 200 (5–20) tem máximo maior que a nº 100 (7–17). " +
      "Largura: a ES admite até +10 cm em excesso e não diz \"sem falta\" (avaliada estatisticamente). MR (DNIT 135) e teor de betume sem limite na ES (informativos). " +
      "Métodos citados e substituídos: DNER-ME 052 → DNIT 456; DNER-ME 092 → DNIT 458; DNER-ME 035 → DNIT 451; DNER-ME 054 → DNIT 450.",
    exemplos: function (F) {
      var X = G2.ex;
      function base(reg, extra) {
        return { ident: Object.assign({ registro: reg, data: "2026-04-22", obra: "Obra G — BR-000", origem: "Pavimento existente + CAP 50/70 da Distribuidora C", camada: "Base reciclada com espuma de asfalto (2,5 % CAP + 1 % cimento)" }, extra.ident || {}),
          params: Object.assign({}, F.padrao, extra.params), umid: [{}], comp: [{}], gc: [{}], gran: [{}], bet: [{}], rt: [{}], esp: [{}], fin: [{}], cim: [{}], mr: [{}], obs: "" };
      }
      return [
        { nome: "Lote aceito — 500 m de uma faixa (RT da DNIT 180 e Proctor modificado da DNIT 164 importados)", dados: function () {
          var d = base("LOTE-RE-01", { ident: { trecho: "Faixa direita", local: "Est. 700 a 725" },
            params: { estIni: "700", estFim: "725", largura: "3,60", espessura: "20", jornadas: "2", betProj: "5,0", taxaProj: "4,0" } });
          X.importar(F, d, "impComp", [["dnit-164-2013-me", 2]]);
          d.comp[0].est = "705"; d.comp[0].gm = "2,165";
          d.comp.push({ est: "718", reg: "DNIT 164 (digitado)", gs: "2,176", hot: "6,7", gm: "2,158" });
          d.umid = X.cols(["w"], [["705", 6.5], ["718", 6.9]], { reg: "Speedy" });
          d.gc = [["701", "LE", 100.6], ["705", "eixo", 101.3], ["710", "LD", 100.9], ["715", "LE", 101.8], ["720", "eixo", 100.7], ["724", "LD", 101.2]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1), gref: "2,183" }; });
          d.gran = [gran("705", "GR-11 · DNIT 412", [100, 95, 88, 81, 71, 62, 52, 45, 33, 25, 21, 19, 16, 12, 9]),
            gran("718", "GR-12 · DNIT 412", [100, 93, 86, 80, 69, 60, 50, 44, 32, 24, 20, 18, 15, 11, 8])];
          d.proj = [gran("", "", [100, 94, 87, 81, 70, 61, 51, 45, 33, 25, 21, 19, 16, 12, 9])];
          delete d.proj[0].est; delete d.proj[0].reg;
          d.bet = X.cols(["tb"], [["705", 5.1], ["718", 4.8]], { reg: "Teor de betume" });
          X.importar(F, d, "impRT", [["dnit-180-2018-me", 1]]);
          d.rt[0].est = "705";
          d.rt.push({ est: "718", reg: "RT · DNIT 136 (digitado)", ncp: "2", rts: "0,41", rtu: "0,33" });
          d.esp = X.cols(["exp", "mv"], [["703", 12, 11], ["716", 13, 10]], { reg: "Espuma" });
          d.fin = X.cols(["res"], [["canteiro", 2.2], ["canteiro", 2.6]], { reg: "NBR 11579" });
          d.cim = X.cols(["taxa"], [["705", 4.1], ["718", 3.9]], { reg: "Pesagem" });
          d.mr = X.cols(["mr"], [["705", 2480], ["718", 2610]], { reg: "DNIT 135" });
          d.geo = X.secoes(700, [[3.64, 20.3, 3.1, 3.0], [3.62, 19.6, 3.2, 3.1], [3.66, 20.8, 3.0, 3.2], [3.63, 19.9, 3.1, 3.1], [3.65, 20.2, 3.3, 3.0], [3.61, 20.5, 3.2, 3.1],
            [3.64, 19.7, 3.0, 3.2], [3.66, 20.1, 3.1, 3.1], [3.62, 20.4, 3.2, 3.0], [3.63, 19.8, 3.3, 3.2], [3.65, 20.6, 3.1, 3.1], [3.64, 20.0, 3.0, 3.3], [3.62, 19.9, 3.2, 3.2],
            [3.66, 20.3, 3.1, 3.0], [3.63, 20.1, 3.0, 3.1], [3.64, 19.6, 3.2, 3.2], [3.65, 20.5, 3.1, 3.0], [3.62, 20.2, 3.3, 3.1], [3.64, 19.8, 3.0, 3.2], [3.63, 20.4, 3.1, 3.1],
            [3.66, 20.0, 3.2, 3.0], [3.62, 19.7, 3.1, 3.2], [3.65, 20.3, 3.0, 3.1], [3.64, 20.1, 3.2, 3.1], [3.63, 19.9, 3.1, 3.0], [3.65, 20.2, 3.3, 3.2]]);
          d.verif = X.verif(8);
          d.obs = "Exemplo: γs,máx (DNIT 164, energia modificada) e RT seca/condicionada (DNIT 180, exemplo nº 2) importados dos exemplos das fichas ME; demais determinações digitadas.";
          return d;
        } },
        { nome: "Lote rejeitado — RT seca < 0,25 MPa, meia-vida da espuma < 8 s, umidade fora de 0,9–1,1 × h ót, GC baixo", dados: function () {
          var d = base("LOTE-RE-02", { ident: { trecho: "Faixa esquerda", local: "Est. 800 a 825" },
            params: { estIni: "800", estFim: "825", largura: "3,60", espessura: "20" } });
          d.comp = X.cols(["gs", "hot", "gm"], [["806", 2.151, 7.2, 2.162], ["819", 2.148, 7.4, 2.160]], { reg: "Proctor mod. + Marshall" });
          d.umid = X.cols(["w"], [["806", 8.6], ["819", 6.4]], { reg: "Speedy" });
          d.gc = [["801", "LE", 98.9], ["806", "eixo", 99.8], ["811", "LD", 100.4], ["816", "LE", 99.1], ["821", "eixo", 100.2], ["824", "LD", 99.5]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1), gref: "2,151" }; });
          d.gran = [gran("806", "GR-21 · DNIT 412", [100, 96, 90, 83, 72, 63, 53, 46, 34, 26, 22, 20, 17, 13, 10]),
            gran("819", "GR-22 · DNIT 412", [100, 94, 87, 80, 70, 61, 51, 44, 32, 25, 21, 19, 16, 12, 9])];
          d.bet = X.cols(["tb"], [["806", 4.6], ["819", 5.3]], { reg: "Teor de betume" });
          d.rt = X.cols(["ncp", "rts", "rtu"], [["806", "2", 0.23, 0.12], ["819", "2", 0.27, 0.16]], { reg: "RT · DNIT 136" });
          d.esp = X.cols(["exp", "mv"], [["803", 11, 7], ["815", 10, 9]], { reg: "Espuma" });
          d.fin = X.cols(["res"], [["canteiro", 2.3], ["canteiro", 2.5]], { reg: "NBR 11579" });
          d.cim = X.cols(["taxa"], [["806", 3.8], ["819", 4.2]], { reg: "Pesagem" });
          d.mr = X.cols(["mr"], [["806", 1980], ["819", 2150]], { reg: "DNIT 135" });
          d.geo = X.secoes(800, [[3.63, 20.1, 3.1, 3.0], [3.61, 19.5, 3.2, 3.1], [3.65, 20.4, 3.0, 3.2], [3.62, 19.8, 3.1, 3.1], [3.64, 20.0, 3.3, 3.0], [3.60, 20.3, 3.2, 3.1],
            [3.63, 19.6, 3.0, 3.2], [3.65, 20.2, 3.1, 3.1], [3.61, 20.1, 3.2, 3.0], [3.62, 19.7, 3.3, 3.2], [3.64, 20.5, 3.1, 3.1], [3.63, 19.9, 3.0, 3.3], [3.61, 19.8, 3.2, 3.2],
            [3.65, 20.2, 3.1, 3.0], [3.62, 20.0, 3.0, 3.1], [3.63, 19.5, 3.2, 3.2], [3.64, 20.4, 3.1, 3.0], [3.61, 20.1, 3.3, 3.1], [3.63, 19.7, 3.0, 3.2], [3.62, 20.3, 3.1, 3.1],
            [3.65, 19.9, 3.2, 3.0], [3.61, 19.6, 3.1, 3.2], [3.64, 20.2, 3.0, 3.1], [3.63, 20.0, 3.2, 3.1], [3.62, 19.8, 3.1, 3.0], [3.64, 20.1, 3.3, 3.2]]);
          d.verif = X.verif(8);
          d.obs = "Exemplo de reprovação: RT seca 0,23 MPa e saturada 0,12 MPa num ponto, meia-vida de 7 s, umidade 8,6 % (1,2 × h ót) e GC com X̄ − k·s < 100 %.";
          return d;
        } },
      ];
    },
  });
})();
