/*
 * Ficha: DNIT 043/2004-ME — Pavimento rígido — Selante de juntas — Absorção de água.
 * Usa o código comum de window.FE.selantes (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, S = FE.selantes;
  var N = 3;  // CPs por condição (5.2)

  FE.FICHAS["dnit-043-2004-me"] = {
    titulo: "Selante de juntas — absorção de água",
    rotuloImportar: function (r) { return r.conforme === true ? "atende à DNIT 046-EM" : r.conforme === false ? "não atende à DNIT 046-EM" : "sem verificação"; },
    resumo: "CPs de 25 × 75 × 2 mm imersos em água destilada, 48 h a (50 ± 1) °C e 1 h a (23 ± 2) °C; ABS = (M₂ − M₁) / M₁ × 100 (7.1); três CPs por condição.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: selante de poliuretano — Fornecedor A" },
      S.paramJunta("absorção após envelhecimento < 5 % (5.1 d, 5.2 d) ou < 4 % (5.3 a)"),
      S.paramSeries(N, "5.2"),
      S.paramIdade("5.1 c"),
      { k: "tBanho", r: "Temperatura do banho-maria (°C)", ph: "50", dica: "(50 ± 1) °C (6 d)" },
      { k: "hBanho", r: "Tempo no banho-maria (h)", ph: "48", dica: "48 horas (6 d)" },
      { k: "tAgua", r: "Temperatura da água destilada de imersão e resfriamento (°C)", ph: "23", dica: "(23 ± 2) °C (6 b, 6 e)" },
      { k: "hRes", r: "Tempo de resfriamento na água (h)", ph: "1", dica: "1 hora (6 e)" },
    ],
    padrao: { junta: "", serie: "normal" },
    tabelas: function (d) {
      var modo = (d.params || {}).serie;
      S.ajustar(d, "cp", modo === "todas" ? 3 * N : N);
      return [{
        chave: "cp", titulo: "Corpos-de-prova", rotulo: "CP", iniciais: N, min: N, fixo: true, nomes: S.nomes(modo, N),
        dica: "N = cura normal, E = após estufa, I = após intemperismo; pesagens ao ar com precisão de 1 mg",
        linhas: [
          { k: "m1", r: "Massa inicial — M₁ (6 a)", u: "g" },
          { k: "m2", r: "Massa após o ensaio — M₂ (6 g)", u: "g" },
          { k: "deg", r: "Degradação da superfície (6 h)", texto: true, ph: "não / sim" },
          { calc: "abs", r: "ABS = (M₂ − M₁) / M₁ × 100 (7.1)", u: "%", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, modo = P.serie, avisos = [], nomes = S.nomes(modo, N);
      var cps = (d.cp || []).map(function (x, i) {
        var m1 = num(x.m1), m2 = num(x.m2), nm = "CP " + nomes[i] + ": ";
        var o = { abs: ok(m1) && ok(m2) && m1 > 0 ? (m2 - m1) / m1 * 100 : NaN };
        if (ok(o.abs) && o.abs < 0) avisos.push(nm + "perda de massa na imersão (M₂ < M₁) — verifique degradação ou lixiviação do selante.");
        if (/^s/i.test(String(x.deg || "").trim())) avisos.push(nm + "degradação da superfície observada (6 h).");
        return o;
      });
      var gs = S.resumo(modo, N, cps, ["abs"]);
      S.avisoContagem(gs, "abs", avisos, "5.2");
      S.avisoIdade(P, avisos, "5.1 c");
      var tb = num(P.tBanho), hb = num(P.hBanho), ta = num(P.tAgua), hr = num(P.hRes);
      if (S.faixa(tb, 50, 1)) avisos.push("Banho-maria a " + fmt(tb, 1) + " °C, fora de (50 ± 1) °C (6 d).");
      if (ok(hb) && hb !== 48) avisos.push("Permanência de " + fmt(hb, 1) + " h no banho-maria; a norma fixa 48 horas (6 d).");
      if (S.faixa(ta, 23, 2)) avisos.push("Água destilada a " + fmt(ta, 1) + " °C, fora de (23 ± 2) °C (6 b, 6 e).");
      if (ok(hr) && hr !== 1) avisos.push("Resfriamento de " + fmt(hr, 1) + " h na água; a norma fixa 1 hora (6 e).");
      // a EM exige a absorção medida após o envelhecimento; sem séries envelhecidas, verifica-se a cura normal como indicação
      var lim = S.limite(P, "absorcao"), verif = [];
      if (lim) {
        var alvo = modo === "todas" ? gs.filter(function (g) { return g.k !== "N"; }) : gs;
        if (modo !== "todas") avisos.push("A DNIT 046/2004-EM (" + lim.sec + ") exige a absorção após o envelhecimento; com \"somente cura normal\" o valor é verificado apenas como indicação.");
        alvo.forEach(function (g) {
          if (!ok(g.m.abs)) return;
          var c = S.confere(g.m.abs, lim);
          verif.push({ r: "Absorção — " + g.nome, v: fmt(g.m.abs, 2) + " %", c: c });
          if (c === false) avisos.push(g.nome + ": absorção de " + fmt(g.m.abs, 2) + " %, não inferior a " + fmt(lim.v, 0) + " % (DNIT 046/2004-EM, " + lim.sec + ").");
        });
      }
      return { tab: { cp: cps }, resultados: { series: gs, lim: lim, verif: verif, conforme: S.parecerGeral(verif.map(function (x) { return x.c; })), abs: gs[0].m.abs }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, n0 = r.series[0];
      return '<div class="fe-res">' + S.item(fmt(n0.m.abs, 2), "%", "Absorção de água — " + esc(n0.nome), null) +
        r.verif.map(function (v) { return S.item(esc(v.v), "", esc(v.r) + " (" + esc(S.textoLim(r.lim, "%")) + ")", v.c, true); }).join("") +
        "</div>" + FE.FICHAS["dnit-043-2004-me"].relatorio.extraHtml(calc, d, false);
    },
    relatorio: {
      notas: "ABS = (M₂ − M₁) / M₁ × 100 (7.1); massas em g com precisão de 1 mg (a norma as expressa em mg, o que não altera a razão). Resultado por condição = média dos três CPs (5.2). O requisito da DNIT 046/2004-EM é aplicado às séries envelhecidas.",
      extraHtml: function (calc, d, relat) {
        return S.tabela(calc.resultados.series, [{ k: "abs", r: "ABS", u: "%", casas: 2 }], relat !== false);
      },
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        r.series.forEach(function (g) { rows.push(["Absorção de água — " + g.nome, fmt(g.m.abs, 2) + " %"]); });
        if (r.lim) rows.push(["Parecer — " + S.nomeJunta(P.junta), (r.conforme ? "Atende" : "NÃO ATENDE") + " (" + S.textoLim(r.lim, "%") + ", após envelhecimento)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Poliuretano — 9 CPs, junta de retração, atende", dados: function () {
        return { ident: { registro: "EX-SEL-AB-01", obra: "Obra A", origem: "Fornecedor A", camada: "Selante — juntas transversais" },
          params: { material: "Selante de poliuretano monocomponente", junta: "retracao", serie: "todas", idade: "7", tBanho: "50", hBanho: "48", tAgua: "23", hRes: "1" },
          cp: [{ m1: "4,512", m2: "4,566", deg: "não" }, { m1: "4,487", m2: "4,543", deg: "não" }, { m1: "4,530", m2: "4,583", deg: "não" },
            { m1: "4,498", m2: "4,580", deg: "não" }, { m1: "4,521", m2: "4,601", deg: "não" }, { m1: "4,476", m2: "4,558", deg: "não" },
            { m1: "4,505", m2: "4,613", deg: "não" }, { m1: "4,493", m2: "4,600", deg: "não" }, { m1: "4,518", m2: "4,628", deg: "não" }] };
      } },
      { nome: "Junta de expansão — absorção após intemperismo acima de 4 %", dados: function () {
        return { ident: { registro: "EX-SEL-AB-02", obra: "Obra C", origem: "Fornecedor C", camada: "Selante — junta de expansão" },
          params: { material: "Selante acrílico", junta: "expansao", serie: "todas", idade: "7", tBanho: "52", hBanho: "48", tAgua: "23", hRes: "1" },
          cp: [{ m1: "4,210", m2: "4,318", deg: "não" }, { m1: "4,195", m2: "4,301", deg: "não" }, { m1: "4,226", m2: "4,335", deg: "não" },
            { m1: "4,188", m2: "4,330", deg: "não" }, { m1: "4,203", m2: "4,349", deg: "não" }, { m1: "4,215", m2: "4,357", deg: "não" },
            { m1: "4,176", m2: "4,372", deg: "sim" }, { m1: "4,201", m2: "4,391", deg: "sim" }, { m1: "4,190", m2: "4,381", deg: "não" }] };
      } },
    ],
  };
})();
