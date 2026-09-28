/*
 * Ficha: DNIT 423/2020-ME — Ligante asfáltico — Fluência e recuperação sob tensões múltiplas (MSCR).
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * Entradas: deformações lidas no reômetro (DSR) em cada ciclo de 10 s — ε₀ (início), εc (fim da fluência, 1 s)
 * e εr (fim da recuperação, 10 s) — nos 10 últimos ciclos a 0,1 kPa (N = 11 a 20, 6.3) e nos 10 ciclos a 3,2 kPa (6.4).
 * Contas: eq. 1 a 14 (seção 7). Jnr = ε₁₀ / σ, com a deformação adimensional e σ em kPa (0,1 e 3,2 kPa):
 * as eq. 8 a 11 da norma escrevem "ε₁₀ / 100" e "ε₁₀ / 3200" (tensão em Pa) mas dão o resultado em kPa⁻¹ —
 * aqui se usa a forma coerente com a unidade (ASTM D7405, base da norma).
 *
 * Este arquivo também define FE.reologiaGrafico (gráfico X-Y com eixos lineares ou logarítmicos), usado pelas
 * fichas site/fichas/dnit-439-2022-me.js e site/fichas/dnit-448-2024-me.js (carregadas depois desta no index.html).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, fmtSig = FE.fmtSig, esc = FE.esc, media = FE.media;

  // =====================================================================================
  // Gráfico X-Y comum às fichas de reologia (DSR)
  // opt: {w, h, imprimir, xlog, ylog, x0, x1, y0, y1, xlabel, ylabel, series: [{nome, pts: [[x, y]], cor: 0..3,
  //       linha, ponto, trac, vazio}], vlinhas: [{x, rot, cor}], hlinhas: [{y, rot, cor}], vazio: "texto"}
  // =====================================================================================
  function reologiaGrafico(opt) {
    var W = opt.w || 560, H = opt.h || 300, m = { l: 60, r: 16, t: 14, b: 42 };
    var imp = !!opt.imprimir;
    var cor = imp ? { eixo: "#333", grade: "#ddd", txt: "#222", s: ["#1f5fbf", "#c77d12", "#1e8a5a", "#c0392b"] }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", s: ["#4f8cff", "#e0a13a", "#3fbf8a", "#e05a4f"] };
    var todos = [];
    (opt.series || []).forEach(function (s) {
      s.pts.forEach(function (p) {
        if (ok(p[0]) && ok(p[1]) && (!opt.xlog || p[0] > 0) && (!opt.ylog || p[1] > 0)) todos.push(p);
      });
    });
    if (!todos.length) return '<div class="fe-graf-vazio">' + esc(opt.vazio || "O gráfico aparece quando houver dados.") + "</div>";
    function tx(v, log) { return log ? Math.log10(v) : v; }
    var xs = todos.map(function (p) { return tx(p[0], opt.xlog); }), ys = todos.map(function (p) { return tx(p[1], opt.ylog); });
    (opt.vlinhas || []).forEach(function (l) { if (ok(l.x) && (!opt.xlog || l.x > 0)) xs.push(tx(l.x, opt.xlog)); });
    (opt.hlinhas || []).forEach(function (l) { if (ok(l.y) && (!opt.ylog || l.y > 0)) ys.push(tx(l.y, opt.ylog)); });
    function faixa(v, log, a, b) {
      var lo = ok(a) ? tx(a, log) : Math.min.apply(null, v), hi = ok(b) ? tx(b, log) : Math.max.apply(null, v);
      if (log) {
        if (!ok(a)) lo = Math.floor(lo + 1e-9);
        if (!ok(b)) hi = Math.ceil(hi - 1e-9);
        if (hi <= lo) hi = lo + 1;
        return [lo, hi];
      }
      if (hi === lo) { hi += Math.abs(hi) * 0.1 || 1; lo -= Math.abs(lo) * 0.1 || 1; }
      var pad = (hi - lo) * 0.06;
      if (!ok(a)) lo -= pad;
      if (!ok(b)) hi += pad;
      return [lo, hi];
    }
    var fx = faixa(xs, opt.xlog, opt.x0, opt.x1), fy = faixa(ys, opt.ylog, opt.y0, opt.y1);
    function X(v) { return m.l + (tx(v, opt.xlog) - fx[0]) / (fx[1] - fx[0]) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (tx(v, opt.ylog) - fy[0]) / (fy[1] - fy[0]) * (H - m.t - m.b); }
    function passo(lo, hi) {
      var r = (hi - lo) / 6, p = Math.pow(10, Math.floor(Math.log10(r))), q = r / p;
      return (q < 1.5 ? 1 : q < 3 ? 2 : q < 7 ? 5 : 10) * p;
    }
    var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    function pot(e) { return "10" + String(e).split("").map(function (c) { return SUP[c]; }).join(""); }
    function rotLog(e) { return e >= -2 && e <= 3 ? fmt(Math.pow(10, e), Math.max(0, -e)) : pot(e); }
    function marcas(lo, hi, log) {
      var out = [];
      if (log) {
        var dec = hi - lo;
        for (var e = Math.ceil(lo - 1e-9); e <= hi + 1e-9; e++) {
          out.push({ v: Math.pow(10, e), t: rotLog(e), forte: true });
          if (dec <= 3) [2, 5].forEach(function (k) {
            var lv = e + Math.log10(k);
            if (lv > lo && lv < hi) out.push({ v: Math.pow(10, lv), t: dec <= 2 ? (e >= -2 && e <= 3 ? fmt(Math.pow(10, lv), Math.max(0, -e)) : k + "·" + pot(e)) : "", forte: false });
          });
        }
        return out;
      }
      var p = passo(lo, hi), E = escala(lo, hi), casas = Math.max(0, -Math.floor(Math.log10(p / Math.pow(10, E)) + 1e-9));
      for (var v = Math.ceil(lo / p - 1e-9) * p; v <= hi + 1e-9; v += p) out.push({ v: v, t: fmt(Math.abs(v) < p * 1e-6 ? 0 : v / Math.pow(10, E), casas), forte: true });
      return out;
    }
    // expoente comum dos rótulos de eixo linear com números muito grandes ou muito pequenos
    function escala(lo, hi) {
      var mx = Math.max(Math.abs(lo), Math.abs(hi));
      if (!mx || (mx < 1e5 && mx >= 1e-2)) return 0;
      return Math.floor(Math.log10(mx));
    }
    var Ex = opt.xlog ? 0 : escala(fx[0], fx[1]), Ey = opt.ylog ? 0 : escala(fy[0], fy[1]);
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    marcas(fx[0], fx[1], opt.xlog).forEach(function (k) {
      s += '<line x1="' + X(k.v).toFixed(1) + '" y1="' + m.t + '" x2="' + X(k.v).toFixed(1) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="' + (k.forte ? 0.7 : 0.4) + '"/>';
      if (k.t) s += '<text x="' + X(k.v).toFixed(1) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + esc(k.t) + "</text>";
    });
    marcas(fy[0], fy[1], opt.ylog).forEach(function (k) {
      s += '<line x1="' + m.l + '" y1="' + Y(k.v).toFixed(1) + '" x2="' + (W - m.r) + '" y2="' + Y(k.v).toFixed(1) + '" stroke="' + cor.grade + '" stroke-width="' + (k.forte ? 0.7 : 0.4) + '"/>';
      if (k.t) s += '<text x="' + (m.l - 6) + '" y="' + (Y(k.v) + 4).toFixed(1) + '" text-anchor="end" fill="' + cor.txt + '">' + esc(k.t) + "</text>";
    });
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
    s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">' + esc((opt.xlabel || "") + (Ex ? " × " + pot(Ex) : "")) + "</text>";
    s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">' + esc((opt.ylabel || "") + (Ey ? " × " + pot(Ey) : "")) + "</text>";
    var dentroX = function (v) { var t = tx(v, opt.xlog); return t >= fx[0] - 1e-9 && t <= fx[1] + 1e-9; };
    var dentroY = function (v) { var t = tx(v, opt.ylog); return t >= fy[0] - 1e-9 && t <= fy[1] + 1e-9; };
    (opt.vlinhas || []).forEach(function (l) {
      if (!ok(l.x) || (opt.xlog && l.x <= 0) || !dentroX(l.x)) return;
      var c = cor.s[l.cor || 0];
      s += '<line x1="' + X(l.x).toFixed(1) + '" y1="' + m.t + '" x2="' + X(l.x).toFixed(1) + '" y2="' + (H - m.b) + '" stroke="' + c + '" stroke-dasharray="4 3"/>';
      if (l.rot) s += '<text x="' + (X(l.x) + 4).toFixed(1) + '" y="' + (opt.vrotTopo ? m.t + 12 : H - m.b - 6) + '" fill="' + c + '">' + esc(l.rot) + "</text>";
    });
    (opt.hlinhas || []).forEach(function (l) {
      if (!ok(l.y) || (opt.ylog && l.y <= 0) || !dentroY(l.y)) return;
      var c = cor.s[l.cor || 0];
      s += '<line x1="' + m.l + '" y1="' + Y(l.y).toFixed(1) + '" x2="' + (W - m.r) + '" y2="' + Y(l.y).toFixed(1) + '" stroke="' + c + '" stroke-dasharray="4 3"/>';
      if (l.rot) s += '<text x="' + (W - m.r - 4) + '" y="' + (Y(l.y) - 4).toFixed(1) + '" text-anchor="end" fill="' + c + '">' + esc(l.rot) + "</text>";
    });
    var leg = [];
    (opt.series || []).forEach(function (se) {
      var c = cor.s[se.cor || 0];
      var pts = se.pts.filter(function (p) { return ok(p[0]) && ok(p[1]) && (!opt.xlog || p[0] > 0) && (!opt.ylog || p[1] > 0) && dentroX(p[0]) && dentroY(p[1]); });
      if (!pts.length) return;
      if (se.linha) {
        s += '<path d="' + pts.map(function (p, j) { return (j ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ") +
          '" fill="none" stroke="' + c + '" stroke-width="' + (se.fina ? 1.2 : 1.8) + '"' + (se.trac ? ' stroke-dasharray="6 3"' : "") + "/>";
      }
      if (se.ponto) pts.forEach(function (p) {
        s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="' + (se.raio || 3) + '" fill="' + (se.vazio ? "none" : c) + '" stroke="' + c + '" stroke-width="1.3"/>';
      });
      if (se.nome) leg.push([se.nome, c]);
    });
    leg.forEach(function (l, i) {
      var yy = m.t + 14 + i * 14, xx = opt.legEsq ? m.l + 8 : W - m.r - 8;
      s += '<text x="' + xx + '" y="' + yy + '" text-anchor="' + (opt.legEsq ? "start" : "end") + '" fill="' + l[1] + '">■ ' + esc(l[0]) + "</text>";
    });
    return s + "</svg>";
  }
  FE.reologiaGrafico = reologiaGrafico;

  // =====================================================================================
  // DNIT 423/2020-ME — MSCR
  // =====================================================================================
  // Tabela 1 (Anexo A): precisão — [R100, R3200, Jnr100 (>1; 0,26–1; 0,10–0,25), Jnr3200 (idem)]
  var PREC = {
    r: { R100: [2.4, 6.7], R3200: [3.0, 8.5], J100: [[4.6, 12.8], [5.4, 15.2], [13.7, 38.3]], J3200: [[5.7, 16.0], [5.5, 15.3], [9.5, 26.6]] },
    R: { R100: [5.4, 15.0], R3200: [6.5, 18.1], J100: [[9.1, 25.6], [12.7, 35.6], [16.7, 46.8]], J3200: [[7.9, 22.0], [13.9, 39.0], [15.2, 42.6]] },
  };
  function faixaJnr(j) { return !ok(j) ? -1 : j > 1.00 ? 0 : j >= 0.26 ? 1 : j >= 0.10 ? 2 : -1; }
  var ROT_FAIXA = ["> 1,00 kPa⁻¹", "0,26 a 1,00 kPa⁻¹", "0,10 a 0,25 kPa⁻¹"];

  // AASHTO M 332 (bibliografia do Anexo C — informativa): grau de tráfego pelo Jnr3,2 e curva de resposta elástica
  var M332 = [[0.5, "E", "extremamente pesado"], [1.0, "V", "muito pesado"], [2.0, "H", "pesado"], [4.5, "S", "padrão"]];
  function curvaElastica(j) { return j < 0.1 ? 55 : 29.371 * Math.pow(j, -0.2633); }

  function sig3(x) { return ok(x) ? fmtSig(Number(x.toPrecision(3)), 3) : "—"; }
  function arred(x, c) { var f = Math.pow(10, c); return ok(x) ? Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f : NaN; }

  // um ciclo: ε₁ = εc − ε₀ (eq. 1), ε₁₀ = εr − ε₀ (eq. 2), recuperação (eq. 3/4, negativa = 0), Jnr (eq. 8–11)
  function ciclo(p, fator, tensao) {
    var e0 = num(p.e0), ec = num(p.ec), er = num(p.er);
    if (!ok(e0) || !ok(ec) || !ok(er)) return { e1: NaN, e10: NaN, R: NaN, Jnr: NaN };
    var e1 = ec - e0, e10 = er - e0;
    var Rb = e1 !== 0 ? (e1 - e10) * 100 / e1 : NaN;
    var neg = ok(Rb) && Rb < 0;
    return { e1: e1, e10: e10, Rbruto: Rb, R: neg ? 0 : Rb, neg: neg, Jnr: (neg ? e1 : e10) * fator / tensao };
  }

  var COLS01 = ["11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
  var COLS32 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

  function linhasCiclo(u, casas, tensao, eqR, eqJ) {
    return [
      { k: "e0", r: "ε₀ — deformação no início do ciclo (6.6.1)", u: u },
      { k: "ec", r: "εc — deformação ao fim de 1 s de fluência (6.6.2)", u: u },
      { k: "er", r: "εr — deformação ao fim de 10 s, após a recuperação (6.5.4)", u: u },
      { calc: "e1", r: "ε₁ = εc − ε₀ (eq. 1)", u: u, casas: casas },
      { calc: "e10", r: "ε₁₀ = εr − ε₀ (eq. 2)", u: u, casas: casas },
      { calc: "R", r: "Recuperação εr(" + tensao + "; N) = (ε₁ − ε₁₀) × 100 / ε₁ (" + eqR + "; < 0 → 0)", u: "%", casas: 1, destaque: true },
      { calc: "Jnr", r: "Jnr(" + tensao + "; N) = ε₁₀ / σ (" + eqJ + "; recuperação < 0 → ε₁ / σ)", u: "kPa⁻¹", casas: 4, destaque: true },
    ];
  }

  FE.FICHAS["dnit-423-2020-me"] = {
    titulo: "MSCR — fluência e recuperação sob tensões múltiplas",
    resumo: "Reômetro de cisalhamento dinâmico (placas de 25 mm, gap de 1 mm): 20 ciclos de 1 s de fluência + 9 s de recuperação a 0,1 kPa (os 10 últimos são medidos) e 10 ciclos a 3,2 kPa; percentual de recuperação R e compliância não recuperável Jnr em cada tensão, Rdiff e Jnr,diff.",
    blocos: [],
    params: [
      { k: "material", r: "Ligante asfáltico", ph: "ex.: CAP 60/85-E, CAP 50/70" },
      { k: "condicao", r: "Condição da amostra", tipo: "select",
        opcoes: [["rtfot", "Resíduo após RTFOT (ABNT NBR 15235) — prefácio"], ["original", "Ligante original (não envelhecido)"]] },
      { k: "temp", r: "Temperatura do ensaio (°C)", ph: "ex.: 64,0", dica: "máxima temperatura esperada no pavimento — no Brasil, em geral 64 °C ou 70 °C (1, 6.1)" },
      { k: "unidade", r: "Unidade das deformações lidas", tipo: "select", recarrega: true,
        opcoes: [["pct", "Porcentagem (%) — como exportado pela maioria dos reômetros"], ["adim", "Adimensional (mm/mm)"]] },
      { k: "tempo", r: "Tempo total dos ciclos a 0,1 kPa e 3,2 kPa (s) — opcional", ph: "300", dica: "não deve exceder 300 s (6.4)" },
      { k: "classif", r: "Classificação de tráfego (informativa)", tipo: "select",
        opcoes: [["", "Não classificar"], ["m332", "AASHTO M 332 — grau pelo Jnr3,2 (bibliografia do Anexo C; sem limite na norma/EM do acervo)"]],
        dica: "a DNIT 423 e as especificações do acervo não fixam limites de MSCR; a DNIT 385-ES remete ao projeto" },
      { k: "jnrMax", r: "Jnr3200 máximo do projeto (kPa⁻¹) — opcional" },
      { k: "rMin", r: "R3200 mínimo do projeto (%) — opcional" },
      { k: "jdiffMax", r: "Jnr,diff máximo do projeto (%) — opcional" },
      { k: "jnrRep", r: "Repetição (mesmo operador) — Jnr3200 da outra determinação (kPa⁻¹) — opcional",
        dica: "compara a diferença, em % da média, com a faixa d2s % da Tabela 1 (9.2)" },
      { k: "rRep", r: "Repetição (mesmo operador) — R3200 da outra determinação (%) — opcional" },
    ],
    padrao: { condicao: "rtfot", unidade: "pct", classif: "" },
    tabelas: function (d) {
      var pct = (d.params || {}).unidade !== "adim", u = pct ? "%" : "mm/mm", c = pct ? 3 : 5;
      [["c01", 10], ["c32", 10]].forEach(function (x) {
        if (Array.isArray(d[x[0]])) { while (d[x[0]].length < x[1]) d[x[0]].push({}); if (d[x[0]].length > x[1]) d[x[0]].length = x[1]; }
      });
      return [
        { chave: "c01", titulo: "Tensão de 0,1 kPa (100 Pa) — ciclos 11 a 20 (6.3)", rotulo: "Ciclo N", iniciais: 10, min: 10, fixo: true, nomes: COLS01,
          dica: "os 10 primeiros ciclos são de condicionamento e não entram no cálculo; deformação acumulada desde o início do ensaio",
          linhas: linhasCiclo(u, c, "0,1", "eq. 3", "eq. 8/9") },
        { chave: "c32", titulo: "Tensão de 3,2 kPa (3200 Pa) — ciclos 1 a 10 (6.4)", rotulo: "Ciclo N", iniciais: 10, min: 10, fixo: true, nomes: COLS32,
          dica: "iniciados logo após o 20º ciclo a 0,1 kPa, sem repouso",
          linhas: linhasCiclo(u, c, "3,2", "eq. 4", "eq. 10/11") },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var fator = P.unidade === "adim" ? 1 : 0.01;  // deformação adimensional para o Jnr
      var c01 = (d.c01 || []).map(function (p) { return ciclo(p, fator, 0.1); });
      var c32 = (d.c32 || []).map(function (p) { return ciclo(p, fator, 3.2); });
      function checa(arr, rot, nomes) {
        var val = arr.filter(function (o) { return ok(o.R); });
        if (val.length && val.length < 10) avisos.push(rot + ": há " + val.length + " ciclo(s) completo(s); a média é dos 10 ciclos (7.1.3 a 7.1.9).");
        arr.forEach(function (o, i) {
          if (!ok(o.e1)) return;
          if (o.e1 <= 0) avisos.push(rot + ", ciclo " + nomes[i] + ": ε₁ ≤ 0 (εc não é maior que ε₀) — confira as leituras.");
          if (o.neg) avisos.push(rot + ", ciclo " + nomes[i] + ": recuperação negativa (" + fmt(o.Rbruto, 1) + " %) considerada zero; Jnr calculado com ε₁ (7.1.1.1 / 7.1.6.1, NOTA 2).");
        });
        // continuidade: ε₀ de um ciclo = εr do anterior (sem repouso entre ciclos, 6.3/6.4)
        var src = rot.indexOf("0,1") !== -1 ? d.c01 : d.c32;
        for (var i = 1; i < (src || []).length; i++) {
          var a = num(src[i - 1].er), b = num(src[i].e0);
          if (ok(a) && ok(b) && Math.abs(a - b) > Math.max(1e-6, Math.abs(a) * 0.02)) {
            avisos.push(rot + ": ε₀ do ciclo " + nomes[i] + " difere do εr do ciclo " + nomes[i - 1] + " — os ciclos devem ser contínuos, sem repouso (6.3, 6.4); confira a transcrição.");
            break;
          }
        }
        return val.length;
      }
      var n01 = checa(c01, "0,1 kPa", COLS01), n32 = checa(c32, "3,2 kPa", COLS32);
      var R100 = n01 ? media(c01.map(function (o) { return o.R; })) : NaN;     // eq. 5
      var R3200 = n32 ? media(c32.map(function (o) { return o.R; })) : NaN;    // eq. 6
      var J100 = n01 ? media(c01.map(function (o) { return o.Jnr; })) : NaN;   // eq. 12
      var J3200 = n32 ? media(c32.map(function (o) { return o.Jnr; })) : NaN;  // eq. 13
      var Rdiff = ok(R100) && ok(R3200) && R100 > 0 ? (R100 - R3200) * 100 / R100 : NaN;  // eq. 7
      var Jdiff = ok(J100) && ok(J3200) && J100 > 0 ? (J3200 - J100) * 100 / J100 : NaN;  // eq. 14
      if (ok(R100) && R100 === 0 && ok(R3200)) avisos.push("R100 = 0: Rdiff (eq. 7) não é definido.");
      // resultados com a precisão da seção 8
      var r = { R100: arred(R100, 1), R3200: arred(R3200, 1), Rdiff: arred(Rdiff, 1), J100: J100, J3200: J3200, Jdiff: arred(Jdiff, 1),
        temp: num(P.temp), n01: n01, n32: n32 };
      if (!ok(r.temp) && (n01 || n32)) avisos.push("Informe a temperatura do ensaio, com aproximação de 0,1 °C (8.2).");
      if (P.condicao === "original") avisos.push("O ensaio é apropriado para ligantes envelhecidos no RTFOT (prefácio); registre a condição da amostra.");
      var tempo = num(P.tempo);
      if (ok(tempo) && tempo > 300) avisos.push("Tempo total de " + fmt(tempo, 0) + " s: os ciclos a 0,1 kPa e 3,2 kPa não devem exceder 300 s (6.4).");
      // Tabela 1, nota B: Jnr < 0,1 kPa⁻¹ — alta variabilidade; considerar ensaio 6 °C acima
      if (ok(J3200) && J3200 < 0.1) avisos.push("Jnr3200 = " + sig3(J3200) + " kPa⁻¹ < 0,10 kPa⁻¹: resultado de alta variabilidade; considere ensaiar a uma temperatura 6 °C mais elevada (Tabela 1, nota B).");
      // limites do projeto (DNIT 385-ES: "se especificados no projeto")
      var jMax = num(P.jnrMax), rMin = num(P.rMin), dMax = num(P.jdiffMax), proj = [];
      if (ok(jMax) && ok(J3200)) proj.push(["Jnr3200 ≤ " + fmt(jMax, 2) + " kPa⁻¹", Number(J3200.toPrecision(3)) <= jMax + 1e-12]);
      if (ok(rMin) && ok(r.R3200)) proj.push(["R3200 ≥ " + fmt(rMin, 1) + " %", r.R3200 >= rMin - 1e-9]);
      if (ok(dMax) && ok(r.Jdiff)) proj.push(["Jnr,diff ≤ " + fmt(dMax, 1) + " %", r.Jdiff <= dMax + 1e-9]);
      proj.forEach(function (x) { if (!x[1]) avisos.unshift("Não atende ao limite do projeto: " + x[0] + "."); });
      r.proj = proj;
      r.conforme = proj.length ? proj.every(function (x) { return x[1]; }) : null;
      // classificação AASHTO M 332 (informativa)
      if (P.classif === "m332" && ok(J3200)) {
        var g = M332.filter(function (x) { return J3200 <= x[0] + 1e-12; })[0];
        var curva = curvaElastica(J3200);
        r.m332 = { grau: g ? g[1] : null, nome: g ? g[2] : "", diffOk: ok(r.Jdiff) ? r.Jdiff <= 75 : null,
          curva: curva, elastica: ok(r.R3200) && J3200 <= 2.0 ? r.R3200 >= curva : null };
        if (!g) avisos.push("Jnr3200 > 4,5 kPa⁻¹: não se enquadra em nenhum grau de tráfego da AASHTO M 332 (referência informativa).");
        if (g && r.m332.diffOk === false) avisos.push("Jnr,diff = " + fmt(r.Jdiff, 1) + " % > 75 %: pela AASHTO M 332 (informativa) o ligante é sensível à tensão e não recebe o grau.");
      }
      // repetibilidade (9.2 e Tabela 1): diferença em % da média ≤ d2s %
      var jr = num(P.jnrRep), rr = num(P.rRep);
      r.rep = [];
      if (ok(jr) && ok(J3200)) {
        var mJ = (jr + J3200) / 2, dj = Math.abs(jr - J3200) / mJ * 100, fxJ = faixaJnr(mJ);
        var limJ = fxJ >= 0 ? PREC.r.J3200[fxJ][1] : NaN;
        r.rep.push(["Jnr3200", dj, limJ, fxJ >= 0 ? ROT_FAIXA[fxJ] : "< 0,10 kPa⁻¹ (sem precisão definida)"]);
        if (ok(limJ) && dj > limJ) avisos.push("Repetibilidade: as duas determinações de Jnr3200 diferem " + fmt(dj, 1) + " % da média, acima de " + fmt(limJ, 1) + " % (Tabela 1, " + ROT_FAIXA[fxJ] + ") — resultados suspeitos (9.2).");
      }
      if (ok(rr) && ok(r.R3200)) {
        var mR = (rr + r.R3200) / 2, dr = mR > 0 ? Math.abs(rr - r.R3200) / mR * 100 : NaN, limR = PREC.r.R3200[1];
        r.rep.push(["R3200", dr, limR, ""]);
        if (ok(dr) && dr > limR) avisos.push("Repetibilidade: as duas determinações de R3200 diferem " + fmt(dr, 1) + " % da média, acima de " + fmt(limR, 1) + " % (Tabela 1) — resultados suspeitos (9.2).");
      }
      return { tab: { c01: c01, c32: c32 }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(sig3(r.J3200) + " <small>kPa⁻¹</small>", "Jnr3200 — compliância não recuperável a 3,2 kPa (eq. 13, 3 algarismos)") +
        cx(ok(r.R3200) ? fmt(r.R3200, 1) + " <small>%</small>" : "—", "R3200 — recuperação média a 3,2 kPa (eq. 6)") +
        cx(sig3(r.J100) + " <small>kPa⁻¹</small>", "Jnr100 — a 0,1 kPa (eq. 12)", true) +
        cx(ok(r.R100) ? fmt(r.R100, 1) + " %" : "—", "R100 — a 0,1 kPa (eq. 5)", true) +
        cx(ok(r.Jdiff) ? fmt(r.Jdiff, 1) + " %" : "—", "Jnr,diff (eq. 14)", true) +
        cx(ok(r.Rdiff) ? fmt(r.Rdiff, 1) + " %" : "—", "Rdiff (eq. 7)", true);
      if (r.proj.length) h += cx(r.conforme ? '<span class="fe-ok">atende</span>' : '<span class="fe-nok">não atende</span>',
        "Limites do projeto: " + esc(r.proj.map(function (x) { return x[0]; }).join(" · ")), true);
      if (r.m332) h += cx(r.m332.grau ? "PG " + (ok(r.temp) ? fmt(r.temp, 0) : "xx") + r.m332.grau + (r.m332.diffOk === false ? " *" : "") : "—",
        "AASHTO M 332 (informativa): " + (r.m332.grau ? "tráfego " + r.m332.nome : "sem grau") +
        (r.m332.diffOk === false ? " · * Jnr,diff > 75 %" : "") +
        (r.m332.elastica === null ? "" : " · resposta elástica " + (r.m332.elastica ? "acima" : "abaixo") + " da curva (R ≥ " + fmt(r.m332.curva, 1) + " %)"), true);
      return h + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var fator = (d.params || {}).unidade === "adim" ? 100 : 1;  // gráfico sempre em %
      function serie(tab, t0) {
        var pts = [];
        (tab || []).forEach(function (p, i) {
          var e0 = num(p.e0) * fator, ec = num(p.ec) * fator, er = num(p.er) * fator, t = t0 + i * 10;
          if (ok(e0) && ok(ec) && ok(er)) pts.push([t, e0], [t + 1, ec], [t + 10, er]);
        });
        return pts;
      }
      var base = { w: opt.w || 560, h: opt.h ? Math.round(opt.h * 0.8) : 250, imprimir: opt.imprimir, xlabel: "Tempo (s)", ylabel: "Deformação acumulada (%)" };
      var g = [
        reologiaGrafico(Object.assign({}, base, { series: [{ nome: "0,1 kPa — ciclos 11 a 20", pts: serie(d.c01, 100), cor: 0, linha: true, ponto: true, raio: 2 }],
          vazio: "O gráfico da tensão de 0,1 kPa aparece quando houver ciclos completos.", legEsq: true })),
        reologiaGrafico(Object.assign({}, base, { series: [{ nome: "3,2 kPa — ciclos 1 a 10", pts: serie(d.c32, 200), cor: 1, linha: true, ponto: true, raio: 2 }],
          vazio: "O gráfico da tensão de 3,2 kPa aparece quando houver ciclos completos.", legEsq: true })),
      ];
      var r = calc.resultados;
      if (r.m332 && ok(r.J3200) && ok(r.R3200)) {
        var curva = [];
        for (var e = -1; e <= Math.log10(2) + 1e-9; e += 0.05) { var j = Math.pow(10, e); curva.push([j, curvaElastica(j)]); }
        g.push(reologiaGrafico({ w: base.w, h: opt.h || 300, imprimir: opt.imprimir, xlog: true, x0: 0.05, x1: 10, y0: 0, y1: 100,
          xlabel: "Jnr3200 (kPa⁻¹)", ylabel: "R3200 (%)",
          series: [{ nome: "curva de resposta elástica (AASHTO M 332, informativa)", pts: curva, cor: 2, linha: true },
            { nome: "amostra", pts: [[r.J3200, r.R3200]], cor: 0, ponto: true, raio: 5 }],
          vlinhas: [{ x: 0.5, rot: "E", cor: 3 }, { x: 1, rot: "V", cor: 3 }, { x: 2, rot: "H", cor: 3 }, { x: 4.5, rot: "S", cor: 3 }] }));
      }
      return g;
    },
    relatorio: {
      notas: "ε₁ = εc − ε₀ (eq. 1); ε₁₀ = εr − ε₀ (eq. 2); recuperação por ciclo = (ε₁ − ε₁₀) × 100 / ε₁ (eq. 3 e 4), negativa considerada zero; " +
        "Jnr por ciclo = ε₁₀ / σ, com ε adimensional e σ = 0,1 ou 3,2 kPa (eq. 8 e 10; com recuperação negativa usa-se ε₁, eq. 9 e 11); " +
        "R100, R3200, Jnr100 e Jnr3200 = médias dos 10 ciclos (eq. 5, 6, 12, 13); Rdiff = (R100 − R3200) × 100 / R100 (eq. 7); " +
        "Jnr,diff = (Jnr3200 − Jnr100) × 100 / Jnr100 (eq. 14). R e diferenças com aproximação de 0,1 %; Jnr com três algarismos significativos (seção 8). " +
        "As eq. 8 a 11 da norma escrevem a tensão em Pa (÷ 100 e ÷ 3200) com resultado em kPa⁻¹; adotou-se σ em kPa, coerente com a unidade e com a ASTM D7405.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Ligante asfáltico", P.material + (P.condicao === "original" ? " — original" : " — resíduo RTFOT")]);
        rows.push(["Temperatura do ensaio", ok(r.temp) ? fmt(r.temp, 1) + " °C" : "—"]);
        rows.push(["R100 — recuperação a 0,1 kPa (8.3)", ok(r.R100) ? fmt(r.R100, 1) + " %" : "—"]);
        rows.push(["R3200 — recuperação a 3,2 kPa (8.4)", ok(r.R3200) ? fmt(r.R3200, 1) + " %" : "—"]);
        rows.push(["Rdiff (8.5)", ok(r.Rdiff) ? fmt(r.Rdiff, 1) + " %" : "—"]);
        rows.push(["Jnr100 — compliância não recuperável a 0,1 kPa (8.6)", sig3(r.J100) + " kPa⁻¹"]);
        rows.push(["Jnr3200 — compliância não recuperável a 3,2 kPa (8.7)", sig3(r.J3200) + " kPa⁻¹"]);
        rows.push(["Jnr,diff (8.8)", ok(r.Jdiff) ? fmt(r.Jdiff, 1) + " %" : "—"]);
        if (r.proj.length) rows.push(["Limites do projeto", r.proj.map(function (x) { return x[0] + (x[1] ? " — atende" : " — NÃO ATENDE"); }).join("; ")]);
        if (r.m332) rows.push(["Classificação AASHTO M 332 (informativa)", r.m332.grau ? "grau " + r.m332.grau + " (tráfego " + r.m332.nome + ")" +
          (r.m332.diffOk === false ? " — Jnr,diff > 75 %" : "") + (r.m332.elastica === null ? "" : "; resposta elástica " + (r.m332.elastica ? "acima" : "abaixo") + " da curva R3,2 ≥ " + fmt(r.m332.curva, 1) + " %") : "sem grau (Jnr3200 > 4,5 kPa⁻¹)"]);
        r.rep.forEach(function (x) { rows.push(["Repetibilidade — " + x[0], "diferença de " + fmt(x[1], 1) + " % da média" + (ok(x[2]) ? " (máx. " + fmt(x[2], 1) + " %, Tabela 1" + (x[3] ? ", " + x[3] : "") + ")" : " — " + x[3])]); });
        return rows;
      },
    },
    exemplos: [
      { nome: "CAP 60/85-E (resíduo RTFOT) a 64 °C — com classificação informativa e repetição", dados: function () {
        return { ident: { registro: "EX-MSCR-001", data: "2026-03-10", obra: "Obra A", origem: "Distribuidora A", camada: "CAP 60/85-E — resíduo RTFOT" },
          params: { material: "CAP 60/85-E", condicao: "rtfot", temp: "64,0", unidade: "pct", tempo: "300", classif: "m332", jnrMax: "1,0", rMin: "50", jnrRep: "0,428", rRep: "61,0" },
          c01: linhas(["30,294 42,244 33,346", "33,346 45,250 36,439", "36,439 48,480 39,536", "39,536 51,591 42,656", "42,656 54,787 45,736",
            "45,736 57,851 48,916", "48,916 61,130 52,122", "52,122 64,303 55,326", "55,326 67,584 58,551", "58,551 70,913 61,754"]),
          c32: linhas(["61,75 403,55 189,70", "189,70 530,24 320,26", "320,26 663,53 450,66", "450,66 794,47 582,89", "582,89 929,38 716,87",
            "716,87 1062,53 849,03", "849,03 1196,73 978,94", "978,94 1327,15 1113,01", "1113,01 1461,87 1246,71", "1246,71 1596,45 1380,01"]) };
      } },
      { nome: "CAP 50/70 (resíduo RTFOT) a 64 °C — recuperação negativa em ciclos, reprovado no limite do projeto", dados: function () {
        return { ident: { registro: "EX-MSCR-002", data: "2026-03-12", obra: "Obra B", origem: "Distribuidora C", camada: "CAP 50/70 — resíduo RTFOT" },
          params: { material: "CAP 50/70", condicao: "rtfot", temp: "64,0", unidade: "pct", classif: "m332", jnrMax: "2,0" },
          c01: linhas(["300,248 333,059 330,872", "330,872 363,773 361,896", "361,896 394,868 392,432", "392,432 425,437 423,596", "423,596 456,904 454,526",
            "454,526 487,783 485,737", "485,737 519,394 517,184", "517,184 550,718 548,427", "548,427 582,358 580,335", "580,335 614,373 612,652"]),
          c32: linhas(["612,65 1716,33 1696,62", "1696,62 2806,14 2804,83", "2804,83 3909,05 3889,63", "3889,63 5005,72 4988,52", "4988,52 6108,48 6088,75",
            "6088,75 7205,76 7205,58", "7205,58 8327,91 8336,02", "8336,02 9465,33 9444,32", "9444,32 10570,34 10547,85", "10547,85 11673,31 11658,32"]) };
      } },
    ],
  };
  // "ε₀ εc εr" -> {e0, ec, er}
  function linhas(arr) { return arr.map(function (s) { var v = s.split(" "); return { e0: v[0], ec: v[1], er: v[2] }; }); }
})();
