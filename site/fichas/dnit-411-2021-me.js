/*
 * Ficha: DNIT 411/2021-ME — Massa específica, densidade relativa e absorção de agregado miúdo
 * (picnômetro de 500 mL, condição saturada superfície seca pelo tronco de cone).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // massa específica da água (g/cm³) por temperatura — NOTA 3: 0,9971 a 25 °C; em outra temperatura, a da água nela
  var AGUA = [[15, 0.99910], [16, 0.99895], [17, 0.99878], [18, 0.99860], [19, 0.99841], [20, 0.99821], [21, 0.99799],
    [22, 0.99777], [23, 0.99754], [24, 0.99730], [25, 0.99705], [26, 0.99679], [27, 0.99652], [28, 0.99624],
    [29, 0.99595], [30, 0.99565], [31, 0.99534], [32, 0.99503], [33, 0.99470], [34, 0.99437], [35, 0.99403]];
  function rhoAgua(T) {
    if (!ok(T)) return 0.9971;
    var v = FE.interpolar(AGUA, T);
    return ok(v) ? Math.round(v * 10000) / 10000 : NaN;
  }
  // precisão (Anexo B, informativo — AASHTO T 84): faixa aceitável entre dois resultados de um operador (d2s)
  var D2S = { gsa: 0.032, gsb: 0.027, abs: 0.31 };

  function det(x, rho) {
    var A = num(x.A), B = num(x.B), C = num(x.C), B1 = num(x.B1);
    var o = {};
    if (ok(A) && ok(B) && ok(C) && A + B - C > 0) { o.gsa = A / (A + B - C); o.mesa = rho * o.gsa; }
    if (ok(A) && ok(B) && ok(C) && ok(B1) && B1 + B - C > 0) { o.gsb = A / (B1 + B - C); o.mesb = rho * o.gsb; }
    if (ok(A) && ok(B1) && A > 0) o.abs = 100 * (B1 - A) / A;
    return o;
  }
  function amplitude(v) { v = v.filter(ok); return v.length > 1 ? Math.max.apply(null, v) - Math.min.apply(null, v) : NaN; }
  function r3(x) { return ok(x) ? Math.round(x * 1000) / 1000 : NaN; }
  function r1(x) { return ok(x) ? Math.round(x * 10) / 10 : NaN; }

  FE.FICHAS["dnit-411-2021-me"] = {
    titulo: "Massa específica, densidade relativa e absorção de agregado miúdo",
    resumo: "Agregado miúdo (passa 4,75 mm, retido 0,075 mm) na condição saturada superfície seca, picnômetro de 500 mL: Gsa = A/(A+B−C), Gsb = A/(B1+B−C), ME = 0,9971 × G, absorção = 100 (B1−A)/A.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: pó de pedra, areia" },
      { k: "temperatura", r: "Temperatura da água no picnômetro (°C)", ph: "25",
        dica: "6 e) e g): (25 ± 2) °C; a massa específica da água é tomada nesta temperatura (NOTA 3)" },
      { k: "cone", r: "Condição saturada superfície seca (5 d, NOTA 2)", tipo: "select",
        opcoes: [["desmoronou", "Cone desmoronou parcial ou totalmente ao retirar o molde"],
          ["lado", "Material angular/com finos: um lado do tronco caiu levemente (NOTA 2)"]] },
    ],
    padrao: { temperatura: "25", cone: "desmoronou" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 1, min: 1,
        dica: "a norma prevê uma determinação; havendo mais de uma, o resultado é a média e a diferença é comparada à precisão do Anexo B",
        linhas: [
          { k: "picn", r: "Picnômetro nº", texto: true },
          { k: "B1", r: "Massa da amostra saturada superfície seca (B1) — (500 ± 10) g (6 b)", u: "g" },
          { k: "C", r: "Picnômetro + amostra + água até a marca (C) (6 e)", u: "g" },
          { k: "A", r: "Massa da amostra seca em estufa (A) (6 f)", u: "g" },
          { k: "B", r: "Picnômetro + água até a marca (B) (6 g)", u: "g" },
          { calc: "gsa", r: "Densidade relativa real Gsa = A / (A + B − C) (eq. 1)", u: "", casas: 3 },
          { calc: "gsb", r: "Densidade relativa aparente Gsb = A / (B1 + B − C) (eq. 2)", u: "", casas: 3 },
          { calc: "mesa", r: "Massa específica real MEsa = ρw × A / (A + B − C) (eq. 3)", u: "g/cm³", casas: 3, destaque: true },
          { calc: "mesb", r: "Massa específica aparente MEsb = ρw × A / (B1 + B − C) (eq. 4)", u: "g/cm³", casas: 3, destaque: true },
          { calc: "abs", r: "Absorção = 100 (B1 − A) / A (eq. 5)", u: "%", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var T = num(P.temperatura), rho = rhoAgua(T);
      if (ok(T) && Math.abs(T - 25) > 2) avisos.push("Temperatura de " + fmt(T, 1) + " °C fora de (25 ± 2) °C (6 e, 6 g).");
      if (!ok(rho)) { avisos.push("Temperatura fora da tabela de massa específica da água (15 °C a 35 °C): usado 0,9971 g/cm³."); rho = 0.9971; }
      var dets = (d.det || []).map(function (x, i) {
        var o = det(x, rho), n = "Determinação " + (i + 1) + ": ";
        var A = num(x.A), B = num(x.B), C = num(x.C), B1 = num(x.B1);
        if (ok(B1) && (B1 < 490 || B1 > 510)) avisos.push(n + "massa saturada superfície seca de " + fmt(B1, 1) + " g fora de (500 ± 10) g (6 b).");
        if (ok(A) && ok(B1) && A > B1) avisos.push(n + "massa seca (A) maior que a massa saturada superfície seca (B1) — confira as pesagens.");
        if (ok(B) && ok(C) && C <= B) avisos.push(n + "C (picnômetro + amostra + água) deve ser maior que B (picnômetro + água).");
        if (ok(A) && ok(B) && ok(C) && A + B - C <= 0) avisos.push(n + "A + B − C ≤ 0: pesagens incoerentes.");
        return o;
      });
      var val = function (k) { return dets.map(function (o) { return o[k]; }).filter(ok); };
      var n = val("gsa").length;
      var R = { rho: rho, T: T, n: n,
        gsa: media(val("gsa")), gsb: media(val("gsb")), mesa: media(val("mesa")), mesb: media(val("mesb")), abs: media(val("abs")),
        dif: { gsa: amplitude(val("gsa")), gsb: amplitude(val("gsb")), abs: amplitude(val("abs")) } };
      if (n > 1) {
        [["gsa", "Gsa", 3], ["gsb", "Gsb", 3], ["abs", "absorção", 2]].forEach(function (q) {
          var v = R.dif[q[0]];
          if (ok(v) && v > D2S[q[0]] + 1e-9) avisos.push("Diferença de " + fmt(v, q[2]) + (q[0] === "abs" ? " %" : "") + " entre determinações na " + q[1] +
            ", acima da faixa aceitável para um operador (d2s = " + fmt(D2S[q[0]], q[0] === "abs" ? 2 : 3) + ", Anexo B — informativo): repita o ensaio.");
        });
      }
      if (P.cone === "lado") avisos.push("Condição SSS pelo critério da NOTA 2 (um lado do tronco cai levemente) — registre no relatório.");
      return { tab: { det: dets }, resultados: R, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function item(v, u, rot, casas) {
        return '<div class="fe-res-item"><div class="fe-res-v">' + fmt(v, casas) + (u ? " <small>" + u + "</small>" : "") + '</div><div class="fe-res-r">' + rot + "</div></div>";
      }
      return '<div class="fe-res">' +
        item(r3(r.mesa), "g/cm³", "Massa específica real (MEsa)", 3) + item(r3(r.mesb), "g/cm³", "Massa específica aparente (MEsb)", 3) +
        item(r3(r.gsa), "", "Densidade relativa real (Gsa)", 3) + item(r3(r.gsb), "", "Densidade relativa aparente (Gsb)", 3) +
        item(r1(r.abs), "%", "Absorção", 1) +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.rho, 4) + ' <small>g/cm³</small></div><div class="fe-res-r">Massa específica da água a ' +
        (ok(r.T) ? fmt(r.T, 1) : "25") + " °C (NOTA 3)" + (r.n > 1 ? " · média de " + r.n + " determinações" : "") + "</div></div></div>";
    },
    relatorio: {
      notas: "Gsa = A/(A+B−C) (eq. 1); Gsb = A/(B1+B−C) (eq. 2); MEsa = 0,9971 × Gsa (eq. 3) e MEsb = 0,9971 × Gsb (eq. 4), com 0,9971 g/cm³ = massa específica da água a 25 °C (NOTA 3: em outra temperatura, usa-se a da água nela); absorção = 100 (B1−A)/A (eq. 5). A = massa seca em estufa; B = picnômetro + água; C = picnômetro + amostra + água; B1 = massa saturada superfície seca. Resultados: massas específicas e densidades com 0,001 e absorção com 0,1 % (seção 8). Havendo mais de uma determinação, o resultado é a média e a diferença é comparada ao d2s de um operador do Anexo B (informativo).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Massa específica real (MEsa)", fmt(r3(r.mesa), 3) + " g/cm³"]);
        rows.push(["Massa específica aparente (MEsb)", fmt(r3(r.mesb), 3) + " g/cm³"]);
        rows.push(["Densidade relativa real (Gsa)", fmt(r3(r.gsa), 3)]);
        rows.push(["Densidade relativa aparente (Gsb)", fmt(r3(r.gsb), 3)]);
        rows.push(["Absorção", fmt(r1(r.abs), 1) + " %"]);
        rows.push(["Massa específica da água usada", fmt(r.rho, 4) + " g/cm³" + (r.n > 1 ? " — resultados: média de " + r.n + " determinações" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Pó de pedra — projeto de traço CBUQ (planilha do laboratório)", dados: function () {
        // PROJETO TRAÇO ASFALTO.xlsx, aba "Densidade PÓ" (a planilha repete a mesma determinação em 3 colunas)
        return { ident: { registro: "EX-411-001", obra: "Obra B", origem: "Pedreira Y", camada: "Pó de pedra — CBUQ", laboratorista: "Equipe" },
          params: { material: "Pó de pedra", temperatura: "25", cone: "desmoronou" },
          det: [{ picn: "1", B1: "500,00", C: "1090,44", A: "494,15", B: "780,18" }] };
      } },
      { nome: "Areia média — duas determinações a 23 °C", dados: function () {
        return { ident: { registro: "EX-411-002", origem: "Areal Y", camada: "Areia — CBUQ" },
          params: { material: "Areia média", temperatura: "23", cone: "desmoronou" },
          det: [{ picn: "2", B1: "501,2", C: "977,6", A: "496,3", B: "667,4" },
            { picn: "3", B1: "499,5", C: "985,3", A: "494,6", B: "676,1" }] };
      } },
      { nome: "Pó de pedra com finos — massa SSS fora de 500 ± 10 g e duplicata fora da precisão", dados: function () {
        return { ident: { registro: "EX-411-003", origem: "Pedreira A", camada: "Pó de pedra" },
          params: { material: "Pó de pedra com finos", temperatura: "28", cone: "lado" },
          det: [{ picn: "1", B1: "515,0", C: "1094,1", A: "503,2", B: "780,2" },
            { picn: "2", B1: "498,7", C: "1079,0", A: "486,0", B: "776,9" }] };
      } },
    ],
  };
})();
