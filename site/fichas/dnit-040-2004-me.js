/*
 * Ficha: DNIT 040/2004-ME — Pavimento rígido — Selante de juntas — Aderência selante × substrato.
 * Usa o código comum de window.FE.selantes (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, S = FE.selantes;
  var N = 3;  // CPs por condição (5.2)
  var LOCAIS = { S: "no selante", I: "na interface selante × argamassa", A: "na argamassa junto à garra" };
  function codLocal(t) {
    var s = String(t || "").trim().toUpperCase().charAt(0);
    return LOCAIS[s] ? s : "";
  }

  FE.FICHAS["dnit-040-2004-me"] = {
    titulo: "Selante de juntas — aderência selante × substrato",
    rotuloImportar: function (r) { return r.conforme === true ? "atende à DNIT 046-EM" : r.conforme === false ? "não atende à DNIT 046-EM" : "sem verificação"; },
    resumo: "Selante moldado no vão de 6 mm entre duas bordas de argamassa (12 × 30 × 55 mm) e tracionado até a ruptura: tensão de ruptura TR = CR / (e × l) e alongamento AR = (dr − di) / di × 100 (seção 7); local de ruptura registrado.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: selante de poliuretano — Fornecedor A" },
      S.paramJunta("perda de aderência após envelhecimento < 10 % (5.1 a, 5.2 a); alongamento > 200 % (5.3 e)"),
      S.paramSeries(N, "5.2"),
      { k: "cura", r: "Cura (tempo especificado pelo fabricante)", ph: "ex.: 7 dias", dica: "5.1 c" },
    ].concat(S.paramsCond("6 a"), [S.paramVeloc]),
    padrao: { junta: "", serie: "normal" },
    tabelas: function (d) {
      var modo = (d.params || {}).serie;
      S.ajustar(d, "cp", modo === "todas" ? 3 * N : N);
      return [{
        chave: "cp", titulo: "Corpos-de-prova", rotulo: "CP", iniciais: N, min: N, fixo: true, nomes: S.nomes(modo, N),
        dica: "N = cura normal, E = após estufa, I = após intemperismo; local de ruptura: S (selante), I (interface) ou A (argamassa)",
        linhas: [
          { k: "e", r: "Espessura da seção do selante — e (borda de 12 mm)", u: "mm", padrao: "_e", padraoFixo: "12" },
          { k: "l", r: "Largura da seção do selante — l (borda de 30 mm)", u: "mm", padrao: "_l", padraoFixo: "30" },
          { k: "di", r: "Distância inicial entre as bordas — di (5.1 a)", u: "mm", padrao: "_di", padraoFixo: "6" },
          { k: "cr", r: "Carga de ruptura — CR (6 c)", u: "N" },
          { k: "dr", r: "Distância entre as bordas na ruptura — dr (6 c)", u: "mm" },
          { k: "loc", r: "Local de ruptura — S / I / A (6 c)", texto: true, ph: "S, I ou A" },
          { calc: "tr", r: "Tensão de ruptura TR = CR / (e × l) (7.1)", u: "MPa", casas: 3, destaque: true },
          { calc: "ar", r: "Alongamento de ruptura AR (7.2)", u: "%", casas: 0, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, modo = P.serie, avisos = [], nomes = S.nomes(modo, N);
      var cps = (d.cp || []).map(function (x, i) {
        var e = ok(num(x.e)) ? num(x.e) : 12, l = ok(num(x.l)) ? num(x.l) : 30, di = ok(num(x.di)) ? num(x.di) : 6;
        var cr = num(x.cr), dr = num(x.dr), nm = "CP " + nomes[i] + ": ";
        var o = { tr: ok(cr) && e > 0 && l > 0 ? cr / (e * l) : NaN, ar: ok(dr) && di > 0 ? (dr - di) / di * 100 : NaN, loc: codLocal(x.loc) };
        if (ok(num(x.di)) && Math.abs(num(x.di) - 6) > 0.5) avisos.push(nm + "vão inicial de " + fmt(di, 1) + " mm; o selante preenche um vão de 6 mm (5.1 a).");
        if (ok(dr) && dr <= di) avisos.push(nm + "distância na ruptura não é maior que a inicial — confira.");
        if (String(x.loc || "").trim() && !o.loc) avisos.push(nm + "local de ruptura \"" + x.loc + "\" não reconhecido — use S, I ou A.");
        return o;
      });
      var gs = S.resumo(modo, N, cps, ["tr", "ar"]);
      gs.forEach(function (g) {
        var parte = cps.slice(g.ini, g.ini + g.n);
        g.locais = { S: 0, I: 0, A: 0 };
        parte.forEach(function (o) { if (o.loc) g.locais[o.loc]++; });
        if (g.locais.I) avisos.push(g.nome + ": " + g.locais.I + " ruptura(s) na interface selante × argamassa (falha de aderência).");
        if (g.locais.A) avisos.push(g.nome + ": " + g.locais.A + " ruptura(s) na argamassa junto à garra — a tensão de aderência não foi atingida.");
      });
      S.avisoContagem(gs, "tr", avisos, "5.2");
      S.avisosCond(P, avisos, "6 a"); S.avisoVeloc(P, avisos);
      var verif = [];
      // perda de aderência após envelhecimento = redução da tensão de ruptura em relação à cura normal (5.1 a, 5.2 a)
      var limP = S.limite(P, "aderencia");
      if (limP) {
        if (modo !== "todas") avisos.push("A DNIT 046/2004-EM (" + limP.sec + ") verifica a perda de aderência após o envelhecimento: escolha \"cura normal + estufa + intemperismo\".");
        gs.forEach(function (g) {
          if (g.k === "N" || !ok(g.V.tr)) return;
          var perda = -g.V.tr, c = S.confere(perda, limP);
          verif.push({ r: "Perda de aderência — " + g.nome, v: fmt(perda, 1) + " %", c: c, lim: S.textoLim(limP, "%") });
          if (c === false) avisos.push(g.nome + ": perda de aderência de " + fmt(perda, 1) + " % (limite < 10 %, DNIT 046/2004-EM, " + limP.sec + ").");
        });
      }
      var limA = S.limite(P, "alongAderencia");
      if (limA) gs.forEach(function (g) {
        if (!ok(g.m.ar)) return;
        var c = S.confere(g.m.ar, limA);
        verif.push({ r: "Alongamento — " + g.nome, v: fmt(g.m.ar, 0) + " %", c: c, lim: S.textoLim(limA, "%") });
        if (c === false) avisos.push(g.nome + ": alongamento de " + fmt(g.m.ar, 0) + " %, não superior a 200 % (DNIT 046/2004-EM, 5.3 e).");
      });
      var conforme = S.parecerGeral(verif.map(function (x) { return x.c; }));
      return { tab: { cp: cps }, resultados: { series: gs, verif: verif, conforme: conforme, tr: gs[0].m.tr, ar: gs[0].m.ar }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, n0 = r.series[0];
      return '<div class="fe-res">' +
        S.item(fmt(n0.m.tr, 3), "MPa", "Tensão de ruptura (aderência) — " + esc(n0.nome), null) +
        S.item(fmt(n0.m.ar, 0), "%", "Alongamento de ruptura — " + esc(n0.nome), null) +
        r.verif.map(function (v) { return S.item(esc(v.v), "", esc(v.r) + " (" + esc(v.lim) + ")", v.c, true); }).join("") +
        "</div>" + FE.FICHAS["dnit-040-2004-me"].relatorio.extraHtml(calc, d, false);
    },
    relatorio: {
      notas: "TR = CR / (e × l), com e × l = seção do selante aderida à borda (12 mm × 30 mm na Figura 1) (7.1); AR = (dr − di) / di × 100, di = 6 mm (7.2). Resultados por condição = média dos três CPs. Perda de aderência após envelhecimento (DNIT 046/2004-EM, 5.1 a e 5.2 a) tomada como a redução da tensão de ruptura em relação à cura normal: −V, com V = (ve − va) / va × 100 (DNIT 044 e 045, seção 6).",
      extraHtml: function (calc, d, relat) {
        var r = calc.resultados;
        var h = S.tabela(r.series, [{ k: "tr", r: "TR", u: "MPa", casas: 3, v: true }, { k: "ar", r: "AR", u: "%", casas: 0, v: true }], relat !== false);
        return h + '<p class="nota">Local de ruptura — ' + r.series.map(function (g) {
          return esc(g.nome) + ": selante " + g.locais.S + ", interface " + g.locais.I + ", argamassa " + g.locais.A;
        }).join("; ") + ".</p>";
      },
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        r.series.forEach(function (g) { rows.push([g.nome + " — TR / AR", fmt(g.m.tr, 3) + " MPa / " + fmt(g.m.ar, 0) + " %"]); });
        r.verif.forEach(function (v) { rows.push([v.r, v.v + S.txt(v.c, v.lim)]); });
        if (r.conforme !== null) rows.push(["Parecer — " + S.nomeJunta(P.junta), r.conforme ? "Atende" : "NÃO ATENDE"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Poliuretano — 9 CPs, perda de aderência abaixo de 10 %", dados: function () {
        function cp(cr, dr, loc) { return { e: "12,0", l: "30,0", di: "6", cr: cr, dr: dr, loc: loc }; }
        return { ident: { registro: "EX-SEL-AD-01", obra: "Obra A", origem: "Fornecedor A", camada: "Selante — juntas transversais" },
          params: { material: "Selante de poliuretano monocomponente", junta: "retracao", serie: "todas", cura: "7 dias", temp: "23", horas: "3", veloc: "50" },
          cp: [cp("226", "22", "S"), cp("220", "21", "S"), cp("223", "22", "S"), cp("212", "20", "S"), cp("206", "19", "S"), cp("210", "20", "S"),
            cp("205", "19", "S"), cp("202", "18", "S"), cp("208", "19", "I")] };
      } },
      { nome: "Selante betuminoso — descolamento após intemperismo", dados: function () {
        function cp(cr, dr, loc) { return { e: "12,0", l: "30,0", di: "6", cr: cr, dr: dr, loc: loc }; }
        return { ident: { registro: "EX-SEL-AD-02", obra: "Obra B", origem: "Fornecedor B", camada: "Selante — juntas longitudinais" },
          params: { material: "Selante betuminoso elastomérico", junta: "articulacao", serie: "todas", cura: "3 dias", temp: "23", horas: "2", veloc: "50" },
          cp: [cp("180", "25", "S"), cp("176", "24", "S"), cp("184", "26", "S"), cp("168", "22", "S"), cp("165", "22", "I"), cp("170", "23", "S"),
            cp("140", "16", "I"), cp("136", "15", "I"), cp("145", "17", "I")] };
      } },
    ],
  };
})();
