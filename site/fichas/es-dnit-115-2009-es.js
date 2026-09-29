/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 115/2009-ES — Base estabilizada granulometricamente com escória de aciaria (ACERITA®).
 * NORMA CANCELADA em 26/12/2023 (assunto incorporado à DNIT 406/2017-ES) — ficha mantida para contratos ainda regidos por ela.
 * Montagem comum FE.aceitacaoG1.escoria (es-dnit-406-2017-es.js).
 *   Resumo (p. 1)  ACERITA® na proporção de 50 a 80 % em peso, com solo laterítico, para N < 5×10⁶.
 *   5.1.1 (p. 2–3) ACERITA®: Tabela 1; ISC ≥ 80 % (Método B); LA < 40 %; potencial de expansão < 3 %; MR ≥ 300 MPa.
 *   5.1.2 (p. 3)   solo: grupo MCT LA, LA' ou LG' (até 15 % retido na nº 10); Tabela 2.
 *   5.1.3 (p. 3–4) mistura: Tabela 3 (A ou B); ISC > 60 %, expansão máxima 0,5 %; MR ≥ 300 MPa; potencial de expansão < 1,5 %.
 *   5.3.6–5.3.8 (p. 4–5) GC mínimo 100 %.   7.1.1 (p. 6): 1 por camada a cada 300 m ou jornada de 8 h; 7.1.3: mín. 5 (Tabela 4).
 *   7.2.1 (p. 6–7) umidade ± 2 %; GC a cada 100 m, "GC > 100 %".   7.3 (p. 7): largura ± 10 cm; flecha +20 %; espessura ± 10 %.
 *   7.4 (p. 7)     potencial de expansão < 1,5 % (7.4.1) e X̄ + k·s ≤ 1,5 % (7.4.5); expansão < 0,5 % (7.4.2); granulometria
 *                  X̄ ± k·s (7.4.3); ISC e GC X̄ − k·s ≥ mínimo (7.4.4).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex, E = G1.exEsc, PEN6 = G1.PEN_ESC6;
  var PS = [[25.4], [9.5], [4.8], [2.0], [0.42], [0.15], [0.075]];
  var F = G1.escoria({
    id: "dnit-115-2009-es", codigo: "DNIT 115/2009-ES", mat: "ACERITA®", pen: PEN6, solo: true, insFaixa: "dnit-115-2009-es-acerita",
    faixas: [["dnit-115-2009-es-misturas-A", "Faixa A (Tabela 3)"], ["dnit-115-2009-es-misturas-B", "Faixa B (Tabela 3)"]], faixaPadrao: "dnit-115-2009-es-misturas-A",
    titulo: "Base com escória de aciaria (ACERITA®) — aceitação de lote (norma cancelada)",
    resumo: "NORMA CANCELADA em 26/12/2023 — assunto incorporado à DNIT 406/2017-ES (o site mostra a tarja); ficha mantida para obras contratadas com esta ES. " +
      "Confere a frequência (7.1, 7.2; mín. 5 pela Tabela 4) e aplica os critérios da 7.4: potencial de expansão da mistura < 1,5 % (individual e X̄ + k·s), " +
      "expansão < 0,5 %, granulometria na faixa A/B da Tabela 3 (X̄ ± k·s), ISC > 60 % e GC ≥ 100 % (X̄ − k·s), MR da mistura ≥ 300 MPa, insumos (ACERITA® e solo) e geometria.",
    tabela: "Tabela 4", metodo: "DNER-ME 129 Método B (→ DNIT 164)", metodoFreq: "DNIT 164, Método B", a_cada: 300, a_cadaH: null,
    sec: { ins: "5.1.1", solo: "5.1.2", mix: "5.1.3", faixa: "5.1.3; Tabela 3", aceGran: "7.4.3", ace: "7.4", corr: "7.4.6", tab: "7.1.3, p. 6", freq: "7.1.1, 7.1.3", nexec: "7.2.2",
      umid: "7.2.1 a", gc: "5.3.6–5.3.8; 7.2.1", gcFreq: "7.2.1", gcAce: "7.2.1; 7.4.4", gcMin: "5.3.6–5.3.8", gc2: "7.2.1", aceIsc: "7.4.4", geo: "7.3", esp: "5.3.3", med: "8.1–8.3" },
    ins: { isc: 80, la: 40 },
    mix: {
      mr: 300,
      isc: function () { return 60; }, iscTxt: function () { return "> 60 %"; },
      exp: function () { return 0.5; }, expTxt: function () { return "< 0,5 % (7.4.2; 5.1.3: máx. 0,5 %)"; }, expSec: function () { return "5.1.3; 7.4.2"; },
      pexp: function () { return 1.5 - 1e-6; }, pexpTxt: function () { return "< 1,5 % (7.4.1) e X̄ + k·s ≤ 1,5 % (7.4.5)"; }, pexpSec: "5.1.3; 7.4.1; 7.4.5", pexpEst: true,
    },
    params: [{ k: "teor", r: "Teor de ACERITA® na mistura (% em peso) — opcional", dica: "Resumo da ES: 50 a 80 %, com solo laterítico, para N < 5 × 10⁶" }],
    extra: function (c) {
      var t = num(c.P.teor);
      if (ok(t) && (t < 50 || t > 80)) c.av.push("Teor de ACERITA® de " + fmt(t, 0) + " %: o Resumo da ES indica de 50 a 80 % em peso (informativo).");
    },
    notas: "DNIT 115/2009-ES (cancelada; sucessora DNIT 406/2017-ES). Métodos citados e substituídos: DNER-ME 080 → DNIT 412; DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; " +
      "DNER-ME 035 → DNIT 451; DNER-ME 131 → DNIT 134; DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458. GC: mínimo de 100 % (5.3); 7.2.1 escreve \"> 100 %\". " +
      "Potencial de expansão da mistura: estatístico (7.4.5) e individual (7.4.1). MR da mistura: 1 por lote (adotado). Umidade: tolerância de execução (fora dela, ressalva).",
  });
  F.exemplos = [
    { nome: "Lote aceito — base ACERITA® + solo laterítico (70/30), faixa A, 300 m (potencial de expansão do insumo importado)", dados: function () {
      var d = { ident: { registro: "LOTE-BE-001", data: "2018-10-09", obra: "Obra A — BR-000", trecho: "Lote 1", local: "Est. 200 a 215", camada: "Base — ACERITA® + solo", origem: "Fornecedor A + Jazida 1" },
        params: Object.assign({}, F.padrao, { estIni: "200", estFim: "215", largura: "8,00", espessura: "15", flechaProj: "8", teor: "70" }), obs: "" };
      var ests = [201, 204, 207, 210, 213];
      d.gran = E.granCols(PEN6, ests, [[100, 66, 49, 36, 22, 9.4], [100, 64, 47, 35, 21, 9.0], [100, 68, 51, 37, 23, 9.9], [100, 65, 48, 36, 21, 9.2], [100, 67, 50, 36, 22, 9.6]], "GR");
      d.granP = [E.projDe(PEN6, [100, 66, 49, 36, 22, 9])];
      d.comp = E.comp(ests, [["2,352", "8,6", "96", "0,12", "0,48", "420"], ["2,346", "8,9", "88", "0,16", "0,57"], ["2,358", "8,4", "104", "0,10", "0,44"], ["2,349", "8,7", "91", "0,14", "0,53"], ["2,355", "8,5", "99", "0,11", "0,49"]], "CP");
      X.importar(F, d, "imp_ins", [["dnit-113-2009-me", 0]]);
      d.ins.push({ reg: "INS-01 (digitado)", isc: "136", la: "22", mr: "410" });
      d.granI = E.granCols(PEN6, [200], [[100, 72, 53, 39, 23, 9.4]], "GR-A");
      d.granS = E.granCols(PS, [200], [[100, 99, 96, 91, 74, 61, 56]], "GR-S");
      d.granS[0].mct = "LG'";
      d.umid = X.colunas([[201, 7.9], [204, 9.2], [207, 8.4], [210, 9.8], [213, 8.8]], "w", "Campo — Speedy");
      d.gc = E.gcCols([[200, 101.5], [203, 100.8], [206, 101.9], [209, 100.7], [212, 101.2], [214, 101.6]]);
      d.geo = X.secoes(200, 16, function (i) { return { larg: 8.04 + X.onda(i, 0.05), esp: 15.3 + X.onda(i, 0.9), flecha: 8.7 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo: potencial de expansão da ACERITA® importado do exemplo DNIT 113 (1,64 %); MR da mistura na amostra da estaca 201.";
      return d;
    } },
    { nome: "Lote rejeitado — ISC com X̄ − k·s < 60 %, expansão ≥ 0,5 % e LA da ACERITA® ≥ 40 % (importado)", dados: function () {
      var d = { ident: { registro: "LOTE-BE-002", data: "2018-11-21", obra: "Obra B — BR-000", trecho: "Lote 2", local: "Est. 10 a 25", camada: "Base — ACERITA® + solo", origem: "Fornecedor A + Jazida 4" },
        params: Object.assign({}, F.padrao, { estIni: "10", estFim: "25", largura: "8,00", espessura: "15", flechaProj: "8", teor: "65" }), obs: "" };
      var ests = [11, 14, 17, 20, 23];
      d.gran = E.granCols(PEN6, ests, [[100, 66, 49, 36, 22, 9.4], [100, 64, 47, 35, 21, 9.0], [100, 68, 51, 37, 23, 9.9], [100, 65, 48, 36, 21, 9.2], [100, 67, 50, 36, 22, 9.6]], "GR");
      d.granP = [E.projDe(PEN6, [100, 66, 49, 36, 22, 9])];
      d.comp = E.comp(ests, [["2,331", "9,1", "72", "0,34", "0,81", "335"], ["2,325", "9,4", "58", "0,52", "0,96"], ["2,336", "9,0", "81", "0,29", "0,74"], ["2,328", "9,3", "63", "0,44", "0,88"], ["2,333", "9,2", "69", "0,38", "0,79"]], "CP");
      X.importar(F, d, "imp_ins", [["dnit-451-2024-me", 0]]);
      d.ins.push({ reg: "INS-02 (digitado)", isc: "124", pexp: "1,85", mr: "395" });
      d.granI = E.granCols(PEN6, [10], [[100, 71, 52, 38, 22, 9.1]], "GR-A");
      d.granS = E.granCols(PS, [10], [[100, 98, 95, 90, 73, 60, 55]], "GR-S");
      d.granS[0].mct = "LA'";
      d.umid = X.colunas([[11, 8.8], [14, 10.2], [17, 9.3], [20, 10.9], [23, 9.6]], "w", "Campo — Speedy");
      d.gc = E.gcCols([[10, 100.9], [13, 101.3], [16, 100.6], [19, 101.7], [22, 101.0], [24, 100.8]]);
      d.geo = X.secoes(10, 16, function (i) { return { larg: 8.03 + X.onda(i, 0.05), esp: 15.2 + X.onda(i, 0.9), flecha: 8.6 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo de reprovação: ISC 58–81 % (X̄ − k·s < 60 %); expansão de 0,52 % na estaca 14; desgaste Los Angeles de 42 % importado do exemplo DNIT 451 (≥ 40 %, sem desempenho comprovado).";
      return d;
    } },
  ];
})();
