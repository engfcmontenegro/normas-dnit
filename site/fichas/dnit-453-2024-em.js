/*
 * Ficha: DNIT 453/2024-EM — Peneiras de malhas quadradas para análise granulométrica — verificação (aferição) de peneiras.
 * Cada coluna é uma peneira do conjunto (5 b: verificada individualmente). Aberturas medidas em pelo menos duas áreas
 * da tela (2.3) → abertura média, maior abertura e % de malhas acima de w + Z, comparadas com as tolerâncias +X, ±Y e +Z
 * do Anexo B (3.2.3 b a e: cumprimento simultâneo) e diâmetro dos fios entre d mín. e d máx. (3.2.3 f); inspeção da tela,
 * armadura (3.2.2), caixilho (nota 1) e placa de identificação (4). Parecer por peneira e do conjunto (5).
 * Usa FE.aceitacao (site/fichas/es-comum.js) para as linhas de critério e o parecer.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dnit-453-2024-em", EPS = 1e-9;

  // Anexo B: [w (mm), designação, +X, ±Y, +Z, d recomendado, d mín., d máx.] (mm)
  var ANEXO_B = [
    [125, "5 pol.", 4.51, 3.66, 4.09, 8, 6.8, 9.2], [106, "4,24 pol.", 3.99, 3.12, 3.56, 6.3, 5.4, 7.2], [100, "4 pol.", 3.85, 2.94, 3.40, 6.3, 5.4, 7.2],
    [90, "3 ½ pol.", 3.53, 2.65, 3.09, 6.3, 5.4, 7.2], [75, "3 pol.", 3.09, 2.22, 2.66, 6.3, 5.4, 7.2], [63, "2 ½ pol.", 2.71, 1.87, 2.29, 5.6, 4.8, 6.4],
    [53, "2,12 pol.", 2.39, 1.5, 1.95, 5, 4.3, 5.8], [50, "2 pol.", 2.29, 1.49, 1.89, 5, 4.3, 5.8], [45, "1 ¾ pol.", 2.12, 1.39, 1.76, 4.5, 3.8, 5.2],
    [37.5, "1 ½ pol.", 1.85, 1.13, 1.49, 4.5, 3.8, 5.2], [31.5, "1 ¼ pol.", 1.63, 0.95, 1.29, 4, 3.4, 4.6], [26.5, "1,06 pol.", 1.44, 0.802, 1.12, 3.55, 3, 4.1],
    [25.4, "1 pol.", 1.38, 0.76, 1.07, 3.55, 3, 4.1], [22.4, "7/8 pol.", 1.27, 0.681, 0.98, 3.55, 3, 4.1], [19, "¾ pol.", 1.13, 0.58, 0.86, 3.15, 2.7, 3.6],
    [16, "5/8 pol.", 0.99, 0.49, 0.74, 3.15, 2.7, 3.6], [13.2, "0,53 pol.", 0.86, 0.406, 0.63, 2.8, 2.4, 3.2], [12.5, "½ pol.", 0.83, 0.385, 0.61, 2.5, 2.1, 2.9],
    [11.2, "7/16 pol.", 0.77, 0.346, 0.56, 2.5, 2.1, 2.9], [9.5, "3/8 pol.", 0.68, 0.3, 0.49, 2.24, 1.9, 2.6], [8, "5/16 pol.", 0.6, 0.246, 0.42, 2, 1.7, 2.3],
    [6.7, "0,265 pol.", 0.53, 0.21, 0.37, 1.8, 1.5, 2.1], [6.3, "¼ pol.", 0.51, 0.179, 0.34, 1.8, 1.5, 2.1], [5.6, "nº 3 ½", 0.47, 0.176, 0.32, 1.6, 1.3, 1.9],
    [4.75, "nº 4", 0.41, 0.15, 0.28, 1.6, 1.3, 1.9], [4, "nº 5", 0.37, 0.127, 0.25, 1.4, 1.2, 1.7], [3.35, "nº 6", 0.32, 0.107, 0.21, 1.25, 1.06, 1.5],
    [2.8, "nº 7", 0.29, 0.09, 0.19, 1.12, 0.95, 1.3], [2.36, "nº 8", 0.25, 0.08, 0.17, 1, 0.85, 1.15], [2, "nº 10", 0.23, 0.07, 0.15, 0.9, 0.77, 1.04],
    [1.7, "nº 12", 0.2, 0.056, 0.13, 0.8, 0.68, 0.92], [1.4, "nº 14", 0.18, 0.046, 0.11, 0.71, 0.6, 0.82], [1.18, "nº 16", 0.16, 0.04, 0.10, 0.63, 0.54, 0.72],
    [1, "nº 18", 0.14, 0.034, 0.09, 0.56, 0.48, 0.64], [0.85, "nº 20", 0.127, 0.0291, 0.08, 0.5, 0.43, 0.58], [0.71, "nº 25", 0.112, 0.0247, 0.07, 0.45, 0.38, 0.52],
    [0.6, "nº 30", 0.101, 0.021, 0.06, 0.4, 0.34, 0.46], [0.5, "nº 35", 0.089, 0.018, 0.05, 0.315, 0.27, 0.36], [0.42, "nº 40", 0.081, 0.016, 0.05, 0.28, 0.24, 0.32],
    [0.355, "nº 45", 0.072, 0.133, 0.10, 0.224, 0.19, 0.26], [0.3, "nº 50", 0.0652, 0.012, 0.04, 0.2, 0.17, 0.23], [0.25, "nº 60", 0.058, 0.009, 0.03, 0.16, 0.13, 0.19],
    [0.21, "nº 70", 0.052, 0.087, 0.07, 0.14, 0.12, 0.17], [0.18, "nº 80", 0.047, 0.076, 0.06, 0.125, 0.106, 0.15], [0.15, "nº 100", 0.043, 0.006, 0.02, 0.1, 0.085, 0.115],
    [0.125, "nº 120", 0.038, 0.0049, 0.02, 0.09, 0.077, 0.104], [0.106, "nº 140", 0.035, 0.0052, 0.02, 0.071, 0.06, 0.082], [0.09, "nº 170", 0.032, 0.0046, 0.02, 0.063, 0.054, 0.072],
    [0.075, "nº 200", 0.029, 0.004, 0.02, 0.05, 0.043, 0.058], [0.063, "nº 230", 0.026, 0.0037, 0.01, 0.045, 0.038, 0.052], [0.053, "nº 270", 0.024, 0.0034, 0.01, 0.036, 0.031, 0.041],
    [0.045, "nº 325", 0.022, 0.0031, 0.01, 0.032, 0.027, 0.037], [0.037, "nº 400", 0.02, 0.0029, 0.01, 0.03, 0.024, 0.035],
  ];
  // linhas do Anexo B com erro evidente de casa decimal (±Y maior que +X): 0,355, 0,21 e 0,18 mm
  var ERRO_TAB = [0.355, 0.21, 0.18];
  // equações 1 a 3 (3.2.3), com w e resultados em micrômetros (ISO 3310-1) — convertidos para mm
  function eqs(w) {
    var u = w * 1000, X = (2 * Math.pow(u, 0.75) / 3 + 4 * Math.pow(u, 0.25)) / 1000, Y = (Math.pow(u, 0.98) / 27 + 1.6) / 1000;
    return { X: X, Y: Y, Z: (X + Y) / 2 };
  }
  function linhaB(w) { return ANEXO_B.filter(function (r) { return Math.abs(r[0] - w) / r[0] < 0.005; })[0] || null; }
  function tolerancias(w, modo) {
    var r = linhaB(w);
    if (!r) return null;
    var e = eqs(w), t = { w: r[0], nome: r[1], X: r[2], Y: r[3], Z: r[4], d: r[5], dmin: r[6], dmax: r[7], fonte: "Anexo B" };
    if (modo === "eq") { t.X = e.X; t.Y = e.Y; t.Z = e.Z; t.fonte = "eq. 1 a 3 (µm)"; }
    else if (ERRO_TAB.indexOf(r[0]) >= 0) { t.Y = e.Y; t.Z = e.Z; t.fonte = "Anexo B (±Y e +Z da eq. 2 e 3: erro de casa decimal na tabela)"; t.corrigido = true; }
    return t;
  }
  function lista(s) { return String(s || "").split(/[;\s]+/).map(num).filter(ok); }
  function sn(v) { var t = String(v || "").trim(); return /^(s|sim|atende|ok)\b/i.test(t) ? "S" : /^(n|n[aã]o)\b/i.test(t) ? "N" : /^(na|n\/a|n[aã]o se aplica)$/i.test(t) ? "NA" : t ? "?" : ""; }
  function c3(x) { return ok(x) ? fmt(x, x < 0.1 ? 4 : 3) : "—"; }

  function avaliarPeneira(p, i, P) {
    var w = num(p.w), nome = "Peneira " + (i + 1) + (ok(w) ? " — " + fmt(w, w < 1 ? 3 : w < 10 ? 2 : 1).replace(/,?0+$/, "") + " mm" : "") + (p.serie ? " (" + p.serie + ")" : "");
    var t = ok(w) ? tolerancias(w, P.tol) : null, linhas = [], o = { nome: nome, t: t, linhas: linhas };
    var a1 = lista(p.area1), a2 = lista(p.area2), ab = a1.concat(a2), fios = lista(p.fios);
    function L(id, crit, secao) { var l = A.linha({ id: id + i, grupo: nome, criterio: crit, secao: secao, n: 0 }); linhas.push(l); return l; }
    if (!t) {
      var l0 = L("w", "Abertura nominal da peneira", "Anexo B");
      A.marcar(l0, "pendente", ok(w) ? "abertura " + fmt(w, 3) + " mm não consta do Anexo B" : "informe a abertura nominal");
      return o;
    }
    o.n = ab.length;
    if (ab.length) {
      o.Ym = ab.reduce(function (s, x) { return s + x; }, 0) / ab.length;
      o.max = Math.max.apply(null, ab);
      o.nZ = ab.filter(function (x) { return x > t.w + t.Z + EPS; }).length;
      o.pZ = o.nZ / ab.length * 100;
      o.nX = ab.filter(function (x) { return x > t.w + t.X + EPS; }).length;
    }
    // ±Y: abertura média
    var lm = L("ym", "Abertura média × tolerância ±Y", "3.2.3 d");
    lm.exigido = c3(t.w - t.Y) + " a " + c3(t.w + t.Y) + " mm (w ± " + c3(t.Y) + ")";
    if (!ab.length) A.marcar(lm, "pendente", "sem aberturas medidas");
    else {
      lm.n = ab.length; lm.resultado = c3(o.Ym) + " mm (desvio " + (o.Ym - t.w >= 0 ? "+" : "−") + c3(Math.abs(o.Ym - t.w)) + ")";
      if (Math.abs(o.Ym - t.w) > t.Y + EPS) A.marcar(lm, "nao_conforme", "abertura média fora de w ± Y");
      if (!a1.length || !a2.length) A.marcar(lm, "pendente", "medições em pelo menos duas áreas da tela (2.3)");
    }
    // +X: nenhuma malha acima de w + X
    var lx = L("x", "Maior abertura individual × +X", "3.2.3 c");
    lx.exigido = "≤ " + c3(t.w + t.X) + " mm (w + " + c3(t.X) + ")";
    if (ab.length) { lx.n = ab.length; lx.resultado = c3(o.max) + " mm"; if (o.nX) A.marcar(lx, "nao_conforme", o.nX + " malha(s) acima de w + X"); }
    else A.marcar(lx, "pendente", "sem aberturas medidas");
    // +Z: menos de 6 % das malhas acima de w + Z
    var lz = L("z", "Malhas acima de w + Z", "3.2.3 e");
    lz.exigido = "< 6 % das malhas acima de " + c3(t.w + t.Z) + " mm";
    if (ab.length) {
      lz.n = ab.length; lz.resultado = o.nZ + " de " + ab.length + " (" + fmt(o.pZ, 1) + " %)";
      if (o.pZ >= 6 - EPS) A.marcar(lz, "nao_conforme", fmt(o.pZ, 1) + " % das malhas acima de w + Z");
      if (ab.length < 17 && o.nZ >= 1) A.marcar(lz, "ressalva", "com menos de 17 malhas medidas, uma única malha já passa de 6 % — amplie a amostragem");
    } else A.marcar(lz, "pendente", "sem aberturas medidas");
    // diâmetro dos fios
    var ld = L("d", "Diâmetro dos fios", "3.2.3 f");
    ld.exigido = c3(t.dmin) + " a " + c3(t.dmax) + " mm (recomendado " + c3(t.d) + ")";
    if (fios.length) {
      ld.n = fios.length;
      var dm = fios.reduce(function (s, x) { return s + x; }, 0) / fios.length, fora = fios.filter(function (x) { return x < t.dmin - EPS || x > t.dmax + EPS; });
      o.dm = dm;
      ld.resultado = c3(dm) + " mm (" + c3(Math.min.apply(null, fios)) + " a " + c3(Math.max.apply(null, fios)) + ")";
      if (fora.length) A.marcar(ld, "nao_conforme", fora.length + " fio(s) fora de d mín. / d máx.: " + fora.map(c3).join("; "));
    } else A.marcar(ld, "pendente", "sem diâmetros de fio medidos");
    // inspeções
    [["tela", "Tela plana e tensa, sem furos, ondulações nem fios soltos; fios maciços, sem recobrimento", "3.1 b / 3.2.1", "nao_conforme"],
      ["arm", "Armadura unida (cruzada admitida só em malhas ≤ 63 µm)", "3.2.2", "nao_conforme"],
      ["caix", "Caixilho (metálico, liso, sem emendas, chapa ≥ 0,8 mm; Ø 20 cm e altura 5 ou 10 cm se w > 5 mm)", "2.7 / nota 1", "nao_conforme"],
      ["placa", "Placa de identificação: abertura, norma, materiais do fio e do caixilho, fabricante", "4", "nao_conforme"]].forEach(function (x) {
      var v = sn(p[x[0]]), l = L(x[0], x[1], x[2]);
      l.exigido = "atende"; l.resultado = v === "S" ? "atende" : v === "N" ? "não atende" : v === "NA" ? "não se aplica" : "—"; l.n = v ? 1 : 0;
      if (v === "N") A.marcar(l, x[3], "não atende (" + x[2] + ")");
      else if (v === "NA") { l.situacao = "nao_exigido"; l.motivo = "não se aplica"; }
      else if (v === "?") A.marcar(l, "pendente", "escreva S, N ou NA");
      else if (!v) A.marcar(l, "pendente", "inspeção não registrada");
    });
    o.situacao = linhas.reduce(function (s, l) { return A.pior(s, l.situacao); }, "conforme");
    if (t.corrigido) o.aviso = nome + ": o Anexo B traz ±Y = " + fmt(linhaB(w)[3], 3) + " e +Z = " + fmt(linhaB(w)[4], 2) + " mm (maiores que +X — erro de casa decimal); usados ±Y e +Z das equações 2 e 3.";
    return o;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [];
    d.pen = d.pen || [{}];
    var pens = d.pen.map(function (p, i) { return avaliarPeneira(p, i, P); }).filter(function (o, i) { return Object.keys(d.pen[i]).some(function (k) { return String(d.pen[i][k] || "").trim(); }); });
    var linhas = [];
    pens.forEach(function (o) { linhas = linhas.concat(o.linhas); if (o.aviso) avisos.push(o.aviso); });
    var tab = d.pen.map(function (p) {
      var w = num(p.w), t = ok(w) ? tolerancias(w, P.tol) : null, ab = lista(p.area1).concat(lista(p.area2)), r = { n: ab.length };
      if (t) { r.wmY = t.w - t.Y; r.wMY = t.w + t.Y; r.wX = t.w + t.X; r.wZ = t.w + t.Z; r.dmin = t.dmin; r.dmax = t.dmax; }
      if (ab.length) { r.Ym = ab.reduce(function (s, x) { return s + x; }, 0) / ab.length; r.max = Math.max.apply(null, ab); if (t) r.pZ = ab.filter(function (x) { return x > t.w + t.Z + EPS; }).length / ab.length * 100; }
      var f = lista(p.fios); if (f.length) r.dm = f.reduce(function (s, x) { return s + x; }, 0) / f.length;
      return r;
    });
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "PENEIRAS ADMITIDAS", texto: "Todas as peneiras verificadas cumprem integral e simultaneamente as prescrições da DNIT 453/2024-EM (5 a)." },
      RESSALVA: { titulo: "PENEIRAS ADMITIDAS COM RESSALVA", texto: "Nenhuma prescrição descumprida, mas há pontos a regularizar (ressalvas abaixo)." },
      PENDENTE: { titulo: "VERIFICAÇÃO PENDENTE", texto: "Faltam medições ou inspeções para concluir a verificação de alguma peneira." },
      REJEITADO: { titulo: "PENEIRA(S) NÃO ADMITIDA(S)", texto: "Há peneira que não cumpre as prescrições da norma: ela não pode ser usada em ensaio (5 a); as demais são avaliadas individualmente (5 b)." } } });
    if (!pens.length) avisos.push("Informe ao menos uma peneira (uma coluna por peneira).");
    return { tab: { pen: tab }, resultados: { pens: pens.map(function (o) { return { nome: o.nome, situacao: o.situacao || "pendente", n: o.n }; }), linhas: linhas, parecer: par,
      nAdm: pens.filter(function (o) { return o.situacao === "conforme" || o.situacao === "ressalva"; }).length, nTot: pens.length }, avisos: avisos };
  }
  function resumoPeneiras(r, relat) {
    return '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th style="text-align:left">Peneira</th><th>Malhas medidas</th><th style="text-align:left">Situação</th></tr></thead><tbody>' +
      r.pens.map(function (p) {
        var s = p.situacao === "conforme" || p.situacao === "ressalva" ? (relat ? "ADMITIDA" : '<span class="fe-ok">admitida</span>') + (p.situacao === "ressalva" ? " (com ressalva)" : "")
          : p.situacao === "nao_conforme" ? (relat ? "NÃO ADMITIDA" : '<span class="fe-nok">não admitida</span>') : A.situacaoHtml("pendente", relat);
        return '<tr><td style="text-align:left">' + esc(p.nome) + "</td><td>" + (p.n || 0) + '</td><td style="text-align:left">' + s + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  FE.FICHAS[ID] = {
    titulo: "Verificação de peneiras de malhas quadradas",
    resumo: "Uma coluna por peneira: aberturas medidas em duas áreas da tela → abertura média (±Y), maior abertura (+X) e % de malhas acima de w + Z; diâmetro dos fios (d mín./d máx.); tela, armadura, caixilho e placa. Tolerâncias do Anexo B; parecer por peneira (5).",
    lote: true,
    rotuloImportar: function (r) { return (r.nAdm || 0) + " de " + (r.nTot || 0) + " peneira(s) admitida(s)"; },
    blocos: [],
    params: [
      { k: "conjunto", r: "Identificação do conjunto / lote de peneiras" },
      { k: "fabricante", r: "Fabricante / distribuidor" },
      { k: "instrumento", r: "Instrumento de medição das aberturas", ph: "ex.: projetor de perfil, microscópio, paquímetro" },
      { k: "tol", r: "Tolerâncias", tipo: "select", opcoes: [["tab", "Tabela do Anexo B (linhas com erro de casa decimal corrigidas pelas equações)"], ["eq", "Equações 1 a 3 (3.2.3), em µm"]] },
    ],
    padrao: { tol: "tab" },
    tabelas: function () {
      return [{ chave: "pen", titulo: "Peneiras verificadas", rotulo: "Peneira", iniciais: 3, min: 1,
        dica: "aberturas e diâmetros em mm, separados por \";\"; inspeções: S / N / NA",
        linhas: [
          { k: "w", r: "Abertura nominal w (Anexo B)", u: "mm", ph: "ex.: 2,36" },
          { k: "serie", r: "Nº de série / identificação", u: "", texto: true },
          { k: "area1", r: "Aberturas medidas — área 1 (2.3)", u: "mm", texto: true, ph: "2,37; 2,35; ..." },
          { k: "area2", r: "Aberturas medidas — área 2 (2.3)", u: "mm", texto: true, ph: "2,36; 2,38; ..." },
          { k: "fios", r: "Diâmetros dos fios medidos", u: "mm", texto: true, ph: "1,00; 0,98; ..." },
          { k: "tela", r: "Tela plana, tensa, sem defeitos (3.1 b, 3.2.1)", u: "S/N", texto: true },
          { k: "arm", r: "Armadura unida (3.2.2)", u: "S/N", texto: true },
          { k: "caix", r: "Caixilho (2.7, nota 1)", u: "S/N", texto: true },
          { k: "placa", r: "Placa de identificação (4)", u: "S/N", texto: true },
          { grupo: "Resultados" },
          { calc: "n", r: "Malhas medidas", u: "", casas: 0 },
          { calc: "Ym", r: "Abertura média Y", u: "mm", casas: 4, destaque: true },
          { calc: "wmY", r: "Limite inferior w − Y", u: "mm", casas: 4 },
          { calc: "wMY", r: "Limite superior w + Y", u: "mm", casas: 4 },
          { calc: "max", r: "Maior abertura", u: "mm", casas: 4, destaque: true },
          { calc: "wX", r: "Máximo individual w + X", u: "mm", casas: 4 },
          { calc: "wZ", r: "w + Z", u: "mm", casas: 4 },
          { calc: "pZ", r: "Malhas acima de w + Z (máx. < 6 %)", u: "%", casas: 1, destaque: true },
          { calc: "dm", r: "Diâmetro médio do fio", u: "mm", casas: 4 },
          { calc: "dmin", r: "d mín.", u: "mm", casas: 3 },
          { calc: "dmax", r: "d máx.", u: "mm", casas: 3 },
        ] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + A.cartao(esc(r.parecer.titulo), "Parecer do conjunto") + A.cartao(r.nAdm + " de " + r.nTot, "Peneiras admitidas") + "</div>" +
        A.htmlParecer(r.parecer) + resumoPeneiras(r, false) + '<div class="fe-tab-wrap">' + A.htmlCriterios(r.linhas, { estilo: "resultado" }) + "</div>";
    },
    relatorio: {
      notas: "DNIT 453/2024-EM: tolerâncias de cumprimento simultâneo (3.2.3 b) — nenhuma malha acima de w + X (c); abertura média dentro de w ± Y (d), medida em pelo menos duas áreas da tela (2.3); " +
        "menos de 6 % das malhas acima de w + Z (e); diâmetro dos fios entre d mín. e d máx. (f). As equações 1 a 3 só reproduzem o Anexo B com w e resultados em micrômetros (a norma indica mm). " +
        "No Anexo B, as peneiras de 0,355, 0,21 e 0,18 mm trazem ±Y (0,133; 0,087; 0,076) e +Z com erro de casa decimal — na opção \"Tabela\" usam-se para elas ±Y e +Z das equações. " +
        "Aceitação (5): só são admitidas as peneiras que cumprem integral e simultaneamente a norma; em lotes, cada peneira é verificada individualmente.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        return [["Conjunto", P.conjunto || "—"], ["Parecer", r.parecer.titulo], ["Peneiras admitidas", r.nAdm + " de " + r.nTot]];
      },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + resumoPeneiras(r, true) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Conjunto de 3 peneiras (4,75 / 2,36 / 0,075 mm) — admitidas", dados: function () {
        return { ident: { registro: "PEN-2026-01", data: "2026-02-03", obra: "Laboratório — Unidade A", origem: "Fornecedor A" },
          params: { conjunto: "Conjunto 1 — série para agregados", fabricante: "Fornecedor A", instrumento: "projetor de perfil", tol: "tab" },
          pen: [
            { w: "4,75", serie: "P-475-01", area1: "4,76; 4,74; 4,78; 4,73; 4,77; 4,75; 4,79; 4,74; 4,76; 4,75", area2: "4,77; 4,73; 4,75; 4,78; 4,74; 4,76; 4,72; 4,77; 4,75; 4,74",
              fios: "1,58; 1,61; 1,60; 1,59", tela: "S", arm: "S", caix: "S", placa: "S" },
            { w: "2,36", serie: "P-236-01", area1: "2,37; 2,35; 2,38; 2,34; 2,36; 2,39; 2,35; 2,37; 2,36; 2,34", area2: "2,38; 2,36; 2,35; 2,37; 2,33; 2,36; 2,38; 2,35; 2,36; 2,37",
              fios: "1,00; 0,99; 1,01; 1,00", tela: "S", arm: "S", caix: "S", placa: "S" },
            { w: "0,075", serie: "P-075-01", area1: "0,076; 0,074; 0,077; 0,075; 0,073; 0,078; 0,075; 0,076; 0,074; 0,075", area2: "0,077; 0,075; 0,074; 0,076; 0,075; 0,073; 0,076; 0,078; 0,074; 0,075",
              fios: "0,050; 0,051; 0,049; 0,050", tela: "S", arm: "S", caix: "S", placa: "S" }] };
      } },
      { nome: "Conjunto com peneira de 0,6 mm desgastada (média, malha acima de +X e fio fora) e peneira de 2 mm sem placa de identificação", dados: function () {
        return { ident: { registro: "PEN-2026-02", data: "2026-08-10", obra: "Laboratório — Unidade B", origem: "Fornecedor B" },
          params: { conjunto: "Conjunto 2 — série para solos", fabricante: "Fornecedor B", instrumento: "microscópio de medição", tol: "tab" },
          pen: [
            { w: "0,6", serie: "P-060-07", area1: "0,628; 0,615; 0,622; 0,710; 0,618; 0,625; 0,631; 0,612; 0,620; 0,626", area2: "0,623; 0,619; 0,640; 0,617; 0,629; 0,624; 0,662; 0,621; 0,618; 0,627",
              fios: "0,33; 0,32; 0,34; 0,33", tela: "N", arm: "S", caix: "S", placa: "S" },
            { w: "2", serie: "P-200-03", area1: "2,01; 1,99; 2,02; 1,98; 2,00; 2,03; 1,99; 2,01; 2,00; 1,98", area2: "2,02; 2,00; 1,99; 2,01; 1,97; 2,00; 2,02; 1,99; 2,00; 2,01",
              fios: "0,90; 0,91; 0,89; 0,90", tela: "S", arm: "S", caix: "S", placa: "N" },
            { w: "0,355", serie: "P-355-02", area1: "0,356; 0,352; 0,359; 0,354; 0,357; 0,353; 0,355; 0,358; 0,351; 0,356", area2: "0,354; 0,357; 0,353; 0,356; 0,355; 0,352; 0,358; 0,354; 0,356; 0,355",
              fios: "0,225; 0,222; 0,226; 0,224", tela: "S", arm: "S", caix: "S", placa: "S" }] };
      } },
    ],
  };
})();
