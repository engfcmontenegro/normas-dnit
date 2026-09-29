/*
 * Ficha de ES: DNIT 077/2006-ES — Cerca viva ou de tela para proteção da fauna — aceitação (A.fichaSimples via
 * FE.aceitacaoG11, definido em es-dnit-071-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11;

  var viva = function (P) { return P.tipo !== "tela"; };
  var tela = function (P) { return P.tipo !== "viva"; };
  var C = [
    { id: "especies", texto: "Cerca viva: sabiá-do-campo ou ora-pro-nóbis; produção, plantio e manutenção conforme DNIT 073/2006-ES e 076/2006-ES", secao: "5; 5.1.1; 5.4.1",
      grupo: "Cerca viva", tipo: "sim_nao", se: viva, naoAplicaPor: "só cerca de tela" },
    G.inspecoes("insp", "6", "Inspeções mensais da Fiscalização: germinação e crescimento; substituição das mudas doentes ou mortas", 30, viva, "Cerca viva"),
    G.mudasEst("6; 7 b; 8", function (P) { return viva(P) && G.etapa2(P); }),
    { id: "telamat", texto: "Telas de arame galvanizado e placas (concreto, fibra de vidro ou fibrocimento) conforme catálogos; malha em função das espécies cadastradas",
      secao: "3.2; 5.1.2", grupo: "Cerca de tela", tipo: "sim_nao", se: tela, naoAplicaPor: "só cerca viva" },
    { id: "prolong", texto: "Extensão da cerca para cada lado da passagem de fauna", secao: "5.4.2", grupo: "Cerca de tela", tipo: "valor", unid: "m", casas: 0, min: 100,
      falha: "ressalva", se: tela, naoAplicaPor: "só cerca viva", exigido: "≥ 100 m para cada lado (recomendado)",
      freq: { por: "contagem", qtd: function (P) { return 2 * (Number(String(P.passagens || "1").replace(",", ".")) || 1); }, a_cada: 1, regra: "2 por passagem de fauna (um de cada lado)" } },
    { id: "altura", texto: "Altura da cerca de tela", secao: "5.4.2", grupo: "Cerca de tela", tipo: "valor", unid: "m", casas: 2, min: 2.0, falha: "ressalva",
      se: tela, naoAplicaPor: "só cerca viva", exigido: "2 m (recomendado)", freq: G.lote() },
    { id: "malhainf", texto: "Malha nos 50 cm inferiores (ou placa pré-moldada h ≈ 30 cm)", secao: "5.4.2", grupo: "Cerca de tela", tipo: "valor", unid: "cm", casas: 1,
      max: 2.0, falha: "ressalva", se: tela, naoAplicaPor: "só cerca viva", exigido: "malha quadrada de 2,0 cm", freq: G.lote() },
    { id: "malhasup", texto: "Malha acima dos 50 cm inferiores", secao: "5.4.2", grupo: "Cerca de tela", tipo: "valor", unid: "cm", casas: 1,
      max: 10, falha: "ressalva", se: tela, naoAplicaPor: "só cerca viva", exigido: "malha de 10 cm", freq: G.lote() },
    { id: "limpeza", texto: "Limpeza das margens da rodovia (taludes dos aterros) para visibilidade dos motoristas", secao: "5.4.3", grupo: "Produto", tipo: "sim_nao" },
  ];

  A.fichaSimples({
    id: "dnit-077-2006-es",
    titulo: "Cerca viva ou de tela para proteção da fauna — aceitação",
    resumo: "Verificações da DNIT 077/2006-ES: cerca viva (espécies, inspeções mensais, mudas estabelecidas) e cerca de tela junto às passagens de fauna (100 m para cada lado, 2 m de altura, malha de 2,0 cm nos 50 cm inferiores e de 10 cm acima), limpeza das margens.",
    lote: { largura: false },
    params: [{ k: "tipo", r: "Tipo de cerca", tipo: "select", recarrega: true, opcoes: [["viva", "Cerca viva"], ["tela", "Cerca de tela"], ["ambas", "Cerca viva e de tela"]] },
      { k: "passagens", r: "Passagens de fauna no lote (nº)", se: tela }, G.ETAPA, G.paramMudas, G.paramDias],
    padrao: { tipo: "tela", passagens: "1", etapa: "1" },
    criterios: C,
    extra: G.extraMudas,
    notas: "Critérios da DNIT 077/2006-ES: a seção 6 prevê inspeções visuais mensais das cercas vivas e remete o controle das telas a \"normas específicas do DNIT\" (não identificadas); as dimensões da tela (5.4.2) são \"recomendadas\" e tratadas como ressalva. Plantio e manutenção da cerca viva conforme DNIT 073/2006-ES.",
    exemplos: [
      { nome: "Cerca de tela em passagem de fauna (aceita)", dados: function () {
        var P = { estIni: "200", estFim: "210", tipo: "tela", passagens: "1", etapa: "1" };
        return { ident: { registro: "AMB-077-01", data: "2026-03-25", obra: "Obra A", trecho: "BR-000 — corredor de fauna 1", local: "Passagem inferior na est. 205" },
          params: P, verificacoes: G.verif(C, P),
          prolong: G.vals([["Lado montante", "100", "", "200"], ["Lado jusante", "105", "", "210"]]),
          altura: G.vals([["Est. 202", "2,00", "", "202"], ["Est. 208", "2,02", "", "208"]]),
          malhainf: G.vals([["Est. 202", "2,0", "", "202"]]), malhasup: G.vals([["Est. 202", "10,0", "", "202"]]) };
      } },
      { nome: "Cerca viva + tela — tela curta e mudas mortas (ressalva)", dados: function () {
        var P = { estIni: "400", estFim: "408", tipo: "ambas", passagens: "1", etapa: "2", mudas: "300", dias: "100" };
        return { ident: { registro: "AMB-077-02", data: "2026-09-10", obra: "Obra B", trecho: "BR-000 — corredor de fauna 2", local: "Bueiro celular na est. 404" },
          params: P, verificacoes: G.verif(C, P, { insp: { real: "3" } }),
          estab: G.vals([["Contagem", "94", "", "404"]]),
          prolong: G.vals([["Lado montante", "100", "", "400"], ["Lado jusante", "70", "", "407+10"]]),
          altura: G.vals([["Est. 401", "1,80", "", "401"]]),
          malhainf: G.vals([["Est. 401", "5,0", "", "401"]]), malhasup: G.vals([["Est. 401", "10,0", "", "401"]]) };
      } },
    ],
  });
})();
