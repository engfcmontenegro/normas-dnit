/*
 * Ficha: DNER-ME 238/94 — Tinta para demarcação viária — dióxido de titânio no pigmento (redutor de Jones).
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  function equivalente(P) {  // T = W × 1,192 / Vp (4.7.1) ou informado
    var W = num(P.W), Vp = num(P.Vp);
    if (ok(W) && ok(Vp) && Vp > 0) return W * 1.192 / Vp;
    return num(P.T);
  }

  FE.FICHAS["dner-me-238-94"] = {
    titulo: "Tinta para demarcação viária — dióxido de titânio no pigmento",
    resumo: "0,3000 g do pigmento extraído (DNER-ME 237) solubilizado em H₂SO₄ + (NH₄)₂SO₄, reduzido no redutor de Jones sobre sulfato férrico e titulado com KMnO₄ 0,1 N; TiO₂ % = (V − B) × T / S × 100 (seção 7).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "W", r: "Padronização: massa de oxalato de sódio W (g) — 0,2500 a 0,3000 g (4.7 a)" },
      { k: "Vp", r: "Padronização: KMnO₄ gasto Vp (ml)", dica: "T = W × 1,192 / Vp (4.7.1)" },
      { k: "T", r: "…ou equivalente T informado (g de TiO₂ por ml de KMnO₄)", ph: "0,0080", dica: "usado quando W e Vp não são informados" },
      { k: "B", r: "Prova em branco B (ml de KMnO₄) (6.11)", ph: "0,00" },
    ]).concat(S.paramsEspec("tio2")),
    padrao: { cor: "branca", espec: "" },
    tabelas: function () {
      return [{ chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 2,
        dica: "duas determinações pelo mesmo operador; diferença máxima 0,61 % (seção 9)",
        linhas: [
          { k: "S", r: "Massa da amostra de pigmento (S) — 0,3000 g (6.1)", u: "g" },
          { k: "V", r: "KMnO₄ gasto na titulação da amostra (V) (6.10)", u: "ml" },
          { calc: "pct", r: "TiO₂ = (V − B) × T / S × 100 (7.1)", u: "%", casas: 2, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], T = equivalente(P), B = num(P.B);
      if (!ok(B)) B = 0;
      var W = num(P.W);
      if (ok(W) && (W < 0.25 || W > 0.30)) avisos.push("Massa de oxalato de sódio de " + fmt(W, 4) + " g fora de 0,2500 a 0,3000 g (4.7 a).");
      var tab = (d.det || []).map(function (p, i) {
        var Sm = num(p.S), V = num(p.V);
        if (ok(Sm) && Math.abs(Sm - 0.3) > 0.005) avisos.push("Det. " + (i + 1) + ": massa de " + fmt(Sm, 4) + " g; a norma pesa 0,3000 g de amostra (6.1).");
        return { pct: ok(Sm) && ok(V) && ok(T) && Sm > 0 ? (V - B) * T / Sm * 100 : NaN };
      });
      if (!ok(T) && (d.det || []).some(function (p) { return ok(num(p.V)); })) avisos.push("Informe a padronização do KMnO₄ (W e Vp) ou o equivalente T.");
      var vals = tab.map(function (o) { return o.pct; });
      var dif = S.duplicata(vals, 0.61, "Dióxido de titânio", "%", avisos, "seção 9");
      var r = { pct: FE.media(vals), dif: dif, T: T, B: B, lim: S.limite("tio2", P) };
      r.conforme = S.confere(r.pct, r.lim);
      S.avisoLimite(avisos, "Dióxido de titânio no pigmento", r.pct, r.lim, "%", 2);
      if (P.cor === "amarela" && r.lim) avisos.push("O teor mínimo de TiO₂ aplica-se à tinta branca.");
      return { tab: { det: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.itemRes(fmt(r.pct, 2) + " <small>%</small>", "Dióxido de titânio (TiO₂) no pigmento — média" +
        (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "%", 2)) + " " + S.selo(r.conforme) : "")) +
        S.itemRes(ok(r.T) ? fmt(r.T, 5) : "—", "Equivalente T (g TiO₂ / ml KMnO₄)", "fe-res-p") +
        S.itemRes(fmt(r.dif, 2) + " <small>%</small>", "Diferença entre as determinações (máx. 0,61 %)", "fe-res-p") + "</div>";
    },
    relatorio: {
      notas: "T = W × 1,192 / Vp (4.7.1), com W = massa de oxalato de sódio (g) e Vp = ml de KMnO₄ na padronização. TiO₂ % = (V − B) × T / S × 100 (7.1), com V e B = ml de KMnO₄ na amostra e na prova em branco e S = massa da amostra (g). Resultado: média de duas determinações; diferença máxima 0,61 % (seção 9).",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return S.linhaTinta(d.params).concat([["Dióxido de titânio no pigmento", (ok(r.pct) ? fmt(r.pct, 2) + " %" : "—") + (r.lim ? " — " + S.parecer("", r.pct, r.lim, "%", 2) : "")],
          ["Equivalente T / prova em branco B", (ok(r.T) ? fmt(r.T, 5) + " g/ml" : "—") + " / " + fmt(r.B, 2) + " ml"],
          ["Diferença entre as determinações", ok(r.dif) ? fmt(r.dif, 2) + " % (máximo 0,61 %)" : "—"]]);
      },
    },
    exemplos: [
      { nome: "Tinta branca base solvente — 27,9 % de TiO₂ no pigmento (atende)", dados: function () {
        return { ident: { registro: "EX-TS-238-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368", W: "0,2680", Vp: "40,10", B: "0,10" },
          det: [{ S: "0,3001", V: "10,62" }, { S: "0,2998", V: "10,58" }] };
      } },
      { nome: "Tinta branca — 20,5 % de TiO₂, abaixo do mínimo (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-238-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "branca", lote: "0416", espec: "em371", T: "0,00800", B: "0,10" },
          det: [{ S: "0,3002", V: "7,80" }, { S: "0,3000", V: "7,85" }] };
      } },
    ],
  };
})();
