/*
 * Ficha: DNER-ME 236/94 — Tinta para demarcação viária — determinação do brilho (glossmeter a 60°).
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  FE.FICHAS["dner-me-236-94"] = {
    titulo: "Tinta para demarcação viária — brilho a 60°",
    resumo: "Película aplicada com extensor em placa de vidro, seca 48 h ao abrigo de poeira e de luz solar direta; glossmeter de 60° (ASTM D 523) calibrado na placa padrão; resultado em unidades de brilho (seção 6).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "hseca", r: "Tempo de secagem (h) — 48 h (5.2)", ph: "48" },
      { k: "padrao", r: "Valor da placa padrão do aparelho (unidades)", dica: "calibração conforme o valor indicado na placa padrão (5.3)" },
      { k: "leitPad", r: "Leitura na placa padrão após a calibração (unidades)" },
    ]).concat(S.paramsEspec("brilho")),
    padrao: { cor: "branca", espec: "" },
    tabelas: function () {
      return [{ chave: "leit", titulo: "Leituras na placa ensaiada (5.4)", rotulo: "Leitura", iniciais: 3, min: 1,
        dica: "uma coluna por leitura (posições diferentes da placa); o resultado é a média",
        linhas: [{ k: "b", r: "Brilho a 60°", u: "unidades" }] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var h = num(P.hseca), vp = num(P.padrao), lp = num(P.leitPad);
      if (ok(h) && h < 48) avisos.push("Secagem de " + fmt(h, 0) + " h; a norma prescreve 48 h (5.2).");
      if (ok(vp) && ok(lp) && Math.abs(vp - lp) > 1) avisos.push("Leitura na placa padrão (" + fmt(lp, 1) + ") difere do valor indicado (" + fmt(vp, 1) + "): recalibre o aparelho (5.3).");
      var vals = (d.leit || []).map(function (p) { return num(p.b); }).filter(ok);
      var r = { b: FE.media(vals), n: vals.length, lim: S.limite("brilho", P) };
      r.min = vals.length ? Math.min.apply(null, vals) : NaN; r.max = vals.length ? Math.max.apply(null, vals) : NaN;
      r.conforme = S.confere(r.b, r.lim);
      S.avisoLimite(avisos, "Brilho a 60°", r.b, r.lim, "unidades", 1);
      return { tab: { leit: (d.leit || []).map(function () { return {}; }) }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.itemRes(fmt(r.b, 1) + " <small>unidades</small>", "Brilho a 60°" + (r.n > 1 ? " — média de " + r.n + " leituras" : "") +
        (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "unidades", 0)) + " " + S.selo(r.conforme) : "")) +
        (r.n > 1 ? S.itemRes(fmt(r.min, 1) + " a " + fmt(r.max, 1), "Faixa das leituras", "fe-res-p") : "") + "</div>";
    },
    relatorio: {
      notas: "Resultado em unidades de brilho do aparelho de 60° (ASTM D 523), calibrado na placa padrão que o acompanha (5.3 e seção 6). Com várias leituras, adota-se a média (a norma prevê a leitura da placa, sem fixar o número de leituras). As especificações pedem tinta fosca: brilho a 60° ≤ 20 unidades.",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return S.linhaTinta(d.params).concat([["Brilho a 60°", (ok(r.b) ? fmt(r.b, 1) + " unidades" : "—") + (r.n > 1 ? " (média de " + r.n + " leituras)" : "") +
          (r.lim ? " — " + S.parecer("", r.b, r.lim, "unidades", 0) : "")]]);
      },
    },
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — fosca, 12 unidades (atende)", dados: function () {
        return { ident: { registro: "EX-TS-236-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368", hseca: "48", padrao: "93,5", leitPad: "93,5" },
          leit: [{ b: "11,8" }, { b: "12,4" }, { b: "12,1" }] };
      } },
      { nome: "Tinta amarela — brilho de 27 unidades, acima do máximo (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-236-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371", hseca: "48", padrao: "93,5", leitPad: "93,3" },
          leit: [{ b: "26,5" }, { b: "27,8" }, { b: "27,0" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-236-94"].rotuloImportar = function (r) { return "brilho " + window.FE.fmt(r.b, 1); };
})();
