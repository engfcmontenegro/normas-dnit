/*
 * Ficha: DNER-ME 243/94 — Material termoplástico — Densidade relativa (picnômetro).
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * D 25 °C/25 °C = (C − A) / [(B − A) − (P − C)] (5): A = picnômetro; B = picnômetro + água; C = picnômetro + termoplástico;
 * P = picnômetro + termoplástico + água. Limite opcional: DNER-EM 372/2000, 5.5 — 1,85 a 2,25.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ESPEC = [["372", "DNER-EM 372/2000 — densidade relativa 1,85 a 2,25 (5.5)", 1.85, 2.25, "DNER-EM 372/2000, 5.5"]];

  FE.FICHAS["dner-me-243-94"] = {
    titulo: "Material termoplástico — densidade relativa",
    resumo: "Picnômetro de 25 ml seco a (50 ± 5) °C; pesagens do picnômetro (A), com água a 25 °C (B), com ≈ 5 g de termoplástico (C) e com termoplástico + água a 25 °C (P): D = (C − A) / [(B − A) − (P − C)].",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: termoplástico branco" },
      { k: "tAgua", r: "Temperatura da água destilada (4.3, 4.8 — 25 °C) — registrado (°C)" },
      { k: "tEstufa", r: "Temperatura de secagem do picnômetro (4.1 — 50 ± 5 °C) — registrado (°C)" },
    ].concat(S.paramsLimite(ESPEC, "", "DNER-EM 372/2000 (5.5)")),
    padrao: { espec: "" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 1, min: 1,
        dica: "pesagens com aproximação de 0,000 1 g; evitar bolhas de ar ao completar com água (4.8)",
        linhas: [
          { k: "A", r: "Picnômetro seco, A (4.2)", u: "g" },
          { k: "B", r: "Picnômetro + água, B (4.4)", u: "g" },
          { k: "C", r: "Picnômetro + termoplástico, C (4.7 — ≈ 5 g de material)", u: "g" },
          { k: "P", r: "Picnômetro + termoplástico + água, P (4.10)", u: "g" },
          { calc: "m", r: "Massa de termoplástico, C − A", u: "g", casas: 4 },
          { calc: "vd", r: "Água deslocada, (B − A) − (P − C)", u: "g", casas: 4 },
          { calc: "D", r: "D 25/25 °C = (C − A) / [(B − A) − (P − C)] (5)", u: "", casas: 3, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var tA = num(P.tAgua), tE = num(P.tEstufa);
      if (ok(tA) && Math.abs(tA - 25) > 0.5) avisos.push("Água a " + fmt(tA, 1) + " °C — a densidade é referida a 25 °C/25 °C (4.3, 4.8).");
      if (ok(tE) && (tE < 45 || tE > 55)) avisos.push("Picnômetro seco a " + fmt(tE, 0) + " °C — a norma prescreve (50 ± 5) °C (4.1).");
      var dets = (d.det || []).map(function (x, i) {
        var A = num(x.A), B = num(x.B), C = num(x.C), Pp = num(x.P), rot = "Determinação " + (i + 1) + ": ";
        var m = ok(A) && ok(C) ? C - A : NaN, vd = ok(A) && ok(B) && ok(C) && ok(Pp) ? (B - A) - (Pp - C) : NaN;
        var o = { m: m, vd: vd, D: ok(m) && ok(vd) && vd > 0 ? m / vd : NaN };
        if (ok(m) && (m < 4.5 || m > 5.5)) avisos.push(rot + "massa de termoplástico de " + fmt(m, 4) + " g; a norma indica cerca de 5 g (4.7) — aviso fora de ±10 %.");
        if (ok(vd) && vd <= 0) avisos.push(rot + "água deslocada nula ou negativa — confira as pesagens.");
        if (ok(A) && ok(B) && (B - A < 20 || B - A > 30)) avisos.push(rot + "B − A = " + fmt(B - A, 2) + " g, incompatível com picnômetro de 25 ml (3 b) — confira.");
        return o;
      });
      var vals = dets.map(function (o) { return o.D; }).filter(ok);
      var D = vals.length ? Math.round(media(vals) * 100) / 100 : NaN;
      var lim = S.limite(P, ESPEC), conf = S.confere(D, lim);
      if (conf === false) avisos.unshift("Densidade relativa de " + fmt(D, 2) + ", fora do limite de " + S.textoLim(lim, 2, "") + " (" + lim.ref + ").");
      var amp = vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN;
      return { tab: { det: dets }, resultados: { D: D, n: vals.length, amp: amp, lim: lim, conforme: conf }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card(ok(r.D) ? fmt(r.D, 2) : "—", "Densidade relativa 25 °C/25 °C" + (r.n > 1 ? " — média de " + r.n + " determinações" : "") +
        (r.lim ? " · limite " + esc(S.textoLim(r.lim, 2, "")) + S.sit(r.conforme) : ""), true) +
        (ok(r.amp) ? S.card(fmt(r.amp, 3), "Diferença entre determinações (a norma não fixa tolerância)") : "") + "</div>";
    },
    relatorio: {
      notas: "D 25 °C/25 °C = (C − A) / [(B − A) − (P − C)] (5), com A = picnômetro, B = picnômetro + água, C = picnômetro + termoplástico e P = picnômetro + termoplástico + água, em gramas; água destilada a 25 °C. " +
        "Resultado com duas casas decimais (a norma não fixa o arredondamento); com mais de uma determinação, relata-se a média.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Densidade relativa 25 °C/25 °C", (ok(r.D) ? fmt(r.D, 2) : "—") + (r.n > 1 ? " (média de " + r.n + " determinações)" : "")]);
        if (r.lim) rows.push(["Especificação", S.textoLim(r.lim, 2, "") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Termoplástico branco — D = 2,05", dados: function () {
        return { ident: { registro: "EX-TP243-01", data: "2026-04-08", obra: "Obra A", local: "Partida 115", origem: "Fornecedor D", camada: "Termoplástico branco (extrusão)" },
          params: { material: "Termoplástico branco", tAgua: "25", tEstufa: "50", espec: "372" },
          det: [{ A: "25,1234", B: "50,2231", C: "30,1356", P: "52,7925" }] };
      } },
      { nome: "Termoplástico amarelo — densidade abaixo de 1,85 (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP243-02", data: "2026-04-09", obra: "Obra B", local: "Partida 88", origem: "Fornecedor E", camada: "Termoplástico amarelo (aspersão)" },
          params: { material: "Termoplástico amarelo", tAgua: "25", tEstufa: "50", espec: "372" },
          det: [{ A: "25,1234", B: "50,2231", C: "30,1300", P: "52,3189" }, { A: "24,9870", B: "50,0902", C: "29,9912", P: "52,1990" }] };
      } },
    ],
  };
})();
