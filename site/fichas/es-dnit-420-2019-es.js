/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 420/2019-ES — Solo-cal: adição de cal para estabilização de camada de BASE.
 * Define também FE.aceitacaoG2.soloCal, usado pela DNIT 421/2019-ES (sub-base: texto praticamente idêntico).
 * O que a ES manda (seções do PDF):
 *   5.2   teor de cal ≥ teor mínimo pelo pH (DNIT 419); ISC, RCS e MR do projeto de dimensionamento.
 *   5.4.1 b pulverização ≥ 50 % passando na 4,8 mm.   5.4.3 umidade h ót ± 1 ponto percentual.
 *   5.4.5 espessura compactada 12 a 20 cm.   5.4.8 cura ≥ 7 dias.
 *   7.1.1 cal: mesmo tipo da dosagem; certificado com CaO disponível; 1 determinação de CaO (NBR 6473) por carregamento.
 *   7.1.2 solo: caracterização a cada 100 m; áreas ≤ 4000 m²: no mínimo 5 amostras.
 *   7.2.1 umidade (antes da cal e após a recicladora); quantidade de cal; espessura solta a cada 50 m; ISC e expansão a
 *         cada 300 m; GC ≥ 100 % (energia intermediária na 420; normal ou intermediária na 421).
 *   7.2.2 deflexão após 7 dias: n ≥ 15, a cada 20 m em faixas alternadas; X = D̄ + K·S ≤ LSE.
 *   7.3   geometria: largura ± 10 cm; flecha até +20 % (sem falta); espessura ± 10 %.
 *   7.5   X̄ ± k·s; "Tabela de Amostragem Variável" (sem n = 11, como a Tabela 1 da DNER-PRO 277/97).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G2 = FE.aceitacaoG2, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  G2.soloCal = function (o) {
    var GR = [
      G2.umidade({ secao: "5.4.3 / 7.2.1 a, c", modo: "pp", tol: 1, dica: "para início da compactação: h ót ± 1 ponto percentual (5.4.3)",
        freq: { ensaio: "Teor de umidade", metodo: "DNER-ME 052 / 088 → DNIT 456", secao: "7.2.1 a, c", por: "plano", minimo: 5, motivoMin: "menor n da tabela de k" } }),
      G2.valores({ chave: "comp", titulo: "ISC e expansão com amostras da pista (antes da compactação) e compactação de referência", secao: "7.2.1 c", rotulo: "Amostra",
        dica: "a cada 300 m de pista; limites do projeto de dimensionamento (5.2)",
        importar: { k: "impComp", r: "Compactação, ISC e expansão — importar (DNIT 172 / DNIT 164)", de: ["dnit-172-2016-me", "dnit-164-2013-me"], map: G2.map.compactacao },
        campos: [
          { k: "gs", r: "γs,máx (energia " + o.energia + ")", u: "g/cm³", casas: 3, crit: { criterio: "Massa específica aparente seca máxima (referência do GC)", informativo: true, exigido: "referência" } },
          { k: "hot", r: "Umidade ótima", u: "%", casas: 1 },
          { k: "isc", r: "ISC (DNIT 172)", u: "%", casas: 0, crit: { criterio: "Índice de Suporte Califórnia da mistura", secao: "5.2 / 7.2.1 c", min: function (P) { return num(P.iscProj); },
            semLimite: "pendente", exigido: function (P) { return ok(num(P.iscProj)) ? "≥ " + fmt(num(P.iscProj), 0) + " % (projeto)" : "≥ ISC de projeto (informe)"; } } },
          { k: "exp", r: "Expansão (DNIT 172)", u: "%", casas: 2, crit: { criterio: "Expansão da mistura", secao: "7.2.1 c", max: function (P) { return num(P.expProj); },
            exigido: function (P) { return ok(num(P.expProj)) ? "≤ " + fmt(num(P.expProj), 2) + " % (projeto)" : "conforme projeto (a ES não fixa)"; } } },
        ],
        freq: [{ ensaio: "ISC", metodo: "DNIT 172", secao: "7.2.1 c", por: "extensao", a_cada: 300, conta: ["isc"] },
          { ensaio: "Expansão", metodo: "DNIT 172", secao: "7.2.1 c", por: "extensao", a_cada: 300, conta: ["exp"] }] }),
      G2.valores({ chave: "gc", titulo: "Grau de compactação na pista", secao: "7.2.1 d", rotulo: "Furo", posicao: true,
        dica: "DNER-ME 092 (hoje DNIT 458), DNER-ME 036 ou DNIT 417; GC ≥ 100 % na energia " + o.energia,
        importar: { k: "impGC", r: "Grau de compactação — importar furos/pontos (DNIT 458, DNER-ME 036, DNIT 417)", de: ["dnit-458-2025-me", "dner-me-036-94", "dnit-417-2019-me"], map: G2.map.gc },
        campos: [{ k: "gc", r: "Grau de compactação (GC)", u: "%", casas: 1, crit: { criterio: "Grau de compactação (energia " + o.energia + ")", min: 100, grafico: true } },
          { k: "w", r: "Umidade do furo (informativa)", u: "%" }, { k: "gref", r: "γs,máx de referência usado no GC", u: "g/cm³" }],
        freq: { ensaio: "Grau de compactação", metodo: "DNIT 458 / DNER-ME 036 / DNIT 417", secao: "7.2.1 d, 7.4", por: "plano", minimo: 5, motivoMin: "menor n da tabela de k", conta: ["gc"] } }),
      G2.valores({ chave: "pulv", titulo: "Grau de pulverização do solo — % passando na peneira nº 4 (4,8 mm)", secao: "5.4.1 b / 7.2.1 a", rotulo: "Det.",
        dica: "antes da aplicação da cal; dispensável com recicladora (5.4.1, nota)",
        campos: [{ k: "p4", r: "Passando na nº 4 (4,8 mm)", u: "%", casas: 0, crit: { criterio: "Grau de pulverização (passando na 4,8 mm)", min: 50, aplica: function (P) { return P.recicladora !== "sim"; }, naoAplicaPor: "recicladora — pulverização prévia dispensável (5.4.1, nota)" } }],
        freq: { ensaio: "Grau de pulverização", metodo: "peneira nº 4", secao: "7.2.1 a", por: "plano", minimo: 1, se: function (P) { return P.recicladora !== "sim"; }, naoRegra: "recicladora — pulverização prévia dispensável" } }),
      G2.valores({ chave: "cal", titulo: "Cal incorporada e espessura da camada solta", secao: "7.2.1 b, c", rotulo: "Det.",
        dica: "quantidade de cal por peso ou volume; espessura solta a cada 50 m",
        campos: [
          { k: "taxa", r: "Cal incorporada", u: "kg/m²", casas: 1, crit: { criterio: "Quantidade de cal incorporada", secao: "7.2.1 b", informativo: true, proj: function (P) { return num(P.taxaProj); },
            exigido: "conforme dosagem", motivoInfo: "a ES não fixa tolerância: comparar com a dosagem" } },
          { k: "solta", r: "Espessura da camada solta", u: "cm", casas: 1, crit: { criterio: "Espessura da camada solta", secao: "7.2.1 c", informativo: true, exigido: "registrar (a ES não fixa limite)" } },
        ],
        freq: [{ ensaio: "Quantidade de cal incorporada", metodo: "peso ou volume", secao: "7.2.1 b", por: "plano", minimo: 1, conta: ["taxa"] },
          { ensaio: "Espessura da camada solta", metodo: "—", secao: "7.2.1 c", por: "extensao", a_cada: 50, conta: ["solta"] }] }),
      G2.valores({ chave: "ph", titulo: "Teor mínimo de cal pelo pH (DNIT 419) × teor de projeto", secao: "5.2", rotulo: "Ensaio",
        dica: "o teor de cal do projeto deve atender ao teor mínimo do método do pH",
        importar: { k: "impPH", r: "Teor mínimo de cal — importar (DNIT 419)", de: "dnit-419-2019-me",
          map: function (e) { var r = e.resultados || {}; return ok(r.teor) ? [{ est: G2.util.loc(A.importacao.ident(e)), reg: A.importacao.rotulo(e), tm: A.nstr(r.teor, 0) }] : []; } },
        campos: [{ k: "tm", r: "Teor mínimo de cal (pH)", u: "%", casas: 0, crit: { criterio: "Teor mínimo de cal pelo pH ≤ teor de projeto", individual: true,
          max: function (P) { return num(P.teorProj); }, semLimite: "pendente",
          exigido: function (P) { return ok(num(P.teorProj)) ? "≤ " + fmt(num(P.teorProj), 1) + " % (teor de projeto)" : "≤ teor de projeto (informe)"; } } }],
        freq: { ensaio: "Teor mínimo de cal (pH)", metodo: "DNIT 419", secao: "5.2 (dosagem — mín. 1, adotado)", por: "lote", minimo: 1 } }),
      G2.valores({ chave: "cao", titulo: "Cal — óxido de cálcio disponível (NBR 6473)", secao: "7.1.1 c", rotulo: "Carreg.",
        dica: "uma determinação (amostra de 5 kg) por carregamento recebido",
        campos: [{ k: "cao", r: "CaO disponível", u: "%", casas: 1, crit: { criterio: "Óxido de cálcio disponível da cal", individual: true, min: function (P) { return num(P.caoMin); },
          exigido: function (P) { return ok(num(P.caoMin)) ? "≥ " + fmt(num(P.caoMin), 0) + " % (DNIT 418 / certificado)" : "registrar (a ES não fixa o mínimo; ver DNIT 418)"; } } }],
        freq: { ensaio: "CaO disponível", metodo: "NBR 6473", secao: "7.1.1 c", por: "carregamento" } }),
      G2.valores({ chave: "solo", titulo: "Caracterização do solo a estabilizar", secao: "7.1.2", rotulo: "Amostra",
        dica: "a cada 100 m de pista; áreas até 4000 m²: pelo menos 5 amostras. Compare com o projeto de mistura",
        campos: [{ k: "ll", r: "Limite de liquidez", u: "%", casas: 0, crit: { criterio: "Solo — limite de liquidez", informativo: true, exigido: "projeto de mistura" } },
          { k: "ip", r: "Índice de plasticidade", u: "%", casas: 0, crit: { criterio: "Solo — índice de plasticidade", informativo: true, exigido: "projeto de mistura" } },
          { k: "p200", r: "Passando na nº 200", u: "%", casas: 0, crit: { criterio: "Solo — passando na nº 200", informativo: true, exigido: "projeto de mistura" } }],
        freq: { ensaio: "Caracterização do solo", metodo: "—", secao: "7.1.2", conta: ["ll", "ip", "p200"],
          exig: function (P, L) {
            var n = A.nMin(L.ext, 100), peq = ok(L.area) && L.area <= 4000;
            return { exig: ok(n) ? Math.max(n, peq ? 5 : 1) : NaN, regra: "a cada 100 m" + (peq ? "; área ≤ 4000 m²: mín. 5" : "") };
          } } }),
      G2.deflexao({ secao: "7.2.2", modo: "estat" }),
      G2.geometria({ secao: "7.3", largura: "pm", decl: false, espLim: { min: 12, max: 20, secao: "5.4.5", texto: "a camada compactada deve ter entre 12 e 20 cm; acima de 20 cm, subdividir (mínimo 12 cm)" } }),
    ];
    return G2.criar({
      id: o.id, codigo: o.codigo, grupos: GR, titulo: o.titulo, resumo: o.resumo, tabelaK: G2.K_PRO277,
      refs: { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "Tabela de Amostragem Variável (7.5)" },
      dicaEspessura: "entre 12 e 20 cm (5.4.5); tolerância ± 10 % (7.3 c)",
      params: [
        { k: "iscProj", r: "ISC mínimo de projeto (%)", dica: "5.2: requisitos do projeto de dimensionamento" },
        { k: "expProj", r: "Expansão máxima de projeto (%) — opcional" },
        { k: "teorProj", r: "Teor de cal de projeto (%)" },
        { k: "taxaProj", r: "Cal de projeto (kg/m²) — opcional" },
        { k: "caoMin", r: "CaO disponível mínimo (%) — opcional", dica: "a ES não fixa: use o da DNIT 418-EM / certificado" },
        { k: "nCarreg", r: "Carregamentos de cal recebidos no período", ph: "0" },
        { k: "recicladora", r: "Mistura com recicladora? (5.4.1, nota)", tipo: "select", opcoes: [["nao", "Não — pulvimisturador (pulverização prévia)"], ["sim", "Sim — pulverização prévia dispensável"]] },
      ],
      padrao: { recicladora: "nao", defl: "exigido", espGeo: "20", jornadas: "1", nCarreg: "1" },
      usaJornada: false,
      verificacoes: [
        { id: "cert", texto: "Cal com certificado (DNIT 418) e CaO disponível em cada carregamento", secao: "4 b / 7.1.1 b" },
        { id: "tipo", texto: "Cal calcítica (virgem ou hidratada) do mesmo tipo da dosagem", secao: "5.1.1 / 7.1.1 a" },
        { id: "chuva", texto: "Sem execução em dias de chuva", secao: "4 a" },
        { id: "exp", texto: "Segmentos experimentais (nº de passadas para o GC)", secao: "5.4.4 a" },
        { id: "cura", texto: "Cura com emulsão (DNIT 144/145) e proteção por ≥ 7 dias, sem tráfego", secao: "5.4.7 / 5.4.8" },
        { id: "acab", texto: "Acabamento só em corte (sem correção de depressões com material)", secao: "5.4.6" },
        { id: "epi", texto: "EPI e FISPQ da cal (NBR 14725-4)", secao: "5.4.9" },
        { id: "rel", texto: "Relatório de controle da qualidade anexado à medição", secao: o.secRel },
      ],
      textos: {
        RESSALVA: { titulo: "LOTE ACEITO COM RESSALVAS", texto: "Os critérios de aceitação (7.5) são atendidos, mas há pontos a corrigir ou a documentar: \"todo detalhe incorreto ou mal executado deve ser corrigido\" (7.5)." },
        REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há critério não conforme (7.5 b). O serviço corrigido só é aceito se as correções o colocarem em conformidade com a norma; caso contrário, é rejeitado (7.5)." },
      },
      notas: o.codigo + ". A tabela de amostragem variável da ES (7.5) não tem n = 11 (como a Tabela 1 da DNER-PRO 277/97): para n = 11 a ficha usa k = 1,21 (n = 10). " +
        "ISC, expansão e teor de cal: valores do projeto (5.2). GC ≥ 100 % na energia " + o.energia + " (7.2.1 d). Largura ± 10 cm (7.3 a) — a ES não proíbe largura menor que a de projeto. " +
        "Frequências: ISC e expansão a cada 300 m, espessura solta a cada 50 m, solo a cada 100 m (mín. 5 se área ≤ 4000 m²), CaO por carregamento, deflexão ≥ 15; " +
        "umidade e GC pelo plano de amostragem (sem plano informado: 5, menor n da tabela).",
      exemplos: o.exemplos,
    });
  };

  // ==============================================================================================================
  G2.soloCal({
    id: "dnit-420-2019-es", codigo: "DNIT 420/2019-ES", energia: "intermediária", secRel: "8 d",
    titulo: "Base de solo-cal — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 420/2019-ES: umidade (h ót ± 1 p.p.), " +
      "ISC e expansão do projeto (a cada 300 m), GC ≥ 100 % (energia intermediária), pulverização ≥ 50 %, teor de cal × pH (DNIT 419), CaO por carregamento, " +
      "caracterização do solo, deflexão (D̄ + K·S ≤ LSE) e controle geométrico, com o controle estatístico de 7.5.",
    exemplos: function (F) {
      var X = G2.ex;
      function base(reg, extra) {
        return { ident: Object.assign({ registro: reg, data: "2026-07-21", obra: "Obra D — BR-000", origem: "Jazida 5 + cal do Fornecedor C", camada: "Base de solo-cal (5 %)" }, extra.ident || {}),
          params: Object.assign({}, F.padrao, extra.params), umid: [{}], comp: [{}], gc: [{}], pulv: [{}], cal: [{}], ph: [{}], cao: [{}], solo: [{}], obs: "" };
      }
      return [
        { nome: "Lote aceito — base de solo-cal 6 %, 300 m (pH da DNIT 419 importado)", dados: function () {
          var d = base("LOTE-SCAL-01", { ident: { trecho: "Lote 1", local: "Est. 20 a 35" },
            params: { estIni: "20", estFim: "35", largura: "7,50", espessura: "15", lse: "90", iscProj: "40", expProj: "1", teorProj: "6", flechaProj: "4", nCarreg: "2" } });
          d.comp = X.cols(["gs", "hot", "isc", "exp"], [["24", 1.642, 21.5, 54, 0.21], ["31", 1.655, 21.1, 49, 0.28]], { reg: function (i) { return "ISC-10" + (i + 1) + " · DNIT 172"; } });
          d.umid = X.cols(["w"], [["21", 21.7], ["24", 21.0], ["27", 21.9], ["30", 20.9], ["33", 21.4]], { reg: "Campo — Speedy" });
          d.gc = [["20", "LE", 101.1], ["23", "eixo", 100.7], ["26", "LD", 101.8], ["29", "LE", 100.9], ["32", "eixo", 101.4], ["34", "LD", 101.0]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1) }; });
          d.pulv = X.cols(["p4"], [["22", 63], ["30", 66]], { reg: "Peneira nº 4" });
          d.cal = X.cols(["taxa", "solta"], [["20", 14.6, 19.5], ["22", null, 19.8], ["25", 15.1, 19.2], ["27", null, 20.1], ["30", 14.9, 19.6], ["32", null, 19.9], ["35", null, 19.4]], { reg: "Campo" });
          X.importar(F, d, "impPH", [["dnit-419-2019-me", 1]]);
          d.cao = X.cols(["cao"], [["canteiro", 88.4], ["canteiro", 90.1]], { reg: "NBR 6473" });
          d.solo = X.cols(["ll", "ip", "p200"], [["21", 44, 18, 72], ["24", 45, 18, 74], ["27", 46, 19, 75], ["30", 43, 17, 70], ["33", 44, 18, 71]], { reg: "Caracterização" });
          d.defl = X.deflexoes(20, [78, 82, 75, 85, 80, 77, 83, 79, 81, 76, 84, 80, 78, 82, 79, 81]);
          d.geo = X.secoes(20, [[7.54, 15.2, 4.2], [7.48, 14.8, 4.4], [7.52, 15.5, 4.3], [7.46, 14.6, 4.1], [7.55, 15.1, 4.5], [7.50, 15.4, 4.2], [7.47, 14.9, 4.3], [7.53, 15.2, 4.4],
            [7.51, 15.0, 4.2], [7.49, 14.7, 4.6], [7.52, 15.3, 4.3], [7.50, 15.1, 4.1], [7.48, 14.9, 4.4], [7.54, 15.4, 4.2], [7.51, 15.0, 4.3], [7.49, 15.2, 4.4]], true);
          d.verif = X.verif(8);
          d.obs = "Exemplo: teor mínimo de cal pelo pH importado do exemplo nº 2 da DNIT 419 (6 %); demais determinações digitadas.";
          return d;
        } },
        { nome: "Lote rejeitado — ISC abaixo do projeto, teor de cal abaixo do mínimo pelo pH, GC baixo", dados: function () {
          var d = base("LOTE-SCAL-02", { ident: { trecho: "Lote 2", local: "Est. 60 a 75" },
            params: { estIni: "60", estFim: "75", largura: "7,50", espessura: "15", lse: "90", iscProj: "40", teorProj: "5", flechaProj: "4", nCarreg: "2" } });
          X.importar(F, d, "impComp", [["dnit-172-2016-me", 1]]);
          d.comp[0].est = "66";
          d.umid = X.cols(["w"], [["61", 22.4], ["64", 21.5], ["67", 22.9], ["70", 21.2], ["73", 22.0]], { reg: "Campo — Speedy" });
          X.importar(F, d, "impGC", [["dner-me-036-94", 1]]);
          d.gc.forEach(function (c, i) { c.est = String(61 + 4 * i); });
          d.gc.push({ est: "74", pos: "LE", reg: "DNIT 458 — furo digitado", gc: "99,2" }, { est: "71", pos: "LD", reg: "DNIT 458 — furo digitado", gc: "100,4" });
          d.pulv = X.cols(["p4"], [["63", 58]], { reg: "Peneira nº 4" });
          d.cal = X.cols(["taxa", "solta"], [["62", 12.4, 19.6], ["65", null, 19.9], ["68", null, 20.2]], { reg: "Campo" });
          X.importar(F, d, "impPH", [["dnit-419-2019-me", 1]]);
          d.cao = X.cols(["cao"], [["canteiro", 87.5]], { reg: "NBR 6473" });
          d.solo = X.cols(["ll", "ip", "p200"], [["62", 58, 27, 81]], { reg: "Caracterização" });
          d.defl = X.deflexoes(60, [85, 92, 88, 96, 84, 90, 99, 87, 93, 86, 95, 89, 91, 97, 88, 94]);
          d.geo = X.secoes(60, [[7.44, 14.2, 4.1], [7.38, 13.1, 3.8], [7.52, 14.6, 4.3], [7.47, 13.5, 4.2], [7.43, 13.9, 4.0], [7.50, 14.1, 4.4], [7.41, 13.4, 4.1], [7.48, 14.0, 4.2],
            [7.45, 13.2, 4.3], [7.49, 13.8, 4.1], [7.42, 14.3, 4.2], [7.46, 13.6, 4.0], [7.44, 13.9, 4.2], [7.47, 13.3, 4.3], [7.43, 14.0, 4.1], [7.45, 13.7, 4.2]], true);
          d.verif = X.verif(8);
          d.obs = "Exemplo de reprovação: ISC e expansão do solo do exemplo nº 2 da DNIT 172 (sem ganho de suporte), teor de projeto de 5 % abaixo do mínimo de 6 % pelo pH, GC com X̄ − k·s < 100 %, " +
            "Dc > LSE, largura abaixo de −10 cm, flecha abaixo do projeto e espessura baixa; frequências de ISC, solo e espessura solta incompletas.";
          return d;
        } },
      ];
    },
  });
})();
