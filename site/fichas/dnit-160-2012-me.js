/*
 * Ficha: DNIT 160/2012-ME — Solos — Determinação da expansibilidade.
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * Fração passando na peneira de 0,42 mm, compactada no molde de 15 mm × 60 mm (2 camadas × 50 compressões),
 * absorvendo água por capilaridade pela placa porosa. Expansibilidade = (L1 − L0) / 15 × 100 (seção 6), ao inteiro.
 * Encerramento (5.3 f): duas leituras com intervalo de 2 h iguais ou decrescentes.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var H0 = 15;  // mm — altura inicial (altura do molde)

  // tempo decorrido em minutos: "30 s", "15" ou "15 min", "2 h", "1:30" (h:min), "1d 2h" não é aceito
  function minutos(v) {
    var s = String(v === undefined || v === null ? "" : v).trim().toLowerCase().replace(/\s+/g, "");
    if (!s) return NaN;
    var m = /^(\d+):(\d{1,2})$/.exec(s);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    m = /^([\d.,]+)(s|seg|min|m|h|d)?$/.exec(s);
    if (!m) return NaN;
    var x = num(m[1]);
    return m[2] === "s" || m[2] === "seg" ? x / 60 : m[2] === "h" ? x * 60 : m[2] === "d" ? x * 1440 : x;
  }
  function txtTempo(t) {
    if (!ok(t)) return "—";
    if (t < 1) return fmt(t * 60, 0) + " s";
    if (t < 60) return fmt(t, t % 1 ? 1 : 0) + " min";
    var h = Math.floor(t / 60), mm = Math.round(t - h * 60);
    return h + " h" + (mm ? " " + mm + " min" : "");
  }

  FE.FICHAS["dnit-160-2012-me"] = {
    titulo: "Solos — Expansibilidade",
    resumo: "Fração passando na peneira de 0,42 mm, seca a 60 °C, compactada no molde de 15 mm × 60 mm e umedecida por capilaridade; leituras do extensômetro até estabilizar (duas leituras com 2 h de intervalo iguais ou decrescentes); expansibilidade = (L1 − L0) / 15 × 100, arredondada à unidade.",
    blocos: [],
    params: [
      { k: "unidade", r: "Leituras do extensômetro em", tipo: "select", recarrega: "tabela",
        opcoes: [["div", "Divisões de 0,01 mm (centésimos)"], ["mm", "Milímetros"]], dica: "extensômetro graduado em centésimos de milímetro (4 c)" },
      { k: "aparelho", r: "Aparelho / extensômetro nº", ph: "ex.: nº 3 — força de 100 gf conferida" },
      { k: "tara", r: "Tara no extensômetro (g) — se usada", dica: "sobrecarga para completar 100 gf (4 c, Nota)" },
      { k: "secagem", r: "Secagem da amostra", ph: "60 °C ± 2 °C por cerca de 16 h (5.1 b)" },
      { k: "limite", r: "Expansibilidade máxima admitida (%) — opcional", dica: "da especificação do serviço" },
    ],
    padrao: { unidade: "div" },
    rotuloImportar: function (r) { return "Expansibilidade " + (ok(r.exp) ? fmt(r.exp, 0) + " %" : "—"); },
    tabelas: function (d) {
      var u = (d.params || {}).unidade === "mm" ? "mm" : "div.";
      return [{ chave: "leituras", titulo: "Leituras do extensômetro (5.3 d a f)", rotulo: "Leitura", iniciais: 8, min: 3,
        dica: "1ª coluna = leitura inicial L0, antes de pôr a água (tempo 0). Tempo: \"30 s\", \"15 min\", \"2 h\" ou \"h:min\" (Nota 1). A última coluna preenchida é a leitura final L1.",
        linhas: [
          { k: "t", r: "Tempo decorrido desde a colocação da água", texto: true, ph: "ex.: 15 min" },
          { k: "L", r: "Leitura do extensômetro", u: u },
          { calc: "dh", r: "Variação da altura Δh = L − L0", u: "mm", casas: 2 },
          { calc: "exp", r: "Expansibilidade = Δh / 15 × 100", u: "%", casas: 1, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fator = P.unidade === "mm" ? 1 : 0.01;
      var L = (d.leituras || []).map(function (x, i) {
        var t = i === 0 && !String(x.t || "").trim() ? 0 : minutos(x.t);
        return { t: t, L: num(x.L) * fator, bruto: x.t };
      });
      var L0 = L.length && ok(L[0].L) ? L[0].L : NaN;
      var tab = L.map(function (x) {
        var dh = ok(x.L) && ok(L0) ? x.L - L0 : NaN;
        return { dh: dh, exp: ok(dh) ? dh / H0 * 100 : NaN, t: x.t };
      });
      var val = L.map(function (x, i) { return { t: x.t, L: x.L, i: i }; }).filter(function (x) { return ok(x.L); });
      L.forEach(function (x, i) { if (ok(x.L) && !ok(x.t)) avisos.push("Leitura " + (i + 1) + ": tempo \"" + (x.bruto || "") + "\" não reconhecido (use 30 s, 15 min, 2 h ou h:min)."); });
      for (var i = 1; i < val.length; i++) if (ok(val[i].t) && ok(val[i - 1].t) && val[i].t <= val[i - 1].t) {
        avisos.push("Leitura " + (val[i].i + 1) + ": tempo não posterior ao da leitura anterior — confira a ordem das colunas."); break;
      }
      if (ok(L0) && L0 <= 0) avisos.push("Convém que a leitura inicial seja superior a zero, para assegurar o contato (5.3 d).");
      var fim = val.length >= 2 ? val[val.length - 1] : null, L1 = fim ? fim.L : NaN;
      var exp = ok(L1) && ok(L0) ? (L1 - L0) / H0 * 100 : NaN;   // seção 6
      // 5.3 f: encerra quando duas leituras com intervalo de 2 h dão o mesmo valor ou valores decrescentes
      var estab = null, ref = null;
      if (fim && ok(fim.t)) {
        ref = val.filter(function (x) { return ok(x.t) && Math.abs(fim.t - x.t - 120) <= 10; })[0] || null;
        if (!ref) avisos.push("Não há leitura feita 2 h antes da leitura final: a norma só encerra o ensaio quando duas leituras com intervalo de 2 h dão o mesmo valor ou valores decrescentes (5.3 f).");
        else {
          estab = fim.L <= ref.L + 1e-9;
          if (!estab) avisos.push("A leitura final (" + fmt(fim.L, 2) + " mm) ainda é maior que a de 2 h antes (" + fmt(ref.L, 2) +
            " mm): a expansão não terminou — prossiga com as leituras (5.3 f).");
        }
      }
      var expMax = Math.max.apply(null, tab.map(function (x) { return x.exp; }).filter(ok).concat([-Infinity]));
      if (ok(exp) && expMax > exp + 0.05) avisos.push("Houve ligeira contração depois do máximo (" + fmt(expMax, 1) + " %) — ocorrência prevista na Nota 2; o resultado usa a leitura final.");
      var final = ok(exp) ? Math.round(exp) : NaN, lim = num(P.limite);
      if (ok(final) && ok(lim) && final > lim) avisos.push("Expansibilidade de " + final + " %, acima da máxima admitida de " + fmt(lim, 0) + " %.");
      return { tab: { leituras: tab }, pontos: tab, resultados: { exp: final, expExata: exp, L0: L0, L1: L1, tFinal: fim ? fim.t : NaN,
        estabilizado: estab, expMax: isFinite(expMax) ? expMax : NaN, limite: lim, conforme: ok(final) && ok(lim) ? final <= lim : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var sit = r.estabilizado === null ? "—" : r.estabilizado ? '<span class="fe-ok">estabilizado</span>' : '<span class="fe-nok">não estabilizado</span>';
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.exp) ? r.exp : "—") + ' <small>%</small></div>' +
        '<div class="fe-res-r">Expansibilidade (seção 6)' + (ok(r.expExata) ? " — " + fmt(r.expExata, 1) + " %" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">acima do máximo</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">L0 ' + fmt(r.L0, 2) + " → L1 " + fmt(r.L1, 2) + ' mm</div><div class="fe-res-r">Leituras inicial e final · ' +
        esc(txtTempo(r.tFinal)) + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + sit + '</div><div class="fe-res-r">Critério de 2 h (5.3 f)</div></div></div>';
    },
    graficos: function (calc, d, opt) { return [grafico(calc, opt || {})]; },
    relatorio: {
      parametros: [["Corpo de prova", "Fração < 0,42 mm, molde Ø 60 mm × 15 mm, 2 camadas × 50 compressões com soquete de mola de 5 kgf; água destilada por capilaridade (5.3)"]],
      notas: "Expansibilidade = Δh / h0 × 100 = (L1 − L0) / 15 × 100, em mm (seção 6), arredondada à unidade. L0 = leitura inicial (antes da água); L1 = leitura final, quando duas leituras com 2 h de intervalo dão o mesmo valor ou valores decrescentes (5.3 f).",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["Expansibilidade", (ok(r.exp) ? r.exp + " %" : "—") + (r.conforme === null ? "" : r.conforme ? " — atende" : " — ACIMA DO MÁXIMO ADMITIDO")],
          ["Leituras inicial / final", fmt(r.L0, 2) + " mm / " + fmt(r.L1, 2) + " mm (" + txtTempo(r.tFinal) + ")"],
          ["Estabilização (5.3 f)", r.estabilizado === null ? "não verificada" : r.estabilizado ? "sim" : "NÃO — ensaio não encerrado"]];
      },
    },
    exemplos: [
      { nome: "Argila expansiva — leituras da Nota 1 (solos mais expansivos), estabilizada", dados: function () {
        var t = ["0", "30 s", "1 min", "2 min", "3 min", "4 min", "5 min", "10 min", "15 min", "20 min", "30 min", "40 min", "50 min", "60 min",
          "2 h", "3 h", "4 h", "5 h", "6 h", "7 h", "9 h", "11 h"];
        var L = [52, 60, 66, 76, 84, 91, 97, 120, 138, 152, 173, 188, 199, 208, 238, 252, 259, 263, 265, 266, 266, 266];
        return { ident: { registro: "EX-EXP-001", camada: "Subleito — argila", origem: "Corte km 12" },
          params: { unidade: "div", aparelho: "nº 1", secagem: "60 °C por 16 h", limite: "" },
          leituras: t.map(function (x, i) { return { t: x, L: String(L[i]) }; }) };
      } },
      { nome: "Solo siltoso — expansão baixa com ligeira contração final (Nota 2)", dados: function () {
        var t = ["0", "15 min", "30 min", "45 min", "1 h", "2 h", "3 h", "4 h", "6 h", "8 h"];
        var L = [1.20, 1.31, 1.37, 1.41, 1.44, 1.52, 1.55, 1.56, 1.55, 1.54];
        return { ident: { registro: "EX-EXP-002", camada: "Aterro — silte arenoso", origem: "Jazida 3" },
          params: { unidade: "mm", aparelho: "nº 2", limite: "2" },
          leituras: t.map(function (x, i) { return { t: x, L: fmt(L[i], 2) }; }) };
      } },
      { nome: "Argila — ensaio interrompido antes de estabilizar, acima do máximo", dados: function () {
        var t = ["0", "15 min", "30 min", "1 h", "2 h", "3 h", "4 h", "6 h"];
        var L = [35, 70, 95, 130, 172, 196, 211, 229];
        return { ident: { registro: "EX-EXP-003", camada: "Subleito — argila", origem: "Corte km 20" },
          params: { unidade: "div", aparelho: "nº 1", limite: "10" },
          leituras: t.map(function (x, i) { return { t: x, L: String(L[i]) }; }) };
      } },
    ],
  };

  // expansibilidade (%) × tempo (escala logarítmica a partir de 0,5 min)
  function grafico(calc, opt) {
    var pts = calc.tab.leituras.filter(function (x) { return ok(x.t) && x.t > 0 && ok(x.exp); });
    if (!pts.length) return '<div class="fe-graf-vazio">A curva aparece com as leituras e os tempos.</div>';
    var W = opt.w || 560, H = opt.h || 300, m = { l: 48, r: 16, t: 14, b: 42 };
    var t0 = Math.min(0.5, pts[0].t), t1 = Math.max.apply(null, pts.map(function (p) { return p.t; })) * 1.3;
    var lx0 = Math.log10(t0), lx1 = Math.log10(t1);
    var yMax = Math.max.apply(null, pts.map(function (p) { return p.exp; }).concat([1]));
    var passo = yMax > 20 ? 5 : yMax > 8 ? 2 : yMax > 3 ? 1 : 0.5, y1 = Math.ceil(yMax * 1.1 / passo) * passo;
    var yMin = Math.min(0, Math.min.apply(null, pts.map(function (p) { return p.exp; })));
    var y0 = Math.floor(yMin / passo) * passo;
    function X(t) { return m.l + (Math.log10(t) - lx0) / (lx1 - lx0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    [[0.5, "30 s"], [1, "1 min"], [5, "5 min"], [15, "15 min"], [60, "1 h"], [240, "4 h"], [1440, "24 h"], [2880, "48 h"], [5760, "96 h"]].forEach(function (g) {
      if (g[0] < t0 || g[0] > t1) return;
      s += '<line x1="' + X(g[0]) + '" y1="' + m.t + '" x2="' + X(g[0]) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(g[0]) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + g[1] + "</text>";
    });
    for (var v = y0; v <= y1 + 1e-9; v += passo) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(v, passo < 1 ? 1 : 0) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
    s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Tempo (escala logarítmica)</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Expansibilidade (%)</text>';
    s += '<path d="' + pts.map(function (p, i) { return (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.exp).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="2"/>';
    pts.forEach(function (p) { s += '<circle cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.exp).toFixed(1) + '" r="3" fill="' + cor + '"/>'; });
    var r = calc.resultados;
    if (ok(r.exp)) s += '<text x="' + (W - m.r - 6) + '" y="' + (m.t + 14) + '" text-anchor="end" fill="' + cor + '" font-weight="bold">Expansibilidade = ' + r.exp + " %</text>";
    return s + "</svg>";
  }
})();
