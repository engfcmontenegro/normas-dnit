/*
 * Ficha: DNIT 414/2019-ME — Solo-cimento — Dosagem físico-química (variação volumétrica do sedimento em proveta).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var MAX_LEIT = 15;
  function ft(t) { return fmt(t, t % 1 ? 1 : 0); }  // teor sem casas quando inteiro

  function nLeituras(P) {
    var n = Math.round(num(P.leituras));
    return ok(n) ? Math.min(Math.max(n, 2), MAX_LEIT) : 6;
  }

  function grafico(calc, opt) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 300, m = { l: 52, r: 16, t: 16, b: 42 };
    var pts = calc.tab.provetas.filter(function (o) { return ok(o.teor) && ok(o.dv); }).sort(function (a, b) { return a.teor - b.teor; });
    if (pts.length < 2) return '<div class="fe-graf-vazio">O gráfico aparece quando houver ao menos duas provetas completas.</div>';
    var r = calc.resultados;
    var x1 = Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.teor; })) + 1), x0 = 0;
    var ys = pts.map(function (p) { return p.dv; }), yMin = Math.min(0, Math.min.apply(null, ys)), yMax = Math.max.apply(null, ys);
    var passoY = yMax - yMin > 150 ? 20 : yMax - yMin > 60 ? 10 : 5;
    var y0 = Math.floor(yMin / passoY) * passoY, y1 = Math.ceil((yMax * 1.1 + 1) / passoY) * passoY;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", c: "#1f5fbf", d: "#c0392b" } : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", c: "#4f8cff", d: "#e0a13a" };
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    var passoX = x1 > 20 ? 2 : 1;
    for (var gx = x0; gx <= x1; gx += passoX) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
    }
    for (var gy = y0; gy <= y1 + 1e-9; gy += passoY) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + gy + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Teor de cimento (%)</text>' +
      '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">Variação volumétrica ΔV (%)</text>';
    s += '<path d="' + pts.map(function (p, i) { return (i ? "L" : "M") + X(p.teor).toFixed(1) + " " + Y(p.dv).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor.c + '" stroke-width="2"/>';
    pts.forEach(function (p) { s += '<circle cx="' + X(p.teor) + '" cy="' + Y(p.dv) + '" r="4.5" fill="' + cor.c + '"/>'; });
    if (ok(r.teorMin)) {
      s += '<line x1="' + X(r.teorMin) + '" y1="' + Y(r.dvMax) + '" x2="' + X(r.teorMin) + '" y2="' + (H - m.b) + '" stroke="' + cor.d + '" stroke-dasharray="4 3"/>' +
        '<circle cx="' + X(r.teorMin) + '" cy="' + Y(r.dvMax) + '" r="7" fill="none" stroke="' + cor.d + '" stroke-width="2"/>' +
        '<text x="' + (X(r.teorMin) + 9) + '" y="' + (Y(r.dvMax) + 16) + '" fill="' + cor.d + '" font-weight="bold">' + ft(r.teorMin) + " % de cimento</text>";
    }
    return s + "</svg>";
  }

  FE.FICHAS["dnit-414-2019-me"] = {
    titulo: "Solo-cimento — Dosagem físico-química",
    rotuloImportar: function (r) { return "teor mínimo de cimento " + (ok(r.teorMin) ? fmt(r.teorMin, 0) + " %" : "—"); },
    resumo: "Sete ou mais provetas de 250 ml com 20 g de solo (passante na peneira nº 10) e teores crescentes de cimento, completadas a 100 ml com água destilada; leituras diárias do volume do sedimento (≥ 2 h após agitar) até ficarem constantes ou decrescentes em dois dias seguidos. ΔV = (Vmáx(teor) − Vmáx(0 %)) / Vmáx(0 %) × 100 (eq. 1); o teor do ponto máximo de ΔV é o teor mínimo de cimento.",
    blocos: [],
    params: [
      { k: "cimento", r: "Tipo de cimento", ph: "ex.: CP II-F-32" },
      { k: "massa", r: "Massa de solo por proveta (g)", ph: "20", dica: "porções de 20 g de solo seco ao ar (5 b)" },
      { k: "leituras", r: "Número de leituras (dias)", tipo: "select", recarrega: true,
        opcoes: Array.apply(null, Array(MAX_LEIT - 1)).map(function (x, i) { return [String(i + 2), (i + 2) + " leituras"]; }),
        dica: "leituras diárias até obter, em dois dias seguidos, valores constantes ou decrescentes (5 j)" },
      { k: "hcl", r: "Ácido clorídrico na proveta de 0 %", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim — solo disperso, algumas gotas para flocular (5 f)"]] },
    ],
    padrao: { massa: "20", leituras: "6", hcl: "nao" },
    tabelas: function (d) {
      var P = d.params || {}, n = nLeituras(P), linhas = [
        { k: "teor", r: "Teor de cimento (% da massa de solo)", u: "%" },
        { calc: "mc", r: "Massa de cimento na proveta", u: "g", casas: 2 },
        { grupo: "Volume ocupado pelo sedimento — uma leitura por dia, ≥ 2 h após agitar 30 s (5 g–j)" }];
      for (var i = 1; i <= n; i++) linhas.push({ k: "l" + i, r: i + "ª leitura", u: "ml" });
      linhas.push({ calc: "vmax", r: "Vmáx(teor) — maior volume lido (6)", u: "ml", casas: 0 },
        { calc: "dv", r: "ΔV = (Vmáx(teor) − Vmáx(0 %)) / Vmáx(0 %) × 100 (eq. 1)", u: "%", casas: 0, destaque: true });
      return [{ chave: "provetas", titulo: "Provetas (Tabela A1)", rotulo: "Proveta", iniciais: 7, min: 7,
        dica: "uma coluna por proveta; a primeira com 0 % de cimento (solo puro); intervalos de 1 % a 3 % entre teores (5 a)", linhas: linhas }];
    },
    calcular: function (d) {
      var P = d.params || {}, n = nLeituras(P), avisos = [], massa = ok(num(P.massa)) ? num(P.massa) : 20;
      var provetas = (d.provetas || []).map(function (p, i) {
        var o = { teor: num(p.teor) }, leit = [];
        for (var k = 1; k <= n; k++) { var v = num(p["l" + k]); if (ok(v)) leit.push(v); }
        o.mc = ok(o.teor) ? o.teor / 100 * massa : NaN;
        o.vmax = leit.length ? Math.max.apply(null, leit) : NaN;
        o.leit = leit;
        return o;
      });
      var comDados = provetas.filter(function (o) { return ok(o.teor) && ok(o.vmax); });
      var zero = comDados.filter(function (o) { return o.teor === 0; })[0];
      if (comDados.length && !zero) avisos.push("Falta a proveta com 0 % de cimento (solo puro), referência da variação volumétrica (5 a; eq. 1).");
      if (ok(num((d.provetas || [{}])[0].teor)) && num(d.provetas[0].teor) !== 0) avisos.push("A primeira proveta deve ter 0 % de cimento (5 a).");
      provetas.forEach(function (o) { o.dv = zero && ok(o.vmax) && zero.vmax > 0 ? (o.vmax - zero.vmax) / zero.vmax * 100 : NaN; });
      if (comDados.length && comDados.length < 7) avisos.push("A norma pede no mínimo sete provetas (3 a; 5 a); há " + comDados.length + ".");
      // intervalos entre teores sucessivos: 1 % a 3 % (5 a)
      var teores = comDados.map(function (o) { return o.teor; }).sort(function (a, b) { return a - b; });
      for (var i = 1; i < teores.length; i++) {
        var dt = teores[i] - teores[i - 1];
        if (dt < 1 - 1e-9 || dt > 3 + 1e-9) avisos.push("Intervalo de " + ft(dt) + " % entre os teores " + ft(teores[i - 1]) + " % e " + ft(teores[i]) + " %; a norma indica intervalos de 1 % a 3 % (5 a).");
      }
      // estabilização das leituras: duas leituras seguidas constantes ou decrescentes (5 j)
      var instaveis = [];
      provetas.forEach(function (o, i) {
        var L = o.leit;
        if (!L.length) return;
        if (L.length < 2 || L[L.length - 1] > L[L.length - 2]) instaveis.push((ok(o.teor) ? ft(o.teor) + " %" : "proveta " + (i + 1)));
      });
      if (instaveis.length) avisos.push("Leituras ainda crescentes em " + instaveis.join(", ") + ": continue as leituras até obter, em dois dias seguidos, valores constantes ou decrescentes (5 j).");
      // teor mínimo: ponto máximo de ΔV; em empate, o menor teor (Anexo B: 9 %, 11 % e 13 % com 176 % → 9 %)
      var cand = comDados.filter(function (o) { return ok(o.dv) && o.teor > 0; });
      var res = { teorMin: NaN, dvMax: NaN, empate: [] };
      if (cand.length) {
        var dvMax = Math.max.apply(null, cand.map(function (o) { return o.dv; }));
        var noMax = cand.filter(function (o) { return Math.abs(o.dv - dvMax) < 1e-9; }).sort(function (a, b) { return a.teor - b.teor; });
        res = { teorMin: noMax[0].teor, dvMax: dvMax, empate: noMax.map(function (o) { return o.teor; }) };
        if (noMax[0].teor === teores[teores.length - 1]) avisos.push("O maior ΔV ocorreu no maior teor ensaiado (" + ft(noMax[0].teor) + " %): o ponto máximo não ficou caracterizado — ensaie teores maiores.");
        if (dvMax <= 0) avisos.push("Nenhum teor aumentou o volume do sedimento em relação ao solo puro — confira as leituras.");
      }
      if (!ok(massa) || Math.abs(massa - 20) > 0.5) avisos.push("Massa de solo por proveta de " + fmt(massa, 1) + " g; a norma usa porções de 20 g (5 b).");
      return { tab: { provetas: provetas }, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.teorMin) ? ft(r.teorMin) : "—") + ' <small>%</small></div>' +
        '<div class="fe-res-r">Teor mínimo de cimento para a estabilização físico-química (6)' + ((d.params || {}).cimento ? " — " + esc(d.params.cimento) : "") + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.dvMax, 0) + ' <small>%</small></div><div class="fe-res-r">Variação volumétrica máxima' +
        (r.empate.length > 1 ? " — atingida em " + r.empate.map(function (t) { return ft(t) + " %"; }).join(", ") + " (adotado o menor teor)" : "") + "</div></div></div>";
    },
    graficos: function (calc, d, opt) { return [grafico(calc, opt)]; },
    relatorio: {
      notas: "Vmáx(teor) = maior volume lido na proveta de cada teor; ΔV(%) = (Vmáx(teor) − Vmáx(0 %)) / Vmáx(0 %) × 100 (eq. 1 — a norma impressa omite o fator 100, mas o Anexo B apresenta ΔV em %). O ponto máximo do gráfico % cimento × ΔV é o teor mínimo de cimento; quando o máximo se repete em vários teores, adota-se o menor (como no Anexo B, em que 9 %, 11 % e 13 % têm ΔV = 176 % e o resultado é 9 %).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.cimento) rows.push(["Cimento", P.cimento]);
        rows.push(["Teor mínimo de cimento (estabilização físico-química)", ok(r.teorMin) ? ft(r.teorMin) + " %" : "—"]);
        rows.push(["Variação volumétrica máxima", fmt(r.dvMax, 0) + " %" + (r.empate.length > 1 ? " (nos teores " + r.empate.map(function (t) { return ft(t); }).join(", ") + " %)" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo do Anexo B da norma — 7 provetas, 6 leituras (resultado 9 %)", dados: function () {
        return prov({ registro: "EX-FQ-001", camada: "Solo-cimento (exemplo da norma)", origem: "DNIT 414/2019-ME, Anexo B" },
          { cimento: "", massa: "20", leituras: "6", hcl: "nao" },
          [[0, [24, 24, 24, 25, 25, 25]], [3, [27, 27, 26, 26, 26, 26]], [6, [36, 50, 56, 56, 54, 53]], [9, [48, 67, 69, 66, 65, 63]],
            [11, [51, 69, 66, 66, 65, 65]], [13, [52, 69, 66, 66, 65, 64]], [15, [50, 66, 64, 63, 62, 62]]]);
      } },
      { nome: "Solo arenoso — intervalos de 1 %, 8 provetas, 5 leituras", dados: function () {
        return prov({ registro: "EX-FQ-002", camada: "Base — solo-cimento (estudo)", origem: "Jazida 1" },
          { cimento: "CP II-F-32", massa: "20", leituras: "5", hcl: "nao" },
          [[0, [18, 19, 19, 19, 19]], [1, [19, 20, 20, 20, 20]], [2, [21, 24, 25, 25, 24]], [3, [24, 29, 31, 30, 30]],
            [4, [26, 33, 35, 34, 34]], [5, [27, 34, 34, 34, 33]], [6, [27, 33, 33, 32, 32]], [7, [26, 32, 32, 31, 31]]]);
      } },
      { nome: "Solo argiloso — só 6 provetas, intervalo de 4 % e leituras ainda crescentes", dados: function () {
        return prov({ registro: "EX-FQ-003", camada: "Solo-cimento (estudo preliminar)", origem: "Jazida 3" },
          { cimento: "CP III-40", massa: "20", leituras: "4", hcl: "sim" },
          [[0, [30, 31, 31, 31]], [2, [32, 34, 35, 35]], [4, [38, 45, 48, 48]], [6, [44, 55, 58, 59]], [8, [47, 60, 64, 66]], [12, [49, 63, 67, 68]]]);
      } },
    ],
  };

  function prov(ident, params, lista) {
    return { ident: ident, params: params, provetas: lista.map(function (x) {
      var o = { teor: String(x[0]) };
      x[1].forEach(function (v, i) { o["l" + (i + 1)] = String(v); });
      return o;
    }) };
  }
})();
