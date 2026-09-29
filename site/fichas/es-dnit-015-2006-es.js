/*
 * DNIT 015/2006-ES — Drenagem — Drenos subterrâneos — aceitação do serviço (FE.aceitacao.fichaSimples).
 *
 * Este arquivo também define FE.drenagemES (abreviado D), utilidades comuns às fichas de aceitação das ES de drenagem
 * (015, 016, 017, 019, 022, 023, 024), que usam o mesmo texto de controle:
 *   - D.fckEst(valores, modo, condicao)  resistência característica estimada pela ABNT NBR 12655 (a ES manda controlar
 *                                        fck,est ≥ fck e remete o cálculo à NBR 12655): amostragem parcial (6 ≤ n < 20 e
 *                                        n ≥ 20), total (100 %) e caso excepcional (lote ≤ 10 m³, 2 ≤ n ≤ 5), ψ6 da Tabela 3;
 *   - D.paramsConcreto(), D.itemFc(cfg), D.itemAbat(cfg), D.extraConcreto(ctx, [{id, fck}], abatId)
 *                                        resistência (importada da DNER-ME 091) e consistência (importada da DNER-ME 404);
 *   - D.itensGeo(secao, grupo)            dimensões das seções (desvio ≤ 1 %) e espessuras (± 10 %) digitadas como
 *                                        projeto × medido, com o desvio calculado (tabelas "geoSec" e "geoEsp");
 *   - D.sn(id, texto, secao, grupo, exigido, extra)   item "sim_nao" curto;
 *   - D.verificacoes(criterios, {id: {atende, real, nc, obs}})   d.verificacoes na ordem dos itens (exemplos);
 *   - D.montar(cfg)                       A.fichaSimples + tabelas próprias (tabelasAntes/tabelasDepois) + preparar(d2, P, tab)
 *                                        antes do cálculo; registra FE.FICHAS[cfg.id].
 * O index.html carrega este arquivo antes das outras fichas de drenagem (que usam FE.drenagemES).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, media = FE.media;

  // =====================================================================================
  // FE.drenagemES
  // =====================================================================================
  var D = {};

  // ---------- NBR 12655: resistência característica estimada ----------
  // Tabela 3 da NBR 12655 — ψ6 por condição de preparo (A; B ou C) e número de exemplares (interpolação linear; n ≥ 16: 1,02)
  var PSI6 = {
    A: [[2, 0.82], [3, 0.86], [4, 0.89], [5, 0.91], [6, 0.92], [7, 0.94], [8, 0.95], [10, 0.97], [12, 0.99], [14, 1.00], [16, 1.02]],
    B: [[2, 0.75], [3, 0.80], [4, 0.84], [5, 0.87], [6, 0.89], [7, 0.91], [8, 0.93], [10, 0.96], [12, 0.98], [14, 1.00], [16, 1.02]],
  };
  function psi6(n, cond) {
    var t = PSI6[cond === "A" ? "A" : "B"];
    if (n < 2) return NaN;
    if (n >= 16) return 1.02;
    for (var i = 0; i < t.length - 1; i++) {
      if (n >= t[i][0] && n <= t[i + 1][0]) return t[i][1] + (t[i + 1][1] - t[i][1]) * (n - t[i][0]) / (t[i + 1][0] - t[i][0]);
    }
    return NaN;
  }
  D.psi6 = psi6;
  function f1(x) { return fmt(x, 1); }
  // valores: resistências dos exemplares (MPa); modo: "parcial" | "total" | "excepcional"; cond: "A" | "B"
  D.fckEst = function (valores, modo, cond) {
    var f = (valores || []).filter(ok).slice().sort(function (a, b) { return a - b; }), n = f.length;
    var o = { n: n, f: f, modo: modo || "parcial" };
    if (!n) return o;
    o.fcm = media(f);
    o.sd = n > 1 ? Math.sqrt(f.reduce(function (s, x) { return s + (x - o.fcm) * (x - o.fcm); }, 0) / (n - 1)) : NaN;
    if (o.modo === "total") {
      if (n <= 20) { o.fck = f[0]; o.regra = "amostragem total, n ≤ 20: fck,est = f1 (menor resultado)"; }
      else { var i = Math.ceil(0.05 * n - 1e-9); o.fck = f[i - 1]; o.regra = "amostragem total, n > 20: fck,est = f" + i + " (i = 0,05·n arredondado para cima)"; }
      return o;
    }
    if (o.modo === "excepcional") {
      if (n < 2) { o.erro = "caso excepcional exige de 2 a 5 exemplares (NBR 12655)"; return o; }
      if (n <= 5) {
        o.psi6 = psi6(n, cond); o.fck = o.psi6 * f[0];
        o.regra = "caso excepcional (lote ≤ 10 m³, 2 ≤ n ≤ 5): fck,est = ψ6·f1 = " + fmt(o.psi6, 3) + " × " + f1(f[0]);
        return o;
      }
      o.nota = "mais de 5 exemplares: calculado como amostragem parcial";
    }
    if (n < 6) { o.erro = "amostragem parcial exige no mínimo 6 exemplares (NBR 12655) — há " + n; return o; }
    if (n >= 20) { o.fck = o.fcm - 1.65 * o.sd; o.regra = "amostragem parcial, n ≥ 20: fck,est = fcm − 1,65·sd = " + f1(o.fcm) + " − 1,65 × " + fmt(o.sd, 2); return o; }
    var m = Math.floor(n / 2), s = 0;
    for (var j = 0; j < m - 1; j++) s += f[j];
    o.m = m; o.fckFormula = 2 * s / (m - 1) - f[m - 1];
    o.psi6 = psi6(n, cond); o.piso = o.psi6 * f[0];
    o.fck = Math.max(o.fckFormula, o.piso);
    o.regra = "amostragem parcial, 6 ≤ n < 20: fck,est = 2·(f1 + … + f" + (m - 1) + ")/" + (m - 1) + " − f" + m + " = " + f1(o.fckFormula) +
      " (m = n/2 = " + m + (n % 2 ? ", desprezado o maior valor" : "") + "), não menor que ψ6·f1 = " + fmt(o.psi6, 3) + " × " + f1(f[0]) + " = " + f1(o.piso) +
      (o.fckFormula < o.piso ? " → adotado ψ6·f1" : "");
    return o;
  };

  D.paramsConcreto = function (se) {
    return [
      { k: "amostragem", r: "Controle do concreto (NBR 12655)", tipo: "select", se: se,
        opcoes: [["parcial", "Amostragem parcial — exemplares de algumas betonadas (n ≥ 6)"], ["total", "Amostragem total — um exemplar por betonada"],
          ["excepcional", "Caso excepcional — lote ≤ 10 m³ com 2 a 5 exemplares"]],
        dica: "a ES manda controlar fck,est ≥ fck; o fck,est é calculado pela NBR 12655" },
      { k: "condicao", r: "Condição de preparo do concreto (NBR 12655)", tipo: "select", se: se,
        opcoes: [["A", "A — materiais medidos em massa, umidade corrigida"], ["B", "B ou C — agregados medidos em volume"]],
        dica: "define ψ6 (Tabela 3 da NBR 12655)" },
      { k: "betonadas", r: "Betonadas do lote (amostragem total)", se: function (d) { return (!se || se(d)) && ((d.params || {}).amostragem === "total"); },
        dica: "na amostragem total, um exemplar por betonada" },
      { k: "volConc", r: "Volume de concreto do lote (m³) — opcional", se: se, dica: "NBR 12655: lote ≤ 50 m³; caso excepcional ≤ 10 m³" },
      { k: "abat", r: "Abatimento especificado (mm) — opcional", se: se, dica: "com a tolerância, verifica os abatimentos medidos (DNER-ME 404 / NBR 16889)" },
      { k: "abatTol", r: "Tolerância do abatimento (± mm)", se: se },
    ];
  };
  // item de resistência (tipo "valor": os limites são aplicados em D.extraConcreto)
  D.itemFc = function (cfg) {
    return { id: cfg.id || "fc", texto: cfg.texto || "Resistência à compressão aos 28 dias (exemplares)", secao: cfg.secao, grupo: cfg.grupo,
      tipo: "valor", unid: "MPa", casas: 1, exigido: "fck,est ≥ fck (NBR 12655)", metodo: "DNER-ME 091 / NBR 5739", se: cfg.se,
      freq: { por: "lote", minimo: 6 },
      importar: { de: "dner-me-091-98", valores: function (e) {
        var r = e.resultados || {};
        return (r.lista || []).filter(function (x) { return ok(x.fc) && x.idade === 28; })
          .map(function (x) { return { v: Math.round(x.fc * 10) / 10, rot: x.nome }; });
      } } };
  };
  D.itemAbat = function (cfg) {
    return { id: cfg.id || "abat", texto: "Consistência do concreto — abatimento", secao: cfg.secao, grupo: cfg.grupo, tipo: "valor", unid: "mm", casas: 0,
      exigido: "especificado ± tolerância", metodo: cfg.metodo || "NBR 16889 / DNER-ME 404", se: cfg.se, falha: "ressalva",
      min: function (P) { return num(P.abat) - (ok(num(P.abatTol)) ? num(P.abatTol) : 0); },
      max: function (P) { return num(P.abat) + (ok(num(P.abatTol)) ? num(P.abatTol) : 0); },
      importar: { de: "dner-me-404-00", valores: function (e) {
        return ((e.resultados || {}).ens || []).filter(function (x) { return ok(x.abr); }).map(function (x) { return { v: x.abr, rot: "ensaio " + x.nome }; });
      } } };
  };
  function acharFreq(ctx, texto) { return ctx.freqs.filter(function (f) { return f.ensaio === texto; })[0]; }
  // lista: [{id, fck}] (fck em MPa); abatId: id do item de abatimento (opcional)
  D.extraConcreto = function (ctx, lista, abatId) {
    var P = ctx.P, modo = P.amostragem || "parcial", cond = P.condicao === "A" ? "A" : "B", vol = num(P.volConc);
    (lista || []).forEach(function (c) {
      var l = ctx.item[c.id];
      if (!l || l.situacao === "nao_exigido") return;
      var fck = c.fck, e = D.fckEst(l.pontos.map(function (p) { return p.v; }), modo, cond);
      l.lim = { min: fck }; if (l.est) l.est.min = fck;
      l.exigido = "fck,est ≥ " + (ok(fck) ? f1(fck) + " MPa" : "fck de projeto");
      l.fckEst = e; l.motivos = []; l.motivo = "";
      var fr = acharFreq(ctx, l.criterio);
      if (fr) {
        var ex = modo === "total" ? (ok(num(P.betonadas)) ? num(P.betonadas) : 1) : modo === "excepcional" ? 2 : (ok(fck) && fck > 50 ? 12 : 6);
        fr.exigido = ex; fr.regra = modo === "total" ? "um exemplar por betonada (amostragem total)" : modo === "excepcional" ? "2 a 5 exemplares (lote ≤ 10 m³)" :
          "mín. " + ex + " exemplares por lote (amostragem parcial)";
        fr.situacao = fr.realizado >= ex ? "atende" : fr.realizado ? "insuficiente" : "sem_dados";
      }
      if (!e.n) { l.situacao = "sem_dados"; l.motivo = "sem exemplares"; return; }
      l.situacao = "conforme";
      l.resultado = "n = " + e.n + " · fcm = " + f1(e.fcm) + " MPa" + (ok(e.fck) ? " · fck,est = " + f1(e.fck) + " MPa" : "");
      if (modo === "excepcional" && ok(vol) && vol > 10) A.marcar(l, "pendente", "caso excepcional só para lotes de até 10 m³ (lote de " + fmt(vol, 1) + " m³)");
      if (ok(vol) && vol > 50) ctx.avisos.push(l.criterio + ": lote de " + fmt(vol, 1) + " m³ — a NBR 12655 limita o lote a 50 m³ (elementos comprimidos/fletidos); divida o lote.");
      if (e.erro) { A.marcar(l, "pendente", e.erro); return; }
      if (!ok(fck)) { A.marcar(l, "pendente", "informe o fck de projeto"); return; }
      var fe = Math.round(e.fck * 10) / 10;
      if (fe < fck - 1e-9) A.marcar(l, "nao_conforme", "fck,est = " + f1(fe) + " MPa < fck = " + f1(fck) + " MPa — não conformidade (" + (c.secao || "ES") + "); " + e.regra);
      else { l.motivo = "fck,est = " + f1(fe) + " ≥ " + f1(fck) + " MPa; " + e.regra + (e.nota ? " (" + e.nota + ")" : ""); }
    });
    if (abatId && ctx.item[abatId]) {
      var la = ctx.item[abatId];
      if (la.situacao !== "nao_exigido" && ok(num(P.abat))) la.exigido = A.txtLimites(la.lim.min, la.lim.max, 0, "mm") + " (especificado " + fmt(num(P.abat), 0) + " mm)";
      if (la.situacao !== "nao_exigido" && la.n && !ok(num(P.abat))) {
        la.exigido = "registro (abatimento especificado não informado)";
        la.motivo = "informe o abatimento especificado e a tolerância para verificar os valores";
      }
    }
  };

  // ---------- controle geométrico: projeto × medido ----------
  D.itensGeo = function (secao, grupo) {
    return [
      { id: "sec", texto: "Dimensões das seções transversais — desvio em relação ao projeto", secao: secao, grupo: grupo, tipo: "valor", unid: "%", casas: 2,
        min: -1, max: 1, exigido: "|desvio| ≤ 1 % em pontos isolados", metodo: "topografia / gabaritos", geo: "geoSec" },
      { id: "esp", texto: "Espessuras — desvio em relação à espessura de projeto", secao: secao, grupo: grupo, tipo: "valor", unid: "%", casas: 1,
        min: -10, max: 10, exigido: "dentro de ± 10 % da espessura de projeto", metodo: "medida direta", geo: "geoEsp" },
    ];
  };
  function tabGeo(chave, titulo, ex) {
    return { chave: chave, titulo: titulo, rotulo: "Medida", iniciais: 3, min: 1, dica: "o desvio (medido − projeto)/projeto é avaliado no critério correspondente",
      linhas: [{ k: "est", r: "Estaca / local", texto: true }, { k: "elem", r: "Elemento / dimensão", texto: true, ph: ex },
        { k: "proj", r: "Projeto", u: "cm" }, { k: "med", r: "Medido", u: "cm" }, { calc: "desv", r: "Desvio", u: "%", casas: 2, destaque: true }] };
  }
  function prepararGeo(it, d2, tab) {
    var rows = (d2[it.geo] || []).map(function (c) {
      var p = num(c.proj), m = num(c.med);
      return { desv: ok(p) && ok(m) && p > 0 ? (m - p) / p * 100 : NaN, est: c.est || "", elem: c.elem || "" };
    });
    tab[it.geo] = rows;
    d2[it.id] = rows.filter(function (r) { return ok(r.desv); }).map(function (r) { return { est: r.est, pos: r.elem, reg: "", v: String(r.desv) }; });
  }

  // ---------- itens sim/não e exemplos ----------
  D.sn = function (id, texto, secao, grupo, exigido, extra) {
    var it = { id: id, texto: texto, secao: secao, grupo: grupo, tipo: "sim_nao", exigido: exigido };
    Object.keys(extra || {}).forEach(function (k) { it[k] = extra[k]; });
    return it;
  };
  D.verificacoes = function (criterios, mapa, padrao) {
    mapa = mapa || {};
    return criterios.filter(function (it) { return it.tipo === "sim_nao"; }).map(function (it) {
      var v = mapa[it.id] || padrao || { atende: "S" };
      return Object.assign({}, v);
    });
  };

  // ---------- montagem ----------
  D.montar = function (cfg) {
    var itens = cfg.criterios || [];
    var geos = itens.filter(function (it) { return it.geo; });
    var F = A.fichaSimples(Object.assign({}, cfg, { registrar: false }));
    var baseTab = F.tabelas, baseCalc = F.calcular;
    // importação só aparece quando o item se aplica
    F.params.forEach(function (p) {
      var it = p.tipo === "importarVarios" && /^imp_/.test(p.k) ? itens.filter(function (x) { return "imp_" + x.id === p.k; })[0] : null;
      if (it && it.se && !p.se) p.se = function (d) { return it.se(Object.assign({}, cfg.padrao || {}, d.params || {})); };
    });
    var derivadas = {};
    geos.forEach(function (it) { derivadas[it.id] = true; });
    F.tabelas = function (d) {
      var P = d.params || {};
      var T = baseTab(d).filter(function (t) { return !derivadas[t.chave]; });
      var i = 0;
      while (i < T.length && T[i].chave === "verificacoes") i++;
      var antes = cfg.tabelasAntes ? cfg.tabelasAntes(P, d) : [];
      var depois = geos.filter(function (it) { return !it.se || it.se(P); }).map(function (it) {
        return tabGeo(it.geo, (it.id === "sec" ? "Dimensões das seções transversais — projeto × medido" : "Espessuras — projeto × medido") + " (" + it.secao + ")",
          it.id === "sec" ? "ex.: largura da vala" : "ex.: parede, laje, berço");
      });
      if (cfg.tabelasDepois) depois = depois.concat(cfg.tabelasDepois(P, d));
      return T.slice(0, i).concat(antes, T.slice(i), depois);
    };
    F.calcular = function (d) {
      var d2 = Object.assign({}, d), tab = {};
      d2.params = Object.assign({}, cfg.padrao || {}, d.params || {});
      geos.forEach(function (it) { prepararGeo(it, d2, tab); });
      if (cfg.preparar) cfg.preparar(d2, d2.params, tab);
      var R = baseCalc(d2);
      R.tab = Object.assign(R.tab || {}, tab);
      return R;
    };
    FE.FICHAS[cfg.id] = F;
    return F;
  };
  FE.drenagemES = D;

  // =====================================================================================
  // DNIT 015/2006-ES — drenos subterrâneos
  // =====================================================================================
  var G = { MAT: "Materiais (5.1 e 7.1)", CON: "Concreto (7.1, 7.2 e 7.4)", EXE: "Execução (4 e 5.3)", PRO: "Verificação do produto (7.3)", AMB: "Manejo ambiental (6)" };
  // Tabela 1 (resistência e permeabilidade, dimensões mínimas) e Tabela 2 (limites de variação) — p. 5
  //        pol  Ø cm  esp.mín  comp.mín  encaixe  resist. (kg/cm)  perm. (l/min/cm)  caimento (cm/cm)  tol.comp  tol.esp
  var TAB = [
    [4, 10.2, 2.5, 30, 2.2, 14.9, 0.5, 0.02, 0.3, 0.2],
    [6, 15.2, 2.5, 30, 2.5, 16.4, 0.7, 0.02, 0.3, 0.2],
    [8, 20.3, 3.2, 30, 3.2, 19.3, 1.0, 0.02, 0.6, 0.2],
    [10, 25.4, 3.5, 45, 3.3, 20.8, 1.3, 0.02, 0.6, 0.2],
    [12, 30.5, 3.8, 45, 3.8, 22.3, 1.5, 0.02, 0.6, 0.2],
    [15, 38.1, 4.4, 45, 3.8, 26.0, 1.9, 0.02, 0.6, 0.2],
    [19, 48.3, 5.1, 90, 4.8, 29.8, 2.3, 0.02, 0.6, 0.2],
    [21, 53.3, 5.7, 90, 5.1, 32.8, 2.6, 0.02, 0.6, 0.3],
    [24, 61.0, 6.4, 90, 6.4, 35.7, 3.0, 0.03, 0.6, 0.3],
  ];
  function tab(P) { return TAB.filter(function (t) { return String(t[0]) === String(P.diam); })[0] || null; }
  function col(i) { return function (P) { var t = tab(P); return t ? t[i] : NaN; }; }
  function tuboConc(P) { return P.tubo === "concreto" || P.tubo === "poroso"; }
  function nTub(P) { var n = num(P.nTubos); return ok(n) ? 2 * Math.max(1, Math.ceil(n / 200 - 1e-9)) : NaN; }
  var FREQ_TUBO = { por: "contagem", a_cada: 1, qtd: nTub, minimo: 2, regra: "2 tubos por lote de 100 a 200 unidades (7.1); ≥ 0,5 % e ≥ 2 por diâmetro (5.1.4)" };

  // Faixas do material filtrante (5.1.5, p. 6): [abertura (mm), mín., máx.] em % passando
  var FAIXAS = {
    a_env: { nome: "5.1.5 a) solo com > 35 % passando na nº 200 — envolvimento do tubo", pen: [[19, null, 85], [9.5, 60, null], [2.0, 15, null], [0.42, null, 15]] },
    a_ench: { nome: "5.1.5 a) solo com > 35 % passando na nº 200 — enchimento da vala", pen: [[9.5, 60, null], [2.0, 15, null], [0.42, null, 15]] },
    b_env: { nome: "5.1.5 b) solo com < 35 % passando na nº 200 — envolvimento do tubo", pen: [[38, null, 60], [19, 85, null], [9.5, 15, null], [2.0, null, 15]],
      incoerente: [38, 19] },
    b_ench: { nome: "5.1.5 b) solo com < 35 % passando na nº 200 — preenchimento da vala", pen: [[38, null, 60], [9.5, 15, null], [2.0, null, 15]] },
    c: { nome: "5.1.5 c) tubos porosos de concreto — envolvimento e enchimento", pen: [[9.5, 100, 100], [4.8, 95, 100], [1.2, 45, 80], [0.3, 10, 30], [0.15, 2, 10]] },
  };
  var PEN_PROJ = [50, 38, 25, 19, 9.5, 4.8, 2.0, 1.2, 0.42, 0.3, 0.15, 0.075];
  function chPen(mm) { return "p" + String(mm).replace(".", "_"); }
  function faixa(P, d) {
    if (P.faixa !== "projeto") return FAIXAS[P.faixa] || null;
    var fx = (d.granFx || []), pen = [];
    PEN_PROJ.forEach(function (mm) {
      var mn = num((fx[0] || {})[chPen(mm)]), mx = num((fx[1] || {})[chPen(mm)]);
      if (ok(mn) || ok(mx)) pen.push([mm, ok(mn) ? mn : null, ok(mx) ? mx : null]);
    });
    return { nome: "faixa do projeto", pen: pen, projeto: true };
  }
  function penDe(P) { return P.faixa === "projeto" ? PEN_PROJ : (FAIXAS[P.faixa] || { pen: [] }).pen.map(function (x) { return x[0]; }); }
  function txtFaixa(fx) {
    return fx.pen.map(function (x) {
      return fmt(x[0], x[0] < 1 ? 2 : 1) + " mm: " + (x[1] !== null && x[2] !== null ? (x[1] === x[2] ? fmt(x[1], 0) : fmt(x[1], 0) + "–" + fmt(x[2], 0)) :
        x[1] !== null ? "≥ " + fmt(x[1], 0) : "≤ " + fmt(x[2], 0)) + " %";
    }).join("; ");
  }

  function S(id, texto, secao, grupo, exigido, extra) { return D.sn(id, texto, secao, grupo, exigido, extra); }
  var CRIT = [
    // materiais
    S("pead", "Tubos dreno corrugados de PEAD conforme DNIT 093-EM", "5.1.1.1 / 7.1", G.MAT, "ensaios da DNIT 093-EM no recebimento", { se: function (P) { return P.tubo === "pead"; } }),
    S("coletor", "Tubos coletores (PVC, PEAD, PRFV, concreto, cerâmica ou ferro fundido) conforme as normas citadas", "5.1.2", G.MAT,
      "NBR 7362, NBR 7367, ABPE E/009, DNIT 094-EM, NBR 8890 ou NBR 8161; conexões estanques", { se: function (P) { return P.coletor === "sim"; } }),
    { id: "rup", texto: "Tubos de concreto — resistência média à ruptura (três cutelos)", secao: "5.1.4 Tabela 1 / 7.1", grupo: G.MAT, tipo: "valor", unid: "kg/cm", casas: 1,
      min: col(5), metodo: "NBR 8890", se: tuboConc, freq: FREQ_TUBO },
    { id: "perm", texto: "Tubos de concreto — permeabilidade do encaixe", secao: "5.1.4 Tabela 1 / 7.1", grupo: G.MAT, tipo: "valor", unid: "l/min/cm", casas: 2,
      min: col(6), metodo: "NBR 8890", se: tuboConc, freq: FREQ_TUBO },
    S("absor", "Tubos de concreto — absorção (nos tubos da compressão diametral)", "7.1", G.MAT, "conforme NBR 8890", { se: tuboConc, metodo: "NBR 8890" }),
    { id: "espT", texto: "Tubos de concreto — espessura da parede", secao: "5.1.4 Tabelas 1 e 2", grupo: G.MAT, tipo: "valor", unid: "cm", casas: 2,
      min: function (P) { var t = tab(P); return t ? Math.round((t[2] - t[9]) * 100) / 100 : NaN; }, se: tuboConc },
    { id: "compT", texto: "Tubos de concreto — comprimento", secao: "5.1.4 Tabelas 1 e 2", grupo: G.MAT, tipo: "valor", unid: "cm", casas: 1,
      min: function (P) { var t = tab(P); return t ? Math.round((t[3] - t[8]) * 100) / 100 : NaN; }, se: tuboConc },
    { id: "encT", texto: "Tubos de concreto — profundidade do encaixe", secao: "5.1.4 Tabela 1", grupo: G.MAT, tipo: "valor", unid: "cm", casas: 1,
      min: col(4), se: tuboConc },
    { id: "caiT", texto: "Tubos de concreto — caimento (esquadro das extremidades)", secao: "5.1.4 Tabela 2", grupo: G.MAT, tipo: "valor", unid: "cm/cm", casas: 3,
      max: col(7), se: tuboConc },
    { id: "aliT", texto: "Tubos de concreto — deformação em alinhamento em 30 cm", secao: "5.1.4", grupo: G.MAT, tipo: "valor", unid: "cm", casas: 2,
      max: 0.3, se: tuboConc },
    S("visT", "Tubos — inspeção visual (fábrica, depósito, vala e após o assentamento)", "5.1.4", G.MAT,
      "sem trincas ou fraturas no corpo e nas bocas; extremidades em esquadro; estanqueidade e integridade", { se: function (P) { return P.tubo !== "cego"; } }),
    S("limpeza", "Material filtrante/drenante limpo, resistente e durável", "5.1.5 c / 4", G.MAT,
      "isento de matéria orgânica, torrões de argila e deletérios; sem mistura com outros materiais (pilhas ou baias)"),
    S("manta", "Manta geotêxtil não tecido (em substituição ao filtro natural)", "5.1.5 d", G.MAT,
      "especificação do fabricante; se não prevista no projeto, estudo específico prévio", { se: function (P) { return P.manta === "sim"; } }),
    S("rejunte", "Rejuntamento: argamassa cimento e areia 1:4 em massa (tubos de concreto) ou luva de emenda (PEAD)", "5.1.6", G.MAT,
      "traço 1:4 em massa (DNER-ES 330) / luva da DNIT 093-EM", { se: function (P) { return P.tubo !== "cego"; } }),
    // concreto
    D.itemFc({ id: "fc", secao: "7.1 / 7.4", grupo: G.CON, texto: "Concreto — resistência à compressão aos 28 dias (exemplares)", se: function (P) { return P.concreto === "sim"; } }),
    D.itemAbat({ id: "abat", secao: "7.2", grupo: G.CON, metodo: "NBR NM 67 / DNER-ME 404", se: function (P) { return P.concreto === "sim"; } }),
    S("consist", "Ensaio de consistência nas ocasiões do 7.2", "7.2", G.CON,
      "alteração da umidade dos agregados, 1ª amassada do dia, reinício após > 2 h, moldagem de CPs e troca de operador", { se: function (P) { return P.concreto === "sim"; } }),
    S("ciclop", "Concreto ciclópico controlado pela DNER-ES 330", "7.2", G.CON, "procedimentos da DNER-ES 330", { se: function (P) { return P.ciclopico === "sim"; } }),
    // execução
    S("caixas", "Caixas de passagem em alinhamentos com mais de 80 m", "4", G.EXE, "caixas de passagem para limpeza e manutenção", { se: function (P) { return P.longo === "sim"; } }),
    S("vala", "Valas escavadas na largura, alinhamento e cotas do projeto", "5.3", G.EXE, "conforme projeto / Notas de Serviço"),
    S("berco", "Tubos assentados em berço compactado e acabado, nas cotas de projeto", "5.3", G.EXE, "berço estável, cotas preservadas", { se: function (P) { return P.tubo !== "cego"; } }),
    S("envolv", "Material de envolvimento adensado com compactador vibratório", "5.3", G.EXE, "tubos imóveis, espessuras e graduação preservadas"),
    S("bolsas", "Bolsas voltadas para o lado ascendente da declividade", "5.3", G.EXE, "juntas ponta e bolsa com a bolsa para montante", { se: function (P) { return P.tubo !== "cego"; } }),
    S("enchim", "Enchimento compactado com equipamento vibratório na umidade adequada; continuidade de permeabilidade", "5.3", G.EXE, "camadas adensadas; parte superior conforme projeto"),
    S("vistoria", "Vistoria e comprovação da operacionalidade antes do fechamento das valas; tubos tamponados", "4", G.EXE,
      "fechamento só após a vistoria; tamponamento e proteção das camadas durante a obra"),
    S("saidas", "Tubos ou terminais nas extremidades de saída", "5.3", G.EXE, "conforme projeto"),
    // produto
    S("geom", "Alinhamentos, profundidades e declividades conforme Notas de Serviço (topografia e gabaritos)", "7.3 / 6 d", G.PRO, "conforme projeto / Notas de Serviço"),
  ].concat(D.itensGeo("7.3", G.PRO), [
    S("acab", "Acabamento (inspeção visual)", "7.3", G.PRO, "sem prejuízo à operação hidráulica da canalização"),
    S("amb", "Manejo ambiental: excedentes removidos, proteção nos deságues, sem tráfego desnecessário", "6", G.AMB, "itens a) a g) do capítulo 6"),
  ]);

  var F = D.montar({
    id: "dnit-015-2006-es",
    titulo: "Drenos subterrâneos — aceitação do serviço",
    resumo: "Controle da DNIT 015/2006-ES: tubos (Tabelas 1 e 2 e inspeção), granulometria do material filtrante (5.1.5), concreto (fck,est ≥ fck, NBR 12655), " +
      "execução (4 e 5.3) e verificação do produto (seções ≤ 1 %, espessuras ± 10 %) — parecer do segmento.",
    lote: { largura: false },
    refs: { reprova: "7.4", atende: "7.4", regra: "7.3/7.4" },
    params: [
      { k: "tubo", r: "Tipo de dreno / tubo de captação", tipo: "select", recarrega: true,
        opcoes: [["pead", "Tubo dreno corrugado de PEAD"], ["concreto", "Tubo de concreto perfurado"], ["poroso", "Tubo poroso de concreto"], ["cego", "Dreno cego (sem tubo)"]] },
      { k: "diam", r: "Diâmetro interno do tubo de concreto (Tabela 1)", tipo: "select", recarrega: true, se: function (d) { return tuboConc(d.params || {}); },
        opcoes: TAB.map(function (t) { return [String(t[0]), t[0] + "\" — " + fmt(t[1], 1) + " cm"]; }) },
      { k: "nTubos", r: "Tubos de concreto fornecidos (unidades do diâmetro)", se: function (d) { return tuboConc(d.params || {}); },
        dica: "lotes de 100 a 200 unidades; 2 tubos de cada lote à compressão/absorção e 2 à permeabilidade (7.1)" },
      { k: "coletor", r: "Há tubo coletor (não perfurado)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "manta", r: "Filtro com manta geotêxtil?", tipo: "select", recarrega: true, opcoes: [["nao", "Não — filtro granular"], ["sim", "Sim"]] },
      { k: "faixa", r: "Faixa granulométrica do material filtrante (5.1.5)", tipo: "select", recarrega: true,
        opcoes: [["projeto", "Faixa do projeto (digitada)"]].concat(Object.keys(FAIXAS).map(function (k) { return [k, FAIXAS[k].nome]; })),
        dica: "a ES manda seguir a granulometria do projeto; as faixas do 5.1.5 valem quando o projeto não a especificar" },
      { k: "impGran", r: "Granulometria — importar (DNIT 412)", tipo: "importarVarios", de: "dnit-412-2025-me",
        dica: "cada ensaio vira uma coluna; as peneiras da faixa são casadas com as do ensaio (tolerância de 4 %)",
        aplicar: function (lista, P, d) {
          var pens = penDe(P);
          A.importacao.substituir(d, "gran", lista.map(function (e) {
            var c = { reg: A.importacao.rotulo(e), est: A.importacao.ident(e).local || "" };
            pens.forEach(function (mm) {
              var m = ((e.resultados || {}).media || []).filter(function (x) { return Math.abs(x.mm - mm) / mm < 0.04; })[0];
              c[chPen(mm)] = m && ok(m.pass) ? A.nstr(m.pass, 1) : "";
            });
            return c;
          }), { chave: ["reg"] });
        } },
      { k: "longo", r: "Alinhamentos com mais de 80 m?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "concreto", r: "Há concreto no serviço (tubos no canteiro, caixas, bocas)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "fck", r: "fck de projeto (MPa)", se: function (d) { return (d.params || {}).concreto === "sim"; }, dica: "a ES não fixa o fck: vale o do projeto" },
      { k: "ciclopico", r: "Concreto ciclópico?", tipo: "select", se: function (d) { return (d.params || {}).concreto === "sim"; }, recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
    ].concat(D.paramsConcreto(function (d) { return (d.params || {}).concreto === "sim"; })),
    padrao: { tubo: "pead", diam: "6", coletor: "nao", manta: "nao", faixa: "projeto", longo: "nao", concreto: "nao", ciclopico: "nao", amostragem: "parcial", condicao: "B" },
    criterios: CRIT,
    tabelasAntes: function (P) {
      var T = [];
      if (P.faixa === "projeto") T.push({ chave: "granFx", titulo: "Faixa granulométrica do projeto — % passando (5.1.5)", rotulo: "Limite", iniciais: 2, min: 2, fixo: true,
        nomes: ["Mínimo", "Máximo"], dica: "deixe em branco as peneiras sem limite",
        linhas: PEN_PROJ.map(function (mm) { return { k: chPen(mm), r: "Peneira " + fmt(mm, mm < 1 ? 3 : 1).replace(/0+$/, "").replace(/,$/, "") + " mm", u: "%" }; }) });
      T.push({ chave: "gran", titulo: "Granulometria do material filtrante / de enchimento — % passando (5.1.5 e 7.1)", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "uma coluna por amostra (ou importe da DNIT 412)",
        linhas: [{ k: "reg", r: "Registro / origem", texto: true }, { k: "est", r: "Estaca / local", texto: true }].concat(penDe(P).map(function (mm) {
          return { k: chPen(mm), r: "Passando na " + fmt(mm, mm < 1 ? 3 : 1).replace(/0+$/, "").replace(/,$/, "") + " mm", u: "%" };
        })) });
      return T;
    },
    extra: function (ctx) {
      var P = ctx.P, d = ctx.d;
      D.extraConcreto(ctx, [{ id: "fc", fck: num(P.fck), secao: "7.4" }], "abat");
      // granulometria
      var fx = faixa(P, d), ams = (d.gran || []).filter(function (a) { return penDe(P).some(function (mm) { return ok(num(a[chPen(mm)])); }); });
      var l = A.linha({ id: "gran", grupo: G.MAT, criterio: "Granulometria do material filtrante / de enchimento", secao: "5.1.5 / 7.1", metodo: "DNIT 412",
        exigido: fx && fx.pen.length ? txtFaixa(fx) : "faixa do projeto", n: ams.length });
      var fora = [], falta = [];
      if (fx && fx.incoerente) ctx.avisos.push("A faixa " + fx.nome + " da ES é incoerente (≤ 60 % passando na 38 mm e ≥ 85 % na 19 mm; p. 6): " +
        "as peneiras 38 e 19 mm não são avaliadas — use a faixa do projeto.");
      ams.forEach(function (a, i) {
        var rot = a.reg || "amostra " + (i + 1);
        (fx ? fx.pen : []).forEach(function (x) {
          if (fx.incoerente && fx.incoerente.indexOf(x[0]) >= 0) return;
          var v = num(a[chPen(x[0])]), mm = fmt(x[0], x[0] < 1 ? 2 : 1) + " mm";
          if (!ok(v)) { falta.push(rot + " (" + mm + ")"); return; }
          if (x[1] !== null && v < x[1] - 1e-9) fora.push(rot + ": " + mm + " = " + fmt(v, 1) + " % < " + fmt(x[1], 0) + " %");
          if (x[2] !== null && v > x[2] + 1e-9) fora.push(rot + ": " + mm + " = " + fmt(v, 1) + " % > " + fmt(x[2], 0) + " %");
        });
      });
      l.resultado = ams.length ? ams.length + " amostra(s)" + (fora.length ? " — " + fora.length + " peneira(s) fora" : " — dentro da faixa") : "—";
      if (!ams.length) A.marcar(l, "sem_dados", "sem ensaios de granulometria");
      else if (!fx || !fx.pen.length) A.marcar(l, "pendente", "informe a faixa granulométrica do projeto");
      else {
        if (fora.length) A.marcar(l, "nao_conforme", "fora da faixa: " + fora.join("; "));
        if (falta.length) A.marcar(l, "pendente", "peneiras sem resultado: " + falta.join("; "));
        if (!fora.length && !falta.length) l.motivo = "todas as amostras dentro da faixa";
      }
      var k = 0;
      ctx.linhas.forEach(function (x, i) { if (x.grupo === G.MAT) k = i + 1; });
      ctx.linhas.splice(k, 0, l); ctx.item.gran = l;
      ctx.freqs.push(A.frequencia({ ensaio: "Granulometria do material filtrante / de enchimento", metodo: "DNIT 412", por: "lote", minimo: 1, realizado: ams.length,
        regra: "ensaios específicos (7.1); frequência não fixada na ES — mín. 1 por lote" }));
      if (tuboConc(P) && !tab(P)) ctx.avisos.push("Escolha o diâmetro do tubo de concreto (Tabela 1).");
    },
    notas: "Critérios da DNIT 015/2006-ES. Tubos de concreto: resistência média (três cutelos) e permeabilidade mínima do encaixe da Tabela 1; espessura e comprimento " +
      "≥ mínimo da Tabela 1 − variação permissível da Tabela 2; encaixe ≥ Tabela 1; caimento ≤ Tabela 2; deformação em alinhamento ≤ 0,3 cm em 30 cm (5.1.4). " +
      "Amostragem dos tubos: lotes de 100 a 200 unidades, 2 tubos à compressão diametral e absorção e 2 à permeabilidade (7.1). Granulometria: faixa do projeto ou do 5.1.5. " +
      "Concreto: fck,est ≥ fck (7.4), com fck,est pela NBR 12655 (amostragem parcial: 6 ≤ n < 20 → 2·(f1 + … + fm−1)/(m − 1) − fm ≥ ψ6·f1; n ≥ 20 → fcm − 1,65·sd; " +
      "amostragem total → f1 ou fi com i = 0,05·n; caso excepcional → ψ6·f1). Seções transversais: desvio ≤ 1 % em pontos isolados; espessuras: ± 10 % (7.3).",
    exemplos: [],
  });

  // ---------- exemplos ----------
  function V(mapa, padrao) { return D.verificacoes(CRIT, mapa, padrao); }
  F.exemplos = [
    { nome: "Dreno longitudinal profundo com tubo poroso de concreto Ø 15 cm — segmento aceito", dados: function () {
      var d = {
        ident: { registro: "LOTE-DS-01", obra: "Obra A", trecho: "BR-000 — segmento em corte", camada: "Dreno longitudinal profundo LD", data: "2026-05-18" },
        params: { estIni: "100", estFim: "112", tubo: "poroso", diam: "6", nTubos: "280", coletor: "nao", manta: "nao", faixa: "c", longo: "sim",
          concreto: "sim", fck: "15", ciclopico: "nao", amostragem: "parcial", condicao: "B", volConc: "8", abat: "80", abatTol: "20" },
        verificacoes: V({ visT: { atende: "S", real: "12" }, vistoria: { atende: "S", real: "3" }, caixas: { atende: "S", real: "2", obs: "caixas nas est. 104 e 108+10" },
          geom: { real: "13", nc: "0" }, acab: { real: "3", nc: "0" } }),
        rup: [{ pos: "lote 1 — tubo 1", v: "17,8" }, { pos: "lote 1 — tubo 2", v: "18,4" }, { pos: "lote 2 — tubo 1", v: "17,1" }, { pos: "lote 2 — tubo 2", v: "18,9" }],
        perm: [{ pos: "lote 1 — tubo 3", v: "0,85" }, { pos: "lote 1 — tubo 4", v: "0,92" }, { pos: "lote 2 — tubo 3", v: "0,78" }, { pos: "lote 2 — tubo 4", v: "0,81" }],
        espT: [{ pos: "tubo 1", v: "2,6" }, { pos: "tubo 2", v: "2,5" }, { pos: "tubo 3", v: "2,4" }],
        compT: [{ pos: "tubo 1", v: "30,1" }, { pos: "tubo 2", v: "29,9" }],
        encT: [{ pos: "tubo 1", v: "2,6" }, { pos: "tubo 2", v: "2,7" }],
        caiT: [{ pos: "tubo 1", v: "0,010" }, { pos: "tubo 2", v: "0,015" }],
        aliT: [{ pos: "tubo 1", v: "0,1" }, { pos: "tubo 2", v: "0,2" }],
        gran: [{ reg: "GR-101", est: "Jazida 1", p9_5: "100", p4_8: "97,5", p1_2: "62,0", p0_3: "18,4", p0_15: "5,1" },
          { reg: "GR-102", est: "Jazida 1", p9_5: "100", p4_8: "96,2", p1_2: "58,7", p0_3: "21,0", p0_15: "6,3" }],
        fc: [{ est: "caixa 104", pos: "E1", v: "18,2" }, { est: "caixa 104", pos: "E2", v: "17,5" }, { est: "caixa 104", pos: "E3", v: "19,0" },
          { est: "caixa 108+10", pos: "E4", v: "16,9" }, { est: "caixa 108+10", pos: "E5", v: "18,8" }, { est: "caixa 108+10", pos: "E6", v: "17,7" }],
        abat: [{ est: "caixa 104", pos: "betonada 1", v: "85" }, { est: "caixa 108+10", pos: "betonada 2", v: "95" }],
        geoSec: [{ est: "102", elem: "largura da vala", proj: "60", med: "60,4" }, { est: "106", elem: "largura da vala", proj: "60", med: "59,6" },
          { est: "110", elem: "profundidade da vala", proj: "150", med: "151,2" }],
        geoEsp: [{ est: "102", elem: "camada de envolvimento sob o tubo", proj: "10", med: "10,5" }, { est: "106", elem: "camada de envolvimento sob o tubo", proj: "10", med: "9,4" },
          { est: "110", elem: "camada argilosa de topo", proj: "20", med: "21,5" }],
      };
      return d;
    } },
    { nome: "Dreno com tubo PEAD e envolvimento em brita — granulometria e espessura fora, vistoria não feita (rejeitado)", dados: function () {
      return {
        ident: { registro: "LOTE-DS-02", obra: "Obra B", trecho: "BR-000 — segmento em corte", camada: "Dreno longitudinal profundo LE", data: "2026-06-02" },
        params: { estIni: "40", estFim: "46", tubo: "pead", coletor: "sim", manta: "nao", faixa: "a_env", longo: "nao", concreto: "nao" },
        verificacoes: V({ vistoria: { atende: "N", obs: "vala fechada antes da vistoria na est. 44" }, geom: { real: "7", nc: "0" }, acab: { real: "2", nc: "0" } }),
        gran: [{ reg: "GR-201", est: "Pedreira X", p19: "82,0", p9_5: "64,5", p2: "18,2", p0_42: "9,0" },
          { reg: "GR-202", est: "Pedreira X", p19: "88,6", p9_5: "57,1", p2: "16,0", p0_42: "11,2" }],
        geoSec: [{ est: "41", elem: "largura da vala", proj: "50", med: "50,3" }, { est: "44", elem: "largura da vala", proj: "50", med: "50,4" }],
        geoEsp: [{ est: "41", elem: "berço de material filtrante", proj: "10", med: "10,4" }, { est: "44", elem: "berço de material filtrante", proj: "10", med: "8,5" }],
      };
    } },
  ];
})();
