/*
 * Ficha: DNER-ME 183/94 — Tinta para demarcação viária — determinação da cor.
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, C = S.COND, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var CONDICOES = [
    C.espessura("5.2.2"),
    C.temp("tseca", "Temperatura de secagem", 25, 2, "5.2.3"),
    C.duracao("hseca", "Tempo de secagem na horizontal", 24, "5.2.3"),
    { k: "local", r: "Local livre de poeira e de luz solar direta (5.2.3) — S/N", texto: true, ph: "S/N" },
  ];
  // "N 9.5", "N9,0" -> {tipo:"N", v}; "10YR 7,5/14", "2.0Y 7.5/14" -> {tipo:"H", matiz, fam, v, c}
  function lerMunsell(t) {
    var s = String(t || "").toUpperCase().replace(/,/g, ".").trim(), m;
    if (!s) return null;
    if (/PADR/.test(s)) return { tipo: "padrao" };
    if ((m = /^N\s*\.?\s*(\d+(?:\.\d+)?)/.exec(s))) return { tipo: "N", v: Number(m[1]) };
    if ((m = /^(\d+(?:\.\d+)?)\s*(YR|Y|R|GY)\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/.exec(s))) {
      return { tipo: "H", matiz: Number(m[1]), fam: m[2], v: Number(m[3]), c: Number(m[4]) };
    }
    return { tipo: "?" };
  }
  function igual(a, matiz, fam, v, c) { return a.tipo === "H" && a.fam === fam && Math.abs(a.matiz - matiz) < 1e-6 && Math.abs(a.v - v) < 1e-6 && Math.abs(a.c - c) < 1e-6; }

  // avalia a cor frente ao requisito das EM (Tabela 3 da 276; Tabela 2 da 368/371)
  function avaliar(cor, m, tol) {
    if (!m) return { conf: null, motivo: "" };
    if (cor === "amarela") {
      if (m.tipo === "N" || m.tipo === "padrao") return { conf: false, motivo: "notação neutra/padrão branco para tinta amarela" };
      if (m.tipo !== "H") return { conf: tol === undefined ? null : tol, motivo: "notação não reconhecida — vale a comparação com a escala" };
      if (igual(m, 2, "Y", 7.5, 14) || igual(m, 10, "YR", 6.5, 14)) return { conf: false, motivo: "notação expressamente excluída (2,0Y 7,5/14 e 10YR 6,5/14)" };
      if (igual(m, 10, "YR", 7.5, 14)) return { conf: true, motivo: "igual à notação exigida 10YR 7,5/14" };
      return { conf: tol === undefined ? null : tol, motivo: tol === undefined ? "informe se está dentro das tolerâncias da escala Munsell" : (tol ? "dentro das tolerâncias da escala" : "fora das tolerâncias da escala") };
    }
    if (m.tipo === "padrao") return { conf: tol === false ? false : true, motivo: "correspondente ao padrão branco do laboratório" };
    if (m.tipo === "N") return m.v >= 9.0 - 1e-9 ? { conf: true, motivo: "N " + fmt(m.v, 1) + " ≥ N 9,0 (tolerância de N 9,5)" } : { conf: false, motivo: "N " + fmt(m.v, 1) + " abaixo da tolerância N 9,0" };
    return { conf: false, motivo: "tinta branca com notação cromática (" + (m.fam || "?") + ")" };
  }

  FE.FICHAS["dner-me-183-94"] = {
    titulo: "Tinta para demarcação viária — cor",
    resumo: "Película úmida de 0,38 mm em placa de folha-de-flandres, 24 h a 25 °C sem poeira e sem sol; comparação com o padrão branco do laboratório (escala Munsell) ou com a escala Munsell para tinta amarela; resultado: notação Munsell (seção 6).",
    blocos: [],
    params: S.paramsTinta().concat(S.paramsEspec("cor")),
    padrao: { cor: "branca", espec: "" },
    tabelas: function () {
      return [{ chave: "cps", titulo: "Placas ensaiadas", rotulo: "Placa", iniciais: 1, min: 1,
        dica: "uma coluna por placa; notação como \"N 9.5\", \"10YR 7,5/14\" ou \"padrão branco\"",
        linhas: [{ grupo: "Condições do ensaio (tolerâncias da norma)" }].concat(CONDICOES).concat([
          { grupo: "Comparação com os padrões de cor (5.2.4)" },
          { k: "not", r: "Notação Munsell da tonalidade (ou \"padrão branco\")", texto: true, ph: "N 9.5" },
          { k: "tol", r: "Dentro das tolerâncias da escala / do padrão? — S/N", texto: true, ph: "S/N" },
        ]) }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fora = 0;
      var req = S.qualiReq("cor", P);
      if (req) {  // só a parte da cor ensaiada
        var parte = req.req.split("; ").filter(function (x) { return x.indexOf(P.cor === "amarela" ? "amarela" : "branca") === 0; })[0];
        if (parte) req.req = parte.replace(/^(branca|amarela): /, "");
      }
      var tab = (d.cps || []).map(function (p, i) {
        var rot = "Placa " + (i + 1), o = {};
        if (!S.temDados(p)) { o.vazio = true; return o; }
        fora += S.verificarCondicoes(CONDICOES, p, rot, avisos);
        if (S.sn(p.local) === false) avisos.push(rot + ": a secagem deve ser em local livre de poeira e de luz solar direta (5.2.3).");
        o.m = lerMunsell(p.not);
        o.not = String(p.not || "").trim();
        if (!o.not) avisos.push(rot + ": informe a notação Munsell ou \"padrão branco\" (seção 6).");
        else if (o.m && o.m.tipo === "?") avisos.push(rot + ": notação \"" + o.not + "\" não reconhecida (use, por exemplo, N 9.5 ou 10YR 7,5/14).");
        o.av = avaliar(P.cor, o.m, S.sn(p.tol));
        return o;
      });
      var us = tab.filter(function (o) { return !o.vazio && o.not; });
      var conf = !req ? null : us.some(function (o) { return o.av.conf === false; }) ? false
        : us.length && us.every(function (o) { return o.av.conf === true; }) ? true : null;
      if (req && conf === false) avisos.push("Cor fora do requisito da especificação (" + req.fonte + ").");
      if (req && conf === null && us.length) avisos.push("Informe se a tonalidade está dentro das tolerâncias da escala para concluir a verificação.");
      if (fora) avisos.push("Ensaio com condição fora do prescrito na norma: repita nas condições da norma.");
      return { tab: { cps: tab.map(function () { return {}; }) }, resultados: {
        notacoes: us.map(function (o) { return o.not; }), motivos: us.map(function (o) { return o.av.motivo; }).filter(Boolean),
        req: req, conforme: conf, fora: fora }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      var h = '<div class="fe-res">' + S.itemRes(r.notacoes.length ? esc(r.notacoes.join(" · ")) : "—",
        "Notação Munsell — tinta " + esc(P.cor || "branca") + (r.fora ? " · condições fora da norma" : ""));
      if (r.req) h += S.itemRes(esc(r.req.req), "Exigido — " + esc(r.req.fonte) + (r.conforme === null ? "" : " · " + S.selo(r.conforme)), "fe-res-p");
      if (r.motivos.length) h += S.itemRes(esc(r.motivos.join(" · ")), "Avaliação", "fe-res-p");
      return h + "</div>";
    },
    relatorio: {
      notas: "Resultado: notação da escala Munsell ou do padrão correspondente à tonalidade (seção 6). Especificações (Munsell Highway): branca N 9.5 (tolerância N 9.0) ou padrão branco; amarela 10YR 7,5/14 e suas tolerâncias, exceto 2,0Y 7,5/14 e 10YR 6,5/14. Para a amarela, notação diferente da nominal depende da comparação com a escala (campo \"dentro das tolerâncias\").",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.tinta) rows.push(["Tinta", P.tinta + " — " + (P.cor || "") + (P.lote ? " — lote " + P.lote : "")]);
        rows.push(["Cor — notação Munsell", r.notacoes.join("; ") || "—"]);
        if (r.motivos.length) rows.push(["Avaliação", r.motivos.join("; ")]);
        if (r.req) rows.push(["Exigido (" + r.req.fonte + ")", r.req.req + (r.conforme === null ? "" : r.conforme ? " — ATENDE" : " — NÃO ATENDE")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Tinta branca — N 9.5, conforme", dados: function () {
        return { ident: { registro: "EX-TS-183-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368" },
          cps: [{ esp: "0,38", tseca: "25", hseca: "24", local: "S", not: "N 9.5", tol: "S" }] };
      } },
      { nome: "Tinta amarela — 10YR 6,5/14 (notação excluída), não conforme", dados: function () {
        return { ident: { registro: "EX-TS-183-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          cps: [{ esp: "0,38", tseca: "25", hseca: "24", local: "S", not: "10YR 6,5/14", tol: "N" }] };
      } },
    ],
  };
})();
