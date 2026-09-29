/*
 * Ficha: DNIT 132/2010-PRO — Calibração da célula de carga e dos sensores de deflexão do FWD.
 * Registra-se em window.FE (usa FE.aceitacao para critérios e parecer).
 *
 * O que a PRO manda (seções do PDF):
 *   4.1    recinto a 10–38 °C e 40–90 % de umidade relativa.  5.2 b célula de carga de referência calibrada nos últimos 12 meses.
 *   5.1 d  cargas dentro de ± 10 % de 27, 40, 53 e 71 kN (3 a 4 níveis; máxima 72 a 88 kN).
 *   5.3 f–g LVDT: micrômetro de 7,0 a 3,0 mm a cada 0,5 mm × saída em bits; regressão Y = mX + b (eq. 1), Y em µm;
 *          m ≈ −1,00 µm/bit; erro padrão da inclinação < 0,0010 (senão, repetir). Calibrar no início do dia e após 4 h.
 *   6.1/6.2 célula de carga: 5 quedas válidas em cada uma das 4 alturas (20 pares); regressão pela origem Y = mX (eq. 2),
 *          Y = referência, X = FWD; novo fator = fator antigo × m. Duas calibrações: diferença ≤ 0,003 → média;
 *          senão, terceira: desvio (n − 1) < 0,003 → média das três; senão, descartar tudo e repetir.
 *          Invalida (6.2 d): erro padrão de m > 0,0020; desvios-padrão das 5 leituras de uma altura (referência × FWD)
 *          diferindo por fator maior que 3; ruído excessivo nas alturas 2–4.
 *   6.3/6.4 sensores de deflexão: 20 pares LVDT × sensor, Y = mX (eq. 3); erro padrão < 0,0020; fator intermediário = antigo × m.
 *   7      calibração relativa (mensal ou após troca de sensor): n sensores rodados por n posições (n conjuntos), 5 quedas
 *          por conjunto; deflexões de 400 a 600 µm (7 d); análise de variância com fatores sensor, posição e conjunto (7.1.1);
 *          erro padrão de medição ≈ 2 µm ou menos (7.1.2); xi = média do sensor, xo = média geral, Ri = xo/xi (eq. 4);
 *          0,997 ≤ Ri ≤ 1,003: ajuste trivial (7.3 a); fator final = fator atual × Ri (7.3 c); fator final fora de
 *          0,98–1,02 indica sensor possivelmente danificado (Nota de 7.3).
 *   7.2.1  com calibração de referência: repetir; dois conjuntos de fatores a até 0,003 → média; senão, terceira.
 * Interpretações:
 *  - a ficha recebe, na calibração relativa, a média das 5 quedas de cada sensor em cada conjunto (quadrado latino:
 *    sensor i no conjunto j ocupa a posição ((i + j − 2) mod n) + 1 — rotação de uma posição por conjunto); a análise de
 *    variância é feita sobre essas médias (erro com (n − 1)(n − 2) graus de liberdade, F crítico a 5 %), e o "erro
 *    padrão de medição" é a raiz do quadrado médio do erro dessas médias.
 *  - 7.2.1 c diz que, com desvio-padrão dos três resultados inferior a 0,003, "o procedimento deve ser repetido" —
 *    contradiz 6.2 c e a AASHTO R32; a ficha faz a média quando o desvio é < 0,003 e pede repetição quando é maior.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ID = "dnit-132-2010-pro";
  var NIVEIS = [27, 40, 53, 71];
  var MICRO = [7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0];
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];

  function desvio(v) { var m = media(v); return v.length > 1 ? Math.sqrt(v.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN; }
  // regressão com intercepto: {m, b, se}
  function regLin(xs, ys) {
    var n = xs.length; if (n < 3) return null;
    var mx = media(xs), my = media(ys), sxx = 0, sxy = 0;
    xs.forEach(function (x, i) { sxx += (x - mx) * (x - mx); sxy += (x - mx) * (ys[i] - my); });
    if (!sxx) return null;
    var m = sxy / sxx, b = my - m * mx, sr = 0;
    xs.forEach(function (x, i) { sr += Math.pow(ys[i] - m * x - b, 2); });
    return { m: m, b: b, se: Math.sqrt(sr / (n - 2) / sxx), n: n };
  }
  // regressão pela origem ("até zero"): Y = mX; erro padrão de m = √[Σ(Y − mX)²/(n − 1) / ΣX²]
  function regOrigem(xs, ys) {
    var n = xs.length; if (n < 2) return null;
    var sxx = 0, sxy = 0, sr = 0;
    xs.forEach(function (x, i) { sxx += x * x; sxy += x * ys[i]; });
    if (!sxx) return null;
    var m = sxy / sxx;
    xs.forEach(function (x, i) { sr += Math.pow(ys[i] - m * x, 2); });
    return { m: m, se: Math.sqrt(sr / (n - 1) / sxx), n: n };
  }
  // ---- distribuição F (beta incompleta regularizada) ----
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
    var s = 1.000000000190015; for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; var h = d;
    for (var m = 1; m <= 200; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function Fcdf(f, d1, d2) { return f <= 0 ? 0 : ibeta(d1 * f / (d1 * f + d2), d1 / 2, d2 / 2); }
  function Fcrit(d1, d2, alfa) { var lo = 0, hi = 100; for (var i = 0; i < 80; i++) { var mid = (lo + hi) / 2; if (Fcdf(mid, d1, d2) < 1 - alfa) lo = mid; else hi = mid; } return (lo + hi) / 2; }

  // ---- pares (20 quedas: altura h, queda q) ----
  function pares(c, pref) {
    var xs = [], ys = [], porH = {};
    for (var h = 1; h <= 4; h++) for (var q = 1; q <= 5; q++) {
      var y = num(c[pref + "r" + h + q]), x = num(c[pref + "f" + h + q]);
      if (ok(x) && ok(y)) { xs.push(x); ys.push(y); (porH[h] = porH[h] || { x: [], y: [] }); porH[h].x.push(x); porH[h].y.push(y); }
    }
    return { xs: xs, ys: ys, porH: porH };
  }
  function linhasPares(pref, rotRef, rotFwd, u) {
    var L = [];
    for (var h = 1; h <= 4; h++) {
      L.push({ grupo: "Altura " + h + (pref === "c" ? " (~" + NIVEIS[h - 1] + " kN)" : "") });
      for (var q = 1; q <= 5; q++) {
        L.push({ k: pref + "r" + h + q, r: "H" + h + " queda " + q + " — " + rotRef, u: u });
        L.push({ k: pref + "f" + h + q, r: "H" + h + " queda " + q + " — " + rotFwd, u: u });
      }
    }
    return L;
  }
  // verificações de uma regressão pela origem (6.2 d / 6.3 j)
  function avaliaPares(p, rot, lin, carga) {
    var reg = regOrigem(p.xs, p.ys), o = { reg: reg, avisos: [] };
    if (p.xs.length && p.xs.length < 20) o.avisos.push(rot + ": " + p.xs.length + " pares (a PRO usa 20: 5 quedas em 4 alturas)");
    Object.keys(p.porH).forEach(function (h) {
      var sr = desvio(p.porH[h].y), sf = desvio(p.porH[h].x);
      if (ok(sr) && ok(sf) && sr > 0 && sf > 0 && Math.max(sr / sf, sf / sr) > 3) o.avisos.push(rot + ", altura " + h + ": desvios-padrão das 5 leituras (referência " + fmt(sr, 2) + " × FWD " + fmt(sf, 2) + ") diferem por fator > 3 — calibração inválida");
      if (carga) {
        var mc = media(p.porH[h].y), alvo = NIVEIS[h - 1];
        if (ok(mc) && Math.abs(mc - alvo) > 0.1 * alvo + 1e-9) o.avisos.push(rot + ", altura " + h + ": carga média " + fmt(mc, 1) + " kN fora de " + alvo + " ± 10 % (5.1 d)");
      }
    });
    return o;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [], tab = {};
    var G0 = "Condições e LVDT (4 / 5)", G1 = "Célula de carga (6.1 / 6.2)", G2 = "Sensores — calibração de referência (6.3 / 6.4)", G3 = "Calibração relativa (7)";
    // ---- condições
    var T = num(P.temp), U = num(P.umid);
    var lc = A.linha({ id: "amb", grupo: G0, criterio: "Temperatura e umidade do recinto", secao: "4.1", exigido: "10 a 38 °C; 40 a 90 %", resultado: (ok(T) ? fmt(T, 0) + " °C" : "—") + " · " + (ok(U) ? fmt(U, 0) + " %" : "—"), n: ok(T) && ok(U) ? 1 : 0 });
    if (!ok(T) || !ok(U)) A.marcar(lc, "pendente", "informe temperatura e umidade");
    else if (T < 10 || T > 38 || U < 40 || U > 90) A.marcar(lc, "nao_conforme", "fora das condições de 4.1");
    linhas.push(lc);
    var dRef = P.refCal && (d.ident || {}).data ? (new Date(d.ident.data) - new Date(P.refCal)) / 864e5 : NaN;
    var lr = A.linha({ id: "ref", grupo: G0, criterio: "Célula de carga de referência calibrada (AASHTO R33)", secao: "5.2 b", exigido: "nos últimos 12 meses", resultado: ok(dRef) ? fmt(dRef / 30.44, 1) + " mês(es)" : "—", n: ok(dRef) ? 1 : 0 });
    if (!ok(dRef)) A.marcar(lr, "pendente", "informe a data de calibração da célula de referência e a data do ensaio");
    else if (dRef > 366) A.marcar(lr, "nao_conforme", "célula de referência com calibração vencida");
    linhas.push(lr);
    var lf = A.linha({ id: "filtro", grupo: G0, criterio: "Sem filtro de dados no FWD; quedas de aquecimento executadas", secao: "5.1 c / e", exigido: "sim", resultado: P.filtro === "sim" ? "sim" : P.filtro === "nao" ? "não" : "—", n: 1 });
    if (P.filtro === "nao") A.marcar(lf, "nao_conforme", "não atende"); else if (P.filtro !== "sim") A.marcar(lf, "pendente", "não verificado");
    linhas.push(lf);
    // LVDT
    var lvx = [], lvy = [];
    (d.lv || []).forEach(function (c) { var mm = num(c.mm), b = num(c.bits); if (ok(mm) && ok(b)) { lvx.push(b); lvy.push(mm * 1000); } });
    var rl = regLin(lvx, lvy);
    var ll = A.linha({ id: "lvdt", grupo: G0, criterio: "Calibração do LVDT: Y (µm) = m·X (bits) + b", secao: "5.3 f–g (eq. 1)", n: lvx.length, exigido: "m ≈ −1,00 µm/bit; erro padrão de m < 0,0010",
      resultado: rl ? "m = " + fmt(rl.m, 4) + " · b = " + fmt(rl.b, 1) + " · erro padrão = " + fmt(rl.se, 5) : "—" });
    if (!rl) A.marcar(ll, lvx.length ? "pendente" : "sem_dados", "leituras insuficientes (7,0 a 3,0 mm a cada 0,5 mm)");
    else {
      if (rl.se >= 0.0010) A.marcar(ll, "nao_conforme", "erro padrão ≥ 0,0010: repetir a calibração do LVDT");
      if (Math.abs(rl.m + 1) > 0.1) A.marcar(ll, "ressalva", "inclinação afastada de −1,00 µm/bit (critério da ficha: ± 0,10) — ajustar o ganho do condicionador (5.3 e)");
      if (lvx.length < 9) A.marcar(ll, "ressalva", lvx.length + " pontos (5.3 f: 9, de 7,0 a 3,0 mm)");
    }
    linhas.push(ll);

    // ---- célula de carga
    var cc = (d.cc || []).map(function (c, i) {
      var p = pares(c, "c"), a = avaliaPares(p, "Célula de carga — teste " + (i + 1), linhas, true), fa = num(c.fant);
      return { reg: a.reg, av: a.avisos, fa: fa, novo: a.reg && ok(fa) ? fa * a.reg.m : NaN };
    });
    tab.cc = cc.map(function (o) { return { m: o.reg ? o.reg.m : NaN, se: o.reg ? o.reg.se : NaN, novo: o.novo }; });
    var ccV = cc.filter(function (o) { return o.reg; }), mCC = NaN, fCC = NaN, regraCC = "";
    var lcc = A.linha({ id: "cc", grupo: G1, criterio: "Fator de ajuste m da célula de carga (Y = mX, eq. 2) e repetibilidade", secao: "6.2 a–d", n: ccV.length,
      exigido: "erro padrão ≤ 0,0020; 2 testes a até 0,003 ou 3 com desvio < 0,003" });
    if (!ccV.length) A.marcar(lcc, "sem_dados", "sem dados da célula de carga");
    else {
      ccV.forEach(function (o, i) { if (o.reg.se > 0.0020 + 1e-12) A.marcar(lcc, "nao_conforme", "teste " + (i + 1) + ": erro padrão " + fmt(o.reg.se, 4) + " > 0,0020 — repetir (6.2 d)"); o.av.forEach(function (t) { A.marcar(lcc, /inválida/.test(t) ? "nao_conforme" : "ressalva", t); }); });
      var ms = ccV.map(function (o) { return o.reg.m; });
      if (ms.length === 1) A.marcar(lcc, "pendente", "a calibração da célula é feita duas vezes (6.2 c)");
      else if (Math.abs(ms[0] - ms[1]) <= 0.003 + 1e-12) { mCC = (ms[0] + ms[1]) / 2; regraCC = "diferença " + fmt(Math.abs(ms[0] - ms[1]), 4) + " ≤ 0,003: média dos dois testes"; }
      else if (ms.length < 3) A.marcar(lcc, "pendente", "diferença " + fmt(Math.abs(ms[0] - ms[1]), 4) + " > 0,003: executar a terceira calibração (6.2 c)");
      else {
        var s3 = desvio(ms.slice(0, 3));
        if (s3 < 0.003) { mCC = media(ms.slice(0, 3)); regraCC = "desvio dos três " + fmt(s3, 4) + " < 0,003: média dos três"; }
        else A.marcar(lcc, "nao_conforme", "desvio dos três " + fmt(s3, 4) + " ≥ 0,003: descartar os fatores e repetir a calibração (6.2 c)");
      }
      var fa0 = ccV[0].fa;
      if (ok(mCC) && ok(fa0)) fCC = fa0 * mCC;
    }
    lcc.resultado = ccV.map(function (o, i) { return "T" + (i + 1) + ": m = " + fmt(o.reg.m, 4) + " (ep " + fmt(o.reg.se, 4) + ")"; }).join(" · ") + (ok(mCC) ? " → m = " + fmt(mCC, 4) + (ok(fCC) ? "; novo fator = " + fmt(fCC, 4) : "") + " (" + regraCC + ")" : "") || "—";
    linhas.push(lcc);

    // ---- sensores (referência)
    var sr = (d.sr || []).map(function (c, i) {
      var p = pares(c, "s"), a = avaliaPares(p, "Sensor " + (i + 1), linhas, false), fa = num(c.fant);
      return { reg: a.reg, av: a.avisos, fa: fa, novo: a.reg && ok(fa) ? fa * a.reg.m : NaN };
    });
    tab.sr = sr.map(function (o) { return { m: o.reg ? o.reg.m : NaN, se: o.reg ? o.reg.se : NaN, novo: o.novo }; });
    var srV = sr.filter(function (o) { return o.reg; });
    var lsr = A.linha({ id: "sr", grupo: G2, criterio: "Fatores de ajuste dos sensores (Y = mX, eq. 3)", secao: "6.4 a–c", n: srV.length, exigido: "erro padrão < 0,0020 em cada sensor",
      resultado: sr.map(function (o, i) { return o.reg ? "S" + (i + 1) + ": m = " + fmt(o.reg.m, 4) + (ok(o.novo) ? " → " + fmt(o.novo, 4) : "") : null; }).filter(Boolean).join(" · ") || "—" });
    if (!srV.length) A.marcar(lsr, P.escopo === "relativa" ? "nao_exigido" : "sem_dados", P.escopo === "relativa" ? "só calibração relativa" : "sem dados");
    sr.forEach(function (o, i) {
      if (!o.reg) return;
      if (o.reg.se >= 0.0020) A.marcar(lsr, "nao_conforme", "sensor " + (i + 1) + ": erro padrão " + fmt(o.reg.se, 4) + " ≥ 0,0020 — repetir a calibração de referência do sensor (6.4 c)");
      o.av.forEach(function (t) { A.marcar(lsr, /inválida/.test(t) ? "nao_conforme" : "ressalva", t); });
    });
    if (lsr.situacao === "nao_exigido") lsr.situacao = "informativo";
    linhas.push(lsr);

    // ---- calibração relativa
    var rl7 = d.rl || [], n = rl7.length, Y = [], rel = null;
    rl7.forEach(function (c) { var row = []; for (var j = 1; j <= n; j++) row.push(num(c["c" + j])); Y.push(row); });
    var completo = n >= 3 && Y.every(function (r) { return r.every(ok); });
    var tabRl = rl7.map(function () { return {}; });
    if (completo) {
      var xi = Y.map(function (r) { return media(r); }), xo = media(xi), all = [].concat.apply([], Y);
      var G = media(all), colM = [], posM = [];
      for (var j = 0; j < n; j++) { colM.push(media(Y.map(function (r) { return r[j]; }))); var pv = []; for (var i2 = 0; i2 < n; i2++) for (var j2 = 0; j2 < n; j2++) if ((i2 + j2) % n === j) pv.push(Y[i2][j2]); posM.push(media(pv)); }
      var ssT = all.reduce(function (s, v) { return s + (v - G) * (v - G); }, 0);
      var ssS = n * xi.reduce(function (s, v) { return s + (v - G) * (v - G); }, 0), ssC = n * colM.reduce(function (s, v) { return s + (v - G) * (v - G); }, 0), ssP = n * posM.reduce(function (s, v) { return s + (v - G) * (v - G); }, 0);
      var dfE = (n - 1) * (n - 2), ssE = Math.max(0, ssT - ssS - ssC - ssP), mse = ssE / dfE, fc = Fcrit(n - 1, dfE, 0.05);
      function F(ss) { return mse > 0 ? ss / (n - 1) / mse : Infinity; }
      rel = { xi: xi, xo: xo, Ri: xi.map(function (x) { return xo / x; }), mse: mse, epm: Math.sqrt(mse), fc: fc, Fs: F(ssS), Fc: F(ssC), Fp: F(ssP), dfE: dfE, min: Math.min.apply(null, all), max: Math.max.apply(null, all) };
      rel.fin = rel.Ri.map(function (R, i) { var fa = num(rl7[i].fatual); return ok(fa) ? fa * R : NaN; });
      rel.Rrep = rel.Ri.map(function (R, i) {
        var r2 = num(rl7[i].r2), r3 = num(rl7[i].r3);
        if (!ok(r2)) return { R: R, txt: "" };
        if (Math.abs(R - r2) <= 0.003 + 1e-12) return { R: (R + r2) / 2, txt: "média de 2" };
        if (!ok(r3)) return { R: NaN, txt: "fazer a 3ª" };
        var s3 = desvio([R, r2, r3]);
        return s3 < 0.003 ? { R: (R + r2 + r3) / 3, txt: "média de 3" } : { R: NaN, txt: "repetir (desvio ≥ 0,003)" };
      });
      tabRl = rel.Ri.map(function (R, i) { return { xi: rel.xi[i], Ri: R, fin: rel.fin[i], Rm: rel.Rrep[i].R }; });
    }
    tab.rl = tabRl;
    var l7 = A.linha({ id: "rel", grupo: G3, criterio: "Razões de ajuste Ri = xo/xi (eq. 4) e fatores finais", secao: "7.1.3 / 7.3", n: n,
      exigido: "0,997 ≤ Ri ≤ 1,003 (ajuste trivial); fator final 0,98 a 1,02",
      resultado: rel ? rel.Ri.map(function (R, i) { return "S" + (i + 1) + " " + fmt(R, 4); }).join(" · ") : "—" });
    var la = A.linha({ id: "anova", grupo: G3, criterio: "Análise de variância: sensor, posição e conjunto; erro padrão de medição", secao: "7.1.1 / 7.1.2", n: n, situacao: "conforme",
      exigido: "F < F crítico (5 %); erro ≈ 2 µm ou menor",
      resultado: rel ? "F sensor " + fmt(rel.Fs, 2) + " · posição " + fmt(rel.Fp, 2) + " · conjunto " + fmt(rel.Fc, 2) + " (F crít. " + fmt(rel.fc, 2) + ") · erro " + fmt(rel.epm, 2) + " µm" : "—" });
    if (!n) { l7.situacao = la.situacao = P.escopo === "referencia" ? "informativo" : "sem_dados"; if (P.escopo !== "referencia") { A.marcar(l7, "sem_dados", "sem calibração relativa"); } }
    else if (!rel) { A.marcar(l7, "pendente", "preencha as deflexões de todos os conjuntos (n sensores × n conjuntos, n ≥ 3)"); la.situacao = "pendente"; }
    else {
      var foraR = rel.Ri.map(function (R, i) { return [R, i]; }).filter(function (x) { return x[0] < 0.997 - 1e-12 || x[0] > 1.003 + 1e-12; });
      if (foraR.length) A.marcar(l7, "ressalva", "Ri fora de 0,997–1,003 (sensores " + foraR.map(function (x) { return x[1] + 1; }).join(", ") + "): repetir o processo; confirmado, ajustar todos os sensores e repetir a relativa para verificar (7.3 b–c)");
      rel.fin.forEach(function (f, i) { if (ok(f) && (f < 0.98 || f > 1.02)) A.marcar(l7, "nao_conforme", "sensor " + (i + 1) + ": fator final " + fmt(f, 4) + " fora de 0,98–1,02 — possivelmente danificado (Nota de 7.3)"); });
      rel.Rrep.forEach(function (x, i) { if (/3ª|repetir/.test(x.txt)) A.marcar(l7, "pendente", "sensor " + (i + 1) + ": " + x.txt + " (7.2.1)"); });
      if (rel.min < 400 || rel.max > 600) A.marcar(l7, "ressalva", "deflexões de " + fmt(rel.min, 0) + " a " + fmt(rel.max, 0) + " µm, fora de 400–600 µm (7 d)");
      if (rel.Fp > rel.fc) A.marcar(la, "ressalva", "posição significativa: suporte fora da vertical ou conexão frouxa — corrigir e repetir, salvo julgamento de que não tem significado físico (7.1.1 b)");
      if (rel.Fc > rel.fc) A.marcar(la, "ressalva", "conjunto significativo: condicionar o local e repetir (7.1.1 c)");
      if (rel.Fs > rel.fc) la.motivo = "sensor significativo: ajustar os fatores de todos os sensores (7.1.1 a)";
      if (rel.epm > 2) A.marcar(la, "ressalva", "erro padrão " + fmt(rel.epm, 2) + " µm > 2 µm (7.1.2)");
    }
    linhas.push(l7); linhas.push(la);

    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "FWD CALIBRADO", texto: "Fatores de calibração obtidos conforme a DNIT 132/2010-PRO: inserir no programa do deflectômetro." },
      RESSALVA: { titulo: "FWD CALIBRADO COM RESSALVA", texto: "Fatores obtidos; há condições a avaliar ou repetir (ver motivos)." },
      PENDENTE: { titulo: "CALIBRAÇÃO INCOMPLETA", texto: "Faltam testes, repetições ou registros exigidos." },
      REJEITADO: { titulo: "CALIBRAÇÃO INVÁLIDA", texto: "Critério de validade da PRO não atendido: identificar a causa, corrigir e repetir." } } });
    return { tab: tab, resultados: { linhas: linhas, parecer: par, rl: rl, mCC: mCC, fCC: fCC, sr: sr, rel: rel }, avisos: avisos };
  }

  // ---- exemplos (dados gerados, determinísticos) ----
  function ruido(i, a) { var x = Math.sin(i * 12.9898 + 1.7) * 43758.5453; return (x - Math.floor(x) - 0.5) * a; }
  function colCarga(fator, m, amp, seed) {
    var c = { fant: String(fator).replace(".", ",") };
    for (var h = 1; h <= 4; h++) for (var q = 1; q <= 5; q++) {
      var k = seed * 31 + h * 7 + q, ref = NIVEIS[h - 1] * (1 + ruido(k, 0.03));
      c["cr" + h + q] = ref.toFixed(2).replace(".", ","); c["cf" + h + q] = (ref / m + ruido(k + 3, amp)).toFixed(2).replace(".", ",");
    }
    return c;
  }
  function colSensor(fator, m, amp, seed) {
    var c = { fant: String(fator).replace(".", ",") }, D = [180, 270, 360, 480];
    for (var h = 1; h <= 4; h++) for (var q = 1; q <= 5; q++) {
      var k = seed * 29 + h * 5 + q, ref = D[h - 1] * (1 + ruido(k, 0.04));
      c["sr" + h + q] = ref.toFixed(1).replace(".", ","); c["sf" + h + q] = (ref / m + ruido(k + 1, amp)).toFixed(1).replace(".", ",");
    }
    return c;
  }
  function colsLVDT() { return MICRO.map(function (mm, i) { return { mm: String(mm).replace(".", ","), bits: String(Math.round(-(mm - 5) * 1000 / 1.003 + ruido(i, 0.6))) }; }); }
  function relativa(ganhos, amp, tend) {
    var n = ganhos.length;
    return ganhos.map(function (g, i) {
      var c = { fatual: "1,000" };
      for (var j = 1; j <= n; j++) c["c" + j] = (500 * (1 + (j - 4) * (tend || 0)) / g + ruido(i * 13 + j * 17 + 5, amp)).toFixed(1).replace(".", ",");
      return c;
    });
  }

  FE.FICHAS[ID] = {
    titulo: "Calibração do FWD — célula de carga e sensores de deflexão",
    lote: true,
    resumo: "LVDT (Y = mX + b, erro padrão < 0,0010), célula de carga e sensores por regressão pela origem Y = mX com 20 pares (erro padrão ≤ 0,0020, repetibilidade 0,003), calibração relativa com Ri = xo/xi (0,997–1,003), análise de variância e fatores finais (0,98–1,02).",
    rotuloImportar: function (r) { return r.parecer ? r.parecer.titulo : "—"; },
    blocos: [],
    params: [
      { k: "fwd", r: "FWD (fabricante / nº de série)", ph: "ex.: FWD A — série 000" },
      { k: "escopo", r: "Calibração", tipo: "select", opcoes: [["anual", "Anual — referência (célula e sensores) + relativa"], ["relativa", "Só relativa (mensal ou após troca de sensor)"], ["referencia", "Só referência"]] },
      { k: "temp", r: "Temperatura do recinto (°C) (4.1)" },
      { k: "umid", r: "Umidade relativa (%) (4.1)" },
      { k: "refCal", r: "Data da calibração da célula de referência (5.2 b)", tipo: "date" },
      { k: "filtro", r: "Sem filtro de dados e com quedas de aquecimento (5.1 c/e)?", tipo: "select", opcoes: SN },
    ],
    padrao: { escopo: "anual" },
    tabelas: function (d) {
      var ns = Math.max(3, (d.rl || []).length || 7);
      var rlL = [{ k: "fatual", r: "Fator de calibração atual (intermediário)", u: "" }];
      for (var j = 1; j <= Math.max(ns, (d.rl || []).length); j++) rlL.push({ k: "c" + j, r: "Conjunto " + j + " — média das 5 quedas", u: "µm" });
      rlL.push({ k: "r2", r: "Ri da 2ª calibração relativa (7.2.1) — opcional", u: "" }, { k: "r3", r: "Ri da 3ª calibração relativa — opcional", u: "" },
        { calc: "xi", r: "xi — média do sensor (7.1.3 a)", u: "µm", casas: 1 }, { calc: "Ri", r: "Ri = xo / xi (eq. 4)", u: "", casas: 4, destaque: true },
        { calc: "Rm", r: "Ri adotado (repetições, 7.2.1)", u: "", casas: 4 }, { calc: "fin", r: "Fator final = fator atual × Ri (7.3 c)", u: "", casas: 4, destaque: true });
      return [
        { chave: "lv", titulo: "LVDT — calibração com o micrômetro (5.3 f–g)", rotulo: "Ponto", iniciais: 9, min: 3, linhas: [{ k: "mm", r: "Leitura do micrômetro", u: "mm" }, { k: "bits", r: "Saída do LVDT", u: "bits" }] },
        { chave: "cc", titulo: "Célula de carga — testes de calibração de referência (6.1 / 6.2)", rotulo: "Teste", iniciais: 2, min: 1,
          linhas: [{ k: "fant", r: "Fator de calibração antigo", u: "" }].concat(linhasPares("c", "referência", "FWD", "kN")).concat([
            { calc: "m", r: "m — Y = mX pela origem (eq. 2)", u: "", casas: 4, destaque: true }, { calc: "se", r: "Erro padrão de m", u: "", casas: 5 }, { calc: "novo", r: "Novo fator = antigo × m", u: "", casas: 4 }]) },
        { chave: "sr", titulo: "Sensores de deflexão — calibração de referência (6.3 / 6.4)", rotulo: "Sensor", iniciais: 7, min: 1,
          linhas: [{ k: "fant", r: "Fator de calibração antigo", u: "" }].concat(linhasPares("s", "LVDT", "sensor", "µm")).concat([
            { calc: "m", r: "m — Y = mX pela origem (eq. 3)", u: "", casas: 4, destaque: true }, { calc: "se", r: "Erro padrão de m", u: "", casas: 5 }, { calc: "novo", r: "Fator intermediário = antigo × m", u: "", casas: 4 }]) },
        { chave: "rl", titulo: "Calibração relativa (7) — uma coluna por sensor, uma linha por conjunto", rotulo: "Sensor", iniciais: 7, min: 3, linhas: rlL,
          dica: "sensor i no conjunto j ocupa a posição ((i + j − 2) mod n) + 1; use tantos conjuntos quantos sensores" },
      ];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(ok(r.mCC) ? fmt(r.mCC, 4) : "—", "m da célula de carga (média)") +
        A.cartao(ok(r.fCC) ? fmt(r.fCC, 4) : "—", "Novo fator da célula") + A.cartao(r.rel ? fmt(r.rel.epm, 2) + " µm" : "—", "Erro padrão da relativa (7.1.2)") + "</div>" +
        A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    relatorio: {
      notas: "DNIT 132/2010-PRO: regressões pela origem (\"até zero\") com erro padrão de m = √[Σ(Y − mX)²/(n − 1)/ΣX²]; LVDT com intercepto (eq. 1, erro padrão com n − 2). Calibração relativa em quadrado latino sobre as médias de 5 quedas; F crítico a 5 %. 7.2.1 c aplicada no sentido de 6.2 c (média quando o desvio dos três é < 0,003).",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [["Parecer", r.parecer.titulo], ["FWD", (d.params || {}).fwd || "—"]];
        if (ok(r.mCC)) rows.push(["Célula de carga", "m = " + fmt(r.mCC, 4) + (ok(r.fCC) ? " · novo fator " + fmt(r.fCC, 4) : "")]);
        if (r.rel) rows.push(["Fatores finais (7.3 c)", r.rel.fin.map(function (f, i) { return "S" + (i + 1) + " " + fmt(f, 4); }).join(" · ")]);
        return rows;
      },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Calibração anual completa — 7 sensores (dados gerados)", dados: function () {
        return { ident: { registro: "CAL-FWD-01", data: "2026-02-10", obra: "Centro de calibração A", responsavel: "Operador de calibração A" },
          params: { fwd: "FWD A — série 000", escopo: "anual", temp: "24", umid: "62", refCal: "2025-08-20", filtro: "sim" },
          lv: colsLVDT(), cc: [colCarga(1.012, 0.9965, 0.02, 1), colCarga(1.012, 0.9975, 0.02, 2)],
          sr: [1, 2, 3, 4, 5, 6, 7].map(function (i) { return colSensor(1.0, 1 + (i - 4) * 0.002, 0.2, i); }),
          rl: relativa([1.0005, 0.9995, 1.001, 0.999, 1.0, 1.0008, 0.9992], 1.5) };
      } },
      { nome: "Célula de carga sem repetibilidade e sensor 5 desajustado (dados gerados)", dados: function () {
        return { ident: { registro: "CAL-FWD-02", data: "2026-02-12", obra: "Centro de calibração A" },
          params: { fwd: "FWD B — série 001", escopo: "anual", temp: "26", umid: "70", refCal: "2024-11-05", filtro: "sim" },
          lv: colsLVDT(), cc: [colCarga(0.998, 0.990, 0.02, 3), colCarga(0.998, 1.004, 0.4, 4)],
          sr: [1, 2, 3, 4, 5, 6, 7].map(function (i) { return colSensor(1.0, 1.0, i === 5 ? 3 : 0.2, i); }),
          rl: relativa([1.0, 0.999, 1.001, 1.0, 1.025, 1.0, 0.9995], 0.6, 0.002) };
      } },
    ],
  };
})();
