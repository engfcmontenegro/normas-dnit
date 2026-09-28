/*
 * Ficha: DNER-ME 398/99 — Agregados — Índice de degradação após compactação Proctor (IDp).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var nomePen = FE.granulometria.nomePeneira;

  // Quadro 2: peneiras e granulometria original padronizada (% passando), coerente com o Quadro 1
  var PEN = [19, 9.5, 4.8, 2, 0.42, 0.074];
  var ORIG = [85, 65, 50, 35, 20, 5];
  var MASSA_Q1 = 6000;  // Quadro 1: total da amostra (g)
  var Q1 = [["25 mm – 19 mm", 15, 900], ["19 mm – 9,5 mm", 20, 1200], ["9,5 mm – nº 4", 15, 900], ["nº 4 – nº 10", 15, 900],
    ["nº 10 – nº 40", 15, 900], ["nº 40 – nº 200", 15, 900], ["< nº 200", 5, 300]];
  function ch(mm) { return String(mm).replace(".", "_"); }

  // % passando de uma amostra: massas retidas individuais (base: massa da amostra) ou % digitado
  function calcAmostra(x, P) {
    var o = { pass: [] };
    if (P.entrada === "pct") {
      PEN.forEach(function (mm) { o.pass.push(num(x["q" + ch(mm)])); });
      o.completa = o.pass.every(ok);
      return o;
    }
    var m0 = num(x.m0);
    if (!ok(m0)) m0 = num(P.massaBase);
    if (!ok(m0)) m0 = MASSA_Q1;
    o.m0 = m0;
    var acum = 0, falta = false;
    PEN.forEach(function (mm) {
      var r = num(x["r" + ch(mm)]);
      if (!ok(r)) falta = true;
      acum += ok(r) ? r : 0;
      o.pass.push(falta || m0 <= 0 ? NaN : (m0 - acum) / m0 * 100);  // % passando = (M − Σ retido até a peneira) / M
    });
    var f = num(x.fundo);
    o.soma = falta ? NaN : acum + (ok(f) ? f : 0);
    o.perda = ok(o.soma) && ok(f) ? (m0 - o.soma) / m0 * 100 : NaN;
    o.completa = !falta;
    return o;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [];
    var am = (d.am || []).map(function (x) { return calcAmostra(x, P); });
    var tab = am.map(function (o) {
      var t = { soma: o.soma, perda: o.perda };
      PEN.forEach(function (mm, j) { t["p" + ch(mm)] = o.pass[j]; });
      return t;
    });
    var completas = am.filter(function (o) { return o.completa; });
    var med = PEN.map(function (mm, j) { return media(completas.map(function (o) { return o.pass[j]; })); });
    var D = med.map(function (m, j) { return ok(m) ? m - ORIG[j] : NaN; });
    var somaD = completas.length ? D.reduce(function (a, b) { return a + b; }, 0) : NaN;
    var id = ok(somaD) ? somaD / 6 : NaN;   // IDp = ΣD / 6 (seção 6)

    am.forEach(function (o, i) {
      var r = "Amostra " + (i + 1) + ": ";
      if (P.entrada !== "pct") {
        if (ok(o.soma) && o.soma > o.m0 * 1.001) avisos.push(r + "a soma das massas (" + fmt(o.soma, 0) + " g) supera a massa da amostra (" + fmt(o.m0, 0) + " g) — confira as pesagens.");
        if (ok(o.m0) && Math.abs(o.m0 - MASSA_Q1) > MASSA_Q1 * 0.01) avisos.push(r + "massa de " + fmt(o.m0, 0) + " g; o Quadro 1 prevê 6 000 g (4.1).");
      } else {
        for (var j = 1; j < PEN.length; j++) {
          if (ok(o.pass[j]) && ok(o.pass[j - 1]) && o.pass[j] > o.pass[j - 1]) { avisos.push(r + "% passando cresce da peneira " + nomePen(PEN[j - 1]) + " para a " + nomePen(PEN[j]) + " — confira."); break; }
        }
        if (o.pass.some(function (v) { return ok(v) && (v < 0 || v > 100); })) avisos.push(r + "% passando fora do intervalo 0–100.");
      }
    });
    if (completas.length && completas.length < 3) avisos.push("Devem ser preparadas três amostras para cada ensaio (4.2); há " + completas.length + " completa(s).");
    D.forEach(function (v, j) {
      if (ok(v) && v < -0.5) avisos.push("D negativo na peneira " + nomePen(PEN[j]) + " (" + fmt(v, 1) + "): após a compactação passa menos que na granulometria original — confira a preparação e o peneiramento.");
    });
    var lim = num(P.limite);
    if (ok(id) && ok(lim) && id > lim) avisos.push("IDp = " + fmt(id, 1) + " %, acima do máximo admitido de " + fmt(lim, 1) + " %.");
    return { tab: { am: tab }, resultados: { idp: id, somaD: somaD, media: med, D: D, amostras: am.map(function (o) { return o.pass; }),
      n: completas.length, limite: lim, conforme: ok(id) && ok(lim) ? id <= lim : null }, avisos: avisos };
  }

  // tabela do Quadro 2 (tela e relatório)
  function quadro2(calc, relat) {
    var r = calc.resultados, n = r.amostras.length;
    var h = '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th>Peneira</th><th>Original padronizada</th>' +
      r.amostras.map(function (_, i) { return "<th>AM " + (i + 1) + "</th>"; }).join("") + "<th>Média</th><th>D</th></tr></thead><tbody>";
    PEN.forEach(function (mm, j) {
      h += "<tr><td>" + esc(nomePen(mm)) + "</td><td>" + ORIG[j] + "</td>" + r.amostras.map(function (a) { return "<td>" + fmt(a[j], 1) + "</td>"; }).join("") +
        "<td><b>" + fmt(r.media[j], 1) + "</b></td><td><b>" + fmt(r.D[j], 1) + "</b></td></tr>";
    });
    h += '<tr><td colspan="' + (n + 3) + '" style="text-align:right">ΣD</td><td><b>' + fmt(r.somaD, 1) + "</b></td></tr></tbody></table>";
    return h;
  }

  // curvas granulométricas: original padronizada × média após compactação
  function grafico(calc, d, opt) {
    opt = opt || {};
    var r = calc.resultados;
    if (!r.media.some(ok)) return '<div class="fe-graf-vazio">As curvas aparecem com as massas retidas (ou % passando) de ao menos uma amostra.</div>';
    var W = opt.w || 560, H = opt.h || 300, m = { l: 46, r: 16, t: 14, b: 44 };
    var x0 = Math.log10(0.05), x1 = Math.log10(30);
    function X(mm) { return m.l + (Math.log10(mm) - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / 100 * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cor = imp ? "#1f5fbf" : "#4f8cff", corO = imp ? "#666" : "#9aa3b2";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    PEN.concat([25]).forEach(function (mm) {
      s += '<line x1="' + X(mm) + '" y1="' + m.t + '" x2="' + X(mm) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(mm) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + fmt(mm, mm < 1 ? 3 : mm < 10 ? 1 : 0).replace(/,?0+$/, "") + "</text>";
    });
    for (var v = 0; v <= 100; v += 10) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + v + "</text>";
    }
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Abertura da peneira (mm) — escala logarítmica</text>' +
      '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">% passando</text>';
    function linha(vals, extra) {
      var pts = [[25, 100]].concat(PEN.map(function (mm, j) { return [mm, vals[j]]; })).filter(function (p) { return ok(p[1]); });
      return '<path d="' + pts.map(function (p, k) { return (k ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ") + '" fill="none" ' + extra + "/>";
    }
    if (r.amostras.length > 1) r.amostras.forEach(function (a) { s += linha(a, 'stroke="' + txt + '" stroke-width="1" stroke-dasharray="2 3" opacity="0.6"'); });
    s += linha(ORIG, 'stroke="' + corO + '" stroke-width="1.8" stroke-dasharray="6 4"');
    s += linha(r.media, 'stroke="' + cor + '" stroke-width="2.2"');
    PEN.forEach(function (mm, j) { if (ok(r.media[j])) s += '<circle cx="' + X(mm) + '" cy="' + Y(r.media[j]) + '" r="3.2" fill="' + cor + '"/>'; });
    s += '<text x="' + (m.l + 8) + '" y="' + (m.t + 14) + '" fill="' + cor + '">— média após compactação</text>' +
      '<text x="' + (m.l + 8) + '" y="' + (m.t + 28) + '" fill="' + corO + '">- - original padronizada (Quadro 2)</text>';
    return s + "</svg>";
  }

  // exemplo: massas retidas geradas a partir de % passando-alvo e de uma pequena perda na lavagem
  function massas(m0, pass, perda) {
    var o = { m0: String(m0) }, ant = 100;
    PEN.forEach(function (mm, j) { o["r" + ch(mm)] = String(Math.round((ant - pass[j]) / 100 * m0)); ant = pass[j]; });
    o.fundo = String(Math.round(ant / 100 * m0 - perda));
    return o;
  }

  FE.FICHAS["dner-me-398-99"] = {
    titulo: "Índice de degradação após compactação Proctor (IDp)",
    resumo: "Três amostras de rocha britada na granulometria padrão (Quadro 1, 6 000 g), compactadas no cilindro Proctor com disco espaçador em 5 camadas × 26 golpes; D = % passando médio após compactação − original, por peneira; IDp = ΣD / 6.",
    blocos: [],
    params: [
      { k: "material", r: "Rocha / agregado ensaiado", ph: "ex.: brita graduada de gnaisse" },
      { k: "entrada", r: "Entrada do peneiramento após compactação", tipo: "select", recarrega: true,
        opcoes: [["massas", "Massas retidas em cada peneira (g)"], ["pct", "% passando já calculado"]] },
      { k: "massaBase", r: "Massa da amostra — padrão das colunas (g)", ph: "6000",
        dica: "Quadro 1: 6 000 g; base do % passando quando a coluna não informa a massa", se: function (d) { return (d.params || {}).entrada !== "pct"; } },
      { k: "limite", r: "IDp máximo admitido (%) — opcional", dica: "da especificação de serviço ou do projeto; a norma não fixa limite" },
    ],
    padrao: { entrada: "massas" },
    tabelas: function (d) {
      var P = d.params || {}, linhas;
      if (P.entrada === "pct") {
        linhas = [{ grupo: "Granulometria após compactação — % passando (Quadro 2)" }].concat(PEN.map(function (mm) {
          return { k: "q" + ch(mm), r: "Passando na " + nomePen(mm), u: "%" };
        }));
      } else {
        linhas = [{ grupo: "Amostra (Quadro 1; 5.3)" },
          { k: "m0", r: "Massa da amostra — base do % passando", u: "g", padrao: "massaBase", padraoFixo: String(MASSA_Q1) },
          { k: "mc", r: "Massa do material compactado (5.3) — registro", u: "g" },
          { grupo: "Peneiramento após compactação — massa retida em cada peneira (não acumulada)" }]
          .concat(PEN.map(function (mm) { return { k: "r" + ch(mm), r: "Retido na " + nomePen(mm), u: "g" }; }))
          .concat([{ k: "fundo", r: "Fundo (passa na nº 200)", u: "g" },
            { calc: "soma", r: "Soma das massas", u: "g", casas: 0 },
            { calc: "perda", r: "Diferença para a massa da amostra (perda)", u: "%", casas: 2 },
            { grupo: "% passando (6 a) — base: massa da amostra" }])
          .concat(PEN.map(function (mm) { return { calc: "p" + ch(mm), r: "Passando na " + nomePen(mm), u: "%", casas: 1, destaque: mm === 0.074 }; }));
      }
      return [{ chave: "am", titulo: "Amostras após compactação (4.2; 6 a)", rotulo: "Amostra", iniciais: 3, min: 1,
        nomes: ["AM 1", "AM 2", "AM 3", "AM 4", "AM 5"], linhas: linhas,
        dica: "três amostras por ensaio; peneire todo o material da amostra após a compactação" }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.idp, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">IDp = ΣD / 6 — média de ' + r.n + " amostra(s)" +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.somaD, 1) + '</div><div class="fe-res-r">ΣD (6 d)</div></div></div>' + quadro2(calc, false);
    },
    grafico: grafico,
    relatorio: {
      notas: "Quadro 2: % passando de cada amostra (base: massa da amostra preparada, de modo que a perda no peneiramento conta como fino), média por peneira, D = média − granulometria original padronizada (19 mm 85; 9,5 mm 65; nº 4 50; nº 10 35; nº 40 20; nº 200 5), IDp = ΣD / 6. Compactação no cilindro Proctor (Ø 15,24 cm) com disco espaçador, 5 camadas × 26 golpes, soquete de 4,536 kg caindo de 45,72 cm (5.1–5.2). A norma não fixa arredondamento: IDp com uma casa decimal.",
      parametros: [["Granulometria padrão (Quadro 1)", Q1.map(function (q) { return q[0] + ": " + q[1] + " % (" + q[2] + " g)"; }).join("; ")]],
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Índice de degradação após compactação Proctor (IDp)", fmt(r.idp, 1) + " % — ΣD = " + fmt(r.somaD, 1) + " (" + r.n + " amostras)" +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.limite, 1) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.limite, 1) + " %")]);
        return rows;
      },
      extraHtml: function (calc) { return "<h2>Quadro 2 — Granulometria após compactação</h2>" + quadro2(calc, true); },
    },
    exemplos: [
      { nome: "Brita de gnaisse — três amostras (massas retidas)", dados: function () {
        return { ident: { registro: "EX-IDP-001", obra: "Obra A", origem: "Pedreira X", camada: "Base — brita graduada" },
          params: { material: "Brita de gnaisse", entrada: "massas", massaBase: "6000", limite: "6" },
          am: [Object.assign(massas(6000, [87.9, 68.8, 53.9, 38.2, 22.6, 6.4], 14), { mc: "4712" }),
            Object.assign(massas(6000, [88.4, 69.3, 54.2, 38.9, 23.0, 6.6], 11), { mc: "4698" }),
            Object.assign(massas(6000, [87.6, 68.5, 53.6, 38.4, 22.9, 6.5], 17), { mc: "4725" })] };
      } },
      { nome: "Rocha alterada — % passando digitado, só duas amostras (acima do limite)", dados: function () {
        return { ident: { registro: "EX-IDP-002", origem: "Pedreira Y", camada: "Sub-base" },
          params: { material: "Granito alterado", entrada: "pct", limite: "6" },
          am: [{ q19: "93,1", q9_5: "76,4", q4_8: "61,0", q2: "45,2", q0_42: "28,3", q0_074: "9,8" },
            { q19: "92,5", q9_5: "75,8", q4_8: "60,1", q2: "44,6", q0_42: "27,5", q0_074: "9,4" }] };
      } },
    ],
  };
})();
