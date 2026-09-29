/*
 * Ficha: DNER-PRO 377/97 — Extração e preparação de amostras de cimento (registro e verificação).
 * Amostras parciais (uma coluna por tomada) e amostras de ensaio (uma coluna por amostra, em duplicata). Confere o
 * número mínimo de tomadas pelo procedimento de extração (3.2.1: 2,5 kg por 200 t e parciais de até 40 t na
 * composta; 3.2.2: 2,5 kg por 100 t; 3.2.4: um saco por 5 000 kg; 3.2.5: por 2 500 kg ou por caminhão), massas
 * mínimas (2,5 kg por parcial e 5 kg por amostra de ensaio, 3.1.4), representatividade máxima (400 t; 100 t para
 * ensaios físicos de vagões/caminhões, 3.1.3 e 3.4), duplicata e testemunho por 90 dias (3.5), tubo saca-amostras
 * (3.2.3) e identificação (3.3.3). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var PROC = [["transp", "Transportador que alimenta o armazém a granel (3.2.1)"], ["deposito", "Depósito a granel, nas bocas de descarga (3.2.2)"],
    ["ranhurado", "Embarque a granel — tubo saca-amostras ranhurado (3.2.3)"], ["sacos", "Sacos — tubo amostrador pela válvula (3.2.4)"],
    ["outras", "Outras condições de entrega — por 2 500 kg (3.2.5)"], ["caminhoes", "Transporte em caminhões desde a fábrica — de cada caminhão (3.2.5)"]];
  var ID = [["iTipo", "a) tipo de cimento e marca comercial"], ["iLocais", "b) locais de procedência e de retirada"], ["iOrdem", "c) número de ordem da retirada"],
    ["iLote", "d) massa do lote representado"], ["iPartes", "e) nomes e endereços das partes interessadas"], ["iAss", "g) assinaturas das partes e data da retirada"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function proc(d) { return ((d && d.params) || {}).proc || "sacos"; }
  var CHECK = [
    ["chkHerm", "3.1.6 e 3.2.6", "Amostras colocadas imediatamente em recipientes herméticos e impermeáveis (cheios e fechados, ou sacos lacrados), numerados na ordem da extração", null],
    ["chkValv", "3.2.4", "Tubo amostrador introduzido diagonalmente pela válvula do saco, com o orifício de respiração vedado na retirada", "sacos"],
    ["chkPontos", "3.2.3 e 3.2.5", "Pontos de amostragem previamente escolhidos e bem distribuídos na superfície e na profundidade", "ranhurado"],
    ["chkPen", "3.3.1", "Amostra homogeneizada e passada na peneira de 0,840 mm (nº 20), retirados materiais estranhos e torrões endurecidos", null],
    ["chkComp", "3.2.1 e 3.3.2", "Amostra composta formada por porções iguais de cada parcial e perfeitamente homogeneizada", null],
  ];

  function exigencias(P) {
    var p = P.proc || "sacos", t = num(P.lote), comp = P.tipoAm === "composta", e = { porT: NaN, nParc: NaN };
    if (p === "transp") { e.porT = comp ? 40 : 200; e.sec = comp ? "3.2.1 — parciais de no máximo 40 t na composta" : "3.2.1 — 2,5 kg ou mais para cada 200 t"; }
    if (p === "deposito") { e.porT = 100; e.sec = "3.2.2 — 2,5 kg para cada 100 t, no máximo"; }
    if (p === "sacos") { e.porT = 5; e.sec = "3.2.4 — um saco por 5 000 kg (100 sacos de 50 kg) ou fração"; }
    if (p === "outras") { e.porT = 2.5; e.sec = "3.2.5 — amostras de cada 2 500 kg ou fração"; }
    if (ok(e.porT) && ok(t)) e.nParc = Math.ceil(t / e.porT - 1e-9);
    if (p === "caminhoes") { e.nParc = num(P.nCam); e.sec = "3.2.5 — amostra de cada caminhão"; e.porT = ok(t) && ok(e.nParc) && e.nParc > 0 ? t / e.nParc : NaN; }
    e.limEns = P.destino === "fisVeic" || p === "caminhoes" ? 100 : 400;
    e.nEns = ok(t) ? Math.ceil(t / e.limEns - 1e-9) : NaN;
    return e;
  }
  function data(s) { var m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; }

  FE.FICHAS["dner-pro-377-97"] = {
    titulo: "Cimento — Extração e preparação de amostras",
    resumo: "Registro e verificação da extração de amostras de cimento: tomadas por 200 t, 100 t, 5 000 kg, 2 500 kg ou caminhão (3.2), parciais ≥ 2,5 kg e amostras de ensaio ≥ 5 kg representando até 400 t (100 t para ensaios físicos de vagões/caminhões), duplicata, testemunho por 90 dias, preparação na peneira 0,840 mm e identificação.",
    params: [
      { k: "proc", r: "Procedimento de extração (3.2)", tipo: "select", recarrega: true, opcoes: PROC },
      { k: "tipoAm", r: "Tipo de amostra (3.1.1 e 3.1.2)", tipo: "select", opcoes: [["composta", "Composta (mistura de tomadas)"], ["unica", "De uma só tomada"], ["continua", "Contínua (dispositivo automático)"]] },
      { k: "lote", r: "Massa do lote, t (3.3.3 d)" },
      { k: "nCam", r: "Número de caminhões do lote (3.2.5)", se: function (d) { return proc(d) === "caminhoes"; } },
      { k: "destino", r: "Ensaios e origem (3.4)", tipo: "select", opcoes: [["dep", "Físicos (pega, finura, resistência, expansibilidade) de cimento em depósito/embarcação — até 400 t"],
        ["fisVeic", "Físicos de amostras extraídas de vagões ou caminhões — até 100 t"], ["quim", "Químicos — até 400 t"]] },
      { k: "tuboL", r: "Tubo saca-amostras: comprimento, mm (3.2.3: 1 500 a 1 800)", se: function (d) { return proc(d) === "ranhurado"; } },
      { k: "tuboD", r: "Tubo saca-amostras: diâmetro externo, mm (3.2.3: 35)", se: function (d) { return proc(d) === "ranhurado"; } },
      { k: "entidade", r: "Entidade responsável pela amostragem (3.1.1 e 3.1.5)", ph: "de preferência o órgão fiscalizador" },
      { k: "dataExt", r: "Data da extração", tipo: "date" },
      { k: "testAte", r: "Amostra-testemunho guardada até (3.5: 90 dias)", tipo: "date" },
    ].concat(ID.map(function (e) { return { k: e[0], r: "Identificação (3.3.3): " + e[1] }; }))
      .concat([{ k: "iObs", r: "Identificação (3.3.3): f) observações" }])
      .concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] ? function (d) { return proc(d) === c[3] || (c[3] === "ranhurado" && /outras|caminhoes/.test(proc(d))); } : undefined }; })),
    padrao: { proc: "sacos", tipoAm: "composta", destino: "dep" },
    tabelas: function (d) {
      return [
        { chave: "par", titulo: "Tomadas / amostras parciais (3.2)", rotulo: "Tomada", iniciais: 4, min: 1, linhas: [
          { k: "ordem", r: "Número de ordem / saco / caminhão", texto: true },
          { k: "m", r: "Massa da tomada (≥ 2,5 kg na composta)", u: "kg" },
          { k: "t", r: "Cimento representado pela tomada", u: "t" }], dica: proc(d) === "sacos" ? "uma coluna por saco amostrado" : "uma coluna por tomada" },
        { chave: "ens", titulo: "Amostras de ensaio (3.1.3 e 3.1.4)", rotulo: "Amostra", iniciais: 1, min: 1, linhas: [
          { k: "m", r: "Massa da amostra de ensaio (≥ 5 kg)", u: "kg" },
          { k: "mDup", r: "Massa da duplicata (3.1.3; 3.5)", u: "kg" },
          { k: "t", r: "Cimento representado", u: "t" }], dica: "uma coluna por amostra de ensaio; a duplicata fica como testemunho" },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], e = exigencias(P), r = { e: e }, comp = P.tipoAm === "composta";
      var par = (d.par || []).filter(function (x) { return ok(num(x.m)) || ok(num(x.t)) || String(x.ordem || "").trim(); });
      r.nPar = par.length;
      r.mPar = par.reduce(function (a, x) { return a + (ok(num(x.m)) ? num(x.m) : 0); }, 0);
      if (ok(e.nParc) && r.nPar < e.nParc) avisos.push(r.nPar + " tomada(s) para " + fmt(num(P.lote), 1) + " t — mínimo de " + e.nParc + " (" + e.sec + ").");
      par.forEach(function (x, i) {
        var m = num(x.m), t = num(x.t), rot = "Tomada " + (i + 1);
        if (ok(m) && m < 2.5 && (comp || P.proc === "transp" || P.proc === "deposito")) avisos.push(rot + ": " + fmt(m, 2) + " kg — cada tomada que forma a composta deve pesar pelo menos 2,5 kg (3.1.4; 3.2.1; 3.2.2).");
        if (ok(t) && ok(e.porT) && P.proc !== "caminhoes" && t > e.porT + 1e-9) avisos.push(rot + ": representa " + fmt(t, 1) + " t — no máximo " + fmt(e.porT, 1) + " t por tomada (" + e.sec + ").");
      });
      var ens = (d.ens || []).filter(function (x) { return ok(num(x.m)) || ok(num(x.t)); });
      r.nEns = ens.length;
      if (ok(e.nEns) && r.nEns < e.nEns) avisos.push(r.nEns + " amostra(s) de ensaio para " + fmt(num(P.lote), 1) + " t — cada uma representa no máximo " + e.limEns + " t: mínimo " + e.nEns + " (3.1.3; 3.4).");
      ens.forEach(function (x, i) {
        var m = num(x.m), md = num(x.mDup), t = num(x.t), rot = "Amostra de ensaio " + (i + 1);
        if (ok(m) && m < 5) avisos.push(rot + ": " + fmt(m, 2) + " kg — as amostras para ensaio devem pesar pelo menos 5 kg (3.1.4).");
        if (!ok(md)) avisos.push(rot + ": sem duplicata — as amostras de ensaio são tomadas em duplicata, uma guardada como testemunho (3.1.3; 3.5).");
        else if (md < 5) avisos.push(rot + ": duplicata de " + fmt(md, 2) + " kg — menor que 5 kg (3.1.4).");
        if (ok(t) && t > e.limEns + 1e-9) avisos.push(rot + ": representa " + fmt(t, 1) + " t — no máximo " + e.limEns + " t (3.1.3; 3.4).");
      });
      if (P.proc === "ranhurado") {
        var L = num(P.tuboL), D = num(P.tuboD);
        if (ok(L) && (L < 1500 || L > 1800)) avisos.push("Tubo saca-amostras de " + fmt(L, 0) + " mm — comprimento entre 1 500 e 1 800 mm (3.2.3).");
        if (ok(D) && Math.abs(D - 35) > 1) avisos.push("Tubo saca-amostras com diâmetro externo de " + fmt(D, 0) + " mm — a norma indica 35 mm (3.2.3).");
      }
      var de = data(P.dataExt), ta = data(P.testAte);
      r.testMin = ok(de) ? new Date(de + 90 * 86400000).toISOString().slice(0, 10).split("-").reverse().join("/") : "";
      if (ok(de) && ok(ta) && ta < de + 90 * 86400000) avisos.push("Amostra-testemunho guardada só até " + P.testAte.split("-").reverse().join("/") + " — guardar por 90 dias, até " + r.testMin + " (3.5).");
      if (ok(de) && !ok(ta)) avisos.push("Guarde uma amostra como testemunho por 90 dias, até " + r.testMin + " (3.5).");
      var falta = ID.filter(function (x) { return !String(P[x[0]] || "").trim(); }).map(function (x) { return x[1]; });
      if (falta.length) avisos.push("Identificação sem: " + falta.join("; ") + " (3.3.3).");
      if (!String(P.entidade || "").trim()) avisos.push("Anote a entidade responsável pela amostragem (3.1.1; 3.1.5).");
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        if (c[3] && !(proc(d) === c[3] || (c[3] === "ranhurado" && /outras|caminhoes/.test(proc(d))))) return;
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.chk = chk; r.nAvisos = avisos.length;
      return { tab: {}, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk, e = r.e;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(r.nPar + (ok(e.nParc) ? " / " + e.nParc : ""), "Tomadas / mínimo · " + st) +
        cx(r.nEns + (ok(e.nEns) ? " / " + e.nEns : ""), "Amostras de ensaio / mínimo (até " + e.limEns + " t cada)") +
        cx(esc(r.testMin || "—"), "Guardar o testemunho até (3.5)") + cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Extração conforme a DNER-PRO 377/97: amostras de ensaio de uma só tomada ou compostas, com pelo menos 5 kg, representando no máximo 400 t (100 t para ensaios físicos de vagões ou caminhões), em duplicata (3.1.3, 3.1.4, 3.4); tomadas de pelo menos 2,5 kg — por 200 t no transportador (parciais de até 40 t na composta), por 100 t no depósito, um saco por 5 000 kg, por 2 500 kg ou por caminhão (3.2); tubo ranhurado de 1 500 a 1 800 mm e 35 mm (3.2.3); preparação na peneira de 0,840 mm (3.3.1); testemunho guardado 90 dias (3.5).",
      resultados: function (calc, d) {
        var r = calc.resultados, e = r.e, P = d.params || {};
        return [["Lote", (P.lote || "—") + " t"], ["Tomadas", r.nPar + (ok(e.nParc) ? " (mínimo " + e.nParc + "; " + e.sec + ")" : "") + " · " + fmt(r.mPar, 1) + " kg"],
          ["Amostras de ensaio", r.nEns + (ok(e.nEns) ? " (mínimo " + e.nEns + ", até " + e.limEns + " t cada)" : "")], ["Testemunho", r.testMin ? "guardar até " + r.testMin : "—"],
          ["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]];
      },
    },
    exemplos: [
      { nome: "CP II-F 32 em sacos — 18 t (360 sacos)", dados: function () {
        return { ident: { registro: "EX-CI-001", data: "2025-05-06", obra: "Obra A", origem: "Fornecedor A", camada: "Cimento CP II-F 32" },
          params: { proc: "sacos", tipoAm: "composta", lote: "18", destino: "dep", entidade: "Fiscalização da Obra A", dataExt: "2025-05-06", testAte: "2025-08-06",
            iTipo: "CP II-F 32 — marca comercial M", iLocais: "Fábrica F; almoxarifado da Obra A", iOrdem: "1 a 4", iLote: "18 t (360 sacos de 50 kg)", iPartes: "Contratante e Fornecedor A (endereços no processo)", iAss: "Assinado em 06/05/2025",
            chkHerm: "sim", chkValv: "sim", chkPen: "sim", chkComp: "sim" },
          par: [{ ordem: "Saco 17", m: "2,6", t: "5" }, { ordem: "Saco 112", m: "2,5", t: "5" }, { ordem: "Saco 205", m: "2,7", t: "5" }, { ordem: "Saco 331", m: "2,6", t: "3" }],
          ens: [{ m: "5,2", mDup: "5,1", t: "18" }] };
      } },
      { nome: "Granel em caminhões — 3 caminhões, 120 t, ensaios físicos", dados: function () {
        return { ident: { registro: "EX-CI-002", data: "2025-09-15", obra: "Obra B", origem: "Fornecedor B", camada: "Cimento CP III-40 RS" },
          params: { proc: "caminhoes", tipoAm: "composta", lote: "120", nCam: "3", destino: "fisVeic", entidade: "", dataExt: "2025-09-15", testAte: "2025-10-15",
            iTipo: "CP III-40 RS", iLocais: "Silo da central", iOrdem: "", iLote: "120 t", iPartes: "", iAss: "", chkHerm: "sim", chkPontos: "nao", chkPen: "sim", chkComp: "sim" },
          par: [{ ordem: "Caminhão 1", m: "2,5", t: "40" }, { ordem: "Caminhão 2", m: "2,0", t: "40" }],
          ens: [{ m: "4,5", mDup: "", t: "120" }] };
      } },
    ],
  };
})();
