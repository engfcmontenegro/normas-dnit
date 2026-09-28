/*
 * Ficha: DNIT 430/2020-ME — Porcentagem de partículas fraturadas em agregados graúdos.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // Tabela 1 — massa mínima da amostra (kg) por tamanho nominal máximo (mm)
  var TABELA1 = [["9.5", "9,5", 0.2], ["12.5", "12,5", 0.5], ["19", "19,0", 1.5], ["25", "25,0", 3], ["37.5", "37,5", 7.5],
    ["50", "50", 15], ["63", "63", 30], ["75", "75", 60], ["90", "90", 90]];
  function massaTabela(tnm) {
    var l = TABELA1.filter(function (x) { return x[0] === tnm; })[0];
    return l ? l[2] * 1000 : NaN;
  }
  // P = F / (F + N) × 100 (eq. 1)
  function pct(F, N) { return ok(F) && ok(N) && F + N > 0 ? F / (F + N) * 100 : NaN; }

  FE.FICHAS["dnit-430-2020-me"] = {
    titulo: "Partículas fraturadas em agregado graúdo",
    resumo: "Separação das partículas retidas na peneira de ensaio em (1) uma face fraturada, (2) duas ou mais e (3) não fraturadas; P = F / (F + N) × 100, em massa ou por contagem, ao 1 % mais próximo; média ponderada quando a amostra é separada na 9,5 mm (5 d).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: brita 1, cascalho britado" },
      { k: "tnm", r: "Tamanho nominal máximo — TNM (3.3, Tabela 1)", tipo: "select",
        opcoes: TABELA1.map(function (x) { return [x[0], x[1] + " mm — massa mínima " + fmt(x[2], x[2] < 1 ? 1 : 0) + " kg"]; }) },
      { k: "maior", r: "Massa da maior partícula (g) — opcional", dica: "5 c: basta que a maior partícula seja ≤ 1 % da massa da amostra, se isso exigir menos que a Tabela 1" },
      { k: "peneira", r: "Peneira em que a amostra foi retida (5 b, 8 c)", ph: "4,75 mm" },
      { k: "base", r: "Base de cálculo (6 d)", tipo: "select", recarrega: true,
        opcoes: [["massa", "Massa (g) — padrão"], ["contagem", "Contagem de partículas (quando especificada)"]] },
      { k: "separado", r: "Amostra separada na peneira 9,5 mm (5 d)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não — uma porção"], ["sim", "Sim — porção retida na 9,5 mm + porção passante reduzida (≥ 200 g)"]],
        dica: "permitido para TNM ≥ 19 mm; resultado = média ponderada pelas massas das porções" },
      { k: "criterio", r: "Critério de fratura especificado (3.2, 8 a)", tipo: "select",
        opcoes: [["1", "Pelo menos uma face fraturada"], ["2", "Pelo menos duas faces fraturadas"]] },
      { k: "minimo", r: "Porcentagem mínima exigida (%) — opcional", dica: "da especificação (ex.: ≥ 90 % com pelo menos uma face, DNIT 385-ES)" },
      { k: "outro", r: "Resultado de outro operador (%) — opcional", dica: "precisão (9): diferença máxima de 10 % entre dois operadores" },
    ],
    padrao: { tnm: "19", peneira: "4,75 mm", base: "massa", separado: "nao", criterio: "1" },
    tabelas: function (d) {
      var P = d.params || {}, sep = P.separado === "sim", u = P.base === "contagem" ? "un" : "g", n = sep ? 2 : 1;
      if (Array.isArray(d.porcoes)) { while (d.porcoes.length < n) d.porcoes.push({}); if (d.porcoes.length > n) d.porcoes.length = n; }
      var linhas = [
        { k: "ms", r: "Massa seca da porção ensaiada, após lavagem (6 a)", u: "g" },
      ];
      if (sep) linhas.push({ k: "mp", r: "Massa da porção na amostra total, antes da redução (5 d)", u: "g", ph: "= ensaiada" });
      linhas.push(
        { grupo: "Separação das partículas (6 c) — " + (u === "g" ? "massas" : "contagens") },
        { k: "c1", r: "(1) Partículas com uma face fraturada", u: u },
        { k: "c2", r: "(2) Partículas com duas ou mais faces fraturadas", u: u },
        { k: "c3", r: "(3) Partículas que não atendem ao critério", u: u },
        { calc: "soma", r: "Soma (1) + (2) + (3)", u: u, casas: u === "g" ? 1 : 0 },
        { calc: "p1", r: "P — pelo menos uma face: F = (1)+(2), N = (3) (eq. 1)", u: "%", casas: 1, destaque: P.criterio !== "2" },
        { calc: "p2", r: "P — pelo menos duas faces: F = (2), N = (1)+(3) (eq. 1)", u: "%", casas: 1, destaque: P.criterio === "2" }
      );
      return [{
        chave: "porcoes", titulo: "Porções ensaiadas", rotulo: "Porção", iniciais: n, min: n, fixo: true,
        nomes: sep ? ["Retida na 9,5 mm", "Passante na 9,5 mm"] : ["Amostra"],
        dica: "face fraturada: área projetada ≥ 25 % da área projetada da partícula (3.1, 6 b)",
        linhas: linhas,
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, sep = P.separado === "sim", cont = P.base === "contagem", avisos = [];
      var rows = (d.porcoes || []).map(function (x, i) {
        var c1 = num(x.c1), c2 = num(x.c2), c3 = num(x.c3), ms = num(x.ms);
        var soma = ok(c1) && ok(c2) && ok(c3) ? c1 + c2 + c3 : NaN;
        var mp = sep ? (ok(num(x.mp)) ? num(x.mp) : ms) : ms;
        var nome = sep ? (i === 0 ? "porção retida na 9,5 mm" : "porção passante na 9,5 mm") : "amostra";
        if (!cont && ok(soma) && ok(ms) && ms > 0 && Math.abs(soma - ms) / ms > 0.01)
          avisos.push("Na " + nome + ", a soma das categorias (" + fmt(soma, 1) + " g) difere da massa ensaiada (" + fmt(ms, 1) + " g) em mais de 1 % — confira as pesagens (verificação do laboratório; a norma não fixa tolerância).");
        return { soma: soma, p1: ok(soma) ? pct(c1 + c2, c3) : NaN, p2: ok(soma) ? pct(c2, c1 + c3) : NaN, ms: ms, mp: mp };
      });
      var p1 = NaN, p2 = NaN;
      if (!sep) { if (rows[0]) { p1 = rows[0].p1; p2 = rows[0].p2; } }
      else if (rows.length === 2) {
        var w = rows.map(function (o) { return o.mp; });
        if (ok(w[0]) && ok(w[1]) && w[0] + w[1] > 0) {
          p1 = (rows[0].p1 * w[0] + rows[1].p1 * w[1]) / (w[0] + w[1]);
          p2 = (rows[0].p2 * w[0] + rows[1].p2 * w[1]) / (w[0] + w[1]);
        }
        if (!ok(num((d.porcoes[1] || {}).mp))) avisos.push("Informe a massa da porção passante na 9,5 mm antes da redução (5 d): é o peso dessa porção na média ponderada.");
        var red = rows[1].ms;
        if (ok(red) && red < 200) avisos.push("Porção passante na 9,5 mm reduzida a " + fmt(red, 1) + " g — mínimo de 200 g (5 d).");
        var tnmN = num(P.tnm);
        if (ok(tnmN) && tnmN < 19) avisos.push("A separação na peneira 9,5 mm (5 d) está prevista para TNM de 19 mm ou maior.");
      }
      // massa mínima (5 c): o menor entre a Tabela 1 e 100 × maior partícula
      var mTab = massaTabela(P.tnm), maior = num(P.maior), mMin = mTab;
      if (ok(maior) && maior > 0 && ok(mTab)) mMin = Math.min(mTab, 100 * maior);
      var mTotal = sep ? (rows.length === 2 ? rows[0].mp + rows[1].mp : NaN) : (rows[0] || {}).ms;
      if (ok(mTotal) && ok(mMin) && mTotal < mMin)
        avisos.push("Massa da amostra (" + fmt(mTotal, 0) + " g) abaixo da mínima de " + fmt(mMin, 0) + " g (5 c: Tabela 1" + (ok(maior) && maior > 0 ? " ou 100 × maior partícula, o menor" : "") + ").");
      var crit = P.criterio === "2" ? 2 : 1, pEsp = crit === 2 ? p2 : p1;
      var final = ok(pEsp) ? Math.round(pEsp) : NaN;
      var minimo = num(P.minimo);
      if (ok(final) && ok(minimo) && final < minimo) avisos.push("Partículas fraturadas = " + final + " %, abaixo do mínimo exigido de " + fmt(minimo, 0) + " %.");
      var outro = num(P.outro), difOp = ok(outro) && ok(final) ? Math.abs(final - outro) : NaN;
      if (ok(difOp) && difOp > 10) avisos.push("Diferença de " + fmt(difOp, 0) + " % em relação ao outro operador — acima de 10 % (9).");
      return { tab: { porcoes: rows }, resultados: { p1: p1, p2: p2, crit: crit, final: final, minimo: minimo, mTotal: mTotal, mMin: mMin, difOp: difOp,
        conforme: ok(final) && ok(minimo) ? final >= minimo : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function item(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' +
        item((ok(r.final) ? r.final : "—") + " <small>%</small>", "Partículas com pelo menos " + (r.crit === 2 ? "duas faces" : "uma face") + " fraturada" + (r.crit === 2 ? "s" : "") + " — critério especificado" +
          (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>')) +
        item(ok(r.p1) ? fmt(Math.round(r.p1), 0) + " %" : "—", "Pelo menos uma face fraturada", true) +
        item(ok(r.p2) ? fmt(Math.round(r.p2), 0) + " %" : "—", "Pelo menos duas faces fraturadas", true) +
        item(ok(r.mTotal) ? fmt(r.mTotal, 0) + " g" : "—", "Massa da amostra (mínima " + (ok(r.mMin) ? fmt(r.mMin, 0) + " g" : "—") + ")", true) + "</div>";
    },
    relatorio: {
      notas: "P = F / (F + N) × 100 (eq. 1), com F = partículas com pelo menos o número especificado de faces fraturadas e N = as demais; resultado ao 1 % mais próximo (7). Face fraturada: área projetada ≥ 25 % da área projetada da partícula (3.1). Com a amostra separada na peneira 9,5 mm (5 d), média ponderada pelas massas das porções na amostra total. Precisão: diferença entre dois operadores ≤ 10 % (9).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Critério especificado / avaliado (8 a)", "pelo menos " + (r.crit === 2 ? "duas faces fraturadas" : "uma face fraturada") + " / avaliadas as categorias 1, 2 e 3"]);
        rows.push(["Partículas fraturadas — critério especificado", (ok(r.final) ? r.final + " %" : "—") + " (" + (P.base === "contagem" ? "por contagem" : "em massa") + ")" +
          (r.conforme === null ? "" : r.conforme ? " — atende ao mínimo de " + fmt(r.minimo, 0) + " %" : " — NÃO ATENDE ao mínimo de " + fmt(r.minimo, 0) + " %")]);
        rows.push(["Pelo menos uma face / pelo menos duas faces", (ok(r.p1) ? Math.round(r.p1) + " %" : "—") + " / " + (ok(r.p2) ? Math.round(r.p2) + " %" : "—")]);
        rows.push(["Massa total do agregado graúdo ensaiado (8 b)", ok(r.mTotal) ? fmt(r.mTotal, 0) + " g" : "—"]);
        rows.push(["Peneira de retenção (8 c)", P.peneira || "4,75 mm"]);
        if (ok(r.difOp)) rows.push(["Diferença para o outro operador", fmt(r.difOp, 0) + " % (limite 10 %)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 para concreto asfáltico — em massa, uma face (≥ 90 %)", dados: function () {
        return { ident: { registro: "EX-PF-001", obra: "Obra A", camada: "Brita 1 — CBUQ", origem: "Pedreira X", data: "2026-03-10" },
          params: { material: "Brita 1 (gnaisse)", tnm: "19", maior: "", peneira: "4,75 mm", base: "massa", separado: "nao", criterio: "1", minimo: "90" },
          porcoes: [{ ms: "1624,3", c1: "402,6", c2: "1158,9", c3: "61,5" }] };
      } },
      { nome: "Cascalho britado TNM 25 mm — porções separadas na 9,5 mm (5 d)", dados: function () {
        return { ident: { registro: "EX-PF-002", obra: "Obra B", camada: "Base — cascalho britado", origem: "Jazida 1", data: "2026-04-02" },
          params: { material: "Cascalho britado", tnm: "25", peneira: "4,75 mm", base: "massa", separado: "sim", criterio: "1", minimo: "90", outro: "91" },
          porcoes: [{ ms: "2215,0", mp: "2215,0", c1: "862,4", c2: "1227,5", c3: "125,1" },
            { ms: "236,8", mp: "1068,0", c1: "98,2", c2: "122,7", c3: "15,9" }] };
      } },
      { nome: "Seixo parcialmente britado — contagem, duas faces, amostra pequena (reprovado)", dados: function () {
        return { ident: { registro: "EX-PF-003", camada: "Tratamento superficial", origem: "Fornecedor A" },
          params: { material: "Seixo rolado parcialmente britado", tnm: "12.5", peneira: "4,75 mm", base: "contagem", separado: "nao", criterio: "2", minimo: "75" },
          porcoes: [{ ms: "438,5", c1: "61", c2: "142", c3: "57" }] };
      } },
    ],
  };
})();
