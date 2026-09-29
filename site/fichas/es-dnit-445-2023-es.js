/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 445/2023-ES — Terraplenagem — Revestimento primário.
 * Funções comuns: FE.aceitacaoG7 (es-dnit-104-2009-es.js).
 *
 * O que a ES manda (seções do PDF):
 *   5.1  b) diâmetro máximo ≤ 25 mm (NOTA 2: maior, se justificado e aceito pela Fiscalização); c) granulometria;
 *        d) durabilidade ≤ 12 % (DNER-ME 089); e) Los Angeles < 55 % no retido na nº 10; f) CBR ≥ 20 % e expansão ≤ 1 %;
 *        g) finos: classificação MCT e prioridade da Tabela B1; h) lateríticos: mini-CBR ≥ 12 %, expansão < 0,5 % e
 *        mini-CBR(h ót − 3 %)/mini-CBR(h ót) ≥ 1; i) fração grossa: G-MCT e Tabela B2; j) não lateríticos: LL ≤ 35 % e IP ≤
 *        Tabela 1 (12 / 9 / 7 % para chuva até 800, 800–1500, > 1500 mm) (p. 3–4).
 *   5.2  Tabela 2 — espessuras mínimas recomendadas (veículos comerciais/dia × suporte do subleito da Tabela 3).
 *   6.1  sem execução em dias de chuva; superfície de assentamento limpa e liberada; remover fragmentos > 25 mm.
 *   8.1  materiais a cada 200 m ou mudança de material: durabilidade, MCT (Mini-MCV + perda por imersão), mini-CBR (lateríticos),
 *        Los Angeles, LL/LP/CBR/expansão (não lateríticos) (p. 5).
 *   8.2.1 a) γs,máx e h ót a cada 200 m (DNIT 164); b) umidade antes da compactação a cada 200 m: h ót − 2,0 a + 1,0 %;
 *        c) umidade e MEAS in situ após a compactação; d) grau de compactação a cada 60 m (p. 5–6).
 *   8.2.2 deflexão (se definida em projeto): mín. 15 determinações, a cada 100 m em faixas alternadas; Dc = D₀médio + k·S ≤ LSE (eq. 1).
 *   8.3  geometria a cada 60 m: cotas do eixo e bordos ± 3 cm (ou, sem cotas de projeto, espessura ± 3 cm por sondagem); largura
 *        da semiplataforma + 10 cm, sem variação negativa; abaulamento ± 0,5 % da inclinação de projeto; acabamento visual (p. 6).
 *   8.5  X̄ − k·s ≥ mínimo; X̄ + k·s ≤ máximo; k da Tabela A1 (Anexo A, normativo).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G7 = FE.aceitacaoG7, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-445-2023-es";
  function lat(P) { return P.lat === "sim"; }
  function naoLat(P) { return P.lat !== "sim"; }
  var IPMAX = { ate800: 12, ate1500: 9, mais: 7 };
  // Tabela 2 (mm): [veículos comerciais/dia][suporte]
  var TAB2 = { v0: { baixa: 165, media: 140, elevada: 115 }, v5: { baixa: 215, media: 180, elevada: 140 },
    v10: { baixa: 290, media: 230, elevada: 180 }, v25: { baixa: 370, media: 290, elevada: 215 } };
  // Tabelas B1 (MCT) e B2 (G-MCT): prioridade de escolha (0 = "n", não recomendado)
  var PRIOR = { "LA'": 1, "LG'": 2, "NA'": 3, "LA": 4, "NA": 5, "NS'": 0, "NG'": 0,
    "Pa-LA": 0, "Sp-LA": 0, "Gf-LA": 5, "Ps-LA'": 1, "Sp-LA'": 1, "Gf-LA'": 3, "Ps-LG'": 2, "Sp-LG'": 2, "Gf-LG'": 4 };
  var G_MAT = "Controle dos materiais (5.1; 8.1)", G_EXE = "Controle da execução (8.2)", G_GEO = "Controle geométrico (8.3)";
  var F200 = { por: "extensao", a_cada: 200 };
  var F60 = { por: "extensao", a_cada: 60 };

  A.fichaSimples({
    id: ID,
    titulo: "Revestimento primário — aceitação de lote",
    resumo: "Aplica a DNIT 445/2023-ES: materiais a cada 200 m (durabilidade, Los Angeles, CBR/expansão, LL/IP ou mini-CBR, MCT), compactação (umidade h ót −2/+1 %, GC a cada 60 m), " +
      "deflexão (se em projeto) e geometria a cada 60 m (cotas ou espessura ± 3 cm, largura + 10 cm, abaulamento ± 0,5 %), com a estatística da 8.5 (Tabela A1).",
    lote: { largura: false },
    params: [
      { k: "lat", r: "Material laterítico? (5.1 h / j)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não laterítico — CBR ≥ 20 %, expansão ≤ 1 %, LL ≤ 35 %, IP da Tabela 1"], ["sim", "Laterítico — mini-CBR ≥ 12 %, expansão < 0,5 %, relação ≥ 1"]] },
      { k: "chuva", r: "Altura das chuvas na região (Tabela 1)", tipo: "select", opcoes: [["ate800", "até 800 mm — IP ≤ 12 %"], ["ate1500", "entre 800 e 1500 mm — IP ≤ 9 %"], ["mais", "maior que 1500 mm — IP ≤ 7 %"]],
        se: function (d) { return (d.params || {}).lat !== "sim"; } },
      { k: "mct", r: "Classificação MCT (finos, Tabela B1) ou G-MCT (fração grossa, Tabela B2)", tipo: "select",
        opcoes: [["", "— não informada —"]].concat(Object.keys(PRIOR).map(function (g) { return [g, g + " — " + (PRIOR[g] ? PRIOR[g] + "ª prioridade" : "não recomendado (n)")]; })) },
      { k: "nota2", r: "Diâmetro > 25 mm justificado e aceito pela Fiscalização (NOTA 2)?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "gcMin", r: "Grau de compactação mínimo (%) — a ES não fixa", ph: "100", dica: "8.2.1 d manda determinar o GC a cada 60 m sem fixar o mínimo: informe o do projeto (padrão 100 %)" },
      { k: "geoCtl", r: "Controle geométrico vertical (8.3 a / b)", tipo: "select", recarrega: true,
        opcoes: [["cotas", "Cotas do eixo e bordos (± 3 cm)"], ["esp", "Sem cotas de projeto — espessura por sondagem (± 3 cm)"]] },
      { k: "declProj", r: "Inclinação transversal (abaulamento) de projeto (%)", ph: "3" },
      { k: "defl", r: "Controle por deflexão definido em projeto (8.2.2)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "lse", r: "Deflexão admissível de projeto — LSE (0,01 mm)", se: function (d) { return (d.params || {}).defl === "sim"; } },
      { k: "espProj", r: "Espessura de projeto (mm) — opcional", dica: "comparada com a Tabela 2 (espessuras mínimas recomendadas)" },
      { k: "vcd", r: "Veículos comerciais/dia (Tabela 2)", tipo: "select", opcoes: [["", "—"], ["v0", "0–5"], ["v5", "5–10"], ["v10", "10–25"], ["v25", "25–50"]] },
      { k: "suporte", r: "Capacidade de suporte do subleito (Tabela 3)", tipo: "select", opcoes: [["", "—"], ["baixa", "Baixa (CBR ≤ 3 %)"], ["media", "Média (3 % < CBR ≤ 10 %)"], ["elevada", "Elevada (CBR > 10 %)"]] },
      G7.paramComp("impComp", { comp: "comp", isc: "cbr", exp: "exp" }, { r: "Compactação, CBR e expansão — importar (DNIT 164 / 172)" }),
      G7.paramGC("impGC", "gc", null, { r: "Grau de compactação — importar furos/pontos (DNIT 458, DNER-ME 036/037, DNIT 417, DNIT 405)" }),
    ],
    padrao: { lat: "nao", chuva: "ate1500", mct: "", nota2: "nao", gcMin: "100", geoCtl: "cotas", declProj: "3", defl: "nao", vcd: "", suporte: "" },
    refs: { reprova: "8.5 b", atende: "8.5 a", corrige: "8.5", regra: "8.5", tabela: "Tabela A1" },
    criterios: [
      { id: "dmax", grupo: G_MAT, texto: "Diâmetro máximo do agregado (dimensão máxima característica)", secao: "5.1 b", tipo: "valor", unid: "mm", casas: 1, max: 25,
        metodo: "DNIT 412 (antiga DNER-ME 080)", importar: { de: "dnit-412-2025-me", valores: function (e) { return (e.resultados || {}).dmc; } } },
      { id: "dur", grupo: G_MAT, texto: "Durabilidade", secao: "5.1 d; 8.1 a", tipo: "estatistico", unid: "%", casas: 1, max: 12, metodo: "DNER-ME 089", freq: F200 },
      { id: "la", grupo: G_MAT, texto: "Abrasão Los Angeles (retido na nº 10)", secao: "5.1 e; 8.1 d", tipo: "estatistico", unid: "%", casas: 0, max: 55 - 1e-6, exigido: "< 55 %",
        metodo: "DNIT 451 (antiga DNER-ME 035)", freq: F200, importar: { de: "dnit-451-2024-me", valores: function (e) { return (e.resultados || {}).A; } } },
      { id: "cbr", grupo: G_MAT, texto: "CBR (energia intermediária ou de projeto)", secao: "5.1 f; 8.1 e", tipo: "estatistico", unid: "%", casas: 0, min: 20, metodo: "DNIT 172",
        se: naoLat, naoAplicaPor: "material laterítico (mini-CBR)", freq: F200 },
      { id: "exp", grupo: G_MAT, texto: "Expansão", secao: "5.1 f; 8.1 e", tipo: "estatistico", unid: "%", casas: 2, max: 1, metodo: "DNIT 172", se: naoLat, freq: F200 },
      { id: "ll", grupo: G_MAT, texto: "Limite de liquidez", secao: "5.1 j; 8.1 e", tipo: "estatistico", unid: "%", casas: 0, max: 35, metodo: "DNER-ME 122", se: naoLat, freq: F200,
        importar: { de: ["dner-me-122-94", "dner-me-082-94"], valores: G7.ll } },
      { id: "ip", grupo: G_MAT, texto: "Índice de plasticidade", secao: "5.1 j; Tabela 1", tipo: "estatistico", unid: "%", casas: 0, metodo: "DNER-ME 082", se: naoLat, freq: F200,
        max: function (P) { return IPMAX[P.chuva] || 9; }, importar: { de: "dner-me-082-94", valores: G7.ip } },
      { id: "mcbr", grupo: G_MAT, texto: "Mini-CBR (passante na nº 10)", secao: "5.1 h; 8.1 c", tipo: "estatistico", unid: "%", casas: 1, min: 12, metodo: "DNIT 254", se: lat,
        naoAplicaPor: "material não laterítico", freq: F200, importar: { de: "dnit-254-2023-me", valores: function (e) { return (e.resultados || {}).cbr; } } },
      { id: "mexp", grupo: G_MAT, texto: "Expansão no mini-CBR", secao: "5.1 h", tipo: "estatistico", unid: "%", casas: 2, max: 0.5 - 1e-6, exigido: "< 0,5 %", metodo: "DNIT 254", se: lat,
        freq: F200, importar: { de: "dnit-254-2023-me", valores: function (e) { return (e.resultados || {}).E; } } },
      { id: "mrel", grupo: G_MAT, texto: "Mini-CBR(h ót − 3 %) / Mini-CBR(h ót)", secao: "5.1 h, NOTA 3", tipo: "valor", unid: "", casas: 2, min: 1, metodo: "DNIT 254", se: lat },
      { id: "mctOk", grupo: G_MAT, texto: "Classificação MCT com Mini-MCV e perda de massa por imersão", secao: "5.1 g; 8.1 b", tipo: "sim_nao", metodo: "DNIT 258 / DNIT 259",
        exigido: "realizada", freq: F200 },
      { id: "comp", grupo: G_EXE, texto: "Compactação — γs,máx (amostra da pista)", secao: "8.2.1 a", tipo: "valor", unid: "g/cm³", casas: 3, metodo: "DNIT 164",
        exigido: "referência do GC", freq: F200 },
      { id: "dw", grupo: G_EXE, texto: "Umidade antes da compactação: Δw = w − h ót", secao: "8.2.1 b", tipo: "estatistico", unid: "p.p.", casas: 1, min: -2, max: 1,
        exigido: "h ót − 2,0 a + 1,0", metodo: "DNIT 456 (DNER-ME 052/088)", freq: F200 },
      { id: "gc", grupo: G_EXE, texto: "Grau de compactação", secao: "8.2.1 c, d", tipo: "estatistico", unid: "%", casas: 1, metodo: "DNIT 458 (DNER-ME 092)", freq: F60,
        min: function (P) { return ok(num(P.gcMin)) ? num(P.gcMin) : 100; } },
      { id: "defl", grupo: G_EXE, texto: "Deflexão — Dc = D₀médio + k·S (eq. 1)", secao: "8.2.2", tipo: "estatistico", unid: "0,01 mm", casas: 0,
        max: function (P) { return num(P.lse); }, metodo: "DNER-ME 024 / DNER-PRO 273", se: function (P) { return P.defl === "sim"; }, naoAplicaPor: "não definido em projeto",
        freq: { por: "extensao", a_cada: 100, minimo: 15, regra: "a cada 100 m em faixas alternadas; mín. 15 (8.2.2)" } },
      { id: "cota", grupo: G_GEO, texto: "Desvio de cota do eixo e dos bordos em relação ao projeto", secao: "8.3 a", tipo: "estatistico", unid: "cm", casas: 1, min: -3, max: 3,
        metodo: "nivelamento", se: function (P) { return P.geoCtl !== "esp"; }, naoAplicaPor: "controle pela espessura (8.3 b)" },
      { id: "esp", grupo: G_GEO, texto: "Desvio de espessura em relação ao projeto (furos de sondagem)", secao: "8.3 b", tipo: "estatistico", unid: "cm", casas: 1, min: -3, max: 3,
        metodo: "sondagem", se: function (P) { return P.geoCtl === "esp"; }, naoAplicaPor: "controle por cotas (8.3 a)", freq: F60 },
      { id: "larg", grupo: G_GEO, texto: "Variação da largura da semiplataforma (medida − projeto)", secao: "8.3 c", tipo: "estatistico", unid: "cm", casas: 0, min: 0, max: 10, obrigMin: true,
        exigido: "0 a + 10 cm (sem variação negativa)", metodo: "trena" },
      { id: "abaul", grupo: G_GEO, texto: "Abaulamento — inclinação transversal", secao: "8.3 d", tipo: "estatistico", unid: "%", casas: 1,
        min: function (P) { var x = num(P.declProj); return ok(x) ? x - 0.5 : NaN; }, max: function (P) { var x = num(P.declProj); return ok(x) ? x + 0.5 : NaN; }, metodo: "gabarito / nivelamento" },
      { id: "acab", grupo: G_GEO, texto: "Acabamento da superfície sem imperfeições que comprometam o escoamento (visual)", secao: "8.3", tipo: "sim_nao" },
      { id: "exec", grupo: G_EXE, texto: "Sem execução em dia de chuva; superfície de assentamento limpa, desempenada e liberada", secao: "6.1 a, c, d", tipo: "sim_nao" },
      { id: "frag", grupo: G_EXE, texto: "Fragmentos > 25 mm, resíduos orgânicos e elementos não conformes removidos", secao: "6.1 g", tipo: "sim_nao" },
      { id: "amb", grupo: G_EXE, texto: "Condicionantes ambientais (erosão, drenagem)", secao: "7", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var P = ctx.P, L = ctx.L;
      G7.freq(ctx, "dmax", { exigido: 1, regra: "5.1 c exige a granulometria; 8.1 não fixa — mín. 1 por lote (adotado)" });
      G7.freq(ctx, "mrel", ctx.item.mrel && ctx.item.mrel.situacao !== "nao_exigido" ? { exigido: 1, regra: "com o mini-CBR — mín. 1 por lote (adotado)" } : null);
      if (P.geoCtl !== "esp") G7.freq(ctx, "cota", { exigido: ok(L.ext) ? A.nMin(L.ext, 60) * 3 : NaN, regra: "eixo e 2 bordos a cada 60 m (8.3 a)" });
      G7.freq(ctx, "larg", { exigido: ok(L.ext) ? A.nMin(L.ext, 60) * 2 : NaN, regra: "cada semiplataforma a cada 60 m (8.3 c)" });
      G7.freq(ctx, "abaul", { exigido: ok(L.ext) ? A.nMin(L.ext, 60) * 2 : NaN, regra: "LE e LD a cada 60 m (adotado, com a relocação da 8.3 a)" });
      G7.ocultar(ctx, ["cbr", "exp", "ll", "ip", "mcbr", "mexp", "mrel", "cota", "esp", "defl"]);
      // diâmetro máximo acima de 25 mm aceito pela Fiscalização (NOTA 2)
      var dm = ctx.item.dmax;
      if (dm && dm.situacao === "nao_conforme" && P.nota2 === "sim") G7.abrandar(dm, "ressalva", "diâmetro acima de 25 mm aceito pela Fiscalização com justificativa (5.1, NOTA 2) — anexar");
      // deflexão: mínimo de 15 determinações (8.2.2)
      var df = ctx.item.defl;
      if (df && df.situacao !== "nao_exigido" && df.n && df.n < 15) A.marcar(df, "pendente", "apenas " + df.n + " determinações: a ES exige no mínimo 15 por subtrecho (8.2.2)");
      if (df && df.situacao !== "nao_exigido" && !ok(num(P.lse))) ctx.avisos.push("Informe a deflexão de projeto (LSE) — 8.2.2.");
      // prioridade MCT / G-MCT (Tabelas B1 e B2)
      var g = P.mct, l = A.linha({ id: "prior", grupo: G_MAT, criterio: "Prioridade de escolha do material (Tabela B1 / B2)", secao: "5.1 g, i; Anexo B",
        exigido: "1ª a 5ª prioridade (n = não recomendado)" });
      if (!g) { l.situacao = "informativo"; l.resultado = "classificação não informada"; l.motivo = "informe o grupo MCT/G-MCT nos parâmetros"; }
      else if (PRIOR[g]) { l.resultado = g + " — " + PRIOR[g] + "ª prioridade"; l.motivo = "grupo recomendado"; }
      else { l.resultado = g + " — não recomendado"; A.marcar(l, "ressalva", "grupo " + g + " não recomendado para revestimento primário (Anexo B) — justificar a escolha do material"); }
      var iM = ctx.linhas.indexOf(ctx.item.mctOk);
      ctx.linhas.splice(iM + 1, 0, l);
      // Tabela 2 — espessura mínima recomendada
      var eP = num(P.espProj), t = (TAB2[P.vcd] || {})[P.suporte];
      if (ok(eP) && t && eP < t) ctx.avisos.push("Espessura de projeto " + fmt(eP, 0) + " mm abaixo da mínima recomendada pela Tabela 2 (" + t + " mm) para o tráfego e o suporte informados (5.2).");
      if (!ok(num(P.gcMin)) || num(P.gcMin) === 100) ctx.avisos.push("A ES não fixa o GC mínimo (8.2.1 d): adotado " + (ok(num(P.gcMin)) ? fmt(num(P.gcMin), 0) : "100") + " % — confirme com o projeto.");
    },
    notas: "Critérios da DNIT 445/2023-ES; estatística da 8.5 (X̄ − k·s ≥ mín.; X̄ + k·s ≤ máx.; k da Tabela A1) aplicada a todo requisito com valor mínimo/máximo. Adotado pela ficha: " +
      "GC mínimo = 100 % (a ES não fixa); CBR/expansão só para não lateríticos (8.1 e); \"< 55 %\" e \"< 0,5 %\" como limites estritos; diâmetro máximo = DMC da DNIT 412 (1 por lote); " +
      "largura: valor individual negativo reprova (\"não havendo possibilidade de variação negativa\"); abaulamento: LE e LD a cada 60 m. Métodos substituídos: DNER-ME 080 → DNIT 412; DNER-ME 035 → DNIT 451; " +
      "DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458.",
    exemplos: [
      { nome: "Lote aceito — 300 m de solo laterítico (ensaios dos exemplos ME + campo digitado)", dados: function () {
        var d = { ident: { registro: "RP-01", data: "2026-07-01", obra: "Obra A — estrada vicinal", trecho: "Segmento 1", local: "Est. 0 a 15", origem: "Jazida 3" },
          params: { estIni: "0", estFim: "15", lat: "sim", mct: "LA'", nota2: "nao", gcMin: "100", geoCtl: "cotas", declProj: "4", defl: "nao", espProj: "180", vcd: "v5", suporte: "media" } };
        var par = FE.FICHAS[ID].params;
        d.dmax = [{ est: "3", reg: "GR-0101 · DNIT 412 (digitado)", v: "19" }];
        d.dur = [{ est: "3", v: "6,8" }, { est: "12", v: "7,4" }];
        A.exemplos.importar(par, d, "imp_la", [["dnit-451-2024-me", 0]]);
        d.la[0].est = "3"; d.la.push({ est: "12", reg: "LA-0212 (digitado)", v: "41" });
        A.exemplos.importar(par, d, "imp_mcbr", [["dnit-254-2023-me", 0]]);
        A.exemplos.importar(par, d, "imp_mexp", [["dnit-254-2023-me", 0]]);
        d.mcbr[0].est = "3"; d.mexp[0].est = "3";
        d.mcbr.push({ est: "12", reg: "MCBR-0044 (digitado)", v: "19,5" }); d.mexp.push({ est: "12", reg: "MCBR-0044 (digitado)", v: "0,28" });
        d.mrel = [{ est: "3", reg: "MCBR-0043/0045", v: "1,18" }];
        d.comp = [{ est: "3", reg: "PR-0301 · DNIT 164 (digitado)", v: "1,956" }, { est: "12", reg: "PR-0302 · DNIT 164 (digitado)", v: "1,948" }];
        d.dw = [{ est: "2", v: "-0,8" }, { est: "11", v: "0,4" }];
        d.gc = [["1", 101.2], ["4", 100.8], ["7", 102.0], ["10", 101.5], ["13", 100.9], ["15", 101.7]].map(function (x, i) { return { est: x[0], pos: ["LE", "eixo", "LD"][i % 3], reg: "DNIT 458 — furo " + (i + 1), v: A.nstr(x[1], 1) }; });
        d.cota = []; d.larg = []; d.abaul = [];
        [0, 3, 6, 9, 12, 15].forEach(function (e, i) {
          ["LE", "eixo", "LD"].forEach(function (p, j) { d.cota.push({ est: String(e), pos: p, v: A.nstr([0.8, -1.2, 0.5, 1.1, -0.4][(i + j) % 5], 1) }); });
          d.larg.push({ est: String(e), pos: "LE", v: String([3, 5, 2][i % 3]) }); d.larg.push({ est: String(e), pos: "LD", v: String([4, 2, 6][i % 3]) });
          d.abaul.push({ est: String(e), pos: "LE", v: A.nstr([4.1, 3.9, 4.2][i % 3], 1) }); d.abaul.push({ est: String(e), pos: "LD", v: A.nstr([3.8, 4.0, 4.1][i % 3], 1) });
        });
        d.verificacoes = [{ atende: "S", real: "2" }, { atende: "S", real: "2" }, { atende: "S" }, { atende: "S" }, { atende: "S" }];
        return d;
      } },
      { nome: "Lote rejeitado — não laterítico com IP acima da Tabela 1, GC baixo e largura negativa", dados: function () {
        var d = { ident: { registro: "RP-02", data: "2026-08-12", obra: "Obra B", trecho: "Segmento 4", local: "Est. 100 a 110", origem: "Jazida 5" },
          params: { estIni: "100", estFim: "110", lat: "nao", chuva: "mais", mct: "", nota2: "nao", gcMin: "100", geoCtl: "esp", declProj: "3", defl: "nao" } };
        var par = FE.FICHAS[ID].params;
        A.exemplos.importar(par, d, "imp_dmax", [["dnit-412-2025-me", 1]]);
        d.dmax[0].est = "104";
        d.dur = [{ est: "104", v: "9,5" }];
        d.la = [{ est: "104", reg: "LA-0301 (digitado)", v: "38" }];
        A.exemplos.importar(par, d, "impComp", [["dnit-172-2016-me", 2]]);
        d.comp[0].est = "104"; d.cbr[0].est = "104"; d.exp[0].est = "104";
        A.exemplos.importar(par, d, "imp_ll", [["dner-me-082-94", 0]]);
        A.exemplos.importar(par, d, "imp_ip", [["dner-me-082-94", 1]]);
        d.ll[0].est = "104"; d.ip[0].est = "104";
        d.dw = [{ est: "103", v: "-1,5" }];
        A.exemplos.importar(par, d, "impGC", [["dner-me-037-94", 1], ["dnit-458-2025-me", 1]]);
        var ests = ["101", "103", "105", "106", "107", "108", "110"];
        d.gc.forEach(function (c, i) { c.est = ests[i] || c.est; });
        d.esp = [{ est: "100", v: "1,5" }, { est: "103", v: "-2,0" }, { est: "106", v: "0,5" }, { est: "109", v: "-1,0" }];
        d.larg = [{ est: "100", pos: "LE", v: "4" }, { est: "100", pos: "LD", v: "6" }, { est: "103", pos: "LE", v: "-3" }, { est: "103", pos: "LD", v: "5" },
          { est: "106", pos: "LE", v: "7" }, { est: "106", pos: "LD", v: "2" }, { est: "109", pos: "LE", v: "5" }, { est: "109", pos: "LD", v: "8" }];
        d.abaul = [{ est: "100", v: "3,2" }, { est: "103", v: "2,9" }, { est: "106", v: "3,1" }, { est: "109", v: "3,3" }];
        d.verificacoes = [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }];
        return d;
      } },
    ],
  });
})();
