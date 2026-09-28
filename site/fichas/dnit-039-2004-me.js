/*
 * Ficha: DNIT 039/2004-ME — Pavimento rígido — Selante de juntas — Tração.
 * Usa o código comum de window.FE.selantes (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, S = FE.selantes;
  var N = 3;  // CPs por condição (5.2)

  FE.FICHAS["dnit-039-2004-me"] = {
    titulo: "Selante de juntas — tração",
    resumo: "CPs cunhados de placa de 2 mm (cunho de 6 mm); tensão de ruptura TR = CR / (e × l), alongamento de ruptura AR e deformação permanente após a ruptura DP (seção 7); três CPs por condição (normal, estufa, intemperismo).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: selante de poliuretano — Fornecedor A" },
      S.paramJunta("alongamento de ruptura ≥ 100 % (5.1 b, 5.2 b — após envelhecimento) ou ≥ 300 % (5.3 b)"),
      S.paramSeries(N, "5.2"),
      { k: "trMin", r: "Tensão de ruptura mínima (N/mm²) — opcional", dica: "a DNIT 046/2004-EM não fixa tensão de tração" },
      S.paramIdade("5.1 c"),
    ].concat(S.paramsCond("6 a"), [S.paramVeloc]),
    padrao: { junta: "", serie: "normal" },
    tabelas: function (d) {
      var modo = (d.params || {}).serie;
      S.ajustar(d, "cp", modo === "todas" ? 3 * N : N);
      return [{
        chave: "cp", titulo: "Corpos-de-prova", rotulo: "CP", iniciais: N, min: N, fixo: true, nomes: S.nomes(modo, N),
        dica: "N = cura normal, E = após estufa, I = após intemperismo (traços marcados após o envelhecimento)",
        linhas: [
          { k: "e", r: "Espessura média da seção central — e (6 c)", u: "mm", ph: "2,00" },
          { k: "l", r: "Largura média do cunho — l (6 c)", u: "mm", ph: "6,00" },
          { k: "di", r: "Distância inicial entre os traços — di (4.2)", u: "mm", ph: "25,0" },
          { k: "cr", r: "Carga de ruptura — CR (6 e)", u: "N" },
          { k: "dr", r: "Distância entre os traços na ruptura — df (6 e)", u: "mm" },
          { k: "d10", r: "Distância 10 min após a ruptura (7.3)", u: "mm" },
          { calc: "tr", r: "Tensão de ruptura TR = CR / (e × l) (7.1)", u: "N/mm²", casas: 2, destaque: true },
          { calc: "ar", r: "Alongamento de ruptura AR (7.2)", u: "%", casas: 0, destaque: true },
          { calc: "dp", r: "Deformação permanente após a ruptura DP (7.3)", u: "%", casas: 1 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, modo = P.serie, avisos = [], nomes = S.nomes(modo, N);
      var cps = (d.cp || []).map(function (x, i) {
        var e = num(x.e), l = num(x.l), di = num(x.di), cr = num(x.cr), dr = num(x.dr), d10 = num(x.d10), nm = "CP " + nomes[i] + ": ";
        var o = {
          tr: ok(cr) && ok(e) && ok(l) && e > 0 && l > 0 ? cr / (e * l) : NaN,
          ar: ok(dr) && ok(di) && di > 0 ? (dr - di) / di * 100 : NaN,
          dp: ok(d10) && ok(di) && di > 0 ? (d10 - di) / di * 100 : NaN,
        };
        if (S.faixa(e, 2, 0.01)) avisos.push(nm + "espessura de " + fmt(e, 2) + " mm, fora de (2,00 ± 0,01) mm da moldagem (5.1 a).");
        if (S.faixa(l, 6, 0.5)) avisos.push(nm + "largura de " + fmt(l, 2) + " mm, fora da largura do cunho (6,00 ± 0,5) mm (4.7).");
        if (S.faixa(di, 25, 0.5)) avisos.push(nm + "traços a " + fmt(di, 1) + " mm, fora de (25,0 ± 0,5) mm do marcador (4.2).");
        if (ok(dr) && ok(di) && dr <= di) avisos.push(nm + "distância na ruptura não é maior que a inicial — confira.");
        if (ok(d10) && ok(dr) && d10 > dr) avisos.push(nm + "distância 10 min após a ruptura maior que a da ruptura — confira.");
        if (ok(d10) && ok(di) && d10 < di) avisos.push(nm + "distância 10 min após a ruptura menor que a inicial — confira.");
        return o;
      });
      var gs = S.resumo(modo, N, cps, ["tr", "ar", "dp"]);
      S.avisoContagem(gs, "ar", avisos, "5.2");
      S.avisoIdade(P, avisos, "5.1 c"); S.avisosCond(P, avisos, "6 a"); S.avisoVeloc(P, avisos);
      // requisito da EM para o alongamento: séries exigidas conforme o tipo de junta
      var lim = S.limite(P, "alongTracao"), verif = [];
      if (lim) {
        var exig = P.junta === "retracao" ? ["I"] : P.junta === "articulacao" ? ["E", "I"] : ["N", "E", "I"];
        gs.forEach(function (g) {
          if (exig.indexOf(g.k) === -1 || !ok(g.m.ar)) return;
          var c = S.confere(g.m.ar, lim);
          verif.push({ nome: g.nome, v: g.m.ar, c: c });
          if (c === false) avisos.push(g.nome + ": alongamento de ruptura de " + fmt(g.m.ar, 0) + " %, abaixo do mínimo de " + fmt(lim.v, 0) + " % (DNIT 046/2004-EM, " + lim.sec + ").");
        });
        if (P.junta !== "expansao" && modo !== "todas") {
          avisos.push("A DNIT 046/2004-EM (" + lim.sec + ") exige o alongamento após envelhecimento " + (P.junta === "retracao" ? "por intemperismo" : "em estufa e por intemperismo") +
            "; com \"somente cura normal\" o valor é verificado apenas como indicação.");
          var n0 = gs[0];
          if (ok(n0.m.ar)) verif.push({ nome: n0.nome + " (indicativo)", v: n0.m.ar, c: S.confere(n0.m.ar, lim) });
        }
      }
      var trMin = num(P.trMin), trConf = [];
      if (ok(trMin)) gs.forEach(function (g) {
        if (!ok(g.m.tr)) return;
        trConf.push(g.m.tr >= trMin);
        if (g.m.tr < trMin) avisos.push(g.nome + ": tensão de ruptura de " + fmt(g.m.tr, 2) + " N/mm², abaixo do mínimo informado de " + fmt(trMin, 2) + " N/mm².");
      });
      var conforme = S.parecerGeral(verif.map(function (x) { return x.c; }).concat(trConf));
      return { tab: { cp: cps }, resultados: { series: gs, lim: lim, verif: verif, trMin: trMin, conforme: conforme,
        tr: gs[0].m.tr, ar: gs[0].m.ar, dp: gs[0].m.dp }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, n0 = r.series[0];
      return '<div class="fe-res">' +
        S.item(fmt(n0.m.tr, 2), "N/mm²", "Tensão de ruptura — " + esc(n0.nome), null) +
        S.item(fmt(n0.m.ar, 0), "%", "Alongamento de ruptura — " + esc(n0.nome), null) +
        S.item(fmt(n0.m.dp, 1), "%", "Deformação permanente após a ruptura", null, true) +
        (r.conforme !== null ? S.item(r.conforme ? "Atende" : "Não atende", "", esc(r.lim ? S.textoLim(r.lim, "%") : "limite informado"), r.conforme, true) : "") +
        "</div>" + FE.FICHAS["dnit-039-2004-me"].relatorio.extraHtml(calc, d, false);
    },
    relatorio: {
      notas: "TR = CR / (e × l) (7.1); AR = (df − di) / di × 100, df na ruptura (7.2); DP = (df − di) / di × 100, df medida 10 min após a ruptura (7.3). Resultados por condição = média dos três CPs (5.2). Variação após envelhecimento V = (ve − va) / va × 100 (DNIT 044 e 045, seção 6).",
      extraHtml: function (calc, d, relat) {
        var r = calc.resultados;
        return S.tabela(r.series, [{ k: "tr", r: "TR", u: "N/mm²", casas: 2, v: true }, { k: "ar", r: "AR", u: "%", casas: 0, v: true },
          { k: "dp", r: "DP", u: "%", casas: 1, v: true }], relat !== false);
      },
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        r.series.forEach(function (g) {
          rows.push([g.nome + " — TR / AR / DP", fmt(g.m.tr, 2) + " N/mm² / " + fmt(g.m.ar, 0) + " % / " + fmt(g.m.dp, 1) + " %"]);
        });
        r.verif.forEach(function (v) { rows.push(["Alongamento — " + v.nome, fmt(v.v, 0) + " %" + S.txt(v.c, S.textoLim(r.lim, "%"))]); });
        if (ok(r.trMin)) rows.push(["Tensão de ruptura mínima informada", fmt(r.trMin, 2) + " N/mm²"]);
        if (r.conforme !== null) rows.push(["Parecer" + (P.junta ? " — " + S.nomeJunta(P.junta) : ""), r.conforme ? "Atende" : "NÃO ATENDE"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Selante de poliuretano — 9 CPs, junta de retração, atende", dados: function () {
        function cp(e, l, cr, dr, d10) { return { e: e, l: l, di: "25,0", cr: cr, dr: dr, d10: d10 }; }
        return { ident: { registro: "EX-SEL-TR-01", obra: "Obra A", origem: "Fornecedor A", camada: "Selante — juntas transversais" },
          params: { material: "Selante de poliuretano monocomponente", junta: "retracao", serie: "todas", idade: "7", temp: "23", horas: "3", veloc: "50" },
          cp: [cp("2,00", "6,02", "18", "140,0", "28,5"), cp("2,01", "6,00", "17", "136,5", "28,0"), cp("2,00", "6,01", "19", "143,0", "29,0"),
            cp("2,00", "6,00", "20", "128,0", "27,5"), cp("1,99", "6,02", "20", "125,5", "27,0"), cp("2,00", "6,01", "21", "130,0", "27,5"),
            cp("2,01", "6,00", "19", "118,0", "27,0"), cp("2,00", "6,01", "18", "115,5", "26,5"), cp("2,00", "6,00", "20", "121,0", "27,0")] };
      } },
      { nome: "Selante para junta de expansão — alongamento abaixo de 300 %", dados: function () {
        return { ident: { registro: "EX-SEL-TR-02", obra: "Obra C", origem: "Fornecedor C", camada: "Selante — junta de expansão (encontro de ponte)" },
          params: { material: "Selante de silicone", junta: "expansao", serie: "normal", trMin: "0,5", idade: "5", temp: "24", horas: "2", veloc: "52" },
          cp: [{ e: "2,00", l: "6,00", di: "25,0", cr: "7", dr: "82,5", d10: "27,0" }, { e: "2,05", l: "6,01", di: "25,0", cr: "6", dr: "80,0", d10: "26,5" },
            { e: "2,00", l: "6,02", di: "25,0", cr: "7", dr: "86,0", d10: "27,0" }] };
      } },
    ],
  };
})();
