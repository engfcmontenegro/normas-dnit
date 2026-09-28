/*
 * Ficha: DNIT 113/2009-ME — Agregado artificial — Potencial de expansão de escória de aciaria.
 * Três CPs (ramo seco, ótima, ramo úmido) na estufa a 71 ± 3 °C: 7 dias submersos + 7 dias saturados;
 * leitura diária do extensômetro; % Exp = (L − Li) / 116,4 × 100 (7.1); taxas por ramo (7.2); total aos 14 dias (7.3).
 * Limites das especificações DNIT 114/115-2009-ES e 406/407-2017-ES. Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ALT = 116.4;  // 7.1
  var DIAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  var LIMITES = {
    esc: { v: 3.0, estrito: true, txt: "escória de aciaria: média de 3 CPs inferior a 3,0 % (DNIT 114 e 115/2009-ES, 5.1.1; DNIT 406 e 407/2017-ES)" },
    mist15: { v: 1.5, estrito: true, txt: "mistura escória + solo: inferior a 1,5 % (DNIT 114 e 115/2009-ES, 5.1.3 e 7.4.1; DNIT 407/2017-ES e 406/2017-ES com N ≤ 5×10⁶: ≤ 1,5 %)" },
    mist10: { v: 1.0, estrito: false, txt: "base com N > 5×10⁶: média de 3 CPs ≤ 1,0 % (DNIT 406/2017-ES)" },
  };

  // expansão (%) em um dia qualquer, interpolando entre as leituras disponíveis (dia 0 = leitura básica)
  function curva(x, alt) {
    var Li = num(x.Li), pts = [];
    if (!ok(Li)) return pts;
    pts.push([0, 0]);
    DIAS.forEach(function (dd) { var L = num(x["d" + dd]); if (ok(L)) pts.push([dd, (L - Li) / alt * 100]); });
    return pts;
  }
  function noDia(pts, dia) {
    for (var i = 0; i < pts.length; i++) {
      if (pts[i][0] === dia) return pts[i][1];
      if (pts[i][0] > dia && i > 0) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (dia - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
    }
    return NaN;
  }

  function grafico(calc, d, opt) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 300, m = { l: 50, r: 16, t: 16, b: 40 };
    var cps = calc.tab.cps.filter(function (o) { return o.pts.length > 1; });
    if (!cps.length) return '<div class="fe-graf-vazio">O gráfico aparece com a leitura básica e as leituras diárias.</div>';
    var lim = calc.resultados.limite;
    var yMax = Math.max.apply(null, cps.map(function (o) { return Math.max.apply(null, o.pts.map(function (p) { return p[1]; })); }).concat(ok(lim) ? [lim] : []));
    var yMin = Math.min(0, Math.min.apply(null, cps.map(function (o) { return Math.min.apply(null, o.pts.map(function (p) { return p[1]; })); })));
    var passo = yMax - yMin > 4 ? 1 : yMax - yMin > 2 ? 0.5 : 0.25;
    var y0 = Math.floor(yMin / passo) * passo, y1 = Math.ceil(yMax * 1.1 / passo) * passo || passo;
    function X(v) { return m.l + v / 14 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", eixo = imp ? "#333" : "var(--text-dim)";
    var cores = imp ? ["#1f5fbf", "#1e8a5a", "#c0392b"] : ["#4f8cff", "#34c38f", "#e5534b"];
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    for (var dx = 0; dx <= 14; dx++) {
      s += '<line x1="' + X(dx) + '" y1="' + m.t + '" x2="' + X(dx) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="' + (dx === 7 ? 0 : 0.6) + '"/>' +
        '<text x="' + X(dx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + dx + "</text>";
    }
    for (var gy = y0; gy <= y1 + 1e-9; gy += passo) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(gy, passo < 0.5 ? 2 : 1) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + eixo + '"/>' +
      '<line x1="' + X(7) + '" y1="' + m.t + '" x2="' + X(7) + '" y2="' + (H - m.b) + '" stroke="' + eixo + '" stroke-dasharray="5 4"/>' +
      '<text x="' + (X(3.5)) + '" y="' + (m.t + 12) + '" text-anchor="middle" fill="' + txt + '">submerso (6.2)</text>' +
      '<text x="' + (X(10.5)) + '" y="' + (m.t + 12) + '" text-anchor="middle" fill="' + txt + '">saturado, não submerso (6.4)</text>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">Tempo (dias)</text>' +
      '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Expansão (%)</text>';
    if (ok(lim)) {
      s += '<line x1="' + m.l + '" y1="' + Y(lim) + '" x2="' + (W - m.r) + '" y2="' + Y(lim) + '" stroke="' + (imp ? "#c77d12" : "#e0a13a") + '" stroke-width="1.5" stroke-dasharray="8 4"/>' +
        '<text x="' + (W - m.r - 4) + '" y="' + (Y(lim) - 4) + '" text-anchor="end" fill="' + (imp ? "#c77d12" : "#e0a13a") + '">limite ' + fmt(lim, 1) + " %</text>";
    }
    calc.tab.cps.forEach(function (o, i) {
      if (o.pts.length < 2) return;
      var c = cores[i % cores.length], dp = "";
      o.pts.forEach(function (p) { dp += (dp ? " L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); });
      s += '<path d="' + dp + '" fill="none" stroke="' + c + '" stroke-width="1.8"/>';
      o.pts.forEach(function (p) { s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3" fill="' + c + '"/>'; });
      s += '<rect x="' + (m.l + 10) + '" y="' + (m.t + 22 + i * 15) + '" width="10" height="10" fill="' + c + '"/>' +
        '<text x="' + (m.l + 25) + '" y="' + (m.t + 31 + i * 15) + '" fill="' + txt + '">' + esc(o.nome) + " — " + fmt(o.exp14, 2) + " %</text>";
    });
    return s + "</svg>";
  }

  FE.FICHAS["dnit-113-2009-me"] = {
    titulo: "Escória de aciaria — Potencial de expansão",
    resumo: "Três CPs compactados (3 camadas × 56 golpes) no ramo seco, na ótima e no ramo úmido; estufa a 71 ± 3 °C, 7 dias submersos e 7 dias saturados, leitura diária; % Exp = (L − Li) / 116,4 × 100; taxas por ramo e expansão total aos 14 dias (7).",
    blocos: [],
    rotuloImportar: function (r) { return "Expansão " + (ok(r.media) ? fmt(r.media, 2) : "—") + " %"; },
    params: [
      { k: "material", r: "Material", ph: "ex.: escória de aciaria LD envelhecida, mistura escória + solo" },
      { k: "limite", r: "Critério de aceitação", tipo: "select", recarrega: true,
        opcoes: [["esc", "Escória: média de 3 CPs < 3,0 % (DNIT 114/115-ES; 406/407-ES)"], ["mist15", "Mistura escória + solo: < 1,5 % (DNIT 114/115-ES; 406/407-ES)"],
          ["mist10", "Base N > 5×10⁶: ≤ 1,0 % (DNIT 406-ES)"], ["outro", "Outro limite (informar)"], ["", "Sem verificação"]] },
      { k: "limOutro", r: "Limite de expansão (%)", se: function (d) { return (d.params || {}).limite === "outro"; } },
      { k: "gsMax", r: "Massa específica aparente seca máxima (g/cm³) — opcional", dica: "curva de compactação da escória (5.1)" },
      { k: "hOt", r: "Umidade ótima (%) — opcional", dica: "confere se os CPs estão no ramo seco, na ótima e no ramo úmido (5.2)" },
      { k: "altura", r: "Altura inicial da amostra para o cálculo (mm)", ph: "116,4", dica: "7.1: a norma divide por 116,4 mm" },
      { k: "estufa", r: "Temperatura da estufa (°C)", ph: "71", dica: "71 ± 3 °C (5.5 e 6.1)" },
      { k: "sobrecarga", r: "Sobrecarga (kg)", ph: "4,54", dica: "10 lb = 4,542 kg (5.4)" },
      { k: "cristais", r: "Formação cristalina na superfície das partículas (6.7)", tipo: "select",
        opcoes: [["", "Não verificado"], ["nao", "Não — sem formação cristalina"], ["sim", "Sim — houve formação cristalina"]] },
    ],
    padrao: { limite: "esc", cristais: "" },
    tabelas: function () {
      var linhas = [
        { grupo: "Moldagem (5.1 e 5.2) — 3 camadas iguais × 56 golpes" },
        { k: "h", r: "Umidade de moldagem", u: "%" },
        { k: "gs", r: "Massa específica aparente seca", u: "g/cm³", ph: "opcional" },
        { grupo: "Leituras do extensômetro (0,01 mm) — estufa a 71 ± 3 °C" },
        { k: "Li", r: "Leitura básica Li — 30 min após a colocação na estufa (6.1)", u: "mm" },
      ].concat(DIAS.map(function (dd) {
        return { k: "d" + dd, r: "Dia " + dd + (dd <= 7 ? " — submerso (6.2, 6.3)" : " — saturado, não submerso (6.4 a 6.6)"), u: "mm" };
      })).concat([
        { grupo: "Expansão — % Exp = (L − Li) / 116,4 × 100 (7.1)" },
        { calc: "exp1", r: "Expansão com 1 dia (Exp₁, Figura 9)", u: "%", casas: 2 },
        { calc: "exp7", r: "Expansão ao fim da fase submersa (Exp₇)", u: "%", casas: 2 },
        { calc: "exp14", r: "Expansão total aos 14 dias (Exp₁₄, 7.3)", u: "%", casas: 2, destaque: true },
        { calc: "tx1", r: "Taxa de expansão — ramo submerso (Exp₇ / 7)", u: "%/dia", casas: 3 },
        { calc: "tx2", r: "Taxa de expansão — ramo saturado ((Exp₁₄ − Exp₇) / 7)", u: "%/dia", casas: 3 },
      ]);
      return [{ chave: "cps", titulo: "Corpos de prova", rotulo: "CP", iniciais: 3, min: 3, fixo: true,
        nomes: ["1 — ramo seco", "2 — umidade ótima", "3 — ramo úmido"], linhas: linhas,
        dica: "leitura ao menos uma vez por dia, de preferência à mesma hora, e não antes de 2 h após a adição de água (6.2, 6.3 e 6.5)" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var alt = ok(num(P.altura)) ? num(P.altura) : ALT;
      if (ok(num(P.altura)) && Math.abs(alt - ALT) > 0.05) avisos.push("Altura de cálculo de " + fmt(alt, 1) + " mm — a norma divide pela altura inicial de 116,4 mm (7.1).");
      var nomes = ["ramo seco", "umidade ótima", "ramo úmido"];
      var cps = (d.cps || []).map(function (x, i) {
        var rot = "CP " + (i + 1) + " (" + nomes[i] + ")", o = { nome: "CP " + (i + 1) + " — " + nomes[i] };
        o.pts = curva(x, alt);
        var dias = o.pts.map(function (p) { return p[0]; });
        o.exp1 = noDia(o.pts, 1);
        o.exp7 = noDia(o.pts, 7);
        o.exp14 = noDia(o.pts, 14);
        o.tx1 = ok(o.exp7) ? o.exp7 / 7 : NaN;
        o.tx2 = ok(o.exp14) && ok(o.exp7) ? (o.exp14 - o.exp7) / 7 : NaN;
        if (o.pts.length > 1) {
          var falta = DIAS.filter(function (dd) { return dias.indexOf(dd) < 0; });
          var ultimo = dias[dias.length - 1];
          if (ultimo < 14) avisos.push(rot + ": última leitura no dia " + ultimo + " — o ensaio vai a 14 dias (7 submerso + 7 saturado, 6.2 e 6.4); a expansão total só sai com a leitura dos 14 dias.");
          var buracos = falta.filter(function (dd) { return dd < ultimo; });
          if (buracos.length) avisos.push(rot + ": sem leitura no(s) dia(s) " + buracos.join(", ") + " — as medidas devem ser anotadas no mínimo uma vez por dia (6.2 e 6.5); valores interpolados.");
        } else if (ok(num(x.Li)) || DIAS.some(function (dd) { return ok(num(x["d" + dd])); })) {
          if (!ok(num(x.Li))) avisos.push(rot + ": falta a leitura básica Li, tomada 30 min após a colocação na estufa (6.1).");
        }
        var h = num(x.h), hOt = num(P.hOt);
        if (ok(h) && ok(hOt)) {
          if (i === 0 && h >= hOt) avisos.push(rot + ": umidade de moldagem de " + fmt(h, 1) + " % não está abaixo da ótima (" + fmt(hOt, 1) + " %) — um CP deve ficar no ramo seco (5.2).");
          if (i === 2 && h <= hOt) avisos.push(rot + ": umidade de moldagem de " + fmt(h, 1) + " % não está acima da ótima (" + fmt(hOt, 1) + " %) — um CP deve ficar no ramo úmido (5.2).");
          if (i === 1 && Math.abs(h - hOt) > 1) avisos.push(rot + ": umidade de moldagem de " + fmt(h, 1) + " % — o CP central deve ser moldado na umidade ótima ou próxima dela (" + fmt(hOt, 1) + " %, 5.2).");
        }
        return o;
      });
      var finais = cps.map(function (o) { return o.exp14; }).filter(ok);
      var med = finais.length ? media(finais) : NaN;
      var L = LIMITES[P.limite], lim = L ? L.v : P.limite === "outro" ? num(P.limOutro) : NaN;
      var estrito = L ? L.estrito : false, conforme = null;
      if (ok(med) && ok(lim)) {
        var mr = Math.round(med * 100) / 100;
        conforme = estrito ? mr < lim : mr <= lim;
        if (!conforme) avisos.push("Expansão média de " + fmt(med, 2) + " % — não atende ao limite " + (estrito ? "< " : "≤ ") + fmt(lim, 1) + " %" + (L ? " (" + L.txt + ")" : "") + ".");
      }
      if (finais.length && finais.length < 3) avisos.push("As especificações usam a média de três corpos de prova; há " + finais.length + " com a leitura dos 14 dias.");
      var est = num(P.estufa);
      if (ok(est) && Math.abs(est - 71) > 3) avisos.push("Estufa a " + fmt(est, 1) + " °C — fora de 71 ± 3 °C (5.5 e 6.1).");
      var sc = num(P.sobrecarga);
      if (ok(sc) && Math.abs(sc - 4.542) > 0.05) avisos.push("Sobrecarga de " + fmt(sc, 2) + " kg — a norma pede 10 lb (4,542 kg, 5.4).");
      if (P.cristais === "sim") avisos.push("Houve formação cristalina na superfície das partículas da escória (6.7) — registre nas observações; indica hidratação de óxidos livres.");
      return { tab: { cps: cps }, resultados: { media: med, individuais: cps.map(function (o) { return o.exp14; }), limite: lim, estrito: estrito, conforme: conforme,
        tx1: media(cps.map(function (o) { return o.tx1; })), tx2: media(cps.map(function (o) { return o.tx2; })) }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados;
      var sel = r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>';
      function cx(v, u, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + (u ? " <small>" + u + "</small>" : "") + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' + cx(fmt(r.media, 2), "%", "Expansão total aos 14 dias — média dos CPs (" + r.individuais.map(function (v) { return fmt(v, 2); }).join("; ") + ")" +
        (ok(r.limite) ? " · limite " + (r.estrito ? "< " : "≤ ") + fmt(r.limite, 1) + " %" : "") + sel) +
        cx(fmt(r.tx1, 3), "%/dia", "Taxa média — ramo submerso (7.2)") + cx(fmt(r.tx2, 3), "%/dia", "Taxa média — ramo saturado (7.2)") + "</div>";
    },
    graficos: function (calc, d, opt) { return [grafico(calc, d, opt)]; },
    relatorio: {
      parametros: [["Moldagem e imersão", "Molde Ø 15,2 cm com disco espaçador de 6,40 cm; 3 camadas × 56 golpes do soquete de 4,5 kg (45,7 cm); papel-filtro, prato perfurado e sobrecarga de 4,542 kg; água a 38 °C; estufa a 71 ± 3 °C (5)"]],
      notas: "% Exp = (L − Li) / 116,4 × 100, com Li = leitura básica 30 min após a colocação na estufa (6.1 e 7.1). Taxas de expansão calculadas em separado para o ramo submerso (dias 0–7) e o saturado não submerso (dias 7–14) (7.2, Figura 9); expansão total = leitura aos 14 dias menos a leitura básica (7.3). Critério de aceitação das especificações: média dos três CPs. Dias sem leitura são interpolados linearmente.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [], L = LIMITES[P.limite];
        if (P.material) rows.push(["Material", P.material]);
        calc.tab.cps.forEach(function (o) { rows.push([o.nome, "Exp₇ " + fmt(o.exp7, 2) + " % · Exp₁₄ " + fmt(o.exp14, 2) + " % · taxas " + fmt(o.tx1, 3) + " / " + fmt(o.tx2, 3) + " %/dia"]); });
        rows.push(["Potencial de expansão (média dos CPs, 14 dias)", fmt(r.media, 2) + " %" + (r.conforme === null ? "" : (r.conforme ? " — atende" : " — NÃO ATENDE") +
          " ao limite " + (r.estrito ? "< " : "≤ ") + fmt(r.limite, 1) + " %" + (L ? " (" + L.txt + ")" : ""))]);
        if (P.cristais) rows.push(["Formação cristalina (6.7)", P.cristais === "sim" ? "sim" : "não"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Escória envelhecida — três CPs, média abaixo de 3 %", dados: function () {
        return gerar({ registro: "EX-ESC-001", obra: "Obra A", origem: "Fornecedor A — pátio de cura", camada: "Sub-base — escória de aciaria", data: "2025-09-01" },
          { material: "Escória de aciaria LD envelhecida", limite: "esc", gsMax: "2,610", hOt: "8,6", estufa: "71", sobrecarga: "4,54", cristais: "nao" },
          [[6.8, 2.555, 0.05, 1.30, 0.55], [8.7, 2.608, 0.04, 1.15, 0.45], [10.5, 2.570, 0.06, 1.05, 0.42]], []);
      } },
      { nome: "Escória pouco curada — média acima de 3 %, leituras faltando e estufa fora da faixa", dados: function () {
        return gerar({ registro: "EX-ESC-002", obra: "Obra B", origem: "Fornecedor B", camada: "Base — escória de aciaria", data: "2025-10-13" },
          { material: "Escória de aciaria LD (lote recente)", limite: "esc", hOt: "8,2", estufa: "66", sobrecarga: "4,54", cristais: "sim" },
          [[8.9, "", 0.03, 2.60, 1.40], [8.3, "", 0.05, 2.35, 1.30], [10.1, "", 0.04, 2.80, 1.55]], [6, 13]);
      } },
    ],
  };

  // leituras a partir de alvos por CP: [h, γs, Li (mm), expansão submersa aos 7 dias (%), acréscimo na fase saturada (%)]
  function gerar(ident, params, alvos, semLeitura) {
    return { ident: ident, params: params, cps: alvos.map(function (a) {
      var o = { h: fmt(a[0], 1), gs: a[1] ? fmt(a[1], 3) : "", Li: fmt(a[2], 2) };
      DIAS.forEach(function (dd) {
        if (semLeitura.indexOf(dd) >= 0) return;
        var e = dd <= 7 ? a[3] * (1 - Math.exp(-dd / 2.2)) / (1 - Math.exp(-7 / 2.2)) : a[3] + a[4] * (1 - Math.exp(-(dd - 7) / 3)) / (1 - Math.exp(-7 / 3));
        o["d" + dd] = fmt(a[2] + e * ALT / 100, 2);
      });
      return o;
    }) };
  }
})();
