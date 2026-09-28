/*
 * Ficha: DNIT 130/2010-ME — Recuperação elástica de materiais asfálticos pelo ductilômetro.
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * RE = (L1 − L2) / L1 × 100 (eq. 1); resultado = média de três ensaios, inteiro mais próximo (seção 8).
 * Limites opcionais: DNIT 129/2011-EM (CAP modificado por polímero elastomérico, Tabela 1).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // [chave, rótulo, RE mínima do ligante original]
  var LIGANTES = [
    ["", "Sem comparação com especificação", null],
    ["55/75-E", "CAP 55/75-E — DNIT 129/2011-EM (RE ≥ 75 %)", 75],
    ["60/85-E", "CAP 60/85-E — DNIT 129/2011-EM (RE ≥ 85 %)", 85],
    ["65/90-E", "CAP 65/90-E — DNIT 129/2011-EM (RE ≥ 90 %)", 90],
    ["outro", "Outro — informar o mínimo", null],
  ];
  var PCT_RTFOT = 80;  // DNIT 129/2011-EM, Tabela 1: % de RE original após RTFOT, mín. 80 %
  function ligante(P) { return LIGANTES.filter(function (x) { return x[0] === (P.ligante || ""); })[0] || LIGANTES[0]; }
  function rompeu(x) { return /^\s*(s|sim|r|romp)/i.test(String(x.rompeu || "")); }

  FE.FICHAS["dnit-130-2010-me"] = {
    titulo: "Recuperação elástica pelo ductilômetro",
    resumo: "Corpo de prova alongado 20 cm a 5 cm/min e 25 °C, cortado ao meio, 60 min de repouso; RE = (L1 − L2) / L1 × 100; média de três ensaios, ao inteiro mais próximo.",
    blocos: [],
    params: [
      { k: "material", r: "Material asfáltico", ph: "ex.: CAP 60/85-E, resíduo de emulsão modificada" },
      { k: "ligante", r: "Especificação para comparação — opcional", tipo: "select", recarrega: true, opcoes: LIGANTES.map(function (x) { return [x[0], x[1]]; }),
        dica: "Tabela 1 da DNIT 129/2011-EM (asfalto-polímero)" },
      { k: "minimo", r: "Recuperação elástica mínima (%)", se: function (d) { return (d.params || {}).ligante === "outro"; } },
      { k: "condicao", r: "Amostra", tipo: "select", recarrega: true,
        opcoes: [["original", "Ligante original"], ["rtfot", "Resíduo após RTFOT (efeito do calor e do ar)"]] },
      { k: "reOriginal", r: "RE do ligante original (%) — para a % de RE original", se: function (d) { return (d.params || {}).condicao === "rtfot"; },
        dica: "DNIT 129/2011-EM: RE após RTFOT ≥ 80 % da RE original" },
      { k: "temperatura", r: "Temperatura do ensaio (°C)", ph: "25,0", dica: "salvo indicação em contrário, (25,0 ± 0,5) °C (6.4 e)" },
      { k: "velocidade", r: "Velocidade de tração (cm/min)", ph: "5,00", dica: "(5,00 ± 0,25) cm/min (6.4 e)" },
      { k: "peneira", r: "Peneira da amostra", tipo: "select", opcoes: [["300", "300 µm (nº 50)"], ["850", "850 µm (nº 20) — alta viscosidade"]] },
      { k: "outroLab", r: "Resultado de outro laboratório (%) — opcional", dica: "reprodutibilidade: suspeito se diferirem mais de 20 % da média (8.2)" },
    ],
    padrao: { ligante: "", condicao: "original", peneira: "300" },
    tabelas: function (d) {
      if (Array.isArray(d.ens)) { while (d.ens.length < 3) d.ens.push({}); if (d.ens.length > 3) d.ens.length = 3; }
      return [{
        chave: "ens", titulo: "Ensaios (três corpos de prova)", rotulo: "Ensaio", iniciais: 3, min: 3, fixo: true, nomes: ["1", "2", "3"],
        dica: "L1 = alongamento na parada da tração, (20,0 ± 0,5) cm; L2 = leitura da escala quando as pontas se encostam após 60 min (6.4 e)",
        linhas: [
          { k: "l1", r: "Alongamento L1 (6.4 e)", u: "cm", ph: "20,0" },
          { k: "l2", r: "Leitura L2 — pontas justapostas (6.4 e)", u: "cm" },
          { k: "rompeu", r: "Rompeu durante a tração? (s/n)", u: "", texto: true, ph: "n" },
          { calc: "re", r: "RE = (L1 − L2) / L1 × 100 (eq. 1)", u: "%", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var ens = (d.ens || []).map(function (x, i) {
        var l1 = num(x.l1), l2 = num(x.l2), romp = rompeu(x);
        var o = { re: !romp && ok(l1) && ok(l2) && l1 > 0 ? (l1 - l2) / l1 * 100 : NaN, rompeu: romp };
        if (!romp && ok(l1) && (l1 < 19.5 - 1e-9 || l1 > 20.5 + 1e-9)) avisos.push("Ensaio " + (i + 1) + ": L1 = " + fmt(l1, 1) + " cm, fora de (20,0 ± 0,5) cm (6.4 e).");
        if (!romp && ok(l1) && ok(l2) && (l2 < 0 || l2 > l1)) avisos.push("Ensaio " + (i + 1) + ": L2 deve estar entre 0 e L1 — confira a leitura.");
        return o;
      });
      var nRomp = ens.filter(function (o) { return o.rompeu; }).length;
      var vals = ens.map(function (o) { return o.re; }).filter(ok);
      var m = media(vals), re = ok(m) ? Math.round(m + 1e-9) : NaN;
      var naoObtida = nRomp === 3;
      if (naoObtida) avisos.unshift("A amostra rompeu durante a tração nos 3 ensaios: a recuperação elástica não pode ser obtida nas condições do ensaio (seção 8).");
      else if (nRomp) avisos.push(nRomp + " ensaio(s) rompeu(ram) durante a tração; o resultado é a média de três ensaios (seção 8) — ensaie novos corpos de prova.");
      else if (vals.length && vals.length < 3) avisos.push("O resultado é a média de três ensaios (seção 8); há " + vals.length + ".");
      // repetitividade: resultados da triplicata que diferem mais de 10 % da média (8.1)
      var desvio = NaN;
      if (vals.length >= 2 && m > 0) {
        desvio = Math.max.apply(null, vals.map(function (v) { return Math.abs(v - m) / m * 100; }));
        if (desvio > 10 + 1e-9) avisos.push("Um resultado difere " + fmt(desvio, 1) + " % da média (limite 10 %): resultados suspeitos (8.1) — repita o ensaio.");
      }
      // condições do ensaio (6.4 e)
      var T = num(P.temperatura), v = num(P.velocidade);
      if (ok(T) && Math.abs(T - 25) > 0.5 + 1e-9) avisos.push("Temperatura de " + fmt(T, 1) + " °C, diferente de (25,0 ± 0,5) °C — confira se há indicação em contrário da especificação (6.4 e).");
      if (ok(v) && Math.abs(v - 5) > 0.25 + 1e-9) avisos.push("Velocidade de " + fmt(v, 2) + " cm/min, fora de (5,00 ± 0,25) cm/min (6.4 e).");
      // reprodutibilidade (8.2)
      var outro = num(P.outroLab), R = NaN;
      if (ok(re) && ok(outro)) {
        var mm = (re + outro) / 2;
        R = mm > 0 ? Math.abs(re - outro) / mm * 100 : NaN;
        if (R > 20 + 1e-9) avisos.push("Diferença de " + fmt(R, 1) + " % da média em relação ao outro laboratório (limite 20 %, 8.2): resultados suspeitos; em caso de discordância, um terceiro laboratório deve ensaiar.");
      }
      // especificação
      var L = ligante(P), minimo = L[0] === "outro" ? num(P.minimo) : L[2], rtfot = P.condicao === "rtfot";
      var conforme = null, pct = NaN, pctConf = null, reO = num(P.reOriginal);
      if (!rtfot && ok(re) && ok(minimo)) {
        conforme = re >= minimo - 1e-9;
        if (!conforme) avisos.unshift("RE = " + re + " %, abaixo do mínimo de " + fmt(minimo, 0) + " % (" + L[1].split(" (")[0] + ").");
      }
      if (rtfot && ok(re) && ok(reO) && reO > 0) {
        pct = re / reO * 100;
        if (L[2] !== null) {
          pctConf = pct >= PCT_RTFOT - 1e-9;
          if (!pctConf) avisos.unshift("RE após RTFOT = " + fmt(pct, 1) + " % da RE original, abaixo do mínimo de 80 % (DNIT 129/2011-EM).");
        }
      }
      if (rtfot && ok(re) && !ok(reO)) avisos.push("Amostra após RTFOT: informe a RE do ligante original para calcular a porcentagem de RE original.");
      return { tab: { ens: ens }, resultados: { re: re, exato: m, n: vals.length, nRomp: nRomp, naoObtida: naoObtida, desvio: desvio, R: R,
        minimo: minimo, conforme: conforme, rtfot: rtfot, pct: pct, pctConf: pctConf, lig: L }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var sit = function (c) { return c === null ? "" : c ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>'; };
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (r.naoObtida ? "não obtida" : ok(r.re) ? r.re + " <small>%</small>" : "—") + "</div>" +
        '<div class="fe-res-r">Recuperação elástica — média de ' + r.n + " ensaio(s)" + (ok(r.exato) ? " (" + fmt(r.exato, 1) + " %)" : "") +
        (ok(r.minimo) && !r.rtfot ? " · mín. " + fmt(r.minimo, 0) + " %" : "") + sit(r.conforme) + "</div></div>";
      if (r.rtfot) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.pct) ? fmt(r.pct, 1) + " %" : "—") +
        '</div><div class="fe-res-r">Porcentagem da RE original (mín. 80 %)' + sit(r.pctConf) + "</div></div>";
      h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.desvio) ? fmt(r.desvio, 1) + " %" : "—") +
        '</div><div class="fe-res-r">Maior diferença em relação à média (limite 10 %, 8.1)</div></div>';
      return h + "</div>";
    },
    relatorio: {
      notas: "RE = (L1 − L2) / L1 × 100 (eq. 1), com L1 = alongamento na parada da tração e L2 = leitura da escala quando as pontas cortadas se encostam, após 60 min de repouso. " +
        "Resultado: média de três ensaios, ao inteiro mais próximo; ruptura nos três ensaios → recuperação elástica não obtida (seção 8). Salvo indicação em contrário: (25,0 ± 0,5) °C, 20 cm e (5,00 ± 0,25) cm/min (6.4 e). " +
        "Triplicata suspeita se um resultado diferir mais de 10 % da média (8.1 — interpretado como desvio relativo de cada resultado em relação à média); entre laboratórios, 20 % da média (8.2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Recuperação elástica", r.naoObtida ? "não pode ser obtida nas condições do ensaio (ruptura nos 3 ensaios)" :
          (ok(r.re) ? r.re + " %" : "—") + " — média de " + r.n + " ensaio(s)" + (ok(r.exato) ? " (" + fmt(r.exato, 2) + " %)" : "")]);
        rows.push(["Condições", "temperatura " + (P.temperatura || "25,0") + " °C · velocidade " + (P.velocidade || "5,00") + " cm/min · L1 conforme a tabela"]);
        if (ok(r.minimo) && !r.rtfot) rows.push(["Especificação", "mín. " + fmt(r.minimo, 0) + " % (" + r.lig[1].split(" (")[0] + ") — " + (r.conforme === null ? "—" : r.conforme ? "ATENDE" : "NÃO ATENDE")]);
        if (r.rtfot) rows.push(["% da RE original após RTFOT", (ok(r.pct) ? fmt(r.pct, 1) + " % (RE original " + P.reOriginal + " %)" : "—") +
          (r.pctConf === null ? "" : r.pctConf ? " — ATENDE ao mín. de 80 %" : " — NÃO ATENDE ao mín. de 80 %")]);
        rows.push(["Maior diferença em relação à média", ok(r.desvio) ? fmt(r.desvio, 1) + " % (limite 10 %)" : "—"]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", fmt(r.R, 1) + " % da média (limite 20 %)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CAP 60/85-E — ligante original", dados: function () {
        return { ident: { registro: "EX-RE-001", camada: "CAP 60/85-E", origem: "Distribuidora A" },
          params: { material: "CAP 60/85-E", ligante: "60/85-E", condicao: "original", temperatura: "25,0", velocidade: "5,00", peneira: "300" },
          ens: [{ l1: "20,0", l2: "2,4", rompeu: "n" }, { l1: "20,0", l2: "2,8", rompeu: "n" }, { l1: "20,0", l2: "2,6", rompeu: "n" }] };
      } },
      { nome: "CAP 60/85-E — resíduo do RTFOT, um corpo de prova rompido", dados: function () {
        return { ident: { registro: "EX-RE-002", camada: "CAP 60/85-E — resíduo RTFOT", origem: "Distribuidora A" },
          params: { material: "CAP 60/85-E — resíduo do RTFOT", ligante: "60/85-E", condicao: "rtfot", reOriginal: "87", temperatura: "25,0", velocidade: "5,00", peneira: "300" },
          ens: [{ l1: "20,0", l2: "4,2", rompeu: "n" }, { l1: "20,2", l2: "4,6", rompeu: "n" }, { l1: "", l2: "", rompeu: "s" }] };
      } },
      { nome: "CAP 65/90-E — RE abaixo do mínimo e triplicata dispersa", dados: function () {
        return { ident: { registro: "EX-RE-003", camada: "CAP 65/90-E", origem: "Distribuidora B" },
          params: { material: "CAP 65/90-E", ligante: "65/90-E", condicao: "original", temperatura: "25,0", velocidade: "5,00", peneira: "300", outroLab: "91" },
          ens: [{ l1: "20,0", l2: "3,0", rompeu: "n" }, { l1: "20,0", l2: "5,6", rompeu: "n" }, { l1: "20,0", l2: "2,6", rompeu: "n" }] };
      } },
    ],
  };
})();
