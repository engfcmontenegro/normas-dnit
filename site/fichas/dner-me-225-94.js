/*
 * Ficha: DNER-ME 225/94 — Agregado sintético de argila calcinada — determinação da perda de massa após fervura.
 * Amostra 19,05–2,00 mm (não lavada) até meio frasco de 500 cm³ + 200 cm³ de água destilada; 15 min de fervura
 * em panela de pressão; resfriamento a 27 ± 2 °C; 30 min no agitador; lavagem na peneira de 0,42 mm;
 * P = P1 / (P1 + P2) × 100 (7.1). Limites opcionais da DNER-EM 230/94.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var LIM = { A: 6, B: 6, C: 10 };  // DNER-EM 230/94, 5.1: perda de massa após fervura máxima (%)

  // massa seca = (recipiente + material seco) − recipiente
  function massa(bruto, tara) {
    var b = num(bruto), t = num(tara);
    return ok(b) && ok(t) ? b - t : NaN;
  }

  FE.FICHAS["dner-me-225-94"] = {
    titulo: "Agregado sintético de argila calcinada — perda de massa após fervura",
    rotuloImportar: function (r) { var F = window.FE; return "perda após fervura " + (F.ok(r.P) ? F.fmt(r.P, 1) + " %" : "—"); },
    resumo: "Amostra passante na 19,05 mm e retida na 2,00 mm, sem lavar, até a metade do frasco de 500 cm³ com 200 cm³ de água destilada; fervura de 15 min em panela de pressão, resfriamento a 27 ± 2 °C, 30 min no agitador e lavagem na 0,42 mm; P = P1 / (P1 + P2) × 100.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: argila expandida, argila calcinada" },
      { k: "valvula", r: "Válvula da panela de pressão (4 a)", tipo: "select", opcoes: [["0,098", "0,098 MPa (1 kgf/cm²)"], ["0,049", "0,049 MPa (0,5 kgf/cm²)"]] },
      { k: "grupo", r: "Limite da DNER-EM 230/94 — opcional", tipo: "select",
        opcoes: [["", "Não verificar"], ["A", "Grupo A — máx. 6 %"], ["B", "Grupo B — máx. 6 %"], ["C", "Grupo C — máx. 10 %"]] },
    ],
    padrao: { valvula: "0,098", grupo: "" },
    tabelas: function () {
      return [{
        chave: "frascos", titulo: "Frascos ensaiados (6.1 a 6.11)", rotulo: "Frasco", iniciais: 1, min: 1,
        dica: "vários frascos da mesma amostra podem ir juntos à panela (Nota); pesagens com aproximação de 0,1 g",
        linhas: [
          { grupo: "Condições do ensaio" },
          { k: "agua", r: "Água destilada adicionada ao frasco (6.2: 200)", u: "cm³", ph: "200" },
          { k: "tferv", r: "Fervura após a válvula soltar vapor (6.5: 15)", u: "min", ph: "15" },
          { k: "temp", r: "Temperatura após resfriamento (6.6: 27 ± 2)", u: "°C" },
          { k: "tag", r: "Agitação no agitador de peneiras (6.9: 30)", u: "min", ph: "30" },
          { grupo: "Material que passou na peneira de 0,42 mm, seco a 110 ± 5 °C (6.11)" },
          { k: "t1", r: "Recipiente (tara)", u: "g" },
          { k: "b1", r: "Recipiente + material passante seco", u: "g" },
          { calc: "P1", r: "P1 — massa passante na 0,42 mm", u: "g", casas: 1 },
          { grupo: "Material retido na peneira de 0,42 mm, seco a 110 ± 5 °C (6.11)" },
          { k: "t2", r: "Recipiente (tara)", u: "g" },
          { k: "b2", r: "Recipiente + material retido seco", u: "g" },
          { calc: "P2", r: "P2 — massa retida na 0,42 mm", u: "g", casas: 1 },
          { calc: "P", r: "P = P1 / (P1 + P2) × 100 (7.1)", u: "%", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var fr = (d.frascos || []).map(function (x, i) {
        var n = i + 1, P1 = massa(x.b1, x.t1), P2 = massa(x.b2, x.t2);
        var p = ok(P1) && ok(P2) && P1 + P2 > 0 ? P1 / (P1 + P2) * 100 : NaN;
        if (ok(P1) && P1 < 0 || ok(P2) && P2 < 0) avisos.push("Frasco " + n + ": massa negativa — confira as taras.");
        var ag = num(x.agua), tf = num(x.tferv), te = num(x.temp), ta = num(x.tag);
        if (ok(ag) && ag !== 200) avisos.push("Frasco " + n + ": " + fmt(ag, 0) + " cm³ de água — a norma prescreve 200 cm³ (6.2).");
        if (ok(tf) && tf !== 15) avisos.push("Frasco " + n + ": fervura de " + fmt(tf, 0) + " min — a norma prescreve 15 min (6.5).");
        if (ok(te) && Math.abs(te - 27) > 2) avisos.push("Frasco " + n + ": resfriado a " + fmt(te, 0) + " °C, fora de 27 ± 2 °C (6.6).");
        if (ok(ta) && ta !== 30) avisos.push("Frasco " + n + ": agitação de " + fmt(ta, 0) + " min — a norma prescreve 30 min (6.9).");
        if (ok(P1) && ok(P2) && P1 + P2 < 50) avisos.push("Frasco " + n + ": massa total de " + fmt(P1 + P2, 1) + " g parece pequena para meio frasco de 500 cm³ (5.1) — confira.");
        return { P1: P1, P2: P2, P: p };
      });
      var vals = fr.map(function (o) { return o.P; }).filter(ok);
      var m = media(vals), lim = LIM[P.grupo];
      var conforme = ok(m) && lim ? Math.round(m * 10) / 10 <= lim : null;
      if (conforme === false) avisos.push("Perda de massa de " + fmt(m, 1) + " % acima do máximo de " + lim + " % da DNER-EM 230/94 (grupo " + P.grupo + "): agregado rejeitado nesse requisito.");
      return { tab: { frascos: fr }, resultados: { P: m, n: vals.length, lim: lim, conforme: conforme,
        amp: vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.P, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">Perda de massa após fervura' + (r.n > 1 ? " — média de " + r.n + " frascos" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende (máx. ' + r.lim + ' %)</span>' : ' · <span class="fe-nok">não atende (máx. ' + r.lim + ' %)</span>') + "</div></div>" +
        (ok(r.amp) ? '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.amp, 1) + ' %</div><div class="fe-res-r">Amplitude entre frascos</div></div>' : "") + "</div>";
    },
    relatorio: {
      notas: "Amostra passante na peneira de 19,05 mm e retida na de 2,00 mm, sem lavagem (5.2, 5.3), ocupando metade do frasco de 500 cm³, com 200 cm³ de água destilada; fervura de 15 min na panela de pressão; resfriamento até 27 ± 2 °C; 30 min no agitador de peneiras; lavagem na peneira de 0,42 mm; secagem a 110 ± 5 °C e pesagem com aproximação de 0,1 g. P = P1 / (P1 + P2) × 100, P1 = passante e P2 = retido na 0,42 mm (7.1). Com mais de um frasco da mesma amostra, a ficha apresenta cada valor e a média (a norma não fixa o critério). Limites: DNER-EM 230/94 (grupos A e B 6 %, grupo C 10 %).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        calc.tab.frascos.forEach(function (o, i) { if (ok(o.P)) rows.push(["Frasco " + (i + 1), "P1 = " + fmt(o.P1, 1) + " g; P2 = " + fmt(o.P2, 1) + " g; P = " + fmt(o.P, 1) + " %"]); });
        rows.push(["Perda de massa após fervura", fmt(r.P, 1) + " %" + (r.n > 1 ? " (média de " + r.n + " frascos)" : "") +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + r.lim + " % (DNER-EM 230/94)" : " — NÃO ATENDE ao máximo de " + r.lim + " % (DNER-EM 230/94)")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Argila expandida — dois frascos (atende grupo A)", dados: function () {
        // P1 = 3,8 e 4,2 g; P2 = 96,4 e 101,3 g → 3,79 % e 3,98 %
        return { ident: { registro: "EX-PMF-001", data: "2025-09-16", obra: "Obra A", origem: "Fornecedor A", camada: "Agregado sintético — argila expandida" },
          params: { material: "Argila expandida", valvula: "0,098", grupo: "A" },
          frascos: [{ agua: "200", tferv: "15", temp: "27", tag: "30", t1: "52,3", b1: "56,1", t2: "118,6", b2: "215,0" },
            { agua: "200", tferv: "15", temp: "28", tag: "30", t1: "50,9", b1: "55,1", t2: "121,4", b2: "222,7" }] };
      } },
      { nome: "Argila calcinada mal queimada — perda alta e resfriamento fora (não atende)", dados: function () {
        // P1 = 12,6 g; P2 = 88,1 g → 12,5 %
        return { ident: { registro: "EX-PMF-002", data: "2025-09-23", obra: "Obra B", origem: "Jazida 2", camada: "Agregado sintético — argila calcinada" },
          params: { material: "Argila calcinada não expandida", valvula: "0,098", grupo: "C" },
          frascos: [{ agua: "200", tferv: "15", temp: "32", tag: "30", t1: "51,7", b1: "64,3", t2: "119,2", b2: "207,3" }] };
      } },
    ],
  };
})();
