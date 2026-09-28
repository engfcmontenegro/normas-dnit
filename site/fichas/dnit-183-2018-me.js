/*
 * Ficha: DNIT 183/2018-ME — Pavimentação asfáltica — Fadiga por compressão diametral à tensão controlada.
 * O equipamento fornece, por corpo de prova, a carga aplicada, o deslocamento resiliente inicial (opcional) e o
 * número de ciclos até a ruptura; a ficha calcula σt, Δσ, εi (seções 7.3 e 7.4) e ajusta os modelos log-log da 7.2.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G = 9.80665;

  // rótulo dos ensaios de resistência à tração salvos (DNIT 136) no campo "importar"

  // ---------- gráfico XY com escalas linear ou logarítmica ----------
  var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function rotLog(k) {
    if (k >= -3 && k <= 6) return fmt(Math.pow(10, k), Math.max(0, -k));
    return "10" + String(k).split("").map(function (c) { return SUP[c]; }).join("");
  }
  function passoLin(a, b) {
    var r = (b - a) / 5 || 1, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  // o = {opt, logX, logY, logY2, xl, yl, y2l, series: [{pts: [[x, y]], cor, linha, marca, trac, rot, y2}], vlinhas: [{x, cor, rot}],
  //      leg: "dir"|"esq", vazio, xInclui, yInclui}
  function grafXY(o) {
    var temY2 = o.series.some(function (s) { return s.y2; });
    var opt = o.opt || {}, W = opt.w || 560, H = opt.h || 300, m = { l: 62, r: temY2 ? 62 : 26, t: 14, b: 42 };
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var xs = [], ys = [], y2s = [];
    o.series.forEach(function (s) {
      var lg = s.y2 ? o.logY2 : o.logY;
      s.pts.forEach(function (p) {
        if (ok(p[0]) && ok(p[1]) && (!o.logX || p[0] > 0) && (!lg || p[1] > 0)) { xs.push(p[0]); (s.y2 ? y2s : ys).push(p[1]); }
      });
    });
    if (!ys.length && y2s.length) ys = y2s.slice();
    if (xs.length < 2) return '<div class="fe-graf-vazio">' + (o.vazio || "O gráfico aparece com os resultados.") + "</div>";
    function eixo(v, log, inclui) {
      v = v.concat((inclui || []).filter(function (x) { return ok(x) && (!log || x > 0); }));
      var a = Math.min.apply(null, v), b = Math.max.apply(null, v);
      if (log) {
        var la = Math.floor(Math.log10(a) + 1e-9), lb = Math.ceil(Math.log10(b) - 1e-9);
        if (lb <= la) lb = la + 1;
        return { log: true, a: la, b: lb };
      }
      if (a === b) { a -= 1; b += 1; }
      var p = passoLin(a, b);
      return { log: false, a: Math.floor(a / p + 1e-9) * p, b: Math.ceil(b / p - 1e-9) * p, p: p };
    }
    var ex = eixo(xs, o.logX, o.xInclui), ey = eixo(ys, o.logY, o.yInclui), ey2 = y2s.length ? eixo(y2s, o.logY2, o.y2Inclui) : null;
    function X(v) { return m.l + ((ex.log ? Math.log10(v) : v) - ex.a) / (ex.b - ex.a) * (W - m.l - m.r); }
    function Yde(e) { return function (v) { return H - m.b - ((e.log ? Math.log10(v) : v) - e.a) / (e.b - e.a) * (H - m.t - m.b); }; }
    var Y = Yde(ey), Y2 = ey2 ? Yde(ey2) : Y;
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    function linhaGrade(x1, y1, x2, y2, w) {
      s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + grade + '" stroke-width="' + w + '"/>';
    }
    function marcas(e, vert) {
      var L = [];
      if (e.log) {
        for (var k = e.a; k <= e.b; k++) {
          L.push([Math.pow(10, k), rotLog(k), 0.9]);
          if (k < e.b) for (var j = 2; j <= 9; j++) L.push([j * Math.pow(10, k), "", 0.35]);
        }
      } else {
        var casas = Math.max(0, -Math.floor(Math.log10(e.p) + 1e-9));
        for (var v = e.a; v <= e.b + e.p * 1e-6; v += e.p) L.push([v, fmt(Math.abs(v) < e.p * 1e-6 ? 0 : v, casas), 0.6]);
      }
      L.forEach(function (t) {
        if (vert) {
          var x = X(t[0]); linhaGrade(x, m.t, x, H - m.b, t[2]);
          if (t[1]) s += '<text x="' + x.toFixed(1) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + t[1] + "</text>";
        } else {
          var y = Y(t[0]); linhaGrade(m.l, y, W - m.r, y, t[2]);
          if (t[1]) s += '<text x="' + (m.l - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" fill="' + txt + '">' + t[1] + "</text>";
        }
      });
    }
    marcas(ex, true); marcas(ey, false);
    if (ey2) {  // eixo secundário (direita), só rótulos
      var L2 = [];
      if (ey2.log) for (var k2 = ey2.a; k2 <= ey2.b; k2++) L2.push([Math.pow(10, k2), rotLog(k2)]);
      else for (var v2 = ey2.a, c2 = Math.max(0, -Math.floor(Math.log10(ey2.p) + 1e-9)); v2 <= ey2.b + ey2.p * 1e-6; v2 += ey2.p) L2.push([v2, fmt(v2, c2)]);
      L2.forEach(function (t2) {
        var y = Y2(t2[0]);
        s += '<line x1="' + (W - m.r) + '" y1="' + y.toFixed(1) + '" x2="' + (W - m.r + 4) + '" y2="' + y.toFixed(1) + '" stroke="' + txt + '"/>';
        s += '<text x="' + (W - m.r + 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="start" fill="' + txt + '">' + t2[1] + "</text>";
      });
      s += '<text transform="translate(' + (W - 10) + " " + ((H - m.b + m.t) / 2) + ') rotate(90)" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.y2l || "") + "</text>";
    }
    (o.vlinhas || []).forEach(function (vl, iv) {
      if (!ok(vl.x) || (o.logX && vl.x <= 0)) return;
      var x = X(vl.x);
      if (x < m.l || x > W - m.r) return;
      s += '<line x1="' + x.toFixed(1) + '" y1="' + m.t + '" x2="' + x.toFixed(1) + '" y2="' + (H - m.b) + '" stroke="' + (vl.cor || txt) + '" stroke-width="1.2" stroke-dasharray="4 3"/>';
      if (vl.rot) s += '<text x="' + (x + 4).toFixed(1) + '" y="' + (H - m.b - 6 - iv * 13) + '" text-anchor="start" fill="' + (vl.cor || txt) + '">' + FE.esc(vl.rot) + "</text>";
    });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.xl || "") + "</text>";
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">' + FE.esc(o.yl || "") + "</text>";
    var nl = 0;
    o.series.forEach(function (sr) {
      var lg = sr.y2 ? o.logY2 : o.logY, Ys = sr.y2 ? Y2 : Y;
      var pts = sr.pts.filter(function (p) { return ok(p[0]) && ok(p[1]) && (!o.logX || p[0] > 0) && (!lg || p[1] > 0); }), cor = sr.cor || "#4f8cff";
      if (!pts.length) return;
      if (sr.linha) s += '<path d="' + pts.map(function (p, j) { return (j ? "L" : "M") + X(p[0]).toFixed(1) + " " + Ys(p[1]).toFixed(1); }).join(" ") +
        '" fill="none" stroke="' + cor + '" stroke-width="' + (sr.larg || 1.8) + '"' + (sr.trac ? ' stroke-dasharray="5 4"' : "") + "/>";
      if (sr.marca !== false) pts.forEach(function (p) {
        s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Ys(p[1]).toFixed(1) + '" r="' + (sr.raio || 3) + '" fill="' + (sr.vazado ? "none" : cor) + '" stroke="' + cor + '"/>';
      });
      if (sr.rot) {
        var dir = o.leg === "dir";
        s += '<text x="' + (dir ? W - m.r - 8 : m.l + 8) + '" y="' + (m.t + 12 + nl * 13) + '" text-anchor="' + (dir ? "end" : "start") + '" fill="' + cor + '">' + FE.esc(sr.rot) + "</text>";
        nl++;
      }
    });
    return s + "</svg>";
  }
  var CORES = ["#4f8cff", "#e0a13a", "#34c38f", "#b58cff", "#e5534b", "#4fc3d9", "#9aa3b2"];
  // regressão linear de log10(y) sobre log10(x): y = 10^a · x^b ; R² no espaço log-log (linha de tendência "potência")
  function regLog(xs, ys) {
    var P = [];
    xs.forEach(function (x, i) { if (ok(x) && ok(ys[i]) && x > 0 && ys[i] > 0) P.push([Math.log10(x), Math.log10(ys[i])]); });
    var n = P.length;
    if (n < 2) return null;
    var mx = media(P.map(function (p) { return p[0]; })), my = media(P.map(function (p) { return p[1]; }));
    var sxx = 0, sxy = 0, syy = 0;
    P.forEach(function (p) { sxx += (p[0] - mx) * (p[0] - mx); sxy += (p[0] - mx) * (p[1] - my); syy += (p[1] - my) * (p[1] - my); });
    if (!sxx) return null;
    var b = sxy / sxx, a = my - b * mx;
    return { a: a, b: b, r2: syy ? sxy * sxy / (sxx * syy) : NaN, n: n };
  }
  function fmtK(k) {  // constante de regressão: notação científica quando muito grande ou pequena
    if (!ok(k)) return "—";
    if (k >= 1e-3 && k < 1e7) return FE.fmtSig(k, 4);
    var e = Math.floor(Math.log10(k)), m = k / Math.pow(10, e);
    return fmt(m, 3) + " × 10" + String(e).split("").map(function (c) { return SUP[c]; }).join("");
  }
  var MODELOS = [
    { k: "1", var: "st", rot: "N = k₁ (1/σt)^n₁", eq: "eq. 1", x: "σt (MPa)" },
    { k: "2", var: "ei", rot: "N = k₂ (1/εi)^n₂", eq: "eq. 2", x: "εi" },
    { k: "3", var: "ds", rot: "N = k₃ (1/Δσ)^n₃", eq: "eq. 3", x: "Δσ (MPa)" },
    { k: "4", var: "rel", rot: "N = k₄ (σt/σr)^n₄", eq: "eq. 4", x: "σt/σr" },
  ];

  FE.FICHAS["dnit-183-2018-me"] = {
    titulo: "Misturas asfálticas — Fadiga por compressão diametral à tensão controlada",
    resumo: "Carregamento repetido a 1 Hz (0,1 s de carga e 0,9 s de repouso) a 25 °C até a ruptura completa do CP, em quatro ou mais níveis de tensão entre 5 % e 40 % da RT, três CPs por nível. σt = 2F/(π·t·d) (eq. 7), Δσ = 4σt (eq. 10), εi = σt/MR (eq. 5) e modelos N = k(1/x)^n ajustados por regressão log-log (7.2), com R² ≥ 0,8 para 12 CPs.",
    blocos: [],
    params: [
      { k: "mistura", r: "Mistura asfáltica", ph: "ex.: CBUQ faixa C, CAP 50/70" },
      { k: "moldagem", r: "Moldagem dos CPs (5.1)", tipo: "select",
        opcoes: [["giratorio", "Compactador giratório (DNIT 178-PRO)"], ["marshall", "Compactador Marshall (DNER-ME 043)"], ["placa", "Extraídos de placas moldadas em laboratório"]] },
      { k: "importarRT", r: "Resistência à tração: importar de um ensaio salvo (DNIT 136)", tipo: "importar", de: "dnit-136-2018-me",
        dica: "RT média de três CPs escolhidos entre os moldados (6 a)",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          if (ok(r.rt)) P.rt = fmt(r.rt, 3);
          P.rtRegistro = (i.registro || "ensaio salvo") + (i.camada ? " · " + i.camada : "");
        } },
      { k: "rtRegistro", r: "Ensaio de resistência à tração de origem" },
      { k: "rt", r: "Resistência à tração média — RT = σr (MPa) (6 a)", ph: "ex.: 1,70" },
      { k: "importarMR", r: "Módulo de resiliência: importar de um ensaio salvo (DNIT 135)", tipo: "importar", de: "dnit-135-2018-me",
        dica: "MR médio — usado em εi = σt/MR quando o CP não tem deslocamento inicial medido (7.3)",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          if (ok(r.mr)) P.mr = String(Math.round(r.mr));  // sem separador de milhar (num leria "4.894" como 4,894)
          P.mrRegistro = (i.registro || "ensaio salvo");
        } },
      { k: "mrRegistro", r: "Ensaio de módulo de resiliência de origem" },
      { k: "mr", r: "Módulo de resiliência médio da amostra (MPa)", ph: "ex.: 11580",
        dica: "na ausência do deslocamento inicial medido, εi = σt/MR médio (7.3)" },
      { k: "mu", r: "Coeficiente de Poisson (eq. 6)", ph: "0,30", dica: "em geral adota-se 0,3 (7.3)" },
      { k: "unidade", r: "Unidade das dimensões", tipo: "select", opcoes: [["mm", "mm"], ["cm", "cm"]] },
      { k: "carga", r: "Unidade da carga aplicada", tipo: "select", recarrega: true, opcoes: [["N", "N"], ["kgf", "kgf"], ["kN", "kN"]] },
      { k: "vvProjeto", r: "Volume de vazios de projeto (%) — opcional", ph: "ex.: 4,0", dica: "CPs selecionados com vazios a ± 0,5 % do projeto (5.4)" },
      { k: "temperatura", r: "Temperatura do ensaio (°C)", ph: "25", dica: "padrão 25 °C (5.5); outras temperaturas para avaliações especiais (nota da alínea j)" },
      { k: "modelo", r: "Modelo em destaque (7.2)", tipo: "select",
        opcoes: MODELOS.map(function (m) { return [m.k, m.rot + " (" + m.eq + ")"]; }), dica: "os quatro modelos são sempre calculados" },
    ],
    padrao: { moldagem: "giratorio", mu: "0,30", unidade: "mm", carga: "N", temperatura: "25", modelo: "3" },
    tabelas: function (d) {
      var P = d.params || {}, u = P.unidade === "cm" ? "cm" : "mm", uf = P.carga || "N";
      return [{ chave: "cp", titulo: "Corpos de prova", rotulo: "CP", iniciais: 12, min: 1, usar: true,
        dica: "uma coluna por CP (três por nível de tensão); desmarque \"usar\" para tirar um CP da regressão",
        linhas: [
          { k: "id", r: "Identificação do CP", texto: true },
          { k: "t", r: "Espessura (altura) t (5.2: 40 a 70 mm)", u: u },
          { k: "d", r: "Diâmetro d (5.2: 100 mm)", u: u },
          { k: "vv", r: "Volume de vazios", u: "%" },
          { k: "nivel", r: "Nível de tensão pretendido (% da RT)", u: "%" },
          { k: "f", r: "Carga aplicada F — opcional", u: uf, ph: "de σt" },
          { k: "delta", r: "Deslocamento resiliente inicial Δ — opcional (7.1)", u: "mm" },
          { k: "mrcp", r: "MR do CP — opcional (se já calculado)", u: "MPa" },
          { k: "n", r: "Número de ciclos até a ruptura — N", u: "ciclos" },
          { calc: "F", r: "Carga aplicada F", u: "N", casas: 0 },
          { calc: "st", r: "σt = 2F/(π·t·d) (eq. 7)", u: "MPa", casas: 3 },
          { calc: "rel", r: "σt/σr", u: "%", casas: 1 },
          { calc: "ds", r: "Δσ = 4σt (eq. 10)", u: "MPa", casas: 3 },
          { calc: "mrU", r: "MR usado — eq. 6, do CP ou médio", u: "MPa", casas: 0 },
          { calc: "ei", r: "εi = σt/MR (eq. 5) × 10⁶", u: "µε", casas: 1 },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fd = P.unidade === "cm" ? 10 : 1;
      var fc = P.carga === "kgf" ? G : P.carga === "kN" ? 1000 : 1;
      var rt = num(P.rt), mrMed = num(P.mr), mu = ok(num(P.mu)) ? num(P.mu) : 0.3, vvP = num(P.vvProjeto);
      var dims = [], vvF = [], nivF = [], semMR = [], semSig = [];
      var cps = (d.cp || []).map(function (x, i) {
        var rot = "CP " + (x.id || i + 1), o = {};
        var t = num(x.t) * fd, dd = num(x.d) * fd, niv = num(x.nivel), F = num(x.f) * fc, N = num(x.n), vv = num(x.vv);
        o.usar = x.usar !== false;
        if (ok(t) && (t < 40 || t > 70)) dims.push(rot + ": t = " + fmt(t, 1) + " mm");
        if (ok(dd) && Math.abs(dd - 100) > 5) dims.push(rot + ": d = " + fmt(dd, 1) + " mm");
        if (ok(vv) && ok(vvP) && Math.abs(vv - vvP) > 0.5 + 1e-9) vvF.push(rot + " (" + fmt(vv, 1) + " %)");
        if (ok(F) && ok(t) && ok(dd)) o.st = 2 * F / (Math.PI * t * dd);
        else if (ok(niv) && ok(rt)) { o.st = niv / 100 * rt; if (ok(t) && ok(dd)) F = o.st * Math.PI * t * dd / 2; }
        else o.st = NaN;
        o.F = F;
        o.rel = ok(o.st) && ok(rt) && rt > 0 ? o.st / rt * 100 : NaN;
        o.ds = 4 * o.st;
        var delta = num(x.delta), mrcp = num(x.mrcp);
        o.mrU = ok(delta) && delta > 0 && ok(F) && ok(t) ? F / (delta * t) * (0.9976 * mu + 0.2692) : ok(mrcp) ? mrcp : mrMed;
        o.fonteMR = ok(delta) && delta > 0 ? "Δ" : ok(mrcp) ? "cp" : "medio";
        o.ei = ok(o.st) && ok(o.mrU) && o.mrU > 0 ? o.st / o.mrU : NaN;
        o.eiU = o.ei * 1e6;  // exibição
        o.N = N; o.nivel = ok(niv) ? niv : o.rel;
        if (ok(o.rel) && (o.rel < 5 - 0.05 || o.rel > 40 + 0.05)) nivF.push(rot + " (" + fmt(o.rel, 1) + " %)");
        if (!ok(o.mrU) && ok(o.st)) semMR.push(rot);
        if (!ok(o.st) && ok(N)) semSig.push(rot);
        return o;
      });
      var usados = cps.filter(function (o) { return o.usar && ok(o.N) && o.N > 0 && ok(o.st); });
      if (!ok(rt)) avisos.push("Informe a resistência à tração média (RT) — ou importe um ensaio da DNIT 136 (6 a).");
      if (dims.length) avisos.push("Dimensões fora do especificado (5.2: espessura de 40 a 70 mm, diâmetro de 100 mm): " + dims.join("; ") + ".");
      if (vvF.length) avisos.push("Volume de vazios a mais de ± 0,5 % do projeto (5.4): " + vvF.join("; ") + ".");
      if (nivF.length) avisos.push("Tensão fora da faixa de 5 % a 40 % da RT (6 b, f): " + nivF.join("; ") + ".");
      if (semSig.length) avisos.push("Sem tensão: informe a carga aplicada ou o nível de tensão e a RT — " + semSig.join(", ") + ".");
      if (semMR.length) avisos.push("Sem módulo de resiliência (Δ, MR do CP ou MR médio) — εi não calculado: " + semMR.join(", ") + ".");
      // níveis de tensão (agrupados pelo nível pretendido, ou pela razão σt/σr arredondada)
      var niveis = {};
      usados.forEach(function (o) { var k = fmt(o.nivel, 1); niveis[k] = (niveis[k] || 0) + 1; });
      var nNiv = Object.keys(niveis).length, poucos = Object.keys(niveis).filter(function (k) { return niveis[k] < 3; });
      if (usados.length < 12 || nNiv < 4) avisos.push("O resultado deve basear-se em pelo menos 12 CPs e 4 níveis de tensão (8); há " + usados.length + " CP(s) em " + nNiv + " nível(is).");
      if (poucos.length) avisos.push("Devem ser ensaiados três CPs por nível de tensão (6 f): nível(is) " + poucos.map(function (k) { return k + " % (" + niveis[k] + ")"; }).join(", ") + ".");
      var Ns = usados.map(function (o) { return o.N; });
      var mods = MODELOS.map(function (m) {
        var xs = usados.map(function (o) { return m.var === "rel" ? o.st / rt : o[m.var]; });
        var g = regLog(xs, Ns);
        var r = { k: m.k, rot: m.rot, eq: m.eq, x: m.x };
        if (g) { r.kc = Math.pow(10, g.a); r.n = m.var === "rel" ? g.b : -g.b; r.r2 = g.r2; r.np = g.n; }
        return r;
      });
      var sel = mods.filter(function (m) { return m.k === (P.modelo || "3"); })[0];
      mods.forEach(function (m) {
        if (ok(m.r2) && m.r2 < 0.8) avisos.push("Modelo " + m.rot + ": R² = " + fmt(m.r2, 3) + " < 0,8 — aumente o número de CPs ensaiados para melhorar o ajuste (7.2).");
      });
      var t = num(P.temperatura);
      if (ok(t) && t !== 25) avisos.push("Ensaio a " + fmt(t, 1) + " °C: o ensaio padrão é a 25 °C (5.5); outras temperaturas só para avaliações especiais.");
      var mrPorDelta = cps.filter(function (o) { return o.fonteMR === "Δ" && ok(o.mrU); }).length;
      return { tab: { cp: cps.map(function (o) { return Object.assign({}, o, { ei: o.eiU }); }) },
        resultados: { modelos: mods, sel: sel ? sel.k : "3", n: usados.length, niveis: nNiv, rt: rt, mr: mrMed, mrPorDelta: mrPorDelta,
          pontos: usados.map(function (o) { return { st: o.st, ds: o.ds, ei: o.ei, N: o.N }; }) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, sel = r.modelos.filter(function (m) { return m.k === r.sel; })[0] || {};
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(sel.kc) ? "k = " + fmtK(sel.kc) + " · n = " + fmt(sel.n, 3) : "—") +
        '</div><div class="fe-res-r">' + esc(sel.rot || "") + " (" + esc(sel.eq || "") + ")</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(sel.r2) ? "R² = " + fmt(sel.r2, 3) : "—") + '</div><div class="fe-res-r">' + r.n + " CPs, " + r.niveis + " níveis · R² mínimo 0,8" +
        (ok(sel.r2) ? (sel.r2 >= 0.8 ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') : "") + "</div></div></div>";
      h += '<table class="fe-resumo fe-gran"><thead><tr><th>Modelo (7.2)</th><th>k</th><th>n</th><th>R²</th></tr></thead><tbody>' +
        r.modelos.map(function (m) {
          return "<tr><td>" + esc(m.rot + " — " + m.eq) + "</td><td>" + fmtK(m.kc) + "</td><td>" + fmt(m.n, 3) + "</td><td>" + fmt(m.r2, 4) + "</td></tr>";
        }).join("") + "</tbody></table>";
      return h;
    },
    graficos: function (calc, d, opt) {
      var r = calc.resultados, pts = r.pontos;
      function g(chave, xl, fx) {
        var m = r.modelos.filter(function (x) { return x.var === chave || (chave === "ds" && x.k === "3") || (chave === "ei" && x.k === "2"); })[0];
        var xs = pts.map(function (p) { return p[chave]; }).filter(function (v) { return ok(v) && v > 0; });
        var series = [{ pts: pts.map(function (p) { return [p[chave] * fx, p.N]; }), cor: CORES[0], rot: "CPs ensaiados" }];
        if (m && ok(m.kc) && xs.length > 1) {
          var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), L = [];
          for (var i = 0; i <= 20; i++) { var x = a * Math.pow(b / a, i / 20); L.push([x * fx, m.kc * Math.pow(1 / x, m.n)]); }
          series.push({ pts: L, cor: CORES[1], linha: true, marca: false, rot: "N = " + fmtK(m.kc) + " · (1/" + (chave === "ds" ? "Δσ" : "εi") + ")^" + fmt(m.n, 3) + " · R² = " + fmt(m.r2, 4) });
        }
        return grafXY({ opt: opt, logX: true, logY: true, xl: xl, yl: "Número de aplicações, N", series: series, leg: "dir",
          vazio: "A curva de fadiga aparece com σt e N de pelo menos dois CPs." });
      }
      return [g("ds", "Diferença de tensões, Δσ (MPa)", 1), g("ei", "Deformação específica resiliente inicial, εi", 1)];
    },
    relatorio: {
      parametros: [["Carregamento", "Tensão controlada, pulso de 0,1 s + repouso de 0,9 s (1 Hz); critério de ruptura: ruptura completa do CP (3.3)"]],
      notas: "σt = 2F/(π·t·d) (eq. 7); σc = −6F/(π·t·d) (eq. 8); Δσ = σc − σt = 4σt em módulo (eq. 10); εi = σt/MR (eq. 5), com MR = F·(0,9976μ + 0,2692)/(Δ·t) (eq. 6) quando o deslocamento resiliente inicial Δ é medido (preferível) ou o MR médio da amostra na falta dessa medida (7.3). Sem a carga, σt = nível × RT. Modelos (7.2): N = k₁(1/σt)^n₁, N = k₂(1/εi)^n₂, N = k₃(1/Δσ)^n₃ e N = k₄(σt/σr)^n₄, ajustados por mínimos quadrados de log N sobre log x (linha de tendência de potência); R² no espaço log-log. Mínimo de 12 CPs e 4 níveis (8); R² < 0,8 exige mais CPs (7.2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        r.modelos.forEach(function (m) {
          rows.push([m.rot + " (" + m.eq + ")", ok(m.kc) ? "k = " + fmtK(m.kc) + "; n = " + fmt(m.n, 3) + "; R² = " + fmt(m.r2, 4) : "—"]);
        });
        rows.push(["Corpos de prova / níveis de tensão na regressão", r.n + " / " + r.niveis]);
        if (ok(r.rt)) rows.push(["Resistência à tração (σr)", fmt(r.rt, 2) + " MPa" + (P.rtRegistro ? " — " + P.rtRegistro : "")]);
        if (ok(r.mr)) rows.push(["Módulo de resiliência médio", fmt(r.mr, 0) + " MPa" + (P.mrRegistro ? " — " + P.mrRegistro : "")]);
        rows.push(["Condições", (P.temperatura || "25") + " °C; 1 Hz"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Concreto asfáltico — 15 CPs em 5 níveis (exemplo do Anexo F da norma)", dados: function () {
        // Anexo F (informativo) da DNIT 183/2018-ME: RT = 1,70 MPa, MR médio = 11.580 MPa, Vv = 4,00 %, 25 °C, 1 Hz,
        // espessura e diâmetro em cm, carga aplicada em kgf, N até a ruptura
        var L = [["11925", "6,25", "10,01", "7,5", "127,8", "412320"], ["11926", "6,25", "10,00", "7,5", "127,7", "312055"],
          ["11927", "6,42", "10,00", "7,5", "131,1", "425363"], ["11928", "6,25", "10,00", "15", "255,4", "85650"],
          ["11929", "6,35", "10,00", "15", "259,4", "74610"], ["11930", "6,30", "10,00", "15", "257,4", "80930"],
          ["11931", "6,26", "10,00", "20", "341,0", "25550"], ["11932", "6,39", "10,00", "20", "348,1", "23640"],
          ["11933", "6,31", "10,00", "20", "343,7", "22950"], ["11934", "6,33", "10,00", "30", "517,2", "5110"],
          ["11935", "6,30", "10,01", "30", "515,3", "3915"], ["11936", "6,19", "10,00", "30", "505,8", "4945"],
          ["11937", "6,24", "10,00", "40", "679,9", "1471"], ["11938", "6,23", "10,00", "40", "678,8", "1298"],
          ["11939", "6,33", "10,01", "40", "690,3", "1375"]];
        return { ident: { registro: "EX-FAD-001", camada: "Concreto asfáltico (exemplo da norma)", data: "2017-05-15" },
          params: { mistura: "Concreto asfáltico — Vv 4,0 %", moldagem: "giratorio", rt: "1,70", rtRegistro: "Anexo F", mr: "11580", mu: "0,30",
            unidade: "cm", carga: "kgf", vvProjeto: "4,0", temperatura: "25", modelo: "3" },
          cp: L.map(function (x) { return { usar: true, id: x[0], t: x[1], d: x[2], vv: "4,0", nivel: x[3], f: x[4], n: x[5] }; }) };
      } },
      { nome: "CBUQ com asfalto modificado — 9 CPs, deslocamento inicial medido (poucos CPs, R² baixo)", dados: function () {
        // valores-alvo: RT = 1,25 MPa; níveis 10/20/30 %; N ≈ 2.000·(1/σt)^3 com dispersão grande; MR do CP pela eq. 6
        // (Δ = F·(0,9976·0,3 + 0,2692)/(MR·t), MR ≈ 6.000 MPa); um CP com vazios fora de ± 0,5 %
        var L = [["F1", 63.2, 10, 61000, 6100, "4,1"], ["F2", 62.8, 10, 390000, 5900, "3,9"], ["F3", 63.5, 10, 98000, 6000, "4,2"],
          ["F4", 63.0, 20, 9800, 6050, "4,0"], ["F5", 62.6, 20, 52000, 5950, "4,6"], ["F6", 63.4, 20, 15600, 6000, "3,8"],
          ["F7", 63.1, 30, 7400, 5900, "4,1"], ["F8", 62.9, 30, 2100, 6100, "4,0"], ["F9", 63.3, 30, 11500, 6000, "3,9"]];
        return { ident: { registro: "EX-FAD-002", obra: "Obra A", camada: "Capa — CBUQ AMP 60/85", origem: "Usina A" },
          params: { mistura: "CBUQ faixa C, AMP 60/85", moldagem: "giratorio", rt: "1,25", rtRegistro: "EX-RT (valor informado)", mr: "", mu: "0,30",
            unidade: "mm", carga: "N", vvProjeto: "4,0", temperatura: "25", modelo: "1" },
          cp: L.map(function (x) {
            var F = x[2] / 100 * 1.25 * Math.PI * x[1] * 100.2 / 2, delta = F * (0.9976 * 0.3 + 0.2692) / (x[4] * x[1]);
            return { usar: true, id: x[0], t: fmt(x[1], 1), d: "100,2", vv: x[5], nivel: String(x[2]), f: String(Math.round(F)), delta: fmt(delta, 5), n: String(x[3]) };
          }) };
      } },
    ],
  };
})();
