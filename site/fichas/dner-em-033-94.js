/*
 * Ficha: DNER-EM 033/94 — Mourões de eucalipto preservado para cercas — recebimento do fornecimento.
 *
 * Este arquivo também define FE.recebMaterial (abreviado R): biblioteca comum das fichas de RECEBIMENTO DE
 * MATERIAIS por unidades/corpos de prova (DNER-EM 033, 174, 366, 370, 374, 375, 376 e DNIT 093, 094, 161).
 * Deve ser carregado antes dessas fichas (ordem das tags <script> em index.html). Usa FE.aceitacao (es-comum.js).
 *
 *   R.criar(cfg)        ficha = A.fichaSimples sem lote de estacas (lote: false), com os textos de parecer de material,
 *                       tabelas próprias (cfg.tabelasExtra(d)), linhas próprias no cfg.extra(ctx) e, na tela e no
 *                       relatório, a tabela de cada linha que traga "unidades" (l.unidades + l.tituloUni).
 *                       A frequência só lista os itens com "freq" e o que o extra acrescentar.
 *   R.unidade(c, i, pref)   unidade (CP, peça, rolo, barra) de uma coluna: {rot, contra (am = "C"), seg (am = "2"),
 *                       grupo (campo "rolo"), falhas: [], faltas: [], c}
 *   R.conf(u, v, o)     confere o valor v com {rot, min, max, minEstrito, maxEstrito, casas, un, obrig}: falha → u.falhas;
 *                       vazio e obrigatório → u.faltas.  R.confSN(u, v, rot, obrig): "S"/"N".
 *   R.prova(o)          prova + contraprova (o.nContra CP; o.semContra: sem contraprova; o.porGrupo: por rolo).
 *   R.dupla(o)          amostragem simples/dupla por atributos (NBR 5426): o.plano = {n1, n2, ac1, re1, ac2, re2}.
 *   R.planoTab(rows, N) linha da tabela de amostragem [[de, até, n1, n2, ac1, re1, ac2, re2], ...] para o lote N.
 *   R.cols(d, chave, campos)  colunas da tabela com algum dos campos preenchido.
 *   R.sn, R.redef, R.lim, R.paramsLote(), R.htmlUnidades(titulo, U, relat), R.TEXTOS.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  if (!A) { if (window.console) console.error("dner-em-033-94.js: carregue antes site/fichas/es-comum.js (FE.aceitacao)."); return; }
  var EPS = 1e-9;

  // =====================================================================================
  // FE.recebMaterial — biblioteca comum
  // =====================================================================================
  var R = {};
  R.vazio = function (x) { return x === undefined || x === null || String(x).trim() === ""; };
  R.sn = function (t) {
    t = String(t === undefined || t === null ? "" : t).trim().toLowerCase();
    if (!t) return null;
    if (/^(s|sim|ok|c|x|1|conforme|atende|passa)$/.test(t)) return true;
    if (/^(n|n[aã]o|nc|0|n[aã]o conforme|falha|reprovado)$/.test(t)) return false;
    return null;
  };
  // reescreve a situação de uma linha (A.marcar só piora)
  R.redef = function (l, sit, texto) {
    l.situacao = sit; l.motivo = texto || "";
    l.motivos = sit === "conforme" || sit === "nao_exigido" || sit === "informativo" ? [] : [{ situacao: sit, texto: texto }];
    return l;
  };
  function c2(v, casas) { return fmt(v, casas === undefined ? 1 : casas); }
  // texto do limite: "≥ 5,0 kg/m³", "12 a 14 atm", "≤ 7 %"
  R.lim = function (o) {
    var c = o.casas === undefined ? 1 : o.casas, u = o.un ? " " + o.un : "";
    if (o.txt) return o.txt;
    if (ok(o.min) && ok(o.max)) return c2(o.min, c) + " a " + c2(o.max, c) + u;
    if (ok(o.min)) return (o.minEstrito ? "> " : "≥ ") + c2(o.min, c) + u;
    if (ok(o.max)) return (o.maxEstrito ? "< " : "≤ ") + c2(o.max, c) + u;
    return "—";
  };
  R.fora = function (x, o) {
    return (ok(o.min) && (o.minEstrito ? x <= o.min + EPS : x < o.min - EPS)) || (ok(o.max) && (o.maxEstrito ? x >= o.max - EPS : x > o.max + EPS));
  };
  R.unidade = function (c, i, pref) {
    var am = String(c.am || "").trim();
    return { rot: String(c.id || "").trim() || (pref || "CP") + " " + (i + 1), contra: /^c/i.test(am), seg: am === "2", grupo: String(c.rolo || "").trim(),
      falhas: [], faltas: [], c: c };
  };
  R.conf = function (u, v, o) {
    var x = typeof v === "number" ? v : num(v);
    if (!ok(x)) { if (o.obrig !== false) u.faltas.push(o.rot); return null; }
    if (R.fora(x, o)) { u.falhas.push(o.rot + " " + c2(x, o.casas) + (o.un ? " " + o.un : "") + " (exigido " + R.lim(o) + ")"); return false; }
    return true;
  };
  R.confSN = function (u, v, rot, obrig) {
    var s = R.sn(v);
    if (s === null) { if (obrig !== false) u.faltas.push(rot); return null; }
    if (!s) u.falhas.push(rot + ": não atende");
    return s;
  };
  R.cols = function (d, chave, campos) {
    return (d[chave] || []).filter(function (c) {
      return (campos || Object.keys(c)).some(function (k) { return k !== "usar" && k !== "id" && k !== "am" && k !== "rolo" && !R.vazio(c[k]); });
    });
  };
  function rots(U) { return U.map(function (u) { return u.rot; }).join(", "); }
  function lista(U) { return U.map(function (u) { return u.rot + ": " + u.falhas.join(", "); }).join("; "); }
  R.rots = rots; R.lista = lista;

  // prova + contraprova
  //   o: {id, grupo, criterio, secao, exigido, unidades, nContra (2), semContra, porGrupo, rotGrupo ("rolo"), rotU ("CP"),
  //       txtOk, txtPend, txtNc, txtContraOk, txtSem, tituloUni}
  R.prova = function (o) {
    var U = o.unidades || [], nC = o.nContra === undefined ? 2 : o.nContra, rotU = o.rotU || "CP";
    var ini = U.filter(function (u) { return !u.contra; }), con = U.filter(function (u) { return u.contra; });
    var fi = ini.filter(function (u) { return u.falhas.length; }), fc = con.filter(function (u) { return u.falhas.length; });
    var l = A.linha({ id: o.id, grupo: o.grupo || "", criterio: o.criterio, secao: o.secao || "", exigido: o.exigido || "—", n: U.length,
      resultado: ini.length + " " + rotU + (o.semContra ? " ensaiado(s), " : " na prova, ") + fi.length + " com falha" + (con.length ? "; contraprova: " + con.length + " " + rotU + ", " + fc.length + " com falha" : "") });
    l.unidades = U; l.tituloUni = o.tituloUni || o.criterio;
    if (!ini.length) return R.redef(l, "sem_dados", o.txtSem || "sem resultados de ensaio");
    var grupos = {}, ordem = [];
    U.forEach(function (u) { var g = o.porGrupo ? (u.grupo || "—") : ""; if (!grupos[g]) { grupos[g] = []; ordem.push(g); } grupos[g].push(u); });
    var okTxt = [];
    ordem.forEach(function (g) {
      var G = grupos[g], gi = G.filter(function (u) { return !u.contra; }), gc = G.filter(function (u) { return u.contra; });
      var gfi = gi.filter(function (u) { return u.falhas.length; }), gfc = gc.filter(function (u) { return u.falhas.length; });
      var pre = g ? (o.rotGrupo || "rolo") + " " + g + ": " : "";
      if (!gi.length) { A.marcar(l, "pendente", pre + "há contraprova sem a prova inicial"); return; }
      if (!gfi.length) { if (gc.length) okTxt.push(pre + "contraprova sem prova com falha (ignorada)"); return; }
      if (o.semContra) { A.marcar(l, "nao_conforme", pre + lista(gfi) + (o.txtNc ? " — " + o.txtNc : "")); return; }
      if (gfc.length) { A.marcar(l, "nao_conforme", pre + "falha também na contraprova (" + lista(gfc) + ")" + (o.txtNc ? " — " + o.txtNc : "")); return; }
      if (gc.length < nC) {
        A.marcar(l, "pendente", pre + "falha na prova (" + lista(gfi) + ") — " + (o.txtPend || "fazer a contraprova") + ": " + gc.length + " de " + nC + " " + rotU);
        return;
      }
      okTxt.push(pre + "falha na prova (" + rots(gfi) + "), contraprova de " + gc.length + " " + rotU + " satisfatória" + (o.txtContraOk ? " — " + o.txtContraOk : ""));
    });
    var inc = U.filter(function (u) { return u.faltas.length && !u.falhas.length; });
    if (inc.length) A.marcar(l, "pendente", "dados incompletos — " + inc.map(function (u) { return u.rot + ": falta " + u.faltas.join(", "); }).join("; "));
    if (l.situacao === "conforme") l.motivo = okTxt.length ? okTxt.join("; ") : (o.txtOk || "todos os resultados atendem");
    else if (okTxt.length) l.motivo += "; " + okTxt.join("; ");
    return l;
  };

  // linha da tabela de amostragem para o lote N: rows [[de, até, n1, n2, ac1, re1, ac2, re2]]
  R.planoTab = function (rows, N) {
    if (!ok(N)) return null;
    var r = rows.filter(function (x) { return N >= x[0] && N <= x[1]; })[0];
    return r ? { de: r[0], ate: r[1], n1: r[2], n2: r[3], ac1: r[4], re1: r[5], ac2: r[6], re2: r[7] } : null;
  };
  R.txtPlano = function (p) {
    if (!p) return "—";
    return "1ª amostra n = " + p.n1 + " (Ac " + p.ac1 + " / Re " + p.re1 + ")" + (p.n2 ? "; 2ª n = " + p.n2 + " (acumulado Ac " + p.ac2 + " / Re " + p.re2 + ")" : " — amostragem simples");
  };
  // amostragem por atributos: unidades defeituosas (com alguma falha) contra Ac/Re
  //   o: {id, grupo, criterio, secao, plano, unidades (u.seg = 2ª amostra), semPlano, rotU ("unidade"), tituloUni, refs: {aceita, rejeita}}
  R.dupla = function (o) {
    var p = o.plano, U = o.unidades || [], rotU = o.rotU || "unidade(s)";
    var u1 = U.filter(function (u) { return !u.seg; }), u2 = U.filter(function (u) { return u.seg; });
    var d1 = u1.filter(function (u) { return u.falhas.length; }), d2 = u2.filter(function (u) { return u.falhas.length; });
    var l = A.linha({ id: o.id, grupo: o.grupo || "", criterio: o.criterio, secao: o.secao || "", n: U.length, exigido: R.txtPlano(p),
      resultado: "1ª: " + d1.length + " defeituosa(s) em " + u1.length + (u2.length ? "; 2ª: " + d2.length + " em " + u2.length + " (acumulado " + (d1.length + d2.length) + ")" : "") });
    l.unidades = U; l.tituloUni = o.tituloUni || o.criterio; l.plano = p; l.need2 = false;
    var rf = o.refs || {};
    var def = function (D) { return D.length ? " — " + lista(D) : ""; };
    if (!p) return R.redef(l, "pendente", o.semPlano || "tamanho do lote fora da tabela de amostragem");
    if (!u1.length) return R.redef(l, "sem_dados", "nenhuma " + rotU.replace(/\(s\)$/, "") + " inspecionada");
    if (d1.length >= p.re1) R.redef(l, "nao_conforme", d1.length + " defeituosa(s) na 1ª amostra ≥ Re1 = " + p.re1 + ": lote rejeitado" + (rf.rejeita ? " (" + rf.rejeita + ")" : "") + def(d1));
    else if (u1.length < p.n1) R.redef(l, "pendente", "1ª amostra incompleta: " + u1.length + " de " + p.n1 + " " + rotU);
    else if (d1.length <= p.ac1) { l.motivo = d1.length + " ≤ Ac1 = " + p.ac1 + ": lote aceito" + (rf.aceita ? " (" + rf.aceita + ")" : ""); if (d1.length) R.redef(l, "ressalva", d1.length + " ≤ Ac1 = " + p.ac1 + " — lote aceito; separar/substituir a(s) unidade(s) defeituosa(s)" + def(d1)); }
    else {
      l.need2 = true;
      var cum = d1.length + d2.length;
      if (!p.n2) R.redef(l, "nao_conforme", "defeituosas acima de Ac1" + def(d1));
      else if (cum >= p.re2) R.redef(l, "nao_conforme", "acumulado " + cum + " ≥ Re2 = " + p.re2 + ": lote rejeitado" + (rf.rejeita ? " (" + rf.rejeita + ")" : "") + def(d1.concat(d2)));
      else if (u2.length < p.n2) R.redef(l, "pendente", "Ac1 < " + d1.length + " < Re1: retirar a 2ª amostra de " + p.n2 + " " + rotU + " (" + u2.length + " inspecionada(s))" + def(d1));
      else R.redef(l, "ressalva", "acumulado " + cum + " ≤ Ac2 = " + p.ac2 + ": lote aceito na 2ª amostragem; separar/substituir a(s) unidade(s) defeituosa(s)" + def(d1.concat(d2)));
    }
    var inc = U.filter(function (u) { return u.faltas.length && !u.falhas.length; });
    if (inc.length && l.situacao !== "nao_conforme") A.marcar(l, "pendente", "dados incompletos — " + inc.map(function (u) { return u.rot + ": falta " + u.faltas.join(", "); }).join("; "));
    return l;
  };
  // frequência de uma linha de amostragem dupla (exigido = n1, mais n2 quando a 2ª amostra é exigida)
  R.freqDupla = function (l, ensaio, metodo) {
    var p = l.plano, u = l.unidades || [];
    return A.frequencia({ ensaio: ensaio, metodo: metodo || "NBR 5426", exigido: p ? p.n1 + (l.need2 ? p.n2 : 0) : NaN,
      regra: p ? "lote de " + p.de + " a " + p.ate + (l.need2 ? " — 1ª + 2ª amostra" : " — 1ª amostra") : "tamanho do lote fora da tabela",
      realizado: l.need2 ? u.length : u.filter(function (x) { return !x.seg; }).length });
  };

  R.TEXTOS = {
    ACEITO: { titulo: "LOTE ACEITO", texto: "Todos os ensaios e verificações exigidos pela especificação de material atendidos, com a amostragem exigida." },
    RESSALVA: { titulo: "LOTE ACEITO COM RESSALVA", texto: "Nenhum requisito reprovado, mas há unidades a separar ou substituir ou pontos a documentar (ressalvas abaixo)." },
    PENDENTE: { titulo: "LOTE PENDENTE — INSPEÇÃO INCOMPLETA", texto: "Nenhum requisito reprovado até aqui, mas faltam ensaios, amostras (inclusive contraprova ou 2ª amostragem) ou informações exigidos pela especificação: complete a inspeção antes de decidir." },
    REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há requisito não atendido pelo critério de aceitação da especificação: o lote deve ser recusado (devolvido ao fornecedor, ou reapresentado após seleção/correção quando a especificação o permitir)." },
  };
  R.paramsLote = function (o) {
    o = o || {};
    return [
      { k: "lote", r: "Identificação do lote / partida", ph: o.phLote || "ex.: partida 1 — lote 3" },
      { k: "fornecedor", r: "Fabricante / fornecedor", ph: "ex.: Fornecedor A" },
      { k: "nf", r: "Nota fiscal / romaneio nº" },
      { k: "certificado", r: "Certificado do fabricante nº" },
      { k: "dataEntrega", r: "Data de entrega", ph: "dd/mm/aaaa" },
    ];
  };
  function sitUni(u) {
    if (u.falhas.length) return "nao_conforme";
    if (u.faltas.length) return "pendente";
    return "conforme";
  }
  R.htmlUnidades = function (titulo, U, relat) {
    if (!U || !U.length) return "";
    var cls = relat ? "gr" : "fe-resumo", TL = '<td style="text-align:left">';
    var amTxt = function (u) { return u.contra ? "contraprova" : u.seg ? "2ª amostra" : String(u.c.am || "").trim() === "1" ? "1ª amostra" : "prova"; };
    var temAm = U.some(function (u) { return u.contra || u.seg || !R.vazio(u.c.am); });
    var temG = U.some(function (u) { return u.grupo; });
    return (relat ? "<h2>" : '<h4 style="margin:12px 0 4px">') + esc(titulo) + (relat ? "</h2>" : "</h4>") +
      '<table class="' + cls + '"><thead><tr><th style="text-align:left">Unidade</th>' + (temG ? "<th>Rolo</th>" : "") + (temAm ? "<th>Amostra</th>" : "") +
      '<th style="text-align:left">Não conformidades / dados faltantes</th><th style="text-align:left">Situação</th></tr></thead><tbody>' +
      U.map(function (u) {
        var s = sitUni(u);
        return "<tr>" + TL + esc(u.rot) + "</td>" + (temG ? "<td>" + esc(u.grupo || "—") + "</td>" : "") + (temAm ? "<td>" + esc(amTxt(u)) + "</td>" : "") + TL +
          esc(u.falhas.concat(u.faltas.map(function (f) { return "falta: " + f; })).join("; ") || "—") + "</td>" + TL + A.situacaoHtml(s, relat) + "</td></tr>";
      }).join("") + "</tbody></table>";
  };
  function htmlUnidadesDe(calc, relat) {
    return (calc.resultados.linhas || []).filter(function (l) { return l.unidades && l.unidades.length && !l.semTabelaUni; })
      .map(function (l) { return R.htmlUnidades(l.tituloUni || l.criterio, l.unidades, relat); }).join("");
  }
  // cfg: os de A.fichaSimples + tabelasExtra(d), extra(ctx), cartoes(calc, d) -> html, resumoRel(calc, d) -> [[r, v]], graficos
  R.criar = function (cfg) {
    var comFreq = {};
    (cfg.criterios || []).forEach(function (it) { if (it.freq) comFreq[it.texto] = true; });
    var textos = {};
    Object.keys(R.TEXTOS).forEach(function (k) { textos[k] = Object.assign({}, R.TEXTOS[k], (cfg.textos || {})[k] || {}); });
    var sc = {};
    Object.keys(cfg).forEach(function (k) { sc[k] = cfg[k]; });
    sc.criterios = (cfg.criterios || []).map(function (it) {
      var c = {}; Object.keys(it).forEach(function (k) { c[k] = it[k]; });
      if (c.tipo === "sim_nao" && !c.exigido) c.exigido = "conforme a EM";
      return c;
    });
    sc.registrar = false; sc.lote = false; sc.textos = textos; sc.rotuloLink = cfg.rotuloLink || "Recebimento do lote";
    sc.estilo = cfg.estilo || "resultado";
    sc.extra = function (ctx) {
      for (var i = ctx.freqs.length - 1; i >= 0; i--) if (!comFreq[ctx.freqs[i].ensaio]) ctx.freqs.splice(i, 1);
      if (cfg.extra) cfg.extra(ctx);
    };
    var F = A.fichaSimples(sc);
    var t0 = F.tabelas, rh0 = F.resultadosHtml, ex0 = F.relatorio.extraHtml, res0 = F.relatorio.resultados;
    if (cfg.tabelasExtra) F.tabelas = function (d) { return t0(d).concat(cfg.tabelasExtra(d) || []); };
    F.resultadosHtml = function (calc, d) {
      return rh0(calc, d) + (cfg.cartoes ? cfg.cartoes(calc, d) : "") + htmlUnidadesDe(calc, false);
    };
    F.relatorio.extraHtml = function (calc, d) { return ex0(calc, d) + htmlUnidadesDe(calc, true); };
    F.relatorio.resultados = function (calc, d) {
      var rows = res0(calc, d);
      return cfg.resumoRel ? rows.concat(cfg.resumoRel(calc, d) || []) : rows;
    };
    if (cfg.graficos) F.graficos = cfg.graficos; else delete F.graficos;
    F.lote = true;
    FE.FICHAS[cfg.id] = F;
    return F;
  };
  FE.recebMaterial = R;

  // =====================================================================================
  // DNER-EM 033/94 — mourões de eucalipto preservado
  // =====================================================================================
  var CLASSE = { suporte: { comp: 2.20, diam: 10, nome: "Suporte (2,20 m; ø mín. 0,10 m)" }, esticador: { comp: 2.80, diam: 15, nome: "Esticador (2,80 m; ø mín. 0,15 m)" } };
  // 6.1 retenção mínima (kg/m³) e 5.5 temperatura máxima da solução (°C)
  var PRES = { wolman: { nome: "Sais de Wolman", ret: 5.0, tmax: 60 }, osmosalts: { nome: "Osmosalts", ret: 5.0, tmax: 60 },
    boliden: { nome: "Sal de Boliden", ret: 6.4, tmax: 49 }, chemonite: { nome: "Chemonite", ret: 7.2, tmax: 66 } };
  function classe(P) { return CLASSE[P.classe] || CLASSE.suporte; }
  function pres(P) { return PRES[P.preservativo] || PRES.wolman; }
  var GD = "Documentação e inspeção do fornecimento", GT = "Fabricação e tratamento (5)", GP = "Peças amostradas (4; 6)";

  var CRIT = [
    { id: "usina", grupo: GD, texto: "Usina registrada no órgão florestal competente (IBDF à época da norma)", secao: "7", tipo: "sim_nao" },
    { id: "garantia", grupo: GD, texto: "Garantia do fabricante de substituir, por no mínimo 5 anos, mourões que falharem por tratamento ou defeito", secao: "7", tipo: "sim_nao" },
    { id: "especie", grupo: GD, texto: "Espécie: Citriodora, Tereticornis, Alba, Botryoides, Rostrata ou eucalipto equivalente", secao: "3.1", tipo: "sim_nao" },
    { id: "defeitos", grupo: GD, texto: "Inspeção visual: sem apodrecimento, avarias no alburno, fraturas transversais, orifícios, cavilhas, pregos ou metais", secao: "5.1; 5.2", tipo: "sim_nao",
      falha: "ressalva", exigido: "mourões com defeito são rejeitados individualmente (5.2) — informe inspecionados e rejeitados" },
    { id: "acabamento", grupo: GD, texto: "Topo chanfrado, base aparada e casca removida (só pequenas faixas de casca interna)", secao: "5.1; 5.3", tipo: "sim_nao", falha: "ressalva" },
  ];

  function tabelasExtra() {
    return [{ chave: "pec", titulo: "Mourões amostrados — dimensões, alburno, penetração e retenção (3.1; 4; 6)", rotulo: "Mourão", iniciais: 3, min: 1,
      dica: "uma coluna por mourão amostrado; retenção pela análise química do preservativo (kg de sal por m³ de madeira tratada)",
      linhas: [{ k: "id", r: "Identificação", texto: true },
        { k: "comp", r: "Comprimento", u: "m" }, { k: "diam", r: "Diâmetro mínimo ao longo da peça", u: "cm" },
        { k: "alb", r: "Espessura do alburno", u: "mm" }, { k: "pen", r: "Penetração do preservativo (mínima medida)", u: "mm" },
        { k: "pen100", r: "Penetração em 100 % do alburno? (S / N)", texto: true }, { k: "ret", r: "Retenção do preservativo", u: "kg/m³" }] }];
  }

  function extra(ctx) {
    var P = ctx.P, C = classe(P), S = pres(P), tol = num(P.tolComp);
    var pecas = R.cols(ctx.d, "pec", ["comp", "diam", "alb", "pen", "pen100", "ret"]).map(function (c, i) { return R.unidade(c, i, "mourão"); });
    // tratamento (5.4 a 5.6)
    var l = A.linha({ id: "autoclave", grupo: GT, criterio: "Tratamento em autoclave: vácuo, pressão e temperatura da solução (" + S.nome + ")", secao: "5.5",
      exigido: "vácuo ≥ 94 %; pressão 12 a 14 atm; temperatura ≤ " + S.tmax + " °C" });
    var vac = num(P.vacuo), pr = num(P.pressao), te = num(P.temp), f = [], falta = [];
    if (ok(vac)) { if (vac < 94 - EPS) f.push("vácuo " + fmt(vac, 0) + " % < 94 %"); } else falta.push("vácuo");
    if (ok(pr)) { if (pr < 12 - EPS || pr > 14 + EPS) f.push("pressão " + fmt(pr, 1) + " atm fora de 12 a 14 atm"); } else falta.push("pressão");
    if (ok(te)) { if (te > S.tmax + EPS) f.push("temperatura " + fmt(te, 0) + " °C > " + S.tmax + " °C"); } else falta.push("temperatura");
    l.resultado = [ok(vac) ? "vácuo " + fmt(vac, 0) + " %" : "", ok(pr) ? fmt(pr, 1) + " atm" : "", ok(te) ? fmt(te, 0) + " °C" : ""].filter(Boolean).join(" · ") || "—";
    if (f.length) A.marcar(l, "nao_conforme", f.join("; "));
    if (falta.length) A.marcar(l, "ressalva", "sem registro do tratamento (" + falta.join(", ") + ") — exigir o registro da autoclave");
    ctx.linhas.push(l);
    var um = num(P.umidade);
    l = A.linha({ id: "sazon", grupo: GT, criterio: "Sazonamento: umidade da madeira antes do tratamento", secao: "5.4", exigido: "≤ 30 %", resultado: ok(um) ? fmt(um, 1) + " %" : "—" });
    if (!ok(um)) A.marcar(l, "ressalva", "umidade antes do tratamento não informada — exigir o registro");
    else if (um > 30 + EPS) A.marcar(l, "nao_conforme", "umidade " + fmt(um, 1) + " % > 30 %");
    ctx.linhas.push(l);
    var ds = num(P.diasSecagem);
    l = A.linha({ id: "secagem", grupo: GT, criterio: "Secagem à sombra após a impregnação", secao: "5.6", exigido: "≥ 30 dias (ou menos, se o fabricante demonstrar ser suficiente)",
      resultado: ok(ds) ? fmt(ds, 0) + " dias" : "—" });
    if (!ok(ds)) A.marcar(l, "ressalva", "tempo de secagem não informado");
    else if (ds < 30 - EPS) A.marcar(l, "ressalva", fmt(ds, 0) + " dias < 30: aceitável só se o fabricante demonstrar que a secagem é suficiente (5.6)");
    ctx.linhas.push(l);

    // peças: dimensões e alburno (rejeição individual) × retenção e penetração (tratamento do lote)
    var dim = pecas.map(function (u) {
      var v = { rot: u.rot, falhas: [], faltas: [], c: u.c, contra: false, seg: false, grupo: "" };
      var comp = num(u.c.comp);
      if (ok(comp) && ok(tol) && Math.abs(comp - C.comp) > tol + EPS) v.falhas.push("comprimento " + fmt(comp, 2) + " m (nominal " + fmt(C.comp, 2) + " ± " + fmt(tol, 2) + " m)");
      else if (!ok(comp)) v.faltas.push("comprimento");
      R.conf(v, u.c.diam, { rot: "diâmetro mínimo", min: C.diam, casas: 1, un: "cm" });
      R.conf(v, u.c.alb, { rot: "alburno", min: 15, casas: 0, un: "mm" });
      return v;
    });
    var dRuins = dim.filter(function (v) { return v.falhas.length; });
    l = A.linha({ id: "dim", grupo: GP, criterio: "Dimensões — " + C.nome.charAt(0).toLowerCase() + C.nome.slice(1) + " — e alburno ≥ 15 mm", secao: "3.1; 4", n: dim.length,
      exigido: "comprimento " + fmt(C.comp, 2) + " m" + (ok(tol) ? " ± " + fmt(tol, 2) + " m" : "") + "; ø ≥ " + fmt(C.diam / 100, 2) + " m em toda a peça; alburno ≥ 15 mm",
      resultado: dim.length ? (dim.length - dRuins.length) + " de " + dim.length + " atendem" : "—" });
    l.unidades = dim; l.tituloUni = "Mourões amostrados — dimensões e alburno";
    if (!dim.length) R.redef(l, "sem_dados", "nenhum mourão medido");
    else if (dRuins.length) A.marcar(l, "ressalva", "mourões fora das dimensões/alburno devem ser rejeitados e substituídos (5.2; 3.1) — " + lista(dRuins));
    var inc = dim.filter(function (v) { return v.faltas.length && !v.falhas.length; });
    if (inc.length) A.marcar(l, "pendente", "dados incompletos — " + inc.map(function (v) { return v.rot + ": falta " + v.faltas.join(", "); }).join("; "));
    ctx.linhas.push(l);

    var pts = pecas.filter(function (u) { return ok(num(u.c.ret)); }).map(function (u) { return { v: num(u.c.ret), rot: u.rot }; });
    l = A.avaliar({ id: "ret", grupo: GP, criterio: "Retenção do preservativo (" + S.nome + ")", secao: "6.1", unid: "kg/m³", casas: 1, min: S.ret, pontos: pts, individual: true });
    if (l.situacao === "nao_conforme") l.motivo = l.motivos[0].texto = "retenção abaixo do mínimo — tratamento inadequado: rejeitar a carga tratada (" + l.motivo + ")";
    ctx.linhas.push(l);
    var pen = pecas.filter(function (u) { return !R.vazio(u.c.pen) || !R.vazio(u.c.pen100); }).map(function (u) {
      var v = { rot: u.rot, falhas: [], faltas: [], c: u.c, contra: false, seg: false, grupo: "" };
      R.conf(v, u.c.pen, { rot: "penetração", min: 15, casas: 0, un: "mm" });
      R.confSN(v, u.c.pen100, "penetração em 100 % do alburno");
      return v;
    });
    l = R.prova({ id: "pen", grupo: GP, criterio: "Penetração do preservativo", secao: "6.2", unidades: pen, semContra: true, rotU: "mourão(ões)",
      exigido: "100 % da espessura do alburno e ≥ 15 mm em qualquer ponto", txtNc: "tratamento inadequado: rejeitar a carga tratada", txtSem: "penetração não determinada" });
    l.semTabelaUni = true;
    ctx.linhas.push(l);
    ctx.freqs.push(A.frequencia({ ensaio: "Mourões com retenção e penetração determinadas", metodo: "análise do preservativo / corte", exigido: 1,
      regra: "a EM não fixa o número; mín. 1 por carga tratada", realizado: Math.max(pts.length, pen.length) }));
  }

  R.criar({
    id: "dner-em-033-94",
    titulo: "Mourões de eucalipto preservado — recebimento do fornecimento",
    resumo: "Recebimento de mourões de eucalipto tratado (DNER-EM 033/94): documentação (usina registrada, garantia de 5 anos), espécie, inspeção visual com rejeição individual (5.2), registro do tratamento (umidade ≤ 30 %, autoclave com vácuo ≥ 94 %, 12–14 atm e temperatura máxima da tabela, secagem ≥ 30 dias), dimensões por classe (suporte 2,20 m / ø 0,10 m; esticador 2,80 m / ø 0,15 m), alburno ≥ 15 mm, retenção mínima por preservativo (6.1) e penetração de 100 % do alburno e ≥ 15 mm (6.2).",
    params: R.paramsLote({ phLote: "ex.: carga de autoclave 12" }).concat([
      { k: "classe", r: "Classe do mourão (4)", tipo: "select", opcoes: [["suporte", CLASSE.suporte.nome], ["esticador", CLASSE.esticador.nome]] },
      { k: "preservativo", r: "Preservativo (3.2)", tipo: "select", opcoes: Object.keys(PRES).map(function (k) { return [k, PRES[k].nome + " — retenção ≥ " + fmt(PRES[k].ret, 1) + " kg/m³"]; }) },
      { k: "quantidade", r: "Mourões no fornecimento (nº)" },
      { k: "umidade", r: "Umidade da madeira antes do tratamento (%) — registro do fabricante" },
      { k: "vacuo", r: "Vácuo na autoclave (%)" },
      { k: "pressao", r: "Pressão de tratamento (atm)" },
      { k: "temp", r: "Temperatura da solução durante a pressão (°C)" },
      { k: "diasSecagem", r: "Secagem à sombra após a impregnação (dias)" },
      { k: "tolComp", r: "Tolerância aceita no comprimento (m)", dica: "a EM não fixa tolerância para o comprimento; combine com a fiscalização (em branco = não verificar)" },
    ]),
    padrao: { classe: "suporte", preservativo: "wolman", tolComp: "0,05" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    textos: { REJEITADO: { texto: "Retenção ou penetração do preservativo abaixo do exigido (seção 6) ou tratamento fora das condições da seção 5: a carga tratada deve ser recusada; o fabricante responde pela substituição (7)." } },
    notas: "Critérios da DNER-EM 033/94. A norma não fixa plano de amostragem nem tolerância de comprimento: mourões com defeito (5.2) ou fora das dimensões/alburno são rejeitados individualmente (ressalva do lote: separar e substituir); retenção (6.1: Wolman e Osmosalts ≥ 5,0; Boliden ≥ 6,4; Chemonite ≥ 7,2 kg/m³) e penetração (6.2: 100 % do alburno e ≥ 15 mm) abaixo do exigido indicam tratamento inadequado da carga (lote rejeitado). Tratamento (5.5): vácuo ≥ 94 %, 12–14 atm, temperatura máxima da solução 60 °C (Wolman, Osmosalts), 49 °C (Boliden), 66 °C (Chemonite).",
    exemplos: [
      { nome: "Mourões de suporte, sais de Wolman — aceito com ressalva (2 peças rejeitadas na inspeção)", dados: function () {
        return { ident: { registro: "MOU-01", obra: "Obra A — cercas da faixa de domínio", data: "2026-03-10", origem: "Fornecedor A", camada: "Mourões de suporte" },
          params: { lote: "Carga de autoclave 12", fornecedor: "Fornecedor A", nf: "004512", certificado: "TR-118", dataEntrega: "10/03/2026", classe: "suporte",
            preservativo: "wolman", quantidade: "400", umidade: "26", vacuo: "95", pressao: "13", temp: "55", diasSecagem: "35", tolComp: "0,05" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "400", nc: "2", obs: "2 mourões com fratura transversal" }, { atende: "S" }],
          pec: [{ id: "M-01", comp: "2,21", diam: "10,8", alb: "22", pen: "22", pen100: "S", ret: "5,6" },
            { id: "M-02", comp: "2,19", diam: "11,4", alb: "19", pen: "19", pen100: "S", ret: "5,3" },
            { id: "M-03", comp: "2,22", diam: "10,3", alb: "24", pen: "24", pen100: "S", ret: "5,9" }] };
      } },
      { nome: "Mourões esticadores, Chemonite — rejeitado (retenção e penetração insuficientes)", dados: function () {
        return { ident: { registro: "MOU-02", obra: "Obra B — cercas", data: "2026-04-02", origem: "Fornecedor B", camada: "Mourões esticadores" },
          params: { lote: "Carga de autoclave 7", fornecedor: "Fornecedor B", nf: "118877", dataEntrega: "02/04/2026", classe: "esticador", preservativo: "chemonite",
            quantidade: "120", umidade: "34", vacuo: "92", pressao: "12,5", temp: "64", diasSecagem: "20", tolComp: "0,05" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "120", nc: "0" }, { atende: "S" }],
          pec: [{ id: "E-01", comp: "2,80", diam: "15,6", alb: "20", pen: "12", pen100: "N", ret: "6,1" },
            { id: "E-02", comp: "2,78", diam: "14,6", alb: "18", pen: "18", pen100: "S", ret: "7,4" }] };
      } },
    ],
  });
})();
