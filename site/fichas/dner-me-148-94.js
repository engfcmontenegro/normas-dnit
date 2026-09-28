/*
 * Ficha: DNER-ME 148/94 — Material betuminoso — Pontos de fulgor e de combustão (vaso aberto Cleveland).
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * A DNER-ME 148/94 não traz o procedimento: adota "pelo processo de referência" a ABNT MB-50/1989
 * (atual NBR 11341; equivalente à ASTM D 92). A correção barométrica, o arredondamento e a precisão
 * abaixo são os dessa norma de referência (não reproduzida no acervo) — ver relatorio.notas.
 * Limite opcional: ponto de fulgor mín. 235 °C (DNIT 095/2006-EM, CAP; DNIT 129/2011-EM, asfalto-polímero),
 * o mesmo usado em site/fichas/dnit-095-2006-em.js.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var LIGANTES = [
    ["", "Sem comparação com especificação", null],
    ["cap", "CAP — DNIT 095/2006-EM (fulgor ≥ 235 °C)", 235],
    ["polimero", "CAP modificado por polímero — DNIT 129/2011-EM (fulgor ≥ 235 °C)", 235],
    ["outro", "Outro — informar o mínimo", null],
  ];
  var REP = { fulgor: 8, comb: 8 }, REPROD = { fulgor: 16, comb: 14 };  // ASTM D 92-78 / MB-50 (°C)
  function ligante(P) { return LIGANTES.filter(function (x) { return x[0] === (P.ligante || ""); })[0] || LIGANTES[0]; }
  function arredPasso(x, passo) { return ok(x) ? Math.round(x / passo + 1e-9) * passo : NaN; }
  function correcao(p, mmHg) { return ok(p) ? (mmHg ? 0.033 * (760 - p) : 0.25 * (101.3 - p)) : NaN; }
  function sinal(x, c) { return ok(x) ? (x > 0 ? "+" : "") + fmt(x, c).replace(/^-/, "−") : "—"; }

  FE.FICHAS["dner-me-148-94"] = {
    titulo: "Pontos de fulgor e de combustão — vaso aberto Cleveland",
    resumo: "Temperaturas observadas corrigidas para a pressão normal (101,3 kPa): T + 0,25 (101,3 − p) [kPa] ou T + 0,033 (760 − p) [mmHg]; média das determinações, arredondada; repetibilidade 8 °C (MB-50 / NBR 11341, adotada pela DNER-ME 148/94).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: CAP 50/70" },
      { k: "ligante", r: "Especificação para comparação — opcional", tipo: "select", recarrega: true, opcoes: LIGANTES.map(function (x) { return [x[0], x[1]]; }),
        dica: "ponto de fulgor mínimo da Tabela 1 da EM" },
      { k: "minimo", r: "Ponto de fulgor mínimo (°C)", se: function (d) { return (d.params || {}).ligante === "outro"; } },
      { k: "unidade", r: "Unidade da pressão barométrica", tipo: "select", opcoes: [["kPa", "kPa"], ["mmHg", "mmHg"]] },
      { k: "arred", r: "Arredondamento do resultado", tipo: "select",
        opcoes: [["2", "2 °C — MB-50/1989 e ASTM D 92-78 (referências da DNER-ME 148/94)"], ["1", "1 °C — NBR 11341 / ASTM D 92 atuais"]] },
      { k: "outroLab", r: "Fulgor obtido por outro laboratório (°C) — opcional", dica: "reprodutibilidade de 16 °C (ASTM D 92-78)" },
    ],
    padrao: { ligante: "", unidade: "kPa", arred: "2" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 2, min: 1,
        dica: "temperaturas lidas no termômetro; pressão barométrica do ambiente no momento do ensaio (não a reduzida ao nível do mar)",
        linhas: [
          { k: "tf", r: "Ponto de fulgor observado", u: "°C" },
          { k: "tc", r: "Ponto de combustão observado — opcional", u: "°C" },
          { k: "p", r: "Pressão barométrica ambiente", u: "kPa/mmHg" },
          { calc: "corr", r: "Correção barométrica", u: "°C", casas: 2 },
          { calc: "fc", r: "Ponto de fulgor corrigido", u: "°C", casas: 1, destaque: true },
          { calc: "cc", r: "Ponto de combustão corrigido", u: "°C", casas: 1 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], mmHg = P.unidade === "mmHg", passo = P.arred === "1" ? 1 : 2;
      var semP = false;
      var det = (d.det || []).map(function (x, i) {
        var tf = num(x.tf), tc = num(x.tc), p = num(x.p);
        var c = correcao(p, mmHg);
        if ((ok(tf) || ok(tc)) && !ok(p)) semP = true;
        if (ok(p) && (mmHg ? p < 450 || p > 800 : p < 60 || p > 110)) avisos.push("Determinação " + (i + 1) + ": pressão de " + fmt(p, 1) + " " + (mmHg ? "mmHg" : "kPa") + " improvável — confira a unidade escolhida.");
        if (ok(tf) && ok(tc) && tc < tf) avisos.push("Determinação " + (i + 1) + ": ponto de combustão menor que o de fulgor — confira.");
        var cc = ok(c) ? c : 0;
        return { corr: c, fc: ok(tf) ? tf + cc : NaN, cc: ok(tc) ? tc + cc : NaN };
      });
      if (semP) avisos.push("Pressão barométrica não informada em alguma determinação: temperatura considerada sem correção (a correção é obrigatória fora de 101,3 kPa — cerca de 0,25 °C por kPa).");
      function resumo(chave, nome, r) {
        var v = det.map(function (o) { return o[chave]; }).filter(ok);
        var o = { n: v.length, exato: media(v), amp: v.length >= 2 ? Math.max.apply(null, v) - Math.min.apply(null, v) : NaN };
        o.valor = arredPasso(o.exato, passo);
        if (ok(o.amp) && o.amp > r + 1e-9) avisos.push(nome + ": determinações diferem de " + fmt(o.amp, 1) + " °C, acima da repetibilidade de " + r + " °C (MB-50 / ASTM D 92) — repita o ensaio.");
        return o;
      }
      var F = resumo("fc", "Ponto de fulgor", REP.fulgor), C = resumo("cc", "Ponto de combustão", REP.comb);
      if (ok(F.valor) && F.valor < 79) avisos.push("Ponto de fulgor abaixo de 79 °C: o método não se aplica (Resumo) — use o vaso fechado (ex.: Tag ou Pensky-Martens).");
      var outro = num(P.outroLab), R = NaN;
      if (ok(F.valor) && ok(outro)) {
        R = Math.abs(F.valor - outro);
        if (R > REPROD.fulgor + 1e-9) avisos.push("Diferença de " + fmt(R, 1) + " °C em relação ao outro laboratório, acima da reprodutibilidade de 16 °C (ASTM D 92-78).");
      }
      var L = ligante(P), minimo = L[0] === "outro" ? num(P.minimo) : L[2], conforme = null;
      if (ok(F.valor) && ok(minimo)) {
        conforme = F.valor >= minimo - 1e-9;
        if (!conforme) avisos.unshift("Ponto de fulgor de " + fmt(F.valor, 0) + " °C, abaixo do mínimo de " + fmt(minimo, 0) + " °C (" + L[1].split(" (")[0] + ").");
      }
      var corrs = det.map(function (o) { return o.corr; }).filter(ok);
      return { tab: { det: det }, resultados: { fulgor: F.valor, fulgorExato: F.exato, ampF: F.amp, nF: F.n, comb: C.valor, combExato: C.exato, ampC: C.amp,
        passo: passo, corrMedia: media(corrs), minimo: minimo, conforme: conforme, R: R, lig: L }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.fulgor) ? fmt(r.fulgor, 0) : "—") + ' <small>°C</small></div>' +
        '<div class="fe-res-r">Ponto de fulgor corrigido — média de ' + r.nF + " determinação(ões)" + (ok(r.fulgorExato) ? " (" + fmt(r.fulgorExato, 1) + " °C)" : "") +
        (ok(r.minimo) ? " · mín. " + fmt(r.minimo, 0) + " °C" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.comb) ? fmt(r.comb, 0) + " °C" : "—") + '</div><div class="fe-res-r">Ponto de combustão corrigido</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.ampF) ? fmt(r.ampF, 1) + " °C" : "—") + '</div><div class="fe-res-r">Diferença entre determinações de fulgor (repetibilidade 8 °C)' +
        (ok(r.corrMedia) ? " · correção barométrica " + sinal(r.corrMedia, 2) + " °C" : "") + "</div></div></div>";
    },
    relatorio: {
      notas: "A DNER-ME 148/94 adota pelo processo de referência a ABNT MB-50/1989 (atual NBR 11341, equivalente à ASTM D 92); o procedimento, a correção e a precisão vêm dessa norma. " +
        "Correção para a pressão normal: T corrigida = T observada + 0,25 (101,3 − p), p em kPa, ou + 0,033 (760 − p), p em mmHg. " +
        "Resultado = média das determinações corrigidas, arredondada a 2 °C (MB-50/ASTM D 92-78) ou a 1 °C (NBR 11341/ASTM D 92 atuais), conforme escolhido. " +
        "Repetibilidade 8 °C (fulgor e combustão); reprodutibilidade 16 °C (fulgor) e 14 °C (combustão) — ASTM D 92-78. Método não aplicável a fulgor em vaso aberto inferior a 79 °C.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Ponto de fulgor (vaso aberto Cleveland)", (ok(r.fulgor) ? fmt(r.fulgor, 0) + " °C" : "—") + (ok(r.fulgorExato) ? " — média corrigida " + fmt(r.fulgorExato, 1) + " °C, arredondada a " + r.passo + " °C" : "")]);
        if (ok(r.comb)) rows.push(["Ponto de combustão", fmt(r.comb, 0) + " °C (média corrigida " + fmt(r.combExato, 1) + " °C)"]);
        rows.push(["Correção barométrica", ok(r.corrMedia) ? sinal(r.corrMedia, 2) + " °C (média)" : "não aplicada — pressão não informada"]);
        if (ok(r.minimo)) rows.push(["Especificação", "mín. " + fmt(r.minimo, 0) + " °C (" + r.lig[1].split(" (")[0] + ") — " + (r.conforme === null ? "—" : r.conforme ? "ATENDE" : "NÃO ATENDE")]);
        rows.push(["Diferença entre determinações", (ok(r.ampF) ? "fulgor " + fmt(r.ampF, 1) + " °C" : "—") + (ok(r.ampC) ? " · combustão " + fmt(r.ampC, 1) + " °C" : "") + " (repetibilidade 8 °C)"]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", "diferença de " + fmt(r.R, 1) + " °C (reprodutibilidade 16 °C)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CAP 50/70 — carregamento de 26/01/2026 (planilha do laboratório)", dados: function () {
        // a planilha não registra a pressão barométrica nem o ponto de combustão
        return { ident: { registro: "REC-CAP-2026-01-PF", data: "2026-01-26", obra: "Unidade A — usina de asfalto", origem: "Distribuidora C", camada: "CAP 50/70",
          laboratorista: "Equipe laboratório usina" },
          params: { material: "CAP 50/70", ligante: "cap", unidade: "kPa", arred: "2" },
          det: [{ tf: "350" }, { tf: "335" }] };
      } },
      { nome: "CAP 30/45 — fulgor e combustão com correção barométrica (91,5 kPa)", dados: function () {
        return { ident: { registro: "EX-PF-002", camada: "CAP 30/45", origem: "Distribuidora A" },
          params: { material: "CAP 30/45", ligante: "cap", unidade: "kPa", arred: "2" },
          det: [{ tf: "296", tc: "324", p: "91,5" }, { tf: "300", tc: "330", p: "91,5" }] };
      } },
      { nome: "CAP 85/100 — fulgor abaixo de 235 °C (pressão em mmHg)", dados: function () {
        return { ident: { registro: "EX-PF-003", camada: "CAP 85/100", origem: "Distribuidora B" },
          params: { material: "CAP 85/100", ligante: "cap", unidade: "mmHg", arred: "2" },
          det: [{ tf: "226", tc: "252", p: "700" }, { tf: "230", tc: "256", p: "700" }] };
      } },
    ],
  };
})();
