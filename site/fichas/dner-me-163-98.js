/*
 * Ficha: DNER-ME 163/98 — Materiais betuminosos — Determinação da ductilidade.
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * Três corpos de prova; ductilidade = média das três distâncias de ruptura (6.1); repetibilidade: cada resultado
 * dentro de ±10 % da média (7.1). Distância além do curso do ductilômetro é lançada como "> x".
 * Limites opcionais (mínimos, em cm): DNIT 095/2006-EM (CAP, Tabela 1 — os mesmos de site/fichas/dnit-095-2006-em.js),
 * DNIT 165/2013-EM (resíduo de emulsão), DNER-EM 362/97 e 363/97 (resíduo de asfalto diluído, com a Nota dos 15 °C)
 * e DNIT 168/2013-EM (CAP modificado por TLA).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // [chave, rótulo, mínimo (cm), temperatura da especificação (°C)]
  var ESPEC = [
    ["", "Sem comparação com especificação", null, null],
    ["cap30", "CAP 30/45 — DNIT 095/2006-EM (≥ 60 cm a 25 °C)", 60, 25],
    ["cap50", "CAP 50/70 — DNIT 095/2006-EM (≥ 60 cm a 25 °C)", 60, 25],
    ["cap85", "CAP 85/100 — DNIT 095/2006-EM (≥ 100 cm a 25 °C)", 100, 25],
    ["cap150", "CAP 150/200 — DNIT 095/2006-EM (≥ 100 cm a 25 °C)", 100, 25],
    ["cap30r", "CAP 30/45 após RTFOT — DNIT 095/2006-EM (≥ 10 cm)", 10, 25],
    ["cap50r", "CAP 50/70 após RTFOT — DNIT 095/2006-EM (≥ 20 cm)", 20, 25],
    ["cap85r", "CAP 85/100 após RTFOT — DNIT 095/2006-EM (≥ 50 cm)", 50, 25],
    ["cap150r", "CAP 150/200 após RTFOT — DNIT 095/2006-EM (≥ 50 cm)", 50, 25],
    ["emul", "Resíduo de emulsão — DNIT 165/2013-EM (≥ 40 cm a 25 °C)", 40, 25],
    ["dil", "Resíduo de asfalto diluído — DNER-EM 362/97 e 363/97 (≥ 100 cm a 25 °C, ou > 100 cm a 15 °C)", 100, 25],
    ["tla", "CAP-TLA — DNIT 168/2013-EM (≥ 100 cm a 25 °C, 5 cm/min)", 100, 25],
    ["tlar", "CAP-TLA após RTFOT — DNIT 168/2013-EM (≥ 50 cm)", 50, 25],
    ["outro", "Outra — informar o mínimo", null, null],
  ];
  function espec(P) { return ESPEC.filter(function (x) { return x[0] === (P.espec || ""); })[0] || ESPEC[0]; }
  // "> 150" / "≥150" (não rompeu até o fim do curso) -> {v, maior}
  function lerValor(v) {
    var s = String(v === undefined || v === null ? "" : v).trim();
    var maior = /^[>≥]/.test(s);
    return { v: num(s.replace(/^[>≥]\s*/, "")), maior: maior };
  }
  // ocorrência da Nota 3 (tocou a superfície ou o fundo do banho): em branco / "não" / "ok" = válido
  function valido(txt) { var s = String(txt || "").trim(); return !s || /^(n[aã]o|nenhuma?|ok|normal|-|—)/i.test(s); }

  FE.FICHAS["dner-me-163-98"] = {
    titulo: "Ductilidade de materiais betuminosos",
    resumo: "Três corpos de prova tracionados no ductilômetro a (50 ± 2,5) mm/min em banho a (25 ± 0,5) °C; ductilidade = média das três distâncias de ruptura; cada resultado deve ficar a até 10 % da média.",
    blocos: [],
    params: [
      { k: "material", r: "Material betuminoso", ph: "ex.: CAP 50/70, resíduo de emulsão RR-2C, resíduo de CM-30" },
      { k: "unidade", r: "Unidade da leitura no ductilômetro", tipo: "select", recarrega: true, opcoes: [["cm", "centímetros (cm)"], ["mm", "milímetros (mm)"]],
        dica: "a norma expressa em mm (6.1); as especificações, em cm" },
      { k: "temp", r: "Temperatura do ensaio (°C)", tipo: "select", recarrega: true,
        opcoes: [["25", "25 °C (Nota 1)"], ["15", "15 °C (Nota das DNER-EM 362/97 e 363/97)"], ["outra", "Outra"]] },
      { k: "tempOutra", r: "Temperatura do ensaio — outra (°C)", se: function (d) { return (d.params || {}).temp === "outra"; } },
      { k: "velocidade", r: "Velocidade de tração (mm/min)", ph: "50", dica: "(50 ± 2,5) mm/min, salvo outra indicação (Nota 1)" },
      { k: "curso", r: "Curso máximo do ductilômetro (cm) — opcional", dica: "leitura igual ao curso é tratada como \"> curso\"" },
      { k: "espec", r: "Especificação para comparação — opcional", tipo: "select", recarrega: true, opcoes: ESPEC.map(function (x) { return [x[0], x[1]]; }),
        dica: "limites mínimos de ductilidade das EM de ligantes" },
      { k: "minimo", r: "Ductilidade mínima (cm)", se: function (d) { return (d.params || {}).espec === "outro"; } },
      { k: "outroLab", r: "Resultado de outro laboratório (cm) — opcional", dica: "reprodutibilidade: diferença > 20 % da média não é confiável (7.2)" },
    ],
    padrao: { unidade: "cm", temp: "25", espec: "" },
    tabelas: function (d) {
      var u = (d.params || {}).unidade === "mm" ? "mm" : "cm";
      return [{
        chave: "cp", titulo: "Corpos de prova", rotulo: "Corpo de prova", iniciais: 3, min: 3, fixo: true, nomes: ["1", "2", "3"],
        dica: "distância entre as garras no instante da ruptura (5.3.6); se não romper até o fim do curso, escreva \"> curso\" (ex.: > 150)",
        linhas: [
          { k: "dist", r: "Distância na ruptura (5.3.6)", u: u, texto: true, ph: u === "mm" ? "ex.: 1050 ou > 1500" : "ex.: 105 ou > 150" },
          { k: "ocorr", r: "Tocou a superfície ou o fundo do banho? (Nota 3)", u: "", texto: true, ph: "não" },
          { calc: "cm", r: "Ductilidade", u: "cm", casas: 1, destaque: true },
          { calc: "desv", r: "Desvio em relação à média (máx. 10 %, 7.1)", u: "%", casas: 1 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], mm = P.unidade === "mm";
      var curso = num(P.curso);
      var cps = (d.cp || []).map(function (x, i) {
        var l = lerValor(x.dist), v = ok(l.v) ? (mm ? l.v / 10 : l.v) : NaN;
        var o = { cm: v, maior: l.maior, valido: valido(x.ocorr) };
        if (ok(v) && ok(curso) && v >= curso - 1e-9 && !l.maior) { o.maior = true; }
        if (ok(v) && ok(curso) && v > curso + 1e-9) avisos.push("Corpo de prova " + (i + 1) + ": distância maior que o curso informado do ductilômetro (" + fmt(curso, 0) + " cm) — confira.");
        if (ok(v) && !o.valido) avisos.push("Corpo de prova " + (i + 1) + ": o material tocou a superfície ou o fundo do banho — o ensaio não deve ser considerado (Nota 3); ajuste a densidade do banho com álcool ou cloreto de sódio e repita.");
        return o;
      });
      var val = cps.filter(function (o) { return ok(o.cm) && o.valido; });
      var m = media(val.map(function (o) { return o.cm; }));
      var algumMaior = val.some(function (o) { return o.maior; });
      var todosMaior = val.length && val.every(function (o) { return o.maior; });
      cps.forEach(function (o) { o.desv = ok(o.cm) && o.valido && ok(m) && m > 0 && !algumMaior ? (o.cm - m) / m * 100 : NaN; });
      if (val.length && val.length < 3) avisos.push("A ductilidade é a média de 3 determinações (6.1); há " + val.length + " válida(s).");
      // repetibilidade (7.1) — só com as três distâncias medidas (sem "> curso")
      var maxDesv = NaN;
      if (val.length >= 2 && !algumMaior) {
        maxDesv = Math.max.apply(null, cps.filter(function (o) { return ok(o.desv); }).map(function (o) { return Math.abs(o.desv); }));
        if (maxDesv > 10 + 1e-9) avisos.push("Um resultado difere " + fmt(maxDesv, 1) + " % da média (limite 10 %, 7.1): a triplicata não é confiável — repita o ensaio.");
      } else if (algumMaior && !todosMaior) {
        avisos.push("Há corpo de prova que não rompeu até o fim do curso: a média é um limite inferior (\"> " + fmt(m, 1) + " cm\") e a repetibilidade (7.1) não pode ser verificada.");
      }
      // condições do ensaio (Nota 1)
      var temp = P.temp === "outra" ? num(P.tempOutra) : num(P.temp || "25"), vel = num(P.velocidade);
      if (ok(vel) && Math.abs(vel - 50) > 2.5 + 1e-9) avisos.push("Velocidade de " + fmt(vel, 1) + " mm/min, fora de (50 ± 2,5) mm/min: só é admitida se a especificação indicar outra (Nota 1).");
      // especificação
      var E = espec(P), minimo = E[0] === "outro" ? num(P.minimo) : E[2], conforme = null, criterio = "";
      if (ok(m) && ok(minimo)) {
        if (E[0] === "dil" && temp === 15) {
          // Nota das DNER-EM 362/97 e 363/97: a 25 °C < 100 cm, aceito se a 15 °C for MAIOR que 100 cm
          conforme = m > 100 + 1e-9 || (algumMaior && m >= 100 - 1e-9);
          criterio = "> 100 cm a 15 °C (Nota da EM)";
        } else {
          conforme = m >= minimo - 1e-9;
          criterio = "mín. " + fmt(minimo, 0) + " cm a 25 °C";
          if (!conforme && algumMaior) { conforme = null; avisos.push("Resultado \"> " + fmt(m, 1) + " cm\" abaixo do mínimo de " + fmt(minimo, 0) + " cm: inconclusivo — use ductilômetro de curso maior ou repita."); }
          if (ok(temp) && temp !== 25) avisos.push("A especificação fixa a ductilidade a 25 °C; o ensaio foi feito a " + fmt(temp, 1) + " °C.");
        }
        if (conforme === false) avisos.unshift("Ductilidade de " + fmt(m, 1) + " cm, abaixo do exigido (" + criterio + " — " + E[1].split(" (")[0] + ").");
        if (conforme === false && E[0] === "dil" && temp === 25) avisos.push("Resíduo de asfalto diluído: pela Nota das DNER-EM 362/97 e 363/97 o material é aceito se a ductilidade a 15 °C for maior que 100 cm — ensaie também a 15 °C.");
      }
      var R = NaN, outro = num(P.outroLab);
      if (ok(m) && ok(outro) && !algumMaior) {
        var mr = (m + outro) / 2;
        R = Math.abs(m - outro) / mr * 100;
        if (R > 20 + 1e-9) avisos.push("Diferença de " + fmt(R, 1) + " % em relação ao outro laboratório (limite 20 % da média, 7.2): resultados não confiáveis.");
      }
      return { tab: { cp: cps }, resultados: { cm: m, mm: ok(m) ? Math.round(m * 10) : NaN, maior: algumMaior, n: val.length, maxDesv: maxDesv, temp: temp,
        minimo: minimo, criterio: criterio, conforme: conforme, esp: E, R: R }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, pre = r.maior ? "> " : "";
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.cm) ? pre + fmt(r.cm, 1) : "—") + ' <small>cm</small></div>' +
        '<div class="fe-res-r">Ductilidade a ' + (ok(r.temp) ? fmt(r.temp, 0) : "—") + " °C — média de " + r.n + " corpo(s) de prova" + (ok(r.mm) ? " (" + pre + r.mm + " mm)" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.maxDesv) ? fmt(r.maxDesv, 1) + " %" : "—") + '</div><div class="fe-res-r">Maior desvio em relação à média (limite 10 %)</div></div></div>';
    },
    relatorio: {
      notas: "Ductilidade = distância, no instante da ruptura, entre as garras do corpo de prova tracionado a (50 ± 2,5) mm/min em água a (25 ± 0,5) °C, salvo outra indicação (Nota 1); resultado = média de 3 determinações (6.1), expresso em mm na norma e em cm nas especificações. " +
        "Repetibilidade: triplicata não confiável se algum resultado diferir mais de 10 % da média (7.1); reprodutibilidade 20 % (7.2). Corpo de prova que toca a superfície ou o fundo do banho é descartado (Nota 3). " +
        "Corpo de prova que não rompe até o fim do curso é lançado como \"> curso\" e o resultado é um limite inferior.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [], pre = r.maior ? "> " : "";
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Ductilidade a " + (ok(r.temp) ? fmt(r.temp, 0) : "—") + " °C", ok(r.cm) ? pre + fmt(r.cm, 1) + " cm (" + pre + r.mm + " mm) — média de " + r.n + " determinação(ões)" : "—"]);
        if (r.criterio) rows.push(["Especificação", r.criterio + " (" + r.esp[1].split(" (")[0] + ") — " + (r.conforme === null ? "inconclusivo" : r.conforme ? "ATENDE" : "NÃO ATENDE")]);
        rows.push(["Maior desvio em relação à média", ok(r.maxDesv) ? fmt(r.maxDesv, 1) + " % (limite 10 %)" : "—"]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", fmt(r.R, 1) + " % da média (limite 20 %)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CAP 50/70 — três corpos de prova rompidos", dados: function () {
        return { ident: { registro: "EX-DUC-001", data: "2026-01-27", obra: "Unidade A — usina de asfalto", origem: "Distribuidora C", camada: "CAP 50/70" },
          params: { material: "CAP 50/70", unidade: "cm", temp: "25", velocidade: "50", curso: "150", espec: "cap50" },
          cp: [{ dist: "112", ocorr: "não" }, { dist: "118", ocorr: "não" }, { dist: "109", ocorr: "não" }] };
      } },
      { nome: "Resíduo de asfalto diluído a 15 °C — não rompeu até o fim do curso", dados: function () {
        return { ident: { registro: "EX-DUC-002", camada: "Resíduo de CM-30 (imprimação)", origem: "Distribuidora A" },
          params: { material: "Resíduo da destilação de asfalto diluído CM-30", unidade: "cm", temp: "15", velocidade: "50", curso: "150", espec: "dil" },
          cp: [{ dist: "> 150" }, { dist: "> 150" }, { dist: "> 150" }] };
      } },
      { nome: "CAP 30/45 após RTFOT — triplicata dispersa e abaixo do mínimo (reprovado)", dados: function () {
        return { ident: { registro: "EX-DUC-003", camada: "CAP 30/45 — resíduo RTFOT", origem: "Distribuidora B" },
          params: { material: "CAP 30/45 — resíduo do RTFOT", unidade: "mm", temp: "25", velocidade: "50", espec: "cap30r", outroLab: "7" },
          cp: [{ dist: "72" }, { dist: "95" }, { dist: "81" }] };
      } },
    ],
  };
})();
