/*
 * Ficha: DNER-ME 192/97 — Determinação do inchamento de agregado miúdo.
 * Teor de umidade por cápsula (7.1), coeficiente de inchamento Vh/V0 (7.2), curva de inchamento (7.3),
 * umidade crítica pela construção gráfica (7.4) e coeficiente de inchamento médio (7.5).
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * Curva de inchamento: a norma pede "uma representação aproximada do fenômeno" (7.3). A ficha ajusta, por
 * mínimos quadrados, CI(h) = 1 + a·h/(b + h) − c·h, que passa pela origem (h = 0 → CI = 1), sobe
 * rapidamente, atinge um máximo e pode decair (forma do Anexo). Com a curva, a construção de 7.4 é exata:
 * A = máximo (tangente horizontal); corda da origem (0; 1) até A; tangente paralela à corda; a abscissa do
 * encontro das duas tangentes é a umidade crítica; B = CI da curva nessa umidade (7.5).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var ALVOS = ["0,5", "1", "2", "3", "4", "5", "7", "9", "12"];  // 6.3

  // ajuste de CI − 1 = a·u − c·h, u = h/(b+h): linear em (a, c) para b fixo; b por busca em escala log
  function ajustar(hs, cs) {
    function comB(b) {
      var S11 = 0, S12 = 0, S22 = 0, T1 = 0, T2 = 0, i;
      for (i = 0; i < hs.length; i++) {
        var u = hs[i] / (b + hs[i]), v = -hs[i], y = cs[i] - 1;
        S11 += u * u; S12 += u * v; S22 += v * v; T1 += u * y; T2 += v * y;
      }
      var D = S11 * S22 - S12 * S12;
      if (!D) return null;
      var a = (T1 * S22 - T2 * S12) / D, c = (S11 * T2 - S12 * T1) / D, sse = 0;
      for (i = 0; i < hs.length; i++) { var e = cs[i] - 1 - a * hs[i] / (b + hs[i]) + c * hs[i]; sse += e * e; }
      return { a: a, b: b, c: c, sse: sse };
    }
    var melhor = null;
    for (var lb = -2; lb <= 2.0001; lb += 0.01) {
      var f = comB(Math.pow(10, lb));
      if (f && f.a > 0 && (!melhor || f.sse < melhor.sse)) melhor = f;
    }
    return melhor;
  }
  function ci(aj, h) { return 1 + aj.a * h / (aj.b + h) - aj.c * h; }

  // construção gráfica de 7.4 sobre a curva ajustada
  function construcao(aj, hMaxEns) {
    var o = { extrapolado: false, semMaximo: false };
    var hA = aj.c > 0 ? Math.sqrt(aj.a * aj.b / aj.c) - aj.b : Infinity;
    if (!(hA > 0)) return null;
    if (hA > hMaxEns) { hA = hMaxEns; o.semMaximo = true; }  // curva ainda subindo no fim dos pontos ensaiados
    o.hA = hA; o.A = ci(aj, hA);
    o.s = (o.A - 1) / hA;                                     // inclinação da corda origem → A (7.4 b)
    // ponto de tangência com inclinação s: a·b/(b+h)² − c = s (7.4 c)
    o.hT = Math.sqrt(aj.a * aj.b / (o.s + aj.c)) - aj.b;
    if (!(o.hT > 0) || o.hT >= hA) return null;
    o.T = ci(aj, o.hT);
    o.hc = o.hT + (o.A - o.T) / o.s;                           // encontro com a tangente horizontal (7.4 d)
    o.B = ci(aj, o.hc);                                         // ponto B na curva (7.5)
    o.media = (o.A + o.B) / 2;
    return o;
  }

  function linhasTabela() {
    return [
      { k: "alvo", r: "Umidade visada (6.3: 0,5 · 1 · 2 · 3 · 4 · 5 · 7 · 9 · 12 %)", u: "%", texto: true },
      { grupo: "Teor de umidade — amostra coletada em cápsula (6.4 e 7.1)" },
      { k: "cap", r: "Cápsula nº", texto: true },
      { k: "Mc", r: "Massa da cápsula (Mc)", u: "g" },
      { k: "Mi", r: "Cápsula + amostra úmida (Mi)", u: "g" },
      { k: "Mf", r: "Cápsula + amostra seca em estufa (Mf)", u: "g" },
      { calc: "h", r: "h = (Mi − Mf) / (Mf − Mc) × 100 (7.1.1)", u: "%", casas: 2, destaque: true },
      { grupo: "Massa unitária com h % de umidade (6.3 — DNER-ME 152, hoje DNIT 437-ME)" },
      { k: "Mr", r: "Recipiente + agregado úmido", u: "g" },
      { calc: "gh", r: "γh = (recipiente + agregado − recipiente) / volume", u: "kg/dm³", casas: 3 },
      { calc: "ci", r: "Vh/V0 = γs / γh × (100 + h) / 100 (7.2.1)", u: "—", casas: 3, destaque: true },
    ];
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [];
    var Mrec = num(P.recM), V = num(P.recV), Mseco = num(P.seco);
    var gs = ok(Mrec) && ok(V) && V > 0 && ok(Mseco) && Mseco > Mrec ? (Mseco - Mrec) / V : NaN;  // γs (g/cm³ = kg/dm³)
    if (!ok(gs)) avisos.push("Informe a massa e o volume do recipiente e a massa com o agregado seco para obter γs (6.2).");
    var pts = (d.pontos || []).map(function (x, i) {
      var Mc = num(x.Mc), Mi = num(x.Mi), Mf = num(x.Mf), Mr = num(x.Mr), o = { usar: x.usar !== false };
      var n = "Ponto " + (i + 1) + ": ";
      if (ok(Mc) && ok(Mi) && ok(Mf)) {
        if (Mf - Mc <= 0 || Mi < Mf) avisos.push(n + "massas da cápsula incoerentes (Mi ≥ Mf > Mc) — confira.");
        else o.h = (Mi - Mf) / (Mf - Mc) * 100;
      }
      if (ok(Mr) && ok(Mrec) && ok(V) && V > 0 && Mr > Mrec) o.gh = (Mr - Mrec) / V;
      if (ok(o.h) && ok(o.gh) && ok(gs)) o.ci = gs / o.gh * (100 + o.h) / 100;
      if (ok(o.ci) && o.ci < 1) avisos.push(n + "coeficiente de inchamento menor que 1 — confira a massa unitária úmida.");
      return o;
    });
    var validos = pts.filter(function (o) { return ok(o.h) && ok(o.ci); });
    var us = validos.filter(function (o) { return o.usar; });
    var R = { gs: gs, n: validos.length, modo: P.determ === "manual" ? "manual" : "auto", ajuste: null, cons: null };
    if (validos.length && validos.length < ALVOS.length) avisos.push("A norma prevê " + ALVOS.length + " teores de umidade (0,5 % a 12 %, 6.3); há " + validos.length + " ponto(s).");
    if (validos.length) {
      var hMax = Math.max.apply(null, validos.map(function (o) { return o.h; }));
      R.hMax = hMax;
      if (hMax < 7) avisos.push("O maior teor ensaiado é " + fmt(hMax, 1) + " %; a curva deve chegar a cerca de 12 % (6.3) para definir o máximo.");
    }
    if (us.length >= 4) {
      var aj = ajustar(us.map(function (o) { return o.h; }), us.map(function (o) { return o.ci; }));
      if (aj) {
        R.ajuste = aj;
        R.cons = construcao(aj, Math.max.apply(null, us.map(function (o) { return o.h; })));
        R.rms = Math.sqrt(aj.sse / us.length);
        if (!R.cons) avisos.push("Não foi possível fazer a construção de 7.4 sobre a curva ajustada: revise os pontos ou use a leitura manual no gráfico.");
        else if (R.cons.semMaximo) avisos.push("A curva ajustada ainda cresce no maior teor ensaiado: o ponto A foi tomado nesse teor. Ensaie teores maiores (até 12 %, 6.3).");
        if (R.rms > 0.03) avisos.push("Pontos dispersos em torno da curva (desvio médio " + fmt(R.rms, 3) + "): desmarque pontos discrepantes ou confira as pesagens.");
      }
    } else if (validos.length) avisos.push("Marque ao menos quatro pontos completos para traçar a curva de inchamento (7.3).");
    // resultado: construção automática ou leitura manual no gráfico
    if (R.modo === "manual") {
      R.hc = num(P.hcM); R.A = num(P.AM); R.B = num(P.BM);
      R.media = ok(R.A) && ok(R.B) ? (R.A + R.B) / 2 : NaN;
      if (!ok(R.hc) || !ok(R.media)) avisos.push("Leitura manual: informe a umidade crítica e os coeficientes nos pontos A e B lidos no gráfico (7.4 e 7.5).");
      if (ok(R.A) && ok(R.B) && R.B > R.A) avisos.push("Leitura manual: o ponto B não pode superar o máximo A.");
    } else if (R.cons) {
      R.hc = R.cons.hc; R.A = R.cons.A; R.B = R.cons.B; R.media = R.cons.media;
    } else { R.hc = NaN; R.A = NaN; R.B = NaN; R.media = NaN; }
    return { tab: { pontos: pts }, pontos: pts, resultados: R, avisos: avisos };
  }

  // gráfico no modelo do Anexo: pontos, curva, tangentes, corda, pontos A e B
  function grafico(calc, d, opt) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 330, m = { l: 56, r: 16, t: 14, b: 42 };
    var pts = calc.pontos.filter(function (p) { return ok(p.h) && ok(p.ci); });
    if (!pts.length) return '<div class="fe-graf-vazio">O gráfico aparece quando houver pontos completos (umidade e massa unitária).</div>';
    var r = calc.resultados, aj = r.ajuste, cs = r.cons;
    var x1 = Math.max(13, Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.h; })) + 1));
    var yMax = Math.max.apply(null, pts.map(function (p) { return p.ci; }).concat(ok(r.A) ? [r.A] : []));
    var y0 = 1, y1 = Math.max(1.1, Math.ceil((yMax + 0.03) * 20) / 20);
    function X(v) { return m.l + v / x1 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", curva: "#1f5fbf", aux: "#555", pt: "#1f5fbf", res: "#c0392b" }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", curva: "#4f8cff", aux: "#9aa3b2", pt: "#4f8cff", res: "#e0a13a" };
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    for (var gx = 0; gx <= x1; gx++) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
    }
    var passo = (y1 - y0) > 0.3 ? 0.05 : 0.02;
    for (var gy = y0; gy <= y1 + 1e-9; gy += passo) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + fmt(gy, 2) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
    s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Teor de umidade h (%)</text>';
    s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.curva + '">Coeficiente de inchamento Vh/V0</text>';
    var clip = function (v) { return Math.max(y0, Math.min(y1, v)); };
    function seg(xa, ya, xb, yb, st, extra) {
      return '<line x1="' + X(xa).toFixed(1) + '" y1="' + Y(clip(ya)).toFixed(1) + '" x2="' + X(xb).toFixed(1) + '" y2="' + Y(clip(yb)).toFixed(1) +
        '" stroke="' + st + '" ' + (extra || "") + "/>";
    }
    if (aj) {
      var dc = "", hFim = Math.min(x1, (r.hMax || x1) + 0.5);
      for (var hc = 0; hc <= hFim + 1e-9; hc += hFim / 120) dc += (dc ? " L" : "M") + X(hc).toFixed(1) + " " + Y(clip(ci(aj, hc))).toFixed(1);
      s += '<path d="' + dc + '" fill="none" stroke="' + cor.curva + '" stroke-width="2"/>';
    }
    if (r.modo !== "manual" && cs) {
      // tangente horizontal por A, corda origem → A, tangente paralela à corda, vertical na umidade crítica
      s += seg(0, cs.A, Math.min(x1, cs.hA + 3), cs.A, cor.aux, 'stroke-width="1"');
      s += seg(0, 1, cs.hA, cs.A, cor.aux, 'stroke-width="1"');
      var xa = Math.max(0, cs.hT - (cs.T - 1) / cs.s), xb = Math.min(x1, cs.hc + 1);
      s += seg(xa, cs.T + cs.s * (xa - cs.hT), xb, cs.T + cs.s * (xb - cs.hT), cor.aux, 'stroke-width="1"');
    }
    if (ok(r.hc) && ok(r.B)) {
      s += seg(r.hc, 1, r.hc, Math.max(r.B, ok(r.A) ? r.A : r.B), cor.res, 'stroke-dasharray="4 3"');
      s += seg(0, r.B, r.hc, r.B, cor.res, 'stroke-dasharray="4 3"');
    }
    if (ok(r.A)) s += '<circle cx="' + X(0) + '" cy="' + Y(clip(r.A)) + '" r="3" fill="' + cor.res + '"/><text x="' + (X(0) + 5) + '" y="' + (Y(clip(r.A)) - 4) + '" fill="' + cor.res + '" font-weight="bold">A</text>';
    if (ok(r.B)) s += '<circle cx="' + X(0) + '" cy="' + Y(clip(r.B)) + '" r="3" fill="' + cor.res + '"/><text x="' + (X(0) + 5) + '" y="' + (Y(clip(r.B)) + 12) + '" fill="' + cor.res + '" font-weight="bold">B</text>';
    calc.pontos.forEach(function (p, i) {
      if (!ok(p.h) || !ok(p.ci)) return;
      s += '<circle cx="' + X(p.h) + '" cy="' + Y(clip(p.ci)) + '" r="4" fill="' + (p.usar ? cor.pt : "none") + '" stroke="' + cor.pt + '" stroke-width="1.5"/>';
      s += '<text x="' + (X(p.h) + 6) + '" y="' + (Y(clip(p.ci)) + 13) + '" fill="' + cor.txt + '" font-size="10">' + (i + 1) + "</text>";
    });
    if (ok(r.hc) && ok(r.media)) {
      var bx = X(x1 * 0.52), by = Y(y0 + (y1 - y0) * 0.3);
      s += '<text x="' + bx + '" y="' + by + '" fill="' + cor.res + '" font-weight="bold">Coeficiente de inchamento médio: ' + fmt(r.media, 2) + "</text>";
      s += '<text x="' + bx + '" y="' + (by + 16) + '" fill="' + cor.res + '" font-weight="bold">Umidade crítica: ' + fmt(r.hc, 1) + " %</text>";
    }
    return s + "</svg>";
  }

  FE.FICHAS["dner-me-192-97"] = {
    titulo: "Inchamento do agregado miúdo",
    resumo: "Coeficiente de inchamento Vh/V0 = γs/γh × (100 + h)/100 para teores de 0,5 % a 12 %; curva de inchamento, umidade crítica (construção gráfica de 7.4) e coeficiente de inchamento médio (7.5).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: areia média natural" },
      { k: "recM", r: "Massa do recipiente (g)", dica: "recipiente paralelepipedal da massa unitária (DNER-ME 152, hoje DNIT 437-ME)" },
      { k: "recV", r: "Volume do recipiente (cm³)", dica: "γ em g/cm³ = kg/dm³" },
      { k: "seco", r: "Recipiente + agregado seco em estufa (g)", dica: "amostra seca a 105–110 °C (6.1 e 6.2) → massa unitária seca γs" },
      { k: "determ", r: "Umidade crítica e coeficiente médio", tipo: "select", recarrega: true,
        opcoes: [["auto", "Construção de 7.4 sobre a curva ajustada (automática)"], ["manual", "Leitura manual no gráfico traçado à mão"]] },
      { k: "hcM", r: "Umidade crítica lida no gráfico (%)", se: function (d) { return (d.params || {}).determ === "manual"; } },
      { k: "AM", r: "Coeficiente de inchamento máximo — ponto A", se: function (d) { return (d.params || {}).determ === "manual"; } },
      { k: "BM", r: "Coeficiente na umidade crítica — ponto B", se: function (d) { return (d.params || {}).determ === "manual"; } },
    ],
    padrao: { determ: "auto" },
    tabelas: function () {
      return [{ chave: "pontos", titulo: "Teores de umidade", rotulo: "Ponto", iniciais: ALVOS.length, min: 1, usar: true,
        dica: "uma coluna por adição de água (6.3); desmarque \"usar\" para tirar um ponto discrepante da curva",
        linhas: linhasTabela() }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, u, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + (u ? " <small>" + u + "</small>" : "") + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' +
        cx(fmt(r.hc, 1), "%", "Umidade crítica (7.4)" + (r.modo === "manual" ? " — leitura manual" : "")) +
        cx(fmt(r.media, 2), "", "Coeficiente de inchamento médio = (A + B) / 2 (7.5)") +
        cx(fmt(r.A, 3) + " / " + fmt(r.B, 3), "", "Ponto A (máximo) / ponto B (na umidade crítica)") +
        cx(fmt(r.gs, 3), "kg/dm³", "Massa unitária do agregado seco γs") + "</div>";
    },
    graficos: function (calc, d, opt) { return [grafico(calc, d, opt)]; },
    relatorio: {
      notas: "h = (Mi − Mf)/(Mf − Mc) × 100 (7.1.1); Vh/V0 = γs/γh × (100 + h)/100 (7.2.1). Curva de inchamento (7.3): ajuste por mínimos quadrados de Vh/V0 = 1 + a·h/(b + h) − c·h, que passa por (0; 1). Umidade crítica (7.4): tangente horizontal no máximo A; corda da origem até o ponto de tangência; nova tangente paralela à corda; a abscissa do encontro das tangentes é a umidade crítica. Coeficiente médio = média entre A e o coeficiente B da curva na umidade crítica (7.5).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Massa unitária do agregado seco (γs)", fmt(r.gs, 3) + " kg/dm³"]);
        rows.push(["Umidade crítica", fmt(r.hc, 1) + " %" + (r.modo === "manual" ? " (leitura manual no gráfico)" : "")]);
        rows.push(["Coeficiente de inchamento médio", fmt(r.media, 2) + "  (A = " + fmt(r.A, 3) + "; B = " + fmt(r.B, 3) + ")"]);
        if (r.ajuste) rows.push(["Curva ajustada", "Vh/V0 = 1 + " + fmt(r.ajuste.a, 4) + "·h/(" + fmt(r.ajuste.b, 3) + " + h) − " + fmt(r.ajuste.c, 5) + "·h"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Areia — 8 teores (planilha INCHAMENTO DA AREIA do laboratório)", dados: function () {
        var tara = ["16,03", "7,27", "15,26", "15,37", "15,1", "15,1", "13,9", "15,7"], cap = ["33", "40", "20", "5", "32", "19", "7", "13"];
        var Mi = ["65,5", "75", "54", "52,3", "51", "86,3", "53,6", "56"], Mf = ["65,2", "74,5", "53,4", "51", "49,4", "82,3", "50,5", "52,2"];
        var rec = ["4761", "4597", "4461", "4381", "4412", "4466", "4449", "4519"], alvo = ["0,5", "1", "2", "4", "5", "7", "9", "12"];
        return { ident: { registro: "EX-IN-001", camada: "Areia", origem: "Areal W" },
          params: { material: "Areia", recM: "2201", recV: "2034", seco: "5109", determ: "auto" },
          pontos: tara.map(function (t, i) { return { usar: true, alvo: alvo[i], cap: cap[i], Mc: t, Mi: Mi[i], Mf: Mf[i], Mr: rec[i] }; }),
          obs: "Planilha do laboratório (NBR 6467): teor de umidade calculado como fração (sem × 100) e usado em (100 + h)/100, o que anula a correção da umidade; lá, umidade crítica 2 % e coeficiente médio 1,32 (A = 1,34; B = 1,30), lidos à mão." };
      } },
      { nome: "Areia média natural — 9 teores, recipiente de 15 dm³", dados: function () {
        // gerado de uma curva-alvo: CI = 1 + 0,45 h/(0,9 + h) − 0,006 h; γs = 1,50 kg/dm³
        var V = 15000, Mr = 9850, gsA = 1.5, ruido = [0.004, -0.006, 0.005, -0.003, 0.004, -0.004, 0.003, -0.002, 0.003];
        var hs = [0.52, 1.05, 2.1, 2.95, 4.1, 5.05, 7.2, 8.9, 12.1];
        return { ident: { registro: "EX-IN-002", camada: "Areia média para concreto", origem: "Porto de areia B" },
          params: { material: "Areia média natural", recM: String(Mr), recV: String(V), seco: String(Math.round(Mr + gsA * V)), determ: "auto" },
          pontos: hs.map(function (h, i) {
            var c = 1 + 0.45 * h / (0.9 + h) - 0.006 * h + ruido[i], gh = gsA * (1 + h / 100) / c, t = 14.2 + i * 0.37;
            return { usar: true, alvo: ALVOS[i], cap: String(21 + i), Mc: fmt(t, 2), Mi: fmt(t + 60 * (1 + h / 100), 2), Mf: fmt(t + 60, 2), Mr: String(Math.round(Mr + gh * V)) };
          }) };
      } },
      { nome: "Areia fina — poucos teores e leitura manual no gráfico", dados: function () {
        var V = 15000, Mr = 9850, gsA = 1.42, hs = [0.6, 1.9, 3.1, 5.2, 6.1];
        return { ident: { registro: "EX-IN-003", camada: "Areia fina", origem: "Jazida 7" },
          params: { material: "Areia fina", recM: String(Mr), recV: String(V), seco: String(Math.round(Mr + gsA * V)), determ: "manual", hcM: "4,5", AM: "1,36", BM: "1,33" },
          pontos: hs.map(function (h, i) {
            var c = 1 + 0.52 * h / (1.6 + h) - 0.004 * h, gh = gsA * (1 + h / 100) / c, t = 15 + i * 0.4;
            return { usar: true, alvo: ["0,5", "2", "3", "5", "7"][i], cap: String(40 + i), Mc: fmt(t, 2), Mi: fmt(t + 55 * (1 + h / 100), 2), Mf: fmt(t + 55, 2), Mr: String(Math.round(Mr + gh * V)) };
          }) };
      } },
    ],
  };
})();
