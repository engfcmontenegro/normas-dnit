/*
 * Ficha: DNER-PRO 104/94 — Amostragem de tinta para demarcação viária (registro, inspeção do lote e parecer).
 * Tinta já fornecida (4.2.2): plano de amostragem simples ou dupla da Tabela de 4.2.2.5 pelo tamanho do lote, contagem de
 * recipientes defeituosos (3.4) e parecer ACEITO / REJEITADO / SEGUNDA AMOSTRAGEM (4.2.3). Amostras para laboratório
 * (4.1.1: ≥ 2 L de cada cor, tipo e lote, em recipientes cilíndricos de 3,6 L) e ficha de identificação (4.3).
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  // Tabela (4.2.2.5): [lote de, até, [n1, Ac1, Re1], [n2, Ac2 (cumulativo), Re2] ou null]
  var PLANO = [[2, 180, [7, 0, 1], null], [181, 500, [15, 0, 3], [30, 2, 3]], [501, 800, [25, 1, 4], [50, 3, 4]],
    [801, 1300, [35, 1, 5], [70, 4, 5]], [1301, 3200, [50, 2, 7], [100, 6, 7]]];
  var DEF = [["dEnch", "a) deficiência de enchimento"], ["dFech", "b) fechamento imperfeito"], ["dVaz", "c) vazamento"], ["dAmas", "d) amassamento"],
    ["dAlca", "e) falta ou insegurança de alça"], ["dCons", "f) má conservação"], ["dIdent", "g) identificação deficiente"], ["dOutros", "h) outros defeitos"]];
  var ETQ = [["eNat", "a) natureza do material"], ["eNome", "b) nome comercial e/ou numeração"], ["eCor", "c) cor"], ["eResina", "d) natureza química da resina"],
    ["eQtd", "e) quantidade (volume)"], ["eFab", "f) data de fabricação"], ["eVal", "g) prazo de validade"], ["ePart", "h) partida de fabricação"],
    ["eTec", "i) técnico responsável pela fabricação"], ["eFabr", "j) nome e endereço do fabricante"], ["eColeta", "l) data e local da coleta"],
    ["eResp", "m) responsável pela coleta"], ["eFim", "n) fim e local a que se destina"], ["eRem", "o) remetente"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function mod(d) { return ((d && d.params) || {}).modalidade || "fornecida"; }
  function forn(d) { return mod(d) === "fornecida"; }
  var CHECK = [
    ["chkHomog", "4.2.1.1 a", "Conteúdo do tanque homogeneizado durante todo o enchimento", function (d) { return !forn(d); }],
    ["chkInterv", "4.2.1.1 b", "Amostras retiradas durante o enchimento, com intervalo de tempo entre as retiradas", function (d) { return !forn(d); }],
    ["chkCond", "4.2.2.4", "Verificadas antes da coleta: cor, unidade de fornecimento, embalagem, identificação, enchimento e apresentação", forn],
    ["chkVerter", "4.2.2.3 a–c", "Se o recipiente original não foi enviado: tinta vertida, resíduo agitado com espátula e reincorporado, despejos sucessivos entre recipientes", forn],
    ["chkFech", "4.2.1.1 c e 4.2.2.3 d", "Recipientes das amostras quase cheios, fechados sem vazamento, lacrados e identificados", function () { return true; }],
  ];
  function plano(N) { for (var i = 0; i < PLANO.length; i++) if (N >= PLANO[i][0] && N <= PLANO[i][1]) return PLANO[i]; return null; }

  function avaliar(d) {
    var P = d.params || {}, N = num(P.lote), pl = ok(N) ? plano(N) : null, I = d.insp || [], r = { N: N, pl: pl };
    var i1 = I[0] || {}, i2 = I[1] || {};
    r.n1 = num(i1.nInsp); r.d1 = num(i1.nDef); r.n2 = num(i2.nInsp); r.d2 = num(i2.nDef);
    if (!pl) { r.parecer = "PENDENTE"; r.motivo = ok(N) ? "lote fora da Tabela (2 a 3 200 recipientes)" : "informe o tamanho do lote"; return r; }
    r.req1 = Math.min(pl[2][0], N); r.todos1 = pl[2][0] >= N;
    if (!ok(r.d1)) { r.parecer = "PENDENTE"; r.motivo = "inspeção da 1ª amostra não registrada"; return r; }
    if (ok(r.n1) && r.n1 < r.req1) { r.parecer = "PENDENTE"; r.motivo = "1ª amostra com " + r.n1 + " recipientes — a Tabela pede " + r.req1; return r; }
    if (r.d1 <= pl[2][1]) { r.parecer = "ACEITO"; r.motivo = "1ª amostra" + (pl[3] ? "" : " (única)") + ": " + r.d1 + " defeituoso(s) ≤ número de aceitação " + pl[2][1]; return r; }
    if (r.d1 >= pl[2][2]) { r.parecer = "REJEITADO"; r.motivo = "1ª amostra" + (pl[3] ? "" : " (única)") + ": " + r.d1 + " defeituoso(s) ≥ número de rejeição " + pl[2][2]; return r; }
    // entre Ac e Re: segunda amostra (só amostragem dupla)
    r.req2 = Math.min(pl[3][0], Math.max(0, N - (ok(r.n1) ? r.n1 : pl[2][0])));
    if (!ok(r.d2)) { r.parecer = "2ª AMOSTRAGEM"; r.motivo = "1ª amostra: " + r.d1 + " defeituoso(s), entre " + pl[2][1] + " e " + pl[2][2] + " — formar a 2ª amostra de " + pl[3][0] + " recipientes (4.2.3.1)"; return r; }
    if (ok(r.n2) && r.n2 < r.req2) { r.parecer = "PENDENTE"; r.motivo = "2ª amostra com " + r.n2 + " recipientes — a Tabela pede " + r.req2; return r; }
    var tot = r.d1 + r.d2; r.tot = tot;
    if (tot <= pl[3][1]) { r.parecer = "ACEITO"; r.motivo = "1ª + 2ª amostras: " + tot + " defeituoso(s) ≤ número de aceitação " + pl[3][1] + " (4.2.3.2)"; return r; }
    r.parecer = "REJEITADO"; r.motivo = "1ª + 2ª amostras: " + tot + " defeituoso(s) ≥ número de rejeição " + pl[3][2] + " (4.2.3.2)";
    return r;
  }

  FE.FICHAS["dner-pro-104-94"] = {
    titulo: "Tinta para demarcação viária — Amostragem e inspeção do lote",
    resumo: "Plano de amostragem simples ou dupla da Tabela de 4.2.2.5 pelo tamanho do lote, contagem de recipientes defeituosos e parecer ACEITO / REJEITADO / 2ª amostragem (4.2.3); amostras de 2 L por cor, tipo e lote (4.1.1) e ficha de identificação (4.3).",
    lote: true,
    params: [
      { k: "modalidade", r: "Modalidade (4.2)", tipo: "select", recarrega: true, opcoes: [["fornecida", "Tinta já fornecida, sem inspetor na fabricação (4.2.2)"], ["fabrica", "Na fabricação, acompanhada por inspetor (4.2.1)"]] },
      { k: "lote", r: "Tamanho do lote — recipientes (3.1)", se: forn },
      { k: "recip", r: "Recipiente do lote (tipo e capacidade)", ph: "ex.: balde de 18 L" },
      { k: "original", r: "Amostra enviada ao laboratório", tipo: "select", se: forn, opcoes: [["orig", "Recipiente original inspecionado, fechado e lacrado (4.2.2.2)"], ["retirada", "Amostra retirada do recipiente (4.2.2.3)"]] },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] }; })),
    padrao: { modalidade: "fornecida", original: "retirada" },
    tabelas: function (d) {
      var T = [];
      if (forn(d)) T.push({ chave: "insp", titulo: "Inspeção dos recipientes (4.2.2.5 a 4.2.3)", rotulo: "Amostra", iniciais: 2, min: 2, fixo: true, nomes: ["1ª (ou única)", "2ª"],
        linhas: [{ k: "nInsp", r: "Recipientes inspecionados (retirados ao acaso)", u: "nº" }, { k: "nDef", r: "Recipientes defeituosos (com um ou mais defeitos)", u: "nº" },
          { grupo: "Defeitos encontrados (3.4) — informativo" }].concat(DEF.map(function (x) { return { k: x[0], r: x[1], u: "nº" }; })),
        dica: "a 2ª coluna só é usada na amostragem dupla, quando a 1ª cai entre os números de aceitação e de rejeição" });
      T.push({ chave: "am", titulo: "Amostras para laboratório (4.1.1 e 4.3)", rotulo: "Amostra", iniciais: 1, min: 1,
        linhas: [{ k: "vol", r: "Volume de tinta (≥ 2 L por cor, tipo e lote)", u: "L" }, { k: "cap", r: "Capacidade do recipiente cilíndrico (3,6 L)", u: "L", ph: "3,6" },
          { grupo: "Ficha de identificação (4.3)" }].concat(ETQ.map(function (e) { return { k: e[0], r: e[1], texto: true }; })),
        dica: "uma coluna por cor, tipo e lote" });
      return T;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], r = forn(d) ? avaliar(d) : { parecer: "", motivo: "" };
      if (forn(d)) {
        if (r.pl && r.todos1) avisos.push("Tamanho da amostra (" + r.pl[2][0] + ") ≥ tamanho do lote (" + r.N + "): inspecionar todos os recipientes (Nota 2).");
        if (ok(r.N) && !r.pl) avisos.push("Lote de " + fmt(r.N, 0) + " recipientes fora da Tabela de 4.2.2.5 (2 a 3 200).");
        if (r.parecer === "PENDENTE" || r.parecer === "2ª AMOSTRAGEM") avisos.push("Parecer " + r.parecer.toLowerCase() + ": " + r.motivo + ".");
        (d.insp || []).forEach(function (x, i) {
          var nd = num(x.nDef), ni = num(x.nInsp), soma = DEF.reduce(function (a, e) { return a + (ok(num(x[e[0]])) ? num(x[e[0]]) : 0); }, 0);
          if (ok(nd) && ok(ni) && nd > ni) avisos.push((i + 1) + "ª amostra: mais defeituosos que inspecionados — confira.");
          if (ok(nd) && soma && soma < nd) avisos.push((i + 1) + "ª amostra: soma dos defeitos (" + soma + ") menor que o número de defeituosos — cada defeituoso tem ao menos um defeito (4.2.2.7).");
        });
        if (r.parecer === "REJEITADO") avisos.push("Lote rejeitado na inspeção: a coleta da amostra representativa (4.2.2.3) só é feita após atendidas as condições de 4.2.2.4.");
      }
      var am = (d.am || []).map(function (x, i) {
        var rot = "Amostra " + (i + 1) + (x.eCor ? " (" + x.eCor + ")" : ""), v = num(x.vol), c = num(x.cap);
        if (ok(v) && v < 2) avisos.push(rot + ": " + fmt(v, 1) + " L — no mínimo 2 litros para cada cor, tipo e lote (4.1.1).");
        if (ok(c) && Math.abs(c - 3.6) > 0.1 && !(forn(d) && P.original === "orig")) avisos.push(rot + ": recipiente de " + fmt(c, 1) + " L — as amostras são coletadas em recipientes cilíndricos de 3,6 L (4.1.1).");
        if (ok(v) && ok(c) && v > c) avisos.push(rot + ": volume maior que a capacidade do recipiente — confira.");
        var falta = ETQ.filter(function (e) { return !String(x[e[0]] || "").trim(); }).map(function (e) { return e[1].slice(0, 2); });
        if (falta.length) avisos.push(rot + ": ficha de identificação sem os itens " + falta.join(" ") + " (4.3).");
        return {};
      });
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        if (!c[3](d)) return;
        if (c[0] === "chkVerter" && P.original === "orig") return;
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.chk = chk; r.nAm = am.length; r.nAvisos = avisos.length; r.fornecida = forn(d);
      return { tab: { am: am }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = "";
      if (r.fornecida) {
        var cls = r.parecer === "ACEITO" ? "fe-ok" : r.parecer === "REJEITADO" ? "fe-nok" : "";
        h += cx('<span class="' + cls + '">' + esc(r.parecer) + "</span>", "Parecer do lote na inspeção (4.2.3) · " + esc(r.motivo));
        if (r.pl) h += cx(r.pl[3] ? "dupla" : "simples", "Amostragem · lote " + fmt(r.N, 0) + " · 1ª: n = " + r.pl[2][0] + ", Ac " + r.pl[2][1] + ", Re " + r.pl[2][2] +
          (r.pl[3] ? " · 2ª: n = " + r.pl[3][0] + " (cum. " + (r.pl[2][0] + r.pl[3][0]) + "), Ac " + r.pl[3][1] + ", Re " + r.pl[3][2] : ""));
      }
      return '<div class="fe-res">' + h + cx(fmt(r.nAm, 0), "Amostras para laboratório") + cx(c.feitos + " / " + c.total, "Procedimentos confirmados" + (r.nAvisos ? ' · <span class="fe-nok">' + r.nAvisos + " aviso(s)</span>" : "")) + "</div>";
    },
    relatorio: {
      notas: "Amostragem conforme a DNER-PRO 104/94. Tabela de 4.2.2.5 (lote → amostra, aceitação, rejeição): 2–180 simples 7 (0/1); 181–500 dupla 15 (0/3) + 30, cumulativo 45 (2/3); 501–800 dupla 25 (1/4) + 50 = 75 (3/4); 801–1 300 dupla 35 (1/5) + 70 = 105 (4/5); 1 301–3 200 dupla 50 (2/7) + 100 = 150 (6/7). Amostra ≥ lote: inspecionar todos (Nota 2). Aceitação se defeituosos ≤ número de aceitação; rejeição se ≥ número de rejeição; entre os dois, 2ª amostra, com a soma das duas comparada aos números da 2ª (4.2.3). Amostras para laboratório: ≥ 2 L por cor, tipo e lote, em recipientes cilíndricos de 3,6 L (4.1.1).",
      resultados: function (calc) {
        var r = calc.resultados, rows = [];
        if (r.fornecida) {
          rows.push(["Parecer do lote (inspeção dos recipientes)", r.parecer + " — " + r.motivo]);
          if (r.pl) rows.push(["Plano de amostragem", (r.pl[3] ? "Dupla" : "Simples") + " — 1ª amostra " + r.pl[2][0] + " (Ac " + r.pl[2][1] + ", Re " + r.pl[2][2] + ")" + (r.pl[3] ? "; 2ª amostra " + r.pl[3][0] + " (Ac " + r.pl[3][1] + ", Re " + r.pl[3][2] + ")" : "")]);
          if (ok(r.d1)) rows.push(["Defeituosos", "1ª: " + r.d1 + (ok(r.n1) ? " em " + r.n1 : "") + (ok(r.d2) ? " · 2ª: " + r.d2 + (ok(r.n2) ? " em " + r.n2 : "") : "")]);
        }
        rows.push(["Amostras para laboratório", fmt(r.nAm, 0)]);
        rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Lote de 420 baldes — dupla amostragem, aceito na 2ª amostra", dados: function () {
        var e = { eNat: "Tinta para demarcação viária à base de resina acrílica", eNome: "Produto T-1", eResina: "Acrílica emulsionada em água", eQtd: "2,5 L", eFab: "03/2025",
          eVal: "09/2025", ePart: "P-0325-14", eTec: "Químico responsável do Fornecedor A", eFabr: "Fornecedor A (endereço no processo)", eColeta: "22/04/2025 — almoxarifado da Obra A",
          eResp: "Técnico A", eFim: "Ensaios de laboratório — sinalização da Obra A", eRem: "Unidade A" };
        return { ident: { registro: "EX-TI-001", data: "2025-04-22", obra: "Obra A", origem: "Fornecedor A", camada: "Tinta de demarcação" },
          params: { modalidade: "fornecida", lote: "420", recip: "Balde de 18 L", original: "retirada", chkCond: "sim", chkVerter: "sim", chkFech: "sim" },
          insp: [{ nInsp: "15", nDef: "1", dAmas: "1" }, { nInsp: "30", nDef: "1", dIdent: "1" }],
          am: [Object.assign({ vol: "2,5", cap: "3,6", eCor: "Branca" }, e), Object.assign({ vol: "2,5", cap: "3,6", eCor: "Amarela" }, e)] };
      } },
      { nome: "Lote de 120 latas — amostragem simples, rejeitado", dados: function () {
        return { ident: { registro: "EX-TI-002", data: "2025-08-19", obra: "Obra B", origem: "Fornecedor B", camada: "Tinta de demarcação" },
          params: { modalidade: "fornecida", lote: "120", recip: "Lata de 3,6 L", original: "retirada", chkCond: "nao", chkVerter: "sim", chkFech: "sim" },
          insp: [{ nInsp: "7", nDef: "2", dVaz: "1", dFech: "1", dCons: "1" }, {}],
          am: [{ vol: "1,5", cap: "3,6", eNat: "Tinta para demarcação viária", eNome: "Produto T-2", eCor: "Branca", eResina: "", eQtd: "1,5 L", eFab: "05/2025", eVal: "",
            ePart: "L-77", eTec: "", eFabr: "Fornecedor B", eColeta: "19/08/2025", eResp: "Técnico B", eFim: "Ensaios", eRem: "Unidade B" }] };
      } },
    ],
  };
})();
