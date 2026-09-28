/*
 * Ficha: DNIT 042/2004-ME — Pavimento rígido — Selante de juntas — Rasgamento.
 * Usa o código comum de window.FE.selantes (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, S = FE.selantes;
  var N = 3;  // CPs por condição (5.2)

  FE.FICHAS["dnit-042-2004-me"] = {
    titulo: "Selante de juntas — rasgamento",
    resumo: "CPs cunhados de placa de 2 mm (cunho com ângulo de 90°), tracionados a 50 cm/min; carga de rasgamento por unidade de espessura CR = c / e, em N/mm (7.1); três CPs por condição.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: selante de silicone — Fornecedor A" },
      S.paramJunta("resistência ao rasgamento > 4 N/mm — só para junta de expansão (5.3 f)"),
      S.paramSeries(N, "5.2"),
      { k: "crMin", r: "Resistência mínima ao rasgamento (N/mm) — opcional", dica: "usado quando não se escolhe a junta de expansão da EM",
        se: function (d) { return (d.params || {}).junta !== "expansao"; } },
      S.paramIdade("5.1 c"),
    ].concat(S.paramsCond("6 a"), [S.paramVeloc]),
    padrao: { junta: "", serie: "normal" },
    tabelas: function (d) {
      var modo = (d.params || {}).serie;
      S.ajustar(d, "cp", modo === "todas" ? 3 * N : N);
      return [{
        chave: "cp", titulo: "Corpos-de-prova", rotulo: "CP", iniciais: N, min: N, fixo: true, nomes: S.nomes(modo, N),
        dica: "N = cura normal, E = após estufa, I = após intemperismo",
        linhas: [
          { k: "e", r: "Espessura na porção central — e (6 b)", u: "mm", ph: "2,00" },
          { k: "c", r: "Carga máxima de rasgamento — c (6 d)", u: "N" },
          { calc: "cr", r: "CR = c / e (7.1)", u: "N/mm", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, modo = P.serie, avisos = [], nomes = S.nomes(modo, N);
      var cps = (d.cp || []).map(function (x, i) {
        var e = num(x.e), c = num(x.c);
        if (S.faixa(e, 2, 0.01)) avisos.push("CP " + nomes[i] + ": espessura de " + fmt(e, 2) + " mm, fora de (2,00 ± 0,01) mm da moldagem (5.1 a).");
        return { cr: ok(e) && ok(c) && e > 0 ? c / e : NaN };
      });
      var gs = S.resumo(modo, N, cps, ["cr"]);
      S.avisoContagem(gs, "cr", avisos, "5.2");
      S.avisoIdade(P, avisos, "5.1 c"); S.avisosCond(P, avisos, "6 a"); S.avisoVeloc(P, avisos);
      var lim = S.limite(P, "rasgamento"), limTxt = "";
      if (lim) limTxt = S.textoLim(lim, "N/mm");
      else if (ok(num(P.crMin))) { lim = { v: num(P.crMin), op: "≥" }; limTxt = "≥ " + fmt(lim.v, 1) + " N/mm — limite informado"; }
      if (P.junta && P.junta !== "expansao") avisos.push("A DNIT 046/2004-EM só exige resistência ao rasgamento para juntas de expansão (5.3 f).");
      var verif = [];
      if (lim) gs.forEach(function (g) {
        if (!ok(g.m.cr)) return;
        var c = S.confere(g.m.cr, lim);
        verif.push({ r: "Rasgamento — " + g.nome, v: fmt(g.m.cr, 1) + " N/mm", c: c });
        if (c === false) avisos.push(g.nome + ": resistência ao rasgamento de " + fmt(g.m.cr, 1) + " N/mm (" + limTxt + ").");
      });
      return { tab: { cp: cps }, resultados: { series: gs, lim: lim, limTxt: limTxt, verif: verif, conforme: S.parecerGeral(verif.map(function (x) { return x.c; })), cr: gs[0].m.cr }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, n0 = r.series[0];
      return '<div class="fe-res">' + S.item(fmt(n0.m.cr, 1), "N/mm", "Resistência ao rasgamento — " + esc(n0.nome), null) +
        (r.lim ? S.item(r.conforme ? "Atende" : "Não atende", "", esc(r.limTxt) + " — todas as condições ensaiadas", r.conforme, true) : "") +
        "</div>" + FE.FICHAS["dnit-042-2004-me"].relatorio.extraHtml(calc, d, false);
    },
    relatorio: {
      notas: "CR = c / e, carga máxima de rasgamento por unidade de espessura, em N/mm (7.1). Resultado por condição = média dos três CPs (5.2). Entre parênteses, variação após envelhecimento V = (ve − va) / va × 100 (DNIT 044 e 045, seção 6).",
      extraHtml: function (calc, d, relat) {
        return S.tabela(calc.resultados.series, [{ k: "cr", r: "CR", u: "N/mm", casas: 1, v: true }], relat !== false);
      },
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        r.series.forEach(function (g) { rows.push(["Resistência ao rasgamento — " + g.nome, fmt(g.m.cr, 1) + " N/mm"]); });
        if (r.lim) rows.push(["Parecer" + (P.junta ? " — " + S.nomeJunta(P.junta) : ""), (r.conforme ? "Atende" : "NÃO ATENDE") + " (" + r.limTxt + ")"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Silicone — 9 CPs, junta de expansão, atende", dados: function () {
        return { ident: { registro: "EX-SEL-RG-01", obra: "Obra C", origem: "Fornecedor C", camada: "Selante — junta de expansão" },
          params: { material: "Selante de silicone de baixo módulo", junta: "expansao", serie: "todas", idade: "7", temp: "23", horas: "2", veloc: "50" },
          cp: [{ e: "2,00", c: "19" }, { e: "2,01", c: "18" }, { e: "2,00", c: "20" }, { e: "2,00", c: "18" }, { e: "1,99", c: "17" },
            { e: "2,00", c: "18" }, { e: "2,00", c: "16" }, { e: "2,01", c: "17" }, { e: "2,00", c: "16" }] };
      } },
      { nome: "Selante betuminoso — rasgamento abaixo de 4 N/mm", dados: function () {
        return { ident: { registro: "EX-SEL-RG-02", obra: "Obra D", origem: "Fornecedor D", camada: "Selante — junta de expansão" },
          params: { material: "Selante betuminoso elastomérico", junta: "expansao", serie: "normal", idade: "7", temp: "23", horas: "2", veloc: "50" },
          cp: [{ e: "2,00", c: "7" }, { e: "2,01", c: "8" }, { e: "2,00", c: "7" }] };
      } },
    ],
  };
})();
