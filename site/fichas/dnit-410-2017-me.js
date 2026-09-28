/*
 * Ficha: DNIT 410/2017-ME — Solos — Prova de carga estática em placa para controle de aterros solo-enrocamento.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Tensão na placa σ0 = carga / área; deslocamento s = média dos três defletômetros (9.1); regressão polinomial de
 * 2ª ordem s = a0 + a1·σ0 + a2·σ0² por ciclo (9.2; no 1º ciclo sem a primeira etapa); EV = 1,5 · r / (a1 + a2·σ0,máx),
 * com r em mm e σ0,máx = pressão máxima do 1º ciclo; kEV = EV2 / EV1; valores sugeridos da Tabela 3.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  function area(P) {  // m²
    var D = num(P.diametro);
    return ok(D) && D > 0 ? Math.PI * Math.pow(D / 200, 2) : NaN;
  }
  function linhasEtapa(P) {
    var l = [{ k: "etapa", r: "Etapa nº", texto: true }];
    if (P.entrada === "manometro") l.push({ k: "man", r: "Leitura do manômetro", u: "MPa" });
    else l.push({ k: "F", r: "Carga aplicada", u: "kN" });
    l.push({ k: "d1", r: "Defletômetro 1", u: "mm" }, { k: "d2", r: "Defletômetro 2", u: "mm" }, { k: "d3", r: "Defletômetro 3", u: "mm" });
    if (P.entrada === "manometro") l.push({ calc: "F", r: "Carga = leitura × área do êmbolo", u: "kN", casas: 2 });
    l.push({ calc: "sig", r: "Tensão normal σ0 = carga / área da placa", u: "MPa", casas: 4 },
      { calc: "s", r: "Deslocamento s — média dos três defletômetros (9.1)", u: "mm", casas: 2, destaque: true });
    return l;
  }
  function etapas(cols, P, A) {
    var aE = num(P.embolo);  // cm²
    return (cols || []).map(function (p) {
      var F = P.entrada === "manometro" ? (ok(num(p.man)) && ok(aE) ? num(p.man) * aE / 10 : NaN) : num(p.F);  // MPa × cm² / 10 = kN
      var ds = [num(p.d1), num(p.d2), num(p.d3)].filter(ok);
      return { F: F, sig: ok(F) && ok(A) ? F / A / 1000 : NaN, s: ds.length ? media(ds) : NaN, nd: ds.length };
    });
  }
  // regressão s = a0 + a1 σ + a2 σ² (FE.parabola devolve y = a x² + b x + c)
  function regressao(pts) {
    var v = pts.filter(function (o) { return ok(o.sig) && ok(o.s); });
    if (v.length < 3) return null;
    var q = FE.parabola(v.map(function (o) { return o.sig; }), v.map(function (o) { return o.s; }));
    return q ? { a0: q.c, a1: q.b, a2: q.a, n: v.length } : null;
  }
  function modulo(reg, r, sMax) {
    if (!reg || !ok(r) || !ok(sMax)) return NaN;
    var den = reg.a1 + reg.a2 * sMax;
    return den > 0 ? 1.5 * r / den : NaN;
  }

  FE.FICHAS["dnit-410-2017-me"] = {
    titulo: "Solos — Prova de carga estática em placa (aterros solo-enrocamento)",
    resumo: "Dois ciclos de carregamento; curva tensão × deslocamento; regressão polinomial de 2ª ordem por ciclo; módulos EV1 e EV2 = 1,5 · r / (a1 + a2 · σ0,máx), kEV = EV2 / EV1 e comparação com a Tabela 3 (seção 9 e 10).",
    blocos: [],
    params: [
      { k: "diametro", r: "Diâmetro da placa (cm)", ph: "76,2", dica: "mínimo 76,2 cm e 2,0 cm de espessura (5.2)" },
      { k: "arranjo", r: "Rigidez da placa (5.2, Anexo A)", tipo: "select",
        opcoes: [["piramidal", "Arranjo piramidal de ≥ 4 placas (diâmetros adjacentes com ≤ 15 cm de diferença)"], ["enrijecida", "Placa com enrijecedores na face superior"]] },
      { k: "reacao", r: "Sistema de reação — carga de reação disponível (kN)", dica: "≥ 1,2 × a carga máxima do ensaio e ≥ 80 kN (5.1)" },
      { k: "reacaoDesc", r: "Sistema de reação — descrição", ph: "ex.: caminhão carregado" },
      { k: "entrada", r: "Registro da carga", tipo: "select", recarrega: true,
        opcoes: [["carga", "Carga em kN (macaco com célula de carga ou tabela de aferição)"], ["manometro", "Leitura do manômetro (MPa) × área do êmbolo"]] },
      { k: "embolo", r: "Área efetiva do êmbolo do macaco (cm²)", se: function (d) { return (d.params || {}).entrada === "manometro"; } },
      { k: "espessura", r: "Espessura da camada avaliada (cm)", dica: "tamanho máximo das partículas < 2/3 da espessura (3.3 a)" },
      { k: "dmax", r: "Tamanho máximo das partículas (cm) — opcional", dica: "até 25 cm (3.3); partículas sob a placa < 1/4 do diâmetro (seção 6)" },
      { k: "ev2Min", r: "EV2 mínimo (MPa)", ph: "60", dica: "Tabela 3: ≥ 60 MPa (pode ser alterado pela fiscalização, seção 10)" },
      { k: "sMax", r: "Deslocamento máximo smáx (mm)", ph: "13", dica: "Tabela 3: 13 mm" },
      { k: "kevCrit", r: "Critério de kEV", tipo: "select",
        opcoes: [["tab3", "Tabela 3 como publicada — kEV ≥ 2"], ["max", "Valor máximo definido pela fiscalização / trecho experimental"], ["nao", "Não verificar"]],
        dica: "a Tabela 3 traz \"kEV (%) ≥ 2\"; veja a nota do relatório" },
      { k: "kevLim", r: "Valor-limite de kEV", ph: "2", se: function (d) { return (d.params || {}).kevCrit !== "nao"; } },
    ],
    padrao: { diametro: "76,2", arranjo: "piramidal", entrada: "carga", ev2Min: "60", sMax: "13", kevCrit: "tab3", kevLim: "2" },
    tabelas: function (d) {
      var P = d.params || {};
      return [
        { chave: "c1", titulo: "1º ciclo — carregamento (8.2, Tabela 1)", rotulo: "Etapa", iniciais: 7, min: 3, linhas: linhasEtapa(P),
          dica: "etapa 0 (carga inicial) e pelo menos seis etapas com incrementos aproximadamente iguais; carga mantida ≥ 2 min até estabilizar" },
        { chave: "c1d", titulo: "1º ciclo — descarregamento: 50 %, 25 % e 2 % da carga máxima (8.2)", rotulo: "Etapa", iniciais: 3, min: 1, linhas: linhasEtapa(P) },
        { chave: "c2", titulo: "2º ciclo — carregamento até a penúltima carga do 1º ciclo (8.3, Tabela 2)", rotulo: "Etapa", iniciais: 6, min: 3, linhas: linhasEtapa(P),
          dica: "comece pela leitura com 2 % da carga (última do descarregamento), como na Tabela 2" },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], A = area(P), D = num(P.diametro), r = ok(D) ? D * 10 / 2 : NaN;  // raio em mm
      if (!ok(A)) avisos.push("Informe o diâmetro da placa.");
      else if (D < 76.2 - 1e-9) avisos.push("Placa de " + fmt(D, 1) + " cm: a norma indica diâmetro mínimo de 76,2 cm (5.2).");
      if (P.entrada === "manometro" && !ok(num(P.embolo))) avisos.push("Informe a área efetiva do êmbolo para converter as leituras do manômetro em carga.");
      var c1 = etapas(d.c1, P, A), c1d = etapas(d.c1d, P, A), c2 = etapas(d.c2, P, A);
      [["1º ciclo (carregamento)", c1], ["1º ciclo (descarregamento)", c1d], ["2º ciclo", c2]].forEach(function (g) {
        g[1].forEach(function (o, i) { if (ok(o.F) && o.nd && o.nd < 3) avisos.push(g[0] + ", etapa " + (i + 1) + ": " + o.nd + " defletômetro(s); são três no mínimo (5.4)."); });
      });
      var carr = c1.filter(function (o) { return ok(o.sig) && ok(o.s); });
      var Fmax = Math.max.apply(null, c1.map(function (o) { return o.F; }).filter(ok).concat([-Infinity]));
      var sig0max = Math.max.apply(null, carr.map(function (o) { return o.sig; }).concat([-Infinity]));
      if (!isFinite(sig0max)) sig0max = NaN;
      if (!isFinite(Fmax)) Fmax = NaN;
      // verificações do procedimento
      if (carr.length && carr.length - 1 < 6) avisos.push("1º ciclo com " + (carr.length - 1) + " etapa(s) além da inicial; o carregamento deve ter pelo menos seis etapas (seção 8, 8.2).");
      for (var i = 1; i < carr.length; i++) if (carr[i].sig <= carr[i - 1].sig) { avisos.push("1º ciclo: as cargas devem ser crescentes (etapa " + (i + 1) + ")."); break; }
      if (ok(sig0max) && sig0max > 0.201) avisos.push("Tensão máxima de " + fmt(sig0max, 3) + " MPa: para placa de 76,2 cm o módulo é determinado para tensões de até 0,2 MPa (8.3).");
      var alvoD = [0.5, 0.25, 0.02];
      c1d.forEach(function (o, k) {
        if (ok(o.F) && ok(Fmax) && k < 3 && Math.abs(o.F / Fmax - alvoD[k]) > 0.05)
          avisos.push("Descarregamento, etapa " + (k + 1) + ": " + fmt(o.F / Fmax * 100, 0) + " % da carga máxima; a norma pede 50 %, 25 % e 2 % (8.2).");
      });
      var c2F = c2.map(function (o) { return o.F; }).filter(ok);
      if (c2F.length && ok(Fmax) && Math.max.apply(null, c2F) >= Fmax * 0.999) avisos.push("2º ciclo atingiu a carga máxima do 1º: deve ir só até a penúltima carga (8.3).");
      var reac = num(P.reacao);
      if (ok(reac) && ok(Fmax) && reac < 1.2 * Fmax) avisos.push("Reação de " + fmt(reac, 0) + " kN < 1,2 × carga máxima (" + fmt(1.2 * Fmax, 1) + " kN) (5.1).");
      if (ok(reac) && reac < 80) avisos.push("Reação de " + fmt(reac, 0) + " kN, abaixo do mínimo de 80 kN (5.1).");
      var esp = num(P.espessura), dmax = num(P.dmax);
      if (ok(dmax) && dmax > 25) avisos.push("Tamanho máximo de " + fmt(dmax, 0) + " cm > 25 cm permitido para solo-enrocamento (3.3).");
      if (ok(dmax) && ok(esp) && dmax >= esp * 2 / 3) avisos.push("Tamanho máximo das partículas não é inferior a 2/3 da espessura da camada (3.3 a).");

      // regressões (9.2): 1º ciclo sem a primeira etapa; 2º ciclo com todos os pontos
      var reg1 = regressao(carr.slice(1)), reg2 = regressao(c2);
      var EV1 = modulo(reg1, r, sig0max), EV2 = modulo(reg2, r, sig0max);
      if (carr.length >= 4 && !ok(EV1)) avisos.push("Não foi possível calcular EV1 (a1 + a2·σ0,máx ≤ 0): confira as leituras do 1º ciclo.");
      if (c2.filter(function (o) { return ok(o.s); }).length >= 3 && !ok(EV2)) avisos.push("Não foi possível calcular EV2 (a1 + a2·σ0,máx ≤ 0): confira as leituras do 2º ciclo.");
      var kEV = ok(EV1) && ok(EV2) ? EV2 / EV1 : NaN;
      var sAll = c1.concat(c1d, c2).map(function (o) { return o.s; }).filter(ok);
      var smax = sAll.length ? Math.max.apply(null, sAll) : NaN;
      // Tabela 3
      var ev2Min = ok(num(P.ev2Min)) ? num(P.ev2Min) : 60, sLim = ok(num(P.sMax)) ? num(P.sMax) : 13, kLim = ok(num(P.kevLim)) ? num(P.kevLim) : 2;
      var crit = { ev2: ok(EV2) ? EV2 >= ev2Min : null, s: ok(smax) ? smax <= sLim : null,
        kev: !ok(kEV) || P.kevCrit === "nao" ? null : P.kevCrit === "max" ? kEV <= kLim : kEV >= kLim };
      if (crit.ev2 === false) avisos.push("EV2 = " + fmt(EV2, 1) + " MPa, abaixo do valor sugerido de " + fmt(ev2Min, 0) + " MPa (Tabela 3).");
      if (crit.s === false) avisos.push("Deslocamento máximo de " + fmt(smax, 2) + " mm, acima de " + fmt(sLim, 1) + " mm (Tabela 3 e 8.3).");
      if (crit.kev === false) avisos.push("kEV = " + fmt(kEV, 2) + (P.kevCrit === "max" ? ", acima do máximo de " : ", abaixo de ") + fmt(kLim, 2) +
        (P.kevCrit === "max" ? " definido pela fiscalização." : " (Tabela 3, como publicada)."));
      var conforme = [crit.ev2, crit.s, crit.kev].filter(function (x) { return x !== null; });
      return { tab: { c1: c1, c1d: c1d, c2: c2 }, ciclos: { c1: c1, c1d: c1d, c2: c2 },
        resultados: { A: A, r: r, sig0max: sig0max, Fmax: Fmax, reg1: reg1, reg2: reg2, EV1: EV1, EV2: EV2, kEV: kEV, smax: smax,
          ev2Min: ev2Min, sLim: sLim, kLim: kLim, kevCrit: P.kevCrit || "tab3", crit: crit, conforme: conforme.length ? conforme.every(Boolean) : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.crit;
      function st(x) { return x === null ? "" : x ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>'; }
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      function eq(g) { return g ? "s = " + fmt(g.a0, 3) + " + " + fmt(g.a1, 3) + "·σ0 + " + fmt(g.a2, 3) + "·σ0² (n = " + g.n + ")" : "—"; }
      return '<div class="fe-res">' +
        cx(fmt(r.EV2, 1) + " <small>MPa</small>", "Módulo de deformabilidade EV2 (2º ciclo) · Tabela 3: ≥ " + fmt(r.ev2Min, 0) + " MPa" + st(c.ev2)) +
        cx(fmt(r.EV1, 1) + " <small>MPa</small>", "Módulo do 1º ciclo EV1") +
        cx(fmt(r.kEV, 2), "kEV = EV2 / EV1" + (r.kevCrit === "nao" ? "" : " · " + (r.kevCrit === "max" ? "≤ " : "≥ ") + fmt(r.kLim, 2)) + st(c.kev)) +
        cx(fmt(r.smax, 2) + " <small>mm</small>", "Deslocamento máximo · limite " + fmt(r.sLim, 1) + " mm" + st(c.s)) +
        cx(fmt(r.sig0max, 3) + " <small>MPa</small>", "σ0,máx do 1º ciclo (" + fmt(r.Fmax, 2) + " kN; placa de " + fmt(r.r * 2 / 10, 1) + " cm, área " + fmt(r.A, 4) + " m²)", true) +
        "</div>" + '<table class="fe-resumo"><thead><tr><th>Ciclo</th><th>Regressão de 2ª ordem (s em mm, σ0 em MPa)</th><th>Módulo</th></tr></thead><tbody>' +
        "<tr><td>1º (sem a 1ª etapa)</td><td>" + eq(r.reg1) + "</td><td>EV1 = " + fmt(r.EV1, 1) + " MPa</td></tr>" +
        "<tr><td>2º</td><td>" + eq(r.reg2) + "</td><td>EV2 = " + fmt(r.EV2, 1) + " MPa</td></tr></tbody></table>";
    },
    graficos: function (calc, d, opt) { return [grafico(calc, opt || {})]; },
    relatorio: {
      notas: "σ0 = carga / área da placa; s = média dos três defletômetros (9.1). Regressão polinomial de 2ª ordem por mínimos quadrados em cada ciclo (1º ciclo: só o carregamento, sem a primeira etapa; 2º ciclo: todos os pontos). " +
        "EV = 1,5 · r / (a1 + a2 · σ0,máx), r em mm, σ0,máx = pressão máxima do 1º ciclo (9.2); kEV = EV2 / EV1. Tabela 3 (valores sugeridos, modificáveis pela fiscalização): EV2 ≥ 60 MPa, smáx = 13 mm, \"kEV (%) ≥ 2\" — kEV é uma razão adimensional; a ficha permite adotar o limite máximo definido pela fiscalização.",
      resultados: function (calc) {
        var r = calc.resultados, c = r.crit;
        function st(x) { return x === null ? "" : x ? " — atende" : " — NÃO ATENDE"; }
        function eq(g) { return g ? "a0 = " + fmt(g.a0, 4) + " mm; a1 = " + fmt(g.a1, 4) + " mm/MPa; a2 = " + fmt(g.a2, 4) + " mm/MPa² (" + g.n + " pontos)" : "—"; }
        return [["Placa / área / σ0,máx", fmt(r.r * 2 / 10, 1) + " cm / " + fmt(r.A, 4) + " m² / " + fmt(r.sig0max, 3) + " MPa (" + fmt(r.Fmax, 2) + " kN)"],
          ["Regressão do 1º ciclo", eq(r.reg1)], ["Regressão do 2º ciclo", eq(r.reg2)],
          ["Módulo do 1º ciclo EV1", fmt(r.EV1, 1) + " MPa"],
          ["Módulo de deformabilidade EV2", fmt(r.EV2, 1) + " MPa (mínimo " + fmt(r.ev2Min, 0) + " MPa)" + st(c.ev2)],
          ["kEV = EV2 / EV1", fmt(r.kEV, 2) + (r.kevCrit === "nao" ? "" : " (" + (r.kevCrit === "max" ? "máximo " : "Tabela 3: ≥ ") + fmt(r.kLim, 2) + ")") + st(c.kev)],
          ["Deslocamento máximo smáx", fmt(r.smax, 2) + " mm (limite " + fmt(r.sLim, 1) + " mm)" + st(c.s)]];
      },
    },
    exemplos: [
      { nome: "Aterro solo-enrocamento — placa de 76,2 cm até 0,2 MPa, bem compactado (dados gerados)", dados: function () {
        return gerar({ reg: "EX-PC-001", data: "2026-08-06", obra: "Obra A", trecho: "BR-000 — km 52+300, eixo", camada: "Aterro solo-enrocamento — 3ª camada (60 cm)" },
          { diametro: "76,2", arranjo: "piramidal", reacao: "130", reacaoDesc: "Caminhão basculante carregado", entrada: "carga", espessura: "60", dmax: "25",
            ev2Min: "60", sMax: "13", kevCrit: "tab3", kevLim: "2" },
          { sMax: 0.2, n: 6, ev1: [11.5, 18], ev2: [5.2, 6], res: 1.62 });
      } },
      { nome: "Aterro solo-enrocamento — módulo baixo, cinco etapas e 2º ciclo até a carga máxima (dados gerados)", dados: function () {
        var d = gerar({ reg: "EX-PC-002", data: "2026-09-02", obra: "Obra B", trecho: "Rua A — estaca 118, borda direita", camada: "Aterro solo-enrocamento — 1ª camada (50 cm)" },
          { diametro: "76,2", arranjo: "enrijecida", reacao: "100", reacaoDesc: "Carreta com lastro", entrada: "manometro", embolo: "180", espessura: "50", dmax: "30",
            ev2Min: "60", sMax: "13", kevCrit: "tab3", kevLim: "2" },
          { sMax: 0.2, n: 5, ev1: [22, 40], ev2: [11.5, 16], res: 3.95, ate: "max" });
        d.obs = "Camada com excesso de blocos na superfície; placa assentada com colchão de areia de 2 cm.";
        return d;
      } },
    ],
  };

  // gera leituras coerentes: s = a0 + a1 σ + a2 σ² em cada ciclo; três defletômetros com pequena inclinação da placa
  function gerar(id, P, cfg) {
    var A = Math.PI * Math.pow(num(P.diametro) / 200, 2), Fmax = cfg.sMax * A * 1000;
    var incl = [[0.97, 1.02, 1.01], [1.03, 0.98, 0.99], [0.99, 1.01, 1.0]];
    var aE = num(P.embolo);
    function col(nome, F, s, k) {
      var o = { etapa: nome };
      if (P.entrada === "manometro") o.man = fmt(F * 10 / aE, 3); else o.F = fmt(F, 2);
      var Fr = P.entrada === "manometro" ? num(o.man) * aE / 10 : F;  // carga efetivamente registrada
      var sig = Fr / A / 1000, s2 = s(sig);
      for (var j = 0; j < 3; j++) o["d" + (j + 1)] = fmt(Math.max(0, s2 * incl[k % 3][j]), 2);
      return o;
    }
    var s1 = function (x) { return cfg.ev1[0] * x + cfg.ev1[1] * x * x; };
    var sTop = s1(cfg.sMax);
    var c1 = [col("0", 0.02 * Fmax, s1, 0)];
    for (var i = 1; i <= cfg.n; i++) c1.push(col(String(i), Fmax * i / cfg.n, s1, i));
    // descarregamento: recuperação quase linear até o residual
    var desc = function (x) { return cfg.res + (sTop - cfg.res) * Math.pow(x / cfg.sMax, 1.3); };
    var c1d = [0.5, 0.25, 0.02].map(function (f, k) { return col(String(cfg.n + 1 + k), Fmax * f, desc, k); });
    var s2 = function (x) { return desc(0.02 * cfg.sMax) + cfg.ev2[0] * (x - 0.02 * cfg.sMax) + cfg.ev2[1] * (x * x - Math.pow(0.02 * cfg.sMax, 2)); };
    var nc2 = cfg.ate === "max" ? cfg.n : cfg.n - 1, base = cfg.n + 3;
    var c2 = [col(String(base), 0.02 * Fmax, s2, 2)];  // mesma leitura da última etapa do descarregamento
    for (var k = 1; k <= nc2; k++) c2.push(col(String(base + k), Fmax * k / cfg.n, s2, k));
    return { ident: { registro: id.reg, data: id.data, obra: id.obra, trecho: id.trecho, camada: id.camada, laboratorista: "Equipe de campo" },
      params: P, c1: c1, c1d: c1d, c2: c2 };
  }

  // curva tensão × deslocamento (deslocamento para baixo), pontos dos ciclos e regressões
  function grafico(calc, opt) {
    var cc = calc.ciclos, r = calc.resultados;
    var todos = cc.c1.concat(cc.c1d, cc.c2).filter(function (o) { return ok(o.sig) && ok(o.s); });
    if (todos.length < 2) return '<div class="fe-graf-vazio">A curva tensão × deslocamento aparece com as cargas e as leituras dos defletômetros.</div>';
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cor = { c1: imp ? "#1f5fbf" : "#4f8cff", d: imp ? "#7f8c8d" : "#9aa3b2", c2: imp ? "#c0392b" : "#e5534b" };
    var W = opt.w || 600, H = opt.h || 320, m = { l: 52, r: 16, t: 30, b: 40 };
    var xMax = Math.max.apply(null, todos.map(function (o) { return o.sig; })) * 1.08, yMax = Math.max.apply(null, todos.map(function (o) { return o.s; })) * 1.12;
    function passo(v, n) { var a = v / n, p = Math.pow(10, Math.floor(Math.log10(a))), q = a / p; return (q <= 1 ? 1 : q <= 2 ? 2 : q <= 5 ? 5 : 10) * p; }
    var px = passo(xMax, 6), py = passo(yMax, 6);
    xMax = Math.ceil(xMax / px) * px; yMax = Math.ceil(yMax / py) * py;
    function X(v) { return m.l + v / xMax * (W - m.l - m.r); }
    function Y(v) { return m.t + v / yMax * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    for (var x = 0; x <= xMax + 1e-9; x += px) {
      s += '<line x1="' + X(x) + '" y1="' + m.t + '" x2="' + X(x) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(x) + '" y="' + (m.t - 6) + '" text-anchor="middle" fill="' + txt + '">' + fmt(x, px < 0.01 ? 3 : 2) + "</text>";
    }
    for (var y = 0; y <= yMax + 1e-9; y += py) {
      s += '<line x1="' + m.l + '" y1="' + Y(y) + '" x2="' + (W - m.r) + '" y2="' + Y(y) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 5) + '" y="' + (Y(y) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(y, py < 1 ? 1 : 0) + "</text>";
    }
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 12) + '" text-anchor="middle" fill="' + txt + '">Tensão normal σ0 (MPa) — eixo no topo</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Deslocamento s (mm)</text>';
    function serie(pts, c, trac) {
      var v = pts.filter(function (o) { return ok(o.sig) && ok(o.s); });
      if (!v.length) return "";
      var h = '<path d="' + v.map(function (o, k) { return (k ? "L" : "M") + X(o.sig).toFixed(1) + " " + Y(o.s).toFixed(1); }).join(" ") + '" fill="none" stroke="' + c + '" stroke-width="1" ' + (trac ? 'stroke-dasharray="3 3"' : "") + "/>";
      v.forEach(function (o) { h += '<circle cx="' + X(o.sig).toFixed(1) + '" cy="' + Y(o.s).toFixed(1) + '" r="3.5" fill="' + c + '"/>'; });
      return h;
    }
    function curva(g, pts, c) {
      if (!g) return "";
      var v = pts.filter(function (o) { return ok(o.sig); }), a = Math.min.apply(null, v.map(function (o) { return o.sig; })), b = Math.max.apply(null, v.map(function (o) { return o.sig; }));
      var h = "";
      for (var k = 0; k <= 40; k++) { var xx = a + (b - a) * k / 40, yy = g.a0 + g.a1 * xx + g.a2 * xx * xx; h += (k ? "L" : "M") + X(xx).toFixed(1) + " " + Y(yy).toFixed(1); }
      return '<path d="' + h + '" fill="none" stroke="' + c + '" stroke-width="2"/>';
    }
    var c1c = cc.c1.filter(function (o) { return ok(o.sig) && ok(o.s); });
    s += serie(cc.c1, cor.c1) + curva(r.reg1, c1c.slice(1), cor.c1) + serie(c1c.slice(-1).concat(cc.c1d), cor.d, true) + serie(cc.c2, cor.c2) + curva(r.reg2, cc.c2, cor.c2);
    var leg = [[cor.c1, "1º ciclo · EV1 = " + fmt(r.EV1, 1) + " MPa"], [cor.d, "descarregamento"], [cor.c2, "2º ciclo · EV2 = " + fmt(r.EV2, 1) + " MPa"]];
    leg.forEach(function (L, k) {
      s += '<rect x="' + (m.l + 10) + '" y="' + (H - m.b - 52 + k * 15) + '" width="12" height="4" fill="' + L[0] + '"/>';
      s += '<text x="' + (m.l + 26) + '" y="' + (H - m.b - 47 + k * 15) + '" fill="' + txt + '">' + esc(L[1]) + "</text>";
    });
    return s + "</svg>";
  }
})();
