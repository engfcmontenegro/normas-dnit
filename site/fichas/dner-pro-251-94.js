/*
 * Ficha: DNER-PRO 251/94 — Microesferas de vidro retrorrefletivas para demarcação viária — amostragem.
 * Plano de amostragem da Tabela de 4.2 (sacos de 25 kg retirados pelo tamanho do lote), pré-requisito de aceitação na
 * inspeção visual (DNER-PRO 132/94, 4.1) e redução por quarteamento manual (sucessivas quartas partes, 4.3.1) ou por
 * repartidor (1/16 até ≈ 5 000 g e 1/1 até ≈ 2 500 g, 4.3.2); embalagem e relatório da inspeção (4.4).
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var TOL = 0.25;       // "aproximada de 2 500 g", "± 2 500 g", "aproximadamente 5 000 g": ± 25 % (critério da ficha; 1/16 de 4 sacos = 6 250 g)
  var TOL_QUARTO = 5;   // quarta parte: 25 ± 5 % da massa dividida (critério da ficha)
  var TAB = [[2, 90, 2], [91, 275, 4], [276, 610, 8], [611, 1160, 10]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function met(d) { return ((d && d.params) || {}).metodo || "rep"; }
  var CHECK = [
    ["chkLona", "4.3.1.1", "Conteúdo de todos os sacos espalhado na lona, homogeneizado com pá e arrumado em cone", function (d) { return met(d) === "manual"; }],
    ["chkRep", "4.3.2.1", "Todos os sacos retirados passados pelos crivos do repartidor 1/16 e a amostra reduzida no repartidor 1/1", function (d) { return met(d) === "rep"; }],
    ["chkSaco", "4.4", "Amostra em saco plástico limpo, seco e sem vazamento, lacrado e identificado", function () { return true; }],
    ["chkRel", "4.4.1", "Amostra acompanhada do relatório da inspeção visual (DNER-PRO 132/94)", function () { return true; }],
  ];
  function nSacos(N) { if (!ok(N)) return NaN; for (var i = 0; i < TAB.length; i++) if (N >= TAB[i][0] && N <= TAB[i][1]) return TAB[i][2]; return N < 2 ? N : NaN; }

  FE.FICHAS["dner-pro-251-94"] = {
    titulo: "Microesferas de vidro — Amostragem",
    resumo: "Plano de amostragem de microesferas de vidro retrorrefletivas: sacos retirados pela Tabela de 4.2 (2, 4, 8 ou 10 sacos), após aceitação na inspeção visual (DNER-PRO 132/94), e redução a cerca de 2 500 g por quarteamento manual ou repartidor 1/16 e 1/1 (4.3).",
    params: [
      { k: "lote", r: "Tamanho do lote — sacos de 25 kg (4.1 e 4.2)" },
      { k: "tipo", r: "Tipo de microesfera", ph: "ex.: tipo II-A" },
      { k: "mesmaData", r: "Sacos do mesmo tipo e da mesma data de fabricação? (4.1)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "pro132", r: "Resultado da inspeção visual das embalagens — DNER-PRO 132/94 (4.1)", tipo: "select", opcoes: [["", "— não informado"], ["aceito", "Aceito"], ["rejeitado", "Rejeitado"]] },
      { k: "metodo", r: "Formação da amostra (4.3)", tipo: "select", recarrega: true, opcoes: [["rep", "Repartidor 1/16 e 1/1 (4.3.2)"], ["manual", "Quarteamento manual (4.3.1)"]] },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] }; })),
    padrao: { mesmaData: "sim", pro132: "", metodo: "rep" },
    tabelas: function (d) {
      var rep = met(d) === "rep";
      return [
        { chave: "sacos", titulo: "Sacos retirados (4.2)", rotulo: "Saco", iniciais: 2, min: 1, linhas: [
          { k: "id", r: "Identificação / posição no lote", texto: true }, { k: "m", r: "Massa do saco", u: "kg", ph: "25" }], dica: "uma coluna por saco retirado ao acaso" },
        { chave: "red", titulo: rep ? "Redução no repartidor (4.3.2.1)" : "Quarteamentos sucessivos (4.3.1.2)", rotulo: rep ? "Passagem" : "Quarteamento", iniciais: rep ? 2 : 3, min: 1, linhas: [
          { k: "op", r: rep ? "Repartidor usado (1/16 ou 1/1)" : "Operação", texto: true, ph: rep ? "1/16" : "quarta parte" },
          { k: "mAntes", r: "Massa dividida", u: "g" }, { k: "m", r: "Massa retida (segue na redução)", u: "g" },
          { calc: "f", r: "Retida / dividida", u: "%", casas: 1 }], dica: "a massa retida na última coluna é a amostra remetida" },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], rep = met(d) === "rep", N = num(P.lote), r = { N: N, rep: rep };
      r.nReq = nSacos(N);
      var sacos = (d.sacos || []).filter(function (x) { return String(x.id || "").trim() || ok(num(x.m)); });
      r.nSac = sacos.length;
      r.mSac = sacos.reduce(function (a, x) { return a + (ok(num(x.m)) ? num(x.m) : 25); }, 0);
      if (ok(N) && N > 1160) avisos.push("Lote de " + fmt(N, 0) + " sacos acima da Tabela de 4.2 (até 1 160) — a norma não fixa a amostra; divida a entrega em lotes ou combine o critério.");
      if (ok(r.nReq) && r.nSac < r.nReq) avisos.push(r.nSac + " saco(s) retirado(s) — a Tabela de 4.2 pede " + r.nReq + " para lote de " + fmt(N, 0) + " sacos.");
      if (ok(r.nReq) && r.nSac > r.nReq) avisos.push(r.nSac + " sacos retirados — mais que os " + r.nReq + " da Tabela de 4.2 (admissível, mas confira).");
      sacos.forEach(function (x, i) { var m = num(x.m); if (ok(m) && Math.abs(m - 25) > 1) avisos.push("Saco " + (i + 1) + ": " + fmt(m, 1) + " kg — o lote é constituído por sacos de 25 kg (4.1)."); });
      if (P.mesmaData === "nao") avisos.push("O lote é formado por sacos do mesmo tipo e da mesma data de fabricação (4.1) — separe os lotes.");
      if (P.pro132 === "rejeitado") avisos.push("A amostra para ensaio só é formada após a inspeção visual (DNER-PRO 132/94) ter conduzido à aceitação (4.1).");
      if (!P.pro132) avisos.push("Informe o resultado da inspeção visual das embalagens (DNER-PRO 132/94), pré-requisito da amostragem (4.1).");
      var ant = NaN, tab = [], cinco = false;
      (d.red || []).forEach(function (x, i) {
        var a = num(x.mAntes), m = num(x.m), op = String(x.op || ""), o = {};
        if (!ok(a) && ok(ant)) a = ant;
        o.f = ok(a) && ok(m) && a > 0 ? m / a * 100 : NaN;
        if (!rep && ok(o.f) && Math.abs(o.f - 25) > TOL_QUARTO) avisos.push("Quarteamento " + (i + 1) + ": retida " + fmt(o.f, 1) + " % — o processamento é repetido na quarta parte do material dividido (4.3.1.2; critério da ficha 25 ± 5 %).");
        if (rep && /1\s*\/\s*1\b/.test(op) && ok(a) && Math.abs(a - 5000) > 5000 * TOL) avisos.push("Passagem " + (i + 1) + ": o repartidor 1/1 é aplicado à amostra de aproximadamente 5 000 g obtida no 1/16; massa dividida " + fmt(a, 0) + " g (4.3.2.1; critério da ficha ± 25 %).");
        if (rep && /1\s*\/\s*16/.test(op) && ok(m) && Math.abs(m - 5000) <= 5000 * TOL) cinco = true;
        if (ok(m)) ant = m;
        tab.push(o);
      });
      r.mFinal = ant;
      if (rep && (d.red || []).length && !cinco) avisos.push("Não há passagem no repartidor 1/16 resultando em aproximadamente 5 000 g (4.3.2.1).");
      if (ok(r.mFinal) && Math.abs(r.mFinal - 2500) > 2500 * TOL) avisos.push("Amostra final de " + fmt(r.mFinal, 0) + " g — a norma pede aproximadamente 2 500 g (" + (rep ? "4.3.2.1" : "4.3.1.2") + "; critério da ficha ± 25 %).");
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        if (!c[3](d)) return;
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.chk = chk; r.nAvisos = avisos.length;
      return { tab: { red: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(r.nSac + " / " + (ok(r.nReq) ? r.nReq : "—"), "Sacos retirados / Tabela de 4.2 · " + st) +
        cx(fmt(r.mFinal, 0) + " <small>g</small>", "Amostra remetida (≈ 2 500 g)") + cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Amostragem conforme a DNER-PRO 251/94. Tabela de 4.2 (lote em sacos de 25 kg → sacos da amostra): 2–90 → 2; 91–275 → 4; 276–610 → 8; 611–1 160 → 10. Pré-requisito: aceitação na inspeção visual das embalagens (DNER-PRO 132/94). Quarteamento manual repetido na quarta parte até cerca de 2 500 g; ou repartidor 1/16 até cerca de 5 000 g e repartidor 1/1 até cerca de 2 500 g. Critérios da ficha: \"aproximadamente\" = ± 25 % (uma passagem no 1/16 dá 1/16 da massa: 3 125 g para 2 sacos, 6 250 g para 4); quarta parte = 25 ± 5 %.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        return [["Lote", (P.lote || "—") + " sacos de 25 kg" + (P.tipo ? " — " + P.tipo : "")], ["Sacos retirados", r.nSac + " (Tabela de 4.2: " + (ok(r.nReq) ? r.nReq : "fora da tabela") + ")"],
          ["Amostra remetida", fmt(r.mFinal, 0) + " g"], ["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]];
      },
    },
    exemplos: [
      { nome: "Lote de 240 sacos — 4 sacos e repartidor", dados: function () {
        return { ident: { registro: "EX-MV-001", data: "2025-03-25", obra: "Obra A", origem: "Fornecedor A", camada: "Microesferas tipo II-A" },
          params: { lote: "240", tipo: "II-A (premix)", mesmaData: "sim", pro132: "aceito", metodo: "rep", chkRep: "sim", chkSaco: "sim", chkRel: "sim" },
          sacos: [{ id: "Palete 1, saco 5", m: "25" }, { id: "Palete 3, saco 18", m: "25" }, { id: "Palete 6, saco 2", m: "25" }, { id: "Palete 9, saco 30", m: "25" }],
          red: [{ op: "1/16", mAntes: "100000", m: "6180" }, { op: "1/1", mAntes: "6180", m: "3090" }] };
      } },
      { nome: "Lote de 700 sacos — poucos sacos, quarteamento irregular, sem inspeção", dados: function () {
        return { ident: { registro: "EX-MV-002", data: "2025-07-08", obra: "Obra B", origem: "Fornecedor B", camada: "Microesferas tipo I-B" },
          params: { lote: "700", tipo: "I-B (drop-on)", mesmaData: "sim", pro132: "", metodo: "manual", chkLona: "sim", chkSaco: "sim", chkRel: "nao" },
          sacos: [{ id: "Saco 12", m: "25" }, { id: "Saco 140", m: "25" }, { id: "Saco 355", m: "25" }, { id: "Saco 601", m: "25" }],
          red: [{ op: "quarta parte", mAntes: "100000", m: "24800" }, { op: "quarta parte", mAntes: "24800", m: "6100" }, { op: "metade", mAntes: "6100", m: "3050" }] };
      } },
    ],
  };
})();
