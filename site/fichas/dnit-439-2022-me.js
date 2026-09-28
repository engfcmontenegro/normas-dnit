/*
 * Ficha: DNIT 439/2022-ME — Ligante asfáltico — Resistência à fadiga por varredura de amplitude linear (LAS).
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 * Usa FE.reologiaGrafico, definido em site/fichas/dnit-423-2020-me.js (carregado antes no index.html).
 *
 * Entradas: varredura de frequência (12 frequências a 0,1 % de deformação, 6.2) e varredura de amplitude
 * (0,1 % a 30 % a 10 Hz, registro a cada 10 ciclos, 6.3). A varredura de amplitude tem centenas de pontos:
 * é colada como texto (colunas do software do reômetro ou do Excel), em vez de uma coluna por ponto.
 * Contas (seção 7): α = 1/m (eq. 1–3); C = |G*|/|G*|inicial (eq. 4, ponto 2 = inicial); ΔD e D (eq. 5–7);
 * ruptura na máxima pseudoenergia W^R = 0,5·C·(γ^R)² (eq. 10–11); ajuste log(1 − C) × log D com D ≥ 10 até a
 * ruptura (eq. 8–9); Df (eq. 12); A, k, B (eq. 13–15); Nf = A·γ^B (eq. 16); FFL (eq. 17).
 * k = 1 + (1 − C2)·α — a eq. 14 impressa traz "(1 + C2)", mas o próprio exemplo do Anexo B (k = 2,1246) e a
 * AASHTO T 391 usam (1 − C2); ver o relatório final.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, fmtSig = FE.fmtSig, esc = FE.esc;
  var graf = function (o) { return FE.reologiaGrafico ? FE.reologiaGrafico(o) : '<div class="fe-graf-vazio">Gráfico indisponível.</div>'; };

  var FREQ_62 = [0.2, 0.4, 0.6, 0.8, 1.0, 2.0, 4.0, 6.0, 8.0, 10, 20, 30];  // 6.2
  var UNID = { Pa: 1, kPa: 1e3, MPa: 1e6 };
  var FORMATOS = {
    tgG: { n: 3, rot: "t (s) · γ (%) · |G*|", t: 0, g: 1, G: 2 },
    tgGd: { n: 4, rot: "t (s) · γ (%) · |G*| · δ (°)", t: 0, g: 1, G: 2 },
    B2: { n: 6, rot: "ponto · |G*| · tensão · γ (%) · t (s) · δ (°) — como a Tabela B2", t: 4, g: 3, G: 1 },
  };
  var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  // notação científica com n algarismos significativos: 4,454 × 10⁶
  function cien(x, sig) {
    if (!ok(x)) return "—";
    if (x === 0) return "0";
    var e = Math.floor(Math.log10(Math.abs(x)) + 1e-12), m = x / Math.pow(10, e);
    var ms = fmt(Number(m.toFixed(sig - 1)), sig - 1);
    if (ms.replace("-", "").indexOf("10") === 0) { e += 1; ms = fmt(Number((x / Math.pow(10, e)).toFixed(sig - 1)), sig - 1); }
    if (e === 0) return ms;
    return ms + " × 10" + String(e).split("").map(function (c) { return SUP[c]; }).join("");
  }
  function sig4(x) { return ok(x) ? fmtSig(x, 4) : "—"; }

  // regressão linear y = a·x + b
  function reta(xs, ys) {
    var n = xs.length;
    if (n < 2) return null;
    var sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
    for (var i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; syy += ys[i] * ys[i]; }
    var den = n * sxx - sx * sx;
    if (!den) return null;
    var a = (n * sxy - sx * sy) / den, b = (sy - a * sx) / n;
    var st = syy - sy * sy / n, se = 0;
    for (var j = 0; j < n; j++) se += Math.pow(ys[j] - (a * xs[j] + b), 2);
    return { a: a, b: b, r2: st > 0 ? 1 - se / st : NaN, n: n };
  }

  // texto colado -> pontos {t, g, G (Pa)}
  function lerAmplitude(texto, formato, fator) {
    var F = FORMATOS[formato] || FORMATOS.tgG;
    var tokens = String(texto || "").split(/[\s;|]+/).filter(Boolean);
    var nums = [], ignorados = 0;
    tokens.forEach(function (tk) { var v = num(tk); if (ok(v)) nums.push(v); else ignorados++; });
    var pts = [];
    for (var i = 0; i + F.n <= nums.length; i += F.n) {
      pts.push({ t: nums[i + F.t], g: nums[i + F.g], G: nums[i + F.G] * fator });
    }
    return { pts: pts, sobra: nums.length % F.n, ignorados: ignorados };
  }

  // cálculo completo (seção 7)
  function las(d) {
    var P = d.params || {}, avisos = [], fator = UNID[P.uG] || 1;
    var Ff = 10;  // frequência da varredura de amplitude e da eq. 13 (Hz)
    // 7.1 — parâmetro α
    var fs = (d.freq || []).map(function (p, i) {
      var f = num(p.f); if (!ok(f)) f = FREQ_62[i];
      var G = num(p.G) * fator, dl = num(p.d);
      if (!ok(G) || !ok(dl) || !ok(f) || f <= 0 || G <= 0) return { w: ok(f) ? 2 * Math.PI * f : NaN, f: f };
      var w = 2 * Math.PI * f, Gp = G * Math.cos(dl * Math.PI / 180);   // eq. 1 (ω = 2πF)
      return { f: f, w: w, G: G, Gp: Gp / fator, GpPa: Gp, logw: Math.log10(w), logGp: Gp > 0 ? Math.log10(Gp) : NaN };
    });
    var val = fs.filter(function (o) { return ok(o.logGp); });
    var fit = reta(val.map(function (o) { return o.logw; }), val.map(function (o) { return o.logGp; }));  // eq. 2
    var alfa = fit && fit.a > 0 ? 1 / fit.a : NaN;                                                          // eq. 3
    if (val.length && val.length < 12) avisos.push("Varredura de frequência com " + val.length + " frequência(s); a norma usa 12 (6.2).");
    // |G*| a 10 Hz (seção 5): medido ou interpolado em log-log
    var G10 = NaN;
    var ord = val.slice().sort(function (a, b) { return a.f - b.f; });
    for (var i = 0; i < ord.length; i++) {
      if (Math.abs(ord[i].f - 10) < 1e-9) { G10 = ord[i].G; break; }
      if (i && ord[i - 1].f < 10 && ord[i].f > 10) {
        var u = (Math.log10(10) - Math.log10(ord[i - 1].f)) / (Math.log10(ord[i].f) - Math.log10(ord[i - 1].f));
        G10 = Math.pow(10, Math.log10(ord[i - 1].G) + u * (Math.log10(ord[i].G) - Math.log10(ord[i - 1].G)));
      }
    }
    var T = num(P.temp);
    if (ok(G10)) {
      var M = G10 / 1e6;
      if (ok(T) && Math.abs(T - 19) > 0.05) {
        if (M < 15 || M > 25) avisos.push("Ensaio a " + fmt(T, 1) + " °C com |G*| (10 Hz) = " + fmt(M, 1) + " MPa: a temperatura alternativa deve levar |G*| ao intervalo de 15 MPa a 25 MPa (NOTA 1).");
      } else if (M < 10 || M > 70) {
        avisos.push("|G*| a 10 Hz e 19 °C = " + fmt(M, 1) + " MPa, fora do intervalo preferencial de 10 MPa a 70 MPa (seção 5): altere a temperatura do ensaio para que |G*| fique entre 15 MPa e 25 MPa (NOTA 1) — risco de instabilidade de fluxo ou perda de adesão às placas.");
      }
    }
    if (ok(T) && Math.abs(T - 19) > 0.05 && !ok(num(P.G19))) avisos.push("Ensaio em temperatura diferente de 19 °C: informe o |G*| do ligante a 19 °C para o relatório (8 d).");

    // 7.2 — varredura de amplitude
    var lido = lerAmplitude(P.amp, P.formato || "tgG", fator);
    var pts = lido.pts;
    if (lido.ignorados) avisos.push("Varredura de amplitude: " + lido.ignorados + " texto(s) não numérico(s) ignorado(s) (cabeçalho?).");
    if (lido.sobra) avisos.push("Varredura de amplitude: sobraram " + lido.sobra + " número(s) que não completam uma linha de " + (FORMATOS[P.formato] || FORMATOS.tgG).n + " colunas — confira o formato escolhido.");
    var res = { alfa: alfa, fit: fit, G10: G10, fs: fs, pts: pts, n: pts.length, T: T };
    if (pts.length < 3) {
      if (String(P.amp || "").trim()) avisos.push("Varredura de amplitude com menos de 3 pontos.");
      return { res: res, avisos: avisos };
    }
    for (var k = 1; k < pts.length; k++) {
      if (!(pts[k].t > pts[k - 1].t)) { avisos.push("Varredura de amplitude: o tempo não cresce do ponto " + k + " para o " + (k + 1) + " — confira a ordem das colunas."); break; }
    }
    var G0 = pts[1].G;  // NOTA 3: o segundo ponto é o inicial
    res.G0 = G0;
    var a = alfa;
    pts.forEach(function (p, i) {
      p.i = i + 1;
      p.C = p.G / G0;                                            // eq. 4
      p.gR = p.g / 100 * G0;                                      // eq. 10
    });
    pts[1].C = 1; pts[1].D = 0;                                   // NOTA 4
    for (var j = 2; j < pts.length; j++) {
      var p = pts[j], q = pts[j - 1];
      if (!ok(a)) { p.D = NaN; continue; }
      var dC = q.C - p.C, dt = p.t - q.t;
      var dD = dC > 0 && dt > 0 ? Math.pow(Math.PI * p.g * p.g * dC, a / (1 + a)) * Math.pow(dt, 1 / (1 + a)) : 0;  // eq. 5
      p.dD = dD;
      p.D = p.C < q.C ? q.D + dD : q.D;                             // eq. 6 e 7
    }
    pts.forEach(function (p, i) { p.W = i >= 1 ? 0.5 * p.C * p.gR * p.gR : NaN; });   // eq. 11
    // 7.3 — ruptura: máxima pseudoenergia
    var f = 1;
    for (var m = 2; m < pts.length; m++) if (pts[m].W > pts[f].W) f = m;
    res.f = f; res.pf = pts[f]; res.Wmax = pts[f].W; res.Cf = pts[f].C;
    if (f === pts.length - 1) avisos.push("A pseudoenergia W^R ainda cresce no último ponto: a ruptura (máximo de W^R, 7.3) não foi atingida — confira se a varredura foi até 30 % ou cole os pontos seguintes.");
    var gMax = Math.max.apply(null, pts.map(function (p) { return p.g; }));
    if (gMax < 29.5 && f === pts.length - 1) avisos.push("A varredura colada termina em γ = " + fmt(gMax, 2) + " %; a norma vai de 0,1 % a 30 % (6.3).");
    // ajuste da curva característica de dano (eq. 8 e 9): até a ruptura, D ≥ 10
    var usados = pts.slice(2, f + 1).filter(function (p) { return ok(p.D) && p.D >= 10 && p.C < 1; });
    usados.forEach(function (p) { p.usado = true; });
    var fitC = reta(usados.map(function (p) { return Math.log10(p.D); }), usados.map(function (p) { return Math.log10(1 - p.C); }));
    res.nAjuste = usados.length; res.fitC = fitC;
    if (ok(a) && usados.length < 3) avisos.push("Poucos pontos com D ≥ 10 até a ruptura (" + usados.length + ") para ajustar a curva característica de dano (7.2).");
    if (!fitC) return { res: res, avisos: avisos };
    var C1 = Math.pow(10, fitC.b), C2 = fitC.a;
    res.C1 = C1; res.C2 = C2;
    // 7.4 — curva de fadiga
    var Df = Math.pow((1 - res.Cf) / C1, 1 / C2);                                  // eq. 12
    var kk = 1 + (1 - C2) * a;                                                      // eq. 14 (ver nota)
    var A = Ff * Math.pow(Df, kk) / (kk * Math.pow(Math.PI * C1 * C2, a));          // eq. 13
    var B = -2 * a;                                                                 // eq. 15
    res.Df = Df; res.k = kk; res.A = A; res.B = B;
    var nf = function (g) { return A * Math.pow(g, B); };                           // eq. 16
    res.Nf125 = nf(1.25); res.Nf25 = nf(2.5);
    res.FFL = Math.log10(res.Nf125 * res.Nf25) / 2 * Math.log10(0.025 / 0.0125);    // eq. 17
    res.nfDef = String(P.deformacoes || "").split(/[;\s]+/).map(num).filter(function (g) { return ok(g) && g > 0; })
      .map(function (g) { return [g, nf(g)]; });
    res.ciclo = ok(res.pf.t) ? Math.round(res.pf.t * Ff) : NaN;
    var fflMin = num(P.fflMin);
    if (ok(fflMin) && ok(res.FFL)) {
      res.fflOk = Number(res.FFL.toFixed(4)) >= fflMin;
      if (!res.fflOk) avisos.unshift("FFL = " + fmt(res.FFL, 4) + ", abaixo do mínimo do projeto (" + fmt(fflMin, 2) + ").");
    }
    return { res: res, avisos: avisos };
  }

  FE.FICHAS["dnit-439-2022-me"] = {
    titulo: "LAS — fadiga de ligantes por varredura de amplitude linear",
    resumo: "DSR a 19 °C, placas de 8 mm e gap de 2 mm, ligante envelhecido no RTFOT: varredura de frequência (α) e varredura de amplitude de 0,1 % a 30 % a 10 Hz; dano contínuo viscoelástico simplificado (S-VECD) → curva característica de dano (C1, C2), ruptura na máxima pseudoenergia, curva de fadiga Nf = A·γ^B e fator de fadiga do ligante (FFL).",
    blocos: [],
    params: [
      { k: "material", r: "Ligante asfáltico", ph: "ex.: CAP 50/70 — resíduo RTFOT" },
      { k: "condicao", r: "Condição da amostra", tipo: "select",
        opcoes: [["rtfot", "Envelhecido no RTFOT (ABNT NBR 15235) — 6.1"], ["outra", "Outra (registrar nas observações)"]] },
      { k: "temp", r: "Temperatura do ensaio (°C)", ph: "19,0", dica: "19 °C; outra só se |G*| a 10 Hz sair de 10–70 MPa (seção 5, NOTA 1)" },
      { k: "G19", r: "|G*| a 19 °C (MPa) — se ensaiado em outra temperatura", se: function (d) { var t = num((d.params || {}).temp); return ok(t) && Math.abs(t - 19) > 0.05; } },
      { k: "uG", r: "Unidade de |G*| nas duas varreduras", tipo: "select", opcoes: [["Pa", "Pa"], ["kPa", "kPa"], ["MPa", "MPa"]] },
      { k: "formato", r: "Colunas da varredura de amplitude colada", tipo: "select",
        opcoes: Object.keys(FORMATOS).map(function (k) { return [k, FORMATOS[k].rot]; }) },
      { k: "amp", r: "Varredura de amplitude — cole os pontos (6.3; um ponto a cada 10 ciclos)", ph: "cole aqui as colunas copiadas do software do reômetro ou do Excel",
        dica: "números separados por espaço, tabulação ou ponto e vírgula, na ordem das colunas escolhidas; decimal com vírgula ou ponto; o 2º ponto é o inicial (NOTA 3)" },
      { k: "deformacoes", r: "Deformações para calcular Nf (%)", ph: "2,5; 5,0", dica: "separadas por ponto e vírgula; o FFL já usa 1,25 % e 2,5 % (7.5)" },
      { k: "fflMin", r: "FFL mínimo do projeto — opcional", dica: "a norma e as especificações do acervo não fixam limite; a DNIT 385-ES remete ao projeto" },
    ],
    padrao: { condicao: "rtfot", temp: "19,0", uG: "Pa", formato: "tgG", deformacoes: "2,5; 5,0" },
    tabelas: function (d) {
      if (Array.isArray(d.freq)) { while (d.freq.length < 12) d.freq.push({}); if (d.freq.length > 12) d.freq.length = 12; }
      var u = (d.params || {}).uG || "Pa", c = u === "Pa" ? 0 : u === "kPa" ? 1 : 3;
      return [{
        chave: "freq", titulo: "Varredura de frequência — deformação de 0,1 % (6.2)", rotulo: "Frequência", iniciais: 12, min: 12, fixo: true,
        dica: "frequência em branco = a da lista da norma (0,2; 0,4; 0,6; 0,8; 1; 2; 4; 6; 8; 10; 20; 30 Hz)",
        linhas: [
          { k: "f", r: "Frequência F (6.2)", u: "Hz", ph: "" },
          { k: "G", r: "|G*| — módulo dinâmico de cisalhamento", u: u },
          { k: "d", r: "δ — ângulo de fase", u: "°" },
          { calc: "w", r: "ω = 2π F", u: "rad/s", casas: 3 },
          { calc: "Gp", r: "G' = |G*| × cos δ (eq. 1)", u: u, casas: c },
          { calc: "logw", r: "log ω", u: "", casas: 3 },
          { calc: "logGp", r: "log G' (G' em Pa) — ajuste da eq. 2", u: "", casas: 3, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, x = las(d), r = x.res, avisos = x.avisos;
      if (P.condicao === "outra") avisos.push("O ligante deve ser previamente envelhecido no RTFOT (6.1).");
      return { tab: { freq: r.fs.map(function (o) { return { w: o.w, Gp: o.Gp, logw: o.logw, logGp: o.logGp }; }) },
        resultados: { alfa: r.alfa, m: r.fit ? r.fit.a : NaN, r2: r.fit ? r.fit.r2 : NaN, G10: r.G10, G0: r.G0, n: r.n, C1: r.C1, C2: r.C2,
          nAjuste: r.nAjuste, r2C: r.fitC ? r.fitC.r2 : NaN, ponto: r.pf ? r.pf.i : NaN, tf: r.pf ? r.pf.t : NaN, gf: r.pf ? r.pf.g : NaN, ciclo: r.ciclo,
          Wmax: r.Wmax, Cf: r.Cf, Df: r.Df, k: r.k, A: r.A, B: r.B, Nf125: r.Nf125, Nf25: r.Nf25, FFL: r.FFL, nfDef: r.nfDef || [], T: r.T,
          fflMin: num(P.fflMin), fflOk: r.fflOk === undefined ? null : r.fflOk },
        _pts: r.pts, _fs: r.fs, _fit: r.fit, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(ok(r.FFL) ? fmt(r.FFL, 4) : "—", "FFL — fator de fadiga do ligante (eq. 17)" + (r.fflOk === null ? "" : r.fflOk ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>')) +
        cx(ok(r.A) ? cien(r.A, 4) + " · γ<sup>" + fmt(r.B, 3) + "</sup>" : "—", "Curva de fadiga Nf = A · γ^B (eq. 13 a 16)") +
        cx(ok(r.alfa) ? fmt(r.alfa, 4) : "—", "α = 1/m (eq. 3)" + (ok(r.m) ? " · m = " + fmt(r.m, 4) + " · R² = " + fmt(r.r2, 4) : ""), true) +
        cx(ok(r.C1) ? sig4(r.C1) + " / " + sig4(r.C2) : "—", "C1 / C2 — curva característica de dano (eq. 9; " + (r.nAjuste || 0) + " pontos com D ≥ 10)", true) +
        cx(ok(r.ponto) ? "ponto " + r.ponto : "—", "Ruptura — máxima pseudoenergia (7.3)" + (ok(r.tf) ? ": t = " + fmt(r.tf, 1) + " s, ciclo " + r.ciclo + ", γ = " + fmt(r.gf, 2) + " %" : ""), true) +
        cx(ok(r.Cf) ? sig4(r.Cf) : "—", "Cf — integridade na ruptura" + (ok(r.Wmax) ? " · W^R máx = " + cien(r.Wmax, 4) + " Pa²" : "") + (ok(r.Df) ? " · Df = " + fmt(r.Df, 1) : ""), true) +
        cx(ok(r.Nf125) ? cien(r.Nf125, 4) + " / " + cien(r.Nf25, 4) : "—", "Nf a 1,25 % / 2,5 % (ciclos)", true);
      if (r.nfDef.length) h += cx(r.nfDef.map(function (x) { return cien(x[1], 4); }).join(" / "), "Nf a " + r.nfDef.map(function (x) { return fmt(x[0], 2) + " %"; }).join(" / ") + " (eq. 16)", true);
      if (ok(r.G10)) h += cx(fmt(r.G10 / 1e6, 1) + " MPa", "|G*| a 10 Hz na varredura de frequência (seção 5: 10 a 70 MPa)", true);
      return h + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var r = calc.resultados, pts = calc._pts || [], fs = (calc._fs || []).filter(function (o) { return ok(o.GpPa); }), W = opt.w || 560, H = opt.h || 300;
      var out = [];
      // 1 — ajuste log G' × log ω
      var fitL = [];
      if (calc._fit && fs.length) {
        var ws = fs.map(function (o) { return o.w; }), w0 = Math.min.apply(null, ws), w1 = Math.max.apply(null, ws);
        fitL = [[w0, Math.pow(10, calc._fit.a * Math.log10(w0) + calc._fit.b)], [w1, Math.pow(10, calc._fit.a * Math.log10(w1) + calc._fit.b)]];
      }
      out.push(graf({ w: W, h: H, imprimir: opt.imprimir, xlog: true, ylog: true, xlabel: "Frequência angular ω (rad/s)", ylabel: "G' (Pa)", legEsq: true,
        series: [{ nome: "G' medido", pts: fs.map(function (o) { return [o.w, o.GpPa]; }), cor: 0, ponto: true },
          { nome: ok(r.m) ? "ajuste: log G' = " + fmt(r.m, 4) + " log ω + n → α = " + fmt(r.alfa, 4) : "", pts: fitL, cor: 1, linha: true }],
        vazio: "O gráfico da varredura de frequência aparece com |G*| e δ preenchidos." }));
      // 2 — curva característica de dano C × D
      var cd = pts.filter(function (p) { return ok(p.D) && ok(p.C); });
      var curva = [];
      if (ok(r.C1) && ok(r.Df)) for (var k = 0; k <= 60; k++) { var D = r.Df * 1.05 * k / 60; curva.push([D, 1 - r.C1 * Math.pow(D, r.C2)]); }
      out.push(graf({ w: W, h: H, imprimir: opt.imprimir, y0: 0, y1: 1.05, xlabel: "Dano D(t)", ylabel: "Integridade C(t)",
        series: [{ nome: "pontos usados no ajuste (D ≥ 10, até a ruptura)", pts: cd.filter(function (p) { return p.usado; }).map(function (p) { return [p.D, p.C]; }), cor: 0, ponto: true, raio: 2.5 },
          { nome: "demais pontos", pts: cd.filter(function (p) { return !p.usado; }).map(function (p) { return [p.D, p.C]; }), cor: 0, ponto: true, vazio: true, raio: 2.5 },
          { nome: ok(r.C1) ? "C = 1 − " + sig4(r.C1) + " · D^" + sig4(r.C2) : "", pts: curva, cor: 1, linha: true }],
        vlinhas: ok(r.Df) ? [{ x: r.Df, rot: "Df = " + fmt(r.Df, 1), cor: 3 }] : [],
        vazio: "A curva característica de dano aparece com a varredura de amplitude colada." }));
      // 3 — pseudoenergia × integridade (Figura B4)
      var wp = pts.filter(function (p) { return ok(p.W) && ok(p.C); });
      out.push(graf({ w: W, h: H, imprimir: opt.imprimir, xlabel: "Integridade C", ylabel: "W^R (Pa²)",
        series: [{ nome: "W^R = 0,5 · C · (γ^R)²", pts: wp.map(function (p) { return [p.C, p.W]; }), cor: 0, linha: true, fina: true, ponto: true, raio: 1.8 },
          { nome: ok(r.ponto) ? "ruptura — ponto " + r.ponto : "", pts: ok(r.Cf) ? [[r.Cf, r.Wmax]] : [], cor: 3, ponto: true, raio: 5 }],
        vazio: "O gráfico da pseudoenergia aparece com a varredura de amplitude colada." }));
      // 4 — curva de fadiga
      var cf = [];
      if (ok(r.A)) for (var g = 0.5; g <= 10.001; g *= 1.1) cf.push([g, r.A * Math.pow(g, r.B)]);
      out.push(graf({ w: W, h: H, imprimir: opt.imprimir, xlog: true, ylog: true, x0: 0.5, x1: 10, xlabel: "Deformação cisalhante γ (%)", ylabel: "Nf (ciclos)",
        series: [{ nome: ok(r.A) ? "Nf = " + cien(r.A, 4) + " · γ^" + fmt(r.B, 3) : "", pts: cf, cor: 0, linha: true },
          { nome: "", pts: ok(r.Nf125) ? [[1.25, r.Nf125], [2.5, r.Nf25]] : [], cor: 3, ponto: true, raio: 4 }],
        vlinhas: [{ x: 1.25, rot: "1,25 %", cor: 3 }, { x: 2.5, rot: "2,5 %", cor: 3 }],
        vazio: "A curva de fadiga aparece quando A e B forem calculados." }));
      return out;
    },
    relatorio: {
      notas: "α = 1/m, m = inclinação de log G' × log ω (eq. 1 a 3); C = |G*|/|G*|inicial, com o 2º ponto como inicial (eq. 4, NOTAS 3 e 4); " +
        "ΔD = [π γ² (Cᵢ₋₁ − Cᵢ)]^(α/(1+α)) · (tᵢ − tᵢ₋₁)^(1/(1+α)), γ em %; D acumula só quando C diminui (eq. 5 a 7); " +
        "ruptura no ponto de máxima pseudoenergia W^R = 0,5 · C · (γ/100 · |G*|inicial)² (eq. 10 e 11); C(t) = 1 − C1 · D^C2 ajustada pela reta " +
        "log(1 − C) × log D com D ≥ 10 até a ruptura (eq. 8 e 9); Df = ((1 − Cf)/C1)^(1/C2) (eq. 12); A = F · Df^k / [k (π C1 C2)^α], F = 10 Hz, " +
        "k = 1 + (1 − C2) α, B = −2α (eq. 13 a 15); Nf = A · γ^B (eq. 16); FFL = [log(Nf1,25 · Nf2,5)/2] · log(0,025/0,0125) (eq. 17). " +
        "A eq. 14 impressa traz k = 1 + (1 + C2) α, mas o exemplo do Anexo B (k = 2,1246) e a AASHTO T 391 usam (1 − C2), adotado aqui.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Ligante asfáltico", P.material]);
        rows.push(["Temperatura do ensaio (8 b)", ok(r.T) ? fmt(r.T, 1) + " °C" : "—"]);
        rows.push(["|G*| na temperatura do ensaio (8 c)", ok(r.G10) ? fmt(r.G10 / 1e6, 2) + " MPa a 10 Hz (varredura de frequência)" + (ok(r.G0) ? "; |G*|inicial da varredura de amplitude " + fmt(r.G0 / 1e6, 2) + " MPa" : "") : "—"]);
        if (ok(r.T) && Math.abs(r.T - 19) > 0.05) rows.push(["|G*| a 19 °C (8 d)", ok(num(P.G19)) ? fmt(num(P.G19), 1) + " MPa" : "—"]);
        rows.push(["Parâmetro α (7.1)", ok(r.alfa) ? fmt(r.alfa, 4) + " (m = " + fmt(r.m, 4) + ", R² = " + fmt(r.r2, 4) + ")" : "—"]);
        rows.push(["Coeficientes C1 e C2 (8 e)", ok(r.C1) ? sig4(r.C1) + " e " + sig4(r.C2) + " (" + r.nAjuste + " pontos, R² = " + fmt(r.r2C, 4) + ")" : "—"]);
        rows.push(["Ciclo da ruptura (8 f)", ok(r.ciclo) ? r.ciclo + " (ponto " + r.ponto + ", t = " + fmt(r.tf, 1) + " s × 10 Hz; γ = " + fmt(r.gf, 2) + " %)" : "—"]);
        rows.push(["Máxima pseudoenergia de deformação (8 g)", ok(r.Wmax) ? cien(r.Wmax, 4) + " Pa²" : "—"]);
        rows.push(["Integridade na ruptura Cf (8 h)", ok(r.Cf) ? sig4(r.Cf) + (ok(r.Df) ? " — dano na ruptura Df = " + fmt(r.Df, 1) : "") : "—"]);
        rows.push(["Coeficientes A e B da curva de fadiga (8 i)", ok(r.A) ? "A = " + cien(r.A, 4) + "; B = " + sig4(r.B) + " (k = " + fmt(r.k, 4) + ")" : "—"]);
        rows.push(["Nf a 1,25 % e 2,5 %", ok(r.Nf125) ? cien(r.Nf125, 4) + " e " + cien(r.Nf25, 4) + " ciclos" : "—"]);
        r.nfDef.forEach(function (x) { rows.push(["Nf a " + fmt(x[0], 2) + " % (eq. 16)", cien(x[1], 4) + " ciclos"]); });
        rows.push(["Fator de fadiga do ligante — FFL (8 j)", (ok(r.FFL) ? fmt(r.FFL, 4) : "—") + (r.fflOk === null ? "" : r.fflOk ? " — atende ao mínimo de " + fmt(r.fflMin, 2) : " — NÃO ATENDE ao mínimo de " + fmt(r.fflMin, 2))]);
        return rows;
      },
      // pontos da varredura de amplitude até 3 pontos após a ruptura (como a Tabela B3)
      extraHtml: function (calc) {
        var pts = calc._pts || [], r = calc.resultados;
        if (!pts.length || !ok(r.ponto)) return "";
        var ate = Math.min(pts.length, r.ponto + 3), lin = pts.slice(0, ate);
        var metade = Math.ceil(lin.length / 2);
        var cab = "<th>Ponto</th><th>t (s)</th><th>γ (%)</th><th>|G*| (MPa)</th><th>C</th><th>D</th><th>W^R (Pa²)</th>";
        function tds(p) {
          if (!p) return "<td></td><td></td><td></td><td></td><td></td><td></td><td></td>";
          var b = p.i === r.ponto ? "<b>" : "", e = b ? "</b>" : "";
          return "<td>" + b + p.i + (p.usado ? "" : "") + e + "</td><td>" + fmt(p.t, 1) + "</td><td>" + fmt(p.g, 2) + "</td><td>" + fmt(p.G / 1e6, 3) +
            "</td><td>" + fmt(p.C, 3) + "</td><td>" + (ok(p.D) ? fmt(p.D, 1) : "—") + (p.usado ? "*" : "") + "</td><td>" + (ok(p.W) ? cien(p.W, 3) : "—") + "</td>";
        }
        var h = '<h2>Varredura de amplitude — cálculos até 3 pontos após a ruptura</h2><table class="gr"><thead><tr>' + cab + cab + "</tr></thead><tbody>";
        for (var i = 0; i < metade; i++) h += "<tr>" + tds(lin[i]) + tds(lin[i + metade]) + "</tr>";
        return h + '</tbody></table><p class="nota">* ponto usado no ajuste da curva característica de dano (D ≥ 10, até a ruptura); em negrito, o ponto de ruptura. Total de pontos colados: ' + pts.length + ".</p>";
      },
    },
    exemplos: [
      { nome: "Exemplo do Anexo B da norma — Tabelas B1 e B2 (75 pontos)", dados: function () {
        return { ident: { registro: "EX-LAS-001", data: "2026-04-06", obra: "Obra A", origem: "Distribuidora A", camada: "Ligante — resíduo RTFOT" },
          params: { material: "Ligante do exemplo do Anexo B (resíduo RTFOT)", condicao: "rtfot", temp: "19,0", uG: "Pa", formato: "tgG", deformacoes: "2,5; 5,0", amp: AMP_B2 },
          freq: FREQ_B1.map(function (s) { var v = s.split(" "); return { f: v[0], G: v[1], d: v[2] }; }),
          obs: "Dados das Tabelas B1 e B2 do Anexo B. Na Tabela B1, |G*| a 30 Hz está impresso como 6,97E+07 Pa, mas o G' da própria tabela (4,93E+07 Pa = |G*| × cos 34,3°) " +
            "corresponde a 5,97E+07 Pa — usado aqui. A norma obtém C1 = 0,1136 e C2 = 0,4187 (provavelmente com todos os pontos do ensaio); com os 75 pontos " +
            "publicados e o critério D ≥ 10 até a ruptura, resultam os valores deste relatório." };
      } },
      { nome: "Ligante envelhecido rígido — |G*| acima de 70 MPa a 19 °C, FFL abaixo do mínimo do projeto", dados: function () {
        return { ident: { registro: "EX-LAS-002", data: "2026-04-08", obra: "Obra B", origem: "Distribuidora C", camada: "CAP 30/45 — resíduo RTFOT" },
          params: { material: "CAP 30/45 — resíduo RTFOT", condicao: "rtfot", temp: "19,0", uG: "MPa", formato: "tgGd", deformacoes: "2,5; 5,0", fflMin: "2,00", amp: AMP_EX2 },
          freq: FREQ_EX2.map(function (s, i) { var v = s.split(" "); return { f: String(FREQ_62[i]).replace(".", ","), G: v[0], d: v[1] }; }) };
      } },
    ],
  };

  // Anexo B — Tabela B1 (F Hz, |G*| Pa, δ °) e Tabela B2 (t s, γ %, |G*| Pa), pontos 1 a 75
  var FREQ_B1 = ["0,20 5,69E+06 50,6", "0,32 7,47E+06 48,8", "0,50 9,58E+06 47,0", "0,80 1,21E+07 45,6", "1,26 1,52E+07 44,0", "2,00 1,89E+07 42,5",
    "3,17 2,35E+07 41,0", "5,02 2,88E+07 39,6", "7,96 3,51E+07 38,3", "12,6 4,24E+07 36,9", "20,00 5,10E+07 35,4", "30,00 5,97E+07 34,3"];
  var AMP_B2 = "1,6 0,10 3,867E+07 ; 3,8 0,31 3,825E+07 ; 6,0 0,52 3,794E+07 ; 8,2 0,73 3,760E+07 ; 10,4 0,94 3,723E+07 ; 12,5 1,15 3,679E+07 ; " +
    "14,7 1,37 3,633E+07 ; 16,9 1,58 3,577E+07 ; 19,1 1,79 3,517E+07 ; 21,3 2,01 3,448E+07 ; 23,5 2,22 3,375E+07 ; 25,7 2,44 3,297E+07 ; " +
    "27,8 2,65 3,215E+07 ; 30,0 2,87 3,132E+07 ; 32,2 3,08 3,048E+07 ; 34,4 3,30 2,964E+07 ; 36,6 3,51 2,879E+07 ; 38,7 3,73 2,793E+07 ; " +
    "40,9 3,94 2,709E+07 ; 43,1 4,16 2,626E+07 ; 45,3 4,37 2,544E+07 ; 47,5 4,58 2,466E+07 ; 49,7 4,80 2,385E+07 ; 51,9 5,01 2,313E+07 ; " +
    "54,0 5,22 2,242E+07 ; 56,2 5,44 2,171E+07 ; 58,4 5,65 2,107E+07 ; 60,6 5,87 2,037E+07 ; 62,8 6,08 1,975E+07 ; 65,0 6,29 1,916E+07 ; " +
    "67,2 6,50 1,858E+07 ; 69,3 6,71 1,804E+07 ; 71,5 6,93 1,750E+07 ; 73,7 7,14 1,699E+07 ; 75,9 7,35 1,651E+07 ; 78,1 7,56 1,605E+07 ; " +
    "80,2 7,78 1,559E+07 ; 82,4 7,99 1,516E+07 ; 84,6 8,20 1,475E+07 ; 86,8 8,41 1,434E+07 ; 89,0 8,63 1,394E+07 ; 91,1 8,83 1,357E+07 ; " +
    "93,4 9,04 1,322E+07 ; 95,5 9,26 1,286E+07 ; 97,7 9,47 1,254E+07 ; 99,9 9,68 1,223E+07 ; 102,1 9,89 1,192E+07 ; 104,3 10,10 1,162E+07 ; " +
    "106,5 10,31 1,133E+07 ; 108,6 10,52 1,106E+07 ; 110,8 10,73 1,079E+07 ; 113,0 10,95 1,053E+07 ; 115,2 11,15 1,029E+07 ; 117,4 11,37 1,004E+07 ; " +
    "119,5 11,58 9,805E+06 ; 121,7 11,79 9,578E+06 ; 123,9 12,00 9,366E+06 ; 126,1 12,22 9,152E+06 ; 128,2 12,42 8,946E+06 ; 130,5 12,63 8,750E+06 ; " +
    "132,6 12,85 8,553E+06 ; 134,8 13,06 8,362E+06 ; 137,0 13,27 8,175E+06 ; 139,1 13,48 7,997E+06 ; 141,3 13,70 7,820E+06 ; 143,5 13,91 7,647E+06 ; " +
    "145,7 14,13 7,469E+06 ; 147,9 14,34 7,295E+06 ; 150,1 14,55 7,121E+06 ; 152,3 14,78 6,938E+06 ; 154,4 14,99 6,756E+06 ; 156,6 15,22 6,565E+06 ; " +
    "158,8 15,43 6,376E+06 ; 161,0 15,66 6,179E+06 ; 163,2 15,88 5,979E+06";
  // exemplo 2 (gerado): |G*| em MPa e δ nas frequências da lista de 6.2; varredura em t · γ · |G*| (MPa) · δ
  var FREQ_EX2 = ["18,3 33,6", "23,8 32,4", "27,6 31,7", "30,6 31,2", "33,2 30,8", "42,9 29,6", "55,7 27,8", "64,6 27,2", "72 27,1", "78,1 26,2", "101 25,4", "117 24,1"];
  var AMP_EX2 = "1,0 0,10 81,87 36,0 ; 2,0 0,20 81,67 36,0 ; 3,0 0,29 81,14 36,2 ; 4,0 0,39 80,69 36,3 ; 5,0 0,49 80,48 36,4 ; 6,0 0,58 80,14 36,5 ; 7,0 0,68 79,91 36,6 ; 8,0 0,78 79,6 36,7 ; " +
    "9,0 0,87 79,47 36,8 ; 10,0 0,97 79,01 36,9 ; 11,0 1,07 78,87 37,0 ; 12,0 1,16 78,39 37,1 ; 13,0 1,26 78,23 37,2 ; 14,0 1,36 77,91 37,3 ; 15,0 1,45 77,43 37,4 ; 16,0 1,55 77,16 37,5 ; " +
    "17,0 1,65 76,79 37,6 ; 18,0 1,74 76,37 37,8 ; 19,0 1,84 76,19 37,9 ; 20,0 1,94 75,7 38,0 ; 21,0 2,04 75,49 38,1 ; 22,0 2,13 75,11 38,3 ; 23,0 2,23 74,74 38,4 ; 24,0 2,33 74,18 38,5 ; " +
    "25,0 2,42 74 38,6 ; 26,0 2,52 73,61 38,8 ; 27,0 2,62 73,11 38,9 ; 28,0 2,71 72,67 39,0 ; 29,0 2,81 72,41 39,2 ; 30,0 2,91 72 39,3 ; 31,0 3,00 71,53 39,4 ; 32,0 3,10 71,12 39,6 ; " +
    "33,0 3,20 70,9 39,7 ; 34,0 3,29 70,35 39,8 ; 35,0 3,39 70 40,0 ; 36,0 3,49 69,63 40,1 ; 37,0 3,58 69,2 40,3 ; 38,0 3,68 68,76 40,4 ; 39,0 3,78 68,33 40,5 ; 40,0 3,87 67,95 40,7 ; " +
    "41,0 3,97 67,48 40,8 ; 42,0 4,07 67,14 41,0 ; 43,0 4,16 66,6 41,1 ; 44,0 4,26 66,25 41,3 ; 45,0 4,36 65,73 41,4 ; 46,0 4,45 65,4 41,6 ; 47,0 4,55 64,9 41,7 ; 48,0 4,65 64,56 41,9 ; " +
    "49,0 4,74 64,18 42,0 ; 50,0 4,84 63,62 42,2 ; 51,0 4,94 63,24 42,3 ; 52,0 5,03 62,76 42,5 ; 53,0 5,13 62,25 42,6 ; 54,0 5,23 61,82 42,8 ; 55,0 5,33 61,45 42,9 ; 56,0 5,42 60,91 43,1 ; " +
    "57,0 5,52 60,47 43,2 ; 58,0 5,62 60,07 43,4 ; 59,0 5,71 59,58 43,5 ; 60,0 5,81 59,13 43,7 ; 61,0 5,91 58,73 43,9 ; 62,0 6,00 58,18 44,0 ; 63,0 6,10 57,84 44,2 ; 64,0 6,20 57,35 44,3 ; " +
    "65,0 6,29 56,85 44,5 ; 66,0 6,39 56,37 44,6 ; 67,0 6,49 56,01 44,8 ; 68,0 6,58 55,42 45,0 ; 69,0 6,68 54,98 45,1 ; 70,0 6,78 54,55 45,3 ; 71,0 6,87 54,12 45,5 ; 72,0 6,97 53,66 45,6 ; " +
    "73,0 7,07 53,11 45,8 ; 74,0 7,16 52,66 45,9 ; 75,0 7,26 52,18 46,1 ; 76,0 7,36 51,62 46,3 ; 77,0 7,45 51,16 46,4 ; 78,0 7,55 50,69 46,6 ; 79,0 7,65 50,26 46,8 ; 80,0 7,74 49,74 46,9 ; " +
    "81,0 7,84 49,21 47,1 ; 82,0 7,94 48,74 47,3 ; 83,0 8,03 48,24 47,4 ; 84,0 8,13 47,79 47,6 ; 85,0 8,23 47,23 47,8 ; 86,0 8,32 46,78 47,9 ; 87,0 8,42 46,32 48,1 ; 88,0 8,52 45,73 48,3 ; " +
    "89,0 8,62 45,23 48,5 ; 90,0 8,71 44,79 48,6 ; 91,0 8,81 44,32 48,8 ; 92,0 8,91 43,79 49,0 ; 93,0 9,00 43,32 49,1 ; 94,0 9,10 42,74 49,3 ; 95,0 9,20 42,31 49,5 ; 96,0 9,29 41,72 49,7 ; " +
    "97,0 9,39 41,31 49,8 ; 98,0 9,49 40,79 50,0 ; 99,0 9,58 40,31 50,2 ; 100,0 9,68 39,76 50,4 ; 101,0 9,78 39,21 50,5 ; 102,0 9,87 38,68 50,7 ; 103,0 9,97 38,23 50,9 ; 104,0 10,07 37,74 51,1 ; " +
    "105,0 10,16 37,15 51,2 ; 106,0 10,26 36,64 51,4 ; 107,0 10,36 36,09 51,6 ; 108,0 10,45 35,58 51,8 ; 109,0 10,55 35,07 52,0 ; 110,0 10,65 34,6 52,1 ; 111,0 10,74 34 52,3 ; 112,0 10,84 33,52 52,5 ; " +
    "113,0 10,94 33,03 52,7 ; 114,0 11,03 32,5 52,9 ; 115,0 11,13 31,93 53,0 ; 116,0 11,23 31,44 53,2 ; 117,0 11,32 30,86 53,4 ; 118,0 11,42 30,32 53,6 ; 119,0 11,52 29,86 53,8 ; 120,0 11,61 29,31 53,9 ; " +
    "121,0 11,71 28,8 54,1 ; 122,0 11,81 28,21 54,3 ; 123,0 11,91 27,73 54,5 ; 124,0 12,00 27,16 54,7 ; 125,0 12,10 26,61 54,9 ; 126,0 12,20 26,07 55,0 ; 127,0 12,29 25,57 55,2 ; 128,0 12,39 25,01 55,4 ; " +
    "129,0 12,49 24,49 55,6 ; 130,0 12,58 23,92 55,8 ; 131,0 12,68 23,39 56,0 ; 132,0 12,78 22,87 56,2";
})();
