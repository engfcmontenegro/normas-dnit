/*
 * Ficha de ES: DNIT 075/2006-ES — Tratamento ambiental de taludes com solos inconsistentes (imprimação asfáltica,
 * argamassa, concreto projetado, tela metálica com vigamentos e contrafortes) — aceitação (A.fichaSimples via
 * FE.aceitacaoG11, definido em es-dnit-071-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, ok = FE.ok, fmt = FE.fmt, media = FE.media;

  var tec = function (t) { return function (P) { return P.tecnica === t; }; };
  var telaCP = function (P) { return P.tecnica === "concreto" && G.sim(P, "telacp"); };
  var C = [
    { id: "mat", texto: "Materiais conforme as especificações citadas: DNER-ES 342/97 (imprimação), 330/97 (argamassa e concreto), 331, 333, 335 e 337/97 (grampos, fôrmas, concreto armado, escoramento); telas e grampos conforme o fabricante",
      secao: "5.1", grupo: "Materiais", tipo: "sim_nao", exigido: "documentação de recebimento" },
    { id: "preparo", texto: "Preparo do talude: regularização, remoção de material solto e de resíduos vegetais/orgânicos, drenos horizontais (barbacãs) regularmente espaçados",
      secao: "5.4.1 a 5.4.3", grupo: "Execução", tipo: "sim_nao", se: function (P) { return P.tecnica !== "tela"; }, naoAplicaPor: "tela metálica (ver 5.4.4)" },
    { id: "imprim", texto: "Imprimação asfáltica aplicada por aspersor sobre superfície firme e isenta de material solto, com cobertura completa", secao: "5.4.1; 4.1",
      grupo: "Execução", tipo: "sim_nao", se: tec("imprimacao"), naoAplicaPor: "outra técnica" },
    { id: "chapisco", texto: "Argamassa: chapisco repetido uma ou duas vezes, até a perfeita cobertura da superfície", secao: "5.4.2", grupo: "Execução", tipo: "sim_nao",
      se: tec("argamassa"), naoAplicaPor: "outra técnica" },
    { id: "espcp", texto: "Espessura do concreto projetado", secao: "5.4.3", grupo: "Execução", tipo: "valor", unid: "cm", casas: 1, min: 3, max: 5, falha: "ressalva",
      se: tec("concreto"), naoAplicaPor: "outra técnica", exigido: "média de 3 a 5 cm", freq: { por: "lote", minimo: 3, regra: "mín. 3 por lote (adotado: a ES fixa a espessura média)" } },
    { id: "malha", texto: "Tela do concreto projetado: abertura da malha", secao: "5.4.3", grupo: "Execução", tipo: "valor", unid: "cm", casas: 1, min: 5, max: 20,
      se: telaCP, naoAplicaPor: "sem tela no concreto projetado", freq: G.lote() },
    { id: "fio", texto: "Tela do concreto projetado: diâmetro do fio", secao: "5.4.3", grupo: "Execução", tipo: "valor", unid: "mm", casas: 1, min: 2, max: 5,
      se: telaCP, naoAplicaPor: "sem tela no concreto projetado", freq: G.lote() },
    { id: "chumb", texto: "Comprimento dos chumbadores da tela", secao: "5.4.3", grupo: "Execução", tipo: "valor", unid: "cm", casas: 0, min: 20, max: 40, falha: "ressalva",
      se: telaCP, naoAplicaPor: "sem tela no concreto projetado", freq: G.lote() },
    { id: "blocos", texto: "Tela metálica: remoção prévia dos blocos instáveis; grampos nas fendas da rocha; valeta na crista ≈ 40 × 20 cm; telas desenroladas de montante para jusante, emoldurando os blocos",
      secao: "5.4.4", grupo: "Execução", tipo: "sim_nao", se: tec("tela"), naoAplicaPor: "outra técnica" },
    { id: "tlat", texto: "Transpasse lateral das telas", secao: "5.4.4", grupo: "Execução", tipo: "valor", unid: "cm", casas: 0, min: 20, max: 30, falha: "ressalva",
      se: tec("tela"), naoAplicaPor: "outra técnica", freq: G.lote() },
    { id: "tlong", texto: "Transpasse longitudinal das telas", secao: "5.4.4", grupo: "Execução", tipo: "valor", unid: "cm", casas: 0, min: 50,
      se: tec("tela"), naoAplicaPor: "outra técnica", freq: G.lote() },
    { id: "gramp", texto: "Espaçamento dos grampos / amarrilhos entre telas", secao: "5.4.4", grupo: "Execução", tipo: "valor", unid: "cm", casas: 0, max: 30,
      se: tec("tela"), naoAplicaPor: "outra técnica", exigido: "a cada 30 cm, no máximo (a ES escreve \"no mínimo de 30 cm\")", freq: G.lote() },
    { id: "contraf", texto: "Contrafortes / vigamentos de concreto armado conforme o projeto e as especificações de OAE", secao: "5.4.4; 5.1.4 d", grupo: "Execução",
      tipo: "sim_nao", se: tec("tela"), naoAplicaPor: "outra técnica" },
    { id: "acab", texto: "Controle de acabamento e inspeções especificados nos projetos de engenharia e ambiental (visão harmoniosa e segurança)", secao: "6",
      grupo: "Produto", tipo: "sim_nao", exigido: "conforme projetos" },
  ];

  A.fichaSimples({
    id: "dnit-075-2006-es",
    titulo: "Proteção de taludes com solos inconsistentes — aceitação",
    resumo: "Verificações da DNIT 075/2006-ES por técnica: imprimação asfáltica, argamassa, concreto projetado (espessura média 3 a 5 cm; tela 5–20 cm, fio 2–5 mm, chumbadores 20–40 cm) ou tela metálica (transpasses lateral 20–30 cm e longitudinal ≥ 50 cm, grampos a cada 30 cm); acabamento conforme os projetos.",
    lote: false,
    params: [G.paramArea,
      { k: "tecnica", r: "Técnica de proteção", tipo: "select", recarrega: true, opcoes: [["imprimacao", "Imprimação asfáltica (5.4.1)"], ["argamassa", "Argamassa (5.4.2)"],
        ["concreto", "Concreto projetado (5.4.3)"], ["tela", "Tela metálica, vigamentos e contrafortes (5.4.4)"]] },
      { k: "telacp", r: "Concreto projetado com tela metálica?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO, se: tec("concreto") }],
    padrao: { tecnica: "concreto", telacp: "sim" },
    criterios: C,
    extra: function (ctx) {
      var l = ctx.item.espcp;
      if (!l || !l.n || l.situacao === "nao_exigido") return;
      var m = media(l.pontos.map(function (p) { return p.v; }).filter(ok));
      l.resultado += " · média " + fmt(m, 1) + " cm";
      if (m < 3 - 1e-9 || m > 5 + 1e-9) A.marcar(l, "nao_conforme", "espessura média " + fmt(m, 1) + " cm fora de 3 a 5 cm (5.4.3)");
    },
    notas: "Critérios da DNIT 075/2006-ES: a seção 6 remete o controle de acabamento e as inspeções aos projetos de engenharia e ambiental; os valores verificados vêm de 5.4. Concreto projetado: a espessura MÉDIA deve ficar entre 3 e 5 cm (não conforme se não); pontos isolados fora: ressalva. Grampos entre telas: a ES escreve \"espaçados de no mínimo de 30 cm\"; adotado como espaçamento máximo. Transpasse lateral e chumbadores: ressalva; transpasse longitudinal mínimo: não conformidade.",
    exemplos: [
      { nome: "Corte em solo residual — concreto projetado com tela (aceito)", dados: function () {
        var P = { area: "850", tecnica: "concreto", telacp: "sim" };
        return { ident: { registro: "AMB-075-01", data: "2026-05-05", obra: "Obra B", trecho: "BR-000 — km 40", local: "Corte LE, est. 510 a 522" },
          params: P, verificacoes: G.verif(C, P),
          espcp: G.vals([["Ponto 1", "3,8"], ["Ponto 2", "4,4"], ["Ponto 3", "4,1"], ["Ponto 4", "3,5"]]),
          malha: G.vals([["Rolo 1", "10"]]), fio: G.vals([["Rolo 1", "3,4"]]), chumb: G.vals([["Amostra", "30"]]) };
      } },
      { nome: "Corte em rocha fendilhada — tela metálica (rejeitado)", dados: function () {
        var P = { area: "1200", tecnica: "tela", telacp: "nao" };
        return { ident: { registro: "AMB-075-02", data: "2026-06-19", obra: "Obra C", trecho: "BR-000 — km 91", local: "Corte em rocha LD, est. 88 a 95" },
          params: P, verificacoes: G.verif(C, P),
          tlat: G.vals([["Emenda 1", "25"], ["Emenda 2", "18"]]), tlong: G.vals([["Emenda A", "40"]]),
          gramp: G.vals([["Emenda 1", "30"], ["Emenda A", "45"]]) };
      } },
    ],
  });
})();
