/*
 * Ficha: DNER-EM 376/97 — Cordoalhas de aço para concreto protendido — recebimento do lote.
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 * Aceitação por rolo/carretel (6.4.2 a 6.4.5): o rolo cuja contraprova falha é rejeitado; os demais são aceitos.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dner-em-376-97.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var EPS = 1e-9;
  // Tabelas 1 e 2 (7 fios): [categoria, d (mm), tol +, tol −, área (mm²), massa (kg/1000 m), carga de ruptura mín. (kN), carga a 1 % RN, RB (kN)]
  var SETE = [["175", 6.4, 0.3, 0.2, 24.5, 194, 43, 36.5, 38.7], ["175", 7.9, 0.3, 0.2, 37.4, 298, 65.8, 56, 59.2], ["175", 9.5, 0.3, 0.3, 52.3, 411, 92, 78.3, 82.8],
    ["175", 11, 0.3, 0.3, 71.0, 564, 124.9, 106.3, 112.4], ["175", 12.7, 0.3, 0.3, 94.2, 744, 165.7, 141, 149.1], ["175", 15.2, 0.3, 0.3, 138.7, 1100, 244.1, 207.6, 219.7],
    ["190", 9.5, 0.4, 0.2, 54.8, 432, 104.3, 88.7, 93.9], ["190", 11, 0.4, 0.2, 74.2, 582, 140.6, 119.5, 126.5], ["190", 12.7, 0.4, 0.2, 98.7, 775, 187.3, 159.2, 168.6],
    ["190", 15.2, 0.4, 0.2, 140.0, 1102, 265.8, 225.9, 239.2]];
  // Tabela 3 (2 e 3 fios, CP-180 RN): [n × d, área, massa, carga de ruptura, carga a 1 %]
  var DOIS = [["2x2.0", 6.3, 51, 11.35, 9.65], ["2x2.5", 9.8, 80, 17.65, 15], ["2x3.0", 14.1, 114, 25.4, 21.6], ["2x3.5", 19.2, 155, 34.55, 29.35],
    ["3x2.0", 9.4, 76, 16.9, 14.35], ["3x2.5", 14.7, 119, 26.45, 22.5], ["3x3.0", 21.2, 172, 38.15, 32.45]];
  var DES = {}, OPC = [];
  SETE.forEach(function (s) {
    ["RN", "RB"].forEach(function (r) {
      var k = r + "-" + s[0] + "-" + s[1];
      DES[k] = { sete: true, rel: r, cat: s[0], d: s[1], tmais: s[2], tmenos: s[3], area: s[4], massa: s[5], pr: s[6], p1: r === "RN" ? s[7] : s[8],
        nome: "CP-" + s[0] + " " + r + " " + fmt(s[1], s[1] % 1 ? 1 : 0) };
    });
  });
  DOIS.forEach(function (s) {
    var nd = s[0].split("x");
    DES["RN-180-" + s[0]] = { sete: false, rel: "RN", cat: "180", n: +nd[0], d: +nd[1], tmais: 0.3, tmenos: 0.3, area: s[1], massa: s[2], pr: s[3], p1: s[4],
      nome: "CP-180 RN " + nd[0] + " × " + fmt(+nd[1], 1) };
  });
  ["RN", "RB"].forEach(function (r) { SETE.forEach(function (s) { var k = r + "-" + s[0] + "-" + s[1]; OPC.push([k, DES[k].nome + " — 7 fios (Tabela " + (r === "RN" ? 1 : 2) + ")"]); }); });
  DOIS.forEach(function (s) { var k = "RN-180-" + s[0]; OPC.push([k, DES[k].nome + " — " + DES[k].n + " fios (Tabela 3)"]); });
  // relaxação máxima (%): Tabela 1 (RN) "após 100 h"; Tabela 2 (RB) "após 1000 h" — a 70 % / 80 % da carga de ruptura mínima
  var RELAX = { RN: { 70: 7, 80: 12, h: 100 }, RB: { 70: 2.5, 80: 3.5, h: 1000 } };
  function des(P) { return DES[P.designacao] || DES["RB-190-12.7"]; }
  var GD = "Documentação e inspeção (4.1; 6.1; 6.4.6)", GE = "Ensaios por rolo/carretel (4.1.7; 5; 6.3; 6.4)";

  var CRIT = [
    { id: "cert", grupo: GD, texto: "Certificado do fabricante: data dos ensaios, lote com quantidade e numeração dos rolos/carretéis, características dimensionais, mecânicas e químicas", secao: "6.1.1.2", tipo: "sim_nao" },
    { id: "etiq", grupo: GD, texto: "Etiqueta: produtor, nº da norma, nº de fios, categoria, relaxação, diâmetro, nº do rolo, massa líquida, comprimento e lances", secao: "4.1.11", tipo: "sim_nao", falha: "ressalva" },
    { id: "emendas", grupo: GD, texto: "Cordoalha sem emendas", secao: "4.1.8", tipo: "sim_nao" },
    { id: "acond", grupo: GD, texto: "Rolo com diâmetro interno ≥ 600 mm firmemente amarrado, ou carretel com núcleo ≥ 600 mm", secao: "4.1.9", tipo: "sim_nao", falha: "ressalva" },
    { id: "oxid", grupo: GD, texto: "Oxidação no máximo superficial, leve e uniforme, sem pontos de corrosão; sem lubrificante ou óleo (salvo acordo)", secao: "6.4.6; 6.4.7, nota 8", tipo: "sim_nao" },
  ];

  function tabelasExtra() {
    return [{ chave: "cp", titulo: "Corpos de prova — tração (NBR 6349), encordoamento e estricção", rotulo: "CP", iniciais: 3, min: 1,
      dica: "1 amostra da extremidade de cada rolo/carretel (6.2.1); contraprova: 2 CP da mesma extremidade do mesmo rolo, \"Amostra\" = C; estricção em 1 rolo por 10 (6.3.2)",
      linhas: [{ k: "rolo", r: "Rolo / carretel nº", texto: true }, { k: "am", r: "Amostra (I / C)", texto: true },
        { k: "d", r: "Diâmetro da cordoalha (fios, na de 2/3 fios)", u: "mm" }, { k: "ml", r: "Massa linear (para a área: A = m / 7,85)", u: "kg/1000 m" },
        { k: "p1", r: "Carga a 1 % de alongamento", u: "kN" }, { k: "pr", r: "Carga de ruptura", u: "kN" }, { k: "al", r: "Alongamento sob carga (base ≥ 600 mm)", u: "%" },
        { k: "E", r: "Módulo de elasticidade", u: "kN/mm²" }, { k: "estr", r: "Estricção nos fios (menor)", u: "%" },
        { k: "passo", r: "Passo da hélice (7 fios)", u: "mm" }, { k: "dc", r: "Diâmetro do fio central (7 fios)", u: "mm" }, { k: "de", r: "Diâmetro dos fios externos (7 fios)", u: "mm" },
        { k: "relx", r: "Relaxação (NBR 7484) — opcional", u: "%" }] }];
  }

  function extra(ctx) {
    var P = ctx.P, D = des(P), nR = num(P.nRolos), l;
    var U = R.cols(ctx.d, "cp", ["d", "ml", "p1", "pr", "al", "E", "estr", "passo", "dc", "de"]).map(function (c, i) {
      var u = R.unidade(c, i, "CP"), o = !u.contra;
      u.rot = (u.grupo ? "rolo " + u.grupo : "CP " + (i + 1)) + (u.contra ? " (C" + (i + 1) + ")" : "");
      R.conf(u, c.d, { rot: "diâmetro", min: D.d - D.tmenos, max: D.d + D.tmais, casas: 2, un: "mm", obrig: o });
      var ml = num(c.ml);
      if (ok(ml)) { u.area = ml / 7.85; R.conf(u, u.area, { rot: "área (m/7,85)", min: D.area, max: 1.08 * D.area, casas: 1, un: "mm²" }); }
      R.conf(u, c.p1, { rot: "carga a 1 %", min: D.p1, casas: 1, un: "kN" });
      R.conf(u, c.pr, { rot: "carga de ruptura", min: D.pr, casas: 1, un: "kN" });
      R.conf(u, c.al, { rot: "alongamento", min: 3.5, casas: 1, un: "%" });
      R.conf(u, c.E, { rot: "módulo E", min: 170, casas: 0, un: "kN/mm²", obrig: false });
      R.conf(u, c.estr, { rot: "estricção", min: 25, casas: 0, un: "%", obrig: false });
      if (D.sete) {
        R.conf(u, c.passo, { rot: "passo", min: 12 * D.d, max: 16 * D.d, casas: 0, un: "mm", obrig: false });
        var dc = num(c.dc), de = num(c.de);
        if (ok(dc) && ok(de) && dc < 1.02 * de - EPS) u.falhas.push("fio central " + fmt(dc, 2) + " mm < 1,02 × externo (" + fmt(1.02 * de, 2) + " mm)");
      }
      return u;
    });
    // por rolo: prova + 2 CP adicionais (6.4.2 a 6.4.5)
    var grupos = {}, ordem = [];
    U.forEach(function (u) { var g = u.grupo || "—"; if (!grupos[g]) { grupos[g] = []; ordem.push(g); } grupos[g].push(u); });
    var rej = [], pend = [], aceitosC = [];
    ordem.forEach(function (g) {
      var lg = R.prova({ criterio: "rolo " + g, unidades: grupos[g], nContra: 2, txtPend: "retirar 2 amostras adicionais da mesma extremidade do mesmo rolo (6.4.2)" });
      if (lg.situacao === "nao_conforme") rej.push("rolo " + g + " — " + lg.motivo);
      else if (lg.situacao === "pendente" || lg.situacao === "sem_dados") pend.push("rolo " + g + ": " + lg.motivo);
      else if (grupos[g].some(function (u) { return u.contra; })) aceitosC.push(g);
    });
    var ini = U.filter(function (u) { return !u.contra; });
    l = A.linha({ id: "cp", grupo: GE, criterio: "Tração, encordoamento e estricção — " + D.nome, secao: "4.1.7; 5.1; 5.2; 6.3; 6.4", n: U.length,
      exigido: "d " + fmt(D.d, 1) + " +" + fmt(D.tmais, 1) + "/−" + fmt(D.tmenos, 1) + " mm; área " + fmt(D.area, 1) + " a " + fmt(1.08 * D.area, 1) + " mm²; carga a 1 % ≥ " + fmt(D.p1, 1) +
        " kN; ruptura ≥ " + fmt(D.pr, 1) + " kN; alongamento ≥ 3,5 %; E ≥ 170 kN/mm²; estricção ≥ 25 %" + (D.sete ? "; passo 12 a 16 d; fio central ≥ 1,02 × externo" : ""),
      resultado: ordem.length + " rolo(s) ensaiado(s)" + (rej.length ? ", " + rej.length + " rejeitado(s)" : "") + (aceitosC.length ? ", " + aceitosC.length + " aceito(s) após contraprova" : "") });
    l.unidades = U; l.tituloUni = "Corpos de prova por rolo/carretel";
    if (!ini.length) R.redef(l, "sem_dados", "sem corpos de prova");
    else {
      if (rej.length) {
        var todos = ok(nR) && rej.length >= nR;
        A.marcar(l, todos ? "nao_conforme" : "ressalva", "rolo(s) rejeitado(s) (6.4.5) — separar e recusar; demais rolos aceitos: " + rej.join("; "));
      }
      pend.forEach(function (t) { A.marcar(l, "pendente", t); });
      if (aceitosC.length) l.motivo = (l.motivo ? l.motivo + "; " : "") + "rolo(s) " + aceitosC.join(", ") + " aceito(s) na contraprova (6.4.3)";
    }
    // estricção insatisfatória → determinar em todos os rolos remanescentes (6.4.4)
    var estr = ini.filter(function (u) { return ok(num(u.c.estr)); }), estrRuim = estr.filter(function (u) { return num(u.c.estr) < 25 - EPS; });
    if (estrRuim.length && ok(nR) && estr.length < nR) A.marcar(l, "pendente", "estricção insatisfatória: determiná-la em todos os rolos remanescentes (6.4.4) — " + estr.length + " de " + nR);
    ctx.linhas.push(l);
    // relaxação (6.3.3; 6.4.8 — não condiciona a liberação)
    if (D.sete) {
      var tI = P.relTensao === "80" ? 80 : 70, RX = RELAX[D.rel];
      var pts = U.filter(function (u) { return ok(num(u.c.relx)); }).map(function (u) { return { v: num(u.c.relx), rot: u.rot }; });
      l = A.avaliar({ id: "relx", grupo: GE, criterio: "Relaxação após " + RX.h + " h a 20 °C, carga inicial de " + tI + " % da ruptura mínima", secao: "6.3.3; Tabela " + (D.rel === "RN" ? 1 : 2),
        unid: "%", casas: 1, max: RX[tI], pontos: pts, individual: true });
      if (!pts.length) R.redef(l, "informativo", "não exigida para a liberação (6.4.8)");
      ctx.linhas.push(l);
    }
    ctx.freqs.push(A.frequencia({ ensaio: "Amostras de tração (uma por rolo/carretel)", metodo: "NBR 6349", exigido: nR, regra: "extremidade de cada rolo ou carretel (6.2.1)", realizado: ordem.length }));
    ctx.freqs.push(A.frequencia({ ensaio: "Estricção nos fios", metodo: "NBR 6349", exigido: ok(nR) ? Math.max(1, Math.ceil(nR / 10 - EPS)) : NaN, regra: "1 rolo por 10 ou fração (6.3.2)", realizado: estr.length }));
    var nG = num(P.nGraf);
    ctx.freqs.push(A.frequencia({ ensaio: "Gráfico carga-deformação", metodo: "NBR 6349", exigido: Math.max(1, Math.ceil(ini.length / 5 - EPS)), regra: "1 a cada 5 CP ou fração (6.3.1 b)", realizado: ok(nG) ? nG : 0 }));
  }

  R.criar({
    id: "dner-em-376-97",
    titulo: "Cordoalhas para concreto protendido — recebimento do lote",
    resumo: "Recebimento de cordoalhas de 7 fios (CP-175/190, RN ou RB — Tabelas 1 e 2) ou de 2 e 3 fios (CP-180 RN — Tabela 3) pela DNER-EM 376/97: documentação, etiqueta, emendas, acondicionamento e oxidação; por rolo/carretel — diâmetro e tolerância, área até 8 % acima da nominal (5.1.1), cargas a 1 % e de ruptura, alongamento ≥ 3,5 %, E ≥ 170 kN/mm², estricção ≥ 25 % (1 rolo por 10), passo de 12 a 16 d e fio central 2 % maior (4.1.7); contraprova de 2 CP do mesmo rolo e rejeição do rolo (6.4.2 a 6.4.5); relaxação informativa (6.4.8).",
    params: R.paramsLote({ phLote: "ex.: lote de 8 carretéis — CP-190 RB 12,7" }).concat([
      { k: "designacao", r: "Designação (Tabelas 1, 2 e 3)", tipo: "select", opcoes: OPC },
      { k: "nRolos", r: "Rolos/carretéis no lote (nº)" },
      { k: "nGraf", r: "Gráficos carga-deformação traçados (nº)" },
      { k: "relTensao", r: "Carga inicial do ensaio de relaxação", tipo: "select", opcoes: [["70", "70 % da carga de ruptura mínima"], ["80", "80 % da carga de ruptura mínima"]] },
    ]),
    padrao: { designacao: "RB-190-12.7", relTensao: "70" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    textos: { RESSALVA: { titulo: "LOTE ACEITO COM RESSALVA", texto: "Nenhum requisito do lote reprovado; há rolos/carretéis rejeitados individualmente (6.4.5), a separar e recusar, ou pontos a documentar." } },
    notas: "Critérios da DNER-EM 376/97. Cargas mínimas, áreas e tolerâncias das Tabelas 1 (7 fios RN), 2 (7 fios RB) e 3 (2 e 3 fios, CP-180 RN); carga a 1 % = 85 % (RN) ou 90 % (RB) da ruptura mínima; alongamento sob carga ≥ 3,5 % (base ≥ 600 mm); E ≥ 170 kN/mm² (notas 2 a 4); área ≤ 1,08 × nominal, a nominal considerada mínima (5.1.1) — calculada da massa linear: A (mm²) = m (kg/1000 m) / 7,85; passo 12 a 16 vezes o diâmetro nominal e fio central ≥ 2 % maior que os externos (4.1.7); estricção ≥ 25 % em 1 rolo por 10 (6.3.2). Amostra da extremidade de cada rolo/carretel (6.2.1); gráfico carga-deformação a cada 5 CP (6.3.1 b). CP insatisfatório → 2 amostras adicionais da mesma extremidade do mesmo rolo: atendendo, rolo aceito (6.4.3); falhando, rolo rejeitado (6.4.5); estricção insatisfatória → determinar em todos os rolos remanescentes (6.4.4). Relaxação (Tabela 1: após 100 h, 7 / 12 %; Tabela 2: após 1000 h, 2,5 / 3,5 %) não condiciona a liberação (6.4.8).",
    exemplos: [
      { nome: "CP-190 RB 12,7, 4 carretéis — aceito", dados: function () {
        return { ident: { registro: "COR-01", obra: "Obra A — ponte sobre o rio A", data: "2026-04-14", origem: "Fornecedor A", camada: "Cordoalhas CP-190 RB 12,7" },
          params: { lote: "Lote 1 — 4 carretéis", fornecedor: "Fornecedor A", nf: "301220", certificado: "CQ-9031", dataEntrega: "14/04/2026", designacao: "RB-190-12.7", nRolos: "4", nGraf: "1", relTensao: "80" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          cp: [{ rolo: "1", d: "12,78", ml: "781", p1: "181,2", pr: "199,6", al: "5,6", E: "198", estr: "38", passo: "188", dc: "4,40", de: "4,22", relx: "2,1" },
            { rolo: "2", d: "12,81", ml: "784", p1: "183,0", pr: "201,4", al: "5,9", E: "196" }, { rolo: "3", d: "12,75", ml: "779", p1: "179,8", pr: "198,2", al: "5,2", E: "199" },
            { rolo: "4", d: "12,79", ml: "783", p1: "180,5", pr: "200,1", al: "6,0", E: "197" }] };
      } },
      { nome: "CP-175 RN 9,5, 3 rolos — um rolo rejeitado após contraprova e outro aguardando contraprova", dados: function () {
        return { ident: { registro: "COR-02", obra: "Obra B — viaduto", data: "2026-07-02", origem: "Fornecedor B", camada: "Cordoalhas CP-175 RN 9,5" },
          params: { lote: "Lote 2 — 3 rolos", fornecedor: "Fornecedor B", nf: "44810", dataEntrega: "02/07/2026", designacao: "RN-175-9.5", nRolos: "3", nGraf: "1", relTensao: "70" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          cp: [{ rolo: "A1", d: "9,62", ml: "415", p1: "80,4", pr: "95,1", al: "4,8", E: "195", estr: "34", passo: "140", dc: "3,25", de: "3,15" },
            { rolo: "A2", d: "9,58", ml: "413", p1: "77,2", pr: "91,0", al: "3,9", E: "194" }, { rolo: "A3", d: "9,65", ml: "416", p1: "79,9", pr: "93,5", al: "3,2", E: "197" },
            { rolo: "A2", am: "C", d: "9,60", ml: "414", p1: "78,6", pr: "92,4", al: "4,1", E: "195" }, { rolo: "A2", am: "C", d: "9,59", ml: "413", p1: "77,8", pr: "91,6", al: "4,0", E: "196" }] };
      } },
    ],
  });
})();
