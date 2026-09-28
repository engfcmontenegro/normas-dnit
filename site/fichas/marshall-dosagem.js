/*
 * Ficha: dosagem Marshall / controle de concreto asfáltico usinado a quente.
 * Registrada em DNIT 385/2026-ES (concreto asfáltico com ligante modificado por polímero), a especificação de
 * concreto asfáltico mais recente do acervo: é ela que fixa a dosagem com CPs da DNIT 178/2018-PRO (5.2) e os
 * requisitos de projeto (Tabela 4: Vv 3–5 %, RBV 65–75 %, estabilidade ≥ 700 kgf a 75 golpes; Tabela 5: VAM mínimo
 * por TNM, interpolado pelo Vv). A DNER-ME 043/95 (ensaio Marshall a quente), a DNIT 447-ME e a DNIT 449-PRO que a
 * ES cita, e a DNIT 031-ES (CA convencional) não estão no acervo.
 * Presets alternativos: DNIT 112/2009-ES (CA asfalto-borracha — Tabelas 2 e 3, cita a DNER-ME 043) e limites livres.
 * Fator de correção da estabilidade: Tabela anexa da DNER-ME 107/94 (a mesma correção espessura × fator do Marshall),
 * pela altura do CP ou pela altura equivalente ao volume (V / área do molde de 101,6 mm).
 * Densidade aparente: DNIT 428/2022-ME eq. 6 e 7; Vv: DNIT 428 eq. 12.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // ---------- fator de correção da estabilidade — DNER-ME 107/94, Tabela anexa (p. 05/09): [espessura mm, fator] ----------
  var TAB_FATOR = [[50.8, 1.46], [51.0, 1.45], [51.2, 1.44], [51.6, 1.43], [51.8, 1.42], [52.0, 1.41], [52.2, 1.40], [52.4, 1.39],
    [52.6, 1.38], [52.9, 1.37], [53.1, 1.36], [53.3, 1.35], [53.5, 1.34], [53.8, 1.33], [54.0, 1.32], [54.2, 1.31], [54.5, 1.30],
    [54.7, 1.29], [54.9, 1.28], [55.1, 1.27], [55.4, 1.26], [55.6, 1.25], [55.8, 1.24], [56.1, 1.23], [56.3, 1.22], [56.6, 1.21],
    [56.8, 1.20], [57.1, 1.19], [57.4, 1.18], [57.7, 1.17], [58.1, 1.16], [58.4, 1.15], [58.7, 1.14], [59.0, 1.13], [59.3, 1.12],
    [59.7, 1.11], [60.0, 1.10], [60.3, 1.09], [60.6, 1.08], [60.9, 1.07], [61.1, 1.06], [61.4, 1.05], [61.9, 1.04], [62.3, 1.03],
    [62.7, 1.02], [63.1, 1.01], [63.5, 1.00], [63.9, 0.99], [64.3, 0.98], [64.7, 0.97], [65.1, 0.96], [65.6, 0.95], [66.1, 0.94],
    [66.7, 0.93], [67.1, 0.92], [67.5, 0.91], [67.9, 0.90], [68.3, 0.89], [68.8, 0.88], [69.3, 0.87], [69.8, 0.86], [70.3, 0.85],
    [70.8, 0.84], [71.4, 0.83], [72.2, 0.82], [73.0, 0.81], [73.5, 0.80], [74.0, 0.79], [74.6, 0.78], [75.4, 0.77], [76.2, 0.76]];
  function fatorEspessura(h, modo) {
    if (!ok(h) || h <= 0) return { f: NaN };
    if (modo === "formula") return { f: 927.23 * Math.pow(h, -1.64) };
    if (h < TAB_FATOR[0][0] || h > TAB_FATOR[TAB_FATOR.length - 1][0]) return { f: 927.23 * Math.pow(h, -1.64), fora: true };
    if (modo === "proxima") {
      var m = TAB_FATOR[0];
      TAB_FATOR.forEach(function (x) { if (Math.abs(x[0] - h) < Math.abs(m[0] - h) - 1e-9) m = x; });
      return { f: m[1] };
    }
    for (var i = 1; i < TAB_FATOR.length; i++) {
      if (h <= TAB_FATOR[i][0]) { var a = TAB_FATOR[i - 1], b = TAB_FATOR[i]; return { f: a[1] + (b[1] - a[1]) * (h - a[0]) / (b[0] - a[0]) }; }
    }
    return { f: NaN };
  }
  var AREA_MOLDE = Math.PI * 50.8 * 50.8 / 100;  // cm² — molde Marshall de 101,6 mm

  // ---------- especificações ----------
  // VAM mínimo: {TNM: [valores para cada Vv de vvCols]}
  var VAM_385 = { vv: [3, 4, 5], t: { "25": [11, 12, 13], "19": [12, 13, 14], "12.5": [13, 14, 15], "9.5": [14, 15, 16] } };
  var VAM_112 = { vv: [3, 4, 5, 6], t: { "37.5": [10, 11, 12, 13], "25": [11, 12, 13, 14], "19": [12, 13, 14, 15], "12.5": [13, 14, 15, 16],
    "9.5": [14, 15, 16, 17], "4.75": [16, 17, 18, 19], "2.36": [19, 20, 21, 22], "1.18": [21.5, 22.5, 23.5, 24.5] } };
  var NOME_TNM = { "37.5": "1 ½\" — 37,5 mm", "25": "1\" — 25 mm", "19": "¾\" — 19 mm", "12.5": "½\" — 12,5 mm", "9.5": "⅜\" — 9,5 mm",
    "4.75": "nº 4 — 4,75 mm", "2.36": "nº 8 — 2,36 mm", "1.18": "1,18 mm" };
  var ES = {
    "385": { nome: "DNIT 385/2026-ES — CA com ligante modificado por polímero (Tabelas 4 e 5)", cod: "DNIT 385/2026-ES",
      vv: [3, 5], rbv: [65, 75], est: 700, vam: VAM_385, sec: "Tabela 4", secVam: "Tabela 5", ouVam: false },
    "112r": { nome: "DNIT 112/2009-ES — CA asfalto-borracha, camada de rolamento (Tabelas 2 e 3)", cod: "DNIT 112/2009-ES",
      vv: [3, 5], rbv: [65, 78], est: 800, vam: VAM_112, sec: "Tabela 2", secVam: "Tabela 3", ouVam: true },
    "112g": { nome: "DNIT 112/2009-ES — rolamento \"gap graded\" (Tabelas 2 e 3)", cod: "DNIT 112/2009-ES",
      vv: [4, 6], rbv: [65, 78], est: 700, vam: VAM_112, sec: "Tabela 2", secVam: "Tabela 3", ouVam: true },
    "112b": { nome: "DNIT 112/2009-ES — camada de ligação (binder) (Tabelas 2 e 3)", cod: "DNIT 112/2009-ES",
      vv: [4, 6], rbv: [65, 78], est: 700, vam: VAM_112, sec: "Tabela 2", secVam: "Tabela 3", ouVam: true },
    livre: { nome: "Outra — limites digitados (VAM pela Tabela 3 da DNIT 112/2009-ES)", cod: "limites do projeto",
      vv: [NaN, NaN], rbv: [NaN, NaN], est: NaN, vam: VAM_112, sec: "projeto", secVam: "DNIT 112, Tabela 3", ouVam: false },
  };
  function vamMinimo(vamTab, tnm, vv) {
    var linha = vamTab.t[tnm];
    if (!linha || !ok(vv)) return NaN;
    var cols = vamTab.vv, v = Math.min(Math.max(vv, cols[0]), cols[cols.length - 1]);  // fora da tabela: extremo mais próximo
    for (var i = 1; i < cols.length; i++) {
      if (v <= cols[i]) return linha[i - 1] + (linha[i] - linha[i - 1]) * (v - cols[i - 1]) / (cols[i] - cols[i - 1]);
    }
    return linha[linha.length - 1];
  }
  var ctxD = null;  // dados do ensaio em tela (para os textos de exemplo dos limites)
  function limites(P) {
    var e = ES[P.es || "385"] || ES["385"];
    function v(k, pad) { var x = num(P[k]); return ok(x) ? x : pad; }
    var tnm = e.vam.t[P.tnm] ? P.tnm : null;
    return { es: e, tnm: tnm, vvMin: v("vvMin", e.vv[0]), vvMax: v("vvMax", e.vv[1]), rbvMin: v("rbvMin", e.rbv[0]), rbvMax: v("rbvMax", e.rbv[1]),
      estMin: v("estMin", e.est), vamFixo: num(P.vamMin), fluMin: num(P.fluMin), fluMax: num(P.fluMax),
      vamMin: function (vv) { var f = num(P.vamMin); return ok(f) ? f : tnm ? vamMinimo(e.vam, tnm, vv) : NaN; } };
  }
  function padraoLim(k) {
    var P = (ctxD && ctxD.params) || {}, e = ES[P.es || "385"] || ES["385"];
    var m = { vvMin: e.vv[0], vvMax: e.vv[1], rbvMin: e.rbv[0], rbvMax: e.rbv[1], estMin: e.est }[k];
    return ok(m) ? "padrão " + fmt(m, 0) + " (" + e.cod + ")" : "informe o limite do projeto";
  }

  // ---------- ajustes ----------
  function ajustar(xs, ys, tipo) {
    var n = xs.length;
    if (n < 2) return null;
    if (tipo === "parabola" && n >= 3) {
      var q = FE.parabola(xs, ys);
      if (q) return { a: q.a, b: q.b, c: q.c };
    }
    var mx = media(xs), my = media(ys), sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    if (!sxx) return null;
    var b = sxy / sxx;
    return { a: 0, b: b, c: my - b * mx };
  }
  function val(fit, x) { return fit ? fit.a * x * x + fit.b * x + fit.c : NaN; }
  // x onde o ajuste vale y (no intervalo [lo, hi]; na parábola, a raiz mais próxima do centro)
  function resolver(fit, y, lo, hi) {
    if (!fit || !ok(y)) return NaN;
    var r = [];
    if (Math.abs(fit.a) < 1e-12) { if (fit.b) r.push((y - fit.c) / fit.b); }
    else {
      var D = fit.b * fit.b - 4 * fit.a * (fit.c - y);
      if (D >= 0) { r.push((-fit.b + Math.sqrt(D)) / (2 * fit.a)); r.push((-fit.b - Math.sqrt(D)) / (2 * fit.a)); }
    }
    var meio = (lo + hi) / 2;
    r = r.filter(function (x) { return x >= lo - 1e-9 && x <= hi + 1e-9; }).sort(function (a, b) { return Math.abs(a - meio) - Math.abs(b - meio); });
    return r.length ? r[0] : NaN;
  }

  // ---------- leitura da prensa ----------
  function cargaAnel(P, leitura) {
    if (!ok(leitura)) return NaN;
    var tab = FE.curvaSpeedy(P.aferTabela);
    if (tab.length >= 2) return FE.interpolar([[0, 0]].concat(tab), leitura);
    var K = num(P.aferK);
    return ok(K) ? K * leitura : NaN;
  }

  var CRIT = [["centro", "Centro da faixa comum de Vv e RBV (média dos dois teores centrais)"], ["vvAlvo", "Teor para o Vv alvo"]];
  var params = [
    { k: "es", r: "Especificação de referência (limites)", tipo: "select", recarrega: true, opcoes: Object.keys(ES).map(function (k) { return [k, ES[k].nome]; }) },
    { k: "tnm", r: "Tamanho máximo nominal (TNM) da mistura", tipo: "select",
      opcoes: function (d) { var e = ES[(d.params || {}).es || "385"] || ES["385"]; return [["", "—"]].concat(Object.keys(e.vam.t).sort(function (a, b) { return b - a; }).map(function (k) { return [k, NOME_TNM[k]]; })); },
      dica: "define o VAM mínimo (interpolado pelo Vv)" },
    { k: "ligante", r: "Ligante asfáltico", ph: "ex.: CAP 30/45; 60/85-E" },
    { k: "golpes", r: "Golpes por face (DNIT 178-PRO, 5.5.3.2 a)", tipo: "select", opcoes: [["75", "75 golpes"], ["50", "50 golpes"]] },
    { k: "tComp", r: "Temperatura de compactação (°C)", ph: "ex.: 150" },
    { k: "base", r: "Teor de ligante expresso em relação a", tipo: "select",
      opcoes: [["mistura", "Mistura total = 100 % (DNIT 385, 5.2)"], ["agregados", "Agregados = 100 % (DNIT 112, 5.2)"]] },
    { k: "gb", r: "Densidade do ligante (Gb)", ph: "ex.: 1,020", dica: "a 25 °C; entra na DMT e nos vazios cheios de betume" },
    { k: "dmtModo", r: "Densidade máxima (DMT / Gmm)", tipo: "select", recarrega: true,
      opcoes: [["calc", "DMT calculada pelas densidades dos agregados e do ligante"], ["medido", "Gmm medida (DNIT 427-ME, Rice) por CP/teor"]] },
    { k: "rhoW", r: "Massa específica da água (g/cm³)", ph: "0,9971", dica: "DNIT 428 eq. 7 (25 °C): MEa = 0,9971 × Gmb" },
    { k: "aferK", r: "Prensa — constante do anel (kgf por divisão)", dica: "estabilidade lida = K × leitura máxima" },
    { k: "aferTabela", r: "…ou tabela de calibração do anel (leitura = kgf)", ph: "100=205; 500=1020", dica: "substitui a constante; interpolação linear" },
    { k: "fator", r: "Correção da estabilidade", tipo: "select",
      opcoes: [["tabela", "Pela altura — Tabela da DNER-ME 107/94, interpolação linear"], ["proxima", "Pela altura — Tabela da DNER-ME 107/94, espessura mais próxima"],
        ["volume", "Pelo volume — altura equivalente V / área (Ø 101,6 mm) na mesma Tabela"], ["formula", "Fórmula f = 927,23 h^−1,64 (DNER-ME 107/94)"]] },
    { k: "medidor", r: "Divisão do medidor de fluência (mm)", ph: "0,01", dica: "fluência = (final − inicial) × divisão" },
    { k: "criterio", r: "Critério do teor ótimo", tipo: "select", recarrega: true, opcoes: CRIT },
    { k: "vvAlvo", r: "Vv alvo (%)", ph: "centro da faixa de Vv", se: function (d) { return (d.params || {}).criterio === "vvAlvo"; } },
    { k: "ajuste", r: "Ajuste das curvas Vv × teor e RBV × teor", tipo: "select",
      opcoes: [["linear", "Reta de mínimos quadrados"], ["parabola", "Parábola de mínimos quadrados"]], dica: "estabilidade, massa específica, VAM e fluência: parábola (≥ 3 teores)" },
    { k: "teorProj", r: "Teor de projeto (%) — controle, opcional", dica: "com um só teor: verifica a tolerância de ± 0,3 % (DNIT 385, 5.2 e 7)" },
    { k: "vvMin", r: "Vv mínimo (%)", phK: "vvMin" }, { k: "vvMax", r: "Vv máximo (%)", phK: "vvMax" },
    { k: "rbvMin", r: "RBV mínima (%)", phK: "rbvMin" }, { k: "rbvMax", r: "RBV máxima (%)", phK: "rbvMax" },
    { k: "estMin", r: "Estabilidade mínima (kgf)", phK: "estMin" },
    { k: "vamMin", r: "VAM mínimo (%) — opcional", ph: "tabela da ES pelo TNM e Vv", dica: "preencha só para substituir a tabela" },
    { k: "fluMin", r: "Fluência mínima (mm) — opcional" }, { k: "fluMax", r: "Fluência máxima (mm) — opcional" },
  ];
  params.forEach(function (f) {
    if (f.phK) {
      Object.defineProperty(f, "ph", { get: function () { return padraoLim(f.phK); } });
      f.dica = "vazio = padrão da especificação escolhida";
    }
  });

  FE.FICHAS["dnit-385-2026-es"] = {
    titulo: "Concreto asfáltico — dosagem Marshall e controle (Gmb, DMT, Vv, VAM, RBV, estabilidade, fluência)",
    // resumo na lista de importação (aceitação de lote da DNIT 385-ES)
    rotuloImportar: function (r) { var t = (r.teores || []); if (t.length !== 1) return t.length + " teores" + (r.ot && FE.ok(r.ot.teor) ? " · ótimo " + FE.fmt(r.ot.teor, 2) + " %" : ""); t = t[0]; return "teor " + FE.fmt(t.teor, 1) + " % · Vv " + FE.fmt(t.vv, 1) + " % · RBV " + FE.fmt(t.rbv, 0) + " %"; },
    resumo: "CPs por teor de ligante: Gmb por pesagem ao ar e imersa, DMT calculada ou Gmm medida, Vv, VAM, RBV, estabilidade corrigida e fluência; curvas por teor, teor ótimo e verificação dos limites da especificação.",
    blocos: [],
    params: params,
    padrao: { es: "385", golpes: "75", base: "mistura", dmtModo: "calc", fator: "tabela", criterio: "centro", ajuste: "linear" },
    tabelas: function (d) {
      ctxD = d;
      var P = d.params || {}, T = [];
      if ((P.dmtModo || "calc") === "calc") {
        T.push({ chave: "agr", titulo: "Agregados da mistura — proporções e densidades (para a DMT)", rotulo: "Material", iniciais: 4, min: 1,
          dica: "uma coluna por agregado/fíler; proporções na mistura de agregados (soma 100 %)",
          linhas: [{ k: "nome", r: "Material", texto: true }, { k: "pct", r: "Proporção na mistura de agregados", u: "%" },
            { k: "g", r: "Densidade real (Gsa — DNIT 411/413-ME)", u: "—" }, { calc: "pm", r: "Proporção na mistura total no 1º teor", u: "%", casas: 2 }] });
      }
      var L = [{ grupo: "Moldagem (DNIT 178-PRO)" }, { k: "teor", r: "Teor de ligante", u: "%" },
        { k: "h", r: "Altura do CP (média das leituras)", u: "mm" },
        { grupo: "Densidade relativa aparente — DNIT 428-ME" },
        { k: "A", r: "Massa seca ao ar (A)", u: "g" }, { k: "B", r: "Massa imersa em água (B)", u: "g" }, { k: "C", r: "Massa saturada superfície seca (C)", u: "g" },
        { calc: "abs", r: "Água absorvida = 100 (C − A) / (C − B) (eq. 1)", u: "%", casas: 1 },
        { calc: "vol", r: "Volume = (C − B) / ρágua", u: "cm³", casas: 1 },
        { calc: "gmb", r: "Gmb = A / (C − B) (eq. 6)", u: "—", casas: 4, destaque: true },
        { calc: "mea", r: "Massa específica aparente = 0,9971 × Gmb (eq. 7)", u: "g/cm³", casas: 4 },
        { grupo: "Parâmetros volumétricos" }];
      if (P.dmtModo === "medido") L.push({ k: "gmm", r: "Gmm medida (DNIT 427-ME)", u: "—" });
      L.push({ calc: "dmt", r: P.dmtModo === "medido" ? "Densidade máxima usada" : "DMT = 100 / (Pag/Gag + Pb/Gb)", u: "—", casas: 4 },
        { calc: "vv", r: "Vv = (1 − Gmb / DMT) × 100 (DNIT 428 eq. 12)", u: "%", casas: 2, destaque: true },
        { calc: "vcb", r: "Vazios cheios de betume VCB = Gmb × Pb / Gb", u: "%", casas: 2 },
        { calc: "vam", r: "VAM = Vv + VCB", u: "%", casas: 2 },
        { calc: "rbv", r: "RBV = VCB / VAM × 100", u: "%", casas: 1 },
        { grupo: "Estabilidade e fluência" },
        { k: "leit", r: "Leitura máxima do anel", u: "div." }, { k: "cargaMan", r: "…ou estabilidade lida informada", u: "kgf", ph: "auto" },
        { calc: "carga", r: "Estabilidade lida", u: "kgf", casas: 0 },
        { k: "fMan", r: "Fator de correção informado (opcional)", u: "—", ph: "auto" },
        { calc: "f", r: "Fator de correção (altura / volume)", u: "—", casas: 3 },
        { calc: "est", r: "Estabilidade corrigida = lida × fator", u: "kgf", casas: 0, destaque: true },
        { k: "fl0", r: "Fluência — leitura inicial", u: "div." }, { k: "fl1", r: "Fluência — leitura na ruptura", u: "div." },
        { k: "fluMan", r: "…ou fluência informada", u: "mm", ph: "auto" },
        { calc: "flu", r: "Fluência", u: "mm", casas: 2 });
      T.push({ chave: "cps", titulo: "Corpos de prova", rotulo: "CP", iniciais: 15, min: 1, usar: true, linhas: L,
        dica: "uma coluna por CP (ex.: 5 teores × 3 CPs); CPs com o mesmo teor formam a média do teor. Desmarque \"usar\" para excluir um CP." });
      return T;
    },
    calcular: function (d) {
      ctxD = d;
      var P = d.params || {}, avisos = [], L = limites(P);
      var gb = num(P.gb), rho = ok(num(P.rhoW)) ? num(P.rhoW) : 0.9971, divFl = ok(num(P.medidor)) ? num(P.medidor) : 0.01;
      var calcDmt = (P.dmtModo || "calc") === "calc", modoF = P.fator || "tabela";
      // agregados: 1/Gag = Σ (pi/Σp) / Gi
      var agr = (d.agr || []).map(function (a) { return { p: num(a.pct), g: num(a.g) }; });
      var usados = agr.filter(function (a) { return ok(a.p) && a.p > 0; }), somaP = usados.reduce(function (s, a) { return s + a.p; }, 0);
      var invGag = usados.every(function (a) { return ok(a.g) && a.g > 0; }) && somaP > 0 ?
        usados.reduce(function (s, a) { return s + a.p / somaP / a.g; }, 0) : NaN;
      if (calcDmt && usados.length && Math.abs(somaP - 100) > 0.05) avisos.push("As proporções dos agregados somam " + fmt(somaP, 2) + " % (deveriam somar 100 %); a DMT foi calculada com as proporções normalizadas.");
      if (calcDmt && usados.length && !ok(invGag)) avisos.push("Informe a densidade real de todos os agregados com proporção para calcular a DMT.");
      if (!ok(gb)) avisos.push("Informe a densidade do ligante (Gb): entra na DMT e nos vazios cheios de betume.");
      function pbTotal(t) { return P.base === "agregados" ? t / (100 + t) * 100 : t; }
      function dmtCalc(t) { var pb = pbTotal(t); return ok(invGag) && ok(gb) && ok(pb) ? 100 / ((100 - pb) * invGag + pb / gb) : NaN; }

      var semAfer = false, foraTab = false;
      var cps = (d.cps || []).map(function (p, i) {
        var o = { usar: p.usar !== false }, rot = "CP " + (i + 1);
        o.teor = num(p.teor); o.pb = pbTotal(o.teor);
        var A = num(p.A), B = num(p.B), C = num(p.C), h = num(p.h);
        if (ok(A) && ok(B) && ok(C) && C - B > 0) {
          o.gmb = A / (C - B); o.mea = rho * o.gmb; o.abs = 100 * (C - A) / (C - B); o.vol = (C - B) / rho;
          if (o.abs > 2) avisos.push(rot + ": água absorvida de " + fmt(o.abs, 1) + " % (> 2 %): a Gmb deve ser determinada com película (DNIT 428, 6.2 e 7.2).");
          if (C < A) avisos.push(rot + ": massa saturada superfície seca menor que a massa seca — confira.");
        } else if (ok(A) && ok(B) && !ok(C)) avisos.push(rot + ": falta a massa saturada com superfície seca (C) — DNIT 428 eq. 6.");
        o.dmt = calcDmt ? dmtCalc(o.teor) : num(p.gmm);
        if (ok(o.gmb) && ok(o.dmt)) {
          o.vv = (1 - o.gmb / o.dmt) * 100;
          if (ok(gb) && ok(o.pb)) { o.vcb = o.gmb * o.pb / gb; o.vam = o.vv + o.vcb; o.rbv = o.vcb / o.vam * 100; }
          if (o.vv >= 10) avisos.push(rot + ": Vv ≥ 10 % — a Gmb por superfície seca não se aplica (DNIT 428, 7.3).");
        }
        // estabilidade
        var leit = num(p.leit);
        o.carga = ok(num(p.cargaMan)) ? num(p.cargaMan) : cargaAnel(P, leit);
        if (ok(leit) && !ok(o.carga)) semAfer = true;
        var hRef = modoF === "volume" ? (ok(o.vol) ? o.vol / AREA_MOLDE * 10 : NaN) : h;
        if (modoF === "volume") o.heq = hRef;
        var fr = fatorEspessura(hRef, modoF === "formula" ? "formula" : modoF === "proxima" ? "proxima" : "tabela");
        o.f = ok(num(p.fMan)) ? num(p.fMan) : fr.f;
        if (fr.fora && !ok(num(p.fMan))) foraTab = true;
        o.est = ok(o.carga) && ok(o.f) ? o.carga * o.f : NaN;
        var f0 = num(p.fl0), f1 = num(p.fl1);
        o.flu = ok(num(p.fluMan)) ? num(p.fluMan) : ok(f1) ? (f1 - (ok(f0) ? f0 : 0)) * divFl : NaN;
        if (ok(h) && (h < 58 || h > 70)) avisos.push(rot + ": altura de " + fmt(h, 1) + " mm — o CP Marshall de ~1 200 g tem cerca de 63,5 mm (DNIT 178, 5.3 b).");
        return o;
      });
      if (semAfer) avisos.push("Informe a constante ou a tabela de calibração do anel (ou a estabilidade lida em kgf).");
      if (foraTab) avisos.push("Altura fora da Tabela da DNER-ME 107/94 (50,8 a 76,2 mm): fator pela fórmula f = 927,23 h^−1,64.");

      // proporção na mistura total (1º teor) — informativa
      var t1 = cps.filter(function (o) { return ok(o.pb); })[0];
      var agrCalc = (d.agr || []).map(function (a) { var pp = num(a.pct); return { pm: ok(pp) && t1 && somaP > 0 ? pp / somaP * (100 - t1.pb) : NaN }; });

      // médias por teor
      var grupos = {}, ordem = [];
      cps.forEach(function (o, i) {
        if (!o.usar || !ok(o.teor)) return;
        if (!ok(o.gmb) && !ok(o.est)) return;
        var k = o.teor.toFixed(3);
        if (!grupos[k]) { grupos[k] = { teor: o.teor, cps: [], os: [] }; ordem.push(k); }
        grupos[k].cps.push(i + 1); grupos[k].os.push(o);
      });
      ordem.sort(function (a, b) { return Number(a) - Number(b); });
      var teores = ordem.map(function (k) {
        var g = grupos[k], t = { teor: g.teor, cps: g.cps, n: g.cps.length };
        ["gmb", "mea", "dmt", "vv", "vcb", "est", "flu", "abs"].forEach(function (c) { t[c] = media(g.os.map(function (o) { return o[c]; })); });
        t.vam = t.vv + t.vcb; t.rbv = t.vcb / t.vam * 100;
        verificar(t, L);
        if (t.n < 3) avisos.push("Teor " + fmt(t.teor, 2) + " %: " + t.n + " CP considerado(s); usam-se ao menos três por teor.");
        // dispersão da estabilidade: ±10 % da média (critério da planilha do laboratório, não da norma)
        g.os.forEach(function (o, j) {
          if (ok(o.est) && ok(t.est) && Math.abs(o.est - t.est) / t.est > 0.10) avisos.push("Teor " + fmt(t.teor, 2) + " %: CP " + g.cps[j] + " com estabilidade " + fmt((o.est / t.est - 1) * 100, 0) + " % em relação à média do teor (critério de ± 10 % da planilha do laboratório; não é exigência da norma).");
        });
        return t;
      });

      // teor ótimo
      var res = { teores: teores, lim: L, ot: null, fits: {}, cps: cps };
      var comVol = teores.filter(function (t) { return ok(t.vv) && ok(t.rbv); });
      if (comVol.length >= 3) {
        var xs = comVol.map(function (t) { return t.teor; }), lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
        var tipo = P.ajuste === "parabola" ? "parabola" : "linear";
        var fVv = ajustar(xs, comVol.map(function (t) { return t.vv; }), tipo), fRbv = ajustar(xs, comVol.map(function (t) { return t.rbv; }), tipo);
        res.fits.vv = fVv; res.fits.rbv = fRbv;
        function fitPar(c) { var tt = teores.filter(function (t) { return ok(t[c]); }); return tt.length >= 2 ? ajustar(tt.map(function (t) { return t.teor; }), tt.map(function (t) { return t[c]; }), "parabola") : null; }
        ["mea", "gmb", "est", "flu", "vam", "dmt"].forEach(function (c) { res.fits[c] = fitPar(c); });
        var ext = 0.5;  // extrapolação admitida além dos teores ensaiados
        var ot = { criterio: P.criterio || "centro" };
        if (ot.criterio === "vvAlvo") {
          ot.alvo = ok(num(P.vvAlvo)) ? num(P.vvAlvo) : (L.vvMin + L.vvMax) / 2;
          ot.teor = resolver(fVv, ot.alvo, lo - ext, hi + ext);
          if (!ok(ot.alvo)) avisos.push("Informe o Vv alvo ou os limites de Vv.");
          else if (!ok(ot.teor)) avisos.push("A curva de Vv não passa por " + fmt(ot.alvo, 1) + " % no intervalo de teores ensaiados — ensaie outros teores.");
        } else {
          ot.x = { vvMax: resolver(fVv, L.vvMax, lo - ext, hi + ext), vvMin: resolver(fVv, L.vvMin, lo - ext, hi + ext),
            rbvMin: resolver(fRbv, L.rbvMin, lo - ext, hi + ext), rbvMax: resolver(fRbv, L.rbvMax, lo - ext, hi + ext) };
          var xsOt = [ot.x.vvMax, ot.x.vvMin, ot.x.rbvMin, ot.x.rbvMax];
          if (xsOt.every(ok)) {
            var srt = xsOt.slice().sort(function (a, b) { return a - b; });
            ot.teor = (srt[1] + srt[2]) / 2;
            var iv = [Math.min(ot.x.vvMax, ot.x.vvMin), Math.max(ot.x.vvMax, ot.x.vvMin)], ir = [Math.min(ot.x.rbvMin, ot.x.rbvMax), Math.max(ot.x.rbvMin, ot.x.rbvMax)];
            ot.faixa = [Math.max(iv[0], ir[0]), Math.min(iv[1], ir[1])];
            if (ot.faixa[0] > ot.faixa[1] + 1e-9) {
              avisos.push("Não há teor que atenda ao mesmo tempo à faixa de Vv (" + fmt(iv[0], 2) + " a " + fmt(iv[1], 2) + " %) e à de RBV (" + fmt(ir[0], 2) + " a " + fmt(ir[1], 2) + " %): o teor indicado é a média dos dois centrais, mas a mistura deve ser revista.");
              ot.faixa = null;
            }
          } else if (!ok(L.vvMin) || !ok(L.vvMax) || !ok(L.rbvMin) || !ok(L.rbvMax)) {
            avisos.push("Informe os limites de Vv e de RBV para o critério do teor ótimo.");
          } else {
            avisos.push("As curvas de Vv e/ou RBV não alcançam os limites dentro dos teores ensaiados (± 0,5 %) — ensaie teores mais altos/baixos.");
          }
        }
        if (ok(ot.teor)) {
          var x = ot.teor;
          ot.vv = val(fVv, x); ot.rbv = val(fRbv, x);
          ["mea", "gmb", "est", "flu", "vam"].forEach(function (c) { ot[c] = val(res.fits[c], x); });
          ot.dmt = calcDmt ? dmtCalc(x) : val(res.fits.dmt, x);
          verificar(ot, L);
          if (x < lo || x > hi) avisos.push("Teor ótimo (" + fmt(x, 2) + " %) fora do intervalo ensaiado — extrapolado.");
          ["Vv", "RBV", "VAM", "Est", "Flu"].forEach(function (k) {
            if (ot["ok" + k] === false) avisos.push("No teor ótimo: " + rotulosVer(k, ot, L) + ".");
          });
          if (ot.okRbvVam && (ot.okRbv === false || ot.okVam === false)) avisos.push("DNIT 112 (5.2 c): basta atender à RBV ou ao VAM mínimo — atendido.");
        }
        res.ot = ot;
      } else if (teores.length === 1) {
        var u = teores[0], tp = num(P.teorProj);
        ["Vv", "RBV", "VAM", "Est", "Flu"].forEach(function (k) { if (u["ok" + k] === false) avisos.push("Teor " + fmt(u.teor, 2) + " %: " + rotulosVer(k, u, L) + "."); });
        if (ok(tp) && Math.abs(u.teor - tp) > 0.3 + 1e-9) avisos.push("Teor de " + fmt(u.teor, 2) + " % difere " + fmt(u.teor - tp, 2) + " do teor de projeto (" + fmt(tp, 2) + " %): tolerância ± 0,3 % (DNIT 385, 5.2).");
      } else if (teores.length === 2) {
        avisos.push("Para o teor ótimo são necessários ao menos três teores de ligante.");
      }
      if (L.es === ES.livre && !ok(L.vvMin) && teores.length) avisos.push("Especificação \"Outra\": digite os limites de Vv, RBV e estabilidade.");
      if (!L.tnm && !ok(L.vamFixo) && teores.length) avisos.push("Escolha o TNM da mistura para verificar o VAM mínimo.");
      if (P.golpes === "50" && L.es !== ES.livre) avisos.push("Os limites de estabilidade da " + L.es.cod + " são para 75 golpes por face.");
      res.agr = agrCalc;
      return { tab: { cps: cps, agr: agrCalc }, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, ot = r.ot, L = r.lim;
      var h = "";
      if (ot && ok(ot.teor)) {
        h += '<div class="fe-res">' + item(fmt(ot.teor, 2), "%", "Teor ótimo de ligante — " + (ot.criterio === "vvAlvo" ? "Vv alvo de " + fmt(ot.alvo, 1) + " %" : "centro da faixa comum Vv/RBV") +
          (ot.faixa ? " (faixa " + fmt(ot.faixa[0], 2) + " a " + fmt(ot.faixa[1], 2) + " %)" : "") + " · ± 0,3 % na obra") +
          item(fmt(ot.vv, 1), "%", "Vv" + limTxt(L.vvMin, L.vvMax, 0) + selo(ot.okVv)) + item(fmt(ot.rbv, 1), "%", "RBV" + limTxt(L.rbvMin, L.rbvMax, 0) + selo(ot.okRbv)) +
          item(fmt(ot.vam, 1), "%", "VAM · mín. " + fmt(ot.vamMin, 1) + selo(ot.okVam)) + item(fmt(ot.est, 0), "kgf", "Estabilidade · mín. " + fmt(L.estMin, 0) + selo(ot.okEst)) +
          item(fmt(ot.mea, 3), "g/cm³", "Massa específica aparente · DMT " + fmt(ot.dmt, 3)) + item(fmt(ot.flu, 2), "mm", "Fluência" + selo(ot.okFlu)) + "</div>";
      } else if (r.teores.length === 1) {
        var u = r.teores[0];
        h += '<div class="fe-res">' + item(fmt(u.vv, 1), "%", "Vv — teor " + fmt(u.teor, 2) + " %" + limTxt(L.vvMin, L.vvMax, 0) + selo(u.okVv)) +
          item(fmt(u.rbv, 1), "%", "RBV" + limTxt(L.rbvMin, L.rbvMax, 0) + selo(u.okRbv)) + item(fmt(u.vam, 1), "%", "VAM · mín. " + fmt(u.vamMin, 1) + selo(u.okVam)) +
          item(fmt(u.est, 0), "kgf", "Estabilidade (média de " + u.n + " CP) · mín. " + fmt(L.estMin, 0) + selo(u.okEst)) +
          item(fmt(u.gmb, 4), "", "Gmb (média) · MEa " + fmt(u.mea, 4) + " g/cm³") + item(fmt(u.flu, 2), "mm", "Fluência" + selo(u.okFlu)) + "</div>";
      }
      return h + tabelaTeores(r, "fe-resumo");
    },
    graficos: function (calc, d, opt) {
      var r = calc.resultados, L = r.lim, t = r.teores, ot = r.ot, x = ot && ok(ot.teor) ? ot.teor : NaN;
      if (t.length < 2) return [];
      opt = opt || {};
      var o2 = Object.assign({}, opt, { w: 300, h: 210 });
      function pts(c) { return t.map(function (z) { return { x: z.teor, y: z[c] }; }); }
      function cps(c) { return r.cps.filter(function (o) { return o.usar; }).map(function (o) { return { x: o.teor, y: o[c] }; }); }
      var g = [
        grafico(pts("mea"), { titulo: "Massa específica aparente (g/cm³)", casas: 3, fit: r.fits.mea, xOt: x, cps: cps("mea") }, o2),
        grafico(pts("vv"), { titulo: "Volume de vazios Vv (%)", casas: 1, fit: r.fits.vv, xOt: x, min: L.vvMin, max: L.vvMax, cps: cps("vv") }, o2),
        grafico(pts("rbv"), { titulo: "Relação betume/vazios RBV (%)", casas: 0, fit: r.fits.rbv, xOt: x, min: L.rbvMin, max: L.rbvMax, cps: cps("rbv") }, o2),
        grafico(pts("est"), { titulo: "Estabilidade corrigida (kgf)", casas: 0, fit: r.fits.est, xOt: x, min: L.estMin, cps: cps("est") }, o2),
        grafico(pts("vam"), { titulo: "VAM (%) — tracejado: VAM mínimo", casas: 1, fit: r.fits.vam, xOt: x, serieMin: t.map(function (z) { return { x: z.teor, y: z.vamMin }; }) }, o2),
        grafico(pts("flu"), { titulo: "Fluência (mm)", casas: 1, fit: r.fits.flu, xOt: x, min: L.fluMin, max: L.fluMax, cps: cps("flu") }, o2),
      ];
      // um só SVG com os seis gráficos em grade (3 × 2 na tela, 2 × 3 no relatório)
      var nc = opt.imprimir ? 2 : 3, W = o2.w, H = o2.h, txt = opt.imprimir ? "#222" : "var(--text-dim)";
      var corpo = g.map(function (s, i) {
        var tx = (i % nc) * W, ty = Math.floor(i / nc) * H;
        if (s.indexOf("<svg") !== 0) return '<text x="' + (tx + 20) + '" y="' + (ty + 40) + '" fill="' + txt + '" font-size="10">' + s.replace(/<[^>]+>/g, "") + "</text>";
        return '<g transform="translate(' + tx + " " + ty + ')">' + s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") + "</g>";
      }).join("");
      return ['<svg class="fe-graf" viewBox="0 0 ' + nc * W + " " + Math.ceil(g.length / nc) * H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">' + corpo + "</svg>"];
    },
    relatorio: {
      notas: "Gmb = A / (C − B) e MEa = 0,9971 × Gmb (DNIT 428-ME eq. 6 e 7); DMT = 100 / (Pag/Gag + Pb/Gb) com Pb na mistura total e 1/Gag = Σ(pi/Gi), ou Gmm medida (DNIT 427-ME); " +
        "Vv = (1 − Gmb/DMT) × 100 (DNIT 428 eq. 12); VCB = Gmb × Pb / Gb; VAM = Vv + VCB; RBV = VCB / VAM × 100. Estabilidade corrigida = lida × fator da Tabela anexa da DNER-ME 107/94 (espessura; no modo volume, altura equivalente = V / 81,07 cm²) — " +
        "a DNER-ME 043/95 (Marshall a quente) não está no acervo. Médias por teor dos CPs considerados. Teor ótimo: curvas de Vv e RBV por mínimos quadrados; " +
        "critério \"centro\" = média dos dois valores centrais entre os quatro teores em que as curvas atingem os limites de Vv e RBV (o centro da faixa em que ambos são atendidos); " +
        "propriedades no teor ótimo lidas nas curvas (parábolas). VAM mínimo pela tabela da especificação, interpolado pelo Vv.",
      resultados: function (calc, d) {
        var r = calc.resultados, ot = r.ot, L = r.lim, P = d.params || {}, rows = [];
        rows.push(["Especificação / limites", L.es.nome + " — Vv " + limTxt(L.vvMin, L.vvMax, 0, true) + " %; RBV " + limTxt(L.rbvMin, L.rbvMax, 0, true) + " %; estabilidade ≥ " + fmt(L.estMin, 0) + " kgf" +
          (L.tnm ? "; VAM mínimo pela " + L.es.secVam + " (TNM " + NOME_TNM[L.tnm] + ")" : ok(L.vamFixo) ? "; VAM ≥ " + fmt(L.vamFixo, 1) + " %" : "") +
          (ok(L.fluMin) || ok(L.fluMax) ? "; fluência " + limTxt(L.fluMin, L.fluMax, 1, true) + " mm" : "")]);
        if (ot && ok(ot.teor)) {
          rows.push(["Teor ótimo de ligante", fmt(ot.teor, 2) + " % (" + (ot.criterio === "vvAlvo" ? "Vv alvo " + fmt(ot.alvo, 1) + " %" : "centro da faixa comum de Vv e RBV" +
            (ot.faixa ? ": " + fmt(ot.faixa[0], 2) + " a " + fmt(ot.faixa[1], 2) + " %" : "")) + "; ajuste " + (P.ajuste === "parabola" ? "parabólico" : "linear") + ")"]);
          if (ot.x) rows.push(["Teores nos limites (curvas)", "Vv = " + fmt(L.vvMax, 1) + " %: " + fmt(ot.x.vvMax, 2) + " · Vv = " + fmt(L.vvMin, 1) + " %: " + fmt(ot.x.vvMin, 2) +
            " · RBV = " + fmt(L.rbvMin, 0) + " %: " + fmt(ot.x.rbvMin, 2) + " · RBV = " + fmt(L.rbvMax, 0) + " %: " + fmt(ot.x.rbvMax, 2)]);
          rows.push(["No teor ótimo", "Vv " + fmt(ot.vv, 1) + " %" + nao(ot.okVv) + " · RBV " + fmt(ot.rbv, 1) + " %" + nao(ot.okRbv) + " · VAM " + fmt(ot.vam, 1) + " % (mín. " + fmt(ot.vamMin, 1) + ")" + nao(ot.okVam) +
            " · estabilidade " + fmt(ot.est, 0) + " kgf" + nao(ot.okEst) + " · MEa " + fmt(ot.mea, 3) + " g/cm³ · DMT " + fmt(ot.dmt, 4) + " · fluência " + fmt(ot.flu, 2) + " mm" + nao(ot.okFlu)]);
          rows.push(["Conclusão", conclusao(ot)]);
        } else if (r.teores.length === 1) {
          var u = r.teores[0];
          rows.push(["Teor " + fmt(u.teor, 2) + " % (" + u.n + " CP)", "Gmb " + fmt(u.gmb, 4) + " · MEa " + fmt(u.mea, 4) + " g/cm³ · DMT " + fmt(u.dmt, 4) + " · Vv " + fmt(u.vv, 1) + " %" + nao(u.okVv) +
            " · RBV " + fmt(u.rbv, 1) + " %" + nao(u.okRbv) + " · VAM " + fmt(u.vam, 1) + " %" + nao(u.okVam) + " · estabilidade " + fmt(u.est, 0) + " kgf" + nao(u.okEst) + " · fluência " + fmt(u.flu, 2) + " mm" + nao(u.okFlu)]);
          rows.push(["Conclusão", conclusao(u)]);
        }
        return rows;
      },
      extraHtml: function (calc) { return calc.resultados.teores.length > 1 ? tabelaTeores(calc.resultados, "gr") : ""; },
    },
    exemplos: [
      { nome: "Dosagem CBUQ Faixa B, CAP 30/45 — 5 teores (planilha PROJETO TRAÇO ASFALTO, Unidade B)", dados: function () {
        // planilha "Traço Teor Ótimo": 15 CPs, teores 4,0 a 6,0 %; alturas em cm na planilha (6,3 → 63 mm); prensa 2 kgf/div;
        // fluência em centésimos de mm; limites usados pela planilha (DNIT 031/2024-ES, camada de ligação — fora do acervo)
        var teor = [4, 4, 4, 4.5, 4.5, 4.5, 5, 5, 5, 5.5, 5.5, 5.5, 6, 6, 6];
        var A = [1194.35, 1185.87, 1187.95, 1194.84, 1188.99, 1185.67, 1170.86, 1182.29, 1192.04, 1179.53, 1184.21, 1189.82, 1176.59, 1178.52, 1176.09];
        var B = [703.97, 699.81, 698.15, 710.1, 706.84, 703.7, 693.34, 699.82, 704.77, 699.84, 698.37, 705.91, 697.11, 695.65, 698.02];
        var C = [1202.41, 1195.76, 1198.72, 1203.52, 1196.7, 1193.79, 1179.06, 1189.12, 1200.89, 1184.13, 1188.27, 1194.12, 1181.23, 1181.77, 1176.79];
        var h = [63, 63, 63, 62, 62, 62, 61, 61, 61, 62, 62, 62, 62, 62, 62];
        var leit = [492, 420, 420, 380, 422, 422, 480, 426, 480, 480, 435, 480, 380, 360, 380];
        var fl = [560, 440, 440, 810, 720, 720, 490, 480, 490, 730, 520, 730, 400, 500, 400];
        return { ident: { registro: "PROJ-CBUQ-FX-B", obra: "Projeto de traço CBUQ — Unidade B", camada: "CBUQ Faixa B — camada de ligação", origem: "Brita 2, Brita 1, Brita 0 e pó de pedra" },
          params: { es: "livre", tnm: "19", ligante: "CAP 30/45", golpes: "75", tComp: "150", base: "mistura", gb: "1,02", dmtModo: "calc", aferK: "2", fator: "tabela",
            medidor: "0,01", criterio: "centro", ajuste: "linear", vvMin: "4", vvMax: "6", rbvMin: "65", rbvMax: "72", estMin: "500" },
          agr: [{ nome: "Brita 2", pct: "32", g: "2,775" }, { nome: "Brita 1", pct: "22", g: "2,777" }, { nome: "Brita 0", pct: "7", g: "2,724" }, { nome: "Pó de pedra", pct: "39", g: "2,687" }],
          cps: teor.map(function (t, i) { return { usar: true, teor: fmt(t, 1), h: String(h[i]), A: fmt(A[i], 2), B: fmt(B[i], 2), C: fmt(C[i], 2), leit: String(leit[i]), fl0: "0", fl1: String(fl[i]) }; }),
          obs: "Limites da planilha do laboratório (DNIT 031/2024-ES, camada de ligação: Vv 4–6 %, RBV 65–72 %, estabilidade ≥ 500 kgf) — a DNIT 031-ES não está no acervo. A planilha obteve teor ótimo de 4,65 % com retas de mínimos quadrados." };
      } },
      { nome: "Controle de usina — 3 CPs, teor 4,6 % (planilha MATRIZ CBUQ, Unidade B)", dados: function () {
        return { ident: { registro: "CTRL-CBUQ-2024-07-08", data: "2024-07-08", obra: "Obra B", local: "Alça 1 Retorno 2 / pista direita 2 — est. 215 a 216",
          camada: "CBUQ Faixa A — camada de ligação (binder)", origem: "Mistura em usina (Y)" },
          params: { es: "livre", tnm: "25", ligante: "CAP 30/45", golpes: "75", tComp: "150", base: "mistura", gb: "1,02", dmtModo: "calc", aferK: "2", fator: "tabela",
            medidor: "0,01", criterio: "centro", ajuste: "linear", teorProj: "4,6", vvMin: "4", vvMax: "6", rbvMin: "65", rbvMax: "72", estMin: "500" },
          agr: [{ nome: "Brita 2", pct: "32", g: "2,775" }, { nome: "Brita 1", pct: "22", g: "2,777" }, { nome: "Brita 0", pct: "7", g: "2,724" }, { nome: "Pó de pedra", pct: "39", g: "2,687" }],
          cps: [{ usar: true, teor: "4,6", h: "65", A: "1233,6", B: "725,0", C: "1236,9", leit: "910", fl0: "0", fl1: "510" },
            { usar: true, teor: "4,6", h: "67", A: "1241,2", B: "731,8", C: "1244,0", leit: "840", fl0: "0", fl1: "520" },
            { usar: true, teor: "4,6", h: "64", A: "1203,9", B: "713,2", C: "1208,6", leit: "710", fl0: "0", fl1: "475" }],
          obs: "Limites da planilha (DNIT 031/2006-ES, binder — fora do acervo)." };
      } },
      { nome: "Dosagem CA polímero C-12,5 pela DNIT 385 — Gmm medida, estabilidade reprovada", dados: function () {
        return gerarEx3();
      } },
    ],
  };

  // exemplo 3: gerado a partir de valores-alvo (Vv, estabilidade) por teor
  function gerarEx3() {
    var teores = [4.5, 5.0, 5.5, 6.0, 6.5], gmm = [2.498, 2.480, 2.462, 2.445, 2.428];
    var vv = [[6.4, 6.1, 6.6], [5.2, 5.0, 5.4], [4.0, 3.8, 4.2], [3.1, 2.9, 3.2], [2.2, 2.4, 2.1]];
    var est = [[590, 612, 575], [648, 667, 655], [676, 690, 662], [665, 671, 652], [610, 628, 603]];
    var fl = [[2.6, 2.8, 2.7], [3.0, 3.1, 2.9], [3.3, 3.4, 3.2], [3.8, 3.7, 3.9], [4.4, 4.2, 4.5]];
    var hs = [63.6, 63.2, 63.9], cps = [];
    teores.forEach(function (t, i) {
      for (var j = 0; j < 3; j++) {
        var gmb = gmm[i] * (1 - vv[i][j] / 100), A = 1196 + 2 * j + i, C = A + 2.4 + 0.3 * j, B = C - A / gmb;
        var f = fatorEspessura(hs[j], "tabela").f;
        cps.push({ usar: true, teor: fmt(t, 1), h: fmt(hs[j], 1), A: fmt(A, 1), B: fmt(B, 1), C: fmt(C, 1), gmm: fmt(gmm[i], 3),
          leit: String(Math.round(est[i][j] / f / 2)), fl0: "0", fl1: String(Math.round(fl[i][j] * 100)) });
      }
    });
    return { ident: { registro: "EX-CAP-POL-001", obra: "Exemplo", camada: "Revestimento — CA com CAP 60/85-E, faixa C-12,5", origem: "Pedreira B" },
      params: { es: "385", tnm: "12.5", ligante: "CAP 60/85-E", golpes: "75", tComp: "155", base: "mistura", gb: "1,010", dmtModo: "medido", aferK: "2",
        fator: "tabela", medidor: "0,01", criterio: "centro", ajuste: "linear" }, cps: cps };
  }

  // ---------- verificação ----------
  function dentro(v, a, b) { return ok(v) && (ok(a) || ok(b)) ? (!ok(a) || v >= a - 1e-9) && (!ok(b) || v <= b + 1e-9) : null; }
  function verificar(t, L) {
    t.vamMin = L.vamMin(t.vv);
    t.okVv = dentro(t.vv, L.vvMin, L.vvMax);
    t.okRbv = dentro(t.rbv, L.rbvMin, L.rbvMax);
    t.okVam = ok(t.vam) && ok(t.vamMin) ? t.vam >= t.vamMin - 1e-9 : null;
    t.okEst = ok(t.est) && ok(L.estMin) ? t.est >= L.estMin : null;
    t.okFlu = dentro(t.flu, L.fluMin, L.fluMax);
    // DNIT 112 (5.2 c): atender à RBV ou ao VAM mínimo
    t.okRbvVam = L.es.ouVam && (t.okRbv === true || t.okVam === true);
  }
  function rotulosVer(k, t, L) {
    switch (k) {
      case "Vv": return "Vv de " + fmt(t.vv, 1) + " % fora de " + limTxt(L.vvMin, L.vvMax, 1, true) + " %";
      case "RBV": return "RBV de " + fmt(t.rbv, 1) + " % fora de " + limTxt(L.rbvMin, L.rbvMax, 0, true) + " %";
      case "VAM": return "VAM de " + fmt(t.vam, 1) + " % abaixo do mínimo de " + fmt(t.vamMin, 1) + " %";
      case "Est": return "estabilidade de " + fmt(t.est, 0) + " kgf abaixo do mínimo de " + fmt(L.estMin, 0) + " kgf";
      default: return "fluência de " + fmt(t.flu, 2) + " mm fora de " + limTxt(L.fluMin, L.fluMax, 1, true) + " mm";
    }
  }
  function conclusao(t) {
    var falhas = [];
    if (t.okVv === false) falhas.push("Vv");
    if (t.okRbv === false && !t.okRbvVam) falhas.push("RBV");
    if (t.okVam === false && !t.okRbvVam) falhas.push("VAM");
    if (t.okEst === false) falhas.push("estabilidade");
    if (t.okFlu === false) falhas.push("fluência");
    return falhas.length ? "NÃO ATENDE: " + falhas.join(", ") : "Atende aos limites verificados";
  }
  function limTxt(a, b, casas, puro) {
    var s = ok(a) && ok(b) ? fmt(a, casas) + " a " + fmt(b, casas) : ok(a) ? "≥ " + fmt(a, casas) : ok(b) ? "≤ " + fmt(b, casas) : "";
    return puro ? (s || "—") : s ? " · " + s : "";
  }
  function selo(v) { return v === null || v === undefined ? "" : v ? ' <span class="fe-ok">atende</span>' : ' <span class="fe-nok">não atende</span>'; }
  function nao(v) { return v === false ? " (NÃO ATENDE)" : ""; }
  function item(v, u, rot) {
    return '<div class="fe-res-item"><div class="fe-res-v">' + v + (u ? " <small>" + u + "</small>" : "") + '</div><div class="fe-res-r">' + rot + "</div></div>";
  }
  function tabelaTeores(r, cls) {
    if (!r.teores.length) return "";
    function c(v, casas, okv) { return "<td" + (okv === false ? ' class="fe-nok"' : "") + ">" + fmt(v, casas) + "</td>"; }
    var linhas = r.teores.map(function (t) {
      return "<tr><td>" + fmt(t.teor, 2) + "</td><td>" + t.cps.join(", ") + "</td>" + c(t.gmb, 4) + c(t.mea, 4) + c(t.dmt, 4) + c(t.vv, 2, t.okVv) + c(t.vam, 2, t.okVam) +
        c(t.vamMin, 1) + c(t.rbv, 1, t.okRbv) + c(t.est, 0, t.okEst) + c(t.flu, 2, t.okFlu) + "</tr>";
    });
    var ot = r.ot;
    if (ot && ok(ot.teor)) linhas.push("<tr><td><b>" + fmt(ot.teor, 2) + " (ótimo)</b></td><td>curvas</td>" + c(ot.gmb, 4) + c(ot.mea, 4) + c(ot.dmt, 4) + c(ot.vv, 2, ot.okVv) +
      c(ot.vam, 2, ot.okVam) + c(ot.vamMin, 1) + c(ot.rbv, 1, ot.okRbv) + c(ot.est, 0, ot.okEst) + c(ot.flu, 2, ot.okFlu) + "</tr>");
    return '<table class="' + cls + '"><thead><tr><th>Teor (%)</th><th>CPs</th><th>Gmb</th><th>MEa (g/cm³)</th><th>DMT</th><th>Vv (%)</th><th>VAM (%)</th><th>VAM mín.</th><th>RBV (%)</th><th>Estab. (kgf)</th><th>Fluência (mm)</th></tr></thead><tbody>' +
      linhas.join("") + "</tbody></table>";
  }

  // ---------- gráfico propriedade × teor ----------
  function grafico(pts, o, opt) {
    opt = opt || {};
    var W = opt.w || 300, H = opt.h || 210, m = { l: 50, r: 10, t: 22, b: 32 };
    pts = pts.filter(function (p) { return ok(p.x) && ok(p.y); });
    if (pts.length < 2) return '<div class="fe-graf-vazio">' + esc(o.titulo) + ": faltam dados.</div>";
    var cpsP = (o.cps || []).filter(function (p) { return ok(p.x) && ok(p.y); });
    var xs = pts.map(function (p) { return p.x; });
    var ys = pts.map(function (p) { return p.y; }).concat(cpsP.map(function (p) { return p.y; }));
    [o.min, o.max].forEach(function (v) { if (ok(v)) ys.push(v); });
    (o.serieMin || []).forEach(function (p) { if (ok(p.y)) ys.push(p.y); });
    var x0 = Math.min.apply(null, xs) - 0.25, x1 = Math.max.apply(null, xs) + 0.25;
    if (ok(o.xOt)) { x0 = Math.min(x0, o.xOt - 0.1); x1 = Math.max(x1, o.xOt + 0.1); }
    var yA = Math.min.apply(null, ys), yB = Math.max.apply(null, ys), pad = Math.max((yB - yA) * 0.12, Math.abs(yB) * 0.005 || 0.5);
    var y0 = yA - pad, y1 = yB + pad;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cor = imp ? "#1f5fbf" : "#4f8cff", lim = imp ? "#c0392b" : "#e5534b", faixa = imp ? "rgba(46,160,67,0.12)" : "rgba(52,195,143,0.12)", otc = imp ? "#b26a00" : "#e0a13a";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold">' + esc(o.titulo) + "</text>";
    if (ok(o.min) && ok(o.max)) s += '<rect x="' + m.l + '" y="' + Y(o.max) + '" width="' + (W - m.l - m.r) + '" height="' + (Y(o.min) - Y(o.max)) + '" fill="' + faixa + '"/>';
    for (var k = 0; k <= 4; k++) {
      var gy = y0 + (y1 - y0) * k / 4;
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 4) + '" y="' + (Y(gy) + 3) + '" text-anchor="end" fill="' + txt + '">' + fmt(gy, o.casas) + "</text>";
    }
    xs.forEach(function (x) { s += '<text x="' + X(x) + '" y="' + (H - m.b + 12) + '" text-anchor="middle" fill="' + txt + '">' + fmt(x, 1) + "</text>"; });
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.8"/>';
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" fill="' + txt + '">Teor de ligante (%)</text>';
    [o.min, o.max].forEach(function (v) {
      if (ok(v)) s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + lim + '" stroke-dasharray="5 3"/>';
    });
    var sm = (o.serieMin || []).filter(function (p) { return ok(p.x) && ok(p.y); });
    if (sm.length > 1) s += '<path d="' + sm.map(function (p, i) { return (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p.y).toFixed(1); }).join(" ") + '" fill="none" stroke="' + lim + '" stroke-dasharray="5 3"/>';
    cpsP.forEach(function (p) { s += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="2" fill="none" stroke="' + txt + '" stroke-width="0.8"/>'; });
    if (o.fit) {
      var dc = "", a = Math.min.apply(null, xs), b = Math.max.apply(null, xs);
      if (ok(o.xOt)) { a = Math.min(a, o.xOt); b = Math.max(b, o.xOt); }
      for (var xc = a; xc <= b + 1e-9; xc += (b - a) / 40) {
        var yc = val(o.fit, xc);
        if (ok(yc)) dc += (dc ? " L" : "M") + X(xc).toFixed(1) + " " + Y(Math.min(Math.max(yc, y0), y1)).toFixed(1);
      }
      s += '<path d="' + dc + '" fill="none" stroke="' + cor + '" stroke-width="1.6"/>';
    }
    pts.forEach(function (p) { s += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="3.5" fill="' + cor + '"/>'; });
    if (ok(o.xOt)) {
      s += '<line x1="' + X(o.xOt) + '" y1="' + m.t + '" x2="' + X(o.xOt) + '" y2="' + (H - m.b) + '" stroke="' + otc + '" stroke-width="1.2" stroke-dasharray="3 2"/>';
      var yo = o.fit ? val(o.fit, o.xOt) : NaN;
      if (ok(yo)) s += '<text x="' + (X(o.xOt) + 4) + '" y="' + (m.t + 11) + '" fill="' + otc + '" font-weight="bold">' + fmt(yo, o.casas) + "</text>";
    }
    return s + "</svg>";
  }
})();
