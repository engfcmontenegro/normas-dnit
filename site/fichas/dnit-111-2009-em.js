/*
 * Ficha: DNIT 111/2009-EM — Cimento asfáltico modificado por borracha de pneus inservíveis, via úmida, "Terminal Blending"
 * (asfalto-borracha AB 8 e AB 22) — recebimento do carregamento.
 * Usa o motor FE.recebimentoLigante (site/fichas/dnit-095-2006-em.js) e as extensões FE.recebimentoLigante.ext
 * (site/fichas/dnit-129-2011-em.js, carregado antes). Limites: Tabela 1 do Anexo A (conferida no PDF).
 */
(function () {
  "use strict";
  var FE = window.FE, ok = FE.ok, fmt = FE.fmt, num = FE.num, A = FE.aceitacao;
  var RL = FE.recebimentoLigante, X = RL && RL.ext;
  if (!X) { if (window.console) console.error("dnit-111-2009-em.js: carregue antes site/fichas/dnit-095-2006-em.js e dnit-129-2011-em.js."); return; }
  var L = RL.L;

  var C = ["AB8", "AB22"];
  function por(a, b) { return { AB8: a, AB22: b }; }
  function todos(l) { return por(l, l); }
  var G1 = "Asfalto-borracha — ligante original (Tabela 1)", G2 = "Efeito do calor e do ar — RTFOT a 163 °C (NBR 15235), ensaios no resíduo";

  var ENSAIOS = [
    { id: "pen", grupo: G1, r: "Penetração (100 g, 5 s, 25 °C)", u: "0,1 mm", casas: 0, metodo: "DNER-ME 003/99", lim: todos(L(30, 70)),
      nMin: 3, nMinRef: "DNER-ME 003 / NBR 6576", verifica: RL.tolPenetracao("Penetração") },
    { id: "pa", grupo: G1, r: "Ponto de amolecimento, mín.", u: "°C", casas: 1, metodo: "DNER-ME 247/94 (citado) · DNIT 131/2010-ME", lim: por(L(55, null), L(57, null)) },
    { id: "bk175", grupo: G1, r: "Viscosidade Brookfield a 175 °C, 20 rpm, spindle 3", u: "cP", casas: 0, metodo: "NBR 15529", lim: por(L(800, 2000), L(2200, 4000)) },
    { id: "fulgor", grupo: G1, r: "Ponto de fulgor, mín.", u: "°C", casas: 0, metodo: "DNER-ME 148/94", lim: todos(L(235, null)) },
    { id: "re", grupo: G1, r: "Recuperação elástica no ductilômetro, 25 °C, 10 cm, mín.", u: "%", casas: 0, metodo: "NBR 15086:2006", lim: por(L(50, null), L(55, null)) },
    { id: "estab", grupo: G1, r: "Estabilidade à estocagem (diferença de PA), máx.", u: "°C", casas: 1, metodo: "DNER-ME 384/99 (atual DNIT 384/2022-ME)", abs: true,
      lim: todos(L(null, 9)) },
    X.espuma(G1, todos({ igual: "não espuma" }), "seção 4, a 175 °C"),
    X.rtfotMassa(G2, todos(L(null, 1)), "NBR 15235:2006"),
    { id: "paR", grupo: G2, tipo: "aux", r: "Ponto de amolecimento após RTFOT", u: "°C", casas: 1 },
    { id: "dpa", grupo: G2, tipo: "deriv", r: "Variação do ponto de amolecimento, máx.", curto: "Variação do PA, máx. (em módulo)", u: "°C", casas: 1,
      metodo: "DNER-ME 247/94 (citado) · DNIT 131/2010-ME", usa: ["paR", "pa"], abs: true, formula: "PA após RTFOT − PA original (comparada em módulo)",
      lim: todos(L(null, 10)), f: function (V) { return V.paR - V.pa; } },
    { id: "penR", grupo: G2, tipo: "aux", r: "Penetração após RTFOT (100 g, 5 s, 25 °C)", u: "0,1 mm", casas: 1, verifica: RL.tolPenetracao("Penetração após RTFOT") },
    { id: "pret", grupo: G2, tipo: "deriv", r: "Porcentagem de penetração original, mín.", u: "%", casas: 0, metodo: "DNER-ME 003/99", usa: ["penR", "pen"],
      formula: "PEN após RTFOT / PEN original × 100", lim: todos(L(55, null)), f: function (V) { return V.pen > 0 ? V.penR / V.pen * 100 : NaN; } },
    { id: "reR", grupo: G2, tipo: "aux", r: "Recuperação elástica após RTFOT (25 °C, 10 cm)", u: "%", casas: 0 },
    { id: "reret", grupo: G2, tipo: "deriv", r: "Porcentagem da recuperação elástica original, 25 °C, 10 cm, mín.", curto: "% da RE original, mín.", u: "%", casas: 0,
      metodo: "NBR 15086:2006", usa: ["reR", "re"], formula: "RE após RTFOT / RE original × 100", lim: todos(L(100, null)),
      f: function (V) { return V.re > 0 ? V.reR / V.re * 100 : NaN; } },
  ];

  var MAPAS = {
    "dnit-131-2010-me": X.M.pa(), "dnit-130-2010-me": X.M.re(), "dner-me-148-94": X.M.fulgor(), "dnit-384-2022-me": X.M.estab("estab"),
  };

  var F = RL.criar({
    titulo: "Recebimento de asfalto-borracha (AB 8 / AB 22)",
    resumo: "Ensaios de recebimento do carregamento de asfalto-borracha via úmida, \"Terminal Blending\", comparados com a Tabela 1 do Anexo A (AB 8, AB 22): penetração, " +
      "ponto de amolecimento, Brookfield a 175 °C, fulgor, recuperação elástica, estabilidade à estocagem, espuma e RTFOT; importa PA, RE, fulgor e estabilidade das fichas ME.",
    tabela: "Tabela 1 (Anexo A)",
    textoTodos: "A amostra deve ser submetida aos ensaios da Tabela 1 do Anexo A (seção 7); o resultado geral vale só para os ensaios realizados.",
    rotuloClasse: "Tipo do asfalto-borracha",
    classes: [["AB8", "AB 8"], ["AB22", "AB 22"]],
    padrao: { classe: "AB8", inspecao: "ok" },
    params: [
      X.paramInspecao("6"),
      { k: "borracha", r: "Teor de borracha declarado (% em peso) — 5 a", ph: "ex.: 15", dica: "mínimo de 15 % como referência (5 a)" },
      { k: "distancia", r: "Distância de transporte fabricante → canteiro (km) — seção 4", ph: "ex.: 320" },
    ].concat(X.importar("dnit-111-2009-em", MAPAS,
      "DNIT 131 (PA; após RTFOT → PA após RTFOT), DNIT 130 (RE a 20 cm — a Tabela 1 pede 10 cm), DNER-ME 148 (fulgor), DNIT 384 (estabilidade à estocagem)")),
    dicaTabela: "RTFOT: uma coluna por recipiente; PA, penetração e RE após RTFOT medidos no resíduo do RTFOT",
    ensaios: ENSAIOS,
    avisos: function (res, V, P, avisos) {
      if (ok(V.penR) && !ok(V.pen)) avisos.push("Porcentagem de penetração original: informe também a penetração do ligante original.");
      if (ok(V.paR) && !ok(V.pa)) avisos.push("Variação do PA: informe também o ponto de amolecimento do ligante original.");
      if (ok(V.reR) && !ok(V.re)) avisos.push("% da RE original: informe também a recuperação elástica do ligante original.");
      if (/DNIT 130/.test(P.origemImp || "")) avisos.push("Recuperação elástica importada da DNIT 130/2010-ME (alongamento de 20 cm); a Tabela 1 pede NBR 15086 com 10 cm — confira as condições do ensaio.");
    },
    notas: "Resultado de cada ensaio = média das determinações, comparada com a Tabela 1 do Anexo A da DNIT 111/2009-EM para o tipo. " +
      "Ensaios após RTFOT no resíduo da NBR 15235 (nota da Tabela 1). ΔM = (Mi − Mf) / Mi × 100 e variação do PA = PA após RTFOT − PA original, " +
      "ambas comparadas em módulo com o máximo (a Tabela 1 dá só \"máx.\", sem sinal). % da penetração original = PEN após / PEN original × 100; % da RE original = RE após / RE original × 100. " +
      "O asfalto-borracha deve ser homogêneo, sem água e não espumar a 175 °C (seção 4); teor de borracha de referência ≥ 15 % (5 a). " +
      "Certificado do fabricante com cada carregamento; novos ensaios e novo certificado se a fabricação e o carregamento distarem mais de 3 dias (seção 4). " +
      "Aceitação (seção 7): todos os resultados atendendo, o carregamento é aceito; algum fora, é rejeitado se a contraprova confirmar.",
    exemplos: [
      { nome: "AB 8 — carregamento aceito (estabilidade importada da DNIT 384)", dados: function () {
        var d = { ident: { registro: "REC-AB8-EX-01", data: "2026-02-18", obra: "Obra A — usina de asfalto", origem: "Fornecedor A", camada: "Asfalto-borracha AB 8" },
          params: { classe: "AB8", inspecao: "ok", borracha: "16", distancia: "280", nf: "008812", quantidade: "27,6", procedencia: "Fornecedor A", certificado: "AB-0218",
            dataCert: "17/02/2026", dataCarga: "17/02/2026" },
          det: [{ pen: "48", pa: "58,4", bk175: "1480", fulgor: "292", re: "62", espuma: "não espuma", mi: "35,020", mf: "34,842", paR: "61,8", penR: "33", reR: "66" },
            { pen: "49", pa: "58,8", bk175: "1520", fulgor: "288", re: "60", mi: "35,104", mf: "34,930", paR: "62,2", penR: "32", reR: "64" },
            { pen: "47", penR: "33" }] };
        A.exemplos.importar(FE.FICHAS["dnit-111-2009-em"].params, d, "imp", [["dnit-384-2022-me", 1]]);
        return d;
      } },
      { nome: "AB 22 — Brookfield e % da RE original abaixo, teor de borracha < 15 %", dados: function () {
        return { ident: { registro: "REC-AB22-EX-02", data: "2026-03-25", obra: "Obra B", origem: "Fornecedor B", camada: "Asfalto-borracha AB 22" },
          params: { classe: "AB22", inspecao: "ok", borracha: "12", nf: "44120", quantidade: "26,0", procedencia: "Fornecedor B", certificado: "TB-3321",
            dataCert: "24/03/2026", dataCarga: "25/03/2026" },
          det: [{ pen: "41", pa: "59,6", bk175: "2050", fulgor: "276", re: "61", estab: "7,4", espuma: "não espuma", mi: "35,210", mf: "34,960", paR: "70,2", penR: "24", reR: "55" },
            { pen: "42", pa: "60,0", bk175: "2110", fulgor: "280", re: "63", mi: "35,150", mf: "34,905", paR: "70,6", penR: "23", reR: "57" },
            { pen: "42", penR: "24" }] };
      } },
    ],
  });
  FE.FICHAS["dnit-111-2009-em"] = X.lote(F, { tabela: "Tabela 1 (Anexo A)", secao: "seção 7", secaoInspecao: "6", certificado: "4", contraprova: true, secaoUso: "5 b",
    extra: function (ctx) {
      var b = num(ctx.P.borracha);
      if (ok(b) && b < 15) ctx.linhas.push(A.marcar(A.linha({ criterio: "Teor de borracha declarado", secao: "5 a" }), "ressalva",
        "teor de " + fmt(b, 1) + " % abaixo da referência de 15 % em peso"));
    } });
})();
