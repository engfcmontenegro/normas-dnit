/*
 * Ficha: DNIT 228/2023-ME — Solos — Ensaio de compactação em equipamento miniatura (Mini-Proctor).
 * Registra-se no motor de site/fichas.js (window.FE).
 * Resultados exportados para outras fichas (campo "importar" da DNIT 254-ME, mini-CBR):
 *   resultados.measMax (g/cm³), resultados.hOt (%), resultados.cps = [{h, A, meas, usar}] por corpo de prova.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Tabela A1 — características do Mini-Proctor (soquete leve 2,270 kg / pesado 4,540 kg; queda 30,5 cm; 1 camada)
  var ENERGIAS = {
    normal: { nome: "Normal", M: 2.270, n: 10, soquete: "leve (2,270 kg)" },
    intermediaria: { nome: "Intermediária", M: 4.540, n: 12, soquete: "pesado (4,540 kg)" },
  };
  var H_QUEDA = 30.5, V_CP = 98.17;               // cm e cm³ (Tabela A1)
  var AREA_PADRAO = Math.PI * 25 * 25 / 100;      // Ø 50 mm -> 19,635 cm²
  var DELTA_M = { lat: 20, argNL: 18, nl: 14 };   // variação de massa entre pontos (8.1 k)
  var TENT = [1, 2, 3];

  function umid(p, pref) {  // h = (mh − ms) × 100 / ms (eq. 5; ver nota sobre o denominador)
    var t = num(p[pref + "t"]), u = num(p[pref + "u"]), s = num(p[pref + "s"]);
    if (!ok(t) || !ok(u) || !ok(s) || s - t <= 0 || u < s) return NaN;
    return (u - s) / (s - t) * 100;
  }
  function kaDe(P) {
    var Ac = ok(num(P.Ac)) ? num(P.Ac) : 50, La = num(P.La);
    if (P.modoKa === "direta") return 0;
    if (!ok(La)) return NaN;
    return P.modoKa === "inv" ? Ac - La : Ac + La;          // eq. 2 (sinais invertidos — NOTA 1)
  }
  function alturaDe(P, Ka, L) {
    if (!ok(L)) return NaN;
    if (P.modoKa === "direta") return L;                      // NOTA 2
    if (!ok(Ka)) return NaN;
    return P.modoKa === "inv" ? Ka + L : Ka - L;              // eq. 3
  }
  function energia(P) {
    if (P.energia === "outra") {
      var M = num(P.eM), n = num(P.eN);
      return { nome: "Outra (especificada)", M: M, n: n, soquete: ok(M) ? fmt(M, 3) + " kg" : "—" };
    }
    return ENERGIAS[P.energia] || ENERGIAS.intermediaria;
  }

  // ---------- gráfico (curva de compactação) ----------
  function cores(opt) {
    return opt && opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", a: "#1f5fbf", b: "#c0392b" }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", a: "#4f8cff", b: "#e0a13a" };
  }
  function passo(span, alvo) {
    var p = Math.pow(10, Math.floor(Math.log10(span / alvo))), m = span / alvo / p;
    return p * (m > 5 ? 10 : m > 2 ? 5 : m > 1 ? 2 : 1);
  }
  function grafico(calc, d, opt) {
    opt = opt || {};
    var pts = calc.pontos.filter(function (p) { return ok(p.h) && ok(p.meas); });
    if (!pts.length) return '<div class="fe-graf-vazio">O gráfico aparece quando houver pontos completos.</div>';
    var r = calc.resultados, c = cores(opt);
    var W = opt.w || 560, H = opt.h || 320, m = { l: 58, r: 16, t: 14, b: 42 };
    var xs = pts.map(function (p) { return p.h; }), ys = pts.map(function (p) { return p.meas; });
    var x0 = Math.floor(Math.min.apply(null, xs) - 1), x1 = Math.ceil(Math.max.apply(null, xs) + 1);
    var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys.concat(ok(r.measMax) ? [r.measMax] : []));
    var pad = Math.max((yMax - yMin) * 0.25, 0.02);
    var y0 = Math.floor((yMin - pad) * 100) / 100, y1 = Math.ceil((yMax + pad) * 100) / 100;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    var px = passo(x1 - x0, 8), py = passo(y1 - y0, 6);
    for (var gx = Math.ceil(x0 / px) * px; gx <= x1 + 1e-9; gx += px) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + c.grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + c.txt + '">' + fmt(gx, 0) + "</text>";
    }
    for (var gy = Math.ceil(y0 / py - 1e-9) * py; gy <= y1 + 1e-9; gy += py) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + c.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(gy, 2) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + c.eixo + '"/>';
    s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + c.txt + '">Teor de umidade de compactação hc (%)</text>';
    s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.a + '">MEAS (g/cm³)</text>';
    if (r.ajuste) {
      var us = calc.pontos.filter(function (p) { return p.usar && ok(p.h) && ok(p.meas); });
      var ha = Math.min.apply(null, us.map(function (p) { return p.h; })) - 0.5, hb = Math.max.apply(null, us.map(function (p) { return p.h; })) + 0.5;
      var a = r.ajuste, dc = "";
      for (var hc = ha; hc <= hb + 1e-9; hc += (hb - ha) / 60) {
        var yc = a.a * hc * hc + a.b * hc + a.c;
        dc += (dc ? " L" : "M") + X(hc).toFixed(1) + " " + Y(Math.max(yc, y0)).toFixed(1);
      }
      s += '<path d="' + dc + '" fill="none" stroke="' + c.a + '" stroke-width="2"/>';
      if (ok(r.measMax)) {
        s += '<line x1="' + X(r.hOt) + '" y1="' + Y(r.measMax) + '" x2="' + X(r.hOt) + '" y2="' + (H - m.b) + '" stroke="' + c.a + '" stroke-dasharray="3 3"/>' +
          '<line x1="' + m.l + '" y1="' + Y(r.measMax) + '" x2="' + X(r.hOt) + '" y2="' + Y(r.measMax) + '" stroke="' + c.a + '" stroke-dasharray="3 3"/>' +
          '<text x="' + (X(r.hOt) + 6) + '" y="' + (Y(r.measMax) - 6) + '" fill="' + c.a + '" font-weight="bold">' + fmt(r.measMax, 3) + " g/cm³ · " + fmt(r.hOt, 1) + " %</text>";
      }
    }
    calc.pontos.forEach(function (p, i) {
      if (!ok(p.h) || !ok(p.meas)) return;
      s += '<circle cx="' + X(p.h) + '" cy="' + Y(p.meas) + '" r="4.5" fill="' + (p.usar ? c.a : "none") + '" stroke="' + c.a + '" stroke-width="1.5"/>' +
        '<text x="' + (X(p.h) + 7) + '" y="' + (Y(p.meas) + 13) + '" fill="' + c.txt + '" font-size="10">' + (i + 1) + "</text>";
    });
    return s + "</svg>";
  }

  FE.FICHAS["dnit-228-2023-me"] = {
    titulo: "Solos — Compactação em equipamento miniatura (Mini-Proctor)",
    resumo: "Corpos de prova de 50 mm × 50 mm (± 1 mm) com a fração passante na peneira nº 10; correção da massa pela altura (eq. 4), MEAS de cada ponto (eq. 6), curva de compactação, MEAS máxima e umidade ótima.",
    blocos: [],
    rotuloImportar: function (r) { return "MEAS máx " + fmt(r.measMax, 3) + " g/cm³ · h ót " + fmt(r.hOt, 1) + " %"; },
    params: [
      { k: "energia", r: "Energia de compactação (Tabela A1)", tipo: "select", recarrega: true,
        opcoes: [["normal", "Normal — soquete leve 2,270 kg, 10 golpes (5 + 5)"], ["intermediaria", "Intermediária — soquete pesado 4,540 kg, 12 golpes (6 + 6)"],
          ["outra", "Outra, especificada pelo projetista"]] },
      { k: "eM", r: "Massa do soquete M (kg)", se: function (d) { return (d.params || {}).energia === "outra"; } },
      { k: "eN", r: "Número de golpes n (total, metade em cada face)", se: function (d) { return (d.params || {}).energia === "outra"; } },
      { k: "modoKa", r: "Altura do corpo de prova (seção 7)", tipo: "select", recarrega: true,
        opcoes: [["ka", "A = Ka − L, com Ka = Ac + La (eq. 2 e 3)"], ["inv", "Extensômetro invertido: Ka = Ac − La, A = Ka + L (NOTA 1)"],
          ["direta", "Leitura inicial ajustável: A = leitura (NOTA 2)"]] },
      { k: "Ac", r: "Altura do cilindro padrão Ac (mm)", ph: "50,00", se: function (d) { return (d.params || {}).modoKa !== "direta"; } },
      { k: "La", r: "Leitura do extensômetro na aferição La (mm)", se: function (d) { return (d.params || {}).modoKa !== "direta"; } },
      { k: "area", r: "Área da seção do molde (cm²)", ph: "19,635", dica: "Ø 50 mm → 19,635 cm²; V = área × A" },
      { k: "aneis", r: "Volume total dos anéis de vedação (cm³) — opcional", dica: "descontado do volume do corpo de prova (NOTA 5)" },
      { k: "tipoSolo", r: "Tipo de solo — variação de massa entre pontos (8.1 k)", tipo: "select",
        opcoes: [["lat", "Laterítico — 20 g"], ["argNL", "Argiloso não laterítico — 18 g"], ["nl", "Demais não lateríticos — 14 g"]] },
      { k: "ret10", r: "Fração retida na peneira nº 10 (%)", dica: "não deve ultrapassar 5 % (6 c); é descartada" },
      { k: "ret200", r: "Fração retida na peneira nº 200 (%)", dica: "vai para o relatório (10 a)" },
    ],
    padrao: { energia: "intermediaria", modoKa: "ka", Ac: "50,00", tipoSolo: "lat" },
    tabelas: function () {
      var lin = [{ grupo: "Compactação — tentativas até a altura de (50 ± 1) mm (8.1 c–i)" }];
      TENT.forEach(function (t) {
        lin.push({ k: "m" + t, r: t + "ª tentativa — massa úmida no molde (" + (t === 1 ? "Mi" : "Mc") + ")", u: "g" },
          { k: "L" + t, r: t + "ª tentativa — leitura do extensômetro (L)", u: "mm" },
          { calc: "A" + t, r: t + "ª tentativa — altura A = Ka − L (eq. 3)", u: "mm", casas: 2 });
        if (t < 3) lin.push({ calc: "Mc" + t, r: "Massa corrigida Mc = Mi × 50 / A (eq. 4)", u: "g", casas: 1 });
      });
      lin.push({ calc: "mRec", r: "Massa inicial recomendada — vizinho − variação (8.1 k)", u: "g", casas: 1 },
        { grupo: "Corpo de prova aceito" },
        { k: "moldeSolo", r: "Massa do solo compactado + molde", u: "g" },
        { k: "molde", r: "Tara do molde", u: "g" },
        { calc: "Mh", r: "Massa úmida do corpo de prova (Mh)", u: "g", casas: 2 },
        { calc: "A", r: "Altura final do corpo de prova (A)", u: "mm", casas: 2 },
        { calc: "V", r: "Volume do corpo de prova (V)", u: "cm³", casas: 2 },
        { grupo: "Teor de umidade — duas cápsulas (8.2 e 9.1)" },
        { k: "an", r: "Cápsula A — nº", texto: true },
        { k: "at", r: "Cápsula A — tara (A₁)", u: "g" },
        { k: "au", r: "Cápsula A — solo úmido + cápsula (A₂)", u: "g" },
        { k: "as", r: "Cápsula A — solo seco + cápsula (A₃)", u: "g" },
        { calc: "hA", r: "Umidade A — h = (mh − ms) × 100 / ms (eq. 5)", u: "%", casas: 2 },
        { k: "bn", r: "Cápsula B — nº", texto: true },
        { k: "bt", r: "Cápsula B — tara (B₁)", u: "g" },
        { k: "bu", r: "Cápsula B — solo úmido + cápsula (B₂)", u: "g" },
        { k: "bs", r: "Cápsula B — solo seco + cápsula (B₃)", u: "g" },
        { calc: "hB", r: "Umidade B", u: "%", casas: 2 },
        { calc: "h", r: "Teor de umidade de compactação hc (média)", u: "%", casas: 2, destaque: true },
        { calc: "Ms", r: "Massa seca do corpo de prova", u: "g", casas: 2 },
        { calc: "meas", r: "MEAS = Mh × 100 / ((100 + hc) × V) (eq. 6)", u: "g/cm³", casas: 3, destaque: true });
      return [{ chave: "pontos", titulo: "Pontos da curva de compactação", rotulo: "Ponto", iniciais: 5, min: 5, usar: true,
        dica: "uma coluna por porção, em ordem crescente de umidade; o ponto 3 é o da umidade ótima presumível (6 g–i). Desmarque \"usar\" para tirar um ponto do ajuste.",
        linhas: lin }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var Ka = kaDe(P), area = ok(num(P.area)) ? num(P.area) : AREA_PADRAO, aneis = ok(num(P.aneis)) ? num(P.aneis) : 0;
      var semKa = false;
      var pontos = (d.pontos || []).map(function (p, i) {
        var o = { usar: p.usar !== false }, rot = "Ponto " + (i + 1), ult = null;
        TENT.forEach(function (t) {
          var mi = num(p["m" + t]), L = num(p["L" + t]);
          var A = alturaDe(P, Ka, L);
          if (ok(L) && !ok(A)) semKa = true;
          o["A" + t] = A;
          if (ok(A)) {
            if (t < 3 && Math.abs(A - 50) > 1 && ok(mi)) o["Mc" + t] = mi * 50 / A;
            ult = { t: t, A: A, m: mi };
            // massa usada na tentativa seguinte deve ser a corrigida (eq. 4)
            if (t > 1 && ok(o["Mc" + (t - 1)]) && ok(mi) && Math.abs(mi - o["Mc" + (t - 1)]) > 2) {
              avisos.push(rot + ": na " + t + "ª tentativa usou-se " + fmt(mi, 1) + " g, mas a massa corrigida pela eq. 4 é " + fmt(o["Mc" + (t - 1)], 1) + " g — confira.");
            }
          }
        });
        o.A = ult ? ult.A : NaN;
        o.mFinal = ult && ok(ult.m) ? ult.m : NaN;
        if (ult && Math.abs(ult.A - 50) > 1) {
          avisos.push(rot + ": altura final de " + fmt(ult.A, 2) + " mm, fora de (50 ± 1) mm — descarte o corpo de prova e recompacte com a massa corrigida (8.1 i; NOTA 4).");
        }
        o.Mh = num(p.moldeSolo) - num(p.molde);
        if (!ok(o.Mh) || o.Mh <= 0) o.Mh = NaN;
        o.V = ok(o.A) ? area * o.A / 10 - aneis : NaN;
        o.hA = umid({ t: p.at, u: p.au, s: p.as }, "");
        o.hB = umid({ t: p.bt, u: p.bu, s: p.bs }, "");
        o.h = media([o.hA, o.hB]);
        if (ok(o.hA) && ok(o.hB) && Math.abs(o.hA - o.hB) > 1) avisos.push(rot + ": as duas cápsulas diferem " + fmt(Math.abs(o.hA - o.hB), 2) + " ponto(s) percentual(is) de umidade — confira as pesagens.");
        o.Ms = ok(o.Mh) && ok(o.h) ? o.Mh * 100 / (100 + o.h) : NaN;
        o.meas = ok(o.Ms) && ok(o.V) && o.V > 0 ? o.Ms / o.V : NaN;   // eq. 6
        return o;
      });
      if (semKa) avisos.push("Informe a leitura de aferição La (e Ac) para calcular as alturas (seção 7).");
      // massa inicial recomendada (8.1 k): a partir do ponto 3 (umidade ótima presumível)
      var dm = DELTA_M[P.tipoSolo] || 20;
      pontos.forEach(function (o, i) {
        var viz = i < 2 ? pontos[i + 1] : i > 2 ? pontos[i - 1] : null;
        o.mRec = viz && ok(viz.mFinal) ? viz.mFinal - dm : NaN;
      });
      // curva de compactação: parábola por mínimos quadrados, vértice = MEAS máx e h ót
      var usados = pontos.filter(function (o) { return o.usar && ok(o.h) && ok(o.meas); });
      var validos = pontos.filter(function (o) { return ok(o.h) && ok(o.meas); });
      if (validos.length && validos.length < 5) avisos.push("A norma prevê cinco porções (6 f); há " + validos.length + " ponto(s) completo(s).");
      var res = { measMax: NaN, hOt: NaN, ajuste: null };
      if (usados.length >= 3) {
        var fit = FE.parabola(usados.map(function (o) { return o.h; }), usados.map(function (o) { return o.meas; }));
        if (fit && fit.a < 0) {
          res.ajuste = fit; res.hOt = -fit.b / (2 * fit.a); res.measMax = fit.a * res.hOt * res.hOt + fit.b * res.hOt + fit.c;
          var hs = usados.map(function (o) { return o.h; });
          var secos = hs.filter(function (h) { return h < res.hOt; }).length, umidos = hs.length - secos;
          if (res.hOt < Math.min.apply(null, hs) || res.hOt > Math.max.apply(null, hs)) avisos.push("O máximo da curva ficou fora do intervalo de umidades ensaiadas.");
          if (secos <= 1 || umidos <= 1) avisos.push("O ramo " + (secos <= 1 ? "seco" : "úmido") + " tem " + Math.min(secos, umidos) +
            " ponto: prepare uma sexta porção com a umidade adequada para completar a curva (9.2).");
        } else avisos.push("Os pontos não formam uma curva com máximo (concavidade para baixo): revise os pontos ou desmarque os discrepantes.");
      } else if (validos.length) avisos.push("Marque ao menos três pontos para traçar a curva de compactação.");
      var ret10 = num(P.ret10);
      if (ok(ret10) && ret10 > 5) avisos.push("Fração retida na peneira nº 10 de " + fmt(ret10, 1) + " %: não deve ultrapassar 5 % (6 c; solo fino, 3.1).");
      var E = energia(P);
      res.Ec = ok(E.M) && ok(E.n) ? E.M * H_QUEDA * 1 * E.n / V_CP : NaN;     // eq. 1 (N = 1 camada, V da Tabela A1)
      res.energia = E.nome;
      res.cps = pontos.map(function (o) { return { h: o.h, A: o.A, meas: o.meas, usar: o.usar }; });
      return { tab: { pontos: pontos }, pontos: pontos, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, u, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + " <small>" + u + '</small></div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' + cx(fmt(r.measMax, 3), "g/cm³", "Massa específica aparente seca máxima (3.7)") +
        cx(fmt(r.hOt, 1), "%", "Umidade ótima (3.8)") +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(r.energia) + '</div><div class="fe-res-r">Energia · E<sub>C</sub> = ' +
        fmt(r.Ec, 2) + " kgf/cm² (eq. 1)</div></div></div>";
    },
    grafico: function (calc, d, opt) { return grafico(calc, d, opt); },
    relatorio: {
      parametros: [["Corpo de prova", "Ø 50 mm × (50 ± 1) mm, camada única, golpes divididos entre as duas faces; queda de 30,5 cm"]],
      notas: "Altura A = Ka − L (eq. 2 e 3); massa corrigida Mc = Mi × 50 / A (eq. 4) quando A sai de (50 ± 1) mm; h = (mh − ms) × 100 / ms (eq. 5 — o texto da norma traz \"A\" no denominador, erro de digitação: a definição 3.3 e a DNIT 258-ME usam ms); MEAS = Mh × 100 / ((100 + hc) × V) (eq. 6), V descontado o volume dos anéis (NOTA 5). Curva de compactação: parábola por mínimos quadrados aos pontos considerados; MEAS máx e h ót no vértice.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [["Energia de compactação", r.energia + " — EC = " + fmt(r.Ec, 2) + " kgf/cm²"],
          ["Massa específica aparente seca máxima", fmt(r.measMax, 3) + " g/cm³"], ["Umidade ótima", fmt(r.hOt, 1) + " %"]];
        if (P.ret200) rows.push(["Fração retida na peneira nº 200", P.ret200 + " %"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo da norma — planilha da Figura A7 (energia intermediária)", dados: function () {
        // Figura A7 (p. 15): Ka = 50,00 + 18,58 = 68,58 mm; área 19,63 cm². Na 3ª tentativa do cilindro 1 a figura
        // registra 181 g, mas Mc = 187 × 50 / 48,90 = 191 g (o CP pesou 190,1 g): mantido como na figura, a ficha avisa.
        var m = [["180", "187", "181"], ["208", "203"], ["187", "201", "207"], ["209"], ["210", "202"]];
        var L = [["20,45", "19,68", "18,75"], ["18,23", "18,92"], ["22,00", "20,10", "18,91"], ["17,68"], ["16,55", "18,03"]];
        var mold = [["1193,6", "1003,5"], ["1203,2", "999,4"], ["1203,3", "996,8"], ["1197,6", "988,9"], ["1222,7", "1022,7"]];
        var cap = [["49", "17,59", "97,42", "90,58", "69", "25,86", "89,78", "84,36"], ["22", "25,90", "97,88", "89,77", "67", "25,86", "94,88", "86,89"],
          ["11", "25,62", "85,67", "76,98", "105", "25,94", "81,83", "73,87"], ["52", "26,06", "89,34", "79,58", "56", "25,80", "92,92", "82,70"],
          ["25", "18,25", "80,82", "70,44", "21", "16,78", "80,38", "69,70"]];
        return { ident: { registro: "EX-MP-001", camada: "Solo fino tropical (exemplo da norma)", origem: "Figura A7" },
          params: { energia: "intermediaria", modoKa: "ka", Ac: "50,00", La: "18,58", area: "19,63", tipoSolo: "lat" },
          pontos: m.map(function (mm, i) {
            var o = { usar: true, moldeSolo: mold[i][0], molde: mold[i][1], an: cap[i][0], at: cap[i][1], au: cap[i][2], as: cap[i][3],
              bn: cap[i][4], bt: cap[i][5], bu: cap[i][6], bs: cap[i][7] };
            mm.forEach(function (v, k) { o["m" + (k + 1)] = v; o["L" + (k + 1)] = L[i][k]; });
            return o;
          }),
          obs: "Figura A7 da norma: fração retida na peneira nº 10 anotada como 50 %, o que contraria o limite de 5 % da seção 6 c (não lançada no parâmetro)." };
      } },
      { nome: "Areia argilosa laterítica — energia normal (gerado)", dados: function () {
        // valores gerados: MEAS alvo ~1,96 g/cm³ a ~12 % de umidade; Ka = 50,00 + 21,40 = 71,40 mm
        var pts = [
          { m1: "199,2", L1: "21,52", ms: "1188,69", mo: "990,10", c: ["3", "15,10", "64,34", "60,30", "8", "14,95", "61,87", "58,05"] },
          { m1: "210,7", L1: "21,31", ms: "1202,70", mo: "992,60", c: ["12", "15,13", "64,28", "59,63", "14", "15,00", "63,12", "58,60"] },
          { m1: "221,2", L1: "20,20", m2: "216,0", L2: "21,33", ms: "1205,20", mo: "989,80", c: ["17", "15,16", "64,19", "58,96", "21", "15,05", "64,38", "59,15"] },
          { m1: "213,0", L1: "21,70", ms: "1207,90", mo: "995,50", c: ["23", "15,19", "64,04", "58,29", "28", "15,10", "65,61", "59,70"] },
          { m1: "207,7", L1: "21,58", ms: "1200,52", mo: "993,40", c: ["30", "15,22", "63,87", "57,62", "33", "15,15", "66,86", "60,25"] },
        ];
        return { ident: { registro: "EX-MP-002", obra: "Obra A", camada: "Base — solo arenoso fino laterítico", origem: "Jazida 1", data: "2026-03-10" },
          params: { energia: "normal", modoKa: "ka", Ac: "50,00", La: "21,40", tipoSolo: "lat", ret10: "1,2", ret200: "68" },
          pontos: pts.map(function (p) {
            return { usar: true, m1: p.m1, L1: p.L1, m2: p.m2, L2: p.L2, moldeSolo: p.ms, molde: p.mo,
              an: p.c[0], at: p.c[1], au: p.c[2], as: p.c[3], bn: p.c[4], bt: p.c[5], bu: p.c[6], bs: p.c[7] };
          }) };
      } },
      { nome: "Silte argiloso — CP fora de 50 ± 1 mm e ramo úmido com um ponto (gerado)", dados: function () {
        var pts = [
          { m1: "168,6", L1: "20,51", ms: "1158,12", mo: "990,10", c: ["41", "15,10", "65,83", "60,30", "42", "14,95", "63,29", "58,05"] },
          { m1: "175,4", L1: "20,92", ms: "1167,41", mo: "992,60", c: ["43", "15,13", "66,01", "59,63", "44", "15,00", "64,82", "58,60"] },
          { m1: "183,8", L1: "20,74", ms: "1173,04", mo: "989,80", c: ["45", "15,16", "66,16", "58,96", "46", "15,05", "66,36", "59,15"] },
          { m1: "191,6", L1: "20,55", ms: "1186,50", mo: "995,50", c: ["47", "15,19", "66,28", "58,29", "48", "15,10", "67,93", "59,70"] },
          { m1: "184,1", L1: "22,95", ms: "1176,92", mo: "993,40", c: ["49", "15,22", "66,37", "57,62", "50", "15,15", "69,52", "60,25"] },
        ];
        return { ident: { registro: "EX-MP-003", obra: "Obra B", camada: "Subleito — silte argiloso", origem: "Jazida 2" },
          params: { energia: "intermediaria", modoKa: "ka", Ac: "50,00", La: "20,85", tipoSolo: "nl", ret10: "7,5", ret200: "82" },
          pontos: pts.map(function (p) {
            return { usar: true, m1: p.m1, L1: p.L1, moldeSolo: p.ms, molde: p.mo,
              an: p.c[0], at: p.c[1], au: p.c[2], as: p.c[3], bn: p.c[4], bt: p.c[5], bu: p.c[6], bs: p.c[7] };
          }) };
      } },
    ],
  };
})();
