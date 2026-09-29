/*
 * Ficha: DNER-IE 004/94 — Solos coesivos — Compressão simples de amostras indeformadas.
 * Corpo de prova cilíndrico na umidade natural; ensaio de deformação controlada (6.1) ou de carga controlada (6.2).
 * ε = ΔH / H₀ (7.2); A = A₀ / (1 − ε) (7.3); p = P / A (7.4); R = p máx. ou p a 20 % (8.1 e 8.2); c = R / 2 (8.3).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G = 9.80665;  // m/s²: g e kgf → N

  var UN_DEF = { mm: ["mm", 1], pol3: ["pol × 10⁻³", 0.0254], cmm: ["0,01 mm", 0.01] };
  var UN_CARGA = { g: ["g", G / 1000], kgf: ["kgf", G], N: ["N", 1] };
  function unDef(P) { return UN_DEF[P.defUn] || UN_DEF.mm; }
  function unCarga(P) { return UN_CARGA[P.cargaUn] || UN_CARGA.N; }

  // carga (N) a partir da leitura do anel ou da carga lida
  function cargaN(P, v) {
    if (!ok(v)) return NaN;
    var f = unCarga(P)[1];
    if (P.cargaModo === "direta") return v * f;
    if (P.cargaModo === "k") { var K = num(P.aferK); return ok(K) ? K * v * f : NaN; }
    var tab = FE.curvaSpeedy(P.aferTabela);   // "leitura = carga; ..." (mesmo formato do Speedy)
    if (tab.length < 1) return NaN;
    if (!(tab[0][0] === 0)) tab = [[0, 0]].concat(tab);
    return FE.interpolar(tab, v) * f;
  }
  function geometria(P) {
    var D = num(P.diametro), H = num(P.altura), M = num(P.massa);
    var A0 = ok(D) && D > 0 ? Math.PI * D * D / 4 : NaN;        // cm²
    var V = ok(A0) && ok(H) ? A0 * H : NaN;                     // cm³
    return { D: D, H: H, M: M, A0: A0, V: V, gh: ok(M) && ok(V) && V > 0 ? M / V : NaN };
  }

  // interpolação linear de y em x numa lista ordenada por x
  function naAbscissa(pts, x) {
    for (var i = 1; i < pts.length; i++) {
      if (x >= pts[i - 1].x && x <= pts[i].x && pts[i].x !== pts[i - 1].x) {
        return pts[i - 1].y + (pts[i].y - pts[i - 1].y) * (x - pts[i - 1].x) / (pts[i].x - pts[i - 1].x);
      }
    }
    return NaN;
  }

  FE.FICHAS["dner-ie-004-94"] = {
    titulo: "Solos coesivos — Compressão simples de amostras indeformadas",
    rotuloImportar: function (r) { return "R " + (ok(r.R) ? fmt(r.R, 1) + " kPa" : "—") + " · c " + (ok(r.c) ? fmt(r.c, 1) + " kPa" : "—"); },
    resumo: "Resistência à compressão não confinada na umidade natural: deformação específica, área corrigida, pressão, curva pressão × deformação, R = p máx. (ou p a 20 %) e coesão c = R / 2.",
    blocos: ["umidade"],
    params: [
      { k: "modo", r: "Tipo de ensaio (seção 6)", tipo: "select", opcoes: [["deformacao", "Deformação controlada (6.1)"], ["carga", "Carga controlada (6.2)"]] },
      { k: "amostra", r: "Origem do corpo de prova (5.2)", tipo: "select",
        opcoes: [["shelby", "Tubo de parede fina (shelby) — desbastado (5.4)"], ["shelbyDireto", "Tubo shelby — ensaio direto na amostra extraída (5.5)"], ["bloco", "Bloco indeformado (5.6)"]] },
      { k: "profundidade", r: "Sondagem / profundidade", ph: "ex.: SP-4, 7,00 a 7,50 m" },
      { k: "descricao", r: "Descrição da amostra", ph: "ex.: argila orgânica mole, cinza-escura" },
      { k: "diametro", r: "Diâmetro do corpo de prova (cm) — 5.7", dica: "usualmente entre 3 cm e 7 cm (5.3)" },
      { k: "altura", r: "Altura do corpo de prova H₀ (cm) — 5.7", dica: "duas a três vezes o diâmetro (5.3)" },
      { k: "massa", r: "Massa do corpo de prova (g) — 5.8" },
      { k: "defUn", r: "Unidade do defletômetro de deformação", tipo: "select", recarrega: true,
        opcoes: [["mm", "mm"], ["pol3", "pol × 10⁻³ (0,0254 mm)"], ["cmm", "0,01 mm"]] },
      { k: "cargaModo", r: "Medida da carga (6 — nota; 7.4 — nota)", tipo: "select", recarrega: true,
        opcoes: [["tabela", "Anel dinamométrico — tabela de calibração"], ["k", "Anel dinamométrico — constante K"], ["direta", "Carga lida diretamente"]] },
      { k: "cargaUn", r: "Unidade da carga", tipo: "select", recarrega: true, opcoes: [["N", "N"], ["kgf", "kgf"], ["g", "g (gf)"]],
        dica: "da tabela / constante de calibração ou da leitura direta" },
      { k: "aferTabela", r: "Tabela de calibração do anel (leitura = carga)", ph: "1=150; 2=300; 3=450; 10=1500",
        dica: "pares separados por ponto e vírgula; interpolação linear (Tabela anexa)", se: function (d) { return ((d.params || {}).cargaModo || "tabela") === "tabela"; } },
      { k: "aferK", r: "Constante do anel K (carga por divisão)", se: function (d) { return (d.params || {}).cargaModo === "k"; } },
      { k: "angulo", r: "Ângulo da superfície de ruptura (°) — 6.1.2 / 6.2.2", dica: "croqui na folha de ensaio; em branco se não houver superfície definida" },
    ],
    padrao: { modo: "deformacao", amostra: "shelby", defUn: "mm", cargaModo: "tabela", cargaUn: "N" },
    tabelas: function (d) {
      var P = d.params || {}, ud = unDef(P)[0], uc = unCarga(P)[0];
      var anel = (P.cargaModo || "tabela") !== "direta";
      return [
        { chave: "umid", titulo: "Determinação da umidade", rotulo: "Cápsula", iniciais: 3, min: 1,
          dica: "três amostras das aparas (5.9) ou o corpo de prova inteiro após o ensaio (6.1.3 / 6.2.3); secagem a 105 °C – 110 °C",
          linhas: FE.BLOCOS.umidade.linhas("u", "", "lab") },
        { chave: "leit", titulo: "Leituras — carga e deformação (6.1.1 / 6.2.1)", rotulo: "Leitura", iniciais: 12, min: 3,
          dica: "uma coluna por leitura, de 30 em 30 s (mais leituras no início, se necessário); prossiga até passar o máximo da curva ou até ε = 20 %",
          linhas: [
            { k: "t", r: "Tempo de ensaio", u: "min" },
            { k: "ld", r: "Leitura do defletômetro — deformação vertical", u: ud },
            { k: "lc", r: anel ? "Leitura do defletômetro do anel" : "Carga lida", u: anel ? "div." : uc },
            { calc: "dH", r: "Decréscimo de altura ΔH", u: "mm", casas: 3 },
            { calc: "eps", r: "Deformação específica ε = ΔH / H₀ (7.2)", u: "—", casas: 5 },
            { calc: "epsP", r: "Deformação específica", u: "%", casas: 2 },
            { calc: "um", r: "1 − ε", u: "—", casas: 5 },
            { calc: "A", r: "Área corrigida A = A₀ / (1 − ε) (7.3)", u: "cm²", casas: 2 },
            { calc: "P", r: "Carga aplicada P", u: "N", casas: 2 },
            { calc: "p", r: "Pressão p = P / A (7.4)", u: "kPa", casas: 2, destaque: true },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], gm = geometria(P), fd = unDef(P)[1];
      // umidade (7.1 = DNIT 456, eq. 1)
      var umid = (d.umid || []).map(function (p) { return { uW: FE.BLOCOS.umidade.calcular(p, "u", "lab").w }; });
      var h = media(umid.map(function (o) { return o.uW; }));
      var hs = umid.map(function (o) { return o.uW; }).filter(ok);
      if (hs.length >= 2) {
        var dh = Math.max.apply(null, hs) - Math.min.apply(null, hs);
        if (dh > 0.05 * h && dh > 1) avisos.push("As determinações de umidade diferem " + fmt(dh, 2) + " pontos percentuais entre si — confira as pesagens.");
      }
      // leituras
      var semCal = false;
      var leit = (d.leit || []).map(function (p) {
        var ld = num(p.ld), lc = num(p.lc), o = { t: num(p.t) };
        if (!ok(ld) || !ok(gm.H)) return o;
        o.dH = ld * fd;
        o.eps = o.dH / (gm.H * 10);                    // H₀ em cm → mm
        o.epsP = o.eps * 100;
        o.um = 1 - o.eps;
        o.A = ok(gm.A0) && o.um > 0 ? gm.A0 / o.um : NaN;
        o.P = cargaN(P, lc);
        if (ok(lc) && !ok(o.P)) semCal = true;
        o.p = ok(o.P) && ok(o.A) ? o.P / (o.A * 1e-4) / 1000 : NaN;   // N / m² → kPa
        return o;
      });
      if (semCal) avisos.push(P.cargaModo === "k" ? "Informe a constante K do anel dinamométrico." :
        "Leitura do anel fora da tabela de calibração (ou tabela vazia): a carga não pôde ser interpolada.");
      if (!ok(gm.D) || !ok(gm.H)) avisos.push("Informe o diâmetro e a altura do corpo de prova (5.7).");
      // verificações da amostra (5.3)
      if (ok(gm.D) && ok(gm.H)) {
        var rel = gm.H / gm.D;
        if (rel < 2 - 1e-9 || rel > 3 + 1e-9) avisos.push("Altura / diâmetro = " + fmt(rel, 2) + ": a altura deve ser de duas a três vezes o diâmetro (5.3).");
        if (gm.D < 3 || gm.D > 7) avisos.push("Diâmetro de " + fmt(gm.D, 1) + " cm, fora do intervalo usual de 3 cm a 7 cm (5.3).");
      }
      // curva pressão × deformação (8.1)
      var pts = leit.map(function (o, i) { return { x: o.epsP, y: o.p, i: i, t: o.t }; }).filter(function (q) { return ok(q.x) && ok(q.y); })
        .sort(function (a, b) { return a.x - b.x; });
      var res = { h: h, A0: gm.A0, V: gm.V, gh: gm.gh, gs: ok(gm.gh) && ok(h) ? gm.gh / (1 + h / 100) : NaN, R: NaN, c: NaN, criterio: "", epsR: NaN };
      if (pts.length) {
        var iMax = 0;
        pts.forEach(function (q, j) { if (q.y > pts[iMax].y) iMax = j; });
        var pico = pts[iMax], ult = pts[pts.length - 1];
        var passou = iMax < pts.length - 1 && ult.y < pico.y;   // o máximo foi ultrapassado
        if (passou && pico.x <= 20 + 1e-9) {
          res.R = pico.y; res.epsR = pico.x; res.criterio = "ordenada máxima da curva (8.1)";
        } else if (ult.x >= 20 - 1e-9) {
          res.R = naAbscissa(pts, 20); res.epsR = 20;
          if (!ok(res.R)) res.R = ult.y;
          res.criterio = "pressão a 20 % de deformação — ruptura plástica (8.2)";
        } else {
          res.R = pico.y; res.epsR = pico.x; res.criterio = "máximo das leituras (provisório)";
          avisos.push("O ensaio não ultrapassou o ponto máximo da curva nem atingiu 20 % de deformação: prossiga até definir a ruptura ou até ε = 20 % (6.1.1 / 6.2.1).");
        }
        res.c = res.R / 2;   // 8.3
        // velocidade de deformação e duração (6.1.1)
        var tFim = ult.t;
        if (P.modo !== "carga" && ok(tFim) && tFim > 0) {
          var vel = ult.x / tFim;
          res.vel = vel; res.tempo = tFim;
          if (vel < 0.5 - 1e-9 || vel > 2 + 1e-9) avisos.push("Velocidade média de deformação de " + fmt(vel, 2) + " %/min, fora do intervalo de 0,5 % a 2 % por minuto (6.1.1).");
          if (tFim > 10 + 1e-9) avisos.push("Duração do ensaio de " + fmt(tFim, 1) + " min: o tempo de ensaio não deve ultrapassar 10 minutos (6.1.1).");
        }
        if (P.modo === "carga") {
          var ts = leit.map(function (o) { return o.t; }).filter(ok);
          for (var j = 1; j < ts.length; j++) if (Math.abs(ts[j] - ts[j - 1] - 0.5) > 0.01) { avisos.push("Carga controlada: os acréscimos de carga e as leituras são de 30 em 30 segundos (6.2.1)."); break; }
        }
      }
      if (P.amostra === "shelbyDireto") avisos.push("Ensaio direto na amostra extraída do shelby: só se ela estiver em boas condições de indeformabilidade e com o diâmetro requerido (5.5).");
      return { tab: { umid: umid, leit: leit }, pts: pts, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, u, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + " <small>" + u + '</small></div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' +
        cx(fmt(r.R, 1), "kPa", "Resistência à compressão R — " + esc(r.criterio || "—") + (ok(r.R) ? " (" + fmt(r.R / 98.0665, 3) + " kgf/cm²)" : "")) +
        cx(fmt(r.c, 1), "kPa", "Coesão c = R / 2 (8.3)") +
        cx(fmt(r.epsR, 2), "%", "Deformação específica na ruptura") +
        cx(fmt(r.h, 2), "%", "Umidade natural (7.1)") +
        cx(fmt(r.gh, 3), "g/cm³", "Massa específica aparente úmida" + (ok(r.gs) ? " · seca " + fmt(r.gs, 3) : "")) + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var W = opt.w || 560, H = opt.h || 320, m = { l: 58, r: 16, t: 14, b: 42 };
      var pts = calc.pts, r = calc.resultados;
      if (pts.length < 2) return ['<div class="fe-graf-vazio">O gráfico pressão × deformação aparece com as leituras de deformação e de carga.</div>'];
      var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", c: "#1f5fbf", d: "#c0392b" } : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", c: "#4f8cff", d: "#ff7a59" };
      var xMax = Math.max(Math.max.apply(null, pts.map(function (q) { return q.x; })), ok(r.epsR) ? r.epsR : 0);
      var x1 = xMax > 12 ? Math.ceil(xMax / 5) * 5 : Math.ceil(xMax + 0.5);
      var yMax = Math.max.apply(null, pts.map(function (q) { return q.y; })), py = yMax > 200 ? 50 : yMax > 80 ? 20 : yMax > 30 ? 10 : 5;
      var y1 = Math.ceil(yMax * 1.1 / py) * py, px = x1 > 12 ? 2 : 1;
      function X(v) { return m.l + v / x1 * (W - m.l - m.r); }
      function Y(v) { return H - m.b - v / y1 * (H - m.t - m.b); }
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
      for (var gx = 0; gx <= x1 + 1e-9; gx += px) s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/><text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
      for (var gy = 0; gy <= y1 + 1e-9; gy += py) s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/><text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + gy + "</text>";
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
      s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Deformação específica ε (%)</text>';
      s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">Pressão p (kPa)</text>';
      if (x1 >= 20) s += '<line x1="' + X(20) + '" y1="' + m.t + '" x2="' + X(20) + '" y2="' + (H - m.b) + '" stroke="' + cor.d + '" stroke-dasharray="4 3"/><text x="' + (X(20) - 4) + '" y="' + (m.t + 12) + '" text-anchor="end" fill="' + cor.d + '">ε = 20 %</text>';
      s += '<path d="M' + X(0) + " " + Y(0) + " " + pts.map(function (q) { return "L" + X(q.x).toFixed(1) + " " + Y(q.y).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor.c + '" stroke-width="2"/>';
      pts.forEach(function (q) { s += '<circle cx="' + X(q.x).toFixed(1) + '" cy="' + Y(q.y).toFixed(1) + '" r="3.2" fill="' + cor.c + '"/>'; });
      if (ok(r.R) && ok(r.epsR)) {
        s += '<line x1="' + m.l + '" y1="' + Y(r.R) + '" x2="' + X(r.epsR) + '" y2="' + Y(r.R) + '" stroke="' + cor.d + '" stroke-dasharray="3 3"/>' +
          '<circle cx="' + X(r.epsR) + '" cy="' + Y(r.R) + '" r="5.5" fill="none" stroke="' + cor.d + '" stroke-width="2"/>' +
          '<text x="' + Math.min(X(r.epsR) + 8, W - m.r - 150) + '" y="' + (Y(r.R) - 8) + '" fill="' + cor.d + '" font-weight="bold">R = ' + fmt(r.R, 1) + " kPa · c = " + fmt(r.c, 1) + " kPa</text>";
      }
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "ε = ΔH / H₀ (7.2); A = A₀ / (1 − ε), área corrigida supondo volume constante (7.3); p = P / A (7.4), com a carga do anel pela tabela ou constante de calibração (interpolação linear). R = ordenada máxima da curva pressão × deformação (8.1) ou, na ruptura plástica, a pressão a ε = 20 % (8.2); coesão c = R / 2 (8.3). Umidade h = (Ph − Ps) / Ps × 100 (7.1). Pressões em kPa (1 kgf/cm² = 98,0665 kPa; 1 g/cm² = 0,0981 kPa).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [];
        if (P.descricao) rows.push(["Descrição da amostra", P.descricao]);
        rows.push(["Área / volume do corpo de prova", fmt(r.A0, 2) + " cm² / " + fmt(r.V, 1) + " cm³"],
          ["Umidade natural (média)", fmt(r.h, 2) + " %"],
          ["Massa específica aparente úmida / seca", fmt(r.gh, 3) + " / " + fmt(r.gs, 3) + " g/cm³"],
          ["Resistência à compressão simples R", fmt(r.R, 1) + " kPa (" + fmt(r.R / 98.0665, 3) + " kgf/cm²) — " + (r.criterio || "—")],
          ["Deformação específica na ruptura", fmt(r.epsR, 2) + " %"],
          ["Coesão (resistência ao cisalhamento) c = R / 2", fmt(r.c, 1) + " kPa"]);
        if (ok(r.vel)) rows.push(["Velocidade média de deformação / duração", fmt(r.vel, 2) + " %/min / " + fmt(r.tempo, 1) + " min"]);
        if (P.angulo) rows.push(["Ângulo da superfície de ruptura", P.angulo + "°"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Argila orgânica mole — folha de ensaio da Figura 4 da norma (deformação controlada)", dados: function () {
        // Figura 4 da DNER-IE 004/94: CP Ø 5 cm × 10 cm, 278 g; defletômetro em pol × 10⁻³; anel pela Tabela anexa (g)
        var tab = [[1, 150], [2, 300], [3, 450], [4, 600], [5, 750], [6, 900], [7, 1050], [8, 1200], [9, 1350], [10, 1500], [11, 1650], [12, 1800],
          [13, 1900], [14, 2050], [15, 2200], [16, 2350], [17, 2500], [18, 2650], [19, 2800], [20, 2950], [21, 3100], [22, 3250], [23, 3400], [24, 3550],
          [25, 3700], [26, 3850], [27, 4000], [28, 4150], [29, 4300], [30, 4450], [31, 4600], [32, 4700], [33, 4850], [34, 5000]];
        var t = ["0,5", "1", "1,5", "2", "2,5", "3", "3,5", "4", "4,5", "5"], ld = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200], lc = [3, 6, 9, 13, 15, 17, 18, 19, 19, 19];
        return { ident: { registro: "EX-CS-001", obra: "Obra A", local: "Sondagem 4, amostra 14", camada: "Argila mole de fundação de aterro" },
          params: { modo: "deformacao", amostra: "shelby", profundidade: "SP-4, 7,00 a 7,50 m", descricao: "Argila com detritos orgânicos, mole, cinza-escura",
            diametro: "5", altura: "10", massa: "278", defUn: "pol3", cargaModo: "tabela", cargaUn: "g", angulo: "50",
            aferTabela: tab.map(function (x) { return x[0] + "=" + x[1]; }).join("; ") },
          umid: [{ un: "40", ut: "41,08", uu: "75,40", us: "57,60" }, { un: "5", ut: "38,92", uu: "105,80", us: "71,38" }, { un: "39", ut: "38,23", uu: "109,05", us: "72,40" }],
          leit: t.map(function (x, i) { return { t: x, ld: String(ld[i]), lc: String(lc[i]) }; }),
          obs: "Dados da Figura 4 da norma (folha de ensaio de compressão simples). A figura exprime as pressões em g/cm²: R = 136,78 g/cm² ≈ 13,4 kPa." };
      } },
      { nome: "Argila siltosa rija — ruptura plástica (R a 20 %), CP curto e ensaio longo (gerado)", dados: function () {
        // CP Ø 3,6 cm × 6,5 cm (H/D = 1,8); anel de K = 0,25 N/div; p(ε) cresce sem pico e o ensaio dura 14 min
        var D = 3.6, Hc = 6.5, A0 = Math.PI * D * D / 4, K = 0.25, leit = [];
        for (var i = 1; i <= 14; i++) {
          var eps = 0.0145 * i, p = 118 * (1 - Math.exp(-eps / 0.035)) + 60 * eps;          // kPa
          var Pn = p * 1000 * (A0 / (1 - eps)) * 1e-4;                                         // N
          leit.push({ t: String(i), ld: fmt(eps * Hc * 10, 2), lc: String(Math.round(Pn / K)) });
        }
        return { ident: { registro: "EX-CS-002", obra: "Obra B", local: "Furo SP-2, amostra 3", camada: "Argila siltosa rija — corte" },
          params: { modo: "deformacao", amostra: "bloco", profundidade: "SP-2, 2,50 m", descricao: "Argila siltosa rija, marrom-avermelhada",
            diametro: "3,6", altura: "6,5", massa: "118,9", defUn: "mm", cargaModo: "k", cargaUn: "N", aferK: "0,25" },
          umid: [{ un: "12", ut: "15,40", uu: "128,95", us: "105,10" }],
          leit: leit };
      } },
    ],
  };
})();
