/*
 * Ficha: DNER-ME 107/94 — Mistura betuminosa a frio, com emulsão asfáltica — ensaio Marshall.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Estabilidade lida (kgf) × fator de correção pela espessura do CP (Tabela anexa, p. 05/09, ou f = 927,23 h^−1,64)
 * = estabilidade Marshall; fluência lida no medidor. Densidade aparente: a norma remete à DNER-ME 117/94
 * (fora do acervo); a ficha usa as expressões da DNIT 428/2022-ME (eq. 6, 8 e 10).
 * Limites opcionais das especificações de pré-misturado a frio: DNIT 153/2010-ES (Tabela 3) e DNER-ES 390/99 (5.2.3).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Tabela anexa (p. 05/09) — correção da estabilidade em função da espessura do CP: [espessura mm, fator]
  var TAB = [[50.8, 1.46], [51.0, 1.45], [51.2, 1.44], [51.6, 1.43], [51.8, 1.42], [52.0, 1.41], [52.2, 1.40], [52.4, 1.39],
    [52.6, 1.38], [52.9, 1.37], [53.1, 1.36], [53.3, 1.35], [53.5, 1.34], [53.8, 1.33], [54.0, 1.32], [54.2, 1.31], [54.5, 1.30],
    [54.7, 1.29], [54.9, 1.28], [55.1, 1.27], [55.4, 1.26], [55.6, 1.25], [55.8, 1.24], [56.1, 1.23], [56.3, 1.22], [56.6, 1.21],
    [56.8, 1.20], [57.1, 1.19], [57.4, 1.18], [57.7, 1.17], [58.1, 1.16], [58.4, 1.15], [58.7, 1.14], [59.0, 1.13], [59.3, 1.12],
    [59.7, 1.11], [60.0, 1.10], [60.3, 1.09], [60.6, 1.08], [60.9, 1.07], [61.1, 1.06], [61.4, 1.05], [61.9, 1.04], [62.3, 1.03],
    [62.7, 1.02], [63.1, 1.01], [63.5, 1.00], [63.9, 0.99], [64.3, 0.98], [64.7, 0.97], [65.1, 0.96], [65.6, 0.95], [66.1, 0.94],
    [66.7, 0.93], [67.1, 0.92], [67.5, 0.91], [67.9, 0.90], [68.3, 0.89], [68.8, 0.88], [69.3, 0.87], [69.8, 0.86], [70.3, 0.85],
    [70.8, 0.84], [71.4, 0.83], [72.2, 0.82], [73.0, 0.81], [73.5, 0.80], [74.0, 0.79], [74.6, 0.78], [75.4, 0.77], [76.2, 0.76]];
  // fator pela espessura h (mm): modo "tabela" (interpolação linear), "proxima" (linha mais próxima) ou "formula"
  function fator(h, modo) {
    if (!ok(h) || h <= 0) return { f: NaN };
    if (modo === "formula") return { f: 927.23 * Math.pow(h, -1.64) };
    if (h < TAB[0][0] || h > TAB[TAB.length - 1][0]) return { f: 927.23 * Math.pow(h, -1.64), fora: true };
    if (modo === "proxima") {
      var m = TAB[0];
      TAB.forEach(function (x) { if (Math.abs(x[0] - h) < Math.abs(m[0] - h) - 1e-9) m = x; });
      return { f: m[1] };
    }
    for (var i = 1; i < TAB.length; i++) {
      if (h <= TAB[i][0]) { var a = TAB[i - 1], b = TAB[i]; return { f: a[1] + (b[1] - a[1]) * (h - a[0]) / (b[0] - a[0]) }; }
    }
    return { f: NaN };
  }

  // especificações de pré-misturado a frio que remetem a este ensaio
  var ES = {
    nenhuma: { nome: "Nenhuma (só o ensaio)" },
    "153": { nome: "DNIT 153/2010-ES — PMF com emulsão catiônica convencional (Tabela 3)", vv: [5, 30], est: { "75": 250, "50": 150 }, flu: [2.0, 4.5] },
    "390": { nome: "DNER-ES 390/99 — PMF com emulsão modificada por polímero (5.2.3)", vv: [5, 25], est: { "75": 250 }, flu: [2.0, 4.5] },
  };
  var MEDIDOR = [["0.01", "Extensômetro — divisão de 0,01 mm"], ["0.254", "Medidor de fluência — divisão de 1/100\" (0,254 mm)"],
    ["0.794", "Medidor de fluência — divisão de 1/32\" (0,794 mm)"]];
  var DENS = [["sss", "Pesagem hidrostática, saturado superfície seca — DNIT 428 eq. 6"],
    ["parafina", "Corpo de prova parafinado (DNER-ME 117/94) — expressão da DNIT 428 eq. 8"],
    ["geom", "Volume geométrico (Vv ≥ 10 %) — DNIT 428 eq. 10"], ["nao", "Não determinar"]];
  var RHO_W = 0.9971;  // DNIT 428 eq. 7: massa específica da água a 25 °C

  function limites(P) {
    var e = ES[P.es || "nenhuma"] || ES.nenhuma, g = P.golpes || "75";
    function lim(k, pad) { var v = num(P[k]); return ok(v) ? v : pad; }
    return { es: e, vvMin: lim("vvMin", e.vv ? e.vv[0] : NaN), vvMax: lim("vvMax", e.vv ? e.vv[1] : NaN),
      estMin: lim("estMin", e.est ? e.est[g] : NaN), fluMin: lim("fluMin", e.flu ? e.flu[0] : NaN), fluMax: lim("fluMax", e.flu ? e.flu[1] : NaN),
      estSemPadrao: !!(e.est && e.est[g] === undefined) };
  }
  function carga(P, leitura) {
    if (!ok(leitura)) return NaN;
    var tab = FE.curvaSpeedy(P.aferTabela);
    if (tab.length >= 2) return FE.interpolar([[0, 0]].concat(tab), leitura);
    var K = num(P.aferK);
    return ok(K) ? K * leitura : NaN;
  }

  // gráfico simples y × teor (médias por teor)
  function grafico(pts, o, opt) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h ? Math.round(opt.h * 0.8) : 250, m = { l: 58, r: 16, t: 24, b: 40 };
    pts = pts.filter(function (p) { return ok(p.x) && ok(p.y); });
    if (pts.length < 2) return '<div class="fe-graf-vazio">' + esc(o.titulo) + ": o gráfico aparece com dois ou mais teores.</div>";
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    [o.min, o.max].forEach(function (v) { if (ok(v)) ys.push(v); });
    var x0 = Math.min.apply(null, xs) - 0.5, x1 = Math.max.apply(null, xs) + 0.5;
    var yA = Math.min.apply(null, ys), yB = Math.max.apply(null, ys), pad = Math.max((yB - yA) * 0.15, Math.abs(yB) * 0.02 || 1);
    var y0 = yA - pad, y1 = yB + pad;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff", lim = imp ? "#c0392b" : "#e5534b";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    s += '<text x="' + m.l + '" y="14" fill="' + txt + '" font-weight="bold">' + esc(o.titulo) + "</text>";
    for (var k = 0; k <= 4; k++) {
      var gy = y0 + (y1 - y0) * k / 4;
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(gy, o.casas) + "</text>";
    }
    xs.forEach(function (x) {
      s += '<text x="' + X(x) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + fmt(x, 1) + "</text>";
    });
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">Teor de emulsão (%)</text>';
    [o.min, o.max].forEach(function (v) {
      if (ok(v)) s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + lim + '" stroke-dasharray="6 4"/>';
    });
    var srt = pts.slice().sort(function (a, b) { return a.x - b.x; });
    s += '<path d="' + srt.map(function (p, i) { return (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p.y).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.8"/>';
    srt.forEach(function (p) { s += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4" fill="' + cor + '"/>'; });
    return s + "</svg>";
  }

  FE.FICHAS["dner-me-107-94"] = {
    titulo: "Mistura betuminosa a frio com emulsão — ensaio Marshall",
    rotuloImportar: function (r) { var t = r.teores || []; return t.length === 1 ? "Estabilidade " + (ok(t[0].est) ? fmt(t[0].est, 0) + " kgf" : "—") + " · fluência " + (ok(t[0].flu) ? fmt(t[0].flu, 1) + " mm" : "—") + " · " + t[0].n + " CP" : t.length + " teores (dosagem)"; },
    resumo: "Corpos de prova de ~1 200 g e 63,5 ± 1,3 mm (mínimo 3 por dosagem); estabilidade lida × fator da espessura = estabilidade Marshall; fluência; densidade aparente e volume de vazios opcionais.",
    blocos: [],
    params: [
      { k: "emulsao", r: "Emulsão asfáltica catiônica", ph: "ex.: RL-1C, RM-1C, RM-2C" },
      { k: "golpes", r: "Golpes por face (4 f)", tipo: "select", opcoes: [["75", "75 golpes"], ["50", "50 golpes"]], dica: "deve constar do relatório" },
      { k: "ruptura", r: "Ruptura da emulsão", tipo: "select", opcoes: [["rm", "Rápida ou média — cura de 4 a 6 h (4 e)"], ["rl", "Lenta — cura de no máximo 60 min (4 e)"]] },
      { k: "cura", r: "Tempo de cura antes da compactação (h)", ph: "ex.: 5", dica: "à temperatura ambiente (4 e)" },
      { k: "visc", r: "Viscosidade da emulsão no início da mistura (mm²/s = cSt) — opcional", dica: "150 a 300 cSt; de preferência 150 a 190 cSt (4 c)" },
      { k: "aferK", r: "Anel dinamométrico — constante (kgf por divisão)", dica: "estabilidade lida = K × leitura máxima do defletômetro do anel (5)" },
      { k: "aferTabela", r: "…ou tabela de calibração do anel (leitura = kgf)", ph: "100=205; 500=1020; 1000=2045", dica: "se preenchida, substitui a constante; interpolação linear" },
      { k: "medidor", r: "Medidor de fluência (3 b)", tipo: "select", opcoes: MEDIDOR },
      { k: "fator", r: "Fator de correção da estabilidade (5)", tipo: "select",
        opcoes: [["tabela", "Tabela anexa — interpolação linear"], ["proxima", "Tabela anexa — espessura mais próxima"], ["formula", "Fórmula f = 927,23 h^−1,64"]],
        dica: "a fórmula dá ~2 % acima da tabela (f = 1,024 em 63,5 mm); fora de 50,8–76,2 mm usa-se a fórmula" },
      { k: "dens", r: "Densidade aparente (4 i — DNER-ME 117/94)", tipo: "select", recarrega: true, opcoes: DENS },
      { k: "dpar", r: "Densidade da parafina", ph: "ex.: 0,900", se: function (d) { return (d.params || {}).dens === "parafina"; },
        dica: "determinada no laboratório (a DNER-ME 117/94 não está no acervo)" },
      { k: "dmt", r: "Densidade máxima teórica (DMT) — opcional", recarrega: "tabela", se: function (d) { return (d.params || {}).dens !== "nao"; },
        dica: "para o volume de vazios; pode ser informada por CP (teores diferentes)" },
      { k: "es", r: "Especificação para verificar os resultados", tipo: "select", opcoes: Object.keys(ES).map(function (k) { return [k, ES[k].nome]; }) },
      { k: "vvMin", r: "Volume de vazios mínimo (%) — opcional", dica: "vazio = valor da especificação escolhida" },
      { k: "vvMax", r: "Volume de vazios máximo (%) — opcional" },
      { k: "estMin", r: "Estabilidade mínima (kgf) — opcional", dica: "DNIT 153: 250 (75 golpes) / 150 (50 golpes); DNER-ES 390: 250 (75 golpes)" },
      { k: "fluMin", r: "Fluência mínima (mm) — opcional" },
      { k: "fluMax", r: "Fluência máxima (mm) — opcional", dica: "DNIT 153 e DNER-ES 390: 2,0 a 4,5 mm" },
    ],
    padrao: { golpes: "75", ruptura: "rm", medidor: "0.01", fator: "tabela", dens: "sss", es: "nenhuma" },
    tabelas: function (d) {
      var P = d.params || {}, dens = P.dens || "sss";
      var L = [{ grupo: "Moldagem (4)" },
        { k: "teor", r: "Teor de emulsão da dosagem (4 a, e)", u: "%" },
        { k: "h1", r: "Altura — leitura 1 (4 h)", u: "mm" }, { k: "h2", r: "Altura — leitura 2", u: "mm" },
        { k: "h3", r: "Altura — leitura 3", u: "mm" }, { k: "h4", r: "Altura — leitura 4", u: "mm" },
        { calc: "h", r: "Altura do CP — média das 4 leituras (63,5 ± 1,3 mm)", u: "mm", casas: 1, destaque: true }];
      if (dens !== "nao") {
        L.push({ grupo: "Densidade aparente (4 i)" }, { k: "ma", r: "Massa do CP seco ao ar (A)", u: "g" });
        if (dens === "sss") L.push({ k: "mi", r: "Massa imersa em água (B)", u: "g" }, { k: "mc", r: "Massa saturada com superfície seca (C)", u: "g" },
          { calc: "abs", r: "Água absorvida = (C − A) / (C − B) × 100 (DNIT 428 eq. 1)", u: "%", casas: 1 });
        if (dens === "parafina") L.push({ k: "mp", r: "Massa do CP parafinado ao ar (E)", u: "g" }, { k: "mpi", r: "Massa do CP parafinado imerso (F)", u: "g" });
        if (dens === "geom") L.push({ k: "diam", r: "Diâmetro do CP", u: "mm", ph: "101,6" }, { calc: "vol", r: "Volume = π D² h / 4", u: "cm³", casas: 1 });
        L.push({ calc: "gmb", r: dens === "sss" ? "Densidade aparente Gmb = A / (C − B)" : dens === "parafina" ? "Gmb = A / (E − F − (E − A) / d parafina)" : "Gmb = A / V / 0,9971",
          u: "—", casas: 4, destaque: true });
        L.push({ k: "dmt", r: "DMT da mistura", u: "—", padrao: "dmt" }, { calc: "vv", r: "Volume de vazios = (1 − Gmb / DMT) × 100", u: "%", casas: 1 });
      }
      L.push({ grupo: "Estabilidade e fluência — CP a 40 °C por 2 h; ruptura a 50 mm/min (5)" },
        { k: "leit", r: "Leitura máxima do defletômetro do anel", u: "div." },
        { k: "cargaMan", r: "…ou estabilidade lida informada", u: "kgf", ph: "auto" },
        { calc: "carga", r: "Estabilidade lida", u: "kgf", casas: 0 },
        { k: "fMan", r: "Fator de correção informado (opcional)", u: "—", ph: "auto" },
        { calc: "f", r: "Fator de correção pela espessura (Tabela anexa / fórmula)", u: "—", casas: 3 },
        { calc: "est", r: "Estabilidade Marshall = lida × fator", u: "kgf", casas: 0, destaque: true },
        { k: "fl0", r: "Fluência — leitura inicial do medidor", u: "div." }, { k: "fl1", r: "Fluência — leitura no rompimento", u: "div." },
        { k: "fluMan", r: "…ou fluência informada", u: "mm", ph: "auto" },
        { calc: "flu", r: "Fluência", u: "mm", casas: 2, destaque: true });
      return [{ chave: "cps", titulo: "Corpos de prova", rotulo: "CP", iniciais: 3, min: 1, usar: true, linhas: L,
        dica: "uma coluna por CP; no mínimo 3 por dosagem (4 a). Desmarque \"usar\" para excluir um CP da média." }];
    },
    calcular: function (d) {
      var P = d.params || {}, dens = P.dens || "sss", avisos = [];
      var div = num(P.medidor || "0.01"), dpar = num(P.dpar), dmtPad = num(P.dmt), modoF = P.fator || "tabela";
      var semAfer = false, foraTab = false;
      var cps = (d.cps || []).map(function (p, i) {
        var o = { usar: p.usar !== false }, rot = "CP " + (i + 1);
        o.teor = num(p.teor);
        o.h = media([num(p.h1), num(p.h2), num(p.h3), num(p.h4)]);
        var nh = [p.h1, p.h2, p.h3, p.h4].filter(function (v) { return ok(num(v)); }).length;
        if (nh && nh < 4) avisos.push(rot + ": altura com " + nh + " leitura(s); a norma pede 4 posições diametralmente opostas (4 h).");
        if (ok(o.h) && Math.abs(o.h - 63.5) > 1.3 + 1e-9) avisos.push(rot + ": altura de " + fmt(o.h, 1) + " mm fora de 63,5 ± 1,3 mm (4 a, h).");
        // densidade aparente
        var A = num(p.ma);
        if (dens === "sss") {
          var B = num(p.mi), C = num(p.mc);
          if (ok(A) && ok(B) && ok(C) && C - B > 0) {
            o.gmb = A / (C - B); o.abs = (C - A) / (C - B) * 100;
            if (o.abs > 2) avisos.push(rot + ": água absorvida de " + fmt(o.abs, 1) + " % (> 2 %): a pesagem com superfície seca não se aplica — use o CP parafinado (DNER-ME 117/94) ou a DNIT 428 (7.2/7.3).");
            if (C < A) avisos.push(rot + ": massa saturada com superfície seca menor que a massa seca — confira.");
          }
        } else if (dens === "parafina") {
          var E = num(p.mp), F = num(p.mpi);
          if (ok(A) && ok(E) && ok(F)) {
            if (!ok(dpar)) avisos.push("Informe a densidade da parafina para calcular a densidade aparente.");
            else o.gmb = A / (E - F - (E - A) / dpar);
            if (E < A) avisos.push(rot + ": massa parafinada menor que a massa ao ar — confira.");
          }
        } else if (dens === "geom") {
          var D = ok(num(p.diam)) ? num(p.diam) : 101.6;
          if (ok(o.h)) o.vol = Math.PI * D * D * o.h / 4 / 1000;
          if (ok(A) && ok(o.vol)) o.gmb = A / o.vol / RHO_W;
        }
        if (ok(A) && Math.abs(A - 1200) > 100) avisos.push(rot + ": massa de " + fmt(A, 1) + " g; a norma indica CPs de cerca de 1 200 g (4 a).");
        var dmt = ok(num(p.dmt)) ? num(p.dmt) : dmtPad;
        if (ok(o.gmb) && ok(dmt)) o.vv = (1 - o.gmb / dmt) * 100;
        if (dens === "geom" && ok(o.vv) && o.vv < 10) avisos.push(rot + ": Vv < 10 % — o volume geométrico só se aplica a Vv ≥ 10 % (DNIT 428, 7.3).");
        // estabilidade
        var leit = num(p.leit);
        o.carga = ok(num(p.cargaMan)) ? num(p.cargaMan) : carga(P, leit);
        if (ok(leit) && !ok(num(p.cargaMan)) && !ok(o.carga)) semAfer = true;
        var fr = fator(o.h, modoF);
        o.f = ok(num(p.fMan)) ? num(p.fMan) : fr.f;
        if (fr.fora && !ok(num(p.fMan)) && modoF !== "formula") foraTab = true;
        o.est = ok(o.carga) && ok(o.f) ? o.carga * o.f : NaN;
        if (ok(o.carga) && o.carga > 4000) avisos.push(rot + ": carga de " + fmt(o.carga, 0) + " kgf acima da capacidade da prensa (4 000 kgf, 3 a).");
        // fluência
        var f0 = num(p.fl0), f1 = num(p.fl1);
        o.flu = ok(num(p.fluMan)) ? num(p.fluMan) : ok(f1) ? (f1 - (ok(f0) ? f0 : 0)) * div : NaN;
        if (ok(o.flu) && o.flu < 0) avisos.push(rot + ": leitura final da fluência menor que a inicial — confira.");
        return o;
      });
      if (semAfer) avisos.push("Informe a constante ou a tabela de calibração do anel dinamométrico (ou a estabilidade lida em kgf).");
      if (foraTab) avisos.push("Espessura fora da Tabela anexa (50,8 a 76,2 mm): fator calculado pela fórmula f = 927,23 h^−1,64.");
      if (dens !== "nao" && !ok(dmtPad) && !cps.some(function (o) { return ok(o.vv); }) && cps.some(function (o) { return ok(o.gmb); }))
        avisos.push("Sem a DMT da mistura não há volume de vazios.");

      // agrupamento por teor (dosagem)
      var grupos = {}, ordem = [];
      cps.forEach(function (o, i) {
        if (!o.usar) return;
        if (!ok(o.est) && !ok(o.gmb) && !ok(o.flu)) return;
        var chave = ok(o.teor) ? o.teor.toFixed(3) : "—";
        if (!grupos[chave]) { grupos[chave] = { teor: o.teor, cps: [] }; ordem.push(chave); }
        grupos[chave].cps.push(i + 1);
        ["est", "flu", "gmb", "vv"].forEach(function (k) { (grupos[chave][k + "s"] = grupos[chave][k + "s"] || []).push(o[k]); });
      });
      ordem.sort(function (a, b) { return (num(a) || 0) - (num(b) || 0); });
      var L = limites(P);
      var teores = ordem.map(function (k) {
        var g = grupos[k], t = { teor: g.teor, cps: g.cps, n: g.cps.length };
        ["est", "flu", "gmb", "vv"].forEach(function (c) { t[c] = media(g[c + "s"]); });
        t.okEst = ok(t.est) && ok(L.estMin) ? t.est >= L.estMin : null;
        t.okFlu = ok(t.flu) && (ok(L.fluMin) || ok(L.fluMax)) ? (!ok(L.fluMin) || t.flu >= L.fluMin - 1e-9) && (!ok(L.fluMax) || t.flu <= L.fluMax + 1e-9) : null;
        t.okVv = ok(t.vv) && (ok(L.vvMin) || ok(L.vvMax)) ? (!ok(L.vvMin) || t.vv >= L.vvMin - 1e-9) && (!ok(L.vvMax) || t.vv <= L.vvMax + 1e-9) : null;
        var rot = ok(g.teor) ? "Teor " + fmt(g.teor, 1) + " %" : "Dosagem";
        if (t.n < 3) avisos.push(rot + ": " + t.n + " corpo(s) de prova considerado(s); a norma pede no mínimo 3 por dosagem (4 a).");
        if (t.okEst === false) avisos.push(rot + ": estabilidade média de " + fmt(t.est, 0) + " kgf, abaixo do mínimo de " + fmt(L.estMin, 0) + " kgf.");
        if (t.okFlu === false) avisos.push(rot + ": fluência média de " + fmt(t.flu, 1) + " mm fora de " + fmt(L.fluMin, 1) + " a " + fmt(L.fluMax, 1) + " mm.");
        if (t.okVv === false) avisos.push(rot + ": volume de vazios de " + fmt(t.vv, 1) + " % fora de " + fmt(L.vvMin, 0) + " a " + fmt(L.vvMax, 0) + " %.");
        return t;
      });
      if (L.estSemPadrao) avisos.push("A especificação escolhida só fixa a estabilidade mínima para 75 golpes; informe o mínimo para " + (P.golpes || "75") + " golpes, se houver.");
      // condições de preparo (4 c, 4 e)
      var cura = num(P.cura);
      if (ok(cura)) {
        if (P.ruptura === "rl" && cura > 1) avisos.push("Emulsão de ruptura lenta: cura de no máximo 60 minutos antes da compactação (4 e); informado " + fmt(cura, 1) + " h.");
        if (P.ruptura !== "rl" && (cura < 4 || cura > 6)) avisos.push("Cura de " + fmt(cura, 1) + " h fora de 4 a 6 horas à temperatura ambiente (4 e).");
      }
      var visc = num(P.visc);
      if (ok(visc) && (visc < 150 || visc > 300)) avisos.push("Viscosidade da emulsão de " + fmt(visc, 0) + " cSt fora de 150 a 300 mm²/s (4 c).");
      else if (ok(visc) && visc > 190) avisos.push("Viscosidade de " + fmt(visc, 0) + " cSt: dentro do limite, mas acima da faixa preferencial de 150 a 190 mm²/s (4 c).");
      var unico = teores.length === 1 ? teores[0] : null;
      return { tab: { cps: cps }, resultados: { teores: teores, lim: L, est: unico ? unico.est : NaN, flu: unico ? unico.flu : NaN,
        gmb: unico ? unico.gmb : NaN, vv: unico ? unico.vv : NaN }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, L = r.lim;
      function selo(v) { return v === null || v === undefined ? "" : v ? ' <span class="fe-ok">atende</span>' : ' <span class="fe-nok">não atende</span>'; }
      if (!r.teores.length) return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">—</div><div class="fe-res-r">Preencha os corpos de prova</div></div></div>';
      if (r.teores.length === 1) {
        var t = r.teores[0];
        return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(t.est, 0) + ' <small>kgf</small></div><div class="fe-res-r">Estabilidade Marshall (média de ' + t.n + " CP)" +
          (ok(L.estMin) ? " · mín. " + fmt(L.estMin, 0) : "") + selo(t.okEst) + "</div></div>" +
          '<div class="fe-res-item"><div class="fe-res-v">' + fmt(t.flu, 1) + ' <small>mm</small></div><div class="fe-res-r">Fluência (média)' + selo(t.okFlu) + "</div></div>" +
          (ok(t.gmb) ? '<div class="fe-res-item"><div class="fe-res-v">' + fmt(t.gmb, 4) + '</div><div class="fe-res-r">Densidade aparente (média)</div></div>' : "") +
          (ok(t.vv) ? '<div class="fe-res-item"><div class="fe-res-v">' + fmt(t.vv, 1) + ' <small>%</small></div><div class="fe-res-r">Volume de vazios' + selo(t.okVv) + "</div></div>" : "") + "</div>";
      }
      return tabelaTeores(r) ;
    },
    graficos: function (calc, d, opt) {
      var t = calc.resultados.teores, L = calc.resultados.lim;
      if (t.length < 2) return [];
      var g = [grafico(t.map(function (x) { return { x: x.teor, y: x.est }; }), { titulo: "Estabilidade Marshall (kgf)", casas: 0, min: L.estMin }, opt),
        grafico(t.map(function (x) { return { x: x.teor, y: x.flu }; }), { titulo: "Fluência (mm)", casas: 1, min: L.fluMin, max: L.fluMax }, opt)];
      if (t.some(function (x) { return ok(x.vv); })) g.push(grafico(t.map(function (x) { return { x: x.teor, y: x.vv }; }), { titulo: "Volume de vazios (%)", casas: 1, min: L.vvMin, max: L.vvMax }, opt));
      return g;
    },
    relatorio: {
      notas: "Estabilidade Marshall = estabilidade lida (kgf, pela calibração do anel) × fator de correção da espessura (Tabela anexa da norma; fora de 50,8–76,2 mm, f = 927,23 h^−1,64). " +
        "Altura = média de 4 leituras (4 h). Densidade aparente pela DNER-ME 117/94 (fora do acervo), calculada com as expressões da DNIT 428/2022-ME; Vv = (1 − Gmb/DMT) × 100 (DNIT 428 eq. 12). Resultados de cada dosagem: médias dos CPs considerados.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Compactação", (P.golpes || "75") + " golpes por face" + (P.emulsao ? " · emulsão " + P.emulsao : "")]);
        r.teores.forEach(function (t) {
          var rot = ok(t.teor) ? "Teor de emulsão " + fmt(t.teor, 1) + " % (" + t.n + " CP)" : "Dosagem (" + t.n + " CP)";
          var v = "Estabilidade " + fmt(t.est, 0) + " kgf" + (t.okEst === false ? " (NÃO ATENDE)" : "") + " · fluência " + fmt(t.flu, 1) + " mm" + (t.okFlu === false ? " (NÃO ATENDE)" : "") +
            (ok(t.gmb) ? " · Gmb " + fmt(t.gmb, 4) : "") + (ok(t.vv) ? " · Vv " + fmt(t.vv, 1) + " %" + (t.okVv === false ? " (NÃO ATENDE)" : "") : "");
          rows.push([rot, v]);
        });
        var L = r.lim;
        if (L.es.vv || ok(L.estMin) || ok(L.fluMax)) rows.push(["Limites verificados" + (L.es.nome && L.es.vv ? " — " + L.es.nome : ""),
          (ok(L.vvMin) ? "Vv " + fmt(L.vvMin, 0) + " a " + fmt(L.vvMax, 0) + " % · " : "") + (ok(L.estMin) ? "estabilidade ≥ " + fmt(L.estMin, 0) + " kgf · " : "") +
          (ok(L.fluMin) ? "fluência " + fmt(L.fluMin, 1) + " a " + fmt(L.fluMax, 1) + " mm" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "PMF — três teores de emulsão, CP parafinado (dados gerados)", dados: function () {
        // RM-1C; 3 teores × 3 CPs; anel com K = 2,0 kgf/div; extensômetro de 0,01 mm; DMT por teor
        var alvo = [[8.0, [63.2, 64.1, 62.9], [180, 171, 176], [305, 322, 298], 2.482, [1199.0, 1202.4, 1196.8]],
          [9.0, [63.6, 63.0, 64.3], [205, 198, 211], [352, 340, 366], 2.455, [1201.2, 1198.6, 1203.3]],
          [10.0, [64.0, 63.4, 63.8], [188, 196, 183], [418, 436, 405], 2.430, [1200.5, 1197.9, 1202.0]]];
        var gmbs = [[2.108, 2.121, 2.115], [2.162, 2.170, 2.158], [2.191, 2.185, 2.196]];
        var cps = [];
        alvo.forEach(function (a, i) {
          for (var j = 0; j < 3; j++) {
            var h = a[1][j], A = a[5][j], dp = 0.9, V = A / gmbs[i][j];   // volume do CP (cm³)
            var par = 18.5 + j;                                            // massa de parafina (g)
            var E = A + par, F = E - (V + par / dp);                       // pesagens do CP parafinado
            cps.push({ usar: true, teor: fmt(a[0], 1), h1: fmt(h - 0.2, 1), h2: fmt(h + 0.1, 1), h3: fmt(h + 0.2, 1), h4: fmt(h - 0.1, 1),
              ma: fmt(A, 1), mp: fmt(E, 1), mpi: fmt(F, 1), dmt: fmt(a[4], 3), leit: String(a[2][j]), fl0: "0", fl1: String(a[3][j]) });
          }
        });
        return { ident: { registro: "EX-PMF-001", camada: "Revestimento — PMF denso", origem: "Usina de PMF — pedreira A", obra: "Exemplo" },
          params: { emulsao: "RM-1C", golpes: "75", ruptura: "rm", cura: "5", visc: "170", aferK: "2", medidor: "0.01", fator: "tabela",
            dens: "parafina", dpar: "0,900", es: "153" }, cps: cps };
      } },
      { nome: "Controle — 3 CPs da usina, estabilidade e fluência abaixo do especificado", dados: function () {
        return { ident: { registro: "EX-PMF-002", camada: "Revestimento — PMF aberto", local: "Saída do misturador (DNIT 153, 7)" },
          params: { emulsao: "RL-1C", golpes: "50", ruptura: "rl", cura: "2", aferK: "2", medidor: "0.254", fator: "tabela", dens: "geom", dmt: "2,620", es: "153" },
          cps: [{ usar: true, teor: "7,5", h1: "65,4", h2: "65,9", h3: "66,2", h4: "65,5", ma: "1187,3", diam: "101,6", leit: "68", fl0: "0", fl1: "7" },
            { usar: true, teor: "7,5", h1: "64,8", h2: "65,0", h3: "65,3", h4: "64,9", ma: "1180,6", diam: "101,6", leit: "74", fl0: "0", fl1: "8" },
            { usar: true, teor: "7,5", h1: "66,0", h2: "66,4", h3: "65,8", h4: "66,1", ma: "1191,0", diam: "101,6", leit: "71", fl0: "0", fl1: "7" }] };
      } },
    ],
  };

  function tabelaTeores(r) {
    function c(v, casas, okv) { return "<td" + (okv === false ? ' class="fe-nok"' : "") + ">" + fmt(v, casas) + "</td>"; }
    return '<table class="fe-resumo"><thead><tr><th>Teor de emulsão (%)</th><th>CPs</th><th>Estabilidade (kgf)</th><th>Fluência (mm)</th><th>Gmb</th><th>Vv (%)</th></tr></thead><tbody>' +
      r.teores.map(function (t) {
        return "<tr><td>" + fmt(t.teor, 1) + "</td><td>" + t.cps.join(", ") + "</td>" + c(t.est, 0, t.okEst) + c(t.flu, 2, t.okFlu) + c(t.gmb, 4) + c(t.vv, 1, t.okVv) + "</tr>";
      }).join("") + "</tbody></table>";
  }
  FE.FICHAS["dner-me-107-94"].relatorio.extraHtml = function (calc) {
    var r = calc.resultados;
    if (r.teores.length < 2) return "";
    return tabelaTeores(r).replace('class="fe-resumo"', 'class="gr"');
  };
})();
