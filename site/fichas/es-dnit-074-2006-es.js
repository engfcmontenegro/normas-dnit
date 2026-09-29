/*
 * Ficha de ES: DNIT 074/2006-ES — Tratamento ambiental de taludes e encostas por intermédio de dispositivos de controle
 * de processos erosivos (bambu / capim-limão / vetiver, biomantas, retentores de sedimentos, bacias de siltagem) —
 * aceitação (A.fichaSimples via FE.aceitacaoG11, definido em es-dnit-071-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  var mud = function (P) { return G.sim(P, "mudasbv"); };
  var man = function (P) { return G.sim(P, "biomanta"); };
  var ret = function (P) { return G.sim(P, "retentor"); };
  var bac = function (P) { return G.sim(P, "bacia"); };
  var C = [
    { id: "sementes", texto: "Sementes: pureza e poder germinativo médio do lote declarados e testados por plantio experimental em viveiro", secao: "5.1.2",
      grupo: "Materiais", tipo: "sim_nao", exigido: "por lote ou partida" },
    G.calcario("5.1.1.3"),
    { id: "mantas", texto: "Mantas / telas vegetais e grampos conforme manuais técnicos do fabricante (qualidade, resistência)", secao: "5.1.3", grupo: "Materiais",
      tipo: "sim_nao", se: function (P) { return man(P) || ret(P); }, naoAplicaPor: "sem mantas ou retentores" },
    { id: "matriz", texto: "Mudas de bambu, capim-limão ou vetiver de touceiras com mais de 3 anos", secao: "5.4.1 a", grupo: "Mudas", tipo: "sim_nao", se: mud,
      naoAplicaPor: "sem plantio de bambu/capins" },
    { id: "covabv", texto: "Covas ≈ 30 × 30 × 30 cm em curva de nível, adubadas (100 g NPK 10-10-10, 50 g de calcário, esterco curtido ≈ 50 % do volume)",
      secao: "5.4.1 a", grupo: "Mudas", tipo: "sim_nao", se: mud, naoAplicaPor: "sem plantio de bambu/capins" },
    { id: "espbv", texto: "Espaçamento entre mudas na linha em curva de nível", secao: "5.4.1", grupo: "Mudas", tipo: "valor", unid: "m", casas: 2, max: 1.0,
      falha: "ressalva", se: mud, naoAplicaPor: "sem plantio de bambu/capins", exigido: "≤ 1,0 m (de metro em metro ou menor)", freq: G.lote() },
    { id: "irrbv", texto: "Irrigação ≥ 1 vez por semana, ≈ 1 L por muda, até crescimento ≈ 20 cm; controle da germinação e crescimento", secao: "5.4.1 c, d",
      grupo: "Mudas", tipo: "sim_nao", falha: "ressalva", se: mud, naoAplicaPor: "sem plantio de bambu/capins" },
    { id: "regul", texto: "Regularização do talude (sulcos eliminados, vazios preenchidos, sedimentos ancorados) e microcoveamento a cada 10 cm, 5 cm de profundidade",
      secao: "5.4.2 e, f", grupo: "Biomantas", tipo: "sim_nao", se: man, naoAplicaPor: "sem biomantas" },
    { id: "ancora", texto: "Ancoragem no topo: valeta 10 × 10 cm, 20 cm de manta além da valeta dobrados e grampeados; bobinas desenroladas de montante para jusante",
      secao: "5.4.2 g", grupo: "Biomantas", tipo: "sim_nao", se: man, naoAplicaPor: "sem biomantas" },
    { id: "gtopo", texto: "Espaçamento dos grampos na ancoragem do topo", secao: "5.4.2 g", grupo: "Biomantas", tipo: "valor", unid: "cm", casas: 0, max: 40,
      se: man, naoAplicaPor: "sem biomantas", exigido: "grampos a cada 40 cm, no máximo (a ES escreve \"espaçamento mínimo\")", freq: G.lote() },
    { id: "trlat", texto: "Trespasse lateral das biomantas", secao: "5.4.2 g", grupo: "Biomantas", tipo: "valor", unid: "cm", casas: 0, min: 3, max: 5, falha: "ressalva",
      se: man, naoAplicaPor: "sem biomantas", freq: G.lote() },
    { id: "trlong", texto: "Trespasse longitudinal das biomantas", secao: "5.4.2 g", grupo: "Biomantas", tipo: "valor", unid: "cm", casas: 0, min: 5,
      se: man, naoAplicaPor: "sem biomantas", freq: G.lote() },
    { id: "gtresp", texto: "Espaçamento dos grampos nos trespasses", secao: "5.4.2 g", grupo: "Biomantas", tipo: "valor", unid: "cm", casas: 0, max: 30,
      se: man, naoAplicaPor: "sem biomantas", exigido: "a cada 30 cm, no máximo (a ES escreve \"no mínimo de 30 cm\")", freq: G.lote() },
    { id: "retent", texto: "Retentores de sedimentos em curva de nível, valeta com 1/3 da altura do rolo, grampos até o solo coeso", secao: "5.4.2 i",
      grupo: "Retentores e bacias", tipo: "sim_nao", se: ret, naoAplicaPor: "sem retentores" },
    { id: "vbac", texto: "Volume de acumulação da bacia de siltagem", secao: "5.4.2 j", grupo: "Retentores e bacias", tipo: "valor", unid: "m³", casas: 1,
      min: function (P) { var a = num(P.baciaA), h = num(P.baciaH); return ok(a) && ok(h) ? 0.4 * a * h : NaN; }, falha: "ressalva",
      se: bac, naoAplicaPor: "sem bacia de siltagem", exigido: "V ≥ 0,4 × A × h (primeira estimativa)", freq: { por: "contagem", qtd: "nbacias", a_cada: 1, regra: "1 por bacia" } },
    { id: "hbac", texto: "Altura do dique da bacia de siltagem", secao: "5.4.2 j", grupo: "Retentores e bacias", tipo: "valor", unid: "m", casas: 2, max: 2.0,
      se: bac, naoAplicaPor: "sem bacia de siltagem", exigido: "≤ 2,0 m (usual ≤ 1,0 m)", freq: { por: "contagem", qtd: "nbacias", a_cada: 1, regra: "1 por bacia" } },
    { id: "cbac", texto: "Largura da crista (plataforma de topo) do dique", secao: "5.4.2 j", grupo: "Retentores e bacias", tipo: "valor", unid: "m", casas: 2, min: 1.0,
      se: bac, naoAplicaPor: "sem bacia de siltagem", freq: { por: "contagem", qtd: "nbacias", a_cada: 1, regra: "1 por bacia" } },
    { id: "tbac", texto: "Inclinação dos taludes do dique (H/V)", secao: "5.4.2 j", grupo: "Retentores e bacias", tipo: "valor", unid: "H:1V", casas: 1, min: 2.0,
      se: bac, naoAplicaPor: "sem bacia de siltagem", exigido: "2H:1V ou mais abatido", freq: { por: "contagem", qtd: "nbacias", a_cada: 1, regra: "1 por bacia" } },
    { id: "barreira", texto: "Barreira de siltagem de manta: até 10 m do pé do talude, em curva de nível, estacas a cada 2,0 m; vertedor protegido; fora do leito de cursos d'água",
      secao: "5.4.2 j", grupo: "Retentores e bacias", tipo: "sim_nao", se: bac, naoAplicaPor: "sem bacia de siltagem" },
    { id: "acab", texto: "Controle de acabamento e inspeções especificados no projeto ambiental", secao: "6", grupo: "Produto", tipo: "sim_nao",
      exigido: "conforme projeto ambiental" },
    G.cobertura("7"),
  ];

  A.fichaSimples({
    id: "dnit-074-2006-es",
    titulo: "Dispositivos de controle de erosão em taludes e encostas — aceitação",
    resumo: "Verificações da DNIT 074/2006-ES: sementes, calcário, plantio de bambu / capim-limão / vetiver, biomantas (ancoragem, trespasses, grampos), retentores de sedimentos, bacias de siltagem (V ≥ 0,4·A·h, altura, crista, taludes), acabamento conforme o projeto e cobertura vegetal completa (2ª etapa).",
    lote: false,
    params: [G.paramArea, G.ETAPA,
      { k: "mudasbv", r: "Plantio de bambu, capim-limão ou vetiver (5.4.1)?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "biomanta", r: "Biomantas / telas vegetais (5.4.2 d a h)?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "retentor", r: "Retentores de sedimentos (5.4.2 i)?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "bacia", r: "Bacias de siltagem (5.4.2 j)?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "nbacias", r: "Nº de bacias de siltagem", se: bac },
      { k: "baciaA", r: "Área de contribuição A (m²)", se: bac }, { k: "baciaH", r: "Altura máxima h (m)", se: bac }],
    padrao: { etapa: "1", mudasbv: "nao", biomanta: "sim", retentor: "nao", bacia: "nao", nbacias: "1" },
    criterios: C,
    extra: function (ctx) {
      var h = ctx.item.hbac;
      if (h && h.n) h.pontos.forEach(function (p) {
        if (ok(p.v) && p.v > 1.0 && p.v <= 2.0) ctx.avisos.push("Bacia de siltagem: dique de " + fmt(p.v, 2) + " m — a altura usual não passa de 1,00 m; maior só nos pontos mais baixos (5.4.2 j).");
      });
    },
    notas: "Critérios da DNIT 074/2006-ES: a seção 6 remete o controle de acabamento e as inspeções ao projeto ambiental; os valores verificados vêm de 5.1 e 5.4. Grampos: a ES escreve \"espaçamento mínimo ... a cada 40 cm\" e \"espaçados de no mínimo de 30 cm\"; adotado como espaçamento MÁXIMO (fixação mais rigorosa). Volume da bacia (0,4·A·h, \"primeira estimativa\"), trespasse lateral e espaçamento das mudas: ressalva. Calcário conforme DNIT 071/2006-ES (≤ 1,5 t/ha).",
    exemplos: [
      { nome: "Talude de aterro com biomanta — 2ª etapa (aceito)", dados: function () {
        var P = { area: "2400", etapa: "2", mudasbv: "nao", biomanta: "sim", retentor: "nao", bacia: "nao", nbacias: "1" };
        return { ident: { registro: "AMB-074-01", data: "2026-02-14", obra: "Obra A", trecho: "BR-000 — km 18", local: "Talude de aterro LD, est. 300 a 320" },
          params: P, verificacoes: G.verif(C, P),
          calcario: G.vals([["Talude", "1,10"]]),
          gtopo: G.vals([["Crista, trecho 1", "40"], ["Crista, trecho 2", "35"]]),
          trlat: G.vals([["Emenda 1", "4"], ["Emenda 2", "5"]]), trlong: G.vals([["Emenda A", "8"]]),
          gtresp: G.vals([["Emenda 1", "30"], ["Emenda A", "25"]]),
          cobertura: G.vals([["Inspeção final", "100"]]) };
      } },
      { nome: "Encosta com vetiver e bacia de siltagem — 1ª etapa (rejeitada)", dados: function () {
        var P = { area: "5000", etapa: "1", mudasbv: "sim", biomanta: "nao", retentor: "nao", bacia: "sim", nbacias: "1", baciaA: "8000", baciaH: "1,0" };
        return { ident: { registro: "AMB-074-02", data: "2026-09-02", obra: "Obra C", trecho: "BR-000 — km 77", local: "Encosta a montante, lado esquerdo" },
          params: P, verificacoes: G.verif(C, P, { matriz: { atende: "N", obs: "mudas de touceiras com 1 ano" } }),
          calcario: G.vals([["Encosta", "1,50"]]),
          espbv: G.vals([["Linha 1", "1,00"], ["Linha 3", "1,30"]]),
          vbac: G.vals([["Bacia 1", "2900"]]), hbac: G.vals([["Bacia 1", "1,40"]]),
          cbac: G.vals([["Bacia 1", "0,80"]]), tbac: G.vals([["Bacia 1", "2,0"]]) };
      } },
    ],
  });
})();
