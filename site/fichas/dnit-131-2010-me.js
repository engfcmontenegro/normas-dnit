/*
 * Ficha: DNIT 131/2010-ME — Materiais asfálticos — Ponto de amolecimento — Método do anel e bola.
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * Cada coluna é um ensaio (duas bolas). Diferença entre as bolas > 1 °C: repetir o ensaio (5.4.1 k).
 * Resultado = média das duas bolas do último ensaio válido, com aproximação de 0,2 °C (seção 6).
 * Limites opcionais: DNIT 095/2006-EM (CAP, Tabela 1 — os mesmos de site/fichas/dnit-095-2006-em.js)
 * e DNIT 129/2011-EM (CAP modificado por polímero, Tabela 1).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // [chave, rótulo, PA mínimo, variação do PA após RTFOT {min, max}]
  var LIGANTES = [
    ["", "Sem comparação com especificação", null, null],
    ["30/45", "CAP 30/45 — DNIT 095/2006-EM (PA ≥ 52 °C)", 52, { min: null, max: 8 }],
    ["50/70", "CAP 50/70 — DNIT 095/2006-EM (PA ≥ 46 °C)", 46, { min: null, max: 8 }],
    ["85/100", "CAP 85/100 — DNIT 095/2006-EM (PA ≥ 43 °C)", 43, { min: null, max: 8 }],
    ["150/200", "CAP 150/200 — DNIT 095/2006-EM (PA ≥ 37 °C)", 37, { min: null, max: 8 }],
    ["55/75-E", "CAP 55/75-E — DNIT 129/2011-EM (PA ≥ 55 °C)", 55, { min: -5, max: 7 }],
    ["60/85-E", "CAP 60/85-E — DNIT 129/2011-EM (PA ≥ 60 °C)", 60, { min: -5, max: 7 }],
    ["65/90-E", "CAP 65/90-E — DNIT 129/2011-EM (PA ≥ 65 °C)", 65, { min: -5, max: 7 }],
    ["outro", "Outro — informar o mínimo", null, null],
  ];
  function ligante(P) { return LIGANTES.filter(function (x) { return x[0] === (P.ligante || ""); })[0] || LIGANTES[0]; }
  function arredPasso(x, passo) { return ok(x) ? Math.round(x / passo + 1e-9) * passo : NaN; }
  function sinal(x, c) { return (x > 0 ? "+" : "") + fmt(x, c).replace(/^-/, "−"); }

  FE.FICHAS["dnit-131-2010-me"] = {
    titulo: "Ponto de amolecimento — anel e bola",
    resumo: "Duas bolas por ensaio; diferença entre elas ≤ 1 °C (senão, repete-se o ensaio); PA = média das duas temperaturas, com aproximação de 0,2 °C; banho de água (30 °C a 80 °C) ou glicerina (80 °C a 157 °C).",
    blocos: [],
    params: [
      { k: "material", r: "Material asfáltico", ph: "ex.: CAP 50/70, CAP 60/85-E, resíduo de emulsão" },
      { k: "banho", r: "Líquido do banho / termômetro", tipo: "select",
        opcoes: [["agua", "Água destilada — termômetro ASTM 15C (PA de 30 °C a 80 °C, 5.4.1)"], ["glicerina", "Glicerina USP — termômetro ASTM 16C (PA de 80 °C a 157 °C, 5.4.2)"]],
        dica: "o resultado deve informar o líquido do banho (seção 6)" },
      { k: "ligante", r: "Especificação para comparação — opcional", tipo: "select", recarrega: true, opcoes: LIGANTES.map(function (x) { return [x[0], x[1]]; }),
        dica: "limites da Tabela 1 da DNIT 095/2006-EM (CAP) ou da DNIT 129/2011-EM (asfalto-polímero)" },
      { k: "minimo", r: "Ponto de amolecimento mínimo (°C)", se: function (d) { return (d.params || {}).ligante === "outro"; } },
      { k: "condicao", r: "Amostra", tipo: "select", recarrega: true,
        opcoes: [["original", "Ligante original"], ["rtfot", "Resíduo após RTFOT (efeito do calor e do ar)"]] },
      { k: "paOriginal", r: "PA do ligante original (°C) — para a variação após RTFOT", se: function (d) { return (d.params || {}).condicao === "rtfot"; },
        dica: "DNIT 095: aumento máx. 8 °C · DNIT 129: variação de −5 °C a +7 °C" },
      { k: "outroLab", r: "Resultado de outro laboratório (°C) — opcional", dica: "reprodutibilidade: diferença > 3 °C só um caso em vinte (7.2)" },
    ],
    padrao: { banho: "agua", ligante: "", condicao: "original" },
    tabelas: function () {
      return [{
        chave: "ens", titulo: "Ensaios (duas bolas cada)", rotulo: "Ensaio", iniciais: 1, min: 1,
        dica: "temperatura lida quando o material que envolve cada bola toca a placa inferior (5.4.1 j); acrescente um ensaio quando a diferença passar de 1 °C",
        linhas: [
          { k: "t1", r: "Temperatura — bola 1 (5.4.1 j)", u: "°C" },
          { k: "t2", r: "Temperatura — bola 2 (5.4.1 j)", u: "°C" },
          { calc: "dif", r: "Diferença entre as bolas (máx. 1 °C, 5.4.1 k)", u: "°C", casas: 1 },
          { calc: "media", r: "Média das duas bolas (seção 6)", u: "°C", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], agua = P.banho !== "glicerina";
      var passo = agua ? 0.2 : 0.5;
      var ens = (d.ens || []).map(function (x, i) {
        var t1 = num(x.t1), t2 = num(x.t2);
        var o = { dif: ok(t1) && ok(t2) ? Math.abs(t1 - t2) : NaN, media: ok(t1) && ok(t2) ? (t1 + t2) / 2 : NaN };
        o.valido = ok(o.dif) && o.dif <= 1 + 1e-9;
        if (ok(o.dif) && !o.valido) avisos.push("Ensaio " + (i + 1) + ": diferença de " + fmt(o.dif, 1) + " °C entre as bolas, acima de 1 °C — repetir o ensaio (5.4.1 k), com amostra nova, sem reaquecer a anterior (5.3, nota).");
        if ((ok(t1) || ok(t2)) && !(ok(t1) && ok(t2))) avisos.push("Ensaio " + (i + 1) + ": informe as temperaturas das duas bolas (o ensaio é em duplicata).");
        return o;
      });
      var validos = ens.filter(function (o) { return o.valido; });
      var ult = validos.length ? validos[validos.length - 1] : null;
      var exato = ult ? ult.media : NaN, pa = arredPasso(exato, passo);
      if (ens.some(function (o) { return ok(o.media); }) && !ult) avisos.push("Nenhum ensaio com diferença entre as bolas ≤ 1 °C: não há resultado — repita o ensaio.");
      // faixa de aplicação e líquido do banho (1, 5.4.1, 5.4.2)
      if (ok(pa)) {
        if (pa < 30 || pa > 157) avisos.push("PA = " + fmt(pa, 1) + " °C, fora da faixa de aplicação do método (30 °C a 157 °C, seção 1).");
        else if (agua && pa > 80) avisos.push("PA acima de 80 °C em banho de água: o ensaio deve ser feito em glicerina USP com termômetro ASTM 16C, início do controle a (30 ± 1) °C (5.4.2).");
        else if (!agua && pa <= 80) avisos.push("PA de até 80 °C em glicerina: o ensaio deve ser feito em água destilada com termômetro ASTM 15C, banho inicial a (5 ± 1) °C (5.4.1).");
      }
      // repetitividade entre ensaios válidos sucessivos (7.1)
      var rep = NaN;
      if (validos.length >= 2) {
        var ms = validos.map(function (o) { return o.media; });
        rep = Math.max.apply(null, ms) - Math.min.apply(null, ms);
        if (rep > 2 + 1e-9) avisos.push("Ensaios sucessivos diferem de " + fmt(rep, 1) + " °C: a repetitividade (7.1) admite diferença superior a 2 °C só um caso em vinte — confira.");
      }
      var R = NaN, outro = num(P.outroLab);
      if (ok(pa) && ok(outro)) {
        R = Math.abs(pa - outro);
        if (R > 3 + 1e-9) avisos.push("Diferença de " + fmt(R, 1) + " °C em relação ao outro laboratório: a reprodutibilidade (7.2) admite diferença superior a 3 °C só um caso em vinte.");
      }
      // especificação
      var L = ligante(P), minimo = L[0] === "outro" ? num(P.minimo) : L[2];
      var rtfot = P.condicao === "rtfot", conforme = null, var_ = NaN, varConf = null, paO = num(P.paOriginal);
      if (!rtfot && ok(pa) && ok(minimo)) {
        conforme = pa >= minimo - 1e-9;
        if (!conforme) avisos.unshift("PA = " + fmt(pa, 1) + " °C, abaixo do mínimo de " + fmt(minimo, 0) + " °C (" + L[1].split(" (")[0] + ").");
      }
      if (rtfot && ok(pa) && ok(paO)) {
        var_ = pa - paO;
        var lv = L[3];
        if (lv) {
          varConf = (lv.min === null || var_ >= lv.min - 1e-9) && (lv.max === null || var_ <= lv.max + 1e-9);
          if (!varConf) avisos.unshift("Variação do PA após RTFOT de " + sinal(var_, 1) + " °C, fora do limite (" +
            (lv.min === null ? "aumento máx. " + fmt(lv.max, 0) + " °C — DNIT 095/2006-EM" : "−5 °C a +7 °C — DNIT 129/2011-EM") + ").");
        }
      }
      if (rtfot && ok(pa) && !ok(paO)) avisos.push("Amostra após RTFOT: informe o PA do ligante original para calcular a variação.");
      return { tab: { ens: ens }, resultados: { pa: pa, exato: exato, passo: passo, agua: agua, nValidos: validos.length, rep: rep, R: R,
        minimo: minimo, conforme: conforme, rtfot: rtfot, variacao: var_, varConf: varConf, lig: L }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var sit = function (c) { return c === null ? "" : c ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>'; };
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.pa) ? fmt(r.pa, 1) : "—") + ' <small>°C</small></div>' +
        '<div class="fe-res-r">Ponto de amolecimento — banho de ' + (r.agua ? "água" : "glicerina") + (ok(r.exato) ? " (média " + fmt(r.exato, 2) + " °C, aproximação de " + fmt(r.passo, 1) + " °C)" : "") +
        (ok(r.minimo) && !r.rtfot ? " · mín. " + fmt(r.minimo, 0) + " °C" : "") + sit(r.conforme) + "</div></div>";
      if (r.rtfot) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.variacao) ? sinal(r.variacao, 1) + " °C" : "—") +
        '</div><div class="fe-res-r">Variação do PA após RTFOT' + sit(r.varConf) + "</div></div>";
      h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + r.nValidos + '</div><div class="fe-res-r">Ensaio(s) válido(s) — diferença entre bolas ≤ 1 °C' +
        (ok(r.rep) ? " · entre ensaios: " + fmt(r.rep, 1) + " °C (r = 2 °C)" : "") + "</div></div>";
      return h + "</div>";
    },
    relatorio: {
      notas: "Ponto de amolecimento = média das temperaturas das duas bolas no instante em que o material toca a placa inferior, com aproximação de 0,2 °C com o termômetro ASTM 15C (seção 6); com o ASTM 16C (glicerina) a norma não fixa a aproximação — adotou-se 0,5 °C (divisão do termômetro). " +
        "Diferença entre as bolas superior a 1 °C: repetir o ensaio (5.4.1 k); o resultado é o do último ensaio válido. Água: PA de 30 °C a 80 °C, banho inicial a (5 ± 1) °C; glicerina: 80 °C a 157 °C, início a (30 ± 1) °C; aquecimento a (5 ± 0,5) °C/min (5.4). " +
        "Repetitividade 2 °C e reprodutibilidade 3 °C (7.1, 7.2). A norma não prevê correção entre os resultados em água e em glicerina.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Ponto de amolecimento (anel e bola)", (ok(r.pa) ? fmt(r.pa, 1) + " °C" : "—") + " — banho de " + (r.agua ? "água destilada (termômetro ASTM 15C)" : "glicerina USP (termômetro ASTM 16C)")]);
        if (ok(r.minimo) && !r.rtfot) rows.push(["Especificação", "mín. " + fmt(r.minimo, 0) + " °C (" + r.lig[1].split(" (")[0] + ") — " + (r.conforme === null ? "—" : r.conforme ? "ATENDE" : "NÃO ATENDE")]);
        if (r.rtfot) rows.push(["Variação do PA após RTFOT", (ok(r.variacao) ? sinal(r.variacao, 1) + " °C (PA original " + fmt(num(P.paOriginal), 1) + " °C)" : "—") +
          (r.varConf === null ? "" : r.varConf ? " — ATENDE" : " — NÃO ATENDE")]);
        rows.push(["Ensaios válidos", r.nValidos + (ok(r.rep) ? " — diferença entre ensaios " + fmt(r.rep, 1) + " °C (r = 2 °C)" : "")]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", "diferença de " + fmt(r.R, 1) + " °C (R = 3 °C)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CAP 50/70 — banho de água, um ensaio", dados: function () {
        return { ident: { registro: "EX-PA-001", data: "2026-01-26", obra: "Usina de asfalto", origem: "Distribuidora", camada: "CAP 50/70" },
          params: { material: "CAP 50/70", banho: "agua", ligante: "50/70", condicao: "original" },
          ens: [{ t1: "48,6", t2: "49,0" }] };
      } },
      { nome: "CAP 65/90-E — glicerina, 1º ensaio com bolas discordantes (repetido)", dados: function () {
        return { ident: { registro: "EX-PA-002", camada: "CAP 65/90-E", origem: "Distribuidora A" },
          params: { material: "CAP modificado por polímero 65/90-E", banho: "glicerina", ligante: "65/90-E", condicao: "original", outroLab: "84,0" },
          ens: [{ t1: "81,8", t2: "83,4" }, { t1: "82,5", t2: "83,0" }] };
      } },
      { nome: "CAP 50/70 após RTFOT — aumento do PA acima de 8 °C (reprovado)", dados: function () {
        return { ident: { registro: "EX-PA-003", camada: "CAP 50/70 — resíduo RTFOT", origem: "Distribuidora B" },
          params: { material: "CAP 50/70 — resíduo do RTFOT", banho: "agua", ligante: "50/70", condicao: "rtfot", paOriginal: "46,8" },
          ens: [{ t1: "55,8", t2: "56,2" }] };
      } },
    ],
  };
})();
