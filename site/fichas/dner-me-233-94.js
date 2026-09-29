/*
 * Ficha: DNER-ME 233/94 — Tinta para demarcação viária — determinação do cromato de chumbo no pigmento.
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  FE.FICHAS["dner-me-233-94"] = {
    titulo: "Tinta para demarcação viária — cromato de chumbo no pigmento",
    resumo: "Iodometria: 1 g do pigmento extraído (DNER-ME 237) dissolvido na solução ácida de NaCl, adição de KI e titulação com tiossulfato de sódio 0,1 N (amido como indicador); % PbCrO₄ = B × N × 0,1077 × 100 / A (seção 6).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "N", r: "Normalidade da solução de tiossulfato de sódio (N)", ph: "0,1000", dica: "padronizada com bicromato de potássio (4.2 c)" },
    ]).concat(S.paramsEspec("pbcro4")),
    padrao: { cor: "amarela", espec: "" },
    tabelas: function () {
      return [{ chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 2,
        dica: "duas determinações pelo mesmo operador; diferença máxima 0,61 % (seção 8)",
        linhas: [
          { k: "A", r: "Massa da amostra de pigmento (A) — ≈ 1 g (5.2.1)", u: "g" },
          { k: "B", r: "Volume de tiossulfato gasto na titulação (B) (5.2.4)", u: "ml" },
          { calc: "pct", r: "PbCrO₄ = B × N × 0,1077 × 100 / A (seção 6)", u: "%", casas: 2, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], N = num(P.N);
      if (!ok(N)) N = NaN;
      var tab = (d.det || []).map(function (p, i) {
        var A = num(p.A), B = num(p.B);
        if (ok(A) && (A < 0.95 || A > 1.05)) avisos.push("Det. " + (i + 1) + ": massa de " + fmt(A, 4) + " g; a norma pede 1 g de amostra (5.2.1).");
        return { pct: ok(A) && ok(B) && ok(N) && A > 0 ? B * N * 0.1077 * 100 / A : NaN };
      });
      if (!ok(N) && (d.det || []).some(function (p) { return ok(num(p.B)); })) avisos.push("Informe a normalidade da solução de tiossulfato de sódio (N).");
      var vals = tab.map(function (o) { return o.pct; });
      var dif = S.duplicata(vals, 0.61, "Cromato de chumbo", "%", avisos, "seção 8");
      var r = { pct: FE.media(vals), dif: dif, lim: S.limite("pbcro4", P) };
      r.conforme = S.confere(r.pct, r.lim);
      S.avisoLimite(avisos, "Cromato de chumbo no pigmento", r.pct, r.lim, "%", 2);
      if ((d.params || {}).cor === "branca" && r.lim) avisos.push("O teor mínimo de cromato de chumbo aplica-se à tinta amarela.");
      return { tab: { det: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.itemRes(fmt(r.pct, 2) + " <small>%</small>", "Cromato de chumbo (PbCrO₄) no pigmento — média" +
        (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "%", 2)) + " " + S.selo(r.conforme) : "")) +
        S.itemRes(fmt(r.dif, 2) + " <small>%</small>", "Diferença entre as determinações (máx. 0,61 %)", "fe-res-p") + "</div>";
    },
    relatorio: {
      notas: "% PbCrO₄ = B × N × 0,1077 × 100 / A, com A = massa da amostra de pigmento (g), B = ml de tiossulfato gastos e N = normalidade do tiossulfato (seção 6); 0,1077 g = miliequivalente-grama do PbCrO₄ na iodometria. Resultado: média de duas determinações cuja diferença não deve superar 0,61 % (seção 8). As EM 368/00 e 371/00 permitem substituir até 15 % do teor utilizado por TiO₂.",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return S.linhaTinta(d.params).concat([["Cromato de chumbo no pigmento", (ok(r.pct) ? fmt(r.pct, 2) + " %" : "—") + (r.lim ? " — " + S.parecer("", r.pct, r.lim, "%", 2) : "")],
          ["Diferença entre as determinações", ok(r.dif) ? fmt(r.dif, 2) + " % (máximo 0,61 %)" : "—"]]);
      },
    },
    exemplos: [
      { nome: "Tinta amarela base solvente — 24,5 % de PbCrO₄ (atende)", dados: function () {
        return { ident: { registro: "EX-TS-233-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "amarela", lote: "0002", espec: "em368", N: "0,1002" },
          det: [{ A: "1,0012", B: "22,80" }, { A: "0,9987", B: "22,70" }] };
      } },
      { nome: "Tinta amarela — teor baixo e determinações discrepantes (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-233-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371", N: "0,0998" },
          det: [{ A: "1,0021", B: "18,90" }, { A: "1,0004", B: "18,20" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-233-94"].rotuloImportar = function (r) { return "PbCrO₄ " + window.FE.fmt(r.pct, 2) + " % no pigmento"; };
})();
