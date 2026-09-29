/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 139/2010-ES — Sub-base estabilizada granulometricamente (motor FE.aceitacaoG1).
 *   5.1 b, c (p. 2) IG = 0; ISC ≥ 20 %; expansão ≤ 1 % (Método B ou maior).
 *   5.1 d (p. 3)   solos lateríticos: IG ≠ 0 e expansão > 1 % admitidos se a expansibilidade (DNER-ME 029 → DNIT 160) < 10 %.
 *   5.3 d (p. 3–4) umidade para início da compactação: −2 a +1 p.p. da ótima; 7.2 a (p. 5): ± 2 p.p. → aplica-se a
 *                  interseção (−2 a +1), que atende às duas seções.
 *   5.3 f (p. 4)   camada compactada de 10 a 20 cm.
 *   7.1 (p. 5)     caracterização e compactação 1 por camada a cada 200 m ou jornada (400 m); ISC/expansão a cada 400 m
 *                  (800 m); área ≤ 4.000 m² → mín. 5.
 *   7.2 (p. 5)     umidade e GC a cada 100 m (≤ 4.000 m² → mín. 5 GC); GC ≥ 100 %.
 *   7.3 (p. 5–6)   largura ± 10 cm; flecha até +20 % (sem falta); espessura ± 10 %.   7.5 (p. 6): estatística; k: DNER-PRO 277/97.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex;
  var nSimples = function (d) { return (d.params || {}).secaoT !== "simples"; };
  var F = G1.criar({
    id: "dnit-139-2010-es",
    titulo: "Sub-base estabilizada granulometricamente — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência (7.1, 7.2) e aplica os critérios da ES: IG = 0, ISC ≥ 20 %, " +
      "expansão ≤ 1 % (com a exceção dos solos lateríticos, 5.1 d), umidade de −2 a +1 p.p. da ótima (5.3 d e 7.2 a), GC ≥ 100 % e controle geométrico, " +
      "com o controle estatístico da 7.5.",
    refs: { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "DNER-PRO 277/97, Tabela 1" },
    tabelaK: G1.K_PRO277, tabelaNome: "DNER-PRO 277/97, Tabela 1 (a ES não traz a tabela; 7.4 remete à PRO 277)",
    homog: true, medicao: "volume", secMedicao: "8 a, b, c", espLim: [10, 20],
    espLimTxt: "a camada compactada deve ter de 10 a 20 cm; acima de 20 cm, subdividir (5.3 f).",
    params: [
      { k: "lateritico", r: "Solo laterítico? (5.1 d)", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim — IG ≠ 0 e expansão > 1 % admitidos com expansibilidade < 10 %"]] },
      { k: "secaoT", r: "Seção transversal", tipo: "select", opcoes: [["abaul", "Abaulamento — flecha (7.3 b)"], ["simples", "Caimento simples (a ES só fixa a flecha)"]] },
      { k: "flechaProj", r: "Flecha de abaulamento de projeto (cm)", se: nSimples },
    ],
    padrao: { homog: "nao", jornadas: "1", lateritico: "nao", secaoT: "abaul", espGeo: "20" },
    blocos: {
      umid: { secao: "5.3 d; 7.2 a", dica: "por camada, a cada 100 m; −2 a +1 p.p. da ótima (5.3 d) — 7.2 a admite ± 2" },
      comp: { titulo: "Compactação, ISC, expansão e expansibilidade", secao: "5.1 c, d; 7.1 b, d", campos: ["isc", "exp", "expb"],
        dica: "expansibilidade só para solos lateríticos (5.1 d)" },
      gc: { secao: "7.2 b, c" },
      carac: { titulo: "Caracterização do material", secao: "5.1 b; 7.1 a", campos: ["p200", "ll", "ip", "ig"], dica: "IG = 0; calculado de p200, LL e IP (ou digitado)" },
      geo: { secao: "7.3", larg: 0.10, esp: true, flecha: true },
    },
    criterioTxt: "DNIT 139/2010-ES, 7.5 — controle estatístico com a Tabela 1 da DNER-PRO 277/97",
    notas: "DNIT 139/2010-ES. Métodos citados e substituídos: DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; DNER-ME 029 → DNIT 160; DNER-ME 080 → DNIT 412; " +
      "DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458. Umidade: interseção de 5.3 d (−2/+1) e 7.2 a (± 2). IG pela classificação TRB.",
    criterios: function (c, H) {
      var P = c.P, lat = P.lateritico === "sim";
      H.freq({ ensaio: "Caracterização (granulometria, LL, LP)", metodo: "DNIT 412 / DNER-ME 122 / 082", a_cada: 200, a_cadaH: 400, jornada: true, min5area: true, secao: "7.1 a, f",
        realizado: H.conta("carac", ["p200", "ll", "ip", "ig"]) });
      H.freq({ ensaio: "Compactação (γs,máx e h ót)", metodo: "DNIT 164, Método B ou maior", a_cada: 200, a_cadaH: 400, jornada: true, min5area: true, secao: "7.1 b, f",
        realizado: H.conta("comp", ["gs"]) });
      H.freq({ ensaio: "ISC e expansão", metodo: "DNIT 172", a_cada: 400, a_cadaH: 800, min5area: true, secao: "7.1 d, f", realizado: H.conta("comp", ["isc", "exp"]) });
      H.freq({ ensaio: "Umidade antes da compactação", metodo: "DNIT 456", a_cada: 100, secao: "7.2 a", realizado: H.conta("umid", ["w"]) });
      H.freq({ ensaio: "Grau de compactação", metodo: "DNIT 458 / DNER-ME 036", a_cada: 100, min5area: true, secao: "7.2 b", realizado: H.conta("gc", ["gc"]) });
      H.av({ id: "umid", criterio: "Umidade antes da compactação: Δw = w − h ót", secao: "5.3 d / 7.2 a", unid: "p.p.", casas: 1, min: -2, max: 1, graf: true,
        exigido: "−2 a +1 p.p. da h ót", pontos: H.pts("umid", function (x, i) { return c.tab.umid[i].dw; }, { rot: "det." }) });
      H.av({ id: "gc", criterio: "Grau de compactação", secao: "7.2 c", unid: "%", casas: 1, min: 100, tab: "gc", campo: "gc", rot: "furo", graf: true });
      H.av({ id: "isc", criterio: "ISC", secao: "5.1 c", unid: "%", casas: 0, min: 20, tab: "comp", campo: "isc" });
      // expansibilidade: < 10 % em todas as amostras com ela determinada
      var eb = H.pts("comp", "expb");
      var expbOk = eb.length > 0 && eb.every(function (p) { return p.v < 10; });
      var le = H.av({ id: "exp", criterio: "Expansão", secao: "5.1 c, d", unid: "%", casas: 2, max: 1, tab: "comp", campo: "exp" });
      var lg = H.av({ id: "ig", criterio: "Índice de grupo", secao: "5.1 b, d", unid: "", casas: 0, max: 0, individual: true, exigido: "= 0",
        pontos: H.pts("carac", function (x, i) { return c.tab.carac[i].igA; }) });
      if (lat) {
        var le2 = H.av({ id: "expb", criterio: "Expansibilidade (solo laterítico)", secao: "5.1 d", unid: "%", casas: 0, max: 10 - 1e-6, exigido: "< 10 %", individual: true, pontos: eb });
        [le, lg].forEach(function (l) {
          if (l.situacao !== "nao_conforme" && l.situacao !== "ressalva") return;
          if (expbOk) { l.situacao = "conforme"; l.motivos = []; l.motivo = "acima do limite, admitido para solo laterítico com expansibilidade < 10 % (5.1 d): " + l.motivo; }
          else if (!eb.length) { l.situacao = "pendente"; l.motivo = "solo laterítico: acima do limite; determine a expansibilidade (< 10 % admite o valor, 5.1 d) — " + l.motivo; l.motivos = [{ situacao: "pendente", texto: l.motivo }]; }
        });
        if (!eb.length && le2.situacao === "sem_dados") { le2.situacao = "nao_exigido"; le2.motivo = "só exigida se IG ≠ 0 ou expansão > 1 %"; }
      }
      H.geo();
    },
  });

  F.exemplos = [
    { nome: "Lote aceito — sub-base de cascalho, 500 m (dados de laboratório e campo digitados)", dados: function () {
      var d = { ident: { registro: "LOTE-SB-001", data: "2026-06-30", obra: "Obra A — BR-000", trecho: "Lote 5", local: "Est. 200 a 225", camada: "Sub-base granular", origem: "Jazida 3" },
        params: Object.assign({}, F.padrao, { estIni: "200", estFim: "225", largura: "9,00", espessura: "18", flechaProj: "9", jornadas: "2" }), obs: "" };
      d.comp = [[203, "2,051", "9,8", "38", "0,21"], [211, "2,064", "9,4", "42", "0,18"], [219, "2,047", "10,1", "35", "0,25"]]
        .map(function (x, i) { return { est: String(x[0]), reg: "CP-" + (501 + i), gs: x[1], hot: x[2], isc: x[3], exp: x[4] }; });
      d.carac = [[203, 24, 26, 7], [211, 21, 24, 6], [219, 27, 28, 8]].map(function (x, i) { return { est: String(x[0]), reg: "CAR-" + (501 + i), p200: String(x[1]), ll: String(x[2]), ip: String(x[3]) }; });
      d.umid = X.colunas([[201, 8.6], [205, 10.2], [210, 9.1], [214, 10.4], [218, 8.9], [223, 9.8]], "w", "Campo — Speedy");
      d.gc = [[201, "LD", 100.9], [205, "eixo", 101.8], [208, "LE", 100.6], [212, "LD", 102.2], [216, "eixo", 101.1], [220, "LE", 100.8], [224, "eixo", 101.5]]
        .map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1) }; });
      d.geo = X.secoes(200, 26, function (i) { return { larg: 9.04 + X.onda(i, 0.05), esp: 18.3 + X.onda(i, 1.0), flecha: 9.8 + X.onda(i, 0.6) }; });
      d.obs = "Exemplo gerado: IG = 0 nas três amostras (p200 ≤ 35 %); Δw entre −0,6 e +0,8 p.p.";
      return d;
    } },
    { nome: "Lote com ressalva — solo laterítico com IG ≠ 0 e expansão > 1 % admitidos (expansibilidade importada), um valor de umidade acima de +1 p.p.", dados: function () {
      var d = { ident: { registro: "LOTE-SB-002", data: "2026-07-14", obra: "Obra C — Rua A", trecho: "Segmento único", local: "Est. 0 a 20", camada: "Sub-base — solo laterítico", origem: "Jazida 1" },
        params: Object.assign({}, F.padrao, { estIni: "0", estFim: "20", largura: "8,00", espessura: "15", flechaProj: "8", lateritico: "sim", jornadas: "2" }), obs: "" };
      X.importar(F, d, "imp_comp", [["dnit-160-2012-me", 1]]);
      d.comp[0].est = "4"; d.comp[0].gs = "1,948"; d.comp[0].hot = "12,6"; d.comp[0].isc = "31"; d.comp[0].exp = "1,18";
      d.comp = d.comp.concat([[9, "1,955", "12,3", "34", "0,86", "3"], [13, "1,941", "12,9", "29", "1,05", "4"], [16, "1,950", "12,5", "33", "0,92", "2"], [19, "1,946", "12,7", "30", "0,97", "3"]]
        .map(function (x, i) { return { est: String(x[0]), reg: "CP-" + (611 + i), gs: x[1], hot: x[2], isc: x[3], exp: x[4], expb: x[5] }; }));
      d.carac = [[4, 38, 32, 11], [9, 36, 30, 9], [13, 40, 33, 12], [16, 37, 31, 10], [19, 39, 32, 11]].map(function (x, i) {
        return { est: String(x[0]), reg: "CAR-" + (611 + i), p200: String(x[1]), ll: String(x[2]), ip: String(x[3]) }; });
      d.umid = X.colunas([[1, 11.6], [5, 12.4], [9, 12.2], [12, 11.9], [16, 12.5], [19, 13.7]], "w", "Campo — Speedy");
      d.gc = [[1, "LE", 101.4], [4, "eixo", 100.8], [7, "LD", 101.9], [11, "LE", 100.6], [14, "eixo", 101.2], [18, "LD", 100.9]]
        .map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1) }; });
      d.geo = X.secoes(0, 21, function (i) { return { larg: 8.03 + X.onda(i, 0.05), esp: 15.3 + X.onda(i, 0.9), flecha: 8.8 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo: expansibilidade da estaca 4 importada do exemplo DNIT 160 (2 %); solo laterítico com IG 1 e expansão até 1,18 %, admitidos por 5.1 d. " +
        "Umidade 1,1 p.p. acima da ótima na estaca 19 (fora de −2/+1 da 5.3 d): corrigir o local.";
      return d;
    } },
  ];
})();
