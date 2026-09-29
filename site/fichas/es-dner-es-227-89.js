/*
 * Ficha de ACEITAÇÃO DO MATERIAL: DNER-ES 227/89 — Agregados sintéticos graúdos de argila calcinada — emprego em
 * obras rodoviárias.
 *
 * O que a ES manda (seções do PDF):
 *   4.1  Quadro "Utilização dos agregados sintéticos graúdos": classe e grupo admitidos por natureza do serviço
 *        (tratamentos superficiais: IA; revestimento de CA: IA, IIA; bases de CA: IA…IIC; concreto leve exposto: IA;
 *        pavimento de CCP: IA, IB; base de CCP: IA, IB, IC, IIA, IIB; base flexível: IA…IIC).
 *        Nota 1: em tratamentos superficiais o material deve ser mantido seco durante a construção.
 *        Nota 2: em concreto leve, o agregado deve ser inócuo no ensaio de reatividade potencial (ASTM C 289).
 *   2.1  a classe e o grupo são os da DNER-EM 230 (hoje DNER-EM 230/94, Tabela do item 5.1):
 *        classe I (argila expandida): massa unitária solta 0,560 a 0,880 t/m³ (NBR 7251);
 *        classe II (não expandida): massa unitária ≥ 0,880 t/m³;
 *        grupo A: perda após fervura ≤ 6 % (DNER-ME 225) e abrasão ≤ 35 % (DNER-ME 222); B: ≤ 6 % e ≤ 40 %; C: ≤ 10 % e ≤ 45 %.
 *   A ES não fixa frequência de ensaios: 1 determinação por lote de material, no mínimo.
 * Fichas de origem (importarVarios): DNER-ME 225 (perda após fervura) e DNER-ME 222 (desgaste por abrasão).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // Quadro 4.1 (PDF p. 2): natureza do serviço → classes e grupos admitidos
  var QUADRO = [
    ["ts", "Tratamentos superficiais (Nota 1)", ["IA"]],
    ["revCA", "Revestimento de concreto asfáltico", ["IA", "IIA"]],
    ["baseCA", "Bases de concreto asfáltico", ["IA", "IB", "IC", "IIA", "IIB", "IIC"]],
    ["leve", "Estruturas expostas de concreto leve de cimento Portland (Nota 2)", ["IA"]],
    ["pavCCP", "Pavimentos de concreto de cimento Portland", ["IA", "IB"]],
    ["baseCCP", "Bases de concreto de cimento Portland", ["IA", "IB", "IC", "IIA", "IIB"]],
    ["baseFlex", "Materiais para base flexível de pavimento", ["IA", "IB", "IC", "IIA", "IIB", "IIC"]],
  ];
  // DNER-EM 230/94, Tabela (5.1): grupo → [perda máx. %, abrasão máx. %]; classe → massa unitária [mín., máx.] t/m³
  var GRUPO = { A: [6, 35], B: [6, 40], C: [10, 45] };
  var CLASSE = { I: [0.560, 0.880], II: [0.880, NaN] };

  function servico(P) { return QUADRO.filter(function (q) { return q[0] === P.natureza; })[0] || QUADRO[0]; }
  // grupos admitidos para a classe declarada no serviço escolhido (ex.: revestimento de CA, classe II → ["A"])
  function gruposAdm(P) {
    var cl = P.classe === "II" ? "II" : "I";
    return servico(P)[2].filter(function (cg) { return cg.replace(/[ABC]$/, "") === cl; }).map(function (cg) { return cg.slice(-1); });
  }
  // limite do grupo menos exigente admitido (o material pode ser de qualquer grupo admitido); sem grupo admitido: grupo A
  function limGrupo(P, i) {
    var g = gruposAdm(P);
    return g.length ? Math.max.apply(null, g.map(function (x) { return GRUPO[x][i]; })) : GRUPO.A[i];
  }
  function vals(d, k) { return (d[k] || []).map(function (c) { return num(c.v); }).filter(ok); }

  A.fichaSimples({
    id: "dner-es-227-89",
    titulo: "Agregado sintético graúdo de argila calcinada — classe e grupo para o serviço (DNER-ES 227/89)",
    resumo: "Classifica o agregado pela DNER-EM 230 (massa unitária, perda após fervura e abrasão) e confere se a classe e o grupo obtidos são admitidos para a natureza do serviço (Quadro 4.1), com as Notas 1 e 2.",
    rotuloLink: "Aceitação do material",
    lote: false,
    refs: { regra: "4.1", tabela: "—" },
    params: [
      { k: "natureza", r: "Natureza do serviço (Quadro 4.1)", tipo: "select", recarrega: true,
        opcoes: QUADRO.map(function (q) { return [q[0], q[1] + " — " + q[2].join(", ")]; }) },
      { k: "classe", r: "Classe do agregado (DNER-EM 230, 4.1)", tipo: "select", recarrega: true,
        opcoes: [["I", "Classe I — argila expandida"], ["II", "Classe II — argila não expandida"]] },
      { k: "lote", r: "Lote / remessa de agregado", ph: "ex.: remessa 3 — 120 m³" },
    ],
    padrao: { natureza: "baseCA", classe: "I" },
    criterios: [
      { id: "mu", texto: "Massa unitária no estado solto", secao: "2.1 b / EM 230 5.1", tipo: "valor", unid: "t/m³", casas: 3,
        metodo: "NBR 7251 (MB-1665)", grupo: "Ensaios de classificação (DNER-EM 230)",
        min: function (P) { return CLASSE[P.classe === "II" ? "II" : "I"][0]; }, max: function (P) { return CLASSE[P.classe === "II" ? "II" : "I"][1]; } },
      { id: "perda", texto: "Perda de massa após fervura", secao: "2.1 c / EM 230 5.1", tipo: "valor", unid: "%", casas: 1,
        metodo: "DNER-ME 225", grupo: "Ensaios de classificação (DNER-EM 230)", max: function (P) { return limGrupo(P, 0); },
        importar: { de: "dner-me-225-94", valores: function (e) { return e.resultados.P; } } },
      { id: "abr", texto: "Desgaste por abrasão", secao: "2.1 d / EM 230 5.1", tipo: "valor", unid: "%", casas: 0,
        metodo: "DNER-ME 222", grupo: "Ensaios de classificação (DNER-EM 230)", max: function (P) { return limGrupo(P, 1); },
        importar: { de: "dner-me-222-94", valores: function (e) { return ok(e.resultados.final) ? e.resultados.final : e.resultados.An; } } },
      { id: "seco", texto: "Material mantido seco durante a construção", secao: "4.1 Nota 1", tipo: "sim_nao", grupo: "Condições do Quadro 4.1",
        exigido: "agregado seco na aplicação", se: function (P) { return P.natureza === "ts"; }, naoAplicaPor: "só em tratamentos superficiais" },
      { id: "reat", texto: "Reatividade potencial (método químico): agregado inócuo", secao: "4.1 Nota 2", tipo: "sim_nao", grupo: "Condições do Quadro 4.1",
        metodo: "ASTM C 289", exigido: "inócuo", se: function (P) { return P.natureza === "leve"; }, naoAplicaPor: "só em concreto leve de cimento Portland" },
    ],
    // classificação (EM 230) e confronto com o Quadro 4.1
    extra: function (ctx) {
      var d = ctx.d, P = ctx.P, mu = vals(d, "mu"), pe = vals(d, "perda"), ab = vals(d, "abr");
      var sv = servico(P), cl = P.classe === "II" ? "II" : "I";
      // classe pela massa unitária (todas as determinações)
      var clObt = !mu.length ? "" : mu.every(function (v) { return v >= 0.560 - 1e-9 && v <= 0.880 + 1e-9; }) ? "I" :
        mu.every(function (v) { return v >= 0.880 - 1e-9; }) ? "II" : "?";
      // grupo pelo pior valor de perda e de abrasão
      var pMax = pe.length ? Math.max.apply(null, pe) : NaN, aMax = ab.length ? Math.max.apply(null, ab) : NaN, gObt = "";
      if (ok(pMax) && ok(aMax)) ["A", "B", "C"].some(function (g) { if (pMax <= GRUPO[g][0] + 1e-9 && aMax <= GRUPO[g][1] + 1e-9) { gObt = g; return true; } return false; });
      var lc = A.linha({ id: "classif", grupo: "Classificação e emprego", criterio: "Classe e grupo obtidos (DNER-EM 230, Tabela 5.1)", secao: "EM 230 4 / 5.1",
        exigido: "classe " + cl + " (declarada)", n: Math.min(mu.length, pe.length, ab.length),
        resultado: !mu.length || !ok(pMax) || !ok(aMax) ? "—" : "classe " + (clObt === "?" ? "indefinida" : clObt) + " · grupo " + (gObt || "fora dos grupos") +
          " (perda máx. " + fmt(pMax, 1) + " %; abrasão máx. " + fmt(aMax, 0) + " %)" });
      if (!mu.length || !ok(pMax) || !ok(aMax)) A.marcar(lc, "sem_dados", "faltam massa unitária, perda após fervura ou abrasão");
      else {
        if (clObt !== cl) A.marcar(lc, "nao_conforme", clObt === "?" ? "massas unitárias em classes diferentes (" + mu.map(function (v) { return fmt(v, 3); }).join("; ") + " t/m³)" :
          "a massa unitária enquadra o agregado na classe " + clObt + ", não na classe " + cl + " declarada");
        if (!gObt) A.marcar(lc, "nao_conforme", "perda após fervura > 10 % ou abrasão > 45 %: não se enquadra em nenhum grupo (A, B ou C)");
        if (lc.situacao === "conforme") lc.motivo = "agregado " + cl + gObt;
      }
      ctx.linhas.push(lc);
      var cg = cl + gObt;
      var le = A.linha({ id: "emprego", grupo: "Classificação e emprego", criterio: "Emprego: " + sv[1], secao: "4.1 (Quadro)", exigido: sv[2].join(", "),
        n: lc.n, resultado: lc.situacao === "sem_dados" ? "—" : gObt && clObt === cl ? cg : "sem classe/grupo válido" });
      if (lc.situacao === "sem_dados") A.marcar(le, "sem_dados", "classificação incompleta");
      else if (!gruposAdm(P).length) A.marcar(le, "nao_conforme", "a classe " + cl + " não é admitida para este serviço (Quadro 4.1: " + sv[2].join(", ") + ")");
      else if (!gObt || clObt !== cl || sv[2].indexOf(cg) < 0) A.marcar(le, "nao_conforme", (gObt && clObt === cl ? "agregado " + cg : "agregado sem classe/grupo válido na DNER-EM 230, logo") + " não admitido (Quadro 4.1: " + sv[2].join(", ") + ")");
      else le.motivo = cg + " admitido para o serviço";
      ctx.linhas.push(le);
    },
    textos: {
      ACEITO: { titulo: "AGREGADO ACEITO PARA O SERVIÇO", texto: "Classe e grupo (DNER-EM 230) admitidos para a natureza do serviço no Quadro 4.1 da DNER-ES 227/89." },
      REJEITADO: { titulo: "AGREGADO REJEITADO PARA O SERVIÇO", texto: "Classe/grupo não admitidos para o serviço ou ensaio fora dos limites da DNER-EM 230 (6.2 da EM: rejeitar)." },
      PENDENTE: { titulo: "ACEITAÇÃO PENDENTE — ENSAIOS INCOMPLETOS", texto: "Faltam ensaios de classificação ou a verificação exigida pelas Notas do Quadro 4.1." },
    },
    notas: "DNER-ES 227/89, 4.1 (Quadro e Notas 1 e 2), com a classificação da DNER-EM 230/94 (4.1, 4.2 e Tabela do item 5.1). " +
      "Classe pela massa unitária solta (I: 0,560 a 0,880 t/m³; II: ≥ 0,880 t/m³); grupo pelo pior resultado de perda após fervura e de abrasão " +
      "(A: ≤ 6 % e ≤ 35 %; B: ≤ 6 % e ≤ 40 %; C: ≤ 10 % e ≤ 45 %). Os limites de perda e abrasão das tabelas de ensaio são os do grupo menos exigente " +
      "admitido para a classe no serviço escolhido. A ES não fixa frequência: no mínimo 1 determinação por lote.",
    exemplos: [
      { nome: "Argila expandida para base de concreto asfáltico — grupo A (aceito)", dados: function () {
        var P = { natureza: "baseCA", classe: "I", lote: "Remessa 1 — 80 m³" };
        var d = { ident: { registro: "LOTE-ASA-01", data: "2025-09-24", obra: "Obra A", origem: "Fornecedor A", camada: "Base de concreto asfáltico — agregado sintético" },
          params: P, mu: [{ pos: "remessa 1 — amostra 1", v: "0,712" }, { pos: "remessa 1 — amostra 2", v: "0,736" }] };
        var F = FE.FICHAS["dner-es-227-89"];
        A.exemplos.importar(F.params, d, "imp_perda", [["dner-me-225-94", 0]]);
        A.exemplos.importar(F.params, d, "imp_abr", [["dner-me-222-94", 0]]);
        return d;
      } },
      { nome: "Argila calcinada não expandida para revestimento de CA — fora dos grupos (rejeitado)", dados: function () {
        var P = { natureza: "revCA", classe: "II", lote: "Remessa 4 — 45 m³" };
        var d = { ident: { registro: "LOTE-ASA-02", data: "2025-09-25", obra: "Obra B", origem: "Jazida 2", camada: "Revestimento de CA — agregado sintético" },
          params: P, mu: [{ pos: "remessa 4 — amostra 1", v: "0,968" }, { pos: "remessa 4 — amostra 2", v: "0,951" }] };
        var F = FE.FICHAS["dner-es-227-89"];
        A.exemplos.importar(F.params, d, "imp_perda", [["dner-me-225-94", 1]]);
        A.exemplos.importar(F.params, d, "imp_abr", [["dner-me-222-94", 1]]);
        return d;
      } },
    ],
  });
})();
