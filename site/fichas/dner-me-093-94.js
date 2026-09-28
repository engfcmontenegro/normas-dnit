/*
 * Ficha: DNER-ME 093/94 — Solos — Densidade real (picnômetro).
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * Campos de calcular(d).resultados:
 *   resultados.D20      densidade real a 20 °C — média das determinações, aproximação de centésimos (6.2 a 6.4)
 *   resultados.D20exato média antes do arredondamento
 *   resultados.amp      maior diferença entre as determinações (limite 0,009, 6.3)
 *   resultados.conforme true/false com ≥ 2 determinações, senão null
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Tabela de 6.4 — temperatura (°C) e fator k20 (razão entre a densidade relativa da água a t e a 20 °C)
  var K20 = [[4, 1.0018], [5, 1.0018], [6, 1.0017], [7, 1.0017], [8, 1.0017], [9, 1.0016], [10, 1.0015], [11, 1.0014], [12, 1.0013],
    [13, 1.0012], [14, 1.0011], [15, 1.0009], [16, 1.0008], [17, 1.0006], [18, 1.0004], [19, 1.0002], [20, 1.0000], [21, 0.9998],
    [22, 0.9996], [23, 0.9993], [24, 0.9991], [25, 0.9989], [26, 0.9986], [27, 0.9983], [28, 0.9980], [29, 0.9977], [30, 0.9974],
    [31, 0.9972], [32, 0.9969], [33, 0.9965]];
  function k20(t) { return FE.interpolar(K20, t); }  // interpolação linear entre as temperaturas da tabela (termômetro de 0,5 °C)
  var TOL = 0.009;   // 6.3
  var MIN_AMOSTRA = 10;  // 4.3: no mínimo 10 g de solo seco

  FE.FICHAS["dner-me-093-94"] = {
    titulo: "Solos — Densidade real dos grãos (picnômetro)",
    rotuloImportar: function (r) { return "D20 " + (ok(r.D20) ? fmt(r.D20, 2) : "—"); },
    resumo: "Picnômetro de 50 ml com fervura de 15 min; Dt = (P2 − P1) / [(P4 − P1) − (P3 − P2)] (6.1), corrigida para 20 °C por D20 = k20 × Dt (6.4); média de no mínimo duas determinações que não difiram de mais de 0,009, em centésimos (6.2 e 6.3).",
    blocos: [],
    params: [
      { k: "preparo", r: "Amostra (DNER-ME 041, 4.b)", ph: "ex.: passada na peneira de 2,0 mm, seca em estufa e resfriada no dessecador" },
      { k: "fervura", r: "Tempo de fervura (min)", ph: "≥ 15 (5.4)" },
    ],
    padrao: {},
    tabelas: function () {
      return [{ chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 2, usar: true,
        dica: "uma coluna por determinação (picnômetro); no mínimo duas (6.3). Desmarque \"usar\" para excluir uma determinação da média.",
        linhas: [
          { k: "pic", r: "Picnômetro nº", texto: true },
          { k: "P1", r: "P1 — picnômetro vazio, seco e limpo (5.1)", u: "g" },
          { k: "P2", r: "P2 — picnômetro + amostra seca (5.2)", u: "g" },
          { calc: "Ms", r: "Massa de solo seco = P2 − P1 (≥ 10 g, 4.3)", u: "g", casas: 2 },
          { k: "P3", r: "P3 — picnômetro + amostra + água (5.7)", u: "g" },
          { k: "t", r: "Temperatura do banho t (5.6 e 5.8)", u: "°C" },
          { k: "P4", r: "P4 — picnômetro + água, mesma temperatura (5.8)", u: "g" },
          { calc: "Dt", r: "Dt = (P2 − P1) / [(P4 − P1) − (P3 − P2)] (6.1)", u: "", casas: 3 },
          { calc: "k", r: "k20 — Tabela (6.4)", u: "", casas: 4 },
          { calc: "D20", r: "D20 = k20 × Dt (6.4)", u: "", casas: 3, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var det = (d.det || []).map(function (p, i) {
        var rot = "Determinação " + (i + 1);
        var P1 = num(p.P1), P2 = num(p.P2), P3 = num(p.P3), P4 = num(p.P4), t = num(p.t);
        var Ms = P2 - P1, den = (P4 - P1) - (P3 - P2);
        var Dt = ok(Ms) && ok(den) && Ms > 0 && den > 0 ? Ms / den : NaN;
        var k = ok(t) ? k20(t) : NaN;
        if (ok(t) && !ok(k)) avisos.push(rot + ": temperatura de " + fmt(t, 1) + " °C fora da tabela de 6.4 (4 °C a 33 °C) — calcule o fator para essa temperatura (nota de 6.4).");
        if (ok(Ms) && Ms < MIN_AMOSTRA) avisos.push(rot + ": amostra de " + fmt(Ms, 2) + " g de solo seco, abaixo do mínimo de 10 g (4.3).");
        if (ok(Ms) && ok(den) && Ms > 0 && den <= 0) avisos.push(rot + ": (P4 − P1) − (P3 − P2) não é positivo — confira as pesagens.");
        if (ok(Dt) && (Dt < 2 || Dt > 3.5)) avisos.push(rot + ": Dt = " + fmt(Dt, 3) + " — valor incomum para solos; confira as pesagens.");
        return { Ms: Ms, Dt: Dt, k: k, D20: ok(Dt) && ok(k) ? Dt * k : NaN, usar: p.usar !== false };
      });
      var fervura = num(P.fervura);
      if (ok(fervura) && fervura < 15) avisos.push("Fervura de " + fmt(fervura, 0) + " min: a norma pede pelo menos 15 minutos (5.4).");
      var vals = det.filter(function (o) { return o.usar && ok(o.D20); }).map(function (o) { return o.D20; });
      var amp = vals.length >= 2 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN;
      if (vals.length === 1) avisos.push("O resultado exige a média de no mínimo duas determinações (6.3).");
      // compara em milésimos (as determinações são registradas com três casas)
      var conforme = ok(amp) ? Math.round(amp * 1000) <= TOL * 1000 : null;
      if (conforme === false) avisos.push("As determinações diferem " + fmt(amp, 3) + " (mais de 0,009): o resultado não pode ser considerado — repita o ensaio (6.3).");
      var m = media(vals);
      return { tab: { det: det }, resultados: { D20exato: m, D20: ok(m) ? Math.round(m * 100) / 100 : NaN, amp: amp, n: vals.length, conforme: conforme,
        Dt: media(det.filter(function (o) { return o.usar; }).map(function (o) { return o.Dt; })) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.D20) ? fmt(r.D20, 2) : "—") +
        '</div><div class="fe-res-r">Densidade real a 20 °C (D20) — média de ' + r.n + " determinação(ões)" + (ok(r.D20exato) ? " (" + fmt(r.D20exato, 3) + ")" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">aceito</span>' : ' · <span class="fe-nok">repetir</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.amp) ? fmt(r.amp, 3) : "—") +
        '</div><div class="fe-res-r">Diferença entre as determinações (máximo 0,009, 6.3)</div></div></div>';
    },
    relatorio: {
      notas: "Dt = (P2 − P1) / [(P4 − P1) − (P3 − P2)] (6.1); D20 = k20 × Dt com k20 da tabela de 6.4 (interpolado entre temperaturas inteiras). Resultado: média de no mínimo duas determinações que não difiram de mais de 0,009, adimensional, com aproximação de centésimos (6.2 e 6.3). Na tabela da norma, a densidade da água a 17 °C está impressa como 0,9998 (seria 0,9988); o fator k20 = 1,0006 está coerente e é o usado.",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["Densidade real dos grãos a 20 °C (D20)", (ok(r.D20) ? fmt(r.D20, 2) : "—") +
          (r.conforme === null ? "" : r.conforme ? "" : " — DETERMINAÇÕES DIFEREM MAIS DE 0,009: REPETIR")],
          ["Determinações consideradas / maior diferença", r.n + " / " + (ok(r.amp) ? fmt(r.amp, 3) : "—")]];
      },
    },
    exemplos: [
      { nome: "Solo argiloso laterítico — 2 determinações a 25 °C", dados: function () {
        return { ident: { registro: "EX-DR-001", camada: "Subleito — argila laterítica", origem: "Jazida 1" },
          params: { preparo: "Passada na peneira de 2,0 mm, seca em estufa a 105–110 °C", fervura: "15" },
          det: [gerar("A", 31.482, 12.05, 25, 2.705, 81.236), gerar("B", 29.917, 11.87, 25, 2.698, 79.604)] };
      } },
      { nome: "Areia siltosa — temperaturas diferentes, amostra pequena e determinações discordantes", dados: function () {
        return { ident: { registro: "EX-DR-002", camada: "Sub-base — areia siltosa", origem: "Jazida 3" },
          params: { preparo: "Passada na peneira de 2,0 mm", fervura: "10" },
          det: [gerar("C", 30.114, 10.42, 17, 2.652, 80.155), gerar("D", 31.020, 9.35, 28.5, 2.671, 80.842)] };
      } },
    ],
  };

  // determinação gerada: picnômetro, P1, massa seca, temperatura, D20 alvo, P4 (picnômetro + água)
  function gerar(n, P1, ms, t, d20, P4) {
    var Dt = d20 / k20(t);
    var P3 = P4 + ms * (1 - 1 / Dt);  // (P4 − P1) − (P3 − P2) = ms / Dt
    return { usar: true, pic: n, P1: fmt(P1, 2), P2: fmt(P1 + ms, 2), P3: fmt(P3, 2), t: fmt(t, 1), P4: fmt(P4, 2) };
  }
})();
