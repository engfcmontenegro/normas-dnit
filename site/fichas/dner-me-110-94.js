/*
 * Ficha: DNER-ME 110/94 — Microesferas de vidro — Índice de refração (método de imersão).
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * As microesferas, sem superposição, recebem uma a uma as soluções de óleos de índice conhecido (1,50 – 1,51 – 1,52 – 1,53);
 * o índice de refração é o da solução em que ficam invisíveis ao microscópio (6.1, satisfatório); se permanecerem
 * visíveis em todas, o resultado é não satisfatório (6.2). Limite opcional: ≥ 1,50 (DNER-EM 373/2000, 5.8; DNER-EM 379/98, 5.7).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var OLEOS = [1.5, 1.51, 1.52, 1.53];
  var ESPEC = [
    ["373", "DNER-EM 373/2000 — microesferas: índice de refração ≥ 1,50 (5.8)", 1.5, null, "DNER-EM 373/2000, 5.8"],
    ["379", "DNER-EM 379/98 — esferas de vidro: índice de refração ≥ 1,50 (5.7)", 1.5, null, "DNER-EM 379/98, 5.7"],
  ];
  // S/N digitado: true = invisíveis, false = visíveis, null = não registrado
  function simNao(v) {
    var s = String(v || "").trim().toLowerCase();
    if (!s) return null;
    if (/^(s|sim|i|invis)/.test(s)) return true;
    if (/^(n|n[aã]o|v|vis)/.test(s)) return false;
    return undefined;
  }

  FE.FICHAS["dner-me-110-94"] = {
    titulo: "Microesferas de vidro — índice de refração",
    resumo: "Microesferas em vidro de relógio, sem superposição, com gotas de óleos de índice conhecido (1,50; 1,51; 1,52; 1,53), observadas ao microscópio (100× a 200×): o índice é o do óleo em que ficam invisíveis (6.1); visíveis em todos → não satisfatório (6.2).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: microesferas tipo I B (premix)" },
      { k: "aumento", r: "Aumento do microscópio (3 a — 100× a 200×) — registrado" },
    ].concat(S.paramsLimite(ESPEC, "", "DNER-EM 373/2000 (5.8) ou DNER-EM 379/98 (5.7)")),
    padrao: { espec: "" },
    tabelas: function () {
      return [{
        chave: "oleos", titulo: "Soluções de óleo (3 c, 5)", rotulo: "Solução", iniciais: 4, min: 1, nomes: ["1ª", "2ª", "3ª", "4ª", "5ª", "6ª"],
        dica: "gotejar as soluções separadamente, uma a uma (5); registre S se as microesferas ficaram invisíveis, N se continuaram visíveis",
        linhas: [
          { k: "n", r: "Índice de refração da solução", u: "", ph: "1,50 / 1,51 / 1,52 / 1,53" },
          { k: "inv", r: "Microesferas invisíveis? (S/N)", u: "", texto: true, ph: "S ou N" },
          { calc: "ind", r: "Índice considerado", u: "", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var aum = num(P.aumento);
      if (ok(aum) && (aum < 100 || aum > 200)) avisos.push("Aumento de " + fmt(aum, 0) + "× — a norma prescreve microscópio de 100× a 200× (3 a).");
      var regs = (d.oleos || []).map(function (x, i) {
        var n = num(x.n), inv = simNao(x.inv), rot = (i + 1) + "ª solução: ";
        if (inv === undefined) avisos.push(rot + "registre S (invisíveis) ou N (visíveis).");
        if (ok(n) && !OLEOS.some(function (o) { return Math.abs(o - n) < 1e-9; })) avisos.push(rot + "índice " + fmt(n, 3) + " diferente das soluções prescritas (1,50; 1,51; 1,52; 1,53 — 3 c).");
        if (inv !== null && inv !== undefined && !ok(n)) avisos.push(rot + "informe o índice de refração da solução.");
        return { n: n, inv: inv };
      });
      var tab = regs.map(function (o) { return { ind: o.inv === true && ok(o.n) ? o.n : NaN }; });
      var invis = regs.filter(function (o) { return o.inv === true && ok(o.n); });
      var testadas = regs.filter(function (o) { return (o.inv === true || o.inv === false) && ok(o.n); });
      var ir = NaN, satisf = null;
      if (invis.length) {
        ir = invis[0].n; satisf = true;
        if (invis.length > 1) {
          var vals = invis.map(function (o) { return o.n; });
          avisos.push("As microesferas ficaram invisíveis em mais de uma solução (" + vals.map(function (v) { return fmt(v, 2); }).join("; ") +
            ") — confira; adotado o índice da primeira registrada.");
        }
      } else if (testadas.length) {
        var falt = OLEOS.filter(function (o) { return !testadas.some(function (t) { return Math.abs(t.n - o) < 1e-9; }); });
        if (falt.length) avisos.push("Ainda não testada(s): " + falt.map(function (v) { return fmt(v, 2); }).join("; ") + " — o resultado só é não satisfatório depois de todas as soluções (6.2).");
        else satisf = false;
      }
      var lim = S.limite(P, ESPEC), conf = satisf === false && lim ? false : S.confere(ir, lim);
      if (satisf === false) avisos.unshift("As microesferas permaneceram visíveis em todas as soluções: resultado não satisfatório (6.2).");
      if (conf === false && ok(ir)) avisos.unshift("Índice de refração " + fmt(ir, 2) + ", abaixo do mínimo " + S.textoLim(lim, 2, "") + " (" + lim.ref + ").");
      return { tab: { oleos: tab }, resultados: { ir: ir, satisf: satisf, lim: lim, conforme: conf, testadas: testadas.length }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card(ok(r.ir) ? fmt(r.ir, 2) : "—", "Índice de refração das microesferas (6.1)" +
        (r.lim ? " · " + esc(S.textoLim(r.lim, 2, "")) + S.sit(r.conforme) : ""), true) +
        S.card(S.parecerHtml(r.satisf), "Resultado (" + r.testadas + " solução(ões) registrada(s))") + "</div>";
    },
    relatorio: {
      notas: "O índice de refração das microesferas é igual ao da solução de óleo com a qual se tornaram invisíveis ao microscópio; o resultado é satisfatório (6.1). " +
        "Se permanecerem visíveis com todas as soluções de índice conhecido (1,50; 1,51; 1,52; 1,53), o resultado é não satisfatório (6.2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Índice de refração", ok(r.ir) ? fmt(r.ir, 2) : "— (microesferas visíveis em todas as soluções registradas)"]);
        rows.push(["Resultado", S.parecerTxt(r.satisf)]);
        if (r.lim) rows.push(["Especificação", S.textoLim(r.lim, 2, "") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Microesferas tipo I B — invisíveis na solução 1,52", dados: function () {
        return { ident: { registro: "EX-MV110-01", data: "2026-03-20", obra: "Obra A", local: "Lote 12", origem: "Fornecedor A", camada: "Microesferas tipo I B (premix)" },
          params: { material: "Microesferas de vidro tipo I B", aumento: "150", espec: "373" },
          oleos: [{ n: "1,50", inv: "N" }, { n: "1,51", inv: "N" }, { n: "1,52", inv: "S" }, { n: "1,53", inv: "" }] };
      } },
      { nome: "Microesferas tipo F — visíveis em todas as soluções (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV110-02", data: "2026-03-20", obra: "Obra B", local: "Lote 7", origem: "Fornecedor B", camada: "Microesferas tipo F (drop-on)" },
          params: { material: "Microesferas de vidro tipo F", aumento: "100", espec: "373" },
          oleos: [{ n: "1,50", inv: "N" }, { n: "1,51", inv: "N" }, { n: "1,52", inv: "N" }, { n: "1,53", inv: "N" }] };
      } },
    ],
  };
})();
