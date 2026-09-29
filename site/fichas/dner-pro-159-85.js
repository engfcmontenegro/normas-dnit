/*
 * Ficha: DNER-PRO 159/85 — Projeto de restauração de pavimentos flexíveis e semirrígidos.
 * Registra-se no motor de site/fichas.js (window.FE); usa FE.defl (dner-pro-010-79.js).
 * Parâmetros do subtrecho homogêneo (9.1.1: característicos = média + σ; SNC = média − σ; n ≤ 3 → média; eliminação
 * fora de média ± 3σ do QI, TR e D — cap. 8), número estrutural corrigido (7.7), Np1 = K × 365 × TMD × FV com os
 * fatores de equivalência da Tabela 1 (7.8), evolução do pavimento existente (equações 1, 2 e 3) e situação I/II/III
 * (9.2), e uma alternativa de restauração a partir de um ano do período de análise: concreto asfáltico (eq. 4, 5 e 6),
 * tratamento superficial duplo (eq. 7 e 8) ou lama asfáltica (eq. 7 e 9), com os casos 1º a 4º (9.3), vida útil e
 * custo atualizado Co = Cn/(1 + i)^n (9.1.2 g). Só a primeira restauração sobre o pavimento existente é modelada.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var DF = FE.defl;
  var log = Math.log10;
  function se(k, v) { return function (d) { var x = (d.params || {})[k]; return Array.isArray(v) ? v.indexOf(x) >= 0 : x === v; }; }
  function clamp(x) { return Math.min(100, Math.max(0, x)); }
  function Ap(x) { return x > 1.5 ? x : 2 / 3 * x + 0.5; }

  // Tabela 1 — fatores de equivalência (P em tf)
  var FEQ = { SS: [7.77, 4.32], SD: [8.17, 4.32], TD: [15.08, 4.14], TT: [22.95, 4.22] };

  // ---------- modelo ----------
  function modelo(v) {
    var t = v.t, AE = v.AE;
    var K0 = t > 0 ? v.Np1 / (t * Math.pow(1 + t, AE)) : NaN;
    function Nint(a1, a2) { return t > 0 ? K0 * (Math.pow(1 + t, a2) - Math.pow(1 + t, a1)) : v.Np1 * (a2 - a1); }
    function N(a) { return Nint(0, a); }
    var BE = v.BE;
    // eq. 1 — trincamento, pavimento existente em CA
    function f1(a) { var n = N(a); return -18.53 + 0.0456 * BE * log(n) + 0.00501 * BE * a * log(n); }
    var App = Ap(AE), dTR;
    if (v.TRE > 0) dTR = v.TRE - f1(App);
    else { var tr1 = f1(App); dTR = tr1 <= 0 ? 0 : -tr1; }
    function TRex(A) { return clamp(f1(Ap(A + AE)) + dTR); }
    // eq. 2 — irregularidade, pavimento existente (SNC pode ser acrescido de a × H do TS, 10.8 Obs.)
    function g2(a, snc) { var n = N(a); return 12.63 + 0.393 * a + 8.66 * log(n) / snc + 7.17e-5 * Math.pow(BE * log(n), 2); }
    function QIex(A, snc) { snc = snc || v.SNC; return g2(Ap(A + AE), snc) + (v.QIE - g2(App, snc)); }
    function dQI1(snc) { return v.QIE - g2(App, snc || v.SNC); }
    // eq. 3 — desgaste, pavimento existente em TS
    var HVAE = 1.327e-5 * N(AE) / AE, AD1 = 1.28 * Math.exp(2.218 - 0.45 * v.CF - 0.189 * HVAE), RDAE = 2.226 * HVAE + 16.6, dA;
    if (!(v.DE > 0)) dA = AD1 < AE ? AE - AD1 : 0;
    else dA = AE - AD1 - v.DE / RDAE;
    var AD = AD1 + dA;
    function Dex(A) {
      var a = A + AE, HVA = 1.327e-5 * N(a) / a, RD = 2.226 * HVA + 16.6;
      return clamp(RD * (a - AD));
    }
    return { N: N, Nint: Nint, TRex: TRex, QIex: QIex, Dex: Dex, dTR: dTR, dQI1: dQI1, AD: AD, AD1: AD1, K0: K0 };
  }

  // restauração no ano n0 do período de análise; devolve a série anual {A, QI, TR, D}
  function restauracao(v, M, R) {
    var AE = v.AE, ARO = AE + R.n0, serie = [], out = { serie: serie };
    var QIA = M.QIex(R.n0), TRA = v.tipoRev === "ts" ? 0 : M.TRex(R.n0), DA = v.tipoRev === "ts" ? M.Dex(R.n0) : 0;
    var TRC = Math.max(TRA, DA), BA = v.BE;
    out.QIA = QIA; out.TRC = TRC;
    if (R.tipo === "ca") {
      var H = R.H, SNC1 = v.SNC + R.a * H, BD = BA * (1 - 0.0687 * Math.pow(H, 0.415));
      var QIIA = 19 + (QIA - 19) / (0.602 * H + 1);
      var N05 = M.Nint(ARO, ARO + 0.5), dQI2 = 0.1965 + 8.66 * log(N05) / SNC1 + 7.17e-5 * Math.pow(BD * log(N05), 2);
      var dTR = null, BDc = Math.max(BD, 20);
      out.QIIA = QIIA; out.SNC1 = SNC1; out.BD = BD; out.dQI2 = dQI2;
      for (var A = R.n0; A <= v.P; A++) {
        var AR = AE + A, x = AR - ARO, aR = Ap(x), NAR = M.Nint(ARO, ARO + aR);
        var QI = QIIA + 0.393 * aR + 8.66 * log(NAR) / SNC1 + 7.17e-5 * Math.pow(BD * log(NAR), 2) - dQI2;
        var TR = 0, AITR = NaN;
        if (x > 0) {
          var NMA = M.Nint(ARO, AR) / x;
          AITR = (212.8 - 0.917 * TRC) * Math.pow(H, 0.681) / Math.pow((BDc - 19.45) * NMA, 0.336);
          if (dTR === null && AITR <= x) {
            var a2 = Ap(AITR), N2 = M.Nint(ARO, ARO + a2);
            dTR = (0.248 * a2 + 2.257) * Math.pow(H, -1.806) * BD * log(N2);
            out.AITR = AITR;
          }
          if (dTR !== null) TR = clamp((0.248 * aR + 2.257) * Math.pow(H, -1.806) * BD * log(NAR) - dTR);
        }
        serie.push({ A: A, QI: QI, TR: TR, D: 0, AITR: AITR });
      }
      out.dTR = dTR;
    } else if (R.tipo === "tsd") {
      var snc2 = v.SNC + R.aTS * R.hTS, ADf = null;
      out.SNC1 = snc2; out.dQI1 = M.dQI1(snc2);
      for (var B = R.n0; B <= v.P; B++) {
        var ARb = AE + B, xb = ARb - ARO, Db = 0, ADb = NaN;
        if (xb > 0) {
          var HVA = 1.327e-5 * M.Nint(ARO, ARb) / xb, RD = 2.226 * HVA + 16.6;
          ADb = ADf !== null ? ADf : 1.28 * Math.exp(2.218 - R.cAD * HVA);
          if (ADf === null && ADb <= xb) ADf = ADb;
          Db = clamp(RD * (xb - ADb));
          if (B === v.P) { out.HVA = HVA; out.RD = RD; }
        }
        serie.push({ A: B, QI: M.QIex(B, snc2), TR: 0, D: Db, AD: ADb });
      }
      out.AD = ADf;
    } else {
      for (var C = R.n0; C <= v.P; C++) {
        var xc = C - R.n0, TDP = TRC > 0 ? Math.max(0, xc - 10 / TRC) : 0;
        serie.push({ A: C, QI: M.QIex(C), TR: Math.min(100, (0.219 * BA + 1.43 * TRC) * TDP), TRbruto: (0.219 * BA + 1.43 * TRC) * TDP, D: 0 });
      }
    }
    return out;
  }

  var CARS = [["be", "Deflexão característica BE", "0,01 mm", "D", 1], ["tre", "Trincamento TRE", "%", "TR", 1], ["de", "Desgaste DE", "%", "Dg", 1],
    ["qie", "Irregularidade QIE", "cont./km", "QI", 1], ["snc", "Número estrutural corrigido SNC", "", "SNC", -1]];

  FE.FICHAS["dner-pro-159-85"] = {
    titulo: "Projeto de restauração de pavimentos flexíveis e semirrígidos",
    rotuloImportar: function (r) { return "BE " + fmt(r.BE, 0) + " · situação " + (r.situacao || "—"); },
    resumo: "Parâmetros característicos do subtrecho (9.1.1), SNC (7.7), Np1 (7.8, Tabela 1), evolução do trincamento, irregularidade e desgaste do pavimento existente (eq. 1–3, situação I/II/III) e de uma alternativa de restauração em concreto asfáltico, tratamento superficial duplo ou lama asfáltica (eq. 4–9), com os casos de 9.3 e o custo atualizado.",
    blocos: [],
    params: DF.params("5.2").filter(function (p) { return p.k !== "universo" && p.k !== "extensao"; }).concat([
      { k: "carmodo", r: "Parâmetros característicos (9.1.1)", tipo: "select", recarrega: true,
        opcoes: [["tab", "Calcular a partir dos valores individuais da tabela"], ["inf", "Informar diretamente"]] },
      { k: "be", r: "BE — deflexão característica (0,01 mm)", se: se("carmodo", "inf") },
      { k: "tre", r: "TRE — trincamento (%)", se: se("carmodo", "inf") },
      { k: "de", r: "DE — desgaste (%)", se: se("carmodo", "inf") },
      { k: "qie", r: "QIE — irregularidade (cont./km)", se: se("carmodo", "inf") },
      { k: "snc", r: "SNC — número estrutural corrigido (vazio = calcular pelas camadas)", se: se("carmodo", "inf") },
      { k: "ae", r: "AE — idade do pavimento na coleta de dados (anos)" },
      { k: "rev", r: "Revestimento existente", tipo: "select", recarrega: true, opcoes: [["ca", "Concreto asfáltico"], ["ts", "Tratamento superficial"]] },
      { k: "cf", r: "Qualidade do tratamento superficial (CF, eq. 3)", tipo: "select", se: se("rev", "ts"), opcoes: [["0", "CF = 0 — TSD de boa qualidade"], ["1", "CF = 1 — TS de má qualidade"]] },
      { k: "largura", r: "Largura do revestimento (m)", ph: "7,0" },
      // camadas (SNC, 7.7)
      { k: "h1", r: "SNC — espessura do revestimento (cm)" },
      { k: "mr", r: "SNC — MR do concreto asfáltico a 30 °C (MPa; vazio = 2942)", se: se("rev", "ca") },
      { k: "tbase", r: "SNC — base", tipo: "select", opcoes: [["gran", "Granular (a₂ pelo CBR)"], ["sc", "Solo-cimento (0,04)"], ["mb", "Macadame betuminoso (0,06)"], ["nao", "Sem base"]] },
      { k: "h2", r: "SNC — espessura da base (cm)" }, { k: "cbr2", r: "SNC — CBR da base (%)" },
      { k: "tsub", r: "SNC — sub-base", tipo: "select", opcoes: [["gran", "Granular (a₃ pelo CBR, ≤ 0,045)"], ["sc", "Solo-cimento (0,04)"], ["mb", "Macadame betuminoso (0,06)"], ["nao", "Sem sub-base"]] },
      { k: "h3", r: "SNC — espessura da sub-base (cm)" }, { k: "cbr3", r: "SNC — CBR da sub-base (%)" },
      { k: "h4", r: "SNC — espessura do reforço do subleito (cm)" }, { k: "cbr4", r: "SNC — CBR do reforço do subleito (%)" },
      { k: "cbrs", r: "SNC — CBR do subleito (%)" },
      // tráfego
      { k: "npmodo", r: "Np1 — tráfego do primeiro ano (7.8)", tipo: "select", recarrega: true, opcoes: [["inf", "Informar Np1"], ["calc", "Np1 = K × 365 × TMD × FV"]] },
      { k: "np1", r: "Np1 informado", se: se("npmodo", "inf") },
      { k: "kf", r: "K — fração do TMD na faixa mais solicitada", ph: "0,5", se: se("npmodo", "calc") },
      { k: "tmd", r: "TMD — veículos comerciais, dois sentidos", se: se("npmodo", "calc") },
      { k: "fv", r: "FV — fator de veículo (vazio = pela tabela de eixos pesados)", se: se("npmodo", "calc") },
      { k: "t", r: "Taxa de crescimento do tráfego t (%)", ph: "4" },
      { k: "per", r: "Período de análise (anos)", ph: "10" },
      { k: "qim", r: "QIM — irregularidade máxima (cont./km)", ph: "60", dica: "limites típicos: 50 a 70" },
      { k: "trm", r: "TRM — trincamento máximo (%)", ph: "40", dica: "15 % a 40 %" },
      { k: "dm", r: "DM — desgaste máximo (%)", ph: "40", dica: "15 % a 40 %" },
      // alternativa
      { k: "alt", r: "Alternativa de restauração (9.3)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não analisar"], ["ca", "Concreto asfáltico (eq. 4, 5 e 6)"], ["tsd", "Tratamento superficial duplo (eq. 7 e 8)"], ["lama", "Lama asfáltica (eq. 7 e 9)"]] },
      { k: "n0", r: "Ano de execução no período de análise (0 = início)", ph: "0", se: function (d) { return (d.params || {}).alt !== "nao"; } },
      { k: "hca", r: "Espessura do concreto asfáltico H (cm)", ph: "4", se: se("alt", "ca"), dica: "9.3.2: espessura mínima recomendada de 3 cm" },
      { k: "a1", r: "a₁ do concreto asfáltico da restauração (cm⁻¹)", ph: "0,17", se: se("alt", "ca") },
      { k: "hts", r: "Espessura do TSD (cm)", ph: "2,0", se: se("alt", "tsd") },
      { k: "ats", r: "a₁ do TSD (cm⁻¹)", ph: "0,04", se: se("alt", "tsd") },
      { k: "cad", r: "Coeficiente de HVA na eq. 8 (AD)", tipo: "select", se: se("alt", "tsd"),
        opcoes: [["0.819", "0,819 — texto da equação 8 (10.9)"], ["0.189", "0,189 — usado no exemplo do Anexo e na eq. 3"]] },
      { k: "vmin", r: "Vida útil mínima de uma etapa (anos) — restrição de construção", ph: "2,5", se: function (d) { return (d.params || {}).alt !== "nao"; } },
      { k: "custo", r: "Custo unitário (por m³ de CA, ou por m² de TSD/lama)", se: function (d) { return (d.params || {}).alt !== "nao"; } },
      { k: "juros", r: "Taxa de oportunidade de capital i (%)", se: function (d) { return (d.params || {}).alt !== "nao"; } },
      { k: "recurso", r: "Recursos disponíveis para a etapa (por km)", se: function (d) { return (d.params || {}).alt !== "nao"; } },
    ]),
    padrao: { correl: "nao", carmodo: "tab", rev: "ca", cf: "0", tbase: "gran", tsub: "gran", npmodo: "inf", kf: "0,5", t: "4", per: "10", qim: "60", trm: "40", dm: "40",
      alt: "nao", n0: "0", a1: "0,17", hts: "2,0", ats: "0,04", cad: "0.819", vmin: "2,5" },
    tabelas: function (d) {
      var P = d.params || {}, T = [];
      if (P.carmodo !== "inf") T.push({ chave: "pts", titulo: "Valores individuais do subtrecho (7.1 a 7.7)", rotulo: "Ponto", iniciais: 6, min: 1,
        dica: "deflexões a cada 20 m; TR e D nos segmentos-testemunha; QI a cada 200–400 m; SNC nos poços — preencha o que houver",
        linhas: DF.linhas({ raio: false, extra: [{ k: "TR", r: "TR — trincamento", u: "%" }, { k: "Dg", r: "D — desgaste", u: "%" }, { k: "QI", r: "QI — irregularidade", u: "cont./km" },
          { k: "SNC", r: "SNC — número estrutural corrigido", u: "" }] }) });
      if (P.npmodo === "calc" && !ok(num(P.fv))) T.push({ chave: "eixos", titulo: "Pesagem — eixos dos veículos comerciais (Tabela 1)", rotulo: "Grupo", iniciais: 4, min: 1,
        dica: "tipo SS, SD, TD ou TT; FV = Σ(F × nº de eixos) / nº de veículos",
        linhas: [{ k: "tipo", r: "Tipo de eixo (SS, SD, TD, TT)", texto: true, ph: "SD" }, { k: "p", r: "Carga P", u: "tf" }, { k: "q", r: "Nº de eixos", u: "" },
          { k: "nv", r: "Nº de veículos pesados (só na 1ª coluna)", u: "" }, { calc: "F", r: "Fator de equivalência F", u: "", casas: 3 }, { calc: "FQ", r: "F × nº de eixos", u: "", casas: 2 }] });
      return T;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], r = {};
      var proc = DF.processar({ params: P, pts: d.pts || [] }, avisos, { semEstat: true });
      // ---- característicos ----
      var car = {};
      CARS.forEach(function (c) {
        if (P.carmodo === "inf") { car[c[0]] = num(P[c[0]]); return; }
        var vals = c[3] === "D" ? proc.pts.map(function (o) { return o.Dv; }) : (d.pts || []).map(function (p) { return num(p[c[3]]); });
        var ca = DF.caracteristico(vals, c[4], c[3] === "TR" || c[3] === "Dg" || c[3] === "QI", 3);
        r["c_" + c[0]] = ca; car[c[0]] = ca ? ca.car : NaN;
        if (ca && ca.fora.length) avisos.push(c[1] + ": " + ca.fora.length + " valor(es) fora da média ± 3σ eliminado(s) — investigar (cap. 8).");
      });
      // ---- SNC pelas camadas (7.7) ----
      var h1 = num(P.h1), mr = num(P.mr), a1e = NaN;
      if (P.rev === "ts") a1e = 0.04; else if (ok(h1)) a1e = h1 <= 3 ? 0.07 : 0.181 * (1 - Math.exp(-8.56e-4 * (ok(mr) ? mr : 2942)));
      function aBase(tp, cbr) {
        if (tp === "sc") return 0.04; if (tp === "mb") return 0.06; if (tp === "nao") return 0;
        // a₂ = (11,47 CBR − 0,07783 CBR² + 1,772 × 10⁻⁴ CBR³) × 10⁻⁴ (fator 10⁻⁴ omitido no texto da norma)
        return ok(cbr) ? (11.47 * cbr - 0.07783 * cbr * cbr + 1.772e-4 * Math.pow(cbr, 3)) * 1e-4 : NaN;
      }
      function aSub(tp, cbr) {
        if (tp === "sc") return 0.04; if (tp === "mb") return 0.06; if (tp === "nao") return 0;
        return ok(cbr) && cbr > 0 ? Math.min(0.045, 0.00394 + 0.02559 * log(cbr)) : NaN;
      }
      var a2 = aBase(P.tbase || "gran", num(P.cbr2)), a3 = aSub(P.tsub || "gran", num(P.cbr3)), cbr4 = num(P.cbr4), a4 = ok(cbr4) && cbr4 > 0 ? 0.00394 + 0.02559 * log(cbr4) : 0;
      var lay = [[a1e, h1], [a2, num(P.h2) || 0], [a3, num(P.h3) || 0], [a4, num(P.h4) || 0]];
      var SN = lay.reduce(function (s, l) { return s + (ok(l[0]) ? l[0] * l[1] : 0); }, 0), cs = num(P.cbrs);
      var SNCcam = ok(cs) && cs > 0 && ok(h1) ? SN + 3.51 * log(cs) - 0.85 * Math.pow(log(cs), 2) - 1.43 : NaN;
      r.a = [a1e, a2, a3, a4]; r.SN = SN; r.SNCcam = SNCcam;
      if (!ok(car.snc)) car.snc = SNCcam;
      if (!ok(car.snc)) avisos.push("Informe o SNC ou as camadas e o CBR do subleito (7.7).");
      // ---- Np1 (7.8) ----
      var Np1 = num(P.np1);
      if (P.npmodo === "calc") {
        var FV = num(P.fv), eix = [];
        if (!ok(FV)) {
          var nv = NaN, sfq = 0;
          eix = (d.eixos || []).map(function (e, i) {
            var tp = String(e.tipo || "").trim().toUpperCase(), c = FEQ[tp], p = num(e.p), q = num(e.q), o = {};
            if (i === 0) nv = num(e.nv);
            o.F = c && ok(p) ? Math.pow(p / c[0], c[1]) : NaN; o.FQ = ok(o.F) && ok(q) ? o.F * q : NaN;
            if (ok(o.FQ)) sfq += o.FQ;
            if (ok(p) && !c) avisos.push("Grupo " + (i + 1) + ": tipo de eixo \"" + e.tipo + "\" inválido (SS, SD, TD ou TT).");
            return o;
          });
          FV = ok(nv) && nv > 0 ? sfq / nv : NaN;
          if (!ok(FV)) avisos.push("Informe o FV ou os eixos pesados com o nº de veículos (Tabela 1).");
        }
        r.FV = FV; r.eixos = eix;
        Np1 = (num(P.kf) || 0.5) * 365 * num(P.tmd) * FV;
      }
      var t = (ok(num(P.t)) ? num(P.t) : 4) / 100, PER = Math.round(num(P.per) || 10), AE = num(P.ae);
      var QIM = num(P.qim) || 60, TRM = num(P.trm) || 40, DM = num(P.dm) || 40, ts = P.rev === "ts";
      var v = { BE: car.be, TRE: car.tre || 0, DE: car.de || 0, QIE: car.qie, SNC: car.snc, AE: AE, Np1: Np1, t: t, P: PER, CF: num(P.cf) || 0, tipoRev: ts ? "ts" : "ca" };
      Object.assign(r, { BE: v.BE, TRE: v.TRE, DE: v.DE, QIE: v.QIE, SNC: v.SNC, AE: AE, Np1: Np1, t: t, PER: PER, QIM: QIM, TRM: TRM, DM: DM, ts: ts });
      var falta = [];
      if (!ok(v.BE)) falta.push("BE"); if (!ok(v.QIE)) falta.push("QIE"); if (!ok(v.SNC)) falta.push("SNC"); if (!ok(AE) || AE <= 0) falta.push("AE"); if (!ok(Np1) || Np1 <= 0) falta.push("Np1");
      if (falta.length) { avisos.push("Faltam " + falta.join(", ") + " para as equações de desempenho (cap. 10)."); return { tab: { pts: proc.pts, eixos: r.eixos || [] }, proc: proc, resultados: r, avisos: avisos }; }
      if (t <= 0) avisos.push("Taxa de crescimento nula: N acumulado tomado como Np1 × anos (as equações pressupõem série geométrica, Obs. 2 de 10.2).");
      var M = modelo(v);
      r.dTR = M.dTR; r.dQI1 = M.dQI1(); r.ADex = M.AD;
      // ---- pavimento existente (9.2) ----
      var ex = [];
      for (var A = 0; A <= PER; A++) ex.push({ A: A, QI: M.QIex(A), TR: ts ? v.TRE : M.TRex(A), D: ts ? M.Dex(A) : 0, N: M.N(A + AE) });
      r.ex = ex;
      var prim = ts ? "D" : "TR", lim = ts ? DM : TRM;
      function excede(o) { return o.QI > QIM || o[prim] > lim; }
      var sit, anoLim = NaN;
      if (v.QIE > QIM || (ts ? v.DE > DM : v.TRE > TRM) || (ts && v.TRE > TRM)) sit = "III";
      else if (!excede(ex[PER])) sit = "I";
      else { sit = "II"; for (var k = 0; k <= PER; k++) if (excede(ex[k])) { anoLim = k; break; } }
      if (ts && v.TRE > TRM && !(v.QIE > QIM || v.DE > DM)) avisos.push("Revestimento em TS: 9.2.2 manda cotejar o desgaste em lugar do trincamento, mas o exemplo do Anexo enquadra na situação III pelo trincamento (TRE > TRM) — adotado como no Anexo.");
      r.situacao = sit; r.anoLim = anoLim;
      // ---- alternativa (9.3) ----
      if (P.alt && P.alt !== "nao") {
        var n0 = Math.max(0, Math.min(PER, Math.round(num(P.n0) || 0)));
        var R = { tipo: P.alt, n0: n0, H: num(P.hca), a: num(P.a1) || 0.17, hTS: num(P.hts) || 2, aTS: num(P.ats) || 0.04, cAD: Number(P.cad || "0.819") };
        if (P.alt === "ca" && !ok(R.H)) avisos.push("Informe a espessura H do concreto asfáltico (9.3.2).");
        else {
          var res = restauracao(v, M, R), s = res.serie, fim = s[s.length - 1], par = P.alt === "tsd" ? "D" : "TR", lp = P.alt === "tsd" ? DM : TRM;
          res.caso = fim.QI < QIM ? (fim[par] < lp ? 1 : 3) : (fim[par] < lp ? 2 : 4);
          var primeiro = null;
          for (var j = 0; j < s.length; j++) if (s[j].QI >= QIM || s[j][par] >= lp) { primeiro = s[j]; break; }
          res.anoLim = primeiro ? primeiro.A : NaN; res.vida = primeiro ? primeiro.A - n0 : PER - n0;
          res.porQI = primeiro ? primeiro.QI >= QIM : false;
          res.par = par; res.lp = lp; res.fim = fim;
          if (P.alt === "ca") {
            res.Hmin = res.QIA > QIM ? ((res.QIA - 19) / (QIM - 19) - 1) / 0.602 : 0;
            if (res.QIIA > QIM) avisos.push("QIIA = " + fmt(res.QIIA, 1) + " > QIM: descartar H = " + fmt(R.H, 1) + " cm; espessura mínima pela eq. 4: " + fmt(res.Hmin, 1) + " cm (9.3.2).");
            if (R.H < 3) avisos.push("Espessura de CA abaixo do mínimo recomendado de 3 cm (9.3.2).");
          }
          var vmin = num(P.vmin);
          if (res.caso !== 1 && ok(vmin) && res.vida < vmin) avisos.push("Vida útil da etapa de " + res.vida + " ano(s) < vida mínima de " + fmt(vmin, 1) + " anos: " +
            (P.alt === "ca" ? "adotar espessura imediatamente superior" : P.alt === "tsd" ? "descartar o TSD e adotar concreto asfáltico" : "descartar a lama e adotar tratamento superficial") + " (9.3).");
          var cu = num(P.custo), lg = num(P.largura), ij = (num(P.juros) || 0) / 100;
          if (ok(cu) && ok(lg)) {
            res.Cn = P.alt === "ca" ? cu * lg * R.H / 100 * 1000 : cu * lg * 1000;
            res.Co = res.Cn / Math.pow(1 + ij, n0);
            var rec = num(P.recurso);
            if (ok(rec)) { res.viavelEco = res.Co <= rec; if (!res.viavelEco) avisos.push("Custo atualizado " + fmt(res.Co, 0) + " por km acima dos recursos disponíveis (" + fmt(rec, 0) + "): alternativa economicamente inviável (9.3.5)."); }
          }
          res.R = R;
          r.alt = res;
        }
      }
      return { tab: { pts: proc.pts, eixos: r.eixos || [] }, proc: proc, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, I = DF.item, h = '<div class="fe-res">';
      h += I(fmt(r.BE, 1) + " · " + fmt(r.QIE, 1) + " · " + fmt(r.SNC, 2), "BE (0,01 mm) · QIE (cont./km) · SNC", true) +
        I(fmt(r.TRE, 1) + " % · " + fmt(r.DE, 1) + " %", "TRE · DE (característicos)", true) +
        I(ok(r.Np1) ? DF.fmtN(r.Np1) : "—", "Np1 — N do primeiro ano (7.8)" + (ok(r.FV) ? " — FV = " + fmt(r.FV, 2) : ""), true);
      if (r.situacao) {
        var ex = r.ex[r.ex.length - 1];
        h += I("Situação " + r.situacao, r.situacao === "I" ? "Sem necessidade de restauração no período (9.2.1 a)" : r.situacao === "II" ? "Restrição atingida no ano " + r.anoLim + " do período (9.2.1 b)" : "Restauração imediata (9.2.1 c)") +
          I(fmt(ex.QI, 1) + " · " + fmt(r.ts ? ex.D : ex.TR, 1) + " %", "Pavimento existente no último ano: QI · " + (r.ts ? "desgaste" : "trincamento"), true);
      }
      var a = r.alt;
      if (a) {
        var nm = { ca: "CA " + fmt(a.R.H, 1) + " cm", tsd: "TSD", lama: "Lama asfáltica" }[a.R.tipo];
        h += I(nm + " · " + a.caso + "º caso", "Alternativa: QIF = " + fmt(a.fim.QI, 1) + " (QIM " + fmt(r.QIM, 0) + "); " + (a.par === "D" ? "DF" : "TRF") + " = " + fmt(a.fim[a.par], 1) + " % (" + fmt(a.lp, 0) + " %)" +
          (a.caso === 1 ? ' — <span class="fe-ok">atende até o fim da análise</span>' : ' — <span class="fe-nok">limite no ano ' + a.anoLim + " (vida " + a.vida + " ano(s))</span>"));
        if (ok(a.Co)) h += I(fmt(a.Co, 0), "Custo atualizado por km (Co = Cn/(1 + i)^n)" + (a.viavelEco === false ? ' — <span class="fe-nok">acima dos recursos</span>' : ""), true);
      }
      return h + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var r = calc.resultados;
      if (!r.ex) return ['<div class="fe-graf-vazio">A evolução aparece com os parâmetros do pavimento existente.</div>'];
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
      var W = opt.w || 600, H = opt.h || 300, m = { l: 46, r: 46, t: 26, b: 40 }, P = r.PER;
      function X(A) { return m.l + A / P * (W - m.l - m.r); }
      function Yq(v) { return H - m.b - Math.min(v, 120) / 120 * (H - m.t - m.b); }
      function Yp(v) { return H - m.b - v / 100 * (H - m.t - m.b); }
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
      for (var q = 0; q <= 120; q += 20) s += '<line x1="' + m.l + '" y1="' + Yq(q) + '" x2="' + (W - m.r) + '" y2="' + Yq(q) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 5) + '" y="' + (Yq(q) + 4) + '" text-anchor="end" fill="' + txt + '">' + q + '</text><text x="' + (W - m.r + 5) + '" y="' + (Yq(q) + 4) + '" fill="' + txt + '">' + fmt(q / 1.2, 0) + "</text>";
      for (var A = 0; A <= P; A++) s += '<text x="' + X(A) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + A + "</text>";
      s += '<text x="' + ((W) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Ano do período de análise</text>';
      s += '<text transform="translate(12 ' + (H / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">QI (cont./km)</text>';
      s += '<text transform="translate(' + (W - 8) + " " + (H / 2) + ') rotate(90)" text-anchor="middle" fill="' + txt + '">TR / D (%)</text>';
      var par = r.ts ? "D" : "TR";
      function linha(ser, key, Y, cor, tr) { return '<path d="' + ser.map(function (o, k) { return (k ? "L" : "M") + X(o.A).toFixed(1) + " " + Y(o[key]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.8"' + (tr ? ' stroke-dasharray="' + tr + '"' : "") + "/>"; }
      s += '<line x1="' + m.l + '" y1="' + Yq(r.QIM) + '" x2="' + (W - m.r) + '" y2="' + Yq(r.QIM) + '" stroke="#1f5fbf" stroke-dasharray="2 3"/>';
      s += '<line x1="' + m.l + '" y1="' + Yp(r.ts ? r.DM : r.TRM) + '" x2="' + (W - m.r) + '" y2="' + Yp(r.ts ? r.DM : r.TRM) + '" stroke="#c0392b" stroke-dasharray="2 3"/>';
      s += linha(r.ex, "QI", Yq, "#4f8cff", "6 3") + linha(r.ex, par, Yp, "#e5534b", "6 3");
      if (r.alt) { s += linha(r.alt.serie, "QI", Yq, "#1f5fbf") + linha(r.alt.serie, r.alt.par, Yp, "#c0392b"); }
      s += '<text x="' + (m.l + 4) + '" y="14" fill="' + txt + '">azul: QI · vermelho: ' + (r.ts ? "desgaste" : "trincamento") + ' · tracejado: pavimento existente · contínuo: alternativa · pontilhado: limites</text>';
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "N acumulado: N(a) = Np1/[t (1 + t)^AE] × [(1 + t)^a − 1]. Eq. 1 e 2 com A′ = A + AE (ou 2/3 (A + AE) + 0,5 se ≤ 1,5) e ajustes ΔTR e ΔQI1 constantes no ano AE; eq. 3 com AD = AD1 + ΔA. " +
        "Restauração: eq. 4 QIIA = 19 + (QIA − 19)/(0,602 H + 1); eq. 5 e 6 com SNC1 = SNC + a₁H, BD = BA (1 − 0,0687 H^0,415), AITR e ΔTR na primeira vez em que AITR ≤ AR − ARO; eq. 8 com AD recalculado até AD ≤ A′; eq. 9 TR = (0,219 BA + 1,43 TRC) × TDP. " +
        "TR e D limitados a 0–100 %. a₂ das bases granulares com o fator 10⁻⁴ sobre toda a expressão (o texto da norma o aplica só ao termo cúbico, o que dá valores absurdos). Só a primeira etapa de restauração sobre o pavimento existente é modelada.",
      resultados: function (calc) {
        var r = calc.resultados, rows = [];
        rows.push(["Parâmetros característicos", "BE = " + fmt(r.BE, 1) + " (0,01 mm); TRE = " + fmt(r.TRE, 1) + " %; DE = " + fmt(r.DE, 1) + " %; QIE = " + fmt(r.QIE, 1) + " cont./km; SNC = " + fmt(r.SNC, 2) + "; AE = " + fmt(r.AE, 1) + " anos"]);
        if (ok(r.SNCcam)) rows.push(["SNC pelas camadas (7.7)", "a = " + r.a.map(function (x) { return fmt(x, 4); }).join(" / ") + " cm⁻¹; SN = " + fmt(r.SN, 2) + "; SNC = " + fmt(r.SNCcam, 2)]);
        rows.push(["Tráfego", "Np1 = " + fmt(r.Np1, 0) + (ok(r.FV) ? " (FV = " + fmt(r.FV, 3) + ")" : "") + "; t = " + fmt(r.t * 100, 1) + " %; período " + r.PER + " anos"]);
        rows.push(["Restrições de desempenho", "QIM = " + fmt(r.QIM, 0) + " cont./km; TRM = " + fmt(r.TRM, 0) + " %; DM = " + fmt(r.DM, 0) + " %"]);
        if (r.situacao) {
          var ex = r.ex[r.ex.length - 1];
          rows.push(["Pavimento existente (9.2)", "Situação " + r.situacao + (ok(r.anoLim) ? " — limite no ano " + r.anoLim : "") + "; ΔQI1 = " + fmt(r.dQI1, 2) + (r.ts ? "" : "; ΔTR = " + fmt(r.dTR, 2)) + "; último ano: QI = " + fmt(ex.QI, 2) + ", " + (r.ts ? "D = " + fmt(ex.D, 1) : "TR = " + fmt(ex.TR, 1)) + " %"]);
          rows.push(["Evolução do existente (ano: QI / " + (r.ts ? "D" : "TR") + ")", r.ex.map(function (o) { return o.A + ": " + fmt(o.QI, 1) + " / " + fmt(r.ts ? o.D : o.TR, 1); }).join("; ")]);
        }
        var a = r.alt;
        if (a) {
          var R = a.R, nm = { ca: "Concreto asfáltico H = " + fmt(R.H, 1) + " cm (a₁ = " + fmt(R.a, 2) + ")", tsd: "Tratamento superficial duplo (" + fmt(R.hTS, 1) + " cm, a = " + fmt(R.aTS, 2) + "; coef. AD " + fmt(R.cAD, 3) + ")", lama: "Lama asfáltica" }[R.tipo];
          rows.push(["Alternativa (ano " + R.n0 + ")", nm + "; QIA = " + fmt(a.QIA, 2) + "; TRC = " + fmt(a.TRC, 1) + " %" + (ok(a.QIIA) ? "; QIIA = " + fmt(a.QIIA, 2) + "; SNC1 = " + fmt(a.SNC1, 2) + "; BD = " + fmt(a.BD, 1) : "") +
            (ok(a.dQI1) ? "; SNC = " + fmt(a.SNC1, 2) + ", ΔQI1 = " + fmt(a.dQI1, 2) : "") + (ok(a.AD) ? "; AD = " + fmt(a.AD, 2) + ", HVA = " + fmt(a.HVA, 2) + ", RD = " + fmt(a.RD, 2) : "") + (ok(a.AITR) ? "; AITR = " + fmt(a.AITR, 2) + " anos" : "")]);
          rows.push(["Resultado da alternativa (9.3)", a.caso + "º caso — QIF = " + fmt(a.fim.QI, 2) + "; " + (a.par === "D" ? "DF" : "TRF") + " = " + fmt(a.fim[a.par], 1) + " %" + (a.caso === 1 ? " — atende até o fim do período" : " — limite no ano " + a.anoLim + " (vida " + a.vida + " anos)")]);
          rows.push(["Evolução da alternativa (ano: QI / " + (a.par === "D" ? "D" : "TR") + ")", a.serie.map(function (o) { return o.A + ": " + fmt(o.QI, 1) + " / " + fmt(o[a.par], 1); }).join("; ")]);
          if (ok(a.Co)) rows.push(["Custo", "Cn = " + fmt(a.Cn, 0) + "; Co = " + fmt(a.Co, 0) + " por km" + (a.viavelEco === false ? " — acima dos recursos" : a.viavelEco ? " — dentro dos recursos" : "")]);
        }
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo numérico do Anexo — TSD existente, restauração em TSD (coef. 0,189 do Anexo)", dados: function () {
        return { ident: { registro: "EX-P159-001", obra: "Exemplo do Anexo da norma", trecho: "Subtrecho homogêneo", camada: "Tratamento superficial duplo" },
          params: { carmodo: "inf", be: "114", tre: "87", de: "0", qie: "42", snc: "3,83", ae: "6", rev: "ts", cf: "0", largura: "7,0", npmodo: "inf", np1: "70262", t: "4", per: "10",
            qim: "60", trm: "40", dm: "40", alt: "tsd", n0: "0", hts: "2,0", ats: "0,04", cad: "0.189", vmin: "2,5", custo: "800", juros: "12", recurso: "7000000" },
          obs: "Anexo da DNER-PRO 159/85: QI16 = 52,7; D16 = 9,16 %; custo Cr$ 5.600.000/km (recursos Cr$ 7.000.000/km). A lama asfáltica (C.2) dá TR7 = 100 % e é descartada." };
      } },
      { nome: "CBUQ existente com trincamento crescente — recapeamento de 4 cm no ano 3 (dados gerados)", dados: function () {
        var L = [["100", "78", "8", "", "44", ""], ["101", "92", "14", "", "", ""], ["102", "85", "6", "", "", "3,10"], ["103", "101", "18", "", "48", ""], ["104", "88", "11", "", "", ""], ["105", "95", "9", "", "46", "2,86"]];
        return { ident: { registro: "EX-P159-002", data: "2026-05-05", obra: "BR-000", trecho: "Subtrecho homogêneo 2", camada: "CBUQ 5 cm, base granular 15 cm" },
          params: { carmodo: "tab", ae: "8", rev: "ca", largura: "7,0", h1: "5", tbase: "gran", h2: "15", cbr2: "80", tsub: "gran", h3: "20", cbr3: "30", cbrs: "8",
            npmodo: "calc", kf: "0,5", tmd: "900", t: "5", per: "10", qim: "60", trm: "30", dm: "40", alt: "ca", n0: "3", hca: "4", a1: "0,17", vmin: "5",
            custo: "650", juros: "10", recurso: "150000" },
          pts: L.map(function (x) { return { estaca: x[0], lado: "LD TRE", eq: "VB", D: x[1], TR: x[2], Dg: x[3], QI: x[4], SNC: x[5] }; }),
          eixos: [{ tipo: "SS", p: "5,5", q: "900", nv: "900" }, { tipo: "SD", p: "9,5", q: "700" }, { tipo: "TD", p: "16", q: "250" }, { tipo: "TT", p: "21", q: "60" }] };
      } },
    ],
  };
})();
