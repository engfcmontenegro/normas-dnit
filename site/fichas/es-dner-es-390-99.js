/*
 * Ficha de ACEITAÇÃO DE LOTE: DNER-ES 390/99 — Pré-misturado a frio com emulsão modificada por polímero.
 * Usa G4.pmf (site/fichas/es-dnit-153-2010-es.js) sobre o núcleo FE.aceitacaoG4b (es-dnit-150-2010-es.js).
 *
 * O que a ES manda (seções do PDF):
 *   5.1.2.1 agregado graúdo: LA ≤ 40 % (maior com desempenho satisfatório), índice de forma > 0,5, durabilidade < 12 %,
 *   adesividade > 90 %; 5.1.2.2 agregado miúdo: EA ≥ 55 %; 5.2.1 quadro de faixas A–D com tolerâncias ± 7/5/2 % e
 *   ligante ± 0,3 %, "permitidas desde que os limites da faixa não sejam ultrapassados"; 5.2.2 fração retida entre
 *   peneiras consecutivas ≥ 4 %; 5.2.3 Marshall modificado: vazios 5 a 25 %, estabilidade ≥ 250 kgf (75 golpes),
 *   fluência 2,0 a 4,5 mm; 7.1.1 emulsão: SF, resíduo, peneiramento, carga e recuperação elástica por carregamento;
 *   sedimentação, desemulsibilidade e destilação a cada 100 t; infravermelho (teor de polímero ± 0,4 %) a cada 500 t;
 *   7.1.2 agregados: adesividade e 2 granulometrias por jornada; LA, EA, durabilidade e índice de forma por mês;
 *   7.2.1.1 teor de ligante residual (DNER-ME 053, amostras na saída da acabadora) projeto ± 0,3 %; 7.2.1.2 granulometria
 *   do agregado extraído; 7.2.1.3 Marshall por jornada; 7.2.1.4 tabela de amostragem variável (sem n = 11), mínimo de
 *   5 determinações por jornada; 7.2.2.1 GC ≥ 95 % da densidade de projeto (≥ 98 % com CPs moldados no local), não se
 *   permitindo GC inferiores; 7.3.1 espessura ± 5 %; 7.3.2 alinhamentos ± 5 cm; 7.3.3 régua ≤ 0,5 cm;
 *   7.4.2 aceitação estatística (teor, granulometria, estabilidade, GC): X̄ − ks ≥ mín. e X̄ + ks ≤ máx.;
 *   9.2 recomenda α = 0,10 (n = 12) e determinações de campo a cada 700 m².
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G4 = FE.aceitacaoG4b, num = FE.num, ok = FE.ok;
  if (!G4 || !G4.pmf) { if (window.console) console.error("es-dner-es-390-99.js: carregue antes es-dnit-150-2010-es.js e es-dnit-153-2010-es.js."); return; }
  var ID = "dner-es-390-99";
  var REFS = { reprova: "7.4.2", atende: "7.4.2", corrige: "7.4.4", regra: "7.4.2", tabela: "tabela de amostragem variável (7.2.1.4)" };
  function freqExec(ctx) {
    if (ctx.P.plano === "700") {
      var ar = ctx.L.area;
      return { exigido: Math.max(5, ok(ar) ? Math.ceil(ar / 700 - 1e-9) : 5), regra: "1 a cada 700 m² de pista (9.2, α = 0,10); mín. 5" };
    }
    return { exigido: 5 * ctx.J, regra: "mín. 5 por jornada de 8 h (7.2.1.4)" };
  }
  var F = G4.pmf({
    id: ID, titulo: "Pré-misturado a frio com emulsão polímero — aceitação de lote", tabelaK: G4.K_277, refs: REFS, freqExec: freqExec,
    resumo: "Reúne extrações (teor de ligante residual ± 0,3 % e granulometria na faixa de trabalho limitada pela faixa), ensaios Marshall, grau de compactação, geometria e acabamento, o recebimento da emulsão polimerizada e o controle dos agregados; aplica a aceitação estatística da 7.4.2 com a tabela de 7.2.1.4.",
    mistura: { faixaPadrao: "dner-es-390-99-B", tolTeor: 0.3, secTeor: "7.2.1.1", secGran: "7.2.1.2", secFaixa: "5.2.1", limitarFaixa: true, rotTeor: "Teor de ligante residual",
      metodoTeor: "extração DNER-ME 053 (saída da acabadora)", retidoMin: 4, secRetido: "5.2.2" },
    marshall: { secao: "7.2.1.3", secLim: "5.2.3", vv: [5, 25], flu: [2.0, 4.5], estatEst: true, estMin: function () { return 250; },
      golpesAtual: function () { return "75"; },
      freq: function (ctx) { return { exigido: ctx.J, regra: "por jornada de 8 h (7.2.1.3)" }; } },
    gc: { secao: "7.2.2.1", estatistico: true, obrigMin: true,
      min: function (P) { return P.gcRef === "local" ? 98 : 95; },
      exigidoTxt: function (P) { return (P.gcRef === "local" ? "≥ 98 % (CPs moldados no local)" : "≥ 95 % da densidade de projeto") + "; X̄ − ks ≥ mín. (7.4.2)"; },
      refTxt: "densidade de projeto, ou dos CPs moldados no local (então GC ≥ 98 %)",
      params: [{ k: "gcRef", r: "Referência do grau de compactação (7.2.2.1)", tipo: "select", opcoes: [["projeto", "Densidade de projeto — GC ≥ 95 %"], ["local", "CPs moldados no local — GC ≥ 98 %"]] }] },
    geo: { esp: { tol: 0.05, sec: "7.3.1" }, alin: { tol: 5, sec: "7.3.2" }, regua: { max: 0.5, sec: "7.3.3" } },
    vrd: null, qi: null, visc: null,
    ligante: { sec: "7.1.1", tipoTxt: "especificação da emulsão modificada por polímero (a ficha DNIT 165 não traz a recuperação elástica nem o infravermelho)",
      porCarg: { texto: "viscosidade SF, resíduo, peneiramento, carga, recuperação elástica", sec: "7.1.1 a",
        ids: [[["sf25", "sf50"], "viscosidade SF"], ["residuo", "resíduo"], ["pen084", "peneiramento"], ["carga", "carga da partícula"], ["recElast", "recuperação elástica"]] },
      por100: { texto: "sedimentação, desemulsibilidade, destilação", sec: "7.1.1 b", ids: [["sed", "sedimentação"], ["desem", "desemulsibilidade"], [["solv", "residuo"], "destilação"]] },
      por500: { texto: "infravermelho no resíduo — teor de polímero ± 0,4 %", sec: "7.1.1 c", ids: [["iv", "infravermelho"]] },
      de: ["dnit-165-2013-em"] },
    agregados: { sec: "5.1.2; 7.1.2", itens: [
      { k: "gran", secao: "7.1.2 a", freq: { texto: "2 por jornada de 8 h", n: 2 } },
      { k: "ades", secao: "5.1.2.1 e; 7.1.2 a", min: 90, metodo: "DNER-ME 079 e 059", freq: { por: "jornada", n: 1, texto: "1 por jornada" } },
      { k: "la", secao: "5.1.2.1 a; 7.1.2 b", max: 40, metodo: "DNER-ME 035 → DNIT 451", freq: { por: "mes", n: 1, texto: "1 por mês ou com variação do material" } },
      { k: "ea", secao: "5.1.2.2; 7.1.2 b", min: 55, metodo: "DNER-ME 054 → DNIT 450", freq: { por: "mes", n: 1, texto: "1 por mês ou com variação do material" } },
      { k: "dur", secao: "5.1.2.1 c; 7.1.2 b", max: 12, exigido: "< 12 %", metodo: "DNER-ME 089", freq: { por: "caract" } },
      { k: "if", secao: "5.1.2.1 b; 7.1.2 b", min: 0.5, minEstrito: true, exigido: "> 0,5", metodo: "DNER-ME 086", freq: { por: "mes", n: 1, texto: "1 por mês ou com variação do material" } },
    ] },
    verif: [
      { id: "clima", texto: "Execução sem chuva e distribuição com temperatura ambiente > 10 °C", secao: "4.2; 5.4.4.1" },
      { id: "cert", texto: "Certificado de análise da emulsão polimerizada em todo carregamento", secao: "4.3" },
      { id: "base", texto: "Superfície subjacente limpa e pintada ou imprimada", secao: "5.4.1" },
      { id: "temp", texto: "Faixa de temperatura na usina verificada (quando for o caso)", secao: "7.4.2 a" },
      { id: "trafego", texto: "Camada aberta ao tráfego sem deformação ou desagregação", secao: "5.4.5", falha: "ressalva" },
    ],
    params: [{ k: "plano", r: "Plano de amostragem das determinações de campo", tipo: "select",
      opcoes: [["jornada", "Mínimo de 5 por jornada de 8 h (7.2.1.4)"], ["700", "1 a cada 700 m² de pista (recomendação 9.2, α = 0,10)"]] }],
    padrao: { faixa: "dner-es-390-99-B", gcRef: "projeto", plano: "jornada", meses: "1", laDesemp: "nao" },
    notas: "Critérios da DNER-ES 390/99 (7.4.2): teor de ligante residual (projeto ± 0,3 %), granulometria do agregado extraído (projeto ± tolerâncias do quadro de 5.2.1, sem ultrapassar os limites da faixa), estabilidade Marshall (≥ 250 kgf) e grau de compactação (≥ 95 % ou ≥ 98 %, sem valores individuais inferiores, 7.2.2.1) pelo controle estatístico X̄ ± ks; vazios (5 a 25 %) e fluência (2,0 a 4,5 mm) pelo mesmo critério; espessura ± 5 %, alinhamentos ± 5 cm e régua ≤ 0,5 cm (7.3). k da tabela de amostragem variável de 7.2.1.4 (não tabela n = 11: usa-se o k de n = 10). Mínimo de 5 determinações por jornada (7.2.1.4); a 9.2 recomenda α = 0,10 e determinações de campo a cada 700 m² (opção do plano).",
  });

  // =====================================================================================
  // Exemplos
  // =====================================================================================
  function importa(d, k, refs) { A.exemplos.importar(F.params, d, k, refs); }
  // [estaca, teor, 3/4", 1/2", 3/8", nº 4, nº 10, nº 200]
  function ext(lista, pref) {
    return lista.map(function (x, i) {
      return { est: x[0], pos: "saída da acabadora", reg: pref + "-" + (i + 1) + " · DNER-ME 053", teor: A.nstr(x[1], 2), r19_1: A.nstr(x[2], 1), r12_5: A.nstr(x[3], 1),
        r9_5: A.nstr(x[4], 1), r4_8: A.nstr(x[5], 1), r2: A.nstr(x[6], 1), r0_075: A.nstr(x[7], 1) };
    });
  }
  function geo(ini, esp, alin, reg) { return esp.map(function (e, i) { return { est: String(ini + i), esp: A.nstr(e, 1), alin: A.nstr(alin[i % alin.length], 1), regua: A.nstr(reg[i % reg.length], 1) }; }); }
  function gcs(lista) { return lista.map(function (x, i) { return { est: x[0], pos: x[1], reg: "CP-P-" + (i + 1), gmb: A.nstr(x[2], 3) }; }); }
  function mar(lista) { return lista.map(function (x, i) { return { est: x[0], pos: "jornada " + (i + 1), reg: "MAR-" + (i + 1) + " · DNER-ME 107", ncp: "3", golpes: "75", estab: String(x[1]), flu: A.nstr(x[2], 1), vv: A.nstr(x[3], 1) }; }); }
  var PROJ = [{ r19_1: "100", r12_5: "86", r9_5: "52", r4_8: "27", r2: "17", r0_075: "3" }];
  F.exemplos = [
    { nome: "Lote aceito — PMF polímero faixa B, 1 jornada, 5 determinações (emulsão e agregados dos exemplos ME)", dados: function () {
      var d = { ident: { registro: "LOTE-PMFP-001", data: "2026-09-16", obra: "Obra C — BR-000", trecho: "Faixa 1", local: "Est. 300 a 315", camada: "PMF com emulsão RL-1C polímero — faixa B (regularização)" },
        params: Object.assign({}, F.padrao, { estIni: "300", estFim: "315", largura: "3,60", jornadas: "1", teorProj: "5,20", gmbRef: "2,210", espProj: "6,0", volAgr: "180" }),
        proj: JSON.parse(JSON.stringify(PROJ)),
        ext: ext([["301", 5.16, 100, 85.4, 51.2, 26.4, 16.6, 3.2], ["304", 5.25, 100, 86.9, 53.1, 27.8, 17.4, 2.8], ["307", 5.21, 100, 85.9, 52.4, 26.9, 16.9, 3.4],
          ["310", 5.14, 100, 86.4, 51.8, 27.3, 17.2, 3.0], ["313", 5.27, 100, 87.1, 52.9, 26.6, 16.4, 3.1]], "EXT-P"),
        mar: mar([["16/09", 318, 3.2, 12.4], ["16/09", 305, 3.5, 13.0], ["16/09", 331, 3.0, 11.8], ["16/09", 322, 3.3, 12.1], ["16/09", 312, 3.4, 12.7]]),
        gc: gcs([["301", "LE", 2.176], ["304", "eixo", 2.189], ["307", "LD", 2.181], ["310", "LE", 2.195], ["313", "eixo", 2.184]]),
        geo: geo(300, [6.1, 5.9, 6.2, 6.0, 5.8, 6.1, 6.2, 5.9, 6.0, 6.1, 5.8, 6.0, 6.2, 5.9, 6.1, 6.0], [0.9, -1.2, 1.6, -0.4], [0.2, 0.3, 0.1, 0.4]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", obs: "não aplicável à usina a frio sem aquecimento" }, { atende: "S" }],
        obs: "Exemplo: extrações, Marshall, GC e geometria digitados; emulsão (exemplo da ficha DNIT 165) com recuperação elástica e destilação completadas à mão; EA, adesividade e LA importados dos exemplos das fichas DNIT 450, 452 e 451." };
      importa(d, "impLig", [["dnit-165-2013-em", 2]]);
      Object.assign(d.lig[0], { tipo: "RL-1C polímero", massa: "28,0", ensC: "S", ens100: "S", ens500: "S", obs: "exemplo da ficha 165; RE, destilação e IV do certificado conferidos" });
      importa(d, "impAgr", [["dnit-450-2024-me", 1], ["dnit-452-2024-me", 0], ["dnit-451-2024-me", 1]]);
      d.agr.push({ reg: "AG-J1", data: "16/09/2026", gran: "2", if: "0,62", dur: "5" });
      return d;
    } },
    { nome: "Lote rejeitado — teor acima de projeto + 0,3, nº 10 fora da faixa de trabalho, GC < 95 %, espessura fora de ± 5 %", dados: function () {
      var d = { ident: { registro: "LOTE-PMFP-002", data: "2026-09-18", obra: "Obra C — BR-000", trecho: "Faixa 2", local: "Est. 315 a 330", camada: "PMF polímero — faixa B" },
        params: Object.assign({}, F.padrao, { estIni: "315", estFim: "330", largura: "3,60", jornadas: "1", teorProj: "5,20", gmbRef: "2,210", espProj: "6,0" }),
        proj: JSON.parse(JSON.stringify(PROJ)),
        ext: ext([["316", 5.38, 100, 86.8, 53.4, 28.9, 20.8, 3.9], ["319", 5.49, 100, 87.4, 54.2, 29.6, 21.9, 4.2], ["322", 5.31, 100, 85.9, 52.8, 28.1, 20.2, 3.6],
          ["325", 5.56, 100, 88.1, 55.0, 30.2, 22.6, 4.4], ["328", 5.42, 100, 86.2, 53.9, 29.3, 21.4, 4.0]], "EXT-P"),
        mar: mar([["18/09", 296, 3.6, 10.8], ["18/09", 284, 3.9, 10.1], ["18/09", 301, 3.7, 11.2], ["18/09", 276, 4.1, 9.6], ["18/09", 289, 3.8, 10.5]]),
        gc: gcs([["316", "LE", 2.118], ["319", "eixo", 2.141], ["322", "LD", 2.096], ["325", "LE", 2.152], ["328", "eixo", 2.127]]),
        geo: geo(315, [5.6, 5.8, 5.5, 5.9, 5.7, 5.6, 5.8, 5.4, 5.7, 5.9, 5.6, 5.5, 5.8, 5.7, 5.6, 5.9], [1.1, -0.8, 2.4], [0.3, 0.4, 0.2]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
        obs: "Exemplo de reprovação: teor médio de 5,43 % (X̄ + ks > 5,50 %), nº 10 acima da faixa de trabalho (projeto 17 ± 5 %), GC com X̄ − ks < 95 % e CP de 94,8 %, espessura média 5,7 cm (X̄ − ks < 5,7 cm); emulsão sem os ensaios de 100 t e 500 t; carregamento reprovado." };
      importa(d, "impLig", [["dnit-165-2013-em", 0]]);
      d.lig[0].massa = "30,0";
      importa(d, "impAgr", [["dnit-450-2024-me", 0], ["dnit-452-2024-me", 1]]);
      d.agr.push({ reg: "AG-J1", data: "18/09/2026", gran: "2" });
      return d;
    } },
  ];
})();
