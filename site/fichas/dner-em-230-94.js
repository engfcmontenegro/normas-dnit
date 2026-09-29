/*
 * Ficha: DNER-EM 230/94 — Agregados sintéticos graúdos de argila calcinada — aceitação do lote.
 * Motor FE.recebimentoMaterialEM (site/fichas/dner-em-036-95.js). Classe I (argila expandida) / II (não expandida),
 * grupos A, B e C (Tabela da seção 5.1): massa unitária (NBR 7251 → DNIT 437-ME), perda de massa após fervura
 * (DNER-ME 225) e desgaste por abrasão (DNER-ME 222); reatividade potencial (ASTM C 289) no emprego em concreto (5.2).
 */
(function () {
  "use strict";
  var FE = window.FE, RM = FE.recebimentoMaterialEM, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-em-230-94";
  var GRUPO = { A: { pf: 6, ab: 35 }, B: { pf: 6, ab: 40 }, C: { pf: 10, ab: 45 } };
  var CL = [];
  ["I", "II"].forEach(function (c) { ["A", "B", "C"].forEach(function (g) { CL.push([c + "-" + g, "Classe " + c + " (" + (c === "I" ? "argila expandida" : "argila não expandida") + ") — grupo " + g]); }); });
  function cg(P) { var s = String(P.classe || "I-A").split("-"); return { c: s[0], g: s[1] || "A" }; }
  var G = "Requisitos da Tabela (5.1)";

  // enquadramento do material nas classes/grupos da Tabela, pelos resultados
  function enquadrar(V) {
    var mu = V.mu, pf = V.pf, ab = V.ab, cls = [];
    if (ok(mu)) {
      if (mu >= 0.560 - 1e-9 && mu <= 0.880 + 1e-9) cls.push("I");
      if (mu >= 0.880 - 1e-9) cls.push("II");
    }
    var grupos = ["A", "B", "C"].filter(function (g) { return (!ok(pf) || pf <= GRUPO[g].pf + 1e-9) && (!ok(ab) || ab <= GRUPO[g].ab + 1e-9); });
    return { cls: cls, grupo: ok(pf) || ok(ab) ? grupos[0] || null : undefined };
  }

  FE.FICHAS[ID] = RM.criar({
    titulo: "Aceitação de agregado sintético graúdo de argila calcinada",
    resumo: "Classe I (expandida) ou II (não expandida), grupos A, B e C: massa unitária no estado solto, perda de massa após fervura e desgaste por abrasão comparados com a Tabela (5.1); reatividade potencial no emprego em concreto (5.2); enquadramento do material nas classes/grupos e parecer (6).",
    tabela: "Tabela da DNER-EM 230/94",
    classes: CL,
    rotuloClasse: "Classe e grupo exigidos (projeto)",
    padrao: { classe: "I-A", concreto: "nao" },
    params: [
      { k: "concreto", r: "Emprego em estruturas de concreto (5.2)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim — exige reatividade potencial (ASTM C 289)"]] },
    ],
    lote: { unid: "m³", rotuloFornecedor: "Fábrica / fornecedor" },
    rotuloDet: "Amostra",
    ensaios: [
      { id: "mu", grupo: G, r: "Massa unitária no estado solto", metodo: "NBR 7251 (DNIT 437-ME)", secao: "5.1", u: "t/m³", casas: 3,
        lim: function (P) { return cg(P).c === "I" ? { min: 0.560, max: 0.880, casas: 3 } : { min: 0.880, casas: 3 }; } },
      { id: "pf", grupo: G, r: "Perda de massa após fervura", metodo: "DNER-ME 225/94", secao: "5.1", u: "%", casas: 1, lim: function (P) { return { max: GRUPO[cg(P).g].pf, casas: 0 }; } },
      { id: "ab", grupo: G, r: "Desgaste por abrasão", metodo: "DNER-ME 222/94", secao: "5.1", u: "%", casas: 0, lim: function (P) { return { max: GRUPO[cg(P).g].ab, casas: 0 }; } },
      { id: "reat", grupo: "Emprego em concreto (5.2)", r: "Reatividade potencial — agregado inócuo", metodo: "ASTM C 289", secao: "5.2", tipo: "qual",
        se: function (P) { return P.concreto === "sim"; }, lim: { texto: "inócuo" }, ph: "inócuo / deletério",
        opcoes: [["ino", "inócuo", /^(in[oó]cuo|n[aã]o reativo|ok|atende)/i, true], ["del", "deletério / potencialmente reativo", /^(del|reativo|potencial|n[aã]o atende)/i, false]] },
    ],
    importar: [
      { k: "impMU", r: "Importar massa unitária (DNIT 437-ME)", de: "dnit-437-2022-me", ensaios: ["mu"],
        valores: function (e) { var s = e.resultados.solto || {}; return { mu: ok(s.MU) ? s.MU / 1000 : NaN }; },
        rot: function (e) { var s = e.resultados.solto || {}; return ok(s.MU) ? fmt(s.MU / 1000, 3) + " t/m³" : ""; } },
      { k: "impPF", r: "Importar perda de massa após fervura (DNER-ME 225)", de: "dner-me-225-94", ensaios: ["pf"],
        valores: function (e) { return { pf: e.resultados.P }; } },
      { k: "impAB", r: "Importar desgaste por abrasão (DNER-ME 222)", de: "dner-me-222-94", ensaios: ["ab"],
        valores: function (e) { return { ab: ok(e.resultados.final) ? e.resultados.final : e.resultados.An }; },
        rot: function (e) { return e.resultados.g ? "graduação " + e.resultados.g : ""; } },
    ],
    extra: function (ctx) {
      var q = enquadrar(ctx.V), P = ctx.P, x = cg(P);
      var txt = (q.cls.length ? "classe " + q.cls.join(" ou ") : ok(ctx.V.mu) ? "massa unitária abaixo de 0,560 t/m³ (fora das classes)" : "classe: falta a massa unitária") +
        (q.grupo === undefined ? "" : q.grupo ? ", grupo " + q.grupo + (q.grupo !== "C" ? " (atende também os grupos seguintes)" : "") : ", nenhum grupo (perda/abrasão acima do grupo C)");
      ctx.extraRes = { enquadramento: txt, q: q };
      var l = ctx.A.linha({ id: "enq", grupo: "Classificação (4)", criterio: "Enquadramento do material pelos resultados", secao: "4.1 / 4.2", n: ok(ctx.V.mu) || ok(ctx.V.pf) || ok(ctx.V.ab) ? 1 : 0,
        resultado: txt, exigido: "classe " + x.c + ", grupo " + x.g, situacao: "informativo" });
      ctx.linhas.push(l);
      if (ok(ctx.V.mu) && Math.abs(ctx.V.mu - 0.880) < 1e-9) ctx.avisos.push("Massa unitária de 0,880 t/m³: é o máximo da classe I e o mínimo da classe II na Tabela — o limite pertence às duas.");
    },
    notas: "Tabela da seção 5.1 da DNER-EM 230/94: classe I (argila expandida) — massa unitária de 0,560 a 0,880 t/m³; classe II (não expandida) — mín. 0,880 t/m³; perda de massa após fervura " +
      "máx. 6 % (grupos A e B) e 10 % (C); desgaste por abrasão máx. 35 % (A), 40 % (B) e 45 % (C). Resultado = média das amostras. 5.2: no emprego em concreto, o agregado deve ser inócuo " +
      "no ensaio de reatividade potencial (ASTM C 289). Aceitação (6.1): aceito se satisfizer o capítulo 5; caso contrário, rejeitado (6.2). A massa unitária da NBR 7251 (MB-1665) pode ser " +
      "importada da DNIT 437-ME (estado solto), convertida de kg/m³ para t/m³.",
    exemplos: [
      { nome: "Argila expandida — classe I, grupo A (lote aceito; importado das fichas ME)", dados: function () {
        var d = { ident: { registro: "REC-ASA-01", data: "2026-02-10", obra: "Obra A", origem: "Fábrica X", camada: "Revestimento" },
          params: { classe: "I-A", concreto: "nao", fornecedor: "Fábrica X", quantidade: "120", dataReceb: "10/02/2026", dataAmostra: "10/02/2026" },
          det: [{ mu: "0,612" }, { mu: "0,628" }] };
        RM.importarEx(ID, d, "impPF", [["dner-me-225-94", 0]]);
        RM.importarEx(ID, d, "impAB", [["dner-me-222-94", 0]]);
        return d;
      } },
      { nome: "Argila não expandida — classe II, grupo B para concreto (rejeitado: fervura, abrasão, reatividade)", dados: function () {
        var d = { ident: { registro: "REC-ASA-02", data: "2026-03-05", obra: "Obra B", origem: "Fábrica Y", camada: "Concreto de dispositivos" },
          params: { classe: "II-B", concreto: "sim", fornecedor: "Fábrica Y", quantidade: "80", dataReceb: "05/03/2026", dataAmostra: "05/03/2026" },
          det: [{ mu: "0,962", reat: "deletério" }, { mu: "0,948" }] };
        RM.importarEx(ID, d, "impPF", [["dner-me-225-94", 1]]);
        RM.importarEx(ID, d, "impAB", [["dner-me-222-94", 1]]);
        return d;
      } },
    ],
  });
})();
