/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 153/2010-ES — Pré-misturado a frio com emulsão catiônica convencional.
 * Usa o núcleo FE.aceitacaoG4b (site/fichas/es-dnit-150-2010-es.js, carregado antes) e define G4.pmf(cfg), a montagem
 * comum dos pré-misturados a frio, usada também pela DNER-ES 390/99 (es-dner-es-390-99.js).
 *
 * O que a ES manda (seções do PDF):
 *   5.1.1 emulsões RM-1C/RM-2C (PMF aberto) ou RL-1C (denso); 5.1.2 agregado graúdo: LA ≤ 40 %, índice de forma > 0,5,
 *   durabilidade < 12 %, adesividade > 90 %; agregado miúdo: EA ≥ 55 %; 5.2 a) Tabela 2: faixas A–D, tolerâncias da
 *   faixa de projeto (± 7/5/2 %); 5.2 c) fração retida entre peneiras consecutivas ≥ 4 %; 5.2 d) Tabela 3 (Marshall a
 *   frio, DNER-ME 107): vazios 5 a 30 %, estabilidade ≥ 250 kgf (75 golpes) ou 150 kgf (50 golpes), fluência 2,0 a 4,5 mm;
 *   5.4.1 viscosidade da emulsão no início da mistura 75 a 150 SSF; 5.4.3 a) distribuição com temperatura > 10 °C;
 *   7.1.1 ligante: resíduo, peneiramento e carga por carregamento; viscosidade SF, sedimentação e desemulsibilidade a
 *   cada 100 t; 7.1.2 agregados: 2 granulometrias de cada silo e 1 EA por jornada; LA, durabilidade e adesividade por mês;
 *   índice de forma a cada 900 m³; 7.2.1 a) teor de ligante residual (extração DNER-ME 053) projeto ± 0,3 %;
 *   7.2.1 b) granulometria do agregado extraído dentro das tolerâncias do projeto; 7.2.1 c) Marshall (3 CPs) por jornada;
 *   7.2.2 c) GC ≥ 95 %, não se permitindo valores inferiores; 7.2.3 mínimo de 5 determinações por jornada de 8 h;
 *   7.3.1 espessura ± 10 %; 7.3.2 alinhamentos ± 5 cm; 7.3.3 a) régua ≤ 0,5 cm em cada estaca, b) QI < 35 cont./km;
 *   7.3.4 VRD > 55 a cada 200 m; 7.5 X̄ − ks ≥ mín. e X̄ + ks ≤ máx. (k "tabelado": Tabela 1 da DNER-PRO 277/97, citada em 7.4).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G4 = FE.aceitacaoG4b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!G4 || !G4.montar) { if (window.console) console.error("es-dnit-153-2010-es.js: carregue antes site/fichas/es-dnit-150-2010-es.js (FE.aceitacaoG4b)."); return; }

  // =====================================================================================
  // G4.pmf — montagem comum dos pré-misturados a frio (DNIT 153/2010-ES, DNER-ES 390/99)
  // =====================================================================================
  // c: {id, norma, titulo, resumo, notas, refs, tabelaK, faixaPadrao, mistura: {...G4.secMistura}, freqExec(ctx) -> {exigido, regra},
  //     marshall: {...G4.secMarshall}, gc: {...G4.secGC}, geo: {...G4.secGeo}, visc: {min, max, sec} | null, qi: {sec} | null,
  //     vrd: {sec} | null, ligante: {...G4.secLigante}, agregados: {...G4.secAgregados}, verif: [...], params, padrao, exemplos, textos}
  G4.pmf = function (c) {
    var secoes = [G4.secMistura(Object.assign({ norma: c.norma || c.id, tabelaK: c.tabelaK, refs: c.refs, freq: c.freqExec }, c.mistura)),
      G4.secMarshall(Object.assign({}, c.marshall)),
      G4.secGC(Object.assign({ freq: c.freqExec }, c.gc)),
      G4.secGeo(c.geo)];
    if (c.vrd) secoes.push(G4.secValor({ id: "vrd", grupo: "Produto — segurança", criterio: "Valor de resistência à derrapagem (VRD)", secao: c.vrd.sec, unid: "", casas: 0,
      min: 55, minEstrito: true, exigido: function () { return "> 55 (pêndulo britânico)"; }, metodo: "ASTM E 303", titulo: "Resistência à derrapagem — pêndulo britânico (" + c.vrd.sec + ")",
      dica: "locais aleatórios, 1 a cada 200 m de pista", rotV: "VRD", se: function (P) { return P.rolamento !== "nao"; },
      naoAplicaPor: "camada não é a de rolamento",
      freq: function (ctx) { return { exigido: ok(ctx.L.ext) ? A.nMin(ctx.L.ext, 200) : 1, regra: "1 a cada 200 m de pista (" + c.vrd.sec + ")" }; } }));
    if (c.visc) secoes.push(G4.secValor({ id: "visc", grupo: "Mistura — usinagem", criterio: "Viscosidade SF da emulsão no início da mistura", secao: c.visc.sec, unid: "SSF", casas: 0,
      min: c.visc.min, max: c.visc.max, individual: true, metodo: "DNER-ME 004", titulo: "Viscosidade Saybolt-Furol da emulsão no início da mistura (" + c.visc.sec + ")",
      dica: c.visc.dica, rotV: "Viscosidade SF", rotPos: "Data / hora", graf: false,
      depois: function (l) { if (l.situacao === "sem_dados") { l.situacao = "informativo"; l.motivo = "não registrada — a ES não fixa frequência; registrar no controle da usinagem (" + c.visc.sec + ")"; l.motivos = []; } } }));
    secoes.push(G4.secLigante(c.ligante), G4.secAgregados(c.agregados), G4.secVerif(c.verif));
    return G4.montar({
      id: c.id, norma: c.normaChave, titulo: c.titulo, resumo: c.resumo, notas: c.notas, refs: c.refs, tabelaK: c.tabelaK, textos: c.textos,
      params: [{ k: "rolamento", r: "Camada de rolamento? (condições de segurança)", tipo: "select", recarrega: true,
        opcoes: [["sim", "Sim — VRD exigido"], ["nao", "Não — regularização, base ou camada subjacente"]], se: function () { return !!c.vrd; } }]
        .concat(c.qi ? [{ k: "qi", r: "Quociente de irregularidade QI do lote (cont./km) — opcional", dica: "medidor tipo resposta (" + c.qi.sec + "): < 35 cont./km" }] : [])
        .concat(c.params || []),
      padrao: c.padrao, secoes: secoes, exemplos: [],
      extra: function (ctx) {
        var P = ctx.P;
        if (c.qi && ok(num(P.qi))) {
          var q = num(P.qi), l = A.linha({ id: "qi", grupo: "Produto — geometria e acabamento", criterio: "Quociente de irregularidade (QI)", secao: c.qi.sec, unid: "cont./km", casas: 0,
            exigido: "< 35 cont./km", resultado: fmt(q, 0) + " cont./km", n: 1, media: q });
          if (q >= 35) A.marcar(l, "nao_conforme", "QI = " + fmt(q, 0) + " ≥ 35 cont./km"); else l.motivo = "QI = " + fmt(q, 0) + " < 35 cont./km";
          ctx.linhas.push(l);
        }
        if (c.extra) c.extra(ctx);
      },
    });
  };

  // =====================================================================================
  // DNIT 153/2010-ES
  // =====================================================================================
  var ID = "dnit-153-2010-es";
  var REFS = { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "DNER-PRO 277/97 (citada em 7.4)" };
  function freqJornada(ctx) { return { exigido: 5 * ctx.J, regra: "mín. 5 por jornada de 8 h (7.2.3)" }; }
  var F = G4.pmf({
    id: ID, titulo: "Pré-misturado a frio (emulsão convencional) — aceitação de lote", tabelaK: G4.K_277, refs: REFS, freqExec: freqJornada,
    resumo: "Reúne extrações (teor de ligante residual ± 0,3 % e granulometria), ensaios Marshall a frio, grau de compressão, geometria, acabamento e VRD, o recebimento da emulsão e o controle dos agregados; confere a frequência (7.1, 7.2.3, 7.3) e aplica o controle estatístico da 7.5.",
    mistura: { faixaPadrao: "dnit-153-2010-es-B", tolTeor: 0.3, secTeor: "7.2.1 a", secGran: "7.2.1 b", secFaixa: "5.2 a; Tabela 2", rotTeor: "Teor de ligante residual",
      metodoTeor: "extração DNER-ME 053 (saída do misturador)", retidoMin: 4, secRetido: "5.2 c" },
    marshall: { secao: "7.2.1 c", secLim: "5.2 d; Tabela 3", vv: [5, 30], flu: [2.0, 4.5], golpes: ["75", "50"], estatEst: true,
      estMin: function (P) { return P.golpes === "50" ? 150 : 250; }, golpesAtual: function (P) { return P.golpes || "75"; },
      freq: function (ctx) { return { exigido: ctx.J, regra: "1 ensaio (3 CPs) por jornada de 8 h (7.2.1 c)" }; } },
    gc: { secao: "7.2.2 c", min: function () { return 95; }, obrigMin: true, estatistico: true, exigidoTxt: function () { return "≥ 95 % (não se permitem valores inferiores)"; },
      refTxt: "massa específica aparente de projeto (7.2.2 a) ou dos CPs moldados no local (7.2.2 d)" },
    geo: { esp: { tol: 0.10, sec: "7.3.1" }, alin: { tol: 5, sec: "7.3.2" }, regua: { max: 0.5, sec: "7.3.3 a" } },
    vrd: { sec: "7.3.4" }, qi: { sec: "7.3.3 b" },
    visc: { min: 75, max: 150, sec: "5.4.1", dica: "75 a 150 SSF (DNER-ME 004), de preferência 85 a 95 SSF" },
    ligante: { sec: "7.1.1", porCarg: { texto: "resíduo de destilação, peneiramento, carga da partícula", sec: "7.1.1 a",
      ids: [["residuo", "resíduo"], ["pen084", "peneiramento"], ["carga", "carga da partícula"]] },
      por100: { texto: "viscosidade SF, sedimentação, desemulsibilidade", sec: "7.1.1 b", ids: [[["sf25", "sf50"], "viscosidade SF"], ["sed", "sedimentação"], ["desem", "desemulsibilidade"]] },
      de: ["dnit-165-2013-em"] },
    agregados: { sec: "5.1.2; 7.1.2", nAgreg: "Número de silos de agregado (granulometria de cada silo, 7.1.2)", itens: [
      { k: "gran", secao: "7.1.2", freq: { texto: "2 de cada silo por jornada de 8 h", n: 2 } },
      { k: "ea", secao: "5.1.2 b; 7.1.2", min: 55, metodo: "DNER-ME 054 → DNIT 450", freq: { por: "jornada", n: 1, texto: "1 por jornada (agregado miúdo)" } },
      { k: "ades", secao: "5.1.2 a; 7.1.2", min: 90, metodo: "DNER-ME 059", freq: { por: "mes", n: 1, texto: "1 por mês ou com variação do material" } },
      { k: "la", secao: "5.1.2 a; 7.1.2", max: 40, metodo: "DNER-ME 035 → DNIT 451", freq: { por: "mes", n: 1, texto: "1 por mês ou com variação do material" } },
      { k: "dur", secao: "5.1.2 a; 7.1.2", max: 12, exigido: "< 12 %", metodo: "DNER-ME 089", freq: { por: "mes", n: 1, texto: "1 por mês ou com variação do material" } },
      { k: "if", secao: "5.1.2 a; 7.1.2", min: 0.5, minEstrito: true, exigido: "> 0,5", metodo: "DNER-ME 086", freq: { por: "volume", a_cada: 900, texto: "1 a cada 900 m³" } },
    ] },
    verif: [
      { id: "clima", texto: "Execução sem chuva e distribuição com temperatura ambiente > 10 °C", secao: "4 b; 5.4.3 a" },
      { id: "cert", texto: "Certificado de análise da emulsão em todo carregamento", secao: "4 c" },
      { id: "base", texto: "Superfície subjacente limpa e pintada ou imprimada (pintura de ligação após 7 dias ou tráfego)", secao: "5.4" },
      { id: "trecho", texto: "Projeto da mistura verificado em trecho experimental (~100 m)", secao: "7.3.4 c" },
      { id: "trafego", texto: "Camada aberta ao tráfego sem deformação ou desagregação", secao: "5.4.4", falha: "ressalva" },
    ],
    padrao: { faixa: "dnit-153-2010-es-B", golpes: "75", rolamento: "sim", nAgreg: "1", meses: "1", laDesemp: "nao" },
    notas: "Critérios da DNIT 153/2010-ES: teor de ligante residual por extração (7.2.1 a, projeto ± 0,3 %); granulometria do agregado extraído na faixa de trabalho = projeto ± tolerâncias da Tabela 2 (7.2.1 b), curva de projeto dentro da faixa e com fração retida entre peneiras consecutivas ≥ 4 % (5.2 c); Marshall a frio (Tabela 3); GC ≥ 95 % sem valores individuais inferiores (7.2.2 c); mínimo de 5 determinações por jornada (7.2.3: adotado para extração, granulometria e GC; o Marshall é 1 ensaio de 3 CPs por jornada, 7.2.1 c); espessura ± 10 %, alinhamentos ± 5 cm, régua ≤ 0,5 cm, QI < 35 e VRD > 55 (7.3). A Tabela 2 dá tolerância de ± 2 % para o teor de betume, mas 7.2.1 a fixa ± 0,3 % para o controle: adotado ± 0,3 %. A ES diz \"k tabelado\" sem a tabela: usada a Tabela 1 da DNER-PRO 277/97 (7.4).",
  });

  // =====================================================================================
  // Exemplos
  // =====================================================================================
  function importa(d, k, refs) { A.exemplos.importar(F.params, d, k, refs); }
  // colunas de extração: [estaca, teor, 3/4", 1/2", 3/8", nº 4, nº 10, nº 200]
  function ext(lista, pref) {
    return lista.map(function (x, i) {
      return { est: x[0], pos: "saída do misturador", reg: pref + "-" + (i + 1) + " · DNER-ME 053", teor: A.nstr(x[1], 2), r19_1: A.nstr(x[2], 1), r12_7: A.nstr(x[3], 1),
        r9_5: A.nstr(x[4], 1), r4_8: A.nstr(x[5], 1), r2: A.nstr(x[6], 1), r0_075: A.nstr(x[7], 1) };
    });
  }
  function geo(ini, esp, alin, reg) { return esp.map(function (e, i) { return { est: String(ini + i), esp: A.nstr(e, 1), alin: A.nstr(alin[i % alin.length], 1), regua: A.nstr(reg[i % reg.length], 1) }; }); }
  function gcs(lista, pref) { return lista.map(function (x, i) { return { est: x[0], pos: x[1], reg: pref + "-" + (i + 1), gmb: A.nstr(x[2], 3) }; }); }
  var PROJ = [{ r19_1: "100", r12_7: "88", r9_5: "54", r4_8: "28", r2: "17", r0_075: "4" }];
  F.exemplos = [
    { nome: "Lote aceito — PMF denso faixa B, 2 jornadas (extração, emulsão, EA e adesividade dos exemplos ME)", dados: function () {
      var d = { ident: { registro: "LOTE-PMF-001", data: "2026-09-08", obra: "Obra A — BR-000", trecho: "Pista direita", local: "Est. 200 a 225", camada: "PMF denso — RL-1C, faixa B" },
        params: Object.assign({}, F.padrao, { estIni: "200", estFim: "225", largura: "3,60", jornadas: "2", teorProj: "5,00", gmbRef: "2,180", espProj: "5,0", qi: "28", volAgr: "300" }),
        proj: JSON.parse(JSON.stringify(PROJ)),
        mar: [{ est: "08/09", pos: "jornada 1", reg: "MAR-01 · DNER-ME 107", ncp: "3", golpes: "75", estab: "338", flu: "3,1", vv: "14,2" },
          { est: "09/09", pos: "jornada 2", reg: "MAR-02 · DNER-ME 107", ncp: "3", golpes: "75", estab: "362", flu: "3,4", vv: "13,1" }],
        gc: gcs([["201", "LE", 2.141], ["203", "eixo", 2.165], ["205", "LD", 2.150], ["208", "LE", 2.172], ["210", "eixo", 2.158], ["212", "LD", 2.139],
          ["215", "LE", 2.162], ["217", "eixo", 2.176], ["220", "LD", 2.147], ["223", "eixo", 2.168]], "CP-P"),
        geo: geo(200, [5.2, 4.9, 5.4, 5.1, 4.8, 5.3, 5.0, 5.2, 4.7, 5.1, 5.3, 4.9, 5.2, 5.0, 5.4, 4.8, 5.1, 5.2, 4.9, 5.3, 5.0, 5.1, 4.8, 5.2, 5.0, 5.1],
          [1.1, -0.7, 2.0, -1.5, 0.4, 1.8, -2.2, 0.9], [0.2, 0.3, 0.1, 0.4, 0.2, 0.3]),
        vrd: [{ est: "204", reg: "VRD-01", v: "61" }, { est: "214", reg: "VRD-02", v: "58" }, { est: "222", reg: "VRD-03", v: "63" }],
        visc: [{ est: "", pos: "08/09 07h10", reg: "SF-01", v: "92" }, { est: "", pos: "09/09 07h05", reg: "SF-02", v: "88" }],
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
        obs: "Exemplo: uma extração importada do exemplo da ficha DNER-ME 053 (PMF faixa B) e nove digitadas; carregamento de emulsão, EA e adesividade importados dos exemplos das fichas DNIT 165, 450 e 452." };
      importa(d, "impExt", [["dner-me-053-94", 2]]);
      d.ext[0].est = "202";
      d.ext = d.ext.concat(ext([["204", 4.92, 100, 88.6, 53.1, 27.4, 16.8, 4.2], ["206", 5.08, 100, 87.1, 55.2, 28.9, 17.6, 3.9], ["209", 4.95, 100, 88.9, 53.8, 27.1, 16.4, 4.4],
        ["211", 5.11, 100, 86.8, 54.6, 28.6, 17.9, 3.7], ["213", 4.97, 100, 88.2, 52.9, 28.2, 17.1, 4.1], ["216", 5.06, 100, 87.5, 54.9, 27.8, 16.6, 4.5],
        ["218", 4.94, 100, 89.1, 53.5, 28.4, 17.3, 3.8], ["221", 5.03, 100, 87.8, 54.2, 27.6, 16.9, 4.3], ["224", 4.99, 100, 88.4, 55.4, 28.8, 17.5, 4.0]], "EXT-PMF"));
      importa(d, "impLig", [["dnit-165-2013-em", 2]]);
      d.lig[0].tipo = "RL-1C"; d.lig[0].massa = "28,0"; d.lig[0].ens100 = "S"; d.lig[0].obs = "exemplo RR-1C da ficha 165 usado como carregamento do lote; SF, sedimentação e desemulsibilidade nas primeiras 100 t";
      importa(d, "impAgr", [["dnit-450-2024-me", 1], ["dnit-452-2024-me", 0]]);
      d.agr = d.agr.concat([{ reg: "AG-J1", data: "08/09/2026", gran: "2", la: "28", dur: "4", if: "0,68" }, { reg: "AG-J2", data: "09/09/2026", gran: "2", ea: "64" }]);
      return d;
    } },
    { nome: "Lote rejeitado — Marshall abaixo da Tabela 3, GC < 95 %, espessura baixa, emulsão reprovada", dados: function () {
      var d = { ident: { registro: "LOTE-PMF-002", data: "2026-09-12", obra: "Obra B — BR-000", trecho: "Pista esquerda", local: "Est. 60 a 72", camada: "PMF — faixa B" },
        params: Object.assign({}, F.padrao, { estIni: "60", estFim: "72", largura: "3,60", jornadas: "1", teorProj: "5,00", gmbRef: "2,180", espProj: "5,0", golpes: "50", rolamento: "nao" }),
        proj: JSON.parse(JSON.stringify(PROJ)),
        ext: ext([["61", 4.88, 100, 87.9, 53.6, 27.9, 16.9, 4.1], ["63", 5.21, 100, 88.8, 54.8, 28.7, 17.4, 4.6], ["66", 4.79, 100, 86.9, 52.8, 27.2, 16.2, 3.8],
          ["69", 5.15, 100, 89.2, 55.9, 29.1, 18.0, 4.9], ["71", 4.93, 100, 88.1, 54.1, 28.0, 17.0, 4.2]], "EXT-PMF"),
        gc: gcs([["61", "LE", 2.101], ["64", "eixo", 2.064], ["66", "LD", 2.118], ["69", "LE", 2.095], ["71", "eixo", 2.126]], "CP-P"),
        geo: geo(60, [4.6, 4.3, 4.8, 4.2, 4.5, 4.4, 4.7, 4.1, 4.6, 4.3, 4.5, 4.4, 4.2], [1.4, -0.9, 2.3], [0.3, 0.6, 0.2, 0.4]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "N", obs: "desagregação nas est. 64–65" }],
        obs: "Exemplo de reprovação: Marshall do exemplo de controle da ficha DNER-ME 107 (estabilidade e fluência abaixo da Tabela 3), GC com CP de 94,7 %, espessura média abaixo de 4,5 cm, régua com 0,6 cm, emulsão reprovada (exemplo da ficha 165) e ensaios de agregados faltando." };
      importa(d, "impMar", [["dner-me-107-94", 1]]);
      importa(d, "impLig", [["dnit-165-2013-em", 0]]);
      d.lig[0].massa = "30,0";
      importa(d, "impAgr", [["dnit-450-2024-me", 2]]);
      return d;
    } },
  ];
})();
