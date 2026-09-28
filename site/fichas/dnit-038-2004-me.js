/*
 * Ficha: DNIT 038/2004-ME — Pavimento rígido — Selante de juntas — Índice de fluidez.
 * Este arquivo também define o código comum às fichas de selante de juntas (DNIT 038 a 045, 051 e 052/2004-ME),
 * exposto em window.FE.selantes: limites da DNIT 046/2004-EM, séries de corpos-de-prova (cura normal,
 * estufa, intemperismo), variação após envelhecimento (DNIT 044/045, seção 6) e trechos de HTML.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // =====================================================================================
  // Código comum — window.FE.selantes
  // =====================================================================================
  var S = {};

  // tipos de junta da DNIT 046/2004-EM (seção 5) — parâmetro opcional das fichas
  S.JUNTAS = [["", "Não verificar"], ["retracao", "Junta transversal de retração (5.1)"],
    ["articulacao", "Junta longitudinal de articulação (5.2)"], ["expansao", "Junta de expansão ou de dilatação (5.3)"]];
  // requisitos da DNIT 046/2004-EM por tipo de junta
  function L(v, op, sec) { return { v: v, op: op, sec: sec }; }
  S.LIM = {
    retracao: { aderencia: L(10, "<", "5.1 a"), alongTracao: L(100, "≥", "5.1 b"), dpComp: L(50, "<", "5.1 c"),
      absorcao: L(5, "<", "5.1 d"), fluidez: L(5, "≤", "5.1 e") },
    articulacao: { aderencia: L(10, "<", "5.2 a"), alongTracao: L(100, "≥", "5.2 b"), dpComp: L(50, "<", "5.2 c"),
      absorcao: L(5, "<", "5.2 d"), fluidez: L(5, "≤", "5.2 e") },
    expansao: { absorcao: L(4, "<", "5.3 a"), alongTracao: L(300, "≥", "5.3 b"), dpComp: L(20, "<", "5.3 c"),
      fluidez: L(5, "≤", "5.3 d"), alongAderencia: L(200, ">", "5.3 e"), rasgamento: L(4, ">", "5.3 f"),
      puncionamento: L(null, "", "5.3 g") },
  };
  S.paramJunta = function (dica) {
    return { k: "junta", r: "Verificar pela DNIT 046/2004-EM — tipo de junta (opcional)", tipo: "select", opcoes: S.JUNTAS,
      dica: dica || "aplica o requisito da especificação de material ao resultado" };
  };
  S.nomeJunta = function (j) { return (S.JUNTAS.filter(function (x) { return x[0] === j; })[0] || ["", ""])[1]; };
  // requisito da EM para a propriedade, ou null
  S.limite = function (P, prop) {
    var t = S.LIM[(P || {}).junta];
    return t && t[prop] ? t[prop] : null;
  };
  S.textoLim = function (lim, u) {
    return (lim.v === null ? "sem perfuração" : lim.op + " " + fmt(lim.v, 0) + (u ? " " + u : "")) + " — DNIT 046/2004-EM, " + lim.sec;
  };
  S.confere = function (valor, lim) {
    if (!lim || !ok(valor)) return null;
    switch (lim.op) {
      case "<": return valor < lim.v;
      case "≤": return valor <= lim.v;
      case ">": return valor > lim.v;
      case "≥": return valor >= lim.v;
    }
    return null;
  };

  // séries de corpos-de-prova: cura normal, envelhecido em estufa (044), envelhecido por intemperismo (045)
  S.SERIES = [["normal", "Somente cura normal"], ["todas", "Cura normal + estufa (DNIT 044) + intemperismo (DNIT 045)"]];
  S.GRUPOS = [{ k: "N", nome: "Cura normal" }, { k: "E", nome: "Após estufa (DNIT 044)" }, { k: "I", nome: "Após intemperismo (DNIT 045)" }];
  S.paramSeries = function (n, sec) {
    return { k: "serie", r: "Corpos-de-prova (" + sec + ")", tipo: "select", recarrega: true, opcoes: S.SERIES,
      dica: n + " CPs por condição; N = cura normal, E = estufa, I = intemperismo" };
  };
  S.grupos = function (modo, n) {
    return (modo === "todas" ? S.GRUPOS : S.GRUPOS.slice(0, 1)).map(function (g, i) {
      return { k: g.k, nome: g.nome, ini: i * n, n: n };
    });
  };
  S.nomes = function (modo, n) {
    var r = [];
    S.grupos(modo, n).forEach(function (g) { for (var i = 1; i <= n; i++) r.push(g.k + i); });
    return r;
  };
  // ajusta o número de colunas da tabela antes de desenhá-la (como na ficha DNIT 450)
  S.ajustar = function (d, chave, total) {
    if (Array.isArray(d[chave])) { while (d[chave].length < total) d[chave].push({}); if (d[chave].length > total) d[chave].length = total; }
  };
  // variação após o envelhecimento: V = (ve − va) / va × 100 (DNIT 044 e 045, seção 6)
  S.variacao = function (va, ve) { return ok(va) && ok(ve) && va !== 0 ? (ve - va) / va * 100 : NaN; };
  // médias por série e variação das séries envelhecidas em relação à cura normal
  S.resumo = function (modo, n, cps, chaves) {
    var gs = S.grupos(modo, n);
    gs.forEach(function (g) {
      var parte = cps.slice(g.ini, g.ini + g.n);
      g.m = {}; g.cont = {};
      chaves.forEach(function (c) {
        var v = parte.map(function (o) { return (o || {})[c]; }).filter(ok);
        g.m[c] = media(v); g.cont[c] = v.length;
      });
    });
    gs.forEach(function (g) {
      g.V = {};
      if (g.k !== "N") chaves.forEach(function (c) { g.V[c] = S.variacao(gs[0].m[c], g.m[c]); });
    });
    return gs;
  };
  S.serie = function (gs, k) { return gs.filter(function (g) { return g.k === k; })[0]; };
  // tabela-resumo por série; cols = [{k, r, u, casas, v (mostra variação)}]
  S.tabela = function (gs, cols, relat) {
    return '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th>Condição</th><th>CPs</th>' +
      cols.map(function (c) { return "<th>" + esc(c.r) + (c.u ? " (" + esc(c.u) + ")" : "") + "</th>"; }).join("") + "</tr></thead><tbody>" +
      gs.map(function (g) {
        var nMax = Math.max.apply(null, cols.map(function (c) { return g.cont[c.k] || 0; }));
        return "<tr><td>" + esc(g.nome) + "</td><td>" + nMax + "</td>" + cols.map(function (c) {
          var v = g.m[c.k], V = g.V[c.k];
          return "<td>" + fmt(v, c.casas) + (c.v && ok(V) ? " (" + (V > 0 ? "+" : "") + fmt(V, 1) + " %)" : "") + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table>" +
      (gs.length > 1 && cols.some(function (c) { return c.v; }) ? '<p class="nota">Entre parênteses: variação em relação à cura normal, V = (ve − va) / va × 100 (DNIT 044 e 045, seção 6).</p>' : "");
  };
  // aviso quando uma série tem menos CPs que o exigido
  S.avisoContagem = function (gs, chave, avisos, sec) {
    gs.forEach(function (g) {
      if (g.cont[chave] > 0 && g.cont[chave] < g.n) avisos.push(g.nome + ": " + g.cont[chave] + " corpo(s)-de-prova com resultado; a norma prevê " + g.n + " (" + sec + ").");
    });
  };

  // condicionamento a (23 ± 2) °C por no mínimo 2 h
  S.paramsCond = function (sec) {
    return [{ k: "temp", r: "Temperatura de condicionamento e do ensaio (°C)", ph: "23", dica: "(23 ± 2) °C (" + sec + ")" },
      { k: "horas", r: "Tempo de condicionamento antes do ensaio (h)", ph: "2", dica: "mínimo de 2 h (" + sec + ")" }];
  };
  S.avisosCond = function (P, avisos, sec) {
    var t = num(P.temp), h = num(P.horas);
    if (ok(t) && Math.abs(t - 23) > 2) avisos.push("Temperatura de " + fmt(t, 1) + " °C fora de (23 ± 2) °C (" + sec + ").");
    if (ok(h) && h < 2) avisos.push("Condicionamento de " + fmt(h, 1) + " h, abaixo do mínimo de 2 h (" + sec + ").");
  };
  S.paramIdade = function (sec) {
    return { k: "idade", r: "Idade da placa ao cortar os CPs (dias)", ph: "7", dica: "aguardar sete dias (" + sec + ")" };
  };
  S.avisoIdade = function (P, avisos, sec) {
    var i = num(P.idade);
    if (ok(i) && i < 7) avisos.push("Corpos-de-prova obtidos com " + fmt(i, 0) + " dia(s); a norma manda aguardar sete dias (" + sec + ").");
  };
  S.paramVeloc = { k: "veloc", r: "Velocidade de afastamento das garras (cm/min)", ph: "50", dica: "(50,0 ± 5,0) cm/min (4.1)" };
  S.avisoVeloc = function (P, avisos) {
    var v = num(P.veloc);
    if (ok(v) && Math.abs(v - 50) > 5) avisos.push("Velocidade de " + fmt(v, 1) + " cm/min fora de (50 ± 5) cm/min (4.1).");
  };
  // aviso de faixa (valor fora de alvo ± tol)
  S.faixa = function (v, alvo, tol) { return ok(v) && Math.abs(v - alvo) > tol + 1e-9; };

  // HTML
  S.selo = function (c) {
    return c === null || c === undefined ? "" : c ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>';
  };
  S.item = function (valorHtml, u, rotuloHtml, conforme, pequeno) {
    return '<div class="fe-res-item"><div class="fe-res-v' + (pequeno ? " fe-res-p" : "") + '">' + valorHtml + (u ? " <small>" + esc(u) + "</small>" : "") +
      '</div><div class="fe-res-r">' + rotuloHtml + S.selo(conforme) + "</div></div>";
  };
  S.txt = function (c, limTexto) {
    return c === null || c === undefined ? "" : (c ? " — atende (" : " — NÃO ATENDE (") + limTexto + ")";
  };
  S.parecerGeral = function (lista) {  // lista de booleanos/null → true, false ou null
    var v = lista.filter(function (x) { return x === true || x === false; });
    return v.length ? v.every(function (x) { return x; }) : null;
  };

  // -------------------------------------------------------------------------------------
  // Ficha de envelhecimento acelerado (DNIT 044 — estufa; DNIT 045 — intemperismo): compara o resultado
  // médio de cada ensaio antes (va) e após (ve) o envelhecimento; V = (ve − va) / va × 100 (seção 6).
  // cfg = {id, titulo, resumo, params[], avisos(P, avisos), notaCond, alongTracaoRetracao, exemplos}
  // -------------------------------------------------------------------------------------
  S.PROPS = [
    { k: "trT", nome: "Tração — TR", u: "N/mm²", casas: 2, norma: "DNIT 039" },
    { k: "arT", nome: "Tração — AR", u: "%", casas: 0, norma: "DNIT 039" },
    { k: "trA", nome: "Aderência — TR", u: "MPa", casas: 3, norma: "DNIT 040" },
    { k: "arA", nome: "Aderência — AR", u: "%", casas: 0, norma: "DNIT 040" },
    { k: "rg", nome: "Rasgamento", u: "N/mm", casas: 1, norma: "DNIT 042" },
    { k: "abs", nome: "Absorção de água", u: "%", casas: 2, norma: "DNIT 043" },
    { k: "dpc", nome: "Def. perm. compressão", u: "%", casas: 1, norma: "DNIT 041" },
  ];
  S.fichaEnvelhecimento = function (cfg) {
    var F = {
      titulo: cfg.titulo,
      resumo: cfg.resumo,
      blocos: [],
      params: [
        { k: "material", r: "Material", ph: "ex.: selante de poliuretano — Fornecedor A" },
        S.paramJunta("perda de aderência < 10 %, alongamento na tração ≥ 100 % e absorção < 5 % (ou < 4 %) após o envelhecimento"),
      ].concat(cfg.params),
      padrao: { junta: "" },
      tabelas: function () {
        return [{
          chave: "pr", titulo: "Resultados antes e após o envelhecimento", rotulo: "Ensaio", iniciais: S.PROPS.length, min: S.PROPS.length, fixo: true,
          nomes: S.PROPS.map(function (p) { return p.nome + " (" + p.u + ")"; }),
          dica: "médias dos CPs de cada ensaio (fichas DNIT 039 a 043), ensaiados simultaneamente; deixe em branco os ensaios não realizados",
          linhas: [
            { k: "va", r: "Valor antes do envelhecimento — va (6)" },
            { k: "ve", r: "Valor após o envelhecimento — ve (6)" },
            { calc: "V", r: "V = (ve − va) / va × 100 (6)", u: "%", casas: 1, destaque: true },
          ],
        }];
      },
      calcular: function (d) {
        var P = d.params || {}, avisos = [], verif = [];
        var linhas = S.PROPS.map(function (p, i) {
          var x = (d.pr || [])[i] || {}, va = num(x.va), ve = num(x.ve);
          var o = { p: p, va: va, ve: ve, V: S.variacao(va, ve) };
          if (ok(ve) !== ok(va)) avisos.push(p.nome + ": informe os valores antes e após o envelhecimento (ensaios simultâneos, seção " + cfg.secRes + ").");
          return o;
        });
        cfg.avisos(P, avisos);
        var j = P.junta;
        function reg(o, lim, valor, rot, txtValor) {
          var c = S.confere(valor, lim);
          verif.push({ r: rot, v: txtValor, c: c, lim: S.textoLim(lim, "%") });
          if (c === false) avisos.push(rot + ": " + txtValor + " (" + S.textoLim(lim, "%") + ").");
        }
        var lA = S.limite(P, "aderencia"), lT = S.limite(P, "alongTracao"), lB = S.limite(P, "absorcao");
        var trA = linhas[2], arT = linhas[1], abs = linhas[5];
        if (lA && ok(trA.V)) reg(trA, lA, -trA.V, "Perda de aderência (redução da TR de aderência)", fmt(-trA.V, 1) + " %");
        // alongamento na tração após envelhecimento: 5.2 b (estufa e intemperismo) e 5.1 b (só intemperismo)
        if (lT && ok(arT.ve) && j !== "expansao" && (j === "articulacao" || cfg.alongTracaoRetracao)) reg(arT, lT, arT.ve, "Alongamento na tração após o envelhecimento", fmt(arT.ve, 0) + " %");
        if (lB && ok(abs.ve)) reg(abs, lB, abs.ve, "Absorção de água após o envelhecimento", fmt(abs.ve, 2) + " %");
        return { tab: { pr: linhas.map(function (o) { return { V: o.V }; }) },
          resultados: { linhas: linhas, verif: verif, conforme: S.parecerGeral(verif.map(function (x) { return x.c; })) }, avisos: avisos };
      },
      resultadosHtml: function (calc, d) {
        var r = calc.resultados;
        return '<div class="fe-res">' + r.verif.map(function (v) { return S.item(esc(v.v), "", esc(v.r) + " (" + esc(v.lim) + ")", v.c, true); }).join("") +
          (r.verif.length ? "" : S.item(String(r.linhas.filter(function (o) { return ok(o.V); }).length), "", "ensaio(s) comparados antes e após o envelhecimento", null, true)) +
          "</div>" + F.relatorio.extraHtml(calc, d, false);
      },
      relatorio: {
        notas: "V = (ve − va) / va × 100, com va e ve medidos no mesmo ensaio, simultaneamente, antes e após o envelhecimento (seção " + cfg.secRes + "). " + cfg.notaCond +
          " Perda de aderência (DNIT 046/2004-EM, 5.1 a e 5.2 a) tomada como −V da tensão de ruptura do ensaio de aderência (DNIT 040).",
        extraHtml: function (calc, d, relat) {
          var ls = calc.resultados.linhas.filter(function (o) { return ok(o.va) || ok(o.ve); });
          if (!ls.length) return "";
          return '<table class="' + (relat !== false ? "gr" : "fe-resumo") + '"><thead><tr><th>Ensaio</th><th>Norma</th><th>Antes (va)</th><th>Após (ve)</th><th>V (%)</th></tr></thead><tbody>' +
            ls.map(function (o) {
              return "<tr><td>" + esc(o.p.nome + " (" + o.p.u + ")") + "</td><td>" + esc(o.p.norma) + "</td><td>" + fmt(o.va, o.p.casas) + "</td><td>" + fmt(o.ve, o.p.casas) +
                "</td><td>" + (ok(o.V) ? (o.V > 0 ? "+" : "") + fmt(o.V, 1) : "—") + "</td></tr>";
            }).join("") + "</tbody></table>";
        },
        resultados: function (calc, d) {
          var r = calc.resultados, P = d.params || {}, rows = [];
          if (P.material) rows.push(["Material", P.material]);
          rows.push(["Ensaios comparados", String(r.linhas.filter(function (o) { return ok(o.V); }).length) + " (variações na tabela abaixo)"]);
          r.verif.forEach(function (v) { rows.push([v.r, v.v + S.txt(v.c, v.lim)]); });
          if (r.conforme !== null) rows.push(["Parecer — " + S.nomeJunta(P.junta), r.conforme ? "Atende" : "NÃO ATENDE"]);
          return rows;
        },
      },
      exemplos: cfg.exemplos,
    };
    FE.FICHAS[cfg.id] = F;
    return F;
  };
  // monta a lista de colunas de um exemplo a partir de {chave: [va, ve]}
  S.exProps = function (o) { return S.PROPS.map(function (p) { var v = o[p.k] || ["", ""]; return { va: v[0], ve: v[1] }; }); };

  FE.selantes = S;

  // =====================================================================================
  // DNIT 038/2004-ME — Índice de fluidez
  // =====================================================================================
  FE.FICHAS["dnit-038-2004-me"] = {
    titulo: "Selante de juntas — índice de fluidez",
    resumo: "Mástique moldado a quente em fôrma de 40 × 60 × 3,2 mm, 5 h em estufa a (60 ± 1) °C com a placa inclinada a 75°; fluidez = alteração do comprimento da amostra, em mm (seção 7).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: mástique asfáltico moldado a quente — Fornecedor A" },
      S.paramJunta("fluidez de 5 mm a 60 °C — lida como máximo (5.1 e, 5.2 e, 5.3 d)"),
      { k: "fluidezMax", r: "Fluidez máxima admitida (mm) — opcional", dica: "usado quando não se escolhe o tipo de junta da EM", se: function (d) { return !(d.params || {}).junta; } },
      { k: "massa", r: "Massa da amostra (g)", ph: "600", dica: "600 g, sem o material superficial oxidado (5)" },
      { k: "tLimite", r: "Temperatura limite de aquecimento do material (°C)", dica: "determinada conforme a ASTM D 1191 (6 b)" },
      { k: "tOleo", r: "Temperatura máxima do banho de óleo (°C)", dica: "até 24 °C acima da temperatura limite, nunca acima de 288 °C (6 b)" },
      { k: "esfriar", r: "Tempo à temperatura ambiente antes de aparar (h)", ph: "0,5", dica: "pelo menos meia hora (6 f)" },
      { k: "tEstufa", r: "Temperatura da estufa (°C)", ph: "60", dica: "(60 ± 1) °C (6 h)" },
      { k: "tempo", r: "Tempo na estufa (h)", ph: "5", dica: "5 horas (6 h)" },
      { k: "angulo", r: "Inclinação do eixo longitudinal (°)", ph: "75", dica: "75° ± 1° com a horizontal (6 i)" },
    ],
    padrao: { junta: "" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "comprimento medido ao longo do eixo inclinado, antes e após as 5 h na estufa",
        linhas: [
          { k: "li", r: "Comprimento inicial da amostra (fôrma de 60 mm, 6 e)", u: "mm", padrao: "_li", padraoFixo: "60" },
          { k: "lf", r: "Comprimento após 5 h na estufa (7)", u: "mm" },
          { calc: "fl", r: "Fluidez = comprimento final − inicial (7)", u: "mm", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var dets = (d.det || []).map(function (x, i) {
        var li = ok(num(x.li)) ? num(x.li) : 60, lf = num(x.lf);
        var fl = ok(lf) ? lf - li : NaN;
        if (ok(fl) && fl < 0) avisos.push("Amostra " + (i + 1) + ": comprimento final menor que o inicial — confira as leituras.");
        if (ok(num(x.li)) && Math.abs(num(x.li) - 60) > 1) avisos.push("Amostra " + (i + 1) + ": comprimento inicial de " + fmt(num(x.li), 1) + " mm; a fôrma tem 60 mm (6 e).");
        return { fl: fl };
      });
      var vals = dets.map(function (o) { return o.fl; }).filter(ok);
      var m = media(vals), maior = vals.length ? Math.max.apply(null, vals) : NaN;
      var massa = num(P.massa), tl = num(P.tLimite), to = num(P.tOleo), es = num(P.esfriar), te = num(P.tEstufa), tp = num(P.tempo), an = num(P.angulo);
      if (ok(massa) && massa < 600) avisos.push("Amostra de " + fmt(massa, 0) + " g; a norma prevê 600 g (5).");
      if (ok(to) && to > 288) avisos.push("Banho de óleo a " + fmt(to, 0) + " °C: nunca deve passar de 288 °C (6 b).");
      if (ok(to) && ok(tl) && to > tl + 24) avisos.push("Banho de óleo a " + fmt(to, 0) + " °C, mais de 24 °C acima da temperatura limite de aquecimento (" + fmt(tl, 0) + " °C) (6 b).");
      if (ok(es) && es < 0.5) avisos.push("Amostra mantida " + fmt(es, 2) + " h à temperatura ambiente; mínimo de meia hora (6 f).");
      if (S.faixa(te, 60, 1)) avisos.push("Estufa a " + fmt(te, 1) + " °C, fora de (60 ± 1) °C (6 h).");
      if (ok(tp) && tp !== 5) avisos.push("Permanência de " + fmt(tp, 1) + " h na estufa; a norma fixa 5 horas (6 h).");
      if (S.faixa(an, 75, 1)) avisos.push("Inclinação de " + fmt(an, 1) + "°, fora de 75° ± 1° (6 i).");
      var lim = S.limite(P, "fluidez"), limTxt = "";
      if (!lim && ok(num(P.fluidezMax))) { lim = L(num(P.fluidezMax), "≤", ""); }
      if (lim) limTxt = lim.sec ? S.textoLim(lim, "mm") : "≤ " + fmt(lim.v, 1) + " mm — limite informado";
      var conforme = S.confere(maior, lim);
      if (conforme === false) avisos.push("Fluidez de " + fmt(maior, 1) + " mm acima do máximo de " + fmt(lim.v, 1) + " mm (" + limTxt + ").");
      return { tab: { det: dets }, resultados: { fluidez: m, maior: maior, n: vals.length, lim: lim, limTxt: limTxt, conforme: conforme }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' +
        S.item(fmt(r.fluidez, 1), "mm", "Fluidez a 60 °C" + (r.n > 1 ? " — média de " + r.n + " amostras" : ""), null) +
        (r.n > 1 ? S.item(fmt(r.maior, 1), "mm", "Maior valor individual", null, true) : "") +
        (r.lim ? S.item(esc(r.limTxt), "", "Requisito (verificado com o maior valor)", r.conforme, true) : "") + "</div>";
    },
    relatorio: {
      notas: "Fluidez = comprimento da amostra após 5 h em estufa a (60 ± 1) °C, com o eixo longitudinal inclinado a 75° − comprimento inicial (60 mm), em mm (seção 7). A DNIT 046/2004-EM exige \"fluidez de 5 mm, medida à temperatura de 60 °C\", interpretada como valor máximo; com mais de uma amostra o parecer usa o maior valor.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Fluidez a 60 °C" + (r.n > 1 ? " (média de " + r.n + " amostras)" : ""), fmt(r.fluidez, 1) + " mm"]);
        if (r.n > 1) rows.push(["Maior valor individual", fmt(r.maior, 1) + " mm"]);
        if (r.lim) rows.push(["Parecer" + (P.junta ? " — " + S.nomeJunta(P.junta) : ""), (r.conforme ? "Atende" : r.conforme === false ? "NÃO ATENDE" : "—") + " (" + r.limTxt + ")"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Mástique a quente — junta de retração, atende", dados: function () {
        return { ident: { registro: "EX-SEL-FL-01", obra: "Obra A", origem: "Fornecedor A", camada: "Selante — juntas transversais" },
          params: { material: "Mástique asfáltico moldado a quente", junta: "retracao", massa: "600", tLimite: "190", tOleo: "205",
            esfriar: "1", tEstufa: "60", tempo: "5", angulo: "75" },
          det: [{ li: "60,0", lf: "62,5" }, { li: "60,0", lf: "63,0" }] };
      } },
      { nome: "Mástique superaquecido — fluidez acima de 5 mm", dados: function () {
        return { ident: { registro: "EX-SEL-FL-02", obra: "Obra B", origem: "Fornecedor B", camada: "Selante — juntas longitudinais" },
          params: { material: "Mástique asfáltico moldado a quente", junta: "articulacao", massa: "600", tLimite: "180", tOleo: "215",
            esfriar: "0,5", tEstufa: "61", tempo: "5", angulo: "75" },
          det: [{ li: "60,0", lf: "67,0" }, { li: "60,0", lf: "68,0" }] };
      } },
    ],
  };
})();
