/*
 * Ficha: DNIT 258/2023-ME — Solos — Compactação em equipamento miniatura — Mini-MCV e perda de massa por imersão.
 * Inclui a classificação MCT da DNIT 259/2023-CLA (coeficientes c', d', Pi', índice e' e gráfico da Figura A1).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // 3.6 — séries de golpes (acumulados)
  var SERIES = {
    simp: { nome: "Simplificada", ns: [1, 3, 6, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 180, 200, 250], ref: 10, curvas: [3, 6, 10, 20, 30] },
    pars: { nome: "Parsons", ns: [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256], ref: 12, curvas: [8, 12, 16, 24, 32] },
  };
  var AREA_PADRAO = Math.PI * 25 * 25 / 100;   // Ø 50 mm -> 19,635 cm²
  var GRUPOS = {
    LA: "Laterítico — areias com poucos finos (LA)",
    "LA'": "Laterítico — arenoso (LA'): areias argilosas e argilas arenosas",
    "LG'": "Laterítico — argiloso (LG')",
    NA: "Não laterítico — areias, areias siltosas e siltes quartzosos (NA)",
    "NA'": "Não laterítico — arenoso (NA'): areias siltosas e argilosas",
    "NS'": "Não laterítico — siltoso (NS')",
    "NG'": "Não laterítico — argiloso (NG')",
  };

  function serieDe(P) { return SERIES[P.serie] || SERIES.simp; }
  function umid(t, u, s) {
    t = num(t); u = num(u); s = num(s);
    return ok(t) && ok(u) && ok(s) && s - t > 0 && u >= s ? (u - s) / (s - t) * 100 : NaN;   // eq. 8
  }
  function kaDe(P) {
    if (P.modoKa === "direta") return 0;
    var kd = num(P.Ka);
    if (ok(kd)) return kd;
    var Ac = ok(num(P.Ac)) ? num(P.Ac) : 50, La = num(P.La);
    if (!ok(La)) return NaN;
    return P.modoKa === "inv" ? Ac - La : Ac + La;   // eq. 7 (NOTA 4: sinais invertidos)
  }
  function altura(P, Ka, L) {
    if (!ok(L)) return NaN;
    if (P.modoKa === "direta") return L;              // NOTA 5 / NOTA 7
    if (!ok(Ka)) return NaN;
    return P.modoKa === "inv" ? Ka + L : Ka - L;      // eq. 9
  }
  // interpolação (ou extrapolação, se permitido) linear em pares ordenados por x
  function linInterp(pares, x, extrap) {
    var p = pares.filter(function (q) { return ok(q[0]) && ok(q[1]); }).sort(function (a, b) { return a[0] - b[0]; });
    if (p.length < 2 || !ok(x)) return { v: NaN, ext: false };
    for (var i = 1; i < p.length; i++) {
      if (x <= p[i][0] + 1e-12 && x >= p[i - 1][0] - 1e-12 && p[i][0] !== p[i - 1][0]) {
        return { v: p[i - 1][1] + (p[i][1] - p[i - 1][1]) * (x - p[i - 1][0]) / (p[i][0] - p[i - 1][0]), ext: false };
      }
    }
    if (!extrap) return { v: NaN, ext: true };
    var a = x < p[0][0] ? p[0] : p[p.length - 2], b = x < p[0][0] ? p[1] : p[p.length - 1];
    return b[0] === a[0] ? { v: NaN, ext: true } : { v: a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]), ext: true };
  }

  // ---------- classificação MCT (DNIT 259, Figura A1) ----------
  // linha que separa L (abaixo) de N: e' = 1,40 até c' = 0,59; trecho tracejado até (0,70; 1,15); e' = 1,15 daí em diante
  function eLN(c) { return c < 0.59 ? 1.4 : c < 0.7 ? 1.4 - (c - 0.59) * 0.25 / 0.11 : 1.15; }
  // linha inclinada NA | NA'/NS': (0,27; 2,2) – (0,45; 1,75) – (0,59; 1,40) – (0,70; 1,15)
  function cNA(e) { return e >= 1.4 ? 0.27 + (2.2 - e) / 2.5 : 0.59 + (1.4 - e) * 0.11 / 0.25; }
  // linha NS' | NA': (0,45; 1,75) – (1,70; 1,15)
  function eNS(c) { return 1.75 - (c - 0.45) * 0.6 / 1.25; }
  function grupoL(c) { return c < 0.7 ? "LA" : c < 1.5 ? "LA'" : "LG'"; }
  // o traço vertical c' = 1,5 separa NS' de NG' só acima da linha NS'|NA' (e' ≈ 1,25); abaixo dela, até c' = 1,70, é NA' (mesma regra do FE.mct da DNIT 259)
  function classificar(c, e) {
    if (!ok(c) || !ok(e)) return "";
    if (e < eLN(c)) return grupoL(c);
    if (c < cNA(e)) return "NA";
    if (c >= 0.45 && c <= 1.7 && e <= eNS(c)) return "NA'";
    return c >= 1.5 ? "NG'" : "NS'";
  }

  // ---------- gráficos ----------
  function cores(opt) {
    return opt && opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", s: ["#1f5fbf", "#c0392b", "#27884a", "#8e44ad", "#d35400", "#555"], dest: "#c0392b" }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", s: ["#4f8cff", "#e0a13a", "#3fb67a", "#b07cf0", "#ff7a59", "#9aa3b2"], dest: "#ff5c5c" };
  }
  function passo(span, alvo) {
    var p = Math.pow(10, Math.floor(Math.log10(span / alvo))), m = span / alvo / p;
    return p * (m > 5 ? 10 : m > 2 ? 5 : m > 1 ? 2 : 1);
  }
  function painel(box, cfg, c) {
    var s = "", X = function (v) { return box.x + (v - cfg.x0) / (cfg.x1 - cfg.x0) * box.w; },
      Y = function (v) { return box.y + box.h - (v - cfg.y0) / (cfg.y1 - cfg.y0) * box.h; };
    var px = cfg.px || passo(cfg.x1 - cfg.x0, 8), py = cfg.py || passo(cfg.y1 - cfg.y0, 5);
    for (var gx = Math.ceil(cfg.x0 / px - 1e-9) * px; gx <= cfg.x1 + 1e-9; gx += px) {
      if (Math.abs(gx) < 1e-9) gx = 0;
      s += '<line x1="' + X(gx) + '" y1="' + box.y + '" x2="' + X(gx) + '" y2="' + (box.y + box.h) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      if (!cfg.semX) s += '<text x="' + X(gx) + '" y="' + (box.y + box.h + 14) + '" text-anchor="middle" fill="' + c.txt + '">' + fmt(gx, px < 1 ? (px < 0.1 ? 2 : 1) : 0) + "</text>";
    }
    (cfg.xticks || []).forEach(function (t) {
      if (t[0] >= cfg.x0 && t[0] <= cfg.x1) s += '<line x1="' + X(t[0]) + '" y1="' + box.y + '" x2="' + X(t[0]) + '" y2="' + (box.y + 4) + '" stroke="' + c.eixo + '"/>' +
        '<text x="' + X(t[0]) + '" y="' + (box.y - 3) + '" text-anchor="middle" fill="' + c.txt + '" font-size="9">' + t[1] + "</text>";
    });
    for (var gy = Math.ceil(cfg.y0 / py - 1e-9) * py; gy <= cfg.y1 + 1e-9; gy += py) {
      if (Math.abs(gy) < 1e-9) gy = 0;
      s += '<line x1="' + box.x + '" y1="' + Y(gy) + '" x2="' + (box.x + box.w) + '" y2="' + Y(gy) + '" stroke="' + c.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (box.x - 5) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(gy, cfg.casasY !== undefined ? cfg.casasY : (py < 1 ? (py < 0.1 ? 2 : 1) : 0)) + "</text>";
    }
    s += '<rect x="' + box.x + '" y="' + box.y + '" width="' + box.w + '" height="' + box.h + '" fill="none" stroke="' + c.eixo + '"/>';
    if (cfg.xlab) s += '<text x="' + (box.x + box.w / 2) + '" y="' + (box.y + box.h + 30) + '" text-anchor="middle" fill="' + c.txt + '">' + esc(cfg.xlab) + "</text>";
    if (cfg.ylab) s += '<text transform="translate(' + (box.x - 44) + " " + (box.y + box.h / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">' + esc(cfg.ylab) + "</text>";
    (cfg.vlin || []).forEach(function (v) {
      if (ok(v.x) && v.x >= cfg.x0 && v.x <= cfg.x1) s += '<line x1="' + X(v.x) + '" y1="' + box.y + '" x2="' + X(v.x) + '" y2="' + (box.y + box.h) + '" stroke="' + v.cor + '" stroke-dasharray="4 3"/>';
    });
    (cfg.hlin || []).forEach(function (v) {
      if (ok(v.y) && v.y >= cfg.y0 && v.y <= cfg.y1) s += '<line x1="' + box.x + '" y1="' + Y(v.y) + '" x2="' + (box.x + box.w) + '" y2="' + Y(v.y) + '" stroke="' + v.cor + '" stroke-dasharray="4 3"/>' +
        (v.rot ? '<text x="' + (box.x + box.w - 4) + '" y="' + (Y(v.y) - 4) + '" text-anchor="end" fill="' + v.cor + '">' + esc(v.rot) + "</text>" : "");
    });
    (cfg.series || []).forEach(function (se) {
      var pts = se.pts.filter(function (p) { return ok(p[0]) && ok(p[1]); });
      if (!pts.length) return;
      if (pts.length > 1 && se.linha !== false) s += '<path d="' + pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(Math.min(Math.max(p[1], cfg.y0), cfg.y1)).toFixed(1); }).join(" ") +
        '" fill="none" stroke="' + se.cor + '" stroke-width="' + (se.larg || 1.6) + '"' + (se.tr ? ' stroke-dasharray="' + se.tr + '"' : "") + "/>";
      if (se.mk !== false) pts.forEach(function (p) {
        if (p[1] >= cfg.y0 && p[1] <= cfg.y1) s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="' + (se.r || 3.2) + '" fill="' + se.cor + '"/>';
      });
    });
    (cfg.textos || []).forEach(function (t) {
      s += '<text x="' + X(t.x) + '" y="' + Y(t.y) + '" text-anchor="' + (t.a || "middle") + '" fill="' + (t.cor || c.txt) + '"' + (t.b ? ' font-weight="bold"' : "") + ">" + esc(t.t) + "</text>";
    });
    return s;
  }
  function legenda(itens, x, y, c, largura) {
    var s = "", xx = x, yy = y;
    itens.forEach(function (it) {
      var w = 30 + it.rot.length * 6;
      if (largura && xx + w > x + largura) { xx = x; yy += 15; }
      s += '<line x1="' + xx + '" y1="' + (yy - 4) + '" x2="' + (xx + 16) + '" y2="' + (yy - 4) + '" stroke="' + it.cor + '" stroke-width="' + (it.larg || 2) + '"' + (it.tr ? ' stroke-dasharray="' + it.tr + '"' : "") + "/>" +
        '<text x="' + (xx + 20) + '" y="' + yy + '" fill="' + c.txt + '">' + esc(it.rot) + "</text>";
      xx += w;
    });
    return s;
  }
  function svg(W, H) { return '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">'; }
  function faixa(vals, pad) {
    var v = vals.filter(ok);
    if (!v.length) return null;
    var a = Math.min.apply(null, v), b = Math.max.apply(null, v), p = Math.max((b - a) * pad, Math.abs(b) * 0.02, 0.05);
    return [a - p, b + p];
  }

  function gDeform(calc, d, opt) {
    var c = cores(opt), cps = calc.cps.filter(function (o) { return o.an.length; });
    if (!cps.length) return '<div class="fe-graf-vazio">As curvas de deformabilidade aparecem com as leituras do extensômetro.</div>';
    var W = opt.w || 560, H = opt.h || 330, m = { l: 58, r: 14, t: 18, b: 72 };
    var series = [], leg = [], yMax = 2;
    cps.forEach(function (o, k) {
      var cor = c.s[k % c.s.length];
      series.push({ pts: o.an.map(function (p) { return [10 * Math.log10(p.n), p.a]; }), cor: cor });
      leg.push({ rot: "hc = " + fmt(o.h, 1) + " %", cor: cor });
      o.an.forEach(function (p) { yMax = Math.max(yMax, p.a); });
    });
    var r = calc.resultados;
    if (r.curva10 && r.curva10.length) {
      series.push({ pts: r.curva10.map(function (p) { return [p.x, p.a]; }), cor: c.dest, tr: "6 4", larg: 2, r: 2.5 });
      leg.push({ rot: "Mini-MCV = 10 (interpolada)", cor: c.dest, tr: "6 4" });
      if (r.cSeg) series.push({ pts: r.cSeg, cor: c.dest, larg: 4, mk: false });
    }
    var ns = serieDe(d.params || {}).ns;
    var s = svg(W, H) + painel({ x: m.l, y: m.t, w: W - m.l - m.r, h: H - m.t - m.b }, {
      x0: 0, x1: 25, y0: -1, y1: Math.ceil(yMax + 1), px: 2, py: passo(yMax + 2, 6),
      xticks: ns.filter(function (n) { return [1, 3, 10, 30, 100, 250, 2, 4, 8, 16, 32, 64, 128, 256].indexOf(n) >= 0; }).map(function (n) { return [10 * Math.log10(n), n]; }),
      xlab: "10·log₁₀(n) — número de golpes n no topo", ylab: "Afundamento aₙ (mm)", series: series,
      hlin: [{ y: 2, cor: c.s[5], rot: "aₙ = 2 mm" }], vlin: [{ x: 10, cor: c.s[5] }] }, c);
    return s + legenda(leg, m.l, H - 24, c, W - m.l - m.r) + "</svg>";
  }
  function gCompact(calc, d, opt) {
    var c = cores(opt), S = serieDe(d.params || {}), r = calc.resultados;
    var curvas = S.curvas.map(function (n) {
      return { n: n, pts: calc.cps.map(function (o) { return [o.h, o.measN(n)]; }).filter(function (p) { return ok(p[0]) && ok(p[1]); }).sort(function (a, b) { return a[0] - b[0]; }) };
    }).filter(function (cv) { return cv.pts.length; });
    if (!curvas.length) return '<div class="fe-graf-vazio">As curvas de compactação aparecem com umidade, massa e leituras.</div>';
    var xs = [], ys = [];
    curvas.forEach(function (cv) { cv.pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    var fy = faixa(ys, 0.1), W = opt.w || 560, H = opt.h || 320, m = { l: 58, r: 14, t: 12, b: 70 };
    var series = [], leg = [];
    curvas.forEach(function (cv, k) {
      var ref = cv.n === S.ref, cor = ref ? c.s[0] : c.s[(k + 1) % c.s.length];
      series.push({ pts: cv.pts, cor: cor, larg: ref ? 2.4 : 1.2, tr: ref ? "" : "" });
      leg.push({ rot: cv.n + " golpes" + (ref ? " (referência)" : ""), cor: cor, larg: ref ? 3 : 1.5 });
    });
    if (r.dSeg) { series.push({ pts: r.dSeg, cor: c.dest, larg: 4, mk: false }); leg.push({ rot: "trecho de d'", cor: c.dest, larg: 4 }); }
    var s = svg(W, H) + painel({ x: m.l, y: m.t, w: W - m.l - m.r, h: H - m.t - m.b }, {
      x0: Math.floor(Math.min.apply(null, xs) - 0.5), x1: Math.ceil(Math.max.apply(null, xs) + 0.5), y0: Math.floor(fy[0] / 50) * 50, y1: Math.ceil(fy[1] / 50) * 50,
      xlab: "Teor de umidade de compactação hc (%)", ylab: "MEAS (kg/m³)", series: series }, c);
    return s + legenda(leg, m.l, H - 24, c, W - m.l - m.r) + "</svg>";
  }
  function gPi(calc, d, opt) {
    var c = cores(opt), r = calc.resultados;
    var cps = calc.cps.filter(function (o) { return ok(o.mcv); }).sort(function (a, b) { return a.mcv - b.mcv; });
    if (cps.length < 2) return '<div class="fe-graf-vazio">As curvas Pi e AF × Mini-MCV aparecem com o Mini-MCV de ao menos dois corpos de prova.</div>';
    var W = opt.w || 560, hp = 110, H = 3 * (hp + 14) + 50, m = { l: 62, r: 14, t: 10 };
    var mc = cps.map(function (o) { return o.mcv; }).concat([10, 15]);
    var x0 = Math.floor(Math.min.apply(null, mc) - 1), x1 = Math.ceil(Math.max.apply(null, mc) + 1);
    var s = svg(W, H), box = function (i) { return { x: m.l, y: m.t + i * (hp + 14), w: W - m.l - m.r, h: hp }; };
    var fP = faixa(cps.map(function (o) { return o.Pi; }).concat([r.PiL]), 0.15);
    if (fP) s += painel(box(0), { x0: x0, x1: x1, y0: Math.max(0, fP[0]), y1: fP[1], ylab: "Pi (%)", semX: true,
      series: [{ pts: cps.map(function (o) { return [o.mcv, o.Pi]; }), cor: c.s[0] }, { pts: ok(r.PiL) ? [[r.mcvPi, r.PiL]] : [], cor: c.dest, r: 5 }],
      vlin: [{ x: 10, cor: c.s[5] }, { x: 15, cor: c.s[5] }] }, c);
    var fA = faixa(cps.map(function (o) { return o.Af; }).concat([48, r.AF10]), 0.15);
    s += painel(box(1), { x0: x0, x1: x1, y0: fA[0], y1: fA[1], ylab: "AF (mm)", semX: true,
      series: [{ pts: cps.map(function (o) { return [o.mcv, o.Af]; }), cor: c.s[2] }, { pts: ok(r.AF10) ? [[10, r.AF10]] : [], cor: c.dest, r: 5 }],
      vlin: [{ x: 10, cor: c.s[5] }, { x: 15, cor: c.s[5] }], hlin: [{ y: 48, cor: c.s[1], rot: "48 mm" }] }, c);
    var byH = calc.cps.filter(function (o) { return ok(o.mcv) && ok(o.h); }).sort(function (a, b) { return a.mcv - b.mcv; });
    var fh = faixa(byH.map(function (o) { return o.h; }), 0.15);
    s += painel(box(2), { x0: x0, x1: x1, y0: fh[0], y1: fh[1], ylab: "hc (%)", xlab: "Mini-MCV",
      series: [{ pts: byH.map(function (o) { return [o.mcv, o.h]; }), cor: c.s[3] }], vlin: [{ x: 10, cor: c.s[5] }, { x: 15, cor: c.s[5] }] }, c);
    return s + "</svg>";
  }
  function gClass(calc, opt) {
    var c = cores(opt), r = calc.resultados, W = opt.w || 560, H = opt.h || 340, m = { l: 58, r: 14, t: 12, b: 44 };
    var L = { cor: c.eixo, larg: 2, mk: false };
    function linha(pts, tr) { return Object.assign({ pts: pts, tr: tr }, L); }
    var cfg = { x0: 0, x1: 2.5, y0: 0.5, y1: 2.2, px: 0.5, py: 0.1, casasY: 1, xlab: "Coeficiente c'", ylab: "Índice e'",
      series: [linha([[0.27, 2.2], [0.45, 1.75], [0.59, 1.4]]), linha([[0.59, 1.4], [0.7, 1.15]], "6 4"), linha([[0, 1.4], [0.59, 1.4]], "6 4"),
        linha([[0.45, 1.75], [1.7, 1.15]]), linha([[1.5, 0.5], [1.5, 2.2]]), linha([[0.7, 0.5], [0.7, 1.15]]), linha([[0.7, 1.15], [2.5, 1.15]], "6 4")],
      textos: [{ x: 0.2, y: 1.8, t: "NA", b: 1 }, { x: 0.95, y: 1.95, t: "NS'", b: 1 }, { x: 0.95, y: 1.35, t: "NA'", b: 1 }, { x: 2.0, y: 1.7, t: "NG'", b: 1 },
        { x: 0.35, y: 0.9, t: "LA", b: 1 }, { x: 1.1, y: 0.8, t: "LA'", b: 1 }, { x: 2.0, y: 0.8, t: "LG'", b: 1 }] };
    if (ok(r.c) && ok(r.e)) {
      cfg.series.push({ pts: [[Math.min(Math.max(r.c, 0), 2.5), Math.min(Math.max(r.e, 0.5), 2.2)]], cor: c.dest, r: 6 });
      cfg.textos.push({ x: Math.min(Math.max(r.c, 0), 2.3) + 0.05, y: Math.min(Math.max(r.e, 0.5), 2.1) + 0.05, t: (r.grupo || "") + " (" + fmt(r.c, 2) + "; " + fmt(r.e, 2) + ")", a: "start", cor: c.dest, b: 1 });
    }
    return svg(W, H) + painel({ x: m.l, y: m.t, w: W - m.l - m.r, h: H - m.t - m.b }, cfg, c) + "</svg>";
  }

  FE.FICHAS["dnit-258-2023-me"] = {
    titulo: "Solos — Mini-MCV e perda de massa por imersão (classificação MCT)",
    resumo: "Corpos de prova de 200 g compactados com energia crescente: curvas de deformabilidade, Mini-MCV, coeficientes c' e d', perda de massa por imersão Pi; com Pi', e' e grupo MCT pela DNIT 259/2023-CLA.",
    blocos: [],
    rotuloImportar: function (r) { return "c' " + fmt(r.c, 2) + " · e' " + fmt(r.e, 2) + " · " + (r.grupo || "—"); },
    params: [
      { k: "serie", r: "Série de golpes (3.6)", tipo: "select", recarrega: true,
        opcoes: [["simp", "Simplificada — 1, 3, 6, 10, 20 … 250"], ["pars", "Parsons — 1, 2, 3, 4, 6, 8 … 256"]],
        dica: "Parsons é recomendada para solos próximos do limite laterítico / não laterítico (NOTA 1)" },
      { k: "modoKa", r: "Altura do corpo de prova (seção 7 e 9.2)", tipo: "select",
        opcoes: [["ka", "A = Ka − L, com Ka = Ac + La (eq. 7 e 9)"], ["inv", "Extensômetro invertido: Ka = Ac − La, A = Ka + L (NOTA 4)"],
          ["direta", "Leitura inicial ajustável: A = leitura (NOTA 5 e 7)"]] },
      { k: "Ac", r: "Altura do cilindro padrão Ac (mm)", ph: "50,00", se: function (d) { return (d.params || {}).modoKa !== "direta"; } },
      { k: "La", r: "Leitura do extensômetro na aferição La (mm)", se: function (d) { return (d.params || {}).modoKa !== "direta"; } },
      { k: "Ka", r: "…ou constante de aferição Ka já calculada (mm)", se: function (d) { return (d.params || {}).modoKa !== "direta"; } },
      { k: "area", r: "Área da seção do molde (cm²)", ph: "19,635" },
      { k: "aneis", r: "Volume total dos anéis de vedação (cm³) — opcional", dica: "descontado do volume (NOTA 8)" },
      { k: "ret10", r: "Fração retida na peneira nº 10 (%)", dica: "não deve ultrapassar 5 % (6 c)" },
      { k: "ret200", r: "Porcentagem retida na peneira nº 200 (%)", dica: "para o relatório (10 a)" },
      { k: "cMan", r: "c' adotado por leitura gráfica — opcional", dica: "substitui o c' calculado" },
      { k: "dMan", r: "d' adotado por leitura gráfica (kg/m³/%) — opcional", dica: "substitui o d' calculado" },
      { k: "PiMan", r: "Pi' adotado (%) — opcional", dica: "substitui o Pi' interpolado (DNIT 259, 3.8)" },
      { k: "tol", r: "Proximidade da linha L/N para aplicar os critérios da DNIT 259, 5.1 c (Δe')", ph: "0,05" },
    ],
    padrao: { serie: "simp", modoKa: "ka", Ac: "50,00" },
    tabelas: function (d) {
      var S = serieDe(d.params || {}), pars = S === SERIES.pars;
      var lin = [{ grupo: "Teor de umidade de compactação (8.3 e 9.1)" },
        { k: "at", r: "Cápsula A — tara (A₁)", u: "g" }, { k: "au", r: "Cápsula A — solo úmido + cápsula (A₂)", u: "g" }, { k: "as", r: "Cápsula A — solo seco + cápsula (A₃)", u: "g" },
        { calc: "hA", r: "Umidade A — h = (mh − ms) × 100 / ms (eq. 8)", u: "%", casas: 2 },
        { k: "bt", r: "Cápsula B — tara (B₁)", u: "g" }, { k: "bu", r: "Cápsula B — solo úmido + cápsula (B₂)", u: "g" }, { k: "bs", r: "Cápsula B — solo seco + cápsula (B₃)", u: "g" },
        { calc: "hB", r: "Umidade B", u: "%", casas: 2 },
        { k: "hDir", r: "…ou teor de umidade já calculado", u: "%", ph: "—" },
        { calc: "h", r: "Teor de umidade de compactação (hc)", u: "%", casas: 2, destaque: true },
        { k: "Mh", r: "Massa de solo úmido no molde (8.1 c)", u: "g", ph: "200" },
        { calc: "Ms", r: "Massa de solo seco", u: "g", casas: 1 },
        { grupo: "Leituras do extensômetro após n golpes acumulados — série " + S.nome + " (8.1 h)" },
        { k: "l0", r: "Golpe zero (opcional)", u: "mm" }];
      S.ns.forEach(function (n) { lin.push({ k: "l" + n, r: "n = " + n, u: "mm" }); });
      lin.push({ grupo: "Afundamentos — " + (pars ? "aₙ = Aₙ − A₄ₙ (eq. 1)" : "aₙ = Aₙ − Af (eq. 2)") + "; alturas Aₙ = Ka − Lₙ (eq. 9)" });
      S.ns.forEach(function (n) { if (!pars || S.ns.indexOf(4 * n) >= 0) lin.push({ calc: "a" + n, r: "a" + n, u: "mm", casas: 2 }); });
      lin.push({ calc: "Af", r: "Altura final do CP (Af)", u: "mm", casas: 2 },
        { calc: "nF", r: "Número de golpes final", u: "", casas: 0 },
        { calc: "mcvC", r: "Mini-MCV = 10 log(Bn), aₙ = 2 mm (eq. 3)", u: "", casas: 1 },
        { k: "mcvMan", r: "Mini-MCV por leitura gráfica (opcional)", u: "", ph: "—" },
        { calc: "mcv", r: "Mini-MCV adotado", u: "", casas: 1, destaque: true },
        { grupo: "Perda de massa por imersão — 20 h com 10 mm extrudados (8.2 e 3.13)" },
        { k: "Lex", r: "Altura da parte extrudada (Lex)", u: "mm", ph: "10" },
        { k: "Fc", r: "Fator de correção Fc (1 normal · 0,5 monobloco coeso)", u: "", ph: "1" },
        { k: "tipo", r: "Tipo de desprendimento / observações", texto: true },
        { k: "cn", r: "Cápsula nº", texto: true },
        { k: "cs", r: "Solo seco desprendido + cápsula", u: "g" },
        { k: "ct", r: "Massa da cápsula", u: "g" },
        { calc: "Md", r: "Massa seca desprendida (Md)", u: "g", casas: 2 },
        { calc: "Pi", r: "Pi = 100 × Md × Lcp / (Ms × Lex) × Fc (eq. 6)", u: "%", casas: 1, destaque: true });
      return [{ chave: "cps", titulo: "Corpos de prova", rotulo: "CP", iniciais: 5, min: 2,
        dica: "uma coluna por teor de umidade (cinco porções, 6 f–j); compacte do mais úmido para o mais seco (8.1 c e i). Lcp de Pi = altura final Af.",
        linhas: lin }];
    },
    calcular: function (d) {
      var P = d.params || {}, S = serieDe(P), pars = S === SERIES.pars, avisos = [];
      var Ka = kaDe(P), area = ok(num(P.area)) ? num(P.area) : AREA_PADRAO, aneis = ok(num(P.aneis)) ? num(P.aneis) : 0;
      var semKa = false;
      var cps = (d.cps || []).map(function (p, i) {
        var rot = "CP " + (i + 1), o = { i: i };
        o.hA = umid(p.at, p.au, p.as); o.hB = umid(p.bt, p.bu, p.bs);
        o.h = ok(num(p.hDir)) ? num(p.hDir) : media([o.hA, o.hB]);
        var Mh = ok(num(p.Mh)) ? num(p.Mh) : 200;
        if (Math.abs(Mh - 200) > 0.5) avisos.push(rot + ": massa de " + fmt(Mh, 2) + " g — a norma usa 200 g (8.1 c; Tabela 1).");
        o.Ms = ok(o.h) ? Mh * 100 / (100 + o.h) : NaN;
        // alturas nas leituras
        var A = {}, nsLidos = [];
        S.ns.forEach(function (n) {
          var L = num(p["l" + n]);
          if (!ok(L)) return;
          var a = altura(P, Ka, L);
          if (!ok(a)) { semKa = true; return; }
          A[n] = a; nsLidos.push(n);
        });
        o.nF = nsLidos.length ? nsLidos[nsLidos.length - 1] : NaN;
        o.Af = nsLidos.length ? A[o.nF] : NaN;
        o.A = A;
        // afundamentos (eq. 1 ou 2)
        o.an = [];
        nsLidos.forEach(function (n) {
          var a = pars ? (ok(A[4 * n]) ? A[n] - A[4 * n] : NaN) : A[n] - o.Af;
          if (ok(a)) { o["a" + n] = a; o.an.push({ n: n, a: a }); }
        });
        // Mini-MCV: número de golpes Bn em que aₙ = 2 mm (interpolação linear em log n)
        o.mcvC = NaN;
        if (o.an.length) {
          if (o.an[0].a < 2) avisos.push(rot + ": afundamento já menor que 2 mm em n = " + o.an[0].n + " — Mini-MCV < " + fmt(10 * Math.log10(o.an[0].n), 1) + " (umidade alta demais para a série).");
          for (var k = 1; k < o.an.length; k++) {
            var a0 = o.an[k - 1], a1 = o.an[k];
            if (a0.a >= 2 && a1.a < 2) {
              var lg = Math.log10(a0.n) + (a0.a - 2) / (a0.a - a1.a) * (Math.log10(a1.n) - Math.log10(a0.n));
              o.mcvC = 10 * lg; break;
            }
          }
          if (!ok(o.mcvC) && o.an[0].a >= 2) avisos.push(rot + ": o afundamento não chegou a 2 mm — Mini-MCV não determinado (prossiga a compactação ou confira as leituras).");
        }
        o.mcv = ok(num(p.mcvMan)) ? num(p.mcvMan) : o.mcvC;
        // critério de término (8.1 h)
        if (nsLidos.length >= 2) {
          var fim = S.ns[S.ns.length - 1];
          var crit = pars ? o.an.length && o.an[o.an.length - 1].a < 2 && o.an[o.an.length - 1].n * 4 === o.nF
            : A[nsLidos[nsLidos.length - 2]] - o.Af < 0.1;
          if (!crit && o.nF < fim) avisos.push(rot + ": compactação encerrada em n = " + o.nF + " sem atingir o critério da série (" + (pars ? "A(n) − A(4n) < 2 mm" : "diferença entre leituras consecutivas < 0,1 mm") + ") — só é aceitável se houve intensa exsudação (8.1 h).");
        }
        // MEAS para n golpes (eq. 10), kg/m³; após o término, altura = Af
        o.measN = function (n) {
          var a = ok(A[n]) ? A[n] : (ok(o.nF) && n > o.nF ? o.Af : NaN);
          var V = area * a / 10 - aneis;
          return ok(o.Ms) && ok(a) && V > 0 ? o.Ms / V * 1000 : NaN;
        };
        // perda de massa por imersão (eq. 6)
        o.Md = num(p.cs) - num(p.ct);
        if (!ok(o.Md) || o.Md < 0) o.Md = NaN;
        var Lex = ok(num(p.Lex)) ? num(p.Lex) : 10, Fc = ok(num(p.Fc)) ? num(p.Fc) : 1;
        if (ok(num(p.Fc)) && Fc !== 1 && Fc !== 0.5) avisos.push(rot + ": fator de correção " + fmt(Fc, 2) + " — a norma prevê 1 (desprendimento normal) ou 0,5 (monobloco coeso).");
        o.Pi = ok(o.Md) && ok(o.Ms) && ok(o.Af) ? 100 * o.Md * o.Af / (o.Ms * Lex) * Fc : NaN;
        return o;
      });
      if (semKa) avisos.push("Informe La (e Ac) ou a constante Ka para calcular as alturas (seção 7).");
      var com = cps.filter(function (o) { return ok(o.mcv); });
      if (cps.length && cps.length < 5) avisos.push("A norma prevê cinco porções com teores de umidade crescentes (6 f–i); há " + cps.length + ".");
      var ret10 = num(P.ret10);
      if (ok(ret10) && ret10 > 5) avisos.push("Fração retida na peneira nº 10 de " + fmt(ret10, 1) + " %: não deve ultrapassar 5 % (6 c).");

      var res = { serie: S.nome };
      // ---- c': curva de deformabilidade com Mini-MCV = 10 (3.10; NOTA 3: interpolação) ----
      var ord = com.slice().sort(function (a, b) { return a.mcv - b.mcv; }), ci = null, cj = null, w = 0;
      for (var k = 0; k < ord.length; k++) if (Math.abs(ord[k].mcv - 10) < 0.05) { ci = cj = ord[k]; }
      if (!ci) for (k = 1; k < ord.length; k++) if (ord[k - 1].mcv < 10 && ord[k].mcv > 10) { ci = ord[k - 1]; cj = ord[k]; }
      if (!ci && ord.length >= 2) {
        ci = ord[0].mcv > 10 ? ord[0] : ord[ord.length - 2]; cj = ord[0].mcv > 10 ? ord[1] : ord[ord.length - 1];
        avisos.push("Nenhum par de corpos de prova tem Mini-MCV abaixo e acima de 10: a curva com Mini-MCV = 10 foi extrapolada — acrescente um ponto de umidade.");
      }
      if (ci) {
        w = ci === cj ? 0 : (10 - ci.mcv) / (cj.mcv - ci.mcv);
        var curva = [];
        S.ns.forEach(function (n) {
          var ai = ci["a" + n], aj = cj["a" + n];
          if (!pars) { if (!ok(ai) && ok(ci.nF) && n > ci.nF) ai = 0; if (!ok(aj) && ok(cj.nF) && n > cj.nF) aj = 0; }
          if (ok(ai) && ok(aj) && !(ai === 0 && aj === 0)) curva.push({ n: n, x: 10 * Math.log10(n), a: ai + w * (aj - ai) });
        });
        res.curva10 = curva;
        res.cPar = ci === cj ? "CP " + (ci.i + 1) : "CPs " + (ci.i + 1) + " e " + (cj.i + 1);
        var best = null;
        for (k = 1; k < curva.length; k++) {
          var sl = Math.abs((curva[k].a - curva[k - 1].a) / (curva[k].x - curva[k - 1].x));
          if (!best || sl > best.s) best = { s: sl, k: k };
        }
        if (best) { res.cCalc = best.s; res.cSeg = [[curva[best.k - 1].x, curva[best.k - 1].a], [curva[best.k].x, curva[best.k].a]]; }
      }
      res.c = ok(num(P.cMan)) ? num(P.cMan) : res.cCalc;
      // ---- d': ramo seco da curva de compactação de referência (3.12) ----
      var cref = cps.map(function (o) { return [o.h, o.measN(S.ref)]; }).filter(function (q) { return ok(q[0]) && ok(q[1]); }).sort(function (a, b) { return a[0] - b[0]; });
      if (cref.length >= 2) {
        var iMax = 0;
        cref.forEach(function (q, j) { if (q[1] > cref[iMax][1]) iMax = j; });
        var bd = null;
        for (k = 1; k <= iMax; k++) {
          var sd = (cref[k][1] - cref[k - 1][1]) / (cref[k][0] - cref[k - 1][0]);
          if (!bd || sd > bd.s) bd = { s: sd, k: k };
        }
        if (bd) { res.dCalc = bd.s; res.dSeg = [cref[bd.k - 1], cref[bd.k]]; }
        else avisos.push("A curva de compactação de " + S.ref + " golpes não tem ramo seco (o CP mais seco é o de maior MEAS): acrescente um ponto mais seco para obter d'.");
      }
      res.d = ok(num(P.dMan)) ? num(P.dMan) : res.dCalc;
      if (ok(res.d) && res.d <= 0) avisos.push("d' ≤ 0: o ramo seco da curva de referência não é crescente — confira os pontos.");
      // ---- Pi' (DNIT 259, 3.8) ----
      var af = linInterp(com.map(function (o) { return [o.mcv, o.Af]; }), 10, true);
      res.AF10 = af.v;
      if (af.ext && ok(af.v)) avisos.push("AF para Mini-MCV = 10 obtido por extrapolação.");
      res.baixa = ok(res.AF10) ? res.AF10 >= 48 : null;
      res.mcvPi = res.baixa === false ? 15 : 10;
      var pi = linInterp(com.map(function (o) { return [o.mcv, o.Pi]; }), res.mcvPi, true);
      res.PiCalc = pi.v;
      if (pi.ext && ok(pi.v)) avisos.push("Pi para Mini-MCV = " + res.mcvPi + " obtido por extrapolação.");
      res.PiL = ok(num(P.PiMan)) ? num(P.PiMan) : res.PiCalc;
      if (ok(res.PiL) && res.PiL < 0) res.PiL = 0;
      // ---- e' (DNIT 259, eq. 1) e grupo ----
      res.e = ok(res.PiL) && ok(res.d) && res.d > 0 ? Math.cbrt(res.PiL / 100 + 20 / res.d) : NaN;
      res.grupoGrafico = classificar(res.c, res.e);
      res.grupo = res.grupoGrafico;
      // critérios para pontos próximos da linha L/N (DNIT 259, 5.1 c)
      var p10 = linInterp(com.map(function (o) { return [o.mcv, o.Pi]; }), 10, false).v, p15 = linInterp(com.map(function (o) { return [o.mcv, o.Pi]; }), 15, false).v;
      res.piNeg = ok(p10) && ok(p15) ? p15 < p10 : null;
      var fitMH = com.length >= 3 ? FE.parabola(com.map(function (o) { return o.h; }), com.map(function (o) { return o.mcv; })) : null;
      res.concCima = fitMH ? fitMH.a > 0 : null;
      var tol = ok(num(P.tol)) ? num(P.tol) : 0.05;
      res.proximo = ok(res.c) && ok(res.e) ? Math.abs(res.e - eLN(res.c)) <= tol : false;
      if (res.proximo) {
        var crit = res.piNeg === true && res.concCima === true;
        if (res.grupo.charAt(0) === "N" && crit) {
          res.grupo = grupoL(res.c);
          res.obsClass = "Ponto próximo da linha L/N e atende aos dois critérios da DNIT 259 (5.1 c): considerado laterítico — " + res.grupo + " (no gráfico cai em " + res.grupoGrafico + ").";
        } else if (res.grupo.charAt(0) === "N") {
          res.obsClass = "Ponto próximo da linha L/N, mas não atende aos dois critérios da DNIT 259 (5.1 c) — mantido como não laterítico.";
        } else {
          res.obsClass = "Ponto próximo da linha L/N" + (crit ? " e atende aos critérios da DNIT 259 (5.1 c)." : " e NÃO atende aos dois critérios da DNIT 259 (5.1 c) — confirme a classificação (Parsons recomendada, NOTA 1 da DNIT 258).");
        }
        res.obsClass += " Pi × Mini-MCV entre 10 e 15: " + (res.piNeg === null ? "não determinada" : res.piNeg ? "inclinação negativa" : "inclinação não negativa") +
          "; Mini-MCV × hc: " + (res.concCima === null ? "não determinada" : res.concCima ? "concavidade para cima" : "concavidade para baixo") + ".";
      }
      if (ok(res.c) && !ok(res.e) && com.length) avisos.push("Para o índice e' faltam " + (!ok(res.d) ? "d'" : "Pi'") + " (DNIT 259, eq. 1).");
      res.cps = cps.map(function (o) { return { h: o.h, mcv: o.mcv, Af: o.Af, Pi: o.Pi }; });
      return { tab: { cps: cps }, cps: cps, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, u, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + " <small>" + u + '</small></div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(r.grupo ? esc(r.grupo) : "—", "", r.grupo ? esc(GRUPOS[r.grupo]) + " — classificação MCT (DNIT 259, Figura A1)" : "Classificação MCT (DNIT 259)") +
        cx(fmt(r.c, 2), "mm", "Coeficiente de argilosidade c' (3.10)" + (r.cPar ? " — curva Mini-MCV = 10 entre " + r.cPar : "")) +
        cx(fmt(r.d, 1), "kg/m³/%", "Coeficiente d' — curva de " + (r.serie === "Parsons" ? 12 : 10) + " golpes (3.12)") +
        cx(fmt(r.PiL, 0), "%", "Pi' — Pi com Mini-MCV = " + r.mcvPi + " (AF₁₀ = " + fmt(r.AF10, 1) + " mm, " + (r.baixa === null ? "—" : r.baixa ? "baixa densidade" : "alta densidade") + ")") +
        cx(fmt(r.e, 2), "", "Índice de laterização e' = ∛(Pi'/100 + 20/d')") + "</div>";
      h += '<table class="fe-resumo"><tr><th>CP</th><th>hc (%)</th><th>Mini-MCV</th><th>Af (mm)</th><th>Pi (%)</th></tr>' + calc.cps.map(function (o) {
        return "<tr><td>" + (o.i + 1) + "</td><td>" + fmt(o.h, 1) + "</td><td>" + fmt(o.mcv, 1) + "</td><td>" + fmt(o.Af, 2) + "</td><td>" + fmt(o.Pi, 1) + "</td></tr>";
      }).join("") + "</table>";
      if (r.obsClass) h += "<p>" + esc(r.obsClass) + "</p>";
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      return [gDeform(calc, d, opt), gCompact(calc, d, opt), gPi(calc, d, opt), gClass(calc, opt)];
    },
    relatorio: {
      notas: "Aₙ = Ka − Lₙ (eq. 9); aₙ = Aₙ − A₄ₙ (Parsons, eq. 1) ou Aₙ − Af (Simplificada, eq. 2); Mini-MCV = 10 log Bn, com Bn interpolado linearmente em log n onde aₙ = 2 mm (eq. 3). MEAS = Ms / V (eq. 10), V = área × Aₙ − anéis; após o fim da compactação usa-se Af. c': maior inclinação entre pontos consecutivos da curva de deformabilidade com Mini-MCV = 10, interpolada linearmente (ponto a ponto, mesmo n) entre os dois CPs com Mini-MCV imediatamente abaixo e acima de 10, no gráfico aₙ × 10 log n (3.10, NOTA 2 e 3). d': maior inclinação entre pontos consecutivos do ramo seco da curva de 10 golpes (Simplificada) ou 12 golpes (Parsons) (3.12). Pi = 100 × Md × Lcp / (Ms × Lex) × Fc (eq. 6), com Lcp = Af. DNIT 259: AF e Pi interpolados linearmente em Mini-MCV; Pi' = Pi com Mini-MCV = 10 se AF₁₀ ≥ 48 mm, senão com 15 (3.8); e' = ∛(Pi'/100 + 20/d') (eq. 1 — o índice da raiz está impresso como \"S\"; adotada a raiz cúbica da classificação MCT); grupo pelo gráfico da Figura A1 (à direita de c' = 1,5 e acima de e' = 1,15: NG').",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [["Série de golpes", r.serie]];
        if (P.ret200) rows.push(["Porcentagem retida na peneira nº 200", P.ret200 + " %"]);
        rows.push(["Mini-MCV por teor de umidade", calc.cps.map(function (o) { return fmt(o.h, 1) + " % → " + fmt(o.mcv, 1); }).join("; ")],
          ["Alturas finais dos CPs (Af)", calc.cps.map(function (o) { return fmt(o.Af, 2); }).join("; ") + " mm"],
          ["Perda de massa por imersão (Pi)", calc.cps.map(function (o) { return fmt(o.h, 1) + " % → " + fmt(o.Pi, 1) + " %"; }).join("; ")],
          ["Coeficiente c'", fmt(r.c, 2) + " mm" + (ok(num(P.cMan)) ? " (leitura gráfica)" : "")],
          ["Coeficiente d'", fmt(r.d, 1) + " kg/m³/%" + (ok(num(P.dMan)) ? " (leitura gráfica)" : "")],
          ["Pi' (DNIT 259)", fmt(r.PiL, 0) + " % — Mini-MCV = " + r.mcvPi + "; AF₁₀ = " + fmt(r.AF10, 1) + " mm"],
          ["Índice de laterização e'", fmt(r.e, 2)],
          ["Classificação MCT (DNIT 259/2023-CLA)", r.grupo ? r.grupo + " — " + GRUPOS[r.grupo] : "—"]);
        if (r.obsClass) rows.push(["Observação da classificação", r.obsClass]);
        return rows;
      },
      extraHtml: function (calc, d) {
        var S = serieDe(d.params || {}), cps = calc.cps;
        if (!cps.length) return "";
        var ns = S.ns.filter(function (n) { return cps.some(function (o) { return ok(o.A[n]); }); });
        return '<h2>Alturas (mm) e MEAS (kg/m³) por número de golpes</h2><table class="gr"><thead><tr><th>n</th>' + cps.map(function (o) {
          return "<th>CP " + (o.i + 1) + " — A</th><th>MEAS</th>";
        }).join("") + "</tr></thead>" + ns.map(function (n) {
          return "<tr><td>" + n + "</td>" + cps.map(function (o) { return "<td>" + (ok(o.A[n]) ? fmt(o.A[n], 2) : "") + "</td><td>" + (ok(o.A[n]) ? fmt(o.measN(n), 0) : "") + "</td>"; }).join("") + "</tr>";
        }).join("") + "</table>";
      },
    },
    exemplos: [],
  };

  // ---------- exemplos ----------
  // Figura A8 da norma (série Simplificada, Ka = 82,26 mm); a planilha não registra o golpe 1 nem o tipo de desprendimento além de "Normal"
  function exNorma() {
    var ns = [3, 6, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 180];
    var L = [
      ["25,95", "29,78", "31,48", "31,70", "31,88", "31,94"],
      ["24,68", "28,33", "30,99", "33,25", "33,40", "33,65", "33,72"],
      ["23,93", "27,53", "30,30", "32,94", "33,84", "34,62", "34,98", "35,00", "35,03"],
      ["18,59", "22,10", "24,58", "28,13", "29,63", "30,53", "31,33", "31,60", "31,68", "31,75", "31,80"],
      ["12,33", "15,68", "18,18", "21,33", "23,37", "24,60", "26,10", "27,00", "27,80", "28,07", "28,15", "28,22", "28,27"]];
    var h = ["19,90", "17,90", "15,80", "13,70", "11,60"];
    var im = [["38", "101,77", "54,19"], ["156", "81,44", "50,94"], ["136", "65,89", "51,08"], ["85", "85,19", "53,44"], ["114", "93,21", "55,86"]];
    return { ident: { registro: "EX-MCV-001", camada: "Solo fino tropical (exemplo da norma)", origem: "Figura A8" },
      params: { serie: "simp", modoKa: "ka", Ka: "82,26", area: "19,635" },
      cps: h.map(function (hh, i) {
        var o = { hDir: hh, Mh: "200", Lex: "10", Fc: "1", tipo: "Normal", cn: im[i][0], cs: im[i][1], ct: im[i][2] };
        L[i].forEach(function (v, k) { o["l" + ns[k]] = v; });
        return o;
      }),
      obs: "Planilha da Figura A8 da DNIT 258/2023-ME. Mini-MCV da figura (lidos no gráfico): 7,8; 10,5; 13,1; 15,0; 18,0." };
  }
  // exemplos gerados: aₙ decresce linearmente em log n até o fim da compactação (inclinação s em mm por década, com
  // pé suavizado); dados por CP [hc, Mini-MCV alvo, s, Af, Pi alvo]
  function gerar(serie, Ka, cps, fc) {
    var S = SERIES[serie], pars = serie === "pars";
    return cps.map(function (c, i) {
      var h = c[0], mcv = c[1], s = c[2], Af = c[3], PiA = c[4];
      var Bn = Math.pow(10, mcv / 10);
      // simplificada: Aₙ − Af = s·(log N* − log n)  -> 2 = s·log(N*/Bn); Parsons: Aₙ − A₄ₙ = 2 em Bn
      var Nst = pars ? Bn * 4 * Math.pow(10, (2 - s * Math.log10(4)) / s) : Bn * Math.pow(10, 2 / s);
      function Aof(n) { var t = Math.log10(Nst) - Math.log10(n); return Af + s * 0.08 * Math.log(1 + Math.exp(t / 0.08)); }
      var o = { hDir: String(h).replace(".", ","), Mh: "200", Lex: "10", Fc: fc && fc[i] ? fc[i] : "1", tipo: fc && fc[i] === "0,5" ? "Monobloco coeso" : "Normal", cn: String(60 + i) };
      var ultimo = S.ns[S.ns.length - 1];
      if (pars) {   // termina em 4n quando A(n) − A(4n) < 2 mm (8.1 h i)
        for (var k = 0; k < S.ns.length; k++) if (S.ns.indexOf(4 * S.ns[k]) >= 0 && Aof(S.ns[k]) - Aof(4 * S.ns[k]) < 2) { ultimo = 4 * S.ns[k]; break; }
      } else {      // termina quando duas leituras consecutivas diferem menos de 0,1 mm (8.1 h ii)
        for (k = 1; k < S.ns.length; k++) if (Aof(S.ns[k - 1]) - Aof(S.ns[k]) < 0.1) { ultimo = S.ns[k]; break; }
      }
      S.ns.forEach(function (n) { if (n <= ultimo) o["l" + n] = (Ka - Aof(n)).toFixed(2).replace(".", ","); });
      var Ms = 200 / (1 + h / 100), Md = PiA / 100 * Ms * 10 / Af / (fc && fc[i] === "0,5" ? 0.5 : 1);
      var tara = 50 + i * 1.37;
      o.ct = tara.toFixed(2).replace(".", ","); o.cs = (tara + Md).toFixed(2).replace(".", ",");
      return o;
    });
  }
  FE.FICHAS["dnit-258-2023-me"].exemplos = [
    { nome: "Exemplo da norma — planilha da Figura A8 (série Simplificada)", dados: exNorma },
    { nome: "Argila laterítica — série de Parsons (gerado)", dados: function () {
      return { ident: { registro: "EX-MCV-002", obra: "Obra A", camada: "Subleito — argila vermelha", origem: "Jazida 3", data: "2026-04-02" },
        params: { serie: "pars", modoKa: "ka", Ac: "50,00", La: "31,20", ret10: "0,8", ret200: "72" },
        cps: gerar("pars", 81.2, [[30.5, 6.5, 19, 46.9, 18], [28.2, 9.0, 19, 45.8, 9], [25.9, 11.6, 19, 45.4, 4], [23.6, 14.4, 19, 46.3, 2], [21.3, 17.4, 19, 48.0, 1]]) };
    } },
    { nome: "Silte não laterítico — Pi alto, avisos de término da compactação e peneira nº 10 (gerado)", dados: function () {
      return { ident: { registro: "EX-MCV-003", obra: "Obra B", camada: "Corte — silte de alteração", origem: "Jazida 4" },
        params: { serie: "simp", modoKa: "ka", Ac: "50,00", La: "30,00", ret10: "6,5", ret200: "58" },
        cps: gerar("simp", 80.0, [[26.0, 7.0, 10, 52.5, 380], [23.5, 9.5, 10, 51.4, 330], [21.0, 12.0, 10, 50.8, 290], [18.5, 14.8, 10, 51.2, 240], [16.0, 17.6, 10, 52.6, 190]]) };
    } },
  ];
})();
