/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 114/2009-ES — Sub-base estabilizada granulometricamente com escória de aciaria (ACERITA®).
 * NORMA CANCELADA em 26/12/2023 (assunto incorporado à DNIT 407/2017-ES) — ficha mantida para contratos ainda regidos por ela.
 * Montagem comum FE.aceitacaoG1.escoria (es-dnit-406-2017-es.js).
 *   Resumo (p. 1)  ACERITA® na proporção de 50 a 80 % em peso, com solo laterítico, para N < 5×10⁶.
 *   5.1.1 (p. 2–3) ACERITA®: Tabela 1; ISC ≥ 60 % (Método B); LA < 40 %; potencial de expansão < 3 %; MR ≥ 300 MPa.
 *   5.1.2 (p. 3)   solo: grupo MCT LA, LA' ou LG' (até 15 % retido na nº 10); Tabela 2.
 *   5.1.3 (p. 3)   mistura: Tabela 3 (A ou B); ISC > 20 %, expansão máxima 1,0 %; potencial de expansão < 1,5 %.
 *   5.3.4–5.3.6 (p. 4–5) GC mínimo 100 %.   7.1.1 (p. 6): 1 por camada a cada 300 m ou jornada de 8 h; 7.1.3: mín. 5 (Tabela 4).
 *   7.2.1 (p. 6)   umidade ± 2 %; GC a cada 100 m, "GC > 100 %".   7.3 (p. 6): largura ± 10 cm; flecha +20 %; espessura ± 10 %.
 *   7.4 (p. 7)     potencial de expansão < 1,5 % (7.4.1) e X̄ + k·s ≤ 1,5 % (7.4.5); expansão < 1,0 % (7.4.2); granulometria
 *                  X̄ ± k·s (7.4.3); ISC e GC X̄ − k·s ≥ mínimo (7.4.4).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex, E = G1.exEsc, PEN6 = G1.PEN_ESC6, kPen = G1.kPen;
  var F = G1.escoria({
    id: "dnit-114-2009-es", codigo: "DNIT 114/2009-ES", mat: "ACERITA®", pen: PEN6, solo: true, insFaixa: "dnit-114-2009-es-acerita",
    faixas: [["dnit-114-2009-es-misturas-A", "Faixa A (Tabela 3)"], ["dnit-114-2009-es-misturas-B", "Faixa B (Tabela 3)"]], faixaPadrao: "dnit-114-2009-es-misturas-A",
    titulo: "Sub-base com escória de aciaria (ACERITA®) — aceitação de lote (norma cancelada)",
    resumo: "NORMA CANCELADA em 26/12/2023 — assunto incorporado à DNIT 407/2017-ES (o site mostra a tarja); ficha mantida para obras contratadas com esta ES. " +
      "Confere a frequência (7.1, 7.2; mín. 5 pela Tabela 4) e aplica os critérios da 7.4: potencial de expansão da mistura < 1,5 % (individual e X̄ + k·s), " +
      "expansão < 1,0 %, granulometria na faixa A/B da Tabela 3 (X̄ ± k·s), ISC > 20 % e GC ≥ 100 % (X̄ − k·s), além dos insumos (ACERITA® e solo) e do controle geométrico.",
    tabela: "Tabela 4", metodo: "DNER-ME 129 Método B (→ DNIT 164)", metodoFreq: "DNIT 164, Método B", a_cada: 300, a_cadaH: null,
    sec: { ins: "5.1.1", solo: "5.1.2", mix: "5.1.3", faixa: "5.1.3; Tabela 3", aceGran: "7.4.3", ace: "7.4", corr: "7.4.6", tab: "7.1.3, p. 6", freq: "7.1.1, 7.1.3", nexec: "7.2.2",
      umid: "7.2.1 a", gc: "5.3.4–5.3.6; 7.2.1", gcFreq: "7.2.1", gcAce: "7.2.1; 7.4.4", gcMin: "5.3.4–5.3.6", gc2: "7.2.1", aceIsc: "7.4.4", geo: "7.3", esp: "5.3.3", med: "8.1–8.3" },
    ins: { isc: 60, la: 40 },
    mix: {
      isc: function () { return 20; }, iscTxt: function () { return "> 20 %"; },
      exp: function () { return 1.0; }, expTxt: function () { return "< 1,0 % (7.4.2; 5.1.3: máx. 1,0 %)"; }, expSec: function () { return "5.1.3; 7.4.2"; },
      pexp: function () { return 1.5 - 1e-6; }, pexpTxt: function () { return "< 1,5 % (7.4.1) e X̄ + k·s ≤ 1,5 % (7.4.5)"; }, pexpSec: "5.1.3; 7.4.1; 7.4.5", pexpEst: true,
    },
    params: [{ k: "teor", r: "Teor de ACERITA® na mistura (% em peso) — opcional", dica: "Resumo da ES: 50 a 80 %, com solo laterítico, para N < 5 × 10⁶" }],
    extra: function (c) {
      var t = num(c.P.teor);
      if (ok(t) && (t < 50 || t > 80)) c.av.push("Teor de ACERITA® de " + fmt(t, 0) + " %: o Resumo da ES indica de 50 a 80 % em peso (informativo).");
    },
    notas: "DNIT 114/2009-ES (cancelada; sucessora DNIT 407/2017-ES). Métodos citados e substituídos: DNER-ME 080 → DNIT 412; DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; " +
      "DNER-ME 035 → DNIT 451; DNER-ME 131 → DNIT 134; DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458. GC: mínimo de 100 % (5.3); 7.2.1 escreve \"> 100 %\". " +
      "Potencial de expansão da mistura: estatístico (7.4.5) e individual (7.4.1). Umidade: tolerância de execução (fora dela, ressalva).",
  });
  F.exemplos = [
    { nome: "Lote aceito — sub-base ACERITA® + solo laterítico (60/40), faixa A, 300 m", dados: function () {
      var d = { ident: { registro: "LOTE-SE-001", data: "2019-05-14", obra: "Obra A — BR-000", trecho: "Lote 1", local: "Est. 0 a 15", camada: "Sub-base — ACERITA® + solo", origem: "Fornecedor A + Jazida 1" },
        params: Object.assign({}, F.padrao, { estIni: "0", estFim: "15", largura: "8,00", espessura: "15", flechaProj: "8", teor: "60" }), obs: "" };
      var ests = [1, 4, 7, 10, 13];
      d.gran = E.granCols(PEN6, ests, [[100, 68, 50, 38, 23, 10.2], [100, 66, 48, 36, 22, 9.6], [100, 70, 52, 39, 24, 10.8], [100, 67, 49, 37, 22, 9.9], [100, 69, 51, 38, 23, 10.4]], "GR");
      d.granP = [E.projDe(PEN6, [100, 68, 50, 38, 23, 10])];
      d.comp = E.comp(ests, [["2,285", "9,6", "62", "0,21", "0,52"], ["2,279", "9,9", "55", "0,26", "0,61"], ["2,291", "9,4", "68", "0,18", "0,47"], ["2,282", "9,7", "58", "0,24", "0,58"], ["2,287", "9,5", "64", "0,20", "0,50"]], "CP");
      X.importar(F, d, "imp_ins", [["dnit-113-2009-me", 0]]);
      d.ins.push({ reg: "INS-01 (digitado)", isc: "118", la: "24", mr: "380" });
      d.granI = E.granCols(PEN6, [0], [[100, 70, 52, 38, 22, 9.0]], "GR-A");
      d.granS = E.granCols([[25.4], [9.5], [4.8], [2.0], [0.42], [0.15], [0.075]], [0], [[100, 98, 95, 90, 72, 60, 54]], "GR-S");
      d.granS[0].mct = "LA'";
      d.umid = X.colunas([[1, 8.9], [4, 10.1], [7, 9.2], [10, 10.8], [13, 9.6]], "w", "Campo — Speedy");
      d.gc = E.gcCols([[0, 101.2], [3, 100.9], [6, 101.7], [9, 100.6], [12, 101.3], [14, 101.0]]);
      d.geo = X.secoes(0, 16, function (i) { return { larg: 8.04 + X.onda(i, 0.05), esp: 15.3 + X.onda(i, 0.9), flecha: 8.7 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo: potencial de expansão da ACERITA® importado do exemplo DNIT 113 (1,64 %); solo LA' (DNER-CLA 259).";
      return d;
    } },
    { nome: "Lote rejeitado — potencial de expansão da mistura com X̄ + k·s > 1,5 % e solo não laterítico", dados: function () {
      var d = { ident: { registro: "LOTE-SE-002", data: "2019-06-03", obra: "Obra B — BR-000", trecho: "Lote 2", local: "Est. 50 a 65", camada: "Sub-base — ACERITA® + solo", origem: "Fornecedor A + Jazida 5" },
        params: Object.assign({}, F.padrao, { estIni: "50", estFim: "65", largura: "8,00", espessura: "15", flechaProj: "8", teor: "85" }), obs: "" };
      var ests = [51, 54, 57, 60, 63];
      d.gran = E.granCols(PEN6, ests, [[100, 68, 50, 38, 23, 10.2], [100, 66, 48, 36, 22, 9.6], [100, 70, 52, 39, 24, 10.8], [100, 67, 49, 37, 22, 9.9], [100, 69, 51, 38, 23, 10.4]], "GR");
      d.granP = [E.projDe(PEN6, [100, 68, 50, 38, 23, 10])];
      d.comp = E.comp(ests, [["2,301", "9,2", "48", "0,31", "1,18"], ["2,296", "9,4", "44", "0,42", "1,42"], ["2,305", "9,1", "52", "0,28", "1,07"], ["2,298", "9,3", "46", "0,37", "1,46"], ["2,302", "9,2", "50", "0,33", "1,31"]], "CP");
      d.ins = [{ reg: "INS-02 (digitado)", isc: "112", la: "26", pexp: "2,10", mr: "365" }];
      d.granI = E.granCols(PEN6, [50], [[100, 70, 52, 38, 22, 9.0]], "GR-A");
      d.granS = E.granCols([[25.4], [9.5], [4.8], [2.0], [0.42], [0.15], [0.075]], [50], [[100, 97, 93, 88, 70, 58, 50]], "GR-S");
      d.granS[0].mct = "NA'";
      d.umid = X.colunas([[51, 8.6], [54, 9.9], [57, 9.1], [60, 10.2], [63, 9.4]], "w", "Campo — Speedy");
      d.gc = E.gcCols([[50, 100.8], [53, 101.4], [56, 100.5], [59, 101.1], [62, 100.9], [64, 101.6]]);
      d.geo = X.secoes(50, 16, function (i) { return { larg: 8.03 + X.onda(i, 0.05), esp: 15.2 + X.onda(i, 0.9), flecha: 8.6 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo de reprovação: potenciais de expansão da mistura de 1,07 a 1,46 % (todos < 1,5 %, mas X̄ + k·s > 1,5 %, 7.4.5); solo NA' (não laterítico, 5.1.2); teor de 85 % de ACERITA® (aviso).";
      return d;
    } },
  ];
})();
