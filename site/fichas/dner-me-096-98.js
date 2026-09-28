/*
 * Ficha: DNER-ME 096/98 — Agregado graúdo: resistência mecânica pelo método dos 10 % de finos.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var UNID = { kN: 1000, N: 1, kgf: 9.80665, tf: 9806.65 };
  var PENETRACAO = { arredondado: 15, britado: 20, leve: 24 };
  var F_MIN = 7.5, F_MAX = 12.5;

  // F1 = (Ma − M1) / Ma × 100 (5.7); X = 14 × X1 / (F1 + 4) (6)
  function finos(Ma, M1) { return ok(Ma) && ok(M1) && Ma > 0 ? (Ma - M1) / Ma * 100 : NaN; }
  function carga10(X1, F1) { return ok(X1) && ok(F1) && F1 + 4 > 0 ? 14 * X1 / (F1 + 4) : NaN; }

  FE.FICHAS["dner-me-096-98"] = {
    titulo: "Resistência mecânica — 10 % de finos",
    resumo: "Grãos entre 12,7 e 9,5 mm, esmagados no cilindro até a penetração prevista (15, 20 ou 24 mm); finos F₁ = (Mₐ − M₁) / Mₐ × 100 na peneira de 2,4 mm, entre 7,5 % e 12,5 %; carga para 10 % de finos X = 14 × X₁ / (F₁ + 4).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: brita 1 granítica" },
      { k: "natureza", r: "Natureza do agregado — penetração prevista (5.4)", tipo: "select",
        opcoes: [["britado", "Britado usual — 20 mm (5.4 b)"], ["arredondado", "Grãos arredondados (seixo, cascalho) — 15 mm (5.4 a)"],
          ["leve", "Agregado leve, vesicular — 24 mm (5.4 c)"]] },
      { k: "unidade", r: "Unidade da carga lida na prensa", tipo: "select", recarrega: true,
        opcoes: [["kN", "kN"], ["N", "N"], ["kgf", "kgf"], ["tf", "tf"]] },
      { k: "minimo", r: "Carga mínima exigida para 10 % de finos (kN) — opcional", dica: "da especificação de serviço pertinente" },
    ],
    padrao: { natureza: "britado", unidade: "kN" },
    tabelas: function (d) {
      var u = (d.params || {}).unidade || "kN";
      return [{
        chave: "tent", titulo: "Tentativas de esmagamento", rotulo: "Tentativa", iniciais: 1, min: 1,
        dica: "se F₁ ficar fora de 7,5 %–12,5 %, repita com outra penetração (Nota 3) — vale a última tentativa dentro da faixa",
        linhas: [
          { k: "Ma", r: "Massa do agregado no recipiente de medida (Mₐ) (4.3)", u: "g" },
          { k: "pen", r: "Penetração do êmbolo atingida (5.4)", u: "mm", ph: "prevista" },
          { k: "X1", r: "Carga na penetração atingida (X₁) (5.5)", u: u },
          { k: "M1", r: "Massa retida na peneira de 2,4 mm (M₁) (5.6)", u: "g" },
          { calc: "F1", r: "Finos produzidos F₁ = (Mₐ − M₁) / Mₐ × 100 (5.7)", u: "%", casas: 2 },
          { calc: "X", r: "Carga para 10 % de finos X = 14 × X₁ / (F₁ + 4) (6) — só com F₁ na faixa", u: "kN", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, fator = UNID[P.unidade || "kN"] || 1000, avisos = [];
      var penPrev = PENETRACAO[P.natureza || "britado"];
      var rows = (d.tent || []).map(function (x, i) {
        var Ma = num(x.Ma), M1 = num(x.M1), X1N = num(x.X1) * fator, F1 = finos(Ma, M1);
        var XN = carga10(X1N, F1);
        var dentro = ok(F1) && F1 >= F_MIN && F1 <= F_MAX;
        if (ok(M1) && ok(Ma) && M1 > Ma) avisos.push("Tentativa " + (i + 1) + ": massa retida maior que a massa inicial — confira.");
        return { F1: F1, X: dentro ? XN / 1000 : NaN, XN: XN, X1N: X1N, dentro: dentro, pen: num(x.pen) };
      });
      var validas = rows.filter(function (o) { return o.dentro && ok(o.XN); });
      var adot = validas.length ? validas[validas.length - 1] : null;
      var ult = rows.filter(function (o) { return ok(o.F1); }).slice(-1)[0];
      if (ult && !ult.dentro) {
        avisos.push("F₁ = " + fmt(ult.F1, 2) + " % na última tentativa, fora de 7,5 %–12,5 % (Nota 3): repita o ensaio " +
          (ult.F1 < F_MIN ? "aumentando" : "diminuindo") + " a penetração do êmbolo." + (adot ? " Mantido o resultado da última tentativa válida." : ""));
      }
      rows.forEach(function (o, i) {
        if (ok(o.pen) && i === 0 && o.pen !== penPrev)
          avisos.push("Primeira tentativa com penetração de " + fmt(o.pen, 0) + " mm; a prevista para este agregado é " + penPrev + " mm (5.4).");
      });
      var minimo = num(P.minimo), X = adot ? adot.X : NaN;
      if (ok(X) && ok(minimo) && X < minimo) avisos.push("Carga para 10 % de finos = " + fmt(X, 1) + " kN, abaixo do mínimo exigido de " + fmt(minimo, 0) + " kN.");
      return { tab: { tent: rows }, tentativas: rows, adotada: adot ? rows.indexOf(adot) : -1,
        resultados: { X: X, XN: adot ? adot.XN : NaN, F1: adot ? adot.F1 : NaN, X1N: adot ? adot.X1N : NaN, minimo: minimo, penPrev: penPrev,
          conforme: ok(X) && ok(minimo) ? X >= minimo : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.X) ? fmt(r.X, 1) : "—") + ' <small>kN</small></div>' +
        '<div class="fe-res-r">Carga para 10 % de finos' + (ok(r.XN) ? " (" + fmt(Math.round(r.XN / 10) * 10, 0) + " N)" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.F1) ? fmt(r.F1, 2) + " %" : "—") + '</div><div class="fe-res-r">Finos F₁ da tentativa adotada' +
        (calc.adotada >= 0 ? " (nº " + (calc.adotada + 1) + ")" : " — nenhuma entre 7,5 % e 12,5 %") + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.X1N) ? fmt(r.X1N / 1000, 1) + " kN" : "—") + '</div><div class="fe-res-r">Carga X₁ da tentativa adotada</div></div></div>';
    },
    // reta carga × finos implícita na fórmula: X ∝ (F + 4), passando por (F₁; X₁) — ilustra a interpolação para 10 %
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var pts = calc.tentativas.filter(function (o) { return ok(o.F1) && ok(o.X1N); });
      if (!pts.length) return ['<div class="fe-graf-vazio">O gráfico carga × % de finos aparece com Mₐ, X₁ e M₁.</div>'];
      var r = calc.resultados, W = opt.w || 560, H = opt.h || 320, m = { l: 52, r: 16, t: 14, b: 42 };
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
      var cor = imp ? "#1f5fbf" : "#4f8cff", corX = imp ? "#c0392b" : "#e0a13a", faixa = imp ? "#eef5e9" : "rgba(80,180,90,.12)";
      var fs = pts.map(function (o) { return o.F1; }).concat([F_MIN, F_MAX, 10]);
      var x0 = Math.max(0, Math.floor(Math.min.apply(null, fs) - 1)), x1 = Math.ceil(Math.max.apply(null, fs) + 1);
      var ys = pts.map(function (o) { return o.X1N / 1000; }).concat(ok(r.X) ? [r.X] : []);
      var y1 = Math.max.apply(null, ys) * 1.15, y0 = 0;
      var passoY = y1 > 400 ? 100 : y1 > 200 ? 50 : y1 > 80 ? 20 : y1 > 40 ? 10 : 5;
      y1 = Math.ceil(y1 / passoY) * passoY;
      function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
      function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
      s += '<rect x="' + X(F_MIN) + '" y="' + m.t + '" width="' + (X(F_MAX) - X(F_MIN)) + '" height="' + (H - m.t - m.b) + '" fill="' + faixa + '"/>';
      for (var gx = x0; gx <= x1; gx++) {
        s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
        s += '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + gx + "</text>";
      }
      for (var gy = 0; gy <= y1 + 1e-9; gy += passoY) {
        s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/>';
        s += '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + txt + '">' + gy + "</text>";
      }
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
      s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Finos passantes na peneira de 2,4 mm (%) — faixa válida 7,5 a 12,5 %</text>';
      s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Carga (kN)</text>';
      if (calc.adotada >= 0) {
        var a = calc.tentativas[calc.adotada], k = a.X1N / 1000 / (a.F1 + 4);
        var ya = k * (x0 + 4), yb = k * (x1 + 4), xb = x1;
        if (yb > y1) { xb = y1 / k - 4; yb = y1; }
        s += '<line x1="' + X(x0).toFixed(1) + '" y1="' + Y(ya).toFixed(1) + '" x2="' + X(xb).toFixed(1) + '" y2="' + Y(yb).toFixed(1) + '" stroke="' + cor + '" stroke-width="1.6" stroke-dasharray="6 3"/>';
        s += '<line x1="' + X(10) + '" y1="' + (H - m.b) + '" x2="' + X(10) + '" y2="' + Y(r.X) + '" stroke="' + corX + '" stroke-dasharray="4 3" stroke-width="1.4"/>';
        s += '<line x1="' + m.l + '" y1="' + Y(r.X) + '" x2="' + X(10) + '" y2="' + Y(r.X) + '" stroke="' + corX + '" stroke-dasharray="4 3" stroke-width="1.4"/>';
        s += '<circle cx="' + X(10) + '" cy="' + Y(r.X) + '" r="4" fill="' + corX + '"/>';
        s += '<text x="' + (m.l + 6) + '" y="' + (Y(r.X) - 6) + '" fill="' + corX + '" font-weight="bold">X = ' + fmt(r.X, 1) + " kN</text>";
      }
      pts.forEach(function (o) {
        var i = calc.tentativas.indexOf(o), adot = i === calc.adotada;
        s += '<circle cx="' + X(o.F1) + '" cy="' + Y(o.X1N / 1000) + '" r="4.5" fill="' + (adot ? cor : "none") + '" stroke="' + cor + '" stroke-width="1.5"/>';
        s += '<text x="' + (X(o.F1) + 7) + '" y="' + (Y(o.X1N / 1000) + 13) + '" fill="' + txt + '" font-size="10">' + (i + 1) + "</text>";
      });
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "F₁ = (Mₐ − M₁) / Mₐ × 100 (5.7), com Mₐ a massa de grãos entre 12,7 e 9,5 mm que enche o recipiente de medida e M₁ a massa retida na peneira de 2,4 mm após a carga X₁. F₁ deve ficar entre 7,5 % e 12,5 %; fora disso repete-se o ensaio com outra penetração (Nota 3). Carga para 10 % de finos: X = 14 × X₁ / (F₁ + 4) (6) — expressão equivalente a uma reta carga × finos passando por (F₁; X₁) e anulando-se em F = −4 %, traçada no gráfico. A norma não fixa arredondamento; resultado em kN com uma decimal.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Carga para 10 % de finos (X)", ok(r.X) ? fmt(r.X, 1) + " kN (" + fmt(Math.round(r.XN / 10) * 10, 0) + " N)" +
          (r.conforme === null ? "" : r.conforme ? " — atende ao mínimo de " + fmt(r.minimo, 0) + " kN" : " — NÃO ATENDE ao mínimo de " + fmt(r.minimo, 0) + " kN") : "— (nenhuma tentativa com F₁ entre 7,5 % e 12,5 %)"]);
        rows.push(["Tentativa adotada", calc.adotada >= 0 ? "nº " + (calc.adotada + 1) + " — F₁ = " + fmt(r.F1, 2) + " %, X₁ = " + fmt(r.X1N / 1000, 1) + " kN" : "—"]);
        rows.push(["Penetração prevista (5.4)", r.penPrev + " mm"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 granítica — uma tentativa dentro da faixa", dados: function () {
        return { ident: { registro: "EX-10F-001", obra: "Obra A", camada: "Brita 1", origem: "Pedreira X", data: "2026-05-12" },
          params: { material: "Brita 1 (granito)", natureza: "britado", unidade: "kN", minimo: "" },
          tent: [{ Ma: "2748", pen: "20", X1: "192,4", M1: "2471" }] };
      } },
      { nome: "Cascalho britado — 1ª tentativa fora da faixa, repetida com penetração maior", dados: function () {
        return { ident: { registro: "EX-10F-002", obra: "Obra B", camada: "Base — cascalho britado", origem: "Jazida 1", data: "2026-05-20" },
          params: { material: "Cascalho britado", natureza: "arredondado", unidade: "kgf", minimo: "100" },
          tent: [{ Ma: "2690", pen: "15", X1: "9850", M1: "2533" }, { Ma: "2702", pen: "18", X1: "13600", M1: "2440" }] };
      } },
      { nome: "Agregado leve vesicular — carga abaixo do mínimo (reprovado)", dados: function () {
        return { ident: { registro: "EX-10F-003", camada: "Revestimento primário", origem: "Fornecedor A" },
          params: { material: "Escória vesicular", natureza: "leve", unidade: "kN", minimo: "80" },
          tent: [{ Ma: "2105", pen: "24", X1: "68,5", M1: "1868" }] };
      } },
    ],
  };
})();
