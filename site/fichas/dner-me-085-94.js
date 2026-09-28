/*
 * Ficha: DNER-ME 085/94 — Material finamente pulverizado — Massa específica real (frasco de Le Chatelier).
 * μ = massa do material / volume de líquido deslocado (leitura final − leitura inicial, 5.1); duplicatas não
 * devem diferir mais de 0,009 g/cm³ (5.3). Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var TOL = 0.009;  // 5.3

  FE.FICHAS["dner-me-085-94"] = {
    titulo: "Material finamente pulverizado — Massa específica real (frasco de Le Chatelier)",
    resumo: "Cimento Portland, solos finos e material de enchimento: cerca de 60 g no frasco de Le Chatelier com querosene ou nafta; μ = massa / volume deslocado (leitura final − inicial); duplicatas com diferença ≤ 0,009 g/cm³ (5.3).",
    blocos: [],
    rotuloImportar: function (r) { return "μ " + (ok(r.mu) ? fmt(r.mu, 2) : "—") + " g/cm³"; },
    params: [
      { k: "material", r: "Material", ph: "ex.: cimento Portland CP II-F-32, cal hidratada, pó calcário" },
      { k: "liquido", r: "Líquido (3 b)", tipo: "select", opcoes: [["querosene", "Querosene livre de água (> 62° API)"], ["nafta", "Nafta livre de água (> 62° API)"]] },
      { k: "banho", r: "Temperatura do banho d'água (°C)", ph: "ex.: 23,0", dica: "banho de temperatura constante; termômetro graduado em 0,2 °C (3 d e 4 e)" },
      { k: "referencia", r: "Valor esperado (g/cm³) — opcional", dica: "ex.: cimento Portland ≈ 3,0 a 3,15; só para conferência grosseira" },
    ],
    padrao: { liquido: "querosene" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações (duplicata)", rotulo: "Det.", iniciais: 2, min: 1, usar: true,
        dica: "uma coluna por frasco; leituras com o frasco no banho, repetidas até ficarem constantes (4 e). Desmarque \"usar\" para excluir uma determinação.",
        linhas: [
          { k: "frasco", r: "Frasco nº", texto: true },
          { grupo: "Leitura inicial — líquido entre as graduações 0 e 1 ml (4 a, 4 b)" },
          { k: "Li", r: "Leitura inicial do nível do líquido", u: "ml" },
          { k: "Ti", r: "Temperatura do banho na leitura inicial", u: "°C" },
          { grupo: "Material — cerca de 60 g, em pequenas porções, ar expulso por rotação (4 c, 4 d)" },
          { k: "mR", r: "Recipiente + material antes da colocação", u: "g" },
          { k: "mS", r: "Recipiente + sobra após a colocação", u: "g" },
          { k: "mDir", r: "…ou massa do material colocado (direta)", u: "g", ph: "opcional" },
          { calc: "m", r: "Massa do material ensaiado", u: "g", casas: 2 },
          { grupo: "Leitura final — nível na faixa superior da graduação, 18 a 24 ml (nota do 4 d; Figura)" },
          { k: "Lf", r: "Leitura final do nível do líquido", u: "ml" },
          { k: "Tf", r: "Temperatura do banho na leitura final", u: "°C" },
          { calc: "V", r: "Volume de líquido deslocado = final − inicial (5.1)", u: "cm³", casas: 2 },
          { calc: "mu", r: "Massa específica real μ = massa / volume (5.1)", u: "g/cm³", casas: 3, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var det = (d.det || []).map(function (x, i) {
        var rot = "Determinação " + (i + 1), o = { usar: x.usar !== false };
        var mDir = num(x.mDir), mR = num(x.mR), mS = num(x.mS);
        o.m = ok(mDir) ? mDir : ok(mR) && ok(mS) ? mR - mS : NaN;
        var Li = num(x.Li), Lf = num(x.Lf);
        o.V = ok(Li) && ok(Lf) ? Lf - Li : NaN;
        o.mu = ok(o.m) && ok(o.V) && o.V > 0 ? o.m / o.V : NaN;
        if (ok(Li) && (Li < 0 || Li > 1)) avisos.push(rot + ": leitura inicial de " + fmt(Li, 2) + " ml — o líquido deve ficar entre as graduações 0 e 1 ml (4 a).");
        if (ok(Lf) && (Lf < 18 || Lf > 24)) avisos.push(rot + ": leitura final de " + fmt(Lf, 2) + " ml — com a quantidade apropriada de material o nível fica na faixa superior da graduação, 18 a 24 ml (nota do 4 d); ajuste a massa de material.");
        if (ok(o.m) && (o.m < 50 || o.m > 70)) avisos.push(rot + ": " + fmt(o.m, 2) + " g de material — a norma indica cerca de 60 g (4 c).");
        if (ok(o.V) && o.V <= 0) avisos.push(rot + ": leitura final não é maior que a inicial — confira as leituras.");
        var Ti = num(x.Ti), Tf = num(x.Tf);
        if (ok(Ti) && ok(Tf) && Math.round(Math.abs(Tf - Ti) * 10) / 10 > 0.2) avisos.push(rot + ": temperaturas do banho nas leituras inicial (" + fmt(Ti, 1) + " °C) e final (" + fmt(Tf, 1) + " °C) diferem mais de 0,2 °C — as leituras devem ser feitas com banho e conteúdo do frasco na mesma temperatura, até leitura constante (4 e).");
        if (ok(o.mu) && (o.mu < 1.5 || o.mu > 4)) avisos.push(rot + ": μ = " + fmt(o.mu, 3) + " g/cm³ — valor incomum para pós minerais; confira massa e leituras.");
        return o;
      });
      var vals = det.filter(function (o) { return o.usar && ok(o.mu); }).map(function (o) { return o.mu; });
      var amp = vals.length >= 2 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : NaN;
      var conforme = ok(amp) ? Math.round(amp * 1000) <= TOL * 1000 : null;
      if (vals.length === 1) avisos.push("A norma prevê determinações em duplicata (5.3); há uma só.");
      if (conforme === false) avisos.push("As determinações diferem " + fmt(amp, 3) + " g/cm³ (mais de 0,009 g/cm³, 5.3) — repita o ensaio.");
      var m = media(vals), ref = num(P.referencia);
      var mu = ok(m) ? Math.round(m * 100) / 100 : NaN;
      if (ok(mu) && ok(ref) && Math.abs(mu - ref) > 0.1) avisos.push("μ = " + fmt(mu, 2) + " g/cm³ difere mais de 0,1 g/cm³ do valor esperado de " + fmt(ref, 2) + " g/cm³ — confira o material e o ensaio.");
      var Tb = num(P.banho);
      det.forEach(function (o, i) {
        var x = d.det[i], Ti = num(x.Ti);
        if (ok(Tb) && ok(Ti) && Math.round(Math.abs(Ti - Tb) * 10) / 10 > 0.2) avisos.push("Determinação " + (i + 1) + ": temperatura na leitura inicial difere mais de 0,2 °C da do banho (4 e).");
      });
      return { tab: { det: det }, resultados: { mu: mu, muExato: m, amp: amp, n: vals.length, conforme: conforme }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.mu) ? fmt(r.mu, 2) : "—") + ' <small>g/cm³</small></div>' +
        '<div class="fe-res-r">Massa específica real — média de ' + r.n + " determinação(ões)" + (ok(r.muExato) ? " (" + fmt(r.muExato, 3) + ")" : "") + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.amp) ? fmt(r.amp, 3) + " g/cm³" : "—") + "</div>" +
        '<div class="fe-res-r">Diferença entre as determinações (limite 0,009 g/cm³, 5.3)' +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">aceita</span>' : ' · <span class="fe-nok">repetir</span>') + "</div></div></div>";
    },
    relatorio: {
      parametros: [["Aparelhagem", "Frasco de Le Chatelier (graduações 0–1 ml e 18–24 ml), balança de 200 g sensível a 0,01 g, termômetro de 0,2 °C, banho d'água (3)"]],
      notas: "Volume deslocado = leitura final − leitura inicial; μ = massa do material / volume deslocado (5.1). Determinações em duplicata não devem diferir mais de 0,009 g/cm³ (5.3). Resultado: média das determinações aceitas, com duas casas (a norma não fixa o arredondamento; determinações com três casas para a verificação de 5.3). A norma impressa salta do item 5.1 para o 5.3.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Massa específica real", (ok(r.mu) ? fmt(r.mu, 2) : "—") + " g/cm³ (média de " + r.n + " determinação(ões))"]);
        rows.push(["Diferença entre as determinações", (ok(r.amp) ? fmt(r.amp, 3) + " g/cm³" : "—") + (r.conforme === null ? "" : r.conforme ? " — aceita (≤ 0,009)" : " — NÃO ACEITA (> 0,009): repetir")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Cimento Portland — duplicata aceita", dados: function () {
        // alvo μ ≈ 3,08 g/cm³: 60,0 g deslocam ≈ 19,5 cm³
        return { ident: { registro: "EX-LC-001", obra: "Obra A", origem: "Fornecedor A", camada: "Cimento para solo-cimento", data: "2025-09-10" },
          params: { material: "Cimento Portland CP II-F-32", liquido: "querosene", banho: "23,0", referencia: "3,08" },
          det: [{ usar: true, frasco: "LC-1", Li: "0,40", Ti: "23,0", mR: "182,46", mS: "122,41", Lf: "19,90", Tf: "23,1" },
            { usar: true, frasco: "LC-2", Li: "0,60", Ti: "23,0", mR: "180,12", mS: "120,05", Lf: "20,10", Tf: "23,0" }] };
      } },
      { nome: "Fíler calcário — duplicata fora de 0,009 g/cm³, leitura final abaixo da faixa", dados: function () {
        return { ident: { registro: "EX-LC-002", origem: "Pedreira X", camada: "Material de enchimento (fíler)", data: "2025-10-06" },
          params: { material: "Pó calcário (fíler)", liquido: "nafta", banho: "22,5", referencia: "2,70" },
          det: [{ usar: true, frasco: "LC-1", Li: "0,20", Ti: "22,5", mDir: "45,20", Lf: "17,00", Tf: "22,6" },
            { usar: true, frasco: "LC-2", Li: "0,30", Ti: "22,5", mDir: "55,10", Lf: "20,90", Tf: "22,9" }] };
      } },
    ],
  };
})();
