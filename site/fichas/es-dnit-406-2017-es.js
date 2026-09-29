/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 406/2017-ES — Base estabilizada granulometricamente com Açobrita®
 * (motor FE.aceitacaoG1, em es-dnit-137-2010-es.js).
 * Este arquivo também define FE.aceitacaoG1.escoria(o): montagem comum das ES de camadas com agregado siderúrgico
 * (DNIT 406 e 407/2017; DNIT 114 e 115/2009, canceladas), usada pelos arquivos es-dnit-407/114/115.
 *
 * DNIT 406/2017-ES (PDF, 11 p.):
 *   5.1.1 (p. 3)   Açobrita®: faixa da Tabela 1; ISC ≥ 80 % (Método C); LA < 55 % (maior admitido com desempenho anterior);
 *                  potencial de expansão (DNIT 113) < 3,0 %; MR ≥ 300 MPa; índice de forma > 0,5 e lamelares ≤ 10 %.
 *   5.1.2 (p. 3–4) mistura: faixa da Tabela 2 (Anexo A, p. 9); lateríticos LL ≤ 40 % e IP ≤ 15 %, demais LL ≤ 25 % e IP ≤ 6 %;
 *                  ISC > 60 % (N ≤ 5×10⁶) ou > 80 % (N > 5×10⁶), expansão ≤ 0,5 %; potencial de expansão ≤ 1,5 % (N ≤ 5×10⁶) ou
 *                  ≤ 1,0 % (N > 5×10⁶).
 *   5.3.6–5.3.8 (p. 5–6) GC mínimo de 100 %.
 *   7.1 (p. 6)     granulometria, compactação e ISC: 1 por camada a cada 200 m ou jornada (400 m, homogêneos); nº pela Tabela 3;
 *                  no mínimo 5 por segmento e camada.
 *   7.2 (p. 6–7)   umidade ± 2 % da ótima; GC a cada 100 m (≤ 4.000 m² → mín. 5), "GC > 100 %"; nº pela Tabela 3 (7.2.3).
 *   7.3.1 (p. 7)   largura ± 10 cm; flecha até +20 % (sem falta); espessura ± 10 %.
 *   7.4 (p. 7)     expansão < 0,5 % (7.4.1); granulometria X̄ ± k·s na faixa (7.4.2); ISC e GC X̄ − k·s ≥ mínimo (7.4.3).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex, kPen = G1.kPen;
  var PEN7 = [[50.8, "2\"", 7], [25.4, "1\"", 7], [9.5, "3/8\"", 7], [4.8, "nº 4", 5], [2.0, "nº 10", 5], [0.42, "nº 40", 2], [0.075, "nº 200", 2]];
  var PEN6 = PEN7.slice(1);
  var PEN_SOLO = [[25.4, "1\"", null], [9.5, "3/8\"", null], [4.8, "nº 4", null], [2.0, "nº 10", null], [0.42, "nº 40", null], [0.15, "nº 100", null], [0.075, "nº 200", null]];
  var EPSX = 1e-6;
  function P_(d) { return d.params || {}; }

  // o: {id, titulo, resumo, mat, camada, pen, faixas: [[id, rot]], faixaPadrao, insFaixa, solo, sec: {...}, tabela, a_cada, a_cadaH,
  //     ins: {isc, la, fi}, mix: {isc(P), iscTxt(P), exp(P), expTxt(P), expSec, pexp(P), pexpTxt(P), pexpSec, pexpEst, mr, llip}, params, padrao, notas}
  function escoria(o) {
    var S = o.sec, fora = function (P) { return P.insumo !== "fora"; };
    var params = [
      { k: "insumo", r: "Ensaios do agregado siderúrgico" + (o.solo ? " e do solo" : "") + " (" + S.ins + ")", tipo: "select", recarrega: true,
        opcoes: [["lote", "Registrados neste lote"], ["fora", "Registrados em outro controle (recebimento) — não exigidos aqui"]] },
      { k: "faixa", r: "Faixa granulométrica da mistura (" + S.faixa + ")", tipo: "select", opcoes: o.faixas.map(function (f) { return [f[0], f[1]]; }) },
      { k: "laDesemp", r: "Desempenho anterior satisfatório do agregado (LA acima do limite)?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim — admite-se desgaste maior"]] },
      { k: "secaoT", r: "Seção transversal", tipo: "select", opcoes: [["abaul", "Abaulamento — flecha (" + S.geo + " b)"], ["simples", "Caimento simples (a ES só fixa a flecha)"]] },
      { k: "flechaProj", r: "Flecha de abaulamento de projeto (cm)", se: function (d) { return P_(d).secaoT !== "simples"; } },
    ].concat(o.params || []);
    var insCampos = ["isc", "la", "pexp", "mr"].concat(o.ins.fi ? ["fi", "lam"] : []);
    var gran = [{ chave: "gran", titulo: "Mistura " + o.mat + " + solo", nome: "Granulometria da mistura (X̄ ± k·s)", secao: S.faixa + "; " + S.aceGran, pen: o.pen,
      faixa: function (P) { return P.faixa; } },
    { chave: "granI", titulo: o.mat + " (insumo)", nome: "Granulometria do " + o.mat + " (Tabela 1)", secao: S.ins + "; Tabela 1", pen: o.pen, individual: true,
      faixa: o.insFaixa, se: fora }];
    if (o.solo) gran.push({ chave: "granS", titulo: "Solo (insumo)", nome: "Granulometria do solo (Tabela 2)", secao: S.solo + "; Tabela 2", pen: PEN_SOLO, individual: true, proj: false,
      extras: ["mct"], faixa: o.id + "-solo", se: fora });
    var F = G1.criar({
      id: o.id, titulo: o.titulo, resumo: o.resumo,
      refs: { reprova: S.ace, atende: S.ace, corrige: S.corr, regra: S.ace, tabela: o.tabela },
      tabelaNome: o.tabela + " da ES (" + S.tab + ") — igual à tabela padrão das ES do DNIT",
      homog: !!o.a_cadaH, medicao: "volume", secMedicao: S.med, espLim: [10, 20],
      espLimTxt: "espessura mínima de 10 cm; acima de 20 cm, subdividir em camadas parciais (" + S.esp + ").",
      params: params,
      padrao: Object.assign({ homog: "nao", jornadas: "1", insumo: "lote", faixa: o.faixaPadrao, laDesemp: "nao", secaoT: "abaul", espGeo: "20" }, o.padrao || {}),
      blocos: {
        umid: { secao: S.umid, dica: "± 2 % em torno da ótima (tolerância de execução)" },
        comp: { titulo: "Compactação, ISC, expansão e potencial de expansão da mistura", secao: S.mix + "; " + S.freq, campos: ["isc", "exp", "pexp"].concat(o.mix.mr ? ["mr"] : []),
          dica: "compactação " + o.metodo + "; potencial de expansão pela DNIT 113 (média de 3 CPs)" },
        gc: { secao: S.gc },
        carac: o.mix.llip ? { titulo: "Limites de consistência da mistura", secao: S.mix, campos: ["ll", "ip"] } : undefined,
        ins: { titulo: "Agregado siderúrgico " + o.mat + " — insumo", secao: S.ins, campos: insCampos, se: fora },
        gran: gran,
        geo: { secao: S.geo, larg: 0.10, esp: true, flecha: true },
      },
      criterioTxt: o.codigo + ", " + S.ace + " — controle estatístico com a " + o.tabela,
      notas: o.notas,
      criterios: function (c, H) {
        var P = c.P, ins = fora(P);
        var fr = { a_cada: o.a_cada, a_cadaH: o.a_cadaH, jornada: true, minimo: 5, secao: S.freq };
        H.freq(Object.assign({ ensaio: "Granulometria da mistura", metodo: "DNIT 412 (DNER-ME 080 citada)", realizado: H.conta("gran", o.pen.map(function (p) { return kPen(p[0]); })) }, fr));
        H.freq(Object.assign({ ensaio: "Compactação (γs,máx e h ót)", metodo: o.metodoFreq, realizado: H.conta("comp", ["gs"]) }, fr));
        H.freq(Object.assign({ ensaio: "ISC e expansão", metodo: "DNIT 172", realizado: H.conta("comp", ["isc", "exp"]) }, fr));
        if (o.mix.pexpEst) H.freq(Object.assign({ ensaio: "Potencial de expansão da mistura", metodo: "DNIT 113", realizado: H.conta("comp", ["pexp"]) }, fr));
        else H.freq({ ensaio: "Potencial de expansão da mistura", metodo: "DNIT 113", por: "lote", regra: "requisito da mistura (" + S.mix + ") — mín. 1 por lote (adotado)", realizado: H.conta("comp", ["pexp"]) });
        if (o.mix.llip) H.freq({ ensaio: "LL e IP da mistura", metodo: "DNER-ME 122 / 082", por: "lote", regra: "requisito da mistura (" + S.mix + ") — mín. 1 por lote (adotado)",
          realizado: Math.min(H.conta("carac", ["ll"]), H.conta("carac", ["ip"])) });
        if (o.mix.mr) H.freq({ ensaio: "Módulo de resiliência da mistura", metodo: "DNIT 134", por: "lote", regra: "requisito da mistura (" + S.mix + ") — mín. 1 por lote (adotado)", realizado: H.conta("comp", ["mr"]) });
        H.freq({ ensaio: "Umidade antes da compactação", metodo: "DNIT 456", por: "lote", minimo: 5, regra: "nº definido pelo executante (" + S.nexec + "); mín. 5 (" + o.tabela + ")",
          realizado: H.conta("umid", ["w"]) });
        H.freq({ ensaio: "Grau de compactação", metodo: "DNIT 458 (DNER-ME 092 citada)", a_cada: 100, minimo: 5, secao: S.gcFreq, realizado: H.conta("gc", ["gc"]) });
        H.freq({ ensaio: "Agregado siderúrgico — ISC, LA, potencial de expansão, MR" + (o.ins.fi ? ", forma" : ""), metodo: "DNIT 172 / 451 / 113 / 134" + (o.ins.fi ? " / 424" : ""), por: "lote",
          regra: "caracterização do insumo (" + S.ins + ") — mín. 1 por lote (adotado)", realizado: H.conta("ins", insCampos), aplica: ins });
        H.freq({ ensaio: "Granulometria do " + o.mat, metodo: "DNIT 412", por: "lote", regra: "caracterização do insumo (" + S.ins + ") — mín. 1 por lote (adotado)",
          realizado: H.conta("granI", o.pen.map(function (p) { return kPen(p[0]); })), aplica: ins });
        if (o.solo) H.freq({ ensaio: "Solo — granulometria e grupo MCT", metodo: "DNIT 412 / DNER-CLA 259", por: "lote", regra: "caracterização do insumo (" + S.solo + ") — mín. 1 por lote (adotado)",
          realizado: H.conta("granS", PEN_SOLO.map(function (p) { return kPen(p[0]); })), aplica: ins });
        // execução
        H.av({ id: "umid", criterio: "Umidade antes da compactação: Δw = w − h ót", secao: S.umid, unid: "p.p.", casas: 1, min: -2, max: 2, individual: true, falha: "ressalva", graf: true,
          exigido: "h ót ± 2 (tolerância de execução)", pontos: H.pts("umid", function (x, i) { return c.tab.umid[i].dw; }, { rot: "det." }) });
        H.av({ id: "gc", criterio: "Grau de compactação", secao: S.gcAce, unid: "%", casas: 1, min: 100, tab: "gc", campo: "gc", rot: "furo", graf: true,
          exigido: "≥ 100 % (" + S.gcMin + "; " + S.gc2 + " escreve \"GC > 100 %\")" });
        // mistura
        H.av({ id: "isc", criterio: "ISC da mistura", secao: S.mix + "; " + S.aceIsc, unid: "%", casas: 0, min: o.mix.isc(P), minEstrito: true, exigido: o.mix.iscTxt(P), tab: "comp", campo: "isc" });
        H.av({ id: "exp", criterio: "Expansão no ISC", secao: o.mix.expSec(P), unid: "%", casas: 2, max: o.mix.exp(P) - EPSX, individual: true, obrigMax: true, exigido: o.mix.expTxt(P), tab: "comp", campo: "exp" });
        H.av({ id: "pexp", criterio: "Potencial de expansão da mistura (DNIT 113)", secao: o.mix.pexpSec, unid: "%", casas: 2, max: o.mix.pexp(P), exigido: o.mix.pexpTxt(P),
          individual: !o.mix.pexpEst, obrigMax: true, tab: "comp", campo: "pexp" });
        if (o.mix.mr) H.av({ id: "mrM", criterio: "Módulo de resiliência da mistura", secao: S.mix, unid: "MPa", casas: 0, min: o.mix.mr, individual: true, tab: "comp", campo: "mr" });
        if (o.mix.llip) {
          var lat = P.lateritico === "sim";
          H.av({ id: "ll", criterio: "Limite de liquidez da mistura", secao: S.mix, unid: "%", casas: 0, max: lat ? 40 : 25, individual: true, tab: "carac", campo: "ll", np: 0 });
          H.av({ id: "ip", criterio: "Índice de plasticidade da mistura", secao: S.mix, unid: "%", casas: 0, max: lat ? 15 : 6, individual: true, tab: "carac", campo: "ip", np: 0 });
        }
        H.gran("gran");
        // insumos
        var nI = "ensaios do insumo registrados em outro controle";
        H.av({ id: "iscI", criterio: o.mat + " — ISC", secao: S.ins, unid: "%", casas: 0, min: o.ins.isc, individual: true, tab: "ins", campo: "isc", aplica: ins, naoAplicaPor: nI });
        var la = H.av({ id: "laI", criterio: o.mat + " — desgaste Los Angeles", secao: S.ins, unid: "%", casas: 0, max: o.ins.la - EPSX, exigido: "< " + o.ins.la + " %", individual: true,
          tab: "ins", campo: "la", aplica: ins, naoAplicaPor: nI });
        if (la.situacao === "nao_conforme" && P.laDesemp === "sim") { la.situacao = "ressalva"; la.motivo = "admitido por desempenho anterior satisfatório (" + S.ins + ") — anexar a comprovação: " + la.motivo; la.motivos = [{ situacao: "ressalva", texto: la.motivo }]; }
        H.av({ id: "pexpI", criterio: o.mat + " — potencial de expansão (DNIT 113)", secao: S.ins, unid: "%", casas: 2, max: 3 - EPSX, exigido: "< 3,0 %", individual: true, tab: "ins", campo: "pexp", aplica: ins, naoAplicaPor: nI });
        H.av({ id: "mrI", criterio: o.mat + " — módulo de resiliência", secao: S.ins, unid: "MPa", casas: 0, min: 300, individual: true, tab: "ins", campo: "mr", aplica: ins, naoAplicaPor: nI });
        if (o.ins.fi) {
          H.av({ id: "fiI", criterio: o.mat + " — índice de forma", secao: S.ins, unid: "", casas: 2, min: 0.5, minEstrito: true, individual: true, tab: "ins", campo: "fi", aplica: ins, naoAplicaPor: nI });
          H.av({ id: "lamI", criterio: o.mat + " — partículas lamelares", secao: S.ins, unid: "%", casas: 1, max: 10, individual: true, tab: "ins", campo: "lam", aplica: ins, naoAplicaPor: nI });
        }
        if (ins) H.gran("granI");
        if (o.solo && ins) {
          H.gran("granS");
          var grupos = (c.d.granS || []).map(function (x, i) { return { t: H.normMct(x.mct), i: i, est: x.est }; }).filter(function (g) { return g.t; });
          var lm = A.linha({ id: "mct", criterio: "Solo — comportamento laterítico (grupo MCT LA, LA' ou LG')", secao: S.solo, n: grupos.length, semMedia: true, txtEstat: "—",
            exigido: "LA, LA' ou LG' (DNER-CLA 259)", resultado: grupos.map(function (g) { return g.t; }).join(", ") || "—" });
          var bad = grupos.filter(function (g) { return ["LA", "LA'", "LG'"].indexOf(g.t) < 0; });
          if (!grupos.length) A.marcar(lm, "sem_dados", "grupo MCT não informado");
          else if (bad.length) A.marcar(lm, "nao_conforme", bad.map(function (g) { return "amostra " + (g.i + 1) + ": " + g.t; }).join("; "));
          else lm.motivo = "solo de comportamento laterítico";
          c.linhas.push(lm);
        }
        if (o.extra) o.extra(c, H);
        H.geo();
      },
    });
    return F;
  }
  G1.escoria = escoria;
  G1.PEN_ESC7 = PEN7; G1.PEN_ESC6 = PEN6;

  // ---------- exemplos: geradores comuns ----------
  function granCols(pen, ests, lista, reg) {
    return lista.map(function (v, i) {
      var c = { est: String(ests[i]), reg: reg + "-" + (i + 1) };
      pen.forEach(function (p, j) { if (v[j] !== null && v[j] !== undefined) c[kPen(p[0])] = A.nstr(v[j], 1); });
      return c;
    });
  }
  function projDe(pen, v) { var c = {}; pen.forEach(function (p, j) { if (v[j] !== null) c[kPen(p[0])] = String(v[j]); }); return c; }
  function comp(ests, lista, reg) {
    return lista.map(function (x, i) { var c = { est: String(ests[i]), reg: reg + "-" + (i + 1), gs: x[0], hot: x[1], isc: x[2], exp: x[3], pexp: x[4] }; if (x[5]) c.mr = x[5]; return c; });
  }
  function gcCols(lista) { return lista.map(function (x, i) { return { est: String(x[0]), pos: ["LE", "eixo", "LD"][i % 3], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[1], 1) }; }); }
  G1.exEsc = { granCols: granCols, projDe: projDe, comp: comp, gcCols: gcCols };

  // =====================================================================================================
  // DNIT 406/2017-ES
  // =====================================================================================================
  var FX = ["A", "B", "C", "D", "E", "F"].map(function (f) { return ["dnit-406-2017-es-misturas-" + f, "Faixa " + f + (f < "E" ? " (N > 5 × 10⁶)" : " (N < 5 × 10⁶)")]; });
  var F = escoria({
    id: "dnit-406-2017-es", codigo: "DNIT 406/2017-ES", mat: "Açobrita®", pen: PEN7, faixas: FX, faixaPadrao: "dnit-406-2017-es-misturas-B", insFaixa: "dnit-406-2017-es-acobrita",
    titulo: "Base com Açobrita® (agregado siderúrgico) — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência (7.1, 7.2; mín. 5 pela Tabela 3) e aplica os critérios da ES: " +
      "mistura (faixa da Tabela 2 com X̄ ± k·s, LL/IP, ISC > 60/80 %, expansão < 0,5 %, potencial de expansão ≤ 1,5/1,0 %), GC ≥ 100 %, umidade ± 2 %, " +
      "Açobrita® (Tabela 1, ISC ≥ 80 %, LA < 55 %, expansão < 3 %, MR ≥ 300 MPa, forma) e controle geométrico.",
    tabela: "Tabela 3", metodo: "DNIT 164, Método C", metodoFreq: "DNIT 164, Método C", a_cada: 200, a_cadaH: 400,
    sec: { ins: "5.1.1", mix: "5.1.2", faixa: "5.1.2; Tabela 2", aceGran: "7.4.2", ace: "7.4", corr: "7.4.4", tab: "7.1.2, p. 6", freq: "7.1.1, 7.1.2", nexec: "7.2.3",
      umid: "7.2.1 a", gc: "5.3.6–5.3.8; 7.2.2", gcFreq: "7.2.2", gcAce: "7.2.2; 7.4.3", gcMin: "5.3.6–5.3.8", gc2: "7.2.2", aceIsc: "7.4.3", geo: "7.3.1", esp: "5.3.3", med: "8.1–8.3" },
    ins: { isc: 80, la: 55, fi: true },
    mix: {
      llip: true,
      isc: function (P) { return P.nN === "le5" ? 60 : 80; }, iscTxt: function (P) { return "> " + (P.nN === "le5" ? 60 : 80) + " %"; },
      exp: function () { return 0.5; }, expTxt: function () { return "< 0,5 % (7.4.1; 5.1.2: ≤ 0,5 %)"; }, expSec: function () { return "5.1.2; 7.4.1"; },
      pexp: function (P) { return P.nN === "le5" ? 1.5 : 1.0; }, pexpTxt: function (P) { return "≤ " + (P.nN === "le5" ? "1,5" : "1,0") + " %"; }, pexpSec: "5.1.2",
    },
    params: [
      { k: "nN", r: "Número N de projeto (5.1.2)", tipo: "select", opcoes: [["gt5", "N > 5 × 10⁶ — ISC > 80 %, potencial de expansão ≤ 1,0 %"], ["le5", "N ≤ 5 × 10⁶ — ISC > 60 %, potencial de expansão ≤ 1,5 %"]] },
      { k: "lateritico", r: "Solo com características lateríticas? (5.1.2)", tipo: "select", opcoes: [["nao", "Não — LL ≤ 25 %, IP ≤ 6 %"], ["sim", "Sim — LL ≤ 40 %, IP ≤ 15 %"]] },
    ],
    padrao: { nN: "gt5", lateritico: "nao" },
    extra: function (c) {
      var f = String(c.P.faixa || "").slice(-1);
      if (f && ((c.P.nN === "le5" && "ABCD".indexOf(f) >= 0) || (c.P.nN !== "le5" && "EF".indexOf(f) >= 0)))
        c.av.push("A faixa " + f + " da Tabela 2 é indicada para " + ("ABCD".indexOf(f) >= 0 ? "N > 5 × 10⁶" : "N < 5 × 10⁶") + ", diferente do N informado.");
    },
    notas: "DNIT 406/2017-ES. Métodos citados e substituídos: DNER-ME 080 → DNIT 412; DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; DNER-ME 035 → DNIT 451; " +
      "DNER-ME 086 → DNIT 424; DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458. GC: mínimo de 100 % (5.3.6–5.3.8); 7.2.2 escreve \"> 100 %\". " +
      "Expansão da mistura: < 0,5 % (7.4.1), valor individual. Umidade: tolerância de execução (fora dela, ressalva). Insumos: 1 amostra por lote (adotado).",
  });
  var E = G1.exEsc;
  F.exemplos = [
    { nome: "Lote aceito — base com Açobrita®, faixa B, 400 m (ensaios do insumo importados dos exemplos ME)", dados: function () {
      var d = { ident: { registro: "LOTE-AB-001", data: "2026-08-04", obra: "Obra A — BR-000", trecho: "Lote 1", local: "Est. 80 a 100", camada: "Base — Açobrita® + solo", origem: "Fornecedor A + Jazida 2" },
        params: Object.assign({}, F.padrao, { estIni: "80", estFim: "100", largura: "8,00", espessura: "15", flechaProj: "8", jornadas: "2" }), obs: "" };
      var ests = [81, 85, 89, 93, 97];
      d.gran = E.granCols(PEN7, ests, [[100, 84, 58, 45, 32, 22, 9.8], [100, 82, 56, 43, 31, 21, 10.6], [100, 85, 60, 46, 34, 23, 9.4], [100, 83, 57, 44, 32, 22, 10.2], [100, 84, 59, 45, 33, 22, 9.9]], "GR");
      d.granP = [E.projDe(PEN7, [100, 83, 58, 45, 33, 22, 10])];
      d.comp = E.comp(ests, [["2,412", "8,6", "118", "0,12", "0,42"], ["2,405", "8,9", "112", "0,15", "0,51"], ["2,418", "8,4", "125", "0,10", "0,38"], ["2,409", "8,7", "108", "0,18", "0,47"], ["2,414", "8,5", "121", "0,13", "0,44"]], "CP");
      d.carac = [{ est: "85", reg: "CAR-01", ll: "NP", ip: "NP" }];
      X.importar(F, d, "imp_ins", [["dnit-113-2009-me", 0], ["dnit-451-2024-me", 1], ["dnit-424-2020-me", 0]]);
      d.ins.push({ reg: "INS-ISC/MR (digitado)", isc: "142", mr: "410" });
      d.granI = E.granCols(PEN7, [80], [[100, 91, 66, 48, 36, 18, 7.2]], "GR-A");
      d.umid = X.colunas([[81, 8.1], [85, 9.4], [89, 7.9], [93, 9.9], [97, 8.8]], "w", "Campo — Speedy");
      d.gc = E.gcCols([[80, 101.4], [83, 100.9], [86, 102.1], [89, 101.2], [92, 100.7], [95, 101.8], [98, 101.0]]);
      d.geo = X.secoes(80, 21, function (i) { return { larg: 8.04 + X.onda(i, 0.05), esp: 15.3 + X.onda(i, 0.9), flecha: 8.7 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo: potencial de expansão (DNIT 113), Los Angeles (DNIT 451) e índice de forma (DNIT 424) do Açobrita® importados dos exemplos das fichas ME; demais valores digitados.";
      return d;
    } },
    { nome: "Lote rejeitado — Açobrita® com potencial de expansão > 3 % (importado), expansão da mistura ≥ 0,5 % e nº 200 fora da faixa", dados: function () {
      var d = { ident: { registro: "LOTE-AB-002", data: "2026-08-19", obra: "Obra B — BR-000", trecho: "Lote 2", local: "Est. 0 a 20", camada: "Base — Açobrita® + solo", origem: "Fornecedor B + Jazida 3" },
        params: Object.assign({}, F.padrao, { estIni: "0", estFim: "20", largura: "8,00", espessura: "15", flechaProj: "8" }), obs: "" };
      var ests = [2, 6, 10, 14, 18];
      d.gran = E.granCols(PEN7, ests, [[100, 84, 58, 45, 32, 22, 13.8], [100, 82, 56, 43, 31, 21, 14.6], [100, 85, 60, 46, 34, 23, 12.9], [100, 83, 57, 44, 32, 22, 14.1], [100, 84, 59, 45, 33, 22, 13.5]], "GR");
      d.granP = [E.projDe(PEN7, [100, 83, 58, 45, 33, 22, 12])];
      d.comp = E.comp(ests, [["2,398", "9,1", "96", "0,34", "0,82"], ["2,391", "9,4", "88", "0,52", "1,12"], ["2,402", "9,0", "104", "0,28", "0,76"], ["2,395", "9,3", "91", "0,41", "0,95"], ["2,400", "9,2", "99", "0,30", "0,88"]], "CP");
      d.carac = [{ est: "6", reg: "CAR-11", ll: "24", ip: "5" }];
      X.importar(F, d, "imp_ins", [["dnit-113-2009-me", 1], ["dnit-451-2024-me", 1]]);
      d.ins.push({ reg: "INS-ISC/MR (digitado)", isc: "131", mr: "385", fi: "0,62", lam: "8,4" });
      d.granI = E.granCols(PEN7, [0], [[100, 90, 64, 47, 35, 17, 7.8]], "GR-A");
      d.umid = X.colunas([[1, 9.4], [5, 10.1], [9, 8.6], [13, 11.8], [17, 9.0]], "w", "Campo — Speedy");
      d.gc = E.gcCols([[1, 100.8], [4, 101.3], [7, 100.4], [10, 101.6], [13, 100.9], [16, 101.1], [19, 100.6]]);
      d.geo = X.secoes(0, 21, function (i) { return { larg: 8.03 + X.onda(i, 0.05), esp: 15.2 + X.onda(i, 0.9), flecha: 8.6 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo de reprovação: potencial de expansão do Açobrita® de 4,00 % (exemplo DNIT 113 — escória pouco curada); expansão 0,52 % na estaca 6; potencial de expansão da mistura " +
        "1,12 % > 1,0 % (N > 5 × 10⁶); nº 200 com X̄ + k·s acima de projeto + 2; umidade +2,5 p.p. na estaca 13 (ressalva).";
      return d;
    } },
  ];
})();
