/*
 * Ficha: DNER-ME 038/94 — Tinta para demarcação viária — determinação da estabilidade na armazenagem.
 * Usa FE.sinalizacao (definido em dner-me-018-94.js): limites das EM e Tabela II de Unidades Krebs da DNER-ME 028/94.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, K = S.krebs, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  FE.FICHAS["dner-me-038-94"] = {
    titulo: "Tinta para demarcação viária — estabilidade na armazenagem",
    resumo: "Consistência a 25 °C (DNER-ME 028) antes e depois de 16 h em estufa a 60 ± 5 °C em recipiente fechado cheio até 3/4; resultado: diferença entre as duas consistências (seção 6).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "importar", r: "Consistência inicial: importar de um ensaio salvo (DNER-ME 028)", tipo: "importar", de: "dner-me-028-94",
        dica: "copia a consistência (UK) para a coluna \"Inicial\"",
        aplicar: function (e, P, d) {
          var r = e.resultados || {};
          d.det = d.det && d.det.length ? d.det : [{}, {}];
          if (ok(r.uk)) { d.det[0].uk = String(r.uk); d.det[0].g = ""; }
          P.orig028 = ((e.dados || {}).ident || {}).registro || "";
        } },
      { k: "orig028", r: "Ensaio de consistência de origem (DNER-ME 028)" },
      { k: "test", r: "Temperatura da estufa (°C) — 60 ± 5 °C (5.4)", ph: "60" },
      { k: "hest", r: "Tempo na estufa (h) — 16 h (5.4)", ph: "16" },
      { k: "tfim", r: "Temperatura da tinta na segunda determinação (°C) — 25 ± 2 °C (5.5)", ph: "25" },
    ]).concat(S.paramsEspec("estabArm")),
    padrao: { cor: "branca", espec: "" },
    tabelas: function (d) {
      if (Array.isArray(d.det)) { while (d.det.length < 2) d.det.push({}); if (d.det.length > 2) d.det.length = 2; }
      return [{ chave: "det", titulo: "Determinações de consistência (DNER-ME 028)", rotulo: "Determinação", iniciais: 2, min: 2, fixo: true,
        nomes: ["Inicial (5.2)", "Após a estufa (5.5)"],
        dica: "informe a consistência em UK ou a carga que dá 100 rotações em 30 s / 200 rpm (convertida pela Tabela II da DNER-ME 028)",
        linhas: [
          { k: "uk", r: "Consistência determinada", u: "UK" },
          { k: "g", r: "…ou carga para 100 rotações em 30 s (200 rpm)", u: "g" },
          { calc: "UK", r: "Consistência considerada", u: "UK", casas: 0, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var det = (d.det || []).map(function (p, i) {
        var u = num(p.uk), g = num(p.g);
        var v = ok(u) ? u : Math.round(K.ukCarga(g));
        if (!ok(u) && ok(g) && !ok(K.ukCarga(g))) avisos.push((i ? "Após a estufa" : "Inicial") + ": carga de " + fmt(g, 0) + " g fora da Tabela II (70 a 1 090 g).");
        return { UK: ok(v) ? v : NaN };
      });
      var t = num(P.test), h = num(P.hest), tf = num(P.tfim);
      if (ok(t) && (t < 55 || t > 65)) avisos.push("Temperatura da estufa " + fmt(t, 0) + " °C fora de 60 ± 5 °C (5.4).");
      if (ok(h) && Math.abs(h - 16) > 1e-9) avisos.push("Período na estufa de " + fmt(h, 1) + " h; a norma prescreve 16 h (5.4).");
      if (ok(tf) && (tf < 23 || tf > 27)) avisos.push("Segunda determinação a " + fmt(tf, 1) + " °C; esfriar até 25 ± 2 °C sem destampar (5.5).");
      var ui = (det[0] || {}).UK, uf = (det[1] || {}).UK;
      var delta = ok(ui) && ok(uf) ? uf - ui : NaN;
      var lim = S.limite("estabArm", P), conf = S.confere(Math.abs(delta), lim);
      if (conf === false) avisos.push("Alteração de consistência de " + fmt(Math.abs(delta), 0) + " UK acima do máximo " + S.textoLimite(lim, "UK", 0) + " (" + lim.fonte + ").");
      return { tab: { det: det }, resultados: { ui: ui, uf: uf, delta: delta, lim: lim, conforme: conf }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.itemRes((ok(r.delta) ? (r.delta > 0 ? "+" : "") + fmt(r.delta, 0) : "—") + " <small>UK</small>",
        "Alteração de consistência (final − inicial)" + (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "UK", 0)) + " " + S.selo(r.conforme) : "")) +
        S.itemRes(fmt(r.ui, 0) + " → " + fmt(r.uf, 0) + " <small>UK</small>", "Consistência inicial → após 16 h a 60 °C", "fe-res-p") + "</div>";
    },
    relatorio: {
      notas: "Resultado: diferença entre as consistências determinadas antes (5.2) e depois (5.5) de 16 h em estufa a 60 ± 5 °C (seção 6). A especificação limita a alteração de consistência em valor absoluto. Carga → UK pela Tabela II da DNER-ME 028/94.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.tinta) rows.push(["Tinta", P.tinta + " — " + (P.cor || "") + (P.lote ? " — lote " + P.lote : "")]);
        rows.push(["Consistência inicial / após a estufa", fmt(r.ui, 0) + " UK / " + fmt(r.uf, 0) + " UK"]);
        rows.push(["Alteração de consistência", (ok(r.delta) ? (r.delta > 0 ? "+" : "") + fmt(r.delta, 0) + " UK" : "—") +
          (r.lim ? " — " + S.parecer("", Math.abs(r.delta), r.lim, "UK", 0) : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — alteração de 3 UK (atende)", dados: function () {
        return { ident: { registro: "EX-TS-038-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368", test: "60", hest: "16", tfim: "25" },
          det: [{ uk: "90" }, { g: "285" }] };
      } },
      { nome: "Tinta amarela — espessamento de 12 UK na estufa (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-038-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371", test: "62", hest: "16", tfim: "25" },
          det: [{ uk: "84" }, { uk: "96" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-038-94"].rotuloImportar = function (r) { return "alteração de consistência " + window.FE.fmt(r.delta, 0) + " UK"; };
})();
