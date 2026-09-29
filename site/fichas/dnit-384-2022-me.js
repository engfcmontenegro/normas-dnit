/*
 * Ficha: DNIT 384/2022-ME — Estabilidade ao armazenamento de ligantes modificados por polímero.
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * Pelo menos dois tubos com 50 g ± 0,5 g, 48 h ± 1 h a 163 °C ± 5 °C em pé, freezer ≥ 4 h, corte em três seções;
 * ponto de amolecimento (DNIT 131/2010-ME, duas bolas) do topo e do fundo de cada tubo.
 * Resultado = diferença entre os pontos de amolecimento do fundo e do topo de cada tubo (seção 6).
 * PA de cada porção como em site/fichas/dnit-131-2010-me.js: média das duas bolas (diferença ≤ 1 °C),
 * aproximação de 0,2 °C em água (0,5 °C em glicerina).
 * Limites opcionais (máximos, °C): DNIT 168/2013-EM (CAP-TLA, 5 °C), DNIT 111/2009-EM (asfalto-borracha, 9 °C)
 * e DNIT 129/2011-EM (separação de fase NBR 15166, 5 °C — referência).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var ESPEC = [
    ["", "Sem comparação com especificação", null],
    ["tla", "CAP modificado por TLA — DNIT 168/2013-EM (máx. 5 °C)", 5],
    ["ab8", "Asfalto-borracha AB 8 — DNIT 111/2009-EM (máx. 9 °C)", 9],
    ["ab22", "Asfalto-borracha AB 22 — DNIT 111/2009-EM (máx. 9 °C)", 9],
    ["e", "CAP 55/75-E, 60/85-E, 65/90-E — DNIT 129/2011-EM, separação de fase (NBR 15166) máx. 5 °C — referência", 5],
    ["outro", "Outra — informar o máximo", null],
  ];
  function espec(P) { return ESPEC.filter(function (x) { return x[0] === (P.espec || ""); })[0] || ESPEC[0]; }
  function arredPasso(x, passo) { return ok(x) ? Math.round(x / passo + 1e-9) * passo : NaN; }
  function sinal(x, c) { return ok(x) ? (x > 0 ? "+" : "") + fmt(x, c).replace(/^-/, "−") : "—"; }

  FE.FICHAS["dnit-384-2022-me"] = {
    titulo: "Estabilidade ao armazenamento de ligantes modificados por polímero",
    resumo: "Tubos de alumínio com 50 g de ligante, 48 h a 163 °C em posição vertical, congelamento e corte em três seções; ponto de amolecimento (anel e bola) do topo e do fundo; resultado = diferença entre os PA do fundo e do topo de cada tubo.",
    rotuloImportar: function (r) { return "diferença de PA " + (ok(r.res) ? fmt(r.res, 1) + " °C" : "—") + (r.conforme === false ? " · acima do máximo" : ""); },
    blocos: [],
    params: [
      { k: "material", r: "Ligante modificado", ph: "ex.: CAP 60/85-E, asfalto-borracha AB 8" },
      { k: "banho", r: "Banho do ponto de amolecimento (DNIT 131/2010-ME)", tipo: "select",
        opcoes: [["agua", "Água destilada — PA de 30 °C a 80 °C (aproximação de 0,2 °C)"], ["glicerina", "Glicerina — PA de 80 °C a 157 °C (aproximação adotada 0,5 °C)"]] },
      { k: "tempEstufa", r: "Temperatura da estufa (°C)", ph: "163", dica: "163 °C ± 5 °C (5 d)" },
      { k: "horas", r: "Tempo na estufa (h)", ph: "48", dica: "48 h ± 1 h, sem perturbação, em pé (5 d)" },
      { k: "tempFreezer", r: "Temperatura do freezer (°C)", ph: "-10", dica: "−10 °C ± 5 °C (5 e)" },
      { k: "horasFreezer", r: "Tempo no freezer (h)", ph: "4", dica: "mínimo de 4 h (5 e)" },
      { k: "espec", r: "Especificação para comparação — opcional", tipo: "select", recarrega: true, opcoes: ESPEC.map(function (x) { return [x[0], x[1]]; }) },
      { k: "maximo", r: "Diferença máxima (°C)", se: function (d) { return (d.params || {}).espec === "outro"; } },
      { k: "outroLab", r: "Resultado de outro laboratório (°C) — opcional", dica: "reprodutibilidade: suspeito se diferir mais de 4 °C (7 b)" },
    ],
    padrao: { banho: "agua", espec: "" },
    tabelas: function () {
      return [{
        chave: "tubo", titulo: "Tubos", rotulo: "Tubo", iniciais: 2, min: 1,
        dica: "pelo menos dois tubos por amostra (5 a); topo e fundo de cada tubo ensaiados ao mesmo tempo (Nota 2)",
        linhas: [
          { k: "massa", r: "Massa de amostra no tubo (50 g ± 0,5 g, 5 c)", u: "g" },
          { grupo: "Topo — ponto de amolecimento (DNIT 131/2010-ME)" },
          { k: "t1", r: "Topo — bola 1", u: "°C" },
          { k: "t2", r: "Topo — bola 2", u: "°C" },
          { calc: "paT", r: "PA do topo", u: "°C", casas: 1 },
          { grupo: "Fundo — ponto de amolecimento (DNIT 131/2010-ME)" },
          { k: "f1", r: "Fundo — bola 1", u: "°C" },
          { k: "f2", r: "Fundo — bola 2", u: "°C" },
          { calc: "paF", r: "PA do fundo", u: "°C", casas: 1 },
          { calc: "dif", r: "Diferença PA fundo − PA topo (seção 6)", u: "°C", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], passo = P.banho === "glicerina" ? 0.5 : 0.2;
      function pa(a, b, rot) {
        var x = num(a), y = num(b);
        if ((ok(x) || ok(y)) && !(ok(x) && ok(y))) { avisos.push(rot + ": informe as temperaturas das duas bolas (DNIT 131/2010-ME)."); return NaN; }
        if (!ok(x)) return NaN;
        if (Math.abs(x - y) > 1 + 1e-9) avisos.push(rot + ": diferença de " + fmt(Math.abs(x - y), 1) + " °C entre as bolas, acima de 1 °C — repetir o ponto de amolecimento (DNIT 131/2010-ME, 5.4.1 k).");
        return arredPasso((x + y) / 2, passo);
      }
      var tubos = (d.tubo || []).map(function (x, i) {
        var n = "Tubo " + (i + 1), m = num(x.massa);
        if (ok(m) && Math.abs(m - 50) > 0.5 + 1e-9) avisos.push(n + ": " + fmt(m, 1) + " g de amostra — a norma pede 50 g ± 0,5 g (5 c).");
        var o = { paT: pa(x.t1, x.t2, n + " — topo"), paF: pa(x.f1, x.f2, n + " — fundo") };
        o.dif = ok(o.paT) && ok(o.paF) ? o.paF - o.paT : NaN;
        return o;
      });
      var difs = tubos.map(function (o) { return o.dif; }).filter(ok);
      if (difs.length === 1) avisos.push("Devem ser usados pelo menos dois tubos por amostra (5 a).");
      var res = media(difs), abs = Math.abs(res), maxAbs = difs.length ? Math.max.apply(null, difs.map(Math.abs)) : NaN, rep = NaN;
      if (difs.length >= 2) {
        rep = Math.max.apply(null, difs) - Math.min.apply(null, difs);
        if (rep > 3 + 1e-9) avisos.push("Os resultados dos tubos diferem de " + fmt(rep, 1) + " °C — acima de 3 °C (repetibilidade, 7 a): resultados suspeitos.");
      }
      // condições de condicionamento (5 d, 5 e)
      var te = num(P.tempEstufa), h = num(P.horas), tf = num(P.tempFreezer), hf = num(P.horasFreezer);
      if (ok(te) && Math.abs(te - 163) > 5 + 1e-9) avisos.push("Estufa a " + fmt(te, 0) + " °C, fora de 163 °C ± 5 °C (5 d).");
      if (ok(h) && Math.abs(h - 48) > 1 + 1e-9) avisos.push("Condicionamento de " + fmt(h, 1) + " h, fora de 48 h ± 1 h (5 d).");
      if (ok(tf) && Math.abs(tf + 10) > 5 + 1e-9) avisos.push("Freezer a " + fmt(tf, 0).replace(/^-/, "−") + " °C, fora de −10 °C ± 5 °C (5 e).");
      if (ok(hf) && hf < 4 - 1e-9) avisos.push("Tempo no freezer de " + fmt(hf, 1) + " h, abaixo do mínimo de 4 h (5 e).");
      var R = NaN, outro = num(P.outroLab);
      if (ok(res) && ok(outro)) {
        R = Math.abs(abs - Math.abs(outro));
        if (R > 4 + 1e-9) avisos.push("Diferença de " + fmt(R, 1) + " °C em relação ao outro laboratório — acima de 4 °C (reprodutibilidade, 7 b).");
      }
      var E = espec(P), mx = E[0] === "outro" ? num(P.maximo) : E[2], conforme = null;
      if (ok(res) && ok(mx)) {
        conforme = abs <= mx + 1e-9;
        if (!conforme) avisos.unshift("Diferença de " + fmt(abs, 1) + " °C entre os pontos de amolecimento do fundo e do topo, acima do máximo de " + fmt(mx, 0) + " °C (" +
          (E[0] === "outro" ? "especificação informada" : E[1].replace(/ \(máx.*$/, "").replace(/, separação.*$/, "")) + ").");
        else if (maxAbs > mx + 1e-9) avisos.push("A média atende, mas um dos tubos deu " + fmt(maxAbs, 1) + " °C, acima de " + fmt(mx, 0) + " °C — avalie a repetição.");
        if (E[0] === "e") avisos.push("A DNIT 129/2011-EM exige o ensaio de separação de fase da NBR 15166; o limite de 5 °C é mostrado como referência para este método.");
      }
      if (ok(res) && res < 0) avisos.push("PA do topo maior que o do fundo: o polímero migrou para o topo (separação de fases); a especificação é comparada com o valor absoluto da diferença.");
      return { tab: { tubo: tubos }, resultados: { res: res, abs: abs, maxAbs: maxAbs, rep: rep, n: difs.length, R: R, mx: mx, conforme: conforme, esp: E, passo: passo }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.res) ? fmt(r.abs, 1) : "—") + ' <small>°C</small></div><div class="fe-res-r">Estabilidade ao armazenamento — |PA fundo − PA topo|, média de ' + r.n + " tubo(s)" +
        (ok(r.res) ? " (" + sinal(r.res, 1) + " °C)" : "") + (ok(r.mx) ? " · máx. " + fmt(r.mx, 0) + " °C" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.rep) ? fmt(r.rep, 1) + " °C" : "—") + '</div><div class="fe-res-r">Diferença entre os tubos (repetibilidade 3 °C)</div></div></div>';
    },
    relatorio: {
      notas: "Resultado = diferença entre os pontos de amolecimento (DNIT 131/2010-ME) do fundo e do topo de cada tubo da mesma amostra, em °C (seção 6); a ficha informa a média dos tubos, com sinal (fundo − topo) e em valor absoluto, comparado com o máximo da especificação. " +
        "PA de cada porção = média das duas bolas (diferença ≤ 1 °C), com aproximação de 0,2 °C em água. Condicionamento: 50 g ± 0,5 g por tubo, 48 h ± 1 h a 163 °C ± 5 °C em pé, freezer a −10 °C ± 5 °C por no mínimo 4 h (5 c–e). " +
        "Repetibilidade 3 °C e reprodutibilidade 4 °C (seção 7).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Ligante", P.material]);
        rows.push(["Estabilidade ao armazenamento (|PA fundo − PA topo|)", ok(r.res) ? fmt(r.abs, 1) + " °C — média de " + r.n + " tubo(s); fundo − topo = " + sinal(r.res, 1) + " °C" : "—"]);
        if (r.conforme !== null) rows.push(["Especificação", r.esp[1] + " — " + (r.conforme ? "ATENDE" : "NÃO ATENDE")]);
        rows.push(["Diferença entre os tubos", ok(r.rep) ? fmt(r.rep, 1) + " °C (repetibilidade 3 °C)" : "—"]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", "diferença de " + fmt(r.R, 1) + " °C (reprodutibilidade 4 °C)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CAP-TLA — dois tubos, diferença dentro do limite", dados: function () {
        return { ident: { registro: "EX-EST-001", data: "2026-02-18", obra: "Obra A", origem: "Distribuidora A", camada: "CAP modificado por TLA" },
          params: { material: "CAP modificado por asfalto natural TLA", banho: "agua", tempEstufa: "163", horas: "48", tempFreezer: "-10", horasFreezer: "5", espec: "tla" },
          tubo: [{ massa: "50,2", t1: "53,4", t2: "53,8", f1: "55,6", f2: "56,0" }, { massa: "49,8", t1: "53,6", t2: "54,0", f1: "55,2", f2: "55,8" }] };
      } },
      { nome: "Asfalto-borracha AB 8 — atende ao máximo de 9 °C", dados: function () {
        return { ident: { registro: "EX-EST-002", camada: "Asfalto-borracha AB 8", origem: "Fornecedor A" },
          params: { material: "Asfalto-borracha AB 8", banho: "agua", tempEstufa: "165", horas: "48", tempFreezer: "-12", horasFreezer: "4", espec: "ab8" },
          tubo: [{ massa: "50,0", t1: "58,2", t2: "58,8", f1: "64,6", f2: "65,2" }, { massa: "50,3", t1: "58,6", t2: "59,0", f1: "65,8", f2: "66,2" }] };
      } },
      { nome: "CAP-TLA — separação de fases, tubos discordantes (reprovado)", dados: function () {
        return { ident: { registro: "EX-EST-003", camada: "CAP modificado por TLA", origem: "Distribuidora B" },
          params: { material: "CAP modificado por asfalto natural TLA", banho: "agua", tempEstufa: "163", horas: "50,5", tempFreezer: "-10", horasFreezer: "3", espec: "tla", outroLab: "4,2" },
          tubo: [{ massa: "50,1", t1: "52,8", t2: "53,0", f1: "60,2", f2: "60,8" }, { massa: "51,2", t1: "53,2", t2: "54,6", f1: "57,0", f2: "57,4" }] };
      } },
    ],
  };
})();
