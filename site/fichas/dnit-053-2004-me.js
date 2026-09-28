/*
 * Ficha: DNIT 053/2004-ME — Pavimento rígido — Retração do concreto por secagem.
 * Leituras do comparador (dial de 0,002 mm) nos prismas e na barra padrão de invar nas idades da seção 7;
 * retração = −[(Lx − Bx) − (L0 − B0)] / G × 100 (%), com G = comprimento de medida; média de ≥ 3 CPs e gráfico.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // idades de leitura (seção 7): dias contados da adição da água de amassamento
  var IDADES = [
    { c: "0", r: "Inicial — 72 h, na desforma (6.2)", curto: "72 h", dias: 3 },
    { c: "28u", r: "28 d — fim da cura em água com cal", curto: "28 d úmida", dias: 28 },
    { c: "a4", r: "Ao ar — 4 d", curto: "ar 4 d", dias: 32 },
    { c: "a7", r: "Ao ar — 7 d", curto: "ar 7 d", dias: 35 },
    { c: "a14", r: "Ao ar — 14 d", curto: "ar 14 d", dias: 42 },
    { c: "a28", r: "Ao ar — 28 d", curto: "ar 28 d", dias: 56 },
    { c: "s8", r: "Ao ar — 8 semanas", curto: "ar 8 sem", dias: 84 },
    { c: "s16", r: "Ao ar — 16 semanas", curto: "ar 16 sem", dias: 140 },
    { c: "s32", r: "Ao ar — 32 semanas", curto: "ar 32 sem", dias: 252 },
    { c: "s64", r: "Ao ar — 64 semanas", curto: "ar 64 sem", dias: 476 },
  ];
  var DIM = { "100": { txt: "100 × 100 × 350 mm", L: 350, dmax: [0, 32] }, "150": { txt: "150 × 150 × 500 mm", L: 500, dmax: [32, 50] } };

  function baseG(P) { var g = num(P.G); return ok(g) && g > 0 ? g : (DIM[P.dim] || DIM["100"]).L; }

  FE.FICHAS["dnit-053-2004-me"] = {
    titulo: "Concreto — Retração por secagem",
    resumo: "Prismas de 100 × 100 × 350 mm (Dmáx ≤ 32 mm) ou 150 × 150 × 500 mm (32 a 50 mm), ≥ 3 por condição; leitura inicial a 72 h, cura em água saturada de cal até 28 d e secagem ao ar a 23 ± 2 °C e UR 50 ± 4 %, com leituras aos 4, 7, 14 e 28 d e 8, 16, 32 e 64 semanas. Retração (%) = variação de comprimento / comprimento de medida × 100.",
    blocos: [],
    params: [
      { k: "concreto", r: "Concreto / condição de ensaio", ph: "ex.: traço 1 : 2,1 : 2,9, a/c 0,45" },
      { k: "dim", r: "Corpos de prova (5)", tipo: "select", opcoes: [["100", "100 × 100 × 350 mm — Dmáx até 32 mm"], ["150", "150 × 150 × 500 mm — Dmáx de 32 a 50 mm"]] },
      { k: "dmax", r: "Dimensão máxima característica do agregado (mm)", ph: "25" },
      { k: "G", r: "Comprimento de medida G (mm) — entre as extremidades dos pinos", ph: "350 / 500",
        dica: "a norma não dá fórmula; vazio = comprimento nominal do prisma (350 ou 500 mm), igual ao da barra padrão (4.3)" },
      { k: "desf", r: "Tempo da adição da água à desforma / leitura inicial (h)", ph: "72", dica: "72 ± 0,5 h (6.2)" },
      { k: "imersao", r: "Imersão em água saturada de cal antes da leitura inicial (min)", ph: "30", dica: "mínimo de 30 min (6.2)" },
      { k: "temp", r: "Temperatura da sala de secagem (°C)", ph: "23", dica: "23 ± 2 °C (6.2)" },
      { k: "ur", r: "Umidade relativa da sala de secagem (%)", ph: "50", dica: "50 ± 4 % (6.2)" },
      { k: "adens", r: "Tipo de adensamento (8)", ph: "ex.: mesa vibratória" },
      { k: "fresco", r: "Concreto fresco — abatimento, ar, temperatura, massa específica (8)", ph: "ex.: 60 mm; 2,1 %; 26 °C; 2 390 kg/m³" },
    ],
    padrao: { dim: "100" },
    tabelas: function (d) {
      if (Array.isArray(d.barra)) { while (d.barra.length < 1) d.barra.push({}); d.barra.length = 1; }
      var lin = [{ k: "id", r: "Identificação do CP", texto: true }];
      IDADES.forEach(function (a) { lin.push({ grupo: a.r + " — idade " + a.dias + " d" }, { k: "l" + a.c, r: "Leitura do comparador", u: "mm" }, { calc: "r" + a.c, r: "Retração", u: "%", casas: 4, destaque: a.c === "s64" }); });
      var bar = [];
      IDADES.forEach(function (a) { bar.push({ k: "l" + a.c, r: a.r, u: "mm" }); });
      return [
        { chave: "barra", titulo: "Barra padrão de aço invar (4.3) — leitura de calibração em cada idade", rotulo: "Barra", iniciais: 1, min: 1, fixo: true, nomes: ["Barra padrão"], linhas: bar,
          dica: "a diferença CP − barra elimina a deriva do dial; vazio = sem correção" },
        { chave: "cp", titulo: "Leituras dos corpos de prova (6.3 e 7)", rotulo: "CP", iniciais: 3, min: 1, linhas: lin,
          dica: "dial com precisão de 0,002 mm; retração positiva = encurtamento em relação à leitura inicial (72 h)" },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], G = baseG(P), bar = (d.barra || [])[0] || {};
      var dm = DIM[P.dim] || DIM["100"];
      var B = {};
      IDADES.forEach(function (a) { var b = num(bar["l" + a.c]); B[a.c] = ok(b) ? b : 0; });
      var semBarra = IDADES.every(function (a) { return !ok(num(bar["l" + a.c])); });
      var cps = (d.cp || []).map(function (x, i) {
        var o = { nome: String(x.id || i + 1) }, L0 = num(x.l0);
        IDADES.forEach(function (a) {
          var L = num(x["l" + a.c]);
          if (ok(L) && ok(L0) && a.c !== "0") o["r" + a.c] = -((L - B[a.c]) - (L0 - B["0"])) / G * 100;
          if (a.c === "0" && ok(L0)) o.r0 = 0;
        });
        return o;
      });
      // médias por idade
      var serie = IDADES.map(function (a) {
        var vals = cps.map(function (o) { return o["r" + a.c]; }).filter(ok);
        return { c: a.c, r: a.r, curto: a.curto, dias: a.dias, med: vals.length ? media(vals) : NaN, n: vals.length,
          amp: vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN };
      });
      var nCP = cps.filter(function (o) { return ok(o.r0); }).length;
      if (nCP && nCP < 3) avisos.push("Só " + nCP + " corpo(s) de prova — moldar no mínimo três para cada condição de ensaio (6.1).");
      var dmax = num(P.dmax);
      if (ok(dmax)) {
        if (dmax > 50) avisos.push("Dmáx de " + fmt(dmax, 1) + " mm acima de 50 mm — fora do campo dos prismas da seção 5.");
        else if (P.dim === "100" && dmax > 32) avisos.push("Dmáx de " + fmt(dmax, 1) + " mm: use prismas de 150 × 150 × 500 mm (5 b).");
        else if (P.dim === "150" && dmax <= 32) avisos.push("Dmáx de " + fmt(dmax, 1) + " mm: a norma prescreve prismas de 100 × 100 × 350 mm para agregado até 32 mm (5 a).");
      }
      var desf = num(P.desf);
      if (ok(desf) && Math.abs(desf - 72) > 0.5) avisos.push("Desforma e leitura inicial com " + fmt(desf, 1) + " h — deve ser (72 ± 0,5) h após a adição da água (6.2).");
      var im = num(P.imersao);
      if (ok(im) && im < 30) avisos.push("Imersão de " + fmt(im, 0) + " min antes da leitura inicial — mínimo de 30 min em água saturada de cal (6.2).");
      var t = num(P.temp), ur = num(P.ur);
      if (ok(t) && Math.abs(t - 23) > 2) avisos.push("Sala de secagem a " + fmt(t, 1) + " °C — deve estar a (23 ± 2) °C (6.2).");
      if (ok(ur) && Math.abs(ur - 50) > 4) avisos.push("Umidade relativa de " + fmt(ur, 0) + " % — deve ser (50 ± 4) % (6.2).");
      if (ok(num(P.G)) && Math.abs(num(P.G) - dm.L) > 60) avisos.push("Comprimento de medida de " + fmt(num(P.G), 0) + " mm muito diferente do comprimento do prisma (" + dm.L + " mm) — confira.");
      if (semBarra && nCP) avisos.push("Sem leituras da barra padrão — as retrações não estão corrigidas pela calibração do dial (4.3).");
      else IDADES.forEach(function (a) {
        var temCP = cps.some(function (o) { return ok(o["r" + a.c]); });
        if (temCP && !ok(num(bar["l" + a.c]))) avisos.push("Idade " + a.curto + ": falta a leitura da barra padrão — usada sem correção.");
      });
      cps.forEach(function (o, i) {
        var x = d.cp[i];
        if (!ok(num(x.l0)) && IDADES.some(function (a) { return ok(num(x["l" + a.c])); })) avisos.push("CP " + o.nome + ": sem a leitura inicial (72 h) — a retração não pode ser calculada.");
      });
      var ult = serie.filter(function (s) { return s.c !== "0" && ok(s.med); }).pop();
      if (ult && ult.c !== "s64") avisos.push("Última leitura em " + ult.curto + " — o ensaio vai até 64 semanas ao ar (6.3 e 7).");
      return { tab: { cp: cps, barra: [{}] }, resultados: { serie: serie, ult: ult, G: G, cps: cps }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, s = r.serie.filter(function (x) { return x.c !== "0" && ok(x.med); });
      if (!s.length) return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">—</div><div class="fe-res-r">Retração por secagem</div></div></div>';
      var tab = '<table class="fe-resumo"><thead><tr><th>Idade</th><th>Dias</th><th>Retração média (%)</th><th>µm/m</th><th>CPs</th><th>Amplitude (%)</th></tr></thead><tbody>' +
        s.map(function (x) { return "<tr><td>" + esc(x.r) + "</td><td>" + x.dias + "</td><td><b>" + fmt(x.med, 4) + "</b></td><td>" + fmt(x.med * 1e4, 0) + "</td><td>" + x.n + "</td><td>" + fmt(x.amp, 4) + "</td></tr>"; }).join("") + "</tbody></table>";
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.ult.med, 3) + ' <small>%</small></div><div class="fe-res-r">Retração média — ' + esc(r.ult.curto) + " (" + fmt(r.ult.med * 1e4, 0) + " µm/m)</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.G, 0) + ' mm</div><div class="fe-res-r">Comprimento de medida G</div></div></div>' + tab;
    },
    graficos: function (calc, d, opt) { return [grafico(calc, opt || {})]; },
    relatorio: {
      notas: "Prismas (5) moldados pela NBR 5738 (≥ 3 por condição — 6.1); desforma e leitura inicial a (72 ± 0,5) h após a adição da água, depois de ≥ 30 min em água saturada de cal; cura em água saturada de cal até 28 d; secagem ao ar a (23 ± 2) °C e UR (50 ± 4) % (6.2); leituras aos 4, 7, 14 e 28 d e 8, 16, 32 e 64 semanas ao ar (7). A norma não traz fórmula de cálculo: a ficha adota retração (%) = −[(Lx − Bx) − (L0 − B0)] / G × 100, com L = leitura do CP, B = leitura da barra padrão de invar na mesma data (4.3) e G = comprimento de medida (vazio = comprimento nominal do prisma), referida à leitura inicial de 72 h (critério da ASTM C157 / NBR 8490). Valor positivo = encurtamento; negativo = expansão (típica na cura úmida). Dial com precisão de 0,002 mm (4.4).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.concreto) rows.push(["Concreto", P.concreto]);
        rows.push(["Corpos de prova", (DIM[P.dim] || DIM["100"]).txt + " — comprimento de medida " + fmt(r.G, 0) + " mm"]);
        r.serie.forEach(function (x) { if (x.c !== "0" && ok(x.med)) rows.push(["Retração média — " + x.r, fmt(x.med, 4) + " % (" + fmt(x.med * 1e4, 0) + " µm/m; " + x.n + " CPs)"]); });
        return rows;
      },
    },
    exemplos: [
      { nome: "Concreto de pavimento — 3 prismas 100 × 100 × 350 mm, 64 semanas", dados: function () {
        return gerar({ registro: "EX-RT-001", obra: "Obra A", trecho: "BR-000", camada: "Concreto de pavimento — dosagem", data: "2025-03-10" },
          { concreto: "Traço 1 : 2,1 : 2,9 (cimento : areia : brita), a/c 0,45", dim: "100", dmax: "25", G: "", desf: "72", imersao: "40", temp: "23", ur: "50", adens: "mesa vibratória", fresco: "abatimento 60 mm; ar 2,1 %; 26 °C; 2 390 kg/m³" },
          350, 3, [-0.006, 0.011, 0.019, 0.029, 0.041, 0.051, 0.058, 0.063, 0.066], null, ["2,346", "1,982", "2,510"], [0, 0.004, -0.002]);
      } },
      { nome: "Dois prismas 150 × 150 × 500 mm com Dmáx 25 mm, sala a UR 42 %, desforma com 75 h (em andamento)", dados: function () {
        return gerar({ registro: "EX-RT-002", obra: "Obra C", camada: "Concreto de pavimento — traço alternativo", data: "2025-09-01" },
          { concreto: "Traço com consumo elevado de cimento, a/c 0,52", dim: "150", dmax: "25", G: "", desf: "75", imersao: "20", temp: "24", ur: "42" },
          500, 2, [-0.004, 0.019, 0.032, 0.047, 0.065, 0.079], 6, ["3,104", "2,776"], [0, 0.006]);
      } },
    ],
  };

  // leituras de exemplo: G (mm), n CPs, retrações-alvo (% a partir de 28u), número de idades lidas, L0 de cada CP, desvio relativo por CP
  function gerar(ident, params, G, n, alvo, nIdades, L0s, desv) {
    var idades = IDADES.slice(0, (nIdades || IDADES.length - 1) + 1);
    var barra = {}, deriva = [0, 0.002, -0.002, 0.000, 0.004, 0.002, -0.002, 0.000, 0.002, 0.004];
    idades.forEach(function (a, k) { barra["l" + a.c] = fmt(1.500 + deriva[k], 3); });
    var cps = [];
    for (var i = 0; i < n; i++) {
      var p = { id: String(i + 1) }, L0 = num(L0s[i]);
      idades.forEach(function (a, k) {
        var ret = k ? alvo[k - 1] * (1 + desv[i]) : 0;
        var L = L0 + deriva[k] - ret / 100 * G;
        p["l" + a.c] = fmt(Math.round(L / 0.002) * 0.002, 3);  // dial de 0,002 mm
      });
      cps.push(p);
    }
    return { ident: ident, params: params, barra: [barra], cp: cps };
  }

  function grafico(calc, opt) {
    var r = calc.resultados, s = r.serie.filter(function (x) { return ok(x.med); });
    if (s.length < 2) return '<div class="fe-graf-vazio">O gráfico aparece com as leituras inicial e seguintes.</div>';
    var W = opt.w || 560, H = opt.h || 300, m = { l: 58, r: 16, t: 16, b: 42 };
    var x0 = Math.log10(2), x1 = Math.log10(600);
    var todos = [];
    r.cps.forEach(function (o) { IDADES.forEach(function (a) { if (ok(o["r" + a.c])) todos.push(o["r" + a.c]); }); });
    var yMax = Math.max.apply(null, todos.concat([0.01])), yMin = Math.min.apply(null, todos.concat([0]));
    var passo = yMax - yMin > 0.06 ? 0.02 : 0.01, y1 = Math.ceil(yMax / passo) * passo, y0 = Math.floor(yMin / passo) * passo;
    function X(dd) { return m.l + (Math.log10(dd) - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff", corCP = imp ? "#999" : "var(--text-dim)";
    var g = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    [3, 7, 14, 28, 56, 112, 224, 476].forEach(function (dd) {
      g += '<line x1="' + X(dd) + '" y1="' + m.t + '" x2="' + X(dd) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      g += '<text x="' + X(dd) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + dd + "</text>";
    });
    for (var v = y0; v <= y1 + 1e-9; v += passo) {
      g += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="' + (Math.abs(v) < 1e-9 ? 1.2 : 0.6) + '"/>';
      g += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(v, 2) + "</text>";
    }
    // início da secagem ao ar (28 d)
    g += '<line x1="' + X(28) + '" y1="' + m.t + '" x2="' + X(28) + '" y2="' + (H - m.b) + '" stroke="' + txt + '" stroke-dasharray="4 3" stroke-width="0.8"/>';
    g += '<text x="' + (X(28) + 4) + '" y="' + (m.t + 12) + '" fill="' + txt + '">início da secagem ao ar</text>';
    g += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
    g += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Idade desde a moldagem (dias, escala logarítmica)</text>';
    g += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Retração (%)</text>';
    r.cps.forEach(function (o) {
      IDADES.forEach(function (a) { if (ok(o["r" + a.c])) g += '<circle cx="' + X(a.dias).toFixed(1) + '" cy="' + Y(o["r" + a.c]).toFixed(1) + '" r="2.2" fill="none" stroke="' + corCP + '"/>'; });
    });
    g += '<path d="' + s.map(function (p, i) { return (i ? "L" : "M") + X(p.dias).toFixed(1) + " " + Y(p.med).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="2"/>';
    s.forEach(function (p) { g += '<circle cx="' + X(p.dias).toFixed(1) + '" cy="' + Y(p.med).toFixed(1) + '" r="3.2" fill="' + cor + '"/>'; });
    if (r.ult) g += '<text x="' + (W - m.r - 6) + '" y="' + (H - m.b - 8) + '" text-anchor="end" fill="' + cor + '" font-weight="bold">média ' + esc(r.ult.curto) + " = " + fmt(r.ult.med, 3) + " %</text>";
    return g + "</svg>";
  }
})();
