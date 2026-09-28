/*
 * Ficha: DNER-ME 203/94 — Solo-cimento — Durabilidade por molhagem e secagem (perda de massa corrigida).
 * CPs moldados e curados conforme a DNER-ME 202/94; 12 ciclos de 5 h de imersão + 42 h a 70 °C + escovação.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Tabela (6.1): porcentagem média de água adsorvida pelo CP após secagem a 110 °C, por grupo AASHTO
  var GRUPOS = [["A-1", 1.5], ["A-3", 1.5], ["A-2", 2.5], ["A-4", 3.0], ["A-5", 3.0], ["A-6", 3.5], ["A-7", 3.5]];
  var VOL = 1000;  // molde da DNER-ME 202/94 (4.1): 1 000 cm³ ± 10 cm³

  function adsorvida(g) { return (GRUPOS.filter(function (x) { return x[0] === g; })[0] || [])[1]; }

  FE.FICHAS["dner-me-203-94"] = {
    titulo: "Solo-cimento — Durabilidade por molhagem e secagem",
    resumo: "Perda de massa de CPs de solo-cimento (passante na 19 mm) após 12 ciclos de molhagem (5 h), secagem a 70 °C (42 h) e escovação: massa seca inicial mi pela umidade de moldagem, massa seca final mf, massa corrigida mc = mf / (A + 100) × 100 com a água adsorvida A da Tabela, e Pm = (mi − mc) / mi × 100.",
    blocos: ["umidade"],
    params: [
      { k: "grupo", r: "Classificação do solo — AASHTO M 145 (Tabela)", tipo: "select",
        opcoes: [["", "—"]].concat(GRUPOS.map(function (g) { return [g[0], g[0] + " — A = " + fmt(g[1], 1) + " %"]; })),
        dica: "define a água adsorvida A usada na correção da massa seca final (6.1)" },
      { k: "cimento", r: "Teor de cimento (% da massa de solo seco)", ph: "ex.: 7" },
      { k: "moldagem", r: "Moldagem (DNER-ME 202/94)", tipo: "select", opcoes: [["A", "Método A — passante na 4,8 mm"], ["B", "Método B — passante na 19 mm"]] },
      { k: "ciclos", r: "Ciclos completados", ph: "12", dica: "12 ciclos de molhagem, secagem e escovação (5.5)" },
      { k: "hOt", r: "Umidade ótima — DNER-ME 216 (%) — opcional", dica: "CP rejeitado se a umidade de moldagem diferir mais de 1 ponto (DNER-ME 202, 6.2.3)" },
      { k: "gMax", r: "Massa específica aparente seca máxima — DNER-ME 216 (g/cm³) — opcional", dica: "CP rejeitado se γs diferir mais de 0,030 g/cm³ (DNER-ME 202, 6.2.3)" },
      { k: "volume", r: "Volume do molde (cm³)", ph: String(VOL), dica: "para a massa específica aparente seca do CP (DNER-ME 202, 6.1.2)" },
      { k: "pmMax", r: "Perda de massa máxima admitida (%) — opcional", dica: "da especificação ou do critério de dosagem adotado" },
    ],
    padrao: { moldagem: "A", ciclos: "12" },
    tabelas: function () {
      var U = FE.BLOCOS.umidade.linhas("c1", "", "lab").map(function (l) {
        return l.calc ? { calc: "h", r: "Umidade de moldagem h (DNER-ME 202, 6.1.1)", u: "%", casas: 2 } : l;
      });
      return [{ chave: "cps", titulo: "Corpos de prova", rotulo: "CP", iniciais: 2, min: 1,
        dica: "uma coluna por corpo de prova moldado e curado 7 dias em câmara úmida (5.1 e 5.2)",
        linhas: [{ grupo: "Moldagem — DNER-ME 202/94 (5.1)" }, { k: "mu", r: "Massa do CP úmido recém-moldado (mu)", u: "g" }]
          .concat(U)
          .concat([{ calc: "gs", r: "γs do CP = mu / v × 100 / (100 + h)", u: "g/cm³", casas: 3 },
            { calc: "mi", r: "Massa seca inicial mi = mu × 100 / (100 + h) (3.3)", u: "g", casas: 1 },
            { grupo: "Após os 12 ciclos — estufa a 105–110 °C até massa constante (5.6)" },
            { k: "mf", r: "Massa seca final (mf)", u: "g" },
            { calc: "A", r: "Água adsorvida A (Tabela)", u: "%", casas: 1 },
            { calc: "mc", r: "Massa seca final corrigida mc = mf / (A + 100) × 100 (6.1)", u: "g", casas: 1 },
            { calc: "pm", r: "Perda de massa Pm = (mi − mc) / mi × 100 (6.2)", u: "%", casas: 1, destaque: true }]),
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], A = adsorvida(P.grupo);
      var V = ok(num(P.volume)) ? num(P.volume) : VOL, hOt = num(P.hOt), gMax = num(P.gMax), pmMax = num(P.pmMax);
      var cps = (d.cps || []).map(function (p, i) {
        var rot = "CP " + (i + 1), o = {};
        var u = FE.BLOCOS.umidade.calcular(p, "c1", "lab");
        var mu = num(p.mu), mf = num(p.mf);
        o.h = u.w;
        o.mi = ok(mu) && ok(o.h) ? mu * 100 / (100 + o.h) : NaN;
        o.gs = ok(o.mi) ? o.mi / V : NaN;
        o.A = ok(A) ? A : NaN;
        o.mc = ok(mf) && ok(A) ? mf / (A + 100) * 100 : NaN;
        o.pm = ok(o.mi) && ok(o.mc) ? (o.mi - o.mc) / o.mi * 100 : NaN;
        if (ok(mf) && ok(mu) && mf > mu) avisos.push(rot + ": massa seca final maior que a massa úmida de moldagem — confira as pesagens.");
        if (ok(o.pm) && o.pm < 0) avisos.push(rot + ": perda de massa negativa (mc > mi) — confira a umidade de moldagem e as pesagens.");
        if (ok(hOt) && ok(o.h) && Math.abs(o.h - hOt) > 1) avisos.push(rot + ": umidade de moldagem " + fmt(o.h, 1) + " % difere mais de 1 ponto da umidade ótima (" + fmt(hOt, 1) + " %) — o CP deve ser rejeitado (DNER-ME 202, 6.2.3).");
        if (ok(gMax) && ok(o.gs) && Math.abs(o.gs - gMax) > 0.030 + 1e-9) avisos.push(rot + ": γs = " + fmt(o.gs, 3) + " g/cm³ difere mais de 0,030 g/cm³ da máxima (" + fmt(gMax, 3) + ") — o CP deve ser rejeitado (DNER-ME 202, 6.2.3).");
        return o;
      });
      if (!ok(A)) avisos.push("Escolha a classificação AASHTO do solo: a água adsorvida A (Tabela) é necessária para corrigir a massa seca final (6.1).");
      var ciclos = num(P.ciclos);
      if (ok(ciclos) && ciclos < 12) avisos.push("Foram completados " + fmt(ciclos, 0) + " ciclos; o ensaio prevê 12 ciclos de molhagem, secagem e escovação (5.5).");
      var pms = cps.map(function (o) { return o.pm; }).filter(ok);
      var pm = pms.length ? media(pms) : NaN, pmMaxCp = pms.length ? Math.max.apply(null, pms) : NaN;
      var conforme = ok(pm) && ok(pmMax) ? pmMaxCp <= pmMax : null;
      if (conforme === false) avisos.push("Perda de massa acima da máxima admitida de " + fmt(pmMax, 1) + " % (" + cps.map(function (o, i) { return ok(o.pm) && o.pm > pmMax ? "CP " + (i + 1) + ": " + fmt(o.pm, 1) + " %" : ""; }).filter(Boolean).join("; ") + ").");
      return { tab: { cps: cps }, resultados: { pm: pm, pmMaxCp: pmMaxCp, n: pms.length, A: A, conforme: conforme, pmMax: pmMax }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' + cx(fmt(r.pm, 1) + " <small>%</small>", "Perda de massa Pm (6.2) — média de " + r.n + " CP(s)" +
          (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>')) +
        cx(fmt(r.pmMaxCp, 1) + " <small>%</small>", "Maior perda individual") +
        cx(ok(r.A) ? fmt(r.A, 1) + " %" : "—", "Água adsorvida A — " + esc((d.params || {}).grupo || "grupo não informado"), true) + "</div>";
    },
    relatorio: {
      parametros: [["Ciclo", "Imersão 5 h em água à temperatura ambiente + estufa 70 °C ± 2 °C por 42 h + escovação (18 a 20 passadas na lateral, 4 em cada base, ≈ 15 N)"]],
      notas: "mi = mu × 100 / (100 + h), massa seca inicial calculada na moldagem (3.3; DNER-ME 202/94); mc = mf / (A + 100) × 100 (6.1), com A da Tabela (A-1 e A-3: 1,5 %; A-2: 2,5 %; A-4 e A-5: 3,0 %; A-6 e A-7: 3,5 %); Pm = (mi − mc) / mi × 100 (6.2). Resultado por CP, com aproximação de 0,1 %, e média. Rejeição do CP (DNER-ME 202, 6.2.3): umidade de moldagem diferente da ótima em mais de 1 ponto ou γs diferente da máxima em mais de 0,030 g/cm³ (o texto impresso diz \"30 g/cm³\").",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.cimento) rows.push(["Teor de cimento", P.cimento + " %"]);
        rows.push(["Classificação AASHTO / água adsorvida A", (P.grupo || "—") + " / " + (ok(r.A) ? fmt(r.A, 1) + " %" : "—")]);
        calc.tab.cps.forEach(function (o, i) { if (ok(o.pm)) rows.push(["Perda de massa — CP " + (i + 1), fmt(o.pm, 1) + " %"]); });
        rows.push(["Perda de massa média (Pm)", fmt(r.pm, 1) + " %" + (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.pmMax, 1) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.pmMax, 1) + " %")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Solo arenoso A-2 + 7 % de cimento — 2 CPs", dados: function () {
        return { ident: { registro: "EX-DU-001", camada: "Base — solo-cimento", origem: "Jazida 1" },
          params: { grupo: "A-2", cimento: "7", moldagem: "A", ciclos: "12", hOt: "10,3", gMax: "1,919", volume: "998", pmMax: "14" },
          cps: [cp(2105, 10.6, 1792, 21.40), cp(2110, 10.1, 1818, 19.85)] };
      } },
      { nome: "Argila A-6 + 9 % de cimento — perda acima do máximo admitido", dados: function () {
        return { ident: { registro: "EX-DU-002", camada: "Sub-base — solo-cimento (dosagem)", origem: "Jazida 3" },
          params: { grupo: "A-6", cimento: "9", moldagem: "A", ciclos: "12", pmMax: "7" },
          cps: [cp(1935, 18.4, 1540, 16.30), cp(1928, 18.7, 1519, 17.12), cp(1940, 18.2, 1572, 15.77)] };
      } },
      { nome: "Silte A-4 — CP fora da umidade ótima e ensaio interrompido no 11º ciclo", dados: function () {
        return { ident: { registro: "EX-DU-003", camada: "Solo-cimento (estudo)", origem: "Jazida 5" },
          params: { grupo: "A-4", cimento: "8", moldagem: "A", ciclos: "11", hOt: "14,2", gMax: "1,742", volume: "1000", pmMax: "10" },
          cps: [cp(1985, 14.5, 1668, 18.05), cp(2004, 15.9, 1661, 20.60)] };
      } },
    ],
  };

  // CP de exemplo: massa úmida, umidade de moldagem (porção com 100 g de solo seco), massa seca final e tara
  function cp(mu, h, mf, tara) {
    return { mu: String(mu), c1n: String(Math.round(tara)), c1t: fmt(tara, 2), c1s: fmt(tara + 100, 2), c1u: fmt(tara + 100 + h, 2), mf: String(mf) };
  }
})();
