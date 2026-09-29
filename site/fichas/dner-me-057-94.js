/*
 * Ficha: DNER-ME 057/94 — Microesferas de vidro — Teor de sílica.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * % SiO₂ = (B₂ − B₁) / A × 100 (7): A = massa da amostra; B₂ = massa após a ignição a 1 200 °C (6.2.11);
 * B₁ = massa após o tratamento com HF (6.2.12.2). Limite opcional: ≥ 65 % (DNER-EM 373/2000, 5.6; DNER-EM 379/98, 5.5).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ESPEC = [
    ["373", "DNER-EM 373/2000 — microesferas: teor de sílica ≥ 65 % (5.6)", 65, null, "DNER-EM 373/2000, 5.6"],
    ["379", "DNER-EM 379/98 — esferas de vidro: teor de sílica ≥ 65 % (5.5)", 65, null, "DNER-EM 379/98, 5.5"],
  ];

  FE.FICHAS["dner-me-057-94"] = {
    titulo: "Microesferas de vidro — teor de sílica",
    resumo: "Amostra triturada (passando na 0,15 mm) e seca; ~0,5 g fundidos com Na₂CO₃, atacados com HCl, dupla desidratação, ignição a 1 200 °C (B₂) e volatilização com HF (B₁): % SiO₂ = (B₂ − B₁) / A × 100.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: microesferas tipo F (drop-on)" },
      { k: "cadinho", r: "Pesagens B₂ e B₁", tipo: "select", opcoes: [["conjunto", "Cadinho + resíduo (a tara se cancela na diferença)"], ["residuo", "Só o resíduo"]],
        dica: "a sílica é a diferença entre as duas pesagens (6.2.13)" },
    ].concat(S.paramsLimite(ESPEC, "%", "DNER-EM 373/2000 (5.6) ou DNER-EM 379/98 (5.5)")),
    padrao: { cadinho: "conjunto", espec: "" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 1, min: 1,
        dica: "pesagens com aproximação de 0,000 1 g (3 a); repetir a ignição até massa constante (6.2.11)",
        linhas: [
          { k: "A", r: "Massa da amostra, A (6.2.1 — aprox. 0,5 g)", u: "g" },
          { k: "B2", r: "Massa após ignição a 1 200 °C, B₂ (6.2.11)", u: "g" },
          { k: "B1", r: "Massa após tratamento com HF, B₁ (6.2.12.2)", u: "g" },
          { calc: "si", r: "Massa de sílica, B₂ − B₁ (6.2.13)", u: "g", casas: 4 },
          { calc: "pct", r: "Teor de SiO₂ = (B₂ − B₁) / A × 100 (7)", u: "%", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var dets = (d.det || []).map(function (x, i) {
        var A = num(x.A), B2 = num(x.B2), B1 = num(x.B1), rot = "Determinação " + (i + 1) + ": ";
        var si = ok(B2) && ok(B1) ? B2 - B1 : NaN, o = { si: si, pct: ok(si) && ok(A) && A > 0 ? si / A * 100 : NaN };
        if (ok(A) && (A < 0.45 || A > 0.55)) avisos.push(rot + "massa de " + fmt(A, 4) + " g; a norma pede aproximadamente 0,5 g (6.2.1) — aviso fora de ±10 %.");
        if (ok(si) && si <= 0) avisos.push(rot + "B₁ maior ou igual a B₂ — confira as pesagens.");
        if (ok(o.pct) && o.pct > 100) avisos.push(rot + "teor acima de 100 % — confira as pesagens.");
        if (P.cadinho === "residuo" && ok(si) && ok(A) && B2 > A + 1e-9) avisos.push(rot + "resíduo B₂ maior que a amostra — confira (as pesagens incluem o cadinho?).");
        return o;
      });
      var vals = dets.map(function (o) { return o.pct; }).filter(ok);
      var pct = vals.length ? Math.round(media(vals) * 10) / 10 : NaN;
      var lim = S.limite(P, ESPEC), conf = S.confere(pct, lim);
      if (conf === false) avisos.unshift("Teor de sílica de " + fmt(pct, 1) + " %, fora do limite " + S.textoLim(lim, 0, "%") + " (" + lim.ref + ").");
      var amp = vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN;
      return { tab: { det: dets }, resultados: { pct: pct, n: vals.length, amp: amp, lim: lim, conforme: conf }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card((ok(r.pct) ? fmt(r.pct, 1) : "—") + " <small>%</small>",
        "Teor de sílica (SiO₂)" + (r.n > 1 ? " — média de " + r.n + " determinações" : "") + (r.lim ? " · limite " + esc(S.textoLim(r.lim, 0, "%")) + S.sit(r.conforme) : ""), true) +
        (ok(r.amp) ? S.card(fmt(r.amp, 2) + " %", "Diferença entre determinações (a norma não fixa tolerância)") : "") + "</div>";
    },
    relatorio: {
      notas: "% SiO₂ = (B₂ − B₁) / A × 100 (7), com A = massa da amostra, B₂ = massa após ignição a 1 200 °C até massa constante e B₁ = massa após volatilização da sílica com HF e H₂SO₄ (6.2.11 a 6.2.13). " +
        "Resultado com uma casa decimal (a norma não fixa o arredondamento); com mais de uma determinação, relata-se a média.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Teor de sílica (SiO₂)", (ok(r.pct) ? fmt(r.pct, 1) + " %" : "—") + (r.n > 1 ? " (média de " + r.n + " determinações)" : "")]);
        if (r.lim) rows.push(["Especificação", S.textoLim(r.lim, 0, "%") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Microesferas tipo F — duplicata, 71,6 %", dados: function () {
        return { ident: { registro: "EX-MV057-01", data: "2026-03-18", obra: "Obra A", local: "Lote 12", origem: "Fornecedor A", camada: "Microesferas tipo F (drop-on)" },
          params: { material: "Microesferas de vidro tipo F", cadinho: "conjunto", espec: "373" },
          det: [{ A: "0,5012", B2: "28,4671", B1: "28,1082" }, { A: "0,4987", B2: "27,9135", B1: "27,5566" }] };
      } },
      { nome: "Esferas de vidro — teor de sílica abaixo de 65 % (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV057-02", data: "2026-03-19", obra: "Obra C", local: "Lote 21", origem: "Fornecedor C", camada: "Esferas de vidro (DNER-EM 379)" },
          params: { material: "Esferas de vidro", cadinho: "conjunto", espec: "379" },
          det: [{ A: "0,5004", B2: "28,3920", B1: "28,0937" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-057-94"].rotuloImportar = function (r) { return "sílica " + window.FE.fmt(r.pct, 1) + " %"; };
})();
