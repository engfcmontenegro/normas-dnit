/*
 * Ficha: DNER-EM 366/97 — Arame farpado de aço zincado — recebimento do lote (50 rolos ou fração).
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 *
 * Aceitação (6.2): 1 amostra de ~2 m por lote; falhando algum requisito, 4 amostras de outros 4 rolos, ensaiadas nos
 * requisitos que falharam. A norma pede ao mesmo tempo (6.2.3 b) "atendimento de pelo menos duas das quatro amostras" e
 * (6.2.3 c) "atendimento das amostras", tolerando que só uma fique abaixo do mínimo — e não abaixo de 95 % dele — em
 * carga de ruptura, carga de desenrolamento e massa de zinco. Interpretação adotada: (c) para esses três requisitos e
 * (b) para os demais (dimensionais, alongamento, aderência).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dner-em-366-97.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var EPS = 1e-9, KGF = 9.80665;

  var CAT = { A: "A — camada leve", B: "B — camada média", C: "C — camada pesada" };
  // 5.1.8 — massa mínima de zinco (g/m²) em função da categoria e do diâmetro nominal do fio (Ø = 1,80: ver nota)
  function zincoMin(cat, phi) {
    if (cat === "B") return 150;
    var grosso = phi >= 1.80 - EPS;
    if (cat === "C") return grosso ? 240 : 200;
    return grosso ? 70 : 60;
  }
  var MANDRIL = { A: 1, B: 2, C: 3 };  // 6.1.3.2 — diâmetro do mandril (× Ø nominal do fio)
  var GD = "Documentação e inspeção visual (4.3.1; 6.1.1)", GE = "Ensaios da amostra do lote (5; 6.1)";

  var CRIT = [
    { id: "etiqueta", grupo: GD, texto: "Etiqueta em cada rolo: produtor, comprimento, massa, classe, categoria de zincagem, Ø dos fios e espaçamento das farpas", secao: "4.3.1", tipo: "sim_nao", falha: "ressalva" },
    { id: "visual", grupo: GD, texto: "Inspeção visual da amostra: cordoalhamento, fixação das farpas e pontas, superfície zincada contínua e uniforme, sem defeitos grosseiros", secao: "6.1.1; 5.1.8; 6.2.3 a", tipo: "sim_nao" },
    { id: "pontas", grupo: GD, texto: "Farpas de 2 ou 4 pontas (1 ou 2 fios), todas com o mesmo número de pontas no rolo", secao: "5.1.5", tipo: "sim_nao" },
  ];

  function params() {
    return R.paramsLote({ phLote: "ex.: lote 1 (rolos 1 a 50)" }).concat([
      { k: "classe", r: "Classe (4.1 — carga de ruptura mínima)", tipo: "select", opcoes: [["350", "Classe 350"], ["250", "Classe 250"], ["175", "Classe 175"]] },
      { k: "zinc", r: "Categoria de zincagem (5.1.8)", tipo: "select", opcoes: Object.keys(CAT).map(function (k) { return [k, CAT[k]]; }) },
      { k: "phi", r: "Diâmetro nominal dos fios da cordoalha (4.2)", tipo: "select", opcoes: [["1.60", "1,60 mm"], ["1.80", "1,80 mm"], ["2.00", "2,00 mm"], ["2.20", "2,20 mm"]] },
      { k: "phiF", r: "Diâmetro nominal do fio da farpa (mm)", dica: "em branco = o dos fios da cordoalha; deve ser ≥ 80 % deste e ≥ 1,50 mm (5.1.2)" },
      { k: "esp", r: "Espaçamento nominal entre farpas (5.1.4)", tipo: "select", opcoes: [["75", "75 mm"], ["100", "100 mm"], ["125", "125 mm"]] },
      { k: "compRolo", r: "Comprimento nominal do rolo (4.3)", tipo: "select", opcoes: [["250", "250 m"], ["400", "400 m"], ["500", "500 m"], ["600", "600 m"]] },
      { k: "enrol", r: "Enrolamento da cordoalha", tipo: "select", opcoes: [["alt", "Alternado após cada farpa"], ["um", "Em um só sentido"]] },
      { k: "uCarga", r: "Unidade das cargas lançadas", tipo: "select", opcoes: [["kgf", "kgf"], ["N", "N"]], dica: "as classes são em kgf (350 kgf ≈ 3,43 kN); a norma escreve \"N (kgf)\"" },
      { k: "nRolos", r: "Rolos no lote (nº; lotes de 50 rolos ou fração — 6.1.4)" },
    ]);
  }

  function tabelasExtra() {
    return [{ chave: "am", titulo: "Amostras de ~2 m (prova: 1 rolo do lote; contraprova: 4 outros rolos — 6.1.4; 6.2.2)", rotulo: "Amostra", iniciais: 1, min: 1,
      dica: "uma coluna por amostra; \"Amostra\" em branco ou I = prova, C = contraprova (só os requisitos que falharam precisam ser ensaiados)",
      linhas: [{ k: "id", r: "Rolo / identificação", texto: true }, { k: "am", r: "Amostra (I / C)", texto: true },
        { k: "d1", r: "Diâmetro do fio 1 da cordoalha", u: "mm" }, { k: "d2", r: "Diâmetro do fio 2 da cordoalha", u: "mm" },
        { k: "dF", r: "Diâmetro do fio da farpa", u: "mm" }, { k: "pontas", r: "Pontas fora de ø 14 mm e dentro de ø 24 mm? (S / N)", texto: true },
        { k: "esp", r: "Espaçamento entre farpas (entre centros)", u: "mm" }, { k: "tor", r: "Torções entre farpas consecutivas", u: "nº" },
        { k: "rup", r: "Carga de ruptura (NBR 6207)", u: "kgf/N" }, { k: "des", r: "Carga de desenrolamento (NBR 6347)", u: "kgf/N" },
        { k: "al", r: "Alongamento sob 70 % da carga mínima da classe", u: "%" }, { k: "zn", r: "Massa da camada de zinco (NBR 7397)", u: "g/m²" },
        { k: "ader", r: "Aderência do zinco — enrolamento no mandril (S / N)", texto: true },
        { k: "comp", r: "Comprimento do rolo (quando medido)", u: "m" }, { k: "emendas", r: "Emendas da cordoalha no rolo", u: "nº" }] }];
  }

  // requisitos de uma amostra: [{id, rot, mec, v, lim, falha, ratio}]
  function avaliarAmostra(c, P) {
    var phi = num(P.phi), phiF = ok(num(P.phiF)) ? num(P.phiF) : phi, cl = num(P.classe), fC = P.uCarga === "N" ? KGF : 1, uC = P.uCarga === "N" ? "N" : "kgf";
    var espN = num(P.esp), cR = num(P.compRolo), cat = P.zinc || "A";
    var reqs = [];
    function add(id, rot, v, lim, mec) {
      var x = num(v);
      if (!ok(x)) return;
      var f = R.fora(x, lim);
      reqs.push({ id: id, rot: rot, x: x, lim: lim, mec: !!mec, falha: f, ratio: mec && ok(lim.min) ? x / lim.min : NaN });
    }
    function addSN(id, rot, v) {
      var s = R.sn(v);
      if (s === null) return;
      reqs.push({ id: id, rot: rot, sn: true, falha: !s });
    }
    add("d1", "Ø fio 1", c.d1, { min: phi - 0.09, max: phi + 0.09, casas: 2, un: "mm" });
    add("d2", "Ø fio 2", c.d2, { min: phi - 0.09, max: phi + 0.09, casas: 2, un: "mm" });
    add("dF", "Ø farpa", c.dF, { min: Math.max(phiF - 0.09, 0.8 * phi, 1.5), max: phiF + 0.09, casas: 2, un: "mm" });
    addSN("pontas", "pontas das farpas entre ø 14 e ø 24 mm", c.pontas);
    add("esp", "espaçamento entre farpas", c.esp, { min: espN * 0.85, max: espN * 1.15, casas: 1, un: "mm" });
    add("tor", "torções entre farpas", c.tor, P.enrol === "um" ? { min: 1.2, max: 7, casas: 1 } : { min: 2, max: 7, casas: 1 });
    add("rup", "carga de ruptura", c.rup, { min: cl * fC, casas: 0, un: uC }, true);
    if ((cl === 350 || cl === 250) && P.enrol !== "um") add("des", "carga de desenrolamento", c.des, { min: 0.75 * cl * fC, casas: 0, un: uC }, true);
    add("al", "alongamento sob 70 % da carga", c.al, { min: 1, minEstrito: true, casas: 2, un: "%" });
    add("zn", "massa de zinco", c.zn, { min: zincoMin(cat, phi), casas: 0, un: "g/m²" }, true);
    addSN("ader", "aderência do zinco (mandril " + MANDRIL[cat] + " × Ø)", c.ader);
    add("comp", "comprimento do rolo", c.comp, { min: cR * 0.97, max: cR * 1.03, casas: 0, un: "m" });
    add("emendas", "emendas", c.emendas, { max: cR <= 250 ? 2 : 3, casas: 0 });
    return reqs;
  }
  function txtReq(q) {
    return q.sn ? q.rot + ": não atende" : q.rot + " " + fmt(q.x, q.lim.casas) + (q.lim.un ? " " + q.lim.un : "") + " (exigido " + R.lim(q.lim) + ")";
  }

  function extra(ctx) {
    var P = ctx.P, phi = num(P.phi), cl = num(P.classe), cat = P.zinc || "A", nR = num(P.nRolos);
    var cols = R.cols(ctx.d, "am", ["d1", "d2", "dF", "pontas", "esp", "tor", "rup", "des", "al", "zn", "ader", "comp", "emendas"]);
    var U = cols.map(function (c, i) {
      var u = R.unidade(c, i, "amostra");
      u.reqs = avaliarAmostra(c, P);
      u.falhas = u.reqs.filter(function (q) { return q.falha; }).map(txtReq);
      return u;
    });
    var ini = U.filter(function (u) { return !u.contra; }), con = U.filter(function (u) { return u.contra; });
    var u0 = ini[0];
    var obrig = ["d1", "d2", "dF", "pontas", "esp", "tor", "rup", "al", "zn", "ader"];
    if ((cl === 350 || cl === 250) && P.enrol !== "um") obrig.push("des");
    var l = A.linha({ id: "amostra", grupo: GE, criterio: "Amostra do lote — dimensões, propriedades mecânicas e zincagem", secao: "5.1; 5.2; 6.1.2; 6.1.3", n: U.length,
      exigido: "Ø " + fmt(phi, 2) + " ± 0,09 mm; farpa ≥ 80 % Ø e ≥ 1,50 mm; espaçamento " + P.esp + " mm ± 15 %; torções " + (P.enrol === "um" ? "1,2" : "2") + " a 7; ruptura ≥ " + cl + " kgf" +
        ((cl === 350 || cl === 250) && P.enrol !== "um" ? "; desenrolamento ≥ " + fmt(0.75 * cl, 1) + " kgf" : "") + "; alongamento > 1 % sob 70 % da carga; zinco ≥ " + zincoMin(cat, phi) + " g/m²; aderência",
      resultado: ini.length ? (u0.falhas.length ? u0.falhas.length + " requisito(s) com falha na prova" : "prova atende") + (con.length ? "; contraprova: " + con.length + " amostra(s)" : "") : "—" });
    l.unidades = U; l.tituloUni = "Amostras do lote";
    if (!ini.length) R.redef(l, "sem_dados", "sem amostra ensaiada");
    else {
      if (ini.length > 1) ctx.avisos.push("Há " + ini.length + " amostras de prova: a EM retira uma amostra por lote (6.1.4); avaliada a primeira (" + u0.rot + ").");
      var falt = obrig.filter(function (id) { return !u0.reqs.some(function (q) { return q.id === id; }); });
      var fal = u0.reqs.filter(function (q) { return q.falha; });
      if (!fal.length) {
        if (falt.length) R.redef(l, "pendente", "prova sem os ensaios: " + falt.join(", "));
        else l.motivo = "todos os requisitos atendidos na prova (6.2.1)";
      } else if (con.length < 4) {
        R.redef(l, "pendente", "falha na prova (" + u0.falhas.join("; ") + ") — retirar 4 amostras de outros 4 rolos e repetir os ensaios que falharam (6.2.2): " + con.length + " de 4");
      } else {
        var C4 = con.slice(0, 4), nc = [], okT = [];
        fal.forEach(function (q) {
          var rs = C4.map(function (u) { return u.reqs.filter(function (x) { return x.id === q.id; })[0]; });
          var sem = rs.filter(function (x) { return !x; }).length;
          if (sem) { A.marcar(l, "pendente", q.rot + ": " + sem + " amostra(s) da contraprova sem resultado"); return; }
          var ruins = rs.filter(function (x) { return x.falha; });
          if (q.mec) {
            // 6.2.3 c — no máximo uma abaixo do mínimo e não abaixo de 95 % dele
            if (ruins.length > 1) nc.push(q.rot + ": " + ruins.length + " amostras abaixo do mínimo na contraprova (6.2.3 c admite uma)");
            else if (ruins.length === 1 && ruins[0].ratio < 0.95 - EPS) nc.push(q.rot + ": " + txtReq(ruins[0]) + " — abaixo de 95 % do mínimo (6.2.3 c)");
            else okT.push(q.rot + ": " + (ruins.length ? "uma amostra entre 95 % e 100 % do mínimo (" + fmt(ruins[0].ratio * 100, 1) + " %), admitida" : "contraprova atende") + " (6.2.3 c)");
          } else {
            // 6.2.3 b — pelo menos duas das quatro amostras atendendo
            var bons = 4 - ruins.length;
            if (bons < 2) nc.push(q.rot + ": só " + bons + " de 4 amostras atendem na contraprova (6.2.3 b)");
            else okT.push(q.rot + ": " + bons + " de 4 amostras atendem (6.2.3 b)");
          }
        });
        if (con.length > 4) ctx.avisos.push("Contraprova com " + con.length + " amostras: a EM pede 4 (6.2.2); avaliadas as 4 primeiras.");
        if (nc.length) A.marcar(l, "nao_conforme", "falha na prova (" + u0.falhas.join("; ") + "); contraprova não atende — " + nc.join("; ") +
          ". Por acordo prévio, os rolos podem ser ensaiados um a um, aceitando só os conformes (6.2.4)");
        else if (l.situacao === "conforme") { l.situacao = "conforme"; l.motivo = "falha na prova; contraprova aceita — " + okT.join("; "); }
      }
    }
    ctx.linhas.push(l);
    var nLotes = ok(nR) ? Math.max(1, Math.ceil(nR / 50 - EPS)) : 1;
    ctx.freqs.push(A.frequencia({ ensaio: "Amostra de prova (1 rolo por lote de 50)", metodo: "NBR 6347", exigido: 1, regra: "1 por lote de 50 rolos ou fração (6.1.4)", realizado: ini.length ? 1 : 0 }));
    if (nLotes > 1) ctx.avisos.push(nR + " rolos: forme " + nLotes + " lotes de até 50 rolos, cada um com a sua amostra e a sua ficha (6.1.4).");
    if (ok(phi) && Math.abs(phi - 1.8) < EPS && cat !== "B") ctx.avisos.push("Ø = 1,80 mm: a EM (5.1.8) define as faixas \"1,50 ≤ Ø < 1,80\" e \"Ø > 1,80\" e não cobre Ø = 1,80; adotado o mínimo da faixa superior (" + zincoMin(cat, phi) + " g/m²).");
  }

  R.criar({
    id: "dner-em-366-97",
    titulo: "Arame farpado de aço zincado — recebimento do lote",
    resumo: "Recebimento de um lote de até 50 rolos de arame farpado (DNER-EM 366/97): etiqueta (4.3.1), inspeção visual (6.1.1), dimensões dos fios e das farpas (± 0,09 mm; farpa ≥ 80 % do fio e ≥ 1,50 mm; pontas entre ø 14 e ø 24 mm; espaçamento ± 15 %; 2 a 7 torções), cargas de ruptura (classe 350/250/175 kgf) e de desenrolamento (75 %), alongamento > 1 % sob 70 % da carga, massa de zinco por categoria A/B/C e aderência (mandril 1, 2 ou 3 Ø), comprimento do rolo (± 3 %) e emendas; aceitação com contraprova de 4 amostras (6.2).",
    params: params(),
    padrao: { classe: "350", zinc: "A", phi: "1.60", esp: "125", compRolo: "500", enrol: "alt", uCarga: "kgf", nRolos: "50" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    textos: { REJEITADO: { texto: "Lote não aceito na contraprova (6.2.3). Mediante acordo prévio, cada rolo do lote pode ser ensaiado individualmente no requisito que falhou, aceitando-se só os conformes (6.2.4)." } },
    notas: "Critérios da DNER-EM 366/97. Carga de ruptura mínima = classe (350, 250 ou 175 kgf — a norma escreve \"N (kgf)\"); desenrolamento ≥ 75 % da carga mínima (classes 350 e 250, enrolamento alternado — 5.2.2); alongamento > 1 % sob 70 % da carga mínima (5.2.1). Zinco (5.1.8): A — 60 g/m² (1,50 ≤ Ø < 1,80) ou 70 g/m² (Ø > 1,80); B — 150 g/m²; C — 200 ou 240 g/m². Torções entre farpas 2 a 7 (enrolamento num só sentido: mín. 1,2 — 5.1.6.1); comprimento do rolo ± 3 % (5.1.7); emendas ≤ 2 (rolos de 250 m) ou ≤ 3 (400 m ou mais — 5.3). Amostragem: 1 amostra de ~2 m de um rolo por lote de 50 rolos (6.1.4). Contraprova: 4 amostras de outros 4 rolos nos requisitos que falharam; ruptura, desenrolamento e zinco — no máximo uma amostra abaixo do mínimo, não abaixo de 95 % dele (6.2.3 c); demais requisitos — pelo menos 2 das 4 atendendo (6.2.3 b).",
    exemplos: [
      { nome: "Classe 350, Ø 1,60 mm, zincagem A — lote aceito na prova", dados: function () {
        return { ident: { registro: "ARA-01", obra: "Obra A — cercas da faixa de domínio", data: "2026-02-18", origem: "Fornecedor A", camada: "Arame farpado classe 350" },
          params: { lote: "Lote 1 (rolos 1 a 50)", fornecedor: "Fornecedor A", nf: "031145", dataEntrega: "18/02/2026", classe: "350", zinc: "A", phi: "1.60", esp: "125",
            compRolo: "500", enrol: "alt", uCarga: "kgf", nRolos: "50" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }],
          am: [{ id: "Rolo 17", d1: "1,62", d2: "1,59", dF: "1,61", pontas: "S", esp: "128", tor: "3", rup: "372", des: "298", al: "1,6", zn: "66", ader: "S", comp: "503", emendas: "1" }] };
      } },
      { nome: "Classe 250, Ø 2,00 mm, zincagem C — ruptura e zinco falham na prova e na contraprova (rejeitado)", dados: function () {
        return { ident: { registro: "ARA-02", obra: "Obra B — cercas", data: "2026-03-05", origem: "Fornecedor B", camada: "Arame farpado classe 250" },
          params: { lote: "Lote 3 (rolos 101 a 142)", fornecedor: "Fornecedor B", nf: "77120", dataEntrega: "05/03/2026", classe: "250", zinc: "C", phi: "2.00", esp: "100",
            compRolo: "400", enrol: "alt", uCarga: "kgf", nRolos: "42" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }],
          am: [{ id: "Rolo 108", d1: "2,03", d2: "1,98", dF: "2,01", pontas: "S", esp: "104", tor: "4", rup: "241", des: "196", al: "1,4", zn: "226", ader: "S" },
            { id: "Rolo 112", am: "C", rup: "252", zn: "244" }, { id: "Rolo 121", am: "C", rup: "235", zn: "231" },
            { id: "Rolo 130", am: "C", rup: "256", zn: "219" }, { id: "Rolo 139", am: "C", rup: "249", zn: "246" }] };
      } },
      { nome: "Classe 350, Ø 2,20 mm, zincagem B — ruptura falha na prova; contraprova aceita (uma amostra a 96,6 % do mínimo)", dados: function () {
        return { ident: { registro: "ARA-03", obra: "Obra C — cercas", data: "2026-04-22", origem: "Fornecedor A", camada: "Arame farpado classe 350" },
          params: { lote: "Lote 2 (rolos 51 a 100)", fornecedor: "Fornecedor A", nf: "031377", dataEntrega: "22/04/2026", classe: "350", zinc: "B", phi: "2.20", esp: "125",
            compRolo: "400", enrol: "alt", uCarga: "kgf", nRolos: "50" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }],
          am: [{ id: "Rolo 63", d1: "2,21", d2: "2,24", dF: "2,18", pontas: "S", esp: "119", tor: "3", rup: "340", des: "281", al: "1,5", zn: "171", ader: "S", comp: "405", emendas: "2" },
            { id: "Rolo 55", am: "C", rup: "356" }, { id: "Rolo 71", am: "C", rup: "361" }, { id: "Rolo 84", am: "C", rup: "338" }, { id: "Rolo 97", am: "C", rup: "352" }] };
      } },
    ],
  });
})();
