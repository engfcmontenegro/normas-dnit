/*
 * Ficha: DNER-PRO 010/79 — Avaliação estrutural dos pavimentos flexíveis — Procedimento "A".
 * Registra-se no motor de site/fichas.js (window.FE).
 * Este arquivo também define FE.defl (estatística das deflexões por segmento homogêneo, importação das estações
 * das fichas DNIT 133-ME, DNER-ME 039 e DNER-PRO 273, deflectograma), usado pelas fichas das DNER-PRO 011, 159,
 * 269 e 273 (carregadas depois desta no index.html).
 * Cálculos da PRO 010: análise estatística 4.2.8 (d̄, σ, eliminação por d̄ ± zσ, dc = d̄ + σ), deflexão de projeto
 * dp = dc × Fs (4.2.9), d0 = 0,7 dp, Nt = Ns + Np, índices de tráfego IT (cap. 5), quadro de diretrizes de projeto,
 * vida restante (Nmáx), índice de fissuração IF, fr, hef, Δh, (hCB)mín (6.1.3), condições de fissuração (a)–(d),
 * reforço em camadas de materiais distintos (6.2). Nomogramas 3 e 5 digitalizados; valores dos nomogramas 1, 2 e 4
 * (famílias de curvas) são informados como lidos no gráfico.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // =====================================================================================
  // FE.defl — deflexões por estação e estatística do segmento homogêneo (PRO 010 4.2.8 = PRO 011 4.2.7)
  // =====================================================================================
  var DF = FE.defl = FE.defl || {};
  // Tabela I (HRB Report 17): z em função de n
  DF.zDe = function (n) { return n >= 20 ? 3 : n >= 7 ? 2.5 : n >= 5 ? 2 : n === 4 ? 1.5 : 1; };
  DF.desvio = function (v) {
    var m = media(v);
    return v.length > 1 ? Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN;
  };
  // itens [{v, i, nome}] -> {n0, n, media, sd, z, cv, dc, elim, iter, poucos}; eliminação iterativa fora de D ± zσ
  DF.estatistica = function (itens) {
    var rest = itens.slice(), elim = [], passos = 0;
    if (rest.length < 3) return null;
    while (rest.length >= 3 && passos < 60) {
      passos++;
      var vs = rest.map(function (x) { return x.v; }), m = media(vs), s = DF.desvio(vs), z = DF.zDe(rest.length);
      var fora = rest.filter(function (x) { return Math.abs(x.v - m) > z * s + 1e-9; });
      if (!fora.length || !(s > 0)) return { n0: itens.length, n: rest.length, media: m, sd: s, z: z, cv: s / m, dc: m + s, elim: elim, iter: passos };
      fora.forEach(function (x) { x.acima = x.v > m; elim.push(x); });
      rest = rest.filter(function (x) { return fora.indexOf(x) === -1; });
    }
    var v2 = rest.map(function (x) { return x.v; }), m2 = media(v2), s2 = DF.desvio(v2);
    return { n0: itens.length, n: rest.length, media: m2, sd: s2, z: NaN, cv: s2 / m2, dc: m2 + s2, elim: elim, iter: passos, poucos: true };
  };
  // valor característico X̄ + sinal × σ (PRO 159 9.1.1 e PRO 269 9.1.1), com eliminação opcional fora de X̄ ± 3σ
  // (PRO 159 cap. 8, PRO 269 8.5) e média simples quando n ≤ nMedia (PRO 159: "igual ou inferior a 3")
  DF.caracteristico = function (vals, sinal, elim3, nMedia) {
    var v = vals.filter(ok), fora = [];
    if (!v.length) return null;
    if (elim3 && v.length > 2) {
      var m0 = media(v), s0 = DF.desvio(v);
      fora = v.filter(function (x) { return s0 > 0 && Math.abs(x - m0) > 3 * s0; });
      v = v.filter(function (x) { return fora.indexOf(x) === -1; });
    }
    var m = media(v), s = DF.desvio(v), simples = v.length <= (nMedia || 1);
    return { n0: vals.filter(ok).length, n: v.length, media: m, sd: s, car: simples || !ok(s) ? m : m + (sinal || 1) * s, simples: simples, fora: fora };
  };
  // estaca "120+10" ou "120" (estacas de 20 m) ou "km 12,340" -> metros
  DF.metros = function (s) {
    s = String(s || "").trim();
    var m = /^(\d+)\s*\+\s*([\d.,]+)$/.exec(s);
    if (m) return Number(m[1]) * 20 + num(m[2]);
    m = /^km\s*([\d.,]+)$/i.exec(s);
    if (m) return num(m[1]) * 1000;
    return /^\d+([.,]\d+)?$/.test(s) ? num(s) * 20 : NaN;
  };
  // linhas da tabela de estações
  DF.linhas = function (opt) {
    opt = opt || {};
    var l = [
      { k: "estaca", r: "Estaca (20 m) ou km", texto: true, ph: "120+10" },
      { k: "lado", r: "Faixa / trilha (LD, LE · TRE, TRI)", texto: true, ph: "LD TRE" },
      { k: "eq", r: "Equipamento (VB, Dynaflect, FWD)", texto: true, ph: "VB" },
      { k: "D", r: "Deflexão recuperável D (viga Benkelman)", u: "0,01 mm" },
    ];
    if (opt.raio !== false) l.push({ k: "R", r: "Raio de curvatura R", u: "m" });
    (opt.extra || []).forEach(function (x) { l.push(x); });
    l.push({ k: "origem", r: "Origem (ensaio importado)", texto: true });
    l.push({ calc: "Dv", r: "D considerada (após correlação, se houver)", u: "0,01 mm", casas: 1, destaque: true });
    l.push({ calc: "sit", r: "Situação na estatística (1 = aceita, 0 = eliminada)", u: "", casas: 0 });
    return l;
  };
  // parâmetros comuns (importação, correlação, universo)
  DF.params = function (normaTxt) {
    return [
      { k: "imp", r: "Importar estações de ensaios salvos (viga Benkelman, Dynaflect, FWD)", tipo: "importarVarios",
        de: ["dnit-133-2025-me", "dner-me-039-94", "dner-pro-273-96"],
        dica: "substitui a tabela de estações; viga: D′₀ corrigida e R; Dynaflect: D1; FWD: D1 normalizada (0,01 mm)",
        aplicar: function (lista, P, d) { DF.importar(lista, d); } },
      { k: "correl", r: "Deflexões de outros equipamentos (Nota de " + normaTxt + ")", tipo: "select", recarrega: true,
        opcoes: [["nao", "Usar como informadas"], ["sim", "Converter para viga Benkelman: D = a + b × Dequip"]],
        dica: "a norma admite outros equipamentos desde que estabelecida a correlação com a viga Benkelman" },
      { k: "ca", r: "Correlação — a (0,01 mm)", ph: "0", se: function (d) { return (d.params || {}).correl === "sim"; } },
      { k: "cb", r: "Correlação — b", ph: "1,00", se: function (d) { return (d.params || {}).correl === "sim"; } },
      { k: "universo", r: "Universo estatístico", tipo: "select",
        opcoes: [["unico", "Único — trilhas externas de ambas as faixas"], ["faixa", "Em separado por faixa de tráfego (excepcional)"]],
        dica: "em princípio, as deflexões das duas faixas formam um único universo; em separado, segmento mínimo de 400 m" },
      { k: "extensao", r: "Extensão do segmento homogêneo (m) — se vazio, pelas estacas" },
    ];
  };
  // importação: lista [{ficha, dados, resultados}] -> d.pts
  DF.importar = function (lista, d) {
    var rows = [];
    lista.forEach(function (e) {
      var F = FE.FICHAS[e.ficha];
      if (!F) return;
      var c;
      try { c = F.calcular(e.dados); } catch (err) { return; }
      var reg = ((e.dados || {}).ident || {}).registro || "sem registro";
      var eq = e.ficha === "dner-me-039-94" ? "Dynaflect" : e.ficha === "dner-pro-273-96" ? "FWD" : "VB";
      var cod = e.ficha === "dner-me-039-94" ? "DNER-ME 039" : e.ficha === "dner-pro-273-96" ? "DNER-PRO 273" : "DNIT 133-ME";
      (c.pontos || []).forEach(function (p) {
        if (!ok(p.def)) return;
        rows.push({ estaca: p.estaca || "", lado: p.lado || "", eq: eq, D: fmt(p.def, 1), R: ok(p.R) ? fmt(p.R, 0) : "", origem: reg + " (" + cod + ")" });
      });
    });
    if (rows.length) d.pts = rows;
  };
  // processa a tabela: correlação, grupos (universo), estatística, raios, extensão
  DF.processar = function (d, avisos, opts) {
    opts = opts || {};
    var P = d.params || {}, conv = P.correl === "sim", a = num(P.ca), b = num(P.cb);
    if (conv && (!ok(b) || b <= 0)) avisos.push("Informe o coeficiente b da correlação com a viga Benkelman (e a, se houver).");
    var pts = (d.pts || []).map(function (p, i) {
      var D = num(p.D), eq = String(p.eq || "").trim().toUpperCase(), outro = eq && eq !== "VB" && eq.indexOf("BENK") < 0 && eq.indexOf("VIGA") < 0;
      var o = { D: D, R: num(p.R), estaca: p.estaca || String(i + 1), lado: (p.lado || "").trim(), outro: outro,
        nome: "Estação " + (i + 1) + (p.estaca ? " (est. " + p.estaca + (p.lado ? ", " + p.lado : "") + ")" : ""), m: DF.metros(p.estaca) };
      o.Dv = outro && conv && ok(b) ? (ok(a) ? a : 0) + b * D : D;
      o.def = o.Dv;
      return o;
    });
    var outros = pts.filter(function (o) { return o.outro && ok(o.D); });
    if (outros.length && !conv) avisos.push(outros.length + " deflexão(ões) de outro equipamento (Dynaflect/FWD) usadas sem correlação com a viga Benkelman — a norma exige a correlação (Nota de 4.2.2).");
    var grupos = [];
    if (P.universo === "faixa") {
      pts.forEach(function (o) {
        var k = (o.lado.split(/\s+/)[0] || "sem faixa").toUpperCase(), g = grupos.filter(function (x) { return x.k === k; })[0];
        if (!g) grupos.push(g = { k: k, pts: [] });
        g.pts.push(o);
      });
    } else grupos.push({ k: "", pts: pts });
    if (!opts.semEstat) grupos.forEach(function (g) {
      var itens = g.pts.filter(function (o) { return ok(o.Dv); }).map(function (o) { return { v: o.Dv, i: pts.indexOf(o), nome: o.nome }; });
      g.est = DF.estatistica(itens);
      var rot = g.k ? " (faixa " + g.k + ")" : "";
      if (!g.est) { if (itens.length) avisos.push("Estatística" + rot + ": são necessários pelo menos 3 valores de deflexão (Tabela I)."); return; }
      g.pts.forEach(function (o) { if (ok(o.Dv)) o.sit = 1; });
      g.est.elim.forEach(function (x) { pts[x.i].sit = 0; pts[x.i].elim = true; });
      if (g.est.elim.length) avisos.push("Estatística" + rot + ": eliminado(s) fora de D ± zσ — " +
        g.est.elim.map(function (x) { return x.nome + " = " + fmt(x.v, 1) + (x.acima ? " (acima: tratamento especial)" : " (abaixo)"); }).join("; ") + ".");
      if (g.est.poucos) avisos.push("Estatística" + rot + ": após as eliminações restaram menos de 3 valores.");
    });
    // raios de curvatura (4.2.2: espaçamento de 200 m; valores < 100 m pedem determinações adicionais)
    var raios = pts.filter(function (o) { return ok(o.R); });
    var baixos = raios.filter(function (o) { return o.R < 100; });
    if (baixos.length) avisos.push("Raio de curvatura < 100 m em " + baixos.map(function (o) { return o.nome + " (" + fmt(o.R, 0) + " m)"; }).join("; ") + ": fazer determinações adicionais (4.2.2).");
    // extensão
    var ext = num(P.extensao), ms = pts.map(function (o) { return o.m; }).filter(ok);
    if (!ok(ext) && ms.length >= 2) ext = Math.max.apply(null, ms) - Math.min.apply(null, ms);
    return { pts: pts, grupos: grupos, ext: ext, rMed: media(raios.map(function (o) { return o.R; })),
      rMin: raios.length ? Math.min.apply(null, raios.map(function (o) { return o.R; })) : NaN, nR: raios.length, nBaixos: baixos.length };
  };
  DF.verificarExtensao = function (ext, porFaixa, maxExt, avisos, secao) {
    if (!ok(ext)) return;
    if (ext > maxExt) avisos.push("Segmento homogêneo de " + fmt(ext, 0) + " m: não deve exceder " + fmt(maxExt, 0) + " m (" + secao + ").");
    var min = porFaixa ? 400 : 200;
    if (ext < min) avisos.push("Segmento homogêneo de " + fmt(ext, 0) + " m: extensão mínima desejável da ordem de " + min + " m" + (porFaixa ? " quando as faixas são tratadas em separado" : "") + " (" + secao + ").");
  };
  // Tabela II — fator de correção sazonal
  DF.FS = { arenoso: { seca: [1.10, 1.30], chuvosa: [1.00, 1.00] }, argiloso: { seca: [1.20, 1.40], chuvosa: [1.00, 1.00] } };
  DF.paramsFs = function (sec) {
    return [
      { k: "subleito", r: "Natureza do subleito (Tabela II)", tipo: "select", opcoes: [["arenoso", "Arenoso e permeável"], ["argiloso", "Argiloso e sensível à umidade"]] },
      { k: "estacao", r: "Época do levantamento (Tabela II)", tipo: "select", opcoes: [["seca", "Estação seca"], ["chuvosa", "Estação chuvosa"]] },
      { k: "fs", r: "Fator de correção sazonal Fs (" + sec + ")", ph: "ex.: 1,20", dica: "seca: 1,10–1,30 (arenoso) ou 1,20–1,40 (argiloso); chuvosa: 1,00" },
    ];
  };
  DF.fs = function (P, avisos, sec) {
    var fs = num(P.fs), fx = (DF.FS[P.subleito || "arenoso"] || {})[P.estacao || "seca"];
    if (!ok(fs)) { avisos.push("Informe o fator de correção sazonal Fs (Tabela II) — adotado 1,00."); return 1; }
    if (fx && (fs < fx[0] - 1e-9 || fs > fx[1] + 1e-9)) avisos.push("Fs = " + fmt(fs, 2) + " fora do intervalo sugerido na Tabela II (" + fmt(fx[0], 2) + (fx[0] !== fx[1] ? " – " + fmt(fx[1], 2) : "") + ") para o subleito e a época escolhidos (" + sec + ").");
    return fs;
  };
  // deflectograma: deflexões por estação, média e valor característico de cada grupo
  var CORES = [["#4f8cff", "#1f5fbf"], ["#e5534b", "#c0392b"], ["#34c38f", "#2e8b57"], ["#b37feb", "#7d3c98"]];
  function passo(max) {
    var alvo = max / 6, p = Math.pow(10, Math.floor(Math.log10(alvo))), m = alvo / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  }
  DF.deflectograma = function (proc, opt, rotuloDc) {
    opt = opt || {};
    var pts = proc.pts, val = pts.filter(function (o) { return ok(o.Dv); });
    if (!val.length) return '<div class="fe-graf-vazio">O deflectograma aparece com as deflexões das estações.</div>';
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var W = opt.w || 600, H = opt.h || 300, m = { l: 50, r: 16, t: 26, b: 48 };
    var extras = [];
    proc.grupos.forEach(function (g) { if (g.est) extras.push(g.est.dc, g.est.media); });
    var maxV = Math.max.apply(null, val.map(function (o) { return o.Dv; }).concat(extras)) * 1.1;
    var st = passo(maxV), yMax = Math.ceil(maxV / st) * st, n = pts.length;
    function X(i) { return m.l + (n === 1 ? 0.5 : (i + 0.5) / n) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / yMax * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    for (var v = 0; v <= yMax + 1e-9; v += st) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(v, 0) + "</text>";
    }
    var cada = Math.max(1, Math.ceil(n / 16));
    pts.forEach(function (o, i) { if (!(i % cada)) s += '<text x="' + X(i) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + esc(o.estaca) + "</text>"; });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 10) + '" text-anchor="middle" fill="' + txt + '">Estaca / km</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">D (0,01 mm)</text>';
    proc.grupos.forEach(function (g, j) {
      if (!g.est) return;
      [[g.est.media, "média" + (g.k ? " " + g.k : "") + " " + fmt(g.est.media, 1), "4 3", 13], [g.est.dc, (rotuloDc || "Dc") + (g.k ? " " + g.k : "") + " " + fmt(g.est.dc, 1), "8 3", -4]].forEach(function (L) {
        s += '<line x1="' + m.l + '" y1="' + Y(L[0]) + '" x2="' + (W - m.r) + '" y2="' + Y(L[0]) + '" stroke="' + (imp ? "#555" : "var(--text)") + '" stroke-dasharray="' + L[2] + '" stroke-width="1.1"/>';
        s += '<text x="' + (W - m.r - 4 - j * 150) + '" y="' + (Y(L[0]) + L[3]) + '" text-anchor="end" fill="' + txt + '">' + esc(L[1]) + "</text>";
      });
    });
    var lados = [];
    pts.forEach(function (o) { if (ok(o.Dv) && lados.indexOf(o.lado) === -1) lados.push(o.lado); });
    lados.forEach(function (ld, j) {
      var cor = CORES[j % CORES.length][imp ? 1 : 0];
      var serie = pts.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return ok(x.o.Dv) && x.o.lado === ld; });
      s += '<path d="' + serie.map(function (x, k) { return (k ? "L" : "M") + X(x.i).toFixed(1) + " " + Y(x.o.Dv).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.7"/>';
      serie.forEach(function (x) {
        s += '<circle cx="' + X(x.i).toFixed(1) + '" cy="' + Y(x.o.Dv).toFixed(1) + '" r="3.6" fill="' + (x.o.elim ? (imp ? "#fff" : "var(--panel)") : cor) + '" stroke="' + cor + '" stroke-width="1.5"/>';
      });
      if (lados.length > 1 || ld) {
        s += '<rect x="' + (m.l + 6 + j * 95) + '" y="7" width="12" height="4" fill="' + cor + '"/>';
        s += '<text x="' + (m.l + 22 + j * 95) + '" y="12" fill="' + txt + '">' + esc(ld || "sem faixa") + "</text>";
      }
    });
    if (pts.some(function (o) { return o.elim; })) s += '<text x="' + (W - m.r) + '" y="12" text-anchor="end" fill="' + txt + '">○ eliminado na estatística</text>';
    return s + "</svg>";
  };
  DF.item = function (v, rot, p) {
    return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>";
  };
  DF.log = function (x) { return Math.log10(x); };
  DF.fmtN = function (x) {
    if (!ok(x)) return "—";
    var e = Math.floor(Math.log10(Math.abs(x)));
    return fmt(x / Math.pow(10, e), 2) + " × 10" + String(e).replace(/-/g, "⁻").replace(/\d/g, function (c) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[c]; });
  };
  // exemplo compartilhado: segmento de 20 estações a cada 20 m, alternando as faixas (dados gerados)
  DF.exemploEstacoes = function (base, amp, rBase, semente) {
    var s = semente || 7, out = [];
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    for (var i = 0; i < 20; i++) {
      var D = base + (rnd() - 0.5) * 2 * amp, R = rBase + (rnd() - 0.5) * rBase * 0.6;
      out.push({ estaca: String(100 + i), lado: i % 2 ? "LE TRE" : "LD TRE", eq: "VB", D: fmt(D, 0), R: i % 10 === 0 ? fmt(R, 0) : "" });
    }
    return out;
  };

  // =====================================================================================
  // DNER-PRO 010/79
  // =====================================================================================
  // IT = f(N): log IT = 0,127 log N + 0,166 (cap. 5 e 6.1.1 b); Nmáx = f(ITmáx): log N = 7,874 log IT − 1,307
  function itDeN(N) { return ok(N) && N > 0 ? Math.pow(10, 0.127 * Math.log10(N) + 0.166) : NaN; }
  function nDeIt(it) { return ok(it) && it > 0 ? Math.pow(10, 7.874 * Math.log10(it) - 1.307) : NaN; }

  // Nomograma 3 — digitalizado: retas em escala log-log de inclinação 1 (hc = k × IT), com patamar inferior
  // (5,0 cm nas linhas 1 a 6; 4,0 cm nas linhas 7 e 8). k lido nas extremidades das retas (IT 5,3 e 15,3).
  var NOMO3 = [
    ["1", "Granular (CBR = 60 %)", 1.232, 5.0], ["2", "Granular (CBR = 65 %)", 1.148, 5.0], ["3", "Granular (CBR = 70 %)", 1.065, 5.0],
    ["4", "Granular (CBR = 75 %)", 0.986, 5.0], ["5", "Granular (CBR = 80 %)", 0.921, 5.0], ["6", "Granular (CBR ≥ 85 %)", 0.855, 5.0],
    ["7", "Macadame betuminoso por penetração", 0.6375, 4.0], ["8", "Pré-misturado aberto", 0.5075, 4.0],
  ];
  function hcNomo3(linha, it) {
    var L = NOMO3.filter(function (x) { return x[0] === linha; })[0];
    return L && ok(it) ? Math.max(L[3], L[2] * it) : NaN;
  }
  // Nomograma 5 — digitalizado (Δ % -> H em cm de pedregulho), interpolação linear
  var NOMO5 = [[0, 0], [10, 0.7], [15, 1.65], [17.5, 2.34], [20, 2.87], [22.5, 3.66], [24, 4.35], [28, 5.87], [30, 6.85], [32, 7.84], [34, 8.76],
    [38, 11.5], [40, 12.98], [45, 17.56], [50, 22.56], [55, 27.64], [60, 32.48], [65, 37.85], [70, 42.89], [75, 48.02], [80, 53.49], [85, 58.66], [88, 61.5], [90, 63.6]];
  function hNomo5(delta) {
    if (!ok(delta) || delta < 0 || delta > 90) return NaN;
    for (var i = 1; i < NOMO5.length; i++) if (delta <= NOMO5[i][0]) {
      var a = NOMO5[i - 1], b = NOMO5[i];
      return a[1] + (b[1] - a[1]) * (delta - a[0]) / (b[0] - a[0]);
    }
    return NaN;
  }
  // Apêndice A — fatores de equivalência estrutural com referência ao pedregulho
  var FEQ = [["1.10a", "Macadame hidráulico", 1.10], ["1.10b", "Solo-cimento (RCS 7 dias ≥ 21 kg/cm²)", 1.10], ["1.10c", "Tratamento superficial", 1.10],
    ["1.20", "Macadame betuminoso por penetração", 1.20], ["1.33", "Pré-misturado a frio aberto (Vv > 8 %)", 1.33], ["1.35", "Pré-misturado a quente aberto (Vv > 8 %)", 1.35],
    ["1.36", "Pré-misturado a frio semidenso (5 % < Vv ≤ 8 %)", 1.36], ["1.42", "Areia-asfalto a quente (Vv ≤ 8 %)", 1.42],
    ["1.58", "Pré-misturado a quente semidenso (5 % < Vv ≤ 8 %)", 1.58], ["1.70", "Concreto betuminoso (Vv ≤ 5 %)", 1.70], ["outro", "Outro (Figuras 2, 3 e 4 do Apêndice A)", NaN]];

  function se(k, v) { return function (d) { var x = (d.params || {})[k]; return Array.isArray(v) ? v.indexOf(x) >= 0 : x === v; }; }

  FE.FICHAS["dner-pro-010-79"] = {
    titulo: "Avaliação estrutural de pavimentos flexíveis — Procedimento A",
    rotuloImportar: function (r) { var g = (r.grupos || [])[0]; return g && g.est ? "dp " + fmt(g.dp, 1) + " (0,01 mm) · d0 " + fmt(g.d0, 1) : ""; },
    resumo: "Estatística das deflexões do segmento homogêneo (4.2.8), dp = dc × Fs, d0 = 0,7 dp, índices de tráfego, quadro de diretrizes de projeto, vida restante e reforço pelo critério de deformabilidade (cap. 6: IF, hef, (hCB)mín, camadas de materiais distintos).",
    blocos: [],
    params: DF.params("4.2.2").concat(DF.paramsFs("4.2.9")).concat([
      { k: "igg", r: "IGG — índice de gravidade global do segmento" },
      { k: "flecha", r: "F̄ — flecha média nas trilhas de roda (mm)" },
      { k: "ap", r: "AP % — estações com afundamentos plásticos de reconhecida gravidade (%)" },
      { k: "ns", r: "Ns — N do tráfego já suportado (abertura → início do projeto)", ph: "ex.: 3,5e6 ou 3500000" },
      { k: "np", r: "Np — N previsto para o período de projeto", ph: "ex.: 5e6" },
      { k: "revest", r: "Revestimento existente", tipo: "select", recarrega: true,
        opcoes: [["cb", "Mistura betuminosa densa (concreto betuminoso) — nomograma 1"], ["ts", "Tratamento superficial / macadame betuminoso / mistura aberta (he = 0) — nomograma 2"]] },
      { k: "he", r: "he — espessura da camada betuminosa densa existente (cm)", se: se("revest", "cb") },
      { k: "dadm", r: "dadm — deflexão admissível lida no nomograma " + "1 ou 2 para ITt e he (0,01 mm)", dica: "nomograma 1: curva IT = ITt, abscissa hCB = he; nomograma 2 para tratamento superficial" },
      { k: "itmax", r: "ITmáx — IT da curva do nomograma 1 que passa por (he; d0) — opcional", dica: "vida restante: Nmáx = 10^(7,874 log ITmáx − 1,307)" },
      { k: "n1", r: "N do primeiro ano após a avaliação — opcional (vida restante em anos)" },
      { k: "tx", r: "Taxa de crescimento anual do tráfego (%) — opcional" },
      { k: "reforco", r: "Cálculo do reforço (cap. 6)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não calcular"], ["cb", "6.1 — Reforço só em concreto betuminoso: (hCB)mín e viabilidade"], ["multi", "6.2 — Camadas de materiais distintos"], ["ambos", "6.1 e 6.2"]] },
      { k: "fc1", r: "FC-1 — área com fissuração classe 1 como estágio mais severo (%)", se: se("reforco", ["cb", "ambos"]) },
      { k: "fc2", r: "FC-2 — área com fissuração classe 2 como estágio mais severo (%)", se: se("reforco", ["cb", "ambos"]) },
      { k: "fc3", r: "FC-3 — área com fissuração classe 3 como estágio mais severo (%)", se: se("reforco", ["cb", "ambos"]) },
      { k: "linha3", r: "Material subjacente à mistura densa existente (nomograma 3)", tipo: "select", se: se("reforco", ["cb", "ambos"]),
        opcoes: NOMO3.map(function (x) { return [x[0], "Linha " + x[0] + " — " + x[1]]; }) },
      { k: "dhmax", r: "(dh)máx — lido no nomograma 4 para (hCB)mín (0,01 mm)", se: se("reforco", ["cb", "ambos"]),
        dica: "condições (b)/(d): use a curva auxiliar (curva de ITp menos he), 6.1.5.2" },
      { k: "dadmmax", r: "(dadm)máx — lido no nomograma 4 para (hCB)mín (0,01 mm)", se: se("reforco", ["cb", "ambos"]) },
      { k: "hcbmax", r: "(hCB)máx — lido no nomograma 4, se (dh)mín < (dh)máx (cm) — opcional", se: se("reforco", ["cb", "ambos"]) },
      { k: "linhaM", r: "6.2 — Material da camada subjacente à de rolamento (nomograma 3)", tipo: "select", se: se("reforco", ["multi", "ambos"]),
        opcoes: NOMO3.map(function (x) { return [x[0], "Linha " + x[0] + " — " + x[1]]; }) },
      { k: "fcb", r: "6.2 — fCB, fator de equivalência do concreto betuminoso", ph: "1,70", se: se("reforco", ["multi", "ambos"]) },
      { k: "dadmR", r: "6.2 — dadm sobre o reforço, lida no nomograma 1 para hCB e ITp (0,01 mm)", se: se("reforco", ["multi", "ambos"]) },
      { k: "mati", r: "6.2 — Material da camada subjacente (fator fi)", tipo: "select", recarrega: true, se: se("reforco", ["multi", "ambos"]),
        opcoes: FEQ.map(function (x) { return [x[0], x[1] + (ok(x[2]) ? " — " + fmt(x[2], 2) : "")]; }) },
      { k: "fi", r: "6.2 — fi informado (Figuras 2 a 4 do Apêndice A)", se: function (d) { var P = d.params || {}; return (P.reforco === "multi" || P.reforco === "ambos") && P.mati === "outro"; } },
    ]),
    padrao: { correl: "nao", universo: "unico", subleito: "arenoso", estacao: "seca", revest: "cb", reforco: "nao", linha3: "1", linhaM: "1", fcb: "1,70", mati: "1.20" },
    tabelas: function () {
      return [{ chave: "pts", titulo: "Estações de ensaio — deflexões recuperáveis na trilha de roda externa", rotulo: "Estação", iniciais: 10, min: 1,
        dica: "estações alternadas nas duas faixas, a 40 m numa mesma faixa (20 m entre estações consecutivas) — 4.2.1", linhas: DF.linhas() }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var proc = DF.processar(d, avisos);
      DF.verificarExtensao(proc.ext, P.universo === "faixa", 2000, avisos, "4.2.7 / 4.2.8");
      var fs = DF.fs(P, avisos, "4.2.9");
      var ns = num(P.ns), np = num(P.np), nt = ok(ns) && ok(np) ? ns + np : NaN;
      var itT = itDeN(nt), itP = itDeN(np);
      var cb = P.revest !== "ts", he = cb ? num(P.he) : 0, dadm = num(P.dadm), igg = num(P.igg), fl = num(P.flecha), ap = num(P.ap);
      if (cb && !ok(he)) avisos.push("Informe he, a espessura da camada betuminosa densa existente (6.1.1 c).");
      if (!ok(np)) avisos.push("Informe Np (tráfego do período de projeto) para os índices de tráfego (cap. 5).");
      if (!ok(dadm)) avisos.push("Informe dadm lida no nomograma " + (cb ? "1 (curva IT = ITt, abscissa he)" : "2") + " para o critério de diretrizes (cap. 5).");
      var r = { fs: fs, ns: ns, np: np, nt: nt, itT: itT, itP: itP, he: he, dadm: dadm, igg: igg, flecha: fl, ap: ap, cb: cb,
        ext: proc.ext, rMed: proc.rMed, rMin: proc.rMin, nR: proc.nR, grupos: [] };
      proc.grupos.forEach(function (g) {
        var o = { k: g.k, est: g.est };
        if (g.est) {
          o.dp = g.est.dc * fs; o.d0 = 0.7 * o.dp;
          // quadro — critério para o estabelecimento das diretrizes de projeto
          var q = { linha: NaN, txt: "" };
          if (ok(igg) && igg > 180) q = { linha: 5, txt: "Remoção parcial ou total do pavimento existente e substituição por nova estrutura projetada pelo critério de resistência." };
          else if (ok(igg) && ((ok(fl) && fl > 30) || (ok(ap) && ap > 33))) q = { linha: 4, txt: "Aproveitamento do valor residual; reparos locais; reforço pelo critério de resistência (ou nova estrutura pelo critério de resistência)." };
          else if (ok(igg) && ok(fl) && ok(ap) && ok(dadm)) {
            if (o.d0 <= dadm) q = { linha: 1, txt: "Aproveitamento total do valor residual; reparos locais e tratamento de rejuvenescimento, se necessários." };
            else if (o.d0 <= 3 * dadm) q = { linha: 2, txt: "Aproveitamento total do valor residual; reparos locais, se necessários; reforço pelo critério de deformabilidade." };
            else q = { linha: 3, txt: "Aproveitamento total ou parcial; reparos locais; reforço pelos critérios de deformabilidade e de resistência, ou nova estrutura pelo critério de resistência." };
          }
          o.quadro = q;
          // vida restante (cap. 5)
          var itmax = num(P.itmax);
          if (ok(itmax)) {
            o.nmax = nDeIt(itmax);
            if (ok(ns)) {
              o.nr = o.nmax - ns;
              if (o.nr <= 0) avisos.push("Nmáx = " + DF.fmtN(o.nmax) + " ≤ Ns: o pavimento já não está na fase elástica (cap. 5).");
              var n1 = num(P.n1), tx = num(P.tx) / 100;
              if (o.nr > 0 && ok(n1) && n1 > 0) o.anos = ok(tx) && tx > 0 ? Math.log(1 + o.nr * tx / n1) / Math.log(1 + tx) : o.nr / n1;
            }
          }
        }
        r.grupos.push(o);
      });
      if (!ok(igg)) avisos.push("Informe o IGG do segmento (avaliação objetiva da superfície) para enquadrar no quadro de diretrizes (cap. 5).");
      else if (igg <= 180 && (!ok(fl) || !ok(ap))) avisos.push("Informe F̄ (flecha média) e AP % para enquadrar no quadro de diretrizes (cap. 5).");
      // ---- reforço 6.1 ----
      var ref = P.reforco || "nao";
      if (ref === "cb" || ref === "ambos") {
        var f1 = num(P.fc1) || 0, f2 = num(P.fc2) || 0, f3 = num(P.fc3) || 0;
        if (!ok(num(P.fc1)) && !ok(num(P.fc2)) && !ok(num(P.fc3))) avisos.push("Informe FC-1, FC-2 e FC-3 (frequências relativas da avaliação objetiva da superfície, 6.1.1 e–g).");
        if (f1 + f2 + f3 > 100.001) avisos.push("FC-1 + FC-2 + FC-3 = " + fmt(f1 + f2 + f3, 1) + " % > 100 %: confira as porcentagens.");
        var rf = { fc1: f1, fc2: f2, fc3: f3 };
        rf.IF = 0.250 * f1 + 0.625 * f2 + f3;
        rf.inter = f2 + f3;
        rf.cond = f3 < 20 ? (rf.inter >= 80 ? "a" : "b") : (rf.inter >= 80 ? "c" : "d");
        rf.fr = 1 - 0.007 * rf.IF;
        rf.hef = he * rf.fr;
        rf.hc = hcNomo3(P.linha3 || "1", itP);
        if (ok(itP) && (itP < 5 || itP > 15.6)) avisos.push("ITp = " + fmt(itP, 2) + " fora do nomograma 3 (IT de 5 a 15,5): hc extrapolado.");
        rf.dh = rf.hc - rf.hef;
        rf.piso = f3 < 20 ? 4 : 10;
        rf.hmin = ok(rf.dh) ? Math.max(rf.dh, rf.piso) : NaN;
        var dhx = num(P.dhmax), dax = num(P.dadmmax), hmx = num(P.hcbmax);
        rf.dhmax = dhx; rf.dadmmax = dax; rf.hcbmax = hmx;
        if (ok(dhx) && ok(dax)) rf.viavel = dhx <= dax;
        else avisos.push("Informe (dh)máx e (dadm)máx lidos no nomograma 4 para (hCB)mín = " + fmt(rf.hmin, 1) + " cm (6.1.5).");
        if (rf.viavel === false) avisos.push("(dh)máx > (dadm)máx: reforço exclusivamente em concreto betuminoso impraticável — estudar camadas de materiais distintos (6.1.5, 6.2).");
        if (ok(hmx) && ok(rf.hmin) && hmx < rf.hmin) avisos.push("(hCB)máx menor que (hCB)mín: confira as leituras do nomograma 4.");
        rf.htotal = ok(rf.hmin) ? (rf.inter >= 80 ? rf.hmin : rf.hmin + he) : NaN;
        r.ref = rf;
      }
      // ---- reforço 6.2 ----
      if (ref === "multi" || ref === "ambos") {
        var g0 = r.grupos.filter(function (g) { return g.est; })[0];
        var m2 = { d0: g0 ? g0.d0 : NaN, fcb: num(P.fcb) || 1.70 };
        m2.hcb = hcNomo3(P.linhaM || "1", itP);
        m2.Hcb = m2.hcb * m2.fcb;
        m2.dadm = num(P.dadmR);
        m2.dh = m2.dadm;
        if (!ok(m2.dadm)) avisos.push("Informe a dadm sobre o reforço lida no nomograma 1 para hCB = " + fmt(m2.hcb, 1) + " cm e ITp = " + fmt(itP, 2) + " (6.2 d).");
        m2.delta = ok(m2.d0) && ok(m2.dh) ? (m2.d0 - m2.dh) / m2.d0 * 100 : NaN;
        m2.H = hNomo5(m2.delta);
        if (ok(m2.delta) && m2.delta <= 0) { avisos.push("d0 ≤ dadm: não há redução de deflexão a obter (6.2 f)."); m2.H = 0; }
        if (ok(m2.delta) && m2.delta > 90) avisos.push("Δ = " + fmt(m2.delta, 1) + " % fora do nomograma 5 (até 90 %).");
        m2.Hi = m2.H - m2.Hcb;
        var fe = FEQ.filter(function (x) { return x[0] === (P.mati || "1.20"); })[0];
        m2.fi = fe && ok(fe[2]) ? fe[2] : num(P.fi);
        m2.hi = ok(m2.Hi) && m2.Hi > 0 && ok(m2.fi) ? m2.Hi / m2.fi : ok(m2.Hi) && m2.Hi <= 0 ? 0 : NaN;
        if (ok(m2.Hi) && m2.Hi <= 0) avisos.push("H ≤ HCB: a camada de rolamento de concreto betuminoso basta (6.2 h exige H > HCB).");
        if (P.universo === "faixa" && r.grupos.length > 1) avisos.push("6.2 calculado com a primeira faixa; repita por faixa, se necessário.");
        r.multi = m2;
      }
      return { tab: { pts: proc.pts }, pontos: proc.pts, proc: proc, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">', I = DF.item;
      r.grupos.forEach(function (g) {
        var e = g.est, rot = g.k ? " — faixa " + esc(g.k) : "";
        if (!e) return;
        h += I(fmt(e.media, 1) + " ± " + fmt(e.sd, 1) + " <small>0,01 mm</small>", "d̄ ± σ (4.2.8)" + rot + " — n = " + e.n + " de " + e.n0 + ", cv = " + fmt(e.cv * 100, 1) + " %", true) +
          I(fmt(e.dc, 1) + " <small>0,01 mm</small>", "dc = d̄ + σ" + rot) +
          I(fmt(g.dp, 1) + " <small>0,01 mm</small>", "dp = dc × Fs (Fs = " + fmt(r.fs, 2) + ")" + rot) +
          I(fmt(g.d0, 1) + " <small>0,01 mm</small>", "d0 = 0,7 × dp — referida ao eixo de 6,8 t" + rot, true);
        if (g.quadro && g.quadro.linha) h += I("Linha " + g.quadro.linha, "Quadro de diretrizes: " + esc(g.quadro.txt), true);
        if (ok(g.nmax)) h += I(DF.fmtN(g.nr > 0 ? g.nr : g.nmax), (g.nr > 0 ? "Nr = Nmáx − Ns (vida restante)" : "Nmáx") + (ok(g.anos) ? " — ≈ " + fmt(g.anos, 1) + " ano(s)" : ""), true);
      });
      h += I(fmt(r.itT, 2) + " / " + fmt(r.itP, 2), "ITt (Nt = Ns + Np) / ITp (Np)", true);
      if (r.ref) {
        var f = r.ref;
        h += I(fmt(f.IF, 1) + " · (" + f.cond + ")", "IF = 0,25 FC-1 + 0,625 FC-2 + FC-3 · condição de fissuração (6.1.2)", true) +
          I(fmt(f.hmin, 1) + " <small>cm</small>", "(hCB)mín — hc " + fmt(f.hc, 1) + " (nomograma 3), hef " + fmt(f.hef, 1) + ", Δh " + fmt(f.dh, 1) + " (6.1.3)") +
          (f.viavel === undefined ? "" : I(f.viavel ? '<span class="fe-ok">viável</span>' : '<span class="fe-nok">inviável</span>', "Reforço só em concreto betuminoso (6.1.5)" + (f.viavel && ok(f.hcbmax) ? ": " + fmt(f.hmin, 1) + " ≤ hCB ≤ " + fmt(f.hcbmax, 1) + " cm" : ""), true));
      }
      if (r.multi) {
        var m = r.multi;
        h += I(fmt(m.hcb, 1) + " + " + fmt(m.hi, 1) + " <small>cm</small>", "6.2: concreto betuminoso hCB + camada subjacente hi (Δ = " + fmt(m.delta, 1) + " %, H = " + fmt(m.H, 1) + " cm de pedregulho)");
      }
      return h + "</div>";
    },
    graficos: function (calc, d, opt) { return [DF.deflectograma(calc.proc, opt, "dc")]; },
    relatorio: {
      notas: "Estatística (4.2.8): d̄, σ com n − 1, eliminação iterativa fora de d̄ ± zσ (Tabela I) e dc = d̄ + σ; dp = dc × Fs (Tabela II); d0 = 0,7 dp (carga de 6,8 t, processo californiano). " +
        "log IT = 0,127 log N + 0,166; log Nmáx = 7,874 log ITmáx − 1,307. IF = 0,250 FC-1 + 0,625 FC-2 + FC-3; fr = 1 − 0,007 IF; hef = he × fr; Δh = hc − hef; (hCB)mín = máx(Δh; 4,0 cm) se FC-3 < 20 % ou máx(Δh; 10,0 cm) se FC-3 ≥ 20 %. " +
        "Nomograma 3 digitalizado (retas hc = k × IT em escala log-log, com patamares de 5,0 e 4,0 cm); nomograma 5 digitalizado (interpolação linear). Os nomogramas 1, 2 e 4 são famílias de curvas: os valores lidos são informados pelo usuário.",
      resultados: function (calc) {
        var r = calc.resultados, rows = [];
        r.grupos.forEach(function (g) {
          var e = g.est, rot = g.k ? " — faixa " + g.k : "";
          if (!e) return;
          rows.push(["Deflexões" + rot, "n = " + e.n + " de " + e.n0 + (e.elim.length ? " (" + e.elim.length + " eliminada(s))" : "") + "; d̄ = " + fmt(e.media, 1) + "; σ = " + fmt(e.sd, 1) + "; cv = " + fmt(e.cv * 100, 1) + " % (0,01 mm)"]);
          rows.push(["dc / dp / d0" + rot, fmt(e.dc, 1) + " / " + fmt(g.dp, 1) + " / " + fmt(g.d0, 1) + " × 0,01 mm (Fs = " + fmt(r.fs, 2) + ")"]);
          if (g.quadro && g.quadro.linha) rows.push(["Diretrizes de projeto" + rot, "Linha " + g.quadro.linha + " do quadro — " + g.quadro.txt]);
          if (ok(g.nmax)) rows.push(["Vida restante" + rot, "Nmáx = " + DF.fmtN(g.nmax) + (ok(g.nr) ? (g.nr > 0 ? "; Nr = " + DF.fmtN(g.nr) : "; Nmáx ≤ Ns — fora da fase elástica") : "") + (ok(g.anos) ? " (≈ " + fmt(g.anos, 1) + " anos)" : "")]);
        });
        rows.push(["Tráfego", "Ns = " + DF.fmtN(r.ns) + "; Np = " + DF.fmtN(r.np) + "; Nt = " + DF.fmtN(r.nt) + "; ITt = " + fmt(r.itT, 2) + "; ITp = " + fmt(r.itP, 2)]);
        rows.push(["dadm (nomograma " + (r.cb ? "1" : "2") + ") / IGG / F̄ / AP %", fmt(r.dadm, 1) + " / " + fmt(r.igg, 0) + " / " + fmt(r.flecha, 1) + " mm / " + fmt(r.ap, 1) + " %"]);
        if (ok(r.rMed)) rows.push(["Raio de curvatura", "médio " + fmt(r.rMed, 0) + " m; mínimo " + fmt(r.rMin, 0) + " m (" + r.nR + " determinações)"]);
        if (r.ref) {
          var f = r.ref;
          rows.push(["Fissuração (6.1.1 h e 6.1.2)", "IF = " + fmt(f.IF, 1) + "; FC-2 + FC-3 = " + fmt(f.inter, 1) + " %; condição (" + f.cond + ")"]);
          rows.push(["(hCB)mín (6.1.3)", fmt(f.hmin, 1) + " cm (hc = " + fmt(f.hc, 1) + "; fr = " + fmt(f.fr, 3) + "; hef = " + fmt(f.hef, 1) + "; Δh = " + fmt(f.dh, 1) + " cm)"]);
          if (f.viavel !== undefined) rows.push(["Reforço só em CB (6.1.5)", (f.viavel ? "viável — hCB = " + fmt(f.hmin, 1) + " cm" + (ok(f.hcbmax) ? " (máx. " + fmt(f.hcbmax, 1) + " cm)" : "") : "INVIÁVEL — (dh)máx " + fmt(f.dhmax, 1) + " > (dadm)máx " + fmt(f.dadmmax, 1))]);
        }
        if (r.multi) {
          var m = r.multi;
          rows.push(["Reforço em camadas distintas (6.2)", "hCB = " + fmt(m.hcb, 1) + " cm (HCB = " + fmt(m.Hcb, 1) + "); dh = " + fmt(m.dh, 1) + "; Δ = " + fmt(m.delta, 1) + " %; H = " + fmt(m.H, 1) + " cm; Hi = " + fmt(m.Hi, 1) + "; hi = " + fmt(m.hi, 1) + " cm (fi = " + fmt(m.fi, 2) + ")"]);
        }
        return rows;
      },
    },
    exemplos: [
      { nome: "Segmento de 400 m em CBUQ 5 cm — reforço em CB e em camadas (dados gerados)", dados: function () {
        return { ident: { registro: "EX-P010-001", data: "2026-05-12", obra: "BR-000", trecho: "Segmento homogêneo 2 — est. 100 a 119", camada: "CBUQ 5 cm sobre base granular" },
          params: { correl: "nao", universo: "unico", subleito: "argiloso", estacao: "seca", fs: "1,20", igg: "95", flecha: "8", ap: "5", ns: "3,2e6", np: "4,5e6",
            revest: "cb", he: "5", dadm: "62", reforco: "ambos", fc1: "20", fc2: "25", fc3: "10", linha3: "4",
            dhmax: "55", dadmmax: "58", hcbmax: "9", linhaM: "4", fcb: "1,70", dadmR: "38", mati: "1.20" },
          pts: DF.exemploEstacoes(78, 14, 180, 11) };
      } },
      { nome: "Segmento degradado — IGG > 180, trincas classe 3 e raio < 100 m (dados gerados)", dados: function () {
        var p = DF.exemploEstacoes(118, 30, 120, 5);
        p[3].D = "205"; p[0].R = "85"; p[10].R = "92";
        return { ident: { registro: "EX-P010-002", data: "2026-08-20", obra: "BR-000", trecho: "Segmento homogêneo 5", camada: "CBUQ 4 cm" },
          params: { correl: "nao", universo: "unico", subleito: "arenoso", estacao: "seca", fs: "1,40", igg: "196", flecha: "18", ap: "40", ns: "8e6", np: "6e6",
            revest: "cb", he: "4", dadm: "48", reforco: "cb", fc1: "5", fc2: "40", fc3: "45", linha3: "2", dhmax: "70", dadmmax: "52" },
          pts: p };
      } },
    ],
  };
})();
