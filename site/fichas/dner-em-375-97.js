/*
 * Ficha: DNER-EM 375/97 — Fios de aço para concreto protendido — recebimento do lote.
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 * Coerente com a ficha da DNIT 119/2009-ES (armaduras de protensão), que remete às normas de fios e cordoalhas.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dner-em-375-97.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var EPS = 1e-9;
  // Tabelas 1 e 2: categoria/diâmetro → [área (mm²), massa (kg/1000 m), LR mín. (MPa), σ1% RN, σ1% RB (MPa), alongamento total mín. (%)]
  var FIOS = [["150", 8, 50.3, 395, 1500, 1280, 1350, 6], ["160", 8, 50.3, 395, 1600, 1360, 1440, 5], ["150", 7, 38.5, 302, 1500, 1280, 1350, 6], ["160", 7, 38.5, 302, 1600, 1360, 1440, 5],
    ["150", 6, 28.3, 222, 1500, 1280, 1350, 6], ["160", 6, 28.3, 222, 1600, 1360, 1440, 5], ["150", 5, 19.6, 154, 1500, 1280, 1350, 6], ["160", 5, 19.6, 154, 1600, 1360, 1440, 5],
    ["160", 4, 12.6, 98.7, 1600, 1360, 1440, 5], ["170", 4, 12.6, 98.7, 1700, 1490, 1580, 5]];
  var DES = {};
  FIOS.forEach(function (f) { DES[f[0] + "-" + f[1]] = { cat: f[0], d: f[1], area: f[2], massa: f[3], lr: f[4], s1: { RN: f[5], RB: f[6] }, al: f[7] }; });
  var MANDRIL = { 8: 50, 7: 40, 6: 35, 5: 30, 4: 25 };            // Tabela 4 (mm)
  var ROLO = { 8: [1.8, 2.2], 7: [1.8, 2.2], 6: [1.8, 2.2], 5: [1.5, 1.8], 4: [1.2, 1.5] };  // Tabela 3 (m)
  var RELAX = { RN: { 70: 5, 80: 8.5 }, RB: { 70: 2, 80: 3 } };  // relaxação máx. após 1000 h a 20 °C (%)
  function des(P) { return DES[P.designacao] || DES["160-5"]; }
  function rel(P) { return P.relaxacao === "RB" ? "RB" : "RN"; }
  function nome(P) { var D = des(P); return "CP-" + D.cat + " " + rel(P) + " " + D.d; }
  var GD = "Documentação e inspeção (4.1; 6.1; 6.4.4)", GE = "Ensaios (5.2; 6.3; 6.4)";

  var CRIT = [
    { id: "cert", grupo: GD, texto: "Certificado do fabricante: data dos ensaios, lote com quantidade e numeração dos rolos, características dimensionais, mecânicas e químicas", secao: "6.1.1.2", tipo: "sim_nao" },
    { id: "etiq", grupo: GD, texto: "Etiqueta em cada rolo: produtor, nº da norma, categoria e relaxação, diâmetro e nº do rolo", secao: "4.1.6", tipo: "sim_nao", falha: "ressalva" },
    { id: "emendas", grupo: GD, texto: "Fio sem soldas nem emendas", secao: "4.1.4", tipo: "sim_nao" },
    { id: "oxid", grupo: GD, texto: "Oxidação no máximo superficial, leve e uniforme, sem pontos de corrosão", secao: "6.4.4; 6.4.5", tipo: "sim_nao" },
    { id: "lubr", grupo: GD, texto: "Superfície sem lubrificante, óleo ou outra substância prejudicial (salvo acordo)", secao: "6.4.5, nota 5", tipo: "sim_nao", falha: "ressalva" },
  ];

  function tabelasExtra() {
    return [{ chave: "cp", titulo: "Corpos de prova — tração (NBR 6349) e dobramento alternado (NBR 6004)", rotulo: "CP", iniciais: 2, min: 1,
      dica: "1 amostra de 2,00 m de uma extremidade de um rolo por grupo de 5 rolos (6.2.1); contraprova: 2 CP da mesma extremidade do mesmo rolo, \"Amostra\" = C",
      linhas: [{ k: "rolo", r: "Rolo nº", texto: true }, { k: "am", r: "Amostra (I / C)", texto: true },
        { k: "d", r: "Diâmetro medido", u: "mm" }, { k: "s1", r: "Tensão a 1 % de alongamento", u: "MPa" }, { k: "lr", r: "Limite de resistência à tração", u: "MPa" },
        { k: "al", r: "Alongamento após ruptura em 10d (total)", u: "%" }, { k: "alE", r: "Alongamento na zona de estricção (quando medido)", u: "%" },
        { k: "dob", r: "Dobramentos alternados sem fissura/ruptura", u: "nº" }, { k: "ent", r: "Profundidade do entalhe (fios entalhados)", u: "mm" },
        { k: "relx", r: "Relaxação após 1000 h (NBR 7484) — opcional", u: "%" }] }];
  }

  function extra(ctx) {
    var P = ctx.P, D = des(P), rl = rel(P), ent = P.acabamento === "entalhado", nDob = ent ? 2 : 3, s1 = D.s1[rl], nR = num(P.nRolos), l;
    var U = R.cols(ctx.d, "cp", ["d", "s1", "lr", "al", "alE", "dob", "ent"]).map(function (c, i) {
      var u = R.unidade(c, i, "CP");
      u.rot = (c.rolo ? "rolo " + String(c.rolo).trim() : "CP " + (i + 1)) + (u.contra ? " (C" + (i + 1) + ")" : "");
      R.conf(u, c.d, { rot: "diâmetro", min: D.d - 0.05, max: D.d + 0.05, casas: 2, un: "mm" });
      R.conf(u, c.s1, { rot: "tensão a 1 %", min: s1, casas: 0, un: "MPa" });
      R.conf(u, c.lr, { rot: "limite de resistência", min: D.lr, casas: 0, un: "MPa" });
      R.conf(u, c.al, { rot: "alongamento total", min: D.al, casas: 1, un: "%" });
      R.conf(u, c.alE, { rot: "alongamento na estricção", min: 2, casas: 1, un: "%", obrig: false });
      R.conf(u, c.dob, { rot: "dobramentos alternados (mandril " + MANDRIL[D.d] + " mm)", min: nDob, casas: 0 });
      if (ent) R.conf(u, c.ent, { rot: "entalhe", max: 0.035 * D.d, casas: 2, un: "mm", obrig: false });
      return u;
    });
    l = R.prova({ id: "cp", grupo: GE, criterio: "Tração e dobramento alternado — " + nome(P) + (ent ? " (entalhado)" : ""), secao: "5.1; 5.2; 6.3.1; 6.3.2; 6.4", unidades: U, porGrupo: true, rotGrupo: "rolo",
      exigido: "d " + D.d + " ± 0,05 mm; σ1% ≥ " + s1 + " MPa; LR ≥ " + D.lr + " MPa; alongamento ≥ " + D.al + " % (estricção ≥ 2 %); ≥ " + nDob + " dobramentos (mandril " + MANDRIL[D.d] + " mm)" +
        (ent ? "; entalhe ≤ 3,5 % d" : ""),
      txtPend: "retirar 2 CP adicionais da mesma extremidade do mesmo rolo (6.4.2)", txtNc: "rolo rejeitado; ensaiar um a um os demais rolos do lote e aceitar só os conformes (6.4.3)",
      txtContraOk: "lote aceito (6.4.3)", tituloUni: "Corpos de prova" });
    ctx.linhas.push(l);
    // relaxação (6.3.3; 6.4.6 — não condiciona a liberação)
    var pts = U.filter(function (u) { return ok(num(u.c.relx)); }).map(function (u) { return { v: num(u.c.relx), rot: u.rot }; });
    var tI = P.relTensao === "80" ? 80 : 70, rmax = RELAX[rl][tI];
    l = A.avaliar({ id: "relx", grupo: GE, criterio: "Relaxação após 1000 h a 20 °C, tensão inicial de " + tI + " % do LR mínimo", secao: "6.3.3; Tabelas 1 e 2", unid: "%", casas: 1, max: rmax, pontos: pts, individual: true });
    if (!pts.length) R.redef(l, "informativo", "não exigida para a liberação (6.4.6): o comprador pode basear-se em resultados recentes da mesma categoria");
    ctx.linhas.push(l);
    // diâmetro interno dos rolos (Tabela 3)
    var di = num(P.diamRolo), fx = ROLO[D.d];
    l = A.linha({ id: "rolo", grupo: GD, criterio: "Diâmetro interno dos rolos", secao: "4.1.5.1, Tabela 3", exigido: fmt(fx[0], 1) + " a " + fmt(fx[1], 1) + " m", resultado: ok(di) ? fmt(di, 2) + " m" : "—" });
    if (!ok(di)) R.redef(l, "informativo", "não medido");
    else if (di < fx[0] - EPS || di > fx[1] + EPS) A.marcar(l, "ressalva", "fora da faixa da Tabela 3 — verificar o acondicionamento");
    ctx.linhas.push(l);
    // amostragem: 1 amostra por grupo de 5 rolos (6.2.1); diagrama tensão-deformação por corrida (6.2.2)
    var ini = U.filter(function (u) { return !u.contra; });
    ctx.freqs.push(A.frequencia({ ensaio: "Amostras de tração e dobramento", metodo: "NBR 6349; NBR 6004", exigido: ok(nR) ? Math.max(1, Math.ceil(nR / 5 - EPS)) : NaN,
      regra: "1 amostra de 2,00 m de um rolo por grupo de 5 rolos ou fração (6.2.1)", realizado: ini.length }));
    var nC = num(P.nCorridas), nD = num(P.nDiag);
    if (ok(nC)) ctx.freqs.push(A.frequencia({ ensaio: "Diagrama tensão-deformação", metodo: "NBR 6349", exigido: nC, regra: "1 por corrida ou fração (6.2.2)", realizado: ok(nD) ? nD : 0 }));
  }

  var OPC = FIOS.map(function (f) { return [f[0] + "-" + f[1], "CP-" + f[0] + " — ø " + f[1] + " mm (LR ≥ " + f[4] + " MPa)"]; });
  R.criar({
    id: "dner-em-375-97",
    titulo: "Fios de aço para concreto protendido — recebimento do lote",
    resumo: "Recebimento de um lote de fios para protensão (DNER-EM 375/97), relaxação normal (Tabela 1) ou baixa (Tabela 2): certificado, etiqueta, ausência de emendas, oxidação e lubrificantes (4.1; 6.1; 6.4.4), diâmetro ± 0,05 mm, tensão a 1 % de alongamento, limite de resistência, alongamento após ruptura e dobramentos alternados (3, ou 2 nos entalhados) com o mandril da Tabela 4; amostragem de 1 amostra por 5 rolos (6.2.1) e contraprova de 2 CP do mesmo rolo, com rejeição do rolo e ensaio um a um dos demais (6.4.2; 6.4.3); relaxação informativa (6.4.6).",
    params: R.paramsLote({ phLote: "ex.: lote de 20 rolos — CP-160 RB 5" }).concat([
      { k: "designacao", r: "Categoria e diâmetro (Tabelas 1 e 2)", tipo: "select", opcoes: OPC },
      { k: "relaxacao", r: "Relaxação (4.1.2)", tipo: "select", opcoes: [["RN", "RN — relaxação normal (Tabela 1)"], ["RB", "RB — relaxação baixa (Tabela 2)"]] },
      { k: "acabamento", r: "Acabamento da superfície", tipo: "select", opcoes: [["liso", "Liso"], ["entalhado", "Entalhado (2 dobramentos; entalhe ≤ 3,5 % d)"]] },
      { k: "nRolos", r: "Rolos no lote (nº)" },
      { k: "nCorridas", r: "Corridas no lote (nº) — opcional" },
      { k: "nDiag", r: "Diagramas tensão-deformação obtidos (nº) — opcional" },
      { k: "diamRolo", r: "Diâmetro interno dos rolos medido (m) — opcional" },
      { k: "relTensao", r: "Tensão inicial do ensaio de relaxação", tipo: "select", opcoes: [["70", "70 % do LR mínimo"], ["80", "80 % do LR mínimo"]] },
    ]),
    padrao: { designacao: "160-5", relaxacao: "RB", acabamento: "liso", relTensao: "70" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    textos: { REJEITADO: { titulo: "LOTE NÃO ACEITO — ROLO(S) REJEITADO(S)", texto: "Falha também nos 2 CP adicionais (6.4.3): o rolo é rejeitado e os demais rolos do lote devem ser ensaiados um a um, aceitando-se só os que atendam às Tabelas 1 e 2 (ou há requisito de inspeção não atendido)." } },
    notas: "Critérios da DNER-EM 375/97. Tabelas 1 (RN) e 2 (RB): LR mín. 1500 / 1600 / 1700 MPa (CP-150 / 160 / 170); tensão a 1 % de alongamento ≥ 85 % (RN) ou 90 % (RB) do LR mínimo (1280 / 1360 / 1490 e 1350 / 1440 / 1580 MPa); alongamento após ruptura em 10d ≥ 6 % (CP-150) ou 5 % (CP-160 e 170), na zona de estricção ≥ 2 %; ≥ 3 dobramentos alternados (2 nos fios entalhados, entalhe ≤ 3,5 % d); tolerância no diâmetro ± 0,05 mm; relaxação após 1000 h a 20 °C ≤ 5 / 8,5 % (RN) e 2 / 3 % (RB) a 70 / 80 % do LR mínimo. Mandril (Tabela 4): 50 / 40 / 35 / 30 / 25 mm para d = 8 / 7 / 6 / 5 / 4 mm. Amostragem (6.2): 1 amostra de 2,00 m por grupo de 5 rolos, sem tensionamento nem aquecimento; diagrama tensão-deformação por corrida. Aceitação (6.4): todos os resultados atendendo; CP insatisfatório → 2 CP adicionais da mesma extremidade do mesmo rolo; ambos atendendo, lote aceito; falhando, rolo rejeitado e demais rolos ensaiados um a um. Relaxação não condiciona a liberação (6.4.6).",
    exemplos: [
      { nome: "CP-160 RB 5, lote de 20 rolos — aceito após contraprova de um rolo", dados: function () {
        return { ident: { registro: "FIO-01", obra: "Obra A — vigas protendidas", data: "2026-02-24", origem: "Fornecedor A", camada: "CP-160 RB 5" },
          params: { lote: "Lote 1 — 20 rolos", fornecedor: "Fornecedor A", nf: "220145", certificado: "CQ-3310", dataEntrega: "24/02/2026", designacao: "160-5", relaxacao: "RB",
            acabamento: "liso", nRolos: "20", nCorridas: "2", nDiag: "2", diamRolo: "1,65", relTensao: "70" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          cp: [{ rolo: "3", d: "5,02", s1: "1512", lr: "1688", al: "5,8", dob: "4" }, { rolo: "8", d: "4,99", s1: "1498", lr: "1672", al: "5,4", dob: "4", relx: "1,6" },
            { rolo: "12", d: "5,01", s1: "1476", lr: "1651", al: "4,6", dob: "3" }, { rolo: "18", d: "5,03", s1: "1505", lr: "1690", al: "6,1", dob: "5" },
            { rolo: "12", am: "C", d: "5,01", s1: "1490", lr: "1660", al: "5,3", dob: "4" }, { rolo: "12", am: "C", d: "5,00", s1: "1482", lr: "1655", al: "5,1", dob: "4" }] };
      } },
      { nome: "CP-150 RN 7, lote de 10 rolos — falha na contraprova (rolo rejeitado, lote não aceito)", dados: function () {
        return { ident: { registro: "FIO-02", obra: "Obra B — dormentes protendidos", data: "2026-06-11", origem: "Fornecedor B", camada: "CP-150 RN 7" },
          params: { lote: "Lote 4 — 10 rolos", fornecedor: "Fornecedor B", nf: "5501", dataEntrega: "11/06/2026", designacao: "150-7", relaxacao: "RN", acabamento: "liso",
            nRolos: "10", relTensao: "70" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          cp: [{ rolo: "2", d: "7,03", s1: "1301", lr: "1532", al: "6,4", dob: "4" }, { rolo: "7", d: "6,97", s1: "1262", lr: "1488", al: "6,1", dob: "3" },
            { rolo: "7", am: "C", d: "6,98", s1: "1285", lr: "1506", al: "6,2", dob: "4" }, { rolo: "7", am: "C", d: "6,96", s1: "1270", lr: "1495", al: "5,8", dob: "3" }] };
      } },
    ],
  });
})();
