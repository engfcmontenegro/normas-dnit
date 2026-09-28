/*
 * Ficha: DNIT 041/2004-ME — Pavimento rígido — Selante de juntas — Deformação permanente à compressão.
 * Usa o código comum de window.FE.selantes (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, S = FE.selantes;
  var N = 2;  // CPs por condição (5.2)

  FE.FICHAS["dnit-041-2004-me"] = {
    titulo: "Selante de juntas — deformação permanente à compressão",
    resumo: "CPs cilíndricos de 25 × 25 mm comprimidos 6 h entre placas com espaçadores de 40 % da altura; após 2 h de repouso, DP = (hi − hf) / (hi − he) × 100 (7.1); dois CPs por condição.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: selante de poliuretano — Fornecedor A" },
      S.paramJunta("deformação permanente < 50 % (5.1 c, 5.2 c) ou < 20 % (5.3 c)"),
      S.paramSeries(N, "5.2"),
      { k: "obtencao", r: "Obtenção dos CPs (5.1 c)", tipo: "select", opcoes: [["", "—"], ["extracao", "Extração"], ["corte", "Corte de placas"], ["moldagem", "Moldagem em fôrmas antiaderentes"]] },
      { k: "idade", r: "Idade ao obter os CPs (dias)", ph: "7", dica: "aguardar sete dias após a moldagem (5.1 d)" },
    ].concat(S.paramsCond("6 a"), [
      { k: "tComp", r: "Tempo sob compressão (h)", ph: "6", dica: "6 horas (6 e)" },
      { k: "tRep", r: "Repouso antes de medir a altura final (h)", ph: "2", dica: "2 horas sobre superfície plana (6 f)" },
    ]),
    padrao: { junta: "", serie: "normal" },
    tabelas: function (d) {
      var modo = (d.params || {}).serie;
      S.ajustar(d, "cp", modo === "todas" ? 3 * N : N);
      return [{
        chave: "cp", titulo: "Corpos-de-prova", rotulo: "CP", iniciais: N, min: N, fixo: true, nomes: S.nomes(modo, N),
        dica: "N = cura normal, E = após estufa, I = após intemperismo; alturas com precisão de 0,02 mm (6 b)",
        linhas: [
          { k: "dia", r: "Diâmetro (5.1 a)", u: "mm", ph: "25,0" },
          { k: "hi", r: "Altura original — hi (6 b)", u: "mm" },
          { k: "he", r: "Altura do espaçador — he (6 c)", u: "mm" },
          { k: "hf", r: "Altura final após 2 h de repouso — hf (6 g)", u: "mm" },
          { calc: "rel", r: "Espaçador / altura original (40,0 ± 0,2 %)", u: "%", casas: 1 },
          { calc: "dp", r: "DP = (hi − hf) / (hi − he) × 100 (7.1)", u: "%", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, modo = P.serie, avisos = [], nomes = S.nomes(modo, N);
      var cps = (d.cp || []).map(function (x, i) {
        var dia = num(x.dia), hi = num(x.hi), he = num(x.he), hf = num(x.hf), nm = "CP " + nomes[i] + ": ";
        var o = { rel: ok(hi) && ok(he) && hi > 0 ? he / hi * 100 : NaN, dp: ok(hi) && ok(he) && ok(hf) && hi > he ? (hi - hf) / (hi - he) * 100 : NaN };
        if (S.faixa(dia, 25, 1)) avisos.push(nm + "diâmetro de " + fmt(dia, 2) + " mm, fora de (25,0 ± 1,0) mm (5.1 a).");
        if (S.faixa(hi, 25, 0.5)) avisos.push(nm + "altura de " + fmt(hi, 2) + " mm, fora de (25,0 ± 0,5) mm (5.1 a).");
        if (S.faixa(o.rel, 40, 0.2)) avisos.push(nm + "espaçador com " + fmt(o.rel, 1) + " % da altura original; deve ter (40,0 ± 0,2) % (4.2, 6 c).");
        if (ok(hf) && ok(hi) && hf > hi) avisos.push(nm + "altura final maior que a original — confira.");
        if (ok(hf) && ok(he) && hf < he) avisos.push(nm + "altura final menor que a do espaçador — confira.");
        return o;
      });
      var gs = S.resumo(modo, N, cps, ["dp"]);
      S.avisoContagem(gs, "dp", avisos, "5.2");
      S.avisosCond(P, avisos, "6 a");
      var idade = num(P.idade), tc = num(P.tComp), tr = num(P.tRep);
      if (ok(idade) && idade < 7) avisos.push("CPs obtidos com " + fmt(idade, 0) + " dia(s); aguardar sete dias após a moldagem (5.1 d).");
      if (ok(tc) && tc !== 6) avisos.push("Compressão mantida por " + fmt(tc, 1) + " h; a norma fixa 6 horas (6 e).");
      if (ok(tr) && tr < 2) avisos.push("Repouso de " + fmt(tr, 1) + " h antes da medida final; a norma fixa 2 horas (6 f).");
      var lim = S.limite(P, "dpComp"), verif = [];
      if (lim) gs.forEach(function (g) {
        if (!ok(g.m.dp)) return;
        var c = S.confere(g.m.dp, lim);
        verif.push({ r: "Deformação permanente — " + g.nome, v: fmt(g.m.dp, 1) + " %", c: c });
        if (c === false) avisos.push(g.nome + ": deformação permanente de " + fmt(g.m.dp, 1) + " %, não inferior a " + fmt(lim.v, 0) + " % (DNIT 046/2004-EM, " + lim.sec + ").");
      });
      return { tab: { cp: cps }, resultados: { series: gs, lim: lim, verif: verif, conforme: S.parecerGeral(verif.map(function (x) { return x.c; })), dp: gs[0].m.dp }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, n0 = r.series[0];
      return '<div class="fe-res">' + S.item(fmt(n0.m.dp, 1), "%", "Deformação permanente à compressão — " + esc(n0.nome), null) +
        (r.lim ? S.item(r.conforme ? "Atende" : "Não atende", "", esc(S.textoLim(r.lim, "%")) + " — todas as condições ensaiadas", r.conforme, true) : "") +
        "</div>" + FE.FICHAS["dnit-041-2004-me"].relatorio.extraHtml(calc, d, false);
    },
    relatorio: {
      notas: "DP = (hi − hf) / (hi − he) × 100 (7.1) — a expressão da norma omite o fator 100, mas define DP em percentual. Resultado por condição = média dos dois CPs (5.2). Entre parênteses, variação após envelhecimento V = (ve − va) / va × 100 (DNIT 044 e 045, seção 6).",
      extraHtml: function (calc, d, relat) {
        return S.tabela(calc.resultados.series, [{ k: "dp", r: "DP", u: "%", casas: 1, v: true }], relat !== false);
      },
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        r.series.forEach(function (g) { rows.push(["Deformação permanente — " + g.nome, fmt(g.m.dp, 1) + " %"]); });
        if (r.lim) rows.push(["Parecer — " + S.nomeJunta(P.junta), (r.conforme ? "Atende" : "NÃO ATENDE") + " (" + S.textoLim(r.lim, "%") + ")"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Poliuretano — 6 CPs, junta de retração, atende", dados: function () {
        return { ident: { registro: "EX-SEL-DC-01", obra: "Obra A", origem: "Fornecedor A", camada: "Selante — juntas transversais" },
          params: { material: "Selante de poliuretano monocomponente", junta: "retracao", serie: "todas", obtencao: "moldagem", idade: "7",
            temp: "23", horas: "2", tComp: "6", tRep: "2" },
          cp: [{ dia: "25,1", hi: "25,02", he: "10,00", hf: "22,10" }, { dia: "24,9", hi: "24,96", he: "10,00", hf: "22,04" },
            { dia: "25,0", hi: "25,10", he: "10,04", hf: "21,90" }, { dia: "25,0", hi: "24,98", he: "10,00", hf: "21,86" },
            { dia: "25,2", hi: "25,04", he: "10,00", hf: "21,52" }, { dia: "25,0", hi: "24,94", he: "10,00", hf: "21,48" }] };
      } },
      { nome: "Junta de expansão — deformação permanente acima de 20 %", dados: function () {
        return { ident: { registro: "EX-SEL-DC-02", obra: "Obra C", origem: "Fornecedor C", camada: "Selante — junta de expansão" },
          params: { material: "Selante de silicone", junta: "expansao", serie: "normal", obtencao: "corte", idade: "7",
            temp: "23", horas: "2", tComp: "6", tRep: "1,5" },
          cp: [{ dia: "25,0", hi: "25,06", he: "10,00", hf: "20,80" }, { dia: "25,3", hi: "25,62", he: "10,00", hf: "21,20" }] };
      } },
    ],
  };
})();
