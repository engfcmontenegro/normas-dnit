/*
 * Ficha: DNIT 165/2013-EM — Emulsões asfálticas para pavimentação — recebimento do carregamento.
 * Usa o motor comum FE.recebimentoLigante, definido em site/fichas/dnit-095-2006-em.js (carregado antes).
 * Limites: Tabela 1 do Anexo A (normativo).
 */
(function () {
  "use strict";
  var FE = window.FE, ok = FE.ok, fmt = FE.fmt;
  var RL = FE.recebimentoLigante;
  if (!RL) { if (window.console) console.error("dnit-165-2013-em.js: carregue antes site/fichas/dnit-095-2006-em.js (motor de recebimento de ligantes)."); return; }
  var L = RL.L;

  // colunas da Tabela 1 (Anexo A)
  var C = ["RR-1C", "RR-2C", "RM-1C", "RM-2C", "RL-1C", "LA-1C", "LAN", "EAI", "LARC"];
  function por(vals) {  // um valor por classe, na ordem de C; null = "-" (não exigido)
    var o = {};
    C.forEach(function (c, i) { o[c] = vals[i] || null; });
    return o;
  }
  function mx(v) { return L(null, v); }
  function mn(v) { return L(v, null); }
  var _ = null;
  var G1 = "Ensaios na emulsão (Tabela 1)", G2 = "Destilação", G3 = "Desemulsibilidade e ruptura",
    G4 = "Ensaios no resíduo da emulsão obtido pela NBR 14896:2012";

  var ENSAIOS = [
    { id: "sf25", grupo: G1, r: "Viscosidade Saybolt-Furol a 25 °C, máx.", u: "s", casas: 1, metodo: "NBR 14491:2007",
      lim: por([mx(90), _, _, _, mx(90), mx(90), mx(90), mx(90), mx(90)]) },
    { id: "sf50", grupo: G1, r: "Viscosidade Saybolt-Furol a 50 °C", u: "s", casas: 1, metodo: "NBR 14491:2007",
      lim: por([_, L(100, 400), L(20, 200), L(100, 400), _, _, _, _, _]) },
    { id: "sed", grupo: G1, r: "Sedimentação, máx.", u: "% m/m", casas: 1, metodo: "NBR 6570:2010",
      lim: por([mx(5), mx(5), mx(5), mx(5), mx(5), mx(5), mx(5), mx(10), mx(5)]) },
    { id: "pen084", grupo: G1, r: "Peneiração (0,84 mm), máx.", u: "% m/m", casas: 2, metodo: "NBR 14393:2012",
      lim: por(C.map(function () { return mx(0.1); })) },
    { id: "agua", grupo: G1, r: "Resistência à água (cobertura), mín. (nota 2)", u: "%", casas: 0, metodo: "NBR 14249:2007",
      lim: por([mn(80), mn(80), mn(80), mn(80), _, _, _, _, _]) },
    { id: "adesiv", grupo: G1, r: "Adesividade em agregado miúdo, mín.", u: "%", casas: 0, metodo: "NBR 14757:2001",
      lim: por([_, _, _, _, _, mn(75), _, _, mn(75)]) },
    { id: "carga", grupo: G1, tipo: "qual", r: "Carga da partícula", u: "", metodo: "NBR 6567:2009 · DNIT 156/2011-ME", ph: "positiva / negativa / neutra",
      lim: por([{ igual: "positiva" }, { igual: "positiva" }, { igual: "positiva" }, { igual: "positiva" }, { igual: "positiva" }, { igual: "positiva" },
        { igual: "neutra" }, _, { igual: "positiva" }]),
      opcoes: [["pos", "positiva", /^(pos|\+|cati)/i], ["neg", "negativa", /^(neg|−|-|ani)/i], ["neu", "neutra", /^neu/i]] },
    { id: "ph", grupo: G1, r: "pH, máx.", u: "", casas: 1, metodo: "NBR 6299:2012",
      lim: por([_, _, _, _, mx(6.5), _, mx(6.5), mx(8), mx(6.5)]) },
    { id: "solv", grupo: G2, r: "Solvente destilado", u: "% v/v", casas: 1, metodo: "NBR 6568:2005",
      lim: por([_, _, L(0, 12), L(0, 12), _, _, _, L(0, 15), _]) },
    { id: "residuo", grupo: G2, r: "Resíduo seco, mín.", u: "% m/m", casas: 1, metodo: "NBR 14376:2007",
      lim: por([mn(62), mn(67), mn(62), mn(65), mn(60), mn(60), mn(60), mn(45), mn(60)]) },
    { id: "desem", grupo: G3, r: "Desemulsibilidade", u: "% m/m", casas: 1, metodo: "NBR 6569:2008 · DNIT 157/2011-ME",
      lim: por([mn(50), mn(50), mx(50), mx(50), _, _, _, _, _]) },
    { id: "filer", grupo: G3, r: "Ruptura — mistura com fíler silícico", u: "%", casas: 1, metodo: "NBR 6302:2008",
      lim: por([_, _, _, _, mx(2.0), L(1.2, 2.0), _, _, mn(2.0)]) },
    { id: "cimento", grupo: G3, r: "Ruptura — mistura com cimento", u: "%", casas: 1, metodo: "NBR 6297:2012",
      lim: por([_, _, _, _, mx(2.0), mx(2.0), _, _, mn(2.0)]) },
    { id: "penRes", grupo: G4, r: "Penetração a 25 °C (100 g, 5 s) — 4,0 a 15,0 mm = 40 a 150 × 0,1 mm", curto: "Penetração a 25 °C (100 g, 5 s)", u: "0,1 mm", casas: 0,
      metodo: "NBR 6576:2007 · DNIT 155/2010-ME", nMin: 3, nMinRef: "NBR 6576", verifica: RL.tolPenetracao("Penetração do resíduo"),
      lim: por([L(40, 150), L(40, 150), L(40, 150), L(40, 150), L(40, 150), L(40, 150), L(40, 150), _, L(40, 150)]) },
    { id: "betume", grupo: G4, r: "Teor de betume, mín.", u: "%", casas: 1, metodo: "NBR 14855:2002",
      lim: por(C.map(function () { return mn(97); })) },
    { id: "duct", grupo: G4, r: "Ductilidade a 25 °C, mín. (\"> 100\" se passar do curso)", curto: "Ductilidade a 25 °C, mín.", u: "cm", casas: 0, metodo: "NBR 6293:2001",
      ph: "ex.: > 100", lim: por(C.map(function () { return mn(40); })) },
  ];

  FE.FICHAS["dnit-165-2013-em"] = RL.criar({
    titulo: "Recebimento de emulsão asfáltica",
    resumo: "Ensaios de recebimento do carregamento comparados com a Tabela 1 do Anexo A (RR-1C, RR-2C, RM-1C, RM-2C, RL-1C, LA-1C, LAN, EAI, LARC): viscosidade Saybolt-Furol, sedimentação, peneiração, carga, pH, destilação, resíduo, desemulsibilidade, ruptura e ensaios no resíduo.",
    tabela: "Tabela 1 (Anexo A)",
    textoTodos: "A amostra deve ser submetida aos ensaios da Tabela 1 do Anexo A (7.1); o resultado geral vale só para os ensaios realizados.",
    rotuloClasse: "Tipo/classe da emulsão",
    classes: C.map(function (c) {
      var n = { "RR-1C": "ruptura rápida", "RR-2C": "ruptura rápida", "RM-1C": "ruptura média", "RM-2C": "ruptura média", "RL-1C": "ruptura lenta",
        "LA-1C": "lama asfáltica, catiônica", "LAN": "lama asfáltica, carga neutra", "EAI": "imprimação", "LARC": "lama asfáltica, ruptura controlada" }[c];
      return [c, c + " — " + n];
    }),
    padrao: { classe: "RR-2C" },
    ensaios: ENSAIOS,
    avisos: function (res, V, P, avisos, geral) {
      var dias = RL.diasEntre(P.dataCert, P.dataCarga);
      if (ok(dias) && dias > 3) avisos.push("Entre a data do certificado (fabricação) e o carregamento passaram " + dias + " dias: a EM exige novos ensaios e novo certificado quando o período supera três dias (4.4).");
      if (ok(dias) && dias < 0) avisos.push("A data do carregamento é anterior à do certificado — confira.");
      if (geral === "reprovado") avisos.push("Carregamento não conforme: a rejeição deve ser confirmada por contraprova (7.1).");
    },
    notas: "Resultado de cada ensaio = média das determinações, comparada com a Tabela 1 do Anexo A da DNIT 165/2013-EM para a classe. " +
      "A penetração do resíduo (Tabela 1: 4,0 a 15,0 mm) é lançada em 0,1 mm (40 a 150). " +
      "Carregamento conforme quando todos os resultados atendem (7.3); não conforme, rejeitado se confirmado por contraprova (7.1). " +
      "Todo carregamento deve vir com o certificado de análise do fabricante (4.4).",
    exemplos: [
      { nome: "RR-2C — carregamento de 02/03/2026, reprovado (planilha do laboratório)", dados: function () {
        return { ident: { registro: "REC-RR2C-2026-03", data: "2026-03-02", obra: "Unidade A — usina de asfalto", origem: "Distribuidora C", camada: "RR-2C",
          laboratorista: "Equipe laboratório usina" },
          params: { classe: "RR-2C", procedencia: "Distribuidora C", dataCarga: "02/03/2026" },
          det: [{ sf50: "43", pen084: "1", residuo: "63,2" }, { sf50: "47", pen084: "0,8", residuo: "62,3" }, {}] };
      } },
      { nome: "EAI — carregamento de 01/11/2025 (planilha do laboratório)", dados: function () {
        return { ident: { registro: "REC-EAI-2025-11", data: "2025-11-01", obra: "Unidade A — usina de asfalto", origem: "Distribuidora C", camada: "EAI — imprimação",
          laboratorista: "Equipe laboratório usina" },
          params: { classe: "EAI", procedencia: "Distribuidora C", dataCarga: "01/11/2025" },
          det: [{ sf25: "20", pen084: "0", residuo: "59,1" }, { sf25: "22", pen084: "0,01", residuo: "58,1" }, {}] };
      } },
      { nome: "RR-1C — ensaios completos, certificado com mais de 3 dias", dados: function () {
        return { ident: { registro: "REC-RR1C-EX-03", obra: "Exemplo", origem: "Distribuidora A", camada: "RR-1C — pintura de ligação" },
          params: { classe: "RR-1C", nf: "552190", quantidade: "28,0", procedencia: "Distribuidora A", certificado: "EM-7781",
            dataCert: "02/04/2026", dataCarga: "07/04/2026", veiculo: "ABC-1D23" },
          det: [{ sf25: "45", sed: "2,1", pen084: "0,04", agua: "95", carga: "positiva", residuo: "63,5", desem: "62", penRes: "72", betume: "99,6", duct: "> 100" },
            { sf25: "47", sed: "2,3", pen084: "0,03", residuo: "63,9", desem: "64", penRes: "74", duct: "> 100" },
            { penRes: "73" }] };
      } },
    ],
  });
})();
