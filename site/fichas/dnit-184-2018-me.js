/*
 * Ficha: DNIT 184/2018-ME — Misturas asfálticas — Ensaio uniaxial de carga repetida (Flow Number, FN).
 * O equipamento fornece a curva de deformação plástica acumulada × número de ciclos de cada corpo de prova
 * (deslocamento de cada LVDT, deslocamento médio ou deformação específica), digitada numa coluna por CP com uma
 * linha por ciclo registrado (parâmetro "ciclos"); a ficha calcula εp (7.1, 7.2),
 * a taxa de deformação (eq. 3) e o FN pelos dois critérios da seção 7.3 (taxa mínima e modelo da eq. 4).
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
        var h = 1e-7 * Math.max(Math.abs(v), 1e-9), q = p.slice(); q[j] += h;
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
      if (!melhorou || ganho < 1e-12 * sse) break;
    }
    return { p: p, sse: sse };
  }

  // modelo da eq. 4: εp = A·N^B + C·(e^(D·N) − 1), ajustado por busca em grade (B, D) com A e C lineares, refinado por LM
  function ajusteModelo(Ns, es) {
    var n = Ns.length;
    if (n < 6) return null;
    var Nmax = Math.max.apply(null, Ns), best = null;
    for (var B = 0.02; B <= 0.99; B += 0.01) {
      var u = Ns.map(function (N) { return Math.pow(N, B); });
      for (var j = 0; j <= 80; j++) {
        var D = Math.pow(10, -2 + j * 3.5 / 80) / Nmax;  // D·Nmax de 0,01 a ~30
        var v = Ns.map(function (N) { return Math.exp(D * N) - 1; });
        var suu = 0, suv = 0, svv = 0, sue = 0, sve = 0;
        for (var i = 0; i < n; i++) { suu += u[i] * u[i]; suv += u[i] * v[i]; svv += v[i] * v[i]; sue += u[i] * es[i]; sve += v[i] * es[i]; }
        var det = suu * svv - suv * suv, A, C;
        if (!det) continue;
        A = (sue * svv - sve * suv) / det; C = (suu * sve - suv * sue) / det;
        if (C < 0) { C = 0; A = sue / suu; }
        if (!(A > 0)) continue;
        var sse = 0;
        for (i = 0; i < n; i++) { var e = A * u[i] + C * v[i] - es[i]; sse += e * e; }
        if (!best || sse < best.sse) best = { p: [A, B, C, D], sse: sse };
      }
    }
    if (!best) return null;
    var f = lm(function (p) {
      return Ns.map(function (N, i) { return p[0] * Math.pow(N, p[1]) + p[2] * (Math.exp(p[3] * N) - 1) - es[i]; });
    }, best.p, 200);
    var p = f.p.every(ok) && f.sse <= best.sse && f.p[0] > 0 && f.p[2] >= 0 && f.p[3] > 0 ? f.p : best.p;
    var sse = Ns.reduce(function (s, N, i) { var e = p[0] * Math.pow(N, p[1]) + p[2] * (Math.exp(p[3] * N) - 1) - es[i]; return s + e * e; }, 0);
    var me = media(es), sst = es.reduce(function (s, e) { return s + (e - me) * (e - me); }, 0);
    var o = { A: p[0], B: p[1], C: p[2], D: p[3], r2: sst ? 1 - sse / sst : NaN, Nmax: Nmax };
    // FN: segunda derivada (eq. 6) nula — muda de negativa para positiva
    function d2(N) { return o.A * o.B * (o.B - 1) * Math.pow(N, o.B - 2) + o.C * o.D * o.D * Math.exp(o.D * N); }
    o.d1 = function (N) { return o.A * o.B * Math.pow(N, o.B - 1) + o.C * o.D * Math.exp(o.D * N); };
    o.f = function (N) { return o.A * Math.pow(N, o.B) + o.C * (Math.exp(o.D * N) - 1); };
    var a = 1, b = Nmax * 3;
    if (o.C > 0 && o.D > 0 && d2(a) < 0 && d2(b) > 0) {
      for (var k = 0; k < 200; k++) { var mm = (a + b) / 2; if (d2(mm) < 0) a = mm; else b = mm; }
      o.fn = Math.round((a + b) / 2);
    } else o.fn = NaN;
    return o;
  }

  var ENTRADAS = [["lvdt", "Deslocamento plástico de cada LVDT (mm) — dois sensores"], ["desl", "Deslocamento plástico médio (mm)"],
    ["eps", "Deformação plástica específica (mm/mm)"], ["ue", "Deformação plástica (µε)"]];
  function nomeCP(d, j) { var c = (d.cp || [])[j] || {}; return "CP " + (c.id || j + 1); }

  // ciclos das leituras: "1-10; 20-590/10; 597" (intervalos a-b com passo /p, ou valores isolados)
  var MAX_LEI = 1500;
  function cronograma(txt) {
    var v = [];
    String(txt || "").split(/[;\s]+/).forEach(function (it) {
      var m = /^(\d+)(?:-(\d+)(?:\/(\d+))?)?$/.exec(it.trim());
      if (!m) return;
      var a = Number(m[1]), b = m[2] ? Number(m[2]) : a, p = m[3] ? Math.max(1, Number(m[3])) : 1;
      for (var n = a; n <= b && v.length <= MAX_LEI * 2; n += p) v.push(n);
    });
    v = v.filter(function (n, i) { return n > 0 && v.indexOf(n) === i; }).sort(function (x, y) { return x - y; });
    return v.slice(0, MAX_LEI);
  }
  // εp (µε) de um CP em cada leitura, conforme o tipo de entrada
  function curva(x, P) {
    var hr = num(P.hr), pts = [];
    cronograma(P.ciclos).forEach(function (N) {
      var e = NaN;
      if (P.entrada === "lvdt") {
        var eps = [num(x["a_" + N]), num(x["b_" + N])].filter(ok).map(function (l) { return l / hr * 1e6; });  // eq. 1 em cada LVDT
        e = eps.length === 2 ? media(eps) : NaN;                                                                // eq. 2 (NS = 2)
      } else if (P.entrada === "desl") e = num(x["a_" + N]) / hr * 1e6;
      else if (P.entrada === "eps") e = num(x["a_" + N]) * 1e6;
      else e = num(x["a_" + N]);
      if (ok(e)) pts.push({ N: N, e: e });
    });
    return pts;
  }

  FE.FICHAS["dnit-184-2018-me"] = {
    titulo: "Misturas asfálticas — Deformação permanente: uniaxial de carga repetida (Flow Number)",
    resumo: "CP de 100 × 150 mm a 60 °C, pulso de 204 kPa (0,1 s) e repouso de 0,9 s com 10,2 kPa de contato, até a zona terciária ou 7.200 ciclos. εp = ΔLp/Hr (eqs. 1–2), taxa Δεp/ΔN (eq. 3) e FN = ciclo da taxa mínima (7.3 a) ou do ponto de inflexão do modelo εp = A·N^B + C(e^(DN) − 1) (eqs. 4–6, 7.3 b). Resultado: média dos FN de pelo menos três CPs.",
    blocos: [],
    params: [
      { k: "mistura", r: "Mistura asfáltica", ph: "ex.: CBUQ faixa C, CAP 50/70" },
      { k: "entrada", r: "Dados da curva de deformação exportados pelo equipamento", tipo: "select", recarrega: true, opcoes: ENTRADAS },
      { k: "hr", r: "Altura de referência dos LVDTs — Hri (mm) (4 e)", ph: "100", dica: "mínimo de 100 mm",
        se: function (d) { var e = (d.params || {}).entrada; return e === "lvdt" || e === "desl"; } },
      { k: "ciclos", r: "Ciclos das leituras registradas", recarrega: true, ph: "1-10; 20-1000/10",
        dica: "intervalos a-b com passo /p separados por ponto e vírgula (ex.: 1-10; 20-590/10; 597) — uma linha por leitura na tabela" },
      { k: "metodo", r: "Critério do FN em destaque (7.3)", tipo: "select",
        opcoes: [["taxa", "a) Taxa de deformação mínima dos pontos (eq. 3)"], ["modelo", "b) Modelo ajustado — segunda derivada nula (eqs. 4–6)"]],
        dica: "os dois critérios são sempre calculados" },
      { k: "gmbProj", r: "Grau de compactação exigido (%)", ph: "97,0", dica: "97,0 ± 0,5 % da Gmb de projeto (5 a) — informativo" },
    ],
    padrao: { entrada: "lvdt", hr: "100", ciclos: "1-10; 20-1000/10", metodo: "taxa" },
    tabelas: function (d) {
      var P = d.params || {}, ncp = Math.max(1, (d.cp || []).length);
      var cp = [{ k: "id", r: "Identificação do CP", texto: true }, { grupo: "Dimensões — paquímetro, 0,1 mm (5 c)" }];
      [1, 2, 3, 4, 5, 6].forEach(function (i) { cp.push({ k: "d" + i, r: "Diâmetro — medida " + i, u: "mm" }); });
      cp.push({ calc: "D", r: "Diâmetro médio (100 a 104 mm)", u: "mm", casas: 1 }, { calc: "sD", r: "Desvio-padrão do diâmetro (≤ 0,5 mm)", u: "mm", casas: 2 });
      [1, 2, 3, 4].forEach(function (i) { cp.push({ k: "h" + i, r: "Altura — medida " + i, u: "mm" }); });
      cp.push({ calc: "H", r: "Altura média (147,5 a 152,5 mm)", u: "mm", casas: 1 },
        { k: "vv", r: "Volume de vazios / grau de compactação (informativo)", u: "%", texto: true },
        { grupo: "Condições do ensaio (6)" },
        { k: "te", r: "Temperatura Te (60,0 ± 0,5 °C)", u: "°C" }, { k: "pc", r: "Pcontato média (10,2 ± 0,5 kPa)", u: "kPa" },
        { k: "pm", r: "Pmáxima média (204,0 ± 4,0 kPa)", u: "kPa" },
        { grupo: "Resultado (7.3)" },
        { calc: "fnTaxa", r: "FN — taxa mínima (7.3 a)", u: "ciclos", casas: 0 },
        { calc: "fnMod", r: "FN — modelo, 2ª derivada nula (7.3 b)", u: "ciclos", casas: 0 },
        { calc: "eFN", r: "εp no FN em destaque (8 c)", u: "µε", casas: 0, destaque: true },
        { calc: "r2", r: "R² do modelo (eq. 4)", u: "", casas: 4 });
      var ul = P.entrada === "eps" ? "mm/mm" : P.entrada === "ue" ? "µε" : "mm";
      cp.push({ grupo: "Curva de deformação plástica × ciclos — " + (P.entrada === "lvdt" ? "ΔLp de cada LVDT (eq. 1)" :
        P.entrada === "desl" ? "deslocamento plástico médio" : P.entrada === "eps" ? "deformação específica" : "deformação em µε") + " (7.3 a)" });
      cronograma(P.ciclos).forEach(function (N) {
        if (P.entrada === "lvdt") cp.push({ k: "a_" + N, r: "N = " + N + " — LVDT 1", u: "mm" }, { k: "b_" + N, r: "N = " + N + " — LVDT 2", u: "mm" });
        else cp.push({ k: "a_" + N, r: "N = " + N, u: ul });
      });
      return [{ chave: "cp", titulo: "Corpos de prova e curva de deformação", rotulo: "CP", iniciais: 3, min: 1, linhas: cp,
        dica: "uma coluna por CP; leituras de cima para baixo (Enter desce), em branco depois do fim do ensaio do CP" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], ncp = (d.cp || []).length, hr = num(P.hr);
      var usaHr = P.entrada === "lvdt" || P.entrada === "desl";
      if (usaHr && !ok(hr)) avisos.push("Informe a altura de referência dos LVDTs (Hri).");
      if (usaHr && ok(hr) && hr < 100) avisos.push("Altura de referência de " + fmt(hr, 1) + " mm — mínimo de 100 mm (4 e).");
      var crono = cronograma(P.ciclos);
      if (!crono.length) avisos.push("Informe os ciclos das leituras registradas (ex.: 1-10; 20-1000/10).");
      if (crono.length >= MAX_LEI) avisos.push("Limite de " + MAX_LEI + " leituras por CP — use passo maior (ex.: 20-7200/10).");
      var rej = [], cond = [], semTerc = [], meio = [];
      var cps = (d.cp || []).map(function (x, j) {
        var rot = nomeCP(d, j), o = {};
        var ld = [1, 2, 3, 4, 5, 6].map(function (k) { return num(x["d" + k]); }).filter(ok);
        var lh = [1, 2, 3, 4].map(function (k) { return num(x["h" + k]); }).filter(ok);
        o.D = media(ld); o.H = media(lh);
        o.sD = ld.length > 1 ? Math.sqrt(ld.reduce(function (s, v) { return s + (v - o.D) * (v - o.D); }, 0) / (ld.length - 1)) : NaN;
        if (ok(o.D) && (o.D < 100 || o.D > 104)) rej.push(rot + ": diâmetro médio " + fmt(o.D, 1) + " mm");
        if (ok(o.sD) && o.sD > 0.5) rej.push(rot + ": desvio-padrão do diâmetro " + fmt(o.sD, 2) + " mm");
        if (ok(o.H) && (o.H < 147.5 || o.H > 152.5)) rej.push(rot + ": altura " + fmt(o.H, 1) + " mm");
        if ((ld.length && ld.length < 6) || (lh.length && lh.length < 4)) meio.push(rot);
        var te = num(x.te), pc = num(x.pc), pm = num(x.pm);
        if (ok(te) && Math.abs(te - 60) > 0.5 + 1e-9) cond.push(rot + ": Te = " + fmt(te, 1) + " °C");
        if (ok(pc) && Math.abs(pc - 10.2) > 0.5 + 1e-9) cond.push(rot + ": Pcontato = " + fmt(pc, 1) + " kPa");
        if (ok(pm) && Math.abs(pm - 204) > 4 + 1e-9) cond.push(rot + ": Pmáxima = " + fmt(pm, 1) + " kPa");
        // curva e taxa (eq. 3)
        var c = curva(x, P);
        c.forEach(function (p, k) { if (k) p.taxa = (p.e - c[k - 1].e) / (p.N - c[k - 1].N); });
        o.curva = c;
        o.nLei = c.length;
        if (c.length >= 3) {
          var kmin = -1;
          c.forEach(function (p, k) { if (k && ok(p.taxa) && (kmin < 0 || p.taxa < c[kmin].taxa)) kmin = k; });
          o.nUlt = c[c.length - 1].N;
          if (kmin === c.length - 1) { o.fnTaxa = NaN; o.semTercTaxa = true; }
          else { o.fnTaxa = c[kmin].N; o.taxaMin = c[kmin].taxa; }
          o.kmin = kmin;
          var m = ajusteModelo(c.map(function (p) { return p.N; }), c.map(function (p) { return p.e; }));
          o.mod = m;
          if (m) {
            o.r2 = m.r2;
            o.fnMod = ok(m.fn) && m.fn <= o.nUlt ? m.fn : NaN;
            if (ok(m.fn) && m.fn > o.nUlt) o.semTercMod = true;
            if (!ok(m.fn)) o.semTercMod = true;
          }
          if (o.semTercTaxa && o.semTercMod) semTerc.push(rot + " (último ciclo " + fmt(o.nUlt, 0) + ")");
        }
        o.fn = P.metodo === "modelo" ? o.fnMod : o.fnTaxa;
        // εp no FN (interpolação linear entre leituras)
        if (ok(o.fn)) for (var k = 1; k < c.length; k++) if (c[k].N >= o.fn) {
          o.eFN = c[k - 1].e + (c[k].e - c[k - 1].e) * (o.fn - c[k - 1].N) / (c[k].N - c[k - 1].N); break;
        }
        return o;
      });
      if (rej.length) avisos.push("CP a rejeitar (5 c): " + rej.join("; ") + ".");
      if (meio.length) avisos.push("Diâmetro = média de seis medidas e altura = média de quatro (5 c): confira " + meio.join(", ") + ".");
      if (cond.length) avisos.push("Condições de ensaio fora do especificado (6 b, d): " + cond.join("; ") + ".");
      if (semTerc.length) avisos.push("Zona terciária não atingida — FN não determinado: " + semTerc.join("; ") + ". O ensaio termina na ruptura (zona terciária) ou aos 7.200 ciclos (6 e).");
      cps.forEach(function (o, j) {
        var rot = nomeCP(d, j);
        if (o.nLei && o.nLei < 6) avisos.push(rot + ": poucas leituras (" + o.nLei + ") para definir a curva.");
        if (ok(o.nUlt) && o.nUlt > 7200) avisos.push(rot + ": leituras além de 7.200 ciclos — o ensaio termina aos 7.200 ciclos (6 e).");
        if (ok(o.fnTaxa) && ok(o.fnMod) && Math.abs(o.fnTaxa - o.fnMod) > 0.25 * Math.max(o.fnTaxa, o.fnMod))
          avisos.push(rot + ": FN pela taxa mínima (" + fmt(o.fnTaxa, 0) + ") e pelo modelo (" + fmt(o.fnMod, 0) + ") diferem mais de 25 % — confira o ruído das leituras.");
        if (o.semTercTaxa && ok(o.fnMod)) avisos.push(rot + ": a taxa dos pontos ainda cai na última leitura, mas o modelo indica inflexão em " + fmt(o.fnMod, 0) + " ciclos.");
      });
      var fns = cps.map(function (o) { return o.fn; }).filter(ok);
      if (fns.length < 3) avisos.push("O resultado é a média dos FN de pelo menos três CPs por mistura (7.3 b, 8 d); há " + fns.length + ".");
      var r = { fn: fns.length ? Math.round(media(fns)) : NaN, n: fns.length, metodo: P.metodo === "modelo" ? "modelo" : "taxa",
        individuais: cps.map(function (o) { return o.fn; }),
        fnTaxa: cps.map(function (o) { return o.fnTaxa; }), fnMod: cps.map(function (o) { return o.fnMod; }),
        eFN: cps.map(function (o) { return o.eFN; }) };
      var fT = r.fnTaxa.filter(ok), fM = r.fnMod.filter(ok);
      r.mediaTaxa = fT.length ? Math.round(media(fT)) : NaN; r.mediaMod = fM.length ? Math.round(media(fM)) : NaN;
      return { tab: { cp: cps.map(function (o) { return { D: o.D, sD: o.sD, H: o.H, fnTaxa: o.fnTaxa, fnMod: o.fnMod, eFN: o.eFN, r2: o.r2 }; }) },
        cps: cps, resultados: r, avisos: avisos, ncp: ncp };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados;
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.fn) ? fmt(r.fn, 0) : "—") + ' <small>ciclos</small></div><div class="fe-res-r">Flow Number — média de ' +
        r.n + " CP(s), " + (r.metodo === "modelo" ? "modelo (7.3 b)" : "taxa mínima (7.3 a)") + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.mediaTaxa) ? fmt(r.mediaTaxa, 0) : "—") + " · " + (ok(r.mediaMod) ? fmt(r.mediaMod, 0) : "—") +
        '</div><div class="fe-res-r">Médias pela taxa mínima · pelo modelo</div></div></div>';
      h += '<table class="fe-resumo fe-gran"><thead><tr><th>CP</th><th>FN taxa</th><th>FN modelo</th><th>Deformação no FN (×10⁻⁶)</th><th>A</th><th>B</th><th>C</th><th>D</th><th>R²</th></tr></thead><tbody>' +
        calc.cps.map(function (o, j) {
          var m = o.mod || {};
          return "<tr><td>" + esc(nomeCP(d, j)) + "</td><td>" + fmt(o.fnTaxa, 0) + "</td><td>" + fmt(o.fnMod, 0) + "</td><td>" + fmt(o.eFN, 0) + "</td><td>" +
            fmt(m.A, 1) + "</td><td>" + fmt(m.B, 4) + "</td><td>" + (ok(m.C) ? FE.fmtSig(m.C, 4) : "—") + "</td><td>" + (ok(m.D) ? FE.fmtSig(m.D, 4) : "—") + "</td><td>" + fmt(m.r2, 4) + "</td></tr>";
        }).join("") + "</tbody></table>";
      // taxas (eq. 3) nas leituras vizinhas da menor taxa, como na Tabela 1 do Anexo B
      calc.cps.forEach(function (o, j) {
        var c = o.curva || [];
        if (!(o.kmin > 0)) return;
        var viz = c.slice(Math.max(1, o.kmin - 3), Math.min(c.length, o.kmin + 4));
        h += '<table class="fe-resumo fe-gran"><thead><tr><th>' + esc(nomeCP(d, j)) + " — N</th>" + viz.map(function (p) { return "<th>" + fmt(p.N, 0) + "</th>"; }).join("") +
          "</tr></thead><tbody><tr><td>Deformação (×10⁻⁶)</td>" + viz.map(function (p) { return "<td>" + fmt(p.e, 0) + "</td>"; }).join("") +
          "</tr><tr><td>Taxa (×10⁻⁶/ciclo)</td>" + viz.map(function (p) { return "<td>" + (p.N === o.fnTaxa ? "<b>" + fmt(p.taxa, 2) + "</b>" : fmt(p.taxa, 2)) + "</td>"; }).join("") + "</tr></tbody></table>";
      });
      return h;
    },
    graficos: function (calc, d, opt) {
      var metodo = calc.resultados.metodo;
      var gs = calc.cps.map(function (o, j) {
        var c = o.curva || [], m = o.mod, series = [];
        series.push({ pts: c.map(function (p) { return [p.N, p.e]; }), cor: CORES[0], raio: 2.2, rot: nomeCP(d, j) + " — εp (µε), eixo esquerdo" });
        if (m && c.length) {
          var L = [], L2 = [], nmax = c[c.length - 1].N;
          for (var i = 0; i <= 80; i++) { var N = Math.max(1, nmax * i / 80); L.push([N, m.f(N)]); L2.push([N, m.d1(N)]); }
          series.push({ pts: L, cor: CORES[1], linha: true, marca: false, rot: "Modelo (eq. 4)" });
          series.push({ pts: L2, cor: CORES[2], linha: true, marca: false, y2: true, trac: true, rot: "Taxa do modelo (eq. 5), eixo direito" });
        }
        series.push({ pts: c.filter(function (p) { return ok(p.taxa); }).map(function (p) { return [p.N, p.taxa]; }), cor: CORES[3], raio: 2, vazado: true, y2: true, rot: "Taxa dos pontos (eq. 3), eixo direito" });
        var vl = [];
        if (ok(o.fnTaxa)) vl.push({ x: o.fnTaxa, cor: CORES[3], rot: "FN taxa " + fmt(o.fnTaxa, 0) });
        if (ok(o.fnMod)) vl.push({ x: o.fnMod, cor: CORES[1], rot: "FN modelo " + fmt(o.fnMod, 0) });
        var svg = grafXY({ opt: opt, xl: "Número de ciclos, N", yl: "Deformação plástica εp (µε)", y2l: "Taxa Δεp/ΔN (µε/ciclo)", logY2: true,
          series: series, vlinhas: vl, leg: "esq", yInclui: [0], xInclui: [0], vazio: nomeCP(d, j) + ": a curva aparece com as leituras de N e da deformação." });
        return svg;
      });
      return gs.length ? gs : ['<div class="fe-graf-vazio">Sem corpos de prova.</div>'];
    },
    relatorio: {
      parametros: [["Carregamento", "Pré-carga de 10,2 kPa por 60 s; pulso haversine de 0,1 s até 204 kPa + repouso de 0,9 s (1 Hz); 60 °C; fim na zona terciária ou aos 7.200 ciclos"]],
      notas: "εpi = ΔLpi/Hri em cada LVDT (eq. 1); εp = média dos NS sensores (eq. 2), em microdeformações. Taxa de deformação Δεp/ΔN = (εpi − εpi−1)/(Ni − Ni−1) entre leituras consecutivas (eq. 3); FN pela alínea a = ciclo da menor taxa (Anexo B, Tabela 1). FN pela alínea b = ciclo em que a segunda derivada do modelo εp = A·N^B + C(e^(DN) − 1) (eq. 4) se anula (eq. 6), mudando de negativa para positiva; o modelo é ajustado por mínimos quadrados a todos os pontos do CP. FN inteiro; resultado = média dos FN de pelo menos três CPs (7.3 b, 8 d). Se a menor taxa ocorre na última leitura, a zona terciária não foi atingida e o FN não é definido.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        rows.push(["Flow Number — FN (média de " + r.n + " CPs, " + (r.metodo === "modelo" ? "modelo, 7.3 b" : "taxa mínima, 7.3 a") + ")", ok(r.fn) ? fmt(r.fn, 0) + " ciclos" : "—"]);
        calc.cps.forEach(function (o, j) {
          rows.push([nomeCP(d, j) + " — FN taxa / FN modelo / εp no FN", fmt(o.fnTaxa, 0) + " / " + fmt(o.fnMod, 0) + " ciclos / " + fmt(o.eFN, 0) + " µε"]);
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo da Tabela 1 do Anexo B da norma (1 CP, deformação específica)", dados: function () {
        // DNIT 184/2018-ME, Anexo B, Tabela 1: coluna "Deformação Plástica Específica" (mm/mm); FN = 220 ciclos (taxa mínima 0,0000239)
        var N = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], e = ["0,000006", "0,000697", "0,002342", "0,002727", "0,003017", "0,003248", "0,003445", "0,003619", "0,003770", "0,003909",
          "0,004863", "0,005520", "0,006034", "0,006475", "0,006871", "0,007230", "0,007565", "0,007881", "0,008179", "0,008463", "0,008739", "0,009007",
          "0,009270", "0,009523", "0,009773", "0,010022", "0,010269", "0,010518", "0,010761", "0,011004", "0,011243", "0,011485", "0,011728", "0,011975",
          "0,012221", "0,012465", "0,012711", "0,012956", "0,013206", "0,013457", "0,013712", "0,013967", "0,014221", "0,014478", "0,014740", "0,015001",
          "0,015266", "0,015534", "0,015804", "0,016078", "0,016360", "0,016645", "0,016935", "0,017228", "0,017525", "0,017825", "0,018136", "0,018448",
          "0,018769", "0,019092", "0,019422", "0,019756", "0,020090", "0,020436", "0,020788", "0,021147", "0,021510", "0,021879", "0,022141"];
        for (var k = 20; k <= 590; k += 10) N.push(k);
        N.push(597);
        return { ident: { registro: "EX-FN-001", camada: "Exemplo da norma (Anexo B)" },
          params: { mistura: "Mistura do exemplo da norma", entrada: "eps", ciclos: "1-10; 20-590/10; 597", metodo: "taxa" },
          cp: [N.reduce(function (x, n, i) { x["a_" + n] = e[i]; return x; }, { id: "1" })] };
      } },
      { nome: "CBUQ faixa C — 3 CPs, dois LVDTs com Hr = 100 mm (dados gerados pelo modelo da eq. 4)", dados: function () {
        // curvas-alvo εp = A·N^B + C(e^(DN) − 1) (µε) com ruído de ± 2 µε; LVDT 1 lê 3 % acima e LVDT 2 3 % abaixo da média;
        // CP 3 com Pmáxima de 209 kPa (fora de 204 ± 4 kPa)
        var alvos = [[1050, 0.26, 60, 0.0045, 880], [980, 0.27, 45, 0.0042, 950], [1120, 0.25, 70, 0.0048, 820]];
        var semente = 7;
        function ruido() { semente = (semente * 16807) % 2147483647; return (semente / 2147483647 - 0.5) * 4; }
        var Ns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        for (var k = 20; k <= 950; k += 10) Ns.push(k);
        var lei = alvos.map(function () { return {}; });
        Ns.forEach(function (N) {
          alvos.forEach(function (a, j) {
            if (N > a[4]) return;
            var e = a[0] * Math.pow(N, a[1]) + a[2] * (Math.exp(a[3] * N) - 1) + ruido();
            lei[j]["a_" + N] = fmt(e * 1.03 * 100 / 1e6, 4); lei[j]["b_" + N] = fmt(e * 0.97 * 100 / 1e6, 4);
          });
        });
        return { ident: { registro: "EX-FN-002", obra: "Obra B", camada: "Capa — CBUQ faixa C", origem: "Usina A" },
          params: { mistura: "CBUQ faixa C, CAP 50/70, Gmb de projeto 2,380", entrada: "lvdt", hr: "100", ciclos: "1-10; 20-950/10", metodo: "modelo", gmbProj: "97,0" },
          cp: [["FN-1", 102.1, 150.2, "97,2", "60,1", "10,3", "204,5"], ["FN-2", 101.8, 149.6, "96,8", "59,9", "10,1", "203,2"],
            ["FN-3", 102.3, 150.8, "97,1", "60,2", "10,2", "209,0"]].map(function (c, j) {
            var x = Object.assign({ id: c[0], vv: c[3], te: c[4], pc: c[5], pm: c[6] }, lei[j]);
            [0.1, -0.1, 0.2, 0, -0.2, 0].forEach(function (e, i) { x["d" + (i + 1)] = fmt(c[1] + e, 1); });
            [0.2, -0.1, 0.1, -0.2].forEach(function (e, i) { x["h" + (i + 1)] = fmt(c[2] + e, 1); });
            return x;
          }) };
      } },
    ],
  };
})();
