/*
 * Ficha: DNER-IE 005/94 — Solos — Ensaio de adensamento.
 * Umidades (6.1), altura sólida Hs = Ps / (γg × A) (6.2), índice de vazios ε = H / Hs − 1 (6.3), saturação (6.4),
 * alturas por estágio (6.5 e 6.6), t50 por Casagrande (6.8, curva × log t) ou t90 por Taylor (6.9, curva × √t),
 * cv = T (Hm/2)² / t (6.7), av = Δε / Δp (6.10), mv = av / (1 + εm) (6.11), k = cv · mv · γa (6.12),
 * curva ε × log p, índice de compressão (7.2) e pressão de pré-adensamento pelo processo de Casagrande (7.3).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // tempos de leitura (min) de 5.6: 1/8, 1/4, 1/2, 1, 2, 4, 8, 15 min, 1, 2, 4, 8, 24 h (+ 30 min, usual — Figura 7)
  var TEMPOS = [0, 0.125, 0.25, 0.5, 1, 2, 4, 8, 15, 30, 60, 120, 240, 480, 1440];
  var ROT_T = { 0: "0 (antes da carga)", 0.125: "1/8 min", 0.25: "1/4 min", 0.5: "1/2 min", 60: "1 h", 120: "2 h", 240: "4 h", 480: "8 h", 1440: "24 h" };
  function chaveT(t) { return "L" + String(t).replace(".", "_"); }
  function rotT(t) { return ROT_T[t] || fmt(t, 0) + " min"; }
  var TF = { t50: 0.197, t90: 0.848 };   // fator tempo (6.7)
  // escala canônica do gráfico ε × log p (px por década e por unidade de ε) usada na construção de Casagrande (7.3)
  var CAN = { w: 480, h: 280 };

  function log10(x) { return Math.log(x) / Math.LN10; }
  function regressao(xs, ys) {
    var n = xs.length;
    if (n < 2) return null;
    var mx = media(xs), my = media(ys), sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    if (!sxx) return null;
    var b = sxy / sxx;
    return { a: my - b * mx, b: b };
  }
  // leituras de um estágio: série padrão + "t = leitura; ..." adicionais, ordenadas por tempo
  function serie(p) {
    var pts = [];
    TEMPOS.forEach(function (t) { var v = num(p[chaveT(t)]); if (ok(v)) pts.push({ t: t, L: v }); });
    FE.curvaSpeedy(p.extra).forEach(function (q) { pts.push({ t: q[0], L: q[1] }); });
    pts.sort(function (a, b) { return a.t - b.t; });
    return pts.filter(function (q, i) { return !i || q.t !== pts[i - 1].t; });
  }
  // interpolação de s em log t (t > 0)
  function sEmLogT(pts, t) {
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      if (a.t > 0 && t >= a.t && t <= b.t) return a.s + (b.s - a.s) * (log10(t) - log10(a.t)) / (log10(b.t) - log10(a.t));
    }
    return NaN;
  }
  // tempo em que a curva (s crescente) atinge s alvo — interpolação em log t
  function tEmS(pts, alvo) {
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      if (a.t > 0 && (a.s - alvo) * (b.s - alvo) <= 0 && b.s !== a.s) {
        return Math.pow(10, log10(a.t) + (alvo - a.s) / (b.s - a.s) * (log10(b.t) - log10(a.t)));
      }
    }
    return NaN;
  }
  // processo de Casagrande (6.8): 0 % pela parábola (t e 4t, três vezes), 100 % pela interseção das tangentes
  function casagrande(pts) {
    var ps = pts.filter(function (q) { return q.t > 0; });
    if (ps.length < 5) return { erro: "poucas leituras para o processo de Casagrande" };
    var pares = [];
    for (var i = 0; i < ps.length && pares.length < 3; i++) {
      var s4 = sEmLogT(ps, 4 * ps[i].t);
      if (ok(s4)) pares.push({ t: ps[i].t, s0: 2 * ps[i].s - s4 });
    }
    if (!pares.length) return { erro: "faltam leituras em t e 4t no início da curva para o 0 %" };
    var s0 = media(pares.map(function (q) { return q.s0; }));
    // tangente ao trecho de compressão primária: segmento de maior inclinação em log t
    var best = null;
    for (i = 1; i < ps.length; i++) {
      var sl = (ps[i].s - ps[i - 1].s) / (log10(ps[i].t) - log10(ps[i - 1].t));
      if (!best || sl > best.sl) best = { sl: sl, i: i };
    }
    if (!best || best.i >= ps.length - 2) return { erro: "a curva não mostra o trecho de compressão secundária (faltam leituras após o trecho mais inclinado)", s0: s0, pares: pares };
    var a = ps[best.i - 1], x0 = log10(a.t);
    var u = ps[ps.length - 2], v = ps[ps.length - 1];
    var sl2 = (v.s - u.s) / (log10(v.t) - log10(u.t));
    if (!(best.sl > sl2)) return { erro: "tangentes paralelas — confira as leituras", s0: s0, pares: pares };
    // s = a.s + sl (x − x0) = u.s + sl2 (x − xu)
    var xu = log10(u.t), x = (u.s - a.s + best.sl * x0 - sl2 * xu) / (best.sl - sl2);
    var s100 = a.s + best.sl * (x - x0);
    var s50 = (s0 + s100) / 2, t50 = tEmS(ps, s50);
    return { s0: s0, s100: s100, s50: s50, t: t50, t100: Math.pow(10, x), pares: pares, tanP: { x0: x0, s0: a.s, sl: best.sl }, tanS: { x0: xu, s0: u.s, sl: sl2 } };
  }
  // processo de Taylor (6.9): reta do trecho inicial em √t e reta com abscissas 1,15 vezes maiores
  function taylor(pts) {
    var ps = pts.filter(function (q) { return q.t > 0; });
    if (ps.length < 5) return { erro: "poucas leituras para o processo de Taylor" };
    var sFim = ps[ps.length - 1].s;
    // trecho reto: leituras entre 10 % e 60 % da compressão total do estágio (mínimo 3 pontos)
    var tr = ps.filter(function (q) { return q.s >= 0.1 * sFim && q.s <= 0.6 * sFim; });
    if (tr.length < 3) tr = ps.slice(0, Math.min(4, ps.length));
    var rg = regressao(tr.map(function (q) { return Math.sqrt(q.t); }), tr.map(function (q) { return q.s; }));
    if (!rg || rg.b <= 0) return { erro: "trecho inicial não retilíneo" };
    var b2 = rg.b / 1.15;   // mesma origem, abscissas 1,15 vezes maiores
    var prev = null;
    for (var i = 0; i < ps.length; i++) {
      var x = Math.sqrt(ps[i].t), dif = ps[i].s - (rg.a + b2 * x);   // > 0: curva abaixo da 2ª reta (no gráfico de leituras)
      if (prev && prev.dif > 0 && dif <= 0) {
        var xr = prev.x + (x - prev.x) * prev.dif / (prev.dif - dif);
        return { t: xr * xr, s90: rg.a + b2 * xr, reta: rg, b2: b2, trecho: tr.length };
      }
      prev = { x: x, dif: dif };
    }
    return { erro: "a curva não cruzou a reta de abscissas 1,15 vezes maiores (prossiga as leituras)", reta: rg, b2: b2 };
  }

  function geom(P) {
    var D = num(P.diametro), A = num(P.area);
    if (!ok(A) && ok(D)) A = Math.PI * D * D / 4;
    var H0 = num(P.altura);
    return { D: ok(D) ? D : (ok(A) ? Math.sqrt(4 * A / Math.PI) : NaN), A: A, H0: H0, V: ok(A) && ok(H0) ? A * H0 : NaN };
  }
  function pressoesCarga(d) {
    var out = [], pmax = -Infinity;
    (d.est || []).forEach(function (p) { var v = num(p.p); if (ok(v) && v > pmax) { out.push(v); pmax = v; } });
    return out;
  }

  FE.FICHAS["dner-ie-005-94"] = {
    titulo: "Solos — Ensaio de adensamento",
    rotuloImportar: function (r) { return "σ'p " + (ok(r.sigmaP) ? fmt(r.sigmaP, 0) + " kPa" : "—") + " · Cc " + (ok(r.Cc) ? fmt(r.Cc, 2) : "—") + " · ε₀ " + (ok(r.e0) ? fmt(r.e0, 2) : "—"); },
    resumo: "Curvas de adensamento por estágio (t50 de Casagrande ou t90 de Taylor), índices de vazios, cv, av, mv e k por estágio, curva ε × log p, índice de compressão e pressão de pré-adensamento (Casagrande).",
    blocos: ["umidade"],
    params: [
      { k: "celula", r: "Célula de adensamento (3 b)", tipo: "select", opcoes: [["fixo", "Anel fixo"], ["flutuante", "Anel flutuante"]] },
      { k: "anel", r: "Anel nº" },
      { k: "diametro", r: "Diâmetro do anel / corpo de prova (cm)", dica: "usual de 6,350 cm (2 ½\") a 10,795 cm (4 ¼\") — 3 b e 4.3" },
      { k: "area", r: "…ou área do anel A (cm²)", dica: "se informada, prevalece sobre o diâmetro" },
      { k: "altura", r: "Altura inicial do corpo de prova H₀ (cm)", dica: "três a quatro vezes menor que o diâmetro (4.4)" },
      { k: "mAnel", r: "Massa do anel (g) — 4.9" },
      { k: "mAnelSolo", r: "Massa do anel + solo úmido (g) — 4.9" },
      { k: "gg", r: "Massa específica real dos grãos γg (g/cm³) — 4.10" },
      { k: "sentido", r: "Leitura do defletômetro na compressão", tipo: "select", opcoes: [["diminui", "Diminui (como na Figura 7)"], ["aumenta", "Aumenta"]] },
      { k: "metodo", r: "Tempo de adensamento para cv (6.7)", tipo: "select", recarrega: true,
        opcoes: [["t50", "t50 — Casagrande, curva × log t (6.8), T = 0,197"], ["t90", "t90 — Taylor, curva × √t (6.9), T = 0,848"]] },
      { k: "gw", r: "Peso específico da água γa (kN/m³) para k (6.12)", ph: "9,81",
        dica: "γa = 1 g/cm³ → 9,81 kN/m³; a Figura 11 da norma usou 10 (1 kPa ≈ 10 g/cm²)" },
      { k: "pCurv", r: "Ponto de menor raio de curvatura da curva ε × log p (7.3)", tipo: "select",
        opcoes: function (d) { return [["", "Automático"]].concat(pressoesCarga(d).filter(function (p) { return p > 0; }).map(function (p) { return [String(p), fmt(p, 0) + " kPa"]; })); } },
      { k: "virgemDe", r: "Reta virgem — da pressão (7.2)", tipo: "select",
        opcoes: function (d) { return [["", "Automático (três últimas do carregamento)"]].concat(pressoesCarga(d).filter(function (p) { return p > 0; }).map(function (p) { return [String(p), fmt(p, 0) + " kPa"]; })); } },
      { k: "virgemAte", r: "Reta virgem — até a pressão", tipo: "select",
        opcoes: function (d) { return [["", "Automático (maior pressão)"]].concat(pressoesCarga(d).filter(function (p) { return p > 0; }).map(function (p) { return [String(p), fmt(p, 0) + " kPa"]; })); } },
      { k: "sigmaMan", r: "Pressão de pré-adensamento adotada (kPa) — opcional", dica: "leitura gráfica; substitui a construção automática" },
      { k: "estGraf", r: "Estágio da curva de adensamento no gráfico", tipo: "select",
        opcoes: function (d) { return [["", "Automático (primeiro com leituras)"]].concat((d.est || []).map(function (p, i) { return [String(i), "Estágio " + (i + 1) + (p.p ? " — " + p.p + " kPa" : "")]; })); } },
    ],
    padrao: { celula: "fixo", sentido: "diminui", metodo: "t50" },
    tabelas: function (d) {
      var P = d.params || {}, t50 = P.metodo !== "t90";
      var lin = [{ k: "p", r: "Pressão aplicada p", u: "kPa", destaque: true }, { grupo: "Leituras do defletômetro (5.6) — tempo decorrido" }];
      TEMPOS.forEach(function (t) { lin.push({ k: chaveT(t), r: rotT(t), u: "mm" }); });
      lin.push({ k: "extra", r: "Outras leituras (t min = leitura; …)", texto: true, ph: "305=6,27" },
        { k: "Lf", r: "Leitura final (se não houver a série)", u: "mm" },
        { k: "tMan", r: (t50 ? "t50" : "t90") + " lido no gráfico — opcional", u: "min" },
        { grupo: "Cálculos (6.5 a 6.12)" },
        { calc: "dH", r: "ΔH (compressão + / expansão −)", u: "mm", casas: 3 },
        { calc: "H", r: "Altura do corpo de prova H (6.5 / 6.6)", u: "cm", casas: 3 },
        { calc: "e", r: "Índice de vazios ε = H / Hs − 1 (6.3)", u: "—", casas: 3, destaque: true },
        { calc: "de", r: "Δε", u: "—", casas: 3 },
        { calc: "em", r: "Índice de vazios médio εm", u: "—", casas: 3 },
        { calc: "pm", r: "Pressão média do estágio", u: "kPa", casas: 0 },
        { calc: "Hm", r: "Altura média Hm", u: "cm", casas: 3 },
        { calc: "tAuto", r: (t50 ? "t50 — Casagrande (6.8)" : "t90 — Taylor (6.9)") + ", automático", u: "min", casas: 1 },
        { calc: "ts", r: "t adotado", u: "s", casas: 0 },
        { calc: "cv", r: "cv = T (Hm/2)² / t (6.7)", u: "10⁻⁸ m²/s", casas: 3, destaque: true },
        { calc: "av", r: "av = Δε / Δp (6.10)", u: "10⁻² kPa⁻¹", casas: 3 },
        { calc: "mv", r: "mv = av / (1 + εm) (6.11)", u: "10⁻² kPa⁻¹", casas: 3 },
        { calc: "k", r: "k = cv · mv · γa (6.12)", u: "10⁻⁹ m/s", casas: 3 });
      return [
        { chave: "umid", titulo: "Determinação da umidade (4.10 e 5.11)", rotulo: "Cápsula", iniciais: 4, min: 4, fixo: true,
          nomes: ["Inicial 1", "Inicial 2", "Inicial 3", "Final (CP inteiro)"],
          dica: "três amostras das aparas da moldagem (4.10) e o corpo de prova inteiro ao fim do ensaio (5.11) — a massa seca final é Ps (6.2)",
          linhas: FE.BLOCOS.umidade.linhas("u", "", "lab") },
        { chave: "est", titulo: "Estágios de carga e descarga", rotulo: "Estágio", iniciais: 6, min: 1,
          dica: "uma coluna por estágio, na ordem do ensaio (carregamento e, depois, descarregamento). Cada carga é o dobro da anterior (5.8). Nos estágios de descarga bastam a leitura inicial e a final.",
          linhas: lin },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], g = geom(P), gg = num(P.gg), sgn = P.sentido === "aumenta" ? -1 : 1;
      var T = TF[P.metodo === "t90" ? "t90" : "t50"], gw = ok(num(P.gw)) ? num(P.gw) : 9.81;
      // umidades (6.1)
      var umid = (d.umid || []).map(function (p) { var r = FE.BLOCOS.umidade.calcular(p, "u", "lab"); return { uW: r.w, ms: r.mSeca, mu: r.mUmida }; });
      var hIni = media(umid.slice(0, 3).map(function (o) { return o.uW; })), fin = umid[3] || {};
      var Ph = num(P.mAnelSolo) - num(P.mAnel);
      // Ps: massa seca do CP inteiro ao fim (5.11); na falta, pela umidade inicial
      var Ps = ok(fin.ms) ? fin.ms : ok(Ph) && ok(hIni) ? Ph / (1 + hIni / 100) : NaN;
      var res = { hIni: hIni, hFim: fin.uW, A: g.A, V: g.V, D: g.D, H0: g.H0, Ph: Ph, Ps: Ps, PsFonte: ok(fin.ms) ? "massa seca do CP ao fim (5.11)" : "Ph / (1 + h inicial)" };
      res.gh = ok(Ph) && ok(g.V) ? Ph / g.V : NaN;
      res.gs = ok(Ps) && ok(g.V) ? Ps / g.V : NaN;
      res.Hs = ok(Ps) && ok(gg) && ok(g.A) ? Ps / (gg * g.A) : NaN;            // 6.2
      res.e0 = ok(res.Hs) && ok(g.H0) ? g.H0 / res.Hs - 1 : NaN;              // 6.3
      res.S0 = ok(hIni) && ok(gg) && ok(res.e0) ? hIni * gg / res.e0 : NaN;    // 6.4 (γa = 1)
      if (!ok(gg)) avisos.push("Informe a massa específica real dos grãos γg (4.10) para a altura sólida e os índices de vazios.");
      if (!ok(g.A) || !ok(g.H0)) avisos.push("Informe o diâmetro (ou a área) e a altura inicial do corpo de prova.");
      if (!ok(Ps)) avisos.push("Sem massa seca do corpo de prova: informe a umidade final do CP inteiro (5.11) ou a massa do anel + solo úmido e as umidades iniciais.");
      if (ok(g.D) && g.D < 6.35 - 1e-6) avisos.push("Diâmetro de " + fmt(g.D, 2) + " cm: não se recomendam anéis com diâmetro inferior a 2 ½\" (6,350 cm) — 3 b, nota.");
      if (ok(g.D) && ok(g.H0) && (g.D / g.H0 < 3 - 1e-6 || g.D / g.H0 > 4 + 1e-6)) avisos.push("Diâmetro / altura = " + fmt(g.D / g.H0, 2) + ": a altura deve ser de três a quatro vezes menor que o diâmetro (4.4).");
      var hs = umid.slice(0, 3).map(function (o) { return o.uW; }).filter(ok);
      if (hs.length && hs.length < 3) avisos.push("A umidade inicial é determinada em três amostras das aparas (4.10); há " + hs.length + ".");

      // estágios
      var H = g.H0, Lant = NaN, pAnt = 0, eAnt = res.e0, pMaxAte = 0, metodo = P.metodo === "t90" ? "t90" : "t50";
      var est = (d.est || []).map(function (p, i) {
        var o = { i: i, p: num(p.p) }, pts = serie(p);
        var L0 = pts.length && pts[0].t === 0 ? pts[0].L : Lant;
        var Lf = ok(num(p.Lf)) ? num(p.Lf) : pts.length ? pts[pts.length - 1].L : NaN;
        o.descarga = ok(o.p) && o.p < pMaxAte;
        if (!ok(o.p)) { if (pts.length || ok(num(p.Lf))) avisos.push("Estágio " + (i + 1) + ": informe a pressão aplicada."); return o; }
        if (!ok(L0)) L0 = pts.length ? pts[0].L : NaN;
        o.dH = ok(L0) && ok(Lf) ? sgn * (L0 - Lf) : NaN;                                  // mm
        var Hant = H;
        if (ok(o.dH) && ok(H)) H = H - o.dH / 10;                                           // 6.5 / 6.6
        o.H = H;
        o.e = ok(res.Hs) && ok(H) ? H / res.Hs - 1 : NaN;
        o.de = ok(eAnt) && ok(o.e) ? eAnt - o.e : NaN;
        o.em = ok(eAnt) && ok(o.e) ? (eAnt + o.e) / 2 : NaN;
        o.pm = (pAnt + o.p) / 2;
        o.Hm = ok(Hant) && ok(H) ? (Hant + H) / 2 : NaN;
        o.pts = pts.map(function (q) { return { t: q.t, L: q.L, s: ok(L0) ? sgn * (L0 - q.L) : NaN }; });
        if (!o.descarga && o.p > pAnt) {
          if (pts.length >= 5 && ok(L0)) {
            o.ajuste = metodo === "t90" ? taylor(o.pts) : casagrande(o.pts);
            o.tAuto = o.ajuste.t;
            if (o.ajuste.erro) avisos.push("Estágio " + (i + 1) + " (" + fmt(o.p, 0) + " kPa): " + o.ajuste.erro + ".");
          }
          var tm = num(p.tMan);
          o.tMin = ok(tm) ? tm : o.tAuto;
          o.ts = ok(o.tMin) ? o.tMin * 60 : NaN;
          o.cvCm = ok(o.ts) && o.ts > 0 && ok(o.Hm) ? T * Math.pow(o.Hm / 2, 2) / o.ts : NaN;  // cm²/s
          o.cv = o.cvCm * 1e4;                                     // 10⁻⁸ m²/s
          var dp = o.p - pAnt;
          o.avK = ok(o.de) && dp > 0 ? o.de / dp : NaN;            // kPa⁻¹
          o.av = o.avK * 100;
          o.mvK = ok(o.avK) && ok(o.em) ? o.avK / (1 + o.em) : NaN;
          o.mv = o.mvK * 100;
          o.kms = ok(o.cvCm) && ok(o.mvK) ? o.cvCm * 1e-4 * o.mvK * gw : NaN;   // m/s
          o.k = o.kms * 1e9;
          if (pAnt > 0 && Math.abs(o.p / pAnt - 2) > 0.1) avisos.push("Estágio " + (i + 1) + ": " + fmt(o.p, 0) + " kPa não é o dobro da pressão anterior (" + fmt(pAnt, 0) + " kPa) — 5.8 e 5.9.");
          if (!ok(o.tMin) && ok(o.dH)) avisos.push("Estágio " + (i + 1) + " (" + fmt(o.p, 0) + " kPa): sem " + (metodo === "t90" ? "t90" : "t50") + " — informe a série de leituras ou o tempo lido no gráfico.");
          if (ok(o.kms) && o.kms * 100 > 1e-7) o.kAlto = true;
        }
        if (ok(o.dH) && !o.descarga && o.dH < 0) avisos.push("Estágio " + (i + 1) + ": o corpo de prova expandiu sob carga maior — confira o sentido do defletômetro.");
        pMaxAte = Math.max(pMaxAte, o.p);
        pAnt = o.p; eAnt = ok(o.e) ? o.e : eAnt; Lant = Lf;
        return o;
      });
      var validos = est.filter(function (o) { return ok(o.p) && ok(o.e); });
      if (validos.length) {
        var pIni = validos[0].p;
        if (pIni > 30) avisos.push("Pressão inicial de " + fmt(pIni, 0) + " kPa: a sequência usual começa em 20 ou 25 kPa (5.5 — nota).");
      }
      if (est.some(function (o) { return o.kAlto; })) avisos.push("Há estágio com k ≥ 1 × 10⁻⁷ cm/s: o coeficiente de permeabilidade calculado pelo adensamento só é coerente em solos de baixa permeabilidade (6.12, nota).");
      // umidade / saturação finais
      var ult = validos[validos.length - 1];
      res.eFim = ult ? ult.e : NaN;
      res.Sfim = ok(res.hFim) && ok(gg) && ok(res.eFim) ? res.hFim * gg / res.eFim : NaN;

      // curva ε × log p (7.1), reta virgem (7.2) e pré-adensamento (7.3)
      var carga = [], pm = -Infinity;
      validos.forEach(function (o) { if (!o.descarga && o.p > 0 && o.p > pm) { carga.push(o); pm = o.p; } });
      res.carga = carga.map(function (o) { return { p: o.p, e: o.e }; });
      res.descarga = validos.filter(function (o) { return o.descarga && o.p > 0; }).map(function (o) { return { p: o.p, e: o.e }; });
      if (carga.length >= 3) {
        var de = num(P.virgemDe), ate = num(P.virgemAte);
        var vir = carga.filter(function (o) { return (!ok(de) || o.p >= de - 1e-9) && (!ok(ate) || o.p <= ate + 1e-9); });
        if (!ok(de)) vir = vir.slice(-3);
        if (vir.length >= 2) {
          var rg = regressao(vir.map(function (o) { return log10(o.p); }), vir.map(function (o) { return o.e; }));
          res.virgem = { a: rg.a, b: rg.b, p1: vir[0].p, p2: vir[vir.length - 1].p };
          res.Cc = -rg.b;   // Ie = (ε1 − ε2) / log (P2 / P1)
          if (vir.length > 2) {
            var dev = Math.max.apply(null, vir.map(function (o) { return Math.abs(o.e - (rg.a + rg.b * log10(o.p))); }));
            if (dev > 0.05) avisos.push("Os pontos escolhidos para a reta virgem se afastam até " + fmt(dev, 3) + " da reta ajustada — confira o trecho retilíneo (7.2).");
          }
        }
        // escala canônica do gráfico
        var xs = carga.map(function (o) { return log10(o.p); }), es = carga.map(function (o) { return o.e; }).concat(ok(res.e0) ? [res.e0] : []);
        var dec = Math.ceil(Math.max.apply(null, xs)) - Math.floor(Math.min.apply(null, xs)) || 1;
        var eR = (Math.ceil(Math.max.apply(null, es) * 10) - Math.floor(Math.min.apply(null, es) * 10)) / 10 || 1;
        var kx = CAN.w / dec, ky = CAN.h / eR;   // px por década, px por unidade de ε
        // ponto de menor raio de curvatura: maior aumento de inclinação entre segmentos consecutivos
        var iC = -1, pc = num(P.pCurv);
        if (ok(pc)) carga.forEach(function (o, j) { if (Math.abs(o.p - pc) < 1e-6) iC = j; });
        if (iC < 0) {
          var melhor = -Infinity;
          for (var j = 1; j < carga.length - 1; j++) {
            var a1 = Math.atan((carga[j - 1].e - carga[j].e) * ky / ((xs[j] - xs[j - 1]) * kx));
            var a2 = Math.atan((carga[j].e - carga[j + 1].e) * ky / ((xs[j + 1] - xs[j]) * kx));
            if (a2 - a1 > melhor) { melhor = a2 - a1; iC = j; }
          }
          res.pCurvAuto = true;
        }
        if (iC >= 0 && res.virgem) {
          var pt = carga[iC], xi = xs[iC];
          var tg = iC === 0 ? (carga[1].e - pt.e) / (xs[1] - xi) : iC === carga.length - 1 ? (pt.e - carga[iC - 1].e) / (xi - xs[iC - 1])
            : (carga[iC + 1].e - carga[iC - 1].e) / (xs[iC + 1] - xs[iC - 1]);
          var phi = Math.atan(tg * ky / kx), sb = Math.tan(phi / 2) * kx / ky;   // bissetriz (em escala do gráfico)
          var V = res.virgem;
          var xst = (V.a - pt.e + sb * xi) / (sb - V.b);
          res.casa = { p: pt.p, e: pt.e, tg: tg, sb: sb, x: xst, eS: pt.e + sb * (xst - xi) };
          res.sigmaPCalc = Math.pow(10, xst);
          if (!(xst > Math.min.apply(null, xs) - 1) || !(xst < Math.max.apply(null, xs) + 0.5)) avisos.push("A construção de Casagrande deu um ponto fora da curva — escolha o ponto de menor raio de curvatura e a reta virgem (7.3).");
        }
      } else if (validos.length) avisos.push("A curva ε × log p precisa de ao menos três estágios de carregamento para a reta virgem e o pré-adensamento (7.2 e 7.3).");
      res.sigmaP = ok(num(P.sigmaMan)) ? num(P.sigmaMan) : res.sigmaPCalc;
      var cvs = est.filter(function (o) { return ok(o.cv); });
      res.cvFaixa = cvs.length ? [Math.min.apply(null, cvs.map(function (o) { return o.cv; })), Math.max.apply(null, cvs.map(function (o) { return o.cv; }))] : null;
      res.metodo = metodo; res.T = T; res.gw = gw;
      res.estagios = est.filter(function (o) { return ok(o.p); }).map(function (o) {
        return { p: o.p, pm: o.pm, H: o.H, e: o.e, de: o.de, em: o.em, t: o.ts, cv: o.cv, av: o.av, mv: o.mv, k: o.k, descarga: o.descarga };
      });
      return { tab: { umid: umid, est: est }, est: est, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, u, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + " <small>" + u + '</small></div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(fmt(r.sigmaP, 0), "kPa", "Pressão de pré-adensamento (7.3)" + (ok(r.casa && r.casa.p) && !ok(r.sigmaMan) ? " — menor raio em " + fmt(r.casa.p, 0) + " kPa" : "")) +
        cx(fmt(r.Cc, 3), "", "Índice de compressão Ie (7.2)" + (r.virgem ? " — reta virgem " + fmt(r.virgem.p1, 0) + " a " + fmt(r.virgem.p2, 0) + " kPa" : "")) +
        cx(fmt(r.e0, 3), "", "Índice de vazios inicial (Hs = " + fmt(r.Hs, 3) + " cm)") +
        cx(fmt(r.S0, 1) + " / " + fmt(r.Sfim, 1), "%", "Grau de saturação inicial / final (6.4)") +
        cx(fmt(r.hIni, 2) + " / " + fmt(r.hFim, 2), "%", "Umidade inicial / final (6.1)") + "</div>";
      var L = calc.resultados.estagios;
      if (L.length) {
        h += '<table class="fe-resumo"><tr><th>p (kPa)</th><th>pm (kPa)</th><th>H (cm)</th><th>ε</th><th>Δε</th><th>εm</th><th>t (s)</th><th>cv (10⁻⁸ m²/s)</th><th>av (10⁻² kPa⁻¹)</th><th>mv (10⁻² kPa⁻¹)</th><th>k (10⁻⁹ m/s)</th></tr>' +
          L.map(function (o) {
            return "<tr><td>" + fmt(o.p, 0) + (o.descarga ? " ↓" : "") + "</td><td>" + (o.descarga ? "—" : fmt(o.pm, 0)) + "</td><td>" + fmt(o.H, 3) + "</td><td>" + fmt(o.e, 3) + "</td><td>" + fmt(o.de, 3) +
              "</td><td>" + fmt(o.em, 3) + "</td><td>" + fmt(o.t, 0) + "</td><td>" + fmt(o.cv, 3) + "</td><td>" + fmt(o.av, 3) + "</td><td>" + fmt(o.mv, 3) + "</td><td>" + fmt(o.k, 3) + "</td></tr>";
          }).join("") + "</table>";
      }
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      return [gEpsLogP(calc, opt), gCv(calc, opt), gK(calc, opt), gAdens(calc, d, opt)];
    },
    relatorio: {
      notas: "Hs = Ps / (γg × A) (6.2), com Ps = massa seca do corpo de prova inteiro ao fim do ensaio (5.11) — ou Ph / (1 + h inicial) na falta dela; ε = H / Hs − 1 (6.3); S = h γg / (ε γa) (6.4); H = H₁ ∓ ΔH (6.5 e 6.6). t50 por Casagrande (6.8): 0 % pela média de três construções t / 4t, 100 % pela interseção da tangente ao trecho mais inclinado com a reta das duas últimas leituras; t90 por Taylor (6.9): reta do trecho inicial (leituras entre 10 % e 60 % da compressão do estágio) × √t e reta de abscissas 1,15 vezes maiores. cv = T (Hm/2)² / t, T = 0,197 (50 %) ou 0,848 (90 %), duas faces de drenagem (6.7); av = Δε / Δp (6.10); mv = av / (1 + εm) (6.11); k = cv · mv · γa (6.12). Índice de compressão = inclinação da reta virgem ajustada (7.2). Pré-adensamento (7.3): tangente no ponto de menor raio de curvatura, horizontal pelo mesmo ponto, bissetriz (traçada na escala do gráfico ε × log p) e interseção com a reta virgem prolongada.",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["Área / volume do corpo de prova", fmt(r.A, 2) + " cm² / " + fmt(r.V, 1) + " cm³"],
          ["Massa específica aparente úmida / seca", fmt(r.gh, 3) + " / " + fmt(r.gs, 3) + " g/cm³"],
          ["Massa seca do corpo de prova Ps", fmt(r.Ps, 2) + " g (" + r.PsFonte + ")"],
          ["Altura sólida Hs / índice de vazios natural ε₀", fmt(r.Hs, 3) + " cm / " + fmt(r.e0, 3)],
          ["Umidade inicial / final", fmt(r.hIni, 2) + " % / " + fmt(r.hFim, 2) + " %"],
          ["Grau de saturação inicial / final", fmt(r.S0, 1) + " % / " + fmt(r.Sfim, 1) + " %"],
          ["Índice de compressão Ie (Cc)", fmt(r.Cc, 3) + (r.virgem ? " — reta virgem de " + fmt(r.virgem.p1, 0) + " a " + fmt(r.virgem.p2, 0) + " kPa" : "")],
          ["Pressão de pré-adensamento", fmt(r.sigmaP, 0) + " kPa" + (ok(r.sigmaPCalc) && r.sigmaP !== r.sigmaPCalc ? " (adotada; construção: " + fmt(r.sigmaPCalc, 0) + " kPa)" : "")],
          ["Coeficiente de adensamento cv (carregamento)", r.cvFaixa ? fmt(r.cvFaixa[0], 3) + " a " + fmt(r.cvFaixa[1], 3) + " × 10⁻⁸ m²/s (" + (r.metodo === "t90" ? "t90, T = 0,848" : "t50, T = 0,197") + ")" : "—"],
          ["γa adotado para k", fmt(r.gw, 2) + " kN/m³"]];
      },
      extraHtml: function (calc) {
        var L = calc.resultados.estagios;
        if (!L.length) return "";
        return '<h2>Quadro de resultados por estágio (Figura 11)</h2><table class="gr"><thead><tr><th>p (kPa)</th><th>pm (kPa)</th><th>H (cm)</th><th>ε</th><th>Δε</th><th>εm</th><th>t (s)</th><th>cv (10⁻⁸ m²/s)</th><th>av (10⁻² kPa⁻¹)</th><th>mv (10⁻² kPa⁻¹)</th><th>k (10⁻⁹ m/s)</th></tr></thead>' +
          L.map(function (o) {
            return "<tr><td>" + fmt(o.p, 0) + (o.descarga ? " ↓" : "") + "</td><td>" + (o.descarga ? "—" : fmt(o.pm, 0)) + "</td><td>" + fmt(o.H, 3) + "</td><td>" + fmt(o.e, 3) + "</td><td>" + fmt(o.de, 3) +
              "</td><td>" + fmt(o.em, 3) + "</td><td>" + fmt(o.t, 0) + "</td><td>" + fmt(o.cv, 3) + "</td><td>" + fmt(o.av, 3) + "</td><td>" + fmt(o.mv, 3) + "</td><td>" + fmt(o.k, 3) + "</td></tr>";
          }).join("") + "</table>";
      },
    },
    exemplos: [],
  };

  // ---------- gráficos ----------
  function cores(opt) {
    return opt && opt.imprimir ? { eixo: "#333", grade: "#ddd", grade2: "#eee", txt: "#222", a: "#1f5fbf", b: "#c0392b", c: "#27884a", d: "#8e44ad" }
      : { eixo: "var(--text-dim)", grade: "var(--border)", grade2: "var(--border)", txt: "var(--text-dim)", a: "#4f8cff", b: "#ff7a59", c: "#3fb67a", d: "#b07cf0" };
  }
  function svg(W, H) { return '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">'; }
  function vazio(t) { return '<div class="fe-graf-vazio">' + t + "</div>"; }
  // moldura com eixo x logarítmico (décadas d0..d1) e eixo y linear
  function quadroLog(c, W, H, m, d0, d1, y0, y1, py, casasY, xlab, ylab, rotX) {
    function X(lv) { return m.l + (lv - d0) / (d1 - d0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var s = "";
    for (var dd = d0; dd < d1; dd++) for (var k = 1; k <= 9; k++) {
      var lv = dd + log10(k);
      s += '<line x1="' + X(lv) + '" y1="' + m.t + '" x2="' + X(lv) + '" y2="' + (H - m.b) + '" stroke="' + (k === 1 ? c.grade : c.grade2) + '" stroke-width="' + (k === 1 ? 0.9 : 0.4) + '"/>';
      if (k === 1 || k === 2 || k === 5) s += '<text x="' + X(lv) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + c.txt + '">' + (rotX ? rotX(Math.pow(10, lv)) : fmt(Math.pow(10, lv), Math.pow(10, lv) < 1 ? 2 : 0)) + "</text>";
    }
    s += '<text x="' + X(d1) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + c.txt + '">' + (rotX ? rotX(Math.pow(10, d1)) : fmt(Math.pow(10, d1), 0)) + "</text>";
    for (var gy = Math.ceil(y0 / py - 1e-9) * py; gy <= y1 + 1e-9; gy += py) {
      if (Math.abs(gy) < 1e-9) gy = 0;
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + c.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 5) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(gy, casasY) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + c.eixo + '"/>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + c.txt + '">' + esc(xlab) + "</text>" +
      '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">' + esc(ylab) + "</text>";
    return { s: s, X: X, Y: Y };
  }
  function passoY(span) { return span > 2 ? 0.5 : span > 1 ? 0.2 : span > 0.4 ? 0.1 : span > 0.2 ? 0.05 : 0.02; }

  function gEpsLogP(calc, opt) {
    var r = calc.resultados, c = cores(opt), W = opt.w || 560, H = opt.h || 340, m = { l: 52, r: 14, t: 14, b: 42 };
    if (r.carga.length < 2) return vazio("A curva ε × log p aparece com dois ou mais estágios de carga calculados (γg, Hs e leituras).");
    var todos = r.carga.concat(r.descarga);
    var xs = todos.map(function (o) { return log10(o.p); }), es = todos.map(function (o) { return o.e; }).concat(ok(r.e0) ? [r.e0] : []);
    var d0 = Math.floor(Math.min.apply(null, xs)), d1 = Math.ceil(Math.max.apply(null, xs)); if (d1 === d0) d1++;
    var y0 = Math.floor(Math.min.apply(null, es) * 10) / 10, y1 = Math.ceil(Math.max.apply(null, es) * 10) / 10; if (y1 === y0) y1 += 0.1;
    var py = passoY(y1 - y0);
    var q = quadroLog(c, W, H, m, d0, d1, y0, y1, py, py < 0.1 ? 2 : 1, "Pressão p (kPa) — escala logarítmica", "Índice de vazios ε"), s = svg(W, H) + q.s, X = q.X, Y = q.Y;
    function linha(pts, cor, tr, larg) {
      var p = pts.filter(function (z) { return ok(z[0]) && ok(z[1]) && z[1] >= y0 - 0.5 && z[1] <= y1 + 0.5; });
      return p.length > 1 ? '<path d="' + p.map(function (z, i) { return (i ? "L" : "M") + X(z[0]).toFixed(1) + " " + Y(Math.min(Math.max(z[1], y0), y1)).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="' + (larg || 1.5) + '"' + (tr ? ' stroke-dasharray="' + tr + '"' : "") + "/>" : "";
    }
    // reta virgem prolongada
    if (r.virgem) { var V = r.virgem; s += linha([[d0, V.a + V.b * d0], [d1, V.a + V.b * d1]], c.b, "7 4", 1.4); }
    // construção de Casagrande
    if (r.casa) {
      var K = r.casa, xi = log10(K.p);
      s += linha([[xi, K.e], [d1, K.e]], c.d, "3 3", 1) + linha([[xi - 0.3, K.e - K.tg * 0.3], [xi + 0.8, K.e + K.tg * 0.8]], c.d, "3 3", 1) + linha([[xi, K.e], [Math.max(K.x, xi) + 0.3, K.e + K.sb * (Math.max(K.x, xi) + 0.3 - xi)]], c.d, "6 3", 1);
      if (ok(r.sigmaPCalc)) s += '<line x1="' + X(K.x) + '" y1="' + m.t + '" x2="' + X(K.x) + '" y2="' + (H - m.b) + '" stroke="' + c.d + '" stroke-dasharray="2 3"/>' +
        '<circle cx="' + X(K.x) + '" cy="' + Y(K.eS) + '" r="4" fill="none" stroke="' + c.d + '" stroke-width="1.8"/>';
    }
    if (ok(r.sigmaP)) s += '<text x="' + Math.min(X(log10(r.sigmaP)) + 5, W - m.r - 150) + '" y="' + (m.t + 13) + '" fill="' + c.d + '" font-weight="bold">σ\'p = ' + fmt(r.sigmaP, 0) + " kPa</text>";
    s += linha(r.carga.map(function (o) { return [log10(o.p), o.e]; }), c.a, null, 2);
    if (r.descarga.length) s += linha([r.carga[r.carga.length - 1]].concat(r.descarga).map(function (o) { return [log10(o.p), o.e]; }), c.c, "5 3", 1.6);
    todos.forEach(function (o, i) { s += '<circle cx="' + X(log10(o.p)).toFixed(1) + '" cy="' + Y(o.e).toFixed(1) + '" r="3.4" fill="' + (i < r.carga.length ? c.a : c.c) + '"/>'; });
    if (ok(r.Cc)) s += '<text x="' + (W - m.r - 6) + '" y="' + (H - m.b - 8) + '" text-anchor="end" fill="' + c.b + '" font-weight="bold">Ie = ' + fmt(r.Cc, 3) + "</text>";
    return s + "</svg>";
  }
  function gCv(calc, opt) {
    var c = cores(opt), W = opt.w || 560, H = opt.h || 260, m = { l: 52, r: 14, t: 14, b: 42 };
    var L = calc.est.filter(function (o) { return ok(o.cv) && o.pm > 0; });
    if (!L.length) return vazio("A curva cv × pressão média aparece com o t50 / t90 dos estágios de carga.");
    var xs = L.map(function (o) { return log10(o.pm); }), vs = L.map(function (o) { return o.cv; });
    var d0 = Math.floor(Math.min.apply(null, xs)), d1 = Math.ceil(Math.max.apply(null, xs)); if (d1 === d0) d1++;
    var vMax = Math.max.apply(null, vs), py = vMax > 50 ? 10 : vMax > 20 ? 5 : vMax > 8 ? 2 : vMax > 4 ? 1 : 0.5, y1 = Math.ceil(vMax * 1.1 / py) * py;
    var q = quadroLog(c, W, H, m, d0, d1, 0, y1, py, py < 1 ? 1 : 0, "Pressão média pm (kPa)", "cv (10⁻⁸ m²/s)"), s = svg(W, H) + q.s;
    s += '<path d="' + L.map(function (o, i) { return (i ? "L" : "M") + q.X(log10(o.pm)).toFixed(1) + " " + q.Y(o.cv).toFixed(1); }).join(" ") + '" fill="none" stroke="' + c.a + '" stroke-width="1.8"/>';
    L.forEach(function (o) { s += '<circle cx="' + q.X(log10(o.pm)).toFixed(1) + '" cy="' + q.Y(o.cv).toFixed(1) + '" r="3.6" fill="' + c.a + '"/>'; });
    return s + '<text x="' + (W - m.r - 6) + '" y="' + (m.t + 13) + '" text-anchor="end" fill="' + c.txt + '">Coeficiente de adensamento × pressão (7.5, Figura 10)</text></svg>';
  }
  function gK(calc, opt) {
    var c = cores(opt), W = opt.w || 560, H = opt.h || 260, m = { l: 52, r: 14, t: 14, b: 42 };
    var L = calc.est.filter(function (o) { return ok(o.kms) && o.kms > 0 && ok(o.em); });
    if (L.length < 2) return vazio("A reta de permeabilidade aparece com k de dois ou mais estágios de carga.");
    var xs = L.map(function (o) { return log10(o.kms * 100); }), es = L.map(function (o) { return o.em; });
    var d0 = Math.floor(Math.min.apply(null, xs)), d1 = Math.ceil(Math.max.apply(null, xs)); if (d1 === d0) d1++;
    var y0 = Math.floor(Math.min.apply(null, es) * 10) / 10, y1 = Math.ceil(Math.max.apply(null, es) * 10) / 10; if (y1 === y0) y1 += 0.1;
    var py = passoY(y1 - y0);
    var q = quadroLog(c, W, H, m, d0, d1, y0, y1, py, py < 0.1 ? 2 : 1, "Coeficiente de permeabilidade k (cm/s)", "Índice de vazios médio εm",
      function (v) { var e = Math.floor(log10(v) + 1e-9), mt = v / Math.pow(10, e); return (Math.abs(mt - 1) < 1e-6 ? "" : fmt(mt, 0) + "×") + "10^" + e; }), s = svg(W, H) + q.s;
    var rg = regressao(xs, es);
    if (rg) {   // reta ajustada, no trecho dos pontos
      var xa = Math.min.apply(null, xs) - 0.2, xb = Math.max.apply(null, xs) + 0.2;
      s += '<line x1="' + q.X(xa) + '" y1="' + q.Y(rg.a + rg.b * xa) + '" x2="' + q.X(xb) + '" y2="' + q.Y(rg.a + rg.b * xb) + '" stroke="' + c.b + '" stroke-dasharray="6 3"/>';
    }
    L.forEach(function (o, i) { var x = q.X(xs[i]), y = q.Y(o.em); s += '<path d="M' + (x - 4) + " " + (y - 4) + "L" + (x + 4) + " " + (y + 4) + "M" + (x - 4) + " " + (y + 4) + "L" + (x + 4) + " " + (y - 4) + '" stroke="' + c.b + '" stroke-width="1.8"/>'; });
    return s + '<text x="' + (W - m.r - 6) + '" y="' + (H - m.b - 8) + '" text-anchor="end" fill="' + c.txt + '">Reta de permeabilidade (7.4, Figura 9)</text></svg>';
  }
  function gAdens(calc, d, opt) {
    var c = cores(opt), W = opt.w || 560, H = opt.h || 300, m = { l: 52, r: 14, t: 26, b: 42 };
    var P = d.params || {}, i = num(P.estGraf), o = ok(i) ? calc.est[i] : null;
    if (!o || !o.pts || o.pts.length < 5) o = calc.est.filter(function (x) { return x.pts && x.pts.length >= 5 && !x.descarga; })[0];
    if (!o) return vazio("A curva de adensamento aparece com a série de leituras de um estágio (5.6 e 5.7).");
    var t90 = calc.resultados.metodo === "t90", pts = o.pts.filter(function (q) { return ok(q.L); }), aj = o.ajuste || {};
    var Ls = pts.map(function (q) { return q.L; }), Lmin = Math.min.apply(null, Ls), Lmax = Math.max.apply(null, Ls);
    var pad = Math.max((Lmax - Lmin) * 0.08, 0.05), y0 = Lmin - pad, y1 = Lmax + pad, py = passoY(y1 - y0) * 2 > (y1 - y0) / 3 ? passoY(y1 - y0) : passoY(y1 - y0) * 2;
    var sgn = P.sentido === "aumenta" ? -1 : 1, L0 = pts[0].L + sgn * pts[0].s;   // leitura inicial do estágio
    function Ld(s) { return L0 - sgn * s; }
    var tit = "Estágio " + (o.i + 1) + " — " + fmt(o.p, 0) + " kPa";
    if (!t90) {
      var ps = pts.filter(function (q) { return q.t > 0; });
      var d0 = Math.floor(log10(ps[0].t)), d1 = Math.ceil(log10(ps[ps.length - 1].t)); if (d1 === d0) d1++;
      var q = quadroLog(c, W, H, m, d0, d1, y0, y1, py, 2, "Tempo (min) — escala logarítmica", "Leitura do defletômetro (mm)"), s = svg(W, H) + q.s;
      if (sgn === 1) { /* leituras decrescentes: eixo y normal */ }
      s += '<path d="' + ps.map(function (z, k) { return (k ? "L" : "M") + q.X(log10(z.t)).toFixed(1) + " " + q.Y(z.L).toFixed(1); }).join(" ") + '" fill="none" stroke="' + c.a + '" stroke-width="1.8"/>';
      ps.forEach(function (z) { s += '<circle cx="' + q.X(log10(z.t)).toFixed(1) + '" cy="' + q.Y(z.L).toFixed(1) + '" r="3" fill="' + c.a + '"/>'; });
      if (aj.tanP && aj.tanS) {
        [aj.tanP, aj.tanS].forEach(function (tn) {
          var xa = d0, xb = d1, pa = Ld(tn.s0 + tn.sl * (xa - tn.x0)), pb = Ld(tn.s0 + tn.sl * (xb - tn.x0));
          s += '<line x1="' + q.X(xa) + '" y1="' + q.Y(Math.min(Math.max(pa, y0), y1)) + '" x2="' + q.X(xb) + '" y2="' + q.Y(Math.min(Math.max(pb, y0), y1)) + '" stroke="' + c.d + '" stroke-dasharray="4 3"/>';
        });
      }
      [["0 %", aj.s0], ["50 %", aj.s50], ["100 %", aj.s100]].forEach(function (z) {
        if (!ok(z[1])) return;
        var yy = q.Y(Ld(z[1]));
        if (yy >= m.t && yy <= H - m.b) s += '<line x1="' + m.l + '" y1="' + yy + '" x2="' + (W - m.r) + '" y2="' + yy + '" stroke="' + c.b + '" stroke-dasharray="2 3"/><text x="' + (m.l + 4) + '" y="' + (yy - 3) + '" fill="' + c.b + '">' + z[0] + "</text>";
      });
      if (ok(aj.t)) s += '<line x1="' + q.X(log10(aj.t)) + '" y1="' + m.t + '" x2="' + q.X(log10(aj.t)) + '" y2="' + (H - m.b) + '" stroke="' + c.b + '" stroke-dasharray="2 3"/>' +
        '<text x="' + (q.X(log10(aj.t)) + 4) + '" y="' + (H - m.b - 6) + '" fill="' + c.b + '" font-weight="bold">t50 = ' + fmt(aj.t, 1) + " min</text>";
      return s + '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (m.t - 8) + '" text-anchor="middle" fill="' + c.txt + '">Curva de adensamento (Figura 6) — ' + esc(tit) + "</text></svg>";
    }
    var sx = pts.map(function (z) { return Math.sqrt(z.t); }), x1 = Math.ceil(Math.max.apply(null, sx) / 5) * 5 || 5;
    function X(v) { return m.l + v / x1 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var s2 = svg(W, H), px = x1 > 20 ? 5 : 2;
    for (var gx = 0; gx <= x1 + 1e-9; gx += px) s2 += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + c.grade + '" stroke-width="0.6"/><text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + c.txt + '">' + gx + "</text>";
    for (var gy = Math.ceil(y0 / py) * py; gy <= y1 + 1e-9; gy += py) s2 += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + c.grade + '" stroke-width="0.6"/><text x="' + (m.l - 5) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(gy, 2) + "</text>";
    s2 += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + c.eixo + '"/>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + c.txt + '">√t (√min)</text>' +
      '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">Leitura do defletômetro (mm)</text>';
    s2 += '<path d="' + pts.map(function (z, k) { return (k ? "L" : "M") + X(sx[k]).toFixed(1) + " " + Y(z.L).toFixed(1); }).join(" ") + '" fill="none" stroke="' + c.a + '" stroke-width="1.8"/>';
    pts.forEach(function (z, k) { s2 += '<circle cx="' + X(sx[k]).toFixed(1) + '" cy="' + Y(z.L).toFixed(1) + '" r="3" fill="' + c.a + '"/>'; });
    if (aj.reta) {
      [aj.reta.b, aj.b2].forEach(function (b, k) {
        var xb = Math.min(x1, ((k ? 1 : 0.95) * (pts[pts.length - 1].s - aj.reta.a)) / b);
        s2 += '<line x1="' + X(0) + '" y1="' + Y(Ld(aj.reta.a)) + '" x2="' + X(xb) + '" y2="' + Y(Math.min(Math.max(Ld(aj.reta.a + b * xb), y0), y1)) + '" stroke="' + c.d + '" stroke-dasharray="' + (k ? "6 3" : "3 3") + '"/>';
      });
    }
    if (ok(aj.t)) s2 += '<line x1="' + X(Math.sqrt(aj.t)) + '" y1="' + m.t + '" x2="' + X(Math.sqrt(aj.t)) + '" y2="' + (H - m.b) + '" stroke="' + c.b + '" stroke-dasharray="2 3"/>' +
      '<text x="' + (X(Math.sqrt(aj.t)) + 4) + '" y="' + (m.t + 14) + '" fill="' + c.b + '" font-weight="bold">√t90 = ' + fmt(Math.sqrt(aj.t), 2) + " → t90 = " + fmt(aj.t, 1) + " min</text>";
    return s2 + '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (m.t - 8) + '" text-anchor="middle" fill="' + c.txt + '">Curva de adensamento (Figura 8) — ' + esc(tit) + "</text></svg>";
  }

  // ---------- exemplos ----------
  // Figuras 7 e 11 da norma: anel 23 (A = 33,2 cm², H₀ = 2,66 cm), γg = 2,58 g/cm³; ΔH de cada estágio da Figura 11;
  // leituras do estágio de 80 kPa da Figura 7; t50 dos demais estágios lidos da Figura 11 (em minutos)
  function exNorma() {
    var dH = [2.03, 2.30, 3.00, 2.76, 2.68, 2.69, -0.22, -0.40, -0.41, -0.29, -0.28, -0.50];   // mm (compressão +)
    var ps = [20, 40, 80, 160, 320, 640, 320, 160, 80, 40, 20, 0];
    var t50 = [102, 1140, 1680, 1800, 1620, 1380];
    // cadeia de leituras: 13,32 mm antes do 1º estágio; defletômetro reajustado para 10,00 mm antes do estágio de 640 kPa
    var L = 13.32, est = [];
    ps.forEach(function (p, i) {
      var o = { p: String(p) };
      if (i === 5) L = 10.00;
      if (i === 2) {   // Figura 7
        [[0, "8,99"], [0.125, "8,89"], [0.25, "8,86"], [0.5, "8,80"], [1, "8,75"], [2, "8,66"], [4, "8,50"], [8, "8,28"],
          [15, "7,96"], [30, "7,56"], [60, "7,07"], [120, "6,64"], [240, "6,32"], [480, "6,15"], [1440, "5,99"]].forEach(function (x) { o[chaveT(x[0])] = x[1]; });
        o.extra = "305=6,27";
      } else {
        o[chaveT(0)] = fmt(L, 2);
        o.Lf = fmt(L - dH[i], 2);
      }
      if (i < 6) o.tMan = fmt(t50[i] / 60, 2);
      L = Math.round((L - dH[i]) * 100) / 100;
      est.push(o);
    });
    return { ident: { registro: "EX-AD-001", obra: "Obra A", trecho: "BR-000", local: "Sondagem 6, estaca 19, amostra 4 — 6,50 m", camada: "Argila mole orgânica — fundação de aterro", data: "1993-08-05" },
      params: { celula: "fixo", anel: "23", area: "33,2", altura: "2,66", mAnel: "1415,0", mAnelSolo: "1528,6", gg: "2,58", sentido: "diminui", metodo: "t50", gw: "9,81", pCurv: "", virgemDe: "", virgemAte: "" },
      umid: [{ un: "16", ut: "27,01", uu: "41,24", us: "33,04" }, { un: "18", ut: "27,84", uu: "37,59", us: "32,00" }, { un: "15", ut: "25,52", uu: "63,05", us: "41,54" },
        { un: "17", ut: "33,57", uu: "107,22", us: "82,71" }],
      est: est,
      obs: "Dados das Figuras 7 e 11 da norma. Leituras completas só no estágio de 80 kPa (Figura 7); nos demais, a leitura inicial e a final reproduzem os ΔH da Figura 11 e o t50 foi lido da Figura 11. A Figura 11 calcula k com γa ≈ 10 kN/m³ (1 kPa ≈ 10 g/cm²)." };
  }
  // teoria de Terzaghi: grau de adensamento médio U para o fator tempo Tv
  function U(Tv) { return Tv <= 0.2827 ? Math.sqrt(4 * Tv / Math.PI) : 1 - Math.pow(10, -(Tv + 0.0851) / 0.9332); }
  function serieGerada(o, L0, dHp, dHs, t90min) {
    // compressão primária dHp (mm) com t90 dado + secundária dHs (mm) por ciclo log após t100 ≈ 1,6 t90
    var Tcoef = 0.848 / t90min;
    TEMPOS.forEach(function (t) {
      var s = t > 0 ? dHp * U(Tcoef * t) + (t > 1.6 * t90min ? dHs * log10(t / (1.6 * t90min)) : 0) : 0;
      o[chaveT(t)] = fmt(L0 - s, 3);
    });
    return L0 - (dHp * U(Tcoef * 1440) + dHs * log10(1440 / (1.6 * t90min)));
  }
  function exGerado() {
    // argila siltosa pré-adensada; Taylor; anel de 5,0 cm (abaixo de 6,35 cm) e altura 2,0 cm (D/H = 2,5)
    var est = [], L = 12;
    var cfg = [[25, 0.10, 0.004, 6], [50, 0.14, 0.006, 7], [100, 0.40, 0.012, 10], [200, 0.62, 0.016, 11], [400, 0.60, 0.016, 12], [800, 0.55, 0.015, 12]];
    cfg.forEach(function (c) { var o = { p: String(c[0]) }; L = serieGerada(o, L, c[1], c[2], c[3]); est.push(o); });
    [[200, 0.06], [50, 0.09], [25, 0.05]].forEach(function (c) { est.push({ p: String(c[0]), Lf: fmt(L + c[1], 3) }); L += c[1]; });
    return { ident: { registro: "EX-AD-002", obra: "Obra B", local: "Furo SP-1, amostra 2 — 4,00 m", camada: "Argila siltosa pré-adensada" },
      params: { celula: "flutuante", anel: "7", diametro: "5,0", altura: "2,0", mAnel: "98,4", mAnelSolo: "171,2", gg: "2,68", sentido: "diminui", metodo: "t90", gw: "9,81" },
      umid: [{ un: "3", ut: "12,10", uu: "52,40", us: "42,55" }, { un: "8", ut: "11,85", uu: "49,90", us: "40,62" }, { un: "", ut: "", uu: "", us: "" },
        { un: "21", ut: "35,20", uu: "105,10", us: "92,20" }],
      est: est };
  }
  FE.FICHAS["dner-ie-005-94"].exemplos = [
    { nome: "Argila mole orgânica — Figuras 7 e 11 da norma (t50, Casagrande)", dados: exNorma },
    { nome: "Argila siltosa pré-adensada — t90 de Taylor, anel pequeno (gerado)", dados: exGerado },
  ];
})();
