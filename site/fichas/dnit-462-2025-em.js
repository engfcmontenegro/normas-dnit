/*
 * Ficha: DNIT 462/2025-EM — Agregados graúdos e miúdos para concreto de cimento Portland — aceitação do lote.
 * Motor FE.recebimentoMaterialEM (site/fichas/dner-em-036-95.js; RM.passaEm e RM.graficoGran).
 * Graúdo (seção 6): granulometria da Tabela A2 (brita 0 a 4), índice de forma, durabilidade, cloretos, sulfatos, RAA,
 * torrões/friáveis, partículas leves, pulverulento, Los Angeles e esmagamento. Miúdo (seção 7): Tabela A3, fração
 * retida entre peneiras consecutivas, módulo de finura, durabilidade, substâncias nocivas e impurezas orgânicas.
 * Importa das fichas DNIT 412, 425, 451, 413, 266-ME e DNER-ME 197, 055.
 */
(function () {
  "use strict";
  var FE = window.FE, RM = FE.recebimentoMaterialEM, ok = FE.ok, fmt = FE.fmt, num = FE.num;
  var ID = "dnit-462-2025-em";

  // Tabela A2 — % retida acumulada por brita [abertura (mm), mín., máx.]
  var A2 = {
    b0: [[12.5, 0, 0], [9.5, 0, 10], [4.8, 80, 100], [2.36, 95, 100]],
    b1: [[25, 0, 0], [19, 0, 10], [9.5, 80, 100], [6.3, 92, 100], [4.8, 95, 100]],
    b2: [[32, 0, 0], [25, 0, 25], [19, 75, 100], [12.5, 90, 100], [9.5, 95, 100]],
    b3: [[50, 0, 0], [38, 0, 30], [32, 75, 100], [25, 87, 100], [19, 95, 100]],
    b4: [[75, 0, 0], [64, 0, 30], [50, 75, 100], [38, 90, 100], [32, 95, 100]],
  };
  var PEN_G = [75, 64, 50, 38, 32, 25, 19, 12.5, 9.5, 6.3, 4.8, 2.36];
  // Tabela A3 — % passante (limites recomendados)
  var A3 = [[9.5, 100, 100], [4.8, 95, 100], [2.36, 80, 100], [1.18, 50, 85], [0.6, 25, 60], [0.3, 10, 30], [0.15, 2, 10]];
  function kp(mm) { return "p" + String(mm).replace(".", "_"); }
  function kg(mm) { return "g" + String(mm).replace(".", "_"); }
  function nomeMM(mm) { return fmt(mm, mm < 1 ? (mm < 0.2 ? 3 : 2) : mm % 1 ? (mm * 10 % 1 ? 2 : 1) : 0).replace(/(,\d*?)0+$/, "$1").replace(/,$/, "") + " mm"; }
  function graudo(P) { return /^b/.test(P.classe || "b1"); }
  function natural(P) { return P.classe === "areiaN"; }
  function expo(P) { return P.exposicao || "demais"; }
  // % passando numa abertura: peneira da série (±3 %) ou interpolação em escala log
  function passaPen(media, mm) {
    var x = (media || []).filter(function (p) { return ok(p.pass) && Math.abs(p.mm - mm) / mm < 0.03; })[0];
    return x ? x.pass : RM.passaEm(media, mm);
  }

  var GG = "Agregado graúdo — granulometria (6.1, Tabela A2: % retida acumulada)", GGr = "Agregado graúdo — forma, durabilidade e resistência (6.2 a 6.6)";
  var GGn = "Agregado graúdo — substâncias nocivas (6.4)";
  var GM = "Agregado miúdo — granulometria (7.1, Tabela A3: % passante) e módulo de finura (7.2)", GMn = "Agregado miúdo — durabilidade e substâncias nocivas (7.3, 7.4)";
  var ens = [];
  PEN_G.forEach(function (mm) {
    ens.push({ id: kg(mm), grupo: GG, r: "Retida acumulada na peneira de " + nomeMM(mm), metodo: "DNIT 412-ME", secao: "Tab. A2", u: "%", casas: 1, gran: true,
      lim: function (P) {
        if (!graudo(P)) return null;
        var l = (A2[P.classe || "b1"] || []).filter(function (x) { return x[0] === mm; })[0];
        return l ? { min: l[1], max: l[2], casas: 0, texto: l[1] === l[2] ? l[1] + " %" : undefined } : null;
      } });
  });
  ens = ens.concat([
    { id: "if", grupo: GGr, r: "Índice de forma (paquímetro)", metodo: "DNIT 425-ME", secao: "6.2", u: "", casas: 1, lim: function (P) { return graudo(P) ? { max: 3, casas: 1 } : null; } },
    { id: "la", grupo: GGr, r: "Abrasão Los Angeles", metodo: "DNIT 451-ME", secao: "6.5", u: "%", casas: 0, lim: function (P) { return graudo(P) ? { max: 50, casas: 0 } : null; } },
    { id: "esm", grupo: GGr, r: "Resistência ao esmagamento (fração retida, 100 − R)", metodo: "DNER-ME 197", secao: "6.6", u: "%", casas: 1,
      lim: function (P) { return graudo(P) ? { min: expo(P) === "desgaste" ? 65 : 55, casas: 0 } : null; } },
    { id: "abs", grupo: GGr, r: "Absorção de água (para o limite de pulverulento, 6.4.3)", metodo: "DNIT 413-ME", secao: "6.4.3", u: "%", casas: 2, facultativo: true,
      lim: function (P) { return graudo(P) ? { texto: "< 1,0 % admite pulverulento < 2,0 %", info: true } : null; } },
  ]);
  A3.forEach(function (x) {
    ens.push({ id: kp(x[0]), grupo: GM, r: "Passante na peneira de " + nomeMM(x[0]), metodo: "DNIT 412-ME", secao: "Tab. A3", u: "%", casas: 1, gran: true,
      lim: function (P) { return graudo(P) ? null : { min: x[1], max: x[2], casas: 0, texto: x[1] === x[2] ? x[1] + " %" : undefined }; } });
  });
  var USA_M = A3.map(function (x) { return kp(x[0]); });
  ens = ens.concat([
    { id: "fr45", grupo: GM, tipo: "deriv", r: "Maior fração retida entre duas peneiras consecutivas", secao: "7.1", u: "%", casas: 1, usa: USA_M, lim: function (P) { return graudo(P) ? null : { max: 45, casas: 0 }; },
      formula: "máx. (passante i − passante i+1)",
      f: function (V) { var m = 0; for (var i = 0; i < A3.length - 1; i++) m = Math.max(m, V[kp(A3[i][0])] - V[kp(A3[i + 1][0])]); return m; } },
    { id: "mf", grupo: GM, tipo: "deriv", r: "Módulo de finura", secao: "7.2 / 3.7", u: "", casas: 2, usa: USA_M, lim: function (P) { return graudo(P) ? null : { min: 2.3, max: 3.1, casas: 1 }; },
      formula: "Σ % retidas acumuladas (série normal) / 100",
      f: function (V) { return A3.reduce(function (s, x) { return s + (100 - V[kp(x[0])]); }, 0) / 100; } },
    { id: "dmf", grupo: GM, tipo: "deriv", r: "Variação do módulo de finura em relação à amostra de referência da mesma origem", secao: "7.2", u: "", casas: 2, usa: ["mf"],
      se: function (P) { return !graudo(P) && ok(num(P.mfRef)); }, lim: { max: 0.2, casas: 1 }, formula: "|MF − MF de referência|",
      f: function (V, P) { return Math.abs(V.mf - num(P.mfRef)); } },
  ]);
  // durabilidade e substâncias nocivas (graúdo e miúdo)
  function grp(P) { return graudo(P) ? "Agregado graúdo — durabilidade (6.3)" : GMn; }
  function sec(g, m) { return function (P) { return graudo(P) ? g : m; }; }
  ens = ens.concat([
    { id: "dur", grupoF: grp, r: "Durabilidade — perda no ensaio com sulfato", metodo: "DNIT 446-ME", secaoF: sec("6.3.1", "7.3 / 6.3.1"), u: "%", casas: 1,
      facultativo: function (P) { return P.intemperie === "nao"; },
      lim: function (P) { return P.sulfato === "mg" ? { max: 15, maxEstrito: true, casas: 0 } : { max: 12, maxEstrito: true, casas: 0 }; } },
    { id: "clo", grupoF: grp, r: "Teor de cloretos", metodo: "NBR 9917 / NBR 14832", secaoF: sec("6.3.2", "7.3 / 6.3.2"), u: "%", casas: 3,
      lim: function (P) { var t = P.armadura || "armado"; return { max: t === "simples" ? 0.2 : t === "protendido" ? 0.01 : 0.1, maxEstrito: true, casas: t === "protendido" ? 2 : 1 }; } },
    { id: "sul", grupoF: grp, r: "Teor de sulfatos", metodo: "NBR 9917", secaoF: sec("6.3.3", "7.3 / 6.3.3"), u: "%", casas: 3, lim: { max: 0.1, maxEstrito: true, casas: 1 } },
    { id: "raa", grupoF: grp, r: "Reação álcali-agregado — atende à NBR 15577-1", secaoF: sec("6.3.4", "7.3 / 6.3.4"), tipo: "qual", lim: { texto: "atende (inócuo ou com medidas preventivas)" },
      opcoes: [["ok", "atende", /^(atende|in[oó]cuo|ok|sim|medidas)/i, true], ["nao", "não atende", /^(n[aã]o|reativo|deleter)/i, false]], ph: "atende / não atende" },
    { id: "fri", grupoF: function (P) { return graudo(P) ? GGn : GMn; }, r: "Torrões de argila e materiais friáveis", metodo: "NBR 7218", secaoF: sec("6.4.1", "7.4.1"), u: "%", casas: 1,
      lim: function (P) {
        if (!graudo(P)) return natural(P) ? { max: 3, casas: 1 } : null;
        return { max: expo(P) === "aparente" ? 1 : expo(P) === "desgaste" ? 2 : 3, casas: 1 };
      } },
    { id: "lev", grupoF: function (P) { return graudo(P) ? GGn : GMn; }, r: "Partículas leves (materiais carbonosos)", metodo: "NBR 9936", secaoF: sec("6.4.2", "7.4.2"), u: "%", casas: 1,
      facultativo: true, lim: function (P) { return !graudo(P) && !natural(P) ? null : { max: expo(P) === "aparente" ? 0.5 : 1, casas: 1 }; } },
    { id: "pulv", grupoF: function (P) { return graudo(P) ? GGn : GMn; }, r: "Material pulverulento (passante na peneira nº 200 por lavagem)", metodo: "DNIT 266-ME", secaoF: sec("6.4.3", "7.4.3"), u: "%", casas: 1,
      lim: function (P) {
        if (graudo(P)) return { max: 1, maxEstrito: true, casas: 1 };
        var d = expo(P) === "desgaste";
        return { max: natural(P) ? (d ? 3 : 5) : (d ? 10 : 12), casas: 1 };
      } },
    { id: "io", grupo: GMn, r: "Impurezas orgânicas — cor × solução-padrão", metodo: "DNER-ME 055", secao: "7.4.4", tipo: "qual", se: function (P) { return natural(P); },
      lim: { texto: "mais clara que a solução-padrão" }, ph: "mais clara / igual / mais escura",
      opcoes: [["clara", "mais clara", /^(mais clara|clara)/i, true], ["igual", "igual à solução-padrão", /^igual/i, null], ["escura", "mais escura", /^(mais escura|escura)/i, false]] },
    { id: "id7221", grupo: GMn, r: "Índice de desempenho (areia com impurezas) — diferença de resistência", metodo: "NBR 7221", secao: "7.4.4", u: "%", casas: 1, facultativo: true,
      se: function (P) { return natural(P); }, lim: { max: 10, casas: 0 } },
  ]);
  // grupo/seção dependentes do tipo: resolvidos por uma cópia do ensaio (o motor lê e.grupo/e.secao)
  ens.forEach(function (e) {
    if (e.grupoF || e.secaoF) {
      var gF = e.grupoF, sF = e.secaoF, lim0 = e.lim;
      e.lim = function (P) { e.grupo = typeof gF === "function" ? gF(P) : e.grupo; e.secao = typeof sF === "function" ? sF(P) : e.secao; return typeof lim0 === "function" ? lim0(P) : lim0; };
    }
  });

  FE.FICHAS[ID] = RM.criar({
    titulo: "Aceitação de agregados para concreto de cimento Portland",
    resumo: "Lote de agregado graúdo (brita 0 a 4) ou miúdo (areia natural ou britada): granulometria das Tabelas A2/A3, forma, durabilidade, cloretos, sulfatos, RAA, substâncias nocivas, Los Angeles, esmagamento, módulo de finura e impurezas orgânicas (seções 6 e 7), com importação das fichas ME; parecer do lote (8).",
    tabela: "DNIT 462/2025-EM",
    classes: [["b0", "Graúdo — brita 0"], ["b1", "Graúdo — brita 1"], ["b2", "Graúdo — brita 2"], ["b3", "Graúdo — brita 3"], ["b4", "Graúdo — brita 4"],
      ["areiaN", "Miúdo — areia natural"], ["areiaB", "Miúdo — areia britada"]],
    rotuloClasse: "Agregado",
    padrao: { classe: "b1", exposicao: "demais", armadura: "armado", sulfato: "na", intemperie: "sim", dosagem: "" },
    params: [
      { k: "exposicao", r: "Concreto quanto à superfície", tipo: "select", recarrega: true,
        opcoes: [["aparente", "Concreto aparente"], ["desgaste", "Sujeito a desgaste superficial"], ["demais", "Demais concretos (protegido do desgaste, não aparente)"]],
        dica: "limites de friáveis, partículas leves, pulverulento e esmagamento (6.4, 6.6, 7.4)" },
      { k: "armadura", r: "Tipo de concreto (cloretos, 6.3.2)", tipo: "select", opcoes: [["simples", "Simples — < 0,2 %"], ["armado", "Armado — < 0,1 %"], ["protendido", "Protendido — < 0,01 %"]] },
      { k: "sulfato", r: "Solução do ensaio de durabilidade (6.3.1)", tipo: "select", opcoes: [["na", "Sulfato de sódio — perda < 12 %"], ["mg", "Sulfato de magnésio — perda < 15 %"]] },
      { k: "intemperie", r: "Estrutura exposta a intempéries?", tipo: "select", opcoes: [["sim", "Sim — durabilidade exigida"], ["nao", "Não — durabilidade pode ser dispensada (6.3.1)"]] },
      { k: "excecao", r: "Cloretos/sulfatos acima do limite: teor total no concreto verificado dentro do admitido (6.3.2 / 6.3.3)?", tipo: "select",
        opcoes: [["", "Não / não se aplica"], ["sim", "Sim — comprovado (e cimento RS, para sulfatos)"]] },
      { k: "dosagem", r: "Granulometria fora da tabela: estudos prévios de dosagem comprovam a aplicabilidade (6.1 / 7.1)?", tipo: "select",
        opcoes: [["", "Não / não se aplica"], ["sim", "Sim — estudo de dosagem aprovado"]] },
      { k: "mfRef", r: "Módulo de finura de referência da mesma origem — opcional", ph: "ex.: 2,65", se: function (d) { return !graudo(d.params || {}); }, dica: "7.2: variação máx. de 0,2" },
    ],
    lote: { unid: "t", rotuloFornecedor: "Produtor / origem (pedreira, areal)", rotuloQtd: "Quantidade do lote (t ou m³)" },
    rotuloDet: "Amostra",
    ensaios: ens,
    inspecao: [
      { k: "iPrelim", r: "Verificação preliminar da natureza e das condições do agregado", secao: "5", exigido: "grãos duros, estáveis, duráveis e limpos (4 b)" },
      { k: "iGuia", r: "Guia de remessa: origem, tipo, quantidade, data e produtor", secao: "4 j", exigido: "guia completa", falha: "ressalva" },
      { k: "iOrigem", r: "Sem mistura de procedências diferentes na mesma parte da obra sem autorização", secao: "4 g", exigido: "atende", opcional: true },
      { k: "iAmostra", r: "Amostra coletada e reduzida conforme a DNIT 461-PRO", secao: "5", exigido: "atende", falha: "ressalva" },
    ],
    importar: [
      { k: "impGr", r: "Importar granulometria (DNIT 412-ME)", de: "dnit-412-2025-me", ensaios: PEN_G.map(kg).concat(A3.map(function (x) { return kp(x[0]); })),
        valores: function (e, P) {
          var m = e.resultados.media, o = {};
          if (graudo(P)) PEN_G.forEach(function (mm) { var p = passaPen(m, mm); if (ok(p)) o[kg(mm)] = Math.max(0, 100 - p); });
          else A3.forEach(function (x) { var p = passaPen(m, x[0]); if (ok(p)) o[kp(x[0])] = p; });
          return o;
        }, rot: function (e) { return ok(e.resultados.mf) ? "MF " + fmt(e.resultados.mf, 2) : ""; } },
      { k: "impIF", r: "Importar índice de forma (DNIT 425-ME)", de: "dnit-425-2020-me", ensaios: ["if"], valores: function (e) { return { if: e.resultados.I }; } },
      { k: "impLA", r: "Importar abrasão Los Angeles (DNIT 451-ME)", de: "dnit-451-2024-me", ensaios: ["la"], valores: function (e) { return { la: e.resultados.A }; } },
      { k: "impEsm", r: "Importar esmagamento (DNER-ME 197)", de: "dner-me-197-97", ensaios: ["esm"],
        valores: function (e) { return { esm: ok(e.resultados.R) ? 100 - e.resultados.R : NaN }; }, rot: function (e) { return ok(e.resultados.R) ? "R = " + fmt(e.resultados.R, 1) + " %" : ""; } },
      { k: "impPulv", r: "Importar material pulverulento (DNIT 266-ME)", de: "dnit-266-2025-me", ensaios: ["pulv"], valores: function (e) { return { pulv: e.resultados.m }; } },
      { k: "impAbs", r: "Importar absorção (DNIT 413-ME)", de: "dnit-413-2021-me", ensaios: ["abs"], valores: function (e) { return { abs: e.resultados.abs }; } },
      { k: "impIO", r: "Importar impurezas orgânicas (DNER-ME 055)", de: "dner-me-055-95", ensaios: ["io"],
        valores: function (e) { var c = e.resultados.cor; return { io: c === "clara" ? "mais clara" : c === "escura" ? "mais escura" : c === "igual" ? "igual à solução-padrão" : "" }; } },
    ],
    extra: function (ctx) {
      var P = ctx.P, V = ctx.V, it = ctx.item, A = ctx.A;
      // 6.4.3: rocha com absorção < 1,0 % → pulverulento do graúdo até 2 %
      var lp = it.pulv;
      if (lp && graudo(P) && lp.situacao === "nao_conforme" && ok(V.pulv) && V.pulv < 2 && ok(V.abs) && V.abs < 1) {
        lp.situacao = "conforme"; lp.motivos = []; lp.motivo = "absorção " + fmt(V.abs, 2) + " % < 1,0 %: limite alterado para 2 % (6.4.3)"; lp.exigido = "< 2,0 % (absorção < 1,0 %)";
      }
      // granulometria fora da tabela, admitida com estudo de dosagem (6.1 / 7.1)
      ctx.linhas.forEach(function (l) {
        var e = ctx.V["_" + l.id] && ctx.V["_" + l.id].e;
        if (e && (e.gran || l.id === "fr45") && l.situacao === "nao_conforme" && P.dosagem === "sim") {
          l.situacao = "ressalva";
          l.motivos = [{ situacao: "ressalva", texto: l.motivo + " — utilização admitida por estudo prévio de dosagem (" + (graudo(P) ? "6.1" : "7.1") + ")" }];
          l.motivo = l.motivos[0].texto;
        }
      });
      // cloretos e sulfatos acima do limite: admitidos se o teor total no concreto for verificado (6.3.2 / 6.3.3)
      ["clo", "sul"].forEach(function (id) {
        var l = it[id];
        if (l && l.situacao === "nao_conforme" && P.excecao === "sim") {
          l.situacao = "ressalva";
          l.motivos = [{ situacao: "ressalva", texto: l.motivo + " — admitido: teor total trazido ao concreto verificado dentro do limite (" + (id === "clo" ? "6.3.2" : "6.3.3; cimento RS") + ")" }];
          l.motivo = l.motivos[0].texto;
        }
      });
      // impurezas orgânicas: cor mais escura → índice de desempenho (NBR 7221) ≤ 10 %
      var li = it.io, ld = it.id7221;
      if (li && li.situacao === "nao_conforme" && ld && ld.n) {
        if (ld.situacao === "conforme") {
          li.situacao = "ressalva";
          li.motivos = [{ situacao: "ressalva", texto: "cor mais escura, mas o índice de desempenho (NBR 7221) atende (diferença ≤ 10 %, 7.4.4)" }];
          li.motivo = li.motivos[0].texto;
        }
      } else if (li && li.situacao === "nao_conforme" && ld && !ld.n) {
        A.marcar(li, "nao_conforme", "realize o ensaio de índice de desempenho (NBR 7221) para decidir (7.4.4)");
      }
      if (graudo(P) && ok(V.pulv)) ctx.avisos.push("6.4.3: para a mistura total de agregados do concreto, o limite de material pulverulento é 6,5 % — verifique na composição.");
      ctx.extraRes = { graudo: graudo(P) };
    },
    graficos: function (calc, d, opt) {
      var V = calc.resultados.V, P = d.params || {};
      if (graudo(P)) {
        var fx = (A2[P.classe || "b1"] || []).map(function (x) { return { mm: x[0], min: 100 - x[2], max: 100 - x[1] }; });
        var pts = PEN_G.map(function (mm) { return { mm: mm, pass: ok(V[kg(mm)]) ? 100 - V[kg(mm)] : NaN }; }).filter(function (p) { return ok(p.pass); });
        return [RM.graficoGran("Granulometria × Tabela A2 (" + (P.classe || "b1").replace("b", "brita ") + ") — em % passando", [{ pts: pts }], fx, opt)];
      }
      var ptm = A3.map(function (x) { var v = V[kp(x[0])]; return { mm: x[0], pass: v, fora: ok(v) && (v < x[1] - 1e-9 || v > x[2] + 1e-9) }; }).filter(function (p) { return ok(p.pass); });
      return [RM.graficoGran("Granulometria do agregado miúdo × Tabela A3", [{ pts: ptm }], A3.map(function (x) { return { mm: x[0], min: x[1], max: x[2] }; }), opt)];
    },
    textos: { REJEITADO: { texto: "Há requisito da DNIT 462/2025-EM não atendido: o lote é considerado rejeitado (8 c)." } },
    notas: "DNIT 462/2025-EM. Graúdo: granulometria da Tabela A2 (% retida acumulada; fora dela, só com estudo de dosagem, 6.1), índice de forma ≤ 3,0 (DNIT 425), durabilidade com sulfato de " +
      "sódio < 12 % ou magnésio < 15 % (6.3.1; dispensável fora de intempéries), cloretos < 0,2 / 0,1 / 0,01 % (simples/armado/protendido), sulfatos < 0,1 %, RAA pela NBR 15577-1, torrões e friáveis " +
      "≤ 1,0 / 2,0 / 3,0 % (aparente/desgaste/demais), partículas leves ≤ 0,5 / 1,0 %, pulverulento < 1,0 % (< 2,0 % se a absorção da rocha < 1,0 %), Los Angeles ≤ 50 %, esmagamento ≥ 65 % " +
      "(desgaste) ou ≥ 55 % — adotado como a fração retida 100 − R da DNER-ME 197. Miúdo: Tabela A3 (% passante), fração retida entre peneiras consecutivas ≤ 45 %, módulo de finura 2,3 a 3,1 " +
      "(variação ≤ 0,2 na mesma origem), durabilidade como o graúdo, friáveis ≤ 3,0 % e partículas leves (areias naturais), pulverulento ≤ 3 / 10 / 5 / 12 % (natural/britada, com/sem desgaste), impurezas " +
      "orgânicas mais claras que o padrão (areia natural; mais escura → NBR 7221, diferença ≤ 10 %). Resultado = média das amostras; na importação da DNIT 412-ME o % passante é o da peneira " +
      "(±3 % na abertura) ou interpolado em escala log. Aceitação (8): o lote só é aceito se atender a todos os requisitos; caso contrário, é rejeitado.",
    exemplos: [
      { nome: "Areia natural média — lote aceito (granulometria, pulverulento e impurezas importados)", dados: function () {
        var d = { ident: { registro: "REC-AGC-01", data: "2026-05-05", obra: "Obra A — obras de arte", origem: "Areal 1", camada: "Concreto estrutural" },
          params: { classe: "areiaN", exposicao: "demais", armadura: "armado", sulfato: "na", intemperie: "sim", mfRef: "2,70", fornecedor: "Areal 1", nf: "5520", quantidade: "60",
            dataReceb: "05/05/2026", dataAmostra: "05/05/2026", iPrelim: "S", iGuia: "S", iOrigem: "S", iAmostra: "S" },
          det: [{ dur: "4,2", clo: "0,012", sul: "0,020", raa: "atende", fri: "0,8", lev: "0,2" }] };
        RM.importarEx(ID, d, "impGr", [["dnit-412-2025-me", 2]]);
        RM.importarEx(ID, d, "impPulv", [["dnit-266-2025-me", 0]]);
        RM.importarEx(ID, d, "impIO", [["dner-me-055-95", 0]]);
        return d;
      } },
      { nome: "Brita 1 para pavimento de concreto (desgaste superficial) — rejeitada (esmagamento, friáveis, granulometria)", dados: function () {
        var d = { ident: { registro: "REC-AGC-02", data: "2026-06-16", obra: "Obra B — pavimento de concreto", origem: "Pedreira Z", camada: "Placas de concreto" },
          params: { classe: "b1", exposicao: "desgaste", armadura: "simples", sulfato: "na", intemperie: "sim", fornecedor: "Pedreira Z", quantidade: "180",
            dataReceb: "16/06/2026", dataAmostra: "16/06/2026", iPrelim: "S", iGuia: "N", iAmostra: "S" },
          det: [{ g25: "0", g19: "14,2", g9_5: "84,5", g6_3: "93,8", g4_8: "96,4", dur: "6,8", clo: "0,015", sul: "0,030", raa: "atende", fri: "2,6" },
            { g25: "0", g19: "12,6", g9_5: "82,9", g6_3: "93,1", g4_8: "95,9" }] };
        RM.importarEx(ID, d, "impIF", [["dnit-425-2020-me", 1]]);
        RM.importarEx(ID, d, "impLA", [["dnit-451-2024-me", 0]]);
        RM.importarEx(ID, d, "impEsm", [["dner-me-197-97", 2]]);
        RM.importarEx(ID, d, "impPulv", [["dnit-266-2025-me", 1]]);
        return d;
      } },
    ],
  });
})();
