/*
 * Ficha: DNER-PRO 229/94 — Manutenção de sistemas medidores de irregularidade (Integrador IPR/USP e Maysmeter).
 * Ficha de registro/checklist (a PRO não tem cálculo): confere a manutenção preventiva (5), a de campo (6), o conjunto
 * de componentes para reposição (8.1), o estojo de ferramentas (4.6 / 8.2), os pneus (sulco mínimo de 3 mm, 6.1.1),
 * a lavagem semanal (6.1.4) e a análise de defeitos bienal (5.2.3); registra as ocorrências (componentes trocados).
 * Toda troca de pneu, mola, amortecedor ou elemento eletrônico é "modificação no sistema" e exige nova calibração
 * pela DNER-PRO 164/94 (3.15 e 6.4) — a ficha avisa.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-pro-229-94";
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  var ESTOJO = [
    ["fMult", "a", "Multímetro 20 kΩ/Vcc"], ["fYale", "b", "Jogo de chaves Yale de 1 a 10 mm"], ["fFenda", "c", "Chaves de fenda 2×100, 3×150, 5×150 e 7,5×250 mm"],
    ["fSolda", "d", "Ferro de solda de 30 W"], ["fFio", "e", "10 g de solda com fluxo, em carretel"], ["fBico", "f", "Alicate de bico"], ["fCorte", "g", "Alicate de corte"],
    ["fPhil", "h", "Chaves Phillips 2×100, 3×150, 5×150 e 7,5×250 mm"], ["fPaq", "i", "Paquímetro"], ["fCola", "j / 8.2", "Adesivo tipo epóxi (araldite) de cura rápida"],
  ];
  // 8.1 — conjunto mínimo de componentes para reposição
  var KIT = {
    ipr: [["kCabo", "Cabo ou haste", 1, "8.1.1 a"], ["kPar", "Parafusos de montagem", 6, "8.1.1 b"], ["kIma", "Ímãs", 8, "8.1.1 c"]],
    mays: [["kCabo", "Cabos", 2, "8.1.2 a"], ["kPar", "Parafusos de montagem", 6, "8.1.2 b"], ["kLamp", "Lâmpada do transmissor", 1, "8.1.2 c"], ["kIma", "Ímãs", 8, "8.1.2 d"]],
  };
  function dias(a, b) { return a && b ? (new Date(b) - new Date(a)) / 864e5 : NaN; }
  function linhaSN(id, grupo, crit, secao, v, exig, falha) {
    var l = A.linha({ id: id, grupo: grupo, criterio: crit, secao: secao, exigido: exig, resultado: v === "sim" ? "sim" : v === "nao" ? "não" : "—", n: v ? 1 : 0 });
    if (v === "nao") A.marcar(l, falha || "nao_conforme", "não atende");
    else if (v !== "sim") A.marcar(l, "pendente", "não informado");
    return l;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [], hoje = (d.ident || {}).data;
    var sis = P.sistema || "ipr";
    var G1 = "Manutenção preventiva (5)", G2 = "Manutenção no campo (6)", G3 = "Componentes para reposição e ferramentas (8 / 4.6)";
    linhas.push(linhaSN("v511", G1, "Veículo: manutenção preventiva conforme a montadora, em oficina autorizada", "5.1.1", P.vOficina, "conforme 5.1.1"));
    linhas.push(linhaSN("v512", G1, "Veículo: só peças de reposição legítimas", "5.1.2", P.vPecas, "peças legítimas (4.8)"));
    linhas.push(linhaSN("m521", G1, "Medidores: manutenção preventiva antes da viagem", "5.2.1", P.mAntes, "antes de cada viagem"));
    linhas.push(linhaSN("m522", G1, "Componentes com desgaste visível ou defeito substituídos por componente igual", "5.2.2", P.mIguais, "componente igual (4.9)"));
    var dA = dias(P.analise, hoje);
    var la = A.linha({ id: "m523", grupo: G1, criterio: "Análise de defeitos dos componentes (de 2 em 2 anos)", secao: "5.2.3", exigido: "≤ 2 anos desde a última",
      resultado: ok(dA) ? fmt(dA / 365.25, 1) + " ano(s) — última em " + A.dataBR(P.analise) : "—", n: ok(dA) ? 1 : 0 });
    if (!P.analise) A.marcar(la, "pendente", "informe a data da última análise de defeitos");
    else if (!hoje) A.marcar(la, "pendente", "informe a data da inspeção (identificação)");
    else if (dA > 2 * 365.25 + 1) A.marcar(la, "nao_conforme", "análise de defeitos vencida");
    linhas.push(la);

    // pneus (6.1.1, 6.1.3)
    var pn = (d.pn || []).map(function (c, i) { return { pos: c.pos || "pneu " + (i + 1), s: num(c.sulco) }; }).filter(function (o) { return ok(o.s); });
    var lp = A.linha({ id: "sulco", grupo: G2, criterio: "Profundidade do sulco dos pneus", secao: "6.1.1", exigido: "≥ 3 mm", n: pn.length,
      resultado: pn.length ? "mín. " + fmt(Math.min.apply(null, pn.map(function (o) { return o.s; })), 1) + " mm (" + pn.length + " pneus)" : "—" });
    if (!pn.length) A.marcar(lp, "sem_dados", "sem medições de sulco");
    var gastos = pn.filter(function (o) { return o.s < 3 - 1e-9; });
    if (gastos.length) A.marcar(lp, "nao_conforme", "trocar: " + gastos.map(function (o) { return o.pos + " (" + fmt(o.s, 1) + " mm)"; }).join(", ") + " — e recalibrar (DNER-PRO 164/94, 6.4)");
    if (pn.length && pn.length < 5) A.marcar(lp, "ressalva", "meça as 4 rodas e o estepe");
    linhas.push(lp);
    linhas.push(linhaSN("pn613", G2, "Pneus: rodagem da montadora, balanceados e alinhados, circunferência praticamente circular; sem câmara remendada", "6.1.3", P.pneus, "conforme 6.1.3"));
    var dL = dias(P.lavagem, hoje);
    var ll = A.linha({ id: "lav", grupo: G2, criterio: "Lavagem do veículo (só água) — de 7 em 7 dias e quando houver lama nas rodas", secao: "6.1.4", exigido: "≤ 7 dias",
      resultado: ok(dL) ? fmt(dL, 0) + " dia(s) desde a última" : "—", n: ok(dL) ? 1 : 0 });
    if (!P.lavagem || !hoje) A.marcar(ll, "pendente", "informe a data da última lavagem e a da inspeção");
    else if (dL > 7) A.marcar(ll, "ressalva", "lavagem com mais de 7 dias");
    if (P.lama === "sim") A.marcar(ll, "ressalva", "lama fixada nas rodas: lavar já");
    linhas.push(ll);
    linhas.push(linhaSN("op623", G2, "Manutenção de campo dos medidores só por operador treinado em laboratório habilitado, com o estojo", "6.2.3", P.operador, "operador treinado"));

    // ocorrências
    var oc = (d.oc || []).filter(function (c) { return c.comp; });
    var lo = A.linha({ id: "oc", grupo: G2, criterio: "Componentes substituídos: por componente igual, do conjunto de reposição; o defeituoso remetido ao laboratório de instrumentação", secao: "6.2.2 / 6.2.4 / 6.1.3",
      exigido: "igual (4.9) ou legítima (4.8); remetido ao laboratório", resultado: oc.length ? oc.length + " ocorrência(s)" : "nenhuma", n: oc.length, situacao: oc.length ? "conforme" : "informativo" });
    oc.forEach(function (c) {
      if (c.igual === "N") A.marcar(lo, "nao_conforme", c.comp + ": peça não igual/legítima");
      if (c.tipo !== "veiculo" && c.remetido === "N") A.marcar(lo, "ressalva", c.comp + ": componente não remetido ao laboratório (6.2.4)");
    });
    linhas.push(lo);
    if (oc.some(function (c) { return c.recal !== "N"; })) avisos.push("Houve modificação no sistema (troca de pneu, mola, amortecedor, rodas ou eletrônica): o sistema deve ser calibrado de novo — DNER-PRO 164/94, 3.15 e 6.4.");

    // conjunto de reposição (8.1)
    if (sis !== "outro") {
      KIT[sis].forEach(function (k) {
        var q = num(P[k[0]]);
        var l = A.linha({ id: k[0], grupo: G3, criterio: "Conjunto de reposição: " + k[1], secao: k[3], exigido: "≥ " + k[2], resultado: ok(q) ? fmt(q, 0) : "—", n: ok(q) ? 1 : 0 });
        if (!ok(q)) A.marcar(l, "pendente", "não informado");
        else if (q < k[2]) A.marcar(l, "nao_conforme", "abaixo do mínimo de " + k[2]);
        linhas.push(l);
      });
    } else avisos.push("Outros sistemas: componentes de reposição conforme o laboratório de instrumentação (6.2.1 c).");
    var falt = ESTOJO.filter(function (e) { return P[e[0]] === "nao"; }), pend = ESTOJO.filter(function (e) { return P[e[0]] !== "sim" && P[e[0]] !== "nao"; });
    var le = A.linha({ id: "estojo", grupo: G3, criterio: "Estojo de ferramentas completo", secao: "4.6 / 8.2", exigido: "10 itens (a a j)", n: ESTOJO.length - pend.length,
      resultado: (ESTOJO.length - falt.length - pend.length) + " de " + ESTOJO.length + " itens" });
    if (falt.length) A.marcar(le, "nao_conforme", "faltam: " + falt.map(function (e) { return e[1] + ") " + e[2]; }).join("; "));
    if (pend.length) A.marcar(le, "pendente", "não verificados: " + pend.map(function (e) { return e[1]; }).join(", "));
    linhas.push(le);

    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "SISTEMA EM CONDIÇÕES DE OPERAR", texto: "Manutenção conforme a DNER-PRO 229/94." },
      RESSALVA: { titulo: "SISTEMA EM CONDIÇÕES DE OPERAR, COM RESSALVA", texto: "Nada impeditivo; há pontos a regularizar." },
      PENDENTE: { titulo: "INSPEÇÃO INCOMPLETA", texto: "Há itens não verificados." },
      REJEITADO: { titulo: "SISTEMA NÃO LIBERADO", texto: "Há exigência de manutenção não atendida: regularizar antes do levantamento." } } });
    return { tab: {}, resultados: { linhas: linhas, parecer: par, nOc: oc.length, sistema: sis }, avisos: avisos };
  }

  FE.FICHAS[ID] = {
    titulo: "Manutenção de medidor de irregularidade (IPR/USP e Maysmeter)",
    lote: true,
    resumo: "Registro e verificação da manutenção preventiva (5) e de campo (6): sulco dos pneus ≥ 3 mm, lavagem semanal, análise de defeitos bienal, componentes iguais/legítimos, conjunto mínimo de reposição (8.1) e estojo de ferramentas (4.6).",
    rotuloImportar: function (r) { return r.parecer ? r.parecer.titulo : "—"; },
    blocos: [],
    params: [
      { k: "sistema", r: "Sistema medidor", tipo: "select", recarrega: true, opcoes: [["ipr", "Integrador IPR/USP"], ["mays", "Maysmeter"], ["outro", "Outro"]] },
      { k: "smi", r: "Identificação do sistema / veículo", ph: "ex.: SMI 01 — veículo A" },
      { k: "momento", r: "Momento da inspeção", tipo: "select", opcoes: [["antes", "Antes da viagem (5.2.1)"], ["campo", "No campo (6)"], ["retorno", "Retorno à base"]] },
      { k: "vOficina", r: "Veículo: manutenção preventiva em oficina autorizada (5.1.1)?", tipo: "select", opcoes: SN },
      { k: "vPecas", r: "Veículo: só peças legítimas (5.1.2)?", tipo: "select", opcoes: SN },
      { k: "mAntes", r: "Medidores: manutenção preventiva antes da viagem (5.2.1)?", tipo: "select", opcoes: SN },
      { k: "mIguais", r: "Componentes desgastados trocados por iguais (5.2.2)?", tipo: "select", opcoes: SN },
      { k: "analise", r: "Data da última análise de defeitos (5.2.3)", tipo: "date" },
      { k: "pneus", r: "Pneus conforme 6.1.3 (balanceados, alinhados, sem câmara remendada)?", tipo: "select", opcoes: SN },
      { k: "lavagem", r: "Data da última lavagem (6.1.4)", tipo: "date" },
      { k: "lama", r: "Lama fixada nas rodas agora?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "operador", r: "Operador treinado em laboratório habilitado (6.2.3)?", tipo: "select", opcoes: SN },
      { k: "kCabo", r: "Reposição: cabos / haste (8.1)", se: function (d) { return (d.params || {}).sistema !== "outro"; } },
      { k: "kPar", r: "Reposição: parafusos de montagem (8.1)", se: function (d) { return (d.params || {}).sistema !== "outro"; } },
      { k: "kLamp", r: "Reposição: lâmpada do transmissor (8.1.2 c)", se: function (d) { return (d.params || {}).sistema === "mays"; } },
      { k: "kIma", r: "Reposição: ímãs (8.1)", se: function (d) { return (d.params || {}).sistema !== "outro"; } },
    ].concat(ESTOJO.map(function (e) { return { k: e[0], r: "Estojo " + e[1] + ") " + e[2], tipo: "select", opcoes: SN }; })),
    padrao: { sistema: "ipr", momento: "antes", lama: "nao" },
    tabelas: function () {
      return [
        { chave: "pn", titulo: "Pneus — profundidade do sulco (6.1.1)", rotulo: "Pneu", iniciais: 5, min: 1, nomes: ["DE", "DD", "TE", "TD", "Estepe"],
          linhas: [{ k: "pos", r: "Posição", texto: true }, { k: "sulco", r: "Profundidade do sulco", u: "mm" }] },
        { chave: "oc", titulo: "Ocorrências — componentes substituídos (5.2.2 / 6.1.3 / 6.2)", rotulo: "Ocorrência", iniciais: 1, min: 1,
          dica: "Igual/legítima e remetido: S ou N; Recalibrar (PRO 164): S ou N",
          linhas: [{ k: "data", r: "Data", texto: true }, { k: "comp", r: "Componente", texto: true, ph: "ex.: amortecedor TD" }, { k: "tipo", r: "Parte (veiculo / medidor)", texto: true, ph: "medidor" },
            { k: "igual", r: "Peça igual (4.9) / legítima (4.8)? (S/N)", texto: true }, { k: "remetido", r: "Defeituoso remetido ao laboratório? (S/N)", texto: true },
            { k: "recal", r: "Modificou o sistema — recalibrar? (S/N)", texto: true }, { k: "obs", r: "Observação", texto: true }] },
      ];
    },
    calcular: calcular,
    resultadosHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer) + A.htmlCriterios(r.linhas, { estilo: "resultado" }); },
    relatorio: {
      notas: "DNER-PRO 229/94: manutenção preventiva do veículo pela montadora com peças legítimas e dos medidores antes de cada viagem, com análise de defeitos a cada 2 anos (5); no campo: sulco mínimo de 3 mm, pneus balanceados e alinhados, sem câmara remendada, lavagem com água a cada 7 dias, troca só por componente igual do conjunto de reposição, por operador treinado (6); conjunto mínimo de reposição (8.1) e estojo (4.6, 8.2). Modificações no sistema exigem recalibração (DNER-PRO 164/94, 6.4).",
      resultados: function (calc, d) { var r = calc.resultados; return [["Parecer", r.parecer.titulo], ["Sistema", ((d.params || {}).smi || "—") + " · " + (r.sistema === "mays" ? "Maysmeter" : r.sistema === "ipr" ? "Integrador IPR/USP" : "outro")], ["Ocorrências registradas", String(r.nOc)]]; },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Integrador IPR/USP — inspeção antes da viagem, tudo conforme", dados: function () {
        var P = { sistema: "ipr", smi: "SMI 01 — veículo A", momento: "antes", vOficina: "sim", vPecas: "sim", mAntes: "sim", mIguais: "sim", analise: "2025-03-10",
          pneus: "sim", lavagem: "2026-06-05", lama: "nao", operador: "sim", kCabo: "1", kPar: "6", kIma: "8" };
        ESTOJO.forEach(function (e) { P[e[0]] = "sim"; });
        return { ident: { registro: "MAN-IRR-01", data: "2026-06-08", obra: "Unidade A", responsavel: "Laboratório de instrumentação A" }, params: P,
          pn: [{ pos: "DE", sulco: "6,5" }, { pos: "DD", sulco: "6,3" }, { pos: "TE", sulco: "5,8" }, { pos: "TD", sulco: "5,9" }, { pos: "Estepe", sulco: "7,0" }], oc: [{}] };
      } },
      { nome: "Maysmeter — inspeção de campo: pneu gasto, kit incompleto, análise vencida", dados: function () {
        var P = { sistema: "mays", smi: "SMI 02 — veículo B", momento: "campo", vOficina: "sim", vPecas: "sim", mAntes: "sim", mIguais: "sim", analise: "2023-11-20",
          pneus: "sim", lavagem: "2026-06-01", lama: "sim", operador: "sim", kCabo: "1", kPar: "6", kLamp: "0", kIma: "8" };
        ESTOJO.forEach(function (e) { P[e[0]] = "sim"; });
        P.fPaq = "nao";
        return { ident: { registro: "MAN-IRR-02", data: "2026-06-12", obra: "Obra B", trecho: "BR-000 — km 40", responsavel: "Operador A" }, params: P,
          pn: [{ pos: "DE", sulco: "4,1" }, { pos: "DD", sulco: "3,9" }, { pos: "TE", sulco: "2,6" }, { pos: "TD", sulco: "3,4" }, { pos: "Estepe", sulco: "6,0" }],
          oc: [{ data: "11/06/2026", comp: "Cabo de aço do transmissor", tipo: "medidor", igual: "S", remetido: "N", recal: "S", obs: "rompido no km 38" }] };
      } },
    ],
  };
})();
