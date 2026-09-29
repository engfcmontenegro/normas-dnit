/*
 * Ficha de ES: DNIT 118/2009-ES — Pontes e viadutos rodoviários — Armaduras para concreto armado (aceitação do lote
 * de barras/fios, das emendas e da execução). Usa FE.aceitacao e FE.aceitacaoG9b (es-dnit-116-2009-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-118-2009-es";

  // Tabela 1 — massa máxima do lote (t): diâmetro → [CA-25, CA-50, CA-60]
  var TAB1 = { "3.2": [NaN, NaN, 1.6], "4": [NaN, NaN, 2], "5": [6.3, 3.2, 2.5], "6.3": [8, 4, 3.2], "8": [10, 5, 4], "10": [12.5, 6.3, 5],
    "12.5": [16, 8, 6.3], "16": [20, 10, NaN], "20": [25, 12.5, NaN], "25": [30, 16, NaN], "32": [30, 20, NaN], "40": [30, 25, NaN] };
  var CATS = ["CA-25", "CA-50", "CA-60"];
  // Tabela 2 — nº de exemplares [inicial, contraprova] por plano: [identificadas, não identificadas]
  var TAB2 = { 1: [[1, 2], [2, 3]], 2: [[2, 3], [2, 3]], 3: [[3, 4], [3, 4]] };
  // Tabela 3 — plano a adotar: plano anterior × resultado (todos aprovados / um rejeitado / mais de um)
  var TAB3 = { 1: { todos: 1, um: 2, mais: 3 }, 2: { todos: 1, um: 3, mais: 3 }, 3: { todos: 2, um: 3, mais: 3 } };
  // ABNT NBR 7480 (referida em 4 e 5.1): fyk (MPa), fst/fy mínimo, alongamento em 10φ (%)
  var NBR7480 = { "CA-25": [250, 1.20, 18], "CA-50": [500, 1.08, 8], "CA-60": [600, 1.05, 5] };

  function cat(P) { return CATS.indexOf(P.categoria) >= 0 ? P.categoria : "CA-50"; }
  function diam(P) { return num(P.diametro); }
  function simp(k, v) { return function (P) { return P[k] === (v || "sim"); }; }

  var CRIT = [
    { id: "defeitos", grupo: "Recebimento (4; 7.1.1)", texto: "Barras, fios e telas sem fissuras, bolhas, esfoliações ou corrosão excessiva", secao: "4; 7.1.1", tipo: "sim_nao" },
    { id: "armaz", grupo: "Recebimento (4; 7.1.1)", texto: "Estocagem abrigada, sobre estrados, sem contato com o solo", secao: "4; 5.3.1", tipo: "sim_nao" },
    { id: "compr", grupo: "Recebimento (4; 7.1.1)", texto: "Comprimento das barras laminadas (12 m ± 1 %)", secao: "4; 7.1.1", tipo: "valor", unid: "m", casas: 2, min: 11.88, max: 12.12,
      falha: "ressalva", se: simp("fornecimento", "barra"), naoAplicaPor: "fornecimento em rolos" },
    { id: "nervuras", grupo: "Recebimento (4; 7.1.1)", texto: "Conformação: nervuras ≥ 45°, 2 longitudinais, altura ≥ 4 % φ, espaçamento 50 a 80 % φ, ≥ 85 % do perímetro", secao: "7.1.1 a–e", tipo: "sim_nao",
      falha: "ressalva", exigido: "verificação preliminar recomendada (7.1.1)" },
    { id: "corte", grupo: "Execução (5.3; 7.2)", texto: "Corte e dobramento conforme projeto; Classe B dobrada a frio; sem dobra junto a emenda soldada", secao: "5.3.2", tipo: "sim_nao" },
    { id: "montagem", grupo: "Execução (5.3; 7.2)", texto: "Montagem: barras limpas; dimensões, posições, espaçamentos e traspasses do projeto", secao: "5.3.4", tipo: "sim_nao" },
    { id: "cobr", grupo: "Execução (5.3; 7.2)", texto: "Cobrimento medido das armaduras", secao: "5.3.4; 5.3.5", tipo: "valor", unid: "mm", casas: 0,
      min: function (P) { return num(P.cobrimento); }, se: function (P) { return ok(num(P.cobrimento)); }, naoAplicaPor: "cobrimento de projeto não informado",
      exigido: "≥ cobrimento de projeto (NBR 6118, Tabela 7.2, conforme a agressividade)" },
    { id: "tela_q", grupo: "Telas soldadas (7.3.1 c)", texto: "Telas — juntas soldadas quebradas", secao: "7.3.1 c", tipo: "valor", unid: "% por painel", casas: 1, max: 1,
      exigido: "≤ 1 % por painel (ou por 15 m² de rolo)", se: simp("telas"), naoAplicaPor: "sem telas soldadas" },
    { id: "tela_fio", grupo: "Telas soldadas (7.3.1 c)", texto: "Telas — menos de 50 % das juntas quebradas num único fio; tração e dobramento/cisalhamento satisfatórios", secao: "7.3.1 c", tipo: "sim_nao",
      se: simp("telas"), naoAplicaPor: "sem telas soldadas" },
  ];

  function tabelasExtra(d) {
    return [
      { chave: "ex", titulo: "Exemplares do lote — massa, tração e dobramento (7.1.2 a 7.1.4)", rotulo: "Exemplar", iniciais: 2, min: 1,
        dica: "um exemplar por coluna (2,20 m; 1 por barra); amostra \"I\" (inicial) ou \"C\" (contraprova)",
        linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "am", r: "Amostra (I / C)", texto: true },
          { k: "comp", r: "Comprimento", u: "m" }, { k: "massa", r: "Massa", u: "kg" },
          { k: "fy", r: "Limite de escoamento fy", u: "MPa" }, { k: "fst", r: "Resistência à tração fst", u: "MPa" },
          { k: "al", r: "Alongamento em 10φ", u: "%" }, { k: "dob", r: "Dobramento satisfatório? (S / N)", texto: true }] },
      { chave: "em", titulo: "Emendas — ensaio de tração (7.2; NBR 8548)", rotulo: "Emenda", iniciais: 1, min: 1,
        dica: "1 exemplar por conjunto de até 50 emendas do mesmo tipo; contraprova = 2 exemplares",
        linhas: [{ k: "id", r: "Identificação / tipo", texto: true }, { k: "am", r: "Amostra (I / C)", texto: true },
          { k: "smax", r: "Tensão na carga máxima σmáx", u: "MPa" }, { k: "A", r: "Alongamento em 10 diâmetros A", u: "mm" }] },
    ];
  }

  function avaliarExemplares(ctx) {
    var P = ctx.P, c = cat(P), phi = diam(P), N = NBR7480[c], tolM = ok(phi) && phi < 10 ? 10 : 6;
    var mNom = ok(phi) ? Math.PI * phi * phi / 4 * 1e-6 * 7850 : NaN; // kg/m (7,85 kg/dm³)
    var ex = (ctx.d.ex || []).filter(function (x) { return ["comp", "massa", "fy", "fst", "al", "dob"].some(function (k) { return String(x[k] || "").trim(); }); });
    var res = ex.map(function (x, i) {
      var o = { rot: x.id || "ex. " + (i + 1), contra: /^c/i.test(String(x.am || "").trim()), falhas: [] };
      var L = num(x.comp), M = num(x.massa);
      if (ok(L) && ok(M) && ok(mNom)) { o.dm = (M / (L * mNom) - 1) * 100; if (Math.abs(o.dm) > tolM + 1e-9) o.falhas.push("massa " + fmt(o.dm, 1) + " % (± " + tolM + " %)"); }
      o.fy = num(x.fy); o.fst = num(x.fst); o.al = num(x.al);
      if (ok(o.fy) && o.fy < N[0]) o.falhas.push("fy " + fmt(o.fy, 0) + " < " + N[0] + " MPa");
      if (ok(o.fy) && ok(o.fst)) { o.rel = o.fst / o.fy; if (o.rel < N[1] - 1e-9) o.falhas.push("fst/fy " + fmt(o.rel, 2) + " < " + fmt(N[1], 2)); }
      if (ok(o.al) && o.al < N[2]) o.falhas.push("alongamento " + fmt(o.al, 1) + " % < " + N[2] + " %");
      if (G.simNao(x.dob) === false) o.falhas.push("dobramento não satisfatório");
      return o;
    });
    var ini = res.filter(function (o) { return !o.contra; }), con = res.filter(function (o) { return o.contra; });
    var fi = ini.filter(function (o) { return o.falhas.length; }), fc = con.filter(function (o) { return o.falhas.length; });
    var l = A.linha({ id: "lote_ex", grupo: "Ensaios do lote (7.1.4; 7.3.1 a)", criterio: "Massa real, tração e dobramento dos exemplares (" + c + (ok(phi) ? ", φ " + fmt(phi, phi % 1 ? 1 : 0) + " mm" : "") + ")",
      secao: "7.1.1; 7.1.4; 7.3", n: res.length,
      exigido: "massa ± " + tolM + " %; fy ≥ " + N[0] + " MPa; fst/fy ≥ " + fmt(N[1], 2) + "; alongamento ≥ " + N[2] + " % (NBR 7480); dobramento satisfatório",
      resultado: ini.length + " inicial(is), " + fi.length + " com falha" + (con.length ? "; " + con.length + " de contraprova, " + fc.length + " com falha" : "") });
    if (!ok(mNom)) A.marcar(l, "pendente", "informe o diâmetro nominal para a massa nominal");
    if (!ini.length) G.redefinir(l, "sem_dados", "sem exemplares da amostra inicial");
    else if (!fi.length) l.motivo = "todos os exemplares da amostra inicial satisfatórios — lote conforme (7.3.1 a)";
    else if (!con.length) G.redefinir(l, "pendente", "falha na amostra inicial (" + fi.map(function (o) { return o.rot + ": " + o.falhas.join(", "); }).join("; ") + ") — realizar a contraprova única (7.3.1 a)");
    else if (fc.length) G.redefinir(l, "nao_conforme", "contraprova com resultado insatisfatório (" + fc.map(function (o) { return o.rot + ": " + o.falhas.join(", "); }).join("; ") + ") — lote não conforme (7.3.2)");
    else G.redefinir(l, "conforme", "falha na amostra inicial (" + fi.map(function (o) { return o.rot; }).join(", ") + "), contraprova toda satisfatória — lote aceito (7.3.1 a)");
    l.pontos = res.filter(function (o) { return ok(o.dm); }).map(function (o) { return { v: o.dm, rot: o.rot }; });
    ctx.linhas.push(l);
    return { ini: ini.length, con: con.length, fi: fi.length };
  }

  function avaliarEmendas(ctx) {
    var P = ctx.P, phi = diam(P), fstMin = ok(num(P.fstMin)) ? num(P.fstMin) : NBR7480[cat(P)][0] * NBR7480[cat(P)][1];
    var em = (ctx.d.em || []).filter(function (x) { return ok(num(x.smax)) || ok(num(x.A)); });
    var nEm = num(P.nEmendas);
    if (!em.length && !(ok(nEm) && nEm > 0)) return;
    var res = em.map(function (x, i) {
      var o = { rot: x.id || "emenda " + (i + 1), contra: /^c/i.test(String(x.am || "").trim()), f: [] }, s = num(x.smax), a = num(x.A);
      if (ok(s) && s < fstMin - 1e-9) o.f.push("σmáx " + fmt(s, 0) + " < " + fmt(fstMin, 0) + " MPa");
      if (ok(s) && ok(a) && ok(phi)) { o.lim = 0.1 + s / 2 * phi * 1e-4; if (a > o.lim + 1e-9) o.f.push("A = " + fmt(a, 2) + " > " + fmt(o.lim, 2) + " mm"); }
      return o;
    });
    var ini = res.filter(function (o) { return !o.contra; }), con = res.filter(function (o) { return o.contra; });
    var fi = ini.filter(function (o) { return o.f.length; }), fc = con.filter(function (o) { return o.f.length; });
    var l = A.linha({ id: "emendas", grupo: "Emendas (7.2; 7.3.1 b)", criterio: "Emendas mecânicas/soldadas — resistência e alongamento", secao: "7.2; 7.3.1 b", n: res.length,
      exigido: "σmáx ≥ fst das barras (" + fmt(fstMin, 0) + " MPa); A ≤ 0,1 + (σmáx/2)·φ·10⁻⁴ mm",
      resultado: ini.length + " prova(s), " + fi.length + " com falha" + (con.length ? "; " + con.length + " contraprova(s), " + fc.length + " com falha" : "") });
    if (!ok(phi)) A.marcar(l, "pendente", "informe o diâmetro nominal");
    if (!ini.length) G.redefinir(l, "sem_dados", "sem ensaios de emendas");
    else if (!fi.length) l.motivo = "prova satisfatória — conjunto aceito (7.3.1 b)";
    else if (con.length < 2) G.redefinir(l, "pendente", "prova insatisfatória (" + fi.map(function (o) { return o.rot + ": " + o.f.join(", "); }).join("; ") + ") — retirar duas contraprovas do conjunto (7.2)");
    else if (fc.length) G.redefinir(l, "nao_conforme", "contraprova insatisfatória (" + fc.map(function (o) { return o.rot + ": " + o.f.join(", "); }).join("; ") + ") (7.3.2)");
    else G.redefinir(l, "conforme", "prova insatisfatória, duas contraprovas satisfatórias — conjunto aceito (7.3.1 b)");
    ctx.linhas.push(l);
    ctx.freqs.push(A.frequencia({ ensaio: "Tração de emendas (prova)", metodo: "NBR 8548", por: "contagem", a_cada: 50, qtd: nEm, minimo: 1, unidade: "emendas", realizado: ini.length }));
  }

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Pontes e viadutos — armaduras para concreto armado — aceitação do lote",
    resumo: "Aceitação de um lote de barras/fios (categoria e diâmetro, Tabela 1) pela DNIT 118/2009-ES: recebimento (4; 7.1.1), plano de amostragem (Tabelas 2 e 3), massa real (± 6 % para φ ≥ 10 mm; ± 10 % abaixo), tração e dobramento com contraprova única (7.3.1 a), emendas com prova e duas contraprovas e a inequação do alongamento (7.2), telas (7.3.1 c) e execução (5.3). Os limites de tração vêm da ABNT NBR 7480, à qual a ES remete.",
    lote: false,
    params: [
      { k: "lote", r: "Lote / partida", ph: "ex.: partida 3 — lote 2" },
      { k: "categoria", r: "Categoria do aço (5.1)", tipo: "select", opcoes: [["CA-25", "CA-25"], ["CA-50", "CA-50"], ["CA-60", "CA-60"]] },
      { k: "diametro", r: "Diâmetro nominal (mm)", tipo: "select", opcoes: Object.keys(TAB1).map(function (k) { return [k, k.replace(".", ",") + " mm"]; }) },
      { k: "fornecimento", r: "Fornecimento", tipo: "select", opcoes: [["barra", "Barras retas"], ["rolo", "Rolos (lote e amostra em dobro)"]] },
      { k: "identif", r: "Corridas identificadas?", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não (lotes misturados)"]] },
      { k: "massaLote", r: "Massa do lote (t)" },
      { k: "plano", r: "Plano de amostragem adotado (Tabela 2)", tipo: "select", opcoes: [["2", "Plano 2"], ["1", "Plano 1"], ["3", "Plano 3"]] },
      { k: "planoAnt", r: "Plano dos 5 lotes anteriores (Tabela 3)", tipo: "select", opcoes: [["", "Nenhum — 5 primeiros lotes (Plano 2)"], ["1", "Plano 1"], ["2", "Plano 2"], ["3", "Plano 3"]] },
      { k: "resAnt", r: "Resultado dos 5 lotes anteriores", tipo: "select", opcoes: [["todos", "Todos aprovados"], ["um", "Houve lote rejeitado"], ["mais", "Mais de um lote rejeitado"]],
        se: function (d) { return !!(d.params || {}).planoAnt; } },
      { k: "nEmendas", r: "Emendas mecânicas/soldadas no conjunto (nº) — opcional" },
      { k: "fstMin", r: "Resistência convencional à ruptura das barras (MPa) — opcional", dica: "padrão: fyk × fst/fy mínimo da NBR 7480 (300 / 540 / 630 MPa)" },
      { k: "cobrimento", r: "Cobrimento de projeto (mm) — opcional" },
      { k: "telas", r: "Há telas soldadas no lote?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
    ],
    padrao: { categoria: "CA-50", diametro: "12.5", fornecimento: "barra", identif: "sim", plano: "2", planoAnt: "", resAnt: "todos", telas: "nao" },
    criterios: CRIT,
    refs: { reprova: "7.3.2", atende: "7.3.1", regra: "7.3" },
    extra: function (ctx) {
      var P = ctx.P, c = cat(P), iC = CATS.indexOf(c), rolo = P.fornecimento === "rolo", l;
      var r = avaliarExemplares(ctx);
      // lote (Tabela 1)
      var mmax = (TAB1[P.diametro] || [])[iC] * (rolo ? 2 : 1), mL = num(P.massaLote);
      l = A.linha({ id: "tab1", grupo: "Ensaios do lote (7.1.4; 7.3.1 a)", criterio: "Massa do lote", secao: "7.1.2, Tabela 1",
        exigido: ok(mmax) ? "≤ " + fmt(mmax, 1) + " t" + (rolo ? " (rolos: dobro)" : "") : "combinação categoria × diâmetro inexistente na Tabela 1",
        resultado: ok(mL) ? fmt(mL, 1) + " t" : "—" });
      if (!ok(mmax)) G.redefinir(l, "pendente", c + " não é fabricado no diâmetro " + String(P.diametro).replace(".", ",") + " mm (Tabela 1)");
      else if (!ok(mL)) G.redefinir(l, "pendente", "informe a massa do lote");
      else if (mL > mmax + 1e-9) G.redefinir(l, "pendente", "lote acima da massa máxima: repartir em lotes (7.1.2)");
      else l.motivo = "dentro da Tabela 1";
      ctx.linhas.push(l);
      // plano (Tabela 3) e nº de exemplares (Tabela 2)
      var exig = P.planoAnt ? TAB3[P.planoAnt][P.resAnt || "todos"] : 2, adot = +P.plano || 2;
      l = A.linha({ id: "plano", grupo: "Ensaios do lote (7.1.4; 7.3.1 a)", criterio: "Plano de amostragem", secao: "7.1.3, Tabelas 2 e 3",
        exigido: "Plano " + exig + (P.planoAnt ? " (anterior: Plano " + P.planoAnt + ", " + { todos: "todos aprovados", um: "um lote rejeitado", mais: "mais de um rejeitado" }[P.resAnt || "todos"] + ")" : " (5 primeiros lotes)"),
        resultado: "Plano " + adot });
      if (adot < exig) G.redefinir(l, "pendente", "plano adotado menos rigoroso que o exigido: Plano " + exig);
      else l.motivo = "plano adequado";
      ctx.linhas.push(l);
      var t2 = TAB2[adot], col = P.identif === "nao" ? 1 : 0, nIni = t2[0][col] * (rolo ? 2 : 1), nCon = t2[1][col] * (rolo ? 2 : 1);
      ctx.freqs.push(A.frequencia({ ensaio: "Exemplares — amostra inicial", metodo: "NBR ISO 6892 / NBR 6153", exigido: nIni, regra: "Plano " + adot + ", Tabela 2" + (rolo ? " (rolos: dobro)" : ""), realizado: r.ini }));
      if (r.fi) ctx.freqs.push(A.frequencia({ ensaio: "Exemplares — contraprova", metodo: "NBR ISO 6892 / NBR 6153", exigido: nCon, regra: "Plano " + adot + ", Tabela 2" + (rolo ? " (rolos: dobro)" : ""), realizado: r.con }));
      avaliarEmendas(ctx);
    },
    notas: "Critérios da DNIT 118/2009-ES. Lote por categoria e diâmetro com a massa máxima da Tabela 1 (rolos: o dobro); exemplares pela Tabela 2 (plano 2 nos 5 primeiros lotes; depois Tabela 3); 1 exemplar por barra, 2,20 m. Conformidade (7.3.1 a): sem defeitos, massa real = comprimento × área nominal × 7,85 kg/dm³ com ± 6 % (φ ≥ 10 mm) ou ± 10 % (φ < 10 mm) e tração e dobramento satisfatórios em todos os exemplares; havendo falha, contraprova única — aceita se toda satisfatória; não conforme se houver algum resultado insatisfatório na contraprova (7.3.2). Limites de tração da ABNT NBR 7480 (fy ≥ fyk; fst/fy ≥ 1,20 / 1,08 / 1,05; alongamento ≥ 18 / 8 / 5 % para CA-25 / 50 / 60). Emendas: 1 exemplar por conjunto de até 50; falha → duas contraprovas; σmáx ≥ resistência convencional das barras; alongamento A ≤ 0,1 + (σmáx/2)·φ·10⁻⁴ mm (7.2). Telas: NBR 7481; quebras ≤ 1 % por painel e < 50 % num único fio (7.3.1 c).",
    exemplos: [
      { nome: "CA-50 φ 12,5 mm, lote de 7,5 t, plano 2 — aceito", dados: function () {
        return { ident: { registro: "ACO-01", obra: "Obra A — ponte sobre o rio A", camada: "Armadura da laje — CA-50 φ 12,5", data: "2025-02-10" },
          params: { lote: "Partida 1 — lote 1", categoria: "CA-50", diametro: "12.5", fornecimento: "barra", identif: "sim", massaLote: "7,5", plano: "2", planoAnt: "", resAnt: "todos",
            nEmendas: "40", cobrimento: "40", telas: "nao" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, {}],
          compr: [{ est: "feixe 1", v: "12,03" }, { est: "feixe 2", v: "11,96" }],
          cobr: [{ est: "laje — bordo", v: "42" }, { est: "laje — vão", v: "45" }, { est: "viga V1", v: "41" }],
          ex: [{ id: "B1", am: "I", comp: "2,20", massa: "2,14", fy: "548", fst: "652", al: "12,5", dob: "S" },
            { id: "B2", am: "I", comp: "2,20", massa: "2,17", fy: "562", fst: "660", al: "11,0", dob: "S" }],
          em: [{ id: "luva L1", am: "I", smax: "655", A: "0,48" }] };
      } },
      { nome: "CA-60 φ 5 mm em rolos, massa fora e contraprova reprovada — rejeitado", dados: function () {
        return { ident: { registro: "ACO-02", obra: "Obra B — viaduto", camada: "Estribos — CA-60 φ 5", data: "2025-04-02" },
          params: { lote: "Partida 2 — lote 6", categoria: "CA-60", diametro: "5", fornecimento: "rolo", identif: "sim", massaLote: "4,2", plano: "1", planoAnt: "2", resAnt: "um", telas: "nao" },
          verificacoes: [{ atende: "S" }, { atende: "N", obs: "rolos sobre o solo" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, {}],
          ex: [{ id: "R1", am: "I", comp: "2,20", massa: "0,299", fy: "640", fst: "690", al: "6,0", dob: "S" },
            { id: "R2", am: "I", comp: "2,20", massa: "0,318", fy: "612", fst: "655", al: "5,5", dob: "S" },
            { id: "R1-c", am: "C", comp: "2,20", massa: "0,300", fy: "585", fst: "630", al: "5,0", dob: "S" },
            { id: "R3-c", am: "C", comp: "2,20", massa: "0,335", fy: "630", fst: "670", al: "6,0", dob: "S" }] };
      } },
    ],
  });
  G.registrar(F, ID, tabelasExtra);
})();
