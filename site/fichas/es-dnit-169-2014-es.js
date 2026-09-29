/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 169/2014-ES — Reciclagem de pavimento em usina com espuma de asfalto.
 * Usa FE.aceitacaoG2.espumaAsfalto (es-dnit-140-2022-es.js), comum com a DNIT 166/2013-ES (in situ). O que a ES manda:
 *   5.1.1 c / 7.1.2 finura do cimento (filler) a cada 8 h de jornada; cal CH-I com documento do fabricante.
 *   5.1.3 espuma: expansão ≥ 10; meia-vida ≥ 8 s.   5.1.4 agregados adicionais: LA ≤ 55 %, IF ≥ 0,5, durabilidade < 12 %; EA ≥ 40 %.
 *   5.1.5 b mistura: RT seca ≥ 0,25 MPa e saturada ≥ 0,15 MPa a 25 °C; granulometria na faixa da Tabela 1.
 *   5.3.4 d espessura compactada ≥ 10 cm; e) umidade ótima ou ligeiramente acima (sem tolerância numérica).
 *   7.2.1 controles da mistura (Proctor modificado, umidade, granulometria e betume, ≥ 6 CPs Marshall para RT com 72 h a 40 °C,
 *         ≥ 2 CPs por traço para massa específica, densidade in situ) — SEM frequência fixada (plano de amostragem, 7.4.1).
 *   7.2.2 espuma a cada 500 m de faixa ou 8 h.   7.2.3 GC ≥ 100 % da maior massa específica (Proctor modificado ou Marshall),
 *         a cada 250 m de faixa ou jornada de 8 h; NOTA: deflexão complementar.   7.3 geometria.   7.4.2 X̄ ± k·s (DNER-PRO 277).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G2 = FE.aceitacaoG2;
  var gran = G2.gran15;
  G2.espumaAsfalto({
    id: "dnit-169-2014-es", codigo: "DNIT 169/2014-ES", usina: true, rtCura: "40 °C", rtCPs: "no mínimo 6 CPs Marshall (75 golpes/face), 72 h em estufa a 40 °C",
    s: { espuma: "5.1.3", agreg5: "5.1.4", agreg7: "7.1.3", tab1: "5.1.5 b", rt: "5.1.5 b", umid: "5.3.4 e / 7.2.1 b", mist: "7.2.1", gc: "7.2.3", espum7: "7.2.2",
      fin: "5.1.1 c / 7.1.2", geo: "7.3", defl: "7.2.3", espLim: { min: 10, secao: "5.3.4 d", texto: "a espessura compactada na fase final nunca pode ser inferior a 10 cm" } },
    freqMist: { por: "plano", minimo: 1, usaEsp: true },
    titulo: "Reciclagem em usina com espuma de asfalto — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 169/2014-ES: GC ≥ 100 % da maior massa " +
      "específica (Proctor modificado ou Marshall), granulometria na Tabela 1, RT seca ≥ 0,25 MPa e saturada ≥ 0,15 MPa, espuma (expansão ≥ 10, meia-vida ≥ 8 s), " +
      "agregados adicionais, controle geométrico e deflexão complementar (7.4.2, Tabela 1 da DNER-PRO 277/97).",
    verificacoes: [
      { id: "cap", texto: "CAP 50/70, 85/100 ou 150/200; penetração e viscosidade em cada carregamento", secao: "5.1.3 / 7.1.4" },
      { id: "fil", texto: "Filler com certificado: cimento (DNER-EM 036) ou cal CH-I (NBR 7175)", secao: "5.1.1" },
      { id: "fres", texto: "Granulometria do material fresado para a dosagem do material virgem", secao: "5.1.5 a / 7.1.1" },
      { id: "usina", texto: "Usina calibrada e silos monitorados durante a operação", secao: "7.2.1" },
      { id: "fresag", texto: "Fresagem conforme o projeto e a DNIT 159", secao: "5.3.1" },
      { id: "limp", texto: "Faixa limpa e sem água antes do espalhamento", secao: "5.3.3" },
      { id: "prot", texto: "Proteção da base com material asfáltico (DNIT 145)", secao: "5.3.4 h" },
    ],
    rotuloPlano: "Plano de amostragem: controles da mistura a cada … m de faixa — opcional",
    notas: "DNIT 169/2014-ES. Os controles da mistura (7.2.1) não têm frequência na ES: a ficha usa o plano de amostragem (parâmetro; vazio = 1 por lote). " +
      "GC a cada 250 m de faixa ou por jornada de 8 h (7.2.3 a — adotado o maior); espuma a cada 500 m de faixa ou 8 h (7.2.2); finura a cada 8 h (7.1.2). " +
      "RT: 72 h em estufa a 40 °C (7.2.1 d) — a DNIT 166 usa 60 °C. Umidade: \"ótima ou ligeiramente acima\" (5.3.4 e), sem tolerância — informativa. " +
      "Granulometria: Tabela 1 ∩ projeto ± tolerância; tolerância da 2\" impressa \"- 7\" (lida ± 7); nº 200 (5–20) com máximo maior que a nº 100 (7–17). " +
      "Largura: até +10 cm em excesso, sem \"não se tolerando falta\" (avaliada estatisticamente). Métodos citados e substituídos: DNER-ME 092 → DNIT 458; DNER-ME 083 → DNIT 412.",
    exemplos: function (F) {
      var X = G2.ex;
      function base(reg, extra) {
        return { ident: Object.assign({ registro: reg, data: "2026-03-17", obra: "Obra H — BR-000", origem: "Material fresado + Pedreira Z + CAP 50/70 da Distribuidora C", camada: "Base reciclada em usina com espuma de asfalto" }, extra.ident || {}),
          params: Object.assign({}, F.padrao, extra.params), umid: [{}], comp: [{}], gc: [{}], gran: [{}], bet: [{}], rt: [{}], esp: [{}], fin: [{}], obs: "" };
      }
      return [
        { nome: "Lote aceito — 400 m de uma faixa, 2 jornadas (RT da DNIT 136 importada)", dados: function () {
          var d = base("LOTE-RU-01", { ident: { trecho: "Faixa direita", local: "Est. 900 a 920" },
            params: { estIni: "900", estFim: "920", largura: "3,50", espessura: "15", jornadas: "2", betProj: "4,5", defl: "realizado", lse: "50" } });
          d.comp = X.cols(["gs", "hot", "gm"], [["905", 2.168, 6.4, 2.171], ["915", 2.172, 6.2, 2.169]], { reg: "Proctor mod. + Marshall" });
          d.umid = X.cols(["w"], [["905", 6.6], ["915", 6.5]], { reg: "Speedy" });
          d.gc = [["901", "LE", 100.9], ["904", "eixo", 101.4], ["908", "LD", 100.6], ["912", "LE", 101.7], ["916", "eixo", 100.8], ["919", "LD", 101.2]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1), gref: "2,171" }; });
          d.gran = [gran("905", "GR-31 · DNIT 412", [100, 94, 86, 79, 68, 60, 50, 43, 31, 24, 20, 18, 15, 11, 8]),
            gran("915", "GR-32 · DNIT 412", [100, 95, 88, 81, 70, 61, 52, 45, 33, 25, 21, 19, 16, 12, 9])];
          d.proj = [gran("", "", [100, 95, 87, 80, 69, 60, 51, 44, 32, 25, 21, 19, 16, 12, 9])];
          delete d.proj[0].est; delete d.proj[0].reg;
          d.bet = X.cols(["tb"], [["905", 4.6], ["915", 4.4]], { reg: "Teor de betume (DNIT 158)" });
          X.importar(F, d, "impRT", [["dnit-136-2018-me", 1]]);
          d.rt[0].est = "905"; d.rt[0].rtu = "0,42";
          d.rt.push({ est: "915", reg: "RT · DNIT 136 (digitado)", ncp: "6", rts: "0,68", rtu: "0,47" });
          d.esp = X.cols(["exp", "mv"], [["903", 12, 10], ["912", 11, 12]], { reg: "Espuma" });
          d.fin = X.cols(["res"], [["usina", 2.3], ["usina", 2.0]], { reg: "NBR 11579" });
          d.defl = X.deflexoes(900, [38, 41, 36, 44, 40, 37, 42, 39, 43, 38, 40, 36, 41, 39, 42, 37, 40, 43, 38, 41, 39]);
          d.geo = X.secoes(900, [[3.54, 15.3, 3.1, 3.0], [3.52, 14.7, 3.2, 3.1], [3.56, 15.6, 3.0, 3.2], [3.53, 14.9, 3.1, 3.1], [3.55, 15.2, 3.3, 3.0], [3.51, 15.4, 3.2, 3.1],
            [3.54, 14.8, 3.0, 3.2], [3.56, 15.1, 3.1, 3.1], [3.52, 15.3, 3.2, 3.0], [3.53, 14.6, 3.3, 3.2], [3.55, 15.5, 3.1, 3.1], [3.54, 15.0, 3.0, 3.3], [3.52, 14.9, 3.2, 3.2],
            [3.56, 15.2, 3.1, 3.0], [3.53, 15.1, 3.0, 3.1], [3.54, 14.7, 3.2, 3.2], [3.55, 15.4, 3.1, 3.0], [3.52, 15.2, 3.3, 3.1], [3.54, 14.8, 3.0, 3.2], [3.53, 15.3, 3.1, 3.1], [3.55, 15.0, 3.2, 3.0]]);
          d.verif = X.verif(7);
          d.obs = "Exemplo: RT seca do exemplo nº 2 da DNIT 136 (CPs de pista) importada; RT saturada, espuma e demais determinações digitadas. Deflexões complementares realizadas.";
          return d;
        } },
        { nome: "Lote rejeitado — granulometria fora da Tabela 1, expansão da espuma < 10, GC com referência errada; frequência de GC incompleta", dados: function () {
          var d = base("LOTE-RU-02", { ident: { trecho: "Faixa esquerda", local: "Est. 950 a 975" },
            params: { estIni: "950", estFim: "975", largura: "3,50", espessura: "15", jornadas: "4", defl: "realizado", lse: "50" } });
          d.comp = X.cols(["gs", "hot", "gm"], [["960", 2.155, 6.8, 2.178]], { reg: "Proctor mod. + Marshall" });
          d.umid = X.cols(["w"], [["960", 7.4]], { reg: "Speedy" });
          d.gc = [["952", "LE", 100.4], ["960", "eixo", 101.0], ["968", "LD", 100.7]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1), gref: "2,155" }; });
          d.gran = [gran("960", "GR-41 · DNIT 412", [100, 98, 95, 92, 90, 78, 66, 56, 40, 30, 25, 22, 19, 15, 12])];
          d.bet = X.cols(["tb"], [["960", 5.2]], { reg: "Teor de betume (DNIT 158)" });
          d.rt = X.cols(["ncp", "rts", "rtu"], [["960", "6", 0.52, 0.31]], { reg: "RT · DNIT 136" });
          d.esp = X.cols(["exp", "mv"], [["955", 9, 9], ["965", 8, 8], ["972", 10, 11]], { reg: "Espuma" });
          d.fin = X.cols(["res"], [["usina", 2.4], ["usina", 2.2], ["usina", 2.5]], { reg: "NBR 11579" });
          d.defl = X.deflexoes(950, [44, 47, 52, 45, 49, 43, 48, 46, 55, 44, 47, 45, 50, 46, 48, 43, 47, 45, 49, 46, 44, 48, 45, 47, 46, 44]);
          d.geo = X.secoes(950, [[3.53, 15.1, 3.1, 3.0], [3.51, 14.6, 3.2, 3.1], [3.55, 15.4, 3.0, 3.2], [3.52, 14.8, 3.1, 3.1], [3.54, 15.0, 3.3, 3.0], [3.50, 15.3, 3.2, 3.1],
            [3.53, 14.7, 3.0, 3.2], [3.55, 15.1, 3.1, 3.1], [3.51, 15.2, 3.2, 3.0], [3.52, 14.5, 3.3, 3.2], [3.54, 15.4, 3.1, 3.1], [3.53, 14.9, 3.0, 3.3], [3.51, 14.8, 3.2, 3.2],
            [3.55, 15.1, 3.1, 3.0], [3.52, 15.0, 3.0, 3.1], [3.53, 14.6, 3.2, 3.2], [3.54, 15.3, 3.1, 3.0], [3.51, 15.1, 3.3, 3.1], [3.53, 14.7, 3.0, 3.2], [3.52, 15.2, 3.1, 3.1],
            [3.55, 14.9, 3.2, 3.0], [3.51, 14.6, 3.1, 3.2], [3.54, 15.2, 3.0, 3.1], [3.53, 15.0, 3.2, 3.1], [3.52, 14.8, 3.1, 3.0], [3.54, 15.1, 3.3, 3.2]]);
          d.verif = X.verif(7);
          d.obs = "Exemplo de reprovação: mistura mais fina que a Tabela 1 (1/2\", 3/8\", 1/4\", nº 4…), taxa de expansão 8 e 9 (< 10); GC calculado com o Proctor (2,155) em vez do Marshall (2,178), " +
            "só 3 furos para 500 m / 4 jornadas; deflexões de 52 e 55 acima do projeto (pesquisar a causa).";
          return d;
        } },
      ];
    },
  });
})();
