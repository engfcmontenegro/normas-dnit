/*
 * Ficha: DNIT 046/2004-EM — Pavimento rígido — Selante de juntas — recebimento do lote.
 * Motor: FE.recebimentoMaterial (site/fichas/dner-em-276-00.js); limites por tipo de junta de FE.selantes
 * (site/fichas/dnit-038-2004-me.js), conferidos com a seção 5 do PDF da EM.
 * Ensaios de origem: DNIT 038 a 045 e 052/2004-ME (as séries de cura normal, estufa — DNIT 044 — e intemperismo —
 * DNIT 045 — são lidas das fichas; cada requisito usa as séries que a EM exige e o pior valor).
 * Contraprova: repetição dos ensaios no exemplar reservado, em laboratório escolhido por consenso (6 d).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebimentoMaterial, SL = FE.selantes, ok = FE.ok;

  var G4 = "Condições gerais e recebimento (4.2 · 6 a)", G5 = "Condições específicas (seção 5)";
  function L(P, prop) { return SL.limite({ junta: P.junta }, prop); }
  function lim(prop) {
    return function (P) {
      var l = L(P, prop);
      if (!l || l.v === null) return null;
      return { min: l.op === ">" || l.op === "≥" ? l.v : null, max: l.op === "<" || l.op === "≤" ? l.v : null, minX: l.op === ">", maxX: l.op === "<" };
    };
  }
  function sec(prop) { return function (P) { var l = L(P, prop); return l ? l.sec : ""; }; }
  function tem(prop) { return function (P) { return !!L(P, prop); }; }
  // valores das séries (N, E, I) de uma ficha de ensaio
  function series(r, f) {
    return (r.series || []).map(function (g) { var v = f(g); return ok(v) ? { v: v, c: g.k } : null; }).filter(Boolean);
  }
  // valores das fichas de envelhecimento (DNIT 044 → E, DNIT 045 → I): va (cura normal) e ve (envelhecido)
  function envelh(e, r, k, f) {
    var l = (r.linhas || []).filter(function (x) { return x.p && x.p.k === k; })[0], c = e.ficha === "dnit-044-2004-me" ? "E" : "I";
    if (!l) return null;
    return f(l, c).filter(function (x) { return x && ok(x.v); });
  }
  function vaVe(l, c) { return [{ v: l.va, c: "N" }, { v: l.ve, c: c }]; }
  var AGE = ["dnit-044-2004-me", "dnit-045-2004-me"];

  var REQ = [
    { id: "integro", grupo: G4, tipo: "qual", r: "Material entregue sem rasgos ou avarias", secao: "4.2 · 6 a", metodo: "inspeção no recebimento", exig: "atende",
      bom: "atende", mau: "não atende", ph: "atende / não atende" },
    { id: "dimensoes", grupo: G4, tipo: "qual", r: "Dimensões nominais iguais às do pedido", secao: "4.2 · 6 a", metodo: "inspeção no recebimento", exig: "atende",
      bom: "atende", mau: "não atende", ph: "atende / não atende" },
    { id: "loteUnico", grupo: G4, tipo: "qual", r: "Lote de material do mesmo tipo, procedência e marca, entregue na mesma data; amostra identificada", secao: "4.2",
      metodo: "inspeção no recebimento", exig: "atende", bom: "atende", mau: "não atende", ph: "atende / não atende" },
    { id: "aderencia", grupo: G5, tipo: "num", r: "Perda de aderência ao concreto após envelhecimento", metodo: "DNIT 040 · 044 · 045", u: "%", casas: 1, casasLim: 0,
      se: tem("aderencia"), lim: lim("aderencia"), conds: function () { return ["E", "I"]; },
      imp: { de: ["dnit-040-2004-me"].concat(AGE), valor: function (r, e) {
        if (e.ficha === "dnit-040-2004-me") return series(r, function (g) { return g.k === "N" ? NaN : -g.V.tr; });
        return envelh(e, r, "trA", function (l, c) { return [{ v: -l.V, c: c }]; });
      } } },
    { id: "alongTracao", grupo: G5, tipo: "num", r: "Capacidade de alongamento na tração", metodo: "DNIT 039 · 044 · 045", u: "%", casas: 0,
      se: tem("alongTracao"), lim: lim("alongTracao"),
      conds: function (P) { return P.junta === "retracao" ? ["I"] : P.junta === "articulacao" ? ["E", "I"] : ["N", "E", "I"]; },
      imp: { de: ["dnit-039-2004-me"].concat(AGE), valor: function (r, e) {
        if (e.ficha === "dnit-039-2004-me") return series(r, function (g) { return g.m.ar; });
        return envelh(e, r, "arT", vaVe);
      } } },
    { id: "dpComp", grupo: G5, tipo: "num", r: "Deformação permanente à compressão", metodo: "DNIT 041 · 044 · 045", u: "%", casas: 1, casasLim: 0,
      se: tem("dpComp"), lim: lim("dpComp"), conds: function () { return ["N", "E", "I"]; },
      imp: { de: ["dnit-041-2004-me"].concat(AGE), valor: function (r, e) {
        if (e.ficha === "dnit-041-2004-me") return series(r, function (g) { return g.m.dp; });
        return envelh(e, r, "dpc", vaVe);
      } } },
    { id: "absorcao", grupo: G5, tipo: "num", r: "Absorção de água após envelhecimento", metodo: "DNIT 043 · 044 · 045", u: "%", casas: 2, casasLim: 0,
      se: tem("absorcao"), lim: lim("absorcao"), conds: function () { return ["E", "I"]; },
      imp: { de: ["dnit-043-2004-me"].concat(AGE), valor: function (r, e) {
        if (e.ficha === "dnit-043-2004-me") return series(r, function (g) { return g.m.abs; });
        return envelh(e, r, "abs", vaVe);
      } } },
    { id: "fluidez", grupo: G5, tipo: "num", r: "Fluidez a 60 °C", metodo: "DNIT 038", u: "mm", casas: 1, casasLim: 0,
      se: tem("fluidez"), lim: lim("fluidez"), imp: { de: ["dnit-038-2004-me"], valor: function (r) { return ok(r.fluidez) ? r.fluidez : null; } } },
    { id: "alongAderencia", grupo: G5, tipo: "num", r: "Alongamento no ensaio de aderência", metodo: "DNIT 040 · 044 · 045", u: "%", casas: 0,
      se: tem("alongAderencia"), lim: lim("alongAderencia"), conds: function () { return ["N", "E", "I"]; },
      imp: { de: ["dnit-040-2004-me"].concat(AGE), valor: function (r, e) {
        if (e.ficha === "dnit-040-2004-me") return series(r, function (g) { return g.m.ar; });
        return envelh(e, r, "arA", vaVe);
      } } },
    { id: "rasgamento", grupo: G5, tipo: "num", r: "Resistência ao rasgamento", metodo: "DNIT 042 · 044 · 045", u: "N/mm", casas: 1, casasLim: 0,
      se: tem("rasgamento"), lim: lim("rasgamento"), conds: function () { return ["N", "E", "I"]; },
      imp: { de: ["dnit-042-2004-me"].concat(AGE), valor: function (r, e) {
        if (e.ficha === "dnit-042-2004-me") return series(r, function (g) { return g.m.cr; });
        return envelh(e, r, "rg", vaVe);
      } } },
    { id: "puncionamento", grupo: G5, tipo: "qual", r: "Puncionamento estático", metodo: "DNIT 052", exig: "não apresentar perfuração", bom: "sem perfuração", mau: "perfurado",
      se: tem("puncionamento"),
      imp: { de: ["dnit-052-2004-me"], valor: function (r) {
        if (!(r.classes || []).length) return null;
        return r.perfura ? { q: false, txt: "perfurado — " + r.perfura + " CP(s) com perfuração" } : { q: true, txt: "sem perfuração" };
      } } },
  ];
  // seção citada conforme o tipo de junta (5.1, 5.2 ou 5.3)
  REQ.forEach(function (q) { if (!q.secao) q.secao = sec(q.id); });

  var F = R.criar({
    codigo: "DNIT 046/2004-EM",
    titulo: "Recebimento de selante de juntas de pavimento rígido",
    resumo: "Recebimento do lote de selante: integridade, dimensões e homogeneidade do lote (4.2, 6 a) e requisitos da seção 5 para o tipo de junta (retração, articulação ou expansão) — perda de aderência, alongamento, deformação permanente, absorção, fluidez, rasgamento e puncionamento, nas condições de recebimento e após envelhecimento (6 b) —, com importação das fichas DNIT 038 a 052-ME, contraprova no exemplar reservado (6 d) e parecer.",
    nomeMaterial: function (P) { return (P.material || "Selante de juntas") + " — " + SL.nomeJunta(P.junta); },
    dicaQtd: "com a unidade (kg, cartuchos, m...)", textos: { aceito: "LOTE ACEITO", rejeitado: "LOTE REJEITADO" },
    rotuloValidade: "Data de recebimento (identificação da amostra, 4.2)",
    params: [
      { k: "junta", r: "Tipo de junta (seção 5)", tipo: "select", recarrega: true, opcoes: SL.JUNTAS.filter(function (j) { return j[0]; }),
        dica: "cada tipo de junta tem seus requisitos (5.1, 5.2 ou 5.3)" },
      { k: "material", r: "Tipo de material selante", ph: "ex.: selante de poliuretano monocomponente" },
      { k: "reserva", r: "Exemplar reservado para contraprova — identificação", ph: "ex.: embalagem lacrada nº 2", dica: "usado na repetição dos ensaios em caso de impasse (6 d)" },
    ],
    padrao: { junta: "retracao" },
    contraprova: "6 d", secAceita: "6 c", secRejeita: "6 a / 6 d", dispensa: null,
    sobrepor: function (fid, P) { return /^dnit-0(3[89]|4[0-5]|5[12])-2004-me$/.test(fid) ? { junta: P.junta } : null; },
    requisitos: REQ,
    extra: function (ctx) {
      var d = ctx.d;
      if (!d.params || !d.params.reserva) ctx.avisos.push("Registre o exemplar reservado para a eventual repetição dos ensaios (6 d).");
    },
    notas: "Critérios da DNIT 046/2004-EM, seção 5, por tipo de junta — retração (5.1) e articulação (5.2): perda de aderência após envelhecimento < 10 %; alongamento na tração ≥ 100 % (retração: após intemperismo, DNIT 045; articulação: após estufa e intemperismo, DNIT 044 e 045); deformação permanente à compressão < 50 %; absorção de água após envelhecimento < 5 %; fluidez a 60 °C de 5 mm (lida como máximo de 5 mm). " +
      "Expansão (5.3): absorção após envelhecimento < 4 %; alongamento na tração ≥ 300 %; deformação permanente < 20 %; fluidez ≤ 5 mm; alongamento na aderência > 200 %; rasgamento > 4 N/mm; sem perfuração no puncionamento estático. " +
      "Perda de aderência = redução da tensão de ruptura no ensaio de aderência em relação à cura normal (DNIT 040; V = (ve − va)/va × 100, DNIT 044/045). Importando várias séries/ensaios, vale o pior valor das séries exigidas. " +
      "Rejeita-se o material rasgado, avariado ou com dimensões diferentes das do pedido (6 a); o lote é aceito quando atende todas as exigências (6 c); se os ensaios não atenderem, o impasse é resolvido repetindo-os no exemplar reservado, em laboratório escolhido por consenso (6 d — coluna \"Contraprova\"). A EM não prevê dispensa de ensaios.",
    exemplos: [
      { nome: "Poliuretano, junta de retração — lote aceito (ensaios importados, séries envelhecidas)", dados: function () {
        var d = { ident: { registro: "REC-SEL-2026-01", data: "2026-04-02", obra: "Obra A — pavimento rígido", origem: "Fornecedor A", camada: "Selante — juntas transversais de retração" },
          params: { junta: "retracao", material: "Selante de poliuretano monocomponente", reserva: "cartucho lacrado nº 2", fabricante: "Fornecedor A", produto: "Selante PU",
            partida: "SL-2603", dataFab: "01/03/2026", validade: "02/04/2026", nf: "002231", quantidade: "120 cartuchos" } };
        return R.exemplo(F, d, [["dnit-038-2004-me", 0], ["dnit-039-2004-me", 0], ["dnit-040-2004-me", 0], ["dnit-041-2004-me", 0], ["dnit-043-2004-me", 0],
          ["dnit-044-2004-me", 0], ["dnit-045-2004-me", 0]],
          { integro: "atende", dimensoes: "atende", loteUnico: "atende" });
      } },
      { nome: "Junta de expansão — lote rejeitado (alongamento, deformação permanente, perfuração; contraprovas de rasgamento e absorção)", dados: function () {
        var d = { ident: { registro: "REC-SEL-2026-02", data: "2026-06-23", obra: "Obra B — pavimento rígido", origem: "Fornecedor B", camada: "Selante — junta de expansão" },
          params: { junta: "expansao", material: "Selante de silicone", reserva: "embalagem lacrada nº 5", fabricante: "Fornecedor B", produto: "Selante SI",
            partida: "SL-0611", dataFab: "11/06/2026", validade: "23/06/2026", nf: "019944", quantidade: "80 cartuchos" } };
        R.exemplo(F, d, [["dnit-038-2004-me", 0], ["dnit-039-2004-me", 1], ["dnit-040-2004-me", 0], ["dnit-041-2004-me", 1], ["dnit-042-2004-me", 1],
          ["dnit-043-2004-me", 1], ["dnit-052-2004-me", 1]],
          { integro: "atende", dimensoes: "atende", loteUnico: "atende" });
        d.res[1] = { rasgamento: "4,6", absorcao: "3,70" };
        return d;
      } },
    ],
  });
  FE.FICHAS["dnit-046-2004-em"] = F;
})();
