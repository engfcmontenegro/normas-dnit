/*
 * Ficha: DNER-ME 222/94 — Agregado sintético fabricado com argila — desgaste por abrasão (máquina Los Angeles).
 * Massas da Tabela 1 e carga abrasiva da Tabela 2 corrigidas pela massa específica aparente do agregado sintético
 * (5.4: X = C × A / 1,550; 6.7: Y = A × E / 1,550); An = (Pn − P'n) / Pn × 100, aproximação de 1 % (7.1).
 * Limites opcionais da DNER-EM 230/94 (desgaste máximo por classe/grupo).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var A_CONV = 1.550;  // Nota 2: massa específica aparente média do agregado convencional (kg/dm³)
  // Tabela 1: frações [passando, retido, massa g, tolerância g]
  var TAB1 = {
    A: [["38", "25", 1250, 25], ["25", "19", 1250, 25], ["19", "12,5", 1250, 10], ["12,5", "9,5", 1250, 10]],
    B: [["19", "12,5", 2500, 10], ["12,5", "9,5", 2500, 10]],
    C: [["9,5", "6,3", 2500, 10], ["6,3", "4,8", 2500, 10]],
    D: [["4,8", "2,4", 5000, 10]],
  };
  // Tabela 2: [nº de esferas, carga abrasiva g, tolerância g]
  var TAB2 = { A: [12, 5000, 25], B: [11, 4584, 25], C: [8, 3330, 20], D: [6, 2500, 15] };
  // DNER-EM 230/94, 5.1: desgaste por abrasão máximo (%) — grupos A, B e C (mesmos valores nas classes I e II)
  var LIM = { A: 35, B: 40, C: 45 };

  function grad(d) { var g = (d.params || {}).graduacao; return TAB1[g] ? g : "B"; }

  FE.FICHAS["dner-me-222-94"] = {
    titulo: "Agregado sintético de argila — desgaste por abrasão",
    rotuloImportar: function (r) { var F = window.FE; return "desgaste " + (F.ok(r.final) ? F.fmt(r.final, 0) + " %" : "—") + (r.g ? " (graduação " + r.g + ")" : ""); },
    resumo: "Máquina Los Angeles, 500 revoluções; frações da Tabela 1 e carga abrasiva da Tabela 2 corrigidas pela massa específica aparente do agregado sintético (X = C × A / 1,550; Y = A × E / 1,550); An = (Pn − P'n) / Pn × 100, com aproximação de 1 %.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: argila expandida, argila calcinada não expandida" },
      { k: "graduacao", r: "Graduação da amostra (5.2, Tabela 1)", tipo: "select", recarrega: true,
        opcoes: [["A", "A — 38 a 9,5 mm"], ["B", "B — 19 a 9,5 mm"], ["C", "C — 9,5 a 4,8 mm"], ["D", "D — 4,8 a 2,4 mm"]],
        dica: "pelas maiores porcentagens retidas na granulometria; se não enquadrar, o material pode ser quebrado (Nota 1)" },
      { k: "A", r: "Massa específica aparente do agregado sintético A (kg/dm³)", recarrega: "tabela", ph: "ex.: 0,62",
        dica: "usada nas correções 5.4 e 6.7 (agregado convencional: 1,550 kg/dm³)" },
      { k: "grupo", r: "Limite da DNER-EM 230/94 — opcional", tipo: "select",
        opcoes: [["", "Não verificar"], ["A", "Grupo A — máx. 35 %"], ["B", "Grupo B — máx. 40 %"], ["C", "Grupo C — máx. 45 %"]] },
    ],
    padrao: { graduacao: "B", grupo: "" },
    tabelas: function (d) {
      var g = grad(d), fr = TAB1[g];
      if (Array.isArray(d.fracoes)) { while (d.fracoes.length < fr.length) d.fracoes.push({}); if (d.fracoes.length > fr.length) d.fracoes.length = fr.length; }
      return [
        { chave: "fracoes", titulo: "Frações da amostra — graduação " + g + " (Tabela 1, 5.4 e 6.1)", rotulo: "Fração (mm)", iniciais: fr.length, min: fr.length, fixo: true,
          nomes: fr.map(function (f) { return f[0] + " → " + f[1]; }),
          dica: "massas pesadas com aproximação de 5 g (5.1.1); a soma é Pn",
          linhas: [
            { calc: "C", r: "Massa da Tabela 1 para agregado convencional (C)", u: "g", casas: 0 },
            { calc: "X", r: "Massa corrigida X = C × A / 1,550 (5.4)", u: "g", casas: 1 },
            { calc: "Xaj", r: "Massa ajustada à carga abrasiva usada (Nota 4)", u: "g", casas: 1 },
            { k: "m", r: "Massa pesada da fração", u: "g" },
            { calc: "dif", r: "Diferença em relação à massa de referência", u: "g", casas: 1 },
          ] },
        { chave: "ensaio", titulo: "Carga abrasiva, ensaio e resultado (6 e 7)", rotulo: "", iniciais: 1, min: 1, fixo: true, nomes: ["Amostra"],
          linhas: [
            { calc: "E", r: "Carga abrasiva da Tabela 2 (E)", u: "g", casas: 0 },
            { calc: "Y", r: "Carga abrasiva corrigida Y = A × E / 1,550 (6.7)", u: "g", casas: 1 },
            { k: "esferas", r: "Número de esferas usadas (Ø 46,0 a 47,6 mm, 400 a 440 g — Nota 3)", u: "" },
            { k: "carga", r: "Massa da carga abrasiva usada", u: "g" },
            { k: "rev", r: "Número de revoluções (6.4)", u: "", ph: "500" },
            { k: "rpm", r: "Velocidade do tambor (6.4)", u: "rpm", ph: "30 a 33" },
            { calc: "Pn", r: "Massa total da amostra seca antes do ensaio Pn (6.1)", u: "g", casas: 0 },
            { k: "Pl", r: "Massa retida na peneira de 1,7 mm, lavada e seca P'n (6.6)", u: "g" },
            { calc: "An", r: "An = (Pn − P'n) / Pn × 100 (7.1)", u: "%", casas: 1, destaque: true },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, g = grad(d), fr = TAB1[g], t2 = TAB2[g], avisos = [];
      var A = num(P.A), fA = ok(A) && A > 0 ? A / A_CONV : NaN;
      if (!ok(A)) avisos.push("Informe a massa específica aparente do agregado sintético (A) para as correções de 5.4 e 6.7.");
      else if (A < 0.3 || A > 2.5) avisos.push("Massa específica aparente A = " + fmt(A, 3) + " kg/dm³ fora do usual para agregado sintético de argila — confira a unidade (kg/dm³).");
      var e = (d.ensaio || [])[0] || {};
      var Y = t2[1] * fA, carga = num(e.carga);
      // Nota 4: carga abrasiva diferente da corrigida → massa do agregado ajustada proporcionalmente
      var tolY = t2[2] * (ok(fA) ? fA : 1);
      var fAj = ok(Y) && ok(carga) && carga > 0 && Math.abs(carga - Y) > tolY ? carga / Y : 1;
      var somaP = 0, nP = 0;
      var fracs = fr.map(function (f, i) {
        var x = (d.fracoes || [])[i] || {}, m = num(x.m);
        var X = f[2] * fA, Xaj = X * fAj, dif = ok(m) && ok(Xaj) ? m - Xaj : NaN;
        var tol = f[3] * (ok(fA) ? fA * fAj : 1);
        if (ok(dif) && Math.abs(dif) > tol + 1e-9) avisos.push("Fração " + f[0] + " → " + f[1] + " mm: " + fmt(m, 0) + " g, diferença de " + fmt(dif, 1) + " g em relação a " + fmt(Xaj, 1) + " g (tolerância da Tabela 1 corrigida: ± " + fmt(tol, 1) + " g).");
        if (ok(m)) { somaP += m; nP++; }
        return { C: f[2], X: X, Xaj: fAj !== 1 ? Xaj : NaN, dif: dif };
      });
      var Pn = nP ? somaP : NaN;
      if (nP && nP < fr.length) avisos.push("Faltam massas de frações da graduação " + g + " (Tabela 1).");
      if (ok(carga) && ok(Y) && Math.abs(carga - Y) > tolY) avisos.push("Carga abrasiva usada (" + fmt(carga, 0) + " g) difere da corrigida Y = " + fmt(Y, 1) + " g além de ± " + fmt(tolY, 1) + " g: as massas das frações foram ajustadas proporcionalmente (Nota 4).");
      var nEsf = num(e.esferas);
      if (ok(nEsf) && ok(carga) && nEsf > 0 && (carga / nEsf < 400 || carga / nEsf > 440)) avisos.push("Massa média por esfera de " + fmt(carga / nEsf, 0) + " g — a Nota 3 pede esferas de 400 g a 440 g.");
      var rev = num(e.rev);
      if (ok(rev) && rev !== 500) avisos.push("A máquina deve realizar 500 revoluções (6.4); informado " + fmt(rev, 0) + ".");
      var rpm = num(e.rpm);
      if (ok(rpm) && (rpm < 30 || rpm > 33)) avisos.push("Velocidade de " + fmt(rpm, 0) + " rpm fora de 30 a 33 rpm (6.4).");
      var Pl = num(e.Pl);
      var An = ok(Pn) && ok(Pl) && Pn > 0 ? (Pn - Pl) / Pn * 100 : NaN;
      if (ok(Pl) && ok(Pn) && Pl > Pn) avisos.push("P'n maior que Pn — confira as massas.");
      var final = ok(An) ? Math.round(An) : NaN, lim = LIM[P.grupo];
      var conforme = ok(final) && lim ? final <= lim : null;
      if (conforme === false) avisos.push("Desgaste de " + final + " % acima do máximo de " + lim + " % da DNER-EM 230/94 (grupo " + P.grupo + "): agregado rejeitado nesse requisito (6.2 da EM).");
      return { tab: { fracoes: fracs, ensaio: [{ E: t2[1], Y: Y, Pn: Pn, An: An }] },
        resultados: { An: An, final: final, g: g, Y: Y, Pn: Pn, lim: lim, conforme: conforme, esferas: t2[0] }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.final) ? r.final : "—") + ' <small>%</small></div>' +
        '<div class="fe-res-r">Desgaste por abrasão An — graduação ' + r.g + (ok(r.An) ? " (" + fmt(r.An, 2) + " %)" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende (máx. ' + r.lim + ' %)</span>' : ' · <span class="fe-nok">não atende (máx. ' + r.lim + ' %)</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.Y, 0) + ' g</div><div class="fe-res-r">Carga abrasiva corrigida Y (Tabela 2: ' + r.esferas + ' esferas antes da correção)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.Pn, 0) + ' g</div><div class="fe-res-r">Massa total ensaiada Pn</div></div></div>';
    },
    relatorio: {
      notas: "Frações da Tabela 1 corrigidas por X = C × A / 1,550 (5.4) e carga abrasiva da Tabela 2 por Y = A × E / 1,550 (6.7), sendo A a massa específica aparente do agregado sintético e 1,550 kg/dm³ a do agregado convencional (Nota 2). Quando a carga usada difere da corrigida, as massas do agregado são ajustadas proporcionalmente (Nota 4); as tolerâncias das Tabelas 1 e 2 foram corrigidas na mesma proporção. 500 revoluções a 30–33 rpm; material retido na peneira de 1,7 mm lavado e seco. An = (Pn − P'n) / Pn × 100, com aproximação de 1 % (7.1). Limites: DNER-EM 230/94 (grupo A 35 %, B 40 %, C 45 %).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Graduação", r.g]);
        rows.push(["Massa específica aparente A", ok(num(P.A)) ? fmt(num(P.A), 3) + " kg/dm³" : "—"]);
        rows.push(["Carga abrasiva corrigida Y", fmt(r.Y, 0) + " g"]);
        rows.push(["Desgaste por abrasão An (graduação " + r.g + ")", (ok(r.final) ? r.final + " %" : "—") +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + r.lim + " % (DNER-EM 230/94)" : " — NÃO ATENDE ao máximo de " + r.lim + " % (DNER-EM 230/94)")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Argila expandida — graduação C (atende)", dados: function () {
        // A = 0,60 → X = 2500 × 0,60 / 1,55 = 967,7 g por fração; Y = 0,60 × 3330 / 1,55 = 1289,0 g (3 esferas de ~430 g)
        return { ident: { registro: "EX-ASA-001", data: "2025-09-15", obra: "Obra A", origem: "Fornecedor A", camada: "Agregado sintético — argila expandida" },
          params: { material: "Argila expandida", graduacao: "C", A: "0,60", grupo: "A" },
          fracoes: [{ m: "970" }, { m: "965" }],
          ensaio: [{ esferas: "3", carga: "1290", rev: "500", rpm: "32", Pl: "1300" }] };
      } },
      { nome: "Argila calcinada não expandida — graduação B, carga fora da tolerância (não atende)", dados: function () {
        // A = 0,95 → X = 1532,3 g por fração; Y = 2809,5 g; carga usada 2 870 g (7 esferas de 410 g) → Nota 4: X ajustado = 1565,2 g
        return { ident: { registro: "EX-ASA-002", data: "2025-09-22", obra: "Obra B", origem: "Jazida 2", camada: "Agregado sintético — argila calcinada" },
          params: { material: "Argila calcinada não expandida", graduacao: "B", A: "0,95", grupo: "B" },
          fracoes: [{ m: "1565" }, { m: "1572" }],
          ensaio: [{ esferas: "7", carga: "2870", rev: "500", rpm: "31", Pl: "1680" }] };
      } },
    ],
  };
})();
