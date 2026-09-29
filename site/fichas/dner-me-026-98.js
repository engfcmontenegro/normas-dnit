/*
 * Ficha: DNER-ME 026/98 — Poder de cobertura de tinta para demarcação viária (criptômetro Pfund).
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var NOMES_A = ["Avanço (lâmina)", "Recuo (lâmina)", "Avanço (girada 180°)", "Recuo (girada 180°)"];

  function pc(L, K) { return ok(L) && ok(K) && L > 0 && K > 0 ? 1 / (L * K) : NaN; }

  FE.FICHAS["dner-me-026-98"] = {
    titulo: "Tinta para demarcação viária — poder de cobertura (criptômetro Pfund)",
    resumo: "Método A: quatro leituras do avanço L (mm) no criptômetro Pfund branco e preto, convertidas pela Tabela (PC = 1 / (L × K)); resultado: média dos quatro poderes de cobertura. Método B: uma leitura L no criptômetro Pfund (Erichsen); PC = 1 / (L × K), em m²/L (seção 6).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "metodo", r: "Método", tipo: "select", recarrega: true, opcoes: [["A", "A — Pfund branco e preto, 4 leituras"], ["B", "B — Pfund (Erichsen), 1 leitura"]] },
      { k: "K", r: "Constante da lâmina de vidro (K)", ph: "0,007", dica: "lâmina transparente K = 0,007 (4.1 a e 4.2 a)" },
    ]).concat(S.paramsEspec("cobertura")),
    padrao: { cor: "branca", espec: "", metodo: "A" },
    tabelas: function (d) {
      var B = (d.params || {}).metodo === "B", n = B ? 1 : 4;
      if (Array.isArray(d.leit)) { while (d.leit.length < n) d.leit.push({}); if (d.leit.length > n) d.leit.length = n; }
      return [{ chave: "leit", titulo: B ? "Leitura — Método B (5.3)" : "Leituras — Método A (5.2.2 e 5.2.3)", rotulo: "Leitura", iniciais: n, min: n, fixo: true,
        nomes: B ? ["L"] : NOMES_A,
        dica: B ? "ponto em que não se observa mais a borda da cavidade no zero da escala" : "ponto em que desaparece a linha divisória branco/preto; repetir com a lâmina girada 180°",
        linhas: [
          { k: "L", r: "Avanço L na escala", u: "mm" },
          { calc: "pc", r: "Poder de cobertura PC = 1 / (L × K) (Tabela / 6.2.1)", u: "m²/L", casas: 1, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], B = P.metodo === "B";
      var K = num(P.K);
      if (!ok(K)) K = 0.007;
      var tab = (d.leit || []).map(function (p, i) {
        var L = num(p.L);
        if (!B && ok(L) && (L < 5 || L > 25)) avisos.push("Leitura " + (i + 1) + ": avanço de " + fmt(L, 1) + " mm fora da Tabela (5 a 25 mm); PC calculado por 1 / (L × K).");
        return { pc: pc(L, K), L: L };
      });
      var pcs = tab.map(function (o) { return o.pc; }).filter(ok), Ls = tab.map(function (o) { return o.L; }).filter(ok);
      if (!B && pcs.length && pcs.length < 4) avisos.push("O Método A usa a média de quatro leituras (5.2.3 e 6.1.1); há " + pcs.length + ".");
      var r = { pc: FE.media(pcs), L: FE.media(Ls), K: K, metodo: B ? "B" : "A", lim: S.limite("cobertura", P) };
      if (Math.abs(K - 0.007) > 1e-9 && r.lim && P.espec !== "manual") avisos.push("O limite da especificação é para a placa nº 7 (K = 0,007).");
      r.conforme = S.confere(r.L, r.lim);
      if (r.conforme === false) avisos.push("Leitura média de " + fmt(r.L, 1) + " mm acima da máxima " + S.textoLimite(r.lim, "mm", 0) + " (" + r.lim.fonte + ") — poder de cobertura insuficiente.");
      r.pcMin = r.lim && r.lim.max !== null ? pc(r.lim.max, K) : NaN;
      return { tab: { leit: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.itemRes(fmt(r.pc, 1) + " <small>m²/L</small>", "Poder de cobertura — Método " + r.metodo + (r.metodo === "A" ? " (média dos quatro valores)" : "")) +
        S.itemRes(fmt(r.L, 1) + " <small>mm</small>", "Leitura" + (r.metodo === "A" ? " média" : "") +
          (r.lim ? " · máxima " + esc(S.textoLimite(r.lim, "mm", 0)) + " (PC ≥ " + fmt(r.pcMin, 1) + " m²/L) " + S.selo(r.conforme) : ""), r.lim ? "" : "fe-res-p") + "</div>";
    },
    relatorio: {
      notas: "PC = 1 / (L × K), com L = avanço na escala (mm) e K = constante da lâmina (0,007); a Tabela da norma (5 a 25 mm) é esta mesma fórmula arredondada. Método A: média aritmética dos quatro poderes de cobertura (6.1.1); Método B: fórmula de 6.2.1. A DNER-EM 276/00 (Tabela 2) limita a leitura com a placa nº 7: branca ≤ 10 mm, amarela ≤ 16 mm; verificada com a leitura média.",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return S.linhaTinta(d.params).concat([["Poder de cobertura (Método " + r.metodo + ")", ok(r.pc) ? fmt(r.pc, 1) + " m²/L" : "—"],
          ["Leitura" + (r.metodo === "A" ? " média" : "") + " (K = " + fmt(r.K, 3) + ")", (ok(r.L) ? fmt(r.L, 1) + " mm" : "—") + (r.lim ? " — " + S.parecer("", r.L, r.lim, "mm", 0) : "")]]);
      },
    },
    exemplos: [
      { nome: "Tinta acrílica emulsionada, branca — Método A, 9 mm (atende)", dados: function () {
        return { ident: { registro: "EX-TS-026-1", obra: "Obra A", origem: "Fornecedor C" },
          params: { tinta: "Acrílica emulsionada em água", cor: "branca", lote: "0102", espec: "em276", metodo: "A", K: "0,007" },
          leit: [{ L: "9" }, { L: "10" }, { L: "9" }, { L: "8" }] };
      } },
      { nome: "Tinta acrílica emulsionada, amarela — Método B, 18 mm (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-026-2", obra: "Obra B", origem: "Fornecedor C" },
          params: { tinta: "Acrílica emulsionada em água", cor: "amarela", lote: "0103", espec: "em276", metodo: "B", K: "0,007" },
          leit: [{ L: "18" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-026-98"].rotuloImportar = function (r) { return "leitura " + window.FE.fmt(r.L, 1) + " mm"; };
})();
