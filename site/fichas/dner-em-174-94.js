/*
 * Ficha: DNER-EM 174/94 — Mourões de concreto armado para cercas de arame farpado — recebimento do lote.
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dner-em-174-94.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var G = 9.80665, EPS = 1e-9;

  // 4.1 dimensões e 8.1 Tabela — resistência à flexão, limites mínimos (N): [engastado 1ª fissura, engastado ruptura, apoiado 1ª fissura, apoiado ruptura]
  var TIPO = {
    suporte: { nome: "Suporte", comp: 210, lado: 11, eng: 60, lim: [200, 300, 540, 810] },
    esticador: { nome: "Esticador", comp: 220, lado: 15, eng: 70, lim: [500, 700, 1350, 1890] },
    escora: { nome: "Escora", comp: 210, lado: 11, eng: 60, lim: [200, 300, 540, 810] },
  };
  function tipo(P) { return TIPO[P.tipo] || TIPO.suporte; }
  var GD = "Inspeção (4; 5)", GE = "Ensaios (7; 8)";

  var CRIT = [
    { id: "visual", grupo: GD, texto: "Inspeção visual de todos os mourões: retos, arestas abauladas/chanfradas, furos, concreto sem fissuras, falhas, saliências, pintura ou reparos", secao: "4.1 a 4.4; 5",
      tipo: "sim_nao", falha: "ressalva", exigido: "rejeitar os mourões que não atendam — informe inspecionados e recusados" },
    { id: "furos", grupo: GD, texto: "Quantidade e espaçamento dos furos conforme a ordem de compra", secao: "4.3.2", tipo: "sim_nao", falha: "ressalva" },
  ];

  function tabelasExtra() {
    return [
      { chave: "dim", titulo: "Verificação dimensional — amostra representativa de cada tipo (5; 4.2; 4.3; 4.5)", rotulo: "Mourão", iniciais: 2, min: 1,
        dica: "comprimento e lado obrigatórios; arestas, furos, armadura e cobrimento quando medidos (os três últimos, nas peças rompidas)",
        linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "comp", r: "Comprimento", u: "cm" }, { k: "lado", r: "Lado da seção (maior desvio)", u: "cm" },
          { k: "aresta", r: "Raio do abaulamento / face do chanfro", u: "cm" }, { k: "furo", r: "Diâmetro dos furos", u: "cm" },
          { k: "arm", r: "Menor diâmetro de barra (longitudinal / estribo)", u: "cm" }, { k: "estr", r: "Maior espaçamento dos estribos", u: "cm" },
          { k: "cob", r: "Menor cobrimento das armaduras", u: "cm" }] },
      { chave: "ens", titulo: "Ensaios de flexão e absorção (7.1; 7.2; 8)", rotulo: "Mourão", iniciais: 4, min: 1,
        dica: "uma coluna por mourão ensaiado; E = engastado (7.1.1), A = apoiado a 200 cm (7.1.2); carga em N ou, no ensaio com areia (7.1.3), as massas dos recipientes (kg × 9,80665)",
        linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "modo", r: "Ensaio (E = engastado / A = apoiado)", texto: true },
          { k: "p1", r: "Carga na 1ª fissura", u: "N" }, { k: "pr", r: "Carga de ruptura", u: "N" },
          { k: "m1", r: "ou: massa do 1º recipiente na 1ª fissura", u: "kg" }, { k: "m2", r: "ou: massa dos dois recipientes na ruptura", u: "kg" },
          { k: "abs", r: "Absorção de água (amostra do mourão rompido)", u: "%" }] },
    ];
  }

  function extra(ctx) {
    var P = ctx.P, T = tipo(P), N = num(P.tamLote), lim = T.lim;
    // dimensional (5): tolerância ± 2 cm no comprimento e ± 0,5 cm na seção
    var dim = R.cols(ctx.d, "dim", ["comp", "lado", "aresta", "furo", "arm", "estr", "cob"]).map(function (c, i) {
      var u = R.unidade(c, i, "mourão");
      R.conf(u, c.comp, { rot: "comprimento", min: T.comp - 2, max: T.comp + 2, casas: 1, un: "cm" });
      R.conf(u, c.lado, { rot: "lado", min: T.lado - 0.5, max: T.lado + 0.5, casas: 1, un: "cm" });
      R.conf(u, c.aresta, { rot: "abaulamento/chanfro", min: 0.3, max: 0.7, casas: 1, un: "cm", obrig: false });
      R.conf(u, c.furo, { rot: "furo", min: 0.4, max: 0.6, casas: 1, un: "cm", obrig: false });
      R.conf(u, c.arm, { rot: "diâmetro de barra", min: 0.4, casas: 2, un: "cm", obrig: false });
      R.conf(u, c.estr, { rot: "espaçamento dos estribos", max: 15, casas: 1, un: "cm", obrig: false });
      R.conf(u, c.cob, { rot: "cobrimento", min: 1.2, casas: 1, un: "cm", obrig: false });
      return u;
    });
    var dRuins = dim.filter(function (u) { return u.falhas.length; });
    var l = A.linha({ id: "dim", grupo: GD, criterio: "Dimensões — mourão " + T.nome.toLowerCase() + " (" + T.comp + " × " + T.lado + " cm)", secao: "4.1 a 4.5; 5", n: dim.length,
      exigido: "comprimento " + T.comp + " ± 2 cm; lado " + T.lado + " ± 0,5 cm; arestas 0,5 ± 0,2 cm; furos 0,5 ± 0,1 cm; barras ≥ 0,4 cm; estribos ≤ 15 cm; cobrimento ≥ 1,2 cm",
      resultado: dim.length ? (dim.length - dRuins.length) + " de " + dim.length + " atendem" : "—" });
    l.unidades = dim; l.tituloUni = "Verificação dimensional";
    if (!dim.length) R.redef(l, "sem_dados", "nenhum mourão medido (5: número representativo de cada tipo)");
    else if (dRuins.length) A.marcar(l, "ressalva", "mourões recusados na inspeção (5) — " + R.lista(dRuins));
    var inc = dim.filter(function (u) { return u.faltas.length && !u.falhas.length; });
    if (inc.length) A.marcar(l, "pendente", "dados incompletos — " + inc.map(function (u) { return u.rot + ": falta " + u.faltas.join(", "); }).join("; "));
    ctx.linhas.push(l);

    // 9.1 — recusa de 20 % ou mais dos mourões do lote
    var vis = (ctx.d.verificacoes || [])[0] || {}, recV = num(vis.nc), insp = num(vis.real);
    var rec = (ok(recV) ? recV : 0) + dRuins.length, base = ok(N) ? N : insp;
    var pct = ok(base) && base > 0 ? rec / base * 100 : NaN;
    l = A.linha({ id: "recusa", grupo: GD, criterio: "Mourões recusados na inspeção (visual + dimensional)", secao: "9.1", exigido: "< 20 % do lote",
      resultado: ok(pct) ? rec + " de " + base + " (" + fmt(pct, 1) + " %)" : rec + " recusado(s)" });
    if (!ok(pct)) A.marcar(l, "pendente", "informe o tamanho do lote (ou os mourões inspecionados)");
    else if (pct >= 20 - EPS) A.marcar(l, "nao_conforme", "recusa ≥ 20 %: o lote pode ser rejeitado total ou parcialmente (9.1), independentemente dos ensaios; o fornecedor pode reapresentar parte após seleção (9.1.1)");
    else if (rec) A.marcar(l, "ressalva", rec + " mourão(ões) recusado(s) — separar e substituir");
    ctx.linhas.push(l);

    // 7 e 8 — flexão (sem contraprova: 9.4) e absorção
    var ens = R.cols(ctx.d, "ens", ["p1", "pr", "m1", "m2", "abs", "modo"]);
    var carga = function (c, kN, km) { var p = num(c[kN]); if (!ok(p)) { var m = num(c[km]); p = ok(m) ? m * G : NaN; } return p; };
    var flex = { E: [], A: [] }, avisos = [];
    ens.forEach(function (c, i) {
      var modo = String(c.modo || "").trim().toUpperCase().charAt(0);
      var p1 = carga(c, "p1", "m1"), pr = carga(c, "pr", "m2");
      if (!ok(p1) && !ok(pr)) return;
      var u = R.unidade(c, i, "mourão");
      if (modo !== "E" && modo !== "A") { u.faltas.push("tipo de ensaio (E ou A)"); flex.E.push(u); return; }
      var j = modo === "E" ? 0 : 2;
      R.conf(u, p1, { rot: "1ª fissura", min: lim[j], casas: 0, un: "N" });
      R.conf(u, pr, { rot: "ruptura", min: lim[j + 1], casas: 0, un: "N" });
      if (ok(p1) && ok(pr) && pr < p1 - EPS) avisos.push(u.rot + ": carga de ruptura menor que a da 1ª fissura — confira.");
      flex[modo].push(u);
    });
    [["E", "Flexão com mourão engastado a " + T.eng + " cm, carga a 15 cm do topo", "7.1.1; 8.1", 0], ["A", "Flexão com mourão apoiado (vão de 200 cm, carga no centro)", "7.1.2; 8.1", 2]].forEach(function (x) {
      var ll = R.prova({ id: "flex" + x[0], grupo: GE, criterio: x[1], secao: x[2], unidades: flex[x[0]], semContra: true, rotU: "mourão(ões)",
        exigido: "1ª fissura ≥ " + lim[x[3]] + " N; ruptura ≥ " + lim[x[3] + 1] + " N (" + T.nome.toLowerCase() + ")", txtNc: "lote rejeitado (9.4)", tituloUni: x[1] });
      ctx.linhas.push(ll);
    });
    var pts = ens.filter(function (c) { return ok(num(c.abs)); }).map(function (c, i) { return { v: num(c.abs), rot: String(c.id || "").trim() || "amostra " + (i + 1) }; });
    l = A.avaliar({ id: "abs", grupo: GE, criterio: "Absorção de água do concreto (NBR 6124)", secao: "7.2; 8.2", unid: "%", casas: 1, max: 7, pontos: pts, individual: true });
    if (l.situacao === "nao_conforme") { l.motivo += " — lote rejeitado (9.4)"; l.motivos[0].texto = l.motivo; }
    ctx.linhas.push(l);

    // amostragem: 1 % do lote (6 b), no mínimo 2 peças por ensaio (4.6)
    var nEx = ok(N) ? Math.max(2, Math.ceil(N * 0.01 - EPS)) : 2, regra = "1 % do lote" + (ok(N) ? " (" + N + " mourões)" : "") + ", mín. 2 por ensaio (6 b; 4.6)";
    ctx.freqs.push(A.frequencia({ ensaio: "Flexão — engastado", metodo: "7.1.1", exigido: nEx, regra: regra, realizado: flex.E.length }));
    ctx.freqs.push(A.frequencia({ ensaio: "Flexão — apoiado", metodo: "7.1.2", exigido: nEx, regra: regra, realizado: flex.A.length }));
    ctx.freqs.push(A.frequencia({ ensaio: "Absorção de água", metodo: "NBR 6124 (MB-221)", exigido: nEx, regra: regra, realizado: pts.length }));
    if (ok(N) && N > 200 && !P.loteMaior) ctx.avisos.push("Lote de " + N + " mourões: a EM forma lotes de 200 unidades (6 a); lotes maiores só a juízo do comprador em grandes entregas.");
    avisos.forEach(function (a) { ctx.avisos.push(a); });
  }

  R.criar({
    id: "dner-em-174-94",
    titulo: "Mourões de concreto armado — recebimento do lote",
    resumo: "Recebimento de mourões de concreto armado para cercas (DNER-EM 174/94): inspeção visual de todos os mourões (4.1–4.4), verificação dimensional com tolerância de ± 2 cm no comprimento e ± 0,5 cm na seção (5), recusa de 20 % ou mais (9.1), flexão engastada e apoiada com as cargas mínimas de 1ª fissura e ruptura da Tabela 8.1 (carga em N ou pelas massas de areia, 7.1.3), absorção ≤ 7 % (8.2) e amostragem de 1 % do lote de 200 unidades, mín. 2 por ensaio (6; 4.6).",
    params: R.paramsLote({ phLote: "ex.: lote 2 — mourões de suporte" }).concat([
      { k: "tipo", r: "Tipo de mourão (3; 4.1)", tipo: "select", opcoes: Object.keys(TIPO).map(function (k) { var t = TIPO[k]; return [k, t.nome + " — " + t.comp + " cm, lado " + t.lado + " cm"]; }) },
      { k: "secao", r: "Seção transversal (4.1)", tipo: "select", opcoes: [["quadrada", "Quadrada"], ["triangular", "Triângulo equilátero"]] },
      { k: "tamLote", r: "Mourões no lote (nº; 200 por lote — 6 a)" },
      { k: "loteMaior", r: "Lote maior que 200 autorizado pelo comprador (grande entrega)?", tipo: "select", opcoes: [["", "Não"], ["sim", "Sim"]] },
    ]),
    padrao: { tipo: "suporte", secao: "quadrada", tamLote: "200", loteMaior: "" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    textos: { REJEITADO: { texto: "Recusa de 20 % ou mais na inspeção (9.1) ou resultado de ensaio fora da especificação (9.4): o lote é rejeitado; parte dele pode ser reapresentada após seleção adequada (9.1.1)." } },
    notas: "Critérios da DNER-EM 174/94. Tabela 8.1 (mínimos, N): suporte e escora — engastado 200 (1ª fissura) / 300 (ruptura), apoiado 540 / 810; esticador — engastado 500 / 700, apoiado 1350 / 1890. Carga pelas massas dos recipientes com areia: P = m × 9,80665 N (7.1.3). Absorção ≤ 7 % (8.2) em amostras dos mourões rompidos, fora das extremidades e das fissuras (7.2). Lotes de 200 mourões do mesmo tipo e seção (6 a); amostra de 1 % (6 b), no mínimo 2 peças por ensaio (4.6). Aceitação (9): recusa de 20 % ou mais na inspeção permite rejeitar o lote; todos os resultados atendendo, lote aceito; um ou mais fora, lote rejeitado (sem contraprova).",
    exemplos: [
      { nome: "Mourões de suporte, lote de 200 — aceito com ressalva (3 recusados na inspeção)", dados: function () {
        return { ident: { registro: "MCA-01", obra: "Obra A — cercas da faixa de domínio", data: "2026-05-12", origem: "Fornecedor A", camada: "Mourões de suporte" },
          params: { lote: "Lote 1 — suporte", fornecedor: "Fornecedor A", nf: "002231", dataEntrega: "12/05/2026", tipo: "suporte", secao: "quadrada", tamLote: "200" },
          verificacoes: [{ real: "200", nc: "3", obs: "3 com fissuras de desmoldagem" }, { atende: "S" }],
          dim: [{ id: "S-014", comp: "210,5", lado: "11,2", aresta: "0,5", furo: "0,5" }, { id: "S-087", comp: "209,0", lado: "10,8", aresta: "0,6", furo: "0,5" },
            { id: "S-151", comp: "211,0", lado: "11,1", aresta: "0,4", furo: "0,6", arm: "0,42", estr: "14", cob: "1,4" }],
          ens: [{ id: "S-021", modo: "E", m1: "23,5", m2: "34,8", abs: "5,8" }, { id: "S-102", modo: "E", p1: "245", pr: "352", abs: "6,1" },
            { id: "S-133", modo: "A", p1: "610", pr: "905", abs: "5,5" }, { id: "S-190", modo: "A", p1: "585", pr: "880" }] };
      } },
      { nome: "Mourões esticadores — rejeitado (recusa > 20 % e ruptura abaixo do mínimo)", dados: function () {
        return { ident: { registro: "MCA-02", obra: "Obra B — cercas", data: "2026-06-03", origem: "Fornecedor B", camada: "Mourões esticadores" },
          params: { lote: "Lote 4 — esticadores", fornecedor: "Fornecedor B", nf: "009911", dataEntrega: "03/06/2026", tipo: "esticador", secao: "quadrada", tamLote: "200" },
          verificacoes: [{ real: "200", nc: "40", obs: "fissuras, falhas de adensamento e reparos" }, { atende: "S" }],
          dim: [{ id: "E-03", comp: "220,5", lado: "15,2" }, { id: "E-40", comp: "217,0", lado: "14,3" }, { id: "E-77", comp: "221,0", lado: "15,1" }],
          ens: [{ id: "E-12", modo: "E", p1: "520", pr: "655", abs: "7,6" }, { id: "E-55", modo: "E", p1: "540", pr: "760", abs: "6,4" },
            { id: "E-91", modo: "A", p1: "1410", pr: "1950" }, { id: "E-120", modo: "A", p1: "1380", pr: "1905" }] };
      } },
    ],
  });
})();
