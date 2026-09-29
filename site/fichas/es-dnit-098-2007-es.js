/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 098/2007-ES — Base estabilizada granulometricamente com solo laterítico
 * (motor FE.aceitacaoG1, em es-dnit-137-2010-es.js).
 *   5.1 (p. 2)   S/R (Kr, DNER-ME 030) < 2; expansão no ISC < 0,2 %, admitida até 0,5 % com expansibilidade (DNER-ME 029 →
 *                DNIT 160) < 10 %.
 *   5.3 (p. 3–4) ISC ≥ 60 % (N ≤ 5×10⁶) ou ≥ 80 % (N > 5×10⁶); LL ≤ 40 %, IP ≤ 15 %; LA ≤ 65 % (dispensável com desempenho
 *                anterior satisfatório, i); faixa A ou B do Quadro + tolerâncias da curva de projeto (± 7 / ± 5 / ± 2);
 *                EA > 30 %; passante nº 200 ≤ 2/3 do passante nº 40.
 *   5.5 (p. 4)   espessura mín. 10 cm, camadas ≤ 20 cm; GC ≥ 100 %.
 *   7.1 (p. 5)   caracterização, compactação e ISC: 1 por camada a cada 300 m ou jornada de 8 h (1.000 m, homogêneos);
 *                nº de ensaios pela Tabela de Amostragem Variável (7.1.3; n ≥ 5).
 *   7.2 (p. 5)   umidade a cada 100 m (± 2 % da ótima); GC a cada 100 m (< 4.000 m² → mín. 5; Nota 2: tabela).
 *   7.3 (p. 6)   largura ± 10 cm; flecha até +20 % (sem falta); espessura ± 10 %.
 *   7.4 (p. 6)   aceitação: LL/IP conforme 5.3 (valores individuais); expansão sempre ≤ 0,5 %; granulometria: X̄ ± k·s na
 *                faixa (7.4.3); ISC e GC: X̄ − k·s ≥ mínimo (7.4.4). Umidade (7.2.1): tolerância de execução — fora dela,
 *                ressalva (não é critério da 7.4).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex, kPen = G1.kPen;
  var nSimples = function (d) { return (d.params || {}).secaoT !== "simples"; };
  var PEN = [[50.8, "2\"", 7], [25.4, "1\"", 7], [9.5, "3/8\"", 7], [4.8, "nº 4", 5], [2.0, "nº 10", 5], [0.42, "nº 40", 5], [0.075, "nº 200", 2]];
  var F = G1.criar({
    id: "dnit-098-2007-es",
    titulo: "Base de solo laterítico — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência (7.1, 7.2) e aplica os critérios de aceitação da 7.4 e as " +
      "características de 5.1/5.3: ISC ≥ 60/80 %, expansão ≤ 0,5 % (0,2 % sem expansibilidade < 10 %), LL ≤ 40 %, IP ≤ 15 %, EA > 30 %, S/R < 2, " +
      "Los Angeles ≤ 65 %, granulometria na faixa A/B com as tolerâncias do projeto, GC ≥ 100 % e controle geométrico.",
    refs: { reprova: "7.4", atende: "7.4", corrige: "7.4 Nota 1", regra: "7.4", tabela: "Tabela de Amostragem Variável (7.1.3)" },
    tabelaNome: "Tabela de Amostragem Variável da ES (7.1.3, p. 5)",
    homog: true, medicao: "volume", secMedicao: "8 a, b", espLim: [10, 20],
    espLimTxt: "espessura mínima de 10 cm; acima de 20 cm, subdividir em camadas de no máximo 20 cm (5.5).",
    params: [
      { k: "nN", r: "Número N de projeto (5.3 a)", tipo: "select", opcoes: [["gt5", "N > 5 × 10⁶ — ISC ≥ 80 %"], ["le5", "N ≤ 5 × 10⁶ — ISC ≥ 60 %"]] },
      { k: "faixa", r: "Faixa granulométrica (5.3 f)", tipo: "select", opcoes: [["dnit-098-2007-es-A", "Faixa A"], ["dnit-098-2007-es-B", "Faixa B"]] },
      { k: "laDisp", r: "Los Angeles (5.3 i)", tipo: "select", opcoes: [["nao", "Exigido — desgaste ≤ 65 %"], ["sim", "Dispensado — desempenho anterior satisfatório comprovado"]] },
      { k: "secaoT", r: "Seção transversal", tipo: "select", opcoes: [["abaul", "Abaulamento — flecha (7.3 b)"], ["simples", "Caimento simples (a ES só fixa a flecha)"]] },
      { k: "flechaProj", r: "Flecha de abaulamento de projeto (cm)", se: nSimples },
    ],
    padrao: { homog: "nao", jornadas: "1", nN: "gt5", faixa: "dnit-098-2007-es-A", laDisp: "nao", secaoT: "abaul", espGeo: "20" },
    blocos: {
      umid: { secao: "7.2.1", dica: "por camada, a cada 100 m; ± 2 % em torno da ótima" },
      comp: { titulo: "Compactação, ISC, expansão e expansibilidade", secao: "5.1; 5.3 a; 7.1.2, 7.1.3", campos: ["isc", "exp", "expb"],
        dica: "DNER-ME 129 Método C (→ DNIT 164) e ISC (→ DNIT 172); expansibilidade quando a expansão ≥ 0,2 %" },
      gc: { secao: "5.5; 7.2.2" },
      carac: { titulo: "Caracterização: LL, IP, EA, S/R e Los Angeles", secao: "5.1; 5.3; 7.1.1", campos: ["ll", "ip", "ea", "sr", "la"] },
      gran: [{ chave: "gran", titulo: "Granulometria da base", nome: "Granulometria na faixa (X̄ ± k·s)", secao: "5.3 f; 7.4.3", pen: PEN,
        faixa: function (P) { return P.faixa; }, dica: "também verifica p200 ≤ 2/3 de p40 (5.3 h)" }],
      geo: { secao: "7.3", larg: 0.10, esp: true, flecha: true },
    },
    criterioTxt: "DNIT 098/2007-ES, 7.4 — controle estatístico com a Tabela de Amostragem Variável (7.1.3)",
    notas: "DNIT 098/2007-ES. Métodos citados e substituídos: DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; DNER-ME 029 → DNIT 160; DNER-ME 054 → DNIT 450; " +
      "DNER-ME 035 → DNIT 451; DNER-ME 080 → DNIT 412; DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458. Tolerância da peneira de 2\" (não listada no quadro de " +
      "tolerâncias): ± 7 adotado. A nº 10 é tomada como 2,0 mm (a ES escreve 2,09). S/R = Kr da DNER-ME 030.",
    criterios: function (c, H) {
      var P = c.P, d = c.d;
      var fr = { a_cada: 300, a_cadaH: 1000, jornada: true, minimo: 5 };
      H.freq(Object.assign({ ensaio: "Caracterização (granulometria, LL, LP, EA)", metodo: "DNIT 412 / DNER-ME 122 / 082 / DNIT 450", secao: "7.1.1, 7.1.3",
        realizado: Math.max(H.conta("gran", PEN.map(function (p) { return kPen(p[0]); })), 0) }, fr));
      H.freq(Object.assign({ ensaio: "Compactação (γs,máx e h ót)", metodo: "DNIT 164, Método C", secao: "7.1.2", realizado: H.conta("comp", ["gs"]) }, fr));
      H.freq(Object.assign({ ensaio: "ISC e expansão", metodo: "DNIT 172", secao: "7.1.3", realizado: H.conta("comp", ["isc", "exp"]) }, fr));
      H.freq({ ensaio: "LL e IP", metodo: "DNER-ME 122 / 082", a_cada: 300, a_cadaH: 1000, jornada: true, secao: "7.1.1", realizado: Math.min(H.conta("carac", ["ll"]), H.conta("carac", ["ip"])) });
      H.freq({ ensaio: "Relação S/R", metodo: "DNER-ME 030", por: "lote", regra: "caracterização (5.1) — mín. 1 por lote (adotado)", realizado: H.conta("carac", ["sr"]) });
      H.freq({ ensaio: "Abrasão Los Angeles", metodo: "DNIT 451", por: "lote", regra: "caracterização (5.3 e, i) — mín. 1 por lote (adotado)", realizado: H.conta("carac", ["la"]),
        aplica: P.laDisp !== "sim" });
      H.freq({ ensaio: "Umidade antes da compactação", metodo: "DNIT 456", a_cada: 100, secao: "7.2.1", realizado: H.conta("umid", ["w"]) });
      H.freq({ ensaio: "Grau de compactação", metodo: "DNIT 458 / DNER-ME 036", a_cada: 100, minimo: 5, secao: "7.2.2, Nota 2", realizado: H.conta("gc", ["gc"]) });
      // execução
      H.av({ id: "umid", criterio: "Umidade antes da compactação: Δw = w − h ót", secao: "7.2.1", unid: "p.p.", casas: 1, min: -2, max: 2, individual: true, falha: "ressalva", graf: true,
        exigido: "h ót ± 2 (tolerância de execução)", pontos: H.pts("umid", function (x, i) { return c.tab.umid[i].dw; }, { rot: "det." }) });
      H.av({ id: "gc", criterio: "Grau de compactação", secao: "5.5; 7.4.4", unid: "%", casas: 1, min: 100, tab: "gc", campo: "gc", rot: "furo", graf: true });
      var iscMin = P.nN === "le5" ? 60 : 80;
      H.av({ id: "isc", criterio: "ISC (N " + (P.nN === "le5" ? "≤" : ">") + " 5 × 10⁶)", secao: "5.3 a; 7.4.4", unid: "%", casas: 0, min: iscMin, tab: "comp", campo: "isc" });
      H.av({ id: "exp", criterio: "Expansão no ISC", secao: "5.1; 7.4.2", unid: "%", casas: 2, max: 0.5, individual: true, obrigMax: true, exigido: "≤ 0,5 % (sempre)", tab: "comp", campo: "exp" });
      // expansão ≥ 0,2 % só com expansibilidade < 10 %
      var altas = (d.comp || []).map(function (x, i) { return { c: x, i: i, e: num(x.exp), b: num(x.expb) }; }).filter(function (o) { return ok(o.e) && o.e >= 0.2 - 1e-9 && o.e <= 0.5 + 1e-9; });
      var lx = A.linha({ id: "expb", criterio: "Expansão ≥ 0,2 % — expansibilidade < 10 %", secao: "5.1", n: altas.length, exigido: "expansão < 0,2 % ou expansibilidade < 10 %",
        semMedia: true, txtEstat: "—", resultado: altas.length ? altas.length + " amostra(s) com expansão ≥ 0,2 %" : "—" });
      if (!altas.length) { lx.situacao = "nao_exigido"; lx.motivo = "nenhuma amostra com expansão entre 0,2 e 0,5 %"; }
      else {
        altas.forEach(function (o) {
          var r = "amostra " + (o.i + 1) + (o.c.est ? " (est. " + o.c.est + ")" : "") + ": expansão " + fmt(o.e, 2) + " %";
          if (!ok(o.b)) A.marcar(lx, "pendente", r + " sem expansibilidade determinada");
          else if (o.b >= 10) A.marcar(lx, "nao_conforme", r + " e expansibilidade " + fmt(o.b, 0) + " % (≥ 10 %)");
        });
        if (lx.situacao === "conforme") lx.motivo = "expansibilidade < 10 % nas amostras com expansão ≥ 0,2 %";
      }
      c.linhas.push(lx);
      H.av({ id: "ll", criterio: "Limite de liquidez", secao: "5.3 c; 7.4.1", unid: "%", casas: 0, max: 40, individual: true, tab: "carac", campo: "ll", np: 0 });
      H.av({ id: "ip", criterio: "Índice de plasticidade", secao: "5.3 c; 7.4.1", unid: "%", casas: 0, max: 15, individual: true, tab: "carac", campo: "ip", np: 0 });
      H.av({ id: "ea", criterio: "Equivalente de areia", secao: "5.3 g", unid: "%", casas: 0, min: 30, minEstrito: true, individual: true, tab: "carac", campo: "ea" });
      H.av({ id: "sr", criterio: "Relação sílica-sesquióxido S/R", secao: "5.1", unid: "", casas: 2, max: 2 - 1e-6, exigido: "< 2", individual: true, tab: "carac", campo: "sr" });
      H.av({ id: "la", criterio: "Desgaste Los Angeles (retido na peneira de 2 mm)", secao: "5.3 e, i", unid: "%", casas: 0, max: 65, individual: true, tab: "carac", campo: "la",
        aplica: P.laDisp !== "sim", naoAplicaPor: "dispensado: desempenho anterior satisfatório (5.3 i) — anexar a comprovação" });
      H.gran("gran");
      H.av({ id: "rel", criterio: "Passante nº 200 / passante nº 40", secao: "5.3 h", unid: "", casas: 2, max: 2 / 3, exigido: "≤ 2/3", individual: true,
        pontos: H.pts("gran", function (x) { var a = num(x[kPen(0.075)]), b = num(x[kPen(0.42)]); return ok(a) && ok(b) && b > 0 ? a / b : NaN; }) });
      H.geo();
    },
  });

  function secGeo(ini, n, esp, fl) { return X.secoes(ini, n, function (i) { return { larg: 8.04 + X.onda(i, 0.05), esp: esp + X.onda(i, 1.0), flecha: fl + X.onda(i, 0.5) }; }); }
  function amostrasGran(ini, lista) {
    return lista.map(function (v, i) {
      var c = { est: String(ini[i]), reg: "GR-" + (701 + i) };
      PEN.forEach(function (p, j) { c[kPen(p[0])] = A.nstr(v[j], 1); });
      return c;
    });
  }
  F.exemplos = [
    { nome: "Lote aceito — base de laterita, faixa A, 300 m (granulometria, S/R e Los Angeles importados dos exemplos ME)", dados: function () {
      var d = { ident: { registro: "LOTE-BL-001", data: "2026-09-02", obra: "Obra A — BR-000", trecho: "Lote 1", local: "Est. 60 a 75", camada: "Base de solo laterítico", origem: "Jazida 4" },
        params: Object.assign({}, F.padrao, { estIni: "60", estFim: "75", largura: "8,00", espessura: "15", flechaProj: "8", jornadas: "2" }), obs: "" };
      X.importar(F, d, "imp_gran", [["dnit-412-2025-me", 1]]);
      d.gran[0].est = "61";
      d.gran = d.gran.concat(amostrasGran([64, 67, 70, 73], [[100, 89, 60, 45, 32, 20, 10.8], [100, 86, 63, 48, 34, 19, 9.6], [100, 88, 59, 46, 33, 21, 10.4], [100, 87, 62, 47, 35, 20, 10.2]]));
      d.granP = [{ p50_8: "100", p25_4: "88", p9_5: "61", p4_8: "47", p2: "33", p0_42: "20", p0_075: "10" }];
      X.importar(F, d, "imp_carac", [["dner-me-030-94", 0], ["dnit-451-2024-me", 2]]);
      d.carac = d.carac.concat([[61, 32, 11, 41], [64, 34, 12, 38], [67, 31, 10, 44], [70, 33, 12, 40], [73, 30, 9, 45]]
        .map(function (x, i) { return { est: String(x[0]), reg: "CAR-" + (701 + i), ll: String(x[1]), ip: String(x[2]), ea: String(x[3]) }; }));
      d.comp = [[61, "2,108", "9,2", "92", "0,12"], [64, "2,115", "9,0", "88", "0,15"], [67, "2,102", "9,4", "95", "0,10"], [70, "2,111", "9,1", "90", "0,14"], [73, "2,106", "9,3", "86", "0,24", "4"]]
        .map(function (x, i) { return { est: String(x[0]), reg: "CP-" + (701 + i), gs: x[1], hot: x[2], isc: x[3], exp: x[4], expb: x[5] || "" }; });
      d.umid = X.colunas([[60, 8.4], [63, 9.9], [66, 10.1], [69, 8.7], [72, 9.6], [75, 9.0]], "w", "Campo — Speedy");
      d.gc = [[60, "LE", 101.2], [63, "eixo", 100.8], [66, "LD", 101.7], [69, "LE", 100.9], [72, "eixo", 101.4], [74, "LD", 102.0]]
        .map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1) }; });
      d.geo = secGeo(60, 16, 15.4, 8.7);
      d.obs = "Exemplo: 1 granulometria (DNIT 412), S/R (DNER-ME 030) e Los Angeles (DNIT 451) importados dos exemplos das fichas ME; 5 amostras por ensaio (Tabela de Amostragem Variável, n ≥ 5). " +
        "Expansão de 0,24 % na estaca 73 admitida pela expansibilidade de 4 % (5.1).";
      return d;
    } },
    { nome: "Lote rejeitado — EA < 30 % (importado do exemplo ME), ISC com X̄ − k·s < 80 %, nº 200 acima da faixa de trabalho e expansão ≥ 0,2 % sem expansibilidade", dados: function () {
      var d = { ident: { registro: "LOTE-BL-002", data: "2026-09-15", obra: "Obra B — BR-000", trecho: "Lote 2", local: "Est. 0 a 15", camada: "Base de solo laterítico", origem: "Jazida 5" },
        params: Object.assign({}, F.padrao, { estIni: "0", estFim: "15", largura: "8,00", espessura: "15", flechaProj: "8", faixa: "dnit-098-2007-es-B" }), obs: "" };
      d.gran = amostrasGran([1, 4, 7, 10, 13], [[100, 100, 72, 55, 38, 27, 15.5], [100, 100, 70, 52, 36, 25, 14.2], [100, 100, 74, 57, 40, 28, 16.8], [100, 100, 71, 54, 37, 26, 15.1], [100, 100, 73, 56, 39, 27, 16.0]]);
      d.granP = [{ p50_8: "100", p25_4: "100", p9_5: "72", p4_8: "55", p2: "38", p0_42: "27", p0_075: "13" }];
      X.importar(F, d, "imp_carac", [["dnit-450-2024-me", 2], ["dner-me-030-94", 0]]);
      d.carac = d.carac.concat([[1, 36, 13], [7, 38, 14], [13, 35, 12]].map(function (x, i) { return { est: String(x[0]), reg: "CAR-" + (801 + i), ll: String(x[1]), ip: String(x[2]) }; }));
      d.carac[0].est = "4"; d.carac[0].la = "48";
      d.comp = [[1, "2,061", "10,4", "84", "0,18"], [4, "2,055", "10,6", "76", "0,31"], [7, "2,068", "10,2", "91", "0,16"], [10, "2,050", "10,8", "72", "0,22"], [13, "2,063", "10,3", "88", "0,19"]]
        .map(function (x, i) { return { est: String(x[0]), reg: "CP-" + (801 + i), gs: x[1], hot: x[2], isc: x[3], exp: x[4] }; });
      d.umid = X.colunas([[1, 10.1], [5, 11.9], [9, 9.6], [13, 13.2]], "w", "Campo — Speedy");
      d.gc = [[1, "LD", 100.6], [4, "eixo", 101.2], [7, "LE", 100.3], [10, "LD", 101.0], [13, "eixo", 100.8]]
        .map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1) }; });
      d.geo = secGeo(0, 16, 15.2, 8.6);
      d.obs = "Exemplo de reprovação: EA de 27 % importado do exemplo DNIT 450; ISC 72–91 % (X̄ − k·s < 80 %); nº 200 com X̄ + k·s acima de projeto + 2; expansões de 0,22 e 0,31 % sem expansibilidade; umidade +2,7 p.p. na estaca 13 (ressalva).";
      return d;
    } },
  ];
})();
