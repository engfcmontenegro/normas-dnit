/*
 * Ficha: DNER-ME 216/94 — Solo-cimento — Relação entre o teor de umidade e a massa específica aparente seca
 * (energia normal: molde de 1 000 cm³, 3 camadas de 25 golpes do soquete de 2,5 kg caindo de 305 mm).
 * Reaproveita o bloco FE.BLOCOS.compactacao (mesma conta da DNIT 164: h, γu = mu / v, γs = γu × 100 / (100 + h),
 * curva parabólica por mínimos quadrados). Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var VOL = 1000;  // 4.1: Ø 100 mm × 127,3 mm = 999,8 cm³ (o texto impresso diz "100 cm³ ± 10 cm³")
  var METODOS = { A: "Método A — passante na 4,8 mm (1.2 a)", B: "Método B — passante na 19 mm, parte retida na 4,8 mm (1.2 b)" };

  // linhas do bloco de compactação adaptadas: uma única porção de umidade por ponto (5.1.2.2.4) e símbolos da norma
  function linhas() {
    var R = {
      c1n: "Recipiente nº", c1t: "Recipiente (m)", c1u: "Recipiente + amostra úmida (mbu)", c1s: "Recipiente + amostra seca (mbs)",
      c1W: "Teor de umidade h = (mbu − mbs) / (mbs − m) × 100 (6.1)",
      moldeM: "Massa do molde", moldeV: "Volume do molde (v)", moldeSolo: "Molde + amostra compactada úmida (± 1 g)",
      Ph: "Massa da amostra compactada úmida (mu, 5.1.2.2.3)", gh: "γu = mu / v (6.2)", gs: "γs = γu / (h + 100) × 100 (6.3)",
    };
    return FE.BLOCOS.compactacao.linhas("", "").filter(function (l) {
      var k = l.k || l.calc || "";
      return !/^c2/.test(k) && k !== "h" && !l.grupo;
    }).map(function (l) {
      var k = l.k || l.calc, o = Object.assign({}, l);
      o.r = R[k] || l.r.replace(/^Cápsula 1 — /, "");
      if (k === "moldeV") { o.padrao = "volume"; o.padraoFixo = String(VOL); }
      if (k === "c1W") o.destaque = true;
      return o;
    }).reduce(function (acc, l) {
      if ((l.k || l.calc) === "c1n") acc.push({ grupo: "Umidade — porção de 80 g a 120 g retirada em toda a altura de uma metade do CP (5.1.2.2.4; Método B: ≥ 200 g)" });
      if ((l.k || l.calc) === "moldeM") acc.push({ grupo: "Corpo de prova compactado — 3 camadas × 25 golpes (5.1.2.2.2 e 5.1.2.2.3)" });
      acc.push(l);
      return acc;
    }, []);
  }

  function grafico(calc, opt) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 300, m = { l: 58, r: 16, t: 16, b: 42 };
    var pts = calc.pontos.filter(function (p) { return ok(p.h) && ok(p.gs); });
    if (!pts.length) return '<div class="fe-graf-vazio">O gráfico aparece quando houver pontos completos.</div>';
    var r = calc.resultados;
    var xs = pts.map(function (p) { return p.h; }), ys = pts.map(function (p) { return p.gs; }).concat(ok(r.gsMax) ? [r.gsMax] : []);
    var x0 = Math.floor(Math.min.apply(null, xs) - 1), x1 = Math.ceil(Math.max.apply(null, xs) + 1);
    var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys), pad = Math.max((yMax - yMin) * 0.25, 0.02);
    var passoY = (yMax - yMin + 2 * pad) > 0.3 ? 0.05 : (yMax - yMin + 2 * pad) > 0.12 ? 0.02 : 0.01;
    var y0 = Math.floor((yMin - pad) / passoY) * passoY, y1 = Math.ceil((yMax + pad) / passoY) * passoY;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", c: "#1f5fbf" } : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", c: "#4f8cff" };
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    var passoX = (x1 - x0) > 12 ? 2 : 1;
    for (var gx = x0; gx <= x1; gx += passoX) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
    }
    for (var gy = y0; gy <= y1 + 1e-9; gy += passoY) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + fmt(gy, 3) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Teor de umidade h (%)</text>' +
      '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">γs (g/cm³)</text>';
    var us = calc.pontos.filter(function (p) { return p.usar && ok(p.h) && ok(p.gs); });
    if (r.ajuste && us.length) {
      var a = Math.min.apply(null, us.map(function (p) { return p.h; })) - 0.5, b = Math.max.apply(null, us.map(function (p) { return p.h; })) + 0.5, dc = "";
      for (var x = a; x <= b + 1e-9; x += (b - a) / 60) {
        var y = r.ajuste.a * x * x + r.ajuste.b * x + r.ajuste.c;
        if (y >= y0 && y <= y1) dc += (dc ? " L" : "M") + X(x).toFixed(1) + " " + Y(y).toFixed(1);
      }
      if (dc) s += '<path d="' + dc + '" fill="none" stroke="' + cor.c + '" stroke-width="2"/>';
      if (ok(r.gsMax)) {
        s += '<line x1="' + X(r.hOt) + '" y1="' + Y(r.gsMax) + '" x2="' + X(r.hOt) + '" y2="' + (H - m.b) + '" stroke="' + cor.c + '" stroke-dasharray="3 3"/>' +
          '<line x1="' + m.l + '" y1="' + Y(r.gsMax) + '" x2="' + X(r.hOt) + '" y2="' + Y(r.gsMax) + '" stroke="' + cor.c + '" stroke-dasharray="3 3"/>' +
          '<text x="' + (X(r.hOt) > W - 220 ? X(r.hOt) - 6 : X(r.hOt) + 6) + '" y="' + (Y(r.gsMax) - 6) + '"' + (X(r.hOt) > W - 220 ? ' text-anchor="end"' : "") + ' fill="' + cor.c + '" font-weight="bold">γm ' + fmt(r.gsMax, 3) + " g/cm³ · ho " + fmt(r.hOt, 1) + " %</text>";
      }
    }
    calc.pontos.forEach(function (p, i) {
      if (!ok(p.h) || !ok(p.gs)) return;
      s += '<circle cx="' + X(p.h) + '" cy="' + Y(p.gs) + '" r="4.5" fill="' + (p.usar ? cor.c : "none") + '" stroke="' + cor.c + '" stroke-width="1.5"/>' +
        '<text x="' + (X(p.h) + 7) + '" y="' + (Y(p.gs) + 13) + '" fill="' + cor.txt + '" font-size="10">' + (i + 1) + "</text>";
    });
    return s + "</svg>";
  }

  FE.FICHAS["dner-me-216-94"] = {
    titulo: "Solo-cimento — Relação umidade × massa específica aparente seca",
    rotuloImportar: function (r) { return "γs,máx " + (ok(r.gsMax) ? fmt(r.gsMax, 3) : "—") + " · h ót " + (ok(r.hOt) ? fmt(r.hOt, 1) + " %" : "—"); },
    resumo: "Compactação da mistura solo-cimento na energia normal (molde de 1 000 cm³, 3 camadas de 25 golpes, soquete de 2,5 kg, queda de 305 mm); h, γu = mu / v e γs = γu × 100 / (100 + h) de cada ponto; curva de compactação, umidade ótima (ho) e massa específica aparente seca máxima (γm).",
    blocos: ["umidade", "compactacao"],
    params: [
      { k: "metodo", r: "Método (1.2)", tipo: "select", opcoes: Object.keys(METODOS).map(function (k) { return [k, METODOS[k]]; }) },
      { k: "cimento", r: "Teor de cimento (% da massa de solo seco)", ph: "ex.: 6", dica: "quantidade especificada de cimento Portland (5.1.2.1.1, nota 1)" },
      { k: "tipoCimento", r: "Cimento Portland", ph: "ex.: CP II-F-32" },
      { k: "volume", r: "Volume do molde (v, cm³)", recarrega: "tabela", ph: String(VOL), dica: "Ø 100 mm × 127,3 mm ≈ 1 000 cm³ ± 10 cm³ (4.1); use a capacidade aferida" },
      { k: "massaSolo", r: "Massa de solo seco da amostra (g) — opcional", dica: "Método A: > 2 500 g (5.1.1.2); Método B: cerca de 5 000 g (5.2.1.4)" },
      { k: "retido", r: "Retido entre 4,8 mm e 19 mm (%) — Método B", dica: "igual à porcentagem retida entre 76 mm e 4,8 mm na amostra original (5.2.1.4)",
        se: function (d) { return (d.params || {}).metodo === "B"; } },
      { k: "hPrev", r: "Umidade ótima prevista para o solo (%) — opcional", dica: "o 1º ponto fica uns 5 pontos percentuais abaixo dela (5.1.2.2.1)" },
    ],
    padrao: { metodo: "A" },
    tabelas: function () {
      return [{ chave: "pontos", titulo: "Pontos da curva de compactação", rotulo: "Ponto", iniciais: 5, min: 3, usar: true, linhas: linhas(),
        dica: "uma coluna por compactação, com 1 a 3 pontos percentuais de água a mais a cada ponto; em geral cinco (5.1.2.2.6). Desmarque \"usar\" para tirar um ponto do ajuste." }];
    },
    calcular: function (d) {
      var P = d.params || {}, metodo = P.metodo || "A";
      var V = ok(num(P.volume)) ? num(P.volume) : VOL;
      // o bloco usa params.volumePadrao como volume padrão do molde
      var c = FE.BLOCOS.compactacao.calcular({ params: { volumePadrao: String(V) }, pontos: d.pontos || [] }, 0, "Ponto");
      var avisos = c.avisos.slice();
      var minU = metodo === "B" ? 200 : 80;
      (d.pontos || []).forEach(function (p, i) {
        var u = FE.BLOCOS.umidade.calcular(p, "c1", "lab");
        if (ok(u.mUmida) && (u.mUmida < minU || (metodo === "A" && u.mUmida > 120))) {
          avisos.push("Ponto " + (i + 1) + ": porção de umidade de " + fmt(u.mUmida, 2) + " g — " + (metodo === "B" ? "no Método B retiram-se no mínimo 200 g (5.2.2.2.2)." : "a norma pede 80 g a 120 g (5.1.2.2.4)."));
        }
        var Vp = num(p.moldeV);
        if (ok(Vp) && Math.abs(Vp - 1000) > 10) avisos.push("Ponto " + (i + 1) + ": volume do molde de " + fmt(Vp, 1) + " cm³, fora de 1 000 ± 10 cm³ (4.1).");
      });
      if (ok(V) && Math.abs(V - 1000) > 10) avisos.push("Volume do molde de " + fmt(V, 1) + " cm³, fora de 1 000 ± 10 cm³ (4.1).");
      var val = c.pontos.filter(function (o) { return ok(o.h) && ok(o.gs); });
      if (val.length && val.length < 5) avisos.push("A série continua até caracterizar a curva de compactação, em geral com cinco determinações (5.1.2.2.6); há " + val.length + ".");
      // acréscimo de umidade entre pontos sucessivos: 1 a 3 pontos percentuais (5.1.2.2.6)
      for (var i = 1; i < c.pontos.length; i++) {
        var a = c.pontos[i - 1].h, b = c.pontos[i].h;
        if (!ok(a) || !ok(b)) continue;
        var dh = Math.round((b - a) * 10) / 10;
        if (dh < 1 || dh > 3) avisos.push("Do ponto " + i + " para o " + (i + 1) + " a umidade variou " + fmt(b - a, 1) + " ponto(s) percentual(is); a norma manda acrescentar água para aumentar de 1 a 3 pontos a cada determinação (5.1.2.2.6).");
      }
      var hPrev = num(P.hPrev), h1 = (c.pontos[0] || {}).h;
      if (ok(hPrev) && ok(h1) && hPrev - h1 < 3) avisos.push("O 1º ponto (h = " + fmt(h1, 1) + " %) deveria ficar uns 5 pontos percentuais abaixo da umidade ótima prevista de " + fmt(hPrev, 1) + " % (5.1.2.2.1).");
      var ms = num(P.massaSolo);
      if (ok(ms) && metodo === "A" && ms <= 2500) avisos.push("Massa de solo seco de " + fmt(ms, 0) + " g — no Método A deve ser superior a 2 500 g (5.1.1.2).");
      if (ok(ms) && metodo === "B" && Math.abs(ms - 5000) > 500) avisos.push("Massa de amostra de " + fmt(ms, 0) + " g — no Método B a massa total é de aproximadamente 5 000 g (5.2.1.4).");
      return { tab: { pontos: c.pontos }, pontos: c.pontos, resultados: c.res, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' + cx(fmt(r.gsMax, 3) + " <small>g/cm³</small>", "Massa específica aparente seca máxima γm (3.3; 7.2)") +
        cx(fmt(r.hOt, 1) + " <small>%</small>", "Umidade ótima ho (3.2; 7.2)") +
        cx(esc(METODOS[P.metodo || "A"]) + (P.cimento ? " · " + esc(P.cimento) + " % de cimento" : ""), "Energia normal · 3 camadas × 25 golpes", true) + "</div>";
    },
    graficos: function (calc, d, opt) { return [grafico(calc, opt)]; },
    relatorio: {
      parametros: [["Compactação", "Energia normal: 3 camadas iguais × 25 golpes, soquete de 2,50 kg (face Ø 50 mm), queda de 305 mm; molde Ø 100 mm × 127,3 mm"]],
      notas: "h = (mbu − mbs) / (mbs − m) × 100 (6.1); γu = mu / v (6.2); γs = γu / (h + 100) × 100 (6.3). Curva de compactação (7.1): parábola ajustada por mínimos quadrados aos pontos marcados; ho e γm no vértice (3.2, 3.3 e 7.2). O volume do molde da norma impressa (\"100 cm³ ± 10 cm³\", 4.1) foi lido como 1 000 cm³ ± 10 cm³, coerente com Ø 100 mm × 127,3 mm e com a DNER-ME 202/94.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Método", METODOS[P.metodo || "A"] + (P.metodo === "B" && P.retido ? " — " + P.retido + " % retido entre 4,8 e 19 mm" : "")]);
        if (P.cimento) rows.push(["Teor de cimento", P.cimento + " %" + (P.tipoCimento ? " (" + P.tipoCimento + ")" : "")]);
        rows.push(["Massa específica aparente seca máxima (γm)", fmt(r.gsMax, 3) + " g/cm³"], ["Umidade ótima (ho)", fmt(r.hOt, 1) + " %"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Solo arenoso A-2-4 + 6 % de cimento — Método A, 5 pontos", dados: function () {
        return gerar({ registro: "EX-SC-001", camada: "Base — solo-cimento", origem: "Jazida 1" },
          { metodo: "A", cimento: "6", tipoCimento: "CP II-F-32", volume: "998", massaSolo: "2800", hPrev: "11" },
          [[6.2, 1.842], [8.1, 1.893], [10.0, 1.921], [11.9, 1.907], [13.8, 1.861]], 998, 90);
      } },
      { nome: "Solo pedregulhoso + 5 % de cimento — Método B, 22 % retido na 4,8 mm", dados: function () {
        return gerar({ registro: "EX-SC-002", camada: "Sub-base — solo-cimento", origem: "Jazida 2" },
          { metodo: "B", cimento: "5", tipoCimento: "CP II-E-32", volume: "1002", massaSolo: "5000", retido: "22", hPrev: "9" },
          [[4.3, 2.021], [6.1, 2.078], [7.9, 2.102], [9.6, 2.083], [11.4, 2.032]], 1002, 230);
      } },
      { nome: "Argila siltosa + 10 % de cimento — só ramo seco, porção pequena, molde fora da tolerância", dados: function () {
        // porção de umidade do ponto 2 com só 55 g de solo seco (≈ 65 g úmida, abaixo de 80 g)
        return gerar({ registro: "EX-SC-003", camada: "Reforço — solo-cimento (estudo)", origem: "Jazida 3" },
          { metodo: "A", cimento: "10", volume: "1025", massaSolo: "2300", hPrev: "19" },
          [[17.0, 1.585], [18.2, 1.604], [21.9, 1.628], [23.1, 1.633]], 1025, [90, 55, 90, 90]);
      } },
    ],
  };

  // dados de exemplo a partir de pares (h, γs) alvo: molde de 4 150 g + porção de umidade com "seco" g de solo seco (número ou lista por ponto)
  function gerar(ident, params, alvo, V, seco) {
    return { ident: ident, params: params, pontos: alvo.map(function (t, i) {
      var ms = Array.isArray(seco) ? seco[i] : seco, tara = 14.5 + i * 1.3, mu = t[1] * (1 + t[0] / 100) * V;
      return { usar: true, c1n: String(31 + i), c1t: fmt(tara, 2), c1s: fmt(tara + ms, 2), c1u: fmt(tara + ms * (1 + t[0] / 100), 2),
        moldeN: "M1", moldeM: "4150", moldeSolo: String(Math.round(4150 + mu)) };
    }) };
  }
})();
