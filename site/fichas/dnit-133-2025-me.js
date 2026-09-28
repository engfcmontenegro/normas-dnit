/*
 * Ficha: DNIT 133/2025-ME — Determinação das deflexões pela viga Benkelman.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Uma coluna por estação de ensaio (estaca/ponto). Deflexões pela eq. 1, correção de temperatura pela eq. 2
 * (Anexo B, só em revestimento asfáltico), raio de curvatura pela eq. 3. A análise estatística do segmento
 * (média, desvio-padrão, deflexão característica) não é da DNIT 133: é opcional e segue a DNER-PRO 011/79 (4.2.7),
 * igual à DNER-PRO 010/79 (4.2.8).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // distâncias das leituras intermediárias (6.8: "no mínimo, 20, 25, 30, 45, 60, 90 e 120 cm")
  var DIST_BACIA = [20, 25, 30, 45, 60, 90, 120];

  // Anexo B, Figura B1 — fator de correção k × temperatura do revestimento, por espessura do revestimento.
  // Valores lidos do gráfico (digitalização da figura, a cada 5 °C); entre valores, interpolação linear
  // na temperatura e na espessura. Todas as curvas passam por k = 1,00 a 25 °C.
  var KB_T = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  var KB = [
    [3, [1.030, 1.020, 1.010, 1.000, 0.990, 0.980, 0.971, 0.962, 0.953, 0.943, 0.934]],
    [6, [1.070, 1.047, 1.023, 1.000, 0.977, 0.954, 0.933, 0.910, 0.891, 0.867, 0.849]],
    [10, [1.130, 1.087, 1.043, 1.000, 0.960, 0.921, 0.883, 0.846, 0.810, 0.778, 0.753]],
    [15, [1.183, 1.122, 1.061, 1.000, 0.943, 0.892, 0.840, 0.792, 0.749, 0.706, 0.673]],
    [20, [1.215, 1.143, 1.072, 1.000, 0.931, 0.875, 0.819, 0.767, 0.717, 0.670, 0.628]],
  ];
  function lin(xs, ys, x) {
    for (var i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    return ys[ys.length - 1];
  }
  // devolve {k, tFora, eFora}; fora do gráfico usa o extremo (e avisa)
  function kAnexoB(T, esp) {
    if (!ok(T) || !ok(esp)) return { k: NaN };
    var t = Math.min(60, Math.max(10, T)), e = Math.min(20, Math.max(3, esp));
    var porEsp = KB.map(function (c) { return lin(KB_T, c[1], t); });
    return { k: lin(KB.map(function (c) { return c[0]; }), porEsp, e), tFora: t !== T, eFora: e !== esp };
  }

  // DNIT 175-PRO, Tabela 1 — intervalos aceitos para a constante aferida
  var INTERVALO_175 = { "2": [1.9, 2.1], "3": [2.85, 3.15], "4": [3.8, 4.2] };

  // Tabela 1 (6.4) — distância da borda do revestimento × largura da faixa
  function bordaTabela1(larg) {
    if (!ok(larg)) return NaN;
    if (larg >= 3.5) return 0.90;
    if (larg >= 3.3) return 0.75;
    if (larg >= 3.0) return 0.60;
    return 0.45;
  }

  // DNER-PRO 011/79, Tabela I — z em função de n
  function zDe(n) { return n >= 20 ? 3 : n >= 7 ? 2.5 : n >= 5 ? 2 : n === 4 ? 1.5 : 1; }
  function desvio(v) {
    var m = media(v);
    return v.length > 1 ? Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN;
  }
  // PRO 011/79 4.2.7 a–g: média, desvio (n − 1), eliminação iterativa fora de D ± zσ, cv, Dc = D + σ
  function estatistica(itens) {  // itens: [{v, i}]
    var rest = itens.slice(), elim = [], passos = 0;
    if (rest.length < 3) return null;
    while (rest.length >= 3 && passos < 50) {
      passos++;
      var vs = rest.map(function (x) { return x.v; }), m = media(vs), s = desvio(vs), z = zDe(rest.length);
      var fora = rest.filter(function (x) { return Math.abs(x.v - m) > z * s; });
      if (!fora.length || !(s > 0)) return { n0: itens.length, n: rest.length, media: m, sd: s, z: z, cv: s / m, dc: m + s, elim: elim, iter: passos };
      fora.forEach(function (x) { x.acima = x.v > m; elim.push(x); });
      rest = rest.filter(function (x) { return fora.indexOf(x) === -1; });
    }
    if (rest.length < 3) {
      var v2 = rest.map(function (x) { return x.v; }), m2 = media(v2), s2 = desvio(v2);
      return { n0: itens.length, n: rest.length, media: m2, sd: s2, z: NaN, cv: s2 / m2, dc: m2 + s2, elim: elim, iter: passos, poucos: true };
    }
    return null;
  }

  function sub(n) { return String(n).replace(/\d/g, function (c) { return "₀₁₂₃₄₅₆₇₈₉"[c]; }); }
  function distsDe(P) { return P.modo === "c1" ? [25] : DIST_BACIA; }
  function nomePonto(p, i) { return "Ponto " + (i + 1) + (p.estaca ? " (est. " + p.estaca + (p.lado ? ", " + p.lado : "") + ")" : ""); }

  // paleta das séries (tela / impressão)
  var CORES = [["#4f8cff", "#1f5fbf"], ["#e5534b", "#c0392b"], ["#34c38f", "#2e8b57"], ["#b37feb", "#7d3c98"], ["#f0a030", "#b9770e"], ["#7fb3d5", "#5d6d7e"]];

  FE.FICHAS["dnit-133-2025-me"] = {
    titulo: "Deflexões pela viga Benkelman",
    resumo: "Leituras L₀, intermediárias e Lf por estação; Dn = (a/b)·(Ln − Lf) (eq. 1), correção de temperatura D′n = Dn × k em revestimento asfáltico (eq. 2, Anexo B), raio de curvatura R = 6250 / [2(D₀ − D₂₅)] (eq. 3) e deflectograma; estatística do segmento opcional (DNER-PRO 011/79).",
    blocos: [],
    params: [
      { k: "modo", r: "Leituras por estação", tipo: "select", recarrega: true,
        opcoes: [["bacia", "Bacia — L₀, L₂₀, L₂₅, L₃₀, L₄₅, L₆₀, L₉₀, L₁₂₀ e Lf (6.7 a 6.9)"], ["c1", "Deflexão e raio — L₀, L₂₅ e Lf (formulário C1)"]],
        dica: "6.8 pede no mínimo as leituras a 20, 25, 30, 45, 60, 90 e 120 cm; o formulário C1 (Anexo C, informativo) registra só L₀, L₂₅ e Lf" },
      { k: "relacao", r: "Relação entre braços da viga a/b (5 a)", tipo: "select", opcoes: [["2", "2/1"], ["3", "3/1"], ["4", "4/1"]] },
      { k: "constante", r: "Constante aferida da viga — opcional (DNIT 175-PRO)", ph: "ex.: 2,02",
        dica: "se informada, substitui a relação nominal a/b na eq. 1" },
      { k: "viga", r: "Tipo de viga / extensômetro", ph: "ex.: viga mecânica, extensômetro analógico 0,01 mm" },
      { k: "superficie", r: "Superfície ensaiada", tipo: "select", recarrega: true,
        opcoes: [["asf", "Revestimento asfáltico — aplica a correção de temperatura (eq. 2)"], ["outro", "Outro revestimento ou camada — sem correção (NOTA 5)"]] },
      { k: "esp", r: "Espessura do revestimento asfáltico (cm)", ph: "ex.: 5", dica: "escolhe a curva da Figura B1 (3, 6, 10, 15 ou 20 cm; interpola entre elas)",
        se: function (d) { return (d.params || {}).superficie !== "outro"; } },
      { k: "kmodo", r: "Fator de correção k (Anexo B)", tipo: "select", recarrega: true,
        opcoes: [["auto", "Calcular pela Figura B1 (valores digitalizados do gráfico)"], ["manual", "Informar o k lido no gráfico, por estação"]],
        se: function (d) { return (d.params || {}).superficie !== "outro"; } },
      { k: "carga", r: "Carga do eixo traseiro simples de roda dupla (tf)", ph: "8,2", dica: "5 b e 6.3: 8,2 tf; outra carga deve ser justificada" },
      { k: "pneus", r: "Pneus — dimensões e pressão", ph: "ex.: 1000 × 20, 0,56 MPa (80 lb/pol²)" },
      { k: "pressao", r: "Pressão dos pneus (MPa)", ph: "0,56", dica: "5 c: 0,56 MPa (5,6 kgf/cm² ou 80 lb/pol²)" },
      { k: "largura", r: "Largura da faixa de tráfego (m) — opcional", dica: "com a distância da borda, confere a Tabela 1" },
      { k: "borda", r: "Distância da roda externa à borda do revestimento (m) — opcional" },
      { k: "estat", r: "Estatística do segmento homogêneo", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não calcular (a DNIT 133 não define)"], ["pro011", "Calcular — DNER-PRO 011/79, 4.2.7 (= PRO 010/79, 4.2.8)"]],
        dica: "média, desvio-padrão, eliminação por D ± zσ e deflexão característica Dc = D + σ sobre as deflexões D₀ da tabela" },
      { k: "fs", r: "Fator de correção sazonal Fs — opcional (PRO 011/79, Tabela II)", ph: "ex.: 1,20",
        dica: "estação seca: 1,10–1,30 (arenoso) ou 1,20–1,40 (argiloso); estação chuvosa: 1,00",
        se: function (d) { return (d.params || {}).estat === "pro011"; } },
    ],
    padrao: { modo: "bacia", relacao: "2", superficie: "asf", kmodo: "auto", carga: "8,2", pressao: "0,56", estat: "nao" },
    tabelas: function (d) {
      var P = d.params || {}, asf = P.superficie !== "outro", dists = distsDe(P);
      var linhas = [
        { k: "estaca", r: "Estaca ou km", texto: true, ph: "ex.: 120+10" },
        { k: "lado", r: "Faixa / trilha (LD, LE · TRE, TRI)", texto: true, ph: "LD TRE" },
        { k: "hora", r: "Hora", texto: true, ph: "hh:mm" },
        { k: "tar", r: "Temperatura do ar (6.6)", u: "°C" },
        { k: "tpav", r: "Temperatura da superfície do pavimento (6.6)", u: "°C" },
        { grupo: "Leituras do extensômetro (0,01 mm)" },
        { k: "L0", r: "L₀ — leitura inicial (6.7)", u: "0,01 mm" },
      ];
      dists.forEach(function (n) { linhas.push({ k: "L" + n, r: "L" + sub(n) + " — a " + n + " cm (6.8" + (n === 25 ? ", 6.10" : "") + ")", u: "0,01 mm" }); });
      linhas.push({ k: "Lf", r: "Lf — leitura final, a 10 m (6.9)", u: "0,01 mm" });
      linhas.push({ grupo: "Deflexões — Dn = (a/b) × (Ln − Lf) (eq. 1)" });
      linhas.push({ calc: "D0", r: "D₀ — deflexão máxima", u: "0,01 mm", casas: 1, destaque: !asf });
      dists.forEach(function (n) { linhas.push({ calc: "D" + n, r: "D" + sub(n), u: "0,01 mm", casas: 1 }); });
      if (asf) {
        linhas.push({ grupo: "Correção de temperatura — D′n = Dn × k (eq. 2, Anexo B)" });
        if (P.kmodo === "manual") linhas.push({ k: "kman", r: "k lido na Figura B1", u: "" });
        else linhas.push({ calc: "k", r: "k — Figura B1 (temperatura do pavimento, espessura)", u: "", casas: 3 });
        linhas.push({ calc: "C0", r: "D′₀ — deflexão máxima corrigida", u: "0,01 mm", casas: 1, destaque: true });
        dists.forEach(function (n) { linhas.push({ calc: "C" + n, r: "D′" + sub(n), u: "0,01 mm", casas: 1 }); });
      }
      linhas.push({ calc: "R", r: "Raio de curvatura R = 6250 / [2(D₀ − D₂₅)] (eq. 3)", u: "m", casas: 0, destaque: true });
      return [{
        chave: "pts", titulo: "Estações de ensaio", rotulo: "Estação", iniciais: 5, min: 1,
        dica: "uma coluna por estaca/ponto, na trilha de roda externa (6.4); leituras em centésimos de milímetro",
        linhas: linhas,
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], asf = P.superficie !== "outro", kman = P.kmodo === "manual", dists = distsDe(P);
      var nominal = num(P.relacao || "2"), cte = num(P.constante), ab = ok(cte) && cte > 0 ? cte : nominal;
      var esp = num(P.esp);

      // ---- verificações gerais ----
      if (ok(cte) && INTERVALO_175[P.relacao || "2"]) {
        var iv = INTERVALO_175[P.relacao || "2"];
        if (cte < iv[0] || cte > iv[1]) avisos.push("Constante aferida " + fmt(cte, 3) + " fora do intervalo " + fmt(iv[0], 2) + " – " + fmt(iv[1], 2) +
          " aceito para a relação " + P.relacao + "/1 (DNIT 175-PRO, Tabela 1): confira a aferição da viga (6.1).");
      }
      var carga = num(P.carga), pressao = num(P.pressao);
      if (ok(carga) && Math.abs(carga - 8.2) > 0.05) avisos.push("Carga do eixo de " + fmt(carga, 2) + " tf, diferente de 8,2 tf: a alteração deve ser justificada (5 b).");
      if (ok(pressao) && Math.abs(pressao - 0.56) > 0.005) avisos.push("Pressão dos pneus de " + fmt(pressao, 2) + " MPa, diferente de 0,56 MPa (5 c).");
      var larg = num(P.largura), borda = num(P.borda), bordaT = bordaTabela1(larg);
      if (ok(larg) && ok(borda) && Math.abs(borda - bordaT) > 0.005)
        avisos.push("Roda externa a " + fmt(borda, 2) + " m da borda; para faixa de " + fmt(larg, 2) + " m a Tabela 1 indica " + fmt(bordaT, 2) + " m (6.4).");
      if (asf && !kman) {
        if (!ok(esp)) avisos.push("Informe a espessura do revestimento asfáltico para obter k na Figura B1 (Anexo B).");
        else if (esp < 3 || esp > 20) avisos.push("Espessura de " + fmt(esp, 1) + " cm fora das curvas da Figura B1 (3 a 20 cm): usada a curva extrema — confira o k.");
      }

      // ---- estações ----
      var pts = (d.pts || []).map(function (p, i) {
        var o = {}, L0 = num(p.L0), Lf = num(p.Lf), nome = nomePonto(p, i), msgs = [];
        o.D0 = ok(L0) && ok(Lf) ? ab * (L0 - Lf) : NaN;
        dists.forEach(function (n) { var L = num(p["L" + n]); o["D" + n] = ok(L) && ok(Lf) ? ab * (L - Lf) : NaN; });
        var k = 1;
        if (asf) {
          if (kman) {
            k = num(p.kman);
            if (ok(o.D0) && !ok(k)) msgs.push("informe o k lido na Figura B1");
          } else {
            var T = num(p.tpav), kb = kAnexoB(T, esp);
            k = kb.k;
            if (ok(o.D0) && !ok(T)) msgs.push("informe a temperatura do pavimento para o fator k (Anexo B)");
            if (kb.tFora) msgs.push("temperatura do pavimento de " + fmt(T, 1) + " °C fora da Figura B1 (10 °C a 60 °C) — k do extremo do gráfico");
          }
          o.k = k;
          o.C0 = o.D0 * k;
          dists.forEach(function (n) { o["C" + n] = o["D" + n] * k; });
        }
        var pre = asf ? "C" : "D";
        o.def = o[pre + "0"];
        var d25 = o[pre + "25"], dif = o.def - d25;
        o.R = ok(dif) && dif > 0 ? 6250 / (2 * dif) : NaN;
        o.bacia = [[0, o.def]].concat(dists.map(function (n) { return [n, o[pre + n]]; })).filter(function (x) { return ok(x[1]); });
        // verificações por estação
        if (ok(o.D0) && o.D0 <= 0) msgs.push("L₀ ≤ Lf: deflexão nula ou negativa — confira as leituras e o sentido do extensômetro (a eq. 1 pressupõe L₀ > Lf)");
        if (ok(o.def) && ok(d25) && dif <= 0) msgs.push("D₂₅ ≥ D₀: raio de curvatura indeterminado — confira L₂₅");
        if (P.modo !== "c1") {
          var subida = [];
          for (var j = 1; j < o.bacia.length; j++) if (o.bacia[j][1] > o.bacia[j - 1][1] + 1e-9) subida.push(o.bacia[j][0] + " cm");
          if (subida.length) msgs.push("bacia não decrescente (deflexão maior que a do ponto anterior a " + subida.join(", ") + ") — confira as leituras");
          var falta = dists.filter(function (n) { return !ok(num(p["L" + n])); });
          if (ok(o.D0) && falta.length) msgs.push("faltam leituras a " + falta.join(", ") + " cm (6.8)");
        } else if (ok(o.D0) && !ok(num(p.L25))) msgs.push("sem L₂₅ não se calcula o raio de curvatura (6.10)");
        if (asf && ok(o.R) && o.R < 100) msgs.push("R = " + fmt(o.R, 0) + " m < 100 m: a DNER-PRO 011/79 (4.2.2) pede determinações adicionais");
        if (msgs.length) avisos.push(nome + ": " + msgs.join("; ") + ".");
        o.nome = nome; o.estaca = p.estaca || String(i + 1); o.lado = (p.lado || "").trim();
        return o;
      });

      // ---- resultados ----
      var validos = pts.filter(function (o) { return ok(o.def); });
      var defs = validos.map(function (o) { return o.def; }), raios = pts.map(function (o) { return o.R; }).filter(ok);
      var r = { n: validos.length, ab: ab, abFonte: ok(cte) && cte > 0 ? "constante aferida" : "relação nominal " + (P.relacao || "2") + "/1", asf: asf,
        dMax: defs.length ? Math.max.apply(null, defs) : NaN, dMin: defs.length ? Math.min.apply(null, defs) : NaN,
        rMin: raios.length ? Math.min.apply(null, raios) : NaN, nR: raios.length, est: null, fs: num(P.fs), dp: NaN };
      if (P.estat === "pro011") {
        var itens = validos.map(function (o) { return { v: o.def, i: pts.indexOf(o), nome: o.nome }; });
        r.est = estatistica(itens);
        if (!r.est) avisos.push("Estatística do segmento: são necessários pelo menos 3 valores de D₀ (PRO 011/79, Tabela I).");
        else {
          r.est.elim.forEach(function (x) { pts[x.i].elim = true; });
          if (r.est.elim.length) avisos.push("Estatística (PRO 011/79, 4.2.7 e): eliminado(s) fora do intervalo D ± zσ — " +
            r.est.elim.map(function (x) { return x.nome + " = " + fmt(x.v, 1) + (x.acima ? " (acima)" : " (abaixo)"); }).join("; ") +
            ". Os valores acima de D + zσ merecem tratamento especial (PRO 010/79, 4.2.8 e).");
          if (r.est.poucos) avisos.push("Após as eliminações restaram menos de 3 valores: estatística pouco representativa.");
          if (ok(r.fs)) r.dp = r.est.dc * r.fs;
        }
      }
      return { tab: { pts: pts }, pontos: pts, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, e = r.est, D = r.asf ? "D′₀" : "D₀";
      var item = function (v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; };
      var h = '<div class="fe-res">' +
        item(r.n ? fmt(r.dMin, 1) + " – " + fmt(r.dMax, 1) + " <small>0,01 mm</small>" : "—", "Deflexão máxima " + D + (r.asf ? " corrigida (eq. 2)" : " (eq. 1)") + " — menor e maior de " + r.n + " estação(ões)") +
        item(ok(r.rMin) ? fmt(r.rMin, 0) + " <small>m</small>" : "—", "Menor raio de curvatura (eq. 3)" + (r.nR ? " — " + r.nR + " estação(ões)" : ""), true) +
        item(fmt(r.ab, ok(r.ab) && r.ab % 1 ? 3 : 0), "Constante da viga a/b usada na eq. 1 — " + esc(r.abFonte), true);
      if (e) {
        h += item(fmt(e.media, 1) + " ± " + fmt(e.sd, 1) + " <small>0,01 mm</small>", "Média e desvio-padrão (PRO 011/79) — n = " + e.n + " de " + e.n0 + ", cv = " + fmt(e.cv * 100, 1) + " %", true) +
          item(fmt(e.dc, 1) + " <small>0,01 mm</small>", "Deflexão característica Dc = D + σ (PRO 011/79, 4.2.7 g)");
        if (ok(r.dp)) h += item(fmt(r.dp, 1) + " <small>0,01 mm</small>", "Deflexão de projeto Dp = Dc × Fs (Fs = " + fmt(r.fs, 2) + ")");
      }
      return h + "</div>";
    },
    graficos: function (calc, d, opt) {
      var g = [deflectograma(calc, d, opt || {})];
      if ((d.params || {}).modo !== "c1") g.push(bacias(calc, d, opt || {}));
      return g;
    },
    relatorio: {
      notas: "Dn = (a/b) × (Ln − Lf), em 0,01 mm, com n = distância da roda dupla à ponta de prova (eq. 1). Em revestimento asfáltico todas as deflexões são multiplicadas pelo fator k da Figura B1 (eq. 2; NOTA 5: não se aplica a outros revestimentos ou camadas); " +
        "k em função da temperatura da superfície do pavimento e da espessura do revestimento, com valores lidos do gráfico e interpolação linear. R = 6250 / [2(D₀ − D₂₅)], em metros (eq. 3), calculado com as deflexões já corrigidas. " +
        "A DNIT 133 não define tratamento estatístico; quando apresentado, segue a DNER-PRO 011/79, 4.2.7 (desvio-padrão com n − 1, eliminação iterativa fora de D ± zσ, Dc = D + σ).",
      parametros: [["Leituras", "L₀ após estabilização (≤ 0,01 mm/min ou ≥ 3 min com vibrador); veículo a ≤ 1,6 km/h; Lf com a roda dupla a 10 m do ponto (6.7 a 6.9)"]],
      resultados: function (calc, d) {
        var r = calc.resultados, e = r.est, rows = [], D = r.asf ? "D′₀ (corrigida)" : "D₀";
        rows.push(["Constante da viga (eq. 1)", fmt(r.ab, r.ab % 1 ? 3 : 0) + " — " + r.abFonte]);
        rows.push(["Deflexão máxima " + D + " — menor / maior", r.n ? fmt(r.dMin, 1) + " / " + fmt(r.dMax, 1) + " × 0,01 mm (" + r.n + " estações)" : "—"]);
        rows.push(["Menor raio de curvatura", ok(r.rMin) ? fmt(r.rMin, 0) + " m" : "—"]);
        if (e) {
          rows.push(["Média / desvio-padrão (PRO 011/79)", fmt(e.media, 1) + " / " + fmt(e.sd, 1) + " × 0,01 mm — n = " + e.n + " de " + e.n0 + (e.elim.length ? " (" + e.elim.length + " eliminado(s))" : "")]);
          rows.push(["Coeficiente de variação", fmt(e.cv * 100, 1) + " %"]);
          rows.push(["Deflexão característica Dc = D + σ", fmt(e.dc, 1) + " × 0,01 mm"]);
          if (ok(r.dp)) rows.push(["Deflexão de projeto Dp = Dc × Fs", fmt(r.dp, 1) + " × 0,01 mm (Fs = " + fmt(r.fs, 2) + ")"]);
        }
        return rows;
      },
    },
    exemplos: [
      { nome: "CBUQ 5 cm — bacias completas, viga 2/1 (dados gerados)", dados: function () {
        var L = [
          ["100", "LD TRE", "08:40", "24", "29,5", "244 239 237 235 229 225 220 217 213"],
          ["105", "LD TRE", "09:05", "25", "31,0", "224 217 215 212 205 200 195 192 188"],
          ["110", "LD TRE", "09:30", "26", "33,5", "268 264 262 261 256 252 247 244 240"],
          ["115", "LD TRE", "09:55", "27", "35,0", "247 239 235 232 224 218 212 209 205"],
          ["120", "LD TRE", "10:20", "28", "37,5", "209 204 202 199 193 189 183 180 176"],
        ];
        return { ident: { registro: "EX-VB-001", data: "2026-08-12", obra: "BR-000/RR", trecho: "km 12 – km 13, sentido crescente", camada: "Revestimento CBUQ 5 cm", laboratorista: "Equipe de campo" },
          params: { modo: "bacia", relacao: "2", viga: "Viga mecânica, extensômetro analógico 0,01 mm", superficie: "asf", esp: "5", kmodo: "auto",
            carga: "8,2", pneus: "1000 × 20, frisados", pressao: "0,56", largura: "3,50", borda: "0,90", estat: "nao" },
          pts: L.map(function (x) {
            var v = x[5].split(" ");
            return { estaca: x[0], lado: x[1], hora: x[2], tar: x[3], tpav: x[4], L0: v[0], L20: v[1], L25: v[2], L30: v[3], L45: v[4], L60: v[5], L90: v[6], L120: v[7], Lf: v[8] };
          }) };
      } },
      { nome: "Segmento de 12 estacas — L₀, L₂₅, Lf, estatística PRO 011/79 (dados gerados)", dados: function () {
        // estacas a cada 20 m alternando LD/LE; a estaca 138 tem deflexão alta (eliminada) e raio < 100 m
        var L = [
          ["128", "LD TRE", "27", "31", "236 229 206"], ["129", "LE TRE", "27", "31", "198 190 167"],
          ["130", "LD TRE", "28", "33", "251 245 227"], ["131", "LE TRE", "28", "34", "214 205 179"],
          ["132", "LD TRE", "29", "35", "262 254 230"], ["133", "LE TRE", "29", "36", "187 180 160"],
          ["134", "LD TRE", "30", "37", "240 232 211"], ["135", "LE TRE", "30", "38", "222 214 194"],
          ["136", "LD TRE", "31", "39", "205 198 174"], ["137", "LE TRE", "31", "40", "230 221 195"],
          ["138", "LD TRE", "31", "41", "281 258 222"], ["139", "LE TRE", "32", "41", "209 201 183"],
        ];
        return { ident: { registro: "EX-VB-002", data: "2026-09-03", obra: "BR-000/RR", trecho: "Segmento homogêneo 3 — est. 128 a 139", camada: "Revestimento CBUQ 4 cm" },
          params: { modo: "c1", relacao: "2", constante: "2,02", viga: "Viga mecânica aferida em 25/08/2026", superficie: "asf", esp: "4", kmodo: "auto",
            carga: "8,2", pressao: "0,56", estat: "pro011", fs: "1,20" },
          pts: L.map(function (x) { var v = x[4].split(" "); return { estaca: x[0], lado: x[1], tar: x[2], tpav: x[3], L0: v[0], L25: v[1], Lf: v[2] }; }) };
      } },
      { nome: "Topo da base granular — viga 4/1, sem correção, leituras com problemas (dados gerados)", dados: function () {
        var L = [
          ["45", "LD TRE", "22", "26", "310 301 298 296 291 288 285 284 282"],
          ["50", "LD TRE", "23", "27", "322 313 324 305 299 295 292 290 288"],
          ["55", "LD TRE", "24", "28", "295 290 288 286 287 281 279 278 277"],
          ["60", "LD TRE", "24", "29", "338 322 315 309 298 292 288 286 284"],
        ];
        return { ident: { registro: "EX-VB-003", data: "2026-07-21", obra: "Acesso ao porto", trecho: "Pista esquerda", camada: "Base de brita graduada — antes da imprimação" },
          params: { modo: "bacia", relacao: "4", viga: "Viga 4/1", superficie: "outro", carga: "8,0", pressao: "0,56", largura: "3,30", borda: "0,60", estat: "nao" },
          obs: "Carga de 8,0 tf por limitação do caminhão disponível.",
          pts: L.map(function (x) {
            var v = x[4].split(" ");
            return { estaca: x[0], lado: x[1], tar: x[2], tpav: x[3], L0: v[0], L20: v[1], L25: v[2], L30: v[3], L45: v[4], L60: v[5], L90: v[6], L120: v[7], Lf: v[8] };
          }) };
      } },
    ],
  };

  // ---------- gráficos ----------
  function eixos(opt) {
    var imp = opt.imprimir;
    return { imp: imp, txt: imp ? "#222" : "var(--text-dim)", grade: imp ? "#ddd" : "var(--border)" };
  }
  function passo(max) {
    var alvo = max / 6, p = Math.pow(10, Math.floor(Math.log10(alvo))), m = alvo / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  }

  // deflectograma: D₀ (corrigida) por estação, uma série por faixa/trilha; média e Dc quando houver estatística
  function deflectograma(calc, d, opt) {
    var pts = calc.pontos, val = pts.filter(function (o) { return ok(o.def); });
    if (!val.length) return '<div class="fe-graf-vazio">O deflectograma aparece com as leituras L₀ e Lf.</div>';
    var c = eixos(opt), r = calc.resultados, e = r.est;
    var W = opt.w || 600, H = opt.h || 300, m = { l: 50, r: 16, t: 26, b: 48 };
    var maxV = Math.max.apply(null, val.map(function (o) { return o.def; }).concat(e ? [e.dc] : [])) * 1.1;
    var st = passo(maxV), yMax = Math.ceil(maxV / st) * st, n = pts.length;
    function X(i) { return m.l + (n === 1 ? 0.5 : (i + 0.5) / n) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / yMax * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    for (var v = 0; v <= yMax + 1e-9; v += st) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(v, 0) + "</text>";
    }
    var cada = Math.max(1, Math.ceil(n / 16));
    pts.forEach(function (o, i) {
      if (i % cada) return;
      s += '<text x="' + X(i) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + c.txt + '">' + esc(o.estaca) + "</text>";
    });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 10) + '" text-anchor="middle" fill="' + c.txt + '">Estaca / km</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">' + (r.asf ? "D′₀" : "D₀") + " (0,01 mm)</text>";
    if (e) {
      [[e.media, "média " + fmt(e.media, 1), "4 3", 13], [e.dc, "Dc " + fmt(e.dc, 1), "8 3", -4]].forEach(function (L) {
        s += '<line x1="' + m.l + '" y1="' + Y(L[0]) + '" x2="' + (W - m.r) + '" y2="' + Y(L[0]) + '" stroke="' + (c.imp ? "#555" : "var(--text)") + '" stroke-dasharray="' + L[2] + '" stroke-width="1.2"/>';
        s += '<text x="' + (W - m.r - 4) + '" y="' + (Y(L[0]) + L[3]) + '" text-anchor="end" fill="' + c.txt + '">' + L[1] + "</text>";
      });
    }
    // séries por faixa/trilha (ordem de aparecimento)
    var lados = [];
    pts.forEach(function (o) { if (ok(o.def) && lados.indexOf(o.lado) === -1) lados.push(o.lado); });
    lados.forEach(function (ld, j) {
      var cor = CORES[j % CORES.length][c.imp ? 1 : 0];
      var serie = pts.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return ok(x.o.def) && x.o.lado === ld; });
      s += '<path d="' + serie.map(function (x, k) { return (k ? "L" : "M") + X(x.i).toFixed(1) + " " + Y(x.o.def).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.8"/>';
      serie.forEach(function (x) {
        s += '<circle cx="' + X(x.i).toFixed(1) + '" cy="' + Y(x.o.def).toFixed(1) + '" r="3.8" fill="' + (x.o.elim ? (c.imp ? "#fff" : "var(--panel)") : cor) + '" stroke="' + cor + '" stroke-width="1.5"/>';
      });
      if (lados.length > 1 || ld) {
        s += '<rect x="' + (m.l + 6 + j * 95) + '" y="7" width="12" height="4" fill="' + cor + '"/>';
        s += '<text x="' + (m.l + 22 + j * 95) + '" y="12" fill="' + c.txt + '">' + esc(ld || "sem faixa") + "</text>";
      }
    });
    if (e && e.elim.length) s += '<text x="' + (W - m.r) + '" y="12" text-anchor="end" fill="' + c.txt + '">○ eliminado na estatística</text>';
    return s + "</svg>";
  }

  // bacias de deflexão: deflexão × distância, eixo vertical para baixo
  function bacias(calc, d, opt) {
    var pts = calc.pontos.filter(function (o) { return o.bacia.length >= 2; });
    if (!pts.length) return '<div class="fe-graf-vazio">As bacias aparecem com as leituras intermediárias.</div>';
    var c = eixos(opt), r = calc.resultados;
    var W = opt.w || 600, H = opt.h || 280, m = { l: 50, r: 16, t: 14, b: 40 };
    var maxV = Math.max.apply(null, pts.map(function (o) { return Math.max.apply(null, o.bacia.map(function (x) { return x[1]; })); })) * 1.08;
    var minV = Math.min(0, Math.min.apply(null, pts.map(function (o) { return Math.min.apply(null, o.bacia.map(function (x) { return x[1]; })); })));
    var st = passo(maxV - minV), yMax = Math.ceil(maxV / st) * st, yMin = Math.floor(minV / st) * st;
    function X(x) { return m.l + x / 120 * (W - m.l - m.r - 90); }
    function Y(v) { return m.t + (v - yMin) / (yMax - yMin) * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    for (var v = yMin; v <= yMax + 1e-9; v += st) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + X(120) + '" y2="' + Y(v) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(v, 0) + "</text>";
    }
    [0].concat(DIST_BACIA).forEach(function (x) {
      s += '<line x1="' + X(x) + '" y1="' + m.t + '" x2="' + X(x) + '" y2="' + (H - m.b) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(x) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + c.txt + '">' + x + "</text>";
    });
    s += '<text x="' + ((X(0) + X(120)) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + c.txt + '">Distância da roda dupla à ponta de prova (cm)</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">' + (r.asf ? "D′n" : "Dn") + " (0,01 mm)</text>";
    pts.forEach(function (o, j) {
      var cor = CORES[j % CORES.length][c.imp ? 1 : 0];
      s += '<path d="' + o.bacia.map(function (x, k) { return (k ? "L" : "M") + X(x[0]).toFixed(1) + " " + Y(x[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.6"/>';
      o.bacia.forEach(function (x) { s += '<circle cx="' + X(x[0]).toFixed(1) + '" cy="' + Y(x[1]).toFixed(1) + '" r="2.6" fill="' + cor + '"/>'; });
      if (j < 12) {
        s += '<rect x="' + (X(120) + 14) + '" y="' + (m.t + 4 + j * 15) + '" width="12" height="4" fill="' + cor + '"/>';
        s += '<text x="' + (X(120) + 30) + '" y="' + (m.t + 9 + j * 15) + '" fill="' + c.txt + '">' + esc(o.estaca) + "</text>";
      }
    });
    return s + "</svg>";
  }
})();
