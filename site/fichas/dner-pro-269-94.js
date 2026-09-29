/*
 * Ficha: DNER-PRO 269/94 — Projeto de restauração de pavimentos flexíveis — TECNAPAV (Método da Resiliência).
 * Registra-se no motor de site/fichas.js (window.FE); usa FE.defl (dner-pro-010-79.js).
 * Deflexão característica Dc = D̄ + σ (9.3.1), trincamento característico (8.5 e 9.1.1 c), silte S (7.5) e grupo do
 * solo (Tabela 1), I1/I2, espessura efetiva hef (9.3.4), deflexão admissível log D̄̄ = 3,148 − 0,188 log Np (9.3.5),
 * reforço HR (9.3.6), soluções de recapeamento (9.3.7 casos 1 a 4), restrição de espessura (caso 5: Nt, vida de
 * fadiga e etapas com V, Ti, hef2, hef3), considerações 9.4, reciclagem (9.5: Mef, μ, D̄c) e custo atualizado (9.1.2 f).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var DF = FE.defl;
  function se(k, v) { return function (d) { var x = (d.params || {})[k]; return Array.isArray(v) ? v.indexOf(x) >= 0 : x === v; }; }

  // Tabela 1 — grupos de solos (CBR %, silte S %)
  function grupoSolo(cbr, s) {
    if (!ok(cbr) || !ok(s)) return "";
    if (cbr >= 10) return s <= 35 ? "I" : s <= 65 ? "II" : "III";
    if (cbr >= 6) return s <= 65 ? "II" : "III";
    return "III";
  }
  function Iconst(tipo, hcg) {
    if (ok(hcg) && hcg > 45) return [0, 1];  // caso 2
    return tipo === "II" ? [1, 0] : tipo === "III" ? [0, 1] : [0, 0];
  }
  function hefDe(Dc, I, he) {
    var h = -5.737 + 807.961 / Dc + 0.972 * I[0] + 4.101 * I[1];
    return { bruto: h, h: Math.min(Math.max(h, 0), ok(he) ? he : Infinity) };  // caso 3
  }
  function dAdm(Np) { return Math.pow(10, 3.148 - 0.188 * Math.log10(Np)); }
  function hrDe(D, hef, I) { return -19.015 + 238.14 / Math.sqrt(D) - 1.357 * hef + 1.016 * I[0] + 3.893 * I[1]; }
  function dDeHr(HR, hef, I) { var q = HR + 19.015 + 1.357 * hef - 1.016 * I[0] - 3.893 * I[1]; return q > 0 ? Math.pow(238.14 / q, 2) : NaN; }
  function ntDe(D) { return Math.pow(10, (3.148 - Math.log10(D)) / 0.188); }
  // anos de vida de fadiga: maior A com Σ Ni ≤ Nt, Ni = N1 (1 + t)^(i−1), a partir do ano inicial a0
  function vidaAnos(Nt, N1, t, a0) {
    if (!ok(N1) || N1 <= 0) return NaN;
    var s = 0, A = 0;
    for (var i = 1; i <= 200; i++) { var Ni = N1 * Math.pow(1 + t, a0 + i - 1); if (s + Ni > Nt) break; s += Ni; A = i; }
    return A;
  }
  function solucao(HR) {
    if (!ok(HR)) return "";
    if (HR <= 3) return "Caso 4 — HR ≤ 3 cm: conforme a condição da superfície, lama asfáltica ou tratamento superficial.";
    if (HR <= 12.5) return "Caso 1 — 3 < HR ≤ 12,5 cm: camada única de CBUQ (binder e capa) ou camadas integradas de CBUQ e pré-misturado.";
    if (HR <= 25) return "Caso 2 — 12,5 < HR ≤ 25 cm: camadas integradas — pré-misturado Hpm = 0,60 HR = " + fmt(0.6 * HR, 1) + " cm e concreto asfáltico HCA = " + fmt(0.4 * HR, 1) + " cm.";
    return "Caso 3 — HR > 25 cm: camadas integradas não exclusivamente betuminosas; verificar remoção do revestimento ou camadas e reconstrução.";
  }

  FE.FICHAS["dner-pro-269-94"] = {
    titulo: "Projeto de restauração — TECNAPAV (Método da Resiliência)",
    rotuloImportar: function (r) { return "Dc " + fmt(r.Dc, 1) + " · HR " + fmt(r.HR, 1) + " cm"; },
    resumo: "Dc = D̄ + σ, trincamento característico, grupo do solo (Tabela 1), hef, deflexão admissível D̄̄ (log D̄̄ = 3,148 − 0,188 log Np), reforço HR e soluções de recapeamento (9.3), etapas com espessura limitada (caso 5) e reciclagem (9.5).",
    blocos: [],
    params: DF.params("7.1").filter(function (p) { return p.k !== "universo"; }).concat([
      { k: "dcmodo", r: "Deflexão característica Dc (9.3.1)", tipo: "select", recarrega: true,
        opcoes: [["tab", "Calcular: D̄ + σ das estações da tabela"], ["inf", "Informar Dc"]] },
      { k: "dc", r: "Dc informada (0,01 mm)", se: se("dcmodo", "inf") },
      { k: "trmodo", r: "Trincamento característico TR (9.1.1 c)", tipo: "select", opcoes: [["tab", "Calcular: T̄R + σ dos segmentos-testemunha (eliminação ± 3σ, 8.5)"], ["inf", "Informar TR"]] },
      { k: "tr", r: "TR informado (%)", se: se("trmodo", "inf") },
      { k: "fc2", r: "FC-2 (%) — opcional (caso 4 de 9.3.4)" },
      { k: "fc3", r: "FC-3 (%) — opcional (caso 4 de 9.3.4)" },
      { k: "he", r: "he — espessura do revestimento asfáltico existente (cm)" },
      { k: "hcg", r: "Hcg — espessura da camada granular (cm) (7.7)", dica: "base, sub-base e reforço granulares com < 35 % passando na peneira de 0,075 mm" },
      { k: "solomodo", r: "Solo da 3ª camada (Tabela 1)", tipo: "select", recarrega: true,
        opcoes: [["calc", "Classificar pelo CBR e pela porcentagem de silte"], ["I", "Tipo I"], ["II", "Tipo II"], ["III", "Tipo III"]] },
      { k: "cbr", r: "CBR do solo da 3ª camada (%)", se: se("solomodo", "calc") },
      { k: "p1", r: "P1 — % < 0,005 mm (curva granulométrica)", se: se("solomodo", "calc") },
      { k: "p2", r: "P2 — % < 0,075 mm (curva granulométrica)", se: se("solomodo", "calc"), dica: "S = 100 − P1/P2 × 100 (7.5); ensaio com sedimentação quando P2 > 35 %" },
      { k: "np", r: "Np — N do período de projeto (eixo de 80 kN)", ph: "ex.: 1e7" },
      { k: "hrmax", r: "Espessura máxima de reforço por restrição econômica (cm) — opcional (caso 5)" },
      { k: "n1", r: "N do primeiro ano do período de análise (caso 5)", se: function (d) { return ok(num((d.params || {}).hrmax)); } },
      { k: "tx", r: "Taxa de crescimento anual do tráfego (%) (caso 5)", se: function (d) { return ok(num((d.params || {}).hrmax)); } },
      { k: "recicl", r: "Reciclagem (9.5)", tipo: "select", recarrega: true, opcoes: [["nao", "Não avaliar"], ["sim", "Avaliar reciclagem do revestimento existente"]] },
      { k: "mrc", r: "MRc — módulo de resiliência da mistura reciclada (kgf/cm²)", se: se("recicl", "sim") },
      { k: "sr", r: "σR — resistência à tração da mistura reciclada (kgf/cm²), se MRc não informado", se: se("recicl", "sim"), dica: "NOTA 1: MRc = 5000 σR" },
      { k: "custo", r: "Custo do reforço em CA por km e por cm de espessura — opcional" },
      { k: "juros", r: "Taxa de oportunidade de capital i (%) — opcional", dica: "Co = Cn / (1 + i)^n (9.1.2 f)" },
    ]),
    padrao: { correl: "nao", dcmodo: "tab", trmodo: "tab", solomodo: "calc", recicl: "nao" },
    tabelas: function () {
      return [{ chave: "pts", titulo: "Estações — deflexões (5.2) e trincamento dos segmentos-testemunha (5.3, 7.2)", rotulo: "Estação", iniciais: 10, min: 1,
        dica: "estações a cada 20 m alternadas nas faixas; segmentos-testemunha de 6 m", linhas: DF.linhas({ raio: false, extra: [
          { k: "tri", r: "TRI — área com trincas classes 2 e 3, buracos e remendos", u: "m²" },
          { k: "sup", r: "S — área do segmento-testemunha", u: "m²" },
          { calc: "TR", r: "TR = TRI / S × 100 (7.2)", u: "%", casas: 1 },
        ] }) }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var proc = DF.processar(d, avisos, { semEstat: true });
      DF.verificarExtensao(proc.ext, false, 7000, avisos, "8.7");
      if (ok(proc.ext) && proc.ext < 200) avisos.pop();
      var tab = proc.pts;
      (d.pts || []).forEach(function (p, i) {
        var a = num(p.tri), s = num(p.sup);
        tab[i].TR = ok(a) && ok(s) && s > 0 ? a / s * 100 : NaN;
        tab[i].sit = NaN;
      });
      // Dc
      var cD = DF.caracteristico(tab.map(function (o) { return o.Dv; }), 1, false, 1);
      var Dc = P.dcmodo === "inf" ? num(P.dc) : cD ? cD.car : NaN;
      if (!ok(Dc)) avisos.push("Informe as deflexões das estações ou a Dc (9.3.1).");
      // TR
      var cT = DF.caracteristico(tab.map(function (o) { return o.TR; }), 1, true, 1);
      var TR = P.trmodo === "inf" ? num(P.tr) : cT ? Math.min(100, cT.car) : NaN;
      if (cT && cT.fora.length && P.trmodo !== "inf") avisos.push("Trincamento: " + cT.fora.length + " valor(es) fora de T̄R ± 3σ eliminado(s) da análise — investigar (8.5): " + cT.fora.map(function (x) { return fmt(x, 1) + " %"; }).join(", ") + ".");
      // solo
      var S = NaN, tipo = P.solomodo;
      if (P.solomodo === "calc" || !P.solomodo) {
        var p1 = num(P.p1), p2 = num(P.p2), cbr = num(P.cbr);
        S = ok(p1) && ok(p2) && p2 > 0 ? 100 - p1 / p2 * 100 : NaN;
        tipo = grupoSolo(cbr, S);
        if (!tipo) avisos.push("Informe CBR, P1 e P2 do solo da 3ª camada para a Tabela 1 (7.5, 7.6).");
        if (ok(cbr) && cbr < 2) avisos.push("CBR < 2 %: fora da Tabela 1 — adotado o Tipo III.");
        if (ok(p1) && ok(p2) && p1 > p2) avisos.push("P1 > P2: confira a curva granulométrica (7.5).");
      }
      var he = num(P.he), hcg = num(P.hcg), np = num(P.np), I = Iconst(tipo, hcg);
      if (!ok(he)) avisos.push("Informe he, a espessura do revestimento asfáltico existente (9.1.1 a).");
      if (!ok(hcg)) avisos.push("Informe Hcg, a espessura da camada granular (7.7).");
      if (!ok(np)) avisos.push("Informe Np, o número N do período de projeto (9.3.5).");
      var r = { Dc: Dc, cD: cD, TR: TR, cT: cT, S: S, tipo: tipo, I: I, he: he, hcg: hcg, np: np, etapas: [] };
      if (ok(Dc) && Dc > 0) {
        var hf = hefDe(Dc, I, he); r.hefBruto = hf.bruto; r.hef = hf.h;
        if (hf.bruto < 0) avisos.push("hef calculado " + fmt(hf.bruto, 2) + " cm < 0: adotado hef = 0 (9.3.4, caso 3).");
        if (ok(he) && hf.bruto > he) avisos.push("hef calculado " + fmt(hf.bruto, 2) + " cm > he: adotado hef = he (9.3.4, caso 3).");
      }
      var fc2 = num(P.fc2), fc3 = num(P.fc3);
      if ((ok(TR) && TR > 50) || (ok(fc2) && ok(fc3) && fc2 + fc3 > 80 && fc3 > 30))
        avisos.push("Trincamento elevado (TR > 50 % ou FC-2 + FC-3 > 80 % e FC-3 > 30 %): pode ser conveniente adotar o limite inferior do hef e camadas integradas de CBUQ e pré-misturado contra a reflexão de trincas (9.3.4, caso 4).");
      if (ok(np) && np > 0) r.Dadm = dAdm(np);
      if (ok(r.Dadm) && ok(r.hef)) {
        r.HR = hrDe(r.Dadm, r.hef, I);
        r.sol = solucao(r.HR);
        if (Dc <= r.Dadm) avisos.push("Dc ≤ D̄̄: o pavimento atende ao critério de fadiga sem reforço; HR resulta " + fmt(r.HR, 1) + " cm.");
      }
      // 9.4
      var lim94 = tipo === "III" ? 160 : 140;
      if (ok(Dc) && tipo && Dc > lim94) avisos.push("Dc = " + fmt(Dc / 100, 2) + " mm > " + fmt(lim94 / 100, 2) + " mm com solo Tipo " + tipo + ": contemplar também soluções pelo critério de resistência e verificar remoção e reconstrução (9.4).");
      // caso 5 — espessura máxima
      var hrmax = num(P.hrmax), n1 = num(P.n1), tx = (num(P.tx) || 0) / 100;
      if (ok(hrmax) && ok(r.HR) && hrmax < r.HR) {
        var hefE = r.hef, Nrest = np, ano0 = 0, HRprev = NaN, hefPrev = NaN;
        var V = ok(TR) && ok(he) ? (TR > 50 ? -((he - r.hef) / TR) * 50 + he : -(r.hef / (80 - TR)) * 50 + r.hef + (r.hef / (80 - TR)) * TR) : NaN;
        r.V = V;
        for (var e = 1; e <= 3; e++) {
          var et = { n: e, hef: hefE, Nrest: Nrest };
          if (e > 1) {
            et.T = -((hefPrev + HRprev) / 80) * 50 + hefPrev + HRprev;
            et.hef = hefE = e === 2 ? (et.T + V) / 2 : (hefPrev + et.T) / 2;
          }
          et.Dadm = dAdm(Nrest);
          et.HRnec = hrDe(et.Dadm, et.hef, I);
          if (et.HRnec <= hrmax || e === 3) {
            et.HR = et.HRnec; et.final = true;
            if (et.HRnec > hrmax) avisos.push("Etapa 3 ainda exige HR = " + fmt(et.HRnec, 1) + " cm > " + fmt(hrmax, 1) + " cm: a norma admite no máximo mais duas soluções sucessivas (9.3.7, caso 5) — rever a estratégia.");
            et.ano = ano0;
            r.etapas.push(et);
            break;
          }
          et.HR = hrmax; et.Dlim = dDeHr(hrmax, et.hef, I); et.Nt = ntDe(et.Dlim);
          et.ano = ano0;
          et.vida = vidaAnos(et.Nt, n1, tx, ano0);
          if (!ok(et.vida)) avisos.push("Informe o N do primeiro ano e a taxa de crescimento para a vida de fadiga em anos (9.3.7, caso 5).");
          r.etapas.push(et);
          Nrest = Nrest - et.Nt; ano0 += ok(et.vida) ? et.vida : 0;
          hefPrev = et.hef; HRprev = et.HR;
          if (Nrest <= 0) { et.final = true; break; }
        }
      }
      // reciclagem 9.5
      if (P.recicl === "sim" && ok(Dc) && ok(he)) {
        var rc = {};
        rc.Mef = Math.pow(10, 11.19 - 2.753 * Math.log10(Dc) - 1.714 * Math.log10(he) - 0.0053 * I[0] + 0.2766 * I[1]);
        if (rc.Mef < 1000) { avisos.push("Mef calculado " + fmt(rc.Mef, 0) + " kgf/cm² < 1000: adotado Mef = 1000 kgf/cm² (9.5.1)."); rc.Mef = 1000; }
        rc.MRc = ok(num(P.mrc)) ? num(P.mrc) : ok(num(P.sr)) ? 5000 * num(P.sr) : NaN;
        rc.mu = rc.MRc / rc.Mef;
        rc.linhas = [];
        if (!ok(rc.MRc)) avisos.push("Informe MRc ou σR da mistura reciclada (9.5.2, NOTA 1).");
        else if (rc.mu <= 1) avisos.push("μ = " + fmt(rc.mu, 2) + " ≤ 1: restauração sem reciclagem (itens 9.3 e 9.4), salvo corte mínimo para melhoria do rolamento (9.5.5, caso 1).");
        else {
          if (he - 2 < 3) avisos.push("he − 2 < 3 cm: não há espessura de corte possível (hc ≥ 3 e hc ≤ he − 2).");
          for (var hc = 3; hc <= he - 2 + 1e-9; hc += 1) {
            var Dr = Dc * Math.pow(hc / he * (Math.pow(rc.mu, 1 / 3) - 1) + 1, -1.324), L = { hc: hc, Dr: Dr };
            if (ok(r.Dadm)) {
              L.ok = Dr <= r.Dadm;
              if (!L.ok) { var h2 = hefDe(Dr, I, he).h; L.HR = hrDe(r.Dadm, h2, I); }
            }
            rc.linhas.push(L);
          }
        }
        r.recicl = rc;
      }
      // custos (9.1.2 f)
      var cst = num(P.custo), ij = num(P.juros) / 100;
      if (ok(cst)) {
        var lst = r.etapas.length ? r.etapas : ok(r.HR) ? [{ n: 1, HR: Math.max(0, r.HR), ano: 0 }] : [];
        r.custos = lst.map(function (et) { var Cn = cst * Math.max(0, et.HR); return { n: et.n, ano: et.ano, Cn: Cn, Co: ok(ij) ? Cn / Math.pow(1 + ij, et.ano) : Cn }; });
        r.custoTotal = r.custos.reduce(function (a, c) { return a + c.Co; }, 0);
      }
      return { tab: { pts: tab }, pontos: tab, proc: proc, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, I = DF.item, h = '<div class="fe-res">';
      h += I(fmt(r.Dc, 1) + " <small>0,01 mm</small>", "Dc = D̄ + σ (9.3.1)" + (r.cD ? " — n = " + r.cD.n : ""), true) +
        I(fmt(r.TR, 1) + " <small>%</small>", "Trincamento característico (9.1.1 c)", true) +
        I((r.tipo || "—") + " · I₁ = " + r.I[0] + ", I₂ = " + r.I[1], "Solo da 3ª camada (Tabela 1)" + (ok(r.S) ? " — S = " + fmt(r.S, 1) + " %" : ""), true) +
        I(fmt(r.hef, 2) + " <small>cm</small>", "hef (9.3.4)", true) +
        I(fmt(r.Dadm, 1) + " <small>0,01 mm</small>", "D̄̄ — deflexão máxima admissível (9.3.5)", true) +
        I(fmt(r.HR, 1) + " <small>cm</small>", "HR — reforço em concreto asfáltico (9.3.6)");
      if (r.sol) h += I("", esc(r.sol), true);
      r.etapas.forEach(function (et) { h += I(fmt(et.HR, 1) + " <small>cm</small>", "Etapa " + et.n + (et.final ? " (final)" : " — vida de fadiga " + (ok(et.vida) ? et.vida + " ano(s)" : "?") + ", Nt = " + DF.fmtN(et.Nt)) + " — hef = " + fmt(et.hef, 2) + " cm", true); });
      if (r.recicl && r.recicl.linhas.length) {
        var boa = r.recicl.linhas.filter(function (l) { return l.ok; })[0];
        h += I(boa ? "hc = " + fmt(boa.hc, 0) + " cm" : "mista", "Reciclagem (μ = " + fmt(r.recicl.mu, 2) + "): " + (boa ? "corte com D̄c ≤ D̄̄" : "reciclagem + reforço"), true);
      }
      return h + "</div>";
    },
    graficos: function (calc, d, opt) { return [DF.deflectograma(calc.proc, opt, "Dc")]; },
    relatorio: {
      notas: "Dc = D̄ + σ (sem eliminação de valores); TR = T̄R + σ após eliminar valores fora de T̄R ± 3σ (8.5). hef = −5,737 + 807,961/Dc + 0,972 I₁ + 4,101 I₂, limitado a 0 ≤ hef ≤ he; log D̄̄ = 3,148 − 0,188 log Np; HR = −19,015 + 238,14/√D̄̄ − 1,357 hef + 1,016 I₁ + 3,893 I₂. " +
        "Caso 5: D̄̄ correspondente a HRmáx pela inversão da equação de HR, log Nt = (3,148 − log D̄̄)/0,188, vida A com Σ Ni/Nt ≤ 1 (Ni = N1 (1 + t)^(i−1)), hef das etapas seguintes por V, Ti, hef2 = (T2 + V)/2 e hef3 = (hef2 + T3)/2, com N restante = Np − Nt. " +
        "Reciclagem: log Mef = 11,19 − 2,753 log Dc − 1,714 log he − 0,0053 I₁ + 0,2766 I₂ (≥ 1000 kgf/cm²); μ = MRc/Mef; D̄c = Dc [hc/he (μ^(1/3) − 1) + 1]^(−1,324), 3 ≤ hc ≤ he − 2.",
      resultados: function (calc) {
        var r = calc.resultados, rows = [];
        rows.push(["Deflexão característica Dc", fmt(r.Dc, 1) + " × 0,01 mm" + (r.cD ? " (D̄ = " + fmt(r.cD.media, 1) + "; σ = " + fmt(r.cD.sd, 1) + "; n = " + r.cD.n + ")" : "")]);
        rows.push(["Trincamento característico", fmt(r.TR, 1) + " %"]);
        rows.push(["Estrutura de referência", "he = " + fmt(r.he, 1) + " cm; Hcg = " + fmt(r.hcg, 1) + " cm; solo Tipo " + (r.tipo || "—") + (ok(r.S) ? " (S = " + fmt(r.S, 1) + " %)" : "") + "; I₁ = " + r.I[0] + ", I₂ = " + r.I[1]]);
        rows.push(["hef / D̄̄", fmt(r.hef, 2) + " cm / " + fmt(r.Dadm, 1) + " × 0,01 mm (Np = " + DF.fmtN(r.np) + ")"]);
        rows.push(["Reforço HR", fmt(r.HR, 1) + " cm — " + (r.sol || "")]);
        r.etapas.forEach(function (et) {
          rows.push(["Etapa " + et.n, "hef = " + fmt(et.hef, 2) + " cm" + (ok(et.T) ? " (T = " + fmt(et.T, 2) + ")" : "") + "; N = " + DF.fmtN(et.Nrest) + "; D̄̄ = " + fmt(et.Dadm, 1) + "; HR necessário " + fmt(et.HRnec, 1) + " cm → adotado " + fmt(et.HR, 1) + " cm" +
            (et.final ? "" : "; D̄̄ para HRmáx = " + fmt(et.Dlim, 1) + "; Nt = " + DF.fmtN(et.Nt) + "; vida " + (ok(et.vida) ? et.vida + " ano(s)" : "—"))]);
        });
        if (ok(r.V)) rows.push(["V (hef da etapa seguinte)", fmt(r.V, 2) + " cm"]);
        if (r.recicl) {
          var rc = r.recicl;
          rows.push(["Reciclagem — Mef / MRc / μ", fmt(rc.Mef, 0) + " / " + fmt(rc.MRc, 0) + " kgf/cm² / " + fmt(rc.mu, 2)]);
          rc.linhas.forEach(function (l) { rows.push(["Corte hc = " + fmt(l.hc, 0) + " cm", "D̄c = " + fmt(l.Dr, 1) + (l.ok ? " ≤ D̄̄ — reciclagem é alternativa" : " > D̄̄ — reciclagem + reforço HR = " + fmt(l.HR, 1) + " cm")]); });
        }
        if (r.custos) rows.push(["Custo atualizado (9.1.2 f)", r.custos.map(function (c) { return "etapa " + c.n + " (ano " + c.ano + "): " + fmt(c.Co, 0); }).join("; ") + " — total " + fmt(r.custoTotal, 0) + " por km"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Subtrecho em CBUQ 7 cm, solo Tipo I — reforço em camada única (dados gerados)", dados: function () {
        var p = DF.exemploEstacoes(86, 14, 0, 23).map(function (x, i) { delete x.R; x.tri = fmt([0, 0, 0.6, 1.2, 0, 2.4, 0.8, 0, 1.8, 0.4][i % 10], 1); x.sup = "21,0"; return x; });
        return { ident: { registro: "EX-TEC-001", data: "2026-04-22", obra: "BR-000", trecho: "Subtrecho homogêneo 3 — est. 100 a 119", camada: "CBUQ 7 cm, BGS 15 cm, SB 20 cm" },
          params: { correl: "nao", dcmodo: "tab", trmodo: "tab", fc2: "8", fc3: "2", he: "7", hcg: "35", solomodo: "calc", cbr: "12", p1: "19", p2: "28", np: "1e7", recicl: "nao", custo: "95000", juros: "12" },
          pts: p };
      } },
      { nome: "Espessura limitada a 8 cm — etapas, reciclagem e solo Tipo III (dados gerados)", dados: function () {
        var p = DF.exemploEstacoes(128, 22, 0, 29).map(function (x, i) { delete x.R; x.tri = fmt([6, 9, 12.5, 8, 14, 10, 7.5, 11, 13, 9][i % 10], 1); x.sup = "21,0"; return x; });
        return { ident: { registro: "EX-TEC-002", data: "2026-09-10", obra: "BR-000", trecho: "Subtrecho homogêneo 7", camada: "CBUQ 10 cm, solo-brita 30 cm" },
          params: { correl: "nao", dcmodo: "tab", trmodo: "tab", fc2: "55", fc3: "35", he: "10", hcg: "30", solomodo: "calc", cbr: "7", p1: "12", p2: "58", np: "3e7",
            hrmax: "8", n1: "1,8e6", tx: "3", recicl: "sim", sr: "9", custo: "95000", juros: "12" },
          pts: p };
      } },
    ],
  };
})();
