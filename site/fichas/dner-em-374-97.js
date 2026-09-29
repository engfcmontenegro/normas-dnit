/*
 * Ficha: DNER-EM 374/97 — Fios e barras de aço para concreto armado — recebimento do lote.
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 * Coerente com a ficha da DNIT 118/2009-ES (es-dnit-118-2009-es.js), mas com as Tabelas 1 a 4 PRÓPRIAS desta EM
 * (5 categorias CA-25 a CA-60; fst/fy de 1,20 / 1,20 / 1,10 / 1,10 / 1,05; planos 1, 2 e 3 com a contraprova da seção 6).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dner-em-374-97.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var EPS = 1e-9;
  var CATS = ["CA-25", "CA-32", "CA-40", "CA-50", "CA-60"];
  // Tabela 1 — massa máxima do lote (t): diâmetro → [CA-25, CA-32, CA-40, CA-50, CA-60]
  var TAB1 = { "3.2": [4, 3.2, 2.5, 2, 1.6], "4": [5, 4, 3.2, 2.5, 2], "5": [6.3, 5, 4, 3.2, 2.5], "6.3": [8, 6.3, 5, 4, 3.2], "8": [10, 8, 6.3, 5, 4],
    "10": [12.5, 10, 8, 6.3, 5], "12.5": [16, 12.5, 10, 8, 6.3], "16": [20, 16, 12.5, 10, NaN], "20": [25, 20, 16, 12.5, NaN], "25": [31.5, 25, 20, 16, NaN],
    "32": [40, 31.5, 25, 20, NaN], "40": [50, 40, 31.5, 25, NaN] };
  var DIAMS = ["3.2", "4", "5", "6.3", "8", "10", "12.5", "16", "20", "25", "32", "40"];
  // Tabela 2 — massa linear (kg/m): [−10 %, −6 %, exata, +6 %, +10 %]; fio/barra disponíveis
  var TAB2 = { "3.2": [NaN, 0.0586, 0.0624, 0.0661, NaN, "f"], "4": [NaN, 0.0929, 0.0988, 0.105, NaN, "f"], "5": [0.141, 0.147, 0.157, 0.166, 0.172, "fb"],
    "6.3": [0.223, 0.233, 0.248, 0.263, 0.273, "fb"], "8": [0.354, 0.370, 0.393, 0.417, 0.433, "fb"], "10": [NaN, 0.586, 0.624, 0.661, NaN, "fb"],
    "12.5": [NaN, 0.929, 0.988, 1.05, NaN, "fb"], "16": [NaN, 1.47, 1.57, 1.66, NaN, "b"], "20": [NaN, 2.33, 2.48, 2.63, NaN, "b"], "25": [NaN, 3.70, 3.93, 4.17, NaN, "b"],
    "32": [NaN, 5.86, 6.24, 6.61, NaN, "b"], "40": [NaN, 9.29, 9.88, 10.5, NaN, "b"] };
  // Tabela 3 — [fyk (MPa), fst/fy mín., alongamento classe A (%), classe B (%), pino φ < 20, pino φ ≥ 20 (× φ), cor]
  var TAB3 = { "CA-25": [250, 1.20, 18, NaN, 2, 4, "amarela"], "CA-32": [320, 1.20, 14, NaN, 2, 4, "verde"], "CA-40": [400, 1.10, 10, 8, 3, 5, "vermelha"],
    "CA-50": [500, 1.10, 8, 6, 4, 6, "branca"], "CA-60": [600, 1.05, NaN, 5, 5, NaN, "azul"] };
  // seção 6.2.3 — nº de exemplares [prova, contraprova]: [corridas identificadas, não identificadas]
  var PLANOS = { 1: [[1, 2], [2, 4]], 2: [[2, 2], [4, 4]], 3: [[4, 4], [4, 4]] };
  // Tabela 4 — plano a adotar: plano anterior × resultado
  var TAB4 = { 1: { todos: 1, um: 2, mais: 3 }, 2: { todos: 1, um: 3, mais: 3 }, 3: { todos: 2, um: 3, mais: 3 } };
  function cat(P) { return CATS.indexOf(P.categoria) >= 0 ? P.categoria : "CA-50"; }
  function dk(P) { return TAB2[P.diametro] ? P.diametro : "12.5"; }
  var GD = "Inspeção (4)", GL = "Lote e amostragem (3.3; 6.2)", GE = "Ensaios dos exemplares (5; 6.3)";

  var CRIT = [
    { id: "defeitos", grupo: GD, texto: "Barras e fios sem defeitos prejudiciais (fissuras, esfoliações, corrosão)", secao: "4.4", tipo: "sim_nao" },
    { id: "marca", grupo: GD, texto: "Marcação: relevo de laminação a cada 2 m (φ ≥ 10 com mossas) ou pintura de topo na cor da categoria; rolos com faixa pintada", secao: "4.7; Tabela 3", tipo: "sim_nao", falha: "ressalva" },
    { id: "etiq", grupo: GD, texto: "Etiqueta em cada feixe/rolo: fabricante, categoria, classe e diâmetro", secao: "4.8.2", tipo: "sim_nao", falha: "ressalva" },
    { id: "comp", grupo: GD, texto: "Comprimento 11 m ± 9 %; até 2 % de barras curtas, não menores que 6 m", secao: "4.6", tipo: "sim_nao", falha: "ressalva",
      se: function (P) { return P.fornecimento !== "rolo"; }, naoAplicaPor: "fornecimento em rolos" },
  ];

  function tabelasExtra() {
    return [{ chave: "ex", titulo: "Exemplares — massa linear, tração e dobramento (6.2.2; 5.1; 5.2)", rotulo: "Exemplar", iniciais: 2, min: 1,
      dica: "um exemplar por coluna (2,20 m, desprezada a ponta de 20 cm; um por barra/fio reto); \"Amostra\" em branco ou I = prova, C = contraprova",
      linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "am", r: "Amostra (I / C)", texto: true },
        { k: "comp", r: "Comprimento do exemplar", u: "m" }, { k: "massa", r: "Massa do exemplar", u: "kg" },
        { k: "fy", r: "Resistência de escoamento fy", u: "MPa" }, { k: "fst", r: "Resistência convencional à ruptura fst", u: "MPa" },
        { k: "al", r: "Alongamento em 10φ", u: "%" }, { k: "dob", r: "Dobramento a 180° sem ruptura nem fissura? (S / N)", texto: true }] }];
  }

  function extra(ctx) {
    var P = ctx.P, c = cat(P), iC = CATS.indexOf(c), D = dk(P), phi = num(D), T3 = TAB3[c], T2 = TAB2[D], rolo = P.fornecimento === "rolo";
    var classe = P.classe === "A" ? "A" : "B", fio = P.produto === "fio", est = P.estatistico === "sim", l;
    var alMin = classe === "A" ? T3[2] : T3[3];
    // tolerância de massa (4.5): barras φ < 10 → ± 10 %; demais barras e todos os fios → ± 6 %
    var dez = !fio && phi < 10, mMin = dez ? T2[0] : T2[1], mMax = dez ? T2[4] : T2[3];
    var pino = phi < 20 ? T3[4] : T3[5];
    // compatibilidade categoria × classe × produto × diâmetro
    l = A.linha({ id: "desig", grupo: GL, criterio: "Designação do lote", secao: "3.1; 3.2; 4.1; 4.2; Tabela 2", exigido: "categoria, classe, produto e diâmetro previstos na norma",
      resultado: c + " " + classe + " — " + (fio ? "fio" : "barra") + " φ " + D.replace(".", ",") + " mm" + (rolo ? " (rolos)" : "") });
    var inval = [];
    if (T2[5].indexOf(fio ? "f" : "b") < 0) inval.push((fio ? "fio" : "barra") + " de φ " + D.replace(".", ",") + " mm não padronizado (Tabela 2)");
    if (c === "CA-60" && !fio) inval.push("CA-60 aplica-se somente a fios (4.1.1, nota 2 a)");
    if (!ok(alMin)) inval.push(c + " não tem alongamento definido para a classe " + classe + " (Tabela 3)");
    if (!ok(TAB1[D][iC])) inval.push(c + " não tem lote definido para φ " + D.replace(".", ",") + " mm (Tabela 1)");
    if (inval.length) R.redef(l, "pendente", inval.join("; "));
    ctx.linhas.push(l);
    // massa do lote (Tabela 1; rolos: o dobro — 6.2.1.2)
    var mmax = TAB1[D][iC] * (rolo ? 2 : 1), mL = num(P.massaLote);
    l = A.linha({ id: "tab1", grupo: GL, criterio: "Massa do lote", secao: "3.3, Tabela 1; 6.2.1", exigido: ok(mmax) ? "≤ " + fmt(mmax, 1) + " t" + (rolo ? " (rolos: o dobro)" : "") : "—",
      resultado: ok(mL) ? fmt(mL, 2) + " t" : "—" });
    if (!ok(mmax)) R.redef(l, "pendente", "combinação categoria × diâmetro fora da Tabela 1");
    else if (!ok(mL)) R.redef(l, "pendente", "informe a massa do lote");
    else if (mL > mmax + EPS) R.redef(l, "pendente", "lote acima da massa máxima: repartir em lotes aproximadamente iguais (6.2.1.1)");
    ctx.linhas.push(l);
    // plano (6.2.3.4, Tabela 4)
    var exig = P.planoAnt ? TAB4[P.planoAnt][P.resAnt || "todos"] : 2, adot = +P.plano || 2;
    l = A.linha({ id: "plano", grupo: GL, criterio: "Plano de amostragem", secao: "6.2.3.4, Tabela 4", resultado: "Plano " + adot,
      exigido: "Plano " + exig + (P.planoAnt ? " (5 lotes anteriores: Plano " + P.planoAnt + ", " + { todos: "todos aprovados", um: "um lote rejeitado", mais: "mais de um rejeitado" }[P.resAnt || "todos"] + ")" : " (5 primeiros lotes do fornecimento)") });
    if (adot < exig) R.redef(l, "pendente", "plano adotado menos rigoroso que o exigido (Plano " + exig + ")");
    else if (adot > exig) l.motivo = "plano mais rigoroso que o exigido";
    ctx.linhas.push(l);
    var pl = PLANOS[adot][P.identif === "nao" ? 1 : 0], nIni = pl[0] * (rolo ? 2 : 1), nCon = pl[1] * (rolo ? 2 : 1);

    // exemplares
    var U = R.cols(ctx.d, "ex", ["comp", "massa", "fy", "fst", "al", "dob"]).map(function (x, i) {
      var u = R.unidade(x, i, "exemplar"), L = num(x.comp), M = num(x.massa);
      if (ok(L) && ok(M) && L > 0) { u.ml = M / L; R.conf(u, u.ml, { rot: "massa linear", min: mMin, max: mMax, casas: 3, un: "kg/m" }); }
      else u.faltas.push("comprimento e massa");
      u.fy = num(x.fy); u.fst = num(x.fst);
      if (!est) R.conf(u, u.fy, { rot: "fy", min: T3[0], casas: 0, un: "MPa" }); else if (!ok(u.fy)) u.faltas.push("fy");
      if (ok(u.fy) && ok(u.fst) && u.fy > 0) R.conf(u, u.fst / u.fy, { rot: "fst/fy", min: T3[1], casas: 2 }); else u.faltas.push("fst e fy");
      if (c === "CA-60") R.conf(u, u.fst, { rot: "fst", min: 660, casas: 0, un: "MPa", obrig: false });
      if (ok(alMin)) R.conf(u, x.al, { rot: "alongamento", min: alMin, casas: 1, un: "%" });
      R.confSN(u, x.dob, "dobramento (pino " + pino + "φ)");
      return u;
    });
    l = R.prova({ id: "ex", grupo: GE, criterio: "Massa linear, tração e dobramento — " + c + " " + classe + " φ " + D.replace(".", ",") + " mm", secao: "4.5; 5.1; 5.2; 6.3", unidades: U, nContra: nCon, rotU: "exemplar(es)",
      exigido: "massa " + fmt(mMin, 3) + " a " + fmt(mMax, 3) + " kg/m (± " + (dez ? 10 : 6) + " %)" + (est ? "" : "; fy ≥ " + T3[0] + " MPa") + "; fst/fy ≥ " + fmt(T3[1], 2) +
        (c === "CA-60" ? " e fst ≥ 660 MPa" : "") + (ok(alMin) ? "; alongamento ≥ " + alMin + " %" : "") + "; dobramento 180° no pino " + pino + "φ",
      txtPend: "contraprova única com novos exemplares (6.3.1 nota 8; " + "Plano " + adot + ")", txtNc: "lote rejeitado (6.3.2 b)", tituloUni: "Exemplares" });
    ctx.linhas.push(l);
    var ini = U.filter(function (u) { return !u.contra; }), fi = ini.filter(function (u) { return u.falhas.length; });
    ctx.freqs.push(A.frequencia({ ensaio: "Exemplares — prova", metodo: "NBR 6152; dobramento", exigido: est ? Math.max(8, Math.ceil(ini.length / 8) * 8) : nIni,
      regra: est ? "critério estatístico: múltiplo de 8 (6.2.4)" : "Plano " + adot + ", corridas " + (P.identif === "nao" ? "não " : "") + "identificadas" + (rolo ? " (rolos: o dobro)" : ""), realizado: ini.length }));
    if (fi.length) ctx.freqs.push(A.frequencia({ ensaio: "Exemplares — contraprova", metodo: "NBR 6152; dobramento", exigido: nCon, regra: "Plano " + adot + (rolo ? " (rolos: o dobro)" : ""),
      realizado: U.filter(function (u) { return u.contra; }).length }));

    // 6.2.4 — critério estatístico (acordo): valor característico = média do oitavo inferior
    if (est) {
      var fys = ini.map(function (u) { return u.fy; }).filter(ok).sort(function (a, b) { return a - b; }), n = fys.length, k = n / 8;
      l = A.linha({ id: "fyk", grupo: GE, criterio: "Resistência característica de escoamento estimada (critério estatístico)", secao: "6.2.4; 6.3.3", n: n, exigido: "fyk,est ≥ " + T3[0] + " MPa; n múltiplo de 8" });
      if (!n) R.redef(l, "sem_dados", "sem valores de fy");
      else if (n % 8) R.redef(l, "pendente", "n = " + n + " não é múltiplo de 8 (6.2.4)");
      else {
        var fyk = FE.media(fys.slice(0, k));
        l.resultado = "fyk,est = média dos " + k + " menores de " + n + " = " + fmt(fyk, 0) + " MPa";
        if (fyk < T3[0] - EPS) R.redef(l, "nao_conforme", "fyk,est " + fmt(fyk, 0) + " < " + T3[0] + " MPa — lote rejeitado ou, por acordo, reclassificado em outra categoria ou com fyk,est adotado na revisão do projeto (6.3.3)");
        else l.motivo = "fyk,est ≥ fyk da categoria";
      }
      ctx.linhas.push(l);
    }
  }

  R.criar({
    id: "dner-em-374-97",
    titulo: "Fios e barras de aço CA — recebimento do lote",
    resumo: "Recebimento de um lote de barras ou fios de aço para concreto armado (DNER-EM 374/97): designação (categorias CA-25 a CA-60, classes A e B), massa máxima do lote (Tabela 1; rolos: o dobro), plano de amostragem 1, 2 ou 3 (6.2.3; Tabela 4), massa linear por exemplar (Tabela 2: ± 6 %, ou ± 10 % em barras φ < 10), tração — fy ≥ fyk, fst/fy mínimo e alongamento da Tabela 3 — e dobramento a 180° no pino da categoria, contraprova única (6.3), inspeção de defeitos, marcação, etiqueta e comprimento (4.4 a 4.8) e o critério estatístico opcional do valor característico (6.2.4).",
    params: R.paramsLote({ phLote: "ex.: partida 2 — lote 3" }).concat([
      { k: "categoria", r: "Categoria (4.1.1)", tipo: "select", opcoes: CATS.map(function (x) { return [x, x + " (fyk " + TAB3[x][0] + " MPa; " + TAB3[x][6] + ")"]; }) },
      { k: "classe", r: "Classe (4.1.2)", tipo: "select", opcoes: [["A", "A — laminada a quente, com patamar"], ["B", "B — deformada a frio, sem patamar"]] },
      { k: "produto", r: "Produto (3.1; 3.2)", tipo: "select", opcoes: [["barra", "Barra"], ["fio", "Fio"]] },
      { k: "diametro", r: "Diâmetro nominal φ (Tabela 2)", tipo: "select", opcoes: DIAMS.map(function (k) { return [k, k.replace(".", ",") + " mm"]; }) },
      { k: "fornecimento", r: "Fornecimento (4.8.1)", tipo: "select", opcoes: [["reto", "Barras/fios retos (feixes)"], ["rolo", "Rolos (lote e amostra em dobro — 6.2.1.2)"]] },
      { k: "identif", r: "Corridas identificadas? (6.2.3)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "massaLote", r: "Massa do lote (t)" },
      { k: "plano", r: "Plano de amostragem adotado (6.2.3)", tipo: "select", opcoes: [["2", "Plano 2"], ["1", "Plano 1"], ["3", "Plano 3"]] },
      { k: "planoAnt", r: "Plano dos 5 lotes anteriores (Tabela 4)", tipo: "select", opcoes: [["", "Nenhum — 5 primeiros lotes (Plano 2)"], ["1", "Plano 1"], ["2", "Plano 2"], ["3", "Plano 3"]] },
      { k: "resAnt", r: "Resultado dos 5 lotes anteriores", tipo: "select", opcoes: [["todos", "Todos aprovados"], ["um", "Houve um lote rejeitado"], ["mais", "Mais de um lote rejeitado"]],
        se: function (d) { return !!(d.params || {}).planoAnt; } },
      { k: "estatistico", r: "Critério estatístico por acordo (6.2.4)?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim — fyk estimado (n múltiplo de 8)"]] },
    ]),
    padrao: { categoria: "CA-50", classe: "A", produto: "barra", diametro: "12.5", fornecimento: "reto", identif: "sim", plano: "2", planoAnt: "", resAnt: "todos", estatistico: "nao" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    textos: { REJEITADO: { texto: "Lote rejeitado (6.3.2): não atende às seções 4 e 5 ou houve resultado insatisfatório na contraprova. No critério estatístico (6.2.4), por acordo, o lote pode ser reclassificado ou ter o fyk estimado adotado na revisão do projeto (6.3.3)." } },
    notas: "Critérios da DNER-EM 374/97. Tabela 3: fyk 250 / 320 / 400 / 500 / 600 MPa; fst ≥ 1,20 / 1,20 / 1,10 / 1,10 / 1,05 fy em cada CP (CA-60: fst ≥ 660 MPa); alongamento em 10φ ≥ 18 / 14 / 10 / 8 % (classe A) e 8 / 6 / 5 % (classe B de CA-40, CA-50 e CA-60); dobramento a 180° sem ruptura nem fissura sobre pino de 2 / 2 / 3 / 4 / 5 φ (φ < 20) ou 4 / 4 / 5 / 6 φ (φ ≥ 20). Massa linear pela Tabela 2 (± 6 %; barras de φ < 10: ± 10 %). Planos (6.2.3): prova / contraprova de 1 / 2 (Plano 1, corridas identificadas), 2 / 4 (Plano 1, não identificadas), 2 / 2 e 4 / 4 (Plano 2), 4 / 4 (Plano 3); rolos: o dobro. Plano 2 nos 5 primeiros lotes; depois a Tabela 4. Aceitação (6.3): todos os exemplares satisfatórios; havendo falha, contraprova única — aceito se toda satisfatória. Critério estatístico (6.2.4, por acordo): fyk estimado = média do oitavo inferior de n (múltiplo de 8) valores de fy.",
    exemplos: [
      { nome: "CA-50 A, barra φ 12,5 mm, lote de 7,6 t, Plano 2 — aceito", dados: function () {
        return { ident: { registro: "ACO-EM-01", obra: "Obra A — bueiro celular", data: "2026-03-17", origem: "Fornecedor A", camada: "CA-50 φ 12,5" },
          params: { lote: "Partida 1 — lote 1", fornecedor: "Fornecedor A", nf: "118201", certificado: "Q-55012", dataEntrega: "17/03/2026", categoria: "CA-50", classe: "A", produto: "barra",
            diametro: "12.5", fornecimento: "reto", identif: "sim", massaLote: "7,6", plano: "2", planoAnt: "", resAnt: "todos", estatistico: "nao" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          ex: [{ id: "B-03", comp: "2,20", massa: "2,145", fy: "562", fst: "668", al: "12,5", dob: "S" }, { id: "B-11", comp: "2,20", massa: "2,168", fy: "548", fst: "651", al: "13,0", dob: "S" }] };
      } },
      { nome: "CA-60 B, fio φ 5 mm em rolos — massa e fst/fy falham na prova e na contraprova (rejeitado)", dados: function () {
        return { ident: { registro: "ACO-EM-02", obra: "Obra B — muro de arrimo", data: "2026-05-05", origem: "Fornecedor B", camada: "CA-60 φ 5" },
          params: { lote: "Partida 3 — lote 7", fornecedor: "Fornecedor B", nf: "77341", dataEntrega: "05/05/2026", categoria: "CA-60", classe: "B", produto: "fio", diametro: "5",
            fornecimento: "rolo", identif: "sim", massaLote: "4,4", plano: "1", planoAnt: "2", resAnt: "todos", estatistico: "nao" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}],
          ex: [{ id: "R-02", comp: "2,20", massa: "0,338", fy: "655", fst: "702", al: "6,0", dob: "S" }, { id: "R-09", comp: "2,20", massa: "0,318", fy: "642", fst: "668", al: "5,5", dob: "S" },
            { id: "R-02c", am: "C", comp: "2,20", massa: "0,340", fy: "661", fst: "701", al: "6,5", dob: "S" }, { id: "R-05c", am: "C", comp: "2,20", massa: "0,341", fy: "650", fst: "693", al: "6,0", dob: "S" },
            { id: "R-09c", am: "C", comp: "2,20", massa: "0,337", fy: "648", fst: "670", al: "5,0", dob: "S" }, { id: "R-12c", am: "C", comp: "2,20", massa: "0,339", fy: "659", fst: "702", al: "6,0", dob: "S" }] };
      } },
    ],
  });
})();
