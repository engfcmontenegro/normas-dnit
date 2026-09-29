/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 143/2025-ES — Base de solo-cimento.
 * Construtor comum FE.aceitacaoG2 (es-dnit-140-2022-es.js). O que a ES manda (seções do PDF):
 *   5.1.3 Tabela 1: solo (ou solo + granular) — 2" 100 %; nº 4 50–100 (± 5); nº 40 15–100 (± 2); nº 200 5–35 (± 2).
 *   5.2   mecanicista: MR (DNIT 181) e fadiga (DNIT 434) do projeto; empírico: RCS aos 7 dias ≥ 2,1 MPa (DNER-ME 201).
 *   5.4.1 b / 5.4.2 b pulverização ≥ 80 % passando na 4,75 mm.   5.4.4 umidade h ót ± 1 %.
 *   5.4.2 e água incorporada em ≤ 3 h;  5.4.5 água → espalhamento ≤ 1 h (salvo comprovação); água → fim da compactação ≤ 3 h.
 *   5.4.6 espessura 10 a 20 cm.  5.4.9 cura ≥ 7 dias.
 *   7.1   cimento: certificado, mesmo tipo da dosagem, finura ≥ 1 por dia; resíduo nº 200 ≤ 10 % (alto-forno) / ≤ 15 % (comum).
 *   7.3.2 umidade (DNIT 456); compactação e moldagem na energia normal (DNER-ME 202) ou a do projeto; MR a cada 1500 m e
 *         fadiga a cada 2500 m (se especificados); RCS aos 7 dias a cada 1500 m (se especificada); GC ≥ 100 % em relação à
 *         γs,máx da DNER-ME 216 (NOTA 5), por DNIT 458, DNER-ME 036 ou DNIT 417.
 *   7.3.3 deflexão após 7 dias: n ≥ 15; Dc = D̄ + k·S ≤ LSE (eq. 1).   7.4 geometria.   7.6 X̄ ± k·s, Tabela A1 (= A.K_DNIT).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G2 = FE.aceitacaoG2, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-143-2025-es";
  var mec = function (P) { return P.dimens === "mec"; };
  var rcsExig = function (P) { return P.dimens !== "mec" || P.rcsCtrl === "sim"; };
  var GR = [
    G2.umidade({ secao: "5.4.4 / 7.3.2 a", modo: "pp", tol: 1, dica: "imediatamente antes da compactação; admitido h ót ± 1 (5.4.4)",
      freq: { ensaio: "Teor de umidade antes da compactação", metodo: "DNIT 456", secao: "7.3.2 a, 7.5", por: "plano", minimo: 5, motivoMin: "menor n da Tabela A1" } }),
    G2.valores({ chave: "comp", titulo: "Compactação — γs,máx de referência (DNER-ME 216) e moldagem (DNER-ME 202)", secao: "7.3.2 a / NOTA 5", rotulo: "Amostra",
      dica: "energia normal ou a especificada em projeto",
      importar: { k: "impComp", r: "Compactação — importar (DNER-ME 216 / DNIT 164)", de: ["dner-me-216-94", "dnit-164-2013-me"], map: G2.map.compactacao },
      campos: [{ k: "gs", r: "γs,máx (DNER-ME 216)", u: "g/cm³", casas: 3, crit: { criterio: "Massa específica aparente seca máxima (referência do GC)", informativo: true, exigido: "referência (NOTA 5)" } },
        { k: "hot", r: "Umidade ótima", u: "%", casas: 1 }],
      freq: { ensaio: "Compactação e moldagem de CPs", metodo: "DNER-ME 216 / 202", secao: "7.3.2 a", por: "plano", minimo: 1, conta: ["gs"] } }),
    G2.valores({ chave: "gc", titulo: "Grau de compactação na pista", secao: "7.3.2 b / NOTA 5", rotulo: "Furo", posicao: true,
      dica: "DNIT 458, DNER-ME 036 ou DNIT 417; GC ≥ 100 % da γs,máx da DNER-ME 216 (NOTA 5); densímetro: calibrar (NOTA 6)",
      importar: { k: "impGC", r: "Grau de compactação — importar furos/pontos (DNIT 458, DNER-ME 036, DNIT 417)", de: ["dnit-458-2025-me", "dner-me-036-94", "dnit-417-2019-me"], map: G2.map.gc },
      campos: [{ k: "gc", r: "Grau de compactação (GC)", u: "%", casas: 1, crit: { criterio: "Grau de compactação", min: 100, grafico: true } },
        { k: "w", r: "Umidade do furo (informativa)", u: "%" }, { k: "gref", r: "γs,máx de referência usado no GC", u: "g/cm³" }],
      freq: { ensaio: "Grau de compactação", metodo: "DNIT 458 / DNER-ME 036 / DNIT 417", secao: "7.3.2 b, 7.5", por: "plano", minimo: 5, motivoMin: "menor n da Tabela A1", conta: ["gc"] } }),
    G2.valores({ chave: "rcs", titulo: "Resistência à compressão simples aos 7 dias (DNER-ME 201)", secao: "5.2 b / 7.3.2 a", rotulo: "Conjunto", se: rcsExig,
      dica: "média dos CPs moldados (DNER-ME 202) de cada ponto; ≥ 2,1 MPa (21 kgf/cm²)",
      importar: { k: "impRCS", r: "RCS — importar (DNER-ME 201)", de: "dner-me-201-94", map: G2.map.rcs },
      texto: [{ k: "idade", r: "Idade (dias)", texto: false }, { k: "ncp", r: "Nº de CPs", texto: false }],
      campos: [{ k: "v", r: "RCS (média dos CPs)", u: "MPa", casas: 2, crit: { criterio: "Resistência à compressão simples aos 7 dias", min: 2.1, grafico: true } }],
      freq: { ensaio: "Resistência à compressão simples (7 dias)", metodo: "DNER-ME 201", secao: "7.3.2 a", por: "extensao", a_cada: 1500, conta: ["v"] },
      extra: function (ctx, cols) {
        var id = cols.filter(function (c) { return ok(num(c.v)) && ok(num(c.idade)) && num(c.idade) !== 7; });
        if (id.length) ctx.avisos.push("RCS: " + id.length + " conjunto(s) com idade diferente de 7 dias — a ES exige 7 dias de cura (5.2 b, 7.3.2 a).");
      } }),
    G2.granulometria({ secao: "5.1.3 / Tabela 1", obrig: true, titulo: "Granulometria do solo ou da mistura solo + material granular — % passando",
      dica: "Tabela 1 (obrigatória) e, havendo curva de projeto, projeto ± tolerância (± 5 na nº 4; ± 2 nas nº 40 e 200)",
      freq: { ensaio: "Granulometria", metodo: "DNIT 412", secao: "5.1.3 (seleção do solo — mín. 1 por lote, adotado)", por: "lote", minimo: 1 } }),
    G2.valores({ chave: "pulv", titulo: "Grau de pulverização do solo — % passando na peneira nº 4 (4,75 mm)", secao: "5.4.1 b / 7.3.1 a", rotulo: "Det.",
      dica: "antes da aplicação do cimento; exige-se no mínimo 80 % passando na 4,75 mm",
      campos: [{ k: "p4", r: "Passando na nº 4 (4,75 mm)", u: "%", casas: 0, crit: { criterio: "Grau de pulverização (passando na 4,75 mm)", min: 80 } }],
      freq: { ensaio: "Grau de pulverização", metodo: "peneira nº 4", secao: "7.3.1 a, 7.5", por: "plano", minimo: 1 } }),
    G2.valores({ chave: "cim", titulo: "Quantidade de cimento incorporada e tempos de execução", secao: "7.3.1 b / 5.4.2 e / 5.4.5", rotulo: "Det.",
      campos: [
        { k: "taxa", r: "Cimento incorporado", u: "kg/m²", casas: 1, crit: { criterio: "Quantidade de cimento incorporada", secao: "7.3.1 b", informativo: true,
          proj: function (P) { return num(P.taxaProj); }, exigido: "conforme dosagem", motivoInfo: "a ES não fixa tolerância: comparar com a dosagem" } },
        { k: "t1", r: "Tempo adição da água → início do espalhamento", u: "h", casas: 2, crit: { criterio: "Tempo água → início do espalhamento", secao: "5.4.5", max: 1, individual: true, falha: "ressalva",
          exigido: "≤ 1 h (mais, só comprovado por ensaios e a critério da Fiscalização)" } },
        { k: "t2", r: "Tempo adição da água → fim da compactação", u: "h", casas: 2, crit: { criterio: "Tempo água → fim da compactação", secao: "5.4.2 e / 5.4.5", max: 3, individual: true, exigido: "≤ 3 h em qualquer hipótese" } },
      ],
      freq: { ensaio: "Quantidade de cimento incorporada", metodo: "peso ou volume", secao: "7.3.1 b, 7.5", por: "plano", minimo: 1, conta: ["taxa"] } }),
    G2.valores({ chave: "fin", titulo: "Cimento — finura (resíduo na peneira nº 200)", secao: "7.1 c, d", rotulo: "Ensaio", dica: "ABNT NBR 16372; no mínimo um por dia de trabalho",
      campos: [{ k: "res", r: "Resíduo na peneira nº 200 (0,075 mm)", u: "%", casas: 1, crit: { criterio: "Resíduo do cimento na peneira nº 200", secao: "7.1 d", individual: true,
        max: function (P) { return P.tipoCim === "comum" ? 15 : 10; }, exigido: function (P) { return P.tipoCim === "comum" ? "≤ 15 % (cimento Portland comum)" : "≤ 10 % (cimento de alto-forno)"; } } }],
      freq: { ensaio: "Finura do cimento", metodo: "ABNT NBR 16372", secao: "7.1 c", por: "jornada", unid: "dia de trabalho" } }),
    G2.valores({ chave: "dos", titulo: "Estimativa do teor de cimento (DNIT 414 — dosagem físico-química)", secao: "3.2", rotulo: "Ensaio",
      dica: "informativo: a DNIT 414 \"pode ser empregada\" para estimar o teor (3.2)",
      importar: { k: "impDos", r: "Teor mínimo de cimento — importar (DNIT 414)", de: "dnit-414-2019-me",
        map: function (e) { var r = e.resultados || {}; return ok(r.teorMin) ? [{ est: G2.util.loc(A.importacao.ident(e)), reg: A.importacao.rotulo(e), tm: A.nstr(r.teorMin, 0) }] : []; } },
      campos: [{ k: "tm", r: "Teor mínimo estimado (DNIT 414)", u: "%", casas: 0, crit: { criterio: "Teor de cimento estimado (DNIT 414)", informativo: true, proj: function (P) { return num(P.teorProj); },
        exigido: function (P) { return ok(num(P.teorProj)) ? "teor de projeto " + fmt(num(P.teorProj), 1) + " %" : "estimativa"; } } }] }),
    G2.valores({ chave: "mr", titulo: "Módulo de resiliência (triplicata, DNIT 181) e fadiga (DNIT 434)", secao: "5.2 a / 7.3.2 a", rotulo: "Ensaio", se: mec,
      campos: [{ k: "mr", r: "Módulo de resiliência (média da triplicata)", u: "MPa", casas: 0, crit: { criterio: "Módulo de resiliência", informativo: true,
          proj: function (P) { return num(P.mrProj); }, tolProj: function (P) { return num(P.mrTol); }, msgProj: "submeter à Supervisora/Projetista (7.2, NOTA 3)",
          exigido: function (P) { return ok(num(P.mrProj)) ? "≈ " + fmt(num(P.mrProj), 0) + " MPa (sem variação significativa)" : "conforme projeto"; } } },
        { k: "fad", r: "Fadiga — resultado (conforme projeto)", u: "", casas: 0, crit: { criterio: "Fadiga (DNIT 434)", informativo: true, exigido: "conforme projeto" } }],
      freq: [{ ensaio: "Módulo de resiliência", metodo: "DNIT 181", secao: "7.3.2 a", por: "extensao", a_cada: 1500, conta: ["mr"] },
        { ensaio: "Fadiga", metodo: "DNIT 434", secao: "7.3.2 a", por: "extensao", a_cada: 2500, conta: ["fad"] }] }),
    G2.deflexao({ secao: "7.3.3", modo: "estat", cada40: true }),
    G2.geometria({ secao: "7.4", largura: "semFalta", espLim: { min: 10, max: 20, secao: "5.4.6", texto: "a camada compactada deve ter entre 10 e 20 cm; acima de 20 cm, subdividir em camadas de no mínimo 10 cm" } }),
  ];

  G2.criar({
    id: ID, codigo: "DNIT 143/2025-ES", grupos: GR,
    titulo: "Base de solo-cimento — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 143/2025-ES: granulometria da Tabela 1, " +
      "umidade (h ót ± 1), GC ≥ 100 % (γs,máx da DNER-ME 216), RCS aos 7 dias ≥ 2,1 MPa (empírico), pulverização ≥ 80 %, tempos, finura do cimento, MR e fadiga " +
      "(mecanicista), deflexão (Dc ≤ LSE) e controle geométrico, com o controle estatístico de 7.6 (Tabela A1).",
    refs: { reprova: "7.6 b", atende: "7.6 a", corrige: "7.6", regra: "7.6", tabela: "Tabela A1" },
    dicaEspessura: "entre 10 e 20 cm (5.4.6); tolerância ± 10 % (7.4 c)",
    params: [
      { k: "dimens", r: "Dimensionamento do pavimento (5.2)", tipo: "select", recarrega: true,
        opcoes: [["emp", "Empírico — RCS aos 7 dias ≥ 2,1 MPa"], ["mec", "Mecanicista — MR e fadiga conforme projeto"]] },
      { k: "rcsCtrl", r: "RCS especificada em projeto mecanicista? (7.3.2 a)", tipo: "select", recarrega: true, se: function (d) { return mec(d.params || {}); },
        opcoes: [["nao", "Não"], ["sim", "Sim — controlar a cada 1500 m"]] },
      { k: "tipoCim", r: "Tipo de cimento (7.1 d)", tipo: "select", opcoes: [["af", "Portland de alto-forno — resíduo ≤ 10 %"], ["comum", "Portland comum — resíduo ≤ 15 %"]] },
      { k: "teorProj", r: "Teor de cimento de projeto (%) — opcional" },
      { k: "taxaProj", r: "Cimento de projeto (kg/m²) — opcional" },
      { k: "mrProj", r: "Módulo de resiliência de projeto (MPa)", se: function (d) { return mec(d.params || {}); } },
      { k: "mrTol", r: "Variação admitida do MR em relação ao projeto (%) — opcional", se: function (d) { return mec(d.params || {}); },
        dica: "a ES só diz \"não devem variar de forma significativa\" (7.2): vazio = só informa o desvio" },
    ],
    padrao: { dimens: "emp", rcsCtrl: "nao", tipoCim: "comum", defl: "exigido", secaoT: "simples", declProj: "3", espGeo: "20", jornadas: "1" },
    verificacoes: [
      { id: "cert", texto: "Cimento com certificado (DNER-EM 036, validade e data de fabricação) em cada carregamento", secao: "4 b / 7.1 a" },
      { id: "tipo", texto: "Cimento do mesmo tipo usado na dosagem", secao: "7.1 b" },
      { id: "exp", texto: "Segmento experimental aprovado pela Fiscalização", secao: "4 d, e" },
      { id: "chuva", texto: "Sem execução em dias de chuva", secao: "4 a" },
      { id: "agr", texto: "Agregado retido na nº 10 são e durável (DNIT 459)", secao: "5.1.3" },
      { id: "mist", texto: "Mistura: projeto mecanicista — MR (triplicata) e fadiga antes da obra, sem variação significativa", secao: "7.2", se: mec, naoAplicaPor: "projeto empírico" },
      { id: "agua", texto: "Água adicionada progressivamente (≤ 2 % por passada) e incorporada em até 3 h", secao: "5.4.2 e" },
      { id: "junta", texto: "Etapa única em toda a largura (sem juntas longitudinais); juntas transversais adequadas", secao: "5.4.8" },
      { id: "cura", texto: "Cura com emulsão (RR-2C ou EAI, DNIT 165) por ≥ 7 dias antes do revestimento", secao: "5.4.9" },
      { id: "acab", texto: "Acabamento só em corte (sem correção de depressões com material)", secao: "5.4.7" },
    ],
    textos: {
      RESSALVA: { titulo: "LOTE ACEITO COM RESSALVAS", texto: "Os critérios de aceitação (7.6) são atendidos, mas há pontos a corrigir ou a documentar: \"todo detalhe incorreto ou mal executado deve ser corrigido\" (7.6)." },
      REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há critério não conforme (7.6 b). O serviço corrigido só é aceito se as correções o colocarem em conformidade com a norma; caso contrário, é rejeitado (7.6)." },
    },
    notas: "DNIT 143/2025-ES. Umidade: \"± 1 %\" da h ót lido como ± 1 ponto percentual. Granulometria: Tabela 1 obrigatória (5.1.3); a coluna \"tolerância\" é aplicada " +
      "em torno da curva de projeto, quando informada. RCS: exigida no projeto empírico (5.2 b) e, no mecanicista, se especificada (7.3.2 a), a cada 1500 m. " +
      "Frequências: a ES remete ao plano de amostragem (7.5, DNER-PRO 277); sem plano, a ficha exige 5 determinações de umidade e GC (menor n da Tabela A1) e 1 dos demais.",
    exemplos: function (F) {
      var X = G2.ex;
      function base(reg, extra) {
        return { ident: Object.assign({ registro: reg, data: "2026-09-02", obra: "Obra C — BR-000", origem: "Jazida 3 + cimento do Fornecedor B", camada: "Base de solo-cimento (6 %)" }, extra.ident || {}),
          params: Object.assign({}, F.padrao, extra.params), umid: [{}], comp: [{}], gc: [{}], rcs: [{}], gran: [{}], pulv: [{}], cim: [{}], fin: [{}], obs: "" };
      }
      return [
        { nome: "Lote aceito — base de solo-cimento 6 %, 300 m (compactação e RCS dos exemplos ME)", dados: function () {
          var d = base("LOTE-SC-01", { ident: { trecho: "Lote 1", local: "Est. 300 a 315" },
            params: { estIni: "300", estFim: "315", largura: "8,00", espessura: "17", lse: "50", jornadas: "2", teorProj: "6", taxaProj: "20,5" } });
          X.importar(F, d, "impComp", [["dner-me-216-94", 1]]);
          d.comp[0].est = "306";
          d.umid = X.cols(["w"], [["301", 8.3], ["304", 7.6], ["307", 8.4], ["310", 7.9], ["313", 8.1]], { reg: "Campo — Speedy" });
          d.gc = [["300", "LE", 101.2], ["302", "eixo", 100.8], ["305", "LD", 101.9], ["308", "LE", 100.6], ["311", "eixo", 101.5], ["314", "LD", 101.1]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1), gref: "2,100" }; });
          X.importar(F, d, "impRCS", [["dner-me-201-94", 1]]);
          d.rcs[0].est = "306";
          d.gran = [{ est: "303", reg: "GR-0215 · DNIT 412 (digitado)", p50_8: "100", p4_75: "68", p0_425: "31", p0_075: "14" }];
          d.proj = [{ p50_8: "100", p4_75: "66", p0_425: "30", p0_075: "14" }];
          d.pulv = X.cols(["p4"], [["302", 86], ["309", 84]], { reg: "Peneira nº 4" });
          d.cim = X.cols(["taxa", "t1", "t2"], [["303", 20.9, 0.7, 2.2], ["310", 20.2, 0.6, 2.5]], { reg: "Bandeja / tempos" });
          d.fin = X.cols(["res"], [["canteiro", 11.8], ["canteiro", 12.4]], { reg: "NBR 16372" });
          X.importar(F, d, "impDos", [["dnit-414-2019-me", 1]]);
          d.defl = X.deflexoes(300, [34, 38, 31, 36, 40, 33, 35, 37, 32, 39, 36, 34, 38, 33, 35, 37]);
          d.geo = X.secoes(300, [[8.04, 17.3, 3.0, 3.1], [8.02, 16.8, 3.1, 3.0], [8.06, 17.5, 3.2, 3.1], [8.03, 16.6, 3.0, 3.2], [8.05, 17.1, 3.1, 3.0], [8.01, 17.4, 3.2, 3.1],
            [8.04, 16.9, 3.0, 3.1], [8.06, 17.2, 3.1, 3.2], [8.02, 17.0, 3.2, 3.0], [8.03, 16.7, 3.0, 3.1], [8.05, 17.6, 3.1, 3.1], [8.04, 17.2, 3.2, 3.0],
            [8.02, 16.9, 3.0, 3.2], [8.06, 17.3, 3.1, 3.1], [8.03, 17.0, 3.2, 3.0], [8.05, 16.8, 3.1, 3.2]]);
          d.verif = X.verif(10);
          d.obs = "Exemplo: γs,máx (DNER-ME 216), RCS (DNER-ME 201) e teor estimado (DNIT 414) importados dos exemplos das fichas ME; demais determinações digitadas.";
          return d;
        } },
        { nome: "Lote rejeitado — RCS < 2,1 MPa, granulometria fora da Tabela 1, pulverização < 80 %", dados: function () {
          var d = base("LOTE-SC-02", { ident: { trecho: "Lote 2", local: "Est. 400 a 410" },
            params: { estIni: "400", estFim: "410", largura: "8,00", espessura: "17", lse: "50" } });
          X.importar(F, d, "impComp", [["dner-me-216-94", 0]]);
          d.comp[0].est = "404";
          d.umid = X.cols(["w"], [["401", 10.6], ["403", 10.1], ["405", 11.0], ["407", 9.8], ["409", 10.4]], { reg: "Campo — Speedy" });
          d.gc = [["400", "LE", 100.6], ["402", "eixo", 101.4], ["404", "LD", 100.9], ["406", "LE", 101.8], ["408", "eixo", 100.7], ["410", "LD", 101.2]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 417 — ponto " + (i + 1), gc: A.nstr(x[2], 1) }; });
          X.importar(F, d, "impRCS", [["dner-me-201-94", 2]]);
          d.rcs[0].est = "405";
          X.importar(F, d, "impGran", [["dnit-412-2025-me", 1]]);
          d.gran[0].est = "402";
          d.pulv = X.cols(["p4"], [["403", 74]], { reg: "Peneira nº 4" });
          d.cim = X.cols(["taxa", "t1", "t2"], [["402", 17.8, 0.9, 2.7]], { reg: "Bandeja / tempos" });
          d.fin = X.cols(["res"], [["canteiro", 12.6]], { reg: "NBR 16372" });
          d.defl = X.deflexoes(400, [42, 47, 39, 44, 49, 41, 46, 43, 45, 40, 48, 44, 42, 46, 41, 45]);
          d.defl.forEach(function (c, i) { c.est = A.fmtEstaca(8000 + i * 12.5, { simples: true }); });
          d.geo = X.secoes(400, [[8.03, 17.1, 3.0, 3.1], [8.05, 16.7, 3.1, 3.0], [8.02, 17.3, 3.2, 3.1], [8.04, 16.9, 3.0, 3.2], [8.06, 17.0, 3.1, 3.0], [8.03, 17.4, 3.2, 3.1],
            [8.02, 16.8, 3.0, 3.1], [8.05, 17.2, 3.1, 3.2], [8.04, 16.6, 3.2, 3.0], [8.03, 17.1, 3.0, 3.1], [8.06, 17.3, 3.1, 3.1]]);
          d.verif = X.verif(10);
          d.obs = "Exemplo de reprovação: RCS média 1,74 MPa aos 7 dias (exemplo nº 3 da DNER-ME 201), passante na nº 4 de 47,5 % (< 50 %, Tabela 1) e pulverização de 74 % (< 80 %).";
          return d;
        } },
      ];
    },
  });
})();
