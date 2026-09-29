/*
 * Ficha: DNIT 093/2016-EM — Tubo dreno corrugado de PEAD para drenagem rodoviária — recebimento do lote.
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 * Amostragem dupla por atributos (NBR 5426): Tabela 5 (visual e dimensional, nível S3) e Tabela 6 (destrutivos, nível S1).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dnit-093-2016-em.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var EPS = 1e-9;
  // Tabelas 1 a 4 por DN: De ± tol, Dim do tubo, L mín. e Dim da luva/tampão, área aberta mín. (cm²/m), vazão de influxo mín. (cm³/s·m),
  // esforço de tração no acoplamento (kgf), massa do percussor (kg)
  var DN = { 100: { de: 101.6, tol: 3.0, dim: 80.0, lL: 145, dimL: 92, area: 120, vazao: 4940, tracao: 64, massa: 1.00 },
    170: { de: 170.0, tol: 3.0, dim: 130.0, lL: 155, dimL: 155, area: 180, vazao: 10030, tracao: 69, massa: 1.75 },
    230: { de: 230.0, tol: 4.0, dim: 190.0, lL: 190, dimL: 205, area: 220, vazao: 14270, tracao: 150, massa: 1.75 } };
  // Tabela 5 (S3) e Tabela 6 (S1): [de, até, n1, n2, Ac1, Re1, Ac2, Re2]
  var TAB5 = [[30, 130, 3, 3, 0, 2, 1, 2], [131, 500, 5, 5, 0, 3, 3, 4], [501, 2500, 8, 8, 1, 4, 4, 5], [2501, 10000, 13, 13, 2, 5, 6, 7]];
  var TAB6 = [[130, 500, 1, 0, 0, 1, NaN, NaN], [501, 2500, 3, 3, 0, 2, 1, 2], [2501, 10000, 5, 5, 0, 2, 1, 2]];
  var FORMA = { b6: [6, "barras de 6,0 m"], b12: [12, "barras de 12,0 m"], r50: [50, "rolos de 50,0 m"] };
  function dn(P) { return DN[P.dn] || DN[100]; }
  function preto(P) { return P.cor !== "outra"; }
  var GD = "Documentação e fornecimento (4.1; 4.5; 4.7)", GV = "Exames visual e dimensional (4.2 a 4.4; Tabela 5)", GX = "Ensaios destrutivos (4.8.4; 4.8.7 a 4.8.9; Tabela 6)",
    GM = "Caracterização do material e das conexões (4.4; 4.8)";

  var CRIT = [
    { id: "pead", grupo: GD, texto: "PEAD virgem (reprocessado só do próprio fabricante), projetado para vida útil ≥ 50 anos — declaração/certificado", secao: "4.1", tipo: "sim_nao" },
    { id: "transp", grupo: GD, texto: "Transporte e acondicionamento sem exposição a calor ou agentes químicos; estocagem ao tempo ≤ 3 meses", secao: "4.5", tipo: "sim_nao", falha: "ressalva" },
    { id: "rolo", grupo: GD, texto: "Diâmetro interno dos rolos ≥ 5 × De", secao: "4.3", tipo: "sim_nao", falha: "ressalva", se: function (P) { return P.forma === "r50"; }, naoAplicaPor: "fornecimento em barras" },
  ];

  function tabelasExtra(d) {
    var P = d.params || {};
    var T = [{ chave: "vd", titulo: "Exames visual e dimensional — unidades da amostra (Tabela 5)", rotulo: "Tubo", iniciais: 3, min: 1,
      dica: "uma coluna por barra/rolo; \"Amostra\" 1 ou 2 (2ª amostragem); De na crista da corrugação e Di na ponta, média de 2 medidas ortogonais; área aberta = área média de 40 aberturas × nº médio de aberturas em 1,0 m",
      linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "am", r: "Amostra (1 / 2)", texto: true },
        { k: "vis", r: "Aspecto: cor uniforme, sem corpos estranhos, bolhas, rachaduras? (S / N)", texto: true }, { k: "marc", r: "Marcação completa a cada ≤ 3 m? (S / N)", texto: true },
        { k: "de", r: "Diâmetro externo médio De", u: "mm" }, { k: "di", r: "Diâmetro interno médio Di", u: "mm" }, { k: "comp", r: "Comprimento", u: "m" },
        { k: "abA", r: "Área média de uma abertura (40 medidas)", u: "mm²" }, { k: "abN", r: "Nº médio de aberturas por metro", u: "nº/m" },
        { k: "abMin", r: "Menor dimensão das aberturas", u: "mm" }] },
      { chave: "dx", titulo: "Ensaios destrutivos — unidades da amostra (Tabela 6)", rotulo: "Tubo", iniciais: 1, min: 1,
        dica: "tubos dos lotes aprovados no visual/dimensional; \"Amostra\" 1 ou 2",
        linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "am", r: "Amostra (1 / 2)", texto: true },
          { k: "comp50", r: "Compressão diametral a 50 % do De sem trincas, rasgos ou quebra? (S / N)", texto: true },
          { k: "imp", r: "Impacto sem fissuras, quebras ou trincas? (S / N)", texto: true },
          { k: "fi", r: "Diâmetro no ponto de impacto — antes φi", u: "mm" }, { k: "ff", r: "Diâmetro no ponto de impacto — depois φf", u: "mm" },
          { k: "cr", r: "Classe de rigidez (ISO 9969)", u: "Pa" }, { k: "nf", r: "Teor de negro-de-fumo (tubos pretos)", u: "%" }] },
      { chave: "mat", titulo: "Caracterização do material e das conexões — laudos (4.4; 4.8)", rotulo: "Laudo", iniciais: 1, min: 1,
        dica: "uma coluna por laudo/amostra; campos em branco = não apresentado",
        linhas: [{ k: "id", r: "Laudo / amostra", texto: true }, { k: "if", r: "Índice de fluidez (190 °C; 5 kg — NBR 9023)", u: "g/10 min" },
          { k: "dens", r: "Densidade (NBR 14684)", u: "g/cm³" }, { k: "oit", r: "OIT a 200 °C (NBR 14300) — parede interna", u: "min" },
          { k: "oit2", r: "OIT — outra parede (parede dupla)", u: "min" },
          { k: "m0", r: "Cinzas — massa da navícula M0", u: "g" }, { k: "m1", r: "Cinzas — massa da amostra M1", u: "g" }, { k: "m3", r: "Cinzas — navícula após calcinação M3", u: "g" },
          { k: "disp", r: "Dispersão de pigmentos satisfatória (NBR 14686)? (S / N)", texto: true },
          { k: "se0", r: "Intemperismo — tensão de escoamento inicial (não pretos)", u: "MPa" }, { k: "se1", r: "Intemperismo — tensão de escoamento após exposição", u: "MPa" },
          { k: "al0", r: "Intemperismo — alongamento na ruptura inicial", u: "%" }, { k: "al1", r: "Intemperismo — alongamento na ruptura após exposição", u: "%" },
          { k: "trac", r: "Tração no acoplamento tubo-conexão (Anexo A)", u: "kgf" }, { k: "vaz", r: "Vazão de influxo", u: "cm³/s·m" },
          { k: "lL", r: "Luva/tampão — comprimento L", u: "mm" }, { k: "diL", r: "Luva/tampão — diâmetro interno", u: "mm" }] }];
    return T;
  }

  function extra(ctx) {
    var P = ctx.P, D = dn(P), N = num(P.tamLote), fm = FORMA[P.forma] || FORMA.r50, l;
    // visual e dimensional
    var vd = R.cols(ctx.d, "vd", ["vis", "marc", "de", "di", "comp", "abA", "abN", "abMin"]).map(function (c, i) {
      var u = R.unidade(c, i, "tubo");
      R.confSN(u, c.vis, "aspecto visual");
      R.confSN(u, c.marc, "marcação");
      R.conf(u, c.de, { rot: "De", min: D.de - D.tol, max: D.de + D.tol, casas: 1, un: "mm" });
      R.conf(u, c.di, { rot: "Di", min: D.dim, casas: 1, un: "mm" });
      R.conf(u, c.comp, { rot: "comprimento", min: fm[0], max: fm[0] * 1.05, casas: 2, un: "m", obrig: false });
      var aA = num(c.abA), aN = num(c.abN);
      if (ok(aA) && ok(aN)) { u.area = aA * aN / 100; R.conf(u, u.area, { rot: "área aberta", min: D.area, casas: 0, un: "cm²/m" }); }
      R.conf(u, c.abMin, { rot: "abertura mínima", min: 0.6, casas: 2, un: "mm", obrig: false });
      return u;
    });
    var p5 = R.planoTab(TAB5, N);
    l = R.dupla({ id: "vd", grupo: GV, criterio: "Visual, marcação e dimensões — DN " + P.dn, secao: "4.2; 4.3; 4.4; 4.7; 5.2", plano: p5, unidades: vd, rotU: "tubo(s)",
      tituloUni: "Exames visual e dimensional", semPlano: ok(N) && N < 30 ? "lote com menos de 30 unidades: inspeção por instrução prévia da Fiscalização (5.1)" : "informe o tamanho do lote (30 a 10 000 barras/rolos — Tabela 5)" });
    l.exigido = "De " + fmt(D.de, 1) + " ± " + fmt(D.tol, 1) + " mm; Dim ≥ " + fmt(D.dim, 1) + " mm; área aberta ≥ " + D.area + " cm²/m; aberturas ≥ 0,6 mm; " + fm[1] + " + 5 % — " + R.txtPlano(p5);
    ctx.linhas.push(l);
    ctx.freqs.push(R.freqDupla(l, "Exames visual e dimensional", "Tabela 5 (NBR 5426, S3)"));
    var vdRej = l.situacao === "nao_conforme";
    // destrutivos (compressão diametral, impacto, classe de rigidez, negro-de-fumo)
    var dx = R.cols(ctx.d, "dx", ["comp50", "imp", "fi", "ff", "cr", "nf"]).map(function (c, i) {
      var u = R.unidade(c, i, "tubo");
      R.confSN(u, c.comp50, "compressão diametral 50 %");
      R.confSN(u, c.imp, "impacto (" + fmt(D.massa, 2) + " kg de 2,0 m)");
      var fi = num(c.fi), ff = num(c.ff);
      if (ok(fi) && ok(ff) && fi > 0) { u.vde = (fi - ff) / fi * 100; R.conf(u, u.vde, { rot: "V.D.E.", max: 15, casas: 1, un: "%" }); } else u.faltas.push("φi e φf (V.D.E.)");
      R.conf(u, c.cr, { rot: "classe de rigidez", min: 6000, casas: 0, un: "Pa" });
      if (preto(P)) R.conf(u, c.nf, { rot: "negro-de-fumo", min: 2.0, max: 3.0, casas: 1, un: "%" });
      return u;
    });
    var p6 = R.planoTab(TAB6, N);
    if (ok(N) && N >= 30 && N < 130) {
      l = A.linha({ id: "dx", grupo: GX, criterio: "Ensaios destrutivos", secao: "Tabela 6, nota", situacao: "nao_exigido", motivo: "lote < 130 barras/rolos: só exames visual e dimensional", exigido: "—", resultado: dx.length ? dx.length + " tubo(s)" : "—" });
    } else {
      l = R.dupla({ id: "dx", grupo: GX, criterio: "Compressão diametral, impacto, classe de rigidez" + (preto(P) ? " e negro-de-fumo" : ""), secao: "4.8.4; 4.8.7; 4.8.8; 4.8.9; 5.2", plano: p6, unidades: dx, rotU: "tubo(s)",
        tituloUni: "Ensaios destrutivos", semPlano: "informe o tamanho do lote (Tabela 6)" });
      l.exigido = "sem trincas a 50 %; impacto sem fissuras e V.D.E. ≤ 15 %; CR ≥ 6000 Pa" + (preto(P) ? "; negro-de-fumo 2,5 ± 0,5 %" : "") + " — " + R.txtPlano(p6);
      if (vdRej && dx.length) ctx.avisos.push("Os ensaios destrutivos são feitos só em lotes aprovados no visual e dimensional (5.1).");
      ctx.freqs.push(R.freqDupla(l, "Ensaios destrutivos", "Tabela 6 (NBR 5426, S1)"));
    }
    ctx.linhas.push(l);
    // caracterização (4.8.1 a 4.8.6), conexões (Tabela 3; Anexo A; Tabela 1) e vazão de influxo (Tabela 2)
    var mat = R.cols(ctx.d, "mat", ["if", "dens", "oit", "oit2", "m0", "m1", "m3", "disp", "se0", "se1", "al0", "al1", "trac", "vaz", "lL", "diL"]);
    var falt = {}, U = mat.map(function (c, i) {
      var u = R.unidade(c, i, "laudo");
      var chk = function (k, o) { if (ok(num(c[k]))) R.conf(u, c[k], o); };
      chk("if", { rot: "índice de fluidez", max: 1.6, casas: 2, un: "g/10 min" });
      chk("dens", { rot: "densidade", min: 0.938, casas: 3, un: "g/cm³" });
      chk("oit", { rot: "OIT", min: 20, casas: 0, un: "min" });
      chk("oit2", { rot: "OIT (outra parede)", min: 20, casas: 0, un: "min" });
      var m0 = num(c.m0), m1 = num(c.m1), m3 = num(c.m3);
      if (ok(m0) && ok(m1) && ok(m3) && m1 > 0) { u.tc = (m3 - m0) / m1 * 100; R.conf(u, u.tc, { rot: "teor de cinzas", max: 0.2, casas: 2, un: "%" }); }
      if (R.sn(c.disp) === false) u.falhas.push("dispersão de pigmentos insatisfatória");
      [["se0", "se1", "tensão de escoamento"], ["al0", "al1", "alongamento na ruptura"]].forEach(function (x) {
        var a = num(c[x[0]]), b = num(c[x[1]]);
        if (ok(a) && ok(b) && a > 0) R.conf(u, (a - b) / a * 100, { rot: "redução da " + x[2] + " após intemperismo", max: 25, casas: 1, un: "%" });
      });
      chk("trac", { rot: "tração no acoplamento", min: D.tracao, casas: 0, un: "kgf" });
      chk("vaz", { rot: "vazão de influxo", min: D.vazao, casas: 0, un: "cm³/s·m" });
      chk("lL", { rot: "comprimento da luva/tampão", min: D.lL, casas: 0, un: "mm" });
      chk("diL", { rot: "Di da luva/tampão", min: D.dimL, casas: 0, un: "mm" });
      return u;
    });
    var tem = function (fn) { return mat.some(fn); };
    var req = [["índice de fluidez", function (c) { return ok(num(c.if)); }], ["densidade", function (c) { return ok(num(c.dens)); }], ["OIT", function (c) { return ok(num(c.oit)); }],
      ["tração no acoplamento (Anexo A)", function (c) { return ok(num(c.trac)); }]];
    if (P.parede === "dupla") req.push(["OIT da outra parede (parede dupla)", function (c) { return ok(num(c.oit2)); }]);
    if (preto(P)) { req.push(["teor de cinzas", function (c) { return ok(num(c.m3)); }]); req.push(["dispersão de pigmentos", function (c) { return R.sn(c.disp) !== null; }]); }
    else req.push(["intemperismo artificial", function (c) { return ok(num(c.se1)) || ok(num(c.al1)); }]);
    var faltam = req.filter(function (x) { return !tem(x[1]); }).map(function (x) { return x[0]; });
    var ruins = U.filter(function (u) { return u.falhas.length; });
    l = A.linha({ id: "mat", grupo: GM, criterio: "Caracterização do PEAD e das conexões", secao: "4.4; 4.8.1 a 4.8.6; Anexo A", n: U.length,
      exigido: "IF ≤ 1,6 g/10 min; densidade ≥ 0,938 g/cm³; OIT ≥ 20 min; " + (preto(P) ? "cinzas ≤ 0,2 %; dispersão satisfatória; " : "redução ≤ 25 % após intemperismo; ") +
        "tração no acoplamento ≥ " + D.tracao + " kgf; vazão de influxo ≥ " + D.vazao + " cm³/s·m; luva/tampão L ≥ " + D.lL + " mm e Di ≥ " + D.dimL + " mm",
      resultado: U.length ? U.length + " laudo(s)" + (ruins.length ? ", " + ruins.length + " com não conformidade" : "") : "—" });
    l.unidades = U; l.tituloUni = "Laudos de caracterização";
    if (ruins.length) A.marcar(l, "nao_conforme", R.lista(ruins));
    if (faltam.length) A.marcar(l, "ressalva", "não apresentado(s): " + faltam.join(", ") + " — exigir laudo");
    ctx.linhas.push(l);
    if (ok(N) && N > 10000) ctx.avisos.push("Lote acima de 10 000 unidades: fora das Tabelas 5 e 6 — divida o fornecimento em lotes.");
  }

  R.criar({
    id: "dnit-093-2016-em",
    titulo: "Tubo dreno PEAD — recebimento do lote",
    resumo: "Recebimento de tubos dreno corrugados de PEAD (DNIT 093/2016-EM), DN 100, 170 ou 230: exames visual e dimensional (De ± tolerância, Dim, comprimento + 5 %, área aberta ≥ Tabela 2, aberturas ≥ 0,6 mm, marcação) com a amostragem dupla da Tabela 5; ensaios destrutivos — compressão diametral a 50 %, impacto com V.D.E. ≤ 15 %, classe de rigidez ≥ 6000 Pa e negro-de-fumo 2,5 ± 0,5 % — com a Tabela 6; laudos de índice de fluidez, densidade, OIT, cinzas (TC = (M3 − M0)/M1 × 100 ≤ 0,2 %), dispersão, intemperismo, tração no acoplamento (Tabela 3) e vazão de influxo.",
    params: R.paramsLote({ phLote: "ex.: lote de fabricação 2026-031" }).concat([
      { k: "dn", r: "Diâmetro nominal (Tabela 1)", tipo: "select", opcoes: [["100", "DN 100"], ["170", "DN 170"], ["230", "DN 230"]] },
      { k: "forma", r: "Forma de fornecimento (4.3)", tipo: "select", opcoes: Object.keys(FORMA).map(function (k) { return [k, FORMA[k][1][0].toUpperCase() + FORMA[k][1].slice(1)]; }) },
      { k: "tamLote", r: "Tamanho do lote (barras/rolos)" },
      { k: "cor", r: "Cor do tubo", tipo: "select", opcoes: [["preto", "Preto (negro-de-fumo)"], ["outra", "Não preto (intemperismo artificial)"]] },
      { k: "parede", r: "Parede", tipo: "select", opcoes: [["simples", "Simples"], ["dupla", "Dupla (OIT nas duas paredes)"]] },
    ]),
    padrao: { dn: "100", forma: "r50", cor: "preto", parede: "simples" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    notas: "Critérios da DNIT 093/2016-EM. Tabela 1: De 101,6 ± 3,0 / 170,0 ± 3,0 / 230,0 ± 4,0 mm e Dim ≥ 80 / 130 / 190 mm (DN 100 / 170 / 230); comprimento: barras de 6 ou 12 m, rolos de 50 m, tolerância + 5 %. Tabela 2: área aberta ≥ 120 / 180 / 220 cm²/m (área média de 40 aberturas × nº médio de aberturas por metro) e vazão de influxo ≥ 4940 / 10030 / 14270 cm³/s·m; aberturas ≥ 0,6 mm. Tabela 3: tração no acoplamento ≥ 64 / 69 / 150 kgf (Anexo A). 4.8: IF ≤ 1,6 g/10 min; densidade ≥ 0,938 g/cm³; OIT ≥ 20 min a 200 °C; negro-de-fumo (2,5 ± 0,5) %; cinzas TC = (M3 − M0)/M1 × 100 ≤ 0,2 %; redução ≤ 25 % após intemperismo (não pretos); compressão diametral a 50 % sem trincas; impacto (Tabela 4) sem fissuras e V.D.E. = (φi − φf)/φi × 100 ≤ 15 %; classe de rigidez ≥ 6000 Pa. Amostragem dupla (5.2): defeituosas ≤ Ac1 → aceito; ≥ Re1 → rejeitado; entre os dois → 2ª amostra e acumulado contra Ac2/Re2. Lotes < 130: só visual e dimensional; < 30: instrução prévia da Fiscalização.",
    exemplos: [
      { nome: "DN 100 em rolos de 50 m, lote de 320 rolos — aceito", dados: function () {
        return { ident: { registro: "PEAD-01", obra: "Obra A — drenos profundos", data: "2026-05-20", origem: "Fornecedor A", camada: "Tubo dreno PEAD DN 100" },
          params: { lote: "Lote de fabricação 2026-031", fornecedor: "Fornecedor A", nf: "88112", certificado: "LD-2211", dataEntrega: "20/05/2026", dn: "100", forma: "r50", tamLote: "320",
            cor: "preto", parede: "simples" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }],
          vd: [{ id: "R-011", am: "1", vis: "S", marc: "S", de: "101,9", di: "82,4", comp: "50,8", abA: "31", abN: "420", abMin: "0,9" },
            { id: "R-088", am: "1", vis: "S", marc: "S", de: "102,3", di: "82,1", comp: "51,2" }, { id: "R-140", am: "1", vis: "S", marc: "S", de: "101,1", di: "81,8" },
            { id: "R-205", am: "1", vis: "S", marc: "S", de: "100,8", di: "82,6" }, { id: "R-297", am: "1", vis: "S", marc: "S", de: "102,0", di: "82,0" }],
          dx: [{ id: "R-140", am: "1", comp50: "S", imp: "S", fi: "101,3", ff: "93,8", cr: "7150", nf: "2,4" }],
          mat: [{ id: "Laudo LD-2211", if: "0,45", dens: "0,951", oit: "32", m0: "18,4210", m1: "2,0115", m3: "18,4231", disp: "S", trac: "78", vaz: "5210", lL: "150", diL: "94" }] };
      } },
      { nome: "DN 170 em barras de 6 m, lote de 800 — 2ª amostragem e destrutivos reprovados (rejeitado)", dados: function () {
        return { ident: { registro: "PEAD-02", obra: "Obra B — drenos", data: "2026-06-30", origem: "Fornecedor B", camada: "Tubo dreno PEAD DN 170" },
          params: { lote: "Lote 2026-077", fornecedor: "Fornecedor B", nf: "12030", dataEntrega: "30/06/2026", dn: "170", forma: "b6", tamLote: "800", cor: "preto", parede: "dupla" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}],
          vd: [{ id: "B-01", am: "1", vis: "S", marc: "S", de: "170,4", di: "131,5", comp: "6,05" }, { id: "B-02", am: "1", vis: "S", marc: "N", de: "169,1", di: "130,8" },
            { id: "B-03", am: "1", vis: "S", marc: "S", de: "173,6", di: "132,2" }, { id: "B-04", am: "1", vis: "S", marc: "S", de: "171,0", di: "131,0" },
            { id: "B-05", am: "1", vis: "S", marc: "S", de: "170,2", di: "130,6" }, { id: "B-06", am: "1", vis: "S", marc: "S", de: "169,8", di: "131,9" },
            { id: "B-07", am: "1", vis: "S", marc: "S", de: "170,5", di: "130,4" }, { id: "B-08", am: "1", vis: "S", marc: "S", de: "170,9", di: "131,2" },
            { id: "B-09", am: "2", vis: "S", marc: "S", de: "170,3", di: "131,0" }, { id: "B-10", am: "2", vis: "S", marc: "S", de: "171,2", di: "130,9" },
            { id: "B-11", am: "2", vis: "S", marc: "S", de: "169,6", di: "131,4" }, { id: "B-12", am: "2", vis: "S", marc: "S", de: "170,0", di: "130,7" },
            { id: "B-13", am: "2", vis: "S", marc: "S", de: "170,7", di: "131,1" }, { id: "B-14", am: "2", vis: "S", marc: "S", de: "170,1", di: "130,5" },
            { id: "B-15", am: "2", vis: "S", marc: "S", de: "171,4", di: "131,8" }, { id: "B-16", am: "2", vis: "S", marc: "S", de: "169,9", di: "130,6" }],
          dx: [{ id: "B-05", am: "1", comp50: "S", imp: "S", fi: "170,2", ff: "150,1", cr: "6400", nf: "2,6" }, { id: "B-11", am: "1", comp50: "N", imp: "S", fi: "169,6", ff: "152,0", cr: "5700", nf: "2,2" },
            { id: "B-14", am: "1", comp50: "S", imp: "S", fi: "170,1", ff: "155,3", cr: "6800", nf: "2,5" },
            { id: "B-09", am: "2", comp50: "S", imp: "S", fi: "170,3", ff: "152,2", cr: "6550", nf: "2,4" }, { id: "B-12", am: "2", comp50: "S", imp: "N", fi: "170,0", ff: "141,0", cr: "6300", nf: "2,7" },
            { id: "B-16", am: "2", comp50: "S", imp: "S", fi: "169,9", ff: "151,5", cr: "6900", nf: "2,5" }],
          mat: [{ id: "Laudo 77", if: "1,9", dens: "0,944", oit: "24", oit2: "18", trac: "72" }] };
      } },
    ],
  });
})();
