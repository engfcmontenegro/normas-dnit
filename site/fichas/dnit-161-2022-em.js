/*
 * Ficha: DNIT 161/2022-EM — Geocompostos drenantes e geotêxteis não tecidos para drenagem — recebimento do lote.
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 * Amostragem por atributos (NBR 5426): Tabela 6 (visual e dimensional, S3) e Tabela 7 (destrutivos, S1);
 * propriedades hidráulicas e demais mecânicas pelos laudos (8.1 f a h — laudos externos com até 6 meses).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dnit-161-2022-em.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var EPS = 1e-9;
  var TAB6 = [[30, 130, 3, 3, 0, 2, 1, 2], [131, 500, 5, 5, 0, 3, 3, 4], [501, 2500, 8, 8, 1, 4, 4, 5], [2501, 10000, 13, 13, 2, 5, 6, 7]];
  var TAB7 = [[1, 500, 1, 0, 0, 1, NaN, NaN], [501, 2500, 3, 3, 0, 2, 1, 2], [2501, 10000, 5, 5, 0, 2, 1, 2]];
  // Tabela 3 — capacidade de fluxo no plano mínima (l/s·m) por pressão (kPa): [horizontal i = 0,01, vertical i = 1,00]
  var TAB3 = { 10: [0.49, 2.18], 20: [0.18, 1.67], 50: [0.08, 1.04], 100: [0.03, 0.32], 200: [0.02, 0.10] };
  var PROD = { gtp: "Geotêxtil não tecido — dreno profundo (Tabela 1)", gts: "Geotêxtil não tecido — dreno subsuperficial (Tabela 1)",
    gc: "Geocomposto drenante para trincheiras (Tabelas 2 e 3)", gcv: "Geocomposto drenante vertical (Tabelas 4 e 5)" };
  function prod(P) { return PROD[P.produto] ? P.produto : "gtp"; }
  function gt(P) { var p = prod(P); return p === "gtp" || p === "gts"; }
  function lerData(s) { var m = String(s || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : NaN; }
  var GD = "Documentação, identificação e armazenagem (4; 7; 9)", GV = "Exames visual e dimensional (Tabela 6)", GX = "Ensaios destrutivos de recebimento (8.1 d; Tabela 7)", GL = "Laudos das demais propriedades (8.1 f a h)";

  var CRIT = [
    { id: "mp", grupo: GD, texto: "Matéria-prima 100 % poliéster ou polipropileno; fibras/filamentos ligados por agulhagem, calor ou produtos químicos; sem reciclado de terceiros", secao: "4.1 a; 4.2.1 a, d", tipo: "sim_nao" },
    { id: "doc", grupo: GD, texto: "Documentos de acompanhamento encaminhados à Fiscalização; especificação e laudos do fabricante", secao: "7; 8.1 f; nota", tipo: "sim_nao", falha: "ressalva" },
    { id: "gc", grupo: GD, texto: "Filtros unidos ao núcleo por termofusão em todos os pontos de contato; fechamento lateral soldado (trincheiras)", secao: "4.2.3 a, c", tipo: "sim_nao",
      se: function (P) { return prod(P) === "gc"; }, naoAplicaPor: "não é geocomposto para trincheira" },
    { id: "arm", grupo: GD, texto: "Armazenagem afastada do piso, protegida do calor, da luz e das intempéries (DNIT 380-PRO)", secao: "9", tipo: "sim_nao", falha: "ressalva" },
  ];

  function tabelasExtra(d) {
    var P = d.params || {}, p = prod(P);
    var lx = [{ k: "id", r: "Rolo / bobina", texto: true }, { k: "am", r: "Amostra (1 / 2)", texto: true }];
    if (p === "gcv") lx.push({ k: "grab", r: "Resistência à tração GRAB (ASTM D4632)", u: "N" });
    else lx.push({ k: "tl", r: "Tração faixa larga — longitudinal (NBR ISO 10319)", u: "kN/m" }, { k: "tt", r: "Tração faixa larga — transversal", u: "kN/m" });
    lx.push({ k: "esp", r: "Espessura (NBR ISO 9863-1)", u: "mm" }, { k: "gram", r: "Gramatura (NBR ISO 9864)", u: "g/m²" });
    var ll = [{ k: "id", r: "Laudo nº / laboratório", texto: true }, { k: "data", r: "Data do laudo", texto: true, ph: "dd/mm/aaaa" }];
    if (gt(P)) ll.push({ k: "along", r: "Alongamento (NBR ISO 10319)", u: "%" }, { k: "punc", r: "Puncionamento (NBR ISO 12236)", u: "kN" }, { k: "perm", r: "Permeabilidade normal (NBR ISO 11058)", u: "cm/s" });
    if (p === "gc") ll.push({ k: "punc", r: "Puncionamento CBR (NBR ISO 12236)", u: "kN" }, { k: "fluxo", r: "Capacidade de fluxo no plano (ASTM D4716) na pressão/gradiente escolhidos", u: "l/s·m" });
    if (p === "gcv") ll.push({ k: "vz", r: "Vazão na vertical", u: "l/s" }, { k: "vz90", r: "Vazão dobrada a 90°", u: "l/s" }, { k: "trans", r: "Transmissividade", u: "×10⁻³ m²/s" },
      { k: "permF", r: "Permeabilidade normal do filtro (ASTM D4491)", u: "×10⁻⁴ m/s" }, { k: "o95", r: "Abertura aparente O95 do filtro", u: "µm" });
    return [{ chave: "vd", titulo: "Exames visual e dimensional — rolos da amostra (Tabela 6)", rotulo: "Rolo", iniciais: 3, min: 1,
      dica: "\"Amostra\" 1 ou 2 (2ª amostragem); dimensões comparadas com as declaradas na etiqueta",
      linhas: [{ k: "id", r: "Rolo / bobina", texto: true }, { k: "am", r: "Amostra (1 / 2)", texto: true },
        { k: "vis", r: "Embalagem íntegra, sem danos, rasgos ou contaminação? (S / N)", texto: true }, { k: "ident", r: "Identificação NBR ISO 10320 (fabricante, produto, lote, dimensões, gramatura; bordas marcadas ≤ 5 m)? (S / N)", texto: true },
        { k: "larg", r: "Largura medida", u: "m" }, { k: "comp", r: "Comprimento medido", u: "m" }] },
      { chave: "dx", titulo: "Ensaios destrutivos — rolos aprovados no visual/dimensional (Tabela 7)", rotulo: "Rolo", iniciais: 1, min: 1, dica: "\"Amostra\" 1 ou 2", linhas: lx },
      { chave: "lab", titulo: "Laudos — propriedades hidráulicas e mecânicas (Tabelas 1 a 5)", rotulo: "Laudo", iniciais: 1, min: 1,
        dica: "laudo do laboratório do fabricante ou laudo externo com até 6 meses (8.1 h)", linhas: ll }];
  }

  function extra(ctx) {
    var P = ctx.P, p = prod(P), N = num(P.tamLote), l;
    var lD = num(P.largDecl), cD = num(P.compDecl), eD = num(P.espDecl), gD = num(P.gramDecl);
    // visual e dimensional
    var vd = R.cols(ctx.d, "vd", ["vis", "ident", "larg", "comp"]).map(function (c, i) {
      var u = R.unidade(c, i, "rolo");
      R.confSN(u, c.vis, "embalagem/aspecto");
      R.confSN(u, c.ident, "identificação");
      if (ok(lD)) R.conf(u, c.larg, { rot: "largura", min: lD, casas: 2, un: "m", obrig: false });
      if (ok(cD)) R.conf(u, c.comp, { rot: "comprimento", min: cD, casas: 1, un: "m", obrig: false });
      return u;
    });
    var p6 = R.planoTab(TAB6, N);
    l = R.dupla({ id: "vd", grupo: GV, criterio: "Visual, identificação e dimensões dos rolos", secao: "7; 8.1 b; 8.2", plano: p6, unidades: vd, rotU: "rolo(s)", tituloUni: "Exames visual e dimensional",
      semPlano: ok(N) && N < 30 ? "lote com menos de 30 unidades: inspeção por entendimento com o fabricante e a Fiscalização (8.1 e)" : "informe o tamanho do lote (30 a 10 000 rolos — Tabela 6)" });
    l.exigido = "sem danos; identificação completa" + (ok(lD) ? "; largura ≥ " + fmt(lD, 2) + " m" : "") + (ok(cD) ? "; comprimento ≥ " + fmt(cD, 0) + " m" : "") + " — " + R.txtPlano(p6);
    ctx.linhas.push(l);
    ctx.freqs.push(R.freqDupla(l, "Exames visual e dimensional", "Tabela 6 (NBR 5426, S3)"));
    // destrutivos: tração, espessura e gramatura
    var trMin = p === "gtp" ? [12, 12] : p === "gts" ? [8, 8] : [9, 6];
    var eMin = p === "gc" || p === "gcv" ? 5 : NaN, gMin = p === "gcv" ? 80 : NaN;
    var dx = R.cols(ctx.d, "dx", ["tl", "tt", "grab", "esp", "gram"]).map(function (c, i) {
      var u = R.unidade(c, i, "rolo");
      if (p === "gcv") R.conf(u, c.grab, { rot: "tração GRAB", min: 1300, casas: 0, un: "N" });
      else { R.conf(u, c.tl, { rot: "tração longitudinal", min: trMin[0], casas: 1, un: "kN/m" }); R.conf(u, c.tt, { rot: "tração transversal", min: trMin[1], casas: 1, un: "kN/m" }); }
      var em = Math.max(ok(eMin) ? eMin : -Infinity, ok(eD) ? eD : -Infinity), gm = Math.max(ok(gMin) ? gMin : -Infinity, ok(gD) ? gD : -Infinity);
      R.conf(u, c.esp, { rot: "espessura", min: isFinite(em) ? em : NaN, casas: 1, un: "mm" });
      R.conf(u, c.gram, { rot: "gramatura", min: isFinite(gm) ? gm : NaN, casas: 0, un: "g/m²" });
      return u;
    });
    var p7 = R.planoTab(TAB7, N);
    l = R.dupla({ id: "dx", grupo: GX, criterio: "Tração, espessura e gramatura", secao: "8.1 d; Tabelas 1, 2 e 4", plano: p7, unidades: dx, rotU: "rolo(s)", tituloUni: "Ensaios destrutivos",
      semPlano: "informe o tamanho do lote (Tabela 7)" });
    l.exigido = (p === "gcv" ? "GRAB ≥ 1300 N" : "tração ≥ " + trMin[0] + (trMin[1] !== trMin[0] ? " (long.) / " + trMin[1] + " (transv.)" : "") + " kN/m na direção de menor resistência") +
      "; espessura ≥ " + (ok(eMin) ? fmt(eMin, 1) + " mm" : "") + (ok(eD) ? (ok(eMin) ? " e " : "") + "declarada " + fmt(eD, 1) + " mm" : ok(eMin) ? "" : "declarada") +
      "; gramatura ≥ " + (ok(gMin) ? gMin + " g/m²" : "") + (ok(gD) ? (ok(gMin) ? " e " : "") + "declarada " + fmt(gD, 0) + " g/m²" : ok(gMin) ? "" : "declarada") + " — " + R.txtPlano(p7);
    if (gt(P) && (!ok(eD) || !ok(gD))) A.marcar(l, "pendente", "informe a espessura e a gramatura declaradas pelo fabricante (a EM não fixa mínimo para o geotêxtil — 8.1 h)");
    ctx.linhas.push(l);
    ctx.freqs.push(R.freqDupla(l, "Ensaios destrutivos", "Tabela 7 (NBR 5426, S1)"));
    // laudos
    var pr = +P.pressao || 20, dir = P.direcao === "v" ? 1 : 0, fMin = (TAB3[pr] || TAB3[20])[dir], dEnt = lerData(P.dataEntrega);
    var lab = R.cols(ctx.d, "lab", ["along", "punc", "perm", "fluxo", "vz", "vz90", "trans", "permF", "o95"]);
    var reqs = gt(P) ? [["along", "alongamento", { min: 30, minEstrito: true, casas: 0, un: "%" }], ["punc", "puncionamento", { min: p === "gtp" ? 2.3 : 1.5, minEstrito: true, casas: 1, un: "kN" }],
      ["perm", "permeabilidade normal", { min: 0.30, casas: 2, un: "cm/s" }]]
      : p === "gc" ? [["punc", "puncionamento CBR", { min: 1.2, casas: 1, un: "kN" }], ["fluxo", "capacidade de fluxo (" + pr + " kPa, i = " + (dir ? "1,00" : "0,01") + ")", { min: fMin, casas: 2, un: "l/s·m" }]]
      : [["vz", "vazão vertical", { min: 0.17, casas: 2, un: "l/s" }], ["vz90", "vazão dobrada a 90°", { min: 0.14, casas: 2, un: "l/s" }], ["trans", "transmissividade", { min: 2.0, casas: 2, un: "×10⁻³ m²/s" }],
        ["permF", "permeabilidade do filtro", { min: 15, casas: 1, un: "×10⁻⁴ m/s" }], ["o95", "O95 do filtro", { max: 75, maxEstrito: true, casas: 0, un: "µm" }]];
    var U = lab.map(function (c, i) {
      var u = R.unidade(c, i, "laudo");
      reqs.forEach(function (q) { if (ok(num(c[q[0]]))) { var o = {}; Object.keys(q[2]).forEach(function (k) { o[k] = q[2][k]; }); o.rot = q[1]; R.conf(u, c[q[0]], o); } });
      var dt = lerData(c.data);
      if (ok(dt) && ok(dEnt) && (dEnt - dt) / 86400000 > 183) u.falhas.push("laudo com mais de 6 meses na entrega (8.1 h)");
      return u;
    });
    var faltam = reqs.filter(function (q) { return !lab.some(function (c) { return ok(num(c[q[0]])); }); }).map(function (q) { return q[1]; });
    var ruins = U.filter(function (u) { return u.falhas.length; });
    l = A.linha({ id: "lab", grupo: GL, criterio: "Propriedades por laudo — " + PROD[p].replace(/ \(.*\)$/, ""), secao: gt(P) ? "4.1; Tabela 1" : p === "gc" ? "4.2.3; Tabelas 2 e 3" : "4.3; Tabelas 4 e 5", n: U.length,
      exigido: reqs.map(function (q) { return q[1] + " " + R.lim(q[2]); }).join("; ") + "; laudo externo ≤ 6 meses",
      resultado: U.length ? U.length + " laudo(s)" + (ruins.length ? ", " + ruins.length + " com não conformidade" : "") : "—" });
    l.unidades = U; l.tituloUni = "Laudos";
    if (ruins.length) A.marcar(l, "nao_conforme", R.lista(ruins));
    if (faltam.length) A.marcar(l, "ressalva", "não apresentado(s): " + faltam.join(", ") + " — exigir laudo");
    ctx.linhas.push(l);
    if (ok(N) && N > 10000) ctx.avisos.push("Lote acima de 10 000 rolos: fora das Tabelas 6 e 7.");
    if (ok(N) && N < 30) ctx.avisos.push("Lote com menos de 30 unidades: a Tabela 7 cobre 1 a 500, mas a inspeção de lotes < 30 depende de entendimento prévio (8.1 e).");
  }

  R.criar({
    id: "dnit-161-2022-em",
    titulo: "Geotêxteis e geocompostos drenantes — recebimento do lote",
    resumo: "Recebimento de geotêxteis não tecidos (dreno profundo ou subsuperficial) e geocompostos drenantes (trincheiras ou verticais) pela DNIT 161/2022-EM: matéria-prima, documentos, termofusão e fechamento lateral, armazenagem; exames visual e de identificação dos rolos (Tabela 6, amostragem dupla); tração faixa larga (ou GRAB), espessura e gramatura (8.1 d; Tabela 7) contra as Tabelas 1, 2 e 4 e os valores declarados; laudos de alongamento, puncionamento, permeabilidade, capacidade de fluxo (Tabela 3), vazões, transmissividade e O95 (Tabelas 1 a 5), com laudos externos de até 6 meses.",
    params: R.paramsLote({ phLote: "ex.: lote de fabricação 2026-14" }).concat([
      { k: "produto", r: "Produto e aplicação", tipo: "select", recarrega: true, opcoes: Object.keys(PROD).map(function (k) { return [k, PROD[k]]; }) },
      { k: "tamLote", r: "Tamanho do lote (rolos)" },
      { k: "largDecl", r: "Largura declarada (m)" }, { k: "compDecl", r: "Comprimento declarado do rolo (m)" },
      { k: "espDecl", r: "Espessura declarada pelo fabricante (mm)" }, { k: "gramDecl", r: "Gramatura declarada pelo fabricante (g/m²)" },
      { k: "pressao", r: "Pressão do ensaio de capacidade de fluxo (Tabela 3)", tipo: "select", opcoes: [["10", "10 kPa"], ["20", "20 kPa"], ["50", "50 kPa"], ["100", "100 kPa"], ["200", "200 kPa"]],
        se: function (d) { return prod(d.params || {}) === "gc"; } },
      { k: "direcao", r: "Drenagem (Tabela 3)", tipo: "select", opcoes: [["h", "Horizontal — i = 0,01"], ["v", "Vertical — i = 1,00"]], se: function (d) { return prod(d.params || {}) === "gc"; } },
    ]),
    padrao: { produto: "gtp", pressao: "20", direcao: "h" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    notas: "Critérios da DNIT 161/2022-EM. Tabela 1 (geotêxtil, direção de menor resistência): tração ≥ 12 kN/m (dreno profundo) ou ≥ 8 kN/m (subsuperficial); alongamento > 30 %; puncionamento > 2,3 / > 1,5 kN; permeabilidade normal ≥ 0,30 cm/s. Tabela 2 (geocomposto): tração faixa larga ≥ 9 kN/m (longitudinal) e ≥ 6 kN/m (transversal); puncionamento CBR ≥ 1,2 kN; espessura ≥ 5 mm. Tabela 3: capacidade de fluxo no plano mínima (l/s·m) — 10 / 20 / 50 / 100 / 200 kPa: 0,49 / 0,18 / 0,08 / 0,03 / 0,02 (horizontal, i = 0,01) e 2,18 / 1,67 / 1,04 / 0,32 / 0,10 (vertical, i = 1,00). Tabelas 4 e 5 (geocomposto vertical): vazão vertical ≥ 0,17 l/s; dobrada a 90° ≥ 0,14 l/s; transmissividade ≥ 2,00 × 10⁻³ m²/s; espessura ≥ 5,0 mm; gramatura ≥ 80 g/m²; GRAB ≥ 1300 N; permeabilidade do filtro ≥ 15 × 10⁻⁴ m/s; O95 < 75 µm. Recebimento (8.1 d): tração, espessura e gramatura nos rolos da Tabela 7; demais propriedades por laudos (8.1 f a h). Amostragem dupla (8.2): defeituosos ≤ Ac → aceito; ≥ Re → rejeitado; entre os dois → 2ª amostra, acumulando.",
    exemplos: [
      { nome: "Geotêxtil não tecido para dreno profundo, lote de 150 rolos — aceito", dados: function () {
        return { ident: { registro: "GEO-01", obra: "Obra A — drenos profundos", data: "2026-05-06", origem: "Fornecedor A", camada: "Geotêxtil não tecido 300 g/m²" },
          params: { lote: "Lote de fabricação 2026-14", fornecedor: "Fornecedor A", nf: "61220", certificado: "CQ-1414", dataEntrega: "06/05/2026", produto: "gtp", tamLote: "150",
            largDecl: "2,30", compDecl: "100", espDecl: "2,5", gramDecl: "300" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}, { atende: "S" }],
          vd: [{ id: "R-007", am: "1", vis: "S", ident: "S", larg: "2,31", comp: "100,4" }, { id: "R-052", am: "1", vis: "S", ident: "S", larg: "2,30", comp: "100,2" },
            { id: "R-088", am: "1", vis: "S", ident: "S", larg: "2,32" }, { id: "R-120", am: "1", vis: "S", ident: "S", larg: "2,30" }, { id: "R-149", am: "1", vis: "S", ident: "S", larg: "2,31" }],
          dx: [{ id: "R-088", am: "1", tl: "17,8", tt: "15,6", esp: "2,7", gram: "312" }],
          lab: [{ id: "Laudo CQ-1414", data: "12/03/2026", along: "62", punc: "3,1", perm: "0,42" }] };
      } },
      { nome: "Geocomposto drenante para trincheira, lote de 600 rolos — tração transversal e fluxo reprovados (rejeitado)", dados: function () {
        return { ident: { registro: "GEO-02", obra: "Obra B — trincheiras drenantes", data: "2026-07-15", origem: "Fornecedor B", camada: "Geocomposto drenante" },
          params: { lote: "Lote 2026-31", fornecedor: "Fornecedor B", nf: "7021", dataEntrega: "15/07/2026", produto: "gc", tamLote: "600", largDecl: "1,00", compDecl: "50", pressao: "20", direcao: "h" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          vd: ["01", "77", "150", "233", "310", "402", "488", "575"].map(function (n) { return { id: "G-" + n, am: "1", vis: "S", ident: "S", larg: "1,01", comp: "50,3" }; }),
          dx: [{ id: "G-150", am: "1", tl: "11,2", tt: "5,4", esp: "5,6", gram: "610" }, { id: "G-310", am: "1", tl: "10,8", tt: "5,7", esp: "5,4", gram: "598" },
            { id: "G-488", am: "1", tl: "11,5", tt: "6,3", esp: "5,8", gram: "620" }],
          lab: [{ id: "Laudo externo 88", data: "10/11/2025", punc: "1,6", fluxo: "0,15" }] };
      } },
    ],
  });
})();
