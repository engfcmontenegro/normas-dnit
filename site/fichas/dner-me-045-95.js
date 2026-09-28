/*
 * Ficha: DNER-ME 045/95 — Prospecção geofísica pelo método da sísmica de refração (base sísmica).
 * Tempos de primeira chegada × distância ao ponto de tiro (curva dromocrônica, 7.2.9); cada reta ajustada por
 * mínimos quadrados dá a velocidade da camada (V = 1/inclinação) e o tempo de interceptação ti.
 * A norma manda obter as dromocrônicas "que serão utilizados no cálculo das profundidades dos horizontes refratores"
 * (7.2.9), mas não traz as fórmulas: usa-se o método clássico do tempo de interceptação para camadas plano-paralelas
 * (bibliografia da norma, 2.1 e, f, l):
 *   z1 = ti2 · V1 · V2 / (2 √(V2² − V1²))
 *   z2 = [ti3 − 2 z1 √(V3² − V1²) / (V1 V3)] · V2 · V3 / (2 √(V3² − V2²))
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, fmtSig = FE.fmtSig, esc = FE.esc;

  // Anexo informativo, Tabela 1 — velocidade longitudinal Vp (m/s) (Figuerola, 1978; ar e água segundo LNEC)
  var TAB1 = [
    ["capa meteorizada", 300, 900], ["aluviões recentes", 350, 1500], ["argilas", 1000, 2000], ["margas", 1800, 3200],
    ["arenitos", 1400, 4500], ["conglomerados", 2500, 5000], ["calcários", 4000, 6000], ["dolomitas", 5000, 6000],
    ["sal", 4500, 6500], ["gesso", 3000, 4000], ["anidrita", 3000, 6000], ["gnaisse", 3100, 5400], ["quartzito", 5100, 6100],
    ["granitos", 4000, 6000], ["gabros", 6700, 7300], ["dunitos", 7900, 8400], ["diabásio", 5800, 7100],
  ];
  function materiais(v) {
    if (!ok(v)) return "";
    var l = TAB1.filter(function (m) { return v >= m[1] && v <= m[2]; }).map(function (m) { return m[0]; });
    if (Math.abs(v - 1450) <= 100) l.push("água (1 450)");
    return l.join(", ");
  }
  // reta t = a + b·x por mínimos quadrados
  function reta(pts) {
    var n = pts.length;
    if (n < 2) return null;
    var sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; });
    var den = n * sxx - sx * sx;
    if (!den) return null;
    var b = (n * sxy - sx * sy) / den;
    return { b: b, a: (sy - b * sx) / n, n: n, xMin: Math.min.apply(null, pts.map(function (p) { return p[0]; })), xMax: Math.max.apply(null, pts.map(function (p) { return p[0]; })) };
  }
  function temB(d) { return ok(num((d.params || {}).xB)); }

  // velocidades, interceptações e profundidades de um tiro (dist em m, t em ms)
  function analisa(pts, rotulo, avisos) {
    var seg = {}, R = { retas: [], V: [], ti: [], z: [], h: [], xc: [] };
    pts.forEach(function (p) { if (p.s >= 1 && p.s <= 3) (seg[p.s] = seg[p.s] || []).push([p.d, p.t]); });
    for (var k = 1; k <= 3; k++) {
      var P = seg[k] || [];
      if (P.length === 1) avisos.push("Tiro " + rotulo + ": a reta " + k + " tem um só ponto — são necessários ao menos dois para definir a velocidade.");
      var r = reta(P);
      R.retas[k] = r;
      R.V[k] = r && r.b > 0 ? 1000 / r.b : NaN;
      R.ti[k] = r ? r.a : NaN;
      if (r && r.b <= 0) avisos.push("Tiro " + rotulo + ": a reta " + k + " tem inclinação nula ou negativa — confira tempos e atribuição dos pontos.");
    }
    if (seg[2] && seg[3] && !seg[1]) avisos.push("Tiro " + rotulo + ": falta a reta 1 (onda direta) para calcular as profundidades.");
    var V1 = R.V[1], V2 = R.V[2], V3 = R.V[3];
    if (ok(V1) && ok(R.ti[1]) && Math.abs(R.ti[1]) > 3) avisos.push("Tiro " + rotulo + ": a reta 1 corta o eixo dos tempos em " + fmt(R.ti[1], 1) + " ms — a onda direta deveria passar pela origem (confira o instante do tiro ou o 1º geofone).");
    if (ok(V1) && ok(V2) && V2 <= V1) avisos.push("Tiro " + rotulo + ": V2 ≤ V1 (inversão de velocidade) — o método de refração não detecta camada mais lenta sob outra mais rápida.");
    if (ok(V2) && ok(V3) && V3 <= V2) avisos.push("Tiro " + rotulo + ": V3 ≤ V2 (inversão de velocidade) — confira a atribuição das retas.");
    if (ok(V1) && ok(V2) && V2 > V1 && ok(R.ti[2])) {
      R.z[1] = R.ti[2] / 1000 * V1 * V2 / (2 * Math.sqrt(V2 * V2 - V1 * V1));
      R.xc[1] = R.retas[1] ? (R.ti[2] - R.ti[1]) / (R.retas[1].b - R.retas[2].b) : NaN;
    }
    if (ok(R.z[1]) && ok(V3) && V3 > V2 && ok(R.ti[3])) {
      R.z[2] = (R.ti[3] / 1000 - 2 * R.z[1] * Math.sqrt(V3 * V3 - V1 * V1) / (V1 * V3)) * V2 * V3 / (2 * Math.sqrt(V3 * V3 - V2 * V2));
      R.xc[2] = (R.ti[3] - R.ti[2]) / (R.retas[2].b - R.retas[3].b);
    }
    [1, 2].forEach(function (k) { if (ok(R.z[k]) && R.z[k] <= 0) avisos.push("Tiro " + rotulo + ": espessura da camada " + k + " ≤ 0 — tempos de interceptação incoerentes (camada oculta ou atribuição errada das retas)."); });
    R.h[1] = R.z[1];
    R.h[2] = ok(R.z[1]) && ok(R.z[2]) ? R.z[1] + R.z[2] : NaN;
    return R;
  }

  FE.FICHAS["dner-me-045-95"] = {
    titulo: "Sísmica de refração — base sísmica",
    resumo: "Tempos de primeira chegada × distância ao ponto de tiro (dromocrônica); retas por mínimos quadrados → velocidades das camadas (V = 1/inclinação) e tempos de interceptação; espessuras pelo método do tempo de interceptação (camadas plano-paralelas); tiros nas duas extremidades da base.",
    blocos: [],
    params: [
      { k: "base", r: "Linha / base sísmica nº", ph: "ex.: L1 — base 3" },
      { k: "aparelho", r: "Aparelhagem", tipo: "select",
        opcoes: [["registro", "Multicanal com registro (5.6)"], ["direta", "Multicanal de leitura direta (5.7)"], ["mono", "Monocanal — impacto em placa (5.2)"]] },
      { k: "fonte", r: "Fonte de energia (6.4)", tipo: "select", opcoes: [["impacto", "Impacto (marreta/martelo)"], ["explosivo", "Explosivo"]] },
      { k: "xA", r: "Posição do tiro A (m)", ph: "0", recarrega: "tabela", dica: "no mesmo eixo das posições dos geofones" },
      { k: "xB", r: "Posição do tiro B — reverso (m)", recarrega: "tabela", dica: "deixe em branco se houver um só tiro (7.2.3 exige ao menos dois, nas extremidades)" },
    ],
    padrao: { aparelho: "registro", fonte: "impacto", xA: "0" },
    tabelas: function () {
      return [{
        chave: "geo", titulo: "Tempos de primeira chegada (7.2.8 e 7.2.9)", rotulo: "Geofone", iniciais: 12, min: 3,
        dica: "atribua cada chegada à reta (camada) 1, 2 ou 3 da dromocrônica; tempos em ms",
        linhas: [
          { k: "x", r: "Posição do geofone", u: "m" },
          { grupo: "Tiro A" },
          { calc: "dA", r: "Distância ao tiro A", u: "m", casas: 1 },
          { k: "tA", r: "Tempo de chegada", u: "ms" },
          { k: "sA", r: "Reta / camada (1, 2 ou 3)", u: "", ph: "1" },
          { grupo: "Tiro B (reverso)" },
          { calc: "dB", r: "Distância ao tiro B", u: "m", casas: 1 },
          { k: "tB", r: "Tempo de chegada", u: "ms" },
          { k: "sB", r: "Reta / camada (1, 2 ou 3)", u: "", ph: "1" },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], xA = ok(num(P.xA)) ? num(P.xA) : 0, xB = num(P.xB), hB = ok(xB);
      var ptsA = [], ptsB = [];
      var tab = (d.geo || []).map(function (g) {
        var x = num(g.x), o = { dA: ok(x) ? Math.abs(x - xA) : NaN, dB: ok(x) && hB ? Math.abs(x - xB) : NaN };
        var tA = num(g.tA), sA = num(g.sA), tB = num(g.tB), sB = num(g.sB);
        if (ok(o.dA) && ok(tA)) ptsA.push({ x: x, d: o.dA, t: tA, s: ok(sA) ? sA : 0 });
        if (ok(o.dB) && ok(tB)) ptsB.push({ x: x, d: o.dB, t: tB, s: ok(sB) ? sB : 0 });
        return o;
      });
      [["A", ptsA], ["B", ptsB]].forEach(function (z) {
        var semReta = z[1].filter(function (p) { return !(p.s >= 1 && p.s <= 3); }).length;
        if (semReta) avisos.push("Tiro " + z[0] + ": " + semReta + " chegada(s) sem reta 1, 2 ou 3 — não entram no cálculo.");
        var ord = z[1].slice().sort(function (a, b) { return a.d - b.d; });
        for (var i = 1; i < ord.length; i++) if (ord[i].t < ord[i - 1].t) { avisos.push("Tiro " + z[0] + ": o tempo diminui com a distância entre " + fmt(ord[i - 1].d, 1) + " e " + fmt(ord[i].d, 1) + " m — confira a leitura."); break; }
      });
      if (!hB || !ptsB.length) avisos.push("Os pontos de tiro devem ser no mínimo dois, situados nas extremidades da base (7.2.3); há só o tiro A — sem o tiro reverso não se avalia a inclinação das camadas.");
      var todos = ptsA.concat(ptsB);
      var dMax = todos.length ? Math.max.apply(null, todos.map(function (p) { return p.d; })) : NaN;
      if (P.aparelho === "mono" && ok(dMax) && dMax > 50) avisos.push("Aparelho monocanal: a placa de impacto vai até o comprimento máximo de 50,0 m (5.2); há distância de " + fmt(dMax, 1) + " m.");
      var RA = analisa(ptsA, "A", avisos), RB = hB && ptsB.length ? analisa(ptsB, "B", avisos) : null;
      // velocidade de cada camada com tiros direto e reverso: média harmônica das aparentes (informativo, camadas pouco inclinadas)
      var Vm = [];
      for (var k = 1; k <= 3; k++) {
        var va = RA.V[k], vb = RB ? RB.V[k] : NaN;
        Vm[k] = ok(va) && ok(vb) ? 2 * va * vb / (va + vb) : ok(va) ? va : vb;
      }
      if (RB) [2, 3].forEach(function (k) {
        if (ok(RA.V[k]) && ok(RB.V[k]) && Math.abs(RA.V[k] - RB.V[k]) / Vm[k] > 0.1)
          avisos.push("Camada " + k + ": velocidades aparentes dos tiros A (" + fmt(RA.V[k], 0) + " m/s) e B (" + fmt(RB.V[k], 0) + " m/s) diferem mais de 10 % — refrator inclinado; as espessuras sob cada tiro são aproximadas.");
      });
      return { tab: { geo: tab }, resultados: { A: RA, B: RB, Vm: Vm, xA: xA, xB: xB, ptsA: ptsA, ptsB: ptsB }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">';
      for (var k = 1; k <= 3; k++) if (ok(r.Vm[k])) h += '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.Vm[k], 0) + ' <small>m/s</small></div><div class="fe-res-r">V' + k + (r.B && ok(r.A.V[k]) && ok(r.B.V[k]) ? " (média dos tiros A e B)" : "") + (materiais(r.Vm[k]) ? " — " + esc(materiais(r.Vm[k])) : "") + "</div></div>";
      [["A", r.A], ["B", r.B]].forEach(function (z) {
        if (!z[1] || !ok(z[1].h[1])) return;
        h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(z[1].h[1], 1) + (ok(z[1].h[2]) ? " / " + fmt(z[1].h[2], 1) : "") + ' m</div><div class="fe-res-r">Profundidade do refrator ' + (ok(z[1].h[2]) ? "1 / 2" : "1") + " sob o tiro " + z[0] + "</div></div>";
      });
      h += "</div>";
      var linhas = "";
      [["A", r.A], ["B", r.B]].forEach(function (z) {
        if (!z[1]) return;
        for (var k = 1; k <= 3; k++) {
          var rt = z[1].retas[k];
          if (!rt) continue;
          linhas += "<tr><td>" + z[0] + "</td><td>" + k + "</td><td>" + rt.n + "</td><td>" + fmt(rt.b, 4) + "</td><td>" + fmt(z[1].V[k], 0) + "</td><td>" + fmt(z[1].ti[k], 1) +
            "</td><td>" + (k < 3 && ok(z[1].xc[k]) ? fmt(z[1].xc[k], 1) : "—") + "</td><td>" + (k < 3 && ok(z[1].z[k]) ? fmt(z[1].z[k], 2) : "—") + "</td></tr>";
        }
      });
      if (linhas) h += '<table class="fe-resumo"><thead><tr><th>Tiro</th><th>Reta</th><th>Pontos</th><th>Inclinação (ms/m)</th><th>V (m/s)</th><th>ti (ms)</th><th>Distância de cruzamento (m)</th><th>Espessura z (m)</th></tr></thead><tbody>' + linhas + "</tbody></table>";
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var r = calc.resultados, todos = r.ptsA.concat(r.ptsB);
      if (!todos.length) return ['<div class="fe-graf-vazio">A dromocrônica aparece quando houver tempos de chegada.</div>'];
      var W = opt.w || 560, H = opt.h || 320, m = { l: 52, r: 16, t: 14, b: 42 };
      var xsAll = todos.map(function (p) { return p.x; }).concat([r.xA]).concat(ok(r.xB) ? [r.xB] : []);
      var x0 = Math.min.apply(null, xsAll), x1 = Math.max.apply(null, xsAll);
      var tMax = Math.max.apply(null, todos.map(function (p) { return p.t; }));
      var passoT = tMax > 100 ? 20 : tMax > 40 ? 10 : 5, t1 = Math.ceil(tMax * 1.1 / passoT) * passoT;
      var passoX = (x1 - x0) > 100 ? 20 : (x1 - x0) > 40 ? 10 : 5;
      x0 = Math.floor(x0 / passoX) * passoX; x1 = Math.ceil(x1 / passoX) * passoX;
      function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
      function Y(v) { return H - m.b - v / t1 * (H - m.t - m.b); }
      var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", A: "#1f5fbf", B: "#c0392b" }
        : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", A: "#4f8cff", B: "#e0a13a" };
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
      for (var gx = x0; gx <= x1 + 1e-9; gx += passoX) {
        s += '<line x1="' + X(gx).toFixed(1) + '" y1="' + m.t + '" x2="' + X(gx).toFixed(1) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>';
        s += '<text x="' + X(gx).toFixed(1) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
      }
      for (var gt = 0; gt <= t1 + 1e-9; gt += passoT) {
        s += '<line x1="' + m.l + '" y1="' + Y(gt).toFixed(1) + '" x2="' + (W - m.r) + '" y2="' + Y(gt).toFixed(1) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>';
        s += '<text x="' + (m.l - 6) + '" y="' + (Y(gt) + 4).toFixed(1) + '" text-anchor="end" fill="' + cor.txt + '">' + gt + "</text>";
      }
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
      s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Posição ao longo da base (m)</text>';
      s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">Tempo de chegada (ms)</text>';
      [["A", r.A, r.xA, r.ptsA], ["B", r.B, r.xB, r.ptsB]].forEach(function (z) {
        var R = z[1], xs = z[2], c = cor[z[0]];
        if (!R || !ok(xs)) return;
        var sinal = z[3].length && z[3][0].x < xs ? -1 : 1;  // lado da base em relação ao tiro
        for (var k = 1; k <= 3; k++) {
          var rt = R.retas[k];
          if (!rt) continue;
          var dIni = k === 1 ? 0 : Math.max(0, R.xc[k - 1] || 0), dFim = rt.xMax;
          var tIni = rt.a + rt.b * dIni, tFim = rt.a + rt.b * dFim;
          s += '<line x1="' + X(xs + sinal * dIni).toFixed(1) + '" y1="' + Y(tIni).toFixed(1) + '" x2="' + X(xs + sinal * dFim).toFixed(1) + '" y2="' + Y(tFim).toFixed(1) + '" stroke="' + c + '" stroke-width="1.6"/>';
          if (k > 1 && ok(rt.a) && rt.a > 0) s += '<line x1="' + X(xs).toFixed(1) + '" y1="' + Y(rt.a).toFixed(1) + '" x2="' + X(xs + sinal * dIni).toFixed(1) + '" y2="' + Y(tIni).toFixed(1) + '" stroke="' + c + '" stroke-width="1" stroke-dasharray="4 3"/>';
          var xm = xs + sinal * (rt.xMin + rt.xMax) / 2, tm = rt.a + rt.b * (rt.xMin + rt.xMax) / 2;
          s += '<text x="' + X(xm).toFixed(1) + '" y="' + (Y(tm) - 8).toFixed(1) + '" text-anchor="middle" fill="' + c + '" font-size="10">' + fmt(R.V[k], 0) + " m/s</text>";
        }
        z[3].forEach(function (p) {
          s += z[0] === "A" ? '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.t).toFixed(1) + '" r="3.5" fill="' + c + '"/>'
            : '<rect x="' + (X(p.x) - 3.5).toFixed(1) + '" y="' + (Y(p.t) - 3.5).toFixed(1) + '" width="7" height="7" fill="' + c + '"/>';
        });
        s += '<path d="M' + X(xs).toFixed(1) + " " + (H - m.b) + " l-5 9 h10 z" + '" fill="' + c + '"/><text x="' + X(xs).toFixed(1) + '" y="' + (H - m.b - 4) + '" text-anchor="middle" fill="' + c + '" font-weight="bold">' + z[0] + "</text>";
      });
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "Dromocrônica (tempo × distância, 7.2.9) com tiros nas extremidades da base (7.2.3). Retas por mínimos quadrados: V = 1 / inclinação e ti = tempo de interceptação. A norma não traz as fórmulas de profundidade; adotou-se o método do tempo de interceptação para camadas plano-paralelas: z1 = ti2 · V1 · V2 / (2 √(V2² − V1²)); z2 = [ti3 − 2 z1 √(V3² − V1²) / (V1 V3)] · V2 · V3 / (2 √(V3² − V2²)). Com tiros direto e reverso, a velocidade da camada é a média harmônica das aparentes (válida para refratores pouco inclinados) e as profundidades são dadas sob cada tiro. Materiais sugeridos pela Tabela 1 do Anexo informativo; a correlação com a natureza dos terrenos deve ser calibrada por sondagem mecânica (7.3.1). Base de tempo com erro ≤ 1 ms (6.1).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.base) rows.push(["Linha / base", P.base]);
        for (var k = 1; k <= 3; k++) if (ok(r.Vm[k])) rows.push(["Velocidade V" + k, fmt(r.Vm[k], 0) + " m/s" + (r.B && ok(r.A.V[k]) && ok(r.B.V[k]) ? " (A: " + fmt(r.A.V[k], 0) + "; B: " + fmt(r.B.V[k], 0) + ")" : "") + (materiais(r.Vm[k]) ? " — " + materiais(r.Vm[k]) : "")]);
        [["A", r.A], ["B", r.B]].forEach(function (z) {
          if (!z[1] || !ok(z[1].z[1])) return;
          rows.push(["Sob o tiro " + z[0], "camada 1: " + fmt(z[1].z[1], 1) + " m" + (ok(z[1].z[2]) ? "; camada 2: " + fmt(z[1].z[2], 1) + " m (refrator 2 a " + fmt(z[1].h[2], 1) + " m)" : "")]);
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "Base de 12 geofones, tiros direto e reverso — três camadas", dados: function () {
        // modelo: V = 500 / 1 800 / 4 200 m/s; sob A z1 = 4,5 m e z2 = 8 m; sob B z1 = 5,0 m e z2 = 9 m
        return { ident: { registro: "EX-SIS-001", data: "2025-06-10", obra: "Obra A", trecho: "Corte 2 — BR-000", local: "Estaca 120 a 122+10" },
          params: { base: "L1 — base 1", aparelho: "registro", fonte: "impacto", xA: "0", xB: "48" },
          geo: [
            { x: "2", tA: "4,2", sA: "1", tB: "39,7", sB: "3" }, { x: "6", tA: "11,7", sA: "1", tB: "39,0", sB: "3" },
            { x: "10", tA: "20,1", sA: "1", tB: "38,1", sB: "3" }, { x: "14", tA: "25,4", sA: "2", tB: "36,7", sB: "3" },
            { x: "18", tA: "27,1", sA: "2", tB: "35,9", sB: "2" }, { x: "22", tA: "29,5", sA: "2", tB: "33,8", sB: "2" },
            { x: "26", tA: "31,6", sA: "2", tB: "31,2", sB: "2" }, { x: "30", tA: "33,2", sA: "3", tB: "29,5", sB: "2" },
            { x: "34", tA: "33,7", sA: "3", tB: "26,9", sB: "2" }, { x: "38", tA: "35,1", sA: "3", tB: "20,2", sB: "1" },
            { x: "42", tA: "36,1", sA: "3", tB: "12,1", sB: "1" }, { x: "46", tA: "36,8", sA: "3", tB: "3,7", sB: "1" },
          ] };
      } },
      { nome: "Monocanal com marreta, um só tiro e 60 m de linha (avisos)", dados: function () {
        // modelo: V1 = 400 m/s, V2 = 1 500 m/s, z1 = 3,2 m
        var t = ["7,7", "14,7", "21,5", "23,7", "25,2", "27,4", "29,3", "31,6", "33,1", "35,5", "37,6", "39,3", "41,7", "43,2", "45,5", "47,4", "49,1", "51,6", "53,5", "55,3"];
        return { ident: { registro: "EX-SIS-002", data: "2025-06-17", obra: "Obra B", trecho: "Jazida 2", local: "Linha transversal T3" },
          params: { base: "T3", aparelho: "mono", fonte: "impacto", xA: "0", xB: "" },
          geo: t.map(function (v, i) { return { x: String(3 + 3 * i), tA: v, sA: i < 2 ? "1" : "2" }; }) };
      } },
    ],
  };
})();
