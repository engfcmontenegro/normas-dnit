/*
 * Ficha: DNIT 168/2013-EM — Cimento asfáltico de petróleo modificado por asfalto natural do tipo TLA (Trinidad Lake Asphalt)
 * — recebimento do carregamento (CAP-TLA 40/55).
 * Usa o motor FE.recebimentoLigante (site/fichas/dnit-095-2006-em.js) e as extensões FE.recebimentoLigante.ext
 * (site/fichas/dnit-129-2011-em.js, carregado antes). Limites: Tabela 1 do Anexo A (conferida no PDF).
 */
(function () {
  "use strict";
  var FE = window.FE, ok = FE.ok, A = FE.aceitacao;
  var RL = FE.recebimentoLigante, X = RL && RL.ext;
  if (!X) { if (window.console) console.error("dnit-168-2013-em.js: carregue antes site/fichas/dnit-095-2006-em.js e dnit-129-2011-em.js."); return; }
  var L = RL.L;

  function so(l) { return { "40/55": l }; }
  var G1 = "CAP-TLA — ligante original (Tabela 1)", G2 = "Efeito do calor e do ar — RTFOT a 163 °C, 85 min (NBR 15235)";
  var BK = "NBR 15184:2004";

  var ENSAIOS = [
    { id: "pen", grupo: G1, r: "Penetração (25 °C, 5 s, 100 g)", u: "0,1 mm", casas: 0, metodo: "DNIT 155/2010-ME", lim: so(L(40, 55)),
      nMin: 3, nMinRef: "NBR 6576 / DNIT 155", verifica: RL.tolPenetracao("Penetração") },
    { id: "pa", grupo: G1, r: "Ponto de amolecimento, mín.", u: "°C", casas: 1, metodo: "DNIT 131/2010-ME", lim: so(L(50, null)) },
    { id: "fulgor", grupo: G1, r: "Ponto de fulgor, mín.", u: "°C", casas: 0, metodo: "NBR 11341:2008 · DNER-ME 148/94", lim: so(L(232, null)) },
    { id: "bk135", grupo: G1, r: "Viscosidade Brookfield a 135 °C, spindle 21, 20 rpm, mín.", u: "cP", casas: 0, metodo: BK, lim: so(L(400, null)) },
    { id: "bk150", grupo: G1, r: "Viscosidade Brookfield a 150 °C, spindle 21, 50 rpm, mín.", u: "cP", casas: 0, metodo: BK, lim: so(L(215, null)) },
    { id: "bk175", grupo: G1, r: "Viscosidade Brookfield a 175 °C, spindle 21, 100 rpm, mín.", u: "cP", casas: 0, metodo: BK, lim: so(L(80, null)) },
    { id: "solub", grupo: G1, r: "Solubilidade em tricloroetileno", u: "%", casas: 1, metodo: "NBR 14855:2002", lim: so(L(75, 90)) },
    { id: "cinzas", grupo: G1, r: "Teor de cinzas", u: "%", casas: 1, metodo: "NBR 9842:2009", lim: so(L(7.5, 19)) },
    { id: "duct", grupo: G1, r: "Ductilidade a 25 °C, 5 cm/min, mín. (\"> 100\" se passar do curso)", curto: "Ductilidade a 25 °C, 5 cm/min, mín.", u: "cm", casas: 0,
      metodo: "DNER-ME 163/98", ph: "ex.: > 100", lim: so(L(100, null)) },
    { id: "tla", grupo: G1, tipo: "qual", r: "Presença de TLA (obrigatório para a aceitação, 6 b)", curto: "Presença de TLA (6 b)", u: "", metodo: "ASTM D6608-12",
      ph: "presença / ausência", lim: so({ igual: "presença" }),
      opcoes: [["pres", "presença", /^(pres|sim|positiv|detect|constat)/i], ["aus", "ausência", /^(aus|n[aã]o|negativ)/i]] },
    { id: "estab", grupo: G1, r: "Estabilidade ao armazenamento (diferença de PA), máx.", u: "°C", casas: 1, metodo: "DNER-ME 384/99 (atual DNIT 384/2022-ME)", abs: true,
      lim: so(L(null, 5)) },
    X.espuma(G1, so({ igual: "não espuma" }), "6 e"),
    X.rtfotMassa(G2, so(L(null, 1.0)), "NBR 15235:2009", "(nota 1)"),
    { id: "penR", grupo: G2, tipo: "aux", r: "Penetração após RTFOT (25 °C, 5 s, 100 g)", u: "0,1 mm", casas: 1, verifica: RL.tolPenetracao("Penetração após RTFOT") },
    { id: "pret", grupo: G2, tipo: "deriv", r: "Percentagem da penetração original, mín.", u: "%", casas: 0, metodo: "DNIT 155/2010-ME", usa: ["penR", "pen"],
      formula: "PEN após RTFOT / PEN original × 100", lim: so(L(55, null)), f: function (V) { return V.pen > 0 ? V.penR / V.pen * 100 : NaN; } },
    { id: "ductR", grupo: G2, r: "Ductilidade a 25 °C, 5 cm/min, após RTFOT, mín.", curto: "Ductilidade após RTFOT, mín.", u: "cm", casas: 0, metodo: "DNER-ME 163/98",
      ph: "ex.: > 100", lim: so(L(50, null)) },
  ];

  var MAPAS = {
    "dnit-131-2010-me": X.M.pa({ rtfot: "" }), "dner-me-148-94": X.M.fulgor(), "dner-me-163-98": X.M.duct(), "dnit-384-2022-me": X.M.estab("estab"),
  };

  var F = RL.criar({
    titulo: "Recebimento de CAP modificado por asfalto natural TLA",
    resumo: "Ensaios de recebimento do carregamento de CAP-TLA 40/55 comparados com a Tabela 1 do Anexo A: penetração, ponto de amolecimento, fulgor, Brookfield (135, 150 e 175 °C), " +
      "solubilidade, cinzas, ductilidade, presença de TLA (ASTM D6608), estabilidade ao armazenamento, espuma e RTFOT; importa PA, fulgor, ductilidade e estabilidade das fichas ME.",
    tabela: "Tabela 1 (Anexo A)",
    textoTodos: "A amostra deve ser submetida aos ensaios da Tabela 1 do Anexo A (seção 7); o resultado geral vale só para os ensaios realizados.",
    rotuloClasse: "Classe (4.1)",
    classes: [["40/55", "CAP-TLA 40/55"]],
    padrao: { classe: "40/55", inspecao: "ok" },
    params: [
      X.paramInspecao("6"),
      { k: "fatorK", r: "Fator de correção de finos \"K\" (certificado, 4.5)", ph: "ex.: 0,92", dica: "deve constar do certificado de análise" },
    ].concat(X.importar("dnit-168-2013-em", MAPAS,
      "DNIT 131 (PA), DNER-ME 148 (fulgor), DNER-ME 163 (ductilidade a 25 °C; especificação \"CAP-TLA após RTFOT\" → ductilidade após RTFOT), DNIT 384 (estabilidade)")),
    dicaTabela: "RTFOT: uma coluna por recipiente",
    ensaios: ENSAIOS,
    avisos: function (res, V, P, avisos) {
      if (ok(V.penR) && !ok(V.pen)) avisos.push("Percentagem da penetração original: informe também a penetração do ligante original.");
    },
    notas: "Resultado de cada ensaio = média das determinações, comparada com a Tabela 1 do Anexo A da DNIT 168/2013-EM (CAP-TLA 40/55). " +
      "ΔM = (Mi − Mf) / Mi × 100 (nota 1), comparada em valor absoluto com 1,0 %; % da penetração original = PEN após RTFOT / PEN original × 100. " +
      "A presença de TLA (ASTM D6608-12) é obrigatória para a aceitação do carregamento (6 b); o material não deve chegar com espuma (6 e). " +
      "Certificado do fabricante com cada carregamento, com o fator de correção de finos K; novos ensaios e novo certificado se a fabricação e o carregamento distarem mais de 3 dias (4.5). " +
      "Aceitação (seção 7): todos os resultados atendendo, o carregamento é aceito; algum fora, é rejeitado se a contraprova confirmar.",
    exemplos: [
      { nome: "CAP-TLA 40/55 — carregamento aceito (estabilidade importada da DNIT 384)", dados: function () {
        var d = { ident: { registro: "REC-TLA-EX-01", data: "2026-07-14", obra: "Obra A — usina de asfalto", origem: "Distribuidora A", camada: "CAP-TLA 40/55" },
          params: { classe: "40/55", inspecao: "ok", fatorK: "0,94", nf: "310022", quantidade: "30,0", procedencia: "Distribuidora A", certificado: "TLA-0713",
            dataCert: "13/07/2026", dataCarga: "14/07/2026" },
          det: [{ pen: "47", pa: "53,2", fulgor: "286", bk135: "520", bk150: "268", bk175: "112", solub: "84,6", cinzas: "11,8", duct: "> 100", tla: "presença",
            espuma: "não espuma", mi: "35,060", mf: "34,901", penR: "31", ductR: "72" },
          { pen: "48", pa: "53,6", fulgor: "290", bk135: "515", bk150: "262", bk175: "108", solub: "84,9", cinzas: "12,1", duct: "> 100", mi: "35,122", mf: "34,968", penR: "30", ductR: "68" },
          { pen: "46", penR: "31" }] };
        A.exemplos.importar(FE.FICHAS["dnit-168-2013-em"].params, d, "imp", [["dnit-384-2022-me", 0]]);
        return d;
      } },
      { nome: "CAP-TLA 40/55 — solubilidade, cinzas e estabilidade fora, sem ensaio de TLA nem fator K", dados: function () {
        var d = { ident: { registro: "REC-TLA-EX-02", data: "2026-08-03", obra: "Obra B", origem: "Distribuidora B", camada: "CAP-TLA 40/55" },
          params: { classe: "40/55", inspecao: "ok", nf: "58811", quantidade: "29,4", procedencia: "Distribuidora B", certificado: "Q-1190",
            dataCert: "02/08/2026", dataCarga: "03/08/2026" },
          det: [{ pen: "52", pa: "51,0", bk135: "455", bk150: "231", bk175: "88", solub: "91,2", cinzas: "6,4", duct: "> 100", espuma: "não espuma" },
            { pen: "53", pa: "51,4", bk135: "448", solub: "91,0", cinzas: "6,6" }, { pen: "52" }] };
        A.exemplos.importar(FE.FICHAS["dnit-168-2013-em"].params, d, "imp", [["dnit-384-2022-me", 2]]);
        return d;
      } },
    ],
  });
  FE.FICHAS["dnit-168-2013-em"] = X.lote(F, { tabela: "Tabela 1 (Anexo A)", secao: "seção 7", secaoInspecao: "6", certificado: "4.5", contraprova: true, secaoUso: "5 a",
    extra: function (ctx) {
      var t = ctx.r.ensaios.filter(function (o) { return o.e.id === "tla"; })[0];
      if (t && t.situacao === null) ctx.linhas.push(A.marcar(A.linha({ criterio: "Presença de TLA (ASTM D6608-12)", secao: "6 b" }), "pendente",
        "ensaio obrigatório para a aceitação do carregamento não realizado"));
      if (!String(ctx.P.fatorK || "").trim()) ctx.linhas.push(A.marcar(A.linha({ criterio: "Fator de correção de finos K", secao: "4.5" }), "ressalva",
        "o certificado de análise deve informar o fator K"));
    } });
})();
