/*
 * Ficha: DNIT 424/2020-ME — Agregado — Índice de forma com crivos (circular e redutor).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Tabela 1 — graduações: frações [passa (tamanho diretriz), retido, massa (g), crivo 1, crivo 2] (mm)
  var GRAD = {
    A: [[76.0, 63.5, 3000, 38.0, 25.0], [63.5, 50.0, 3000, 32.0, 21.0], [50.0, 38.0, 3000, 25.0, 17.0], [38.0, 32.0, 3000, 19.0, 12.7]],
    B: [[32.0, 25.0, 3000, 16.0, 10.5], [25.0, 19.0, 3000, 12.7, 8.5], [19.0, 16.0, 3000, 9.5, 6.3]],
    C: [[19.0, 16.0, 2000, 9.5, 6.3], [16.0, 12.7, 2000, 8.0, 5.3], [12.7, 9.5, 2000, 6.3, 4.2]],
    D: [[12.7, 9.5, 1000, 6.3, 4.2], [9.5, 6.3, 1000, 4.8, 3.2]],
  };
  // 4 c: peneiras para ensaio (granulometria da amostra original, 5 a e 8 b)
  var PEN = [76.0, 63.5, 50.0, 38.0, 25.0, 19.0, 12.7, 9.5, 4.8];
  function mm(v) { return fmt(v, 1); }
  function chPen(v) { return "r" + String(v).replace(".", "_"); }
  function nomeFr(f) { return mm(f[0]) + "–" + mm(f[1]) + " mm"; }

  function calcFracao(x, f) {
    var M = num(x.m), m1 = num(x.c1), m2 = num(x.c2);
    var o = {};
    if (!ok(M) || M <= 0 || !ok(m1) || !ok(m2)) return o;
    o.p1 = m1 / M * 100;                 // % retida no crivo 1 (7 a)
    o.p2 = m2 / M * 100;                 // % retida no crivo 2 (7 a)
    o.pp = 100 - o.p1 - o.p2;            // % que passa no crivo 2
    o.fi = (o.p1 + 0.5 * o.p2) / 100;    // contribuição da fração (eq. 1 com n = 1)
    return o;
  }

  FE.FICHAS["dnit-424-2020-me"] = {
    titulo: "Agregado graúdo — Índice de forma com crivos",
    resumo: "Frações da graduação escolhida (Tabela 1) passadas nos crivos redutores de ½ e ⅓ do tamanho diretriz; f = (P₁ + 0,5 P₂) / (100 n). f = 1 indica grãos cúbicos; f próximo de 0, grãos lamelares.",
    blocos: [],
    params: [
      { k: "material", r: "Agregado ensaiado (8 a)", ph: "ex.: brita 1 granítica" },
      { k: "graduacao", r: "Graduação (Tabela 1, 5 a–b)", tipo: "select", recarrega: true,
        opcoes: Object.keys(GRAD).map(function (g) {
          var G = GRAD[g];
          return [g, "Graduação " + g + " — " + mm(G[0][0]) + " a " + mm(G[G.length - 1][1]) + " mm, " + G.length + " frações de " +
            fmt(G[0][2], 0) + " g"];
        }),
        dica: "escolhida pela análise granulométrica (DNIT 412-ME) da amostra — informe-a na tabela \"Granulometria\"" },
      { k: "minimo", r: "Índice de forma mínimo exigido — opcional", ph: "0,5",
        dica: "especificações de serviço: f ≥ 0,5 (ex.: DNIT 385/2026-ES; DNIT 031, 166, 169 — \"superior a 0,5\")" },
      { k: "lamMax", r: "Partículas lamelares máximas (%) — opcional", ph: "10",
        dica: "DNIT 406/407-ES: ≤ 10 %; DNIT 167-ES: < 20 %. A ficha toma como lamelar o que passa no crivo 2 (ver nota)" },
    ],
    padrao: { graduacao: "C" },
    tabelas: function (d) {
      var g = (d.params || {}).graduacao || "C", G = GRAD[g];
      return [
        { chave: "gran", titulo: "Granulometria da amostra original (5 a, 8 b)", rotulo: "Peneira", iniciais: 1, min: 1, fixo: true,
          nomes: ["% retida"], dica: "percentual retido em cada peneira de ensaio (DNIT 412-ME) — relatado conforme 8 b",
          linhas: PEN.map(function (p) { return { k: chPen(p), r: "Retido na peneira de " + mm(p) + " mm", u: "%" }; })
            .concat([{ k: "fundo", r: "Passa na 4,8 mm (fundo)", u: "%" }, { calc: "soma", r: "Soma", u: "%", casas: 1 }]) },
        { chave: "fr", titulo: "Frações da graduação " + g + " (Tabela 1; 6 a–c; 7 a)", rotulo: "Fração", iniciais: G.length, min: G.length,
          fixo: true, nomes: G.map(nomeFr),
          dica: "passa no crivo circular do tamanho diretriz e fica retida no seguinte; crivos redutores de abertura retangular",
          linhas: [
            { k: "m", r: "Massa inicial da fração (Tabela 1: " + G.map(function (f) { return fmt(f[2], 0); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(" / ") + " g)", u: "g" },
            { k: "c1", r: "Retido no crivo 1 — abertura ½ do tamanho diretriz (6 a): " + G.map(function (f) { return mm(f[3]); }).join(" / ") + " mm", u: "g" },
            { k: "c2", r: "Retido no crivo 2 — abertura ⅓ do tamanho diretriz (6 b): " + G.map(function (f) { return mm(f[4]); }).join(" / ") + " mm", u: "g" },
            { calc: "p1", r: "% retida no crivo 1 (7 a)", u: "%", casas: 1 },
            { calc: "p2", r: "% retida no crivo 2 (7 a)", u: "%", casas: 1 },
            { calc: "pp", r: "% que passa no crivo 2 (lamelares)", u: "%", casas: 1 },
            { calc: "fi", r: "(p₁ + 0,5 p₂) / 100 da fração", u: "", casas: 3, destaque: true },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, g = P.graduacao || "C", G = GRAD[g], avisos = [];
      d.fr = d.fr || [];
      while (d.fr.length < G.length) d.fr.push({});
      if (d.fr.length > G.length) d.fr = d.fr.slice(0, G.length);
      var fr = d.fr.map(function (x, i) {
        var f = G[i], rot = "Fração " + nomeFr(f), o = calcFracao(x, f);
        var M = num(x.m), m1 = num(x.c1), m2 = num(x.c2);
        if (ok(M) && Math.abs(M - f[2]) > f[2] * 0.01) avisos.push(rot + ": massa inicial de " + fmt(M, 0) + " g; a Tabela 1 indica " + fmt(f[2], 0) +
          " g (a norma não fixa tolerância; a ficha alerta acima de 1 %).");
        if (ok(M) && ok(m1) && ok(m2) && m1 + m2 > M) avisos.push(rot + ": crivo 1 + crivo 2 (" + fmt(m1 + m2, 0) + " g) maior que a massa inicial (" + fmt(M, 0) + " g) — confira as pesagens.");
        if ((ok(M) || ok(m1) || ok(m2)) && !ok(o.fi)) avisos.push(rot + ": informe a massa inicial e as massas retidas nos dois crivos.");
        return o;
      });
      var val = fr.filter(function (o) { return ok(o.fi); });
      var n = val.length;
      var P1 = val.reduce(function (s, o) { return s + o.p1; }, 0);
      var P2 = val.reduce(function (s, o) { return s + o.p2; }, 0);
      var f = n ? (P1 + 0.5 * P2) / (100 * n) : NaN;   // eq. 1
      if (n && n < G.length) avisos.push("Só " + n + " de " + G.length + " frações da graduação " + g + " têm dados: n deve ser o número de frações que compõem a graduação (7 b). Resultado provisório com n = " + n + ".");
      var lam = media(val.map(function (o) { return o.pp; }));
      // granulometria (8 b)
      var gr = (d.gran || [])[0] || {}, somaG = 0, temG = false;
      PEN.concat(["fundo"]).forEach(function (p) {
        var v = num(gr[p === "fundo" ? "fundo" : chPen(p)]);
        if (ok(v)) { somaG += v; temG = true; }
      });
      if (temG && Math.abs(somaG - 100) > 1) avisos.push("Granulometria: a soma dos percentuais retidos é " + fmt(somaG, 1) + " % (deveria ser 100 %).");
      if (!temG && n) avisos.push("Informe a granulometria da amostra original (percentual retido em cada peneira) — item obrigatório do relatório (8 b).");
      var minimo = num(P.minimo), lamMax = num(P.lamMax);
      var fR = ok(f) ? Math.round(f * 100) / 100 : NaN;
      var conf = ok(fR) && ok(minimo) ? fR >= minimo : null;
      var confL = ok(lam) && ok(lamMax) ? lam <= lamMax : null;
      if (conf === false) avisos.push("Índice de forma f = " + fmt(fR, 2) + ", abaixo do mínimo exigido de " + fmt(minimo, 2) + ".");
      if (confL === false) avisos.push("Partículas que passam no crivo 2 (lamelares): " + fmt(lam, 1) + " %, acima do máximo de " + fmt(lamMax, 0) + " %.");
      return { tab: { fr: fr, gran: [{ soma: temG ? somaG : NaN }] },
        resultados: { f: f, fR: fR, P1: P1, P2: P2, n: n, nG: G.length, g: g, lam: lam, minimo: minimo, lamMax: lamMax, conforme: conf, confLam: confL,
          gran: temG ? gr : null },
        avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      function sit(c) { return c === null ? "" : c ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>'; }
      return '<div class="fe-res">' +
        cx(ok(r.fR) ? fmt(r.fR, 2) : "—", "Índice de forma f (eq. 1)" + (ok(r.minimo) ? " · mínimo " + fmt(r.minimo, 2) : "") + sit(r.conforme)) +
        cx(fmt(r.P1, 1) + " / " + fmt(r.P2, 1) + " · n = " + r.n, "P₁ / P₂ — somas das % retidas nos crivos 1 e 2", true) +
        cx(ok(r.lam) ? fmt(r.lam, 1) + " %" : "—", "Passa no crivo 2 (lamelares, média das frações)" + (ok(r.lamMax) ? " · máx. " + fmt(r.lamMax, 0) + " %" : "") + sit(r.confLam), true) +
        "</div>";
    },
    relatorio: {
      notas: "f = (P₁ + 0,5 P₂) / (100 n) (eq. 1): P₁ e P₂ = somas das porcentagens retidas nos crivos redutores 1 (½ do tamanho diretriz) e 2 (⅓ do tamanho diretriz) de todas as frações; n = número de frações da graduação. Porcentagens em relação à massa inicial de cada fração (7 a). f = 1 corresponde a grãos cúbicos; f = 0, a grãos lamelares. A norma não define arredondamento: f relatado com duas casas. A \"porcentagem de partículas lamelares\" citada em especificações não é definida pela DNIT 424; a ficha informa, como indicativo, a média das porcentagens que passam no crivo 2.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Agregado ensaiado", P.material]);
        rows.push(["Graduação (Tabela 1)", r.g + " — " + r.n + " de " + r.nG + " frações ensaiadas"]);
        rows.push(["P₁ / P₂", fmt(r.P1, 1) + " % / " + fmt(r.P2, 1) + " %"]);
        rows.push(["Índice de forma f (eq. 1)", (ok(r.fR) ? fmt(r.fR, 2) : "—") +
          (r.conforme === null ? "" : r.conforme ? " — atende ao mínimo de " + fmt(r.minimo, 2) : " — NÃO ATENDE ao mínimo de " + fmt(r.minimo, 2))]);
        rows.push(["Passa no crivo 2 — lamelares (indicativo)", (ok(r.lam) ? fmt(r.lam, 1) + " %" : "—") +
          (r.confLam === null ? "" : r.confLam ? " — atende ao máximo de " + fmt(r.lamMax, 0) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.lamMax, 0) + " %")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 — graduação C, f = 0,73 (atende f ≥ 0,5)", dados: function () {
        return { ident: { registro: "EX-IF-001", camada: "Concreto asfáltico — brita 1", origem: "Pedreira A" },
          params: { material: "Brita 1 granítica", graduacao: "C", minimo: "0,5", lamMax: "10" },
          gran: [{ r76: "0", r63_5: "0", r50: "0", r38: "0", r25: "0", r19: "3,8", r12_7: "46,2", r9_5: "31,5", r4_8: "16,9", fundo: "1,6" }],
          fr: [{ m: "2000", c1: "1180", c2: "640" }, { m: "2001", c1: "1120", c2: "700" }, { m: "2000", c1: "1060", c2: "760" }] };
      } },
      { nome: "Brita 2 — graduação B, massa de fração fora da Tabela 1", dados: function () {
        return { ident: { registro: "EX-IF-002", camada: "Base — brita graduada", origem: "Pedreira B" },
          params: { material: "Brita 2 gnáissica", graduacao: "B", minimo: "0,5" },
          gran: [{ r76: "0", r63_5: "0", r50: "0", r38: "2,1", r25: "38,4", r19: "34,7", r12_7: "19,6", r9_5: "3,4", r4_8: "1,2", fundo: "0,6" }],
          fr: [{ m: "3000", c1: "1512", c2: "1004" }, { m: "2870", c1: "1395", c2: "1011" }, { m: "3002", c1: "1380", c2: "1102" }] };
      } },
      { nome: "Pedrisco lamelar — graduação D, f < 0,5 (não atende)", dados: function () {
        return { ident: { registro: "EX-IF-003", camada: "Tratamento superficial — pedrisco", origem: "Pedreira C" },
          params: { material: "Pedrisco (xisto)", graduacao: "D", minimo: "0,5", lamMax: "10" },
          gran: [{ r76: "0", r63_5: "0", r50: "0", r38: "0", r25: "0", r19: "0", r12_7: "4,2", r9_5: "38,9", r4_8: "49,3", fundo: "7,6" }],
          fr: [{ m: "1000", c1: "298", c2: "322" }, { m: "1000", c1: "276", c2: "305" }] };
      } },
    ],
  };
})();
