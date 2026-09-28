/*
 * Ficha: DNIT 266/2025-ME — Teor de materiais pulverulentos (lavagem nas peneiras de 1,2 mm e 0,075 mm).
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * A eq. 1 da norma divide pela massa final (m = (mi − mf)/mf × 100), embora o texto de 7 a) diga
 * "em porcentagem da massa da amostra ensaiada". A ficha segue a eq. 1 e mostra, só como informação,
 * o valor referido à massa inicial.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Tabela 1: dimensão máxima nominal → massa mínima por amostra (g)
  var TAB1 = [["2,36", "≤ 2,36 mm", 300], ["4,75", "> 2,36 mm e ≤ 4,75 mm", 500], ["9,5", "> 4,75 mm e ≤ 9,5 mm", 1000],
    ["19", "> 9,5 mm e ≤ 19 mm", 2500], ["37,5", "> 19 mm e ≤ 37,5 mm", 5000]];
  var TOL = { miudo: 1.0, graudo: 0.5 };  // 7 c)

  function teor(x) {
    var mi = num(x.mi), mf = num(x.mf);
    return ok(mi) && ok(mf) && mf > 0 && mi >= mf ? (mi - mf) / mf * 100 : NaN;  // eq. 1
  }

  FE.FICHAS["dnit-266-2025-me"] = {
    titulo: "Teor de materiais pulverulentos",
    resumo: "Lavagem da amostra seca sobre as peneiras de 1,2 mm e 0,075 mm até a água ficar limpa; m = (mi − mf) / mf × 100 (eq. 1); média de duas determinações, com terceira quando diferirem mais de 0,5 % (graúdo) ou 1,0 % (miúdo).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: areia média, brita 1" },
      { k: "tipo", r: "Tipo de agregado (7 c)", tipo: "select",
        opcoes: [["miudo", "Miúdo — diferença máxima de 1,0 %"], ["graudo", "Graúdo — diferença máxima de 0,5 %"]] },
      { k: "dmn", r: "Dimensão máxima nominal (Tabela 1)", tipo: "select",
        opcoes: [["", "—"]].concat(TAB1.map(function (t) { return [t[0], t[1] + " — mínimo " + t[2].toLocaleString("pt-BR") + " g por amostra"]; })) },
      { k: "limite", r: "Teor máximo admitido (%) — opcional", dica: "da especificação do material (ex.: agregado para concreto)" },
    ],
    padrao: { tipo: "miudo" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Amostra", iniciais: 2, min: 1,
        dica: "duas amostras de ensaio (5 d); acrescente a 3ª só quando a diferença exceder o limite (7 c)",
        linhas: [
          { k: "mi", r: "Massa inicial seca em estufa (M₁, M₂) — 6 b", u: "g" },
          { k: "mf", r: "Massa final seca após a lavagem (M₁f, M₂f) — 6 i", u: "g" },
          { calc: "perda", r: "Massa lavada = mi − mf", u: "g", casas: 1 },
          { calc: "m", r: "m = (mi − mf) / mf × 100 (eq. 1)", u: "%", casas: 2, destaque: true },
          { calc: "mIni", r: "(mi − mf) / mi × 100 — referido à massa inicial (informativo)", u: "%", casas: 2 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], tol = TOL[P.tipo] || TOL.miudo;
      var minimo = (TAB1.filter(function (t) { return t[0] === P.dmn; })[0] || [])[2];
      var dets = (d.det || []).map(function (x, i) {
        var mi = num(x.mi), mf = num(x.mf), n = "Amostra " + (i + 1) + ": ", o = { m: teor(x) };
        if (ok(mi) && ok(mf)) {
          if (mf > mi) avisos.push(n + "massa final maior que a inicial — confira.");
          else { o.perda = mi - mf; o.mIni = (mi - mf) / mi * 100; }
        }
        if (minimo && ok(mi) && mi < minimo) avisos.push(n + "massa de " + fmt(mi, 1) + " g, abaixo do mínimo de " + minimo.toLocaleString("pt-BR") + " g (Tabela 1).");
        return o;
      });
      var v = dets.map(function (o) { return o.m; }), val = v.filter(ok), R = { n: val.length, tol: tol, dif: NaN, base: "" };
      var v12 = [v[0], v[1]].filter(ok);
      if (v12.length === 2) {
        R.dif = Math.abs(v12[0] - v12[1]);
        if (R.dif <= tol + 1e-9) {
          R.m = media(v12); R.base = "média das duas determinações";
          if (val.length > 2) avisos.push("As duas primeiras determinações já concordam (diferença de " + fmt(R.dif, 2) + " % ≤ " + fmt(tol, 1) + " %): a terceira não é necessária e não entra no resultado.");
        } else if (ok(v[2])) {
          // 7 c): média dos dois valores mais próximos entre os três
          var pares = [[0, 1], [0, 2], [1, 2]].map(function (p) { return { p: p, d: Math.abs(v[p[0]] - v[p[1]]) }; })
            .sort(function (a, b) { return a.d - b.d; });
          var pr = pares[0].p;
          R.m = (v[pr[0]] + v[pr[1]]) / 2; R.difAdot = pares[0].d;
          R.base = "média das determinações " + (pr[0] + 1) + " e " + (pr[1] + 1) + " (as mais próximas, 7 c)";
        } else {
          R.m = media(v12); R.base = "média provisória — falta a terceira determinação";
          avisos.push("As determinações diferem " + fmt(R.dif, 2) + " % (máximo " + fmt(tol, 1) + " % para agregado " + (tol === 0.5 ? "graúdo" : "miúdo") + ", 7 c): realize uma terceira determinação.");
        }
      } else if (val.length === 1) {
        R.m = val[0]; R.base = "uma determinação";
        avisos.push("O resultado é a média de duas determinações (7 b); há uma.");
      } else R.m = NaN;
      var lim = num(P.limite);
      R.limite = lim;
      R.conforme = ok(R.m) && ok(lim) ? Math.round(R.m * 10) / 10 <= lim : null;
      if (R.conforme === false) avisos.push("Teor de materiais pulverulentos de " + fmt(R.m, 1) + " %, acima do máximo admitido de " + fmt(lim, 1) + " %.");
      return { tab: { det: dets }, resultados: R, avisos: avisos };
    },
    rotuloImportar: function (r) { return "pulverulento " + fmt(r.m, 1) + " %"; },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.m, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">Teor de materiais pulverulentos — ' + esc(r.base || "—") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.dif) ? fmt(r.dif, 2) + " %" : "—") + '</div>' +
        '<div class="fe-res-r">Diferença entre as duas determinações (máximo ' + fmt(r.tol, 1) + " %)" +
        (ok(r.dif) ? (r.dif <= r.tol + 1e-9 ? ' · <span class="fe-ok">ok</span>' : ' · <span class="fe-nok">excede</span>') : "") + "</div></div></div>";
    },
    relatorio: {
      parametros: [["Lavagem", "peneiras de 1,2 mm sobre 0,075 mm e fundo; água sem detergente ou dispersante, até ficar semelhante à da torneira; secagem a 105 °C ± 5 °C"]],
      notas: "m = (mi − mf)/mf × 100 (eq. 1, como impressa na norma: a divisão é pela massa final; o texto de 7 a) fala em porcentagem da massa da amostra ensaiada — a linha \"referido à massa inicial\" é só informativa). Resultado: média de duas determinações; se diferirem mais de 0,5 % (graúdo) ou 1,0 % (miúdo), faz-se uma terceira e adota-se a média das duas mais próximas (7 c).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Teor de materiais pulverulentos", fmt(r.m, 1) + " % — " + (r.base || "—") +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.limite, 1) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.limite, 1) + " %")]);
        rows.push(["Diferença entre as duas primeiras determinações", ok(r.dif) ? fmt(r.dif, 2) + " % (máximo " + fmt(r.tol, 1) + " %)" : "—"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Areia média para concreto — 2 determinações", dados: function () {
        return { ident: { registro: "EX-PU-001", camada: "Areia média", origem: "Porto de areia B" },
          params: { material: "Areia média natural", tipo: "miudo", dmn: "4,75", limite: "3,0" },
          det: [{ mi: "512,4", mf: "498,9" }, { mi: "507,8", mf: "494,6" }] };
      } },
      { nome: "Brita 1 — diferença acima de 0,5 %, terceira determinação", dados: function () {
        return { ident: { registro: "EX-PU-002", camada: "Brita 1", origem: "Pedreira X" },
          params: { material: "Brita 1", tipo: "graudo", dmn: "19", limite: "1,0" },
          det: [{ mi: "2614,0", mf: "2593,2" }, { mi: "2588,5", mf: "2553,9" }, { mi: "2602,7", mf: "2580,1" }] };
      } },
      { nome: "Pó de pedra — amostra abaixo da massa mínima, teor acima do limite", dados: function () {
        return { ident: { registro: "EX-PU-003", camada: "Pó de pedra", origem: "Pedreira A" },
          params: { material: "Pó de pedra", tipo: "miudo", dmn: "4,75", limite: "5,0" },
          det: [{ mi: "468,2", mf: "421,5" }, { mi: "503,6", mf: "455,0" }] };
      } },
    ],
  };
})();
