/*
 * Ficha: DNER-ME 039/94 — Pavimento — Determinação das deflexões pelo Dynaflect.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Calibração diária dos geofones na placa do calibrador (4.1: leitura de 5 × 10⁻³ pol), localização dos pontos
 * (Tabela 1), deflexões D = L × 2,54 em 0,01 mm com L em milésimos de polegada (5.1) e bacia de deformação nos
 * afastamentos 0; 0,30; 0,60; 0,90; 1,20 m (5.2, Tabela 2). Estatística do segmento opcional: a DNER-ME 039 não a
 * define; segue o mesmo critério da ficha da viga Benkelman (DNER-PRO 011/79, 4.2.7) aplicado a D1.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var AFAST = [0, 0.30, 0.60, 0.90, 1.20];  // Tabela 2 (m)
  var NG = 5;
  function nGeo(P) { return P.sexto === "sim" ? 6 : NG; }
  function afast(P) { var a = AFAST.slice(); if (P.sexto === "sim") a.push(ok(num(P.x6)) ? num(P.x6) : NaN); return a; }
  function sub(n) { return String(n).replace(/\d/g, function (c) { return "₀₁₂₃₄₅₆₇₈₉"[c]; }); }

  // Tabela 1 — largura da faixa de tráfego × distância à borda do revestimento
  function bordaTabela1(larg) {
    if (!ok(larg)) return NaN;
    if (larg >= 3.5) return 0.90;
    if (larg >= 3.3) return 0.75;
    if (larg >= 3.0) return 0.60;
    return 0.45;
  }
  // DNER-PRO 011/79, Tabela I e 4.2.7 (mesmo tratamento da ficha DNIT 133-ME)
  function zDe(n) { return n >= 20 ? 3 : n >= 7 ? 2.5 : n >= 5 ? 2 : n === 4 ? 1.5 : 1; }
  function desvio(v) {
    var m = media(v);
    return v.length > 1 ? Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN;
  }
  function estatistica(itens) {
    var rest = itens.slice(), elim = [], passos = 0;
    if (rest.length < 3) return null;
    while (rest.length >= 3 && passos < 50) {
      passos++;
      var vs = rest.map(function (x) { return x.v; }), m = media(vs), s = desvio(vs), z = zDe(rest.length);
      var fora = rest.filter(function (x) { return Math.abs(x.v - m) > z * s; });
      if (!fora.length || !(s > 0)) return { n0: itens.length, n: rest.length, media: m, sd: s, z: z, cv: s / m, dc: m + s, elim: elim };
      fora.forEach(function (x) { x.acima = x.v > m; elim.push(x); });
      rest = rest.filter(function (x) { return fora.indexOf(x) === -1; });
    }
    var v2 = rest.map(function (x) { return x.v; }), m2 = media(v2), s2 = desvio(v2);
    return { n0: itens.length, n: rest.length, media: m2, sd: s2, z: NaN, cv: s2 / m2, dc: m2 + s2, elim: elim, poucos: true };
  }
  var CORES = [["#4f8cff", "#1f5fbf"], ["#e5534b", "#c0392b"], ["#34c38f", "#2e8b57"], ["#b37feb", "#7d3c98"], ["#f0a030", "#b9770e"], ["#7fb3d5", "#5d6d7e"]];

  FE.FICHAS["dner-me-039-94"] = {
    titulo: "Pavimento — Deflexões pelo Dynaflect",
    resumo: "Calibração dos geofones (4.1), leituras dos sensores por ponto, deflexões D = L × 2,54 (0,01 mm, 5.1), bacia de deformação (Tabela 2) e deflectograma; estatística do segmento opcional (critério da DNER-PRO 011/79).",
    blocos: [],
    params: [
      { k: "equipamento", r: "Equipamento Dynaflect — identificação / nº de série" },
      { k: "escala", r: "Leituras dos sensores", tipo: "select", recarrega: true,
        opcoes: [["mils", "L já em milésimos de polegada (valor do painel)"], ["fator", "Leitura do mostrador × fator de escala de cada geofone"]],
        dica: "use o fator quando o painel indicar a leitura na escala selecionada (multiplicador)" },
      { k: "sexto", r: "6º geofone (opcional, seção 3 c)", tipo: "select", recarrega: true, opcoes: [["nao", "Não usado"], ["sim", "Usado"]] },
      { k: "x6", r: "Afastamento do 6º geofone (m)", ph: "1,50", se: function (d) { return (d.params || {}).sexto === "sim"; } },
      { k: "revest", r: "Revestimento", ph: "ex.: concreto asfáltico 5 cm" },
      { k: "largura", r: "Largura da faixa de tráfego (m) — opcional", dica: "com a distância à borda, confere a Tabela 1 (4.2)" },
      { k: "borda", r: "Distância dos pontos à borda do revestimento (m) — opcional" },
      { k: "estat", r: "Estatística do segmento", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não calcular (a DNER-ME 039 não define)"], ["pro011", "Calcular sobre D1 — critério da DNER-PRO 011/79, 4.2.7"]],
        dica: "média, desvio-padrão (n − 1), eliminação por D ± zσ e deflexão característica Dc = D + σ" },
    ],
    padrao: { escala: "mils", sexto: "nao", estat: "nao" },
    tabelas: function (d) {
      var P = d.params || {}, n = nGeo(P), fat = P.escala === "fator", x = afast(P);
      var cal = [];
      for (var g = 1; g <= n; g++) cal.push({ k: "g" + g, r: "Geofone " + g + " — leitura na placa do calibrador", u: "10⁻³ pol" });
      var l = [{ k: "estaca", r: "Estaca / km", texto: true }, { k: "lado", r: "Faixa / trilha", texto: true, ph: "LD TRE" }, { k: "hora", r: "Hora", texto: true },
        { grupo: "Leituras dos sensores após estabilizar (4.3 f, g)" }];
      for (var i = 1; i <= n; i++) {
        l.push({ k: "L" + i, r: "Geofone " + i + " (x = " + (ok(x[i - 1]) ? fmt(x[i - 1], 2) : "?") + " m) — " + (fat ? "leitura do mostrador" : "L"), u: fat ? "" : "10⁻³ pol" });
        if (fat) l.push({ k: "f" + i, r: "Geofone " + i + " — fator de escala", ph: "1" });
      }
      if (fat) for (var j = 1; j <= n; j++) l.push({ calc: "L" + j, r: "L" + sub(j) + " = leitura × fator", u: "10⁻³ pol", casas: 3 });
      l.push({ grupo: "Deflexões — D = L × 2,54 (5.1)" });
      for (var k = 1; k <= n; k++) l.push({ calc: "D" + k, r: "D" + sub(k) + " (x = " + (ok(x[k - 1]) ? fmt(x[k - 1], 2) : "?") + " m)", u: "0,01 mm", casas: 2, destaque: k === 1 });
      return [
        { chave: "cal", titulo: "Ajustagem e calibração no início da jornada (4.1)", rotulo: "Verificação", iniciais: 1, min: 1,
          dica: "placa do calibrador com amplitude de 127 × 10⁻⁶ m a 8 Hz; cada geofone é ajustado até ler 5 × 10⁻³ pol", linhas: cal },
        { chave: "pts", titulo: "Pontos de medição", rotulo: "Ponto", iniciais: 5, min: 1, linhas: l,
          dica: "uma coluna por ponto, à distância da borda da Tabela 1" },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], n = nGeo(P), fat = P.escala === "fator", x = afast(P);
      // calibração (4.1)
      var calOk = null;
      (d.cal || []).forEach(function (c, j) {
        var fora = [];
        for (var g = 1; g <= n; g++) {
          var v = num(c["g" + g]);
          if (ok(v)) { calOk = calOk === null ? true : calOk; if (Math.abs(v - 5) > 0.005) { fora.push("geofone " + g + " = " + fmt(v, 2)); calOk = false; } }
        }
        if (fora.length) avisos.push("Calibração" + ((d.cal || []).length > 1 ? " " + (j + 1) : "") + ": " + fora.join("; ") +
          " × 10⁻³ pol — cada geofone deve ser ajustado até a leitura de 5,00 × 10⁻³ pol na placa do calibrador (4.1).");
      });
      if (calOk === null) avisos.push("Registre a verificação dos geofones na placa do calibrador, feita no início de cada jornada (4.1).");
      if (P.sexto === "sim" && !ok(num(P.x6))) avisos.push("Informe o afastamento do 6º geofone para desenhá-lo na bacia.");
      var larg = num(P.largura), borda = num(P.borda), bT = bordaTabela1(larg);
      if (ok(larg) && ok(borda) && Math.abs(borda - bT) > 0.005)
        avisos.push("Pontos a " + fmt(borda, 2) + " m da borda; para faixa de " + fmt(larg, 2) + " m a Tabela 1 indica " + fmt(bT, 2) + " m (4.2).");
      var pts = (d.pts || []).map(function (p, i) {
        var o = {}, msgs = [], nome = "Ponto " + (i + 1) + (p.estaca ? " (est. " + p.estaca + (p.lado ? ", " + p.lado : "") + ")" : "");
        for (var g = 1; g <= n; g++) {
          var lei = num(p["L" + g]), f = fat ? (ok(num(p["f" + g])) ? num(p["f" + g]) : 1) : 1;
          o["L" + g] = ok(lei) ? lei * f : NaN;
          o["D" + g] = o["L" + g] * 2.54;  // 5.1
        }
        o.bacia = x.map(function (xx, k) { return [xx, o["D" + (k + 1)]]; }).filter(function (b) { return ok(b[0]) && ok(b[1]); });
        var sobe = [];
        for (var k = 1; k < o.bacia.length; k++) if (o.bacia[k][1] > o.bacia[k - 1][1] + 1e-9) sobe.push(fmt(o.bacia[k][0], 2) + " m");
        if (sobe.length) msgs.push("bacia não decrescente (deflexão maior que a do geofone anterior em " + sobe.join(", ") + ") — confira as leituras");
        var faltam = [];
        for (var q = 1; q <= n; q++) if (!ok(o["D" + q])) faltam.push(q);
        if (ok(o.D1) && faltam.length) msgs.push("falta(m) a(s) leitura(s) do(s) geofone(s) " + faltam.join(", "));
        if (ok(o.D1) && o.D1 <= 0) msgs.push("D1 nula ou negativa");
        if (msgs.length) avisos.push(nome + ": " + msgs.join("; ") + ".");
        o.def = o.D1; o.nome = nome; o.estaca = p.estaca || String(i + 1); o.lado = (p.lado || "").trim();
        return o;
      });
      var val = pts.filter(function (o) { return ok(o.def); }), defs = val.map(function (o) { return o.def; });
      var r = { n: val.length, dMax: defs.length ? Math.max.apply(null, defs) : NaN, dMin: defs.length ? Math.min.apply(null, defs) : NaN, dMed: media(defs), est: null,
        calOk: calOk, x: x };
      if (P.estat === "pro011") {
        r.est = estatistica(val.map(function (o) { return { v: o.def, i: pts.indexOf(o), nome: o.nome }; }));
        if (!r.est) avisos.push("Estatística do segmento: são necessários pelo menos 3 valores de D1.");
        else {
          r.est.elim.forEach(function (e) { pts[e.i].elim = true; });
          if (r.est.elim.length) avisos.push("Estatística (critério da PRO 011/79, 4.2.7 e): eliminado(s) fora do intervalo D ± zσ — " +
            r.est.elim.map(function (e) { return e.nome + " = " + fmt(e.v, 2) + (e.acima ? " (acima)" : " (abaixo)"); }).join("; ") + ".");
          if (r.est.poucos) avisos.push("Após as eliminações restaram menos de 3 valores: estatística pouco representativa.");
        }
      }
      return { tab: { cal: [], pts: pts }, pontos: pts, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, e = r.est;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(r.n ? fmt(r.dMin, 2) + " – " + fmt(r.dMax, 2) + " <small>0,01 mm</small>" : "—", "Deflexão D1 (x = 0) — menor e maior de " + r.n + " ponto(s); média " + fmt(r.dMed, 2)) +
        cx(r.calOk === null ? "—" : r.calOk ? '<span class="fe-ok">5,00 × 10⁻³ pol</span>' : '<span class="fe-nok">geofone fora do ajuste</span>', "Calibração dos geofones na placa do calibrador (4.1)", true);
      if (e) h += cx(fmt(e.media, 2) + " ± " + fmt(e.sd, 2) + " <small>0,01 mm</small>", "Média e desvio-padrão de D1 — n = " + e.n + " de " + e.n0 + ", cv = " + fmt(e.cv * 100, 1) + " %", true) +
        cx(fmt(e.dc, 2) + " <small>0,01 mm</small>", "Deflexão característica Dc = D + σ (critério da PRO 011/79)");
      h += "</div>";
      var n = r.x.length;
      var cab = "<tr><th>Ponto</th><th>Estaca</th>" + r.x.map(function (xx, k) { return "<th>D" + sub(k + 1) + (ok(xx) ? " (" + fmt(xx, 2) + " m)" : "") + "</th>"; }).join("") + "</tr>";
      var lin = calc.pontos.map(function (o, i) {
        var c = "<tr><td>" + (i + 1) + (o.elim ? "*" : "") + "</td><td>" + esc(o.estaca) + (o.lado ? " " + esc(o.lado) : "") + "</td>";
        for (var k = 1; k <= n; k++) c += "<td>" + (k === 1 ? "<b>" + fmt(o["D" + k], 2) + "</b>" : fmt(o["D" + k], 2)) + "</td>";
        return c + "</tr>";
      }).join("");
      return h + '<table class="fe-resumo"><thead>' + cab + "</thead><tbody>" + lin + "</tbody></table>" + (e && e.elim.length ? '<div class="fe-res-r">* eliminado na estatística</div>' : "");
    },
    graficos: function (calc, d, opt) { return [deflectograma(calc, opt || {}), bacias(calc, opt || {})]; },
    relatorio: {
      notas: "D = L × 2,54, em centésimos de milímetro, com L = leitura do sensor em milésimos de polegada (5.1; o texto da norma diz \"milímetros de polegadas\"). Bacia: deflexão de cada geofone × afastamento em relação ao centro de gravidade da carga (5.2, Tabela 2). " +
        "Carga: peso estático de 7 120 N e força cíclica de 4 450 N (pico a pico) a 480 rpm (3.1, 3.3). A estatística do segmento, quando apresentada, não é da DNER-ME 039: segue a DNER-PRO 011/79, 4.2.7, aplicada a D1.",
      resultados: function (calc, d) {
        var r = calc.resultados, e = r.est, P = d.params || {}, rows = [];
        if (P.revest) rows.push(["Revestimento", P.revest]);
        rows.push(["Calibração dos geofones (4.1)", r.calOk === null ? "não registrada" : r.calOk ? "todos em 5,00 × 10⁻³ pol" : "GEOFONE(S) FORA DO AJUSTE"]);
        rows.push(["Deflexão D1 — menor / média / maior", r.n ? fmt(r.dMin, 2) + " / " + fmt(r.dMed, 2) + " / " + fmt(r.dMax, 2) + " × 0,01 mm (" + r.n + " pontos)" : "—"]);
        if (e) {
          rows.push(["Média / desvio-padrão de D1 (PRO 011/79)", fmt(e.media, 2) + " / " + fmt(e.sd, 2) + " × 0,01 mm — n = " + e.n + " de " + e.n0 + (e.elim.length ? " (" + e.elim.length + " eliminado(s))" : "")]);
          rows.push(["Coeficiente de variação", fmt(e.cv * 100, 1) + " %"]);
          rows.push(["Deflexão característica Dc = D + σ", fmt(e.dc, 2) + " × 0,01 mm"]);
        }
        return rows;
      },
      extraHtml: function (calc) {
        var r = calc.resultados, n = r.x.length;
        var h = '<table class="gr"><thead><tr><th>Ponto / estaca</th>' + r.x.map(function (xx, k) { return "<th>D" + (k + 1) + (ok(xx) ? " (" + fmt(xx, 2) + " m)" : "") + "</th>"; }).join("") + "</tr></thead><tbody>";
        calc.pontos.forEach(function (o, i) {
          h += "<tr><td>" + (i + 1) + " — " + esc(o.estaca) + (o.lado ? " " + esc(o.lado) : "") + (o.elim ? " *" : "") + "</td>";
          for (var k = 1; k <= n; k++) h += "<td>" + fmt(o["D" + k], 2) + "</td>";
          h += "</tr>";
        });
        return h + "</tbody></table>" + (r.est && r.est.elim.length ? '<p class="nota">* eliminado na estatística do segmento.</p>' : "");
      },
    },
    exemplos: [
      { nome: "Segmento de 10 pontos — concreto asfáltico, estatística de D1 (dados gerados)", dados: function () {
        // [estaca, lado, L1..L5 em milésimos de polegada]
        var L = [["200", "LD", "0,84 0,58 0,39 0,27 0,20"], ["201", "LE", "0,79 0,55 0,37 0,26 0,19"], ["202", "LD", "0,91 0,62 0,41 0,29 0,21"],
          ["203", "LE", "0,76 0,53 0,36 0,25 0,19"], ["204", "LD", "0,88 0,60 0,40 0,28 0,21"], ["205", "LE", "0,82 0,57 0,38 0,27 0,20"],
          ["206", "LD", "1,18 0,74 0,46 0,31 0,22"], ["207", "LE", "0,80 0,56 0,38 0,26 0,20"], ["208", "LD", "0,86 0,59 0,40 0,28 0,20"],
          ["209", "LE", "0,78 0,54 0,37 0,26 0,19"]];
        return { ident: { registro: "EX-DY-001", data: "2026-08-20", obra: "Obra A", trecho: "BR-000 — km 60 ao km 62, segmento homogêneo 2", camada: "Revestimento — concreto asfáltico 5 cm", laboratorista: "Equipe de campo" },
          params: { equipamento: "Dynaflect nº 0000", escala: "mils", sexto: "nao", revest: "Concreto asfáltico 5 cm sobre base granular", largura: "3,50", borda: "0,90", estat: "pro011" },
          cal: [{ g1: "5,00", g2: "5,00", g3: "5,00", g4: "5,00", g5: "5,00" }],
          pts: L.map(function (x, i) {
            var v = x[2].split(" "), p = { estaca: x[0], lado: x[1], hora: (8 + Math.floor(i / 4)) + ":" + String((i % 4) * 15).padStart(2, "0") };
            v.forEach(function (s, k) { p["L" + (k + 1)] = s; });
            return p;
          }) };
      } },
      { nome: "Tratamento superficial — mostrador com fator de escala, geofone fora do ajuste e bacia irregular (dados gerados)", dados: function () {
        // mostrador × fator: geofones 1 e 2 na escala 0,3; demais na escala 0,1
        var L = [["50", "LD", "4,10 2,60 5,50 3,80 2,70"], ["52", "LD", "4,55 2,85 5,90 4,05 2,85"], ["54", "LD", "3,90 2,45 4,90 5,20 2,60"], ["56", "LD", "4,30 2,70 5,65 3,90 2,75"]];
        var fs = ["0,3", "0,3", "0,1", "0,1", "0,1"];
        return { ident: { registro: "EX-DY-002", data: "2026-09-09", obra: "Obra B", trecho: "Rua A — pista direita", camada: "Revestimento — tratamento superficial duplo" },
          params: { equipamento: "Dynaflect nº 0000", escala: "fator", sexto: "nao", revest: "Tratamento superficial duplo", largura: "3,30", borda: "0,60", estat: "nao" },
          obs: "Geofone 3 com leitura de 4,90 na placa do calibrador após o ajuste — reajustar antes da próxima jornada.",
          cal: [{ g1: "5,00", g2: "5,00", g3: "4,90", g4: "5,00", g5: "5,00" }],
          pts: L.map(function (x) {
            var v = x[2].split(" "), p = { estaca: x[0], lado: x[1] };
            v.forEach(function (s, k) { p["L" + (k + 1)] = s; p["f" + (k + 1)] = fs[k]; });
            return p;
          }) };
      } },
    ],
  };

  // ---------- gráficos ----------
  function eixos(opt) { var imp = opt.imprimir; return { imp: imp, txt: imp ? "#222" : "var(--text-dim)", grade: imp ? "#ddd" : "var(--border)" }; }
  function passo(max) { var a = max / 6, p = Math.pow(10, Math.floor(Math.log10(a))), m = a / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }

  function deflectograma(calc, opt) {
    var pts = calc.pontos, val = pts.filter(function (o) { return ok(o.def); });
    if (!val.length) return '<div class="fe-graf-vazio">O deflectograma aparece com as leituras do geofone 1.</div>';
    var c = eixos(opt), e = calc.resultados.est, W = opt.w || 600, H = opt.h || 280, m = { l: 50, r: 16, t: 26, b: 48 };
    var maxV = Math.max.apply(null, val.map(function (o) { return o.def; }).concat(e ? [e.dc] : [])) * 1.1;
    var st = passo(maxV), yMax = Math.ceil(maxV / st) * st, n = pts.length;
    function X(i) { return m.l + (n === 1 ? 0.5 : (i + 0.5) / n) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / yMax * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    for (var v = 0; v <= yMax + 1e-9; v += st) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(v, st < 1 ? 1 : 0) + "</text>";
    }
    var cada = Math.max(1, Math.ceil(n / 16));
    pts.forEach(function (o, i) { if (!(i % cada)) s += '<text x="' + X(i) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + c.txt + '">' + esc(o.estaca) + "</text>"; });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 10) + '" text-anchor="middle" fill="' + c.txt + '">Estaca / km</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">D1 (0,01 mm)</text>';
    if (e) [[e.media, "média " + fmt(e.media, 2), "4 3", 13], [e.dc, "Dc " + fmt(e.dc, 2), "8 3", -4]].forEach(function (L) {
      s += '<line x1="' + m.l + '" y1="' + Y(L[0]) + '" x2="' + (W - m.r) + '" y2="' + Y(L[0]) + '" stroke="' + (c.imp ? "#555" : "var(--text)") + '" stroke-dasharray="' + L[2] + '" stroke-width="1.2"/>';
      s += '<text x="' + (W - m.r - 4) + '" y="' + (Y(L[0]) + L[3]) + '" text-anchor="end" fill="' + c.txt + '">' + L[1] + "</text>";
    });
    var lados = [];
    pts.forEach(function (o) { if (ok(o.def) && lados.indexOf(o.lado) === -1) lados.push(o.lado); });
    lados.forEach(function (ld, j) {
      var cor = CORES[j % CORES.length][c.imp ? 1 : 0];
      var serie = pts.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return ok(x.o.def) && x.o.lado === ld; });
      s += '<path d="' + serie.map(function (x, k) { return (k ? "L" : "M") + X(x.i).toFixed(1) + " " + Y(x.o.def).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.8"/>';
      serie.forEach(function (x) { s += '<circle cx="' + X(x.i).toFixed(1) + '" cy="' + Y(x.o.def).toFixed(1) + '" r="3.8" fill="' + (x.o.elim ? (c.imp ? "#fff" : "var(--panel)") : cor) + '" stroke="' + cor + '" stroke-width="1.5"/>'; });
      if (lados.length > 1 || ld) {
        s += '<rect x="' + (m.l + 6 + j * 95) + '" y="7" width="12" height="4" fill="' + cor + '"/>';
        s += '<text x="' + (m.l + 22 + j * 95) + '" y="12" fill="' + c.txt + '">' + esc(ld || "sem faixa") + "</text>";
      }
    });
    if (e && e.elim.length) s += '<text x="' + (W - m.r) + '" y="12" text-anchor="end" fill="' + c.txt + '">○ eliminado na estatística</text>';
    return s + "</svg>";
  }

  // bacia de deformação: deflexão × afastamento (5.2), eixo vertical para baixo
  function bacias(calc, opt) {
    var pts = calc.pontos.filter(function (o) { return o.bacia.length >= 2; });
    if (!pts.length) return '<div class="fe-graf-vazio">A bacia aparece com as leituras de dois ou mais geofones.</div>';
    var c = eixos(opt), W = opt.w || 600, H = opt.h || 280, m = { l: 50, r: 16, t: 14, b: 40 };
    var xs = calc.resultados.x.filter(ok), xMax = Math.max.apply(null, xs);
    var maxV = Math.max.apply(null, pts.map(function (o) { return Math.max.apply(null, o.bacia.map(function (b) { return b[1]; })); })) * 1.08;
    var st = passo(maxV), yMax = Math.ceil(maxV / st) * st;
    function X(x) { return m.l + x / xMax * (W - m.l - m.r - 90); }
    function Y(v) { return m.t + v / yMax * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    for (var v = 0; v <= yMax + 1e-9; v += st) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + X(xMax) + '" y2="' + Y(v) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + c.txt + '">' + fmt(v, st < 1 ? 1 : 0) + "</text>";
    }
    xs.forEach(function (x) {
      s += '<line x1="' + X(x) + '" y1="' + m.t + '" x2="' + X(x) + '" y2="' + (H - m.b) + '" stroke="' + c.grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(x) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + c.txt + '">' + fmt(x, 2) + "</text>";
    });
    s += '<text x="' + ((X(0) + X(xMax)) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + c.txt + '">Afastamento do geofone ao centro de gravidade da carga (m)</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + c.txt + '">D (0,01 mm)</text>';
    pts.forEach(function (o, j) {
      var cor = CORES[j % CORES.length][c.imp ? 1 : 0];
      s += '<path d="' + o.bacia.map(function (b, k) { return (k ? "L" : "M") + X(b[0]).toFixed(1) + " " + Y(b[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.6"/>';
      o.bacia.forEach(function (b) { s += '<circle cx="' + X(b[0]).toFixed(1) + '" cy="' + Y(b[1]).toFixed(1) + '" r="2.6" fill="' + cor + '"/>'; });
      if (j < 12) {
        s += '<rect x="' + (X(xMax) + 14) + '" y="' + (m.t + 4 + j * 15) + '" width="12" height="4" fill="' + cor + '"/>';
        s += '<text x="' + (X(xMax) + 30) + '" y="' + (m.t + 9 + j * 15) + '" fill="' + c.txt + '">' + esc(o.estaca) + "</text>";
      }
    });
    return s + "</svg>";
  }
})();
