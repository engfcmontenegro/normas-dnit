/*
 * Ficha: DNER-PRO 277/97 — Metodologia para controle estatístico de obras e serviços (amostragem variável).
 * Registra-se em window.FE (usa FE.aceitacao: A.estatistica / A.coefK / parecer).
 *
 * O que a PRO manda (seções do PDF):
 *   4.1   riscos α (Executante), β (DNER), p1 (qualidade aceitável), p2 (qualidade inaceitável).
 *   4.2.2 n = [1 + k²/2]·[(Zα + Zβ)/(Z1 − Z2)]²;  k = (Zα·Z2 + Zβ·Z1)/(Zα + Zβ)  (Z da normal, 4.2.4).
 *   4.3   X̄ e s (n − 1); valor mínimo: X̄ − ks ≥ mín. aceita; máximo: X̄ + ks ≤ máx.; entre mínimo e máximo: os dois.
 *   4.4   curva característica de operação: L(p) = P{t ≥ (k − Zp)/√(1/n + k²/2n)}, t normal reduzida;
 *         L(p1) = 1 − α, L(p2) = β.
 *   5.1   exemplo: α = β = 0,10, p1 = 0,05, p2 = 0,25 → Zα = Zβ = 1,28, Z1 = 1,64, Z2 = 0,67 → k = 1,155, n = 11,6 ≅ 12.
 *   5.2.1 curva do exemplo: L(0,02) = 0,99; L(0,05) = 0,90; L(0,10) = 0,63; L(0,15) = 0,38; L(0,20) = 0,20; L(0,25) = 0,10; L(0,30) = 0,04.
 *   5.3.2 segmentos controlados de 100 a 500 m.
 *   6.1   Tabela 1 (β = 10 %, p1 = 5 %, p2 = 25 %): n = 5 … 10, 12 … 17, 19, 21 (sem n = 11, 18, 20);
 *         Tabela 2 (drenagem; β = 10 %, p1 = 5 %, p2 = 30 %): n = 5 … 13, 15.
 *   6.2   critério de aceitação (igual a 4.3).  6.3 OAE e pavimentos de concreto: ABNT (fora desta ficha).
 * n fora da tabela: k do maior n tabelado abaixo (mais exigente), como em FE.aceitacao.coefK; n acima do último: k do último.
 * A tabela A.K_DNIT de es-comum.js (ES do DNIT) é a Tabela 1 da PRO 277 com n = 11 (k = 1,19; α = 0,13) a mais —
 * a ficha usa a tabela da PRO e mostra a conferência.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-pro-277-97";
  var TAB1 = [[5, 1.55, 0.45], [6, 1.41, 0.35], [7, 1.36, 0.30], [8, 1.31, 0.25], [9, 1.25, 0.19], [10, 1.21, 0.15], [12, 1.16, 0.10],
    [13, 1.13, 0.08], [14, 1.11, 0.06], [15, 1.10, 0.05], [16, 1.08, 0.04], [17, 1.06, 0.03], [19, 1.04, 0.02], [21, 1.01, 0.01]];
  var TAB2 = [[5, 1.32, 0.30], [6, 1.26, 0.25], [7, 1.15, 0.16], [8, 1.14, 0.15], [9, 1.05, 0.08], [10, 1.03, 0.06], [11, 0.99, 0.04],
    [12, 0.97, 0.03], [13, 0.95, 0.02], [15, 0.92, 0.01]];
  var CCO_NORMA = [[0.02, 0.99], [0.05, 0.90], [0.10, 0.63], [0.15, 0.38], [0.20, 0.20], [0.25, 0.10], [0.30, 0.04]];

  // ---- distribuição normal ----
  function Phi(x) {  // Φ(x), erro < 1e-7 (Abramowitz-Stegun 26.2.17 via erfc)
    var t = 1 / (1 + 0.2316419 * Math.abs(x));
    var y = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    var p = 1 - Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) * y;
    return x >= 0 ? p : 1 - p;
  }
  function Zsup(p) {  // Z tal que P(t > Z) = p (quantil superior; algoritmo de Acklam)
    var q = 1 - p;
    if (!(q > 0 && q < 1)) return NaN;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var dd = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var pl = 0.02425, x, r;
    if (q < pl) { r = Math.sqrt(-2 * Math.log(q)); x = (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((dd[0] * r + dd[1]) * r + dd[2]) * r + dd[3]) * r + 1); }
    else if (q <= 1 - pl) { r = q - 0.5; var r2 = r * r; x = (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1); }
    else { r = Math.sqrt(-2 * Math.log(1 - q)); x = -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((dd[0] * r + dd[1]) * r + dd[2]) * r + dd[3]) * r + 1); }
    return x;
  }
  // L(p) (4.4.1)
  function Lp(p, n, k) { var z = Zsup(p), sg = Math.sqrt(1 / n + k * k / (2 * n)); return ok(z) ? Phi((z - k) / sg) : p <= 0 ? 1 : 0; }
  function r2(x) { return Math.round(x * 100) / 100; }
  // plano (4.2.2)
  function plano(al, be, p1, p2, arred) {
    var Za = Zsup(al), Zb = Zsup(be), Z1 = Zsup(p1), Z2 = Zsup(p2);
    if (arred) { Za = r2(Za); Zb = r2(Zb); Z1 = r2(Z1); Z2 = r2(Z2); }
    var k = (Za * Z2 + Zb * Z1) / (Za + Zb);
    var n = (1 + k * k / 2) * Math.pow((Za + Zb) / (Z1 - Z2), 2);
    return { Za: Za, Zb: Zb, Z1: Z1, Z2: Z2, k: k, n: n, nInt: Math.ceil(n - 1e-9) };
  }
  function tabelaDe(P) { return P.plano === "t2" ? TAB2 : TAB1; }
  function riscosDe(P) {
    if (P.plano === "t2") return { al: NaN, be: 0.10, p1: 0.05, p2: 0.30 };
    if (P.plano === "calc") return { al: num(P.alfa), be: num(P.beta), p1: num(P.p1), p2: num(P.p2) };
    return { al: NaN, be: 0.10, p1: 0.05, p2: 0.25 };
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [];
    var R = riscosDe(P), pl = null;
    if (P.plano === "calc") {
      if ([R.al, R.be, R.p1, R.p2].every(ok) && R.p1 < R.p2 && R.al > 0 && R.al < 0.5 && R.be > 0 && R.be < 0.5) pl = plano(R.al, R.be, R.p1, R.p2, P.zArred !== "nao");
      else avisos.push("Plano próprio: informe 0 < α, β < 0,5 e p1 < p2 (4.1).");
    }
    var casas = ok(num(P.casas)) ? num(P.casas) : 1, unid = P.unidade || "";
    var pts = (d.am || []).map(function (c, i) { return { v: num(c.v), est: c.est || "", rot: "amostra " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
    var n = pts.length;
    var lmin = P.limite === "max" ? NaN : num(P.lmin), lmax = P.limite === "min" ? NaN : num(P.lmax);
    var cfg = pl ? { k: pl.k, nMin: 2 } : { tabelaK: tabelaDe(P) };
    var e = A.estatistica(pts, lmin, lmax, cfg);
    var K = pl ? { k: pl.k, exato: true, nTab: n } : A.coefK(n, { tabelaK: tabelaDe(P) });
    var k = K ? K.k : NaN;
    var G = "Controle estatístico (4.3 / 6.2)";
    var l = A.linha({ id: "est", grupo: G, criterio: (P.grandeza || "Valor controlado") + (unid ? " (" + unid + ")" : ""), secao: "4.3 / 6.2", unid: unid, casas: casas,
      n: n, media: n ? e.X : NaN, s: n ? e.s : NaN, k: k, lim: { min: lmin, max: lmax }, inf: e.inf, sup: e.sup, exigido: A.txtLimites(lmin, lmax, casas, unid) });
    if (!ok(lmin) && !ok(lmax)) A.marcar(l, "pendente", "informe o valor mínimo e/ou máximo especificado");
    if (!n) A.marcar(l, "sem_dados", "sem valores");
    else if (!K) A.marcar(l, "pendente", "n = " + n + " < " + tabelaDe(P)[0][0] + ": a " + (P.plano === "t2" ? "Tabela 2" : "Tabela 1") + " não dá k — amplie a amostra");
    else {
      var falhas = [];
      if (ok(lmin) && e.inf < lmin - 1e-9) falhas.push("X̄ − ks = " + fmt(e.inf, casas + 1) + " < " + fmt(lmin, casas));
      if (ok(lmax) && e.sup > lmax + 1e-9) falhas.push("X̄ + ks = " + fmt(e.sup, casas + 1) + " > " + fmt(lmax, casas));
      if (falhas.length) A.marcar(l, "nao_conforme", falhas.join("; ") + " — rejeita-se o serviço (6.2)");
      else if (ok(lmin) || ok(lmax)) l.motivo = "aceita-se o serviço (6.2)";
      if (!K.exato) A.marcar(l, "ressalva", n > tabelaDe(P)[tabelaDe(P).length - 1][0] ? "n = " + n + " acima do último n tabelado: k = " + fmt(k, 2) + " (de n = " + K.nTab + ")" :
        "n = " + n + " não tabelado: k de n = " + K.nTab + " (k = " + fmt(k, 2) + ", mais exigente)");
    }
    l.resultado = n ? "n = " + n + " · X̄ = " + fmt(e.X, casas + 1) + " · s = " + fmt(e.s, casas + 2) + (ok(k) ? " · k = " + fmt(k, pl ? 3 : 2) : "") +
      (ok(lmin) && ok(k) ? " · X̄ − ks = " + fmt(e.inf, casas + 1) : "") + (ok(lmax) && ok(k) ? " · X̄ + ks = " + fmt(e.sup, casas + 1) : "") : "—";
    linhas.push(l);
    if (pl) {
      var lt = A.linha({ id: "tam", grupo: G, criterio: "Tamanho da amostra × plano (4.2.2)", secao: "4.2.2", exigido: "n ≥ " + pl.nInt, resultado: "n = " + n, n: n });
      if (n && n < pl.nInt) A.marcar(lt, "ressalva", "amostra menor que a do plano: o risco α efetivo fica maior (ver curva CCO)");
      linhas.push(lt);
    }
    var ext = num(P.extensao);
    if (ok(ext)) {
      var lx = A.linha({ id: "ext", grupo: G, criterio: "Extensão do segmento controlado", secao: "5.3.2", exigido: "100 a 500 m (referência)", resultado: fmt(ext, 0) + " m", n: 1 });
      if (ext < 100 || ext > 500) A.marcar(lx, "ressalva", "fora da faixa usual de 100 a 500 m");
      linhas.push(lx);
    }
    var fora = n ? e.fora || [] : [];
    if (fora.length && l.situacao !== "nao_conforme") avisos.push(fora.length + " valor(es) individual(is) fora do limite (" + fora.map(function (p) { return fmt(p.v, casas) + (p.est ? " — " + p.est : ""); }).join("; ") + "): a PRO 277 decide pelo critério estatístico; a ES do serviço pode exigir correção local.");
    // riscos efetivos do plano usado
    var nC = n || (pl ? pl.nInt : NaN), kC = ok(k) ? k : pl ? pl.k : NaN;
    var alfaEf = ok(nC) && ok(kC) ? 1 - Lp(R.p1, nC, kC) : NaN, betaEf = ok(nC) && ok(kC) ? Lp(R.p2, nC, kC) : NaN;
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "SERVIÇO ACEITO", texto: "Critério estatístico da DNER-PRO 277/97 atendido (6.2)." },
      RESSALVA: { titulo: "SERVIÇO ACEITO COM RESSALVA", texto: "Critério estatístico atendido; há pontos a documentar." },
      PENDENTE: { titulo: "CONTROLE INCOMPLETO", texto: "Faltam valores, limites ou amostra mínima para decidir." },
      REJEITADO: { titulo: "SERVIÇO REJEITADO", texto: "X̄ ∓ ks fora do valor especificado (6.2)." } } });
    return { tab: {}, resultados: { linhas: linhas, parecer: par, n: n, X: e.X, s: e.s, k: k, inf: e.inf, sup: e.sup, lmin: lmin, lmax: lmax, pl: pl, riscos: R,
      alfaEf: alfaEf, betaEf: betaEf, nC: nC, kC: kC, casas: casas, unid: unid }, avisos: avisos };
  }

  // conferência: Tabela 1 × FE.aceitacao.K_DNIT e riscos recalculados pela 4.4
  function htmlConferencia(r, relat) {
    var cls = relat ? "gr" : "fe-resumo", T = r.riscos.p2 >= 0.3 ? TAB2 : TAB1, p2 = T === TAB2 ? 0.30 : 0.25;
    var kd = {};
    (A.K_DNIT || []).forEach(function (x) { kd[x[0]] = x; });
    var h = '<table class="' + cls + '"><thead><tr><th>n</th><th>k (PRO 277)</th><th>α (PRO 277)</th><th>α = 1 − L(0,05)</th><th>β = L(' + fmt(p2, 2) + ")</th>" +
      (T === TAB1 ? "<th>k em es-comum (A.K_DNIT)</th>" : "") + "</tr></thead><tbody>";
    var ns = T.map(function (x) { return x[0]; });
    if (T === TAB1) Object.keys(kd).forEach(function (nn) { if (ns.indexOf(+nn) < 0) ns.push(+nn); });
    ns.sort(function (a, b) { return a - b; }).forEach(function (nn) {
      var x = T.filter(function (t) { return t[0] === nn; })[0], kk = kd[nn];
      h += "<tr><td>" + nn + "</td><td>" + (x ? fmt(x[1], 2) : "—") + "</td><td>" + (x ? fmt(x[2], 2) : "—") + "</td><td>" + (x ? fmt(1 - Lp(0.05, nn, x[1]), 2) : "—") +
        "</td><td>" + (x ? fmt(Lp(p2, nn, x[1]), 2) : "—") + "</td>" + (T === TAB1 ? "<td>" + (kk ? fmt(kk[1], 2) + (x && Math.abs(kk[1] - x[1]) < 1e-9 ? " ✓" : " (só nas ES do DNIT, α = " + fmt(kk[2], 2) + ")") : "—") + "</td>" : "") + "</tr>";
    });
    return h + "</tbody></table>";
  }
  function htmlPlano(r, relat) {
    var cls = relat ? "gr" : "fe-resumo", pl = r.pl, R = r.riscos;
    if (!pl) return '<p class="nota">Plano da ' + (R.p2 >= 0.3 ? "Tabela 2 (drenagem: β = 10 %, p1 = 5 %, p2 = 30 %)" : "Tabela 1 (β = 10 %, p1 = 5 %, p2 = 25 %)") +
      ". Riscos efetivos com n = " + (r.nC || "—") + ", k = " + fmt(r.kC, 2) + ": α = 1 − L(p1) = " + fmt(r.alfaEf, 3) + " · β = L(p2) = " + fmt(r.betaEf, 3) + " (4.4.2).</p>";
    var rows = [["α · β · p1 · p2", [R.al, R.be, R.p1, R.p2].map(function (x) { return fmt(x, 2); }).join(" · ")],
      ["Zα · Zβ · Z1 · Z2 (4.2.4)", [pl.Za, pl.Zb, pl.Z1, pl.Z2].map(function (x) { return fmt(x, 4); }).join(" · ")],
      ["k = (Zα·Z2 + Zβ·Z1)/(Zα + Zβ) (4.2.2)", fmt(pl.k, 3)], ["n = [1 + k²/2]·[(Zα + Zβ)/(Z1 − Z2)]² (4.2.2)", fmt(pl.n, 2) + " → " + pl.nInt],
      ["Riscos efetivos com n = " + (r.nC || "—") + " (4.4.2)", "α = " + fmt(r.alfaEf, 3) + " · β = " + fmt(r.betaEf, 3)]];
    return '<table class="' + cls + '"><tbody>' + rows.map(function (x) { return '<tr><td style="text-align:left">' + x[0] + "</td><td>" + x[1] + "</td></tr>"; }).join("") + "</tbody></table>";
  }
  function graficos(calc, d, opt) {
    opt = opt || {};
    var r = calc.resultados, out = [];
    if (r.n) {
      var pts = (d.am || []).map(function (c, i) { return { x: i + 1, y: num(c.v), fora: false }; }).filter(function (p) { return ok(p.y); });
      var lin = [];
      if (ok(r.lmin)) lin.push({ y: r.lmin, tipo: "lim", txt: "mín. " + fmt(r.lmin, r.casas) });
      if (ok(r.lmax)) lin.push({ y: r.lmax, tipo: "lim", txt: "máx. " + fmt(r.lmax, r.casas) });
      lin.push({ y: r.X, tipo: "med", txt: "X̄ " + fmt(r.X, r.casas + 1) });
      if (ok(r.k) && ok(r.lmin)) lin.push({ y: r.inf, tipo: "ks", txt: "X̄ − ks" });
      if (ok(r.k) && ok(r.lmax)) lin.push({ y: r.sup, tipo: "ks", txt: "X̄ + ks" });
      pts.forEach(function (p) { p.fora = (ok(r.lmin) && p.y < r.lmin) || (ok(r.lmax) && p.y > r.lmax); });
      out.push(A.grafico("Valores da amostra" + (r.unid ? " (" + r.unid + ")" : ""), pts, lin, opt, "idx"));
    }
    // curva característica de operação
    if (ok(r.nC) && ok(r.kC)) {
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff", cor2 = imp ? "#c0392b" : "#e5534b";
      var W = 560, H = 240, m = { l: 44, r: 14, t: 22, b: 36 }, pmax = 0.5;
      var X = function (p) { return m.l + p / pmax * (W - m.l - m.r); }, Y = function (v) { return H - m.b - v * (H - m.t - m.b); };
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
      s += '<text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">Curva característica de operação L(p) — n = ' + r.nC + ", k = " + fmt(r.kC, 3) + " (4.4)</text>";
      for (var g = 0; g <= 10; g += 2) s += '<line x1="' + m.l + '" y1="' + Y(g / 10) + '" x2="' + (W - m.r) + '" y2="' + Y(g / 10) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 4) + '" y="' + (Y(g / 10) + 3) + '" text-anchor="end" fill="' + txt + '">' + fmt(g / 10, 1) + "</text>";
      for (var gx = 0; gx <= pmax + 1e-9; gx += 0.05) s += '<text x="' + X(gx) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + fmt(gx, 2) + "</text>";
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.6"/>';
      var dd = "";
      for (var p = 0.002; p <= pmax; p += 0.004) dd += (dd ? "L" : "M") + X(p).toFixed(1) + " " + Y(Lp(p, r.nC, r.kC)).toFixed(1);
      s += '<path d="' + dd + '" fill="none" stroke="' + cor + '" stroke-width="1.5"/>';
      [[r.riscos.p1, "p1"], [r.riscos.p2, "p2"]].forEach(function (q) {
        if (!ok(q[0])) return;
        var v = Lp(q[0], r.nC, r.kC);
        s += '<line x1="' + X(q[0]) + '" y1="' + Y(0) + '" x2="' + X(q[0]) + '" y2="' + Y(v) + '" stroke="' + cor2 + '" stroke-dasharray="3 3"/><circle cx="' + X(q[0]) + '" cy="' + Y(v) + '" r="3" fill="' + cor2 + '"/>' +
          '<text x="' + (X(q[0]) + 5) + '" y="' + (Y(v) - 4) + '" fill="' + cor2 + '">' + q[1] + ": L = " + fmt(v, 2) + "</text>";
      });
      s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 5) + '" text-anchor="middle" fill="' + txt + '">p — fração de “defeitos” do serviço</text>';
      out.push(s + "</svg>");
    }
    return out;
  }

  function valores(v) { return v.map(function (x, i) { return { est: x[0], v: String(x[1]).replace(".", ",") }; }); }

  FE.FICHAS[ID] = {
    titulo: "Controle estatístico por amostragem variável",
    lote: true,
    resumo: "Plano de amostragem (n e k pelos riscos α, β, p1, p2 — 4.2.2, ou pelas Tabelas 1 e 2), X̄, s, decisão X̄ ∓ ks × valor especificado (6.2) e curva característica de operação L(p) (4.4).",
    rotuloImportar: function (r) { return (r.n ? "n = " + r.n + " · X̄ = " + fmt(r.X, 2) + " · k = " + fmt(r.k, 2) : "—") + (r.parecer ? " · " + r.parecer.parecer : ""); },
    blocos: [],
    params: [
      { k: "grandeza", r: "Grandeza controlada", ph: "ex.: grau de compactação" },
      { k: "unidade", r: "Unidade", ph: "ex.: %" },
      { k: "casas", r: "Casas decimais dos valores", ph: "1" },
      { k: "plano", r: "Plano de amostragem", tipo: "select", recarrega: true, opcoes: [["t1", "Tabela 1 — serviços em geral (β = 10 %, p1 = 5 %, p2 = 25 %)"],
        ["t2", "Tabela 2 — obras de drenagem (β = 10 %, p1 = 5 %, p2 = 30 %)"], ["calc", "Plano próprio — n e k pelos riscos (4.2.2)"]] },
      { k: "alfa", r: "α — risco do Executante (4.1)", se: function (d) { return (d.params || {}).plano === "calc"; } },
      { k: "beta", r: "β — risco do DNER (4.1)", se: function (d) { return (d.params || {}).plano === "calc"; } },
      { k: "p1", r: "p1 — nível de qualidade aceitável (fração)", se: function (d) { return (d.params || {}).plano === "calc"; } },
      { k: "p2", r: "p2 — nível de qualidade inaceitável (fração)", se: function (d) { return (d.params || {}).plano === "calc"; } },
      { k: "zArred", r: "Valores de Z", tipo: "select", opcoes: [["sim", "Arredondados a 2 casas (como em 5.1.3)"], ["nao", "Exatos"]], se: function (d) { return (d.params || {}).plano === "calc"; } },
      { k: "limite", r: "Valor especificado (4.3 c / 6.2)", tipo: "select", recarrega: true, opcoes: [["min", "Mínimo"], ["max", "Máximo"], ["ambos", "Entre mínimo e máximo"]] },
      { k: "lmin", r: "Valor mínimo especificado", se: function (d) { return (d.params || {}).limite !== "max"; } },
      { k: "lmax", r: "Valor máximo especificado", se: function (d) { return (d.params || {}).limite !== "min"; } },
      { k: "extensao", r: "Extensão do segmento controlado (m) — opcional", dica: "5.3.2: 100 a 500 m" },
    ],
    padrao: { plano: "t1", alfa: "0,10", beta: "0,10", p1: "0,05", p2: "0,25", zArred: "sim", limite: "min", casas: "1" },
    tabelas: function () {
      return [{ chave: "am", titulo: "Amostra (4.3 a)", rotulo: "Amostra", iniciais: 12, min: 1, dica: "um valor por unidade inspecionada, coletada aleatoriamente",
        linhas: [{ k: "est", r: "Estaca / local", texto: true }, { k: "v", r: "Valor Xi", u: "" }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(ok(r.X) ? fmt(r.X, r.casas + 1) : "—", "X̄ (n = " + r.n + ")") + A.cartao(ok(r.s) ? fmt(r.s, r.casas + 2) : "—", "s (n − 1)") +
        A.cartao(ok(r.k) ? fmt(r.k, r.pl ? 3 : 2) : "—", "k") + A.cartao(ok(r.k) ? (ok(r.lmin) ? fmt(r.inf, r.casas + 1) : "") + (ok(r.lmin) && ok(r.lmax) ? " / " : "") + (ok(r.lmax) ? fmt(r.sup, r.casas + 1) : "") : "—", "X̄ ∓ ks") + "</div>" +
        A.htmlCriterios(r.linhas, { estilo: "resultado" }) + '<h4 style="margin:12px 0 4px">Plano e riscos (4.2 / 4.4)</h4>' + htmlPlano(r) +
        '<h4 style="margin:12px 0 4px">Conferência da ' + (r.riscos.p2 >= 0.3 ? "Tabela 2" : "Tabela 1 com a tabela das ES do DNIT (es-comum)") + "</h4>" + htmlConferencia(r);
    },
    graficos: graficos,
    relatorio: {
      notas: "DNER-PRO 277/97: X̄ e s com n − 1 (4.3); valor mínimo: X̄ − ks ≥ mín.; máximo: X̄ + ks ≤ máx.; entre ambos: as duas condições (6.2). n e k: Tabela 1 (β = 10 %, p1 = 5 %, p2 = 25 %), " +
        "Tabela 2 (drenagem, p2 = 30 %) ou 4.2.2 (plano próprio). n não tabelado: k do maior n tabelado abaixo. L(p) = Φ[(Zp − k)/√(1/n + k²/2n)] (4.4.1); α = 1 − L(p1), β = L(p2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        return [["Parecer", r.parecer.titulo], ["Grandeza", (P.grandeza || "—") + (r.unid ? " (" + r.unid + ")" : "")], ["Valor especificado", A.txtLimites(r.lmin, r.lmax, r.casas, r.unid)],
          ["n · X̄ · s · k", r.n + " · " + fmt(r.X, r.casas + 1) + " · " + fmt(r.s, r.casas + 2) + " · " + fmt(r.k, r.pl ? 3 : 2)],
          ["X̄ − ks / X̄ + ks", (ok(r.lmin) ? fmt(r.inf, r.casas + 1) : "—") + " / " + (ok(r.lmax) ? fmt(r.sup, r.casas + 1) : "—")],
          ["Riscos efetivos (4.4.2)", "α = " + fmt(r.alfaEf, 3) + " · β = " + fmt(r.betaEf, 3)]];
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }) + "<h2>Plano e riscos</h2>" + htmlPlano(r, true);
      },
    },
    exemplos: [
      { nome: "Plano do exemplo da seção 5 (α = β = 0,10; p1 = 0,05; p2 = 0,25 → k = 1,155, n = 12) — grau de compactação aceito", dados: function () {
        return { ident: { registro: "CE-277-01", data: "2026-05-12", obra: "Obra A", trecho: "Aterro — est. 40 a 55", camada: "Corpo de aterro" },
          params: { grandeza: "Grau de compactação", unidade: "%", casas: "1", plano: "calc", alfa: "0,10", beta: "0,10", p1: "0,05", p2: "0,25", zArred: "sim", limite: "min", lmin: "100", extensao: "300" },
          am: valores([["40", 101.8], ["41+10", 102.6], ["43", 100.9], ["44+10", 103.1], ["46", 101.4], ["47+10", 102.2], ["49", 100.6], ["50+10", 101.9], ["52", 102.8], ["53", 101.1], ["54", 102.4], ["55", 101.7]]) };
      } },
      { nome: "Tabela 1, n = 11 (k de n = 10) — espessura com mínimo e máximo, rejeitada", dados: function () {
        return { ident: { registro: "CE-277-02", data: "2026-05-20", obra: "Obra B", trecho: "Base — est. 10 a 20", camada: "Base granular" },
          params: { grandeza: "Espessura da camada", unidade: "cm", casas: "1", plano: "t1", limite: "ambos", lmin: "13,5", lmax: "16,5", extensao: "200" },
          am: valores([["10", 15.2], ["11", 14.1], ["12", 16.9], ["13", 12.9], ["14", 15.8], ["15", 14.6], ["16", 16.9], ["17", 15.1], ["18", 13.9], ["19", 15.5], ["20", 14.8]]) };
      } },
    ],
  };
})();
