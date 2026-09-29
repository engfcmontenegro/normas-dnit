/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 138/2010-ES — Reforço do subleito (motor comum FE.aceitacaoG1, em es-dnit-137-2010-es.js).
 *   5.1 (p. 2)  IG ≤ IG do subleito do projeto (b); ISC ≥ o do projeto e expansão ≤ 1 % (c) — o caput de 5.1 diz ≤ 2 % (DNIT 108):
 *               adotado 1 % (alínea c, específica); compactação na energia do Método B ou maior.
 *   5.3 b (p. 3) camadas entre 10 e 20 cm.
 *   7.1 (p. 3)  caracterização e compactação: 1 por camada a cada 200 m ou jornada (400 m); ISC/expansão a cada 400 m ou
 *               jornada (800 m); área ≤ 4.000 m² → mín. 5 amostras.
 *   7.2 (p. 4)  umidade a cada 100 m (h ót ± 2 %); GC a cada 100 m (≤ 4.000 m² → mín. 5), GC ≥ 100 %.
 *   7.3 (p. 4)  largura ± 10 cm; flecha até +20 % (sem falta); espessura ± 10 %.
 *   7.5 (p. 4–5) X̄ ∓ k·s — k sem tabela na ES: DNER-PRO 277/97, Tabela 1.   8: medição em m³.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex;
  var nSimples = function (d) { return (d.params || {}).secaoT !== "simples"; };
  var F = G1.criar({
    id: "dnit-138-2010-es",
    titulo: "Reforço do subleito — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência (7.1, 7.2) e aplica os critérios da ES: IG ≤ IG do subleito, " +
      "ISC ≥ o de projeto, expansão ≤ 1 %, umidade h ót ± 2 %, GC ≥ 100 % e controle geométrico (largura ± 10 cm, flecha até +20 %, espessura ± 10 %), " +
      "com o controle estatístico da 7.5.",
    refs: { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "DNER-PRO 277/97, Tabela 1" },
    tabelaK: G1.K_PRO277, tabelaNome: "DNER-PRO 277/97, Tabela 1 (a ES não traz a tabela; 7.4 remete à PRO 277)",
    homog: true, medicao: "volume", secMedicao: "8 a, b, c", espLim: [10, 20],
    espLimTxt: "a espessura mínima de qualquer camada é 10 cm; acima de 20 cm, subdividir em camadas parciais (5.3 b).",
    params: [
      { k: "igSub", r: "IG do subleito indicado no projeto (5.1 b)" },
      { k: "iscProj", r: "ISC mínimo indicado no projeto (%) (5.1 c)" },
      { k: "secaoT", r: "Seção transversal", tipo: "select", opcoes: [["abaul", "Abaulamento — flecha (7.3 b)"], ["simples", "Caimento simples (a ES só fixa a flecha)"]] },
      { k: "flechaProj", r: "Flecha de abaulamento de projeto (cm)", se: nSimples },
    ],
    padrao: { homog: "nao", jornadas: "1", secaoT: "abaul", espGeo: "20" },
    blocos: {
      umid: { secao: "7.2 a", dica: "por camada, a cada 100 m; h ót ± 2 %" },
      comp: { titulo: "Compactação, ISC e expansão", secao: "5.1 c; 7.1 b, c", campos: ["isc", "exp"], dica: "Método B ou maior; ISC ≥ projeto; expansão ≤ 1 %" },
      gc: { secao: "7.2 b, c" },
      carac: { titulo: "Caracterização do material", secao: "5.1 b; 7.1 a", campos: ["p200", "ll", "ip", "ig"], dica: "IG calculado de p200, LL e IP (ou digitado)" },
      geo: { secao: "7.3", larg: 0.10, esp: true, flecha: true, dica: "largura ± 10 cm; espessura ± 10 %; flecha até +20 % (sem falta)" },
    },
    criterioTxt: "DNIT 138/2010-ES, 7.5 — controle estatístico com a Tabela 1 da DNER-PRO 277/97",
    notas: "DNIT 138/2010-ES. Métodos citados e substituídos: DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; DNER-ME 080 → DNIT 412; DNER-ME 052/088 → DNIT 456; " +
      "DNER-ME 092 → DNIT 458. Expansão ≤ 1 % (5.1 c; o caput de 5.1 cita ≤ 2 % da DNIT 108). IG pela classificação TRB.",
    criterios: function (c, H) {
      var P = c.P;
      H.freq({ ensaio: "Caracterização (granulometria, LL, LP)", metodo: "DNIT 412 / DNER-ME 122 / 082", a_cada: 200, a_cadaH: 400, jornada: true, min5area: true, secao: "7.1 a, e",
        realizado: H.conta("carac", ["p200", "ll", "ip", "ig"]) });
      H.freq({ ensaio: "Compactação (γs,máx e h ót)", metodo: "DNIT 164, Método B ou maior", a_cada: 200, a_cadaH: 400, jornada: true, min5area: true, secao: "7.1 b, e",
        realizado: H.conta("comp", ["gs"]) });
      H.freq({ ensaio: "ISC e expansão", metodo: "DNIT 172", a_cada: 400, a_cadaH: 800, jornada: true, min5area: true, secao: "7.1 c, e", realizado: H.conta("comp", ["isc", "exp"]) });
      H.freq({ ensaio: "Umidade antes da compactação", metodo: "DNIT 456", a_cada: 100, secao: "7.2 a", realizado: H.conta("umid", ["w"]) });
      H.freq({ ensaio: "Grau de compactação", metodo: "DNIT 458 / DNER-ME 036", a_cada: 100, min5area: true, secao: "7.2 b", realizado: H.conta("gc", ["gc"]) });
      H.av({ id: "umid", criterio: "Umidade antes da compactação: Δw = w − h ót", secao: "7.2 a", unid: "p.p.", casas: 1, min: -2, max: 2, graf: true,
        exigido: "h ót ± 2 (Δw de −2,0 a +2,0)", pontos: H.pts("umid", function (x, i) { return c.tab.umid[i].dw; }, { rot: "det." }) });
      H.av({ id: "gc", criterio: "Grau de compactação", secao: "7.2 c", unid: "%", casas: 1, min: 100, tab: "gc", campo: "gc", rot: "furo", graf: true });
      var iscP = num(P.iscProj);
      var li = H.av({ id: "isc", criterio: "ISC", secao: "5.1 c", unid: "%", casas: 0, min: iscP, tab: "comp", campo: "isc", exigido: ok(iscP) ? "≥ " + fmt(iscP, 0) + " % (projeto)" : "≥ ISC do projeto" });
      if (!ok(iscP) && li.n) A.marcar(li, "pendente", "informe o ISC mínimo do projeto");
      H.av({ id: "exp", criterio: "Expansão", secao: "5.1 c", unid: "%", casas: 2, max: 1, tab: "comp", campo: "exp" });
      var igS = num(P.igSub);
      var lg = H.av({ id: "ig", criterio: "Índice de grupo", secao: "5.1 b", unid: "", casas: 0, max: igS, exigido: ok(igS) ? "≤ " + fmt(igS, 0) + " (IG do subleito)" : "≤ IG do subleito do projeto",
        pontos: H.pts("carac", function (x, i) { return c.tab.carac[i].igA; }) });
      if (!ok(igS) && lg.n) A.marcar(lg, "pendente", "informe o IG do subleito indicado no projeto");
      H.geo();
    },
  });

  F.exemplos = [
    { nome: "Lote aceito — reforço de 20 cm, 600 m (dados de campo e laboratório digitados)", dados: function () {
      var d = { ident: { registro: "LOTE-RF-001", data: "2026-07-22", obra: "Obra A — BR-000", trecho: "Lote 3", local: "Est. 100 a 130", camada: "Reforço do subleito", origem: "Jazida 2" },
        params: Object.assign({}, F.padrao, { estIni: "100", estFim: "130", largura: "11,00", espessura: "20", igSub: "12", iscProj: "8", flechaProj: "11", jornadas: "3" }), obs: "" };
      d.comp = [[103, "1,742", "17,2", "14", "0,52"], [110, "1,751", "16,8", "12", "0,61"], [117, "1,738", "17,5", "15", "0,48"], [126, "1,746", "17,0", "13", "0,70"]]
        .map(function (x, i) { return { est: String(x[0]), reg: "CP-" + (301 + i), gs: x[1], hot: x[2], isc: x[3], exp: x[4] }; });
      d.carac = [[103, 44, 34, 11], [110, 47, 36, 12], [117, 42, 33, 10], [126, 46, 35, 12]].map(function (x, i) {
        return { est: String(x[0]), reg: "CAR-" + (301 + i), p200: String(x[1]), ll: String(x[2]), ip: String(x[3]) }; });
      d.umid = X.colunas([[101, 16.4], [105, 18.1], [109, 17.9], [114, 16.2], [118, 17.6], [122, 18.4], [127, 16.9]], "w", "Campo — Speedy");
      d.gc = [[101, "LE", 101.2], [105, "eixo", 100.7], [109, "LD", 102.0], [113, "LE", 100.9], [118, "eixo", 101.6], [122, "LD", 100.4], [127, "eixo", 101.9]]
        .map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1) }; });
      d.geo = X.secoes(100, 31, function (i) { return { larg: 11.03 + X.onda(i, 0.05), esp: 20.4 + X.onda(i, 1.2), flecha: 11.8 + X.onda(i, 0.7) }; });
      d.obs = "Exemplo gerado: 4 amostras de compactação/ISC (3 jornadas; 600 m / 200 m = 3), IG calculado de p200, LL e IP (IG = 0 a 3).";
      return d;
    } },
    { nome: "Lote rejeitado — expansão acima de 1 % (ISC importado do exemplo ME), GC e espessura baixos", dados: function () {
      var d = { ident: { registro: "LOTE-RF-002", data: "2026-08-05", obra: "Obra B — BR-000", trecho: "Lote 4", local: "Est. 40 a 55", camada: "Reforço do subleito", origem: "Corte km 12" },
        params: Object.assign({}, F.padrao, { estIni: "40", estFim: "55", largura: "10,50", espessura: "15", igSub: "16", iscProj: "10", flechaProj: "10" }), obs: "" };
      X.importar(F, d, "imp_comp", [["dnit-172-2016-me", 1]]);
      d.comp[0].est = "44";
      d.comp.push({ est: "51", reg: "CP-0412 (digitado)", gs: "1,598", hot: "22,4", isc: "12", exp: "0,94" });
      d.carac = [{ est: "44", reg: "CAR-411", p200: "81", ll: "58", ip: "27" }, { est: "51", reg: "CAR-412", p200: "76", ll: "55", ip: "25" }];
      d.umid = X.colunas([[41, 21.0], [45, 23.1], [49, 22.6], [53, 20.9]], "w", "Campo — Speedy");
      d.gc = [[41, "LD", 100.2], [44, "eixo", 98.8], [47, "LE", 99.6], [50, "LD", 100.8], [54, "eixo", 99.1]]
        .map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1) }; });
      d.geo = X.secoes(40, 16, function (i) { return { larg: 10.52 + X.onda(i, 0.05), esp: 13.8 + X.onda(i, 1.0), flecha: 10.9 + X.onda(i, 0.6) }; });
      d.obs = "Exemplo de reprovação: ISC/expansão da amostra da estaca 44 importados do exemplo DNIT 172 (subleito argiloso, expansão 1,03 %); GC com X̄ − k·s < 100 %; espessura média 13,8 cm para 15 cm de projeto; IG 17 e 18 > IG do subleito (16).";
      return d;
    } },
  ];
})();
