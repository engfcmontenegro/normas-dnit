/*
 * Ficha: DNIT 128/2010-EM — Emulsões asfálticas catiônicas modificadas por polímeros elastoméricos — recebimento do carregamento.
 * Usa o motor FE.recebimentoLigante (site/fichas/dnit-095-2006-em.js) e as extensões FE.recebimentoLigante.ext
 * (site/fichas/dnit-129-2011-em.js, carregado antes). Limites: Tabela 1 do Anexo A (conferida no PDF, p. 4 — o markdown
 * desalinha as células mescladas do resíduo: PA 50/55, Brookfield 550/600 e RE 65/70 valem para RR1C-E / demais tipos).
 */
(function () {
  "use strict";
  var FE = window.FE, ok = FE.ok, A = FE.aceitacao;
  var RL = FE.recebimentoLigante, X = RL && RL.ext;
  if (!X) { if (window.console) console.error("dnit-128-2010-em.js: carregue antes site/fichas/dnit-095-2006-em.js e dnit-129-2011-em.js."); return; }
  var L = RL.L;

  var C = ["RR1C-E", "RR2C-E", "RM1C-E", "RC1C-E", "RL1C-E"];
  function por(vals) { var o = {}; C.forEach(function (c, i) { o[c] = vals[i] || null; }); return o; }
  function todos(l) { return por(C.map(function () { return l; })); }
  function mx(v) { return L(null, v); }
  function mn(v) { return L(v, null); }
  var _ = null;
  var G1 = "Ensaios para a emulsão (Tabela 1)", G2 = "Ensaios para o resíduo da emulsão obtido pela NBR 14896";

  var ENSAIOS = [
    { id: "sf50", grupo: G1, r: "Viscosidade Saybolt-Furol a 50 °C", u: "s", casas: 0, metodo: "NBR 14491",
      lim: por([mx(70), L(100, 400), L(20, 200), mx(70), mx(70)]) },
    { id: "sed", grupo: G1, r: "Sedimentação, máx.", u: "% massa", casas: 1, metodo: "NBR 6570 · DNER-ME 006/2000", lim: todos(mx(5)) },
    { id: "pen084", grupo: G1, r: "Peneiração (0,84 mm), máx.", u: "% massa", casas: 2, metodo: "NBR 14393", lim: todos(mx(0.1)) },
    { id: "aguaSeco", grupo: G1, r: "Resistência à água — cobertura, agregado seco, mín. (nota 1)", curto: "Resistência à água — agregado seco, mín.", u: "%", casas: 0,
      metodo: "NBR 6300", lim: todos(mn(80)) },
    { id: "aguaUmido", grupo: G1, r: "Resistência à água — cobertura, agregado úmido, mín. (nota 1)", curto: "Resistência à água — agregado úmido, mín.", u: "%", casas: 0,
      metodo: "NBR 6300", lim: por([mn(80), mn(80), mn(60), mn(60), mn(60)]) },
    { id: "carga", grupo: G1, tipo: "qual", r: "Carga da partícula", u: "", metodo: "NBR 6567", ph: "positiva / negativa", lim: todos({ igual: "positiva" }),
      opcoes: [["pos", "positiva", /^(pos|\+|cati)/i], ["neg", "negativa", /^(neg|−|-|ani)/i], ["neu", "neutra", /^neu/i]] },
    { id: "ph", grupo: G1, r: "pH, máx.", u: "", casas: 1, metodo: "NBR 6299", lim: por([_, _, _, mx(6.5), mx(6.5)]) },
    { id: "solv", grupo: G1, r: "Destilação — solvente destilado a 360 °C, máx.", u: "% volume", casas: 1, metodo: "NBR 6568",
      lim: por([mx(3), mx(3), mx(12), mx(0), mx(0)]) },
    { id: "residuo", grupo: G1, r: "Resíduo seco, mín.", u: "% massa", casas: 1, metodo: "NBR 14376", lim: por([mn(62), mn(67), mn(62), mn(62), mn(60)]) },
    { id: "desem", grupo: G1, r: "Desemulsibilidade", u: "% massa", casas: 1, metodo: "NBR 6569", lim: por([mn(50), mn(50), mx(50), _, _]) },
    { id: "penRes", grupo: G2, r: "Penetração a 25 °C, 100 g, 5 s", u: "0,1 mm", casas: 0, metodo: "NBR 6576", nMin: 3, nMinRef: "NBR 6576",
      verifica: RL.tolPenetracao("Penetração do resíduo"), lim: todos(L(45, 150)) },
    { id: "pa", grupo: G2, r: "Ponto de amolecimento, mín.", u: "°C", casas: 1, metodo: "NBR 6560 · DNIT 131/2010-ME", lim: por([mn(50), mn(55), mn(55), mn(55), mn(55)]) },
    { id: "bk135", grupo: G2, r: "Viscosidade Brookfield a 135 °C, spindle 21, 20 rpm, mín.", u: "cP", casas: 0, metodo: "NBR 15184",
      lim: por([mn(550), mn(600), mn(600), mn(600), mn(600)]) },
    { id: "re", grupo: G2, r: "Recuperação elástica a 25 °C, 20 cm, mín.", u: "%", casas: 0, metodo: "NBR 15086 · DNIT 130/2010-ME",
      lim: por([mn(65), mn(70), mn(70), mn(70), mn(70)]) },
  ];

  var MAPAS = {
    "dner-me-006-00": X.M.sed("sed"),
    "dnit-131-2010-me": X.M.pa({ rtfot: "" }),
    "dnit-130-2010-me": X.M.re({ rtfot: "" }),
  };
  var NOMES = { "RR1C-E": "ruptura rápida", "RR2C-E": "ruptura rápida", "RM1C-E": "ruptura média", "RC1C-E": "ruptura controlada", "RL1C-E": "ruptura lenta" };

  var F = RL.criar({
    titulo: "Recebimento de emulsão catiônica modificada por polímero elastomérico",
    resumo: "Ensaios de recebimento do carregamento comparados com a Tabela 1 do Anexo A (RR1C-E, RR2C-E, RM1C-E, RC1C-E, RL1C-E): Saybolt-Furol, sedimentação, peneiração, " +
      "resistência à água, carga, pH, destilação, resíduo, desemulsibilidade e, no resíduo, penetração, PA, Brookfield e recuperação elástica; importa sedimentação, PA e RE das fichas ME.",
    tabela: "Tabela 1 (Anexo A)",
    textoTodos: "A amostra deve ser submetida aos ensaios da Tabela 1 do Anexo A (7.1); o resultado geral vale só para os ensaios realizados.",
    rotuloClasse: "Tipo da emulsão modificada",
    classes: C.map(function (c) { return [c, c + " — " + NOMES[c]]; }),
    padrao: { classe: "RR2C-E", inspecao: "ok" },
    params: [
      X.paramInspecao("6 e 4.2", [["rompida", "Emulsão rompida parcial ou totalmente (4.2)"]]),
      { k: "agregado", r: "Natureza do agregado da resistência à água (nota 1)", ph: "ex.: granito da Pedreira X, enviado pelo executante",
        dica: "sem amostra/informação do executante, o laboratório indica no certificado a natureza do agregado usado" },
    ].concat(X.importar("dnit-128-2010-em", MAPAS,
      "DNER-ME 006 (sedimentação), DNIT 131 (PA do resíduo), DNIT 130 (RE do resíduo; a Tabela 1 cita a NBR 15086)")),
    ensaios: ENSAIOS,
    avisos: function (res, V, P, avisos) {
      if ((ok(V.aguaSeco) || ok(V.aguaUmido)) && !String(P.agregado || "").trim())
        avisos.push("Resistência à água: indique a natureza do agregado usado no ensaio (nota 1 da Tabela 1).");
      if (/DNIT 130/.test(P.origemImp || "")) avisos.push("Recuperação elástica importada da DNIT 130/2010-ME; a Tabela 1 cita a NBR 15086 (mesmo ensaio no ductilômetro, 25 °C, 20 cm).");
    },
    notas: "Resultado de cada ensaio = média das determinações, comparada com a Tabela 1 do Anexo A da DNIT 128/2010-EM para o tipo. " +
      "Os ensaios no resíduo usam o resíduo obtido pela NBR 14896. A emulsão não deve chegar rompida, parcial ou totalmente (4.2). " +
      "Certificado do fabricante com cada carregamento; novos ensaios e novo certificado se a fabricação e o carregamento distarem mais de 3 dias (4.3). " +
      "Aceitação (7.1 e 7.3): todos os resultados atendendo, o carregamento é conforme; algum fora, é não conforme e rejeitado se a contraprova confirmar.",
    exemplos: [
      { nome: "RR2C-E — pintura de ligação, carregamento aceito", dados: function () {
        return { ident: { registro: "REC-RR2CE-EX-01", data: "2026-05-06", obra: "Obra A — pintura de ligação", origem: "Distribuidora A", camada: "RR2C-E" },
          params: { classe: "RR2C-E", inspecao: "ok", agregado: "gnaisse — Pedreira X", nf: "220415", quantidade: "29,0", procedencia: "Distribuidora A",
            certificado: "EMP-2026-051", dataCert: "05/05/2026", dataCarga: "05/05/2026" },
          det: [{ sf50: "185", sed: "1,8", pen084: "0,03", aguaSeco: "95", aguaUmido: "90", carga: "positiva", solv: "0,0", residuo: "68,1", desem: "72",
            penRes: "62", pa: "58,2", bk135: "860", re: "78" },
          { sf50: "192", sed: "2,0", pen084: "0,02", residuo: "67,8", desem: "70", penRes: "64", pa: "58,6", bk135: "845", re: "76" },
          { penRes: "63" }] };
      } },
      { nome: "RM1C-E — resíduo e RE abaixo do mínimo, emulsão parcialmente rompida", dados: function () {
        var d = { ident: { registro: "REC-RM1CE-EX-02", data: "2026-06-02", obra: "Obra B", origem: "Distribuidora B", camada: "RM1C-E" },
          params: { classe: "RM1C-E", inspecao: "rompida", nf: "90871", quantidade: "25,5", procedencia: "Distribuidora B", dataCert: "01/06/2026", dataCarga: "02/06/2026" },
          det: [{ sf50: "140", pen084: "0,05", aguaSeco: "85", aguaUmido: "70", carga: "positiva", solv: "8,5", residuo: "60,4", desem: "35", penRes: "88", pa: "56,0", bk135: "640", re: "62" },
          { sf50: "146", residuo: "60,9", desem: "38", penRes: "90", re: "64" }, { penRes: "87" }] };
        A.exemplos.importar(FE.FICHAS["dnit-128-2010-em"].params, d, "imp", [["dner-me-006-00", 0]]);
        return d;
      } },
    ],
  });
  FE.FICHAS["dnit-128-2010-em"] = X.lote(F, { tabela: "Tabela 1 (Anexo A)", secao: "7.1 e 7.3", secaoInspecao: "6", certificado: "4.3", contraprova: true, secaoUso: "5.1",
    extra: function (ctx) {
      if (ctx.P.inspecao === "rompida") ctx.linhas.push(A.marcar(A.linha({ criterio: "Estado da emulsão", secao: "4.2" }), "nao_conforme",
        "emulsão rompida parcial ou totalmente — a EM exige emulsão não rompida"));
    } });
})();
