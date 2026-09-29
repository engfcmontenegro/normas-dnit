/*
 * Ficha: DNER-EM 260/94 — Escórias de alto-forno para pavimentos rodoviários — aceitação do lote.
 * Motor FE.recebimentoMaterialEM (site/fichas/dner-em-036-95.js). Define também a configuração comum das escórias
 * (FE.recebimentoMaterialEM.escoria), usada pela DNER-EM 262/94 (escória de aciaria), carregada depois deste arquivo.
 */
(function () {
  "use strict";
  var FE = window.FE, RM = FE.recebimentoMaterialEM, ok = FE.ok, fmt = FE.fmt;

  // % passando numa abertura (interpola em log entre as peneiras da DNIT 412, se preciso)
  function passaEm(media, mm) {
    var pts = (media || []).filter(function (x) { return ok(x.pass); }).sort(function (a, b) { return a.mm - b.mm; });
    for (var i = 0; i < pts.length; i++) {
      if (Math.abs(pts[i].mm - mm) < 1e-6) return pts[i].pass;
      if (pts[i].mm > mm) {
        if (!i) return NaN;
        var a = pts[i - 1], b = pts[i], t = (Math.log(mm) - Math.log(a.mm)) / (Math.log(b.mm) - Math.log(a.mm));
        return a.pass + t * (b.pass - a.pass);
      }
    }
    return pts.length && mm > pts[pts.length - 1].mm ? 100 : NaN;
  }
  RM.passaEm = passaEm;

  // tipo: "alto" (DNER-EM 260/94) ou "aciaria" (DNER-EM 262/94)
  function escoria(tipo, extra) {
    var aco = tipo === "aciaria";
    var S = aco ? { abs: "5.1 a", me: "5.1 b", mu: "5.1 c", la: "5.1 d", dur: "5.1 e", gr: "4.3", lote: "6.1" } : { abs: "5.1 a", me: "5.1 b", mu: "5.1 c", la: "5.1 d", dur: "5.1 e", gr: "4.2", lote: "6.1" };
    var LIM = aco ? { abs: [1, 2], me: [3, 3.5], mu: [1.5, 1.7], la: 25, lote: 2000 } : { abs: [1, 3], me: [2, 3], mu: [1.10, 1.24], la: 35, lote: 5000 };
    var ng = function (P) { return aco || (P.tipo || "ng") === "ng"; };
    var G = "Condições específicas (" + (aco ? "5.1" : "5.1 — escória não granulada") + ")", GG = "Granulometria (" + S.gr + ")";
    var ens = [];
    if (aco) ens.push({ id: "exp", grupo: "Condições gerais (4)", r: "Potencial de expansão (PTM 130 adaptado)", metodo: "DNIT 113/2009-ME", secao: "4.1", u: "%", casas: 2,
      lim: function (P) { var v = FE.num(P.expMax); return { max: ok(v) ? v : 3, casas: ok(v) ? 1 : 0 }; } });
    ens = ens.concat([
      { id: "abs", grupo: G, r: "Absorção de água", metodo: "NBR 9937 (DNIT 413-ME)", secao: S.abs, u: "%", casas: 2, se: ng, lim: { min: LIM.abs[0], max: LIM.abs[1], casas: 0 } },
      { id: "me", grupo: G, r: "Massa específica", metodo: "NBR 9937 (DNIT 413-ME)", secao: S.me, u: "g/cm³", casas: 3, se: ng, lim: { min: LIM.me[0], max: LIM.me[1], casas: aco ? 1 : 0 } },
      { id: "mu", grupo: G, r: "Massa unitária no estado solto", metodo: "NBR 7251 (DNIT 437-ME)", secao: S.mu, u: "kg/dm³", casas: 3, se: ng, lim: { min: LIM.mu[0], max: LIM.mu[1], casas: aco ? 1 : 2 } },
      { id: "la", grupo: G, r: "Desgaste por abrasão Los Angeles", metodo: "NBR 6465 (DNIT 451-ME)", secao: S.la, u: "%", casas: 0, se: ng, lim: { max: LIM.la, casas: 0 } },
      { id: "dur", grupo: G, r: "Durabilidade ao sulfato de sódio — 5 ciclos (perda)", metodo: "ASTM C 88 (DNIT 446-ME)", secao: S.dur, u: "%", casas: 1, se: ng, lim: { min: 0, max: 5, casas: 0 } },
      { id: "p12", grupo: GG, r: "Passando na peneira de 12,7 mm (1/2\")", metodo: "DNIT 412-ME", secao: S.gr, u: "%", casas: 1, se: ng,
        lim: { texto: "≈ 40 % (40 % até 1/2\" e 60 % de 1/2\" a 2\")", info: true } },
      { id: "p50", grupo: GG, r: "Passando na peneira de 50,8 mm (2\")", metodo: "DNIT 412-ME", secao: S.gr, u: "%", casas: 1, se: ng, lim: { min: 100, casas: 0, texto: "100 % (até 2\")" }, falha: "ressalva" },
    ]);
    if (!aco) ens.push(
      { id: "p48", grupo: "Escória granulada (3.3, 4.4, 5.2)", r: "Passando na peneira de 4,8 mm", metodo: "DNIT 412-ME", secao: "3.3", u: "%", casas: 1,
        se: function (P) { return P.tipo === "gr"; }, lim: { min: 95, casas: 0 }, falha: "ressalva" });
    var insp = aco ? [
      { k: "iImp", r: "Isenta de impurezas orgânicas, de escória de alto-forno, solos e outros contaminantes", secao: "4.2", exigido: "isenta" },
      { k: "iProj", r: "Granulometria de projeto atendida", secao: "4.3", exigido: "conforme o projeto" },
      { k: "iPart", r: "Especificações particulares do projeto atendidas", secao: "7.1", exigido: "conforme o projeto", opcional: true },
      { k: "iNota", r: "Nota de entrega (volume, tipo, granulometria) e rastreabilidade", secao: "3.9 / 3.10", exigido: "documentação completa", falha: "ressalva", opcional: true },
    ] : [
      { k: "iForma", r: "Escória resfriada ao ar (não granulada): fragmentos angulares, uniformes, isentos de grãos lamelares e impurezas", secao: "4.1", exigido: "atende",
        se: function (P) { return (P.tipo || "ng") === "ng"; } },
      { k: "iProj", r: "Granulometria de projeto atendida", secao: "4.2 / 4.3", exigido: "conforme o projeto / estudo de laboratório" },
      { k: "iMiudo", r: "Escória granulada ensaiada e aprovada pelas normas de agregado miúdo", secao: "4.4 / 5.2", exigido: "atende às exigências de agregado miúdo",
        se: function (P) { return P.tipo === "gr"; } },
      { k: "iNota", r: "Nota de entrega (volume, tipo, granulometria) e rastreabilidade", secao: "3.12 / 3.13", exigido: "documentação completa", falha: "ressalva", opcional: true },
    ];
    var imp = [
      { k: "impDens", r: "Importar absorção e massa específica (DNIT 413-ME)", de: "dnit-413-2021-me", ensaios: ["abs", "me"],
        valores: function (e, P) { var r = e.resultados; return { abs: r.abs, me: P.meTipo === "aparente" ? r.mesb : r.mesa }; } },
      { k: "impMU", r: "Importar massa unitária no estado solto (DNIT 437-ME)", de: "dnit-437-2022-me", ensaios: ["mu"],
        valores: function (e) { var s = e.resultados.solto || {}; return { mu: ok(s.MU) ? s.MU / 1000 : NaN }; } },
      { k: "impLA", r: "Importar abrasão Los Angeles (DNIT 451-ME)", de: "dnit-451-2024-me", ensaios: ["la"],
        valores: function (e) { return { la: e.resultados.A }; }, rot: function (e) { return "graduação " + (e.resultados.g || "?"); } },
      { k: "impGr", r: "Importar granulometria (DNIT 412-ME)", de: "dnit-412-2025-me", ensaios: ["p12", "p50", "p48"],
        valores: function (e, P) {
          var m = e.resultados.media;
          return P.tipo === "gr" && !aco ? { p48: passaEm(m, 4.8) } : { p12: passaEm(m, 12.7), p50: passaEm(m, 50.8) };
        } },
    ];
    if (aco) imp.unshift({ k: "impExp", r: "Importar potencial de expansão (DNIT 113-ME)", de: "dnit-113-2009-me", ensaios: ["exp"],
      valores: function (e) { return { exp: e.resultados.media }; } });
    var params = [
      { k: "camada", r: "Camada de emprego", tipo: "select", opcoes: [["base", "Base"], ["subbase", "Sub-base"], ["rev", "Revestimento"]] },
      { k: "meTipo", r: "Massa específica comparada (NBR 9937)", tipo: "select", opcoes: [["real", "Massa específica (real, MEsa — exclui poros permeáveis)"], ["aparente", "Massa específica aparente (MEsb)"]],
        dica: "usada na importação da DNIT 413-ME" },
    ];
    if (aco) params.push({ k: "expMax", r: "Expansão máxima da especificação particular (%) — opcional", ph: "3", dica: "4.1: máx. 3 % ou o valor do projeto" });
    else params.unshift({ k: "tipo", r: "Tipo de escória de alto-forno", tipo: "select", recarrega: true, opcoes: [["ng", "Não granulada (resfriada ao ar, britada) — 5.1"], ["gr", "Granulada (resfriamento rápido) — 4.4 e 5.2"]] });
    return Object.assign({
      tabela: aco ? "DNER-EM 262/94" : "DNER-EM 260/94",
      padrao: { tipo: "ng", camada: "base", meTipo: "real", expMax: "" },
      params: params,
      lote: { unid: "t", rotuloFornecedor: "Usina siderúrgica / fornecedor", rotuloQtd: "Quantidade do lote de estocagem (t)" },
      rotuloDet: "Amostra",
      ensaios: ens,
      inspecao: insp,
      importar: imp,
      extra: function (ctx) {
        var P = ctx.P, q = FE.num(P.quantidade), V = ctx.V;
        var l = ctx.A.linha({ id: "lote", grupo: "Amostragem (6)", criterio: "Lote de amostragem" + (aco ? "" : " (escória não granulada)"), secao: S.lote, unid: "t", casas: 0,
          n: ok(q) ? 1 : 0, exigido: "≤ " + fmt(LIM.lote, 0) + " t" });
        if (ok(q)) {
          l.resultado = fmt(q, 0) + " t";
          if (q > LIM.lote + 1e-9 && (aco || (P.tipo || "ng") === "ng")) ctx.A.marcar(l, "pendente", "lote acima de " + fmt(LIM.lote, 0) + " t: forme " + Math.ceil(q / LIM.lote - 1e-9) + " lotes de amostragem (" + S.lote + ")");
        } else { l.situacao = "nao_exigido"; l.motivo = "quantidade não informada"; }
        ctx.linhas.push(l);
        if (ok(V.p12) && Math.abs(V.p12 - 40) > 5) ctx.avisos.push("Granulometria (" + S.gr + "): " + fmt(V.p12, 1) + " % passando em 1/2\" — a EM pede a proporção de 40 % até 1/2\" e 60 % de 1/2\" a 2\" (sem tolerância explícita); confira com a granulometria de projeto.");
        if (!aco && P.camada === "rev" && (P.tipo || "ng") === "ng") ctx.avisos.push("Revestimento (4.3): a granulometria da escória não granulada deve resultar de estudo de laboratório para as características do projeto.");
        if (aco && P.camada === "base") ctx.avisos.push("5.1 d: a EM fixa o Los Angeles ≤ 25 % \"para sub-base e revestimento\" e não cita a base; o limite foi aplicado também à base.");
      },
    }, extra || {});
  }
  RM.escoria = escoria;

  var ID = "dner-em-260-94";
  FE.FICHAS[ID] = RM.criar(escoria("alto", {
    titulo: "Aceitação de escória de alto-forno para pavimentação",
    resumo: "Escória de alto-forno não granulada (britada): absorção, massa específica, massa unitária, Los Angeles, durabilidade ao sulfato de sódio e granulometria (4.2, 5.1); escória granulada: exigências de agregado miúdo (4.4, 5.2); lote de amostragem ≤ 5 000 t (6.1); parecer (7).",
    notas: "DNER-EM 260/94, 5.1 (escória não granulada): absorção 1 % a 3 % e massa específica 2 a 3 g/cm³ (NBR 9937), massa unitária 1,10 a 1,24 kg/dm³ (NBR 7251), Los Angeles ≤ 35 % para sub-base, base " +
      "e revestimento (NBR 6465), durabilidade ao sulfato de sódio, 5 ciclos, 0 a 5 % (ASTM C 88). 4.2: proporção de 40 % até 1/2\" e 60 % de 1/2\" a 2\", atendendo à granulometria do projeto. " +
      "Escória granulada (3.3, 4.4, 5.2): 95 % passando em 4,8 mm e exigências de agregado miúdo. Resultados = média das amostras; os ensaios da ABNT citados podem ser importados das fichas DNIT " +
      "413-ME (massa específica e absorção), 437-ME (massa unitária, kg/m³ → kg/dm³), 451-ME (Los Angeles) e 412-ME (granulometria, % passando interpolado em 12,7 e 50,8 mm). Aceitação (7): " +
      "atendidos os requisitos, aceita; caso contrário, rejeitada.",
    exemplos: [
      { nome: "Escória britada para base — lote aceito (Los Angeles importado da DNIT 451-ME)", dados: function () {
        var d = { ident: { registro: "REC-EAF-01", data: "2026-04-14", obra: "Obra A", origem: "Usina A", camada: "Base" },
          params: { tipo: "ng", camada: "base", meTipo: "real", fornecedor: "Usina A — pátio 2", quantidade: "3200", dataReceb: "14/04/2026", dataAmostra: "14/04/2026",
            iForma: "S", iProj: "S", iNota: "S" },
          det: [{ abs: "1,85", me: "2,640", mu: "1,180", dur: "2,4", p12: "41,5", p50: "100" }, { abs: "1,92", me: "2,655", mu: "1,195", dur: "2,8", p12: "39,2", p50: "100" }] };
        RM.importarEx(ID, d, "impLA", [["dnit-451-2024-me", 1]]);
        return d;
      } },
      { nome: "Escória britada para revestimento — rejeitada (absorção, massa unitária, Los Angeles, sulfato)", dados: function () {
        return { ident: { registro: "REC-EAF-02", data: "2026-05-20", obra: "Obra B", origem: "Usina B", camada: "Revestimento" },
          params: { tipo: "ng", camada: "rev", meTipo: "real", fornecedor: "Usina B", quantidade: "5600", dataReceb: "20/05/2026", dataAmostra: "20/05/2026",
            iForma: "N", iProj: "S" },
          det: [{ abs: "3,40", me: "2,580", mu: "1,062", la: "38", dur: "6,9", p12: "31,0", p50: "96,5" }, { abs: "3,62", me: "2,560", mu: "1,048", la: "40", dur: "7,3", p12: "33,4", p50: "97,8" }] };
      } },
    ],
  }));
})();
