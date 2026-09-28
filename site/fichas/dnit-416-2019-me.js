/*
 * Ficha: DNIT 416/2019-ME — Misturas asfálticas — Módulo dinâmico (|E*|) e ângulo de fase; curva mestra.
 * O equipamento (análise da seção 9) fornece, por CP e por par temperatura-frequência, |E*|, φ e os indicadores de
 * qualidade (eqs. 10, 22, 23, 24); a ficha aplica a correção de fase (5.1), confere os limites (Tabela 7, 8 h, Tabela 2),
 * monta a Tabela 8 (média, CV, desvio-padrão) e ajusta a curva mestra sigmoidal com fatores de deslocamento (seção 11).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // ---------- gráfico XY com escalas linear ou logarítmica ----------
  var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function rotLog(k) {
    if (k >= -3 && k <= 6) return fmt(Math.pow(10, k), Math.max(0, -k));
    return "10" + String(k).split("").map(function (c) { return SUP[c]; }).join("");
  }
  function passoLin(a, b) {
    var r = (b - a) / 5 || 1, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  // o = {opt, logX, logY, logY2, xl, yl, y2l, series: [{pts: [[x, y]], cor, linha, marca, trac, rot, y2}], vlinhas: [{x, cor, rot}],
  //      leg: "dir"|"esq", vazio, xInclui, yInclui}
  function grafXY(o) {
    var temY2 = o.series.some(function (s) { return s.y2; });
    var opt = o.opt || {}, W = opt.w || 560, H = opt.h || 300, m = { l: 62, r: temY2 ? 62 : 26, t: 14, b: 42 };
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var xs = [], ys = [], y2s = [];
    o.series.forEach(function (s) {
      var lg = s.y2 ? o.logY2 : o.logY;
      s.pts.forEach(function (p) {
        if (ok(p[0]) && ok(p[1]) && (!o.logX || p[0] > 0) && (!lg || p[1] > 0)) { xs.push(p[0]); (s.y2 ? y2s : ys).push(p[1]); }
      });
    });
    if (!ys.length && y2s.length) ys = y2s.slice();
    if (xs.length < 2) return '<div class="fe-graf-vazio">' + (o.vazio || "O gráfico aparece com os resultados.") + "</div>";
    function eixo(v, log, inclui) {
      v = v.concat((inclui || []).filter(function (x) { return ok(x) && (!log || x > 0); }));
      var a = Math.min.apply(null, v), b = Math.max.apply(null, v);
      if (log) {
        var la = Math.floor(Math.log10(a) + 1e-9), lb = Math.ceil(Math.log10(b) - 1e-9);
        if (lb <= la) lb = la + 1;
        return { log: true, a: la, b: lb };
      }
      if (a === b) { a -= 1; b += 1; }
      var p = passoLin(a, b);
      return { log: false, a: Math.floor(a / p + 1e-9) * p, b: Math.ceil(b / p - 1e-9) * p, p: p };
    }
    var ex = eixo(xs, o.logX, o.xInclui), ey = eixo(ys, o.logY, o.yInclui), ey2 = y2s.length ? eixo(y2s, o.logY2, o.y2Inclui) : null;
    function X(v) { return m.l + ((ex.log ? Math.log10(v) : v) - ex.a) / (ex.b - ex.a) * (W - m.l - m.r); }
    function Yde(e) { return function (v) { return H - m.b - ((e.log ? Math.log10(v) : v) - e.a) / (e.b - e.a) * (H - m.t - m.b); }; }
    var Y = Yde(ey), Y2 = ey2 ? Yde(ey2) : Y;
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    function linhaGrade(x1, y1, x2, y2, w) {
      s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + grade + '" stroke-width="' + w + '"/>';
    }
    function marcas(e, vert) {
      var L = [];
      if (e.log) {
        for (var k = e.a; k <= e.b; k++) {
          L.push([Math.pow(10, k), rotLog(k), 0.9]);
          if (k < e.b) for (var j = 2; j <= 9; j++) L.push([j * Math.pow(10, k), "", 0.35]);
        }
      } else {
        var casas = Math.max(0, -Math.floor(Math.log10(e.p) + 1e-9));
        for (var v = e.a; v <= e.b + e.p * 1e-6; v += e.p) L.push([v, fmt(Math.abs(v) < e.p * 1e-6 ? 0 : v, casas), 0.6]);
      }
      L.forEach(function (t) {
        if (vert) {
          var x = X(t[0]); linhaGrade(x, m.t, x, H - m.b, t[2]);
          if (t[1]) s += '<text x="' + x.toFixed(1) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + t[1] + "</text>";
        } else {
          var y = Y(t[0]); linhaGrade(m.l, y, W - m.r, y, t[2]);
          if (t[1]) s += '<text x="' + (m.l - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" fill="' + txt + '">' + t[1] + "</text>";
        }
      });
    }
    marcas(ex, true); marcas(ey, false);
    if (ey2) {  // eixo secundário (direita), só rótulos
      var L2 = [];
      if (ey2.log) for (var k2 = ey2.a; k2 <= ey2.b; k2++) L2.push([Math.pow(10, k2), rotLog(k2)]);
      else for (var v2 = ey2.a, c2 = Math.max(0, -Math.floor(Math.log10(ey2.p) + 1e-9)); v2 <= ey2.b + ey2.p * 1e-6; v2 += ey2.p) L2.push([v2, fmt(v2, c2)]);
      L2.forEach(function (t2) {
        var y = Y2(t2[0]);
        s += '<line x1="' + (W - m.r) + '" y1="' + y.toFixed(1) + '" x2="' + (W - m.r + 4) + '" y2="' + y.toFixed(1) + '" stroke="' + txt + '"/>';
        s += '<text x="' + (W - m.r + 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="start" fill="' + txt + '">' + t2[1] + "</text>";
      });
      s += '<text transform="translate(' + (W - 10) + " " + ((H - m.b + m.t) / 2) + ') rotate(90)" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.y2l || "") + "</text>";
    }
    (o.vlinhas || []).forEach(function (vl, iv) {
      if (!ok(vl.x) || (o.logX && vl.x <= 0)) return;
      var x = X(vl.x);
      if (x < m.l || x > W - m.r) return;
      s += '<line x1="' + x.toFixed(1) + '" y1="' + m.t + '" x2="' + x.toFixed(1) + '" y2="' + (H - m.b) + '" stroke="' + (vl.cor || txt) + '" stroke-width="1.2" stroke-dasharray="4 3"/>';
      if (vl.rot) s += '<text x="' + (x + 4).toFixed(1) + '" y="' + (H - m.b - 6 - iv * 13) + '" text-anchor="start" fill="' + (vl.cor || txt) + '">' + FE.esc(vl.rot) + "</text>";
    });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.xl || "") + "</text>";
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.yl || "") + "</text>";
    var nl = 0;
    o.series.forEach(function (sr) {
      var lg = sr.y2 ? o.logY2 : o.logY, Ys = sr.y2 ? Y2 : Y;
      var pts = sr.pts.filter(function (p) { return ok(p[0]) && ok(p[1]) && (!o.logX || p[0] > 0) && (!lg || p[1] > 0); }), cor = sr.cor || "#4f8cff";
      if (!pts.length) return;
      if (sr.linha) s += '<path d="' + pts.map(function (p, j) { return (j ? "L" : "M") + X(p[0]).toFixed(1) + " " + Ys(p[1]).toFixed(1); }).join(" ") +
        '" fill="none" stroke="' + cor + '" stroke-width="' + (sr.larg || 1.8) + '"' + (sr.trac ? ' stroke-dasharray="5 4"' : "") + "/>";
      if (sr.marca !== false) pts.forEach(function (p) {
        s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Ys(p[1]).toFixed(1) + '" r="' + (sr.raio || 3) + '" fill="' + (sr.vazado ? "none" : cor) + '" stroke="' + cor + '"/>';
      });
      if (sr.rot) {
        var dir = o.leg === "dir";
        s += '<text x="' + (dir ? W - m.r - 8 : m.l + 8) + '" y="' + (m.t + 12 + nl * 13) + '" text-anchor="' + (dir ? "end" : "start") + '" fill="' + cor + '">' + FE.esc(sr.rot) + "</text>";
        nl++;
      }
    });
    return s + "</svg>";
  }
  var CORES = ["#4f8cff", "#e0a13a", "#34c38f", "#b58cff", "#e5534b", "#4fc3d9", "#9aa3b2"];
  // ---------- mínimos quadrados não lineares (Levenberg-Marquardt, jacobiano numérico) ----------
  function soma2(r) { var s = 0; for (var i = 0; i < r.length; i++) s += r[i] * r[i]; return s; }
  function resolver(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); }), r, k;
    for (var c = 0; c < n; c++) {
      var piv = c;
      for (r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (!M[piv][c]) return null;
      var tmp = M[c]; M[c] = M[piv]; M[piv] = tmp;
      for (r = c + 1; r < n; r++) { var f = M[r][c] / M[c][c]; for (k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    var x = new Array(n);
    for (r = n - 1; r >= 0; r--) { var s = M[r][n]; for (k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  }
  function lm(res, p0, it) {
    var p = p0.slice(), r = res(p), sse = soma2(r), lam = 1e-3;
    for (var i = 0; i < (it || 300); i++) {
      var J = p.map(function (v, j) {
        var h = 1e-7 * Math.max(Math.abs(v), 1e-4), q = p.slice(); q[j] += h;
        var rq = res(q); return rq.map(function (x, k) { return (x - r[k]) / h; });
      });
      var n = p.length, A = [], g = [], a, b, k;
      for (a = 0; a < n; a++) {
        A.push([]); g.push(0);
        for (k = 0; k < r.length; k++) g[a] -= J[a][k] * r[k];
        for (b = 0; b < n; b++) { var s = 0; for (k = 0; k < r.length; k++) s += J[a][k] * J[b][k]; A[a].push(s); }
      }
      var melhorou = false, ganho = 0;
      for (var tent = 0; tent < 12; tent++) {
        var Al = A.map(function (row, x) { return row.map(function (v, y) { return x === y ? v * (1 + lam) + 1e-30 : v; }); });
        var dp = resolver(Al, g);
        if (dp) {
          var q = p.map(function (v, j) { return v + dp[j]; }), rq = res(q), s2 = soma2(rq);
          if (ok(s2) && s2 < sse) { ganho = sse - s2; p = q; r = rq; sse = s2; lam = Math.max(lam / 10, 1e-15); melhorou = true; break; }
        }
        lam *= 10;
      }
      if (!melhorou || ganho < 1e-14 * sse) break;
    }
    return { p: p, sse: sse };
  }
  function dp(v) {
    v = v.filter(ok);
    if (v.length < 2) return NaN;
    var m = media(v);
    return Math.sqrt(v.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (v.length - 1));
  }
  function sigm(c, lfr) { return c[0] + c[1] / (1 + Math.exp(c[2] + c[3] * lfr)); }  // eq. 29 (log |E*|)

  // acurácia estimada (Tabela 3) — transdutores por CP × número de CPs
  var ACUR = { "2-2": 18.0, "2-3": 15.0, "2-4": 13.4, "3-2": 13.1, "3-3": 12.0, "3-4": 11.5 };
  var QUAL = [["ss", "se(σ) — erro padrão da tensão aplicada (eq. 10)", "%", 10, "se(σ) (eq. 10)"], ["se", "se(ε) — média do erro padrão da deformação (eq. 22)", "%", 10, "se(ε) (eq. 22)"],
    ["ue", "Uε — uniformidade das deformações (eq. 23)", "%", 35, "Uε (eq. 23)"], ["ut", "Uθ — uniformidade dos ângulos de fase (eq. 24)", "°", 3, "Uθ (eq. 24)"]];
  function nomeCP(d, j) { var c = (d.cp || [])[j] || {}; return "CP " + (c.id || j + 1); }

  // curva mestra: sigmoide (eq. 29) + log aT livre por temperatura (Tr fixa), minimizando a eq. 30; depois a parábola da eq. 28
  function curvaMestra(pts, Tr) {
    var temps = [];
    pts.forEach(function (p) { if (temps.indexOf(p.T) < 0) temps.push(p.T); });
    temps.sort(function (a, b) { return a - b; });
    if (temps.indexOf(Tr) < 0 || temps.length < 2 || pts.length < 6) return null;
    var livres = temps.filter(function (T) { return T !== Tr; });
    var lE = pts.map(function (p) { return Math.log10(p.E); });
    var mn = Math.min.apply(null, lE), mx = Math.max.apply(null, lE);
    function sh(p, T) { var k = livres.indexOf(T); return k < 0 ? 0 : p[4 + k]; }
    function res(p) { return pts.map(function (q, i) { return sigm(p, Math.log10(q.f) + sh(p, q.T)) - lE[i]; }); }
    var best = null;
    [-0.3, -0.5, -0.8].forEach(function (g) {
      [-1, 0, 1].forEach(function (b) {
        var p0 = [mn - 0.4, mx - mn + 0.8, b, g].concat(livres.map(function (T) { return -0.1 * (T - Tr); }));
        var f = lm(res, p0, 400);
        if (f.p.every(ok) && (!best || f.sse < best.sse)) best = f;
      });
    });
    if (!best) return null;
    var c = best.p, me = media(lE), sst = lE.reduce(function (s, v) { return s + (v - me) * (v - me); }, 0);
    var o = { d: c[0], a: c[1], b: c[2], g: c[3], c: c.slice(0, 4), temps: temps, Tr: Tr, sse: best.sse, r2: sst ? 1 - best.sse / sst : NaN,
      laT: temps.map(function (T) { return sh(c, T); }) };
    o.seSy = pts.length > 4 + livres.length && sst ? Math.sqrt(best.sse / (pts.length - 4 - livres.length)) / Math.sqrt(sst / (pts.length - 1)) : NaN;
    if (temps.length >= 3) {
      var pa = FE.parabola(temps, o.laT);
      if (pa) { o.a1 = pa.a; o.a2 = pa.b; o.a3 = pa.c; }
    }
    o.shift = function (T) { var k = temps.indexOf(T); return k >= 0 ? o.laT[k] : NaN; };
    return o;
  }

  FE.FICHAS["dnit-416-2019-me"] = {
    titulo: "Misturas asfálticas — Módulo dinâmico e ângulo de fase (curva mestra)",
    resumo: "Compressão axial senoidal (haversine) em CP de 100 × 150 mm a 4, 20 e 40 °C e 25; 10; 5; 1; 0,5 e 0,1 Hz (8 a), deformação de 50 a 75 µε. |E*| = |σ*|/|ε*| (eq. 26) e θ = θε − θσ (eq. 25) vêm da análise do equipamento (seção 9); a ficha corrige o ângulo pelo CP elástico (5.1), confere os limites de qualidade (Tabela 7), monta a Tabela 8 e ajusta a curva mestra sigmoidal com fatores de deslocamento log aT = a1T² + a2T + a3 (seção 11).",
    blocos: [],
    params: [
      { k: "mistura", r: "Mistura asfáltica", ph: "ex.: CBUQ faixa C, CAP 50/70, TMN 19 mm" },
      { k: "transd", r: "Transdutores de deslocamento por CP (4.5)", tipo: "select", opcoes: [["2", "2 (a 180°)"], ["3", "3 (a 120°)"], ["4", "4 (a 90°)"]] },
      { k: "detalhe", r: "Dados por CP e condição", tipo: "select", recarrega: true,
        opcoes: [["basico", "|E*| e ângulo de fase"], ["completo", "|E*|, ângulo de fase, |ε*| e indicadores de qualidade (Tabela 7)"]] },
      { k: "corrFase", r: "Correção do ângulo de fase pelo CP elástico (5.1)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não informar"], ["sim", "Informar o ângulo medido no CP de alumínio em cada frequência"]] },
      { k: "tr", r: "Temperatura de referência da curva mestra — Tr (°C)", ph: "20", dica: "uma das temperaturas ensaiadas; usualmente 20 °C (11)" },
      { k: "vvReq", r: "Volume de vazios requerido (%) — opcional", ph: "ex.: 5,5", dica: "CP rejeitado fora de ± 0,5 % (6.8)" },
    ],
    padrao: { transd: "2", detalhe: "basico", corrFase: "nao", tr: "20" },
    tabelas: function (d) {
      var P = d.params || {}, ncp = Math.max(1, (d.cp || []).length);
      var cp = [{ k: "id", r: "Identificação do CP", texto: true }, { grupo: "Dimensões — paquímetro, 0,1 mm (6.4, 6.5)" }];
      [1, 2, 3, 4, 5, 6].forEach(function (i) { cp.push({ k: "d" + i, r: "Diâmetro — medida " + i, u: "mm" }); });
      cp.push({ calc: "D", r: "Diâmetro médio (98 a 104 mm)", u: "mm", casas: 1 }, { calc: "sD", r: "Desvio-padrão do diâmetro (≤ 0,5 mm)", u: "mm", casas: 2 });
      [1, 2, 3, 4].forEach(function (i) { cp.push({ k: "h" + i, r: "Altura — medida " + i, u: "mm" }); });
      cp.push({ calc: "H", r: "Altura média (147,5 a 152,5 mm)", u: "mm", casas: 1 }, { k: "vv", r: "Volume de vazios (6.8)", u: "%" });
      var L = [{ k: "T", r: "Temperatura", u: "°C" }, { k: "f", r: "Frequência", u: "Hz" }];
      if (P.corrFase === "sim") L.push({ k: "fel", r: "Ângulo no CP elástico (5.1)", u: "°" });
      for (var j = 0; j < ncp; j++) {
        var nm = nomeCP(d, j);
        L.push({ grupo: nm }, { k: "e" + j, r: nm + " — |E*| (eq. 26)", u: "MPa" }, { k: "p" + j, r: nm + " — ângulo de fase θ (eq. 25)", u: "°" });
        if (P.detalhe === "completo") {
          L.push({ k: "eps" + j, r: nm + " — |ε*| médio (eq. 21)", u: "µε" });
          QUAL.forEach(function (q) { L.push({ k: q[0] + j, r: nm + " — " + q[4], u: q[2] }); });
        }
      }
      L.push({ grupo: "Resumo da condição (Tabela 8) e curva mestra (11)" },
        { calc: "em", r: "|E*| médio", u: "MPa", casas: 1, destaque: true }, { calc: "cv", r: "Coeficiente de variação de |E*|", u: "%", casas: 1 },
        { calc: "pm", r: "Ângulo de fase médio" + (P.corrFase === "sim" ? " (corrigido)" : ""), u: "°", casas: 1 }, { calc: "pd", r: "Desvio-padrão do ângulo de fase", u: "°", casas: 1 },
        { calc: "fr", r: "Frequência reduzida fr = f·aT (eq. 27)", u: "Hz", casas: 4 }, { calc: "ec", r: "|E*| da curva mestra (eq. 29)", u: "MPa", casas: 1 },
        { calc: "er", r: "Diferença curva − ensaio", u: "%", casas: 1 });
      return [{ chave: "cp", titulo: "Corpos de prova", rotulo: "CP", iniciais: 2, min: 1, linhas: cp,
        dica: "uma coluna por CP; ao incluir um CP a tabela de condições ganha as linhas dele" },
        { chave: "cond", titulo: "Módulo dinâmico por temperatura e frequência", rotulo: "Condição", iniciais: 18, min: 1, linhas: L,
          dica: "uma coluna por par temperatura-frequência (da menor para a maior temperatura; em cada uma, da maior para a menor frequência — 8 a)" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], ncp = (d.cp || []).length, vvReq = num(P.vvReq);
      var rej = [], medidas = [];
      var cps = (d.cp || []).map(function (x, j) {
        var rot = nomeCP(d, j), o = {};
        var ld = [1, 2, 3, 4, 5, 6].map(function (k) { return num(x["d" + k]); }).filter(ok);
        var lh = [1, 2, 3, 4].map(function (k) { return num(x["h" + k]); }).filter(ok);
        o.D = media(ld); o.H = media(lh); o.sD = dp(ld);
        if (ok(o.D) && (o.D < 98 || o.D > 104)) rej.push(rot + ": diâmetro médio " + fmt(o.D, 1) + " mm");
        if (ok(o.sD) && o.sD > 0.5) rej.push(rot + ": desvio-padrão do diâmetro " + fmt(o.sD, 2) + " mm");
        if (ok(o.H) && (o.H < 147.5 || o.H > 152.5)) rej.push(rot + ": altura " + fmt(o.H, 1) + " mm");
        var vv = num(x.vv);
        if (ok(vv) && ok(vvReq) && Math.abs(vv - vvReq) > 0.5 + 1e-9) rej.push(rot + ": Vv = " + fmt(vv, 1) + " % (requerido " + fmt(vvReq, 1) + " ± 0,5 %)");
        if ((ld.length && ld.length < 6) || (lh.length && lh.length < 4)) medidas.push(rot);
        return o;
      });
      if (rej.length) avisos.push("CP a rejeitar (Tabela 2, 6.8): " + rej.join("; ") + ".");
      if (medidas.length) avisos.push("Seis medidas de diâmetro e quatro de altura (6.4, 6.5): confira " + medidas.join(", ") + ".");
      var qual = [], epsF = [], corrigidos = [], semPar = 0;
      var conds = (d.cond || []).map(function (x) {
        var o = { T: num(x.T), f: num(x.f) }, Es = [], Ps = [], fel = num(x.fel);
        var corr = P.corrFase === "sim" && ok(fel) && Math.abs(fel) > 0.5 ? fel : 0;
        var rot = (ok(o.T) ? fmt(o.T, 0) + " °C" : "?") + " / " + (ok(o.f) ? fmt(o.f, o.f < 1 ? 1 : 0) + " Hz" : "?");
        if (corr) corrigidos.push(rot + " (" + fmt(fel, 1) + "°)");
        for (var j = 0; j < ncp; j++) {
          var E = num(x["e" + j]), ph = num(x["p" + j]);
          if (ok(E)) Es.push(E);
          if (ok(ph)) Ps.push(ph - corr);
          if (P.detalhe === "completo" && (ok(E) || ok(ph))) {
            var eps = num(x["eps" + j]);
            if (ok(eps) && (eps < 50 || eps > 75)) epsF.push(nomeCP(d, j) + " em " + rot + " (" + fmt(eps, 0) + " µε)");
            QUAL.forEach(function (q) {
              var v = num(x[q[0] + j]);
              if (ok(v) && v > q[3] + 1e-9) qual.push(nomeCP(d, j) + " em " + rot + ": " + q[1].split(" — ")[0] + " = " + fmt(v, 1) + " " + q[2] + " (limite " + q[3] + " " + q[2] + ")");
            });
          }
        }
        o.em = media(Es); o.cv = ok(dp(Es)) ? dp(Es) / o.em * 100 : NaN; o.pm = media(Ps); o.pd = dp(Ps); o.nE = Es.length;
        if ((ok(o.T) || ok(o.f)) && !(ok(o.T) && ok(o.f) && o.f > 0)) semPar++;
        return o;
      });
      if (semPar) avisos.push(semPar + " condição(ões) sem temperatura ou frequência válida.");
      if (corrigidos.length) avisos.push("Ângulo de fase corrigido pela defasagem do CP elástico (5.1): " + corrigidos.join("; ") + ".");
      if (qual.length) avisos.push("Indicadores de qualidade acima dos limites da Tabela 7 (seção 10): " + qual.join("; ") + ".");
      if (epsF.length) avisos.push("Deformação fora de 50 a 75 µε (8 h): " + epsF.join("; ") + ".");
      var ac = ACUR[(P.transd || "2") + "-" + Math.min(4, ncp)];
      if (ncp < 2) avisos.push("A Tabela 3 considera no mínimo dois CPs por mistura; com " + ncp + " a acurácia não é estimada.");
      // curva mestra
      var pts = conds.filter(function (o) { return ok(o.T) && ok(o.f) && o.f > 0 && ok(o.em) && o.em > 0; });
      var Tr = ok(num(P.tr)) ? num(P.tr) : 20, cm = null;
      var temps = [];
      pts.forEach(function (p) { if (temps.indexOf(p.T) < 0) temps.push(p.T); });
      if (pts.length) {
        if (temps.indexOf(Tr) < 0) avisos.push("A temperatura de referência (" + fmt(Tr, 0) + " °C) deve ser uma das temperaturas ensaiadas (11) — curva mestra não ajustada.");
        else if (temps.length < 2) avisos.push("Curva mestra: são necessárias pelo menos duas temperaturas.");
        else {
          cm = curvaMestra(pts.map(function (p) { return { T: p.T, f: p.f, E: p.em }; }), Tr);
          if (cm && temps.length < 3) avisos.push("Com duas temperaturas a parábola de log aT (eq. 28) não é determinada — use pelo menos três.");
        }
      }
      conds.forEach(function (o) {
        if (cm && ok(o.T) && ok(o.f) && o.f > 0) {
          var la = cm.shift(o.T);
          if (ok(la)) { o.fr = o.f * Math.pow(10, la); o.ec = Math.pow(10, sigm(cm.c, Math.log10(o.fr))); o.er = ok(o.em) ? (o.ec - o.em) / o.em * 100 : NaN; }
        }
      });
      var fora = conds.filter(function (o) { return ok(o.er) && Math.abs(o.er) > 15; });
      if (fora.length) avisos.push("Curva mestra: " + fora.length + " condição(ões) com diferença acima de 15 % entre a curva e o ensaio — confira os dados (informativo).");
      var r = { n: ncp, acuracia: ac, transd: P.transd || "2", tr: Tr, mestre: cm ? { d: cm.d, a: cm.a, b: cm.b, g: cm.g, r2: cm.r2, seSy: cm.seSy, a1: cm.a1, a2: cm.a2, a3: cm.a3,
        temps: cm.temps, laT: cm.laT } : null, nCond: pts.length, temps: temps.sort(function (a, b) { return a - b; }) };
      return { tab: { cp: cps, cond: conds }, conds: conds, cm: cm, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, m = r.mestre;
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + r.nCond + ' <small>condições</small></div><div class="fe-res-r">' + r.n + " CP(s) · temperaturas " +
        (r.temps.length ? r.temps.map(function (t) { return fmt(t, 0); }).join(", ") + " °C" : "—") + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.acuracia) ? "± " + fmt(r.acuracia, 1) + " %" : "—") + '</div><div class="fe-res-r">Acurácia estimada (Tabela 3) — ' + r.transd + " transdutores por CP</div></div>";
      if (m) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">R² = ' + fmt(m.r2, 4) + '</div><div class="fe-res-r">Curva mestra a ' + fmt(r.tr, 0) + " °C (log |E*|)" + (ok(m.seSy) ? " · Se/Sy = " + fmt(m.seSy, 3) : "") + "</div></div>";
      h += "</div>";
      if (m) {
        var linha = function (a, b) { return "<tr><td>" + a + "</td><td>" + b + "</td></tr>"; };
        h += '<table class="fe-resumo fe-gran"><thead><tr><th>Curva mestra a ' + fmt(r.tr, 0) + ' °C (eq. 29)</th><th>Valor</th></tr></thead><tbody>' +
          linha("log |E*| = δ + α/(1 + e^(β + γ·log fr)) — |E*| em MPa, fr em Hz", "") +
          linha("δ", fmt(m.d, 4)) + linha("α", fmt(m.a, 4)) + linha("β", fmt(m.b, 4)) + linha("γ", fmt(m.g, 4)) +
          m.temps.map(function (t, k) { return linha("log aT a " + fmt(t, 0) + " °C", fmt(m.laT[k], 3)); }).join("") +
          (ok(m.a1) ? linha("log aT = a1·T² + a2·T + a3 (eq. 28): a1", FE.fmtSig(m.a1, 4)) + linha("a2", FE.fmtSig(m.a2, 4)) + linha("a3", FE.fmtSig(m.a3, 4)) : "") +
          "</tbody></table>";
      }
      return h;
    },
    graficos: function (calc, d, opt) {
      var conds = calc.conds.filter(function (o) { return ok(o.T) && ok(o.f) && o.f > 0; }), temps = calc.resultados.temps, cm = calc.cm;
      function porT(fx, fy, y2) {
        return temps.map(function (T, k) {
          var pts = conds.filter(function (o) { return o.T === T; }).sort(function (a, b) { return a.f - b.f; }).map(function (o) { return [fx(o), fy(o)]; });
          return { pts: pts, cor: CORES[k % CORES.length], linha: !y2, rot: fmt(T, 0) + " °C" };
        });
      }
      var g1 = grafXY({ opt: opt, logX: true, logY: true, xl: "Frequência (Hz)", yl: "|E*| (MPa)", leg: "dir",
        series: porT(function (o) { return o.f; }, function (o) { return o.em; }), vazio: "As isotermas aparecem com |E*| por temperatura e frequência." });
      var g2 = grafXY({ opt: opt, logX: true, logY: false, xl: "Frequência (Hz)", yl: "Ângulo de fase (°)", leg: "dir", yInclui: [0],
        series: porT(function (o) { return o.f; }, function (o) { return o.pm; }), vazio: "O ângulo de fase aparece com os dados." });
      var out = [g1, g2];
      if (cm) {
        var s = porT(function (o) { return o.fr; }, function (o) { return o.em; }, true).map(function (x) { x.linha = false; return x; });
        var frs = conds.map(function (o) { return o.fr; }).filter(function (v) { return ok(v) && v > 0; });
        var a = Math.log10(Math.min.apply(null, frs)) - 0.5, b = Math.log10(Math.max.apply(null, frs)) + 0.5, L = [];
        for (var i = 0; i <= 60; i++) { var lf = a + (b - a) * i / 60; L.push([Math.pow(10, lf), Math.pow(10, sigm(cm.c, lf))]); }
        s.push({ pts: L, cor: "#9aa3b2", linha: true, marca: false, rot: "Curva mestra a " + fmt(cm.Tr, 0) + " °C" });
        out.push(grafXY({ opt: opt, logX: true, logY: true, xl: "Frequência reduzida fr (Hz)", yl: "|E*| (MPa)", leg: "esq", series: s }));
        var sp = [{ pts: cm.temps.map(function (T, k) { return [T, cm.laT[k]]; }), cor: CORES[0], rot: "log aT ajustado" }];
        if (ok(cm.a1)) {
          var t0 = cm.temps[0], t1 = cm.temps[cm.temps.length - 1], P2 = [];
          for (i = 0; i <= 40; i++) { var T = t0 + (t1 - t0) * i / 40; P2.push([T, cm.a1 * T * T + cm.a2 * T + cm.a3]); }
          sp.push({ pts: P2, cor: CORES[1], linha: true, marca: false, rot: "log aT = a1·T² + a2·T + a3 (eq. 28)" });
        }
        out.push(grafXY({ opt: opt, xl: "Temperatura (°C)", yl: "log aT", leg: "dir", series: sp }));
      }
      return out;
    },
    relatorio: {
      parametros: [["Carregamento", "Compressão axial haversine; frequências de 25 a 0,1 Hz (Tabela 6: 200/200/100/20/15/15 ciclos); da menor para a maior temperatura e, em cada uma, da maior para a menor frequência"]],
      notas: "|E*| e θ de cada CP em cada condição conforme a seção 9 (eqs. 2–26), calculados pelo equipamento; θ corrigido pela defasagem do CP elástico quando esta excede 0,5° em módulo (5.1). Tabela 8: média e coeficiente de variação de |E*| (desvio-padrão amostral) e média e desvio-padrão do ângulo de fase. Limites de qualidade (Tabela 7): se(σ) ≤ 10 %, se(ε) ≤ 10 %, Uε ≤ 35 %, Uθ ≤ 3°; deformação de 50 a 75 µε (8 h). Curva mestra (seção 11): log|E*| = δ + α/(1 + e^(β + γ·log fr)) (eq. 29), fr = f·aT (eq. 27), coeficientes e fatores de deslocamento de cada temperatura (aT = 1 na Tr) obtidos juntos pela minimização da soma dos quadrados da eq. 30 (equivalente ao Solver); depois log aT = a1T² + a2T + a3 (eq. 28) por mínimos quadrados sobre os log aT obtidos.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, m = r.mestre, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        rows.push(["Corpos de prova / condições ensaiadas", r.n + " / " + r.nCond + (ok(r.acuracia) ? " (acurácia estimada ± " + fmt(r.acuracia, 1) + " %, Tabela 3)" : "")]);
        if (m) {
          rows.push(["Curva mestra a " + fmt(r.tr, 0) + " °C — δ; α; β; γ", fmt(m.d, 4) + "; " + fmt(m.a, 4) + "; " + fmt(m.b, 4) + "; " + fmt(m.g, 4) + " (|E*| em MPa, fr em Hz)"]);
          rows.push(["log aT por temperatura", m.temps.map(function (t, k) { return fmt(t, 0) + " °C: " + fmt(m.laT[k], 3); }).join("; ")]);
          if (ok(m.a1)) rows.push(["log aT = a1·T² + a2·T + a3", "a1 = " + FE.fmtSig(m.a1, 4) + "; a2 = " + FE.fmtSig(m.a2, 4) + "; a3 = " + FE.fmtSig(m.a3, 4)]);
          rows.push(["Qualidade do ajuste (log |E*|)", "R² = " + fmt(m.r2, 4) + (ok(m.seSy) ? "; Se/Sy = " + fmt(m.seSy, 3) : "")]);
        }
        return rows;
      },
      extraHtml: function (calc) {
        var c = calc.conds.filter(function (o) { return ok(o.T) && ok(o.f); });
        if (!c.length) return "";
        return '<table class="gr"><thead><tr><th>T (°C)</th><th>f (Hz)</th><th>|E*| médio (MPa)</th><th>CV (%)</th><th>θ médio (°)</th><th>DP θ (°)</th><th>fr (Hz)</th><th>|E*| curva (MPa)</th></tr></thead><tbody>' +
          c.map(function (o) {
            return "<tr><td>" + fmt(o.T, 0) + "</td><td>" + fmt(o.f, o.f < 1 ? 1 : 0) + "</td><td>" + fmt(o.em, 1) + "</td><td>" + fmt(o.cv, 1) + "</td><td>" + fmt(o.pm, 1) + "</td><td>" +
              fmt(o.pd, 1) + "</td><td>" + (ok(o.fr) ? FE.fmtSig(o.fr, 3) : "—") + "</td><td>" + fmt(o.ec, 1) + "</td></tr>";
          }).join("") + "</tbody></table>";
      },
    },
    exemplos: [
      { nome: "Exemplo da Tabela 8 da norma — 2 CPs, 4/20/40 °C", dados: function () {
        // DNIT 416/2019-ME, Tabela 8 (|E*| em MPa e ângulo de fase em graus de cada CP); dimensões dos CPs ilustrativas
        var T = [[4, 25, "27220,1", "6,8", "26429,8", "6,7"], [4, 10, "24566,1", "8,9", "23818,4", "8,9"], [4, 5, "22524,8", "9,9", "22206,9", "9,8"],
          [4, 1, "18296,3", "12,5", "18374,2", "12,2"], [4, 0.5, "16113,4", "13,8", "16305,5", "13,4"], [4, 0.1, "12330,0", "17,1", "12680,8", "16,5"],
          [20, 25, "13094,2", "17,8", "13063,2", "17,9"], [20, 10, "10367,0", "20,3", "10722,5", "20,6"], [20, 5, "8618,1", "22,3", "8675,2", "22,0"],
          [20, 1, "5535,6", "26,9", "5570,2", "26,4"], [20, 0.5, "4255,8", "29,5", "4338,6", "28,9"], [20, 0.1, "2204,6", "34,4", "2169,8", "34,2"],
          [40, 25, "3103,4", "31,9", "2851,8", "32,0"], [40, 10, "1813,2", "35,5", "1639,2", "36,1"], [40, 5, "1161,0", "38,9", "1003,9", "40,3"],
          [40, 1, "457,2", "40,8", "417,2", "38,9"], [40, 0.5, "289,8", "40,6", "278,2", "38,8"], [40, 0.1, "194,2", "27,8", "207,1", "24,7"]];
        return { ident: { registro: "EX-MD-001", camada: "Exemplo da norma (Tabela 8)" },
          params: { mistura: "Mistura do exemplo da norma", transd: "2", detalhe: "basico", corrFase: "nao", tr: "20" },
          cp: [["1", 100.2, 150.1], ["2", 99.8, 149.7]].map(function (c) {
            var x = { id: c[0] };
            [0.1, -0.1, 0.2, 0, -0.1, -0.1].forEach(function (e, i) { x["d" + (i + 1)] = fmt(c[1] + e, 1); });
            [0.1, -0.1, 0.2, -0.2].forEach(function (e, i) { x["h" + (i + 1)] = fmt(c[2] + e, 1); });
            return x;
          }),
          cond: T.map(function (t) { return { T: String(t[0]), f: fmt(t[1], t[1] < 1 ? 1 : 0), e0: t[2], p0: t[3], e1: t[4], p1: t[5] }; }) };
      } },
      { nome: "CBUQ com asfalto modificado — 3 CPs, indicadores de qualidade e correção de fase (dados gerados)", dados: function () {
        // valores-alvo: curva mestra a 20 °C com δ = 1,90; α = 2,65; β = −1,10; γ = −0,55; log aT = 0,0004T² − 0,125T + 2,34
        // fatores por CP (0,97 / 1,00 / 1,04); ângulos plausíveis; CP elástico com 0,8° a 25 Hz e 0,6° a 10 Hz (corrigidos) e 0,3° nas demais;
        // CP 3 a 40 °C e 0,1 Hz com Uθ = 3,6° e deformação de 82 µε (fora dos limites)
        var c = [1.90, 2.65, -1.10, -0.55], fs = [25, 10, 5, 1, 0.5, 0.1], fat = [0.97, 1.00, 1.04], fel = { 25: "0,8", 10: "0,6" };
        function laT(T) { return 0.0004 * T * T - 0.125 * T + 2.34; }
        var cond = [];
        [4, 20, 40].forEach(function (T) {
          fs.forEach(function (f) {
            var lfr = Math.log10(f) + laT(T), E = Math.pow(10, sigm(c, lfr));
            var ph = 4 + 34 * Math.exp(-Math.pow((lfr + 1.2) / 2.6, 2));
            var x = { T: String(T), f: fmt(f, f < 1 ? 1 : 0), fel: fel[f] || "0,3" };
            fat.forEach(function (k, j) {
              x["e" + j] = fmt(E * k, 1); x["p" + j] = fmt(ph + (j - 1) * 0.4 + (fel[f] ? num(fel[f]) : 0), 1);
              x["eps" + j] = String(60 + j * 4 + (f < 1 ? 3 : 0)); x["ss" + j] = fmt(2.1 + j * 0.4, 1); x["se" + j] = fmt(3.5 + j * 0.8, 1);
              x["ue" + j] = fmt(12 + j * 5, 1); x["ut" + j] = fmt(0.8 + j * 0.4, 1);
            });
            if (T === 40 && f === 0.1) { x.ut2 = "3,6"; x.eps2 = "82"; }
            cond.push(x);
          });
        });
        return { ident: { registro: "EX-MD-002", obra: "Obra C", camada: "Capa — CBUQ faixa C, AMP 60/85", origem: "Usina B" },
          params: { mistura: "CBUQ faixa C, AMP 60/85, Vv de ensaio 5,5 %", transd: "3", detalhe: "completo", corrFase: "sim", tr: "20", vvReq: "5,5" },
          cp: [["MD-1", 100.4, 150.3, "5,4"], ["MD-2", 99.9, 149.8, "5,7"], ["MD-3", 100.1, 150.6, "6,2"]].map(function (a) {
            var x = { id: a[0], vv: a[3] };
            [0.1, -0.1, 0.2, 0, -0.1, -0.1].forEach(function (e, i) { x["d" + (i + 1)] = fmt(a[1] + e, 1); });
            [0.1, -0.1, 0.2, -0.2].forEach(function (e, i) { x["h" + (i + 1)] = fmt(a[2] + e, 1); });
            return x;
          }),
          cond: cond };
      } },
    ],
  };
})();
