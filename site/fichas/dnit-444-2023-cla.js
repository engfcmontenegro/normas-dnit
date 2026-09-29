/*
 * Ficha: DNIT 444/2023-CLA — Classificação de solos tropicais de granulação grossa (G-MCT).
 * Retido na peneira de 2,0 mm > 10 %: tipo granulométrico (Tabela 2 / Figura B1 — Ps, Sp ou Gf) pelas porcentagens
 * passando em 2,0 mm e 0,075 mm, combinado com o grupo MCT da fração passando em 2,0 mm (DNIT 259-CLA);
 * ≤ 10 %: só a classificação MCT (Tabela 1). Descrição do grupo G-MCT pelos Quadros C1 e C2.
 * Entradas digitadas ou importadas: granulometria (DNIT 412-ME), grupo MCT (DNIT 259-CLA ou DNIT 258-ME).
 * Usa FE.mct, exposto por site/fichas/dnit-259-2023-cla.js (carregado antes).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var M = FE.mct;

  var TIPOS = { Ps: "Pedregulho com solo", Sp: "Solo com pedregulho", Gf: "Solo granular com finos" };
  // Quadros C1 e C2: [nome G-MCT, suporte CBR, expansão CBR, contração, coef. permeabilidade, uso / prioridade]
  var Q = {
    "Ps-LA": ["Pedregulho com areia laterítica", "Alto", "Baixa", "Baixa", "Alto", "Revestimento primário: não recomendado; reforço do subleito: 1ª prioridade; base e sub-base: 2ª prioridade"],
    "Sp-LA": ["Areia laterítica com pedregulho", "Alto", "Baixa", "Baixa", "Alto", "Revestimento primário: não recomendado; reforço do subleito: 1ª prioridade; base e sub-base: 2ª prioridade"],
    "Gf-LA": ["Solo granular fino de areia laterítica com pedregulho", "Alto", "Baixa", "Baixa", "Médio a alto", "Revestimento primário: 1ª prioridade; reforço do subleito: 2ª prioridade; base e sub-base: 1ª prioridade"],
    "Ps-LA'": ["Pedregulho com solo arenoso laterítico", "Alto", "Baixa", "Baixa", "Alto", "Revestimento primário: 1ª prioridade; reforço do subleito: 4ª prioridade; base e sub-base: 5ª prioridade"],
    "Sp-LA'": ["Solo arenoso laterítico com pedregulho", "Alto", "Baixa", "Baixa", "Alto", "Revestimento primário: 1ª prioridade; reforço do subleito: 4ª prioridade; base e sub-base: 5ª prioridade"],
    "Gf-LA'": ["Solo granular fino arenoso laterítico com pedregulho", "Alto", "Baixa", "Baixa", "Médio", "Revestimento primário: 1ª prioridade; reforço do subleito: 4ª prioridade; base e sub-base: 5ª prioridade"],
    "Ps-LG'": ["Pedregulho com solo argiloso laterítico", "Médio a alto", "Baixa", "Baixa a média", "Médio a alto", "Revestimento primário: 2ª prioridade; reforço do subleito: 3ª prioridade; base e sub-base: 3ª prioridade"],
    "Sp-LG'": ["Solo argiloso laterítico com pedregulho", "Médio a alto", "Baixa", "Baixa a média", "Médio a alto", "Revestimento primário: 2ª prioridade; reforço do subleito: 3ª prioridade; base e sub-base: 3ª prioridade"],
    "Gf-LG'": ["Solo granular fino argiloso laterítico com pedregulho", "Alto", "Baixa", "Média", "Baixo a médio", "Revestimento primário: 4ª prioridade; reforço do subleito: 6ª prioridade; base e sub-base: 6ª prioridade"],
    "Ps-NA": ["Pedregulho com areia não laterítica", "Alto", "Baixa", "Baixa", "Alto", "Reforço do subleito, base e sub-base: 2ª prioridade"],
    "Sp-NA": ["Areia não laterítica com pedregulho", "Alto", "Baixa", "Baixa", "Alto", "Reforço do subleito, base e sub-base: 2ª prioridade"],
    "Gf-NA": ["Solo granular fino de areia não laterítica com pedregulho", "Alto", "Baixa", "Baixa", "Médio a alto", "Reforço do subleito, base e sub-base: não recomendado"],
    "Ps-NA'": ["Pedregulho com solo arenoso não laterítico", "Alto", "Baixa", "Baixa", "Alto", "Reforço do subleito, base e sub-base: 1ª prioridade"],
    "Sp-NA'": ["Solo arenoso não laterítico com pedregulho", "Alto", "Baixa", "Baixa", "Alto", "Reforço do subleito, base e sub-base: 1ª prioridade"],
    "Gf-NA'": ["Solo granular fino arenoso não laterítico com pedregulho", "Alto", "Baixa", "Baixa", "Médio", "Reforço do subleito, base e sub-base: não recomendado"],
    "Ps-NS'": ["Pedregulho com solo siltoso não laterítico (impresso: \"argiloso\")", "Médio a alto", "Baixa", "Baixa a média", "Médio a alto", "Reforço do subleito, base e sub-base: 3ª prioridade"],
    "Sp-NS'": ["Solo siltoso não laterítico com pedregulho (impresso: \"argiloso\")", "Médio a alto", "Baixa a média", "Baixa a média", "Médio a alto", "Reforço do subleito, base e sub-base: 3ª prioridade"],
    "Gf-NS'": ["Solo granular fino siltoso não laterítico com pedregulho", "Alto", "Baixa", "Média", "Baixo a médio", "Reforço do subleito, base e sub-base: não recomendado"],
    "Ps-NG'": ["Pedregulho com solo argiloso não laterítico", "Médio a alto", "Baixa", "Baixa a média", "Médio a alto", "Reforço do subleito, base e sub-base: 4ª prioridade"],
    "Sp-NG'": ["Solo argiloso não laterítico com pedregulho", "Médio a alto", "Baixa a média", "Baixa a média", "Médio a alto", "Reforço do subleito, base e sub-base: 4ª prioridade"],
    "Gf-NG'": ["Solo granular fino argiloso não laterítico com pedregulho", "Alto", "Média a alta", "Média", "Baixo a médio", "Reforço do subleito, base e sub-base: não recomendado"],
  };
  var GRUPOS_OP = [["", "—"], ["LA", "LA"], ["LA'", "LA'"], ["LG'", "LG'"], ["NA", "NA"], ["NA'", "NA'"], ["NS'", "NS'"], ["NG'", "NG'"]];

  // % passando numa abertura a partir da média da granulometria (DNIT 412); interpola em log(abertura) se faltar a peneira
  function passante(media, mm) {
    var ls = (media || []).filter(function (m) { return ok(m.pass); }).sort(function (a, b) { return b.mm - a.mm; });
    var ex = ls.filter(function (m) { return Math.abs(m.mm - mm) / mm < 0.04; })[0];
    if (ex) return { v: ex.pass, interp: false };
    for (var i = 1; i < ls.length; i++) {
      if (ls[i - 1].mm > mm && ls[i].mm < mm) {
        var a = ls[i - 1], b = ls[i], f = (Math.log(mm) - Math.log(a.mm)) / (Math.log(b.mm) - Math.log(a.mm));
        return { v: a.pass + (b.pass - a.pass) * f, interp: true, de: a.mm, ate: b.mm };
      }
    }
    return { v: NaN };
  }
  function f1(v) { return ok(v) ? fmt(v, 1).replace(/\./g, "") : ""; }

  function tipoGranulometrico(p10, p200, avisos) {
    if (!ok(p10) || !ok(p200)) return "";
    if (p200 > p10 + 1e-9) avisos.push("O passante na 0,075 mm (" + fmt(p200, 1) + " %) não pode superar o passante na 2,0 mm (" + fmt(p10, 1) + " %) — confira a granulometria.");
    if (Math.abs(p200 - 30) < 1e-9) avisos.push("Passante na 0,075 mm igual a 30 %: a Tabela 2 não define o limite (< 30 % para Ps/Sp e > 30 % para Gf); adotado Ps/Sp.");
    if (p200 > 30) return "Gf";
    if (Math.abs(p10 - 50) < 1e-9) avisos.push("Passante na 2,0 mm igual a 50 %: a Tabela 2 não define o limite (< 50 % Ps, > 50 % Sp); adotado Sp.");
    return p10 < 50 ? "Ps" : "Sp";
  }

  function grafB1(p10, p200, tipo, opt) {
    opt = opt || {};
    var imp = opt.imprimir, k = imp ? { eixo: "#333", grade: "#ddd", txt: "#222", gf: "#cfcfcf", dest: "#c0392b", lin: "#c0392b" }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", gf: "rgba(127,127,127,.28)", dest: "#ff5c5c", lin: "#ff7a59" };
    var W = opt.w || 460, H = opt.h || 340, m = { l: 40, r: 56, t: 14, b: 44 };
    function X(v) { return m.l + v / 100 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / 100 * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    s += '<path d="M' + X(30) + " " + Y(30) + " L" + X(100) + " " + Y(100) + " L" + X(100) + " " + Y(30) + ' Z" fill="' + k.gf + '"/>';
    for (var g = 0; g <= 100; g += 10) {
      s += '<line x1="' + X(g) + '" y1="' + Y(0) + '" x2="' + X(g) + '" y2="' + Y(g) + '" stroke="' + k.grade + '" stroke-width="0.6"/>' +
        '<line x1="' + X(g) + '" y1="' + Y(g) + '" x2="' + X(100) + '" y2="' + Y(g) + '" stroke="' + k.grade + '" stroke-width="0.6"/>';
      if (g % 20 === 10 || g === 100) s += '<text x="' + X(g) + '" y="' + (Y(0) + 15) + '" text-anchor="middle" fill="' + k.txt + '">' + g + "</text>" +
        '<text x="' + (X(100) + 5) + '" y="' + (Y(g) + 4) + '" fill="' + k.txt + '">' + g + "</text>";
    }
    s += '<path d="M' + X(0) + " " + Y(0) + " L" + X(100) + " " + Y(100) + " L" + X(100) + " " + Y(0) + ' Z" fill="none" stroke="' + k.eixo + '" stroke-width="1.5"/>' +
      '<line x1="' + X(30) + '" y1="' + Y(30) + '" x2="' + X(100) + '" y2="' + Y(30) + '" stroke="' + k.eixo + '" stroke-width="1.2"/>' +
      '<line x1="' + X(50) + '" y1="' + Y(0) + '" x2="' + X(50) + '" y2="' + Y(30) + '" stroke="' + k.lin + '" stroke-width="1.2"/>' +
      '<text x="' + X(35) + '" y="' + Y(15) + '" text-anchor="middle" fill="' + k.txt + '" font-weight="bold" font-size="13">Ps</text>' +
      '<text x="' + X(72) + '" y="' + Y(15) + '" text-anchor="middle" fill="' + k.txt + '" font-weight="bold" font-size="13">Sp</text>' +
      '<text x="' + X(80) + '" y="' + Y(55) + '" text-anchor="middle" fill="' + k.txt + '" font-weight="bold" font-size="13">Gf</text>' +
      '<text x="' + ((X(0) + X(100)) / 2) + '" y="' + (H - 10) + '" text-anchor="middle" fill="' + k.txt + '">% que passa na peneira de 2,0 mm</text>' +
      '<text transform="translate(' + (W - 10) + " " + ((Y(0) + Y(100)) / 2) + ') rotate(90)" text-anchor="middle" fill="' + k.txt + '">% que passa na peneira de 0,075 mm</text>';
    if (ok(p10) && ok(p200)) {
      s += '<circle cx="' + X(Math.min(Math.max(p10, 0), 100)) + '" cy="' + Y(Math.min(Math.max(p200, 0), 100)) + '" r="6" fill="' + k.dest + '"/>' +
        '<text x="' + Math.max(X(p10) - 8, m.l + 40) + '" y="' + (Y(p200) - 9) + '" text-anchor="end" fill="' + k.dest + '" font-weight="bold">' + esc((tipo || "") + " (" + fmt(p10, 1) + "; " + fmt(p200, 1) + ")") + "</text>";
    }
    return s + "</svg>";
  }

  FE.FICHAS["dnit-444-2023-cla"] = {
    titulo: "Solos tropicais de granulação grossa — Classificação G-MCT",
    rotuloImportar: function (r) { return r.gmct || r.grupo || "—"; },
    resumo: "Tipo granulométrico (Ps, Sp ou Gf) pelas porcentagens passando em 2,0 mm e 0,075 mm (Tabela 2, Figura B1) combinado com o grupo MCT da fração fina (DNIT 259-CLA); descrição e prioridade de uso pelos Quadros C1 e C2.",
    blocos: [],
    params: [
      { k: "impGran", r: "Granulometria: importar de um ensaio (DNIT 412)", tipo: "importar", de: "dnit-412-2025-me",
        dica: "traz as porcentagens passando em 2,0 mm (nº 10) e 0,075 mm (nº 200)",
        aplicar: function (e, P) {
          var med = (e.resultados || {}).media || [];
          var a = passante(med, 2), b = passante(med, 0.075);
          P.p10 = f1(a.v); P.p200 = f1(b.v);
          P.granOrigem = ((e.dados.ident || {}).registro || "exemplo") + " — DNIT 412" + (a.interp ? " (2,0 mm interpolado entre " + fmt(a.de, 2) + " e " + fmt(a.ate, 2) + " mm)" : "");
        } },
      { k: "granOrigem", r: "Granulometria de origem" },
      { k: "p10", r: "% que passa na peneira de 2,0 mm (nº 10)" },
      { k: "p200", r: "% que passa na peneira de 0,075 mm (nº 200)" },
      { k: "imp259", r: "Grupo MCT: importar de uma classificação (DNIT 259)", tipo: "importar", de: "dnit-259-2023-cla",
        aplicar: function (e, P) {
          var r = e.resultados || {};
          P.fonteMCT = "grupo"; P.grupo = r.grupo || ""; P.c = ok(r.c) ? fmt(r.c, 2) : ""; P.e = ok(r.e) ? fmt(r.e, 2) : "";
          P.mctOrigem = ((e.dados.ident || {}).registro || "exemplo") + " — DNIT 259: " + (r.grupo || "—");
        } },
      { k: "imp258", r: "…ou de um ensaio Mini-MCV (DNIT 258)", tipo: "importar", de: "dnit-258-2023-me",
        dica: "usa c' e e' do ensaio; o grupo é refeito pela Figura A1 da DNIT 259",
        aplicar: function (e, P) {
          var r = e.resultados || {};
          P.fonteMCT = "ce"; P.c = ok(r.c) ? fmt(r.c, 3) : ""; P.e = ok(r.e) ? fmt(r.e, 3) : ""; P.grupo = "";
          P.mctOrigem = ((e.dados.ident || {}).registro || "exemplo") + " — DNIT 258 (c' e e')";
        } },
      { k: "mctOrigem", r: "Classificação MCT de origem" },
      { k: "fonteMCT", r: "Grupo MCT da fração passando em 2,0 mm (5.1 d e 5.2)", tipo: "select", recarrega: true,
        opcoes: [["ce", "Pelos coeficientes c' e e' (Figura A1 da DNIT 259)"], ["grupo", "Grupo já classificado (DNIT 259)"]] },
      { k: "c", r: "Coeficiente c'", se: function (d) { return ((d.params || {}).fonteMCT || "ce") === "ce"; } },
      { k: "e", r: "Índice e'", se: function (d) { return ((d.params || {}).fonteMCT || "ce") === "ce"; } },
      { k: "grupo", r: "Grupo MCT", tipo: "select", opcoes: GRUPOS_OP, se: function (d) { return (d.params || {}).fonteMCT === "grupo"; } },
      { k: "massa", r: "Massa da amostra total (kg) — seção 4", dica: "50 kg: ¾ para a granulometria e ¼ para o MCT" },
    ],
    padrao: { fonteMCT: "ce" },
    tabelas: function () { return []; },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], r = { p10: num(P.p10), p200: num(P.p200) };
      r.ret10 = ok(r.p10) ? 100 - r.p10 : NaN;
      // grupo MCT
      if ((P.fonteMCT || "ce") === "grupo") { r.grupo = P.grupo || ""; r.c = num(P.c); r.e = num(P.e); }
      else { r.c = num(P.c); r.e = num(P.e); r.grupo = M.classificar(r.c, r.e); }
      if (!r.grupo) avisos.push("Informe o grupo MCT da fração passando em 2,0 mm (c' e e', ou o grupo da DNIT 259) — 5.1 d e 5.2.");
      // Tabela 1
      if (!ok(r.p10)) avisos.push("Informe a porcentagem que passa na peneira de 2,0 mm (5.1 b).");
      else {
        if (r.p10 > 100 || r.p10 < 0) avisos.push("Porcentagem passando fora de 0 a 100 %.");
        if (Math.abs(r.ret10 - 10) < 1e-9) avisos.push("Retido na 2,0 mm igual a 10 %: a Tabela 1 não define o caso (> 10 % G-MCT; < 10 % só MCT); adotada só a classificação MCT.");
        r.gm = r.ret10 > 10 + 1e-9;
        r.procedimento = r.gm ? "Classificação MCT (DNIT 259) e classificação G-MCT" : "Classificação MCT (DNIT 259)";
      }
      if (r.gm) {
        if (!ok(r.p200)) avisos.push("Informe a porcentagem que passa na peneira de 0,075 mm (5.1 c).");
        r.tipo = tipoGranulometrico(r.p10, r.p200, avisos);
        if (r.tipo && r.grupo) { r.gmct = r.tipo + "-" + r.grupo; r.q = Q[r.gmct]; }
      } else if (r.gm === false && r.grupo) r.gmct = "";
      r.classe = r.gm && r.grupo ? (r.grupo.charAt(0) === "L" ? "GL — granular com finos de comportamento laterítico (Quadro C1)" : "GN — granular com finos de comportamento não laterítico (Quadro C2)") : "";
      var massa = num(P.massa);
      if (ok(massa) && massa < 50) avisos.push("Amostra total de " + fmt(massa, 1) + " kg: a norma pede 50 kg (seção 4).");
      return { tab: {}, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, g = r.grupo && M.GRUPOS[r.grupo];
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(r.gmct ? esc(r.gmct) : r.gm === false ? esc(r.grupo || "—") : "—", r.gm === false ? "Retido na 2,0 mm ≤ 10 %: só a classificação MCT (Tabela 1)" : r.q ? esc(r.q[0]) + " — classificação G-MCT" : "Classificação G-MCT") +
        cx(r.tipo ? esc(r.tipo) : "—", r.tipo ? esc(TIPOS[r.tipo]) + " — tipo granulométrico (Tabela 2)" : "Tipo granulométrico (Tabela 2)") +
        cx(r.grupo ? esc(r.grupo) : "—", g ? esc(g.nome) + " — grupo MCT (DNIT 259)" : "Grupo MCT") +
        cx(ok(r.ret10) ? fmt(r.ret10, 1) + " %" : "—", "Retido na peneira de 2,0 mm (5.1 b)") + "</div>";
      if (r.q) h += '<table class="fe-resumo"><tr><th colspan="2">' + esc(r.gmct + " — " + r.classe) + "</th></tr>" +
        [["Suporte CBR", r.q[1]], ["Expansão CBR", r.q[2]], ["Contração", r.q[3]], ["Coeficiente de permeabilidade", r.q[4]], ["Uso (prioridade de escolha)", r.q[5]]].map(function (x) {
          return "<tr><td>" + esc(x[0]) + "</td><td>" + esc(x[1]) + "</td></tr>";
        }).join("") + "</table>";
      return h;
    },
    graficos: function (calc, d, opt) {
      var r = calc.resultados;
      return [grafB1(r.p10, r.p200, r.tipo, opt), M.grafico(r.c, r.e, r.grupo, opt)];
    },
    relatorio: {
      notas: "Tabela 1: retido na peneira de 2,0 mm > 10 % → classificação MCT e G-MCT; < 10 % → só MCT (DNIT 259). Tabela 2 / Figura B1: Gf se passa na 0,075 mm > 30 %; senão Ps (passa na 2,0 mm < 50 %) ou Sp (> 50 %). Os limites exatos (10 %, 30 % e 50 %) não são definidos pela norma: adotados MCT só, Ps/Sp e Sp, respectivamente. G-MCT = tipo granulométrico + grupo MCT da fração passando em 2,0 mm (5.1 e); descrições dos Quadros C1 (GL) e C2 (GN). O gráfico MCT é o da Figura A1 da DNIT 259.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [];
        if (P.granOrigem) rows.push(["Granulometria de origem", P.granOrigem]);
        rows.push(["Passa na 2,0 mm / na 0,075 mm", (ok(r.p10) ? fmt(r.p10, 1) : "—") + " % / " + (ok(r.p200) ? fmt(r.p200, 1) : "—") + " %"],
          ["Retido na 2,0 mm — procedimento (Tabela 1)", (ok(r.ret10) ? fmt(r.ret10, 1) + " %" : "—") + " — " + (r.procedimento || "—")]);
        if (P.mctOrigem) rows.push(["Classificação MCT de origem", P.mctOrigem]);
        rows.push(["Grupo MCT (fração < 2,0 mm)", (r.grupo || "—") + (ok(r.c) && ok(r.e) ? " (c' = " + fmt(r.c, 2) + "; e' = " + fmt(r.e, 2) + ")" : "")]);
        if (r.gm) rows.push(["Tipo granulométrico (Tabela 2)", r.tipo ? r.tipo + " — " + TIPOS[r.tipo] : "—"],
          ["Classificação G-MCT", r.gmct ? r.gmct + " — " + (r.q ? r.q[0] : "") : "—"]);
        if (r.q) rows.push(["Classe", r.classe], ["Propriedades (Quadro " + (r.grupo.charAt(0) === "L" ? "C1" : "C2") + ")", "Suporte CBR " + r.q[1].toLowerCase() + "; expansão " + r.q[2].toLowerCase() +
          "; contração " + r.q[3].toLowerCase() + "; permeabilidade " + r.q[4].toLowerCase()], ["Uso", r.q[5]]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Solo-brita da DNIT 412 (exemplo 2) + argila laterítica da DNIT 259 (exemplo 2) — Ps-LA'", dados: function () {
        var d = { ident: { registro: "EX-GMCT-001", obra: "Obra A", camada: "Base — cascalho laterítico", origem: "Jazida 4" }, params: { fonteMCT: "ce", massa: "50" } };
        var ids = [["dnit-412-2025-me", 1, "impGran"], ["dnit-259-2023-cla", 1, "imp259"]];
        ids.forEach(function (x) {
          var F = FE.FICHAS[x[0]], dd = F.exemplos[x[1]].dados();
          dd.params = Object.assign({}, F.padrao || {}, dd.params || {});
          var e = { ficha: x[0], dados: dd, resultados: F.calcular(dd).resultados };
          d.params[x[2]] = "ex:" + x[0] + ":" + x[1];
          FE.FICHAS["dnit-444-2023-cla"].params.filter(function (p) { return p.k === x[2]; })[0].aplicar(e, d.params, d);
        });
        return d;
      } },
      { nome: "Saprólito com pedregulho, finos acima de 30 % e amostra pequena — Gf-NS' (digitado)", dados: function () {
        return { ident: { registro: "EX-GMCT-002", obra: "Obra B", camada: "Subleito — saprólito com pedregulho", origem: "Jazida 6" },
          params: { p10: "72,5", p200: "41,0", fonteMCT: "ce", c: "1,10", e: "1,62", massa: "35" } };
      } },
      { nome: "Areia siltosa com pouco pedregulho — retido na 2,0 mm ≤ 10 %: só MCT (digitado)", dados: function () {
        return { ident: { registro: "EX-GMCT-003", obra: "Obra C", camada: "Aterro — areia siltosa", origem: "Jazida 7" },
          params: { p10: "93,0", p200: "24,0", fonteMCT: "grupo", grupo: "NA'", massa: "50" } };
      } },
    ],
  };
})();
