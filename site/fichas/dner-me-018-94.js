/*
 * Ficha: DNER-ME 018/94 — Tinta para demarcação viária — verificação do sangramento no asfalto.
 *
 * Este arquivo carrega antes das demais fichas de TINTA para demarcação viária e expõe o código comum em
 * window.FE.sinalizacao:
 *  - limites das especificações de material (DNER-EM 276/00, 368/00 e 371/00) — quantitativos (Tabela 1/2)
 *    e qualitativos (Tabela 2/3), como parâmetro opcional das fichas;
 *  - fichaQualitativa(cfg): monta uma ficha de ensaio de aprovação por observação (condições do ensaio com
 *    tolerâncias da norma + observações S/N + parecer);
 *  - tabelas de Unidades Krebs da DNER-ME 028/94 (Anexo B) usadas pela 028 e pela 038.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var S = FE.sinalizacao = FE.sinalizacao || {};

  // ---------------------------------------------------------------------------------------------
  // Especificações de material (tinta para sinalização horizontal)
  // ---------------------------------------------------------------------------------------------
  S.ESPECS = {
    em276: { codigo: "DNER-EM 276/00", nome: "resina acrílica emulsionada em água", quant: "Tabela 1", qual: "Tabela 3" },
    em368: { codigo: "DNER-EM 368/00", nome: "resina acrílica e/ou vinílica (base solvente)", quant: "Tabela 1", qual: "Tabela 2" },
    em371: { codigo: "DNER-EM 371/00", nome: "resina estireno-acrilato e/ou estireno-butadieno", quant: "Tabela 1", qual: "Tabela 2" },
  };
  // limites quantitativos: {min, max}; por cor quando a EM distingue branca/amarela
  S.LIM = {
    consistencia: { nome: "Consistência", un: "UK", casas: 0,
      em276: { min: 75, max: 95 }, em368: { min: 80, max: 95 }, em371: { min: 75, max: 90 } },
    estabArm: { nome: "Estabilidade na armazenagem — alteração de consistência", un: "UK", casas: 0,
      em276: { max: 10 }, em368: { max: 5 }, em371: { max: 5 } },
    naoVolatil: { nome: "Matéria não volátil", un: "% em massa", casas: 2,
      em276: { min: 77 }, em368: { min: 62.8, max: 69 }, em371: { min: 65.9 } },
    veicNV: { nome: "Veículo não volátil no veículo", un: "%", casas: 2, em276: { min: 44 }, em368: { min: 38 }, em371: { min: 38 } },
    veicTotal: { nome: "Veículo total na tinta", un: "%", casas: 2, em368: { min: 50, max: 60 }, em371: { max: 55 } },
    pigmento: { nome: "Pigmento", un: "% em massa", casas: 2, em368: { min: 40, max: 50 }, em371: { min: 45 } },
    tio2: { nome: "Dióxido de titânio no pigmento (tinta branca)", un: "%", casas: 2, em368: { min: 25 }, em371: { min: 22 } },
    pbcro4: { nome: "Cromato de chumbo no pigmento (tinta amarela)", un: "%", casas: 2, em368: { min: 22 }, em371: { min: 22 } },
    secagem: { nome: "Tempo de secagem \"no pick-up time\"", un: "min", casas: 1, em276: { max: 12 }, em368: { max: 15 }, em371: { max: 15 } },
    brilho: { nome: "Brilho a 60°", un: "unidades", casas: 1, em276: { max: 20 }, em368: { max: 20 }, em371: { max: 20 } },
    abrasao: { nome: "Resistência à abrasão", un: "L", casas: 1,
      em276: { branca: { min: 100 }, amarela: { min: 90 } }, em368: { min: 80 }, em371: { min: 65 } },
    finura: { nome: "Finura de moagem", un: "Hegman", casas: 1, em276: { min: 4 } },
    cobertura: { nome: "Poder de cobertura — leitura máxima (placa nº 7)", un: "mm", casas: 1,
      em276: { branca: { max: 10, tab: "Tabela 2" }, amarela: { max: 16, tab: "Tabela 2" } } },
  };
  // requisitos qualitativos
  S.QUALI = {
    sangramento: { nome: "Sangramento", em276: { req: "Ausência", tab: "4.14" }, em368: { req: "Ausência" }, em371: { req: "Ausência" } },
    flexibilidade: { nome: "Flexibilidade", em276: { req: "Satisfatória" }, em368: { req: "Satisfatória" }, em371: { req: "Satisfatória" } },
    agua: { nome: "Resistência à água", em276: { req: "Satisfatória" }, em368: { req: "Satisfatória" }, em371: { req: "Satisfatória" } },
    calor: { nome: "Resistência ao calor", em276: { req: "Satisfatória" }, em368: { req: "Satisfatória" }, em371: { req: "Satisfatória" } },
    diluicao: { nome: "Estabilidade na diluição", em276: { req: "Satisfatória" }, em368: { req: "Satisfatória" }, em371: { req: "Satisfatória" } },
    aderencia: { nome: "Aderência", em276: { req: "Satisfatória" }, em368: { req: "Satisfatória" }, em371: { req: "Satisfatória" } },
    nata: { nome: "Formação de nata", em276: { req: "Ausência" }, em368: { req: "Ausência" }, em371: { req: "Ausência" } },
    breu: { nome: "Breu e derivados", em368: { req: "Ausência" }, em371: { req: "Ausência" } },
    cor: { nome: "Cor (notação Munsell Highway)",
      em276: { req: "branca: N 9.5 (tolerância N 9.0) ou padrão branco; amarela: 10YR 7,5/14 e tolerâncias, exceto 2,0Y 7,5/14 e 10YR 6,5/14" },
      em368: { req: "branca: N 9.5 (tolerância N 9.0) ou padrão branco; amarela: 10YR 7,5/14 e tolerâncias, exceto 2,0Y 7,5/14 e 10YR 6,5/14" },
      em371: { req: "branca: N 9.5 (tolerância N 9.0) ou padrão branco; amarela: 10YR 7,5/14 e tolerâncias, exceto 2,0Y 7,5/14 e 10YR 6,5/14" } },
  };

  // parâmetros comuns de identificação da tinta
  S.paramsTinta = function () {
    return [
      { k: "tinta", r: "Tinta (resina / produto)", ph: "ex.: acrílica base solvente" },
      { k: "cor", r: "Cor da tinta", tipo: "select", opcoes: [["branca", "Branca"], ["amarela", "Amarela"]] },
      { k: "lote", r: "Partida / lote de fabricação" },
    ];
  };
  // seletor da especificação (e limites manuais, quando a verificação é quantitativa)
  S.paramsEspec = function (chave, un) {
    var L = S.LIM[chave] || S.QUALI[chave] || {}, quant = !!S.LIM[chave];
    var ops = [["", "— sem verificação —"]];
    Object.keys(S.ESPECS).forEach(function (e) { if (L[e]) ops.push([e, S.ESPECS[e].codigo + " — " + S.ESPECS[e].nome]); });
    if (quant) ops.push(["manual", "Outro limite (informar)"]);
    var ps = [{ k: "espec", r: "Especificação para verificação (opcional)", tipo: "select", recarrega: true, opcoes: ops,
      dica: "limite da especificação de material da tinta" }];
    if (quant) {
      var se = function (d) { return (d.params || {}).espec === "manual"; };
      ps.push({ k: "limMin", r: "Limite mínimo (" + (un || L.un) + ") — opcional", se: se });
      ps.push({ k: "limMax", r: "Limite máximo (" + (un || L.un) + ") — opcional", se: se });
    }
    return ps;
  };
  // {min, max, fonte} ou null
  S.limite = function (chave, P) {
    P = P || {};
    if (P.espec === "manual") {
      var mi = num(P.limMin), ma = num(P.limMax);
      return ok(mi) || ok(ma) ? { min: ok(mi) ? mi : null, max: ok(ma) ? ma : null, fonte: "limite informado" } : null;
    }
    var L = S.LIM[chave], E = S.ESPECS[P.espec];
    if (!L || !E || !L[P.espec]) return null;
    var e = L[P.espec];
    if (e.branca) e = e[P.cor === "amarela" ? "amarela" : "branca"];
    return { min: e.min !== undefined ? e.min : null, max: e.max !== undefined ? e.max : null,
      fonte: E.codigo + ", " + (e.tab || E.quant) };
  };
  S.textoLimite = function (lim, un, casas) {
    if (!lim) return "";
    var c = casas === undefined ? 2 : casas, u = un ? " " + un : "";
    if (lim.min !== null && lim.max !== null) return fmt(lim.min, c) + " a " + fmt(lim.max, c) + u;
    if (lim.min !== null) return "≥ " + fmt(lim.min, c) + u;
    return "≤ " + fmt(lim.max, c) + u;
  };
  // true / false / null
  S.confere = function (v, lim) {
    if (!lim || !ok(v)) return null;
    return !((lim.min !== null && v < lim.min) || (lim.max !== null && v > lim.max));
  };
  S.selo = function (conf) {
    return conf === null || conf === undefined ? "" : conf ? '<span class="fe-ok">atende</span>' : '<span class="fe-nok">não atende</span>';
  };
  // texto do parecer quantitativo para relatório e aviso
  S.parecer = function (nome, v, lim, un, casas) {
    var c = S.confere(v, lim);
    if (c === null) return "";
    return (c ? "atende" : "NÃO ATENDE") + " — exigido " + S.textoLimite(lim, un, casas) + " (" + lim.fonte + ")";
  };
  S.avisoLimite = function (avisos, nome, v, lim, un, casas) {
    if (S.confere(v, lim) === false) {
      avisos.push(nome + " = " + fmt(v, casas) + " " + un + ": fora do exigido " + S.textoLimite(lim, un, casas) + " (" + lim.fonte + ").");
    }
  };
  // requisito qualitativo {req, fonte} ou null
  S.qualiReq = function (chave, P) {
    var Q = S.QUALI[chave], E = S.ESPECS[(P || {}).espec];
    if (!Q || !E || !Q[P.espec]) return null;
    return { req: Q[P.espec].req, fonte: E.codigo + ", " + (Q[P.espec].tab || E.qual) };
  };

  // leitura S/N: true (sim), false (não), undefined (vazio/ilegível)
  S.sn = function (v) {
    var s = String(v === undefined || v === null ? "" : v).trim().toLowerCase();
    if (!s) return undefined;
    if (/^(s|sim|x|1|p|presen[çc]a|y|yes)$/.test(s)) return true;
    if (/^(n|n[ãa]o|0|-|a|aus[êe]ncia|no)$/.test(s)) return false;
    return undefined;
  };
  S.temDados = function (p, chaves) {
    return (chaves || Object.keys(p || {})).some(function (k) { return k !== "usar" && p[k] !== undefined && String(p[k]).trim() !== ""; });
  };
  // condição com tolerância: {k, r, u, lo, hi, cs}; registra aviso se fora
  S.faixa = function (c) {
    var cs = c.cs === undefined ? 1 : c.cs;
    if (c.lo !== undefined && c.hi !== undefined) return fmt(c.lo, cs) + " a " + fmt(c.hi, cs) + " " + (c.u || "");
    if (c.lo !== undefined) return "≥ " + fmt(c.lo, cs) + " " + (c.u || "");
    if (c.hi !== undefined) return "≤ " + fmt(c.hi, cs) + " " + (c.u || "");
    return "";
  };
  S.verificarCondicoes = function (linhas, p, rot, avisos) {
    var fora = 0;
    linhas.forEach(function (c) {
      if (!c.k || (c.lo === undefined && c.hi === undefined)) return;
      var v = num(p[c.k]);
      if (!ok(v)) return;
      if ((c.lo !== undefined && v < c.lo - 1e-9) || (c.hi !== undefined && v > c.hi + 1e-9)) {
        fora++;
        avisos.push(rot + ": " + (c.curto || c.r) + " = " + fmt(v, c.cs === undefined ? 1 : c.cs) + " " + (c.u || "") +
          ", fora do prescrito (" + S.faixa(c).trim() + ")" + (c.sec ? " — " + c.sec : "") + ".");
      }
    });
    return fora;
  };
  // linhas de condição usadas por vários métodos
  S.COND = {
    espessura: function (sec) {
      return { k: "esp", r: "Espessura da película úmida — 0,38 ± 0,02 mm (" + sec + ")", curto: "espessura da película úmida", u: "mm", lo: 0.36, hi: 0.40, cs: 2, sec: sec };
    },
    temp: function (k, rot, alvo, tol, sec) {
      return { k: k, r: rot + " — " + fmt(alvo, 0) + " ± " + fmt(tol, tol < 1 ? 1 : 0) + " °C (" + sec + ")", curto: rot.toLowerCase(), u: "°C",
        lo: alvo - tol, hi: alvo + tol, cs: tol < 1 ? 1 : 0, sec: sec };
    },
    duracao: function (k, rot, h, sec, u) {
      return { k: k, r: rot + " — " + fmt(h, h % 1 ? 1 : 0) + " " + (u || "h") + " (" + sec + ")", curto: rot.toLowerCase(), u: u || "h", lo: h, cs: 1, sec: sec };
    },
  };

  // linha "Tinta" do relatório
  S.linhaTinta = function (P) {
    P = P || {};
    return P.tinta || P.lote ? [["Tinta", (P.tinta || "—") + " — " + (P.cor || "") + (P.lote ? " — lote " + P.lote : "")]] : [];
  };
  // duas determinações: diferença máxima entre elas (repetibilidade); devolve a diferença
  S.duplicata = function (vals, maxDif, nome, un, avisos, sec, casas) {
    var v = vals.filter(ok), c = casas === undefined ? 2 : casas;
    if (!v.length) return NaN;
    if (v.length < 2) { avisos.push("O resultado é a média de duas determinações (" + sec + "); há " + v.length + "."); return NaN; }
    var dif = Math.max.apply(null, v) - Math.min.apply(null, v);
    if (dif > maxDif + 1e-9) avisos.push(nome + ": diferença de " + fmt(dif, c) + " " + un + " entre as determinações, acima de " + fmt(maxDif, 2) + " " + un + " (" + sec + ") — repita o ensaio.");
    return dif;
  };

  // resultado em destaque (verdade/falso/nulo) com textos
  S.itemRes = function (valorHtml, rotulo, classe) {
    return '<div class="fe-res-item"><div class="fe-res-v' + (classe ? " " + classe : "") + '">' + valorHtml + '</div><div class="fe-res-r">' + rotulo + "</div></div>";
  };

  // ---------------------------------------------------------------------------------------------
  // Ficha qualitativa (aprovação por observação)
  // cfg: {titulo, resumo, chave, bom, mau, rotulo, tabTitulo, dica, condicoes[], observacoes[{k, r, curto, defeito}],
  //       linhasExtra[], calc(p, o, rot, avisos, defeitos, P), params[], padrao{}, notas, exemplos[]}
  // ---------------------------------------------------------------------------------------------
  S.fichaQualitativa = function (cfg) {
    var bom = cfg.bom || "Satisfatório", mau = cfg.mau || "Não satisfatório", rotulo = cfg.rotulo || "Placa";
    var obs = cfg.observacoes || [];
    var linhas = [{ grupo: "Condições do ensaio (tolerâncias da norma)" }].concat(cfg.condicoes || [])
      .concat(obs.length ? [{ grupo: cfg.grupoObs || "Exame a olho nu — responda S (sim) ou N (não)" }] : [])
      .concat(obs.map(function (o) { return { k: o.k, r: o.r, texto: true, ph: "S/N" }; }))
      .concat(cfg.linhasExtra || []);
    var chavesObs = obs.map(function (o) { return o.k; });
    function nomeCol(i) { return cfg.nomes ? cfg.nomes[i] : rotulo + " " + (i + 1); }

    function calcular(d) {
      var P = d.params || {}, avisos = [], foraTot = 0;
      var tab = (d.cps || []).map(function (p, i) {
        var o = {}, rot = nomeCol(i);
        if (!S.temDados(p)) { o.veredito = null; o.vazio = true; return o; }
        foraTot += S.verificarCondicoes(cfg.condicoes || [], p, rot, avisos);
        var defeitos = [], faltam = [];
        obs.forEach(function (ob) {
          var v = S.sn(p[ob.k]);
          if (v === undefined) { if (ob.defeito !== false) faltam.push(ob.curto || ob.r); }
          else if (v && ob.defeito !== false) defeitos.push(ob.curto || ob.r);
        });
        var extra = cfg.calc ? cfg.calc(p, o, rot, avisos, defeitos, P) : undefined;
        if (extra === "falta") faltam.push(cfg.faltaExtra || "o dado principal");
        o.defeitos = defeitos;
        o.veredito = defeitos.length ? false : (faltam.length ? null : true);
        if (faltam.length && !defeitos.length) avisos.push(rot + ": registre " + faltam.join(", ") + (chavesObs.length ? " (S ou N)" : "") + " para concluir.");
        return o;
      });
      var usados = tab.filter(function (o) { return !o.vazio; });
      var ver = usados.some(function (o) { return o.veredito === false; }) ? false
        : (usados.length && usados.every(function (o) { return o.veredito === true; }) ? true : null);
      var req = S.qualiReq(cfg.chave, P);
      if (req && ver === false) avisos.push("Resultado \"" + mau + "\": não atende ao requisito \"" + req.req + "\" (" + req.fonte + ").");
      if (foraTot) avisos.push("Ensaio com condição fora do prescrito na norma: o resultado não é válido para aceitação; repita o ensaio nas condições da norma.");
      var def = [];
      usados.forEach(function (o, i) { if (o.defeitos && o.defeitos.length) def.push(nomeCol(tab.indexOf(o)) + ": " + o.defeitos.join(", ")); });
      return { tab: { cps: tab }, resultados: { ver: ver, texto: ver === null ? "—" : ver ? bom : mau, defeitos: def,
        req: req, conforme: req && ver !== null ? ver : null, condFora: foraTot, n: usados.length }, avisos: avisos };
    }

    return {
      titulo: cfg.titulo,
      resumo: cfg.resumo,
      blocos: [],
      params: S.paramsTinta().concat(cfg.params || []).concat(S.paramsEspec(cfg.chave)),
      padrao: Object.assign({ cor: "branca", espec: "" }, cfg.padrao || {}),
      tabelas: function (d) {
        var T = { chave: "cps", titulo: cfg.tabTitulo || "Placas ensaiadas", rotulo: rotulo, iniciais: 1, min: 1,
          dica: cfg.dica || "uma coluna por placa/corpo de prova; S = sim, N = não nas observações", linhas: linhas };
        if (cfg.nomes) {  // colunas fixas com nome (ex.: um procedimento por coluna)
          var n = cfg.nomes.length;
          if (d && Array.isArray(d.cps)) { while (d.cps.length < n) d.cps.push({}); if (d.cps.length > n) d.cps.length = n; }
          T.iniciais = T.min = n; T.fixo = true; T.nomes = cfg.nomes;
        }
        return [T];
      },
      calcular: calcular,
      resultadosHtml: function (calc) {
        var r = calc.resultados;
        var cls = r.ver === null ? "fe-res-p" : "";
        var v = r.ver === null ? "—" : '<span class="' + (r.ver ? "fe-ok" : "fe-nok") + '">' + esc(r.texto) + "</span>";
        var h = '<div class="fe-res">' + S.itemRes(v, esc(cfg.nomeResultado || cfg.titulo) + (r.condFora ? " · condições fora da norma" : ""), cls);
        if (r.req) h += S.itemRes(esc(r.req.req), "Exigido — " + esc(r.req.fonte) + (r.conforme === null ? "" : " · " + S.selo(r.conforme)), "fe-res-p");
        if (r.defeitos.length) h += S.itemRes(esc(r.defeitos.join(" · ")), "Ocorrências observadas", "fe-res-p");
        return h + "</div>";
      },
      relatorio: {
        notas: cfg.notas,
        resultados: function (calc, d) {
          var r = calc.resultados, P = d.params || {}, rows = [];
          if (P.tinta) rows.push(["Tinta", P.tinta + (P.cor ? " — " + P.cor : "") + (P.lote ? " — lote " + P.lote : "")]);
          rows.push([cfg.nomeResultado || cfg.titulo, r.texto + (r.condFora ? " (condições fora da norma — repetir)" : "")]);
          if (r.defeitos.length) rows.push(["Ocorrências observadas", r.defeitos.join("; ")]);
          if (r.req) rows.push(["Exigido (" + r.req.fonte + ")", r.req.req + (r.conforme === null ? "" : r.conforme ? " — ATENDE" : " — NÃO ATENDE")]);
          (cfg.relExtra ? cfg.relExtra(calc, d) : []).forEach(function (x) { rows.push(x); });
          return rows;
        },
      },
      exemplos: cfg.exemplos,
    };
  };

  // ---------------------------------------------------------------------------------------------
  // Unidades Krebs — DNER-ME 028/94, Anexo B
  // ---------------------------------------------------------------------------------------------
  // Tabela II (Procedimento B): carga (g) que dá 200 rpm -> UK. O valor impresso para 1 050 g (144) quebra a
  // sequência (1 040 g = 140; 1 060 g = 141) e foi omitido (interpola-se); "216" lido como 215 g.
  var T2 = [[70, 53], [75, 54], [80, 55], [85, 57], [90, 58], [95, 60], [100, 61], [105, 62], [110, 63], [115, 64], [120, 65], [125, 67],
    [130, 68], [135, 69], [140, 70], [145, 71], [150, 72], [155, 73], [160, 74], [165, 75], [170, 76], [175, 77], [180, 78], [185, 79],
    [190, 80], [195, 81], [200, 82], [205, 83], [210, 83], [215, 84], [220, 85], [225, 86], [230, 86], [235, 87], [240, 88], [245, 88],
    [250, 89], [255, 90], [260, 90], [265, 91], [270, 91], [275, 92], [280, 93], [285, 93], [290, 94], [295, 94], [300, 95], [310, 96],
    [320, 97], [330, 98], [340, 99], [350, 100], [360, 101], [370, 102], [380, 102], [390, 103], [400, 104], [410, 105], [420, 106],
    [430, 106], [440, 107], [450, 108], [460, 109], [470, 110], [480, 110], [490, 111], [500, 112], [510, 113], [520, 114], [530, 114],
    [540, 115], [550, 116], [560, 117], [570, 118], [580, 118], [590, 119], [600, 120], [610, 120], [620, 121], [630, 121], [640, 122],
    [650, 122], [660, 123], [670, 123], [680, 124], [690, 124], [700, 125], [710, 126], [720, 126], [730, 127], [740, 127], [750, 128],
    [760, 129], [770, 129], [780, 130], [790, 131], [800, 131], [810, 132], [820, 132], [830, 133], [840, 133], [850, 134], [860, 134],
    [870, 135], [880, 135], [890, 136], [900, 136], [910, 136], [920, 137], [930, 137], [940, 138], [950, 138], [960, 138], [970, 139],
    [980, 139], [990, 140], [1000, 140], [1010, 140], [1020, 140], [1030, 140], [1040, 140], [1060, 141], [1070, 141], [1080, 141], [1090, 141]];
  // Tabela I (Procedimento A): UK por segundos para 100 rotações (24 a 40 s) × massa (g); null = célula "..."
  var T1_M = [75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500,
    525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900, 950, 1000];
  var _ = null;
  var T1 = {
    24: [42, 52, _, 65, _, 75, _, 83, _, 90, _, 95, _, 99, _, 103, _, 108, _, 111, _, 115, _, 118, _, 122, _, 125, _, 128, _, 130, _, 132, _, 136],
    25: [45, 54, _, 66, _, 76, _, 84, _, 90, _, 95, _, 100, _, 104, _, 109, _, 112, _, 116, _, 119, _, 122, _, 125, _, 129, _, 131, _, 133, _, 137],
    26: [47, 56, _, 68, _, 78, _, 85, _, 91, _, 96, _, 101, _, 105, _, 110, _, 113, _, 117, _, 120, _, 123, _, 126, _, 130, _, 132, _, 134, _, 138],
    27: [49, 57, 63, 69, 74, 79, 83, 86, 89, 92, 95, 97, 100, 102, 104, 106, 109, 111, 113, 114, 116, 118, 120, 121, 123, 124, 126, 127, 129, 130, 131, 132, 133, 134, 136, 138],
    28: [51, 59, 65, 70, 75, 80, 84, 87, 90, 93, 96, 98, 100, 102, 105, 107, 110, 112, 114, 115, 117, 118, 120, 121, 123, 124, 126, 127, 129, 130, 131, 132, 133, 134, 137, 139],
    29: [53, 60, 66, 71, 76, 81, 85, 88, 91, 94, 97, 99, 101, 103, 105, 107, 110, 112, 114, 115, 117, 119, 121, 122, 124, 125, 127, 128, 130, 131, 132, 133, 134, 135, 137, 139],
    30: [54, 61, 67, 72, 77, 82, 86, 89, 92, 95, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 121, 122, 124, 125, 127, 128, 130, 131, 133, 134, 135, 136, 138, 140],
    31: [55, 62, 68, 73, 78, 82, 86, 90, 93, 95, 98, 100, 102, 104, 106, 108, 111, 113, 115, 116, 118, 120, 122, 123, 125, 126, 128, 129, 131, 132, 133, 134, 135, 136, 138, 140],
    32: [56, 63, 69, 74, 79, 83, 87, 90, 93, 96, 99, 101, 103, 105, 107, 109, 111, 113, 115, 116, 118, 120, 122, 123, 125, 126, 128, 129, 131, 132, 133, 134, 135, 136, 138, 140],
    33: [57, 64, 70, 75, 80, 84, 88, 91, 94, 96, 99, 101, 103, 105, 107, 109, 112, 114, 116, 117, 119, 121, 122, 123, 125, 126, 128, 129, 131, 132, 134, 135, 136, 137, 139, 141],
    34: [58, 64, _, 75, _, 84, _, 91, _, 97, _, 102, _, 106, _, 110, _, 114, _, 118, _, 122, _, 124, _, 127, _, 130, _, 132, _, 135, _, 137, _, 141],
    35: [59, 65, _, 76, _, 85, _, 92, _, 98, _, 102, _, 106, _, 110, _, 114, _, 118, _, 122, _, 124, _, 127, _, 130, _, 133, _, 135, _, 137, _, 142],
    36: [60, 66, _, 76, _, 85, _, 92, _, 98, _, 103, _, 107, _, 111, _, 115, _, 118, _, 122, _, 125, _, 128, _, 130, _, 133, _, 135, _, 137, _, 142],
    37: [61, 67, _, 77, _, 86, _, 93, _, 99, _, 103, _, 107, _, 111, _, 115, _, 119, _, 123, _, 125, _, 128, _, 131, _, 133, _, 136, _, 138, _, 142],
    38: [62, 68, _, 78, _, 87, _, 93, _, 99, _, 104, _, 108, _, 112, _, 116, _, 119, _, 123, _, 126, _, 129, _, 131, _, 134, _, 136, _, 138, _, 142],
    39: [62, 68, _, 78, _, 88, _, 94, _, 100, _, 104, _, 108, _, 112, _, 116, _, 120, _, 124, _, 126, _, 129, _, 131, _, 134, _, 136, _, 138, _, 143],
    40: [63, 69, _, 79, _, 88, _, 94, _, 100, _, 104, _, 108, _, 112, _, 116, _, 120, _, 124, _, 127, _, 130, _, 132, _, 134, _, 136, _, 138, _, 143],
  };
  function interpPares(pares, x) { return FE.interpolar(pares, x); }
  function linhaT1(seg, g) {
    var pares = [];
    T1[seg].forEach(function (v, j) { if (v !== null) pares.push([T1_M[j], v]); });
    return interpPares(pares, g);
  }
  S.krebs = {
    T1: T1, T1_M: T1_M, T2: T2,
    // Tabela II: carga (g) a 200 rpm (= 100 rotações em 30 s) -> UK; NaN fora de 70 a 1 090 g
    ukCarga: function (g) { return interpPares(T2, g); },
    // Tabela I: UK para (segundos para 100 rotações, carga em g), interpolação linear nas duas direções
    ukLeitura: function (seg, g) {
      if (!ok(seg) || !ok(g) || seg < 24 || seg > 40) return NaN;
      var a = Math.floor(seg), b = Math.ceil(seg);
      var ua = linhaT1(a, g);
      if (a === b) return ua;
      var ub = linhaT1(b, g);
      return ua + (ub - ua) * (seg - a);
    },
  };

  // ---------------------------------------------------------------------------------------------
  // DNER-ME 018/94 — Verificação do sangramento no asfalto
  // ---------------------------------------------------------------------------------------------
  FE.FICHAS["dner-me-018-94"] = S.fichaQualitativa({
    titulo: "Tinta para demarcação viária — sangramento no asfalto",
    nomeResultado: "Sangramento",
    resumo: "Película úmida de 0,38 mm entre duas fitas sobre corpo de prova de mistura asfáltica curado ≥ 2 semanas; após 48 h a 25 °C, exame a olho nu: sem mudança perceptível de cor = ausência de sangramento (seção 8).",
    chave: "sangramento",
    bom: "Ausência", mau: "Presença",
    rotulo: "CP",
    tabTitulo: "Corpos de prova de mistura asfáltica",
    dica: "uma coluna por corpo de prova pintado; S = sim, N = não",
    condicoes: [
      { k: "cap", r: "Teor de CAP 50-60 do corpo de prova — 6,3 ± 0,5 % (6.1)", curto: "teor de CAP", u: "%", lo: 5.8, hi: 6.8, cs: 1, sec: "6.1" },
      S.COND.duracao("cura", "Cura do corpo de prova, mínimo 2 semanas", 14, "6.3", "dias"),
      { k: "fitas", r: "Afastamento entre as duas fitas adesivas — 2,5 a 3 cm (7.1)", curto: "afastamento entre as fitas", u: "cm", lo: 2.5, hi: 3.0, cs: 1, sec: "7.1" },
      S.COND.espessura("4 b"),
      S.COND.duracao("seca", "Tempo de secagem da película", 48, "7.4"),
      { k: "temp", r: "Temperatura de secagem — 25 °C (7.4; a norma não fixa tolerância)", u: "°C", cs: 1 },
    ],
    observacoes: [
      { k: "mud", r: "Mudança perceptível de cor da película — migração do asfalto (3.1, 7.5)", curto: "mudança perceptível de cor (migração do asfalto)" },
    ],
    notas: "Sangramento: migração do asfalto provocada pelo solvente da tinta, com mudança perceptível de cor da película (3.1). Película sem mudança perceptível de cor → ausência; caso contrário → presença (seção 8). Corpo de prova: mistura a quente com 6,3 ± 0,5 % de CAP 50-60, granulometria da tabela de 6.1, moldado conforme DNER-ME 043, curado no mínimo 2 semanas.",
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — ausência de sangramento", dados: function () {
        return { ident: { registro: "EX-TS-018-1", obra: "Obra A", origem: "Fornecedor A", camada: "Tinta para sinalização horizontal" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368" },
          cps: [{ cap: "6,2", cura: "16", fitas: "2,8", esp: "0,38", seca: "48", temp: "25", mud: "N" },
            { cap: "6,4", cura: "16", fitas: "2,7", esp: "0,39", seca: "48", temp: "25", mud: "N" }] };
      } },
      { nome: "Tinta amarela — mudança de cor (presença de sangramento), reprovada", dados: function () {
        return { ident: { registro: "EX-TS-018-2", obra: "Obra B", origem: "Fornecedor B", camada: "Tinta para sinalização horizontal" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          cps: [{ cap: "6,3", cura: "15", fitas: "2,5", esp: "0,38", seca: "48", temp: "25", mud: "S" }] };
      } },
    ],
  });
})();
