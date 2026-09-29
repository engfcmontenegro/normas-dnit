/*
 * Ficha: DNER-PRO 179/94 — Guia para avaliação da resistência do concreto em estruturas.
 * Testemunhos (5.1): fc,est = D / (1,5 + 1/r) × resultado do testemunho, com correção por barras de aço (5.1.6);
 * ensaios indiretos (5.2: esclerometria, ultrassom, arrancamento, luva expansível, descolagem, penetração de pinos)
 * pela curva de correlação, válida só quando E = t·Sd ≤ 4 N/mm²; resistência "in situ" por localização (6.2) e
 * comparação com 1,2 × fck de projeto (6.3, recomendação). Registra-se em window.FE.
 * Expõe FE.correlacaoConcreto (ajuste da curva, t de Student e E), usado também pela DNER-PRO 206/94.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // ---------- curva de correlação (5.2) ----------
  // t de Student bilateral, 5 % (nível de 5 % de erro), por graus de liberdade
  var T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120,
    2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
  var T95_ALTO = [[30, 2.042], [40, 2.021], [60, 2.000], [120, 1.980], [Infinity, 1.960]];
  function tStudent(nu) {
    if (!ok(nu) || nu < 1) return NaN;
    if (nu <= 30) return T95[Math.round(nu) - 1];
    for (var i = 1; i < T95_ALTO.length; i++) {
      var a = T95_ALTO[i - 1], b = T95_ALTO[i];
      if (nu <= b[0]) {  // interpolação em 1/ν
        var ia = 1 / a[0], ib = b[0] === Infinity ? 0 : 1 / b[0];
        return a[1] + (b[1] - a[1]) * (ia - 1 / nu) / (ia - ib);
      }
    }
    return 1.96;
  }
  var CURVAS = [["linear", "Linear — fc = a + b·x"], ["exp", "Exponencial — fc = a·e^(b·x)"], ["pot", "Potência — fc = a·x^b"]];
  function fCurva(tipo, a, b) {
    if (tipo === "exp") return function (x) { return a * Math.exp(b * x); };
    if (tipo === "pot") return function (x) { return x > 0 ? a * Math.pow(x, b) : NaN; };
    return function (x) { return a + b * x; };
  }
  // mínimos quadrados (exponencial e potência linearizadas em ln); resíduos e Sd em N/mm² (MPa), ν = n − 2
  function ajustar(xs, ys, tipo) {
    var X = [], Y = [];
    xs.forEach(function (x, i) {
      var y = ys[i];
      if (!ok(x) || !ok(y)) return;
      if (tipo === "exp" && y <= 0) return;
      if (tipo === "pot" && (x <= 0 || y <= 0)) return;
      X.push(tipo === "pot" ? Math.log(x) : x);
      Y.push(tipo === "linear" ? y : Math.log(y));
    });
    var n = X.length;
    if (n < 3) return null;
    var mx = media(X), my = media(Y), sxx = 0, sxy = 0;
    for (var i = 0; i < n; i++) { sxx += (X[i] - mx) * (X[i] - mx); sxy += (X[i] - mx) * (Y[i] - my); }
    if (!sxx) return null;
    var b = sxy / sxx, a0 = my - b * mx, a = tipo === "linear" ? a0 : Math.exp(a0);
    var f = fCurva(tipo, a, b);
    var px = [], py = [];
    xs.forEach(function (x, i) { if (ok(x) && ok(ys[i]) && ok(f(x))) { px.push(x); py.push(ys[i]); } });
    var myy = media(py), sq = 0, st = 0;
    px.forEach(function (x, i) { sq += Math.pow(py[i] - f(x), 2); st += Math.pow(py[i] - myy, 2); });
    var nu = n - 2, Sd = Math.sqrt(sq / nu), t = tStudent(nu);
    return { tipo: tipo, a: a, b: b, f: f, n: n, nu: nu, Sd: Sd, t: t, E: t * Sd, r2: st ? 1 - sq / st : NaN,
      xmin: Math.min.apply(null, px), xmax: Math.max.apply(null, px) };
  }
  function textoCurva(c, u) {
    if (!c) return "—";
    var a = fmt(c.a, 3), b = fmt(c.b, c.tipo === "linear" ? 4 : 5);
    return c.tipo === "exp" ? "fc = " + a + " · e^(" + b + " · x)" : c.tipo === "pot" ? "fc = " + a + " · x^" + b : "fc = " + a + " + " + b + " · x";
  }
  FE.correlacaoConcreto = { tStudent: tStudent, ajustar: ajustar, fCurva: fCurva, CURVAS: CURVAS, textoCurva: textoCurva, EMAX: 4 };

  // ---------- métodos de ensaio indiretos (5.2.1 a 5.2.6) ----------
  var INDIRETOS = {
    nenhum: { nome: "Nenhum — só testemunhos" },
    esclerometria: { nome: "Dureza superficial — esclerometria (5.2.1)", x: "Índice esclerométrico médio", u: "IE" },
    ultrassom: { nome: "Pulso ultrassônico (5.2.2)", x: "Velocidade de propagação", u: "m/s" },
    arrancamento: { nome: "Arrancamento (5.2.3)", x: "Força de arrancamento", u: "kN" },
    luva: { nome: "Fratura do concreto — luva expansível (5.2.4)", x: "Índice de fratura", u: "N·m" },
    descolagem: { nome: "Descolagem (5.2.5)", x: "Tensão de descolagem", u: "MPa" },
    pinos: { nome: "Penetração de pinos (5.2.6)", x: "Penetração / comprimento exposto", u: "mm" },
  };
  function ind(P) { return INDIRETOS[P.indireto] || INDIRETOS.nenhum; }
  function temInd(P) { return P.indireto && P.indireto !== "nenhum"; }

  // testemunho: r, fc do testemunho, fator D/(1,5 + 1/r), fator das barras (5.1.6)
  function testemunho(x, P) {
    var o = {}, dir = String(x.dir || "").trim().toUpperCase().charAt(0);
    var dt = num(x.diam), h = num(x.alt), F = num(x.carga), fcDir = num(x.fcT);
    o.D = dir === "H" ? 2.5 : dir === "V" ? 2.3 : NaN;
    o.r = ok(dt) && ok(h) && dt > 0 ? h / dt : NaN;
    o.fcT = ok(fcDir) ? fcDir : ok(F) && ok(dt) && dt > 0 ? F * 1000 / (Math.PI * dt * dt / 4) : NaN;
    o.kD = ok(o.D) && ok(o.r) && o.r > 0 ? o.D / (1.5 + 1 / o.r) : NaN;
    o.fcEst = ok(o.kD) && ok(o.fcT) ? o.kD * o.fcT : NaN;
    var soma = 0, nb = 0;
    [["b1", "d1"], ["b2", "d2"], ["b3", "d3"]].forEach(function (k) {
      var fb = num(x[k[0]]), db = num(x[k[1]]);
      if (ok(fb) && fb > 0 && ok(db)) { soma += fb * db; nb++; }
    });
    o.nb = nb;
    o.kB = nb && ok(dt) && ok(h) && dt > 0 && h > 0 ? 1 + 1.5 * soma / (dt * h) : 1;
    o.fcFinal = ok(o.fcEst) ? o.fcEst * o.kB : NaN;
    o.dir = dir;
    return o;
  }

  FE.FICHAS["dner-pro-179-94"] = {
    titulo: "Concreto — Avaliação da resistência em estruturas (testemunhos e ensaios indiretos)",
    rotuloImportar: function (r) { return "fc,in situ mín. " + (ok(r.min) ? fmt(r.min, 1) + " MPa" : "—") + " · " + (r.nLoc || 0) + " localização(ões)"; },
    resumo: "Testemunhos: fc,est = D/(1,5 + 1/r) × resultado, D = 2,5 (horizontal) ou 2,3 (vertical), com fator 1 + 1,5·ΣØᵢ·d/(Øt·h) para barras (5.1.6); ensaios indiretos pela curva de correlação, aceita só com E = t·Sd ≤ 4 N/mm² (5.2); resistência por localização (6.2) comparada com 1,2 × fck (6.3).",
    blocos: [],
    params: [
      { k: "elemento", r: "Elemento / parte da estrutura inspecionada", ph: "ex.: viga V3 — vão central" },
      { k: "motivo", r: "Motivo da inspeção (4.1)", tipo: "select",
        opcoes: [["", "—"], ["a", "a) dúvida sobre a resistência (resistência estimada nos CPs)"], ["b", "b) dúvida na execução (dosagem, mistura, lançamento, adensamento, cura)"],
          ["c", "c) deterioração (sobrecarga, fadiga, ação química, fogo, água, explosão...)"], ["d", "d) confirmação da resistência para sistema de carga antigo, atual ou novo uso"]] },
      { k: "fck", r: "fck de projeto (MPa)", dica: "resistência característica de projeto (3.5)" },
      { k: "fator", r: "Nível mínimo aceitável = fator × fck (6.3)", ph: "1,2", dica: "a norma recomenda não inferior a 1,2 × fck; a decisão é do engenheiro (6.3 e 6.4)" },
      { k: "dmax", r: "Diâmetro máximo do agregado do concreto (mm)", dica: "Øt ≥ 3 × diâmetro máximo (5.1.3 b)" },
      { k: "indireto", r: "Ensaio indireto (5.2)", tipo: "select", recarrega: true,
        opcoes: Object.keys(INDIRETOS).map(function (k) { return [k, INDIRETOS[k].nome]; }) },
      { k: "curva", r: "Forma da curva de correlação", tipo: "select", opcoes: CURVAS, se: function (d) { return temInd(d.params || {}); } },
      { k: "corrModo", r: "Curva de correlação (5.2)", tipo: "select", recarrega: true,
        opcoes: [["pares", "Ajustar agora — pares CP × leitura (tabela)"], ["coef", "Curva já estabelecida — informar a, b e E"]],
        se: function (d) { return temInd(d.params || {}); } },
      { k: "ca", r: "Coeficiente a da curva", se: function (d) { var P = d.params || {}; return temInd(P) && P.corrModo === "coef"; } },
      { k: "cb", r: "Coeficiente b da curva", se: function (d) { var P = d.params || {}; return temInd(P) && P.corrModo === "coef"; } },
      { k: "cE", r: "E = t·Sd da curva estabelecida (N/mm²)", dica: "deve ser ≤ 4 N/mm² (5.2)", se: function (d) { var P = d.params || {}; return temInd(P) && P.corrModo === "coef"; } },
      { k: "cOrigem", r: "Como a curva foi obtida", ph: "ex.: 30 pares, a/c 0,45 a 0,65, idades 7 a 90 dias", se: function (d) { return temInd(d.params || {}); } },
    ],
    padrao: { indireto: "nenhum", curva: "linear", corrModo: "pares", fator: "1,2" },
    tabelas: function (d) {
      var P = d.params || {}, I = ind(P), tabs = [];
      tabs.push({ chave: "tes", titulo: "Testemunhos extraídos (5.1)", rotulo: "Testemunho", iniciais: 3, min: 1,
        dica: "extraídos, preparados e rompidos conforme a ABNT NB-695 (NBR 7680); informe o resultado bruto (carga/área), sem as correções de h/d da NBR 7680, pois a eq. de 5.1.6 já corrige a esbeltez",
        linhas: [
          { k: "loc", r: "Localização (3.4) / identificação", texto: true },
          { k: "dir", r: "Extração: H (horizontal) ou V (vertical)", texto: true, ph: "H" },
          { k: "diam", r: "Diâmetro do testemunho Øt", u: "mm" },
          { k: "alt", r: "Altura do testemunho h", u: "mm" },
          { k: "carga", r: "Carga de ruptura", u: "kN" },
          { k: "fcT", r: "ou resistência do testemunho já calculada (3.2)", u: "MPa" },
          { grupo: "Barras de aço perpendiculares ao eixo (5.1.6 b) — deixe em branco se não houver" },
          { k: "b1", r: "Barra 1 — diâmetro Ø₁", u: "mm" }, { k: "d1", r: "Barra 1 — distância ao topo mais próximo d", u: "mm" },
          { k: "b2", r: "Barra 2 — diâmetro Ø₂", u: "mm" }, { k: "d2", r: "Barra 2 — distância ao topo mais próximo d", u: "mm" },
          { k: "b3", r: "Barra 3 — diâmetro Ø₃", u: "mm" }, { k: "d3", r: "Barra 3 — distância ao topo mais próximo d", u: "mm" },
          { calc: "r", r: "r = h / Øt", u: "", casas: 2 },
          { calc: "fcT", r: "Resultado do testemunho", u: "MPa", casas: 1 },
          { calc: "kD", r: "D / (1,5 + 1/r) (5.1.6 a)", u: "", casas: 3 },
          { calc: "kB", r: "Fator das barras 1 + 1,5·ΣØᵢ·d / (Øt·h) (5.1.6 b)", u: "", casas: 3 },
          { calc: "fcFinal", r: "fc,est in situ", u: "MPa", casas: 1, destaque: true },
        ] });
      if (temInd(P)) {
        if (P.corrModo !== "coef") tabs.push({ chave: "cor", titulo: "Curva de correlação — pares obtidos sobre a mistura (5.2)", rotulo: "Par", iniciais: 6, min: 3,
          dica: "recomenda-se 30 pares, variando o fator água/cimento e a idade de ensaio; CPs moldados e curados conforme a ABNT MB-2 e MB-3 (6.3)",
          linhas: [
            { k: "x", r: I.x + " (x)", u: I.u },
            { k: "fc", r: "Resistência do corpo de prova (3.1)", u: "MPa" },
            { calc: "fcAj", r: "fc pela curva", u: "MPa", casas: 1 },
            { calc: "res", r: "Resíduo", u: "MPa", casas: 2 },
          ] });
        tabs.push({ chave: "ind", titulo: "Ensaios indiretos na estrutura — " + I.nome, rotulo: "Leitura", iniciais: 3, min: 1,
          dica: "uma coluna por localização (média das leituras individuais da localização, 6.2)",
          linhas: [
            { k: "loc", r: "Localização (3.4)", texto: true },
            { k: "idade", r: "Idade do concreto", u: "dias" },
            { k: "x", r: I.x + " (média)", u: I.u },
            { k: "n", r: "Número de leituras individuais", u: "" },
            { calc: "fc", r: "fc,est in situ pela curva", u: "MPa", casas: 1, destaque: true },
          ] });
      }
      return tabs;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], I = ind(P), fck = num(P.fck), fator = ok(num(P.fator)) ? num(P.fator) : 1.2, dmax = num(P.dmax);
      var locs = {}, ordem = [];
      function addLoc(nome, tipo, v) {
        if (!ok(v)) return;
        if (!locs[nome]) { locs[nome] = { nome: nome, tes: [], ind: [] }; ordem.push(nome); }
        locs[nome][tipo].push(v);
      }
      // testemunhos
      var tes = (d.tes || []).map(function (x, i) {
        var o = testemunho(x, P), rot = "Testemunho " + (i + 1) + (x.loc ? " (" + x.loc + ")" : "");
        var dt = num(x.diam);
        if ((ok(num(x.carga)) || ok(num(x.fcT))) && !ok(o.D)) avisos.push(rot + ": informe a direção de extração — H (D = 2,5) ou V (D = 2,3) (5.1.6 a).");
        if (ok(o.r) && o.r < 0.95) avisos.push(rot + ": altura/diâmetro = " + fmt(o.r, 2) + " — o comprimento deve ser no mínimo 95 % do diâmetro (5.1.3 a).");
        if (ok(dt) && ok(dmax) && dt < 3 * dmax) avisos.push(rot + ": diâmetro de " + fmt(dt, 0) + " mm menor que 3 × o diâmetro máximo do agregado (" + fmt(3 * dmax, 0) + " mm) (5.1.3 b).");
        if (o.nb) avisos.push(rot + ": contém " + o.nb + " barra(s) de aço — aplicado o fator " + fmt(o.kB, 3) + " (5.1.6 b); os pontos de extração devem evitar barras (5.1.1).");
        addLoc(x.loc ? String(x.loc).trim() : "Testemunho " + (i + 1), "tes", o.fcFinal);
        return o;
      });
      // curva de correlação
      var curva = null, corTab = [];
      if (temInd(P)) {
        if (P.corrModo === "coef") {
          var a = num(P.ca), b = num(P.cb), E = num(P.cE);
          if (ok(a) && ok(b)) curva = { tipo: P.curva || "linear", a: a, b: b, f: fCurva(P.curva || "linear", a, b), E: E, informada: true };
          else avisos.push("Informe os coeficientes a e b da curva de correlação.");
          if (!ok(E)) avisos.push("Informe o E = t·Sd da curva estabelecida: ela só pode ser usada com E ≤ 4 N/mm² (5.2).");
        } else {
          var xs = (d.cor || []).map(function (x) { return num(x.x); }), ys = (d.cor || []).map(function (x) { return num(x.fc); });
          curva = ajustar(xs, ys, P.curva || "linear");
          corTab = (d.cor || []).map(function (x) {
            var xv = num(x.x), yv = num(x.fc), o = {};
            if (curva && ok(xv)) { o.fcAj = curva.f(xv); if (ok(yv)) o.res = yv - o.fcAj; }
            return o;
          });
          if (!curva) avisos.push("A curva de correlação precisa de pelo menos 3 pares completos (ajuste com n − 2 graus de liberdade).");
          else if (curva.n < 30) avisos.push("Curva com " + curva.n + " pares — recomenda-se obtê-la com 30 resultados, variando o fator água/cimento e a idade (5.2).");
        }
        if (curva && ok(curva.E) && curva.E > 4 + 1e-9) avisos.push("E = t·Sd = " + fmt(curva.E, 2) + " N/mm² > 4 N/mm²: a curva de correlação NÃO pode ser usada para estimar a resistência in situ (5.2).");
      }
      var curvaValida = !!(curva && ok(curva.E) && curva.E <= 4 + 1e-9);
      var indTab = (temInd(P) ? d.ind || [] : []).map(function (x, i) {
        var o = {}, xv = num(x.x), id = num(x.idade), rot = "Leitura " + (i + 1) + (x.loc ? " (" + x.loc + ")" : "");
        if (curva && ok(xv)) {
          o.fc = curva.f(xv);
          if (curva.xmin !== undefined && (xv < curva.xmin || xv > curva.xmax)) avisos.push(rot + ": leitura " + fmt(xv, 1) + " " + I.u + " fora do intervalo da curva de correlação (" + fmt(curva.xmin, 1) + " a " + fmt(curva.xmax, 1) + ") — extrapolação.");
        }
        if (P.indireto === "esclerometria" && ok(id)) {
          if (id < 3) avisos.push(rot + ": concreto com " + fmt(id, 0) + " dia(s) — a esclerometria se limita a idades entre 3 dias e 3 meses; abaixo de 3 dias há danos e grande variação (5.2.1).");
          else if (id > 90) avisos.push(rot + ": concreto com " + fmt(id, 0) + " dias — acima de 3 meses a carbonatação faz a esclerometria superestimar a resistência (5.2.1).");
        }
        if (P.indireto === "descolagem" && ok(id) && id > 90) avisos.push(rot + ": concreto com mais de 3 meses — a descolagem superestima a resistência em superfície carbonatada (5.2.5).");
        if (curvaValida) addLoc(x.loc ? String(x.loc).trim() : "Leitura " + (i + 1), "ind", o.fc);
        return o;
      });
      // resistência in situ por localização (6.2): testemunhos (medida direta, 5) têm precedência
      var lista = ordem.map(function (nome) {
        var L = locs[nome], base = L.tes.length ? L.tes : L.ind;
        var v = media(base), amp = base.length > 1 ? (Math.max.apply(null, base) - Math.min.apply(null, base)) / v * 100 : NaN;
        if (ok(amp) && amp > 20) avisos.push(nome + ": resultados individuais variam " + fmt(amp, 0) + " % em relação à média — se a variação não puder ser tomada como erro de ensaio, faça novos ensaios (6.1 e 6.2; alerta a partir de 20 %, critério da ficha).");
        return { nome: nome, fc: v, n: base.length, metodo: L.tes.length ? "testemunho(s)" : "ensaio indireto", fcInd: media(L.ind), nInd: L.ind.length, nTes: L.tes.length };
      });
      var vals = lista.map(function (l) { return l.fc; }).filter(ok);
      var lim = ok(fck) ? fator * fck : NaN;
      lista.forEach(function (l) { l.atende = ok(lim) && ok(l.fc) ? l.fc >= lim - 1e-9 : null; });
      var abaixo = lista.filter(function (l) { return l.atende === false; });
      if (abaixo.length) avisos.push(abaixo.length + " localização(ões) abaixo de " + fmt(fator, 2) + " × fck = " + fmt(lim, 1) + " MPa: " +
        abaixo.map(function (l) { return l.nome + " (" + fmt(l.fc, 1) + " MPa)"; }).join("; ") + ". A decisão cabe ao engenheiro — aceitação, restauração ou demolição; considerar prova de carga (6.4).");
      if (!ok(fck) && vals.length) avisos.push("Informe o fck de projeto para comparar a resistência in situ com o nível recomendado (6.3).");
      if (temInd(P) && !curvaValida && (d.ind || []).some(function (x) { return ok(num(x.x)); })) avisos.push("Leituras indiretas sem curva de correlação válida não entram na resistência in situ (5.2).");
      var R = { lista: lista, nLoc: vals.length, min: vals.length ? Math.min.apply(null, vals) : NaN, media: media(vals), lim: lim, fator: fator, fck: fck,
        curva: curva ? { tipo: curva.tipo, a: curva.a, b: curva.b, n: curva.n, Sd: curva.Sd, t: curva.t, E: curva.E, r2: curva.r2, informada: !!curva.informada, xmin: curva.xmin, xmax: curva.xmax } : null,
        curvaValida: curvaValida, conforme: ok(lim) && vals.length ? !abaixo.length : null };
      return { tab: { tes: tes, cor: corTab, ind: indTab }, resultados: R, avisos: avisos, _curva: curva };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(fmt(r.min, 1) + " <small>MPa</small>", "Menor resistência in situ por localização" + (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">≥ ' + fmt(r.fator, 2) + " × fck</span>" : ' · <span class="fe-nok">abaixo de ' + fmt(r.fator, 2) + " × fck</span>")) +
        cx(fmt(r.media, 1) + " <small>MPa</small>", "Média das " + r.nLoc + " localização(ões)") +
        cx(ok(r.lim) ? fmt(r.lim, 1) + " MPa" : "—", "Nível recomendado " + fmt(r.fator, 2) + " × fck (6.3)", true);
      if (r.curva) h += cx(ok(r.curva.E) ? fmt(r.curva.E, 2) + " N/mm²" : "—", "E = t·Sd da curva (≤ 4 N/mm², 5.2) · " +
        (r.curvaValida ? '<span class="fe-ok">curva utilizável</span>' : '<span class="fe-nok">curva não utilizável</span>'), true);
      h += "</div>";
      if (r.lista.length) {
        h += '<table class="fe-resumo"><tr><th>Localização</th><th>Base</th><th>n</th><th>fc,est in situ (MPa)</th><th>Indireto (MPa)</th><th>≥ ' + fmt(r.fator, 2) + ' × fck</th></tr>' +
          r.lista.map(function (l) {
            return "<tr><td>" + esc(l.nome) + "</td><td>" + l.metodo + "</td><td>" + l.n + "</td><td><b>" + fmt(l.fc, 1) + "</b></td><td>" + (l.nInd && l.nTes ? fmt(l.fcInd, 1) : "—") + "</td><td>" +
              (l.atende === null ? "—" : l.atende ? '<span class="fe-ok">sim</span>' : '<span class="fe-nok">não</span>') + "</td></tr>";
          }).join("") + "</table>";
      }
      if (r.curva) h += '<p class="fe-res-r" style="margin-top:6px">Curva: ' + esc(textoCurva(r.curva)) + (r.curva.informada ? " (informada)" :
        " · n = " + r.curva.n + " · Sd = " + fmt(r.curva.Sd, 2) + " MPa · t(ν = " + (r.curva.n - 2) + ") = " + fmt(r.curva.t, 3) + " · R² = " + fmt(r.curva.r2, 3)) + "</p>";
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var r = calc.resultados, P = d.params || {}, out = [], imp = opt.imprimir;
      var txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", azul = imp ? "#1f5fbf" : "#4f8cff",
        verm = imp ? "#c0392b" : "#e5534b", verde = imp ? "#2e8b57" : "#34c38f", ambar = imp ? "#c77d12" : "#e0a13a";
      var W = opt.w || 560, H = opt.h || 300, m = { l: 52, r: 16, t: 14, b: 44 };
      function svg(inner) { return '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">' + inner + "</svg>"; }
      function passo(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), k = v / p; return (k > 5 ? 2 : k > 2 ? 1 : 0.5) * p; }
      // 1) curva de correlação
      var c = calc._curva, I = ind(P);
      var pares = (d.cor || []).map(function (x) { return [num(x.x), num(x.fc)]; }).filter(function (p) { return ok(p[0]) && ok(p[1]); });
      var leit = (d.ind || []).map(function (x, i) { return [num(x.x), (calc.tab.ind[i] || {}).fc]; }).filter(function (p) { return ok(p[0]) && ok(p[1]); });
      if (temInd(P) && c && (pares.length || leit.length)) {
        var allx = pares.map(function (p) { return p[0]; }).concat(leit.map(function (p) { return p[0]; }));
        var ally = pares.map(function (p) { return p[1]; }).concat(leit.map(function (p) { return p[1]; }));
        var x0 = Math.min.apply(null, allx), x1 = Math.max.apply(null, allx), dx = (x1 - x0) * 0.08 || Math.abs(x0) * 0.1 || 1;
        x0 -= dx; x1 += dx;
        var y0 = 0, y1 = Math.max.apply(null, ally.concat([ok(r.lim) ? r.lim : 0])) * 1.15;
        var px = passo((x1 - x0) / 6), py = passo(y1 / 6);
        var X = function (v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }, Y = function (v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); };
        var s = "";
        for (var gx = Math.ceil(x0 / px) * px; gx <= x1; gx += px) s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + X(gx) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + fmt(gx, px < 1 ? 1 : 0) + "</text>";
        for (var gy = 0; gy <= y1; gy += py) s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(gy, 0) + "</text>";
        s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
        s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">' + esc(I.x + " (" + I.u + ")") + "</text>";
        s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">fc (MPa)</text>';
        var dc = "", de1 = "", de2 = "";
        for (var k = 0; k <= 60; k++) {
          var xv = x0 + (x1 - x0) * k / 60, yv = c.f(xv);
          if (!ok(yv)) continue;
          var cl = function (v) { return Math.max(y0, Math.min(y1, v)); };
          dc += (dc ? " L" : "M") + X(xv).toFixed(1) + " " + Y(cl(yv)).toFixed(1);
          if (ok(c.E)) { de1 += (de1 ? " L" : "M") + X(xv).toFixed(1) + " " + Y(cl(yv + c.E)).toFixed(1); de2 += (de2 ? " L" : "M") + X(xv).toFixed(1) + " " + Y(cl(yv - c.E)).toFixed(1); }
        }
        s += '<path d="' + dc + '" fill="none" stroke="' + azul + '" stroke-width="2"/>';
        if (de1) s += '<path d="' + de1 + '" fill="none" stroke="' + azul + '" stroke-dasharray="4 3"/><path d="' + de2 + '" fill="none" stroke="' + azul + '" stroke-dasharray="4 3"/>';
        if (ok(r.lim)) s += '<line x1="' + m.l + '" y1="' + Y(r.lim) + '" x2="' + (W - m.r) + '" y2="' + Y(r.lim) + '" stroke="' + verm + '" stroke-dasharray="6 3"/><text x="' + (W - m.r - 4) + '" y="' + (Y(r.lim) - 4) + '" text-anchor="end" fill="' + verm + '">' + fmt(r.fator, 2) + " × fck</text>";
        pares.forEach(function (p) { s += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="3.5" fill="' + azul + '"/>'; });
        leit.forEach(function (p) { s += '<rect x="' + (X(p[0]) - 4) + '" y="' + (Y(p[1]) - 4) + '" width="8" height="8" fill="none" stroke="' + ambar + '" stroke-width="2"/>'; });
        s += '<text x="' + (m.l + 6) + '" y="' + (m.t + 12) + '" fill="' + txt + '">● pares CP × leitura   □ leituras na estrutura   --- ± E = ' + fmt(c.E, 2) + " N/mm²</text>";
        out.push(svg(s));
      }
      // 2) resistência in situ por localização
      var L = r.lista.filter(function (l) { return ok(l.fc); });
      if (L.length) {
        var ymax = Math.max.apply(null, L.map(function (l) { return l.fc; }).concat([ok(r.lim) ? r.lim : 0])) * 1.18, p2 = passo(ymax / 6);
        var Yb = function (v) { return H - m.b - v / ymax * (H - m.t - m.b); }, bw = (W - m.l - m.r) / L.length;
        var s2 = "";
        for (var gy2 = 0; gy2 <= ymax; gy2 += p2) s2 += '<line x1="' + m.l + '" y1="' + Yb(gy2) + '" x2="' + (W - m.r) + '" y2="' + Yb(gy2) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 6) + '" y="' + (Yb(gy2) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(gy2, 0) + "</text>";
        L.forEach(function (l, i) {
          var x = m.l + i * bw + bw * 0.2, w = bw * 0.6, cor = l.atende === false ? verm : l.atende ? verde : azul;
          s2 += '<rect x="' + x + '" y="' + Yb(l.fc) + '" width="' + w + '" height="' + (Yb(0) - Yb(l.fc)) + '" fill="' + cor + '" opacity="0.8"/>';
          s2 += '<text x="' + (x + w / 2) + '" y="' + (Yb(l.fc) - 4) + '" text-anchor="middle" fill="' + txt + '">' + fmt(l.fc, 1) + "</text>";
          s2 += '<text x="' + (x + w / 2) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + esc(l.nome.length > 14 ? l.nome.slice(0, 13) + "…" : l.nome) + "</text>";
        });
        if (ok(r.lim)) s2 += '<line x1="' + m.l + '" y1="' + Yb(r.lim) + '" x2="' + (W - m.r) + '" y2="' + Yb(r.lim) + '" stroke="' + verm + '" stroke-dasharray="6 3"/><text x="' + (W - m.r - 4) + '" y="' + (Yb(r.lim) - 4) + '" text-anchor="end" fill="' + verm + '">' + fmt(r.fator, 2) + " × fck = " + fmt(r.lim, 1) + " MPa</text>";
        s2 += '<line x1="' + m.l + '" y1="' + Yb(0) + '" x2="' + (W - m.r) + '" y2="' + Yb(0) + '" stroke="' + txt + '"/>';
        s2 += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">fc,est in situ (MPa)</text>';
        s2 += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Localização (6.2)</text>';
        out.push(svg(s2));
      }
      if (!out.length) out.push('<div class="fe-graf-vazio">Os gráficos aparecem com testemunhos ou leituras calculados.</div>');
      return out;
    },
    relatorio: {
      notas: "Testemunhos sem barra: fc,est = D/(1,5 + 1/r) × resultado do testemunho, D = 2,5 (extraído horizontalmente) ou 2,3 (verticalmente), r = altura/diâmetro (5.1.6 a); com barras perpendiculares ao eixo, multiplica-se por 1,0 + 1,5·ΣØᵢ·d/(Øt·h) (5.1.6 b; a ficha usa a distância d de cada barra). Dimensões: h ≥ 0,95 Øt e Øt ≥ 3 × diâmetro máximo do agregado (5.1.3). Ensaios indiretos: curva de correlação estabelecida sobre a mistura, usada só se E = t·Sd ≤ 4 N/mm², t de Student bilateral a 5 % com ν = n − 2 e Sd = desvio padrão dos resíduos (5.2). Resistência in situ de cada localização = média dos resultados da localização (6.2); onde há testemunhos, eles prevalecem (medida direta, seção 5). Nível recomendado: não inferior a 1,2 × fck (6.3); a decisão é do engenheiro, que deve considerar prova de carga (6.4). Alerta de variação > 20 % numa localização: critério da ficha.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.elemento) rows.push(["Elemento inspecionado", P.elemento]);
        r.lista.forEach(function (l) {
          rows.push(["Localização " + l.nome, fmt(l.fc, 1) + " MPa — " + l.metodo + " (n = " + l.n + ")" + (l.nInd && l.nTes ? "; indireto: " + fmt(l.fcInd, 1) + " MPa" : "") +
            (l.atende === null ? "" : l.atende ? " — atende" : " — ABAIXO de " + fmt(r.fator, 2) + " × fck")]);
        });
        rows.push(["Menor / média das localizações", fmt(r.min, 1) + " / " + fmt(r.media, 1) + " MPa"]);
        if (ok(r.lim)) rows.push(["Nível recomendado (6.3)", fmt(r.fator, 2) + " × " + fmt(r.fck, 1) + " = " + fmt(r.lim, 1) + " MPa — " + (r.conforme ? "todas as localizações atendem" : "há localização abaixo: decisão do engenheiro (6.4)")]);
        if (r.curva) {
          rows.push(["Curva de correlação (5.2)", textoCurva(r.curva) + (r.curva.informada ? " (informada" + (P.cOrigem ? ": " + P.cOrigem : "") + ")" :
            " — n = " + r.curva.n + ", Sd = " + fmt(r.curva.Sd, 2) + " MPa, t = " + fmt(r.curva.t, 3) + ", R² = " + fmt(r.curva.r2, 3) + (P.cOrigem ? "; " + P.cOrigem : ""))]);
          rows.push(["E = t·Sd", fmt(r.curva.E, 2) + " N/mm² — " + (r.curvaValida ? "≤ 4 N/mm²: curva utilizável" : "> 4 N/mm² ou não informado: curva NÃO utilizável")]);
        }
        return rows;
      },
    },
    exemplos: [
      { nome: "Viga — 3 testemunhos + esclerometria com curva de 12 pares (atende)", dados: function () {
        return { ident: { registro: "EX-RC-001", obra: "Obra A", local: "Viga V3 — vão central", data: "2025-09-15" },
          params: { elemento: "Viga V3", motivo: "a", fck: "25", fator: "1,2", dmax: "19", indireto: "esclerometria", curva: "linear", corrModo: "pares",
            cOrigem: "12 pares CP × índice esclerométrico, a/c 0,45 a 0,65, idades de 7 a 63 dias" },
          tes: [{ loc: "L1", dir: "H", diam: "100", alt: "200", carga: "196,0" }, { loc: "L1", dir: "H", diam: "100", alt: "195", carga: "205,5" },
            { loc: "L2", dir: "H", diam: "100", alt: "170", carga: "190,0", b1: "10", d1: "60" }],
          cor: [["24", "18,5"], ["26", "21,0"], ["27", "22,6"], ["29", "25,1"], ["30", "26,8"], ["31", "27,9"], ["33", "31,2"], ["34", "32,0"],
            ["35", "34,1"], ["37", "36,8"], ["38", "38,9"], ["40", "41,5"]].map(function (p) { return { x: p[0], fc: p[1] }; }),
          ind: [{ loc: "L3", idade: "56", x: "34,5", n: "16" }, { loc: "L4", idade: "56", x: "33,0", n: "16" }, { loc: "L1", idade: "56", x: "33,5", n: "16" }] };
      } },
      { nome: "Pilar — testemunho curto, curva com E > 4 N/mm² e localização abaixo de 1,2 fck", dados: function () {
        return { ident: { registro: "EX-RC-002", obra: "Obra B", local: "Pilar P7", data: "2025-10-02" },
          params: { elemento: "Pilar P7 — térreo", motivo: "b", fck: "30", fator: "1,2", dmax: "25", indireto: "ultrassom", curva: "exp", corrModo: "pares" },
          tes: [{ loc: "Base", dir: "V", diam: "75", alt: "65", carga: "140" }, { loc: "Meio", dir: "H", diam: "100", alt: "200", carga: "265", b1: "16", d1: "70", b2: "12", d2: "120" }],
          cor: [["3900", "22"], ["4050", "30"], ["4150", "25"], ["4250", "36"], ["4300", "29"], ["4400", "41"], ["4500", "33"]].map(function (p) { return { x: p[0], fc: p[1] }; }),
          ind: [{ loc: "Topo", idade: "150", x: "4200", n: "5" }] };
      } },
    ],
  };
})();
