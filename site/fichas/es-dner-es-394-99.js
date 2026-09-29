/*
 * Ficha de ACEITAÇÃO DE LOTE: DNER-ES 394/99 — Macadame por penetração com asfalto polímero.
 * Montagem comum G4.ts (site/fichas/es-dner-es-391-99.js, carregado antes), com as camadas do macadame:
 *   1ª — agregado da faixa I-A a I-E (kg/m² do quadro de 5.1.3) + 1ª aplicação de ligante (l/m² do quadro);
 *   2ª — agregado da faixa II-A (6 kg/m², 5.1.4.2) + 2ª aplicação de ligante (l/m² do quadro);
 *   3ª — agregado da faixa III-A (5 a 8 kg/m², camada de bloqueio, 5.3.1.8), sem ligante.
 * O que a ES manda (seções do PDF):
 *   5.1.3 agregado: LA ≤ 40 %, índice de forma > 0,5, durabilidade < 12 %, faixas do quadro (tolerância na curva de
 *   projeto ± 5 %, nº 200 ± 2 %), espessura compactada por faixa; 5.1.3.1 diâmetro máximo ≤ 2/3 da espessura;
 *   5.1.4.3 emulsão: asfalto residual; 5.1.4.4 quantidades do quadro, valores exatos fixados no projeto;
 *   5.3.1.6 CAP: 150 °C + 3 °C por 1 % de polímero, máx. 180 °C; 7.1.1 ligante por carregamento / 100 t / 500 t;
 *   7.1.2 agregado: 2 granulometrias por jornada, índice de forma a cada 900 m³, adesividade por carregamento de
 *   ligante, LA por mês; 7.2.1 taxa de agregado por bandejas e 7.2.3 taxa de ligante residual por bandejas, tolerância
 *   "constante dos quadros do item 5.1.3" (a ficha usa como limites as faixas do quadro, ou as de projeto se informadas);
 *   7.2.2 temperatura no distribuidor; 7.2.4 tabela de amostragem variável (sem n = 11), mínimo de 5 por segmento de
 *   área < 3.000 m²; 7.3.1 réguas ≤ 0,5 cm; 7.3.2 alinhamentos ± 5 cm; 7.3.3 espessura ± 10 %; 7.4.2 aceitação
 *   estatística da granulometria e das taxas; 9.2 α = 0,10 e determinações a cada 700 m² (recomendação).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G4 = FE.aceitacaoG4b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!G4 || !G4.ts) { if (window.console) console.error("es-dner-es-394-99.js: carregue antes es-dnit-150-2010-es.js e es-dner-es-391-99.js."); return; }
  var ID = "dner-es-394-99";
  var REFS = { reprova: "7.4.2", atende: "7.4.2", corrige: "7.4.3", regra: "7.4.2", tabela: "tabela de amostragem variável (7.2.4)" };
  // quadro de 5.1.3: agregado (kg/m²), CAP 1ª aplicação (l/m²), CAP 2ª aplicação (l/m²), espessura compactada (cm)
  var Q = { "I-A": [[160, 210], [4.5, 8.2], [5.4, 6.8], [7.5, 10]], "I-B": [[135, 160], [4.1, 5.4], [3.2, 6.8], [6.5, 7.5]],
    "I-C": [[110, 135], [3.2, 5.0], [3.6, 4.5], [5, 6.5]], "I-D": [[80, 110], [2.7, 4.1], [1.8, 4.5], [4, 5]], "I-E": [[55, 80], [1.9, 3.6], [1.3, 2.7], [2.5, 4]] };
  function faixa1(P) { var f = String(P.faixa1 || "dner-es-394-99-I-C").replace("dner-es-394-99-", ""); return Q[f] ? f : "I-C"; }
  // limite = faixa de projeto (mín./máx. informados) ou, na falta, a faixa do quadro
  function lim(P, kMin, kMax, q, u, casas, nome) {
    var mn = num(P[kMin]), mx = num(P[kMax]), proj = ok(mn) && ok(mx);
    if (!proj && q && q[0] !== q[1]) { mn = q[0]; mx = q[1]; }
    if (!ok(mn) || !ok(mx)) return { min: NaN, max: NaN, txt: "faixa de projeto", falta: "informe a faixa de projeto de " + nome + " (o quadro de 5.1.3 dá um valor único)" };
    return { min: mn, max: mx, proj: (mn + mx) / 2, txt: fmt(mn, casas) + " a " + fmt(mx, casas) + " " + u + (proj ? " (projeto)" : " (quadro de 5.1.3)") };
  }
  var PL = function (i, o) {
    var p = [];
    if (o.lig) p.push({ k: "minL" + i, r: o.nome + " — ligante: mínimo de projeto (l/m²) — opcional", dica: "vazio = faixa do quadro de 5.1.3 para a faixa da 1ª camada" },
      { k: "maxL" + i, r: o.nome + " — ligante: máximo de projeto (l/m²) — opcional" });
    p.push({ k: "minA" + i, r: o.nome + " — agregado: mínimo de projeto (kg/m²)" + (o.obrigA ? "" : " — opcional"), dica: o.dicaA },
      { k: "maxA" + i, r: o.nome + " — agregado: máximo de projeto (kg/m²)" + (o.obrigA ? "" : " — opcional") });
    return p;
  };
  // seções de materiais e verificações com a numeração da 394
  var B = G4.tsBase("394");
  B.ligante.sec = "7.1.1";
  B.ligante.porCarg.sec = "7.1.1.2 a; 7.1.1.3 a";
  B.ligante.por100.sec = "7.1.1.3 b";
  B.ligante.por500.sec = "7.1.1.2 b; 7.1.1.3 c";
  B.agregados = { sec: "5.1.3; 7.1.2", itens: [
    { k: "if", secao: "5.1.3 b; 7.1.2 b", min: 0.5, minEstrito: true, exigido: "> 0,5", metodo: "DNER-ME 086", freq: { por: "volume", a_cada: 900, texto: "1 a cada 900 m³" } },
    { k: "ades", secao: "7.1.2 c; 5.1.2", min: 90, metodo: "DNER-ME 078 / 079 → DNIT 452", exigido: "satisfatória (5.1.2: senão, melhorador)", freq: { por: "carregamento", n: 1, texto: "1 por carregamento de ligante" } },
    { k: "la", secao: "5.1.3 a; 7.1.2 d", max: 40, metodo: "DNER-ME 035 → DNIT 451", freq: { por: "mes", n: 1, texto: "1 por mês ou com variação do material" } },
    { k: "dur", secao: "5.1.3 c", max: 12, exigido: "< 12 %", metodo: "DNER-ME 089", freq: { por: "caract" } },
  ] };
  B.verif = [
    { id: "clima", texto: "Execução sem chuva e com temperatura ambiente ≥ 10 °C", secao: "4.2" },
    { id: "cert", texto: "Certificado de análise do ligante em todo carregamento", secao: "4.3" },
    { id: "varr", texto: "Pista imprimada/pintada varrida; ligante não aplicado em superfície molhada", secao: "5.3.1.1; 5.3.1.5" },
    { id: "visc", texto: "Emulsão aplicada com viscosidade de 20 a 100 s SF; metade na 1ª aplicação", secao: "5.3.2.4; 5.3.2.5", se: function (P) { return P.ligante === "emu"; }, naoAplicaPor: "ligante é CAP polímero" },
    { id: "compr", texto: "Compressão dos bordos para o eixo, interrompida com sinais de esmagamento; juntas transversais com papel", secao: "5.3.1.3; 5.3.1.7", falha: "ressalva" },
    { id: "trafego", texto: "Tráfego controlado (10 km/h antes do fim da compressão; 40 km/h por 24 h) e varredura após 5 a 10 dias", secao: "5.3.1.9", falha: "ressalva" },
  ];
  var F = G4.ts(Object.assign(B, {
    id: ID, titulo: "Macadame por penetração com asfalto polímero — aceitação de lote", refs: REFS, tabelaK: G4.K_277,
    resumo: "Três camadas de agregado (faixa I, II-A e III-A) e duas aplicações de ligante: taxas por bandeja contra as quantidades do quadro de 5.1.3 (ou de projeto), granulometria de cada agregado, temperatura, espessura, acabamento e alinhamentos, recebimento do ligante e controle do agregado; aceitação estatística da 7.4.2 com a tabela de 7.2.4.",
    secTaxaL: "7.2.3", secTaxaA: "7.2.1", secK: "7.2.4", secMin: "7.2.4", secFaixa: "5.1.3 d", secGranFreq: "7.1.2 a", secGranAcc: "7.4.2", secRec: "5.1.4.4",
    secTemp: "7.2.2", secTempLim: "5.3.1.6",
    camadas: [
      { nome: "1ª camada", faixaPadrao: "dner-es-394-99-I-C", faixas: function (f) { return /^I-/.test(f.faixa); }, params: PL(1, { nome: "1ª camada", lig: true, dicaA: "vazio = quadro de 5.1.3 (faixa escolhida)" }),
        limites: function (P) { var q = Q[faixa1(P)]; return { lig: lim(P, "minL1", "maxL1", q[1], "l/m²", 1, "ligante da 1ª aplicação"), agr: lim(P, "minA1", "maxA1", q[0], "kg/m²", 0, "agregado da 1ª camada") }; } },
      { nome: "2ª camada", faixaPadrao: "dner-es-394-99-II-A", faixas: function (f) { return f.faixa === "II-A"; },
        params: PL(2, { nome: "2ª camada", lig: true, obrigA: true, dicaA: "quadro: 6 kg/m² (valor único) — informe a faixa de projeto" }),
        limites: function (P) { var q = Q[faixa1(P)]; return { lig: lim(P, "minL2", "maxL2", q[2], "l/m²", 1, "ligante da 2ª aplicação"), agr: lim(P, "minA2", "maxA2", [6, 6], "kg/m²", 1, "agregado da 2ª camada (II-A)") }; } },
      { nome: "3ª camada (bloqueio)", lig: false, faixaPadrao: "dner-es-394-99-III-A", faixas: function (f) { return f.faixa === "III-A"; },
        params: PL(3, { nome: "3ª camada", dicaA: "vazio = quadro de 5.1.3: 5 a 8 kg/m²" }),
        limites: function (P) { return { agr: lim(P, "minA3", "maxA3", [5, 8], "kg/m²", 1, "agregado da 3ª camada") }; } },
    ],
    geo: { esp: { tol: 0.10, sec: "7.3.3" }, alin: { tol: 5, sec: "7.3.2" }, regua: { max: 0.5, sec: "7.3.1" } },
    padrao: { faixa1: "dner-es-394-99-I-C" },
    extra: function (ctx) {
      var P = ctx.P, ep = num(P.espProj), q = Q[faixa1(P)];
      if (ok(ep) && (ep < q[3][0] - 1e-9 || ep > q[3][1] + 1e-9)) ctx.avisos.push("Espessura de projeto de " + fmt(ep, 1) + " cm fora da espessura compactada da faixa " + faixa1(P) + " (" + fmt(q[3][0], 1) + " a " + fmt(q[3][1], 1) + " cm, quadro de 5.1.3; 5.1.3.1).");
    },
    notas: "Critérios da DNER-ES 394/99 (7.4.2): taxas de agregado (7.2.1) e de ligante residual (7.2.3) de cada camada pelo controle estatístico X̄ − ks ≥ mín. e X̄ + ks ≤ máx., com os limites \"constantes dos quadros do item 5.1.3\" (faixas de quantidade da faixa escolhida) ou as faixas de projeto, quando informadas (5.1.4.4: valores exatos fixados no projeto); granulometria de cada agregado (curva de projeto ± 5 %, nº 200 ± 2 %); mínimo de 5 determinações por segmento de área < 3.000 m² (7.2.4; por camada, adotado); temperatura do CAP ≤ 180 °C (5.3.1.6); espessura ± 10 % (7.3.3), alinhamentos ± 5 cm (7.3.2) e réguas ≤ 0,5 cm (7.3.1); materiais conforme 5.1 (7.4.1).",
  }));
  // ajustes das seções de materiais da 394 (numeração própria)
  F.params.forEach(function (p) { if (p.k === "espProj") p.dica = "tolerância ± 10 % (7.3.3); espessura compactada da faixa no quadro de 5.1.3"; });

  // =====================================================================================
  // Exemplos (bandejas geradas em torno do alvo)
  // =====================================================================================
  var POS = [["LE", 1], ["eixo", -1.2], ["LD", 0.6], ["LE", -0.5], ["eixo", 1.3], ["LD", -0.9]];
  function tx(ini, alvoL, dl, alvoA, da, pref) {
    return POS.map(function (x, j) { return { est: String(ini + 2 * j), pos: x[0], reg: pref + "-" + (j + 1), lig: ok(alvoL) ? A.nstr(alvoL + x[1] * dl, 2) : "", agr: A.nstr(alvoA + x[1] * da, 1) }; });
  }
  function base(reg, data, ini, fim) {
    return { ident: { registro: reg, data: data, obra: "Obra C — BR-000", trecho: "Acostamento", local: "Est. " + ini + " a " + fim, camada: "Macadame betuminoso — CAP polímero, faixa I-C" },
      params: Object.assign({}, F.padrao, { estIni: String(ini), estFim: String(fim), largura: "2,50", jornadas: "1", polimero: "4", espProj: "6,0", volAgr: "40",
        minA2: "5,5", maxA2: "7,5" }),
      proj1: G4.tsProj("dner-es-394-99-I-C", [100, 97, 65, 35, 20, 7, 2, 1]), proj2: G4.tsProj("dner-es-394-99-II-A", [100, 95, 55, 7, 1]),
      proj3: G4.tsProj("dner-es-394-99-III-A", [100, 92, 20, 3]),
      lig: [{ reg: "NF-2210 · CAP polímero", tipo: "CAP polímero SBS", massa: "29,5", ensC: "S", ens500: "S", res: "aprovado" }],
      agr: [{ reg: "AG-01", data: data.split("-").reverse().join("/"), ades: "S", la: "31", if: "0,58", dur: "7" }],
      verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }] };
  }
  F.exemplos = [
    { nome: "Lote aceito — macadame faixa I-C com CAP polímero (quantidades do quadro de 5.1.3)", dados: function () {
      var d = base("LOTE-MPP-001", "2026-08-25", 900, 915);
      Object.assign(d, {
        tx1: tx(900, 4.1, 0.15, 122, 3.5, "BAND-1"), tx2: tx(901, 4.05, 0.12, 6.5, 0.25, "BAND-2"), tx3: tx(900, NaN, 0, 6.5, 0.4, "BAND-3"),
        gr1: G4.tsGran("dner-es-394-99-I-C", [["25/08", [100, 96.2, 66.8, 33.4, 21.6, 6.1, 1.8, 0.9]], ["25/08", [100, 97.8, 63.5, 36.2, 18.9, 7.8, 2.4, 1.2]]], "GR-1"),
        gr2: G4.tsGran("dner-es-394-99-II-A", [["25/08", [100, 94.1, 56.9, 6.2, 0.8]], ["25/08", [100, 96.3, 53.4, 8.1, 1.3]]], "GR-2"),
        gr3: G4.tsGran("dner-es-394-99-III-A", [["25/08", [100, 91.2, 21.4, 2.6]], ["25/08", [100, 93.5, 18.8, 3.4]]], "GR-3"),
        temp: [{ pos: "1ª aplicação 08h20", reg: "T-1", v: "163" }, { pos: "2ª aplicação 10h45", reg: "T-2", v: "165" }],
        geo: G4.tsGeo(900, 16, [0.9, -1.3, 1.7, -0.6], [0.2, 0.3, 0.4]).map(function (g, j) { g.esp = A.nstr([6.2, 5.9, 6.1, 6.4, 5.8, 6.0, 6.3, 5.7][j % 8], 1); return g; }),
        obs: "Exemplo com valores digitados; limites das taxas de ligante e da 1ª e 3ª camadas de agregado tomados do quadro de 5.1.3 (faixa I-C); 2ª camada (II-A) com faixa de projeto 5,5 a 7,5 kg/m²." });
      return d;
    } },
    { nome: "Lote rejeitado — 1ª aplicação de ligante acima do quadro, espessura baixa, faixa de projeto da II-A não informada", dados: function () {
      var d = base("LOTE-MPP-002", "2026-08-29", 920, 935);
      d.params.minA2 = ""; d.params.maxA2 = "";
      Object.assign(d, {
        tx1: tx(920, 4.85, 0.15, 124, 3, "BAND-1"), tx2: tx(921, 4.0, 0.12, 6.3, 0.25, "BAND-2"), tx3: tx(920, NaN, 0, 6.2, 0.4, "BAND-3"),
        gr1: G4.tsGran("dner-es-394-99-I-C", [["29/08", [100, 96.8, 64.9, 34.8, 20.4, 6.6, 2.1, 1.0]], ["29/08", [100, 97.4, 65.8, 35.9, 19.7, 7.2, 1.9, 1.1]]], "GR-1"),
        gr2: G4.tsGran("dner-es-394-99-II-A", [["29/08", [100, 95.2, 54.6, 7.4, 1.0]]], "GR-2"),
        gr3: G4.tsGran("dner-es-394-99-III-A", [["29/08", [100, 92.4, 20.2, 3.1]]], "GR-3"),
        temp: [{ pos: "1ª aplicação", reg: "T-1", v: "171" }, { pos: "2ª aplicação", reg: "T-2", v: "168" }],
        geo: G4.tsGeo(920, 16, [1.1, -0.8, 2.0], [0.3, 0.2, 0.4]).map(function (g, j) { g.esp = A.nstr([5.2, 5.4, 5.0, 5.6, 5.3, 5.1][j % 6], 1); return g; }),
        obs: "Exemplo de reprovação: taxa da 1ª aplicação de ligante com X̄ + ks > 5,0 l/m² (quadro, faixa I-C), espessura média 5,3 cm (< 5,4 cm), faixa de projeto do agregado II-A não informada (pendente) e granulometrias da 2ª e 3ª camadas abaixo da frequência." });
      return d;
    } },
  ];
})();
