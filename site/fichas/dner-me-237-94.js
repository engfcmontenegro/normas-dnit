/*
 * Ficha: DNER-ME 237/94 — Tinta para demarcação viária — determinação do teor de pigmento.
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  FE.FICHAS["dner-me-237-94"] = {
    titulo: "Tinta para demarcação viária — teor de pigmento",
    resumo: "2 a 5 g de tinta em tubo de centrífuga tarado; quatro lavagens com tolueno + metil-etil-cetona (1:1) e uma com éter etílico, centrifugando e descartando o sobrenadante; secagem a 105 °C até massa constante; % pigmento = (B − A) / C × 100 (seção 6).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "test", r: "Temperatura de secagem (°C) — 105 ± 5 °C (5.5)", ph: "105" },
    ]).concat(S.paramsEspec("pigmento")),
    padrao: { cor: "branca", espec: "" },
    tabelas: function () {
      return [{ chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 2,
        dica: "duas determinações pelo mesmo operador; diferença máxima 0,61 % (seção 8)",
        linhas: [
          { k: "A", r: "Massa do tubo centrifugador (A)", u: "g" },
          { k: "T", r: "Tubo + amostra de tinta", u: "g" },
          { calc: "C", r: "Massa da amostra de tinta (C) — 2 a 5 g (5.1)", u: "g", casas: 4 },
          { k: "B", r: "Tubo + pigmento seco, massa constante (B) (5.5)", u: "g" },
          { k: "B2", r: "Pesagem anterior (verificação da constância) — opcional", u: "g" },
          { calc: "pct", r: "Pigmento = (B − A) / C × 100 (seção 6)", u: "%", casas: 2, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var t = num(P.test);
      if (ok(t) && (t < 100 || t > 110)) avisos.push("Temperatura de secagem " + fmt(t, 0) + " °C fora de 105 ± 5 °C (5.5).");
      var tab = (d.det || []).map(function (p, i) {
        var A = num(p.A), T = num(p.T), B = num(p.B), B2 = num(p.B2), rot = "Det. " + (i + 1);
        var C = ok(A) && ok(T) ? T - A : NaN;
        if (ok(C) && (C < 2 || C > 5)) avisos.push(rot + ": amostra de " + fmt(C, 4) + " g fora de 2 a 5 g (5.1).");
        if (ok(B) && ok(B2) && Math.abs(B2 - B) > 0.0005) avisos.push(rot + ": as duas últimas pesagens diferem " + fmt(Math.abs(B2 - B) * 1000, 1) + " mg — continue secando até massa constante (5.5).");
        return { C: C, pct: ok(C) && ok(B) && C > 0 ? (B - A) / C * 100 : NaN };
      });
      var vals = tab.map(function (o) { return o.pct; });
      var dif = S.duplicata(vals, 0.61, "Teor de pigmento", "%", avisos, "seção 8");
      var r = { pct: FE.media(vals), dif: dif, lim: S.limite("pigmento", P) };
      r.conforme = S.confere(r.pct, r.lim);
      S.avisoLimite(avisos, "Teor de pigmento", r.pct, r.lim, "%", 2);
      return { tab: { det: tab }, resultados: r, avisos: avisos };
    },
    rotuloImportar: function (r) { return "pigmento " + (ok(r.pct) ? fmt(r.pct, 2) : "—") + " %"; },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.itemRes(fmt(r.pct, 2) + " <small>%</small>", "Teor de pigmento, em massa de tinta — média" +
        (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "%", 2)) + " " + S.selo(r.conforme) : "")) +
        S.itemRes(fmt(r.dif, 2) + " <small>%</small>", "Diferença entre as determinações (máx. 0,61 %)", "fe-res-p") + "</div>";
    },
    relatorio: {
      notas: "% de pigmento = (B − A) / C × 100, com A = massa do tubo, B = tubo com pigmento seco e C = massa da amostra de tinta (seção 6). Resultado: média de duas determinações; diferença máxima 0,61 % (seção 8). O resíduo pode ser usado nas DNER-ME 233 e 238. Verificação de massa constante: diferença ≤ 0,5 mg (critério adotado; a norma não o fixa).",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return S.linhaTinta(d.params).concat([["Teor de pigmento (em massa de tinta)", (ok(r.pct) ? fmt(r.pct, 2) + " %" : "—") + (r.lim ? " — " + S.parecer("", r.pct, r.lim, "%", 2) : "")],
          ["Diferença entre as determinações", ok(r.dif) ? fmt(r.dif, 2) + " % (máximo 0,61 %)" : "—"]]);
      },
    },
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — 45,2 % de pigmento (atende)", dados: function () {
        return { ident: { registro: "EX-TS-237-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368", test: "105" },
          det: [{ A: "31,2046", T: "34,7112", B: "32,7905", B2: "32,7908" }, { A: "30,8871", T: "34,5020", B: "32,5195" }] };
      } },
      { nome: "Tinta amarela — 41,8 % de pigmento, abaixo do mínimo (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-237-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371", test: "105" },
          det: [{ A: "31,0150", T: "35,0212", B: "32,6893" }, { A: "30,9502", T: "34,8810", B: "32,5957" }] };
      } },
    ],
  };
})();
