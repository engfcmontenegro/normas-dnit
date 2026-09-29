/*
 * Ficha: DNER-ME 011/94 — Microesferas de vidro — Resistência à solução de cloreto de cálcio.
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * Este arquivo carrega antes das demais fichas de microesferas de vidro e de material termoplástico
 * (DNER-ME 013, 014, 015, 022, 023, 057, 058, 110, 241 a 249/94 e DNIT 069/2005-ME) e expõe o código comum
 * em window.FE.sinalizacao2:
 *   - EM: códigos das especificações de material do acervo (DNER-EM 372/2000, 373/2000, 379/98);
 *   - paramsLimite / limite / confere / textoLim / sit / sitTxt: limites opcionais de especificação;
 *   - condicao: conferência de uma condição prescrita pela norma (massa, tempo, temperatura…);
 *   - fichaQualitativa(cfg): monta uma ficha de ensaio qualitativo (condições registradas + observação
 *     + parecer satisfatório / não satisfatório);
 *   - importar248: campo que traz o teor de ligante de um ensaio salvo da DNER-ME 248/94.
 *
 * Critério geral adotado para as condições do ensaio (as normas raramente dão tolerância):
 *   - valor prescrito com tolerância (ex.: 110 °C ± 5 °C): a ficha confere a faixa;
 *   - valor "aproximadamente" (ex.: aproximadamente 60 g): aviso se o registrado difere mais de 10 %;
 *   - valor nominal sem tolerância (ex.: 10 g, solução 1,0 N): aviso se difere mais de 1 %;
 *   - tempo de repouso/contato/exposição: é o mínimo.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var TOL = 1e-9;

  // ---------- especificações de material do acervo ----------
  var EM = {
    "372": { codigo: "DNER-EM 372/2000", titulo: "Material termoplástico para sinalização horizontal rodoviária" },
    "373": { codigo: "DNER-EM 373/2000", titulo: "Microesferas de vidro retrorrefletivas para sinalização horizontal rodoviária" },
    "379": { codigo: "DNER-EM 379/98", titulo: "Esferas de vidro para sinalização rodoviária horizontal" },
  };

  // ---------- limites opcionais ----------
  // lista: [[chave, rótulo do select, mínimo|null, máximo|null, referência curta]]; "outro" = limites digitados
  function paramsLimite(lista, u, dica) {
    return [
      { k: "espec", r: "Especificação para comparação — opcional", tipo: "select", recarrega: true,
        opcoes: [["", "— sem comparação —"]].concat(lista.map(function (x) { return [x[0], x[1]]; }), [["outro", "Outro — informar os limites"]]),
        dica: dica || "limites das especificações de material do acervo" },
      { k: "limMin", r: "Limite mínimo (" + u + ")", se: function (d) { return (d.params || {}).espec === "outro"; } },
      { k: "limMax", r: "Limite máximo (" + u + ") — opcional", se: function (d) { return (d.params || {}).espec === "outro"; } },
    ];
  }
  function limite(P, lista) {
    if (P.espec === "outro") {
      var mn = num(P.limMin), mx = num(P.limMax);
      return ok(mn) || ok(mx) ? { min: ok(mn) ? mn : null, max: ok(mx) ? mx : null, ref: "limites informados" } : null;
    }
    var x = lista.filter(function (y) { return y[0] && y[0] === P.espec; })[0];
    return x ? { min: x[2], max: x[3], ref: x[4] || x[1] } : null;
  }
  function confere(v, lim) {
    if (!lim || !ok(v)) return null;
    return (lim.min === null || v >= lim.min - TOL) && (lim.max === null || v <= lim.max + TOL);
  }
  function textoLim(lim, casas, u) {
    if (!lim) return "";
    var U = u ? " " + u : "";
    if (lim.min !== null && lim.max !== null) return lim.min === lim.max ? fmt(lim.min, casas) + U : fmt(lim.min, casas) + " a " + fmt(lim.max, casas) + U;
    return lim.min !== null ? "≥ " + fmt(lim.min, casas) + U : "≤ " + fmt(lim.max, casas) + U;
  }
  function sit(c) { return c === null || c === undefined ? "" : c ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>'; }
  function sitTxt(c) { return c === null || c === undefined ? "" : c ? " — ATENDE" : " — NÃO ATENDE"; }
  function card(v, rot, grande) {
    return '<div class="fe-res-item"><div class="fe-res-v' + (grande ? "" : " fe-res-p") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>";
  }
  function parecerHtml(s) {
    return s === null || s === undefined ? "—" : s ? '<span class="fe-ok">satisfatório</span>' : '<span class="fe-nok">não satisfatório</span>';
  }
  function parecerTxt(s) { return s === null || s === undefined ? "— (observação não registrada)" : s ? "SATISFATÓRIO" : "NÃO SATISFATÓRIO"; }

  // ---------- condições prescritas ----------
  // c = {r, u, min, max, casas}; devolve null (dentro), ou o texto do aviso
  function faixaCond(c) {
    var u = c.u ? " " + c.u : "";
    if (c.min !== undefined && c.min !== null && c.max !== undefined && c.max !== null) return fmt(c.min, c.casas) + " a " + fmt(c.max, c.casas) + u;
    if (c.min !== undefined && c.min !== null) return "mín. " + fmt(c.min, c.casas) + u;
    return "máx. " + fmt(c.max, c.casas) + u;
  }
  function condicao(c, v) {
    if (!ok(v)) return null;
    var dentro = (c.min === undefined || c.min === null || v >= c.min - TOL) && (c.max === undefined || c.max === null || v <= c.max + TOL);
    return dentro ? null : c.r + ": " + fmt(v, c.casas) + (c.u ? " " + c.u : "") + " — fora do prescrito (" + faixaCond(c) + ").";
  }
  // atalhos para montar as condições
  function nominal(v, pct) { return { min: v * (1 - pct / 100), max: v * (1 + pct / 100) }; }

  // ---------- teor de ligante importado da DNER-ME 248/94 ----------
  function importar248(rot) {
    return { k: "imp248", r: rot || "Teor de ligante: buscar ensaio salvo (DNER-ME 248/94)", tipo: "importar", de: "dner-me-248-94",
      aplicar: function (e, P) { var r = e.resultados || {}; if (ok(r.teor)) P.ligante = fmt(r.teor, 1); } };
  }

  // =====================================================================================
  // Ficha qualitativa: condições registradas (uma coluna) + observações (selects) + parecer
  // cfg = { titulo, resumo, params[], padrao{}, cond(d) -> [{k, r, u, min, max, casas, texto?, criterio?, obrig?, grupo?}],
  //         obs: [{k, r, opcoes: [[valor, rótulo, bom?]], dica}], espec: [[chave, rótulo, referência]],
  //         notas, dicaCond, extra?(d, res, avisos), exemplos }
  //   criterio: true — a condição faz parte do critério de aceitação (fora da faixa → não satisfatório);
  //   obrig: true — sem ela não há parecer.
  // =====================================================================================
  function fichaQualitativa(cfg) {
    var params = (cfg.params || []).concat(cfg.obs.map(function (o) {
      return { k: o.k, r: o.r, tipo: "select", opcoes: [["", "— não registrado —"]].concat(o.opcoes.map(function (x) { return [x[0], x[1]]; })), dica: o.dica };
    }));
    if (cfg.espec && cfg.espec.length) {
      params.push({ k: "espec", r: "Especificação para comparação — opcional", tipo: "select",
        opcoes: [["", "— sem comparação —"]].concat(cfg.espec.map(function (e) { return [e[0], e[1]]; })) });
    }
    function especEscolhida(P) { return (cfg.espec || []).filter(function (e) { return e[0] && e[0] === P.espec; })[0] || null; }
    var F = {
      titulo: cfg.titulo, resumo: cfg.resumo, blocos: [], params: params, padrao: cfg.padrao || {},
      tabelas: function (d) {
        return [{ chave: "cond", titulo: "Condições do ensaio", rotulo: "Condição", iniciais: 1, min: 1, fixo: true, nomes: ["Registrado"],
          dica: cfg.dicaCond || "registre o que foi feito; a ficha confere com o prescrito pela norma",
          linhas: cfg.cond(d).map(function (c) { return c.grupo ? { grupo: c.grupo } : { k: c.k, r: c.r, u: c.u, texto: c.texto, ph: c.ph }; }) }];
      },
      calcular: function (d) {
        var P = d.params || {}, avisos = [], c0 = (d.cond || [])[0] || {};
        var fora = 0, informadas = 0, critFalha = false, faltaObrig = [];
        cfg.cond(d).forEach(function (c) {
          if (c.grupo || c.texto) return;
          var v = num(c0[c.k]);
          if (!ok(v)) { if (c.obrig) faltaObrig.push(c.r); return; }
          informadas++;
          var a = condicao(c, v);
          if (!a) return;
          if (c.criterio) { critFalha = true; avisos.unshift(a.replace("fora do prescrito", "não atende ao critério")); }
          else { fora++; avisos.push(a); }
        });
        var obs = cfg.obs.map(function (o) {
          var op = o.opcoes.filter(function (x) { return x[0] && x[0] === P[o.k]; })[0];
          return { r: o.r, rot: op ? op[1] : "", bom: op ? op[2] !== false : null };
        });
        var res = { obs: obs, fora: fora, informadas: informadas, ruim: critFalha || obs.some(function (x) { return x.bom === false; }),
          pend: obs.some(function (x) { return x.bom === null; }) || faltaObrig.length > 0 };
        if (cfg.extra) cfg.extra(d, res, avisos);
        res.satisf = res.ruim ? false : res.pend ? null : true;
        if (res.satisf === null) {
          var falta = obs.filter(function (x) { return x.bom === null; }).map(function (x) { return x.r; }).concat(faltaObrig);
          if (falta.length) avisos.push("Para o parecer, registre: " + falta.join("; ") + ".");
        }
        if (fora) avisos.push("Há " + fora + " condição(ões) fora do prescrito: o resultado pode não ser representativo — confira ou refaça o ensaio.");
        var e = especEscolhida(P);
        res.espec = e ? e[2] : "";
        res.conforme = e && res.satisf !== null ? res.satisf : null;
        return { tab: { cond: [{}] }, resultados: res, avisos: avisos };
      },
      resultadosHtml: function (calc) {
        var r = calc.resultados;
        var h = '<div class="fe-res">' + card(parecerHtml(r.satisf), "Resultado" + (r.espec ? " — " + esc(r.espec) + sit(r.conforme) : ""), true);
        r.obs.forEach(function (o) { h += card(o.rot ? esc(o.rot) : "—", esc(o.r)); });
        if (cfg.cards) h += cfg.cards(r);
        h += card(r.informadas ? (r.fora ? '<span class="fe-nok">' + r.fora + " fora</span>" : '<span class="fe-ok">conferidas</span>') : "—",
          "Condições do ensaio (" + r.informadas + " registrada(s))");
        return h + "</div>";
      },
      relatorio: {
        notas: cfg.notas,
        resultados: function (calc, d) {
          var r = calc.resultados, P = d.params || {}, rows = [];
          if (P.material) rows.push(["Material", P.material]);
          r.obs.forEach(function (o) { rows.push([o.r, o.rot || "—"]); });
          if (cfg.linhasRel) cfg.linhasRel(r, d).forEach(function (x) { rows.push(x); });
          rows.push(["Condições do ensaio", !r.informadas ? "não registradas" : r.fora ? r.fora + " fora do prescrito (ver avisos)" : "conferidas — dentro do prescrito"]);
          rows.push(["Resultado", parecerTxt(r.satisf)]);
          if (r.espec) rows.push(["Especificação", r.espec + (r.conforme === null ? "" : r.conforme ? " — ATENDE" : " — NÃO ATENDE")]);
          return rows;
        },
      },
      exemplos: cfg.exemplos,
    };
    return F;
  }

  FE.sinalizacao2 = {
    EM: EM, paramsLimite: paramsLimite, limite: limite, confere: confere, textoLim: textoLim, sit: sit, sitTxt: sitTxt,
    card: card, parecerHtml: parecerHtml, parecerTxt: parecerTxt, condicao: condicao, faixaCond: faixaCond, nominal: nominal,
    importar248: importar248, fichaQualitativa: fichaQualitativa,
  };

  // =====================================================================================
  // DNER-ME 011/94 — Resistência à solução de cloreto de cálcio
  // =====================================================================================
  var n10 = nominal(10, 1), n1 = nominal(1, 1);
  FE.FICHAS["dner-me-011-94"] = fichaQualitativa({
    titulo: "Microesferas de vidro — resistência à solução de cloreto de cálcio",
    resumo: "10 g de microesferas imersas em solução de CaCl₂ 1,0 N por 3 h; filtrar, secar ao ar e observar ao microscópio (100× a 200×): satisfatório se a superfície não estiver embaçada (7).",
    params: [{ k: "material", r: "Material", ph: "ex.: microesferas tipo I B (premix)" }],
    cond: function () {
      return [
        { k: "massa", r: "Massa da amostra (6.1 — 10 g)", u: "g", min: n10.min, max: n10.max, casas: 2 },
        { k: "normal", r: "Normalidade da solução de CaCl₂ (4 — 1,0 N)", u: "N", min: n1.min, max: n1.max, casas: 2 },
        { k: "tempo", r: "Tempo de repouso (6.2 — 3 h)", u: "h", min: 3, casas: 1 },
        { k: "aumento", r: "Aumento do microscópio (3 g — 100× a 200×)", u: "×", min: 100, max: 200, casas: 0 },
      ];
    },
    obs: [{ k: "superficie", r: "Superfície das microesferas ao microscópio (7)", opcoes: [["limpa", "Não embaçada", true], ["embacada", "Embaçada", false]],
      dica: "observar após filtrar e secar ao ar (6.3)" }],
    espec: [["373", "DNER-EM 373/2000 — 5.1: não devem apresentar superfície embaçada", "DNER-EM 373/2000, 5.1"],
      ["379", "DNER-EM 379/98 — 5.1: não devem apresentar superfície embaçada", "DNER-EM 379/98, 5.1"]],
    notas: "Satisfatório quando, ao microscópio, as microesferas não apresentam superfície embaçada (7.1); caso contrário, não satisfatório (7.2). " +
      "A norma não fixa tolerâncias para a massa e a solução: a ficha avisa desvios acima de 1 % do valor nominal; o tempo de repouso é tratado como mínimo.",
    exemplos: [
      { nome: "Microesferas tipo I B — superfície não embaçada", dados: function () {
        return { ident: { registro: "EX-MV011-01", data: "2026-03-09", obra: "Obra A", local: "Lote 12", origem: "Fornecedor A", camada: "Microesferas tipo I B (premix)" },
          params: { material: "Microesferas de vidro tipo I B", superficie: "limpa", espec: "373" },
          cond: [{ massa: "10,00", normal: "1,00", tempo: "3,0", aumento: "150" }] };
      } },
      { nome: "Microesferas tipo F — superfície embaçada, repouso curto (reprovado)", dados: function () {
        return { ident: { registro: "EX-MV011-02", data: "2026-03-10", obra: "Obra B", local: "Lote 7", origem: "Fornecedor B", camada: "Microesferas tipo F (drop-on)" },
          params: { material: "Microesferas de vidro tipo F", superficie: "embacada", espec: "373" },
          cond: [{ massa: "10,02", normal: "1,00", tempo: "2,5", aumento: "100" }] };
      } },
    ],
  });
  window.FE.FICHAS["dner-me-011-94"].rotuloImportar = function (r) { return "CaCl₂: " + (r.satisf === true ? "satisfatório" : r.satisf === false ? "não satisfatório" : "sem parecer"); };
})();
