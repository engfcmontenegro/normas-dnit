/*
 * Ficha: DNIT 455/2025-PRO — Redução de amostra de campo de agregados para ensaio de laboratório (registro e verificação).
 * Três métodos: separador mecânico (6.1), quarteamento (6.2, sobre superfície ou lona) e amostragem de pequenos
 * estoques de agregado miúdo úmido (6.3). A ficha registra as divisões sucessivas (massas) ou as cinco tomadas e
 * confere contra a norma: calhas do separador (5.1 e Nota 2), umidade (Nota 3), revolvimentos e tronco de cone
 * (6.2 b/c, 6.3 b/c), número de tomadas (6.3 d) e a massa final frente à necessária para o ensaio (4 a e Nota 1).
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var TOL_METADE = 5;     // partes "iguais": porção mantida entre 45 % e 55 % da massa dividida (critério da ficha)
  var TOL_PERDA = 0.5;    // perda máxima numa divisão, % da massa dividida (critério da ficha)
  var TOL_TOMADA = 0.20;  // tomadas "aproximadamente iguais": ± 20 % da média (critério da ficha)

  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function met(d) { return ((d && d.params) || {}).metodo || "sep"; }
  function eh() { var l = arguments; return function (d) { return Array.prototype.indexOf.call(l, met(d)) >= 0; }; }
  var CHECK = [
    ["chkSepA", "6.1 a", "Amostra distribuída uniformemente de ponta a ponta do separador, com velocidade que deixa o agregado passar livremente pelas calhas", eh("sep")],
    ["chkSepB", "6.1 b", "Reintroduzida no separador a porção de um dos recipientes, tantas vezes quantas necessárias", eh("sep")],
    ["chkSup", "6.2 a e 6.3 a", "Superfície rígida, limpa e plana, sem perda de material nem contaminação", eh("quart", "estoque")],
    ["chkOpostos", "6.2 e", "Removidas duas partes diametralmente opostas, incluindo o material fino; espaços varridos ou escovados", eh("quart")],
    ["chkLona", "6.2 g e h", "Amostra bem misturada na lona com a pá ou rolando o material, levantando alternadamente as pontas opostas", eh("lona")],
    ["chkHaste", "6.2 i e j", "Divisão em quatro partes com a haste sob o centro do cone (duas passagens em ângulo reto) ou com a pá", eh("lona")],
    ["chkFinos", "6.2 k", "Removidos dois quartos diametralmente opostos sem perda dos finos que ficam no encerado", eh("lona")],
    ["chkAcaso", "6.3 d", "Tomadas em locais da superfície do cone escolhidos ao acaso", eh("estoque")],
  ];


  FE.FICHAS["dnit-455-2025-pro"] = {
    titulo: "Agregados — Redução de amostra de campo para ensaio de laboratório",
    resumo: "Registro e verificação da redução da amostra de campo: separador mecânico (6.1), quarteamento (6.2) ou tomadas em pequenos estoques de agregado miúdo úmido (6.3); massas de cada divisão, calhas, umidade, cone e massa final para o ensaio.",
    params: [
      { k: "metodo", r: "Método de redução (6)", tipo: "select", recarrega: true, opcoes: [
        ["sep", "Separador mecânico (6.1)"], ["quart", "Quarteamento sobre superfície (6.2 a–f)"],
        ["lona", "Quarteamento sobre lona (6.2 g–k)"], ["estoque", "Pequenos estoques de agregado miúdo úmido — 5 tomadas (6.3)"]] },
      { k: "agregado", r: "Agregado", tipo: "select", opcoes: [["graudo", "Graúdo"], ["miudo", "Miúdo"], ["mistura", "Mistura de graúdo e miúdo"]] },
      { k: "dmax", r: "Dimensão máxima característica (3.2)", ph: "mm" },
      { k: "passa95", r: "Passa integralmente na peneira de 9,5 mm? (Nota 2)", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]],
        se: function (d) { return met(d) === "sep" && (d.params || {}).agregado === "miudo"; } },
      { k: "nCalhas", r: "Número de calhas do separador (5.1 a/b)", se: eh("sep") },
      { k: "lCalha", r: "Largura de cada calha, mm (Nota 2)", se: eh("sep") },
      { k: "umidade", r: "Condição de umidade da amostra (Nota 3 e 6.3)", tipo: "select", se: eh("sep", "estoque"), opcoes: [
        ["", "— não informada"], ["seco", "Mais seca que saturada com superfície seca"], ["leve", "Levemente umedecida"], ["umido", "Úmida"]] },
      { k: "nRevolv", r: "Número de revolvimentos na homogeneização (6.2 b / 6.3 b)", se: eh("quart", "lona", "estoque") },
      { k: "dCone", r: "Diâmetro da base do cone achatado, cm (6.2 c / 6.3 c)", se: eh("quart", "lona", "estoque") },
      { k: "hCone", r: "Altura do tronco de cone, cm", se: eh("quart", "lona", "estoque") },
      { k: "poucas", r: "Poucas partículas de maior dimensão? (4 b)", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "mAlvo", r: "Massa necessária ao(s) ensaio(s) a que se destina, g (4 a)" },
      { k: "ensaio", r: "Ensaio(s) a que se destina" },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] }; })),
    padrao: { metodo: "sep", agregado: "graudo", passa95: "nao", umidade: "", poucas: "nao" },
    tabelas: function (d) {
      if (met(d) === "estoque") {
        return [{ chave: "tom", titulo: "Tomadas na superfície do cone (6.3 d)", rotulo: "Tomada", iniciais: 5, min: 1,
          linhas: [{ k: "m", r: "Massa da tomada", u: "g" }, { k: "pos", r: "Local no cone", texto: true, ph: "ex.: topo, flanco N" },
            { calc: "rel", r: "Desvio em relação à média das tomadas", u: "%", casas: 1 }],
          dica: "a norma pede cinco tomadas aproximadamente iguais" }];
      }
      return [{ chave: "div", titulo: "Divisões sucessivas", rotulo: "Divisão", iniciais: 3, min: 1,
        linhas: [
          { k: "mAntes", r: "Massa dividida (entrada da divisão)", u: "g" },
          { k: "mFica", r: "Porção mantida — segue na redução", u: "g" },
          { k: "mOutra", r: "Porção separada — reservada ou descartada (6.1 c)", u: "g" },
          { calc: "pFica", r: "Porção mantida / massa dividida", u: "%", casas: 1, destaque: true },
          { calc: "perda", r: "Perda: dividida − (mantida + separada)", u: "g", casas: 1 },
        ],
        dica: "uma coluna por passagem no separador ou por quarteamento; a massa dividida de uma divisão é a mantida da anterior" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], m = met(d), ag = P.agregado || "graudo";
      var dmax = num(P.dmax), alvo = num(P.mAlvo), r = { metodo: m };
      if (m === "sep") {
        var nc = num(P.nCalhas), lc = num(P.lCalha);
        if (ok(nc)) {
          if (ag === "miudo" && nc !== 12) avisos.push("Separador para agregado miúdo: a norma pede doze calhas de igual abertura (5.1 b); informado " + fmt(nc, 0) + ".");
          if (ag !== "miudo" && nc < 8) avisos.push("Separador para agregado graúdo: no mínimo oito calhas (5.1 a); informado " + fmt(nc, 0) + ".");
        }
        if (ok(lc) && ok(dmax)) {
          var lmin = 1.5 * dmax;
          r.lmin = lmin;
          var satisf = ag === "miudo" && P.passa95 === "sim" && lc >= 12.5;
          if (lc < lmin * 0.95 && !satisf) avisos.push("Calhas de " + fmt(lc, 1) + " mm: a largura mínima deve ser cerca de 50 % maior que a dimensão máxima característica, ≈ " + fmt(lmin, 1) + " mm (Nota 2" + (ag === "miudo" ? "; para miúdo passante na 9,5 mm, 12,5 mm é satisfatório" : "") + ").");
        }
        if (P.umidade) {
          if (ag === "miudo" && P.umidade !== "seco") avisos.push("Agregado miúdo no separador deve estar mais seco que a condição saturada com superfície seca (Nota 3).");
          if (ag !== "miudo" && P.umidade !== "leve") avisos.push("Agregado graúdo ou mistura no separador deve estar levemente umedecido, para evitar perda de finos (Nota 3).");
        }
      }
      if (m === "estoque") {
        if (ag !== "miudo") avisos.push("A redução por tomadas em pequenos estoques (6.3) é só para agregado miúdo úmido (5.3).");
        if (P.umidade && P.umidade !== "umido") avisos.push("A redução por tomadas (6.3) aplica-se ao agregado miúdo úmido; para amostra seca use o separador ou o quarteamento.");
      }
      if (m !== "sep") {
        var nr = num(P.nRevolv);
        if (ok(nr) && nr < 3) avisos.push("Homogeneização com " + fmt(nr, 0) + " revolvimento(s): a norma pede no mínimo três (" + (m === "estoque" ? "6.3 b" : "6.2 b") + ").");
        var dc = num(P.dCone), hc = num(P.hCone);
        r.dh = ok(dc) && ok(hc) && hc > 0 ? dc / hc : NaN;
        if (ok(r.dh)) {
          if (m !== "estoque" && (r.dh < 4 || r.dh > 8)) avisos.push("Tronco de cone com diâmetro/altura = " + fmt(r.dh, 1) + ": deve ser aproximadamente de 4 a 8 (6.2 c).");
          if (m === "estoque" && (r.dh < 0.75 || r.dh > 1.33)) avisos.push("Cone com diâmetro/altura = " + fmt(r.dh, 2) + ": em 6.3 c o cone é achatado a diâmetro e altura aproximadamente iguais (critério da ficha: 0,75 a 1,33).");
        }
      }
      if (P.poucas === "sim") avisos.push("Poucas partículas de maior dimensão: a inclusão ou exclusão de uma ou duas delas altera a amostra reduzida — cuidado redobrado na redução (4 b).");

      var tab = {};
      if (m === "estoque") {
        var ms = (d.tom || []).map(function (x) { return num(x.m); });
        var med = FE.media(ms), n = ms.filter(ok).length;
        tab.tom = ms.map(function (v) { return { rel: ok(v) && ok(med) && med > 0 ? (v / med - 1) * 100 : NaN }; });
        r.n = n; r.mIni = NaN; r.mFinal = n ? ms.filter(ok).reduce(function (a, b) { return a + b; }, 0) : NaN;
        if (n && n !== 5) avisos.push(fmt(n, 0) + " tomada(s): a quantidade desejada deve ser obtida por cinco tomadas (6.3 d).");
        ms.forEach(function (v, i) {
          if (ok(v) && ok(med) && Math.abs(v / med - 1) > TOL_TOMADA) avisos.push("Tomada " + (i + 1) + ": " + fmt(v, 0) + " g, " + fmt((v / med - 1) * 100, 0) + " % da média — as tomadas devem ser aproximadamente iguais (6.3 d; critério da ficha ± 20 %).");
        });
      } else {
        var ant = NaN;
        tab.div = (d.div || []).map(function (x, i) {
          var rot = "Divisão " + (i + 1), a = num(x.mAntes), f = num(x.mFica), o = num(x.mOutra), c = {};
          if (!ok(a) && ok(ant)) a = ant;
          c.pFica = ok(a) && ok(f) && a > 0 ? f / a * 100 : NaN;
          c.perda = ok(a) && ok(f) && ok(o) ? a - f - o : NaN;
          if (ok(c.pFica) && Math.abs(c.pFica - 50) > TOL_METADE) avisos.push(rot + ": porção mantida com " + fmt(c.pFica, 1) + " % da massa dividida — as metades (ou pares de quartos opostos) devem ser iguais (" + (m === "sep" ? "6.1 e Nota 2" : "6.2 d/j") + "; critério da ficha 50 ± 5 %).");
          if (ok(c.perda) && Math.abs(c.perda) > a * TOL_PERDA / 100) avisos.push(rot + ": diferença de " + fmt(c.perda, 1) + " g entre a massa dividida e as duas porções — confira perdas de material ou de finos (critério da ficha: 0,5 %).");
          if (ok(num(x.mAntes)) && ok(ant) && Math.abs(num(x.mAntes) - ant) > ant * 0.005) avisos.push(rot + ": a massa dividida (" + fmt(num(x.mAntes), 0) + " g) difere da porção mantida na divisão anterior (" + fmt(ant, 0) + " g).");
          if (i === 0) r.mIni = a;
          ant = ok(f) ? f : ant;
          c.f = f;
          return c;
        });
        r.n = tab.div.filter(function (c) { return ok(c.f); }).length;
        r.mFinal = ant;
      }
      r.fator = ok(r.mIni) && ok(r.mFinal) && r.mFinal > 0 ? r.mIni / r.mFinal : NaN;
      if (ok(alvo) && ok(r.mFinal)) {
        r.relAlvo = r.mFinal / alvo;
        if (r.mFinal < alvo) avisos.push("Massa reduzida de " + fmt(r.mFinal, 0) + " g é menor que a necessária ao ensaio (" + fmt(alvo, 0) + " g): recomponha a partir da porção reservada ou de nova amostra de campo (4 a).");
        else if (m !== "estoque" && r.mFinal >= 2 * alvo) avisos.push("Massa reduzida de " + fmt(r.mFinal, 0) + " g ainda é o dobro ou mais da necessária — pode ser feita mais uma divisão (" + (m === "sep" ? "6.1 b" : "6.2 f") + ").");
      }
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        if (!c[3](d)) return;
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.chk = chk; r.nAvisos = avisos.length;
      return { tab: tab, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(fmt(r.mFinal, 0) + " <small>g</small>", "Massa final da amostra reduzida (Nota 1: adotar a massa real) · " + st) +
        cx(fmt(r.n, 0), r.metodo === "estoque" ? "Tomadas (6.3 d)" : "Divisões realizadas") +
        (r.metodo === "estoque" ? "" : cx(ok(r.fator) ? "1 : " + fmt(r.fator, 1) : "—", "Fator de redução (massa inicial / final)")) +
        cx(c.feitos + " / " + c.total, "Operações confirmadas") + "</div>";
    },
    relatorio: {
      notas: "Redução conforme a DNIT 455/2025-PRO. Separador: no mínimo 8 calhas (graúdo) ou 12 calhas (miúdo), largura ≈ 1,5 × a dimensão máxima característica (12,5 mm satisfatório para miúdo passante na 9,5 mm); miúdo mais seco que a condição saturada com superfície seca e graúdo levemente umedecido (Nota 3). Quarteamento: pelo menos três revolvimentos, tronco de cone com diâmetro de 4 a 8 vezes a altura, remoção de quartos opostos com os finos. Pequenos estoques de miúdo úmido: cinco tomadas ao acaso. Adota-se a massa total reduzida real, sem arredondar ao valor do ensaio (Nota 1). Critérios da ficha: metades iguais a 50 ± 5 %, perda ≤ 0,5 % por divisão, tomadas iguais a ± 20 % da média.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.ensaio) rows.push(["Ensaio(s) a que se destina", P.ensaio]);
        if (ok(r.mIni)) rows.push(["Massa da amostra de campo dividida", fmt(r.mIni, 0) + " g"]);
        rows.push(["Massa final da amostra reduzida", fmt(r.mFinal, 0) + " g" + (ok(num(P.mAlvo)) ? " (necessária: " + fmt(num(P.mAlvo), 0) + " g)" : "")]);
        rows.push([r.metodo === "estoque" ? "Tomadas" : "Divisões", fmt(r.n, 0)]);
        if (ok(r.fator)) rows.push(["Fator de redução", "1 : " + fmt(r.fator, 1)]);
        if (ok(r.dh)) rows.push(["Cone achatado — diâmetro / altura", fmt(r.dh, 1)]);
        rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 19 mm — separador de 10 calhas, três divisões", dados: function () {
        return { ident: { registro: "EX-RA-001", data: "2025-08-12", obra: "Obra A", origem: "Pedreira X", camada: "Brita 1 — estoque" },
          params: { metodo: "sep", agregado: "graudo", dmax: "19", nCalhas: "10", lCalha: "32", umidade: "leve", poucas: "nao",
            mAlvo: "2500", ensaio: "Granulometria (DNIT 412-ME)", chkSepA: "sim", chkSepB: "sim" },
          div: [{ mAntes: "22480", mFica: "11265", mOutra: "11205" }, { mAntes: "11265", mFica: "5610", mOutra: "5648" },
            { mAntes: "5610", mFica: "2831", mOutra: "2776" }] };
      } },
      { nome: "Areia — quarteamento com homogeneização insuficiente e massa final curta", dados: function () {
        return { ident: { registro: "EX-RA-002", data: "2025-09-03", obra: "Obra B", origem: "Jazida 1", camada: "Areia média" },
          params: { metodo: "quart", agregado: "miudo", dmax: "4,75", nRevolv: "2", dCone: "60", hCone: "20", poucas: "nao",
            mAlvo: "1000", ensaio: "Equivalente de areia e granulometria", chkSup: "sim", chkOpostos: "nao" },
          div: [{ mAntes: "8150", mFica: "4480", mOutra: "3640" }, { mAntes: "4480", mFica: "2215", mOutra: "2240" },
            { mAntes: "2215", mFica: "985", mOutra: "1210" }] };
      } },
    ],
  };
})();
